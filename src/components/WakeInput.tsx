import { useRef, useState } from "react";
import { Mic, ChevronUp } from "lucide-react";

interface WakeInputProps {
  transcript: string;
  isListening: boolean;
  onExpand: () => void;
}

const DRAG_DISTANCE = 80;

const WakeInput = ({
  transcript,
  isListening,
  onExpand,
}: WakeInputProps) => {
  const startY = useRef<number | null>(null);

  const [offset, setOffset] = useState(0);

  const begin = (y: number) => {
    startY.current = y;
  };

  const move = (y: number) => {
    if (startY.current === null) return;

    const diff = startY.current - y;

    if (diff > 0) {
      setOffset(Math.min(diff, 120));
    }
  };

  const end = () => {
    if (offset > DRAG_DISTANCE) {
      onExpand();
    }

    startY.current = null;
    setOffset(0);
  };

  return (
    <div
      className="fixed bottom-8 left-0 right-0 z-[99999] flex justify-center px-6"
      style={{
        transform: `translateY(${-offset}px)`,
        transition: startY.current ? "none" : "transform .25s ease",
      }}
      onTouchStart={(e) => begin(e.touches[0].clientY)}
      onTouchMove={(e) => move(e.touches[0].clientY)}
      onTouchEnd={end}
      onMouseDown={(e) => begin(e.clientY)}
      onMouseMove={(e) => {
        if (startY.current !== null) {
          move(e.clientY);
        }
      }}
      onMouseUp={end}
      onMouseLeave={end}
    >
      <div
        className="
          w-full
          max-w-xl
          rounded-full
          border
          border-cyan-500/30
          bg-slate-900/70
          backdrop-blur-2xl
          shadow-2xl
          px-5
          py-4
          flex
          items-center
          gap-4
          select-none
        "
      >
        <div
          className={`
            h-12
            w-12
            rounded-full
            flex
            items-center
            justify-center
            bg-cyan-500/20
            ${
              isListening
                ? "animate-pulse"
                : ""
            }
          `}
        >
          <Mic className="h-6 w-6 text-cyan-400" />
        </div>

        <div className="flex-1 overflow-hidden">
          <p className="text-white text-base truncate">
            {transcript || "Say something..."}
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Swipe up to open full chat
          </p>
        </div>

        <ChevronUp
          className={`
            h-7
            w-7
            text-cyan-400
            ${
              offset > 20
                ? "animate-bounce"
                : ""
            }
          `}
        />
      </div>
    </div>
  );
};

export default WakeInput;
