/* Base do DHPP: cena 2D navegável do Caso 01, na mesma técnica da Varredura das Acácias
   (pixel art procedural, câmera oblíqua, luz multiplicada por sala, detalhe por zoom, tela deitada).
   Lemos anda, a equipe fala, a caderneta guarda o caso. O jogo começa aqui, no plantão de madrugada; a casa
   da Rua das Acácias (/casa) é a segunda parte, e depois dela a base amanhece. Não há aparelho nem chamada. */
import { applyRequest, applyTopic, caseTeam, DEFAULT_DISCOVERED, requestOk, teamDialogues, teamMaterialRequests, teamNews, topicOk } from '../team/teamData';
import { readCase, writeCase } from '../case/caseSave';
import { depoPeople, summon } from '../case/depositions';
import { createStreet } from './street';
import { applyQuality, getQuality, onQualityChange } from '../characters/quality';
import { perfHud } from '../perfHud';
import * as AMB from '../world/ambientAudio';
import { openSettings } from '../settings/settingsPanel';
import { badgeReady, openBadge } from './badgeSwipe';
import { createHud } from '../hud/hud';
import { caseGuide } from '../case/guide';
import { clues as CLUE_LIST, people as PEOPLE } from '../case01';
import { fxOn, onFxChange } from '../settings/gameSettings';
import { choose, eventLog, jitter, lifeDebug, lineBank } from '../world/life';
import { CAMERA_PRIORITY, createCameraControl, createLead, damp, deadZoneTarget, drawCameraDebug } from '../camera/cameraDirector';
(() => {
'use strict';
const T=32,TH=22,K=TH/T,RISE=16,CAPH=8,W=34,H=39,N=W*H;   // do lado de fora, a própria cena da rua (street.js, strip): calçada, rua e calçada de cá (19–36); telhados (37–38)
const $=s=>document.querySelector(s);
const appEl=$('#app'),cv=$('#cv'),ctx=cv.getContext('2d');
const lc=document.createElement('canvas'),lctx=lc.getContext('2d');
const LS=3;
// pós-processamento: por padrão feito no próprio canvas 2D (brilho, profundidade de campo, cor por sala),
// sem copiar o quadro para outra superfície — no Safari essa cópia para o WebGL trava a GPU.
// ?fx=gl liga a versão em WebGL (shader), ?fx=0 desliga tudo.
const FXQ=(location.search.match(/[?&]fx=(\w+)/)||[])[1],FXMODE=FXQ==='0'?'off':FXQ==='gl'?'gl':'2d';
if(FXMODE==='off')document.body.classList.add('fxoff');
// o módulo WebGL só é baixado quando pedido
let POST=null;
if(FXMODE==='gl')import('./post').then(m=>{try{POST=m.createPost(cv);}catch(e){POST=null;}
  if(POST){cv.after(POST.canvas);document.body.classList.add('gl');POST.onlost=()=>{document.body.classList.remove('gl');POST=null;sizeCanvas();};sizeCanvas();}});
// clima de cor de cada lugar: o interrogatório frio e fechado, a delegada quente, o arquivo amarelado
// soft: cor aplicada em luz suave por cima da cena (versão 2D); tint: o mesmo clima na versão WebGL
const GRADE={interro:{tint:[0.93,0.99,1.08],soft:[60,92,140,0.3],bloom:0.7,vig:0.62},sonia:{tint:[1.06,1.0,0.92],soft:[255,176,112,0.2],bloom:0.55,vig:0.45},arquivo:{tint:[1.06,1.0,0.88],soft:[224,176,96,0.22],bloom:0.6,vig:0.5},pericia:{tint:[0.97,1.0,1.04],soft:[168,200,232,0.14],bloom:0.4,vig:0.38},equipe:{tint:[0.99,1.0,1.02],soft:[160,184,216,0.1],bloom:0.5,vig:0.42},hall:{tint:[1.02,1.0,0.97],soft:[255,216,168,0.12],bloom:0.48,vig:0.4},fora:{tint:[1.03,1.0,0.96],soft:[255,224,176,0.14],bloom:0.45,vig:0.36}};
const FX={dof:0.6,fy:0.6,ms:0,n:0,tint:[1,1,1],soft:[255,216,168,0.12],bloom:0.5,vig:0.42,sx:0,sy:0,band:0.19,vigS:-1},POST_SUB=[0,0],FX_FORCE=FXMODE==='gl';
// qualidade gráfica escolhida pelo jogador (Ajustes): vale para a rua, a planta e os efeitos
// baixa: resolução até 2x (pixels nítidos ampliados), sem profundidade de campo, poeira, reflexos nem luz de contorno;
// média: sem profundidade de campo e metade da poeira; alta: tudo. Ver docs/GRAPHICS_UPGRADE.md.
const ETN=document.getElementById('etint');
let QUAL=getQuality();applyQuality(QUAL);
const QLOW=()=>QUAL==='low',QHIGH=()=>QUAL==='high';
onQualityChange(q=>{QUAL=q;if(typeof applyLayout==='function')applyLayout(false);});
// ?perf=1: tempo por quadro e o que a cena desenha
perfHud(()=>{const st=SCENE==='rua'&&STREET?STREET.stats:null;return `qualidade ${QUAL} · cena ${SCENE} · RS ${RS}`+(st?`\nsprites ${st.drawn}/${st.ents} · sombras ${st.shadows} · partículas ${st.particles}`:` · zoom ${cam.z.toFixed(2)} · detalhe ${LODV}`);});
const RS_FORCE=(location.search.match(/[?&]rs=([\d.]+)/)||[])[1];
let dpr=1,RS=1;
// resolução de desenho: com o WebGL ligado, o 2D é desenhado em até 2x e o shader amplia nítido até a tela.
// Se o aparelho perder quadros, desce um degrau (e não volta a ele); se sobrar fôlego, sobe de novo.
const RS_LV=[2,1.75,1.5,1.25];let rsI=0,rsMin=0,rsT=0,frameMs=16.7;
function wantRS(){return !POST?dpr:RS_FORCE?Math.min(dpr,+RS_FORCE):Math.min(dpr,RS_LV[rsI]);}
function sizeCanvas(){RS=wantRS();cv.width=Math.round(VW()*RS);cv.height=Math.round(VH()*RS);lc.width=Math.ceil(cv.width/LS);lc.height=Math.ceil(cv.height/LS);}
function adaptRS(ms){
  if(!POST||RS_FORCE||ms>100)return;frameMs+=(ms-frameMs)*0.06;rsT+=ms;
  let n=rsI;if(frameMs>21&&rsT>1200&&rsI<RS_LV.length-1){rsMin=rsI+1;n=rsI+1;}else if(frameMs<17.4&&rsT>5000&&rsI>rsMin)n=rsI-1;
  if(n!==rsI&&Math.min(dpr,RS_LV[n])!==RS){rsI=n;rsT=0;frameMs=16.7;sizeCanvas();zoomTo(cam.z,null,null,240);}else if(n!==rsI){rsI=n;}
}
// a tela fica deitada como na Varredura: em pé, o app gira 90°
let ROT=0,userVert=false;
const SW=()=>window.innerWidth,SH=()=>window.innerHeight;
const VW=()=>ROT?SH():SW(),VH=()=>ROT?SW():SH();
const PX=e=>ROT===90?e.clientY:ROT===-90?SH()-e.clientY:e.clientX;
const PY=e=>ROT===90?SW()-e.clientX:ROT===-90?e.clientX:e.clientY;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const idx=(x,y)=>y*W+x;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function hash(x,y,s){let h=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,982451653))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function vn(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const a=hash(ix,iy,s),b=hash(ix+1,iy,s),c=hash(ix,iy+1,s),d=hash(ix+1,iy+1,s);const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;}
function hex(c){c=c.replace('#','');return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function mul(a,f){return [a[0]*f,a[1]*f,a[2]*f];}
function rgbs(a,al){return al==null?`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`:`rgba(${a[0]|0},${a[1]|0},${a[2]|0},${al})`;}
const lt=(c,t)=>rgbs(mix(hex(c),[255,255,255],t)),dk=(c,t)=>rgbs(mul(hex(c),1-t));
const safe=(fn,d)=>{try{return fn();}catch(_){return d;}};

/* ---------- Canon: o que a varredura da casa deixou (src/varredura) ---------- */
const CLUES={
  porta_intacta:{title:'Porta intacta',desc:'Sem sinais claros de arrombamento na entrada principal.',img:'/evidence/case01/new/comodos/comodo_01_entrada.jpg',room:'Entrada'},
  painel_alarme:{title:'Painel do alarme',desc:'Sistema doméstico com uso recente do código mestre.',img:'/evidence/case01/new/comodos/comodo_09_painel_alarme.jpg',room:'Painel do alarme'},
  valores_intactos:{title:'Valores intactos',desc:'Relógio, joias e eletrônicos de valor permaneceram na casa.',img:'/evidence/case01/new/comodos/comodo_02_sala.jpg',room:'Sala'},
  escritorio_revirado:{title:'Escritório revirado',desc:'Gavetas abertas e papéis espalhados como em uma busca apressada.',img:'/evidence/case01/new/comodos/comodo_04_escritorio.jpg',room:'Escritório'},
  vitimas_dormindo:{title:'Ataque durante o sono',desc:'A posição das vítimas sugere que foram surpreendidas no quarto.',img:'/evidence/case01/new/comodos/comodo_06_quarto_casal.jpg',room:'Quarto do casal'},
  quarto_livia:{title:'Quarto de Lívia',desc:'Quarto preservado apesar da bagunça em outras áreas da residência.',img:'/evidence/case01/new/comodos/comodo_07_quarto_livia.jpg',room:'Quarto de Lívia'},
  cao_canil:{title:'Thor estava preso',desc:'O cão da família foi colocado no canil antes da ocorrência.',img:'/evidence/case01/new/comodos/comodo_08_canil.jpg',room:'Canil'}
};
const FIM=safe(()=>JSON.parse(localStorage.getItem('varredura.fim')||'null'),null);
const FOUND=((FIM&&FIM.ordem)||[]).filter(id=>CLUES[id]);
/* plantão de madrugada: antes da casa. Lemos está de serviço no DHPP quando o caso chega; a Sônia passa a ocorrência e
   ele vai para a Rua das Acácias. Depois da varredura (FIM), a base é a da manhã, com a equipe inteira. */
const NIGHT=!FIM;
// quem está no prédio de madrugada; Maurício e Paulo já estão na casa, Renata chega de manhã
const NIGHT_IDS=new Set(['sonia','denise','plantao','guarda','faxina']);
const briefed=()=>!!(CASE||readCase()).briefed;

/* ---------- Mapa ---------- */
const F={GRASS:0,STREET:1,WALK:2,CONC:3,WALL:6,DOOR:8,WIN:9,FLOOR:4,ALLEY:10,ROOF:11};
const ROOM_NAME={sonia:'Sala da delegada',equipe:'Sala da equipe',pericia:'Perícia',interro:'Sala de depoimentos',hall:'Recepção',acesso:'Corredor restrito',arquivo:'Arquivo Morto',fora:'Calçada do DHPP',wall:'Corredor'};
const ROOM_RECT={sonia:[2,2,9,8],equipe:[11,2,21,8],pericia:[23,2,31,8],interro:[2,10,9,17],acesso:[11,10,21,13],hall:[11,14,21,17],arquivo:[23,10,31,17]};
/* Organização do DHPP (aprovada em 13/10/2026): uma só entrada, pela recepção (área pública: atendimento, espera). A
   separação é lá dentro: na divisória de vidro com o balcão do Plantão, uma porta de vidro que só abre com o crachá
   do agente (o guarda fica ao lado) leva ao corredor restrito, de onde se chega à sala da equipe (e dela à delegada e à perícia), à sala de
   depoimentos e ao Arquivo Morto. Só agentes e policiais passam dessa porta. */
const GATE_X=19;   // a porta de acesso com leitor de crachá, na divisória (linha 13)
let floor,room,occ,hot,blk,objs;
function buildMap(){
  floor=new Array(N).fill(F.GRASS);room=new Array(N).fill('fora');occ=new Array(N).fill(-1);hot=new Array(N).fill(null);blk=new Array(N).fill(false);objs=[];
  const set=(x0,y0,x1,y1,f,r)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);if(f!=null)floor[i]=f;if(r!==undefined)room[i]=r;}};
  const block=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)blk[idx(x,y)]=true;};
  // o DHPP fica entre becos e encostado nos vizinhos, de frente para a calçada, como na cena da rua (docs/RUA_BEATCOP_BASE.md)
  set(0,19,W-1,36,F.WALK,'fora');block(0,19,W-1,36);set(0,37,W-1,38,F.ROOF,'fora');block(0,37,W-1,38);
  set(0,0,W-1,18,F.ALLEY,'fora');block(0,0,W-1,0);block(0,1,0,18);block(W-1,1,W-1,18);
  set(1,1,32,18,F.WALL,'wall');
  for(const r in ROOM_RECT){const [a,b,c,d]=ROOM_RECT[r];set(a,b,c,d,F.FLOOR,r);}
  // as linhas coladas à parede sul ficam atrás dela: não se anda ali
  block(2,8,14,8);block(17,8,31,8);block(2,17,14,17);block(17,17,31,17);
  // o lado de fora agora é a cena da rua (street.js): na planta, sair é pela porta da frente
  block(0,19,W-1,22);
  for(const [x,y,r] of [[10,5,'equipe'],[22,5,'equipe'],[10,11,'acesso'],[22,11,'acesso']]){floor[idx(x,y)]=F.DOOR;room[idx(x,y)]=r;}
  for(const x of [15,16]){set(x,9,x,9,F.FLOOR,'acesso');set(x,18,x,18,F.DOOR,'hall');}
  for(const [x,y] of [[4,1],[5,1],[13,1],[19,1],[25,1],[29,1],[4,18],[5,18],[9,18],[12,18],[19,18],[22,18],[26,18],[29,18]])floor[idx(x,y)]=F.WIN;
  const add=(t,x,y,w,h,o)=>{const k=objs.length;objs.push(Object.assign({t,x,y,w,h},o||{}));for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(!(o&&o.nocc))occ[idx(xx,yy)]=k;if(o&&o.hot)hot[idx(xx,yy)]=o.hot;}return k;};
  // sala da delegada
  add('execchair',5,3,1,1,{nocc:true});add('deskboss',4,4,3,1,{hot:'sonia_mesa',nomark:true});add('cadeira',4,6,1,1);add('cadeira',6,6,1,1);add('shelf',7,2,2,1,{v:'books'});add('filing',2,2,1,1);add('plant',9,6,1,1,{v:'tall'});add('plant',2,6,1,1);
  // sala da equipe
  add('chair',13,3,1,1,{nocc:true});add('chair',17,3,1,1,{nocc:true});add('chair',20,3,1,1,{nocc:true});
  add('desk',12,4,2,1,{v:'renata'});add('desk',16,4,2,1,{v:'denise'});add('desk',19,4,2,1,{v:'lemos',hot:'mesa_lemos'});
  add('board',14,6,3,1,{hot:'quadro'});add('coffee',20,6,1,1);add('xerox',12,6,1,1);add('filing',11,2,1,1);add('plant',21,2,1,1,{v:'tall'});add('plant',18,7,1,1);
  // perícia
  add('stool',25,3,1,1,{nocc:true});add('bench',24,4,4,1);add('lightbox',28,6,3,1,{hot:'fotos'});add('locker',30,2,1,1);add('locker',31,2,1,1);add('bagtable',24,6,2,1,{hot:'celular_helena'});add('evidcage',23,2,2,1);add('plant',23,7,1,1);
  // recepção (pública) e controle de acesso: divisória de vidro na linha 13 com o balcão do Plantão (atrás do vidro, do lado
  // restrito), o painel de senha, a placa de área restrita e a porta com leitor de crachá (a única passagem para dentro)
  add('chair',14,12,1,1,{nocc:true});
  add('glasswall',11,13,1,1);add('counter',12,13,5,1);add('glasswall',17,13,2,1,{v:'senha'});add('secdoor',GATE_X,13,1,1,{nocc:true});add('glasswall',20,13,2,1,{v:'restrito'});
  add('sofa',18,15,3,1);add('espera',17,16,1,1);add('cooler',12,16,1,1);add('plant',11,16,1,1,{v:'tall'});add('plant',21,16,1,1,{v:'tall'});add('wetsign',14,15,1,1);
  // corredor restrito: quadro de avisos e extintor
  add('filing',11,10,1,1);add('plant',21,10,1,1,{v:'tall'});
  // sala de depoimentos
  // o depoente fica atrás da mesa, de frente para a câmera; a cadeira de quem pergunta fica do lado de cá, de costas
  add('metalchair',5,11,1,1,{v:'front'});add('itable',4,12,3,2,{hot:'interro'});add('metalchair',5,14,1,1,{v:'back'});add('filing',2,15,1,1);
  add('mirror',7,10,2,1);   // espelho de observação (do outro lado, a equipe acompanha o depoimento)
  // arquivo
  add('shelf',24,11,3,1,{v:'arq'});add('shelf',28,11,3,1,{v:'arq'});add('shelf',24,14,3,1,{v:'arq'});add('shelf',28,14,3,1,{v:'arq',hot:'arquivo'});add('boxes',23,16,1,1);add('boxes',30,16,1,1);add('boxes',31,16,1,1);
  // pátio
  // as bandeiras ladeando a entrada; o resto da calçada (postes, árvores, viatura, quem passa) vem da cena da rua
  add('flag',11,19,1,1,{v:'br'});add('flag',20,19,1,1,{v:'dh'});
  add('boxes',0,7,1,1);add('boxes',33,13,1,1);
}
function passable(i){const f=floor[i];if(f===F.WALL||f===F.WIN)return false;if(blk[i]||occ[i]>=0)return false;return true;}

/* ---------- Caminhos ---------- */
const seen=new Int32Array(N),par=new Int32Array(N),Q=new Int32Array(N);let stamp=0;
function bfs(start,visit,pass){
  stamp++;let h=0,t=0;Q[t++]=start;seen[start]=stamp;par[start]=-1;
  while(h<t){const i=Q[h++];if(visit(i))return i;const x=i%W,y=(i/W)|0;
    const tn=n=>{if(seen[n]!==stamp&&pass(n)){seen[n]=stamp;par[n]=i;Q[t++]=n;}};
    if(x>0)tn(i-1);if(x<W-1)tn(i+1);if(y>0)tn(i-W);if(y<H-1)tn(i+W);}
  return -1;
}
function pathTo(e){const p=[];for(let i=e;i!==-1;i=par[i])p.push(i);p.reverse();p.shift();return p;}
const ti=a=>idx(clamp(Math.round(a.x),0,W-1),clamp(Math.round(a.y),0,H-1));

/* ---------- Arte: kit ---------- */
function S2(w,h,fn){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  const P=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),ww,hh);};
  const E=(cx,cy,rx,ry,col)=>{g.fillStyle=col;for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++){const dy=(y+.5-cy)/ry;if(Math.abs(dy)>1)continue;const hw=rx*Math.sqrt(1-dy*dy);g.fillRect(Math.round(cx-hw),y,Math.max(1,Math.round(hw*2)),1);}};
  fn(P,E,g);return c;
}
// contorno colorido ("selout"): a borda pega um tom escuro da cor vizinha, não um preto uniforme
function outlined(c,col){
  const w=c.width,h=c.height,o=document.createElement('canvas');o.width=w+2;o.height=h+2;
  const src=c.getContext('2d').getImageData(0,0,w,h).data,g=o.getContext('2d'),out=g.createImageData(w+2,h+2),d=out.data;
  const oc=col?hex(col):null,ink=[30,22,17];
  const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:src[(y*w+x)*4+3];
  for(let y=0;y<h+2;y++)for(let x=0;x<w+2;x++){
    const sx=x-1,sy=y-1,k=(y*(w+2)+x)*4,a=A(sx,sy);
    if(a>0){const s=(sy*w+sx)*4;d[k]=src[s];d[k+1]=src[s+1];d[k+2]=src[s+2];d[k+3]=a;continue;}
    let nx=-1,ny=-1;for(const [dx,dy] of [[0,-1],[0,1],[-1,0],[1,0]])if(A(sx+dx,sy+dy)>40){nx=sx+dx;ny=sy+dy;break;}
    if(nx<0)continue;
    if(oc){d[k]=oc[0];d[k+1]=oc[1];d[k+2]=oc[2];}
    else{const s=(ny*w+nx)*4;for(let j=0;j<3;j++)d[k+j]=src[s+j]*0.32+ink[j]*0.68;}
    d[k+3]=240;
  }
  g.putImageData(out,0,0);return o;
}
// acabamento de volume: luz na borda de cima, sombra na de baixo e um grão leve de material
function refine(c,seed){
  const w=c.width,h=c.height,g=c.getContext('2d'),img=g.getImageData(0,0,w,h),d=img.data;
  const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:d[(y*w+x)*4+3];
  const src=new Uint8ClampedArray(d);const SA=(x,y)=>x<0||y<0||x>=w||y>=h?0:src[(y*w+x)*4+3];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=(y*w+x)*4;if(src[k+3]<200)continue;
    let f=1+(hash(x,y,seed||7)-0.5)*0.07;
    if(SA(x,y-1)<100)f*=1.16;else if(SA(x,y-2)<100)f*=1.05;
    if(SA(x,y+1)<100)f*=0.8;
    if(SA(x-1,y)<100)f*=1.06;if(SA(x+1,y)<100)f*=0.88;
    // contraste local: pixel bem mais escuro que o de cima ganha uma linha de sombra suave
    if(y>0&&src[k-w*4+3]>200){const l0=src[k]+src[k+1]+src[k+2],l1=src[k-w*4]+src[k-w*4+1]+src[k-w*4+2];if(l1-l0>150)f*=0.92;}
    d[k]=Math.min(255,src[k]*f);d[k+1]=Math.min(255,src[k+1]*f);d[k+2]=Math.min(255,src[k+2]*f);}
  g.putImageData(img,0,0);return c;
}
function bush(P,E,cx,cy,r,rnd,cols){
  cols=cols||['#24461f','#356a2e','#4a8a3c','#69ad52','#8ccb6a'];
  const blobs=[];for(let k=0;k<7;k++){const a=rnd()*6.28,d=rnd()*r*0.55;blobs.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*0.8,r*(0.45+rnd()*0.3)]);}
  blobs.push([cx,cy,r*0.7]);
  for(const [x,y,rr] of blobs)E(x,y+2,rr+1,rr*0.9+1,cols[0]);
  for(const [x,y,rr] of blobs)E(x,y,rr,rr*0.88,cols[1]);
  for(const [x,y,rr] of blobs)E(x-rr*0.2,y-rr*0.25,rr*0.7,rr*0.6,cols[2]);
  for(const [x,y,rr] of blobs)E(x-rr*0.35,y-rr*0.45,rr*0.35,rr*0.3,cols[3]);
  for(let k=0;k<10;k++){const a=rnd()*6.28,d=rnd()*r*0.7;P(cx+Math.cos(a)*d,cy+Math.sin(a)*d*0.8-r*0.2,1,1,cols[4]);}
}
function txt(g,s,x,y,size,col,sp,weight){g.font=`${weight||700} ${size}px Rajdhani,"Arial Narrow",sans-serif`;g.fillStyle=col;g.textBaseline='alphabetic';let X=x;for(const ch of s){g.fillText(ch,X,y);X+=g.measureText(ch).width+(sp||0);}return X-x;}
function txtW(g,s,size,sp,weight){g.font=`${weight||700} ${size}px Rajdhani,"Arial Narrow",sans-serif`;let w=0;for(const ch of s)w+=g.measureText(ch).width+(sp||0);return w-(sp||0);}

/* ---------- Arte: móveis em pé, como os da casa (câmera oblíqua) ----------
   Cada sprite tem a pegada (w×h tiles) e uma altura `t` acima dela; o pé do móvel fica no fundo da pegada. */
