import { useState, useCallback, useRef } from 'react';

export type VoiceGender = 'male' | 'female' | 'auto';

export interface VoiceOptions {
  gender?: VoiceGender;
  language?: string; // Optional: Force language
}

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper: Text se language detect karna (Basic logic)
  const getModelForText = (text: string, gender: VoiceGender) => {
    const isHindi = /[\u0900-\u097F]/.test(text); // Hindi/Sanskrit/Marathi
    const isArabic = /[\u0600-\u06FF]/.test(text); // Arabic/Urdu/Farsi/Hebrew
    
    // Deepgram par Multilingual ke liye generic models ya provider specific tags lagte hain
    // Filhal Aura English ke liye best hai, baaki ke liye hum "multi" support trigger karenge
    if (isHindi || isArabic) {
      // Note: Deepgram par specific language models specify karne hote hain
      // Agar 'aura' kaam nahi kar raha toh 'voicename' use hota hai
      return gender === 'male' ? 'aura-orpheus-en' : 'aura-stella-en'; 
    }
    
    return gender === 'male' ? 'aura-orpheus-en' : 'aura-stella-en';
  };

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (audioRef.current.src) URL.revokeObjectURL(audioRef.current.src);
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, options?: VoiceOptions) => {
    if (!text) return;

    try {
      stop();

      // CLEANING LOGIC (Aapka original cleaning logic)
      const cleanedText = text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[*_#~`>|\[\]\(\)]/g, ' ')
        .trim();

      if (!cleanedText) return;

      setIsSpeaking(true);

      const requestedGender = options?.gender || 'female';
      const model = getModelForText(cleanedText, requestedGender);
      const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;

      // Deepgram API Call with Language Query
      // 'encoding=linear16' aur 'container=wav' zyada stable hote hain multi-lang ke liye
      const response = await fetch(
        `https://api.deepgram.com/v1/speak?model=${model}&performance=some&encoding=mp3`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: cleanedText }),
        }
      );

      if (!response.ok) throw new Error('Deepgram API Error');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };

      await audio.play();

    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  }, [stop]);

  return { speak, stop, isSpeaking };
};
