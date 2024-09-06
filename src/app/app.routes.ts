import { Routes } from "@angular/router";
import { HistoryComponent } from "./components/history/history.component";
import { MainComponent } from "./components/main/main.component";

export const routes: Routes = [
	{path: "", component: MainComponent},
	{path: "history", component: HistoryComponent}
];
