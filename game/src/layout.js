// Screen layout: the fixed 1280 x 800 view the game draws in (scaled to the window), where the
// two picture panels sit, and the rectangles of every button. Both the HUD (to draw) and the game
// (to hit-test) read these, so a button is drawn exactly where it is clicked.

import { SCENE_H, SCENE_W } from './scenes.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;

export const PANELS = [
  { x: 27, y: 112, w: SCENE_W, h: SCENE_H },
  { x: 653, y: 112, w: SCENE_W, h: SCENE_H },
];

export const BUTTONS = {
  start: { x: 520, y: 548, w: 240, h: 60, label: 'Start the night' },
  hint: { x: 27, y: 600, w: 210, h: 54, label: 'Hint' },
  pause: { x: 1043, y: 600, w: 210, h: 54, label: 'Pause  (P)' },
  sound: { x: 1192, y: 24, w: 60, h: 48, label: '' },
  resume: { x: 520, y: 440, w: 240, h: 58, label: 'Resume  (P)' },
  next: { x: 520, y: 600, w: 240, h: 58, label: 'Next harbor' },
  retry: { x: 400, y: 694, w: 220, h: 58, label: 'Try again' },
  menu: { x: 660, y: 694, w: 220, h: 58, label: 'Title screen' },
  again: { x: 520, y: 640, w: 240, h: 58, label: 'Play again' },
};

export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

/** Which panel (0 left, 1 right) a view point is in, with the point in panel coordinates. */
export function panelAt(x, y) {
  for (let i = 0; i < PANELS.length; i++) {
    const p = PANELS[i];
    if (inRect(p, x, y)) return { panel: i, px: x - p.x, py: y - p.y };
  }
  return null;
}
