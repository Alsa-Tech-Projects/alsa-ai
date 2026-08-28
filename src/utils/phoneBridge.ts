// ═══════════════════════════════════════════════════════════════
// 📱 PHONE BRIDGE (Elite Only) — Alsa Ai Bridge Server on Android, port 5002
// ═══════════════════════════════════════════════════════════════
import { supabase } from '@/integrations/supabase/client';

export interface BridgeStatus {
  connected: boolean;
  message: string;
  tier?: string;
  automations_enabled?: boolean;
}

export const PHONE_BRIDGE_URL = 'http://127.0.0.1:5002';

// --- HELPER: Phone number sanitizer and strict string validator ---
const sanitizePhoneNumber = (input: string): string => {
  const digitsOnly = String(input || '').replace(/[^\d+]/g, '');
  if (digitsOnly.startsWith('+')) {
    return '+' + digitsOnly.replace(/\+/g, '');
  }
  return digitsOnly;
};

const isDirectPhoneNumber = (val: string): boolean => {
  const clean = sanitizePhoneNumber(val);
  return /^\+?[0-9]{10,15}$/.test(clean);
};

// Get stored header token from user session/profile if available
async function getAuthHeaderToken(): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return '';
    const { data: profile } = await supabase
      .from('profiles')
      .select('alsa_header_token, header_api_key')
      .eq('id', user.id)
      .maybeSingle();
    return profile?.alsa_header_token || profile?.header_api_key || user.id || '';
  } catch {
    return '';
  }
}

