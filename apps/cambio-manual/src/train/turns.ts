// Treino de conversões (virar à direita e à esquerda) na cidade, como na autoescola:
// retrovisor → seta → reduzir → posicionar → virar na hora certa → desvirar → seguir na faixa.
// Avalia cada etapa, guarda a trajetória para o replay de cima e pode demonstrar sozinho.
import type { Car, Gear } from '../sim/car';
import type { Vehicle } from '../sim/vehicle';
import type { Shifter } from '../sim/shifter';
import type { Feedback } from './feedback';
import type { Runner } from './runners';
import {
  CITY, CARGEO, IDEAL, type CityDrive, type Maneuver, type Turn,
  toLocal, fromLocal, exitHeading, idealWorld, pursuit, wrapAngle, carPoint, corners, fwdV, steerFor,
} from '../sim/city';

export interface TurnApi {
  car: Car; veh: Vehicle; city: CityDrive; shifter: Shifter;
  pedals: { throttle: number; brake: number; clutch: number };
  steer: number; steerDrag: boolean;
  now(): number;
  say(f: Omit<Feedback, 'id' | 't'>): void;
  resetCar(opts: Parameters<Car['reset']>[0]): void;
  glance(id: 'L' | 'R' | 'I'): void;
}

export type CourseId = 'right' | 'left' | 'block' | 'mixed';
export const COURSES: Record<CourseId, { title: string; desc: string; turns: Turn[] }> = {
  right: { title: 'Virar à direita', desc: 'Uma conversão à direita, repetindo até pegar o ponto.', turns: ['R'] },
  left: { title: 'Virar à esquerda', desc: 'Uma conversão à esquerda em rua de mão dupla.', turns: ['L'] },
  block: { title: 'Volta no quarteirão', desc: 'Quatro conversões à direita seguidas.', turns: ['R', 'R', 'R', 'R'] },
  mixed: { title: 'Percurso misto', desc: 'Direita, esquerda e reto alternados.', turns: ['R', 'L', 'S', 'L', 'R', 'L'] },
};

export interface TrailPt { lx: number; lz: number; hl: number; kmh: number; steer: number }
export interface Mark { lx: number; lz: number; kind: 'glance' | 'signal' | 'brake' | 'start' | 'curb' | 'stall' }
export interface Item { key: string; label: string; value: string; ok: boolean | null; tip?: string }
export interface TurnResult { turn: Turn; m: Maneuver; items: Item[]; trail: TrailPt[]; marks: Mark[]; faults: number; tip: string | null }

/** O volante leva ~1 s para girar: começa-se a virar uns 1,8 m antes do início do arco. */
const LEAD = 1.8;
const DIR = (t: Turn) => (t === 'R' ? 1 : t === 'L' ? -1 : 0);
const SIDE = (t: Turn) => (t === 'R' ? 'direita' : 'esquerda');
const m1 = (x: number) => x.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

/** Estado de uma conversão em andamento. */
interface Cur {
  m: Maneuver;
  path: [number, number][];
  trail: TrailPt[]; marks: Mark[];
  trailT: number;
  glance: number | null; // distância à esquina quando olhou
  glanceI: boolean;
  signal: number | null; signalWrong: boolean;
  brake: number | null;
  started: { lz: number; lx: number; kmh: number; gear: Gear } | null;
  /** onde o volante passou da metade do giro necessário (mede a hora de virar) */
  halfLz: number | null;
  maxKmh: number; minKmh: number; turnGear: Gear | null;
  clutchT: number;
  curb: number; opened: boolean; cut: boolean; crossedCenter: boolean;
  over: number; reached: boolean;
  stalled: boolean;
  doneAt: number | null;
  demoGlance: boolean;
}

export class TurnTrainer implements Runner {
  kind = 'turn' as const;
  id: CourseId;
  title: string;
  blind = false;
  done = false;
  stepIndex = 0;
  results: TurnResult[] = [];
  readonly demo: boolean;
  readonly guides: boolean;
  private turns: Turn[];
  private cur!: Cur;
  private demoSteer = 0;

