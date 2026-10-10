/**
 * Som da entrada de cinema do quadro, gerado na hora (sem arquivos), no mesmo contexto dos outros efeitos:
 * madrugada na sala da equipe (ar parado, chuva na janela, trânsito ao longe, relógio), o interruptor e a luminária
 * acendendo com falhas e zumbido, a respiração do Lemos, um grave de cinema que cresce com a câmera e o papel do quadro
 * quando ela chega. Os tempos acompanham a animação em case-board.css (4,6 s). Respeita o som desligado em Ajustes.
 */
import { audioContext } from '../sfx'

let noise:AudioBuffer|null = null
const noiseBuf = (c:AudioContext) => {
  if(noise && noise.sampleRate===c.sampleRate) return noise
  const n = c.sampleRate*2, b = c.createBuffer(1,n,c.sampleRate), d = b.getChannelData(0)
  for(let i=0;i<n;i++) d[i] = Math.random()*2-1
  return noise = b
}
type Burst = {at:number;dur:number;vol:number;type?:BiquadFilterType;f:number;to?:number;q?:number;attack?:number;pan?:number}
function burst(c:AudioContext,out:AudioNode,o:Burst){
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
function tone(c:AudioContext,out:AudioNode,o:{at:number;f:number;to?:number;dur:number;vol:number;type?:OscillatorType;attack?:number}){
  const x = c.createOscillator(), g = c.createGain()
  x.type = o.type ?? 'sine'; x.frequency.setValueAtTime(o.f,o.at); if(o.to) x.frequency.exponentialRampToValueAtTime(o.to,o.at+o.dur)
  g.gain.setValueAtTime(0.0001,o.at); g.gain.exponentialRampToValueAtTime(o.vol,o.at+(o.attack ?? .006)); g.gain.exponentialRampToValueAtTime(0.0001,o.at+o.dur)
  x.connect(g).connect(out); x.start(o.at); x.stop(o.at+o.dur+.03)
}

/** Toca a cena; devolve a função que encerra (com uma saída curta, para quando o jogador pula). */
export function playCine():()=>void{
  const c = audioContext(); if(!c) return ()=>undefined
  const t0 = c.currentTime+.05
  const master = c.createGain(); master.gain.setValueAtTime(0.0001,t0); master.gain.exponentialRampToValueAtTime(1,t0+.6); master.connect(c.destination)
  const loops:AudioScheduledSourceNode[] = []
  const loopNoise = (type:BiquadFilterType,f:number,vol:number,q=.7,pan=0)=>{
    const s = c.createBufferSource(); s.buffer = noiseBuf(c); s.loop = true
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q
    const g = c.createGain(); g.gain.value = vol
    let node:AudioNode = g
    if(pan && c.createStereoPanner){ const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p }
    s.connect(fl).connect(g); node.connect(master); s.start(t0); loops.push(s); return g
  }
  // madrugada: ar parado, chuva fina na janela (à esquerda), trânsito longe
  loopNoise('lowpass',220,.06)
  const rain = loopNoise('bandpass',2600,.018,.6,-.5)
  loopNoise('highpass',6500,.006,.7,-.6)
  const traffic = loopNoise('lowpass',110,.05)
  const lfo = c.createOscillator(); lfo.frequency.value = .18; const lg = c.createGain(); lg.gain.value = .025
  lfo.connect(lg).connect(traffic.gain); lfo.start(t0); loops.push(lfo)
  // gotas batendo no vidro
  for(let i=0;i<26;i++)burst(c,master,{at:t0+Math.random()*4.4,dur:.03,vol:.012+Math.random()*.01,f:3000+Math.random()*2500,q:6,pan:-.4-Math.random()*.4})
  // um carro passa lá embaixo
  burst(c,master,{at:t0+1.6,dur:2.2,vol:.03,type:'lowpass',f:200,to:700,attack:1.1,pan:.5})
  // relógio de parede
  for(let i=0;i<5;i++){const at=t0+.3+i;tone(c,master,{at,f:2400,dur:.025,vol:.012,type:'square'});burst(c,master,{at,dur:.03,vol:.01,f:4200,q:5})}
  // interruptor e luminária acendendo, com as falhas da animação (12%, 14%, 16% e 22% de 4,6 s)
  burst(c,master,{at:t0+.48,dur:.035,vol:.12,f:1800,q:3});tone(c,master,{at:t0+.48,f:180,dur:.04,vol:.05,type:'triangle'})
  for(const [t,v] of [[.55,.09],[.66,.05],[.74,.08],[1.0,.07]] as const){
    burst(c,master,{at:t0+t,dur:.06,vol:v,type:'highpass',f:3000,q:.8});tone(c,master,{at:t0+t,f:120,dur:.08,vol:v*.4,type:'sawtooth'})}
  const hum = c.createGain(); hum.gain.setValueAtTime(0.0001,t0); hum.gain.setValueAtTime(0.0001,t0+.98); hum.gain.exponentialRampToValueAtTime(.012,t0+1.1); hum.connect(master)
  for(const [f,v] of [[120,1],[240,.45],[360,.18]] as const){const o=c.createOscillator();o.frequency.value=f;const g=c.createGain();g.gain.value=v;o.connect(g).connect(hum);o.start(t0);loops.push(o)}
  // o Lemos solta o ar, cansado
  burst(c,master,{at:t0+1.25,dur:1.3,vol:.035,f:520,to:380,q:.9,attack:.35})
  // grave de cinema crescendo com o avanço da câmera, e a chegada no quadro
  const swell = c.createOscillator(), sg = c.createGain(); swell.type='sine'; swell.frequency.setValueAtTime(46,t0+1.2); swell.frequency.exponentialRampToValueAtTime(62,t0+4.1)
  sg.gain.setValueAtTime(0.0001,t0+1.2); sg.gain.exponentialRampToValueAtTime(.16,t0+3.9); sg.gain.exponentialRampToValueAtTime(0.0001,t0+4.5)
  swell.connect(sg).connect(master); swell.start(t0+1.2); swell.stop(t0+4.6)
  burst(c,master,{at:t0+1.6,dur:2.6,vol:.05,type:'bandpass',f:180,to:1400,q:.7,attack:2.2})
  tone(c,master,{at:t0+4.05,f:58,to:34,dur:1.1,vol:.22})
  burst(c,master,{at:t0+4.05,dur:.5,vol:.05,type:'lowpass',f:500,to:120})
  // papel e alfinetes do quadro quando a câmera chega
  for(const t of [3.95,4.12,4.25])burst(c,master,{at:t0+t,dur:.12,vol:.03,f:3200,q:1.4})
  // a chuva baixa quando a atenção vai para o quadro
  rain.gain.setValueAtTime(.018,t0+3.2); rain.gain.linearRampToValueAtTime(.008,t0+4.6)
  let done = false
  const stop = (fade=.35)=>{
    if(done) return; done = true
    const n = c.currentTime
    master.gain.cancelScheduledValues(n); master.gain.setValueAtTime(Math.max(master.gain.value,0.0001),n); master.gain.exponentialRampToValueAtTime(0.0001,n+fade)
    window.setTimeout(()=>{ for(const l of loops) try{l.stop()}catch{/* já parou */} master.disconnect() },fade*1000+80)
  }
  // depois da cena fica só um resto do ambiente, que some devagar
  const end = window.setTimeout(()=>stop(1.6),4700)
  return ()=>{ window.clearTimeout(end); stop() }
}
