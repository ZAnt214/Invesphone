// Arte fotorrealista do cockpit (camadas PNG entregues pelo ChatGPT em public/cambio/art/).
// Se o pacote não existir ou falhar, o cockpit continua com o desenho vetorial.
//
// Contrato (ver creative-requests/inbox/2026-10-28-cambio-cockpit-fotorrealista.md):
// - escala: 4 px por unidade da cena (a cena tem 420 unidades de altura)
// - painel-base.png: 4800×1680 (1200×420 unidades), alinhado à esquerda com o lado do motorista
// - peças móveis com "pivot" em px da própria imagem

export interface ArtLayer { file: string; w: number; h: number; pivot?: [number, number] }
export type ArtId =
  | 'base' | 'wheel' | 'stalkL' | 'stalkR' | 'key' | 'knob' | 'gearKnob'
  | 'hazardOff' | 'hazardOn' | 'handbrakeDown' | 'handbrakeUp'
  | 'pedalClutch' | 'pedalBrake' | 'pedalGas';
export interface ArtManifest { version: number; scale?: number; layers: Partial<Record<ArtId, ArtLayer>> }

export const ART_DIR = '/cambio/art/';
export const ART_SCALE = 4; // px por unidade

interface State { ready: boolean; m: ArtManifest | null; url: Partial<Record<ArtId, string>> }
const state: State = { ready: false, m: null, url: {} };
const subs = new Set<() => void>();
let started = false;

function loadImage(src: string) {
  return new Promise<void>((res, rej) => {
    const im = new Image();
    im.onload = () => (im.decode ? im.decode().then(() => res(), () => res()) : res());
    im.onerror = () => rej(new Error('falhou ' + src));
    im.src = src;
  });
}

/** Carrega o pacote uma vez. Só liga o modo foto quando a base e o volante estão prontos. */
export function loadArt(dir = ART_DIR) {
  if (started) return;
  started = true;
  // só no site (página /cambio por http/https); como arquivo local ou dentro de outro host, fica no vetorial
  if (!/^https?:$/.test(location.protocol) || !location.pathname.startsWith('/cambio')) return;
  (async () => {
    try {
      const r = await fetch(dir + 'manifest.json', { cache: 'no-cache' });
      if (!r.ok) return;
      const m = (await r.json()) as ArtManifest;
      if (!m?.layers?.base || !m.layers.wheel) return;
      const url: State['url'] = {};
      await Promise.all(Object.entries(m.layers).map(async ([id, l]) => {
        if (!l?.file) return;
        const u = dir + l.file;
        try { await loadImage(u); url[id as ArtId] = u; } catch { /* camada opcional faltando */ }
      }));
      if (!url.base || !url.wheel) return;
      state.m = m; state.url = url; state.ready = true;
      subs.forEach((f) => f());
    } catch { /* sem pacote: fica no vetorial */ }
  })();
}

export const art = {
  get ready() { return state.ready; },
  has(id: ArtId) { return state.ready && !!state.url[id]; },
  url(id: ArtId) { return state.url[id] ?? ''; },
  layer(id: ArtId) { return state.m?.layers[id]; },
  subscribe(fn: () => void) { subs.add(fn); return () => { subs.delete(fn); }; },
};

/** Posição de uma camada em unidades da cena, dado onde o pivô deve ficar. */
export function placeAt(id: ArtId, px: number, py: number) {
  const l = art.layer(id)!;
  const s = 1 / ART_SCALE;
  const pv = l.pivot ?? [l.w / 2, l.h / 2];
  return { x: px - pv[0] * s, y: py - pv[1] * s, w: l.w * s, h: l.h * s };
}
