import {AppDAO} from "./db/AppDAO";
import {ISettings, SettingsRepository} from "./db/SettingsRepository";
import {ISpeedRecord, SpeedTestRepository} from "./db/SpeedTestRepository";
import {formatSpeed} from "../src-electron-app/utils";
import {getDbPath} from "../shared/constants";

export class Settings {
	private dao!: AppDAO;
	private settingsRepository!: SettingsRepository;
	private speedTestRepository!: SpeedTestRepository;
	private static instance: Settings;

	private constructor() {}

	public static getInstance(): Settings {
		if (!Settings.instance) {
			Settings.instance = new Settings();
		}
		return Settings.instance;
	}

	initSettings(): void {
		try {
			this.dao = new AppDAO(getDbPath());
			this.settingsRepository = new SettingsRepository(this.dao);
			this.speedTestRepository = new SpeedTestRepository(this.dao);
			this.settingsRepository.createTable();
			this.speedTestRepository.createTable();
			this.settingsRepository.initSettings();
		} catch (e) {
			console.error("Settings.initSettings:", e);
			throw e;
		}
	}

	getRefreshTime(): number {
		try {
			const settings = this.settingsRepository.getSettings();
			return settings?.refreshTime ?? 5 * 60 * 1000;
		} catch (e) {
			console.error("Settings.getRefreshTime:", e);
			return 5 * 60 * 1000;
		}
	}

	setRefreshTime(refreshTime: number): void {
		this.settingsRepository.updateRefreshTime(refreshTime);
	}

	getSettings(): ISettings | undefined {
		return this.settingsRepository.getSettings();
	}

	addSpeedTest(speedResult: string): number {
		return this.speedTestRepository.create(speedResult);
	}

	updateSpeedTestIpInfo(id: number, ipInfo: string): void {
		this.speedTestRepository.updateIpInfo(id, ipInfo);
	}

	getSpeedHistory(): ISpeedRecord[] {
		try {
			const data = this.speedTestRepository.getAllData();
			return data.map((d: ISpeedRecord) => ({
				...d,
				UpdateAt: Intl.DateTimeFormat("en", {
					day: "2-digit",
					month: "short",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					hour12: true
				}).format(new Date(d.UpdateAt)),
				DownloadSpeed: formatSpeed(d.DownloadSpeed),
				UploadSpeed: formatSpeed(d.UploadSpeed),
				"IP Address": d["IP Address"] || "N/A"
			}));
		} catch (e) {
			console.error("Settings.getSpeedHistory:", e);
			return [];
		}
	}
}
