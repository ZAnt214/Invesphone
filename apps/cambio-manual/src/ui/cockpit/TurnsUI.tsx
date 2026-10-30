import React from 'react';
import { sim } from '../../core/sim';
import { COURSES, TurnTrainer, type CourseId, type TurnResult } from '../../train/turns';
import { CITY, CARGEO, IDEAL, idealLocal } from '../../sim/city';
import { MirrorCanvas } from './Mirrors';

// ------------------------------------------------------------------ escolha do treino
export function TurnMenu({ onClose }: { onClose: () => void }) {
  const [course, setCourse] = React.useState<CourseId>(() => (sim.runner instanceof TurnTrainer ? sim.runner.id : 'right'));
  const [guides, setGuides] = React.useState(true);
  const go = (demo: boolean) => { sim.startTurns(course, { guides, demo }); onClose(); };
  return (
    <div className="zoom-wrap" onPointerDown={(e: React.PointerEvent) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="zoom-panel tm-panel" data-testid="turn-menu">
        <h3 className="tm-h">Treino de conversões</h3>
        <div className="tm-grid">
          {(Object.keys(COURSES) as CourseId[]).map((k) => (
            <button key={k} type="button" className={`tm-c ${course === k ? 'sel' : ''}`} data-testid={`turn-${k}`} onClick={() => setCourse(k)}>
              <b>{COURSES[k].title}</b><span>{COURSES[k].desc}</span>
            </button>
          ))}
        </div>
        <div className="tm-row">
          <div className="pseg" role="radiogroup">
            <button type="button" className={guides ? 'on' : ''} data-testid="turn-guides-on" onClick={() => setGuides(true)}>Com guias</button>
            <button type="button" className={!guides ? 'on' : ''} data-testid="turn-guides-off" onClick={() => setGuides(false)}>Sem guias</button>
          </div>
          <span className="tm-note">Começa a 25 km/h em 2ª. Olhar o retrovisor = tocar nele.</span>
        </div>
        <div className="tm-row">
          <button type="button" className="btn" data-testid="turn-demo" onClick={() => go(true)}>Ver o instrutor fazer</button>
          <button type="button" className="btn primary" data-testid="turn-start" onClick={() => go(false)}>Começar</button>
          <button type="button" className="btn" data-testid="turn-free" onClick={() => { sim.setCityFree(!sim.cityFree); onClose(); }}>{sim.cityFree ? 'Sair da cidade' : 'Dirigir livre na cidade'}</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ olhada no retrovisor
export function GlanceOverlay({ SW }: { SW: number }) {
  const g = sim.mirrorGlance;
  const [, force] = React.useState(0);
  React.useEffect(() => {
    if (!g) return;
    const t = setTimeout(() => force((x: number) => x + 1), Math.max(0, g.until - sim.now()) + 20);
    return () => clearTimeout(t);
  }, [g]);
  if (!g || sim.now() > g.until) return null;
  const big = g.id === 'I' ? { w: 330, h: 104 } : { w: 250, h: 150 };
  const left = g.id === 'L' ? 120 : g.id === 'R' ? SW - 120 - big.w : SW / 2 - big.w / 2;
  return (
    <div className="glance" data-testid="glance" style={{ left, top: 54, width: big.w, height: big.h }}>
      <MirrorCanvas id={g.id} big className="glance-cv" />
      <span>{g.id === 'L' ? 'Retrovisor esquerdo' : g.id === 'R' ? 'Retrovisor direito' : 'Retrovisor interno'}</span>
    </div>
  );
}

// ------------------------------------------------------------------ replay de cima
const SPEED_COL = (k: number) => (k <= 18 ? '#4cc38a' : k <= 26 ? '#f3a43b' : '#ec4c4f');

function TopView({ r }: { r: TurnResult }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  React.useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const b = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(b.width * dpr); cv.height = Math.round(b.height * dpr);
    const g = cv.getContext('2d')!;
    const W = cv.width, H = cv.height;
    const S = r.turn === 'S';
    const box = { x0: -20, x1: 20, z0: -62, z1: S ? 22 : 16 };
    const k = Math.min(W / (box.x1 - box.x0), H / (box.z1 - box.z0));
    const ox = W / 2 - ((box.x0 + box.x1) / 2) * k, oy = H / 2 + ((box.z0 + box.z1) / 2) * k;
    const X = (lx: number) => ox + lx * k, Y = (lz: number) => oy - lz * k;
    const hw = CITY.W / 2, rc = CITY.Rc;
    // calçadas, asfalto e esquinas arredondadas
    const walk = '#4a4e51', road = '#17191b', lot = '#33373a';
    g.fillStyle = walk; g.fillRect(0, 0, W, H);
    g.fillStyle = road;
    g.fillRect(X(-hw), 0, hw * 2 * k, H);
    g.fillRect(0, Y(hw), W, hw * 2 * k);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * (hw + rc), cz = sz * (hw + rc);
      g.fillStyle = road;
      g.fillRect(Math.min(X(sx * hw), X(cx)), Math.min(Y(sz * hw), Y(cz)), rc * k, rc * k);
      g.fillStyle = walk; g.beginPath(); g.arc(X(cx), Y(cz), rc * k, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = lot;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const a = hw + CITY.walk;
      g.fillRect(Math.min(X(sx * a), X(sx * 80)), Math.min(Y(sz * a), Y(sz * 80)), Math.abs(X(sx * 80) - X(sx * a)), Math.abs(Y(sz * 80) - Y(sz * a)));
    }
    // meio-fio
    g.strokeStyle = '#a8aeb2'; g.lineWidth = Math.max(1, k * 0.18);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * (hw + rc), cz = sz * (hw + rc);
      const a1 = Math.atan2(0, X(sx * hw) - X(cx)), a2 = Math.atan2(Y(sz * hw) - Y(cz), 0);
      const dlt = Math.atan2(Math.sin(a2 - a1), Math.cos(a2 - a1));
      g.beginPath();
      g.moveTo(X(sx * hw), Y(sz * 80)); g.lineTo(X(sx * hw), Y(cz));
      g.arc(X(cx), Y(cz), rc * k, a1, a2, dlt < 0);
      g.lineTo(X(sx * 80), Y(sz * hw));
      g.stroke();
    }
    // faixa central e faixas de pedestres
    g.strokeStyle = '#d9b03a'; g.lineWidth = Math.max(1, k * 0.14); g.setLineDash([3 * k, 5 * k]);
    g.beginPath(); g.moveTo(X(0), Y(-hw - 4)); g.lineTo(X(0), Y(-80)); g.moveTo(X(0), Y(hw + 4)); g.lineTo(X(0), Y(80));
    g.moveTo(X(hw + 4), Y(0)); g.lineTo(X(80), Y(0)); g.moveTo(X(-hw - 4), Y(0)); g.lineTo(X(-80), Y(0)); g.stroke();
    g.setLineDash([]);
    g.fillStyle = 'rgba(230,230,225,0.55)';
    for (let t = -hw + 0.35; t < hw - 0.3; t += 1) {
      for (const s of [-1, 1]) {
        g.fillRect(X(t), Y(s * (hw + 3.8)), 0.5 * k, 3 * k);
        g.fillRect(X(s > 0 ? hw + 0.8 : -hw - 3.8), Y(t + 0.5), 3 * k, 0.5 * k);
      }
    }
    // trajetória ideal
    if (!S) {
      g.strokeStyle = 'rgba(76,195,138,0.9)'; g.lineWidth = Math.max(1.5, k * 0.25); g.setLineDash([k * 1.2, k * 0.8]);
      g.beginPath();
      idealLocal(r.turn, -65, 20).forEach(([lx, lz], i) => (i ? g.lineTo(X(lx), Y(lz)) : g.moveTo(X(lx), Y(lz))));
      g.stroke(); g.setLineDash([]);
    }
    // trajetória real, colorida pela velocidade
    g.lineWidth = Math.max(2, k * 0.35); g.lineCap = 'round';
    for (let i = 1; i < r.trail.length; i++) {
      const a = r.trail[i - 1], b = r.trail[i];
      g.strokeStyle = SPEED_COL(b.kmh);
      g.beginPath(); g.moveTo(X(a.lx), Y(a.lz)); g.lineTo(X(b.lx), Y(b.lz)); g.stroke();
    }
    // o carro no fim
    const last = r.trail[r.trail.length - 1];
    if (last) {
      g.save(); g.translate(X(last.lx), Y(last.lz)); g.rotate(last.hl);
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.fillRect(-CARGEO.halfW * k, -CARGEO.front * k, CARGEO.halfW * 2 * k, (CARGEO.front - CARGEO.rear) * k);
      g.fillStyle = '#16181a'; g.fillRect(-CARGEO.halfW * k * 0.7, -CARGEO.front * k * 0.7, CARGEO.halfW * 1.4 * k, k * 0.8);
      g.restore();
    }
    // marcas
    const icon: Record<string, [string, string]> = { glance: ['#4f9bff', 'R'], signal: ['#f3a43b', 'S'], brake: ['#ec4c4f', 'F'], start: ['#ffffff', 'V'], curb: ['#ec4c4f', '✕'], stall: ['#ec4c4f', '!'] };
    g.font = `700 ${Math.max(9, k * 1.7)}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const m of r.marks) {
      const [col, ch] = icon[m.kind];
      const x = X(m.lx) + (m.kind === 'start' ? 0 : -k * 2.6), y = Y(m.lz);
      g.fillStyle = '#0b0c0d'; g.beginPath(); g.arc(x, y, k * 1.25, 0, Math.PI * 2); g.fill();
      g.strokeStyle = col; g.lineWidth = Math.max(1, k * 0.25); g.stroke();
      g.fillStyle = col; g.fillText(ch, x, y + 0.5);
    }
    // ponto ideal de virar
    if (!S) {
      const st = IDEAL[r.turn];
      g.strokeStyle = 'rgba(76,195,138,0.9)'; g.lineWidth = 1.5;
      g.beginPath(); g.arc(X(st.x0), Y(st.start), k * 1.3, 0, Math.PI * 2); g.stroke();
    }
  }, [r]);
  return <canvas ref={ref} className="tr-map" data-testid="turn-map" />;
}

// ------------------------------------------------------------------ relatório
export function TurnReport() {
  const r = sim.runner;
  const [idx, setIdx] = React.useState(0);
  const shown = React.useRef<{ r: unknown; t: number }>({ r: null, t: 0 });
  if (!(r instanceof TurnTrainer) || !r.done || !r.results.length) return null;
  if (shown.current.r !== r) { shown.current = { r, t: performance.now() }; if (idx) setIdx(0); }
  const ready = () => performance.now() - shown.current.t > 700;
  const res = r.results[Math.min(idx, r.results.length - 1)];
  const total = r.results.reduce((a, x) => a + x.faults, 0);
  const name = res.turn === 'R' ? 'à direita' : res.turn === 'L' ? 'à esquerda' : 'reto';
  const again = (demo: boolean, course = r.id) => { if (ready()) sim.startTurns(course, { guides: r.guides, demo }); };
  return (
    <div className="zoom-wrap" data-testid="turn-report">
      <div className="zoom-panel tr-panel">
        <div className="tr-head">
          <b>{r.demo ? 'Instrutor: ' : ''}{r.title}</b>
          <span className={total ? 'warn' : 'ok'}>{total ? `${total} ${total === 1 ? 'ponto a melhorar' : 'pontos a melhorar'}` : 'tudo certo'}</span>
          {r.results.length > 1 && (
            <span className="tr-pager">
              <button type="button" className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>◀</button>
              Conversão {idx + 1} de {r.results.length} ({name})
              <button type="button" className="btn" disabled={idx >= r.results.length - 1} onClick={() => setIdx(idx + 1)} data-testid="turn-next">▶</button>
            </span>
          )}
        </div>
        <div className="tr-body">
          <div className="tr-left">
            <TopView r={res} />
            <div className="tr-legend"><i style={{ background: '#4cc38a' }} />≤18 <i style={{ background: '#f3a43b' }} />≤26 <i style={{ background: '#ec4c4f' }} />km/h · <em>tracejado: ideal</em></div>
          </div>
          <div className="tr-right">
            <ul className="tr-items" data-testid="turn-items">
              {res.items.map((it) => (
                <li key={it.key} className={it.ok === false ? 'bad' : 'good'}><span>{it.ok === false ? '✕' : '✓'}</span>{it.label}<em>{it.value}</em></li>
              ))}
            </ul>
            <p className="tr-tip" data-testid="turn-tip">{res.tip ?? (r.demo ? 'Repare na sequência: retrovisor, seta, reduzir, encostar, virar no ponto e desvirar.' : `Conversão ${name} bem feita. Tente sem guias para treinar a referência sozinho.`)}</p>
            <div className="tr-btns">
              <button type="button" className="btn" onClick={() => { if (ready()) sim.stopRunner(); }}>Fechar</button>
              <button type="button" className="btn" onClick={() => again(true)}>Ver o instrutor</button>
              {(r.id === 'right' || r.id === 'left') && <button type="button" className="btn" onClick={() => again(false, r.id === 'right' ? 'left' : 'right')}>{r.id === 'right' ? 'Treinar esquerda' : 'Treinar direita'}</button>}
              <button type="button" className="btn primary" data-testid="turn-again" onClick={() => again(false)}>Repetir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
