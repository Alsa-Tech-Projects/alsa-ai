import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Bot, Smartphone, Bell, Key, Wrench, Zap, Gift, Mic, Youtube, MessageSquare, PhoneCall, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet';

const changes = [
  {
    icon: Key,
    title: 'BYOK — Bring Your Own API Key',
    desc: 'Add your personal Google Gemini API key in Settings and every chat runs on your key. When your key is used you see a "Your Own API Key Response" tag under the reply; server key falls back to "Alsa AI Server Response".',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Gift,
    title: 'First 50 Users Get 1 Month Pro FREE',
    desc: 'The first 50 people who sign up now receive a full month of Alsa Pro — full-stack coding, PC Bridge, document generation and more — with zero payment.',
    color: 'from-emerald-500 to-teal-500',
    badge: 'NEW',
  },
  {
    icon: Bot,
    title: 'Avatar Chat — Talk to Mira',
    desc: 'Avatar Chat is fully working again. The JWT / edge function issue is fixed so Mira can hear you, reply in real time and hold a natural voice conversation.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Smartphone,
    title: 'Phone Bridge (Elite)',
    desc: 'Install phone-bridge.py inside Termux and control your own Android from Alsa — WhatsApp send by contact name, calls, torch, brightness, volume, SMS, clipboard, sensors, yt-dlp downloads and more. Runs on port 5002.',
    color: 'from-cyan-500 to-blue-500',
    badge: 'ELITE',
  },
  {
    icon: PhoneCall,
    title: 'Call & WhatsApp by Contact Name',
    desc: 'Just say "call Ravi" or "whatsapp Aman: kal milte hain" in any language. Alsa searches your Termux contacts.json and dials/sends the correct number — no need to remember digits.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Youtube,
    title: 'yt-dlp on Phone (Fixed Folders)',
    desc: 'YouTube videos now save to your phone\'s DCIM/Videos folder and audio downloads go straight into Music — no more random ALSA-YT folder. Playlists, MP3, 4K, subs and thumbnails all supported.',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: Settings2,
    title: 'Custom AI Instructions',
    desc: 'A new "Instructions" box in Settings lets you tell Alsa exactly how to behave — tone, persona, do/don\'t rules. The AI now respects your instructions on every reply.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: MessageSquare,
    title: 'Language Mirroring + Cleaner Replies',
    desc: 'Talk in English → reply is 100% English. Talk in Hinglish/Hindi → matched exactly. Filler words like "bhai", "yaar", "matlab" are stripped when you write in English. No more forced Hinglish.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: Bell,
    title: 'Notifications Revamped',
    desc: 'Brand-new glassy notification center with gradient icons, filter tabs, smoother animations and a proper welcome notification for every new signup.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: Mic,
    title: 'Mic Button in Chat Input',
    desc: 'A dedicated mic button now sits inside the chat input on both mobile and desktop. Tap it to dictate hands-free — no more digging through side panels for voice.',
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: Wrench,
    title: 'Bridge Priority + Honest Execution',
    desc: 'Alsa now always tries Phone Bridge (5002) before PC Bridge (5001) for phone tasks and no longer fakes success — you only see "done" when the bridge actually did it.',
    color: 'from-slate-500 to-slate-700',
  },
  {
    icon: Zap,
    title: 'Version 4.0 Branding — From Chat To Execution',
    desc: 'Chat screen now proudly shows "From Chat To Execution 4.0". A new pricing card (Pro ₹299 / Elite ₹499) and updated Terms round off the 4.0 rollout.',
    color: 'from-yellow-500 to-amber-500',
  },
];

export default function Changelog() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>What's New in Alsa AI 4.0 — Changelog</title>
        <meta name="description" content="Every new feature and bug fix shipped in Alsa AI version 4.0 — BYOK, Phone Bridge, contact-name calling, yt-dlp fixes, mic in chat, 50 free Pro accounts and more." />
        <link rel="canonical" href="/changelog" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Alsa AI 4.0 — What's New",
          "itemListElement": changes.map((c, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": c.title,
            "description": c.desc,
          })),
        })}</script>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono tracking-widest uppercase text-blue-300">Version 4.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            What's New in Alsa AI
          </h1>
          <p className="text-muted-foreground mt-3">
            The complete list of fixes and features shipped in the 4.0 update.
          </p>
        </div>

        <div className="space-y-4">
          {changes.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card key={i} className="p-5 bg-card/50 backdrop-blur border-white/10 hover:border-white/20 transition-colors">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold">{c.title}</h3>
                      {c.badge && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px]">
                          {c.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-10 text-xs text-muted-foreground">
          Released July 2026 · Alsa AI Team ❤️
        </div>
      </div>
    </div>
  );
}
