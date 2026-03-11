const TONES = {
  assign: { frequency: 392, duration: 0.06, type: "triangle", gain: 0.04 },
  urinalScore: { frequency: 523.25, duration: 0.12, type: "sine", gain: 0.05 },
  stall: { frequency: 261.63, duration: 0.1, type: "triangle", gain: 0.04 },
  reward: { frequency: 659.25, duration: 0.18, type: "sine", gain: 0.06, bend: 880 },
  strike: { frequency: 170, duration: 0.22, type: "sawtooth", gain: 0.05 },
  timeout: { frequency: 140, duration: 0.3, type: "square", gain: 0.05 },
  disable: { frequency: 220, duration: 0.12, type: "square", gain: 0.04 },
  restore: { frequency: 330, duration: 0.1, type: "triangle", gain: 0.04 },
  levelUp: { frequency: 587.33, duration: 0.16, type: "triangle", gain: 0.05, bend: 783.99 },
  gameOver: { frequency: 130.81, duration: 0.5, type: "sawtooth", gain: 0.06 }
};

export class AudioController {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  async unlock() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  toggleMuted() {
    this.muted = !this.muted;
    return this.muted;
  }

  cue(name) {
    if (this.muted || !this.context || !TONES[name]) return;

    const tone = TONES[name];
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, now);
    if (tone.bend) {
      oscillator.frequency.linearRampToValueAtTime(tone.bend, now + tone.duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(tone.gain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(now);
    oscillator.stop(now + tone.duration + 0.02);
  }
}
