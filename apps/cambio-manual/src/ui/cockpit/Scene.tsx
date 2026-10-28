import React from 'react';
import { sim } from '../../core/sim';
import { useFrame } from '../hooks';
import { ClusterSvg } from './ClusterSvg';
import { carSetup, quizActive, type SlotFn } from '../panel/layout';
import { quizAnswer } from '../panel/Kit';
import { STATIONS, SOURCES, type WiperMode } from '../../sim/vehicle';
import { art, placeAt, type ArtId } from './art';

/** Modo foto: liga quando o pacote de arte (public/cambio/art) termina de carregar. */
export function useArtReady() {
  const [, set] = React.useState(0);
  React.useEffect(() => art.subscribe(() => set((x: number) => x + 1)), []);
  return art.ready;
}
/** Imagem de uma camada com o pivô no ponto (px, py) da cena. */
function ArtImg({ id, px, py, scale = 1, testId }: { id: ArtId; px: number; py: number; scale?: number; testId?: string }) {
  const b = placeAt(id, px, py);
  const w = b.w * scale, h = b.h * scale;
  const x = px - (px - b.x) * scale, y = py - (py - b.y) * scale;
  return <image href={art.url(id)} x={x} y={y} width={w} height={h} preserveAspectRatio="none" pointerEvents="none" data-art={id} data-testid={testId} />;
}

export type ZoomId = 'spokeL' | 'spokeR' | 'stalkL' | 'stalkR' | 'leftBank' | 'door' | 'climate' | 'media' | 'cluster';
/** Largura da cena (unidades) e deslocamentos dos grupos: lado do motorista, console central, lado do passageiro. */
export interface Lay { SW: number; L: number; C: number; Rt: number }

/** px de tela por unidade da cena (a altura da cena é sempre 420 unidades). */
function unit(e: { currentTarget: unknown }) {
  const svg = (e.currentTarget as SVGGraphicsElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
  return svg.getBoundingClientRect().height / 420;
}
const notify = () => sim.notify();
const q = (id: string) => { if (quizActive()) { quizAnswer(id); return true; } return false; };
/** Afunda o comando por um instante (sensação de botão físico). */
function pressFx(e: { currentTarget: unknown }, ms = 150) {
  const el = e.currentTarget as Element;
  el.setAttribute('data-down', '');
  setTimeout(() => el.removeAttribute('data-down'), ms);
}

/** Tecla física pequena com laterais, sombra e brilho na borda. */
function Key3D({ x, y, w, h = 12, label, led, legend, r = 2.5 }: { x: number; y: number; w: number; h?: number; label: string; led?: boolean; legend: string; r?: number }) {
  return (
    <g className="key3d">
      <rect x={x - 0.6} y={y - 0.6} width={w + 1.2} height={h + 2.4} rx={r + 0.6} fill="#050607" />
      <rect x={x} y={y + 1.4} width={w} height={h} rx={r} fill="#0b0d0f" />
      <g className="keycap">
        <rect x={x} y={y} width={w} height={h} rx={r} fill="url(#keyFace)" stroke="#3a4148" strokeWidth="0.5" />
        <line x1={x + r} x2={x + w - r} y1={y + 0.6} y2={y + 0.6} stroke="#ffffff" strokeOpacity="0.14" strokeWidth="0.6" />
        <text x={x + w / 2} y={y + h / 2 + 2.6} className="sc-btn" textAnchor="middle" style={{ fill: legend }}>{label}</text>
        {led !== undefined && <rect x={x + w / 2 - 3} y={y + 1.4} width="6" height="1.3" rx="0.6" fill={led ? '#ffb02e' : '#2f363c'} className={led ? 'led-on' : ''} />}
      </g>
    </g>
  );
}

/** Saída de ar com profundidade (aletas e moldura). */
function Vent({ x, y, w, h, trim }: { x: number; y: number; w: number; h: number; trim?: boolean }) {
  return (
    <g>
      <rect x={x - 1} y={y + 2} width={w + 2} height={h} rx={trim ? 10 : 7} fill="#030304" opacity="0.8" />
      {trim ? <rect x={x} y={y} width={w} height={h} rx="9" fill="none" stroke="var(--trim)" strokeWidth="3.6" /> : <rect x={x} y={y} width={w} height={h} rx="6" fill="#0c0e10" stroke="#2a3036" />}
      {trim && <rect x={x + 0.8} y={y + 0.6} width={w - 1.6} height={h - 1.2} rx="8.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.7" />}
      <rect x={x + 4} y={y + 4} width={w - 8} height={h - 8} rx="5" fill="url(#ventDepth)" />
      {Array.from({ length: Math.floor((h - 10) / 4.5) }, (_, i) => (
        <g key={i}>
          <rect x={x + 5} y={y + 6 + i * 4.5} width={w - 10} height="1.6" rx="0.8" fill="#23282d" />
          <rect x={x + 5} y={y + 6 + i * 4.5} width={w - 10} height="0.5" fill="#3a4148" />
        </g>
      ))}
      <rect x={x + w / 2 - 3} y={y + 4} width="6" height={h - 8} rx="2" fill="#1a1e22" stroke="#2c3238" strokeWidth="0.5" />
    </g>
  );
}

// ------------------------------------------------------------------ alavancas
const WIPER_POS: Record<WiperMode, number> = { MIST: 0, OFF: 0, INT: -1, LO: -2, HI: -3 };
const POS_WIPER: Record<number, WiperMode> = { 1: 'MIST', 0: 'OFF', [-1]: 'INT', [-2]: 'LO', [-3]: 'HI' };

function StalkInScene({ side, onZoom, photo }: { side: 'L' | 'R'; onZoom: (z: ZoomId) => void; photo: boolean }) {
  const v = sim.veh;
  const STEP = 16;
  const left = side === 'L';
  const detents = left ? [-2, -1, 0, 1, 2] : [-3, -2, -1, 0, 1];
  const value = left ? (v.turnLatched && v.turnActive ? v.turn * 2 : 0) : WIPER_POS[v.wiper];
  const [live, setLive] = React.useState<number | null>(null);
  const [held, setHeld] = React.useState(false);
  const d = React.useRef<null | { id: number; y0: number; start: number; last: number; k: number; moved: boolean }>(null);
  const nearest = (x: number) => detents.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a), 0);
  const apply = (pos: number, released: boolean) => {
    if (left) {
      const dir = Math.sign(pos) as -1 | 0 | 1;
      if (Math.abs(pos) === 2) v.setTurn(dir, true);
      else if (pos === 0 && v.turnLatched) v.setTurn(0, false);
      else if (released && Math.abs(pos) === 1) v.setTurn(dir, false);
    } else {
      if (pos === 1) { if (!released) v.setWiper('MIST'); return; }
      const m = POS_WIPER[pos];
      if (m && m !== v.wiper && !(m === 'OFF' && v.wiper === 'MIST')) v.setWiper(m);
    }
  };
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    d.current = { id: e.pointerId, y0: e.clientY, start: value, last: value, k: unit(e), moved: false };
    setHeld(true);
  };
  const move = (e: React.PointerEvent) => {
    const s = d.current;
    if (!s || s.id !== e.pointerId) return;
    const dy = (e.clientY - s.y0) / s.k;
    if (!s.moved && Math.abs(dy) < 6) return;
    if (!s.moved && quizActive()) { quizAnswer(left ? (dy < 0 ? 'turnR' : 'turnL') : 'wiper'); d.current = null; setHeld(false); return; }
    s.moved = true;
    const x = Math.max(detents[0] - 0.3, Math.min(detents[detents.length - 1] + 0.3, s.start - dy / STEP));
    setLive(x);
    const n = nearest(x);
    if (n !== s.last && Math.abs(x - n) < 0.3) { s.last = n; sim.audio.switchClick(); apply(n, false); notify(); }
  };
  const up = (e: React.PointerEvent) => {
    const s = d.current;
    setHeld(false);
    if (!s || s.id !== e.pointerId) return;
    d.current = null;
    if (!s.moved) { onZoom(left ? 'stalkL' : 'stalkR'); return; }
    apply(nearest(live ?? s.start), true);
    setLive(null);
    notify();
  };
  const pos = live ?? value;
  const px = left ? 214 : 326, py = 292;
  const tipX = left ? 30 : 510;
  const ang = (left ? 1 : -1) * pos * 4.2;
  const dir = left ? -1 : 1;
  const L = Math.abs(px - tipX);
  const ringX = left ? tipX : tipX - 46;
  return (
    <g data-testid={`stalk-${side}`} aria-valuenow={value} className={held ? 'held' : ''}>
      {/* sombra projetada no painel */}
      <path d={`M${px} ${py + 8} L${px + dir * (L - 40)} ${py + 14} L${px + dir * (L - 40)} ${py + 22} L${px} ${py + 14} Z`} fill="#000" opacity="0.35" transform={`rotate(${ang} ${px} ${py})`} />
      {photo && art.has(left ? 'stalkL' : 'stalkR') && (
        <g transform={`rotate(${ang} ${px} ${py})`} style={{ transition: live === null ? 'transform .12s' : 'none' }} className="stalk-ring">
          <ArtImg id={left ? 'stalkL' : 'stalkR'} px={px} py={py} testId={`art-stalk-${side}`} />
        </g>
      )}
      {!(photo && art.has(left ? 'stalkL' : 'stalkR')) && <g transform={`rotate(${ang} ${px} ${py})`} style={{ transition: live === null ? 'transform .12s' : 'none' }}>
        <path d={`M${px} ${py - 5} L${px + dir * (L - 46)} ${py - 6.5} L${px + dir * (L - 46)} ${py + 6.5} L${px} ${py + 5} Z`} fill="url(#stalkArm)" />
        <path d={`M${px} ${py - 3.6} L${px + dir * (L - 46)} ${py - 4.6}`} stroke="#ffffff" strokeOpacity="0.16" strokeWidth="0.8" />
        <rect x={ringX} y={py - 9.5} width="46" height="19" rx="7.5" fill="url(#stalkRing)" stroke="#4a535b" strokeWidth="0.7" className="stalk-ring" />
        {[7, 12, 17, 22, 27, 32, 37].map((o) => <line key={o} x1={left ? tipX + o : tipX - o} x2={left ? tipX + o : tipX - o} y1={py - 7.5} y2={py + 7.5} stroke="#0b0d10" strokeWidth="1" />)}
        <line x1={ringX + 3} x2={ringX + 43} y1={py - 7.6} y2={py - 7.6} stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.7" />
        <rect x={left ? tipX - 5 : tipX - 1} y={py - 7.5} width="6" height="15" rx="3" fill="url(#stalkRing)" stroke="#4a535b" strokeWidth="0.6" />
      </g>}
      <rect x={left ? 8 : 446} y={250} width="86" height="66" fill="transparent" style={{ touchAction: 'none' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} data-testid={`stalk-${side}-hit`} />
    </g>
  );
}

