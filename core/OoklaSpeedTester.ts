import {spawn} from "child_process";
import {ISpeedTestResult} from "./headers";

const SPEEDTEST_TIMEOUT_MS = 120000;

/**
 * Runs the Ookla speedtest CLI and resolves with the parsed result.
 *
 * @param binaryPath Absolute path to the speedtest binary.
 *   In development: process.cwd()/core/ookla-speedtest/{platform}/speedtest[.exe]
 *   When packaged:  process.resourcesPath/ookla-speedtest/{platform}/speedtest[.exe]
 */
export function speedTest(binaryPath: string): Promise<ISpeedTestResult | undefined> {
	return new Promise((resolve) => {
		let stdout = "";
		let stderr = "";
		let settled = false;

		const child = spawn(binaryPath, ["-f", "json", "--accept-license"], {
			stdio: ["ignore", "pipe", "pipe"]
		});

		const finalize = (result: ISpeedTestResult | undefined): void => {
			if (settled) return;
			settled = true;
			clearTimeout(timeoutId);
			resolve(result);
		};

		const timeoutId = setTimeout(() => {
			console.error(`speedTest timed out after ${SPEEDTEST_TIMEOUT_MS} ms`);
			child.kill();
			finalize(undefined);
		}, SPEEDTEST_TIMEOUT_MS);

		child.stdout.on("data", (chunk: Buffer) => {
			stdout += chunk.toString();
		});

		child.stderr.on("data", (chunk: Buffer) => {
			stderr += chunk.toString();
		});

		child.on("close", (code: number | null) => {
			if (stderr) {
				console.info("speedTest stderr:", stderr.trim());
			}

			if (code !== 0) {
				console.error(`speedTest exited with code ${code}`);
				finalize(undefined);
				return;
			}

			try {
				const result = JSON.parse(stdout);
				finalize(result.type === "result"
					? {...result, updateAt: new Date()}
					: undefined
				);
			} catch (e) {
				console.error("speedTest JSON parse error:", e, "\nraw stdout:", stdout.slice(0, 200));
				finalize(undefined);
			}
		});

		child.on("error", (e: Error) => {
			console.error("speedTest process error:", e);
			finalize(undefined);
		});
	});
}
