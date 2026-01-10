import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  finalTranscript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useSpeechRecognition = (): SpeechRecognitionResult => {
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);
  const manualStopRef = useRef(false);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    
    // Enhanced settings for better far-away voice detection
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    try {
      recognitionInstance.maxAlternatives = 5;
      // Some browsers support these for better sensitivity
      if ('grammars' in recognitionInstance) {
        // Clear any grammar restrictions for more flexible recognition
      }
    } catch (e) {
      console.log('Extended speech settings not fully supported');
    }

    recognitionInstance.onstart = () => {
      console.log('🎤 Voice recognition ACTIVE - Speak your command');
      setIsListening(true);
      manualStopRef.current = false;
    };

    recognitionInstance.onresult = (event: any) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;
        
        if (result.isFinal) {
          final += transcriptText + ' ';
        } else {
          interim += transcriptText;
        }
      }
      
      const currentTranscript = (final + interim).trim();
      console.log('Speech:', currentTranscript);
      
      setTranscript(currentTranscript);
      
      if (final.trim()) {
        setFinalTranscript(prev => (prev + ' ' + final).trim());
      }
    };

    recognitionInstance.onaudiostart = () => {
      console.log('Audio capture started');
    };

    recognitionInstance.onspeechend = () => {
      console.log('Speech ended, continuing to listen...');
    };

    recognitionInstance.onend = () => {
      console.log('Recognition ended, manualStop:', manualStopRef.current, 'shouldRestart:', shouldRestartRef.current);
      
      // Only restart if not manually stopped and should be listening
      if (!manualStopRef.current && shouldRestartRef.current) {
        setTimeout(() => {
          if (!manualStopRef.current && shouldRestartRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              console.log('🔄 Voice recognition auto-restarted');
            } catch (e: any) {
              if (e.name !== 'InvalidStateError') {
                console.error('Restart failed:', e.message);
                setIsListening(false);
              }
            }
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      switch (event.error) {
        case 'no-speech':
          // No speech detected - keep listening (don't stop)
          console.log('No speech detected, still listening...');
          break;
        case 'aborted':
          console.log('Recognition aborted');
          break;
        case 'audio-capture':
          console.error('No microphone found');
          setIsListening(false);
          shouldRestartRef.current = false;
          manualStopRef.current = true;
          break;
        case 'not-allowed':
          console.error('Microphone access denied');
          setIsListening(false);
          shouldRestartRef.current = false;
          manualStopRef.current = true;
          break;
        case 'network':
          console.error('Network error');
          break;
        default:
          console.error('Unhandled error:', event.error);
      }
    };

    recognitionRef.current = recognitionInstance;

    return () => {
      if (recognitionRef.current) {
        shouldRestartRef.current = false;
        manualStopRef.current = true;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    try {
      setTranscript('');
      setFinalTranscript('');
      shouldRestartRef.current = true;
      manualStopRef.current = false;
      setIsListening(true);
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          console.log('🎤 Microphone permission granted');
          try {
            recognitionRef.current.start();
          } catch (error: any) {
            if (error.name === 'InvalidStateError') {
              console.log('Recognition already running');
            } else {
              throw error;
            }
          }
        })
        .catch((err) => {
          console.error('Microphone access error:', err);
          setIsListening(false);
          shouldRestartRef.current = false;
        });
    } catch (error: any) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
      shouldRestartRef.current = false;
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        manualStopRef.current = true;
        shouldRestartRef.current = false;
        recognitionRef.current.stop();
        setIsListening(false);
        console.log('🔇 Voice recognition STOPPED manually');
      } catch (error) {
        console.error('Error stopping recognition:', error);
      }
    }
  }, []);

  return {
    transcript,
    finalTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  };
};
