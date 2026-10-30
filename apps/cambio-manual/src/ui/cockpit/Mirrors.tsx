import React from 'react';
import { sim } from '../../core/sim';
import { useFrame } from '../hooks';
import { project, CAR, ROAD, REAR_GLASS, GEO, type MirrorId, type Aim } from '../../sim/mirrors';
import { carSetup } from '../panel/layout';
import { drawCity, mirrorView } from './cityRender';

// ------------------------------------------------------------------ desenho do reflexo
type V3 = [number, number, number];
interface View { id: MirrorId; a: Aim; ox: number; oy: number; W: number; H: number }
interface Env { night: boolean; rain: number; dist: number; gap: number; paint: string; braking: boolean; t: number }

const ZS = [0.25, 0.5, 0.8, 1.2, 1.7, 2.3, 3, 4, 5.5, 7.5, 10, 14, 20, 28, 40, 60, 90, 140, 220, 400, 900];

function pt(vw: View, x: number, y: number, z: number): [number, number] {
  const [u, v] = project(vw.id, vw.a, x, y, z);
  return [vw.ox + u * vw.W, vw.oy + v * vw.H];
}
function poly(g: CanvasRenderingContext2D, vw: View, pts: V3[]) {
  g.beginPath();
  pts.forEach((p, i) => { const [X, Y] = pt(vw, p[0], p[1], p[2]); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
  g.closePath();
}
/** Faixa do chão entre x1 e x2, de z0 a z1 (amostrada para seguir a perspectiva). */
function strip(g: CanvasRenderingContext2D, vw: View, x1: number, x2: number, z0 = 0.25, z1 = 900, y = 0) {
  const zs = [z0, ...ZS.filter((z) => z > z0 && z < z1), z1];
  g.beginPath();
  zs.forEach((z, i) => { const [X, Y] = pt(vw, x1, y, z); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
  for (let i = zs.length - 1; i >= 0; i--) { const [X, Y] = pt(vw, x2, y, zs[i]); g.lineTo(X, Y); }
  g.closePath();
}
function shade(hex: string, k: number, a = 1) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(k >= 1 ? c + (255 - c) * (k - 1) : c * k)));
  return `rgba(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)},${a})`;
}
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Rua de trás: céu, árvores no horizonte, pista, faixas, balizadores e o carro que vem atrás. */
/** O que aparece atrás: a cidade de treino (quando ativa) ou a estrada. */
function drawBehind(g: CanvasRenderingContext2D, vw: View, e: Env, from = 0.25) {
  if (sim.city.active) {
    const geo = GEO[vw.id];
    drawCity(g, mirrorView(sim.city.pose, geo.cam, vw.a.yaw, vw.a.pitch, geo.fovH, geo.fovV, { ox: vw.ox, oy: vw.oy, w: vw.W, h: vw.H }), { night: e.night, rain: e.rain, low: true });
    return;
  }
  drawWorld(g, vw, e, from);
}

function drawWorld(g: CanvasRenderingContext2D, vw: View, e: Env, from = 0.25) {
  const { night, rain } = e;
  const fov = GEO[vw.id].fovH, fovV = GEO[vw.id].fovV;
  const hy = vw.oy + (0.5 + vw.a.pitch / fovV) * vw.H;
  const sky = g.createLinearGradient(0, vw.oy, 0, hy);
  if (night) { sky.addColorStop(0, '#03050a'); sky.addColorStop(1, '#0c121a'); }
  else if (rain) { sky.addColorStop(0, '#76838d'); sky.addColorStop(1, '#a9b3ba'); }
  else { sky.addColorStop(0, '#86aacb'); sky.addColorStop(1, '#d5e0e8'); }
  g.fillStyle = sky; g.fillRect(vw.ox - 4, vw.oy - 4, vw.W + 8, vw.H + 8);
  // linha de árvores e morros (no infinito: não andam, só mudam com o ângulo do espelho)
  g.fillStyle = night ? '#020304' : rain ? '#4b5750' : '#55694c';
  g.beginPath();
  const a0 = vw.a.yaw - 0.6, a1 = vw.a.yaw + 0.6;
  g.moveTo(vw.ox - 4, hy + 1);
  for (let a = Math.floor(a0 / 0.012) * 0.012; a <= a1; a += 0.012) {
    const k = Math.round(a / 0.012);
    const hgt = (0.006 + 0.012 * hash(k) + 0.01 * Math.max(0, Math.sin(k * 0.21))) / fovV * vw.H;
    g.lineTo(vw.ox + (0.5 + (a - vw.a.yaw) / fov) * vw.W, hy - hgt);
  }
  g.lineTo(vw.ox + vw.W + 4, hy + 1); g.closePath(); g.fill();
  // campo
  const field = g.createLinearGradient(0, hy, 0, vw.oy + vw.H);
  field.addColorStop(0, night ? '#06080a' : rain ? '#5a625c' : '#7a8a68');
  field.addColorStop(1, night ? '#030405' : rain ? '#444b46' : '#5b6b4c');
  g.fillStyle = field; g.fillRect(vw.ox - 4, hy, vw.W + 8, vw.oy + vw.H - hy + 4);
  // acostamento e pista
  g.fillStyle = night ? '#0b0d0f' : rain ? '#4a4e51' : '#7c7c76'; strip(g, vw, ROAD.rightEdge, ROAD.shoulder, from); g.fill();
  g.fillStyle = night ? '#0d1013' : rain ? '#33383c' : '#4d5257'; strip(g, vw, ROAD.leftEdge, ROAD.rightEdge, from); g.fill();
  if (rain && !night) { g.fillStyle = 'rgba(200,210,220,0.08)'; strip(g, vw, -1.3, 1.3, from); g.fill(); } // pista molhada refletindo o céu
  // faixas
  const line = night ? '#3c3f42' : '#e8e3d2';
  g.fillStyle = line;
  strip(g, vw, ROAD.rightEdge - 0.14, ROAD.rightEdge - 0.02, from); g.fill();
  strip(g, vw, ROAD.leftEdge + 0.02, ROAD.leftEdge + 0.14, from); g.fill();
  const ph = ((e.dist % 12) + 12) % 12;
  for (let j = -1; j < 30; j++) {
    const z0 = ph + j * 12, z1 = z0 + 4;
    if (z1 < from) continue;
    strip(g, vw, ROAD.centerLine - 0.06, ROAD.centerLine + 0.06, Math.max(from, z0), z1); g.fill();
  }
  // balizadores na beira (andam para longe com o carro)
  const pp = ((e.dist % 25) + 25) % 25;
  for (let j = 14; j >= 0; j--) {
    const z = pp + j * 25;
    if (z < from + 0.5) continue;
    for (const x of [ROAD.shoulder + 0.5, ROAD.leftEdge - 1.2]) {
      const [bx, by] = pt(vw, x, 0, z), [, ty] = pt(vw, x, 1.0, z), [rx] = pt(vw, x + 0.07, 0, z);
      const w = Math.max(0.6, Math.abs(rx - bx) * 2);
      g.fillStyle = night ? '#121416' : '#e4e1d7'; g.fillRect(bx - w / 2, ty, w, by - ty);
      g.fillStyle = night ? 'rgba(255,190,90,0.55)' : '#1d1f21'; g.fillRect(bx - w / 2, ty, w, (by - ty) * 0.16);
    }
  }
  drawFollower(g, vw, e, from);
}

function drawFollower(g: CanvasRenderingContext2D, vw: View, e: Env, from: number) {
  const zf = CAR.rear + e.gap;
  if (zf < from || zf > 600) return;
  const c = '#2b3f5c', x = 0;
  const q = (pts: V3[], fill: string) => { poly(g, vw, pts); g.fillStyle = fill; g.fill(); };
  q([[x - 0.95, 0, zf - 0.1], [x + 0.95, 0, zf - 0.1], [x + 0.95, 0, zf + 3.6], [x - 0.95, 0, zf + 3.6]], 'rgba(0,0,0,0.35)');
  q([[x - 0.86, 0.72, zf], [x + 0.86, 0.72, zf], [x + 0.78, 0.9, zf + 1.1], [x - 0.78, 0.9, zf + 1.1]], e.night ? '#0d1218' : shade(c, 1.12));
  q([[x - 0.76, 0.92, zf + 1.1], [x + 0.76, 0.92, zf + 1.1], [x + 0.62, 1.4, zf + 1.85], [x - 0.62, 1.4, zf + 1.85]], e.night ? '#05070a' : '#22303b');
  q([[x - 0.62, 1.4, zf + 1.85], [x + 0.62, 1.4, zf + 1.85], [x + 0.6, 1.44, zf + 2.6], [x - 0.6, 1.44, zf + 2.6]], e.night ? '#0a0e13' : shade(c, 1.2));
  q([[x - 0.88, 0.16, zf], [x + 0.88, 0.16, zf], [x + 0.86, 0.72, zf], [x - 0.86, 0.72, zf]], e.night ? '#080b0f' : c);
  q([[x - 0.42, 0.28, zf], [x + 0.42, 0.28, zf], [x + 0.42, 0.48, zf], [x - 0.42, 0.48, zf]], '#0c0d0f');
  q([[x - 0.24, 0.2, zf], [x + 0.24, 0.2, zf], [x + 0.24, 0.3, zf], [x - 0.24, 0.3, zf]], e.night ? '#3a3a36' : '#d9dcdc');
  if (!e.night) {
    q([[x - 0.7, 1.0, zf + 1.25], [x - 0.1, 1.0, zf + 1.25], [x - 0.3, 1.3, zf + 1.7], [x - 0.6, 1.3, zf + 1.7]], 'rgba(255,255,255,0.12)');
  }
  // faróis (à noite ofuscam, a alavanca dia/noite do interno reduz)
  for (const s of [-1, 1]) {
    poly(g, vw, [[x + s * 0.82, 0.54, zf], [x + s * 0.5, 0.56, zf], [x + s * 0.5, 0.67, zf], [x + s * 0.82, 0.66, zf]]);
    g.fillStyle = e.night ? '#fffbea' : '#cfd6db'; g.fill();
    if (e.night) {
      const [hx, hy] = pt(vw, x + s * 0.66, 0.6, zf);
      const [ex] = pt(vw, x + s * 0.66 + 0.3, 0.6, zf);
      const r = Math.max(4, Math.abs(ex - hx) * 5);
      const gl = g.createRadialGradient(hx, hy, 0, hx, hy, r);
      gl.addColorStop(0, 'rgba(255,250,225,0.9)'); gl.addColorStop(0.25, 'rgba(255,240,200,0.35)'); gl.addColorStop(1, 'rgba(255,240,200,0)');
      g.fillStyle = gl; g.fillRect(hx - r, hy - r, r * 2, r * 2);
    }
  }
}

/** Lateral do próprio carro no espelho externo: pintura, vidro traseiro, maçaneta e lanterna. */
function drawOwnBody(g: CanvasRenderingContext2D, vw: View, e: Env) {
  const s = vw.id === 'L' ? -1 : 1, xf = s * CAR.halfW;
  const p = e.paint;
  const far: [number, number] = pt(vw, xf, 0.9, CAR.rear), near: [number, number] = pt(vw, xf, 0.9, 0.3);
  const gr = g.createLinearGradient(far[0], 0, near[0], 0);
  gr.addColorStop(0, shade(p, e.night ? 0.18 : 0.78)); gr.addColorStop(1, shade(p, e.night ? 0.3 : 1.04));
  // chapa (porta traseira e para-lama)
  poly(g, vw, [[xf, 0.25, 0.2], [xf, 0.25, CAR.rear - 0.15], [xf + -s * 0.05, 0.5, CAR.rear], [xf + -s * 0.05, 0.92, CAR.rear - 0.05], [xf, 0.97, 2.15], [xf, 0.97, 0.2]]);
  g.fillStyle = gr; g.fill();
  // reflexo do céu na linha de cintura
  poly(g, vw, [[xf, 0.84, 0.2], [xf, 0.84, CAR.rear - 0.1], [xf, 0.9, CAR.rear - 0.12], [xf, 0.91, 0.2]]);
  g.fillStyle = e.night ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.38)'; g.fill();
  // vinco escuro abaixo da cintura
  poly(g, vw, [[xf, 0.74, 0.2], [xf, 0.74, CAR.rear - 0.1], [xf, 0.77, CAR.rear - 0.1], [xf, 0.77, 0.2]]);
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fill();
  // vidro lateral traseiro e coluna C
  poly(g, vw, [[xf + -s * 0.06, 0.98, 0.2], [xf + -s * 0.08, 0.98, 1.95], [xf + -s * 0.24, 1.3, 1.6], [xf + -s * 0.22, 1.32, 0.2]]);
  g.fillStyle = e.night ? '#030405' : '#1b232b'; g.fill();
  poly(g, vw, [[xf + -s * 0.06, 1.0, 0.2], [xf + -s * 0.07, 1.0, 1.3], [xf + -s * 0.16, 1.18, 1.1], [xf + -s * 0.15, 1.2, 0.2]]);
  g.fillStyle = e.night ? 'rgba(255,255,255,0.03)' : 'rgba(200,220,235,0.18)'; g.fill();
  poly(g, vw, [[xf + -s * 0.08, 0.97, 1.95], [xf + -s * 0.06, 0.95, CAR.rear - 0.08], [xf + -s * 0.3, 1.33, CAR.rear - 0.25], [xf + -s * 0.24, 1.33, 1.6]]);
  g.fillStyle = shade(p, e.night ? 0.22 : 0.9); g.fill();
  // friso da porta e maçaneta
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.lineWidth = 0.8;
  g.beginPath(); { const [a, b] = pt(vw, xf, 0.3, 1.25), [c2, d] = pt(vw, xf, 0.97, 1.2); g.moveTo(a, b); g.lineTo(c2, d); } g.stroke();
  poly(g, vw, [[xf, 0.8, 1.5], [xf, 0.8, 1.72], [xf, 0.84, 1.72], [xf, 0.84, 1.5]]);
  g.fillStyle = shade(p, 0.5); g.fill();
  // lanterna (acende com o freio)
  poly(g, vw, [[xf + -s * 0.04, 0.74, CAR.rear - 0.18], [xf + -s * 0.06, 0.74, CAR.rear - 0.02], [xf + -s * 0.08, 0.93, CAR.rear - 0.06], [xf + -s * 0.04, 0.95, CAR.rear - 0.22]]);
  g.fillStyle = e.braking ? '#ff3b2f' : e.night ? '#4a0c0a' : '#8e1e1a'; g.fill();
  if (e.braking) {
    const [lx, ly] = pt(vw, xf, 0.85, CAR.rear - 0.1);
    const gl = g.createRadialGradient(lx, ly, 0, lx, ly, vw.W * 0.12);
    gl.addColorStop(0, 'rgba(255,60,40,0.5)'); gl.addColorStop(1, 'rgba(255,60,40,0)');
    g.fillStyle = gl; g.fillRect(lx - vw.W * 0.12, ly - vw.W * 0.12, vw.W * 0.24, vw.W * 0.24);
  }
}

