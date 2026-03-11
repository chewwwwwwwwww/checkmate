// js/MaleSpawner.js

export class MaleSpawner {
    constructor(config) {
        this.gameEngine = null;
        this.males = new Map();
        this.nextId = 1;
        
        this.spawnRate = config.initialSpawnRate;
        this.maleWaitTime = config.maleWaitTime;
        
        this.timeSinceLastSpawn = 0;
    }
    
    update(deltaTime) {
        this.timeSinceLastSpawn += deltaTime * 1000;
        
        if (this.timeSinceLastSpawn >= this.spawnRate) {
            this.spawnMale();
            this.timeSinceLastSpawn = 0;
        }
    }
    
    spawnMale() {
        const id = this.nextId++;
        const queuePos = this.males.size;
        
        this.males.set(id, {
            id: id,
            state: 'waiting', // waiting, using
            spawnTime: Date.now(),
            maxWaitTime: this.maleWaitTime,
            position: { x: this.getQueueX(queuePos), y: this.getQueueY(queuePos) },
            
            // Methods for rendering
            getTimeRemaining() {
                return Math.max(0, this.maxWaitTime - (Date.now() - this.spawnTime));
            },
            getTimePercentage() {
                return this.getTimeRemaining() / this.maxWaitTime;
            }
        });
        
        this.updateQueuePositions();
    }
    
    updateSpawnRate(newRate) {
        this.spawnRate = newRate;
    }
    
    checkForTimeout() {
        const now = Date.now();
        for (const [id, male] of this.males.entries()) {
            if (male.state === 'waiting' && (now - male.spawnTime) >= male.maxWaitTime) {
                return male;
            }
        }
        return null; // Return the first one that times out
    }
    
    removeMale(id) {
        this.males.delete(id);
        this.updateQueuePositions();
    }
    
    getMale(id) {
        return this.males.get(id);
    }
    
    getWaitingMales() {
        return Array.from(this.males.values()).filter(m => m.state === 'waiting');
    }
    
    getWaitingCount() {
        return this.getWaitingMales().length;
    }
    
    getAllMales() {
        return this.males;
    }
    
    updateQueuePositions() {
        const waiting = this.getWaitingMales();
        waiting.sort((a,b) => a.spawnTime - b.spawnTime); // oldest first
        
        waiting.forEach((male, index) => {
            // Target position in queue
            const targetX = this.getQueueX(index);
            const targetY = this.getQueueY(index);
            
            // Smooth lerp can be handled in rendering, but set target here
            male.position.x = targetX;
            male.position.y = targetY;
        });
    }
    
    getQueueX(index) {
        // Line them up along the left edge
        return window.innerWidth < 600 ? 30 : 50; 
    }
    
    getQueueY(index) {
        const topMargin = 100;
        const spacing = window.innerWidth < 600 ? 50 : 70;
        // Cap the height so they don't go off screen 
        return topMargin + (index * spacing);
    }
    
    reset() {
        this.males.clear();
        this.nextId = 1;
        this.timeSinceLastSpawn = 0;
        this.spawnRate = window.GAME_CONFIG?.initialSpawnRate || 2000;
    }
}
