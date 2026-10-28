// Progresso salvo no aparelho (localStorage). Tudo protegido por try/catch:
// em aba privada ou com dados bloqueados o app funciona, só não lembra.

export interface GearStat { n: number; ms: number; wrong: number }
export interface DrillStat {
  attempts: number;
  completions: number;
  correct: number;
  wrong: number;
  msTotal: number;
  bestAvgMs?: number;
  bestAccuracy?: number;
  perGear: Record<string, GearStat>;
}
export interface LessonStat {
  attempts: number;
  completions: number;
  bestMs?: number;
  bestErrors?: number;
  errors: Record<string, number>;
}
export interface HistoryEntry {
  t: number;
  kind: 'drill' | 'lesson';
  id: string;
  success: boolean;
  accuracy?: number;
  avgMs?: number;
  durationMs: number;
  errors: number;
}
export interface Progress {
  v: 1;
  drills: Record<string, DrillStat>;
  lessons: Record<string, LessonStat>;
  history: HistoryEntry[];
  errors: Record<string, number>;
  driveSeconds: number;
  distanceM: number;
}

const KEY = 'cambio-manual.progress.v1';

function empty(): Progress {
  return { v: 1, drills: {}, lessons: {}, history: [], errors: {}, driveSeconds: 0, distanceM: 0 };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw) as Progress;
    if (p.v !== 1) return empty();
    return { ...empty(), ...p };
  } catch {
    return empty();
  }
}

let state: Progress = load();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const subs = new Set<() => void>();

function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* sem armazenamento */ }
  }, 400);
  subs.forEach((f) => f());
}

export const progress = {
  get: () => state,
  subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },

  drill(id: string): DrillStat {
    return (state.drills[id] ??= { attempts: 0, completions: 0, correct: 0, wrong: 0, msTotal: 0, perGear: {} });
  },
  lesson(id: string): LessonStat {
    return (state.lessons[id] ??= { attempts: 0, completions: 0, errors: {} });
  },

  startDrill(id: string) { progress.drill(id).attempts++; persist(); },
  answer(id: string, gear: string, ok: boolean, ms?: number) {
    const d = progress.drill(id);
    const g = (d.perGear[gear] ??= { n: 0, ms: 0, wrong: 0 });
    if (ok) { d.correct++; g.n++; if (ms !== undefined) { d.msTotal += ms; g.ms += ms; } }
    else { d.wrong++; g.wrong++; state.errors.wrongGear = (state.errors.wrongGear ?? 0) + 1; }
    persist();
  },
  finishDrill(id: string, r: { accuracy: number; avgMs: number; durationMs: number; errors: number }) {
    const d = progress.drill(id);
    d.completions++;
    if (r.accuracy >= (d.bestAccuracy ?? 0)) d.bestAccuracy = r.accuracy;
    if (r.accuracy >= 0.9 && (d.bestAvgMs === undefined || r.avgMs < d.bestAvgMs)) d.bestAvgMs = r.avgMs;
    state.history.push({ t: Date.now(), kind: 'drill', id, success: r.accuracy >= 0.8, ...r });
    if (state.history.length > 300) state.history.splice(0, state.history.length - 300);
    persist();
  },

  startLesson(id: string) { progress.lesson(id).attempts++; persist(); },
  lessonError(id: string, kind: string) {
    const l = progress.lesson(id);
    l.errors[kind] = (l.errors[kind] ?? 0) + 1;
    persist();
  },
  finishLesson(id: string, r: { durationMs: number; errors: number }) {
    const l = progress.lesson(id);
    l.completions++;
    if (l.bestMs === undefined || r.durationMs < l.bestMs) l.bestMs = r.durationMs;
    if (l.bestErrors === undefined || r.errors < l.bestErrors) l.bestErrors = r.errors;
    state.history.push({ t: Date.now(), kind: 'lesson', id, success: true, ...r });
    persist();
  },

  error(kind: string) {
    state.errors[kind] = (state.errors[kind] ?? 0) + 1;
    persist();
  },
  addDrive(seconds: number, meters: number) {
    state.driveSeconds += seconds;
    state.distanceM += Math.abs(meters);
    // não notifica a interface a cada quadro
    if (!saveTimer) saveTimer = setTimeout(() => {
      saveTimer = null;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    }, 3000);
  },

  reset() {
    state = empty();
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    subs.forEach((f) => f());
  },
};
