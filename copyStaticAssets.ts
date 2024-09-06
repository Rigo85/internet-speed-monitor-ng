import shell from "shelljs";

// shell.cp("-R", "src/public/images", "dist/public/");

shell.cp("-R", "core/ookla-speedtest", "dist-electron-app/core/");
shell.cp(".env","dist-electron-app/src-electron-app/");
