import shell from "shelljs";
import * as os from "os";

if (["win32", "darwin", "linux"].includes(os.platform())) {
	shell.mkdir(`release-builds/internet-speed-monitor-${os.platform()}-x64/public`);
	shell.cp("public/icon.*", `release-builds/internet-speed-monitor-${os.platform()}-x64/public/`);
	shell.mkdir("-p", `release-builds/internet-speed-monitor-${os.platform()}-x64/core`);
	shell.cp("-R", "core/ookla-speedtest/", `release-builds/internet-speed-monitor-${os.platform()}-x64/core/`);
}
