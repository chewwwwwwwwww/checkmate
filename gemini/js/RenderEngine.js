// js/RenderEngine.js

export class RenderEngine {
    constructor(canvas, context, particleSystem) {
        this.canvas = canvas;
        this.ctx = context;
        this.particleSystem = particleSystem;
        this.gameEngine = null; // linked later
        
        this.colors = {
            bg: '#0f172a',
            urinal: {
                available: 'rgba(6, 182, 212, 0.4)',  // Cyan glass
                outline: '#06b6d4',
                occupied: 'rgba(239, 68, 68, 0.4)', // Pink/Red glass
                occOutline: '#ef4444'
            },
            cubicle: {
                available: 'rgba(34, 197, 94, 0.4)', // Lime glass
                outline: '#22c55e',
                occupied: 'rgba(245, 158, 11, 0.4)', // Amber glass
                occOutline: '#f59e0b'
            },
            male: '#e2e8f0', // Slate 200
            text: '#e2e8f0'
        };
        
        this.updateDimensions();
    }
    
    updateDimensions() {
        // Handled basically by facility manager now, but let's keep track of scale
        this.scale = this.canvas.width < 600 ? 0.8 : 1.0;
    }

    setFacilityManager(facilityManager) {
        // Exists to satisfy main.js initialization loop
        this.facilityManager = facilityManager;
    }
    
    render(gameState) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (gameState.status === 'playing') {
            const facilities = this.gameEngine?.facilityManager.getAllFacilities();
            if (facilities) {
                this.renderFacilities(facilities);
            }
            
            const males = this.gameEngine?.maleSpawner.getAllMales();
            if (males) {
                this.renderMales(males);
            }
            
            if (this.particleSystem) {
                this.particleSystem.render(this.ctx);
            }
        }
    }
    
    renderFacilities(facilities) {
        // Render Urinals
        facilities.urinals.forEach(u => {
            const colorSet = u.occupied ? this.colors.urinal.occupied : this.colors.urinal.available;
            const outline = u.occupied ? this.colors.urinal.occOutline : this.colors.urinal.outline;
            
            // Neon Glow
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = outline;
            
            // Glass background
            this.ctx.fillStyle = colorSet;
            this.ctx.beginPath();
            this.ctx.roundRect(u.position.x, u.position.y, u.position.width, u.position.height, 10);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0; // Turn off shadow for inner drawing
            
            // Outline
            this.ctx.strokeStyle = outline;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Progress Bar if occupied
            if (u.occupied) {
                const progress = (Date.now() - u.timeAssigned) / u.usageTime;
                this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
                this.ctx.fillRect(u.position.x + 5, u.position.y + u.position.height - 10, (u.position.width - 10) * progress, 5);
            } else {
                // Index text
                this.ctx.fillStyle = outline;
                this.ctx.font = 'bold 20px Outfit';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`U${u.index + 1}`, u.position.x + u.position.width/2, u.position.y + u.position.height/2 - 8);
                
                // Hotkey text
                this.ctx.font = '12px Outfit';
                this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
                this.ctx.fillText(`[${u.index + 1}]`, u.position.x + u.position.width/2, u.position.y + u.position.height/2 + 15);
            }
        });
        
        // Render Cubicles
        facilities.cubicles.forEach(c => {
            const colorSet = c.occupied ? this.colors.cubicle.occupied : this.colors.cubicle.available;
            const outline = c.occupied ? this.colors.cubicle.occOutline : this.colors.cubicle.outline;
            
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = outline;
            
            this.ctx.fillStyle = colorSet;
            this.ctx.beginPath();
            this.ctx.roundRect(c.position.x, c.position.y, c.position.width, c.position.height, 8);
            this.ctx.fill();
            
            this.ctx.shadowBlur = 0;
            
            this.ctx.strokeStyle = outline;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            if (c.occupied) {
                const progress = (Date.now() - c.timeAssigned) / c.usageTime;
                this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
                this.ctx.fillRect(c.position.x + 5, c.position.y + c.position.height - 10, (c.position.width - 10) * progress, 5);
            } else {
                this.ctx.fillStyle = outline;
                this.ctx.font = 'bold 20px Outfit';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(`C${c.index + 1}`, c.position.x + c.position.width/2, c.position.y + c.position.height/2 - 8);
                
                // Hotkey text
                const hotkey = c.index === 0 ? 'Q' : c.index === 1 ? 'W' : (c.index + 1);
                this.ctx.font = '12px Outfit';
                this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
                this.ctx.fillText(`[${hotkey}]`, c.position.x + c.position.width/2, c.position.y + c.position.height/2 + 15);
            }
        });
    }
    
    renderMales(males) {
        males.forEach(male => {
            if (male.state !== 'waiting' && male.state !== 'walking') return;
            
            const x = male.position.x;
            const y = Math.min(male.position.y, this.canvas.height - 50);
            const radius = 15 * this.scale;
            
            // Sleek avatar representation
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#e2e8f0';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 12px Outfit';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${male.id}`, x, y);
            
            // Patience Ring (Arc) - Only show when waiting
            if (male.state === 'waiting') {
                const perc = male.getTimePercentage();
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (Math.PI * 2 * perc);
                
                // Color shifts green -> yellow -> red
                let arcColor = '#22c55e';
                if (perc < 0.5) arcColor = '#f59e0b';
                if (perc < 0.2) arcColor = '#ef4444';
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, radius + 5, startAngle, endAngle);
                this.ctx.strokeStyle = arcColor;
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
                
                // Glow if critical
                if (perc < 0.2) {
                    this.ctx.shadowBlur = 10;
                    this.ctx.shadowColor = '#ef4444';
                    this.ctx.stroke();
                    this.ctx.shadowBlur = 0;
                }
            }
        });
    }
}