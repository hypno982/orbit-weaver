// Sound, built from oscillators so the game ships no audio files at all. Every
// cue is a short synth blip: collecting, pulsing, opening, taking a hit, dying.

let ctx = null;
let master = null;
let muted = false;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.22;
  return muted;
}

export function isMuted() {
  return muted;
}

function blip(freq, dur, type, gain, slideTo) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain || 0.3, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export function sfxCollect(chain) {
  // Pitch climbs with the chain, so the combo is something you can hear.
  const step = Math.min(chain, 8) - 1;
  blip(520 * Math.pow(1.09, step), 0.13, 'triangle', 0.26);
}

export function sfxPulse() {
  blip(210, 0.30, 'sine', 0.34, 80);
  blip(420, 0.16, 'triangle', 0.16, 200);
}

export function sfxHurt() {
  blip(150, 0.26, 'sawtooth', 0.26, 60);
}

export function sfxRift() {
  blip(330, 0.22, 'sine', 0.24, 500);
  setTimeout(() => blip(660, 0.30, 'sine', 0.22, 880), 110);
}

export function sfxDive() {
  blip(300, 0.24, 'triangle', 0.2, 620);
  setTimeout(() => blip(450, 0.24, 'triangle', 0.2, 900), 90);
}

export function sfxDeath() {
  blip(260, 0.55, 'sawtooth', 0.24, 50);
  setTimeout(() => blip(130, 0.7, 'sine', 0.2, 40), 120);
}

export function sfxWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => setTimeout(() => blip(n, 0.3, 'triangle', 0.22), i * 120));
}
