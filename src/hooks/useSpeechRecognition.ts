import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const manualStopRef = useRef(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      console.log("Mic Started...");
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      if (isAISpeaking) return;

      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onend = () => {
      console.log("Mic Ended. ManualStop:", manualStopRef.current);
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

  useEffect(() => {
    if (isAISpeaking) {
      if (recognitionRef.current) recognitionRef.current.stop();
    } else {
      if (!manualStopRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }
  }, [isAISpeaking]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    manualStopRef.current = false;
    setTranscript('');
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log("Mic is already active");
    }
  }, []);

  const stopListening = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return { transcript, isListening, startListening, stopListening, resetTranscript };
};
