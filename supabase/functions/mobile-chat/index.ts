// Mobile Chat Edge Function — Streaming + Image Generation + File Analysis + Cross-Conversation Memory
// Optimized for phone UI (Chats.tsx)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const MOBILE_SYSTEM_PROMPT = `Tum Alsa AI ho — ek friendly Hinglish AI assistant jo phone par chat karta hai.

📱 RESPONSE STYLE:
- Replies clear, useful, point-to-point ho. Lambi essay tabhi jab user maange.
- Markdown use karo: **bold**, *italic*, lists, code blocks (compact).
- Code blocks ke liye triple backticks aur language tag (\`\`\`js, \`\`\`python).
- Emojis sparingly (1-2 max).
- Default language Hinglish (Hindi + English mix in Roman script). Agar user pure English/Hindi mein likhe to match karo.
- Greetings short ("Haan bhai, batao!" types).

🧠 MEMORY:
- Tumhe user ki pichli conversations ka summary milega — usse user ke context, preferences aur ongoing topics yaad rakho.
- Past references ko naturally use karo, jaise ek dost yaad dilata hai.

📎 FILES:
- User images, PDFs, docs, audio bhej sakta hai. Unhe carefully analyse karke detailed answer do.
- PDFs/docs ka extracted text user message ke saath aata hai — uska context use karo.`;

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
  files?: Array<{
    name: string;
    type: string;
    data: string; // base64 data URL or extracted text
    extractedText?: string;
  }>;
  imageUrl?: string | null;
}

// Build OpenAI-compatible message content from incoming msg with files
function buildContent(msg: IncomingMessage): any {
  const files = msg.files || [];
  const hasImage = files.some((f) => f.type?.startsWith("image/")) || !!msg.imageUrl;
  const textParts: string[] = [msg.content || ""];

  // Append extracted text from non-image files inline
  for (const f of files) {
    if (!f.type?.startsWith("image/") && f.extractedText) {
      textParts.push(`\n\n--- File: ${f.name} ---\n${f.extractedText.slice(0, 8000)}`);
    } else if (!f.type?.startsWith("image/")) {
      textParts.push(`\n\n[Attached file: ${f.name} (${f.type})]`);
    }
  }

  if (!hasImage) {
    return textParts.join("").trim() || "(empty)";
  }

  // Multimodal array
  const parts: any[] = [{ type: "text", text: textParts.join("").trim() || "Describe these images." }];
  if (msg.imageUrl) {
    parts.push({ type: "image_url", image_url: { url: msg.imageUrl } });
  }
  for (const f of files) {
    if (f.type?.startsWith("image/") && f.data) {
      parts.push({ type: "image_url", image_url: { url: f.data } });
    }
  }
  return parts;
}

// Pull cross-conversation memory: recent messages from user's other conversations
async function getCrossConversationContext(
  userId: string,
  currentConvoId: string | null,
): Promise<string> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get last 5 conversations (excluding current), with last few messages each
    const { data: convos } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .neq("id", currentConvoId || "00000000-0000-0000-0000-000000000000")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (!convos || convos.length === 0) return "";

    const summaries: string[] = [];
    for (const c of convos) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!msgs || msgs.length === 0) continue;
      const snippet = msgs
        .reverse()
        .map((m: any) => `${m.role === "user" ? "U" : "A"}: ${(m.content || "").slice(0, 200)}`)
        .join("\n");
      summaries.push(`### Past chat: "${c.title}"\n${snippet}`);
    }

    if (summaries.length === 0) return "";
    return `\n\n🧠 USER'S RECENT CONVERSATIONS (for memory/context only — don't mention unless relevant):\n\n${summaries.join("\n\n")}`;
  } catch (e) {
    console.error("cross-convo context error:", e);
    return "";
  }
}

async function streamChat(
  messages: IncomingMessage[],
  thinking: boolean,
  memoryContext: string,
) {
  const model = thinking ? "google/gemini-2.5-pro" : "google/gemini-3.6-flash";

  const body = {
    model,
    messages: [
      { role: "system", content: MOBILE_SYSTEM_PROMPT + memoryContext },
      ...messages.map((m) => ({ role: m.role, content: buildContent(m) })),
    ],
    stream: true,
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const text = await resp.text();
    console.error("AI gateway error:", resp.status, text);
    return new Response(JSON.stringify({ error: text }), {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(resp.body, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function generateOrEditImage(messages: IncomingMessage[]) {
  // Use Lovable AI Gateway with nano-banana-2 (fast + high quality)
  const body = {
    model: "google/gemini-3.1-flash-image-preview",
    messages: messages.map((m) => ({ role: m.role, content: buildContent(m) })),
    modalities: ["image", "text"],
  };

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error("Image gen error:", resp.status, errText);
    return new Response(
      JSON.stringify({ error: `Image generation failed: ${errText}` }),
      { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const data = await resp.json();
  const choice = data.choices?.[0]?.message;
  const imageUrl: string | undefined =
    choice?.images?.[0]?.image_url?.url || choice?.images?.[0]?.url;
  const text: string = choice?.content || "";

  return new Response(JSON.stringify({ imageUrl, text }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const {
      messages = [],
      mode = "chat",
      thinking = false,
      userId = null,
      conversationId = null,
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "image") {
      return await generateOrEditImage(messages);
    }

    // Pull cross-conversation memory for chat mode
    let memoryContext = "";
    if (userId) {
      memoryContext = await getCrossConversationContext(userId, conversationId);
    }

    return await streamChat(messages, thinking, memoryContext);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("mobile-chat error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
