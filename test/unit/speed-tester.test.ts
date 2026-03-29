import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {EventEmitter} from "events";

// Mock child_process before importing the module under test
vi.mock("child_process", () => ({
	spawn: vi.fn()
}));

import {speedTest} from "../../core/OoklaSpeedTester";
import {spawn} from "child_process";

const VALID_RESULT = {
	type: "result",
	timestamp: "2024-01-01T00:00:00Z",
	ping: {jitter: 1.2, latency: 15.5, low: 14.0, high: 18.0},
	download: {bandwidth: 12500000, bytes: 100000000, elapsed: 8000, latency: {iqm: 10, low: 8, high: 15, jitter: 2}},
	upload: {bandwidth: 6250000, bytes: 50000000, elapsed: 8000, latency: {iqm: 12, low: 10, high: 18, jitter: 3}},
	isp: "Test ISP",
	interface: {internalIp: "192.168.1.1", name: "eth0", macAddr: "00:00:00:00:00:00", isVpn: false, externalIp: "1.2.3.4"},
	server: {id: 1, host: "test.host", port: 8080, name: "Test Server", location: "Test City", country: "TC", ip: "5.6.7.8"},
	result: {id: "abc123", url: "https://www.speedtest.net/result/abc123", persisted: true}
};

function makeChild(stdout: string, stderr: string, exitCode: number | null, spawnError?: Error) {
	const child = new EventEmitter() as any;
	child.stdout = new EventEmitter();
	child.stderr = new EventEmitter();

	process.nextTick(() => {
		if (spawnError) {
			child.emit("error", spawnError);
			return;
		}
		if (stdout) child.stdout.emit("data", Buffer.from(stdout));
		if (stderr) child.stderr.emit("data", Buffer.from(stderr));
		child.emit("close", exitCode);
	});

	return child;
}

describe("speedTest", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("parses a valid speedtest result correctly", async () => {
		vi.mocked(spawn).mockReturnValue(makeChild(JSON.stringify(VALID_RESULT), "", 0) as any);

		const result = await speedTest("/fake/speedtest");

		expect(result).not.toBeUndefined();
		expect(result!.type).toBe("result");
		expect(result!.download.bandwidth).toBe(12500000);
		expect(result!.upload.bandwidth).toBe(6250000);
		expect(result!.isp).toBe("Test ISP");
		expect(result!.updateAt).toBeInstanceOf(Date);
	});

	it("returns undefined when exit code is non-zero", async () => {
		vi.mocked(spawn).mockReturnValue(makeChild("", "binary error", 1) as any);

		const result = await speedTest("/fake/speedtest");

		expect(result).toBeUndefined();
	});

	it("returns undefined when stdout is not valid JSON", async () => {
		vi.mocked(spawn).mockReturnValue(makeChild("not-json-at-all", "", 0) as any);

		const result = await speedTest("/fake/speedtest");

		expect(result).toBeUndefined();
	});

	it("returns undefined when result type is not 'result'", async () => {
		const testPacket = {...VALID_RESULT, type: "testStart"};
		vi.mocked(spawn).mockReturnValue(makeChild(JSON.stringify(testPacket), "", 0) as any);

		const result = await speedTest("/fake/speedtest");

		expect(result).toBeUndefined();
	});

	it("returns undefined when spawn emits an error (binary not found)", async () => {
		vi.mocked(spawn).mockReturnValue(
			makeChild("", "", null, new Error("ENOENT: binary not found")) as any
		);

		const result = await speedTest("/non/existent/speedtest");

		expect(result).toBeUndefined();
	});

	it("does NOT return undefined when stderr has content but exit code is 0", async () => {
		// speedtest commonly writes progress info to stderr even on success
		vi.mocked(spawn).mockReturnValue(
			makeChild(JSON.stringify(VALID_RESULT), "some progress info", 0) as any
		);

		const result = await speedTest("/fake/speedtest");

		expect(result).not.toBeUndefined();
		expect(result!.type).toBe("result");
	});

	it("invokes the binary with -f json and --accept-license flags", async () => {
		vi.mocked(spawn).mockReturnValue(makeChild(JSON.stringify(VALID_RESULT), "", 0) as any);

		await speedTest("/fake/speedtest");

		expect(spawn).toHaveBeenCalledWith(
			"/fake/speedtest",
			["-f", "json", "--accept-license"],
			expect.objectContaining({stdio: ["ignore", "pipe", "pipe"]})
		);
	});
});
