// Cidade de treino: grade de quarteirões com ruas de mão dupla (mão inglesa não; aqui é a mão
// brasileira, pela direita) e o carro andando nela com posição e direção reais.
//
// Coordenadas do mundo (metros): x para o leste, z para o norte. Direção h em radianos:
// 0 = norte, π/2 = leste (sentido horário). Ruas no eixo x = k·P (norte–sul) e z = m·P (leste–oeste).

export const CITY = {
  P: 90, // distância entre ruas (centro a centro)
  W: 7, // largura da rua (duas faixas de 3,5 m)
  lane: 3.5,
  Rc: 4.5, // raio do meio-fio nas esquinas
  walk: 3.2, // largura da calçada
};

/** Medidas de um hatch compacto (referência: eixo traseiro, no centro). */
export const CARGEO = {
  wb: 2.53, // entre-eixos
  halfTrack: 0.74,
  halfW: 0.86,
  front: 3.33, // para-choque dianteiro à frente do eixo traseiro
  rear: -0.61,
  eyeFwd: 1.3, // olho do motorista à frente do eixo traseiro
  eyeSide: -0.37, // à esquerda do centro
  eyeH: 1.15,
  mirrorFwd: 2.09, // linha dos retrovisores externos
};
/** Volante → rodas: 15:1 (540° no volante = 36° nas rodas, cerca de 3 voltas de batente a batente). */
export const STEER_RATIO = 15;
export const MAX_WHEEL_DEG = 36;

export interface Pose { x: number; z: number; h: number }
export const fwdV = (h: number): [number, number] => [Math.sin(h), Math.cos(h)];
export const rightV = (h: number): [number, number] => [Math.cos(h), -Math.sin(h)];
/** Ponto do carro (f metros à frente do eixo traseiro, r metros à direita) no mundo. */
export function carPoint(p: Pose, f: number, r: number): [number, number] {
  return [p.x + Math.sin(p.h) * f + Math.cos(p.h) * r, p.z + Math.cos(p.h) * f - Math.sin(p.h) * r];
}
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** O ponto está no asfalto (rua ou cruzamento, respeitando o meio-fio arredondado das esquinas)? */
export function onRoad(x: number, z: number) {
  const { P, W, Rc } = CITY;
  const ax = Math.abs(x - Math.round(x / P) * P), az = Math.abs(z - Math.round(z / P) * P);
  const hw = W / 2;
  if (ax <= hw || az <= hw) return true;
  if (ax <= hw + Rc && az <= hw + Rc) return Math.hypot(ax - (hw + Rc), az - (hw + Rc)) > Rc;
  return false;
}

export function wheels(p: Pose): [number, number][] {
  const { wb, halfTrack } = CARGEO;
  return [carPoint(p, wb, -halfTrack), carPoint(p, wb, halfTrack), carPoint(p, 0, -halfTrack), carPoint(p, 0, halfTrack)];
}
/** Cantos da carroceria: dianteiro esq./dir., traseiro esq./dir. */
export function corners(p: Pose): [number, number][] {
  const { front, rear, halfW } = CARGEO;
  return [carPoint(p, front, -halfW), carPoint(p, front, halfW), carPoint(p, rear, -halfW), carPoint(p, rear, halfW)];
}

/** Modelo de bicicleta pelo eixo traseiro: o volante (graus, + = direita) vira as rodas da frente. */
export function stepPose(p: Pose, v: number, steerDeg: number, dt: number) {
  const d = Math.max(-MAX_WHEEL_DEG, Math.min(MAX_WHEEL_DEG, steerDeg / STEER_RATIO)) * (Math.PI / 180);
  p.h = wrapAngle(p.h + (v / CARGEO.wb) * Math.tan(d) * dt);
  p.x += v * Math.sin(p.h) * dt;
  p.z += v * Math.cos(p.h) * dt;
}
/** Raio da curva (eixo traseiro) para um ângulo de volante, e o volante para um raio. */
export const radiusFor = (steerDeg: number) => CARGEO.wb / Math.tan((Math.abs(steerDeg) / STEER_RATIO) * (Math.PI / 180));
export const steerFor = (radius: number) => (Math.atan(CARGEO.wb / radius) * 180) / Math.PI * STEER_RATIO;

// ------------------------------------------------------------- manobras em um cruzamento
export type Turn = 'R' | 'L' | 'S';
/** Cruzamento (centro cx, cz), direção de chegada H e o que fazer nele. */
export interface Maneuver { cx: number; cz: number; H: number; turn: Turn }

