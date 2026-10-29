// Retrovisores: dois externos elétricos (seletor E/D + setas na porta) e o interno, ajustado
// com a mão. Cada espelho é uma câmera virtual olhando para trás; o ângulo (yaw/pitch) decide
// o que aparece nele. A mesma geometria serve para desenhar e para avaliar o ajuste.
//
// Coordenadas do carro (metros): x para a direita, y para cima, z para trás (0 = linha dos
// retrovisores externos). O carro fica no centro da faixa da direita.

export type MirrorId = 'L' | 'R' | 'I';
export interface Aim { yaw: number; pitch: number } // rad; yaw > 0 = aponta para a direita, pitch > 0 = para cima

export const CAR = { halfW: 0.87, rear: 2.7 };
/** Rua de mão dupla: faixa da direita (a nossa) com 3,5 m; faixa contrária à esquerda. */
export const ROAD = { centerLine: -1.75, rightEdge: 1.75, leftEdge: -5.25, shoulder: 2.9 };

export interface MirrorGeo {
  cam: [number, number, number]; // olho refletido (câmera virtual)
  fovH: number; fovV: number; // campo de visão do espelho (rad)
  yaw: [number, number]; pitch: [number, number]; // curso do motor / da articulação
}
export const GEO: Record<MirrorId, MirrorGeo> = {
  // esquerdo: plano, perto do olho
  L: { cam: [-1.38, 1.12, -0.55], fovH: 0.3, fovV: 0.2, yaw: [-0.36, 0.26], pitch: [-0.24, 0.22] },
  // direito: mais longe e levemente convexo (campo maior)
  R: { cam: [1.62, 1.12, -0.9], fovH: 0.42, fovV: 0.27, yaw: [-0.3, 0.36], pitch: [-0.3, 0.2] },
  // interno: largo e baixo, enquadra o vidro traseiro
  I: { cam: [0, 1.15, -0.6], fovH: 0.5, fovV: 0.16, yaw: [-0.34, 0.34], pitch: [-0.22, 0.22] },
};
/** Vidro traseiro visto de dentro (cantos de cima e de baixo). */
export const REAR_GLASS = { topY: 1.27, botY: 0.96, topZ: 2.05, botZ: 2.4, topHalf: 0.5, botHalf: 0.6 };

/** Projeção de um ponto do mundo no espelho: u, v de 0 a 1 (0,0 = canto de cima à esquerda). */
export function project(id: MirrorId, a: Aim, x: number, y: number, z: number): [number, number] {
  const g = GEO[id];
  const dx = x - g.cam[0], dy = y - g.cam[1], dz = Math.max(0.05, z - g.cam[2]);
  const al = Math.atan2(dx, dz);
  const be = Math.atan2(dy, Math.hypot(dx, dz));
  return [0.5 + (al - a.yaw) / g.fovH, 0.5 - (be - a.pitch) / g.fovV];
}

/** Quanto da largura do espelho externo a lateral do próprio carro ocupa (0..1). */
export function bodyShare(id: 'L' | 'R', a: Aim) {
  const side = id === 'L' ? -1 : 1;
  const [u] = project(id, a, side * CAR.halfW, 0.9, CAR.rear);
  return Math.max(0, Math.min(1, id === 'L' ? 1 - u : u));
}
/** Altura do horizonte no espelho (0 = em cima, 1 = embaixo). */
export function horizonV(id: MirrorId, a: Aim) { return 0.5 + a.pitch / GEO[id].fovV; }
/** Centro do vidro traseiro no espelho interno. */
export function rearGlassCenter(a: Aim): [number, number] {
  const y = (REAR_GLASS.topY + REAR_GLASS.botY) / 2, z = (REAR_GLASS.topZ + REAR_GLASS.botZ) / 2;
  return project('I', a, 0, y, z);
}

// faixas consideradas certas (como se ensina na autoescola)
export const TARGET = {
  L: { share: [0.12, 0.32], horizon: [0.32, 0.62] },
  R: { share: [0.1, 0.3], horizon: [0.24, 0.56] }, // o direito costuma ficar um pouco mais baixo (meio-fio)
  I: { du: 0.08, dv: 0.15 },
} as const;

