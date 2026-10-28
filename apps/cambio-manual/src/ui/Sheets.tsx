import React from 'react';
import { sim } from '../core/sim';
import { DRILLS, LESSONS } from '../train/runners';
import { useProgress } from './hooks';

const fmtS = (ms?: number) => (ms === undefined ? '—' : `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} s`);

export function PickerSheet({ onClose }: { onClose: () => void }) {
  const p = useProgress();
  const learn = sim.mode === 'learn';
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e: React.MouseEvent) => e.stopPropagation()} role="dialog" aria-label={learn ? 'Exercícios' : 'Aulas'}>
        <h2>{learn ? 'Exercícios de alavanca' : 'Aulas de direção'}</h2>
        <p className="sub">
          {learn
            ? 'Treine a localização das marchas até achar cada uma sem olhar. Os exercícios usam a alavanca com o carro parado.'
            : 'Situações reais com motor, embreagem e acelerador. O instrutor explica cada erro.'}
        </p>
        <div className="list">
          {learn
            ? DRILLS.map((d) => {
                const st = p.drills[d.id];
                return (
                  <button key={d.id} className="item" data-testid={`drill-${d.id}`} onClick={() => { sim.startDrill(d.id); onClose(); }}>
                    <b>{d.title}</b>
                    <span className="stat">{st?.bestAccuracy !== undefined ? <><strong>{Math.round(st.bestAccuracy * 100)}%</strong>{fmtS(st.bestAvgMs)}</> : 'novo'}</span>
                    <span className="d">{d.desc}</span>
                  </button>
                );
              })
            : LESSONS.map((l) => {
                const st = p.lessons[l.id];
                return (
                  <button key={l.id} className="item" data-testid={`lesson-${l.id}`} onClick={() => { sim.startLesson(l.id); onClose(); }}>
                    <b>{l.title}</b>
                    <span className="stat">{st?.completions ? <><strong>{st.completions}×</strong>{fmtS(st.bestMs)}</> : 'nova'}</span>
                    <span className="d">{l.desc}</span>
                  </button>
                );
              })}
        </div>
        <div className="row-btns"><button className="btn" onClick={onClose}>Fechar</button></div>
      </div>
    </div>
  );
}

export function SummarySheet() {
  const r = sim.runner;
  // os botões só aceitam toque depois de 0,8 s: evita que um polegar voltando ao pedal acione "Repetir"
  const shownAt = React.useRef<{ r: unknown; t: number }>({ r: null, t: 0 });
  if (!r?.done || !r.summary) return null;
  if (shownAt.current.r !== r) shownAt.current = { r, t: performance.now() };
  const ready = () => performance.now() - shownAt.current.t > 800;
  const s = r.summary;
  const again = () => { if (!ready()) return; if (r.kind === 'drill') sim.startDrill(r.id); else sim.startLesson(r.id); };
  const close = () => { if (ready()) sim.stopRunner(); };
  return (
    <div className="sheet-wrap top">
      <div className="sheet" role="dialog" aria-label="Resultado" data-testid="summary">
        <h2>{s.title}</h2>
        <div className="stars" aria-label={`${s.stars} de 3`}>{[1, 2, 3].map((i) => <span key={i} className={i <= s.stars ? '' : 'off'}>★</span>)}</div>
        <dl className="kv">
          {s.lines.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
        </dl>
        <div className="row-btns">
          <button className="btn" onClick={close}>Fechar</button>
          <button className="btn primary" onClick={again}>Repetir</button>
        </div>
      </div>
    </div>
  );
}

export function StartScreen() {
  return (
    <div className="start-screen">
      <h1>Câmbio <em>manual</em></h1>
      <p>Simulador para aprender a coordenar embreagem, alavanca e acelerador. Motor, transmissão e som são simulados em tempo real.</p>
      <div className="mini-h" aria-label="Padrão do câmbio">1 · 3 · 5<br />└─ N ─┘<br />2 · 4 · R</div>
      <div className="howto">
        <div><b>Embreagem</b><span>Polegar esquerdo na trilha da esquerda. Topo = pedal solto; embaixo = no fundo. A faixa âmbar é o ponto de acoplamento.</span></div>
        <div><b>Alavanca</b><span>Arraste em qualquer lugar do quadro do câmbio. Ela só anda pelos corredores do H, passando pelo neutro.</span></div>
        <div><b>Ré</b><span>Toque e segure a alavanca meio segundo até o anel acender, depois leve para a direita e para baixo.</span></div>
        <div><b>Pedais</b><span>Freio e acelerador com o polegar direito. Tirar o dedo solta o pedal na hora, inclusive a embreagem.</span></div>
        <div><b>Som</b><span>Aumente o volume do iPhone. O motor é sintetizado conforme giro e carga.</span></div>
      </div>
      <button className="btn primary" data-testid="enter" onClick={() => sim.enterCar()}>Entrar no carro</button>
    </div>
  );
}
