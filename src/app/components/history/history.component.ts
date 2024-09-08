import { Component, OnInit, ViewChild } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { DataTableDirective, DataTablesModule } from "angular-datatables";
import { Config } from "datatables.net";
import "datatables.net-buttons-dt";

import { ElectronService } from "../../services/electron.service";

@Component({
	selector: "history",
	standalone: true,
	imports: [BrowserModule, DataTablesModule],
	templateUrl: "./history.component.html",
	styleUrl: "./history.component.scss"
})
export class HistoryComponent implements OnInit {
	dtOptions: any;
	@ViewChild(DataTableDirective, {static: false})
	dtElement!: DataTableDirective;

	constructor(private electronService: ElectronService) {}

	ngOnInit(): void {

		document.body.style.border = "none";
		document.body.style.overflow = "auto";

		this.dtOptions = {
			"bLengthChange": false,
			"pageLength": 10,
			dom: "Bfrtip",
			buttons: ["excel"],
			data: [],
			columns: [
				{title: "Id", data: "id"},
				{title: "DownloadSpeed(Mbps)", data: "DownloadSpeed"},
				{title: "UploadSpeed(Mbps)", data: "UploadSpeed"},
				{title: "Latency", data: "Latency"},
				{title: "Jitter", data: "Jitter"},
				{title: "UpdateAt", data: "UpdateAt"},
				{title: "ISP", data: "ISP"},
				{title: "Server", data: "Server"},
				{title: "Server City", data: "Server City"},
				{title: "Server Country", data: "Server Country"},
				{title: "Network Interface", data: "Network Interface"},
				{title: "URL", data: "URL"}
			],
			columnDefs: [{
				target: 11,
				render: (data: any, type: any, row: any, meta: any) => {
					return `<a target="_blank" href="${data}">Result</a>`;
				}
			}],
			order: [[0, "desc"]]
		} as Config;

		this.electronService.onHistoryData((event, data) => {
			this.dtElement?.dtInstance.then((dtInstance) => {
				dtInstance.clear();
				dtInstance.rows.add(data);
				dtInstance.draw();
			});
		});
	}
}
