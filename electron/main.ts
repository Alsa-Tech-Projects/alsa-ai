import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { registerAgentHandlers } = require('./agentHandlers');

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:8080";

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#090d16",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Pure-Node plugin dispatch: renderer calls window.electronAPI.runPlugin(plugin, action, payload)
// which invokes 'run-plugin' here; each plugin is a .cjs module living alongside this file
// (copied from electron/plugins/ into dist-electron/plugins/ by electron/copy-assets.cjs).
function registerBridgeHandlers(): void {
  const pluginsDir = path.join(__dirname, "plugins");

  ipcMain.handle("run-plugin", async (_event, args: { plugin: string; action: string; payload?: unknown }) => {
    const { plugin, action, payload } = args || ({} as any);
    if (!plugin || !action) {
      return { success: false, message: "plugin and action are required" };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(plugin) || !/^[a-zA-Z0-9_]+$/.test(action)) {
      return { success: false, message: "Invalid plugin or action name" };
    }
    try {
      const mod = require(path.join(pluginsDir, `${plugin}.cjs`));
      if (typeof mod[action] !== "function") {
        return { success: false, message: `Plugin "${plugin}" has no action "${action}"` };
      }
      return await mod[action](payload);
    } catch (error: any) {
      return { success: false, message: error?.message || "Plugin execution failed" };
    }
  });

  ipcMain.handle("bridge:scan", async () => {
    try {
      const mod = require(path.join(pluginsDir, "multi_task_handler.cjs"));
      return await mod.getInstalledApps();
    } catch (error: any) {
      return { success: false, message: error?.message || "Scan failed" };
    }
  });
}

// Register IPC listeners for window actions
function registerIpcHandlers(): void {
  // Single, clean handler for window actions
  ipcMain.on("window-control", (_event, action: "minimize" | "maximize" | "close") => {
    if (!mainWindow) return;

    switch (action) {
      case "minimize":
        mainWindow.minimize();
        break;
      case "maximize":
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
        break;
      case "close":
        mainWindow.close();
        break;
    }
  });
}

// Single application instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    registerIpcHandlers();
    createWindow();
    registerAgentHandlers();
    registerBridgeHandlers();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});