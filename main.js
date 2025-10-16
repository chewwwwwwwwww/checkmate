// Main entry point for Checkmate game
// Complete game implementation with all components

import { GameEngine } from './js/GameEngine.js';
import { FacilityManager } from './js/FacilityManager.js';
import { MaleSpawner } from './js/MaleSpawner.js';
import { AudioManager } from './js/AudioManager.js';
import { RenderEngine } from './js/RenderEngine.js';
import { InputHandler } from './js/InputHandler.js';
import { StorageManager } from './js/StorageManager.js';

// DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const soundToggleButton = document.getElementById('sound-toggle');
const soundIcon = document.getElementById('sound-icon');
const menuScreen = document.getElementById('menu-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const currentScoreElement = document.getElementById('current-score');
const highScoreElement = document.getElementById('high-score');
const finalScoreElement = document.getElementById('final-score');
const gameOverReasonElement = document.getElementById('game-over-reason');
const highScoreMessageElement = document.getElementById('high-score-message');
const gameTitleElement = document.getElementById('game-title');

// Game components
let gameEngine;
let facilityManager;
let maleSpawner;
let audioManager;
let renderEngine;
let inputHandler;
let storageManager;

// Game parameters (tuned for optimal experience)
const GAME_CONFIG = {
    urinalCount: 5,
    cubicleCount: 2,
    initialSpawnRate: 2000, // 2 seconds between spawns initially (Difficulty 1)
    minSpawnRate: 800, // Minimum 0.8 seconds between spawns
    spawnRateDecrease: 150, // Decrease by 150ms each difficulty level
    maleWaitTime: 12000, // 12 seconds before timeout
    urinalUsageTime: 4000, // 4 seconds to use urinal
    cubicleUsageTime: 10000, // 10 seconds to use cubicle
    difficultyIncreaseScore: 10, // Increase difficulty every 10 points
    outOfOrderStartDifficulty: 2, // Start out-of-order facilities at difficulty 2
    outOfOrderInterval: 15000, // Check for out-of-order every 15 seconds
    maxOutOfOrderFacilities: 2 // Maximum facilities that can be out of order at once
};

// Set canvas size with device pixel ratio support
function resizeCanvas() {
    const container = canvas.parentElement;
    
    // Set display size (simpler approach without DPI scaling for now)
    const displayWidth = container.clientWidth;
    const displayHeight = 600;
    
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    
    // Update facility positions if facility manager exists
    if (facilityManager) {
        facilityManager.updatePositions(displayWidth, displayHeight);
    }
    
    // Update render engine canvas reference
    if (renderEngine) {
        renderEngine.canvas = canvas;
        renderEngine.ctx = ctx; // Use the existing context, not a new one
        console.log('RenderEngine context updated');
    }
    
    console.log('Canvas resized:', displayWidth, 'x', displayHeight);
}

// Initialize game
function initializeGame() {
    // Set up canvas
    resizeCanvas();
    
    // Create components
    gameEngine = new GameEngine('game-canvas');
    storageManager = new StorageManager();
    facilityManager = new FacilityManager(GAME_CONFIG.urinalCount, GAME_CONFIG.cubicleCount, gameEngine);
    maleSpawner = new MaleSpawner(gameEngine);
    audioManager = new AudioManager();
    renderEngine = new RenderEngine(canvas, ctx);
    inputHandler = new InputHandler(canvas, gameEngine);
    
    // Update facility positions with actual canvas size
    facilityManager.updatePositions(canvas.width, canvas.height);
    
    // Debug logging
    console.log('Facilities created:', {
        urinals: facilityManager.urinals.length,
        cubicles: facilityManager.cubicles.length
    });
    console.log('Urinal positions:', facilityManager.urinals.map(u => u.position));
    console.log('Cubicle positions:', facilityManager.cubicles.map(c => c.position));
    
    // Configure game parameters
    gameEngine.state.spawnRate = GAME_CONFIG.initialSpawnRate;
    maleSpawner.spawnRate = GAME_CONFIG.initialSpawnRate;
    
    // Configure male wait time
    maleSpawner.defaultWaitTime = GAME_CONFIG.maleWaitTime;
    
    // Configure facility usage times
    facilityManager.urinals.forEach(urinal => {
        urinal.usageDuration = GAME_CONFIG.urinalUsageTime;
    });
    facilityManager.cubicles.forEach(cubicle => {
        cubicle.usageDuration = GAME_CONFIG.cubicleUsageTime;
    });
    
    // Set facility manager reference in render engine
    renderEngine.setFacilityManager(facilityManager);
    
    // Initialize game engine with components
    gameEngine.initialize({
        facilityManager,
        maleSpawner,
        audioManager,
        renderEngine,
        inputHandler,
        storageManager
    });
    
    // Load real audio files
    const soundMap = audioManager.getDefaultSoundMap();
    audioManager.loadSounds(soundMap).then(() => {
        console.log('Audio files loaded successfully');
    }).catch(error => {
        console.warn('Failed to load audio files, using synthetic sounds:', error);
        audioManager.createSyntheticSounds();
    });
    
    // Update UI with high score
    updateScoreDisplay();
    
    // Start render loop for menu
    requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop() {
    if (gameEngine.state.status === 'playing') {
        // Game engine handles its own loop when playing
    } else {
        // Render menu or game over screen
        renderEngine.clearCanvas();
        
        if (gameEngine.state.status === 'gameOver') {
            renderEngine.showGameOverScreen(
                gameEngine.state.gameOverReason,
                gameEngine.state.score,
                gameEngine.state.highScore,
                gameEngine.state.isNewHighScore
            );
        }
    }
    
    // Update score display
    updateScoreDisplay();
    
    // Continue loop
    requestAnimationFrame(gameLoop);
}

// Update score display in UI
function updateScoreDisplay() {
    currentScoreElement.textContent = gameEngine.state.score;
    highScoreElement.textContent = gameEngine.state.highScore;
    
    if (gameEngine.state.status === 'gameOver') {
        finalScoreElement.textContent = gameEngine.state.score;
        
        // Update game over reason
        const reasonText = gameEngine.state.gameOverReason === 'timeout' 
            ? 'A male had an accident on the floor!' 
            : 'You placed males too close together!';
        gameOverReasonElement.textContent = reasonText;
        
        // ALWAYS show the Play Again button
        restartButton.style.display = 'inline-block';
        
        // Show "New High Score" message ONLY if it's actually a new high score
        if (gameEngine.state.isNewHighScore) {
            highScoreMessageElement.classList.remove('hidden');
        } else {
            highScoreMessageElement.classList.add('hidden');
        }
        
        // Show game over screen
        gameOverScreen.classList.remove('hidden');
        menuScreen.classList.add('hidden');
    } else {
        gameOverScreen.classList.add('hidden');
    }
    
    // Update difficulty visibility
    updateDifficultyVisibility();
}

// Out-of-order facility management
let outOfOrderInterval = null;

// Start out-of-order facility system at difficulty 2
function startOutOfOrderSystem() {
    if (outOfOrderInterval) return; // Already started
    
    console.log('Out-of-order system activated at difficulty 2');
    
    outOfOrderInterval = setInterval(() => {
        if (gameEngine.state.status !== 'playing') return;
        if (gameEngine.state.difficulty < GAME_CONFIG.outOfOrderStartDifficulty) return;
        
        // Chance increases with difficulty
        const chance = Math.min(0.5, (gameEngine.state.difficulty - 2) * 0.15);
        
        if (Math.random() < chance) {
            addRandomOutOfOrderFacility();
        }
    }, GAME_CONFIG.outOfOrderInterval);
}

// Stop out-of-order system
function stopOutOfOrderSystem() {
    if (outOfOrderInterval) {
        clearInterval(outOfOrderInterval);
        outOfOrderInterval = null;
    }
}

// Get weighted facility for out-of-order based on difficulty
function getWeightedOutOfOrderFacility() {
    const difficulty = gameEngine.state.difficulty;
    const isLowDifficulty = difficulty <= 5;
    
    // Build weighted list
    const weighted = [];
    
    // Urinals
    facilityManager.urinals.forEach((urinal, index) => {
        if (urinal.outOfOrder || urinal.occupied) return;
        
        const isEven = (index + 1) % 2 === 0; // Urinal 2, 4 are even
        
        if (isLowDifficulty) {
            // Low difficulty: prioritize even urinals (2, 4)
            const weight = isEven ? 3 : 1;
            for (let i = 0; i < weight; i++) {
                weighted.push({ type: 'urinal', index });
            }
        } else {
            // High difficulty: prioritize odd urinals (1, 3, 5)
            const weight = isEven ? 1 : 3;
            for (let i = 0; i < weight; i++) {
                weighted.push({ type: 'urinal', index });
            }
        }
    });
    
    // Cubicles - medium priority
    facilityManager.cubicles.forEach((cubicle, index) => {
        if (cubicle.outOfOrder || cubicle.occupied) return;
        
        for (let i = 0; i < 2; i++) {
            weighted.push({ type: 'cubicle', index });
        }
    });
    
    if (weighted.length === 0) return null;
    return weighted[Math.floor(Math.random() * weighted.length)];
}

// Add random out-of-order facility with smart probabilities
function addRandomOutOfOrderFacility() {
    const currentOutOfOrder = [
        ...facilityManager.urinals.filter(u => u.outOfOrder),
        ...facilityManager.cubicles.filter(c => c.outOfOrder)
    ];
    
    if (currentOutOfOrder.length >= GAME_CONFIG.maxOutOfOrderFacilities) {
        return;
    }
    
    const facility = getWeightedOutOfOrderFacility();
    if (facility) {
        facilityManager.setFacilityOutOfOrder(facility.type, facility.index);
        console.log('Facility out of order:', facility.type, facility.index + 1);
        
        // Restore facility after some time (20-40 seconds)
        const restoreTime = 20000 + Math.random() * 20000;
        setTimeout(() => {
            facilityManager.restoreFacility(facility.type, facility.index);
            console.log('Facility restored:', facility.type, facility.index + 1);
        }, restoreTime);
    }
}

// Add life reward to a random facility
function addLifeReward() {
    // Build weighted list (prioritize even urinals and cubicles)
    const weighted = [];
    
    facilityManager.urinals.forEach((urinal, index) => {
        if (urinal.outOfOrder || urinal.hasLifeReward) return;
        
        const isEven = (index + 1) % 2 === 0;
        const weight = isEven ? 3 : 1; // Even urinals 3x more likely
        
        for (let i = 0; i < weight; i++) {
            weighted.push({ type: 'urinal', facility: urinal });
        }
    });
    
    facilityManager.cubicles.forEach((cubicle) => {
        if (cubicle.outOfOrder || cubicle.hasLifeReward) return;
        
        for (let i = 0; i < 3; i++) { // Cubicles also prioritized
            weighted.push({ type: 'cubicle', facility: cubicle });
        }
    });
    
    if (weighted.length === 0) return;
    
    const selected = weighted[Math.floor(Math.random() * weighted.length)];
    selected.facility.hasLifeReward = true;
    console.log('Life reward added to', selected.type, selected.facility.index + 1);
}

// Life reward system
let lifeRewardInterval = null;

function startLifeRewardSystem() {
    if (lifeRewardInterval) return;
    
    lifeRewardInterval = setInterval(() => {
        if (gameEngine.state.status !== 'playing') return;
        
        // 20% chance every 10 seconds
        if (Math.random() < 0.2) {
            addLifeReward();
        }
    }, 10000);
}

function stopLifeRewardSystem() {
    if (lifeRewardInterval) {
        clearInterval(lifeRewardInterval);
        lifeRewardInterval = null;
    }
}

// Difficulty selector elements (header-based)
const difficultyHeader = document.getElementById('difficulty-selector-header');
const difficultyValueHeader = document.getElementById('difficulty-value-header');
const difficultyPlusHeader = document.getElementById('difficulty-plus-header');
const difficultyMinusHeader = document.getElementById('difficulty-minus-header');

let selectedDifficulty = 1;

// Difficulty selector functions
function updateDifficultyDisplay(value) {
    difficultyValueHeader.textContent = value;
    selectedDifficulty = parseInt(value);
}

// Show/hide difficulty selector based on game state
function updateDifficultyVisibility() {
    if (gameEngine.state.status === 'playing') {
        difficultyHeader.classList.add('hidden');
    } else {
        difficultyHeader.classList.remove('hidden');
    }
}

// Header difficulty controls (single set of event listeners)
difficultyPlusHeader.addEventListener('click', () => {
    const newValue = Math.min(10, selectedDifficulty + 1);
    updateDifficultyDisplay(newValue);
});

difficultyMinusHeader.addEventListener('click', () => {
    const newValue = Math.max(1, selectedDifficulty - 1);
    updateDifficultyDisplay(newValue);
});

// Function to apply starting difficulty
function applyStartingDifficulty() {
    if (selectedDifficulty > 1) {
        // Set initial difficulty
        gameEngine.state.difficulty = selectedDifficulty;
        
        // Calculate spawn rate based on difficulty
        const spawnRateReduction = (selectedDifficulty - 1) * GAME_CONFIG.spawnRateDecrease;
        gameEngine.state.spawnRate = Math.max(
            GAME_CONFIG.minSpawnRate,
            GAME_CONFIG.initialSpawnRate - spawnRateReduction
        );
        
        if (maleSpawner) {
            maleSpawner.updateSpawnRate(gameEngine.state.spawnRate);
        }
        
        console.log(`Starting at difficulty ${selectedDifficulty}, spawn rate: ${gameEngine.state.spawnRate}ms`);
    }
}

// Event listeners for game controls
startButton.addEventListener('click', () => {
    menuScreen.classList.add('hidden');
    gameEngine.start();
    applyStartingDifficulty();
    
    // Update difficulty visibility
    updateDifficultyVisibility();
    
    // Start systems
    startOutOfOrderSystem();
    startLifeRewardSystem();
});

restartButton.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    stopOutOfOrderSystem();
    stopLifeRewardSystem();
    
    // Reset button visibility
    restartButton.style.display = 'inline-block';
    highScoreMessageElement.classList.add('hidden');
    
    gameEngine.start();
    applyStartingDifficulty();
    
    // Update difficulty visibility
    updateDifficultyVisibility();
    
    startOutOfOrderSystem();
    startLifeRewardSystem();
});

