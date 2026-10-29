import React from 'react';
import { sim } from '../../core/sim';
import type { Lay } from './Scene';

// Moldura da cabine e corpo do painel (desenho vetorial). Tudo em unidades da cena (altura 420).
//
// Curvas de referência (parábolas na largura da cena, u = x / SW):
//   base do para-brisa / topo do painel: y = 122 − 60·u(1−u)
//   borda (lábio) do painel:            y = 146 − 52·u(1−u)
//   borda do teto:                      y = 26 − 56·u(1−u)

export const curve = (a: number, b: number, SW: number) => (x: number) => { const u = x / SW; return a - b * u * (1 - u); };
/** Trecho [x0, x1] de uma curva y = a − b·u(1−u), deslocado dy, como "M … Q …". */
export function seg(a: number, b: number, SW: number, x0: number, x1: number, dy = 0, move = true) {
  const f = curve(a, b, SW);
  const d = (x: number) => -b * (1 - 2 * (x / SW)) / SW; // derivada
  const xc = (x0 + x1) / 2, yc = f(x0) + d(x0) * (x1 - x0) / 2;
  return `${move ? 'M' : 'L'}${x0.toFixed(1)} ${(f(x0) + dy).toFixed(1)} Q${xc.toFixed(1)} ${(yc + dy).toFixed(1)} ${x1.toFixed(1)} ${(f(x1) + dy).toFixed(1)}`;
}

/** Gradientes e texturas extras da cabine. */
export function CabinDefs({ night }: { night: boolean }) {
  return (
    <>
      <linearGradient id="headliner" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={night ? '#0e0f10' : '#6f7173'} /><stop offset="0.8" stopColor={night ? '#171819' : '#9a9c9d'} /><stop offset="1" stopColor={night ? '#1a1b1c' : '#a7a9aa'} />
      </linearGradient>
      <linearGradient id="visor" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={night ? '#1c1d1e' : '#b4b6b7'} /><stop offset="1" stopColor={night ? '#121314' : '#8e9091'} />
      </linearGradient>
      <linearGradient id="visorDown" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={night ? '#151617' : '#9a9c9d'} /><stop offset="0.7" stopColor={night ? '#1b1c1d' : '#b3b5b6'} /><stop offset="1" stopColor={night ? '#101112' : '#8a8c8d'} />
      </linearGradient>
      <pattern id="frit" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="0.95" fill="#050607" /></pattern>
      <pattern id="fritS" width="3.2" height="3.2" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="1.6" r="0.55" fill="#050607" /></pattern>
      <pattern id="trimTex" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <rect width="4" height="4" fill="#191b1e" /><rect width="1.4" height="4" fill="#24272b" /><rect x="2" width="0.5" height="4" fill="#2e3237" />
      </pattern>
      <pattern id="carpet" width="6" height="6" patternUnits="userSpaceOnUse">
        <rect width="6" height="6" fill="#0d0e0f" /><circle cx="1" cy="1" r="0.7" fill="#17181a" /><circle cx="4" cy="3" r="0.6" fill="#151617" /><circle cx="2.5" cy="5" r="0.5" fill="#1a1b1d" />
      </pattern>
      <pattern id="grille" width="2.6" height="2.6" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.3" r="0.7" fill="#020303" /></pattern>
      <linearGradient id="trimLine" x1="0" x2="1"><stop offset="0" stopColor="#6a737b" stopOpacity="0.2" /><stop offset="0.35" stopColor="#c9d0d6" stopOpacity="0.8" /><stop offset="1" stopColor="#6a737b" stopOpacity="0.3" /></linearGradient>
      <linearGradient id="dashTop2" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={night ? '#121416' : '#41464b'} /><stop offset="0.55" stopColor={night ? '#0d0f10' : '#2a2e32'} /><stop offset="1" stopColor={night ? '#08090a' : '#1b1e21'} />
      </linearGradient>
      <linearGradient id="skyLight" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity={night ? 0 : 0.07} /><stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="chromeRing" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#eef2f5" /><stop offset="0.35" stopColor="#7b858d" /><stop offset="0.6" stopColor="#c3cad0" /><stop offset="1" stopColor="#3a4248" /></linearGradient>
      <linearGradient id="gloss" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0.16" /><stop offset="0.45" stopColor="#ffffff" stopOpacity="0.03" /><stop offset="0.46" stopColor="#ffffff" stopOpacity="0" /></linearGradient>
    </>
  );
}