// ------------------------------------------------------------------ volante
function useWheelDrag(L: number) {
  const d = React.useRef<null | { id: number; cx: number; cy: number; last: number }>(null);
  const angleAt = (e: React.PointerEvent) => (Math.atan2(e.clientY - d.current!.cy, e.clientX - d.current!.cx) * 180) / Math.PI;
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    const svg = (e.currentTarget as SVGGraphicsElement).ownerSVGElement!;
    const r = svg.getBoundingClientRect();
    const k = r.height / 420;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    d.current = { id: e.pointerId, cx: r.left + (L + 270) * k, cy: r.top + 293 * k, last: 0 };
    d.current.last = angleAt(e);
    sim.steerDrag = true;
  };
  const move = (e: React.PointerEvent) => {
    if (!d.current || d.current.id !== e.pointerId) return;
    const a = angleAt(e);
    let delta = a - d.current.last;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    d.current.last = a;
    sim.steer = Math.max(-540, Math.min(540, sim.steer + delta));
  };
  const up = (e: React.PointerEvent) => { if (d.current?.id === e.pointerId) { d.current = null; sim.steerDrag = false; } };
  return { down, move, up };
}

function Wheel({ legend, onZoom, photo }: { legend: string; onZoom: (z: ZoomId) => void; photo: boolean }) {
  const setup = carSetup.get();
  const rot = React.useRef<SVGGElement | null>(null);
  useFrame(() => { if (rot.current) rot.current.setAttribute('transform', `rotate(${sim.steer.toFixed(2)} 270 293)`); });
  const k3 = (x: number, y: number, w: number, label: string) => <Key3D x={x} y={y} w={w} h={9} r={2} label={label} legend={legend} />;
  return (
    <>
      {/* sombra do volante no painel */}
      <circle cx="274" cy="300" r="172" fill="none" stroke="#000" strokeOpacity={photo ? 0.3 : 0.45} strokeWidth="24" pointerEvents="none" />
      {!photo && <>
      {/* aro: forma e luz fixas (o aro é redondo), costura gira junto */}
      <circle cx="270" cy="293" r="171" fill="none" stroke="url(#rim)" strokeWidth="21" pointerEvents="none" />
      <circle cx="270" cy="293" r="181" fill="none" stroke="#454d55" strokeWidth="0.8" opacity="0.7" pointerEvents="none" />
      <circle cx="270" cy="293" r="161" fill="none" stroke="#000" strokeOpacity="0.6" strokeWidth="1.2" pointerEvents="none" />
      <path d="M128 186 A171 171 0 0 1 300 123" fill="none" stroke="#ffffff" strokeOpacity="0.13" strokeWidth="4" strokeLinecap="round" pointerEvents="none" />
      </>}
      <g ref={rot}>
        {photo && <ArtImg id="wheel" px={270} py={293} testId="art-wheel" />}
        {!photo && <>
        <circle cx="270" cy="293" r="171" fill="none" stroke="#c43c33" strokeWidth="0.8" strokeDasharray="2 3" opacity="0.6" pointerEvents="none" />
        <rect x="266" y="113" width="8" height="21" rx="2" fill="#2a3036" opacity="0.9" pointerEvents="none" />
        <g pointerEvents="none">
          <path d="M104 296 Q150 284 226 290 L232 326 Q160 330 108 336 Z" fill="url(#spoke)" stroke="#2f353a" strokeWidth="0.8" />
          <path d="M436 296 Q390 284 314 290 L308 326 Q380 330 432 336 Z" fill="url(#spoke)" stroke="#2f353a" strokeWidth="0.8" />
          <path d="M244 330 L296 330 L310 470 L230 470 Z" fill="url(#spoke)" stroke="#2f353a" strokeWidth="0.8" />
          <path d="M108 297 Q160 286 226 291" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" fill="none" />
          <path d="M432 297 Q380 286 314 291" stroke="#ffffff" strokeOpacity="0.1" strokeWidth="1" fill="none" />
          <rect x="138" y="294" width="66" height="30" rx="7" fill="#08090b" stroke="#2a3036" />
          {k3(142, 298, 28, 'VOL+')}{k3(172, 298, 28, 'MODE')}{k3(142, 311, 28, 'VOL−')}{k3(172, 311, 28, 'MUTE')}
          <rect x="336" y="294" width="66" height="30" rx="7" fill="#08090b" stroke="#2a3036" />
          {setup.cruise
            ? <>{k3(340, 298, 28, 'RES+')}{k3(370, 298, 28, 'CRUISE')}{k3(340, 311, 28, 'SET−')}{k3(370, 311, 28, 'TRIP')}</>
            : <>{k3(346, 298, 46, '▲ TRIP')}{k3(346, 311, 46, '▼ OK')}</>}
          <circle cx="270" cy="309" r="46" fill="#040506" />
          <path d="M226 286 Q270 260 314 286 L318 324 Q270 350 222 324 Z" fill="url(#hub)" stroke="#353c42" strokeWidth="0.9" />
          <path d="M232 287 Q270 266 308 287" fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.4" />
          <text x="270" y="336" className="sc-tiny" textAnchor="middle" opacity="0.55">AIRBAG</text>
        </g>
        </>}
        <rect x="136" y="292" width="70" height="34" rx="6" fill="transparent" data-testid="zoom-spokeL" style={{ touchAction: 'none' }}
          onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); pressFx(e); onZoom('spokeL'); }} />
        <rect x="334" y="292" width="70" height="34" rx="6" fill="transparent" data-testid="zoom-spokeR" style={{ touchAction: 'none' }}
          onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); pressFx(e); onZoom('spokeR'); }} />
        <path d="M226 286 Q270 260 314 286 L318 324 Q270 350 222 324 Z" fill="transparent" data-testid="horn" style={{ touchAction: 'none' }}
          onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); if (!q('horn')) sim.audio.horn(true); }}
          onPointerUp={() => sim.audio.horn(false)} onPointerCancel={() => sim.audio.horn(false)} onPointerLeave={() => sim.audio.horn(false)} />
      </g>
    </>
  );
}
/** Faixa de toque no aro (fica atrás das alavancas, que têm prioridade). */
function WheelGrip(p: { down: (e: React.PointerEvent) => void; move: (e: React.PointerEvent) => void; up: (e: React.PointerEvent) => void }) {
  return (
    <path d="M270 293 m-194 0 a194 194 0 1 0 388 0 a194 194 0 1 0 -388 0 Z M270 293 m-150 0 a150 150 0 1 1 300 0 a150 150 0 1 1 -300 0 Z"
      fillRule="evenodd" fill="transparent" data-testid="wheel-grip" style={{ touchAction: 'none' }}
      onPointerDown={p.down} onPointerMove={p.move} onPointerUp={p.up} onPointerCancel={p.up} />
  );
}

