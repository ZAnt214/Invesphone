import React from 'react';
import { sim } from '../../core/sim';
import { useFrame } from '../hooks';
import { LAMP_ICONS, LAMP_COLOR } from '../panel/Icons';
import { REDLINE_RPM } from '../../sim/car';
import { TANK_L } from '../../sim/vehicle';

// Quadro em coordenadas próprias 240×120: conta-giros analógico à esquerda,
// tela digital à direita (velocidade, marcha, computador de bordo, combustível e temperatura).
const W = 240, H = 120;
const TC = { x: 58, y: 64, r: 50 };
const A0 = -130, SW = 260;
const pol = (a: number, r: number) => { const t = ((a - 90) * Math.PI) / 180; return [TC.x + r * Math.cos(t), TC.y + r * Math.sin(t)]; };

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

export function ClusterSvg({ x = 0, y = 0, width = W, height = H, id = 'c' }: { x?: number; y?: number; width?: number; height?: number; id?: string }) {
  const needle = React.useRef<SVGGElement | null>(null);
  const speed = React.useRef<SVGTextElement | null>(null);
  const root = React.useRef<SVGSVGElement | null>(null);
  const smooth = React.useRef(0);

  useFrame(() => {
    const c = sim.car, v = sim.veh;
    const on = v.powerOn;
    smooth.current += ((on ? c.rpm : 0) - smooth.current) * 0.45;
    if (needle.current) needle.current.setAttribute('transform', `rotate(${A0 + (SW * Math.min(8000, Math.max(0, smooth.current))) / 8000} ${TC.x} ${TC.y})`);
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
  const back = on ? (v.night && v.position ? 0.75 : 1) : 0;
  const bars = (frac: number, yy: number, label: string) => {
    const n = 8, k = on ? Math.ceil(frac * n - 0.01) : 0;
    return (
      <g>
        <text x="131" y={yy + 4} className="c-tiny">{label}</text>
        {Array.from({ length: n }, (_, i) => <rect key={i} x={146 + i * 10.5} y={yy} width="9" height="4" rx="0.8" fill={i < k ? '#9fd0ff' : '#141a20'} />)}
      </g>
    );
  };

  const ticks: React.ReactNode[] = [];
  for (let r = 0; r <= 8000; r += 500) {
    const a = A0 + (SW * r) / 8000;
    const major = r % 1000 === 0;
    const [x0, y0] = pol(a, 46), [x1, y1] = pol(a, major ? 39 : 42);
    const red = r >= REDLINE_RPM;
    ticks.push(<line key={r} x1={x0} y1={y0} x2={x1} y2={y1} stroke={red ? '#ff4b4b' : on ? '#e9edf0' : '#3a424a'} strokeWidth={major ? 1.6 : 0.8} opacity={on ? back : 1} />);
    if (major) { const [tx, ty] = pol(a, 31); ticks.push(<text key={`t${r}`} x={tx} y={ty} className="c-num" textAnchor="middle" dominantBaseline="central" style={{ fill: red ? '#ff4b4b' : on ? '#e9edf0' : '#3a424a' }}>{r / 1000}</text>); }
  }

  return (
    <svg ref={root} x={x} y={y} width={width} height={height} viewBox={`0 0 ${W} ${H}`} className="cluster-svg" data-testid={`cluster-${id}`}>
      <defs>
        <radialGradient id={`face-${id}`} cx="50%" cy="40%" r="70%"><stop offset="0" stopColor="#0d1115" /><stop offset="1" stopColor="#030405" /></radialGradient>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="18" fill={`url(#face-${id})`} />
      {/* conta-giros */}
      <circle cx={TC.x} cy={TC.y} r="51" fill="#05070a" stroke="#2a3138" strokeWidth="1.5" />
      <path d={`M${pol(A0 + (SW * REDLINE_RPM) / 8000, 47)[0]} ${pol(A0 + (SW * REDLINE_RPM) / 8000, 47)[1]} A47 47 0 0 1 ${pol(A0 + SW, 47)[0]} ${pol(A0 + SW, 47)[1]}`} fill="none" stroke="#ff4b4b" strokeWidth="2.5" opacity="0.8" />
      {ticks}
      <text x={TC.x} y={TC.y - 16} className="c-tiny" textAnchor="middle">×1000 r/min</text>
      {DIAL.map((l, i) => <Lamp key={l} id={l} x={TC.x - 33 + i * 11} y={TC.y + 20} s={10} />)}
      <g ref={needle} transform={`rotate(${A0} ${TC.x} ${TC.y})`}>
        <path d={`M${TC.x - 1.6} ${TC.y + 8} L${TC.x} ${TC.y - 44} L${TC.x + 1.6} ${TC.y + 8} Z`} fill="#ff7a2e" />
      </g>
      <circle cx={TC.x} cy={TC.y} r="5" fill="#15191d" stroke="#3a424a" />
      {/* tela digital */}
      <rect x="122" y="14" width="110" height="94" rx="7" fill={on ? '#020406' : '#030405'} stroke="#1a2026" />
      {on && (
        <g opacity={back}>
          {TFT.map((l, i) => <Lamp key={l} id={l} x={127 + i * 12.6} y={17} s={10} />)}
          <text x="129" y="52" className="c-gear">{g}<tspan className="c-hint">{hint}</tspan></text>
          <text ref={speed} x="210" y="54" className="c-speed" textAnchor="end" data-testid={`speed-${id}`}>0</text>
          <text x="213" y="54" className="c-tiny">km/h</text>
          <text x="129" y="64" className="c-cruise">{cruise}</text>
          <line x1="127" x2="227" y1="68" y2="68" stroke="#1a2026" />
          <text x="129" y="77" className="c-tiny" data-testid={`trip-${id}`}>{trip.label}</text>
          <text x="129" y="89" className="c-trip">{trip.value}<tspan className="c-tiny"> {trip.unit}</tspan></text>
          {bars(v.fuel / TANK_L, 94, 'COMB')}
          {bars(Math.max(0, Math.min(1, (v.coolant - 40) / 70)), 101, 'TEMP')}
        </g>
      )}
      {!on && v.ignition === 'ACC' && <text x="177" y="64" className="c-tiny" textAnchor="middle">ACC</text>}
      {/* luzes de indicação no topo */}
      {TOP.map((l, i) => <Lamp key={l} id={l} x={48 + i * 13} y={2} s={11} />)}
    </svg>
  );
}
