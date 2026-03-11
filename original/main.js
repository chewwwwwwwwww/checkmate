// Main entry point for Checkmate game
// Complete game implementation with all components

import { GameEngine } from './js/GameEngine.js';
import { FacilityManager } from './js/FacilityManager.js';
import { MaleSpawner } from './js/MaleSpawner.js';
import { AudioManager } from './js/AudioManager.js';
import { RenderEngine } from './js/RenderEngine.js';
import { InputHandler } from './js/InputHandler.js';
import { StorageManager } from './js/StorageManager.js';
import { MobileScrollManager } from './js/MobileScrollManager.js';

// DOM elements - with safety checks
let canvas = null;
let ctx = null;

// Function to safely get canvas and context
function initializeCanvasElements() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element with id "game-canvas" not found in DOM');
        return false;
    }

    try {
        ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Failed to get 2D context from canvas');
            return false;
        }
    } catch (error) {
        console.error('Error getting canvas context:', error);
        return false;
    }

    console.log('Canvas and context initialized successfully');
    return true;
}
// DOM element references - will be initialized after DOM loads
let startButton;
let restartButton;
let soundToggleButton;
let soundIcon;
let menuScreen;
let gameOverScreen;
let currentScoreElement;
let highScoreElement;
let finalScoreElement;
let gameOverReasonElement;
let highScoreMessageElement;
let gameTitleElement;

// Function to initialize DOM element references
function initializeDOMElements() {
    startButton = document.getElementById('start-button');
    restartButton = document.getElementById('restart-button');
    soundToggleButton = document.getElementById('sound-toggle');
    soundIcon = document.getElementById('sound-icon');
    menuScreen = document.getElementById('menu-screen');
    gameOverScreen = document.getElementById('game-over-screen');
    currentScoreElement = document.getElementById('current-score');
    highScoreElement = document.getElementById('high-score');
    finalScoreElement = document.getElementById('final-score');
    gameOverReasonElement = document.getElementById('game-over-reason');
    highScoreMessageElement = document.getElementById('high-score-message');
    gameTitleElement = document.getElementById('game-title');

    // Validate critical elements
    const criticalElements = {
        startButton, restartButton, soundToggleButton, soundIcon,
        menuScreen, gameOverScreen, currentScoreElement, highScoreElement,
        finalScoreElement, gameOverReasonElement, highScoreMessageElement, gameTitleElement
    };

    for (const [name, element] of Object.entries(criticalElements)) {
        if (!element) {
            console.error(`Critical DOM element not found: ${name}`);
            return false;
        }
    }

    console.log('All DOM elements initialized successfully');
    return true;
}

// Game components
let gameEngine;
let facilityManager;
let maleSpawner;
let audioManager;
let renderEngine;
let inputHandler;
let storageManager;
let mobileScrollManager;

// Mobile compatibility state
const mobileCompatibility = {
    isMobile: false,
    hasTouch: false,
    audioSupported: false,
    scrollSupported: false,
    canvasSupported: false,
    warnings: []
};

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

// Check mobile device compatibility
function checkMobileCompatibility() {
    // Detect mobile device
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    mobileCompatibility.isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());

    // Check touch support
    mobileCompatibility.hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Check audio support
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        mobileCompatibility.audioSupported = !!AudioContext;

        if (!mobileCompatibility.audioSupported) {
            mobileCompatibility.warnings.push('Audio may not be supported on this device');
        }
    } catch (error) {
        mobileCompatibility.audioSupported = false;
        mobileCompatibility.warnings.push('Audio is not supported on this device');
    }

    // Check canvas support
    const testCanvas = document.createElement('canvas');
    mobileCompatibility.canvasSupported = !!(testCanvas.getContext && testCanvas.getContext('2d'));

    if (!mobileCompatibility.canvasSupported) {
        mobileCompatibility.warnings.push('Canvas is not supported on this device');
    }

    // Check scroll support
    mobileCompatibility.scrollSupported = 'scrollBehavior' in document.documentElement.style;

    if (!mobileCompatibility.scrollSupported && mobileCompatibility.isMobile) {
        mobileCompatibility.warnings.push('Smooth scrolling may not work optimally on this device');
    }

    // Log compatibility info
    console.log('Mobile Compatibility Check:', mobileCompatibility);

    // Show warnings to user if any critical features are missing
    if (mobileCompatibility.warnings.length > 0) {
        showCompatibilityWarnings();
    }

    return mobileCompatibility;
}

