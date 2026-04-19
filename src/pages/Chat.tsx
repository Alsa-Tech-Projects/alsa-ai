import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageBubble, ChatMessage } from "@/components/chat/MessageBubble";
import { Button } from "@/components/ui/button";
import { Menu, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Mujhe aaj ka motivational quote bhejo 💪",
  "Generate an image of a futuristic city at sunset",
  "https://news.ycombinator.com — top headlines summarize karo",
  "Plan a 3-day trip to Goa for me",
];

const FUNCTION_NAME = "mobile-chat";

export default function Chat() {
  const { user } = useAuth();
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }
    supabase
      .from("messages")
      .select("id, role, content, image_url, created_at")
      .eq("conversation_id", activeConvo)
      .order("created_at")
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to load messages");
          return;
        }
        setMessages(
          (data || []).map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            imageUrl: m.image_url,
          })),
        );
      });
  }, [activeConvo]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const ensureConvo = async (firstUserText: string): Promise<string | null> => {
    if (activeConvo) return activeConvo;
    if (!user) return null;
    const title = firstUserText.slice(0, 60) || "New chat";
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title })
      .select()
      .single();
    if (error || !data) {
      toast.error("Couldn't create conversation");
      return null;
    }
    setActiveConvo(data.id);
    setRefreshKey((k) => k + 1);
    return data.id;
  };

  const persistMessage = async (
    convoId: string,
    role: "user" | "assistant",
    content: string,
    imageUrl?: string | null,
  ) => {
    if (!user) return;
    await supabase.from("messages").insert({
      conversation_id: convoId,
      user_id: user.id,
      role,
      content,
      image_url: imageUrl ?? null,
    });
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convoId);
  };

  const handleSend = async (text: string, imageDataUrl?: string | null, generateImage?: boolean) => {
    if (!user) return;
    const convoId = await ensureConvo(text || "Image");
    if (!convoId) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      imageUrl: imageDataUrl ?? null,
    };
    setMessages((m) => [...m, userMsg]);
    await persistMessage(convoId, "user", text, imageDataUrl);
    setRefreshKey((k) => k + 1);

    // Auto-detect image-edit intent: user uploaded an image AND asked to edit
    const editKeywords = /\b(edit|change|modify|remove|add|replace|make|turn|convert|transform|put|background|color|colour)\b/i;
    const isEditRequest = !!imageDataUrl && editKeywords.test(text);

    // ── IMAGE GENERATION / EDIT ────────────────
    if (generateImage || isEditRequest) {
      setStreaming(true);
      const placeholder: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        isStreaming: true,
      };
      setMessages((m) => [...m, placeholder]);
      try {
        const userContent: any = imageDataUrl
          ? [
              { type: "text", text: text || "Generate / edit this image" },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ]
          : text;

        const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
          body: { mode: "image", messages: [{ role: "user", content: userContent }] },
        });
        if (error) throw error;
        const finalMsg: ChatMessage = {
          id: placeholder.id,
          role: "assistant",
          content: data.text || (isEditRequest ? "Yeh raha edited image ✨" : "Yeh raha aapka image ✨"),
          imageUrl: data.imageUrl,
        };
        setMessages((m) => m.map((x) => (x.id === placeholder.id ? finalMsg : x)));
        await persistMessage(convoId, "assistant", finalMsg.content, finalMsg.imageUrl);
      } catch (e: any) {
        toast.error(e.message || "Image generation failed");
        setMessages((m) => m.filter((x) => x.id !== placeholder.id));
      } finally {
        setStreaming(false);
      }
      return;
    }

    // ── STREAMING CHAT ──
    setStreaming(true);
    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, { id: assistantId, role: "assistant", content: "", isStreaming: true }]);

    const history = [...messages, userMsg].map((m) => {
      if (m.imageUrl && m.role === "user") {
        return {
          role: m.role,
          content: [
            { type: "text", text: m.content || "Describe this image." },
            { type: "image_url", image_url: { url: m.imageUrl } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history, thinking }),
        signal: controller.signal,
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Rate limit. Please wait and try again.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Failed to get response");
        setMessages((m) => m.filter((x) => x.id !== assistantId));
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantSoFar = "";
      let done = false;

      while (!done) {
        const { done: rd, value } = await reader.read();
        if (rd) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantSoFar += delta;
              setMessages((m) =>
                m.map((x) => (x.id === assistantId ? { ...x, content: assistantSoFar } : x)),
              );
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      setMessages((m) =>
        m.map((x) => (x.id === assistantId ? { ...x, isStreaming: false } : x)),
      );
      if (assistantSoFar) await persistMessage(convoId, "assistant", assistantSoFar);
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message || "Stream error");
      }
      setMessages((m) =>
        m.map((x) => (x.id === assistantId ? { ...x, isStreaming: false } : x)),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();

  const isEmpty = messages.length === 0;

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <ConversationSidebar
        activeId={activeConvo}
        onSelect={setActiveConvo}
        refreshKey={refreshKey}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 p-4 border-b border-border md:border-b-0">
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-medium text-muted-foreground">
            <span className="gemini-text-gradient font-semibold">Alsa AI</span>
          </h1>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll">
          {isEmpty ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <div className="w-16 h-16 rounded-3xl gemini-bg-gradient flex items-center justify-center mb-6 shadow-glow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-5xl font-medium mb-3">
                <span className="gemini-text-gradient">Hello, {user?.email?.split("@")[0]}</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-10">How can I help you today?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s, null, s.toLowerCase().includes("image") && !s.includes("http"))}
                    className="text-left p-4 rounded-2xl bg-surface hover:bg-surface-hover border border-border text-sm text-foreground transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>

        <ChatComposer
          onSend={handleSend}
          disabled={streaming}
          onStop={handleStop}
          isStreaming={streaming}
          thinking={thinking}
          onToggleThinking={() => setThinking((t) => !t)}
        />
      </main>
    </div>
  );
}
