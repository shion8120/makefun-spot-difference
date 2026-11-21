// Everything drawn around and over the pictures: the title screen, the header with the countdown,
// the two framed panels with their marks (found rings, hint pulses, red crosses), the counter and
// buttons, and the cards for the level intro, pause, level complete, time up and the final win.

import { drawScene } from './draw.js';
import { LEVELS, levelPictures } from './scenes.js';
import { BUTTONS, PANELS, VIEW_H, VIEW_W } from './layout.js';
import { counterText, formatTime, HINT_SECONDS, HINTS_PER_LEVEL, isFound, remaining, totalScore } from './game.js';
import { isMuted } from './audio.js';

const SERIF = 'Georgia, "Palatino Linotype", "Book Antiqua", serif';
const SANS = '"Segoe UI", system-ui, -apple-system, sans-serif';
const GOLD = '#ffd36e';
const INK = '#0b0e22';
const TAU = Math.PI * 2;

let titleBackdrop = null;

export function drawFrame(ctx, s, opts = {}) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (s.screen === 'title') return drawTitle(ctx, s);
  if (s.screen === 'win') return drawWin(ctx, s);
  drawBackdrop(ctx, s);
  drawHeader(ctx, s);
  drawPanels(ctx, s, opts);
  drawFooter(ctx, s);
  if (s.screen === 'intro') drawIntro(ctx, s);
  else if (s.screen === 'play' && s.paused) drawPause(ctx, s);
  else if (s.screen === 'complete') drawComplete(ctx, s);
  else if (s.screen === 'timeup') drawTimeUp(ctx, s);
  drawSoundButton(ctx, s);
}

// ---------------------------------------------------------------- shared pieces

function text(ctx, str, x, y, { size = 20, font = SANS, color = '#f4f0ff', align = 'left', weight = '', base = 'alphabetic', alpha = 1 } = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(str, x, y);
  ctx.restore();
}

function button(ctx, s, name, label, { primary = true, disabled = false } = {}) {
  const b = BUTTONS[name];
  const hover = s.hover === name && !disabled;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 14);
  if (disabled) {
    ctx.fillStyle = 'rgba(120, 124, 160, 0.25)';
    ctx.fill();
  } else if (primary) {
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, hover ? '#ffe39a' : '#ffd27a');
    g.addColorStop(1, hover ? '#f3a85a' : '#e8964a');
    ctx.fillStyle = g;
    ctx.shadowColor = 'rgba(255, 190, 90, 0.45)';
    ctx.shadowBlur = hover ? 26 : 14;
    ctx.fill();
  } else {
    ctx.fillStyle = hover ? 'rgba(255, 220, 150, 0.16)' : 'rgba(255, 255, 255, 0.06)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = hover ? GOLD : 'rgba(255, 220, 160, 0.5)';
    ctx.stroke();
  }
  ctx.restore();
  text(ctx, label, b.x + b.w / 2, b.y + b.h / 2 + 1, {
    size: 21,
    weight: '600',
    align: 'center',
    base: 'middle',
    color: disabled ? 'rgba(220, 220, 240, 0.4)' : primary ? '#2a160c' : '#fbeed2',
  });
}

function card(ctx, x, y, w, h) {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 22);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, 'rgba(34, 32, 78, 0.97)');
  g.addColorStop(1, 'rgba(16, 16, 44, 0.97)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255, 211, 110, 0.55)';
  ctx.stroke();
  ctx.restore();
}

function starShape(ctx, x, y, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = GOLD;
    ctx.fill();
  } else {
    ctx.strokeStyle = 'rgba(255, 211, 110, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function moonBadge(ctx, x, y, r) {
  // A crescent: the disc minus an offset disc, cut with the even-odd rule so nothing is erased.
  ctx.save();
  ctx.fillStyle = '#ffe9b5';
  ctx.shadowColor = 'rgba(255, 220, 150, 0.8)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.arc(x + r * 0.45, y - r * 0.25, r * 0.85, 0, TAU, true);
  ctx.fill('evenodd');
  ctx.restore();
}

