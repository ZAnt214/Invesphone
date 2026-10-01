import type { Viseme } from './types'

/**
 * Boca em sincronia com o texto, por sílaba (como a fala de verdade: ~5 sílabas por segundo), e não por letra.
 * Cada sílaba vira uma abertura com a forma da vogal (A, E, I, O, U); b/m/p fecham a boca antes da vogal (M);
 * f/v encostam o lábio nos dentes (I estreito); pontuação fecha a boca e segura uma pausa.
 */
export type MouthKey = {
  t:number
  /** forma de boca, ou null na pausa */
  v:Viseme|null
  /** abertura, de 0 a 1 */
  a:number
}

const VOWEL:Record<string,[Viseme,number]> = {
  a:['A',1], á:['A',1], à:['A',1], â:['A',.9], ã:['A',.85],
  e:['E',.8], é:['E',.95], ê:['E',.8],
  i:['I',.7], í:['I',.75], y:['I',.7],
  o:['O',.9], ó:['O',1], ô:['O',.85], õ:['O',.8],
  u:['U',.75], ú:['U',.8]
}
const isVowel = (c:string) => !!VOWEL[c]
const isLetter = (c:string) => /[a-zà-úç]/.test(c)

type Syllable = { onset:string; v:Viseme; a:number; coda:string }
type Token = { kind:'syl'; s:Syllable } | { kind:'pause'; w:number } | { kind:'gap' }

/** Divide o texto em sílabas aproximadas (consoantes + núcleo vocálico) e pausas. */
function tokenize(text:string):Token[]{
  const out:Token[] = []
  const chars = [...text.toLowerCase()]
  let onset = ''
  for(let i=0;i<chars.length;i++){
    const c = chars[i]
    if(isVowel(c)){
      // ditongo: vogais seguidas formam um núcleo só; a mais aberta define a forma
      let j = i, best = VOWEL[c]
      while(j+1<chars.length && isVowel(chars[j+1])){ j++; if(VOWEL[chars[j]][1]>best[1]) best = VOWEL[chars[j]] }
      // consoantes depois do núcleo: a última antes de outra vogal começa a próxima sílaba
      let k = j+1, coda = ''
      while(k<chars.length && isLetter(chars[k]) && !isVowel(chars[k])){ coda += chars[k]; k++ }
      const nextIsVowel = k<chars.length && isVowel(chars[k])
      const keep = nextIsVowel ? coda.slice(0,Math.max(0,coda.length-1)) : coda
      out.push({ kind:'syl', s:{ onset, v:best[0], a:best[1], coda:keep } })
      onset = nextIsVowel ? coda.slice(keep.length) : ''
      i = j + keep.length
      continue
    }
    if(isLetter(c)){ onset += c; continue }
    onset = ''
    if(c==='…') out.push({ kind:'pause', w:3.2 })
    else if(/[.!?]/.test(c)) out.push({ kind:'pause', w:2.6 })
    else if(/[,;:]/.test(c)) out.push({ kind:'pause', w:1.5 })
    else if(c===' ') out.push({ kind:'gap' })
  }
  return out
}

const syllableWeight = (s:Syllable) => 1 + .12*(s.onset.length + s.coda.length)

/** Linha do tempo da boca para um texto falado em `duration` ms. */
export function mouthTrack(text:string, duration:number):MouthKey[]{
  const toks = tokenize(text)
  const weightOf = (t:Token) => t.kind==='syl' ? syllableWeight(t.s) : t.kind==='pause' ? t.w : .18
  const total = toks.reduce((s,t)=>s+weightOf(t),0) || 1
  const unit = duration/total
  const keys:MouthKey[] = [{ t:0, v:null, a:0 }]
  let t = 0
  for(const tok of toks){
    const w = weightOf(tok)*unit
    if(tok.kind==='syl'){
      const { onset, v, a, coda } = tok.s
      const amp = a*(.88+Math.random()*.12)
      // lábios: fechados (b, m, p) ou encostados nos dentes (f, v) no começo da sílaba
      if(/[bmp]/.test(onset)) keys.push({ t:t+w*.08, v:'M', a:0 })
      else if(/[fv]/.test(onset)) keys.push({ t:t+w*.1, v:'I', a:.25 })
      keys.push({ t:t+w*.42, v, a:amp })
      // a boca vai fechando no fim da sílaba (mais se ela termina em consoante)
      keys.push({ t:t+w*.85, v, a:amp*(coda ? .45 : .7) })
      if(/[bmp]$/.test(coda)) keys.push({ t:t+w*.97, v:'M', a:0 })
    } else if(tok.kind==='pause'){
      keys.push({ t:t+w*.25, v:null, a:0 }, { t:t+w*.9, v:null, a:0 })
    }
    t += w
  }
  keys.push({ t:duration, v:null, a:0 })
  return keys
}

const smooth = (x:number) => x*x*(3-2*x)

/**
 * Forma e abertura em `elapsed` (ms). A abertura é interpolada suavemente entre as marcas; a forma é a da marca
 * mais próxima que tenha forma (na pausa a boca fecha).
 */
export function sampleMouth(keys:MouthKey[], elapsed:number):{ v:Viseme|null; a:number }{
  if(elapsed<=0) return { v:null, a:0 }
  const last = keys[keys.length-1]
  if(elapsed>=last.t) return { v:null, a:0 }
  let i = 1
  while(i<keys.length && keys[i].t<elapsed) i++
  const p = keys[i-1], n = keys[i]
  const u = smooth(Math.min(1,Math.max(0,(elapsed-p.t)/Math.max(1,n.t-p.t))))
  const a = p.a + (n.a-p.a)*u
  const v = u<.5 ? (p.v ?? n.v) : (n.v ?? p.v)
  return { v, a }
}
