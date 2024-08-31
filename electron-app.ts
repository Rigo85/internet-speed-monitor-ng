import { app, BrowserWindow } from "electron";
import { format } from "url";
import path from "path";

let mainWindow: BrowserWindow | undefined;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	});

	mainWindow.loadURL(
		format({
			pathname: path.join(__dirname, "..", `/dist/internet-speed-monitor-ng/browser/index.html`),
			protocol: "file:",
			slashes: true
		})
	);
	// Open the DevTools.
	mainWindow.webContents.openDevTools();

	mainWindow.on("closed", function () {
		mainWindow = undefined;
	});
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
	if (mainWindow === null) createWindow();
});
