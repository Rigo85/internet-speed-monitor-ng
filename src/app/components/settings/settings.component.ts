import { Component, OnInit } from "@angular/core";
import { ElectronService } from "../../services/electron.service";
import { FormsModule } from "@angular/forms";
import { NgForOf } from "@angular/common";

@Component({
	selector: "app-settings",
	imports: [
		FormsModule,
		NgForOf
	],
	templateUrl: "./settings.component.html",
	styleUrl: "./settings.component.scss"
})
export class SettingsComponent implements OnInit {
	selectedRefreshTime: number = 5;
	refreshTimes: number[] = [5, 10, 15, 20, 30, 40, 50, 60];

	constructor(private electronService: ElectronService) {}

	ngOnInit(): void {
		document.body.style.border = "none";
		document.body.style.overflow = "auto";

		this.electronService.onSettingsData((event, data) => {
			this.selectedRefreshTime = (data || {"refreshTime": 300000}).refreshTime / 1000 / 60;
		});
	}

	onChange($event: Event) {
		const selectElement = $event.target as HTMLSelectElement;
		const selectedValue = Number(selectElement.value);

		console.log("Selected refresh time:", selectedValue);
		// Aquí puedes realizar cualquier acción adicional con el valor seleccionado
		// this.selectedRefreshTime = selectedValue;

		this.electronService.updateRefreshTime(selectedValue);
	}
}
