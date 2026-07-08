// Memory Management System for ALSA AI
export interface Memory {
  [key: string]: string;
}

const MEMORY_KEY = 'alsa_memory';

export const getMemory = (): Memory => {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading memory:', error);
    return {};
  }
};

export const addMemory = (key: string, value: string): void => {
  const memory = getMemory();
  memory[key] = value;
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
};

export const updateMemory = (updates: Memory): void => {
  const memory = getMemory();
  Object.assign(memory, updates);
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
};

export const deleteMemory = (key: string): void => {
  const memory = getMemory();
  delete memory[key];
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
};

export const parseMemoryCommand = (text: string): { key: string; value: string } | null => {
  const lowerText = text.toLowerCase();
  
  // Pattern: "add memory my name is eisa"
  if (lowerText.includes('add memory')) {
    const afterMemory = text.substring(text.toLowerCase().indexOf('add memory') + 10).trim();
    
    // Parse "my name is eisa" or "key is value"
    const patterns = [
      /my name is (.+)/i,
      /i am (.+)/i,
      /(.+) is (.+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = afterMemory.match(pattern);
      if (match) {
        if (pattern.source.includes('my name is')) {
          return { key: 'user_name', value: match[1].trim() };
        } else if (pattern.source.includes('i am')) {
          return { key: 'user_name', value: match[1].trim() };
        } else {
          return { key: match[1].trim().toLowerCase().replace(/\s+/g, '_'), value: match[2].trim() };
        }
      }
    }
  }
  
  return null;
};

export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  const memory = getMemory();
  const userName = memory.user_name || 'Sir';
  
  if (hour >= 5 && hour < 12) {
    return `Good Morning ${userName}`;
  } else if (hour >= 12 && hour < 17) {
    return `Good Afternoon ${userName}`;
  } else if (hour >= 17 && hour < 21) {
    return `Good Evening ${userName}`;
  } else {
    return `Good Night ${userName}`;
  }
};
