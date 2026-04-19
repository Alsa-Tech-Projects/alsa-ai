import { useEffect, useRef, useState } from "react";
import { Send, Plus, Mic, ImageIcon, X, Sparkles, Square, Brain, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onSend: (text: string, imageDataUrl?: string | null, generateImage?: boolean) => void;
  disabled?: boolean;
  onStop?: () => void;
  isStreaming?: boolean;
  thinking: boolean;
  onToggleThinking: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const ChatComposer = ({
  onSend, disabled, onStop, isStreaming, thinking, onToggleThinking,
}: Props) => {
  const [text, setText] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [genImageMode, setGenImageMode] = useState(false);
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  // For dedup of speech results — store transcript baseline at start
  const baseTextRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + "px";
    }
  }, [text]);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Sirf image files supported hain");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error("Image 5MB se chhoti honi chahiye");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = () => {
    if (!text.trim() && !imageData) return;
    onSend(text.trim(), imageData, genImageMode);
    setText("");
    setImageData(null);
    setGenImageMode(false);
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error("Voice input is not supported in this browser");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    baseTextRef.current = text ? text + " " : "";
    finalTranscriptRef.current = "";

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error !== "no-speech" && e.error !== "aborted") {
        toast.error("Mic error: " + (e.error || "unknown"));
      }
    };
    // Fix: only append NEW final results, show interim separately, no duplication
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscriptRef.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      setText(baseTextRef.current + finalTranscriptRef.current + interim);
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      // ignore double-start
    }
  };

  return (
    <div className="px-3 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* Mode toggle */}
        <div className="flex justify-center mb-2">
          <div className="inline-flex bg-surface rounded-full p-1 border border-border">
            <button
              onClick={() => thinking && onToggleThinking()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                !thinking ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Zap className="w-3 h-3" /> Fast
            </button>
            <button
              onClick={() => !thinking && onToggleThinking()}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                thinking ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Brain className="w-3 h-3" /> Thinking
            </button>
          </div>
        </div>

        {(imageData || genImageMode) && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {imageData && (
              <div className="relative inline-block">
                <img src={imageData} alt="preview" className="h-20 rounded-xl border border-border" />
                <button
                  onClick={() => setImageData(null)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {genImageMode && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-sm text-primary">
                <Sparkles className="w-3.5 h-3.5" /> Image generation mode
                <button onClick={() => setGenImageMode(false)}><X className="w-3 h-3" /></button>
              </div>
            )}
          </div>
        )}

        <div className="bg-surface rounded-3xl border border-border shadow-soft px-2 py-2 flex items-end gap-1">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-hover flex-shrink-0"
            onClick={() => fileRef.current?.click()}
            title="Upload image"
          >
            <Plus className="w-5 h-5" />
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "rounded-full flex-shrink-0",
              genImageMode
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
            )}
            onClick={() => setGenImageMode(!genImageMode)}
            title="Generate image"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>

          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={genImageMode ? "Describe an image to generate..." : "Ask Alsa AI anything..."}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none px-2 py-2.5 text-[15px] placeholder:text-muted-foreground max-h-[200px]"
          />

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn(
              "rounded-full flex-shrink-0",
              listening ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover",
            )}
            onClick={toggleVoice}
            title="Voice input"
          >
            <Mic className="w-5 h-5" />
          </Button>

          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              onClick={onStop}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 flex-shrink-0"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={submit}
              disabled={disabled || (!text.trim() && !imageData)}
              className="rounded-full gemini-bg-gradient text-white hover:opacity-90 flex-shrink-0 disabled:opacity-40"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-2">
          Alsa AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
};
