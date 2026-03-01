import React, { useEffect, useRef } from 'react';

/**
 * AuroraBackground — Fixed full-screen bioluminescent backdrop.
 * Three animated radial gradient blobs + 25 ambient floating particles.
 * Blobs gently react to mouse pointer position (parallax).
 */
export default function AuroraBackground() {
    const blob1Ref = useRef(null);
    const blob2Ref = useRef(null);
    const blob3Ref = useRef(null);

    useEffect(() => {
        let frameId;
        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        const onMove = (e) => {
            const cx = e.clientX ?? (e.touches?.[0]?.clientX || 0);
            const cy = e.clientY ?? (e.touches?.[0]?.clientY || 0);
            targetX = (cx / window.innerWidth - 0.5) * 30;
            targetY = (cy / window.innerHeight - 0.5) * 20;
        };

        const lerp = (a, b, t) => a + (b - a) * t;

        const tick = () => {
            currentX = lerp(currentX, targetX, 0.04);
            currentY = lerp(currentY, targetY, 0.04);
            if (blob1Ref.current) {
                blob1Ref.current.style.transform = `translate(${currentX * 1.0}px, ${currentY * 0.8}px)`;
            }
            if (blob2Ref.current) {
                blob2Ref.current.style.transform = `translate(${-currentX * 0.7}px, ${-currentY * 0.6}px)`;
            }
            if (blob3Ref.current) {
                blob3Ref.current.style.transform = `translate(${currentX * 0.4}px, ${currentY * 1.2}px)`;
            }
            frameId = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', onMove, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: true });
        frameId = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            cancelAnimationFrame(frameId);
        };
    }, []);

    // Generate 25 ambient dots with random properties
    const dots = Array.from({ length: 25 }, (_, i) => ({
        id: i,
        size: 2 + Math.random() * 2.5,
        top: Math.random() * 100,
        left: Math.random() * 100,
        dur: 3 + Math.random() * 4,
        delay: Math.random() * 4,
        opacity: 0.08 + Math.random() * 0.12,
        color: i % 3 === 0 ? '#00D4FF' : i % 5 === 0 ? '#39FF14' : '#00FF87',
    }));

    return (
        <>
            {/* Aurora blobs */}
            <div className="aurora-bg" aria-hidden="true">
                <div className="aurora-blob aurora-blob-1" ref={blob1Ref} />
                <div className="aurora-blob aurora-blob-2" ref={blob2Ref} />
                <div className="aurora-blob aurora-blob-3" ref={blob3Ref} />
            </div>

            {/* Ambient floating particles */}
            <div className="ambient-particles" aria-hidden="true">
                {dots.map(d => (
                    <span
                        key={d.id}
                        className="ambient-dot"
                        style={{
                            width: d.size,
                            height: d.size,
                            top: `${d.top}%`,
                            left: `${d.left}%`,
                            '--dur': `${d.dur}s`,
                            '--delay': `${d.delay}s`,
                            opacity: d.opacity,
                            background: d.color,
                            boxShadow: `0 0 ${d.size * 3}px ${d.color}`,
                        }}
                    />
                ))}
            </div>
        </>
    );
}
