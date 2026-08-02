// src/hooks/useWakeVoice.ts
import { useState, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export type AIState = "idle" | "listening" | "thinking" | "processing" | "speaking";

export const useWakeVoice = () => {
  const [aiState, setAiState] = useState<AIState>("listening");
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { 
    listening, 
    transcript: partialTranscript, 
    startListening, 
    stopListening 
  } = useSpeechRecognition();
  
  const { 
    isSpeaking: isTTSSpeaking, 
    speak, 
    stop: stopTTS 
  } = useTextToSpeech();


  // Edge Function Request Handler
  const sendVoiceQueryToBackend = useCallback(async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setAiState("thinking"); 
    
    try {
      const response = await fetch('https://kpqpwfvbfikmfliyjede.supabase.co/functions/v1/chat', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` 
        },
        body: JSON.stringify({ message: queryText })
      });

      if (!response.ok) {
        throw new Error(`Edge Function Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Response parsing handles multiple standard response keys
      const aiResponseText = data.reply || data.message || data.text || data.response; 

      if (aiResponseText) {
        setAiState("speaking");
        speak(aiResponseText); 
      } else {
        setAiState("idle");
      }
      
    } catch (error) {
      console.error("Alsa Edge Function request failed:", error);
      setAiState("idle");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, speak]);

  // Auto-Trigger Hook: Trigger fetch when user stops speaking
  useEffect(() => {
    if (!listening && transcript.trim() && aiState === "listening" && !isProcessing) {
      sendVoiceQueryToBackend(transcript);
    }
  }, [listening, transcript, aiState, isProcessing, sendVoiceQueryToBackend]);

  // Initialization: Start Mic on mount
  useEffect(() => {
    try { startListening(); } catch (e) { console.error(e); }
    return () => { try { stopListening(); } catch (e) { } };
  }, []);

  // State Sync: Sync local AI status with TTS and Mic recognizer
  useEffect(() => {
    if (isTTSSpeaking) {
      setAiState("speaking");
    } else if (listening) {
      setAiState("listening");
    } else if (!isProcessing && transcript) {
      setAiState("idle"); 
    }
  }, [listening, isTTSSpeaking, isProcessing, transcript]);

  // Transcript Sync
  useEffect(() => {
    if (partialTranscript && !isProcessing) {
      setTranscript(partialTranscript);
    }
  }, [partialTranscript, isProcessing]);

  // Cleanup handler
  const closeWakeMode = useCallback(() => {
    try { stopListening(); } catch {}
    try { stopTTS(); } catch {}
    setTranscript("");
    setAiState("idle");
  }, [stopListening, stopTTS]);

  // Click Trigger handler for Wave Orb
  const toggleListening = useCallback(() => {
    if (listening) {
      try { stopListening(); } catch {}
    } else {
      setTranscript(""); 
      try { startListening(); } catch {}
      setAiState("listening");
    }
  }, [listening, startListening, stopListening]);

  return {
    transcript,
    isListening: listening,
    isSpeaking: isTTSSpeaking,
    aiState,
    setAiState,
    closeWakeMode,
    toggleListening
  };
};
