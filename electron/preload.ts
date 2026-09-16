import { contextBridge, ipcRenderer } from "electron";

export type WindowControlAction = "minimize" | "maximize" | "close";

contextBridge.exposeInMainWorld("electronAPI", {
  controlWindow: (action: WindowControlAction) => {
    // Send both unified and specific action channels for maximum IPC reliability
    ipcRenderer.send("window-control", action);
    ipcRenderer.send(action);
  },
  isElectron: true,
});
