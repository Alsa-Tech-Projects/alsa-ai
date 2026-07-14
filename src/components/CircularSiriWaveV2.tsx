// src/components/CircularSiriWaveV2.tsx
import React, { useEffect, useRef } from 'react';

export interface CircularSiriWaveProps {
    isListening: boolean;
    isSpeaking: boolean;
    size?: number;
}

// Cosmic Blue Theme
const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#38BDF8'];
const PARTICLE_COUNT = 1200;

// Utility for Gaussian-like distribution (concentrates particles in the center of the ring)
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

    constructor(ringThickness: number) {
        this.angle = Math.random() * Math.PI * 2;
        // Concentrate most particles near the core radius, some trailing off
        this.baseRadiusOffset = randomGaussian() * ringThickness;
        this.size = Math.random() * 1.5 + 0.5;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.speed = (Math.random() * 0.002) + 0.0005;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.wobbleSpeed = Math.random() * 0.002 + 0.001;
        this.wobbleOffset = Math.random() * Math.PI * 2;
    }

    update(
        time: number,
        energy: number,
        baseRadius: number,
        breathingScale: number,
        pulseScale: number
    ) {
        // Base rotation speed affected by energy (Speaking)
        this.angle += this.speed * (1 + energy * 4);

        // Calculate dynamic radius
        // Wobble adds an organic feeling to individual particles without breaking the circle
        const wobble = Math.sin(time * this.wobbleSpeed + this.wobbleOffset) * (3 * energy + 1);
        
        // Combine all scale factors
        const activeRadius = baseRadius * breathingScale * pulseScale;
        const currentRadius = activeRadius + (this.baseRadiusOffset * (1 + energy)) + wobble;

        return {
            x: Math.cos(this.angle) * currentRadius,
            y: Math.sin(this.angle) * currentRadius,
            alpha: this.alpha * (0.5 + energy * 0.5) // Brighter when active
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

        // Handle high-DPI displays for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
        ctx.scale(dpr, dpr);

        const center = size / 2;
        const baseRadius = size * 0.28; 
        const ringThickness = size * 0.15;

        // Initialize particles
        const particles: Particle[] = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle(ringThickness));
        }

        // Animation state variables
        let animationFrameId: number;
        let currentEnergy = 0;
        let targetEnergy = 0;
        
        // Smooth transitions using Lerp
        const lerp = (start: number, end: number, factor: number) => {
            return start + (end - start) * factor;
        };

        const render = (time: number) => {
            // 1. Determine target state
            if (isSpeaking) {
                targetEnergy = 1.0;
            } else if (isListening) {
                targetEnergy = 0.5;
            } else {
                targetEnergy = 0.1; // Idle state
            }

            // Smoothly interpolate energy
            currentEnergy = lerp(currentEnergy, targetEnergy, 0.05);

            // 2. Clear canvas with pure transparency
            ctx.clearRect(0, 0, size, size);

            // Set blend mode for glowing bloom effect without heavy shadowBlur calculations
            ctx.globalCompositeOperation = 'lighter';

            // 3. Draw Center Radial Glow (Energy Core)
            const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, baseRadius * 1.5);
            // Core opacity scales with energy
            const coreAlpha = 0.05 + (currentEnergy * 0.1);
            coreGradient.addColorStop(0, `rgba(59, 130, 246, ${coreAlpha})`);
            coreGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            
            ctx.beginPath();
            ctx.arc(center, center, baseRadius * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = coreGradient;
            ctx.fill();

            // 4. Calculate Animation Modifiers
            // Breathing modifier (4-6 seconds = ~5000ms cycle)
            // Sine wave ranges from -1 to 1. 
            const breathingCycle = Math.sin(time / 800); 
            // Scale expands and contracts slightly during listening mode
            const listeningScale = isListening && !isSpeaking ? 1 + (breathingCycle * 0.08) : 1;
            
            // Speaking pulse modifier (faster, more aggressive)
            const pulseCycle = Math.sin(time / 150);
            const speakingScale = isSpeaking ? 1 + (pulseCycle * 0.05) : 1;

            // 5. Update and Draw Particles
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
                
                // Opacity pulses slightly with the particle's own wobble and overall energy
                const drawAlpha = Math.max(0, Math.min(1, pos.alpha));
                
                // Convert hex to rgba for dynamic alpha
                const hex = particle.color.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${drawAlpha})`;
                ctx.fill();
            });

            // Reset blend mode for next frame clear
            ctx.globalCompositeOperation = 'source-over';

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [size, isListening, isSpeaking]); // Re-bind if props change to update target states

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                background: 'transparent',
                pointerEvents: 'none' // Prevent blocking clicks
            }}
        />
    );
};

export default CircularSiriWaveV2;
