// Vibe Coder — Alsa AI full-stack web builder edge function
// Powered directly by Google Gemini API with fallback & rate-limit handling

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALSA_BADGE_HTML = `<div id="__alsa_badge__" style="position:fixed;left:50%;bottom:18px;transform:translate(-50%,40px);opacity:0;z-index:2147483647;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:8px 16px;border-radius:9999px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;font-weight:600;letter-spacing:.3px;box-shadow:0 8px 28px rgba(124,58,237,.45);cursor:pointer;transition:opacity .5s ease,transform .6s cubic-bezier(.2,.8,.2,1);user-select:none">
<a href="https://www.alsa-ai.in" target="_blank" rel="noopener" style="color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:6px">
<span style="width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 10px #fff;display:inline-block"></span>
Created by Alsa AI
</a>
</div>
<script>
(function(){
var b=document.getElementById('__alsa_badge__');if(!b)return;
setTimeout(function(){b.style.opacity='1';b.style.transform='translate(-50%,0)';},300);
setTimeout(function(){b.style.opacity='0';b.style.transform='translate(-50%,40px)';setTimeout(function(){b.remove();},700);},3300);
})();
</script>`;

const SYSTEM_PROMPT = `You are **Alsa Vibe Coder** — a world-class senior full-stack engineer built by Zentryx Tech Solutions. You generate complete, production-ready full-stack web applications based on the user's prompt.

## Tech Stack You ALWAYS Use
- **React 18 + Vite + TypeScript**
- **Tailwind CSS** via CDN for styling (semantic, beautiful, dark-mode aware)
- **3D & Visual Effects**: Support Three.js, Lucide icons, Canvas 3D elements, and CSS animations via CDNs when standard or 3D websites are requested.
- **Supabase JS client** when backend integration is needed (URL + anon key will be in context)

## STRICT File Structure
Root directory MUST strictly contain:
- \`index.html\` (entry HTML at root)
- \`.env\` (environment variables file at root)
- \`src/\` folder (all React/TS code: App.tsx, main.tsx, components/, pages/, etc.)
- \`public/\` folder (static assets)
- \`supabase/\` folder (only when backend is requested: supabase/functions/<name>/index.ts, supabase/config.toml, etc.)

Do NOT include package.json, README, or vite.config unless explicitly requested.

## Process Narration
The "explanation" field must narrate step-by-step what you built in friendly, simple narration:

\`\`\`
🧠 Plan: ...
📁 Structure: index.html, .env, src/, public/, supabase/
🎨 UI & 3D Styling: ...
⚙️ Logic: ...
✅ Complete — open Preview tab to see it live!
\`\`\`

## Output Format — STRICT JSON
Respond with ONLY a single valid JSON object, no markdown fences:
{
"explanation": "Step-by-step narration.",
"project_name": "kebab-case-name",
"files": {
"index.html": "<!doctype html>...",
".env": "VITE_APP_NAME=...\\n",
"src/main.tsx": "...",
"src/App.tsx": "...",
"public/robots.txt": "User-agent: *\\nAllow: /"
},
"preview_html": "FULL self-contained HTML using https://cdn.tailwindcss.com + https://esm.sh/react@18 + https://esm.sh/react-dom@18/client + optional https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js for 3D elements."
}

## CRITICAL Rules
1. ALWAYS include "preview_html" — single self-contained HTML document with CDNs for instant preview.
2. Design must be modern, responsive, visually striking, with optional smooth 3D elements when requested.
3. The Alsa AI badge MUST appear in both index.html and preview_html before </body>.

Founder context: Alsa AI and Zentryx Tech Solutions are founded by Mohd Eisa Bey.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, prompt, history, supabaseUrl, supabaseAnonKey, attachments } =
      await req.json();

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY_VIBE_CODER");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration issue: GEMINI_API_KEY is missing." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth verification
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Please sign in to your account first." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: userData } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    const user = userData?.user;
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Session expired. Please sign in again." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Credit & Tier Check
    const ADMIN_EMAILS = [
      "qadrieisa@gmail.com",
      "alsa.ai.assistant@gmail.com",
      "founder@alsa-ai.in",
    ];
    const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());

    if (!isAdmin) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();

      const tierOk =
        profile?.subscription_tier === "elite" &&
        (!profile.subscription_expires_at ||
          new Date(profile.subscription_expires_at) > new Date());

      if (!tierOk) {
        return new Response(
          JSON.stringify({
            error: "Vibe Coder is an Elite feature. Please upgrade your account to access it.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: credit } = await supabase
        .from("vibecoding_credits")
        .select("id, credits_used")
        .eq("user_id", user.id)
        .eq("credit_date", today)
        .maybeSingle();

      const used = credit?.credits_used ?? 0;
      if (used >= 5) {
        return new Response(
          JSON.stringify({
            error: "You have used all 5 free daily generation credits for today. They will reset tomorrow morning!",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (credit) {
        await supabase
          .from("vibecoding_credits")
          .update({ credits_used: used + 1 })
          .eq("id", credit.id);
      } else {
        await supabase.from("vibecoding_credits").insert({
          user_id: user.id,
          credit_date: today,
          credits_used: 1,
        });
      }
    }

    // Context Building
    const contextLines: string[] = [];
    if (supabaseUrl && supabaseAnonKey) {
      contextLines.push(
        `User connected Supabase:\nVITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`
      );
    }

    if (attachments && Array.isArray(attachments) && attachments.length) {
      contextLines.push(
        `Attached files: ${attachments.map((a: any) => a.name).join(", ")}`
      );
      for (const a of attachments) {
        if (a.text) contextLines.push(`--- ${a.name} ---\n${a.text.slice(0, 4000)}`);
      }
    }

    if (projectId) {
      const { data: existing } = await supabase
        .from("vibecoding_projects")
        .select("files")
        .eq("id", projectId)
        .maybeSingle();
      const ef = (existing?.files || {}) as Record<string, string>;
      const fileNames = Object.keys(ef).filter((f) => f !== "__preview__.html");
      if (fileNames.length) {
        contextLines.push(`EXISTING PROJECT FILES:\n${fileNames.join("\n")}`);
        for (const fn of fileNames.slice(0, 12)) {
          const c = ef[fn] || "";
          if (c.length < 6000) contextLines.push(`--- ${fn} ---\n${c}`);
        }
      }
    }

    // Native Gemini API Request construction
    const fullSystemPrompt = SYSTEM_PROMPT + (contextLines.length ? `\n\n${contextLines.join("\n\n")}` : "");

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role === "user" || msg.role === "assistant" || msg.role === "model") {
          contents.push({
            role: msg.role === "assistant" ? "model" : msg.role,
            parts: [{ text: msg.content || "" }],
          });
        }
      }
    }

    contents.push({
      role: "user",
      parts: [{ text: prompt }],
    });

    // Valid Stable Gemini Models Priority List
        // Gemini API Priority Models List
    const MODELS = [
      "gemini-3.6-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let aiResp: Response | null = null;
    let lastErrorText = "";

    for (const model of MODELS) {
      let attempt = 0;
      while (attempt < 2) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                system_instruction: { parts: [{ text: fullSystemPrompt }] },
                contents,
                generationConfig: { responseMimeType: "application/json" },
              }),
            }
          );

          if (res.ok) {
            aiResp = res;
            break;
          }

          lastErrorText = await res.text();
          console.warn(`Model ${model} failed (Status ${res.status}): ${lastErrorText}`);

          // Agar 404 Not Found hai toh agle model par jump karo
          if (res.status === 404) break;

          // Rate limit (429) par 1.5 second wait karke retry karo
          if (res.status === 429 && attempt === 0) {
            await delay(1500);
            attempt++;
          } else {
            break;
          }
        } catch (err: any) {
          lastErrorText = err?.message || String(err);
          break;
        }
      }

      if (aiResp) break; // Request success hote hi loop stop
    }

    if (!aiResp) {
      console.error("All Gemini API models failed. Last error:", lastErrorText);
      return new Response(
        JSON.stringify({
          error: "Gemini API Request Failed",
          details: lastErrorText,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }


    const data = await aiResp.json();
    let raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    raw = raw.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      try { parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }
      if (!parsed) parsed = { explanation: raw.slice(0, 2000), files: {}, preview_html: "" };
    }

    parsed.files = parsed.files && typeof parsed.files === "object" ? parsed.files : {};
    parsed.explanation = parsed.explanation || "Done!";
    parsed.preview_html = typeof parsed.preview_html === "string" ? parsed.preview_html : "";

    const ensureBadge = (html: string) => {
      if (!html || typeof html !== "string") return html;
      if (html.includes("__alsa_badge__")) return html;
      if (html.includes("</body>")) return html.replace("</body>", `${ALSA_BADGE_HTML}\n</body>`);
      return html + ALSA_BADGE_HTML;
    };

    if (!parsed.preview_html) {
      const indexKey = Object.keys(parsed.files).find((k) => k.toLowerCase().endsWith("index.html"));
      if (indexKey) parsed.preview_html = parsed.files[indexKey];
    }

    if (parsed.preview_html) parsed.preview_html = ensureBadge(parsed.preview_html);
    for (const k of Object.keys(parsed.files)) {
      if (k.toLowerCase().endsWith("index.html")) {
        parsed.files[k] = ensureBadge(parsed.files[k]);
      }
    }

    if (projectId) {
      const { data: proj } = await supabase
        .from("vibecoding_projects")
        .select("files")
        .eq("id", projectId)
        .maybeSingle();
      const merged = { ...(proj?.files || {}), ...(parsed.files || {}) };
      await supabase
        .from("vibecoding_projects")
        .update({
          files: merged,
          name: parsed.project_name || undefined,
        })
        .eq("id", projectId);
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Alsa Vibe Coder Error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

