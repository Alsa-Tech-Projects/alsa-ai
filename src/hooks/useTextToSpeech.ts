import { useState, useCallback, useRef } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanTextForSpeech = (text: string): string => {
    if (!text) return '';
    return text
      // Emojis aur unke descriptions dono ko saaf karta hai
      .replace(/smiling face with\s\w+\seyes|grinning face|winking face|heart eyes|thumbs up/gi, '')
      .replace(/\p{Extended_Pictographic}/gu, '')
      .replace(/[#*_\-~@$%^&()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const speak = useCallback((text: string, lang: string = 'hi-IN') => {
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    // Stop any current playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // Google Translate TTS URL (Natural Female Voice)
    // Ye har language support karta hai: 'hi-IN' for Hindi/Hinglish, 'en-US' for English
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanedText)}&tl=${lang}&client=tw-ob`;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);

    audio.play().catch(err => {
      console.error("Playback failed. User interaction might be required.", err);
      setIsSpeaking(false);
    });
  }, []);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSpeaking(false);
    }
  };

  return { speak, stop, isSpeaking };
};
