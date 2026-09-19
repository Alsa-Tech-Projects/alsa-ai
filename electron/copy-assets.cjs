// Copies non-TS runtime assets into dist-electron/ after tsc runs.
// tsc only emits main.ts/preload.ts -> it never touches plain .js/.cjs files.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC_ELECTRON = path.join(ROOT, 'electron');
const OUT_ELECTRON = path.join(ROOT, 'dist-electron');

fs.mkdirSync(OUT_ELECTRON, { recursive: true });
fs.copyFileSync(path.join(SRC_ELECTRON, 'agentHandlers.js'), path.join(OUT_ELECTRON, 'agentHandlers.js'));
fs.cpSync(path.join(SRC_ELECTRON, 'plugins'), path.join(OUT_ELECTRON, 'plugins'), { recursive: true });

console.log('[copy-assets] agentHandlers.js + plugins/ copied to dist-electron/');
