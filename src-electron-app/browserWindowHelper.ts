import { BrowserWindow, screen } from "electron";
import path from "path";
import { config } from "dotenv";
import { Settings } from "../core/Settings";
import { ElectronApp } from "./ElectronApp";

config({path: ".env"});

const devTools = /true/i.test(process.env["DEV_TOOLS"] || "false");

export type Pair<T> = [T, T];

export interface ElectronAppBrowserWindowOptions {
	size: Record<string, Pair<number>> & { default: Pair<number> };
	icon: Record<string, string> & { default: string };
	frame: boolean;
	transparent: boolean;
	parent?: BrowserWindow;
	route: string;
	onShow?: (window: BrowserWindow, event: any) => void;
	onClose?: (window: BrowserWindow, event: any) => void;
	devTools: boolean;
	alwaysOnTop: boolean;
	resizable: boolean;
	show: boolean;
}

export function createWindow(eabwo: ElectronAppBrowserWindowOptions): BrowserWindow {
	const monitor = screen.getPrimaryDisplay();
	const {x, y, height, width} = monitor.bounds;
	const icon = eabwo.icon[process.platform] || eabwo.icon["default"];
	const size = eabwo.size[process.platform] || eabwo.size["default"];
	const _width = size[0];
	const _height = size[1];

	const window = new BrowserWindow({
		width: _width,
		height: _height,
		x: x + Math.trunc(width / 2) - Math.trunc(_width / 2),
		y: y + Math.trunc(height / 2) - Math.trunc(_height / 2),
		frame: eabwo.frame,
		transparent: eabwo.transparent,
		parent: eabwo.parent,
		show: eabwo.show,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: true,
			contextIsolation: true
		}
	});

	const route = eabwo.route ? `#/${eabwo.route}` : "";

	window.loadURL(
		`file://${path.join(__dirname, "..", "..", "dist", "internet-speed-monitor-ng", "browser", "index.html")}${route}`
	);

	window.removeMenu();
	window.setAlwaysOnTop(eabwo.alwaysOnTop);
	window.setResizable(eabwo.resizable);
	window.setIcon(icon);

	(window as any).on("show", (event: any) => {
		if (eabwo.onShow) {
			eabwo.onShow(window, event);
		}
	});

	window.on("close", (event: any) => {
		if (eabwo.onClose) {
			eabwo.onClose(window, event);
		}
	});

	return window;
}

export function createMainWindow(): BrowserWindow {
	const size = {
		"darwin": [400, 260],
		"win32": [400, 300],
		"default": [400, 300]
	} as Record<string, Pair<number>> & { default: Pair<number> };

	const icon = {
		"darwin": "./public/icon.icns",
		"win32": "./public/icon.ico",
		"default": "./public/icon.png"
	} as Record<string, string> & { default: string };

	return createWindow({
		size,
		icon,
		frame: false,
		transparent: true,
		route: "",
		devTools,
		alwaysOnTop: true,
		resizable: false,
		show: false,
		onShow: (window: BrowserWindow, event: any) => {
			if (devTools) {
				window.webContents.openDevTools();
			}
		}
	});
}

export function createHistoryWindow(parent: BrowserWindow): BrowserWindow {
	const size = {
		"default": [1050, 496]
	} as Record<string, Pair<number>> & { default: Pair<number> };

	const icon = {
		"darwin": "./public/icon.icns",
		"win32": "./public/icon.ico",
		"default": "./public/icon.png"
	} as Record<string, string> & { default: string };

	return createWindow({
		size,
		icon,
		frame: true,
		transparent: false,
		parent,
		route: "history",
		devTools,
		alwaysOnTop: false,
		resizable: true,
		show: false,
		onShow: onShowHistoryWindow,
		onClose: (window: BrowserWindow, event: any) => {
			ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "history");
			event.preventDefault();
			window.webContents.closeDevTools();
			window.hide();
		}
	});
}

async function onShowHistoryWindow(window: BrowserWindow, event: any) {
	if (devTools) {
		window.webContents.openDevTools();
	}

	try {
		ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "history");
		const data = await Settings.getInstance().getSpeedHistory();
		window.webContents.send("speed-history-data", data);
	} catch (e) {
		console.error("onShowHistoryWindow", e);
		ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "history");
	}
}

export function createAppSettingsWindow(parent: BrowserWindow): BrowserWindow {
	const size = {
		"default": [300, 300]
	} as Record<string, Pair<number>> & { default: Pair<number> };

	const icon = {
		"darwin": "./public/icon.icns",
		"win32": "./public/icon.ico",
		"default": "./public/icon.png"
	} as Record<string, string> & { default: string };

	return createWindow({
		size,
		icon,
		frame: true,
		transparent: false,
		parent,
		route: "settings",
		devTools,
		alwaysOnTop: false,
		resizable: false,
		show: false,
		onShow: async (window: BrowserWindow, event: any) => {
			if (devTools) {
				window.webContents.openDevTools();
			}

			try {
				ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "settings");
				const dbSettings = await Settings.getInstance().getSettings();
				window.webContents.send("settings-data", dbSettings);
			} catch (e) {
				console.error("onShowAppSettingsWindow", e);
			}
		},
		onClose: (window: BrowserWindow, event: any) => {
			ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "settings");
			event.preventDefault();
			window.webContents.closeDevTools();
			window.hide();
		}
	});
}
