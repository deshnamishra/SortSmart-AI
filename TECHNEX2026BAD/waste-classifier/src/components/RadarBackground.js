import React, { useEffect, useRef } from 'react';

/**
 * RadarBackground — full-screen fixed layer with concentric
 * scanning rings like GeoSpy's sonar effect, centred on the scan area.
 * Pure CSS-in-JS with no external dependencies.
 */
export default function RadarBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let raf;
        let rings = [];

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Spawn a new ring every 1.8s
        function spawnRing() {
            rings.push({ r: 0, opacity: 0.28, speed: 0.55 });
        }
        spawnRing();
        const spawnIv = setInterval(spawnRing, 1800);

        const cx = () => canvas.width / 2;
        const cy = () => canvas.height * 0.42; // slightly above center

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Static concentric guide circles
            for (let i = 1; i <= 5; i++) {
                const r = i * Math.min(canvas.width, canvas.height) * 0.09;
                ctx.beginPath();
                ctx.arc(cx(), cy(), r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,255,255,0.028)`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Pulsing rings
            rings = rings.filter(ring => ring.opacity > 0.005);
            rings.forEach(ring => {
                ctx.beginPath();
                ctx.arc(cx(), cy(), ring.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0,255,135,${ring.opacity})`;
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ring.r += ring.speed * 2;
                ring.opacity *= 0.98;
            });

            raf = requestAnimationFrame(draw);
        }
        draw();

        return () => {
            cancelAnimationFrame(raf);
            clearInterval(spawnIv);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                inset: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 1,
            }}
            aria-hidden="true"
        />
    );
}
