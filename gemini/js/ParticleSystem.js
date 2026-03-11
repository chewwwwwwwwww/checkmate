// js/ParticleSystem.js

export class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.particles = [];
    }
    
    resize(width, height) {}
    
    update(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.life -= deltaTime;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            
            if (p.type === 'text') {
                p.y -= 20 * deltaTime; // float up
            } else {
                p.vy += p.gravity * deltaTime; // apply gravity to sparks
                p.alpha = p.life / p.maxLife;   // fade out
            }
        }
    }
    
    render(ctx) {
        this.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            
            if (p.type === 'text') {
                ctx.fillStyle = p.color;
                ctx.font = 'bold 24px Outfit';
                ctx.textAlign = 'center';
                ctx.fillText(p.text, p.x, p.y);
            } else if (p.type === 'spark') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'square') {
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
            }
            
            ctx.restore();
        });
    }
    
    emitConfetti(x, y) {
        const colors = ['#06b6d4', '#3b82f6', '#a855f7', '#22c55e', '#f59e0b'];
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 300,
                vy: (Math.random() - 1) * 300,
                gravity: 800,
                life: 1.0,
                maxLife: 1.0,
                alpha: 1.0,
                size: Math.random() * 4 + 2,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }
    
    emitScoreText(x, y, text) {
        this.particles.push({
            type: 'text',
            text: text,
            x: x + 20,
            y: y - 20,
            vx: 0,
            vy: -50,
            gravity: 0,
            life: 1.5,
            maxLife: 1.5,
            alpha: 1.0,
            color: '#a855f7' // Gemini Purple
        });
    }
    
    emitSquareExplosion(x, y, color) {
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                type: 'square',
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 400,
                vy: (Math.random() - 0.5) * 400,
                gravity: 0,
                life: 0.8,
                maxLife: 0.8,
                alpha: 1.0,
                size: Math.random() * 8 + 4,
                color: color
            });
        }
    }
    
    clear() {
        this.particles = [];
    }
}
