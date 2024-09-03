import { contextBridge, ipcRenderer } from "electron";

type AppListener = (event: Electron.IpcRendererEvent, ...args: any[]) => void;

contextBridge.exposeInMainWorld("electronAPI", {
	send: (channel: string, payload: any[]) => ipcRenderer.send(channel, payload),
	on: (channel: string, listener: AppListener) => ipcRenderer.on(channel, listener)
});