function CRTback(P,x,y){ // monitor de tubo visto por trás: o volume bege
  P(x,y,22,19,'#d3cab4');P(x,y,22,2,'#e6dfcc');P(x+21,y+1,1,18,'#a89f88');P(x,y+1,1,18,'#e6dfcc');
  P(x+3,y+4,16,12,'#c9c0a8');P(x+3,y+4,16,1,'#b8af98');for(let k=0;k<4;k++)P(x+6,y+7+k*2,10,1,'#aaa189');
  P(x+5,y+19,12,2,'#b8af98');P(x+7,y+21,8,1,'#8f876f');
}
const FACT={
  desk(o){return [26,(P,E,g,t,fw,fh,B)=>{
    const ty=t,v=o.v,wood='#a77b50';
    CRTback(P,3,ty-21);
    // tampo
    P(0,ty,fw,7,wood);P(0,ty,fw,1,'#c39368');P(0,ty+6,fw,1,'#7e5838');for(let x=4;x<fw;x+=11)P(x,ty+2,6,1,'#b28558');
    // coisas da mesa
    if(v==='renata'){for(let k=0;k<3;k++){P(34+k*5,ty-11,4,11,['#264653','#2f5a7a','#7a2f2f'][k]);P(34+k*5,ty-11,4,1,'rgba(255,255,255,.25)');P(35+k*5,ty-7,2,3,'#f1ece0');}P(50,ty-4,8,5,'#f1ece0');P(51,ty-3,6,1,'#999');}
    if(v==='denise'){P(30,ty-8,13,8,'#ece6d6');for(let k=0;k<4;k++)P(30,ty-8+k*2,13,1,'#d6cfbd');P(46,ty-5,11,5,'#2b2b2e');P(47,ty-4,4,3,'#555');P(52,ty-4,4,3,'#555');P(48,ty-3,1,1,'#ff5a4a');}
    if(v==='lemos'){P(28,ty+1,15,5,'#c9a24a');P(29,ty+1,13,1,'#e6c673');P(31,ty+3,8,1,'#6b5320');P(50,ty-6,6,7,'#f3efe4');P(56,ty-4,2,3,'#f3efe4');P(50,ty-6,6,1,'#4a2a18');}
    P(fw-13,ty-3,9,4,'#2d2d30');P(fw-12,ty-4,7,2,'#3a3a3e');P(fw-11,ty-5,5,1,'#2d2d30');
    // frente: painel e gaveteiro
    P(0,ty+7,fw,B-ty-7,'#7a5434');P(0,ty+7,fw,1,'#5a3c24');P(2,ty+9,3,B-ty-11,'#6a4a2e');
    P(fw-24,ty+8,22,B-ty-10,'#80583a');P(fw-24,ty+8,22,1,'#9a6c48');P(fw-24,ty+8,1,B-ty-10,'#6a4a2e');
    P(0,B-2,fw,2,'#3a2818');
  }];},
  deskboss(o){return [24,(P,E,g,t,fw,fh,B)=>{
    const ty=t;
    CRTback(P,fw-27,ty-21);
    // luminária de banqueiro
    P(12,ty-4,10,3,'#c9a24a');P(16,ty-14,2,10,'#c9a24a');P(9,ty-19,16,6,'#1f5a3a');P(9,ty-19,16,1,'#3f8a5a');P(10,ty-14,14,1,'#f6e7a8');
    // tampo de mogno
    P(0,ty,fw,8,'#6e4428');P(0,ty,fw,1,'#8a5a36');P(0,ty+7,fw,1,'#4a2c18');
    P(28,ty+1,32,6,'#2d3b33');P(28,ty+1,32,1,'#43594a');P(32,ty+2,12,4,'#f1ece0');P(46,ty-6,10,6,'#e9e2cf');for(let k=0;k<3;k++)P(46,ty-6+k*2,10,1,'#d6cfbd');
    P(62,ty-5,8,5,'#d9c8a0');P(63,ty-4,6,1,'#f0e2c0');P(70,ty-3,3,3,'#4a2a18');
    P(22,ty-7,5,7,'#f3efe4');P(27,ty-5,2,3,'#f3efe4');P(22,ty-7,5,1,'#4a2a18');
    // frente com almofadas e friso
    P(0,ty+8,fw,B-ty-8,'#5a3720');for(const x of [4,34,64]){P(x,ty+11,fw/3-8,B-ty-15,'#4e2f1b');P(x,ty+11,fw/3-8,1,'#3a2212');P(x,B-5,fw/3-8,1,'#6e4428');}
    P(fw/2-14,ty+9,28,4,'#c9a24a');P(fw/2-13,ty+10,26,1,'#f1dd9a');P(0,B-2,fw,2,'#2a180c');
  }];},
  chair(){return [14,(P,E,g,t,fw,fh,B)=>{P(9,0,14,17,'#2b2f36');P(9,0,14,2,'#454b54');P(10,3,12,1,'#3a3f46');P(7,15,18,6,'#3a3f46');P(7,15,18,1,'#535a63');P(15,21,2,8,'#1c1f22');P(8,29,16,2,'#1c1f22');P(7,30,3,2,'#0e0f10');P(22,30,3,2,'#0e0f10');}];},
  execchair(){return [18,(P,E,g,t,fw,fh,B)=>{P(7,0,18,21,'#3a2620');P(7,0,18,2,'#5a3a30');for(let y=4;y<18;y+=5)for(let x=10;x<24;x+=5)P(x,y,1,1,'#2a1812');P(5,19,22,6,'#4a3028');P(5,19,22,1,'#6a463a');P(4,14,3,10,'#2a1812');P(25,14,3,10,'#2a1812');P(15,25,2,6,'#1c1f22');P(8,31,16,2,'#1c1f22');}];},
  stool(){return [4,(P,E,g,t,fw,fh,B)=>{E(16,10,9,3,'#2b2f36');E(16,9,9,3,'#454b54');P(15,12,2,10,'#8a9298');E(16,23,8,2,'#5a6268');}];},
  // cadeira de visita, de costas para a câmera (virada para a mesa): o encosto fica na frente e o assento só aparece dos lados
  cadeira(){return [8,(P,E,g,t,fw,fh,B)=>{P(8,4,4,3,'#2a1812');P(20,4,4,3,'#2a1812');P(4,8,24,5,'#5a4030');P(4,8,24,1,'#7a5848');P(6,0,20,20,'#3e2c22');P(6,0,20,2,'#5e4434');P(7,2,1,17,'#4e382c');P(24,2,1,17,'#2e2018');P(9,4,14,12,'#36261c');P(9,4,14,1,'#2a1c14');P(6,20,2,8,'#2a1812');P(24,20,2,8,'#2a1812');P(6,27,2,1,'#1a0e08');P(24,27,2,1,'#1a0e08');}];},
  // cadeiras de metal do depoimento: a do depoente, atrás da mesa, vista de frente (encosto atrás do assento);
  // a de quem pergunta, do lado da câmera, vista de costas (o encosto tampa o assento, que só aparece dos lados)
  metalchair(o){return [8,(P,E,g,t,fw,fh,B)=>{
    if(o.v==='front'){
      P(9,0,2,15,'#8a9298');P(21,0,2,15,'#8a9298');P(9,0,1,15,'#a9b1b6');P(10,1,12,8,'#7d858b');P(10,1,12,1,'#a9b1b6');P(10,8,12,1,'#5a6066');
      P(10,19,2,6,'#4a5056');P(20,19,2,6,'#4a5056');
      P(7,14,18,5,'#7d858b');P(7,14,18,1,'#a9b1b6');P(7,18,18,1,'#5a6066');P(7,19,2,B-19,'#6a7076');P(23,19,2,B-19,'#6a7076');
    }else{
      P(6,10,20,4,'#7d858b');P(6,10,20,1,'#a9b1b6');P(7,14,2,9,'#4a5056');P(23,14,2,9,'#4a5056');
      P(8,0,2,B,'#8a9298');P(22,0,2,B,'#6a7076');P(8,0,1,B,'#a9b1b6');P(10,1,12,10,'#6a7076');P(10,1,12,1,'#8a9298');P(10,10,12,1,'#4a5056');
    }
  }];},
  // cadeira de espera da recepção, de frente, no estofado do sofá
  espera(){return [10,(P,E,g,t,fw,fh,B)=>{P(7,0,18,14,'#33414f');P(7,0,18,2,'#4a5d72');P(6,13,20,8,'#485b72');P(6,13,20,2,'#6a82a0');P(5,6,3,15,'#2b3644');P(24,6,3,15,'#2b3644');P(7,21,2,B-21,'#14181d');P(23,21,2,B-21,'#14181d');}];},
  shelf(o){const arq=o.v==='arq';return [arq?40:36,(P,E,g,t,fw,fh,B)=>{
    const rnd=mulberry32(o.x*31+o.y*17+fw);
    if(arq){
      const lv=4,top=2,sh=Math.floor((B-6)/lv);
      for(const x of [0,fw/2-1,fw-3]){P(x,0,3,B,'#7d868c');P(x,0,1,B,'#a9b1b6');}
      for(let r=0;r<lv;r++){const y0=top+r*sh;P(3,y0+sh-3,fw-6,3,'#9aa3a8');P(3,y0+sh-3,fw-6,1,'#c3cacf');
        let x=4;while(x<fw-10){const bw=10+Math.floor(rnd()*4),bh=sh-6-Math.floor(rnd()*2);if(x+bw>fw-4)break;if(Math.abs(x+bw/2-fw/2)<3){x+=4;continue;}
          if(rnd()<0.12){P(x,y0+sh-3-bh+3,3,bh-3,'#3b5a8a');P(x+3,y0+sh-3-bh+4,3,bh-4,'#6b8a4a');x+=8;continue;}
          const c=pick(['#b28a58','#a37b49','#c4a06c','#b89463']);P(x,y0+sh-3-bh,bw,bh,c);P(x,y0+sh-3-bh,bw,1,lt(c,.25));P(x+bw-1,y0+sh-3-bh,1,bh,dk(c,.25));
          P(x+2,y0+sh-3-bh+2,bw-4,4,'#f1ece0');P(x+3,y0+sh-3-bh+3,bw-7,1,'#7a7468');P(x+bw/2-2,y0+sh-6,4,1,'#5a4630');x+=bw+1;}}
      P(0,B-2,fw,2,'#4c5459');
    }else{
      P(0,0,fw,B,'#6b4a2e');P(0,0,fw,2,'#8a6040');P(3,3,fw-6,B-9,'#2e2016');
      const lv=3,sh=Math.floor((B-9)/lv);
      for(let r=0;r<lv;r++){const y0=3+r*sh;P(3,y0+sh-2,fw-6,2,'#8a6040');
        let x=4;while(x<fw-6){const bw=3+Math.floor(rnd()*3),bh=sh-5-Math.floor(rnd()*4);if(rnd()<0.08&&x<fw-14){P(x+2,y0+sh-6,6,4,'#c9a24a');P(x+3,y0+sh-9,4,3,'#e6c673');x+=10;continue;}
          const c=pick(['#7a2f2f','#2f4a6a','#3a5a3a','#c9a24a','#5a3a5a','#d9d4c7','#8a5a2b','#1f3a5a']);P(x,y0+sh-2-bh,bw,bh,c);P(x,y0+sh-2-bh,bw,1,lt(c,.3));P(x,y0+sh-2-bh+3,bw,1,'rgba(240,220,150,.5)');x+=bw;}}
      P(0,B-6,fw,6,'#5a3c24');P(0,B-6,fw,1,'#8a6040');
    }
  }];},
  filing(){return [30,(P,E,g,t,fw,fh,B)=>{P(4,0,24,B,'#8a9298');P(4,0,24,2,'#b9c1c6');P(27,2,1,B-2,'#6a7278');for(let k=0;k<4;k++){const y=4+k*Math.floor((B-6)/4);P(6,y,20,Math.floor((B-6)/4)-1,'#9aa3a8');P(6,y,20,1,'#c3cacf');P(12,y+2,8,3,'#f1ece0');P(13,y+3,5,1,'#7a7468');P(13,y+7,6,2,'#4c5459');}P(4,B-2,24,2,'#4c5459');P(7,-3,10,3,'#e9e2cf');P(18,-4,8,4,'#c9a24a');}];},
  plant(o){const tall=o.v==='tall';return [tall?44:30,(P,E,g,t,fw,fh,B)=>{
    const rnd=mulberry32(o.x*17+o.y*5+3);
    P(9,B-13,14,12,'#9a5436');P(8,B-14,16,3,'#b8683f');P(8,B-14,16,1,'#d0845a');P(21,B-11,2,10,'#7a3e26');P(10,B-2,12,1,'#5a2e1a');
    if(tall){for(let k=0;k<9;k++){const a=-1.6+(k-4)*0.32+rnd()*0.1,L=16+rnd()*12;for(let s=0;s<L;s++){const x=16+Math.cos(a)*s*0.8,y=B-14+Math.sin(a)*s;P(x,y,2,1,s<L*0.3?'#2f5a2a':s<L*0.7?'#3f7a35':'#5a9a45');}}P(15,B-24,2,10,'#6a4a2e');}
    else bush(P,E,16,B-22,10,rnd);
  }];},
  coffee(){return [30,(P,E,g,t,fw,fh,B)=>{
    P(1,B-18,30,18,'#8a6040');P(1,B-18,30,2,'#a87a50');P(15,B-14,1,12,'#5a3c24');P(10,B-9,3,1,'#d4af37');P(19,B-9,3,1,'#d4af37');
    P(6,2,16,20,'#2c2f33');P(6,2,16,2,'#4a4f55');P(8,5,12,3,'#1c1e20');P(19,6,2,1,'#ff5a4a');
    P(8,13,12,9,'#c9e0ea');P(8,13,12,1,'#eaf6fa');P(8,17,12,5,'#4a2a18');P(20,15,2,4,'#2c2f33');
    P(23,10,6,8,'#f3efe4');P(23,10,6,1,'#ffffff');P(24,8,4,2,'#f3efe4');P(2,14,4,8,'#e9e2cf');P(2,14,4,1,'#c9a24a');
  }];},
  xerox(){return [26,(P,E,g,t,fw,fh,B)=>{P(1,4,30,B-4,'#d3cfc4');P(1,4,30,7,'#b9b5aa');P(1,4,30,1,'#e6e2d8');P(19,6,10,4,'#5a6670');P(20,7,2,1,'#7fe0a0');P(23,7,2,1,'#f2c230');P(3,13,14,3,'#ffffff');P(3,16,14,1,'#c9c5ba');P(1,20,30,1,'#a39f94');P(1,29,30,1,'#a39f94');P(14,23,6,2,'#6a665c');P(14,32,6,2,'#6a665c');P(1,B-3,30,3,'#5a574f');}];},
  board(o){return [44,(P,E,g,t,fw,fh,B)=>{
    // quadro de cortiça em cavalete com rodinhas, em pé e de frente para a câmera
    for(const x of [2,fw-5]){P(x,0,3,B-3,'#4a3a2a');P(x,0,1,B-3,'#6a5640');P(x-1,-1,5,2,'#2e241a');}
    P(0,B-5,8,2,'#2e241a');P(fw-8,B-5,8,2,'#2e241a');for(const x of [0,6,fw-8,fw-2])P(x,B-3,2,3,'#111');
    P(4,B-12,fw-8,2,'#4a3a2a');
    P(5,2,fw-10,B-20,'#5a3c24');P(5,2,fw-10,2,'#7a5434');P(8,5,fw-16,B-26,'#b0814f');
    P(6,B-18,fw-12,2,'#7a8086');P(6,B-18,fw-12,1,'#a2a9ae');P(20,B-19,8,1,'#c0392b');P(30,B-19,8,1,'#2f5a8a');
    for(let k=0;k<70;k++)P(9+Math.floor(hash(k,1,o.x)*(fw-18)),6+Math.floor(hash(k,2,o.x)*(B-28)),1,1,hash(k,3,o.x)<0.5?'#9a6e3e':'#c4945e');
    P(10,7,22,6,'#f6efc9');P(11,9,18,1,'#7a6a4a');P(fw-34,8,24,16,'#e8e4da');for(let k=0;k<4;k++)P(fw-32,10+k*3,20,1,['#9cc0d8','#c9a24a','#9cc0d8','#7aa86a'][k]);
    const ph=[[11,16,'#6f8aa0'],[27,14,'#a0856f'],[44,17,'#7a8f6e'],[59,15,'#9a7a8a'],[73,26,'#8a8f96'],[18,30,'#8a7a6a'],[52,30,'#6a7a8a']];
    const pins=[];
    ph.forEach(([x,y,c],k)=>{if(x>fw-14)return;P(x,y,13,15,'#f1ece0');P(x+1,y+1,11,10,c);P(x+1,y+1,11,3,lt(c,.2));P(x+3,y+12,7,1,'#777');const red=k<FOUND.length;P(x+5,y-1,3,3,red?'#d6382c':'#3b6aa8');pins.push([x+6,y]);});
    g.strokeStyle='#c0392b';g.lineWidth=1;g.beginPath();pins.slice(0,Math.max(2,FOUND.length)).forEach(([x,y],k)=>k?g.lineTo(x+.5,y+.5):g.moveTo(x+.5,y+.5));g.stroke();
    P(34,B-29,16,8,'#f6efc9');P(36,B-27,12,1,'#777');P(36,B-24,8,1,'#777');
  }];},
  bench(o){return [26,(P,E,g,t,fw,fh,B)=>{
    const ty=t;
    // microscópio
    P(10,ty-4,16,4,'#2a2d30');P(18,ty-20,4,16,'#3a3e42');P(14,ty-24,8,5,'#2a2d30');P(13,ty-26,4,3,'#1c1e20');P(12,ty-9,12,2,'#5a6670');P(22,ty-14,3,3,'#8a9298');
    // lupa com braço
    P(fw-30,ty-3,6,3,'#5a6670');P(fw-28,ty-16,2,13,'#8a9298');P(fw-28,ty-17,12,2,'#8a9298');E(fw-14,ty-14,6,3,'#2f3438');E(fw-14,ty-14,4,2,'#bfe3ff');
    // vidraria
    P(38,ty-10,6,10,'#cfe6ee');P(38,ty-5,6,5,'#7fc0a0');P(39,ty-9,1,8,'#ffffff');P(47,ty-7,5,7,'#cfe6ee');P(47,ty-4,5,4,'#d97a7a');P(55,ty-12,3,12,'#cfe6ee');P(55,ty-6,3,6,'#8fb0d8');
    P(64,ty-6,18,6,'#e9e4d0');P(64,ty-6,18,1,'#ffffff');P(66,ty-4,8,1,'#999');P(84,ty-8,12,8,'#c4a06c');P(84,ty-8,12,1,'#d8bd8a');P(87,ty-6,6,3,'#f1ece0');
    // tampo de aço e armários
    P(0,ty,fw,7,'#b5bec3');P(0,ty,fw,1,'#dfe6ea');P(0,ty+6,fw,1,'#7d868c');
    // lado da câmera: as costas da bancada (as gavetas ficam do lado do perito)
    P(0,ty+7,fw,B-ty-7,'#6a757c');P(0,ty+7,fw,1,'#4e575d');for(let x=31;x<fw-2;x+=31)P(x,ty+8,1,B-ty-10,'#5a646b');P(0,B-5,fw,1,'#5a646b');
    P(0,B-2,fw,2,'#3a4248');
  }];},
  lightbox(o){return [22,(P,E,g,t,fw,fh,B)=>{
    const ty=t;
    P(4,0,fw-8,ty+2,'#3d4850');P(6,2,fw-12,ty-2,'#eaf4ff');P(6,2,fw-12,1,'#ffffff');
    [[12,5,'#6f8aa0'],[32,4,'#a0856f'],[52,6,'#7a8f6e'],[70,4,'#8a7a6a']].forEach(([x,y,c],k)=>{if(x<fw-20&&k<Math.max(1,FOUND.length)){P(x,y,15,11,'#f1ece0');P(x+1,y+1,13,8,c);}});
    P(0,ty+2,fw,6,'#b5bec3');P(0,ty+2,fw,1,'#dfe6ea');P(0,ty+8,fw,B-ty-8,'#6a757c');P(2,ty+10,fw-4,B-ty-13,'#5a646b');P(fw/2-3,ty+14,6,1,'#c9ccce');P(0,B-2,fw,2,'#3a4248');
  }];},
  bagtable(){return [16,(P,E,g,t,fw,fh,B)=>{
    const ty=t;
    for(const [x,h,c] of [[4,14,'#b08a5a'],[18,11,'#c4a06c'],[30,15,'#a37b49']]){P(x,ty-h,11,h,c);P(x,ty-h,11,2,dk(c,.15));P(x+2,ty-h+4,7,4,'#f1ece0');P(x+2,ty-h+2,7,1,'#c0392b');}
    P(44,ty-7,16,7,'#e9e4d0');P(44,ty-7,16,1,'#ffffff');P(46,ty-5,10,1,'#c0392b');
    P(0,ty,fw,6,'#aab3b8');P(0,ty,fw,1,'#d0d8dc');P(0,ty+6,fw,2,'#6a757c');P(2,ty+8,3,B-ty-8,'#5a646b');P(fw-5,ty+8,3,B-ty-8,'#5a646b');
  }];},
  locker(){return [36,(P,E,g,t,fw,fh,B)=>{P(2,0,28,B,'#6f7a80');P(2,0,28,2,'#9aa5ab');P(16,2,1,B-4,'#4c5459');for(const x of [4,18]){P(x,3,10,B-6,'#7d888e');for(let k=0;k<4;k++)P(x+2,6+k*2,6,1,'#4c5459');P(x+3,15,4,3,'#f1ece0');P(x+(x===4?8:1),26,1,5,'#c9a24a');}P(2,B-2,28,2,'#3a4248');}];},
  counter(o){return [20,(P,E,g,t,fw,fh,B)=>{
    const ty=t;
    // atrás do balcão: monitor e telefone do plantão
    CRTback(P,10,ty-24);P(40,ty-9,10,5,'#2d2d30');P(41,ty-10,8,2,'#3a3a3e');
    // tampo alto e itens
    P(0,ty-6,fw,6,'#c4a06c');P(0,ty-6,fw,1,'#e0c08a');P(0,ty-1,fw,1,'#8a6040');
    P(fw-58,ty-9,22,4,'#f6f2e6');P(fw-47,ty-9,1,4,'#c9c2b3');P(fw-56,ty-8,8,1,'#999');P(fw-45,ty-8,8,1,'#999');P(fw-60,ty-5,26,1,'#3a5a8a');
    E(fw-24,ty-8,3,2,'#c9ccce');P(fw-25,ty-11,2,2,'#e8eaec');P(fw-14,ty-12,3,7,'#2b2f36');
    // frente com o painel do DHPP
    P(0,ty,fw,B-ty,'#7a5434');for(let x=6;x<fw;x+=16)P(x,ty+2,1,B-ty-6,'#6a462a');P(0,ty,fw,1,'#5a3c24');
    P(fw/2-26,ty+4,52,12,'#1c1f22');P(fw/2-25,ty+5,50,1,'#3a3f44');P(fw/2-26,ty+15,52,1,'#c9a24a');
    const a=txtW(g,'DHPP',9,2.6);txt(g,'DHPP',fw/2-a/2,ty+13,9,'#e8ecef',2.6);
    P(0,B-4,fw,4,'#4a2c18');P(0,B-4,fw,1,'#6a462a');
  }];},
  sofa(){return [12,(P,E,g,t,fw,fh,B)=>{
    P(4,0,fw-8,14,'#33414f');P(4,0,fw-8,2,'#4a5d72');for(const x of [fw/3|0,(fw*2/3)|0])P(x,2,1,12,'#26323e');
    P(4,13,fw-8,11,'#485b72');P(4,13,fw-8,2,'#6a82a0');for(const x of [fw/3|0,(fw*2/3)|0])P(x,13,1,11,'#33414f');
    P(0,4,6,B-8,'#2b3644');P(0,4,6,2,'#4a5b70');P(fw-6,4,6,B-8,'#2b3644');P(fw-6,4,6,2,'#4a5b70');
    P(4,24,fw-8,B-28,'#2b3644');P(4,24,fw-8,1,'#1f2833');P(3,B-4,3,4,'#14181d');P(fw-6,B-4,3,4,'#14181d');
    P(10,6,14,8,'#c9a24a');P(10,6,14,2,'#e0bc66');
  }];},
  cooler(){return [32,(P,E,g,t,fw,fh,B)=>{P(9,0,14,14,'#8fc8e0');P(9,0,14,2,'#cfeaf6');P(10,3,2,9,'#d9f0fa');P(9,8,14,6,'#6ab0d0');P(13,14,6,2,'#6a9ab0');P(7,16,18,B-16,'#e6e8ea');P(7,16,18,2,'#ffffff');P(24,18,1,B-20,'#b8bcc0');P(10,22,3,3,'#2f6aa0');P(19,22,3,3,'#c0392b');P(9,27,14,2,'#9aa0a6');P(7,B-3,18,3,'#8a9096');}];},
  itable(){return [10,(P,E,g,t,fw,fh,B)=>{
    const ty=t;
    P(0,ty,fw,fh-6,'#7a8086');P(0,ty,fw,2,'#a2a9ae');P(2,ty+2,fw-4,1,'#8a9196');P(0,ty+fh-6,fw,5,'#4a4f55');P(0,ty+fh-6,fw,1,'#62686e');
    P(4,ty+fh-1,3,B-(ty+fh-1),'#3a3e42');P(fw-7,ty+fh-1,3,B-(ty+fh-1),'#3a3e42');
    P(fw-40,ty+12,14,8,'#222');P(fw-38,ty+13,10,3,'#3a3a3a');P(fw-37,ty+17,2,2,'#c0392b');P(fw-33,ty+17,2,2,'#555');P(fw-29,ty+17,2,2,'#555');
    P(18,ty+6,5,8,'#e8eef0');P(18,ty+6,5,1,'#ffffff');P(26,ty+9,5,8,'#e8eef0');P(26,ty+9,5,1,'#ffffff');
    P(36,ty+22,18,12,'#d9cba0');P(36,ty+22,18,1,'#efe2b8');P(38,ty+25,14,1,'#8a7a50');P(38,ty+28,10,1,'#8a7a50');
    E(fw-20,ty+28,5,3,'#55595e');E(fw-20,ty+27,3,2,'#33363a');E(fw/2,ty+4,2,1.5,'#b9c1c6');
  }];},
  boxes(){return [22,(P,E,g,t,fw,fh,B)=>{
    for(const [x,y,w,h,c] of [[2,B-14,28,14,'#b08a5a'],[5,B-25,22,11,'#c4a06c']]){P(x,y,w,h,c);P(x,y,w,1,lt(c,.25));P(x+w-1,y,1,h,dk(c,.25));P(x+w/2-5,y+3,10,5,'#f1ece0');P(x+w/2-4,y+4,6,1,'#5a5a5a');P(x+w/2-2,y+h-3,4,1,dk(c,.4));}
  }];},
  car(){return [18,(P,E,g,t,fw,fh,B)=>drawCarPx(P,E,{b:'#e4e7e3',hi:'#f6f8f5',sh:'#b9beba',dk:'#8d938f',fr:'#cfd3cf'},true)];},
  tree(o){return [48,(P,E,g,t,fw,fh,B)=>{const rnd=mulberry32(o.x*13+o.y*7+1);P(13,B-28,6,28,'#5a3a22');P(13,B-28,2,28,'#7a5232');P(11,B-3,10,3,'#3e2716');bush(P,E,16,B-44,18,rnd);}];},
  flag(o){return [44,(P,E,g,t,fw,fh,B)=>{P(15,0,2,B,'#c9ccce');P(15,0,1,B,'#eef0f2');P(12,B-4,8,4,'#6a6e72');E(16,0,2,1.5,'#e8c63a');}];},
  // divisória de vidro sobre mureta (v: 'senha' com o painel de senha, 'restrito' com a placa de área restrita)
  glasswall(o){return [40,(P,E,g,t,fw,fh,B)=>{
    P(0,6,fw,B-22,'rgba(176,206,226,.42)');for(let x=8;x<fw;x+=26){for(let j=0;j<16;j++)P(x+j,10+j*1.6,2,1,'rgba(255,255,255,.35)');}
    P(0,4,fw,3,'#a9b0b6');P(0,4,fw,1,'#d4dade');for(let x=0;x<=fw-3;x+=T)P(Math.min(x,fw-3),4,3,B-20,'#8a9096');
    P(0,B-16,fw,14,'#6e737a');P(0,B-16,fw,2,'#9aa0a6');P(0,B-3,fw,3,'#4a4f55');
    if(o.v==='senha'){P(fw/2-18,12,36,14,'#14161a');P(fw/2-17,13,34,1,'#2a2e34');txt(g,'042',fw/2-12,23,9,'#ff4a3a',1.4);P(fw/2-18,26,36,2,'#2a2e34');}
    if(o.v==='restrito'){P(6,12,fw-12,16,'#b02a24');P(6,12,fw-12,1,'#d8524a');const sp1=Math.max(0,Math.min(1.2,(fw-18-txtW(g,'ÁREA RESTRITA',6,0))/12)),a=txtW(g,'ÁREA RESTRITA',6,sp1);txt(g,'ÁREA RESTRITA',fw/2-a/2,21,6,'#ffffff',sp1);const b2=txtW(g,'SÓ AGENTES',5,.8);txt(g,'SÓ AGENTES',fw/2-b2/2,27,5,'#ffe2de',.8);/* o texto cabe na placa, qualquer que seja a fonte */}
  }];},
  // porta de acesso: vidro jateado com a faixa "ACESSO RESTRITO", batente de aço e leitor de crachá ao lado (luz vermelha;
  // verde quando abre). Aberta, a folha some de lado e mostra o corredor.
  secdoor(o){return [40,(P,E,g,t,fw,fh,B)=>{
    P(0,4,fw,3,'#a9b0b6');P(0,4,fw,1,'#d4dade');P(0,4,3,B-6,'#7a8086');P(fw-3,4,3,B-6,'#7a8086');
    if(o.open){P(3,7,fw-6,B-10,'rgba(40,46,54,.55)');P(fw-9,7,6,B-10,'rgba(176,206,226,.55)');P(fw-9,7,1,B-10,'#d4dade');}
    else{P(3,7,fw-6,B-10,'rgba(196,214,228,.62)');for(let j=0;j<14;j++)P(8+j,12+j*1.5,2,1,'rgba(255,255,255,.4)');P(3,18,fw-6,7,'rgba(255,255,255,.55)');P(3,21,fw-6,1,'#b02a24');
      P(fw-10,B/2-2,2,8,'#8a9096');}
    // leitor de crachá no batente: vermelho fechado, verde ao abrir
    P(fw-8,14,6,10,'#2a2e34');P(fw-8,14,6,1,'#5a6066');P(fw-7,16,4,3,'#14161a');E(fw-5,22,1.4,1.4,o.open?'#3bd16f':'#e04a3a');
    P(0,B-3,fw,3,'#4a4f55');
  }];},
  // espelho de observação na parede da sala de depoimentos
  mirror(){return [34,(P,E,g,t,fw,fh,B)=>{
    P(0,0,fw,B-14,'#3a3f45');P(2,2,fw-4,B-18,'#1e2630');for(let j=0;j<B-20;j++){const x=fw*.6-j*.8;if(x>4)P(x,3+j,6,1,'rgba(200,220,240,.14)');}P(2,2,fw-4,1,'rgba(255,255,255,.18)');
  }];},
  // gaiola de provas: tela de aço, caixas lacradas com etiqueta vermelha, plaqueta PROVAS
  evidcage(){return [40,(P,E,g,t,fw,fh,B)=>{
    for(const [x,y,w,h,c] of [[6,B-30,20,14,'#b08a5a'],[30,B-24,22,10,'#c4a06c'],[10,B-46,16,12,'#a37b49'],[34,B-40,18,12,'#b08a5a']]){P(x,y,w,h,c);P(x,y,w,1,lt(c,.25));P(x+3,y+3,8,4,'#f1ece0');P(x+3,y+2,8,1,'#c0392b');}
    for(let x=0;x<fw;x+=4)P(x,0,1,B-4,'rgba(60,66,72,.55)');for(let y=0;y<B-4;y+=4)P(0,y,fw,1,'rgba(60,66,72,.45)');
    P(0,0,fw,3,'#6a7278');P(0,0,2,B,'#5a6066');P(fw-2,0,2,B,'#5a6066');P(0,B-4,fw,4,'#4a4f55');
    P(fw/2-14,6,28,9,'#b02a24');const a=txtW(g,'PROVAS',6,1.3);txt(g,'PROVAS',fw/2-a/2,13,6,'#ffffff',1.3);
  }];},
  wetsign(){return [16,(P,E,g,t,fw,fh,B)=>{for(let y=0;y<B-4;y++){const w=Math.round(4+y*0.42);P(16-w/2,y+2,w,1,y%7<1?'#2b2b2b':'#f2c230');}P(13,12,6,6,'#2b2b2b');P(15,13,2,3,'#f2c230');P(15,17,2,1,'#f2c230');P(6,B-4,20,3,'#c99a20');}];}
};
function drawCarPx(P,E,C,pol){
  const RR=(x,y,w,h,c,r)=>{for(let j=0;j<h;j++){const k=j<r?r-j:j>h-1-r?r-(h-1-j):0;P(x+k,y+j,w-2*k,1,c);}};
  const TR=(y0,y1,a0,b0,a1,b1,c)=>{for(let y=y0;y<y1;y++){const u=(y-y0)/Math.max(1,y1-y0-1),l=Math.round(a0+(a1-a0)*u),r=Math.round(b0+(b1-b0)*u);P(l,y,r-l,1,c);}};
  for(const [x,y,h] of [[5,11,12],[53,11,12],[4,57,17],[54,57,17]]){P(x,y,6,h,'#121214');P(x+(x<10?1:3),y+2,2,h-4,'#2c2d30');}
  for(let y=2;y<77;y++){
    let ins=0;if(y<11)ins=Math.round(Math.pow((11-y)/9,1.6)*9);if(y>72)ins=y-72;
    const arch=(y>=9&&y<=24)||(y>=55&&y<=74)?1:0;
    const l=7+ins-arch,r=57-ins+arch,w=r-l;if(w<=0)continue;
    P(l,y,w,1,C.b);P(l,y,2,1,C.hi);P(r-3,y,3,1,C.sh);P(r-1,y,1,1,C.dk);
  }
  P(11,6,6,3,'#b0302a');P(47,6,6,3,'#b0302a');P(12,6,2,1,'#ff7a6a');P(48,6,2,1,'#ff7a6a');P(16,4,32,1,C.hi);
  TR(13,24,18,46,15,49,'#1c2833');P(19,15,8,1,'#56758c');P(19,16,4,1,'#3d5568');
  RR(15,24,34,20,C.hi,4);P(18,26,24,1,'rgba(255,255,255,.6)');P(17,27,1,14,'rgba(255,255,255,.3)');P(46,27,2,15,'rgba(0,0,0,.12)');
  if(pol){P(17,30,30,8,'#26282c');P(18,31,13,5,'#7a1a18');P(33,31,13,5,'#1a2f6a');P(17,38,30,1,'#111');}
  TR(44,56,15,49,12,52,'#1a2631');for(let k=0;k<6;k++)P(20+k*2,46+k,3,1,'rgba(150,185,210,.55)');P(39,47,5,1,'rgba(150,185,210,.35)');
  P(14,44,1,12,C.dk);P(49,44,1,12,C.dk);
  P(6,45,4,3,C.dk);P(6,45,4,1,C.hi);P(54,45,4,3,C.dk);P(54,45,4,1,C.hi);
  P(11,57,42,1,C.hi);P(22,58,1,9,C.sh);P(41,58,1,9,C.sh);
  if(pol){P(9,61,46,3,'#1e3f7a');P(9,61,46,1,'#2f5aa8');}
  P(8,68,48,8,C.fr);P(8,68,48,1,C.dk);
  P(20,69,24,4,'#1c1d20');for(let x=21;x<43;x+=3)P(x,70,1,2,'#3a3c40');
  P(9,69,10,4,'#f4ecc8');P(10,70,4,2,'#fffbe8');P(45,69,10,4,'#f4ecc8');P(50,70,4,2,'#fffbe8');
  P(9,73,3,2,'#e08a2a');P(52,73,3,2,'#e08a2a');
  P(6,75,52,4,'#2b2c30');P(6,75,52,1,'#45474c');P(27,74,10,4,'#e8e8e2');P(28,75,8,1,'#5a5a5a');
  P(7,79,50,2,'rgba(0,0,0,.35)');
}
function makeSprite(o){
  const f=FACT[o.t];if(!f)return null;
  const fw=o.w*T,fh=o.h*TH,[t,fn]=f(o);
  const c=outlined(refine(S2(fw,fh+t,(P,E,g)=>fn(P,E,g,t,fw,fh,t+fh)),o.x*7+o.y));
  return {c,x:o.x*T-1,y:o.y*TH-t-1,t};
}

/* ---------- Arte: gente (mesma construção da casa, com rosto fino de perto) ---------- */
const LOOK={
  lemos:{skin:'#d9a273',hair:'#2a1d18',style:'side',kind:'civil',top:'#2b2f36',pants:'#1f242b',shoes:'#111',tie:'#7a2a2a',badge:1},
  sonia:{skin:'#c98e64',hair:'#4a2f1d',style:'bun',kind:'civil',top:'#1c1d20',pants:'#1c1d20',shoes:'#111'},
  mauricio:{skin:'#e0b48c',hair:'#9a9a9a',style:'grey',glasses:1,kind:'lab',top:'#e6e6e0',pants:'#2b2f36',shoes:'#1a1a1a',gloves:1},
  renata:{skin:'#e0b48c',hair:'#1f1a18',style:'long',kind:'civil',top:'#3b7a6b',pants:'#2b2f36',shoes:'#222'},
  denise:{skin:'#a8714a',hair:'#2a1d18',style:'curly',kind:'civil',top:'#7b5a8a',pants:'#2b2f36',shoes:'#222',glasses:1},
  paulo:{skin:'#b67c52',hair:'#1f1a18',style:'side',kind:'campo',top:'#3a2b22',pants:'#3b5a8a',shoes:'#3a2416'},
  plantao:{skin:'#f0c9a0',hair:'#3a2416',style:'cap',kind:'pm',top:'#7d8187',pants:'#2b2f36',shoes:'#111'},
  guarda:{skin:'#8a5a3a',hair:'#1f1a18',style:'cap',kind:'pm',top:'#2b3a55',pants:'#1c1f26',shoes:'#111'},
  livia:{skin:'#e8b58e',hair:'#7a4a2a',style:'bun',kind:'civil',top:'#26282c',pants:'#2b2f36',shoes:'#e8e4da'},
  caio:{skin:'#d9a273',hair:'#3a2416',style:'curly',kind:'civil',top:'#1e1f22',pants:'#3b4a6a',shoes:'#e8e4da'},
  teo:{skin:'#c98e64',hair:'#2a1d18',style:'short',kind:'civil',top:'#1c1d20',pants:'#2b2f36',shoes:'#222'},
  rafael:{skin:'#d9a273',hair:'#2a1d18',style:'curly',kind:'civil',top:'#25272b',pants:'#3b5a8a',shoes:'#e8e4da'},
  cida:{skin:'#c98e64',hair:'#4a3a30',style:'bun',kind:'civil',top:'#6a2230',pants:'#3a3030',shoes:'#222'},
  jorge:{skin:'#8a5a3a',hair:'#9a9a9a',style:'grey',kind:'civil',top:'#2b2f2a',pants:'#3a3a32',shoes:'#222'},
  faxina:{skin:'#a8714a',hair:'#1f1a18',style:'curly',kind:'apoio',top:'#5a8aa8',pants:'#3a4a5a',shoes:'#e8e8e8'}
};
// gestos de quem está parado: cada um tem um quadro em pé e um sentado (ver poseFrame)
const POSES=['phone','drink','cross','stretch','read','chin','watch','scratch'];
// quadros: 0–3 andando, 4 sentado, depois cada gesto em pé (5+2k) e sentado (6+2k)
const poseFrame=(pose,sit)=>{const k=POSES.indexOf(pose);return k<0?(sit?4:0):5+k*2+(sit?1:0);};
const isSitF=f=>f===4||(f>4&&(f-5)%2===1);
const poseOfF=f=>f>4?POSES[(f-5)>>1]:null;
function personFrames(L){
  const sh=c=>rgbs(mul(hex(c),0.78)),hi=c=>rgbs(mix(hex(c),[255,255,255],0.18));
  const frames=[];
  for(let f=0;f<5+POSES.length*2;f++){
    const sit=isSitF(f),pose=poseOfF(f);
    const c=S2(26,46,(P,E)=>{
      const cr=sit?4:0;const lp=f===1?1:f===3?-1:0;
      if(sit){P(7,36,6,4,L.pants);P(14,37,6,3,L.pants);P(6,40,7,3,L.shoes);P(15,40,6,3,L.shoes);}
      else{P(8,31,5,10+lp,L.pants);P(14,31,5,10-lp,L.pants);P(13,31,1,4,sh(L.pants));P(10,32,1,7+lp,lt(L.pants,.08));P(16,32,1,7-lp,lt(L.pants,.08));P(7+(lp>0?-1:0),41+lp,6,3,L.shoes);P(14+(lp<0?1:0),41-lp,6,3,L.shoes);P(8+(lp>0?-1:0),41+lp,2,1,lt(L.shoes,.35));P(15+(lp<0?1:0),41-lp,2,1,lt(L.shoes,.35));}
      const ty=18+cr;P(7,ty,12,13,L.top);P(7,ty,2,13,hi(L.top));P(17,ty,2,13,sh(L.top));P(7,ty+12,12,1,sh(L.pants));P(7,ty+11,12,1,'#1a1816');P(12,ty+11,2,1,'#a89878');
      if(L.kind==='civil'){P(11,ty,4,3,'#e8e4da');if(L.tie){P(12,ty+1,2,9,L.tie);P(12,ty+1,1,1,lt(L.tie,.35));}P(10,ty+1,1,6,sh(L.top));P(15,ty+1,1,6,sh(L.top));P(9,ty+7,1,1,sh(L.top));P(16,ty+7,1,1,sh(L.top));if(L.badge){P(8,ty+8,3,3,'#d4af37');P(8,ty+8,1,1,'#fff3b0');}}
      if(L.kind==='lab'){P(12,ty,2,13,'#c9c9c0');P(8,ty+8,3,3,'#d4d4cc');P(7,ty+12,12,1,'#b9b9b0');}
      if(L.kind==='campo'){P(11,ty+1,4,10,'#cfc8b8');P(8,ty+8,2,2,'#d4af37');}
      if(L.kind==='pm'){P(5,ty,2,3,'#c0392b');P(17,ty+7,2,5,'#111');P(8,ty+2,2,1,'#d4af37');P(7,ty+11,12,2,'#23262b');}
      const as=f===1?1:f===3?-1:0;const hand=L.gloves?'#f2f2f2':L.skin;
      const hy=3+cr,top=L.top;
      const armL=()=>{if(sit){P(5,ty+3,2,7,top);P(7,ty+9,2,2,hand);}else{P(5,ty+1+as,2,9,hi(top));P(5,ty+10+as,2,2,hand);}};
      const armR=()=>{if(sit){P(19,ty+3,2,7,top);P(17,ty+9,2,2,hand);}else{P(19,ty+1-as,2,9,sh(top));P(19,ty+10-as,2,2,hand);}};
      switch(pose){
        case null:armL();armR();break;
        case 'phone':armL();P(19,ty+1,2,4,sh(top));P(19,hy+9,2,ty+1-(hy+9),top);break;
        case 'drink':armL();P(19,ty+1,2,5,sh(top));P(17,ty+4,3,2,top);P(16,ty-2,2,7,top);break;
        case 'chin':armL();P(19,ty+1,2,5,sh(top));P(17,ty+4,3,2,top);P(16,ty-2,2,7,top);break;
        case 'cross':P(5,ty+1,2,5,hi(top));P(19,ty+1,2,5,sh(top));P(6,ty+4,14,4,top);P(6,ty+4,14,1,hi(top));P(6,ty+7,14,1,sh(top));P(17,ty+4,2,2,hand);P(7,ty+6,2,2,hand);break;
        case 'read':P(5,ty+1,2,5,hi(top));P(19,ty+1,2,5,sh(top));P(6,ty+5,3,2,top);P(17,ty+5,3,2,top);
          P(8,ty+1,10,8,'#f1ece0');P(8,ty+1,10,1,'#ffffff');for(const [y,w] of [[3,7],[5,6],[7,7]])P(9,ty+y,w,1,'#9a948a');P(7,ty+4,2,3,hand);P(17,ty+4,2,3,hand);break;
        case 'watch':armR();P(5,ty+1,2,4,hi(top));P(6,ty+4,9,2,top);P(10,ty+4,2,2,'#c9a24a');P(15,ty+4,2,2,hand);break;
        case 'scratch':case 'stretch':if(pose==='scratch')armL();break;
      }
P(11,hy+12,4,3,sh(L.skin));P(7,hy+1,12,11,L.skin);P(8,hy,10,13,L.skin);P(17,hy+1,2,11,sh(L.skin));
      P(10,hy+6,1,2,'#1a1412');P(15,hy+6,1,2,'#1a1412');P(12,hy+10,2,1,sh(sh(L.skin)));P(9,hy+9,1,1,'rgba(200,90,80,.35)');P(16,hy+9,1,1,'rgba(200,90,80,.35)');
      if(L.glasses){P(9,hy+5,3,1,'#2a2a2a');P(14,hy+5,3,1,'#2a2a2a');P(12,hy+6,2,1,'#2a2a2a');}
      const hc=L.hair;const hh=lt(hc,.28);
      switch(L.style){
        case 'short':P(7,hy-1,12,4,hc);P(6,hy,1,6,hc);P(19,hy,1,6,hc);P(8,hy+3,3,1,hc);P(9,hy-1,4,1,hh);break;
        case 'side':P(7,hy-1,12,4,hc);P(6,hy,1,6,hc);P(19,hy,1,5,hc);P(7,hy+3,6,2,hc);P(9,hy-1,5,1,hh);P(14,hy,2,1,hh);break;
        case 'long':P(7,hy-1,12,4,hc);P(5,hy,3,15,hc);P(18,hy,3,15,hc);P(8,hy+3,4,1,hc);P(9,hy-1,5,1,hh);P(5,hy+2,1,8,hh);break;
        case 'curly':E(13,hy+1,8,4,hc);E(7,hy+4,2,3,hc);E(19,hy+4,2,3,hc);break;
        case 'grey':P(7,hy,12,2,hc);P(6,hy+1,2,6,hc);P(18,hy+1,2,6,hc);break;
        case 'bun':P(7,hy-1,12,4,hc);P(6,hy,1,8,hc);P(19,hy,1,8,hc);E(13,hy-2,5,3,hc);P(8,hy+3,3,1,hc);P(14,hy+3,1,1,'#9a8a7a');P(11,hy-3,4,1,hh);P(9,hy-1,3,1,hh);break;
        case 'cap':P(6,hy-2,14,5,'#23262b');P(5,hy+3,16,2,'#16181c');P(12,hy-1,2,2,'#d4af37');P(6,hy+5,1,4,hc);P(19,hy+5,1,4,hc);break;
      }
      // o que passa na frente da cabeça: telefone no ouvido, xícara, mão no queixo, mão na cabeça, braços para cima
      if(pose==='phone'){P(17,hy+4,2,7,'#1c1e22');P(17,hy+4,1,7,'#3a3e44');P(18,hy+7,2,3,hand);}
      if(pose==='drink'){P(14,hy+8,4,5,'#f3efe4');P(14,hy+8,4,1,'#4a2a18');P(18,hy+9,1,2,'#f3efe4');P(16,hy+11,3,2,hand);}
      if(pose==='chin')P(14,hy+11,4,2,hand);
      if(pose==='scratch'){P(19,hy+3,2,ty+3-(hy+3),sh(top));P(16,hy-1,4,3,hand);}
      if(pose==='stretch'){P(5,hy-1,2,ty+2-(hy-1),hi(top));P(19,hy-1,2,ty+2-(hy-1),sh(top));P(5,hy-3,2,2,hand);P(19,hy-3,2,2,hand);}
    });
    frames.push(outlined(refine(c,3)));
  }
  return frames;
}
function personFramesHD(L,base){
  return base.map((fr,f)=>{
    const c=document.createElement('canvas');c.width=fr.width*2;c.height=fr.height*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(fr,0,0,c.width,c.height);
    const H=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round((x+1)*2),Math.round((y+1)*2),Math.max(1,Math.round(w*2)),Math.max(1,Math.round(h*2)));};
    const pose=poseOfF(f),cr=isSitF(f)?4:0,hy=3+cr,ty=18+cr,sk=hex(L.skin),skin=L.skin,sh=rgbs(mul(sk,0.82)),dkk=rgbs(mul(sk,0.62));
    const hair=L.hair||'#2a1d18',hairHi=rgbs(mix(hex(hair),[255,255,255],0.3)),brow=rgbs(mul(hex(hair==='#9a9a9a'?'#6a6a6a':hair),0.8));
    for(const ex of [10,15])H(ex,hy+6,1,2,skin);H(11,hy+9,2,1,skin);
    for(const ex of [10,15]){H(ex-0.5,hy+5.5,1.5,1.5,'#f4f1ea');H(ex,hy+6,1,1,'#2a1a14');H(ex,hy+6,0.5,0.5,'#ffffff');}
    if(L.style!=='cap'){H(9.5,hy+4.5,1,.5,brow);H(10.5,hy+5,1,.5,brow);H(14.5,hy+5,1,.5,brow);H(15.5,hy+4.5,1,.5,brow);}
    H(12.5,hy+8,1,1,sh);H(12.5,hy+9,1,.5,dkk);
    H(11.5,hy+10.5,3,.5,'#7a3a30');H(12,hy+11,2,.5,rgbs(mix(sk,[200,90,80],0.3)));
    H(6.5,hy+6,.5,2,skin);H(19,hy+6,.5,2,sh);
    if(L.glasses){for(const gx of [9,14]){H(gx,hy+5,3,.5,'#2a2a2a');H(gx,hy+7.5,3,.5,'#2a2a2a');H(gx,hy+5,.5,3,'#2a2a2a');H(gx+2.5,hy+5,.5,3,'#2a2a2a');H(gx+0.5,hy+5.5,.5,.5,'rgba(255,255,255,.85)');}H(12,hy+6,2,.5,'#2a2a2a');}
    if(L.style!=='cap'&&L.style!=='curly'){H(9,hy-0.5,2.5,.5,hairHi);H(13,hy,2,.5,hairHi);H(16,hy-0.5,1,.5,hairHi);}
    if(L.style==='bun'){H(11,hy-3.5,4,.5,hairHi);H(16,hy+6,.5,4,hc2(hair));}
    if(L.style==='cap'){H(11.5,hy-1.5,1,1,'#f0d060');H(4.5,hy+3.5,15,.5,'rgba(255,255,255,.18)');}
    const top=hex(L.top||'#888888');
    // braços cruzados e papel na mão tampam o peito: sem os detalhes da roupa por cima
    if(pose!=='cross'&&pose!=='read'&&pose!=='watch')switch(L.kind){
      case 'pm':
        H(6.5,ty,2.5,.5,'#2b2f36');H(17,ty,2.5,.5,'#2b2f36');H(8,ty+2,1.5,1.5,'#d4af37');H(8.5,ty+1.5,.5,2.5,'#f0d060');H(7.5,ty+2.5,2.5,.5,'#f0d060');
        H(14,ty+3,3,.75,'#1d1f22');H(14.25,ty+3.2,2.5,.3,'#c9ccd0');H(12,ty+11.5,2,1,'#c9ccd0');break;
      case 'campo':
        for(const y of [3,5,7])H(12.75,ty+y,.5,.5,'#a09a8c');H(10.5,ty,1.5,1,'#e8e2d4');H(14,ty,1.5,1,'#e8e2d4');H(8,ty+8,.5,.5,'#fff3a0');break;
      case 'lab':
        H(10.5,ty,1.5,4,'#ffffff');H(14,ty,1.5,4,'#ffffff');H(11,ty+1,4,1,'#5a7a9a');H(8,ty+8,2.5,2.5,'#e8e8e2');H(8.5,ty+8.3,1.5,.5,'#3a5a8a');H(16,ty+2,.5,3,'#3a5a8a');break;
      default:
        H(10,ty,6,.5,rgbs(mix(top,[255,255,255],0.25)));
        if(L.tie){H(12.25,ty+1,1.5,1,'#9a3a3a');H(12.5,ty+2,1,6,'#6a2222');}
        if(L.badge){H(8.3,ty+8.3,2.4,2.4,'#f0d060');H(8.8,ty+8.8,1.4,1.4,'#b08a2a');}
        if(L.style==='bun'){H(9,ty,1,6,rgbs(mul(top,1.6)));H(16,ty,1,6,rgbs(mul(top,1.6)));}
    }
    return c;
  });
}
function hc2(h){return rgbs(mul(hex(h),0.75));}

