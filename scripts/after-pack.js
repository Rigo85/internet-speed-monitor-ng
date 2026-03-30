'use strict';

const fs = require('fs');
const path = require('path');

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'linux') return;

  const appOutDir = context.appOutDir;
  const execName = context.packager.executableName;
  const binPath = path.join(appOutDir, execName);
  const realBinPath = path.join(appOutDir, `${execName}.bin`);

  if (!fs.existsSync(binPath)) {
    console.warn(`afterPack: binary not found at ${binPath}, skipping wrapper`);
    return;
  }

  fs.renameSync(binPath, realBinPath);

  const wrapper = [
    '#!/bin/bash',
    `exec "$(dirname "$(readlink -f "$0")")/${execName}.bin" --no-sandbox "$@"`,
    '',
  ].join('\n');

  fs.writeFileSync(binPath, wrapper, {mode: 0o755});
  console.log(`afterPack: wrapped ${execName} -> ${execName}.bin with --no-sandbox`);
};
