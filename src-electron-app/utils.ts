export function formatSpeed(_data: number | string): string {
	const data = `${_data}`.includes(".") ? Number.parseFloat(`${_data}`) : Number.parseInt(`${_data}`);
	return Number.parseFloat(`${data / 125000}`).toFixed(2);
}

export function formatTime(date: Date) {
	return Intl.DateTimeFormat("en", {
		hour: "numeric",
		minute: "numeric",
		second: "numeric",
		hour12: true
	}).format(date);
}
