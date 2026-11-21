// Game state and rules: which screen is up, the level being played, the countdown, clicks on the
// pictures (a find, or a miss that costs time), hints, pause, scoring and the results of each
// level. Nothing here draws: hud.js and draw.js read this state every frame.

import { LEVELS, levelPictures } from './scenes.js';
import { BUTTONS, inRect, panelAt } from './layout.js';
import * as audio from './audio.js';

export const PENALTY_SECONDS = 5;
export const HINTS_PER_LEVEL = 3;
export const HINT_SECONDS = 4;
const HIT_SLACK = 6; // forgiving pixels around each difference
const CELEBRATE_SECONDS = 1.5; // the last ring plays before the results card

export function createState() {
  return {
    screen: 'title', // title | intro | play | complete | timeup | win
    paused: false,
    frozen: false, // screenshot states hold still
    clock: 0, // seconds of game time, stopped while paused
    levelIndex: 0,
    level: null,
    pictures: null,
    found: [], // { id, at }
    timeLeft: 0,
    hits: 0,
    misses: 0,
    hintsLeft: HINTS_PER_LEVEL,
    hint: null, // { id, at, ox, oy }
    hinted: [],
    crosses: [], // { panel, x, y, at }
    shakes: [-9, -9],
    floaters: [], // { text, x, y, at, color }
    results: [],
    doneAt: null,
    endedAt: null,
    lastWhole: null,
    hover: null,
    announce: '',
  };
}

export function loadLevel(s, index) {
  s.levelIndex = index;
  s.level = LEVELS[index];
  s.pictures = levelPictures(s.level);
  s.found = [];
  s.timeLeft = s.level.time;
  s.hits = 0;
  s.misses = 0;
  s.hintsLeft = HINTS_PER_LEVEL;
  s.hint = null;
  s.hinted = [];
  s.crosses = [];
  s.floaters = [];
  s.shakes = [-9, -9];
  s.doneAt = null;
  s.endedAt = null;
  s.lastWhole = null;
  s.paused = false;
}

export function showIntro(s, index) {
  loadLevel(s, index);
  s.screen = 'intro';
  s.announce = `Level ${s.level.number}: ${s.level.name}. Find 10 differences in ${formatTime(s.level.time)}.`;
}

export function beginHunt(s) {
  s.screen = 'play';
  s.announce = 'The hunt is on. Click a difference on either picture.';
}

export function remaining(s) {
  return s.level ? s.level.diffs.length - s.found.length : 0;
}

export function isFound(s, id) {
  return s.found.some((f) => f.id === id);
}

