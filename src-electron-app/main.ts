import {app} from "electron";

// Disable the Chromium sandbox when it cannot work:
//   - Running as root: Chrome refuses to run sandboxed as root.
//   - Running as AppImage: the SUID sandbox helper (chrome-sandbox) is inside a
//     read-only FUSE mount and cannot have the required root ownership / mode 4755.
//     Combined with AppArmor restricting unprivileged user namespaces, Chromium has
//     no viable sandbox backend and crashes at startup.
if (process.platform !== "win32" && (process.getuid?.() === 0 || process.env["APPIMAGE"])) {
	app.commandLine.appendSwitch("no-sandbox");
}

import {installLogger} from "./logger";
import {getLogDir} from "../shared/constants";

installLogger(getLogDir());

import {ElectronApp} from "./ElectronApp";

app.whenReady().then(() => {
	ElectronApp.getInstance().init()
		.catch(e => console.error("Electron App init:", e));
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
