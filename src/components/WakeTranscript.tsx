import React from "react";

interface WakeTranscriptProps {
  transcript: string;
  aiState: "idle" | "listening" | "thinking" | "processing" | "speaking";
}

const WakeTranscript: React.FC<WakeTranscriptProps> = ({ transcript, aiState }) => {
  // Get contextual helper text based on state
  const getStateLabel = () => {
    switch (aiState) {
      case "listening":
        return "Listening...";
      case "thinking":
        return "Thinking...";
      case "processing":
        return "Processing response...";
      case "speaking":
        return "Alsa is speaking";
      case "idle":
      default:
        return "Ready";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center px-4 select-none min-h-[96px] z-10">
      
      {/* Dynamic Status Indicator Tag */}
      <div className="mb-3 flex items-center gap-2">
        {(aiState === "thinking" || aiState === "processing") && (
          <div className="flex gap-1 items-center justify-center py-1">
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce" />
          </div>
        )}
        <span className={`text-xs font-semibold tracking-widest uppercase transition-colors duration-300 ${
          aiState === "listening" 
            ? "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" 
            : aiState === "speaking" 
            ? "text-blue-400 font-bold" 
            : "text-gray-400/80"
        }`}>
          {getStateLabel()}
        </span>
      </div>

      {/* Main Streaming Transcript Text */}
      <div className="relative w-full overflow-hidden">
        <p className={`text-xl md:text-2xl font-medium leading-relaxed tracking-wide transition-all duration-300 ${
          transcript 
            ? "text-white/95 text-shadow-sm font-normal" 
            : "text-white/40 italic font-light text-lg"
        }`}>
          {transcript || "What can I do for you today?"}
        </p>
      </div>

    </div>
  );
};

export default WakeTranscript;
