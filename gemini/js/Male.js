/**
 * Male - Represents a male waiting for facility assignment
 * Tracks individual timers and state
 */

export class Male {
    constructor(id) {
        this.id = id;
        this.spawnTime = Date.now();
        this.maxWaitTime = 10000; // 10 seconds base
        this.assignedFacility = null;
        this.facilityType = null; // 'urinal' or 'cubicle'
        this.position = { x: 0, y: 0 };
        this.state = 'waiting'; // 'waiting', 'assigned', 'using'
    }
    
    /**
     * Get time remaining before timeout
     */
    getTimeRemaining() {
        if (this.state !== 'waiting') {
            return this.maxWaitTime;
        }
        
        const elapsed = Date.now() - this.spawnTime;
        return Math.max(0, this.maxWaitTime - elapsed);
    }
    
    /**
     * Get time percentage (0-1, where 1 is full time, 0 is timeout)
     */
    getTimePercentage() {
        return this.getTimeRemaining() / this.maxWaitTime;
    }
    
    /**
     * Check if male has timed out
     */
    hasTimedOut() {
        return this.state === 'waiting' && this.getTimeRemaining() === 0;
    }
    
    /**
     * Assign to facility
     */
    assignToFacility(facilityType, facilityIndex) {
        this.state = 'assigned';
        this.facilityType = facilityType;
        this.assignedFacility = facilityIndex;
    }
    
    /**
     * Mark as using facility
     */
    startUsing() {
        this.state = 'using';
    }
    
    /**
     * Get color for time bar based on time remaining
     */
    getTimeBarColor() {
        const percentage = this.getTimePercentage();
        
        if (percentage > 0.6) {
            return '#2ecc71'; // Green
        } else if (percentage > 0.4) {
            return '#f39c12'; // Yellow
        } else if (percentage > 0.2) {
            return '#e67e22'; // Orange
        } else {
            return '#e74c3c'; // Red
        }
    }
}