/** Interior visto pelo interno: teto, colunas, vidro traseiro, encostos e o limpador traseiro. */
function drawRearView(g: CanvasRenderingContext2D, vw: View, e: Env) {
  const v = sim.veh;
  const R = REAR_GLASS;
  // forro do teto e colunas
  const roof = g.createLinearGradient(0, vw.oy, 0, vw.oy + vw.H);
  roof.addColorStop(0, e.night ? '#08090a' : '#4a4b4c'); roof.addColorStop(1, e.night ? '#050506' : '#2d2e30');
  g.fillStyle = roof; g.fillRect(vw.ox - 4, vw.oy - 4, vw.W + 8, vw.H + 8);
  // vidros laterais traseiros (aparecem se o espelho estiver virado demais)
  for (const s of [-1, 1]) {
    poly(g, vw, [[s * 0.75, 1.22, 1.0], [s * 0.72, 1.22, 1.75], [s * 0.74, 0.98, 1.95], [s * 0.78, 0.98, 1.0]]);
    g.fillStyle = e.night ? '#06080b' : '#7f97ab'; g.fill();
  }
  const glass: V3[] = [[-R.topHalf, R.topY, R.topZ], [R.topHalf, R.topY, R.topZ], [R.botHalf, R.botY, R.botZ], [-R.botHalf, R.botY, R.botZ]];
  // borda preta do vidro (serigrafia)
  poly(g, vw, glass.map(([x, y, z]) => [x * 1.06, y + (y > 1.1 ? 0.03 : -0.03), z] as V3)); g.fillStyle = '#060707'; g.fill();
  g.save();
  poly(g, vw, glass); g.clip();
  drawBehind(g, vw, e, CAR.rear + 0.05);
  // resistências do desembaçador
  g.strokeStyle = v.rearDefrost && v.powerOn ? 'rgba(255,140,60,0.5)' : 'rgba(40,30,25,0.45)'; g.lineWidth = 0.6;
  for (let i = 1; i < 9; i++) {
    const k = i / 9, y = R.topY + (R.botY - R.topY) * k, z = R.topZ + (R.botZ - R.topZ) * k, hw = R.topHalf + (R.botHalf - R.topHalf) * k;
    const [a, b] = pt(vw, -hw * 0.94, y, z), [c, d] = pt(vw, hw * 0.94, y, z);
    g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke();
  }
  // gotas no vidro traseiro (o limpador traseiro tira)
  if (e.rain && !v.rearWiper) {
    for (let i = 0; i < 26 * e.rain; i++) {
      const u = hash(i + 3), w = hash(i + 51);
      const x = (u - 0.5) * 1.05, y = R.botY + (R.topY - R.botY) * w, z = R.botZ + (R.topZ - R.botZ) * w;
      const [px, py] = pt(vw, x, y, z);
      g.fillStyle = 'rgba(220,230,238,0.35)'; g.beginPath(); g.arc(px, py, 0.6 + hash(i + 9) * 1.2, 0, Math.PI * 2); g.fill();
    }
  }
  // limpador traseiro (pivô embaixo, no centro)
  const wa = Math.PI * (0.06 + 0.82 * (v.rearWiperPos ?? 0));
  const [px, py] = pt(vw, 0.05, R.botY + 0.02, R.botZ);
  const [qx, qy] = pt(vw, 0.05 - Math.cos(wa) * 0.55, R.botY + 0.02 + Math.sin(wa) * 0.28, R.botZ - Math.sin(wa) * 0.3);
  g.strokeStyle = '#050505'; g.lineWidth = 1.6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke();
  g.restore();
  // encostos de cabeça do banco traseiro
  for (const x of [-0.45, 0, 0.45]) {
    poly(g, vw, [[x - 0.12, 0.8, 1.35], [x + 0.12, 0.8, 1.35], [x + 0.12, 1.02, 1.38], [x - 0.12, 1.02, 1.38]]);
    g.fillStyle = e.night ? '#070708' : '#252628'; g.fill();
    poly(g, vw, [[x - 0.1, 1.0, 1.36], [x + 0.1, 1.0, 1.36], [x + 0.1, 1.02, 1.38], [x - 0.1, 1.02, 1.38]]);
    g.fillStyle = 'rgba(255,255,255,0.07)'; g.fill();
  }
}

