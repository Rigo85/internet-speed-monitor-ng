import {app, BrowserWindow, dialog, ipcMain, shell} from "electron";
import * as path from "path";

import {createAppSettingsWindow, createHistoryWindow, createMainWindow} from "./browserWindowHelper";
import {registerDesktopEntry} from "./desktop-integration";
import {Settings} from "../core/Settings";
import {speedTest} from "../core/OoklaSpeedTester";
import {ISpeedTestResult} from "../core/headers";
import {formatSpeed, formatTime} from "./utils";
import {getPublicIp} from "../core/getIp";
import {IdentResponse} from "../core/headers";

const IP_PLACEHOLDER = "IP unavailable";
const COUNTRY_PLACEHOLDER = "Location unavailable";
const IP_RESOLVING_LABEL = "Resolving IP...";
const COUNTRY_RESOLVING_LABEL = "Resolving location...";
const MAX_CONSECUTIVE_MEASUREMENT_FAILURES = 10;
const IP_RETRY_TIMEOUT_MS = 3000;

export class ElectronApp {
	private static instance: ElectronApp;
	private mainWindow: BrowserWindow | undefined;
	private historyWindow: BrowserWindow | undefined;
	private appSettingsWindow: BrowserWindow | undefined;
	private readonly settings: Settings;
	private _intervalId: ReturnType<typeof setInterval> | undefined;
	private isRunningSpeedTest = false;
	private consecutiveMeasurementFailures = 0;

	constructor() {
		this.mainWindow = createMainWindow();
		this.historyWindow = createHistoryWindow(this.mainWindow);
		this.appSettingsWindow = createAppSettingsWindow(this.mainWindow);
		this.settings = Settings.getInstance();
	}

	static getInstance(): ElectronApp {
		if (!ElectronApp.instance) {
			ElectronApp.instance = new ElectronApp();
		}
		return ElectronApp.instance;
	}

	get MainWindow() { return this.mainWindow; }
	get HistoryWindow() { return this.historyWindow; }
	get Settings() { return this.settings; }

	async init(): Promise<void> {
		try {
			registerDesktopEntry();
			this.settings.initSettings();

			ipcMain.on("reload", this.reloadApp.bind(this));
			ipcMain.on("close-app", this.closeMainWindow.bind(this));
			ipcMain.on("speed-history", this.showHistoryWindow.bind(this));
			ipcMain.on("app-settings", this.showAppSettings.bind(this));
			ipcMain.on("update-refresh-time", this.updateRefreshTime.bind(this));
			ipcMain.on("app-info", this.onInfo.bind(this));
			ipcMain.on("open-result-url", this.openResultUrl.bind(this));

			this.mainWindow?.once("ready-to-show", () => {
				this.mainWindow?.show();
				this.scheduleRefresh();
			});
		} catch (e) {
			console.error("ElectronApp.init:", e);
		}
	}

	private getBinaryPath(): string {
		const ext = process.platform === "win32" ? ".exe" : "";
		const platform = process.platform === "win32" ? "win32" : "linux";
		if (app.isPackaged) {
			return path.join(process.resourcesPath, "ookla-speedtest", platform, `speedtest${ext}`);
		}
		return path.join(process.cwd(), "core", "ookla-speedtest", platform, `speedtest${ext}`);
	}

	private scheduleRefresh(): void {
		if (this._intervalId !== undefined) {
			clearInterval(this._intervalId);
		}
		const refreshTime = this.settings.getRefreshTime();
		console.info(`Scheduling speed test every ${refreshTime / 60000} min`);
		this._intervalId = setInterval(() => this.reloadApp(), refreshTime);
		this.reloadApp();
	}

	async onInfo(_event: unknown, _args: unknown): Promise<void> {
		shell.openExternal("https://github.com/Rigo85/internet-speed-monitor-ng")
			.catch(err => console.error("Error opening URL:", err));
	}

	async reloadApp(_event?: unknown, _args?: unknown): Promise<void> {
		if (this.isRunningSpeedTest) {
			console.warn("Skipping speed test because another run is still in progress.");
			this.sendStatus("A measurement is already in progress.", "warn");
			return;
		}

		this.isRunningSpeedTest = true;
		console.info("Running speed test...");
		try {
			const data = await speedTest(this.getBinaryPath());
			if (!data) {
				this.handleMeasurementFailure();
				return;
			}

			this.consecutiveMeasurementFailures = 0;
			this.sendStatus("Measurement updated.", "info");
			this.logging(data);
			this.notify(data);
			const recordId = this.saveOnDB(data);
			void this.enrichWithIpInfo(recordId, data);
		} catch (e) {
			console.error("reloadApp:", e);
			this.handleMeasurementFailure();
		} finally {
			this.isRunningSpeedTest = false;
		}
	}

	private logging(data: ISpeedTestResult): void {
		const ipLog = data.ipInfo
			? {IP: data.ipInfo.ip, Country: data.ipInfo.country}
			: {note: "No IP info available"};

		console.info("speed-update", JSON.stringify({
			time: formatTime(data.updateAt),
			downloadSpeed: formatSpeed(data.download.bandwidth),
			uploadSpeed: formatSpeed(data.upload.bandwidth),
			...ipLog
		}));
	}

