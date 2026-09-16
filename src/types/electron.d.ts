export type WindowControlAction = 'minimize' | 'maximize' | 'close';

export interface ElectronAPI {
  controlWindow: (action: WindowControlAction) => void;
  isElectron?: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