/** Coluna A: faixa diagonal de tecido, borracha do para-brisa e tweeter na base. */
function Pillar({ side, lay, night }: { side: 'L' | 'R'; lay: Lay; night: boolean }) {
  const { SW, L, Rt } = lay;
  const top = curve(122, 60, SW);
  const s = side === 'L' ? 1 : -1;
  const o = side === 'L' ? L : Rt + 900;
  // bordas: externa (lado da porta) e interna (lado do vidro)
  const oT = o + s * 28, oB = o + s * 142, iT = o + s * 92, iB = o + s * 186;
  const yoB = top(oB) + 5, yiB = top(iB) + 2;
  const id = `pil${side}`;
  const mx = (oT + oB) / 2, my = 60;
  const nx = 0.74 * s, ny = -0.67;
  return (
    <g pointerEvents="none">
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={mx} y1={my} x2={mx + nx * 52} y2={my + ny * 52}>
          <stop offset="0" stopColor={night ? '#050506' : '#18191b'} /><stop offset="0.45" stopColor={night ? '#0b0c0d' : '#2c2e31'} />
          <stop offset="0.88" stopColor={night ? '#101112' : '#404347'} /><stop offset="1" stopColor={night ? '#141516' : '#55595d'} />
        </linearGradient>
      </defs>
      {/* sombra que a coluna faz no vidro */}
      <path d={`M${iT} -2 L${iT + s * 10} -2 L${iB + s * 12} ${yiB} L${iB} ${yiB} Z`} fill="#000" opacity="0.18" />
      <path d={`M${oT} -2 L${iT} -2 L${iB} ${yiB} L${oB} ${yoB} Z`} fill={`url(#${id})`} />
      <path d={`M${oT} -2 L${iT} -2 L${iB} ${yiB} L${oB} ${yoB} Z`} fill="url(#grain)" opacity="0.8" />
      {/* borracha/moldura do vidro na borda interna */}
      <path d={`M${iT} -2 L${iB} ${yiB}`} stroke="#050506" strokeWidth="3.2" />
      <path d={`M${iT - s * 2.6} -2 L${iB - s * 2.6} ${yiB}`} stroke="#ffffff" strokeOpacity={night ? 0.03 : 0.12} strokeWidth="0.8" />
      {/* tweeter na base da coluna */}
      <ellipse cx={(oB + iB) / 2 + s * 6} cy={top((oB + iB) / 2) + 9} rx="15" ry="5.2" fill="#0b0c0d" stroke="#2b2f33" strokeWidth="0.6" />
      <ellipse cx={(oB + iB) / 2 + s * 6} cy={top((oB + iB) / 2) + 9} rx="13" ry="4.2" fill="url(#grille)" />
    </g>
  );
}

/** Teto, faixa serigrafada do para-brisa e colunas A. Fica por trás de tudo, na frente da rua. */
export function CabinFrame({ lay, mirrorX, photo }: { lay: Lay; mirrorX: number; photo: boolean }) {
  const { SW } = lay;
  const night = sim.veh.night;
  const mid = SW / 2;
  return (
    <g pointerEvents="none" data-testid="cabin-frame">
      {/* serigrafia: faixa preta com pontos que somem para dentro do vidro */}
      <path d={`M0 26 Q${mid} -2 ${SW} 26 L${SW} 33 Q${mid} 5 0 33 Z`} fill="#050607" />
      <path d={`M0 32 Q${mid} 4 ${SW} 32 L${SW} 37 Q${mid} 9 0 37 Z`} fill="url(#frit)" />
      <path d={`M0 36 Q${mid} 8 ${SW} 36 L${SW} 40 Q${mid} 12 0 40 Z`} fill="url(#fritS)" />
      {/* serigrafia em volta da base do retrovisor interno (sensor) */}
      <path d={`M${mirrorX - 34} 10 L${mirrorX + 34} 10 L${mirrorX + 26} 36 Q${mirrorX} 41 ${mirrorX - 26} 36 Z`} fill="#050607" />
      <path d={`M${mirrorX - 30} 34 Q${mirrorX} 44 ${mirrorX + 30} 34 L${mirrorX + 32} 38 Q${mirrorX} 48 ${mirrorX - 32} 38 Z`} fill="url(#fritS)" />
      {!photo && <><Pillar side="L" lay={lay} night={night} /><Pillar side="R" lay={lay} night={night} /></>}
      {/* teto (sobe além da tela para cobrir as faixas em aparelhos 16:9; as colunas entram por baixo dele) */}
      <path d={`M0 -140 H${SW} V26 Q${mid} -2 0 26 Z`} fill="url(#headliner)" />
      <path d={`M0 -140 H${SW} V26 Q${mid} -2 0 26 Z`} fill="url(#grain)" />
      <path d={`M0 26 Q${mid} -2 ${SW} 26`} fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="1.2" />
      <path d={`M0 27.5 Q${mid} -0.5 ${SW} 27.5`} fill="none" stroke="#000" strokeOpacity="0.15" strokeWidth="2.5" />
    </g>
  );
}

