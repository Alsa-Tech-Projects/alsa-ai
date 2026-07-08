import { useEffect, useRef, useState } from "react";
import { Send, Plus, Mic, ImageIcon, X, Sparkles, Square, Brain, Zap, FileText, Music, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AttachedFile {
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL
  extractedText?: string; // for PDF/docx/text
}

interface Props {
  onSend: (text: string, files: AttachedFile[], generateImage?: boolean) => void;
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

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 5;

export const ChatComposer = ({
  onSend, disabled, onStop, isStreaming, thinking, onToggleThinking,
}: Props) => {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [genImageMode, setGenImageMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [parsing, setParsing] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    if (taRef.current) {
      taRef.current.style.height = "auto";
      taRef.current.style.height = Math.min(taRef.current.scrollHeight, 200) + "px";
    }
  }, [text]);

  const readAsDataURL = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(f);
    });

  const readAsText = (f: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsText(f);
    });

  // Lightweight client-side text extraction (PDF via pdfjs-dist if available, else just attach as data)
  // For txt/json/csv/md → just read as text. PDF/docx → we'll send the data URL and let backend describe via name only.
  // To keep bundle small we extract text only for plain text-like files; PDFs we send the file so backend/AI can reason about presence.
  const extractText = async (f: File): Promise<string | undefined> => {
    const t = f.type;
    const name = f.name.toLowerCase();
    const isText =
      t.startsWith("text/") ||
      t === "application/json" ||
      t === "application/xml" ||
      name.endsWith(".md") || name.endsWith(".txt") || name.endsWith(".csv") ||
      name.endsWith(".json") || name.endsWith(".log") || name.endsWith(".xml") ||
      name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".tsx") ||
      name.endsWith(".jsx") || name.endsWith(".py") || name.endsWith(".html") ||
      name.endsWith(".css") || name.endsWith(".yml") || name.endsWith(".yaml");
    if (isText) {
      try {
        const txt = await readAsText(f);
        return txt.slice(0, 50000);
      } catch { return undefined; }
    }
    // PDF: try to extract via pdfjs lazily
    if (t === "application/pdf" || name.endsWith(".pdf")) {
      try {
        // @ts-ignore - dynamic CDN import
        const pdfjs: any = await import(/* @vite-ignore */ ("https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs" as any));
        pdfjs.GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs";
        const buf = await f.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let out = "";
        const pages = Math.min(doc.numPages, 30);
        for (let i = 1; i <= pages; i++) {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          out += tc.items.map((it: any) => it.str).join(" ") + "\n\n";
          if (out.length > 30000) break;
        }
        return out.slice(0, 30000);
      } catch (e) {
        console.warn("PDF parse failed", e);
        return undefined;
      }
    }
    return undefined;
  };

  const addFiles = async (selected: FileList) => {
    if (files.length >= MAX_FILES) {
      toast.error(`Max ${MAX_FILES} files allowed`);
      return;
    }
    setParsing(true);
    const out: AttachedFile[] = [];
    for (let i = 0; i < selected.length && files.length + out.length < MAX_FILES; i++) {
      const f = selected[i];
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} 20MB se badi hai`);
        continue;
      }
      try {
        const data = await readAsDataURL(f);
        const extractedText = await extractText(f);
        out.push({ name: f.name, type: f.type || "application/octet-stream", size: f.size, data, extractedText });
      } catch (e: any) {
        toast.error(`${f.name} read failed`);
      }
    }
    setFiles((prev) => [...prev, ...out]);
    setParsing(false);
  };

  const submit = () => {
    if (!text.trim() && files.length === 0) return;
    onSend(text.trim(), files, genImageMode);
    setText("");
    setFiles([]);
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
    try { rec.start(); } catch { /* ignore */ }
  };

  const fileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-3.5 h-3.5" />;
    if (type.startsWith("audio/")) return <Music className="w-3.5 h-3.5" />;
    return <FileText className="w-3.5 h-3.5" />;
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

        {(files.length > 0 || genImageMode || parsing) && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {files.map((f, i) => (
              <div key={i} className="relative inline-flex items-center gap-2 bg-surface border border-border rounded-xl pl-2 pr-7 py-1.5">
                {f.type.startsWith("image/") ? (
                  <img src={f.data} alt={f.name} className="h-10 w-10 rounded object-cover" />
                ) : (
                  <span className="text-muted-foreground">{fileIcon(f.type)}</span>
                )}
                <div className="flex flex-col">
                  <span className="text-[11px] text-foreground max-w-[120px] truncate">{f.name}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {(f.size / 1024).toFixed(0)} KB{f.extractedText ? " · text ✓" : ""}
                  </span>
                </div>
                <button
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {parsing && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-border text-xs text-muted-foreground">
                <span className="animate-pulse">📎 reading files…</span>
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
            ref={imgRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.txt,.md,.csv,.json,.xml,.doc,.docx,.xls,.xlsx,audio/*,text/*"
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <Button
            type="button" size="icon" variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-hover flex-shrink-0"
            onClick={() => imgRef.current?.click()}
            title="Upload image"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button
            type="button" size="icon" variant="ghost"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-hover flex-shrink-0"
            onClick={() => fileRef.current?.click()}
            title="Attach file (PDF, doc, audio)"
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <Button
            type="button" size="icon" variant="ghost"
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
            type="button" size="icon" variant="ghost"
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
              type="button" size="icon" onClick={onStop}
              className="rounded-full bg-foreground text-background hover:bg-foreground/90 flex-shrink-0"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              type="button" size="icon" onClick={submit}
              disabled={disabled || parsing || (!text.trim() && files.length === 0)}
              className="rounded-full alsa-bg-gradient text-white hover:opacity-90 flex-shrink-0 disabled:opacity-40"
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
