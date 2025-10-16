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
        
        // Initialize audio context (for better browser compatibility)
        this.initializeAudioContext();
    }
    
    /**
     * Initialize audio context
     */
    initializeAudioContext() {
        try {
            // Create audio context for better control
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (error) {
            console.warn('AudioContext not supported:', error);
            this.initialized = false;
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
     * Load a single sound
     */
    async loadSound(soundId, soundPath) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds.set(soundId, audio);
                resolve(audio);
            });
            
            audio.addEventListener('error', (error) => {
                reject(new Error(`Failed to load ${soundPath}: ${error.message}`));
            });
            
            audio.src = soundPath;
            audio.preload = 'auto';
            audio.volume = this.volume;
        });
    }
    
    /**
     * Play a sound by ID
     */
    playSound(soundId, options = {}) {
        if (this.muted) return;
        
        const audio = this.sounds.get(soundId);
        if (!audio) {
            console.warn(`Sound ${soundId} not found`);
            return;
        }
        
        try {
            // Clone audio for overlapping sounds
            const audioClone = audio.cloneNode();
            audioClone.volume = (options.volume || 1.0) * this.volume;
            
            // Play the sound
            const playPromise = audioClone.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Failed to play sound ${soundId}:`, error);
                });
            }
            
            return audioClone;
        } catch (error) {
            console.warn(`Error playing sound ${soundId}:`, error);
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
    
    /**
     * Enhanced playSound that handles both regular and synthetic sounds
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
        
        // Handle regular audio files
        try {
            const audioClone = soundData.cloneNode();
            audioClone.volume = (options.volume || 1.0) * this.volume;
            
            const playPromise = audioClone.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn(`Failed to play sound ${soundId}:`, error);
                });
            }
            
            return audioClone;
        } catch (error) {
            console.warn(`Error playing sound ${soundId}:`, error);
        }
    }
}