import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Car, SimEvent, speedAtRpm, clutchEngagement, BITE_ZONE } from '../src/sim/car.ts';

const DT = 1 / 240;
function run(car: Car, seconds: number, each?: (t: number) => void) {
  const n = Math.round(seconds / DT);
  for (let i = 0; i < n; i++) { each?.(i * DT); car.step(DT); }
}
function collect(car: Car) {
  const evs: SimEvent[] = [];
  car.on((e) => evs.push(e));
  return evs;
}
function started(opts: Parameters<Car['reset']>[0] = {}) {
  const car = new Car();
  car.reset({ engineOn: true, ...opts });
  run(car, 1);
  return car;
}

test('partida em neutro: motor pega e estabiliza na marcha lenta', () => {
  const car = new Car();
  const evs = collect(car);
  car.startEngine();
  run(car, 3);
  assert.ok(car.engineOn, 'motor deveria estar ligado');
  assert.ok(evs.some((e) => e.type === 'start'));
  assert.ok(car.rpm > 750 && car.rpm < 1000, `rpm marcha lenta ${car.rpm}`);
});

test('partida engatada sem embreagem: tranco e motor não pega', () => {
  const car = new Car();
  const evs = collect(car);
  car.setGear('1');
  car.startEngine();
  run(car, 2);
  assert.ok(evs.some((e) => e.type === 'startInGear'));
  assert.ok(!car.engineOn);
  assert.ok(car.distance > 0.02, `carro deveria dar um tranco (${car.distance})`);
});

test('ponto de acoplamento: embreagem é progressiva, não liga/desliga', () => {
  assert.equal(clutchEngagement(1), 0);
  assert.equal(clutchEngagement(0), 1);
  const mid = clutchEngagement((BITE_ZONE[0] + BITE_ZONE[1]) / 2);
  assert.ok(mid > 0.03 && mid < 0.3, `engate no ponto ${mid}`);
});

test('arrancada suave em 1ª: não apaga, não dá tranco, ganha velocidade', () => {
  const car = started({ clutch: 1 });
  const evs = collect(car);
  car.inputs.clutch = 1;
  car.setGear('1');
  // técnica: sobe rápido até o ponto, atravessa o ponto devagar, solta o resto
  run(car, 3, (t) => {
    car.inputs.throttle = 0.25;
    if (t < 0.4) car.inputs.clutch = 1 - (t / 0.4) * 0.37;
    else if (t < 2.2) car.inputs.clutch = 0.63 - ((t - 0.4) / 1.8) * 0.25;
    else car.inputs.clutch = Math.max(0, 0.38 - (t - 2.2) / 0.6 * 0.38);
  });
  run(car, 2);
  assert.ok(car.engineOn, 'não deveria apagar');
  assert.ok(!evs.some((e) => e.type === 'stall'));
  assert.ok(!evs.some((e) => e.type === 'jerk'), 'saída suave sem tranco');
  assert.ok(car.kmh > 8, `velocidade ${car.kmh}`);
  assert.ok(car.locked, 'embreagem deveria estar acoplada');
});

test('soltar a embreagem de uma vez sem acelerar apaga o motor', () => {
  const car = started({ clutch: 1 });
  const evs = collect(car);
  car.setGear('1');
  car.inputs.clutch = 0;
  run(car, 1.5);
  const stall = evs.find((e) => e.type === 'stall');
  assert.ok(stall, 'motor deveria apagar');
  assert.ok(['fastRelease', 'noThrottle'].includes(stall!.detail!.cause as string));
});

test('sair em 3ª marcha apaga e o diagnóstico aponta marcha alta', () => {
  const car = started({ clutch: 1 });
  const evs = collect(car);
  car.setGear('3');
  run(car, 2, (t) => { car.inputs.throttle = 0.25; car.inputs.clutch = Math.max(0, 1 - t / 1.5); });
  const stall = evs.find((e) => e.type === 'stall');
  assert.ok(stall);
  assert.equal(stall!.detail!.cause, 'highGear');
});

test('acelerar tudo em 1ª chega ao corte com velocidade coerente', () => {
  const car = started({ gear: '1', kmh: 15 });
  car.inputs.throttle = 1;
  run(car, 8);
  const expected = speedAtRpm('1', car.rpm);
  assert.ok(car.rpm > 6200 && car.rpm < 6800, `rpm ${car.rpm}`);
  assert.ok(Math.abs(car.kmh - expected) < 1, 'velocímetro sincronizado com o giro');
  assert.ok(car.kmh > 44 && car.kmh < 52, `1ª máx ${car.kmh}`);
});

test('sequência 1→5 com embreagem: rpm cai a cada troca e a velocidade sobe', () => {
  const car = started({ clutch: 1 });
  const evs = collect(car);
  car.setGear('1');
  run(car, 2, (t) => { car.inputs.throttle = 0.35; car.inputs.clutch = Math.max(0, 1 - t / 1.6); });
  const gears = ['2', '3', '4', '5'] as const;
  for (const g of gears) {
    run(car, 0.1, () => { car.inputs.throttle = 1; });
    while (car.rpm < 4500) car.step(DT);
    const before = car.rpm;
    car.inputs.throttle = 0; car.inputs.clutch = 1;
    run(car, 0.25);
    assert.equal(car.canEngage(g).ok, true);
    car.setGear(g);
    run(car, 0.6, (t) => { car.inputs.clutch = Math.max(0, 1 - t / 0.5); car.inputs.throttle = 0.3; });
    assert.ok(car.rpm < before - 900, `rpm caiu na troca para ${g}: ${before} → ${car.rpm}`);
  }
  car.inputs.throttle = 1;
  run(car, 40);
  assert.ok(!evs.some((e) => e.type === 'stall'));
  assert.ok(car.kmh > 165 && car.kmh < 200, `máxima ${car.kmh}`);
});

