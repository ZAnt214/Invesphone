import React from 'react';
import { sim } from '../core/sim';
import type { Feedback } from '../train/feedback';

function FeedbackCard({ f }: { f: Feedback }) {
  return (
    <div className={`fb ${f.severity}`} data-testid="feedback">
      <b>{f.title}</b>
      {f.what && <div className="what">{f.what}</div>}
      {f.fix && <div className="fix">{f.fix}</div>}
    </div>
  );
}

const FREE_TIPS = [
  'Para sair: embreagem no fundo, 1ª, solte o freio de mão, acelere a ~1.500 rpm e suba a embreagem devagar pelo ponto.',
  'Troque de marcha entre 2.500 e 3.500 rpm. A seta ▲ no painel avisa quando está na hora.',
  'Para parar: freie e pise a embreagem antes de o giro cair abaixo de 1.000 rpm.',
];

export function Coach({ onPick }: { onPick: () => void }) {
  const r = sim.runner;
  const now = sim.now();
  const latest = sim.feedback[0];
  const fresh = latest && now - latest.t < (latest.severity === 'ok' ? 2500 : 9000) ? latest : null;

  if (sim.mode === 'free') {
    const c = sim.car;
    const tip = !c.engineOn ? 'Pise a embreagem até o fundo e toque em Partida.' : c.gear === 'N' && c.kmh < 1 ? FREE_TIPS[0] : c.locked && c.gear !== 'N' ? FREE_TIPS[1] : FREE_TIPS[2];
    return (
      <section className="coach" aria-live="polite">
        <div className="coach-head"><span className="coach-title">Direção livre{sim.grade ? ` · rampa ${Math.round(sim.grade * 100)}%` : ''}</span></div>
        {fresh ? <FeedbackCard f={fresh} /> : <div className="hint" style={{ fontSize: 13.5 }}>{tip}</div>}
      </section>
    );
  }

  if (!r) {
    return (
      <section className="coach">
        <div className="coach-head">
          <span className="coach-title">{sim.mode === 'learn' ? 'Aprender o câmbio' : 'Aulas de direção'}</span>
          <button className="link" onClick={onPick}>Escolher</button>
        </div>
        <div className="instr">{sim.mode === 'learn' ? 'Escolha um exercício de alavanca.' : 'Escolha uma aula.'}</div>
        {fresh && <FeedbackCard f={fresh} />}
      </section>
    );
  }

  const steps = [];
  for (let i = 0; i < r.stepCount; i++) steps.push(<i key={i} className={i < r.stepIndex ? 'done' : i === r.stepIndex ? 'cur' : ''} />);
  return (
    <section className="coach" aria-live="polite">
      <div className="coach-head">
        <span className="coach-title">{r.title} · {Math.min(r.stepIndex + 1, r.stepCount)}/{r.stepCount}</span>
        {r.stepCount <= 14 && <span className="coach-steps">{steps}</span>}
        <button className="link" onClick={() => sim.stopRunner()}>Sair</button>
      </div>
      <div className="instr" data-testid="instruction">{r.instruction}</div>
      {fresh && fresh.severity !== 'ok' ? <FeedbackCard f={fresh} /> : r.hint ? <div className="hint">{fresh ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>{fresh.title}. </span> : null}{r.hint}</div> : fresh ? <FeedbackCard f={fresh} /> : null}
    </section>
  );
}
