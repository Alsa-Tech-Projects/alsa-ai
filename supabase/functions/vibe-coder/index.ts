import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_INSTRUCTION = `You are Vibe Coder, an expert full-stack AI developer. 
Respond ONLY with a valid JSON object without any markdown formatting like \`\`\`json.
Strict JSON Structure required:
{
  "project_name": "Project Name",
  "explanation": "Short summary of changes",
  "files": {
    "src/App.tsx": "Code here"
  },
  "preview_html": "Complete standalone HTML with Tailwind CDN for iframe preview"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    const contents: any[] = [];
    if (body.history && Array.isArray(body.history)) {
      body.history.forEach((m: any) => {
        contents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        });
      });
    }

    if (body.prompt) {
      contents.push({ role: "user", parts: [{ text: body.prompt }] });
    }

    if (contents.length === 0) throw new Error("No prompt provided");

    const apiKeys = [
      Deno.env.get("GEMINI_API_KEY_VIBE_CODER"),
      Deno.env.get("GEMINI_API_KEY"),
      Deno.env.get("GEMINI_API_KEY_1"),
      Deno.env.get("GEMINI_API_KEY_2"),
      Deno.env.get("GEMINI_API_KEY_3"),
      Deno.env.get("GEMINI_API_KEY_4"),
      Deno.env.get("GEMINI_API_KEY_5")
    ].filter(Boolean) as string[];

    if (apiKeys.length === 0) throw new Error("No Gemini keys found");

    const MODEL_NAME = "gemini-2.5-flash"; // Ya gemini-3.6-flash agar available ho
    let geminiRes: Response | null = null;
    let lastErrorText = "";

    for (let i = 0; i < apiKeys.length; i++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:streamGenerateContent?alt=sse&key=${apiKeys[i]}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
              contents: contents,
              generationConfig: { temperature: 0.3 }
            }),
          }
        );

        if (res.ok) {
          geminiRes = res;
          break;
        }
        lastErrorText = await res.text();
      } catch (err: any) {
        lastErrorText = err.message || String(err);
      }
    }

    if (!geminiRes || !geminiRes.body) {
      throw new Error(`Google API Streaming Failed: ${lastErrorText}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const reader = geminiRes!.body!.getReader();
        let accumulatedText = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const jsonStr = line.replace("data: ", "").trim();
                  const parsed = JSON.parse(jsonStr);
                  const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (textPart) accumulatedText += textPart;
                } catch (e) {
                  // Partial JSON ignore karna hai parse karte waqt
                }
              }
            }
          }

          let cleanJson = accumulatedText.trim();
          if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "");
          } else if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "");
          }

          let finalPayload;
          try {
            finalPayload = JSON.parse(cleanJson);
          } catch (e) {
            finalPayload = {
              project_name: "Alsa Vibe Project",
              explanation: "Generated project structure successfully.",
              files: { "src/App.tsx": accumulatedText },
              preview_html: "<div><h1>Output</h1><pre>" + accumulatedText + "</pre></div>"
            };
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "complete", body: finalPayload })}\n\n`));
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: err.message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err: any) {
    console.error("Crash:", err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});