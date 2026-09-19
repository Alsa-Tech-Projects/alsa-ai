// Pure Node app launcher + installed-apps scan — no nut-js keyboard/mouse automation.
'use strict';
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const run = (cmd) => new Promise((resolve) => {
  exec(cmd, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
    resolve({ err, stdout, stderr });
  });
});

async function launchApp(payload = {}) {
  const { target } = payload;
  if (!target) return { success: false, message: 'target is required' };
  const { err } = await run(`start "" "${target}"`);
  return err ? { success: false, message: err.message } : { success: true, message: `Launched ${target}` };
}

async function getInstalledApps() {
  try {
    const psScript = `
      $paths = @(
        'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
        'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
        'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
      );
      Get-ItemProperty $paths -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName -and -not $_.SystemComponent } |
        Select-Object -ExpandProperty DisplayName -Unique |
        ConvertTo-Json
    `.replace(/\r?\n/g, ' ');

    const { stdout } = await run(`powershell -NoProfile -Command "${psScript.replace(/"/g, '\\"')}"`);
    let applications = [];
    try {
      const parsed = JSON.parse(stdout || '[]');
      applications = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      applications = [];
    }

    const home = os.homedir();
    const commonFolders = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos', 'Music']
      .map((f) => path.join(home, f))
      .filter((p) => fs.existsSync(p));

    const recentDir = path.join(home, 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent');
    let recentFiles = [];
    try {
      recentFiles = fs.readdirSync(recentDir)
        .filter((f) => f.toLowerCase().endsWith('.lnk'))
        .slice(0, 20)
        .map((f) => f.replace(/\.lnk$/i, ''));
    } catch {
      // Recent folder may not exist / be accessible — leave empty
    }

    return { success: true, data: { applications: applications.filter(Boolean), commonFolders, recentFiles } };
  } catch (err) {
    return { success: false, message: err.message || 'Failed to scan system' };
  }
}

module.exports = { launchApp, getInstalledApps };
