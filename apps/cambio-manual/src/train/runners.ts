// Exercícios de alavanca (modo aprendizagem) e lições de direção.
import type { Car, Gear } from '../sim/car';
import type { Shifter } from '../sim/shifter';
import { gearName, GEAR_PLACE, type Feedback } from './feedback';
import { progress } from './progress';

export interface SimApi {
  car: Car;
  shifter: Shifter;
  now(): number; // ms
  say(f: Omit<Feedback, 'id' | 't'>): void;
  resetCar(opts: Parameters<Car['reset']>[0]): void;
}

export interface Summary {
  title: string;
  lines: [string, string][];
  stars: number;
  success: boolean;
}

export interface Runner {
  kind: 'drill' | 'lesson';
  id: string;
  title: string;
  instruction: string;
  hint?: string;
  stepIndex: number;
  stepCount: number;
  done: boolean;
  summary?: Summary;
  blind: boolean;
  tick(dt: number): void;
  onGear(from: Gear, to: Gear, rpmAtLeave: number): void;
  onError(kind: string): void;
}

export const ROUTE: Record<Exclude<Gear, 'N'>, string> = {
  '1': 'Do neutro, leve para a esquerda e empurre para cima.',
  '2': 'Do neutro, leve para a esquerda e puxe para baixo.',
  '3': 'Do neutro, empurre reto para cima.',
  '4': 'Do neutro, puxe reto para baixo.',
  '5': 'Do neutro, leve para a direita e empurre para cima.',
  R: 'Segure a alavanca até destravar, leve para a direita e puxe para baixo.',
};

const fmtS = (ms: number) => `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} s`;

// ---------------------------------------------------------------- Exercícios
export interface DrillDef {
  id: string;
  title: string;
  desc: string;
  blind?: boolean;
  engineOn?: boolean;
  targets(): Gear[];
}

function randomTargets(n: number, pool: Gear[]): Gear[] {
  const out: Gear[] = [];
  // garante que todas apareçam pelo menos uma vez
  const bag = [...pool].sort(() => Math.random() - 0.5);
  while (out.length < n) {
    const next = bag.length ? bag.pop()! : pool[Math.floor(Math.random() * pool.length)];
    if (out[out.length - 1] === next) { if (!bag.length) continue; bag.unshift(next); continue; }
    out.push(next);
  }
  return out;
}

const ALL: Gear[] = ['1', '2', '3', '4', '5', 'R'];

export const DRILLS: DrillDef[] = [
  { id: 'positions', title: 'Localizar marchas', desc: 'Marchas sorteadas com os números visíveis. Memorize onde cada uma fica.', targets: () => randomTargets(12, ALL) },
  { id: 'sequence', title: 'Sequência 1 → 5', desc: 'Suba as marchas na ordem, duas vezes, passando sempre pelo neutro.', targets: () => ['1', '2', '3', '4', '5', '1', '2', '3', '4', '5'] },
  { id: 'downshift', title: 'Reduções 5 → 1', desc: 'Desça as marchas uma a uma, duas vezes.', targets: () => ['5', '4', '3', '2', '1', '5', '4', '3', '2', '1'] },
  { id: 'reverse', title: 'Ré com trava', desc: 'Alterne entre a ré e as marchas vizinhas. A ré exige segurar a alavanca para destravar.', targets: () => ['R', '1', 'R', '5', 'R', '2', 'R'] },
  { id: 'blind', title: 'Localizar sem ajuda', desc: 'Números e indicador de marcha escondidos. Só a memória e o tato do câmbio.', blind: true, targets: () => randomTargets(12, ALL) },
  { id: 'clutch', title: 'Trocas com embreagem', desc: 'Motor ligado e carro parado. Pise a embreagem até o fundo antes de cada engate, ou a marcha arranha.', engineOn: true, targets: () => randomTargets(8, ALL) },
];

export class DrillRunner implements Runner {
  kind = 'drill' as const;
  id: string;
  title: string;
  blind: boolean;
  done = false;
  summary?: Summary;
  private list: Gear[];
  private idx = 0;
  private promptAt = 0;
  private startAt = 0;
  private times: number[] = [];
  private correct = 0;
  private wrong = 0;
  private wrongHere = 0;
  private grinds = 0;
  private perGear: Record<string, number[]> = {};

