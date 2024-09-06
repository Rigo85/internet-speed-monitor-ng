import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as log from "electron-log";

Object.assign(console, log.functions);

import { ISpeedTestResult, speedTest } from "../core/OoklaSpeedTester";
import { Settings } from "../core/Settings";
import { createHistoryWindow, createMainWindow } from "./browserWindowHelper";
import { formatSpeed, formatTime } from "./utils";

let mainWindow: BrowserWindow | undefined;
let historyWindow: BrowserWindow | undefined;
let settings = Settings.getInstance();

app.whenReady().then(() => {
	settings.initSettings().then(() => {
		mainWindow = createMainWindow();
		historyWindow = createHistoryWindow(mainWindow);

		ipcMain.on("reload", reloadApp);
		ipcMain.on("close-app", closeMainWindow);
		ipcMain.on("speed-history", showHistoryWindow);

		mainWindow?.once("ready-to-show", () => {
			mainWindow?.show();
			refreshApp();
		});
	}).catch(e => console.error("initSettings", e));
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

async function refreshApp() {
	try {
		const dbSettings = await settings.getSettings();
		if (!dbSettings) return;
		if (dbSettings.intervalId) {
			clearInterval(dbSettings.intervalId);
			await settings.setIntervalId(0);
		}
		console.info(`creating reload every ${dbSettings.refreshTime / 60000} min`);
		const intervalId = setInterval(() => reloadApp(), dbSettings.refreshTime);
		console.info(`interval id: ${intervalId}`);
		await settings.setIntervalId(intervalId as unknown as number);
	} catch (e) {
		console.error("refreshApp", e);
	}
}

async function reloadApp(event?: any, args?: any, consumers = [logging, notify, saveOnDB]) {
	console.info("reloading...");
	try {
		const data = await speedTest();
		if (!data) return;
		consumers.forEach(consumer => consumer(data));
	} catch (e) {
		console.error("reloadApp", e);
		dialog.showErrorBox("Error", "Error testing internet speed.");
	}
}

function logging(data: ISpeedTestResult) {
	console.info("speed-update", JSON.stringify({
		time: formatTime(data.updateAt),
		downloadSpeed: formatSpeed(data.download.bandwidth),
		uploadSpeed: formatSpeed(data.upload.bandwidth)
	}));
}

function notify(data: ISpeedTestResult) {
	mainWindow?.webContents.send(
		"speed-update",
		{
			time: formatTime(data.updateAt),
			downloadSpeed: formatSpeed(data.download.bandwidth),
			uploadSpeed: formatSpeed(data.upload.bandwidth)
		});
}

function saveOnDB(data: ISpeedTestResult) {
	settings?.addSpeedTest(JSON.stringify(data));
}

function showHistoryWindow() {
	historyWindow?.show();
}

function closeMainWindow(event: any) {
	if (process.platform !== "darwin") {
		const buttons = {YES: 0, NO: 1};
		const window = BrowserWindow.getFocusedWindow();
		if (window && dialog.showMessageBoxSync(window, {
			type: "question",
			title: "Confirmation",
			message: "Are you sure you want to close the app?",
			buttons: ["Yes", "No"]
		}) === buttons.YES) {
			if (mainWindow) {
				mainWindow.destroy();
				mainWindow = undefined;
			}
			if (historyWindow) {
				historyWindow.destroy();
				historyWindow = undefined;
			}
			(settings as any) = undefined;
			app.quit();
		} else {
			event.preventDefault();
		}
	}
}
