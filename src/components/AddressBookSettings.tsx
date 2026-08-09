import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageCircle, Send, Mail, Trash2, Plus, Upload, ShieldCheck } from 'lucide-react';
import {
  listContacts, upsertContacts, deleteContact,
  listTelegramContacts, upsertTelegramContacts, deleteTelegramContact,
  listEmailContacts, upsertEmailContacts, deleteEmailContact,
  parseCsv, type StoredContact, type TelegramContact, type EmailContact,
} from '@/utils/contactsStore';
import { phoneEmailConfig, phoneEmailStatus } from '@/utils/pcBridge';

/** Small reusable CSV upload button. */
const CsvButton = ({ onRows, columns }: { onRows: (rows: Record<string, string>[]) => void; columns: string }) => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const rows = parseCsv(await file.text());
          if (!rows.length) toast.error('CSV is empty or could not be read');
          else onRows(rows);
          if (ref.current) ref.current.value = '';
        }}
      />
      <Button variant="outline" size="sm" className="gap-2" onClick={() => ref.current?.click()} title={`CSV columns: ${columns}`}>
        <Upload className="w-4 h-4" /> Upload CSV
      </Button>
    </>
  );
};

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-md px-2 py-1.5 break-words">{children}</p>
);

export const AddressBookSettings = () => {
  const [waList, setWaList] = useState<StoredContact[]>([]);
  const [tgList, setTgList] = useState<TelegramContact[]>([]);
  const [emList, setEmList] = useState<EmailContact[]>([]);

  const [waName, setWaName] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [tgName, setTgName] = useState('');
  const [tgUser, setTgUser] = useState('');
  const [emName, setEmName] = useState('');
  const [emAddr, setEmAddr] = useState('');

  const [mailUser, setMailUser] = useState('');
  const [mailPass, setMailPass] = useState('');
  const [mailConnected, setMailConnected] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const refresh = async () => {
    const [a, b, c] = await Promise.all([listContacts(), listTelegramContacts(), listEmailContacts()]);
    setWaList(a); setTgList(b); setEmList(c);
  };

  useEffect(() => {
    refresh();
    phoneEmailStatus().then((r: any) => { if (r?.configured) setMailConnected(r.email); }).catch(() => {});
  }, []);

  const pick = (row: Record<string, string>, keys: string[]) => {
    for (const k of keys) if (row[k]) return row[k];
    return '';
  };

  const connectEmail = async () => {
    if (!mailUser.trim() || !mailPass.trim()) return toast.error('Enter your email and app password');
    setConnecting(true);
    const res: any = await phoneEmailConfig(mailUser.trim(), mailPass.trim());
    setConnecting(false);
    if (res?.ok || res?.success) {
      setMailConnected(mailUser.trim());
      setMailPass('');
      toast.success('Email connected on your device');
    } else {
      toast.error(res?.error || 'Could not reach the Alsa Phone Bridge app (port 5002)');
    }
  };

  return (
    <>
      {/* ── WhatsApp contacts ── */}
      <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-green-500" /> WhatsApp Contacts</CardTitle>
          <CardDescription>Alsa checks this list before sending any WhatsApp message.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CsvButton
              columns="name, phone"
              onRows={async (rows) => {
                const { count, error } = await upsertContacts(
                  rows.map((r) => ({ name: pick(r, ['name', 'full name', 'contact', 'display name']), phone: pick(r, ['phone', 'number', 'mobile', 'whatsapp']) })),
                  'csv',
                );
                error ? toast.error(error) : toast.success(`${count} WhatsApp contacts imported`);
                refresh();
              }}
            />
            <Badge variant="outline">{waList.length} saved</Badge>
          </div>
          <Hint>CSV columns: <b>name</b>, <b>phone</b> — example: <code>name,phone</code> then <code>Ravi,+919876543210</code>. Always add the country code.</Hint>

          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <Input value={waName} onChange={(e) => setWaName(e.target.value)} placeholder="Name" className="flex-1 min-w-0" />
            <Input value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="+91XXXXXXXXXX" className="flex-1 min-w-0" />
            <Button
              size="icon"
              className="self-end sm:self-auto"
              onClick={async () => {
                const { error } = await upsertContacts([{ name: waName, phone: waPhone }], 'manual');
                if (error) return toast.error(error);
                setWaName(''); setWaPhone(''); refresh(); toast.success('Contact saved');
              }}
            ><Plus className="w-4 h-4" /></Button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {waList.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2.5 bg-secondary/30 rounded-lg min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.phone}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive shrink-0"
                  onClick={async () => { await deleteContact(c.id!); refresh(); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Telegram contacts ── */}
      <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-sky-500" /> Telegram Contacts</CardTitle>
          <CardDescription>Alsa checks this list before sending any Telegram message.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CsvButton
              columns="name, username, phone"
              onRows={async (rows) => {
                const { count, error } = await upsertTelegramContacts(
                  rows.map((r) => ({
                    name: pick(r, ['name', 'full name', 'contact']),
                    username: pick(r, ['username', 'telegram', 'handle', 'telegram username']),
                    phone: pick(r, ['phone', 'number', 'mobile']),
                  })),
                  'csv',
                );
                error ? toast.error(error) : toast.success(`${count} Telegram contacts imported`);
                refresh();
              }}
            />
            <Badge variant="outline">{tgList.length} saved</Badge>
          </div>
          <Hint>CSV columns: <b>name</b>, <b>username</b>, <b>phone</b> (username or phone — at least one is required). Example: <code>name,username,phone</code> then <code>Ravi,ravi_99,+919876543210</code>.</Hint>

          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <Input value={tgName} onChange={(e) => setTgName(e.target.value)} placeholder="Name" className="flex-1 min-w-0" />
            <Input value={tgUser} onChange={(e) => setTgUser(e.target.value)} placeholder="@username or phone" className="flex-1 min-w-0" />
            <Button
              size="icon"
              className="self-end sm:self-auto"
              onClick={async () => {
                const v = tgUser.trim();
                const isPhone = /^[+\d][\d\s-]{6,}$/.test(v);
                const { error } = await upsertTelegramContacts([{ name: tgName, username: isPhone ? '' : v, phone: isPhone ? v : '' }], 'manual');
                if (error) return toast.error(error);
                setTgName(''); setTgUser(''); refresh(); toast.success('Telegram contact saved');
              }}
            ><Plus className="w-4 h-4" /></Button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {tgList.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2.5 bg-secondary/30 rounded-lg min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.username ? `@${c.username}` : c.phone}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive shrink-0"
                  onClick={async () => { await deleteTelegramContact(c.id!); refresh(); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Email ── */}
      <Card className="bg-card border-border w-full max-w-full overflow-hidden min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Email Automation</CardTitle>
          <CardDescription>Connect your mailbox once, then just say “email Ravi about the report”.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 min-w-0">
          <div className="space-y-2 min-w-0">
            <Label className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Mailbox
              {mailConnected && <Badge className="bg-green-600 text-white">Connected: {mailConnected}</Badge>}
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 min-w-0">
              <Input value={mailUser} onChange={(e) => setMailUser(e.target.value)} placeholder="you@gmail.com" className="flex-1 min-w-0" />
              <Input value={mailPass} onChange={(e) => setMailPass(e.target.value)} type="password" placeholder="App password" className="flex-1 min-w-0" />
              <Button onClick={connectEmail} disabled={connecting} className="self-end sm:self-auto">
                {connecting ? 'Connecting…' : 'Connect'}
              </Button>
            </div>
            <Hint>
              Use an <b>app password</b>, not your normal password (Gmail: Google Account → Security → 2-Step Verification → App passwords).
              Your password is stored only on your own device by the Alsa Phone Bridge app — it never reaches our servers.
            </Hint>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
            <CsvButton
              columns="name, email"
              onRows={async (rows) => {
                const { count, error } = await upsertEmailContacts(
                  rows.map((r) => ({ name: pick(r, ['name', 'full name', 'contact']), email: pick(r, ['email', 'email address', 'mail']) })),
                  'csv',
                );
                error ? toast.error(error) : toast.success(`${count} email contacts imported`);
                refresh();
              }}
            />
            <Badge variant="outline">{emList.length} saved</Badge>
          </div>
          <Hint>CSV columns: <b>name</b>, <b>email</b> — example: <code>name,email</code> then <code>Ravi,ravi@example.com</code>.</Hint>

          <div className="flex flex-col sm:flex-row gap-2 min-w-0">
            <Input value={emName} onChange={(e) => setEmName(e.target.value)} placeholder="Name" className="flex-1 min-w-0" />
            <Input value={emAddr} onChange={(e) => setEmAddr(e.target.value)} placeholder="name@example.com" className="flex-1 min-w-0" />
            <Button
              size="icon"
              className="self-end sm:self-auto"
              onClick={async () => {
                const { error } = await upsertEmailContacts([{ name: emName, email: emAddr }], 'manual');
                if (error) return toast.error(error);
                setEmName(''); setEmAddr(''); refresh(); toast.success('Email contact saved');
              }}
            ><Plus className="w-4 h-4" /></Button>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {emList.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2.5 bg-secondary/30 rounded-lg min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive shrink-0"
                  onClick={async () => { await deleteEmailContact(c.id!); refresh(); }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default AddressBookSettings;
