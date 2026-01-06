import { useState, useCallback, useRef, useEffect } from 'react';

export type VoiceGender = 'male' | 'female' | 'auto';

export interface VoiceOptions {
  gender?: VoiceGender;
  language?: string;
}

// Male Hinglish/Indian voice names
const MALE_VOICE_NAMES = [
  'ravi', 'prem', 'hemant', 'kalpana', 'google हिन्दी', 'microsoft ravi',
  'male', 'indian male', 'en-in male', 'hi-in male'
];

// Female Hinglish/Indian voice names
const FEMALE_VOICE_NAMES = [
  'heera', 'priya', 'swara', 'neha', 'google हिन्दी', 'microsoft heera',
  'female', 'indian female', 'en-in female', 'hi-in female'
];

// Detect if text contains Hindi/Devanagari characters
const containsHindi = (text: string): boolean => {
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text);
};

// Detect if text is primarily Hindi (romanized or Devanagari) - Hinglish detection
const isHinglishContent = (text: string): boolean => {
  if (containsHindi(text)) return true;
  
  const hinglishKeywords = [
    'kya', 'hai', 'hain', 'mein', 'aap', 'tum', 'main', 'hum', 'kaise', 'kaisa',
    'kahan', 'kyun', 'kab', 'abhi', 'acha', 'theek', 'nahi', 'haan', 'ji',
    'bhai', 'bhaiya', 'didi', 'yeh', 'woh', 'karo', 'karna', 'raha', 'rahi',
    'chahiye', 'sakta', 'sakti', 'aur', 'lekin', 'agar', 'toh', 'phir',
    'bahut', 'accha', 'bura', 'sunao', 'batao', 'bolo', 'dekho', 'chalo',
    'namaste', 'shukriya', 'dhanyavaad', 'kripya', 'maaf', 'bolo', 'sunao',
    'yaar', 'dost', 'pyaar', 'mohabbat', 'dil', 'jaan', 'zindagi', 'khushi',
    'matlab', 'samajh', 'pata', 'maloom', 'zaroor', 'bilkul', 'sahi', 'galat',
    'kholo', 'kholna', 'band', 'kardo', 'karden', 'dijiye', 'kijiye', 'lijiye',
    'chaliye', 'jaiye', 'aaiye', 'baitho', 'suno', 'dekho', 'padho', 'likho',
    'mast', 'zabardast', 'kamaal', 'jhakkas', 'bindaas', 'pataka', 'dhamaka'
  ];
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  const hinglishWordCount = words.filter(word => 
    hinglishKeywords.some(kw => word.includes(kw))
  ).length;
  
  return hinglishWordCount / words.length > 0.15;
};

// Detect language from text
const detectLanguage = (text: string): string => {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN';
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(text)) return 'ja-JP';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko-KR';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU';
  if (/[äöüßÄÖÜ]/.test(text)) return 'de-DE';
  if (/[àâçéèêëîïôùûüÿœæ]/i.test(text)) return 'fr-FR';
  if (/[áéíóúñ¿¡]/i.test(text)) return 'es-ES';
  if (/[ãõç]/i.test(text)) return 'pt-BR';
  if (containsHindi(text)) return 'hi-IN';
  if (isHinglishContent(text)) return 'hi-IN';
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) return 'ur-PK';
  
  return 'en-US';
};

// Enhanced emotion detection with Hinglish keywords
const detectEmotion = (text: string): { pitch: number; rate: number } => {
  const lowerText = text.toLowerCase();
  
  // Excited/Happy - includes more Hinglish
  if (/(!{2,}|wow|amazing|great|awesome|fantastic|excellent|yay|hurray|खुशी|खुश|मज़ा|mast|zabardast|kamaal|jhakkas|bindaas|dhamaka|pataka)/i.test(lowerText)) {
    return { pitch: 1.2, rate: 1.1 };
  }
  
  // Sad/Sympathetic - includes Hinglish
  if (/sorry|unfortunately|sadly|regret|condolence|दुख|अफ़सोस|माफ़|udaas|takleef|pareshaan|dukhi|rona|aansu/i.test(lowerText)) {
    return { pitch: 0.9, rate: 0.9 };
  }
  
  // Urgent/Warning - includes Hinglish
  if (/warning|urgent|important|critical|danger|alert|emergency|चेतावनी|ख़तरा|jaldi|fauran|abhi|turant|fatafat/i.test(lowerText)) {
    return { pitch: 1.1, rate: 1.15 };
  }
  
  // Question
  if (/\?/.test(text)) {
    return { pitch: 1.05, rate: 1.0 };
  }
  
  // Calm/Informative (default)
  return { pitch: 1.0, rate: 0.95 };
};

// Find voice by gender preference
const findVoiceByGender = (
  voices: SpeechSynthesisVoice[],
  gender: VoiceGender,
  isHinglish: boolean
): SpeechSynthesisVoice | null => {
  const targetNames = gender === 'male' ? MALE_VOICE_NAMES : FEMALE_VOICE_NAMES;
  
  // For Hinglish, prioritize Indian English voices
  const langPriority = isHinglish 
    ? ['en-IN', 'hi-IN', 'en-US', 'en-GB'] 
    : ['en-US', 'en-GB', 'en-IN'];

  for (const lang of langPriority) {
    // Try to find voice matching gender keywords
    for (const namePart of targetNames) {
      const match = voices.find(v => 
        v.lang.startsWith(lang.split('-')[0]) &&
        v.name.toLowerCase().includes(namePart.toLowerCase())
      );
      if (match) return match;
    }
    
    // Fallback: any voice for this language
    const langMatch = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
    if (langMatch) return langMatch;
  }

  return null;
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, options?: VoiceOptions) => {
    try {
      window.speechSynthesis.cancel();
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current = utterance;

      const detectedLang = options?.language || detectLanguage(text);
      const emotion = detectEmotion(text);
      const gender = options?.gender || 'auto';
      const isHinglish = isHinglishContent(text) || detectedLang === 'hi-IN';
      
      // Set voice properties with emotion
      utterance.rate = emotion.rate;
      utterance.pitch = emotion.pitch;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      // Try to find gender-specific voice
      if (gender !== 'auto') {
        selectedVoice = findVoiceByGender(voices, gender, isHinglish);
      }
      
      // Fallback: Hinglish-optimized voice selection
      if (!selectedVoice && isHinglish) {
        selectedVoice = voices.find(v => 
          v.lang === 'en-IN' || v.name.toLowerCase().includes('india')
        ) || voices.find(v => 
          v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')
        );
        
        // Adjust rate for Hinglish - slightly slower for clarity
        utterance.rate = Math.max(0.85, emotion.rate - 0.1);
        utterance.lang = selectedVoice?.lang.startsWith('hi') ? 'hi-IN' : 'en-IN';
      }
      
      // Standard language matching
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang === detectedLang) ||
                        voices.find(v => v.lang.startsWith(detectedLang.split('-')[0]));
        utterance.lang = detectedLang;
      }
      
      // Prefer quality voices (Google/Microsoft)
      if (!selectedVoice) {
        const qualityVoice = voices.find(v => 
          v.lang.startsWith(detectedLang.split('-')[0]) &&
          (v.name.includes('Google') || v.name.includes('Microsoft'))
        );
        if (qualityVoice) selectedVoice = qualityVoice;
      }
      
      // Final fallback
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang}) | Gender: ${gender} | Pitch: ${emotion.pitch}, Rate: ${utterance.rate}`);
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        synthRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Text-to-speech error:', event);
        setIsSpeaking(false);
        synthRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    synthRef.current = null;
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, availableVoices };
};
