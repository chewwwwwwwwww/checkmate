/**
 * Facility - Represents a single urinal or cubicle
 * Tracks occupancy state, timing, and position
 */

export class Facility {
    constructor(type, index) {
        this.type = type; // 'urinal' or 'cubicle'
        this.index = index;
        this.occupied = false;
        this.occupiedBy = null;
        this.occupiedSince = null;
        this.usageDuration = type === 'urinal' ? 3000 : 8000; // ms
        this.outOfOrder = false;
        this.hasLifeReward = false; // Life reward indicator
        this.position = { x: 0, y: 0 };
    }
    
    /**
     * Assign a male to this facility
     */
    assign(maleId) {
        if (this.occupied || this.outOfOrder) {
            throw new Error(`Facility ${this.type}[${this.index}] is not available`);
        }
        
        this.occupied = true;
        this.occupiedBy = maleId;
        this.occupiedSince = Date.now();
    }
    
    /**
     * Release the facility
     */
    release() {
        this.occupied = false;
        this.occupiedBy = null;
        this.occupiedSince = null;
    }
    
    /**
     * Check if facility is ready for release
     */
    isReadyForRelease() {
        if (!this.occupied || !this.occupiedSince) {
            return false;
        }
        
        return (Date.now() - this.occupiedSince) >= this.usageDuration;
    }
    
    /**
     * Check if facility is available
     */
    isAvailable() {
        return !this.occupied && !this.outOfOrder;
    }
    
    /**
     * Set facility out of order
     */
    setOutOfOrder(outOfOrder) {
        this.outOfOrder = outOfOrder;
        if (outOfOrder && this.occupied) {
            // If setting out of order while occupied, release it
            this.release();
        }
    }
    
    /**
     * Get time remaining until release
     */
    getTimeRemaining() {
        if (!this.occupied || !this.occupiedSince) {
            return 0;
        }
        
        const elapsed = Date.now() - this.occupiedSince;
        return Math.max(0, this.usageDuration - elapsed);
    }
    
    /**
     * Get usage percentage (0-1)
     */
    getUsagePercentage() {
        if (!this.occupied || !this.occupiedSince) {
            return 0;
        }
        
        const elapsed = Date.now() - this.occupiedSince;
        return Math.min(1, elapsed / this.usageDuration);
    }
}
