// Wiring: the canvas fitted to the window (the game draws in a fixed 1280 x 800 view, letterboxed
// and sharp on high-DPI screens), mouse and keyboard routed to the game, the frame loop, the
// screen-reader status line, and ?shot=<name> / ?debug=1 for screenshots and checking.

import { createState, hoverAt, key, pointer, togglePause, update } from './game.js';
import { drawFrame } from './hud.js';
import { VIEW_H, VIEW_W } from './layout.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');
const params = new URLSearchParams(location.search);

const state = createState();
const opts = { debug: params.get('debug') === '1' };
if (params.get('shot')) applyShot(state, params.get('shot'));

let view = { scale: 1, ox: 0, oy: 0, dpr: 1 };

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const scale = Math.min(w / VIEW_W, h / VIEW_H);
  view = { scale, ox: (w - VIEW_W * scale) / 2, oy: (h - VIEW_H * scale) / 2, dpr };
}

function toView(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left - view.ox) / view.scale, y: (e.clientY - rect.top - view.oy) / view.scale };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = toView(e);
  pointer(state, p.x, p.y);
});

canvas.addEventListener('pointermove', (e) => {
  const p = toView(e);
  const h = hoverAt(state, p.x, p.y);
  canvas.style.cursor = h === 'panel' ? 'crosshair' : h ? 'pointer' : 'default';
});

window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
  if (!e.repeat) key(state, e.key);
});

// Leaving the tab pauses the hunt, so the clock never runs out unseen.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.screen === 'play' && !state.paused && !state.frozen) togglePause(state);
});

window.addEventListener('resize', resize);
resize();

let last = performance.now();
let spoken = '';

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(state, dt);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#05060f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const k = view.scale * view.dpr;
  ctx.setTransform(k, 0, 0, k, view.ox * view.dpr, view.oy * view.dpr);
  drawFrame(ctx, state, opts);
  if (state.announce !== spoken) {
    spoken = state.announce;
    status.textContent = spoken;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