  constructor(private def: DrillDef, private sim: SimApi) {
    this.id = def.id;
    this.title = def.title;
    this.blind = !!def.blind;
    this.list = def.targets();
    sim.resetCar({ engineOn: !!def.engineOn, handbrake: true, gear: 'N' });
    sim.shifter.place('N');
    progress.startDrill(def.id);
    this.startAt = this.promptAt = sim.now();
  }

  get target(): Gear { return this.list[this.idx]; }
  get stepIndex() { return this.idx; }
  get stepCount() { return this.list.length; }

  get instruction() {
    if (this.done) return 'Exercício concluído';
    if (this.def.engineOn && !this.sim.car.engineOn && this.sim.car.cranking <= 0)
      return 'Motor desligado: pise a embreagem e dê a partida';
    if (this.def.engineOn && this.sim.car.inputs.clutch < 0.8 && this.sim.shifter.gear === 'N')
      return `Pise a embreagem e engate a ${gearName(this.target)}`;
    return `Engate a ${gearName(this.target)}`;
  }
  get hint() {
    if (this.done) return undefined;
    const t = this.target as Exclude<Gear, 'N'>;
    if (this.blind && this.wrongHere < 2) return 'Sem ajuda: lembre-se do H e da posição de cada marcha.';
    return `Fica ${GEAR_PLACE[t]}. ${ROUTE[t]}`;
  }

  tick() { /* exercício guiado por eventos de marcha */ }

  onGear(_from: Gear, to: Gear) {
    if (this.done || to === 'N') return;
    const now = this.sim.now();
    if (to === this.target) {
      const ms = now - this.promptAt;
      this.times.push(ms);
      (this.perGear[to] ??= []).push(ms);
      this.correct++;
      progress.answer(this.id, to, true, ms);
      this.sim.say({ kind: 'ok', severity: 'ok', title: `${gearName(to)[0].toUpperCase()}${gearName(to).slice(1)} em ${fmtS(ms)}` });
      this.idx++;
      this.wrongHere = 0;
      this.promptAt = now;
      if (this.idx >= this.list.length) this.finish();
    } else {
      this.wrong++;
      this.wrongHere++;
      progress.answer(this.id, this.target, false);
      const t = this.target as Exclude<Gear, 'N'>;
      const got = to as Exclude<Gear, 'N'>;
      this.sim.say({
        kind: 'wrongGear', severity: 'error',
        title: `Essa é a ${gearName(to)}, não a ${gearName(t)}`,
        what: `A ${gearName(got)} fica ${GEAR_PLACE[got]}. A ${gearName(t)} fica ${GEAR_PLACE[t]}.`,
        fix: `Volte ao neutro. ${ROUTE[t]}`,
      });
    }
  }

  onError(kind: string) {
    if (kind === 'grind') this.grinds++;
  }

  private finish() {
    this.done = true;
    const total = this.correct + this.wrong + this.grinds;
    const accuracy = total ? this.correct / total : 1;
    const avg = this.times.reduce((a, b) => a + b, 0) / Math.max(1, this.times.length);
    const dur = this.sim.now() - this.startAt;
    let slowest = '';
    let slowMs = 0;
    for (const [g, arr] of Object.entries(this.perGear)) {
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      if (m > slowMs) { slowMs = m; slowest = g; }
    }
    progress.finishDrill(this.id, { accuracy, avgMs: avg, durationMs: dur, errors: this.wrong + this.grinds });
    const stars = accuracy >= 0.95 && avg < 1800 ? 3 : accuracy >= 0.8 ? 2 : 1;
    const lines: [string, string][] = [
      ['Acertos', `${this.correct} de ${this.list.length}`],
      ['Erros de posição', String(this.wrong)],
      ['Tempo médio por marcha', fmtS(avg)],
    ];
    if (this.def.engineOn) lines.push(['Arranhadas (sem embreagem)', String(this.grinds)]);
    if (slowest) lines.push(['Marcha mais lenta', `${gearName(slowest as Gear)} (${fmtS(slowMs)})`]);
    let next = '';
    if (accuracy >= 0.95 && !this.blind && this.id === 'positions') next = 'Pronto para tentar "Localizar sem ajuda".';
    else if (accuracy < 0.8) next = 'Repita até errar no máximo uma vez.';
    if (next) lines.push(['Próximo passo', next]);
    this.summary = { title: this.title, lines, stars, success: accuracy >= 0.8 };
  }
}

