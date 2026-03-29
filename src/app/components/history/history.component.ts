import {Component, OnDestroy, OnInit, ViewChild} from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { DataTableDirective, DataTablesModule } from "angular-datatables";
import { Config } from "datatables.net";
import "datatables.net-buttons-dt";

import { ElectronService } from "../../services/electron.service";

@Component({
	selector: "history",
	imports: [BrowserModule, DataTablesModule],
	templateUrl: "./history.component.html",
	styleUrl: "./history.component.scss"
})
export class HistoryComponent implements OnInit, OnDestroy {
	dtOptions: any;
	@ViewChild(DataTableDirective, {static: false})
	dtElement!: DataTableDirective;
	private readonly onDocumentClick = (event: Event) => {
		const target = event.target as HTMLElement | null;
		const resultLink = target?.closest(".result-link") as HTMLElement | null;
		if (!resultLink) return;

		event.preventDefault();
		const url = resultLink.getAttribute("data-url");
		if (url) {
			this.electronService.openResultUrl(url);
		}
	};

	constructor(private electronService: ElectronService) {}

	private static buildResultLink(data: string): string {
		const url = typeof data === "string" ? data.trim() : "";
		if (!/^https?:\/\//i.test(url)) {
			return "N/A";
		}

		const escaped = url
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");

		return `<a href="#" class="result-link" data-url="${escaped}">Result</a>`;
	}

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
				{title: "IP Address", data: "IP Address"},
				{title: "URL", data: "URL"}
			],
			columnDefs: [{
				target: 12,
				render: (data: any) => {
					return HistoryComponent.buildResultLink(data);
				}
			}],
			order: [[0, "desc"]]
		} as Config;

		document.addEventListener("click", this.onDocumentClick);

		this.electronService.onHistoryData((event, data) => {
			this.dtElement?.dtInstance.then((dtInstance) => {
				dtInstance.clear();
				dtInstance.rows.add(data);
				dtInstance.draw();
			});
		});
	}

	ngOnDestroy(): void {
		document.removeEventListener("click", this.onDocumentClick);
	}
}
