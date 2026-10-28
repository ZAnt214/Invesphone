// Controlador: une física, alavanca, áudio, treino e interface num único loop.
import { Car, type Gear, type SimEvent, GEAR_RATIO, FINAL_DRIVE, WHEEL_R, RPM2RAD } from '../sim/car';
import { Shifter } from '../sim/shifter';
import { Vehicle, STATIONS } from '../sim/vehicle';
import { CarAudio } from '../audio/engineAudio';
import { explain, blockedFeedback, makeFeedback, type Feedback } from '../train/feedback';
import { progress } from '../train/progress';
import { DrillRunner, LessonRunner, DRILLS, LESSONS, type Runner, type SimApi } from '../train/runners';

export type Mode = 'free' | 'learn' | 'drive' | 'panel' | 'progress';

const SUBSTEP = 1 / 240;

export class Sim implements SimApi {
  car = new Car();
  veh = new Vehicle();
  audio = new CarAudio();
  shifter: Shifter;
  mode: Mode = 'free';
  runner: Runner | null = null;
  feedback: Feedback[] = [];
  grade = 0;
  started = false;

  /** Ângulo do volante em graus (positivo = para a direita) e se o dedo está segurando. */
  steer = 0;
  steerDrag = false;

  /** Pedais vindos da interface (0..1). */
  pedals = { throttle: 0, brake: 0, clutch: 0 };

  private frameSubs = new Set<(s: Sim) => void>();
  private uiSubs = new Set<() => void>();
  private raf = 0;
  private last = 0;
  private lastUi = 0;
  private lastSay: Record<string, number> = {};
  private lastShiftDir = 0;
  private leaveRpm = 0;
  version = 0;

