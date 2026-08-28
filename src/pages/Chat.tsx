// Fix Telegram Fetching Issues
import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, Settings, Plus, ImageIcon, Paperclip, Menu, X, Video, Camera, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import {
  checkBridgeConnection,
  executeSystemCommand,
  scanSystem,
  SystemScanResult,
  startScreenRecording,
  stopScreenRecording,
  parseNaturalLanguage,
  WEBSITES,
  createProject,
  createPowerPoint,
  createExcel,
  createDatabase,
  executePythonFile,
  executeCmdCommand,
  runCommand,
  checkInstallation,
  sendCommand,
  adbConnect,
  adbCommand,
  closeWindow,
  openFolder,
  runProject,
  createFolder,
  createTextFile,
  openWebsiteWithSearch,
  openCustomApp,
  sendTelegramMsg,
  sendWhatsAppMsg
} from '@/utils/pcBridge';
import {
  checkPhoneBridgeConnection,
  parsePhoneCommand,
  executePhoneCommand
} from '@/utils/phoneBridge';
import ChatMessage from '@/components/ChatMessage';
import MemoryManager from '@/components/MemoryManager';
import TranscriptionFeedback from '@/components/TranscriptionFeedback';
import ReminderNotification from '@/components/ReminderNotification';
import { getMemory, addMemory, parseMemoryCommand, getTimeBasedGreeting } from '@/utils/memoryManager';
import { parseAndLearn, getAIContext, trackInteraction, addConversationSummary } from '@/utils/conversationMemory';
import { parseReminderFromText, createReminder } from '@/utils/reminderManager';
import { createScheduledMessage } from '@/utils/scheduledMessageManager';
import ScheduledMessageChecker from '@/components/ScheduledMessageChecker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { MusicPlayer } from '@/components/MusicPlayer';
import { GameLauncher } from '@/components/GameLauncher';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import CircularSiriWave from '@/components/CircularSiriWave';
import FileUpload from '@/components/FileUpload';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 data URL
  preview?: string;
  extractedText?: string; // text extracted from PDF/text files or audio transcript
}
interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: FileAttachment[];
  keySource?: 'user' | 'server';
}
const Chat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { conversationId: urlConversationId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeTool, setActiveTool] = useState<null | 'image' | 'deep' | 'learn' | 'create'>(null);
  const [editBaseImage, setEditBaseImage] = useState<string | null>(null);
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [phoneBridgeConnected, setPhoneBridgeConnected] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [systemData, setSystemData] = useState<SystemScanResult['data'] | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [show51Update, setShow51Update] = useState(false);

