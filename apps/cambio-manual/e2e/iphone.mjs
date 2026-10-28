// Teste de ponta a ponta em Chromium emulando um iPhone (390×844, DPR 3, toque).
// Usa toques reais via CDP (Input.dispatchTouchEvent), inclusive multitoque
// (polegar esquerdo na embreagem + direito na alavanca/acelerador).
import { chromium } from 'playwright';
import { resolve } from 'node:path';

const SHOTS = process.env.SHOTS || '/tmp';
const results = [];
const check = (name, ok, info = '') => { results.push({ name, ok: !!ok, info }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
// fontes do Google não carregam neste ambiente sem internet (no iPhone carregam)
await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const cdp = await context.newCDPSession(page);

// ---------- multitoque ----------
const active = new Map(); // id -> {x,y}
async function sendTouch(type) {
  const touchPoints = [...active.entries()].map(([id, p]) => ({ x: p.x, y: p.y, id, radiusX: 8, radiusY: 8, force: 1 }));
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
}
async function down(id, x, y) { active.set(id, { x, y }); await sendTouch('touchStart'); }
async function move(id, x, y) { active.set(id, { x, y }); await sendTouch('touchMove'); }
async function up(id) {
  // touchEnd com apenas o dedo levantado: os outros continuam pressionados
  const p = active.get(id);
  active.delete(id);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: p.x, y: p.y, id }] });
}
async function tap(sel, id = 9) {
  const b = await page.locator(sel).boundingBox();
  await down(id, b.x + b.width / 2, b.y + b.height / 2);
  await sleep(40);
  await up(id);
  await sleep(60);
}
async function glide(id, from, to, ms = 250, steps = 14) {
  for (let i = 1; i <= steps; i++) {
    await move(id, from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps);
    await sleep(ms / steps);
  }
}
const S = (expr) => page.evaluate(expr);
const car = () => S(() => { const c = window.__sim.car; return { rpm: c.rpm, kmh: c.kmh, gear: c.gear, on: c.engineOn, locked: c.locked, hb: c.inputs.handbrake, clutch: c.inputs.clutch, dist: c.distance }; });

// ---------- geometria da alavanca ----------
let pad;
async function padGeom() {
  const b = await page.locator('[data-testid=shifter]').boundingBox();
  const s = Math.min(b.width, b.height) / 200;
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  pad = { cx, cy, dx: 50 * s, dy: 60 * s };
}
const leverAt = (x, y) => [pad.cx + x * pad.dx, pad.cy + y * pad.dy];
const ROUTES = {
  N: [[0, 0]],
  '1': [[-1, 0], [-1, -1.15]], '2': [[-1, 0], [-1, 1.15]],
  '3': [[0, -1.15]], '4': [[0, 1.15]],
  '5': [[1, 0], [1, -1.15]], R: [[1, 0], [1, 1.15]],
};
/** Arrasta a alavanca (toque relativo, começando no centro do quadro) até a marcha. */
async function shift(target, { hold = false, id = 2 } = {}) {
  // espera a mola terminar de reposicionar a alavanca
  await waitFor(() => S(() => { const s = window.__sim.shifter; return s.engaged !== 'N' ? Math.abs(Math.abs(s.y) - 1) < 0.01 : s.y === 0 && s.x === 0; }), 1500, 30);
  const st = await S(() => ({ x: window.__sim.shifter.x, y: window.__sim.shifter.y }));
  const start = [pad.cx, pad.cy];
  await down(id, ...start);
  if (hold || target === 'R') await sleep(520);
  // dedo segue o caminho a partir da posição atual da alavanca: primeiro volta ao neutro
  const toScreen = ([x, y]) => [start[0] + (x - st.x) * pad.dx, start[1] + (y - st.y) * pad.dy];
  let cur = start;
  const path = [];
  if (st.y !== 0) path.push([st.x, 0]);
  path.push(...ROUTES[target]);
  for (const p of path) { const nxt = toScreen(p); await glide(id, cur, nxt, 160, 10); cur = nxt; }
  await up(id);
  await sleep(120);
  return S(() => window.__sim.shifter.gear);
}

