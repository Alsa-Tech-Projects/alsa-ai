// Image Chat Edge Function — generates images with daily quota + history persistence
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const TEAM_EMAILS = [
  'alsa.ai.assistant@gmail.com',
  'qadrieisa@gmail.com',
  'coo-of-alsa-ai@alsa-ai.in',
  'useralsa@alsa-ai.in',
  'useralsa2@alsa-ai.in',
  'founder@alsa-ai.in',
];

interface RequestBody {
  prompt: string;
  aspectRatio?: string;
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
        error: `Daily limit reached (${dailyLimit} images/day for ${tier} plan). Try again tomorrow!`,
        limitReached: true,
        used: usedToday,
        limit: dailyLimit,
      }, 429);
    }

    const { prompt, aspectRatio = '1:1' }: RequestBody = await req.json();
    if (!prompt || typeof prompt !== 'string') return jsonResponse({ error: 'Prompt is required' }, 400);

    // Resolution dimensions based on Aspect Ratio
    let width = 1024;
    let height = 1024;

    if (aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    } else if (aspectRatio === '4:3') {
      width = 1024;
      height = 768;
    }

    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 1000000);
    
    // Fast & Free High Quality Image Generation via Pollinations (Flux Engine)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true`;

    // Increment usage in Supabase DB
    await admin
      .from('image_chat_usage')
      .upsert(
        { user_id: userId, date: today, count: usedToday + 1, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      );

    return jsonResponse({
      imageUrl,
      text: "Image generated successfully!",
      used: usedToday + 1,
      limit: dailyLimit,
      tier,
    });

  } catch (e) {
    console.error('[image-chat] Error:', e);
    return jsonResponse({ error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});
