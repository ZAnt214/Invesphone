// Treino de conversões no cockpit (844×390): menu, passo a passo, olhar o retrovisor, seta pela
// alavanca, conversão completa, relatório com replay, instrutor demonstrando e cidade livre.
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
async function waitFor(fn, ms = 6000) { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(60); } return false; }
const hud = () => S(() => document.querySelector('[data-testid=hud]')?.innerText ?? '');
const click = (sel) => page.locator(sel).first().dispatchEvent('click');

await page.goto('file://' + resolve('dist/test.html'));
await S(() => { localStorage.clear(); window.__sim.enterCar(); });
await page.waitForSelector('[data-testid=cockpit]');
await sleep(300);
const K = (await box('[data-testid=scene]')).height / 420;

// 1) menu
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-turns]');
check('menu abre o treino de conversões com 4 percursos', (await page.locator('[data-testid=turn-menu] .tm-c').count()) === 4);
const mb = await box('[data-testid=turn-menu]');
check('menu do treino cabe na tela', mb.y >= 0 && mb.y + mb.height <= 390, `${Math.round(mb.height)} px`);
await tap('[data-testid=turn-start]');
check('começa na cidade, andando em 2ª', await S(() => window.__sim.city.active && window.__sim.car.gear === '2' && window.__sim.car.kmh > 20));
check('instrução: próxima esquina à direita', /vire à direita/.test(await hud()), await hud());
await page.screenshot({ path: `${SHOTS}/c1-cidade.png` });

// 2) passo a passo: retrovisor → seta
await S(() => { const s = window.__sim; s.pedals.throttle = 0; });
check('pede para olhar o retrovisor', await waitFor(async () => /retrovisor direito/.test(await hud()), 12000), await hud());
await tap('[data-testid=mirror-R]');
check('tocar no retrovisor = olhar (ele aparece grande)', (await page.locator('[data-testid=glance]').count()) === 1);
check('olhar não abre o ajuste da porta', (await page.locator('[data-testid=zoom]').count()) === 0);
check('depois pede a seta', /seta para a direita/.test(await hud()), await hud());
{
  const [x, y] = await center('[data-testid=stalk-L-hit]');
  await down(11, x, y);
  for (let i = 1; i <= 12; i++) { await move(11, x, y - (2.1 * 16 * K * i) / 12); await sleep(16); }
  await up(11); await sleep(150);
}
check('alavanca para cima liga a seta da direita', await S(() => window.__sim.veh.turn === 1 && window.__sim.veh.turnLatched));

// 3) o "aluno" dirige: freia para ~15 km/h, encosta e vira seguindo a trajetória
await S(() => {
  const s = window.__sim, C = window.__city;
  window.__drv = setInterval(() => {
    const r = s.runner; if (!r || r.done) return;
    const kmh = Math.abs(s.car.kmh);
    const p = C.pursuit(s.city.pose, r.current.path, Math.max(3.2, (kmh / 3.6) * 0.9));
    s.steerDrag = true;
    s.steer += Math.max(-6, Math.min(6, p.steer - s.steer));
    const [, lz] = C.toLocal(r.maneuver, s.city.pose.x, s.city.pose.z);
    const vt = lz > -30 ? 14 : 22;
    s.pedals.brake = kmh > vt + 1.5 ? 0.3 : 0;
    s.pedals.throttle = kmh < vt - 1 ? 0.25 : 0.06;
  }, 16);
});
check('perto da esquina aparece o alvo do volante', await waitFor(() => S(() => getComputedStyle(document.querySelector('[data-testid=steer-guide]')).opacity === '1'), 20000));
check('avisa a hora de virar', await waitFor(async () => /VIRE AGORA|Segure o volante/.test(await hud()), 15000), await hud());
await page.screenshot({ path: `${SHOTS}/c2-virando.png` });
check('relatório aparece no fim', await waitFor(() => S(() => !!document.querySelector('[data-testid=turn-report]')), 25000));
await S(() => { clearInterval(window.__drv); window.__sim.steerDrag = false; });
await sleep(400);
const items = await S(() => [...document.querySelectorAll('[data-testid=turn-items] li')].map((l) => `${l.className}:${l.innerText.replace(/\s+/g, ' ')}`));
check('avaliação: olhou o retrovisor e ligou a seta com antecedência', items.some((t) => /good.*Retrovisor/.test(t)) && items.some((t) => /good.*Seta.*antes/.test(t)), items.join(' | '));
check('avaliação: trajetória limpa e terminou na faixa', items.some((t) => /good.*Trajetória/.test(t)) && items.some((t) => /good.*Faixa no fim/.test(t)));
const rb = await box('[data-testid=turn-report] .zoom-panel');
check('relatório cabe inteiro na tela', rb.y >= 0 && rb.y + rb.height <= 390 && rb.x >= 0 && rb.x + rb.width <= 844, `${Math.round(rb.width)}×${Math.round(rb.height)}`);
const drawn = await S(() => { const c = document.querySelector('[data-testid=turn-map]'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 1] > 150 && d[i] < 120) n++; return n; });
check('replay de cima desenha a trajetória', drawn > 50, `${drawn} px verdes`);
await page.screenshot({ path: `${SHOTS}/c3-relatorio.png` });
await sleep(800);
await tap('[data-testid=turn-again]');
check('Repetir recomeça a conversão', await S(() => window.__sim.runner?.kind === 'turn' && !window.__sim.runner.done && window.__sim.city.pose.z < -60));

// 4) parar pelo menu; instrutor demonstra a esquerda
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-turns]');
check('menu durante o treino: "Parar" encerra', await S(() => !window.__sim.runner && !window.__sim.city.active));
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-turns]');
await tap('[data-testid=turn-left]');
await tap('[data-testid=turn-demo]');
check('instrutor narra o que está fazendo', /Instrutor:/.test(await hud()), await hud());
check('instrutor olha o retrovisor esquerdo', await waitFor(() => S(() => window.__sim.mirrorGlance?.id === 'L'), 15000));
check('instrutor termina a esquerda sem erros', await waitFor(async () => /tudo certo/.test(await S(() => document.querySelector('[data-testid=turn-report]')?.innerText ?? '')), 40000));
await page.screenshot({ path: `${SHOTS}/c4-instrutor.png` });
await sleep(800);
await S(() => [...document.querySelectorAll('[data-testid=turn-report] .btn')].find((b) => b.textContent === 'Fechar').click());
await sleep(200);
check('fechar volta para a estrada', await S(() => !window.__sim.city.active && !window.__sim.runner));

// 5) cidade livre
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-turns]');
await tap('[data-testid=turn-free]');
check('dirigir livre na cidade', await S(() => window.__sim.city.active && window.__sim.cityFree && !window.__sim.runner));
await tap('[data-testid=mirror-L]');
check('na cidade, tocar no retrovisor é olhar', (await page.locator('[data-testid=glance]').count()) === 1);

check('nenhum erro de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((x) => !x.ok);
console.log(`\nturns: ${results.length - failed.length}/${results.length} verificações aprovadas`);
process.exit(failed.length ? 1 : 0);
