import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';

interface TranscriptionFeedbackProps {
  transcript: string;
  isListening: boolean;
}

const TranscriptionFeedback = ({ transcript, isListening }: TranscriptionFeedbackProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isListening) {
      setDots('');
      return;
    }
    
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    
    return () => clearInterval(interval);
  }, [isListening]);

  if (!isListening) return null;

  return (
    <div className="w-full max-w-2xl mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Mic className="w-5 h-5 text-primary animate-pulse" />
            <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
          </div>
          <div className="flex-1 min-h-[24px]">
            {transcript ? (
              <p className="text-white font-medium">
                {transcript}
                <span className="text-primary animate-pulse">|</span>
              </p>
            ) : (
              <p className="text-white italic">
                Listening{dots}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-white mt-2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">Alt</kbd>
          <span>+</span>
          <kbd className="px-1.5 py-0.5 bg-secondary rounded text-[10px] font-mono">V</kbd>
          <span className="ml-1">to toggle voice</span>
        </p>
      </div>
    </div>
  );
};

export default TranscriptionFeedback;
