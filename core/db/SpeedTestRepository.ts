import {AppDAO} from "./AppDAO";

export interface ISpeedRecord {
	id: number;
	DownloadSpeed: string;
	UploadSpeed: string;
	Latency: string;
	Jitter: string;
	UpdateAt: string;
	ISP: string;
	Server: string;
	"Server City": string;
	"Server Country": string;
	"Network Interface": string;
	"IP Address": string;
	URL: string;
}

export class SpeedTestRepository {
	private dao: AppDAO;

	constructor(dao: AppDAO) {
		this.dao = dao;
	}

	createTable(): void {
		this.dao.run(`
			CREATE TABLE IF NOT EXISTS speedtest (
				id          INTEGER PRIMARY KEY AUTOINCREMENT,
				speedResult JSON    NOT NULL
			)
		`);
	}

	create(speedResult: string): number {
		const result = this.dao.run("INSERT INTO speedtest (speedResult) VALUES (?)", [speedResult]);
		return Number(result.lastInsertRowid);
	}

	updateIpInfo(id: number, ipInfoJson: string): void {
		this.dao.run(
			"UPDATE speedtest SET speedResult = json_set(speedResult, '$.ipInfo', json(?)) WHERE id = ?",
			[ipInfoJson, id]
		);
	}

	getAllData(): ISpeedRecord[] {
		return this.dao.all<ISpeedRecord>(`
			SELECT
				id,
				speedResult -> 'download'  ->> 'bandwidth'  AS "DownloadSpeed",
				speedResult -> 'upload'    ->> 'bandwidth'  AS "UploadSpeed",
				speedResult -> 'ping'      ->> 'latency'    AS "Latency",
				speedResult -> 'ping'      ->> 'jitter'     AS "Jitter",
				speedResult               ->> 'updateAt'    AS "UpdateAt",
				speedResult               ->> 'isp'         AS "ISP",
				speedResult -> 'server'   ->> 'name'        AS "Server",
				speedResult -> 'server'   ->> 'location'    AS "Server City",
				speedResult -> 'server'   ->> 'country'     AS "Server Country",
				speedResult -> 'interface' ->> 'name'       AS "Network Interface",
				speedResult -> 'ipInfo'   ->> 'ip'          AS "IP Address",
				speedResult -> 'result'   ->> 'url'         AS "URL"
			FROM speedtest
			ORDER BY id DESC
		`);
	}
}
