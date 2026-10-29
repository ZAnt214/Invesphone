// Retrovisores no cockpit (iPhone deitado, 844×390): reflexo desenhado, comando elétrico na
// porta (seletor E/D + setas), interno ajustado com o dedo, dia/noite, treino e aviso ao sair.
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const SHOTS = process.env.SHOTS || '/tmp';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await context.newCDPSession(page);
const active = new Map();
const pts = () => [...active.entries()].map(([id, p]) => ({ x: p.x, y: p.y, id }));
async function down(id, x, y) { active.set(id, { x, y }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pts() }); }
async function move(id, x, y) { active.set(id, { x, y }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pts() }); }
async function up(id) { const p = active.get(id); if (!p) return; active.delete(id); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: p.x, y: p.y, id }] }); }
const S = (f, a) => page.evaluate(f, a);
async function box(sel) { const b = await page.locator(sel).first().boundingBox(); if (!b) throw new Error('sem elemento ' + sel); return b; }
async function center(sel) { const b = await box(sel); return [b.x + b.width / 2, b.y + b.height / 2]; }
async function tap(sel, hold = 50) { const [x, y] = await center(sel); await down(9, x, y); await sleep(hold); await up(9); await sleep(120); }
async function waitFor(fn, ms = 4000) { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(50); } return false; }
const hud = () => S(() => document.querySelector('[data-testid=hud]')?.innerText ?? '');
const aim = (id) => S((id) => ({ ...window.__sim.mirrors.aim[id] }), id);
const ok = (id) => S((id) => window.__sim.mirrors.status(id).ok, id);

await page.goto('file://' + resolve('dist/test.html'));
await S(() => { localStorage.clear(); window.__sim.enterCar(); });
await page.waitForSelector('[data-testid=cockpit]');
await sleep(400);

// 1) os três espelhos estão na cena, dentro da tela, e mostram imagem
for (const id of ['L', 'R', 'I']) {
  const b = await box(`[data-testid=mirror-${id}]`);
  const inside = b.x >= 0 && b.y >= 0 && b.x + b.width <= 844 && b.y + b.height <= 390;
  const lit = await S((id) => {
    const c = document.querySelector(`[data-testid=mirror-${id}] canvas`);
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++;
    return n / (c.width * c.height);
  }, id);
  check(`retrovisor ${id} na tela e com reflexo desenhado`, inside && lit > 0.5, `${Math.round(b.width)}×${Math.round(b.height)} px, ${Math.round(lit * 100)}% preenchido`);
}
check('começa bem ajustado nos três', (await ok('L')) && (await ok('R')) && (await ok('I')));
const hb = await box('[data-testid=hud]').catch(() => null);
const ib = await box('[data-testid=mirror-I]');
check('mensagens não cobrem o retrovisor interno', !hb || hb.y >= ib.y + ib.height - 1);

// 2) tocar no espelho externo abre o comando da porta
await tap('[data-testid=mirror-L]');
check('tocar no retrovisor esquerdo abre o comando elétrico da porta', (await page.locator('[data-testid=zoom-panel-door] [data-testid=mirror-sel]').count()) === 1);
const zb = await box('[data-testid=zoom-panel-door]');
check('painel da porta cabe inteiro na tela', zb.y >= 0 && zb.y + zb.height <= 390 && zb.x >= 0 && zb.x + zb.width <= 844, `${Math.round(zb.width)}×${Math.round(zb.height)}`);

// sem chave: elétrico não funciona
let a0 = await aim('L');
await tap('[data-testid=mirror-sel-L]');
await tap('[data-testid=mirror-left]', 600);
check('sem a chave (LOCK) o motor do retrovisor não gira', (await aim('L')).yaw === a0.yaw);
check('avisa que precisa de ACC/ON', /ACC|ON/.test(await hud()) || /ACC/.test(await S(() => document.querySelector('[data-testid=mirror-hint]').innerText)));

