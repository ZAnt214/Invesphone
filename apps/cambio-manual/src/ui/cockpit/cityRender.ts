// Desenho 3D da cidade em canvas 2D: céu, asfalto, faixas, calçadas com meio-fio, prédios,
// postes e árvores, ordenados por distância. Serve ao para-brisa (câmera do olho do motorista)
// e aos retrovisores (câmeras virtuais olhando para trás).
import { CITY, CARGEO, type Pose } from '../../sim/city';

type V3 = [number, number, number];
export interface CView {
  /** mundo → câmera: x à direita, y para cima, z = profundidade */
  toCam(x: number, y: number, z: number): V3;
  /** câmera → tela (px) */
  proj(c: V3): [number, number];
  near: number;
  /** |x/z| acima disso está fora da vista (recorte lateral) */
  cull: number;
  /** retângulo de desenho e linha do horizonte */
  ox: number; oy: number; w: number; h: number; horizon: number;
  eye: [number, number];
  far: number;
}
export interface CityEnv { night: boolean; rain: number; guides?: GuideDraw | null; headlights?: boolean; low?: boolean }
export interface GuideDraw { path: [number, number][]; mark?: { x: number; z: number; kind: 'cone' | 'spot' } | null }

// ------------------------------------------------------------- câmeras
/** Olho do motorista, olhando para a frente do carro. f = distância focal em px. */
export function eyeView(p: Pose, pitch: number, f: number, cx: number, cy: number, w: number, h: number): CView {
  const s = Math.sin(p.h), c = Math.cos(p.h);
  const ex = p.x + s * CARGEO.eyeFwd + c * CARGEO.eyeSide, ez = p.z + c * CARGEO.eyeFwd - s * CARGEO.eyeSide;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return {
    toCam(x, y, z) {
      const dx = x - ex, dz = z - ez, dy = y - CARGEO.eyeH;
      const fw = dx * s + dz * c, rt = dx * c - dz * s;
      return [rt, dy * cp - fw * sp, dy * sp + fw * cp];
    },
    proj(v) { return [cx + (f * v[0]) / v[2], cy - (f * v[1]) / v[2]]; },
    near: 0.3, cull: (w / 2 + Math.abs(cx - w / 2)) / f + 0.15, ox: 0, oy: 0, w, h, horizon: cy + f * Math.tan(pitch), eye: [ex, ez], far: 210,
  };
}

/**
 * Câmera de um retrovisor: posição e ângulos no referencial do carro (x direita, y cima,
 * z para trás a partir da linha dos retrovisores), projeção angular como em sim/mirrors.
 */
export function mirrorView(p: Pose, cam: [number, number, number], yaw: number, pitch: number, fovH: number, fovV: number, rect: { ox: number; oy: number; w: number; h: number }): CView {
  const s = Math.sin(p.h), c = Math.cos(p.h);
  const mx = p.x + s * CARGEO.mirrorFwd, mz = p.z + c * CARGEO.mirrorFwd;
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cpp = Math.cos(pitch), spp = Math.sin(pitch);
  const ex = mx + c * cam[0] - s * cam[2], ez = mz - s * cam[0] - c * cam[2];
  return {
    toCam(x, y, z) {
      const dx = x - mx, dz = z - mz;
      const xr = dx * c - dz * s - cam[0];
      const zb = -(dx * s + dz * c) - cam[2];
      const dy = y - cam[1];
      const x1 = xr * cy - zb * sy, z1 = xr * sy + zb * cy;
      return [x1, dy * cpp - z1 * spp, dy * spp + z1 * cpp];
    },
    proj(v) {
      return [rect.ox + (0.5 + Math.atan2(v[0], v[2]) / fovH) * rect.w, rect.oy + (0.5 - Math.atan2(v[1], v[2]) / fovV) * rect.h];
    },
    near: 0.3, cull: Math.tan(fovH / 2 + 0.25), ox: rect.ox, oy: rect.oy, w: rect.w, h: rect.h,
    horizon: rect.oy + (0.5 + pitch / fovV) * rect.h, eye: [ex, ez], far: 130,
  };
}

