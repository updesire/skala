/**
 * Ambient Procedural Audio Engine for Aetheria
 * Generates organic, non-obtrusive resonant tones, harmonic breaths, and spatial pulses
 * using Web Audio API without external audio assets.
 */

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = false;
  private droneGain: GainNode | null = null;
  private droneOscillators: OscillatorNode[] = [];
  private masterGain: GainNode | null = null;

  constructor() {
    // Lazy initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleSound(force?: boolean): boolean {
    this.initContext();
    this.isEnabled = force !== undefined ? force : !this.isEnabled;
    
    if (this.isEnabled) {
      this.startAmbientDrone();
    } else {
      this.stopAmbientDrone();
    }
    return this.isEnabled;
  }

  public getSoundState(): boolean {
    return this.isEnabled;
  }

  private startAmbientDrone() {
    if (!this.ctx || !this.masterGain || this.droneOscillators.length > 0) return;

    try {
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.droneGain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 3);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, this.ctx.currentTime);

      this.droneGain.connect(filter);
      filter.connect(this.masterGain);

      // Frequencies for a calm, organic 432Hz-aligned pentatonic chord: A2 (108Hz), E3 (162Hz), B3 (243Hz)
      const freqs = [108, 162, 216, 324];
      freqs.forEach((f, i) => {
        if (!this.ctx || !this.droneGain) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f + (i * 0.4), this.ctx.currentTime);
        
        // Add subtle low frequency modulation (LFO) for breathing effect
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.12 + (i * 0.03), this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();

        osc.connect(this.droneGain);
        osc.start();
        this.droneOscillators.push(osc);
      });
    } catch {
      // Ignore audio init errors in restrictive environments
    }
  }

  private stopAmbientDrone() {
    if (!this.ctx || !this.droneGain) return;
    try {
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, this.ctx.currentTime);
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.5);
      setTimeout(() => {
        this.droneOscillators.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch {}
        });
        this.droneOscillators = [];
      }, 1600);
    } catch {}
  }

  /**
   * Plays a distinct, bespoke procedural acoustic signature for each wave type
   */
  public playWaveSignatureSound(waveShape: string, intensity = 0.6, rhythmSpeed = 1.0) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const vol = Math.max(0.02, Math.min(0.25, 0.08 * (intensity || 0.6)));

      switch (waveShape) {
        case 'double_pulse': {
          // Double rhythmic heartbeat chime (du-dum tone)
          const baseFreq = 216;
          [0, 0.18 / rhythmSpeed].forEach((delay, idx) => {
            if (!this.ctx || !this.masterGain) return;
            const t = now + delay;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(idx === 0 ? 320 : 440, t);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(idx === 0 ? baseFreq : baseFreq * 1.33, t);

            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(vol * (idx === 0 ? 1.0 : 0.85), t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.00001, t + 0.55);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.6);
          });
          break;
        }

        case 'radiant_burst': {
          // Cascading bright solar harmonic arpeggio
          const frequencies = [432, 540, 648, 864, 1080];
          frequencies.forEach((freq, idx) => {
            if (!this.ctx || !this.masterGain) return;
            const t = now + (idx * 0.04) / rhythmSpeed;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(freq, t);

            const chordVol = vol * (1.2 / (idx + 1));
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(chordVol, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.00001, t + 1.8 + idx * 0.3);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 2.4);
          });
          break;
        }

        case 'starlit_flicker': {
          // Rapid sparkling crystalline micro-bells (celestial twinkle)
          const notes = [648, 864, 720, 972, 1296];
          notes.forEach((freq, idx) => {
            if (!this.ctx || !this.masterGain) return;
            const t = now + (idx * 0.065) / rhythmSpeed;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(vol * 0.6, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.00001, t + 0.45);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 0.5);
          });
          break;
        }

        case 'deep_echo': {
          // Deep warm 108Hz sub-bass gong with multi-tap reverberation
          const subFreq = 108;
          [1, 1.5, 2.0].forEach((harmonic, idx) => {
            if (!this.ctx || !this.masterGain) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(220, now);
            filter.frequency.exponentialRampToValueAtTime(90, now + 3.0);

            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(subFreq * harmonic, now);

            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.linearRampToValueAtTime(vol * (idx === 0 ? 1.4 : 0.4), now + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + 3.2);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 3.5);
          });
          break;
        }

        case 'steady_hum': {
          // Focused continuous singing-bowl drone with gentle harmonic shimmer
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(324, now);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(324.8, now); // Gentle binaural beating

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(vol * 0.9, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.2);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.masterGain);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 2.3);
          osc2.stop(now + 2.3);
          break;
        }

        case 'soft_wave':
        default: {
          // Soft organic harmonic wave (pure 432Hz pentatonic cascade)
          this.playSignalResonance(intensity);
          break;
        }
      }
    } catch {}
  }

  /**
   * Plays a delicate, harmonic resonant chime when a Signal is sent or arrived
   */
  public playSignalResonance(intensity = 0.6, pitchMultiplier = 1.0, waveShape?: string) {
    if (waveShape && waveShape !== 'soft_wave') {
      this.playWaveSignatureSound(waveShape, intensity);
      return;
    }
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = 432 * pitchMultiplier;
      const harmonics = [1, 1.5, 2, 2.75];

      harmonics.forEach((h, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(baseFreq * h, now);

        const vol = (0.08 * (intensity || 0.5)) / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(vol, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.5 + (idx * 0.4));

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 3.5);
      });
    } catch {}
  }

  /**
   * Plays a subtle breath pulse when holding an Orb
   */
  public playBreathPulse(progress = 0.5) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120 + (progress * 200), now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(144 + (progress * 30), now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.03 * progress, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {}
  }

  /**
   * Water-like gentle space ripple tone
   */
  public playRippleTone(freq = 280) {
    if (!this.isEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.4);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {}
  }
}

export const ambientAudio = new AmbientAudioEngine();