/* ---------- Arte: chão ---------- */
const C={g1:hex('#5b9145'),g2:hex('#77b257'),g3:hex('#8cc366'),a0:hex('#383b41')};
function floorStyle(i){
  const f=floor[i],r=room[i];
  if(f===F.GRASS)return 'grass';if(f===F.ALLEY)return 'alley';if(f===F.ROOF)return 'roof';if(f===F.STREET)return 'street';if(f===F.WALK)return 'walk';if(f===F.CONC)return 'conc';if(f===F.WALL||f===F.WIN)return 'dark';
  return {sonia:'wood',equipe:'carpet',pericia:'lab',interro:'vinyl',hall:'checker',acesso:'vinyl',arquivo:'conc2'}[r]||'conc';
}
function wallIdx(x,y){if(x<0||y<0||x>=W||y>=H)return false;const f=floor[idx(x,y)];return f===F.WALL||f===F.WIN;}
// telhados dos prédios do outro lado da rua, vistos de cima (como os de baixo na cena da rua): larguras sorteadas,
// vão de serviço entre eles, platibanda de tijolo e um ar-condicionado
let ROOFS=null;
function roofSeg(wx){
  if(!ROOFS){ROOFS=[];let x=-24*T,k=0;while(x<(W+24)*T){const w=(6+Math.floor(hash(k,3,91)*5))*T,b=['#8a4632','#9a5a3c','#a58a62','#7a3a2a','#8e7a5a'][k%5];
    ROOFS.push({x0:x,x1:x+w,brick:b,tar:['#4a4642','#55504a','#3e3b38'][k%3],ac:[x+40+Math.floor(hash(k,4,92)*(w-80)),37.4*T+Math.floor(hash(k,5,93)*20)]});ROOFS.push({x0:x+w,x1:x+w+10,gap:1});x+=w+10;k++;}}
  for(const r of ROOFS)if(wx>=r.x0&&wx<r.x1)return r;return ROOFS[0];
}
function groundPx(wx,wy){
  const tx=wx>>5,ty=wy>>5,i=idx(tx,ty),st=floorStyle(i),lx=wx&31,ly=wy&31,n=hash(wx,wy,5),n2=vn(wx/5,wy/5,9);
  let c;
  switch(st){
    case 'grass':{c=mix(C.g1,C.g2,n2);c=mul(c,0.9+n*0.18);if(hash(wx>>1,wy>>1,3)>0.93)c=mix(c,C.g3,.5);const fl=hash(wx>>1,wy>>1,41);if(fl>0.996)c=hex(fl>0.998?'#f2efe0':'#e8c63a');else if(vn(wx/9,wy/9,12)>0.78)c=mul(c,0.9);return c;}
    case 'street':{c=mul(C.a0,0.88+n*0.16+n2*0.06);const pt=vn(wx/22,wy/22,31);if(pt>0.74)c=mul(c,0.86);if(pt>0.735&&pt<0.745)c=mul(c,0.7);
      if(ty===25&&((ly>=25&&ly<=26)||(ly>=29&&ly<=30)))c=mix(hex('#d9b84a'),c,hash(wx,wy,77)>0.86?0.5:0);
      if(ty===24&&ly>=19&&ly<=20&&(wx%96)<52)c=mix(hex('#d8d6cc'),c,hash(wx,wy,78)>0.85?0.55:0.1);
      if((tx<=2&&tx>=1||tx>=31&&tx<=32)&&(wy%12)<6&&ly>2)c=mix(hex('#e4e2d8'),c,hash(wx,wy,79)>0.88?0.5:0.08);if(hash(wx>>2,wy>>2,8)>0.985)c=mul(c,0.7);
      if(ty===23&&ly<5){c=mul(c,0.82+ly*0.03);const bx=wx%(9*T);if(bx>=40&&bx<64){c=ly<1?hex('#2a2c30'):((wx&3)===0?hex('#141518'):hex('#3e4146'));}}
      return c;}
    case 'walk':{
      if(ty===22&&ly>=27){c=mul(hex('#d2cdbf'),0.95+n*0.08);if(ly===27)c=mul(c,1.08);if(ly===31)c=mul(c,0.78);return c;}
      c=mul(hex('#b4afa1'),0.93+n*0.1+n2*0.05+(hash(wx>>5,wy>>5,63)-0.5)*0.06);if(lx===0||ly===0)c=mul(c,0.82);else if(lx===1||ly===1)c=mul(c,1.04);
      if(hash(wx>>1,wy>>1,64)>0.992)c=mul(c,0.86);const cr=Math.abs(ly-16-Math.sin(lx/5+(wx>>5))*4);const ch=hash(wx>>5,wy>>5,65);if(ch>0.9&&cr<0.6&&Math.abs(lx-(ch-0.9)*200)<7)c=mul(c,0.8);
      if(ty===19&&ly<4)c=mul(c,0.7+ly*0.07);
      if(ty===19&&tx>=14&&tx<=17&&ly<13){c=mul(hex('#9c9a92'),0.94+n*0.08);if(ly===4||ly===8||ly===12)c=mul(c,0.72);else if(ly===5||ly===9)c=mul(c,1.1);}
      if(ty===27&&ly<5){c=mul(hex('#d2cdbf'),0.95+n*0.08);if(ly===4)c=mul(c,0.78);}
      return c;}
    case 'conc':{c=mul(hex('#a9a89e'),0.92+n*0.1+n2*0.07);const st2=vn(wx/14,wy/14,51);if(st2>0.76)c=mul(c,0.9);if((wx&63)===0||(wy&63)===0)c=mul(c,0.8);
      const cr=Math.abs(wy-(19*T+20+Math.sin(wx/11)*5+Math.sin(wx/4)*1.5));if(wx>20*T&&wx<27*T&&cr<0.8)c=mul(c,0.62);
      if(ty===19&&ly<4)c=mul(c,0.7+ly*0.07);return c;}
    case 'dark':return mul(hex('#2a2520'),0.8+n*0.2);
    case 'alley':{c=mul(hex('#4a4744'),0.86+n*0.14+n2*0.06);if(vn(wx/18,wy/18,71)>0.74)c=mul(c,0.82);if(hash(wx>>2,wy>>2,72)>0.985)c=mul(c,0.7);
      if((tx===0||tx===W-1)&&(lx===(tx===0?30:1)))c=mul(c,0.7);if(ty===0&&ly<6)c=mul(hex('#6a4a3a'),0.85+n*0.15);return c;}
    case 'roof':{const sg=roofSeg(wx),pa=ty===37&&ly<6;if(sg.gap)return mul(hex('#2c2a28'),0.8+n*0.2);
      if(pa||wx-sg.x0<5||sg.x1-wx<5){c=mul(hex(sg.brick),0.86+n*0.16);if((wy&3)===0||((wx+((wy>>2)&1)*4)&7)===0)c=mul(c,0.78);if(pa&&ly===0)c=mul(c,1.15);return c;}
      c=mul(hex(sg.tar),0.88+n*0.12+n2*0.05);if(hash(wx>>1,wy>>1,73)>0.94)c=mul(c,1.12);
      const u=sg.ac;if(u&&wx>=u[0]&&wx<u[0]+14&&wy>=u[1]&&wy<u[1]+10){c=hex(wx===u[0]||wy===u[1]?'#d8dadc':'#a9adb0');if(((wx-u[0])&1)&&wy>u[1]+2&&wy<u[1]+8)c=hex('#6a7074');}
      return c;}
  }
  switch(st){
    case 'conc2':c=mul(hex('#8f8d86'),0.9+n*0.12+n2*0.08);if((wx&63)===0||(wy&63)===0)c=mul(c,0.78);if(lx>=14&&lx<=17&&ty%4===1)c=mix(c,hex('#d9b84a'),.5);break;
    case 'wood':{
      const row=wy>>3,off=(row%2)*16,seam=(wx+off)%32===0;c=mix(hex('#9a6e46'),hex('#a87a4e'),hash(row,(wx+off)>>5,2));c=mul(c,0.93+n*0.1+n2*0.04);
      if((wy&7)===0||seam)c=hex('#5e3f27');else if((wy&7)===1)c=mul(c,1.08);
      else{const gx=(wx+off)&31,pk=hash(row,(wx+off)>>5,9);if(pk>0.86){const kx=6+Math.floor((pk-0.86)*120),d=Math.hypot(gx-kx,((wy&7)-4)*1.4);if(d<1.2)c=mul(c,0.78);else if(d<2.4)c=mul(c,0.9);}if(Math.sin((wx+off)*0.9+row*2.3+Math.sin(wx*0.13)*3)>0.93)c=mul(c,0.9);}
      if(tx>=3&&tx<=8&&ty>=5&&ty<=7){const ax=wx-3*T,ay=wy-5*T,bw=6*T,bh=3*T,e=Math.min(ax,ay,bw-1-ax,bh-1-ay);
        c=mul(hex('#7a2f2f'),0.92+n*0.1);if(e<2||(e>=5&&e<7))c=hex('#c9a24a');else if(e>=9&&((ax*3+ay*5)%23)<3)c=mul(hex('#7a2f2f'),1.18);if(e===0)c=mul(c,0.7);}
      break;}
    case 'carpet':{c=mul(hex('#5d6b78'),0.9+n*0.14+n2*0.05);if(lx===0||ly===0)c=mul(c,0.86);const dx=Math.abs((lx-15.5)),dy=Math.abs(ly-15.5);if(Math.abs(dx+dy-11)<0.8)c=mul(c,0.9);if(dx+dy<2)c=mul(c,1.08);if(((wx+wy)&3)===0)c=mul(c,0.96);const wear=vn(wx/40,wy/40,19);if(wear>0.72)c=mix(c,hex('#7a8794'),0.18);break;}
    case 'lab':c=mul(hex('#cfd6d8'),0.95+n*0.06);if((wx&15)===0||(wy&15)===0)c=hex('#a9b3b6');else if((wy&15)===1||(wx&15)===1)c=mul(c,1.05);else if((wx&15)===15||(wy&15)===15)c=mul(c,0.96);if(((wx-wy)&31)<2)c=mul(c,1.03);break;
    case 'vinyl':c=mul(hex('#3b3f44'),0.9+n*0.14+n2*0.05);if(lx===0||ly===0)c=mul(c,0.78);break;
    case 'checker':{const p=((wx>>4)+(wy>>4))&1;c=mul(hex(p?'#d6d0bf':'#bfb8a4'),0.95+n*0.08);if((wx&15)===0||(wy&15)===0)c=mul(c,0.86);else if((wx&15)===1||(wy&15)===1)c=mul(c,1.05);if((((wx&15)+(wy&15))>>1)===9)c=mix(c,[255,255,255],0.12);
      if(ty===17&&tx>=15&&tx<=16)c=mul(hex('#2b2f33'),0.9+n*0.2+((wy&3)===0?0.25:0));break;}
    default:c=mul(hex('#a9a89e'),0.9+n*0.1);
  }
  // sombra de canto junto às paredes laterais e de trás
  let ao=1;if(wallIdx(tx-1,ty)&&lx<6)ao*=0.8+lx*0.033;if(wallIdx(tx+1,ty)&&lx>25)ao*=0.8+(31-lx)*0.033;if(wallIdx(tx,ty-1)&&ly<8)ao*=0.78+ly*0.0275;
  return mul(c,ao);
}
function buildGround(){
  const w=W*T,h=H*T,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),img=g.createImageData(w,h),d=img.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=groundPx(x,y),k=(y*w+x)*4;d[k]=p[0];d[k+1]=p[1];d[k+2]=p[2];d[k+3]=255;}
  g.putImageData(img,0,0);
  for(let i=0;i<N;i++)if(floor[i]===F.DOOR){const x=(i%W)*T,y=((i/W)|0)*T;g.fillStyle='rgba(40,28,18,.55)';
    if((i%W)===15||(i%W)===16){g.fillRect(x,y+24,T,5);g.fillStyle='#c9a24a';g.fillRect(x,y+24,T,1);}else{g.fillRect(x+12,y,8,T);g.fillStyle='#c9a24a';g.fillRect(x+12,y,1,T);g.fillRect(x+19,y,1,T);}}
  // sombras de contato sob os móveis
  // oclusão de ambiente macia (desfoque da sombra do canvas, que o Safari também faz): uma mancha larga sob a pegada e
  // uma faixa mais escura e justa onde o móvel encosta no chão. Pintada uma vez no piso.
  const OFF=4000;g.save();g.shadowOffsetX=OFF;
  for(const o of objs){if(o.far||o.t==='flag')continue;const x=o.x*T,y=o.y*T,w2=o.w*T,h2=o.h*T;
    g.shadowColor='rgba(16,10,6,.38)';g.shadowBlur=9;g.fillStyle='#000';g.fillRect(x+3-OFF,y+h2*0.45,w2-6,h2*0.55+5);
    g.shadowColor='rgba(16,10,6,.42)';g.shadowBlur=3;g.fillRect(x+4-OFF,y+h2-3,w2-8,5);}
  g.restore();
  // sombra nos cantos (base.ao): o piso escurece junto às paredes, mais forte embaixo da parede do fundo
  if(fxOn('base.ao'))for(const k in ROOM_RECT){const [a,b,cx,d]=ROOM_RECT[k],X0=a*T,Y0=b*T,X1=(cx+1)*T,Y1=(d+1)*T;
    const band=(x0,y0,x1,y1,al)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,`rgba(18,12,8,${al})`);gr.addColorStop(1,'rgba(18,12,8,0)');return gr;};
    g.fillStyle=band(0,Y0,0,Y0+26,.5);g.fillRect(X0,Y0,X1-X0,26);
    g.fillStyle=band(X0,0,X0+16,0,.34);g.fillRect(X0,Y0,16,Y1-Y0);
    g.fillStyle=band(X1,0,X1-16,0,.34);g.fillRect(X1-16,Y0,16,Y1-Y0);
    g.fillStyle=band(0,Y1,0,Y1-12,.26);g.fillRect(X0,Y1-12,X1-X0,12);}
  return c;
}

/* ---------- Arte: paredes ---------- */
const FACE={sonia:['#cdbd9d','#b9a885'],equipe:['#c8cfd3','#b3bbc0'],pericia:['#dfe6e6','#c7d0d0'],interro:['#6b7075','#5a5f64'],hall:['#d8d0b8','#c4bca2'],acesso:['#c8cfd3','#b3bbc0'],arquivo:['#9a9a90','#86867c'],wall:['#b9b1a0','#a39b8a'],fora:['#b9b5ac','#a5a198']};   // fachada de concreto aparente (como na rua)
const BASE={sonia:'#6b4a2e',equipe:'#59616a',pericia:'#8a9496',interro:'#383c40',hall:'#8a7a5a',acesso:'#59616a',arquivo:'#6a6a62',wall:'#6b5a46',fora:'#5c5853'};   // embasamento de granito
function wallAt(x,y){if(x<0||y<0||x>=W||y>=H)return false;const f=floor[idx(x,y)];return f===F.WALL||f===F.WIN;}
// extintor de parede com a placa vermelha acima
function EXT(P,E,X,Y){P(X-2,Y-2,12,6,'#c0392b');P(X-1,Y-1,10,4,'#e8ecef');P(X+1,Y,6,2,'#c0392b');P(X+1,Y+5,6,15,'#b8261c');P(X+1,Y+5,2,15,'#e05a4a');P(X+6,Y+5,1,15,'#7a1a12');P(X+2,Y+3,4,2,'#2b2b2b');P(X+6,Y+3,4,1,'#2b2b2b');P(X+9,Y+3,1,8,'#2b2b2b');P(X+2,Y+10,4,4,'#f2efe6');P(X+3,Y+11,2,1,'#c0392b');P(X+1,Y+20,6,1,'#5a0e0a');}
const DECOR_KEYS=new Set(['7,1','8,1','3,1','12,1','15,1','17,1','20,1','27,1','26,1','5,9','6,9','12,9','13,9','18,9','19,9','24,9','25,9','29,9','9,1','27,9','23,1','17,9','11,9','8,9','2,9','31,1']);
const decorAt=(x,y)=>DECOR_KEYS.has(x+','+y);
function decor(x,y,P,E,X,Y){
  const D={
    '7,1':()=>{P(X+4,Y+3,24,16,'#3a2a1c');P(X+6,Y+5,20,12,'#f2ecd8');P(X+9,Y+8,14,1,'#7a6a4a');P(X+9,Y+11,10,1,'#9a8a6a');E(X+23,Y+14,2,2,'#c0392b');},
    '8,1':()=>{P(X+4,Y+3,24,16,'#3a2a1c');P(X+6,Y+5,20,12,'#9cc0d8');P(X+6,Y+10,20,2,'#d9c27a');P(X+6,Y+14,20,3,'#7aa86a');P(X+14,Y+6,4,10,'#c0392b');},
    '3,1':()=>{P(X+10,Y+2,12,16,'#1e2a3a');P(X+10,Y+2,12,1,'#3a4f6a');P(X+12,Y+5,8,1,'#e8ecef');P(X+12,Y+8,8,1,'#c9a24a');P(X+15,Y+11,2,4,'#e8ecef');},
    '12,1':()=>{P(X+6,Y+3,20,15,'#e8e4da');P(X+8,Y+6,16,1,'#999');P(X+8,Y+9,12,1,'#999');P(X+8,Y+12,14,1,'#999');P(X+22,Y+4,2,2,'#c0392b');},
    '15,1':()=>{E(X+16,Y+10,8,8,'#3a2a1c');E(X+16,Y+10,7,7,'#f4efe2');for(let k=0;k<12;k++){const a=k/12*6.283;P(X+16+Math.cos(a)*5.6,Y+10+Math.sin(a)*5.6,1,1,'#6a6a6a');}},
    '17,1':()=>{P(X+2,Y+3,28,15,'#b0814f');P(X+2,Y+3,28,1,'#6b4a2e');P(X+5,Y+6,8,6,'#f1ece0');P(X+16,Y+5,9,8,'#f6efc9');P(X+8,Y+13,6,3,'#f1ece0');P(X+20,Y+14,6,3,'#9cc0d8');},
    '20,1':()=>{P(X+4,Y+4,24,14,'#ece6d6');P(X+4,Y+4,24,1,'#ffffff');for(let r=0;r<4;r++)for(let k=0;k<6;k++)P(X+6+k*4,Y+7+r*3,3,2,(r*6+k)%5===0?'#c0392b':'#b9b3a4');},
    '27,1':()=>{P(X+4,Y+3,24,15,'#f1ece0');P(X+4,Y+3,24,1,'#6b6b6b');for(let k=0;k<6;k++){P(X+6+k*4,Y+6,1,8,'#333');P(X+6+k*4,Y+9,2,1,'#c0392b');}},
    '26,1':()=>{P(X+8,Y+2,16,18,'#2f3a44');P(X+10,Y+4,12,14,'#e9e4d0');E(X+16,Y+10,3,4,'#8a8a8a');},
    '5,9':()=>{P(X-2,Y+1,36,18,'#15191c');P(X,Y+3,32,14,'#2b343a');P(X,Y+3,32,2,'#46535b');P(X+4,Y+6,9,1,'#6a7a84');P(X+16,Y+9,8,1,'#55646e');},
    '6,9':()=>{P(X,Y+1,34,18,'#15191c');P(X,Y+3,32,14,'#2b343a');P(X,Y+3,32,2,'#46535b');P(X+6,Y+8,9,1,'#6a7a84');},
    '12,9':()=>{P(X+3,Y+2,28,16,'#6b4a2e');P(X+5,Y+4,24,12,'#b0814f');P(X+7,Y+6,7,6,'#f1ece0');P(X+16,Y+5,9,8,'#f6efc9');P(X+20,Y+7,2,2,'#c0392b');},
    '13,9':()=>{P(X+1,Y+2,28,16,'#6b4a2e');P(X+3,Y+4,24,12,'#b0814f');P(X+6,Y+6,8,9,'#e8e4da');P(X+16,Y+6,8,6,'#f1ece0');},
    '18,9':()=>{P(X+6,Y+5,20,8,'#1a5a3a');P(X+7,Y+6,18,6,'#2f8a5a');},
    '19,9':()=>{P(X+6,Y+3,20,15,'#3a2a1c');P(X+8,Y+5,16,11,'#9cc0d8');P(X+8,Y+11,16,5,'#6f8a74');E(X+19,Y+8,2,2,'#f6f0c8');},
    '24,9':()=>{P(X+2,Y+4,30,13,'#1c1d20');P(X+2,Y+4,30,1,'#555');},
    '25,9':()=>{P(X-2,Y+4,30,13,'#1c1d20');P(X-2,Y+4,30,1,'#555');},
    '29,9':()=>{P(X+8,Y+4,16,12,'#6a6a62');for(let k=0;k<4;k++)P(X+10,Y+6+k*3,12,1,'#3a3a34');},
    '9,1':()=>EXT(P,E,X+12,Y+4),'27,9':()=>EXT(P,E,X+10,Y+2),'23,1':()=>EXT(P,E,X+12,Y+4),
    '17,9':()=>{P(X+3,Y-2,26,20,'#1c1d20');P(X+4,Y-1,24,18,'#2c2e32');P(X+6,Y+1,18,13,'#0e1416');P(X+7,Y+2,16,11,'#2f4a5a');P(X+7,Y+9,16,4,'#1a3a6a');P(X+8,Y+10,8,1,'#e8ecef');P(X+8,Y+12,5,1,'#f2c230');P(X+7,Y+2,5,2,'rgba(255,255,255,.25)');P(X+25,Y+3,2,2,'#555');P(X+25,Y+7,2,2,'#555');P(X+12,Y+17,8,3,'#3a3c40');},
    '11,9':()=>{P(X+8,Y+3,16,10,'#f2efe6');P(X+8,Y+3,16,1,'#ffffff');E(X+16,Y+8,4,4,'#c0392b');E(X+16,Y+8,3,3,'#f2efe6');P(X+13,Y+8,6,1,'#2b2b2b');P(X+14,Y+7,1,2,'#2b2b2b');P(X+12,Y+5,9,7,'rgba(192,57,43,0)');for(let k=0;k<7;k++)P(X+12+k,Y+11-k,1,1,'#c0392b');},
    '8,9':()=>{P(X+20,Y-4,8,4,'#d8dcdf');P(X+18,Y-3,3,2,'#9aa0a6');E(X+27,Y-2,1.5,1.5,'#1c1e20');P(X+27,Y-3,1,1,'#ff3a2a');},
    '2,9':()=>{P(X+8,Y+3,16,11,'#f6efc9');P(X+8,Y+3,16,1,'#ffffff');P(X+10,Y+6,12,1,'#7a6a4a');P(X+10,Y+9,9,1,'#7a6a4a');P(X+15,Y+2,2,2,'#c0392b');},
    '31,1':()=>{P(X+6,Y+4,18,9,'#2f6a3a');P(X+7,Y+5,16,7,'#3f8a4a');P(X+9,Y+7,6,1,'#e8ecef');P(X+16,Y+6,4,4,'#e8ecef');}
  };
  const k=x+','+y;if(D[k])D[k]();
}
function buildWalls(){
  const rows=[];
  for(let y=0;y<H;y++){
    let any=false;for(let x=0;x<W;x++)if(wallAt(x,y))any=true;
    if(!any){rows.push(null);continue;}
    const c=S2(W*T,2*TH+RISE,(P,E,g)=>{
      for(let x=0;x<W;x++){
        if(!wallAt(x,y))continue;
        const i=idx(x,y),f=floor[i],X=x*T;
        const L=wallAt(x-1,y),Rt=wallAt(x+1,y),U=wallAt(x,y-1),D=wallAt(x,y+1);
        const cap=['#6e5c4c','#8c7862','#4a3e33'];
        const capH=D?TH+RISE:CAPH;
        P(X,0,T,capH,cap[0]);for(let k=0;k<10;k++)P(X+Math.floor(hash(x,k,y)*T),Math.floor(hash(k,x,y+3)*capH),1+(k&1),1,k%3?cap[1]:cap[2]);
        if(!U){P(X,0,T,1,'#241c16');P(X,1,T,1,cap[1]);}
        if(!L){P(X,0,1,capH,'#241c16');P(X+1,0,1,capH,cap[1]);}
        if(!Rt){P(X+T-1,0,1,capH,'#241c16');P(X+T-2,0,1,capH,cap[2]);}
        if(f===F.WIN&&D){P(X+12,RISE+2,8,TH-4,'#2f4258');P(X+13,RISE+3,6,TH-6,'#5f86a8');}
        if(D)continue;
        const bf=y+1<H?floor[idx(x,y+1)]:F.GRASS;
        const hang=bf!==F.DOOR;
        const fy=CAPH,fb=RISE+(hang?2*TH:TH),fh=fb-fy;
        const rm=y+1<H?room[idx(x,y+1)]:'fora';
        const st=FACE[rm]||FACE.wall;
        P(X,fy-1,T,1,'#241c16');P(X,fy,T,fh,st[0]);
        for(let k=0;k<18;k++)P(X+Math.floor(hash(x,k,y+9)*T),fy+Math.floor(hash(k,x,y+11)*fh),1,1,st[1]);
        if(rm==='fora'){for(let yy=fy+8;yy<fb-6;yy+=14)P(X,yy,T,1,'rgba(70,64,56,.3)');if(x%2===0)P(X,fy,1,fb-fy,'rgba(70,64,56,.22)');P(X+8,fy+4,2,2,'rgba(60,56,50,.3)');P(X+24,fy+11,2,2,'rgba(60,56,50,.3)');P(X,fb-8,T,2,'#1b2a44');P(X,fb-8,T,1,'#c9a24a');}
        if(rm==='arquivo'||rm==='interro'){for(let xx=0;xx<T;xx+=8)P(X+xx,fy,1,fh,'rgba(0,0,0,.08)');}
        if(rm==='equipe'||rm==='hall'){P(X,fy+18,T,2,lt(st[0],.1));P(X,fy+20,T,1,'rgba(0,0,0,.08)');}
        if(rm==='pericia'){for(let yy=fy+20;yy<fb-5;yy+=5)P(X,yy,T,1,'rgba(150,165,170,.35)');for(let xx=0;xx<T;xx+=8)P(X+xx,fy+20,1,fb-fy-25,'rgba(150,165,170,.35)');}
        P(X,fb-5,T,5,BASE[rm]||BASE.wall);P(X,fb-5,T,1,lt(BASE[rm]||BASE.wall,.18));
        P(X,fy,T,4,'rgba(0,0,0,.20)');
        if(!L)P(X,fy,2,fh,'rgba(0,0,0,.16)');if(!Rt)P(X+T-2,fy,2,fh,'rgba(0,0,0,.20)');
        if(f===F.WIN){const wy=fy+5;P(X+4,wy,24,22,'#f2efe6');P(X+6,wy+2,20,18,'#9cc4e0');P(X+7,wy+3,6,3,'#d4e8f6');P(X+15,wy+2,1,18,'#f2efe6');P(X+6,wy+10,20,1,'#f2efe6');P(X+3,wy+22,26,2,'#d8d2c4');
          if(rm!=='fora'){for(let k=0;k<5;k++)P(X+6,wy+2+k*3,20,1,'rgba(255,255,255,.55)');P(X+6,wy+16,20,4,'rgba(255,255,255,.35)');}}
        if(f===F.WIN&&rm==='fora'&&(x%2===0)){const ay=fy+19;P(X+7,ay,18,10,'#d9d6cb');P(X+7,ay,18,1,'#f2f0e8');P(X+7,ay+9,18,1,'#9a978c');for(let k=0;k<6;k++)P(X+9+k*2.6,ay+2,1,6,'#a9a69a');P(X+21,ay+3,3,2,'#6a675e');P(X+15,ay+10,1,4,'rgba(60,90,120,.35)');}
        if(f===F.WIN)P(X+3,fy+27,26,1,'rgba(255,255,255,.35)');
        if(rm==='fora'&&(x===2||x===31)){P(X+13,0,5,fb,'#8a8c86');P(X+13,0,1,fb,'#b9bab4');P(X+17,0,1,fb,'#5e605a');for(let yy=8;yy<fb;yy+=14)P(X+12,yy,7,2,'#6a6c66');}
        if(rm!=='fora'&&f!==F.WIN&&!decorAt(x,y)&&hash(x,y,93)<0.4){const ox=6+Math.floor(hash(x,y,94)*18),oy=fb-12;P(X+ox,oy,4,5,'#ece8dc');P(X+ox,oy,4,1,'#ffffff');P(X+ox+1,oy+1,1,2,'#3a3a3a');P(X+ox+2,oy+1,1,2,'#3a3a3a');P(X+ox+1,oy+4,2,1,'#9a968a');
          if(hash(x,y,95)<0.5){P(X+ox+(ox>16?-9:9),fy+18,3,4,'#ece8dc');P(X+ox+(ox>16?-8:10),fy+19,1,2,'#9a968a');}}
        // marcas de uso: uma mancha ou rachadura fina em algumas paredes
        if(hash(x,y,96)<0.18&&rm!=='fora'){const cx=4+Math.floor(hash(x,y,97)*24);for(let k=0;k<6;k++)P(X+cx+Math.round(Math.sin(k*1.7)*1.5),fy+6+k,1,1,'rgba(0,0,0,.14)');}
        decor(x,y,P,E,X,fy+6);
        P(X,fb-1,T,1,'rgba(0,0,0,.35)');
      }
    });
    rows.push(c);
  }
  return rows;
}
// os painéis da faixa azul da fachada, como na cena da rua: "Plantão 24 horas" e o nome completo do departamento
function buildPanels(){
  const panel=(lines)=>S2(3*T-8,16,(P,E,g)=>{const w=3*T-8;P(0,0,w,16,'#14203a');P(0,0,w,1,'#c9a24a');P(0,15,w,1,'#c9a24a');P(1,1,w-2,14,'#1a2848');
    lines.forEach(([t,y,sz],i)=>{const a=txtW(g,t,sz,0.6);txt(g,t,w/2-a/2,y,sz,i?'#c9d2e0':'#f1f3f4',0.6);});});
  return [panel([['PLANTÃO 24 HORAS',10.5,5.5]]),panel([['DEPARTAMENTO DE HOMICÍDIOS',7.5,4],['E DE PROTEÇÃO À PESSOA',12.5,3.6]])];
}
function buildSign(){
  const w=6*T;
  return S2(w,20,(P,E,g)=>{
    P(0,0,w,20,'#14171a');P(1,1,w-2,18,'#1f252a');P(3,3,w-6,14,'#262d33');P(3,3,w-6,1,'#333b42');
    const a=txtW(g,'DHPP',15,4);txt(g,'DHPP',14,16,15,'#f1f3f4',4);
    P(14+a+8,4,1,12,'#6a747b');
    txt(g,'HOMICÍDIOS',14+a+16,12,9,'#e8ecef',3);txt(g,'DEPARTAMENTO',14+a+16,16.5,4.6,'#8a9399',1.6,600);
  });
}
function buildDoor(){
  return S2(2*T,36,(P,E,g)=>{
    P(0,0,2*T,36,'#23272b');P(2,1,2*T-4,33,'#2e343a');
    for(const x0 of [4,34]){P(x0,3,26,28,'#6f93b3');P(x0+2,5,8,10,'#a7c6dc');P(x0+14,17,10,12,'#5f86a8');P(x0,3,26,2,'#dbe6ee');P(x0,29,26,2,'#1c2024');}
    P(28,13,2,9,'#c9ccce');P(34,13,2,9,'#c9ccce');P(2*T/2-1,1,2,33,'#14171a');
    P(2,32,2*T-4,4,'#c9a24a');
  });
}
function buildLamp(){ // luminária pendente da sala de depoimentos
  return outlined(S2(22,12,(P,E)=>{P(3,4,16,6,'#2a2d30');P(1,9,20,2,'#3a3e42');P(4,4,14,1,'#4a4f55');P(6,10,10,2,'#fff2c8');}));
}

