// js/AudioManager.js

export class AudioManager {
    constructor() {
        this.context = null;
        this.muted = false;
        
        // Synth settings for generated audio
        this.masterVolume = null;
    }

    initContext() {
        if (!this.context) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            
            this.masterVolume = this.context.createGain();
            this.masterVolume.gain.value = 0.3; // 30% volume
            this.masterVolume.connect(this.context.destination);
            
            // Re-bind UI toggle
            const toggleBtn = document.getElementById('sound-toggle');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    this.muted = !this.muted;
                    document.getElementById('sound-icon').textContent = this.muted ? '🔇' : '🔊';
                });
            }
        }
        
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    playTone(freq, type, duration, vol = 1) {
        if (this.muted || !this.context) return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        
        gain.gain.setValueAtTime(vol, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterVolume);
        
        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    onAssign() {
        // Satisfying "pop" sound
        this.playTone(600, 'sine', 0.1, 0.5);
        setTimeout(() => this.playTone(800, 'sine', 0.1, 0.2), 50);
    }
    
    onError() {
        // Dull "thud" for invalid placement
        this.playTone(150, 'square', 0.2, 0.6);
    }
    
    onMistake() {
        // Screen shake equivalent sound (deep, dissonant)
        this.playTone(100, 'sawtooth', 0.4, 0.8);
        this.playTone(95, 'sawtooth', 0.4, 0.8);
    }

    onScore(combo) {
        // Pitch goes up with combo
        const baseFreq = 400;
        const freqMultiplier = Math.min(2.5, 1 + (combo * 0.1));
        
        this.playTone(baseFreq * freqMultiplier, 'triangle', 0.3, 0.4);
    }
}