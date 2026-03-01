import { useState, useCallback, useRef } from 'react';

export type VoiceGender = 'male' | 'female' | 'auto';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    // Dono ko stop karein (Deepgram + Browser)
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, gender: VoiceGender = 'female') => {
    if (!text) return;
    stop();

    // 1. Language Detection Logic
    const hasHindiScript = /[\u0900-\u097F]/.test(text);
    const isEnglishOnly = /^[A-Za-z0-9\s.,!?'"-]+$/.test(text);

    // 2. Deepgram Call (English aur Hinglish ke liye)
    // Agar text English characters mein hai, toh Deepgram best sound karega
    if (isEnglishOnly) {
      try {
        setIsSpeaking(true);
        const model = gender === 'male' ? 'aura-orpheus-en' : 'aura-stella-en';
        
        const response = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${import.meta.env.VITE_DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) throw new Error('Deepgram error');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
        };
        
        await audio.play();
        return;
      } catch (error) {
        console.error("Deepgram failed, using browser fallback...");
      }
    }

    // 3. Browser Fallback (Pure Hindi Script ke liye ya agar API fail ho jaye)
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Hindi Voice dhundhein
    const hindiVoice = voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.lang.startsWith('en-IN'));
    
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    utterance.lang = hasHindiScript ? 'hi-IN' : 'en-US';
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [stop]);

  return { speak, stop, isSpeaking };
};
                                      
