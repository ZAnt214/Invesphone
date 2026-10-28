import React from 'react';
import { sim } from '../core/sim';
import { useFrame } from './hooks';

const VB = 200;
const COL_DX = 50; // unidades do viewBox por unidade normalizada em x
const TRAVEL = 60; // unidades do viewBox por unidade normalizada em y
const toX = (x: number) => 100 + COL_DX * x;
const toY = (y: number) => 100 + TRAVEL * y;
const LONG_PRESS_MS = 380;

export function ShifterPad({ blind }: { blind: boolean }) {
  const pad = React.useRef<HTMLDivElement | null>(null);
  const knob = React.useRef<SVGGElement | null>(null);
  const ring = React.useRef<SVGCircleElement | null>(null);
  const lockMsg = React.useRef<SVGTextElement | null>(null);
  const drag = React.useRef<null | { id: number; sx: number; sy: number; lx: number; ly: number; scale: number; moved: boolean; timer: ReturnType<typeof setTimeout> | null }>(null);

  useFrame(() => {
    const s = sim.shifter;
    if (knob.current) knob.current.setAttribute('transform', `translate(${toX(s.x).toFixed(2)} ${toY(s.y).toFixed(2)})`);
    if (ring.current) ring.current.style.opacity = s.reverseUnlocked ? '1' : '0';
    if (lockMsg.current) lockMsg.current.style.opacity = s.blocked === 'reverseLock' && !s.reverseUnlocked ? '1' : '0';
  });

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current) return;
    const el = pad.current!;
    el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect();
    const scale = Math.min(r.width, r.height) / VB;
    const s = sim.shifter;
    s.beginDrag();
    const d = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: s.x, ly: s.y, scale, moved: false, timer: null as ReturnType<typeof setTimeout> | null };
    // Segurar parado = empurrar a alavanca para baixo (destrava a ré)
    d.timer = setTimeout(() => {
      if (drag.current === d && !d.moved) { s.reverseUnlocked = true; sim.audio.tick(); }
    }, LONG_PRESS_MS);
    drag.current = d;
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) > 7) d.moved = true;
    if (!d.moved) return;
    sim.shifter.moveToward(d.lx + dx / (COL_DX * d.scale), d.ly + dy / (TRAVEL * d.scale));
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.timer) clearTimeout(d.timer);
    drag.current = null;
    sim.shifter.endDrag();
  };

  const g = sim.shifter.gear;
  const labels: [string, number, number][] = [['1', -1, -1], ['2', -1, 1], ['3', 0, -1], ['4', 0, 1], ['5', 1, -1], ['R', 1, 1]];
  const path = `M${toX(-1)} ${toY(-1)} V${toY(1)} M${toX(0)} ${toY(-1)} V${toY(1)} M${toX(1)} ${toY(-1)} V${toY(1)} M${toX(-1)} 100 H${toX(1)}`;

  return (
    <div
      className="shifter"
      ref={pad}
      data-testid="shifter"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      role="application"
      aria-label="Alavanca de câmbio: arraste para engatar. Segure para destravar a ré."
    >
      <svg viewBox={`0 0 ${VB} ${VB}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="knobGrad" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#4a535c" />
            <stop offset="55%" stopColor="#262c32" />
            <stop offset="100%" stopColor="#14181b" />
          </radialGradient>
        </defs>
        <path d={path} className="slot-edge" strokeWidth="27" />
        <path d={path} className="slot" strokeWidth="21" />
        {!blind && labels.map(([t, x, y]) => (
          <text key={t} className={`glabel ${g === t ? 'cur' : ''} ${t === 'R' ? 'r' : ''}`} x={toX(x)} y={y < 0 ? 18 : 182} fontSize="19">{t}</text>
        ))}
        {!blind && <text className="glabel" x="100" y="100" fontSize="9" style={{ fill: 'var(--ink-faint)' }} transform="translate(0 -15)">N</text>}
        <text ref={lockMsg} className="lockmsg" x={toX(1) - 18} y="128" style={{ opacity: 0, transition: 'opacity .2s' }}>SEGURE</text>
        <g ref={knob} transform="translate(100 100)">
          <ellipse cx="3" cy="6" rx="22" ry="20" fill="rgba(0,0,0,0.55)" />
          <circle r="21" fill="url(#knobGrad)" stroke="#3b444d" strokeWidth="1.2" />
          <circle ref={ring} r="25" fill="none" stroke="var(--amber)" strokeWidth="2.4" style={{ opacity: 0 }} />
          <circle r="11" fill="none" stroke="#3a434b" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
