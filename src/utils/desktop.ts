import { EventEmitter } from 'events';

// Types and Interfaces
export interface AgentCommand {
    id: string;
    type: string;
    payload?: any;
    timestamp: number;
}

export interface AgentResult {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

export interface MultiLangPattern {
    keywords: string[];
    type: string;
    extractPayload?: (commandText: string) => any;
}

class DesktopBridge extends EventEmitter {
    private queue: AgentCommand[] = [];
    private isProcessing: boolean = false;

    // Natural Language Intent Mapping Patterns
    private readonly MULTILANG_PATTERNS: MultiLangPattern[] = [
        {
            keywords: ['clean junk', ['temp', 'clean'], ['cache', 'delete'], 'junk clean', 'safai'],
            type: 'agent:cleanJunk'
        },
        {
            keywords: ['draw', 'paint', 'draw box', 'drawing'],
            type: 'agent:drawInPaint',
            extractPayload: (text) => ({ shape: text.includes('circle') ? 'circle' : 'box' })
        },
        {
            keywords: ['ppt', 'powerpoint', 'presentation', 'slide'],
            type: 'agent:createPPT',
            extractPayload: (text) => ({
                title: "ALSA AI Autonomous Generated Presentation",
                content: text
            })
        },
        {
            keywords: ['whatsapp', 'send message to', 'wa msg'],
            type: 'agent:sendWhatsApp',
            extractPayload: (text) => {
                const phoneMatch = text.match(/\d{10,12}/);
                return {
                    phone: phoneMatch ? phoneMatch[0] : '',
                    message: text.replace(/whatsapp|send|to|\d{10,12}/gi, '').trim()
                };
            }
        },
        {
            keywords: ['telegram', 'tg msg'],
            type: 'agent:sendTelegram',
            extractPayload: (text) => {
                const userMatch = text.match(/@\w+/);
                return {
                    username: userMatch ? userMatch[0] : '',
                    message: text.replace(/telegram|tg|send|to|@\w+/gi, '').trim()
                };
            }
        },
        {
            keywords: ['email', 'mail', 'send mail'],
            type: 'agent:sendEmail',
            extractPayload: (text) => {
                const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                return {
                    to: emailMatch ? emailMatch[0] : '',
                    subject: 'ALSA AI Automated Email',
                    body: text
                };
            }
        },
        {
            keywords: ['python', 'run script', 'py file'],
            type: 'agent:runPython',
            extractPayload: (text) => ({ filePath: text.replace(/python|run|script|file/gi, '').trim() })
        },
        {
            keywords: ['cmd', 'terminal', 'command', 'exec'],
            type: 'agent:runCmd',
            extractPayload: (text) => ({ command: text.replace(/cmd|terminal|command|exec|run/gi, '').trim() })
        },
        {
            keywords: ['open', 'launch', 'start'],
            type: 'agent:openApp',
            extractPayload: (text) => ({ target: text.replace(/open|launch|start/gi, '').trim() })
        },
        {
            keywords: ['system info', 'pc status', 'ram info', 'specs'],
            type: 'agent:getSystemInfo'
        }
    ];

    constructor() {
        super();
    }

    // 1. Natural Language Parsing Engine
    public parseNaturalLanguage(input: string): AgentCommand | null {
        const text = input.toLowerCase().trim();

        for (const pattern of this.MULTILANG_PATTERNS) {
            const matched = pattern.keywords.some(kw => {
                if (Array.isArray(kw)) {
                    return kw.every(subKw => text.includes(subKw));
                }
                return text.includes(kw);
            });

            if (matched) {
                return {
                    id: `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    type: pattern.type,
                    payload: pattern.extractPayload ? pattern.extractPayload(input) : undefined,
                    timestamp: Date.now()
                };
            }
        }

        return null;
    }

    // 2. Direct IPC Execution (Replaces HTTP Bridge Calls)
    public async executeAction(command: AgentCommand): Promise<AgentResult> {
        try {
            this.emit('action_start', command);

            // Electron Window Interop Context
            const electronIpc = (window as any).electron?.ipcRenderer;

            if (!electronIpc) {
                throw new Error('Electron IPC Bridge is not available in current window context.');
            }

            // Direct Invocation to agentHandlers.js IPC channel
            const response: AgentResult = await electronIpc.invoke(command.type, command.payload);

            this.emit('action_success', { command, result: response });
            return response;
        } catch (error: any) {
            const errResult: AgentResult = {
                success: false,
                error: error.message || 'Error occurred while executing agent action'
            };
            this.emit('action_error', { command, error: errResult });
            return errResult;
        }
    }

    // 3. Smart Fetching & Queue Pipeline
    public async processNaturalCommand(text: string): Promise<AgentResult> {
        const parsedCmd = this.parseNaturalLanguage(text);

        if (!parsedCmd) {
            return {
                success: false,
                error: 'Natural language parser could not map the command to an agent action handler.'
            };
        }

        return await this.enqueueAndProcess(parsedCmd);
    }

    public async enqueueAndProcess(command: AgentCommand): Promise<AgentResult> {
        this.queue.push(command);
        return this.processQueue();
    }

    private async processQueue(): Promise<AgentResult> {
        if (this.isProcessing || this.queue.length === 0) {
            return { success: true, message: 'Processing queued or already running.' };
        }

        this.isProcessing = true;
        const currentCmd = this.queue.shift()!;

        try {
            const result = await this.executeAction(currentCmd);
            this.isProcessing = false;

            if (this.queue.length > 0) {
                this.processQueue();
            }

            return result;
        } catch (err: any) {
            this.isProcessing = false;
            return { success: false, error: err.message };
        }
    }

    // Helper Utilities
    public getQueueLength(): number {
        return this.queue.length;
    }

    public clearQueue(): void {
        this.queue = [];
    }
}

export const deskTopBridge = new DesktopBridge();
export default deskTopBridge;