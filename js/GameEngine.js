/**
 * GameEngine - Core game loop and state management
 * Handles game initialization, state transitions, and main update loop
 */

export class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.state = {
            status: 'menu', // 'menu', 'playing', 'paused', 'gameOver'
            score: 0,
            highScore: 0,
            isNewHighScore: false,
            difficulty: 1,
            lives: 3, // Start with 3 lives
            malesServiced: 0,
            gameOverReason: null, // 'timeout', 'adjacency'
            startTime: null,
            facilities: {
                urinals: [],
                cubicles: []
            },
            males: new Map(),
            spawnRate: 2000, // milliseconds between spawns
            lastSpawn: 0
        };
        
        // Game loop
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        this.isRunning = false;
        
        // Components (will be injected)
        this.facilityManager = null;
        this.maleSpawner = null;
        this.audioManager = null;
        this.renderEngine = null;
        this.inputHandler = null;
        this.storageManager = null;
    }
    
    /**
     * Initialize game with all components
     */
    initialize(components) {
        this.facilityManager = components.facilityManager;
        this.maleSpawner = components.maleSpawner;
        this.audioManager = components.audioManager;
        this.renderEngine = components.renderEngine;
        this.inputHandler = components.inputHandler;
        this.storageManager = components.storageManager;
        
        // Load high score
        if (this.storageManager) {
            this.state.highScore = this.storageManager.getHighScore();
        }
    }
    
    /**
     * Start the game
     */
    start() {
        if (this.state.status === 'menu' || this.state.status === 'gameOver') {
            this.reset();
        }
        
        this.state.status = 'playing';
        this.state.startTime = Date.now();
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // Spawn first male immediately
        if (this.maleSpawner) {
            this.maleSpawner.spawnMale();
            console.log('First male spawned');
        }
        
        // Start game loop
        this.gameLoop(this.lastFrameTime);
    }
    
    /**
     * Pause the game
     */
    pause() {
        if (this.state.status === 'playing') {
            this.state.status = 'paused';
            this.isRunning = false;
            
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
        }
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (this.state.status === 'paused') {
            this.state.status = 'playing';
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.gameLoop(this.lastFrameTime);
        }
    }
    
    /**
     * Reset game state
     */
    reset() {
        this.state.score = 0;
        this.state.isNewHighScore = false;
        this.state.difficulty = 1;
        this.state.lives = 3; // Reset lives
        this.state.malesServiced = 0;
        this.state.gameOverReason = null;
        this.state.startTime = null;
        this.state.lastSpawn = 0;
        this.state.spawnRate = 2000; // Match config
        
        // Reset components
        if (this.facilityManager) {
            this.facilityManager.reset();
        }
        if (this.maleSpawner) {
            this.maleSpawner.reset();
        }
        
        console.log('Game reset complete');
    }
    
    /**
     * Main game loop using requestAnimationFrame
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Update game state
        this.update(deltaTime);
        
        // Render frame
        this.render();
        
        // Continue loop
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    /**
     * Update game state
     */
    update(deltaTime) {
        if (this.state.status !== 'playing') return;
        
        // Update components
        if (this.maleSpawner) {
            this.maleSpawner.update(deltaTime);
        }
        
        if (this.facilityManager) {
            this.facilityManager.update(deltaTime);
        }
        
        // Check for game over conditions
        this.checkGameOver();
    }
    
    /**
     * Render current frame
     */
    render() {
        if (this.renderEngine) {
            this.renderEngine.render(this.state);
        }
    }
    
    /**
     * Check for game over conditions
     */
    checkGameOver() {
        // Only check for timeouts if we have males waiting
        if (this.maleSpawner && this.maleSpawner.males.size > 0) {
            const timedOutMale = this.maleSpawner.checkForTimeout();
            if (timedOutMale) {
                console.log('Male timeout - losing a life');
                this.loseLife('timeout');
                // Remove the timed out male
                this.maleSpawner.removeMale(timedOutMale.id);
                return;
            }
        }
        
        // Additional game over checks handled by FacilityManager
    }
    
    /**
     * Lose a life
     */
    loseLife(reason) {
        this.state.lives--;
        console.log('Life lost! Reason:', reason, 'Lives remaining:', this.state.lives);
        
        // Trigger life change animation
        if (this.renderEngine && this.renderEngine.addLifeChangeAnimation) {
            this.renderEngine.addLifeChangeAnimation(-1);
        }
        
        if (this.state.lives <= 0) {
            // Game over
            this.endGame(reason);
        }
    }
    
    /**
     * Gain a life
     */
    gainLife() {
        this.state.lives++;
        console.log('Life gained! Lives:', this.state.lives);
        
        // Trigger life change animation
        if (this.renderEngine && this.renderEngine.addLifeChangeAnimation) {
            this.renderEngine.addLifeChangeAnimation(+1);
        }
    }
    
    /**
     * End the game
     */
    endGame(reason) {
        this.state.status = 'gameOver';
        this.state.gameOverReason = reason;
        this.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Check and update high score
        this.checkAndUpdateHighScore();
    }
    
    /**
     * Increment score
     */
    incrementScore() {
        this.state.score++;
        this.state.malesServiced++;
        
        // Check for milestone (every 10 points)
        if (this.state.score % 10 === 0 && this.audioManager) {
            this.audioManager.onMilestoneReached();
            // Increase difficulty every 10 points
            this.updateDifficulty();
        }
    }
    
    /**
     * Update difficulty
     */
    updateDifficulty() {
        this.state.difficulty++;
        
        // Get config from main.js if available
        const config = window.GAME_CONFIG || {
            minSpawnRate: 800,
            spawnRateDecrease: 150
        };
        
        // Increase spawn rate (decrease time between spawns)
        this.state.spawnRate = Math.max(
            config.minSpawnRate, 
            this.state.spawnRate - config.spawnRateDecrease
        );
        
        if (this.maleSpawner) {
            this.maleSpawner.updateSpawnRate(this.state.spawnRate);
        }
        
        console.log('Difficulty increased to', this.state.difficulty, 'Spawn rate:', this.state.spawnRate + 'ms');
    }
    
    /**
     * Get current score
     */
    getScore() {
        return this.state.score;
    }
    
    /**
     * Get high score
     */
    getHighScore() {
        return this.state.highScore;
    }
    
    /**
     * Check and update high score
     */
    checkAndUpdateHighScore() {
        // Get the previous high score from storage to compare
        const previousHighScore = this.storageManager ? this.storageManager.getHighScore() : this.state.highScore;
        
        // Only consider it a new high score if:
        // 1. Current score is greater than previous high score
        // 2. Current score is greater than 0 (to avoid 0 being a "new high score")
        if (this.state.score > previousHighScore && this.state.score > 0) {
            this.state.highScore = this.state.score;
            this.state.isNewHighScore = true;
            
            if (this.storageManager) {
                this.storageManager.setHighScore(this.state.score);
                console.log('New high score saved:', this.state.score);
            }
        } else {
            // Not a new high score
            this.state.isNewHighScore = false;
            // Keep the existing high score
            this.state.highScore = previousHighScore;
        }
    }
    
    /**
     * Get game state
     */
    getGameState() {
        return this.state;
    }
    
    /**
     * Set game state
     */
    setGameState(newState) {
        this.state = { ...this.state, ...newState };
    }
    
    /**
     * Check if game is over
     */
    isGameOver() {
        return this.state.status === 'gameOver';
    }
}
