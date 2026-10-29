// Disposição dos comandos (mesmas posições do painel do carro do aluno), ajustes por
// versão e exercício "Onde fica?". Salvo no aparelho.

export type ZoneId = 'cluster' | 'stalkL' | 'wheel' | 'stalkR' | 'leftBank' | 'door' | 'media' | 'hazard' | 'climate' | 'start' | 'console' | 'rearMirror';

export const ZONES: Record<ZoneId, { name: string; where: string }> = {
  cluster: { name: 'Quadro de instrumentos', where: 'atrás do volante' },
  stalkL: { name: 'Alavanca esquerda', where: 'atrás do volante, à esquerda' },
  wheel: { name: 'Botões do volante', where: 'nos raios do volante' },
  stalkR: { name: 'Alavanca direita', where: 'atrás do volante, à direita' },
  leftBank: { name: 'Botões à esquerda', where: 'no painel, abaixo da saída de ar esquerda' },
  door: { name: 'Porta do motorista', where: 'no painel da porta' },
  media: { name: 'Central multimídia', where: 'no alto do centro do painel' },
  hazard: { name: 'Pisca-alerta', where: 'no centro, entre as duas saídas de ar' },
  climate: { name: 'Ar-condicionado', where: 'no centro, abaixo das saídas de ar' },
  start: { name: 'Ignição', where: 'à direita da coluna de direção' },
  console: { name: 'Console central', where: 'entre os bancos' },
  rearMirror: { name: 'Retrovisor interno', where: 'no alto do para-brisa' },
};

/** Funções que podem ser trocadas de lugar no modo "Ajustar ao meu carro". */
export type SlotFn = 'none' | 'level' | 'espOff' | 'isgOff' | 'fan' | 'temp' | 'vent' | 'ac' | 'recirc' | 'rearDefrost' | 'lock';
export const SLOT_LABEL: Record<SlotFn, string> = {
  none: '(vazio)', level: 'Altura do farol', espOff: 'ESP OFF', isgOff: 'ISG OFF (Stop&Go)', fan: 'Ventilação',
  temp: 'Temperatura', vent: 'Saída de ar', ac: 'A/C', recirc: 'Recirculação', rearDefrost: 'Desembaçador traseiro', lock: 'Trava das portas',
};

export interface CarSetup {
  version: 'sense' | 'vision' | 'evolution' | 'diamond';
  pushStart: boolean;
  cruise: boolean;
  autoLights: boolean;
  leftBank: SlotFn[]; // 3 posições, de cima para baixo
  knobs: SlotFn[]; // 3 botões giratórios, da esquerda para a direita
  climateBtns: SlotFn[]; // 4 botões abaixo dos giratórios
  doorBtns: SlotFn[]; // 1 posição na porta
  trim: string; // cor da moldura das saídas de ar
  paint: string; // cor do carro (capa dos retrovisores e lateral vista neles)
}

export const VERSIONS: Record<CarSetup['version'], { name: string; pushStart: boolean; cruise: boolean; autoLights: boolean }> = {
  sense: { name: 'Sense', pushStart: false, cruise: false, autoLights: false },
  vision: { name: 'Vision', pushStart: false, cruise: false, autoLights: false },
  evolution: { name: 'Evolution', pushStart: false, cruise: true, autoLights: false },
  diamond: { name: 'Diamond / Launch Edition', pushStart: true, cruise: true, autoLights: true },
};

const DEFAULT: CarSetup = {
  version: 'vision', pushStart: false, cruise: false, autoLights: false,
  leftBank: ['level', 'espOff', 'isgOff'],
  knobs: ['fan', 'temp', 'vent'],
  climateBtns: ['ac', 'recirc', 'rearDefrost', 'none'],
  doorBtns: ['lock'],
  trim: '#d4513a',
  paint: '#e6e8e9',
};

const KEY = 'cambio-manual.setup.v1';
function load(): CarSetup {
  try { const r = localStorage.getItem(KEY); if (r) return { ...DEFAULT, ...JSON.parse(r) }; } catch { /* ignore */ }
  return { ...DEFAULT, leftBank: [...DEFAULT.leftBank], knobs: [...DEFAULT.knobs], climateBtns: [...DEFAULT.climateBtns], doorBtns: [...DEFAULT.doorBtns] };
}

let setup = load();
const subs = new Set<() => void>();
export const carSetup = {
  get: () => setup,
  set(p: Partial<CarSetup>) {
    setup = { ...setup, ...p };
    try { localStorage.setItem(KEY, JSON.stringify(setup)); } catch { /* ignore */ }
    subs.forEach((f) => f());
  },
  setVersion(v: CarSetup['version']) { const d = VERSIONS[v]; carSetup.set({ version: v, pushStart: d.pushStart, cruise: d.cruise, autoLights: d.autoLights }); },
  reset() {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setup = { ...DEFAULT, leftBank: [...DEFAULT.leftBank], knobs: [...DEFAULT.knobs], climateBtns: [...DEFAULT.climateBtns], doorBtns: [...DEFAULT.doorBtns] };
    subs.forEach((f) => f());
  },
  subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },
};

