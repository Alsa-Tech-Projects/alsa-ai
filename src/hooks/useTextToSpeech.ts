// Future Mai Api Key Use Karenge
import { useState, useCallback, useRef, useEffect } from 'react';

export type VoiceGender = 'male' | 'female' | 'auto';

export interface VoiceOptions {
  gender?: VoiceGender;
  language?: string;
}

// ONLY English Male voices
const MALE_VOICE_NAMES = [
  'david', 'alex', 'google us english', 'microsoft david', 'en-us male'
];

// Female voices (Hindi + English)
const FEMALE_VOICE_NAMES = [
  'heera', 'priya', 'swara', 'neha', 'google हिन्दी', 'microsoft heera', 
  'samantha', 'zira', 'google us english female'
];

const containsHindi = (text: string): boolean => /[\u0900-\u097F]/.test(text);

const isHinglishContent = (text: string): boolean => {
  if (containsHindi(text)) return true;
  const keywords = ['kya', 'hai', 'aap', 'kaise', 'theek', 'nahi', 'karo', 'hai', 'hain', 'mein', 'tum', 'yeh', 'woh'];
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => keywords.includes(word));
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((text: string, options?: VoiceOptions) => {
    if (!text) return;

    try {
      window.speechSynthesis.cancel();
      
      // ==========================================
      // CLEANING LOGIC (No Emojis, No Special Chars)
      // ==========================================
      const cleanedText = text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Emojis saaf karega
        .replace(/[*_#~`>|\[\]\(\)]/g, ' ') // Markdown symbols ko space se badlega
        .replace(/[\\/=+^]/g, ' ') // Mathematics/Special symbols hata dega
        .replace(/\s+/g, ' ') // Extra spaces saaf karega
        .trim();

      if (!cleanedText) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      const isHindiOrHinglish = isHinglishContent(cleanedText);
      const requestedGender = options?.gender || 'auto';
      const voices = window.speechSynthesis.getVoices();

      let selectedVoice: SpeechSynthesisVoice | null = null;

      // Logic: Male -> Only English, Female/Auto -> Hinglish/Hindi
      if (requestedGender === 'male') {
        selectedVoice = voices.find(v => 
          v.lang.startsWith('en') && 
          MALE_VOICE_NAMES.some(name => v.name.toLowerCase().includes(name))
        );
      } else {
        if (isHindiOrHinglish) {
          selectedVoice = voices.find(v => 
            (v.lang.startsWith('hi') || v.lang.startsWith('en-IN')) && 
            FEMALE_VOICE_NAMES.some(name => v.name.toLowerCase().includes(name))
          );
        }
        
        // Fallback for English Female
        if (!selectedVoice) {
          selectedVoice = voices.find(v => 
            FEMALE_VOICE_NAMES.some(name => v.name.toLowerCase().includes(name))
          );
        }
      }

      // Voice setting
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang; 
      } else {
        utterance.lang = isHindiOrHinglish ? 'hi-IN' : 'en-US';
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking };
};
