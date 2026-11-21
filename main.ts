// Hands in Moonlit Harbor - Spot the Difference (Node 22, standard library only). The game is
// game/: index.html and its ES modules under game/src, drawn entirely in canvas 2D with no assets,
// no library and no network request. This program copies game/ and screenshots/ (the first by
// name is the cover) to the output directory and writes dossier.json there with the vendored
// make.fun library. The output directory is /output in the grader; elsewhere set
// MAKEFUN_OUTPUT_DIR, e.g. `MAKEFUN_OUTPUT_DIR=out node main.ts`. Play it locally: `node serve.ts`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
const shots = join(root, 'screenshots');
if (existsSync(shots)) cpSync(shots, join(outDir, 'screenshots'), { recursive: true });

// The scorer's caps from its gate.json: text_max_bytes shapes the dossier's text; the others make
// this program refuse what the scorer would refuse (at most 4 screenshots of 256 KiB each, at most
// 993 entries and 48 MiB under game/, no path under game/ longer than 1000 bytes).
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
