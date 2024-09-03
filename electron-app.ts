import { app, BrowserWindow, ipcMain, dialog, screen, Rectangle } from "electron";
import { format } from "url";
import path from "path";

let mainWindow: BrowserWindow | undefined;

function createWindow() {
	let _width, _height, icon;

	switch (process.platform) {
		case "darwin":
			icon = "./public/icon.icns";
			_width = 400;
			_height = 260;
			break;
		case "win32":
			icon = "./public/icon.ico";
			_width = 400;
			_height = 290;
			break;
		default:
			icon = "./public/icon.png";
			_width = 400;
			_height = 260;
			break;
	}

	const monitor = screen.getPrimaryDisplay();
	const {x, y, height, width} = monitor.bounds;

	mainWindow = new BrowserWindow({
		width: _width,
		height: _height,
		x: x + Math.trunc(width / 2) - Math.trunc(_width / 2),
		y: y + Math.trunc(height / 2) - Math.trunc(_height / 2),
		frame: false,
		transparent: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true
		}
	});

	mainWindow.loadFile(path.join(__dirname, "..", "/dist/internet-speed-monitor-ng/browser/index.html"));
	mainWindow.removeMenu();
	mainWindow.setAlwaysOnTop(true);
	mainWindow.setResizable(false);
	mainWindow.setIcon(icon);
	mainWindow.on("close", closeMainWindow);

	// Open the DevTools.
	mainWindow.webContents.openDevTools();
}

function closeMainWindow(event: any) {
	if (process.platform !== "darwin") {
		const buttons = {YES: 0, NO: 1};
		const window = BrowserWindow.getFocusedWindow();
		if (window && dialog.showMessageBoxSync(window, {
			type: "question",
			title: "Confirmation",
			message: "Are you sure you want to close the app?",
			buttons: ["Yes", "No"]
		}) === buttons.YES) {
			app.quit();
		} else {
			event.preventDefault();
		}
	}
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
	if (mainWindow === null) createWindow();
});
