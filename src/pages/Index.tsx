import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, Settings, Plus, ImageIcon, Paperclip, Menu, X, Video, Camera, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { checkBridgeConnection, executeSystemCommand, scanSystem, SystemScanResult, captureScreenshot, startScreenRecording, stopScreenRecording, parseNaturalLanguage, WEBSITES, createProject, createPowerPoint, createExcel, createDatabase, executePythonFile, executeCmdCommand, runCommand, checkInstallation, sendCommand, adbConnect, adbCommand, closeWindow, openFolder, runProject, createFolder, createTextFile, openWebsiteWithSearch, openCustomApp } from '@/utils/pcBridge';
import ChatMessage from '@/components/ChatMessage';
import MemoryManager from '@/components/MemoryManager';
import TranscriptionFeedback from '@/components/TranscriptionFeedback';
import ReminderNotification from '@/components/ReminderNotification';
import { getMemory, addMemory, parseMemoryCommand, getTimeBasedGreeting } from '@/utils/memoryManager';
import { parseAndLearn, getAIContext, trackInteraction, addConversationSummary } from '@/utils/conversationMemory';
import { parseReminderFromText, createReminder } from '@/utils/reminderManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MusicPlayer } from '@/components/MusicPlayer';
import { GameLauncher } from '@/components/GameLauncher';
import Sidebar from '@/components/Sidebar';
import RightPanel from '@/components/RightPanel';
import CircularSiriWave from '@/components/CircularSiriWave';
import FileUpload from '@/components/FileUpload';
import { useIsMobile } from '@/hooks/use-mobile';
interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64
  preview?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  files?: FileAttachment[];
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { conversationId: urlConversationId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [bridgeConnected, setBridgeConnected] = useState(false);
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
  const [backupKeyActive, setBackupKeyActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSavedPath, setRecordingSavedPath] = useState<string | null>(null);
  const [screenshotPending, setScreenshotPending] = useState(false);

  // Subscription hook for free tier restrictions
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

  // Wrapper for speak that checks if voice is enabled
  const speak = useCallback((text: string) => {
    const voiceEnabled = localStorage.getItem('alsa_voice_enabled') !== 'false';
    if (voiceEnabled) {
      ttsSpeak(text);
    }
  }, [ttsSpeak]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listeningTimeoutRef = useRef<NodeJS.Timeout>();
  const lastProcessedRef = useRef<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle PC Bridge connection
  const toggleBridgeConnection = useCallback(async () => {
    if (bridgeConnected) {
      // Disconnect - just set state, bridge keeps running
      setBridgeConnected(false);
      toast({ title: 'PC Bridge Disconnected', description: 'Click again to reconnect' });
    } else {
      // Try to connect
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

  // Toggle voice with callback - stays open until manually closed
  // DISABLED FOR FREE TIER USERS
  const toggleVoice = useCallback(() => {
    if (subscription.isFree) {
      toast({
        title: 'Premium Feature',
        description: 'Voice commands require Pro or Elite subscription',
        variant: 'destructive'
      });
      navigate('/pricing');
      return;
    }

    if (isListening) {
      stopListening();
      speak('Voice input disabled');
      toast({ title: 'Voice Off', description: 'Press Alt+V to activate again' });
    } else {
      startListening();
      speak('Voice input is now active. Speak your full command.');
      toast({ title: 'Voice Active', description: 'Listening continuously' });
    }
  }, [isListening, startListening, stopListening, speak, toast, subscription.isFree, navigate]);

  // New conversation handler
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    resetTranscript();
    setInputText('');
    setUploadedFiles([]);
    navigate('/');
    speak('Starting a new conversation');
    toast({ title: 'New Chat', description: 'Ready for a new conversation' });
  }, [resetTranscript, speak, toast, navigate]);

  // Screenshot handler
  const handleScreenshot = useCallback(async () => {
    const result = await captureScreenshot();
    toast({
      title: result.success ? 'Screenshot Captured' : 'Screenshot Failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive'
    });
    if (result.success) {
      speak('Screenshot captured successfully');
    }
  }, [toast, speak]);

  // Screen recording handler - DISABLED FOR FREE TIER USERS
  const handleRecording = useCallback(async () => {
    if (subscription.isFree) {
      toast({
        title: 'Premium Feature',
        description: 'Screen recording requires Pro or Elite subscription',
        variant: 'destructive'
      });
      navigate('/pricing');
      return;
    }

    if (isRecording) {
      const result = await stopScreenRecording();
      setIsRecording(false);
      toast({
        title: 'Recording Stopped',
        description: result.message
      });
      speak('Recording stopped and saved');
    } else {
      setRecordingSavedPath(null); // Clear previous path
      const result = await startScreenRecording(60); // 60 seconds max
      if (result.success) {
        setIsRecording(true);
        toast({
          title: 'Recording Started',
          description: 'Recording for up to 60 seconds'
        });
        speak('Screen recording started');
      } else {
        toast({
          title: 'Recording Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    }
  }, [isRecording, toast, speak, subscription.isFree, navigate]);

  // Listen for recording saved event
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

  // Keyboard shortcuts: Alt+V for voice, Ctrl+Shift+O for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+V for voice toggle
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        toggleVoice();
        return;
      }

      // Ctrl+Shift+O for new conversation
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewConversation();
        return;
      }

      // Ctrl+Shift+S for screenshot
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleScreenshot();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVoice, handleNewConversation, handleScreenshot]);

  // Auth state management - redirect unauthenticated users to landing
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate('/landing');
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate('/landing');
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load conversation from URL param
  useEffect(() => {
    const loadConversation = async () => {
      const convId = urlConversationId || location.state?.conversationId;
      if (!convId || !user) return;

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (data && data.length > 0) {
          setMessages(data.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })));
          setCurrentConversationId(convId);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };

    loadConversation();
  }, [urlConversationId, location.state, user]);

  // Initial greeting
  useEffect(() => {
    if (!hasGreeted && messages.length === 0) {
      const greeting = getTimeBasedGreeting();
      const fullGreeting = `${greeting}! I'm ALSA, your AI assistant. How can I help you today?`;
      setHasGreeted(true);
    }
  }, [hasGreeted, messages.length]);

  // Check bridge connection on mount
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
    };

    checkBridge();
    const interval = setInterval(checkBridge, 30000);
    return () => clearInterval(interval);
  }, [systemData]);

  // Voice command processing
  useEffect(() => {
    if (!isListening) return;
    const currentText = transcript.trim();
    if (!currentText) return;

    setInputText(currentText);

    if (listeningTimeoutRef.current) {
      clearTimeout(listeningTimeoutRef.current);
    }

    const lowerText = currentText.toLowerCase();

    // Voice control commands
    if (lowerText === 'stop listening' || lowerText === 'voice off') {
      listeningTimeoutRef.current = setTimeout(() => {
        speak('Voice input disabled');
        stopListening();
        setInputText('');
      }, 500);
      return;
    }

    // Process full commands after 3 seconds of silence
    if (currentText.length > 5) {
      listeningTimeoutRef.current = setTimeout(() => {
        if (currentText === lastProcessedRef.current) return;
        lastProcessedRef.current = currentText;

        handleSubmit(currentText);
        setInputText('');
        resetTranscript();

        setTimeout(() => {
          lastProcessedRef.current = '';
        }, 2000);
      }, 3000);
    }
  }, [transcript, isListening, stopListening]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

        navigate(`/c/${conversationId}`, { replace: true });
      } else {
        await supabase
          .from('conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', conversationId);
      }

      await supabase.from('chat_messages').insert([
        { conversation_id: conversationId, role: 'user', content: userMsg.content },
        { conversation_id: conversationId, role: 'assistant', content: assistantMsg.content }
      ]);
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  const handleFilesSelected = (files: any[]) => {
    // files from FileUpload component have { name, type, size, data, preview }
    const attachments: FileAttachment[] = files.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      data: f.data || '',
      preview: f.preview
    }));
    setUploadedFiles(prev => [...prev, ...attachments].slice(0, 10)); // Max 10 files
    setShowFileUpload(false);
  };

  const handleSubmit = async (text: string = inputText) => {
    if (!text.trim() && uploadedFiles.length === 0) return;

    // Check 50 message/day limit for free tier users
    if (subscription.isFree && !subscription.canSendMessage) {
      toast({
        title: 'Daily Limit Reached',
        description: 'Free tier is limited to 50 messages/day. Upgrade for unlimited access!',
        variant: 'destructive'
      });
      navigate('/pricing');
      return;
    }

    // Increment message count for free users
    if (subscription.isFree) {
      subscription.incrementMessageCount();
    }

    const userMessage: Message = { role: 'user', content: text, files: uploadedFiles };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setUploadedFiles([]);

    const lowerText = text.toLowerCase();

    // Learn from user message for conversation memory
    parseAndLearn(text);
    trackInteraction(text);

    // Handle memory commands
    const memoryData = parseMemoryCommand(text);
    if (memoryData) {
      addMemory(memoryData.key, memoryData.value);
      const response = `Memory saved! ${memoryData.key.replace(/_/g, ' ')}: ${memoryData.value}`;
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      speak(response);
      return;
    }

    // Handle reminder commands - check if user wants to set a reminder
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
          // createReminder signature: (userId, title, reminderTime, description?)
          await createReminder(user.id, reminderData.title, reminderData.time, reminderData.description);
          const timeStr = reminderData.time.toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
          });
          const response = `⏰ Reminder set!\n\n**${reminderData.title}**\n📅 ${timeStr}\n\nI'll notify you 1 hour before and when it's time! 🔔`;
          setMessages(prev => [...prev, { role: 'assistant', content: response }]);
          speak(`Reminder set for ${reminderData.title}`);
          if (user) {
            await saveConversation(userMessage, { role: 'assistant', content: response });
          }
          return;
        } catch (error) {
          console.error('Error creating reminder:', error);
        }
      }
    }

    // Check for PC Bridge commands using natural language parser
    const parsedCommand = parseNaturalLanguage(text);
    if (parsedCommand && bridgeConnected) {
      try {
        const result = await executeSystemCommand(text);
        const response = result.success
          ? `✅ ${result.message}${result.output ? `\n\`\`\`\n${result.output}\n\`\`\`` : ''}`
          : `❌ ${result.message}`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        speak(result.success ? result.message : 'Command failed');
        if (user) {
          await saveConversation(userMessage, { role: 'assistant', content: response });
        }
        return;
      } catch (error: any) {
        const errorMsg = error.message || 'Failed to execute command';
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }]);
        return;
      }
    }

    // Check for website opening - STRICT: Only open when user says EXACT "open [website name]" or "kholo" 
    // Patterns: "open youtube", "youtube kholo", "youtube open karo", "twitter ko open karo"
    const openWebsitePatterns = [
      /\b(open|launch|start)\s+(\w+)\b/i,  // "open youtube"
      /\b(\w+)\s+(kholo|kholna|open\s+karo|ko\s+open\s+karo)\b/i,  // "youtube kholo"
    ];

    // Check for custom user sites first
    const userSites = JSON.parse(localStorage.getItem('alsa_user_sites') || '[]');
    for (const site of userSites) {
      const sitePattern = new RegExp(`\\b(open|kholo|launch)\\s+${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b|\\b${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(kholo|open\\s+karo)\\b`, 'i');
      if (sitePattern.test(lowerText)) {
        const response = `Opening ${site.name}`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        speak(response);
        setTimeout(() => window.open(site.url, '_blank'), 500);
        if (user) {
          await saveConversation(userMessage, { role: 'assistant', content: response });
        }
        return;
      }
    }

    // Check built-in websites - ONLY with explicit open command
    for (const [key, site] of Object.entries(WEBSITES)) {
      // Strict patterns that require explicit open intent
      const strictPatterns = [
        new RegExp(`\\b(open|launch|start|visit)\\s+${key}\\b`, 'i'),
        new RegExp(`\\b(open|launch|start|visit)\\s+${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
        new RegExp(`\\b${key}\\s+(kholo|kholna|open\\s+karo|ko\\s+open\\s+karo)\\b`, 'i'),
        new RegExp(`\\b${site.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(kholo|kholna|open\\s+karo)\\b`, 'i'),
      ];

      const shouldOpen = strictPatterns.some(pattern => pattern.test(lowerText));

      if (shouldOpen) {
        // Skip if it's an app keyword (don't open website when user wants local app)
        const appKeywords = ['file explorer', 'explorer', 'notepad', 'word', 'excel', 'powerpoint', 'paint', 'calculator', 'cmd', 'terminal', 'antigravity'];
        const looksLikeAppCommand = appKeywords.some(app => lowerText.includes(app));

        if (looksLikeAppCommand) {
          continue; // Let PC Bridge handle local apps
        }

        const response = `Opening ${site.name}`;
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        speak(response);
        setTimeout(() => window.open(site.url, '_blank'), 500);
        if (user) {
          await saveConversation(userMessage, { role: 'assistant', content: response });
        }
        return;
      }
    }

    // Call AI with streaming via edge function
    try {
      setIsTyping(true);
      const memory = getMemory();
      const telegramContacts = JSON.parse(localStorage.getItem('telegramContacts') || '[]');
      const whatsappContacts = JSON.parse(localStorage.getItem('whatsappContacts') || '[]');

      // API endpoint
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
            files: m.files // Include file attachments for multimodal analysis
          })),
          memory,
          telegramContacts: telegramContacts, // <--- Ye zaruri hai
          whatsappContacts: whatsappContacts, // <--- Ye zaruri hai
          conversationContext: getAIContext(), // Add conversation memory context
          ai_response_style: localStorage.getItem('alsa_ai_response_style') || 'balanced'
        })
      });

      if (!response.ok) {
        const errorStatus = response.status;

        // Try backup API key if available (for 429, 402, 500 errors)
        if ([429, 402, 500, 503].includes(errorStatus)) {
          const savedKeys = localStorage.getItem('alsa_backup_api_keys');
          if (savedKeys) {
            const keys = JSON.parse(savedKeys);
            const geminiKey = keys.find((k: any) =>
              k.name.toLowerCase().includes('gemini') ||
              k.name.toLowerCase().includes('google')
            );

            if (geminiKey) {
              setBackupKeyActive(true);
              toast({
                title: 'Using Backup API Key',
                description: `Primary API unavailable (${errorStatus}). Using your backup Gemini key.`
              });

              // Call Gemini API directly with backup key
              const backupResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey.key}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [...messages, userMessage].map(m => ({
                      role: m.role === 'assistant' ? 'model' : 'user',
                      parts: [{ text: m.content }]
                    })),
                    generationConfig: { temperature: 0.7 }
                  })
                }
              );

              if (backupResponse.ok) {
                const backupData = await backupResponse.json();
                const backupText = backupData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from backup API';

                setMessages(prev => [...prev, { role: 'assistant', content: backupText }]);
                speak(backupText);
                setIsTyping(false);
                setBackupKeyActive(false);

                if (user) {
                  await saveConversation(userMessage, { role: 'assistant', content: backupText });
                }
                return;
              }
            }
          }
        }

        throw new Error(`API error: ${errorStatus}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

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
            if (parsed.type === 'content' && parsed.delta) {
              accumulatedText += parsed.delta;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = accumulatedText;
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
              // Execute project creation via PC Bridge
              const result = await createProject(parsed.project_path, parsed.files);
              const statusMsg = result.success
                ? `✅ Project created at ${parsed.project_path}`
                : `❌ Failed to create project: ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  lastMsg.content = accumulatedText;
                }
                return newMessages;
              });
              speak(result.success ? 'Project created successfully' : 'Project creation failed');
            } else if (parsed.type === 'create_powerpoint') {
              const result = await createPowerPoint(parsed.file_path, parsed.title, parsed.slides, parsed.theme);
              const statusMsg = result.success
                ? `✅ PowerPoint created: ${result.file_path || parsed.file_path}`
                : `❌ Failed: ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
              speak(result.success ? 'Presentation created' : 'Failed to create presentation');
            } else if (parsed.type === 'create_excel') {
              const result = await createExcel(parsed.file_path, parsed.sheet_name, parsed.headers, parsed.data, parsed.formatting);
              const statusMsg = result.success
                ? `✅ Excel file created: ${result.file_path || parsed.file_path}`
                : `❌ Failed: ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
              speak(result.success ? 'Excel file created' : 'Failed to create Excel');
            } else if (parsed.type === 'create_database') {
              const result = await createDatabase(parsed.file_path, parsed.db_type, parsed.tables);
              const statusMsg = result.success
                ? `✅ Database created: ${result.file_path || parsed.file_path}`
                : `❌ Failed: ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
              speak(result.success ? 'Database created' : 'Failed to create database');
            } else if (parsed.type === 'execute_python') {
              const result = await executePythonFile(parsed.file_path);
              const statusMsg = result.success
                ? `✅ Python executed:\n\`\`\`\n${result.output || 'No output'}\n\`\`\``
                : `❌ Failed: ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
            } else if (parsed.type === 'execute_cmd') {
              const result = await executeCmdCommand(parsed.command);
              const statusMsg = result.success
                ? `✅ Command output:\n\`\`\`\n${result.output || 'No output'}\n\`\`\``
                : `❌ Failed: ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
            } else if (parsed.type === 'system_power') {
              const result = await sendCommand(parsed.action); // shutdown, restart, sleep
              const statusMsg = result.success
                ? `✅ ${result.message}`
                : `❌ ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
              speak(result.message);
            } else if (parsed.type === 'run_application') {
              const result = await runCommand(parsed.command);
              const statusMsg = result.success
                ? `✅ Opened ${parsed.command}`
                : `❌ ${result.message}`;
              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });

              // --- Ye wala part loop ke andar niche add karo ---

            } else if (parsed.type === 'telegram_msg') {
              // Ye function pcBridge.ts se call hoga
              const result = await sendCommand(`telegram-msg`, { link: parsed.link, message: parsed.message });
              const statusMsg = result.success
                ? `✅ Telegram message sent to ${parsed.link}`
                : `❌ Failed to send Telegram: ${result.message}`;

              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
              speak(result.success ? "Telegram message sent" : "Failed to send message");

            } else if (parsed.type === 'whatsapp_msg') {
              const result = await sendCommand(`whatsapp-msg`, { phone: parsed.phone, message: parsed.message });
              const statusMsg = result.success
                ? `✅ WhatsApp message sent to ${parsed.phone}`
                : `❌ Failed to send WhatsApp: ${result.message}`;

              accumulatedText += `\n\n${statusMsg}`;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
                return newMessages;
              });
              speak(result.success ? "WhatsApp message sent" : "Failed to send message");
            }

          } else if (parsed.type === 'capture_screenshot') {
            const outputPaths = JSON.parse(localStorage.getItem('alsa_output_paths') || '{}');
            const savePath = parsed.save_path || outputPaths.screenshot || undefined;
            const result = await captureScreenshot(savePath, parsed.delay_seconds);
            const statusMsg = result.success
              ? `✅ Screenshot saved: ${result.path || savePath}`
              : `❌ ${result.message}`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
            speak(result.success ? 'Screenshot captured' : 'Screenshot failed');
          } else if (parsed.type === 'close_window') {
            const result = await closeWindow(parsed.window_name);
            const statusMsg = result.success
              ? `✅ Closed ${parsed.window_name}`
              : `❌ ${result.message}`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
          } else if (parsed.type === 'check_software') {
            const result = await checkInstallation(parsed.software);
            const statusMsg = result.installed
              ? `✅ ${parsed.software} is installed${result.version ? ` (${result.version})` : ''}`
              : `❌ ${parsed.software} is not installed`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
          } else if (parsed.type === 'adb_connect') {
            const result = await adbConnect(parsed.ip_address);
            const statusMsg = result.success
              ? `✅ ADB connected${parsed.ip_address ? ` to ${parsed.ip_address}` : ''}\n\`\`\`\n${result.output || ''}\n\`\`\``
              : `❌ ADB connection failed`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
          } else if (parsed.type === 'adb_command') {
            const result = await adbCommand(parsed.command);
            const statusMsg = result.success
              ? `✅ ADB command output:\n\`\`\`\n${result.output || 'No output'}\n\`\`\``
              : `❌ ADB command failed`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
          } else if (parsed.type === 'run_project') {
            // Ask user for confirmation before running
            const confirmMsg = `Do you want me to run this ${parsed.project_type} project at ${parsed.project_path} on your local machine? I'll install dependencies and start the server.`;
            accumulatedText += `\n\n${confirmMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });

            // Execute project run
            const result = await runProject(parsed.project_path, parsed.project_type);
            const statusMsg = result.success
              ? `✅ ${result.message}${result.output ? `\n\`\`\`\n${result.output}\n\`\`\`` : ''}`
              : `❌ ${result.message}`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
            speak(result.success ? 'Project is running' : 'Failed to run project');
          } else if (parsed.type === 'create_folder') {
            const result = await createFolder(parsed.folder_path);
            const statusMsg = result.success
              ? `✅ Folder created: ${parsed.folder_path}`
              : `❌ ${result.message}`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
            speak(result.success ? 'Folder created' : 'Failed to create folder');
          } else if (parsed.type === 'create_text_file') {
            const result = await createTextFile(parsed.file_path, parsed.content);
            const statusMsg = result.success
              ? `✅ File created: ${parsed.file_path}`
              : `❌ ${result.message}`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
            speak(result.success ? 'File created' : 'Failed to create file');
          } else if (parsed.type === 'open_website_with_search') {
            openWebsiteWithSearch(parsed.platform, parsed.search_query);
            const statusMsg = `✅ Opening ${parsed.platform} with search: "${parsed.search_query}"`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
            speak(`Opening ${parsed.platform} with search ${parsed.search_query}`);
          } else if (parsed.type === 'open_custom_app') {
            const result = await openCustomApp(parsed.app_name);
            const statusMsg = result.success
              ? `✅ Opened ${parsed.app_name}`
              : `❌ ${result.message}`;
            accumulatedText += `\n\n${statusMsg}`;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg?.role === 'assistant') lastMsg.content = accumulatedText;
              return newMessages;
            });
            speak(result.success ? `Opened ${parsed.app_name}` : 'Failed to open app');
          }
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }

      setIsTyping(false);
    setBackupKeyActive(false);

    if (accumulatedText.trim()) {
      speak(accumulatedText);
      if (user) {
        await saveConversation(userMessage, { role: 'assistant', content: accumulatedText });
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    setIsTyping(false);
    setBackupKeyActive(false);

    const errorMessage = `❌ I'm having trouble responding right now. Please try again or contact support at support@alsa-ai.in for assistance.`;
    setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);

    toast({
      title: "AI Response Error",
      description: "Something went wrong. Contact support@alsa-ai.in if the issue persists.",
      variant: "destructive"
    });
  }
};