// ---------- pedais ----------
let pedals = {};
async function pedalGeom() {
  for (const k of ['clutch', 'brake', 'throttle']) pedals[k] = await page.locator(`[data-testid=pedal-${k}]`).boundingBox();
}
const TOP = 0.1, BOTTOM = 0.12;
const pedalY = (k, v) => pedals[k].y + pedals[k].height * (TOP + v * (1 - TOP - BOTTOM));
const pedalX = (k) => pedals[k].x + pedals[k].width / 2;
const PID = { clutch: 1, throttle: 3, brake: 4 };
async function pedal(k, v) {
  const y = pedalY(k, v);
  if (active.has(PID[k])) await move(PID[k], pedalX(k), y); else await down(PID[k], pedalX(k), y);
}
async function pedalRamp(k, v0, v1, ms) {
  const steps = Math.max(4, Math.round(ms / 40));
  for (let i = 0; i <= steps; i++) { await pedal(k, v0 + ((v1 - v0) * i) / steps); await sleep(ms / steps); }
}
async function release(k) { if (active.has(PID[k])) await up(PID[k]); }
async function releaseAll() { for (const k of Object.keys(PID)) await release(k); }
async function waitFor(fn, ms = 8000, every = 50) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await fn()) return true; await sleep(every); }
  return false;
}
const lastFb = () => S(() => window.__sim.feedback.map((f) => f.title));

// =====================================================================
await page.goto('file://' + resolve('dist/test.html'));
await page.waitForSelector('[data-testid=enter]');
await page.screenshot({ path: `${SHOTS}/01-inicio.png` });
check('tela inicial renderiza sem erros', errors.length === 0, errors.join(' | '));

await tap('[data-testid=enter]');
await page.waitForSelector('[data-testid=shifter]');
await sleep(300);
await padGeom();
await pedalGeom();
const overflow = await S(() => document.documentElement.scrollWidth - window.innerWidth);
check('sem rolagem horizontal em 390 px', overflow <= 0, `excesso ${overflow}px`);
const fitsV = await S(() => document.querySelector('.app').scrollHeight <= window.innerHeight + 1);
check('cabine cabe na tela vertical sem rolar', fitsV);
const audioState = await S(() => window.__sim.audio.ctx && window.__sim.audio.ctx.state);
check('áudio (Web Audio) iniciado com o toque', audioState === 'running', audioState);
await page.screenshot({ path: `${SHOTS}/02-cabine.png` });

// ---------- 1. todas as posições do câmbio com motor desligado ----------
for (const g of ['1', '2', '3', '4', '5']) {
  const got = await shift(g);
  check(`alavanca engata a ${g}ª por arraste`, got === g, `obtido ${got}`);
  const back = await shift('N');
  check(`alavanca volta ao neutro a partir da ${g}ª`, back === 'N');
}
// ré sem destravar
{
  await down(2, pad.cx, pad.cy);
  const st = [pad.cx, pad.cy];
  await glide(2, st, [st[0] + pad.dx, st[1]], 150, 8);
  await glide(2, [st[0] + pad.dx, st[1]], [st[0] + pad.dx, st[1] + 1.15 * pad.dy], 200, 10);
  await page.screenshot({ path: `${SHOTS}/03-trava-re.png` });
  await up(2); await sleep(150);
  const g = await S(() => window.__sim.shifter.gear);
  const fb = await lastFb();
  check('ré bloqueada sem destravar a trava', g === 'N' && fb.some((t) => t.includes('trava')), fb[0]);
}
{
  const g = await shift('R', { hold: true });
  check('ré engata segurando a manopla para destravar', g === 'R', g);
  await shift('N');
}
// atravessar parede: da 1ª arrastar direto para a direita
{
  await shift('1');
  const [x0, y0] = [pad.cx, pad.cy];
  await down(2, x0, y0);
  await glide(2, [x0, y0], [x0 + 2 * pad.dx, y0], 200, 12);
  await up(2); await sleep(100);
  const g = await S(() => window.__sim.shifter.gear);
  check('alavanca não atravessa a parede do H (1ª → direita continua na 1ª)', g === '1', g);
  await shift('N');
}
// mola volta ao plano 3-4
{
  await down(2, pad.cx, pad.cy);
  await glide(2, [pad.cx, pad.cy], [pad.cx - pad.dx, pad.cy], 150, 8);
  await up(2); await sleep(400);
  const x = await S(() => window.__sim.shifter.x);
  check('mola recentraliza a alavanca no neutro (plano 3-4)', Math.abs(x) < 0.02, x.toFixed(3));
}