/* ---------- Estado ---------- */
const NPCDEF=[
  {id:'sonia',name:'Sônia Prado',role:'Delegada · DHPP',look:'sonia',x:5,y:3,sit:true,ini:'SP',col:'#c9a24a',act:'write',lines:['Hm.','Assina aqui, depois.','Café, alguém?',{t:'Li o teu registro da casa, Lemos.',when:()=>!!FIM},{t:'Que noite. Senta, toma um café.',when:()=>!!FIM},{t:'Madrugada parada até agora.',when:()=>NIGHT&&!briefed()}],idle:['phone','read','chin','drink','read'],poseLines:{phone:['Alô. Sim, doutor.','Me manda isso por escrito.','Ainda não. Estou com a equipe.']}},
  {id:'renata',name:'Renata Leal',role:'Investigadora',look:'renata',x:13,y:3,sit:true,ini:'RL',col:'#7fc9b6',act:'type',lines:['Cruzando registro.','Cadê a minha caneta?','Isso aqui é coincidência.',{t:'Vi as fotos da casa. Pesado.',when:()=>!!FIM}],idle:['chin','drink','scratch','stretch','phone'],poseLines:{phone:['Oi, é a Renata, do DHPP.','Pode me mandar a lista inteira?'],stretch:['Ai, minhas costas.']}},
  {id:'denise',name:'Denise Rocha',role:'Escrivã',look:'denise',x:17,y:3,sit:true,ini:'DR',col:'#c9a7d9',act:'type',lines:['Fita nova no gravador.','Folha 2 de 3.',{t:'Plantão comprido hoje.',when:()=>NIGHT},{t:'O Lemos já está na casa.',when:()=>NIGHT&&briefed()}],idle:['read','drink','stretch','chin','read']},
  {id:'paulo',name:'Paulo Vieira',role:'Investigador de campo',look:'paulo',x:19,y:6,ini:'PV',col:'#d6b27a',walk:[[19,6,'drink'],[16,7,'phone'],[18,2,'watch']],lines:['Café requentado de novo.','A rua acordou cedo.','Vou pegar o carro já já.',{t:'A PM disse que a vizinhança da Acácias não dormiu.',when:()=>!!FIM},{t:'Fez a casa sozinho, Lemos? Respeito.',when:()=>!!FIM}],idle:['cross','watch','scratch','phone'],poseLines:{phone:['Fala, chefe. Tô na base.','Passa aqui mais tarde.'],drink:['Tá frio de novo.']}},
  {id:'mauricio',name:'Maurício Farias',role:'Perito criminal',look:'mauricio',x:25,y:3,sit:true,ini:'MF',col:'#9fb7c9',act:'type',walk:[[25,3],[27,5,'read']],lines:['Luva nova.','Etiqueta, lacre, assinatura.','Foto 14, refaz.',{t:'Tuas fotos da casa estão boas. Sete marcadores.',when:()=>!!(FIM&&FIM.achados>=7)},{t:'A cena chegou inteira. Dá pra trabalhar.',when:()=>!!(FIM&&FIM.contaminacao<25)},{t:'Teve gente pisando no terreno. Vai constar no laudo.',when:()=>!!(FIM&&FIM.contaminacao>=60)}],idle:['read','chin','scratch','stretch']},
  {id:'faxina',name:'Limpeza',role:'Equipe de apoio',look:'faxina',x:13,y:15,ini:'LP',col:'#8fb0c8',mop:true,walk:[[13,15],[19,13,'stretch'],[17,16],[12,14,'watch'],[18,12]],lines:['Cuidado, tá molhado.',{t:'Bom dia, doutor.',when:()=>!NIGHT},{t:'Boa noite, doutor.',when:()=>NIGHT},'Esse café mancha tudo.'],idle:['watch','scratch']},
  {id:'plantao',name:'Plantão',role:'Recepção · DHPP',look:'plantao',x:14,y:11,sit:true,ini:'PL',col:'#a9b8c6',act:'write',lines:[{t:'DHPP, bom dia.',when:()=>!NIGHT},{t:'DHPP, plantão.',when:()=>NIGHT},'Um momento, por favor.','Sem comentários.'],idle:['phone','phone','read','cross','drink'],poseLines:{phone:['DHPP, bom dia.','Não, senhor. Sem comentários.','Vou transferir, aguarde.']}},
  {id:'guarda',name:'Guarda',role:'Controle de acesso · DHPP',look:'guarda',x:20,y:14,ini:'GD',col:'#7a8fb0',lines:['Crachá, por favor.','Só com crachá, senhor.','Aguarde ser chamado, senhor.'],idle:['watch','cross','watch','scratch']},
];
// conversa de fundo entre colegas (nada do caso: só o dia a dia da base). Os dois precisam estar parados e perto.
const CHATS=[
  ['renata','denise','Denise, tem grampeador aí?','Gaveta de cima. Devolve, hein.'],
  ['denise','renata','Esse ar-condicionado tá de brincadeira.','Pede pro Paulo bater nele de novo.'],
  ['paulo','renata','Vai um café?','Se for do bom, vou.'],
  ['paulo','denise','Alguém viu a chave da viatura?','No gancho, onde sempre fica.'],
  ['faxina','plantao','Passei pano na entrada.','E o povo pisa igual. Obrigado.'],
  ['plantao','faxina','Chegou mais copo pra copa?','Amanhã cedo.']
];
// quanto dura cada gesto, em quadros (60 por segundo)
const POSE_DUR={phone:420,drink:200,cross:360,stretch:110,read:400,chin:300,watch:110,scratch:120};
let chatT=900;
const DOORA={t:0,open:false};
// leitora de crachá: Lemos para na porta vindo da recepção até passar o crachá (src/base/badgeSwipe.js)
const BADGE={ok:false,open:false,out:false};   // out: vem de dentro (a saída é livre até ele chegar à recepção)
const badgeOn=()=>fxOn('scene.badge')&&badgeReady();
let PANELS=null,BG=null,WALLROWS=null,SIGN=null,DOORSPR=null,SHADOW=null,LAMP=null;
let P1,NPCS=[],frame=0,started=false,follow=true,talkOpen=false;
let SEEN=safe(()=>JSON.parse(localStorage.getItem('base.seen')||'{}'),{});
const cam={x:16*T,y:15*TH,z:1};
const CAMERA_DEBUG=/[?&]cameraDebug=1(?:&|$)/.test(location.search);
const CAMLEAD=createLead({rest:.3});   // espaço à frente de Lemos (suavizado)
const CAMCTRL=createCameraControl({manualHold:2600,reducedMotion:!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)});
let CAMDBG=null,camIdle=0;
let gameMin=NIGHT?4*60+27:8*60+10,lastClock=0;
function newGame(){
  buildMap();
  P1={id:'lemos',x:16,y:20,path:[],dir:1,walk:0,moving:false,look:LOOK.lemos,pend:null};
  NPCS=NPCDEF.filter(d=>!NIGHT||NIGHT_IDS.has(d.id)).map((d,k)=>({...d,k,route:d.walk,home:idx(d.x,d.y),act:null,actT:3+k*2.3,mem:{},dir:d.id==='paulo'?-1:1,path:[],walk:0,moving:false,timer:120+Math.floor(Math.random()*200),wp:0,hold:false,say:null,sayT:600+Math.floor(Math.random()*900),pose:null,poseT:0,poseCD:60+Math.floor(Math.random()*500),sayQ:null}));
}
function framesFor(p){if(!p.frames)p.frames=personFrames(p.look||LOOK[p.lookId]);return p.frames;}
function framesHDFor(p){if(!p.framesHD)p.framesHD=personFramesHD(p.look,framesFor(p));return p.framesHD;}
onFxChange(()=>{const v=fxOn('base.ao');if(BG&&v!==initArt.ao){initArt.ao=v;BG=buildGround();APRON=null;}});
function initArt(){initArt.ao=fxOn('base.ao');
  for(const o of objs){o.spr=makeSprite(o);if(o.t==='secdoor'){o.sprC=o.spr;o.sprO=makeSprite({...o,open:true});}}
  BG=buildGround();WALLROWS=buildWalls();SIGN=buildSign();PANELS=buildPanels();NEIGH=null;DOORSPR=buildDoor();LAMP=buildLamp();
  SHADOW=S2(22,8,(P,E)=>{E(11,4,10,3.5,'rgba(0,0,0,.30)');E(11,4,7,2.5,'rgba(0,0,0,.18)');});
  for(const n of NPCS)if(typeof n.look==='string')n.look=LOOK[n.look];
}
// O Safari do iPhone pode descartar o desenho guardado em canvas fora da tela quando falta memória (o quadro do caso
// usa bastante): o piso, as paredes, os móveis e as pessoas voltam vazios e a base fica preta. Ao voltar do quadro, do
// depoimento ou de outro app, confere um pixel do piso e de um móvel; se sumiram, refaz toda a arte.
let LSGEN=0;
const SENT=document.createElement('canvas');SENT.width=SENT.height=1;const SCTX=SENT.getContext('2d',{willReadFrequently:true});
function artLost(){try{const px=(c,x,y)=>{SCTX.clearRect(0,0,1,1);SCTX.drawImage(c,x,y,1,1,0,0,1,1);return SCTX.getImageData(0,0,1,1).data[3];};const o=objs.find(q=>q.spr&&q.spr.c);
  return px(BG,4,4)===0||(o&&px(o.spr.c,(o.spr.c.width>>1),(o.spr.c.height>>1))===0&&px(o.spr.c,(o.spr.c.width>>1),o.spr.c.height-2)===0);}catch(_){return true;}}
function rebuildArt(){if(STREET)STREET.strip.reset();
  for(const k in LCACHE)delete LCACHE[k];LSGEN++;APRON=null;
  initArt();
  for(const p of [P1,...NPCS,...Object.values(VFR)])if(p){p.frames=null;p.framesHD=null;}
}
function checkArt(){if(BG&&artLost())rebuildArt();}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(checkArt,60);});
addEventListener('pageshow',()=>setTimeout(checkArt,60));
setInterval(()=>{if(SCENE!=='rua'&&!depoOpen&&document.visibilityState==='visible')checkArt();},4000);   // o iPhone também pode descartar no meio do jogo
const npcAtTile=i=>NPCS.some(n=>ti(n)===i||(n.path.length&&n.path[0]===i));
const walkPass=i=>passable(i)&&!npcAtTile(i);
function roomOf(a){return room[ti(a)];}

/* ---------- Conversas ---------- */
const nF=()=>FOUND.length;
/* ---------- Equipe nas mesas: a mesma conversa do app Equipe, no mesmo save ---------- */
let CASE=readCase();
const refreshCase=()=>{CASE=readCase();if(typeof buildVisitors==='function')buildVisitors();};
addEventListener('focus',refreshCase);addEventListener('storage',refreshCase);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCase();});
const TEAM_IDS=new Set(['sonia','mauricio','renata','paulo','denise']);
const GREET={
  sonia:['Impressão, sim. Prova, ainda não. O que você tem?','Nada mudou desde a última conversa. Quando uma peça mudar a direção do caso, me procura.'],
  mauricio:['Eu falo do que vi, não do que imagino. Do que você precisa?','Por enquanto, nada novo da perícia. Se surgir vestígio, você fica sabendo.'],
  renata:['Ainda são peças separadas. Me diz o que cruzar.','Nenhum cruzamento novo pra fazer agora. Preciso de um nome, um horário ou um documento.'],
  paulo:['Rua é boato até virar documento. Diz aí.','Nada novo na rua por enquanto. Quando aparecer um endereço ou um nome, eu vou atrás.'],
  denise:['Cada versão no seu lugar. Do que você precisa?','Nada pra comparar ainda. Quando alguém mudar a versão, eu te mostro onde.']
};
const memberOf=id=>caseTeam.find(m=>m.id===id);
function teamMenu(id){
  const n=teamNews(CASE,id),opts=[];
  for(const t of n.topics)opts.push({t:t.label,s:'Conversar',fn:()=>exchange(id,{kind:'topic',item:t}),keep:true});
  for(const r of n.requests)opts.push({t:r.label,s:'Pedir · '+r.kind.toLowerCase(),fn:()=>exchange(id,{kind:'request',item:r}),keep:true,main:true});
  const done=[...(CASE.teamTopics||[]).map(x=>teamDialogues.find(t=>t.id===x)).filter(t=>t&&t.memberId===id),...(CASE.requestedMaterials||[]).map(x=>teamMaterialRequests.find(r=>r.id===x)).filter(r=>r&&r.memberId===id)];
  const mats=(CASE.requestedMaterials||[]).map(x=>teamMaterialRequests.find(r=>r.id===x)).filter(r=>r&&r.memberId===id&&r.assetPaths&&r.assetPaths.length);
  for(const r of mats)opts.push({t:'Ver '+r.label.toLowerCase(),s:r.assetPaths.length+(r.assetPaths.length>1?' arquivos':' arquivo'),fn:()=>openGallery(r.assetPaths.map(pth=>({title:r.label,img:pth,cap:r.kind+' · '+(memberOf(id)||{}).name})),0),keep:true});
  if(done.length)opts.push({t:'Rever o que já conversamos',s:done.length+'',fn:()=>replay(id,done),keep:true});
  return {opts,count:n.count};
}
function teamTalk(id){
  const m=memberOf(id),menu=teamMenu(id),g=GREET[id];
  const pages=[];
  if(id==='sonia'&&!SEEN.sonia)pages.push(...soniaIntro());
  pages.push(menu.count?g[0]:g[1]);
  return {who:m.name,role:m.role+' · '+m.specialty,av:id,pages,opts:menu.opts};
}
function soniaIntro(){
  return [nF()>=7?'Li o seu resumo da casa. Porta intacta, painel mexido, cão preso, valores no lugar. Sete achados, e nenhum deles é de ladrão.'
    :nF()>0?`Você me trouxe ${nF()} de 7 achados da casa. Dá pra conversar com isso, mas o resto da cena continua lá, esperando.`
    :'Você veio sem fechar a leitura da casa. A cena não esquenta nem esfria por você, Lemos. Vale voltar.'];
}
// Lemos pergunta, o integrante responde; o save é gravado quando a resposta começa
function exchange(id,ex){
  const it=ex.item,m=memberOf(id);
  const ask=ex.kind==='topic'?it.user.text:`Consegue ${it.label.toLowerCase()} pra mim?`;
  const reply=ex.kind==='topic'?it.agent.text:it.response.text;
  const ok=ex.kind==='topic'?topicOk(CASE,it):requestOk(CASE,it);if(!ok)return;
  const after=()=>{
    const menu=teamMenu(id),extra=[];
    if(ex.kind==='request'&&it.assetPaths&&it.assetPaths.length)extra.push({t:'Ver '+it.label.toLowerCase(),s:it.assetPaths.length+(it.assetPaths.length>1?' arquivos':' arquivo'),main:true,keep:true,fn:()=>openGallery(it.assetPaths.map(pth=>({title:it.label,img:pth,cap:it.kind+' · '+m.name})),0)});
    const ppl=[...(it.callPeople||it.revealsPeople||[])];extra.push(...callOpts(ppl));
    return [...extra,...menu.opts.filter(o=>!extra.some(e=>e.t===o.t))];
  };
  talkSet({who:m.name,role:m.role+' · '+m.specialty,av:id,pages:[{me:true,t:ask},{t:reply,commit:()=>{CASE=writeCase(g=>ex.kind==='topic'?applyTopic(g,it):applyRequest(g,it));}}],opts:null,optsFn:after});
}
function replay(id,items){
  const m=memberOf(id),pages=[];
  for(const it of items){if(it.user){pages.push({me:true,t:it.user.text});pages.push({t:it.agent.text});}else{pages.push({me:true,t:`Consegue ${it.label.toLowerCase()} pra mim?`});pages.push({t:it.response.text});}}
  talkSet({who:m.name,role:m.role+' · '+m.specialty,av:id,pages,opts:null,optsFn:()=>teamMenu(id).opts});
}
/* ---------- Sala de depoimentos: chamar, ouvir e retomar, no mesmo save ---------- */
const DEPO_LINE={chamar:p=>({t:'Chamar '+p.first,s:p.role}),sem_provas:p=>({t:'Chamar '+p.first,s:'só com provas contra ele',disabled:true}),
  ouvir:p=>({t:'Ouvir '+p.first,s:'esperando',main:true}),retomar:p=>({t:'Retomar '+p.first,s:p.pending+(p.pending>1?' perguntas novas':' pergunta nova'),main:true}),registrado:p=>({t:'Rever depoimento de '+p.first,s:'registrado'})};
function depoOpt(p){
  const o=DEPO_LINE[p.state](p);
  if(p.state==='chamar'){o.keep=true;o.fn=()=>{CASE=writeCase(g=>summon(g,p.id));buildVisitors();toast('Sala de depoimentos',`${p.first} foi chamado e espera na recepção.`,{ini:'DH',col:'#96a7ae'});rebuildOpts();};}
  else if(!o.disabled)o.fn=()=>startDepo(p.id);
  return o;
}
function interroTalk(){
  const list=depoPeople(CASE),pages=['Mesa de aço, dois copos, um gravador e o espelho que não é espelho. Quem for chamado entra por aqui, separado dos outros.'];
  const wait=list.filter(p=>p.state==='ouvir');
  pages.push(wait.length?(wait.length===1?`${wait[0].first} já está esperando.`:`Esperando: ${wait.map(p=>p.first).join(', ')}.`):'Ninguém esperando agora. Quem chamar, e quando, é decisão sua.');
  return {who:'Sala de depoimentos',role:'Gravação e espelho',av:'icon',pages,optsFn:()=>depoPeople(CASE).map(depoOpt)};
}
// atalhos que uma conversa da equipe oferece para as pessoas que ela cita
function callOpts(ids){
  const list=depoPeople(CASE);
  return [...new Set(ids)].map(id=>list.find(p=>p.id===id)).filter(Boolean).map(p=>{
    if(p.state==='chamar'||p.state==='sem_provas')return Object.assign(depoOpt(p),{t:`Chamar ${p.first} para depoimento`});
    if(p.state==='ouvir'||p.state==='retomar')return {t:`${p.state==='ouvir'?'Ouvir':'Retomar'} ${p.first}`,s:'sala de depoimentos',main:true,fn:()=>goTalk('hot','interro',p.id)};
    return null;}).filter(Boolean);
}
// quem foi chamado espera na cena: o primeiro na cadeira da sala, os outros no sofá da recepção
const VFR={};let VIS=[],INTERRO_NEWS=false;
function buildVisitors(){
  const all=depoPeople(CASE),wait=all.filter(p=>p.state==='ouvir');INTERRO_NEWS=all.some(p=>p.state==='ouvir'||p.state==='retomar');
  // quem está esperando para depor passa na frente da fila de download
  if(started)loadPrep().then(m=>m.prioritize(all.filter(p=>p.state==='ouvir'||p.state==='retomar').map(p=>p.id))).catch(()=>{});
  const seats=[[5,11.45,1],[18,15,1],[19,15,1],[20,15,-1],[17,16,1]];
  VIS=wait.slice(0,seats.length).map((p,k)=>{const v=VFR[p.id]||(VFR[p.id]={id:p.id,name:p.first,look:LOOK[p.id]||LOOK.lemos,walk:0,moving:false});return Object.assign(v,{x:seats[k][0],y:seats[k][1],dir:seats[k][2]});});
}
let depoOpen=false;
// o depoimento (React, retratos, perguntas) é carregado à parte: baixa sozinho alguns segundos depois de entrar na base
/* Partes carregadas à parte (depoimento, quadro). Depois de uma atualização do jogo, a página aberta ainda aponta para os
   arquivos da versão anterior, que já não existem: a importação falha e a sala ficaria preta. Nesse caso a página
   recarrega uma vez, já na versão nova; uma falha não fica guardada (a próxima tentativa importa de novo). */
const lazyPart=imp=>{let p=null;return ()=>p||(p=imp().then(m=>{if(!m)throw new Error('parte vazia');safe(()=>sessionStorage.removeItem('base.reload'));return m;}).catch(e=>{p=null;throw e;}));};
function partFailed(close,reopen){
  close();
  if(!safe(()=>sessionStorage.getItem('base.reload'),null)){safe(()=>{sessionStorage.setItem('base.reload','1');if(reopen)sessionStorage.setItem('base.reopen',reopen);});location.reload();return;}
  toast('Base','Não deu para abrir agora. Verifique a conexão e tente de novo.');
}
const loadDepo=lazyPart(()=>import('./deposition'));
function startDepo(id){
  if(talk)closeTalk();
  HUD.stopRoom();depoOpen=true;const host=$('#depo');host.hidden=false;document.body.classList.add('depo-on');
  // a base fica escondida atrás do depoimento: libera a memória das telas dela (no iPhone, faltar memória recarrega a página)
  cv.width=cv.height=1;lc.width=lc.height=1;
  const back=()=>{host.hidden=true;depoOpen=false;document.body.classList.remove('depo-on');sizeCanvas();checkArt();refreshCase();buildVisitors();last=performance.now();};
  loadDepo().then(m=>m.openDeposition(host,id,back),()=>partFailed(back,'depo:'+id));
}
// quadro do caso: React à parte, como o depoimento; a base pausa e libera a memória enquanto ele está aberto
const loadBoard=lazyPart(()=>import('./board'));
// carregamento em duas fases: o essencial do momento do caso antes de entrar (com barra no cartão de abertura)
// e o resto aos poucos enquanto o jogador anda pela base (src/preload)
const loadPrep=lazyPart(()=>import('../preload/prep'));
function introTexts(){
  if(!NIGHT)return;
  const set=(sel,t)=>{const e=$(sel);if(e)e.textContent=t;};
  set('#intro .eb','Caso 01 · Plantão do DHPP');set('#intro h1','Madrugada no DHPP');
  set('#intro .call p',briefed()?'Lemos, a casa da Rua das Acácias. Maurício está te esperando.':'Lemos, na minha sala. Chegou um caso: duplo homicídio na Rua das Acácias.');
  set('#b-start','Começar o plantão');
}
introTexts();
function prepIntro(){
  const btn=$('#b-start'),box=$('#b-prep'),fill=box.querySelector('b'),label=box.querySelector('span'),txt=btn.textContent;
  let ready=false;
  const finish=()=>{if(ready)return;ready=true;clearTimeout(slow);clearTimeout(giveUp);btn.disabled=false;btn.textContent=txt;box.hidden=true;};
  // se já está tudo no aparelho, termina antes de a barra aparecer
  const slow=setTimeout(()=>{if(!ready){box.hidden=false;btn.disabled=true;btn.textContent='Preparando o caso…';}},350);
  const giveUp=setTimeout(finish,12000);
  const prog=(d,t)=>{const k=t?d/t:1;fill.style.width=Math.round(k*100)+'%';label.textContent=`Baixando o material do caso · ${Math.round(k*100)}%`;};
  // o quadro já fica pronto para abrir sem travar (Lemos decodificado, cortiça e parede desenhadas)
  Promise.all([loadPrep().then(m=>m.prepare(prog)).then(()=>loadBoard()).then(m=>m.prewarm()),loadDepo(),new Promise(r=>setTimeout(r,0)).then(()=>street().ready)]).then(finish,finish); // a arte da rua: depois de o módulo terminar de montar
}
prepIntro();
function startBoard(){
  if(talk)closeTalk();
  // a base continua na tela (parada) até o quadro estar pronto para pintar a entrada: nunca aparece tela preta no meio
  HUD.stopRoom();depoOpen=true;boardPrepT=0;const host=$('#board');hideHost(host);host.hidden=false;
  const shown=()=>{host.style.visibility='';host.style.pointerEvents='';document.body.classList.add('depo-on');cv.width=cv.height=1;lc.width=lc.height=1;};
  const back=()=>{host.hidden=true;showHost(host);boardPrepared=false;depoOpen=false;document.body.classList.remove('depo-on');sizeCanvas();checkArt();refreshCase();buildVisitors();last=performance.now();};
  loadBoard().then(m=>m.openBoard(host,boardOpts(shown,back)),()=>partFailed(back,'board'));
}
const hideHost=h=>{h.style.visibility='hidden';h.style.pointerEvents='none';};
const showHost=h=>{h.style.visibility='';h.style.pointerEvents='';};
const boardOpts=(shown,back)=>({found:FOUND,onShown:shown,onClose:back,onDeposition:id=>startDepo(id),onTeam:id=>goTalk('npc',id),onSummoned:()=>{refreshCase();}});
// o quadro é montado escondido quando o Lemos vai até ele ou passa perto; ao chegar, só aparece (sem espera)
let boardPrepared=false,boardPrepT=0,boardCase=null,boardCaseJ='';
function boardNearTick(dt){
  if(!started||depoOpen)return;
  // o caso mudou (uma conversa, um pedido): refaz o quadro escondido já com o caso novo
  if(boardPrepared&&boardCase!==CASE){const j=JSON.stringify(CASE);if(j===boardCaseJ)boardCase=CASE;else{boardPrepared=false;loadBoard().then(m=>{if(!depoOpen)m.discardBoard();}).catch(()=>{});}}
  const want=(P1.pend&&P1.pend.id==='quadro')||(roomOf(P1)==='equipe'&&dist(P1.x,P1.y,15,6.5)<4);
  if(want){boardPrepT=0;if(!boardPrepared){boardPrepared=true;boardCase=CASE;boardCaseJ=JSON.stringify(CASE);const host=$('#board');hideHost(host);host.hidden=false;
    loadBoard().then(m=>{if(boardPrepared&&!depoOpen)m.prepareBoard(host,boardOpts(()=>{},()=>{}));}).catch(()=>{boardPrepared=false;});}}
  // longe do quadro por um tempo: desmonta para liberar a memória
  else if(boardPrepared&&(boardPrepT+=dt)>2){boardPrepared=false;boardPrepT=0;loadBoard().then(m=>{if(!depoOpen){m.discardBoard();$('#board').hidden=true;}}).catch(()=>{});}
}
const DLG={
  sonia:()=>NIGHT?soniaNight():teamTalk('sonia'),mauricio:()=>teamTalk('mauricio'),renata:()=>teamTalk('renata'),paulo:()=>teamTalk('paulo'),denise:()=>teamTalk('denise'),
  sonia_mesa:()=>({who:'Mesa da delegada',role:'Sala de Sônia Prado',av:'icon',pages:['Pasta aberta, telefone fora do gancho pela metade, xícara vazia. Nada aqui é para você mexer sem ela dizer.'],opts:[]}),
  guarda:()=>({who:'Guarda',role:'Controle de acesso · DHPP',av:'guarda',pages:['Bom dia, doutor. A porta só abre com o crachá de vocês.','Quem vem depor espera no sofá até alguém da equipe buscar.'],opts:[]}),
  plantao:()=>({who:'Plantão',role:'Recepção · DHPP',av:'plantao',pages:['A imprensa ligou duas vezes. Respondi o que a delegada mandou: sem comentários.','Se alguém procurar a equipe, passa por mim primeiro.'],opts:[]}),
  mesa_lemos:()=>({who:'Sua mesa',role:'Lemos · DHPP',av:'icon',pages:[NIGHT?'Café frio, a escala do plantão e o rádio ligado baixo. A noite estava parada até agora.':'Café frio e a pasta do Caso 01 aberta. O que já se sabe está na caderneta.'],opts:[{t:'Abrir a caderneta',s:'O caso agora',fn:()=>HUD.openBook('caso'),main:true}]}),
  celular_helena:()=>helenaPhone(),
  fotos:()=>FOUND.length?{who:'Mesa de luz',role:'Perícia',av:'icon',pages:['Fotografias periciais da casa, reveladas e penduradas para análise.'],opts:[{t:'Ver as fotos',s:`${FOUND.length} de 7`,fn:()=>openGallery(0),main:true}]}
    :{who:'Mesa de luz',role:'Perícia',av:'icon',pages:['A mesa de luz está apagada. Nenhuma foto da casa chegou ainda.'],opts:[{t:'Ir para a casa',s:'Rua das Acácias',href:'/casa/'}]},
  interro:()=>interroTalk(),
  arquivo:()=>({who:'Arquivo Morto',role:'Caixas e prateleiras',av:'icon',
    pages:['Caixas de casos que ninguém fechou, com o nome escrito a lápis na lateral. Todo caso daqui começou parecendo simples.','O de hoje ainda cabe numa gaveta. O que já chegou dele está no quadro da sala da equipe.'],opts:NIGHT?[]:[{t:'Abrir o quadro do caso',s:'Sala da equipe',fn:()=>startBoard(),main:true}]})
};
/* plantão: a Sônia passa a ocorrência (no lugar da antiga chamada) e manda Lemos para a casa */
function soniaNight(){
  const go={t:'Ir para a Rua das Acácias',s:'A casa do crime',fn:goCasa,main:true};
  if(briefed())return {who:'Sônia Prado',role:'Delegada · DHPP',av:'sonia',pages:['Ainda aqui? A PM está segurando a frente da casa. Vai.'],opts:[go]};
  return {who:'Sônia Prado',role:'Delegada · DHPP',av:'sonia',pages:[
    {t:'Lemos, temos um caso. Duplo homicídio na Rua das Acácias: Ricardo e Helena Valença, mortos no quarto.'},
    {t:'A filha, Lívia, chegou de madrugada e diz que encontrou a casa revirada. Ligou para o 190.'},
    {me:true,t:'Assalto?'},
    {t:'É o que parece. Quero primeiro o que não combina com roubo. Revise a cena antes de ouvir qualquer versão.'},
    {t:'A perícia está presa em outra ocorrência, então a cena é sua: você examina e fotografa. A PM segura a frente e te dá apoio. Me chama pelo rádio.',commit:()=>{CASE=writeCase(g=>({...g,briefed:true}));}}],opts:[go]};
}
function goCasa(){closeTalk();fadeTo(()=>{location.href='/casa/';});}
/* o celular de Helena, apreendido e lacrado na perícia: mensagens e agenda (antes, o app "Tel. Helena" do aparelho) */
const HELENA_AGENDA=[
  ['02/10','Ricardo e Lívia brigaram de novo por causa do Caio. Tentei mediar. Acho o namoro prejudicial, mas não sei como dizer isso sem piorar.'],
  ['09/10','Ricardo falou em cortar parte do apoio da Lívia. Pedi calma. Preciso conversar com ela antes que ele faça isso.'],
  ['14/10','A Lívia anda calada e sai com o Caio quase toda noite. Preciso sentar com ela. Sozinha, sem o pai.'],
  ['16/10','Lívia pediu para conversar. Disse que amanhã. Hoje não, o Ricardo ainda está alterado.']];
