import { SettingsRepository } from "./db/SettingsRepository";
import { IResult, SpeedTestRepository } from "./db/SpeedTestRepository";
import { AppDAO } from "./db/AppDAO";
import { formatSpeed } from "../src-electron-app/utils";

export class Settings {
	private dao!: AppDAO;
	private settingsRepository!: SettingsRepository;
	private speedTestRepository!: SpeedTestRepository;
	private static instance: Settings;

	private constructor() { }

	public static getInstance(): Settings {
		if (!Settings.instance) {
			Settings.instance = new Settings();
		}
		return Settings.instance;
	}

	async initSettings(): Promise<void> {
		try {
			this.dao = new AppDAO("./database.sqlite3");
			this.settingsRepository = new SettingsRepository(this.dao);
			this.speedTestRepository = new SpeedTestRepository(this.dao);
			await Promise.all([
				this.settingsRepository.createTable(),
				this.speedTestRepository.createTable()
			]);
			await this.settingsRepository.initSettings();
		} catch (e) {
			console.error("Settings Constructor", e);
		}
	}

	setIntervalId(intervalId: number) {
		return this.settingsRepository.updateIntervalId(intervalId);
	}

	getIntervalId() {
		return this.settingsRepository.getSettings();
	}

	async getRefreshTime() {
		try {
			let settings = await this.settingsRepository.getSettings();
			return (settings || {refreshTime: 5 * 60 * 1000}).refreshTime;
		} catch (e) {
			console.error("getRefreshTime", e);
			return 5 * 60 * 1000;
		}
	}

	setRefreshTime(refreshTime: number) {
		return this.settingsRepository.updateRefreshTime(refreshTime);
	}

	addSpeedTest(speedResult: string) {
		return this.speedTestRepository.create(speedResult);
	}

	getSettings() {
		return this.settingsRepository.getSettings();
	}

	async getSpeedHistory(): Promise<IResult[]> {
		try {
			const data = await this.speedTestRepository.getAllData();
			return data.map((d: IResult) => ({
					...d,
					UpdateAt: Intl.DateTimeFormat("en", {
						day: "2-digit",
						dayPeriod: "long",
						month: "short",
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
						hour12: true
					}).format(new Date(d.UpdateAt)),
					DownloadSpeed: formatSpeed(d.DownloadSpeed),
					UploadSpeed: formatSpeed(d.UploadSpeed),
					"IP Address": d["IP Address"] || "N/A"
				})
			);
		} catch (e) {
			console.error("getSpeedHistory", e);

			return [];
		}
	}
}