// ------------------------------------------------------------- polígonos
/** Recorta no plano próximo, testa a vista e projeta. Devolve false se nada sobrou. */
function path(g: CanvasRenderingContext2D, v: CView, pts: V3[]) {
  const cam = pts.map(([x, y, z]) => v.toCam(x, y, z));
  const out: V3[] = [];
  for (let i = 0; i < cam.length; i++) {
    const a = cam[i], b = cam[(i + 1) % cam.length];
    const ina = a[2] >= v.near, inb = b[2] >= v.near;
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = (v.near - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, v.near]);
    }
  }
  if (out.length < 3) return false;
  let left = true, right = true;
  for (const q of out) { const r = q[0] / q[2]; if (r > -v.cull) left = false; if (r < v.cull) right = false; }
  if (left || right) return false;
  g.beginPath();
  out.forEach((q, i) => { const [sx, sy] = v.proj(q); if (i) g.lineTo(sx, sy); else g.moveTo(sx, sy); });
  g.closePath();
  return true;
}
function fill(g: CanvasRenderingContext2D, v: CView, pts: V3[], color: string) { if (path(g, v, pts)) { g.fillStyle = color; g.fill(); } }

// ------------------------------------------------------------- cores
type RGB = [number, number, number];
const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, k = 1) => `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;
const hash = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

const PAL = ['#d9cdb8', '#c9b79a', '#e3dccf', '#b9c3c9', '#d4a88a', '#a9b7a3', '#e8e0c8', '#c4a7a1', '#9fb0bf', '#dccfa8', '#bfb5ab', '#cdbfae'].map(hex);

// ------------------------------------------------------------- objetos de cada quarteirão
interface Box { x0: number; z0: number; x1: number; z1: number; h: number; col: RGB; win: boolean; seed: number }
interface Prop { x: number; z: number; kind: 'pole' | 'tree'; seed: number }
interface Block { i: number; j: number; boxes: Box[]; props: Prop[] }
const cache = new Map<string, Block>();

function block(i: number, j: number): Block {
  const key = `${i},${j}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { P, W, walk } = CITY;
  const ax = i * P + W / 2 + walk, bx = (i + 1) * P - W / 2 - walk;
  const az = j * P + W / 2 + walk, bz = (j + 1) * P - W / 2 - walk;
  const boxes: Box[] = [];
  const seed0 = (i * 73856093) ^ (j * 19349663);
  let k = 0;
  const rnd = () => hash(seed0 + k++ * 7.13);
  // fachadas ao longo dos quatro lados (as do eixo x pegam a quina)
  const side = (along: 'x' | 'z', fixed: number, dir: 1 | -1, from: number, to: number) => {
    let t = from;
    while (t < to - 4) {
      if (rnd() < 0.12) { t += 2 + rnd() * 3; continue; } // recuo / garagem
      const wid = Math.min(to - t, 9 + rnd() * 9);
      const dep = 9 + rnd() * 6;
      const tall = rnd();
      const hgt = tall < 0.45 ? 3.4 + rnd() * 2.6 : tall < 0.85 ? 6 + rnd() * 6 : 12 + rnd() * 16;
      const set = rnd() < 0.3 ? rnd() * 2.5 : 0;
      const col = PAL[Math.floor(rnd() * PAL.length)];
      const a = fixed + dir * set, b = fixed + dir * (set + dep);
      if (along === 'x') boxes.push({ x0: t, x1: t + wid, z0: Math.min(a, b), z1: Math.max(a, b), h: hgt, col, win: hgt > 3, seed: rnd() * 1000 });
      else boxes.push({ z0: t, z1: t + wid, x0: Math.min(a, b), x1: Math.max(a, b), h: hgt, col, win: hgt > 3, seed: rnd() * 1000 });
      t += wid + (rnd() < 0.25 ? 1 + rnd() * 2 : 0.2);
    }
  };
  side('x', az, 1, ax, bx);
  side('x', bz, -1, ax, bx);
  side('z', ax, 1, az + 15, bz - 15);
  side('z', bx, -1, az + 15, bz - 15);
  // postes e árvores na calçada
  const props: Prop[] = [];
  const cw = W / 2 + 0.6;
  for (let s = 12; s < P - W - 10; s += 26) {
    const sx = i * P + W / 2 + s, sz = j * P + W / 2 + s;
    props.push({ x: sx, z: j * P + cw, kind: 'pole', seed: s });
    props.push({ x: i * P + cw, z: sz, kind: 'pole', seed: s + 1 });
    if (hash(seed0 + s) < 0.6) props.push({ x: sx + 11, z: (j + 1) * P - cw - 0.6, kind: 'tree', seed: s + 2 });
    if (hash(seed0 + s * 3) < 0.6) props.push({ x: (i + 1) * P - cw - 0.6, z: sz + 11, kind: 'tree', seed: s + 3 });
  }
  const b: Block = { i, j, boxes, props };
  cache.set(key, b);
  return b;
}

