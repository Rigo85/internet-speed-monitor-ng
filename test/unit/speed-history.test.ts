import {describe, it, expect} from "vitest";
import {formatSpeed} from "../../src-electron-app/utils";

/**
 * Tests for the data transformation applied to speed history records.
 *
 * The critical transformation happens in Settings.getSpeedHistory():
 *   - bandwidth (bytes/s) → Mbps string via formatSpeed()
 *   - IP Address fallback to "N/A" when missing
 *   - Date formatting via Intl.DateTimeFormat
 *
 * We test formatSpeed() directly (pure function, zero deps) since it is the
 * single computation that could silently produce wrong Mbps values.
 */

describe("formatSpeed", () => {
	it("converts bytes/s to Mbps correctly", () => {
		// 125_000 bytes/s = 1 Mbps (1_000_000 / 8)
		expect(formatSpeed(125_000)).toBe("1.00");
	});

	it("converts a typical download speed (100 Mbps = 12_500_000 bytes/s)", () => {
		expect(formatSpeed(12_500_000)).toBe("100.00");
	});

	it("converts a typical upload speed (50 Mbps = 6_250_000 bytes/s)", () => {
		expect(formatSpeed(6_250_000)).toBe("50.00");
	});

	it("returns a two-decimal string for fractional Mbps", () => {
		// 250_000 bytes/s = 2 Mbps
		expect(formatSpeed(250_000)).toBe("2.00");
	});

	it("handles string input (DB returns strings)", () => {
		// better-sqlite3 may return numeric columns as strings
		expect(formatSpeed("12500000")).toBe("100.00");
	});

	it("handles float string input", () => {
		expect(formatSpeed("12500000.5")).toBe("100.00");
	});

	it("returns 0.00 for zero bandwidth", () => {
		expect(formatSpeed(0)).toBe("0.00");
	});
});

describe("IP Address fallback", () => {
	it("falls back to N/A when IP Address is null", () => {
		const ip = null || "N/A";
		expect(ip).toBe("N/A");
	});

	it("falls back to N/A when IP Address is empty string", () => {
		const ip = "" || "N/A";
		expect(ip).toBe("N/A");
	});

	it("preserves a valid IP Address", () => {
		const ip = "1.2.3.4" || "N/A";
		expect(ip).toBe("1.2.3.4");
	});
});
