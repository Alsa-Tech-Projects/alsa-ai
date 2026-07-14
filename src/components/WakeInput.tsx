import React, { useRef, useState } from "react";
import { Mic, ChevronUp, Keyboard } from "lucide-react";

interface WakeInputProps {
  transcript: string;
  isListening: boolean;
  onExpand: () => void;
}

const DRAG_THRESHOLD = 70;

const WakeInput: React.FC<WakeInputProps> = ({
  transcript,
  isListening,
  onExpand,
}) => {
  const startY = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = startY.current - currentY;
    
    // Only allow upward drag tracking
    if (diff > 0) {
      setDragOffset(Math.min(diff, 110));
    }
  };

  const handleTouchEnd = () => {
    if (dragOffset > DRAG_THRESHOLD) {
      onExpand();
    }
    startY.current = null;
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startY.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (startY.current === null) return;
    const diff = startY.current - e.clientY;
    if (diff > 0) {
      setDragOffset(Math.min(diff, 110));
    }
  };

  const handleMouseUpOrLeave = () => {
    if (dragOffset > DRAG_THRESHOLD) {
      onExpand();
    }
    startY.current = null;
    setDragOffset(0);
  };

  return (
    <div
      className="w-full max-w-xl mx-auto px-4 select-none cursor-grab active:cursor-grabbing z-30"
      style={{
        transform: `translateY(${-dragOffset}px)`,
        transition: startY.current ? "none" : "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      <div className="relative w-full rounded-full border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-blue-500/30 transition-colors duration-300 p-3.5 flex items-center justify-between gap-4">
        
        {/* Decorative Inner Outer Glow Ring for Mic */}
        <div className="relative flex items-center justify-center">
          <div className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${
            isListening ? "bg-sky-500/30 opacity-100" : "bg-transparent opacity-0"
          }`} />
          <div className={`h-11 w-11 rounded-full flex items-center justify-center border border-white/10 bg-white/5 transition-transform duration-300 ${
            isListening ? "scale-105 border-sky-400/30 text-sky-400" : "text-gray-400"
          }`}>
            <Mic className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
          </div>
        </div>

        {/* Informative Drag and Text Status Center */}
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <span className="text-sm font-medium text-white/90 truncate leading-snug">
            {transcript || "Ask Alsa anything..."}
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-sky-400/60 uppercase mt-0.5 flex items-center gap-1">
            <ChevronUp className={`h-3 w-3 ${dragOffset > 20 ? "animate-bounce" : ""}`} /> 
            Swipe up for full chat workspace
          </span>
        </div>

        {/* Quick Keyboard Input Toggle Action */}
        <button
          type="button"
          onClick={onExpand}
          className="h-11 w-11 rounded-full flex items-center justify-center border border-white/5 bg-white/[0.02] text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Open text layout input"
        >
          <Keyboard className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
};

export default WakeInput;
