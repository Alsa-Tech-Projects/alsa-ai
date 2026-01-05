// Natural Language Parser for PC Bridge Commands
// Supports English, Hindi, Urdu, Hinglish

interface ParsedCommand {
  action: string;
  target?: string;
  parameters?: Record<string, any>;
  confidence: number;
}

// Command patterns in multiple languages
const COMMAND_PATTERNS: Record<string, {
  patterns: RegExp[];
  action: string;
  extractTarget?: (match: RegExpMatchArray) => string;
}> = {
  // Open application commands
  open_app: {
    patterns: [
      // English
      /(?:open|launch|start|run)\s+(.+)/i,
      // Hindi
      /(.+)\s+(?:खोलो|खोल|चालू करो|शुरू करो)/i,
      /(?:खोलो|खोल|चालू करो)\s+(.+)/i,
      // Hinglish
      /(?:bhai|bro|yaar)?\s*(.+)\s+(?:kholo|khol|open karo|start karo|chalu karo)/i,
      /(?:kholo|khol|open karo)\s+(.+)/i,
      // Urdu
      /(.+)\s+(?:کھولو|شروع کرو)/i,
    ],
    action: 'open',
    extractTarget: (match) => match[1]?.trim() || '',
  },
  
  // Close application commands
  close_app: {
    patterns: [
      // English
      /(?:close|exit|quit|kill|stop)\s+(.+)/i,
      // Hindi
      /(.+)\s+(?:बंद करो|बंद कर|हटाओ)/i,
      /(?:बंद करो|बंद कर)\s+(.+)/i,
      // Hinglish
      /(?:bhai|bro|yaar)?\s*(.+)\s+(?:band karo|band kar|close karo|hatao)/i,
      /(?:band karo|close karo)\s+(.+)/i,
    ],
    action: 'close',
    extractTarget: (match) => match[1]?.trim() || '',
  },

  // Screenshot commands
  screenshot: {
    patterns: [
      // English
      /(?:take|capture|grab)\s+(?:a\s+)?screenshot/i,
      /screenshot\s+(?:lelo|le|lo)?/i,
      // Hindi
      /(?:स्क्रीनशॉट|screenshot)\s+(?:लो|लेलो|ले)/i,
      // Hinglish
      /(?:bhai|bro)?\s*(?:screenshot|ss)\s+(?:lelo|le|lo|lena)/i,
      /(?:screen\s+capture|ss)\s+(?:karo|kar)/i,
    ],
    action: 'screenshot',
  },

  // System power commands
  shutdown: {
    patterns: [
      /(?:shutdown|shut\s+down|power\s+off)/i,
      /(?:system|computer|pc)\s+(?:band|बंद)\s+(?:karo|करो)/i,
      /(?:बंद करो|बंद कर)\s+(?:system|computer|pc)/i,
    ],
    action: 'shutdown',
  },

  restart: {
    patterns: [
      /(?:restart|reboot)/i,
      /(?:system|computer|pc)\s+(?:restart|reboot)\s+(?:karo|करो)/i,
      /(?:फिर से चालू करो|restart करो)/i,
    ],
    action: 'restart',
  },

  sleep: {
    patterns: [
      /(?:sleep|hibernate)/i,
      /(?:system|computer|pc)\s+(?:sleep|सो जाओ)/i,
      /(?:सो जाओ|sleep mode)/i,
    ],
    action: 'sleep',
  },

  // Check installation commands
  check_install: {
    patterns: [
      /(?:check|verify|is)\s+(.+)\s+(?:installed|available)/i,
      /(.+)\s+(?:installed\s+hai|है)/i,
      /(?:kya|क्या)\s+(.+)\s+(?:install\s+hai|installed\s+है)/i,
      /(?:dekho|देखो)\s+(.+)\s+(?:hai|है)/i,
    ],
    action: 'check_install',
    extractTarget: (match) => match[1]?.trim() || '',
  },

  // List programming languages
  list_languages: {
    patterns: [
      /(?:list|show|check)\s+(?:all\s+)?(?:programming\s+)?languages?\s+(?:installed)?/i,
      /(?:कितने|kitne)\s+(?:programming\s+)?(?:languages|भाषाएं)\s+(?:installed\s+hai|हैं)/i,
      /(?:system\s+pe|system\s+में)\s+(?:कौन|kaun)\s+(?:languages|भाषाएं)/i,
    ],
    action: 'list_languages',
  },

  // File explorer
  open_folder: {
    patterns: [
      /(?:open|show|explore)\s+(?:folder|directory)\s+(.+)/i,
      /(.+)\s+(?:folder|फोल्डर)\s+(?:kholo|खोलो)/i,
    ],
    action: 'open_folder',
    extractTarget: (match) => match[1]?.trim() || '',
  },

  // Web search
  search_web: {
    patterns: [
      /(?:search|google|find)\s+(?:for\s+)?(.+)/i,
      /(.+)\s+(?:search\s+karo|खोजो|ढूंढो)/i,
      /(?:google\s+pe|google\s+पर)\s+(.+)\s+(?:search\s+karo|खोजो)/i,
    ],
    action: 'search',
    extractTarget: (match) => match[1]?.trim() || '',
  },
};

