import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Car } from '../src/sim/car.ts';
import { Vehicle } from '../src/sim/vehicle.ts';

const DT = 1 / 120;
function rig(opts: Parameters<Car['reset']>[0] = {}) {
  const car = new Car();
  const veh = new Vehicle();
  const ev: string[] = [];
  veh.on((t) => ev.push(t));
  car.reset(opts);
  if (opts.engineOn) veh.ignition = 'ON';
  const pedals = { throttle: 0, brake: 0, clutch: opts.clutch ?? 0 };
  const run = (s: number, each?: (t: number) => void) => {
    for (let i = 0; i < Math.round(s / DT); i++) {
      each?.(i * DT);
      car.inputs.brake = pedals.brake; car.inputs.clutch = pedals.clutch;
      car.inputs.throttle = veh.update(DT, car, pedals);
      for (let k = 0; k < 2; k++) car.step(DT / 2);
    }
  };
  return { car, veh, ev, pedals, run };
}

test('chave em LOCK desliga o motor; START só funciona passando por ON', () => {
  const { car, veh, run } = rig();
  veh.crank(car);
  assert.equal(veh.ignition, 'ON');
  run(2);
  assert.ok(car.engineOn);
  veh.setIgnition('ACC', car);
  run(0.1);
  assert.ok(!car.engineOn);
});

test('check de lâmpadas: tudo acende ~3 s; depois bateria/óleo ficam até o motor pegar', () => {
  const { car, veh, run } = rig();
  veh.setIgnition('ON', car);
  let L = veh.lamps(car);
  assert.equal(L.abs, 'on'); assert.equal(L.airbag, 'on'); assert.equal(L.battery, 'on');
  run(3.5);
  L = veh.lamps(car);
  assert.equal(L.abs, 'off'); assert.equal(L.airbag, 'off');
  assert.equal(L.battery, 'on'); assert.equal(L.oil, 'on');
  veh.crank(car); run(2);
  L = veh.lamps(car);
  assert.equal(L.battery, 'off'); assert.equal(L.oil, 'off');
});

test('seta de toque único pisca 3 vezes; segurar fica fixa; alerta funciona sem ignição', () => {
  const { car, veh, ev, run } = rig({ engineOn: true });
  veh.signal(1, false);
  run(3);
  assert.equal(ev.filter((e) => e === 'tick').length, 3);
  assert.equal(veh.turnActive, false);
  veh.signal(-1, true); run(5);
  assert.ok(veh.turnActive);
  veh.signal(-1, false); assert.ok(!veh.turnActive);
  veh.setIgnition('LOCK', car);
  veh.toggleHazard(); ev.length = 0; run(2);
  assert.ok(ev.filter((e) => e === 'tick').length >= 2);
});

test('farol alto exige farol baixo; AUTO acende à noite', () => {
  const { veh, car } = rig({ engineOn: true });
  assert.ok(veh.toggleHigh());
  veh.setLights('AUTO');
  assert.equal(veh.lowBeam, false);
  veh.night = true;
  assert.equal(veh.lowBeam, true);
  assert.equal(veh.toggleHigh(), null);
  assert.equal(veh.lamps(car).high, 'on');
});

test('piloto automático segura 80 km/h sem pedal e cancela no freio e na embreagem', () => {
  const { car, veh, run, pedals } = rig({ engineOn: true, gear: '5', kmh: 80 });
  veh.toggleCruiseMain();
  assert.equal(veh.setMinus(car), null);
  run(25);
  assert.ok(Math.abs(car.kmh - 80) < 2.5, `velocidade ${car.kmh}`);
  pedals.brake = 0.2; run(0.2); pedals.brake = 0;
  assert.ok(!veh.cruiseActive);
  run(4);
  assert.ok(car.kmh < 76);
  assert.equal(veh.resPlus(car), null);
  run(15);
  assert.ok(Math.abs(car.kmh - 80) < 3, `retomou ${car.kmh}`);
  pedals.clutch = 1; run(0.1);
  assert.ok(!veh.cruiseActive);
});

test('limitador segura a velocidade mesmo com o acelerador no fundo', () => {
  const { car, veh, run, pedals } = rig({ engineOn: true, gear: '3', kmh: 45 });
  veh.toggleLimiterMode();
  veh.setMinus(car);
  pedals.throttle = 1;
  run(15);
  assert.ok(car.kmh < 49, `limitado a ${car.kmh}`);
});

