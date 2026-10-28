// Modo foto do cockpit: serve a página e um pacote de arte de teste (mesmo contrato do
// pedido ao ChatGPT) por HTTP, como no site, e confere encaixe e comandos.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';

const SHOTS = process.env.SHOTS || '/tmp';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const artDir = process.env.ART_DIR || mkdtempSync(join(tmpdir(), 'cambio-art-'));
if (!process.env.ART_DIR) execFileSync('python3', [resolve('e2e/make-test-art.py'), artDir], { stdio: 'inherit' });
const page = readFileSync(resolve('dist/test.html'));
let serveArt = true;
const srv = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/cambio' || url === '/cambio/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(page); return; }
  if (url.startsWith('/cambio/art/') && serveArt) {
    const f = join(artDir, url.slice('/cambio/art/'.length));
    if (existsSync(f)) { res.writeHead(200, { 'content-type': f.endsWith('.json') ? 'application/json' : 'image/png' }); res.end(readFileSync(f)); return; }
  }
  res.writeHead(404); res.end();
});
await new Promise((r) => srv.listen(0, r));
const base = `http://127.0.0.1:${srv.address().port}`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const pg = await context.newPage();
const errors = [];
await pg.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
pg.on('pageerror', (e) => errors.push(String(e)));
const cdp = await context.newCDPSession(pg);
const active = new Map();
const pts = () => [...active.entries()].map(([id, p]) => ({ x: p.x, y: p.y, id }));
async function down(id, x, y) { active.set(id, { x, y }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts() }); }
async function move(id, x, y) { active.set(id, { x, y }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts() }); }
async function up(id) { const p = active.get(id); active.delete(id); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: p.x, y: p.y, id }] }); }
const S = (f, a) => pg.evaluate(f, a);
async function center(sel) { const b = await pg.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; }
async function tap(sel) { const [x, y] = await center(sel); await down(9, x, y); await sleep(50); await up(9); await sleep(100); }

await pg.goto(base + '/cambio');
await pg.locator('[data-testid=enter]').scrollIntoViewIfNeeded();
await tap('[data-testid=enter]');
await pg.waitForSelector('[data-testid=cockpit]');
const ok = await pg.waitForSelector('[data-testid=art-base]', { timeout: 5000 }).then(() => true, () => false);
check('pacote de arte carrega e liga o modo foto', ok);
const imgs = await S(() => [...document.querySelectorAll('[data-art]')].map((e) => e.getAttribute('data-art')));
check('camadas na cena: painel, volante, alavancas, chave, botões, manopla, alerta, freio de mão', ['base', 'wheel', 'stalkL', 'stalkR', 'key', 'knob', 'gearKnob', 'hazard', 'handbrake'].every((k) => imgs.includes(k)), [...new Set(imgs)].join(','));
const vec = await S(() => document.querySelectorAll('.scene-svg .key3d').length);
check('peças desenhadas somem onde há foto (sem duplicar)', vec === 0, `${vec} teclas vetoriais`);
const K = (await pg.locator('[data-testid=scene]').boundingBox()).height / 420;
const wb = await pg.locator('[data-testid=art-wheel]').boundingBox();
check('volante da arte centrado no eixo do volante', Math.abs(wb.width - 400 * K) < 2, `${Math.round(wb.width)} px`);
const pedalBg = await S(() => getComputedStyle(document.querySelector('.ck-pedal.gas .pad')).backgroundImage);
check('pedais usam a imagem da arte', /pedal-acelerador\.png/.test(pedalBg));

// comandos por cima da foto
await S(() => { const s = window.__sim; s.setKey('ON'); });
await tap('[data-testid=hazard]');
check('pisca-alerta funciona no modo foto', await S(() => window.__sim.veh.hazard));
await sleep(500);
const hzSrc = await S(() => [...document.querySelectorAll('[data-art=hazard]')].map((e) => e.getAttribute('href')).join());
await tap('[data-testid=hazard]');
check('pisca-alerta troca para a imagem acesa quando pisca', /ligado/.test(hzSrc) || /desligado/.test(hzSrc), hzSrc);
{
  const [x, y] = await center('[data-testid=stalk-L-hit]');
  await down(11, x, y);
  for (let i = 1; i <= 12; i++) { await move(11, x, y - (2.1 * 16 * K * i) / 12); await sleep(16); }
  await up(11); await sleep(150);
  const tr = await S(() => document.querySelector('[data-testid=art-stalk-L]').parentElement.getAttribute('transform'));
  check('alavanca da arte gira com o arraste e trava a seta', await S(() => window.__sim.veh.turnLatched) && /rotate\(8\.4/.test(tr), tr);
}
{
  const wc = await S(() => { const g = document.querySelector('[data-testid=wheel-grip]').getBoundingClientRect(); return [g.left + g.width / 2, g.top + g.height / 2]; });
  const R = 172 * K;
  const pt = (a) => [wc[0] + R * Math.cos((a * Math.PI) / 180), wc[1] + R * Math.sin((a * Math.PI) / 180)];
  await down(15, ...pt(-90));
  for (let a = -90; a <= -30; a += 5) { await move(15, ...pt(a)); await sleep(12); }
  await up(15); await sleep(80);
  const tr = await S(() => document.querySelector('[data-testid=art-wheel]').parentElement.getAttribute('transform'));
  check('volante da arte gira com o dedo', /rotate\((5[0-9]|6[0-9])/.test(tr), tr);
}
{
  await S(() => { window.__sim.pedals.clutch = 1; });
  const [sx, sy] = await center('[data-testid=gear-hit]');
  await down(2, sx, sy);
  for (let i = 1; i <= 10; i++) { await move(2, sx, sy - (1.15 * 32 * K * i) / 10); await sleep(16); }
  await up(2); await sleep(150);
  check('câmbio engata a 3ª com a manopla da arte', (await S(() => window.__sim.shifter.gear)) === '3');
  await S(() => { window.__sim.pedals.clutch = 0; });
}
await pg.screenshot({ path: `${SHOTS}/90-modo-foto.png` });

// sem pacote: continua no desenho vetorial
serveArt = false;
const pg2 = await context.newPage();
await pg2.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await pg2.goto(base + '/cambio');
await pg2.evaluate(() => window.__sim.enterCar());
await pg2.waitForSelector('[data-testid=cockpit]');
await sleep(800);
check('sem pacote de arte, o cockpit fica no desenho vetorial', (await pg2.locator('[data-art]').count()) === 0 && (await pg2.locator('.scene-svg .key3d').count()) > 0);

check('nenhum erro de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
srv.close();
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações aprovadas`);
process.exit(failed.length ? 1 : 0);
