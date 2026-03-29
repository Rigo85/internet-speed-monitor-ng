import * as os from "os";
import * as path from "path";

export const APP_NAME = "Internet Speed Monitor";
export const APP_DATA_DIR_NAME = ".internet-speed-monitor";

export function getAppDataDir(): string {
	if (process.platform === "win32") {
		return path.join(process.env["APPDATA"] ?? os.homedir(), "internet-speed-monitor");
	}
	return path.join(os.homedir(), APP_DATA_DIR_NAME);
}

export function getDbPath(): string {
	return path.join(getAppDataDir(), "database.sqlite3");
}

export function getLogDir(): string {
	return path.join(getAppDataDir(), "logs");
}
