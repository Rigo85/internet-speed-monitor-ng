interface SpeedUpdatePayload {
	time: string;
	downloadSpeed: string;
	uploadSpeed: string;
	ip: string;
	country: string;
}

interface MainStatusPayload {
	message: string;
	level: "info" | "warn" | "error";
}

interface ElectronAPI {
	reload(): void;
	closeApp(): void;
	openHistory(): void;
	openSettings(): void;
	openInfo(): void;
	updateRefreshTime(value: number): void;
	openResultUrl(url: string): void;
	onSpeedUpdate(listener: (event: any, data: SpeedUpdatePayload) => void): void;
	onHistoryData(listener: (event: any, data: any[]) => void): void;
	onToggleButton(listener: (event: any, data: string) => void): void;
	onSettingsData(listener: (event: any, data: any) => void): void;
	onMainStatus(listener: (event: any, data: MainStatusPayload) => void): void;
}

interface Window {
	electronAPI: ElectronAPI;
}
