/* Sons da leitora de crachá e da porta de acesso (src/base/badgeSwipe.js), gerados na hora (sem arquivos).
   - Atrito do crachá na fenda: ruído contínuo que acompanha a velocidade do dedo (mais rápido, mais agudo e mais alto),
     com o "tic" da cabeça magnética quando a tarja chega nela.
   - Leitora: bipe duplo agudo quando aceita; zumbido grave em três pulsos quando recusa.
   - Porta: o relé estala, a trava magnética solta com um zumbido curto e um baque metálico que ressoa, e a folha de
     vidro desgruda da borracha da vedação com um sopro de ar.
   - Tudo passa por um eco curto de corredor. Mesmo contexto de áudio e mesma chave dos efeitos (Sons e vibração) e
     o ajuste próprio, Som > Leitora de crachá. */
import { audioContext, sfxEnabled } from '../sfx';
import { fxOn } from '../settings/gameSettings';

let C=null,out=null,noise=null;
const on=()=>sfxEnabled()&&fxOn('sfx.badge');
function ctx(){
  if(!on())return null;const c=audioContext();if(!c)return null;
  if(c!==C){C=c;noise=null;out=c.createGain();out.gain.value=.9;out.connect(c.destination);
    // eco curto de corredor: resposta de impulso feita de ruído que decai
    const len=Math.floor(c.sampleRate*.55),ir=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3.2)*(i<c.sampleRate*.012?.2:1);}
    const cv=c.createConvolver();cv.buffer=ir;const wet=c.createGain();wet.gain.value=.2;out.connect(cv);cv.connect(wet);wet.connect(c.destination);}
  return C;
}
function noiseBuf(){if(noise)return noise;const n=C.sampleRate*2,b=C.createBuffer(1,n,C.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return noise=b;}
const now=()=>C.currentTime;
function env(g,at,vol,attack,dur){g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),at+attack);g.gain.exponentialRampToValueAtTime(.0001,at+dur);}
function burst(o){const s=C.createBufferSource();s.buffer=noiseBuf();const f=C.createBiquadFilter();f.type=o.type||'bandpass';f.Q.value=o.q??1;
  const at=o.at??now();f.frequency.setValueAtTime(o.f,at);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,at+o.dur);
  const g=C.createGain();env(g,at,o.vol,o.attack??.003,o.dur);s.connect(f).connect(g).connect(out);s.start(at,Math.random()*1.5);s.stop(at+o.dur+.05);}
function tone(o){const x=C.createOscillator(),g=C.createGain(),at=o.at??now();x.type=o.type||'sine';x.frequency.setValueAtTime(o.f,at);if(o.to)x.frequency.exponentialRampToValueAtTime(o.to,at+o.dur);
  env(g,at,o.vol,o.attack??.004,o.dur);let n=x.connect(g);if(o.lp){const f=C.createBiquadFilter();f.type='lowpass';f.frequency.value=o.lp;g.connect(f);n=f;}n.connect(out);x.start(at);x.stop(at+o.dur+.03);}
const buzz=p=>{if(!on())return;try{navigator.vibrate&&navigator.vibrate(p);}catch(_){/* sem vibração */}};

/* atrito contínuo enquanto o crachá corre na fenda */
let rub=null;
export function slideStart(){
  if(!ctx()||rub)return;const s=C.createBufferSource();s.buffer=noiseBuf();s.loop=true;
  const hi=C.createBiquadFilter();hi.type='bandpass';hi.frequency.value=2600;hi.Q.value=.9;const gh=C.createGain();gh.gain.value=.0001;
  const lo=C.createBiquadFilter();lo.type='lowpass';lo.frequency.value=520;const gl=C.createGain();gl.gain.value=.0001;
  s.connect(hi).connect(gh).connect(out);s.connect(lo).connect(gl).connect(out);s.start();rub={s,hi,gh,gl};
}
/** v: velocidade do crachá (0..1); grain: aspereza momentânea (pequenas variações dão vida ao atrito) */
export function slide(v){
  if(!rub||!C)return;const t=now(),k=Math.min(1,v),grain=.75+Math.random()*.5;
  rub.gh.gain.setTargetAtTime(.0001+.05*k*grain,t,.025);rub.gl.gain.setTargetAtTime(.0001+.09*k,t,.03);
  rub.hi.frequency.setTargetAtTime(1700+2600*k,t,.05);
}
export function slideStop(){if(!rub||!C){rub=null;return;}const r=rub;rub=null;const t=now();r.gh.gain.setTargetAtTime(.0001,t,.02);r.gl.gain.setTargetAtTime(.0001,t,.02);setTimeout(()=>{try{r.s.stop();}catch(_){/* já parou */}},300);}

/** a tarja chegou à cabeça de leitura: um tic seco */
export function head(){if(!ctx())return;burst({type:'highpass',f:3500,dur:.025,vol:.12});tone({f:1200,dur:.02,vol:.02,type:'square'});}

/** leitora aceitou: bipe duplo agudo, de alto-falante pequeno */
export function ok(){
  if(!ctx())return;const t=now();
  for(const d of [0,.13]){tone({f:2730,at:t+d,dur:.085,vol:.05,type:'square',lp:4200});tone({f:2730*2,at:t+d,dur:.06,vol:.008});}
  buzz(14);
}
/** leitora recusou: zumbido grave em três pulsos */
export function no(){
  if(!ctx())return;const t=now();
  for(let i=0;i<3;i++){tone({f:330,at:t+i*.13,dur:.09,vol:.07,type:'sawtooth',lp:1100});tone({f:165,at:t+i*.13,dur:.09,vol:.04,type:'square',lp:600});}
  buzz([40,50,40,50,40]);
}
/** a trava magnética solta e a porta desgruda da vedação */
export function unlock(){
  if(!ctx())return;const t=now();
  // relé
  burst({type:'highpass',f:4200,at:t,dur:.012,vol:.14});burst({type:'highpass',f:3800,at:t+.018,dur:.01,vol:.08});
  // a bobina desligando: zumbido de rede que cai
  tone({f:120,to:70,at:t+.02,dur:.16,vol:.06,type:'sawtooth',lp:520});tone({f:60,at:t+.02,dur:.16,vol:.05,type:'square',lp:300});
  // baque: a placa da trava se soltando do eletroímã
  const k=t+.14;
  tone({f:118,to:42,at:k,dur:.24,vol:.32});burst({type:'lowpass',f:320,at:k,dur:.14,vol:.28});
  burst({type:'bandpass',f:1900,q:14,at:k,dur:.42,vol:.07});burst({type:'bandpass',f:3150,q:16,at:k,dur:.3,vol:.045});burst({type:'highpass',f:2500,at:k,dur:.03,vol:.12});
  // a folha desgruda da borracha e o ar passa
  const p=t+.5;
  burst({type:'lowpass',f:200,at:p,dur:.08,vol:.08});burst({f:420,to:1300,q:.7,at:p+.03,dur:.55,vol:.045,attack:.12});
  burst({type:'highpass',f:3200,at:p+.15,dur:.7,vol:.012,attack:.2});
  setTimeout(()=>buzz([24,40,10]),140);
}