/** Contorno da quadra (meio-fio com esquinas arredondadas), na altura y. */
function blockOutline(i: number, j: number, inset: number, y: number): V3[] {
  const { P, W, Rc } = CITY;
  const x0 = i * P + W / 2 + inset, x1 = (i + 1) * P - W / 2 - inset;
  const z0 = j * P + W / 2 + inset, z1 = (j + 1) * P - W / 2 - inset;
  const r = Math.max(0.2, Rc - inset);
  const pts: V3[] = [];
  const arc = (cx: number, cz: number, a0: number) => { for (let k = 0; k <= 5; k++) { const a = a0 + (k / 5) * (Math.PI / 2); pts.push([cx + r * Math.cos(a), y, cz + r * Math.sin(a)]); } };
  arc(x0 + r, z0 + r, Math.PI);
  arc(x1 - r, z0 + r, -Math.PI / 2);
  arc(x1 - r, z1 - r, 0);
  arc(x0 + r, z1 - r, Math.PI / 2);
  return pts;
}

// ------------------------------------------------------------- cena
export function drawCity(g: CanvasRenderingContext2D, v: CView, env: CityEnv) {
  const { P, W } = CITY;
  const night = env.night, wet = env.rain > 0;
  const fogCol: RGB = night ? [10, 13, 18] : wet ? [165, 174, 181] : [205, 216, 224];
  const fog = (d: number) => Math.max(0, Math.min(0.85, (d - 50) / 190));
  // céu
  const hy = v.horizon;
  const sky = g.createLinearGradient(0, v.oy, 0, hy);
  if (night) { sky.addColorStop(0, '#03050a'); sky.addColorStop(1, '#0c121b'); }
  else if (wet) { sky.addColorStop(0, '#7c8892'); sky.addColorStop(1, '#a9b3ba'); }
  else { sky.addColorStop(0, '#7fa7cc'); sky.addColorStop(1, '#d4e0e9'); }
  g.fillStyle = sky; g.fillRect(v.ox - 2, v.oy - 2, v.w + 4, Math.max(0, hy - v.oy) + 4);
  // chão (asfalto até o horizonte, com névoa)
  const asphalt: RGB = night ? [16, 19, 22] : wet ? [52, 57, 62] : [74, 78, 83];
  const ground = g.createLinearGradient(0, hy, 0, v.oy + v.h);
  ground.addColorStop(0, css(mix(asphalt, fogCol, 0.8))); ground.addColorStop(0.25, css(asphalt)); ground.addColorStop(1, css(asphalt, 0.92));
  g.fillStyle = ground; g.fillRect(v.ox - 2, hy, v.w + 4, v.oy + v.h - hy + 4);

  const [ex, ez] = v.eye;
  const R = v.far;
  const i0 = Math.floor((ex - R) / P), i1 = Math.floor((ex + R) / P);
  const j0 = Math.floor((ez - R) / P), j1 = Math.floor((ez + R) / P);
  const dist = (x: number, z: number) => Math.hypot(x - ex, z - ez);

  // faixas: central amarela tracejada e faixas de pedestres em cada esquina
  const yellow = night ? '#5a4a1c' : '#e0b43a', white = night ? '#5b5f62' : '#e9e7df';
  const line = (x0: number, z0: number, x1: number, z1: number, wdt: number, col: string) => {
    const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), nx = (-dz / L) * wdt / 2, nz = (dx / L) * wdt / 2;
    fill(g, v, [[x0 + nx, 0.01, z0 + nz], [x1 + nx, 0.01, z1 + nz], [x1 - nx, 0.01, z1 - nz], [x0 - nx, 0.01, z0 - nz]], col);
  };
  for (let i = i0; i <= i1 + 1; i++) {
    for (let j = j0; j <= j1 + 1; j++) {
      const cx = i * P, cz = j * P;
      if (dist(cx, cz) > (env.low ? 100 : 140)) continue;
      // tracejado da rua norte–sul (x = cx) entre este cruzamento e o próximo ao norte, e da leste–oeste
      for (let s = W / 2 + 6; s < P - W / 2 - 6; s += 8) {
        if (dist(cx, cz + s) < 120) line(cx, cz + s, cx, cz + s + 3.5, 0.12, yellow);
        if (dist(cx + s, cz) < 120) line(cx + s, cz, cx + s + 3.5, cz, 0.12, yellow);
      }
      if (dist(cx, cz) < (env.low ? 40 : 70)) {
        // faixas de pedestres nas quatro bocas do cruzamento
        for (const [ax, az] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
          const a = W / 2 + 0.8, b = a + 3;
          for (let t = -W / 2 + 0.35; t < W / 2 - 0.3; t += 1.0) {
            if (ax === 0) fill(g, v, [[cx + t, 0.01, cz + az * a], [cx + t + 0.5, 0.01, cz + az * a], [cx + t + 0.5, 0.01, cz + az * b], [cx + t, 0.01, cz + az * b]], white);
            else fill(g, v, [[cx + ax * a, 0.01, cz + t], [cx + ax * a, 0.01, cz + t + 0.5], [cx + ax * b, 0.01, cz + t + 0.5], [cx + ax * b, 0.01, cz + t]], white);
          }
        }
      }
    }
  }

  // guia: trajetória ideal (faixa verde do tamanho do carro) e o ponto de referência
  if (env.guides) drawGuide(g, v, env.guides, dist);

  // calçadas (meio-fio + calçada levantada + terreno)
  const curb: RGB = night ? [40, 42, 44] : [196, 196, 190];
  const walkC: RGB = night ? [28, 29, 31] : wet ? [128, 128, 124] : [170, 166, 156];
  const lot: RGB = night ? [18, 20, 19] : [118, 128, 102];
  const blocks: Block[] = [];
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const bcx = (i + 0.5) * P, bcz = (j + 0.5) * P;
    if (dist(bcx, bcz) > R + P * 0.7) continue;
    const d = Math.max(0, dist(bcx, bcz) - P * 0.5);
    const fg = fog(d);
    fill(g, v, blockOutline(i, j, 0, 0), css(mix(curb, fogCol, fg)));
    fill(g, v, blockOutline(i, j, 0.22, 0.15), css(mix(walkC, fogCol, fg)));
    fill(g, v, blockOutline(i, j, CITY.walk, 0.16), css(mix(lot, fogCol, fg)));
    blocks.push(block(i, j));
  }

  // prédios, postes e árvores, do mais longe para o mais perto
  type Item = { d: number; draw: () => void };
  const items: Item[] = [];
  for (const b of blocks) {
    for (const bx of b.boxes) {
      const mx = (bx.x0 + bx.x1) / 2, mz = (bx.z0 + bx.z1) / 2;
      const d = dist(mx, mz);
      if (d > R) continue;
      const c = v.toCam(mx, 0, mz);
      if (c[2] < -12) continue;
      items.push({ d, draw: () => drawBox(g, v, bx, env.low ? 999 : d, night, fogCol, fog(d), ex, ez) });
    }
    for (const pr of b.props) {
      const d = dist(pr.x, pr.z);
      if (d > (env.low ? 50 : 85)) continue;
      const c = v.toCam(pr.x, 0, pr.z);
      if (c[2] < v.near) continue;
      items.push({ d, draw: () => drawProp(g, v, pr, c, night, fogCol, fog(d)) });
    }
  }
  items.sort((a, b) => b.d - a.d);
  for (const it of items) it.draw();
}

