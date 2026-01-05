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
    // Remove emojis (all Unicode emoji ranges)
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // misc symbols & pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // transport & map symbols
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '') // misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '') // dingbats
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // supplemental symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // chess symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // symbols extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '') // watch, hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '') // media controls
    .replace(/[\u{23F8}-\u{23FA}]/gu, '') // media controls
    .replace(/[\u{25AA}-\u{25AB}]/gu, '') // squares
    .replace(/[\u{25B6}]/gu, '') // play button
    .replace(/[\u{25C0}]/gu, '') // reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '') // squares
    .replace(/[\u{2614}-\u{2615}]/gu, '') // umbrella, coffee
    .replace(/[\u{2648}-\u{2653}]/gu, '') // zodiac
    .replace(/[\u{267F}]/gu, '') // wheelchair
    .replace(/[\u{2693}]/gu, '') // anchor
    .replace(/[\u{26A1}]/gu, '') // high voltage
    .replace(/[\u{26AA}-\u{26AB}]/gu, '') // circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '') // sports
    .replace(/[\u{26C4}-\u{26C5}]/gu, '') // weather
    .replace(/[\u{26CE}]/gu, '') // ophiuchus
    .replace(/[\u{26D4}]/gu, '') // no entry
    .replace(/[\u{26EA}]/gu, '') // church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '') // fountain, golf
    .replace(/[\u{26F5}]/gu, '') // sailboat
    .replace(/[\u{26FA}]/gu, '') // tent
    .replace(/[\u{26FD}]/gu, '') // fuel pump
    .replace(/[\u{2702}]/gu, '') // scissors
    .replace(/[\u{2705}]/gu, '') // check mark
    .replace(/[\u{2708}-\u{270D}]/gu, '') // airplane to writing hand
    .replace(/[\u{270F}]/gu, '') // pencil
    .replace(/[\u{2712}]/gu, '') // black nib
    .replace(/[\u{2714}]/gu, '') // check mark
    .replace(/[\u{2716}]/gu, '') // x mark
    .replace(/[\u{271D}]/gu, '') // cross
    .replace(/[\u{2721}]/gu, '') // star of david
    .replace(/[\u{2728}]/gu, '') // sparkles
    .replace(/[\u{2733}-\u{2734}]/gu, '') // asterisks
    .replace(/[\u{2744}]/gu, '') // snowflake
    .replace(/[\u{2747}]/gu, '') // sparkle
    .replace(/[\u{274C}]/gu, '') // cross mark
    .replace(/[\u{274E}]/gu, '') // cross mark
    .replace(/[\u{2753}-\u{2755}]/gu, '') // question marks
    .replace(/[\u{2757}]/gu, '') // exclamation
    .replace(/[\u{2763}-\u{2764}]/gu, '') // hearts
    .replace(/[\u{2795}-\u{2797}]/gu, '') // math symbols
    .replace(/[\u{27A1}]/gu, '') // arrow
    .replace(/[\u{27B0}]/gu, '') // curly loop
    .replace(/[\u{27BF}]/gu, '') // double curly loop
    // Remove other special symbols
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

