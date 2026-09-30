/**
 * Qualidade gráfica do retrato, escolhida pelo jogador (nada muda sozinho):
 * - alta: resolução nativa da tela, a cada quadro que o aparelho entregar (60/120 fps);
 * - média: resolução útil da arte, 60 fps na fala e 30 quando só há respiração;
 * - baixa: resolução menor e 30 fps, para aparelhos mais fracos ou bateria baixa.
 */
export type Quality = 'low'|'medium'|'high'

export const QUALITIES:Quality[] = ['low','medium','high']
export const QUALITY_LABEL:Record<Quality,string> = { low:'Baixa', medium:'Média', high:'Alta' }

type Preset = {
  /** Resolução do canvas em relação ao recorte da imagem; null = a da tela (até 3x). */
  resCap:number|null
  /** Intervalo mínimo entre quadros quando só há respiração (ms); 0 = todos. */
  idleMs:number
  /** Idem durante fala e transições. */
  busyMs:number
}

export const PRESETS:Record<Quality,Preset> = {
  low:{ resCap:.9, idleMs:1000/30, busyMs:1000/30 },
  medium:{ resCap:1.25, idleMs:1000/30, busyMs:0 },
  high:{ resCap:null, idleMs:0, busyMs:0 }
}

const KEY = 'invesphone-quality'
const EVENT = 'invesphone-quality'

export function getQuality():Quality{
  try{
    const v = localStorage.getItem(KEY)
    if(v==='low'||v==='medium'||v==='high') return v
  }catch{ /* armazenamento indisponível */ }
  return 'high'
}

export function setQuality(q:Quality){
  try{ localStorage.setItem(KEY,q) }catch{ /* ignora */ }
  window.dispatchEvent(new CustomEvent(EVENT,{ detail:q }))
}

/** Avisa quando a qualidade muda (nesta ou em outra aba). Devolve a função que cancela. */
export function onQualityChange(fn:(q:Quality)=>void){
  const local = ()=>fn(getQuality())
  window.addEventListener(EVENT,local)
  window.addEventListener('storage',local)
  return ()=>{ window.removeEventListener(EVENT,local); window.removeEventListener('storage',local) }
}