// ---------- 2. partida, arranhada e motor apagando ----------
{
  await tap('[data-testid=ignition]');
  const ok = await waitFor(async () => (await car()).on, 3000);
  const c = await car();
  check('partida em neutro liga o motor', ok, `rpm ${c.rpm.toFixed(0)}`);
  await sleep(1200);
  const idle = (await car()).rpm;
  check('marcha lenta estável entre 750 e 1000 rpm', idle > 750 && idle < 1000, idle.toFixed(0));

  const g = await shift('3');
  const fb = await lastFb();
  check('engatar com motor ligado sem embreagem arranha e bloqueia', g === 'N' && fb[0]?.includes('Arranhou'), fb[0]);

  // embreagem no fundo (polegar esquerdo) + engatar 1ª (polegar direito): multitoque
  await pedal('clutch', 1);
  await sleep(100);
  const g1 = await shift('1');
  check('multitoque: embreagem pisada + alavanca engata a 1ª', g1 === '1', g1);
  // soltar a embreagem de uma vez sem acelerar (freio de mão puxado na largada? soltamos antes)
  await tap('[data-testid=handbrake]', 7);
  await release('clutch');
  const stalled = await waitFor(async () => !(await car()).on, 2500);
  const fb2 = await lastFb();
  check('soltar a embreagem de uma vez apaga o motor', stalled, fb2[0]);
  check('feedback explica por que apagou e como corrigir', fb2.some((t) => t.startsWith('O motor apagou')));
  await sleep(200);
  await page.screenshot({ path: `${SHOTS}/04-apagou.png` });
}

