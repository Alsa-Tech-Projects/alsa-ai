import { useState, useCallback, useRef, useEffect } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // 1. Voices ko load karne ka sahi tareeka (Browser compatibility ke liye)
  useEffect(() => {
    synthRef.current = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // 2. Powerful Cleaning (Emojis + Text Descriptions + Special Chars)
  const cleanText = (text: string): string => {
    return text
      .replace(/smiling face with\s\w+\seyes|grinning face|winking face|heart eyes|thumbs up|folded hands|partying face/gi, '') // Text descriptions
      .replace(/\p{Extended_Pictographic}/gu, '') // Actual Emojis
      .replace(/[#*_\-~@$%^&()]/g, ' ') // Symbols
      .replace(/\s+/g, ' ') // Extra spaces
      .trim();
  };

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Pehle se kuch bol raha ho to band karo
    synthRef.current.cancel();

    const cleanedText = cleanText(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    // 3. Sabhi languages ke liye Premium Female Voice search logic
    const allVoices = synthRef.current.getVoices();
    
    // Priority List: Pehle Microsoft ki neural voices, phir Google ki, phir koi bhi Female
    const selectedVoice = allVoices.find(v => v.name.includes('Natural') && v.name.includes('Female')) || 
                          allVoices.find(v => v.name.toLowerCase().includes('heera') || v.name.toLowerCase().includes('neerja')) || // Indian Female
                          allVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira')) || // Global Female
                          allVoices.find(v => v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN')); // Indian Accent

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    // Professional Settings
    utterance.pitch = 1.1; // Female tone
    utterance.rate = 0.95;  // Thoda thahrav ke saath (natural)

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, []);

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  return { speak, stop, isSpeaking, availableVoices: voices };
};
