/**
 * Particles.js - Animated Particle Background System
 * Features: Particle movement, collision detection, connecting lines
 */

(function() {
    'use strict';

    class ParticleSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.particleCount = 150; // Default
            this.maxParticles = 200;
            this.connectionDistance = 100;
            this.accentColor = '#3498db'; // Default, will be updated
            this.animationFrame = null;
            this.isRunning = false;

            this.init();
        }

        init() {
            // Get accent color from CSS variable
            const rootStyles = getComputedStyle(document.documentElement);
            const accentColor = rootStyles.getPropertyValue('--ghost-accent-color').trim();
            if (accentColor) {
                this.accentColor = accentColor;
            }

            // Get particle count from config
            const particleCountConfig = document.body.dataset.particleCount;
            if (particleCountConfig) {
                this.particleCount = parseInt(particleCountConfig, 10);
            }

            // Reduce particle count on mobile
            if (window.innerWidth < 768) {
                this.particleCount = Math.min(this.particleCount, 80);
            }

            // Setup canvas
            this.setupCanvas();

            // Create particles
            this.createParticles();

            // Handle resize with debounce
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.handleResize();
                }, 150);
            }, { passive: true });

            // Start animation
            this.start();
        }

        setupCanvas() {
            const dpr = window.devicePixelRatio || 1;
            const rect = this.canvas.getBoundingClientRect();

            this.canvas.width = rect.width * dpr;
            this.canvas.height = rect.height * dpr;

            this.ctx.scale(dpr, dpr);

            this.canvas.style.width = rect.width + 'px';
            this.canvas.style.height = rect.height + 'px';

            this.width = rect.width;
            this.height = rect.height;
        }

        createParticles() {
            this.particles = [];

            for (let i = 0; i < this.particleCount; i++) {
                this.particles.push(new Particle(
                    Math.random() * this.width,
                    Math.random() * this.height,
                    this.width,
                    this.height,
                    this.accentColor
                ));
            }
        }

        handleResize() {
            // Adjust particle count for mobile
            const newMaxParticles = window.innerWidth < 768 ? 80 : this.maxParticles;

            if (this.particles.length > newMaxParticles) {
                this.particles = this.particles.slice(0, newMaxParticles);
            }

            this.setupCanvas();

            // Update particle boundaries
            this.particles.forEach(particle => {
                particle.maxX = this.width;
                particle.maxY = this.height;

                // Keep particles within new bounds
                particle.x = Math.min(particle.x, this.width);
                particle.y = Math.min(particle.y, this.height);
            });
        }

        drawParticles() {
            this.particles.forEach(particle => {
                particle.draw(this.ctx);
            });
        }

        drawConnections() {
            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < this.connectionDistance) {
                        const opacity = (1 - distance / this.connectionDistance) * 0.3;

                        this.ctx.beginPath();
                        this.ctx.strokeStyle = this.hexToRgba(this.accentColor, opacity);
                        this.ctx.lineWidth = 1;
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.stroke();
                    }
                }
            }
        }

        hexToRgba(hex, alpha) {
            // Remove # if present
            hex = hex.replace('#', '');

            // Parse hex values
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        update() {
            this.particles.forEach(particle => {
                particle.update();
            });
        }

        animate() {
            if (!this.isRunning) return;

            this.ctx.clearRect(0, 0, this.width, this.height);

            this.update();
            this.drawConnections();
            this.drawParticles();

            this.animationFrame = requestAnimationFrame(() => this.animate());
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.animate();
        }

        stop() {
            this.isRunning = false;
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
                this.animationFrame = null;
            }
        }

        destroy() {
            this.stop();
            this.particles = [];
            window.removeEventListener('resize', this.handleResize);
        }
    }

    class Particle {
        constructor(x, y, maxX, maxY, color) {
            this.x = x;
            this.y = y;
            this.maxX = maxX;
            this.maxY = maxY;
            this.color = color;

            // Random velocity
            this.vx = (Math.random() - 0.5) * 1;
            this.vy = (Math.random() - 0.5) * 1;

            // Size
            this.radius = Math.random() * 2 + 1;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }

        update() {
            // Update position
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > this.maxX) {
                this.vx *= -1;
                this.x = Math.max(0, Math.min(this.x, this.maxX));
            }

            if (this.y < 0 || this.y > this.maxY) {
                this.vy *= -1;
                this.y = Math.max(0, Math.min(this.y, this.maxY));
            }
        }
    }

    // Initialize particles when DOM is ready
    function initParticles() {
        const canvas = document.getElementById('particles-canvas');

        if (!canvas) return;

        // Check if particles should be shown
        const showParticles = document.body.dataset.showParticles !== 'false';

        if (!showParticles) {
            canvas.style.display = 'none';
            return;
        }

        // Only initialize on homepage
        const isHomepage = document.body.classList.contains('home-template');

        if (!isHomepage) {
            canvas.style.display = 'none';
            return;
        }

        // Initialize particle system
        window.particleSystem = new ParticleSystem(canvas);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initParticles);
    } else {
        initParticles();
    }
})();
