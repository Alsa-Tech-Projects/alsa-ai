// Custom voice / text commands → user-defined PC actions
import { executeCmdCommand, openCustomApp, executePythonFile } from '@/utils/pcBridge';

export type CustomActionType = 'url' | 'shell' | 'ai' | 'app' | 'script' | 'type';

export interface CustomCommand {
  id: string;
  phrase: string;          // trigger phrase (lowercased, exact or starts-with match)
  actionType: CustomActionType;
  payload: string;         // url / shell command / AI prompt / app path / script path / text to type
  description?: string;
  createdAt: number;
}

const STORAGE_KEY = 'alsa_custom_commands';

export const loadCustomCommands = (): CustomCommand[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
};

export const saveCustomCommands = (cmds: CustomCommand[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cmds));
};

export const addCustomCommand = (cmd: Omit<CustomCommand, 'id' | 'createdAt'>): CustomCommand => {
  const list = loadCustomCommands();
  const next: CustomCommand = { ...cmd, id: crypto.randomUUID(), createdAt: Date.now() };
  saveCustomCommands([next, ...list]);
  return next;
};

export const removeCustomCommand = (id: string) => {
  saveCustomCommands(loadCustomCommands().filter(c => c.id !== id));
};

export const matchCustomCommand = (input: string): CustomCommand | null => {
  const text = input.trim().toLowerCase();
  if (!text) return null;
  const cmds = loadCustomCommands();
  // Exact, then startsWith, then includes
  return (
    cmds.find(c => c.phrase.toLowerCase() === text) ||
    cmds.find(c => text.startsWith(c.phrase.toLowerCase())) ||
    cmds.find(c => text.includes(c.phrase.toLowerCase())) ||
    null
  );
};

export interface ExecuteResult {
  ok: boolean;
  message: string;
  forwardToAI?: { prompt: string };
}

export const executeCustomCommand = async (
  cmd: CustomCommand,
  bridgeConnected: boolean,
): Promise<ExecuteResult> => {
  const needsBridge = cmd.actionType !== 'url' && cmd.actionType !== 'ai';
  if (needsBridge && !bridgeConnected) {
    return { ok: false, message: `PC Bridge connect nahi hai. "${cmd.phrase}" run nahi kar sakta.` };
  }

  try {
    switch (cmd.actionType) {
      case 'url': {
        window.open(cmd.payload, '_blank', 'noopener,noreferrer');
        return { ok: true, message: `Opened: ${cmd.payload}` };
      }
      case 'shell': {
        const r: any = await executeCmdCommand(cmd.payload);
        return { ok: r?.success !== false, message: r?.output || `Ran shell: ${cmd.payload}` };
      }
      case 'app': {
        const r: any = await openCustomApp(cmd.payload);
        return { ok: r?.success !== false, message: r?.message || `Launched app: ${cmd.payload}` };
      }
      case 'script': {
        const r: any = await executePythonFile(cmd.payload);
        return { ok: r?.success !== false, message: r?.output || `Ran script: ${cmd.payload}` };
      }
      case 'type': {
        // Use shell echo / clipboard fallback through executeCmdCommand on Windows
        const escaped = cmd.payload.replace(/"/g, '\\"');
        const r: any = await executeCmdCommand(`echo ${escaped} | clip`);
        return { ok: r?.success !== false, message: `Copied to clipboard: "${cmd.payload}" (paste with Ctrl+V)` };
      }
      case 'ai': {
        return { ok: true, message: `Forwarding to AI: ${cmd.payload}`, forwardToAI: { prompt: cmd.payload } };
      }
    }
  } catch (e: any) {
    return { ok: false, message: `Action failed: ${e?.message || e}` };
  }
};