function helenaPhone(){
  const c=CASE||readCase(),open=c.task>=3||(c.requestedMaterials||[]).includes('termo_apreensao_celular_helena');
  if(!open)return {who:'Saco de provas',role:'Perícia · lacrado',av:'icon',pages:[NIGHT?'A bancada de provas está vazia. O material da noite ainda está na casa.':'Um celular lacrado, com etiqueta de custódia em nome de Helena Valença. Só abre depois do auto de apreensão e de quando a investigação precisar dele.'],opts:[]};
  return {who:'Celular de Helena',role:'Aparelho apreendido · acesso autorizado',av:'icon',pages:[
    'Mensagens. Rafael, ontem às 22:14: “mãe, vou ficar mais um pouco na lan”. Helena: “Não demore. Seu pai já está dormindo.”',
    'Lívia, ontem às 18:42: “mãe podemos conversar quando eu voltar?”. Helena: “Amanhã. Hoje não.”',
    ...HELENA_AGENDA.map(([d,t],i)=>i===HELENA_AGENDA.length-1?{t:`Agenda, ${d}: ${t}`,commit:()=>{CASE=writeCase(g=>g.clues.includes('agenda_helena')?g:{...g,clues:[...g.clues,'agenda_helena']});}}:`Agenda, ${d}: ${t}`)],opts:[]};
}
let talk=null,tkTimer=0,talkPrevZ=null;
function avatarHTML(av){
  const n=NPCS.find(x=>x.id===av);
  if(av==='sonia')return `<img src="/sonia.jpg" alt="">`;
  if(n)return n.ini;
  return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#10161a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/></svg>';
}
function setSeen(id){SEEN[id]=1;safe(()=>localStorage.setItem('base.seen',JSON.stringify(SEEN)));}
function talkFocus(){
  if(!talk)return null;const n=NPCS.find(x=>x.id===talk.id);
  if(n)return [(P1.x+n.x)/2,(P1.y+n.y)/2];
  let sx=0,sy=0,c=0;for(let i=0;i<N;i++)if(hot[i]===talk.id){sx+=i%W;sy+=(i/W)|0;c++;}
  return c?[(P1.x+sx/c)/2,(P1.y+sy/c)/2]:[P1.x,P1.y];
}
function openTalk(id){
  if(id==='quadro'){setSeen(id);startBoard();return;}
  const def=DLG[id];if(!def)return;
  refreshCase();
  setSeen(id);HUD.stopRoom();talkOpen=true;document.body.classList.add('talking');
  const n=NPCS.find(x=>x.id===id);if(n){n.hold=true;n.path=[];n.moving=false;n.say=null;n.dir=P1.x<n.x?-1:1;}
  if(n&&Math.abs(P1.x-n.x)>0.3)P1.dir=n.x>P1.x?1:-1;
  talkStopAnims();
  talk={id};talkSet(def());
  $('#talk').hidden=false;$('#tk-link').removeAttribute('hidden');updLink();talkBirth();
  talkPrevZ=cam.z;follow=true;const cf=talkFocus();if(cf)CAMCTRL.focus({id:'talk',mode:'context',priority:CAMERA_PRIORITY.context,x:cf[0]*T+16,y:cf[1]*TH+TH/2-14,duration:520,hold:1200,interruptible:true});zoomTo(Math.max(cam.z,TALKZ()));
}
/* quem fala, na tela: o anel fica sobre a cabeça (ou sobre o objeto) e o rastro desce até o ponto mais perto do cartão */
const CALM_MQ=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):null;const CALM=()=>!!(CALM_MQ&&CALM_MQ.matches);   // consultado a cada quadro: a consulta é criada uma vez só
let tkAnims=[];
function talkStopAnims(){for(const a of tkAnims)try{a.cancel();}catch(_){}tkAnims=[];$('#tk-dot').hidden=true;$('#talk').style.pointerEvents='';}
function talkWho(){
  if(!talk)return null;
  const pg=talk.d&&talk.d.pages[talk.page],me=pg&&typeof pg!=='string'&&pg.me,n=me?P1:NPCS.find(x=>x.id===talk.id);
  let wx,wy;
  if(n){wx=Math.round(n.x*T)+16;wy=Math.round(n.y*TH)+TH-2-(n._sit?44:50);}
  else{
    const o=objs.find(o=>o.hot===talk.id&&o.spr);
    if(o){wx=o.x*T+o.w*T/2;wy=o.spr.y-4;}
    else{let sx=0,sy=0,c=0;for(let i=0;i<N;i++)if(hot[i]===talk.id){sx+=i%W;sy+=(i/W)|0;c++;}if(!c)return null;wx=sx/c*T+16;wy=sy/c*TH-20;}
  }
  return {x:(wx-cam.x)*cam.z+VW()/2,y:(wy-cam.y)*cam.z+VH()/2-(n?12:0),me:!!me};
}
function talkCard(){const el=$('#talk');return {l:el.offsetLeft,t:el.offsetTop,w:el.offsetWidth,h:el.offsetHeight};}
function cardPoint(c,s){return {x:clamp(s.x,c.l+22,c.l+c.w-22),y:clamp(s.y,c.t+12,c.t+c.h-12)};}
function updLink(){
  const s=talkWho(),svg=$('#tk-link');if(!s){svg.style.visibility='hidden';return;}svg.style.visibility='';
  const a=cardPoint(talkCard(),s),d=Math.hypot(a.x-s.x,a.y-s.y)||1,k=11/d;
  const L=$('#tk-trail');L.setAttribute('x1',(s.x+(a.x-s.x)*k).toFixed(1));L.setAttribute('y1',(s.y+(a.y-s.y)*k).toFixed(1));L.setAttribute('x2',a.x.toFixed(1));L.setAttribute('y2',a.y.toFixed(1));
  for(const id of ['#tk-ring','#tk-ring2','#tk-pin']){const c=$(id);c.setAttribute('cx',s.x.toFixed(1));c.setAttribute('cy',s.y.toFixed(1));}
  svg.classList.toggle('me',s.me);
}
/* o ponto amarelo sai de quem fala e vai até o cartão (dur ms) */
function talkDot(s,a,dur){
  const dot=$('#tk-dot');dot.hidden=false;
  const p=(q,sc,o)=>({transform:`translate(${q.x.toFixed(1)}px,${q.y.toFixed(1)}px) scale(${sc})`,opacity:o});
  const kf=[p(s,.3,0),Object.assign(p(s,1,1),{offset:.22}),Object.assign(p(a,1,1),{offset:.88}),p(a,1.5,0)];
  const an=dot.animate(kf,{duration:dur,easing:'cubic-bezier(.5,0,.3,1)'});an.onfinish=()=>{dot.hidden=true;};tkAnims.push(an);return an;
}
/* nasce de quem fala: o ponto desce deixando o rastro e cresce até virar o cartão */
function talkBirth(){
  const el=$('#talk');if(CALM()||!el.animate)return;
  const s=talkWho();if(!s)return;
  const c=talkCard(),a=cardPoint(c,s),ax=a.x-c.l,ay=a.y-c.t,R=Math.ceil(Math.hypot(Math.max(ax,c.w-ax),Math.max(ay,c.h-ay)))+6;
  talkDot(s,a,560);
  tkAnims.push($('#tk-link').animate([{opacity:0},{opacity:1}],{duration:320,delay:140,fill:'backwards'}));
  tkAnims.push(el.animate([{clipPath:`circle(0px at ${ax}px ${ay}px)`},{clipPath:`circle(7px at ${ax}px ${ay}px)`,offset:.12},{clipPath:`circle(${R}px at ${ax}px ${ay}px)`}],{duration:480,delay:460,easing:'cubic-bezier(.3,.7,.15,1)',fill:'backwards'}));
}
function talkSet(d){if(!talk)return;talk.d=d;talk.page=0;showPage();}
function speaker(pg){
  const d=talk.d,me=pg&&pg.me,n=NPCS.find(x=>x.id===talk.id),av=$('#tk-av');
  if(me){av.style.background='#d9a273';av.innerHTML='LM';$('#tk-who').textContent='Lemos';$('#tk-role').textContent='Você';}
  else{av.style.background=n?n.col:'#96a7ae';av.innerHTML=avatarHTML(d.av);$('#tk-who').textContent=d.who;$('#tk-role').textContent=d.role;}
  $('#talk').classList.toggle('me',!!me);
  // a vez passa para o outro: o ponto refaz o caminho de quem fala agora até o cartão
  if(talk.who!=null&&talk.who!==!!me&&!CALM()&&!$('#talk').hidden){const s=talkWho();if(s)talkDot(s,cardPoint(talkCard(),s),380);}
  talk.who=!!me;
}
function showPage(){
  const t=talk,pg=t.d.pages[t.page],s=typeof pg==='string'?pg:pg.t;t.typed=0;t.done=false;$('#tk-opts').innerHTML='';$('#tk-more').hidden=true;
  speaker(typeof pg==='string'?null:pg);
  if(pg&&pg.commit){pg.commit();pg.commit=null;}
  clearInterval(tkTimer);const el=$('#tk-text');el.textContent='';
  tkTimer=setInterval(()=>{t.typed+=2;el.textContent=s.slice(0,t.typed);if(t.typed>=s.length)finishPage();},18);
}
function finishPage(){
  const t=talk;if(!t||t.done)return;clearInterval(tkTimer);t.done=true;const pg=t.d.pages[t.page];$('#tk-text').textContent=typeof pg==='string'?pg:pg.t;
  const last=t.page>=t.d.pages.length-1,box=$('#tk-opts');
  if(!last){$('#tk-more').hidden=false;return;}
  box.innerHTML='';const opts=t.d.optsFn?t.d.optsFn():(t.d.opts||[]);
  for(const o of opts){const b=document.createElement('button');if(o.main)b.className='main';if(o.disabled)b.disabled=true;b.innerHTML=`<b>${o.t}</b>${o.s?`<span>${o.s}</span>`:''}`;
    b.addEventListener('click',e=>{e.stopPropagation();if(o.href){location.href=o.href;return;}if(o.keep){o.fn();return;}closeTalk();if(o.fn)o.fn();});box.appendChild(b);}
  const c=document.createElement('button');c.innerHTML='<b>Voltar à base</b>';c.addEventListener('click',e=>{e.stopPropagation();closeTalk();});box.appendChild(c);
  box.scrollTop=0;
}
function rebuildOpts(){if(!talk||!talk.done)return;talk.done=false;finishPage();}
function advance(){
  if(!talk)return;if(!talk.done){finishPage();return;}
  if(talk.page<talk.d.pages.length-1){talk.page++;showPage();}
}
function closeTalk(){
  clearInterval(tkTimer);if(talk){const n=NPCS.find(x=>x.id===talk.id);if(n){n.hold=false;if(n.act&&n.act.st!=='do'){n.act=null;n.actT=1.5+Math.random()*2;}}}
  // o cartão volta a ser um ponto no lugar de onde nasceu
  const el=$('#talk'),s=!el.hidden&&!CALM()&&el.animate?talkWho():null;
  talkStopAnims();$('#tk-link').setAttribute('hidden','');
  if(s){
    const c=talkCard(),a=cardPoint(c,s),ax=a.x-c.l,ay=a.y-c.t,R=Math.ceil(Math.hypot(Math.max(ax,c.w-ax),Math.max(ay,c.h-ay)))+6;
    el.style.pointerEvents='none';
    const an=el.animate([{clipPath:`circle(${R}px at ${ax}px ${ay}px)`},{clipPath:`circle(0px at ${ax}px ${ay}px)`}],{duration:220,easing:'cubic-bezier(.6,0,.8,.4)',fill:'forwards'});
    tkAnims.push(an);
    an.onfinish=()=>{if(talk)return;el.hidden=true;el.classList.remove('me');an.cancel();el.style.pointerEvents='';};
  }else{el.hidden=true;el.classList.remove('me');}
  talk=null;talkOpen=false;document.body.classList.remove('talking');follow=true;
  CAMCTRL.cancelFocus('talk');
  if(talkPrevZ!=null){zoomTo(talkPrevZ);talkPrevZ=null;}
}
$('#tk-x').addEventListener('click',e=>{e.stopPropagation();closeTalk();});
$('#talk').addEventListener('click',advance);


/* ---------- HUD do Lemos (src/hud/hud.js, docs/HUD_LEMOS.md) ---------- */
// Onde o nome do lugar entra com as faixas de cinema (docs/HUD_LEMOS.md, "Onde o título aparece"). Só os lugares
// que pesam na história e a chegada ao prédio; corredor restrito, sala da equipe e corredores são passagem e ficam só
// no nome pequeno do cabeçalho. Cada um aparece uma vez por sessão.
const ROOM_TITLE={
  rua:'São Paulo · outubro de 2002',      // chegada: situa tempo e lugar
  predio:'Departamento de Homicídios',    // entrar no prédio (recepção ou pátio): o nome é "DHPP"
  sonia:'DHPP · Delegada Sônia Prado',    // primeira ordem do caso
  interro:'DHPP · Depoimentos',           // onde as pessoas são ouvidas
  pericia:'DHPP · Material do caso',      // onde as provas chegam
  arquivo:'DHPP · Casos encerrados'       // o Arquivo Morto
};
// a recepção e o pátio contam como "o prédio": a faixa entra uma vez quando Lemos chega ao DHPP
const PLACE_OF={hall:'predio',fora:'predio'};
const PLACE_NAME={rua:'Rua do DHPP',predio:'DHPP'};
const HUD_SEEN='invesphone.hud.seen';
const DEPO_TXT={chamar:'não chamado',sem_provas:'não chamado',ouvir:'chamado para depor',retomar:'depoimento em aberto',registrado:'depoimento registrado'};
function hudData(){
  const c=CASE||readCase(),known=c.discoveredPeople||DEFAULT_DISCOVERED,dp=depoPeople(c);
  // de madrugada, Lemos só conhece quem a Sônia citou (a filha que encontrou a cena); o resto aparece depois da casa
  const people=PEOPLE.filter(p=>p.id!=='sonia'&&(NIGHT?c.briefed&&p.id==='livia':known.includes(p.id))).map(p=>{const d=dp.find(x=>x.id===p.id);return {id:p.id,name:p.name,role:p.role,photo:p.id==='livia'?'/characters/livia/expressions/neutral.jpg':`/characters/${p.id}/portrait.jpg`,state:d?DEPO_TXT[d.state]:''};});
  const clues=(c.clues||[]).map(id=>{const k=CLUE_LIST.find(x=>x.id===id);return k?{id,title:k.title,desc:k.description}:null;}).filter(Boolean);
  return {people,clues,guide:caseGuide(c,{casa:!NIGHT,briefed:!!c.briefed})};
}
/* o próximo passo da caderneta leva ao lugar natural: Sônia, equipe, depoimento, quadro ou a casa */
function runGuide(){
  const G=caseGuide(CASE||readCase(),{casa:!NIGHT,briefed:briefed()}),go=G.next&&G.next.go;if(!go)return;
  if(go.kind==='casa')goCasa();
  else if(go.kind==='sonia')goTalk('npc','sonia');
  else if(go.kind==='team')goTalk('npc',go.memberId);
  else if(go.kind==='summon'){CASE=writeCase(g=>summon(g,go.personId));buildVisitors();refreshCase();}
  else if(go.kind==='depo')goTalk('hot','interro',go.personId);
  else if(go.kind==='report')goTalk('hot','quadro');
  else if(go.kind==='clues')HUD.openBook('pistas');
}
const HUD=createHud({app:appEl,clock:()=>clockStr(),data:hudData,onGuide:()=>runGuide(),canShow:()=>started&&!talkOpen&&!depoOpen&&!BADGE.open&&!galOpen&&!$('#intro')?.offsetParent});
let HSEEN=safe(()=>JSON.parse(localStorage.getItem(HUD_SEEN)||'null'),null);
const hudSig=c=>({clues:[...(c.clues||[])],mats:[...(c.requestedMaterials||[])],ppl:[...(c.discoveredPeople||DEFAULT_DISCOVERED)],heard:[...(c.interviewed||[])]});
// o que chegou no save desde a última olhada vira descoberta (material, pessoa, depoimento) ou pista anexada
function hudWatch(){
  if(!CASE)return;const s=hudSig(CASE);
  if(!HSEEN||!Array.isArray(HSEEN.clues)){HSEEN=s;safe(()=>localStorage.setItem(HUD_SEEN,JSON.stringify(s)));HUD.setCount(s.clues.length);return;}
  const nw=k=>s[k].filter(x=>!(HSEEN[k]||[]).includes(x));const mats=nw('mats'),ppl=nw('ppl'),heard=nw('heard'),cl=nw('clues');
  if(!mats.length&&!ppl.length&&!heard.length&&!cl.length)return;
  HSEEN=s;safe(()=>localStorage.setItem(HUD_SEEN,JSON.stringify(s)));
  const found=[];
  mats.slice().reverse().forEach(id=>{const m=teamMaterialRequests.find(r=>r.id===id);if(!m)return;const who=(caseTeam.find(t=>t.id===m.memberId)||{}).name||'Equipe';
    const imgs=(m.assetPaths||[]).filter(p=>/\.(jpe?g|png|svg|webp)$/i.test(p));
    found.push({title:m.label,who:who.split(' ')[0],onOpen:imgs.length?()=>openGallery(imgs.map(img=>({title:m.label,img,cap:'Material da equipe · '+who})),0):null});});
  ppl.forEach(id=>{const p=PEOPLE.find(x=>x.id===id);if(p)found.push({title:'Nova pessoa: '+p.name,who:'Investigação',onOpen:()=>HUD.openBook('pessoas')});});
  heard.forEach(id=>{const p=PEOPLE.find(x=>x.id===id);if(p)found.push({title:'Depoimento de '+p.name.split(' ')[0]+' registrado',who:'Depoimentos',onOpen:()=>HUD.openBook('pessoas')});});
  // um cartão só: o material vem antes do depoimento e da pessoa; o resto fica na caderneta
  if(found.length){const d=found[0];if(found.length>1)d.who+=` · +${found.length-1}`;HUD.discovery(d);}
  const base=s.clues.length-cl.length,show=cl.slice(-3),skip=cl.length-show.length;
  show.forEach((id,k)=>{const t=CLUE_LIST.find(x=>x.id===id);const n=base+skip+k+1;HUD.evidence({title:t?t.title:id,label:'Pista '+n+' · anexada',n});});
}
HUD.setCount(HSEEN&&Array.isArray(HSEEN.clues)?HSEEN.clues.length:(CASE&&CASE.clues||[]).length);
setInterval(hudWatch,900);
// nome do lugar ao entrar: só nos lugares de ROOM_TITLE e uma vez por sessão do navegador (vale também depois de ir ao
// aparelho e voltar, ou de o iPhone recarregar a aba). Espera Lemos ficar 450 ms no lugar e a tela estar livre: se ele
// chegou já conversando (tocou na Sônia, na mesa de depoimento...), o nome entra quando a conversa fecha, se ele ainda
// estiver ali.
const HUD_PLACES='invesphone.hud.lugares';
const hudRoomShown=safe(()=>JSON.parse(sessionStorage.getItem(HUD_PLACES)||'{}'),{})||{};
// Se Lemos está a caminho de uma conversa (P1.pend), espera ela abrir e fechar. Se as faixas forem cortadas logo no
// começo (o jogador tocou em alguém), o lugar não conta como mostrado e o nome volta depois.
let hudRoomKey='',hudRoomAt=0,hudFreeAt=0;
// chegar ao prédio não espera Lemos parar de andar: a faixa entra logo e a leitora de crachá aguarda o nome ser lido
const hudFree=key=>started&&!talkOpen&&!depoOpen&&!BADGE.open&&!galOpen&&!(key!=='rua'&&key!=='predio'&&P1.pend)&&!$('#intro')?.offsetParent&&!HUD.bookOpen;
const hudPlacesSave=()=>safe(()=>sessionStorage.setItem(HUD_PLACES,JSON.stringify(hudRoomShown)));
function hudRoomTick(){
  const r=SCENE==='rua'?'rua':roomOf(P1),key=PLACE_OF[r]||r,now=performance.now();
  const free=hudFree(key);if(!free)hudFreeAt=now;
  if(key!==hudRoomKey){hudRoomKey=key;hudRoomAt=now;if(key!=='predio')return;}
  const wait=key==='predio'?0:450;
  if(!free||!ROOM_TITLE[key]||hudRoomShown[key]||now-hudRoomAt<wait||(wait&&now-hudFreeAt<500))return;
  const name=PLACE_NAME[key]||ROOM_NAME[key];
  if(HUD.room(name,ROOM_TITLE[key],key==='predio'?null:()=>{delete hudRoomShown[key];hudPlacesSave();})){hudRoomShown[key]=1;hudPlacesSave();}
}
setInterval(hudRoomTick,200);
/* ---------- Fotos ---------- */
let galI=0,GAL=[];
function openGallery(list,i){
  if(typeof list==='number'){i=list;list=FOUND.map(id=>({title:CLUES[id].title,img:CLUES[id].img,cap:'Fotografia pericial · '+CLUES[id].room}));}
  if(!list.length)return;GAL=list;galI=clamp(i||0,0,list.length-1);const c=GAL[galI];
  $('#g-img').src=c.img;$('#g-title').textContent=c.title;$('#g-cap').textContent=c.cap||'';$('#g-n').textContent=`${galI+1} / ${GAL.length}`;
  $('#g-prev').hidden=$('#g-next').hidden=GAL.length<2;
  $('#g-pic').classList.remove('z');$('#gal').hidden=false;galOpen=true;HUD.stopRoom();
}
let galOpen=false;
$('#g-x').addEventListener('click',()=>{$('#gal').hidden=true;galOpen=false;});
$('#g-prev').addEventListener('click',()=>openGallery(GAL,(galI+GAL.length-1)%GAL.length));
$('#g-next').addEventListener('click',()=>openGallery(GAL,(galI+1)%GAL.length));
$('#g-img').addEventListener('click',()=>$('#g-pic').classList.toggle('z'));

/* ---------- Toques e movimento ---------- */
let toastT=0;
function toast(who,text,av){
  if(HUD.roomOn()){setTimeout(()=>toast(who,text,av),500);return;}   // não cobre as faixas de cinema
  const el=$('#toast');el.innerHTML=`<span class="av" style="background:${av&&av.col||'#c9a24a'}">${av&&av.img?`<img src="${av.img}" alt="">`:(av&&av.ini)||''}</span><div><small>${who}</small><p>${text}</p></div>`;
  el.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{el.hidden=true;},4200);
}
function dist(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}
function reachNpc(n){return dist(P1.x,P1.y,n.x,n.y)<=2.3;}
function reachHot(id){for(let i=0;i<N;i++)if(hot[i]===id&&dist(P1.x,P1.y,i%W,(i/W)|0)<=1.9)return true;return false;}
function goTalk(kind,id,depo){
  P1.pend=null;if(talk)closeTalk();
  if(kind==='npc'?reachNpc(NPCS.find(n=>n.id===id)):reachHot(id)){P1.path=[];if(depo)startDepo(depo);else openTalk(id);return;}
  const targets=[];if(kind==='npc'){const n=NPCS.find(x=>x.id===id);targets.push([n.x,n.y,2.3]);}else for(let i=0;i<N;i++)if(hot[i]===id)targets.push([i%W,(i/W)|0,1.9]);
  const e=bfs(ti(P1),i=>{if(!walkPass(i))return false;const x=i%W,y=(i/W)|0;return targets.some(t=>dist(x,y,t[0],t[1])<=t[2]);},n=>walkPass(n)||n===ti(P1));
  if(e<0){toast('Base','Não dá para chegar até lá agora.');return;}
  P1.path=pathTo(e);P1.pend={kind,id,depo};follow=true;
}
function goTile(i){
  if(((i/W)|0)>=18){goExit();return;}
  P1.pend=null;let e=-1;
  if(walkPass(i))e=bfs(ti(P1),n=>n===i,n=>walkPass(n));
  else{const t=bfs(i,n=>walkPass(n),()=>true);if(t<0)return;e=bfs(ti(P1),n=>n===t,n=>walkPass(n));}
  if(e<0)return;
  P1.path=pathTo(e);follow=true;
}
function s2w(sx,sy){const e=cam.z;return {x:cam.x+(sx-VW()/2)/e,ys:cam.y+(sy-VH()/2)/e};}
function tap(sx,sy){
  const w=s2w(sx,sy),wx=w.x,wy=w.ys;
  const ns=[...NPCS].sort((a,b)=>b.y-a.y);
  for(const v of VIS){const X=v.x*T+16,Y=v.y*TH+TH-2;if(wx>=X-16&&wx<=X+16&&wy>=Y-46&&wy<=Y+4){goTalk('hot','interro',v.id);return;}}
  for(const n of ns){const X=Math.round(n.x*T)+16,Y=Math.round(n.y*TH)+TH-2;if(wx>=X-16&&wx<=X+16&&wy>=Y-50&&wy<=Y+4&&DLG[n.id]){goTalk('npc',n.id);return;}}
  const hs=objs.filter(o=>o.hot&&o.spr).sort((a,b)=>(b.y+b.h)-(a.y+a.h));
  for(const o of hs){const s=o.spr;if(wx>=s.x&&wx<=s.x+s.c.width&&wy>=s.y&&wy<=s.y+s.c.height){goTalk('hot',o.hot);return;}}
  goTile(idx(clamp(Math.floor(wx/T),0,W-1),clamp(Math.floor(wy/TH),0,H-1)));
}
// toque anda; arrastar move a câmera; pinça, roda ou toque duplo aproximam
const ptrs=new Map();let drag=null,pinch=null,lastTap=null;
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{
  if(!started||talkOpen)return;try{cv.setPointerCapture(e.pointerId);}catch(_){}
  ptrs.set(e.pointerId,{x:PX(e),y:PY(e)});
  if(SCENE==='rua'){
    const pts=[...ptrs.values()].map(p=>({x:p.x*RS,y:p.y*RS}));
    if(ptrs.size===1)streetView().gestureStart(pts);else if(ptrs.size===2)streetView().gestureStart(pts);
    drag={sx:PX(e),sy:PY(e),cx:0,cy:0,moved:false,street:true,multi:ptrs.size>1};return;
  }
  if(ptrs.size===2){drag=null;ZA=null;CAMCTRL.beginManual();const [a,b]=[...ptrs.values()];pinch={d:Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),z:cam.z,w:s2w((a.x+b.x)/2,(a.y+b.y)/2)};return;}
  drag={sx:PX(e),sy:PY(e),cx:cam.x,cy:cam.y,moved:false};
});
cv.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;p.x=PX(e);p.y=PY(e);
  if(SCENE==='rua'){if(drag&&Math.hypot(PX(e)-drag.sx,PY(e)-drag.sy)>8)drag.moved=true;if(drag&&ptrs.size>1)drag.multi=true;streetView().gestureMove([...ptrs.values()].map(q=>({x:q.x*RS,y:q.y*RS})));return;}
  if(pinch&&ptrs.size>=2){CAMCTRL.beginManual();const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;cam.z=clamp(pinch.z*d/pinch.d,ZMIN,ZMAX);cam.x=pinch.w.x-(mx-VW()/2)/cam.z;cam.y=pinch.w.ys-(my-VH()/2)/cam.z;clampCam();follow=false;zoomAnchor=[mx,my];lastZoomIn=performance.now();return;}
  if(!drag)return;const dx=PX(e)-drag.sx,dy=PY(e)-drag.sy;
  if(!drag.moved&&Math.hypot(dx,dy)>8)drag.moved=true;
  if(drag.moved){CAMCTRL.beginManual();follow=false;cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam();}
});
function up(e){
  const had=ptrs.delete(e.pointerId);
  if(SCENE==='rua'){const st=streetView();st.gestureEnd([...ptrs.values()].map(q=>({x:q.x*RS,y:q.y*RS})));if(drag&&had&&e.type==='pointerup'&&!drag.moved&&!drag.multi)st.tap(PX(e)*RS,PY(e)*RS);drag=null;pinch=null;return;}
  if(pinch){if(ptrs.size<2)pinch=null;drag=null;return;}
  if(drag&&had&&e.type==='pointerup'&&!drag.moved){const sx=PX(e),sy=PY(e),now=performance.now();
    if(lastTap&&now-lastTap.t<320&&Math.hypot(sx-lastTap.x,sy-lastTap.y)<30){lastTap=null;zoomTo(cam.z>=ZMAX*0.6?FITZ:Math.min(ZMAX,cam.z*2),sx,sy);}
    else{lastTap={t:now,x:sx,y:sy};tap(sx,sy);}}
  drag=null;
}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();if(!started||talkOpen)return;if(SCENE==='rua'){streetView().zoomAt(Math.pow(1.0018,-clamp(e.deltaY,-120,120)),PX(e)*RS,PY(e)*RS);return;}CAMCTRL.beginManual();ZA=null;const dy=e.deltaMode===1?e.deltaY*16:e.deltaY;const w=s2w(PX(e),PY(e));cam.z=clamp(cam.z*Math.pow(1.0018,-clamp(dy,-120,120)),ZMIN,ZMAX);cam.x=w.x-(PX(e)-VW()/2)/cam.z;cam.y=w.ys-(PY(e)-VH()/2)/cam.z;clampCam();follow=false;zoomAnchor=[PX(e),PY(e)];lastZoomIn=performance.now();},{passive:false});

function stepAgent(a,sp,pass){
  a.moving=false;if(!a.path.length)return;
  const n=a.path[0];if(pass&&!pass(n)){a.path=[];return;}
  const tx=n%W,ty=(n/W)|0,dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
  if(d<=sp){a.x=tx;a.y=ty;a.path.shift();}else{a.x+=dx/d*sp;a.y+=dy/d*sp;}
  if(Math.abs(dx)>0.01)a.dir=dx>0?1:-1;a.walk+=sp;a.moving=true;
}
function openGate(){
  BADGE.open=true;HUD.stopRoom();P1.moving=false;
  openBadge(appEl,{pt:e=>({x:PX(e),y:PY(e)}),done:ok=>{BADGE.open=false;last=performance.now();follow=true;
    if(ok)BADGE.ok=true;else{P1.path=[];P1.pend=null;}}});
}
function update(dt){
  if(talkOpen||BADGE.open)return;
  // vindo da recepção, a porta só abre com o crachá
  if(P1.path.length&&!BADGE.ok&&P1.path[0]===idx(GATE_X,13)&&P1.y>13.5&&badgeOn()){if(HUD.roomAge()<2400){P1.moving=false;return;}openGate();return;}
  if(BADGE.ok&&(P1.y<12.6||P1.y>15.5||Math.abs(P1.x-GATE_X)>2))BADGE.ok=false;
  if(P1.y<12.9)BADGE.out=true;else if(P1.y>14.4)BADGE.out=false;
  stepAgent(P1,3.3*dt,i=>passable(i)&&!NPCS.some(n=>ti(n)===i));
  if(!P1.path.length&&P1.pend){const p=P1.pend;P1.pend=null;if(p.kind==='exit')toStreet();else if(started)goTalk(p.kind,p.id,p.depo);}
  idleChats(dt);
  boardNearTick(dt);
  // quem espera para depor também se mexe: braços cruzados, relógio, mão no queixo
  for(const v of VIS){if(v.poseCD==null){v.poseCD=200+Math.random()*700;v.idle=['cross','watch','chin','cross'];}idlePose(v,dt);}
  for(const n of NPCS){
    if(n.sayQ&&(n.sayQ.d-=dt*60)<=0){n.say={txt:n.sayQ.txt,t:0,life:170};n.sayQ=null;}
    if(n.say){n.say.t+=dt*60;if(n.say.t>n.say.life)n.say=null;}
    else if(started&&(n.sayT-=dt*60)<0){n.sayT=1300+Math.random()*2000;if(dist(P1.x,P1.y,n.x,n.y)<9&&!(n.act&&n.act.st==='ring')){const txt=LINES.pick(LR,n.lines.map(t=>typeof t==='string'?{t}:t),LCTX,n.id,performance.now()/1000);if(txt)n.say={txt,t:0,life:170};}}
    if(n.hold){n.pose=null;continue;}
    if(n.path.length){n.pose=null;const was=n.path.length;stepAgent(n,(RT[n.id]?RT[n.id].speed:1.5)*dt,i=>passable(i)&&ti(P1)!==i&&!NPCS.some(m=>m!==n&&ti(m)===i));
      if(!n.path.length&&was){arriveAct(n);}else if(!n.path.length&&n.act&&n.act.st==='go'){n.actT=.5;}continue;}
    routine(n,dt);
  }
  if(started)lifeTick(dt);
  lastClock+=dt;if(lastClock>3){lastClock=0;gameMin++;}
}

/* ---------- Vida dos NPCs: gestos, olhar para o Lemos e conversa de fundo ---------- */
function startPose(n,pose){
  n.pose=pose;n.poseT=(POSE_DUR[pose]||200)*(0.8+Math.random()*0.5);
  const ln=n.poseLines&&n.poseLines[pose];
  if(ln&&!n.say&&!n.sayQ&&Math.random()<0.6&&dist(P1.x,P1.y,n.x,n.y)<9)n.say={txt:pick(ln),t:0,life:160};
}
function idlePose(n,dt){
  // quem está perto vira para o Lemos quando ele passa
  const near=dist(P1.x,P1.y,n.x,n.y)<2.6;
  if(near&&Math.abs(P1.x-n.x)>0.3)n.dir=P1.x<n.x?-1:1;
  if(n.act&&n.act.pose){n.pose=n.act.st==='do'?n.act.pose:null;return;}
  if(n.pose){if((n.poseT-=dt*60)<=0){n.pose=null;n.poseCD=240+Math.random()*520;}return;}
  if((n.poseCD-=dt*60)>0||!n.idle||!n.idle.length||near)return;
  startPose(n,pick(n.idle));
}
function idleChats(dt){
  if(!started||(chatT-=dt*60)>0)return;
  chatT=1400+Math.random()*1800;if(!LINES.ready(performance.now()/1000)){chatT=300;return;}
  const free=n=>n&&!n.hold&&!n.moving&&!n.path.length&&!n.say&&!n.sayQ&&!(n.act&&(n.act.st==='ring'||n.act.pose==='phone'));
  const opts=CHATS.filter(([a,b])=>{const A=NPCS.find(n=>n.id===a),B=NPCS.find(n=>n.id===b);
    return free(A)&&free(B)&&dist(A.x,A.y,B.x,B.y)<6&&dist(P1.x,P1.y,A.x,A.y)<10;});
  if(!opts.length){chatT=300;return;}
  const [a,b,l1,l2]=pick(opts),A=NPCS.find(n=>n.id===a),B=NPCS.find(n=>n.id===b);
  A.dir=B.x<A.x?-1:1;B.dir=A.x<B.x?-1:1;A.pose=null;
  A.say={txt:l1,t:0,life:170};B.sayQ={txt:l2,d:150};LINES.hold(performance.now()/1000,10);LIFE.emit(performance.now()/1000,'conversa',a+' e '+b);
}

/* ---------- Mundo vivo da base: rotina de trabalho de cada um (docs/LIVING_WORLD_SYSTEM.md) ----------
   Cada pessoa tem função, ritmo e lugares de trabalho de verdade (a mesa, o quadro, a copiadora, a bancada, a mesa de
   luz, o arquivo, o bebedouro). A cada atividade concluída escolhe a próxima por peso — o que combina com o papel dela e
   com o momento do caso — sem repetir a anterior; cada atividade tem começo (vai até o lugar), meio (faz, com gesto e
   som) e fim (volta ou emenda outra). Conversar com o Lemos interrompe; depois ela retoma. Nada aqui muda o caso:
   só mostra o trabalho. As falas nunca dizem que algo aconteceu antes de o save dizer. */
