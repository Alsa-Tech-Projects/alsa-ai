import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Youtube, Monitor, Terminal, FolderOpen, FileText, Camera, Music2,
  Database, Smartphone, FileSpreadsheet, Presentation, Globe, Mic,
  Code2, Settings, Zap, Shield, Download, MessageSquare, Cpu,
} from 'lucide-react';

type Tier = 'pro' | 'elite' | 'both';
interface Feature {
  icon: any;
  title: string;
  tier: Tier;
  en: string;
  hi: string;
  examples?: string[];
}

const FEATURES: Feature[] = [
  {
    icon: Youtube, title: 'YouTube & Playlist Downloader (yt-dlp)', tier: 'both',
    en: 'Download any YouTube video, full playlist, or extract audio (MP3, M4A, OPUS, WAV, FLAC) directly to your PC using the powerful yt-dlp engine. Supports quality selection (144p to 4K), subtitles in any language, automatic thumbnail embedding, metadata tagging, time-range cutting, cookies from browser for private videos, proxy, rate-limit, and resume on failure. Just paste a YouTube link in chat with words like "download", "mp3", "1080p", or "playlist" and ALSA will handle the rest.',
    hi: 'Koi bhi YouTube video, poori playlist, ya sirf audio (MP3, M4A, OPUS, WAV, FLAC) seedhe apne PC mein download karein — yt-dlp engine ke saath. Quality choose kar sakte hain (144p se 4K tak), subtitles kisi bhi language mein, thumbnail aur metadata auto-embed, video ka specific part cut karna, browser cookies se private videos, proxy, speed-limit, aur fail hone par resume — sab support hai. Chat mein YouTube link paste karein aur "download", "mp3", "1080p" ya "playlist" likh dein, ALSA baaki sab khud kar legi.',
    examples: [
      'Download this https://youtu.be/xxxx in 1080p',
      'Save https://youtube.com/playlist?list=... as mp3',
      'Grab audio from https://youtu.be/xxxx with subtitles',
    ],
  },
  {
    icon: Monitor, title: 'PC App Control', tier: 'both',
    en: 'Open or close any installed Windows application — Chrome, VS Code, Notepad, Calculator, Spotify, Discord, Photoshop, games, or any custom EXE. ALSA auto-scans your system to know what is installed.',
    hi: 'Aap apne PC ki koi bhi installed app — Chrome, VS Code, Notepad, Calculator, Spotify, Discord, Photoshop, games — voice ya text command se open/close kar sakte hain. ALSA aapke system ko scan karke khud pehchaan leti hai ki kya installed hai.',
    examples: ['open chrome', 'close notepad', 'launch vs code'],
  },
  {
    icon: Terminal, title: 'CMD / PowerShell / Python Execution', tier: 'both',
    en: 'Run any shell command, PowerShell script, or Python file directly from chat. Full output is streamed back to you. Great for automation, dev work, and one-off scripts.',
    hi: 'Chat se hi koi bhi CMD command, PowerShell script, ya Python file run kar sakte hain. Output turant ALSA mein dikh jata hai. Automation, coding aur quick scripts ke liye perfect.',
    examples: ['run dir in cmd', 'execute python C:/test.py', 'run powershell Get-Process'],
  },
  {
    icon: FolderOpen, title: 'File & Folder Operations', tier: 'both',
    en: 'Create folders, generate text files, write content, open any folder in Explorer, browse Desktop / Documents / Downloads. Build entire project structures with one command.',
    hi: 'Folder banao, text files generate karo, content likho, kisi bhi folder ko Explorer mein kholo, ya Desktop / Documents / Downloads browse karo — sab ek command mein. Poora project structure bhi ek baar mein bana sakte ho.',
    examples: ['create folder MyProject on desktop', 'write hello to notes.txt', 'open downloads folder'],
  },
  {
    icon: Camera, title: 'Screenshot & Screen Recording', tier: 'both',
    en: 'Capture a screenshot of your screen or record your screen as a video file. Confirmation is always asked before capture for privacy.',
    hi: 'Apni screen ka screenshot le sakte ho ya screen recording video file ke roop mein save kar sakte ho. Privacy ke liye ALSA hamesha confirm karti hai capture se pehle.',
    examples: ['take a screenshot', 'start screen recording', 'stop recording'],
  },
  {
    icon: Music2, title: 'Local Music Player', tier: 'both',
    en: 'Play, pause, and stop songs saved on your local PC. ALSA scans your Music folder and lets you control playback from chat.',
    hi: 'Apne PC mein save songs play, pause aur stop kar sakte ho. ALSA aapke Music folder ko scan kar leti hai aur chat se hi sab control hota hai.',
    examples: ['play song shape of you', 'stop music', 'pause song'],
  },
  {
    icon: Presentation, title: 'PowerPoint Generation', tier: 'both',
    en: 'Generate complete PowerPoint presentations on any topic — slides, titles, bullet points, themes — all auto-built and saved as .pptx.',
    hi: 'Kisi bhi topic par poori PowerPoint presentation auto-generate karo — slides, titles, bullet points, themes — sab ready aur .pptx file mein save.',
    examples: ['create ppt on artificial intelligence', 'make presentation about solar system'],
  },
  {
    icon: FileSpreadsheet, title: 'Excel Sheet Generation', tier: 'both',
    en: 'Auto-create Excel spreadsheets with structured data, formulas, headers, and multiple sheets. Perfect for reports, budgets, and data analysis.',
    hi: 'Auto Excel spreadsheets banao — structured data, formulas, headers, multiple sheets sab ke saath. Reports, budgets aur data analysis ke liye best.',
    examples: ['create excel of monthly budget', 'make spreadsheet of student marks'],
  },
  {
    icon: Code2, title: 'Project Creation', tier: 'both',
    en: 'Spin up full coding projects — React, Python, Node, HTML/CSS — with folder structure, dependencies, and boilerplate code, all written to your PC.',
    hi: 'Pure coding projects ek command mein bana lo — React, Python, Node, HTML/CSS — folder structure, dependencies aur boilerplate code sab aapke PC par auto-create hota hai.',
    examples: ['create react app called todo', 'make python flask project'],
  },
  {
    icon: Database, title: 'Database Management (SQL / SQLite)', tier: 'elite',
    en: 'Create, query, and manage SQLite and SQL databases. Run schema changes, insert records, export data — all from chat.',
    hi: 'SQLite aur SQL databases create, query aur manage karo. Schema change, records insert, data export — sab chat se hi karein.',
    examples: ['create sqlite db users.db', 'query select * from users'],
  },
  {
    icon: Smartphone, title: 'Android ADB Control', tier: 'elite',
    en: 'Connect to your Android phone over USB or Wi-Fi using ADB. Install APKs, take phone screenshots, run shell commands, mirror screen, push/pull files.',
    hi: 'Apne Android phone ko USB ya Wi-Fi se ADB ke through connect karo. APK install karo, phone screenshot lo, shell commands chalao, screen mirror karo, files push/pull karo.',
    examples: ['adb connect 192.168.1.5', 'adb install app.apk', 'adb shell ls'],
  },
  {
    icon: MessageSquare, title: 'WhatsApp & Telegram Automation', tier: 'elite',
    en: 'Send automated WhatsApp and Telegram messages to contacts or numbers. Useful for reminders, broadcasts, and bots.',
    hi: 'WhatsApp aur Telegram par automated messages bhejo — contacts ya numbers ko. Reminders, broadcasts aur bots ke liye useful.',
    examples: ['send whatsapp to 9876543210 saying hi', 'telegram message to channel'],
  },
  {
    icon: Globe, title: '110+ Website Quick Launch', tier: 'both',
    en: 'Instantly open any of 110+ popular websites — YouTube, Spotify, Gmail, Maps, GitHub, Netflix, Amazon, Twitter, LinkedIn and many more — with or without a search query.',
    hi: '110+ popular websites — YouTube, Spotify, Gmail, Maps, GitHub, Netflix, Amazon, Twitter, LinkedIn — sab ek command mein open. Search query ke saath bhi chalega.',
    examples: ['open youtube and search lofi', 'open github', 'search amazon for laptop'],
  },
  {
    icon: Cpu, title: 'System Scan & Smart Suggestions', tier: 'both',
    en: 'On bridge connection, ALSA scans your installed apps, common folders, and recent files. As you type, smart suggestions appear so commands auto-complete instantly.',
    hi: 'Bridge connect hote hi ALSA aapke installed apps, common folders aur recent files scan kar leti hai. Aap type karte ho aur smart suggestions auto-complete ho jaate hain.',
  },
  {
    icon: Shield, title: 'Secure & Local Only', tier: 'both',
    en: 'The bridge runs only on 127.0.0.1 (localhost). No external server can access it. All commands are tier-verified with a unique bridge token tied to your subscription.',
    hi: 'Bridge sirf 127.0.0.1 (localhost) par chalti hai — koi external server access nahi kar sakta. Har command tier-verified hoti hai unique bridge token ke saath, jo aapki subscription se linked hota hai.',
  },
];