// Show compatibility warnings to user
function showCompatibilityWarnings() {
    // Only show critical warnings (canvas not supported)
    const criticalWarnings = mobileCompatibility.warnings.filter(warning =>
        warning.includes('Canvas')
    );

    if (criticalWarnings.length === 0) return;

    const warningDiv = document.createElement('div');
    warningDiv.className = 'compatibility-warning';
    warningDiv.innerHTML = `
        <div class="warning-content">
            <h3>⚠️ Compatibility Notice</h3>
            <p>${criticalWarnings.join('<br>')}</p>
            <p>The game may not work properly on this device.</p>
            <button onclick="this.parentElement.parentElement.remove()" class="btn-primary">Continue Anyway</button>
        </div>
    `;

    document.body.appendChild(warningDiv);

    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (warningDiv.parentNode) {
            warningDiv.parentNode.removeChild(warningDiv);
        }
    }, 10000);
}

// Show mobile-specific user feedback
function showMobileFeedback(message, type = 'info', duration = 3000) {
    const feedbackDiv = document.createElement('div');
    feedbackDiv.className = `mobile-feedback mobile-feedback-${type}`;
    feedbackDiv.textContent = message;

    document.body.appendChild(feedbackDiv);

    // Fade in
    setTimeout(() => {
        feedbackDiv.classList.add('visible');
    }, 10);

    // Fade out and remove
    setTimeout(() => {
        feedbackDiv.classList.remove('visible');
        setTimeout(() => {
            if (feedbackDiv.parentNode) {
                feedbackDiv.parentNode.removeChild(feedbackDiv);
            }
        }, 300);
    }, duration);
}

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
        // Don't reassign ctx - keep the original context from initialization
        console.log('RenderEngine canvas updated');
    }

    console.log('Canvas resized:', displayWidth, 'x', displayHeight);
}

