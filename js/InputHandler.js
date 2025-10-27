/**
 * InputHandler - Handle mouse and touch input events
 * Manages click/touch events, coordinate translation, and input validation
 */

export class InputHandler {
    constructor(canvas, gameEngine) {
        this.canvas = canvas;
        this.gameEngine = gameEngine;
        this.isMouseDown = false;
        this.lastTouchTime = 0;
        
        // Bind event handlers
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        this.setupEventListeners();
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('click', this.handleClick);
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('mousemove', this.handleMouseMove);
        
        // Touch events
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown);
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        this.canvas.removeEventListener('click', this.handleClick);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('keydown', this.handleKeyDown);
    }
    
    /**
     * Get coordinates relative to canvas
     */
    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }
    
    /**
     * Handle mouse click events
     */
    handleClick(event) {
        if (this.gameEngine.state.status !== 'playing') return;
        
        const coords = this.getCanvasCoordinates(event);
        this.processFacilityClick(coords.x, coords.y);
    }
    
    /**
     * Handle mouse down events
     */
    handleMouseDown(event) {
        this.isMouseDown = true;
        
        // Provide immediate visual feedback
        if (this.gameEngine.state.status === 'playing') {
            const coords = this.getCanvasCoordinates(event);
            this.highlightFacilityAtCoordinates(coords.x, coords.y);
        }
    }
    
    /**
     * Handle mouse up events
     */
    handleMouseUp(event) {
        this.isMouseDown = false;
    }
    
    /**
     * Handle mouse move events
     */
    handleMouseMove(event) {
        if (this.gameEngine.state.status !== 'playing') return;
        
        const coords = this.getCanvasCoordinates(event);
        this.updateCursor(coords.x, coords.y);
    }
    
    /**
     * Handle touch start events
     */
    handleTouchStart(event) {
        event.preventDefault(); // Prevent scrolling
        
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            const coords = this.getCanvasCoordinates(touch);
            this.highlightFacilityAtCoordinates(coords.x, coords.y);
        }
    }
    
    /**
     * Handle touch end events
     */
    handleTouchEnd(event) {
        event.preventDefault();
        
        if (this.gameEngine.state.status !== 'playing') return;
        
        // Prevent double-tap zoom
        const currentTime = Date.now();
        if (currentTime - this.lastTouchTime < 300) {
            return;
        }
        this.lastTouchTime = currentTime;
        
        if (event.changedTouches.length === 1) {
            const touch = event.changedTouches[0];
            const coords = this.getCanvasCoordinates(touch);
            this.processFacilityClick(coords.x, coords.y);
        }
    }
    
    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        switch (event.key) {
            case ' ': // Spacebar
            case 'Escape':
                if (this.gameEngine.state.status === 'playing') {
                    this.gameEngine.pause();
                } else if (this.gameEngine.state.status === 'paused') {
                    this.gameEngine.resume();
                }
                event.preventDefault();
                break;
                
            case 'r':
            case 'R':
                if (this.gameEngine.state.status === 'gameOver') {
                    this.gameEngine.start();
                }
                break;
                
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                // Quick assign to urinal by number
                if (this.gameEngine.state.status === 'playing') {
                    const urinalIndex = parseInt(event.key) - 1;
                    this.assignToUrinal(urinalIndex);
                }
                break;
        }
    }
    
    /**
     * Process facility click/touch
     */
    processFacilityClick(x, y) {
        if (!this.gameEngine.facilityManager || !this.gameEngine.renderEngine) return;
        
        const facilities = this.gameEngine.facilityManager.getAllFacilities();
        const clickedFacility = this.gameEngine.renderEngine.getFacilityAtCoordinates(x, y, facilities);
        
        if (!clickedFacility) return;
        
        // Validate assignment
        const validation = this.validateFacilityAssignment(clickedFacility);
        if (!validation.valid) {
            this.showInvalidAssignmentFeedback(validation.reason);
            return;
        }
        
        // Get next waiting male
        const waitingMales = this.gameEngine.maleSpawner.getMalesInQueue();
        if (waitingMales.length === 0) return;
        
        const nextMale = waitingMales[0]; // First in queue
        
        try {
            // Assign male to facility
            if (clickedFacility.type === 'urinal') {
                const success = this.gameEngine.facilityManager.assignMaleToUrinal(
                    nextMale.id, 
                    clickedFacility.index
                );
                
                if (success) {
                    this.gameEngine.maleSpawner.assignMale(
                        nextMale.id, 
                        'urinal', 
                        clickedFacility.index
                    );
                    this.showSuccessfulAssignmentFeedback(clickedFacility);
                }
            } else {
                const success = this.gameEngine.facilityManager.assignMaleToCubicle(
                    nextMale.id, 
                    clickedFacility.index
                );
                
                if (success) {
                    this.gameEngine.maleSpawner.assignMale(
                        nextMale.id, 
                        'cubicle', 
                        clickedFacility.index
                    );
                    this.showSuccessfulAssignmentFeedback(clickedFacility);
                }
            }
        } catch (error) {
            console.warn('Assignment failed:', error);
            this.showInvalidAssignmentFeedback('Assignment failed');
        }
    }
    
    /**
     * Validate facility assignment
     */
    validateFacilityAssignment(clickedFacility) {
        const { facility, type, index } = clickedFacility;
        
        // Check if facility is available
        if (!facility.isAvailable()) {
            return { 
                valid: false, 
                reason: facility.outOfOrder ? 'out_of_order' : 'occupied' 
            };
        }
        
        // Allow adjacency placement - game will end after placement
        // (Adjacency check happens in FacilityManager after assignment)
        
        return { valid: true };
    }
    
    /**
     * Quick assign to urinal by index
     */
    assignToUrinal(urinalIndex) {
        if (!this.gameEngine.facilityManager) return;
        
        const facilities = this.gameEngine.facilityManager.getAllFacilities();
        if (urinalIndex >= facilities.urinals.length) return;
        
        const urinal = facilities.urinals[urinalIndex];
        const clickedFacility = { type: 'urinal', index: urinalIndex, facility: urinal };
        
        // Use the same logic as click processing
        this.processFacilityClick(urinal.position.x + 30, urinal.position.y + 40);
    }
    
    /**
     * Update cursor based on hover state
     */
    updateCursor(x, y) {
        if (!this.gameEngine.facilityManager || !this.gameEngine.renderEngine) return;
        
        const facilities = this.gameEngine.facilityManager.getAllFacilities();
        const hoveredFacility = this.gameEngine.renderEngine.getFacilityAtCoordinates(x, y, facilities);
        
        if (hoveredFacility) {
            const validation = this.validateFacilityAssignment(hoveredFacility);
            this.canvas.style.cursor = validation.valid ? 'pointer' : 'not-allowed';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    /**
     * Highlight facility at coordinates
     */
    highlightFacilityAtCoordinates(x, y) {
        if (!this.gameEngine.facilityManager || !this.gameEngine.renderEngine) return;
        
        const facilities = this.gameEngine.facilityManager.getAllFacilities();
        const facility = this.gameEngine.renderEngine.getFacilityAtCoordinates(x, y, facilities);
        
        if (facility && facility.facility.isAvailable()) {
            // Trigger visual feedback
            this.gameEngine.renderEngine.animateFacilityState(facility.facility);
        }
    }
    
    /**
     * Show successful assignment feedback
     */
    showSuccessfulAssignmentFeedback(facility) {
        // Visual feedback
        if (this.gameEngine.renderEngine) {
            this.gameEngine.renderEngine.animateFacilityState(facility.facility);
        }
        
        // Audio feedback could be added here
        // this.gameEngine.audioManager?.playSound('assignment_success');
    }
    
    /**
     * Show invalid assignment feedback
     */
    showInvalidAssignmentFeedback(reason) {
        // Visual feedback for invalid assignment
        this.canvas.classList.add('error-feedback');
        setTimeout(() => {
            this.canvas.classList.remove('error-feedback');
        }, 500);
        
        // Show user-friendly message
        this.showUserMessage(this.getInvalidAssignmentMessage(reason), 'error');
        
        console.log(`Invalid assignment: ${reason}`);
    }
    
    /**
     * Get user-friendly message for invalid assignment
     */
    getInvalidAssignmentMessage(reason) {
        switch (reason) {
            case 'occupied':
                return 'That facility is already in use!';
            case 'out_of_order':
                return 'That facility is out of order!';
            case 'adjacency':
                return 'Cannot place males next to each other at urinals!';
            default:
                return 'Cannot assign male to that facility!';
        }
    }
    
    /**
     * Show user message
     */
    showUserMessage(message, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `user-message ${type}`;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 3000);
    }
    
    /**
     * Get input state for debugging
     */
    getInputState() {
        return {
            isMouseDown: this.isMouseDown,
            lastTouchTime: this.lastTouchTime,
            canvasRect: this.canvas.getBoundingClientRect()
        };
    }
}