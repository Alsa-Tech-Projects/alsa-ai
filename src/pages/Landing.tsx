import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Shield, Cpu, Smartphone, Bot, Code, Check, PlayCircle, ArrowRight, Star, Users, Globe,
  Play, Monitor, Terminal, FileText, Database, Sparkles, Crown, Key, Gift, Mic, PhoneCall, Youtube, Settings2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet';

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) navigate('/Chat');
    };
    checkAuth();

    // Prefetch Chat & Auth bundles in background so navigation is instant
    const prefetch = () => {
      import('@/pages/Chat').catch(() => {});
      import('@/pages/Auth').catch(() => {});
    };
    const idle = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 800));
    idle(prefetch);
  }, [navigate]);

  const features = [
    { icon: Bot, title: 'AI Conversation', desc: 'Natural language chat with emotional intelligence and context awareness', color: 'from-blue-500 to-cyan-500' },
    { icon: Cpu, title: 'PC Control', desc: 'Control your computer with voice commands - shutdown, restart, open apps', color: 'from-purple-500 to-pink-500' },
    { icon: Code, title: 'Full-Stack Coding', desc: 'Generate complete React, Node.js, Python projects instantly', color: 'from-emerald-500 to-teal-500' },
    { icon: Smartphone, title: 'Android Control', desc: 'Control your phone via ADB - install apps, take screenshots', color: 'from-orange-500 to-red-500' },
    { icon: Shield, title: 'Secure Bridge', desc: 'Encrypted local execution tunnel for safe PC automation', color: 'from-indigo-500 to-purple-500' },
    { icon: Zap, title: 'Real-time', desc: 'Instant responses and actions with streaming AI', color: 'from-yellow-500 to-orange-500' },
  ];

  const v4Features = [
    { icon: Key,        title: 'Bring Your Own API Key',      desc: 'Add your Google Gemini key in Settings — every chat runs on your own quota.' },
    { icon: Gift,       title: 'First 50 Users → Pro FREE',   desc: 'Sign up now and get a full month of Alsa Pro absolutely free — no card, no catch.' },
    { icon: Bot,        title: 'Avatar Chat (Mira) Fixed',    desc: 'Talk face-to-face with Mira in real time. The JWT / edge-function bug is history.' },
    { icon: Smartphone, title: 'Phone Bridge for Android',    desc: 'Run phone-bridge.py in Termux and let Alsa control your own phone — Elite only.' },
    { icon: PhoneCall,  title: 'Call & WhatsApp by Name',     desc: 'Say "call Ravi" in any language — Alsa searches contacts.json and dials for you.' },
    { icon: Youtube,    title: 'yt-dlp with Smart Folders',   desc: 'Videos land in DCIM/Videos, audio in Music. MP3, 4K, subs & playlists supported.' },
    { icon: Settings2,  title: 'Custom AI Instructions',      desc: 'Tell Alsa exactly how to behave — tone, persona, rules. Applied to every reply.' },
    { icon: Mic,        title: 'Mic in Chat Input',           desc: 'Dedicated mic button inside the chat bar — dictate hands-free on mobile & desktop.' },
  ];

  const pricingPlans = [
    {
      name: '3-Day Trial',
      price: '₹1',
      period: '',
      features: ['Screenshots & Recording', 'HTML/CSS/JS Coding', 'Basic AI Chat', 'Limited Features'],
      cta: 'Start Trial',
      highlight: false,
      gradient: 'from-amber-500 to-orange-500',
      icon: <Zap className="w-5 h-5" />,
    },
    {
      name: 'Alsa Pro',
      price: '₹299',
      originalPrice: '₹799',
      period: '/month',
      features: ['Full-Stack Coding', 'OS Shell Commands', 'Project Generation', 'Document Creation', 'Priority Support'],
      cta: 'Get Pro',
      highlight: true,
      gradient: 'from-blue-500 to-cyan-500',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      name: 'Alsa Elite',
      price: '₹499',
      originalPrice: '₹1299',
      period: '/month',
      features: ['Everything in Pro', 'Massage Automation', 'ADB Android Control', 'Excel Automation', 'Database Management', '24/7 Support'],
      cta: 'Get Elite',
      highlight: false,
      gradient: 'from-purple-500 to-pink-500',
      icon: <Crown className="w-5 h-5" />,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full"></div>
          <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/alsa-logo.png" alt="ALSA AI" className="w-24 h-24 rounded-2xl relative z-10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white overflow-x-hidden">
      <Helmet>
        <title>ALSA AI - Best AI Assistant for PC Automation, Voice Control & Coding | India</title>
        <meta name="description" content="ALSA AI is India's #1 AI assistant for PC automation, voice commands, full-stack coding, Android control via ADB. Automate your workflow with advanced artificial intelligence. Try free!" />
        <meta name="keywords" content="AI assistant, PC automation, voice control AI, AI coding assistant, Android ADB control, artificial intelligence, machine learning, chatbot, virtual assistant, productivity AI, ALSA AI, best AI India, AI for developers, smart assistant, automation software, voice commands, natural language processing, AI technology" />
        <meta property="og:title" content="ALSA AI - AI Assistant for PC Automation & Coding" />
        <meta property="og:description" content="Automate PC tasks, generate code, control Android devices with India's best AI assistant." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.alsa-ai.in/" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ALSA AI",
            "description": "AI-powered PC automation, voice control, and coding assistant",
            "applicationCategory": "Productivity",
            "operatingSystem": "Windows, Android, Web",
            "offers": {
              "@type": "Offer",
              "price": "1",
              "priceCurrency": "INR"
            },
            "featureList": [
              ...features.map(f => f.title),
              ...v4Features.map(f => f.title),
            ].join(", ")
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Alsa AI 4.0 — New Features",
            "itemListElement": v4Features.map((f, i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "name": f.title,
              "description": f.desc,
            }))
          })}
        </script>
      </Helmet>

      {/* Navigation - Responsive Fix */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1A2F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/alsa-logo.png" alt="ALSA AI" className="w-9 h-9 md:w-11 md:h-11 rounded-xl" />
            <div className="flex flex-col">
              <span className="font-black text-base md:text-xl tracking-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent leading-tight">ALSA AI</span>
              <p className="hidden xs:block text-[8px] md:text-[10px] text-white/40 font-medium tracking-wide">AI Lifestyle & Smart Assistant</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <a href="#features" className="text-xs font-medium text-white/60 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="text-xs font-medium text-white/60 hover:text-white transition-colors">Demo</a>
            <a href="#pricing" className="text-xs font-medium text-white/60 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-white/70 hover:bg-white hover:text-black text-xs px-2 md:px-4">Login</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-[10px] md:text-sm px-3 py-1">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero - Text Fix */}
      <section className="pt-28 md:pt-40 pb-20 px-4 text-center">
        <div className="container mx-auto">
          <Badge className="mb-6 bg-blue-600/10 text-blue-300 border-blue-500/20 px-4 py-1.5 text-[10px] md:text-sm">
            <Zap className="w-3 h-3 md:w-4 md:h-4 mr-2 inline" /> The First Agentic OS for Your PC & Android
          </Badge>
          <h1 className="text-4xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight px-2">
            Your AI That Actually <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Gets Things Done</span>
          </h1>
          <p className="text-base md:text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed font-light px-4">
            Automate software development, control hardware, and manage data with an AI that doesn't just talk—it <span className="text-white font-medium">acts</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4 mb-12">
            <Button size="lg" onClick={() => navigate('/auth')} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-7 rounded-2xl text-lg font-bold">
              Start Free Trial for ₹1 <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })} className="w-full sm:w-auto border-purple-500/30 bg-purple-500/5 px-8 py-7 rounded-2xl text-lg font-bold">
              <Play className="mr-2 w-5 h-5" /> Watch Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/50 text-xs md:text-base">
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /> <span className="font-semibold">10K+ Users</span></div>
            <div className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> <span className="font-semibold">4.9/5 Rating</span></div>
            <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> <span className="font-semibold">50+ Countries</span></div>
          </div>
        </div>
      </section>

      {/* Demo Video - Ultra Professional Version */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Background Ambient Glow (Sirf look ke liye) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse">
              Live Demo
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 italic">
              Watch Alsa Ai <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">With Act</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto text-sm md:text-base">
              Experience the seamless integration of ALSA AI with your desktop environment.
            </p>
          </div>

          {/* The Video Mockup Frame */}
          <div className="relative group mx-auto max-w-4xl">
            {/* Outer Border Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] md:rounded-[3rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>

            {/* Main Container */}
            <div className="relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden bg-[#0D1F35] border border-white/10 shadow-2xl">

              {/* Browser/Window Header (Ye isko professional dikhayega) */}
              <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-white/5 bg-white/5">
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#FF5F56] shadow-inner shadow-black/20"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#FFBD2E] shadow-inner shadow-black/20"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27C93F] shadow-inner shadow-black/20"></div>
                </div>
                <div className="px-3 md:px-6 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] text-white/20 font-mono">
                  Alsa AI 
                </div>
                <div className="w-10"></div> {/* Spacer for balance */}
              </div>

              {/* Video Wrapper */}
              <div className="relative aspect-video bg-black/40 group-hover:bg-black/20 transition-colors">
                <video
                  className="w-full h-full object-cover md:object-contain"
                  controls
                  playsInline
                  poster="/videos/thumbnail.png"
                >
                  {/* <source src="/videos/demo-video.mp4" type="video/mp4" /> */}
                                    <source src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/videos/demo-video.mp4" type="video/mp4" />


                </video>

                {/* Glass Overlay Shine */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent opacity-50"></div>
              </div>
            </div>
            {/* Decoration: Subtle Floating Badge */}
            <div className="absolute -bottom-6 -right-6 hidden md:flex bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl items-center gap-2 animate-bounce">
              <PlayCircle className="w-5 h-5" /> ALSA AI ACTIVE
            </div>
          </div>
        </div>
      </section>

      {/* Features - Full Content Restored */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-white/60">From AI chat to full PC automation</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="bg-white/5 border-white/5 hover:border-white/20 transition-all backdrop-blur-sm">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}><f.icon className="w-6 h-6 text-white" /></div>
                  <CardTitle className="text-white">{f.title}</CardTitle>
                  <CardDescription className="text-white/50">{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Section - Full Content Restored */}
      <section className="py-20 px-4 bg-blue-900/10">
        <div className="container mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-6 bg-emerald-500/20 text-emerald-300">PC Bridge Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Control Your PC <span className="text-blue-400">Like Never Before</span></h2>
            <div className="grid gap-4">
              {[
                { i: Monitor, t: 'Take screenshots & record screen' },
                { i: Terminal, t: 'Execute OS shell commands' },
                { i: Code, t: 'Generate complete coding projects' },
                { i: Smartphone, t: 'Control Android via ADB' },
                { i: Database, t: 'Database automation' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <item.i className="w-5 h-5 text-blue-400" /> <span className="text-sm md:text-base">{item.t}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/ai-pc-control.jpg" alt="Control" className="w-full h-auto" />
            <div className="absolute bottom-0 p-6 bg-gradient-to-t from-black to-transparent w-full">
              <p className="text-xs font-mono text-green-400">$ alsa "create a react portfolio"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Full Content Restored */}
      {/* What's New in 4.0 */}
      <section id="whats-new" className="py-20 px-4 bg-gradient-to-b from-transparent via-blue-900/10 to-transparent">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-blue-500/10 text-blue-300 border-blue-500/20 px-4 py-1.5">
              <Sparkles className="w-4 h-4 mr-2 inline" /> Version 4.0 · Just Shipped
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              What's New in <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Alsa AI 4.0</span>
            </h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              The biggest update yet — BYOK, Phone Bridge, contact-name calling, mic in chat, and 50 free Pro accounts for early users.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {v4Features.map((f, i) => (
              <Card key={i} className="bg-white/5 border-white/10 hover:border-blue-500/40 transition-all backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-3">
                    <f.icon className="w-5 h-5 text-blue-300" />
                  </div>
                  <CardTitle className="text-white text-base">{f.title}</CardTitle>
                  <CardDescription className="text-white/50 text-xs leading-relaxed">{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button onClick={() => navigate('/update-history')} variant="outline" className="border-white/20 hover:bg-white/10">
              Read Update History <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">Choose Your Plan</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card key={i} className={`bg-white/5 border-white/5 relative ${plan.highlight ? 'ring-2 ring-blue-500 md:scale-105' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4 flex flex-col">
                    {plan.originalPrice && <span className="text-sm text-white/30 line-through">{plan.originalPrice}</span>}
                    <span className="text-4xl font-white">{plan.price}<span className="text-sm text-white/40">{plan.period}</span></span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="text-left space-y-4 mb-8 text-sm text-white/60">
                    {plan.features.map((feat, idx) => <li key={idx} className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> {feat}</li>)}
                  </ul>
                  <Button className={`w-full py-6 bg-gradient-to-r ${plan.gradient} font-bold`}>{plan.cta}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer className="py-16 px-6 border-t border-white/5 bg-slate-950/80">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="https://tyivfgrzftbpzeuypeyf.supabase.co/storage/v1/object/public/photos/alsa-logo.png" alt="ALSA AI" className="w-10 h-10 rounded-xl ring-1 ring-white/10" />
                <div>
                  <span className="font-bold text-lg">ALSA AI</span>
                  <p className="text-xs text-white/40">by Mohd Eisa Bey · A product of Zentryx Tech Solutions</p>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed">
                AI Lifestyle & Smart Assistant - Your intelligent companion for PC automation and productivity.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Product</h4>
              <ul className="space-y-3 text-white/50 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Get Started</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Support</h4>
              <ul className="space-y-3 text-white/50 text-sm">
                <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-white">Connect</h4>
              <ul className="space-y-3 text-white/50 text-sm">
                <li><a href="https://www.instagram.com/alsa_ai_assistant/" target="_blank" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://x.com/AlsaAiAssistant" target="_blank" className="hover:text-white transition-colors">Twitter (X)</a></li>
                <li><a href="https://www.linkedin.com/in/mohd-eisa-bey-061ba43a2/" target="_blank" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="https://www.reddit.com/r/join_alsa_ai/" target="_blank" className="hover:text-white transition-colors">Reddit</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-white/5 text-center text-white/40 text-sm">
            <p>© {new Date().getFullYear()} ALSA AI · A Zentryx Tech Solutions product. Founded & built with ❤️ by Mohd Eisa Bey.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
