// Vibe Coder — Lovable-style AI app builder edge function
// Streams generated project files (JSON) using Lovable AI Gateway (gemini-2.5-pro)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALSA_BADGE_HTML = `<!-- Alsa AI badge: shows for 3s with animation, then auto-hides -->
<div id="__alsa_badge__" style="position:fixed;left:50%;bottom:18px;transform:translate(-50%,40px);opacity:0;z-index:2147483647;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;padding:8px 16px;border-radius:9999px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:12px;font-weight:600;letter-spacing:.3px;box-shadow:0 8px 28px rgba(124,58,237,.45);cursor:pointer;transition:opacity .5s ease,transform .6s cubic-bezier(.2,.8,.2,1);user-select:none">
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

const SYSTEM_PROMPT = `You are **Alsa Vibe Coder** — a world-class senior full-stack engineer built by Zentryx Tech Solutions. You behave EXACTLY like Lovable: you generate complete, production-ready single-page web applications based on the user's prompt.

## Tech Stack You ALWAYS Use
- **React 18 + Vite + TypeScript** (or plain HTML/CSS/JS if user explicitly asks)
- **Tailwind CSS** via CDN for styling (semantic, beautiful, modern)
- **shadcn-style** components, hand-rolled with Tailwind when needed
- **lucide-react** icons via CDN/ESM where possible
- **Supabase JS client** when the user has connected Supabase (URL + anon key will be in context)
- **Lovable AI Gateway** style edge functions when the user wants AI features

## STRICT File Structure (root layout MUST be exactly this)
Root directory contains ONLY:
- \`index.html\` (entry HTML at root)
- \`.env\` (environment variables file at root — include placeholders)
- \`src/\` folder (all React/TS source code: App.tsx, main.tsx, components/, pages/, etc.)
- \`public/\` folder (static assets: images, favicons, robots.txt)
- \`supabase/\` folder (only when backend is needed: supabase/functions/<name>/index.ts, supabase/config.toml, supabase/migrations/)

Do NOT put package.json, README, vite.config or anything else in the file map unless the user explicitly asks. Keep it minimal: index.html + .env + src/* + public/* + supabase/* only.

## Process Narration (REQUIRED)
The "explanation" field must NARRATE step-by-step what you did and how, in friendly Hinglish, with bullet markers like:
\`\`\`
🧠 Plan: ...
📁 Structure: index.html, .env, src/, public/, supabase/
🎨 UI: ...
⚙️ Logic: ...
✅ Done — open Preview tab to see it live!
\`\`\`
This narration appears in chat so the user knows exactly what is happening.

## Incremental Edits
If the user asks to ADD or CHANGE something on an existing project, only return the files that actually changed (plus any new ones). The system will merge them. Always still return a complete fresh \`preview_html\`.

## Alsa AI Badge (MANDATORY)
Inside BOTH the generated \`index.html\` (just before \`</body>\`) AND inside \`preview_html\` (just before \`</body>\`), inject this exact snippet verbatim:
${ALSA_BADGE_HTML}

## Output Format — STRICT
You MUST respond with ONLY a single valid JSON object, no markdown fences, no prose before or after:
{
  "explanation": "Hinglish step-by-step narration as described above.",
  "project_name": "kebab-case-name",
  "files": {
    "index.html": "<!doctype html>...includes Alsa badge before </body>...",
    ".env": "VITE_APP_NAME=...\\n",
    "src/main.tsx": "...",
    "src/App.tsx": "...",
    "public/robots.txt": "User-agent: *\\nAllow: /",
    "supabase/functions/example/index.ts": "..."  // only if user needs backend
  },
  "preview_html": "FULL self-contained HTML using https://cdn.tailwindcss.com + https://esm.sh/react@18 + https://esm.sh/react-dom@18/client (type=module). MUST include the Alsa badge snippet before </body>."
}

## CRITICAL Rules
1. ALWAYS include "preview_html" — single self-contained HTML doc using CDNs. Iframe has no build step.
2. Files in "files" should be a real Vite + React + TS project the user can download and run.
3. Design must be beautiful: gradients, modern typography, proper spacing, responsive, dark-mode aware.
4. Use semantic HTML, accessibility, clean components.
5. If a Supabase URL + anon key was provided in context, wire up @supabase/supabase-js using them via .env vars.
6. If the user asks for an AI feature, scaffold a Supabase edge function under \`supabase/functions/\` calling https://ai.gateway.lovable.dev/v1/chat/completions with \`Bearer \${LOVABLE_API_KEY}\`. Mention required secrets in the explanation.
7. NEVER include backtick fences around the JSON. Pure JSON only.
8. Keep \`preview_html\` under ~50KB.
9. The Alsa AI badge MUST appear in both index.html and preview_html. Never remove it.

Founder context (use only if asked): Alsa AI and Zentryx Tech Solutions are both founded by Mohd Eisa Bey.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, prompt, history, supabaseUrl, supabaseAnonKey, attachments } =
      await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Credit check (admins/team are unlimited — checked client-side too)
    const ADMIN_EMAILS = [
      "qadrieisa@gmail.com",
      "alsa.ai.assistant@gmail.com",
      "founder@alsa-ai.in",
    ];
    const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());

    if (!isAdmin) {
      // Must be Elite
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
            error: "Vibe Coding sirf Elite members ke liye hai. Pricing page se upgrade kar le bhai.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Daily 5 credit check
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
            error: "Aaj ke 5 Vibe credits khatam ho gaye boss. Kal subah refresh ho jayenge!",
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

    // Build context for the AI
    const contextLines: string[] = [];
    if (supabaseUrl && supabaseAnonKey) {
      contextLines.push(
        `User has connected their Supabase project. Use these in the generated app:\nVITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_ANON_KEY=${supabaseAnonKey}`
      );
    }
    if (attachments && Array.isArray(attachments) && attachments.length) {
      contextLines.push(
        `User attached files (filenames only, content may be excerpted): ${attachments
          .map((a: any) => a.name)
          .join(", ")}`
      );
      for (const a of attachments) {
        if (a.text) contextLines.push(`--- ${a.name} ---\n${a.text.slice(0, 4000)}`);
      }
    }

    // Pass current project files so the AI can do incremental edits
    if (projectId) {
      const { data: existing } = await supabase
        .from("vibecoding_projects")
        .select("files")
        .eq("id", projectId)
        .maybeSingle();
      const ef = (existing?.files || {}) as Record<string, string>;
      const fileNames = Object.keys(ef).filter((f) => f !== "__preview__.html");
      if (fileNames.length) {
        contextLines.push(
          `EXISTING PROJECT FILES (modify only what user asks; return only changed/new files):\n${fileNames.join("\n")}`
        );
        // include small files inline so AI can edit them
        for (const fn of fileNames.slice(0, 12)) {
          const c = ef[fn] || "";
          if (c.length < 6000) contextLines.push(`--- ${fn} ---\n${c}`);
        }
      }
    }

    const messages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history : []).slice(-6),
    ];
    if (contextLines.length) {
      messages.push({ role: "system", content: contextLines.join("\n\n") });
    }
    messages.push({ role: "user", content: prompt });

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages,
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, txt);
      if (aiResp.status === 429)
        return new Response(
          JSON.stringify({ error: "AI rate limit. Thodi der baad try kar." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      if (aiResp.status === 402)
        return new Response(
          JSON.stringify({ error: "AI credits khatam — workspace mai add kar." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiResp.json();
    let raw: string = data.choices?.[0]?.message?.content || "{}";
    console.log("vibe-coder raw response length:", raw.length);

    // Strip markdown fences if AI wrapped JSON in ```json ... ```
    raw = raw.trim();
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error("JSON parse failed, attempting extraction:", err);
      const m = raw.match(/\{[\s\S]*\}/);
      try {
        parsed = m ? JSON.parse(m[0]) : null;
      } catch {
        parsed = null;
      }
      if (!parsed) {
        parsed = { explanation: raw.slice(0, 2000), files: {}, preview_html: "" };
      }
    }

    // Sanity defaults
    parsed.files = parsed.files && typeof parsed.files === "object" ? parsed.files : {};
    parsed.explanation = parsed.explanation || "Done!";
    parsed.preview_html = typeof parsed.preview_html === "string" ? parsed.preview_html : "";

    const ensureBadge = (html: string) => {
      if (!html || typeof html !== "string") return html;
      if (html.includes("__alsa_badge__")) return html;
      if (html.includes("</body>")) return html.replace("</body>", `${ALSA_BADGE_HTML}\n</body>`);
      return html + ALSA_BADGE_HTML;
    };

    // Fallback: if AI didn't return preview_html, derive it from generated index.html
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

    console.log("vibe-coder result files:", Object.keys(parsed.files).length, "preview length:", parsed.preview_html.length);

    // Persist to project (merge files)
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
    console.error("vibe-coder error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
