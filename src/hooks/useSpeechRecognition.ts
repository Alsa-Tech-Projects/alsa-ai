import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(true); // Default stop rakhenge

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Roman alphabets ke liye

    recognition.onstart = () => {
      console.log("Mic Started...");
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      // Agar AI bol raha hai toh mic ignore karega
      if (isAISpeaking) return;

      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onend = () => {
      console.log("Mic Ended. ManualStop:", manualStopRef.current);
      // Agar user ne manually stop nahi kiya hai aur AI nahi bol raha, toh restart karo
      if (!manualStopRef.current && !isAISpeaking) {
        try {
          recognition.start();
        } catch (e) {
          console.error("Auto-restart failed:", e);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [isAISpeaking]);

  // AI Bolte waqt mic ko sirf pause karega, stop nahi
  useEffect(() => {
    if (isAISpeaking) {
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      // AI ke chup hote hi agar manual stop nahi kiya tha, toh wapas shuru
      if (!manualStopRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }
  }, [isAISpeaking]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    manualStopRef.current = false; // Ab user ne manually start kiya hai
    setTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log("Mic is already active");
    }
  }, []);

  const stopListening = useCallback(() => {
    manualStopRef.current = true; // Ab user ne manually stop kiya hai
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  return { transcript, isListening, startListening, stopListening };
};
