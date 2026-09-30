/**
 * Boca em sincronia com o texto: cada letra vira uma abertura.
 * Vogais abrem, b/m/p fecham, pontuação é pausa.
 */
export type MouthKey = { t:number; o:number }

const VOWELS:Record<string,number> = {
  a:1, á:1, à:1, â:.92, ã:.9, e:.72, é:.85, ê:.7, i:.42, í:.42, o:.85, ó:.95, ô:.78, õ:.78, u:.52, ú:.52
}
const CLOSED = 'bmp'

function weightOf(ch:string){
  if(ch===' ') return .5
  if(ch==='…') return 6
  if(/[.!?]/.test(ch)) return 5
  if(/[,;:]/.test(ch)) return 3
  if(VOWELS[ch]!==undefined) return 1.3
  return .8
}

/** Linha do tempo de abertura (0 a 1) para um texto falado em `duration` ms. */
export function mouthTrack(text:string, duration:number):MouthKey[]{
  const chars = [...text.toLowerCase()]
  const total = chars.reduce((s,c)=>s+weightOf(c),0) || 1
  const unit = duration/total
  const keys:MouthKey[] = [{t:0,o:0}]
  let t = 0
  for(const c of chars){
    const w = weightOf(c)*unit
    const mid = t + w/2
    let o:number
    if(VOWELS[c]!==undefined) o = VOWELS[c]*(.82+Math.random()*.18)
    else if(CLOSED.includes(c) || /[.!?,;:…]/.test(c) || c===' ') o = c===' ' ? .1 : 0
    else o = .22+Math.random()*.1
    keys.push({t:mid,o})
    t += w
  }
  keys.push({t:duration,o:0})
  return keys
}

/** Abertura na posição `elapsed` (ms), interpolando entre as marcas. */
export function sampleMouth(keys:MouthKey[], elapsed:number){
  if(elapsed<=0) return 0
  const last = keys[keys.length-1]
  if(elapsed>=last.t) return 0
  let i = 1
  while(i<keys.length && keys[i].t<elapsed) i++
  const a = keys[i-1], b = keys[i]
  const k = (elapsed-a.t)/Math.max(1,b.t-a.t)
  return a.o + (b.o-a.o)*k
}