export default function BridgeFeatures() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  useEffect(() => { document.title = 'ALSA AI PC Bridge — Features'; }, []);

  const tierBadge = (tier: Tier) => {
    if (tier === 'both') return <Badge variant="outline" className="border-primary/40">Pro + Elite</Badge>;
    if (tier === 'elite') return <Badge className="bg-gradient-to-r from-amber-500 to-rose-500">Elite Only</Badge>;
    return <Badge className="bg-primary">Pro</Badge>;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/30 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ALSA AI · PC Bridge Features
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'en'
                ? 'Everything your local PC bridge can do — turn ALSA into a full desktop assistant.'
                : 'Aapki local PC Bridge ke saare features — ALSA ko poora desktop assistant bana dein.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/bridge-setup"><Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Setup</Button></Link>
            <Link to="/Chat"><Button size="sm"><Zap className="w-4 h-4 mr-1" />Open Chat</Button></Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <Tabs value={lang} onValueChange={(v) => setLang(v as 'en' | 'hi')} className="mb-8">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="en">English</TabsTrigger>
            <TabsTrigger value="hi">Hinglish</TabsTrigger>
          </TabsList>
        </Tabs>

        <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              {lang === 'en' ? 'How it works' : 'Yeh kaise kaam karta hai'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground space-y-2">
            {lang === 'en' ? (
              <>
                <p>Download the bridge from <Link to="/bridge-setup" className="text-primary underline">Bridge Setup</Link>, run it once on your PC (Python required), and ALSA AI will automatically detect it. The bridge runs locally on <code>127.0.0.1:5001</code> and never exposes your data to the internet.</p>
                <p>Once connected, you can use natural language commands in chat — ALSA understands intent and routes the right action to your PC.</p>
              </>
            ) : (
              <>
                <p><Link to="/bridge-setup" className="text-primary underline">Bridge Setup</Link> page se bridge download karein, ek baar apne PC par run karein (Python chahiye), aur ALSA AI khud detect kar legi. Bridge sirf <code>127.0.0.1:5001</code> par locally chalti hai — aapka data internet par kabhi nahi jata.</p>
                <p>Connect hote hi chat mein natural language commands likhein — ALSA intent samajh kar correct action aapke PC par execute kar deti hai.</p>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Card key={i} className="border-border/60 hover:border-primary/40 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <span className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </span>
                      {f.title}
                    </CardTitle>
                    {tierBadge(f.tier)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {lang === 'en' ? f.en : f.hi}
                  </p>
                  {f.examples && f.examples.length > 0 && (
                    <div className="bg-secondary/40 rounded-md p-3 space-y-1">
                      <p className="text-xs font-semibold text-foreground/80">
                        {lang === 'en' ? 'Try saying:' : 'Aise bol kar try karein:'}
                      </p>
                      {f.examples.map((ex, j) => (
                        <code key={j} className="block text-xs text-primary font-mono">"{ex}"</code>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8 border-amber-500/30 bg-amber-500/5">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {lang === 'en'
              ? 'Tip: for full yt-dlp features (merging high-res video + audio, MP3 conversion, thumbnail embed) install ffmpeg on your PC and add it to PATH. yt-dlp itself is auto-installed by the bridge on first use.'
              : 'Tip: yt-dlp ke full features (high-res video + audio merge, MP3 conversion, thumbnail embed) ke liye apne PC par ffmpeg install karein aur PATH mein add karein. yt-dlp khud bridge pehli baar use hote hi auto-install ho jaata hai.'}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
