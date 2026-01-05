import { useState, useCallback, useRef, useEffect } from 'react';

// Detect if text contains Hindi/Devanagari characters
const containsHindi = (text: string): boolean => {
  const hindiPattern = /[\u0900-\u097F]/;
  return hindiPattern.test(text);
};

// Detect if text is primarily Hindi (romanized or Devanagari) - Hinglish detection
const isHinglishContent = (text: string): boolean => {
  // Check for Devanagari script
  if (containsHindi(text)) return true;
  
  // Check for common Hindi/Hinglish romanized words
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
  
  // If more than 15% of words are Hinglish keywords
  return hinglishWordCount / words.length > 0.15;
};

// Detect language from text
const detectLanguage = (text: string): string => {
  // Arabic
  if (/[\u0600-\u06FF]/.test(text)) return 'ar-SA';
  // Chinese
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN';
  // Japanese
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(text)) return 'ja-JP';
  // Korean
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko-KR';
  // Russian/Cyrillic
  if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU';
  // German
  if (/[äöüßÄÖÜ]/.test(text)) return 'de-DE';
  // French
  if (/[àâçéèêëîïôùûüÿœæ]/i.test(text)) return 'fr-FR';
  // Spanish
  if (/[áéíóúñ¿¡]/i.test(text)) return 'es-ES';
  // Portuguese
  if (/[ãõç]/i.test(text)) return 'pt-BR';
  // Hindi/Devanagari
  if (containsHindi(text)) return 'hi-IN';
  // Hinglish (romanized Hindi)
  if (isHinglishContent(text)) return 'hi-IN';
  // Urdu
  if (/[\u0600-\u06FF\u0750-\u077F]/.test(text)) return 'ur-PK';
  
  return 'en-US';
};

// Voice emotion detection from text
const detectEmotion = (text: string): { pitch: number; rate: number } => {
  const lowerText = text.toLowerCase();
  
  // Excited/Happy
  if (/(!{2,}|wow|amazing|great|awesome|fantastic|excellent|yay|hurray|खुशी|खुश|मज़ा)/i.test(lowerText)) {
    return { pitch: 1.2, rate: 1.1 };
  }
  
  // Sad/Sympathetic
  if (/sorry|unfortunately|sadly|regret|condolence|दुख|अफ़सोस|माफ़|sorry/i.test(lowerText)) {
    return { pitch: 0.9, rate: 0.9 };
  }
  
  // Urgent/Warning
  if (/warning|urgent|important|critical|danger|alert|emergency|चेतावनी|ख़तरा/i.test(lowerText)) {
    return { pitch: 1.1, rate: 1.15 };
  }
  
  // Question
  if (/\?/.test(text)) {
    return { pitch: 1.05, rate: 1.0 };
  }
  
  // Calm/Informative (default)
  return { pitch: 1.0, rate: 0.95 };
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

  const speak = useCallback((text: string, forceLang?: string) => {
    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      setIsSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      synthRef.current = utterance;

      // Detect language and emotion
      const detectedLang = forceLang || detectLanguage(text);
      const emotion = detectEmotion(text);
      
      // Set voice properties with emotion
      utterance.rate = emotion.rate;
      utterance.pitch = emotion.pitch;
      utterance.volume = 1.0;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Find best voice for language
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      if (detectedLang === 'hi-IN' || isHinglishContent(text)) {
        // For Hinglish/Hindi - try to find Indian English voice first (sounds more natural for Hinglish)
        selectedVoice = voices.find(v => 
          v.lang === 'en-IN' || 
          v.name.toLowerCase().includes('india')
        ) || voices.find(v => 
          v.lang.startsWith('hi') || 
          v.name.toLowerCase().includes('hindi')
        );
        
        // Adjust rate for Hinglish - slightly slower for clarity
        utterance.rate = Math.max(0.85, emotion.rate - 0.1);
        utterance.lang = selectedVoice?.lang.startsWith('hi') ? 'hi-IN' : 'en-IN';
      } else {
        // Find voice matching detected language
        selectedVoice = voices.find(v => v.lang === detectedLang) ||
                        voices.find(v => v.lang.startsWith(detectedLang.split('-')[0]));
        utterance.lang = detectedLang;
      }
      
      // Prefer Google or Microsoft voices for quality
      if (!selectedVoice) {
        const qualityVoice = voices.find(v => 
          v.lang.startsWith(detectedLang.split('-')[0]) &&
          (v.name.includes('Google') || v.name.includes('Microsoft'))
        );
        if (qualityVoice) selectedVoice = qualityVoice;
      }
      
      // Fallback to any English voice
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang}) with pitch: ${emotion.pitch}, rate: ${emotion.rate}`);
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