// ---------------------------------------------------------------- Lições
interface Ctx { car: Car; sim: SimApi; flags: Record<string, number | boolean> }
interface Step { text: string; hint?: string; engineOff?: boolean; done(c: Ctx): boolean }
export interface LessonDef {
  id: string;
  title: string;
  desc: string;
  setup(sim: SimApi): void;
  steps: Step[];
  watch?(c: Ctx, say: (k: string, f: Omit<Feedback, 'id' | 't'>) => void): void;
  shiftRules?: boolean; // avalia rpm das trocas para cima
}

const fwd = (g: Gear) => (g === 'N' || g === 'R' ? 0 : Number(g));

export const LESSONS: LessonDef[] = [
  {
    id: 'launch', title: 'Arrancada no plano',
    desc: 'Partida, 1ª marcha e saída suave encontrando o ponto da embreagem.',
    setup: (s) => { s.resetCar({ engineOn: false, gear: 'N', handbrake: true }); s.shifter.place('N'); },
    steps: [
      { text: 'Pise a embreagem até o fundo e dê a partida.', hint: 'Toque em Partida. Com a embreagem no fundo, o carro não se move mesmo se houver marcha engatada.', engineOff: true, done: (c) => c.car.engineOn },
      { text: 'Com a embreagem no fundo, engate a 1ª.', hint: ROUTE['1'], done: (c) => c.car.gear === '1' },
      { text: 'Solte o freio de mão.', hint: 'Botão Freio de mão.', done: (c) => !c.car.inputs.handbrake },
      { text: 'Acelere até ~1.500 rpm e suba a embreagem até o ponto.', hint: 'O ponto é a faixa marcada no pedal. Quando o giro cair um pouco, o carro começou a puxar: pare de subir o pedal.', done: (c) => c.car.kmh > 2 },
      { text: 'Segure o ponto e solte o resto da embreagem devagar.', hint: 'Mantenha o acelerador firme enquanto termina de soltar.', done: (c) => c.car.inputs.clutch < 0.1 && c.car.locked && c.car.kmh > 6 },
      { text: 'Acelere até 15 km/h.', done: (c) => c.car.kmh >= 15 },
    ],
  },
  {
    id: 'upshift', title: 'Trocas progressivas',
    desc: 'Saia em 1ª e suba até a 4ª trocando na faixa certa de giro.',
    shiftRules: true,
    setup: (s) => { s.resetCar({ engineOn: true, gear: 'N' }); s.shifter.place('N'); },
    steps: [
      { text: 'Engate a 1ª e saia com o carro.', hint: 'Embreagem no fundo, 1ª, acelerador a ~1.500 rpm e embreagem devagar pelo ponto.', done: (c) => c.car.gear === '1' && c.car.locked && c.car.kmh > 8 },
      { text: 'Acelere e troque para a 2ª entre 2.500 e 3.500 rpm.', hint: 'Tire o pé do acelerador, embreagem no fundo, 1ª → neutro → 2ª (reto para baixo), solte a embreagem e acelere.', done: (c) => c.car.gear === '2' && c.car.locked && c.car.inputs.clutch < 0.15 },
      { text: 'Troque para a 3ª entre 2.500 e 3.500 rpm.', hint: 'Da 2ª: suba ao neutro, leve ao centro e empurre para cima.', done: (c) => c.car.gear === '3' && c.car.locked && c.car.inputs.clutch < 0.15 },
      { text: 'Troque para a 4ª entre 2.500 e 3.500 rpm.', hint: 'Da 3ª: puxe reto para baixo, passando pelo neutro.', done: (c) => c.car.gear === '4' && c.car.locked && c.car.inputs.clutch < 0.15 },
      { text: 'Chegue a 70 km/h em 4ª.', done: (c) => c.car.gear === '4' && c.car.kmh >= 70 },
    ],
  },
  {
    id: 'downshift', title: 'Reduções',
    desc: 'De 70 km/h em 4ª: freie e reduza para 3ª e 2ª na velocidade certa, até parar.',
    setup: (s) => { s.resetCar({ engineOn: true, gear: '4', kmh: 70 }); s.shifter.place('4'); },
    steps: [
      { text: 'Freie suavemente até 50 km/h.', done: (c) => c.car.kmh <= 52 },
      { text: 'Pise a embreagem, reduza para a 3ª e solte suave.', hint: 'Com a embreagem pisada, um toque no acelerador sobe o giro e evita o tranco. Reduza para 3ª abaixo de ~70 km/h.', done: (c) => c.car.gear === '3' && c.car.locked && c.car.inputs.clutch < 0.15 },
      { text: 'Freie até 30 km/h.', done: (c) => c.car.kmh <= 32 },
      { text: 'Reduza para a 2ª.', hint: 'A 2ª aceita até ~50 km/h sem sobregiro.', done: (c) => c.car.gear === '2' && c.car.locked && c.car.inputs.clutch < 0.15 },
      { text: 'Freie até parar. Pise a embreagem antes de o giro cair abaixo de 1.000 rpm.', done: (c) => c.car.kmh < 0.5 && c.car.engineOn },
      { text: 'Coloque em neutro e solte a embreagem.', done: (c) => c.car.gear === 'N' && c.car.inputs.clutch < 0.2 },
    ],
  },
  {
    id: 'stop', title: 'Frenagem e parada',
    desc: 'Pare o carro a partir de 50 km/h em 3ª sem deixar o motor apagar.',
    setup: (s) => { s.resetCar({ engineOn: true, gear: '3', kmh: 50 }); s.shifter.place('3'); },
    steps: [
      { text: 'Freie progressivamente até ~20 km/h.', hint: 'Pressione o freio aos poucos. Freada brusca não é necessária.', done: (c) => c.car.kmh <= 22 },
      { text: 'Pise a embreagem até o fundo.', hint: 'Em 3ª, abaixo de ~20 km/h o motor já começa a sofrer.', done: (c) => c.car.inputs.clutch > 0.8 },
      { text: 'Continue freando até parar.', done: (c) => c.car.kmh < 0.3 },
      { text: 'Coloque em neutro.', done: (c) => c.car.gear === 'N' },
      { text: 'Puxe o freio de mão e solte os pedais.', done: (c) => c.car.inputs.handbrake && c.car.inputs.clutch < 0.1 && c.car.inputs.brake < 0.1 },
    ],
  },
  {
    id: 'hill', title: 'Saída em subida',
    desc: 'Rampa de 12%: freio de mão, ponto da embreagem e saída sem voltar.',
    setup: (s) => { s.resetCar({ engineOn: true, gear: 'N', handbrake: true, grade: 0.12 }); s.shifter.place('N'); },
    steps: [
      { text: 'Pise a embreagem e engate a 1ª.', done: (c) => c.car.gear === '1' },
      { text: 'Acelere até ~2.000 rpm e mantenha.', hint: 'Na subida o carro precisa de mais força que no plano.', done: (c) => c.car.rpm > 1700 && c.car.inputs.throttle > 0.12 },
      { text: 'Suba a embreagem devagar até o ponto: o giro cai um pouco e o carro "senta".', hint: 'Pare o pedal dentro da faixa do ponto. O indicador de embreagem mostra quando ela começa a transmitir força.', done: (c) => c.car.engineOn && c.car.clutchTorque > 22 },
      { text: 'Solte o freio de mão mantendo o ponto e o acelerador.', done: (c) => !c.car.inputs.handbrake },
      { text: 'Suba 10 metros sem deixar o carro voltar.', hint: 'Solte o resto da embreagem aos poucos e acelere mais se o giro cair.', done: (c) => c.car.distance > 10 },
    ],
  },
  {
    id: 'reverse', title: 'Manobra de ré',
    desc: 'Engate a ré com a trava, recue 5 metros devagar e pare.',
    setup: (s) => { s.resetCar({ engineOn: true, gear: 'N' }); s.shifter.place('N'); },
    steps: [
      { text: 'Pise a embreagem e engate a ré.', hint: ROUTE.R, done: (c) => c.car.gear === 'R' },
      { text: 'Solte a embreagem devagar e recue 5 metros.', hint: 'Em manobra, controle a velocidade só com a embreagem perto do ponto.', done: (c) => c.car.distance < -5 },
      { text: 'Freie até parar e pise a embreagem.', done: (c) => Math.abs(c.car.kmh) < 0.3 && c.car.inputs.clutch > 0.8 },
      { text: 'Coloque em neutro.', done: (c) => c.car.gear === 'N' },
    ],
    watch: (c, say) => {
      if (c.car.kmh < -12 && !c.flags.fast) {
        c.flags.fast = true;
        say('speeding', { kind: 'speeding', severity: 'warn', title: 'Rápido demais para uma manobra', what: `Você chegou a ${Math.round(-c.car.kmh)} km/h de ré.`, fix: 'Manobre com a embreagem perto do ponto e quase sem acelerar.' });
      }
    },
  },
];

