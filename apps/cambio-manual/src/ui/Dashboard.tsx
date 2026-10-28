import React from 'react';
import { sim } from '../core/sim';
import { useFrame } from './hooks';
import { BITE_ZONE, REDLINE_RPM, clutchEngagement } from '../sim/car';

const START = -135;
const SWEEP = 270;
const CX = 80, CY = 82, R = 66;

function polar(angleDeg: number, r: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}
function arc(a0: number, a1: number, r: number) {
  const [x0, y0] = polar(a0, r);
  const [x1, y1] = polar(a1, r);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

interface GaugeProps {
  max: number;
  major: number;
  labelEvery: number;
  minor: number;
  label: (v: number) => string;
  red?: number;
  unit: string;
  big?: boolean;
  needleRef: React.MutableRefObject<SVGGElement | null>;
  textRef: React.MutableRefObject<SVGTextElement | null>;
  ariaLabel: string;
}

function Gauge(p: GaugeProps) {
  const ticks: React.ReactNode[] = [];
  for (let v = 0; v <= p.max + 1e-6; v += p.minor) {
    const a = START + (SWEEP * v) / p.max;
    const isMajor = Math.abs(v / p.major - Math.round(v / p.major)) < 1e-6;
    const [x0, y0] = polar(a, R);
    const [x1, y1] = polar(a, R - (isMajor ? 9 : 5));
    const inRed = p.red !== undefined && v >= p.red;
    ticks.push(<line key={`t${v}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={inRed ? 'var(--red)' : isMajor ? 'var(--ink)' : 'var(--ink-faint)'} strokeWidth={isMajor ? 2 : 1} />);
    if (isMajor && Math.abs(v / p.labelEvery - Math.round(v / p.labelEvery)) < 1e-6) {
      const [tx, ty] = polar(a, R - 19);
      ticks.push(<text key={`l${v}`} className="num" x={tx} y={ty} textAnchor="middle" dominantBaseline="central" style={inRed ? { fill: 'var(--red)' } : undefined}>{p.label(v)}</text>);
    }
  }
  return (
    <svg className="gauge" viewBox="0 0 160 150" role="img" aria-label={p.ariaLabel}>
      <path d={arc(START, START + SWEEP, R + 3)} stroke="var(--line-2)" strokeWidth="1" fill="none" />
      {p.red !== undefined && <path d={arc(START + (SWEEP * p.red) / p.max, START + SWEEP, R - 2)} stroke="var(--red)" strokeWidth="4" fill="none" opacity="0.85" />}
      {ticks}
      <text className="unit" x={CX} y={CY + 26} textAnchor="middle">{p.unit}</text>
      <text ref={p.textRef} className={p.big ? 'digital' : 'digital-sm'} x={CX} y={p.big ? CY + 48 : CY + 44} textAnchor="middle">0</text>
      <g ref={p.needleRef} style={{ transformOrigin: `${CX}px ${CY}px`, transform: `rotate(${START}deg)` }}>
        <line x1={CX} y1={CY + 10} x2={CX} y2={CY - R + 6} stroke="var(--amber)" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <circle cx={CX} cy={CY} r="6" fill="#07090a" stroke="var(--line-2)" />
    </svg>
  );
}

export function Dashboard({ blind }: { blind: boolean }) {
  const tachNeedle = React.useRef<SVGGElement | null>(null);
  const tachText = React.useRef<SVGTextElement | null>(null);
  const spdNeedle = React.useRef<SVGGElement | null>(null);
  const spdText = React.useRef<SVGTextElement | null>(null);
  const root = React.useRef<HTMLDivElement | null>(null);
  const fill = React.useRef<HTMLDivElement | null>(null);
  const pedal = React.useRef<HTMLDivElement | null>(null);
  const state = React.useRef<HTMLSpanElement | null>(null);
  const smooth = React.useRef({ rpm: 0, kmh: 0 });

  useFrame(() => {
    const c = sim.car;
    const s = smooth.current;
    // ponteiros com leve inércia, como um conta-giros real
    s.rpm += (c.rpm - s.rpm) * 0.45;
    s.kmh += (Math.abs(c.kmh) - s.kmh) * 0.35;
    const tachA = START + (SWEEP * Math.min(8000, Math.max(0, s.rpm))) / 8000;
    const spdA = START + (SWEEP * Math.min(200, s.kmh)) / 200;
    if (tachNeedle.current) tachNeedle.current.style.transform = `rotate(${tachA}deg)`;
    if (spdNeedle.current) spdNeedle.current.style.transform = `rotate(${spdA}deg)`;
    if (tachText.current) tachText.current.textContent = `${Math.round(Math.max(0, c.rpm) / 10) * 10}`;
    if (spdText.current) spdText.current.textContent = `${Math.round(Math.abs(c.kmh))}`;
    const p = c.inputs.clutch;
    const e = clutchEngagement(p);
    if (pedal.current) pedal.current.style.left = `${p * 100}%`;
    if (fill.current) fill.current.style.width = `${(c.gear === 'N' ? 0 : e) * 100}%`;
    if (state.current) {
      const txt = p > 0.78 ? 'Livre' : c.gear === 'N' ? 'Neutro' : !c.locked && c.engineOn && e > 0.02 ? 'Patinando' : e >= 0.99 ? 'Acoplada' : c.locked ? 'Acoplada' : 'No ponto';
      if (state.current.textContent !== txt) state.current.textContent = txt;
      state.current.style.color = txt === 'Patinando' || txt === 'No ponto' ? 'var(--amber)' : '';
    }
    if (root.current) {
      const sh = Math.max(-6, Math.min(6, c.shake * 1.6));
      const stall = c.stallSpin > 0 ? (Math.random() - 0.5) * 4 : 0;
      root.current.style.transform = sh || stall ? `translate(${stall}px, ${sh}px)` : '';
    }
  });

  const c = sim.car;
  const g = c.gear;
  const hint = !blind && c.engineOn && c.locked && g !== 'N' && g !== 'R'
    ? c.rpm > 3600 && g !== '5' ? '▲ TROCAR' : c.rpm < 1250 && g !== '1' && c.inputs.throttle > 0.3 ? '▼ REDUZIR' : ''
    : '';
  const shown = blind ? '–' : g;

  return (
    <div className="dash" ref={root}>
      <div className="gauges">
        <Gauge max={8000} major={1000} labelEvery={1000} minor={500} label={(v) => String(v / 1000)} red={REDLINE_RPM} unit="×1000 RPM" needleRef={tachNeedle} textRef={tachText} ariaLabel="Conta-giros" />
        <div className="center-col">
          <span className="gear-label">MARCHA</span>
          <div className={`gear-box ${shown === 'N' || shown === '–' ? 'n' : shown === 'R' ? 'r' : ''}`} data-testid="gear">{shown}</div>
          <div className="shift-hint">{hint}</div>
          <div className="lamps">
            <span className={`lamp ${!c.engineOn ? 'on red' : ''}`} title="Motor desligado">MOTOR</span>
            <span className={`lamp ${c.inputs.handbrake ? 'on red' : ''}`} title="Freio de mão">(P)</span>
          </div>
        </div>
        <Gauge max={200} major={20} labelEvery={40} minor={10} label={(v) => String(v)} unit="KM/H" big needleRef={spdNeedle} textRef={spdText} ariaLabel="Velocímetro" />
      </div>
      <div className="clutch-meter" aria-label="Indicador de embreagem">
        <span className="lbl">EMBREAGEM</span>
        <div className="cm-track">
          <div className="cm-bite" style={{ left: `${BITE_ZONE[0] * 100}%`, width: `${(BITE_ZONE[1] - BITE_ZONE[0]) * 100}%` }} />
          <div className="cm-fill" ref={fill} />
          <div className="cm-pedal" ref={pedal} />
        </div>
        <span className="state" ref={state} data-testid="clutch-state">Livre</span>
      </div>
    </div>
  );
}