  constructor(course: CourseId, opts: { guides: boolean; demo: boolean }, private api: TurnApi) {
    this.id = course;
    this.title = COURSES[course].title;
    this.turns = COURSES[course].turns;
    this.demo = opts.demo;
    this.guides = opts.guides || opts.demo;
    const c = api.city;
    c.active = true;
    c.place({ x: CITY.lane / 2, z: -72, h: 0 });
    api.resetCar({ engineOn: true, gear: '2', kmh: 25 });
    api.shifter.place('2');
    api.veh.setTurn(0, false);
    api.veh.hazard = false;
    api.steer = 0;
    api.steerDrag = this.demo;
    this.begin({ cx: 0, cz: 0, H: 0, turn: this.turns[0] });
  }

  get stepCount() { return this.turns.length; }
  get turn() { return this.cur.m.turn; }

  private begin(m: Maneuver) {
    this.cur = {
      m, path: idealWorld(m, -95, 45), trail: [], marks: [], trailT: 0,
      glance: null, glanceI: false, halfLz: null, signal: null, signalWrong: false, brake: null, started: null,
      maxKmh: 0, minKmh: 99, turnGear: null, clutchT: 0, curb: 0, opened: false, cut: false, crossedCenter: false,
      over: 0, reached: false, stalled: false, doneAt: null, demoGlance: false,
    };
  }

  // ------------------------------------------------------------ geometria do momento
  private local() {
    const p = this.api.city.pose, m = this.cur.m;
    const [lx, lz] = toLocal(m, p.x, p.z);
    const hl = wrapAngle(p.h - m.H);
    return { lx, lz, hl };
  }
  /** Distância da frente do carro até a borda do cruzamento (m). */
  private edgeDist(lz: number) { return -(lz + CARGEO.front) - CITY.W / 2; }

  get instruction(): string {
    if (this.done) return 'Treino concluído';
    const t = this.turn, { lz, lx, hl } = this.local();
    const d = this.edgeDist(lz), c = this.cur, v = this.api.veh, car = this.api.car;
    const who = this.demo ? 'Instrutor: ' : '';
    if (t === 'S') return d > 0 ? `${who}No próximo cruzamento, siga reto (${Math.round(d)} m)` : `${who}Siga reto e mantenha a faixa`;
    const side = SIDE(t), dir = DIR(t);
    if (c.started) {
      const left = Math.abs(wrapAngle(hl - dir * Math.PI / 2));
      if (left < 0.5) return `${who}Agora desvire: deixe o volante voltar e acelere suave`;
      return `${who}Segure o volante girado e acompanhe a curva`;
    }
    if (d > 50) return `${who}Na próxima esquina, vire à ${side} (${Math.round(d)} m)`;
    if (c.glance === null) return t === 'R' ? `${who}Olhe o retrovisor direito (toque nele)` : `${who}Olhe o retrovisor esquerdo e o interno (toque neles)`;
    if (!(v.turnActive && v.turn === dir)) return `${who}Ligue a seta para a ${side} (alavanca esquerda para ${t === 'R' ? 'cima' : 'baixo'})`;
    if (Math.abs(car.kmh) > 20) return `${who}Reduza: freio suave até uns 15 km/h, ainda reto`;
    const fg = Number(car.gear);
    if (fg >= 3) return `${who}Reduza para a 2ª marcha`;
    if (t === 'R' && CITY.W / 2 - (lx + CARGEO.halfW) > 1.2) return `${who}Encoste perto do meio-fio direito`;
    if (t === 'L' && lx - CARGEO.halfW > 1.2) return `${who}Encoste perto da faixa amarela do meio (sem passar dela)`;
    const startAt = IDEAL[t].start;
    if (this.guides && lz > startAt - LEAD) return `${who}VIRE AGORA: ${t === 'R' ? 'cerca de 1 volta' : 'cerca de 3/4 de volta'} no volante`;
    if (this.guides) return t === 'R' ? `${who}Mantenha 15 km/h; vire quando o cone ficar na altura do seu ombro` : `${who}Mantenha a velocidade; vire quando a frente chegar na marca laranja`;
    return `${who}Pronto para virar: escolha o ponto certo`;
  }
  get hint() {
    if (this.turn === 'R') return 'Na direita a curva é fechada: fique a meio metro do meio-fio e gire cerca de 1 volta quando a quina da calçada estiver ao lado do seu ombro.';
    if (this.turn === 'L') return 'Na esquerda a curva é aberta: avance até a frente entrar no cruzamento, perto do meio, e não corte a curva.';
    return undefined;
  }

