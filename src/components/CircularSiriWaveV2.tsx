// src/components/CircularSiriWaveV2.tsx
import React, { useEffect, useRef } from 'react';

export interface CircularSiriWaveProps {
    isListening: boolean;
    isSpeaking: boolean;
    size?: number;
}

// Cosmic Blue Theme
const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#38BDF8'];
const PARTICLE_COUNT = 400; // ⚡ Mobile-optimized count (1200 was freezing the main thread)

const randomGaussian = () => {
    let rand = 0;
    for (let i = 0; i < 6; i += 1) rand += Math.random();
    return (rand - 3) / 3;
};

class Particle {
    angle: number;
    baseRadiusOffset: number;
    size: number;
    color: string;
    speed: number;
    alpha: number;
    wobbleSpeed: number;
    wobbleOffset: number;
    // ⚡ Pre-calculated RGB variables to avoid runtime processing
    r: number;
    g: number;
    b: number;

    constructor(ringThickness: number) {
        this.angle = Math.random() * Math.PI * 2;
        this.baseRadiusOffset = randomGaussian() * ringThickness;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.speed = (Math.random() * 0.002) + 0.0005;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.wobbleSpeed = Math.random() * 0.002 + 0.001;
        this.wobbleOffset = Math.random() * Math.PI * 2;

        // ⚡ Hex to RGB parsing done ONLY ONCE during initialization
        const hex = this.color.replace('#', '');
        this.r = parseInt(hex.substring(0, 2), 16);
        this.g = parseInt(hex.substring(2, 4), 16);
        this.b = parseInt(hex.substring(4, 6), 16);
    }

    update(
        time: number,
        energy: number,
        baseRadius: number,
        breathingScale: number,
        pulseScale: number
    ) {
        this.angle += this.speed * (1 + energy * 4);

        const wobble = Math.sin(time * this.wobbleSpeed + this.wobbleOffset) * (3 * energy + 1);
        const activeRadius = baseRadius * breathingScale * pulseScale;
        const currentRadius = activeRadius + (this.baseRadiusOffset * (1 + energy)) + wobble;

        return {
            x: Math.cos(this.angle) * currentRadius,
            y: Math.sin(this.angle) * currentRadius,
            alpha: this.alpha * (0.5 + energy * 0.5)
        };
    }
}

const CircularSiriWaveV2: React.FC<CircularSiriWaveProps> = ({
    isListening,
    isSpeaking,
    size = 300
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        ctx.scale(dpr, dpr);

        const center = size / 2;
        const baseRadius = size * 0.28; 
        const ringThickness = size * 0.15;

        const particles: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle(ringThickness));
        }

        let animationFrameId: number;
        let currentEnergy = 0;
        let targetEnergy = 0;
        
        const lerp = (start: number, end: number, factor: number) => {
            return start + (end - start) * factor;
        };

        const render = (time: number) => {
            if (isSpeaking) {
                targetEnergy = 1.0;
            } else if (isListening) {
                targetEnergy = 0.5;
            } else {
                targetEnergy = 0.1;
            }

            currentEnergy = lerp(currentEnergy, targetEnergy, 0.05);

            ctx.clearRect(0, 0, size, size);
            ctx.globalCompositeOperation = 'lighter';

            const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, baseRadius * 1.5);
            const coreAlpha = 0.05 + (currentEnergy * 0.1);
            coreGradient.addColorStop(0, `rgba(59, 130, 246, ${coreAlpha})`);
            coreGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            
            ctx.beginPath();
            ctx.arc(center, center, baseRadius * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = coreGradient;
            ctx.fill();

            const breathingCycle = Math.sin(time / 800); 
            const listeningScale = isListening && !isSpeaking ? 1 + (breathingCycle * 0.08) : 1;
            
            const pulseCycle = Math.sin(time / 150);
            const speakingScale = isSpeaking ? 1 + (pulseCycle * 0.05) : 1;

            particles.forEach((particle) => {
                const pos = particle.update(
                    time,
                    currentEnergy,
                    baseRadius,
                    listeningScale,
                    speakingScale
                );

                ctx.beginPath();
                ctx.arc(center + pos.x, center + pos.y, particle.size + (currentEnergy * 0.5), 0, Math.PI * 2);
                
                const drawAlpha = Math.max(0, Math.min(1, pos.alpha));
                
                // ⚡ Pure numeric injection, zero string overhead inside the loop
                ctx.fillStyle = `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${drawAlpha})`;
                ctx.fill();
            });

            ctx.globalCompositeOperation = 'source-over';
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [size, isListening, isSpeaking]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                background: 'transparent',
                pointerEvents: 'none'
            }}
        />
    );
};

export default CircularSiriWaveV2;
