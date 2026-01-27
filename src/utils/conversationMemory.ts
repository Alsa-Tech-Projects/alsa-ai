// Enhanced conversation memory persistence
// Stores user preferences, interaction patterns, and past conversations

interface UserPreference {
  key: string;
  value: string;
  learnedAt: string;
  confidence: number; // 0-1 how confident we are about this
}

interface InteractionPattern {
  command: string;
  frequency: number;
  lastUsed: string;
  preferredResponse?: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  keyTopics: string[];
  timestamp: string;
}

interface ConversationMemory {
  userPreferences: UserPreference[];
  interactionPatterns: InteractionPattern[];
  recentConversations: ConversationSummary[];
  userName?: string;
  userNickname?: string;
  favoriteTopics: string[];
  avoidTopics: string[];
  lastInteraction: string;
}

const MEMORY_KEY = 'alsa_conversation_memory';
const MAX_CONVERSATIONS = 50;
const MAX_PATTERNS = 100;

// Get the full conversation memory
export const getConversationMemory = (): ConversationMemory => {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error reading conversation memory:', error);
  }
  return {
    userPreferences: [],
    interactionPatterns: [],
    recentConversations: [],
    favoriteTopics: [],
    avoidTopics: [],
    lastInteraction: new Date().toISOString()
  };
};

// Save the full conversation memory
const saveConversationMemory = (memory: ConversationMemory): void => {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (error) {
    console.error('Error saving conversation memory:', error);
  }
};

// Learn a user preference from conversation
export const learnUserPreference = (key: string, value: string, confidence = 0.7): void => {
  const memory = getConversationMemory();
  
  // Check if preference already exists
  const existingIndex = memory.userPreferences.findIndex(p => p.key.toLowerCase() === key.toLowerCase());
  
  if (existingIndex !== -1) {
    // Update existing with higher confidence
    memory.userPreferences[existingIndex] = {
      ...memory.userPreferences[existingIndex],
      value,
      confidence: Math.min(1, memory.userPreferences[existingIndex].confidence + 0.1),
      learnedAt: new Date().toISOString()
    };
  } else {
    // Add new preference
    memory.userPreferences.push({
      key,
      value,
      learnedAt: new Date().toISOString(),
      confidence
    });
  }
  
  saveConversationMemory(memory);
};

// Get a user preference
export const getUserPreference = (key: string): string | null => {
  const memory = getConversationMemory();
  const pref = memory.userPreferences.find(p => p.key.toLowerCase() === key.toLowerCase());
  return pref ? pref.value : null;
};

// Track interaction pattern
export const trackInteraction = (command: string): void => {
  const memory = getConversationMemory();
  const normalizedCommand = command.toLowerCase().trim();
  
  const existingIndex = memory.interactionPatterns.findIndex(p => 
    p.command.toLowerCase() === normalizedCommand
  );
  
  if (existingIndex !== -1) {
    memory.interactionPatterns[existingIndex].frequency++;
    memory.interactionPatterns[existingIndex].lastUsed = new Date().toISOString();
  } else {
    memory.interactionPatterns.push({
      command: normalizedCommand,
      frequency: 1,
      lastUsed: new Date().toISOString()
    });
  }
  
  // Keep only top patterns
  if (memory.interactionPatterns.length > MAX_PATTERNS) {
    memory.interactionPatterns.sort((a, b) => b.frequency - a.frequency);
    memory.interactionPatterns = memory.interactionPatterns.slice(0, MAX_PATTERNS);
  }
  
  memory.lastInteraction = new Date().toISOString();
  saveConversationMemory(memory);
};

// Get most frequent commands
export const getFrequentCommands = (limit = 5): string[] => {
  const memory = getConversationMemory();
  return memory.interactionPatterns
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit)
    .map(p => p.command);
};

// Add conversation summary
export const addConversationSummary = (
  id: string, 
  title: string, 
  summary: string, 
  keyTopics: string[]
): void => {
  const memory = getConversationMemory();
  
  // Check if conversation already exists
  const existingIndex = memory.recentConversations.findIndex(c => c.id === id);
  
  if (existingIndex !== -1) {
    memory.recentConversations[existingIndex] = {
      id,
      title,
      summary,
      keyTopics,
      timestamp: new Date().toISOString()
    };
  } else {
    memory.recentConversations.unshift({
      id,
      title,
      summary,
      keyTopics,
      timestamp: new Date().toISOString()
    });
  }
  
  // Keep only recent conversations
  if (memory.recentConversations.length > MAX_CONVERSATIONS) {
    memory.recentConversations = memory.recentConversations.slice(0, MAX_CONVERSATIONS);
  }
  
  // Update favorite topics based on frequency
  keyTopics.forEach(topic => {
    if (!memory.favoriteTopics.includes(topic)) {
      memory.favoriteTopics.push(topic);
    }
  });
  
  // Keep top 20 favorite topics
  if (memory.favoriteTopics.length > 20) {
    memory.favoriteTopics = memory.favoriteTopics.slice(0, 20);
  }
  
  saveConversationMemory(memory);
};