await S(() => window.__sim.setKey('ACC'));
await sleep(100);
// segura ◀ no esquerdo: gira para fora, a lateral do carro some
await tap('[data-testid=mirror-left]', 900);
const a1 = await aim('L');
check('segurando ◀ com E selecionado, o esquerdo gira para fora', a1.yaw < a0.yaw - 0.05, `${a0.yaw.toFixed(3)} → ${a1.yaw.toFixed(3)}`);
await sleep(300);
check('soltou, o motor para', (await aim('L')).yaw === a1.yaw);
check('o direito não mexeu', JSON.stringify(await aim('R')) === JSON.stringify(await S(() => ({ ...window.__sim.mirrors.aim.R }))));
const hint = await S(() => document.querySelector('[data-testid=mirror-hint]').innerText);
check('dica explica o que corrigir', !(await ok('L')) && /para dentro|▶/.test(hint), hint);
// seguindo a dica até ficar certo
for (let i = 0; i < 12 && !(await ok('L')); i++) await tap('[data-testid=mirror-right]', 250);
check('seguindo a dica, o esquerdo volta a ficar certo', await ok('L'), await S(() => document.querySelector('[data-testid=mirror-hint]').innerText));
// direito: seletor D e ▼
await tap('[data-testid=mirror-sel-R]');
const r0 = await aim('R');
await tap('[data-testid=mirror-down]', 500);
check('seletor em D e ▼ abaixa o direito', (await aim('R')).pitch < r0.pitch - 0.02);
await page.screenshot({ path: `${SHOTS}/m1-porta.png` });
await S(() => { const z = document.querySelector('[data-testid=zoom]'); z && z.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await sleep(200);
check('fecha o painel da porta', (await page.locator('[data-testid=zoom]').count()) === 0);

// 3) interno: arrastar com o dedo
const i0 = await aim('I');
{
  const [x, y] = await center('[data-testid=mirror-I]');
  await down(5, x, y);
  for (let k = 1; k <= 10; k++) { await move(5, x + 4 * k, y); await sleep(16); }
  await up(5); await sleep(120);
}
const i1 = await aim('I');
check('arrastar o interno para a direita gira o reflexo junto com o dedo', i1.yaw < i0.yaw - 0.03, `${i0.yaw.toFixed(3)} → ${i1.yaw.toFixed(3)}`);
check('arrastar não abre painel', (await page.locator('[data-testid=zoom]').count()) === 0);
check('interno desajustado é detectado', !(await ok('I')));
await tap('[data-testid=mirror-tab]');
check('alavanca dia/noite do interno', await S(() => window.__sim.mirrors.nightTab));
await tap('[data-testid=mirror-tab]');
await tap('[data-testid=mirror-I]');
check('tocar no interno abre ele grande', (await page.locator('[data-testid=mirror-big]').count()) === 1);
{
  const b = await box('[data-testid=mirror-big]');
  for (let i = 0; i < 6 && !(await ok('I')); i++) {
    const [u, v] = await S(() => { const { rearGlassCenter } = window.__mirrorsGeo; return rearGlassCenter(window.__sim.mirrors.aim.I); });
    const x = b.x + b.width / 2, y = b.y + b.height / 2;
    await down(6, x, y);
    await move(6, x - (u - 0.5) * b.width * 0.5, y - (v - 0.5) * b.height * 0.5); await sleep(20);
    await move(6, x - (u - 0.5) * b.width, y - (v - 0.5) * b.height); await sleep(20);
    await up(6); await sleep(100);
  }
}
check('no espelho grande, arrastando, o vidro traseiro volta ao centro', await ok('I'));
await page.screenshot({ path: `${SHOTS}/m2-interno.png` });
await S(() => { const z = document.querySelector('[data-testid=zoom]'); z.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
await sleep(150);

// 4) treino pelo menu
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-mirrors]');
check('treino desajusta os três', !(await ok('L')) && !(await ok('R')) && !(await ok('I')));
check('mostra o andamento do treino', /Ajuste os retrovisores/.test(await hud()), await hud());
await S(() => { const m = window.__sim.mirrors, g = window.__mirrorsGeo.goodAim; m.aim.L = g('L'); m.aim.R = g('R'); m.aim.I = g('I'); });
check('ajustando os três, o treino termina com o tempo', await waitFor(async () => /ajustados em/.test(await hud())), await hud());

// 5) aviso ao sair desajustado
await S(() => { const m = window.__sim.mirrors; m.aim.I.yaw = 0.3; window.__sim.setKey('LOCK'); window.__sim.setKey('ON'); window.__sim.car.v = 3; });
check('sair com retrovisor desajustado gera aviso', await waitFor(async () => /Retrovisor desajustado: interno/.test(await hud())), await hud());

// 6) repetidor da seta na carcaça
await S(() => { const s = window.__sim; s.car.v = 0; s.veh.toggleHazard(); });
await page.screenshot({ path: `${SHOTS}/m3-cena.png` });
check('nenhum erro de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((x) => !x.ok);
console.log(`\nmirrors: ${results.length - failed.length}/${results.length} verificações aprovadas`);
process.exit(failed.length ? 1 : 0);
