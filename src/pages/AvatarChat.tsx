import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, ArrowLeft, Crown, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { isAdminEmail } from '@/utils/adminConfig';
import miraSilent from '@/assets/mira-silent.gif';
import miraSpeaking from '@/assets/mira-speaking.gif';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const AvatarChat = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isElite, isTeam, loading: subLoading } = useSubscription();

  const [adminEmail, setAdminEmail] = useState(false);
  const [history, setHistory] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [lastReply, setLastReply] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [blink, setBlink] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSentRef = useRef('');
  const silenceTimerRef = useRef<number | null>(null);

  const { transcript, isListening, startListening, stopListening, resetTranscript } =
    useSpeechRecognition(isSpeaking);

  // Load user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdminEmail(isAdminEmail(session?.user?.email));
    });
  }, []);

  // Natural blink loop
  useEffect(() => {
    let timeout: number;
    const loop = () => {
      setBlink(true);
      window.setTimeout(() => setBlink(false), 140);
      timeout = window.setTimeout(loop, 2500 + Math.random() * 2500);
    };
    timeout = window.setTimeout(loop, 1500);
    return () => window.clearTimeout(timeout);
  }, []);

  const hasAccess = isElite || isTeam || adminEmail;

  // Auto-send after silence
  useEffect(() => {
    if (!transcript || isSpeaking || thinking) return;
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = window.setTimeout(() => {
      const text = transcript.trim();
      if (text && text !== lastSentRef.current) {
        lastSentRef.current = text;
        sendMessage(text);
      }
    }, 1200);
    return () => {
      if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, isSpeaking, thinking]);

  const playDeepgram = async (text: string) => {
    if (muted) return;
    try {
      const { data, error } = await supabase.functions.invoke('mira-tts', {
        body: { text },
      });
      if (error) throw error;
      const base64 = (data as any)?.audio;
      if (!base64) throw new Error('No audio returned');

      // Stop listening while Mira speaks
      if (isListening) stopListening();

      const blob = await (await fetch(`data:audio/mpeg;base64,${base64}`)).blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e: any) {
      console.error('TTS failed', e);
      setIsSpeaking(false);
      toast({ title: 'Voice failed', description: e?.message || 'Could not play voice', variant: 'destructive' });
    }
  };

  const stopSpeak = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const sendMessage = async (text: string) => {
    setThinking(true);
    const newHistory: Turn[] = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    resetTranscript();

    try {
      const { data, error } = await supabase.functions.invoke('avatar-chat', {
        body: { message: text, history: newHistory.slice(0, -1) },
      });
      if (error) throw error;
      const reply = (data as any)?.reply || "Sorry, I didn't quite catch that.";
      setHistory((h) => [...h, { role: 'assistant', content: reply }]);
      setLastReply(reply);
      await playDeepgram(reply);
    } catch (e: any) {
      toast({ title: 'Mira is offline', description: e?.message || 'Try again', variant: 'destructive' });
    } finally {
      setThinking(false);
    }
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else {
      if (isSpeaking) stopSpeak();
      startListening();
    }
  };

  const toggleMute = () => {
    if (!muted) stopSpeak();
    setMuted(!muted);
  };

  if (subLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 mx-auto flex items-center justify-center">
            <Crown className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold">Mira is Elite-only</h1>
          <p className="text-white/60">
            Avatar Chat with Mira (Alsa AI's voice companion) is available to Elite members only.
          </p>
          <Button
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
          >
            Upgrade to Elite
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-white/60">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/70">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Mira</h1>
          <p className="text-xs text-white/50">Alsa AI · Avatar Mode</p>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white/70">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Avatar stage */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6 sm:gap-8">
        <MiraAvatar
          isSpeaking={isSpeaking}
          isListening={isListening}
          thinking={thinking}
          blink={blink}
        />

        {/* Status text */}
        <div className="text-center min-h-[60px] max-w-md w-full px-4">
          {thinking ? (
            <p className="text-white/60 text-sm animate-pulse">Mira is thinking...</p>
          ) : isSpeaking ? (
            <p className="text-purple-300 text-sm leading-relaxed">{lastReply}</p>
          ) : isListening ? (
            <p className="text-blue-300 text-sm">{transcript || 'Listening...'}</p>
          ) : (
            <p className="text-white/40 text-sm">Tap the mic and start talking to Mira</p>
          )}
        </div>

        {/* Mic Button */}
        <button
          onClick={toggleMic}
          disabled={isSpeaking}
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center transition-all ${
            isListening
              ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-[0_0_40px_rgba(236,72,153,0.5)]'
              : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_0_30px_rgba(59,130,246,0.4)]'
          } ${isSpeaking ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          {isListening && (
            <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
          )}
        </button>

        <p className="text-[10px] text-white/30 uppercase tracking-widest text-center px-4">
          {isSpeaking ? 'Mic locked while Mira speaks' : 'English · Alsa Ai Mira Voice'}
        </p>
      </div>
    </div>
  );
};

export default AvatarChat;

// ====== Animated Avatar — 3-frame lip sync + blink ======
const MiraAvatar = ({
  isSpeaking,
  isListening,
  thinking,
  blink,
}: {
  isSpeaking: boolean;
  isListening: boolean;
  thinking: boolean;
  blink: boolean;
}) => {
  const ringColor = isSpeaking
    ? 'from-purple-500 via-pink-500 to-purple-500'
    : isListening
    ? 'from-blue-500 via-cyan-400 to-blue-500'
    : thinking
    ? 'from-amber-500 via-orange-500 to-amber-500'
    : 'from-white/10 via-white/20 to-white/10';

  const src = isSpeaking ? miraSpeaking : miraSilent;

  return (
    <div className="relative w-[min(280px,75vw)] sm:w-[min(340px,50vw)] md:w-[380px] aspect-square">
      {/* Glowing ring */}
      <div
        className={`absolute -inset-3 rounded-full bg-gradient-to-tr ${ringColor} ${
          isSpeaking || isListening ? 'animate-spin-slow opacity-80' : 'opacity-40'
        } blur-xl`}
      />
      <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr ${ringColor} opacity-60`} />

      {/* Avatar with breathing */}
      <div
        className={`relative w-full h-full rounded-full overflow-hidden border-2 border-white/10 bg-[#1a1a1a] transition-transform duration-700 ${
          isSpeaking ? 'scale-[1.02]' : isListening ? 'scale-[1.01]' : 'scale-100'
        }`}
        style={{ animation: 'breathe 4s ease-in-out infinite' }}
      >
        {/* Preload both gifs so swap is instant */}
        <img src={miraSilent} alt="" className="hidden" aria-hidden />
        <img src={miraSpeaking} alt="" className="hidden" aria-hidden />

        <img
          src={src}
          alt="Mira"
          className="w-full h-full object-cover select-none"
          draggable={false}
        />
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
        @keyframes spin-slow {
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
      `}</style>
    </div>
  );
};
