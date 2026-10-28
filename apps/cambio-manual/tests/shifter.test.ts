import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Shifter, GEAR_POS } from '../src/sim/shifter.ts';
import type { Gear } from '../src/sim/car.ts';

function make(canEngage: (g: Gear) => { ok: boolean; reason?: 'clutch' | 'moving' } = () => ({ ok: true })) {
  const log: string[] = [];
  const s = new Shifter({
    canEngage,
    onGear: (g) => log.push(`gear:${g}`),
    onBlocked: (r, g) => log.push(`block:${r}:${g}`),
  });
  return { s, log };
}

/** Arrasta o dedo em pequenos incrementos, como um toque real. */
function drag(s: Shifter, path: [number, number][], steps = 20) {
  s.beginDrag();
  let [cx, cy] = [s.x, s.y];
  for (const [px, py] of path) {
    for (let i = 1; i <= steps; i++) s.moveToward(cx + ((px - cx) * i) / steps, cy + ((py - cy) * i) / steps);
    [cx, cy] = [px, py];
  }
  s.endDrag();
  for (let i = 0; i < 120; i++) s.spring(1 / 60);
}

const routes: Record<string, [number, number][]> = {
  '1': [[-1, 0], [-1, -1.1]],
  '2': [[-1, 0], [-1, 1.1]],
  '3': [[0, -1.1]],
  '4': [[0, 1.1]],
  '5': [[1, 0], [1, -1.1]],
};

for (const [g, path] of Object.entries(routes)) {
  test(`engata a ${g}ª pelo corredor correto`, () => {
    const { s } = make();
    drag(s, path);
    assert.equal(s.gear, g);
    assert.deepEqual({ x: s.x, y: s.y }, GEAR_POS[g as '1']);
  });
}

test('ré exige destravar (segurar a manopla) antes de entrar', () => {
  const { s, log } = make();
  drag(s, [[1, 0], [1, 1.1]]);
  assert.equal(s.gear, 'N');
  assert.ok(log.includes('block:reverseLock:R'));
  s.beginDrag();
  s.reverseUnlocked = true;
  for (let i = 1; i <= 20; i++) s.moveToward(s.x + (1 - s.x) * 0.3, 0);
  for (let i = 1; i <= 30; i++) s.moveToward(1, (1.1 * i) / 30);
  s.endDrag();
  assert.equal(s.gear, 'R');
});

test('não atravessa as paredes: arrastar da 1ª direto para a direita não muda de marcha', () => {
  const { s } = make();
  drag(s, routes['1']);
  s.beginDrag();
  for (let i = 1; i <= 30; i++) s.moveToward(-1 + (2 * i) / 30, -1);
  assert.equal(s.gear, '1');
  assert.equal(s.x, -1);
  s.endDrag();
});

test('1ª → 2ª passa pelo neutro em linha reta', () => {
  const { s, log } = make();
  drag(s, routes['1']);
  drag(s, [[-1, 1.1]], 40);
  assert.equal(s.gear, '2');
  assert.deepEqual(log, ['gear:1', 'gear:N', 'gear:2']);
});

test('2ª → 3ª: desce ao neutro, vai ao centro e sobe', () => {
  const { s } = make();
  drag(s, routes['2']);
  drag(s, [[-1, 0], [0, 0], [0, -1.1]]);
  assert.equal(s.gear, '3');
});

test('diagonal 2ª → 3ª (como na mão de verdade) termina na 3ª, não na 1ª', () => {
  const { s } = make();
  drag(s, routes['2']);
  drag(s, [[-1, 0], [0, -1.1]]);
  assert.equal(s.gear, '3');
});

test('diagonal do neutro para cima-esquerda termina na 1ª', () => {
  const { s } = make();
  drag(s, [[-1, -1.1]]);
  assert.equal(s.gear, '1');
});

test('4ª → 5ª em diagonal termina na 5ª', () => {
  const { s } = make();
  drag(s, routes['4']);
  drag(s, [[0, 0], [1, -1.1]]);
  assert.equal(s.gear, '5');
});

test('sem embreagem o sincronizador bloqueia e avisa uma vez', () => {
  const { s, log } = make(() => ({ ok: false, reason: 'clutch' }));
  drag(s, [[0, -1.1]]);
  assert.equal(s.gear, 'N');
  assert.equal(log.filter((l) => l.startsWith('block:clutch')).length, 1);
});

test('soltar a alavanca no meio do caminho volta ao neutro; engatada fica', () => {
  const { s } = make();
  drag(s, [[0, -0.5]]);
  assert.equal(s.gear, 'N');
  assert.equal(s.y, 0);
  drag(s, routes['3']);
  assert.equal(s.gear, '3');
  assert.equal(s.y, -1);
});

test('neutro volta ao plano 3-4 pela mola', () => {
  const { s } = make();
  drag(s, [[-1, 0]]);
  assert.equal(s.x, 0);
});
