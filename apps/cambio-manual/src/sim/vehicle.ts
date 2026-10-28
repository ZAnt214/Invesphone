// Sistemas de bordo de um hatch compacto brasileiro (geração 2020): ignição, luzes,
// setas, limpadores, climatização, piloto automático/limitador, Stop&Go (ISG),
// assistente de partida em rampa (HAC), combustível e computador de bordo.
// Puro (sem DOM): atualizado a cada quadro pelo controlador.
import { Car, maxTorque, RPM2RAD, gearIsForward } from './car';

export type Ignition = 'LOCK' | 'ACC' | 'ON';
export type LightSwitch = 'OFF' | 'AUTO' | 'POS' | 'LOW';
export type WiperMode = 'MIST' | 'OFF' | 'INT' | 'LO' | 'HI';
export type VehEventType = 'tick' | 'tock' | 'chime' | 'click' | 'compressor' | 'lock' | 'isgStop' | 'isgStart';
export type Lamp = 'off' | 'on' | 'blink';

export const TANK_L = 50;
export const VENT_MODES = ['Rosto', 'Rosto e pés', 'Pés', 'Pés e para-brisa', 'Para-brisa'];
export const STATIONS = [
  { f: '89,1', name: 'Rádio Estrada' },
  { f: '94,7', name: 'Jazz Noturno' },
  { f: '98,5', name: 'Clássica' },
  { f: '102,1', name: 'Pop Brasil' },
  { f: '105,7', name: 'Notícias' },
];
export const SOURCES = ['FM', 'Bluetooth', 'USB'] as const;

interface Trip { dist: number; fuel: number; time: number }

export interface VehicleInputs { throttle: number; brake: number; clutch: number }

export class Vehicle {
  ignition: Ignition = 'LOCK';
  bulbCheck = 0;

  // luzes
  lights: LightSwitch = 'OFF';
  highBeam = false;
  flash = false;
  fog = false;
  level = 0; // regulagem de altura dos faróis 0..3

  // setas e alerta
  turn = 0; // -1 esquerda, 1 direita
  turnLatched = false;
  turnBlinksLeft = 0;
  hazard = false;
  blinkOn = false;
  private blinkT = 0;

  // limpadores
  wiper: WiperMode = 'OFF';
  wiperInt = 2; // 1..4 (mais rápido no 4)
  washer = false;
  rearWiper = false;
  rearWasher = false;
  wiperPos = 0; // 0 repouso .. 1 fim de curso
  rearWiperPos = 0;
  private wiperDir = 0;
  private wiperPause = 0;
  private extraWipes = 0;
  private rearDir = 0;
  private rearPause = 0;

  // climatização
  fan = 0; // 0..4
  temp = 0.5; // 0 frio .. 1 quente
  vent = 0; // índice em VENT_MODES
  ac = false;
  recirc = false;
  rearDefrost = false;
  rearDefrostT = 0;
  fogGlass = 0; // embaçamento do para-brisa 0..1

  // segurança e conveniência
  esp = true;
  isg = true;
  isgStopped = false;
  private isgT = 0;
  hac = 0; // s restantes de retenção
  private prevBrake = 0;
  locked = false;
  doorOpen = false;
  belt = true;
  private chimeT = 0;

  // piloto automático / limitador
  cruiseMain = false;
  limiterMode = false; // botão CRUISE/LIM alterna o modo
  setSpeed = 0;
  cruiseActive = false;
  private cruiseI = 0;

  // ambiente
  night = false;
  rain = 0; // 0, 1, 2
  outsideTemp = 24;

  // combustível e computador de bordo
  fuel = 31;
  odo = 12340;
  tripA: Trip = { dist: 0, fuel: 0, time: 0 };
  tripB: Trip = { dist: 0, fuel: 0, time: 0 };
  tripPage = 0;
  serviceKm = 9850;
  coolant = 26;
  fuelRate = 0; // L/h
  instKmL = 0;

  // multimídia
  radioOn = false;
  source = 0;
  station = 0;
  volume = 12; // 0..35
  mute = false;
  phoneMsg = 0;

  runnerActive = false; // exercícios/aulas desligam o ISG para não atrapalhar

