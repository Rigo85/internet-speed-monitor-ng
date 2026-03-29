import {app} from "electron";

// Disable the Chromium sandbox when running as root (required by Chrome/Electron).
// On standard user accounts the sandbox runs normally without this flag.
if (process.platform !== "win32" && process.getuid?.() === 0) {
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
