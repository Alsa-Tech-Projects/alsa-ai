import React from "react";
import { Sparkles, MessageSquare, Wrench, Globe } from "lucide-react";

interface WakeBottomSheetProps {
  onExpand: () => void;
  aiState: "idle" | "listening" | "thinking" | "processing" | "speaking";
}

const WAKE_HINTS = [
  { text: "Analyze my screen", icon: Sparkles, color: "text-sky-400" },
  { text: "Call the Tech Team via WhatsApp", icon: MessageSquare, color: "text-blue-400" },
  { text: "Run system scan optimization", icon: Wrench, color: "text-indigo-400" },
  { text: "Search the latest AI research papers", icon: Globe, color: "text-cyan-400" },
];

const WakeBottomSheet: React.FC<WakeBottomSheetProps> = ({ onExpand, aiState }) => {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none bg-gradient-to-t from-black/50 via-black/20 to-transparent rounded-t-[32px] border-t border-white/5 backdrop-blur-xl px-6 pt-3 pb-6 transition-all duration-500">
      
      {/* Premium Visual Drag Affordance Handle */}
      <button
        type="button"
        onClick={onExpand}
        className="group flex flex-col items-center justify-center w-full py-2 cursor-pointer focus:outline-none"
        aria-label="Expand to full workspace view"
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors duration-300" />
        <span className="text-[10px] text-gray-400/70 font-medium tracking-widest uppercase mt-2 group-hover:text-sky-300/80 transition-colors duration-300">
          Swipe or Tap to Expand Workspace
        </span>
      </button>

      {/* Dynamic Contextual Context/Hints Section (Only visible when Alsa is listening or idle) */}
      <div 
        className={`w-full mt-6 grid grid-cols-2 gap-3 transition-all duration-500 overflow-hidden ${
          aiState === "listening" || aiState === "idle"
            ? "max-h-[200px] opacity-100 transform translate-y-0"
            : "max-h-0 opacity-0 transform translate-y-4 pointer-events-none"
        }`}
      >
        {WAKE_HINTS.map((hint, idx) => {
          const IconComponent = hint.icon;
          return (
            <button
              key={idx}
              type="button"
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] hover:border-sky-500/20 active:scale-[0.98] transition-all text-left group"
            >
              <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors ${hint.color}`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                {hint.text}
              </span>
            </button>
          );
        })}
      </div>
      
    </div>
  );
};

export default WakeBottomSheet;
