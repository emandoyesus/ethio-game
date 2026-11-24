// Realistic Web Audio API Synthesizer
// Features multi-harmonic combustion engine with gear shifts, suspension thuds, flasher relays, and tire squeal

export type RadioStationId = 'SHEGER' | 'BISRAT' | 'FANA' | 'OFF';

export interface RadioStation {
  id: RadioStationId;
  name: string;
  nameAmharic: string;
  freq: string;
  genre: string;
  tempo: number;
}

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'SHEGER',
    name: 'Sheger FM',
    nameAmharic: 'ሸገር ኤፍ ኤም',
    freq: '102.1',
    genre: 'Eskista Kirar Groove',
    tempo: 140
  },
  {
    id: 'BISRAT',
    name: 'Bisrat FM',
    nameAmharic: 'ብስራት ኤፍ ኤም',
    freq: '101.1',
    genre: 'Tizita Soul Jazz',
    tempo: 210
  },
  {
    id: 'FANA',
    name: 'Fana FM',
    nameAmharic: 'ፋና ብሮድካስት',
    freq: '98.1',
    genre: 'Chic-Chic Fast Drive',
    tempo: 120
  },
  {
    id: 'OFF',
    name: 'Radio Muted',
    nameAmharic: 'ሬዲዮ ጠፍቷል',
    freq: 'OFF',
    genre: 'Engine Ambience Only',
    tempo: 0
  }
];

class SoundManager {
  private ctx: AudioContext | null = null;

  // Multi-harmonic engine nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Weather audio nodes
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  private screechOsc: OscillatorNode | null = null;
  private screechGain: GainNode | null = null;
  private musicInterval: number | null = null;
  public isMuted: boolean = false;
  private musicStep: number = 0;

  // Radio Station state
  public currentStationIndex: number = 0;

  private lastGear: number = 1;