function drawBackdrop(ctx, s) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#11143a');
  g.addColorStop(1, '#070915');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Time pressure you can feel: a red glow that throbs at the edges in the last 30 seconds.
  if (s.screen === 'play' && !s.paused && s.timeLeft < 30 && s.doneAt === null) {
    const beat = 0.5 + 0.5 * Math.sin(s.clock * TAU);
    const v = ctx.createRadialGradient(640, 400, 300, 640, 400, 820);
    v.addColorStop(0, 'rgba(255, 40, 60, 0)');
    v.addColorStop(1, `rgba(255, 40, 60, ${0.18 + 0.22 * beat * (s.timeLeft < 10 ? 1.4 : 1)})`);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

// ---------------------------------------------------------------- header and footer

function drawHeader(ctx, s) {
  moonBadge(ctx, 50, 52, 18);
  text(ctx, 'Moonlit Harbor', 80, 50, { size: 30, font: SERIF, color: '#fbefd6' });
  text(ctx, `Night ${s.level.number} of ${LEVELS.length}  ·  ${s.level.name}`, 81, 78, { size: 16, color: 'rgba(230, 220, 255, 0.75)' });

  // The countdown, centre stage.
  const urgent = s.timeLeft < 30 && s.screen === 'play';
  const beat = urgent && !s.paused ? Math.max(0, Math.sin(s.clock * TAU)) : 0;
  const scale = 1 + beat * 0.12;
  ctx.save();
  ctx.translate(640, 46);
  ctx.scale(scale, scale);
  if (urgent) {
    ctx.shadowColor = 'rgba(255, 60, 60, 0.9)';
    ctx.shadowBlur = 12 + beat * 20;
  }
  text(ctx, formatTime(s.timeLeft), 0, 0, { size: 48, weight: '700', align: 'center', base: 'middle', color: urgent ? '#ff5d5d' : '#fff6e0' });
  ctx.restore();
  const bw = 340;
  const frac = Math.max(0, s.timeLeft / s.level.time);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(640 - bw / 2, 82, bw, 8, 4);
  ctx.fill();
  const bar = ctx.createLinearGradient(640 - bw / 2, 0, 640 + bw / 2, 0);
  bar.addColorStop(0, urgent ? '#ff3b4e' : '#7fd6ff');
  bar.addColorStop(1, urgent ? '#ff8a5c' : '#ffd36e');
  ctx.fillStyle = bar;
  ctx.beginPath();
  ctx.roundRect(640 - bw / 2, 82, Math.max(8, bw * frac), 8, 4);
  ctx.fill();
  // A miss shows its cost beside the clock.
  const last = s.crosses[s.crosses.length - 1];
  if (last) {
    const k = (s.clock - last.at) / 0.9;
    text(ctx, `−5s`, 735, 46 - k * 18, { size: 26, weight: '700', color: '#ff6b6b', base: 'middle', alpha: 1 - k });
  }
  text(ctx, 'TIME', 640, 14, { size: 11, align: 'center', base: 'top', color: 'rgba(230, 220, 255, 0.5)', weight: '600' });

  // Level progress pips.
  for (let i = 0; i < LEVELS.length; i++) {
    const x = 1040 + i * 34;
    const done = s.results[i];
    ctx.beginPath();
    ctx.arc(x, 48, 10, 0, TAU);
    ctx.fillStyle = done ? GOLD : i === s.levelIndex ? 'rgba(255, 211, 110, 0.35)' : 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 211, 110, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, String(i + 1), x, 49, { size: 12, align: 'center', base: 'middle', weight: '700', color: done ? '#2a160c' : '#fbeed2' });
  }
}

