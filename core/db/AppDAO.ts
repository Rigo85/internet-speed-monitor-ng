import { Database } from "sqlite3";

export class AppDAO {
	private db: Database;

	constructor(dbFilePath: string) {
		this.db = new Database(dbFilePath, (err: any) => {
			if (err) {
				console.log("Could not connect to database", err);
			} else {
				console.log("-------------------------------------------- Connected to database --------------------------------------------");
			}
		});
	}

	run(sql: string, params: any[] = []) {
		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function (err: Error | undefined) {
				if (err) {
					console.error(`Error running sql: ${sql}. Error: ${err}`);
					reject(err);
				} else {
					resolve({});
				}
			});
		});
	}

	get(sql: string, params: any[] = []): Promise<any> {
		return new Promise((resolve, reject) => {
			this.db.get(sql, params, (err: Error | undefined, result: any) => {
				if (err) {
					console.error(`Error running sql: ${sql}. Error: ${err}`);
					reject(err);
				} else {
					resolve(result);
				}
			});
		});
	}

	all(sql: string, params: any[] = []): Promise<any[]> {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if (err) {
					console.error(`Error running sql: ${sql}. Error: ${err}`);
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
	}
}
