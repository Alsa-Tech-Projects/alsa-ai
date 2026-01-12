import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, Cpu, Smartphone, Bot, Code, Check, ArrowRight, Star, Users, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import alsaLogo from '@/assets/alsa-logo.png';

const Landing = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If logged in, redirect to chat
      if (session?.user) {
        navigate('/');
      }
    };
    checkAuth();
  }, [navigate]);

  const features = [
    { icon: Bot, title: 'AI Conversation', desc: 'Natural language chat with emotional intelligence' },
    { icon: Cpu, title: 'PC Control', desc: 'Control your computer with voice commands' },
    { icon: Code, title: 'Full-Stack Coding', desc: 'Generate complete projects instantly' },
    { icon: Smartphone, title: 'Android Control', desc: 'Control your phone via ADB' },
    { icon: Shield, title: 'Secure Bridge', desc: 'Encrypted local execution tunnel' },
    { icon: Zap, title: 'Real-time', desc: 'Instant responses and actions' },
  ];

  const pricingPlans = [
    {
      name: 'Free Trial',
      price: '₹0',
      period: '3 Days',
      features: ['Basic AI Chat', 'File Reading', 'Web Search', 'Standard Support'],
      cta: 'Start Free Trial',
      highlight: false,
    },
    {
      name: 'Alsa Pro',
      price: '₹699',
      period: '/month',
      features: ['Full-Stack Coding', 'OS Shell Commands', 'Project Generation', 'Document Creation', 'Priority Support'],
      cta: 'Get Pro',
      highlight: true,
    },
    {
      name: 'Alsa Elite',
      price: '₹1,200',
      period: '/month',
      features: ['Everything in Pro', 'ADB Android Control', 'Excel Automation', 'Database Management', 'Dedicated Support'],
      cta: 'Get Elite',
      highlight: false,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-pulse">
          <img src={alsaLogo} alt="ALSA AI" className="w-24 h-24 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={alsaLogo} alt="ALSA AI" className="w-10 h-10 rounded-full" />
            <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              ALSA AI
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/60 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-white/60 hover:text-white transition-colors">Pricing</a>
            <a href="/contact" className="text-white/60 hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')} className="text-white/70 hover:text-white">
              Login
            </Button>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20">
            🚀 The First Agentic OS for Your PC & Android
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
              Your AI That Actually
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Gets Things Done
            </span>
          </h1>
          
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Automate software development, control hardware, and manage data with an AI that doesn't just talk—it acts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-lg px-8 py-6"
            >
              Start Your 3-Day Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/auth')}
              className="border-white/10 text-white hover:bg-white/5 text-lg px-8 py-6"
            >
              Watch Demo
            </Button>
          </div>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-white/40">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>10K+ Users</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span>50+ Countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Everything you need to automate your digital life
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-white/60">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-gradient-to-b from-transparent to-blue-950/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <Card 
                key={i} 
                className={`relative bg-white/5 border-white/5 ${plan.highlight ? 'ring-2 ring-blue-500 scale-105' : ''}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/60">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-white/80">
                        <Check className="w-5 h-5 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.highlight 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500' 
                      : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={alsaLogo} alt="ALSA AI" className="w-8 h-8 rounded-full" />
                <span className="font-bold text-lg">ALSA AI</span>
              </div>
              <p className="text-white/40 text-sm">
                AI Lifestyle & Smart Assistant - Your intelligent companion for PC automation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="/auth" className="hover:text-white transition-colors">Get Started</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-white/40 text-sm">
                <li><a href="https://www.instagram.com/alsa_ai_assistant/" target="_blank" className="hover:text-white transition-colors">Instagram</a></li>
                <li><a href="https://x.com/AlsaAiAssistant" target="_blank" className="hover:text-white transition-colors">Twitter (X)</a></li>
                <li><a href="https://www.linkedin.com/in/mohd-eisa-bey-061ba43a2/" target="_blank" className="hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 text-center text-white/40 text-sm">
            <p>© 2024 ALSA AI. All rights reserved. Created by Mohd Eisa.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