function drawBox(g: CanvasRenderingContext2D, v: CView, b: Box, d: number, night: boolean, fogCol: RGB, fg: number, ex: number, ez: number) {
  const faces: { pts: V3[]; k: number; w: number; nx: number; nz: number }[] = [];
  const H = b.h;
  if (ex < b.x0) faces.push({ pts: [[b.x0, 0, b.z0], [b.x0, 0, b.z1], [b.x0, H, b.z1], [b.x0, H, b.z0]], k: 0.78, w: b.z1 - b.z0, nx: -1, nz: 0 });
  if (ex > b.x1) faces.push({ pts: [[b.x1, 0, b.z1], [b.x1, 0, b.z0], [b.x1, H, b.z0], [b.x1, H, b.z1]], k: 0.95, w: b.z1 - b.z0, nx: 1, nz: 0 });
  if (ez < b.z0) faces.push({ pts: [[b.x1, 0, b.z0], [b.x0, 0, b.z0], [b.x0, H, b.z0], [b.x1, H, b.z0]], k: 0.7, w: b.x1 - b.x0, nx: 0, nz: -1 });
  if (ez > b.z1) faces.push({ pts: [[b.x0, 0, b.z1], [b.x1, 0, b.z1], [b.x1, H, b.z1], [b.x0, H, b.z1]], k: 1.0, w: b.x1 - b.x0, nx: 0, nz: 1 });
  const base = night ? mix(b.col, [8, 10, 14], 0.86) : b.col;
  for (const f of faces) {
    if (!path(g, v, f.pts)) continue;
    g.fillStyle = css(mix(base.map((c) => c * f.k) as RGB, fogCol, fg)); g.fill();
    // janelas nas fachadas próximas
    if (b.win && d < 38 && f.w > 3) {
      const [a, , , dd] = f.pts;
      const ux = (f.pts[1][0] - a[0]) / f.w, uz = (f.pts[1][2] - a[2]) / f.w;
      const rows = Math.min(3, Math.max(1, Math.floor((H - 1.2) / 3)));
      const cols = Math.floor(f.w / 3);
      void dd;
      for (let r = 0; r < rows; r++) {
        const y0 = 1.1 + r * 3, y1 = y0 + 1.3;
        for (let q = 0; q < cols; q++) {
          const t0 = 0.9 + q * 3, t1 = t0 + 1.3;
          if (t1 > f.w - 0.5) break;
          const lit = night && hash(b.seed + r * 13 + q * 7) < 0.35;
          const col = night ? (lit ? '#f2c66d' : '#0b0e12') : css(mix([58, 74, 88], fogCol, fg));
          const off = 0.02;
          fill(g, v, [
            [a[0] + ux * t0 + f.nx * off, y0, a[2] + uz * t0 + f.nz * off], [a[0] + ux * t1 + f.nx * off, y0, a[2] + uz * t1 + f.nz * off],
            [a[0] + ux * t1 + f.nx * off, y1, a[2] + uz * t1 + f.nz * off], [a[0] + ux * t0 + f.nx * off, y1, a[2] + uz * t0 + f.nz * off],
          ], col);
        }
      }
    }
  }
  // beiral do telhado (linha escura no topo)
  if (faces.length && !night) {
    for (const f of faces) {
      const t = f.pts;
      const p0 = v.toCam(t[3][0], H, t[3][2]), p1 = v.toCam(t[2][0], H, t[2][2]);
      if (p0[2] < v.near || p1[2] < v.near) continue;
      const [x0, y0] = v.proj(p0), [x1, y1] = v.proj(p1);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = Math.max(0.5, 30 / Math.max(5, d)); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
  }
}

function drawProp(g: CanvasRenderingContext2D, v: CView, p: Prop, c: V3, night: boolean, fogCol: RGB, fg: number) {
  const [bx, by] = v.proj(c);
  if (p.kind === 'pole') {
    const top = v.toCam(p.x, 7.5, p.z);
    const [tx, ty] = v.proj(top);
    const wpx = Math.max(0.6, (0.16 * Math.abs(by - ty)) / 7.5);
    g.strokeStyle = night ? '#121416' : css(mix([88, 92, 96], fogCol, fg)); g.lineWidth = wpx; g.lineCap = 'butt';
    g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();
    if (night) {
      const r = Math.max(2, Math.abs(by - ty) * 0.5);
      const gl = g.createRadialGradient(tx, ty, 0, tx, ty, r);
      gl.addColorStop(0, 'rgba(255,214,150,0.9)'); gl.addColorStop(0.2, 'rgba(255,200,130,0.35)'); gl.addColorStop(1, 'rgba(255,200,130,0)');
      g.fillStyle = gl; g.fillRect(tx - r, ty - r, r * 2, r * 2);
    }
  } else {
    const trunkTop = v.proj(v.toCam(p.x, 2.4, p.z));
    const crown = v.toCam(p.x, 4.2, p.z);
    const [cx, cy] = v.proj(crown);
    const hpx = Math.abs(by - trunkTop[1]);
    g.strokeStyle = night ? '#0a0b0a' : css(mix([84, 66, 48], fogCol, fg)); g.lineWidth = Math.max(0.6, hpx * 0.12);
    g.beginPath(); g.moveTo(bx, by); g.lineTo(trunkTop[0], trunkTop[1]); g.stroke();
    const r = Math.max(1, (hpx / 2.4) * (1.9 + hash(p.seed) * 0.8));
    g.fillStyle = night ? '#070908' : css(mix([66 + hash(p.seed) * 20, 98, 58], fogCol, fg));
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    if (!night) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(cx - r * 0.25, cy - r * 0.3, r * 0.6, 0, Math.PI * 2); g.fill(); }
  }
}

