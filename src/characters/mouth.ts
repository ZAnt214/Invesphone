import type { Viseme } from './types'

/**
 * Boca em sincronia com o texto: cada letra vira uma forma de boca.
 * Vogais abrem (A, E, I, O, U), b/m/p fecham (M), as outras consoantes entreabrem, pontuação é pausa.
 */
export type MouthKey = {
  t:number
  /** forma de boca, ou null na pausa */
  v:Viseme|null
  /** intensidade da forma, de 0 a 1 */
  a:number
}

const VOWEL:Record<string,[Viseme,number]> = {
  a:['A',1], á:['A',1], à:['A',1], â:['A',.92], ã:['A',.9],
  e:['E',.9], é:['E',1], ê:['E',.85],
  i:['I',.95], í:['I',.95],
  o:['O',1], ó:['O',1], ô:['O',.95], õ:['O',.9],
  u:['U',1], ú:['U',1]
}

function shapeOf(ch:string):[Viseme|null,number]{
  if(VOWEL[ch]) return VOWEL[ch]
  if('bmp'.includes(ch)) return ['M',1]
  if('fv'.includes(ch)) return ['I',.7]
  if(/[a-zç]/.test(ch)) return ['E',.5]
  return [null,0]
}

function weightOf(ch:string){
  if(ch===' ') return .5
  if(ch==='…') return 6
  if(/[.!?]/.test(ch)) return 5
  if(/[,;:]/.test(ch)) return 3
  if(VOWEL[ch]) return 1.3
  return .8
}

/** Linha do tempo de formas de boca para um texto falado em `duration` ms. */
export function mouthTrack(text:string, duration:number):MouthKey[]{
  const chars = [...text.toLowerCase()]
  const total = chars.reduce((s,c)=>s+weightOf(c),0) || 1
  const unit = duration/total
  const keys:MouthKey[] = [{t:0,v:null,a:0}]
  let t = 0
  for(const c of chars){
    const w = weightOf(c)*unit
    const [v,a] = shapeOf(c)
    keys.push({t:t+w/2,v,a:v ? a*(.85+Math.random()*.15) : 0})
    t += w
  }
  keys.push({t:duration,v:null,a:0})
  return keys
}

/** Forma e intensidade na posição `elapsed` (ms): a marca mais próxima. */
export function sampleMouth(keys:MouthKey[], elapsed:number):{ v:Viseme|null; a:number }{
  if(elapsed<=0) return { v:null, a:0 }
  const last = keys[keys.length-1]
  if(elapsed>=last.t) return { v:null, a:0 }
  let i = 1
  while(i<keys.length && keys[i].t<elapsed) i++
  const a = keys[i-1], b = keys[i]
  const near = elapsed-a.t < b.t-elapsed ? a : b
  return { v:near.v, a:near.a }
}
