// Canvas rendering of a harbor picture: one painter per item kind, all drawn with paths and
// gradients (no images). drawScene() paints a whole picture in panel coordinates (600 x 460);
// the caller translates and clips the context to the panel. Motion (twinkle, bobbing, the
// lighthouse beam, drifting fog) depends only on the clock, so both panels always move together.

import { HORIZON, SCENE_H, SCENE_W } from './scenes.js';

const TAU = Math.PI * 2;

export function drawScene(ctx, items, palette, t) {
  for (const it of items) {
    const paint = PAINTERS[it.kind];
    if (paint) paint(ctx, it, palette, t);
  }
}

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function glow(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function bob(it, t) {
  return Math.sin(t * 1.25 + (it.ph ?? 0)) * 1.2;
}

const PAINTERS = {
  sky(ctx, it, p) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, p.sky[0]);
    g.addColorStop(0.6, p.sky[1]);
    g.addColorStop(1, p.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SCENE_W, HORIZON + 2);
  },

  star(ctx, it, p, t) {
    const a = 0.7 + 0.3 * Math.sin(t * 1.6 + it.ph);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.star;
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.s, 0, TAU);
    ctx.fill();
    if (it.s > 1.4) {
      const l = it.s * 3.2;
      ctx.strokeStyle = p.star;
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = a * 0.7;
      ctx.beginPath();
      ctx.moveTo(it.x - l, it.y);
      ctx.lineTo(it.x + l, it.y);
      ctx.moveTo(it.x, it.y - l);
      ctx.lineTo(it.x, it.y + l);
      ctx.stroke();
    }
    ctx.restore();
  },

  moon(ctx, it, p) {
    glow(ctx, it.x, it.y, it.r * 3.4, p.moonGlow, 1);
    ctx.fillStyle = p.moon;
    ctx.beginPath();
    ctx.arc(it.x, it.y, it.r, 0, TAU);
    ctx.fill();
    if (it.craters) {
      const k = it.r / 27;
      ctx.fillStyle = 'rgba(120, 100, 90, 0.16)';
      for (const [dx, dy, r] of [[-8, -6, 5], [7, 4, 4], [2, -12, 2.6], [-4, 10, 3.2], [12, -5, 2]]) {
        ctx.beginPath();
        ctx.arc(it.x + dx * k, it.y + dy * k, r * k, 0, TAU);
        ctx.fill();
      }
    }
  },

  cloud(ctx, it, p) {
    const w = it.w;
    ctx.fillStyle = p.cloud;
    for (const [dx, dy, rx, ry] of [[-0.3, 2, 0.24, 8], [0, -3, 0.3, 11], [0.3, 1, 0.24, 8], [0.04, 5, 0.46, 7]]) {
      ctx.beginPath();
      ctx.ellipse(it.x + dx * w, it.y + dy, rx * w, ry, 0, 0, TAU);
      ctx.fill();
    }
  },

  bird(ctx, it, p) {
    const s = 7 * it.s;
    ctx.strokeStyle = '#11121f';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(it.x - s, it.y - s * 0.35);
    ctx.quadraticCurveTo(it.x - s * 0.45, it.y - s * 0.7, it.x, it.y);
    ctx.quadraticCurveTo(it.x + s * 0.45, it.y - s * 0.7, it.x + s, it.y - s * 0.35);
    ctx.stroke();
  },

  poly(ctx, it) {
    ctx.fillStyle = it.color;
    poly(ctx, it.pts);
    ctx.fill();
  },

  sea(ctx, it, p, t) {
    const g = ctx.createLinearGradient(0, HORIZON, 0, SCENE_H);
    g.addColorStop(0, p.sea[0]);
    g.addColorStop(0.4, p.sea[1]);
    g.addColorStop(1, p.sea[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, HORIZON, SCENE_W, SCENE_H - HORIZON);
    ctx.strokeStyle = p.shimmer;
    ctx.lineWidth = 1;
    for (const l of it.lines) {
      ctx.globalAlpha = 0.1 + 0.1 * (1 + Math.sin(t * 1.4 + l.ph));
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x + l.w, l.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  },

  reflection(ctx, it, p, t) {
    const n = Math.floor((it.y1 - it.y0) / 6);
    ctx.fillStyle = p.moon;
    for (let i = 0; i < n; i++) {
      const f = i / n;
      const w = it.r * (1.3 - f * 0.85) * (0.8 + 0.2 * Math.sin(t * 2 + i * 1.7));
      ctx.globalAlpha = 0.42 * (1 - f) + 0.06;
      ctx.fillRect(it.x - w + Math.sin(t + i) * 2, it.y0 + i * 6, w * 2, 2);
    }
    ctx.globalAlpha = 1;
  },

  rocks(ctx, it, p) {
    ctx.fillStyle = p.rock;
    poly(ctx, it.pts);
    ctx.fill();
    ctx.strokeStyle = p.rockLine;
    ctx.lineWidth = 2;
    for (const [x0, y0, x1, y1] of [[10, 250, 60, 244], [30, 280, 110, 272], [70, 300, 150, 292], [120, 256, 160, 262], [8, 306, 54, 300]]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // Foam where the rocks meet the sea.
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, 333);
    ctx.quadraticCurveTo(90, 328, 156, 320);
    ctx.quadraticCurveTo(178, 312, 186, 300);
    ctx.stroke();
  },

  lighthouse(ctx, it, p) {
    const { x, base, h } = it;
    const top = base - h;
    const half = (y) => 15 - ((base - y) / h) * 5;
    const bands = 4;
    for (let i = 0; i < bands; i++) {
      const y0 = base - (h * i) / bands;
      const y1 = base - (h * (i + 1)) / bands;
      ctx.fillStyle = i % 2 === 0 ? it.stripe : '#ece6d8';
      poly(ctx, [[x - half(y0), y0], [x + half(y0), y0], [x + half(y1), y1], [x - half(y1), y1]]);
      ctx.fill();
    }
    // Shade the tower's right side.
    ctx.fillStyle = 'rgba(10, 8, 30, 0.28)';
    poly(ctx, [[x + 3, base], [x + 15, base], [x + 10, top], [x + 2, top]]);
    ctx.fill();
    if (it.window) {
      ctx.fillStyle = '#ffdf96';
      ctx.fillRect(x - 2.5, base - 68, 5, 8);
      ctx.fillStyle = '#2a1e28';
      ctx.fillRect(x - 3.5, base - 60, 7, 1.5);
    }
    // Gallery, lantern room and dome.
    ctx.fillStyle = '#2a2433';
    ctx.fillRect(x - 15, top - 6, 30, 6);
    ctx.strokeStyle = '#2a2433';
    ctx.lineWidth = 1;
    for (let i = -13; i <= 13; i += 4.3) {
      ctx.beginPath();
      ctx.moveTo(x + i, top - 6);
      ctx.lineTo(x + i, top - 11);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - 14, top - 11);
    ctx.lineTo(x + 14, top - 11);
    ctx.stroke();
    glow(ctx, x, top - 15, 46, it.light, 0.55);
    ctx.fillStyle = it.light;
    ctx.fillRect(x - 8, top - 24, 16, 18);
    ctx.strokeStyle = '#2a2433';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - 8, top - 24, 16, 18);
    ctx.beginPath();
    ctx.moveTo(x, top - 24);
    ctx.lineTo(x, top - 6);
    ctx.stroke();
    ctx.fillStyle = '#3a2f3e';
    ctx.beginPath();
    ctx.moveTo(x - 10, top - 24);
    ctx.quadraticCurveTo(x, top - 38, x + 10, top - 24);
    ctx.fill();
    ctx.fillRect(x - 0.8, top - 42, 1.6, 8);
  },

  beam(ctx, it, p, t) {
    // A horizontal beam whose length follows the lamp's turn, read as a rotation.
    const c = Math.cos(t * 0.7);
    const len = 280 * Math.abs(c);
    if (len < 8) return;
    const dir = Math.sign(c);
    const g = ctx.createLinearGradient(it.x, 0, it.x + dir * len, 0);
    g.addColorStop(0, 'rgba(255, 244, 196, 0.34)');
    g.addColorStop(1, 'rgba(255, 244, 196, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(it.x, it.y - 3);
    ctx.lineTo(it.x + dir * len, it.y - 3 - len * 0.12);
    ctx.lineTo(it.x + dir * len, it.y + 3 + len * 0.12);
    ctx.lineTo(it.x, it.y + 3);
    ctx.closePath();
    ctx.fill();
  },

  cottage(ctx, it, p) {
    const top = it.base - it.h;
    ctx.fillStyle = p.walls[1];
    ctx.fillRect(it.x, top, it.w, it.h);
    ctx.fillStyle = p.roofs[0];
    poly(ctx, [[it.x - 3, top], [it.x + it.w / 2, top - 12], [it.x + it.w + 3, top]]);
    ctx.fill();
    glow(ctx, it.x + 12, top + 9, 14, p.lit, 0.4);
    ctx.fillStyle = p.lit;
    ctx.fillRect(it.x + 8, top + 5, 8, 8);
    ctx.fillStyle = p.dark;
    ctx.fillRect(it.x + 26, top + 8, 7, 12);
  },

  quay(ctx, it, p) {
    ctx.fillStyle = p.land;
    ctx.fillRect(it.x, it.y, it.w, 6);
    ctx.fillStyle = p.quay;
    ctx.fillRect(it.x, it.y + 6, it.w, it.h - 6);
    ctx.strokeStyle = p.stone;
    ctx.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
      const y = it.y + 6 + row * 9;
      ctx.beginPath();
      ctx.moveTo(it.x, y);
      ctx.lineTo(it.x + it.w, y);
      ctx.stroke();
      for (let x = it.x + (row % 2) * 9; x < it.x + it.w; x += 18) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 9);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(it.x, it.y + it.h, it.w, 5);
  },

  house(ctx, it, p) {
    const top = it.base - it.h;
    const cx = it.x + it.w / 2;
    const span = it.w / 2 + 4;
    if (it.chimney) {
      const chx = it.x + it.w * it.chimX;
      const roofY = top - it.peak * (1 - Math.abs(chx - cx) / span);
      ctx.fillStyle = '#3a2a2e';
      ctx.fillRect(chx - 4, roofY - 12, 8, 16);
      ctx.fillStyle = '#2a1e22';
      ctx.fillRect(chx - 5, roofY - 14, 10, 3);
    }
    if (it.antenna) {
      ctx.strokeStyle = '#1c1a26';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, top - it.peak);
      ctx.lineTo(cx, top - it.peak - 17);
      ctx.moveTo(cx - 7, top - it.peak - 14);
      ctx.lineTo(cx + 7, top - it.peak - 14);
      ctx.moveTo(cx - 5, top - it.peak - 9);
      ctx.lineTo(cx + 5, top - it.peak - 9);
      ctx.stroke();
    }
    ctx.fillStyle = it.wall;
    ctx.fillRect(it.x, top, it.w, it.h);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(it.x + it.w - 6, top, 6, it.h);
    ctx.fillStyle = it.roof;
    poly(ctx, [[it.x - 4, top + 1], [cx, top - it.peak], [it.x + it.w + 4, top + 1]]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    poly(ctx, [[it.x - 4, top + 1], [cx, top - it.peak], [cx, top + 1]]);
    ctx.fill();
    const dx = it.x + it.w * it.doorX - 6;
    ctx.fillStyle = it.door;
    ctx.fillRect(dx, it.base - 20, 12, 20);
    ctx.fillStyle = '#f2d27a';
    ctx.fillRect(dx + 9, it.base - 10, 1.6, 1.6);
  },

  window(ctx, it, p) {
    if (it.lit) glow(ctx, it.x + it.w / 2, it.y + it.h / 2, it.w * 1.6, it.color, 0.45);
    ctx.fillStyle = it.lit ? it.color : p.dark;
    ctx.fillRect(it.x, it.y, it.w, it.h);
    ctx.strokeStyle = 'rgba(20, 14, 26, 0.85)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(it.x, it.y, it.w, it.h);
    ctx.beginPath();
    ctx.moveTo(it.x + it.w / 2, it.y);
    ctx.lineTo(it.x + it.w / 2, it.y + it.h);
    ctx.moveTo(it.x, it.y + it.h / 2);
    ctx.lineTo(it.x + it.w, it.y + it.h / 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(it.x - 1.5, it.y + it.h, it.w + 3, 2);
  },

  buoy(ctx, it, p, t) {
    const y = it.y + bob(it, t);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(it.x, it.y + 2, 10, 2.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.moveTo(it.x - 8, y);
    ctx.lineTo(it.x - 4, y - 18);
    ctx.lineTo(it.x + 4, y - 18);
    ctx.lineTo(it.x + 8, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = it.stripe;
    ctx.fillRect(it.x - 6.4, y - 11, 12.8, 4);
    ctx.fillStyle = '#2a2433';
    ctx.fillRect(it.x - 1, y - 23, 2, 5);
    glow(ctx, it.x, y - 24, 10, '#fff2b0', 0.8);
  },

  sailboat(ctx, it, p, t) {
    const x = it.x;
    const y = it.y + bob(it, t);
    // Reflection.
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x + 2, it.y + 4, 46, 5, 0, 0, TAU);
    ctx.fill();
    // Sails.
    ctx.fillStyle = p.sail;
    poly(ctx, [[x - 1, y - 114], [x - 1, y - 20], [x + 40, y - 20]]);
    ctx.fill();
    ctx.globalAlpha = 0.88;
    poly(ctx, [[x - 8, y - 106], [x - 8, y - 20], [x - 42, y - 20]]);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (it.sailStripe) {
      const at = (yy) => 41 * ((yy - (y - 114)) / 94);
      ctx.fillStyle = it.hull;
      poly(ctx, [[x - 1, y - 54], [x - 1 + at(y - 54), y - 54], [x - 1 + at(y - 46), y - 46], [x - 1, y - 46]]);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    poly(ctx, [[x + 14, y - 80], [x - 1, y - 20], [x + 40, y - 20]]);
    ctx.fill();
    // Mast and flag.
    ctx.fillStyle = '#3a2a28';
    ctx.fillRect(x - 5, y - 122, 3, 108);
    const flutter = Math.sin(t * 5) * 1.5;
    ctx.fillStyle = it.flag;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 122);
    ctx.quadraticCurveTo(x + 6, y - 121 + flutter, x + 15, y - 118 + flutter);
    ctx.lineTo(x - 3, y - 113);
    ctx.closePath();
    ctx.fill();
    // Hull.
    ctx.fillStyle = it.hull;
    poly(ctx, [[x - 46, y - 15], [x + 50, y - 15], [x + 36, y], [x - 34, y]]);
    ctx.fill();
    ctx.fillStyle = '#f1e9d8';
    ctx.fillRect(x - 42, y - 11, 88, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    poly(ctx, [[x - 40, y - 6], [x + 41, y - 6], [x + 36, y], [x - 34, y]]);
    ctx.fill();
  },

  rowboat(ctx, it, p, t) {
    const x = it.x;
    const y = it.y + bob(it, t);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, it.y + 3, 32, 4, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#c9a878';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const oar = (s) => {
      ctx.beginPath();
      ctx.moveTo(x + s * 6, y - 9);
      ctx.lineTo(x + s * 38, y + 5);
      ctx.stroke();
      ctx.fillStyle = '#c9a878';
      ctx.beginPath();
      ctx.ellipse(x + s * 40, y + 6, 5, 2.2, s * 0.42, 0, TAU);
      ctx.fill();
    };
    oar(-1);
    if (it.oars > 1) oar(1);
    ctx.fillStyle = it.hull;
    poly(ctx, [[x - 30, y - 11], [x + 30, y - 11], [x + 22, y], [x - 22, y]]);
    ctx.fill();
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(x - 28, y - 11, 56, 2);
    ctx.fillStyle = p.wood;
    ctx.fillRect(x - 6, y - 14, 12, 3);
  },

  trawler(ctx, it, p, t) {
    const x = it.x;
    const y = it.y + bob(it, t);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, it.y + 4, 54, 5, 0, 0, TAU);
    ctx.fill();
    // Mast with its light.
    ctx.fillStyle = '#2a2433';
    ctx.fillRect(x + 29, y - 66, 2.5, 46);
    ctx.fillRect(x + 22, y - 56, 16, 1.6);
    glow(ctx, x + 30, y - 68, 12, '#9fffb8', 0.8);
    ctx.fillStyle = '#c8ffd4';
    ctx.beginPath();
    ctx.arc(x + 30, y - 68, 2.2, 0, TAU);
    ctx.fill();
    // Cabin.
    ctx.fillStyle = '#e4dccb';
    ctx.fillRect(x - 18, y - 46, 40, 26);
    ctx.fillStyle = '#9a3a38';
    ctx.fillRect(x - 21, y - 49, 46, 4);
    for (const wx of [x - 12, x + 2]) {
      glow(ctx, wx + 5, y - 35, 12, p.lit, 0.45);
      ctx.fillStyle = p.lit;
      ctx.fillRect(wx, y - 40, 10, 9);
    }
    ctx.fillStyle = '#ff7a3d';
    ctx.beginPath();
    ctx.arc(x + 17, y - 31, 4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e4dccb';
    ctx.beginPath();
    ctx.arc(x + 17, y - 31, 1.8, 0, TAU);
    ctx.fill();
    // Hull and portholes.
    ctx.fillStyle = it.hull;
    poly(ctx, [[x - 54, y - 22], [x + 56, y - 24], [x + 46, y], [x - 46, y]]);
    ctx.fill();
    ctx.fillStyle = '#f1e9d8';
    ctx.fillRect(x - 52, y - 18, 105, 2);
    const holes = [-30, -12, 6, 24].slice(0, it.portholes);
    for (const hx of holes) {
      ctx.fillStyle = '#1a1626';
      ctx.beginPath();
      ctx.arc(x + hx, y - 10, 3.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = p.lit;
      ctx.beginPath();
      ctx.arc(x + hx, y - 10, 2.2, 0, TAU);
      ctx.fill();
    }
  },

  fish(ctx, it, p, t) {
    const hop = Math.sin(t * 2) * 1.5;
    ctx.save();
    ctx.translate(it.x, it.y - 12 + hop);
    ctx.rotate(-0.7 * it.dir);
    ctx.fillStyle = it.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 4.5, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(-16, -5);
    ctx.lineTo(-16, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#10121e';
    ctx.beginPath();
    ctx.arc(6, -1, 1.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(230, 240, 255, 0.7)';
    for (const [dx, dy, r] of [[-10, 0, 1.6], [-5, -3, 1.2], [8, -1, 1.4], [12, 1, 1]]) {
      ctx.beginPath();
      ctx.arc(it.x + dx, it.y + dy, r, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(230, 240, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(it.x, it.y + 2, 13, 2.5, 0, 0, TAU);
    ctx.stroke();
  },

  pier(ctx, it, p) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(it.x0, it.y + 9, it.x1 - it.x0, 8);
    ctx.fillStyle = p.woodDark;
    for (let x = it.x0 + 10; x < it.x1; x += 38) ctx.fillRect(x, it.y + 6, 7, SCENE_H - it.y);
    ctx.fillStyle = p.wood;
    ctx.fillRect(it.x0, it.y, it.x1 - it.x0, 9);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    for (let x = it.x0 + 14; x < it.x1; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, it.y);
      ctx.lineTo(x, it.y + 9);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(it.x0, it.y, it.x1 - it.x0, 1.5);
  },

  rope(ctx, it) {
    ctx.strokeStyle = '#d6c39a';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(it.x0, it.y0);
    ctx.quadraticCurveTo((it.x0 + it.x1) / 2 + 6, (it.y0 + it.y1) / 2 + 6, it.x1, it.y1);
    ctx.stroke();
  },

  post(ctx, it, p) {
    ctx.fillStyle = p.woodDark;
    ctx.fillRect(it.x - 3.5, it.top, 7, it.y - it.top + 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(it.x - 3.5, it.top, 2, it.y - it.top);
  },

  bunting(ctx, it, p, t) {
    const at = (f) => [it.x0 + (it.x1 - it.x0) * f, it.y0 + (it.y1 - it.y0) * f + it.sag * 4 * f * (1 - f)];
    ctx.strokeStyle = '#1e1a26';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const [x, y] = at(i / 24);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    const n = it.colors.length;
    for (let i = 0; i < n; i++) {
      const [x, y] = at((i + 0.5) / n);
      const sway = Math.sin(t * 2.2 + i) * 0.8;
      ctx.fillStyle = it.colors[i];
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x + 5, y);
      ctx.lineTo(x + sway, y + 11);
      ctx.closePath();
      ctx.fill();
    }
  },

  gull(ctx, it) {
    const d = it.flip ? -1 : 1;
    const { x, y } = it;
    ctx.fillStyle = '#d9dbe4';
    ctx.beginPath();
    ctx.ellipse(x, y - 6, 8, 4.6, -0.12 * d, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#8a90a6';
    ctx.beginPath();
    ctx.moveTo(x - 7 * d, y - 8);
    ctx.lineTo(x + 3 * d, y - 9);
    ctx.lineTo(x - 11 * d, y - 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e6e8ef';
    ctx.beginPath();
    ctx.arc(x + 6 * d, y - 11.5, 3.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#f0b43a';
    ctx.beginPath();
    ctx.moveTo(x + 9 * d, y - 12);
    ctx.lineTo(x + 14 * d, y - 11);
    ctx.lineTo(x + 9 * d, y - 10);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(x + 7 * d - 0.6, y - 13, 1.3, 1.3);
  },

  lamp(ctx, it, p) {
    const x = it.x;
    ctx.fillStyle = '#1e1a26';
    ctx.fillRect(x - 1.8, it.y - 58, 3.6, 58);
    ctx.fillRect(x - 6, it.y - 4, 12, 4);
    if (it.lit) glow(ctx, x, it.y - 62, 40, '#ffd98a', 0.75);
    ctx.fillStyle = it.lit ? '#ffe7a8' : '#3a3650';
    ctx.fillRect(x - 5, it.y - 68, 10, 11);
    ctx.strokeStyle = '#1e1a26';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - 5, it.y - 68, 10, 11);
    ctx.fillStyle = '#1e1a26';
    poly(ctx, [[x - 7, it.y - 68], [x, it.y - 75], [x + 7, it.y - 68]]);
    ctx.fill();
    // Life ring.
    ctx.strokeStyle = it.ring;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, it.y - 22, 6.5, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = '#f4efe6';
    ctx.lineWidth = 4.2;
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(x, it.y - 22, 6.5, k * (TAU / 4), k * (TAU / 4) + 0.35);
      ctx.stroke();
    }
  },

  cat(ctx, it, p, t) {
    const { x, y } = it;
    const ink = '#15111f';
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    const swish = Math.sin(t * 1.8) * 1.2;
    const s = it.tail === 'left' ? -1 : 1;
    ctx.beginPath();
    ctx.moveTo(x + s * 7, y - 3);
    ctx.quadraticCurveTo(x + s * 21, y - 4, x + s * (18 + swish), y - 16);
    ctx.quadraticCurveTo(x + s * (16 + swish), y - 21, x + s * (19 + swish), y - 23);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(x, y - 11, 9.5, 11, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 2, y - 26, 7.5, 0, TAU);
    ctx.fill();
    poly(ctx, [[x - 5, y - 30], [x - 4, y - 38], [x + 1, y - 32]]);
    ctx.fill();
    poly(ctx, [[x + 3, y - 32], [x + 8, y - 38], [x + 9, y - 29]]);
    ctx.fill();
    if (it.eyes === 'open') {
      ctx.fillStyle = '#d8f06a';
      ctx.beginPath();
      ctx.ellipse(x - 0.8, y - 27, 1.7, 1.4, 0, 0, TAU);
      ctx.ellipse(x + 5, y - 27, 1.7, 1.4, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#8a8fb0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - 2.6, y - 27);
      ctx.quadraticCurveTo(x - 0.8, y - 25.6, x + 1, y - 27);
      ctx.moveTo(x + 3.2, y - 27);
      ctx.quadraticCurveTo(x + 5, y - 25.6, x + 6.8, y - 27);
      ctx.stroke();
    }
    ctx.strokeStyle = it.collar;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 20);
    ctx.quadraticCurveTo(x + 2, y - 17, x + 8, y - 20);
    ctx.stroke();
    ctx.fillStyle = '#f2d27a';
    ctx.beginPath();
    ctx.arc(x + 2, y - 17.6, 1.4, 0, TAU);
    ctx.fill();
  },

  crates(ctx, it, p) {
    const spots = [[it.x, it.y - 18], [it.x + 20, it.y - 18], [it.x + 10, it.y - 36]].slice(0, it.n);
    for (const [cx, cy] of spots) {
      ctx.fillStyle = '#8a6a48';
      ctx.fillRect(cx, cy, 18, 18);
      ctx.strokeStyle = '#4a3424';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(cx + 0.7, cy + 0.7, 16.6, 16.6);
      ctx.beginPath();
      ctx.moveTo(cx + 1, cy + 1);
      ctx.lineTo(cx + 17, cy + 17);
      ctx.stroke();
    }
  },

  barrel(ctx, it) {
    ctx.fillStyle = '#6a4630';
    ctx.beginPath();
    ctx.ellipse(it.x, it.y - 9, 7, 9.5, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#2a2026';
    ctx.lineWidth = 1.4;
    for (const dy of [-14, -4]) {
      ctx.beginPath();
      ctx.moveTo(it.x - 6.4, it.y + dy);
      ctx.lineTo(it.x + 6.4, it.y + dy);
      ctx.stroke();
    }
  },

  smoke(ctx, it, p, t) {
    for (let i = 0; i < 5; i++) {
      const k = (t * 0.22 + i / 5) % 1;
      ctx.fillStyle = `rgba(205, 195, 225, ${0.28 * (1 - k)})`;
      ctx.beginPath();
      ctx.arc(it.x + Math.sin(k * 5 + i) * 3 + k * 12, it.y - k * 42, 3 + k * 7, 0, TAU);
      ctx.fill();
    }
  },

  meteor(ctx, it, p, t) {
    const g = ctx.createLinearGradient(it.x1, it.y1, it.x0, it.y0);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    g.addColorStop(1, 'rgba(160, 200, 255, 0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(it.x0, it.y0);
    ctx.lineTo(it.x1, it.y1);
    ctx.stroke();
    glow(ctx, it.x1, it.y1, 7, '#ffffff', 0.7 + 0.3 * Math.sin(t * 9));
  },

  farsail(ctx, it, p) {
    ctx.fillStyle = 'rgba(10, 14, 40, 0.75)';
    poly(ctx, [[it.x - 9, it.y - 2], [it.x + 9, it.y - 2], [it.x + 6, it.y + 1], [it.x - 6, it.y + 1]]);
    ctx.fill();
    poly(ctx, [[it.x, it.y - 18], [it.x, it.y - 3], [it.x + 8, it.y - 3]]);
    ctx.fill();
  },

  heron(ctx, it) {
    const { x, y } = it;
    ctx.strokeStyle = '#2a2f44';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 14);
    ctx.lineTo(x - 3, y);
    ctx.moveTo(x + 2, y - 14);
    ctx.lineTo(x + 3, y);
    ctx.stroke();
    ctx.fillStyle = '#9aa3bc';
    ctx.beginPath();
    ctx.ellipse(x, y - 19, 9, 5.5, -0.35, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#9aa3bc';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 6, y - 22);
    ctx.quadraticCurveTo(x + 2, y - 30, x + 7, y - 36);
    ctx.stroke();
    ctx.fillStyle = '#c4cad9';
    ctx.beginPath();
    ctx.arc(x + 7.5, y - 37, 2.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e0b04a';
    poly(ctx, [[x + 9, y - 38], [x + 18, y - 36], [x + 9, y - 36]]);
    ctx.fill();
  },

  fog(ctx, it, p, t) {
    const g = ctx.createLinearGradient(0, it.y - it.h / 2, 0, it.y + it.h / 2);
    g.addColorStop(0, 'rgba(225, 222, 236, 0)');
    g.addColorStop(0.5, `rgba(225, 222, 236, ${it.a})`);
    g.addColorStop(1, 'rgba(225, 222, 236, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, it.y - it.h / 2, SCENE_W, it.h);
    ctx.fillStyle = `rgba(225, 222, 236, ${it.a * 0.5})`;
    for (let i = 0; i < 4; i++) {
      const x = (((i * 170 + t * it.speed) % 720) + 720) % 720 - 60;
      ctx.beginPath();
      ctx.ellipse(x, it.y + Math.sin(i * 2.3) * 6, 70, it.h * 0.28, 0, 0, TAU);
      ctx.fill();
    }
  },
};
