import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Phone, MessageCircle, Instagram, Twitter, Linkedin, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import alsaLogo from '@/assets/alsa-logo.png';

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate sending (in production, connect to backend)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    
    setName('');
    setEmail('');
    setMessage('');
    setSending(false);
  };

  const contactChannels = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'alsa.ai.assistant@gmail.com',
      href: 'mailto:alsa.ai.assistant@gmail.com',
      desc: 'We typically respond within 24 hours'
    },
    {
      icon: Phone,
      title: 'Customer Service',
      value: '+91 6396684144',
      href: 'tel:+916396684144',
      desc: 'Available Mon-Sat, 10 AM - 7 PM IST'
    },
    {
      icon: MessageCircle,
      title: 'Reddit Community',
      value: 'r/join_alsa_ai',
      href: 'https://www.reddit.com/r/join_alsa_ai/',
      desc: 'Join our community for discussions'
    }
  ];

  const socialLinks = [
    { icon: Instagram, name: 'Instagram', href: 'https://www.instagram.com/alsa_ai_assistant/', handle: '@alsa_ai_assistant' },
    { icon: Twitter, name: 'Twitter (X)', href: 'https://x.com/AlsaAiAssistant', handle: '@AlsaAiAssistant' },
    { icon: Linkedin, name: 'LinkedIn', href: 'https://www.linkedin.com/in/mohd-eisa-bey-061ba43a2/', handle: 'Mohd Eisa Bey' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/70">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <img src={alsaLogo} alt="ALSA AI" className="w-8 h-8 rounded-full" />
            <span className="font-bold">ALSA AI</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Have questions or need help? We're here for you. Reach out through any of our channels.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-white/5 border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Send us a Message</CardTitle>
              <CardDescription className="text-white/60">
                Fill out the form and we'll get back to you within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/80">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white/80">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help you?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={5}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            {contactChannels.map((channel, i) => (
              <Card key={i} className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
                <CardContent className="p-6">
                  <a href={channel.href} target="_blank" rel="noopener noreferrer" className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <channel.icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{channel.title}</h3>
                      <p className="text-blue-400 font-medium">{channel.value}</p>
                      <p className="text-white/40 text-sm mt-1">{channel.desc}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/30" />
                  </a>
                </CardContent>
              </Card>
            ))}

            {/* Social Links */}
            <Card className="bg-white/5 border-white/5">
              <CardHeader>
                <CardTitle className="text-white text-lg">Follow Us</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <social.icon className="w-5 h-5 text-blue-400" />
                    <span className="text-white/80">{social.name}</span>
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
