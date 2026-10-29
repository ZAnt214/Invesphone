// Cockpit horizontal (iPhone deitado, 844×390): toques reais em cada comando,
// dirigindo com embreagem + câmbio + acelerador ao mesmo tempo.
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const SHOTS = process.env.SHOTS || '/tmp';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
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
async function tap(sel, hold = 50, id = 9) { const [x, y] = await center(sel); await down(id, x, y); await sleep(hold); await up(id); await sleep(90); }
async function waitFor(fn, ms = 6000) { const t = Date.now(); while (Date.now() - t < ms) { if (await fn()) return true; await sleep(50); } return false; }
const lit = (id) => S((id) => !!document.querySelector(`[data-testid=cluster-scene] [data-lamp="${id}"]`)?.classList.contains('lit'), id);
const veh = (k) => S((k) => window.__sim.veh[k], k);
const car = () => S(() => { const c = window.__sim.car; return { kmh: c.kmh, rpm: c.rpm, on: c.engineOn, gear: c.gear }; });
const hud = () => S(() => document.querySelector('[data-testid=hud]')?.innerText ?? '');
let K = 1; // px por unidade da cena
async function scale() { K = (await box('[data-testid=scene]')).height / 420; }

// pedais
const PID = { clutch: 1, throttle: 3, brake: 4 };
const PSEL = { clutch: '.ck-pedal.clutch .pedal', brake: '.ck-pedal.brake .pedal', throttle: '.ck-pedal.gas .pedal' };
async function pedal(k, v) {
  const b = await box(PSEL[k]);
  const x = b.x + b.width / 2, y = b.y + b.height * (0.1 + v * 0.78);
  if (active.has(PID[k])) await move(PID[k], x, y); else await down(PID[k], x, y);
}
async function release(k) { await up(PID[k]); }
async function ramp(k, a, b, ms) { const n = Math.max(4, Math.round(ms / 40)); for (let i = 0; i <= n; i++) { await pedal(k, a + ((b - a) * i) / n); await sleep(ms / n); } }

