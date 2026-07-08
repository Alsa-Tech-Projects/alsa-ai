// Mira TTS — Deepgram Aura "luna" voice (English, female)
// Returns audio/mpeg stream that the browser can play directly.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY');
    if (!DEEPGRAM_API_KEY) {
      return new Response(JSON.stringify({ error: 'DEEPGRAM_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { text } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clean text for TTS
    const clean = text
      .replace(/[*_`#~>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();

    // Deepgram Aura — Luna voice (female, natural English)
    const url = 'https://api.deepgram.com/v1/speak?model=aura-luna-en&encoding=mp3';
    const dgResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: clean }),
    });

    if (!dgResp.ok) {
      const err = await dgResp.text();
      console.error('[mira-tts] Deepgram error', dgResp.status, err);
      return new Response(JSON.stringify({ error: 'Deepgram failed', status: dgResp.status, details: err.substring(0, 300) }), {
        status: dgResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const audioBuf = await dgResp.arrayBuffer();
    const bytes = new Uint8Array(audioBuf);
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
    }
    const base64 = btoa(binary);

    return new Response(JSON.stringify({ audio: base64, mime: 'audio/mpeg' }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[mira-tts] error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
