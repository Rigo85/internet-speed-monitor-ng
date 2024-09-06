// electron-api.d.ts
interface ElectronAPI {
	send(channel: string, payload: any[]): void;
	on(channel: string, listener: (event: any, ...args: any[]) => void): void;
}

interface Window {
	electronAPI: ElectronAPI;
}