/**
 * Geometria ideal no referencial local (chegando para o norte, cruzamento na origem):
 * reta em x = x0 até z = start, arco de raio R, reta na rua nova.
 *  - direita: encostado no meio-fio, arco concêntrico à esquina (≈ 1 volta no volante);
 *  - esquerda: perto do meio, avança até a frente entrar no cruzamento e faz um arco aberto
 *    que termina na faixa da direita da rua nova, sem cortar a curva.
 */
export const IDEAL = {
  R: { x0: 2.0, R: 6.0, start: -8.0 },
  L: { x0: 1.3, R: 7.5, start: -5.75 },
  S: { x0: 1.75, R: 0, start: 0 },
};

export function toLocal(m: Maneuver, x: number, z: number): [number, number] {
  const dx = x - m.cx, dz = z - m.cz, c = Math.cos(m.H), s = Math.sin(m.H);
  return [dx * c - dz * s, dx * s + dz * c];
}
export function fromLocal(m: Maneuver, lx: number, lz: number): [number, number] {
  const c = Math.cos(m.H), s = Math.sin(m.H);
  return [m.cx + lx * c + lz * s, m.cz - lx * s + lz * c];
}
export const exitHeading = (m: Maneuver) => wrapAngle(m.H + (m.turn === 'R' ? Math.PI / 2 : m.turn === 'L' ? -Math.PI / 2 : 0));

/** Trajetória ideal do eixo traseiro (local), de `from` metros antes até `after` metros depois. */
export function idealLocal(turn: Turn, from = -70, after = 40, step = 0.5): [number, number][] {
  const g = IDEAL[turn];
  const out: [number, number][] = [];
  if (turn === 'S') { for (let z = from; z <= after; z += step) out.push([g.x0, z]); return out; }
  for (let z = from; z < g.start; z += step) out.push([g.x0, z]);
  const s = turn === 'R' ? 1 : -1;
  const cx = g.x0 + s * g.R, cz = g.start;
  const n = Math.ceil((Math.PI / 2) * g.R / step);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    out.push([cx - s * g.R * Math.cos(a), cz + g.R * Math.sin(a)]);
  }
  const ez = cz + g.R; // reta de saída (z constante), andando para +x (direita) ou −x (esquerda)
  for (let d = step; d <= after; d += step) out.push([cx + s * d, ez]);
  return out;
}
export function idealWorld(m: Maneuver, from = -70, after = 40): [number, number][] {
  return idealLocal(m.turn, from, after).map(([lx, lz]) => fromLocal(m, lx, lz));
}

/** Persegue a trajetória: ângulo de volante para mirar um ponto `look` metros à frente. */
export function pursuit(p: Pose, path: [number, number][], look: number) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = (path[i][0] - p.x) ** 2 + (path[i][1] - p.z) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  let acc = 0, j = best;
  while (j < path.length - 1 && acc < look) { acc += Math.hypot(path[j + 1][0] - path[j][0], path[j + 1][1] - path[j][1]); j++; }
  const [tx, tz] = path[j];
  const dx = tx - p.x, dz = tz - p.z;
  const alpha = wrapAngle(Math.atan2(dx, dz) - p.h);
  const L = Math.max(0.5, Math.hypot(dx, dz));
  const delta = Math.atan((2 * CARGEO.wb * Math.sin(alpha)) / L);
  return { steer: Math.max(-540, Math.min(540, (delta * 180) / Math.PI * STEER_RATIO)), offset: Math.sqrt(bd), index: best };
}

/** O carro andando na cidade. */
export class CityDrive {
  active = false;
  pose: Pose = { x: 2, z: -70, h: 0 };
  /** Ângulo de volante sugerido pelo guia (graus) ou null. */
  steerTarget: number | null = null;
  /** Desenho de ajuda no chão: trajetória ideal e ponto de referência. */
  guide: { path: [number, number][]; mark?: { x: number; z: number; kind: 'cone' | 'spot' } | null } | null = null;
  private curbCool = 0;

  place(p: Pose) { this.pose = { ...p }; }

  /** Anda um quadro. Devolve se bateu no meio-fio neste quadro. */
  update(dt: number, v: number, steerDeg: number) {
    if (!this.active) return { curb: false };
    this.curbCool = Math.max(0, this.curbCool - dt);
    const prev = { ...this.pose };
    stepPose(this.pose, v, steerDeg, dt);
    const off = wheels(this.pose).some(([x, z]) => !onRoad(x, z));
    if (off) {
      this.pose = prev;
      const hit = this.curbCool <= 0;
      this.curbCool = 1.2;
      return { curb: hit, blocked: true };
    }
    return { curb: false };
  }
}

// acesso para testes automatizados
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).__city = { pursuit, idealWorld, toLocal, onRoad };
