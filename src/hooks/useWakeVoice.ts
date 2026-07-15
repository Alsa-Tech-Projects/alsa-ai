// src/hooks/useWakeVoice.ts
import { useState, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export type AIState = "idle" | "listening" | "thinking" | "processing" | "speaking";

export const useWakeVoice = () => {
  const [aiState, setAiState] = useState<AIState>("listening");
  const [transcript, setTranscript] = useState<string>("");

  const { 
    listening, 
    transcript: partialTranscript, 
    startListening, 
    stopListening 
  } = useSpeechRecognition();
  
  const { speaking: isTTSSpeaking, stop: stopTTS } = useTextToSpeech();

  // 🔥 1. AUTO START ON MOUNT (Fixed: Empty dependency array prevents infinite loops)
  useEffect(() => {
    try {
      startListening();
    } catch (e) {
      console.error("Auto-start mic failed:", e);
    }
    
    return () => {
      try {
        stopListening();
      } catch (e) {
        console.warn("Failed to clean up mic on unmount:", e);
      }
    };
  }, []); // 👈 KHALI ARRAY: Page load par sirf ek baar chalega aur thread freeze nahi hoga.

  // Sync lower-level states
  useEffect(() => {
    if (isTTSSpeaking) {
      setAiState("speaking");
    } else if (listening) {
      setAiState("listening");
    } else if (transcript && aiState !== "thinking" && aiState !== "processing") {
      setAiState("idle");
    }
  }, [listening, isTTSSpeaking, transcript, aiState]);

  useEffect(() => {
    if (partialTranscript) {
      setTranscript(partialTranscript);
    }
  }, [partialTranscript]);

  const closeWakeMode = useCallback(() => {
    try { stopListening(); } catch {}
    try { stopTTS(); } catch {}
    setTranscript("");
    setAiState("idle");
  }, [stopListening, stopTTS]);

  // 🔥 2. MANUAL RE-TRIGGER (Orb tap behavior)
  const toggleListening = useCallback(() => {
    if (listening) {
      try { stopListening(); } catch {}
      setAiState("idle");
    } else {
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
