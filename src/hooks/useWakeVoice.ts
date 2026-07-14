import { useState, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export type AIState = "idle" | "listening" | "thinking" | "processing" | "speaking";

export const useWakeVoice = () => {
  const [aiState, setAiState] = useState<AIState>("listening");
  const [transcript, setTranscript] = useState<string>("");

  // Reuse existing core ALSA hook systems
  const { 
    listening, 
    transcript: partialTranscript, 
    startListening, 
    stopListening 
  } = useSpeechRecognition();
  
  const { 
    speaking: isTTSSpeaking, 
    speak, 
    stop: stopTTS 
  } = useTextToSpeech();

  // Sync lower-level states into our unified presentation state
  useEffect(() => {
    if (isTTSSpeaking) {
      setAiState("speaking");
    } else if (listening) {
      setAiState("listening");
    } else if (transcript && aiState !== "thinking" && aiState !== "processing") {
      setAiState("idle");
    }
  }, [listening, isTTSSpeaking, transcript]);

  // Keep streaming transcript synced to the local state for real-time visualization
  useEffect(() => {
    if (partialTranscript) {
      setTranscript(partialTranscript);
    }
  }, [partialTranscript]);

  // Handle manual or automatic session teardown safely
  const closeWakeMode = useCallback(() => {
    stopListening();
    stopTTS();
    setTranscript("");
    setAiState("idle");
  }, [stopListening, stopTTS]);

  // Function to process voice queries through existing backend logic
  const sendVoiceQueryToBackend = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    
    setAiState("thinking");
    
    try {
      // Simulate/Bridge to existing chat function logic pipeline
      setAiState("processing");
      
      // Hook into existing prompt pipeline safely here when combined with Chat.tsx
      // For now, it manages state updates smoothly to animate the core ring
    } catch (error) {
      console.error("Wake voice processing failed:", error);
      setAiState("idle");
    }
  }, []);

  return {
    transcript,
    isListening: listening,
    isSpeaking: isTTSSpeaking,
    aiState,
    setAiState,
    closeWakeMode,
    sendVoiceQueryToBackend
  };
};
