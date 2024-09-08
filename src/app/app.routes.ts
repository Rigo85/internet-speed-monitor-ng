import { Routes } from "@angular/router";
import { HistoryComponent } from "./components/history/history.component";
import { MainComponent } from "./components/main/main.component";
import { SettingsComponent } from "./components/settings/settings.component";

export const routes: Routes = [
	{path: "", component: MainComponent},
	{path: "history", component: HistoryComponent},
	{path: "settings", component: SettingsComponent}
];
