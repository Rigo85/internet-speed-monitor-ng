import {AppDAO} from "./AppDAO";

export interface ISettings {
	id: number;
	refreshTime: number;
}

const DEFAULT_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export class SettingsRepository {
	private dao: AppDAO;

	constructor(dao: AppDAO) {
		this.dao = dao;
	}

	createTable(): void {
		this.dao.run(`
			CREATE TABLE IF NOT EXISTS settings (
				id          INTEGER PRIMARY KEY AUTOINCREMENT,
				refreshTime INTEGER NOT NULL DEFAULT ${DEFAULT_REFRESH_MS}
			)
		`);
	}

	initSettings(): void {
		const existing = this.getSettings();
		if (!existing) {
			this.dao.run("INSERT INTO settings (refreshTime) VALUES (?)", [DEFAULT_REFRESH_MS]);
		}
	}

	getSettings(): ISettings | undefined {
		return this.dao.get<ISettings>("SELECT id, refreshTime FROM settings ORDER BY id LIMIT 1");
	}

	updateRefreshTime(refreshTime: number): void {
		const settings = this.getSettings();
		if (settings) {
			this.dao.run("UPDATE settings SET refreshTime = ? WHERE id = ?", [refreshTime, settings.id]);
		}
	}
}