// Set user name
export const setUserName = (name: string, nickname?: string): void => {
  const memory = getConversationMemory();
  memory.userName = name;
  if (nickname) memory.userNickname = nickname;
  saveConversationMemory(memory);
};

// Get user name
export const getUserName = (): { name?: string; nickname?: string } => {
  const memory = getConversationMemory();
  return {
    name: memory.userName,
    nickname: memory.userNickname
  };
};

// Get personalized greeting
export const getPersonalizedGreeting = (): string => {
  const memory = getConversationMemory();
  const hour = new Date().getHours();
  
  let greeting = '';
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else if (hour < 21) greeting = 'Good evening';
  else greeting = 'Hello';
  
  // Personalize with name
  const name = memory.userNickname || memory.userName;
  if (name) {
    greeting += `, ${name}`;
  }
  
  // Add context based on last interaction
  if (memory.lastInteraction) {
    const lastTime = new Date(memory.lastInteraction);
    const now = new Date();
    const hoursSince = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursSince > 24 * 7) {
      greeting += "! It's been a while. Welcome back";
    } else if (hoursSince > 24) {
      greeting += "! Nice to see you again";
    }
  }
  
  return greeting + '!';
};

// Get context for AI from memory
export const getAIContext = (): string => {
  const memory = getConversationMemory();
  const parts: string[] = [];
  
  // User name context
  const name = memory.userName || memory.userNickname;
  if (name) {
    parts.push(`User's name is ${name}.`);
  }
  
  // User preferences
  if (memory.userPreferences.length > 0) {
    const highConfidencePrefs = memory.userPreferences
      .filter(p => p.confidence > 0.5)
      .slice(0, 10);
    
    if (highConfidencePrefs.length > 0) {
      parts.push('User preferences: ' + highConfidencePrefs.map(p => `${p.key}: ${p.value}`).join(', '));
    }
  }
  
  // Favorite topics
  if (memory.favoriteTopics.length > 0) {
    parts.push(`User often discusses: ${memory.favoriteTopics.slice(0, 5).join(', ')}`);
  }
  
  // Recent conversation context
  if (memory.recentConversations.length > 0) {
    const recent = memory.recentConversations.slice(0, 3);
    parts.push('Recent conversation topics: ' + recent.map(c => c.title).join(', '));
  }
  
  return parts.join(' ');
};

// Parse user message for learnable info
export const parseAndLearn = (message: string): void => {
  const lowerMessage = message.toLowerCase();
  
  // Learn name
  const namePatterns = [
    /my name is (\w+)/i,
    /i am (\w+)/i,
    /call me (\w+)/i,
    /i'm (\w+)/i,
    /mera naam (\w+)/i,
    /naam (\w+) hai/i
  ];
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      setUserName(match[1]);
      break;
    }
  }
  
  // Learn preferences
  const preferencePatterns = [
    { pattern: /i (love|like|prefer|enjoy) (\w+)/i, key: 'likes' },
    { pattern: /i (hate|dislike|don't like) (\w+)/i, key: 'dislikes' },
    { pattern: /my favorite (\w+) is (\w+)/i, key: 'favorite_$1' },
    { pattern: /i work (at|in|for) (.+)/i, key: 'workplace' },
    { pattern: /i live in (.+)/i, key: 'location' },
    { pattern: /i am a (.+)/i, key: 'profession' },
  ];
  
  for (const { pattern, key } of preferencePatterns) {
    const match = message.match(pattern);
    if (match) {
      const actualKey = key.includes('$1') ? key.replace('$1', match[1]) : key;
      const value = match[match.length - 1];
      learnUserPreference(actualKey, value);
    }
  }
  
  // Track the interaction
  trackInteraction(message);
};

// Clear all memory
export const clearConversationMemory = (): void => {
  localStorage.removeItem(MEMORY_KEY);
};
