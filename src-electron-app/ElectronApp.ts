import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";

import { createAppSettingsWindow, createHistoryWindow, createMainWindow } from "./browserWindowHelper";
import { Settings } from "../core/Settings";
import { speedTest } from "../core/OoklaSpeedTester";
import { ISpeedTestResult } from "../core/headers";
import { formatSpeed, formatTime } from "./utils";
import { getPublicIp } from "../core/getIp";

export class ElectronApp {
	private static instance: ElectronApp;
	private mainWindow: BrowserWindow | undefined;
	private historyWindow: BrowserWindow | undefined;
	private readonly settings: Settings;
	private appSettingsWindow: BrowserWindow | undefined;

	constructor() {
		this.mainWindow = createMainWindow();
		this.historyWindow = createHistoryWindow(this.mainWindow);
		this.appSettingsWindow = createAppSettingsWindow(this.mainWindow);
		this.settings = Settings.getInstance();
	}

	static getInstance() {
		if (!ElectronApp.instance) {
			ElectronApp.instance = new ElectronApp();
		}
		return ElectronApp.instance;
	}

	get MainWindow() {
		return this.mainWindow;
	}

	get HistoryWindow() {
		return this.historyWindow;
	}

	get Settings() {
		return this.settings;
	}

	async init() {
		try {
			await this.settings.initSettings();

			ipcMain.on("reload", this.reloadApp.bind(this));
			ipcMain.on("close-app", this.closeMainWindow.bind(this));
			ipcMain.on("speed-history", this.showHistoryWindow.bind(this));
			ipcMain.on("app-settings", this.showAppSettings.bind(this));
			ipcMain.on("update-refresh-time", this.updateRefreshTime.bind(this));
			ipcMain.on("app-info", this.onInfo.bind(this));

			this.mainWindow?.once("ready-to-show", () => {
				this.mainWindow?.show();
				this.refreshApp();
			});
		} catch (e) {
			console.error("Electron App init:", e);
		}
	}

	private async refreshApp() {
		try {
			const dbSettings = await this.settings.getSettings();
			if (!dbSettings) return;
			if (dbSettings.intervalId) {
				clearInterval(dbSettings.intervalId);
				await this.settings.setIntervalId(0);
			}
			console.info(`creating reload every ${dbSettings.refreshTime / 60000} min`);
			const intervalId = setInterval(() => this.reloadApp(), dbSettings.refreshTime);
			console.info(`interval id: ${intervalId}`);
			await this.settings.setIntervalId(intervalId[Symbol.toPrimitive]());
		} catch (e) {
			console.error("refreshApp", e);
		}
	}

	async onInfo(event: any, args: any) {
		shell.openExternal("https://github.com/Rigo85/internet-speed-monitor-ng")
			.then(() => {
				console.log("URL opened successfully.");
			})
			.catch(err => {
				console.error("Error opening URL:", err);
			});
	}

	async reloadApp(event?: any, args?: any, consumers = [this.logging.bind(this), this.notify.bind(this), this.saveOnDB.bind(this)]) {
		console.info("reloading...");
		try {
			const [data, ipInfo] = await Promise.all([speedTest(), getPublicIp()]);
			if (!data) return;
			data.ipInfo = ipInfo;
			consumers.forEach(consumer => consumer(data));
		} catch (e) {
			console.error("reloadApp", e);
			dialog.showErrorBox("Error", "Error testing internet speed.");
		}
	}

	private logging(data: ISpeedTestResult) {
		const ipLog = data.ipInfo ? {
			IP: data.ipInfo.ip,
			City: (data.ipInfo as any).city,
			Country: data.ipInfo.country
		} : {note: "No IP info available"};

		const log = {
			time: formatTime(data.updateAt),
			downloadSpeed: formatSpeed(data.download.bandwidth),
			uploadSpeed: formatSpeed(data.upload.bandwidth),
			...ipLog
		};

		console.info("speed-update", JSON.stringify(log));
	}

	private notify(data: ISpeedTestResult) {
		this.mainWindow?.webContents.send(
			"speed-update",
			{
				time: formatTime(data.updateAt),
				downloadSpeed: formatSpeed(data.download.bandwidth),
				uploadSpeed: formatSpeed(data.upload.bandwidth),
				ip: data.ipInfo?.ip,
				country: data.ipInfo?.country
			});
	}

	private saveOnDB(data: ISpeedTestResult) {
		this.settings?.addSpeedTest(JSON.stringify(data));
	}

	private showHistoryWindow() {
		this.historyWindow?.show();
	}

	private showAppSettings() {
		this.appSettingsWindow?.show();
	}

	private closeMainWindow(event: any) {
		if (process.platform !== "darwin") {
			const buttons = {YES: 0, NO: 1};
			const window = BrowserWindow.getFocusedWindow();
			if (window && dialog.showMessageBoxSync(window, {
				type: "question",
				title: "Confirmation",
				message: "Are you sure you want to close the app?",
				buttons: ["Yes", "No"]
			}) === buttons.YES) {
				if (this.mainWindow) {
					this.mainWindow.destroy();
					this.mainWindow = undefined;
				}
				if (this.historyWindow) {
					this.historyWindow.destroy();
					this.historyWindow = undefined;
				}
				if (this.appSettingsWindow) {
					this.appSettingsWindow.destroy();
					this.appSettingsWindow = undefined;
				}
				(this.settings as any) = undefined;
				app.quit();
			} else {
				event.preventDefault();
			}
		}
	}

	private async updateRefreshTime(event: any, value: any) {
		console.info(`update refresh time: ${value || 0}`);
		try {
			const dbSettings = await this.settings.getSettings();
			if (!dbSettings || !value) return;

			await this.settings.setRefreshTime(value * 60 * 1000);
			await this.refreshApp();
		} catch (e) {
			console.error("updateRefreshTime", e);
		}
	}
}
