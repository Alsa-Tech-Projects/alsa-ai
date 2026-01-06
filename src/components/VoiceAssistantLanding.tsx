import { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Settings, MessageSquare, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { getPersonalizedGreeting } from '@/utils/conversationMemory';

interface VoiceAssistantLandingProps {
  onStartChat: () => void;
  onTranscriptChange?: (text: string) => void;
}

const VoiceAssistantLanding = ({ onStartChat, onTranscriptChange }: VoiceAssistantLandingProps) => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { speak, stop, isSpeaking, currentEmotion } = useTextToSpeech();

  useEffect(() => {
    setGreeting(getPersonalizedGreeting());
  }, []);

  // Update parent with transcript
  useEffect(() => {
    if (transcript && onTranscriptChange) {
      onTranscriptChange(transcript);
    }
  }, [transcript, onTranscriptChange]);

  // Show transcript when listening
  useEffect(() => {
    setShowTranscript(isListening || transcript.length > 0);
  }, [isListening, transcript]);

  // Animate pulse based on listening/speaking state
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening || isSpeaking) {
      interval = setInterval(() => {
        setPulseIntensity(Math.random() * 0.5 + 0.5);
      }, 100);
    } else {
      setPulseIntensity(0);
    }
    return () => clearInterval(interval);
  }, [isListening, isSpeaking]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript) {
        onStartChat();
      }
    } else {
      resetTranscript();
      startListening();
      speak('I am listening');
    }
  }, [isListening, startListening, stopListening, resetTranscript, transcript, speak, onStartChat]);

  // Get emotion color
  const getEmotionColor = () => {
    switch (currentEmotion) {
      case 'happy': return 'from-yellow-400 to-orange-500';
      case 'sad': return 'from-blue-400 to-indigo-600';
      case 'angry': return 'from-red-500 to-rose-600';
      case 'calm': return 'from-green-400 to-teal-500';
      case 'urgent': return 'from-orange-500 to-red-500';
      case 'loving': return 'from-pink-400 to-rose-500';
      case 'surprised': return 'from-purple-400 to-pink-500';
      default: return 'from-primary to-accent';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background via-background to-background/80 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-1000 bg-gradient-to-r ${getEmotionColor()}`} 
          style={{ transform: `scale(${1 + pulseIntensity * 0.3})` }} 
        />
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15 transition-all duration-1000 bg-gradient-to-r ${getEmotionColor()}`}
          style={{ transform: `scale(${1 + pulseIntensity * 0.2})` }} 
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-8">
        {/* Greeting */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2">
            {greeting}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isListening ? 'Listening to you...' : isSpeaking ? 'Speaking...' : 'Tap the orb to start talking'}
          </p>
        </div>

        {/* Animated Voice Orb */}
        <button
          onClick={toggleVoice}
          className="relative group focus:outline-none focus:ring-0"
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {/* Outer glow rings */}
          <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
            isListening || isSpeaking 
              ? `bg-gradient-to-r ${getEmotionColor()} opacity-30 blur-3xl scale-150` 
              : 'bg-primary/10 blur-2xl scale-100 opacity-20'
          }`} />
          
          {/* Pulsing rings */}
          {(isListening || isSpeaking) && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-4 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.5s' }} />
            </>
          )}
          
          {/* Main orb */}
          <div className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full transition-all duration-300 ${
            isListening ? 'scale-110' : isSpeaking ? 'scale-105' : 'scale-100 group-hover:scale-105'
          }`}>
            {/* Gradient background */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${getEmotionColor()} opacity-${isListening || isSpeaking ? '40' : '20'} transition-opacity duration-300`} />
            
            {/* Inner glow */}
            <div className={`absolute inset-4 rounded-full backdrop-blur-sm transition-all duration-300 ${
              isListening || isSpeaking 
                ? 'bg-primary/30 animate-pulse' 
                : 'bg-primary/20 group-hover:bg-primary/25'
            }`} />
            
            {/* Core */}
            <div className={`absolute inset-8 rounded-full bg-gradient-to-br ${getEmotionColor()} opacity-60 backdrop-blur-md transition-all duration-300`} />
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isListening ? (
                <div className="relative">
                  <MicOff className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground drop-shadow-lg" />
                  {/* Audio wave visualization */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-1 bg-primary-foreground rounded-full animate-pulse"
                        style={{ 
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.1}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : isSpeaking ? (
                <Volume2 className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground drop-shadow-lg animate-pulse" />
              ) : (
                <Mic className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground drop-shadow-lg group-hover:scale-110 transition-transform" />
              )}
            </div>
          </div>
          
          {/* Corner brackets */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-primary rounded-tl-lg transition-all ${
              isListening || isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-30'
            }`} />
            <div className={`absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-primary rounded-tr-lg transition-all ${
              isListening || isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-30'
            }`} />
            <div className={`absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-primary rounded-bl-lg transition-all ${
              isListening || isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-30'
            }`} />
            <div className={`absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-primary rounded-br-lg transition-all ${
              isListening || isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-30'
            }`} />
          </div>
        </button>

        {/* Emotion indicator */}
        {currentEmotion !== 'neutral' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-fade-in">
            <span className="capitalize">{currentEmotion}</span>
            <span className="text-xs">mood</span>
          </div>
        )}

        {/* Real-time transcription display */}
        {showTranscript && (
          <div className="w-full max-w-lg bg-card/80 backdrop-blur-md rounded-2xl p-6 border border-border shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {isListening ? 'Listening' : 'Transcript'}
              </span>
            </div>
            <p className="text-lg text-foreground min-h-[60px]">
              {transcript || <span className="text-muted-foreground italic">Speak now...</span>}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-4 mt-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/settings')}
            className="gap-2"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Button>
          
          <Button
            size="lg"
            onClick={onStartChat}
            className="gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Start Chat
          </Button>
        </div>

        {/* Status indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>ALSA AI Ready</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantLanding;
