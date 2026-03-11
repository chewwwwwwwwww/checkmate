// js/FacilityManager.js

export class FacilityManager {
    constructor(urinalCount = 5, cubicleCount = 2) {
        this.urinalCount = urinalCount;
        this.cubicleCount = cubicleCount;
        this.gameEngine = null;
        
        this.urinals = [];
        this.cubicles = [];
        
        this.initializeFacilities();
    }
    
    initializeFacilities() {
        for (let i = 0; i < this.urinalCount; i++) {
            this.urinals.push({
                type: 'urinal',
                index: i,
                occupied: false,
                occupiedBy: null,
                outOfOrder: false,
                timeAssigned: 0,
                usageTime: window.GAME_CONFIG?.urinalUsageTime || 3500,
                position: { x: 0, y: 0 }
            });
        }
        
        for (let i = 0; i < this.cubicleCount; i++) {
            this.cubicles.push({
                type: 'cubicle',
                index: i,
                occupied: false,
                occupiedBy: null,
                outOfOrder: false,
                timeAssigned: 0,
                usageTime: window.GAME_CONFIG?.cubicleUsageTime || 8000,
                position: { x: 0, y: 0 }
            });
        }
    }
    
    updatePositions(canvasWidth, canvasHeight) {
        const isMobile = canvasWidth < 600;
        
        const urinalWidth = isMobile ? 35 : 50;
        const totalUrinalW = this.urinalCount * urinalWidth + (this.urinalCount - 1) * 15;
        const startUrinalX = (canvasWidth - totalUrinalW) / 2;
        const urinalY = Math.max(150, canvasHeight * 0.25);
        
        this.urinals.forEach((u, i) => {
            u.position = {
                x: startUrinalX + i * (urinalWidth + 15),
                y: urinalY,
                width: urinalWidth,
                height: urinalWidth * 1.5
            };
        });
        
        const cubicleWidth = isMobile ? 60 : 80;
        const totalCubicleW = this.cubicleCount * cubicleWidth + (this.cubicleCount - 1) * 30;
        const startCubicleX = (canvasWidth - totalCubicleW) / 2;
        const cubicleY = Math.max(350, canvasHeight * 0.65);
        
        this.cubicles.forEach((c, i) => {
            c.position = {
                x: startCubicleX + i * (cubicleWidth + 30),
                y: cubicleY,
                width: cubicleWidth,
                height: cubicleWidth * 1.2
            };
        });
    }
    
    assignMaleToUrinal(maleId, index) {
        if (index < 0 || index >= this.urinals.length) return false;
        
        const urinal = this.urinals[index];
        if (urinal.occupied || urinal.outOfOrder) return false;
        
        urinal.occupied = true;
        urinal.occupiedBy = maleId;
        urinal.timeAssigned = Date.now();
        
        if (this.isUrinalAdjacent(index)) {
            // Adjacency violation!
            if (this.gameEngine) {
                setTimeout(() => {
                    this.gameEngine.loseLife('adjacency', urinal.position);
                }, 300); // Slight delay for visible impact
            }
        }
        
        return true;
    }
    
    assignMaleToCubicle(maleId, index) {
        if (index < 0 || index >= this.cubicles.length) return false;
        
        const cubicle = this.cubicles[index];
        if (cubicle.occupied || cubicle.outOfOrder) return false;
        
        cubicle.occupied = true;
        cubicle.occupiedBy = maleId;
        cubicle.timeAssigned = Date.now();
        
        // No points for cubicles, but it's safe. Combo resets though to emphasize urinal efficiency
        if (this.gameEngine) {
            this.gameEngine.state.combo = 0;
            this.gameEngine.onComboUpdate(0);
        }
        
        return true;
    }
    
    isUrinalAdjacent(index) {
        if (index > 0 && this.urinals[index - 1].occupied) return true;
        if (index < this.urinals.length - 1 && this.urinals[index + 1].occupied) return true;
        return false;
    }
    
    update(deltaTime) {
        const now = Date.now();
        
        // Check urinals
        this.urinals.forEach(u => {
            if (u.occupied && now - u.timeAssigned >= u.usageTime) {
                // Done
                const maleId = u.occupiedBy;
                u.occupied = false;
                u.occupiedBy = null;
                
                if (this.gameEngine && this.gameEngine.maleSpawner) {
                    this.gameEngine.maleSpawner.removeMale(maleId);
                    this.gameEngine.incrementScore(u.position.x + u.position.width/2, u.position.y);
                }
            }
        });
        
        // Check cubicles
        this.cubicles.forEach(c => {
            if (c.occupied && now - c.timeAssigned >= c.usageTime) {
                // Done
                const maleId = c.occupiedBy;
                c.occupied = false;
                c.occupiedBy = null;
                
                if (this.gameEngine && this.gameEngine.maleSpawner) {
                    this.gameEngine.maleSpawner.removeMale(maleId);
                    // Cubicles don't increment score
                }
            }
        });
    }
    
    getAllFacilities() {
        return { urinals: this.urinals, cubicles: this.cubicles };
    }
    
    reset() {
        this.urinals.forEach(u => { u.occupied = false; u.occupiedBy = null; u.outOfOrder = false; });
        this.cubicles.forEach(c => { c.occupied = false; c.occupiedBy = null; c.outOfOrder = false; });
    }
}
