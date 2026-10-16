/* Sons do Jornal Sereno (docs/JORNAL_SERENO.md), sintetizados na hora, sem arquivos.
   - Notícia nova (vinheta): telex, rufar e pulsos subindo até um impacto grave com metais, e um pulso que some.
     Ajuste próprio: Som > Vinheta do jornal.
   - Papel: desdobrar, virar a página, fechar, arrastar; marca-texto e caneta. Ajuste: Som > Jornal.
   Mesmo contexto de áudio e mesma chave geral dos efeitos do jogo (src/sfx.ts). */
import { audioContext, sfxEnabled } from '../sfx';
import { fxOn } from '../settings/gameSettings';

let AC=null,NB=null,OUT=null,REV=null,HALL=null;
function ctx(id){
  if(!sfxEnabled()||!fxOn(id))return null;const c=audioContext();if(!c||c.state!=='running')return null;
  if(c!==AC){AC=c;const n=c.sampleRate*1.5;NB=c.createBuffer(1,n,c.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const comp=c.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;OUT=c.createGain();OUT.gain.value=.9;OUT.connect(comp);comp.connect(c.destination);
    const ir=c.createBuffer(2,c.sampleRate*1.4,c.sampleRate);for(let k=0;k<2;k++){const x=ir.getChannelData(k);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/x.length,3.2);}
    REV=c.createConvolver();REV.buffer=ir;const rg=c.createGain();rg.gain.value=.22;REV.connect(rg);rg.connect(OUT);
    const ir2=c.createBuffer(2,c.sampleRate*2.6,c.sampleRate);for(let k=0;k<2;k++){const x=ir2.getChannelData(k);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*Math.pow(1-i/x.length,2.4);}
    HALL=c.createConvolver();HALL.buffer=ir2;const hg=c.createGain();hg.gain.value=.5;HALL.connect(hg);hg.connect(OUT);}
  return AC;
}
const dst=(node,wet)=>{node.connect(OUT);if(wet){const g=AC.createGain();g.gain.value=wet;node.connect(g);g.connect(REV);}};
function noise(t0,dur,f,q,g,type,wet){const s=AC.createBufferSource();s.buffer=NB;s.playbackRate.value=.8+Math.random()*.4;const b=AC.createBiquadFilter();b.type=type||'bandpass';b.frequency.value=f;b.Q.value=q;const a=AC.createGain();
  a.gain.setValueAtTime(0,t0);a.gain.linearRampToValueAtTime(g,t0+Math.min(.02,dur*.18));a.gain.exponentialRampToValueAtTime(.0008,t0+dur);s.connect(b);b.connect(a);dst(a,wet==null?.4:wet);s.start(t0,Math.random()*.6,dur+.05);}
function tone(t0,f,dur,g,type,f2,wet){const o=AC.createOscillator();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+dur);const a=AC.createGain();a.gain.setValueAtTime(0,t0);a.gain.linearRampToValueAtTime(g,t0+.012);a.gain.exponentialRampToValueAtTime(.0008,t0+dur);
  o.connect(a);dst(a,wet==null?.5:wet);o.start(t0);o.stop(t0+dur+.05);}
function crackle(t0,len,n,g){for(let i=0;i<n;i++){const t=t0+Math.random()*len;noise(t,.012+Math.random()*.03,1800+Math.random()*4500,2+Math.random()*4,g*(.4+Math.random()*.6),'bandpass',.25);}}

/** Tempo (s) da vinheta até o impacto: a folha cai aberta nesse momento. */
export const STING_HIT=.95;

