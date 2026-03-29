import {contextBridge, ipcRenderer} from "electron";

type AppListener<T = unknown> = (event: Electron.IpcRendererEvent, data: T) => void;

contextBridge.exposeInMainWorld("electronAPI", {
	reload: () => ipcRenderer.send("reload"),
	closeApp: () => ipcRenderer.send("close-app"),
	openHistory: () => ipcRenderer.send("speed-history"),
	openSettings: () => ipcRenderer.send("app-settings"),
	openInfo: () => ipcRenderer.send("app-info"),
	updateRefreshTime: (value: number) => ipcRenderer.send("update-refresh-time", value),
	openResultUrl: (url: string) => ipcRenderer.send("open-result-url", url),
	onSpeedUpdate: (listener: AppListener) => ipcRenderer.on("speed-update", listener),
	onHistoryData: (listener: AppListener) => ipcRenderer.on("speed-history-data", listener),
	onToggleButton: (listener: AppListener<string>) => ipcRenderer.on("toggle-button", listener),
	onSettingsData: (listener: AppListener) => ipcRenderer.on("settings-data", listener),
	onMainStatus: (listener: AppListener) => ipcRenderer.on("main-status", listener)
});