function roundPoly(g: CanvasRenderingContext2D, pts: [number, number][], r: number) {
  g.beginPath();
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], nx = pts[(i + 1) % n]; g.arcTo(p[0], p[1], nx[0], nx[1], r); }
  g.closePath();
}

// formas (fração da caixa do espelho); o direito é o esquerdo espelhado
const SHAPE = {
  housing: [[0.02, 0.07], [0.94, 0.17], [0.95, 0.9], [0.03, 0.97]] as [number, number][],
  glass: [[0.08, 0.16], [0.87, 0.25], [0.88, 0.81], [0.09, 0.88]] as [number, number][],
  sail: [[0.84, 0.56], [1.0, 0.5], [1.0, 1.0], [0.76, 1.0]] as [number, number][],
};

export interface MirrorDraw { id: MirrorId; aim?: Aim; big?: boolean }
/** Desenha um espelho inteiro (carcaça + reflexo) no canvas. */
export function paintMirror(cv: HTMLCanvasElement, d: MirrorDraw) {
  const r = cv.getBoundingClientRect();
  if (!r.width || !r.height) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  const g = cv.getContext('2d');
  if (!g) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  const v = sim.veh, c = sim.car, m = sim.mirrors;
  const e: Env = {
    night: v.night, rain: v.rain, dist: c.distance, gap: m.follow.gap, paint: carSetup.get().paint,
    braking: v.powerOn && c.inputs.brake > 0.08, t: performance.now() / 1000,
  };
  const a = d.aim ?? m.aim[d.id];
  // vibração do motor no espelho externo (o interno quase não vibra)
  const jit = c.engineOn && !d.big ? Math.sin(e.t * 2 * Math.PI * (c.rpm / 60)) * (c.rpm < 1100 ? 0.45 : 0.2) * dpr + c.shake * 0.25 * dpr : 0;

  if (d.id === 'I') {
    const X = (fx: number) => fx * w, Y = (fy: number) => fy * h;
    const top = d.big ? 0 : 0.26;
    if (!d.big) {
      // base no teto e haste
      g.fillStyle = '#1c1e20'; roundPoly(g, [[X(0.42), 0], [X(0.58), 0], [X(0.56), Y(0.12)], [X(0.44), Y(0.12)]], 3 * dpr); g.fill();
      g.fillStyle = '#0e0f10'; g.fillRect(X(0.485), Y(0.08), X(0.03), Y(0.22));
    }
    // carcaça
    const hb: [number, number][] = [[X(0.02), Y(top)], [X(0.98), Y(top)], [X(0.98), Y(d.big ? 1 : 0.92)], [X(0.02), Y(d.big ? 1 : 0.92)]];
    g.fillStyle = '#0b0c0d'; roundPoly(g, hb, h * 0.22); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = dpr; g.stroke();
    const gb: [number, number][] = [[X(0.05), Y(top + 0.06)], [X(0.95), Y(top + 0.06)], [X(0.95), Y(d.big ? 0.94 : 0.86)], [X(0.05), Y(d.big ? 0.94 : 0.86)]];
    g.save(); roundPoly(g, gb, h * 0.16); g.clip();
    const vw: View = { id: 'I', a, ox: gb[0][0], oy: gb[0][1], W: gb[1][0] - gb[0][0], H: gb[2][1] - gb[0][1] };
    drawRearView(g, vw, e);
    if (m.nightTab) { g.fillStyle = 'rgba(6,10,16,0.62)'; g.fillRect(0, 0, w, h); }
    glassFx(g, vw);
    g.restore();
    if (!d.big) {
      // alavanca dia/noite
      g.fillStyle = m.nightTab ? '#3a3f44' : '#202326';
      roundPoly(g, [[X(0.46), Y(0.88)], [X(0.54), Y(0.88)], [X(0.535), Y(1)], [X(0.465), Y(1)]], 2 * dpr); g.fill();
    }
    return;
  }

  const flip = d.id === 'R';
  const P = (s: [number, number][]) => s.map(([x, y]) => [(flip ? 1 - x : x) * w, y * h] as [number, number]);
  const box = d.big ? null : P(SHAPE.housing);
  if (box) {
    // base preta presa à porta
    g.fillStyle = '#0d0e10'; roundPoly(g, P(SHAPE.sail), 4 * dpr); g.fill();
    // carcaça na cor do carro, vista de dentro (borda) com sombra
    const hg = g.createLinearGradient(0, 0, 0, h);
    const paint = carSetup.get().paint;
    hg.addColorStop(0, shade(paint, v.night ? 0.25 : 1.06)); hg.addColorStop(0.5, shade(paint, v.night ? 0.18 : 0.82)); hg.addColorStop(1, shade(paint, v.night ? 0.1 : 0.55));
    g.fillStyle = hg; roundPoly(g, box, 9 * dpr); g.fill();
    g.fillStyle = '#060707'; roundPoly(g, P([[0.055, 0.12], [0.905, 0.215], [0.915, 0.85], [0.065, 0.925]]), 7 * dpr); g.fill();
    // repetidor da seta na carcaça
    const side = d.id === 'L' ? -1 : 1;
    if (v.turnActive && v.blinkOn && (v.hazard || v.turn === side)) {
      const [lx, ly] = P([[0.05, 0.8]])[0];
      const gl = g.createRadialGradient(lx, ly, 0, lx, ly, w * 0.18);
      gl.addColorStop(0, 'rgba(255,170,40,0.95)'); gl.addColorStop(0.35, 'rgba(255,150,30,0.4)'); gl.addColorStop(1, 'rgba(255,150,30,0)');
      g.fillStyle = gl; g.fillRect(lx - w * 0.18, ly - w * 0.18, w * 0.36, w * 0.36);
    }
  }
  const gp = d.big ? [[0, 0], [w, 0], [w, h], [0, h]] as [number, number][] : P(SHAPE.glass);
  const xs = gp.map((p) => p[0]), ys = gp.map((p) => p[1]);
  const vw: View = { id: d.id, a, ox: Math.min(...xs), oy: Math.min(...ys) + jit, W: Math.max(...xs) - Math.min(...xs), H: Math.max(...ys) - Math.min(...ys) };
  g.save();
  roundPoly(g, gp, (d.big ? 14 : 6) * dpr); g.clip();
  drawBehind(g, vw, e);
  drawOwnBody(g, vw, e);
  // gotas no espelho externo
  if (e.rain) {
    const n = 7 * e.rain;
    for (let i = 0; i < n; i++) {
      const px = vw.ox + hash(i * 3 + (flip ? 7 : 1)) * vw.W, py = vw.oy + hash(i * 5 + 2) * vw.H, rr = (0.8 + hash(i + 4) * 1.6) * dpr * (d.big ? 2.2 : 1);
      g.fillStyle = 'rgba(225,235,242,0.32)'; g.beginPath(); g.arc(px, py, rr, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(px - rr * 0.3, py - rr * 0.3, rr * 0.3, 0, Math.PI * 2); g.fill();
    }
  }
  g.fillStyle = 'rgba(110,150,190,0.07)'; g.fillRect(vw.ox, vw.oy - 2, vw.W, vw.H + 4); // película azulada do espelho
  glassFx(g, vw);
  g.restore();
  if (box) { g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 0.8 * dpr; roundPoly(g, gp, 6 * dpr); g.stroke(); }
}

/** Brilho do vidro e escurecimento nas bordas (profundidade). */
function glassFx(g: CanvasRenderingContext2D, vw: View) {
  const cx = vw.ox + vw.W / 2, cy = vw.oy + vw.H / 2;
  const vg = g.createRadialGradient(cx, cy, Math.min(vw.W, vw.H) * 0.3, cx, cy, Math.max(vw.W, vw.H) * 0.62);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.38)');
  g.fillStyle = vg; g.fillRect(vw.ox - 2, vw.oy - 2, vw.W + 4, vw.H + 4);
  const sh = g.createLinearGradient(vw.ox, vw.oy, vw.ox + vw.W * 0.6, vw.oy + vw.H);
  sh.addColorStop(0, 'rgba(255,255,255,0.16)'); sh.addColorStop(0.3, 'rgba(255,255,255,0.03)'); sh.addColorStop(0.31, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(vw.ox - 2, vw.oy - 2, vw.W + 4, vw.H + 4);
}

/** Canvas que redesenha o espelho a cada quadro. */
export function MirrorCanvas({ id, big, className, testId }: { id: MirrorId; big?: boolean; className?: string; testId?: string }) {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const n = React.useRef(id === 'R' ? 1 : 0);
  useFrame(() => {
    if (!ref.current) return;
    // na cidade os espelhos pequenos se redesenham em quadros alternados (o direito e o esquerdo intercalados)
    if (sim.city.active && !big && (n.current++ & 1)) return;
    paintMirror(ref.current, { id, big });
  });
  return <canvas ref={ref} className={className} data-testid={testId} />;
}

// ------------------------------------------------------------------ espelhos na cena
export interface MirrorBoxes { L: [number, number, number, number]; R: [number, number, number, number]; I: [number, number, number, number] }
/** Onde cada espelho fica na cena (x, y, largura, altura em unidades). */
export function mirrorBoxes(L: number, C: number, Rt: number): MirrorBoxes {
  const ix = (L + 270 + C + 620) / 2 + 18;
  return { L: [L + 2, 60, 100, 62], R: [Rt + 808, 66, 84, 54], I: [ix - 72, 0, 144, 52] };
}

/** Arrasto do interno com a mão: o reflexo acompanha o dedo. */
function useRearDrag(onTap: () => void) {
  const d = React.useRef<null | { id: number; x: number; y: number; k: number; moved: boolean }>(null);
  const down = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    const svgH = (e.currentTarget as HTMLElement).closest('.scene')?.getBoundingClientRect().height ?? 420;
    d.current = { id: e.pointerId, x: e.clientX, y: e.clientY, k: svgH / 420, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    const s = d.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = (e.clientX - s.x) / s.k, dy = (e.clientY - s.y) / s.k;
    if (!s.moved && Math.hypot(dx, dy) < 5) return;
    s.moved = true;
    s.x = e.clientX; s.y = e.clientY;
    // 144 unidades = largura do espelho ≈ campo de visão dele
    sim.mirrors.nudge('I', -dx / 144 * 0.5, dy / 52 * 0.16 * 0.8);
  };
  const up = (e: React.PointerEvent) => {
    const s = d.current;
    if (!s || s.id !== e.pointerId) return;
    d.current = null;
    if (!s.moved) onTap();
    sim.notify();
  };
  return { onPointerDown: down, onPointerMove: move, onPointerUp: up, onPointerCancel: up };
}

export function MirrorsLayer({ boxes, onOpen, onQuiz, onGlance }: { boxes: MirrorBoxes; onOpen: (z: 'door' | 'mirrorI') => void; onQuiz: (id: string) => boolean; onGlance?: (id: MirrorId) => boolean }) {
  React.useEffect(() => { sim.mirrorsVisible = true; return () => { sim.mirrorsVisible = false; }; }, []);
  const drag = useRearDrag(() => { if (onGlance?.('I')) return; if (!onQuiz('mirrorI')) onOpen('mirrorI'); });
  const st = (b: [number, number, number, number]) => ({ left: b[0], top: b[1], width: b[2], height: b[3] });
  const tapSide = (id: 'L' | 'R') => (e: React.PointerEvent) => { e.preventDefault(); if (onGlance?.(id)) return; if (!onQuiz('mirrorSwitch')) onOpen('door'); };
  return (
    <>
      <div className="mirror ext" style={st(boxes.L)} data-testid="mirror-L" onPointerDown={tapSide('L')}><MirrorCanvas id="L" /></div>
      <div className="mirror ext" style={st(boxes.R)} data-testid="mirror-R" onPointerDown={tapSide('R')}><MirrorCanvas id="R" /></div>
      <div className="mirror int" style={st(boxes.I)} data-testid="mirror-I" {...drag}><MirrorCanvas id="I" /></div>
      <button type="button" className="mirror-tab" aria-label="Dia/noite do retrovisor interno" data-testid="mirror-tab"
        style={{ left: boxes.I[0] + boxes.I[2] / 2 - 14, top: boxes.I[1] + boxes.I[3] - 8, width: 28, height: 16 }}
        onPointerDown={(e: React.PointerEvent) => { e.preventDefault(); e.stopPropagation(); sim.mirrors.nightTab = !sim.mirrors.nightTab; sim.mirrors.persist(); sim.audio.switchClick(); sim.notify(); }} />
    </>
  );
}