// Enhanced voice emotion detection with feelings
const detectEmotion = (text: string): { pitch: number; rate: number; volume: number } => {
  const lowerText = text.toLowerCase();
  
  // Excited/Happy - upbeat, energetic tone
  if (/(!{2,}|wow|amazing|great|awesome|fantastic|excellent|yay|hurray|खुशी|खुश|मज़ा|badhai|mubarak|wonderful|incredible|brilliant)/i.test(lowerText)) {
    return { pitch: 1.25, rate: 1.15, volume: 1.0 };
  }
  
  // Loving/Caring - warm, gentle tone
  if (/love|dear|care|support|together|pyaar|mohabbat|dil|jaan|sweetheart|honey/i.test(lowerText)) {
    return { pitch: 1.1, rate: 0.9, volume: 0.95 };
  }
  
  // Sad/Sympathetic - softer, slower tone
  if (/sorry|unfortunately|sadly|regret|condolence|दुख|अफ़सोस|माफ़|miss you|loss|passed away|heartbroken/i.test(lowerText)) {
    return { pitch: 0.85, rate: 0.8, volume: 0.85 };
  }
  
  // Urgent/Warning - intense, faster tone
  if (/warning|urgent|important|critical|danger|alert|emergency|चेतावनी|ख़तरा|immediately|now|hurry/i.test(lowerText)) {
    return { pitch: 1.15, rate: 1.2, volume: 1.0 };
  }
  
  // Angry/Frustrated - stronger, slightly faster
  if (/angry|frustrated|annoyed|irritated|gussa|upset|furious/i.test(lowerText)) {
    return { pitch: 1.1, rate: 1.1, volume: 1.0 };
  }
  
  // Calm/Reassuring - steady, soothing tone
  if (/calm|relax|don't worry|it's okay|no problem|fikar mat|theek hai|peace|safe/i.test(lowerText)) {
    return { pitch: 0.95, rate: 0.85, volume: 0.9 };
  }
  
  // Question - slightly higher pitch at end
  if (/\?/.test(text)) {
    return { pitch: 1.08, rate: 0.95, volume: 0.95 };
  }
  
  // Confident/Assertive - clear, steady
  if (/definitely|absolutely|certainly|of course|bilkul|zaroor|sure/i.test(lowerText)) {
    return { pitch: 1.05, rate: 1.0, volume: 1.0 };
  }
  
  // Calm/Informative (default)
  return { pitch: 1.0, rate: 0.95, volume: 1.0 };
};

// Get voice preferences from localStorage
const getVoicePreferences = (): { gender: 'male' | 'female' | 'auto'; language: string } => {
  try {
    const prefs = localStorage.getItem('alsa_voice_preferences');
    if (prefs) {
      return JSON.parse(prefs);
    }
  } catch (e) {
    console.error('Error loading voice preferences:', e);
  }
  return { gender: 'male', language: 'hinglish' };
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
      const emotion = detectEmotion(text);
      const voicePrefs = getVoicePreferences();
      
      // Set voice properties with emotion
      utterance.rate = emotion.rate;
      utterance.pitch = emotion.pitch;
      utterance.volume = emotion.volume;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      
      // Find best voice for language with gender preference
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      const preferMale = voicePrefs.gender === 'male' || voicePrefs.gender === 'auto';
      
      if (detectedLang === 'hi-IN' || isHinglishContent(text) || voicePrefs.language === 'hinglish') {
        // For Hinglish/Hindi - prioritize male Indian English/Hindi voices
        const hindiVoices = voices.filter(v => 
          v.lang.startsWith('hi') || 
          v.lang === 'en-IN' ||
          v.name.toLowerCase().includes('india') ||
          v.name.toLowerCase().includes('hindi')
        );
        
        if (preferMale) {
          // Try to find male voice
          selectedVoice = hindiVoices.find(v => 
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('ravi') ||
            v.name.toLowerCase().includes('hemant') ||
            (!v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('lekha'))
          ) || hindiVoices[0];
        } else {
          // Try to find female voice
          selectedVoice = hindiVoices.find(v => 
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('lekha')
          ) || hindiVoices[0];
        }
        
        // Fallback to any Indian voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang === 'en-IN') || 
                          voices.find(v => v.lang.startsWith('hi'));
        }
        
        // Adjust rate for Hinglish - slightly slower for clarity
        utterance.rate = Math.max(0.85, emotion.rate - 0.05);
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
            (!v.name.toLowerCase().includes('female') && !v.name.toLowerCase().includes('zira') && !v.name.toLowerCase().includes('samantha'))
          ) || langVoices[0];
        } else {
          selectedVoice = langVoices.find(v => 
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('zira') ||
            v.name.toLowerCase().includes('samantha')
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
        console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang}) | Emotion: pitch=${emotion.pitch}, rate=${emotion.rate}, vol=${emotion.volume}`);
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
