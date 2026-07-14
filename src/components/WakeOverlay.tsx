import { X, Mic } from "lucide-react";
import VoiceOrb from "./VoiceOrb";

interface WakeOverlayProps {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  onClose: () => void;
}

const WakeOverlay = ({
  isListening,
  isSpeaking,
  transcript,
  onClose,
}: WakeOverlayProps) => {
  return (
    <div className="fixed inset-0 z-[99999] bg-background/95 backdrop-blur-2xl flex flex-col">

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-5">

        <div>
          <h1 className="text-xl font-semibold text-white">
            ALSA AI
          </h1>

          <p className="text-sm text-muted-foreground">
            Always Listening...
          </p>
        </div>

        {/* Mini Orb */}
        <div className="scale-[0.35] origin-top-right">
          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
          />
        </div>

        <button
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/10 transition"
        >
          <X className="h-6 w-6 text-white" />
        </button>

      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col justify-center items-center px-8">

        <div className="mb-12">

          <VoiceOrb
            isListening={isListening}
            isSpeaking={isSpeaking}
          />

        </div>

        <div className="text-center">

          <h2 className="text-3xl font-semibold text-white">

            {isSpeaking
              ? "Speaking..."
              : isListening
              ? "Listening..."
              : "Say \"Hey ALSA\""}

          </h2>

          <p className="mt-5 text-lg text-muted-foreground max-w-xl">

            {transcript || "Waiting for your voice..."}

          </p>

        </div>

      </div>

      {/* Bottom Input Preview */}
      <div className="p-6">

        <div
          className="
            mx-auto
            max-w-2xl
            rounded-full
            border
            border-primary/20
            bg-white/5
            backdrop-blur-xl
            px-6
            py-4
            flex
            items-center
            gap-4
          "
        >

          <Mic
            className={`h-6 w-6 ${
              isListening
                ? "text-cyan-400 animate-pulse"
                : "text-muted-foreground"
            }`}
          />

          <span className="flex-1 text-white text-lg truncate">

            {transcript || "Speak something..."}

          </span>

        </div>

      </div>

    </div>
  );
};

export default WakeOverlay;
