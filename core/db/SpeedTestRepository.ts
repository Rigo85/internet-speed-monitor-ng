import { AppDAO } from "./AppDAO";

export interface IResult {
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
	URL: string;
}

export class SpeedTestRepository {
	private dao: AppDAO;

	constructor(dao: AppDAO) {
		this.dao = dao;
	}

	createTable() {
		const sql = `
        CREATE TABLE IF NOT EXISTS speedtest (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        speedResult JSON)`;
		return this.dao.run(sql);
	}

	create(speedResult: string) {
		return this.dao.run("INSERT INTO speedtest (speedResult) VALUES (?)", [speedResult]);
	}

	getById(id: number) {
		return this.dao.get(`SELECT * FROM speedtest WHERE id = ?`, [id]);
	}

	getAll() {
		return this.dao.all(`SELECT * FROM speedtest`);
	}

	getAllData(): Promise<IResult[]> {
		return this.dao.all(`
            select
                id,
                "speedResult" -> 'download' ->> 'bandwidth' as "DownloadSpeed",
                "speedResult" -> 'upload' ->> 'bandwidth' as "UploadSpeed",
                "speedResult" -> 'ping' ->> 'latency' as "Latency",
                "speedResult" -> 'ping' ->> 'jitter' as "Jitter",
                "speedResult" ->> 'updateAt' as "UpdateAt",
                "speedResult" ->> 'isp' as "ISP",
                "speedResult" -> 'server' ->> 'name' as "Server",
                "speedResult" -> 'server' ->> 'location' as "Server City",
                "speedResult" -> 'server' ->> 'country' as "Server Country",
                "speedResult" -> 'interface' ->> 'name' as "Network Interface",
                "speedResult" -> 'result' ->> 'url' as "URL"
            from speedtest
            order by
                id desc ;
        `);
	}
}