// ---------- 3. arrancada real com multitoque ----------
{
  await pedal('clutch', 1);
  await sleep(100);
  await tap('[data-testid=ignition]');
  await sleep(300);
  await waitFor(async () => (await car()).on, 3000);
  await sleep(800);
  const gear = (await car()).gear;
  check('religar engatado com a embreagem no fundo funciona', (await car()).on && gear === '1', gear);
  // acelerador ~25% e embreagem: rápido até o ponto, devagar no ponto, depois solta
  await pedal('throttle', 0.28);
  await sleep(500);
  await pedalRamp('clutch', 1, 0.64, 300);
  await pedalRamp('clutch', 0.64, 0.4, 1800);
  await pedalRamp('clutch', 0.4, 0, 500);
  await release('clutch');
  await sleep(1500);
  const c = await car();
  check('arrancada suave por toque: carro anda sem apagar', c.on && c.kmh > 8, `${c.kmh.toFixed(1)} km/h, ${c.rpm.toFixed(0)} rpm`);
  check('velocímetro coerente com giro e relação da 1ª', Math.abs(c.kmh - c.rpm / 1000 * 7.5) < 1.5, `${c.kmh.toFixed(1)} km/h vs ${(c.rpm / 1000 * 7.5).toFixed(1)}`);
  await page.screenshot({ path: `${SHOTS}/05-andando-1a.png` });

  // troca 1→2 com multitoque
  await pedal('throttle', 0.6);
  await waitFor(async () => (await car()).rpm > 3000, 6000);
  const before = (await car()).rpm;
  await release('throttle');
  await pedal('clutch', 1);
  await sleep(120);
  const g2 = await shift('2');
  await pedalRamp('clutch', 1, 0, 700);
  await release('clutch');
  await pedal('throttle', 0.5);
  await sleep(1200);
  const c2 = await car();
  check('troca 1ª→2ª com embreagem: engata e o giro cai', g2 === '2' && c2.gear === '2' && c2.on, `${before.toFixed(0)} → ${c2.rpm.toFixed(0)} rpm, ${c2.kmh.toFixed(0)} km/h`);
  // 2→3
  await waitFor(async () => (await car()).rpm > 3200, 8000);
  await release('throttle');
  await pedal('clutch', 1); await sleep(100);
  const g3 = await shift('3');
  await pedalRamp('clutch', 1, 0, 700); await release('clutch');
  await pedal('throttle', 0.5); await sleep(1000);
  const c3 = await car();
  check('troca 2ª→3ª (diagonal pelo neutro) engata', g3 === '3' && c3.on, `${c3.kmh.toFixed(0)} km/h, ${c3.rpm.toFixed(0)} rpm`);

  // áudio acompanha o giro: compara espectro em giro baixo e alto
  const spec = await S(async () => {
    const a = window.__sim.audio;
    const an = a.ctx.createAnalyser(); an.fftSize = 16384;
    a.master.connect(an);
    const buf = new Float32Array(an.frequencyBinCount);
    const td = new Float32Array(an.fftSize);
    await new Promise((r) => setTimeout(r, 300));
    an.getFloatFrequencyData(buf);
    an.getFloatTimeDomainData(td);
    let rms = 0; for (const v of td) rms += v * v; rms = Math.sqrt(rms / td.length);
    let num = 0, den = 0;
    for (let i = 1; i < buf.length; i++) { const f = (i * a.ctx.sampleRate) / an.fftSize; if (f < 20 || f > 700) continue; const m = Math.pow(10, buf[i] / 20); num += f * m; den += m; }
    // pico na faixa da frequência de combustão (4 cilindros: rpm/60 × 2)
    const want = (window.__sim.car.rpm / 60) * 2;
    let best = 0, bestF = 0;
    for (let i = 1; i < buf.length; i++) { const f = (i * a.ctx.sampleRate) / an.fftSize; if (f < want * 0.7 || f > want * 1.3) continue; if (buf[i] > best || !bestF) { best = buf[i]; bestF = f; } }
    let ref = -1e9; for (let i = 1; i < buf.length; i++) { const f = (i * a.ctx.sampleRate) / an.fftSize; if (f > 15 && f < 300 && buf[i] > ref) ref = buf[i]; }
    window.__peak = { want, bestF, best, ref };
    a.master.disconnect(an); a.master.connect(a.ctx.destination);
    return { rms, centroid: num / den, rpm: window.__sim.car.rpm, peak: window.__peak };
  });
  await release('throttle');
  await pedal('clutch', 1);
  await pedal('brake', 0.5);
  await waitFor(async () => (await car()).kmh < 0.3, 10000);
  await release('brake');
  await sleep(1500);
  const specIdle = await S(async () => {
    const a = window.__sim.audio;
    const an = a.ctx.createAnalyser(); an.fftSize = 16384;
    a.master.connect(an);
    const buf = new Float32Array(an.frequencyBinCount);
    const td = new Float32Array(an.fftSize);
    await new Promise((r) => setTimeout(r, 300));
    an.getFloatFrequencyData(buf);
    an.getFloatTimeDomainData(td);
    let rms = 0; for (const v of td) rms += v * v; rms = Math.sqrt(rms / td.length);
    let num = 0, den = 0;
    for (let i = 1; i < buf.length; i++) { const f = (i * a.ctx.sampleRate) / an.fftSize; if (f < 20 || f > 700) continue; const m = Math.pow(10, buf[i] / 20); num += f * m; den += m; }
    // pico na faixa da frequência de combustão (4 cilindros: rpm/60 × 2)
    const want = (window.__sim.car.rpm / 60) * 2;
    let best = 0, bestF = 0;
    for (let i = 1; i < buf.length; i++) { const f = (i * a.ctx.sampleRate) / an.fftSize; if (f < want * 0.7 || f > want * 1.3) continue; if (buf[i] > best || !bestF) { best = buf[i]; bestF = f; } }
    let ref = -1e9; for (let i = 1; i < buf.length; i++) { const f = (i * a.ctx.sampleRate) / an.fftSize; if (f > 15 && f < 300 && buf[i] > ref) ref = buf[i]; }
    window.__peak = { want, bestF, best, ref };
    a.master.disconnect(an); a.master.connect(a.ctx.destination);
    return { rms, centroid: num / den, rpm: window.__sim.car.rpm, peak: window.__peak };
  });
  const cs = await car();
  check('frear com a embreagem pisada para o carro sem apagar', cs.on && cs.kmh < 0.3, `${cs.rpm.toFixed(0)} rpm`);
  check('áudio produz sinal (motor audível)', spec.rms > 0.005 && specIdle.rms > 0.002, `rms carga ${spec.rms.toFixed(4)} / lenta ${specIdle.rms.toFixed(4)}`);
  const okPeak = (p) => Math.abs(p.bestF - p.want) / p.want < 0.12 && p.best > p.ref - 12;
  check('tom do motor acompanha o giro (pico na frequência de combustão) e fica mais forte sob carga', okPeak(spec.peak) && okPeak(specIdle.peak) && spec.peak.bestF > specIdle.peak.bestF * 1.8 && spec.rms > specIdle.rms,
    `${spec.rpm.toFixed(0)} rpm → pico ${spec.peak.bestF.toFixed(0)} Hz (esperado ${spec.peak.want.toFixed(0)}) | ${specIdle.rpm.toFixed(0)} rpm → ${specIdle.peak.bestF.toFixed(0)} Hz (esperado ${specIdle.peak.want.toFixed(0)})`);
  await shift('N');
  await releaseAll();
}

