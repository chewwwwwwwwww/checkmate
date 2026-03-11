/**
 * FacilityManager - Manages all urinals and cubicles
 * Handles assignment, release, adjacency rules, and out-of-order facilities
 */

import { Facility } from './Facility.js';

export class FacilityManager {
    constructor(urinalCount = 5, cubicleCount = 3, gameEngine = null) {
        this.urinalCount = urinalCount;
        this.cubicleCount = cubicleCount;
        this.gameEngine = gameEngine;
        
        // Initialize facilities
        this.urinals = [];
        this.cubicles = [];
        
        this.initializeFacilities();
    }
    
    /**
     * Initialize all facilities
     */
    initializeFacilities() {
        // Create urinals
        for (let i = 0; i < this.urinalCount; i++) {
            this.urinals.push(new Facility('urinal', i));
        }
        
        // Create cubicles
        for (let i = 0; i < this.cubicleCount; i++) {
            this.cubicles.push(new Facility('cubicle', i));
        }
        
        // Set positions (will be used by render engine)
        this.calculatePositions();
    }
    
    /**
     * Calculate facility positions for rendering (responsive)
     */
    calculatePositions() {
        // Get canvas dimensions for responsive positioning
        const canvasWidth = 800; // Default width, will be updated by render engine
        const canvasHeight = 600;
        
        // Calculate responsive spacing
        const availableWidth = canvasWidth - 200; // Leave margins
        const urinalSpacing = Math.min(80, availableWidth / this.urinalCount);
        const urinalStartX = (canvasWidth - (this.urinalCount * urinalSpacing)) / 2;
        const urinalY = Math.max(180, canvasHeight * 0.3);
        
        this.urinals.forEach((urinal, index) => {
            urinal.position = {
                x: urinalStartX + (index * urinalSpacing),
                y: urinalY
            };
        });
        
        const cubicleSpacing = Math.min(100, availableWidth / this.cubicleCount);
        const cubicleStartX = (canvasWidth - (this.cubicleCount * cubicleSpacing)) / 2;
        const cubicleY = Math.max(380, canvasHeight * 0.65);
        
        this.cubicles.forEach((cubicle, index) => {
            cubicle.position = {
                x: cubicleStartX + (index * cubicleSpacing),
                y: cubicleY
            };
        });
    }
    
    /**
     * Update positions based on canvas size
     */
    updatePositions(canvasWidth, canvasHeight) {
        // Recalculate positions for current canvas size
        const isMobile = canvasWidth < 600;
        const isTablet = canvasWidth >= 600 && canvasWidth < 900;
        
        // Responsive margins based on screen size
        // Right margin must account for UI panel: 140px (mobile), 170px (tablet), 190px (desktop) + 5-10px padding
        const leftMargin = isMobile ? 10 : (isTablet ? 150 : 220);
        const rightMargin = isMobile ? 150 : (isTablet ? 180 : 210); // Space for UI panel
        const availableWidth = canvasWidth - leftMargin - rightMargin;
        
        // Scale facility sizes for mobile/tablet/desktop
        const urinalWidth = isMobile ? 30 : (isTablet ? 50 : 60);
        const cubicleWidth = isMobile ? 50 : (isTablet ? 70 : 80);
        
        // Calculate urinal spacing - fully responsive
        const urinalGap = isMobile ? 4 : (isTablet ? 8 : 10); // Gap between urinals
        const totalUrinalWidth = this.urinalCount * urinalWidth + (this.urinalCount - 1) * urinalGap;
        const urinalSpacing = urinalWidth + urinalGap;
        const urinalStartX = leftMargin + (availableWidth - totalUrinalWidth) / 2;
        // Position urinals below the label (label is at wallY + 10 to wallY + 35)
        const urinalWallY = isMobile ? 180 : 150;
        const urinalY = urinalWallY + 40; // 40px from wall top to clear the label
        
        this.urinals.forEach((urinal, index) => {
            urinal.position = {
                x: urinalStartX + (index * urinalSpacing),
                y: urinalY
            };
        });
        
        // Calculate cubicle spacing - fully responsive
        const cubicleGap = isMobile ? 10 : (isTablet ? 20 : 40); // Gap between cubicles
        const totalCubicleWidth = this.cubicleCount * cubicleWidth + (this.cubicleCount - 1) * cubicleGap;
        const cubicleSpacing = cubicleWidth + cubicleGap;
        const cubicleStartX = leftMargin + (availableWidth - totalCubicleWidth) / 2;
        // Position cubicles below the label (label is at wallY + 10 to wallY + 35)
        const cubicleWallY = isMobile ? 340 : 350;
        const cubicleY = cubicleWallY + 40; // 40px from wall top to clear the label
        
        this.cubicles.forEach((cubicle, index) => {
            cubicle.position = {
                x: cubicleStartX + (index * cubicleSpacing),
                y: cubicleY
            };
        });
        
        // Store layout info for RenderEngine to use for label positioning
        this.layoutInfo = {
            urinalStartX,
            urinalEndX: urinalStartX + totalUrinalWidth,
            urinalCenterX: urinalStartX + totalUrinalWidth / 2,
            cubicleStartX,
            cubicleEndX: cubicleStartX + totalCubicleWidth,
            cubicleCenterX: cubicleStartX + totalCubicleWidth / 2,
            urinalWallY,
            cubicleWallY
        };
    }
    