function drawFooter(ctx, s) {
  if (s.screen === 'timeup' && s.clock - s.endedAt >= 1) return; // its card takes this space
  const n = s.level.diffs.length;
  text(ctx, counterText(s), 640, 628, { size: 34, weight: '700', align: 'center', base: 'middle', color: '#fff3d6' });
  const gap = 34;
  const x0 = 640 - ((n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * gap;
    const got = i < s.found.length;
    ctx.beginPath();
    ctx.arc(x, 674, 11, 0, TAU);
    if (got) {
      ctx.fillStyle = GOLD;
      ctx.fill();
      ctx.strokeStyle = '#2a160c';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(x - 5, 674);
      ctx.lineTo(x - 1, 678);
      ctx.lineTo(x + 5.5, 669);
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255, 211, 110, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
  const noHint = s.hintsLeft <= 0 || remaining(s) === 0 || s.screen !== 'play';
  button(ctx, s, 'hint', `Hint (H)`, { primary: false, disabled: noHint });
  const hb = BUTTONS.hint;
  for (let i = 0; i < HINTS_PER_LEVEL; i++) {
    ctx.beginPath();
    ctx.arc(hb.x + hb.w - 26 - i * 16, hb.y + hb.h / 2, 5, 0, TAU);
    ctx.fillStyle = i < s.hintsLeft ? '#7fe6ff' : 'rgba(255,255,255,0.15)';
    ctx.fill();
  }
  bulb(ctx, hb.x + 26, hb.y + hb.h / 2, noHint);
  button(ctx, s, 'pause', s.paused ? 'Resume (P)' : 'Pause (P)', { primary: false });
  text(ctx, 'Click a difference on either picture  ·  a wrong click costs 5 seconds  ·  H hint  ·  P pause  ·  M sound', 640, 750, {
    size: 15,
    align: 'center',
    color: 'rgba(225, 220, 255, 0.55)',
  });
}

function bulb(ctx, x, y, dim) {
  ctx.save();
  ctx.globalAlpha = dim ? 0.35 : 1;
  ctx.fillStyle = '#7fe6ff';
  ctx.beginPath();
  ctx.arc(x, y - 4, 8, 0, TAU);
  ctx.fill();
  ctx.fillRect(x - 4, y + 3, 8, 6);
  ctx.fillStyle = INK;
  ctx.fillRect(x - 4, y + 6, 8, 1.4);
  ctx.restore();
}

function drawSoundButton(ctx, s) {
  const b = BUTTONS.sound;
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  ctx.save();
  ctx.globalAlpha = s.hover === 'sound' ? 1 : 0.7;
  ctx.fillStyle = '#fbeed2';
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy - 5);
  ctx.lineTo(cx - 8, cy - 5);
  ctx.lineTo(cx - 1, cy - 12);
  ctx.lineTo(cx - 1, cy + 12);
  ctx.lineTo(cx - 8, cy + 5);
  ctx.lineTo(cx - 14, cy + 5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fbeed2';
  ctx.lineWidth = 2;
  if (isMuted()) {
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 6);
    ctx.lineTo(cx + 14, cy + 6);
    ctx.moveTo(cx + 14, cy - 6);
    ctx.lineTo(cx + 4, cy + 6);
    ctx.stroke();
  } else {
    for (const r of [6, 11]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, -0.7, 0.7);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the panels and their marks

function drawPanels(ctx, s, opts) {
  const pics = [s.pictures.left, s.pictures.right];
  const hidden = s.screen === 'play' && s.paused;
  for (let i = 0; i < 2; i++) {
    const p = PANELS[i];
    const age = s.clock - s.shakes[i];
    const dx = age < 0.4 ? Math.sin(age * 70) * 9 * (1 - age / 0.4) : 0;
    ctx.save();
    ctx.translate(p.x + dx, p.y);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.roundRect(0, 0, p.w, p.h, 16);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(0, 0, p.w, p.h, 16);
    ctx.clip();
    if (!hidden) {
      drawScene(ctx, pics[i], s.level.palette, s.clock);
      drawMarks(ctx, s, i, opts);
    }
    // Soft inner vignette ties both pictures into one framed style.
    const v = ctx.createRadialGradient(p.w / 2, p.h / 2, p.h * 0.45, p.w / 2, p.h / 2, p.w * 0.72);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(5,5,20,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, p.w, p.h);
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = s.hover === 'panel' && s.screen === 'play' ? 'rgba(255, 211, 110, 0.9)' : 'rgba(255, 211, 110, 0.5)';
    ctx.beginPath();
    ctx.roundRect(0, 0, p.w, p.h, 16);
    ctx.stroke();
    ctx.restore();
  }
}

function easeOutBack(k) {
  const c = 2.2;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
}

function drawMarks(ctx, s, panel, opts) {
  const t = s.clock;
  const diffs = s.level.diffs;

  if (opts.debug) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 1.5;
    for (const d of diffs) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Hint: a cyan pulse around the area of one unfound difference.
  if (s.hint && s.screen === 'play') {
    const d = diffs.find((x) => x.id === s.hint.id);
    const age = t - s.hint.at;
    const fade = Math.min(1, age / 0.25, (HINT_SECONDS - age) / 0.6);
    const cx = d.x + s.hint.ox;
    const cy = d.y + s.hint.oy;
    const R = d.r * 2.1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);
    const g = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R);
    g.addColorStop(0, 'rgba(127, 230, 255, 0.0)');
    g.addColorStop(1, `rgba(127, 230, 255, ${0.16 + 0.1 * Math.sin(age * 8)})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, TAU);
    ctx.fill();
    for (let k = 0; k < 2; k++) {
      const f = (age * 1.2 + k * 0.5) % 1;
      ctx.strokeStyle = `rgba(150, 236, 255, ${1 - f})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, R * (1.25 - f * 0.6), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Found: a ring that springs open with a flash and sparks, then stays.
  for (const f of s.found) {
    const d = diffs.find((x) => x.id === f.id);
    const age = t - f.at;
    const k = Math.min(1, age / 0.55);
    const r = d.r * (0.35 + 0.65 * easeOutBack(k)) + 2;
    if (age < 0.3) {
      ctx.fillStyle = `rgba(255, 245, 210, ${0.5 * (1 - age / 0.3)})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, TAU);
      ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(255, 200, 90, 0.95)';
    ctx.shadowBlur = 10 + (age < 0.6 ? 14 * (1 - age / 0.6) : 2 * Math.sin(t * 3 + d.x));
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(d.x, d.y, r - 2.6, 0, TAU);
    ctx.stroke();
    if (age < 0.9) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + d.x;
        const dist = r + age * 70;
        const size = 3.2 * (1 - age / 0.9);
        ctx.fillStyle = i % 2 ? '#fff4c4' : GOLD;
        ctx.beginPath();
        ctx.arc(d.x + Math.cos(a) * dist, d.y + Math.sin(a) * dist, size, 0, TAU);
        ctx.fill();
      }
    }
    // A small tick badge on the ring.
    const bx = d.x + r * 0.72;
    const by = d.y - r * 0.72;
    const pop = Math.min(1, Math.max(0, (age - 0.25) / 0.2));
    if (pop > 0) {
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(bx, by, 7 * pop, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#2a160c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - 3.2 * pop, by);
      ctx.lineTo(bx - 0.6 * pop, by + 2.6 * pop);
      ctx.lineTo(bx + 3.6 * pop, by - 3 * pop);
      ctx.stroke();
    }
  }

  // Time up: the differences still hidden are revealed in red.
  if (s.screen === 'timeup') {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5);
    ctx.setLineDash([6, 5]);
    ctx.strokeStyle = `rgba(255, 95, 95, ${pulse})`;
    ctx.lineWidth = 3;
    for (const d of diffs) {
      if (isFound(s, d.id)) continue;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + 2, 0, TAU);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  // Misses: a red cross that pops and fades, on the panel that was clicked.
  for (const c of s.crosses) {
    if (c.panel !== panel) continue;
    const age = t - c.at;
    const k = Math.min(1, age / 0.12);
    const size = 11 * (0.6 + 0.4 * k);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, age - 0.45) / 0.45);
    ctx.strokeStyle = '#ff4d5a';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(c.x - size, c.y - size);
    ctx.lineTo(c.x + size, c.y + size);
    ctx.moveTo(c.x + size, c.y - size);
    ctx.lineTo(c.x - size, c.y + size);
    ctx.stroke();
    ctx.restore();
  }

  // Floating notes: what was found (right panel) and what a miss cost (where it was clicked).
  for (const f of s.floaters) {
    if (f.panel !== panel) continue;
    const age = t - f.at;
    const alpha = Math.min(1, (1.6 - age) / 0.5);
    ctx.save();
    ctx.font = `600 15px ${SANS}`;
    const w = ctx.measureText(f.text).width + 18;
    const x = Math.min(600 - w / 2 - 6, Math.max(w / 2 + 6, f.x));
    const y = Math.max(18, f.y - age * 16);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.fillStyle = 'rgba(10, 10, 30, 0.75)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 13, w, 24, 12);
    ctx.fill();
    ctx.fillStyle = f.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.text, x, y);
    ctx.restore();
  }
}

// ---------------------------------------------------------------- overlays

function dim(ctx, alpha) {
  ctx.fillStyle = `rgba(6, 7, 22, ${alpha})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawIntro(ctx, s) {
  dim(ctx, 0.8);
  const L = s.level;
  card(ctx, 330, 170, 620, 350);
  text(ctx, `NIGHT ${L.number} OF ${LEVELS.length}`, 640, 222, { size: 15, weight: '700', align: 'center', color: '#7fe6ff' });
  text(ctx, L.name, 640, 282, { size: 52, font: SERIF, align: 'center', color: '#fff0cf' });
  text(ctx, L.blurb, 640, 326, { size: 19, align: 'center', color: 'rgba(235, 228, 255, 0.85)' });
  const facts = [['10', 'differences'], [formatTime(L.time), 'on the clock'], [L.difficulty, 'difficulty']];
  facts.forEach(([big, small], i) => {
    const x = 450 + i * 190;
    text(ctx, big, x, 392, { size: 30, weight: '700', align: 'center', color: GOLD });
    text(ctx, small, x, 418, { size: 15, align: 'center', color: 'rgba(235, 228, 255, 0.7)' });
  });
  const blink = 0.55 + 0.45 * Math.sin(s.clock * 3);
  text(ctx, 'Click or press Enter to begin', 640, 482, { size: 20, weight: '600', align: 'center', color: '#fbeed2', alpha: blink });
}

function drawPause(ctx, s) {
  ctx.fillStyle = 'rgba(6, 7, 22, 0.9)';
  ctx.fillRect(0, 100, VIEW_W, 480);
  moonBadge(ctx, 640, 270, 34);
  text(ctx, 'Paused', 640, 372, { size: 56, font: SERIF, align: 'center', color: '#fff0cf' });
  text(ctx, 'The tide waits for you. The pictures are hidden while paused.', 640, 410, { size: 18, align: 'center', color: 'rgba(235, 228, 255, 0.75)' });
  button(ctx, s, 'resume', 'Resume (P)');
}

function drawComplete(ctx, s) {
  dim(ctx, 0.62);
  const r = s.results[s.levelIndex];
  card(ctx, 300, 118, 680, 560);
  text(ctx, `NIGHT ${r.number} CLEARED`, 640, 168, { size: 15, weight: '700', align: 'center', color: '#7fe6ff' });
  text(ctx, r.name, 640, 222, { size: 46, font: SERIF, align: 'center', color: '#fff0cf' });
  for (let i = 0; i < 3; i++) starShape(ctx, 580 + i * 60, 278, 22, i < r.stars);
  const rows = [
    ['Time left', formatTime(r.timeLeft)],
    ['Time taken', formatTime(r.timeUsed)],
    ['Accuracy', `${Math.round(r.accuracy * 100)}%  (${r.hits} of ${r.hits + r.misses} clicks)`],
    ['Hints used', `${r.hintsUsed} of ${HINTS_PER_LEVEL}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 344 + i * 42;
    text(ctx, k, 400, y, { size: 21, color: 'rgba(235, 228, 255, 0.75)' });
    text(ctx, v, 880, y, { size: 21, weight: '700', align: 'right', color: '#fff6e0' });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(400, y + 14, 480, 1);
  });
  text(ctx, 'Score', 400, 532, { size: 24, color: GOLD, weight: '600' });
  text(ctx, String(r.score), 880, 532, { size: 34, weight: '700', align: 'right', color: GOLD });
  const last = s.levelIndex === LEVELS.length - 1;
  button(ctx, s, 'next', last ? 'Greet the dawn' : 'Next harbor');
}

function drawTimeUp(ctx, s) {
  if (s.clock - s.endedAt < 1) return;
  card(ctx, 380, 586, 520, 190);
  text(ctx, 'The tide turned', 640, 628, { size: 30, font: SERIF, align: 'center', color: '#ffb0a8' });
  text(ctx, `You found ${s.found.length} of ${s.level.diffs.length}. The red circles show what was left.`, 640, 662, { size: 16, align: 'center', color: 'rgba(235,228,255,0.8)' });
  button(ctx, s, 'retry', 'Try again');
  button(ctx, s, 'menu', 'Title screen', { primary: false });
}

// ---------------------------------------------------------------- title and win

function backdrop(ctx, s, alpha) {
  if (!titleBackdrop) titleBackdrop = { level: LEVELS[1], items: levelPictures(LEVELS[1]).left };
  const k = VIEW_W / 600;
  ctx.save();
  ctx.translate(0, -150);
  ctx.scale(k, k);
  drawScene(ctx, titleBackdrop.items, titleBackdrop.level.palette, s.clock);
  ctx.restore();
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, `rgba(5, 6, 24, ${alpha * 0.55})`);
  g.addColorStop(0.5, `rgba(5, 6, 24, ${alpha * 0.35})`);
  g.addColorStop(1, `rgba(5, 6, 24, ${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, s) {
  backdrop(ctx, s, 0.9);
  ctx.save();
  ctx.shadowColor = 'rgba(255, 210, 130, 0.65)';
  ctx.shadowBlur = 30;
  text(ctx, 'Moonlit Harbor', 640, 250, { size: 104, font: SERIF, align: 'center', color: '#fff1d2' });
  ctx.restore();
  text(ctx, 'SPOT  THE  DIFFERENCE', 640, 310, { size: 26, weight: '600', align: 'center', color: '#7fe6ff' });
  text(ctx, 'One harbor, one long night, three pictures that do not quite match.', 640, 362, { size: 21, align: 'center', color: 'rgba(240, 234, 255, 0.9)' });
  text(ctx, 'Find all ten differences in each before the tide clock runs out.', 640, 392, { size: 21, align: 'center', color: 'rgba(240, 234, 255, 0.9)' });
  LEVELS.forEach((L, i) => {
    const x = 330 + i * 310;
    ctx.fillStyle = 'rgba(16, 16, 46, 0.78)';
    ctx.beginPath();
    ctx.roundRect(x - 135, 430, 270, 84, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 211, 110, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, `Night ${L.number}`, x, 458, { size: 14, weight: '700', align: 'center', color: '#7fe6ff' });
    text(ctx, L.name, x, 485, { size: 22, font: SERIF, align: 'center', color: '#fff0cf' });
    text(ctx, `${L.difficulty}  ·  ${formatTime(L.time)}`, x, 506, { size: 14, align: 'center', color: 'rgba(235,228,255,0.7)' });
  });
  button(ctx, s, 'start', 'Start the night');
  text(ctx, 'Click a difference on either picture  ·  wrong clicks cost 5 s  ·  3 hints a night  ·  P pauses', 640, 652, { size: 17, align: 'center', color: 'rgba(235,228,255,0.75)' });
  text(ctx, 'Press Enter or click Start', 640, 684, { size: 15, align: 'center', color: 'rgba(235,228,255,0.5)' });
  drawSoundButton(ctx, s);
}

function drawWin(ctx, s) {
  backdrop(ctx, s, 0.8);
  // The dawn: a warm band rising behind the harbor.
  const g = ctx.createLinearGradient(0, 300, 0, 800);
  g.addColorStop(0, 'rgba(255, 170, 110, 0)');
  g.addColorStop(1, 'rgba(255, 150, 100, 0.25)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save();
  ctx.shadowColor = 'rgba(255, 210, 130, 0.7)';
  ctx.shadowBlur = 26;
  text(ctx, 'The harbor sleeps', 640, 150, { size: 74, font: SERIF, align: 'center', color: '#fff1d2' });
  ctx.restore();
  text(ctx, 'Every difference found, all night long. Dawn breaks over the water.', 640, 198, { size: 20, align: 'center', color: 'rgba(240,234,255,0.9)' });
  card(ctx, 240, 236, 800, 380);
  const cols = [300, 620, 735, 850, 980];
  ['Night', 'Stars', 'Time left', 'Accuracy', 'Score'].forEach((h, i) => text(ctx, h, cols[i], 286, { size: 15, weight: '700', color: '#7fe6ff', align: i === 0 ? 'left' : i === 4 ? 'right' : 'center' }));
  LEVELS.forEach((L, i) => {
    const r = s.results[i];
    const y = 340 + i * 62;
    text(ctx, `${L.number}. ${L.name}`, cols[0], y, { size: 22, font: SERIF, color: '#fff0cf' });
    for (let k = 0; k < 3; k++) starShape(ctx, cols[1] - 28 + k * 28, y - 7, 11, r && k < r.stars);
    text(ctx, r ? formatTime(r.timeLeft) : '–', cols[2], y, { size: 20, align: 'center' });
    text(ctx, r ? `${Math.round(r.accuracy * 100)}%` : '–', cols[3], y, { size: 20, align: 'center' });
    text(ctx, r ? String(r.score) : '–', cols[4], y, { size: 22, weight: '700', align: 'right', color: '#fff6e0' });
  });
  ctx.fillStyle = 'rgba(255, 211, 110, 0.4)';
  ctx.fillRect(300, 540, 680, 1.5);
  text(ctx, 'Total score', cols[0], 584, { size: 26, weight: '600', color: GOLD });
  text(ctx, String(totalScore(s)), cols[4], 586, { size: 38, weight: '700', align: 'right', color: GOLD });
  button(ctx, s, 'again', 'Play again');
  drawSoundButton(ctx, s);
}