export const newsSfx={
  arrive(){if(!ctx('sfx.newsSting'))return false;const t0=AC.currentTime+.03,HIT=STING_HIT;
    const hall=(node,w)=>{const g=AC.createGain();g.gain.value=w;node.connect(g);g.connect(HALL);};
    const syn=(t,f,d,g,type,lp,wet,det)=>{const o=AC.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;const b=AC.createBiquadFilter();b.type='lowpass';b.frequency.setValueAtTime(lp,t);b.Q.value=4;
      const a=AC.createGain();a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+.008);a.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(b);b.connect(a);a.connect(OUT);if(wet)hall(a,wet);o.start(t);o.stop(t+d+.05);return b;};
    for(let i=0;i<14;i++){const t=t0+i*.045+Math.random()*.008;noise(t,.018,2400+Math.random()*1800,3,.12,'bandpass',.08);noise(t,.01,700,2,.08,'bandpass',0);}
    tone(t0+.66,2093,.5,.045,'sine',null,.4);tone(t0+.66,4186,.25,.015,'sine',null,.3);
    for(let i=0;i<16;i++){const k=i/16,t=t0+.12+(1-Math.pow(1-k,1.6))*(HIT-.16);tone(t,92-k*8,.22,.06+k*.14,'sine',62,.2);}
    {const s=AC.createBufferSource();s.buffer=NB;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.4;bp.frequency.setValueAtTime(300,t0);bp.frequency.exponentialRampToValueAtTime(6000,t0+HIT);
     const a=AC.createGain();a.gain.setValueAtTime(0,t0);a.gain.linearRampToValueAtTime(.16,t0+HIT-.02);a.gain.linearRampToValueAtTime(0,t0+HIT+.02);s.connect(bp);bp.connect(a);a.connect(OUT);hall(a,.25);s.start(t0,0,HIT+.1);}
    const seq=[110,164.81,220,261.63,220,164.81,220,329.63,293.66,329.63,392,440];
    seq.forEach((f,i)=>{const t=t0+.22+i*.0595,k=i/seq.length;syn(t,f,.11,.05+k*.07,'square',900+k*2600,.15);syn(t,f*2,.08,.02+k*.03,'sawtooth',1800+k*3000,.1,7);});
    const H=t0+HIT;tone(H,64,1.4,.7,'sine',38,.3);tone(H,128,.5,.25,'triangle',60,.2);noise(H,.5,900,.5,.35,'lowpass',.5);noise(H,1.6,5200,.4,.06,'highpass',.7);
    [110,164.81,220,261.63,329.63,493.88].forEach((f,i)=>{[-9,0,9].forEach(det=>{const b=syn(H+.005*i,f,1.9,.034,'sawtooth',500,.55,det);b.frequency.exponentialRampToValueAtTime(3200,H+.18);b.frequency.exponentialRampToValueAtTime(700,H+1.9);});});
    for(let i=0;i<6;i++){const t=H+.55+i*.43,g=.16*(1-i/6);tone(t,55,.35,g,'sine',45,.25);noise(t,.03,3800,6,g*.25,'bandpass',.2);}
    return true;},
  unfold(){if(!ctx('sfx.news'))return;const t=AC.currentTime;noise(t,.16,2600,.7,.16,'bandpass',.3);crackle(t+.05,.5,26,.09);noise(t+.2,.5,1300,.5,.22,'bandpass',.35);noise(t+.24,.32,4800,1.4,.06,'bandpass',.2);noise(t+.66,.12,260,.8,.18,'lowpass',.25);},
  flip(){if(!ctx('sfx.news'))return;const t=AC.currentTime;noise(t,.1,3200,.9,.1);crackle(t,.25,12,.07);noise(t+.06,.38,1100,.5,.2);noise(t+.42,.06,700,1.2,.14,'bandpass',.2);},
  close(){if(!ctx('sfx.news'))return;const t=AC.currentTime;crackle(t,.3,14,.07);noise(t,.34,1200,.5,.2);noise(t+.3,.1,220,.8,.16,'lowpass');},
  rustle(){if(!ctx('sfx.news'))return;const t=AC.currentTime;crackle(t,.18,6,.035);noise(t,.2,2400,.6,.035,'bandpass',.15);},
  marker(){if(!ctx('sfx.news'))return;const t=AC.currentTime;noise(t,.05,7000,6,.05,'bandpass',.1);for(let i=0;i<2;i++){noise(t+.06+i*.38,.34,3600+i*400,5,.06,'bandpass',.12);noise(t+.06+i*.38,.34,8000,2,.025,'highpass',.05);}},
  pen(){if(!ctx('sfx.news'))return;const t=AC.currentTime;for(let i=0;i<7;i++)noise(t+i*.075+Math.random()*.02,.06,2800+Math.random()*2200,5,.045,'bandpass',.12);},
  tick(){if(!ctx('sfx.news'))return;const t=AC.currentTime;noise(t,.04,5200,5,.07,'bandpass',.1);tone(t,1320,.07,.02,'sine',null,.2);}
};
