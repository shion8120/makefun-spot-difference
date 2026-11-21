// Checks every level's data: exactly 10 differences, unique ids, each one changes the right
// picture (its target exists and the change is real), and each sits inside the panel.
import { LEVELS, SCENE_H, SCENE_W, buildScene, applyDifferences } from '../game/src/scenes.js';

let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };
for (const L of LEVELS) {
  if (L.diffs.length !== 10) fail(`level ${L.number}: ${L.diffs.length} differences`);
  const ids = new Set(L.diffs.map((d) => d.id));
  if (ids.size !== L.diffs.length) fail(`level ${L.number}: duplicate ids`);
  const left = buildScene(L);
  for (const d of L.diffs) {
    const right = applyDifferences(left, [d]);
    if (JSON.stringify(right) === JSON.stringify(left)) fail(`${d.id}: changes nothing`);
    if (d.x - d.r < 0 || d.x + d.r > SCENE_W || d.y - d.r < 0 || d.y + d.r > SCENE_H) fail(`${d.id}: leaves the panel`);
  }
  for (const a of L.diffs) for (const b of L.diffs) {
    if (a.id < b.id && Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 6) fail(`${a.id} and ${b.id} overlap`);
  }
  applyDifferences(left, L.diffs);
  console.log(`level ${L.number} ${L.name}: ${L.diffs.length} differences, ${left.length} items`);
}
process.exit(bad ? 1 : 0);
