// src/hooks/useWakeVoice.ts
import { useState, useEffect, useCallback } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export type AIState = "idle" | "listening" | "thinking" | "processing" | "speaking";

export const useWakeVoice = () => {
  const [aiState, setAiState] = useState<AIState>("listening");
  const [transcript, setTranscript] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false); // Double trigger rokne ke liye

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

  // 🔥 1. EDGE FUNCTION CALLING LOGIC
  const sendVoiceQueryToBackend = useCallback(async (queryText: string) => {
    if (!queryText.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setAiState("thinking"); // Orb color sky blue ho jayega
    
    try {
      // Yahan apna Supabase Edge Function ya Backend API ka URL daalo
      const response = await fetch('/api/chat-edge-function', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: queryText })
      });

      if (!response.ok) throw new Error("Backend API Error");

      const data = await response.json();
      
      // API response se text nikalna (apne backend structure ke hisaab se adjust kar lena)
      const aiResponseText = data.reply || data.message || data.text; 

      if (aiResponseText) {
        setAiState("speaking");
        speak(aiResponseText); // 👈 Alsa is text ko bolna shuru karegi
      } else {
        setAiState("idle");
      }
      
    } catch (error) {
      console.error("Wake voice processing failed:", error);
      setAiState("idle");
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, speak]);


  // 🔥 2. AUTO-TRIGGER (Jab user bolna band kare)
  useEffect(() => {
    // Agar mic band ho gaya hai, aur transcript me text hai, aur koi processing nahi chal rahi
    if (!listening && transcript.trim() && aiState === "listening" && !isProcessing) {
      sendVoiceQueryToBackend(transcript);
    }
  }, [listening, transcript, aiState, isProcessing, sendVoiceQueryToBackend]);


  // Auto-start Mic on mount
  useEffect(() => {
    try { startListening(); } catch (e) { console.error(e); }
    return () => { try { stopListening(); } catch (e) { } };
  }, []);

  // Sync TTS and Mic states
  useEffect(() => {
    if (isTTSSpeaking) {
      setAiState("speaking");
    } else if (listening) {
      setAiState("listening");
    } else if (!isProcessing && transcript) {
      // Waiting state after speaking finishes
      setAiState("idle"); 
    }
  }, [listening, isTTSSpeaking, isProcessing]);

  useEffect(() => {
    if (partialTranscript && !isProcessing) {
      setTranscript(partialTranscript);
    }
  }, [partialTranscript, isProcessing]);

  const closeWakeMode = useCallback(() => {
    try { stopListening(); } catch {}
    try { stopTTS(); } catch {}
    setTranscript("");
    setAiState("idle");
  }, [stopListening, stopTTS]);

  const toggleListening = useCallback(() => {
    if (listening) {
      try { stopListening(); } catch {}
      // Jaise hi user tap karke stop karega, upar wala Auto-Trigger useEffect chal jayega!
    } else {
      setTranscript(""); // Naya sawal puchne ke liye purana text clear karega
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
