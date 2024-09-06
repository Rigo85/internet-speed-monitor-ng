import { promisify } from "util";
import path from "path";

const exec = promisify(require("child_process").exec);

export interface ISpeedTestResult {
	type: string;
	timestamp: string;
	ping: {
		jitter: number;
		latency: number;
		low: number;
		high: number;
	};
	download: {
		bandwidth: number;
		bytes: number;
		elapsed: number;
		latency: {
			iqm: number;
			low: number;
			high: number;
			jitter: number;
		};
	};
	upload: {
		bandwidth: number;
		bytes: number;
		elapsed: number;
		latency: {
			iqm: number;
			low: number;
			high: number;
			jitter: number;
		};
	};
	isp: string;
	interface: {
		internalIp: string;
		name: string;
		macAddr: string;
		isVpn: boolean;
		externalIp: string;
	};
	server: {
		id: number;
		host: string;
		port: number;
		name: string;
		location: string;
		country: string;
		ip: string;
	};
	result: {
		id: string;
		url: string;
		persisted: boolean;
	};
	updateAt: Date;
}

export async function speedTest(): Promise<ISpeedTestResult | undefined> {
	let ext;
	switch (process.platform) {
		case "darwin":
			ext = "";
			break;
		case "win32":
			ext = ".exe";
			break;
		default:
			ext = "";
			break;
	}

	try {
		const speedTestPath = path.join("core", "ookla-speedtest", process.platform, `speedtest${ext}`);
		const {stdout, stderr} = await exec(`${speedTestPath} -f json`);
		if (stderr) {
			console.info("speedTest", stderr);
			return undefined;
		} else {
			const result = JSON.parse(stdout);
			return result.type === "result" ? {...result, updateAt: new Date()} : undefined;
		}
	} catch (e) {
		console.error("speedTest", e);
		return undefined;
	}
}