const LIFE=eventLog(18),LINES=lineBank({gap:11,recent:14}),LR=Math.random;
const done=(k,id)=>!!(CASE&&CASE[k]&&CASE[k].includes(id));
const CX={topics:()=>(CASE&&CASE.teamTopics||[]).length,interviewed:()=>(CASE&&CASE.interviewed||[]).length,clues:()=>(CASE&&CASE.clues||[]).length,waiting:()=>VIS.length};
// onde cada um fica de pé para usar um objeto: a linha logo à frente dele (ou dos lados)
function standAt(t,nth=0,filter){const os=objs.filter(o=>o.t===t&&(!filter||filter(o)));const o=os[nth%Math.max(1,os.length)];if(!o)return -1;
  const c=[];for(let x=o.x;x<o.x+o.w;x++)c.push(idx(x,o.y+o.h));for(let y=o.y;y<o.y+o.h;y++){c.push(idx(o.x-1,y));c.push(idx(o.x+o.w,y));}
  const ok=c.filter(i=>floor[i]===F.FLOOR&&passable(i)&&!blk[i]);return ok.length?ok[Math.floor(LR()*ok.length)]:-1;}
const near=(id)=>{const m=NPCS.find(x=>x.id===id);if(!m)return -1;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1]]){const i=idx(Math.round(m.x)+dx,Math.round(m.y)+dy);if(floor[i]===F.FLOOR&&passable(i))return i;}return -1;};
const at=(x,y)=>()=>idx(x,y);
// atividades por pessoa: w = peso (pode depender do caso), dur = segundos, pose = gesto do boneco, snd = som do lugar
const RT={
  sonia:{speed:1.3,acts:[
    {id:'mesa',w:5,where:'home',dur:[25,60],snd:'paper'},
    {id:'telefone',w:1.4,where:'home',dur:[10,18],pose:'phone',ring:true,lines:'sonia_tel'},
    {id:'estante',w:.8,where:()=>standAt('shelf',0,o=>o.v==='books'),dur:[6,12],pose:'read',snd:'paper'},
    {id:'arquivo',w:.5,where:()=>standAt('filing',0,o=>o.x<10),dur:[5,9],pose:'read',snd:'paper'},
    {id:'quadro',w:()=>CX.topics()>2?.5:.15,where:()=>standAt('board'),dur:[8,14],pose:'chin',lines:'quadro'}]},
  renata:{speed:1.6,acts:[
    {id:'digitar',w:5,where:'home',dur:[20,50],snd:'type'},
    {id:'telefone',w:1,where:'home',dur:[9,16],pose:'phone',ring:true,lines:'renata_tel'},
    {id:'quadro',w:()=>1+Math.min(1.5,CX.topics()*.15),where:()=>standAt('board'),dur:[8,16],pose:'chin',lines:'quadro'},
    {id:'copiadora',w:.8,where:()=>standAt('xerox'),dur:[6,10],pose:'read',snd:'print'},
    {id:'café',w:.7,where:()=>standAt('coffee'),dur:[6,10],pose:'drink',snd:'cup'},
    {id:'arquivo',w:.5,where:()=>standAt('shelf',Math.floor(LR()*4),o=>o.v==='arq'),dur:[9,16],pose:'read',snd:'paper',lines:'arquivo'},
    {id:'denise',w:.6,where:()=>near('denise'),dur:[6,10],chat:'denise'}]},
  denise:{speed:1.3,acts:[
    {id:'transcrever',w:6,where:'home',dur:[30,70],snd:'type',lines:'denise_mesa'},
    {id:'copiadora',w:1.1,where:()=>standAt('xerox'),dur:[6,11],pose:'read',snd:'print'},
    {id:'sala',w:()=>CX.waiting()?1.4:.2,where:at(3,12),dur:[6,10],pose:'read',snd:'chair',lines:'sala'},
    {id:'café',w:.5,where:()=>standAt('coffee'),dur:[5,8],pose:'drink',snd:'cup'},
    {id:'arquivo',w:.4,where:()=>standAt('filing',0,o=>o.x>9&&o.x<12),dur:[5,9],pose:'read',snd:'paper'}]},
  paulo:{speed:1.8,acts:[
    {id:'café',w:2,where:()=>standAt('coffee'),dur:[8,16],pose:'drink',snd:'cup'},
    {id:'telefone',w:1.6,where:at(16,7),dur:[10,18],pose:'phone',lines:'paulo_tel'},
    {id:'quadro',w:()=>1+Math.min(1,CX.topics()*.1),where:()=>standAt('board'),dur:[6,12],pose:'cross',lines:'quadro'},
    {id:'janela',w:1,where:at(18,2),dur:[6,12],pose:'watch'},
    {id:'plantão',w:.7,where:()=>near('plantao'),dur:[6,10],chat:'plantao'},
    {id:'renata',w:.8,where:()=>near('renata'),dur:[6,10],chat:'renata'},
    {id:'rádio',w:.6,where:at(19,6),dur:[5,9],pose:'phone',snd:'radio',lines:'paulo_radio'}]},
  mauricio:{speed:1.4,acts:[
    {id:'bancada',w:5,where:'home',dur:[25,60],snd:'paper',lines:'mauricio_bancada'},
    {id:'mesa de luz',w:()=>done('requestedMaterials','fotos_cena')?2.2:1,where:()=>standAt('lightbox'),dur:[10,20],pose:'chin',lines:'mauricio_luz'},
    {id:'armário',w:.7,where:()=>standAt('locker',Math.floor(LR()*2)),dur:[5,9],pose:'read'},
    {id:'malotes',w:.9,where:()=>standAt('bagtable'),dur:[8,14],pose:'read',snd:'paper'},
    {id:'entregar',w:.35,where:()=>near('renata'),dur:[5,8],chat:'renata',pose:'read'}]},
  plantao:{speed:1.3,acts:[
    {id:'balcão',w:4,where:'home',dur:[20,45],snd:'paper'},
    {id:'telefone',w:2.2,where:'home',dur:[8,14],pose:'phone',ring:true,lines:'plantao_tel'},
    {id:'bebedouro',w:.5,where:()=>standAt('cooler'),dur:[5,8],pose:'drink',snd:'cup'}]},
  guarda:{speed:1.1,acts:[
    {id:'posto',w:6,where:'home',dur:[20,50],pose:'watch'},
    {id:'espera',w:1,where:at(16,15),dur:[5,9],pose:'cross'},
    {id:'entrada',w:.8,where:at(15,16),dur:[4,8],pose:'watch'}]},
  faxina:{speed:1.0,acts:[
    {id:'pano',w:5,where:()=>{const r=NPCS.find(x=>x.id==='faxina').route;const g=r[Math.floor(LR()*r.length)];return idx(g[0],g[1]);},dur:[10,22]},
    {id:'pausa',w:.6,where:()=>standAt('cooler'),dur:[6,10],pose:'drink'}]}
};
// falas de trabalho: curtas, do dia a dia, e as que dependem do caso só aparecem quando o save já tem o fato
const POOL={
  sonia_tel:[{t:'Prado. Pode falar.'},{t:'Me manda isso por escrito.'},{t:'Ainda não. Estou com a equipe.'},{t:'Quando eu tiver, o senhor fica sabendo.'}],
  renata_tel:[{t:'Oi, é a Renata, do DHPP.'},{t:'Pode me mandar a lista inteira?'},{t:'Preciso disso com data e hora.'},{t:'Manda no e-mail da equipe, por favor.'}],
  paulo_tel:[{t:'Fala. Tô na base.'},{t:'Passa o endereço completo.'},{t:'Já vou, já vou.'},{t:'Me liga quando ele chegar.'}],
  paulo_radio:[{t:'Viatura 7, na escuta.'},{t:'Copiado. Base.'},{t:'Negativo, ainda na base.'}],
  plantao_tel:[{t:'DHPP, bom dia.',when:()=>!NIGHT},{t:'DHPP, plantão noturno.',when:()=>NIGHT},{t:'Um momento, por favor.'},{t:'Não, senhor. Sem comentários.'},{t:'Vou transferir, aguarde.'},{t:'Imprensa, de novo.'}],
  quadro:[{t:'Hm.'},{t:'Isso aqui não fecha.'},{t:'Falta uma linha aqui.',when:()=>CX.topics()>0},{t:'Vou mudar isso de lugar.',when:()=>CX.clues()>2}],
  arquivo:[{t:'Caixa 14… cadê a 15?'},{t:'Quem guardou isso fora da ordem?'}],
  denise_mesa:[{t:'Folha 2 de 3.'},{t:'Termo pronto pra assinar.',when:()=>CX.interviewed()>0},{t:'Transcrevendo.',when:()=>CX.interviewed()>0}],
  sala:[{t:'Sala pronta.'},{t:'Fita nova no gravador.'}],
  mauricio_bancada:[{t:'Etiqueta, lacre, assinatura.'},{t:'Luva nova.'},{t:'Foto 14, refaz.'}],
  mauricio_luz:[{t:'Foto por foto.',when:()=>done('requestedMaterials','fotos_cena')},{t:'A luz não mente.'}],
  chat_renata:[{t:'Tem um minuto?',who:['paulo','mauricio']},{t:'Confere isso pra mim?',who:'mauricio'},{t:'Deixo na tua mesa.',who:'mauricio'},{t:'Vai um café?',who:'paulo'}],
  chat_denise:[{t:'Denise, tem grampeador aí?',who:'renata'},{t:'Esse ar-condicionado tá de brincadeira.',who:'renata'},{t:'Você viu a pasta azul?',who:'renata'}],
  chat_plantao:[{t:'Alguém procurou por mim?',who:'paulo'},{t:'A chave da viatura tá aí?',who:'paulo'}],
  reply:[{t:'Hm, já vejo.'},{t:'Pode deixar.'},{t:'Gaveta de cima.'},{t:'Agora não, depois.'},{t:'Tá.'},{t:'Já já.'}],
  greet_sonia:[{t:'Lemos.'}],greet_plantao:[{t:'Bom dia, doutor.',when:()=>!NIGHT},{t:'Boa noite, doutor.',when:()=>NIGHT},{t:'Doutor.'}],greet:[{t:'Bom dia, Lemos.',when:()=>!NIGHT},{t:'Noite longa, Lemos.',when:()=>NIGHT},{t:'Voltou da casa, Lemos?',when:()=>!!FIM},{t:'E aí, Lemos.'},{t:'Lemos.'}],
  board_new:[{t:'Vou pôr no quadro.'},{t:'Isso muda a ordem aqui.'}]
};
const LCTX={};
function bubble(n,pool,life=170){if(HUD.roomOn())return false;const txt=LINES.pick(LR,POOL[pool]||[],LCTX,n.id,performance.now()/1000);if(txt){n.say={txt,t:0,life};return true;}return false;}
function soundAt(n,k,a=1){const dx=(n.x*T-cam.x)/(VW()/2/cam.z),dd=dist(P1.x,P1.y,n.x,n.y);if(SCENE!=='base')return;AMB.fx(k,Math.max(-1,Math.min(1,dx*.7)),a*Math.max(0,1-dd/13));}
function pickAct(n){const R0=RT[n.id];if(!R0)return null;const o=choose(LR,R0.acts,null,n.mem,performance.now()/1000);return o;}
function startAct(n,o){
  if(!o){n.actT=4;return;}
  n.act={...o,st:'go',t:jitter(LR,(o.dur[0]+o.dur[1])/2,.35)};n.pose=null;
  const tgt=o.where==='home'?n.home:o.where();if(tgt<0){n.act=null;n.actT=3;return;}
  n.act.tgt=tgt;LIFE.emit(performance.now()/1000,n.id,o.id);
  if(ti(n)===tgt){arriveAct(n);return;}
  if(n._sit)soundAt(n,'chair',.6);
  const e=bfs(ti(n),i=>i===tgt,i=>(passable(i)||i===tgt||!!objs[occ[i]]&&objs[occ[i]].nocc)&&!NPCS.some(m=>m!==n&&ti(m)===i)&&ti(P1)!==i);
  if(e>=0)n.path=pathTo(e);else{n.act=null;n.actT=2+LR()*3;}
}
function arriveAct(n){const a=n.act;if(!a)return;a.st=a.ring?'ring':'do';a.rt=a.ring?1.3+LR()*1.5:0;
  if(n.id==='paulo'&&a.id==='janela')n.dir=1;
  if(a.chat){const m=NPCS.find(x=>x.id===a.chat);if(m&&!m.hold){n.dir=m.x<n.x?-1:1;if(!m.path.length)m.dir=n.x<m.x?-1:1;
    if(dist(P1.x,P1.y,n.x,n.y)<10&&bubble(n,'chat_'+a.chat)){const rp=LINES.pick(LR,POOL.reply,LCTX,m.id,performance.now()/1000+3)||'Hm.';m.sayQ={txt:rp,d:140};}}}
  else if(a.lines&&!a.ring&&LR()<.45&&dist(P1.x,P1.y,n.x,n.y)<9)bubble(n,a.lines,160);
  if(a.snd&&a.snd!=='type')soundAt(n,a.snd,.7);
}
function routine(n,dt){
  idlePose(n,dt);
  const a=n.act;
  if(!a){if((n.actT-=dt)<=0)startAct(n,pickAct(n));return;}
  if(a.st==='go'){if(!n.path.length){if(ti(n)===a.tgt)arriveAct(n);else if((n.actT-=dt)<=0){n.act=null;n.actT=2;}}return;}
  if(a.st==='ring'){if((a.rt-=dt)<=0){a.st='do';soundAt(n,'pickup',.8);if(dist(P1.x,P1.y,n.x,n.y)<10)bubble(n,a.lines,180);}else if(((a.rt*10)|0)%28===0)soundAt(n,'ring',.9);return;}
  // fazendo: digitação e papéis soam de tempos em tempos; o gesto é o da atividade
  if(a.snd==='type'&&n._sit&&LR()<dt*.55)soundAt(n,'type',.55);
  if(a.snd==='paper'&&LR()<dt*.08)soundAt(n,'paper',.5);
  if((a.t-=dt)<=0){n.act=null;n.pose=null;n.actT=.6+LR()*2.4;}
}
// reações: ao entrar numa sala, alguém de lá cumprimenta (às vezes); um fato novo no save leva alguém ao quadro
let lastRoomP1='',greetCD=0,cluesSeen=-1;
function lifeTick(dt){
  greetCD-=dt;const r=roomOf(P1);
  if(r!==lastRoomP1){lastRoomP1=r;if(greetCD<=0&&LR()<.55){const cand=NPCS.filter(n=>roomOf(n)===r&&!n.hold&&!n.say&&dist(P1.x,P1.y,n.x,n.y)<7&&!(n.act&&n.act.st==='ring'));
      const n=cand[Math.floor(LR()*cand.length)];if(n){n.dir=P1.x<n.x?-1:1;bubble(n,n.id==='sonia'?'greet_sonia':n.id==='plantao'?'greet_plantao':'greet',150);greetCD=45;}}}
  const c=CX.clues();if(cluesSeen<0)cluesSeen=c;else if(c>cluesSeen){cluesSeen=c;const n=NPCS.find(x=>x.id==='renata');
    if(n&&!n.hold){n.act=null;n.path=[];startAct(n,RT.renata.acts.find(o=>o.id==='quadro'));if(n.act)n.act.lines='board_new';LIFE.emit(performance.now()/1000,'caso','fato novo: Renata vai ao quadro');}}
}
// voltou da rua depois de um tempo: quem estava a caminho já chegou, e as atividades andaram
function resumeBase(){const sec=baseLeft?(performance.now()-baseLeft)/1000:0;if(sec<8)return;
  for(const n of NPCS){if(n.hold)continue;if(n.path.length){const e=n.path[n.path.length-1];n.x=e%W;n.y=(e/W)|0;n.path=[];if(n.act)arriveAct(n);}
    if(n.act&&(n.act.t-=sec)<=0){n.act=null;n.pose=null;n.actT=LR()*3;}}}
lifeDebug(()=>SCENE==='rua'&&STREET?STREET.debugRows():['BASE · '+clockStr()+' · tópicos '+CX.topics()+' · depoimentos '+CX.interviewed()+' · esperando '+CX.waiting(),
  ...NPCS.map(n=>`${n.id.padEnd(8)} ${n.hold?'CONVERSANDO':n.act?(n.act.st+' '+n.act.id+' '+(n.act.t|0)+'s'):'livre '+(n.actT|0)+'s'}${n.path.length?' → '+n.path.length+' passos':''}${n.say?' «'+n.say.txt+'»':''}`),
  '— acontecimentos —',...LIFE.list.slice(-8).map(e=>`${e.t.toFixed(0)}s ${e.type}: ${e.txt}`)]);

/* ---------- Câmera e zoom ---------- */
const ZMIN=0.6,ZMAX=5;let FITZ=1,ZA=null,zoomAnchor=null,lastZoomIn=0;
function zMin(){return Math.max(ZMIN,1/RS);}
function snapZ(z){return clamp(Math.max(1,Math.round(z*RS))/RS,zMin(),ZMAX);}
function TALKZ(){return snapZ(Math.max(FITZ*2,2.6));}
let HUDT=58;
function clampCam(){
  const e=cam.z,hw=VW()/2/e,hh=VH()/2/e,x0=hw-24/e,x1=W*T-hw+24/e,y0=hh-HUDT/e,y1=H*TH-hh;
  cam.x=x0>x1?(W*T)/2:clamp(cam.x,x0,x1);cam.y=y0>y1?(H*TH)/2:clamp(cam.y,y0,y1);
}
function zoomTo(z,sx,sy,dur){ZA={z0:cam.z,z1:snapZ(z),t0:performance.now(),dur:dur||320,sx,sy,w:sx!=null?s2w(sx,sy):null};if(sx!=null)follow=false;}
function stepZoom(){
  if(!ZA){if(!pinch&&zoomAnchor&&performance.now()-lastZoomIn>140){const t=snapZ(cam.z),a=zoomAnchor;zoomAnchor=null;if(Math.abs(t-cam.z)>0.001)zoomTo(t,a[0],a[1],180);}return;}
  const k=clamp((performance.now()-ZA.t0)/ZA.dur,0,1),u=k<0.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
  cam.z=Math.exp(Math.log(ZA.z0)+(Math.log(ZA.z1)-Math.log(ZA.z0))*u);
  if(ZA.w){cam.x=ZA.w.x-(ZA.sx-VW()/2)/cam.z;cam.y=ZA.w.ys-(ZA.sy-VH()/2)/cam.z;}
  clampCam();if(k>=1){cam.z=ZA.z1;ZA=null;}
}
function fitView(){
  const L=VW()>VH();
  if(L){const t=Math.min((VH()-50)/(15*TH),(VW()-40)/(23*T));cam.z=snapZ(Math.max(t,1));}
  else cam.z=snapZ(VW()/(11*T));
  FITZ=cam.z;clampCam();
}
const CAMERA_ROOMS={
  sonia:{zoneX:.10,zoneY:.11,biasX:-12,biasY:-7,roomPull:.18},
  equipe:{zoneX:.15,zoneY:.12,biasX:12,biasY:-7,roomPull:.07},
  pericia:{zoneX:.11,zoneY:.10,biasX:8,biasY:-8,roomPull:.15},
  interro:{zoneX:.09,zoneY:.09,biasX:8,biasY:-9,roomPull:.2},
  hall:{zoneX:.14,zoneY:.12,biasX:4,biasY:-6,roomPull:.08},
  acesso:{zoneX:.14,zoneY:.10,biasX:4,biasY:-6,roomPull:.06},
  arquivo:{zoneX:.10,zoneY:.10,biasX:7,biasY:-6,roomPull:.18},
  fora:{zoneX:.17,zoneY:.14,biasX:0,biasY:-4,roomPull:0},wall:{zoneX:.11,zoneY:.16,biasX:0,biasY:-5,roomPull:0}
};
function followCam(dt){
  const now=performance.now(),ctl=CAMCTRL.resolve(now);
  if(ctl.mode==='manual'){CAMDBG={mode:'manual',priority:ctl.priority};return;}
  if(!follow)follow=true;
  const L=VW()>VH(),tf=talkFocus(),rm=roomOf(P1),pr=CAMERA_ROOMS[rm]||CAMERA_ROOMS.hall;
  const next=P1.path&&P1.path[0],nx=next==null?P1.x:next%W,ny=next==null?P1.y:(next/W)|0;
  const dx=Math.abs(nx-P1.x)>.02?Math.sign(nx-P1.x):(P1.moving?P1.dir:0),dy=Math.abs(ny-P1.y)>.02?Math.sign(ny-P1.y):0;
  let sx=(tf?tf[0]:P1.x)*T+16,sy=(tf?tf[1]:P1.y)*TH+TH/2-14;
  if(ctl.focus){sx=ctl.focus.x??sx;sy=ctl.focus.y??sy;}
  if(talkOpen){if(L)sx+=VW()*0.24/cam.z;else sy+=VH()*0.2/cam.z;}
  let biasX=pr.biasX,biasY=pr.biasY;
  const rr=ROOM_RECT[rm];if(rr&&pr.roomPull&&!talkOpen){const rcx=(rr[0]+rr[2]+1)*T/2,rcy=(rr[1]+rr[3]+1)*TH/2;sx+=(rcx-sx)*pr.roomPull;sy+=(rcy-sy)*pr.roomPull;}
  const vw=VW()/cam.z,vh=VH()/cam.z,calm=CALM();
  // espaço à frente: o centro da câmera fica adiante de Lemos (até ~11% da largura visível; em salas pequenas, menos),
  // crescendo e invertendo devagar; a zona morta de cada cômodo fica só como histerese
  const A=talkOpen||calm?0:Math.min(110,vw*.11),AY=talkOpen||calm?0:Math.min(30,vh*.07);
  const ld=ctl.focus||talkOpen?{x:0,y:0}:CAMLEAD.update(dx,dy,P1.moving,dt,A,AY,P1.dir);
  const dz=deadZoneTarget(cam,{x:sx+ld.x,y:sy+ld.y},{viewportW:vw,viewportH:vh,zoneX:vw*(calm ? .2 : pr.zoneX*.4),zoneY:vh*(calm ? .18 : pr.zoneY*.7),biasX,biasY});
  camIdle=P1.moving||talkOpen?0:camIdle+dt;
  let tx=dz.x,ty=dz.y,rate=talkOpen?5.2:7.5;
  if(camIdle>.55&&!ctl.focus){const idleX=sx+ld.x+biasX,idleY=sy+ld.y+biasY,ik=Math.min(1,(camIdle-.55)/1.4);tx=tx+(idleX-tx)*ik*.38;ty=ty+(idleY-ty)*ik*.38;rate=calm?1.2:2.1;}
  if(calm&&ctl.focus)rate=18;
  cam.x=damp(cam.x,tx,rate,dt);cam.y=damp(cam.y,ty,rate,dt);clampCam();
  const px=(dz.desiredX-cam.x)*cam.z+VW()/2,py=(dz.desiredY-cam.y)*cam.z+VH()/2;
  CAMDBG={mode:ctl.mode,priority:ctl.priority,room:rm,target:{x:px,y:py},zoneX:dz.zoneX*cam.z,zoneY:dz.zoneY*cam.z};
}

/* ---------- Luz (mesmo método da casa: ambiente × luzes por cômodo) ---------- */
const LCACHE={};
const LC_SUN=[255,234,196],LC_MON=[110,230,180],LC_CLOUD=[176,180,196],LC_EMBER=[255,130,60],LC_WHITE=[255,255,255];
function lightSprite(col){if(col._ls&&col._lg===LSGEN)return col._ls;col._lg=LSGEN;const k=col.join(',');let c=LCACHE[k];if(c)return col._ls=c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,rgbs(col,1));gr.addColorStop(0.4,rgbs(col,0.55));gr.addColorStop(1,rgbs(col,0));g.fillStyle=gr;g.fillRect(0,0,64,64);return col._ls=LCACHE[k]=c;}
const COOL=[225,236,255],WARM=[255,206,140],SUNC=[255,236,200];
// [x, y, raio em tiles, cor, intensidade, cômodo, oscila]
// portas entre as salas e a passagem da sala da equipe para o corredor: a luz atravessa (base.doorlight)
const DOORLIGHTS=[[10,5,[255,226,180]],[22,5,[235,244,255]],[10,11,[255,214,160]],[22,11,[255,222,170]],[15.5,9,[230,240,255]]];
const LIGHTS=[
  [6,5,4.6,[255,220,180],0.8,'sonia'],[4.6,3.4,2.2,[255,224,150],1,'sonia'],
  [13,4.6,4.2,COOL,0.95,'equipe'],[17,4.6,4.2,COOL,0.95,'equipe'],[20.5,5.2,3.8,COOL,0.85,'equipe'],
  [25.5,4.6,4.6,[235,246,255],1,'pericia'],[29,5,3.8,[235,246,255],0.95,'pericia'],[29.5,6.2,1.8,[210,236,255],0.9,'pericia'],
  [5.5,13.1,2.7,WARM,1.15,'interro'],
  [15,15.4,4.6,[255,240,215],0.9,'hall'],[19.5,15.2,3,[255,240,215],0.7,'hall'],[15.5,17.2,2.6,[255,250,235],0.9,'hall'],
  [14,11.4,3.6,COOL,0.9,'acesso'],[19,11.4,3.4,COOL,0.85,'acesso'],
  [25.5,12.5,3.2,[255,216,150],0.8,'arquivo',1],[29.5,15,3,[255,216,150],0.65,'arquivo',1],
  // brilho dos monitores no rosto de quem trabalha
  [12.6,3.3,1.3,[140,210,255],0.5,'equipe'],[16.6,3.3,1.3,[140,210,255],0.5,'equipe'],[19.6,3.7,1.4,[120,230,190],0.55,'equipe'],[6.6,3.3,1.2,[140,210,255],0.4,'sonia'],[12.8,12.2,1.3,[140,210,255],0.45,'acesso']
];
const WINDOWS=[[4,'sonia'],[5,'sonia'],[13,'equipe'],[19,'equipe'],[25,'pericia'],[29,'pericia']];
const HALOS=[{x:4.6*T+1,y:3*TH+3,r:16,c:[255,226,150],a:0.9},{x:5.5*T+16,y:12*TH-18,r:20,c:[255,214,150],a:0.85},{x:29.5*T,y:5.6*TH,r:30,c:[220,240,255],a:0.45},
  {x:21*T+16,y:11*TH-11,r:5,c:[120,180,255],a:0.7},{x:20*T+19,y:6*TH-25,r:4,c:[255,80,60],a:0.8},{x:18*T+16,y:9*TH+7,r:14,c:[90,255,150],a:0.35}];
// de madrugada (NIGHT) o lado de fora fica azul-escuro e as salas vivem só das lâmpadas
const AMB_IN=NIGHT?[80,86,108]:[118,124,142],AMB_OUT=NIGHT?[64,76,118]:[255,250,244];
function roomClip(rm){const r=ROOM_RECT[rm];return [r[0]*T,r[1]*TH-30,(r[2]+1)*T,(r[3]+1)*TH-RISE+CAPH];}
const GR={};
function lightPass(s,ox,oy){
  const sp=(x,y)=>[(x*s+ox)/LS,(y*s+oy)/LS];
  lctx.setTransform(1,0,0,1,0,0);lctx.globalAlpha=1;lctx.globalCompositeOperation='source-over';
  lctx.fillStyle=rgbs(AMB_OUT);lctx.fillRect(0,0,lc.width,lc.height);
  if(!NIGHT)for(const c of CLOUDS){const [X,Y]=sp(c.x,c.y),rr=c.r*s/LS;lctx.globalAlpha=0.55;lctx.drawImage(lightSprite(LC_CLOUD),X-rr,Y-rr*0.7,rr*2,rr*1.4);}lctx.globalAlpha=1;
  {const [a,b]=sp(1*T,1*TH-RISE),[c,d]=sp(33*T,18*TH-8);lctx.fillStyle=rgbs(AMB_IN);lctx.fillRect(a,b,c-a,d-b);}
  lctx.globalCompositeOperation='lighter';
  const draw=(x,y,r,col,a,rm)=>{const [X,Y]=sp(x,y),rr=r*s/LS;if(X<-rr||Y<-rr||X>lc.width+rr||Y>lc.height+rr)return;lctx.save();
    if(rm){const q=roomClip(rm),[a0,b0]=sp(q[0],q[1]),[a1,b1]=sp(q[2],q[3]);lctx.beginPath();lctx.rect(a0,b0,a1-a0,b1-b0);lctx.clip();}
    lctx.globalAlpha=Math.min(1,a);lctx.drawImage(lightSprite(col),X-rr,Y-rr*0.8,rr*2,rr*1.6);lctx.restore();};
  for(const l of LIGHTS){const fl=l[6]?0.86+0.14*vn(frame/9,l[0]*7,5)*(((frame>>3)%53)===0?0.2:1):1;draw(l[0]*T,l[1]*TH,l[2]*T,l[3],l[4]*fl,l[5]);if(l[4]>1)draw(l[0]*T,l[1]*TH,l[2]*T,l[3],l[4]-1,l[5]);}
  if(!NIGHT)for(const [x,rm] of WINDOWS)draw(x*T+30,2.9*TH,2.1*T,SUNC,0.5*(1-0.7*sunShade(x*T)),rm);
  if(fxOn('base.doorlight'))for(const [x,y,col] of DOORLIGHTS)draw(x*T+16,y*TH+TH/2,2.1*T,col,0.75,null);
  lctx.globalAlpha=1;lctx.globalCompositeOperation='multiply';if(!NIGHT){if(GR.skyH!==lc.height){GR.skyH=lc.height;GR.sky=null;}if(!GR.sky){const g=GR.sky=lctx.createLinearGradient(0,0,0,lc.height);g.addColorStop(0,'rgb(255,238,218)');g.addColorStop(0.5,'rgb(250,248,246)');g.addColorStop(1,'rgb(212,224,246)');}lctx.fillStyle=GR.sky;lctx.fillRect(0,0,lc.width,lc.height);}
  lctx.globalCompositeOperation='source-over';
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.imageSmoothingEnabled=true;ctx.drawImage(lc,0,0,cv.width,cv.height);ctx.globalCompositeOperation='source-over';
}
const DUST=Array.from({length:120},(_,k)=>({w:WINDOWS[k%WINDOWS.length][0],u:Math.random(),v:Math.random(),s:0.0004+Math.random()*0.0012,ph:Math.random()*6,big:Math.random()<0.18}));
function glowPass(){
  ctx.globalCompositeOperation='lighter';
  for(const h of HALOS){ctx.globalAlpha=h.a*(0.9+0.1*Math.sin(frame/6+h.x));ctx.drawImage(lightSprite(h.c),h.x-h.r,h.y-h.r*0.8,h.r*2,h.r*1.6);}
  // a claridade da porta escorrendo no batente
  if(fxOn('base.doorlight'))for(const [x,y,col] of DOORLIGHTS){ctx.globalAlpha=0.15;ctx.drawImage(lightSprite(col),x*T-12,y*TH-16,56,44);}
  // brilho das janelas do fundo (some quando a nuvem passa)
  if(FXMODE!=='off'&&!NIGHT)for(const [x] of WINDOWS){const sh=1-0.75*sunShade(x*T);ctx.globalAlpha=0.3*sh;ctx.drawImage(lightSprite(LC_SUN),x*T-14,2*TH-34,60,40);}
  // sol da manhã entrando pelas janelas do fundo, com poeira no feixe
  if(!NIGHT)for(const [x,rm] of WINDOWS){const r=roomClip(rm);ctx.save();ctx.beginPath();ctx.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]);ctx.clip();
    const sh=1-0.75*sunShade(x*T),y0=2*TH-2;if(!GR.beam){GR.beam=ctx.createLinearGradient(0,y0,0,y0+76);GR.beam.addColorStop(0,'rgba(255,228,180,.22)');GR.beam.addColorStop(1,'rgba(255,228,180,0)');}ctx.globalAlpha=sh;ctx.fillStyle=GR.beam;
    ctx.beginPath();ctx.moveTo(x*T+6,y0);ctx.lineTo(x*T+26,y0);ctx.lineTo(x*T+26+34,y0+76);ctx.lineTo(x*T+6+34,y0+76);ctx.closePath();ctx.fill();ctx.restore();}
  ctx.fillStyle='rgba(255,240,210,.85)';
  const dustN=QLOW()||NIGHT?0:QHIGH()?DUST.length:DUST.length>>1;
  for(let di=0;di<dustN;di++){const d=DUST[di];d.u=(d.u+d.s)%1;const w=((d.v+Math.sin(frame/90+d.ph)*0.06)%1+1)%1,tw=0.65+0.35*Math.sin(frame/17+d.ph*5);ctx.globalAlpha=(d.big?0.35:0.6)*tw*(1-d.u)*Math.min(1,d.u*6)*(1-0.7*sunShade(d.w*T));const sz=d.big?2:1;ctx.fillRect(Math.round(d.w*T+6+w*20+d.u*34),Math.round(2*TH-2+d.u*76),sz,sz);}
  // poeira no ar de cada sala, acesa onde há luz
  ctx.fillStyle='#fff4dc';const moteStep=QLOW()?0:QHIGH()?1:2;if(moteStep)for(let mi=0;mi<MOTES.length;mi+=moteStep){const m=MOTES[mi];const tw=0.5+0.5*Math.sin(frame/23+m.ph*7);ctx.globalAlpha=(m.r==='interro'?0.26:0.42)*tw*(m.big?0.6:1);const sz=m.big?2:1;ctx.fillRect(Math.round(m.x),Math.round(m.y-m.z),sz,sz);}
  // reflexo das lâmpadas no piso encerado
  for(const l of LIGHTS)if(GLOSSY.has(l[5])&&l[2]>2.5){ctx.globalAlpha=0.07*l[4];const r=l[2]*T*0.55;ctx.drawImage(lightSprite(LC_WHITE),l[0]*T-r,l[1]*TH-r*0.3,r*2,r*0.6);}
  // tela do monitor de Lemos, de frente, e o reflexo azul do da recepção
  {const on=0.75+0.25*Math.sin(frame/3)*Math.sin(frame/11);ctx.globalAlpha=0.55*on;ctx.drawImage(lightSprite(LC_MON),19*T+6,4*TH-27,20,16);ctx.globalAlpha=0.25;ctx.fillStyle='#bfffe0';if(LODV>=2&&(frame>>4)%2)ctx.fillRect(19*T+9,4*TH-18,2,1);}
  // brasa do cigarro
  {const b=0.6+0.4*Math.sin(frame/9);ctx.globalAlpha=0.7*b;ctx.drawImage(lightSprite(LC_EMBER),4*T+73,12*TH+22,9,8);}
  // cone da luminária na sala de depoimentos
  {const x=5.5*T+16,y=12*TH-8;if(!GR.cone){GR.cone=ctx.createLinearGradient(0,y,0,y+60);GR.cone.addColorStop(0,'rgba(255,214,150,.16)');GR.cone.addColorStop(1,'rgba(255,214,150,0)');}ctx.globalAlpha=1;ctx.fillStyle=GR.cone;ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.lineTo(x+46,y+60);ctx.lineTo(x-46,y+60);ctx.closePath();ctx.fill();}
  for(const p of FXP){if(p.k!=='steam')continue;const k=1-p.t/p.life;ctx.globalAlpha=0.16*k;ctx.fillStyle='#eef2f6';const r=p.sz+p.t*0.05;ctx.beginPath();ctx.ellipse(p.x+Math.sin(p.t/8)*1.5,p.y-p.z,r,r,0,0,7);ctx.fill();}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
