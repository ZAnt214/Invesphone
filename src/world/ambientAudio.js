/* Som ambiente do mundo vivo (docs/LIVING_WORLD_SYSTEM.md), gerado na hora (sem arquivos, nada licenciado).
   Cada lugar tem um "leito" contínuo e baixo (o ar da cidade e o trânsito ao longe; o ar-condicionado e o burburinho do
   DHPP) e sons pontuais que vêm do que de fato acontece na cena: a porta da loja quando alguém entra, o freio do ônibus,
   a buzina de quem espera o pedestre atravessar, o teclado de quem digita, o telefone que toca e é atendido.
   - Mesmo contexto e mesma chave de som ligado/desligado dos efeitos do jogo (src/sfx.ts, Ajustes).
   - Só começa depois de um toque (regra do iOS); some com a aba oculta.
   - Nada de loop idêntico: tons e volumes variam um pouco a cada vez, cada tipo tem intervalo mínimo próprio e no máximo
     seis sons pontuais tocam juntos. Volume e lado (pan) pela distância da câmera. */
import { audioContext, sfxEnabled } from '../sfx';
import { fxOn, onFxChange } from '../settings/gameSettings';
// som ambiente ligado? (Sons e vibração + Som ambiente, em Ajustes)
const on=()=>sfxEnabled()&&fxOn('ambient');
/** para o diagnóstico e os testes: o som ambiente está valendo? e o volume geral alvo */
export function ambientState(){return {on:on(),scene,gain:master?master.gain.value:0};}

let C=null,master=null,noise=null,scene=null,beds={},active=0;
const last={};
const now=()=>C?C.currentTime:0;
function ctx(){const c=audioContext();if(!c)return null;if(c!==C){C=c;master=c.createGain();master.gain.value=0.0001;master.connect(c.destination);noise=null;beds={};}return C;}
function noiseBuf(){if(noise)return noise;const n=C.sampleRate*2,b=C.createBuffer(1,n,C.sampleRate),d=b.getChannelData(0);let p=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;p=p*.97+w*.03;d[i]=w*.6+p*2.2;}return noise=b;}
function pan(node,p){if(!C.createStereoPanner)return node;const s=C.createStereoPanner();s.pan.value=Math.max(-1,Math.min(1,p||0));node.connect(s);return s;}
function burst(o){const s=C.createBufferSource();s.buffer=noiseBuf();const f=C.createBiquadFilter();f.type=o.type||'bandpass';f.Q.value=o.q??1;
  const at=o.at??now();f.frequency.setValueAtTime(o.f,at);if(o.to)f.frequency.exponentialRampToValueAtTime(o.to,at+o.dur);
  const g=C.createGain();g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,o.vol),at+(o.attack??.008));g.gain.exponentialRampToValueAtTime(.0001,at+o.dur);
  s.connect(f).connect(g);pan(g,o.pan).connect(master);s.start(at,Math.random()*1.5);s.stop(at+o.dur+.05);}
function tone(o){const x=C.createOscillator(),g=C.createGain(),at=o.at??now();x.type=o.type||'sine';x.frequency.setValueAtTime(o.f,at);if(o.to)x.frequency.exponentialRampToValueAtTime(o.to,at+o.dur);
  g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(Math.max(.0002,o.vol),at+(o.attack??.006));g.gain.exponentialRampToValueAtTime(.0001,at+o.dur);
  x.connect(g);pan(g,o.pan).connect(master);x.start(at);x.stop(at+o.dur+.03);}
function loopNoise(type,f,vol,q=.7){const s=C.createBufferSource();s.buffer=noiseBuf();s.loop=true;const fl=C.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
  const g=C.createGain();g.gain.value=.0001;s.connect(fl).connect(g).connect(master);s.start();g.gain.setTargetAtTime(vol,now(),1.2);return {g,s,fl,vol};}
const v=(base,spread=.25)=>base*(1+(Math.random()*2-1)*spread);

/** troca o leito do lugar: 'rua' | 'base' | null (silêncio). Chamar depois de um toque. */
export function setScene(name){
  if(!ctx())return;if(name===scene)return;scene=name;
  for(const k in beds){const b=beds[k];b.g.gain.setTargetAtTime(.0001,now(),.8);setTimeout(()=>{try{b.s.stop();}catch(e){/* já parou */}},4000);}beds={};
  if(name==='rua'){beds.air=loopNoise('bandpass',700,.012,.4);beds.rumble=loopNoise('lowpass',140,.05);beds.engine=loopNoise('lowpass',220,.0001,1.2);}
  if(name==='base'){beds.hvac=loopNoise('lowpass',320,.035);beds.room=loopNoise('bandpass',520,.006,.6);}
  master.gain.setTargetAtTime(on()&&!document.hidden?.9:.0001,now(),.6);
}
/** chamado a cada ~quarto de segundo pela cena: trânsito perto da câmera (0..1) e para que lado */
export function traffic(level,p){const b=beds.engine;if(!b||!C)return;b.g.gain.setTargetAtTime(.0001+.06*Math.min(1,level),now(),.25);b.fl.frequency.setTargetAtTime(160+level*220,now(),.3);}
function gate(kind,min){const t=performance.now();if(last[kind]&&t-last[kind]<min*1000)return false;if(active>=6)return false;last[kind]=t;active++;setTimeout(()=>active--,900);return true;}

