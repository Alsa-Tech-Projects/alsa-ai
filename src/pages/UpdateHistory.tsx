import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Bot, Smartphone, Bell, Key, Wrench, Zap, Gift, Mic,
  Youtube, MessageSquare, Mail, PhoneCall, Settings2, Contact, MapPin, Code2, Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Helmet } from 'react-helmet';

type Change = {
  icon: any;
  title: string;
  desc: string;
  color: string;
  badge?: string;
};

type Release = {
  version: string;
  label: string;
  tagline: string;
  released: string;
  changes: Change[];
};

const RELEASES: Release[] = [
  {
    version: '5.1',
    label: 'Version 5.1 — Contacts, Email & Clean Theme',
    tagline: 'Email automation, saved contacts and a cleaner blue look.',
    released: 'Latest',
    changes: [
      {
        icon: Mail,
        title: 'Send Email By Name',
        desc: 'Connect your own mailbox once in Settings using your email address and an app password. After that you can simply say "email Ravi about the report". Alsa finds the address in your saved contacts, writes a subject if you did not give one, and sends the mail from your own device. You can also ask for an HTML formatted email.',
        color: 'from-blue-500 to-sky-400',
        badge: 'NEW',
      },
      {
        icon: Contact,
        title: 'Contacts For WhatsApp, Telegram And Email',
        desc: 'Settings now has three contact books. Alsa always checks them before sending a message, so it never invents a number, username or email address. If a contact is missing, it tells you to add it.',
        color: 'from-emerald-500 to-teal-500',
      },
      {
        icon: Settings2,
        title: 'CSV Bulk Upload',
        desc: 'You can add many contacts at once with a CSV file. WhatsApp needs the columns name and phone. Telegram needs name plus username or phone. Email needs name and email. Everything is saved in your secure cloud database instead of the browser.',
        color: 'from-violet-500 to-blue-500',
      },
      {
        icon: MessageSquare,
        title: 'Faster And More Reliable Messaging',
        desc: 'WhatsApp and Telegram sending through the Phone Bridge no longer times out early, and failures now show a clear reason instead of a plain "Failed to fetch".',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: MapPin,
        title: 'Correct Location Again',
        desc: 'Location lookup now uses a second map service as a backup, so you get the real colony, city and state instead of "Unknown location".',
        color: 'from-orange-500 to-amber-500',
      },
      {
        icon: Bot,
        title: 'Knows Today\'s Real Date And Remembers You',
        desc: 'Alsa now always uses the real current date and time up to 2026, and keeps learning what you work on, what you like and what you asked before, so replies feel more personal.',
        color: 'from-sky-500 to-blue-600',
      },
      {
        icon: Sparkles,
        title: 'One Brand Theme Everywhere',
        desc: 'The landing page and the rest of the app now use the same blue and white brand colours, and the sidebar profile card no longer gets hidden on small screens.',
        color: 'from-blue-400 to-sky-300',
      },
    ],
  },
  {
    version: '5.0',
    label: 'Version 5.0 — Voice & Phone Era',
    tagline: 'Real-time voice, smarter phone control aur behtar coding brain.',
    released: 'Latest',
    changes: [
      {
        icon: Mic,
        title: 'Real-Time Voice Input (2.5s Auto Send)',
        desc: 'Mic ab ek click par turant on hota hai. Aap bolte raho — jaise hi 2.5 second chup hote ho, Alsa samajh jaata hai ki sentence poora ho gaya aur message khud send kar deta hai. Poora pipeline WAV-based hai, isliye pehle se kaafi fast aur accurate.',
        color: 'from-fuchsia-500 to-pink-500',
        badge: 'NEW',
      },
      {
        icon: Smartphone,
        title: 'Alsa Phone Bridge APK',
        desc: 'Alsa Ai Bridge Server ki jagah ab ek dedicated APK jo aapke phone par localhost:5002 par server chalati hai. Wahi purane endpoints support hain, isliye torch, brightness, SMS, call, apps, storage, sensors — sab kuch bina Alsa Ai Bridge Server setup ke chalta hai.',
        color: 'from-cyan-500 to-blue-500',
        badge: 'ELITE',
      },
      {
        icon: Contact,
        title: 'Contacts Ab Cloud Database Mein',
        desc: 'Phone ke contacts ab localStorage ki jagah secure database table mein sync hote hain. Isse har device par same contacts milte hain aur "call Ravi" jaise commands har jagah kaam karte hain.',
        color: 'from-emerald-500 to-teal-500',
      },
      {
        icon: MapPin,
        title: 'Exact Location Decoding',
        desc: 'Ab sirf latitude/longitude nahi — Alsa coordinates ko decode karke colony, area, city aur state ke saath poora address batata hai.',
        color: 'from-orange-500 to-amber-500',
      },
      {
        icon: MessageSquare,
        title: 'Clean Natural Replies (No Raw JSON)',
        desc: 'Torch, brightness, app open, website open, battery, sensors — har bridge command ka result ab simple insaani bhasha mein aata hai. Raw JSON dump khatam.',
        color: 'from-indigo-500 to-blue-500',
      },
      {
        icon: Code2,
        title: 'Better Full-Stack Coding Brain',
        desc: 'Alsa ab production-grade full-stack code likhta hai — complete files, proper structure, error handling aur bina bekaar refusals ke.',
        color: 'from-violet-500 to-purple-500',
      },
      {
        icon: Volume2,
        title: 'Text-To-Speech Temporarily Off',
        desc: 'Voice output filhaal band kar diya gaya hai taaki mic aur transcription bilkul clean chale. Agle update mein behtar awaaz ke saath wapas aayega.',
        color: 'from-slate-500 to-slate-700',
      },
      {
        icon: Sparkles,
        title: '"Boss" Nickname & Language Mirroring',
        desc: 'Alsa ab sirf "Boss" ya aapke saved naam se bulaata hai — koi "yaar", "jaan" jaise filler nahi. English mein baat karo to English, Hinglish mein karo to Hinglish.',
        color: 'from-yellow-500 to-amber-500',
      },
      {
        icon: MessageSquare,
        title: 'Naya Gemini-Style Chat UI',
        desc: 'Reply ab bina kisi chhote black box ke poori screen ki width par aata hai. User message ek clean pill bubble mein, aur assistant ka jawab full-width readable layout mein. Mobile par chat ab screen se bahar nahi jaati.',
        color: 'from-blue-500 to-indigo-500',
        badge: 'NEW',
      },
      {
        icon: Code2,
        title: 'Coding Canvas — Open, Copy, Download & Preview',
        desc: 'Lambe code blocks ab chat ko nahi todte. "Open File In Canvas" par click karke poora file view milta hai jisme Copy, Download aur .html files ke liye live "Preview Output" bhi hai.',
        color: 'from-emerald-500 to-green-600',
        badge: 'NEW',
      },
      {
        icon: Wrench,
        title: 'Better Markdown: Tables, Math, Links & Code',
        desc: 'Tables, KaTeX math, link previews aur code blocks ab sahi spacing aur styling ke saath render hote hain. Lambi lines apne aap agli line par wrap hoti hain, isliye horizontal scroll aur cut-off text khatam.',
        color: 'from-cyan-500 to-sky-600',
      },
      {
        icon: Smartphone,
        title: 'Scroll & Layout Fixes',
        desc: 'Chat area ab sahi se upar-neeche scroll hota hai, chat aur input ke beech ka bada black gap hata diya gaya hai, aur keyboard khulne par bhi layout (100dvh) screen mein fit rehta hai — koi message ab input ke peeche nahi chhupta.',
        color: 'from-rose-500 to-red-500',
      },
      {
        icon: Zap,
        title: 'Premium "+" Menu In Composer',
        desc: 'Input box ke "+" se Image Generation, Deep Research, Smart Learning aur Create (file/PDF) directly choose kar sakte ho — saath mein attach button aur right side par Mic + Send.',
        color: 'from-purple-500 to-fuchsia-500',
      },

    ],
  },
  {
    version: '4.0',
    label: 'Version 4.0 — From Chat To Execution',
    tagline: 'BYOK, Phone Bridge aur execution-first Alsa.',
    released: 'July 2026',
    changes: [
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
        desc: 'Install phone-bridge.py inside Alsa Ai Bridge Server and control your own Android from Alsa — WhatsApp send by contact name, calls, torch, brightness, volume, SMS, clipboard, sensors, yt-dlp downloads and more. Runs on port 5002.',
        color: 'from-cyan-500 to-blue-500',
        badge: 'ELITE',
      },
      {
        icon: PhoneCall,
        title: 'Call & WhatsApp by Contact Name',
        desc: 'Just say "call Ravi" or "whatsapp Aman: kal milte hain" in any language. Alsa searches your contacts and dials/sends the correct number — no need to remember digits.',
        color: 'from-green-500 to-emerald-500',
      },
      {
        icon: Youtube,
        title: 'yt-dlp on Phone (Fixed Folders)',
        desc: "YouTube videos now save to your phone's DCIM/Videos folder and audio downloads go straight into Music. Playlists, MP3, 4K, subs and thumbnails all supported.",
        color: 'from-red-500 to-orange-500',
      },
      {
        icon: Settings2,
        title: 'Custom AI Instructions',
        desc: 'A new "Instructions" box in Settings lets you tell Alsa exactly how to behave — tone, persona, do/don\'t rules.',
        color: 'from-violet-500 to-purple-500',
      },
      {
        icon: Bell,
        title: 'Notifications Revamped',
        desc: 'Brand-new glassy notification center with gradient icons, filter tabs, smoother animations and a proper welcome notification for every new signup.',
        color: 'from-amber-500 to-orange-500',
      },
      {
        icon: Wrench,
        title: 'Bridge Priority + Honest Execution',
        desc: 'Alsa now always tries Phone Bridge (5002) before PC Bridge (5001) for phone tasks and no longer fakes success.',
        color: 'from-slate-500 to-slate-700',
      },
      {
        icon: Zap,
        title: 'Version 4.0 Branding',
        desc: 'Chat screen shows "From Chat To Execution 4.0". A new pricing card (Pro ₹299 / Elite ₹499) and updated Terms round off the 4.0 rollout.',
        color: 'from-yellow-500 to-amber-500',
      },
    ],
  },
];

