// Scene data for Moonlit Harbor: the three levels (one harbor across one night), the items each
// picture is drawn from, and the ten differences of each level as plain records. The left panel
// draws buildScene(level); the right panel draws applyDifferences() of the same items, so the two
// pictures can only differ where a difference record says they do.

export const SCENE_W = 600;
export const SCENE_H = 460;
export const HORIZON = 250;

/** A small seeded random generator, so every level's star field is the same on every run. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A difference record: where it is (x, y, r in panel coordinates, 600 x 460), what the player
// should notice (note) and how the right panel changes:
//   { op: 'remove', target }            the item is gone on the right
//   { op: 'add', item }                 an item only the right has
//   { op: 'set', target, props }        the item's properties change on the right
//   { op: 'move', target, to: {x, y} }  the item sits somewhere else on the right
export const LEVELS = [
  {
    number: 1,
    key: 'dusk',
    name: 'Lantern Dusk',
    blurb: 'The lamps are just coming on along the quay.',
    time: 150,
    difficulty: 'Gentle',
    seed: 11,
    starCount: 26,
    moon: { x: 470, y: 96, r: 27, craters: true },
    fog: 0,
    extras: [{ id: 'smoke', kind: 'smoke', z: 29, x: 414, y: 189 }],
    palette: {
      sky: ['#1c1d4c', '#4f3b7c', '#c9826f'],
      sea: ['#4a4a88', '#2a2b5e', '#13163a'],
      hills: '#2f2a58',
      rock: '#262040',
      rockLine: '#3b3360',
      land: '#2c2645',
      quay: '#3d3556',
      stone: '#4d4469',
      moon: '#ffe8b5',
      moonGlow: 'rgba(255, 205, 150, 0.32)',
      cloud: 'rgba(255, 186, 168, 0.42)',
      star: '#fff4da',
      lit: '#ffd27a',
      dark: '#2a2442',
      walls: ['#6a4f74', '#56607e', '#7a5a5e', '#4f5a73'],
      roofs: ['#8b3f4c', '#3f4a6e', '#7a3b3b', '#5a3f62'],
      wood: '#6a4a3c',
      woodDark: '#3f2c28',
      sail: '#efe4cc',
      shimmer: '#ffd9b0',
    },
    diffs: [
      { id: 'L1-star', x: 36, y: 38, r: 24, note: 'The bright evening star is gone', change: { op: 'remove', target: 'starA' } },
      { id: 'L1-window', x: 459, y: 209, r: 24, note: 'A window glows blue', change: { op: 'set', target: 'h2w2', props: { color: '#7fd6ff' } } },
      { id: 'L1-buoy', x: 181, y: 352, r: 30, note: 'The red buoy has drifted', change: { op: 'move', target: 'buoy1', to: { x: 194, y: 366 } } },
      { id: 'L1-fish', x: 52, y: 386, r: 28, note: 'A fish leaps from the water', change: { op: 'add', item: { id: 'fish1', kind: 'fish', z: 47, x: 52, y: 392, dir: 1, color: '#9fd0e8' } } },
      { id: 'L1-flag', x: 212, y: 202, r: 24, note: 'The masthead flag turned green', change: { op: 'set', target: 'sail1', props: { flag: '#5fd08a' } } },
      { id: 'L1-cat', x: 404, y: 360, r: 26, note: "The cat's tail curls the other way", change: { op: 'set', target: 'cat', props: { tail: 'left' } } },
      { id: 'L1-cloud', x: 150, y: 64, r: 40, note: 'A cloud has blown away', change: { op: 'remove', target: 'cloud1' } },
      { id: 'L1-roof', x: 507, y: 210, r: 30, note: 'A roof is painted blue', change: { op: 'set', target: 'h3', props: { roof: '#3f6f9a' } } },
      { id: 'L1-stripes', x: 72, y: 168, r: 36, note: 'The lighthouse stripes are teal', change: { op: 'set', target: 'lighthouse', props: { stripe: '#2f9c95' } } },
      { id: 'L1-lamp', x: 568, y: 312, r: 26, note: 'The pier lamp is out', change: { op: 'set', target: 'lamp', props: { lit: false } } },
    ],
  },
  {
    number: 2,
    key: 'midnight',
    name: 'Midnight Moorings',
    blurb: 'Deep night. The boats rock, the town dreams.',
    time: 120,
    difficulty: 'Tricky',
    seed: 23,
    starCount: 44,
    moon: { x: 452, y: 58, r: 22, craters: true },
    fog: 0,
    extras: [
      { id: 'meteor', kind: 'meteor', z: 6, x0: 178, y0: 102, x1: 128, y1: 130 },
      { id: 'farsail', kind: 'farsail', z: 15.5, x: 318, y: 251 },
    ],
    palette: {
      sky: ['#050a22', '#102056', '#27407e'],
      sea: ['#1b3366', '#0f1f45', '#050b1d'],
      hills: '#0f1a3e',
      rock: '#0e1530',
      rockLine: '#1d2a52',
      land: '#111a38',
      quay: '#1d2a4e',
      stone: '#2a3a66',
      moon: '#f6f2e2',
      moonGlow: 'rgba(200, 220, 255, 0.30)',
      cloud: 'rgba(170, 190, 240, 0.22)',
      star: '#ffffff',
      lit: '#ffc45e',
      dark: '#141b36',
      walls: ['#3a3f66', '#2f4a66', '#4b3e5e', '#34445e'],
      roofs: ['#5e2f44', '#2c3656', '#5a2f30', '#40305a'],
      wood: '#4a3a40',
      woodDark: '#2a2030',
      sail: '#d8dceb',
      shimmer: '#cfe0ff',
    },
    diffs: [
      { id: 'L2-star', x: 285, y: 44, r: 18, note: 'The Little Kite lost a star', change: { op: 'remove', target: 'kite3' } },
      { id: 'L2-window', x: 556, y: 221, r: 18, note: 'Someone turned off a light', change: { op: 'set', target: 'h4w1', props: { lit: false } } },
      { id: 'L2-chimney', x: 414, y: 198, r: 18, note: 'A chimney is missing', change: { op: 'set', target: 'h1', props: { chimney: false } } },
      { id: 'L2-oar', x: 146, y: 408, r: 20, note: 'The rowboat lost an oar', change: { op: 'set', target: 'row1', props: { oars: 1 } } },
      { id: 'L2-porthole', x: 274, y: 424, r: 18, note: 'The trawler has one porthole fewer', change: { op: 'set', target: 'tug1', props: { portholes: 3 } } },
      { id: 'L2-pennant', x: 466, y: 331, r: 17, note: 'One pennant changed colour', change: { op: 'set', target: 'bunting', props: { colors: ['#e0565b', '#f2c14e', '#5fb7d4', '#e0565b', '#f2c14e', '#a36ad6', '#e0565b', '#f2c14e', '#5fb7d4'] } } },
      { id: 'L2-bird', x: 298, y: 160, r: 20, note: 'An extra gull flies by', change: { op: 'add', item: { id: 'bird3', kind: 'bird', z: 12, x: 298, y: 160, s: 1 } } },
      { id: 'L2-eyes', x: 407, y: 345, r: 16, note: 'The cat has closed its eyes', change: { op: 'set', target: 'cat', props: { eyes: 'closed' } } },
      { id: 'L2-crate', x: 517, y: 345, r: 18, note: 'A crate is missing from the stack', change: { op: 'set', target: 'crates', props: { n: 2 } } },
      { id: 'L2-door', x: 451, y: 262, r: 17, note: 'A door is painted green', change: { op: 'set', target: 'h2', props: { door: '#3f8f5a' } } },
    ],
  },
  {
    number: 3,
    key: 'fog',
    name: 'Fog Before Dawn',
    blurb: 'Sea mist rolls in. The smallest things give it away.',
    time: 105,
    difficulty: 'Sharp-eyed',
    seed: 37,
    starCount: 64,
    moon: { x: 528, y: 124, r: 18, craters: false },
    fog: 1,
    extras: [{ id: 'heron', kind: 'heron', z: 25, x: 128, y: 320 }],
    palette: {
      sky: ['#18213b', '#3b4a6e', '#8c86a8'],
      sea: ['#4a5978', '#2f3c5a', '#1a2238'],
      hills: '#3a4462',
      rock: '#2a3048',
      rockLine: '#3e4766',
      land: '#2c3350',
      quay: '#3c4565',
      stone: '#4f5a7c',
      moon: '#f3ead8',
      moonGlow: 'rgba(240, 220, 210, 0.26)',
      cloud: 'rgba(220, 210, 230, 0.30)',
      star: '#fdf8ee',
      lit: '#ffcf80',
      dark: '#2c3350',
      walls: ['#5a5a7a', '#4e6280', '#6a5a70', '#4d5a78'],
      roofs: ['#7a4652', '#3e4a70', '#6e4040', '#55466e'],
      wood: '#5e4c4c',
      woodDark: '#3a3038',
      sail: '#e8e4dc',
      shimmer: '#f3e6e0',
    },
    diffs: [
      { id: 'L3-star', x: 150, y: 176, r: 14, note: 'A faint low star has vanished', change: { op: 'remove', target: 'starT' } },
      { id: 'L3-window', x: 493, y: 235, r: 15, note: 'A window burns rosier', change: { op: 'set', target: 'h3w1', props: { color: '#ff9a8a' } } },
      { id: 'L3-tower', x: 72, y: 165, r: 14, note: 'The tower window is bricked up', change: { op: 'set', target: 'lighthouse', props: { window: false } } },
      { id: 'L3-sail', x: 230, y: 268, r: 18, note: 'The sail lost its stripe', change: { op: 'set', target: 'sail1', props: { sailStripe: false } } },
      { id: 'L3-buoy', x: 342, y: 296, r: 16, note: 'The striped buoy wears red', change: { op: 'set', target: 'buoy2', props: { color: '#d8574f' } } },
      { id: 'L3-collar', x: 407, y: 353, r: 14, note: "The cat's collar is blue", change: { op: 'set', target: 'cat', props: { collar: '#4f8fe0' } } },
      { id: 'L3-rope', x: 306, y: 402, r: 18, note: 'The mooring line is gone', change: { op: 'remove', target: 'rope1' } },
      { id: 'L3-antenna', x: 568, y: 174, r: 16, note: 'A rooftop aerial appeared', change: { op: 'set', target: 'h4', props: { antenna: true } } },
      { id: 'L3-gull', x: 310, y: 312, r: 15, note: 'The gull on the post looks the other way', change: { op: 'set', target: 'gull', props: { flip: true } } },
      { id: 'L3-ring', x: 568, y: 350, r: 15, note: 'The life ring is white', change: { op: 'set', target: 'lamp', props: { ring: '#f0ece4' } } },
    ],
  },
];

/** Keep random stars away from the fixed shapes they would hide behind or be confused with. */
function starAllowed(x, y, level, placed) {
  const m = level.moon;
  if (Math.hypot(x - m.x, y - m.y) < m.r + 22) return false;
  if (x > 40 && x < 108 && y > 56) return false; // lighthouse
  if (x > 360 && y > 150) return false; // town roofs
  if (x > 180 && x < 240 && y > 180) return false; // mast
  if (y > 205) return false;
  for (const d of level.diffs) if (Math.hypot(x - d.x, y - d.y) < d.r + 4 && d.change.op !== 'remove') return false;
  for (const p of placed) if (Math.hypot(x - p.x, y - p.y) < 14) return false;
  return true;
}