export class LessonRunner implements Runner {
  kind = 'lesson' as const;
  id: string;
  title: string;
  blind = false;
  done = false;
  summary?: Summary;
  stepIndex = 0;
  private errors = 0;
  private errorKinds: Record<string, number> = {};
  private startAt: number;
  private ctx: Ctx;
  private lastForward = 0;

  constructor(private def: LessonDef, private sim: SimApi) {
    this.id = def.id;
    this.title = def.title;
    def.setup(sim);
    this.ctx = { car: sim.car, sim, flags: {} };
    progress.startLesson(def.id);
    this.startAt = sim.now();
    this.lastForward = fwd(sim.car.gear);
  }

  get stepCount() { return this.def.steps.length; }
  private get step() { return this.def.steps[Math.min(this.stepIndex, this.def.steps.length - 1)]; }
  private get needsRestart() { return !this.done && !this.sim.car.engineOn && !this.step.engineOff && this.sim.car.cranking <= 0; }

  get instruction() {
    if (this.done) return 'Lição concluída';
    if (this.needsRestart) return 'Motor desligado: pise a embreagem e dê a partida.';
    return this.step.text;
  }
  get hint() {
    if (this.done) return undefined;
    if (this.needsRestart) return 'Com a embreagem no fundo você pode dar partida mesmo engatado. Depois retome de onde parou.';
    return this.step.hint;
  }

