// ═══════════════════════════════════════════════════════════════
// 📱 PHONE BRIDGE (Elite Only) — Termux on Android, port 5002
// ═══════════════════════════════════════════════════════════════
import { supabase } from '@/integrations/supabase/client';

export interface BridgeStatus {
  connected: boolean;
  message: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string | null;
  username?: string | null;
  telegram?: string | null;
  source?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const PHONE_BRIDGE_PORT = 5002;
export const PHONE_BRIDGE_IP_KEY = 'alsa_phone_bridge_ip';

/**
 * Phone Bridge address. By default we talk to 127.0.0.1:5002 (when Alsa is opened on the phone itself).
 * If the user saved their phone's Wi-Fi IP (e.g. 192.168.1.7) in Settings, requests go to
 * http://192.168.1.7:5002 instead — so a laptop browser can control the phone on the same Wi-Fi.
 */
export const getPhoneBridgeIp = (): string => {
  try {
    const v = (localStorage.getItem(PHONE_BRIDGE_IP_KEY) || '').trim();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(v)) return v;
  } catch { }
  return '127.0.0.1';
};
export const setPhoneBridgeIp = (ip: string) => {
  const v = (ip || '').trim();
  try {
    if (!v) localStorage.removeItem(PHONE_BRIDGE_IP_KEY);
    else localStorage.setItem(PHONE_BRIDGE_IP_KEY, v);
  } catch { }
};
export const getPhoneBridgeUrl = (): string => `http://${getPhoneBridgeIp()}:${PHONE_BRIDGE_PORT}`;
/** @deprecated use getPhoneBridgeUrl() — kept for old imports */
export const PHONE_BRIDGE_URL = getPhoneBridgeUrl();

export const PHONE_MESSAGES = {
  offline: 'Your phone is not connected right now. Open the Alsa Bridge app on your phone and try again.',
  timeout: 'Your phone took too long to respond. Please check the Alsa Bridge app and try again.',
  failed: 'Something went wrong on your phone. Please try again.',
};

// Increased timeout to 90s to ensure long stories go through directly without hanging
const PHONE_REQUEST_TIMEOUT_MS = 90000;

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

