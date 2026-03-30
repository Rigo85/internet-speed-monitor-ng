import {execFile} from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {app} from "electron";

const DESKTOP_ID = "internet-speed-monitor";
const DESKTOP_FILE = path.join(
	os.homedir(), ".local", "share", "applications", `${DESKTOP_ID}.desktop`
);
const ICON_DIR = path.join(
	os.homedir(), ".local", "share", "icons", "hicolor", "1024x1024", "apps"
);
const ICON_FILE = path.join(ICON_DIR, `${DESKTOP_ID}.png`);

function runSilently(cmd: string, args: string[]): void {
	execFile(cmd, args, {timeout: 5000}, () => {/* fire and forget */});
}

function escapeDesktopExec(value: string): string {
	return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

/**
 * Creates the .desktop launcher and installs the app icon on Linux when running
 * as a packaged AppImage. Idempotent — safe to call on every launch.
 * Does nothing on Windows or in development mode.
 */
export function registerDesktopEntry(): void {
	if (process.platform !== "linux" || !process.env["APPIMAGE"]) return;

	try {
		const exePath = process.env["APPIMAGE"];
		const iconSrc = path.join(process.resourcesPath, "icon.png");

		fs.mkdirSync(ICON_DIR, {recursive: true});
		fs.copyFileSync(iconSrc, ICON_FILE);

		fs.mkdirSync(path.dirname(DESKTOP_FILE), {recursive: true});
		const desktopContent = [
			"[Desktop Entry]",
			"Version=1.0",
			"Type=Application",
			"Name=Internet Speed Monitor",
			"Comment=Monitor your internet speed using the Ookla Speedtest CLI",
			`Exec=${escapeDesktopExec(exePath)} %U`,
			`Icon=${ICON_FILE}`,
			"StartupWMClass=Internet Speed Monitor",
			"Categories=Network;Monitor;",
			"StartupNotify=true",
			"Terminal=false",
		].join("\n") + "\n";

		fs.writeFileSync(DESKTOP_FILE, desktopContent, {encoding: "utf8", mode: 0o755});
		runSilently("gio", ["set", DESKTOP_FILE, "metadata::trusted", "true"]);

		runSilently("update-desktop-database", [path.dirname(DESKTOP_FILE)]);
		runSilently("gtk-update-icon-cache", [
			"-f", "-t",
			path.join(os.homedir(), ".local", "share", "icons", "hicolor")
		]);

		console.log("Desktop entry registered.");
	} catch (e) {
		console.warn("Desktop registration failed (non-fatal):", e);
	}
}