// Sound toggle button
soundToggleButton.addEventListener('click', () => {
    if (audioManager) {
        const isMuted = !audioManager.muted;
        audioManager.setMuted(isMuted);
        
        // Update button appearance
        if (isMuted) {
            soundIcon.textContent = '🔇';
            soundToggleButton.classList.add('muted');
            soundToggleButton.title = 'Unmute Sound';
        } else {
            soundIcon.textContent = '🔊';
            soundToggleButton.classList.remove('muted');
            soundToggleButton.title = 'Mute Sound';
        }
    }
});

// Game title click - return to menu
gameTitleElement.addEventListener('click', () => {
    // Stop the game if playing
    if (gameEngine.state.status === 'playing') {
        gameEngine.pause();
        stopOutOfOrderSystem();
        stopLifeRewardSystem();
    }
    
    // Hide game over screen if showing
    gameOverScreen.classList.add('hidden');
    
    // Show menu screen
    menuScreen.classList.remove('hidden');
    
    // Reset game state
    gameEngine.state.status = 'menu';
    
    // Update difficulty visibility
    updateDifficultyVisibility();
});

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Error handling and user feedback
function handleGameError(error, context = 'Unknown') {
    console.error(`Game error in ${context}:`, error);
    
    // Show user-friendly error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `
        <div class="error-content">
            <h3>Oops! Something went wrong</h3>
            <p>The game encountered an error. Please try refreshing the page.</p>
            <button onclick="location.reload()" class="btn-primary">Refresh Game</button>
        </div>
    `;
    document.body.appendChild(errorMessage);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorMessage.parentNode) {
            errorMessage.parentNode.removeChild(errorMessage);
        }
    }, 10000);
}

// Global error handler
window.addEventListener('error', (event) => {
    handleGameError(event.error, 'Global');
});

window.addEventListener('unhandledrejection', (event) => {
    handleGameError(event.reason, 'Promise');
});

// Initialize game when page loads with error handling
document.addEventListener('DOMContentLoaded', () => {
    try {
        initializeGame();
    } catch (error) {
        handleGameError(error, 'Initialization');
    }
});

// Export for testing and make GAME_CONFIG globally accessible
window.GAME_CONFIG = GAME_CONFIG;
export { canvas, ctx, gameEngine, GAME_CONFIG };
