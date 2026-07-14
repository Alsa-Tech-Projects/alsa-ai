import { useMemo } from "react";
import { AIState } from "./useWakeVoice";

interface CustomWaveProps {
  isListening: boolean;
  isSpeaking: boolean;
  // Dynamic parameters passed down to the raw canvas physics engine
  customSpeedMultiplier?: number;
  customGlowMultiplier?: number;
}

export const useWakeAnimation = (aiState: AIState) => {
  const waveProps = useMemo<CustomWaveProps>(() => {
    switch (aiState) {
      case "listening":
        return {
          isListening: true,
          isSpeaking: false,
          customSpeedMultiplier: 1.0,
          customGlowMultiplier: 1.0,
        };
      case "speaking":
        return {
          isListening: false,
          isSpeaking: true,
          customSpeedMultiplier: 2.2,
          customGlowMultiplier: 1.8,
        };
      case "thinking":
        // Slow rotating orbit, highly concentrated particles
        return {
          isListening: true,
          isSpeaking: false,
          customSpeedMultiplier: 0.4,
          customGlowMultiplier: 1.3,
        };
      case "processing":
        // Rapid, intense center pulse state
        return {
          isListening: true,
          isSpeaking: true,
          customSpeedMultiplier: 1.8,
          customGlowMultiplier: 1.5,
        };
      case "idle":
      default:
        // Minimal state footprint, calm drift
        return {
          isListening: false,
          isSpeaking: false,
          customSpeedMultiplier: 0.2,
          customGlowMultiplier: 0.5,
        };
    }
  }, [aiState]);

  return {
    waveProps,
  };
};
