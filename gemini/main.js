// main.js - Entry Point for Checkmate Gemini

import { GameEngine } from './js/GameEngine.js';
import { FacilityManager } from './js/FacilityManager.js';
import { MaleSpawner } from './js/MaleSpawner.js';
import { RenderEngine } from './js/RenderEngine.js';
import { InputHandler } from './js/InputHandler.js';
import { AudioManager } from './js/AudioManager.js';
import { ParticleSystem } from './js/ParticleSystem.js';
import { StorageManager } from './js/StorageManager.js';

// Configuration
window.GAME_CONFIG = {
    urinalCount: 5,
    cubicleCount: 2,
    initialSpawnRate: 2000,
    minSpawnRate: 600,
    spawnRateDecrease: 150,
    maleWaitTime: 10000, // Reduced from 12s to 10s for faster pace
    urinalUsageTime: 3500, // Reduced from 4s
    cubicleUsageTime: 8000, // Reduced from 10s
    outOfOrderStartDifficulty: 3,
    maxOutOfOrderFacilities: 2
};

document.addEventListener('DOMContentLoaded', () => {
    console.log("Checkmate Gemini Initializing...");

    // UI Elements
    const elements = {
        menuScreen: document.getElementById('menu-screen'),
        gameOverScreen: document.getElementById('gameOverScreen'),
        hudLayer: document.getElementById('hud-layer'),
        startButton: document.getElementById('start-button'),
        restartButton: document.getElementById('restart-button'),
        soundToggle: document.getElementById('sound-toggle'),
        currentScore: document.getElementById('current-score'),
        highScore: document.getElementById('high-score'),
        canvas: document.getElementById('game-canvas')
    };

    // Components
    const components = {};

    try {
        // Initialize Storage
        components.storageManager = new StorageManager();
        let bestScore = components.storageManager.getHighScore();
        elements.highScore.textContent = bestScore;

        // Initialize Audio
        components.audioManager = new AudioManager();

        // Initialize Particle System
        components.particleSystem = new ParticleSystem(elements.canvas);

        // Initialize Input
        components.inputHandler = new InputHandler();

        // Initialize Spawner & Facility Managers
        components.maleSpawner = new MaleSpawner(window.GAME_CONFIG);
        components.facilityManager = new FacilityManager(
            window.GAME_CONFIG.urinalCount, 
            window.GAME_CONFIG.cubicleCount
        );

        // Initialize Renderer
        const ctx = elements.canvas.getContext('2d');
        components.renderEngine = new RenderEngine(elements.canvas, ctx, components.particleSystem);

        // Link Components
        components.renderEngine.setFacilityManager(components.facilityManager);

        // Initialize Engine
        const gameEngine = new GameEngine(elements.canvas.id);
        gameEngine.initialize(components);

        // Create cyclic references where necessary
        components.facilityManager.gameEngine = gameEngine;
        components.maleSpawner.gameEngine = gameEngine;
        components.inputHandler.initialize(gameEngine, components.renderEngine, components.facilityManager);
        components.renderEngine.gameEngine = gameEngine;

        // Setup resize handler
        const resizeCanvas = () => {
            elements.canvas.width = window.innerWidth;
            // Subtract header height approximately (70px)
            elements.canvas.height = window.innerHeight - document.querySelector('header').offsetHeight;
            components.renderEngine.updateDimensions();
            components.facilityManager.updatePositions(elements.canvas.width, elements.canvas.height);
            components.particleSystem.resize(elements.canvas.width, elements.canvas.height);
        };
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Setup UI Event Listeners
        elements.startButton.addEventListener('click', () => {
            elements.menuScreen.classList.remove('active');
            elements.menuScreen.classList.add('hidden');
            elements.hudLayer.classList.remove('hidden');
            
            // Initialize audio context on first user interaction
            components.audioManager.initContext();
            
            gameEngine.start();
        });

        const gameOverReasonEl = document.getElementById('game-over-reason');
        const finalScoreEl = document.getElementById('final-score');
        const comboEl = document.getElementById('final-combo');
        const gameOverScreen = document.getElementById('game-over-screen');

        // Hook into game engine ending
        gameEngine.onGameOver = (reason, score, maxCombo, isNewHighScore) => {
            elements.hudLayer.classList.add('hidden');
            gameOverScreen.classList.remove('hidden');
            gameOverScreen.classList.add('active');

            finalScoreEl.textContent = score;
            comboEl.textContent = `x${maxCombo}`;
            
            if (reason === 'timeout') {
                gameOverReasonEl.textContent = "Patience timer expired!";
            } else if (reason === 'adjacency') {
                gameOverReasonEl.textContent = "Adjacency rule violated!";
            }

            if (isNewHighScore) {
                document.getElementById('high-score-message').classList.remove('hidden');
                elements.highScore.textContent = score;
            } else {
                document.getElementById('high-score-message').classList.add('hidden');
            }
        };

        // Lives update hook
        const livesDisplay = document.getElementById('lives-display');
        gameEngine.onLivesUpdate = (lives) => {
            const maxLives = 3;
            livesDisplay.innerHTML = '';
            for (let i = 0; i < maxLives; i++) {
                const lifeIcon = document.createElement('div');
                lifeIcon.className = 'life-icon';
                if (i >= lives) {
                    lifeIcon.classList.add('lost');
                }
                livesDisplay.appendChild(lifeIcon);
            }
        };

        // Combo update hook
        const currentComboEl = document.getElementById('combo-multiplier');
        const comboContainerEl = document.getElementById('combo-display');
        gameEngine.onComboUpdate = (combo) => {
            currentComboEl.textContent = `x${combo}`;
            
            // Bump animation
            comboContainerEl.classList.remove('bump');
            void comboContainerEl.offsetWidth; // trigger reflow
            comboContainerEl.classList.add('bump');
            
            // High combo feedback
            if (combo >= 5) {
                document.body.classList.add('high-combo-glow');
            } else {
                document.body.classList.remove('high-combo-glow');
            }
        };

        // Score update hook
        gameEngine.onScoreUpdate = (score) => {
            elements.currentScore.textContent = score;
        };

        elements.restartButton.addEventListener('click', () => {
            gameOverScreen.classList.remove('active');
            gameOverScreen.classList.add('hidden');
            elements.hudLayer.classList.remove('hidden');
            gameEngine.start();
        });

        // Add damage vignette to body
        const damageVignette = document.createElement('div');
        damageVignette.className = 'vignette-damage';
        document.body.appendChild(damageVignette);

        gameEngine.onDamage = () => {
            document.body.classList.add('screen-shake');
            damageVignette.classList.add('active');
            setTimeout(() => {
                document.body.classList.remove('screen-shake');
                damageVignette.classList.remove('active');
            }, 400);
        };

    } catch (e) {
        console.error("Failed to initialize game:", e);
    }
});
