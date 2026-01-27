import { useEffect, useState } from 'react';

interface VoiceOrbProps {
  isListening: boolean;
  isSpeaking: boolean;
}

const VoiceOrb = ({ isListening, isSpeaking }: VoiceOrbProps) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => i));
  }, []);

  return (
    <div className="relative flex items-center justify-center w-80 h-80">
      {/* Outer glow rings */}
      <div className={`absolute inset-0 rounded-full bg-primary/10 blur-3xl transition-all duration-1000 ${
        isListening || isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-40'
      }`} />
      
      {/* Rotating particle ring */}
      <div className="absolute inset-8">
        {particles.map((i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 bg-primary rounded-full transition-all duration-300 ${
              isListening || isSpeaking ? 'opacity-100' : 'opacity-30'
            }`}
            style={{
              left: '50%',
              top: '50%',
              transform: `rotate(${i * 12}deg) translateY(-120px)`,
              animation: isListening || isSpeaking ? 'rotate 8s linear infinite' : 'none',
            }}
          />
        ))}
      </div>

      {/* Main orb */}
      <div className={`relative w-48 h-48 rounded-full transition-all duration-500 ${
        isListening ? 'glow-effect scale-110' : isSpeaking ? 'glow-effect scale-105' : 'scale-100'
      }`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20" />
        <div className={`absolute inset-4 rounded-full bg-primary/30 backdrop-blur-sm ${
          isListening || isSpeaking ? 'animate-pulse-glow' : ''
        }`} />
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 backdrop-blur-md" />
        
        {/* Center dot */}
        <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${
          isListening || isSpeaking ? 'scale-110' : 'scale-100'
        }`}>
          <div className="w-4 h-4 rounded-full bg-primary-foreground" />
        </div>
      </div>

      {/* Corner brackets */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left */}
        <div className={`absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary transition-opacity ${
          isListening || isSpeaking ? 'opacity-100 animate-bracket-pulse' : 'opacity-30'
        }`} />
        {/* Top right */}
        <div className={`absolute top-0 right-0 w-16 h-16 border-r-2 border-t-2 border-primary transition-opacity ${
          isListening || isSpeaking ? 'opacity-100 animate-bracket-pulse' : 'opacity-30'
        }`} />
        {/* Bottom left */}
        <div className={`absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-primary transition-opacity ${
          isListening || isSpeaking ? 'opacity-100 animate-bracket-pulse' : 'opacity-30'
        }`} />
        {/* Bottom right */}
        <div className={`absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary transition-opacity ${
          isListening || isSpeaking ? 'opacity-100 animate-bracket-pulse' : 'opacity-30'
        }`} />
      </div>
    </div>
  );
};

export default VoiceOrb;