  tick() {
    if (this.done) return;
    this.def.watch?.(this.ctx, (k, f) => { this.onError(k); this.sim.say(f); });
    if (this.needsRestart) return;
    let guard = 0;
    while (!this.done && guard++ < 10 && this.step.done(this.ctx)) {
      this.stepIndex++;
      if (this.stepIndex >= this.def.steps.length) this.finish();
    }
  }

  onGear(from: Gear, to: Gear, rpmAtLeave: number) {
    if (this.done || !this.def.shiftRules) { if (fwd(to)) this.lastForward = fwd(to); return; }
    const n = fwd(to);
    if (!n) return;
    if (this.lastForward && n > this.lastForward) {
      if (n - this.lastForward > 1) {
        this.onError('skipGear');
        this.sim.say({ kind: 'skipGear', severity: 'warn', title: `Pulou da ${this.lastForward}ª para a ${n}ª`,
          what: 'Pulando marcha, o giro cai demais e o carro perde força.', fix: 'Nesta lição, suba uma marcha por vez.' });
      } else if (rpmAtLeave > 0 && rpmAtLeave < 2000) {
        this.onError('earlyShift');
        this.sim.say({ kind: 'earlyShift', severity: 'warn', title: `Trocou cedo (${Math.round(rpmAtLeave)} rpm)`,
          what: 'Na marcha seguinte o giro vai ficar baixo e o motor sem força.', fix: 'Espere o conta-giros passar de 2.500 rpm antes de trocar.' });
      } else if (rpmAtLeave > 4800) {
        this.onError('lateShift');
        this.sim.say({ kind: 'lateShift', severity: 'warn', title: `Esticou demais (${Math.round(rpmAtLeave)} rpm)`,
          what: 'Gasta mais combustível e faz barulho sem necessidade.', fix: 'Em condução normal, troque entre 2.500 e 3.500 rpm.' });
      } else {
        this.sim.say({ kind: 'ok', severity: 'ok', title: `Boa troca para a ${n}ª (${Math.round(rpmAtLeave)} rpm)` });
      }
    }
    this.lastForward = n;
    void from;
  }

  onError(kind: string) {
    if (this.done) return;
    this.errors++;
    this.errorKinds[kind] = (this.errorKinds[kind] ?? 0) + 1;
    progress.lessonError(this.id, kind);
  }

  private finish() {
    this.done = true;
    const dur = this.sim.now() - this.startAt;
    progress.finishLesson(this.id, { durationMs: dur, errors: this.errors });
    const stars = this.errors === 0 ? 3 : this.errors <= 2 ? 2 : 1;
    const lines: [string, string][] = [
      ['Tempo', fmtS(dur)],
      ['Erros', String(this.errors)],
    ];
    const labels: Record<string, string> = { stall: 'Motor apagou', jerk: 'Trancos', grind: 'Arranhadas', overrev: 'Sobregiro', rollback: 'Voltou na subida', lugging: 'Giro baixo', skipGear: 'Pulou marcha', earlyShift: 'Troca cedo', lateShift: 'Troca tarde', speeding: 'Velocidade alta', startInGear: 'Partida engrenada' };
    for (const [k, v] of Object.entries(this.errorKinds)) lines.push([labels[k] ?? k, String(v)]);
    this.summary = { title: this.title, lines, stars, success: true };
  }
}
