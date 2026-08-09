// Alsa AI — Speech to Text (multipart WAV in -> { text } out)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const contentType = req.headers.get("content-type") || "";
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const f = form.get("file");
      if (f instanceof File) file = f;
    } else {
      // base64 JSON fallback: { audio: "<base64>", mime?: "audio/wav" }
      const body = await req.json().catch(() => ({}));
      if (body?.audio) {
        const bin = atob(body.audio);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        file = new File([bytes], "recording.wav", { type: body.mime || "audio/wav" });
      }
    }

    if (!file || file.size < 1200) {
      return new Response(JSON.stringify({ text: "" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = new FormData();
    upstream.append("model", "openai/gpt-4o-transcribe");
    upstream.append("file", file, file.name || "recording.wav");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: upstream,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Transcription failed:", res.status, errText);
      return new Response(JSON.stringify({ error: "Transcription failed", detail: errText }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ text: data?.text || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("transcribe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
