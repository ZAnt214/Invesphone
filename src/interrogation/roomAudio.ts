/**
 * Som da sala de depoimentos, gerado na hora (sem arquivos), no mesmo contexto dos efeitos curtos:
 * ar parado da sala, zumbido elétrico da luminária (60 Hz da rede), chiado da fita do gravador, relógio de parede,
 * ruídos esparsos (cadeira rangendo, passos no corredor, duto de ar) e um coração que aparece quando a pressão sobe.
 * Ações do detetive: caneta escrevendo, círculo na pergunta, folha virando, caderno baixando, estalo da lâmpada.
 * Respeita o som desligado em Ajustes e começa só depois de um toque (regra do iOS).
 */
import { audioContext } from '../sfx'

let noise:AudioBuffer|null = null
const noiseBuf = (c:AudioContext) => {
  if(noise && noise.sampleRate===c.sampleRate) return noise
  const n = c.sampleRate*2, b = c.createBuffer(1,n,c.sampleRate), d = b.getChannelData(0)
  for(let i=0;i<n;i++) d[i] = Math.random()*2-1
  return noise = b
}
/** Ruído filtrado com envelope: base de quase todos os sons da sala. */
function burst(c:AudioContext, out:AudioNode, o:{at:number; dur:number; vol:number; type?:BiquadFilterType; f:number; to?:number; q?:number; attack?:number; pan?:number}){
  const s = c.createBufferSource(); s.buffer = noiseBuf(c)
  const f = c.createBiquadFilter(); f.type = o.type ?? 'bandpass'; f.Q.value = o.q ?? 1
  f.frequency.setValueAtTime(o.f,o.at); if(o.to) f.frequency.exponentialRampToValueAtTime(o.to,o.at+o.dur)
  const g = c.createGain(); g.gain.setValueAtTime(0.0001,o.at)
  g.gain.exponentialRampToValueAtTime(o.vol,o.at+(o.attack ?? .01)); g.gain.exponentialRampToValueAtTime(0.0001,o.at+o.dur)
  let node:AudioNode = g
  if(o.pan && c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = o.pan; g.connect(p); node = p }
  s.connect(f).connect(g); node.connect(out)
  s.start(o.at,Math.random()*1.5); s.stop(o.at+o.dur+.05)
}
function tone(c:AudioContext, out:AudioNode, o:{at:number; f:number; to?:number; dur:number; vol:number; type?:OscillatorType}){
  const x = c.createOscillator(), g = c.createGain()
  x.type = o.type ?? 'sine'; x.frequency.setValueAtTime(o.f,o.at); if(o.to) x.frequency.exponentialRampToValueAtTime(o.to,o.at+o.dur)
  g.gain.setValueAtTime(0.0001,o.at); g.gain.exponentialRampToValueAtTime(o.vol,o.at+.006); g.gain.exponentialRampToValueAtTime(0.0001,o.at+o.dur)
  x.connect(g).connect(out); x.start(o.at); x.stop(o.at+o.dur+.03)
}

type Room = { c:AudioContext; master:GainNode; stop:()=>void; pressure:number }
let room:Room|null = null