  onGear() { /* não usado */ }
  onError(kind: string) {
    if (kind === 'stall' && this.cur && !this.cur.stalled) { this.cur.stalled = true; const { lx, lz } = this.local(); this.cur.marks.push({ lx, lz, kind: 'stall' }); }
  }
  onCurb() {
    const { lx, lz } = this.local();
    this.cur.curb++;
    this.cur.marks.push({ lx, lz, kind: 'curb' });
  }
  /** O aluno tocou num retrovisor (olhou). */
  onGlance(id: 'L' | 'R' | 'I') {
    const t = this.turn, { lz } = this.local(), c = this.cur;
    if (id === 'I') { c.glanceI = true; }
    const want = t === 'R' ? 'R' : 'L';
    if ((id === want || (t === 'S')) && c.glance === null && !c.started) {
      c.glance = this.edgeDist(lz);
      const { lx } = this.local();
      c.marks.push({ lx, lz, kind: 'glance' });
    }
  }

  // ------------------------------------------------------------ quadro a quadro
  tick(dt: number) {
    if (this.done) return;
    const api = this.api, c = this.cur, car = api.car, v = api.veh;
    const t = c.m.turn, dir = DIR(t);
    const { lx, lz, hl } = this.local();
    const kmh = Math.abs(car.kmh);
    const d = this.edgeDist(lz);

    // trilha para o replay
    c.trailT -= dt;
    if (c.trailT <= 0) { c.trailT = 0.1; c.trail.push({ lx, lz, hl, kmh, steer: api.steer }); }

    // guias: trajetória ideal, ponto de referência e alvo do volante
    if (this.guides && t !== 'S') {
      const g = IDEAL[t];
      const mk = t === 'R' ? fromLocal(c.m, CITY.W / 2 + 0.35, g.start - LEAD + CARGEO.eyeFwd) : fromLocal(c.m, g.x0, g.start - LEAD + CARGEO.front);
      api.city.guide = c.started && Math.abs(wrapAngle(hl - dir * Math.PI / 2)) < 0.3 ? null : { path: c.path, mark: c.started ? null : { x: mk[0], z: mk[1], kind: t === 'R' ? 'cone' : 'spot' } };
      api.city.steerTarget = lz > g.start - 3 && !c.doneAt ? pursuit(api.city.pose, c.path, Math.max(3, kmh / 3.6 * 0.9)).steer : null;
    } else { api.city.guide = null; api.city.steerTarget = null; }

    if (this.demo) this.drive(dt, lz, hl, d);

    if (t !== 'S') {
      // seta
      if (v.turnActive && !v.hazard && v.turn === dir && c.signal === null && !c.started) { c.signal = d; c.marks.push({ lx, lz, kind: 'signal' }); }
      if (v.turnActive && !v.hazard && v.turn === -dir && !c.started) c.signalWrong = true;
      // freio
      if (c.brake === null && car.inputs.brake > 0.1 && d < 70 && !c.started) { c.brake = d; c.marks.push({ lx, lz, kind: 'brake' }); }
      // início da virada
      if (!c.started && api.steer * dir > 60 && lz > -25) {
        c.started = { lz, lx, kmh, gear: car.gear };
      }
      if (c.started && c.halfLz === null && api.steer * dir > 0.5 * TurnTrainer.wheelFor(t)) {
        c.halfLz = lz;
        c.marks.push({ lx, lz, kind: 'start' });
      }
      if (c.started && !c.reached) {
        c.maxKmh = Math.max(c.maxKmh, kmh);
        if (kmh > 2) c.minKmh = Math.min(c.minKmh, kmh);
        if (!c.turnGear || car.gear === 'N') c.turnGear = car.gear;
        if (api.pedals.clutch > 0.6 && kmh > 3) c.clutchT += dt;
      }
      const err = wrapAngle(hl - dir * Math.PI / 2);
      if (c.started && Math.abs(err) < 0.17) c.reached = true;
      if (c.reached) c.over = Math.max(c.over, err * dir);
      // invasões, pelos cantos da carroceria (no referencial local)
      for (const [x, z] of corners(api.city.pose)) {
        const [cx, cz] = toLocal(c.m, x, z);
        const inNew = t === 'R' ? cx > CITY.W / 2 + 0.3 : cx < -CITY.W / 2 - 0.3;
        if (t === 'R' && inNew && cz > 0.15) c.opened = true;
        if (t === 'L' && inNew && cz < -0.15) c.cut = true;
        if (!c.started && cz < -CITY.W / 2 - 1 && cx < -0.15) c.crossedCenter = true;
      }
    }

    // fim da conversão: 18 m dentro da rua nova (ou passou reto / voltou)
    const out = t === 'R' ? lx > 18 : t === 'L' ? lx < -18 : lz > 20;
    const wrong = (t !== 'S' && lz > 22) || (t === 'S' && Math.abs(lx) > 18);
    if ((out || wrong) && c.doneAt === null) c.doneAt = api.now();
    if (c.doneAt !== null && api.now() - c.doneAt > 600) this.finishTurn(lx, lz, hl, wrong);
  }

