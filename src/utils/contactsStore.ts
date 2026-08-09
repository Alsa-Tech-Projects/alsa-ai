import { supabase } from '@/integrations/supabase/client';

export type StoredContact = { id?: string; name: string; phone: string; source?: string };

const normalizePhone = (p: string) => (p || '').replace(/[^\d+]/g, '');

/** Phone Bridge / APK se aaye contacts ko `contacts` table me sync karo */
export const syncContactsToDb = async (raw: any): Promise<{ synced: number; error?: string }> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) return { synced: 0, error: 'Not signed in' };

  const list: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.contacts)
      ? raw.contacts
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.results)
          ? raw.results
          : Array.isArray(raw?.items)
            ? raw.items
        : [];

  const rawRows = list
    .map((c) => ({
      user_id: user.id,
      name: String(c.name || c.display_name || c.label || '').trim(),
      phone: normalizePhone(String(c.number || c.phone || c.phone_number || c.mobile || c.value || '')),
      source: 'phone-bridge',
    }))
    .filter((r) => r.name && r.phone);

  if (!rawRows.length) return { synced: 0, error: 'No contacts found' };

  // De-dupe by phone to prevent batch upsert conflicts
  const uniqueMap = new Map();
  rawRows.forEach(row => {
    uniqueMap.set(row.phone, row);
  });
  const rows = Array.from(uniqueMap.values());

  const { error } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'user_id,phone' });

  if (error) {
    console.error('syncContactsToDb error:', error.message);
    return { synced: 0, error: error.message };
  }
  return { synced: rows.length };
};

export const listContacts = async (): Promise<StoredContact[]> => {
  const { data, error } = await supabase
    .from('contacts')
    .select('id,name,phone,source')
    .order('name', { ascending: true });
  if (error) {
    console.error('listContacts error:', error.message);
    return [];
  }
  return (data || []) as StoredContact[];
};

export const searchContacts = async (query: string): Promise<StoredContact[]> => {
  const q = (query || '').trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from('contacts')
    .select('id,name,phone,source')
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(10);
  if (error) {
    console.error('searchContacts error:', error.message);
    return [];
  }
  return (data || []) as StoredContact[];
};

export const addContact = async (name: string, phone: string) => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: 'Not signed in' };
  const { error } = await supabase.from('contacts').upsert(
    { user_id: auth.user.id, name: name.trim(), phone: normalizePhone(phone), source: 'manual' },
    { onConflict: 'user_id,phone' },
  );
  return { error: error?.message };
};

export const deleteContact = async (id: string) => {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  return { error: error?.message };
};

// ── Telegram address book ───────────────────────────────────────────
export type TelegramContact = { id?: string; name: string; username?: string | null; phone?: string | null; source?: string };

export const listTelegramContacts = async (): Promise<TelegramContact[]> => {
  const { data, error } = await supabase
    .from('telegram_contacts')
    .select('id,name,username,phone,source')
    .order('name', { ascending: true });
  if (error) { console.error('listTelegramContacts:', error.message); return []; }
  return (data || []) as TelegramContact[];
};

export const lookupTelegramContact = async (name: string): Promise<TelegramContact | null> => {
  const q = (name || '').trim();
  if (!q) return null;
  const { data } = await supabase
    .from('telegram_contacts')
    .select('id,name,username,phone,source')
    .ilike('name', `%${q}%`)
    .limit(1);
  return (data && data[0]) ? (data[0] as TelegramContact) : null;
};

export const upsertTelegramContacts = async (rows: { name: string; username?: string; phone?: string }[], source = 'manual') => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { count: 0, error: 'Not signed in' };
  const payload = rows
    .filter((r) => r.name?.trim() && (r.username?.trim() || r.phone?.trim()))
    .map((r) => ({
      user_id: auth.user!.id,
      name: r.name.trim(),
      username: (r.username || '').trim().replace(/^@/, '') || null,
      phone: normalizePhone(r.phone || '') || null,
      source,
    }));
  if (!payload.length) return { count: 0, error: 'Nothing valid to import' };
  const { error } = await supabase.from('telegram_contacts').upsert(payload, { onConflict: 'user_id,name' });
  return { count: error ? 0 : payload.length, error: error?.message };
};

export const deleteTelegramContact = async (id: string) => {
  const { error } = await supabase.from('telegram_contacts').delete().eq('id', id);
  return { error: error?.message };
};

// ── Email address book ──────────────────────────────────────────────
export type EmailContact = { id?: string; name: string; email: string; source?: string };

export const listEmailContacts = async (): Promise<EmailContact[]> => {
  const { data, error } = await supabase
    .from('email_contacts')
    .select('id,name,email,source')
    .order('name', { ascending: true });
  if (error) { console.error('listEmailContacts:', error.message); return []; }
  return (data || []) as EmailContact[];
};

export const lookupEmailContact = async (name: string): Promise<EmailContact | null> => {
  const q = (name || '').trim();
  if (!q) return null;
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(q)) return { name: q, email: q };
  const { data } = await supabase
    .from('email_contacts')
    .select('id,name,email,source')
    .ilike('name', `%${q}%`)
    .limit(1);
  return (data && data[0]) ? (data[0] as EmailContact) : null;
};

export const upsertEmailContacts = async (rows: { name: string; email: string }[], source = 'manual') => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { count: 0, error: 'Not signed in' };
  const payload = rows
    .filter((r) => r.name?.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test((r.email || '').trim()))
    .map((r) => ({ user_id: auth.user!.id, name: r.name.trim(), email: r.email.trim().toLowerCase(), source }));
  if (!payload.length) return { count: 0, error: 'Nothing valid to import' };
  const { error } = await supabase.from('email_contacts').upsert(payload, { onConflict: 'user_id,email' });
  return { count: error ? 0 : payload.length, error: error?.message };
};

export const deleteEmailContact = async (id: string) => {
  const { error } = await supabase.from('email_contacts').delete().eq('id', id);
  return { error: error?.message };
};

// ── Bulk phone/WhatsApp contacts import ─────────────────────────────
export const upsertContacts = async (rows: { name: string; phone: string }[], source = 'manual') => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { count: 0, error: 'Not signed in' };
  const map = new Map<string, any>();
  rows.forEach((r) => {
    const phone = normalizePhone(r.phone || '');
    if (r.name?.trim() && phone) map.set(phone, { user_id: auth.user!.id, name: r.name.trim(), phone, source });
  });
  const payload = Array.from(map.values());
  if (!payload.length) return { count: 0, error: 'Nothing valid to import' };
  const { error } = await supabase.from('contacts').upsert(payload, { onConflict: 'user_id,phone' });
  return { count: error ? 0 : payload.length, error: error?.message };
};

/** Very small CSV parser (handles quoted fields + header row). */
export const parseCsv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let cur = '', row: string[] = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else if (ch !== '\r') cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim()))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
};
