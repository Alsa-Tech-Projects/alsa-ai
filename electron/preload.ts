import { contextBridge, ipcRenderer } from "electron";

export type WindowControlAction = "minimize" | "maximize" | "close";

contextBridge.exposeInMainWorld("electronAPI", {
  controlWindow: (action: WindowControlAction) => {
    // Send both unified and specific action channels for maximum IPC reliability
    ipcRenderer.send("window-control", action);
    ipcRenderer.send(action);
  },
  // Pure-Node plugin bridge — replaces the old Python PC-bridge HTTP server (port 5001)
  // for file-generation/automation tasks when running inside Electron.
  runPlugin: (plugin: string, action: string, payload?: unknown) =>
    ipcRenderer.invoke("run-plugin", { plugin, action, payload }),
  scanSystem: () => ipcRenderer.invoke("bridge:scan"),
  isElectron: true,
});