/** sons pontuais. p: lado (-1 esquerda .. 1 direita); a: força (0..1, já com a distância) */
export function fx(kind,p=0,a=1){
  if(!ctx()||!on()||a<.03)return;const t=now();
  switch(kind){
    case 'door':if(!gate(kind,.6))return;tone({f:v(1760,.04),dur:.5,vol:.02*a,type:'triangle',pan:p});tone({f:v(2350,.04),at:t+.09,dur:.45,vol:.014*a,type:'triangle',pan:p});burst({f:900,dur:.08,vol:.03*a,pan:p});break;
    case 'coin':if(!gate(kind,2))return;tone({f:2600,dur:.06,vol:.02*a,pan:p});tone({f:3200,at:t+.1,dur:.05,vol:.015*a,pan:p});break;
    case 'brake':if(!gate(kind,1.5))return;burst({f:v(2900,.1),to:2400,dur:.5,vol:.03*a,q:8,pan:p});break;
    case 'busdoor':if(!gate(kind,3))return;burst({type:'highpass',f:3000,dur:.9,vol:.04*a,attack:.03,pan:p});burst({f:180,dur:.25,at:t+.85,vol:.05*a,pan:p});break;
    case 'bus':if(!gate(kind,3))return;tone({f:55,to:85,dur:1.8,vol:.05*a,type:'sawtooth',pan:p,attack:.3});burst({type:'lowpass',f:200,dur:1.6,vol:.06*a,attack:.2,pan:p});break;
    case 'beep':if(!gate(kind,.5))return;tone({f:1480,dur:.07,vol:.012*a,type:'square',pan:p});break;
    case 'cardoor':if(!gate(kind,1))return;burst({type:'lowpass',f:260,dur:.18,vol:.08*a,pan:p});break;
    case 'honk':if(!gate(kind,4))return;tone({f:v(415,.03),dur:.28,vol:.03*a,type:'square',pan:p});tone({f:v(520,.03),dur:.28,vol:.022*a,type:'square',pan:p});break;
    case 'flap':if(!gate(kind,.8))return;for(let i=0;i<4;i++)burst({f:v(1300),dur:.06,at:t+i*.07,vol:.012*a,pan:p});break;
    case 'step':if(!gate(kind,.22))return;burst({type:'lowpass',f:v(380,.2),dur:.05,vol:.02*a,pan:p});break;
    case 'bird':if(!gate(kind,2.5))return;{const b=v(3200,.15);for(let i=0;i<2+(Math.random()*3|0);i++)tone({f:b,to:b*1.25,at:t+i*.13,dur:.08,vol:.008*a,pan:p});}break;
    case 'murmur':if(!gate(kind,3))return;for(let i=0;i<3;i++)burst({f:v(520,.3),dur:v(.22),at:t+i*.25+Math.random()*.1,vol:.012*a,q:3,pan:p});break;
    // DHPP
    case 'type':if(!gate('type'+p,.05))return;for(let i=0;i<3+(Math.random()*5|0);i++)burst({f:v(2400,.2),dur:.025,at:t+i*v(.11,.5),vol:.012*a,q:4,pan:p});break;
    case 'ring':if(!gate(kind,2.8))return;for(let r=0;r<2;r++){tone({f:440,at:t+r*.36,dur:.3,vol:.014*a,type:'square',pan:p});tone({f:480,at:t+r*.36,dur:.3,vol:.012*a,type:'square',pan:p});}break;
    case 'pickup':if(!gate(kind,1))return;burst({type:'lowpass',f:500,dur:.08,vol:.04*a,pan:p});break;
    case 'print':if(!gate(kind,4))return;for(let i=0;i<6;i++)burst({f:v(1100,.1),dur:.12,at:t+i*.2,vol:.016*a,q:2,pan:p});burst({type:'highpass',f:2500,at:t+1.3,dur:.4,vol:.02*a,pan:p});break;
    case 'paper':if(!gate(kind,1.2))return;burst({type:'highpass',f:v(3500),dur:v(.25),vol:.014*a,attack:.04,pan:p});break;
    case 'cup':if(!gate(kind,3))return;tone({f:v(1800,.05),dur:.12,vol:.012*a,type:'triangle',pan:p});break;
    case 'radio':if(!gate(kind,6))return;burst({type:'highpass',f:2000,dur:.12,vol:.02*a,pan:p});for(let i=0;i<4;i++)burst({f:v(900,.3),dur:.16,at:t+.15+i*.2,vol:.012*a,q:5,pan:p});burst({type:'highpass',f:2400,at:t+1,dur:.08,vol:.02*a,pan:p});break;
    case 'chair':if(!gate(kind,1.5))return;tone({f:v(160,.15),to:v(120,.1),dur:.22,vol:.01*a,type:'sawtooth',pan:p});break;
  }
}
// aba oculta: o ambiente some (e volta ao voltar); som desligado em Ajustes: some também
if(typeof document!=='undefined'){document.addEventListener('visibilitychange',()=>{if(master&&C)master.gain.setTargetAtTime(document.hidden||!on()?.0001:.9,now(),.3);});
  addEventListener('storage',e=>{if(e.key==='invesphone.sfx'&&master&&C)master.gain.setTargetAtTime(on()?.9:.0001,now(),.3);});
  onFxChange(()=>{if(master&&C)master.gain.setTargetAtTime(on()&&!document.hidden?.9:.0001,now(),.3);});}
/** primeiro toque na página: destrava o áudio (iOS) e volta o leito, se já havia cena */
export function unlock(){if(C&&C.state==='running'&&master)return;const s=scene;if(!ctx())return;if(s){scene=null;setScene(s);}}