export function formatTime(sec) {
  const t = Math.max(0, Math.ceil(sec));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

export function counterText(s) {
  const n = s.level.diffs.length;
  const left = remaining(s);
  return left === 0 ? `Found all ${n}!` : `Found ${s.found.length} of ${n} – ${left} to go`;
}

export function accuracy(s) {
  const clicks = s.hits + s.misses;
  return clicks === 0 ? 1 : s.hits / clicks;
}

/** The unfound difference under a panel point, if any (the nearest when two overlap). */
function differenceAt(s, px, py) {
  let best = null;
  let bestD = Infinity;
  for (const d of s.level.diffs) {
    const dist = Math.hypot(px - d.x, py - d.y);
    if (dist <= d.r + HIT_SLACK && dist < bestD && !isFound(s, d.id)) {
      best = d;
      bestD = dist;
    }
  }
  return best;
}

function foundDifferenceAt(s, px, py) {
  return s.level.diffs.find((d) => isFound(s, d.id) && Math.hypot(px - d.x, py - d.y) <= d.r + HIT_SLACK);
}

export function markFound(s, diff, silent = false) {
  if (isFound(s, diff.id)) return;
  s.found.push({ id: diff.id, at: s.clock });
  s.hits += 1;
  if (s.hint && s.hint.id === diff.id) s.hint = null;
  if (!silent) {
    audio.chime(s.found.length - 1);
    s.floaters.push({ text: diff.note, x: diff.x, y: diff.y - diff.r - 10, at: s.clock, color: '#ffe27a', panel: 1 });
  }
  s.announce = `${diff.note}. ${counterText(s).replace(/!$/, "")}.`;
  if (remaining(s) === 0) {
    s.doneAt = s.clock;
    if (!silent) audio.fanfare();
  }
}

function miss(s, panel, px, py) {
  s.misses += 1;
  s.timeLeft = Math.max(0, s.timeLeft - PENALTY_SECONDS);
  s.crosses.push({ panel, x: px, y: py, at: s.clock });
  s.shakes[panel] = s.clock;
  s.floaters.push({ text: `−${PENALTY_SECONDS}s`, x: px, y: py - 18, at: s.clock, color: '#ff6b6b', panel });
  audio.buzz();
  s.announce = `Not a difference. Minus ${PENALTY_SECONDS} seconds.`;
}

export function useHint(s) {
  if (s.screen !== 'play' || s.paused || s.hintsLeft <= 0 || remaining(s) === 0) return false;
  if (s.hint && s.clock - s.hint.at < HINT_SECONDS) return false;
  const unfound = s.level.diffs.filter((d) => !isFound(s, d.id));
  const fresh = unfound.filter((d) => !s.hinted.includes(d.id));
  const pool = fresh.length ? fresh : unfound;
  // A fixed but unpredictable pick: spread hints across the picture rather than in list order.
  const d = pool[(s.found.length * 7 + s.hintsLeft * 3) % pool.length];
  // The pulse circles the area, not the exact spot: its centre sits a little off the difference.
  const angle = (d.x * 13 + d.y * 7) % 6.283;
  const off = d.r * 0.55;
  s.hint = { id: d.id, at: s.clock, ox: Math.cos(angle) * off, oy: Math.sin(angle) * off };
  s.hinted.push(d.id);
  s.hintsLeft -= 1;
  audio.hintSound();
  s.announce = `Hint: look inside the glowing circle. ${s.hintsLeft} hints left.`;
  return true;
}

export function togglePause(s) {
  if (s.screen !== 'play' || s.doneAt !== null) return;
  s.paused = !s.paused;
  audio.click();
  s.announce = s.paused ? 'Paused.' : 'Resumed.';
}

function levelScore(s) {
  const acc = accuracy(s);
  const time = Math.max(0, Math.ceil(s.timeLeft));
  const score = 1000 + time * 10 + Math.round(acc * 500) + s.hintsLeft * 100;
  const share = time / s.level.time;
  const used = HINTS_PER_LEVEL - s.hintsLeft;
  const stars = acc >= 0.8 && used <= 1 && share >= 0.3 ? 3 : acc >= 0.6 || share >= 0.15 ? 2 : 1;
  return { score, stars };
}

export function finishLevel(s) {
  const { score, stars } = levelScore(s);
  s.results[s.levelIndex] = {
    number: s.level.number,
    name: s.level.name,
    timeLeft: s.timeLeft,
    timeUsed: s.level.time - s.timeLeft,
    accuracy: accuracy(s),
    hits: s.hits,
    misses: s.misses,
    hintsUsed: HINTS_PER_LEVEL - s.hintsLeft,
    score,
    stars,
  };
  s.screen = 'complete';
  s.announce = `Level ${s.level.number} complete. Score ${score}.`;
}

function timeUp(s) {
  s.timeLeft = 0;
  s.endedAt = s.clock;
  s.hint = null;
  s.screen = 'timeup';
  audio.timeUp();
  s.announce = `Time is up. You found ${s.found.length} of ${s.level.diffs.length}.`;
}

export function totalScore(s) {
  return s.results.reduce((sum, r) => sum + (r ? r.score : 0), 0);
}

export function update(s, dt) {
  if (s.frozen) return;
  if (s.screen === 'play' && s.paused) return;
  s.clock += dt;
  s.crosses = s.crosses.filter((c) => s.clock - c.at < 0.9);
  s.floaters = s.floaters.filter((f) => s.clock - f.at < 1.6);
  if (s.hint && s.clock - s.hint.at > HINT_SECONDS) s.hint = null;
  if (s.screen !== 'play') return;
  if (s.doneAt !== null) {
    if (s.clock - s.doneAt > CELEBRATE_SECONDS) finishLevel(s);
    return;
  }
  s.timeLeft -= dt;
  const whole = Math.ceil(s.timeLeft);
  if (whole !== s.lastWhole) {
    if (s.lastWhole !== null && whole <= 10 && whole > 0) audio.tick(true);
    else if (s.lastWhole !== null && whole <= 30 && whole > 0) audio.tick(false);
    s.lastWhole = whole;
  }
  if (s.timeLeft <= 0) timeUp(s);
}

/** A click or tap at a view point (1280 x 800). */
export function pointer(s, x, y) {
  audio.unlockAudio();
  const b = BUTTONS;
  if (inRect(b.sound, x, y)) {
    audio.toggleMute();
    return;
  }
  switch (s.screen) {
    case 'title':
      if (inRect(b.start, x, y)) {
        audio.click();
        showIntro(s, 0);
      }
      return;
    case 'intro':
      audio.click();
      beginHunt(s);
      return;
    case 'play': {
      if (s.paused) {
        if (inRect(b.resume, x, y)) togglePause(s);
        return;
      }
      if (inRect(b.pause, x, y)) return togglePause(s);
      if (inRect(b.hint, x, y)) return void useHint(s);
      if (s.doneAt !== null) return;
      const hit = panelAt(x, y);
      if (!hit) return;
      const d = differenceAt(s, hit.px, hit.py);
      if (d) markFound(s, d);
      else if (!foundDifferenceAt(s, hit.px, hit.py)) miss(s, hit.panel, hit.px, hit.py);
      return;
    }
    case 'complete':
      if (inRect(b.next, x, y)) advance(s);
      return;
    case 'timeup':
      if (s.clock - s.endedAt < 1) return; // let the reveal show first
      if (inRect(b.retry, x, y)) {
        audio.click();
        showIntro(s, s.levelIndex);
      } else if (inRect(b.menu, x, y)) {
        audio.click();
        s.screen = 'title';
      }
      return;
    case 'win':
      if (inRect(b.again, x, y)) {
        audio.click();
        s.results = [];
        showIntro(s, 0);
      }
      return;
  }
}

function advance(s) {
  audio.click();
  if (s.levelIndex + 1 < LEVELS.length) showIntro(s, s.levelIndex + 1);
  else {
    s.screen = 'win';
    s.announce = `The harbor sleeps. Total score ${totalScore(s)}.`;
  }
}

export function key(s, k) {
  audio.unlockAudio();
  const lower = k.toLowerCase();
  if (lower === 'm') return void audio.toggleMute();
  if (s.screen === 'play') {
    if (lower === 'p' || k === 'Escape') return togglePause(s);
    if (lower === 'h') return void useHint(s);
    return;
  }
  if (k !== 'Enter' && k !== ' ') return;
  if (s.screen === 'title') showIntro(s, 0);
  else if (s.screen === 'intro') beginHunt(s);
  else if (s.screen === 'complete') advance(s);
  else if (s.screen === 'timeup' && s.clock - s.endedAt >= 1) showIntro(s, s.levelIndex);
  else if (s.screen === 'win') {
    s.results = [];
    showIntro(s, 0);
  }
}

/** The button under the pointer, for the hover look and the hand cursor. */
export function hoverAt(s, x, y) {
  const on = (name) => inRect(BUTTONS[name], x, y) && name;
  let h = on('sound');
  if (!h) {
    if (s.screen === 'title') h = on('start');
    else if (s.screen === 'play') h = s.paused ? on('resume') : on('hint') || on('pause') || (panelAt(x, y) ? 'panel' : null);
    else if (s.screen === 'complete') h = on('next');
    else if (s.screen === 'timeup') h = on('retry') || on('menu');
    else if (s.screen === 'win') h = on('again');
    else if (s.screen === 'intro') h = 'panel';
  }
  s.hover = h || null;
  return s.hover;
}