let FXP=[];
// filtra no lugar: sem lixo por quadro para o coletor de memória (evita engasgos)
function keep(a,f){let j=0;for(let i=0;i<a.length;i++){const v=a[i];if(f(v))a[j++]=v;}a.length=j;return a;}
const aliveP=p=>p.t<p.life;
function updFX(){
  if(fxOn('base.life')){
    // a copiadora solta uma folha de vez em quando enquanto alguém a usa
    if(frame%110===0&&NPCS.some(n=>n.act&&n.act.id==='copiadora'&&n.act.st==='do')&&FXP.length<400)FXP.push({k:'sheet',x:12*T+24,y:6*TH-8,z:0,vz:0,t:0,life:150});}
  if(frame%9===0){for(const [x,y] of [[20*T+14,6*TH-19],[4*T+24,4*TH-9],[19*T+52,4*TH-8]])if(FXP.length<400)FXP.push({k:'steam',x:x+(Math.random()-0.5)*3,y,z:0,vz:0.22,t:0,life:56,sz:1.4});}
  for(const p of FXP){p.t++;
    if(p.k==='leaf'||p.k==='feather'||p.k==='ash'){if(p.y<p.gy){p.x+=p.vx+Math.sin(p.t/(p.k==='feather'?20:14)+p.ph)*(p.k==='ash'?0.05:0.35);p.y+=p.vy;}else if(GUST>0.2&&p.k!=='ash'){p.x+=GUST*1.6;}continue;}
    if(p.k==='drop'){p.vz-=0.09;p.z+=p.vz;p.x+=p.vx;if(p.z<0)p.t=p.life;continue;}
    if(p.k==='sheet'){if(p.t<36)p.x+=0.28;continue;}
    if(p.k==='bub'){p.z+=p.vz;p.x+=Math.sin(p.t/4)*0.15;if(p.z>11)p.t=p.life;continue;}
    p.z+=p.vz;p.x+=(p.vx||0)+(Math.random()-0.5)*0.15;}
  keep(FXP,aliveP);if(FXP.length>420)FXP.splice(0,FXP.length-420);
}

/* ---------- Atmosfera: sombras, reflexos, fumaça, ventilador, nuvens, rua, pombos, folhas, grão ---------- */
const SIL=new WeakMap();
function silhouette(c){let o=SIL.get(c);if(o)return o;o=document.createElement('canvas');o.width=c.width;o.height=c.height;const g=o.getContext('2d');g.drawImage(c,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,o.width,o.height);SIL.set(c,o);return o;}
const SUN=[0.62,0.5]; // o sol entra pelas janelas do fundo, então as sombras de fora caem para a frente e para a direita
const INSIDE=r=>!!ROOM_RECT[r];
const GLOSSY=new Set(['hall','pericia']);
function castFrom(p){
  const i=ti(p),rm=room[i];
  if(!INSIDE(rm)&&floor[i]!==F.DOOR)return {dx:SUN[0],dy:SUN[1],len:30,a:0.32};
  let best=null,bv=0;
  for(const l of LIGHTS){if(l[5]!==rm)continue;const gx=p.x+0.5-l[0],gy=(p.y+1-l[1]),d=Math.hypot(gx,gy),v=l[4]/(0.6+d);if(v>bv){bv=v;best={gx,gy,d,l};}}
  if(!best)return null;const n=Math.max(0.001,best.d);
  return {dx:best.gx/n,dy:best.gy/n,len:clamp(10+best.d*7,10,34),a:clamp(0.34-best.d*0.04,0.1,0.32)};
}
function drawCast(img,X,Y,flip,c,dw,dh){
  if(!c)return;const sl=silhouette(img),cc=-c.dx*c.len/45,dd=-Math.max(0.08,Math.abs(c.dy))*Math.sign(c.dy||1)*c.len*K/45;
  ctx.save();ctx.globalAlpha=c.a;ctx.translate(X,Y);ctx.transform(1,0,cc,dd,0,0);if(flip)ctx.scale(-1,1);ctx.drawImage(sl,-14,-45,dw,dh);ctx.restore();
}
function drawReflect(img,X,Y,flip,dw,dh){
  ctx.save();ctx.globalAlpha=0.14;ctx.translate(X,Y+1);ctx.scale(flip?-1:1,-0.6);ctx.drawImage(img,-14,-45,dw,dh);ctx.restore();
}
// sombra das coisas altas do pátio sob o sol
function castObj(o){
  const sp=o.spr,sl=silhouette(sp.c),base=(o.y+o.h)*TH+1;
  ctx.save();ctx.globalAlpha=0.28;ctx.translate(sp.x,base);ctx.transform(1,0,-SUN[0]*0.9,-SUN[1]*0.9*K,0,0);ctx.drawImage(sl,0,-sp.c.height);ctx.restore();
}
// nuvens: só a sombra delas, passando pelo pátio e mudando o sol das janelas
const CLOUDS=Array.from({length:4},(_,k)=>({x:(k*13-6)*T,y:(k%2?22:-4)*TH,r:(7+k%3*2)*T,v:0.12+k*0.03}));
function sunShade(wx){let m=0;for(const c of CLOUDS){const d=Math.hypot(wx-c.x,(-2*TH-c.y)*1.4)/c.r;if(d<1)m=Math.max(m,1-d*d);}return m;}
// ar parado: poeira em todas as salas
const MOTES=[];for(const r in ROOM_RECT){const q=ROOM_RECT[r];for(let k=0;k<30;k++)MOTES.push({r,x:(q[0]+Math.random()*(q[2]-q[0]+1))*T,y:(q[1]+Math.random()*(q[3]-q[1]+1))*TH,z:8+Math.random()*34,vx:(Math.random()-0.5)*0.05,vz:(Math.random()-0.5)*0.03,ph:Math.random()*6,big:Math.random()<0.12});}
// pátio: pólen e penugem levados pelo vento
const POLLEN=Array.from({length:120},()=>({x:Math.random()*W*T,y:(18.6+Math.random()*5)*TH,z:4+Math.random()*44,ph:Math.random()*6,v:0.12+Math.random()*0.22,fluff:Math.random()<0.25}));
// vento: rajadas que varrem folhas, pólen e poeira do pátio
let GUST=0,gustT=500;
// mariposas em volta da luminária da sala de depoimentos
const MOTHS=Array.from({length:3},(_,k)=>({a:k*2.1,r:5+k*3,v:0.07+k*0.025,ph:Math.random()*6}));
// piso molhado deixado pelo rodo
let WETS=[],TREES=null;
// porta de vidro que abre sozinha
let doorOpen=0;
function updAtmo(){
  for(const c of CLOUDS){c.x+=c.v;if(c.x-c.r>(W+6)*T)c.x=-12*T;}
  if(--gustT<=0){gustT=500+Math.random()*700;GUST=1;}GUST*=0.992;
  for(const q of POLLEN){q.x+=q.v*(1+GUST*5)+Math.sin(frame/60+q.ph)*0.15;q.z+=Math.sin(frame/45+q.ph*3)*0.08+GUST*0.05;if(q.z<3)q.z=3;if(q.z>56)q.z=56;if(q.x>(W+1)*T){q.x=-T;q.y=(18.6+Math.random()*5)*TH;q.z=4+Math.random()*44;}}
  if(GUST>0.3&&frame%3===0)FXP.push({k:'puff',x:Math.random()*W*T,y:(19+Math.random()*4)*TH,z:1,vz:0.05,vx:1.2*GUST,t:0,life:40,sz:2});
  for(const m of MOTHS){m.a+=m.v+Math.sin(frame/9+m.ph)*0.05;}
  // ventilador de teto mexe o ar da sala da delegada
  {const cx=6*T,cy=5.3*TH;for(const m of MOTES)if(m.r==='sonia'){const dx=m.x-cx,dy=(m.y-cy)/K,d=Math.hypot(dx,dy);if(d<2.6*T&&d>4){const a=0.006*(1-d/(2.6*T)),c=Math.cos(a),sn=Math.sin(a);m.x=cx+dx*c-dy*sn;m.y=cy+(dx*sn+dy*c)*K;}}}
  for(const m of MOTES){m.x+=m.vx+Math.sin(frame/140+m.ph)*0.03;m.z+=m.vz+Math.sin(frame/90+m.ph)*0.02;const q=ROOM_RECT[m.r];if(m.x<q[0]*T)m.x=(q[2]+1)*T;if(m.x>(q[2]+1)*T)m.x=q[0]*T;if(m.z<4||m.z>46)m.vz=-m.vz;}
  // folhas caindo das árvores
  if(Math.random()<0.07+GUST*0.3){const tr=TREES||(TREES=objs.filter(o=>o.t==='tree'&&!o.far));if(tr.length){const o=pick(tr);FXP.push({k:'leaf',x:o.x*T+16+(Math.random()-0.5)*30,y:(o.y+1)*TH-50+Math.random()*12,gy:(o.y+1)*TH+Math.random()*30,vx:0.12+Math.random()*0.2,vy:0.25+Math.random()*0.2,t:0,life:520,c:pick(['#4a8a3c','#69ad52','#c9a040','#a8642a']),ph:Math.random()*6});}}
  // cigarro no cinzeiro da sala de depoimentos
  if(frame%7===0)FXP.push({k:'smoke',x:4*T+77,y:12*TH+26,z:2,vz:0.16,t:0,life:240,sz:0.8,ph:Math.random()*6});
  // passos levantam poeira lá fora
  if(P1.moving&&!INSIDE(roomOf(P1))&&frame%10===0)for(let k=0;k<2;k++)FXP.push({k:'puff',x:P1.x*T+16+(Math.random()-0.5)*6,y:P1.y*TH+TH-3,z:1,vz:0.1,vx:(Math.random()-0.5)*0.2,t:0,life:28,sz:1.4});
  // porta de acesso: abre quando alguém da casa chega com o crachá; bipa e o leitor fica verde.
  // Lemos, vindo da recepção, só depois de passar o crachá no close (por dentro, a saída é livre)
  {const p1=BADGE.ok||BADGE.out||!badgeOn();const near=[...(p1?[P1]:[]),...NPCS.filter(n=>n.id!=='guarda')].some(a=>Math.abs(a.x-GATE_X)<.7&&a.y>11.8&&a.y<14.2);DOORA.t=near?Math.min(1,DOORA.t+.12):Math.max(0,DOORA.t-.05);const op=DOORA.t>.5;
    if(op!==DOORA.open){DOORA.open=op;for(const o of objs)if(o.sprO)o.spr=op?o.sprO:o.sprC;if(op)soundAt({x:GATE_X,y:13},'beep',.8);}}
  // rodo da faxineira
  for(const n of NPCS)if(n.mop&&n.moving&&frame%8===0&&WETS.length<70)WETS.push({x:n.x*T+16+n.dir*9,y:n.y*TH+TH-3,t:0,life:1400,rx:7+Math.random()*4});
  for(const n of NPCS)if(n.mop&&n.moving&&frame%6===0)for(let k=0;k<2;k++)FXP.push({k:'drop',x:n.x*T+16+n.dir*10+(Math.random()-0.5)*6,y:n.y*TH+TH-3,z:1,vz:0.5+Math.random()*0.5,vx:(Math.random()-0.5)*0.6,t:0,life:40});
  if(frame%70===0||(frame%70<9&&frame%70%3===0)){const o=objs.find(o=>o.t==='cooler');if(o&&o.spr)FXP.push({k:'bub',x:o.spr.x+12+Math.random()*9,y:o.spr.y+14,z:0,vz:0.22+Math.random()*0.1,t:0,life:44,sz:Math.random()<0.4?2:1});}
  if(P1.moving&&INSIDE(roomOf(P1))&&frame%14===0)FXP.push({k:'puff',x:P1.x*T+16+(Math.random()-0.5)*6,y:P1.y*TH+TH-3,z:1,vz:0.06,vx:(Math.random()-0.5)*0.15,t:0,life:24,sz:1.2,dim:true});
  if(frame%160===0)FXP.push({k:'ash',x:4*T+77,y:12*TH+26,gy:12*TH+30,z:0,vx:0,vy:0.1,t:0,life:200,ph:0});
  for(const w of WETS)w.t++;keep(WETS,aliveP);
  // porta
  const near=[P1,...NPCS].some(a=>Math.abs(a.x-15.5)<1.6&&Math.abs(a.y-18)<1.6);doorOpen+=((near?1:0)-doorOpen)*0.14;
}
function drawFloorFX(){
  // piso molhado: um brilho frio que seca aos poucos
  for(const w of WETS){const k=Math.min(1,w.t/30)*(1-w.t/w.life);ctx.globalAlpha=0.22*k;ctx.fillStyle='#9fc0dc';ctx.beginPath();ctx.ellipse(w.x,w.y,w.rx,w.rx*0.42,0,0,7);ctx.fill();ctx.globalAlpha=0.35*k;ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(w.x-w.rx*0.4),Math.round(w.y-1),Math.round(w.rx*0.6),1);}
  ctx.globalAlpha=1;
  // papéis caídos na sala da equipe (base.life)
  if(fxOn('base.life'))for(const [x,y,a] of [[13.4,7.3,.2],[14.1,7.6,-.35],[18.6,7.2,.5],[11.7,6.8,-.15]]){ctx.save();ctx.translate(x*T,y*TH);ctx.rotate(a);ctx.globalAlpha=0.35;ctx.fillStyle='#000';ctx.fillRect(-4,-2,9,6);ctx.globalAlpha=1;ctx.fillStyle='#efece4';ctx.fillRect(-5,-3,9,6);ctx.fillStyle='#b8b3a6';ctx.fillRect(-3,-1,5,1);ctx.fillRect(-3,1,4,1);ctx.restore();}
  ctx.globalAlpha=1;
  // sombra das pás do ventilador de teto da sala da delegada
  {const cx=6*T,cy=5.3*TH,a=frame*0.21;ctx.save();ctx.beginPath();const q=roomClip('sonia');ctx.rect(q[0],2*TH,q[2]-q[0],q[3]-2*TH);ctx.clip();ctx.translate(cx,cy);ctx.scale(1,K);
    for(let tr=0;tr<3;tr++){ctx.globalAlpha=0.2-tr*0.055;for(let b=0;b<4;b++){ctx.save();ctx.rotate(a-tr*0.09+b*Math.PI/2);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(22,0,20,4.5,0,0,7);ctx.fill();ctx.restore();}}
    ctx.globalAlpha=0.12;ctx.fillStyle='#000';ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();ctx.restore();}
  ctx.globalAlpha=1;
  // sombras ao sol: árvores e bandeiras
  for(const o of objs)if((o.t==='tree'||o.t==='flag')&&o.spr&&!o.far)castObj(o);
}
function drawFlagCloth(o){
  const X=o.spr.x+1,Y=o.spr.y+1;let cl=o.cloth;
  if(!cl)cl=o.cloth=S2(17,12,(P)=>{if(o.v==='br'){P(0,0,17,12,'#2f7a3a');for(let k=0;k<5;k++)P(8-k*2,3+k-2,1+k*4,1,'#e8c63a');for(let k=0;k<4;k++)P(4+k*2,6+k,9-k*4,1,'#e8c63a');P(5,4,7,4,'#e8c63a');P(6,4,5,4,'#2f4f9a');P(6,6,5,1,'#e8ecef');}else{P(0,0,17,12,'#1e2a3a');P(0,0,17,1,'#3a4f6a');P(4,3,9,1,'#e8ecef');P(4,6,9,1,'#c9a24a');P(4,9,9,1,'#e8ecef');}});
  for(let i=0;i<17;i++){const ph=frame/7-i*0.5,dy=Math.sin(ph)*1.6*(i/16);ctx.drawImage(cl,i,0,1,12,X+17+i,Y+3+dy,1,12);if(Math.cos(ph)<-0.3){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(X+17+i,Y+3+dy,1,12);}else if(Math.cos(ph)>0.7){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(X+17+i,Y+3+dy,1,12);}}
  ctx.fillStyle='#1e1611';ctx.fillRect(X+16,Y+3,1,12);
}
function drawDoor(){
  const X=15*T,Y=18*TH+12,o=doorOpen*22;
  ctx.fillStyle='#23272b';ctx.fillRect(X,Y,2*T,36);ctx.fillStyle='#3a332a';ctx.fillRect(X+4,Y+3,2*T-8,28);ctx.fillStyle='#4a4236';ctx.fillRect(X+4,Y+3,2*T-8,2);
  ctx.save();ctx.beginPath();ctx.rect(X+2,Y+1,2*T-4,33);ctx.clip();
  for(const [x0,s] of [[X+4-o,-1],[X+34+o,1]]){ctx.fillStyle='#14171a';ctx.fillRect(x0-1,Y+2,28,30);ctx.fillStyle='rgba(111,147,179,.88)';ctx.fillRect(x0,Y+3,26,28);ctx.fillStyle='#a7c6dc';ctx.fillRect(x0+2,Y+5,8,10);ctx.fillStyle='#5f86a8';ctx.fillRect(x0+14,Y+17,10,12);ctx.fillStyle='#dbe6ee';ctx.fillRect(x0,Y+3,26,2);ctx.fillStyle='#1c2024';ctx.fillRect(x0,Y+29,26,2);ctx.fillStyle='#c9ccce';ctx.fillRect(x0+(s<0?24:0),Y+13,2,9);}
  {const g=(frame%420)/70;if(g<1){const gx=X-14+g*(2*T+28);ctx.globalAlpha=0.32;ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(gx,Y+3);ctx.lineTo(gx+7,Y+3);ctx.lineTo(gx-3,Y+31);ctx.lineTo(gx-10,Y+31);ctx.closePath();ctx.fill();ctx.globalAlpha=0.18;ctx.fillRect(gx+10,Y+3,2,28);ctx.globalAlpha=1;}}
  ctx.restore();ctx.fillStyle='#c9a24a';ctx.fillRect(X+2,Y+32,2*T-4,4);
}
function smokePass(){
  for(const p of FXP){const k=1-p.t/p.life;
    if(p.k==='smoke'){const curl=Math.sin(p.t/22+p.ph)*(2+p.t*0.03);ctx.globalAlpha=0.16*k*Math.min(1,p.t/12);ctx.fillStyle='#d8dde2';const r=p.sz+p.t*0.035;ctx.beginPath();ctx.ellipse(p.x+curl,p.y-p.z,r*1.3,r,0,0,7);ctx.fill();}
    else if(p.k==='exh'){ctx.globalAlpha=0.2*k*Math.min(1,p.t/6);ctx.fillStyle='#8a8e94';const r=p.sz+p.t*0.09;ctx.beginPath();ctx.ellipse(p.x,p.y-p.z,r*1.3,r,0,0,7);ctx.fill();}
    else if(p.k==='drop'){ctx.globalAlpha=0.8;ctx.fillStyle='#cfe4f2';ctx.fillRect(Math.round(p.x),Math.round(p.y-p.z),1,1);}
    else if(p.k==='bub'){ctx.globalAlpha=0.75*k;ctx.fillStyle='#e8f6fc';ctx.fillRect(Math.round(p.x),Math.round(p.y-p.z),p.sz,p.sz);}
    else if(p.k==='feather'){const fade=p.y>=p.gy?Math.min(1,(p.life-p.t)/80):1;ctx.globalAlpha=fade;ctx.fillStyle=p.c;const tl=Math.sin(p.t/10+p.ph)>0;ctx.fillRect(Math.round(p.x),Math.round(p.y),tl?3:2,1);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);}
    else if(p.k==='ash'){ctx.globalAlpha=Math.min(1,(p.life-p.t)/40);ctx.fillStyle='#8a8680';ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);}
    else if(p.k==='puff'){ctx.globalAlpha=(p.dim?0.12:0.3)*k;ctx.fillStyle='#b8b0a0';const r=p.sz+p.t*0.06;ctx.beginPath();ctx.ellipse(p.x,p.y-p.z,r,r*0.7,0,0,7);ctx.fill();}
    else if(p.k==='leaf'){const fade=p.y>=p.gy?Math.min(1,(p.life-p.t)/80):1;ctx.globalAlpha=fade;ctx.fillStyle=p.c;const fl=Math.sin(p.t/6+p.ph)>0;ctx.fillRect(Math.round(p.x),Math.round(p.y),fl?2:1,1);}}
  // pólen e penugem flutuando no sol do pátio, com a sombrinha no chão
  for(const q of POLLEN){const sh=1-0.6*sunShade(q.x),tw=0.7+0.3*Math.sin(frame/13+q.ph*4),X=Math.round(q.x),Y=Math.round(q.y-q.z);
    ctx.globalAlpha=0.16*sh;ctx.fillStyle='#000';ctx.fillRect(Math.round(q.x+q.z*0.35),Math.round(q.y),q.fluff?2:1,1);
    ctx.globalAlpha=(q.fluff?0.9:0.75)*tw;ctx.fillStyle=q.fluff?'#ffffff':'#ffe9a0';ctx.fillRect(X,Y,1,1);
    if(q.fluff){ctx.globalAlpha*=0.5;ctx.fillRect(X-1,Y,1,1);ctx.fillRect(X+1,Y,1,1);ctx.fillRect(X,Y-1,1,1);ctx.fillRect(X,Y+1,1,1);}}
  // mariposas na luminária
  {const cx=5.5*T+16,cy=12*TH-14;for(const m of MOTHS){const x=Math.round(cx+Math.cos(m.a)*m.r*1.6),y=Math.round(cy+Math.sin(m.a)*m.r*0.7+Math.sin(frame/5+m.ph)*1.5),fl=(frame+m.ph*10|0)%4<2;ctx.globalAlpha=0.85;ctx.fillStyle='#3a342c';ctx.fillRect(x,y,1,1);ctx.fillStyle='#e8d8b0';ctx.globalAlpha=0.7;if(fl){ctx.fillRect(x-1,y-1,1,1);ctx.fillRect(x+1,y-1,1,1);}else{ctx.fillRect(x-1,y,1,1);ctx.fillRect(x+1,y,1,1);}}}
  // a brasa e o filtro do cigarro
  ctx.globalAlpha=1;ctx.fillStyle='#e8e4da';ctx.fillRect(4*T+72,12*TH+26,5,1);ctx.fillStyle='#c98a4a';ctx.fillRect(4*T+71,12*TH+26,2,1);
  ctx.fillStyle=(frame>>4)%3?'#ff7a3a':'#ffb060';ctx.fillRect(4*T+77,12*TH+26,1,1);
}


/* ---------- Detalhe de perto ---------- */
let LODE=1,LODV=1,SC=1;
const DP=v=>Math.round(v*SC)/SC; // posição no pixel da tela: anda sem tremer com a câmera
const lodOf=e=>e<0.9?0:e<1.6?1:e<2.4?2:3;
const MICROFONT='ui-monospace,Menlo,Consolas,monospace';
function mtext(x,y,t,size,col,align,w){ctx.font=`${w||600} ${size}px ${MICROFONT}`;ctx.fillStyle=col;ctx.textAlign=align||'left';ctx.fillText(t,x,y);ctx.textAlign='left';}
function clockStr(){const m=gameMin%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function drawClockHands(){
  if(LODV<2)return;const cx=15*T+16,cy=1*TH-RISE+CAPH+16,m=gameMin,hA=((m/60)%12)/12*6.283-1.571,mA=(m%60)/60*6.283-1.571;
  ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(hA)*3.2,cy+Math.sin(hA)*3.2);ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(mA)*5.2,cy+Math.sin(mA)*5.2);ctx.stroke();
  ctx.fillStyle='#c0392b';ctx.fillRect(Math.round(cx+Math.cos(frame/9.55)*5),Math.round(cy+Math.sin(frame/9.55)*5),1,1);
}
function micro(){
  // relógio digital da recepção, sempre aceso
  ctx.fillStyle='#0c1410';ctx.fillRect(20*T+9,9*TH+1,14,6);ctx.fillStyle='#2a2d30';ctx.fillRect(20*T+9,9*TH+1,14,1);
  if(LODV>=2)mtext(20*T+16,9*TH+5.9,clockStr(),3.6,'#54e07a','center',700);
  if(LODV<3)return;
  const on=(frame>>5)%2;
  ctx.fillStyle=on?'#ff5a4a':'#7a1a18';ctx.fillRect(4*T+58,12*TH+16,2,2);
  mtext(12*T+112,12*TH-6.6,'LIVRO DE VISITAS',1.25,'#3a3a3a','center',700);
  mtext(4*T+47,4*TH+11.2,'DELEGADA',2,'#3a2a10','center',800);
  mtext(14*T+16,6*TH-34.6,'CASO 01',3.2,'#3a2a10','center',800);
}

/* ---------- Desenho ---------- */
// luz de contorno: a borda do sprite virada para a luz mais forte acende com a cor dela
const RIMC=new WeakMap();
function rimImg(img,lx,ly,col,st){let m=RIMC.get(img);if(!m)RIMC.set(img,m=new Map());let a=m.get(col);if(!a)m.set(col,a=[]);const key=(lx+1)*3+ly+1;let c=a[key];if(c)return c;
  c=document.createElement('canvas');c.width=img.width;c.height=img.height;const g=c.getContext('2d');g.drawImage(img,0,0);g.globalCompositeOperation='destination-out';g.drawImage(img,-lx*st,-ly*st);
  g.globalCompositeOperation='source-in';g.fillStyle=col;g.fillRect(0,0,c.width,c.height);a[key]=c;return c;}
const RL={lx:0,ly:0,col:'',a:0},BL={gx:0,gy:0,d:0,l:null};
function rimLight(p){
  const i=ti(p),rm=room[i];
  if(!INSIDE(rm)&&floor[i]!==F.DOOR){RL.lx=-1;RL.ly=-1;RL.col='#fff0d2';RL.a=0.62*(1-0.65*sunShade(p.x*T));return RL;}
  let best=null,bv=0;for(const l of LIGHTS){if(l[5]!==rm)continue;const gx=l[0]-(p.x+0.5),gy=l[1]-(p.y+1),d=Math.hypot(gx,gy),v=l[4]/(0.5+d);if(v>bv){bv=v;best=BL;BL.gx=gx;BL.gy=gy;BL.d=d;BL.l=l;}}
  if(!best)return null;const n=Math.max(0.001,best.d),vx=best.gx/n,vy=best.gy/n;let lx=vx>0.38?1:vx<-0.38?-1:0,ly=vy<-0.38?-1:0;if(!lx&&!ly)ly=-1;
  const l=best.l;if(!l.rim){const c=l[3],m=x=>Math.round(x+(255-x)*0.35);l.rim=`rgb(${m(c[0])},${m(c[1])},${m(c[2])})`;}
  RL.lx=lx;RL.ly=ly;RL.col=l.rim;RL.a=clamp(l[4]*(1.05-best.d*0.18),0.18,0.7);return RL;
}
function drawPerson(p,sit,id){
  const fr=framesFor(p);let f=0,dy=0;
  if(p.moving)f=Math.floor(p.walk*3.2)%4;else if(p.pose)f=poseFrame(p.pose,sit);else if(sit){f=4;if(p.act==='type'&&((frame>>2)+id)%6<2)dy=-1;if(p.act==='write'&&((frame>>4)+id)%5===0)dy=-1;}
  const X=DP(p.x*T+16),Y=DP(p.y*TH+TH-2);
  const bob=p.moving?((Math.floor(p.walk*3.2)%2)?-1:0):sit?dy:(Math.sin(frame/26+(id||0)*1.7)>0.55?-1:0);
  const hdA=clamp((LODE-2.2)/0.35,0,1),img=hdA>=1?framesHDFor(p)[f]:fr[f],dw=fr[f].width,dh=fr[f].height;
  if(!sit){if(!QLOW()&&GLOSSY.has(room[ti(p)]))drawReflect(fr[f],X,Y,p.dir<0,dw,dh);drawCast(fr[f],X,Y,p.dir<0,castFrom(p),dw,dh);ctx.drawImage(SHADOW,X-11,Y-5);}
  if(p.mop){const mx=X+p.dir*10,sw=p.moving?Math.sin(frame/5)*3:0;ctx.strokeStyle='#8a6a4a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(X+p.dir*4,Y-26);ctx.lineTo(mx+sw,Y-2);ctx.stroke();ctx.fillStyle='#d8d0c0';ctx.fillRect(Math.round(mx+sw-5),Y-3,10,3);ctx.fillStyle='#b8b0a0';ctx.fillRect(Math.round(mx+sw-5),Y-1,10,1);}
  const dw0=dofW(Y-22),put=(im,nb)=>{const w=nb?0:dw0;if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);drawB(im,-14,Y-45+bob,w,dw,dh);ctx.restore();}else drawB(im,X-14,Y-45+bob,w,dw,dh);};
  put(img);if(hdA>0&&hdA<1){ctx.save();ctx.globalAlpha=hdA;put(framesHDFor(p)[f]);ctx.restore();}
  if(LODV>=1&&!QLOW()){const rl=rimLight(p);if(rl&&rl.a>0.05){const st=Math.max(1,Math.round(img.width/dw));ctx.save();ctx.globalAlpha=rl.a;if(dw0<0.5)put(rimImg(img,p.dir<0?-rl.lx:rl.lx,rl.ly,rl.col,st),true);ctx.restore();}}
  // piscar
  if(p.pose==='drink'&&LODV>=1){const cx=X+(p.dir<0?-2:2),cy=Y-45+bob+(sit?4:0)+3+6;ctx.fillStyle='rgba(255,255,255,.35)';for(let k=0;k<3;k++){const ph=(frame/14+k*0.33)%1;ctx.globalAlpha=1-ph;ctx.fillRect(Math.round(cx+Math.sin(frame/9+k*2)*1.2),Math.round(cy-ph*7),1,1);}ctx.globalAlpha=1;}
  if(LODV>=2&&!p.moving&&((frame+(id||0)*53)%190)<6){const sk=p.look.skin,cy=isSitF(f)?4:0;ctx.fillStyle=sk;
    if(LODV>=3){const xs=p.dir<0?[X+2,X-3]:[X-3.5,X+1.5];for(const x of xs){ctx.fillStyle=sk;ctx.fillRect(x,Y-35.5+bob+cy,1.5,1.5);ctx.fillStyle=rgbs(mul(hex(sk),0.55));ctx.fillRect(x,Y-34.3+bob+cy,1.5,.35);}}
    else{ctx.fillRect(X-3,Y-35+bob+cy,1,2);ctx.fillRect(X+2,Y-35+bob+cy,1,2);}}
}
// sinal de novidade: ponto amarelo com um anel que se abre devagar
function drawMarker(X,Y){
  const t=(frame%90)/90,b=Math.round(Math.sin(frame/12)*1.5);
  ctx.globalAlpha=0.55*(1-t);ctx.strokeStyle='#f2c230';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(X,Y+b,4+t*7,0,7);ctx.stroke();
  ctx.globalAlpha=1;ctx.fillStyle='#1e1611';ctx.beginPath();ctx.arc(X,Y+b,4.6,0,7);ctx.fill();
  ctx.fillStyle='#f2c230';ctx.beginPath();ctx.arc(X,Y+b,3.2,0,7);ctx.fill();
  ctx.fillStyle='rgba(255,246,214,.9)';ctx.fillRect(X-1.5,Y+b-1.8,1.2,1.2);
}
let UIK=1;
function atUI(X,Y,fn){if(UIK>=0.999){fn();return;}ctx.save();ctx.translate(X,Y);ctx.scale(UIK,UIK);ctx.translate(-X,-Y);fn();ctx.restore();}
function drawSay(X,Y,s,al){atUI(X,Y,()=>{
  ctx.font='600 7px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const w=Math.ceil(ctx.measureText(s).width)+8,x=Math.round(X-w/2),y=Math.round(Y-14);
  ctx.globalAlpha=al;ctx.fillStyle='#1e1611';ctx.fillRect(x-1,y-1,w+2,12);ctx.fillRect(X-2,y+11,4,2);
  ctx.fillStyle='#f3f1ea';ctx.fillRect(x,y,w,10);ctx.fillRect(X-1,y+10,2,2);
  ctx.fillStyle='#14181b';ctx.textAlign='center';ctx.fillText(s,X,y+7.5);ctx.textAlign='left';ctx.globalAlpha=1;});}
