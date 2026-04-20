import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon, Download, X, Sparkles, Lock, Paperclip, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImgMessage {
  role: 'user' | 'assistant';
  prompt?: string;
  imageUrl?: string; // resulting or attached image (data url)
  attachedImages?: string[]; // base64 data urls user attached
  text?: string;
  loading?: boolean;
}

const ASPECT_RATIOS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Square 1:1', value: '1:1' },
  { label: 'Landscape 16:9', value: '16:9' },
  { label: 'Portrait 9:16', value: '9:16' },
  { label: 'Standard 4:3', value: '4:3' },
  { label: 'Photo 3:4', value: '3:4' },
];

const ImageChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const sub = useSubscription();
  const [messages, setMessages] = useState<ImgMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [attached, setAttached] = useState<{ data: string; mimeType: string }[]>([]);
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allowed = sub.isPro || sub.isElite || sub.isTeam;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 4).forEach((f) => {
      if (!f.type.startsWith('image/')) {
        toast({ title: 'Sirf images allowed hain', variant: 'destructive' });
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: 'Image 10MB se chhoti honi chahiye', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttached((p) => [...p, { data: dataUrl, mimeType: f.type }]);
      };
      reader.readAsDataURL(f);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSend = async () => {
    if (!prompt.trim() && attached.length === 0) return;
    if (!allowed) {
      toast({
        title: 'Pro/Elite plan zaroori hai',
        description: 'Image generation sirf Pro aur Elite users ke liye hai.',
        variant: 'destructive',
      });
      return;
    }

    const userMsg: ImgMessage = {
      role: 'user',
      prompt: prompt.trim(),
      attachedImages: attached.map((a) => a.data),
    };
    const loadingMsg: ImgMessage = { role: 'assistant', loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);

    const sendingPrompt = prompt.trim() || 'Edit this image';
    const sendingImages = attached.map((a) => ({
      mimeType: a.mimeType,
      data: a.data.split(',')[1], // strip data: prefix
    }));
    setPrompt('');
    setAttached([]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('image-chat', {
        body: {
          prompt: sendingPrompt,
          inputImages: sendingImages,
          aspectRatio,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          imageUrl: data.imageUrl,
          text: data.text || '',
        };
        return copy;
      });
    } catch (e: any) {
      console.error('Image chat error:', e);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: 'assistant',
          text: `❌ Error: ${e.message || 'Image generate nahi ho payi'}`,
        };
        return copy;
      });
      toast({ title: 'Image generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (url: string, idx: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `alsa-image-${Date.now()}-${idx}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <div className={isMobile ? 'fixed inset-0 z-50' : ''}>
          <Sidebar
            bridgeConnected={false}
            onNewChat={() => setMessages([])}
            onOpenMemory={() => {}}
            currentConversationId={null}
          />
          {isMobile && (
            <button
              className="fixed top-4 right-4 z-50 p-2 bg-white/10 rounded-lg"
              onClick={() => setShowSidebar(false)}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur">
          <div className="flex items-center gap-2">
            {!showSidebar && (
              <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)}>
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Image Chat</h1>
              <p className="text-[10px] text-white/40">Powered by Gemini · Pro/Elite only</p>
            </div>
          </div>
          {!allowed && (
            <Button
              size="sm"
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
            >
              <Lock className="w-3 h-3 mr-1" /> Upgrade
            </Button>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollRef as any}>
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">AI Image Studio</h2>
                <p className="text-white/50 text-sm max-w-md mx-auto">
                  Likho jo banana hai — ya apni image upload karke edit karwao. Aspect ratio choose karo aur download karo.
                </p>
                {!allowed && (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs">
                    <Lock className="w-3 h-3" /> Pro ya Elite plan zaroori hai
                  </div>
                )}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl p-3 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  {m.attachedImages && m.attachedImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {m.attachedImages.map((src, idx) => (
                        <img key={idx} src={src} className="rounded-lg max-h-40 object-cover" />
                      ))}
                    </div>
                  )}
                  {m.prompt && <p className="text-sm whitespace-pre-wrap">{m.prompt}</p>}

                  {m.loading && (
                    <div className="flex items-center gap-2 text-white/60 text-sm py-2">
                      <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Generating image...
                    </div>
                  )}

                  {m.imageUrl && (
                    <div className="space-y-2">
                      <img
                        src={m.imageUrl}
                        alt="Generated"
                        className="rounded-xl w-full max-w-md border border-white/10"
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20"
                        onClick={() => downloadImage(m.imageUrl!, i)}
                      >
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
                    </div>
                  )}

                  {m.text && !m.loading && (
                    <p className="text-xs text-white/60 mt-2 whitespace-pre-wrap">{m.text}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-white/5 bg-[#0a0a0f] p-3">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Aspect ratio + attached previews */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs outline-none"
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-[#0a0a0f]">
                    {r.label}
                  </option>
                ))}
              </select>
              {attached.map((a, idx) => (
                <div key={idx} className="relative">
                  <img src={a.data} className="w-12 h-12 rounded-lg object-cover border border-white/10" />
                  <button
                    onClick={() => setAttached((p) => p.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-end gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAttach}
              />
              <Button
                variant="ghost"
                size="icon"
                className="text-white/60 hover:text-white flex-shrink-0"
                onClick={() => fileRef.current?.click()}
                title="Image attach karo (edit ke liye)"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={
                  allowed
                    ? 'Image describe karo... ya attach karke edit karwao'
                    : 'Pro/Elite plan zaroori hai'
                }
                disabled={!allowed || loading}
                rows={1}
                className="flex-1 bg-transparent border-0 resize-none outline-none text-sm placeholder:text-white/30 focus-visible:ring-0 min-h-0 max-h-32"
              />
              <Button
                onClick={handleSend}
                disabled={loading || !allowed || (!prompt.trim() && attached.length === 0)}
                size="icon"
                className="bg-gradient-to-br from-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-30 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-white/30 text-center">
              Image AI can make mistakes. Aspect ratio model hint hai, exact crop nahi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageChat;
