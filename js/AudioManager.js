/**
 * AudioManager - Handle audio loading and playback
 * Manages sound effects with error handling and volume control
 */

export class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.volume = 1.0;
        this.muted = false;
        this.audioContext = null;
        this.initialized = false;
        this.audioUnlocked = false;
        this.isMobile = this.detectMobileDevice();
        this.unlockAttempted = false;
        
        // Initialize audio context (for better browser compatibility)
        this.initializeAudioContext();
        
        // Initialize mobile audio if on mobile device
        if (this.isMobile) {
            this.initializeMobileAudio();
        }
    }
    
    /**
     * Detect if running on a mobile device
     */
    detectMobileDevice() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        
        // Check for mobile device patterns
        const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
        const isMobileUA = mobileRegex.test(userAgent.toLowerCase());
        
        // Check for touch support
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Check screen size (mobile typically < 768px)
        const isSmallScreen = window.innerWidth < 768;
        
        return isMobileUA || (hasTouch && isSmallScreen);
    }
    
    /**
     * Check if browser requires user gesture for audio
     */
    requiresUserGesture() {
        // iOS Safari and most mobile browsers require user gesture
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const android = /android/i.test(navigator.userAgent);
        
        return this.isMobile || iOS || android;
    }
    
    /**
     * Initialize audio context
     */
    initializeAudioContext() {
        try {
            // Create audio context for better control
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            
            // On mobile, audio context starts in suspended state
            if (this.isMobile && this.audioContext.state === 'suspended') {
                console.log('AudioContext created in suspended state (mobile)');
            }
        } catch (error) {
            console.warn('AudioContext not supported:', error);
            this.initialized = false;
        }
    }
    
    /**
     * Initialize mobile audio handling
     */
    initializeMobileAudio() {
        if (!this.requiresUserGesture()) {
            return;
        }
        
        // Set up event listeners for first user interaction
        const unlockEvents = ['touchstart', 'touchend', 'click'];
        
        const unlockHandler = () => {
            this.unlockAudioOnFirstInteraction();
            
            // Remove listeners after first unlock attempt
            unlockEvents.forEach(event => {
                document.removeEventListener(event, unlockHandler);
            });
        };
        
        unlockEvents.forEach(event => {
            document.addEventListener(event, unlockHandler, { once: true, passive: true });
        });
        
        console.log('Mobile audio unlock listeners registered');
    }
    
    /**
     * Unlock audio on first user interaction (required for mobile browsers)
     */
    async unlockAudioOnFirstInteraction() {
        if (this.audioUnlocked || this.unlockAttempted) {
            return;
        }
        
        this.unlockAttempted = true;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('AudioContext resumed');
            }
            
            // Create and play a silent sound to unlock audio
            const silentAudio = new Audio();
            silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////////////////////////////////////////////////';
            silentAudio.volume = 0.01;
            
            const playPromise = silentAudio.play();
            
            if (playPromise !== undefined) {
                await playPromise;
                this.audioUnlocked = true;
                console.log('Mobile audio unlocked successfully');
            }
        } catch (error) {
            console.warn('Failed to unlock audio:', error);
            // Try alternative unlock method
            this.fallbackAudioUnlock();
        }
    }
    
    /**
     * Fallback audio unlock method
     */
    fallbackAudioUnlock() {
        try {
            // Try to create and play a very short buffer
            if (this.audioContext) {
                const buffer = this.audioContext.createBuffer(1, 1, 22050);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);
                
                this.audioUnlocked = true;
                console.log('Audio unlocked using fallback method');
            }
        } catch (error) {
            console.warn('Fallback audio unlock failed:', error);
        }
    }
    
    /**
     * Load sounds from a sound map
     */
    async loadSounds(soundMap) {
        const loadPromises = Object.entries(soundMap).map(async ([soundId, soundPath]) => {
            try {
                await this.loadSound(soundId, soundPath);
            } catch (error) {
                console.warn(`Failed to load sound ${soundId}:`, error);
            }
        });
        
        await Promise.all(loadPromises);
    }
    
    /**
     * Load a single sound with mobile fallback strategies
     */
    async loadSound(soundId, soundPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            // Mobile-specific audio settings
            if (this.isMobile) {
                audio.preload = 'metadata'; // Use metadata instead of auto for mobile
                audio.load(); // Explicitly trigger load
            } else {
                audio.preload = 'auto';
            }
            
            let loadTimeout;
            
            const onSuccess = () => {
                clearTimeout(loadTimeout);
                this.sounds.set(soundId, audio);
                resolve(audio);
            };
            
            const onError = (error) => {
                clearTimeout(loadTimeout);
                console.warn(`Failed to load ${soundPath}:`, error);
                
                // Try fallback loading strategy for mobile
                if (this.isMobile) {
                    this.loadSoundWithFallback(soundId, soundPath)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error(`Failed to load ${soundPath}: ${error.message}`));
                }
            };
            
            audio.addEventListener('canplaythrough', onSuccess, { once: true });
            audio.addEventListener('loadeddata', onSuccess, { once: true });
            audio.addEventListener('error', onError, { once: true });
            
            audio.src = soundPath;
            audio.volume = this.volume;
            
            // Set timeout for mobile devices (they can be slow to load)
            if (this.isMobile) {
                loadTimeout = setTimeout(() => {
                    console.warn(`Loading ${soundId} taking longer than expected`);
                    // Don't reject, just warn - audio might still load
                }, 5000);
            }
        });
    }
    
    /**
     * Fallback loading strategy for mobile devices
     */
    async loadSoundWithFallback(soundId, soundPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            // Simplified loading for mobile
            audio.preload = 'none';
            audio.src = soundPath;
            audio.volume = this.volume;
            
            // Store even if not fully loaded - will load on first play
            this.sounds.set(soundId, audio);
            
            console.log(`Using fallback loading for ${soundId}`);
            resolve(audio);
        });
    }
    
    /**
     * Play a sound by ID with mobile support
     */
    playSound(soundId, options = {}) {
        if (this.muted) return;
        
        const soundData = this.sounds.get(soundId);
        if (!soundData) {
            console.warn(`Sound ${soundId} not found`);
            return;
        }
        
        // Handle synthetic sounds
        if (soundData.isSynthetic) {
            return this.playSyntheticSound(soundId);
        }
        
        // Ensure audio is unlocked on mobile before playing
        if (this.isMobile && !this.audioUnlocked && !this.unlockAttempted) {
            this.unlockAudioOnFirstInteraction();
        }
        
        try {
            // Clone audio for overlapping sounds
            const audioClone = soundData.cloneNode();
            audioClone.volume = (options.volume || 1.0) * this.volume;
            
            // Mobile-specific: ensure audio context is running
            if (this.isMobile && this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.playAudioElement(audioClone, soundId);
                });
            } else {
                this.playAudioElement(audioClone, soundId);
            }
            
            return audioClone;
        } catch (error) {
            console.warn(`Error playing sound ${soundId}:`, error);
        }
    }
    
    /**
     * Play audio element with error handling
     */
    playAudioElement(audioElement, soundId) {
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Playback started successfully
                    if (this.isMobile && !this.audioUnlocked) {
                        this.audioUnlocked = true;
                        console.log('Audio unlocked through playback');
                    }
                })
                .catch(error => {
                    console.warn(`Failed to play sound ${soundId}:`, error);
                    
                    // On mobile, try to unlock audio if not already done
                    if (this.isMobile && !this.audioUnlocked) {
                        console.log('Attempting to unlock audio after play failure');
                        this.unlockAudioOnFirstInteraction();
                    }
                });
        }
    }
    
    /**
     * Play a random sound from an array
     */
    playRandomSound(soundArray, options = {}) {
        if (!soundArray || soundArray.length === 0) return;
        
        const randomIndex = Math.floor(Math.random() * soundArray.length);
        const soundId = soundArray[randomIndex];
        return this.playSound(soundId, options);
    }
    
    /**
     * Set master volume
     */
    setVolume(level) {
        this.volume = Math.max(0, Math.min(1, level));
        
        // Update volume for all loaded sounds
        this.sounds.forEach(audio => {
            audio.volume = this.volume;
        });
    }
    
    /**
     * Mute/unmute all sounds
     */
    setMuted(muted) {
        this.muted = muted;
    }
    
    /**
     * Event-based audio methods
     */
    
    /**
     * Play urinal flush sound
     */
    onUrinalFlush() {
        // 30% chance to play zipper sound FIRST
        if (Math.random() < 0.3) {
            this.playSound('zipper');
            // Then play toilet flush after zipper
            setTimeout(() => {
                this.playSound('toilet_flush');
            }, 600);
        } else {
            // Just play toilet flush
            this.playSound('toilet_flush');
        }
        
        // 30% chance to play satisfied sound at the end
        if (Math.random() < 0.3) {
            setTimeout(() => {
                this.playSound('satisfied');
            }, 1500);
        }
    }
    
    /**
     * Play cubicle flush sound
     */
    onCubicleFlush() {
        // Always play toilet flush
        this.playSound('toilet_flush');
        
        // 30% chance to play satisfied sound
        if (Math.random() < 0.3) {
            setTimeout(() => {
                this.playSound('satisfied');
            }, 1000);
        }
    }
    
    /**
     * Play zipping sound
     */
    onZipSound() {
        this.playSound('zipper');
    }
    
    /**
     * Play milestone reached sound
     */
    onMilestoneReached() {
        this.playSound('satisfied');
    }
    
    /**
     * Create default sound map with actual audio files
     */
    getDefaultSoundMap() {
        return {
            'toilet_flush': 'assets/toilet-flushing.mp3',
            'zipper': 'assets/zipper.mp3',
            'satisfied': 'assets/satisfied-man.mp3'
        };
    }
    
    /**
     * Create sounds programmatically (for development/testing)
     */
    createSyntheticSounds() {
        if (!this.audioContext) return;
        
        // Create synthetic sounds using Web Audio API
        this.createSyntheticSound('urinal_flush', [400, 200], 0.8);
        this.createSyntheticSound('toilet_flush', [300, 150], 1.2);
        this.createSyntheticSound('zip', [800, 600, 400], 0.3);
        this.createSyntheticSound('satisfied_sigh', [200, 180, 160], 1.5);
    }
    
    /**
     * Create a synthetic sound using Web Audio API
     */
    createSyntheticSound(soundId, frequencies, duration) {
        if (!this.audioContext) return;
        
        // Create a function that generates the sound
        const generateSound = () => {
            const sampleRate = this.audioContext.sampleRate;
            const length = sampleRate * duration;
            const buffer = this.audioContext.createBuffer(1, length, sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < length; i++) {
                let sample = 0;
                const time = i / sampleRate;
                
                // Mix multiple frequencies
                frequencies.forEach((freq, index) => {
                    const envelope = Math.exp(-time * 2); // Decay envelope
                    sample += Math.sin(2 * Math.PI * freq * time) * envelope * (0.1 / frequencies.length);
                });
                
                data[i] = sample;
            }
            
            return buffer;
        };
        
        // Store the generator function
        this.sounds.set(soundId, {
            isSynthetic: true,
            generate: generateSound
        });
    }
    
    /**
     * Play synthetic sound
     */
    playSyntheticSound(soundId) {
        if (!this.audioContext) return;
        
        const soundData = this.sounds.get(soundId);
        if (!soundData || !soundData.isSynthetic) return;
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = soundData.generate();
            gainNode.gain.value = this.volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start();
        } catch (error) {
            console.warn(`Failed to play synthetic sound ${soundId}:`, error);
        }
    }
    

}