// ------------------------------------------------------------------ ignição
const KEY_ANG = { LOCK: -60, ACC: -20, ON: 25, START: 70 } as const;
type KeyPos = keyof typeof KEY_ANG;

function Ignition({ photo }: { photo: boolean }) {
  const v = sim.veh;
  const setup = carSetup.get();
  const cx = 480, cy = 352;
  const [live, setLive] = React.useState<number | null>(null);
  const d = React.useRef<{ id: number; last: KeyPos; cx: number; cy: number } | null>(null);
  if (setup.pushStart) {
    const lit = v.ignition !== 'LOCK' || sim.car.engineOn;
    return (
      <g data-testid="push-start" className="press" style={{ touchAction: 'none' }} onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); pressFx(e, 200); if (!q('ignition')) sim.pushStart(); }}>
        <circle cx={cx} cy={cy + 2} r="22" fill="#030404" />
        <circle cx={cx} cy={cy} r="21" fill="url(#chrome)" />
        <circle cx={cx} cy={cy} r="18" fill="#0b0d0f" />
        <g className="keycap">
          <circle cx={cx} cy={cy} r="16" fill="url(#keyFace)" stroke={lit ? '#ffb02e' : '#2a3138'} strokeWidth="1.2" />
          <text x={cx} y={cy - 3} className="sc-tiny" textAnchor="middle">ENGINE</text>
          <text x={cx} y={cy + 4} className="sc-tiny" textAnchor="middle">START</text>
          <text x={cx} y={cy + 11} className="sc-tiny" textAnchor="middle">STOP</text>
        </g>
        <circle cx={cx} cy={cy} r="30" fill="transparent" />
      </g>
    );
  }
  const pos: KeyPos = sim.car.cranking > 0 ? 'START' : v.ignition;
  const angOf = (e: React.PointerEvent) => (Math.atan2(e.clientX - d.current!.cx, -(e.clientY - d.current!.cy)) * 180) / Math.PI;
  const nearest = (a: number) => (Object.keys(KEY_ANG) as KeyPos[]).reduce((b, k) => (Math.abs(KEY_ANG[k] - a) < Math.abs(KEY_ANG[b] - a) ? k : b), 'LOCK' as KeyPos);
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    if (q('ignition')) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const r = (e.currentTarget as Element).getBoundingClientRect();
    d.current = { id: e.pointerId, last: pos, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    setLive(KEY_ANG[pos]);
  };
  const move = (e: React.PointerEvent) => {
    if (!d.current || d.current.id !== e.pointerId) return;
    const a = Math.max(-70, Math.min(78, angOf(e)));
    const lo = KEY_ANG[d.current.last] - 45, hi = KEY_ANG[d.current.last] + 50;
    const ca = Math.max(lo, Math.min(hi, a));
    setLive(ca);
    const k = nearest(ca);
    if (k !== d.current.last && Math.abs(KEY_ANG[k] - ca) < 12) { d.current.last = k; sim.setKey(k); }
  };
  const up = (e: React.PointerEvent) => { if (d.current?.id === e.pointerId) { d.current = null; setLive(null); notify(); } };
  const angle = live ?? KEY_ANG[pos];
  return (
    <g className={live !== null ? 'held' : ''}>
      {(Object.keys(KEY_ANG) as KeyPos[]).map((k) => { const t = (KEY_ANG[k] * Math.PI) / 180; return <text key={k} x={cx + 28 * Math.sin(t)} y={cy - 28 * Math.cos(t)} className="sc-key" textAnchor="middle" dominantBaseline="central" style={{ fill: k === pos ? '#ffb02e' : undefined }}>{k}</text>; })}
      <circle cx={cx} cy={cy + 2.5} r="19" fill="#020303" />
      <circle cx={cx} cy={cy} r="18.5" fill="url(#chrome)" />
      <circle cx={cx} cy={cy} r="14" fill="url(#lockFace)" />
      <rect x={cx - 1.4} y={cy - 9} width="2.8" height="18" rx="1" fill="#050607" transform={`rotate(${angle} ${cx} ${cy})`} />
      {photo && art.has('key') && (
        <g transform={`rotate(${angle} ${cx} ${cy})`} style={{ transition: live === null ? 'transform .15s' : 'none' }} className="key-head">
          <ArtImg id="key" px={cx} py={cy} testId="art-key" />
        </g>
      )}
      {/* chave: cabeça plástica com sombra, gira junto com o dedo */}
      {!(photo && art.has('key')) && <g transform={`rotate(${angle} ${cx} ${cy})`} style={{ transition: live === null ? 'transform .15s' : 'none' }}>
        <path d={`M${cx - 10} ${cy + 12} h20 l3 20 a13 13 0 0 1 -26 0 Z`} fill="#000" opacity="0.45" transform="translate(2 3)" />
        <rect x={cx - 2.6} y={cy - 6} width="5.2" height="20" rx="1.5" fill="url(#chrome)" />
        <path d={`M${cx - 10} ${cy + 12} h20 l3 20 a13 13 0 0 1 -26 0 Z`} fill="url(#keyHead)" stroke="#4a535b" strokeWidth="0.7" className="key-head" />
        <path d={`M${cx - 8} ${cy + 14} h16`} stroke="#ffffff" strokeOpacity="0.2" strokeWidth="0.8" />
        <circle cx={cx} cy={cy + 27} r="3" fill="#0a0b0d" />
      </g>}
      <circle cx={cx} cy={cy + 6} r="34" fill="transparent" data-testid="key-knob" style={{ touchAction: 'none' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
    </g>
  );
}

// ------------------------------------------------------------------ botões giratórios do ar
function KnobInScene({ fn, cx, cy, r, photo }: { fn: SlotFn; cx: number; cy: number; r: number; photo: boolean }) {
  const v = sim.veh;
  const [held, setHeld] = React.useState(false);
  const spec = fn === 'fan' ? { max: 4, val: v.fan, set: (x: number) => { v.fan = x; if (!x) v.ac = false; } }
    : fn === 'temp' ? { max: 8, val: Math.round(v.temp * 8), set: (x: number) => { v.temp = x / 8; } }
    : fn === 'vent' ? { max: 4, val: v.vent, set: (x: number) => { v.vent = x; } } : null;
  const d = React.useRef<{ id: number; cx: number; cy: number } | null>(null);
  if (!spec) return null;
  const a = -135 + (270 * spec.val) / spec.max;
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    if (q(`fn:${fn}`)) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const b = (e.currentTarget as Element).getBoundingClientRect();
    d.current = { id: e.pointerId, cx: b.left + b.width / 2, cy: b.top + b.height / 2 };
    setHeld(true);
  };
  const move = (e: React.PointerEvent) => {
    if (!d.current || d.current.id !== e.pointerId) return;
    const ang = (Math.atan2(e.clientX - d.current.cx, -(e.clientY - d.current.cy)) * 180) / Math.PI;
    const nv = Math.round(((Math.max(-135, Math.min(135, ang)) + 135) / 270) * spec.max);
    if (nv !== spec.val) { spec.set(nv); sim.audio.switchClick(); notify(); }
  };
  const up = (e: React.PointerEvent) => { if (d.current?.id === e.pointerId) { d.current = null; setHeld(false); } };
  const marks = [];
  for (let i = 0; i <= spec.max; i++) {
    const t = ((-135 + (270 * i) / spec.max) * Math.PI) / 180;
    const col = fn === 'temp' ? (i < spec.max / 2 ? '#4f8fd6' : i > spec.max / 2 ? '#e05252' : '#8b97a2') : i <= spec.val && i > 0 ? '#ffb02e' : '#4a535b';
    marks.push(<circle key={i} cx={cx + (r + 6) * Math.sin(t)} cy={cy - (r + 6) * Math.cos(t)} r="1.3" fill={col} />);
  }
  const rad = (a * Math.PI) / 180;
  return (
    <g data-testid={`knob-${fn}`} className={held ? 'held' : ''}>
      {marks}
      {photo && art.has('knob') && <g transform={`rotate(${a} ${cx} ${cy})`} className="knob-face"><ArtImg id="knob" px={cx} py={cy} scale={(r * 2.3) / (art.layer('knob')!.w / 4)} /></g>}
      {!(photo && art.has('knob')) && <>
      {/* poço, sombra, lateral recartilhada e face */}
      <circle cx={cx} cy={cy + 1} r={r + 2.5} fill="#050607" />
      <ellipse cx={cx + 2.5} cy={cy + 6} rx={r * 1.02} ry={r * 0.78} fill="url(#castShadow)" />
      <circle cx={cx} cy={cy + 3.4} r={r} fill="#08090a" />
      <circle cx={cx} cy={cy + 3.4} r={r} fill="none" stroke="#24292e" strokeWidth="2.6" strokeDasharray="0.9 1.5" />
      <g className="knob-face">
        <circle cx={cx} cy={cy} r={r} fill="url(#knobFace)" stroke="#4a535b" strokeWidth="0.7" />
        <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="0.8" />
        <path d={`M${cx - r * 0.8} ${cy - r * 0.35} A${r} ${r} 0 0 1 ${cx + r * 0.2} ${cy - r * 0.95}`} fill="none" stroke="#ffffff" strokeOpacity="0.28" strokeWidth="1.1" strokeLinecap="round" />
        <rect x={cx - 1.6} y={cy - r + 2.5} width="3.2" height={r * 0.7} rx="1.6" fill="#e9edf0" transform={`rotate(${a} ${cx} ${cy})`} />
        <circle cx={cx + (r - 3) * Math.sin(rad)} cy={cy - (r - 3) * Math.cos(rad)} r="0" />
      </g>
      </>}
      <circle cx={cx} cy={cy} r={r + 10} fill="transparent" style={{ touchAction: 'none' }} data-testid={`knob-${fn}-hit`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
    </g>
  );
}

// ------------------------------------------------------------------ câmbio no console
function GearInScene({ photo }: { photo: boolean }) {
  const knob = React.useRef<SVGGElement | null>(null);
  const shaft = React.useRef<SVGPathElement | null>(null);
  const boot = React.useRef<SVGPathElement | null>(null);
  const folds = React.useRef<SVGPathElement | null>(null);
  const ring = React.useRef<SVGEllipseElement | null>(null);
  const dot = React.useRef<SVGGElement | null>(null);
  const lock = React.useRef<SVGGElement | null>(null);
  const [held, setHeld] = React.useState(false);
  const d = React.useRef<null | { id: number; sx: number; sy: number; lx: number; ly: number; k: number; moved: boolean; timer: ReturnType<typeof setTimeout> | null }>(null);
  // COL/ROW: quanto o dedo anda (em unidades da cena) para ir de uma posição a outra — curto para caber na tela
  const BX = 618, BY = 396, COL = 34, ROW = 32;
  const GX = 618, GY = 352; // centro do "H" que aparece ao tocar
  useFrame(() => {
    const s = sim.shifter;
    if (dot.current) dot.current.setAttribute('transform', `translate(${(GX + s.x * COL).toFixed(2)} ${(GY + s.y * ROW).toFixed(2)})`);
    if (lock.current) lock.current.style.opacity = s.reverseUnlocked ? '0' : '1';
    const kx = BX + s.x * 16, ky = BY - 30 + s.y * 13;
    if (knob.current) knob.current.setAttribute('transform', `translate(${kx.toFixed(2)} ${ky.toFixed(2)})`);
    if (shaft.current) shaft.current.setAttribute('d', `M${BX - 4} ${BY - 4} L${kx - 3.5} ${ky + 6} L${kx + 3.5} ${ky + 6} L${BX + 4} ${BY - 4} Z`);
    // a sanfona do câmbio deforma seguindo a alavanca
    const cxm = (BX + kx) / 2, cym = (BY + ky) / 2 + 6;
    if (boot.current) boot.current.setAttribute('d', `M${BX - 42} ${BY} Q${cxm - 26} ${cym} ${kx - 9} ${ky + 9} L${kx + 9} ${ky + 9} Q${cxm + 26} ${cym} ${BX + 42} ${BY} A42 18 0 0 1 ${BX - 42} ${BY} Z`);
    if (folds.current) {
      let f = '';
      for (const t of [-0.6, -0.2, 0.2, 0.6]) {
        const bx = BX + t * 40, tx = kx + t * 9;
        f += `M${bx} ${BY + 6} Q${(bx + tx) / 2 + t * 10} ${(BY + ky) / 2 + 4} ${tx} ${ky + 10} `;
      }
      folds.current.setAttribute('d', f);
    }
    if (ring.current) ring.current.style.opacity = s.reverseUnlocked ? '1' : '0';
  });
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    if (d.current) return;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const s = sim.shifter;
    s.beginDrag();
    setHeld(true);
    const st = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: s.x, ly: s.y, k: unit(e), moved: false, timer: null as ReturnType<typeof setTimeout> | null };
    st.timer = setTimeout(() => { if (d.current === st && !st.moved) { s.reverseUnlocked = true; sim.audio.tick(); } }, 380);
    d.current = st;
  };
  const move = (e: React.PointerEvent) => {
    const st = d.current;
    if (!st || st.id !== e.pointerId) return;
    const dx = (e.clientX - st.sx) / st.k, dy = (e.clientY - st.sy) / st.k;
    if (!st.moved && Math.hypot(dx, dy) > 6) st.moved = true;
    if (st.moved) sim.shifter.moveToward(st.lx + dx / COL, st.ly + dy / ROW);
  };
  const up = (e: React.PointerEvent) => {
    const st = d.current;
    if (!st || st.id !== e.pointerId) return;
    if (st.timer) clearTimeout(st.timer);
    d.current = null;
    setHeld(false);
    sim.shifter.endDrag();
  };
  return (
    <g className={held ? 'held' : ''}>
      {/* moldura do console e sanfona */}
      <ellipse cx={BX} cy={BY + 3} rx="50" ry="23" fill="#050607" />
      <ellipse cx={BX} cy={BY + 1} rx="47" ry="21" fill="url(#chromeDark)" />
      <ellipse cx={BX} cy={BY + 2} rx="43" ry="18.5" fill="#040505" />
      <path ref={boot} fill="url(#boot)" stroke="#23282c" strokeWidth="0.6" />
      <path ref={folds} fill="none" stroke="#050607" strokeWidth="1.3" opacity="0.9" />
      <path ref={shaft} fill="url(#shaft)" />
      <g ref={knob} transform={`translate(${BX} ${BY - 30})`}>
        <ellipse cx="3" cy="9" rx="19" ry="11" fill="url(#castShadow)" />
        <ellipse cx="0" cy="3" rx="17" ry="13" fill="#0a0b0d" />
        {photo && art.has('gearKnob') && <g className="knob-face"><ArtImg id="gearKnob" px={0} py={0} testId="art-gear" /></g>}
        <g className="knob-face" style={photo && art.has('gearKnob') ? { display: 'none' } : undefined}>
          <ellipse cx="0" cy="0" rx="17" ry="13" fill="url(#gearKnob)" stroke="#4a535b" strokeWidth="0.7" />
          <ellipse cx="-5" cy="-5" rx="7" ry="3.5" fill="#ffffff" opacity="0.16" />
          <ellipse ref={ring} cx="0" cy="0" rx="20" ry="16" fill="none" stroke="#ffb02e" strokeWidth="2" style={{ opacity: 0 }} />
          <g className="sc-pat">
            <text x="-7" y="-3.5" textAnchor="middle">1</text><text x="0" y="-3.5" textAnchor="middle">3</text><text x="7" y="-3.5" textAnchor="middle">5</text>
            <path d="M-7 -2 V5 M0 -2 V5 M7 -2 V5 M-7 1.5 H7" stroke="#9aa4ad" strokeWidth="0.5" fill="none" />
            <text x="-7" y="9.5" textAnchor="middle">2</text><text x="0" y="9.5" textAnchor="middle">4</text><text x="7" y="9.5" textAnchor="middle">R</text>
          </g>
        </g>
      </g>
      <rect x="526" y="314" width="154" height="70" fill="transparent" data-testid="gear-hit" style={{ touchAction: 'none' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} />
      {/* guia do "H": aparece enquanto o dedo está na alavanca, com a bolinha seguindo o dedo */}
      <g className={`gate ${held ? 'show' : ''}`} pointerEvents="none" data-testid="gear-gate">
        <rect x={GX - 64} y={GY - 56} width="128" height="112" rx="16" fill="#050607" opacity="0.94" stroke="#2c3238" />
        <path d={`M${GX - COL} ${GY - ROW} V${GY + ROW} M${GX} ${GY - ROW} V${GY + ROW} M${GX + COL} ${GY - ROW} V${GY + ROW} M${GX - COL} ${GY} H${GX + COL}`} stroke="#2e353b" strokeWidth="17" strokeLinecap="round" fill="none" />
        <path d={`M${GX - COL} ${GY - ROW} V${GY + ROW} M${GX} ${GY - ROW} V${GY + ROW} M${GX + COL} ${GY - ROW} V${GY + ROW} M${GX - COL} ${GY} H${GX + COL}`} stroke="#0a0c0e" strokeWidth="13" strokeLinecap="round" fill="none" />
        {([['1', -1, -1], ['3', 0, -1], ['5', 1, -1], ['2', -1, 1], ['4', 0, 1], ['R', 1, 1]] as [string, number, number][]).map(([g, x, y]) => (
          <text key={g} x={GX + x * COL} y={GY + y * (ROW + 17)} className={`gate-l ${sim.shifter.gear === g ? 'cur' : ''} ${g === 'R' ? 'r' : ''}`} textAnchor="middle" dominantBaseline="central">{g}</text>
        ))}
        <text x={GX + 10} y={GY - 7} className="gate-n" textAnchor="middle">N</text>
        <g ref={lock} transform={`translate(${GX + COL + 13} ${GY + ROW - 4})`}>
          <rect x="-4" y="-1" width="8" height="7" rx="1.5" fill="#ffb02e" />
          <path d="M-2.5 -1 V-3.5 a2.5 2.5 0 0 1 5 0 V-1" fill="none" stroke="#ffb02e" strokeWidth="1.4" />
        </g>
        <g ref={dot} transform={`translate(${GX} ${GY})`}>
          <circle r="10" fill="url(#gearKnob)" stroke="#ffb02e" strokeWidth="1.6" />
          <ellipse cx="-3" cy="-3.5" rx="4" ry="2" fill="#fff" opacity="0.2" />
        </g>
      </g>
    </g>
  );
}