/** Para-sóis: dobrados no teto; um toque abaixa (e outro sobe). */
export function SunVisors({ lay, mirrorX }: { lay: Lay; mirrorX: number }) {
  const { L, Rt } = lay;
  const [down, setDown] = React.useState<{ L: boolean; R: boolean }>({ L: false, R: false });
  const one = (side: 'L' | 'R', x0: number, x1: number) => {
    const on = down[side];
    const out = side === 'L' ? x0 : x1, inn = side === 'L' ? x1 : x0; // dobradiça no lado da porta, presilha no lado do retrovisor
    const toggle = (e: React.PointerEvent) => { e.preventDefault(); setDown((d) => ({ ...d, [side]: !d[side] })); sim.audio.switchClick(); };
    const w = x1 - x0;
    return (
      <g data-testid={`visor-${side}`} data-down={on ? '1' : '0'} style={{ touchAction: 'none' }} onPointerDown={toggle}>
        {/* haste e presilha */}
        <rect x={Math.min(out, out + (side === 'L' ? -10 : 0))} y="5" width="10" height="4" rx="2" fill="#2a2c2e" />
        <rect x={inn + (side === 'L' ? -3 : -5)} y="6" width="8" height="9" rx="2" fill="#6d6f71" stroke="#3b3d3f" strokeWidth="0.6" />
        {/* dobrado */}
        <g className="visor-up" style={{ opacity: on ? 0 : 1 }}>
          <path d={`M${x0 + 6} 5 L${x1 - 6} 5 Q${x1} 5 ${x1} 11 L${x1 - 2} 19 Q${x1 - 4} 23 ${x1 - 10} 23 L${x0 + 10} 23 Q${x0 + 4} 23 ${x0 + 2} 19 L${x0} 11 Q${x0} 5 ${x0 + 6} 5 Z`} fill="url(#visor)" stroke="#55585a" strokeWidth="0.6" />
          <path d={`M${x0 + 8} 19.5 L${x1 - 8} 19.5`} stroke="#5c5f61" strokeWidth="0.6" strokeDasharray="1.6 1.2" />
          <path d={`M${x0 + 6} 6.5 L${x1 - 6} 6.5`} stroke="#ffffff" strokeOpacity="0.25" strokeWidth="0.7" />
          <path d={`M${x0 + 2} 22 Q${(x0 + x1) / 2} 26 ${x1 - 2} 22`} stroke="#000" strokeOpacity="0.25" strokeWidth="2" fill="none" />
        </g>
        {/* abaixado: painel de frente com a tampa do espelho de cortesia */}
        <g className="visor-dn" style={{ opacity: on ? 1 : 0, transform: on ? 'scaleY(1)' : 'scaleY(0.3)', transformOrigin: '0px 5px' }}>
          <path d={`M${x0 - 2} 5 L${x1 + 2} 5 L${x1 + 4} 60 Q${x1 + 4} 70 ${x1 - 8} 70 L${x0 + 8} 70 Q${x0 - 4} 70 ${x0 - 4} 60 Z`} fill="#000" opacity="0.3" transform="translate(2 4)" />
          <path d={`M${x0 - 2} 5 L${x1 + 2} 5 L${x1 + 4} 60 Q${x1 + 4} 70 ${x1 - 8} 70 L${x0 + 8} 70 Q${x0 - 4} 70 ${x0 - 4} 60 Z`} fill="url(#visorDown)" stroke="#5a5d60" strokeWidth="0.7" />
          <path d={`M${x0 + 2} 10 L${x1 - 2} 10 L${x1} 58 Q${x1} 65 ${x1 - 8} 65 L${x0 + 8} 65 Q${x0} 65 ${x0} 58 Z`} fill="none" stroke="#6e7173" strokeWidth="0.6" strokeDasharray="1.6 1.2" />
          <rect x={x0 + w * 0.3} y="24" width={w * 0.4} height="26" rx="3" fill="#8f9293" stroke="#5f6264" strokeWidth="0.7" />
          <rect x={x0 + w * 0.3 + 2} y="26" width={w * 0.4 - 4} height="3" rx="1.5" fill="#ffffff" opacity="0.18" />
          <rect x={x0 + w * 0.5 - 8} y="46" width="16" height="2.4" rx="1.2" fill="#6a6d6f" />
        </g>
        <rect x={x0 - 4} y="0" width={w + 8} height={on ? 72 : 26} fill="transparent" />
      </g>
    );
  };
  const lx0 = L + 168, lx1 = Math.max(lx0 + 150, mirrorX - 92);
  const rx0 = mirrorX + 92, rx1 = Math.max(rx0 + 150, Rt + 788);
  return <>{one('L', lx0, lx1)}{one('R', rx0, rx1)}</>;
}