  constructor() {
    this.shifter = new Shifter({
      canEngage: (g) => this.car.canEngage(g),
      onGear: (g) => this.onLeverGear(g),
      onBlocked: (reason, g) => {
        if (reason === 'reverseLock') this.audio.tick();
        else this.audio.grind();
        const fb = blockedFeedback(reason, g);
        if (fb.kind === 'grind') { this.runner?.onError('grind'); progress.error('grind'); }
        this.say(fb);
      },
    });
    this.car.reset({ handbrake: true }); // estacionado
    this.car.on((e) => this.onCarEvent(e));
    this.veh.on((t) => {
      switch (t) {
        case 'tick': this.audio.relay(true); break;
        case 'tock': this.audio.relay(false); break;
        case 'chime': this.audio.chime(); break;
        case 'click': this.audio.switchClick(); break;
        case 'compressor': this.audio.switchClick(); break;
        case 'lock': this.audio.lockActuator(); break;
        case 'isgStop':
          this.say({ kind: 'isg', severity: 'info', title: 'Stop&Go desligou o motor', what: 'Parado em neutro com a embreagem solta e o motor quente, o sistema corta o motor para economizar.', fix: 'Pise a embreagem para o motor religar sozinho. O botão ISG OFF desativa a função.' });
          break;
      }
      this.notify();
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const ctx = this.audio.ctx;
        if (!ctx) return;
        if (document.hidden) ctx.suspend().catch(() => {});
        else if (this.started) ctx.resume().catch(() => {});
      });
    }
  }

  now() { return performance.now(); }

  // ---------- assinaturas ----------
  onFrame(fn: (s: Sim) => void) { this.frameSubs.add(fn); return () => { this.frameSubs.delete(fn); }; }
  subscribe(fn: () => void) { this.uiSubs.add(fn); return () => { this.uiSubs.delete(fn); }; }
  notify() { this.version++; this.uiSubs.forEach((f) => f()); }

  // ---------- ciclo ----------
  start() {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0, (t - this.last) / 1000));
      this.last = t;
      this.frame(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** Um quadro da simulação (exposto para testes). */
  frame(dt: number) {
    const c = this.car;
    // giro no momento em que a embreagem foi pisada (avaliação das trocas)
    if (this.pedals.clutch > 0.7 && c.inputs.clutch <= 0.7 && c.gear !== 'N') this.leaveRpm = c.rpm;
    c.inputs.brake = this.pedals.brake;
    c.inputs.clutch = this.pedals.clutch;
    this.veh.runnerActive = !!this.runner && !this.runner.done;
    c.inputs.throttle = this.veh.update(dt, c, this.pedals);
    // volante volta ao centro sozinho com o carro andando (cáster), como no carro real
    if (!this.steerDrag && this.steer !== 0) {
      const k = 1 - Math.exp(-dt * Math.min(4, Math.abs(c.kmh) / 6));
      this.steer -= this.steer * k;
      if (Math.abs(this.steer) < 0.3) this.steer = 0;
    }
    this.veh.steerUpdate(this.steer);
    this.shifter.spring(dt);
    const n = Math.max(1, Math.round(dt / SUBSTEP));
    const h = dt / n;
    const d0 = c.distance;
    for (let i = 0; i < n; i++) c.step(h);
    if (this.mode === 'drive' || this.mode === 'free') progress.addDrive(dt, c.distance - d0);
    this.runner?.tick(dt);

    const ratio = GEAR_RATIO[c.gear] * FINAL_DRIVE;
    this.audio.update({
      rpm: c.rpm, load: c.load, throttle: c.inputs.throttle, engineOn: c.engineOn,
      cranking: c.cranking > 0, kmh: c.kmh, gear: c.gear, coupled: c.engagement > 0.05,
      driveRpm: ((c.v / WHEEL_R) * ratio) / RPM2RAD, clutchSlip: c.engagement > 0.05 && !c.locked ? c.slip : 0,
    }, dt);
    const v = this.veh;
    this.audio.updateCabin({
      fan: v.powerOn ? v.fan : 0,
      wiper: v.wiperPos > 0 && v.wiperPos < 1,
      rain: v.rain,
      kmh: Math.abs(c.kmh),
      radio: v.radioOn && v.accOn && !v.mute ? v.volume / 35 : 0,
      station: v.source === 0 ? v.station : 10 + v.source,
    });
    void STATIONS;
    this.frameSubs.forEach((f) => f(this));
    const now = performance.now();
    if (now - this.lastUi > 120) { this.lastUi = now; this.notify(); }
  }

  // ---------- eventos ----------
  private onLeverGear(g: Gear) {
    const from = this.car.gear;
    const order = (x: Gear) => (x === 'N' ? 0 : x === 'R' ? -1 : Number(x));
    this.car.setGear(g);
    if (g === 'N') this.audio.tick();
    else {
      this.audio.clunk(1);
      this.lastShiftDir = Math.sign(order(g) - this.prevForward);
      if (order(g) > 0) this.prevForward = order(g);
      this.runner?.onGear(from, g, this.leaveRpm);
    }
    this.notify();
  }
  private prevForward = 0;

  private onCarEvent(e: SimEvent) {
    switch (e.type) {
      case 'stall': this.audio.stall(); break;
      case 'jerk': this.audio.thump((e.detail?.magnitude as number) ?? 2); e.detail = { ...e.detail, downshift: this.lastShiftDir < 0 }; break;
      case 'crank': this.audio.click('key'); break;
      case 'limiter': this.audio.limiter(); break;
      case 'startInGear': this.audio.thump(2); break;
    }
    const fb = explain(e);
    if (!fb) return;
    if (fb.severity === 'error' || fb.severity === 'warn') {
      progress.error(fb.kind);
      this.runner?.onError(fb.kind);
    }
    this.say(fb);
  }

  say(f: Omit<Feedback, 'id' | 't'>) {
    const now = this.now();
    const key = f.title;
    if (now - (this.lastSay[key] ?? -1e9) < 2500) return;
    this.lastSay[key] = now;
    this.feedback = [makeFeedback(f, now), ...this.feedback].slice(0, 30);
    this.notify();
  }

  dismissFeedback() { this.feedback = []; this.notify(); }

  // ---------- comandos da interface ----------
  async enterCar() {
    await this.audio.unlock();
    this.started = true;
    this.start();
    this.notify();
  }

  /** Botão Partida/Desligar da cabine: gira a chave até START ou volta para LOCK. */
  ignition() {
    if (this.car.engineOn || this.car.cranking > 0) { this.veh.setIgnition('LOCK', this.car); this.audio.click('key'); }
    else if (!this.veh.crank(this.car)) this.say({ kind: 'fuel', severity: 'error', title: 'Sem combustível', fix: 'Abasteça no painel (Ambiente → Abastecer).' });
    this.notify();
  }

  /** Botão de partida (chave presencial): com embreagem no fundo dá partida; sem ela alterna ACC → ON → desligado. */
  pushStart() {
    const v = this.veh, c = this.car;
    if (c.engineOn || c.cranking > 0) {
      if (Math.abs(c.kmh) < 3) v.setIgnition('LOCK', c);
      else this.say({ kind: 'info', severity: 'warn', title: 'Pare o carro para desligar o motor', fix: 'Com o carro em movimento o motor não deve ser desligado: você perde a assistência da direção e do freio.' });
    } else if (this.pedals.clutch > 0.8) {
      if (!v.crank(c)) this.say({ kind: 'fuel', severity: 'error', title: 'Sem combustível', fix: 'Toque em Abastecer.' });
    } else {
      v.setIgnition(v.ignition === 'LOCK' ? 'ACC' : v.ignition === 'ACC' ? 'ON' : 'LOCK', c);
      if (v.ignition === 'ON') this.say({ kind: 'info', severity: 'info', title: 'Ignição ligada (ON)', fix: 'Para dar a partida, pise a embreagem até o fundo e toque no botão.' });
    }
    this.notify();
  }

  setKey(k: 'LOCK' | 'ACC' | 'ON' | 'START') {
    if (k === 'START') this.ignitionStart();
    else this.veh.setIgnition(k, this.car);
    this.notify();
  }
  private ignitionStart() {
    if (this.car.engineOn) return;
    if (!this.veh.crank(this.car)) this.say({ kind: 'fuel', severity: 'error', title: 'Sem combustível', fix: 'Abasteça no painel (Ambiente → Abastecer).' });
  }

  toggleHandbrake() {
    this.car.inputs.handbrake = !this.car.inputs.handbrake;
    this.audio.click('handbrake');
    this.notify();
  }

  setGrade(g: number) {
    this.grade = g;
    this.car.grade = g;
    this.notify();
  }

  resetCar(opts: Parameters<Car['reset']>[0]) {
    this.car.reset({ ...opts, clutch: this.pedals.clutch });
    this.veh.ignition = opts?.engineOn ? 'ON' : 'LOCK';
    this.veh.isgStopped = false;
    this.veh.cruiseActive = false;
    this.veh.hac = 0;
    this.prevForward = 0;
    this.notify();
  }

  setMode(m: Mode) {
    this.mode = m;
    if (m === 'free' || m === 'panel') { this.runner = null; this.car.grade = this.grade; }
    this.notify();
  }

  startDrill(id: string) {
    const def = DRILLS.find((d) => d.id === id)!;
    this.feedback = [];
    this.runner = new DrillRunner(def, this);
    this.notify();
  }

  startLesson(id: string) {
    const def = LESSONS.find((d) => d.id === id)!;
    this.feedback = [];
    this.runner = new LessonRunner(def, this);
    this.notify();
  }

  stopRunner() {
    this.runner = null;
    this.notify();
  }
}

export const sim = new Sim();
// acesso para depuração/testes automatizados
if (typeof window !== 'undefined') (window as unknown as { __sim: Sim }).__sim = sim;
