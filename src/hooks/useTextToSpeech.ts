import { useState, useCallback, useRef, useEffect } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const cleanText = (text: string): string => {
    return text
      // Emojis aur unke descriptions ko hatana
      .replace(/smiling face with\s\w+\seyes|grinning face|winking face|heart eyes|thumbs up|folded hands|partying face/gi, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      // Special characters ko space se replace karna
      .replace(/[#*_\-~@$%^&()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const findFemaleVoice = (voices: SpeechSynthesisVoice[]) => {
    // 1. Pehle India ki female voices check karo (Hinglish/Hindi ke liye best)
    const indianFemale = voices.find(v => 
      (v.lang.includes('IN') || v.lang.includes('hi')) && 
      /female|woman|girl|heera|priya|swara|neha|neerja/i.test(v.name)
    );
    if (indianFemale) return indianFemale;

    // 2. Phir koi bhi English female voice check karo
    const englishFemale = voices.find(v => 
      v.lang.startsWith('en') && 
      /female|woman|girl|zira|samantha|victoria|aria/i.test(v.name)
    );
    if (englishFemale) return englishFemale;

    // 3. Last fallback: koi bhi voice jisme 'female' likha ho
    return voices.find(v => /female|woman|girl/i.test(v.name)) || voices[0];
  };

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;

    // Purani voice ko cancel karo
    synthRef.current.cancel();

    const cleanedText = cleanText(text);
    if (!cleanedText) return;

    // Chrome mein voices async load hoti hain, isliye getVoices() call karna zaruri hai
    const voices = synthRef.current.getVoices();
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    
    const selectedVoice = findFemaleVoice(voices);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    }

    // Professional Settings
    utterance.pitch = 1.2; // Feminine tone
    utterance.rate = 1.0;  // Normal speed

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
};
