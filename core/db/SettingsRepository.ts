import { AppDAO } from "./AppDAO";

export interface ISettings {
	id: number;
	refreshTime: number;
	intervalId: number;
}

export class SettingsRepository {
	private dao: AppDAO;

	constructor(dao: AppDAO) {
		this.dao = dao;
	}

	createTable() {
		const sql = `
            CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            refreshTime INTEGER,
            intervalId INTEGER)`;
		return this.dao.run(sql);
	}

	create(refreshTime: number, intervalId: number) {
		return this.dao.run(
			`INSERT INTO settings (refreshTime, intervalId)
        VALUES (?, ?)`,
			[refreshTime, intervalId]);
	}

	async updateIntervalId(intervalId: number = 0) {
		try {
			const settings = await this.getSettings();
			if (settings) {
				await this.dao.run(
					`UPDATE settings SET intervalId = ? WHERE id = ?`,
					[intervalId, settings.id]
				);
			}
		} catch (e) {
			console.error("updateIntervalId", e);
		}
	}

	async updateRefreshTime(refreshTime: number = 5 * 60 * 1000) {
		try {
			let settings = await this.getSettings();
			if (settings) {
				return this.dao.run(
					`UPDATE settings SET refreshTime = ? WHERE id = ?`,
					[refreshTime, settings.id]
				);
			}
			return undefined;
		} catch (e) {
			console.error("updateRefreshTime", e);
			return undefined;
		}
	}

	async initSettings() {
		try {
			const settings = await this.getSettings();
			if (!settings)
				await this.create(5 * 60 * 1000, 0);
		} catch (e) {
			console.error("getSettings", e);
		}
	}

	getSettings(): Promise<ISettings> {
		return this.dao.get(`SELECT * FROM settings ORDER BY id limit 1`);
	}
}
