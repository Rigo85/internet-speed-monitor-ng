import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Logger rotation tests.
 *
 * Strategy: use a real temp directory so we can verify actual file operations
 * without mocking fs — rotation logic depends on rename/stat chains that are
 * easier to verify with real files.
 *
 * Each test gets a fresh module instance (vi.resetModules + dynamic import) so
 * the module-level state (logFilePath, installed, currentLogSize) is reset.
 * We also save/restore console manually because the logger patches it directly,
 * not via vi.spyOn, so vi.restoreAllMocks() alone is not enough.
 */

const LOG_MAX_FILES = 5; // must match logger.ts
const LOG_FILE_NAME = "app.log";

// Capture the originals before any test can patch them
const _origLog = console.log;
const _origInfo = console.info;
const _origWarn = console.warn;
const _origError = console.error;

let tmpDir: string;
let logFilePath: string;

beforeEach(() => {
	tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ism-logger-test-"));
	logFilePath = path.join(tmpDir, LOG_FILE_NAME);
	vi.resetModules();
});

afterEach(() => {
	// Restore console FIRST, before cleaning up directories,
	// so that any lingering patched console.log no longer references stale paths.
	console.log = _origLog;
	console.info = _origInfo;
	console.warn = _origWarn;
	console.error = _origError;

	fs.rmSync(tmpDir, {recursive: true, force: true});
});

async function freshLogger() {
	// vi.resetModules was already called in beforeEach;
	// dynamic import gives us a module with reset module-level state.
	const mod = await import("../../src-electron-app/logger");
	return mod;
}

describe("installLogger", () => {
	it("creates the log directory if it does not exist", async () => {
		const nestedDir = path.join(tmpDir, "sub", "logs");
		const {installLogger} = await freshLogger();

		installLogger(nestedDir);

		expect(fs.existsSync(nestedDir)).toBe(true);
	});

	it("creates the log file on first write", async () => {
		const {installLogger} = await freshLogger();
		installLogger(tmpDir);

		console.log("hello logger");

		expect(fs.existsSync(logFilePath)).toBe(true);
	});

	it("writes timestamped INFO entries for console.log", async () => {
		const {installLogger} = await freshLogger();
		installLogger(tmpDir);

		console.log("test message");

		const content = fs.readFileSync(logFilePath, "utf8");
		expect(content).toMatch(/\[INFO\] test message/);
		expect(content).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it("writes WARN entries for console.warn", async () => {
		const {installLogger} = await freshLogger();
		installLogger(tmpDir);

		console.warn("a warning");

		const content = fs.readFileSync(logFilePath, "utf8");
		expect(content).toMatch(/\[WARN\] a warning/);
	});

	it("writes INFO entries for console.info", async () => {
		const {installLogger} = await freshLogger();
		installLogger(tmpDir);

		console.info("info message");

		const content = fs.readFileSync(logFilePath, "utf8");
		expect(content).toMatch(/\[INFO\] info message/);
	});

	it("writes ERROR entries for console.error", async () => {
		const {installLogger} = await freshLogger();
		installLogger(tmpDir);

		console.error("something failed");

		const content = fs.readFileSync(logFilePath, "utf8");
		expect(content).toMatch(/\[ERROR\] something failed/);
	});
});

describe("log rotation", () => {
	// Use a small limit so tests don't write megabytes to disk
	const TEST_MAX_BYTES = 4 * 1024; // 4 KB
	const TEST_MAX_FILES = 3;

	it("rotates the log file when max size is exceeded", async () => {
		const {installLogger} = await freshLogger();
		installLogger(tmpDir, {maxBytes: TEST_MAX_BYTES, maxFiles: TEST_MAX_FILES});

		// Write slightly more than TEST_MAX_BYTES
		const chunk = "x".repeat(TEST_MAX_BYTES / 4);
		for (let i = 0; i < 6; i++) {
			console.log(chunk);
		}

		const rotated = `${logFilePath}.1`;
		expect(fs.existsSync(rotated)).toBe(true);
		expect(fs.statSync(logFilePath).size).toBeLessThan(TEST_MAX_BYTES);
	});

	it("does not accumulate more than maxFiles rotated files", async () => {
		const {installLogger} = await freshLogger();
		installLogger(tmpDir, {maxBytes: TEST_MAX_BYTES, maxFiles: TEST_MAX_FILES});

		// Force TEST_MAX_FILES + 3 rotations
		const chunk = "y".repeat(TEST_MAX_BYTES / 4);
		for (let rotation = 0; rotation < TEST_MAX_FILES + 3; rotation++) {
			for (let i = 0; i < 6; i++) {
				console.log(chunk);
			}
		}

		const tooMany = `${logFilePath}.${TEST_MAX_FILES + 1}`;
		expect(fs.existsSync(tooMany)).toBe(false);
	});
});