// ---------- 4. desempenho ----------
{
  const perf = await S(async () => {
    const s = window.__sim;
    const orig = s.frame.bind(s);
    const costs = [];
    s.frame = (dt) => { const t = performance.now(); orig(dt); costs.push(performance.now() - t); };
    const t0 = performance.now(); let frames = 0;
    await new Promise((r) => { const f = () => { frames++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); });
    s.frame = orig;
    costs.sort((a, b) => a - b);
    return { fps: frames / 2, p50: costs[Math.floor(costs.length / 2)], p95: costs[Math.floor(costs.length * 0.95)] };
  });
  check('custo do quadro (física 240 Hz + áudio + painel) baixo', perf.p95 < 4, `fps ${perf.fps.toFixed(0)}, p50 ${perf.p50.toFixed(2)} ms, p95 ${perf.p95.toFixed(2)} ms`);
}

// ---------- 5. modo aprendizagem ----------
async function runDrill(id) {
  await tap('[data-testid=tab-learn]');
  await page.waitForSelector(`[data-testid=drill-${id}]`);
  await tap(`[data-testid=drill-${id}]`);
  await sleep(300);
  for (let i = 0; i < 20; i++) {
    const r = await S(() => { const r = window.__sim.runner; return r && !r.done ? r.list[r.idx] : null; });
    if (!r) break;
    const needClutch = await S(() => window.__sim.runner.id === 'clutch');
    if (needClutch) { await pedal('clutch', 1); await sleep(60); }
    await shift(r);
  }
  await releaseAll();
  await page.waitForSelector('[data-testid=summary]', { timeout: 3000 }).catch(() => {});
  const sum = await S(() => window.__sim.runner?.summary);
  return sum;
}
{
  const s1 = await runDrill('sequence');
  check('exercício "Sequência 1→5" completo com 100%', s1 && s1.lines[0][1] === '10 de 10' && s1.lines[1][1] === '0', s1 && JSON.stringify(s1.lines.slice(0, 3)));
  await page.screenshot({ path: `${SHOTS}/06-resumo-sequencia.png` });
  await sleep(900);
  await tap('[data-testid=summary] .btn.primary'); // repetir
  await sleep(200);
  // errar de propósito: engatar a 2ª quando pede 1ª
  const tgt = await S(() => window.__sim.runner.list[window.__sim.runner.idx]);
  await shift(tgt === '1' ? '4' : '1');
  const fb = await lastFb();
  check('marcha errada gera explicação com a posição certa', fb[0]?.startsWith('Essa é a'), fb[0]);
  const fbFull = await S(() => window.__sim.feedback[0]);
  check('explicação do erro diz onde fica cada marcha e como chegar', /fica/.test(fbFull.what) && /neutro/i.test(fbFull.fix), fbFull.what);
  await page.screenshot({ path: `${SHOTS}/07-erro-marcha.png` });
  await S(() => window.__sim.stopRunner());

  const s2 = await runDrill('positions');
  check('exercício "Localizar marchas" (sorteadas, inclui ré com trava) completo', s2 && s2.lines[0][1] === '12 de 12', s2 && s2.lines[0][1]);
  await S(() => window.__sim.stopRunner());

  // modo sem ajuda: números ocultos
  await tap('[data-testid=tab-learn]');
  await tap('[data-testid=tab-free]');
  await tap('[data-testid=tab-learn]');
  await page.waitForSelector('[data-testid=drill-blind]');
  await tap('[data-testid=drill-blind]');
  await sleep(250);
  const labels = await page.locator('.shifter .glabel').count();
  const gearText = await page.locator('[data-testid=gear]').innerText();
  check('"Sem ajuda": números do câmbio e indicador de marcha escondidos', labels === 0 && gearText === '–', `labels ${labels}, painel "${gearText}"`);
  await page.screenshot({ path: `${SHOTS}/08-sem-ajuda.png` });
  await S(() => window.__sim.stopRunner());

  const s3 = await runDrill('clutch');
  check('exercício com motor ligado e embreagem completo sem arranhar', s3 && s3.lines[0][1] === '8 de 8' && s3.lines.find((l) => l[0].startsWith('Arranhadas'))?.[1] === '0', s3 && JSON.stringify(s3.lines));
  await S(() => window.__sim.stopRunner());
}