	private notify(data: ISpeedTestResult): void {
		this.mainWindow?.webContents.send("speed-update", {
			time: formatTime(data.updateAt),
			downloadSpeed: formatSpeed(data.download.bandwidth),
			uploadSpeed: formatSpeed(data.upload.bandwidth),
			ip: data.ipInfo?.ip ?? IP_RESOLVING_LABEL,
			country: data.ipInfo?.country ?? COUNTRY_RESOLVING_LABEL
		});
	}

	private saveOnDB(data: ISpeedTestResult): number {
		return this.settings.addSpeedTest(JSON.stringify(data));
	}

	private showHistoryWindow(): void {
		this.historyWindow?.show();
		this.refreshHistoryWindow();
	}

	private showAppSettings(): void {
		this.appSettingsWindow?.show();
	}

	private closeMainWindow(event: Electron.IpcMainEvent): void {
		const buttons = {YES: 0, NO: 1};
		const window = BrowserWindow.getFocusedWindow();
		if (window && dialog.showMessageBoxSync(window, {
			type: "question",
			title: "Confirmation",
			message: "Are you sure you want to close the app?",
			buttons: ["Yes", "No"]
		}) === buttons.YES) {
			if (this._intervalId !== undefined) {
				clearInterval(this._intervalId);
				this._intervalId = undefined;
			}
			this.mainWindow?.destroy();
			this.historyWindow?.destroy();
			this.appSettingsWindow?.destroy();
			app.quit();
		} else {
			event.preventDefault();
		}
	}

	private updateRefreshTime(_event: unknown, value: number | undefined): void {
		console.info(`Updating refresh time to ${value ?? 0} min`);
		if (!value) return;
		this.settings.setRefreshTime(value * 60 * 1000);
		this.scheduleRefresh();
	}

	private async enrichWithIpInfo(recordId: number, data: ISpeedTestResult): Promise<void> {
		this.sendStatus("Resolving IP information...", "info");
		const ipInfo = await this.getPublicIpWithRetry();

		if (!ipInfo) {
			this.sendStatus("Measurement saved without IP information.", "warn");
			this.notify({
				...data,
				ipInfo: {
					ip: IP_PLACEHOLDER,
					country: COUNTRY_PLACEHOLDER
				}
			});
			return;
		}

		data.ipInfo = ipInfo;
		this.settings.updateSpeedTestIpInfo(recordId, JSON.stringify(ipInfo));
		this.notify(data);
		this.refreshHistoryWindow();
		this.sendStatus("", "info");
	}

	private async getPublicIpWithRetry(): Promise<IdentResponse | undefined> {
		for (let attempt = 1; attempt <= 2; attempt++) {
			const ipInfo = await getPublicIp(IP_RETRY_TIMEOUT_MS);
			if (ipInfo) {
				return ipInfo;
			}

			console.warn(`Public IP lookup attempt ${attempt} failed.`);
		}

		return undefined;
	}

	private refreshHistoryWindow(): void {
		if (!this.historyWindow || this.historyWindow.isDestroyed() || !this.historyWindow.isVisible()) {
			return;
		}

		const data = this.settings.getSpeedHistory();
		this.historyWindow.webContents.send("speed-history-data", data);
	}

	private sendStatus(message: string, level: "info" | "warn" | "error"): void {
		this.mainWindow?.webContents.send("main-status", {message, level});
	}

	private handleMeasurementFailure(): void {
		this.consecutiveMeasurementFailures += 1;
		const currentFailures = this.consecutiveMeasurementFailures;
		console.warn(`Speed measurement failed (${currentFailures}/${MAX_CONSECUTIVE_MEASUREMENT_FAILURES}).`);
		this.sendStatus(
			`Measurement failed (${currentFailures}/${MAX_CONSECUTIVE_MEASUREMENT_FAILURES}). Retrying on the next cycle.`,
			"warn"
		);

		if (currentFailures < MAX_CONSECUTIVE_MEASUREMENT_FAILURES) {
			return;
		}

		const response = dialog.showMessageBoxSync(this.mainWindow ?? undefined, {
			type: "warning",
			title: "Repeated measurement failures",
			message: "The app failed to obtain a speed measurement 10 times in a row.",
			detail: "Do you want to close the app? Choose No to keep it running and reset the failure counter.",
			buttons: ["Yes", "No"],
			defaultId: 1,
			cancelId: 1
		});

		if (response === 0) {
			app.quit();
			return;
		}

		this.consecutiveMeasurementFailures = 0;
		this.sendStatus("Failure counter reset. Keeping the last successful measurement visible.", "warn");
	}

	private openResultUrl(_event: unknown, url: string | undefined): void {
		if (!url || !/^https?:\/\//i.test(url)) {
			console.warn("Rejected invalid result URL:", url);
			return;
		}

		shell.openExternal(url).catch(err => console.error("Error opening result URL:", err));
	}
}
