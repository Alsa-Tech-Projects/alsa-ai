// supabase/functions/vibe-coder/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // === 1. SMART PAYLOAD PARSER ===
    // Frontend koi bhi format bheje, hum usko Gemini ke format mein convert kar lenge
    let finalContents = body.contents;

    // Agar OpenAI format (messages array) aa raha hai:
    if (!finalContents && body.messages) {
      finalContents = body.messages.map((m: any) => ({
        role: (m.role === "assistant" || m.role === "model") ? "model" : "user",
        parts: [{ text: m.content || m.text || "" }]
      }));
    } 
    // Agar direct string (prompt) aa raha hai:
    else if (!finalContents && body.prompt) {
      finalContents = [{ role: "user", parts: [{ text: body.prompt }] }];
    }

    // Agar kuch bhi valid nahi mila:
    if (!finalContents || !Array.isArray(finalContents) || finalContents.length === 0) {
      throw new Error("Invalid format: Frontend se valid 'contents', 'messages' ya 'prompt' nahi mila.");
    }

    // === API KEYS ===
    const apiKeys = [
      Deno.env.get("GEMINI_API_KEY_VIBE_CODER"),
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_1"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
      Deno.env.get("GEMINI_API_KEY_5")
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) {
      throw new Error("Koi Gemini API Key configure nahi hai.");
    }

    const MODEL_NAME = "gemini-3.6-flash";
    
    // === 2. DYNAMIC CONFIGURATION ===
    const generationConfig: any = {
      maxOutputTokens: 8192,
      temperature: 0.7
    };
    
    // Sirf tabhi JSON force karo jab frontend explicitly maange, warna code likhne do.
    if (body.responseMimeType) {
      generationConfig.responseMimeType = body.responseMimeType;
    }

    let aiResp: Response | null = null;
    let lastErrorText = "";

    console.log(`Starting generation... Keys available: ${apiKeys.length}`);

    for (let i = 0; i < apiKeys.length; i++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKeys[i]}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: body.fullSystemPrompt ? { parts: [{ text: body.fullSystemPrompt }] } : undefined,
              contents: finalContents,
              generationConfig
            }),
          }
        );

        if (res.ok) {
          aiResp = res;
          console.log(`Success on Key #${i + 1}`);
          break;
        }

        lastErrorText = await res.text();
        console.warn(`Key #${i + 1} rejected the payload. Status: ${res.status}`);
      } catch (err: any) {
        lastErrorText = err.message || String(err);
      }
    }

    if (!aiResp) {
      console.error("All keys failed. Google Error:", lastErrorText);
      return new Response(
        JSON.stringify({ error: "All Keys Failed", details: lastErrorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiResp.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Edge Function Crash:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
