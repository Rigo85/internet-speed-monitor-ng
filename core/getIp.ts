import axios from "axios";

import { IdentResponse } from "./headers";

/**
 * Fetches your public IPv4 address (and any additional JSON info)
 * from https://4.ident.me/json.
 *
 * @returns The parsed JSON payload (`IdentResponse`) on success, or `undefined` on error.
 */
export async function getPublicIp(): Promise<IdentResponse | undefined> {
	try {
		const response = await axios.get<IdentResponse>("https://4.ident.me/json");
		return response.data;
	} catch (error) {
		console.error("Failed to fetch public IP:", error);
		return undefined;
	}
}
