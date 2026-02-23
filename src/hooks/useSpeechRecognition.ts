import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean = false) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isManualStop = useRef(true);
  const isAISpeakingRef = useRef(isAISpeaking);

  // Sync AI state with Ref to prevent closure bugs
  useEffect(() => {
    isAISpeakingRef.current = isAISpeaking;
    if (isAISpeaking) {
      // Logic: AI bolte hi mic ka gala ghot do (Abort)
      recognitionRef.current?.abort();
    } else if (!isManualStop.current) {
      // AI chup hote hi 500ms baad mic on karo (Echo prevention)
      setTimeout(() => {
        if (!isManualStop.current) safeStart();
      }, 500);
    }
  }, [isAISpeaking]);

  const safeStart = () => {
    try {
      if (recognitionRef.current && !isAISpeakingRef.current) {
        recognitionRef.current.start();
      }
    } catch (e) {
      // Already running - ignore error
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Browser doesn't support Speech Recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    
    // Mobile Settings: Continuous true rakho par results interim false
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
      // Echo Protection Check
      if (isAISpeakingRef.current) return;

      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      if (current) setTranscript(current);
    };

    recognition.onend = () => {
      // Mobile Keep-Alive: Agar user ne stop nahi kiya, toh restart karo
      if (!isManualStop.current && !isAISpeakingRef.current) {
        safeStart();
      } else {
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return; // Ignore silent pauses
      console.error("Speech Error:", event.error);
      if (event.error === 'network') alert("Check Internet Connection!");
    };

    recognitionRef.current = recognition;

    return () => {
      isManualStop.current = true;
      recognition.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    isManualStop.current = false;
    setTranscript('');
    safeStart();
  }, []);

  const stopListening = useCallback(() => {
    isManualStop.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { transcript, isListening, startListening, stopListening, setTranscript };
};
        