// ---------- 6. aulas de direção (dirigidas por toque) ----------
async function openLesson(id) {
  await tap('[data-testid=tab-drive]');
  await page.waitForSelector(`[data-testid=lesson-${id}]`);
  await tap(`[data-testid=lesson-${id}]`);
  await waitFor(() => S((i) => window.__sim.runner?.id === i && !document.querySelector('.sheet-wrap'), id), 3000);
  await sleep(400);
}
const step = () => S(() => window.__sim.runner?.stepIndex ?? -1);
const lessonDone = () => S(() => !!window.__sim.runner?.done);
const lessonDiag = async () => JSON.stringify(await S(() => { const r = window.__sim.runner; const c = window.__sim.car; return { step: r?.stepIndex, instr: r?.instruction, gear: c.gear, on: c.engineOn, kmh: +c.kmh.toFixed(1), rpm: Math.round(c.rpm), dist: +c.distance.toFixed(2), fb: window.__sim.feedback.slice(0, 3).map((f) => f.title) }; }));

{ // arrancada
  await openLesson('launch');
  await pedal('clutch', 1); await sleep(80);
  await tap('[data-testid=ignition]');
  await waitFor(async () => (await car()).on, 3000);
  await sleep(500);
  await shift('1');
  await tap('[data-testid=handbrake]', 7);
  await pedal('throttle', 0.28); await sleep(400);
  await pedalRamp('clutch', 1, 0.64, 300);
  await pedalRamp('clutch', 0.64, 0.4, 1800);
  await pedalRamp('clutch', 0.4, 0, 500);
  await release('clutch');
  await pedal('throttle', 0.45);
  const ok = await waitFor(lessonDone, 8000);
  await releaseAll();
  const sum = await S(() => window.__sim.runner?.summary);
  check('aula "Arrancada no plano" concluída por toque', ok, sum && JSON.stringify(sum.lines));
  await page.screenshot({ path: `${SHOTS}/09-aula-arrancada.png` });
  await S(() => window.__sim.stopRunner());
}
async function upshiftTo(g, atRpm = 3000) {
  await pedal('throttle', 0.7);
  await waitFor(async () => (await car()).rpm > atRpm, 10000);
  await release('throttle');
  await pedal('clutch', 1); await sleep(100);
  await shift(g);
  await pedalRamp('clutch', 1, 0, 600); await release('clutch');
}
{ // trocas progressivas
  await openLesson('upshift');
  await pedal('clutch', 1); await sleep(80);
  await shift('1');
  await pedal('throttle', 0.3); await sleep(300);
  await pedalRamp('clutch', 1, 0.62, 250);
  await pedalRamp('clutch', 0.62, 0.38, 1500);
  await pedalRamp('clutch', 0.38, 0, 400); await release('clutch');
  await upshiftTo('2'); await upshiftTo('3'); await upshiftTo('4');
  await pedal('throttle', 1);
  const ok = await waitFor(lessonDone, 25000);
  await releaseAll();
  const sum = await S(() => window.__sim.runner?.summary);
  const fbs = await lastFb();
  check('aula "Trocas progressivas" concluída e trocas avaliadas', ok && fbs.some((t) => t.startsWith('Boa troca')), `${JSON.stringify(sum?.lines)} | ${fbs.slice(0, 3).join(" / ")} | ${await lessonDiag()}`);
  await S(() => window.__sim.stopRunner());
}
{ // reduções
  await openLesson('downshift');
  await pedal('brake', 0.35);
  await waitFor(async () => (await car()).kmh <= 50, 8000); await release('brake');
  await pedal('clutch', 1); await sleep(80);
  await shift('3');
  await pedal('throttle', 0.35); await sleep(150); await release('throttle');
  await pedalRamp('clutch', 1, 0, 600); await release('clutch');
  await pedal('brake', 0.35);
  await waitFor(async () => (await car()).kmh <= 30, 8000); await release('brake');
  await pedal('clutch', 1); await sleep(80);
  await shift('2');
  await pedal('throttle', 0.35); await sleep(150); await release('throttle');
  await pedalRamp('clutch', 1, 0, 600); await release('clutch');
  await sleep(300);
  await pedal('brake', 0.4);
  await waitFor(async () => (await car()).rpm < 1300, 8000);
  await pedal('clutch', 1);
  await waitFor(async () => (await car()).kmh < 0.3, 8000);
  await release('brake');
  await shift('N');
  await release('clutch');
  const ok = await waitFor(lessonDone, 3000);
  const sum = await S(() => window.__sim.runner?.summary);
  check('aula "Reduções" concluída sem sobregiro', ok && !sum.lines.some((l) => l[0] === 'Sobregiro'), sum && JSON.stringify(sum.lines));
  await S(() => window.__sim.stopRunner());
}
{ // frenagem e parada
  await openLesson('stop');
  await pedal('brake', 0.4);
  await waitFor(async () => (await car()).kmh <= 21, 8000);
  await pedal('clutch', 1);
  await waitFor(async () => (await car()).kmh < 0.3, 8000);
  await shift('N');
  await tap('[data-testid=handbrake]', 7);
  await releaseAll();
  const ok = await waitFor(lessonDone, 3000);
  const sum = await S(() => window.__sim.runner?.summary);
  check('aula "Frenagem e parada" concluída sem apagar', ok && !sum.lines.some((l) => l[0] === 'Motor apagou'), sum && JSON.stringify(sum.lines));
  await S(() => window.__sim.stopRunner());
}
{ // subida
  await openLesson('hill');
  await pedal('clutch', 1); await sleep(80);
  await shift('1');
  await pedal('throttle', 0.4);
  await waitFor(async () => (await car()).rpm > 1800, 4000);
  await pedalRamp('clutch', 1, 0.6, 400);
  await pedalRamp('clutch', 0.6, 0.52, 800);
  await waitFor(() => S(() => window.__sim.runner.stepIndex >= 3), 3000);
  await page.screenshot({ path: `${SHOTS}/10-subida-ponto.png` });
  await tap('[data-testid=handbrake]', 7);
  await pedal('throttle', 0.5);
  await pedalRamp('clutch', 0.52, 0.35, 1500);
  await pedalRamp('clutch', 0.35, 0, 600); await release('clutch');
  const ok = await waitFor(lessonDone, 10000);
  await releaseAll();
  const sum = await S(() => window.__sim.runner?.summary);
  const minDist = ok;
  check('aula "Saída em subida" (12%) concluída sem voltar', minDist && !sum.lines.some((l) => l[0] === 'Voltou na subida'), sum && JSON.stringify(sum.lines));
  await S(() => window.__sim.stopRunner());
}
{ // ré
  await openLesson('reverse');
  await pedal('clutch', 1); await sleep(80);
  const g = await shift('R', { hold: true });
  await pedal('throttle', 0.2); await sleep(300);
  await pedalRamp('clutch', 1, 0.6, 300);
  await pedalRamp('clutch', 0.6, 0.4, 1600);
  await waitFor(async () => (await car()).dist < -5, 10000);
  await release('throttle');
  await pedal('clutch', 1);
  await pedal('brake', 0.5);
  await waitFor(async () => Math.abs((await car()).kmh) < 0.3, 6000);
  await sleep(200);
  await shift('N');
  await releaseAll();
  const ok = await waitFor(lessonDone, 3000);
  const sum = await S(() => window.__sim.runner?.summary);
  check('aula "Manobra de ré" concluída (ré com trava + recuo de 5 m)', g === 'R' && ok, `ré=${g} ${JSON.stringify(sum?.lines)} ` + await lessonDiag());
  await S(() => window.__sim.stopRunner());
}

