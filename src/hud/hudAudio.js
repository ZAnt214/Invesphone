/* Sons do HUD do Lemos (src/hud/hud.js), gerados na hora (sem arquivos) e com um eco de sala grande.
   - Entrar numa sala: sopro de ar subindo, um grave fundo e um brilho agudo.
   - Descoberta: sino suave em duas notas.
   - Evidência: a folha passando, o zunido do rastro subindo e, na chegada à caderneta, baque grave, estalo e brilhos.
   - Caderneta: página virando; material aberto: ar subindo.
   Mesmo contexto e mesma chave dos efeitos do jogo (Sons e vibração) e o ajuste próprio, Som > Sons da interface. */
import { audioContext, sfxEnabled } from '../sfx';
import { fxOn } from '../settings/gameSettings';

let C=null,out=null,verb=null,noise=null;
const on=()=>sfxEnabled()&&fxOn('sfx.hud');
function ctx(){
  if(!on())return null;const c=audioContext();if(!c||c.state!=='running')return null;
  if(c!==C){C=c;out=c.createGain();out.gain.value=.8;out.connect(c.destination);
    const len=Math.floor(c.sampleRate*2.4),ir=c.createBuffer(2,len,c.sampleRate);
    for(let ch=0;ch<2;ch++){const d=ir.getChannelData(ch);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}
    verb=c.createConvolver();verb.buffer=ir;const wet=c.createGain();wet.gain.value=.4;verb.connect(wet).connect(out);
    const n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;noise=b;}
  return C;
}
function route(node,wet){node.connect(out);const s=C.createGain();s.gain.value=wet;node.connect(s).connect(verb);}
function env(g,at,vol,att,dur){g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),at+att);g.gain.exponentialRampToValueAtTime(.0001,at+dur);}
function tone(o){const at=C.currentTime+(o.at||0),x=C.createOscillator(),g=C.createGain();x.type=o.type||'sine';x.frequency.setValueAtTime(o.f,at);if(o.to)x.frequency.exponentialRampToValueAtTime(o.to,at+o.dur);env(g,at,o.vol,o.att||.005,o.dur);x.connect(g);route(g,o.wet??.3);x.start(at);x.stop(at+o.dur+.05);}
function hiss(o){const at=C.currentTime+(o.at||0),s=C.createBufferSource(),f=C.createBiquadFilter(),g=C.createGain();s.buffer=noise;f.type=o.type||'bandpass';f.Q.value=o.q??1;f.frequency.setValueAtTime(o.f,at);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,at+o.dur);env(g,at,o.vol,o.att||.01,o.dur);s.connect(f).connect(g);route(g,o.wet??.3);s.start(at,Math.random());s.stop(at+o.dur+.05);}
function bell(f,at,v){for(const [k,a,d] of [[1,1,1.8],[2.01,.4,1.2],[2.76,.32,.9],[4.07,.14,.6],[5.4,.08,.4]])tone({f:f*k,at,dur:d*1.4,vol:v*a,att:.004,wet:.7});}
const buzz=p=>{if(!on())return;try{navigator.vibrate&&navigator.vibrate(p);}catch(_){/* sem vibração */}};

export const hudSfx={
  room(){if(!ctx())return;hiss({f:220,to:2600,q:.7,dur:1.4,vol:.14,att:.55,wet:.7});tone({f:74,to:36,dur:2,vol:.36,att:.02,wet:.4});tone({f:37,dur:1.6,vol:.2,att:.05,wet:.2});
    [1318,1760,2637,3520].forEach((f,i)=>tone({f,at:.3+i*.07,dur:2.4,vol:.015,att:.5,wet:1}));},
  disc(){if(!ctx())return;bell(1046,0,.06);bell(1568,.16,.04);hiss({type:'highpass',f:6000,dur:.6,vol:.02,att:.2,wet:.9});buzz(12);},
  open(){if(!ctx())return;hiss({f:600,to:2400,q:.6,dur:.45,vol:.06,att:.12,wet:.5});tone({f:660,to:990,dur:.35,vol:.025,wet:.7});},
  close(){if(!ctx())return;hiss({f:2000,to:500,q:.6,dur:.35,vol:.045,att:.05,wet:.5});},
  evIn(){if(!ctx())return;hiss({f:1400,to:3400,q:.8,dur:.32,vol:.09,att:.03,wet:.4});tone({f:220,to:330,dur:.4,vol:.045,att:.05,wet:.6});},
  fly(){if(!ctx())return;hiss({f:500,to:5200,q:1.2,dur:.72,vol:.1,att:.3,wet:.6});tone({f:440,to:1760,dur:.7,vol:.02,att:.2,wet:.8});},
  hit(){if(!ctx())return;tone({f:130,to:46,dur:.4,vol:.42,att:.003,wet:.5});hiss({type:'highpass',f:3200,dur:.03,vol:.26,att:.002,wet:.3});hiss({type:'lowpass',f:420,dur:.2,vol:.22,att:.003,wet:.4});
    for(let i=0;i<7;i++)tone({f:2200+Math.random()*2600,at:.04+i*.045,dur:.5,vol:.012,att:.003,wet:1});bell(784,.06,.025);buzz([18,40,10]);},
  page(){if(!ctx())return;hiss({f:1800,q:.7,dur:.14,vol:.08,att:.01,wet:.3});hiss({f:2600,q:.7,at:.09,dur:.12,vol:.05,att:.01,wet:.3});},
  tick(){if(!ctx())return;tone({f:2200,dur:.04,vol:.018,wet:.2});}
};