  private listeners: ((t: VehEventType) => void)[] = [];
  on(fn: (t: VehEventType) => void) { this.listeners.push(fn); }
  private emit(t: VehEventType) { for (const l of this.listeners) l(t); }

  // --------------------------------------------------------------- ignição
  setIgnition(k: Ignition, car: Car) {
    if (k === this.ignition) return;
    const from = this.ignition;
    this.ignition = k;
    if (k === 'ON' && from !== 'ON') this.bulbCheck = 3;
    if (k !== 'ON') {
      car.stopEngine();
      car.cranking = 0;
      this.isgStopped = false;
      this.cruiseActive = false;
      this.cruiseMain = false;
    }
    if (k === 'LOCK') { this.radioOn = false; this.turn = 0; this.turnLatched = false; this.locked = false; }
    this.emit('click');
  }

  /** Chave em START: só gira o motor de partida com a ignição ligada. */
  crank(car: Car) {
    if (this.ignition !== 'ON') this.setIgnition('ON', car);
    this.isgStopped = false;
    if (this.fuel <= 0) return false;
    car.startEngine();
    return true;
  }

  get powerOn() { return this.ignition === 'ON'; }
  get accOn() { return this.ignition !== 'LOCK'; }

  // --------------------------------------------------------------- luzes
  get lowBeam() { return this.powerOn && (this.lights === 'LOW' || (this.lights === 'AUTO' && this.night)); }
  get position() { return this.lights === 'POS' || this.lowBeam; }
  get highBeamOn() { return this.lowBeam && this.highBeam; }
  get fogOn() { return this.fog && this.position && this.powerOn; }

  setLights(l: LightSwitch) { this.lights = l; this.emit('click'); }
  toggleHigh(): string | null {
    if (!this.lowBeam) return 'O farol alto só acende com o farol baixo ligado. Gire o comando para farol (ou AUTO à noite).';
    this.highBeam = !this.highBeam; this.emit('click'); return null;
  }
  setFlash(on: boolean) { this.flash = on && this.powerOn; }
  toggleFog(): string | null {
    if (!this.position) return 'O farol de neblina só funciona com a lanterna ou o farol ligados.';
    this.fog = !this.fog; this.emit('click'); return null;
  }

  // --------------------------------------------------------------- setas
  /** Toque curto: 3 piscadas. Segurar: seta fixa. Tocar de novo: desliga. */
  signal(dir: -1 | 1, hold: boolean) {
    if (!this.powerOn) return;
    if (this.turn === dir && (this.turnLatched || this.turnBlinksLeft > 0)) {
      this.turn = 0; this.turnLatched = false; this.turnBlinksLeft = 0;
      this.emit('click');
      return;
    }
    this.turn = dir;
    this.turnLatched = hold;
    this.turnBlinksLeft = hold ? 0 : 3;
    this.blinkT = 0; this.blinkOn = false;
  }
  /** Posição da alavanca: 0 = centro; latched = encaixada (fixa); senão toque de 3 piscadas. */
  setTurn(dir: -1 | 0 | 1, latched: boolean) {
    if (dir === 0) { if (this.turn !== 0) this.emit('click'); this.turn = 0; this.turnLatched = false; this.turnBlinksLeft = 0; return; }
    if (!this.powerOn) return;
    if (this.turn !== dir || !this.turnActive) { this.blinkT = 0; this.blinkOn = false; }
    this.turn = dir;
    this.turnLatched = latched;
    this.turnBlinksLeft = latched ? 0 : 3;
  }
  private steerPeak = 0;
  /** Desarme automático da seta: depois de esterçar no sentido da seta, ela desliga quando o volante volta. */
  steerUpdate(angle: number) {
    if (this.turnLatched && this.turn !== 0) {
      const a = angle * this.turn;
      if (a > this.steerPeak) this.steerPeak = a;
      if (this.steerPeak > 80 && a < 25) { this.setTurn(0, false); this.steerPeak = 0; }
    } else this.steerPeak = 0;
  }
  toggleHazard() { this.hazard = !this.hazard; this.blinkT = 0; this.blinkOn = false; this.emit('click'); }
  get turnActive() { return this.hazard || (this.powerOn && this.turn !== 0 && (this.turnLatched || this.turnBlinksLeft > 0)); }

