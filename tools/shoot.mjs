// Captures the screenshots listed in shots.json from the game served by serve.ts (start it first:
// node serve.ts), with one headless Chrome driven over the DevTools protocol at 1280 x 800.
// A name ending .jpg is written as JPEG (the scorer caps each screenshot at 256 KiB), .png as PNG.
//   node tools/shoot.mjs [outDir] [extra query, e.g. &debug=1] [only these names...]
// CHROME names the browser when it is not at the usual Windows path.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const chromePath = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [outDir = 'screenshots', extra = '', ...only] = process.argv.slice(2);
const shots = JSON.parse(readFileSync('shots.json', 'utf8')).filter((s) => !only.length || only.includes(s.name));
mkdirSync(outDir, { recursive: true });

const port = 9333;
const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${port}`,
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'harbor-shots-'))}`, '--window-size=1280,800', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let pages;
for (let i = 0; i < 50 && !pages; i++) {
  await sleep(200);
  pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json()).catch(() => null);
}
const ws = new WebSocket(pages.find((p) => p.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let nextId = 1;
const waiting = new Map();
const events = [];
ws.addEventListener('message', (m) => {
  const msg = JSON.parse(m.data);
  if (msg.id && waiting.has(msg.id)) waiting.get(msg.id)(msg);
  else if (msg.method) events.push(msg.method);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = nextId++;
  waiting.set(id, (msg) => (msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)));
  ws.send(JSON.stringify({ id, method, params }));
});

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
for (const { name, query } of shots) {
  events.length = 0;
  await send('Page.navigate', { url: `http://localhost:8080/${query}${extra}` });
  for (let i = 0; i < 50 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
  await sleep(700);
  const jpeg = /\.jpe?g$/i.test(name);
  const { data } = await send('Page.captureScreenshot', jpeg ? { format: 'jpeg', quality: 92 } : { format: 'png' });
  const bytes = Buffer.from(data, 'base64');
  writeFileSync(join(outDir, name), bytes);
  console.log(`${name}  ${bytes.length} bytes${bytes.length > 262144 ? '  OVER 256 KiB' : ''}`);
}
ws.close();
chrome.kill();
process.exit(0);
