import React from 'react';
import { sim } from '../../core/sim';
import { useFrame } from '../hooks';
import { LAMP_ICONS, LAMP_COLOR } from '../panel/Icons';
import { REDLINE_RPM } from '../../sim/car';
import { TANK_L } from '../../sim/vehicle';

// Quadro em coordenadas próprias 240×120: conta-giros à esquerda, velocímetro à direita
// (ponteiros, aros cromados) e tela central (marcha, velocidade, computador de bordo,
// combustível e temperatura), como no quadro de um hatch compacto.
const W = 240, H = 120;
const TC = { x: 47, y: 63 }, SC = { x: 193, y: 63 };
const R = 41;
const A0 = -130, SWEEP = 260;
const KMH_MAX = 220;
const pol = (c: { x: number; y: number }, a: number, r: number) => { const t = ((a - 90) * Math.PI) / 180; return [c.x + r * Math.cos(t), c.y + r * Math.sin(t)]; };

const TOP = ['turnL', 'pos', 'low', 'high', 'fog', 'cruise', 'cruiseSet', 'limiter', 'isgAuto', 'hac', 'turnR'];
const DIAL = ['battery', 'oil', 'engine', 'brake', 'abs', 'airbag'];
const TFT = ['belt', 'door', 'fuel', 'coolant', 'esp', 'espOff', 'tpms', 'isgOff'];
const COLORS: Record<string, string> = { green: '#3fd27f', blue: '#4f9bff', red: '#ff4b4b', amber: '#ffb02e', white: '#e9edf0' };

function Lamp({ id, x, y, s }: { id: string; x: number; y: number; s: number }) {
  return (
    <svg x={x} y={y} width={s} height={s} viewBox="0 0 24 24" className="clamp" data-lamp={id} style={{ color: '#1a1f24' }}>
      {LAMP_ICONS[id]() as React.ReactNode}
    </svg>
  );
}

/** Mostrador analógico: face, aro cromado, escala e números. */
function Dial({ c, id, on, back, max, major, minor, label, every, red }: {
  c: { x: number; y: number }; id: string; on: boolean; back: number; max: number; major: number; minor: number; label: (v: number) => string; every: number; red?: number;
}) {
  const ink = on ? '#eef2f4' : '#3a424a';
  const ticks: React.ReactNode[] = [];
  for (let v = 0; v <= max + 1e-6; v += minor) {
    const a = A0 + (SWEEP * v) / max;
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const [x0, y0] = pol(c, a, R - 2), [x1, y1] = pol(c, a, isMajor ? R - 8 : R - 5);
    const isRed = red !== undefined && v >= red;
    ticks.push(<line key={v} x1={x0} y1={y0} x2={x1} y2={y1} stroke={isRed ? '#ff4b4b' : ink} strokeWidth={isMajor ? 1.5 : 0.7} opacity={on ? back : 1} />);
    if (isMajor && Math.abs(v / every - Math.round(v / every)) < 1e-6) {
      const [tx, ty] = pol(c, a, R - 15);
      ticks.push(<text key={`t${v}`} x={tx} y={ty} className="c-num" textAnchor="middle" dominantBaseline="central" style={{ fill: isRed ? '#ff4b4b' : ink, opacity: on ? back : 1 }}>{label(v)}</text>);
    }
  }
  return (
    <g>
      {/* poço do mostrador e aro cromado */}
      <circle cx={c.x} cy={c.y + 1.5} r={R + 4} fill="#000" opacity="0.7" />
      <circle cx={c.x} cy={c.y} r={R + 2.6} fill="none" stroke={`url(#ring-${id})`} strokeWidth="2.4" />
      <circle cx={c.x} cy={c.y} r={R + 1.2} fill={`url(#dial-${id})`} />
      <circle cx={c.x} cy={c.y} r={R - 9.5} fill="none" stroke="#ffffff" strokeOpacity="0.035" strokeWidth="5" />
      {red !== undefined && (() => {
        const [x0, y0] = pol(c, A0 + (SWEEP * red) / max, R - 2.5), [x1, y1] = pol(c, A0 + SWEEP, R - 2.5);
        return <path d={`M${x0} ${y0} A${R - 2.5} ${R - 2.5} 0 0 1 ${x1} ${y1}`} fill="none" stroke="#ff4b4b" strokeWidth="2.6" opacity={on ? 0.85 : 0.35} />;
      })()}
      {ticks}
    </g>
  );
}