  // --------------------------------------------------------------- limpadores
  setWiper(m: WiperMode) {
    this.wiper = m;
    if (m === 'MIST') this.extraWipes = Math.max(this.extraWipes, 1);
    this.emit('click');
  }

  // --------------------------------------------------------------- climatização
  toggleAC(): string | null {
    if (this.fan === 0) return 'O compressor do ar só liga com o ventilador acionado. Aumente a ventilação primeiro.';
    this.ac = !this.ac; this.emit('compressor'); return null;
  }
  toggleRearDefrost(car: Car): string | null {
    if (!car.engineOn) return 'O desembaçador traseiro só funciona com o motor ligado.';
    this.rearDefrost = !this.rearDefrost; this.rearDefrostT = this.rearDefrost ? 20 * 60 : 0; this.emit('click'); return null;
  }

  // --------------------------------------------------------------- piloto automático
  toggleCruiseMain() {
    if (!this.powerOn) return;
    this.cruiseMain = !this.cruiseMain;
    this.cruiseActive = false;
    if (!this.cruiseMain) this.setSpeed = 0;
    this.emit('click');
  }
  toggleLimiterMode() {
    if (!this.powerOn) return;
    this.limiterMode = !this.limiterMode;
    this.cruiseActive = false;
    this.setSpeed = 0;
    this.cruiseMain = true;
    this.emit('click');
  }
  /** SET−: grava a velocidade atual ou reduz 1 km/h. */
  setMinus(car: Car): string | null {
    if (!this.cruiseMain) return 'Ligue o piloto automático no botão CRUISE antes de usar SET.';
    const kmh = Math.round(car.kmh);
    if (this.limiterMode) {
      if (this.cruiseActive) this.setSpeed = Math.max(30, this.setSpeed - 1);
      else { this.setSpeed = Math.max(30, kmh); this.cruiseActive = true; }
      this.emit('click');
      return null;
    }
    if (this.cruiseActive) { this.setSpeed = Math.max(30, this.setSpeed - 1); this.emit('click'); return null; }
    if (kmh < 30) return 'O piloto automático só grava a velocidade acima de 30 km/h.';
    if (!gearIsForward(car.gear)) return 'Engate uma marcha à frente para usar o piloto automático.';
    this.setSpeed = kmh; this.cruiseActive = true; this.cruiseI = car.inputs.throttle; this.emit('click');
    return null;
  }
  /** RES+: retoma a velocidade gravada ou aumenta 1 km/h. */
  resPlus(car: Car): string | null {
    if (!this.cruiseMain) return 'Ligue o piloto automático no botão CRUISE.';
    if (this.cruiseActive) { this.setSpeed = Math.min(180, this.setSpeed + 1); this.emit('click'); return null; }
    if (!this.setSpeed) return 'Nenhuma velocidade gravada. Use SET− acima de 30 km/h.';
    if (!this.limiterMode && car.kmh < 30) return 'Para retomar, esteja acima de 30 km/h.';
    this.cruiseActive = true; this.cruiseI = car.inputs.throttle; this.emit('click');
    return null;
  }
  cancelCruise() { if (this.cruiseActive) { this.cruiseActive = false; this.emit('click'); } }

  // --------------------------------------------------------------- portas
  toggleLock() { this.locked = !this.locked; this.emit('lock'); }
  toggleDoor(car: Car): string | null {
    if (!this.doorOpen && this.locked) return 'A porta está travada. Destrave no botão de trava.';
    if (!this.doorOpen && car.kmh > 3) return 'Não abra a porta com o carro em movimento.';
    this.doorOpen = !this.doorOpen; this.emit('click'); return null;
  }

