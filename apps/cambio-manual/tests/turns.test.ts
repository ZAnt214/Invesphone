import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Car } from '../src/sim/car.ts';
import { Vehicle } from '../src/sim/vehicle.ts';
import { Shifter } from '../src/sim/shifter.ts';
import { CityDrive, onRoad, idealLocal, IDEAL, radiusFor, steerFor, stepPose, CITY } from '../src/sim/city.ts';
import { TurnTrainer, type CourseId } from '../src/train/turns.ts';

test('mapa: rua, cruzamento e esquina arredondada', () => {
  assert.equal(onRoad(1.75, -40), true, 'faixa da direita');
  assert.equal(onRoad(10, -40), false, 'calçada');
  assert.equal(onRoad(0, 0), true, 'meio do cruzamento');
  assert.equal(onRoad(CITY.W / 2 + 0.3, -(CITY.W / 2 + 0.3)), true, 'esquina arredondada é asfalto');
  assert.equal(onRoad(CITY.W / 2 + CITY.Rc - 0.2, -(CITY.W / 2 + CITY.Rc - 0.2)), false, 'dentro da quina é calçada');
});

test('volante e raio: 1 volta ≈ curva da direita; a trajetória ideal liga as ruas', () => {
  const w = steerFor(IDEAL.R.R);
  assert.ok(w > 320 && w < 380, `direita pede ~1 volta (${w.toFixed(0)}°)`);
  assert.ok(Math.abs(radiusFor(w) - IDEAL.R.R) < 0.01);
  const r = idealLocal('R'), l = idealLocal('L');
  assert.deepEqual(r[r.length - 1].map((v) => Math.round(v)), [48, -2]);
  assert.ok(l[l.length - 1][0] < -40 && Math.abs(l[l.length - 1][1] - 1.75) < 0.01);
  // seguir o arco com o volante fixo fecha 90°
  const p = { x: IDEAL.R.x0, z: IDEAL.R.start, h: 0 };
  const dist = (Math.PI / 2) * IDEAL.R.R;
  for (let i = 0; i < 1000; i++) stepPose(p, dist, w, 1 / 1000);
  assert.ok(Math.abs(p.h - Math.PI / 2) < 0.01 && Math.abs(p.x - 8) < 0.05 && Math.abs(p.z + 2) < 0.05, JSON.stringify(p));
});

function rig(course: CourseId, demo: boolean) {
  const car = new Car(), veh = new Vehicle(), city = new CityDrive();
  const said: string[] = [];
  const glances: string[] = [];
  const api = {
    car, veh, city, steer: 0, steerDrag: false, pedals: { throttle: 0, brake: 0, clutch: 0 },
    shifter: null as unknown as Shifter, t: 0,
    now() { return this.t * 1000; },
    say(f: { title: string }) { said.push(f.title); },
    resetCar(o: Parameters<Car['reset']>[0]) { car.reset(o); veh.ignition = o?.engineOn ? 'ON' : 'LOCK'; },
    glance(id: string) { glances.push(id); },
  };
  api.shifter = new Shifter({ canEngage: (g) => car.canEngage(g), onGear: (g) => car.setGear(g), onBlocked: () => {} });
  const tr = new TurnTrainer(course, { guides: true, demo }, api);
  const DT = 1 / 120;
  let curbs = 0;
  const run = (s: number, each?: () => void) => {
    for (let i = 0; i < Math.round(s / DT) && !tr.done; i++) {
      each?.();
      car.inputs.brake = api.pedals.brake; car.inputs.clutch = api.pedals.clutch;
      car.inputs.throttle = veh.update(DT, car, api.pedals);
      if (!api.steerDrag) api.steer *= 1 - Math.min(1, DT * Math.abs(car.kmh) / 6);
      veh.steerUpdate(api.steer);
      car.step(DT);
      tr.tick(DT);
      const r = city.update(DT, car.v, api.steer);
      if (r.blocked) car.v = 0;
      if (r.curb) { curbs++; tr.onCurb(); }
      api.t += DT;
    }
  };
  return { car, veh, city, api, tr, run, said, glances, curbs: () => curbs };
}

for (const course of ['right', 'left', 'block', 'mixed'] as CourseId[]) {
  test(`instrutor faz "${course}" sem erro de trajetória`, () => {
    const r = rig(course, true);
    r.run(240);
    assert.equal(r.tr.done, true, `terminou (${r.tr.instruction})`);
    assert.equal(r.curbs(), 0, 'sem meio-fio');
    for (const res of r.tr.results) {
      const bad = res.items.filter((i) => i.ok === false).map((i) => `${i.label}: ${i.value}`);
      assert.deepEqual(bad, [], `conversão ${res.turn}`);
    }
    assert.ok(r.glances.length >= r.tr.results.filter((x) => x.turn !== 'S').length, 'olhou os retrovisores');
    assert.equal(r.car.engineOn, true);
  });
}

test('sem virar: passa reto e a avaliação diz "não virou"', () => {
  const r = rig('right', false);
  r.run(40, () => { r.api.pedals.throttle = 0.2; });
  assert.equal(r.tr.done, true);
  assert.equal(r.tr.results[0].items.find((i) => i.key === 'path')?.value, 'não virou');
});

test('virar cedo demais na direita bate no meio-fio e a dica fala da hora certa', () => {
  const r = rig('right', false);
  r.run(60, () => {
    const lz = r.tr.current.m && r.city.pose.z;
    r.api.pedals.throttle = r.car.kmh > 15 ? 0 : 0.15;
    r.api.pedals.brake = r.car.kmh > 18 ? 0.2 : 0;
    r.api.steerDrag = true;
    if (lz > -16) r.api.steer = 420; // vira muito antes da esquina
    if (r.city.pose.h > 1.4) r.api.steer = 0;
    if (r.curbs() > 0 && r.city.pose.h > 0.2) r.api.steer = 0;
  });
  assert.ok(r.curbs() > 0, 'bateu');
});
