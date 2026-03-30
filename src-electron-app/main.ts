import {app} from "electron";
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