const hasMessages = messages.length > 0;

// Mobile UI
if (isMobile) {
  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d0d0d] text-white overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowSidebar(true)}
          className="text-white/60"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-sm font-bold tracking-wider text-blue-400">ALSA</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowRightPanel(true)}
          className="text-white/60"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {!hasMessages && (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
                ALSA CORE
              </h1>
              <p className="text-blue-500/50 font-mono text-[8px] uppercase tracking-[0.3em] mt-2">
                Neural Link Active
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <ChatMessage key={i} role={m.role} content={m.content} />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 ml-4">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      {/* Mobile Input */}
      <div className="p-3 border-t border-white/5 bg-black/60 backdrop-blur-xl">
        {uploadedFiles.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {uploadedFiles.map((f, i) => (
              <span key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded-full flex items-center gap-1">
                {f.name.slice(0, 15)}...
                <X className="w-3 h-3 cursor-pointer" onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} />
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(true)}
            className="text-white/40"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Message ALSA..."
            className="flex-1 bg-white/5 border-white/10 text-white text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={isListening ? 'text-red-400' : 'text-white/40'}
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => handleSubmit()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setShowSidebar(false)}>
          <div className="w-72 h-full" onClick={e => e.stopPropagation()}>
            <Sidebar
              bridgeConnected={bridgeConnected}
              onNewChat={handleNewConversation}
              onOpenMemory={() => setShowMemoryManager(true)}
              currentConversationId={currentConversationId}
            />
          </div>
        </div>
      )}

      {/* Mobile Right Panel Overlay */}
      {showRightPanel && (
        <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setShowRightPanel(false)}>
          <div className="w-72 h-full ml-auto" onClick={e => e.stopPropagation()}>
            <RightPanel
              user={user}
              bridgeConnected={bridgeConnected}
              isListening={isListening}
              isSpeaking={isSpeaking}
              toggleVoice={toggleVoice}
              onOpenMemory={() => setShowMemoryManager(true)}
              backupKeyActive={backupKeyActive}
            />
          </div>
        </div>
      )}

      {/* File Upload Dialog */}
      <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <FileUpload onFilesSelected={handleFilesSelected} maxFiles={10} />
        </DialogContent>
      </Dialog>

      {/* Memory Manager */}
      <Dialog open={showMemoryManager} onOpenChange={setShowMemoryManager}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xs uppercase tracking-[0.3em] text-blue-500 font-bold">Neural Data Bank</DialogTitle>
          </DialogHeader>
          <MemoryManager />
        </DialogContent>
      </Dialog>

      {isListening && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
          <TranscriptionFeedback transcript={transcript} isListening={isListening} />
        </div>
      )}

      <MusicPlayer song={currentSong} onClose={() => setCurrentSong(null)} />
      <GameLauncher game={currentGame as any} onClose={() => setCurrentGame(null)} />
    </div>
  );
}
// ================= DESKTOP UI =================
return (
  <div className="flex h-screen w-screen bg-[#0d0d0d] text-white overflow-hidden">
    {/* ========== SIDEBAR / LEFT PANEL ========= */}
    <Sidebar
      bridgeConnected={bridgeConnected}
      onNewChat={handleNewConversation}
      onOpenMemory={() => setShowMemoryManager(true)}
      onToggleBridge={toggleBridgeConnection}
      currentConversationId={currentConversationId}
    />

    {/* ========== CENTER CHAT AREA ========= */}
    <div className="flex-[1_1_0%] min-w-0 relative flex flex-col overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(0,0,0,1)_100%)]" />

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* EMPTY STATE */}
        {!messages.length ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">
              ALSA CORE
            </h1>
            <p className="mt-3 text-blue-500/50 font-mono text-[10px] tracking-[0.5em] uppercase">
              From Chat To Execution Version1
            </p>

            <div className="mt-14 w-full max-w-2xl">
              <div className="flex items-center bg-black/50 border border-white/10 rounded-2xl px-6 py-4 backdrop-blur-xl">
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Enter Command..."
                  className="bg-transparent border-none text-white text-xl flex-1 focus-visible:ring-0"
                />
                <Send
                  className="w-6 h-6 cursor-pointer hover:text-blue-400 transition-colors"
                  onClick={() => handleSubmit()}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* CHAT MESSAGES */}
            <ScrollArea className="flex-1 px-6">
              <div className="max-w-5xl mx-auto py-12 space-y-10">
                {messages.map((m, i) => (
                  <ChatMessage key={i} role={m.role} content={m.content} />
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
            </ScrollArea>

            {/* INPUT BAR (DURING CHAT) */}
            <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="max-w-5xl mx-auto flex items-center bg-[#1a1a1a]/80 border border-white/10 rounded-2xl px-5 py-3 backdrop-blur-xl">
                <Plus
                  className="w-5 h-5 text-white/30 hover:text-white cursor-pointer"
                  onClick={() => setShowFileUpload(true)}
                />
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="Message ALSA..."
                  className="bg-transparent border-none flex-1 px-4 text-sm focus-visible:ring-0"
                />
                <Send
                  className="w-5 h-5 text-black bg-white rounded-full p-1 cursor-pointer hover:scale-110 transition"
                  onClick={() => handleSubmit()}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>

    {/* ========== RIGHT PANEL ========= */}
    <div className={`shrink-0 border-l border-white/5 bg-black/40 backdrop-blur-md transition-all duration-300 ${rightPanelCollapsed ? 'w-[50px]' : 'w-[260px]'}`}>
      <RightPanel
        user={user}
        bridgeConnected={bridgeConnected}
        isListening={isListening}
        isSpeaking={isSpeaking}
        toggleVoice={toggleVoice}
        onOpenMemory={() => setShowMemoryManager(true)}
        backupKeyActive={backupKeyActive}
        isCollapsed={rightPanelCollapsed}
        onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
      />
    </div>

    {/* ========== ALL MODALS & OVERLAYS ========= */}

    {/* Memory Manager Modal */}
    <Dialog open={showMemoryManager} onOpenChange={setShowMemoryManager}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xs tracking-[0.3em] uppercase text-blue-500">
            Neural Data Bank
          </DialogTitle>
        </DialogHeader>
        <MemoryManager />
      </DialogContent>
    </Dialog>

    {/* File Upload Modal */}
    <Dialog open={showFileUpload} onOpenChange={setShowFileUpload}>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white">
        <FileUpload onFilesSelected={handleFilesSelected} maxFiles={10} />
      </DialogContent>
    </Dialog>

    {/* Players & Tools */}
    <MusicPlayer song={currentSong} onClose={() => setCurrentSong(null)} />
    <GameLauncher game={currentGame as any} onClose={() => setCurrentGame(null)} />

    {/* Reminder Notification System */}
    <ReminderNotification userId={user?.id || null} />

    {/* Voice Overlay */}
    {isListening && (
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-50">
        <TranscriptionFeedback transcript={transcript} isListening={isListening} />
      </div>
    )}
  </div>
);

};

export default Index;
