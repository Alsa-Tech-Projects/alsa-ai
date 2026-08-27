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
  
  // FIX: Dynamic timeout in MILLISECONDS (not seconds).
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
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (r.ok) {
      const j = await r.json().catch(() => ({}));
      return { 
        connected: true, 
        message: j?.message || 'Phone Bridge connected',
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

// Basic Commands
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
export const phoneAppOpen = (pkg: string) => phonePost('/app/open', { package: pkg });
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

// WhatsApp Automation
export const phoneWhatsappSend = (number: string, text: string) =>
  phonePost('/whatsapp/send', { number: sanitizePhoneNumber(number), text });

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
  return phonePost('/whatsapp/send-by-name', { name, text });
};

// Telegram Automation
export const phoneTelegramSend = (usernameOrNumber: string, text: string) => {
  const isUsername = /^@?[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(String(usernameOrNumber || ''));
  const body = isUsername
    ? { username: String(usernameOrNumber).replace(/^@/, ''), text }
    : { number: sanitizePhoneNumber(usernameOrNumber), text };
  return phonePost('/telegram/send', body);
};

export const phoneTelegramSendByName = async (name: string, text: string) => {
  if (isDirectPhoneNumber(name)) {
    return phoneTelegramSend(name, text);
  }
  const hit = await lookupTelegramContact(name);
  if (hit) return phoneTelegramSend(hit.username || hit.phone || '', text);
  return phonePost('/telegram/send-by-name', { name, text });
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
  if (!hit?.email) {
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
export const phoneYtdlpDownload = (opts: any) => phonePost('/ytdlp/download', opts);

// App Open Helper
export const smartOpenApp = (appName: string) => phonePost('/app/open', { package: appName, name: appName });

// ── Natural Language Command Executor ─────────────────────────
export const executePhoneCommand = async (cmd: any): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    let res: any;
    switch (cmd.action) {
      case 'email-send': res = await phoneEmailSend(cmd.params); break;
      case 'email-name': res = await phoneEmailSendByName(cmd.params.name, cmd.params.body, cmd.params.subject); break;
      case 'whatsapp-num':  res = await phoneWhatsappSend(cmd.params.number, cmd.params.text); break;
      case 'whatsapp-name': res = await phoneWhatsappSendByName(cmd.params.name, cmd.params.text); break;
      case 'telegram-user': res = await phoneTelegramSend(cmd.params.username, cmd.params.text); break;
      case 'telegram-name': res = await phoneTelegramSendByName(cmd.params.name, cmd.params.text); break;
      case 'torch':      res = await phoneTorch(cmd.params.on); break;
      case 'vibrate':    res = await phoneVibrate(cmd.params.duration); break;
      case 'battery':    res = await phoneBattery(); break;
      case 'brightness': res = await phoneBrightness(cmd.params.level); break;
      case 'volume':     res = await phoneVolume(cmd.params.stream, cmd.params.level); break;
      case 'location':   res = await phoneLocation(); break;
      case 'wifi':       res = await phoneWifiToggle(cmd.params.on); break;
      case 'sms':        res = await phoneSmsSend(cmd.params.number, cmd.params.text); break;
      case 'call':       res = await phoneCallMake(cmd.params.number); break;
      case 'call-name':  res = await phoneCallByName(cmd.params.name); break;
      case 'call-end':   res = await phoneCallEnd(); break;
      case 'photo':      res = await phoneCameraPhoto(undefined, cmd.params.camera); break;
      case 'toast':      res = await phoneToast(cmd.params.text); break;
      case 'notify':     res = await phoneNotify(cmd.params.title, cmd.params.content); break;
      case 'tts':        res = await phoneTts(cmd.params.text); break;
      case 'ytdlp':      res = await phoneYtdlpDownload(cmd.params); break;
      case 'contacts':   res = await phoneContacts(); break;
      case 'contact-search': res = await phoneContactsSearch(cmd.params.query); break;
      case 'media':      res = await phoneMediaControl(cmd.params.action); break;
      case 'app-open':   res = await smartOpenApp(cmd.params.name); break;
      default: return { success: false, message: `Unknown action: ${cmd.action}` };
    }
    
    const ok = res?.success !== false && res?.ok !== false;
    return {
      success: ok,
      message: res?.message || (ok ? `${cmd.label || 'Action'} completed` : (res?.error || 'Execution failed')),
      data: res,
    };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Phone Bridge error' };
  }
};
