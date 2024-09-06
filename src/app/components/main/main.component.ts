import { AfterViewInit, ChangeDetectorRef, Component } from "@angular/core";
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
export class MainComponent implements AfterViewInit {
	time: string = "--:--:--";
	downloadSpeed: string = "0";
	uploadSpeed: string = "0";

	constructor(
		private electronService: ElectronService,
		private cdr: ChangeDetectorRef
	) {}

	ngAfterViewInit() {
		this.electronService.reload();
		this.electronService.onSpeedUpdate(this.onSpeedUpdate.bind(this));
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
}
