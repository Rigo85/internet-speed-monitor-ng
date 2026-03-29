import { Injectable } from "@angular/core";

export interface ISpeedUpdate {
	time: string;
	downloadSpeed: string;
	uploadSpeed: string;
	ip: string;
	country: string;
}

export interface IMainStatus {
	message: string;
	level: "info" | "warn" | "error";
}

@Injectable({
	providedIn: "root"
})
export class ElectronService {

	constructor() {
		if (!window.electronAPI) {
			throw new Error("Electron API no se puede cargar.");
		}
	}

	reload() {
		window.electronAPI.reload();
	}

	quit() {
		window.electronAPI.closeApp();
	}

	onSpeedUpdate(listener: (event: any, data: ISpeedUpdate) => void) {
		window.electronAPI.onSpeedUpdate(listener);
	}

	speedHistory() {
		window.electronAPI.openHistory();
	}

	onHistoryData(listener: (event: any, data: any) => void) {
		window.electronAPI.onHistoryData(listener);
	}

	onToggleButton(listener: (event: any, data: any) => void) {
		window.electronAPI.onToggleButton(listener);
	}

	appSettings() {
		window.electronAPI.openSettings();
	}

	onAppInfo() {
		window.electronAPI.openInfo();
	}

	onSettingsData(listener: (event: any, data: any) => void) {
		window.electronAPI.onSettingsData(listener);
	}

	updateRefreshTime(data: number) {
		window.electronAPI.updateRefreshTime(data);
	}

	openResultUrl(url: string) {
		window.electronAPI.openResultUrl(url);
	}

	onMainStatus(listener: (event: any, data: IMainStatus) => void) {
		window.electronAPI.onMainStatus(listener);
	}
}