  // --------------------------------------------------------------- computador de bordo
  tripInfo(): { label: string; value: string; unit: string } {
    const f1 = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const avg = this.tripA.fuel > 0.02 ? this.tripA.dist / this.tripA.fuel : 0;
    switch (this.tripPage) {
      case 0: return { label: 'Hodômetro parcial A', value: f1(this.tripA.dist), unit: 'km' };
      case 1: return { label: 'Hodômetro parcial B', value: f1(this.tripB.dist), unit: 'km' };
      case 2: return { label: 'Consumo médio', value: avg ? f1(avg) : '--,-', unit: 'km/l' };
      case 3: return this.fuelRate > 0 && Math.abs(this.instKmL) > 0
        ? { label: 'Consumo instantâneo', value: f1(Math.min(99.9, this.instKmL)), unit: 'km/l' }
        : { label: 'Consumo instantâneo', value: f1(this.fuelRate), unit: 'l/h' };
      case 4: return { label: 'Autonomia', value: String(Math.round(this.fuel * (avg || 11.5))), unit: 'km' };
      case 5: { const m = Math.floor(this.tripA.time / 60); return { label: 'Tempo de viagem', value: `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`, unit: 'h:min' }; }
      default: return { label: 'Revisão em', value: Math.round(this.serviceKm).toLocaleString('pt-BR'), unit: 'km' };
    }
  }
  nextTrip() { if (this.powerOn) this.tripPage = (this.tripPage + 1) % 7; }
  /** Segurar TRIP zera o parcial exibido (A, B ou consumo médio do A). */
  resetTrip() {
    if (this.tripPage === 1) this.tripB = { dist: 0, fuel: 0, time: 0 };
    else this.tripA = { dist: 0, fuel: 0, time: 0 };
    this.emit('click');
  }

  // --------------------------------------------------------------- multimídia
  radioPower() { if (this.accOn) { this.radioOn = !this.radioOn; this.emit('click'); } }
  nextSource() { if (!this.accOn) return; if (!this.radioOn) { this.radioOn = true; return; } this.source = (this.source + 1) % SOURCES.length; }
  seek(d: 1 | -1) { if (this.radioOn) this.station = (this.station + d + STATIONS.length) % STATIONS.length; }
  vol(d: number) { if (!this.radioOn) return; this.mute = false; this.volume = Math.max(0, Math.min(35, this.volume + d)); }
  toggleMute() { if (this.radioOn) this.mute = !this.mute; }

  // --------------------------------------------------------------- luzes-espia
  lamps(car: Car): Record<string, Lamp> {
    const L: Record<string, Lamp> = {};
    const on = this.powerOn;
    const check = on && this.bulbCheck > 0;
    const running = car.engineOn;
    const set = (k: string, v: boolean | Lamp) => { L[k] = v === true ? 'on' : v === false ? 'off' : v; };
    const blink = this.turnActive && this.blinkOn;
    set('turnL', (this.hazard || this.turn === -1) && blink);
    set('turnR', (this.hazard || this.turn === 1) && blink);
    set('high', this.highBeamOn || (this.flash && on));
    set('low', this.lowBeam);
    set('pos', this.position);
    set('fog', this.fogOn);
    set('battery', on && (check || !running));
    set('oil', on && (check || !running));
    set('engine', on && (check || !running));
    set('brake', on && (check || car.inputs.handbrake));
    set('abs', check);
    set('airbag', check);
    set('tpms', check);
    set('coolant', check);
    set('belt', on && (check || !this.belt) ? (car.kmh > 20 && !this.belt ? 'blink' : 'on') : 'off');
    set('door', this.doorOpen);
    set('fuel', on && (check || this.fuel < 7));
    set('esp', check);
    set('espOff', on && (check || !this.esp));
    set('isgAuto', on && this.isgStopped);
    set('isgOff', on && (check || !this.isg));
    set('cruise', on && this.cruiseMain && !this.limiterMode);
    set('cruiseSet', on && this.cruiseActive && !this.limiterMode);
    set('limiter', on && this.cruiseMain && this.limiterMode);
    set('hac', this.hac > 0);
    return L;
  }

