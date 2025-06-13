
export interface IdentResponse {
	ip: string;
	country?: string;

	[key: string]: any;
}

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
	ipInfo?: IdentResponse;
}
