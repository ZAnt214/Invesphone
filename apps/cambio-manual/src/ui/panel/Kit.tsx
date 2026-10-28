import React from 'react';
import { sim } from '../../core/sim';
import { quiz, QUIZ, ZONES, zoneOf, carSetup, type CarSetup } from './layout';
import { progress } from '../../train/progress';

const done = () => sim.notify();

export const say = (msg: string | null, title = 'Não disponível agora') => { if (msg) sim.say({ kind: 'info', severity: 'info', title, fix: msg }); };

// ------------------------------------------------------------- exercício "Onde fica?"
export function quizStart() {
  const s = carSetup.get();
  const pool = QUIZ.filter((q) => !q.needs || q.needs(s)).sort(() => Math.random() - 0.5).slice(0, 12);
  Object.assign(quiz, { firstTry: 0, active: true, list: pool, idx: 0, t0: performance.now(), startAt: performance.now(), correct: 0, wrong: 0, times: [], done: false, wrongHere: 0 });
  progress.startDrill('where');
  sim.feedback = [];
  done();
}
export function quizStop() { quiz.active = false; quiz.done = false; done(); }

/** Responde a pergunta atual com o comando tocado. */
export function quizAnswer(qid: string) {
  if (!quiz.active || quiz.done) return;
  const cur = quiz.list[quiz.idx];
  const s: CarSetup = carSetup.get();
  const ok = qid === cur.id;
  if (ok) {
    const ms = performance.now() - quiz.t0;
    quiz.correct++; if (quiz.wrongHere === 0) quiz.firstTry++; quiz.times.push(ms);
    progress.answer('where', cur.id, true, ms);
    sim.audio.switchClick();
    sim.say({ kind: 'ok', severity: 'ok', title: `Certo: ${cur.ask} (${(ms / 1000).toFixed(1).replace('.', ',')} s)` });
    quiz.idx++; quiz.wrongHere = 0; quiz.t0 = performance.now();
    if (quiz.idx >= quiz.list.length) {
      quiz.done = true;
      const total = quiz.correct + quiz.wrong;
      const avg = quiz.times.reduce((a, b) => a + b, 0) / Math.max(1, quiz.times.length);
      progress.finishDrill('where', { accuracy: total ? quiz.correct / total : 1, avgMs: avg, durationMs: performance.now() - quiz.startAt, errors: quiz.wrong });
    }
  } else {
    quiz.wrong++; quiz.wrongHere++;
    progress.answer('where', cur.id, false);
    const z = ZONES[zoneOf(cur.id, s)];
    const touched = QUIZ.find((q) => q.id === qid)?.ask ?? 'outro comando';
    sim.say({ kind: 'wrongGear', severity: 'error', title: `Esse é ${touched}`, what: `Você procura ${cur.ask}: fica em ${z.name.toLowerCase()} (${z.where}).`, fix: cur.hint });
  }
  done();
}

// ------------------------------------------------------------- botões
/**
 * Botão de cabine: dispara no toque (funciona com outro dedo segurando a embreagem).
 * onHold: ação ao segurar 0,55 s; onRelease: ao soltar. No exercício "Onde fica?",
 * o toque responde a pergunta em vez de acionar.
 */
export function Btn(p: {
  children?: unknown; onPress?: () => void; onHold?: () => void; onRelease?: () => void; qid?: string;
  active?: boolean; led?: boolean; testId?: string; label?: string; className?: string; style?: Record<string, unknown>;
}) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = React.useRef(false);
  const quizzing = () => quiz.active && !quiz.done && !!p.qid;
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setAttribute('data-down', '');
    if (quizzing()) { quizAnswer(p.qid!); return; }
    held.current = false;
    if (p.onHold) timer.current = setTimeout(() => { held.current = true; timer.current = null; p.onHold!(); done(); }, 550);
    else { p.onPress?.(); done(); }
  };
  const up = (e?: React.PointerEvent) => {
    (e?.currentTarget as Element | undefined)?.removeAttribute('data-down');
    if (quizzing()) return;
    if (timer.current) { clearTimeout(timer.current); timer.current = null; if (!held.current) { p.onPress?.(); done(); } }
    if (p.onRelease) { p.onRelease(); done(); }
  };
  return (
    <button
      type="button"
      className={`pbtn ${p.active ? 'active' : ''} ${p.className ?? ''}`}
      data-testid={p.testId}
      data-qid={p.qid}
      aria-label={p.label}
      aria-pressed={p.active}
      style={{ touchAction: 'none', ...(p.style ?? {}) }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onClick={(e: React.MouseEvent & { detail: number }) => { if (e.detail === 0) { if (quizzing()) quizAnswer(p.qid!); else { p.onPress?.(); done(); } } }}
    >
      {p.led !== undefined && <i className={`led ${p.led ? 'on' : ''}`} />}
      {p.children}
    </button>
  );
}