  // --------------------------------------------------------------- atualização
  /** Avança os sistemas. Devolve o acelerador efetivo (piloto automático/limitador). */
  update(dt: number, car: Car, inp: VehicleInputs): number {
    // ignição comanda o motor
    if (!this.powerOn && (car.engineOn || car.cranking > 0)) { car.stopEngine(); car.cranking = 0; }
    if (this.bulbCheck > 0) this.bulbCheck -= dt;
    if (this.fuel <= 0 && car.engineOn) car.stopEngine();

    // setas: ~85 piscadas por minuto
    if (this.turnActive) {
      this.blinkT += dt;
      if (this.blinkT >= 0.35) {
        this.blinkT = 0;
        this.blinkOn = !this.blinkOn;
        this.emit(this.blinkOn ? 'tick' : 'tock');
        if (!this.blinkOn && !this.hazard && !this.turnLatched && this.turnBlinksLeft > 0) {
          this.turnBlinksLeft--;
          if (this.turnBlinksLeft === 0) this.turn = 0;
        }
      }
    } else if (this.blinkOn) { this.blinkOn = false; this.emit('tock'); }

    // limpador dianteiro (ida e volta)
    const wActive = this.accOn && (this.wiper === 'LO' || this.wiper === 'HI' || this.wiper === 'INT' || this.washer || this.extraWipes > 0);
    const wSpeed = this.wiper === 'HI' ? 2.2 : 1.5; // cursos por segundo
    if (this.wiperDir === 0 && wActive) {
      if (this.wiper === 'INT' && !this.washer && this.extraWipes === 0) {
        this.wiperPause -= dt;
        if (this.wiperPause <= 0) { this.wiperDir = 1; this.wiperPause = [0, 8, 5, 3, 1.5][this.wiperInt]; }
      } else this.wiperDir = 1;
    }
    if (this.wiperDir !== 0) {
      this.wiperPos += this.wiperDir * wSpeed * dt;
      if (this.wiperPos >= 1) { this.wiperPos = 1; this.wiperDir = -1; }
      if (this.wiperPos <= 0) {
        this.wiperPos = 0; this.wiperDir = 0;
        if (this.extraWipes > 0) this.extraWipes--;
        if (this.wiper === 'MIST' && this.extraWipes === 0) this.wiper = 'OFF';
      }
    }
    if (this.washer && this.accOn) this.extraWipes = 3;
    // limpador traseiro: intermitente fixo
    const rActive = this.accOn && (this.rearWiper || this.rearWasher);
    if (this.rearDir === 0 && rActive) {
      this.rearPause -= dt;
      if (this.rearPause <= 0 || this.rearWasher) { this.rearDir = 1; this.rearPause = 4; }
    }
    if (this.rearDir !== 0) {
      this.rearWiperPos += this.rearDir * 1.2 * dt;
      if (this.rearWiperPos >= 1) { this.rearWiperPos = 1; this.rearDir = -1; }
      if (this.rearWiperPos <= 0) { this.rearWiperPos = 0; this.rearDir = 0; }
    }

    // climatização e embaçamento
    if (!this.powerOn) { /* ventilador desligado sem ignição */ }
    const fanOn = this.powerOn && this.fan > 0;
    const compressor = fanOn && this.ac && car.engineOn;
    const defrostMode = this.vent >= 3;
    const fogTarget = this.rain > 0 && !compressor && (this.recirc || this.fan < 2) ? 0.7 : 0;
    const clearRate = (compressor ? 0.08 : 0.02) * (defrostMode ? 2.5 : 0.6) * (fanOn ? this.fan / 2 : 0.3);
    if (this.fogGlass < fogTarget) this.fogGlass = Math.min(fogTarget, this.fogGlass + 0.01 * dt * (this.rain + 1));
    else this.fogGlass = Math.max(0, this.fogGlass - clearRate * dt);
    if (this.rearDefrost) {
      this.rearDefrostT -= dt;
      if (this.rearDefrostT <= 0 || !car.engineOn) this.rearDefrost = false;
    }

    // carga de acessórios no motor
    const alternator = 1.5 + (this.lowBeam ? 1 : 0) + (this.rearDefrost ? 2 : 0) + (fanOn ? this.fan * 0.4 : 0);
    car.accessoryTorque = car.engineOn ? alternator + (compressor ? 7 : 0) : 0;

    // trava automática a 20 km/h
    if (!this.locked && !this.doorOpen && car.kmh > 20 && this.powerOn) this.toggleLock();

    // cinto e porta: aviso sonoro
    const warn = this.powerOn && ((!this.belt && car.kmh > 20) || (this.doorOpen && car.kmh > 3));
    if (warn) { this.chimeT -= dt; if (this.chimeT <= 0) { this.chimeT = 1; this.emit('chime'); } } else this.chimeT = 0;

    // HAC: segura o carro 2 s ao soltar o freio parado numa subida
    const uphill = (gearIsForward(car.gear) && car.grade > 0.03) || (car.gear === 'R' && car.grade < -0.03);
    if (this.prevBrake > 0.25 && inp.brake < 0.05 && Math.abs(car.v) < 0.1 && uphill && car.engineOn) this.hac = 2;
    if (this.hac > 0) {
      this.hac -= dt;
      const need = 1180 * 9.81 * Math.abs(Math.sin(Math.atan(car.grade))) * 0.9;
      const drive = Math.abs(car.clutchTorque) * 15 / 0.3;
      if (drive > need || inp.brake > 0.2) this.hac = 0;
    }
    car.hacHold = this.hac > 0;
    this.prevBrake = inp.brake;

    // ISG (Stop&Go): para o motor parado em neutro com a embreagem solta
    if (this.isg && !this.runnerActive && car.engineOn && this.coolant > 70 && Math.abs(car.v) < 0.1 &&
      car.gear === 'N' && inp.clutch < 0.1 && !this.doorOpen && this.belt && !this.rearDefrost) {
      this.isgT += dt;
      if (this.isgT > 1) { this.isgStopped = true; car.stopEngine(); this.emit('isgStop'); this.isgT = 0; }
    } else this.isgT = 0;
    if (this.isgStopped) {
      if (inp.clutch > 0.6 || !this.isg || this.doorOpen) {
        if (!this.doorOpen) { car.startEngine(0.35); this.emit('isgStart'); }
        this.isgStopped = false;
      }
    }

    // piloto automático / limitador
    let throttle = inp.throttle;
    if (this.cruiseActive) {
      if (!this.limiterMode) {
        if (inp.brake > 0.05 || inp.clutch > 0.5 || !car.engineOn || car.kmh < 25) this.cruiseActive = false;
        else {
          const err = this.setSpeed - car.kmh;
          this.cruiseI = Math.max(0, Math.min(1, this.cruiseI + err * 0.05 * dt));
          const cmd = Math.max(0, Math.min(1, this.cruiseI + err * 0.1));
          throttle = Math.max(inp.throttle, cmd);
        }
      } else {
        const err = this.setSpeed - car.kmh;
        const cap = Math.max(0, Math.min(1, 0.25 + err * 0.12));
        throttle = Math.min(inp.throttle, cap);
      }
    }

    // combustível e computador de bordo
    const omega = car.rpm * RPM2RAD;
    if (car.engineOn) {
      const powerKw = Math.max(0, car.load * maxTorque(car.rpm) * omega) / 1000;
      this.fuelRate = 0.45 + (powerKw * 0.29) / 0.745; // L/h (gasolina, ~290 g/kWh)
      if (car.fuelCut || (car.inputs.throttle < 0.02 && car.rpm > 1300 && car.locked)) this.fuelRate = 0; // corte em desaceleração
    } else this.fuelRate = 0;
    const used = (this.fuelRate * dt) / 3600;
    this.fuel = Math.max(0, this.fuel - used);
    const km = (Math.abs(car.v) * dt) / 1000;
    this.odo += km; this.serviceKm -= km;
    for (const t of [this.tripA, this.tripB]) { t.dist += km; t.fuel += used; if (car.engineOn) t.time += dt; }
    this.instKmL = this.fuelRate > 0.05 && car.kmh > 3 ? car.kmh / this.fuelRate : 0;

    // temperatura do motor (aquecimento acelerado para o treino)
    if (car.engineOn) this.coolant += (90 - this.coolant) * (1 - Math.exp(-dt / (car.load > 0.3 ? 40 : 70)));
    else this.coolant += (this.outsideTemp - this.coolant) * (1 - Math.exp(-dt / 900));

    return throttle;
  }
}
