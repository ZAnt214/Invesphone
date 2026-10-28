// Física do carro: motor, embreagem por atrito, câmbio de 5 marchas + ré, veículo.
// Unidades SI. Tudo puro (sem DOM), testável em Node.

export type Gear = 'N' | '1' | '2' | '3' | '4' | '5' | 'R';
export const FORWARD_GEARS: Gear[] = ['1', '2', '3', '4', '5'];

export const GEAR_RATIO: Record<Gear, number> = {
  N: 0, '1': 3.545, '2': 1.952, '3': 1.276, '4': 0.943, '5': 0.744, R: -3.417,
};
export const FINAL_DRIVE = 4.25;
export const WHEEL_R = 0.3; // m
export const MASS = 1180; // kg (carro 1.6 + motorista)
export const G_ACC = 9.81;
export const ENGINE_INERTIA = 0.17; // kg·m² (virabrequim + volante)
export const CLUTCH_MAX_TORQUE = 290; // N·m
export const IDLE_RPM = 850;
export const REDLINE_RPM = 6300;
export const LIMITER_RPM = 6600;
export const STALL_RPM = 420;
export const OVERREV_RPM = 7200;

export const RPM2RAD = (Math.PI * 2) / 60;

// Pedal da embreagem: 0 = solto (acoplado), 1 = no fundo (desacoplado).
export const CLUTCH_FREE = 0.78; // acima disso: totalmente desacoplada
export const CLUTCH_FULL = 0.08; // abaixo disso: totalmente acoplada
/** Faixa do ponto de acoplamento (onde o carro começa a "puxar"). */
export const BITE_ZONE: [number, number] = [0.47, 0.63];

const TORQUE_TABLE: [number, number][] = [
  [0, 55], [800, 98], [1500, 123], [2500, 140], [3500, 148], [4200, 151],
  [5200, 144], [6000, 131], [6600, 112], [7500, 80],
];

export function maxTorque(rpm: number): number {
  if (rpm <= TORQUE_TABLE[0][0]) return TORQUE_TABLE[0][1];
  for (let i = 1; i < TORQUE_TABLE.length; i++) {
    const [r1, t1] = TORQUE_TABLE[i];
    if (rpm <= r1) {
      const [r0, t0] = TORQUE_TABLE[i - 1];
      return t0 + ((t1 - t0) * (rpm - r0)) / (r1 - r0);
    }
  }
  return TORQUE_TABLE[TORQUE_TABLE.length - 1][1];
}

/** Atrito interno + bombeamento (freio-motor). */
export function frictionTorque(rpm: number): number {
  const r = Math.max(0, rpm);
  return 8 + 0.0036 * r + 3.2e-7 * r * r;
}

/** Fração de torque que a embreagem transmite (0..1) para a posição do pedal. */
export function clutchEngagement(pedal: number): number {
  if (pedal >= CLUTCH_FREE) return 0;
  if (pedal <= CLUTCH_FULL) return 1;
  const t = (CLUTCH_FREE - pedal) / (CLUTCH_FREE - CLUTCH_FULL);
  return t * t;
}

export function gearIsForward(g: Gear) {
  return g !== 'N' && g !== 'R';
}

/** Velocidade (km/h) de equilíbrio do eixo para um dado rpm em uma marcha. */
export function speedAtRpm(gear: Gear, rpm: number): number {
  const ratio = Math.abs(GEAR_RATIO[gear] * FINAL_DRIVE);
  if (!ratio) return 0;
  return ((rpm * RPM2RAD) / ratio) * WHEEL_R * 3.6;
}
export function rpmAtSpeed(gear: Gear, kmh: number): number {
  const ratio = Math.abs(GEAR_RATIO[gear] * FINAL_DRIVE);
  return ((kmh / 3.6 / WHEEL_R) * ratio) / RPM2RAD;
}

export interface Inputs {
  throttle: number; // 0..1
  brake: number; // 0..1
  clutch: number; // 0..1 (1 = pedal no fundo)
  handbrake: boolean;
}

export type SimEventType =
  | 'stall' | 'jerk' | 'grind' | 'overrev' | 'lugging' | 'redline'
  | 'start' | 'crank' | 'startInGear' | 'crankFail' | 'rollback'
  | 'engage' | 'reverseLock' | 'limiter';

export interface SimEvent {
  type: SimEventType;
  t: number;
  detail?: Record<string, unknown>;
}

export interface EngineEngageCheck {
  ok: boolean;
  reason?: 'clutch' | 'moving';
}

export class Car {
  t = 0;
  gear: Gear = 'N';
  omegaE = 0; // rad/s do motor
  v = 0; // m/s, positivo = para frente
  engineOn = false;
  cranking = 0; // s restantes de partida
  grade = 0; // inclinação (0.1 = 10% de subida)
  inputs: Inputs = { throttle: 0, brake: 0, clutch: 0, handbrake: false };