export interface MirrorStatus { ok: boolean; hint: string }
export function mirrorStatus(id: MirrorId, a: Aim): MirrorStatus {
  if (id === 'I') {
    const [u, v] = rearGlassCenter(a);
    const du = u - 0.5, dv = v - 0.5;
    if (Math.abs(du) > TARGET.I.du) return { ok: false, hint: du > 0 ? 'Vire o interno: o vidro traseiro está para a direita. Arraste o espelho para a esquerda.' : 'Vire o interno: o vidro traseiro está para a esquerda. Arraste o espelho para a direita.' };
    if (Math.abs(dv) > TARGET.I.dv) return { ok: false, hint: dv > 0 ? 'O vidro traseiro está baixo no espelho: arraste o interno para cima.' : 'O vidro traseiro está alto no espelho: arraste o interno para baixo.' };
    return { ok: true, hint: 'Interno ajustado: o vidro traseiro inteiro, centralizado.' };
  }
  const t = TARGET[id];
  const s = bodyShare(id, a), h = horizonV(id, a);
  const name = id === 'L' ? 'esquerdo' : 'direito';
  const out = id === 'L' ? '◀' : '▶', inn = id === 'L' ? '▶' : '◀';
  if (s > t.share[1]) return { ok: false, hint: `Gire o ${name} para fora (${out}): a lateral do carro ocupa espelho demais.` };
  if (s < t.share[0]) return { ok: false, hint: `Gire o ${name} para dentro (${inn}) até aparecer uma faixa da lateral do carro.` };
  if (h < t.horizon[0]) return { ok: false, hint: `Suba o ${name} (▲): aparece chão demais, o horizonte deve ficar ${id === 'L' ? 'perto do meio' : 'um pouco acima do meio'}.` };
  if (h > t.horizon[1]) return { ok: false, hint: `Desça o ${name} (▼): aparece céu demais${id === 'R' ? ', o meio-fio precisa aparecer' : ''}.` };
  return { ok: true, hint: id === 'L' ? 'Esquerdo ajustado: um pouco da lateral do carro e o horizonte no meio.' : 'Direito ajustado: um pouco da lateral, o meio-fio e a faixa ao lado.' };
}

/** Ajuste de fábrica "bem feito" (para referência e para os testes). */
export function goodAim(id: MirrorId): Aim {
  if (id === 'I') {
    const g = GEO.I;
    const y = (REAR_GLASS.topY + REAR_GLASS.botY) / 2, z = (REAR_GLASS.topZ + REAR_GLASS.botZ) / 2;
    const dz = z - g.cam[2];
    return { yaw: Math.atan2(-g.cam[0], dz), pitch: Math.atan2(y - g.cam[1], Math.hypot(g.cam[0], dz)) };
  }
  const side = id === 'L' ? -1 : 1, g = GEO[id];
  const al = Math.atan2(side * CAR.halfW - g.cam[0], CAR.rear - g.cam[2]);
  const u = id === 'L' ? 1 - 0.22 : 0.2;
  const yaw = al - (u - 0.5) * g.fovH;
  const hv = id === 'L' ? 0.46 : 0.38;
  return { yaw, pitch: (hv - 0.5) * g.fovV };
}

const KEY = 'cambio-manual.mirrors.v1';
const RATE = 0.11; // rad/s do motor do retrovisor elétrico (lento como no carro)

export class Mirrors {
  aim: Record<MirrorId, Aim> = { L: goodAim('L'), R: goodAim('R'), I: goodAim('I') };
  /** Seletor da porta: E, D ou no meio (desligado). */
  select: 'L' | 'R' | null = null;
  /** Direção das setas enquanto o dedo segura (−1, 0, 1). */
  drive = { x: 0, y: 0 };
  /** Alavanca dia/noite do interno (antiofuscamento). */
  nightTab = false;
  /** Carro que vem atrás, na nossa faixa (m de distância da traseira). */
  follow = { gap: 250 }; // começa sem ninguém atrás (carro estacionado)
  drill = { active: false, start: 0, best: 0 as number };
  private saveT: ReturnType<typeof setTimeout> | null = null;

  constructor() { this.load(); }

  clamp(id: MirrorId) {
    const g = GEO[id], a = this.aim[id];
    a.yaw = Math.max(g.yaw[0], Math.min(g.yaw[1], a.yaw));
    a.pitch = Math.max(g.pitch[0], Math.min(g.pitch[1], a.pitch));
  }
  status(id: MirrorId) { return mirrorStatus(id, this.aim[id]); }
  allOk() { return (['L', 'R', 'I'] as MirrorId[]).every((m) => this.status(m).ok); }

