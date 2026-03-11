// js/GameEngine.js - Core game loop and state management

export class GameEngine {
    constructor(canvasId) {
        this.canvasId = canvasId;
        
        // Game state
        this.state = {
            status: 'menu', // 'menu', 'playing', 'paused', 'gameOver'
            score: 0,
            highScore: 0,
            isNewHighScore: false,
            difficulty: 1,
            lives: 3,
            combo: 0,
            maxCombo: 0,
            malesServiced: 0,
            gameOverReason: null,
            spawnRate: 2000
        };
        
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        this.isRunning = false;

        // Callbacks hooked dynamically
        this.onGameOver = () => {};
        this.onScoreUpdate = () => {};
        this.onDamage = () => {};
        this.onLivesUpdate = () => {};
        this.onComboUpdate = () => {};
    }
    
    initialize(components) {
        this.facilityManager = components.facilityManager;
        this.maleSpawner = components.maleSpawner;
        this.audioManager = components.audioManager;
        this.renderEngine = components.renderEngine;
        this.inputHandler = components.inputHandler;
        this.storageManager = components.storageManager;
        this.particleSystem = components.particleSystem;
        
        if (this.storageManager) {
            this.state.highScore = this.storageManager.getHighScore();
        }
    }
    
    start() {
        if (this.state.status === 'menu' || this.state.status === 'gameOver') {
            this.reset();
        }
        
        this.state.status = 'playing';
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // Initial spawn
        if (this.maleSpawner) {
            this.maleSpawner.spawnMale();
        }
        
        // Ensure UI updates immediately
        this.onLivesUpdate(this.state.lives);
        this.onComboUpdate(this.state.combo);
        
        this.gameLoop(this.lastFrameTime);
    }
    
    reset() {
        this.state.score = 0;
        this.state.isNewHighScore = false;
        this.state.difficulty = 1;
        this.state.lives = 3;
        this.state.combo = 0;
        this.state.maxCombo = 0;
        this.state.malesServiced = 0;
        this.state.gameOverReason = null;
        
        // Match config
        const config = window.GAME_CONFIG || { initialSpawnRate: 2000 };
        this.state.spawnRate = config.initialSpawnRate;
        
        if (this.facilityManager) this.facilityManager.reset();
        if (this.maleSpawner) this.maleSpawner.reset();
        if (this.particleSystem) this.particleSystem.clear();
        
        this.onScoreUpdate(0);
        this.onComboUpdate(0);
    }
    
    gameLoop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (this.state.status !== 'playing') return;
        
        if (this.maleSpawner) this.maleSpawner.update(deltaTime);
        if (this.facilityManager) this.facilityManager.update(deltaTime);
        if (this.particleSystem) this.particleSystem.update(deltaTime);
        
        this.checkGameOver();
    }
    
    render() {
        if (this.renderEngine) {
            this.renderEngine.render(this.state);
        }
    }
    
    checkGameOver() {
        if (this.maleSpawner && this.maleSpawner.males.size > 0) {
            const timedOutMale = this.maleSpawner.checkForTimeout();
            if (timedOutMale) {
                this.loseLife('timeout', timedOutMale.position);
                this.maleSpawner.removeMale(timedOutMale.id);
            }
        }
    }
    
    loseLife(reason, position = null) {
        this.state.lives--;
        this.state.combo = 0; // Reset combo on mistake
        this.onComboUpdate(0);
        this.onDamage(); // Shake screen
        this.onLivesUpdate(this.state.lives);
        
        if (this.audioManager) this.audioManager.onMistake();
        
        if (position && this.particleSystem && reason !== 'adjacency') {
            this.particleSystem.emitSquareExplosion(position.x, position.y, '#ef4444');
        }
        
        if (this.state.lives <= 0) {
            this.endGame(reason);
        }
    }
    
    incrementScore(x, y) {
        // Combo multiplier
        this.state.combo++;
        if (this.state.combo > this.state.maxCombo) {
            this.state.maxCombo = this.state.combo;
        }
        
        // Multiplier: +1 base score + 1 every 5 combo
        const comboBonus = Math.floor(this.state.combo / 5);
        this.state.score += (1 + comboBonus);
        this.state.malesServiced++;
        
        if (this.audioManager) this.audioManager.onScore(this.state.combo);
        if (this.particleSystem && x && y) {
            this.particleSystem.emitScoreText(x, y, `+${1 + comboBonus}`);
            this.particleSystem.emitConfetti(x, y);
        }
        
        this.onScoreUpdate(this.state.score);
        this.onComboUpdate(this.state.combo);
        
        // Difficulty scaling every 10 services
        if (this.state.malesServiced % 10 === 0) {
            this.updateDifficulty();
        }
    }
    
    updateDifficulty() {
        this.state.difficulty++;
        
        const config = window.GAME_CONFIG || { minSpawnRate: 600, spawnRateDecrease: 150 };
        this.state.spawnRate = Math.max(
            config.minSpawnRate, 
            this.state.spawnRate - config.spawnRateDecrease
        );
        
        if (this.maleSpawner) {
            this.maleSpawner.updateSpawnRate(this.state.spawnRate);
        }
    }
    
    endGame(reason) {
        this.state.status = 'gameOver';
        this.state.gameOverReason = reason;
        this.isRunning = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        const previousHighScore = this.storageManager ? this.storageManager.getHighScore() : this.state.highScore;
        if (this.state.score > previousHighScore && this.state.score > 0) {
            this.state.highScore = this.state.score;
            this.state.isNewHighScore = true;
            if (this.storageManager) this.storageManager.setHighScore(this.state.score);
        } else {
            this.state.isNewHighScore = false;
        }
        
        this.onGameOver(reason, this.state.score, this.state.maxCombo, this.state.isNewHighScore);
    }
}
