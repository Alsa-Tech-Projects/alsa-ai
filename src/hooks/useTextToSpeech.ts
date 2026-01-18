import { useState, useCallback, useRef } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Sabse advanced cleaning (Emoji descriptions aur symbols ko jatt se khatam karega)
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/smiling face with\s\w+\seyes|grinning face|winking face|heart eyes|thumbs up|folded hands|partying face/gi, '') 
      .replace(/\p{Extended_Pictographic}/gu, '') 
      .replace(/[#*_\-~@$%^&()]/g, ' ') 
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback(async (text: string, voiceType: 'hindi' | 'english' = 'hindi') => {
    const cleanedText = cleanText(text);
    if (!cleanedText) return;

    // Stop if something is already playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);

    // Microsoft Edge ki Premium Voices (Free version via proxy)
    // Hindi/Hinglish ke liye: Swara (Female)
    // English ke liye: Sonia (Female)
    const voice = voiceType === 'hindi' ? 'hi-IN-SwaraNeural' : 'en-US-AvaNeural';
    
    // Ye ek free public API proxy hai jo Edge voices ko audio mein convert karti hai
    const ttsUrl = `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(cleanedText)}&speaker=1`; 
    
    // Alternate Best Free Method (Google/Edge Proxy)
    const edgeFreeUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(cleanedText)}&le=${voiceType === 'hindi' ? 'zh' : 'en'}`;

    // Note: Best natural voice ke liye hum standard reliable API use karenge
    const finalUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanedText)}&tl=${voiceType === 'hindi' ? 'hi' : 'en'}&client=tw-ob`;

    try {
      const audio = new Audio(finalUrl);
      audioRef.current = audio;

      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);

      await audio.play();
    } catch (err) {
      console.error("Playback error:", err);
      setIsSpeaking(false);
    }
  }, []);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  return { speak, stop, isSpeaking };
};
