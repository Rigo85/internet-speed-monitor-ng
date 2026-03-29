import * as fs from "fs";
import * as path from "path";
import * as util from "util";

const LOG_FILE_NAME = "app.log";
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const DEFAULT_MAX_FILES = 5;

let logDir = "";
let logFilePath = "";
let maxBytes = DEFAULT_MAX_BYTES;
let maxFiles = DEFAULT_MAX_FILES;
let installed = false;
let currentLogSize = 0;

function rotateLogFiles(): void {
	for (let i = maxFiles - 1; i >= 1; i--) {
		const src = `${logFilePath}.${i}`;
		const dst = `${logFilePath}.${i + 1}`;
		if (fs.existsSync(dst)) fs.rmSync(dst, {force: true});
		if (fs.existsSync(src)) fs.renameSync(src, dst);
	}
	if (fs.existsSync(logFilePath)) {
		const rotated = `${logFilePath}.1`;
		if (fs.existsSync(rotated)) fs.rmSync(rotated, {force: true});
		fs.renameSync(logFilePath, rotated);
	}
	currentLogSize = 0;
}

function appendLogLine(level: string, line: string): void {
	const ts = new Date().toISOString();
	const entry = `${ts} [${level}] ${line}\n`;
	const bytes = Buffer.byteLength(entry, "utf8");

	if (currentLogSize + bytes > maxBytes) {
		rotateLogFiles();
	}

	fs.appendFileSync(logFilePath, entry, "utf8");
	currentLogSize += bytes;
}

export interface LoggerOptions {
	/** Maximum bytes per log file before rotation (default 10 MB). */
	maxBytes?: number;
	/** Number of rotated files to keep (default 5). */
	maxFiles?: number;
}

export function installLogger(logDirectory: string, options: LoggerOptions = {}): void {
	if (installed) return;
	installed = true;

	logDir = logDirectory;
	logFilePath = path.join(logDir, LOG_FILE_NAME);
	maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
	maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;

	fs.mkdirSync(logDir, {recursive: true});
	currentLogSize = fs.existsSync(logFilePath)
		? fs.statSync(logFilePath).size
		: 0;

	const origLog = console.log.bind(console);
	const origInfo = console.info.bind(console);
	const origWarn = console.warn.bind(console);
	const origError = console.error.bind(console);

	console.log = (...args: unknown[]) => {
		origLog(...args);
		appendLogLine("INFO", util.format(...args));
	};
	console.info = (...args: unknown[]) => {
		origInfo(...args);
		appendLogLine("INFO", util.format(...args));
	};
	console.warn = (...args: unknown[]) => {
		origWarn(...args);
		appendLogLine("WARN", util.format(...args));
	};
	console.error = (...args: unknown[]) => {
		origError(...args);
		appendLogLine("ERROR", util.format(...args));
	};

	const maxLabel = maxBytes >= 1024 * 1024
		? `${(maxBytes / 1024 / 1024).toFixed(0)} MB`
		: `${(maxBytes / 1024).toFixed(0)} KB`;
	console.log(`Logger initialized — ${logFilePath} (max ${maxLabel} × ${maxFiles} files)`);
}

export function getLogFilePath(): string {
	return logFilePath;
}
