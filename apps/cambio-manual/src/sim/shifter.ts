// Geometria e mecânica da alavanca em "H":
//   1   3   5
//   |   |   |
//   +---N---+      (corredor do neutro)
//   |   |   |
//   2   4   R
// Coordenadas normalizadas: x ∈ [-1, 1] (colunas em -1, 0, 1), y ∈ [-1, 1] (−1 = cima).

import type { Gear, EngineEngageCheck } from './car';

export const COLUMNS = [-1, 0, 1] as const;
export const GATE: Record<string, Gear> = {
  '-1:-1': '1', '-1:1': '2', '0:-1': '3', '0:1': '4', '1:-1': '5', '1:1': 'R',
};
export const GEAR_POS: Record<Exclude<Gear, 'N'>, { x: number; y: number }> = {
  '1': { x: -1, y: -1 }, '2': { x: -1, y: 1 }, '3': { x: 0, y: -1 },
  '4': { x: 0, y: 1 }, '5': { x: 1, y: -1 }, R: { x: 1, y: 1 },
};

export function gearAt(col: number, dir: number): Gear {
  return GATE[`${col}:${dir < 0 ? -1 : 1}`];
}

const STEP = 0.035;
const COLUMN_CAPTURE = 0.16; // tolerância lateral para entrar em um corredor
const SYNCHRO_Y = 0.5; // onde o sincronizador trava sem embreagem
const REVERSE_LOCK_Y = 0.14; // onde a trava de ré segura
const ENGAGE_Y = 0.84; // a partir daqui a marcha "cai" no engate
const DETENT_HOLD = 0.6; // precisa puxar abaixo disso para desengatar

export type BlockReason = 'clutch' | 'moving' | 'reverseLock';

export interface ShifterHooks {
  canEngage(g: Gear): EngineEngageCheck;
  onGear(g: Gear): void;
  onBlocked(reason: BlockReason, gear: Gear): void;
}

export class Shifter {
  x = 0;
  y = 0;
  engaged: Gear = 'N';
  reverseUnlocked = false;
  dragging = false;
  blocked: BlockReason | null = null;
  private blockedNotified = false;
  // direção recente do dedo (suavizada) para distinguir arraste vertical de diagonal
  private mdx = 0;
  private mdy = 0;
  private lastTx = 0;
  private lastTy = 0;

  constructor(private hooks: ShifterHooks) {}

  get gear(): Gear { return this.engaged; }

  get column(): number {
    let best = 0, bd = 9;
    for (const c of COLUMNS) { const d = Math.abs(this.x - c); if (d < bd) { bd = d; best = c; } }
    return best;
  }

  /** Coloca a alavanca diretamente em uma marcha (usado ao iniciar lições). */
  place(g: Gear) {
    if (g === 'N') { this.x = 0; this.y = 0; }
    else { const p = GEAR_POS[g]; this.x = p.x; this.y = p.y; }
    this.engaged = g;
  }

  beginDrag() {
    this.dragging = true; this.blocked = null; this.blockedNotified = false;
    this.mdx = this.mdy = 0; this.lastTx = this.x; this.lastTy = this.y;
  }

  endDrag() {
    this.dragging = false;
    this.reverseUnlocked = false;
    this.blocked = null;
  }

  /** Move a alavanca em direção ao alvo pelo caminho físico (sem atravessar paredes). */
  moveToward(tx: number, ty: number) {
    tx = Math.max(-1.15, Math.min(1.15, tx));
    ty = Math.max(-1.2, Math.min(1.2, ty));
    const fdx = tx - this.lastTx, fdy = ty - this.lastTy;
    if (Math.hypot(fdx, fdy) > 1e-4) {
      this.mdx = this.mdx * 0.25 + fdx * 0.75;
      this.mdy = this.mdy * 0.25 + fdy * 0.75;
    }
    this.lastTx = tx; this.lastTy = ty;
    let guard = 0;
    while (guard++ < 120) {
      const before = this.x + this.y * 10;
      this.substep(tx, ty);
      const dist = Math.hypot(tx - this.x, ty - this.y);
      if (dist < 0.002 || Math.abs(before - (this.x + this.y * 10)) < 1e-6) break;
    }
  }

