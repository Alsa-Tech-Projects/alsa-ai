import { useState, useCallback, useRef, useEffect } from 'react';

// Clean text for speech - remove markdown, emojis, special characters
const cleanTextForSpeech = (text: string): string => {
  return text
    // Remove markdown formatting
    .replace(/\*+/g, '') // asterisks
    .replace(/_+/g, '') // underscores
    .replace(/`+/g, '') // backticks
    .replace(/#+\s*/g, '') // headers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links [text](url) -> text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // images ![alt](url)
    .replace(/^>\s*/gm, '') // blockquotes
    .replace(/^[-*+]\s+/gm, '') // list items
    .replace(/^\d+\.\s+/gm, '') // numbered lists
    .replace(/---+/g, '') // horizontal rules
    .replace(/\|\s*[-:]+\s*\|/g, '') // table separators
    // Remove ALL emojis using comprehensive regex
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    // Remove remaining emoji-like symbols
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    // Remove special symbols and bullets
    .replace(/[•●○◆◇■□▪▫▲△▼▽◀▶►◄→←↑↓↔↕↖↗↘↙]/g, '')
    .replace(/[✓✔✕✖✗✘✚✛✜✝✞✟✠✡✢✣✤✥✦✧✨✩✪✫✬✭✮✯✰✱✲✳✴✵✶✷✸✹✺✻✼✽✾✿❀❁❂❃❄❅❆❇❈❉❊❋]/g, '')
    .replace(/[❌❎❓❔❕❖❗❘❙❚❛❜❝❞❟❠❡❢❣❤❥❦❧]/g, '')
    .replace(/[☀☁☂☃☄★☆☇☈☉☊☋☌☍☎☏☐☑☒☓☔☕☖☗☘☙☚☛☜☝☞☟☠☡☢☣☤☥☦☧☨☩☪☫☬☭☮☯]/g, '')
    // Clean up code blocks but keep the content
    .replace(/```[\w]*\n?/g, '') // code fence markers
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim();
};

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
    'chaliye', 'jaiye', 'aaiye', 'baitho', 'suno', 'dekho', 'padho', 'likho'
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

// Enhanced emotion detection with more feelings
interface EmotionSettings {
  pitch: number;
  rate: number;
  volume: number;
  emotion: string;
}

const detectEmotion = (text: string): EmotionSettings => {
  const lowerText = text.toLowerCase();
  
  // Excited/Happy - upbeat, energetic tone
  if (/(!{2,}|wow|amazing|great|awesome|fantastic|excellent|yay|hurray|wonderful|incredible|brilliant|congratulations|congrats|party|celebrate|happy|joy|खुशी|खुश|मज़ा|badhai|mubarak|mazaa)/i.test(lowerText)) {
    return { pitch: 1.3, rate: 1.15, volume: 1.0, emotion: 'happy' };
  }
  
  // Loving/Caring - warm, gentle tone
  if (/love|dear|care|support|together|miss|hug|kiss|sweetheart|honey|darling|pyaar|mohabbat|dil|jaan|jaanu|baby/i.test(lowerText)) {
    return { pitch: 1.15, rate: 0.88, volume: 0.92, emotion: 'loving' };
  }
  
  // Sad/Sympathetic - softer, slower, lower tone
  if (/sorry|unfortunately|sadly|regret|condolence|miss you|loss|passed away|heartbroken|crying|tears|pain|hurt|दुख|अफ़सोस|माफ़|rona|dard|takleef|udaas/i.test(lowerText)) {
    return { pitch: 0.8, rate: 0.75, volume: 0.8, emotion: 'sad' };
  }
  
  // Angry/Frustrated - stronger, slightly faster, intense
  if (/angry|frustrated|annoyed|irritated|upset|furious|hate|stupid|idiot|damn|what the|gussa|naraz|pagal/i.test(lowerText)) {
    return { pitch: 1.15, rate: 1.15, volume: 1.0, emotion: 'angry' };
  }
  
  // Urgent/Warning - intense, faster tone
  if (/warning|urgent|important|critical|danger|alert|emergency|immediately|now|hurry|quick|fast|jaldi|abhi|turant|चेतावनी|ख़तरा/i.test(lowerText)) {
    return { pitch: 1.2, rate: 1.25, volume: 1.0, emotion: 'urgent' };
  }
  
  // Calm/Reassuring - steady, soothing tone
  if (/calm|relax|don't worry|it's okay|no problem|peace|safe|breathe|easy|slow down|fikar mat|tension mat|theek hai|sab theek/i.test(lowerText)) {
    return { pitch: 0.92, rate: 0.8, volume: 0.88, emotion: 'calm' };
  }
  
  // Curious/Question - slightly higher pitch
  if (/\?|what|how|why|when|where|who|which|kya|kaise|kyun|kab|kahan|kaun/i.test(lowerText)) {
    return { pitch: 1.12, rate: 0.95, volume: 0.95, emotion: 'curious' };
  }
  
  // Confident/Assertive - clear, steady, strong
  if (/definitely|absolutely|certainly|of course|sure|guaranteed|promise|bilkul|zaroor|pakka|definitely|100%/i.test(lowerText)) {
    return { pitch: 1.08, rate: 1.0, volume: 1.0, emotion: 'confident' };
  }
  
  // Surprised/Shocked - higher pitch, slower
  if (/oh my|really|seriously|no way|what!|shocked|surprised|unbelievable|kya!|sach|arey|arrey|oho/i.test(lowerText)) {
    return { pitch: 1.25, rate: 0.9, volume: 1.0, emotion: 'surprised' };
  }
  
  // Thoughtful/Explaining - moderate, clear
  if (/let me explain|basically|actually|in other words|the thing is|samjho|matlab|dekho|suniye/i.test(lowerText)) {
    return { pitch: 1.0, rate: 0.9, volume: 0.95, emotion: 'thoughtful' };
  }
  
  // Default - neutral, friendly
  return { pitch: 1.0, rate: 0.92, volume: 0.95, emotion: 'neutral' };
};

