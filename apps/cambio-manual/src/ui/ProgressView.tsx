import React from 'react';
import { useProgress } from './hooks';
import { progress } from '../train/progress';
import { DRILLS, LESSONS } from '../train/runners';
import { ERROR_LABEL } from '../train/feedback';
import { QUIZ } from './panel/layout';

const fmtS = (ms?: number) => (ms === undefined || !isFinite(ms) ? '—' : `${(ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} s`);

const FIX: Record<string, string> = {
  stall: 'Segure a embreagem no ponto um instante com ~1.500 rpm antes de soltar o resto.',
  grind: 'Embreagem no fundo antes de entrar com a marcha.',
  jerk: 'Solte a embreagem mais devagar; nas reduções, dê um toque no acelerador.',
  overrev: 'Freie antes de reduzir. 2ª só abaixo de ~50 km/h.',
  wrongGear: 'Repita "Localizar marchas" até não errar.',
  reverseLock: 'Segure a alavanca até o anel acender antes de ir para a ré.',
  rollback: 'Freio de mão até a embreagem estar no ponto.',
  lugging: 'Reduza quando o giro cair abaixo de 1.200 rpm.',
  earlyShift: 'Espere 2.500 rpm para trocar.',
};

export function ProgressView() {
  const p = useProgress();
  const [confirm, setConfirm] = React.useState(false);

  // Mapa do H: tempo médio e erros por marcha (todos os exercícios)
  const perGear: Record<string, { n: number; ms: number; wrong: number }> = {};
  for (const d of Object.values(p.drills)) {
    for (const [g, s] of Object.entries(d.perGear)) {
      const t = (perGear[g] ??= { n: 0, ms: 0, wrong: 0 });
      t.n += s.n; t.ms += s.ms; t.wrong += s.wrong;
    }
  }
  const msVals = Object.values(perGear).filter((s) => s.n).map((s) => s.ms / s.n);
  const maxMs = Math.max(1, ...msVals);

  const drillsDone = Object.values(p.drills).reduce((a, d) => a + d.completions, 0);
  const lessonsDone = Object.values(p.lessons).reduce((a, d) => a + d.completions, 0);
  const totalAns = Object.values(p.drills).reduce((a, d) => a + d.correct + d.wrong, 0);
  const totalOk = Object.values(p.drills).reduce((a, d) => a + d.correct, 0);

  // Evolução: tempo médio de resposta nos exercícios de localização
  const hist = p.history.filter((h) => h.kind === 'drill' && h.avgMs !== undefined).slice(-24);
  const errors = Object.entries(p.errors).filter(([k]) => ERROR_LABEL[k]).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cell = (g: string) => {
    const s = perGear[g];
    const avg = s && s.n ? s.ms / s.n : undefined;
    const heat = avg ? avg / maxMs : 0;
    return (
      <div className="hcell" key={g} style={avg ? { borderColor: `rgba(243,164,59,${0.25 + heat * 0.75})` } : undefined}>
        <div className="g" style={{ color: g === 'R' ? 'var(--red)' : 'var(--ink)' }}>{g}</div>
        <div className="m">{avg ? fmtS(avg) : '—'}</div>
        <div className="m">{s?.wrong ? `${s.wrong} erro${s.wrong > 1 ? 's' : ''}` : s?.n ? 'sem erros' : 'sem dados'}</div>
      </div>
    );
  };

  return (
    <div className="progress-view" data-testid="progress">
      <div className="card">
        <h3>Resumo</h3>
        <div className="tiles">
          <div className="tile"><div className="v">{totalAns ? `${Math.round((totalOk / totalAns) * 100)}%` : '—'}</div><div className="k">acerto na alavanca ({totalAns} engates)</div></div>
          <div className="tile"><div className="v">{drillsDone + lessonsDone}</div><div className="k">exercícios e aulas concluídos</div></div>
          <div className="tile"><div className="v">{Math.round(p.driveSeconds / 60)} min</div><div className="k">dirigindo</div></div>
          <div className="tile"><div className="v">{(p.distanceM / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</div><div className="k">percorridos</div></div>
        </div>
      </div>

      <div className="card">
        <h3>Tempo para achar cada marcha</h3>
        <div className="hmap">
          {cell('1')}{cell('3')}{cell('5')}
          <div className="hrail">— N —</div>
          {cell('2')}{cell('4')}{cell('R')}
        </div>
      </div>

      <div className="card">
        <h3>Evolução do tempo médio</h3>
        {hist.length >= 2 ? <Spark values={hist.map((h) => h.avgMs!)} /> : <p className="empty">Conclua pelo menos dois exercícios de alavanca para ver a curva.</p>}
      </div>

      <div className="card">
        <h3>Exercícios</h3>
        <table className="tbl">
          <thead><tr><th>Exercício</th><th className="r">Feitos</th><th className="r">Melhor</th><th className="r">Tempo</th></tr></thead>
          <tbody>
            {DRILLS.map((d) => {
              const s = p.drills[d.id];
              return <tr key={d.id}><td>{d.title}</td><td className="r">{s?.completions ?? 0}</td><td className="r">{s?.bestAccuracy !== undefined ? `${Math.round(s.bestAccuracy * 100)}%` : '—'}</td><td className="r">{fmtS(s?.bestAvgMs)}</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <WhereCard />

      <div className="card">
        <h3>Aulas</h3>
        <table className="tbl">
          <thead><tr><th>Aula</th><th className="r">Feitas</th><th className="r">Melhor</th><th className="r">Erros</th></tr></thead>
          <tbody>
            {LESSONS.map((l) => {
              const s = p.lessons[l.id];
              return <tr key={l.id}><td>{l.title}</td><td className="r">{s?.completions ?? 0}</td><td className="r">{fmtS(s?.bestMs)}</td><td className="r">{s?.bestErrors ?? '—'}</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Erros mais comuns</h3>
        {errors.length ? (
          <table className="tbl"><tbody>
            {errors.map(([k, n]) => <tr key={k}><td><b>{ERROR_LABEL[k]}</b><div className="empty">{FIX[k] ?? ''}</div></td><td className="r">{n}×</td></tr>)}
          </tbody></table>
        ) : <p className="empty">Nenhum erro registrado ainda.</p>}
      </div>

      <div className="card">
        {confirm ? (
          <div className="row-btns" style={{ marginTop: 0 }}>
            <button className="btn" onClick={() => setConfirm(false)}>Cancelar</button>
            <button className="btn danger" onClick={() => { progress.reset(); setConfirm(false); }}>Apagar tudo</button>
          </div>
        ) : (
          <button className="btn danger" style={{ width: '100%' }} onClick={() => setConfirm(true)}>Zerar progresso</button>
        )}
        <p className="empty" style={{ marginTop: 8 }}>O progresso fica salvo neste aparelho e navegador.</p>
      </div>
    </div>
  );
}

function WhereCard() {
  const p = useProgress();
  const d = p.drills.where;
  if (!d) return null;
  const items = Object.entries(d.perGear).map(([id, s]) => ({ id, ms: s.n ? s.ms / s.n : Infinity, wrong: s.wrong }))
    .sort((a, b) => b.wrong - a.wrong || b.ms - a.ms).slice(0, 4);
  const names = Object.fromEntries(QUIZ.map((q) => [q.id, q.ask]));
  return (
    <div className="card">
      <h3>Onde fica (comandos do painel)</h3>
      <div className="tiles">
        <div className="tile"><div className="v">{d.bestAccuracy !== undefined ? `${Math.round(d.bestAccuracy * 100)}%` : '—'}</div><div className="k">melhor acerto ({d.completions} rodadas)</div></div>
        <div className="tile"><div className="v">{fmtS(d.bestAvgMs)}</div><div className="k">melhor tempo médio</div></div>
      </div>
      <table className="tbl" style={{ marginTop: 8 }}><thead><tr><th>Para revisar</th><th className="r">Erros</th><th className="r">Tempo</th></tr></thead><tbody>
        {items.map((it) => <tr key={it.id}><td>{names[it.id] ?? it.id}</td><td className="r">{it.wrong}</td><td className="r">{isFinite(it.ms) ? fmtS(it.ms) : '—'}</td></tr>)}
      </tbody></table>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  const W = 320, H = 80, P = 6;
  const max = Math.max(...values) * 1.1;
  const min = 0;
  const x = (i: number) => P + (i * (W - 2 * P)) / (values.length - 1);
  const y = (v: number) => H - 14 - ((v - min) / (max - min)) * (H - 24);
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1).toFixed(1)} ${H - 14} L${x(0).toFixed(1)} ${H - 14} Z`;
  const last = values[values.length - 1];
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Tempo médio por exercício">
      <line x1={P} x2={W - P} y1={H - 14} y2={H - 14} stroke="var(--line)" />
      <path d={area} fill="rgba(243,164,59,0.12)" />
      <path d={line} fill="none" stroke="var(--amber)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      <circle cx={x(values.length - 1)} cy={y(last)} r="3.5" fill="var(--amber)" />
      <text x={W - P} y={H - 2} textAnchor="end" fontSize="10" fill="var(--ink-dim)">último: {fmtS(last)}</text>
      <text x={P} y={H - 2} fontSize="10" fill="var(--ink-faint)">{values.length} exercícios</text>
    </svg>
  );
}
