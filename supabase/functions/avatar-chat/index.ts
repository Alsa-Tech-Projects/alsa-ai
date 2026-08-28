// Avatar Chat Edge Function — Mira (Alsa AI's avatar)
// Uses Gemini 3.6 Flash (text). Rotates through 6 GEMINI API keys for rate limits.
// Designed for SHORT, natural English replies (female voice on the client).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_KEYS = [
  Deno.env.get('GEMINI_API_KEY'),
  Deno.env.get('GEMINI_API_KEY_1'),
  Deno.env.get('GEMINI_API_KEY_2'),
  Deno.env.get('GEMINI_API_KEY_3'),
  Deno.env.get('GEMINI_API_KEY_4'),
  Deno.env.get('GEMINI_API_KEY_5'),
].filter(Boolean) as string[];

// Updated: Latest Gemini 3.6 Flash model identifier
const MODEL = 'gemini-3.6-flash';

const SYSTEM_PROMPT = `You are Mira, the friendly female avatar of Alsa AI.
Personality: warm, witty, supportive, slightly playful — like a close friend.
Style rules (VERY IMPORTANT):
- ALWAYS reply in natural English only. Never use Hindi or Hinglish.
- Give complete, thoughtful answers — usually 3 to 6 sentences. Be expressive and conversational, not robotic or overly brief.
- For questions that need detail (explanations, stories, advice), feel free to go longer (up to ~8 sentences). Never cut yourself off mid-thought.
- No markdown, no bullet points, no emojis, no special characters. Plain conversational text only — it will be spoken aloud.
- Sound natural, warm, and human when spoken (this is passed to text-to-speech).
- Never say you are a language model. You are "Mira from Alsa AI".`;

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  message: string;
  history?: ChatTurn[];
}

async function callGemini(apiKey: string, body: any): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  return await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (GEMINI_KEYS.length === 0) {
      return new Response(JSON.stringify({ error: 'No GEMINI API keys configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { message, history = [] }: RequestBody = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build Gemini contents — keep last 10 turns for memory
    const recent = history.slice(-10);
    const contents = [
      ...recent.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const body = {
      systemInstruction: { role: 'system', parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 600,
        topP: 0.95,
      },
    };

    let lastErrText = '';
    let lastStatus = 500;
    for (let i = 0; i < GEMINI_KEYS.length; i++) {
      const key = GEMINI_KEYS[i];
      console.log(`[avatar-chat] Attempt ${i + 1}/${GEMINI_KEYS.length}`);
      const resp = await callGemini(key, body);

      if (resp.ok) {
        const data = await resp.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('').trim() || '';
        if (!text) {
          return new Response(JSON.stringify({ error: 'Empty response from model' }), {
            status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ reply: text, keyIndexUsed: i }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      lastStatus = resp.status;
      lastErrText = await resp.text();
      console.error(`[avatar-chat] Key ${i} failed: ${resp.status} ${lastErrText.substring(0, 200)}`);

      if (![429, 500, 502, 503, 504].includes(resp.status)) break;
    }

    return new Response(JSON.stringify({
      error: 'All Gemini keys failed',
      lastStatus,
      details: lastErrText.substring(0, 500),
    }), { status: lastStatus, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[avatar-chat] Error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
