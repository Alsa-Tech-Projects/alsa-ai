export type WindowControlAction = 'minimize' | 'maximize' | 'close';

export interface ElectronAPI {
  controlWindow: (action: WindowControlAction) => void;
  runPlugin?: (plugin: string, action: string, payload?: unknown) => Promise<any>;
  scanSystem?: () => Promise<any>;
  isElectron?: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
