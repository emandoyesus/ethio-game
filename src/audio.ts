// Polished Web Audio API synthesizer for Addis Taxi Rush
// Features dynamic engine synthesis, dual-tone horns, animal bleats, tire squeals, and Eskista groove

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private screechOsc: OscillatorNode | null = null;
  private screechGain: GainNode | null = null;
  private musicInterval: number | null = null;
  public isMuted: boolean = false;
  private musicStep: number = 0;

  // Ethiopian pentatonic scale frequencies (Tizita Minor & Ambassel flavor)
  private readonly notes = [
    261.63, // C4
    293.66, // D4
    311.13, // Eb4
    392.00, // G4
    415.30, // Ab4
    523.25, // C5
    587.33, // D5
    622.25, // Eb5
    784.00  // G5
  ];

  private readonly bassNotes = [
    130.81, // C3
    130.81,
    155.56, // Eb3
    196.00, // G3
    130.81,
    207.65, // Ab3
    196.00,
    155.56
  ];

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
    if (!this.ctx || this.engineOsc) return;

    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineGain = this.ctx.createGain();
      this.engineFilter = this.ctx.createBiquadFilter();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch {
      // Audio setup fallback
    }
  }

  public updateEngine(speedRatio: number, isBoosting: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.engineFilter || this.isMuted) return;

    const baseFreq = isBoosting ? 140 + speedRatio * 190 : 55 + speedRatio * 155;
    const filterFreq = isBoosting ? 1400 : 260 + speedRatio * 900;
    const gainVal = speedRatio > 0.04 ? Math.min(0.2, 0.04 + speedRatio * 0.14) : 0.02;

    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.04);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.04);
    this.engineGain.gain.setTargetAtTime(gainVal, t, 0.04);
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
    this.stopTireScreech();
  }

  public startTireScreech() {
    if (!this.ctx || this.isMuted) return;
    if (this.screechOsc) return;

    try {
      this.screechOsc = this.ctx.createOscillator();
      this.screechGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      this.screechOsc.type = 'sawtooth';
      this.screechOsc.frequency.setValueAtTime(840, this.ctx.currentTime);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.screechGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

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
    // Classic dual-tone Minibus Taxi Horn: 440Hz + 554Hz with vibrato
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
    // Vibrato bleat
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
    osc.frequency.setValueAtTime(1046.5, t); // C6
    osc.frequency.setValueAtTime(1396.9, t + 0.08); // F6

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
    // Sliding door latch click
    this.playClick(t);

    // Weyala Whistle + Joyful chime
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
    }, 160); // Energetic ~185 BPM Eskista pace
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

    // 1. Kebero Drum Synthesizer (African Kick & Rimshot)
    if (step === 0 || step === 6 || step === 10) {
      // Kebero deep resonant thud
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, t);
      kickOsc.frequency.exponentialRampToValueAtTime(48, t + 0.14);

      kickGain.gain.setValueAtTime(0.2, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      kickOsc.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kickOsc.start(t);
      kickOsc.stop(t + 0.17);
    } else if (step === 4 || step === 12) {
      // Kebero sharp slap / rimshot
      const rimOsc = this.ctx.createOscillator();
      const rimGain = this.ctx.createGain();
      rimOsc.type = 'triangle';
      rimOsc.frequency.setValueAtTime(320, t);
      rimOsc.frequency.exponentialRampToValueAtTime(90, t + 0.08);

      rimGain.gain.setValueAtTime(0.12, t);
      rimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      rimOsc.connect(rimGain);
      rimGain.connect(this.ctx.destination);
      rimOsc.start(t);
      rimOsc.stop(t + 0.1);
    }

    // 2. Syncopated Bassline (Eskista shoulder-shake groove)
    if (step % 2 === 0 || step === 7 || step === 11) {
      const bassNote = this.bassNotes[Math.floor(step / 2) % this.bassNotes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(bassNote, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420, t);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    }

    // 3. Kirar Pluck / Ethiopian pentatonic lead melody
    const notePattern = [0, 2, 4, 6, 5, 4, 2, 1, 0, 4, 6, 8, 7, 5, 2, 0];
    const noteIdx = notePattern[step] % this.notes.length;
    const freq = this.notes[noteIdx];

    const leadOsc = this.ctx.createOscillator();
    const leadGain = this.ctx.createGain();
    leadOsc.type = 'triangle';
    leadOsc.frequency.setValueAtTime(freq, t);

    leadGain.gain.setValueAtTime(0.045, t);
    leadGain.gain.exponentialRampToValueAtTime(0.002, t + 0.13);

    leadOsc.connect(leadGain);
    leadGain.connect(this.ctx.destination);

    leadOsc.start(t);
    leadOsc.stop(t + 0.14);
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
