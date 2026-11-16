// Sound, synthesised in WebAudio. No files, no network: every noise the game makes is built here.

import { seeded, rangeOf } from './math.js';

export class Audio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.rand = seeded(0xf00d);
  }

  /** Browsers refuse an AudioContext until a gesture, so the first press or click starts it. */
  unlock() {
    if (this.ctx !== null) return;
    const Ctor = window.AudioContext ?? window.webkitAudioContext;
    if (Ctor === undefined) {
      this.enabled = false;
      return;
    }
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.24;
    this.master.connect(this.ctx.destination);
  }

  tone(freq, duration, type = 'sine', gain = 0.5, slideTo = null) {
    if (!this.enabled || this.ctx === null) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(amp);
    amp.connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  noise(duration, gain = 0.4, filterFreq = 1400) {
    if (!this.enabled || this.ctx === null) return;
    const now = this.ctx.currentTime;
    const frames = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i += 1) {
      data[i] = rangeOf(this.rand, -1, 1) * (1 - i / frames);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    src.connect(filter);
    filter.connect(amp);
    amp.connect(this.master);
    src.start(now);
  }

  gate() {
    this.tone(660, 0.14, 'triangle', 0.4, 990);
    this.tone(990, 0.2, 'sine', 0.22, 1320);
  }

  dock() {
    this.tone(392, 0.18, 'sine', 0.42, 587);
    this.tone(587, 0.3, 'sine', 0.3, 784);
    this.tone(784, 0.42, 'triangle', 0.22, 988);
  }

  crash() {
    this.noise(0.45, 0.5, 800);
    this.tone(140, 0.4, 'sawtooth', 0.3, 42);
  }

  pulse() {
    this.tone(220, 0.16, 'square', 0.22, 520);
    this.noise(0.12, 0.16, 2400);
  }

  ui() {
    this.tone(520, 0.08, 'triangle', 0.24, 700);
  }
}