export default function UpdateHistory() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(RELEASES[0].version);
  const release = RELEASES.find((r) => r.version === version) ?? RELEASES[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Alsa AI Update History — All Version Changes</title>
        <meta
          name="description"
          content="Alsa AI ka poora update history — har version ke naye features, fixes aur improvements ek jagah. Version dropdown se koi bhi update chuno."
        />
        <link rel="canonical" href="/update-history" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-4">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono tracking-widest uppercase text-blue-300">
              Version {release.version}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/40">
            Update History
          </h1>
          <p className="text-muted-foreground mt-3">{release.tagline}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8">
          <span className="text-sm text-muted-foreground shrink-0">Select update:</span>
          <Select value={version} onValueChange={setVersion}>
            <SelectTrigger className="w-full sm:w-[320px]">
              <SelectValue placeholder="Choose a version" />
            </SelectTrigger>
            <SelectContent>
              {RELEASES.map((r) => (
                <SelectItem key={r.version} value={r.version}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="w-fit">{release.released}</Badge>
        </div>

        <div className="space-y-4">
          {release.changes.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card
                key={`${release.version}-${i}`}
                className="p-5 bg-card/50 backdrop-blur border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
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
          Alsa AI Team ❤️ · alsa-ai.in
        </div>
      </div>
    </div>
  );
}
