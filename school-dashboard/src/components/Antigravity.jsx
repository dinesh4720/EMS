import React, { useRef, useEffect, useState } from 'react';

// Failsafe Antigravity Component
export default function Antigravity({
    count = 100,
    color = '#9333ea'
}) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const canvas = canvasRef.current;
        const container = containerRef.current;

        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId;
        let particles = [];

        const init = () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            // Handle 0 size (hidden/unmounted container)
            if (width === 0 || height === 0) return;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            // Create simple particles
            particles = Array.from({ length: count }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1
            }));
        };

        const render = () => {
            if (!container) return;
            const width = container.clientWidth;
            const height = container.clientHeight;

            ctx.clearRect(0, 0, width, height);
            ctx.fillStyle = color;

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        const handleResize = () => {
            init();
        };

        init();
        render();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [count, color]);

    return (
        <div ref={containerRef} className="w-full h-full absolute inset-0 z-0 pointer-events-none">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}
