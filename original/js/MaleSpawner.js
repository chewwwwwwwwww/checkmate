/**
 * MaleSpawner - Manages male spawning and queue
 * Handles spawn timing, queue management, and timeout detection
 */

import { Male } from './Male.js';

export class MaleSpawner {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.males = new Map(); // Map of Male objects by ID
        this.nextMaleId = 1;
        this.spawnRate = 2000; // milliseconds between spawns
        this.lastSpawnTime = 0;
        this.timeSinceLastSpawn = 0;
    }
    
    /**
     * Update spawner (called each frame)
     */
    update(deltaTime) {
        this.timeSinceLastSpawn += deltaTime * 1000; // Convert to ms
        
        // Check if it's time to spawn a new male
        if (this.timeSinceLastSpawn >= this.spawnRate) {
            this.spawnMale();
            this.timeSinceLastSpawn = 0;
        }
        
        // Update all males' timers
        this.updateTimers(deltaTime);
    }
    
    /**
     * Spawn a new male
     */
    spawnMale() {
        const male = new Male(this.nextMaleId++);
        
        // Set custom wait time if configured
        if (this.defaultWaitTime) {
            male.maxWaitTime = this.defaultWaitTime;
        }
        
        this.males.set(male.id, male);
        this.lastSpawnTime = Date.now();
        
        // Recalculate all positions after adding new male
        this.recalculatePositions();
        
        console.log('Male #' + male.id + ' spawned');
        
        return male;
    }
    
    /**
     * Recalculate positions for all waiting males to prevent overlaps
     */
    recalculatePositions() {
        const waitingMales = Array.from(this.males.values())
            .filter(m => m.state === 'waiting')
            .sort((a, b) => a.id - b.id); // Sort by ID to maintain order
        
        // Detect mobile based on typical canvas width
        const canvas = document.getElementById('game-canvas');
        const isMobile = canvas && canvas.width < 600;
        
        const maxPerRow = 3;
        const colSpacing = isMobile ? 35 : 60; // Closer together on mobile
        const rowSpacing = isMobile ? 50 : 80; // Closer together on mobile
        const startX = isMobile ? 25 : 40;
        const startY = isMobile ? 50 : 60;
        
        waitingMales.forEach((male, index) => {
            const row = Math.floor(index / maxPerRow);
            const col = index % maxPerRow;
            
            male.position = {
                x: startX + (col * colSpacing),
                y: startY + (row * rowSpacing)
            };
        });
    }
    
    /**
     * Update spawn rate (for difficulty scaling)
     */
    updateSpawnRate(newRate) {
        this.spawnRate = Math.max(1000, newRate); // Minimum 1 second
    }
    
    /**
     * Get all males in queue
     */
    getMalesInQueue() {
        return Array.from(this.males.values()).filter(male => male.state === 'waiting');
    }
    
    /**
     * Get male by ID
     */
    getMale(maleId) {
        return this.males.get(maleId);
    }
    
    /**
     * Assign male to facility
     */
    assignMale(maleId, facilityType, facilityIndex) {
        const male = this.males.get(maleId);
        
        if (!male) {
            throw new Error(`Male ${maleId} not found`);
        }
        
        if (male.state !== 'waiting') {
            throw new Error(`Male ${maleId} is not waiting`);
        }
        
        male.assignToFacility(facilityType, facilityIndex);
        male.startUsing();
        
        return male;
    }
    
    /**
     * Remove male from queue (after facility use)
     */
    removeMale(maleId) {
        const result = this.males.delete(maleId);
        // Recalculate positions after removing a male
        this.recalculatePositions();
        return result;
    }
    
    /**
     * Update timers for all males
     */
    updateTimers(deltaTime) {
        // Just update timers, don't check for timeout here
        // Timeout checking is done separately
    }
    
    /**
     * Check for any timed out males
     */
    checkForTimeout() {
        for (const [id, male] of this.males) {
            if (male.hasTimedOut()) {
                console.log('Male timed out:', male.id, 'Time remaining:', male.getTimeRemaining());
                return male;
            }
        }
        return null;
    }
    
    /**
     * Get male time remaining
     */
    getMaleTimeRemaining(maleId) {
        const male = this.males.get(maleId);
        return male ? male.getTimeRemaining() : 0;
    }
    
    /**
     * Get count of waiting males
     */
    getWaitingCount() {
        return this.getMalesInQueue().length;
    }
    
    /**
     * Reset spawner
     */
    reset() {
        this.males.clear();
        this.nextMaleId = 1;
        this.lastSpawnTime = 0;
        this.timeSinceLastSpawn = 0;
        this.spawnRate = 3000; // Match the config
        console.log('MaleSpawner reset');
    }
    
    /**
     * Get all males
     */
    getAllMales() {
        return Array.from(this.males.values());
    }
}