  // Ethiopian pentatonic scale
  private readonly notes = [261.63, 293.66, 311.13, 392.00, 415.30, 523.25, 587.33, 622.25, 784.00];
  private readonly bassNotes = [130.81, 130.81, 155.56, 196.00, 130.81, 207.65, 196.00, 155.56];

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.initEngine();
  }

  private initEngine() {
    if (!this.ctx || this.engineOsc1) return;

    try {
      // Cylinder firing oscillator 1 (sawtooth for combustion bite)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

      // Low sub-bass rumble oscillator 2 (triangle for displacement)
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(22.5, this.ctx.currentTime);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start();
      this.engineOsc2.start();
    } catch {
      // Audio fallback
    }
  }

  public updateEngineRealistic(rpm: number, gear: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineGain || !this.engineFilter || this.isMuted) return;

    // Detect gear shift and trigger clutch exhaust pop
    if (gear !== this.lastGear) {
      this.lastGear = gear;
      this.playGearShift();
    }

    // Engine combustion frequency derived from actual RPM (4-cylinder: RPM / 120 * cylinders)
    const baseFreq = isBoosting ? (rpm / 60) * 1.6 : (rpm / 60) * 1.15;
    const filterFreq = isBoosting ? 1600 : 220 + (rpm / 7500) * 950;
    const gainVal = Math.min(0.22, 0.05 + (rpm / 7500) * 0.14);

    const t = this.ctx.currentTime;
    this.engineOsc1.frequency.setTargetAtTime(Math.max(35, baseFreq), t, 0.04);
    this.engineOsc2.frequency.setTargetAtTime(Math.max(18, baseFreq * 0.5), t, 0.04);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
    this.engineGain.gain.setTargetAtTime(gainVal, t, 0.04);
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    this.stopTireScreech();
  }

  public startRainAudio(intensity: number = 0.5) {
    if (!this.ctx || this.isMuted) return;
    if (this.rainGain) {
      this.rainGain.gain.setTargetAtTime(Math.min(0.18, intensity * 0.18), this.ctx.currentTime, 0.2);
      return;
    }
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = buffer;
      this.rainSource.loop = true;

      this.rainFilter = this.ctx.createBiquadFilter();
      this.rainFilter.type = 'lowpass';
      this.rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.rainGain.gain.setTargetAtTime(Math.min(0.18, intensity * 0.18), this.ctx.currentTime, 0.4);

      this.rainSource.connect(this.rainFilter);
      this.rainFilter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      this.rainSource.start();
    } catch {
      // Audio fallback
    }
  }

  public stopRainAudio() {
    if (this.rainGain && this.ctx) {
      this.rainGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
    }
  }

  public playThunder() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(65, t);
      osc.frequency.exponentialRampToValueAtTime(20, t + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, t);

      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.5);
    } catch {
      // Audio fallback
    }
  }

  private playGearShift() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Quick exhaust pop on upshift
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playSuspensionThud() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.21);
  }

  public playTurnSignalClick() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(920, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  public startTireScreech() {
    if (!this.ctx || this.isMuted) return;
    if (this.screechOsc) return;

    try {
      this.screechOsc = this.ctx.createOscillator();
      this.screechGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.screechOsc.type = 'sawtooth';
      this.screechOsc.frequency.setValueAtTime(780, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.screechGain.gain.setValueAtTime(0.09, this.ctx.currentTime);

      this.screechOsc.connect(filter);
      filter.connect(this.screechGain);
      this.screechGain.connect(this.ctx.destination);

      this.screechOsc.start();
    } catch {
      // Fallback
    }
  }

  public stopTireScreech() {
    if (this.screechGain && this.ctx) {
      this.screechGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      setTimeout(() => {
        try {
          this.screechOsc?.stop();
          this.screechOsc?.disconnect();
          this.screechOsc = null;
          this.screechGain = null;
        } catch {
          // Cleaned
        }
      }, 60);
    }
  }

  public playHorn() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    [440, 554].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq + 4, t + 0.1);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.setValueAtTime(0.18, t + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  public playNearMiss() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playGoatBleat() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.linearRampToValueAtTime(520, t + 0.08);
    osc.frequency.linearRampToValueAtTime(460, t + 0.16);
    osc.frequency.linearRampToValueAtTime(490, t + 0.24);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.33);
  }

  public playCowMoo() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(105, t + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.51);
  }

  public playCoin() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1046.5, t);
    osc.frequency.setValueAtTime(1396.9, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  public playPassengerPickup() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    this.playClick(t);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1300, t + 0.05);
    osc.frequency.linearRampToValueAtTime(1900, t + 0.14);
    osc.frequency.linearRampToValueAtTime(2600, t + 0.24);

    gain.gain.setValueAtTime(0.2, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.36);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t + 0.05);
    osc.stop(t + 0.38);
  }

  public playClick(t?: number) {
    if (!this.ctx) return;
    const time = t ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, time);
    gain.gain.setValueAtTime(0.14, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  public playPoliceSiren() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      // 2 cycles of classic police wail
      for (let i = 0; i < 4; i++) {
        osc.frequency.setValueAtTime(650, t + i * 0.3);
        osc.frequency.linearRampToValueAtTime(980, t + i * 0.3 + 0.15);
        osc.frequency.linearRampToValueAtTime(650, t + i * 0.3 + 0.3);
      }

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 1.3);
    } catch {
      // Audio fallback
    }
  }

  // Authentic Ethiopian Traffic Police Pea Whistle (ፊሽካ)
  public playPoliceWhistle() {
    if (!this.ctx || this.isMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    try {
      const playBurst = (startTime: number, duration: number) => {
        if (!this.ctx) return;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const gain = this.ctx.createGain();

        // Dual detuned acoustic frequencies
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(2640, startTime);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2880, startTime);

        // Pea rattle tremolo (25 Hz flutter)
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(25, startTime);
        lfoGain.gain.setValueAtTime(175, startTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        // Envelope
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.26, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(startTime);
        osc2.start(startTime);
        lfo.start(startTime);

        osc1.stop(startTime + duration + 0.02);
        osc2.stop(startTime + duration + 0.02);
        lfo.stop(startTime + duration + 0.02);
      };

      // Two sharp authoritative blasts: short chirp then long blast (Tweet! TWEEEEET!)
      playBurst(t, 0.22);
      playBurst(t + 0.28, 0.58);
    } catch {
      // Audio fallback
    }
  }

  // High-Speed Racing Limits Doppler Oncoming Pass-by Whoosh
  public playOncomingWhoosh() {
    if (!this.ctx || this.isMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Steep acoustic Doppler shift (480 Hz down to 110 Hz)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.32);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(320, t + 0.32);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.28, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch {
      // Audio fallback
    }
  }

  // Racing Limits: High-Boost Nitrous Turbo Spool
  public playNitroSpool() {
    if (!this.ctx || this.isMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(3800, t + 0.65);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.72);
    } catch {
      // Audio fallback
    }
  }

  // Racing Limits: Mechanical Wastegate Blow-Off Valve (BOV) Flutter
  public playWastegateFlutter() {
    if (!this.ctx || this.isMuted) return;
    this.init();
    const t = this.ctx.currentTime;
    try {
      [0, 0.07, 0.14].forEach((delay, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const startFreq = 2200 - idx * 300;
        osc.frequency.setValueAtTime(startFreq, t + delay);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.45, t + delay + 0.06);

        gain.gain.setValueAtTime(0.14 - idx * 0.03, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.07);
      });
    } catch {
      // Audio fallback
    }
  }

  public playBunnaBoost() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(1050, t + 0.45);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.56);
  }

  public playCrash() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.4);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.linearRampToValueAtTime(110, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.41);
  }

  public playPothole() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.2);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.23);
  }

  public startMusic() {
    if (this.musicInterval) return;

    this.musicInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      this.playMusicStep();
    }, 160);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  private playMusicStep() {
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const step = this.musicStep % 16;
    this.musicStep++;

    if (step === 0 || step === 6 || step === 10) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(48, t + 0.14);

      kickGain.gain.setValueAtTime(0.18, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start(t);
      kickOsc.stop(t + 0.17);
    } else if (step === 4 || step === 12) {
      const rimOsc = this.ctx.createOscillator();
      const rimGain = this.ctx.createGain();
      rimOsc.type = 'triangle';
      rimOsc.frequency.setValueAtTime(320, t);
      rimOsc.frequency.exponentialRampToValueAtTime(90, t + 0.08);

      rimGain.gain.setValueAtTime(0.1, t);
      rimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      rimOsc.connect(rimGain);
      rimGain.connect(this.ctx.destination);
      rimOsc.start(t);
      rimOsc.stop(t + 0.1);
    }

    if (step % 2 === 0 || step === 7 || step === 11) {
      const bassNote = this.bassNotes[Math.floor(step / 2) % this.bassNotes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassNote, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    }

    const notePattern = [0, 2, 4, 6, 5, 4, 2, 1, 0, 4, 6, 8, 7, 5, 2, 0];
    const noteIdx = notePattern[step] % this.notes.length;
    const freq = this.notes[noteIdx];

    const leadOsc = this.ctx.createOscillator();
    const leadGain = this.ctx.createGain();
    leadOsc.type = 'triangle';
    leadOsc.frequency.setValueAtTime(freq, t);

    leadGain.gain.setValueAtTime(0.04, t);
    leadGain.gain.exponentialRampToValueAtTime(0.002, t + 0.13);

    leadOsc.connect(leadGain);
    leadGain.connect(this.ctx.destination);

    leadOsc.start(t);
    leadOsc.stop(t + 0.14);
  }

  public nextRadioStation(): RadioStation {
    this.currentStationIndex = (this.currentStationIndex + 1) % RADIO_STATIONS.length;
    const station = RADIO_STATIONS[this.currentStationIndex];
    this.playRadioStatic();
    this.stopMusic();
    if (station.tempo > 0 && !this.isMuted) {
      this.musicInterval = window.setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        this.playMusicStep();
      }, station.tempo);
    }
    return station;
  }

  public playRadioStatic() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.12), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      noise.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(t);
    } catch {
      // Audio fallback
    }
  }

  // Authentic Weyala double sheet-metal door slap ("Thump-Thump! Ready!")
  public playWeyalaThump() {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [0, 0.085].forEach(delay => {
      try {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(170, t + delay);
        osc.frequency.exponentialRampToValueAtTime(55, t + delay + 0.06);

        gain.gain.setValueAtTime(0.22, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + delay);
        osc.stop(t + delay + 0.08);
      } catch {
        // Audio fallback
      }
    });
  }

  // Ethiopian Weyala Street Callouts
  public speakWeyala(phrase: 'CALL_MEGENAGNA' | 'CALL_BOLE' | 'CALL_PIAZZA' | 'CALL_MERKATO' | 'BOARDING' | 'SLOW_DOWN' | 'PRAISE' | 'POTHOLE_SCARE' | 'POLICE_RED' | 'LAWFUL') {
    this.playWeyalaThump();

    const phrases: Record<string, string> = {
      CALL_MEGENAGNA: 'መገናኛ! መገናኛ! ሞላ ሞላ!',
      CALL_BOLE: 'ቦሌ! ቦሌ! ሁለት ሰው ብቻ!',
      CALL_PIAZZA: 'ፒያሳ! ፒያሳ! ማዘጋጃ!',
      CALL_MERKATO: 'መርካቶ! መርካቶ! ተራራው!',
      BOARDING: 'ግባ ግባ! መልስ አለኝ!',
      SLOW_DOWN: 'ቀስ በል እንጂ!',
      PRAISE: 'አቦ ይመችህ!',
      POTHOLE_SCARE: 'ወይኔ ጉድጓዱ!',
      POLICE_RED: 'ፖሊስ! ቀዩን አለፍከው!',
      LAWFUL: 'ጎበዝ ሹፌር! ሕግ አክባሪ!'
    };

    const text = phrases[phrase] || 'መገናኛ!';

    if ('speechSynthesis' in window && !this.isMuted) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = 1.35;
        utter.rate = 1.25;
        utter.volume = 0.85;

        // Try to find an Amharic or expressive voice
        const voices = window.speechSynthesis.getVoices();
        const amVoice = voices.find(v => v.lang.startsWith('am') || v.lang.startsWith('gez'));
        if (amVoice) {
          utter.voice = amVoice;
        }
        window.speechSynthesis.speak(utter);
      } catch {
        // Voice fallback
      }
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopEngine();
    }
    return this.isMuted;
  }
}

export const sound = new SoundManager();