const phonePost = async (path: string, body: any = {}) => {
  const controller = new AbortController();
  
  // FIX: Dynamic timeout in MILLISECONDS.
  // Standard commands get 30s (30,000ms), messaging & app automations get 120s (120,000ms).
  const isMessaging = path.includes('/whatsapp') || path.includes('/telegram') || path.includes('/email') || path.includes('/send');
  const timeoutLimit = isMessaging ? 120000 : 30000; 
  
  const timeout = setTimeout(() => controller.abort(), timeoutLimit);
  
  try {
    const token = await getAuthHeaderToken();
    const headers: Record<string, string> = { 
      'Content-Type': 'application/json' 
    };
    if (token) {
      headers['X-ALSA-Token'] = token;
      headers['X-ALSA-AI-Header'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }

    const r = await fetch(`${PHONE_BRIDGE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!r.ok) {
      const t = await r.text().catch(() => '');
      try {
        const parsed = JSON.parse(t);
        return { ok: false, success: false, error: parsed.message || parsed.error || `HTTP ${r.status}` };
      } catch {
        return { ok: false, success: false, error: t || `HTTP ${r.status}` };
      }
    }

    const res = await r.json();
    
    // Strict success evaluation against Accessibility/Bridge callbacks
    const isSuccess = res.ok === true || res.success === true || res.status === 'sent' || res.status === 'queued';
    return { ...res, ok: isSuccess, success: isSuccess };
  } catch (e: any) {
    return {
      ok: false,
      success: false,
      error: e?.name === 'AbortError' ? 'Phone Bridge request timed out' : (e?.message || 'Phone Bridge not reachable'),
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const checkPhoneBridgeConnection = async (): Promise<BridgeStatus> => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const r = await fetch(`${PHONE_BRIDGE_URL}/status`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      return { 
        connected: true, 
        message: j?.message || j?.bridge || 'Phone Bridge connected',
        tier: j?.subscription_tier,
        automations_enabled: j?.automations_enabled
      };
    }
    return { connected: false, message: 'Phone Bridge not responding' };
  } catch {
    return { connected: false, message: 'Phone Bridge Is Not Connected To Bridge Server (Alsa Ai Bridge Server)' };
  }
};

// --- CONTACTS DATABASE & SEARCH HELPERS ---
export async function syncContactsToDb(contactsList: any) {
  try {
    const list = Array.isArray(contactsList) ? contactsList : contactsList?.contacts || [];
    if (!list.length) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rows = list.map((c: any) => ({
      user_id: user.id,
      name: c.name || c.display_name || 'Unknown',
      phone: c.phone || c.number ? sanitizePhoneNumber(c.phone || c.number) : null,
      email: c.email || null,
    }));
    
    await supabase.from('contacts').upsert(rows, { onConflict: 'user_id,phone' });
  } catch (e) {
    console.error('Error syncing contacts:', e);
  }
}

export async function searchContacts(query: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .ilike('name', `%${query}%`)
      .limit(5);
    return data || [];
  } catch {
    return [];
  }
}

export async function lookupEmailContact(name: string) {
  const hits = await searchContacts(name);
  if (!hits.length) return null;
  const exactHit = hits.find(h => h.name.toLowerCase() === name.toLowerCase() && h.email);
  return exactHit || hits.find((h) => h.email) || null;
}

export async function lookupTelegramContact(name: string) {
  const hits = await searchContacts(name);
  if (!hits.length) return null;
  const exactHit = hits.find(h => h.name.toLowerCase() === name.toLowerCase() && (h.username || h.telegram || h.phone));
  return exactHit || hits.find((h) => h.username || h.telegram || h.phone) || null;
}

// --- REVERSE GEOCODING HELPER ---
async function getCityFromCoordinates(lat: number, lon: number): Promise<string> {
  const timed = async (url: string, headers?: Record<string, string>) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 8000);
    try {
      const r = await fetch(url, { headers, signal: c.signal });
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    } finally {
      clearTimeout(t);
    }
  };

  const data = await timed(
    `https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&addressdetails=1&lat=${lat}&lon=${lon}`,
    { 'Accept-Language': 'en' },
  );
  const a = data?.address || {};
  const parts = [
    a.neighbourhood || a.residential || a.hamlet || a.quarter,
    a.suburb || a.village || a.town_district || a.county,
    a.city || a.town || a.municipality || a.city_district || a.state_district,
    a.state,
    a.postcode,
  ].filter(Boolean);
  const unique = parts.filter((p: string, i: number) => parts.indexOf(p) === i);
  if (unique.length) return unique.join(', ');
  if (data?.display_name) return data.display_name;

  const bd = await timed(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
  );
  if (bd) {
    const p2 = [bd.locality, bd.city, bd.principalSubdivision, bd.countryName].filter(Boolean);
    const u2 = p2.filter((p: string, i: number) => p2.indexOf(p) === i);
    if (u2.length) return u2.join(', ');
  }

  return `${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)} (address lookup unavailable)`;
}

// Basic
export const phoneNotify   = (title: string, content: string) => phonePost('/notify', { title, content });
export const phoneToast    = (text: string) => phonePost('/toast', { text });
export const phoneVibrate  = (duration = 1000) => phonePost('/vibrate', { duration });

// Hardware
export const phoneTorch      = (on: boolean) => phonePost('/torch', { on });
export const phoneBrightness = (level: number) => phonePost('/brightness', { level });
export const phoneVolume     = (stream: 'music'|'call'|'ring'|'notification', level: number) =>
  phonePost('/volume', { stream, level });
export const phoneBattery    = () => phonePost('/battery');
export const phoneLocation   = (provider: 'gps'|'network' = 'gps') => phonePost('/location', { provider });

// Clipboard
export const phoneClipboardGet = () => phonePost('/clipboard/get');
export const phoneClipboardSet = (text: string) => phonePost('/clipboard/set', { text });

// SMS / Call
export const phoneSmsSend  = (number: string, text: string) => phonePost('/sms/send', { number: sanitizePhoneNumber(number), text });
export const phoneSmsList  = (limit = 10) => phonePost('/sms/list', { limit });
export const phoneCallMake = (number: string) => phonePost('/call/make', { number: sanitizePhoneNumber(number) });
export const phoneCallByName = (name: string) => phonePost('/call/by-name', { name, first: true });
export const phoneCallEnd  = () => phonePost('/call/end');
export const phoneContacts = () => phonePost('/contacts');

// Voice
export const phoneTts = (text: string) => phonePost('/tts', { text });
export const phoneStt = () => phonePost('/stt');

// Camera
export const phoneCameraPhoto = (path?: string, camera: 0|1 = 0) => phonePost('/camera/photo', { path, camera });
export const phoneCameraInfo  = () => phonePost('/camera/info');

// Apps / Intents
export const phoneAppOpen = (pkgOrName: string) => phonePost('/app/open', { package: pkgOrName, name: pkgOrName });
export const phoneAppList = () => phonePost('/app/list');
export const phoneUrlOpen = (url: string) => phonePost('/url/open', { url });
export const phoneShare   = (text: string, title = 'Share') => phonePost('/share', { text, title });

// Wi-Fi
export const phoneWifiToggle = (on: boolean) => phonePost('/wifi/toggle', { on });
export const phoneWifiInfo   = () => phonePost('/wifi/info');

// Media
export const phoneMediaControl = (action: 'play'|'pause'|'next'|'previous'|'stop') =>
  phonePost('/media/control', { action });

// Sensors
export const phoneSensors = (name?: string) => phonePost('/sensors', name ? { name } : {});

// Storage
export const phoneStorageList  = (path = '/sdcard') => phonePost('/storage/list', { path });
export const phoneStorageRead  = (path: string) => phonePost('/storage/read', { path });
export const phoneStorageWrite = (path: string, content: string) => phonePost('/storage/write', { path, content });

// Shell
export const phoneShell = (command: string) => phonePost('/shell', { command });

// WhatsApp Automation
const phonePostWithFallback = async (paths: string[], body: any) => {
  let last: any = null;
  for (const p of paths) {
    const res = await phonePost(p, body);
    if (res && (res.ok === true || res.success === true)) return res;
    last = res;
    const err = String(last?.error || '');
    if (!/404|not found|405|Method Not Allowed|Unsupported|Invalid platform/i.test(err)) return last;
  }
  return last;
};

export const phoneWhatsappSend = (number: string, text: string) =>
  phonePostWithFallback(['/whatsapp/send', '/send'], { platform: 'whatsapp', number: sanitizePhoneNumber(number), text });

export const phoneWhatsappSendByName = async (name: string, text: string) => {
  if (isDirectPhoneNumber(name)) {
    return phoneWhatsappSend(name, text);
  }
  const hits = await searchContacts(name);
  if (hits.length) {
    const exactHit = hits.find(h => h.name.toLowerCase() === name.toLowerCase() && h.phone);
    const target = exactHit || hits.find(h => h.phone) || hits[0];
    
    if (target?.phone) {
      return phoneWhatsappSend(target.phone, text);
    }
  }
  return phonePostWithFallback(['/whatsapp/send-by-name'], { name, text });
};

// Telegram Automation
export const phoneTelegramSend = (usernameOrNumber: string, text: string) => {
  const isUsername = /^@?[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(String(usernameOrNumber || ''));
  const body = isUsername
    ? { platform: 'telegram', username: String(usernameOrNumber).replace(/^@/, ''), text }
    : { platform: 'telegram', number: sanitizePhoneNumber(usernameOrNumber), text };
  return phonePostWithFallback(['/telegram/send', '/send'], body);
};

export const phoneTelegramSendByName = async (name: string, text: string) => {
  if (isDirectPhoneNumber(name)) {
    return phoneTelegramSend(name, text);
  }
  const hit = await lookupTelegramContact(name);
  if (hit) return phoneTelegramSend(hit.username || hit.phone || '', text);
  return phonePostWithFallback(['/telegram/send-by-name'], { name, text });
};

// Email Automation
export const phoneEmailConfig = (email: string, appPassword: string, displayName = '') =>
  phonePost('/email/config', { email, app_password: appPassword, display_name: displayName });

export const phoneEmailStatus = () => phonePost('/email/status');

export const phoneEmailSend = (opts: {
  to: string; subject?: string; body: string; html?: boolean; cc?: string; bcc?: string;
}) => phonePost('/email/send', opts);

export const phoneEmailSendByName = async (name: string, body: string, subject?: string, html = false) => {
  const hit = await lookupEmailContact(name);
  if (!hit) {
    return phonePost('/email/send-by-name', { name, body, subject, html });
  }
  return phoneEmailSend({ to: hit.email, subject: subject || deriveSubject(body), body, html });
};

export const deriveSubject = (body: string) => {
  const clean = String(body || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'Message from Alsa AI';
  const firstSentence = clean.split(/[.!?\n]/)[0].trim();
  const s = firstSentence.length > 4 ? firstSentence : clean;
  return s.length > 70 ? `${s.slice(0, 67)}...` : s;
};

// Contacts
export const phoneContactsRefresh = () => phonePost('/contacts/refresh');
export const phoneContactsSearch  = (query: string) => phonePost('/contacts/search', { query });

// yt-dlp
export const phoneYtdlpStatus   = () => phonePost('/ytdlp/status');
export const phoneYtdlpDownload = (opts: {
  url: string;
  mode?: 'video' | 'audio';
  quality?: string;
  audio_format?: 'mp3' | 'm4a' | 'opus' | 'wav' | 'flac';
  subtitles?: boolean;
  embed_thumbnail?: boolean;
  embed_metadata?: boolean;
  playlist?: boolean;
  output_dir?: string;
}) => phonePost('/ytdlp/download', opts);

// ── App Opening Helpers ─────
async function smartOpenApp(appName: string) {
  return phoneAppOpen(appName.trim());
}

// ── Phone natural-language parser + executor (SUPERCHARGED HINGLISH NLP) ────────────────────────────────
export interface PhoneCommand {
  action: string;
  params?: Record<string, any>;
  label: string;
}

export const parsePhoneCommand = (input: string): PhoneCommand | null => {
  const t = input.trim();
  const lowerT = t.toLowerCase(); 

  // 📧 EMAIL AUTOMATION
  const emailDirectM = t.match(/^(?:email|mail)\s+(?:to\s+)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\s+(?:subject\s+["']?([^"'\n]+)["']?\s+)?(?:body|text|msg|message)\s+([\s\S]+)$/i);
  if (emailDirectM) {
    return { action: 'email-send', params: { to: emailDirectM[1], subject: emailDirectM[2] || undefined, body: emailDirectM[3].trim() }, label: `Email to ${emailDirectM[1]}` };
  }

  const emailNameM = t.match(/^(?:email|mail)\s+(?:to\s+)?([a-zA-Z][a-zA-Z\s.'-]{1,20}?)\s+(?:subject\s+["']?([^"'\n]+)["']?\s+)?(?:body|text|msg|message|karo|bhejo)\s+([\s\S]+)$/i);
  if (emailNameM && !/\d/.test(emailNameM[1])) {
    const name = emailNameM[1].trim();
    if (!/^(me|him|her|them|app|system)$/i.test(name)) {
      return { action: 'email-name', params: { name, subject: emailNameM[2] || undefined, body: emailNameM[3].trim() }, label: `Email to ${name}` };
    }
  }

  // 💬 WHATSAPP AUTOMATION
  const waNumM = t.match(/^(?:whatsapp|wa)\s+(?:to\s+)?(\+?\d[\d\s\-]{6,15})\s+(?:msg|message|text|saying)\s+([\s\S]+)$/i);
  if (waNumM) {
    return { action: 'whatsapp-num', params: { number: sanitizePhoneNumber(waNumM[1]), text: waNumM[2].trim() }, label: `WhatsApp to ${waNumM[1]}` };
  }

  const waNaturalM = t.match(/^(?:whatsapp|wa)\s+(?:to\s+|ko\s+|par\s+)?([a-zA-Z0-9\+\s.'-]{1,30}?)\s+(?:msg|message|massage|text|saying|karo|send|bhejo)\s+([\s\S]+)$/i);
  if (waNaturalM) {
    const targetName = waNaturalM[1].trim();
    const messageText = waNaturalM[2].trim();
    if (targetName && messageText && !/^(par|ko|msg|message|send|bhejo)$/i.test(targetName)) {
      if (isDirectPhoneNumber(targetName)) {
        return { action: 'whatsapp-num', params: { number: sanitizePhoneNumber(targetName), text: messageText }, label: `WhatsApp to ${targetName}` };
      }
      return { action: 'whatsapp-name', params: { name: targetName, text: messageText }, label: `WhatsApp to ${targetName}` };
    }
  }

  // 📱 ADVANCED HINGLISH AUTOMATION PARSERS

  // -- Torch / Flashlight --
  if (/\b(torch|flashlight|flash|light|battery light)\b/i.test(lowerT)) {
    if (/\b(on|chalu|jala|jalao|start|open)\b/i.test(lowerT)) return { action: 'torch', params: { on: true }, label: 'turn torch ON' };
    if (/\b(off|band|bandh|close|stop|bujha)\b/i.test(lowerT)) return { action: 'torch', params: { on: false }, label: 'turn torch OFF' };
  }

  // -- Vibrate --
  if (/\b(vibrate|vibration|kampan|thartharao|vibrator)\b/i.test(lowerT)) {
    return { action: 'vibrate', params: { duration: 1000 }, label: `vibrate phone` };
  }

  // -- Battery --
  if (/\b(battery|batri|battry|charge|charging)\b/i.test(lowerT) && /\b(kitni|status|level|percent|kya hai|batao)\b/i.test(lowerT)) {
    return { action: 'battery', label: 'get battery status' };
  }

  // -- Brightness --
  if (/\b(brightness|roshni|screen light|display light)\b/i.test(lowerT)) {
    if (/\b(full|max|100|tej|jyada|zyada|badha|increase|bada)\b/i.test(lowerT)) return { action: 'brightness', params: { level: 255 }, label: 'increase brightness' };
    if (/\b(half|50|aadha|adhi)\b/i.test(lowerT)) return { action: 'brightness', params: { level: 127 }, label: 'set brightness half' };
    if (/\b(kam|low|dim|thoda|dheere|ghatao|slow|decrease)\b/i.test(lowerT)) return { action: 'brightness', params: { level: 50 }, label: 'decrease brightness' };
    const valMatch = lowerT.match(/(\d{1,3})/);
    if (valMatch) {
      let val = parseInt(valMatch[1]);
      if (val <= 100) val = Math.round(val * 2.55);
      return { action: 'brightness', params: { level: Math.min(255, val) }, label: `set brightness ${valMatch[1]}%` };
    }
  }

  // -- Volume --
  if (/\b(volume|awaz|awaaz|sound|speaker)\b/i.test(lowerT)) {
    if (/\b(full|max|100|tej|jyada|zyada|badha|increase|bada)\b/i.test(lowerT)) return { action: 'volume', params: { stream: 'music', level: 100 }, label: 'increase volume' };
    if (/\b(half|50|aadha|adhi)\b/i.test(lowerT)) return { action: 'volume', params: { stream: 'music', level: 50 }, label: 'set volume half' };
    if (/\b(kam|low|dim|thoda|dheere|ghatao|slow|decrease)\b/i.test(lowerT)) return { action: 'volume', params: { stream: 'music', level: 20 }, label: 'decrease volume' };
    if (/\b(mute|band|zero|0)\b/i.test(lowerT)) return { action: 'volume', params: { stream: 'music', level: 0 }, label: 'mute volume' };
    const valMatch = lowerT.match(/(\d{1,3})/);
    if (valMatch) return { action: 'volume', params: { stream: 'music', level: Math.min(100, parseInt(valMatch[1])) }, label: `set volume ${valMatch[1]}` };
  }

  // -- Wi-Fi --
  if (/\bwifi\b/i.test(lowerT) || /\bwi-fi\b/i.test(lowerT)) {
    if (/\b(on|chalu|start|open)\b/i.test(lowerT)) return { action: 'wifi', params: { on: true }, label: 'wifi ON' };
    if (/\b(off|band|stop|close)\b/i.test(lowerT)) return { action: 'wifi', params: { on: false }, label: 'wifi OFF' };
    if (/\b(info|details|status|check)\b/i.test(lowerT)) return { action: 'wifi-info', label: 'wifi info' };
  }

  // -- Location --
  if (/\b(location|gps|kaha hu|kahan hoon|where am i|meri location|kidhar hu)\b/i.test(lowerT)) {
    return { action: 'location', label: 'get GPS location' };
  }

  // -- Call (Flexible Hinglish Calling) --
  const callMatch = lowerT.match(/^(?:call|phone|dial|ring)\s+(?:to\s+|karo\s+|lagao\s+|milao\s+)?([a-z0-9\s]+)$/i) ||
                    lowerT.match(/^([a-z0-9\s]+?)\s*(?:ko|par|ke|se)\s*(?:call|phone|dial)\s*(?:karo|kar|do|lagao|milao|karna)/i) ||
                    lowerT.match(/^call\s+([a-z0-9\s]+)$/i);

  if (callMatch) {
    const target = callMatch[1].trim();
    if (!/^(me|him|her|them|someone|anyone|nobody|end|back|now|please|karo|kar|do)$/i.test(target) && target.length > 1) {
        if (/^[\d\s\-\+]+$/.test(target) && target.replace(/\D/g, '').length >= 7) {
            return { action: 'call', params: { number: sanitizePhoneNumber(target) }, label: `call ${target}` };
        }
        return { action: 'call-name', params: { name: target }, label: `call ${target}` };
    }
  }
  
  if (/\b(end call|call end|call kaat|hang up|cut call|phone kaat|phone band karo)\b/i.test(lowerT)) {
    return { action: 'call-end', label: 'end call' };
  }

  // -- App Open (Smart Natural Selection) --
  const appMatch = lowerT.match(/(?:open|launch|start|run|chalu\s*karo|khol|kholo|app\s*kholo)\s+([a-z0-9\s]+)/i) ||
                   lowerT.match(/([a-z0-9\s]+?)\s+(?:open|launch|start|run|chalu)\s*(?:karo|kar|do|khol|kholo)/i);
  if (appMatch) {
    const appName = appMatch[1].trim();
    if (!/^(app|application|the|a|an|it|this|that|karo|kar|do|mera|apna)$/i.test(appName) && appName.length > 2) {
        return { action: 'app-open', params: { name: appName }, label: `open ${appName}` };
    }
  }

  // -- Media Control --
  if (/\b(pause|ruk|band karo|stop)\s*(music|song|media|gana|gaana)\b/i.test(lowerT)) return { action: 'media', params: { action: 'pause' }, label: 'pause media' };
  if (/\b(play|chalu karo|start)\s*(music|song|media|gana|gaana)\b/i.test(lowerT)) return { action: 'media', params: { action: 'play' }, label: 'play media' };
  if (/\b(next|agla)\s*(music|song|media|gana|gaana)\b/i.test(lowerT)) return { action: 'media', params: { action: 'next' }, label: 'next media' };
  if (/\b(previous|pichla)\s*(music|song|media|gana|gaana)\b/i.test(lowerT)) return { action: 'media', params: { action: 'previous' }, label: 'previous media' };

  // -- Camera --
  if (/\b(front cam|selfie|front camera)\b/i.test(lowerT) || (/\b(photo|pic|picture)\b/i.test(lowerT) && /\b(front|selfie)\b/i.test(lowerT))) {
    return { action: 'photo', params: { camera: 1 }, label: 'front camera photo' };
  }
  if (/\b(back cam|rear cam|back camera)\b/i.test(lowerT) || (/\b(photo|pic|picture)\b/i.test(lowerT) && /\b(back|rear|khinch|click)\b/i.test(lowerT))) {
    return { action: 'photo', params: { camera: 0 }, label: 'back camera photo' };
  }

  // Telegram SMS legacy fallbacks
  const tgUserM = t.match(/^(?:telegram|tg)\s+(?:to\s+)?@([a-zA-Z0-9_]+)\s+(?:msg|message|text)\s+([\s\S]+)$/i);
  if (tgUserM) return { action: 'telegram-user', params: { username: tgUserM[1].trim(), text: tgUserM[2].trim() }, label: `Telegram to @${tgUserM[1]}` };
  
  const tgNameM = t.match(/^(?:telegram|tg)\s+(?:to\s+)?([a-zA-Z][a-zA-Z\s]{1,30}?)\s+(?:msg|message|text)\s+([\s\S]+)$/i);
  if (tgNameM && !/\d/.test(tgNameM[1])) return { action: 'telegram-name', params: { name: tgNameM[1].trim(), text: tgNameM[2].trim() }, label: `Telegram to ${tgNameM[1].trim()}` };

  const smsM = t.match(/^(?:sms|text)\s+(?:to\s+)?(\+?\d[\d\s\-]{6,15})\s+(?:msg|message)\s+([\s\S]+)$/i) || t.match(/^(\+?\d[\d\s\-]{6,15})\s*(?:ko|par)?\s*sms\s*(?:bhejo|send|kar)\s+([\s\S]+)$/i);
  if (smsM) return { action: 'sms', params: { number: sanitizePhoneNumber(smsM[1]), text: smsM[2] || smsM[3] }, label: `SMS to ${smsM[1]}` };

  // YT-DLP
  const ytM = t.match(/(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/\S+)/i);
  if (ytM && /\b(download|save|mp3|mp4|audio|video|yt-?dlp|playlist)\b/i.test(lowerT)) {
    const audio = /\b(mp3|audio|song|music)\b/i.test(lowerT);
    const q = lowerT.match(/\b(144|240|360|480|720|1080|1440|2160|4k)\b/i);
    return {
      action: 'ytdlp',
      params: { url: ytM[1], mode: audio ? 'audio' : 'video', quality: q ? (q[1].toLowerCase() === '4k' ? '2160' : q[1]) : 'best', playlist: /\bplaylist\b/i.test(lowerT) || /list=/.test(ytM[1]) },
      label: `yt-dlp ${audio ? 'audio' : 'video'} on phone`,
    };
  }

  // Contacts Search
  const cSearch = t.match(/(?:contact|contacts)\s+(?:search|find|dhundo|dhoondo|khojo)\s+(.+)/i);
  if (cSearch) return { action: 'contact-search', params: { query: cSearch[1].trim() }, label: `search contact "${cSearch[1].trim()}"` };

  return null;
};

function formatPhoneResult(cmd: PhoneCommand, res: any): string {
  const d = res?.data ?? res ?? {};
  const p: any = cmd.params || {};

  switch (cmd.action) {
    case 'email-send':
    case 'email-name':
      return `📧 Email bhej diya ${p.to || p.name} ko.`;
    case 'torch':
      return p.on ? '🔦 Torch ON kar diya.' : '🔦 Torch OFF kar diya.';
    case 'vibrate':
      return `📳 Phone vibrate kar diya (${p.duration}ms).`;
    case 'battery': {
      const lvl = d.percentage ?? d.level ?? d.battery ?? d.percent;
      const status = d.status ?? d.plugged ?? '';
      return `🔋 Battery ${lvl != null ? lvl + '%' : 'status'}${status ? ` — ${status}` : ''}`;
    }
    case 'location':
      return res?.place ? `📍 Location: ${res.place}` : '📍 Location nahi mil paayi.';
    case 'whatsapp-num':
    case 'whatsapp-name':
      return `💬 WhatsApp message bhej diya ${p.name || p.number} ko.`;
    case 'telegram-user':
    case 'telegram-name':
      return `✈️ Telegram message bhej diya ${p.username || p.name} ko.`;
    case 'sms':
      return `💬 SMS bhej diya ${p.number} ko.`;
    case 'call':
    case 'call-name':
      return `📞 Call mila diya ${p.name || p.number} ko.`;
    case 'app-open':
      return `📱 ${p.name || p.package || 'App'} open kar di.`;
    default:
      return typeof d === 'string' ? d : (res?.message || `${cmd.label} ✓`);
  }
}

export const executePhoneCommand = async (cmd: PhoneCommand): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    let res: any;
    switch (cmd.action) {
      case 'email-send': res = await phoneEmailSend({ to: cmd.params!.to, subject: cmd.params!.subject, body: cmd.params!.body }); break;
      case 'email-name': res = await phoneEmailSendByName(cmd.params!.name, cmd.params!.body, cmd.params!.subject); break;
      case 'whatsapp-num':  res = await phoneWhatsappSend(cmd.params!.number, cmd.params!.text); break;
      case 'whatsapp-name': res = await phoneWhatsappSendByName(cmd.params!.name, cmd.params!.text); break;
      case 'telegram-user': res = await phoneTelegramSend(cmd.params!.username, cmd.params!.text); break;
      case 'telegram-name': res = await phoneTelegramSendByName(cmd.params!.name, cmd.params!.text); break;
      case 'torch':      res = await phoneTorch(cmd.params!.on); break;
      case 'vibrate':    res = await phoneVibrate(cmd.params!.duration); break;
      case 'battery':    res = await phoneBattery(); break;
      case 'brightness': res = await phoneBrightness(cmd.params!.level); break;
      case 'volume':     res = await phoneVolume(cmd.params!.stream, cmd.params!.level); break;
      case 'location': {
        res = await phoneLocation();
        const lat = res?.data?.latitude ?? res?.latitude;
        const lon = res?.data?.longitude ?? res?.longitude;
        if (lat != null && lon != null) {
          const place = await getCityFromCoordinates(Number(lat), Number(lon));
          if (place) {
            res.message = `📍 ${place}`;
            res.place = place;
          }
        }
        break;
      }
      case 'wifi':       res = await phoneWifiToggle(cmd.params!.on); break;
      case 'wifi-info':  res = await phoneWifiInfo(); break;
      case 'clip-get':   res = await phoneClipboardGet(); break;
      case 'clip-set':   res = await phoneClipboardSet(cmd.params!.text); break;
      case 'sms':        res = await phoneSmsSend(cmd.params!.number, cmd.params!.text); break;
      case 'call':       res = await phoneCallMake(cmd.params!.number); break;
      case 'call-name':  res = await phoneCallByName(cmd.params!.name); break;
      case 'call-end':   res = await phoneCallEnd(); break;
      case 'photo':      res = await phoneCameraPhoto(undefined, cmd.params!.camera); break;
      case 'toast':      res = await phoneToast(cmd.params!.text); break;
      case 'notify':     res = await phoneNotify(cmd.params!.title, cmd.params!.content); break;
      case 'tts':        res = await phoneTts(cmd.params!.text); break;
      case 'ytdlp':      res = await phoneYtdlpDownload(cmd.params as any); break;
      case 'contacts':
        res = await phoneContacts();
        await syncContactsToDb(res?.data ?? res);
        break;
      case 'contact-search': {
        const dbHits = await searchContacts(cmd.params!.query);
        if (dbHits.length) {
          res = { success: true, data: dbHits };
        } else {
          res = await phoneContactsSearch(cmd.params!.query);
          await syncContactsToDb(res?.data ?? res);
        }
        break;
      }
      case 'media':      res = await phoneMediaControl(cmd.params!.action); break;
      case 'app-open':   res = await smartOpenApp(cmd.params!.name); break;
      default: return { success: false, message: `Unknown phone action: ${cmd.action}` };
    }
    
    // Strict success validation
    const ok = res?.success !== false && res?.ok !== false && res?.status !== 'error';
    return {
      success: ok,
      message: ok ? formatPhoneResult(cmd, res) : (res?.error || res?.message || `${cmd.label} failed`),
      data: res,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Phone Bridge error' };
  }
};
