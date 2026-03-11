const TONES = {
  assign: [
    { frequency: 392, duration: 0.05, type: "triangle", gain: 0.06 },
    { frequency: 523.25, duration: 0.07, type: "triangle", gain: 0.05, delay: 0.05 }
  ],
  urinalScore: [
    { frequency: 523.25, duration: 0.08, type: "sine", gain: 0.08 },
    { frequency: 659.25, duration: 0.1, type: "sine", gain: 0.07, delay: 0.06 },
    { frequency: 783.99, duration: 0.12, type: "triangle", gain: 0.06, delay: 0.12 }
  ],
  stall: [
    { frequency: 261.63, duration: 0.08, type: "triangle", gain: 0.05 },
    { frequency: 329.63, duration: 0.1, type: "triangle", gain: 0.045, delay: 0.06 }
  ],
  reward: [
    { frequency: 659.25, duration: 0.1, type: "sine", gain: 0.08 },
    { frequency: 880, duration: 0.12, type: "sine", gain: 0.08, delay: 0.08 },
    { frequency: 987.77, duration: 0.14, type: "triangle", gain: 0.07, delay: 0.16 }
  ],
  strike: [
    { frequency: 220, duration: 0.11, type: "square", gain: 0.085, bend: 170 },
    { frequency: 130.81, duration: 0.18, type: "sawtooth", gain: 0.08, delay: 0.1, bend: 98 }
  ],
  timeout: [
    { frequency: 220, duration: 0.08, type: "square", gain: 0.08, bend: 180 },
    { frequency: 146.83, duration: 0.16, type: "square", gain: 0.085, delay: 0.08, bend: 120 }
  ],
  lifeLoss: [
    { frequency: 196, duration: 0.08, type: "triangle", gain: 0.07, bend: 164.81 },
    { frequency: 130.81, duration: 0.14, type: "sawtooth", gain: 0.075, delay: 0.07, bend: 98 }
  ],
  disable: [
    { frequency: 240, duration: 0.08, type: "square", gain: 0.06, bend: 180 },
    { frequency: 174.61, duration: 0.1, type: "square", gain: 0.055, delay: 0.06 }
  ],
  restore: [
    { frequency: 330, duration: 0.08, type: "triangle", gain: 0.055 },
    { frequency: 440, duration: 0.1, type: "triangle", gain: 0.05, delay: 0.06 }
  ],
  levelUp: [
    { frequency: 587.33, duration: 0.08, type: "triangle", gain: 0.065 },
    { frequency: 783.99, duration: 0.12, type: "triangle", gain: 0.07, delay: 0.07 },
    { frequency: 1046.5, duration: 0.14, type: "sine", gain: 0.07, delay: 0.16 }
  ],
  gameOver: [
    { frequency: 164.81, duration: 0.16, type: "sawtooth", gain: 0.08, bend: 123.47 },
    { frequency: 110, duration: 0.22, type: "sawtooth", gain: 0.085, delay: 0.12, bend: 82.41 },
    { frequency: 82.41, duration: 0.32, type: "triangle", gain: 0.07, delay: 0.28 }
  ]
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

    const now = this.context.currentTime;
    const sequence = Array.isArray(TONES[name]) ? TONES[name] : [TONES[name]];

    sequence.forEach((tone) => {
      this.playTone(tone, now + (tone.delay ?? 0));
    });
  }

  playTone(tone, startAt) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = tone.type;
    oscillator.frequency.setValueAtTime(tone.frequency, startAt);
    if (tone.bend) {
      oscillator.frequency.linearRampToValueAtTime(tone.bend, startAt + tone.duration);
    }

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(tone.gain, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.duration);

    oscillator.connect(gain);
    gain.connect(this.context.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + tone.duration + 0.03);
  }
}