// nomes das salas pintados no piso, junto à parede da frente: aparecem ao afastar, sem caixa por cima dos móveis
// o corredor restrito termina no balcão da recepção: o nome sobe para o chão do corredor
const LABEL_DY={acesso:-2.4},LABEL_W={};
function drawRoomLabels(){
  const fa=clamp((1.0-LODE)/0.2,0,1);if(fa<=0)return;ctx.save();ctx.font=`700 8px ${MICROFONT}`;ctx.textAlign='left';ctx.textBaseline='alphabetic';
  for(const k in ROOM_RECT){const r=ROOM_RECT[k],t=ROOM_NAME[k].toUpperCase(),sp=2.2,cw=LABEL_W[k]||(LABEL_W[k]=[...t].map(c=>ctx.measureText(c).width)),w=cw.reduce((a,b)=>a+b,0)+sp*(t.length-1);
    let x=(r[0]+r[2]+1)/2*T-w/2;const y=(r[3]+1)*TH-RISE+CAPH-6+(LABEL_DY[k]||0)*TH;
    ctx.lineWidth=2.2;ctx.strokeStyle='rgba(10,10,14,.6)';ctx.lineJoin='round';
    [...t].forEach((c,i)=>{ctx.globalAlpha=fa*0.75;ctx.strokeText(c,x,y);ctx.fillStyle='#efe9da';ctx.fillText(c,x,y);x+=cw[i]+sp;});}
  ctx.restore();ctx.textAlign='left';ctx.globalAlpha=1;
}
function drawNames(){
  const fa=clamp((LODE-1.9)/0.3,0,1);if(fa<=0||talkOpen)return;
  ctx.save();ctx.globalAlpha=fa;const fs=Math.max(2,5.5*Math.min(1,2.4/LODE));ctx.font=`600 ${fs}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.textAlign='center';
  for(const n of NPCS){const X=Math.round(n.x*T)+16,Y=Math.round(n.y*TH)+TH+fs+1,t=n.name.split(' ')[0]+' · '+n.role.split(' · ')[0],w=ctx.measureText(t).width+fs;ctx.fillStyle='rgba(8,10,12,.72)';ctx.fillRect(X-w/2,Y-fs,w,fs*1.45);ctx.fillStyle='#e9edf0';ctx.fillText(t,X,Y);}
  ctx.restore();ctx.textAlign='left';
}
let ROWS=null;const byY=(a,b)=>a.y-b.y;
// em volta da planta, a mesma vizinhança da cena da rua (docs/RUA_BEATCOP_BASE.md): à esquerda, depois do beco, o
// DINER, um prédio de apartamentos e o GROCERY; à direita, a PAWN SHOP, a LAUNDRY e outro prédio; atrás, telhados. Vistos de
// cima como a planta, com a fachada e o toldo voltados para a calçada. Calçada, rua e telhados da frente continuam.
// Tudo escurece com a distância, para o olho ficar no DHPP. Desenhado no espaço do terreno (BG), antes dele.
let APRON=null,NEIGH=null;
function buildNeigh(side){
  const list=side<0?[['GROCERY',7,'#7a3a2a','#3e3b38',['#2f6a3a','#e8e4d8'],'#2f6a3a'],['',8,'#9a5a3c','#4a4642',null,null],['DINER',9,'#8a4632','#55504a',['#b8322a','#f2ece0'],'#b8322a']]
                   :[['PAWN SHOP',8,'#a58a62','#4a4642',null,'#d9b84a'],['LAUNDRY',8,'#7a3a2a','#3e3b38',['#2a4a8a','#e8ecf2'],'#2a4a8a'],['',8,'#8e7a5a','#55504a',null,null]];
  const w=list.reduce((a,b)=>a+b[1],0)*T,h=19*T+12,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  let x=0;
  for(const [name,tw,brick,tar,awn,sign] of list){const bw=tw*T-6;
    g.fillStyle=tar;g.fillRect(x,T,bw,16*T);                                                     // telhado
    for(let k=0;k<160;k++){g.fillStyle=k%2?'rgba(0,0,0,.08)':'rgba(255,255,255,.05)';g.fillRect(x+((k*53)%bw),T+((k*97)%(16*T)),2,2);}
    g.fillStyle=brick;g.fillRect(x,T,bw,6);g.fillRect(x,T,6,16*T);g.fillRect(x+bw-6,T,6,16*T);     // platibanda
    g.fillStyle='#a9adb0';g.fillRect(x+bw*0.3,T*5,20,14);g.fillRect(x+bw*0.62,T*11,16,12);g.fillStyle='#6a7074';g.fillRect(x+bw*0.3+3,T*5+4,14,2);g.fillRect(x+bw*0.62+3,T*11+4,10,2);
    g.fillStyle=brick;g.fillRect(x,17*T,bw,2*T);                                                  // fachada
    for(let yy=17*T;yy<19*T;yy+=4){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x,yy,bw,1);}
    for(let wx=x+10;wx<x+bw-24;wx+=34){g.fillStyle='#9cc4e0';g.fillRect(wx,17*T+6,22,14);g.fillStyle='#e8e4d8';g.fillRect(wx,17*T+6,22,2);}
    g.fillStyle='#1c2024';g.fillRect(x+bw/2-10,18*T+4,20,T-4);g.fillStyle='#6f93b3';g.fillRect(x+bw/2-8,18*T+6,16,T-8);  // porta e vitrine
    g.fillStyle='#6f93b3';g.fillRect(x+12,18*T+8,bw/2-28,T-10);g.fillRect(x+bw/2+16,18*T+8,bw/2-28,T-10);
    if(awn){for(let ax=x+6;ax<x+bw-6;ax+=8){g.fillStyle=((ax-x)>>3)%2?awn[1]:awn[0];g.fillRect(ax,18*T+2,8,10);}g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+6,18*T+12,bw-12,3);}
    if(sign&&name){g.font='700 13px Rajdhani,"Arial Narrow",sans-serif';const tw2=g.measureText(name).width+14;g.fillStyle=sign;g.fillRect(x+bw/2-tw2/2,17*T+22,tw2,16);
      g.fillStyle=sign==='#d9b84a'?'#2a1d10':'#f2ece0';g.textAlign='center';g.fillText(name,x+bw/2,17*T+35);g.textAlign='left';}
    g.fillStyle='#2c2a28';g.fillRect(x+bw,0,6,h);                                                 // vão de serviço
    x+=tw*T;}
  return c;
}
function drawApron(){
  const w=BG.width,h=BG.height,E=30*T,y19=19*T;
  if(!APRON){const strip=(sx,sy,sw,sh)=>{const c=document.createElement('canvas');c.width=sw;c.height=sh;c.getContext('2d').drawImage(BG,sx,sy,sw,sh,0,0,sw,sh);return c;};
    APRON={left:ctx.createPattern(strip(0,0,T,h),'repeat-x'),right:ctx.createPattern(strip(w-T,0,T,h),'repeat-x'),back:ctx.createPattern(strip(0,37*T,8*T,2*T),'repeat')};}
  if(!NEIGH)NEIGH={L:buildNeigh(-1),R:buildNeigh(1)};
  // atrás do quarteirão: telhados
  ctx.fillStyle=APRON.back;ctx.fillRect(-E,-E,w+2*E,E);
  // calçada, rua e telhados da frente continuam pelos lados
  ctx.fillStyle=APRON.left;ctx.fillRect(-E,y19,E,h-y19);
  ctx.save();ctx.translate(w-T,0);ctx.fillStyle=APRON.right;ctx.fillRect(T,y19,E,h-y19);ctx.restore();
  // os vizinhos; além deles, mais telhados
  ctx.fillStyle=APRON.back;ctx.fillRect(-E,0,E-NEIGH.L.width,y19);ctx.fillRect(w+NEIGH.R.width,0,E,y19);
  ctx.drawImage(NEIGH.L,-NEIGH.L.width,0);ctx.drawImage(NEIGH.R,w,0);
  if(!APRON.fades){const mk=(x0,y0,x1,y1)=>{const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'rgba(8,10,12,.12)');g.addColorStop(.45,'rgba(8,10,12,.42)');g.addColorStop(1,'rgba(8,10,12,.75)');return g;};
    APRON.fades=[[mk(0,0,0,-6*T),-E,-E,w+2*E,E],[mk(0,0,-16*T,0),-E,0,E,h],[mk(w,0,w+16*T,0),w,0,E,h]];}
  for(const [g,x,y,ww,hh] of APRON.fades){ctx.fillStyle=g;ctx.fillRect(x,y,ww,hh);}
}
// foco na sala do Lemos (base.focus): com a câmera afastada, as outras salas escurecem e esfriam; a troca é suave
const FOCUS={};
function focusPass(){
  const on=fxOn('base.focus'),far=clamp((1.0-LODE)/0.22,0,1),cur=roomOf(P1);
  for(const k in ROOM_RECT){const t=on&&ROOM_RECT[cur]&&k!==cur?far:0,v=FOCUS[k]||0,n=v+(t-v)*0.12;FOCUS[k]=n<0.004?0:n;
    if(FOCUS[k]>0){const q=roomClip(k);ctx.globalAlpha=0.5*FOCUS[k];ctx.fillStyle='#070a10';ctx.fillRect(q[0],q[1],q[2]-q[0],q[3]-q[1]);}}
  ctx.globalAlpha=1;
}
// o lado de fora da planta é a própria cena da rua (street.js): o mesmo chão, os mesmos carros, a viatura, quem passa,
// os semáforos, os postes e as árvores, na arte oficial e na mesma simulação (a rua continua andando com o Lemos aqui dentro).
// A porta do DHPP da rua (x 1200) cai na porta da planta (x 512); o pé das fachadas (GY) cai na linha 19.
const STRIP_DX=688,STRIP_YB=956;
function stripView(s,ox,oy){
  if(!STREET||(cv.height-oy)/s<19*TH-230)return null;const st=STREET;   // a rua fora do quadro (postes e árvores sobem até ~200 px)
  const dy=st.strip.GY-19*TH;
  return {st,ox:ox-STRIP_DX*s,oy:oy-dy*s,X0:-ox/s+STRIP_DX,X1:(cv.width-ox)/s+STRIP_DX,yb:STRIP_YB};
}
function render(){
  // o entorno (drawApron) e o piso cobrem a tela inteira: limpar seria pintar a tela toda à toa a cada quadro
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  const s=cam.z*RS,oxf=cv.width/2-cam.x*s,oyf=cv.height/2-cam.y*s,ox=Math.round(oxf),oy=Math.round(oyf);
  // a fração que o arredondamento tirou vai para o shader: a câmera desliza no pixel da tela
  FX.sx=oxf-ox;FX.sy=oyf-oy;
  LODE=s/RS;LODV=lodOf(LODE);SC=s;UIK=Math.max(1/LODE,Math.min(1,2.2/LODE));
  const SPR=()=>{ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;};
  DOF_S=s;DOF_OY=oy;DOF_ON=FXMODE==='2d'&&!POST&&FX.dof>0.02&&QHIGH();
  ctx.setTransform(s,0,0,s*K,ox,oy);ctx.imageSmoothingEnabled=false;drawApron();ctx.drawImage(BG,0,0);dofGround(s,ox,oy);
  const RX=stripView(s,ox,oy);if(RX)RX.st.strip.ground(ctx,s,RX.ox,RX.oy,RX.X0,RX.X1,RX.yb);
  SPR();drawFloorFX();
  if(!ROWS){ROWS=Array.from({length:H},()=>({o:[],p:[],x:[]}));for(const o of objs)if(o.spr)ROWS[clamp(o.y+o.h-1,0,H-1)].o.push(o);}
  for(const r of ROWS){r.p.length=0;r.x.length=0;}
  const R=k=>ROWS[clamp(k,0,H-1)];
  for(const n of NPCS){n._sit=!!n.sit&&!n.moving&&isSeat(n);n._k=n.k;R(Math.round(n.y)).p.push(n);}
  P1._sit=false;P1._k=9;R(Math.round(P1.y)).p.push(P1);
  VIS.forEach((v,k)=>{v._sit=true;v._k=20+k;R(Math.round(v.y)).p.push(v);});
  const y0=Math.max(0,Math.floor(-oy/s/TH)-4),y1=Math.min(H-1,Math.ceil((cv.height-oy)/s/TH)+4);
  for(let y=y0;y<=y1;y++){
    if(WALLROWS[y])drawB(WALLROWS[y],0,y*TH-RISE,dofW(y*TH));
    if(y===1)drawClockHands();
    if(y===18){drawDoor();ctx.drawImage(SIGN,13*T,18*TH-8);ctx.drawImage(PANELS[0],6*T+4,18*TH-6);ctx.drawImage(PANELS[1],23*T+4,18*TH-6);}
    const r=ROWS[y];
    for(const o of r.o){if(o.nocc)drawB(o.spr.c,o.spr.x,o.spr.y,dofW(o.spr.y+o.spr.c.height*0.6));}
    for(const o of r.o){if(!o.nocc){drawB(o.spr.c,o.spr.x,o.spr.y,dofW(o.spr.y+o.spr.c.height*0.6));if(o.t==='flag')drawFlagCloth(o);}}
    if(r.p.length>1)r.p.sort(byY);
    // quem está sentado atrás de uma mesa é desenhado antes dela (a mesa fica na fileira de baixo)
    for(const p of r.p)drawPerson(p,p._sit,p._k);
  }
  if(RX){RX.st.strip.ents(ctx,s,RX.ox,RX.oy,RX.X0,RX.X1,RX.yb);SPR();}
  // luminária pendente da sala de depoimentos
  ctx.fillStyle='#1c1e20';ctx.fillRect(5.5*T+15,10*TH-RISE,1,2*TH-6);ctx.drawImage(LAMP,5.5*T+5,12*TH-30);
  micro();
  if(fxOn('base.life'))for(const p of FXP)if(p.k==='sheet'){const k=Math.min(1,(p.life-p.t)/20);ctx.globalAlpha=k;ctx.fillStyle='#f3f0e8';ctx.fillRect(Math.round(p.x),Math.round(p.y),9,6);ctx.fillStyle='#c9c4b6';ctx.fillRect(Math.round(p.x),Math.round(p.y)+5,9,1);ctx.fillStyle='#8a8a8a';ctx.fillRect(Math.round(p.x)+2,Math.round(p.y)+2,5,1);ctx.globalAlpha=1;}
  // destino do toque
  if(P1.path.length&&started){const e=P1.path[P1.path.length-1],X=(e%W)*T+16,Y=((e/W)|0)*TH+TH/2;ctx.strokeStyle='rgba(242,194,48,.9)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.lineDashOffset=-(frame>>2);ctx.beginPath();ctx.ellipse(X,Y,10,4.5,0,0,7);ctx.stroke();ctx.setLineDash([]);}
  lightPass(s,ox,oy);
  // madrugada: postes e faróis da rua somados depois da luz (não escurecem) e a garoa só onde é céu aberto
  if(NIGHT){if(RX)RX.st.strip.night(ctx,s,RX.ox,RX.oy,RX.X0,RX.X1);
    if(STREET)STREET.strip.rain(ctx,cv.width,cv.height,RS,c=>{c.beginPath();c.rect(0,0,cv.width,cv.height);c.rect(1*T*s+ox,(1*TH-RISE-40)*s+oy,32*T*s,(18*TH-(1*TH-RISE-40))*s);c.clip('evenodd');});
    SPR();}
  SPR();smokePass();glowPass();focusPass();post2d();
  // camada legível: sinais, falas, nomes
  // sinais de novidade: no máximo três (MARKS_MAX), primeiro o que move a história (Sônia, equipe com novidade,
  // depoimentos), depois pessoas e coisas ainda não vistas; no empate, o mais perto do Lemos
  {const cand=[];
    for(const n of NPCS)if(hasNews(n.id)&&!(talk&&talk.id===n.id)){const X=Math.round(n.x*T)+16,Y=Math.round(n.y*TH)+TH-(n.sit?64:60);cand.push({X,Y,ui:1,p:n.id==='sonia'?5:TEAM_IDS.has(n.id)?4:2,d:dist(P1.x,P1.y,n.x,n.y)});}
    if(!talkOpen)for(const o of objs)if(o.hot&&o.spr&&!o.nomark&&(o.hot==='interro'?hasNews('interro'):!SEEN[o.hot])){const sp=o.spr;cand.push({X:o.x*T+o.w*T/2,Y:o.hot==='interro'?sp.y-36:sp.y-6,ui:0,p:o.hot==='interro'?4:1,d:dist(P1.x,P1.y,o.x+o.w/2,o.y)});}
    cand.sort((a,b)=>b.p-a.p||a.d-b.d);
    for(const m of cand.slice(0,MARKS_MAX)){if(m.ui)atUI(m.X,m.Y,()=>drawMarker(m.X,m.Y));else drawMarker(m.X,m.Y);}}
  for(const n of NPCS)if(n.say&&!talkOpen){const al=Math.min(1,(n.say.life-n.say.t)/20,n.say.t/6);drawSay(Math.round(n.x*T)+16,Math.round(n.y*TH)+TH-(n.sit?70:74),n.say.txt,al);}
  drawNames();drawRoomLabels();
}
// o sinal amarelo da equipe é desenhado a cada quadro: a conta só é refeita quando o save muda
let NEWS_C=null,NEWS_M={};
function teamNewsCount(id){if(NEWS_C!==CASE){NEWS_C=CASE;NEWS_M={};}return NEWS_M[id]??(NEWS_M[id]=teamNews(CASE,id).count);}
const MARKS_MAX=3;
function hasNews(id){if(!DLG[id])return false;if(id==='interro')return INTERRO_NEWS||!SEEN.interro;if(TEAM_IDS.has(id))return teamNewsCount(id)>0||(id==='sonia'&&!SEEN.sonia);return !SEEN[id];}
function isSeat(n){const i=ti(n);return objs.some(o=>o.nocc&&idx(o.x,o.y)===i);}

/* ---------- Interface ---------- */
let lastRoom='',lastClk='';
/* ---------- Rua (lado de fora) ⇄ planta (lado de dentro) ---------- */
let SCENE='rua',STREET=null;
const street=()=>STREET||(STREET=createStreet({lemosLook:LOOK.lemos,personFrames,getZoom:()=>cam.z,onEnter:()=>enterBase(),art:{S2,refine,outlined,bush,hash,mulberry32,txt,txtW,sign:()=>SIGN,door:()=>DOORSPR},quality:()=>QUAL,onSound:(k,x,a)=>ambStreet(k,x,a),hudTop:()=>HUDT,night:()=>NIGHT}));
// a rua (street.js) vem da direção americana aprovada; a arte oficial de public/base/rua/ entra quando chega
const streetView=()=>street();
const FADE=document.createElement('div');FADE.id='fade';FADE.setAttribute('aria-hidden','true');appEl.appendChild(FADE);
function fadeTo(fn){FADE.classList.add('on');setTimeout(()=>{fn();requestAnimationFrame(()=>FADE.classList.remove('on'));},200);}
function setWhere(t){lastRoom=null;$('#where-n').textContent=t;$('#b-view').hidden=t!=='Rua do DHPP';}
// entrou pela porta do DHPP: aparece na recepção, logo depois da porta
function enterBase(instant){
  const go=()=>{SCENE='base';$('#b-view').hidden=true;AMB.setScene('base');streetLeft=0;resumeBase();P1.x=16;P1.y=17;P1.path=[];P1.pend=null;P1.dir=1;
    const e=bfs(ti(P1),i=>i===idx(16,15),walkPass);if(e>=0)P1.path=pathTo(e);
    cam.x=P1.x*T+16;cam.y=P1.y*TH;clampCam();CAMCTRL.focus({id:'enter-base',mode:'transition',priority:CAMERA_PRIORITY.critical,x:16*T+16,y:14.5*TH,duration:420,hold:220,interruptible:true});follow=true;last=performance.now();updateUI();};
  if(instant)go();else fadeTo(go);
}
// saiu pela porta da frente: volta para a calçada, na porta do DHPP
// a rua não congela enquanto Lemos está lá dentro: ao voltar, ela avança o tempo que passou (e a base, ao entrar)
let streetLeft=0,baseLeft=0;
function toStreet(){fadeTo(()=>{SCENE='rua';$('#b-view').hidden=false;AMB.setScene('rua');baseLeft=performance.now();if(streetLeft)street().resume((performance.now()-streetLeft)/1000);street().place('porta');setWhere('Rua do DHPP');});}
// som pontual da rua: lado e volume pela distância até o centro da câmera
function ambStreet(k,x,a){const v=STREET&&STREET.view;if(!v||SCENE!=='rua')return;const cx=v.left+v.vw/2,d=(x-cx)/(v.vw/2);AMB.fx(k,Math.max(-1,Math.min(1,d*.8)),a*Math.max(0,1-Math.abs(d)*.55));}
let ambT=0,stepW=0;
function streetAmbience(st,dt){
  if((ambT+=dt)<.25)return;ambT=0;const v=st.view;if(!v)return;const cx=v.left+v.vw/2;let lv=0;
  for(const k of st.cars){const w=k.id==='onibus'?360:180,d=Math.abs(k.x+w/2-cx);lv+=Math.max(0,1-d/700)*Math.min(1,k.v/110)*(k.id==='onibus'?1.6:1);}
  AMB.traffic(Math.min(1,lv*.4));
  const L=st.lemos;if(L.moving&&Math.floor(L.walk*2)!==stepW){stepW=Math.floor(L.walk*2);AMB.fx('step',0,.5);}
  if(!NIGHT&&Math.random()<.025)AMB.fx('bird',Math.random()*1.6-.8,.5);
}
function goExit(){
  P1.pend=null;if(talk)closeTalk();
  const door=i=>i===idx(16,18)||i===idx(15,18);
  if(door(ti(P1))){toStreet();return;}
  const e=bfs(ti(P1),door,n=>walkPass(n)||door(n));if(e<0)return;
  P1.path=pathTo(e);P1.pend={kind:'exit'};follow=true;
}
function updateUI(){
  const r=roomOf(P1),nm=ROOM_NAME[r]||'';if(r!==lastRoom){lastRoom=r;$('#where-n').textContent=nm;}
  const c=clockStr();if(c!==lastClk){lastClk=c;$('#clk').textContent=c;}
}
let last=performance.now();
const PROF={r2d:0};
function loop(now){
  if(depoOpen){last=now;requestAnimationFrame(loop);return;}
  // o relógio pode ser reiniciado fora do quadro (passagem rua ⇄ planta): o passo nunca anda para trás
  const raw=Math.max(0,now-last),dt=Math.min(0.1,raw/1000);last=now;adaptRS(raw);
  {const et=SCENE!=='rua'||!fxOn('edge.tint');if(ETN.hidden!==et)ETN.hidden=et;const vg=fxOn('edge.tint')?'':'none';if(VIG.style.display!==vg)VIG.style.display=vg;}
  if(SCENE==='rua'){if(FX.vigS!==0.5){FX.vigS=0.5;VIG.style.opacity=0.5;}const st=street();st.update(dt);streetAmbience(st,dt);streetView().draw(ctx,cv.width,cv.height,RS,started);frame++;if(frame%6===0){const c=clockStr();if(c!==lastClk){lastClk=c;$('#clk').textContent=c;}}
    lastClock+=dt;if(lastClock>3){lastClock=0;gameMin++;}requestAnimationFrame(loop);return;}
  update(dt);updFX();updAtmo();if(STREET)STREET.update(dt);stepZoom();followCam(dt);if(started)primeBlur();frame++;const r0=performance.now();render();PROF.r2d+=(performance.now()-r0-PROF.r2d)*0.05;postFX(dt);
  if(CAMERA_DEBUG&&CAMDBG)drawCameraDebug(ctx,{width:cv.width,height:cv.height,dpr:RS,deadZone:{x:VW()/2-CAMDBG.zoneX,y:VH()/2-CAMDBG.zoneY,w:CAMDBG.zoneX*2,h:CAMDBG.zoneY*2},target:CAMDBG.target,lines:[`BASE · ${CAMDBG.room||roomOf(P1)}`,`modo ${CAMDBG.mode} · prioridade ${CAMDBG.priority}`,`cam ${cam.x.toFixed(1)}, ${cam.y.toFixed(1)} · zoom ${cam.z.toFixed(2)}`]});
  if(talk)updLink();if(frame%6===0)updateUI();
  requestAnimationFrame(loop);
}

// foco na faixa de Lemos; na conversa, o fundo desfoca mais, como num corte de cinema
function postFX(dt){
  if(FXMODE==='off')return;
  const s=cam.z*RS,oy=cv.height/2-cam.y*s,py=(P1.y*TH+TH-22)*s+oy;
  const k=1-Math.exp(-dt*5);FX.fy+=(clamp(py/cv.height,0.15,0.85)-FX.fy)*k;
  const tgt=!started?0.9:talkOpen?1:LODE>=1.4?0.8:LODE>=1?0.5:0.2;FX.dof+=(tgt-FX.dof)*k;FX.band+=((talkOpen?0.13:0.19)-FX.band)*k;
  const gr=GRADE[roomOf(P1)]||GRADE.hall,kg=1-Math.exp(-dt*2.5);for(let i=0;i<3;i++)FX.tint[i]+=(gr.tint[i]-FX.tint[i])*kg;for(let i=0;i<4;i++)FX.soft[i]+=(gr.soft[i]-FX.soft[i])*kg;FX.bloom+=(gr.bloom-FX.bloom)*kg;FX.vig+=(gr.vig-FX.vig)*kg;
  if(!POST||!POST.ok){const v=Math.round(Math.min(1,(FX.vig+(talkOpen?0.12:0))/0.62)*100)/100;if(v!==FX.vigS){FX.vigS=v;VIG.style.opacity=v;}return;}
  POST_SUB[0]=FX.sx;POST_SUB[1]=FX.sy;
  const t0=performance.now();
  POST.render({fy:FX.fy,band:FX.band,dof:FX.dof,bloom:FX.bloom,th:0.8,warm:1,ca:0.07,vig:FX.vig+(talkOpen?0.12:0),tint:FX.tint,t:frame,sub:POST_SUB,outW:Math.round(VW()*dpr),outH:Math.round(VH()*dpr)});
  // aparelho sem fôlego para o efeito (a GPU não acompanha): volta ao 2D puro
  const ms=performance.now()-t0;FX.n++;FX.ms=FX.n<=10?FX.ms+(ms-FX.ms)/FX.n:FX.ms+(ms-FX.ms)*0.1;if(FX.n>40&&FX.ms>20&&!FX_FORCE){POST=null;document.body.classList.remove('gl');sizeCanvas();zoomTo(cam.z,null,null,240);}
}
// Pós-processamento sem ler o quadro de volta (no Safari, ler o canvas a cada quadro trava a GPU, e o desfoque
// nativo do sistema por cima do canvas fica atrasado e deixa um fantasma quando a câmera anda):
// - profundidade de campo: as camadas paradas e os sprites têm versões desfocadas feitas uma vez (blurOf),
//   usadas em cima e embaixo da faixa de Lemos (dofW);
// - brilho: halos somados nas próprias fontes de luz (glowPass);
// - clima da sala: um preenchimento em luz suave.
const VIG=$('#vig');
function post2d(){
  if(FXMODE!=='2d'||POST)return;
  const sf=FX.soft;if(sf[3]<0.015)return;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='soft-light';ctx.globalAlpha=sf[3];ctx.fillStyle=`rgb(${sf[0]|0},${sf[1]|0},${sf[2]|0})`;ctx.fillRect(0,0,cv.width,cv.height);ctx.restore();
}
const BLURC=new WeakMap();
// versão desfocada de um canvas parado: reduz e amplia de volta com suavização (feito uma vez e guardado)
function blurOf(c,f){let b=BLURC.get(c);if(b)return b;f=f||(c.width>200?3:2.5);
  const t=document.createElement('canvas');t.width=Math.max(1,Math.round(c.width/f));t.height=Math.max(1,Math.round(c.height/f));const tg=t.getContext('2d');tg.imageSmoothingEnabled=true;tg.imageSmoothingQuality='high';tg.drawImage(c,0,0,t.width,t.height);
  b=document.createElement('canvas');b.width=c.width;b.height=c.height;const g=b.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(t,0,0,b.width,b.height);BLURC.set(c,b);return b;}
// quanto desfocar na altura de tela de um ponto do mundo
let DOF_S=1,DOF_OY=0,DOF_ON=false;
function dofW(wy){if(!DOF_ON)return 0;const d=Math.abs((wy*DOF_S+DOF_OY)/cv.height-FX.fy)-FX.band;if(d<=0)return 0;const u=Math.min(1,d/0.32);return u*u*(3-2*u)*FX.dof;}
// desenha nítido e, por cima, a versão desfocada na medida do peso (o nítido some só no fim, sem ficar transparente)
function drawB(img,x,y,w,dw,dh){
  if(dw===undefined){dw=img.width;dh=img.height;}
  if(w<0.02){ctx.drawImage(img,x,y,dw,dh);return;}
  const a=ctx.globalAlpha,sa=w<=0.5?1:1-(w-0.5)*1.8;
  if(sa>0.02){ctx.globalAlpha=a*sa;ctx.drawImage(img,x,y,dw,dh);}
  const sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=true;ctx.globalAlpha=a*w;ctx.drawImage(blurOf(img),x,y,dw,dh);ctx.imageSmoothingEnabled=sm;ctx.globalAlpha=a;
}
// chão desfocado nas faixas: a versão desfocada do chão (parada) é desenhada direto na tela, em tiras recortadas
// com opacidade crescente — nada é lido de volta nem passa por uma tela intermediária
function dofGround(s,ox,oy){
  if(!DOF_ON)return;const H0=cv.height,W0=cv.width,f=FX.fy,b=FX.band,r=0.32,a=FX.dof,BB=blurOf(BG,3),N=10;
  const strip=(y0,y1,al)=>{y0=Math.max(0,Math.floor(y0*H0));y1=Math.min(H0,Math.ceil(y1*H0));if(y1<=y0||al<0.02)return;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.beginPath();ctx.rect(0,y0,W0,y1-y0);ctx.clip();ctx.setTransform(s,0,0,s*K,ox,oy);ctx.globalAlpha=al;ctx.drawImage(BB,0,0);ctx.restore();};
  const sm=u=>u*u*(3-2*u);ctx.imageSmoothingEnabled=true;
  // em cima: parte toda desfocada e a transição em N tiras
  strip(0,f-b-r,a);for(let k=0;k<N;k++){const u0=k/N,u1=(k+1)/N;strip(f-b-r*u1,f-b-r*u0,a*sm((u0+u1)/2));}
  strip(f+b+r,1,a);for(let k=0;k<N;k++){const u0=k/N,u1=(k+1)/N;strip(f+b+r*u0,f+b+r*u1,a*sm((u0+u1)/2));}
  ctx.imageSmoothingEnabled=false;
}
// prepara as versões desfocadas aos poucos, sem travar quadros
const BLURQ=[];let blurPrimed=false;
function primeBlur(){
  if(!QHIGH())return;   // as versões desfocadas só existem para a profundidade de campo (alta)
  if(!blurPrimed){blurPrimed=true;if(FXMODE!=='2d'||POST)return;BLURQ.push(BG);for(const w of WALLROWS)if(w)BLURQ.push(w);for(const o of objs)if(o.spr)BLURQ.push(o.spr.c);for(const n of [P1,...NPCS])for(const f of framesFor(n))BLURQ.push(f);}
  const t0=performance.now();while(BLURQ.length&&performance.now()-t0<3)blurOf(BLURQ.shift());
}
/* ---------- Tela deitada ---------- */
function screenInsets(){
  const d=document.createElement('div');d.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(d);const c=getComputedStyle(d),r={t:parseFloat(c.paddingTop)||0,r:parseFloat(c.paddingRight)||0,b:parseFloat(c.paddingBottom)||0,l:parseFloat(c.paddingLeft)||0};d.remove();return r;
}
function setInsets(){
  const st=appEl.style;
  if(!ROT){['t','r','b','l'].forEach(k=>st.removeProperty('--s'+k));return;}
  const i=screenInsets(),top=Math.max(i.t,8),bot=Math.max(i.b,10);
  const m=ROT===90?{t:i.r,r:bot,b:i.l,l:top}:{t:i.l,r:top,b:i.r,l:bot};
  for(const k in m)st.setProperty('--s'+k,m[k]+'px');
}
let lastL=null;
function applyLayout(force){
  if(SW()>SH())ROT=0;else if(ROT===0&&!userVert)ROT=90;
  if(ROT){appEl.style.width=SH()+'px';appEl.style.height=SW()+'px';appEl.style.transform=ROT===90?'translateX('+SW()+'px) rotate(90deg)':'translateY('+SH()+'px) rotate(-90deg)';}
  else{appEl.style.width='';appEl.style.height='';appEl.style.transform='';}
  document.body.classList.toggle('rot',!!ROT);setInsets();
  const L=VW()>VH();document.body.classList.toggle('land',L);document.body.classList.toggle('narrow',VW()<560);document.body.classList.toggle('tiny',VW()<400);document.body.classList.toggle('short',VH()<720);document.body.classList.toggle('low',VH()<420);
  $('#rot').hidden=SW()>SH();
  dpr=Math.min(window.devicePixelRatio||1,QLOW()?2:3);sizeCanvas();
  const ht=$('.hud');HUDT=ht?ht.offsetTop+ht.offsetHeight+4:58;
  fitCard();
  if(force||L!==lastL){lastL=L;fitView();}else clampCam();
}
function fitCard(){
  const m=$('#intro');if(m.hidden)return;const c=m.querySelector('.card');c.style.transform='';
  const cs=getComputedStyle(m),avH=m.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),avW=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  const k=Math.min(1,avH/c.offsetHeight,avW/c.offsetWidth);if(k<1)c.style.transform=`scale(${k.toFixed(3)})`;
}
$('#b-set').addEventListener('click',()=>openSettings(appEl));
$('#b-view').addEventListener('click',()=>{if(SCENE==='rua')streetView().toggleOverview();});
$('#rot').addEventListener('click',()=>{ROT=ROT===0?90:ROT===90?-90:0;userVert=(ROT===0);lastL=null;applyLayout(true);});
addEventListener('resize',()=>applyLayout(false));

newGame();initArt();buildVisitors();applyLayout(true);cam.x=16*T;cam.y=15*TH;clampCam();
setTimeout(()=>{framesHDFor(P1);for(const n of NPCS)framesHDFor(n);},300);
// Versão nova do jogo: o modo offline (vite-plugin-pwa, autoUpdate) abre a cópia guardada e baixa a nova em segundo
// plano; quando ela assume a página, a base ainda estaria rodando a antiga. Se o jogador ainda não entrou na base,
// recarrega na hora para abrir já a nova; com o jogo em andamento, avisa que ela entra na próxima vez que abrir.
if('serviceWorker' in navigator){
  const hadCtl=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!hadCtl||safe(()=>sessionStorage.getItem('base.swReload'),null))return;
    if(!started){safe(()=>sessionStorage.setItem('base.swReload','1'));location.reload();}
    else toast('Arquivo Morto','Há uma versão nova do jogo. Ela entra na próxima vez que você abrir.');
  });
  addEventListener('load',()=>{navigator.serviceWorker.getRegistration().then(r=>r&&r.update()).catch(()=>{});setTimeout(()=>safe(()=>sessionStorage.removeItem('base.swReload')),15000);});
}
$('#b-start').addEventListener('click',()=>{
  AMB.unlock();AMB.setRain(NIGHT);AMB.setScene(SCENE==='rua'?'rua':'base');
  $('#intro').hidden=true;started=true;setTimeout(()=>loadDepo().catch(()=>{}),4000);setTimeout(()=>loadPrep().then(m=>m.background()).catch(()=>{}),3000);
  // voltou de uma recarga feita para pegar a versão nova: reabre o que o jogador tinha pedido
  const reopen=safe(()=>sessionStorage.getItem('base.reopen'),null);
  if(reopen){safe(()=>sessionStorage.removeItem('base.reopen'));enterBase(true);setTimeout(()=>reopen==='board'?startBoard():startDepo(reopen.slice(5)),500);}
  else if(NIGHT){enterBase(true);P1.x=19;P1.y=5;P1.path=[];cam.x=P1.x*T+16;cam.y=P1.y*TH;clampCam();}
  else{street().place('carro');setWhere('Rua do DHPP');}
  setTimeout(()=>NIGHT?toast('Sônia Prado',briefed()?'Lemos, a casa. A PM está te esperando.':'Lemos, na minha sala. Chegou um caso.',{img:'/sonia.jpg',col:'#c9a24a'})
    :toast('Sônia Prado','Lemos, na minha sala. A equipe já está com o material da casa.',{img:'/sonia.jpg',col:'#c9a24a'}),1200);
});
window.__base={amb:()=>AMB.ambientState(),badge:()=>BADGE,refreshCase:()=>refreshCase(),hud:()=>HUD,get BG(){return BG;},get scene(){return SCENE;},setScene:s=>{if(s==='base')enterBase(true);else{SCENE='rua';street().place('porta');}},street:()=>street(),startDepo,startBoard,get CASE(){return CASE;},VIS:()=>VIS,get P1(){return P1;},NPCS:()=>NPCS,cam,goTalk,goTile,openTalk,openGallery,FOUND,get started(){return started;},objs:()=>objs,tap,idx,W,H,T,TH,ti,passable,zoomTo,get ROT(){return ROT;},get LODV(){return LODV;},get FITZ(){return FITZ;},get GL(){return !!POST;},prof:()=>({r2d:+PROF.r2d.toFixed(2),post:+FX.ms.toFixed(2),frame:+frameMs.toFixed(2),RS})};
requestAnimationFrame(loop);
})();
