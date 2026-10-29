import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Mirrors, goodAim, mirrorStatus, bodyShare, horizonV, rearGlassCenter, GEO, type MirrorId } from '../src/sim/mirrors.ts';

const IDS: MirrorId[] = ['L', 'R', 'I'];

test('ajuste de referência é avaliado como certo nos três espelhos', () => {
  for (const id of IDS) assert.equal(mirrorStatus(id, goodAim(id)).ok, true, id);
  assert.ok(Math.abs(bodyShare('L', goodAim('L')) - 0.22) < 0.01);
  assert.ok(Math.abs(bodyShare('R', goodAim('R')) - 0.2) < 0.01);
  const [u, v] = rearGlassCenter(goodAim('I'));
  assert.ok(Math.abs(u - 0.5) < 0.01 && Math.abs(v - 0.5) < 0.01);
});

test('girar para fora reduz a lateral do carro no espelho; subir baixa o horizonte', () => {
  const l = goodAim('L'), r = goodAim('R');
  assert.ok(bodyShare('L', { ...l, yaw: l.yaw - 0.05 }) < bodyShare('L', l)); // esquerdo: para fora = para a esquerda
  assert.ok(bodyShare('R', { ...r, yaw: r.yaw + 0.05 }) < bodyShare('R', r)); // direito: para fora = para a direita
  assert.ok(horizonV('L', { ...l, pitch: l.pitch + 0.05 }) > horizonV('L', l));
});

test('motor só gira com a chave em ACC/ON e com o seletor em E ou D, e para no fim do curso', () => {
  const m = new Mirrors();
  const y0 = m.aim.L.yaw;
  m.drive.x = 1;
  m.update(1, true, 0, 0);
  assert.equal(m.aim.L.yaw, y0, 'sem seletor não mexe');
  m.select = 'L';
  m.update(1, false, 0, 0);
  assert.equal(m.aim.L.yaw, y0, 'sem energia não mexe');
  const r = m.update(0.5, true, 0, 0);
  assert.ok(r.moving && m.aim.L.yaw > y0);
  for (let i = 0; i < 100; i++) m.update(0.1, true, 0, 0);
  assert.equal(m.aim.L.yaw, GEO.L.yaw[1]);
  assert.equal(m.update(0.1, true, 0, 0).moving, false, 'no batente o motor para');
  assert.deepEqual(m.aim.R, goodAim('R'), 'o outro espelho não muda');
});

test('o treino desajusta os três e termina quando todos ficam certos', () => {
  const m = new Mirrors();
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  m.startDrill(0, rnd);
  for (const id of IDS) assert.equal(m.status(id).ok, false, id);
  assert.equal(m.update(0.016, true, 0, 1000).drillDone, 0);
  for (const id of IDS) m.aim[id] = goodAim(id);
  const r = m.update(0.016, true, 0, 12500);
  assert.equal(r.drillDone, 12500);
  assert.equal(m.drill.active, false);
});

test('seguindo a dica, o espelho chega ao ajuste certo', () => {
  for (const id of ['L', 'R'] as const) {
    const m = new Mirrors();
    m.select = id;
    m.aim[id] = { yaw: GEO[id].yaw[id === 'L' ? 1 : 0], pitch: GEO[id].pitch[0] }; // virado para dentro e para baixo
    for (let i = 0; i < 400 && !m.status(id).ok; i++) {
      const h = m.status(id).hint;
      m.drive.x = h.includes('◀') ? -1 : h.includes('▶') ? 1 : 0;
      m.drive.y = h.includes('▲') ? 1 : h.includes('▼') ? -1 : 0;
      m.update(0.05, true, 0, 0);
    }
    assert.equal(m.status(id).ok, true, `${id}: ${m.status(id).hint}`);
  }
});

test('carro de trás encosta quando paramos e se afasta com a velocidade', () => {
  const m = new Mirrors();
  for (let i = 0; i < 600; i++) m.update(0.05, true, 0, 0);
  assert.ok(m.follow.gap > 100, 'estacionado: ninguém atrás');
  for (let i = 0; i < 1200; i++) m.update(0.05, true, 16, 0);
  assert.ok(m.follow.gap > 15 && m.follow.gap < 30, `andando: ${m.follow.gap}`);
  for (let i = 0; i < 600; i++) m.update(0.05, true, 0, 0);
  assert.ok(m.follow.gap < 4, 'parou: encosta atrás');
});