useEffect(() => {
  const seen = localStorage.getItem('alsa_seen_update_v51');
  if (!seen) {
    setShow51Update(true);
  }
}, []);
  useEffect(() => {
    if (location.state && typeof location.state === 'object') {
      const targetState = location.state as { autoOpenFromWake?: boolean; wakeTranscript?: string };

      if (targetState.autoOpenFromWake && targetState.wakeTranscript) {
        setInputText(targetState.wakeTranscript);
        try {
          window.history.replaceState({}, document.title);
        } catch (e) {
          console.warn("Failed to clear navigation history state safely:", e);
        }
      }
    }
  }, [location.state]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupKeyActive, setBackupKeyActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSavedPath, setRecordingSavedPath] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<'fast' | 'thinking'>(() => (localStorage.getItem('alsa_ai_mode') as 'fast' | 'thinking') || 'fast');
  const formatWikipedia = (text: string, query: string) => {
    const cleaned = text
      .replace("📖 Wikipedia Result:", "")
      .replace("Wait For Result, Alsa Ai fetch these details for you....", "")
      .replace("⚙️", "");
    const lines = cleaned
      .split(/\. |\n/)
      .map(line => line.trim())
      .filter(line => line.length > 25);
    const intro = lines[0] ? (lines[0].endsWith('.') ? lines[0] : lines[0] + '.') : "";
    const bullets = lines.slice(1, 6).map(line => {
      if (!line.endsWith('.')) line += '.';
      return `• ${line}`;
    });
    return `\n## ${query}\n\n${intro}\n\n${bullets.join('\n\n')}\n`;
  };
  const subscription = useSubscription();
  const { toast } = useToast();
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition();
  const { speak: ttsSpeak, stop, isSpeaking } = useTextToSpeech();
  const TTS_ENABLED = false;
  const speak = useCallback((text: string) => {
    if (!TTS_ENABLED) return;
    const voiceEnabled = localStorage.getItem('alsa_voice_enabled') !== 'false';
    if (voiceEnabled) ttsSpeak(text);
  }, [ttsSpeak]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listeningTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastProcessedRef = useRef<string>('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadedConvIdRef = useRef<string | null>(null);
  const toggleBridgeConnection = useCallback(async () => {
    if (bridgeConnected) {
      setBridgeConnected(false);
      toast({ title: 'PC Bridge Disconnected', description: 'Click again to reconnect' });
    } else {
      const status = await checkBridgeConnection();
      setBridgeConnected(status.connected);
      if (status.connected) {
        toast({ title: 'PC Bridge Connected', description: 'You can now control your PC' });
      } else {
        toast({
          title: 'PC Bridge Not Running',
          description: 'Start pc-control-bridge.py first',
          variant: 'destructive'
        });
      }
    }
  }, [bridgeConnected, toast]);
  const togglePhoneBridgeConnection = useCallback(async () => {
    if (phoneBridgeConnected) {
      setPhoneBridgeConnected(false);
      toast({ title: 'Phone Bridge Disconnected', description: 'Click again to reconnect' });
    } else {
      const status = await checkPhoneBridgeConnection();
      setPhoneBridgeConnected(status.connected);
      if (status.connected) {
        toast({ title: '📱 Phone Bridge Connected', description: 'Alsa can now control your phone' });
      } else {
        toast({
          title: 'Phone Bridge Is Not Connected To Bridge Server',
          description: 'In Alsa Ai Bridge App run: Click On Server',
          variant: 'destructive'
        });
      }
    }
  }, [phoneBridgeConnected, toast]);
  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
      toast({ title: '🎙️ Mic Off', description: 'Voice input stopped' });
    } else {
      startListening();
      toast({ title: '🎙️ Listening...', description: 'Start Speaking.....' });
    }
  }, [isListening, startListening, stopListening, toast]);
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    loadedConvIdRef.current = null;
    resetTranscript();
    setInputText('');
    setUploadedFiles([]);
    navigate('/Chat');
    speak('Starting a new conversation');
    toast({ title: 'New Chat', description: 'Ready for a new conversation' });
  }, [resetTranscript, speak, toast, navigate]);
  const handleRecording = useCallback(async () => {
    if (subscription.isFree) {
      toast({ title: 'Premium Feature', description: 'Screen recording requires Pro or Elite subscription', variant: 'destructive' });
      navigate('/pricing');
      return;
    }
    if (isRecording) {
      const result = await stopScreenRecording();
      setIsRecording(false);
      toast({ title: 'Recording Stopped', description: result.message });
      speak('Recording stopped and saved');
    } else {
      setRecordingSavedPath(null);
      const result = await startScreenRecording(60);
      if (result.success) {
        setIsRecording(true);
        toast({ title: 'Recording Started', description: 'Recording for up to 60 seconds' });
        speak('Screen recording started');
      } else {
        toast({ title: 'Recording Failed', description: result.message, variant: 'destructive' });
      }
    }
  }, [isRecording, toast, speak, subscription.isFree, navigate]);
  useEffect(() => {
    const handleRecordingSaved = (event: CustomEvent) => {
      const { success, folderPath } = event.detail;
      if (success && folderPath) {
        setRecordingSavedPath(folderPath);
        toast({
          title: 'Recording Saved',
          description: (
            <div className="flex flex-col gap-2">
              <span>Saved to: {folderPath}</span>
              <button
                className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:bg-primary/90"
                onClick={() => openFolder(folderPath)}
              >
                Open Folder
              </button>
            </div>
          ) as any,
          duration: 10000
        });
      }
    };
    window.addEventListener('recording-saved', handleRecordingSaved as EventListener);
    return () => window.removeEventListener('recording-saved', handleRecordingSaved as EventListener);
  }, [toast]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toggleVoice();
        return;
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewConversation();
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVoice, handleNewConversation]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/Chat');
      } else {
        setUser(session.user);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        navigate('/Chat');
      } else if (session) {
        setUser(session.user);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  useEffect(() => {
    const loadConversation = async () => {
      const convId = urlConversationId || location.state?.conversationId;
      if (!convId || !user) return;
      if (loadedConvIdRef.current === convId) return;
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        loadedConvIdRef.current = convId;
        if (data && data.length > 0) {
          setMessages(data.map((msg: any) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            files: msg.image_url
              ? [{ name: 'generated.png', type: 'image/png', size: 0, data: msg.image_url, preview: msg.image_url }]
              : undefined,
          })));
          setCurrentConversationId(convId);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };
    loadConversation();
  }, [urlConversationId, location.state, user]);
  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      const greeting = getTimeBasedGreeting();
      setHasGreeted(true);
    }
  }, [hasGreeted, messages.length]);
  useEffect(() => {
    const checkBridge = async () => {
      const status = await checkBridgeConnection();
      setBridgeConnected(status.connected);
      if (status.connected && !systemData) {
        const scanResult = await scanSystem();
        if (scanResult.success && scanResult.data) {
          setSystemData(scanResult.data);
        }
      }
      const phoneStatus = await checkPhoneBridgeConnection();
      setPhoneBridgeConnected(phoneStatus.connected);
    };
    checkBridge();
    const interval = setInterval(checkBridge, 30000);
    return () => clearInterval(interval);
  }, [systemData]);
  useEffect(() => {
    if (!isListening) return;
    const currentText = transcript.trim();
    if (!currentText) return;
    setInputText(currentText);
    if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
    const lowerText = currentText.toLowerCase();
    if (lowerText === 'stop listening' || lowerText === 'voice off' || lowerText === 'mic off') {
      stopListening();
      resetTranscript();
      setInputText('');
      return;
    }
    listeningTimeoutRef.current = setTimeout(() => {
      if (currentText === lastProcessedRef.current) return;
      lastProcessedRef.current = currentText;
      handleSubmit(currentText);
      setInputText('');
      resetTranscript();
      setTimeout(() => { lastProcessedRef.current = ''; }, 1500);
    }, 400);
    return () => {
      if (listeningTimeoutRef.current) clearTimeout(listeningTimeoutRef.current);
    };
  }, [transcript, isListening, stopListening, resetTranscript]);
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  useEffect(() => {
    const onEditImage = (e: any) => {
      const src = e?.detail?.src;
      if (!src) return;
      setEditBaseImage(src);
      setActiveTool('image');
      toast({ title: 'Edit mode on', description: 'Describe the changes you want in this image.' });
    };
    window.addEventListener('alsa-edit-image', onEditImage as EventListener);
    return () => window.removeEventListener('alsa-edit-image', onEditImage as EventListener);
  }, [toast]);
  const saveConversation = async (userMsg: Message, assistantMsg: Message) => {
    if (!user) return;
    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        const title = userMsg.content.slice(0, 50) + (userMsg.content.length > 50 ? '...' : '');
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .insert({ user_id: user.id, title })
          .select()
          .single();
        if (convError) throw convError;
        conversationId = conv.id;
        setCurrentConversationId(conversationId);
        loadedConvIdRef.current = conversationId;
        navigate(`/c/${conversationId}`, { replace: true });
      } else {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }
      const assistantImage = (assistantMsg.files as any)?.find?.((f: any) => (f?.type || '').startsWith('image/'));
      await supabase.from('chat_messages').insert([
        { conversation_id: conversationId, role: 'user', content: userMsg.content },
        {
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMsg.content,
          image_url: assistantImage?.data || assistantImage?.preview || null,
        }
      ]);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };
  const extractFileText = async (f: any): Promise<string | undefined> => {
    const type: string = f.type || '';
    const name: string = (f.name || '').toLowerCase();
    const data: string = f.data || '';
    if (type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|webm|flac)$/.test(name)) {
      try {
        const base64 = data.includes(',') ? data.split(',')[1] : data;
        const { data: stt, error } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64, mimeType: type || 'audio/webm' },
        });
        if (!error && stt?.text) return `[Audio transcript]\n${stt.text}`;
      } catch (e) { console.warn('Audio transcription failed', e); }
      return undefined;
    }
    const isText =
      type.startsWith('text/') || type === 'application/json' || type === 'application/xml' ||
      /\.(txt|md|csv|json|log|xml|js|ts|tsx|jsx|py|html|css|yml|yaml|sql|sh|env)$/.test(name);
    if (isText && data) {
      try {
        const b64 = data.includes(',') ? data.split(',')[1] : data;
        const decoded = atob(b64);
        return decoded.slice(0, 50000);
      } catch { /* fallthrough */ }
    }
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      try {
        // @ts-ignore
        const pdfjs: any = await import(/* @vite-ignore */('https://esm.sh/pdfjs-dist@4.0.379/build/pdf.min.mjs' as any));
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
        const b64 = data.includes(',') ? data.split(',')[1] : data;
        const bin = atob(b64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let out = '';
        const pages = Math.min(doc.numPages, 30);
        for (let i = 1; i <= pages; i++) {
          const page = await doc.getPage(i);
          const tc = await page.getTextContent();
          out += tc.items.map((it: any) => it.str).join(' ') + '\n\n';
          if (out.length > 30000) break;
        }
        return out.slice(0, 30000);
      } catch (e) { console.warn('PDF extract failed', e); }
    }
    return undefined;
  };
  const handleNativeFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const MAX = 20 * 1024 * 1024;
    const files: any[] = [];
    for (let i = 0; i < fileList.length && files.length < 10; i++) {
      const f = fileList[i];
      if (f.size > MAX) {
        toast({ title: 'Too large', description: `${f.name} > 20MB`, variant: 'destructive' });
        continue;
      }
      const data = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
      files.push({
        name: f.name, type: f.type || 'application/octet-stream', size: f.size,
        data, preview: f.type.startsWith('image/') ? data : undefined,
      });
    }
    if (files.length) await handleFilesSelected(files);
  };
  const handleFilesSelected = async (files: any[]) => {
    toast({ title: 'Processing files…', description: 'Extracting content for AI analysis' });
    const attachments: FileAttachment[] = await Promise.all(files.map(async (f) => {
      const extractedText = await extractFileText(f);
      return {
        name: f.name,
        type: f.type,
        size: f.size,
        data: f.data || '',
        preview: f.preview,
        extractedText,
      };
    }));
    setUploadedFiles(prev => [...prev, ...attachments].slice(0, 10));
    setShowFileUpload(false);
    toast({ title: 'Files ready', description: `${attachments.length} file(s) attached for AI analysis` });
  };
  const fetchCrossConversationContext = async (): Promise<string> => {
    if (!user) return '';
    try {
      const { data: convos } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .neq('id', currentConversationId || '00000000-0000-0000-0000-000000000000')
        .order('updated_at', { ascending: false })
        .limit(5);
      if (!convos || convos.length === 0) return '';
      const blocks: string[] = [];
      for (const c of convos) {
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('conversation_id', c.id)
          .order('created_at', { ascending: false })
          .limit(6);
        if (!msgs || msgs.length === 0) continue;
        const snippet = msgs.reverse()
          .map((m: any) => `${m.role === 'user' ? 'U' : 'A'}: ${(m.content || '').slice(0, 200)}`)
          .join('\n');
        blocks.push(`### Past chat: "${c.title}"\n${snippet}`);
      }
      return blocks.join('\n\n');
    } catch (e) { return ''; }
  };
  const handleSubmit = async (text: string = inputText) => {
    if (isTyping || (!text.trim() && uploadedFiles.length === 0)) return;
    if (user && subscription.isFree && !subscription.canSendMessage) {
      toast({
        title: 'Daily Limit Reached',
        description: 'Free tier is limited to 50 messages/day. Upgrade for unlimited access!',
        variant: 'destructive'
      });
      navigate('/pricing');
      return;
    }
    let trimmed = text.trim();
    if (activeTool === 'deep' && !/^\/deep\b/i.test(trimmed)) trimmed = `/deep ${trimmed}`;
    if (activeTool === 'learn' && !/^\/learn\b/i.test(trimmed)) trimmed = `/learn ${trimmed}`;
    if (activeTool === 'create' && !/^\/create\b/i.test(trimmed)) trimmed = `/create ${trimmed}`;
    if (activeTool === 'image' || /^\/image\b/i.test(trimmed)) {
      const prompt = trimmed.replace(/^\/image\s*/i, '').trim();
      if (!prompt) {
        toast({ title: 'Describe the image', description: 'Type what you want to generate.' });
        return;
      }
      setInputText('');
      setActiveTool(null);
      const baseImg = editBaseImage;
      setEditBaseImage(null);
      const userMsg: Message = { role: 'user', content: baseImg ? `✏️ Edit image: ${prompt}` : prompt };
      setMessages(prev => [...prev, userMsg, { role: 'assistant', content: baseImg ? '✏️ Editing image…' : '🎨 Generating image…' }]);
      setIsTyping(true);
      try {
        const { data, error } = await supabase.functions.invoke('image-chat', {
          body: { prompt, inputImages: baseImg ? [baseImg] : [], aspectRatio: '1:1' },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const assistantMsg: Message = {
          role: 'assistant',
          content: data?.text || `Here's your image for: **${prompt}**`,
          files: data?.imageUrl
            ? [{ name: 'generated.png', type: 'image/png', size: 0, data: data.imageUrl, preview: data.imageUrl }]
            : undefined,
        };
        setMessages(prev => [...prev.slice(0, -1), assistantMsg]);
        if (user) await saveConversation(userMsg, assistantMsg);
      } catch (e: any) {
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: `❌ Image generation failed: ${e?.message || e}` }]);
      } finally {
        setIsTyping(false);
      }
      return;
    }
    const lower = trimmed.toLowerCase();
    const isPremiumCmd = lower.startsWith('/deep') || lower.startsWith('/create');
    const isProOrElite = subscription.isPro || subscription.isElite || subscription.isTeam;

    if (isPremiumCmd && !isProOrElite) {
      toast({
        title: 'Pro / Elite feature',
        description: 'Commands like /deep and /create are available on Pro and Elite plans only.',
        variant: 'destructive',
      });
      navigate('/pricing');
      return;
    }
    if (user && subscription.isFree) {
      subscription.incrementMessageCount();
    }
    const userMessage: Message = { role: 'user', content: text, files: uploadedFiles };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setUploadedFiles([]);
    try {
      const { extractYouTubeUrl, ytdlpStatus, ytdlpDownload } = await import('@/utils/pcBridge');
      const { phoneYtdlpStatus, phoneYtdlpDownload } = await import('@/utils/phoneBridge');

      const ytUrl = extractYouTubeUrl(trimmed);
      const wantsDownload = /\b(download|save|grab|mp3|mp4|audio|video|playlist|yt-?dlp)\b/i.test(trimmed);
      if (ytUrl && wantsDownload) {
        if (!isProOrElite) {
          setMessages(prev => [...prev, { role: 'assistant', content: '🔒 YouTube downloader (yt-dlp) Pro & Elite plans mein available hai. Upgrade karein.' }]);
          return;
        }
        const wantsAudio = /\b(mp3|audio|song|music)\b/i.test(trimmed);
        const qMatch = trimmed.match(/\b(144|240|360|480|720|1080|1440|2160|4k)\b/i);
        const quality = qMatch ? (qMatch[1].toLowerCase() === '4k' ? '2160' : qMatch[1]) : 'best';
        const commonOpts = {
          url: ytUrl,
          mode: (wantsAudio ? 'audio' : 'video') as 'audio' | 'video',
          quality: quality as any,
          audio_format: (trimmed.match(/\b(mp3|m4a|opus|wav|flac)\b/i)?.[1]?.toLowerCase() as any) || 'mp3',
          subtitles: /\bsub(title)?s?\b/i.test(trimmed),
          embed_thumbnail: true,
          embed_metadata: true,
          playlist: /\bplaylist\b/i.test(trimmed) || /list=/.test(ytUrl),
        };
        if (phoneBridgeConnected) {
          const ps = await phoneYtdlpStatus();
          if (ps?.installed) {
            setMessages(prev => [...prev, { role: 'assistant', content: `📱 Phone yt-dlp start...\n\n• URL: ${ytUrl}\n• Mode: ${wantsAudio ? 'audio' : 'video ' + quality + 'p'}` }]);
            setIsTyping(true);
            const res = await phoneYtdlpDownload(commonOpts);
            setIsTyping(false);
            if (res?.success) {
              const fileList = (res.files || []).slice(0, 10).map((f: string) => `• ${f}`).join('\n');
              setMessages(prev => [...prev, { role: 'assistant', content: `✅ Phone download complete! ${res.count} file(s).\n\n${fileList}\n\n📁 \`${res.output_dir}\`` }]);
            } else {
              setMessages(prev => [...prev, { role: 'assistant', content: `❌ Phone download failed: ${res?.error || 'unknown'}` }]);
            }
            return;
          }
        }
        const status = await ytdlpStatus();
        if (!status?.installed) {
          setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ No Pc Bridge, No Alsa Ai Server. Kindly run atleast one from them(`Alsa Ai Server(For Android) Or pc-bridge.py(For Desktop)`).' }]);
          return;
        }
        setMessages(prev => [...prev, { role: 'assistant', content: `📥 Downloading via yt-dlp (PC)...\n\n• URL: ${ytUrl}\n• Mode: ${wantsAudio ? 'audio' : 'video ' + quality + 'p'}\n• Folder: ~/Downloads/ALSA-YT\n\nThodi der lagegi...` }]);
        setIsTyping(true);
        const res = await ytdlpDownload(commonOpts);
        setIsTyping(false);
        if (res?.success) {
          const fileList = (res.files || []).slice(0, 10).map((f: string) => `• ${f.split(/[\\/]/).pop()}`).join('\n');
          setMessages(prev => [...prev, { role: 'assistant', content: `✅ Download complete! ${res.count} file(s) saved.\n\n${fileList}\n\n📁 \`${res.output_dir}\`${res.note ? '\n\n⚠️ ' + res.note : ''}` }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: `❌ Download failed: ${res?.error || 'unknown error'}` }]);
        }
        return;
      }
    } catch (e) { }
    if (lower.startsWith('/create')) {
      const topic = trimmed.replace(/^\/create\s*/i, '').trim();
      if (!topic) {
        setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Please provide a topic. Example: `/create How AI Works` or `/create a Python script that prints prime numbers`' }]);
        return;
      }
      try {
        setIsTyping(true);
        const { getCreateMode, generateArticlePdf, downloadCodeFiles } = await import('@/utils/createCommand');
        const mode = getCreateMode(topic);
        const createInstruction = mode === 'code'
          ? `The user wants you to CREATE the following: "${topic}". Reply with ONLY clean, runnable code in fenced markdown code blocks (\`\`\`lang\\n...\\n\`\`\`). If multiple files are needed, use a separate code block per file and start each block with a comment line containing the filename. Do not add long explanations.`
          : `You are producing a polished, professional PDF document. Treat the user's message below as a BRIEF — read it carefully, understand the intent, then PRODUCE the finished document. Do NOT repeat, quote, restate, or echo the brief. Do NOT include the user's instructions, questions, or any "Format Requirements" text in your output.
BRIEF:
"""${topic}"""
Output rules (strict markdown):
- Begin with a single line: "# <Clear Professional Title>" derived from the brief (do not use the brief text as the title).
- Use "##" for major sections and "###" for sub-sections. Make headings crisp and meaningful.
- Use **bold** to emphasise key terms, names, and figures.
- Use bullet lists ("- item") and numbered lists where natural.
- When presenting comparative or tabular data (roles, payments, pricing tiers, schedules, breakdowns), use a proper markdown table with a header row and a separator row, e.g.:

| Role | Responsibility | Payment |
| :--- | :--- | :--- |
| ... | ... | ... |

- Keep paragraphs short (2-4 sentences). Professional, confident tone.
- Do NOT add a "Confidential" footer in the body — the PDF renderer adds it.
- Do NOT use code fences or HTML. Markdown only.
- Length: enough to fully cover the brief, typically 500-1500 words.`;
        const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
        const aiResp = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
          body: JSON.stringify({
            messages: [{ role: 'user', content: topic }],
            mode: 'thinking',
            createMode: true,
            createInstruction,
          }),
        });
        let fullText = '';
        if (aiResp.body) {
          const r = aiResp.body.getReader();
          const dec = new TextDecoder();
          let buf = '';
          while (true) {
            const { done, value } = await r.read();
            if (done) break;
            buf += dec.decode(value, { stream: true });
            const lines = buf.split('\n'); buf = lines.pop() || '';
            for (let line of lines) {
              line = line.trim();
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try { const p = JSON.parse(data); if (p.type === 'content' && p.delta) fullText += p.delta; } catch { }
            }
          }
        }
        if (!fullText.trim()) {
          setMessages(prev => [...prev, { role: 'assistant', content: '❌ Could not generate content. Please try again.' }]);
          setIsTyping(false);
          return;
        }
        let summary = '';
        if (mode === 'pdf') {
          const fname = generateArticlePdf(topic, fullText);
          summary = `📄 **PDF ready:** \`${fname}\`\n\nYour article on **${topic}** has been generated and downloaded. Check your Downloads folder.`;
        } else {
          const files = await downloadCodeFiles(topic, fullText);
          const isZip = files[0]?.endsWith('.zip');
          summary = isZip
            ? `🗜️ **Project ZIP ready:** \`${files[0]}\`\n\nContains ${files.length - 1} files:\n\n${files.slice(1).map(f => `- \`${f}\``).join('\n')}`
            : `💻 **Code file ready:**\n\n${files.map(f => `- \`${f}\``).join('\n')}\n\nDownloaded to your Downloads folder.`;
        }
        const assistantMsg = { role: 'assistant' as const, content: summary + '\n\n---\n\n' + fullText };
        setMessages(prev => [...prev, assistantMsg]);
        speak(mode === 'pdf' ? 'Your PDF is ready' : 'Your code files are ready');
        setIsTyping(false);
        if (user) {
          await saveConversation(userMessage, assistantMsg);
        }
        return;
      } catch (e: any) {
        console.error('/create error:', e);
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ /create failed: ${e?.message || e}` }]);
        setIsTyping(false);
        return;
      }
    }
    if (isProOrElite) {
      try {
        const { matchCustomCommand, executeCustomCommand } = await import('@/utils/customCommands');
        const matched = matchCustomCommand(text);
        if (matched) {
          const result = await executeCustomCommand(matched, bridgeConnected);
          if (!result.forwardToAI) {
            setMessages(prev => [...prev, { role: 'assistant', content: `🎯 **${matched.phrase}** → ${result.message}` }]);
            speak(result.message);
            return;
          }
          text = result.forwardToAI.prompt;
        }
      } catch (e) { }
    }
    parseAndLearn(text);
    trackInteraction(text);
    const noteMatch = text.match(/^\s*note\s+["“'](.+?)["”']\s*$/i) || text.match(/^\s*note\s*[:\-]\s*(.+)$/i);
    if (noteMatch) {
      const noteValue = noteMatch[1].trim();
      const noteKey = `note_${Date.now()}`;
      addMemory(noteKey, noteValue);
      const response = `📝 Yaad rakh liya boss! Ye baat ab hamesha mere zehen mein rahegi:\n\n> ${noteValue}`;
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speak('Note saved permanently');
      if (user) await saveConversation(userMessage, { role: 'assistant', content: response });
      return;
    }
    const memoryData = parseMemoryCommand(text);
    if (memoryData) {
      addMemory(memoryData.key, memoryData.value);
      const response = `Memory saved! ${memoryData.key.replace(/_/g, ' ')}: ${memoryData.value}`;
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speak(response);
      return;
    }
    const reminderPatterns = [
      /remind(?:er)?\s+(?:me\s+)?(?:to\s+)?(.+?)(?:\s+(?:at|on|in|tomorrow|today|next)\s+.+)/i,
      /(?:set|create|add)\s+(?:a\s+)?reminder\s+(?:for\s+)?(.+?)(?:\s+(?:at|on|in|tomorrow|today)\s+.+)/i,
      /mujhe\s+(.+?)\s+(?:ke\s+liye\s+)?remind\s+kar(?:o|na)?/i,
      /(.+?)\s+(?:ka|ke|ki)\s+reminder\s+(?:set|laga|bana)/i,
      /याद\s+दिलाना\s+(.+)/i,
    ];
    const isReminderRequest = reminderPatterns.some(p => p.test(text));
    if (isReminderRequest && user) {
      const reminderData = parseReminderFromText(text);
      if (reminderData) {
        try {
          await createReminder(user.id, reminderData.title, reminderData.time, reminderData.description);
          const timeStr = reminderData.time.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          });
          const response = `⏰ Reminder set!\n\n**${reminderData.title}**\n📅 ${timeStr}\n\nI'll notify you 1 hour before and when it's time! 🔔`;
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);
          speak(`Reminder set for ${reminderData.title}`);
          if (user) await saveConversation(userMessage, { role: 'assistant', content: response });
          return;
        } catch (error) {
          console.error('Error creating reminder:', error);
        }
      }
    }
    // ── PHONE BRIDGE COMMAND PARSER ──
    const phoneCmd = parsePhoneCommand(text);
    if (phoneCmd && phoneBridgeConnected) {
      try {
        const result = await executePhoneCommand(phoneCmd);
        let content = result.success
          ? `📱 **Phone Bridge** → ${phoneCmd.label} ✓`
          : `❌ Phone Bridge: ${result.message}`;
        if (result.success && result.data) {
          const preview = typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : String(result.data);
          if (preview && preview !== '{}' && preview.length < 800) {
            content += `\n\`\`\`json\n${preview}\n\`\`\``;
          }
        }
        setMessages(prev => [...prev, { role: 'assistant', content }]);
        speak(result.success ? phoneCmd.label : 'Phone command failed');
        if (user) await saveConversation(userMessage, { role: 'assistant', content });
        return;
      } catch (e: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ Phone Bridge error: ${e.message || e}` }]);
        return;
      }
    }
    if (phoneCmd && !phoneBridgeConnected) {
      const msg = `📴 Alsa Ai Bridge Server Is Offline. Run Alsa Ai Bridge Server First.`;
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
      speak('Phone Bridge is offline');
      return;
    }
    const parsedCommand = parseNaturalLanguage(text);
    if (parsedCommand && bridgeConnected) {
      try {
        const result = await executeSystemCommand(text);
        const response = result.success
          ? `✅ ${result.message}${result.output ? `\n\`\`\`\n${result.output}\n\`\`\`` : ''}`
          : `❌ ${result.message}`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        speak(result.success ? result.message : 'Command failed');
        if (user) await saveConversation(userMessage, { role: 'assistant', content: response });
        return;
      } catch (error: any) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Failed'}` }]);
        return;
      }
    }
    const openWebsitePatterns = [
      /\b(open|launch|start)\s+(\w+)\b/i,
      /\b(\w+)\s+(kholo|kholna|open\s+karo|ko\s+open\s+karo)\b/i,
    ];
    const userSites = JSON.parse(localStorage.getItem('alsa_user_sites') || '[]');
    for (const site of userSites) {
      const sitePattern = new RegExp(`\\b(open|kholo|launch)\\s+${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|\\b${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(kholo|open\\s+karo)\\b`, 'i');
      if (sitePattern.test(lower)) {
        const response = `Opening ${site.name}`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        speak(response);
        setTimeout(() => window.open(site.url, '_blank'), 500);
        if (user) await saveConversation(userMessage, { role: 'assistant', content: response });
        return;
      }
    }
    for (const [key, site] of Object.entries(WEBSITES)) {
      const strictPatterns = [
        new RegExp(`\\b(open|launch|start|visit)\\s+${key}\\b`, 'i'),
        new RegExp(`\\b(open|launch|start|visit)\\s+${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
        new RegExp(`\\b${key}\\s+(kholo|kholna|open\\s+karo|ko\\s+open\\s+karo)\\b`, 'i'),
        new RegExp(`\\b${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(kholo|kholna|open\\s+karo)\\b`, 'i'),
      ];
      if (strictPatterns.some(pattern => pattern.test(lower))) {
        const appKeywords = ['file explorer', 'explorer', 'notepad', 'word', 'excel', 'powerpoint', 'paint', 'calculator', 'cmd', 'terminal', 'antigravity'];
        if (appKeywords.some(app => lower.includes(app))) continue;
        const response = `Opening ${site.name}`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        speak(response);
        setTimeout(() => window.open(site.url, '_blank'), 500);
        if (user) await saveConversation(userMessage, { role: 'assistant', content: response });
        return;
      }
    }
    try {
      setIsTyping(true);
      const memory = getMemory();
      const telegramContacts = JSON.parse(localStorage.getItem('alsa_telegram_contacts') || '[]');
      const whatsappContacts = JSON.parse(localStorage.getItem('alsa_whatsapp_contacts') || '[]');
      const crossConversationContext = await fetchCrossConversationContext();
      const apiEndpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
            files: (m.files || []).map(f => ({
              name: f.name,
              type: f.type,
              data: f.data,
              extractedText: f.extractedText,
            })),
          })),
          memory,
          telegramContacts,
          whatsappContacts,
          conversationContext: getAIContext(),
          crossConversationContext,
          userId: user?.id || null,
          ai_response_style: localStorage.getItem('alsa_ai_response_style') || 'balanced',
          customInstructions: localStorage.getItem('alsa_custom_instructions') || '',
          userApiKey: localStorage.getItem('alsa_user_api_key') || '',
          userModel: localStorage.getItem('alsa_user_model') || '',
          mode: /^\/learn\b/i.test(trimmed) ? 'thinking' : aiMode,
          learnMode: /^\/learn\b/i.test(trimmed),
        })
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (let line of lines) {
          line = line.trim();
          if (!line || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            setIsTyping(false);
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'key_source') {
              const src: 'user' | 'server' = parsed.source === 'user' ? 'user' : 'server';
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.keySource = src;
                } else {
                  newMessages.push({ role: 'assistant', content: '', keySource: src });
                }
                return newMessages;
              });
              continue;
            }
            if (parsed.type === 'content' && parsed.delta) {
              accumulatedText += parsed.delta;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  const isWikipedia = accumulatedText.includes("Wikipedia") || accumulatedText.length > 200;
                  lastMsg.content = isWikipedia ? formatWikipedia(accumulatedText, userMessage.content) : accumulatedText;
                }
                return newMessages;
              });
            } else if (parsed.type === 'play_music') {
              setCurrentSong(parsed.song);
              speak(`Playing ${parsed.song}`);
            } else if (parsed.type === 'launch_game') {
              setCurrentGame(parsed.game);
              speak(`Launching ${parsed.game}`);
            } else if (parsed.type === 'create_project' && parsed.project_path && parsed.files) {
              const result = await createProject(parsed.project_path, parsed.files);
              accumulatedText += `\n\n${result.success ? `✅ Project created at ${parsed.project_path}` : `❌ Failed to create project: ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'create_powerpoint') {
              const result = await createPowerPoint(parsed.file_path, parsed.title, parsed.slides, parsed.theme);
              accumulatedText += `\n\n${result.success ? `✅ PowerPoint created: ${result.file_path || parsed.file_path}` : `❌ Failed: ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'create_excel') {
              const result = await createExcel(parsed.file_path, parsed.sheet_name, parsed.headers, parsed.data, parsed.formatting);
              accumulatedText += `\n\n${result.success ? `✅ Excel file created: ${result.file_path || parsed.file_path}` : `❌ Failed: ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'create_database') {
              const result = await createDatabase(parsed.file_path, parsed.db_type, parsed.tables);
              accumulatedText += `\n\n${result.success ? `✅ Database created: ${result.file_path || parsed.file_path}` : `❌ Failed: ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'execute_python') {
              const result = await executePythonFile(parsed.file_path);
              accumulatedText += `\n\n${result.success ? `✅ Python executed:\n\`\`\`\n${result.output || 'No output'}\n\`\`\`` : `❌ Failed: ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'execute_cmd') {
              const result = await executeCmdCommand(parsed.command);
              accumulatedText += `\n\n${result.success ? `✅ Command output:\n\`\`\`\n${result.output || 'No output'}\n\`\`\`` : `❌ Failed: ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'system_power') {
              const result = await sendCommand(parsed.action);
              accumulatedText += `\n\n${result.success ? `✅ ${result.message}` : `❌ ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'run_application') {
              const result = await runCommand(parsed.command);
              accumulatedText += `\n\n${result.success ? `✅ Opened ${parsed.command}` : `❌ ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'telegram_msg') {
              // BUG FIX 3: TELEGRAM HANDLER NOW PROPERLY FALLS BACK TO PHONE BRIDGE
              let result: any;
              if (phoneBridgeConnected) {
                const { phoneTelegramSend } = await import('@/utils/phoneBridge');
                result = await phoneTelegramSend(parsed.link, parsed.message);
                result.success = result?.ok !== false;
              } else if (bridgeConnected) {
                const { sendTelegramMsg } = await import('@/utils/pcBridge');
                result = await sendTelegramMsg(parsed.link, parsed.message);
              } else {
                result = { success: false, message: 'Na PC Bridge, na Phone Bridge chalu hai.' };
              }
              const statusMsg = result.success
                ? `✅ Telegram message sent to ${parsed.link}`
                : `❌ Failed to send Telegram: ${result.message || result.error || 'Unknown error'}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'whatsapp_msg') {
              let result: any;
              let via = 'PC';
              if (phoneBridgeConnected) {
                const { phoneWhatsappSend, phoneWhatsappSendByName } = await import('@/utils/phoneBridge');
                via = 'Phone';
                if (/^\+?\d[\d\s\-]{5,}$/.test(String(parsed.phone))) {
                  result = await phoneWhatsappSend(parsed.phone, parsed.message);
                } else {
                  result = await phoneWhatsappSendByName(parsed.phone, parsed.message);
                }
                result.success = result?.ok !== false;
              } else if (bridgeConnected) {
                result = await sendWhatsAppMsg(parsed.phone, parsed.message);
              } else {
                result = { success: false, message: 'Na PC Bridge, na Phone Bridge chalu hai.' };
              }
              const statusMsg = result.success
                ? `✅ WhatsApp (${via} Bridge) → ${parsed.phone}`
                : `❌ WhatsApp failed: ${result.message || result.error}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'email_msg') {
              const { phoneEmailSend, phoneEmailSendByName, deriveSubject } = await import('@/utils/phoneBridge');
              const subject = parsed.subject || deriveSubject(parsed.body || '');
              let result: any;
              if (!phoneBridgeConnected) {
                result = { ok: false, error: 'Phone Bridge is offline. Open the Alsa Phone Bridge app (port 5002).' };
              } else if (parsed.to) {
                result = await phoneEmailSend({ to: parsed.to, subject, body: parsed.html || parsed.body, html: !!parsed.html });
              } else {
                result = await phoneEmailSendByName(parsed.recipient_name || '', parsed.html || parsed.body, subject, !!parsed.html);
              }
              const ok = result?.ok !== false && !result?.error;
              const statusMsg = ok
                ? `✅ Email sent → ${parsed.to || result?.contact?.email || parsed.recipient_name} (Subject: ${subject})`
                : `❌ Email failed: ${result?.error || 'unknown error'}${/not found/i.test(String(result?.error || '')) ? ' — add this contact in Settings → Email Automation.' : ''}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'adb_connect') {
              const statusMsg = phoneBridgeConnected
                ? `📱 Phone Bridge already active — ADB connect skip kiya.`
                : (await adbConnect(parsed.device)).success
                  ? `✅ ADB connected to ${parsed.device}`
                  : `❌ ADB not available. Phone Bridge (Alsa Ai Bridge Server) chalu karo — behtar hai.`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'adb_command') {
              let result: any;
              if (phoneBridgeConnected) {
                const { phoneShell } = await import('@/utils/phoneBridge');
                result = await phoneShell(parsed.command);
                result.success = result?.ok !== false;
                result.output = result.output;
              } else if (bridgeConnected) {
                result = await adbCommand(parsed.command);
              } else {
                result = { success: false, message: 'Na PC Bridge, na Phone Bridge chalu hai.' };
              }
              const statusMsg = result.success
                ? `✅ ${phoneBridgeConnected ? 'Phone' : 'ADB'}:\n\`\`\`\n${result.output || 'Done'}\n\`\`\``
                : `❌ ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'close_window') {
              const result = await closeWindow(parsed.window_name);
              accumulatedText += `\n\n${result.success ? `✅ Closed ${parsed.window_name}` : `❌ ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'open_folder') {
              const result = await openFolder(parsed.folder_path);
              accumulatedText += `\n\n${result.success ? `✅ Opened ${parsed.folder_path}` : `❌ ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'run_project') {
              const result = await runProject(parsed.project_path, parsed.command);
              accumulatedText += `\n\n${result.success ? `✅ Project running:\n\`\`\`\n${result.output || 'Started'}\n\`\`\`` : `❌ ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'create_folder') {
              const result = await createFolder(parsed.folder_path);
              accumulatedText += `\n\n${result.success ? `✅ Folder created: ${parsed.folder_path}` : `❌ ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'create_file') {
              const result = await createTextFile(parsed.file_path, parsed.content || '');
              accumulatedText += `\n\n${result.success ? `✅ File created: ${parsed.file_path}` : `❌ ${result.message}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'web_search') {
              const result = await openWebsiteWithSearch(parsed.query, parsed.engine || 'google') as any;
              accumulatedText += `\n\n${result?.success ? `✅ Searching for "${parsed.query}"` : `❌ ${result?.message || 'Failed'}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'open_app') {
              const result = await openCustomApp(parsed.app_path) as any;
              accumulatedText += `\n\n${result?.success ? `✅ Opened ${parsed.app_path}` : `❌ ${result?.message || 'Failed'}`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'check_installation') {
              const result = await checkInstallation(parsed.software) as any;
              accumulatedText += `\n\n${result?.installed ? `✅ ${parsed.software} is installed (${result.version || 'version unknown'})` : `❌ ${parsed.software} is not installed`}`;
              setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
            } else if (parsed.type === 'schedule_telegram_msg') {
              if (user) {
                const contactName = parsed.contact_name || 'Unknown';
                let finalContactValue = parsed.link || '';
                if (!finalContactValue) {
                  const found = JSON.parse(localStorage.getItem('alsa_telegram_contacts') || '[]').find((c: any) => c.name?.toLowerCase() === contactName.toLowerCase());
                  if (found) finalContactValue = found.value;
                }
                if (finalContactValue) {
                  const scheduledTime = new Date(parsed.scheduled_time);
                  const result = await createScheduledMessage(user.id, 'telegram', contactName, finalContactValue, parsed.message, scheduledTime);
                  accumulatedText += `\n\n${result.success ? `✅ Telegram message scheduled for ${scheduledTime.toLocaleString()}\n📧 To: ${contactName}\n💬 Message: "${parsed.message}"` : `❌ Failed to schedule: ${result.error}`}`;
                } else {
                  accumulatedText += `\n\n❌ Contact "${contactName}" not found. Please add them in Settings → Messaging Automation.`;
                }
                setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
              }
            } else if (parsed.type === 'schedule_whatsapp_msg') {
              if (user) {
                const contactName = parsed.contact_name || 'Unknown';
                let finalContactValue = parsed.phone || '';
                if (!finalContactValue) {
                  const found = JSON.parse(localStorage.getItem('alsa_whatsapp_contacts') || '[]').find((c: any) => c.name?.toLowerCase() === contactName.toLowerCase());
                  if (found) finalContactValue = found.value;
                }
                if (finalContactValue) {
                  const scheduledTime = new Date(parsed.scheduled_time);
                  const result = await createScheduledMessage(user.id, 'whatsapp', contactName, finalContactValue, parsed.message, scheduledTime);
                  accumulatedText += `\n\n${result.success ? `✅ WhatsApp message scheduled for ${scheduledTime.toLocaleString()}\n📧 To: ${contactName}\n💬 Message: "${parsed.message}"` : `❌ Failed to schedule: ${result.error}`}`;
                } else {
                  accumulatedText += `\n\n❌ Contact "${contactName}" not found. Please add them in Settings → Messaging Automation.`;
                }
                setMessages(prev => { const n = [...prev]; const l = n[n.length - 1]; if (l?.role === 'assistant') l.content = accumulatedText; return n; });
              }
            }
          } catch (parseError) {
            if (!(parseError instanceof SyntaxError)) {
              console.error("Chat Stream Tool Execution Error:", parseError);
            }
          }
        }
      }
      setIsTyping(false);
      if (accumulatedText.trim()) {
        speak(accumulatedText);
        if (user) {
          await saveConversation(userMessage, { role: 'assistant', content: accumulatedText });
        }
      } else {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant' && !last.content.trim()) next.pop();
          return [...next, { role: 'assistant', content: 'Response receive nahi hua. Please message dobara send karein.' }];
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setIsTyping(false);
      setBackupKeyActive(false);
      const errorMessage = `❌ I'm having trouble responding right now. Please try again or contact support at support@alsa-ai.in for assistance.`;
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'assistant' && !last.content.trim()) next.pop();
        return [...next, { role: 'assistant', content: errorMessage }];
      });
    }
  };
  const hasMessages = messages.length > 0;
  if (isMobile) {
    return (
      <div className="flex flex-col h-[100dvh] w-full bg-[#0d0d0d] text-white overflow-hidden max-w-full">
        <ScheduledMessageChecker userId={user?.id || null} />
        <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/40 backdrop-blur-xl">
          <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="text-white/60">
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm font-bold tracking-wider text-blue-400">ALSA</span>
          <Button variant="ghost" size="icon" onClick={() => setShowRightPanel(true)} className="text-white/60">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="px-3 py-3 space-y-4 overflow-x-hidden max-w-full w-full">
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center py-24">
                <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
                  ALSA AI
                </h1>
                <p className="text-blue-500/50 font-mono text-[8px] uppercase tracking-[0.3em] mt-2">
                  Alsa AI From Chat To Execution 5.1
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <ChatMessage key={i} role={m.role} content={m.content} files={m.files as any} keySource={m.keySource} />
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 ml-4">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </div>
        <div className="shrink-0 p-2 border-t border-white/5 bg-black/60 backdrop-blur-xl">
          {isListening && (
            <div className="mb-2">
              <TranscriptionFeedback transcript={transcript} isListening={isListening} />
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="relative group bg-white/5 border border-white/10 rounded-xl p-1.5 flex items-center gap-2 pr-6">
                  {f.preview || f.type.startsWith('image/') ? (
                    <img src={f.preview || f.data} alt={f.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold uppercase">
                      {f.name.split('.').pop()?.slice(0, 4) || 'FILE'}
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-white truncate max-w-[110px]">{f.name}</span>
                    <span className="text-[9px] text-white/40">
                      {(f.size / 1024).toFixed(0)} KB{f.extractedText ? ' · text ✓' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:scale-110 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-1.5 bg-[#1e1f20] border border-white/10 rounded-[26px] px-2 py-1.5">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.json,.xml"
              className="hidden"
              onChange={(e) => { handleNativeFiles(e.target.files); e.target.value = ''; }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isTyping}>
                <button
                  type="button"
                  className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition ${activeTool ? 'bg-blue-500/20 text-blue-300' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="bg-[#141414] border-white/10 text-white w-56">
                <DropdownMenuItem onClick={() => setActiveTool('image')} className="cursor-pointer">🖼️ Image Generation</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTool('deep')} className="cursor-pointer">🔍 Deep Research</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTool('learn')} className="cursor-pointer">🎓 Smart Learning</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTool('create')} className="cursor-pointer">📄 Create (file / PDF)</DropdownMenuItem>
                {activeTool && (
                  <DropdownMenuItem onClick={() => setActiveTool(null)} className="cursor-pointer text-white/50">✕ Clear tool</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              type="button"
              disabled={isTyping}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition disabled:opacity-40"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>
            <Textarea
              value={inputText}
              disabled={isTyping}
              onChange={(e) => {
                setInputText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isTyping) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                isListening ? 'Listening...'
                  : isTyping ? 'Alsa is responding...'
                    : activeTool ? `${activeTool === 'image' ? 'Describe the image' : activeTool === 'deep' ? 'What should I research' : activeTool === 'learn' ? 'What should I teach you' : 'What should I create'}...`
                      : 'Ask Alsa AI'
              }
              className="flex-1 min-w-0 bg-transparent border-none text-white text-[15px] focus-visible:ring-0 resize-none overflow-y-auto max-h-[140px] min-h-[38px] py-2 px-1"
              rows={1}
            />
            <button
              type="button"
              onClick={toggleVoice}
              className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition ${isListening ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
            >
              <Mic className="w-[18px] h-[18px]" />
            </button>
            <button
              type="button"
              disabled={isTyping}
              onClick={() => handleSubmit()}
              className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition ${isTyping ? 'bg-white/10 text-white/30' : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
            >
              <Send className="w-[17px] h-[17px]" />
            </button>
          </div>
          {activeTool && (
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="mt-1.5 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200"
            >
              {activeTool === 'image' ? 'Image' : activeTool === 'deep' ? 'Deep Research' : activeTool === 'learn' ? 'Smart Learning' : 'Create'} ✕
            </button>
          )}
        </div>
        {showSidebar && (
          <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setShowSidebar(false)}>
            <div className="w-72 h-full" onClick={e => e.stopPropagation()}>
              <Sidebar bridgeConnected={bridgeConnected || phoneBridgeConnected} onNewChat={handleNewConversation} onOpenMemory={() => setShowMemoryManager(true)} onToggleBridge={phoneBridgeConnected ? togglePhoneBridgeConnection : toggleBridgeConnection} currentConversationId={currentConversationId} />
            </div>
          </div>
        )}
        {showRightPanel && (
          <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setShowRightPanel(false)}>
            <div className="w-72 h-full ml-auto" onClick={e => e.stopPropagation()}>
              <RightPanel user={user} bridgeConnected={bridgeConnected} isListening={isListening} isSpeaking={isSpeaking} toggleVoice={toggleVoice} onOpenMemory={() => setShowMemoryManager(true)} backupKeyActive={backupKeyActive} />
            </div>
          </div>
        )}
        <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <DialogHeader><DialogTitle>Upload Files</DialogTitle></DialogHeader>
            <FileUpload onFilesSelected={handleFilesSelected} maxFiles={10} />
          </DialogContent>
        </Dialog>
        <Dialog open={showMemoryManager} onOpenChange={setShowMemoryManager}>
          <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
            <DialogHeader><DialogTitle className="text-xs uppercase tracking-[0.3em] text-blue-500 font-bold">Neural Data Bank</DialogTitle></DialogHeader>
            <MemoryManager />
          </DialogContent>
        </Dialog>
        <MusicPlayer song={currentSong} onClose={() => setCurrentSong(null)} />
        <GameLauncher game={currentGame as any} onClose={() => setCurrentGame(null)} />
      </div>
    );
  }
  return (
    <div className="flex h-[100dvh] w-full bg-[#0d0d0d] text-white overflow-hidden">
      <ScheduledMessageChecker userId={user?.id || null} />

      <Sidebar bridgeConnected={bridgeConnected || phoneBridgeConnected} onNewChat={handleNewConversation} onOpenMemory={() => setShowMemoryManager(true)} onToggleBridge={phoneBridgeConnected ? togglePhoneBridgeConnection : toggleBridgeConnection} currentConversationId={currentConversationId} />
      <div className="flex-[1_1_0%] min-w-0 relative flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(0,0,0,1)_100%)]" />
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {!messages.length ? (
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">ALSA AI</h1>
              <p className="mt-3 text-blue-500/50 font-mono text-[10px] tracking-[0.5em] uppercase">Alsa AI From Chat To Execution 5.1</p>
              <div className="mt-14 w-full max-w-2xl">
                <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-xl gap-3">
                  <Textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'; }}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                    placeholder={isListening ? "Listening... Please Speak" : "Enter Command..."}
                    className="bg-transparent border-none text-white text-sm flex-1 focus-visible:ring-0 resize-none overflow-y-auto max-h-[150px] min-h-[40px]"
                    rows={1}
                  />
                  <Mic className={`w-6 h-6 cursor-pointer transition-colors ${isListening ? 'text-red-400 animate-pulse' : 'text-white/60 hover:text-blue-400'}`} onClick={toggleVoice} />
                  <Send className="w-6 h-6 cursor-pointer hover:text-blue-400 transition-colors" onClick={() => handleSubmit()} />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6">
                <div className="max-w-5xl mx-auto py-8 space-y-8 w-full min-w-0">
                  {messages.map((m, i) => (
                    <ChatMessage key={i} role={m.role} content={m.content} files={m.files as any} keySource={m.keySource} />
                  ))}
                  {isTyping && (
                    <div className="flex gap-2 ml-12">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
              {isListening && (
                <div className="px-6 pt-2 pb-2">
                  <TranscriptionFeedback transcript={transcript} isListening={isListening} />
                </div>
              )}
              <div className="px-6 py-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="max-w-5xl mx-auto">
                  {uploadedFiles.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {uploadedFiles.map((f, i) => (
                        <div key={i} className="relative group bg-[#1a1a1a]/80 border border-white/10 rounded-xl p-1.5 flex items-center gap-2 pr-6 backdrop-blur-xl">
                          {f.preview || f.type.startsWith('image/') ? (
                            <img src={f.preview || f.data} alt={f.name} className="w-12 h-12 rounded-lg object-cover" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-bold uppercase">{f.name.split('.').pop()?.slice(0, 4) || 'FILE'}</div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs text-white truncate max-w-[140px]">{f.name}</span>
                            <span className="text-[10px] text-white/40">{(f.size / 1024).toFixed(0)} KB{f.extractedText ? ' · text ✓' : ''}</span>
                          </div>
                          <button onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:scale-110 transition"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <button type="button" onClick={() => { setAiMode('fast'); localStorage.setItem('alsa_ai_mode', 'fast'); }} className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border transition ${aiMode === 'fast' ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}>⚡ Fast</button>
                    <button type="button" onClick={() => { setAiMode('thinking'); localStorage.setItem('alsa_ai_mode', 'thinking'); }} className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border transition ${aiMode === 'thinking' ? 'bg-purple-500/20 border-purple-400/40 text-purple-200' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'}`}>🧠 Thinking</button>
                  </div>
                  <div className="flex items-center gap-3 bg-[#1a1a1a]/80 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-xl">
                    <input ref={fileInputRef} type="file" multiple accept="image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.csv,.json,.xml" className="hidden" onChange={(e) => { handleNativeFiles(e.target.files); e.target.value = ''; }} />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild disabled={isTyping}>
                        <button type="button" className={`flex-shrink-0 rounded-full p-1 transition ${activeTool ? 'bg-blue-500/20 text-blue-300' : 'text-white/30 hover:text-white'} ${isTyping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}><Plus className="w-5 h-5" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="top" align="start" className="bg-[#141414] border-white/10 text-white w-56">
                        <DropdownMenuItem onClick={() => setActiveTool('image')} className="cursor-pointer">🖼️ Image Generation</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTool('deep')} className="cursor-pointer">🔍 Deep Research</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTool('learn')} className="cursor-pointer">🎓 Smart Learning</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveTool('create')} className="cursor-pointer">📄 Create (file / PDF)</DropdownMenuItem>
                        {activeTool && <DropdownMenuItem onClick={() => setActiveTool(null)} className="cursor-pointer text-white/50">✕ Clear tool</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button type="button" disabled={isTyping} onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 rounded-full p-1 text-white/30 hover:text-white transition disabled:opacity-40"><Paperclip className="w-5 h-5" /></button>
                    {activeTool && <button type="button" onClick={() => setActiveTool(null)} className="flex-shrink-0 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-200">{activeTool === 'image' ? 'Image' : activeTool === 'deep' ? 'Deep Research' : activeTool === 'learn' ? 'Smart Learning' : 'Create'} ✕</button>}
                    <Textarea
                      value={inputText}
                      disabled={isTyping}
                      onChange={(e) => { setInputText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px'; }}
                      onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey && !isTyping) { e.preventDefault(); handleSubmit(); } }}
                      placeholder={isListening ? "Listening..." : isTyping ? "ALSA is responding..." : "Message ALSA..."}
                      className="bg-transparent border-none flex-1 px-4 text-sm focus-visible:ring-0 disabled:opacity-50 resize-none overflow-y-auto max-h-[150px] min-h-[40px]"
                      rows={1}
                    />
                    <Mic className={`w-5 h-5 flex-shrink-0 transition cursor-pointer ${isListening ? 'text-red-400 animate-pulse' : 'text-white/40 hover:text-white'}`} onClick={toggleVoice} />
                    <Send className={`w-5 h-5 rounded-full p-1 transition flex-shrink-0 ${isTyping ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'text-black bg-white cursor-pointer hover:scale-110'}`} onClick={() => !isTyping && handleSubmit()} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className={`shrink-0 border-l border-white/5 bg-black/40 backdrop-blur-md transition-all duration-300 ${rightPanelCollapsed ? 'w-[50px]' : 'w-[260px]'}`}>
        <RightPanel user={user} bridgeConnected={bridgeConnected} isListening={isListening} isSpeaking={isSpeaking} toggleVoice={toggleVoice} onOpenMemory={() => setShowMemoryManager(true)} backupKeyActive={backupKeyActive} isCollapsed={rightPanelCollapsed} onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)} />
      </div>
      <Dialog open={showMemoryManager} onOpenChange={setShowMemoryManager}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
          <DialogHeader><DialogTitle className="text-xs tracking-[0.3em] uppercase text-blue-500">Neural Data Bank</DialogTitle></DialogHeader>
          <MemoryManager />
        </DialogContent>
      </Dialog>
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <FileUpload onFilesSelected={handleFilesSelected} maxFiles={10} />
        </DialogContent>
      </Dialog>
      <MusicPlayer song={currentSong} onClose={() => setCurrentSong(null)} />
      <GameLauncher game={currentGame as any} onClose={() => setCurrentGame(null)} />
      <ReminderNotification userId={user?.id || null} />
      <Dialog open={show51Update} onOpenChange={(o) => { setShow51Update(o); if (!o) { try { localStorage.setItem('alsa_seen_update_v51', '1'); } catch { } } }}>
        <DialogContent className="bg-gradient-to-br from-[#0a0a0a] to-[#0d1425] border-blue-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                <Sparkles className="w-4 h-4 text-white" />
              </span>
              Alsa AI 5.1 — What's New
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-white/70">
            <p>A big update just landed. Highlights:</p>
            <ul className="list-disc list-inside space-y-1 text-white/60">
              <li>Send Email by contact name</li>
              <li>Saved contacts for WhatsApp, Telegram & Email</li>
              <li>CSV bulk contact upload</li>
              <li>Faster and more reliable messaging</li>
              <li>Correct location accuracy fallback</li>
              <li>Real-time date awareness & personal memory</li>
              <li>Unified blue brand theme</li>
            </ul>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                try { localStorage.setItem('alsa_seen_update_v51', '1'); } catch { }
                setShow51Update(false);
              }}
            >
              Dismiss
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90"
              onClick={() => {
                try { localStorage.setItem('alsa_seen_update_v51', '1'); } catch { }
                setShow51Update(false);
                navigate('/update-history');
              }}
            >
              See full update history →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
export default Chat;