function drawGuide(g: CanvasRenderingContext2D, v: CView, gd: GuideDraw, dist: (x: number, z: number) => number) {
  const pts = gd.path;
  const hw = CARGEO.halfW;
  const edge = (k: number, off: number) => {
    const a = pts[k], b = pts[Math.min(pts.length - 1, k + 1)];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    return [a[0] + (dz / L) * off, a[1] - (dx / L) * off] as [number, number];
  };
  for (let k = 0; k < pts.length - 2; k += 2) {
    if (dist(pts[k][0], pts[k][1]) > 60) continue;
    const a0 = edge(k, -hw), a1 = edge(k, hw), b0 = edge(k + 2, -hw), b1 = edge(k + 2, hw);
    fill(g, v, [[a0[0], 0.02, a0[1]], [b0[0], 0.02, b0[1]], [b1[0], 0.02, b1[1]], [a1[0], 0.02, a1[1]]], 'rgba(76,195,138,0.16)');
    const c0 = edge(k, -0.08), c1 = edge(k, 0.08), d0 = edge(k + 2, -0.08), d1 = edge(k + 2, 0.08);
    if (k % 4 === 0) fill(g, v, [[c0[0], 0.025, c0[1]], [d0[0], 0.025, d0[1]], [d1[0], 0.025, d1[1]], [c1[0], 0.025, c1[1]]], 'rgba(120,235,170,0.75)');
  }
  const m = gd.mark;
  if (m) {
    if (m.kind === 'cone') {
      const c = v.toCam(m.x, 0, m.z);
      if (c[2] > v.near) {
        const [bx, by] = v.proj(c);
        const [, ty] = v.proj(v.toCam(m.x, 0.7, m.z));
        const hpx = Math.max(2, by - ty), wpx = hpx * 0.45;
        g.fillStyle = '#ff7a1a';
        g.beginPath(); g.moveTo(bx, ty); g.lineTo(bx + wpx / 2, by); g.lineTo(bx - wpx / 2, by); g.closePath(); g.fill();
        g.fillStyle = '#ffffff'; g.fillRect(bx - wpx * 0.22, ty + hpx * 0.42, wpx * 0.44, hpx * 0.14);
      }
    } else {
      const ring: V3[] = [];
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; ring.push([m.x + Math.cos(a) * 0.9, 0.03, m.z + Math.sin(a) * 0.9]); }
      fill(g, v, ring, 'rgba(255,170,40,0.75)');
    }
  }
}
