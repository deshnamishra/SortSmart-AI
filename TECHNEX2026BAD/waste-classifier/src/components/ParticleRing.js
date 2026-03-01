import React from 'react';

/**
 * ParticleRing — 12 orbiting dots around the scan ring.
 * Speed and color react to `mode`: 'idle' | 'loading' | 'result'
 * `resultColor` — hex string when in result mode (category color)
 */
export default function ParticleRing({ mode = 'idle', resultColor }) {
    const count = 12;
    const SIZES = [2, 3, 4, 2, 3, 2, 4, 3, 2, 3, 4, 2];
    const OPACITIES = [0.6, 0.9, 0.8, 0.5, 0.7, 0.9, 0.6, 0.8, 0.7, 0.5, 0.9, 0.6];

    const baseColor = mode === 'result' ? (resultColor || '#00FF87')
        : mode === 'loading' ? '#00D4FF'
            : '#00FF87';

    const baseDuration = mode === 'loading' ? 2.0
        : mode === 'result' ? 4.5
            : 6.0;

    return (
        <div className="particle-ring" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => {
                const angle = (360 / count) * i;
                const size = SIZES[i];
                const opacity = OPACITIES[i];
                const dur = baseDuration + (i % 3) * 0.4;
                const delay = -(i * (baseDuration / count));

                return (
                    <span
                        key={i}
                        className="pr-dot"
                        style={{
                            '--angle': `${angle}deg`,
                            '--orbit-r': '130px',
                            '--dur': `${dur}s`,
                            '--delay': `${delay}s`,
                            '--size': `${size}px`,
                            '--color': baseColor,
                            '--opacity': opacity,
                            width: size,
                            height: size,
                            background: baseColor,
                            boxShadow: `0 0 ${size * 3}px ${baseColor}`,
                            opacity,
                            animationDuration: `${dur}s`,
                            animationDelay: `${delay}s`,
                        }}
                    />
                );
            })}
        </div>
    );
}
