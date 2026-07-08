import { useEffect, useRef } from 'react';

interface SiriWaveProps {
  isSpeaking: boolean;
  isListening: boolean;
}

const SiriWave = ({ isSpeaking, isListening }: SiriWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width = canvas.offsetWidth * 2;
    const height = canvas.height = canvas.offsetHeight * 2;
    const centerY = height / 2;

    let phase = 0;
    const waves = [
      { amplitude: 30, frequency: 0.02, color: 'rgba(59, 130, 246, 0.5)' }, // primary
      { amplitude: 20, frequency: 0.03, color: 'rgba(96, 165, 250, 0.4)' }, // primary-glow
      { amplitude: 15, frequency: 0.025, color: 'rgba(147, 197, 253, 0.3)' }, // accent
    ];

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const isActive = isSpeaking || isListening;
      const amplitudeMultiplier = isActive ? 1.5 : 0.3;

      waves.forEach((wave, index) => {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 4;

        for (let x = 0; x < width; x++) {
          const y = centerY + 
            Math.sin(x * wave.frequency + phase + index) * 
            wave.amplitude * amplitudeMultiplier * 
            (1 + Math.sin(phase * 0.5) * 0.3);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      });

      phase += isActive ? 0.08 : 0.02;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking, isListening]);

  return (
    <div className="w-full h-32 relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default SiriWave;
