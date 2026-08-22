// Image Chat Edge Function — generates images with daily quota + history persistence
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const TEAM_EMAILS = [
  'alsa.ai.assistant@gmail.com',
  'qadrieisa@gmail.com',
  'coo-of-alsa-ai@alsa-ai.in',
  'useralsa@alsa-ai.in',
  'useralsa2@alsa-ai.in',
  'founder@alsa-ai.in',
];

interface InputImage { mimeType: string; data: string; }
interface RequestBody {
  prompt: string;
  inputImages?: InputImage[];
  aspectRatio?: string;
}

function buildPromptWithRatio(prompt: string, aspectRatio?: string) {
  if (!aspectRatio || aspectRatio === 'auto') return prompt;
  return `${prompt}\n\nGenerate the image strictly with aspect ratio ${aspectRatio}.`;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) return jsonResponse({ error: 'LOVABLE_API_KEY not configured' }, 500);

    // Auth: identify user from JWT
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return jsonResponse({ error: 'Auth required' }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) return jsonResponse({ error: 'Invalid session' }, 401);
    const user = userData.user;
    const userId = user.id;
    const email = (user.email || '').toLowerCase();

    // Determine tier & daily limit
    const isTeam = TEAM_EMAILS.includes(email);
    let tier = 'free';
    if (isTeam) {
      tier = 'elite';
    } else {
      const { data: prof } = await admin
        .from('profiles')
        .select('subscription_tier')
        .eq('user_id', userId)
        .maybeSingle();
      tier = (prof?.subscription_tier as string) || 'free';
    }

    let dailyLimit = 0;
    if (tier === 'pro') dailyLimit = 3;
    else if (tier === 'elite') dailyLimit = isTeam ? 9999 : 7;
    else if (tier === 'team') dailyLimit = 9999;

    if (dailyLimit <= 0) {
      return jsonResponse({ error: 'Pro or Elite plan required for image generation.' }, 403);
    }

    // Check usage for today
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageRow } = await admin
      .from('image_chat_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    const usedToday = usageRow?.count ?? 0;

    if (usedToday >= dailyLimit) {
      return jsonResponse({
        error: `Daily limit reached (${dailyLimit} images/day for ${tier} plan). Try again tomorrow bhai!`,
        limitReached: true,
        used: usedToday,
        limit: dailyLimit,
      }, 429);
    }

    const { prompt, inputImages = [], aspectRatio }: RequestBody = await req.json();
    if (!prompt || typeof prompt !== 'string') return jsonResponse({ error: 'Prompt is required' }, 400);

    const finalPrompt = buildPromptWithRatio(prompt, aspectRatio);
    const content: any[] = [{ type: 'text', text: finalPrompt }];
    for (const img of inputImages) {
      const mime = img.mimeType || 'image/png';
      content.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${img.data}` } });
    }

    const resp = await fetch(LOVABLE_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3.6-flash-image',
        messages: [{ role: 'user', content }],
        modalities: ['image', 'text'],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[image-chat] AI error:', resp.status, errText.substring(0, 500));
      if (resp.status === 429) return jsonResponse({ error: 'Rate limit hit. Thodi der baad try kar.' }, 429);
      if (resp.status === 402) return jsonResponse({ error: 'AI credits khatam.' }, 402);
      return jsonResponse({ error: `AI gateway error: ${resp.status}` }, resp.status);
    }

    const data = await resp.json();
    const message = data?.choices?.[0]?.message;
    const textOut = typeof message?.content === 'string' ? message.content : '';
    const images = Array.isArray(message?.images) ? message.images : [];
    const imageUrl = images[0]?.image_url?.url || '';

    if (!imageUrl) {
      console.error('[image-chat] No image:', JSON.stringify(data).slice(0, 500));
      return jsonResponse({ error: 'Model did not return an image', text: textOut }, 502);
    }

    // Increment usage (upsert)
    await admin
      .from('image_chat_usage')
      .upsert(
        { user_id: userId, date: today, count: usedToday + 1, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      );

    return jsonResponse({
      imageUrl,
      text: textOut,
      used: usedToday + 1,
      limit: dailyLimit,
      tier,
    });
  } catch (e) {
    console.error('[image-chat] Error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