  private substep(tx: number, ty: number) {
    const onRail = Math.abs(this.y) < 1e-6;
    if (onRail) {
      this.y = 0;
      const col = this.column;
      const wantX = tx - this.x;
      const wantY = ty - this.y;
      const nearCol = Math.abs(this.x - col) < COLUMN_CAPTURE;
      // Só entra num corredor se o dedo aponta para ele e está indo na vertical (ou já
      // passou bem do neutro). Num arraste diagonal (ex.: 2ª → 3ª) a alavanca primeiro
      // corre pelo neutro até o corredor certo, como a mola do plano 3-4 faz na mão.
      const aimsHere = Math.abs(tx - col) < 0.2;
      const vertical = Math.abs(this.mdx) < 0.6 * Math.abs(this.mdy);
      const committed = Math.abs(wantY) > 0.25;
      if (nearCol && aimsHere && Math.abs(wantY) > 0.03 && (vertical || committed)) {
        this.x = col; // alinha no corredor
        this.moveY(col, clamp(wantY, STEP));
      } else {
        this.x = Math.max(-1, Math.min(1, this.x + clamp(wantX, STEP)));
      }
      return;
    }
    // Dentro de um corredor: só anda na vertical.
    const col = this.column;
    this.x = col;
    // Detent: engatado, precisa puxar com vontade para sair.
    if (this.engaged !== 'N' && Math.sign(ty) === Math.sign(this.y) && Math.abs(ty) > DETENT_HOLD) return;
    this.moveY(col, clamp(ty - this.y, STEP));
  }

  private moveY(col: number, dy: number) {
    let ny = this.y + dy;
    if (this.y !== 0 && Math.sign(ny) !== Math.sign(this.y)) ny = 0; // para no neutro
    ny = Math.max(-1, Math.min(1, ny));
    const dir = ny < 0 ? -1 : 1;
    if (ny !== 0) {
      const g = gearAt(col, dir);
      if (this.engaged !== g) {
        // Trava de ré
        if (g === 'R' && !this.reverseUnlocked && Math.abs(ny) > REVERSE_LOCK_Y) {
          ny = dir * REVERSE_LOCK_Y;
          this.block('reverseLock', g);
        }
        // Sincronizador
        if (Math.abs(ny) > SYNCHRO_Y) {
          const r = this.hooks.canEngage(g);
          if (!r.ok) { ny = dir * SYNCHRO_Y; this.block(r.reason ?? 'clutch', g); }
        }
      }
    }
    this.y = ny;
    // Engate / desengate
    if (Math.abs(this.y) >= ENGAGE_Y) {
      const g = gearAt(col, this.y);
      if (this.engaged !== g) {
        this.y = Math.sign(this.y); // a marcha "cai" no engate
        this.engaged = g; this.blocked = null; this.hooks.onGear(g);
      } else if (dy * this.y > 0) this.y = Math.sign(this.y);
    } else if (this.engaged !== 'N' && Math.abs(this.y) < ENGAGE_Y - 0.12) {
      this.engaged = 'N';
      this.hooks.onGear('N');
    }
  }

  private block(reason: BlockReason, g: Gear) {
    this.blocked = reason;
    if (!this.blockedNotified) {
      this.blockedNotified = true;
      this.hooks.onBlocked(reason, g);
    }
  }

  /** Mola de retorno quando o dedo sai: volta ao neutro e ao plano 3-4. */
  spring(dt: number) {
    if (this.dragging) return;
    const k = 1 - Math.exp(-dt / 0.06);
    if (this.engaged !== 'N') {
      this.y += (Math.sign(this.y) - this.y) * k;
      return;
    }
    if (Math.abs(this.y) > 1e-4) {
      this.y += (0 - this.y) * k;
      if (Math.abs(this.y) < 0.01) this.y = 0;
    } else {
      this.y = 0;
      this.x += (0 - this.x) * k * 0.7;
      if (Math.abs(this.x) < 0.005) this.x = 0;
    }
  }
}

function clamp(v: number, m: number) { return Math.max(-m, Math.min(m, v)); }
