import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
<<<<<<< HEAD
import { 
  Zap, Shield, Cpu, Smartphone, Bot, Code, Check, ArrowRight, Star, Users, Globe,
  Play, Monitor, Terminal, FileText, Camera, Video, Database, Sparkles, Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import alsaLogo from '@/assets/alsa-logo.png';
import heroAiImage from '@/assets/hero-ai-interface.jpg';
import aiPcControl from '@/assets/ai-pc-control.jpg';
import voiceAiControl from '@/assets/voice-ai-control.jpg';
=======
import {
  Zap, Shield, Cpu, Smartphone, Bot, Code, Check, ArrowRight, Star, Users, Globe,
  Play, Monitor, Terminal, FileText, Database, Sparkles, Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import alsaLogo from '@/assets/alsa-logo.png';
import aiPcControl from '@/assets/ai-pc-control.jpg';
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
import { Helmet } from 'react-helmet';

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
<<<<<<< HEAD
=======
  const [countdown, setCountdown] = useState({ days: 7, hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const storedEndDate = localStorage.getItem('alsa_offer_end_date');
    let endDate: Date;
    if (storedEndDate) {
      endDate = new Date(storedEndDate);
    } else {
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);
      localStorage.setItem('alsa_offer_end_date', endDate.toISOString());
    }
    const updateCountdown = () => {
      const now = new Date();
      const diff = endDate.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000)
      });
    };
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
<<<<<<< HEAD
      
      // If logged in, redirect to chat
      if (session?.user) {
        navigate('/');
      }
=======
      if (session?.user) navigate('/Chat');
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
    };
    checkAuth();
  }, [navigate]);

  const features = [
    { icon: Bot, title: 'AI Conversation', desc: 'Natural language chat with emotional intelligence and context awareness', color: 'from-blue-500 to-cyan-500' },
    { icon: Cpu, title: 'PC Control', desc: 'Control your computer with voice commands - shutdown, restart, open apps', color: 'from-purple-500 to-pink-500' },
    { icon: Code, title: 'Full-Stack Coding', desc: 'Generate complete React, Node.js, Python projects instantly', color: 'from-emerald-500 to-teal-500' },
    { icon: Smartphone, title: 'Android Control', desc: 'Control your phone via ADB - install apps, take screenshots', color: 'from-orange-500 to-red-500' },
    { icon: Shield, title: 'Secure Bridge', desc: 'Encrypted local execution tunnel for safe PC automation', color: 'from-indigo-500 to-purple-500' },
    { icon: Zap, title: 'Real-time', desc: 'Instant responses and actions with streaming AI', color: 'from-yellow-500 to-orange-500' },
  ];

  const pricingPlans = [
<<<<<<< HEAD
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
      price: '₹720',
      originalPrice: '₹800',
      period: '/month',
      features: ['Full-Stack Coding', 'OS Shell Commands', 'Project Generation', 'Document Creation', 'Priority Support'],
      cta: 'Get Pro',
      highlight: true,
      gradient: 'from-blue-500 to-cyan-500',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      name: 'Alsa Elite',
      price: '₹1200',
      originalPrice: '₹1,500',
      period: '/month',
      features: ['Everything in Pro', 'ADB Android Control', 'Excel Automation', 'Database Management', '24/7 Support'],
      cta: 'Get Elite',
      highlight: false,
      gradient: 'from-purple-500 to-pink-500',
      icon: <Crown className="w-5 h-5" />,
    },