  // estado derivado (para painel/áudio)
  locked = false;
  effThrottle = 0;
  load = 0; // 0..1 carga do motor
  clutchTorque = 0;
  slip = 0;
  accel = 0;
  aFast = 0;
  aSlow = 0;
  shake = 0; // sacudida da carroceria (tranco)
  distance = 0; // m percorridos (com sinal)
  fuelCut = false;
  stallSpin = 0;
  catchTime = 0; // motor acabou de pegar
  accessoryTorque = 0; // carga de A/C, alternador etc. (N·m no virabrequim)
  hacHold = false; // assistente de partida em rampa segurando o freio

  private listeners: ((e: SimEvent) => void)[] = [];
  private cooldown: Partial<Record<SimEventType, number>> = {};
  private lugTime = 0;
  private redTime = 0;
  clutchHist: { t: number; p: number }[] = [];
  private throttleHist: { t: number; p: number }[] = [];

  on(fn: (e: SimEvent) => void) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((f) => f !== fn); };
  }

  emit(type: SimEventType, detail?: Record<string, unknown>, cooldown = 0) {
    if (cooldown) {
      const until = this.cooldown[type] ?? -1;
      if (this.t < until) return;
      this.cooldown[type] = this.t + cooldown;
    }
    const ev: SimEvent = { type, t: this.t, detail };
    for (const l of this.listeners) l(ev);
  }

  get rpm() { return this.omegaE / RPM2RAD; }
  get kmh() { return this.v * 3.6; }
  get engagement() { return this.gear === 'N' ? 0 : clutchEngagement(this.inputs.clutch); }

  reset(opts: Partial<{ gear: Gear; kmh: number; engineOn: boolean; grade: number; handbrake: boolean; clutch: number }> = {}) {
    this.gear = opts.gear ?? 'N';
    this.v = (opts.kmh ?? 0) / 3.6;
    this.engineOn = opts.engineOn ?? false;
    this.cranking = 0;
    this.grade = opts.grade ?? 0;
    this.inputs = { throttle: 0, brake: 0, clutch: opts.clutch ?? 0, handbrake: opts.handbrake ?? false };
    this.locked = false;
    this.fuelCut = false;
    this.distance = 0;
    this.accel = this.aFast = this.aSlow = this.shake = 0;
    this.lugTime = this.redTime = 0;
    this.clutchHist = [];
    this.throttleHist = [];
    this.cooldown = {};
    if (this.engineOn) {
      const ratio = Math.abs(GEAR_RATIO[this.gear] * FINAL_DRIVE);
      const coupled = ratio > 0 && clutchEngagement(this.inputs.clutch) > 0.5;
      this.omegaE = coupled ? Math.max(IDLE_RPM * RPM2RAD, (Math.abs(this.v) / WHEEL_R) * ratio) : IDLE_RPM * RPM2RAD;
      this.locked = coupled;
    } else {
      this.omegaE = 0;
    }
  }

  /** O sincronizador permite engatar? (chamado pela alavanca) */
  canEngage(g: Gear): EngineEngageCheck {
    if (g === 'N') return { ok: true };
    if (g === 'R' && this.v > 0.6) return { ok: false, reason: 'moving' };
    if (g !== 'R' && this.v < -1.0) return { ok: false, reason: 'moving' };
    const e = clutchEngagement(this.inputs.clutch);
    const spinning = this.engineOn || this.cranking > 0;
    if (e > 0.02 && (spinning || Math.abs(this.v) > 0.3)) return { ok: false, reason: 'clutch' };
    return { ok: true };
  }

  setGear(g: Gear) {
    if (g === this.gear) return;
    const prev = this.gear;
    this.gear = g;
    this.locked = false;
    if (g !== 'N') this.emit('engage', { gear: g, from: prev });
  }

  startEngine(duration = 0.75) {
    if (this.engineOn || this.cranking > 0) return;
    this.cranking = duration;
    const e = this.engagement;
    this.emit('crank', { inGear: e > 0.3 });
    if (e > 0.3) this.emit('startInGear', { gear: this.gear });
  }

  stopEngine() {
    if (!this.engineOn) return;
    this.engineOn = false;
  }

  /** Avança a simulação. Use dt pequeno (≤ 1/120). */
  step(dt: number) {
    this.t += dt;
    const inp = this.inputs;
    this.recordInputs();

    const ratio = GEAR_RATIO[this.gear] * FINAL_DRIVE;
    const e = this.gear === 'N' ? 0 : clutchEngagement(inp.clutch);
    const rpm = this.rpm;

    // --- Torque do motor ---
    let Te: number;
    let thr = 0;
    if (this.cranking > 0) {
      this.cranking -= dt;
      const starter = Math.max(0, 70 * (1 - rpm / 320));
      Te = starter - frictionTorque(rpm) - 12;
      if (this.cranking <= 0) {
        this.cranking = 0;
        // Engrenado e com embreagem solta, o motor de partida só dá trancos no carro.
        if (rpm > 170 && e < 0.3) {
          this.engineOn = true;
          this.fuelCut = false;
          this.catchTime = 0.7;
          this.emit('start');
        } else {
          this.emit('crankFail', { gear: this.gear });
        }
      }
    } else if (this.engineOn) {
      thr = inp.throttle;
      if (this.catchTime > 0) this.catchTime -= dt;
      // Controle de marcha lenta / anti-stall: compensa carga quando o giro cai.
      const idleCap = this.catchTime > 0 ? 0.7 : 0.62;
      const idle = Math.min(idleCap, Math.max(0, 0.13 + (IDLE_RPM - rpm) * 0.0017));
      thr = Math.max(thr, idle);
      if (rpm > LIMITER_RPM) { if (!this.fuelCut) this.emit('limiter', undefined, 0.5); this.fuelCut = true; }
      if (rpm < LIMITER_RPM - 220) this.fuelCut = false;
      if (this.fuelCut) thr = 0;
      Te = thr * maxTorque(rpm) - frictionTorque(rpm) - this.accessoryTorque;
    } else {
      Te = rpm > 1 ? -frictionTorque(rpm) - 25 : 0;
    }
    this.effThrottle = thr;

    // --- Forças no veículo ---
    const theta = Math.atan(this.grade);
    const Fgrade = -MASS * G_ACC * Math.sin(theta);
    const Fdrag = -0.5 * 1.2 * 0.66 * this.v * Math.abs(this.v);
    const Frr = 0.012 * MASS * G_ACC * Math.cos(theta);
    const Fbrake = inp.brake * 0.95 * MASS * G_ACC + (inp.handbrake ? 0.42 * MASS * G_ACC : 0) + (this.hacHold ? 0.5 * MASS * G_ACC : 0);

    const prevV = this.v;
    const engineRunning = this.engineOn || this.cranking > 0;

    if (ratio === 0 || e <= 0.0005) {
      // Desacoplado
      this.locked = false;
      this.clutchTorque = 0;
      this.omegaE = Math.max(0, this.omegaE + (Te / ENGINE_INERTIA) * dt);
      this.vehicleStep(0, Fgrade + Fdrag, Frr + Fbrake, dt);
    } else if (!engineRunning) {
      // Motor desligado e engrenado: compressão segura o carro.
      const hold = (28 + frictionTorque(rpm)) * e * Math.abs(ratio) / WHEEL_R;
      this.vehicleStep(0, Fgrade + Fdrag, Frr + Fbrake + hold, dt);
      const wt = Math.abs((this.v / WHEEL_R) * ratio);
      this.omegaE = e > 0.4 ? wt : Math.max(0, this.omegaE + (Te / ENGINE_INERTIA) * dt);
      this.locked = e > 0.4;
      this.clutchTorque = 0;
    } else {
      const Tc = e * CLUTCH_MAX_TORQUE;
      const wt = (this.v / WHEEL_R) * ratio;
      const slip = this.omegaE - wt;
      let done = false;
      if (this.locked || Math.abs(slip) < 3) {
        const Ieq = ENGINE_INERTIA + (MASS * WHEEL_R * WHEEL_R) / (ratio * ratio);
        const sv = Math.abs(this.v) > 0.05 ? Math.sign(this.v) : Math.sign(ratio);
        const Fres = Fgrade + Fdrag - sv * (Frr + Fbrake);
        const alpha = (Te + (Fres * WHEEL_R) / ratio) / Ieq;
        const Treq = Te - ENGINE_INERTIA * alpha;
        if (Math.abs(Treq) <= Tc) {
          this.locked = true;
          this.omegaE = wt + alpha * dt;
          this.v = (this.omegaE / ratio) * WHEEL_R;
          this.clutchTorque = Treq;
          done = true;
        } else {
          this.locked = false;
        }
      }
      if (!done) {
        const Tcl = Tc * Math.max(-1, Math.min(1, slip / 2));
        this.omegaE += ((Te - Tcl) / ENGINE_INERTIA) * dt;
        this.clutchTorque = Tcl;
        this.vehicleStep((Tcl * ratio) / WHEEL_R, Fgrade + Fdrag, Frr + Fbrake, dt);
        const wt2 = (this.v / WHEEL_R) * ratio;
        if (Math.sign(this.omegaE - wt2) !== Math.sign(slip) && e > 0.05) this.locked = true;
      }
      this.slip = slip;
    }

    this.slip = ratio ? this.omegaE - (this.v / WHEEL_R) * ratio : 0;
    this.distance += this.v * dt;

    // carga: fração da borboleta efetiva (combustão), usada no áudio
    this.load = this.engineOn && !this.fuelCut ? thr : 0;

    // --- Aceleração, tranco ---
    this.accel = (this.v - prevV) / dt;
    const kf = 1 - Math.exp(-dt / 0.04);
    const ks = 1 - Math.exp(-dt / 0.3);
    this.aFast += (this.accel - this.aFast) * kf;
    this.aSlow += (this.accel - this.aSlow) * ks;
    const jerk = this.aFast - this.aSlow;
    this.shake = jerk;
    if (Math.abs(jerk) > 2.3 && this.engineOn) {
      this.emit('jerk', { magnitude: Math.abs(jerk), gear: this.gear, clutchDrop: this.clutchDrop(0.4), rpm: this.rpm, kmh: this.kmh }, 1.2);
    }

    // --- Diagnósticos ---
    const r = this.rpm;
    if (this.engineOn && r < (this.catchTime > 0 ? 120 : STALL_RPM) && this.cranking <= 0) {
      this.engineOn = false;
      this.stallSpin = 0.6;
      this.emit('stall', this.stallContext());
    }
    if (this.stallSpin > 0) this.stallSpin -= dt;

    if (r > OVERREV_RPM) this.emit('overrev', { rpm: Math.round(r), gear: this.gear, kmh: Math.round(this.kmh) }, 3);

    if (this.engineOn && gearIsForward(this.gear) && this.locked && r < 1150 && inp.throttle > 0.4) {
      this.lugTime += dt;
      if (this.lugTime > 1.2) this.emit('lugging', { gear: this.gear, rpm: Math.round(r), kmh: Math.round(this.kmh) }, 6);
    } else this.lugTime = 0;

    if (this.engineOn && r > 6150) {
      this.redTime += dt;
      if (this.redTime > 1.5) this.emit('redline', { gear: this.gear }, 6);
    } else this.redTime = 0;

    if (this.engineOn && gearIsForward(this.gear) && this.v < -0.4) {
      this.emit('rollback', { kmh: this.kmh }, 4);
    }
  }

  /** Integra o veículo com atrito estático (freios/rolamento seguram o carro parado). */
  private vehicleStep(Fdrive: number, Factive0: number, Fopp: number, dt: number) {
    const Factive = Fdrive + Factive0;
    if (Math.abs(this.v) < 0.02) {
      if (Math.abs(Factive) <= Fopp) { this.v = 0; return; }
      const a = (Factive - Math.sign(Factive) * Fopp) / MASS;
      this.v += a * dt;
      return;
    }
    const a = (Factive - Math.sign(this.v) * Fopp) / MASS;
    const nv = this.v + a * dt;
    if (Math.sign(nv) !== Math.sign(this.v) && Math.abs(Factive) <= Fopp) this.v = 0;
    else this.v = nv;
  }

  private recordInputs() {
    const h = this.clutchHist;
    h.push({ t: this.t, p: this.inputs.clutch });
    while (h.length && this.t - h[0].t > 1.0) h.shift();
    const th = this.throttleHist;
    th.push({ t: this.t, p: this.inputs.throttle });
    while (th.length && this.t - th[0].t > 1.0) th.shift();
  }

  /** Quanto o pedal subiu (soltou) na janela de tempo. */
  clutchDrop(window: number): number {
    let max = this.inputs.clutch;
    for (const s of this.clutchHist) if (this.t - s.t <= window) max = Math.max(max, s.p);
    return max - this.inputs.clutch;
  }

  private avgThrottle(window: number): number {
    let sum = 0, n = 0;
    for (const s of this.throttleHist) if (this.t - s.t <= window) { sum += s.p; n++; }
    return n ? sum / n : 0;
  }

  stallContext(): Record<string, unknown> {
    const kmh = this.kmh;
    const drop = this.clutchDrop(0.5);
    let cause: string;
    const gearMin: Record<string, number> = { '3': 18, '4': 28, '5': 38 };
    if (this.inputs.handbrake && this.gear !== 'N') cause = 'handbrake';
    else if (this.inputs.brake > 0.2 && drop < 0.25 && Math.abs(kmh) < 25) cause = 'stoppedInGear';
    else if (gearMin[this.gear] !== undefined && Math.abs(kmh) < gearMin[this.gear]) cause = 'highGear';
    else if (this.gear === '2' && Math.abs(kmh) < 3) cause = 'highGear';
    else if (drop > 0.3) cause = 'fastRelease';
    else if (this.grade > 0.03 && this.avgThrottle(0.6) < 0.2) cause = 'noThrottleHill';
    else if (this.avgThrottle(0.6) < 0.12) cause = 'noThrottle';
    else cause = 'fastRelease';
    return { cause, gear: this.gear, kmh: Math.round(kmh), drop: Math.round(drop * 100) / 100, grade: this.grade };
  }
}
