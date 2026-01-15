import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, MessageCircle, Instagram, Twitter, Linkedin, ExternalLink, Send, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import alsaLogo from '@/assets/alsa-logo.png';
import { Helmet } from 'react-helmet';

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    try {
      // Store message in database for admin to see
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name,
          email,
          subject,
          message,
          is_read: false
        });

      if (error) {
        throw error;
      }
      
      toast({
        title: "Message Sent! 📨",
        description: "We'll get back to you within 24 hours.",
      });
      
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const contactChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'alsa.ai.assistant@gmail.com',
      href: 'mailto:alsa.ai.assistant@gmail.com',
      desc: 'We typically respond within 24 hours',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Phone,
      title: 'Customer Service',
      value: '+91 6396684144',
      href: 'tel:+916396684144',
      desc: 'Available Mon-Sat, 10 AM - 7 PM IST',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: MessageCircle,
      title: 'Reddit Community',
      value: 'r/join_alsa_ai',
      href: 'https://www.reddit.com/r/join_alsa_ai/',
      desc: 'Join our community for discussions',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const socialLinks = [
    { icon: Instagram, name: 'Instagram', href: 'https://www.instagram.com/alsa_ai_assistant/', handle: '@alsa_ai_assistant', color: 'from-pink-500 to-purple-500' },
    { icon: Twitter, name: 'Twitter (X)', href: 'https://x.com/AlsaAiAssistant', handle: '@AlsaAiAssistant', color: 'from-blue-400 to-blue-600' },
    { icon: Linkedin, name: 'LinkedIn', href: 'https://www.linkedin.com/in/mohd-eisa-bey-061ba43a2/', handle: 'Mohd Eisa Bey', color: 'from-blue-600 to-blue-800' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Helmet>
        <title>Contact ALSA AI - AI Assistant Support | Get Help & Feedback</title>
        <meta name="description" content="Contact ALSA AI for support, feedback, or inquiries. Reach us via email, phone, or social media. 24-hour response time for AI assistant, PC automation, and voice control questions." />
        <meta name="keywords" content="ALSA AI contact, AI assistant support, PC automation help, voice control support, AI chatbot help, customer service, feedback, AI technology support" />
        <meta property="og:title" content="Contact ALSA AI - AI Assistant Support" />
        <meta property="og:description" content="Get in touch with ALSA AI team for support, feedback, or partnership inquiries." />
        <link rel="canonical" href="https://alsa-ai.lovable.app/contact" />
      </Helmet>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/5 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <img src={alsaLogo} alt="ALSA AI" className="w-10 h-10 rounded-xl ring-1 ring-white/10" />
            <div>
              <span className="font-bold text-lg">Contact Us</span>
              <p className="text-xs text-white/40">We're here to help</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16 max-w-6xl relative z-10">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            Get in Touch
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">We'd Love to Hear From You</h1>
          <p className="text-white/60 max-w-xl mx-auto text-lg">
            Have questions about AI automation, PC control, or need support? Reach out through any channel below.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Contact Form */}
          <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-400" />
                Send us a Message
              </CardTitle>
              <CardDescription className="text-white/50">
                Fill out the form and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/80 font-medium">Name</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="bg-black/30 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/80 font-medium">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-black/30 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 h-12"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-white/80 font-medium">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    className="bg-black/30 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white/80 font-medium">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="bg-black/30 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 resize-none"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 h-12 text-base font-semibold"
                >
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Message
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            {contactChannels.map((channel, i) => (
              <Card key={i} className="bg-slate-900/50 border-white/10 backdrop-blur-xl hover:border-white/20 transition-all group">
                <CardContent className="p-6">
                  <a href={channel.href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-5">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${channel.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                      <channel.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">{channel.title}</h3>
                      <p className="text-blue-400 font-semibold text-base">{channel.value}</p>
                      <p className="text-white/40 text-sm mt-1">{channel.desc}</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                  </a>
                </CardContent>
              </Card>
            ))}

            {/* Social Links */}
            <Card className="bg-slate-900/50 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${social.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <social.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white font-medium">{social.name}</span>
                    <span className="text-white/40 text-sm ml-auto">{social.handle}</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
