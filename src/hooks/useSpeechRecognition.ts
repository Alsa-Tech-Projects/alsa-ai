import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;

    // --- MAGIC LINE HERE ---
    // Hum 'en-US' ke saath backup languages bhi de sakte hain (kuch browsers support karte hain)
    // Lekin best result ke liye hum 'hi-IN' rakhte hain kyunki isme English aur Hindi mixed rehti hai.
    // Agar Turkish/Urdu chahiye to hume language switch karni padegi.
    recognition.lang = 'hi-IN'; 

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        try { recognition.start(); } catch (e) {}
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, []);

  // Language Change karne wala function
  const setLanguage = useCallback((langCode: string) => {
    // langCode values: 
    // English: 'en-US', Hindi/Hinglish: 'hi-IN', Urdu: 'ur-PK', Turkish: 'tr-TR'
    if (recognitionRef.current) {
      const wasListening = isListening;
      if (wasListening) stopListening();
      
      recognitionRef.current.lang = langCode;
      console.log("Language switched to:", langCode);
      
      if (wasListening) startListening();
    }
  }, [isListening]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      shouldRestartRef.current = true;
      setTranscript('');
      recognitionRef.current.start();
    } catch (err) {
      console.error("Mic access denied");
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { transcript, isListening, startListening, stopListening, setLanguage };
};
