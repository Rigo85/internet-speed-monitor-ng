import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import {ElectronService, IMainStatus, ISpeedUpdate} from "../../services/electron.service";

@Component({
	selector: "app-main",
	imports: [],
	templateUrl: "./main.component.html",
	styleUrl: "./main.component.scss"
})
export class MainComponent implements OnInit {
	time: string = "--:--:--";
	downloadSpeed: string = "0";
	uploadSpeed: string = "0";
	isHistoryButtonDisabled: boolean = false;
	isSettingsButtonDisabled: boolean = false;
	ip: string = "Resolving IP...";
	country: string = "Resolving location...";
	statusMessage: string = "";
	statusLevel: "info" | "warn" | "error" = "info";

	constructor(
		private electronService: ElectronService,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.electronService.onSpeedUpdate(this.onSpeedUpdate.bind(this));
		this.electronService.onToggleButton(this.onButtonToggle.bind(this));
		this.electronService.onMainStatus(this.onMainStatus.bind(this));
	}

	onSpeedUpdate(event: any, data: ISpeedUpdate) {
		this.time = data.time;
		this.downloadSpeed = data.downloadSpeed;
		this.uploadSpeed = data.uploadSpeed;
		this.ip = data.ip;
		this.country = data.country;
		this.cdr.detectChanges();
	}

	onMainStatus(event: any, data: IMainStatus) {
		this.statusMessage = data.message;
		this.statusLevel = data.level;
		this.cdr.detectChanges();
	}

	onClose() {
		this.electronService.quit();
	}

	onHistory() {
		this.electronService.speedHistory();
	}

	onButtonToggle(event: any, data: string) {
		if (data === "history") {
			this.isHistoryButtonDisabled = !this.isHistoryButtonDisabled;
		} else if (data === "settings") {
			this.isSettingsButtonDisabled = !this.isSettingsButtonDisabled;
		}
		this.cdr.detectChanges();
	}

	onAppSettings() {
		this.electronService.appSettings();
	}

	onAppInfo() {
		this.electronService.onAppInfo();
	}
}