/** Ponteiro com sombra; gira em volta do centro do mostrador. */
function Needle({ c, gref, name }: { c: { x: number; y: number }; gref: React.MutableRefObject<SVGGElement | null>; name: string }) {
  return (
    <>
      <g ref={gref} transform={`rotate(${A0} ${c.x} ${c.y})`} data-needle={name}>
        <path d={`M${c.x - 1.5 + 1} ${c.y + 9 + 1.4} L${c.x + 1} ${c.y - R + 4 + 1.4} L${c.x + 1.5 + 1} ${c.y + 9 + 1.4} Z`} fill="#000" opacity="0.55" />
        <path d={`M${c.x - 1.5} ${c.y + 9} L${c.x - 0.3} ${c.y - R + 4} L${c.x + 0.3} ${c.y - R + 4} L${c.x + 1.5} ${c.y + 9} Z`} fill="#ff6a24" className="c-needle" />
        <path d={`M${c.x - 0.25} ${c.y - 4} L${c.x - 0.15} ${c.y - R + 5}`} stroke="#ffd2b8" strokeWidth="0.35" opacity="0.8" />
      </g>
      <circle cx={c.x} cy={c.y} r="5.2" fill="#0b0d10" stroke="#3a424a" strokeWidth="0.8" />
      <circle cx={c.x - 1.2} cy={c.y - 1.4} r="2" fill="#ffffff" opacity="0.08" />
    </>
  );
}

