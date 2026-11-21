// Plays the real game in headless Chrome with mouse and keyboard events (served by serve.ts) and
// prints the screen-reader status line after each step, so the rules can be checked end to end:
//   node tools/playtest.mjs [screenshot.jpg]
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LEVELS } from '../game/src/scenes.js';
import { PANELS, BUTTONS } from '../game/src/layout.js';

const chromePath = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9334;
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--mute-audio', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'harbor-play-'))}`, '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pages;
for (let i = 0; i < 50 && !pages; i++) { await sleep(200); pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).catch(() => null); }
const ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const waiting = new Map();
ws.addEventListener('message', (m) => { const msg = JSON.parse(m.data); if (msg.id) waiting.get(msg.id)?.(msg.result); });
const send = (method, params = {}) => new Promise((r) => { const id = nextId++; waiting.set(id, r); ws.send(JSON.stringify({ id, method, params })); });

await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:8080/' });
await sleep(1200);
const status = async () => (await send('Runtime.evaluate', { expression: "document.getElementById('status').textContent" })).result.value;
const click = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
  await sleep(150);
};
const press = async (key) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, text: key.length === 1 ? key : undefined });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key });
  await sleep(150);
};
const step = async (label, fn) => { await fn(); console.log(`${label.padEnd(28)} -> ${await status()}`); };
const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];

const L1 = LEVELS[0];
await step('click Start', () => click(...center(BUTTONS.start)));
await step('click to begin', () => click(640, 400));
await step('miss on left panel', () => click(PANELS[0].x + 300, PANELS[0].y + 100));
const cat = L1.diffs.find((d) => d.id === 'L1-cat');
await step('find cat on right panel', () => click(PANELS[1].x + cat.x, PANELS[1].y + cat.y));
await step('click the cat again', () => click(PANELS[0].x + cat.x, PANELS[0].y + cat.y));
await step('press H', () => press('h'));
await step('press P', () => press('p'));
await step('press P', () => press('p'));
for (const d of L1.diffs) if (d.id !== 'L1-cat') await click(PANELS[d.x % 2].x + d.x, PANELS[d.x % 2].y + d.y);
await step('found the other nine', () => sleep(100));
await step('wait for results', () => sleep(2000));
await step('click Next harbor', () => click(...center(BUTTONS.next)));
const shot = process.argv[2];
await step('press Enter', () => press('Enter'));
if (shot) writeFileSync(shot, Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: 85 })).data, 'base64'));
ws.close();
chrome.kill();
process.exit(0);
