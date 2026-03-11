/**
 * MobileScrollManager - Manages scroll behavior for mobile devices
 * Handles scroll position tracking, smooth scrolling, and state management
 * across different game phases (menu, playing, game over)
 */

export class MobileScrollManager {
    constructor() {
        this.scrollState = {
            currentPosition: 0,
            targetPosition: 0,
            isScrollingEnabled: true,
            gameState: 'menu',
            lastKnownMenuPosition: 0
        };
        
        this.isMobile = this.detectMobileDevice();
        this.isInitialized = false;
        
        // Bind methods
        this.handleScroll = this.handleScroll.bind(this);
    }
    
    /**
     * Detect if the device is mobile
     * @returns {boolean} True if mobile device detected
     */
    detectMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth <= 768;
        
        return isMobileUA || (isTouchDevice && isSmallScreen);
    }
    
    /**
     * Initialize the scroll manager
     */
    initialize() {
        if (this.isInitialized) return;
        
        // Track scroll position
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        
        // Update current position
        this.scrollState.currentPosition = window.pageYOffset || document.documentElement.scrollTop;
        
        this.isInitialized = true;
        console.log('MobileScrollManager initialized', {
            isMobile: this.isMobile,
            initialPosition: this.scrollState.currentPosition
        });
    }
    
    /**
     * Handle scroll events
     */
    handleScroll() {
        this.scrollState.currentPosition = window.pageYOffset || document.documentElement.scrollTop;
    }
    
    /**
     * Enable full-screen scrolling during gameplay
     */
    enableFullScreenScrolling() {
        if (!this.isMobile) return;
        
        // Remove any scroll restrictions
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
        
        this.scrollState.isScrollingEnabled = true;
        console.log('Full-screen scrolling enabled');
    }
    
    /**
     * Disable scrolling (if needed for specific states)
     */
    disableScrolling() {
        if (!this.isMobile) return;
        
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        
        this.scrollState.isScrollingEnabled = false;
        console.log('Scrolling disabled');
    }
    
    /**
     * Get current scroll position
     * @returns {number} Current scroll position in pixels
     */
    getCurrentScrollPosition() {
        return window.pageYOffset || document.documentElement.scrollTop;
    }
    
    /**
     * Smooth scroll to a specific position
     * @param {number} position - Target scroll position in pixels
     * @param {Object} options - Scroll options
     * @returns {Promise} Resolves when scroll is complete
     */
    smoothScrollTo(position, options = {}) {
        const {
            behavior = 'smooth',
            duration = 500
        } = options;
        
        return new Promise((resolve) => {
            // Use native smooth scrolling if supported
            if ('scrollBehavior' in document.documentElement.style) {
                window.scrollTo({
                    top: position,
                    behavior: behavior
                });
                
                // Estimate completion time
                setTimeout(resolve, duration);
            } else {
                // Fallback: manual smooth scrolling
                const startPosition = this.getCurrentScrollPosition();
                const distance = position - startPosition;
                const startTime = performance.now();
                
                const animateScroll = (currentTime) => {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function (ease-in-out)
                    const easeProgress = progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    const newPosition = startPosition + (distance * easeProgress);
                    window.scrollTo(0, newPosition);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateScroll);
                    } else {
                        resolve();
                    }
                };
                
                requestAnimationFrame(animateScroll);
            }
            
            this.scrollState.targetPosition = position;
        });
    }
    
    /**
     * Reset scroll position to top (for game start)
     * @returns {Promise} Resolves when scroll is complete
     */
    resetScrollPosition() {
        if (!this.isMobile) {
            return Promise.resolve();
        }
        
        console.log('Resetting scroll position to top');
        return this.smoothScrollTo(0);
    }
    
    /**
     * Scroll to optimal game playing position
     * Ensures header and game area are visible
     * @returns {Promise} Resolves when scroll is complete
     */
    scrollToGamePosition() {
        if (!this.isMobile) {
            return Promise.resolve();
        }
        
        // Scroll to top to show header and game canvas
        const targetPosition = 0;
        
        console.log('Scrolling to game position:', targetPosition);
        return this.smoothScrollTo(targetPosition);
    }
    
    /**
     * Save current scroll position for menu state
     */
    saveMenuScrollPosition() {
        this.scrollState.lastKnownMenuPosition = this.getCurrentScrollPosition();
        console.log('Menu scroll position saved:', this.scrollState.lastKnownMenuPosition);
    }
    
    /**
     * Restore scroll position to saved menu position
     * @returns {Promise} Resolves when scroll is complete
     */
    restoreMenuScrollPosition() {
        if (!this.isMobile) {
            return Promise.resolve();
        }
        
        const targetPosition = this.scrollState.lastKnownMenuPosition || 0;
        console.log('Restoring menu scroll position:', targetPosition);
        return this.smoothScrollTo(targetPosition);
    }
    
    /**
     * Update game state and handle scroll behavior accordingly
     * @param {string} newState - New game state ('menu', 'playing', 'gameOver')
     */
    updateGameState(newState) {
        const oldState = this.scrollState.gameState;
        this.scrollState.gameState = newState;
        
        console.log('Game state changed:', oldState, '->', newState);
        
        // Handle state-specific scroll behavior
        switch (newState) {
            case 'playing':
                // Save menu position before transitioning
                if (oldState === 'menu') {
                    this.saveMenuScrollPosition();
                }
                // Enable full scrolling and reset to game position
                this.enableFullScreenScrolling();
                this.scrollToGamePosition();
                break;
                
            case 'menu':
                // Restore menu scroll position
                this.enableFullScreenScrolling();
                if (oldState === 'playing' || oldState === 'gameOver') {
                    this.restoreMenuScrollPosition();
                }
                break;
                
            case 'gameOver':
                // Keep current position, enable scrolling
                this.enableFullScreenScrolling();
                break;
                
            default:
                console.warn('Unknown game state:', newState);
        }
    }
    
    /**
     * Clean up event listeners
     */
    destroy() {
        if (this.isInitialized) {
            window.removeEventListener('scroll', this.handleScroll);
            this.isInitialized = false;
            console.log('MobileScrollManager destroyed');
        }
    }
    
    /**
     * Get current state information (for debugging)
     * @returns {Object} Current scroll state
     */
    getState() {
        return {
            ...this.scrollState,
            isMobile: this.isMobile,
            isInitialized: this.isInitialized
        };
    }
}