  /** Arraste da mão no interno (rad). */
  nudge(id: MirrorId, dyaw: number, dpitch: number) {
    this.aim[id].yaw += dyaw; this.aim[id].pitch += dpitch;
    this.clamp(id); this.persist();
  }

  /**
   * Um quadro: motor dos externos e o carro de trás.
   * Devolve se o motor está girando (para o som) e se o treino acabou neste quadro.
   */
  update(dt: number, powered: boolean, v: number, now: number) {
    let moving = false;
    if (powered && this.select && (this.drive.x || this.drive.y)) {
      const a = this.aim[this.select];
      const before = a.yaw + a.pitch * 7;
      a.yaw += this.drive.x * RATE * dt;
      a.pitch += this.drive.y * RATE * dt;
      this.clamp(this.select);
      moving = Math.abs(a.yaw + a.pitch * 7 - before) > 1e-6; // no fim do curso o motor para
      if (moving) this.persist();
    }
    // quem vem atrás mantém distância proporcional à velocidade e encosta quando paramos
    // (parado sem ninguém por perto, ninguém aparece; andando, alguém chega por trás aos poucos)
    const f = this.follow;
    if (v < -0.05) f.gap = Math.max(0.7, f.gap + v * dt);
    else if (!(v < 0.5 && f.gap > 30)) {
      const target = v < 0.5 ? 3.2 : 4 + v * 1.15;
      f.gap += (target - f.gap) * (1 - Math.exp(-dt / (f.gap > target ? 5 : 3.5)));
    }
    let drillDone = 0;
    if (this.drill.active && this.allOk() && !this.drive.x && !this.drive.y) {
      this.drill.active = false;
      drillDone = now - this.drill.start;
      if (!this.drill.best || drillDone < this.drill.best) this.drill.best = drillDone;
      this.persist();
    }
    return { moving, drillDone };
  }

  /** Treino: desajusta os três (como quando outra pessoa dirigiu o carro). */
  startDrill(now: number, rnd = Math.random) {
    for (const id of ['L', 'R', 'I'] as MirrorId[]) {
      const g = GEO[id];
      for (let i = 0; i < 40; i++) {
        const t = rnd();
        // escolhe um lado de cada eixo e passa bem da faixa certa
        const a = this.aim[id];
        const good = goodAim(id);
        const sy = rnd() < 0.5 ? -1 : 1, sp = rnd() < 0.5 ? -1 : 1;
        a.yaw = good.yaw + sy * (0.4 + 0.6 * t) * (sy < 0 ? good.yaw - g.yaw[0] : g.yaw[1] - good.yaw);
        a.pitch = good.pitch + sp * (0.2 + 0.7 * rnd()) * (sp < 0 ? good.pitch - g.pitch[0] : g.pitch[1] - good.pitch);
        this.clamp(id);
        if (!this.status(id).ok) break;
      }
    }
    this.select = null;
    this.drill.active = true;
    this.drill.start = now;
    this.persist();
  }
  stopDrill() { this.drill.active = false; }

  private load() {
    try {
      const r = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
      if (!r) return;
      const d = JSON.parse(r) as { aim?: Record<MirrorId, Aim>; nightTab?: boolean; best?: number };
      for (const id of ['L', 'R', 'I'] as MirrorId[]) {
        const a = d.aim?.[id];
        if (a && Number.isFinite(a.yaw) && Number.isFinite(a.pitch)) { this.aim[id] = { yaw: a.yaw, pitch: a.pitch }; this.clamp(id); }
      }
      this.nightTab = !!d.nightTab;
      this.drill.best = d.best ?? 0;
    } catch { /* sem armazenamento */ }
  }
  persist() {
    if (this.saveT || typeof localStorage === 'undefined') return;
    this.saveT = setTimeout(() => {
      this.saveT = null;
      try { localStorage.setItem(KEY, JSON.stringify({ aim: this.aim, nightTab: this.nightTab, best: this.drill.best })); } catch { /* ignore */ }
    }, 300);
  }
}

// acesso para testes automatizados
if (typeof window !== 'undefined') (window as unknown as Record<string, unknown>).__mirrorsGeo = { rearGlassCenter, goodAim, bodyShare, horizonV };