=======
    { name: '3-Day Trial', price: '₹1', period: '', features: ['Screenshots & Recording', 'HTML/CSS/JS Coding', 'Basic AI Chat', 'Limited Features'], cta: 'Start Trial', highlight: false, gradient: 'from-amber-500 to-orange-500', icon: <Zap className="w-5 h-5" /> },
    { name: 'Alsa Pro', price: '₹720', originalPrice: '₹800', period: '/month', features: ['Full-Stack Coding', 'OS Shell Commands', 'Project Generation', 'Document Creation', 'Priority Support'], cta: 'Get Pro', highlight: true, gradient: 'from-blue-500 to-cyan-500', icon: <Sparkles className="w-5 h-5" /> },
    { name: 'Alsa Elite', price: '₹1200', originalPrice: '₹1,500', period: '/month', features: ['Everything in Pro', 'ADB Android Control', 'Excel Automation', 'Database Management', '24/7 Support'], cta: 'Get Elite', highlight: false, gradient: 'from-purple-500 to-pink-500', icon: <Crown className="w-5 h-5" /> },
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
  ];

  if (loading) {
    return (
<<<<<<< HEAD
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full"></div>
          <img src={alsaLogo} alt="ALSA AI" className="w-24 h-24 rounded-2xl relative z-10 animate-pulse" />
        </div>
=======
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <img src={alsaLogo} alt="ALSA AI" className="w-20 h-20 animate-pulse rounded-2xl" />
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-x-hidden">
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
            "operatingSystem": "Windows, Web",
            "offers": {
              "@type": "Offer",
              "price": "1",
              "priceCurrency": "INR"
            }
          })}
        </script>
      </Helmet>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-lg opacity-50"></div>
              <img src={alsaLogo} alt="ALSA AI" className="w-11 h-11 rounded-xl relative z-10 ring-1 ring-white/10" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
                ALSA AI
              </span>
              <p className="text-[10px] text-white/40 font-medium -mt-0.5">AI Lifestyle & Smart Assistant</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Features</a>
            <a href="#demo" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Demo</a>
            <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Pricing</a>
            <a href="/contact" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-white/70 hover:text-white hover:bg-white/5">
              Login
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/25 font-semibold"
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
=======
    <div className="min-h-screen bg-[#0A1A2F] text-white overflow-x-hidden">
      <Helmet>
        <title>ALSA AI - Best AI Assistant for PC Automation, Voice Control & Coding</title>
      </Helmet>

      {/* Navigation - Responsive Fix */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1A2F]/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <img src={alsaLogo} alt="ALSA AI" className="w-9 h-9 md:w-11 md:h-11 rounded-xl" />
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-white/70 hover:text-white text-xs px-2 md:px-4">Login</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-[10px] md:text-sm px-3 py-1">Get Started</Button>
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
          </div>
        </div>
      </nav>