  /** Instrutor dirigindo: perseguição da trajetória ideal e controle de velocidade em 2ª. */
  private drive(dt: number, lz: number, hl: number, d: number) {
    const api = this.api, c = this.cur, t = c.m.turn, dir = DIR(t);
    const kmh = Math.abs(api.car.kmh);
    // volante: 360°/s no máximo, como um motorista calmo
    const look = Math.max(3.2, (kmh / 3.6) * 0.9);
    const target = pursuit(api.city.pose, c.path, look).steer;
    const step = 360 * dt;
    this.demoSteer += Math.max(-step, Math.min(step, target - this.demoSteer));
    api.steer = this.demoSteer;
    api.steerDrag = true;
    // retrovisor e seta
    if (t !== 'S' && !c.demoGlance && d < 58) { c.demoGlance = true; api.glance(t === 'R' ? 'R' : 'L'); this.onGlance(t === 'R' ? 'R' : 'L'); }
    if (t !== 'S' && c.signal === null && d < 48 && c.glance !== null) api.veh.setTurn(dir as -1 | 1, true);
    // velocidade alvo
    let vt = 25;
    if (t !== 'S') {
      if (c.started && Math.abs(wrapAngle(hl - dir * Math.PI / 2)) < 0.45) vt = 22;
      else if (c.started || d < 14) vt = t === 'R' ? 14 : 16;
      else if (d < 40) vt = 14 + (d - 14) * (11 / 26);
    }
    const e = vt - kmh;
    api.pedals.clutch = 0;
    if (e < -1.5) { api.pedals.throttle = 0; api.pedals.brake = Math.min(0.45, -e * 0.08); }
    else { api.pedals.brake = 0; api.pedals.throttle = Math.max(0.04, Math.min(0.5, 0.12 + e * 0.05)); }
  }

  private finishTurn(lx: number, lz: number, hl: number, wrong: boolean) {
    const c = this.cur, t = c.m.turn, api = this.api;
    const r = this.evaluate(lx, lz, hl, wrong);
    this.results.push(r);
    if (this.demo) { api.pedals.throttle = 0; api.pedals.brake = 0; }
    const next = this.stepIndex + 1;
    if (next >= this.turns.length) {
      this.stepIndex = next;
      this.done = true;
      api.city.guide = null; api.city.steerTarget = null;
      if (this.demo) { api.steerDrag = false; api.pedals.brake = 0.3; }
      return;
    }
    this.stepIndex = next;
    api.say({ kind: 'turn', severity: r.faults ? 'warn' : 'ok', title: r.faults ? `Conversão ${next}: ${r.faults} ${r.faults === 1 ? 'ponto a melhorar' : 'pontos a melhorar'}` : `Conversão ${next}: perfeita`, fix: r.tip ?? undefined });
    // próximo cruzamento, na direção em que o carro saiu
    const H = exitHeading(c.m);
    const [fx, fz] = fwdV(H);
    const nx = Math.round((c.m.cx + fx * CITY.P) / CITY.P) * CITY.P, nz = Math.round((c.m.cz + fz * CITY.P) / CITY.P) * CITY.P;
    void t;
    this.begin({ cx: nx, cz: nz, H, turn: this.turns[next] });
  }