// ---------- 7. progresso salvo ----------
{
  await tap('[data-testid=tab-progress]');
  await page.waitForSelector('[data-testid=progress]');
  await sleep(600);
  await page.screenshot({ path: `${SHOTS}/11-progresso.png`, fullPage: false });
  const stored = await S(() => JSON.parse(localStorage.getItem('cambio-manual.progress.v1') || 'null'));
  check('progresso gravado (acertos, erros, tempos, aulas)', stored && stored.drills.sequence?.completions >= 1 && stored.drills.positions?.msTotal > 0 && Object.keys(stored.lessons).length >= 6 && stored.errors.stall >= 1,
    stored && `drills ${Object.keys(stored.drills).join(',')} | aulas ${Object.keys(stored.lessons).length} | erros ${JSON.stringify(stored.errors)}`);
  await page.reload();
  await tap('[data-testid=enter]');
  await tap('[data-testid=tab-progress]');
  await sleep(300);
  const txt = await page.locator('[data-testid=progress]').innerText();
  check('progresso continua após recarregar a página', /Sequência 1 → 5\s+[1-9]/.test(txt) && /100%/.test(txt));
  const scrollable = await S(() => { const el = document.querySelector('.progress-view'); return el.scrollHeight > el.clientHeight; });
  await page.evaluate(() => { document.querySelector('.progress-view').scrollTop = 400; });
  await page.screenshot({ path: `${SHOTS}/12-progresso-2.png` });
  check('tela de progresso rola internamente', scrollable);
}

check('nenhum erro de JavaScript durante todo o teste', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} verificações aprovadas`);
process.exit(failed.length ? 1 : 0);