// ------------------------------------------------------------------ textura do plástico
function useGrain() {
  return React.useMemo(() => {
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 96;
      const g = c.getContext('2d')!;
      const img = g.createImageData(96, 96);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random();
        const on = v > 0.5;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = on ? 255 : 0;
        img.data[i + 3] = Math.floor(Math.abs(v - 0.5) * 18);
      }
      g.putImageData(img, 0, 0);
      return c.toDataURL();
    } catch { return ''; }
  }, []);
}

// ------------------------------------------------------------------ cena
export function Scene({ onZoom, reveal, lay }: { onZoom: (z: ZoomId) => void; reveal: string | null; lay: Lay }) {
  const v = sim.veh, c = sim.car;
  const setup = carSetup.get();
  const grain = useGrain();
  const { SW, L, C, Rt } = lay;
  const wheelDrag = useWheelDrag(L);
  const photo = useArtReady();
  const led = (x: number, y: number, on: boolean | undefined) => on !== undefined && on ? <rect x={x} y={y} width="6" height="1.6" rx="0.8" fill="#ffb02e" className="led-on" pointerEvents="none" /> : null;
  const back = v.position && v.powerOn;
  const legend = back ? '#ffcf8a' : '#a3adb6';
  const hzOn = v.hazard && v.blinkOn;
  const st = STATIONS[v.station];
  const screenOn = v.accOn;
  const now = new Date();
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const zoomRect = (z: ZoomId, x: number, y: number, w: number, h: number, id?: string) => (
    <rect x={x} y={y} width={w} height={h} rx="6" fill="transparent" data-testid={id ?? `zoom-${z}`} style={{ touchAction: 'none' }}
      onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); onZoom(z); }} />
  );
  // áreas para o destaque do "Onde fica?" (com o deslocamento do grupo)
  const R: Record<string, [number, number, number, number]> = {
    cluster: [L + 172, 160, 196, 98], stalkL: [L + 8, 250, 86, 66], wheel: [L + 132, 288, 276, 40], stalkR: [L + 446, 250, 86, 66], leftBank: [L + 24, 194, 62, 54],
    door: [L - 4, 150, 26, 120], start: [L + 448, 320, 64, 64],
    media: [C + 532, 90, 176, 108], hazard: [C + 608, 204, 34, 34], climate: [C + 546, 246, 158, 74], console: [C + 526, 324, 196, 96],
  };
  const slotLabel = (fn: SlotFn) => ({ level: 'FAROL ▲▼', espOff: 'ESP OFF', isgOff: 'ISG OFF', lock: 'TRAVA', ac: 'A/C', recirc: 'RECIRC', rearDefrost: 'DESEMB', fan: '', temp: '', vent: '', none: '' }[fn]);
  const slotLed = (fn: SlotFn) => ({ espOff: !v.esp, isgOff: !v.isg, lock: v.locked, ac: v.ac && v.fan > 0, recirc: v.recirc, rearDefrost: v.rearDefrost } as Record<string, boolean>)[fn];
  const mid = SW / 2;

  return (
    <svg className="scene-svg" viewBox={`0 0 ${SW} 420`} style={{ width: SW }} data-testid="scene">
      <defs>
        <linearGradient id="dashTop" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2a2e32" /><stop offset="1" stopColor="#141619" /></linearGradient>
        <linearGradient id="dashFace" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#1f2225" /><stop offset="0.45" stopColor="#151719" /><stop offset="1" stopColor="#08090a" /></linearGradient>
        <linearGradient id="hood" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2a2f33" /><stop offset="1" stopColor="#0c0e10" /></linearGradient>
        <linearGradient id="rim" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#3a4147" /><stop offset="0.4" stopColor="#1d2125" /><stop offset="1" stopColor="#0a0b0c" /></linearGradient>
        <radialGradient id="hub" cx="45%" cy="30%" r="80%"><stop offset="0" stopColor="#353c42" /><stop offset="0.7" stopColor="#16191c" /><stop offset="1" stopColor="#0b0d0f" /></radialGradient>
        <linearGradient id="spoke" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2c3237" /><stop offset="1" stopColor="#101214" /></linearGradient>
        <linearGradient id="stalkArm" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4a535b" /><stop offset="0.45" stopColor="#20252a" /><stop offset="1" stopColor="#0c0e10" /></linearGradient>
        <linearGradient id="stalkRing" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#555f68" /><stop offset="0.45" stopColor="#262c31" /><stop offset="1" stopColor="#0f1214" /></linearGradient>
        <linearGradient id="keyFace" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#30363c" /><stop offset="1" stopColor="#15181b" /></linearGradient>
        <radialGradient id="knobFace" cx="38%" cy="28%" r="85%"><stop offset="0" stopColor="#4a525a" /><stop offset="0.55" stopColor="#1e2226" /><stop offset="1" stopColor="#0c0e10" /></radialGradient>
        <radialGradient id="gearKnob" cx="38%" cy="28%" r="85%"><stop offset="0" stopColor="#5a636b" /><stop offset="0.5" stopColor="#22272b" /><stop offset="1" stopColor="#0b0d0f" /></radialGradient>
        <radialGradient id="boot" cx="45%" cy="30%" r="80%"><stop offset="0" stopColor="#24292d" /><stop offset="1" stopColor="#090a0b" /></radialGradient>
        <linearGradient id="shaft" x1="0" x2="1"><stop offset="0" stopColor="#0d0f11" /><stop offset="0.5" stopColor="#3b434a" /><stop offset="1" stopColor="#0d0f11" /></linearGradient>
        <linearGradient id="chrome" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#dfe5ea" /><stop offset="0.45" stopColor="#5d666e" /><stop offset="0.7" stopColor="#9aa3ab" /><stop offset="1" stopColor="#3c444b" /></linearGradient>
        <linearGradient id="chromeDark" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#6b747c" /><stop offset="0.5" stopColor="#23282c" /><stop offset="1" stopColor="#4a535b" /></linearGradient>
        <radialGradient id="lockFace" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#3a4248" /><stop offset="1" stopColor="#111315" /></radialGradient>
        <linearGradient id="keyHead" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#3a4248" /><stop offset="1" stopColor="#111315" /></linearGradient>
        <radialGradient id="castShadow"><stop offset="0" stopColor="#000" stopOpacity="0.7" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <linearGradient id="screenG" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#0f2032" /><stop offset="1" stopColor="#03070b" /></linearGradient>
        <linearGradient id="glare" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.1" /><stop offset="0.38" stopColor="#ffffff" stopOpacity="0.02" /><stop offset="0.39" stopColor="#ffffff" stopOpacity="0" /></linearGradient>
        <linearGradient id="ventDepth" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#020203" /><stop offset="1" stopColor="#0b0c0e" /></linearGradient>
        <linearGradient id="recess" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#060708" /><stop offset="0.25" stopColor="#101214" /><stop offset="1" stopColor="#141619" /></linearGradient>
        <radialGradient id="footwell" cx="50%" cy="20%" r="90%"><stop offset="0" stopColor="#050506" /><stop offset="1" stopColor="#0d0e10" /></radialGradient>
        <radialGradient id="vignette" cx="50%" cy="55%" r="75%"><stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.5" /></radialGradient>
        {grain && <pattern id="grain" width="96" height="96" patternUnits="userSpaceOnUse"><image href={grain} width="96" height="96" /></pattern>}
      </defs>

      {photo && <image href={art.url('base')} x={L} y={0} width={art.layer('base')!.w / 4} height={420} preserveAspectRatio="none" pointerEvents="none" data-art="base" data-testid="art-base" />}
      {!photo && <>
      {/* colunas A */}
      <path d="M0 0 H38 L10 128 H0 Z" fill="#0a0b0c" />
      <path d="M34 0 L38 0 L10 128 L7 128 Z" fill="#1c1f22" />
      <path d={`M${SW} 0 H${SW - 38} L${SW - 10} 128 H${SW} Z`} fill="#0a0b0c" />

      {/* painel: superfície de cima, face, textura */}
      <path d={`M0 122 Q${mid} 92 ${SW} 122 L${SW} 148 Q${mid} 122 0 148 Z`} fill="url(#dashTop)" />
      <path d={`M0 146 Q${mid} 120 ${SW} 146 V420 H0 Z`} fill="url(#dashFace)" />
      {grain && <path d={`M0 122 Q${mid} 92 ${SW} 122 V420 H0 Z`} fill="url(#grain)" pointerEvents="none" />}
      <path d={`M0 146 Q${mid} 120 ${SW} 146`} fill="none" stroke="#3a4046" strokeWidth="1" />
      <path d={`M0 148 Q${mid} 122 ${SW} 148`} fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1.5" />
      {/* linhas de acabamento */}
      <path d={`M0 240 Q${(L + 300) * 0.6} 228 ${C + 522} 234`} fill="none" stroke="#08090a" strokeWidth="2" />
      <path d={`M0 241.6 Q${(L + 300) * 0.6} 229.6 ${C + 522} 235.6`} fill="none" stroke="#2b3035" strokeWidth="0.6" />
      <path d={`M${C + 714} 234 Q${(C + 714 + SW) / 2} 228 ${SW} 236`} fill="none" stroke="#08090a" strokeWidth="2" />
      <path d={`M${C + 714} 235.6 Q${(C + 714 + SW) / 2} 229.6 ${SW} 237.6`} fill="none" stroke="#2b3035" strokeWidth="0.6" />
      {/* ===================== lado do passageiro ===================== */}
      <g transform={`translate(${Rt} 0)`}>
        <Vent x={818} y={152} w={62} h={34} trim />
        <path d="M730 262 Q815 254 898 264" fill="none" stroke="#2b3035" strokeWidth="0.6" />
        <path d="M716 256 L900 250 L900 420 L716 420 Z" fill="url(#footwell)" />
        <path d="M716 256 L900 250" stroke="#000" strokeOpacity="0.6" strokeWidth="2" />
      </g>
      </>}
      {v.night && <path d={`M0 ${photo ? 100 : 122} Q${mid} ${photo ? 80 : 92} ${SW} ${photo ? 100 : 122} V420 H0 Z`} fill="#000" opacity="0.45" pointerEvents="none" />}
      {photo && (
        <g transform={`translate(${Rt} 0)`}>
          <path d="M716 256 L900 250 L900 420 L716 420 Z" fill="#000" opacity="0.35" pointerEvents="none" />
        </g>
      )}

      {/* ===================== lado do motorista ===================== */}
      <g transform={`translate(${L} 0)`}>
        {!photo && <>
        {/* porta */}
        <path d="M-60 150 L18 154 L18 268 L-60 276 Z" fill="#0f1113" stroke="#22272b" />
        <rect x="3" y="194" width="11" height="14" rx="2.5" fill="url(#keyFace)" stroke="#3a4148" strokeWidth="0.5" />
        {/* poço da embreagem */}
        <path d="M-60 316 L104 312 L112 420 L-60 420 Z" fill="url(#footwell)" />
        <Vent x={24} y={152} w={60} h={34} trim />
        {/* botões à esquerda do volante */}
        <rect x="22" y="194" width="66" height="54" rx="6" fill="url(#recess)" stroke="#22272b" />
        <g className="press" onPointerDown={(e: React.PointerEvent) => pressFx(e)}>
          {setup.leftBank.map((fn, i) => fn !== 'none' && <Key3D key={i} x={29} y={200 + i * 15} w={52} label={slotLabel(fn)} led={slotLed(fn)} legend={legend} />)}
        </g>
        </>}
        {photo && setup.leftBank.map((fn, i) => fn !== 'none' && <React.Fragment key={i}>{led(52, 201.4 + i * 15, slotLed(fn))}</React.Fragment>)}
        {zoomRect('door', -4, 150, 26, 120, 'zoom-door')}
        {zoomRect('leftBank', 22, 194, 66, 54, 'zoom-leftBank')}

        {/* capô e quadro */}
        {!photo && <>
        <rect x="164" y="152" width="212" height="114" rx="24" fill="#040506" />
        <path d="M148 180 Q146 128 270 124 Q394 128 392 180 Q388 148 270 144 Q152 148 148 180 Z" fill="url(#hood)" />
        <path d="M152 176 Q152 132 270 128 Q388 132 388 176" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" />
        </>}
        <ClusterSvg x={172} y={160} width={196} height={98} id="scene" />
        <rect x="172" y="160" width="196" height="98" rx="18" fill="url(#glare)" pointerEvents="none" />
        {zoomRect('cluster', 190, 186, 160, 70, 'zoom-cluster')}

        {/* capa da coluna de direção (aparece quando o volante gira) */}
        {!photo && <>
        <path d="M196 262 Q270 246 344 262 L352 360 Q270 376 188 360 Z" fill="url(#hood)" stroke="#2a3036" />
        <path d="M200 266 Q270 251 340 266" fill="none" stroke="#ffffff" strokeOpacity="0.08" />
        </>}
        <WheelGrip {...wheelDrag} />
        <StalkInScene side="L" onZoom={onZoom} photo={photo} />
        <StalkInScene side="R" onZoom={onZoom} photo={photo} />
        <Wheel legend={legend} onZoom={onZoom} photo={photo} />
        <Ignition photo={photo} />
      </g>

      {/* ===================== console central ===================== */}
      <g transform={`translate(${C} 0)`}>
        {/* central multimídia flutuante */}
        {!photo && <>
        <rect x="527" y="99" width="186" height="96" rx="8" fill="#000" opacity="0.55" />
        <rect x="532" y="90" width="176" height="92" rx="7" fill="url(#hood)" stroke="#3a4148" strokeWidth="1" />
        </>}
        <rect x="539" y="96" width="162" height="80" rx="3" fill={screenOn ? 'url(#screenG)' : '#020303'} />
        {screenOn && (
          <g data-testid="screen">
            <text x="547" y="109" className="sc-scr-s">{clock}</text>
            <text x="693" y="109" className="sc-scr-s" textAnchor="end">{v.outsideTemp}°C</text>
            {v.radioOn ? (
              <>
                <text x="547" y="131" className="sc-scr-s" style={{ fill: '#63aee8' }}>{SOURCES[v.source]}</text>
                <text x="547" y="151" className="sc-scr-l">{v.source === 0 ? `FM ${st.f}` : v.source === 1 ? 'Celular' : 'USB · faixa 3'}</text>
                <text x="547" y="166" className="sc-scr-s">{v.source === 0 ? st.name : 'Reproduzindo'}</text>
                <text x="693" y="166" className="sc-scr-s" textAnchor="end">{v.mute ? 'MUDO' : `VOL ${v.volume}`}</text>
              </>
            ) : <text x="620" y="146" className="sc-scr-l" textAnchor="middle">{clock}</text>}
          </g>
        )}
        <rect x="539" y="96" width="162" height="80" rx="3" fill="url(#glare)" pointerEvents="none" />
        {!photo && <>
        <line x1="536" x2="704" y1="91" y2="91" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="0.8" />
        <rect x="550" y="185" width="140" height="15" rx="4" fill="url(#recess)" stroke="#22272b" />
        <g className="press" onPointerDown={(e: React.PointerEvent) => pressFx(e)}>
          {['⏻', '◀◀', '▶▶', 'MAP', 'HOME'].map((t, i) => <Key3D key={t} x={553 + i * 27} y={187} w={24} h={9.5} r={2} label={t} legend={legend} />)}
        </g>
        </>}
        {zoomRect('media', 532, 90, 176, 112, 'zoom-media')}

        {/* saídas centrais e pisca-alerta */}
        {!photo && <>
        <Vent x={540} y={204} w={68} h={34} />
        <Vent x={642} y={204} w={68} h={34} />
        </>}
        <g data-testid="hazard" className="press" style={{ touchAction: 'none' }}
          onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); pressFx(e, 180); if (!q('hazard')) { v.toggleHazard(); notify(); } }}>
          {photo && art.has('hazardOff') ? (
            <g className="keycap">
              <image href={art.url(hzOn && art.has('hazardOn') ? 'hazardOn' : 'hazardOff')} x="609" y="205" width="32" height="32" preserveAspectRatio="none" data-art="hazard" />
              {hzOn && !art.has('hazardOn') && <path d="M625 212.5 L633.5 228 H616.5 Z" fill="#ff5a4c" opacity="0.5" className="hz-glow" />}
            </g>
          ) : <>
          <rect x="611" y="207" width="28" height="29" rx="5" fill="#030404" />
          <rect x="612.5" y="210.5" width="25" height="25" rx="4.5" fill="#0b0d0f" />
          <g className="keycap">
            <rect x="612.5" y="208" width="25" height="25" rx="4.5" fill="url(#keyFace)" stroke="#454d55" strokeWidth="0.7" />
            <line x1="616" x2="634" y1="208.8" y2="208.8" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="0.7" />
            {hzOn && <path d="M625 212.5 L633.5 228 H616.5 Z" fill="#ff5a4c" opacity="0.5" className="hz-glow" />}
            <path d="M625 212.5 L633.5 228 H616.5 Z M625 217.4 L629.8 225.6 H620.2 Z" fill="none" stroke={hzOn ? '#ff7568' : '#c2463d'} strokeWidth="1.9" strokeLinejoin="round" />
          </g>
          </>}
          <rect x="604" y="200" width="42" height="42" fill="transparent" />
        </g>

        {/* ar-condicionado (painel rebaixado) */}
        {!photo && <>
        <rect x="546" y="246" width="158" height="76" rx="11" fill="url(#recess)" stroke="#262b30" />
        <rect x="547" y="247" width="156" height="74" rx="10" fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1.5" />
        </>}
        {setup.knobs.map((fn, i) => <KnobInScene key={i} fn={fn} cx={[584, 625, 666][i]} cy={272} r={i === 1 ? 17 : 15} photo={photo} />)}
        {!photo && <g className="press" onPointerDown={(e: React.PointerEvent) => pressFx(e)}>
          {setup.climateBtns.map((fn, i) => fn !== 'none' && <Key3D key={i} x={558 + i * 34} y={301} w={30} h={11} label={slotLabel(fn)} led={slotLed(fn)} legend={legend} />)}
        </g>}
        {photo && setup.climateBtns.map((fn, i) => fn !== 'none' && <React.Fragment key={i}>{led(570 + i * 34, 302.4, slotLed(fn))}</React.Fragment>)}
        <rect x="548" y="297" width="154" height="22" fill="transparent" data-testid="zoom-climate" style={{ touchAction: 'none' }}
          onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); onZoom('climate'); }} />

        {/* console: nicho com tomadas, câmbio, freio de mão */}
        {!photo && <>
        <rect x="572" y="325" width="106" height="20" rx="5" fill="url(#recess)" stroke="#22272b" />
        <rect x="589" y="331" width="13" height="5.5" rx="1" fill="#050607" stroke="#2a3036" strokeWidth="0.5" /><text x="595.5" y="343" className="sc-tiny" textAnchor="middle">USB</text>
        <circle cx="656" cy="334.5" r="4.8" fill="#050607" stroke="#2a3036" strokeWidth="0.6" /><text x="656" y="343" className="sc-tiny" textAnchor="middle">12V</text>
        </>}
        <GearInScene photo={photo} />
        <g data-testid="handbrake" className="press" style={{ touchAction: 'none' }}
          onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); pressFx(e, 200); if (!q('handbrake')) sim.toggleHandbrake(); }}>
          {photo && art.has('handbrakeDown') && <image href={art.url(c.inputs.handbrake && art.has('handbrakeUp') ? 'handbrakeUp' : 'handbrakeDown')} x="672" y="334" width="60" height="90" preserveAspectRatio="none" data-art="handbrake" />}
          {!(photo && art.has('handbrakeDown')) && <>
          <path d={c.inputs.handbrake ? 'M690 424 L699 372 Q703 360 714 363 L719 424 Z' : 'M690 424 L696 398 Q700 388 711 391 L719 424 Z'} fill="#000" opacity="0.4" transform="translate(3 3)" />
          <path d={c.inputs.handbrake ? 'M690 424 L699 372 Q703 360 714 363 L719 424 Z' : 'M690 424 L696 398 Q700 388 711 391 L719 424 Z'} fill="url(#stalkArm)" stroke="#3a4148" strokeWidth="0.7" />
          <path d={c.inputs.handbrake ? 'M701 370 Q704 363 712 364' : 'M698 396 Q701 390 709 391'} stroke="#ffffff" strokeOpacity="0.25" strokeWidth="1" fill="none" />
          </>}
          <rect x="684" y="352" width="40" height="68" fill="transparent" />
        </g>
      </g>

      {/* vinheta: profundidade nas bordas */}
      <rect x="0" y="0" width={SW} height="420" fill="url(#vignette)" pointerEvents="none" />
      {reveal && R[reveal] && <rect className="reveal" x={R[reveal][0]} y={R[reveal][1]} width={R[reveal][2]} height={R[reveal][3]} rx="8" pointerEvents="none" />}
    </svg>
  );
}
