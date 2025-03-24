import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MainComponent } from "./components/main/main.component";

@Component({
	selector: "app-root",
	imports: [RouterOutlet, MainComponent],
	templateUrl: "./app.component.html",
	styleUrl: "./app.component.scss"
})
export class AppComponent {
	title = "internet-speed-monitor-ng";
}
