import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ElectronService, ISpeedUpdate } from "../../services/electron.service";
import { HistoryComponent } from "../history/history.component";

declare var bootstrap: any;

@Component({
	selector: "app-main",
	standalone: true,
	imports: [
		HistoryComponent
	],
	templateUrl: "./main.component.html",
	styleUrl: "./main.component.scss"
})
export class MainComponent implements OnInit {
	time: string = "--:--:--";
	downloadSpeed: string = "0";
	uploadSpeed: string = "0";
	isHistoryButtonDisabled: boolean = false;
	isSettingsButtonDisabled: boolean = false;

	constructor(
		private electronService: ElectronService,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit() {
		this.electronService.reload();
		this.electronService.onSpeedUpdate(this.onSpeedUpdate.bind(this));
		this.electronService.onToggleButton(this.onButtonToggle.bind(this));
	}

	onSpeedUpdate(event: any, data: ISpeedUpdate) {
		this.time = data.time;
		this.downloadSpeed = data.downloadSpeed;
		this.uploadSpeed = data.uploadSpeed;
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
		} else if(data === "settings") {
			this.isSettingsButtonDisabled = !this.isSettingsButtonDisabled;
		}
		this.cdr.detectChanges();
	}

	onAppSettings() {
		this.electronService.appSettings();
	}
}
