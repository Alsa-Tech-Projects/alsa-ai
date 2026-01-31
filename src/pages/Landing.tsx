import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Shield, Cpu, Smartphone, Bot, Code, Check, ArrowRight, Star, Users, Globe,
  Play, Monitor, Terminal, FileText, Database, Sparkles, Crown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import alsaLogo from '@/assets/alsa-logo.png';
import aiPcControl from '@/assets/ai-pc-control.jpg';
import { Helmet } from 'react-helmet';

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) navigate('/Chat');
    };
    checkAuth();
  }, [navigate]);

  const features = [
    { icon: Bot, title: 'AI Conversation', desc: 'Natural language chat with emotional intelligence', color: 'from-blue-500 to-cyan-500' },
    { icon: Cpu, title: 'PC Control', desc: 'Control your computer with voice commands', color: 'from-purple-500 to-pink-500' },
    { icon: Code, title: 'Full-Stack Coding', desc: 'Generate complete projects instantly', color: 'from-emerald-500 to-teal-500' },
    { icon: Smartphone, title: 'Android Control', desc: 'Control your phone via ADB effortlessly', color: 'from-orange-500 to-red-500' },
    { icon: Shield, title: 'Secure Bridge', desc: 'Encrypted local execution tunnel', color: 'from-indigo-500 to-purple-500' },
    { icon: Zap, title: 'Real-time', desc: 'Instant responses with streaming AI', color: 'from-yellow-500 to-orange-500' },
  ];

  const pricingPlans = [
    { name: '3-Day Trial', price: '₹1', features: ['Basic AI Chat', 'HTML/CSS Coding'], cta: 'Start Trial', gradient: 'from-amber-500 to-orange-500', icon: <Zap className="w-5 h-5" /> },
    { name: 'Alsa Pro', price: '₹720', originalPrice: '₹800', features: ['Full-Stack Coding', 'OS Commands'], highlight: true, gradient: 'from-blue-500 to-cyan-500', icon: <Sparkles className="w-5 h-5" /> },
    { name: 'Alsa Elite', price: '₹1200', originalPrice: '₹1,500', features: ['ADB Control', 'Database Management'], gradient: 'from-purple-500 to-pink-500', icon: <Crown className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1A2F] flex items-center justify-center">
        <img src={alsaLogo} alt="ALSA AI" className="w-20 h-20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A1A2F] text-white overflow-x-hidden font-sans">
      <Helmet>
        <title>ALSA AI - Best AI Assistant for PC Automation</title>
      </Helmet>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A1A2F]/80 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={alsaLogo} alt="ALSA AI" className="w-8 h-8 md:w-10 md:h-10 rounded-lg" />
            <div className="flex flex-col">
              <span className="font-bold text-lg md:text-xl tracking-tight leading-none">ALSA AI</span>
              <span className="text-[8px] md:text-[10px] text-white/40 uppercase tracking-widest">Smart Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-white/70 text-xs md:text-sm">Login</Button>
            <Button size="sm" onClick={() => navigate('/auth')} className="bg-blue-600 hover:bg-blue-500 text-xs md:text-sm px-3 md:px-5">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 md:pt-40 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-[10px] md:text-xs">
            #1 AGENTIC OS FOR PC & ANDROID
          </Badge>
          <h1 className="text-4xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight">
            Your AI That Actually <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Gets Things Done
            </span>
          </h1>
          <p className="text-base md:text-xl text-white/60 max-w-2xl mx-auto mb-10 font-light px-4">
            Automate PC tasks, control hardware, and code projects with an AI that acts. Built for power users.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 rounded-xl px-8 py-6 text-lg font-bold">
              Start Trial for ₹1 <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto border-white/10 bg-white/5 rounded-xl px-8 py-6 text-lg">
              <Play className="mr-2 w-4 h-4 fill-current" /> Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Offer Banner (Timer Fix) */}
      <section className="py-8 px-4">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-pink-700 p-[1px]">
            <div className="bg-[#0D1F35] rounded-[23px] p-6 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <span className="inline-block bg-orange-500/20 text-orange-400 text-xs font-bold px-3 py-1 rounded-full mb-4">LIMITED OFFER</span>
                <h2 className="text-3xl md:text-5xl font-black mb-2 italic">25% OFF ALL PLANS</h2>
                <p className="text-white/60">Unlock full PC automation today.</p>
              </div>
              
              {/* Responsive Timer Boxes */}
              <div className="flex items-center gap-2 md:gap-4">
                {[
                  { label: 'Days', val: countdown.days },
                  { label: 'Hrs', val: countdown.hours },
                  { label: 'Min', val: countdown.minutes },
                  { label: 'Sec', val: countdown.seconds }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="bg-white/5 border border-white/10 rounded-xl w-14 h-14 md:w-20 md:h-20 flex items-center justify-center">
                      <span className="text-xl md:text-3xl font-black">{String(item.val).padStart(2, '0')}</span>
                    </div>
                    <span className="text-[10px] md:text-xs mt-2 uppercase text-white/40 tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Section (Border Fix) */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-2xl font-bold mb-8">See ALSA in Action</h3>
          <div className="relative rounded-2xl md:rounded-[2rem] p-1 bg-gradient-to-b from-white/10 to-transparent shadow-2xl">
            <div className="rounded-[1.5rem] md:rounded-[1.8rem] overflow-hidden bg-black aspect-video">
              <video className="w-full h-full object-cover" controls playsInline poster="/placeholder-poster.jpg">
                <source src="/videos/demo-video.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto grid md:grid-cols-3 gap-6 max-w-6xl">
          {pricingPlans.map((plan, i) => (
            <Card key={i} className={`bg-white/5 border-white/5 backdrop-blur-sm ${plan.highlight ? 'ring-2 ring-blue-500 scale-100 md:scale-105' : ''}`}>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-black mt-2">{plan.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 text-sm text-white/60">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-blue-400" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full bg-gradient-to-r ${plan.gradient}`}>Get Started</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="py-10 border-t border-white/5 text-center text-white/20 text-xs">
        © 2026 ALSA AI. Created by Mohd Eisa
      </footer>
    </div>
  );
};

export default Landing;