// ------------------------------------------------------------- exercício "Onde fica?"
export interface QuizItem { id: string; ask: string; hint: string; needs?: (s: CarSetup) => boolean }
export const QUIZ: QuizItem[] = [
  { id: 'hazard', ask: 'o pisca-alerta', hint: 'Botão vermelho com triângulo, no centro do painel entre as saídas de ar.' },
  { id: 'turnL', ask: 'a seta para a esquerda', hint: 'Alavanca esquerda: empurre para baixo.' },
  { id: 'turnR', ask: 'a seta para a direita', hint: 'Alavanca esquerda: empurre para cima.' },
  { id: 'lights', ask: 'o comando dos faróis', hint: 'Anel giratório na ponta da alavanca esquerda.' },
  { id: 'high', ask: 'o farol alto', hint: 'Alavanca esquerda: empurre para a frente (em direção ao painel).' },
  { id: 'flash', ask: 'o lampejo do farol', hint: 'Alavanca esquerda: puxe em sua direção e solte.' },
  { id: 'wiper', ask: 'o limpador do para-brisa', hint: 'Alavanca direita: mova para cima ou para baixo.' },
  { id: 'washer', ask: 'o lavador do para-brisa', hint: 'Alavanca direita: puxe em sua direção.' },
  { id: 'rearWiper', ask: 'o limpador traseiro', hint: 'Anel na ponta da alavanca direita.' },
  { id: 'horn', ask: 'a buzina', hint: 'Centro do volante.' },
  { id: 'volume', ask: 'o volume do rádio no volante', hint: 'Raio esquerdo do volante.' },
  { id: 'trip', ask: 'o botão do computador de bordo', hint: 'Raio direito do volante.' },
  { id: 'cruise', ask: 'o piloto automático', hint: 'Raio direito do volante.', needs: (s) => s.cruise },
  { id: 'handbrake', ask: 'o freio de mão', hint: 'Alavanca entre os bancos, atrás do câmbio.' },
  { id: 'ignition', ask: 'a ignição', hint: 'Chave à direita da coluna de direção ou botão de partida à direita do volante.' },
  { id: 'fn:ac', ask: 'o botão do A/C', hint: 'Fileira de botões do ar-condicionado.' },
  { id: 'fn:recirc', ask: 'a recirculação do ar', hint: 'Fileira de botões do ar-condicionado.' },
  { id: 'fn:rearDefrost', ask: 'o desembaçador traseiro', hint: 'Fileira de botões do ar-condicionado.' },
  { id: 'fn:fan', ask: 'a velocidade da ventilação', hint: 'Um dos três botões giratórios do ar.' },
  { id: 'fn:temp', ask: 'a temperatura do ar', hint: 'Um dos três botões giratórios do ar.' },
  { id: 'fn:vent', ask: 'a saída de ar para o para-brisa', hint: 'Um dos três botões giratórios do ar.' },
  { id: 'fn:level', ask: 'a regulagem de altura dos faróis', hint: 'Botões à esquerda do volante.' },
  { id: 'fn:espOff', ask: 'o botão ESP OFF', hint: 'Botões à esquerda do volante.' },
  { id: 'fn:lock', ask: 'a trava das portas', hint: 'Painel da porta do motorista.' },
  { id: 'mirrorSwitch', ask: 'o ajuste dos retrovisores externos', hint: 'Painel da porta do motorista: escolha E ou D no seletor e use as setas.' },
  { id: 'mirrorI', ask: 'o retrovisor interno', hint: 'No alto do para-brisa, no centro. Ajusta com a mão.' },
];

/** Em qual zona fica cada item, segundo o ajuste atual. */
export function zoneOf(id: string, s: CarSetup): ZoneId {
  const fixed: Record<string, ZoneId> = {
    hazard: 'hazard', turnL: 'stalkL', turnR: 'stalkL', lights: 'stalkL', high: 'stalkL', flash: 'stalkL', fog: 'stalkL',
    wiper: 'stalkR', washer: 'stalkR', rearWiper: 'stalkR', horn: 'wheel', volume: 'wheel', trip: 'wheel', cruise: 'wheel',
    handbrake: 'console', ignition: 'start', mirrorSwitch: 'door', mirrorI: 'rearMirror',
  };
  if (fixed[id]) return fixed[id];
  const fn = id.replace('fn:', '') as SlotFn;
  if (s.leftBank.includes(fn)) return 'leftBank';
  if (s.knobs.includes(fn) || s.climateBtns.includes(fn)) return 'climate';
  if (s.doorBtns.includes(fn)) return 'door';
  return 'climate';
}

interface QuizState { firstTry: number; active: boolean; list: QuizItem[]; idx: number; t0: number; correct: number; wrong: number; times: number[]; startAt: number; done: boolean; wrongHere: number }
export function quizActive() { return quiz.active && !quiz.done; }
export const quiz: QuizState = { firstTry: 0, active: false, list: [], idx: 0, t0: 0, correct: 0, wrong: 0, times: [], startAt: 0, done: false, wrongHere: 0 };

// acesso para testes automatizados
if (typeof window !== 'undefined') {
  const w = window as unknown as Record<string, unknown>;
  w.__quiz = quiz;
  w.__zoneOf = (id: string) => zoneOf(id, carSetup.get());
}