<<<<<<< HEAD
      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 relative">
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border border-blue-500/30 px-4 py-2 text-sm font-medium backdrop-blur-xl">
            <Zap className="w-4 h-4 mr-2 inline" />
            The First Agentic OS for Your PC & Android
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
              Your AI That Actually
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Gets Things Done
            </span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-12 leading-relaxed font-light">
            Automate software development, control hardware, and manage data with an AI that doesn't just talk—it <span className="text-white font-medium">acts</span>. 
            Built for developers, creators, and power users.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-lg px-10 py-7 shadow-2xl shadow-blue-500/30 font-bold rounded-2xl"
            >
              Start Free Trial for ₹1
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => {
                const demoSection = document.getElementById('demo');
                demoSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-2 border-purple-500/50 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 text-lg px-10 py-7 font-bold rounded-2xl backdrop-blur-xl bg-purple-500/10 shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
            >
              <Play className="mr-2 w-5 h-5 text-purple-400" />
              Watch Demo
            </Button>
          </div>
          
          <div className="flex items-center justify-center gap-10 text-white/50">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">10K+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="font-semibold">50+ Countries</span>
=======
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

      {/* Offer Banner - Timer & Mobile Fix */}
      <section id="demo" className="py-12 px-4">
        <div className="container mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 p-[1px] shadow-2xl">
            <div className="bg-[#0A1A2F] rounded-[23px] overflow-hidden p-6 md:p-12 flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="text-center lg:text-left flex-1">
                <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-300 px-4 py-2 rounded-full mb-6">
                  <span className="animate-pulse">🔥</span> <span className="font-bold text-xs uppercase">Limited Time Offer</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-4">25% OFF <br className="md:hidden" /><span className="text-white/70 text-xl md:text-3xl">All Premium Plans!</span></h2>
                <p className="text-white/60 mb-8 max-w-md">Get full access to AI-powered PC automation. <span className="text-orange-400 font-semibold">Offer expires soon!</span></p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-orange-500 hover:bg-orange-400 font-bold">Claim 25% Discount</Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/pricing')}
                    className="border-white/20 bg-white/5 text-white hover:bg-white hover:text-[#0A1A2F] transition-all duration-300 font-semibold"
                  >
                    Start ₹1 Trial
                  </Button>
                </div>
              </div>

              {/* Responsive Timer */}
              <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 w-full lg:w-auto">
                <p className="text-center text-white/40 text-xs uppercase mb-4 tracking-widest">Offer Ends In</p>
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  {[
                    { l: 'Days', v: countdown.days },
                    { l: 'Hrs', v: countdown.hours },
                    { l: 'Mins', v: countdown.minutes },
                    { l: 'Secs', v: countdown.seconds }
                  ].map((t, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="bg-gradient-to-br from-orange-500 to-red-600 w-12 h-12 md:w-16 md:h-16 rounded-xl flex items-center justify-center font-black text-xl md:text-2xl shadow-lg">{String(t.v).padStart(2, '0')}</div>
                      <span className="text-[8px] md:text-[10px] mt-2 text-white/50 font-bold uppercase">{t.l}</span>
                    </div>
                  ))}
                </div>
              </div>
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
            </div>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* Demo Video Section */}
      <section id="demo" className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Play className="w-4 h-4 mr-2 inline" /> See ALSA in Action
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Watch the Demo</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              See how ALSA AI automates your workflow in real-time
            </p>
          </div>
          
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
            <video 
              className="w-full aspect-video relative z-10"
              controls
              autoPlay
              muted
              loop
              playsInline
              poster="/videos/demo-video.mp4"
              preload="auto"
            >
              <source src="/videos/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
