'use client';

import { useRef, useEffect, useCallback } from 'react';
import { gsap } from 'gsap';

const DEFAULT_PARTICLE_COUNT = 20;
const DEFAULT_GLOW_COLOR = '252,254,218';

const createParticleElement = (x, y, color) => {
    const el = document.createElement('div');
    el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 50;
    left: ${x}px;
    top: ${y}px;
  `;
    return el;
};

export default function ParticleCard({
    children,
    className = '',
    particleCount = DEFAULT_PARTICLE_COUNT,
    glowColor = DEFAULT_GLOW_COLOR,
    disableAnimations = false,
}) {
    const ref = useRef(null);

    const spawnParticles = useCallback(() => {
        if (!ref.current || disableAnimations) return;

        const { width, height } = ref.current.getBoundingClientRect();

        for (let i = 0; i < particleCount; i++) {
            const p = createParticleElement(
                Math.random() * width,
                Math.random() * height,
                glowColor
            );

            ref.current.appendChild(p);

            gsap.fromTo(
                p,
                { scale: 0, opacity: 0 },
                {
                    scale: 1,
                    opacity: 1,
                    duration: 0.3,
                    ease: 'back.out(1.7)',
                }
            );

            gsap.to(p, {
                x: (Math.random() - 0.5) * 80,
                y: (Math.random() - 0.5) * 80,
                opacity: 0,
                duration: 2,
                ease: 'power2.out',
                onComplete: () => p.remove(),
            });
        }
    }, [disableAnimations, glowColor, particleCount]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        el.addEventListener('mouseenter', spawnParticles);
        return () => el.removeEventListener('mouseenter', spawnParticles);
    }, [spawnParticles]);

    return (
        <div ref={ref} className={`relative ${className}`}>
            {children}
        </div>
    );
}
