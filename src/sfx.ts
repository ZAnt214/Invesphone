/**
 * Efeitos sonoros curtos gerados na hora (sem arquivos): clique do gravador, anotação, pista, pressão.
 * O áudio só começa depois de um toque do jogador (regra do iOS) e pode ser desligado em Ajustes.
 */
const KEY = 'invesphone.sfx'
let ctx:AudioContext|null = null

export const sfxEnabled = () => { try { return localStorage.getItem(KEY)!=='off' } catch { return true } }
export const setSfxEnabled = (on:boolean) => { try { localStorage.setItem(KEY,on?'on':'off') } catch { /* sem armazenamento */ } }

const audio = () => {
  if(!sfxEnabled()) return null
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?:typeof AudioContext }).webkitAudioContext
    if(!AC) return null
    ctx ??= new AC()
    if(ctx.state==='suspended') void ctx.resume()
    return ctx
  } catch { return null }
}

type Tone = { f:number; to?:number; at?:number; dur:number; vol?:number; type?:OscillatorType }
const play = (tones:Tone[]) => {
  const c = audio(); if(!c) return
  const t0 = c.currentTime
  for(const t of tones){
    const o = c.createOscillator(), g = c.createGain()
    const at = t0 + (t.at ?? 0)
    o.type = t.type ?? 'sine'
    o.frequency.setValueAtTime(t.f,at)
    if(t.to) o.frequency.exponentialRampToValueAtTime(t.to,at+t.dur)
    g.gain.setValueAtTime(0.0001,at)
    g.gain.exponentialRampToValueAtTime(t.vol ?? 0.05,at+0.008)
    g.gain.exponentialRampToValueAtTime(0.0001,at+t.dur)
    o.connect(g).connect(c.destination)
    o.start(at); o.stop(at+t.dur+0.02)
  }
}
const buzz = (p:number|number[]) => { if(!sfxEnabled()) return; try { navigator.vibrate?.(p) } catch { /* sem vibração */ } }

export const sfx = {
  /** Toque discreto em qualquer opção (menus, listas, botões). */
  tap(){ play([{f:460,to:340,dur:.045,vol:.022,type:'triangle'}]) },
  /** Gravador ligando, ao começar o depoimento. */
  rec(){ play([{f:1200,dur:.05,vol:.035,type:'square'},{f:800,at:.09,dur:.07,vol:.03,type:'square'}]) },
  /** Pergunta feita. */
  ask(){ play([{f:520,to:380,dur:.09,vol:.03}]) },
  /** Frase anotada sem valor. */
  note(){ play([{f:300,dur:.04,vol:.03,type:'triangle'}]) },
  /** Pista registrada. */
  clue(){ play([{f:660,dur:.1,vol:.05},{f:990,at:.09,dur:.16,vol:.05}]); buzz(14) },
  /** Pressão passou de um estágio: pulso grave, mais forte nos estágios altos. */
  pressure(stage:number){
    play([{f:90,to:55,dur:.32,vol:.08+stage*.02},{f:70,to:45,at:.2,dur:.32,vol:.07+stage*.02}])
    buzz(stage>=3 ? [40,60,40,60,80] : [30,50,30])
  }
}