// Application name mappings (multilingual)
const APP_MAPPINGS: Record<string, string> = {
  // English
  'chrome': 'chrome',
  'google chrome': 'chrome',
  'browser': 'chrome',
  'notepad': 'notepad',
  'calculator': 'calc',
  'calc': 'calc',
  'file explorer': 'explorer',
  'explorer': 'explorer',
  'files': 'explorer',
  'paint': 'mspaint',
  'ms paint': 'mspaint',
  'command prompt': 'cmd',
  'cmd': 'cmd',
  'terminal': 'cmd',
  'task manager': 'taskmgr',
  'settings': 'ms-settings:',
  'control panel': 'control',
  'vscode': 'code',
  'visual studio code': 'code',
  
  // Hindi/Hinglish
  'ब्राउज़र': 'chrome',
  'नोटपैड': 'notepad',
  'कैलकुलेटर': 'calc',
  'फाइल एक्सप्लोरर': 'explorer',
  'पेंट': 'mspaint',
  'कमांड प्रॉम्प्ट': 'cmd',
  'टास्क मैनेजर': 'taskmgr',
  'सेटिंग्स': 'ms-settings:',
};

export function parseNaturalCommand(input: string): ParsedCommand | null {
  const normalizedInput = input.trim().toLowerCase();
  
  for (const [key, config] of Object.entries(COMMAND_PATTERNS)) {
    for (const pattern of config.patterns) {
      const match = input.match(pattern);
      if (match) {
        let target = config.extractTarget ? config.extractTarget(match) : undefined;
        
        // Normalize application names
        if (target && ['open', 'close'].includes(config.action)) {
          const normalizedTarget = target.toLowerCase().trim();
          target = APP_MAPPINGS[normalizedTarget] || normalizedTarget;
        }
        
        return {
          action: config.action,
          target,
          confidence: 0.9,
        };
      }
    }
  }
  
  // Fallback: Try to detect intent from keywords
  const hindiOpenKeywords = ['खोलो', 'खोल', 'चालू', 'शुरू'];
  const hindiCloseKeywords = ['बंद', 'हटाओ'];
  const hinglishOpenKeywords = ['kholo', 'khol', 'chalu', 'open karo'];
  const hinglishCloseKeywords = ['band karo', 'band kar', 'close karo'];
  
  const words = normalizedInput.split(/\s+/);
  
  for (const keyword of [...hindiOpenKeywords, ...hinglishOpenKeywords]) {
    if (normalizedInput.includes(keyword)) {
      const targetWords = words.filter(w => !keyword.includes(w) && w !== 'bhai' && w !== 'bro' && w !== 'yaar');
      const target = targetWords.join(' ');
      if (target) {
        return {
          action: 'open',
          target: APP_MAPPINGS[target] || target,
          confidence: 0.7,
        };
      }
    }
  }
  
  for (const keyword of [...hindiCloseKeywords, ...hinglishCloseKeywords]) {
    if (normalizedInput.includes(keyword)) {
      const targetWords = words.filter(w => !keyword.includes(w) && w !== 'bhai' && w !== 'bro' && w !== 'yaar');
      const target = targetWords.join(' ');
      if (target) {
        return {
          action: 'close',
          target: APP_MAPPINGS[target] || target,
          confidence: 0.7,
        };
      }
    }
  }
  
  return null;
}

// Execute parsed command via PC Bridge
export async function executeNaturalCommand(command: ParsedCommand): Promise<{ success: boolean; message: string }> {
  const BRIDGE_URL = 'http://127.0.0.1:5001';
  
  try {
    switch (command.action) {
      case 'open': {
        const response = await fetch(`${BRIDGE_URL}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: `start ${command.target}` }),
        });
        const data = await response.json();
        return { success: data.success, message: data.message || `Opened ${command.target}` };
      }
      
      case 'close': {
        const response = await fetch(`${BRIDGE_URL}/close_window`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ window_name: command.target }),
        });
        const data = await response.json();
        return { success: data.success, message: data.message || `Closed ${command.target}` };
      }
      
      case 'screenshot': {
        const response = await fetch(`${BRIDGE_URL}/capture_screenshot`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        return { success: data.success, message: data.message || 'Screenshot captured' };
      }
      
      case 'shutdown':
      case 'restart':
      case 'sleep': {
        const response = await fetch(`${BRIDGE_URL}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: command.action }),
        });
        const data = await response.json();
        return { success: data.success, message: data.message };
      }
      
      case 'check_install': {
        const response = await fetch(`${BRIDGE_URL}/check_installation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ software: command.target }),
        });
        const data = await response.json();
        return { success: true, message: data.message };
      }
      
      case 'list_languages': {
        const languages = ['python', 'node', 'java', 'git'];
        const results: string[] = [];
        
        for (const lang of languages) {
          const response = await fetch(`${BRIDGE_URL}/check_installation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ software: lang }),
          });
          const data = await response.json();
          if (data.installed) {
            results.push(`${lang}: ${data.version}`);
          }
        }
        
        return { 
          success: true, 
          message: results.length > 0 
            ? `Installed languages:\n${results.join('\n')}` 
            : 'No programming languages detected'
        };
      }
      
      case 'search': {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(command.target || '')}`, '_blank');
        return { success: true, message: `Searching for: ${command.target}` };
      }
      
      default:
        return { success: false, message: 'Unknown command' };
    }
  } catch (error) {
    console.error('Command execution error:', error);
    return { success: false, message: 'Failed to execute command. Is PC Bridge running?' };
  }
}

export default parseNaturalCommand;