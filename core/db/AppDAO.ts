import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";

export class AppDAO {
	private db: Database.Database;

	constructor(dbFilePath: string) {
		fs.mkdirSync(path.dirname(dbFilePath), {recursive: true});
		this.db = new Database(dbFilePath);
		this.db.pragma("journal_mode = WAL");
		console.log("Connected to database:", dbFilePath);
	}

	run(sql: string, params: unknown[] = []): Database.RunResult {
		try {
			return this.db.prepare(sql).run(...params);
		} catch (e) {
			console.error(`AppDAO.run error — sql: ${sql}`, e);
			throw e;
		}
	}

	get<T = unknown>(sql: string, params: unknown[] = []): T | undefined {
		try {
			return this.db.prepare(sql).get(...params) as T | undefined;
		} catch (e) {
			console.error(`AppDAO.get error — sql: ${sql}`, e);
			throw e;
		}
	}

	all<T = unknown>(sql: string, params: unknown[] = []): T[] {
		try {
			return this.db.prepare(sql).all(...params) as T[];
		} catch (e) {
			console.error(`AppDAO.all error — sql: ${sql}`, e);
			throw e;
		}
	}

	close(): void {
		this.db.close();
	}
}
