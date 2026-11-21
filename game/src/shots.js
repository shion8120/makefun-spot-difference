// Photo states for screenshots: ?shot=<name> puts the game straight into a held, photogenic
// moment built through the game's own rules (the clock is frozen so the frame is exact).
//   start     the title screen
//   cover     night 1 mid-hunt: four differences ringed, 6 to go, a hint pulsing, the clock running
//   level2    night 2 fresh, nothing found yet
//   complete  the results card after clearing night 1
// and, for checking the other screens: intro, pause, urgent, timeup, win.

import { LEVELS } from './scenes.js';
import { beginHunt, finishLevel, loadLevel, showIntro } from './game.js';

function find(s, ids, at) {
  ids.forEach((id, i) => {
    const d = s.level.diffs.find((x) => x.id === id);
    s.found.push({ id: d.id, at: at[i] });
    s.hits += 1;
  });
}

function playing(s, index, clock) {
  loadLevel(s, index);
  beginHunt(s);
  s.clock = clock;
}

const SHOTS = {
  start(s) {
    s.screen = 'title';
    s.clock = 2;
  },
  intro(s) {
    showIntro(s, 1);
    s.clock = 1;
  },
  cover(s) {
    playing(s, 0, 40);
    find(s, ['L1-star', 'L1-roof', 'L1-buoy', 'L1-flag'], [9, 18, 27, 39.7]);
    s.misses = 1;
    s.timeLeft = 107;
    s.hintsLeft = 2;
    s.hint = { id: 'L1-cat', at: 39.2, ox: 10, oy: -8 };
    const flag = s.level.diffs.find((d) => d.id === 'L1-flag');
    s.floaters.push({ text: flag.note, x: flag.x, y: flag.y - flag.r - 10, at: 39.7, color: '#ffe27a', panel: 1 });
  },
  level2(s) {
    playing(s, 1, 3);
  },
  pause(s) {
    playing(s, 1, 20);
    s.paused = true;
  },
  urgent(s) {
    playing(s, 2, 60.25);
    find(s, ['L3-star', 'L3-sail', 'L3-ring', 'L3-gull', 'L3-antenna', 'L3-rope', 'L3-buoy'], [10, 20, 30, 40, 45, 50, 55]);
    s.misses = 3;
    s.timeLeft = 21.6;
    s.hintsLeft = 0;
    s.crosses.push({ panel: 0, x: 220, y: 150, at: 59.9 });
    s.shakes[0] = 59.9;
  },
  complete(s) {
    playing(s, 0, 120);
    find(s, s.level.diffs.map((d) => d.id), s.level.diffs.map((_, i) => 20 + i * 8));
    s.misses = 2;
    s.timeLeft = 62.2;
    s.hintsLeft = 2;
    finishLevel(s);
  },
  timeup(s) {
    playing(s, 2, 200);
    find(s, ['L3-star', 'L3-sail', 'L3-ring', 'L3-gull', 'L3-antenna', 'L3-rope'], [10, 20, 30, 40, 45, 50]);
    s.misses = 4;
    s.screen = 'timeup';
    s.timeLeft = 0;
    s.endedAt = 198;
  },
  win(s) {
    s.results = LEVELS.map((L, i) => ({
      number: L.number,
      name: L.name,
      timeLeft: [62, 41, 18][i],
      timeUsed: L.time - [62, 41, 18][i],
      accuracy: [0.83, 0.77, 0.71][i],
      hits: 10,
      misses: [2, 3, 4][i],
      hintsUsed: [1, 1, 2][i],
      score: [2235, 1895, 1535][i],
      stars: [3, 2, 2][i],
    }));
    loadLevel(s, 2);
    s.screen = 'win';
    s.clock = 4;
  },
};

export function applyShot(s, name) {
  const shot = SHOTS[name];
  if (!shot) return false;
  shot(s);
  s.frozen = true;
  return true;
}