export function Seg<T extends string>({ options, value, onChange, testId, qid, vertical }: { options: [T, string][]; value: T; onChange: (v: T) => void; testId?: string; qid?: string; vertical?: boolean }) {
  const act = (k: T) => { if (quiz.active && !quiz.done && qid) { quizAnswer(qid); return; } onChange(k); done(); };
  return (
    <div className={`pseg ${vertical ? 'vert' : ''}`} role="radiogroup" data-testid={testId} data-qid={qid}>
      {options.map(([k, l]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} className={value === k ? 'on' : ''} data-testid={testId ? `${testId}-${k}` : undefined}
          style={{ touchAction: 'none' }}
          onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); const el = e.currentTarget as Element; el.setAttribute('data-down', ''); setTimeout(() => el.removeAttribute('data-down'), 140); act(k); }}
          onClick={(e: React.MouseEvent & { detail: number }) => { if (e.detail === 0) act(k); }}>{l}</button>
      ))}
    </div>
  );
}

/** Botão giratório: − / + giram o botão; a marca mostra a posição. */
export function Dial({ label, value, max, text, onChange, hue, testId, qid }: { label: string; value: number; max: number; text: string; onChange: (v: number) => void; hue?: boolean; testId?: string; qid?: string }) {
  const a = -135 + (270 * value) / max;
  const step = max <= 4 ? 1 : max / 8;
  const drag = React.useRef<number | null>(null);
  // gira com o dedo: o ângulo do toque em volta do centro define a posição (com cliques)
  const turn = (e: React.PointerEvent) => {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const ang = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI;
    const clamped = Math.max(-135, Math.min(135, ang));
    const nv = Math.round((((clamped + 135) / 270) * max) / step) * step;
    if (nv !== value) { onChange(nv); sim.audio.switchClick(); done(); }
  };
  const kDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (quiz.active && !quiz.done && qid) { quizAnswer(qid); return; }
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = e.pointerId;
  };
  const kMove = (e: React.PointerEvent) => { if (drag.current === e.pointerId) turn(e); };
  const kUp = (e: React.PointerEvent) => { if (drag.current === e.pointerId) drag.current = null; };
  return (
    <div className="dial" data-testid={testId}>
      <div className="dial-row">
        <Btn qid={qid} label={`${label} menos`} testId={testId && `${testId}-minus`} onPress={() => onChange(Math.max(0, value - step))}>−</Btn>
        <svg viewBox="0 0 60 60" className="dial-knob" data-testid={testId && `${testId}-knob`} style={{ touchAction: 'none' }} onPointerDown={kDown} onPointerMove={kMove} onPointerUp={kUp} onPointerCancel={kUp}>
          {hue && <path d="M12.6 47.4 A24 24 0 1 1 47.4 47.4" fill="none" stroke="url(#tempg)" strokeWidth="4" />}
          <defs><linearGradient id="tempg" x1="0" x2="1"><stop offset="0" stopColor="#4f8fd6" /><stop offset="1" stopColor="#e05252" /></linearGradient></defs>
          <defs><radialGradient id="knobg" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#4a535c" /><stop offset="0.6" stopColor="#262c32" /><stop offset="1" stopColor="#15191c" /></radialGradient></defs>
          {Array.from({ length: Math.round(max / step) + 1 }, (_, i) => { const t = ((-135 + (270 * i * step) / max) * Math.PI) / 180; return <circle key={i} cx={30 + 27 * Math.sin(t)} cy={30 - 27 * Math.cos(t)} r="1.3" fill={i * step <= value ? 'var(--amber)' : '#3a434b'} />; })}
          <circle cx="30" cy="30" r="21" fill="url(#knobg)" stroke="#3a434b" />
          {Array.from({ length: 24 }, (_, i) => { const t = (i * 15 * Math.PI) / 180; return <line key={`g${i}`} x1={30 + 19 * Math.sin(t)} y1={30 - 19 * Math.cos(t)} x2={30 + 21 * Math.sin(t)} y2={30 - 21 * Math.cos(t)} stroke="#101316" strokeWidth="1" />; })}
          <line x1="30" y1="30" x2={30 + 16 * Math.sin((a * Math.PI) / 180)} y2={30 - 16 * Math.cos((a * Math.PI) / 180)} stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <Btn qid={qid} label={`${label} mais`} testId={testId && `${testId}-plus`} onPress={() => onChange(Math.min(max, value + step))}>+</Btn>
      </div>
      <span className="dial-l">{label}</span>
      <span className="dial-v">{text}</span>
    </div>
  );
}