/** Corpo do painel: topo iluminado pelo para-brisa, grade do desembaçador, borda com sombra e friso. */
export function DashBody({ lay }: { lay: Lay }) {
  const { SW, L, C, Rt } = lay;
  const night = sim.veh.night;
  const mid = SW / 2;
  const lipShadow = [[2, 4, 0.32], [5, 5, 0.18], [9, 6, 0.1], [14, 7, 0.05]] as const;
  return (
    <g pointerEvents="none">
      {/* topo do painel */}
      <path d={`M0 122 Q${mid} 92 ${SW} 122 L${SW} 148 Q${mid} 122 0 148 Z`} fill="url(#dashTop2)" />
      <path d={`M0 122 Q${mid} 92 ${SW} 122 L${SW} 128 Q${mid} 98 0 128 Z`} fill="#ffffff" opacity={night ? 0.01 : 0.05} />
      {/* grade do desembaçador, junto ao vidro */}
      <path d={seg(122, 60, SW, L + 196, Rt + 708, 6)} fill="none" stroke="#060708" strokeWidth="3.2" strokeDasharray="3.4 1.4" />
      <path d={seg(122, 60, SW, L + 196, Rt + 708, 8.2)} fill="none" stroke="#ffffff" strokeOpacity={night ? 0.02 : 0.08} strokeWidth="0.6" />
      {/* face do painel */}
      <path d={`M0 146 Q${mid} 120 ${SW} 146 V420 H0 Z`} fill="url(#dashFace)" />
      <rect x="0" y="419" width={SW} height="140" fill="#08090a" />
      <path d={`M0 122 Q${mid} 92 ${SW} 122 V420 H0 Z`} fill="url(#grain)" />
      {/* lábio: brilho na quina e sombra embaixo */}
      <path d={`M0 146 Q${mid} 120 ${SW} 146`} fill="none" stroke={night ? '#1d2124' : '#4a5056'} strokeWidth="1.1" />
      {lipShadow.map(([dy, w, op]) => <path key={dy} d={`M0 ${148 + dy} Q${mid} ${122 + dy} ${SW} ${148 + dy}`} fill="none" stroke="#000" strokeOpacity={op} strokeWidth={w} />)}
      {/* friso decorativo na altura das saídas de ar */}
      <path d={`${seg(240, 24, SW, 0, C + 522, 0)} L${C + 522} ${curve(240, 24, SW)(C + 522) + 11} ${seg(240, 24, SW, C + 522, 0, 11, false).replace(/^L[^Q]*/, '')} Z`} fill="url(#trimTex)" />
      <path d={seg(240, 24, SW, 0, C + 522, 0)} fill="none" stroke="url(#trimLine)" strokeWidth="0.9" />
      <path d={seg(240, 24, SW, 0, C + 522, 12)} fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1.6" />
      <path d={`${seg(240, 24, SW, C + 714, SW, 0)} L${SW} ${curve(240, 24, SW)(SW) + 11} ${seg(240, 24, SW, SW, C + 714, 11, false).replace(/^L[^Q]*/, '')} Z`} fill="url(#trimTex)" />
      <path d={seg(240, 24, SW, C + 714, SW, 0)} fill="none" stroke="url(#trimLine)" strokeWidth="0.9" />
      <path d={seg(240, 24, SW, C + 714, SW, 12)} fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="1.6" />
      {/* luz do para-brisa caindo sobre o painel */}
      <path d={`M0 122 Q${mid} 92 ${SW} 122 V270 H0 Z`} fill="url(#skyLight)" />
      {/* assoalho com carpete atrás dos pedais */}
      <path d={`M${L - 60} 318 Q${L + 30} 306 ${L + 104} 313 Q${L + 112} 360 ${L + 118} 560 L${L - 60} 560 Z`} fill="url(#carpet)" />
      <path d={`M${L - 60} 318 Q${L + 30} 306 ${L + 104} 313 Q${L + 112} 360 ${L + 116} 420 L${L - 60} 420 Z`} fill="url(#footwell)" opacity="0.55" />
      <path d={`M${L - 60} 318 Q${L + 30} 306 ${L + 104} 313`} fill="none" stroke="#000" strokeOpacity="0.75" strokeWidth="3" />
      <path d={`M${L - 60} 315.6 Q${L + 30} 303.6 ${L + 104} 310.6`} fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="0.8" />
      <g transform={`translate(${Rt} 0)`}>
        <path d="M704 264 Q790 246 900 250 L900 560 L690 560 Q704 340 704 264 Z" fill="url(#carpet)" />
        <path d="M704 264 Q790 246 900 250 L900 420 L694 420 Q704 340 704 264 Z" fill="url(#footwell)" opacity="0.55" />
        <path d="M704 264 Q790 246 900 250" fill="none" stroke="#000" strokeOpacity="0.75" strokeWidth="3" />
        <path d="M704 261.6 Q790 243.6 900 247.6" fill="none" stroke="#ffffff" strokeOpacity="0.06" strokeWidth="0.8" />
      </g>
    </g>
  );
}
