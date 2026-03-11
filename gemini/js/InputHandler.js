// js/InputHandler.js

export class InputHandler {
    constructor() {
        this.gameEngine = null;
        this.renderEngine = null;
        this.facilityManager = null;
        
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
    }
    
    initialize(gameEngine, renderEngine, facilityManager) {
        this.gameEngine = gameEngine;
        this.renderEngine = renderEngine;
        this.facilityManager = facilityManager;
        
        // Add listeners
        this.renderEngine.canvas.addEventListener('pointerdown', this.handlePointerDown);
        window.addEventListener('keydown', this.handleKeyDown);
    }
    
    handlePointerDown(e) {
        if (!this.gameEngine || this.gameEngine.state.status !== 'playing') return;
        
        const rect = this.renderEngine.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Find which facility was clicked
        if (!this.facilityManager) return;
        
        let targetFacility = null;
        
        // Check Urinals
        for (let i = 0; i < this.facilityManager.urinals.length; i++) {
            const u = this.facilityManager.urinals[i];
            const p = u.position;
            if (mouseX >= p.x && mouseX <= p.x + p.width && mouseY >= p.y && mouseY <= p.y + p.height) {
                targetFacility = u;
                break;
            }
        }
        
        // Check Cubicles
        if (!targetFacility) {
            for (let i = 0; i < this.facilityManager.cubicles.length; i++) {
                const c = this.facilityManager.cubicles[i];
                const p = c.position;
                if (mouseX >= p.x && mouseX <= p.x + p.width && mouseY >= p.y && mouseY <= p.y + p.height) {
                    targetFacility = c;
                    break;
                }
            }
        }
        
        if (targetFacility) {
            this.assignNextMaleTo(targetFacility);
        }
    }
    
    handleKeyDown(e) {
        if (!this.gameEngine || this.gameEngine.state.status !== 'playing') return;
        
        // Quick Assign using 1-5 for Urinals, Q/W for Cubicles
        let facility = null;
        
        if (e.key >= '1' && e.key <= '5') {
            const idx = parseInt(e.key) - 1;
            if (this.facilityManager && idx < this.facilityManager.urinals.length) {
                facility = this.facilityManager.urinals[idx];
            }
        } else if (e.key.toLowerCase() === 'q') {
            if (this.facilityManager && this.facilityManager.cubicles.length > 0) {
                facility = this.facilityManager.cubicles[0];
            }
        } else if (e.key.toLowerCase() === 'w') {
            if (this.facilityManager && this.facilityManager.cubicles.length > 1) {
                facility = this.facilityManager.cubicles[1];
            }
        }
        
        if (facility) {
            this.assignNextMaleTo(facility);
        }
    }
    
    assignNextMaleTo(facility) {
        const waitingMales = this.gameEngine.maleSpawner.getWaitingMales();
        if (waitingMales.length === 0) return;
        
        const popMale = waitingMales[0];
        
        let success = false;
        if (facility.type === 'urinal') {
            success = this.facilityManager.assignMaleToUrinal(popMale.id, facility.index);
        } else if (facility.type === 'cubicle') {
            success = this.facilityManager.assignMaleToCubicle(popMale.id, facility.index);
        }
        
        if (success) {
            popMale.state = 'using';
            // Snap to facility position for animation/rendering later if needed
            popMale.position.x = facility.position.x + facility.position.width / 2;
            popMale.position.y = facility.position.y + facility.position.height / 2;
            
            if (this.gameEngine.audioManager) {
                this.gameEngine.audioManager.onAssign();
            }
        } else {
            // Play error sound: facility full
            if (this.gameEngine.audioManager) {
                this.gameEngine.audioManager.onError();
            }
            
            // Optional: Shake facility visually?
        }
    }
}