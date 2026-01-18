import { useState, useCallback, useRef } from 'react';

export interface VoiceOptions {
  language?: string;
}

// Strictly Indian Female Voice Identifiers
const INDIAN_FEMALE_NAMES = [
  'heera', 'priya', 'swara', 'neha', 'kalpana', 'google हिन्दी', 'microsoft heera',
  'en-in-x-ena', 'hi-in-x-hie', 'indian female'
];

const cleanTextForSpeech = (text: string): string => {
  if (!text) return '';
  let cleaned = text;

  // 1. Remove Emoji Descriptions (Very Important)
  const descriptions = [
    /smiling face with\s\w+\seyes/gi, /grinning face/gi, /winking face/gi,
    /heart eyes/gi, /thumbs up/gi, /partying face/gi, /folded hands/gi,
    /face with\s\w+/gi, /smiling face/gi
  ];
  descriptions.forEach(p => cleaned = cleaned.replace(p, ''));

  // 2. Remove Unicode Emojis and Special Symbols
  return cleaned
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[#*_\-~@$%^&()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isHinglishContent = (text: string): boolean => {
  const hindiPattern = /[\u0900-\u097F]/;
  if (hindiPattern.test(text)) return true;
  
  const hinglishKeywords = ['kya', 'hai', 'hain', 'aap', 'kaise', 'theek', 'nahi', 'haan', 'bhai', 'yeh', 'karo', 'main', 'tum', 'ho'];
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => hinglishKeywords.includes(word));
};

const getStrictFemaleVoice = (voices: SpeechSynthesisVoice[], isHinglish: boolean): SpeechSynthesisVoice | null => {
  // Agar Hinglish hai, toh pehle sirf Indian voices (en-IN or hi-IN) mein female dhundo
  if (isHinglish) {
    const indianFemale = voices.find(v => 
      (v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN')) &&
      INDIAN_FEMALE_NAMES.some(name => v.name.toLowerCase().includes(name))
    );
    if (indianFemale) return indianFemale;
  }

  // Fallback for other languages (Global Female)
  const femaleKeywords = ['female', 'woman', 'girl', 'she', 'zira', 'samantha'];
  return voices.find(v => femaleKeywords.some(id => v.name.toLowerCase().includes(id))) || voices[0];
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options?: VoiceOptions) => {
    try {
      window.speechSynthesis.cancel();
      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      const isHinglish = isHinglishContent(cleanedText);
      const voices = window.speechSynthesis.getVoices();
      
      const selectedVoice = getStrictFemaleVoice(voices, isHinglish);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        // Sabse zaroori: Agar Hinglish hai, toh language ko hi-IN ya en-IN set karna padta hai
        utterance.lang = isHinglish ? (selectedVoice.lang.startsWith('hi') ? 'hi-IN' : 'en-IN') : selectedVoice.lang;
      }

      // Settings for natural Hinglish flow
      utterance.rate = 0.9; // Thoda slow taaki spelling na lage
      utterance.pitch = 1.1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop: () => window.speechSynthesis.cancel(), isSpeaking };
};