export function startRoom(){
  const c = audioContext(); if(!c || room) return
  const master = c.createGain(); master.gain.value = 0.0001; master.connect(c.destination)
  master.gain.exponentialRampToValueAtTime(1,c.currentTime+2.5)
  const loops:AudioScheduledSourceNode[] = []
  const loopNoise = (type:BiquadFilterType,f:number,vol:number,q=.7)=>{
    const s = c.createBufferSource(); s.buffer = noiseBuf(c); s.loop = true
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q
    const g = c.createGain(); g.gain.value = vol
    s.connect(fl).connect(g).connect(master); s.start(); loops.push(s); return g
  }
  // ar parado da sala e o chiado da fita
  loopNoise('lowpass',260,.05)
  loopNoise('highpass',5200,.006)
  // zumbido da luminária: 120 Hz com harmônicos, oscilando devagar
  const hum = c.createGain(); hum.gain.value = .006; hum.connect(master)
  for(const [f,v] of [[120,1],[240,.45],[360,.2]] as const){
    const o = c.createOscillator(); o.frequency.value = f
    const g = c.createGain(); g.gain.value = v; o.connect(g).connect(hum); o.start(); loops.push(o)
  }
  const lfo = c.createOscillator(); lfo.frequency.value = .23
  const lg = c.createGain(); lg.gain.value = .0025; lfo.connect(lg).connect(hum.gain); lfo.start(); loops.push(lfo)

  const r:Room = { c, master, pressure:0, stop:()=>{} }
  const timers:number[] = []
  const every = (fn:()=>void, ms:()=>number)=>{ const tick = ()=>{ fn(); timers.push(window.setTimeout(tick,ms())) }; timers.push(window.setTimeout(tick,ms())) }
  // relógio de parede, à esquerda
  every(()=>{ const t = c.currentTime+.02; burst(c,master,{at:t,dur:.03,vol:.035,f:3200,q:6,pan:-.6,attack:.002}); burst(c,master,{at:t+.008,dur:.05,vol:.012,f:900,q:3,pan:-.6,attack:.002}) },()=>1000)
  // ruídos esparsos
  const events = [
    ()=>{ // cadeira rangendo do depoente
      const t = c.currentTime+.05
      for(let i=0;i<3;i++) burst(c,master,{at:t+i*.11+Math.random()*.05,dur:.16,vol:.03,f:500+Math.random()*300,to:900+Math.random()*400,q:12,pan:.15})
    },
    ()=>{ // passos no corredor, abafados pela porta
      const t = c.currentTime+.05, n = 4+Math.floor(Math.random()*4), pan = Math.random()<.5?-.8:.8
      for(let i=0;i<n;i++) burst(c,master,{at:t+i*.52,dur:.12,vol:.045*(1-Math.abs(i-n/2)/n),f:140,type:'lowpass',q:.8,pan,attack:.004})
    },
    ()=>{ // duto de ar ligando
      const t = c.currentTime+.05
      burst(c,master,{at:t,dur:4.5,vol:.018,f:400,to:700,q:.6,attack:1.4})
    },
    ()=>{ // trânsito distante passando
      const t = c.currentTime+.05
      burst(c,master,{at:t,dur:3.2,vol:.03,f:120,to:90,type:'lowpass',attack:1.2,pan:Math.random()*1.6-.8})
    }
  ]
  every(()=>events[Math.floor(Math.random()*events.length)](),()=>9000+Math.random()*14000)
  // coração: só aparece com pressão, mais rápido e mais alto quanto maior
  const beat = ()=>{
    const p = r.pressure
    if(p>.35){
      const t = c.currentTime+.02, v = .03+.09*(p-.35)/.65
      tone(c,master,{at:t,f:62,to:42,dur:.16,vol:v}); tone(c,master,{at:t+.17,f:55,to:38,dur:.18,vol:v*.75})
    }
    timers.push(window.setTimeout(beat,Math.max(520,1050-p*560)))
  }
  timers.push(window.setTimeout(beat,1200))
  r.stop = ()=>{
    timers.forEach(window.clearTimeout)
    const t = c.currentTime
    master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(Math.max(.0001,master.gain.value),t); master.gain.exponentialRampToValueAtTime(.0001,t+.6)
    window.setTimeout(()=>{ loops.forEach(s=>{ try{ s.stop() }catch{ /* já parado */ } }); master.disconnect() },700)
  }
  room = r
}

export function stopRoom(){ room?.stop(); room = null }
export function setRoomPressure(p:number){ if(room) room.pressure = Math.max(0,Math.min(1,p)) }

const out = ()=>{ const c = audioContext(); return c ? { c, o:(room?.master ?? c.destination) as AudioNode } : null }

export const roomSfx = {
  /** Caneta escrevendo a pergunta no caderno e o círculo em volta dela. */
  write(){
    const a = out(); if(!a) return
    const { c, o } = a, t = c.currentTime+.02
    for(let i=0;i<7;i++) burst(c,o,{at:t+i*.075+Math.random()*.02,dur:.07,vol:.022,f:2600+Math.random()*1800,q:2.5,attack:.008,pan:-.2})
    burst(c,o,{at:t+.62,dur:.55,vol:.02,f:1800,to:3400,q:1.8,attack:.08,pan:-.2})
  },
  /** Folha virando no caderno. */
  page(){
    const a = out(); if(!a) return
    const { c, o } = a, t = c.currentTime+.01
    burst(c,o,{at:t,dur:.28,vol:.035,f:5000,to:1600,q:.8,attack:.03,type:'bandpass',pan:-.3})
  },
  /** O caderno baixa (ou sobe) na mão do detetive. */
  rustle(){
    const a = out(); if(!a) return
    const { c, o } = a, t = c.currentTime+.01
    burst(c,o,{at:t,dur:.4,vol:.02,f:1200,to:700,q:.6,attack:.12,pan:-.25})
  },
  /** Traço de marca-texto sublinhando a pista. */
  underline(){
    const a = out(); if(!a) return
    const { c, o } = a, t = c.currentTime+.01
    burst(c,o,{at:t,dur:.32,vol:.03,f:2200,to:3000,q:3,attack:.04,pan:-.2})
  },
  /** Estalo elétrico da lâmpada falhando. */
  zap(strength=1){
    const a = out(); if(!a) return
    const { c, o } = a, t = c.currentTime
    burst(c,o,{at:t,dur:.06,vol:.03*strength,f:3500,q:1,attack:.002})
    tone(c,o,{at:t,f:120,dur:.12,vol:.012*strength,type:'sawtooth'})
  },
  /** Respiração antes de responder. */
  breath(){
    const a = out(); if(!a) return
    const { c, o } = a, t = c.currentTime+.01
    burst(c,o,{at:t,dur:.7,vol:.016,f:900,to:600,q:.7,attack:.25,pan:.1})
  }
}
