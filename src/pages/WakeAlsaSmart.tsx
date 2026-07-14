import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import CircularSiriWaveV2 from "@/components/CircularSiriWaveV2";
import WakeTopBar from "@/components/WakeTopBar";
import WakeTranscript from "@/components/WakeTranscript";
import WakeInput from "@/components/WakeInput";
import WakeGestureHandler from "@/components/WakeGestureHandler";

import { useWakeVoice } from "@/hooks/useWakeVoice";
import { useWakeAnimation } from "@/hooks/useWakeAnimation";

import "@/styles/wake.css";

const WakeAlsaSmart = () => {
  const navigate = useNavigate();

  const {
    transcript,
    isListening,
    isSpeaking,
    aiState, // 'idle' | 'listening' | 'thinking' | 'processing' | 'speaking'
    closeWakeMode
  } = useWakeVoice();

  const { waveProps } = useWakeAnimation(aiState);

  // Morph to full chat exactly like Gemini Live
  const handleExpandToChat = () => {
    navigate("/Chat", { 
      state: { 
        autoOpenFromWake: true, 
        wakeTranscript: transcript 
      } 
    });
  };

  const handleClose = () => {
    closeWakeMode();
    // Return to previous route (or fallback to /Chat)
    navigate(-1);
  };

  return (
    <WakeGestureHandler onSwipeUp={handleExpandToChat} onSwipeDown={handleClose}>
      <div className="fixed inset-0 z-[99999] flex flex-col justify-between overflow-hidden bg-black/40 backdrop-blur-3xl alsa-wake-mode-wrapper select-none">
        
        {/* Ambient Cosmic Blue Glow (Subtle Center Bloom) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`w-[450px] h-[450px] rounded-full blur-[120px] transition-all duration-1000 ${
              isSpeaking || aiState === 'speaking'
                ? 'bg-blue-500/20 scale-110 opacity-100'
                : aiState === 'thinking' || aiState === 'processing'
                ? 'bg-sky-400/15 scale-100 opacity-70'
                : 'bg-blue-500/5 scale-90 opacity-40'
            }`}
          />
        </div>

        {/* Top: Settings, Battery, Connection UI */}
        <WakeTopBar onClose={handleClose} />

        {/* Center: Particle AI Representation */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full h-full">
          <CircularSiriWaveV2
            isListening={isListening || aiState === 'listening'}
            isSpeaking={isSpeaking || aiState === 'speaking'}
            size={380}
            {...waveProps}
          />
        </div>

        {/* Bottom: Transcript and Draggable Input */}
        <div className="relative z-20 w-full flex flex-col items-center pb-10 px-6 gap-8 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
          <WakeTranscript transcript={transcript} aiState={aiState} />
          <WakeInput
            transcript={transcript}
            isListening={isListening}
            onExpand={handleExpandToChat}
          />
        </div>
        
      </div>
    </WakeGestureHandler>
  );
};

export default WakeAlsaSmart;