// Get voice preferences from localStorage
interface VoicePreferences {
  gender: 'male' | 'female' | 'auto';
  language: 'hinglish' | 'english' | 'hindi';
  emotionEnabled: boolean;
}

const getVoicePreferences = (): VoicePreferences => {
  try {
    const prefs = localStorage.getItem('alsa_voice_preferences');
    if (prefs) {
      const parsed = JSON.parse(prefs);
      return {
        gender: parsed.gender || 'male',
        language: parsed.language || 'hinglish',
        emotionEnabled: parsed.emotionEnabled !== false
      };
    }
  } catch (e) {
    console.error('Error loading voice preferences:', e);
  }
  return { gender: 'male', language: 'hinglish', emotionEnabled: true };
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
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

  const speak = useCallback((text: string, forceLang?: string) => {
    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      // Clean the text before speaking
      const cleanedText = cleanTextForSpeech(text);
      
      if (!cleanedText.trim()) {
        console.log('No speakable text after cleaning');
        return;
      }
      
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      synthRef.current = utterance;

      // Detect language and emotion
      const detectedLang = forceLang || detectLanguage(text);
      const voicePrefs = getVoicePreferences();
      const emotionSettings = voicePrefs.emotionEnabled ? detectEmotion(text) : { pitch: 1.0, rate: 0.92, volume: 0.95, emotion: 'neutral' };
      
      setCurrentEmotion(emotionSettings.emotion);
      
      // Set voice properties with emotion
      utterance.rate = emotionSettings.rate;
      utterance.pitch = emotionSettings.pitch;
      utterance.volume = emotionSettings.volume;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Find best voice for language with gender preference
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      const preferMale = voicePrefs.gender === 'male' || voicePrefs.gender === 'auto';
      
      if (detectedLang === 'hi-IN' || isHinglishContent(text) || voicePrefs.language === 'hinglish' || voicePrefs.language === 'hindi') {
        // For Hinglish/Hindi - prioritize male Indian English/Hindi voices
        const hindiVoices = voices.filter(v => 
          v.lang.startsWith('hi') || 
          v.lang === 'en-IN' ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi')
        );
        
        if (preferMale) {
          selectedVoice = hindiVoices.find(v => 
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('ravi') ||
            v.name.toLowerCase().includes('hemant') ||
            v.name.toLowerCase().includes('microsoft ravi') ||
            (!v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('lekha'))
          ) || hindiVoices[0];
        } else {
          selectedVoice = hindiVoices.find(v => 
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('lekha') ||
            v.name.toLowerCase().includes('heera')
          ) || hindiVoices[0];
        }
        
        // Fallback to any Indian voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang === 'en-IN') || 
                          voices.find(v => v.lang.startsWith('hi'));
        }
        
        // Adjust rate for Hinglish - slightly slower for clarity
        utterance.rate = Math.max(0.8, emotionSettings.rate - 0.05);
        utterance.lang = selectedVoice?.lang.startsWith('hi') ? 'hi-IN' : 'en-IN';
      } else {
        // Find voice matching detected language with gender preference
        const langVoices = voices.filter(v => 
          v.lang === detectedLang || v.lang.startsWith(detectedLang.split('-')[0])
        );
        
        if (preferMale) {
          selectedVoice = langVoices.find(v => 
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('david') ||
            v.name.toLowerCase().includes('mark') ||
            v.name.toLowerCase().includes('james') ||
            v.name.toLowerCase().includes('guy') ||
            (!v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('zira') && !v.name.toLowerCase().includes('samantha'))
          ) || langVoices[0];
        } else {
          selectedVoice = langVoices.find(v => 
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha') ||
            v.name.toLowerCase().includes('susan')
          ) || langVoices[0];
        }
        
        utterance.lang = detectedLang;
      }
      
      // Prefer Google or Microsoft voices for quality
      if (!selectedVoice) {
        const qualityVoices = voices.filter(v => 
          v.lang.startsWith(detectedLang.split('-')[0]) &&
          (v.name.includes('Google') || v.name.includes('Microsoft'))
        );
        
        if (preferMale) {
          selectedVoice = qualityVoices.find(v => !v.name.toLowerCase().includes('female')) || qualityVoices[0];
        } else {
          selectedVoice = qualityVoices.find(v => v.name.toLowerCase().includes('female')) || qualityVoices[0];
        }
      }
      
      // Fallback to any English voice
      if (!selectedVoice) {
        const englishVoices = voices.filter(v => v.lang.startsWith('en'));
        if (preferMale) {
          selectedVoice = englishVoices.find(v => !v.name.toLowerCase().includes('female')) || englishVoices[0] || voices[0];
        } else {
          selectedVoice = englishVoices.find(v => v.name.toLowerCase().includes('female')) || englishVoices[0] || voices[0];
        }
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`🎤 Voice: ${selectedVoice.name} | Emotion: ${emotionSettings.emotion} | Pitch: ${emotionSettings.pitch.toFixed(2)} | Rate: ${emotionSettings.rate.toFixed(2)}`);
      }

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentEmotion('neutral');
        synthRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error('Text-to-speech error:', event);
        setIsSpeaking(false);
        setCurrentEmotion('neutral');
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
    setCurrentEmotion('neutral');
  }, []);

  return { speak, stop, isSpeaking, currentEmotion, availableVoices };
};