export function ClusterSvg({ x = 0, y = 0, width = W, height = H, id = 'c' }: { x?: number; y?: number; width?: number; height?: number; id?: string }) {
  const tach = React.useRef<SVGGElement | null>(null);
  const spdNeedle = React.useRef<SVGGElement | null>(null);
  const speed = React.useRef<SVGTextElement | null>(null);
  const root = React.useRef<SVGSVGElement | null>(null);
  const smooth = React.useRef(0);
  const smoothV = React.useRef(0);

  useFrame(() => {
    const c = sim.car, v = sim.veh;
    const on = v.powerOn;
    smooth.current += ((on ? c.rpm : 0) - smooth.current) * 0.45;
    smoothV.current += ((on ? Math.abs(c.kmh) : 0) - smoothV.current) * 0.3;
    if (tach.current) tach.current.setAttribute('transform', `rotate(${(A0 + (SWEEP * Math.min(8000, Math.max(0, smooth.current))) / 8000).toFixed(2)} ${TC.x} ${TC.y})`);
    if (spdNeedle.current) spdNeedle.current.setAttribute('transform', `rotate(${(A0 + (SWEEP * Math.min(KMH_MAX, smoothV.current)) / KMH_MAX).toFixed(2)} ${SC.x} ${SC.y})`);
    if (speed.current) { const t = on ? String(Math.round(Math.abs(c.kmh))) : ''; if (speed.current.textContent !== t) speed.current.textContent = t; }
    if (root.current) {
      const L = v.lamps(c);
      const blink = Math.floor(performance.now() / 400) % 2 === 0;
      root.current.querySelectorAll<SVGSVGElement>('[data-lamp]').forEach((el) => {
        const st = L[el.dataset.lamp!];
        const lit = st === 'on' || (st === 'blink' && blink);
        const col = lit ? COLORS[LAMP_COLOR[el.dataset.lamp!]] : '#1a1f24';
        if (el.style.color !== col) { el.style.color = col; el.classList.toggle('lit', lit); }
      });
    }
  });

  const v = sim.veh, c = sim.car;
  const on = v.powerOn;
  const trip = v.tripInfo();
  const g = c.gear;
  const hint = on && c.engineOn && c.locked && g !== 'N' && g !== 'R' ? (c.rpm > 3600 && g !== '5' ? '▲' : c.rpm < 1250 && g !== '1' && c.inputs.throttle > 0.3 ? '▼' : '') : '';
  const cruise = v.cruiseMain ? (v.limiterMode ? `LIM ${v.setSpeed || '---'}` : `CRUISE ${v.cruiseActive ? v.setSpeed : v.setSpeed ? `(${v.setSpeed})` : '---'}`) : '';
  const back = on ? (v.night && v.position ? 0.8 : 1) : 0;
  const bars = (frac: number, yy: number, lo: string, hi: string, warn: boolean) => {
    const n = 8, k = on ? Math.ceil(frac * n - 0.01) : 0;
    return (
      <g>
        <text x="99.5" y={yy + 3} className="c-bar">{lo}</text>
        {Array.from({ length: n }, (_, i) => <rect key={i} x={104 + i * 4.2} y={yy} width="3.5" height="3.4" rx="0.6" fill={i < k ? (warn && frac < 0.15 ? '#ffb02e' : '#cfe6ff') : '#141a20'} />)}
        <text x="140.5" y={yy + 3} className="c-bar" textAnchor="end">{hi}</text>
      </g>
    );
  };
  const tColdHot = Math.max(0, Math.min(1, (v.coolant - 40) / 70));

  return (
    <svg ref={root} x={x} y={y} width={width} height={height} viewBox={`0 0 ${W} ${H}`} className="cluster-svg" data-testid={`cluster-${id}`}>
      <defs>
        <radialGradient id={`face-${id}`} cx="50%" cy="35%" r="75%"><stop offset="0" stopColor="#0c1014" /><stop offset="1" stopColor="#020304" /></radialGradient>
        {['t', 's'].map((k) => (
          <React.Fragment key={k}>
            <radialGradient id={`dial-${id}-${k}`} cx="50%" cy="38%" r="65%"><stop offset="0" stopColor="#151b21" /><stop offset="0.7" stopColor="#080b0e" /><stop offset="1" stopColor="#030405" /></radialGradient>
            <linearGradient id={`ring-${id}-${k}`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#e9eef2" /><stop offset="0.3" stopColor="#6d777f" /><stop offset="0.55" stopColor="#c7ced4" /><stop offset="0.8" stopColor="#4a535a" /><stop offset="1" stopColor="#9aa3ab" /></linearGradient>
          </React.Fragment>
        ))}
        <linearGradient id={`hood-${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0.75" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
        <linearGradient id={`tft-${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#060a0e" /><stop offset="1" stopColor="#020304" /></linearGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="18" fill={`url(#face-${id})`} />
      <Dial c={TC} id={`${id}-t`} on={on} back={back} max={8000} major={1000} minor={500} every={1000} red={REDLINE_RPM} label={(r) => String(r / 1000)} />
      <Dial c={SC} id={`${id}-s`} on={on} back={back} max={KMH_MAX} major={20} minor={10} every={40} label={(k) => String(k)} />
      <text x={TC.x} y={TC.y - 13} className="c-tiny" textAnchor="middle">×1000 r/min</text>
      <text x={SC.x} y={SC.y - 13} className="c-tiny" textAnchor="middle">km/h</text>
      {DIAL.map((l, i) => <Lamp key={l} id={l} x={TC.x - 26 + i * 8.9} y={TC.y + 21} s={8} />)}
      {/* tela central */}
      <rect x="95" y="20" width="50" height="86" rx="5" fill="#000" opacity="0.7" transform="translate(0 1.2)" />
      <rect x="95" y="20" width="50" height="86" rx="5" fill={`url(#tft-${id})`} stroke="#1c232a" strokeWidth="0.8" />
      {on && (
        <g opacity={back}>
          <text x="113" y="47" className="c-gear" textAnchor="middle">{g}</text>
          <text x="128" y="44" className="c-hint">{hint}</text>
          <text ref={speed} x="126" y="60" className="c-speed" textAnchor="end" data-testid={`speed-${id}`}>0</text>
          <text x="128" y="60" className="c-tiny">km/h</text>
          <text x="120" y="67" className="c-cruise" textAnchor="middle">{cruise}</text>
          <line x1="99" x2="141" y1="70" y2="70" stroke="#1d252d" strokeWidth="0.6" />
          <text x="120" y="76.5" className="c-trip-l" textAnchor="middle" data-testid={`trip-${id}`}>{trip.label}</text>
          <text x="120" y="86" className="c-trip" textAnchor="middle">{trip.value}<tspan className="c-tiny"> {trip.unit}</tspan></text>
          {bars(v.fuel / TANK_L, 91, 'E', 'F', true)}
          {bars(tColdHot, 98, 'C', 'H', false)}
        </g>
      )}
      {!on && v.ignition === 'ACC' && <text x="120" y="64" className="c-tiny" textAnchor="middle">ACC</text>}
      {/* ponteiros por cima de tudo */}
      <Needle c={TC} gref={tach} name="rpm" />
      <Needle c={SC} gref={spdNeedle} name="kmh" />
      {/* luzes de indicação: em cima e embaixo */}
      {TOP.map((l, i) => <Lamp key={l} id={l} x={48 + i * 13} y={2} s={11} />)}
      {TFT.map((l, i) => <Lamp key={l} id={l} x={67 + i * 13.5} y={108} s={9} />)}
      {/* sombra da cobertura do quadro e reflexo do vidro */}
      <rect x="0" y="0" width={W} height="26" rx="18" fill={`url(#hood-${id})`} pointerEvents="none" />
      <path d={`M14 4 L${W * 0.48} 4 L${W * 0.3} ${H - 6} L6 ${H - 6} Z`} fill="#ffffff" opacity="0.025" pointerEvents="none" />
    </svg>
  );
}