// câmbio no console: arraste relativo, 40 × 46 unidades por posição
async function shift(target, hold = false) {
  await waitFor(() => S(() => { const s = window.__sim.shifter; return s.engaged !== 'N' ? Math.abs(Math.abs(s.y) - 1) < 0.01 : s.y === 0 && s.x === 0; }), 1500);
  const [sx, sy] = await center('[data-testid=gear-hit]');
  const st = await S(() => ({ x: window.__sim.shifter.x, y: window.__sim.shifter.y }));
  const R = { N: [[0, 0]], '1': [[-1, 0], [-1, -1.15]], '2': [[-1, 0], [-1, 1.15]], '3': [[0, -1.15]], '4': [[0, 1.15]], '5': [[1, 0], [1, -1.15]], R: [[1, 0], [1, 1.15]] };
  await down(2, sx, sy);
  if (hold || target === 'R') await sleep(520);
  let cur = [sx, sy];
  const path = st.y !== 0 ? [[st.x, 0], ...R[target]] : R[target];
  for (const p of path) {
    const nx = sx + (p[0] - st.x) * 34 * K, ny = sy + (p[1] - st.y) * 32 * K;
    for (let i = 1; i <= 10; i++) { await move(2, cur[0] + ((nx - cur[0]) * i) / 10, cur[1] + ((ny - cur[1]) * i) / 10); await sleep(16); }
    cur = [nx, ny];
  }
  await up(2); await sleep(100);
  return S(() => window.__sim.shifter.gear);
}
// alavanca de comando: arraste vertical em degraus de 16 unidades
async function stalk(side, steps) {
  const [x, y] = await center(`[data-testid=stalk-${side}-hit]`);
  await down(11, x, y);
  for (let i = 1; i <= 12; i++) { await move(11, x, y - ((steps + Math.sign(steps) * 0.1) * 16 * K * i) / 12); await sleep(16); }
  await sleep(50); await up(11); await sleep(120);
}
// giro em arco
async function twist(sel, fromDeg, toDeg, rUnits) {
  const [cx, cy] = await center(sel);
  const r = rUnits * K;
  const pt = (a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  let [x, y] = pt(fromDeg);
  await down(12, x, y);
  const step = toDeg > fromDeg ? 4 : -4;
  for (let a = fromDeg; step > 0 ? a <= toDeg : a >= toDeg; a += step) { [x, y] = pt(a); await move(12, x, y); await sleep(12); }
  await up(12); await sleep(100);
}
async function zoomTap(z, sel) {
  await tap(`[data-testid=zoom-${z}]`);
  await page.waitForSelector(`[data-testid=zoom-panel-${z}]`, { timeout: 2000 });
  if (sel) await tap(sel);
}
async function closeZoom() { if (await page.locator('[data-testid=zoom]').count()) { await down(14, 6, 6); await sleep(30); await up(14); await sleep(80); } }

// =====================================================================
await page.goto('file://' + resolve('dist/test.html'));
await page.locator('[data-testid=enter]').scrollIntoViewIfNeeded();
await tap('[data-testid=enter]');
await page.waitForSelector('[data-testid=cockpit]');
await sleep(300);
await scale();
check('na horizontal o app abre direto no cockpit em tela cheia', (await page.locator('.tabs').count()) === 0 && (await page.locator('[data-testid=coach], .coach').count()) === 0);
const sb = await box('[data-testid=scene]');
check('cena ocupa a tela inteira (sem faixas)', sb.width >= 843 && sb.height >= 389 && sb.x <= 0.5 && sb.y <= 0.5, `${Math.round(sb.width)}×${Math.round(sb.height)}`);
for (const [w, h] of [[844, 330], [932, 430], [1000, 370]]) {
  await page.setViewportSize({ width: w, height: h }); await sleep(250);
  const b = await box('[data-testid=scene]');
  const allIn = await S(() => ['[data-testid=hazard]', '[data-testid=gear-hit]', '[data-testid=key-knob]', '.ck-pedal.gas .pedal', '.ck-pedal.clutch .pedal', '[data-testid=menu-open]'].every((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1; }));
  check(`tela ${w}×${h}: cena preenche tudo e os comandos ficam visíveis`, b.width >= w - 1 && b.height >= h - 1 && allIn, `${Math.round(b.width)}×${Math.round(b.height)}`);
}
await page.setViewportSize({ width: 844, height: 390 }); await sleep(250);
await scale();
check('sem rolagem', (await S(() => document.documentElement.scrollWidth - innerWidth)) <= 0 && (await S(() => document.documentElement.scrollHeight - innerHeight)) <= 0);
const texts = await S(() => document.querySelector('[data-testid=cockpit]').innerText.trim());
check('sem textos explicativos na tela (só legendas dos comandos)', !/Toque|Arraste|Segure|Pise/.test(texts));

// ---------- chave ----------
{
  const [cx, cy] = await center('[data-testid=key-knob]');
  const r = 18 * K;
  const pt = (a) => [cx + r * Math.sin((a * Math.PI) / 180), cy - r * Math.cos((a * Math.PI) / 180)];
  await down(13, ...pt(-60));
  for (let a = -60; a <= 25; a += 4) { await move(13, ...pt(a)); await sleep(12); }
  await up(13); await sleep(150);
  check('girar a chave com o dedo até ON liga o painel', (await veh('ignition')) === 'ON' && (await lit('battery')) && (await lit('abs')));
  await sleep(3300);
  check('após o teste de lâmpadas, ABS apaga e bateria segue acesa', !(await lit('abs')) && (await lit('battery')));
  await pedal('clutch', 1); await sleep(60);
  await down(13, ...pt(25));
  for (let a = 25; a <= 70; a += 4) { await move(13, ...pt(a)); await sleep(12); }
  await sleep(900);
  await up(13);
  await waitFor(async () => (await car()).on, 3000);
  await sleep(300);
  check('chave em START com a embreagem pisada (dois dedos) dá a partida', (await car()).on);
  check('soltar a chave volta para ON', (await veh('ignition')) === 'ON');
  await release('clutch');
  await page.screenshot({ path: `${SHOTS}/70-ligado.png` });
}

// ---------- alavanca de setas ----------
await S(() => { window.__ticks = 0; const a = window.__sim.audio; const o = a.relay.bind(a); a.relay = (on) => { if (on) window.__ticks++; o(on); }; });
await stalk('L', -1);
await sleep(2800);
check('alavanca esquerda: 1º ponto para baixo e soltar = 3 piscadas', (await S(() => window.__ticks)) === 3 && !(await veh('turnActive')), `${await S(() => window.__ticks)}`);
await stalk('L', 2);
await sleep(200);
check('alavanca até o fim para cima trava a seta direita', (await veh('turnLatched')) && (await veh('turn')) === 1);
let saw = false; for (let i = 0; i < 12; i++) { if (await lit('turnR')) saw = true; await sleep(60); }
check('seta direita pisca no quadro', saw);
await page.screenshot({ path: `${SHOTS}/71-seta.png` });
await stalk('L', -2);
check('voltar a alavanca ao centro desliga a seta', !(await veh('turnActive')));

// ---------- volante: girar com o dedo, seta desarma ao voltar ----------
{
  await stalk('L', 2);
  const [gx, gy] = await center('[data-testid=wheel-grip]');
  const sceneB = await box('[data-testid=scene]');
  const L = await S(() => 0);
  void L;
  // centro do volante: (L+270, 293) em unidades
  const lay = await S(() => { const svg = document.querySelector('[data-testid=scene]'); return svg.viewBox.baseVal.width; });
  void lay; void gx; void gy;
  const wc = await S(() => { const g = document.querySelector('[data-testid=wheel-grip]').getBoundingClientRect(); return [g.left + g.width / 2, g.top + g.height / 2]; });
  const R = 172 * K;
  const pt = (a) => [wc[0] + R * Math.cos((a * Math.PI) / 180), wc[1] + R * Math.sin((a * Math.PI) / 180)];
  await down(15, ...pt(-90));
  for (let a = -90; a <= 30; a += 6) { await move(15, ...pt(a)); await sleep(12); }
  await up(15); await sleep(80);
  const st = await S(() => window.__sim.steer);
  check('volante gira arrastando o aro (para a direita)', st > 100, `${st.toFixed(0)}°`);
  const tr = await S(() => document.querySelector('[data-testid=horn]').parentElement.getAttribute('transform'));
  check('desenho do volante gira junto', /rotate\((1[0-9]{2}|[2-9][0-9])/.test(tr), tr);
  check('seta direita continua ligada durante a curva', await veh('turnActive'));
  await down(15, ...pt(30));
  for (let a = 30; a >= -90; a -= 6) { await move(15, ...pt(a)); await sleep(12); }
  await up(15); await sleep(120);
  check('volante de volta ao centro desarma a seta sozinho', !(await veh('turnActive')), `${(await S(() => window.__sim.steer)).toFixed(0)}°`);
  await page.screenshot({ path: `${SHOTS}/77-volante.png` });
  void sceneB;
}

// ---------- luzes (close-up da alavanca) ----------
await tap('[data-testid=stalk-L-hit]');
check('tocar na alavanca sem arrastar abre o close-up', (await page.locator('[data-testid=zoom-panel-stalkL]').count()) === 1);
{
  const [hx, hy] = await center('[data-testid=lights-LOW]');
  await down(16, hx, hy); await sleep(40);
  const pressed = await S(() => document.querySelector('[data-testid=lights-LOW]').hasAttribute('data-down'));
  await up(16); await sleep(200);
  check('botão do close-up afunda ao toque (estado pressionado)', pressed);
}
await page.screenshot({ path: `${SHOTS}/72-closeup-luzes.png` });
await tap('[data-testid=lights-LOW]');
check('anel em farol baixo acende a luz no quadro', await lit('low'));
await tap('[data-testid=high]');
check('empurrar a alavanca acende o farol alto', await lit('high'));
await tap('[data-testid=high]');
await closeZoom();
check('tocar fora fecha o close-up', (await page.locator('[data-testid=zoom]').count()) === 0);

// ---------- limpadores ----------
await S(() => { window.__sim.veh.rain = 2; });
await stalk('R', -2);
check('alavanca direita dois cliques para baixo = limpador baixa', (await veh('wiper')) === 'LO');
const wp = []; for (let i = 0; i < 8; i++) { wp.push(await veh('wiperPos')); await sleep(70); }
check('limpador varre o para-brisa', Math.max(...wp) - Math.min(...wp) > 0.3);
await page.screenshot({ path: `${SHOTS}/73-chuva.png` });
await stalk('R', 2);
check('alavanca direita de volta = limpador desligado', (await veh('wiper')) === 'OFF');

// ---------- pisca-alerta, ar, multimídia ----------
await tap('[data-testid=hazard]');
let l = 0, r = 0; for (let i = 0; i < 14; i++) { if (await lit('turnL')) l++; if (await lit('turnR')) r++; await sleep(60); }
check('pisca-alerta pisca as duas setas', l > 0 && r > 0);
await tap('[data-testid=hazard]');
await twist('[data-testid=knob-fan-hit]', -135, 0, 15);
check('girar o botão do ventilador muda a velocidade', (await veh('fan')) === 2, String(await veh('fan')));
await zoomTap('climate', '[data-testid=ac]');
await sleep(300);
check('A/C liga pelo close-up e põe carga no motor', (await veh('ac')) && (await S(() => window.__sim.car.accessoryTorque)) > 7);
await closeZoom();
await zoomTap('media', '[data-testid=radio-power]');
await closeZoom();
check('rádio liga e aparece na tela central', (await S(() => document.querySelector('[data-testid=screen]')?.textContent ?? '')).includes('FM'));
await zoomTap('spokeL', '[data-testid=w-volup]');
await closeZoom();
check('VOL+ no raio esquerdo do volante sobe o volume', (await veh('volume')) === 13);
await zoomTap('spokeR');
const t0 = await S(() => window.__sim.veh.tripPage);
await tap('[data-testid=w-trip]');
await closeZoom();
check('TRIP no raio direito troca a tela do computador de bordo', (await S(() => window.__sim.veh.tripPage)) === t0 + 1);
await zoomTap('leftBank', '[data-testid=esp-off]');
await closeZoom();
check('ESP OFF (botões à esquerda) acende a luz', await lit('espOff'));
await zoomTap('leftBank', '[data-testid=esp-off]');
await closeZoom();

// ---------- dirigir: embreagem + câmbio + acelerador ----------
await tap('[data-testid=handbrake]');
check('freio de mão baixa pelo console', !(await S(() => window.__sim.car.inputs.handbrake)));
await pedal('clutch', 1); await sleep(80);
const g1 = await shift('1');
check('câmbio no console: arraste engata a 1ª', g1 === '1', g1);
{
  const [gx, gy] = await center('[data-testid=gear-hit]');
  await down(2, gx, gy); await sleep(80);
  const vis = await S(() => getComputedStyle(document.querySelector('[data-testid=gear-gate]')).opacity);
  await page.screenshot({ path: `${SHOTS}/78-guia-cambio.png` });
  await up(2); await sleep(250);
  const hid = await S(() => getComputedStyle(document.querySelector('[data-testid=gear-gate]')).opacity);
  check('ao tocar no câmbio aparece o "H" com a marcha atual; some ao soltar', Number(vis) > 0.9 && Number(hid) < 0.1, `${vis} → ${hid}`);
  // curso cabe na tela: do ponto de toque, descer uma posição não passa da borda
  const b = await box('[data-testid=gear-hit]');
  check('curso do câmbio cabe na tela a partir de qualquer ponto da área de toque', b.y + b.height + 32 * K <= 390, `${Math.round(b.y + b.height + 32 * K)} ≤ 390`);
}
await pedal('throttle', 0.3); await sleep(300);
await ramp('clutch', 1, 0.62, 250); await ramp('clutch', 0.62, 0.38, 1500); await ramp('clutch', 0.38, 0, 400); await release('clutch');
await sleep(600);
const c1 = await car();
check('arrancada com três dedos: carro sai sem apagar', c1.on && c1.kmh > 6, `${c1.kmh.toFixed(1)} km/h`);
for (const g of ['2', '3']) {
  await pedal('throttle', 0.7);
  await waitFor(async () => (await car()).rpm > 3200, 10000);
  await release('throttle');
  await pedal('clutch', 1); await sleep(100);
  await shift(g);
  await ramp('clutch', 1, 0, 600); await release('clutch');
}
await pedal('throttle', 0.6);
await waitFor(async () => (await car()).kmh > 50, 15000);
const c2 = await car();
check('trocas 1→2→3 pelo console até 50 km/h', c2.gear === '3' && c2.kmh > 48, `${c2.gear} ${c2.kmh.toFixed(0)} km/h`);
const spd = await S(() => document.querySelector('[data-testid=speed-scene]')?.textContent);
check('velocímetro digital do quadro acompanha', Math.abs(Number(spd) - c2.kmh) < 3, `${spd}`);
{
  const ang = (n) => S((n) => Number(/rotate\(([-\d.]+)/.exec(document.querySelector(`[data-testid=cluster-scene] [data-needle=${n}]`).getAttribute('transform'))[1]), n);
  const k = await ang('kmh'), r = await ang('rpm'), now = await car();
  check('ponteiro do velocímetro marca a velocidade', Math.abs(k - (-130 + (260 * now.kmh) / 220)) < 4, `${k.toFixed(0)}° para ${now.kmh.toFixed(0)} km/h`);
  check('ponteiro do conta-giros marca o giro', Math.abs(r - (-130 + (260 * now.rpm) / 8000)) < 8, `${r.toFixed(0)}° para ${now.rpm.toFixed(0)} rpm`);
}
await page.screenshot({ path: `${SHOTS}/74-andando.png` });
await release('throttle');
await pedal('brake', 0.5);
await waitFor(async () => (await car()).rpm < 1300, 10000);
await pedal('clutch', 1);
await waitFor(async () => (await car()).kmh < 0.3, 10000);
await release('brake');
await shift('N');
await release('clutch');
check('parada completa sem apagar', (await car()).on);

// ---------- ré com trava no console ----------
await pedal('clutch', 1); await sleep(80);
const gr = await shift('R', true);
check('ré engata segurando a manopla e levando à direita e para baixo', gr === 'R', gr);
await shift('N');
await release('clutch');

// ---------- "Onde fica?" no cockpit ----------
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-quiz]');
await sleep(150);
check('"Onde fica?" mostra a pergunta no topo', (await hud()).includes('Onde fica'));
// erra duas vezes: a área certa pisca
for (let i = 0; i < 2; i++) {
  const cur = await S(() => window.__quiz.list[window.__quiz.idx].id);
  await tap(cur === 'hazard' ? '[data-testid=handbrake]' : '[data-testid=hazard]');
}
await sleep(100);
check('após dois erros a área certa pisca no painel', (await page.locator('.scene-svg .reveal').count()) === 1);
await page.screenshot({ path: `${SHOTS}/75-onde-fica.png` });
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-quiz]');

// ---------- menu e vertical ----------
await tap('[data-testid=menu-open]');
await tap('[data-testid=menu-night]');
await tap('[data-testid=menu-close]');
check('menu discreto: noite liga', await veh('night'));
await page.screenshot({ path: `${SHOTS}/76-noite.png` });
await page.setViewportSize({ width: 390, height: 844 });
await sleep(300);
check('virando para vertical volta ao modo de treino com abas', (await page.locator('.tabs').count()) === 1 && (await page.locator('[data-testid=cockpit]').count()) === 0);
await tap('[data-testid=tab-panel]');
await sleep(200);
check('aba Painel na vertical pede para girar o iPhone', (await page.locator('[data-testid=rotate]').count()) === 1);
await page.setViewportSize({ width: 844, height: 390 });
await sleep(300);
check('volta ao cockpit ao deitar o iPhone', (await page.locator('[data-testid=cockpit]').count()) === 1);

for (const k of [...active.keys()]) await up(k);
// ---------- para-sóis ----------
await tap('[data-testid=visor-L]');
check('tocar no para-sol do motorista abaixa', (await S(() => document.querySelector('[data-testid=visor-L]').dataset.down)) === '1');
await tap('[data-testid=visor-L]');
check('tocar de novo sobe o para-sol', (await S(() => document.querySelector('[data-testid=visor-L]').dataset.down)) === '0');
check('nenhum erro de JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações aprovadas`);
process.exit(failed.length ? 1 : 0);
