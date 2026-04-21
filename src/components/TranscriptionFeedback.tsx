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
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-white animate-pulse" />
        <p className="text-white text-sm italic">
          Listening{dots}
        </p>
      </div>
      <p className="text-xs text-white/70 flex items-center gap-1">
        <kbd className="text-[10px]">Alt</kbd>
        <span>+</span>
        <kbd className="text-[10px]">V</kbd>
        <span>to toggle voice</span>
      </p>
    </div>
  );
};

export default TranscriptionFeedback;