test('engatar sem embreagem com motor ligado arranha (sincronizador bloqueia)', () => {
  const car = started();
  const r = car.canEngage('1');
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'clutch');
  car.inputs.clutch = 1;
  assert.equal(car.canEngage('1').ok, true);
});

test('ré bloqueada com o carro andando para frente', () => {
  const car = started({ gear: '2', kmh: 20 });
  car.inputs.clutch = 1;
  assert.equal(car.canEngage('R').reason, 'moving');
});

test('ré: o carro anda para trás', () => {
  const car = started({ clutch: 1 });
  car.setGear('R');
  run(car, 3.5, (t) => {
    car.inputs.throttle = 0.25;
    car.inputs.clutch = t < 0.4 ? 1 - t / 0.4 * 0.37 : t < 2.4 ? 0.63 - (t - 0.4) / 2 * 0.3 : Math.max(0, 0.33 - (t - 2.4));
  });
  assert.ok(car.v < -0.5, `v ${car.v}`);
  assert.ok(car.engineOn);
});

test('frear até parar engrenado sem embreagem apaga o motor', () => {
  const car = started({ gear: '3', kmh: 40 });
  const evs = collect(car);
  car.inputs.brake = 0.6;
  run(car, 5);
  const stall = evs.find((e) => e.type === 'stall');
  assert.ok(stall);
  assert.equal(stall!.detail!.cause, 'stoppedInGear');
});

test('frear com a embreagem pisada para sem apagar', () => {
  const car = started({ gear: '3', kmh: 40 });
  const evs = collect(car);
  car.inputs.brake = 0.6;
  run(car, 1.5);
  car.inputs.clutch = 1;
  run(car, 4);
  assert.equal(car.kmh, 0);
  assert.ok(car.engineOn);
  assert.ok(!evs.some((e) => e.type === 'stall'));
});

test('subida 10%: freio de mão segura; sem ele o carro volta', () => {
  const car = started({ grade: 0.1, handbrake: true });
  run(car, 2);
  assert.equal(car.v, 0);
  car.inputs.handbrake = false;
  run(car, 2);
  assert.ok(car.v < -0.5, `deveria descer de ré ${car.v}`);
});

test('saída em subida com freio de mão e ponto de embreagem', () => {
  const car = started({ grade: 0.1, handbrake: true, clutch: 1 });
  const evs = collect(car);
  car.setGear('1');
  // acelera e encontra o ponto
  run(car, 1.5, (t) => { car.inputs.throttle = 0.4; car.inputs.clutch = 1 - Math.min(1, t / 1.2) * 0.42; });
  car.inputs.handbrake = false;
  run(car, 3, (t) => { car.inputs.throttle = 0.45; car.inputs.clutch = Math.max(0, 0.58 - t / 2.5); });
  assert.ok(car.engineOn, 'não apagou');
  assert.ok(car.distance > 1, `subiu ${car.distance}`);
  assert.ok(car.distance > -0.3 && !evs.some((e) => e.type === 'rollback'));
});

test('subida 10% sem acelerar apaga e o diagnóstico cita a subida', () => {
  const car = started({ grade: 0.1, clutch: 1, brake: 0 } as never);
  car.inputs.brake = 1;
  car.setGear('1');
  const evs = collect(car);
  car.inputs.brake = 0;
  run(car, 1.5, (t) => { car.inputs.clutch = Math.max(0, 1 - t / 0.9); });
  const stall = evs.find((e) => e.type === 'stall');
  assert.ok(stall);
  assert.ok(['noThrottleHill', 'fastRelease'].includes(stall!.detail!.cause as string), String(stall!.detail!.cause));
});

test('reduzir para 1ª a 80 km/h gera sobregiro', () => {
  const car = started({ gear: '4', kmh: 80 });
  const evs = collect(car);
  car.inputs.clutch = 1;
  run(car, 0.2);
  car.setGear('1');
  run(car, 1, (t) => { car.inputs.clutch = Math.max(0, 1 - t / 0.3); });
  assert.ok(evs.some((e) => e.type === 'overrev'));
});

test('soltar embreagem rápido acelerando forte dá tranco', () => {
  const car = started({ clutch: 1 });
  const evs = collect(car);
  car.setGear('1');
  car.inputs.throttle = 0.7;
  run(car, 0.6);
  car.inputs.clutch = 0;
  run(car, 1.5);
  assert.ok(evs.some((e) => e.type === 'jerk'), 'deveria haver tranco');
});

test('redução correta 4→3 a 50 km/h é suave', () => {
  const car = started({ gear: '4', kmh: 50 });
  const evs = collect(car);
  car.inputs.clutch = 1;
  run(car, 0.2);
  car.setGear('3');
  run(car, 1.2, (t) => { car.inputs.clutch = Math.max(0, 1 - t / 0.9); car.inputs.throttle = t < 0.4 ? 0.3 : 0.1; });
  assert.ok(!evs.some((e) => e.type === 'overrev' || e.type === 'stall'));
  assert.ok(Math.abs(car.kmh - 50) < 6);
});
