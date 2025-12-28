import React, { useRef, useEffect } from 'react';

export default function InteractiveParticles() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let mouse = { x: null, y: null };

        // Particle configuration
        const particleCount = 150; // Increased count for density
        const mouseRepelDistance = 200; // Stronger interaction
        const repelStrength = 2; // Stronger push

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                // Vignette generation: bias positions away from center
                const cx = width / 2;
                const cy = height / 2;
                const maxRadius = Math.sqrt(cx * cx + cy * cy);

                // Try to find a position, favoring edges
                let x, y, dist, accepted = false;
                let attempts = 0;

                while (!accepted && attempts < 10) {
                    // Random angle
                    const angle = Math.random() * Math.PI * 2;
                    // Bias radius towards outer edge (using square root distribution for uniform area, then pushing out)
                    // Simple distinct zones: 80% chance to be in outer 40% of screen
                    const isOuter = Math.random() > 0.2;
                    let r;

                    if (isOuter) {
                        // Outer zone (0.5 to 1.0 of max radius)
                        r = (Math.random() * 0.5 + 0.5) * maxRadius;
                    } else {
                        // Inner zone (0 to 1.0) - lighter density
                        r = Math.random() * maxRadius;
                    }

                    x = cx + Math.cos(angle) * r;
                    y = cy + Math.sin(angle) * r;

                    // Ensure it fits effectively on screen or slightly off
                    if (x > -50 && x < width + 50 && y > -50 && y < height + 50) {
                        accepted = true;
                    }
                    attempts++;
                }

                this.x = x;
                this.y = y;

                this.vx = (Math.random() - 0.5) * 0.5; // Slower, floating movement
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 0.5;
                this.baseX = this.x;
                this.baseY = this.y;
                this.density = (Math.random() * 30) + 1;
                this.color = `rgba(147, 51, 234, ${Math.random() * 0.4 + 0.1})`; // Purple-ish
            }

            update() {
                // Normal movement
                this.x += this.vx;
                this.y += this.vy;

                // Gentle return to base or wrap? Let's float and wrap.
                if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                    // If goes off screen, reset mostly to vignette logic, but maintain flow
                    if (Math.random() > 0.99) this.reset();
                    else {
                        // Simple bounce for longer life
                        if (this.x < 0) this.vx = Math.abs(this.vx);
                        if (this.x > width) this.vx = -Math.abs(this.vx);
                        if (this.y < 0) this.vy = Math.abs(this.vy);
                        if (this.y > height) this.vy = -Math.abs(this.vy);
                    }
                }

                // Mouse interaction
                if (mouse.x != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseRepelDistance) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;

                        // Force increases as you get closer
                        const force = (mouseRepelDistance - distance) / mouseRepelDistance;

                        // Repel
                        const directionX = forceDirectionX * force * this.density * repelStrength;
                        const directionY = forceDirectionY * force * this.density * repelStrength;

                        this.x -= directionX;
                        this.y -= directionY;
                    }
                }
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            if (!containerRef.current) return;
            width = containerRef.current.clientWidth;
            height = containerRef.current.clientHeight;
            canvas.width = width;
            canvas.height = height;
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            /* Optional: Connect particles with lines
            particles.forEach((a, index) => {
                for (let j = index + 1; j < particles.length; j++) {
                    let b = particles[j];
                    let dx = a.x - b.x;
                    let dy = a.y - b.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.strokeStyle = `rgba(147, 51, 234, ${1 - distance / connectionDistance})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }); 
            */

            requestAnimationFrame(animate);
        };

        const handleResize = () => init();

        const handleMouseMove = (e) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        init();
        animate();

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        // We don't really need mouseleave on window generally, but if they leave the window:
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0">
            <canvas ref={canvasRef} className="w-full h-full" />
        </div>
    );
}