function house(id, x, w, h, peak, wall, roof, extra = {}) {
  return { id, kind: 'house', z: 30, x, base: 272, w, h, peak, wall, roof, chimney: false, chimX: 0.7, door: '#3a2a34', doorX: 0.5, antenna: false, ...extra };
}

function window(id, x, y, w, h, lit, color) {
  return { id, kind: 'window', z: 31, x, y, w, h, lit, color };
}

/** The items of a level's picture, in drawing order (z), before any difference is applied. */
export function buildScene(level) {
  const p = level.palette;
  const rand = seededRandom(level.seed);
  const items = [];
  items.push({ id: 'sky', kind: 'sky', z: 0 });

  // Stars: a few fixed ones the differences use, and a seeded field around them.
  const fixed = [
    { id: 'starA', x: 36, y: 38, s: 2.6, ph: 0.3 },
    { id: 'kite1', x: 250, y: 40, s: 1.6, ph: 1.1 },
    { id: 'kite2', x: 268, y: 28, s: 1.5, ph: 2.0 },
    { id: 'kite3', x: 285, y: 44, s: 1.7, ph: 2.9 },
    { id: 'kite4', x: 302, y: 32, s: 1.5, ph: 3.7 },
    { id: 'kite5', x: 318, y: 50, s: 1.6, ph: 4.4 },
    { id: 'starT', x: 150, y: 176, s: 1.2, ph: 5.1 },
  ];
  const placed = [...fixed];
  let tries = 0;
  while (placed.length < fixed.length + level.starCount && tries++ < 4000) {
    const x = 6 + rand() * 588;
    const y = 6 + rand() * 200;
    if (!starAllowed(x, y, level, placed)) continue;
    placed.push({ id: `s${placed.length}`, x, y, s: 0.7 + rand() * 1.3, ph: rand() * 6.28 });
  }
  for (const s of placed) items.push({ kind: 'star', z: 5, ...s });

  items.push({ id: 'moon', kind: 'moon', z: 8, ...level.moon });
  items.push({ id: 'cloud1', kind: 'cloud', z: 10, x: 150, y: 64, w: 92 });
  items.push({ id: 'cloud2', kind: 'cloud', z: 10, x: 352, y: 118, w: 64 });
  items.push({ id: 'bird1', kind: 'bird', z: 12, x: 250, y: 150, s: 1 });
  items.push({ id: 'bird2', kind: 'bird', z: 12, x: 270, y: 137, s: 0.8 });

  items.push({ id: 'hills', kind: 'poly', z: 15, color: p.hills, pts: [[150, 250], [190, 238], [240, 241], [290, 232], [340, 238], [380, 236], [380, 252], [150, 252]] });
  items.push({ id: 'sea', kind: 'sea', z: 16, lines: seaLines(rand) });
  items.push({ id: 'glint', kind: 'reflection', z: 17, x: level.moon.x, y0: HORIZON + 4, y1: 360, r: level.moon.r });

  // The headland, its lighthouse and the keeper's cottage.
  items.push({ id: 'rocks', kind: 'rocks', z: 20, pts: [[0, 226], [40, 221], [95, 226], [150, 238], [172, 262], [182, 300], [150, 316], [90, 323], [30, 326], [0, 330]] });
  items.push({ id: 'lighthouse', kind: 'lighthouse', z: 22, x: 72, base: 228, h: 130, stripe: '#c8443f', window: true, light: '#fff0b0' });
  items.push({ id: 'beam', kind: 'beam', z: 23, x: 72, y: 83 });
  items.push({ id: 'cottage', kind: 'cottage', z: 24, x: 104, base: 238, w: 40, h: 20 });

  // The town on the quay.
  items.push({ id: 'quay', kind: 'quay', z: 28, x: 366, y: 268, w: 234, h: 34 });
  items.push(house('h1', 374, 50, 58, 22, p.walls[0], p.roofs[0], { chimney: true, chimX: 0.8 }));
  items.push(house('h2', 430, 42, 80, 18, p.walls[1], p.roofs[1], { door: '#7a3a3a' }));
  items.push(house('h3', 478, 58, 54, 16, p.walls[2], p.roofs[2], { chimney: true, chimX: 0.2 }));
  items.push(house('h4', 542, 52, 68, 20, p.walls[3], p.roofs[3], { doorX: 0.75 }));
  items.push(window('h1w1', 382, 224, 12, 14, true, p.lit));
  items.push(window('h1w2', 404, 224, 12, 14, false, p.lit));
  items.push(window('h2w1', 437, 202, 12, 14, false, p.lit));
  items.push(window('h2w2', 453, 202, 12, 14, true, p.lit));
  items.push(window('h2w3', 437, 226, 12, 14, true, p.lit));
  items.push(window('h2w4', 453, 226, 12, 14, true, p.lit));
  items.push(window('h3w1', 486, 228, 14, 14, true, p.lit));
  items.push(window('h3w2', 514, 228, 14, 14, false, p.lit));
  items.push(window('h4w1', 550, 214, 12, 14, true, p.lit));
  items.push(window('h4w2', 572, 214, 12, 14, true, p.lit));
  items.push(window('h4w3', 550, 238, 12, 14, false, p.lit));

  // On the water.
  items.push({ id: 'buoy2', kind: 'buoy', z: 40, x: 342, y: 300, color: '#3f9f6a', stripe: '#f2efe6' });
  items.push({ id: 'sail1', kind: 'sailboat', z: 42, x: 215, y: 318, len: 92, hull: '#b8483e', flag: '#ffd34d', sailStripe: true, ph: 0 });
  items.push({ id: 'buoy1', kind: 'buoy', z: 44, x: 168, y: 356, color: '#d8463f', stripe: '#f2efe6' });
  items.push({ id: 'row1', kind: 'rowboat', z: 46, x: 118, y: 412, len: 58, hull: '#3f7a5a', oars: 2, ph: 1.7 });
  items.push({ id: 'tug1', kind: 'trawler', z: 48, x: 250, y: 434, len: 104, hull: '#2f5f8a', portholes: 4, ph: 3.1 });

  // The pier, with its lamp, the cat and the cargo.
  items.push({ id: 'pier', kind: 'pier', z: 50, x0: 300, x1: 600, y: 372 });
  items.push({ id: 'rope1', kind: 'rope', z: 51, x0: 296, y0: 419, x1: 318, y1: 386 });
  items.push({ id: 'post', kind: 'post', z: 52, x: 310, top: 322, y: 372 });
  items.push({ id: 'bunting', kind: 'bunting', z: 53, x0: 310, y0: 322, x1: 566, y1: 312, sag: 12, colors: ['#e0565b', '#f2c14e', '#5fb7d4', '#e0565b', '#f2c14e', '#5fb7d4', '#e0565b', '#f2c14e', '#5fb7d4'] });
  items.push({ id: 'gull', kind: 'gull', z: 54, x: 310, y: 322, flip: false });
  items.push({ id: 'lamp', kind: 'lamp', z: 55, x: 568, y: 372, lit: true, ring: '#ff7a3d' });
  items.push({ id: 'cat', kind: 'cat', z: 56, x: 405, y: 372, tail: 'right', eyes: 'open', collar: '#e04848' });
  items.push({ id: 'crates', kind: 'crates', z: 56, x: 498, y: 372, n: 3 });
  items.push({ id: 'barrel', kind: 'barrel', z: 56, x: 550, y: 372 });

  for (const e of level.extras ?? []) items.push({ ...e });
  if (level.fog) {
    items.push({ id: 'fog1', kind: 'fog', z: 60, y: 240, h: 46, a: 0.34, speed: 6 });
    items.push({ id: 'fog2', kind: 'fog', z: 60, y: 336, h: 54, a: 0.24, speed: -4 });
  }
  return items.sort((a, b) => a.z - b.z);
}

function seaLines(rand) {
  const lines = [];
  for (let i = 0; i < 46; i++) {
    const y = HORIZON + 6 + Math.pow(rand(), 1.3) * 200;
    lines.push({ x: rand() * 600, y, w: 8 + rand() * 26 * (y / 300), ph: rand() * 6.28 });
  }
  return lines;
}

/** The right panel's items: the left's with every difference applied. */
export function applyDifferences(items, diffs) {
  let out = items.map((it) => ({ ...it }));
  for (const d of diffs) {
    const c = d.change;
    if (c.op === 'remove') out = out.filter((it) => it.id !== c.target);
    else if (c.op === 'add') out.push({ ...c.item });
    else if (c.op === 'set' || c.op === 'move') {
      const it = out.find((i) => i.id === c.target);
      if (!it) throw new Error(`difference ${d.id}: no item ${c.target}`);
      Object.assign(it, c.op === 'set' ? c.props : c.to);
    }
  }
  return out.sort((a, b) => a.z - b.z);
}

/** Both pictures of a level, ready to draw. */
export function levelPictures(level) {
  const left = buildScene(level);
  return { left, right: applyDifferences(left, level.diffs) };
}
