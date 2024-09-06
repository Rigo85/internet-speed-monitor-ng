import { Injectable } from "@angular/core";

export interface ISpeedUpdate {
	time: string;
	downloadSpeed: string;
	uploadSpeed: string;
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
		window.electronAPI.send("reload", []);
	}

	quit() {
		window.electronAPI.send("close-app", []);
	}

	onSpeedUpdate(listener: (event: any, data: ISpeedUpdate) => void) {
		window.electronAPI.on("speed-update", listener);
	}

	speedHistory() {
		window.electronAPI.send("speed-history", []);
	}

	onHistoryData(listener: (event: any, data: any) => void) {
		window.electronAPI.on("speed-history-data", listener);
	}
}
