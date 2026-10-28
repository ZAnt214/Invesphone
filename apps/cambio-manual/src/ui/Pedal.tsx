import React from 'react';
import { sim } from '../core/sim';
import { useFrame } from './hooks';
import { BITE_ZONE } from '../sim/car';

type Kind = 'clutch' | 'brake' | 'throttle';

const LABEL: Record<Kind, string> = { clutch: 'EMBREAGEM', brake: 'FREIO', throttle: 'ACELERADOR' };
const SHORT: Record<Kind, string> = { clutch: 'EMBR.', brake: 'FREIO', throttle: 'ACEL.' };
// Zonas mortas: topo = pedal solto; fundo = pedal no fim. Facilita soltar/pisar por completo.
const TOP = 0.1;
const BOTTOM = 0.12;

/**
 * Pedal por toque: a posição do dedo dentro da trilha define o quanto o pedal está pisado
 * (topo = solto, embaixo = no fundo). Tirar o dedo solta o pedal na hora — como tirar o pé.
 */
export function Pedal({ kind, compact = false }: { kind: Kind; compact?: boolean }) {
  const el = React.useRef<HTMLDivElement | null>(null);
  const pad = React.useRef<HTMLDivElement | null>(null);
  const depth = React.useRef<HTMLDivElement | null>(null);
  const val = React.useRef<HTMLDivElement | null>(null);
  const pointer = React.useRef<number | null>(null);
  const [h, setH] = React.useState(300);

  React.useEffect(() => {
    const node = el.current!;
    const ro = new ResizeObserver(() => setH(node.clientHeight));
    ro.observe(node);
    setH(node.clientHeight);
    return () => ro.disconnect();
  }, []);

  const padH = compact ? (kind === 'throttle' ? 44 : 36) : kind === 'throttle' ? 64 : 52;
  const travel = Math.max(10, h * (1 - TOP - BOTTOM) - padH * 0.4);

  const set = (v: number) => { sim.pedals[kind] = v; };

  const fromEvent = (e: React.PointerEvent) => {
    const r = el.current!.getBoundingClientRect();
    const f = (e.clientY - r.top) / r.height;
    return Math.max(0, Math.min(1, (f - TOP) / (1 - TOP - BOTTOM)));
  };

  useFrame(() => {
    const v = sim.pedals[kind];
    const top = h * TOP * 0.5 + v * travel;
    if (pad.current) pad.current.style.transform = compact ? `translateY(${top.toFixed(1)}px) perspective(180px) rotateX(${(v * 32).toFixed(1)}deg)` : `translateY(${top.toFixed(1)}px)`;
    if (depth.current) depth.current.style.height = `${(top + padH * 0.5).toFixed(1)}px`;
    if (val.current) {
      const t = `${Math.round(v * 100)}%`;
      if (val.current.textContent !== t) val.current.textContent = t;
    }
  });

  const bite = kind === 'clutch'
    ? { top: h * TOP + (1 - TOP - BOTTOM) * h * BITE_ZONE[0], height: (1 - TOP - BOTTOM) * h * (BITE_ZONE[1] - BITE_ZONE[0]) }
    : null;

  return (
    <div
      ref={el}
      className={`pedal ${kind === 'throttle' ? 'gas' : ''}`}
      data-testid={`pedal-${kind}`}
      role="slider"
      aria-label={LABEL[kind]}
      aria-valuemin={0}
      aria-valuemax={100}
      onPointerDown={(e: React.PointerEvent) => {
        if (pointer.current !== null) return;
        pointer.current = e.pointerId;
        el.current!.setPointerCapture(e.pointerId);
        el.current!.classList.add('active');
        set(fromEvent(e));
      }}
      onPointerMove={(e: React.PointerEvent) => { if (pointer.current === e.pointerId) set(fromEvent(e)); }}
      onPointerUp={(e: React.PointerEvent) => {
        if (pointer.current !== e.pointerId) return;
        pointer.current = null;
        el.current!.classList.remove('active');
        set(0);
      }}
      onPointerCancel={(e: React.PointerEvent) => {
        if (pointer.current !== e.pointerId) return;
        pointer.current = null;
        el.current!.classList.remove('active');
        set(0);
      }}
    >
      <div className="depth" ref={depth} />
      {bite && <div className="bite" style={{ top: bite.top, height: bite.height }}>{!compact && <span>PONTO</span>}</div>}
      <div className="pad" ref={pad} style={{ height: padH }} />
      <div className="pval" ref={val}>0%</div>
      <div className="plabel">{compact ? SHORT[kind] : LABEL[kind]}</div>
    </div>
  );
}
