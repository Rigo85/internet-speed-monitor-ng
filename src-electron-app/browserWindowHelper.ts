import {app, BrowserWindow, screen, shell} from "electron";
import * as path from "path";
import {Settings} from "../core/Settings";
import {ElectronApp} from "./ElectronApp";

const devTools = /true/i.test(process.env["DEV_TOOLS"] ?? "false");

export type Pair<T> = [T, T];

export interface ElectronAppBrowserWindowOptions {
	size: Record<string, Pair<number>> & { default: Pair<number> };
	iconFile: string;
	frame: boolean;
	transparent: boolean;
	parent?: BrowserWindow;
	route: string;
	onShow?: (window: BrowserWindow, event: unknown) => void;
	onClose?: (window: BrowserWindow, event: Electron.Event) => void;
	devTools: boolean;
	alwaysOnTop: boolean;
	resizable: boolean;
	show: boolean;
}

function getIconPath(filename: string): string {
	if (app.isPackaged) {
		return path.join(process.resourcesPath, filename);
	}
	return path.join(app.getAppPath(), "public", filename);
}

function platformIcon(): string {
	return process.platform === "win32" ? "icon.ico" : "icon.png";
}

function isSafeExternalUrl(url: string): boolean {
	return /^https?:\/\//i.test(url);
}

export function createWindow(opts: ElectronAppBrowserWindowOptions): BrowserWindow {
	const monitor = screen.getPrimaryDisplay();
	const {x, y, height, width} = monitor.bounds;
	const [_width, _height] = opts.size[process.platform] ?? opts.size["default"];
	const iconPath = getIconPath(opts.iconFile);

	const window = new BrowserWindow({
		width: _width,
		height: _height,
		x: x + Math.trunc(width / 2) - Math.trunc(_width / 2),
		y: y + Math.trunc(height / 2) - Math.trunc(_height / 2),
		frame: opts.frame,
		transparent: opts.transparent,
		parent: opts.parent,
		show: opts.show,
		icon: iconPath,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});

	const route = opts.route ? `#/${opts.route}` : "";
	window.loadURL(
		`file://${path.join(__dirname, "..", "..", "dist", "internet-speed-monitor-ng", "browser", "index.html")}${route}`
	);

	window.removeMenu();
	window.setAlwaysOnTop(opts.alwaysOnTop);
	window.setResizable(opts.resizable);
	window.webContents.setWindowOpenHandler(({url}) => {
		if (isSafeExternalUrl(url)) {
			shell.openExternal(url).catch(err => console.error("Error opening external URL:", err));
		}
		return {action: "deny"};
	});
	window.webContents.on("will-navigate", (event, url) => {
		if (isSafeExternalUrl(url)) {
			event.preventDefault();
			shell.openExternal(url).catch(err => console.error("Error opening external URL:", err));
		}
	});

	window.on("show", () => opts.onShow?.(window, undefined));
	window.on("close", (event: Electron.Event) => opts.onClose?.(window, event));

	if (opts.devTools) {
		window.webContents.on("did-finish-load", () => window.webContents.openDevTools());
	}

	return window;
}

export function createMainWindow(): BrowserWindow {
	return createWindow({
		size: {
			"win32": [400, 300],
			"default": [400, 300]
		},
		iconFile: platformIcon(),
		frame: false,
		transparent: true,
		route: "",
		devTools,
		alwaysOnTop: true,
		resizable: false,
		show: false
	});
}

export function createHistoryWindow(parent: BrowserWindow): BrowserWindow {
	return createWindow({
		size: {
			"default": [1050, 496]
		},
		iconFile: platformIcon(),
		frame: true,
		transparent: false,
		parent,
		route: "history",
		devTools,
		alwaysOnTop: false,
		resizable: true,
		show: false,
		onShow: (window: BrowserWindow) => {
			ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "history");
			const data = Settings.getInstance().getSpeedHistory();
			window.webContents.send("speed-history-data", data);
		},
		onClose: (window: BrowserWindow, event: Electron.Event) => {
			ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "history");
			event.preventDefault();
			window.webContents.closeDevTools();
			window.hide();
		}
	});
}

export function createAppSettingsWindow(parent: BrowserWindow): BrowserWindow {
	return createWindow({
		size: {
			"default": [300, 300]
		},
		iconFile: platformIcon(),
		frame: true,
		transparent: false,
		parent,
		route: "settings",
		devTools,
		alwaysOnTop: false,
		resizable: false,
		show: false,
		onShow: (window: BrowserWindow) => {
			ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "settings");
			const dbSettings = Settings.getInstance().getSettings();
			window.webContents.send("settings-data", dbSettings);
		},
		onClose: (window: BrowserWindow, event: Electron.Event) => {
			ElectronApp.getInstance().MainWindow?.webContents.send("toggle-button", "settings");
			event.preventDefault();
			window.webContents.closeDevTools();
			window.hide();
		}
	});
}
