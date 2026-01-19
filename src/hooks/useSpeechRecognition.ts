import { useState, useEffect, useCallback, useRef } from 'react';

export const useSpeechRecognition = (isAISpeaking: boolean) => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Roman script (English alphabets) ke liye

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      // Agar AI bol raha hai toh result ignore karo (Double safety)
      if (isAISpeaking) return;

      let current = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onend = () => {
      // AI bol raha ho ya manual stop ho toh restart mat karo
      if (shouldRestartRef.current && !isAISpeaking) {
        try {
          recognition.start();
        } catch (e) {
          console.log("Restarting mic...");
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
  }, [isAISpeaking]);

  // AI Bolte waqt mic ko band karne ka logic
  useEffect(() => {
    if (isAISpeaking) {
      console.log("AI is speaking, stopping mic...");
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else if (shouldRestartRef.current) {
      // AI chup hote hi mic wapas shuru
      try {
        recognitionRef.current.start();
      } catch (e) {}
    }
  }, [isAISpeaking]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Phone Sensitivity Boost: AudioContext setup
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const processor = audioContextRef.current.createScriptProcessor(1024, 1, 1);
        source.connect(processor);
        processor.connect(audioContextRef.current.destination);
        // Isse mic line active rehti hai aur phone sensor fast respond karta hai
      }

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

  return { transcript, isListening, startListening, stopListening };
};