    /**
     * Assign male to urinal
     */
    assignMaleToUrinal(maleId, urinalIndex) {
        if (urinalIndex < 0 || urinalIndex >= this.urinals.length) {
            throw new Error(`Invalid urinal index: ${urinalIndex}`);
        }
        
        const urinal = this.urinals[urinalIndex];
        
        if (!urinal.isAvailable()) {
            throw new Error(`Urinal ${urinalIndex} is not available`);
        }
        
        // Check for life reward BEFORE assignment
        if (urinal.hasLifeReward && this.gameEngine) {
            this.gameEngine.gainLife();
            urinal.hasLifeReward = false; // Remove reward after claiming
        }
        
        // Assign the male
        urinal.assign(maleId);
        
        // THEN check adjacency rule and lose life if violated
        if (this.isUrinalAdjacent(urinalIndex)) {
            // Adjacency violation - lose a life
            console.log('Adjacency violation at urinal', urinalIndex);
            if (this.gameEngine) {
                // Delay slightly so player can see what they did wrong
                setTimeout(() => {
                    this.gameEngine.loseLife('adjacency');
                }, 500);
            }
        }
        
        return true;
    }
    
    /**
     * Assign male to cubicle
     */
    assignMaleToCubicle(maleId, cubicleIndex) {
        if (cubicleIndex < 0 || cubicleIndex >= this.cubicles.length) {
            throw new Error(`Invalid cubicle index: ${cubicleIndex}`);
        }
        
        const cubicle = this.cubicles[cubicleIndex];
        
        if (!cubicle.isAvailable()) {
            throw new Error(`Cubicle ${cubicleIndex} is not available`);
        }
        
        // Check for life reward BEFORE assignment
        if (cubicle.hasLifeReward && this.gameEngine) {
            this.gameEngine.gainLife();
            cubicle.hasLifeReward = false; // Remove reward after claiming
        }
        
        cubicle.assign(maleId);
        return true;
    }
    
    /**
     * Release a facility
     */
    releaseFacility(facilityType, facilityIndex) {
        const facilities = facilityType === 'urinal' ? this.urinals : this.cubicles;
        
        if (facilityIndex < 0 || facilityIndex >= facilities.length) {
            throw new Error(`Invalid ${facilityType} index: ${facilityIndex}`);
        }
        
        facilities[facilityIndex].release();
    }
    
    /**
     * Get available urinals
     */
    getAvailableUrinals() {
        return this.urinals
            .map((urinal, index) => ({ urinal, index }))
            .filter(({ urinal }) => urinal.isAvailable());
    }
    
    /**
     * Get available cubicles
     */
    getAvailableCubicles() {
        return this.cubicles
            .map((cubicle, index) => ({ cubicle, index }))
            .filter(({ cubicle }) => cubicle.isAvailable());
    }
    
    /**
     * Check if placing a male at urinal index would violate adjacency rule
     */
    isUrinalAdjacent(index) {
        // Check left neighbor
        if (index > 0 && this.urinals[index - 1].occupied) {
            return true;
        }
        
        // Check right neighbor
        if (index < this.urinals.length - 1 && this.urinals[index + 1].occupied) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Update facilities (check for auto-release)
     */
    update(deltaTime) {
        // Check urinals for auto-release
        this.urinals.forEach((urinal, index) => {
            if (urinal.isReadyForRelease()) {
                const maleId = urinal.occupiedBy;
                urinal.release();
                
                // Remove male from spawner
                if (this.gameEngine && this.gameEngine.maleSpawner) {
                    this.gameEngine.maleSpawner.removeMale(maleId);
                }
                
                // Trigger audio and score update
                if (this.gameEngine) {
                    if (this.gameEngine.audioManager) {
                        this.gameEngine.audioManager.onUrinalFlush();
                    }
                    this.gameEngine.incrementScore();
                }
            }
        });
        
        // Check cubicles for auto-release
        this.cubicles.forEach((cubicle, index) => {
            if (cubicle.isReadyForRelease()) {
                const maleId = cubicle.occupiedBy;
                cubicle.release();
                
                // Remove male from spawner
                if (this.gameEngine && this.gameEngine.maleSpawner) {
                    this.gameEngine.maleSpawner.removeMale(maleId);
                }
                
                // Trigger audio (no score for cubicles)
                if (this.gameEngine && this.gameEngine.audioManager) {
                    this.gameEngine.audioManager.onCubicleFlush();
                }
            }
        });
    }
    
    /**
     * Set facility out of order
     */
    setFacilityOutOfOrder(type, index) {
        const facilities = type === 'urinal' ? this.urinals : this.cubicles;
        
        if (index >= 0 && index < facilities.length) {
            facilities[index].setOutOfOrder(true);
        }
    }
    
    /**
     * Restore facility
     */
    restoreFacility(type, index) {
        const facilities = type === 'urinal' ? this.urinals : this.cubicles;
        
        if (index >= 0 && index < facilities.length) {
            facilities[index].setOutOfOrder(false);
        }
    }
    
    /**
     * Get random available facility for out-of-order
     */
    getRandomAvailableFacility() {
        const allFacilities = [
            ...this.urinals.map((u, i) => ({ type: 'urinal', index: i, facility: u })),
            ...this.cubicles.map((c, i) => ({ type: 'cubicle', index: i, facility: c }))
        ];
        
        const available = allFacilities.filter(f => !f.facility.outOfOrder);
        
        if (available.length === 0) return null;
        
        return available[Math.floor(Math.random() * available.length)];
    }
    
    /**
     * Check game over conditions
     */
    checkGameOverConditions() {
        // Additional game over checks can be added here
        return false;
    }
    
    /**
     * Reset all facilities
     */
    reset() {
        this.urinals.forEach(urinal => {
            urinal.release();
            urinal.setOutOfOrder(false);
        });
        
        this.cubicles.forEach(cubicle => {
            cubicle.release();
            cubicle.setOutOfOrder(false);
        });
    }
    
    /**
     * Get all facilities
     */
    getAllFacilities() {
        return {
            urinals: this.urinals,
            cubicles: this.cubicles
        };
    }
}
