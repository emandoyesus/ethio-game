// Synthesized Web Audio API sound effects & Ethiopian retro groove

class SoundManager {
  private ctx: AudioContext | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private musicInterval: number | null = null;
  public isMuted: boolean = false;
  private musicStep: number = 0;

  // Ethiopian pentatonic scale frequencies (Tizita Minor / Ambassel flavour)
  private readonly notes = [
    261.63, // C4
    293.66, // D4
    311.13, // Eb4
    392.00, // G4
    415.30, // Ab4
    523.25, // C5
    587.33, // D5
    622.25  // Eb5
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
      this.engineFilter.frequency.setValueAtTime(300, this.ctx.currentTime);

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

    const baseFreq = isBoosting ? 130 + speedRatio * 180 : 55 + speedRatio * 140;
    const filterFreq = isBoosting ? 1200 : 250 + speedRatio * 800;
    const gainVal = speedRatio > 0.05 ? Math.min(0.18, 0.04 + speedRatio * 0.12) : 0.02;

    const t = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.05);
    this.engineGain.gain.setTargetAtTime(gainVal, t, 0.05);
  }

  public stopEngine() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public playHorn() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    // Dual tone minibus horn: e.g. 440Hz + 554Hz (A4 + C#5)
    [440, 554].forEach(freq => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.setValueAtTime(0.2, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  public playCoin() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.31);
  }

  public playPassengerPickup() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    // Weyala Whistle + Happy chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.linearRampToValueAtTime(1800, t + 0.08);
    osc.frequency.linearRampToValueAtTime(2400, t + 0.18);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.29);
  }

  public playBunnaBoost() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.4);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.51);
  }

  public playCrash() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const t = this.ctx.currentTime;
    // Noise buffer for crash
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(120, t + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
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
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.2);

    gain.gain.setValueAtTime(0.25, t);
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
    }, 180); // ~166 BPM 8-bit groove
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

    // Bassline (Eskista syncopation)
    if (step % 2 === 0 || step === 5 || step === 11) {
      const bassNote = this.bassNotes[Math.floor(step / 2) % this.bassNotes.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(bassNote, t);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.17);
    }

    // Melodic Arpeggio in Ethiopian pentatonic
    const notePattern = [0, 2, 3, 5, 4, 3, 2, 1, 0, 3, 5, 7, 6, 4, 2, 0];
    const noteIdx = notePattern[step] % this.notes.length;
    const freq = this.notes[noteIdx];

    const leadOsc = this.ctx.createOscillator();
    const leadGain = this.ctx.createGain();
    leadOsc.type = 'square';
    leadOsc.frequency.setValueAtTime(freq, t);

    leadGain.gain.setValueAtTime(0.035, t);
    leadGain.gain.exponentialRampToValueAtTime(0.002, t + 0.12);

    leadOsc.connect(leadGain);
    leadGain.connect(this.ctx.destination);

    leadOsc.start(t);
    leadOsc.stop(t + 0.13);
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