// Initialize game
function initializeGame() {
    console.log('initializeGame() called');

    // Initialize all DOM elements first
    if (!initializeDOMElements()) {
        console.error('Failed to initialize DOM elements');
        handleGameError(new Error('DOM elements not found'), 'DOM Setup');
        return;
    }

    // Initialize difficulty selector elements
    if (!initializeDifficultyElements()) {
        console.error('Failed to initialize difficulty selector elements');
        handleGameError(new Error('Difficulty selector elements not found'), 'Difficulty Setup');
        return;
    }

    // Initialize canvas elements
    if (!initializeCanvasElements()) {
        console.error('Failed to initialize canvas elements');
        handleGameError(new Error('Canvas initialization failed'), 'Canvas Setup');
        return;
    }

    // Check mobile compatibility
    checkMobileCompatibility();

    // Set up canvas
    resizeCanvas();

    // Create components with fallback handling
    try {
        gameEngine = new GameEngine('game-canvas');
        if (!gameEngine || !gameEngine.canvas || !gameEngine.ctx) {
            throw new Error('GameEngine failed to initialize properly');
        }

        storageManager = new StorageManager();
        facilityManager = new FacilityManager(GAME_CONFIG.urinalCount, GAME_CONFIG.cubicleCount, gameEngine);
        maleSpawner = new MaleSpawner(gameEngine);
        audioManager = new AudioManager();
        renderEngine = new RenderEngine(canvas, ctx);
        inputHandler = new InputHandler(canvas, gameEngine);
        mobileScrollManager = new MobileScrollManager();

        console.log('All game components initialized successfully');
    } catch (error) {
        console.error('Failed to initialize game components:', error);
        handleGameError(error, 'Component Initialization');
        return;
    }

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

    // Initialize mobile scroll manager
    mobileScrollManager.initialize();

    // Load real audio files
    const soundMap = audioManager.getDefaultSoundMap();
    audioManager.loadSounds(soundMap).then(() => {
        console.log('Audio files loaded successfully');

        // Show mobile feedback if on mobile device
        if (mobileCompatibility.isMobile && !audioManager.audioUnlocked) {
            showMobileFeedback('Tap Start to enable audio', 'info', 4000);
        }
    }).catch(error => {
        console.warn('Failed to load audio files, using synthetic sounds:', error);
        audioManager.createSyntheticSounds();

        // Show warning on mobile
        if (mobileCompatibility.isMobile) {
            showMobileFeedback('Audio files failed to load', 'warning', 3000);
        }
    });

    // Setup all event listeners
    setupEventListeners();

    // Update UI with high score
    updateScoreDisplay();

    // Start render loop for menu
    requestAnimationFrame(gameLoop);

    console.log('Game initialization complete!');
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

        // Update scroll state to 'gameOver'
        if (mobileScrollManager && mobileScrollManager.scrollState.gameState !== 'gameOver') {
            mobileScrollManager.updateGameState('gameOver');
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

// Difficulty selector elements (header-based) - will be initialized after DOM loads
let difficultyHeader;
let difficultyValueHeader;
let difficultyPlusHeader;
let difficultyMinusHeader;

// Function to initialize difficulty selector elements
function initializeDifficultyElements() {
    difficultyHeader = document.getElementById('difficulty-selector-header');
    difficultyValueHeader = document.getElementById('difficulty-value-header');
    difficultyPlusHeader = document.getElementById('difficulty-plus-header');
    difficultyMinusHeader = document.getElementById('difficulty-minus-header');

    if (!difficultyHeader || !difficultyValueHeader || !difficultyPlusHeader || !difficultyMinusHeader) {
        console.error('Difficulty selector elements not found');
        return false;
    }

    console.log('Difficulty selector elements initialized');
    return true;
}

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

// Function to setup all event listeners
function setupEventListeners() {
    // Header difficulty controls
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
    startButton.addEventListener('click', async () => {
        menuScreen.classList.add('hidden');

        // Unlock audio on first user interaction (mobile requirement)
        if (audioManager && audioManager.isMobile && !audioManager.audioUnlocked) {
            console.log('Unlocking audio on Start button click...');
            await audioManager.unlockAudioOnFirstInteraction();
        }

        // Update scroll state to 'playing' and handle scroll position
        if (mobileScrollManager) {
            mobileScrollManager.updateGameState('playing');
        }

        gameEngine.start();
        applyStartingDifficulty();

        // Update difficulty visibility
        updateDifficultyVisibility();

        // Start systems
        startOutOfOrderSystem();
        startLifeRewardSystem();
    });

    restartButton.addEventListener('click', async () => {
        gameOverScreen.classList.add('hidden');
        stopOutOfOrderSystem();
        stopLifeRewardSystem();

        // Reset button visibility
        restartButton.style.display = 'inline-block';
        highScoreMessageElement.classList.add('hidden');

        // Unlock audio on user interaction (mobile requirement)
        if (audioManager && audioManager.isMobile && !audioManager.audioUnlocked) {
            console.log('Unlocking audio on Restart button click...');
            await audioManager.unlockAudioOnFirstInteraction();
        }

        // Update scroll state to 'playing' and handle scroll position
        if (mobileScrollManager) {
            mobileScrollManager.updateGameState('playing');
        }

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

        // Update scroll state to 'menu' and restore scroll position
        if (mobileScrollManager) {
            mobileScrollManager.updateGameState('menu');
        }

        // Reset game state
        gameEngine.state.status = 'menu';
        gameEngine.state.score = 0; // Reset score to 0 when returning to menu

        // Update difficulty visibility
        updateDifficultyVisibility();
    });

    // Handle window resize
    window.addEventListener('resize', resizeCanvas);

    console.log('All event listeners setup successfully');
}

// Error handling and user feedback
function handleGameError(error, context = 'Unknown') {
    console.error(`Game error in ${context}:`, error);
    console.error('Error stack:', error.stack);

    // Log additional debug info
    console.log('Debug info:', {
        canvas: !!canvas,
        ctx: !!ctx,
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
        userAgent: navigator.userAgent,
        context: context
    });

    // Show user-friendly error message with more details
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';

    // Provide context-specific error messages
    let errorDetails = 'The game encountered an error. Please try refreshing the page.';
    if (context.includes('Canvas')) {
        errorDetails = 'Your browser may not support the canvas element. Please try a different browser or update your current one.';
    } else if (context.includes('Component')) {
        errorDetails = 'Failed to load game components. Please check your internet connection and refresh.';
    }

    errorMessage.innerHTML = `
        <div class="error-content">
            <h3>Oops! Something went wrong</h3>
            <p>${errorDetails}</p>
            <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">Error: ${context}</p>
            <button onclick="location.reload()" class="btn-primary">Refresh Game</button>
        </div>
    `;
    document.body.appendChild(errorMessage);

    // Don't auto-remove - let user decide when to refresh
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
    console.log('DOM Content Loaded - Starting game initialization');

    try {
        // Add a small delay to ensure all DOM elements are fully ready
        setTimeout(() => {
            try {
                initializeGame();
            } catch (error) {
                console.error('Delayed initialization error:', error);
                handleGameError(error, 'Delayed Initialization');
            }
        }, 100);
    } catch (error) {
        console.error('DOMContentLoaded error:', error);
        handleGameError(error, 'DOMContentLoaded');
    }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Document already loaded - Starting immediate initialization');
    setTimeout(() => {
        try {
            if (!gameEngine) { // Only initialize if not already done
                initializeGame();
            }
        } catch (error) {
            console.error('Fallback initialization error:', error);
            handleGameError(error, 'Fallback Initialization');
        }
    }, 100);
}

// Export for testing and make GAME_CONFIG globally accessible
window.GAME_CONFIG = GAME_CONFIG;
export { canvas, ctx, gameEngine, GAME_CONFIG };
