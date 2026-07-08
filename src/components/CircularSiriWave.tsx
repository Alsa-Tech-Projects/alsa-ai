import { useRef, useEffect } from 'react';

interface CircularSiriWaveProps {
  isSpeaking: boolean;
  isListening: boolean;
  size?: number;
}

const CircularSiriWave = ({ isSpeaking, isListening, size = 200 }: CircularSiriWaveProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 25;

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // --- BREATHING LOGIC ---
      // Ek global breathing variable jo sab particles par ek saath apply hoga
      // Isse outline tehdi-medhi nahi hogi
      let breathingFactor = 0;
      if (isListening || isSpeaking) {
        breathingFactor = Math.sin(phaseRef.current * 2) * 8; // 8px ka smooth zoom
      }

      const particleCount = 140; // Particles badha diye smooth circle ke liye
      const baseRadius = radius + breathingFactor; 
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        
        // NO WAVE OFFSET - Isliye outline seedhi rahegi
        const x = centerX + Math.cos(angle) * baseRadius;
        const y = centerY + Math.sin(angle) * baseRadius;
        
        // Sirf particles ka size aur alpha halke se blink karenge "glow" ke liye
        const particleSize = 1.5 + Math.sin(phaseRef.current + i * 0.5) * 0.5;
        const alpha = 0.25 + Math.sin(phaseRef.current + i * 0.2) * 0.15;
        
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Background Inner Glow
      const innerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
      innerGlow.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
      innerGlow.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      ctx.fill();

      // Slow Global Speed
      phaseRef.current += 0.03; 

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isSpeaking, isListening, size]);

  const cssSize = `min(${size}px, 60vw)`;

  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-1000 ease-in-out ${
        isListening || isSpeaking ? 'scale-110' : 'scale-100'
      } max-w-full`}
      style={{ width: cssSize, height: cssSize }}
    >
      <canvas ref={canvasRef} width={size} height={size} className="rounded-full w-full h-full" />
    </div>
  );
};

export default CircularSiriWave;