const phonePost = async (path: string, body: any = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PHONE_REQUEST_TIMEOUT_MS);
  try {
    const r = await fetch(`${getPhoneBridgeUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!r.ok) {
      const t = await r.text().catch(() => '');
      return { ok: false, success: false, error: t || `HTTP ${r.status}` };
    }
    const res = await r.json();

    // Strict success evaluation against Accessibility/Bridge callbacks
    const isSuccess = res.ok === true || res.success === true || res.status === 'sent' || res.status === 'queued';
    return { ...res, ok: isSuccess, success: isSuccess };
  } catch (e: any) {
    return {
      ok: false,
      success: false,
      error: e?.name === 'AbortError' ? PHONE_MESSAGES.timeout : PHONE_MESSAGES.offline,
    };
  } finally {
    clearTimeout(timeout);
  }
};

export const checkPhoneBridgeConnection = async (): Promise<BridgeStatus> => {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 1500);
    const r = await fetch(`${getPhoneBridgeUrl()}/status`, { method: 'GET', signal: controller.signal, cache: 'no-store' });
    clearTimeout(t);
    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      return { connected: true, message: j?.bridge || 'Phone Bridge connected' };
    }
    return { connected: false, message: PHONE_MESSAGES.offline };
  } catch {
    return { connected: false, message: PHONE_MESSAGES.offline };
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
      phone: c.phone ? sanitizePhoneNumber(c.phone) : null,
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
    return (data as Contact[]) || [];
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
export const phoneNotify = (title: string, content: string) => phonePost('/notify', { title, content });
export const phoneToast = (text: string) => phonePost('/toast', { text });
export const phoneVibrate = (duration = 1000) => phonePost('/vibrate', { duration });

// Hardware
export const phoneTorch = (on: boolean) => phonePost('/torch', { on });
export const phoneBrightness = (level: number) => phonePost('/brightness', { level });
export const phoneVolume = (stream: 'music' | 'call' | 'ring' | 'notification', level: number) =>
  phonePost('/volume', { stream, level });
export const phoneBattery = () => phonePost('/battery');
export const phoneLocation = (provider: 'gps' | 'network' = 'gps') => phonePost('/location', { provider });

// Clipboard
export const phoneClipboardGet = () => phonePost('/clipboard/get');
export const phoneClipboardSet = (text: string) => phonePost('/clipboard/set', { text });

// SMS / Call
export const phoneSmsSend = (number: string, text: string) => phonePost('/sms/send', { number: sanitizePhoneNumber(number), text });
export const phoneSmsList = (limit = 10) => phonePost('/sms/list', { limit });
export const phoneCallMake = (number: string) => phonePost('/call/make', { number: sanitizePhoneNumber(number) });
export const phoneCallByName = (name: string) => phonePost('/call/by-name', { name, first: true });
export const phoneCallEnd = () => phonePost('/call/end');
export const phoneContacts = () => phonePost('/contacts');

// Voice
export const phoneTts = (text: string) => phonePost('/tts', { text });
export const phoneStt = () => phonePost('/stt');

// Camera
export const phoneCameraPhoto = (path?: string, camera: 0 | 1 = 0) => phonePost('/camera/photo', { path, camera });
export const phoneCameraInfo = () => phonePost('/camera/info');

// Apps / Intents
export const phoneAppOpen = (pkg: string) => phonePost('/app/open', { package: pkg });
export const phoneAppList = () => phonePost('/app/list');
export const phoneUrlOpen = (url: string) => phonePost('/url/open', { url });
export const phoneShare = (text: string, title = 'Share') => phonePost('/share', { text, title });

// Wi-Fi
export const phoneWifiToggle = (on: boolean) => phonePost('/wifi/toggle', { on });
export const phoneWifiInfo = () => phonePost('/wifi/info');

// Media
export const phoneMediaControl = (action: 'play' | 'pause' | 'next' | 'previous' | 'stop') =>
  phonePost('/media/control', { action });

// Sensors
export const phoneSensors = (name?: string) => phonePost('/sensors', name ? { name } : {});

// Storage
export const phoneStorageList = (path = '/sdcard') => phonePost('/storage/list', { path });
export const phoneStorageRead = (path: string) => phonePost('/storage/read', { path });
export const phoneStorageWrite = (path: string, content: string) => phonePost('/storage/write', { path, content });

// Shell
export const phoneShell = (command: string) => phonePost('/shell', { command });

// WhatsApp Automation
const phonePostWithFallback = async (paths: string[], body: any) => {
  let last: any = null;
  // NOTE: clipboard payload removed because `termux-clipboard-set` hangs on device for 60s causing Broken Pipe

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
  // Direct Number Check bypasses Fuzzy Search
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
    return { ok: false, success: false, error: `No saved email found for "${name}". Add it in Settings → Email Contacts.` };
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
export const phoneContactsSearch = (query: string) => phonePost('/contacts/search', { query });

// yt-dlp
export const phoneYtdlpStatus = () => phonePost('/ytdlp/status');
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

// Smart App Aliases
const APP_ALIASES: Record<string, string> = {
  fb: "facebook",
  facebookapp: "facebook",
  yt: "youtube",
  youtubeapp: "youtube",
  insta: "instagram",
  ig: "instagram",
  wa: "whatsapp",
  whatsappapp: "whatsapp",
  chromebrowser: "chrome",
  playstore: "play store",
  play: "play store",
  mapsapp: "maps",
  gps: "maps",
  galleryapp: "gallery",
  photos: "gallery",
  cam: "camera",
  settingsapp: "settings",
  calc: "calculator",
  contactsapp: "contacts",
  filesapp: "files",
  filemanager: "files",
  musicplayer: "music",
  videoplayer: "video",
  gmailapp: "gmail",
  googlemail: "gmail",
  driveapp: "drive",
  googlephotos: "photos",
  playmusic: "youtube music"
};

function normalizeAppName(name: string): string {
  const key = name.toLowerCase().trim().replace(/\s+/g, "");
  return APP_ALIASES[key] || name.toLowerCase().trim();
}

// Apps that are Windows/PC-only and must never be routed to the phone bridge
export const PC_ONLY_APP_NAMES = new Set([
  // Windows system tools
  'cmd', 'command prompt', 'powershell', 'powershell ise',
  'notepad', 'wordpad', 'calculator', 'calc', 'paint', 'mspaint',
  'file explorer', 'explorer', 'task manager', 'taskmgr',
  'control panel', 'control', 'settings', 'ms-settings',
  'registry editor', 'regedit', 'device manager', 'disk management',
  'event viewer', 'services', 'windows terminal', 'terminal', 'wt',
  // Development tools (desktop-only)
  // NOTE: "vs code" / "vscode" are intentionally NOT in this list — VS Code is a
  // cross-platform-ambiguous app name (user may mean a phone code-editor app too),
  // so it should trigger the device-selection popup rather than auto-route to PC.
  'visual studio', 'devenv',
  'android studio', 'pycharm', 'intellij', 'eclipse',
  'sublime text', 'sublime', 'atom', 'notepad++', 'git bash', 'antigravity',
  // Creative/media desktop apps
  'obs', 'obs studio', 'photoshop', 'premiere', 'after effects', 'blender',
  'audacity', 'handbrake',
  // Microsoft Office
  'word', 'excel', 'powerpoint', 'access', 'outlook',
  'microsoft word', 'microsoft excel', 'microsoft powerpoint', 'winword', 'powerpnt',
  // Media players (desktop)
  'vlc', 'media player', 'windows media player', 'wmplayer',
]);

// ── Phone natural-language parser + executor ────────────────────────────────
export interface PhoneCommand {
  action: string;
  params?: Record<string, any>;
  label: string;
}

export const parsePhoneCommand = (input: string): PhoneCommand | null => {
  const t = input.trim();
  // BUG FIX: lowerT created so that basic hardware commands like "Torch On", "Set Brightness" match regardless of case.
  const lowerT = t.toLowerCase();

  // 📧 EMAIL AUTOMATION PARSING 
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

  // 💬 WHATSAPP AUTOMATION PARSING 
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

  // Torch (Now uses lowerT to match Capital Letters flawlessly)
  if (/\b(torch|flashlight|flash|light)\b.*\b(on|chalu|jala|jalao|start|open)\b/.test(lowerT)
    || /\b(on|chalu|jalao|start)\b.*\b(torch|flashlight|flash)\b/.test(lowerT)) {
    return { action: 'torch', params: { on: true }, label: 'turn torch ON' };
  }
  if (/\b(torch|flashlight|flash|light)\b.*\b(off|band|bandh|close|stop)\b/.test(lowerT)
    || /\b(off|band|bandh|stop)\b.*\b(torch|flashlight|flash)\b/.test(lowerT)) {
    return { action: 'torch', params: { on: false }, label: 'turn torch OFF' };
  }

  // Vibrate
  if (/\b(vibrate|vibration|kampan|thartharao|thartharaho)\b/.test(lowerT)) {
    const m = lowerT.match(/(\d{2,5})\s*(ms|milli|second|sec)?/);
    const dur = m ? Math.min(5000, parseInt(m[1])) : 1000;
    return { action: 'vibrate', params: { duration: dur }, label: `vibrate phone (${dur}ms)` };
  }

  // Battery
  if (/\bbattery\b|\bbatri\b|\bbattry\b|battery\s*(status|level|percent)|kitni.*battery|battery.*kitni/.test(lowerT)) {
    return { action: 'battery', label: 'get battery status' };
  }

  // Brightness
  const brightM = lowerT.match(/brightness\s*(?:ko|to|=)?\s*(\d{1,3})/) || lowerT.match(/(\d{1,3})\s*%?\s*brightness/);
  if (brightM) {
    const lvl = Math.max(0, Math.min(255, parseInt(brightM[1]) > 100 ? parseInt(brightM[1]) : Math.round(parseInt(brightM[1]) * 2.55)));
    return { action: 'brightness', params: { level: lvl }, label: `set brightness ${brightM[1]}` };
  }

  // Volume
  const volM = lowerT.match(/volume\s*(?:ko|to|=)?\s*(\d{1,3})/);
  if (volM) return { action: 'volume', params: { stream: 'music', level: parseInt(volM[1]) }, label: `set volume ${volM[1]}` };

  // Location
  if (/\b(location|gps|kaha hu|kahan hoon|where am i|meri location)\b/.test(lowerT)) {
    return { action: 'location', label: 'get GPS location' };
  }

  // Wi-Fi
  if (/\bwifi\b.*\b(on|chalu|start)\b/.test(lowerT)) return { action: 'wifi', params: { on: true }, label: 'wifi ON' };
  if (/\bwifi\b.*\b(off|band|stop)\b/.test(lowerT)) return { action: 'wifi', params: { on: false }, label: 'wifi OFF' };
  if (/\bwifi\b.*(info|details|status)/.test(lowerT)) return { action: 'wifi-info', label: 'wifi info' };

  // Clipboard
  if (/clipboard.*(read|get|dikhao|show)/.test(lowerT)) return { action: 'clip-get', label: 'read clipboard' };
  const clipSet = t.match(/clipboard.*(?:set|copy|par likh|mein daal)[^"']*["'](.+?)["']/i);
  if (clipSet) return { action: 'clip-set', params: { text: clipSet[1] }, label: 'set clipboard' };

  // SMS 
  const smsM = t.match(/^(?:sms|text)\s+(?:to\s+)?(\+?\d[\d\s\-]{6,15})\s+(?:msg|message)\s+([\s\S]+)$/i)
    || t.match(/^(\+?\d[\d\s\-]{6,15})\s*(?:ko|par)?\s*sms\s*(?:bhejo|send|kar)\s+([\s\S]+)$/i);
  if (smsM) return { action: 'sms', params: { number: sanitizePhoneNumber(smsM[1]), text: smsM[2] || smsM[3] }, label: `SMS to ${smsM[1]}` };

  // Call by number
  const callM = t.match(/^(?:call|phone|dial)\s+(?:to\s+)?(\+?\d[\d\s\-]{6,15})$/i)
    || t.match(/^(\+?\d[\d\s\-]{6,15})\s*(?:ko|par)?\s*(?:call|phone|dial)\s*(?:karo|kar|do)$/i);
  if (callM) return { action: 'call', params: { number: sanitizePhoneNumber(callM[1]) }, label: `call ${callM[1]}` };

  // Call by name
  const callNameM = t.match(/^(?:call|phone|dial|ring|video\s*call)\s+(?:to\s+|karo\s+)?([a-zA-Z][a-zA-Z\s\.'-]{1,30}?)(?:\s*$|[.,!?])/i)
    || t.match(/^([a-zA-Z][a-zA-Z\s\.'-]{1,30}?)\s*(?:ko|par|ke|se)\s*(?:call|phone|dial)\s*(?:karo|kar|do|lagao|milao)?$/i);
  if (callNameM && !/\d/.test(callNameM[1])) {
    const name = callNameM[1].trim().replace(/\s+/g, ' ');
    if (!/^(me|him|her|them|someone|anyone|nobody|end|back|now|please)$/i.test(name) && name.length >= 2) {
      return { action: 'call-name', params: { name }, label: `call ${name}` };
    }
  }

  if (/^(?:end call|call end|call kaat|hang up|cut call)$/i.test(t)) return { action: 'call-end', label: 'end call' };

  // Camera
  if (/\b(front cam|selfie|front camera).*photo|photo.*front|selfie\s*(khinch|le|lo|lelo)/i.test(lowerT))
    return { action: 'photo', params: { camera: 1 }, label: 'front camera photo' };
  if (/\b(back cam|rear cam|back camera).*photo|photo.*back|photo\s*(khinch|le|lo|lelo|click)/i.test(lowerT))
    return { action: 'photo', params: { camera: 0 }, label: 'back camera photo' };

  // Toast / Notify
  const toastM = t.match(/toast[^"']*["'](.+?)["']/i);
  if (toastM) return { action: 'toast', params: { text: toastM[1] }, label: 'toast' };
  const notifM = t.match(/(?:notify|notification)[^"']*["'](.+?)["']/i);
  if (notifM) return { action: 'notify', params: { title: 'Alsa AI', content: notifM[1] }, label: 'notification' };

  // TTS
  const ttsM = t.match(/(?:speak|bolo|tts)[^"']*["'](.+?)["']/i);
  if (ttsM) return { action: 'tts', params: { text: ttsM[1] }, label: 'speak' };

  // Telegram 
  const tgUserM = t.match(/^(?:telegram|tg)\s+(?:to\s+)?@([a-zA-Z0-9_]+)\s+(?:msg|message|text)\s+([\s\S]+)$/i);
  if (tgUserM) {
    return { action: 'telegram-user', params: { username: tgUserM[1].trim(), text: tgUserM[2].trim() }, label: `Telegram to @${tgUserM[1]}` };
  }
  const tgNameM = t.match(/^(?:telegram|tg)\s+(?:to\s+)?([a-zA-Z][a-zA-Z\s]{1,30}?)\s+(?:msg|message|text)\s+([\s\S]+)$/i);
  if (tgNameM && !/\d/.test(tgNameM[1])) {
    return { action: 'telegram-name', params: { name: tgNameM[1].trim(), text: tgNameM[2].trim() }, label: `Telegram to ${tgNameM[1].trim()}` };
  }

  // YT-DLP
  const ytM = t.match(/(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/\S+)/i);
  if (ytM && /\b(download|save|mp3|mp4|audio|video|yt-?dlp|playlist)\b/i.test(t)) {
    const audio = /\b(mp3|audio|song|music)\b/i.test(t);
    const q = t.match(/\b(144|240|360|480|720|1080|1440|2160|4k)\b/i);
    return {
      action: 'ytdlp',
      params: {
        url: ytM[1],
        mode: audio ? 'audio' : 'video',
        quality: q ? (q[1].toLowerCase() === '4k' ? '2160' : q[1]) : 'best',
        playlist: /\bplaylist\b/i.test(t) || /list=/.test(ytM[1]),
      },
      label: `yt-dlp ${audio ? 'audio' : 'video'} on phone`,
    };
  }

  // Contacts
  const cSearch = t.match(/(?:contact|contacts)\s+(?:search|find|dhundo|dhoondo|khojo)\s+(.+)/i);
  if (cSearch) return { action: 'contact-search', params: { query: cSearch[1].trim() }, label: `search contact "${cSearch[1].trim()}"` };

  // Media
  if (/\b(pause|ruk|band karo)\s*(music|song|media|gana)/i.test(lowerT)) return { action: 'media', params: { action: 'pause' }, label: 'pause media' };
  if (/\b(play)\s*(music|song|media|gana)/i.test(lowerT)) return { action: 'media', params: { action: 'play' }, label: 'play media' };

  // Smart App Open Selector — skips apps that are PC-only and must never go to the phone bridge
  const openAppPattern =
    t.match(/(?:open|launch|start|run|chalu\s*karo|khol|kholo|open\s+app)\s+(.+)/i) ||
    t.match(/(.+?)\s+(?:open\s*karo|chalu\s*karo|start\s*karo|khol|kholo)/i);

  if (openAppPattern) {
    let appName = normalizeAppName(openAppPattern[1].trim().replace(/[.!?]$/, ""));
    if (PC_ONLY_APP_NAMES.has(appName.toLowerCase())) return null;
    return { action: "app-open", params: { name: appName }, label: `open ${appName}` };
  }

  return null;
};

// Confidently resolves a free-text app name to an installed Android app.
// IMPORTANT: never falls back to a loose "contains" match — a short/generic name
// (e.g. "x") must not silently resolve to an unrelated installed app (e.g. Twitter/X).
// If nothing matches with confidence, this returns a clean "not found" error instead.
function resolveInstalledApp(target: string, apps: any[]): any | null {
  const esc = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundary = new RegExp(`\\b${esc}\\b`, 'i');

  // 1) Exact label or package match — highest confidence.
  let match = apps.find((app: any) => {
    const label = (app.label || app.name || '').toLowerCase();
    const pkg = (app.package || '').toLowerCase();
    return label === target || pkg === target;
  });
  if (match) return match;

  // Loose matching below is only safe for names specific enough to avoid
  // accidentally grabbing an unrelated app.
  if (target.length < 3) return null;

  // 2) Label/package starts with the target (e.g. "insta" → "instagram").
  match = apps.find((app: any) => {
    const label = (app.label || app.name || '').toLowerCase();
    const pkg = (app.package || '').toLowerCase();
    return label.startsWith(target) || pkg.startsWith(target);
  });
  if (match) return match;

  // 3) Target appears as a whole word inside the label (e.g. "code" → "VS Code").
  match = apps.find((app: any) => wordBoundary.test((app.label || app.name || '').toLowerCase()));
  return match || null;
}

async function smartOpenApp(appName: string) {
  let res = await phoneAppOpen(appName);
  if (res?.ok || res?.success) return res;

  const list = await phoneAppList();
  const apps = list?.data || list?.apps || [];
  if (!Array.isArray(apps) || apps.length === 0) {
    return { ok: false, success: false, message: `App "${appName}" not found on this phone` };
  }

  const target = appName.toLowerCase().trim();
  const match = resolveInstalledApp(target, apps);

  if (!match) return { ok: false, success: false, message: `App "${appName}" not found on this phone. Please check the app name.` };
  return phoneAppOpen(match.package);
}

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
    case 'app-open':
      return `📱 ${p.name} open kar di.`;
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
      case 'whatsapp-num': res = await phoneWhatsappSend(cmd.params!.number, cmd.params!.text); break;
      case 'whatsapp-name': res = await phoneWhatsappSendByName(cmd.params!.name, cmd.params!.text); break;
      case 'telegram-user': res = await phoneTelegramSend(cmd.params!.username, cmd.params!.text); break;
      case 'telegram-name': res = await phoneTelegramSendByName(cmd.params!.name, cmd.params!.text); break;
      case 'torch': res = await phoneTorch(cmd.params!.on); break;
      case 'vibrate': res = await phoneVibrate(cmd.params!.duration); break;
      case 'battery': res = await phoneBattery(); break;
      case 'brightness': res = await phoneBrightness(cmd.params!.level); break;
      case 'volume': res = await phoneVolume(cmd.params!.stream, cmd.params!.level); break;
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
      case 'wifi': res = await phoneWifiToggle(cmd.params!.on); break;
      case 'sms': res = await phoneSmsSend(cmd.params!.number, cmd.params!.text); break;
      case 'call': res = await phoneCallMake(cmd.params!.number); break;
      case 'call-name': res = await phoneCallByName(cmd.params!.name); break;
      case 'call-end': res = await phoneCallEnd(); break;
      case 'photo': res = await phoneCameraPhoto(undefined, cmd.params!.camera); break;
      case 'toast': res = await phoneToast(cmd.params!.text); break;
      case 'notify': res = await phoneNotify(cmd.params!.title, cmd.params!.content); break;
      case 'tts': res = await phoneTts(cmd.params!.text); break;
      case 'ytdlp': res = await phoneYtdlpDownload(cmd.params as any); break;
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
      case 'media': res = await phoneMediaControl(cmd.params!.action); break;
      case 'app-open': res = await smartOpenApp(cmd.params!.name); break;
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
