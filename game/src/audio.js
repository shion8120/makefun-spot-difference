// Tiny WebAudio sounds, every one synthesised here from oscillators and a noise burst: no sound
// files. The context starts on the first click or key (browsers allow audio only after a gesture),
// and every call is silent until then or while muted.

let ctx = null;
let master = null;
let muted = false;

export function unlockAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
  return muted;
}

export function isMuted() {
  return muted;
}

function tone(freq, start, dur, { type = 'sine', gain = 0.3, slide = 0 } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A pentatonic ladder: each find in a level rings one step higher.
const LADDER = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];

export function chime(step) {
  const f = LADDER[Math.min(step, LADDER.length - 1)];
  tone(f, 0, 0.5, { type: 'triangle', gain: 0.28 });
  tone(f * 1.5, 0.07, 0.6, { type: 'sine', gain: 0.16 });
  tone(f * 2, 0.14, 0.7, { type: 'sine', gain: 0.07 });
}

export function buzz() {
  tone(150, 0, 0.22, { type: 'square', gain: 0.12, slide: 0.6 });
  tone(110, 0.02, 0.25, { type: 'sawtooth', gain: 0.08, slide: 0.7 });
}

export function hintSound() {
  for (let i = 0; i < 4; i++) tone(880 + i * 220, i * 0.06, 0.35, { type: 'sine', gain: 0.1 });
}

export function tick(urgent) {
  tone(urgent ? 1320 : 990, 0, 0.06, { type: 'square', gain: urgent ? 0.07 : 0.04 });
}

export function fanfare() {
  [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => tone(f, i * 0.11, 0.7, { type: 'triangle', gain: 0.22 }));
  tone(261.63, 0, 1.2, { type: 'sine', gain: 0.15 });
}

export function timeUp() {
  [440, 392, 349.23, 293.66].forEach((f, i) => tone(f, i * 0.16, 0.45, { type: 'triangle', gain: 0.2 }));
}

export function click() {
  tone(660, 0, 0.08, { type: 'sine', gain: 0.1 });
}