  private evaluate(lx: number, lz: number, hl: number, wrong: boolean): TurnResult {
    const c = this.cur, t = c.m.turn, api = this.api, dir = DIR(t);
    const items: Item[] = [];
    const R = t === 'R';
    if (t === 'S') {
      const lane = lx - CARGEO.halfW > -0.05 && lx + CARGEO.halfW < CITY.W / 2 + 0.05;
      items.push({ key: 'lane', label: 'Faixa', value: lane ? 'manteve a faixa' : 'saiu da faixa', ok: lane, tip: 'No cruzamento, siga reto sem mudar de faixa.' });
      items.push({ key: 'curb', label: 'Meio-fio', value: c.curb ? 'bateu' : 'sem batidas', ok: !c.curb });
    } else if (wrong || !c.started) {
      items.push({ key: 'path', label: 'Conversão', value: 'não virou', ok: false, tip: `Você passou da esquina sem virar. Comece a reduzir e a se posicionar uns 50 m antes; vire à ${SIDE(t)} no ponto indicado.` });
    } else {
      const g = IDEAL[t];
      items.push({ key: 'mirror', label: 'Retrovisor', value: c.glance !== null ? 'olhou' : 'não olhou', ok: c.glance !== null, tip: `Antes da seta, olhe o retrovisor ${R ? 'direito' : 'esquerdo e o interno'}: toque nele para "olhar".` });
      const sig = c.signalWrong && c.signal === null ? { v: 'lado errado', ok: false } : c.signal === null ? { v: 'não ligou', ok: false } : c.signal >= 25 ? { v: `${Math.round(c.signal)} m antes`, ok: true } : { v: `tarde (${Math.max(0, Math.round(c.signal))} m)`, ok: false };
      items.push({ key: 'signal', label: 'Seta', value: sig.v, ok: sig.ok, tip: `Ligue a seta para a ${SIDE(t)} uns 30 m antes da esquina, logo depois de olhar o retrovisor.` });
      const st = c.started!;
      if (R) {
        const gap = CITY.W / 2 - (st.lx + CARGEO.halfW);
        items.push({ key: 'pos', label: 'Posição antes', value: `${m1(Math.max(0, gap))} m do meio-fio`, ok: gap <= 1.2, tip: 'Antes de virar à direita, encoste a uns 50 cm do meio-fio. A referência: o meio-fio some debaixo do capô, do lado direito.' });
      } else {
        const gap = st.lx - CARGEO.halfW;
        items.push({ key: 'pos', label: 'Posição antes', value: gap < -0.1 ? 'passou do meio' : `${m1(Math.max(0, gap))} m do meio`, ok: gap <= 1.2 && gap >= -0.1 && !c.crossedCenter, tip: 'Antes de virar à esquerda, encoste perto da faixa amarela do meio, sem passar dela.' });
      }
      const lim = R ? 20 : 22;
      items.push({ key: 'speed', label: 'Velocidade na curva', value: `${Math.round(c.maxKmh)} km/h`, ok: c.maxKmh <= lim, tip: 'Chegue mais devagar: freie antes da curva, ainda reto, até uns 15 km/h. Dentro da curva, nada de freada forte.' });
      const gearOk = c.turnGear === '1' || c.turnGear === '2';
      items.push({ key: 'gear', label: 'Marcha', value: c.turnGear === 'N' ? 'neutro' : `${c.turnGear}ª`, ok: gearOk, tip: c.turnGear === 'N' ? 'Não faça a curva em neutro: o carro fica sem controle do motor. Use a 2ª.' : 'Faça a curva em 2ª (ou 1ª se estiver bem devagar). Em 3ª o carro fica sem força e falha.' });
      if (c.clutchT > 1.5) items.push({ key: 'clutch', label: 'Embreagem', value: `pisada ${m1(c.clutchT)} s na curva`, ok: false, tip: 'Não faça a curva com a embreagem pisada: o carro fica solto (banguela). Pise só se for parar.' });
      const diff = (c.halfLz ?? st.lz) - g.start;
      items.push({
        key: 'timing', label: 'Hora de virar', value: Math.abs(diff) <= 2 ? 'na hora' : diff < 0 ? `${m1(-diff)} m cedo` : `${m1(diff)} m tarde`, ok: Math.abs(diff) <= 2,
        tip: diff < 0
          ? (R ? 'Começou a virar cedo: segure reto até a quina da calçada (onde o meio-fio começa a curvar) ficar ao lado do seu ombro.' : 'Começou cedo: na esquerda vire depois, quando a frente do carro já estiver dentro do cruzamento, perto do meio.')
          : (R ? 'Começou tarde: comece a girar quando a quina da calçada passar pela porta. Virando tarde, o carro abre e vai para a contramão.' : 'Começou tarde: assim você passa do ponto e entra largo. Vire quando a frente chegar perto do meio do cruzamento.'),
      });
      const pathOk = !c.curb && !c.opened && !c.cut;
      const pv = c.curb ? 'bateu no meio-fio' : c.opened ? 'abriu e invadiu a contramão' : c.cut ? 'cortou a curva' : 'limpa';
      const pTip = c.curb
        ? (R ? 'Bateu no meio-fio: você virou cedo ou fechou demais. Espere a quina da calçada chegar ao seu ombro e então gire cerca de 1 volta.' : 'Bateu no meio-fio: virou cedo demais. Avance mais antes de girar.')
        : c.opened ? 'Abriu a curva: encoste mais no meio-fio antes, comece a girar na hora e gire mais (cerca de 1 volta), devagar.'
        : 'Cortou a curva e entrou na contramão da rua nova: avance até o meio do cruzamento e só então vire, terminando na faixa da direita.';
      items.push({ key: 'path', label: 'Trajetória', value: pv, ok: pathOk, tip: pTip });
      const overDeg = Math.round((c.over * 180) / Math.PI);
      items.push({ key: 'return', label: 'Desvirar', value: overDeg <= 12 ? 'na hora' : `demorou (passou ${overDeg}°)`, ok: overDeg <= 12, tip: 'Desvire mais cedo: quando o capô apontar para a rua nova, comece a voltar o volante (deixe deslizar nas mãos) e acelere suave.' });
      const across = R ? -lz : lz; // distância do centro da rua nova, do lado certo
      const laneOk = across - CARGEO.halfW > -0.1 && across + CARGEO.halfW < CITY.W / 2 + 0.1;
      items.push({ key: 'lane', label: 'Faixa no fim', value: laneOk ? 'faixa da direita' : across < CARGEO.halfW ? 'em cima do meio' : 'colado no meio-fio', ok: laneOk, tip: 'Termine a curva na faixa da direita da rua nova, a meio metro do meio-fio.' });
      const sigOff = !(api.veh.turnActive && api.veh.turn === dir);
      items.push({ key: 'signalOff', label: 'Seta depois', value: sigOff ? 'desligou' : 'continuou ligada', ok: sigOff, tip: 'Depois da curva a seta desliga sozinha quando o volante volta; se não desligar, desligue na alavanca.' });
    }
    items.push({ key: 'engine', label: 'Motor', value: c.stalled ? 'apagou' : 'não apagou', ok: !c.stalled, tip: 'O motor apagou: em baixa velocidade use a 1ª ou dê um pouco de acelerador antes de soltar a embreagem.' });
    void hl;
    const order = ['path', 'timing', 'pos', 'speed', 'return', 'gear', 'clutch', 'signal', 'mirror', 'lane', 'signalOff', 'engine'];
    const bad = items.filter((i) => i.ok === false);
    bad.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    return { turn: t, m: c.m, items, trail: c.trail, marks: c.marks, faults: bad.length, tip: bad[0]?.tip ?? null };
  }

  /** Para os testes e o relatório. */
  get current() { return this.cur; }
  get maneuver() { return this.cur.m; }
  /** Volante ideal na curva (para explicar "quanto girar"). */
  static wheelFor(t: Turn) { return t === 'S' ? 0 : Math.round(steerFor(IDEAL[t].R)); }
  /** Ponto do carro no mundo (utilitário de teste). */
  static point = carPoint;
}
