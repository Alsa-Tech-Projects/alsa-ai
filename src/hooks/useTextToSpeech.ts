import { useState, useCallback, useRef } from 'react';

export type VoiceGender = 'male' | 'female' | 'auto';

export interface VoiceOptions {
  gender?: VoiceGender;
}

// Deepgram Aura Models (Fast & Human-like)
const MODELS = {
  male: 'aura-orpheus-en', 
  female: 'aura-stella-en',
};

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Audio context aur source ko track karne ke liye refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Memory cleanup
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src);
      }
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, options?: VoiceOptions) => {
    if (!text) return;

    try {
      // 1. Pehle se chal rahi audio ko stop karein
      stop();

      // 2. Text Cleaning (Aapki logic)
      const cleanedText = text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[*_#~`>|\[\]\(\)]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanedText) return;

      setIsSpeaking(true);

      // 3. Deepgram API Call
      const model = options?.gender === 'male' ? MODELS.male : MODELS.female;
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

      const response = await fetch(
        `https://api.deepgram.com/v1/speak?model=${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: cleanedText }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.err_msg || 'Deepgram API Error');
      }

      // 4. Audio Stream ko Blob mein convert karke play karein
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => setIsSpeaking(false);

      await audio.play();

    } catch (error) {
      console.error("Deepgram TTS Error:", error);
      setIsSpeaking(false);
    }
  }, [stop]);

  return { speak, stop, isSpeaking };
};
