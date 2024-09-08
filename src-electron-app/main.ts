import { app } from "electron";
import * as log from "electron-log";

Object.assign(console, log.functions);

import { ElectronApp } from "./ElectronApp";

app.whenReady().then(() => {
	ElectronApp.getInstance().init()
		.catch(e => console.error("Electron App init:", e))
	;
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
