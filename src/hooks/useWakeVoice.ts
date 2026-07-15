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

  // 🔥 1. AUTO START ON MOUNT (Yeh missing tha)
  useEffect(() => {
    // Page open hote hi mic chalu karne ki koshish karega
    startListening();
    
    return () => {
      stopListening();
    };
  }, [startListening, stopListening]);

  // Sync lower-level states
  useEffect(() => {
    if (isTTSSpeaking) {
      setAiState("speaking");
    } else if (listening) {
      setAiState("listening");
    } else if (transcript && aiState !== "thinking" && aiState !== "processing") {
      setAiState("idle");
    }
  }, [listening, isTTSSpeaking, transcript]);

  useEffect(() => {
    if (partialTranscript) {
      setTranscript(partialTranscript);
    }
  }, [partialTranscript]);

  const closeWakeMode = useCallback(() => {
    stopListening();
    stopTTS();
    setTranscript("");
    setAiState("idle");
  }, [stopListening, stopTTS]);

  // 🔥 2. MANUAL RE-TRIGGER (Agar browser auto-start block kare toh user tap kar sake)
  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening();
      setAiState("idle");
    } else {
      startListening();
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
    toggleListening // Isko return kiya taaki Orb par click kaam kare
  };
};
