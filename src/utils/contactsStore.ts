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
        : [];

  const rows = list
    .map((c) => ({
      user_id: user.id,
      name: String(c.name || c.display_name || c.label || '').trim(),
      phone: normalizePhone(String(c.number || c.phone || c.phone_number || '')),
      source: 'phone-bridge',
    }))
    .filter((r) => r.name && r.phone);

  if (!rows.length) return { synced: 0, error: 'No contacts found' };

  const { error } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'user_id,phone' });

  if (error) return { synced: 0, error: error.message };
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
