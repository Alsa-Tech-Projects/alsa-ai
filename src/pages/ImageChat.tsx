import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Image as ImageIcon, Download, X, Sparkles, Lock, Paperclip, Menu, Trash2, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import Sidebar from '@/components/Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImgMessage {
  id?: string;
  role: 'user' | 'assistant';
  prompt?: string;
  imageUrl?: string;
  attachedImages?: string[];
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
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allowed = sub.isPro || sub.isElite || sub.isTeam;

  // Load history on mount
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await (supabase as any)
        .from('image_chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) { console.error(error); return; }
      if (data) {
        setMessages(data.map((r: any) => ({
          id: r.id,
          role: r.role,
          prompt: r.prompt || undefined,
          imageUrl: r.image_url || undefined,
          attachedImages: r.attached_images || [],
          text: r.text || undefined,
        })));
      }

      // Load today's usage
      const today = new Date().toISOString().slice(0, 10);
      const { data: u } = await (supabase as any)
        .from('image_chat_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();
      const limit = sub.isTeam ? 9999 : sub.isElite ? 7 : sub.isPro ? 3 : 0;
      setUsage({ used: u?.count ?? 0, limit });
    };
    if (allowed) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, sub.isElite, sub.isPro, sub.isTeam]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 4).forEach((f) => {
      if (!f.type.startsWith('image/')) {
        toast({ title: 'Only images are allowed', variant: 'destructive' });
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: 'Image must be smaller than 10MB', variant: 'destructive' });
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

  const saveMessage = async (msg: ImgMessage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from('image_chat_messages')
        .insert({
          user_id: user.id,
          role: msg.role,
          prompt: msg.prompt || null,
          image_url: msg.imageUrl || null,
          attached_images: msg.attachedImages || [],
          text: msg.text || null,
          aspect_ratio: aspectRatio,
        })
        .select('id')
        .single();
      if (error) { console.error('save msg error:', error); return null; }
      return data?.id as string;
    } catch (e) { console.error(e); return null; }
  };

  const handleSend = async () => {
    if (!prompt.trim() && attached.length === 0) return;
    if (!allowed) {
      toast({
        title: 'Pro or Elite plan required',
        description: 'Image generation is available only for Pro and Elite users.',
        variant: 'destructive',
      });
      return;
    }
    if (usage && usage.used >= usage.limit) {
      toast({
        title: 'Daily limit reached',
        description: `${usage.limit} images/day used. Try tomorrow or upgrade.`,
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

    // Persist user msg
    saveMessage(userMsg);

    const sendingPrompt = prompt.trim() || 'Edit this image';
    const sendingImages = attached.map((a) => ({
      mimeType: a.mimeType,
      data: a.data.split(',')[1],
    }));
    setPrompt('');
    setAttached([]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('image-chat', {
        body: { prompt: sendingPrompt, inputImages: sendingImages, aspectRatio },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const assistantMsg: ImgMessage = {
        role: 'assistant',
        imageUrl: data.imageUrl,
        text: data.text || '',
      };

      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = assistantMsg;
        return copy;
      });

      // Persist assistant msg
      saveMessage(assistantMsg);

      if (typeof data.used === 'number' && typeof data.limit === 'number') {
        setUsage({ used: data.used, limit: data.limit });
      }
    } catch (e: any) {
      console.error('Image chat error:', e);
      const errText = e?.message || 'Could not generate image';
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'assistant', text: `❌ Error: ${errText}` };
        return copy;
      });
      toast({ title: 'Image generation failed', description: errText, variant: 'destructive' });
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

  const clearHistory = async () => {
    if (!confirm('Saari image chat history delete kar dein?')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('image_chat_messages').delete().eq('user_id', user.id);
    setMessages([]);
    toast({ title: 'History cleared' });
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f] text-white overflow-hidden">
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
              <p className="text-[10px] text-white/40">
                {allowed && usage
                  ? `${usage.used}/${usage.limit === 9999 ? '∞' : usage.limit} today · ${sub.isElite || sub.isTeam ? 'Elite' : 'Pro'}`
                  : 'Powered by Alsa AI · Pro/Elite only'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearHistory} title="Clear history">
                <Trash2 className="w-4 h-4 text-white/60" />
              </Button>
            )}
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
                  Describe what you want to create — or upload your own image to edit it. Choose an aspect ratio and download the result.
                </p>
                {!allowed && (
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs">
                    <Lock className="w-3 h-3" /> Pro or Elite plan required
                  </div>
                )}
              </div>
            )}

            {messages.map((m, i) => (
              <div key={m.id || i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                        <img
                          key={idx}
                          src={src}
                          onClick={() => setPreviewImg(src)}
                          className="rounded-lg max-h-40 object-cover cursor-zoom-in hover:opacity-90 transition"
                        />
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
                      <div className="relative group">
                        <img
                          src={m.imageUrl}
                          alt="Generated"
                          onClick={() => setPreviewImg(m.imageUrl!)}
                          className="rounded-xl w-full max-w-md border border-white/10 cursor-zoom-in hover:opacity-95 transition"
                        />
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                          <ZoomIn className="w-3 h-3" />
                        </div>
                      </div>
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
                title="Attach an image (for editing)"
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
                    ? 'Describe an image... or attach one to edit'
                    : 'Pro or Elite plan required'
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
              {allowed && usage
                ? `Daily limit: ${usage.used}/${usage.limit === 9999 ? '∞' : usage.limit}. Image AI can make mistakes.`
                : 'Image AI can make mistakes. Aspect ratio is a model hint, not an exact crop.'}
            </p>
          </div>
        </div>
      </div>

      {/* Image Preview Wizard */}
      <Dialog open={!!previewImg} onOpenChange={(o) => !o && setPreviewImg(null)}>
        <DialogContent className="max-w-4xl bg-[#0a0a0f] border-white/10 p-0 overflow-hidden">
          {previewImg && (
            <div className="flex flex-col">
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Image Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-white/10 hover:bg-white/20"
                    onClick={() => downloadImage(previewImg, 0)}
                  >
                    <Download className="w-3 h-3 mr-1" /> Download
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setPreviewImg(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center bg-black/40 p-4 max-h-[80vh] overflow-auto">
                <img
                  src={previewImg}
                  alt="Preview"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageChat;