test('ISG desliga parado em neutro com motor quente e religa ao pisar a embreagem', () => {
  const { car, veh, run, pedals } = rig({ engineOn: true });
  veh.coolant = 85;
  run(1.5);
  assert.ok(veh.isgStopped && !car.engineOn);
  assert.equal(veh.lamps(car).isgAuto, 'on');
  pedals.clutch = 1; run(1.5);
  assert.ok(car.engineOn && !veh.isgStopped);
});

test('ISG não age com motor frio nem com ISG desligado', () => {
  const { car, veh, run } = rig({ engineOn: true });
  veh.coolant = 40; run(2);
  assert.ok(car.engineOn);
  veh.coolant = 85; veh.isg = false; run(2);
  assert.ok(car.engineOn);
});

test('HAC segura o carro 2 s na subida ao soltar o freio; depois ele volta', () => {
  const { car, veh, run, pedals } = rig({ engineOn: true, grade: 0.1, gear: '1', clutch: 1 });
  pedals.clutch = 1;
  pedals.brake = 0.6; run(0.5); pedals.brake = 0;
  run(1.5);
  assert.ok(Math.abs(car.v) < 0.05, `segurou ${car.v}`);
  assert.equal(veh.lamps(car).hac, 'on');
  run(2);
  assert.ok(car.v < -0.3, `voltou ${car.v}`);
});

test('consumo coerente: marcha lenta < 1 l/h; 80 km/h em 5ª entre 12 e 22 km/l', () => {
  const { car, veh, run } = rig({ engineOn: true });
  run(2);
  assert.ok(veh.fuelRate > 0.3 && veh.fuelRate < 1, `lenta ${veh.fuelRate}`);
  const b = rig({ engineOn: true, gear: '5', kmh: 80 });
  b.veh.toggleCruiseMain(); b.veh.setMinus(b.car);
  b.run(20);
  assert.ok(b.veh.instKmL > 12 && b.veh.instKmL < 22, `${b.veh.instKmL} km/l`);
  assert.ok(b.veh.tripA.dist > 0.4);
  void car;
});

test('A/C só liga com ventilador e adiciona carga ao motor', () => {
  const { car, veh, run } = rig({ engineOn: true });
  assert.ok(veh.toggleAC());
  veh.fan = 2;
  assert.equal(veh.toggleAC(), null);
  run(1);
  assert.ok(car.accessoryTorque > 7);
  assert.ok(car.engineOn && car.rpm > 750);
});

test('trava automática acima de 20 km/h e aviso do cinto', () => {
  const { car, veh, run, ev } = rig({ engineOn: true, gear: '3', kmh: 40 });
  veh.belt = false;
  run(2);
  assert.ok(veh.locked);
  assert.ok(ev.includes('chime'));
  assert.equal(veh.lamps(car).belt, 'blink');
});

test('computador de bordo: 7 telas e zerar parcial', () => {
  const { car, veh, run } = rig({ engineOn: true, gear: '4', kmh: 70 });
  run(5);
  const pages = new Set<string>();
  for (let i = 0; i < 7; i++) { pages.add(veh.tripInfo().label); veh.nextTrip(); }
  assert.equal(pages.size, 7);
  veh.tripPage = 0;
  assert.ok(veh.tripA.dist > 0);
  veh.resetTrip();
  assert.equal(veh.tripA.dist, 0);
  void car;
});

test('seta desarma sozinha quando o volante volta depois da curva', () => {
  const { car, veh } = rig({ engineOn: true });
  veh.setTurn(1, true);
  veh.steerUpdate(40); assert.ok(veh.turnActive, 'pouco giro não desarma');
  veh.steerUpdate(10); assert.ok(veh.turnActive);
  veh.steerUpdate(180); veh.steerUpdate(120); assert.ok(veh.turnActive, 'ainda virando');
  veh.steerUpdate(15); assert.ok(!veh.turnActive, 'voltou ao centro: desarmou');
  veh.setTurn(-1, true);
  veh.steerUpdate(200); veh.steerUpdate(0); assert.ok(veh.turnActive, 'virar para o lado oposto não desarma');
  void car;
});