=======
      {/* Demo Video - Border Fix */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">See ALSA in Action</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Watch the Demo</h2>
          </div>
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border-4 border-white/5 shadow-2xl aspect-video bg-black">
            <video className="w-full h-full" controls muted loop playsInline>
              <source src="/videos/demo-video.mp4" type="video/mp4" />
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
            </video>
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">
              <Sparkles className="w-4 h-4 mr-2 inline" /> Powerful Capabilities
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-white/60 max-w-xl mx-auto text-lg">
              From AI chat to full PC automation, ALSA has you covered
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-slate-900/50 border-white/5 hover:border-white/10 transition-all duration-300 group hover:shadow-2xl hover:shadow-blue-500/5 backdrop-blur-xl">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-white/50 text-base leading-relaxed">{feature.desc}</CardDescription>
=======
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
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* Capabilities Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                <Terminal className="w-4 h-4 mr-2 inline" /> PC Bridge Features
              </Badge>
              <h2 className="text-4xl font-bold mb-6">
                Control Your PC
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Like Never Before</span>
              </h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                The ALSA PC Bridge connects your computer to our AI, enabling real automation and control through natural language commands.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Monitor, text: 'Take screenshots & record screen' },
                  { icon: Terminal, text: 'Execute OS shell commands' },
                  { icon: Code, text: 'Generate complete coding projects' },
                  { icon: FileText, text: 'Create PPT, Excel, databases' },
                  { icon: Smartphone, text: 'Control Android via ADB' },
                  { icon: Database, text: 'Database automation' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative rounded-3xl overflow-hidden border border-white/10">
                <img src={aiPcControl} alt="AI PC Control - Robot hand on keyboard" className="w-full h-auto" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-6">
                  <p className="text-sm font-mono text-green-400">$ alsa "create a react portfolio website"</p>
                  <p className="text-xs text-white/60 mt-1">✓ Project created at E:\Projects\portfolio</p>
                </div>
              </div>
=======
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
            <img src={aiPcControl} alt="Control" className="w-full h-auto" />
            <div className="absolute bottom-0 p-6 bg-gradient-to-t from-black to-transparent w-full">
              <p className="text-xs font-mono text-green-400">$ alsa "create a react portfolio"</p>
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Crown className="w-4 h-4 mr-2 inline" /> Simple Pricing
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-white/60 max-w-xl mx-auto text-lg">
              Start with a ₹1 trial and upgrade anytime
            </p>
          </div>
<<<<<<< HEAD
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card 
                key={i} 
=======

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card
                key={i}
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
                className={`relative bg-slate-900/50 border-white/5 backdrop-blur-xl overflow-hidden ${plan.highlight ? 'ring-2 ring-blue-500 scale-105 shadow-2xl shadow-blue-500/20' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                    MOST POPULAR
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center text-white mx-auto mb-4 shadow-lg`}>
                    {plan.icon}
                  </div>
                  <CardTitle className="text-white text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4">
                    {plan.originalPrice && (
                      <span className="text-lg text-white/40 line-through mr-2">{plan.originalPrice}</span>
                    )}
                    <span className="text-4xl font-black text-white">{plan.price}</span>
                    <span className="text-white/50 ml-1">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-3 text-white/80">
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center`}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>
<<<<<<< HEAD
                  <Button 
=======
                  <Button
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
                    className={`w-full py-6 font-bold text-base bg-gradient-to-r ${plan.gradient} hover:opacity-90 shadow-lg`}
                    onClick={() => navigate('/pricing')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
<<<<<<< HEAD
          
=======

>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
          {/* <p className="text-center text-white/40 mt-10">
            💡 Use promo code <span className="text-blue-400 font-mono font-bold">BISMILLAH</span> for 99% off or <span className="text-purple-400 font-mono font-bold">WELCOMEFROMALSAAI</span> for 80% off!
          </p> */}
        </div>
      </section>

      {/* Footer */}
<<<<<<< HEAD
      <footer className="py-16 px-6 border-t border-white/5 bg-slate-950/80">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src={alsaLogo} alt="ALSA AI" className="w-10 h-10 rounded-xl ring-1 ring-white/10" />
                <div>
                  <span className="font-bold text-lg">ALSA AI</span>
                  <p className="text-xs text-white/40">by Mohd Eisa</p>
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
            <p>© 2024 ALSA AI. All rights reserved. Created with ❤️ by Mohd Eisa.</p>
          </div>
        </div>
=======
      <footer className="py-16 px-4 border-t border-white/5 bg-black/40">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={alsaLogo} className="w-8 h-8 rounded-lg" />
              <span className="font-bold">ALSA AI</span>
            </div>
            <p className="text-[10px] md:text-xs text-white/40">AI Lifestyle & Smart Assistant by Alsa Tech Team</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Products</h4>
            <ul className="text-xs space-y-2 text-white/40">
              <li><a href='#features'>Features</a></li>
              <li><a href='#pricing'>Pricing</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Legal</h4>
            <ul className="text-xs space-y-2 text-white/40">
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/terms">Terms</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm">Social</h4>
            <ul className="text-xs space-y-2 text-white/40">
              <li><a href="https://www.instagram.com/alsa_ai_assistant/" target="_blank" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="https://x.com/AlsaAiAssistant" target="_blank" className="hover:text-white transition-colors">Twitter (X)</a></li>
              <li><a href="https://www.linkedin.com/in/mohd-eisa-bey-061ba43a2/" target="_blank" className="hover:text-white transition-colors">LinkedIn</a></li>
              <li><a href="https://www.reddit.com/r/join_alsa_ai/" target="_blank" className="hover:text-white transition-colors">Reddit</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center mt-12 text-[10px] text-white/20">© 2026 ALSA AI. All rights reserved.</div>
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
      </footer>
    </div>
  );
};

<<<<<<< HEAD
export default Landing;
=======
export default Landing;
>>>>>>> cecfda5aa40d83581041c88bc8c842f9bfe980e8
