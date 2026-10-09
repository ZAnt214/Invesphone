/* Base do DHPP: cena 2D navegável do Caso 01, na mesma técnica da Varredura das Acácias
   (pixel art procedural, câmera oblíqua, luz multiplicada por sala, detalhe por zoom, tela deitada).
   Lemos anda, a equipe fala, o aparelho leva ao resto do caso. */
import { applyRequest, applyTopic, caseTeam, requestOk, teamDialogues, teamMaterialRequests, teamNews, topicOk } from '../team/teamData';
import { readCase, writeCase } from '../case/caseSave';
import { depoPeople, summon } from '../case/depositions';
(() => {
'use strict';
const T=32,TH=22,K=TH/T,RISE=16,CAPH=8,W=34,H=26,N=W*H;
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

/* ---------- Mapa ---------- */
const F={GRASS:0,STREET:1,WALK:2,CONC:3,WALL:6,DOOR:8,WIN:9,FLOOR:4};
const ROOM_NAME={sonia:'Sala da delegada',equipe:'Sala da equipe',pericia:'Perícia',interro:'Sala de depoimentos',hall:'Recepção',arquivo:'Arquivo Morto',fora:'Pátio do DHPP',wall:'Corredor'};
const ROOM_RECT={sonia:[2,2,9,8],equipe:[11,2,21,8],pericia:[23,2,31,8],interro:[2,10,9,17],hall:[11,10,21,17],arquivo:[23,10,31,17]};
let floor,room,occ,hot,blk,objs;
function buildMap(){
  floor=new Array(N).fill(F.GRASS);room=new Array(N).fill('fora');occ=new Array(N).fill(-1);hot=new Array(N).fill(null);blk=new Array(N).fill(false);objs=[];
  const set=(x0,y0,x1,y1,f,r)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);if(f!=null)floor[i]=f;if(r!==undefined)room[i]=r;}};
  const block=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)blk[idx(x,y)]=true;};
  set(0,19,W-1,20,F.CONC,'fora');set(0,21,W-1,22,F.WALK,'fora');set(0,23,W-1,25,F.STREET,'fora');block(0,23,W-1,25);
  set(0,0,W-1,18,F.GRASS,'fora');block(0,0,W-1,0);block(0,1,0,18);block(W-1,1,W-1,18);
  set(1,1,32,18,F.WALL,'wall');
  for(const r in ROOM_RECT){const [a,b,c,d]=ROOM_RECT[r];set(a,b,c,d,F.FLOOR,r);}
  // as linhas coladas à parede sul ficam atrás dela: não se anda ali
  block(2,8,14,8);block(17,8,31,8);block(2,17,14,17);block(17,17,31,17);
  for(const [x,y,r] of [[10,5,'equipe'],[22,5,'equipe'],[10,14,'hall'],[22,14,'hall']]){floor[idx(x,y)]=F.DOOR;room[idx(x,y)]=r;}
  for(const x of [15,16]){set(x,9,x,9,F.FLOOR,'hall');set(x,18,x,18,F.DOOR,'hall');}
  for(const [x,y] of [[4,1],[5,1],[13,1],[19,1],[25,1],[29,1],[4,18],[5,18],[9,18],[12,18],[19,18],[22,18],[26,18],[29,18]])floor[idx(x,y)]=F.WIN;
  const add=(t,x,y,w,h,o)=>{const k=objs.length;objs.push(Object.assign({t,x,y,w,h},o||{}));for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){if(!(o&&o.nocc))occ[idx(xx,yy)]=k;if(o&&o.hot)hot[idx(xx,yy)]=o.hot;}return k;};
  // sala da delegada
  add('execchair',5,3,1,1,{nocc:true});add('deskboss',4,4,3,1,{hot:'sonia_mesa',nomark:true});add('cadeira',4,6,1,1);add('cadeira',6,6,1,1);add('shelf',7,2,2,1,{v:'books'});add('filing',2,2,1,1);add('plant',9,6,1,1,{v:'tall'});add('plant',2,6,1,1);
  // sala da equipe
  add('chair',13,3,1,1,{nocc:true});add('chair',17,3,1,1,{nocc:true});add('chair',20,3,1,1,{nocc:true});
  add('desk',12,4,2,1,{v:'renata'});add('desk',16,4,2,1,{v:'denise'});add('desk',19,4,2,1,{v:'lemos',hot:'mesa_lemos'});
  add('board',14,6,3,1,{hot:'quadro'});add('coffee',20,6,1,1);add('xerox',12,6,1,1);add('filing',11,2,1,1);add('plant',21,2,1,1,{v:'tall'});add('plant',18,7,1,1);
  // perícia
  add('stool',25,3,1,1,{nocc:true});add('bench',24,4,4,1);add('lightbox',28,6,3,1,{hot:'fotos'});add('locker',30,2,1,1);add('locker',31,2,1,1);add('bagtable',24,6,2,1);add('plant',23,7,1,1);
  // recepção
  add('chair',14,11,1,1,{nocc:true});add('counter',12,12,5,1);add('wetsign',20,14,1,1);add('sofa',18,15,3,1);add('cooler',21,11,1,1);add('plant',11,16,1,1,{v:'tall'});add('plant',21,16,1,1,{v:'tall'});add('plant',13,15,1,1);
  // sala de depoimentos
  add('metalchair',3,13,1,1);add('metalchair',7,13,1,1);add('itable',4,12,3,2,{hot:'interro'});add('filing',2,15,1,1);
  // arquivo
  add('shelf',24,11,3,1,{v:'arq'});add('shelf',28,11,3,1,{v:'arq'});add('shelf',24,14,3,1,{v:'arq'});add('shelf',28,14,3,1,{v:'arq',hot:'arquivo'});add('boxes',23,16,1,1);add('boxes',30,16,1,1);add('boxes',31,16,1,1);
  // pátio
  add('car',4,19,2,3);add('tree',1,19,1,1);add('tree',31,19,1,1);add('tree',9,20,1,1);add('flag',12,19,1,1,{v:'br'});add('flag',19,19,1,1,{v:'dh'});add('tree',24,20,1,1);
  for(let x=0;x<W;x+=3)if(x>1&&x<32&&x%9!==0)add('tree',x,0,1,1,{far:true});
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
function CRTfront(P,x,y,scr){ // monitor de tubo de frente
  P(x,y,22,19,'#d8d0bc');P(x,y,22,2,'#ece6d4');P(x+20,y+2,2,17,'#b8af98');
  P(x+3,y+3,16,12,'#1b2a24');P(x+4,y+4,14,10,scr||'#22394a');P(x+4,y+4,5,2,'rgba(255,255,255,.18)');
  P(x+17,y+16,2,1,'#54e07a');P(x+6,y+19,10,2,'#c9c1ab');P(x+4,y+21,14,1,'#a89f88');
}
const FACT={
  desk(o){return [26,(P,E,g,t,fw,fh,B)=>{
    const ty=t,v=o.v,wood='#a77b50';
    if(v!=='lemos')CRTback(P,3,ty-21);else CRTfront(P,3,ty-21,'#16241e');
    // tampo
    P(0,ty,fw,7,wood);P(0,ty,fw,1,'#c39368');P(0,ty+6,fw,1,'#7e5838');for(let x=4;x<fw;x+=11)P(x,ty+2,6,1,'#b28558');
    // coisas da mesa
    if(v==='renata'){for(let k=0;k<3;k++){P(34+k*5,ty-11,4,11,['#264653','#2f5a7a','#7a2f2f'][k]);P(34+k*5,ty-11,4,1,'rgba(255,255,255,.25)');P(35+k*5,ty-7,2,3,'#f1ece0');}P(50,ty-4,8,5,'#f1ece0');P(51,ty-3,6,1,'#999');}
    if(v==='denise'){P(30,ty-8,13,8,'#ece6d6');for(let k=0;k<4;k++)P(30,ty-8+k*2,13,1,'#d6cfbd');P(46,ty-5,11,5,'#2b2b2e');P(47,ty-4,4,3,'#555');P(52,ty-4,4,3,'#555');P(48,ty-3,1,1,'#ff5a4a');}
    if(v==='lemos'){P(28,ty+1,15,5,'#c9a24a');P(29,ty+1,13,1,'#e6c673');P(31,ty+3,8,1,'#6b5320');P(50,ty-6,6,7,'#f3efe4');P(56,ty-4,2,3,'#f3efe4');P(50,ty-6,6,1,'#4a2a18');}
    P(fw-13,ty-3,9,4,'#2d2d30');P(fw-12,ty-4,7,2,'#3a3a3e');P(fw-11,ty-5,5,1,'#2d2d30');
    // frente: painel e gaveteiro
    P(0,ty+7,fw,B-ty-7,'#7a5434');P(0,ty+7,fw,1,'#5a3c24');P(2,ty+9,3,B-ty-11,'#6a4a2e');
    P(fw-24,ty+8,22,B-ty-10,'#8a6040');P(fw-24,ty+8,22,1,'#a07450');for(let k=0;k<2;k++){P(fw-24,ty+14+k*6,22,1,'#5a3c24');P(fw-16,ty+10+k*6,6,1,'#d4af37');}
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
  cadeira(){return [8,(P,E,g,t,fw,fh,B)=>{P(6,0,20,16,'#4a3428');P(6,0,20,2,'#6a4a3a');for(const x of [10,16,22])P(x,5,1,1,'#2e1e16');P(8,9,16,1,'#3a2820');P(4,14,24,6,'#5a4030');P(4,14,24,1,'#7a5848');P(4,20,24,2,'#3a2820');P(6,22,2,6,'#2a1812');P(24,22,2,6,'#2a1812');}];},
  metalchair(){return [8,(P,E,g,t,fw,fh,B)=>{P(8,0,16,2,'#8a9298');P(8,0,2,16,'#8a9298');P(22,0,2,16,'#8a9298');P(10,3,12,8,'#6a7076');P(6,14,20,4,'#7d858b');P(6,14,20,1,'#a9b1b6');P(7,18,2,10,'#6a7076');P(23,18,2,10,'#6a7076');}];},
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
    P(6,B-14,3,14,'#5a4630');P(fw-9,B-14,3,14,'#5a4630');P(4,B-2,7,2,'#3a2a1c');P(fw-11,B-2,7,2,'#3a2a1c');
    P(0,2,fw,B-14,'#5a3c24');P(0,2,fw,2,'#7a5434');P(3,5,fw-6,B-20,'#b0814f');
    for(let k=0;k<70;k++)P(4+Math.floor(hash(k,1,o.x)*(fw-8)),6+Math.floor(hash(k,2,o.x)*(B-22)),1,1,hash(k,3,o.x)<0.5?'#9a6e3e':'#c4945e');
    P(6,7,22,6,'#f6efc9');P(7,9,18,1,'#7a6a4a');P(fw-30,8,24,16,'#e8e4da');for(let k=0;k<4;k++)P(fw-28,10+k*3,20,1,['#9cc0d8','#c9a24a','#9cc0d8','#7aa86a'][k]);
    const ph=[[8,16,'#6f8aa0'],[26,14,'#a0856f'],[44,17,'#7a8f6e'],[60,15,'#9a7a8a'],[78,19,'#8a8f96'],[18,30,'#8a7a6a'],[52,30,'#6a7a8a']];
    const pins=[];
    ph.forEach(([x,y,c],k)=>{if(x>fw-14)return;P(x,y,13,15,'#f1ece0');P(x+1,y+1,11,10,c);P(x+1,y+1,11,3,lt(c,.2));P(x+3,y+12,7,1,'#777');const red=k<FOUND.length;P(x+5,y-1,3,3,red?'#d6382c':'#3b6aa8');pins.push([x+6,y]);});
    g.strokeStyle='#c0392b';g.lineWidth=1;g.beginPath();pins.slice(0,Math.max(2,FOUND.length)).forEach(([x,y],k)=>k?g.lineTo(x+.5,y+.5):g.moveTo(x+.5,y+.5));g.stroke();
    P(34,B-26,16,8,'#f6efc9');P(36,B-24,12,1,'#777');P(36,B-21,8,1,'#777');
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
    P(0,ty+7,fw,B-ty-7,'#6a757c');for(let x=2;x<fw-2;x+=31){P(x,ty+9,29,B-ty-12,'#5a646b');P(x,ty+9,29,1,'#7d878e');P(x+12,ty+13,6,1,'#c9ccce');}
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
  livia:{skin:'#e8b58e',hair:'#7a4a2a',style:'bun',kind:'civil',top:'#26282c',pants:'#2b2f36',shoes:'#e8e4da'},
  caio:{skin:'#d9a273',hair:'#3a2416',style:'curly',kind:'civil',top:'#1e1f22',pants:'#3b4a6a',shoes:'#e8e4da'},
  teo:{skin:'#c98e64',hair:'#2a1d18',style:'short',kind:'civil',top:'#1c1d20',pants:'#2b2f36',shoes:'#222'},
  rafael:{skin:'#d9a273',hair:'#2a1d18',style:'curly',kind:'civil',top:'#25272b',pants:'#3b5a8a',shoes:'#e8e4da'},
  cida:{skin:'#c98e64',hair:'#4a3a30',style:'bun',kind:'civil',top:'#6a2230',pants:'#3a3030',shoes:'#222'},
  jorge:{skin:'#8a5a3a',hair:'#9a9a9a',style:'grey',kind:'civil',top:'#2b2f2a',pants:'#3a3a32',shoes:'#222'},
  faxina:{skin:'#a8714a',hair:'#1f1a18',style:'curly',kind:'apoio',top:'#5a8aa8',pants:'#3a4a5a',shoes:'#e8e8e8'}
};
function personFrames(L){
  const sh=c=>rgbs(mul(hex(c),0.78)),hi=c=>rgbs(mix(hex(c),[255,255,255],0.18));
  const frames=[];
  for(let f=0;f<5;f++){
    const c=S2(26,46,(P,E)=>{
      const cr=f===4?4:0;const lp=f===1?1:f===3?-1:0;
      if(f===4){P(7,36,6,4,L.pants);P(14,37,6,3,L.pants);P(6,40,7,3,L.shoes);P(15,40,6,3,L.shoes);}
      else{P(8,31,5,10+lp,L.pants);P(14,31,5,10-lp,L.pants);P(13,31,1,4,sh(L.pants));P(10,32,1,7+lp,lt(L.pants,.08));P(16,32,1,7-lp,lt(L.pants,.08));P(7+(lp>0?-1:0),41+lp,6,3,L.shoes);P(14+(lp<0?1:0),41-lp,6,3,L.shoes);P(8+(lp>0?-1:0),41+lp,2,1,lt(L.shoes,.35));P(15+(lp<0?1:0),41-lp,2,1,lt(L.shoes,.35));}
      const ty=18+cr;P(7,ty,12,13,L.top);P(7,ty,2,13,hi(L.top));P(17,ty,2,13,sh(L.top));P(7,ty+12,12,1,sh(L.pants));P(7,ty+11,12,1,'#1a1816');P(12,ty+11,2,1,'#a89878');
      if(L.kind==='civil'){P(11,ty,4,3,'#e8e4da');if(L.tie){P(12,ty+1,2,9,L.tie);P(12,ty+1,1,1,lt(L.tie,.35));}P(10,ty+1,1,6,sh(L.top));P(15,ty+1,1,6,sh(L.top));P(9,ty+7,1,1,sh(L.top));P(16,ty+7,1,1,sh(L.top));if(L.badge){P(8,ty+8,3,3,'#d4af37');P(8,ty+8,1,1,'#fff3b0');}}
      if(L.kind==='lab'){P(12,ty,2,13,'#c9c9c0');P(8,ty+8,3,3,'#d4d4cc');P(7,ty+12,12,1,'#b9b9b0');}
      if(L.kind==='campo'){P(11,ty+1,4,10,'#cfc8b8');P(8,ty+8,2,2,'#d4af37');}
      if(L.kind==='pm'){P(5,ty,2,3,'#c0392b');P(17,ty+7,2,5,'#111');P(8,ty+2,2,1,'#d4af37');P(7,ty+11,12,2,'#23262b');}
      const as=f===1?1:f===3?-1:0;const hand=L.gloves?'#f2f2f2':L.skin;
      if(f===4){P(5,ty+3,2,7,L.top);P(19,ty+3,2,7,L.top);P(7,ty+9,2,2,hand);P(17,ty+9,2,2,hand);}
      else{P(5,ty+1+as,2,9,hi(L.top));P(19,ty+1-as,2,9,sh(L.top));P(5,ty+10+as,2,2,hand);P(19,ty+10-as,2,2,hand);}
      const hy=3+cr;P(11,hy+12,4,3,sh(L.skin));P(7,hy+1,12,11,L.skin);P(8,hy,10,13,L.skin);P(17,hy+1,2,11,sh(L.skin));
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
    });
    frames.push(outlined(refine(c,3)));
  }
  return frames;
}
function personFramesHD(L,base){
  return base.map((fr,f)=>{
    const c=document.createElement('canvas');c.width=fr.width*2;c.height=fr.height*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(fr,0,0,c.width,c.height);
    const H=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round((x+1)*2),Math.round((y+1)*2),Math.max(1,Math.round(w*2)),Math.max(1,Math.round(h*2)));};
    const cr=f===4?4:0,hy=3+cr,ty=18+cr,sk=hex(L.skin),skin=L.skin,sh=rgbs(mul(sk,0.82)),dkk=rgbs(mul(sk,0.62));
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
    switch(L.kind){
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
  if(f===F.GRASS)return 'grass';if(f===F.STREET)return 'street';if(f===F.WALK)return 'walk';if(f===F.CONC)return 'conc';if(f===F.WALL||f===F.WIN)return 'dark';
  return {sonia:'wood',equipe:'carpet',pericia:'lab',interro:'vinyl',hall:'checker',arquivo:'conc2'}[r]||'conc';
}
function wallIdx(x,y){if(x<0||y<0||x>=W||y>=H)return false;const f=floor[idx(x,y)];return f===F.WALL||f===F.WIN;}
function groundPx(wx,wy){
  const tx=wx>>5,ty=wy>>5,i=idx(tx,ty),st=floorStyle(i),lx=wx&31,ly=wy&31,n=hash(wx,wy,5),n2=vn(wx/5,wy/5,9);
  let c;
  switch(st){
    case 'grass':{c=mix(C.g1,C.g2,n2);c=mul(c,0.9+n*0.18);if(hash(wx>>1,wy>>1,3)>0.93)c=mix(c,C.g3,.5);const fl=hash(wx>>1,wy>>1,41);if(fl>0.996)c=hex(fl>0.998?'#f2efe0':'#e8c63a');else if(vn(wx/9,wy/9,12)>0.78)c=mul(c,0.9);return c;}
    case 'street':{c=mul(C.a0,0.88+n*0.16+n2*0.06);const pt=vn(wx/22,wy/22,31);if(pt>0.74)c=mul(c,0.86);if(pt>0.735&&pt<0.745)c=mul(c,0.7);
      if(ty===24&&ly>=14&&ly<=16&&(wx%64)<36)c=mix(hex('#d9b84a'),c,hash(wx,wy,77)>0.86?0.5:0);if(hash(wx>>2,wy>>2,8)>0.985)c=mul(c,0.7);
      if(ty===23&&ly<5){c=mul(c,0.82+ly*0.03);const bx=wx%(9*T);if(bx>=40&&bx<64){c=ly<1?hex('#2a2c30'):((wx&3)===0?hex('#141518'):hex('#3e4146'));}}
      return c;}
    case 'walk':{
      if(ty===22&&ly>=27){c=mul(hex('#d2cdbf'),0.95+n*0.08);if(ly===27)c=mul(c,1.08);if(ly===31)c=mul(c,0.78);return c;}
      c=mul(hex('#b4afa1'),0.93+n*0.1+n2*0.05+(hash(wx>>5,wy>>5,63)-0.5)*0.06);if(lx===0||ly===0)c=mul(c,0.82);else if(lx===1||ly===1)c=mul(c,1.04);
      if(hash(wx>>1,wy>>1,64)>0.992)c=mul(c,0.86);const cr=Math.abs(ly-16-Math.sin(lx/5+(wx>>5))*4);const ch=hash(wx>>5,wy>>5,65);if(ch>0.9&&cr<0.6&&Math.abs(lx-(ch-0.9)*200)<7)c=mul(c,0.8);
      if(ty===21&&ly<2)c=mul(c,0.8);return c;}
    case 'conc':{c=mul(hex('#a9a89e'),0.92+n*0.1+n2*0.07);const st2=vn(wx/14,wy/14,51);if(st2>0.76)c=mul(c,0.9);if((wx&63)===0||(wy&63)===0)c=mul(c,0.8);
      const cr=Math.abs(wy-(19*T+20+Math.sin(wx/11)*5+Math.sin(wx/4)*1.5));if(wx>20*T&&wx<27*T&&cr<0.8)c=mul(c,0.62);
      if(ty===19&&ly<4)c=mul(c,0.7+ly*0.07);return c;}
    case 'dark':return mul(hex('#2a2520'),0.8+n*0.2);
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
  for(const o of objs){if(o.far||o.t==='flag')continue;const x=o.x*T,y=o.y*T,w2=o.w*T,h2=o.h*T;
    for(let k=4;k>=1;k--){g.fillStyle=`rgba(0,0,0,${0.05})`;g.fillRect(x-k+2,y+h2*0.35-k,w2+k*2-4,h2*0.75+k*2);}
    g.fillStyle='rgba(0,0,0,.10)';g.fillRect(x+2,y+h2-6,w2-4,6);}
  return c;
}

/* ---------- Arte: paredes ---------- */
const FACE={sonia:['#cdbd9d','#b9a885'],equipe:['#c8cfd3','#b3bbc0'],pericia:['#dfe6e6','#c7d0d0'],interro:['#6b7075','#5a5f64'],hall:['#d8d0b8','#c4bca2'],arquivo:['#9a9a90','#86867c'],wall:['#b9b1a0','#a39b8a'],fora:['#b9a58a','#a58f72']};
const BASE={sonia:'#6b4a2e',equipe:'#59616a',pericia:'#8a9496',interro:'#383c40',hall:'#8a7a5a',arquivo:'#6a6a62',wall:'#6b5a46',fora:'#7a6a52'};
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
        if(rm==='fora'){for(let yy=fy+4;yy<fb-6;yy+=6)P(X,yy,T,1,'rgba(90,70,45,.22)');for(let yy=fy+4;yy<fb-6;yy+=12)P(X+((yy>>2)%2?8:24),yy,1,6,'rgba(90,70,45,.18)');}
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
  {id:'sonia',name:'Sônia Prado',role:'Delegada · DHPP',look:'sonia',x:5,y:3,sit:true,ini:'SP',col:'#c9a24a',act:'write',lines:['Hm.','Assina aqui, depois.','Café, alguém?']},
  {id:'renata',name:'Renata Leal',role:'Investigadora',look:'renata',x:13,y:3,sit:true,ini:'RL',col:'#7fc9b6',act:'type',lines:['Cruzando registro.','Cadê a minha caneta?','Isso aqui é coincidência.']},
  {id:'denise',name:'Denise Rocha',role:'Escrivã',look:'denise',x:17,y:3,sit:true,ini:'DR',col:'#c9a7d9',act:'type',lines:['Fita nova no gravador.','Folha 2 de 3.']},
  {id:'paulo',name:'Paulo Vieira',role:'Investigador de campo',look:'paulo',x:19,y:6,ini:'PV',col:'#d6b27a',walk:[[19,6],[16,7],[18,2]],lines:['Café requentado de novo.','A rua acordou cedo.','Vou pegar o carro já já.']},
  {id:'mauricio',name:'Maurício Farias',role:'Perito criminal',look:'mauricio',x:25,y:3,sit:true,ini:'MF',col:'#9fb7c9',act:'type',walk:[[25,3],[27,5]],lines:['Luva nova.','Etiqueta, lacre, assinatura.','Foto 14, refaz.']},
  {id:'faxina',name:'Limpeza',role:'Equipe de apoio',look:'faxina',x:13,y:15,ini:'LP',col:'#8fb0c8',mop:true,walk:[[13,15],[19,13],[17,16],[12,14],[18,12]],lines:['Cuidado, tá molhado.','Bom dia, doutor.','Esse café mancha tudo.']},
  {id:'plantao',name:'Plantão',role:'Recepção · DHPP',look:'plantao',x:14,y:11,sit:true,ini:'PL',col:'#a9b8c6',act:'write',lines:['DHPP, bom dia.','Um momento, por favor.','Sem comentários.']}
];
let BG=null,WALLROWS=null,SIGN=null,DOORSPR=null,SHADOW=null,LAMP=null;
let P1,NPCS=[],frame=0,started=false,follow=true,talkOpen=false;
let SEEN=safe(()=>JSON.parse(localStorage.getItem('base.seen')||'{}'),{});
const cam={x:16*T,y:15*TH,z:1};
let gameMin=8*60+10,lastClock=0;
function newGame(){
  buildMap();
  P1={id:'lemos',x:16,y:20,path:[],dir:1,walk:0,moving:false,look:LOOK.lemos,pend:null};
  NPCS=NPCDEF.map((d,k)=>({...d,k,dir:d.id==='paulo'?-1:1,path:[],walk:0,moving:false,timer:120+Math.floor(Math.random()*200),wp:0,hold:false,say:null,sayT:600+Math.floor(Math.random()*900)}));
}
function framesFor(p){if(!p.frames)p.frames=personFrames(p.look||LOOK[p.lookId]);return p.frames;}
function framesHDFor(p){if(!p.framesHD)p.framesHD=personFramesHD(p.look,framesFor(p));return p.framesHD;}
function initArt(){
  for(const o of objs)o.spr=makeSprite(o);
  BG=buildGround();WALLROWS=buildWalls();SIGN=buildSign();DOORSPR=buildDoor();LAMP=buildLamp();
  SHADOW=S2(22,8,(P,E)=>{E(11,4,10,3.5,'rgba(0,0,0,.30)');E(11,4,7,2.5,'rgba(0,0,0,.18)');});
  for(const n of NPCS)n.look=LOOK[n.look];
}
const npcAtTile=i=>NPCS.some(n=>ti(n)===i||(n.path.length&&n.path[0]===i));
const walkPass=i=>passable(i)&&!npcAtTile(i);
function roomOf(a){return room[ti(a)];}

/* ---------- Conversas ---------- */
const OPEN_PHONE={t:'Abrir o aparelho',s:'Invesphone',href:'/invesphone',main:true};
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
  const seats=[[7,13,-1],[18,15,1],[19,15,1],[20,15,-1],[17,16,1]];
  VIS=wait.slice(0,seats.length).map((p,k)=>{const v=VFR[p.id]||(VFR[p.id]={id:p.id,name:p.first,look:LOOK[p.id]||LOOK.lemos,walk:0,moving:false});return Object.assign(v,{x:seats[k][0],y:seats[k][1],dir:seats[k][2]});});
}
let depoOpen=false;
// o depoimento (React, retratos, perguntas) é carregado à parte: baixa sozinho alguns segundos depois de entrar na base
let depoMod=null;const loadDepo=()=>depoMod||(depoMod=import('./deposition'));
function startDepo(id){
  if(talk)closeTalk();
  depoOpen=true;const host=$('#depo');host.hidden=false;document.body.classList.add('depo-on');
  // a base fica escondida atrás do depoimento: libera a memória das telas dela (no iPhone, faltar memória recarrega a página)
  cv.width=cv.height=1;lc.width=lc.height=1;
  loadDepo().then(m=>m.openDeposition(host,id,()=>{host.hidden=true;depoOpen=false;document.body.classList.remove('depo-on');sizeCanvas();refreshCase();buildVisitors();last=performance.now();}));
}
const DLG={
  sonia:()=>teamTalk('sonia'),mauricio:()=>teamTalk('mauricio'),renata:()=>teamTalk('renata'),paulo:()=>teamTalk('paulo'),denise:()=>teamTalk('denise'),
  sonia_mesa:()=>({who:'Mesa da delegada',role:'Sala de Sônia Prado',av:'icon',pages:['Pasta aberta, telefone fora do gancho pela metade, xícara vazia. Nada aqui é para você mexer sem ela dizer.'],opts:[]}),
  plantao:()=>({who:'Plantão',role:'Recepção · DHPP',av:'plantao',pages:['A imprensa ligou duas vezes. Respondi o que a delegada mandou: sem comentários.','Se alguém procurar a equipe, passa por mim primeiro.'],opts:[]}),
  mesa_lemos:()=>({who:'Sua mesa',role:'Lemos · DHPP',av:'icon',pages:['Café frio e a pasta do Caso 01 ainda fechada. O que importa está no aparelho.'],opts:[OPEN_PHONE]}),
  quadro:()=>{
    if(!FOUND.length)return {who:'Quadro do caso',role:'Sala da equipe',av:'icon',pages:['Caso 01 · Rua das Acácias. O quadro está quase vazio: a varredura da casa ainda não deixou nada aqui.'],opts:[{t:'Voltar à casa',s:'Varredura',href:'/'}]};
    return {who:'Quadro do caso',role:'Caso 01 · Rua das Acácias',av:'icon',
      pages:['Casal Valença, vítimas. Rua das Acácias. Em vermelho, o que a varredura trouxe:',FOUND.map(id=>'• '+CLUES[id].title+': '+CLUES[id].desc).join('\n'),FOUND.length>=7?'Roubo comum não explica a cena.':'Faltam achados na casa. O quadro só mostra o que foi visto.'],
      opts:[{t:'Ver as fotos',s:`${FOUND.length} de 7`,fn:()=>openGallery(0)}]};},
  fotos:()=>FOUND.length?{who:'Mesa de luz',role:'Perícia',av:'icon',pages:['Fotografias periciais da casa, reveladas e penduradas para análise.'],opts:[{t:'Ver as fotos',s:`${FOUND.length} de 7`,fn:()=>openGallery(0),main:true}]}
    :{who:'Mesa de luz',role:'Perícia',av:'icon',pages:['A mesa de luz está apagada. Nenhuma foto da casa chegou ainda.'],opts:[{t:'Voltar à casa',s:'Varredura',href:'/'}]},
  interro:()=>interroTalk(),
  arquivo:()=>({who:'Arquivo Morto',role:'Caixas e prateleiras',av:'icon',
    pages:['Caixas de casos que ninguém fechou, com o nome escrito a lápis na lateral. Todo caso daqui começou parecendo simples.','O de hoje ainda cabe numa gaveta. Ver o que já foi guardado dele é pelo aparelho.'],opts:[{t:'Abrir o aparelho',s:'Arquivo',href:'/invesphone',main:true}]})
};
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
  const def=DLG[id];if(!def)return;
  refreshCase();
  setSeen(id);talkOpen=true;document.body.classList.add('talking');
  const n=NPCS.find(x=>x.id===id);if(n){n.hold=true;n.path=[];n.moving=false;n.say=null;n.dir=P1.x<n.x?-1:1;}
  if(n&&Math.abs(P1.x-n.x)>0.3)P1.dir=n.x>P1.x?1:-1;
  talk={id};talkSet(def());
  $('#talk').hidden=false;
  talkPrevZ=cam.z;follow=true;zoomTo(Math.max(cam.z,TALKZ()));
}
function talkSet(d){if(!talk)return;talk.d=d;talk.page=0;showPage();}
function speaker(pg){
  const d=talk.d,me=pg&&pg.me,n=NPCS.find(x=>x.id===talk.id),av=$('#tk-av');
  if(me){av.style.background='#d9a273';av.innerHTML='LM';$('#tk-who').textContent='Lemos';$('#tk-role').textContent='Você';}
  else{av.style.background=n?n.col:'#96a7ae';av.innerHTML=avatarHTML(d.av);$('#tk-who').textContent=d.who;$('#tk-role').textContent=d.role;}
  $('#talk').classList.toggle('me',!!me);
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
  clearInterval(tkTimer);if(talk){const n=NPCS.find(x=>x.id===talk.id);if(n)n.hold=false;}
  talk=null;talkOpen=false;document.body.classList.remove('talking');$('#talk').hidden=true;$('#talk').classList.remove('me');follow=true;
  if(talkPrevZ!=null){zoomTo(talkPrevZ);talkPrevZ=null;}
}
$('#tk-x').addEventListener('click',e=>{e.stopPropagation();closeTalk();});
$('#talk').addEventListener('click',advance);

/* ---------- Fotos ---------- */
let galI=0,GAL=[];
function openGallery(list,i){
  if(typeof list==='number'){i=list;list=FOUND.map(id=>({title:CLUES[id].title,img:CLUES[id].img,cap:'Fotografia pericial · '+CLUES[id].room}));}
  if(!list.length)return;GAL=list;galI=clamp(i||0,0,list.length-1);const c=GAL[galI];
  $('#g-img').src=c.img;$('#g-title').textContent=c.title;$('#g-cap').textContent=c.cap||'';$('#g-n').textContent=`${galI+1} / ${GAL.length}`;
  $('#g-prev').hidden=$('#g-next').hidden=GAL.length<2;
  $('#g-pic').classList.remove('z');$('#gal').hidden=false;galOpen=true;
}
let galOpen=false;
$('#g-x').addEventListener('click',()=>{$('#gal').hidden=true;galOpen=false;});
$('#g-prev').addEventListener('click',()=>openGallery(GAL,(galI+GAL.length-1)%GAL.length));
$('#g-next').addEventListener('click',()=>openGallery(GAL,(galI+1)%GAL.length));
$('#g-img').addEventListener('click',()=>$('#g-pic').classList.toggle('z'));

/* ---------- Toques e movimento ---------- */
let toastT=0;
function toast(who,text,av){
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
  if(ptrs.size===2){drag=null;ZA=null;const [a,b]=[...ptrs.values()];pinch={d:Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),z:cam.z,w:s2w((a.x+b.x)/2,(a.y+b.y)/2)};return;}
  drag={sx:PX(e),sy:PY(e),cx:cam.x,cy:cam.y,moved:false};
});
cv.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;p.x=PX(e);p.y=PY(e);
  if(pinch&&ptrs.size>=2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;cam.z=clamp(pinch.z*d/pinch.d,ZMIN,ZMAX);cam.x=pinch.w.x-(mx-VW()/2)/cam.z;cam.y=pinch.w.ys-(my-VH()/2)/cam.z;clampCam();follow=false;zoomAnchor=[mx,my];lastZoomIn=performance.now();return;}
  if(!drag)return;const dx=PX(e)-drag.sx,dy=PY(e)-drag.sy;
  if(!drag.moved&&Math.hypot(dx,dy)>8)drag.moved=true;
  if(drag.moved){follow=false;cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam();}
});
function up(e){
  const had=ptrs.delete(e.pointerId);
  if(pinch){if(ptrs.size<2)pinch=null;drag=null;return;}
  if(drag&&had&&e.type==='pointerup'&&!drag.moved){const sx=PX(e),sy=PY(e),now=performance.now();
    if(lastTap&&now-lastTap.t<320&&Math.hypot(sx-lastTap.x,sy-lastTap.y)<30){lastTap=null;zoomTo(cam.z>=ZMAX*0.6?FITZ:Math.min(ZMAX,cam.z*2),sx,sy);}
    else{lastTap={t:now,x:sx,y:sy};tap(sx,sy);}}
  drag=null;
}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();if(!started||talkOpen)return;ZA=null;const dy=e.deltaMode===1?e.deltaY*16:e.deltaY;const w=s2w(PX(e),PY(e));cam.z=clamp(cam.z*Math.pow(1.0018,-clamp(dy,-120,120)),ZMIN,ZMAX);cam.x=w.x-(PX(e)-VW()/2)/cam.z;cam.y=w.ys-(PY(e)-VH()/2)/cam.z;clampCam();follow=false;zoomAnchor=[PX(e),PY(e)];lastZoomIn=performance.now();},{passive:false});

function stepAgent(a,sp,pass){
  a.moving=false;if(!a.path.length)return;
  const n=a.path[0];if(pass&&!pass(n)){a.path=[];return;}
  const tx=n%W,ty=(n/W)|0,dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
  if(d<=sp){a.x=tx;a.y=ty;a.path.shift();}else{a.x+=dx/d*sp;a.y+=dy/d*sp;}
  if(Math.abs(dx)>0.01)a.dir=dx>0?1:-1;a.walk+=sp;a.moving=true;
}
function update(dt){
  if(talkOpen)return;
  stepAgent(P1,3.3*dt,i=>passable(i)&&!NPCS.some(n=>ti(n)===i));
  if(!P1.path.length&&P1.pend){const p=P1.pend;P1.pend=null;if(started)goTalk(p.kind,p.id,p.depo);}
  for(const n of NPCS){
    if(n.say){n.say.t+=dt*60;if(n.say.t>n.say.life)n.say=null;}
    else if(started&&(n.sayT-=dt*60)<0){n.sayT=900+Math.random()*1500;if(dist(P1.x,P1.y,n.x,n.y)<9)n.say={txt:pick(n.lines),t:0,life:170};}
    if(n.hold)continue;
    if(n.path.length){stepAgent(n,1.5*dt,i=>passable(i)&&ti(P1)!==i&&!NPCS.some(m=>m!==n&&ti(m)===i));if(!n.path.length&&n.id==='paulo')n.dir=-1;continue;}
    if(!n.walk||!n.walk.length)continue;
    n.timer-=dt*60;if(n.timer>0)continue;n.timer=300+Math.random()*420;n.wp=(n.wp+1)%n.walk.length;
    const g=n.walk[n.wp],tgt=idx(g[0],g[1]);if(ti(n)===tgt)continue;
    const e=bfs(ti(n),i=>i===tgt,i=>(passable(i)||i===tgt||!!objs[occ[i]]&&objs[occ[i]].nocc)&&!NPCS.some(m=>m!==n&&ti(m)===i)&&ti(P1)!==i);
    if(e>=0)n.path=pathTo(e);
  }
  lastClock+=dt;if(lastClock>3){lastClock=0;gameMin++;}
}

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
function followCam(dt){
  if(!follow)return;
  const L=VW()>VH(),f=talkFocus()||[P1.x,P1.y];
  let tx=f[0]*T+16,ty=f[1]*TH+TH/2-14;
  if(talkOpen){if(L)tx+=VW()*0.24/cam.z;else ty+=VH()*0.2/cam.z;}
  const k=1-Math.exp(-dt*7.5);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;clampCam();
}

/* ---------- Luz (mesmo método da casa: ambiente × luzes por cômodo) ---------- */
const LCACHE={};
const LC_SUN=[255,234,196],LC_MON=[110,230,180],LC_CLOUD=[176,180,196],LC_EMBER=[255,130,60],LC_WHITE=[255,255,255];
function lightSprite(col){if(col._ls)return col._ls;const k=col.join(',');let c=LCACHE[k];if(c)return col._ls=c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,rgbs(col,1));gr.addColorStop(0.4,rgbs(col,0.55));gr.addColorStop(1,rgbs(col,0));g.fillStyle=gr;g.fillRect(0,0,64,64);return col._ls=LCACHE[k]=c;}
const COOL=[225,236,255],WARM=[255,206,140],SUNC=[255,236,200];
// [x, y, raio em tiles, cor, intensidade, cômodo, oscila]
const LIGHTS=[
  [6,5,4.6,[255,220,180],0.8,'sonia'],[4.6,3.4,2.2,[255,224,150],1,'sonia'],
  [13,4.6,4.2,COOL,0.95,'equipe'],[17,4.6,4.2,COOL,0.95,'equipe'],[20.5,5.2,3.8,COOL,0.85,'equipe'],
  [25.5,4.6,4.6,[235,246,255],1,'pericia'],[29,5,3.8,[235,246,255],0.95,'pericia'],[29.5,6.2,1.8,[210,236,255],0.9,'pericia'],
  [5.5,13.1,2.7,WARM,1.15,'interro'],
  [15,13,5.2,[255,240,215],0.9,'hall'],[19.5,12.8,3.2,[255,240,215],0.65,'hall'],[15.5,17.2,2.6,[255,250,235],0.9,'hall'],
  [25.5,12.5,3.2,[255,216,150],0.8,'arquivo',1],[29.5,15,3,[255,216,150],0.65,'arquivo',1],
  // brilho dos monitores no rosto de quem trabalha
  [12.6,3.3,1.3,[140,210,255],0.5,'equipe'],[16.6,3.3,1.3,[140,210,255],0.5,'equipe'],[19.6,3.7,1.4,[120,230,190],0.55,'equipe'],[6.6,3.3,1.2,[140,210,255],0.4,'sonia'],[12.8,11.2,1.3,[140,210,255],0.45,'hall']
];
const WINDOWS=[[4,'sonia'],[5,'sonia'],[13,'equipe'],[19,'equipe'],[25,'pericia'],[29,'pericia']];
const HALOS=[{x:4.6*T+1,y:3*TH+3,r:16,c:[255,226,150],a:0.9},{x:5.5*T+16,y:12*TH-18,r:20,c:[255,214,150],a:0.85},{x:29.5*T,y:5.6*TH,r:30,c:[220,240,255],a:0.45},
  {x:21*T+16,y:11*TH-11,r:5,c:[120,180,255],a:0.7},{x:20*T+19,y:6*TH-25,r:4,c:[255,80,60],a:0.8},{x:18*T+16,y:9*TH+7,r:14,c:[90,255,150],a:0.35}];
const AMB_IN=[118,124,142],AMB_OUT=[255,250,244];
function roomClip(rm){const r=ROOM_RECT[rm];return [r[0]*T,r[1]*TH-30,(r[2]+1)*T,(r[3]+1)*TH-RISE+CAPH];}
const GR={};
function lightPass(s,ox,oy){
  const sp=(x,y)=>[(x*s+ox)/LS,(y*s+oy)/LS];
  lctx.setTransform(1,0,0,1,0,0);lctx.globalAlpha=1;lctx.globalCompositeOperation='source-over';
  lctx.fillStyle=rgbs(AMB_OUT);lctx.fillRect(0,0,lc.width,lc.height);
  for(const c of CLOUDS){const [X,Y]=sp(c.x,c.y),rr=c.r*s/LS;lctx.globalAlpha=0.55;lctx.drawImage(lightSprite(LC_CLOUD),X-rr,Y-rr*0.7,rr*2,rr*1.4);}lctx.globalAlpha=1;
  {const [a,b]=sp(1*T,1*TH-RISE),[c,d]=sp(33*T,18*TH-8);lctx.fillStyle=rgbs(AMB_IN);lctx.fillRect(a,b,c-a,d-b);}
  lctx.globalCompositeOperation='lighter';
  const draw=(x,y,r,col,a,rm)=>{const [X,Y]=sp(x,y),rr=r*s/LS;if(X<-rr||Y<-rr||X>lc.width+rr||Y>lc.height+rr)return;lctx.save();
    if(rm){const q=roomClip(rm),[a0,b0]=sp(q[0],q[1]),[a1,b1]=sp(q[2],q[3]);lctx.beginPath();lctx.rect(a0,b0,a1-a0,b1-b0);lctx.clip();}
    lctx.globalAlpha=Math.min(1,a);lctx.drawImage(lightSprite(col),X-rr,Y-rr*0.8,rr*2,rr*1.6);lctx.restore();};
  for(const l of LIGHTS){const fl=l[6]?0.86+0.14*vn(frame/9,l[0]*7,5)*(((frame>>3)%53)===0?0.2:1):1;draw(l[0]*T,l[1]*TH,l[2]*T,l[3],l[4]*fl,l[5]);if(l[4]>1)draw(l[0]*T,l[1]*TH,l[2]*T,l[3],l[4]-1,l[5]);}
  for(const [x,rm] of WINDOWS)draw(x*T+30,2.9*TH,2.1*T,SUNC,0.5*(1-0.7*sunShade(x*T)),rm);
  lctx.globalAlpha=1;lctx.globalCompositeOperation='multiply';if(GR.skyH!==lc.height){GR.skyH=lc.height;GR.sky=null;}if(!GR.sky){const g=GR.sky=lctx.createLinearGradient(0,0,0,lc.height);g.addColorStop(0,'rgb(255,238,218)');g.addColorStop(0.5,'rgb(250,248,246)');g.addColorStop(1,'rgb(212,224,246)');}lctx.fillStyle=GR.sky;lctx.fillRect(0,0,lc.width,lc.height);
  lctx.globalCompositeOperation='source-over';
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.imageSmoothingEnabled=true;ctx.drawImage(lc,0,0,cv.width,cv.height);ctx.globalCompositeOperation='source-over';
}
const DUST=Array.from({length:120},(_,k)=>({w:WINDOWS[k%WINDOWS.length][0],u:Math.random(),v:Math.random(),s:0.0004+Math.random()*0.0012,ph:Math.random()*6,big:Math.random()<0.18}));
function glowPass(){
  ctx.globalCompositeOperation='lighter';
  for(const h of HALOS){ctx.globalAlpha=h.a*(0.9+0.1*Math.sin(frame/6+h.x));ctx.drawImage(lightSprite(h.c),h.x-h.r,h.y-h.r*0.8,h.r*2,h.r*1.6);}
  // brilho das janelas do fundo (some quando a nuvem passa)
  if(FXMODE!=='off')for(const [x] of WINDOWS){const sh=1-0.75*sunShade(x*T);ctx.globalAlpha=0.3*sh;ctx.drawImage(lightSprite(LC_SUN),x*T-14,2*TH-34,60,40);}
  // sol da manhã entrando pelas janelas do fundo, com poeira no feixe
  for(const [x,rm] of WINDOWS){const r=roomClip(rm);ctx.save();ctx.beginPath();ctx.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]);ctx.clip();
    const sh=1-0.75*sunShade(x*T),y0=2*TH-2;if(!GR.beam){GR.beam=ctx.createLinearGradient(0,y0,0,y0+76);GR.beam.addColorStop(0,'rgba(255,228,180,.22)');GR.beam.addColorStop(1,'rgba(255,228,180,0)');}ctx.globalAlpha=sh;ctx.fillStyle=GR.beam;
    ctx.beginPath();ctx.moveTo(x*T+6,y0);ctx.lineTo(x*T+26,y0);ctx.lineTo(x*T+26+34,y0+76);ctx.lineTo(x*T+6+34,y0+76);ctx.closePath();ctx.fill();ctx.restore();}
  ctx.fillStyle='rgba(255,240,210,.85)';
  for(const d of DUST){d.u=(d.u+d.s)%1;const w=((d.v+Math.sin(frame/90+d.ph)*0.06)%1+1)%1,tw=0.65+0.35*Math.sin(frame/17+d.ph*5);ctx.globalAlpha=(d.big?0.35:0.6)*tw*(1-d.u)*Math.min(1,d.u*6)*(1-0.7*sunShade(d.w*T));const sz=d.big?2:1;ctx.fillRect(Math.round(d.w*T+6+w*20+d.u*34),Math.round(2*TH-2+d.u*76),sz,sz);}
  // poeira no ar de cada sala, acesa onde há luz
  ctx.fillStyle='#fff4dc';for(const m of MOTES){const tw=0.5+0.5*Math.sin(frame/23+m.ph*7);ctx.globalAlpha=(m.r==='interro'?0.26:0.42)*tw*(m.big?0.6:1);const sz=m.big?2:1;ctx.fillRect(Math.round(m.x),Math.round(m.y-m.z),sz,sz);}
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
const aliveP=p=>p.t<p.life,onRoad=c=>c.x>-6*T&&c.x<(W+6)*T;
function updFX(){
  if(frame%9===0){for(const [x,y] of [[20*T+14,6*TH-19],[4*T+24,4*TH-9],[19*T+52,4*TH-8]])if(FXP.length<400)FXP.push({k:'steam',x:x+(Math.random()-0.5)*3,y,z:0,vz:0.22,t:0,life:56,sz:1.4});}
  for(const p of FXP){p.t++;
    if(p.k==='leaf'||p.k==='feather'||p.k==='ash'){if(p.y<p.gy){p.x+=p.vx+Math.sin(p.t/(p.k==='feather'?20:14)+p.ph)*(p.k==='ash'?0.05:0.35);p.y+=p.vy;}else if(GUST>0.2&&p.k!=='ash'){p.x+=GUST*1.6;}continue;}
    if(p.k==='drop'){p.vz-=0.09;p.z+=p.vz;p.x+=p.vx;if(p.z<0)p.t=p.life;continue;}
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
// rua: carros dos dois lados
const TRAFFIC=[];let CARS=[],nextCar=120;
function buildTraffic(){
  for(const c of [['#3d6db0','#5d8cce','#2c5389','#1f3d66','#33609e'],['#8a2a2a','#aa4a44','#6a2020','#4a1515','#7a2626'],['#d8d4c8','#f0ece2','#b0aca0','#8a8678','#c8c4b8'],['#2f3a2f','#4a5a4a','#252e25','#1a201a','#2a332a'],['#c9a24a','#e0bc66','#a8842e','#7a5e1e','#b8923c']]){
    const v=outlined(S2(64,81,(P,E)=>drawCarPx(P,E,{b:c[0],hi:c[1],sh:c[2],dk:c[3],fr:c[4]},false)));
    const w=Math.round(v.height*0.82),h=Math.round(v.width*0.72),o=document.createElement('canvas');o.width=w;o.height=h;const g=o.getContext('2d');g.imageSmoothingEnabled=false;
    g.translate(w/2,h/2);g.rotate(-Math.PI/2);g.scale(0.72,0.82);g.drawImage(v,-v.width/2,-v.height/2);TRAFFIC.push(o);}
}
// pombos no pátio
const PIGEONS=Array.from({length:6},(_,k)=>newPigeon(k,true));
function newPigeon(k,ground){return {k,x:(3+Math.random()*28)*T,y:(19.3+Math.random()*3.2)*TH,z:ground?0:60+Math.random()*30,st:ground?'g':'land',dir:Math.random()<0.5?-1:1,t:Math.floor(Math.random()*90),vx:0,vy:0,away:0};}
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
  // carros
  if(--nextCar<=0){nextCar=240+Math.random()*420;const r=Math.random()<0.5;CARS.push({spr:pick(TRAFFIC),dir:r?1:-1,x:r?-4*T:(W+4)*T,y:r?25.7*TH:24.5*TH,v:(1.1+Math.random()*0.7)});}
  for(const c of CARS){c.x+=c.v*c.dir;const tail=c.x-c.dir*c.spr.width/2;
    if(frame%4===0)FXP.push({k:'exh',x:tail-c.dir*2,y:c.y-7,z:2,vz:0.06,vx:-c.dir*0.25,t:0,life:70,sz:1.2});
    if(frame%9===0)FXP.push({k:'puff',x:tail+(Math.random()-0.5)*6,y:c.y-2,z:0,vz:0.04,vx:c.dir*0.3,t:0,life:36,sz:1.6});}keep(CARS,onRoad);
  // pombos: bicam, andam e voam quando Lemos chega perto
  for(const b of PIGEONS){
    b.t++;
    if(b.st==='g'){if(Math.hypot(P1.x*T+16-b.x,(P1.y*TH+TH)-b.y)<48&&started){b.st='fly';b.vx=(b.x>P1.x*T+16?1:-1)*(1.4+Math.random());b.vy=-0.5-Math.random()*0.5;b.dir=Math.sign(b.vx);b.away=0;for(let k=0;k<3;k++)FXP.push({k:'feather',x:b.x+(Math.random()-0.5)*8,y:b.y-8-Math.random()*6,gy:b.y+Math.random()*6,vx:(Math.random()-0.5)*0.3,vy:0.12+Math.random()*0.1,t:0,life:420,c:pick(['#c8ccd2','#a3a9b0','#e8eaee']),ph:Math.random()*6});}
      else if(b.t%120===60&&Math.random()<0.5){b.dir=-b.dir;}else if(b.t%40<6)b.x+=b.dir*0.25;}
    else if(b.st==='fly'){b.x+=b.vx;b.y+=b.vy;b.z+=1.1;b.away++;if(b.away>260){Object.assign(b,newPigeon(b.k,false));}}
    else if(b.st==='land'){b.z-=0.8;b.x+=b.dir*0.4;if(b.z<=0){b.z=0;b.st='g';}}
  }
  // folhas caindo das árvores
  if(Math.random()<0.07+GUST*0.3){const tr=TREES||(TREES=objs.filter(o=>o.t==='tree'&&!o.far));if(tr.length){const o=pick(tr);FXP.push({k:'leaf',x:o.x*T+16+(Math.random()-0.5)*30,y:(o.y+1)*TH-50+Math.random()*12,gy:(o.y+1)*TH+Math.random()*30,vx:0.12+Math.random()*0.2,vy:0.25+Math.random()*0.2,t:0,life:520,c:pick(['#4a8a3c','#69ad52','#c9a040','#a8642a']),ph:Math.random()*6});}}
  // cigarro no cinzeiro da sala de depoimentos
  if(frame%7===0)FXP.push({k:'smoke',x:4*T+77,y:12*TH+26,z:2,vz:0.16,t:0,life:240,sz:0.8,ph:Math.random()*6});
  // passos levantam poeira lá fora
  if(P1.moving&&!INSIDE(roomOf(P1))&&frame%10===0)for(let k=0;k<2;k++)FXP.push({k:'puff',x:P1.x*T+16+(Math.random()-0.5)*6,y:P1.y*TH+TH-3,z:1,vz:0.1,vx:(Math.random()-0.5)*0.2,t:0,life:28,sz:1.4});
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
function drawCar2(c){
  const s=c.spr,X=DP(c.x-s.width/2),Y=DP(c.y-s.height);
  ctx.globalAlpha=0.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(c.x+4,c.y-4,s.width*0.5,8,0,0,7);ctx.fill();ctx.globalAlpha=1;
  if(c.dir<0){ctx.save();ctx.translate(c.x,0);ctx.scale(-1,1);ctx.drawImage(s,-s.width/2,Y);ctx.restore();}else ctx.drawImage(s,X,Y);
}
function drawPigeon(b){
  const X=DP(b.x),Y=DP(b.y),z=DP(b.z),d=b.dir;
  ctx.globalAlpha=0.28*Math.max(0.2,1-b.z/90);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X,Y,5,1.6,0,0,7);ctx.fill();ctx.globalAlpha=1;
  const y=Y-z-6,peck=b.st==='g'&&(b.t%50)<8,fly=b.st!=='g',up=(frame>>2)%2;
  if(fly){ctx.fillStyle='#1e1611';ctx.fillRect(X-7,up?y-5:y+1,14,4);ctx.fillStyle='#a3a9b0';ctx.fillRect(X-6,up?y-4:y+2,12,2);}
  ctx.fillStyle='#1e1611';ctx.fillRect(X-5-(d>0?1:0),y-1,11,7);
  ctx.fillStyle='#8a9098';ctx.fillRect(X-4,y,9,5);ctx.fillStyle='#a3a9b0';ctx.fillRect(X-3,y,6,2);ctx.fillStyle='#5a6068';ctx.fillRect(d>0?X-5:X+3,y+1,3,2);
  const hx=d>0?X+4:X-6,hy=peck?y+3:y-3;ctx.fillStyle='#1e1611';ctx.fillRect(hx-1,hy-1,5,5);ctx.fillStyle='#4f5a62';ctx.fillRect(hx,hy,3,3);ctx.fillStyle='#5fa08a';ctx.fillRect(hx,hy+2,3,1);ctx.fillStyle='#e8e2d0';ctx.fillRect(d>0?hx+2:hx,hy,1,1);ctx.fillStyle='#c97a3a';ctx.fillRect(d>0?hx+3:hx-1,hy+1,1,1);
  if(!fly){ctx.fillStyle='#c97a3a';ctx.fillRect(X-1,y+5,1,2);ctx.fillRect(X+2,y+5,1,2);}
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
  mtext(4*T+31,19*TH+58.2,'DPC-0217',2.2,'#2b2b2b','center',800);
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
  if(p.moving)f=Math.floor(p.walk*3.2)%4;else if(sit){f=4;if(p.act==='type'&&((frame>>2)+id)%6<2)dy=-1;if(p.act==='write'&&((frame>>4)+id)%5===0)dy=-1;}
  const X=DP(p.x*T+16),Y=DP(p.y*TH+TH-2);
  const bob=p.moving?((Math.floor(p.walk*3.2)%2)?-1:0):sit?dy:(Math.sin(frame/26+(id||0)*1.7)>0.55?-1:0);
  const hdA=clamp((LODE-2.2)/0.35,0,1),img=hdA>=1?framesHDFor(p)[f]:fr[f],dw=fr[f].width,dh=fr[f].height;
  if(!sit){if(GLOSSY.has(room[ti(p)]))drawReflect(fr[f],X,Y,p.dir<0,dw,dh);drawCast(fr[f],X,Y,p.dir<0,castFrom(p),dw,dh);ctx.drawImage(SHADOW,X-11,Y-5);}
  if(p.mop){const mx=X+p.dir*10,sw=p.moving?Math.sin(frame/5)*3:0;ctx.strokeStyle='#8a6a4a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(X+p.dir*4,Y-26);ctx.lineTo(mx+sw,Y-2);ctx.stroke();ctx.fillStyle='#d8d0c0';ctx.fillRect(Math.round(mx+sw-5),Y-3,10,3);ctx.fillStyle='#b8b0a0';ctx.fillRect(Math.round(mx+sw-5),Y-1,10,1);}
  const dw0=dofW(Y-22),put=(im,nb)=>{const w=nb?0:dw0;if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);drawB(im,-14,Y-45+bob,w,dw,dh);ctx.restore();}else drawB(im,X-14,Y-45+bob,w,dw,dh);};
  put(img);if(hdA>0&&hdA<1){ctx.save();ctx.globalAlpha=hdA;put(framesHDFor(p)[f]);ctx.restore();}
  if(LODV>=1){const rl=rimLight(p);if(rl&&rl.a>0.05){const st=Math.max(1,Math.round(img.width/dw));ctx.save();ctx.globalAlpha=rl.a;if(dw0<0.5)put(rimImg(img,p.dir<0?-rl.lx:rl.lx,rl.ly,rl.col,st),true);ctx.restore();}}
  // piscar
  if(LODV>=2&&!p.moving&&((frame+(id||0)*53)%190)<6){const sk=p.look.skin,cy=f===4?4:0;ctx.fillStyle=sk;
    if(LODV>=3){const xs=p.dir<0?[X+2,X-3]:[X-3.5,X+1.5];for(const x of xs){ctx.fillStyle=sk;ctx.fillRect(x,Y-35.5+bob+cy,1.5,1.5);ctx.fillStyle=rgbs(mul(hex(sk),0.55));ctx.fillRect(x,Y-34.3+bob+cy,1.5,.35);}}
    else{ctx.fillRect(X-3,Y-35+bob+cy,1,2);ctx.fillRect(X+2,Y-35+bob+cy,1,2);}}
}
function drawMarker(X,Y){
  const b=Math.round(Math.sin(frame/10)*2);ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+b+7);ctx.lineTo(X-6,Y+b);ctx.lineTo(X,Y+b-7);ctx.lineTo(X+6,Y+b);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+b+5);ctx.lineTo(X-4,Y+b);ctx.lineTo(X,Y+b-5);ctx.lineTo(X+4,Y+b);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y+b-3,2,4);ctx.fillRect(X-1,Y+b+2,2,1.5);
}
let UIK=1;
function atUI(X,Y,fn){if(UIK>=0.999){fn();return;}ctx.save();ctx.translate(X,Y);ctx.scale(UIK,UIK);ctx.translate(-X,-Y);fn();ctx.restore();}
function drawSay(X,Y,s,al){atUI(X,Y,()=>{
  ctx.font='600 7px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const w=Math.ceil(ctx.measureText(s).width)+8,x=Math.round(X-w/2),y=Math.round(Y-14);
  ctx.globalAlpha=al;ctx.fillStyle='#1e1611';ctx.fillRect(x-1,y-1,w+2,12);ctx.fillRect(X-2,y+11,4,2);
  ctx.fillStyle='#f3f1ea';ctx.fillRect(x,y,w,10);ctx.fillRect(X-1,y+10,2,2);
  ctx.fillStyle='#14181b';ctx.textAlign='center';ctx.fillText(s,X,y+7.5);ctx.textAlign='left';ctx.globalAlpha=1;});}
function drawRoomLabels(){
  const fa=clamp((1.0-LODE)/0.2,0,1);if(fa<=0)return;ctx.save();ctx.globalAlpha=fa;ctx.font='bold 9px ui-monospace,Menlo,monospace';ctx.textAlign='center';
  for(const k in ROOM_RECT){const r=ROOM_RECT[k],X=(r[0]+r[2]+1)/2*T,Y=(r[1]+r[3])/2*TH,t=ROOM_NAME[k].toUpperCase(),w=ctx.measureText(t).width+10;
    ctx.fillStyle='rgba(8,10,12,.75)';ctx.fillRect(Math.round(X-w/2),Math.round(Y-9),Math.ceil(w),13);ctx.fillStyle='#e9edf0';ctx.fillText(t,X,Y);}
  ctx.restore();ctx.textAlign='left';
}
function drawNames(){
  const fa=clamp((LODE-1.9)/0.3,0,1);if(fa<=0||talkOpen)return;
  ctx.save();ctx.globalAlpha=fa;const fs=Math.max(2,5.5*Math.min(1,2.4/LODE));ctx.font=`600 ${fs}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.textAlign='center';
  for(const n of NPCS){const X=Math.round(n.x*T)+16,Y=Math.round(n.y*TH)+TH+fs+1,t=n.name.split(' ')[0]+' · '+n.role.split(' · ')[0],w=ctx.measureText(t).width+fs;ctx.fillStyle='rgba(8,10,12,.72)';ctx.fillRect(X-w/2,Y-fs,w,fs*1.45);ctx.fillStyle='#e9edf0';ctx.fillText(t,X,Y);}
  ctx.restore();ctx.textAlign='left';
}
let ROWS=null;const byY=(a,b)=>a.y-b.y;
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,cv.width,cv.height);
  const s=cam.z*RS,oxf=cv.width/2-cam.x*s,oyf=cv.height/2-cam.y*s,ox=Math.round(oxf),oy=Math.round(oyf);
  // a fração que o arredondamento tirou vai para o shader: a câmera desliza no pixel da tela
  FX.sx=oxf-ox;FX.sy=oyf-oy;
  LODE=s/RS;LODV=lodOf(LODE);SC=s;UIK=Math.min(1,2.2/LODE);
  const SPR=()=>{ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;};
  DOF_S=s;DOF_OY=oy;DOF_ON=FXMODE==='2d'&&!POST&&FX.dof>0.02;
  ctx.setTransform(s,0,0,s*K,ox,oy);ctx.imageSmoothingEnabled=false;ctx.drawImage(BG,0,0);dofGround(s,ox,oy);SPR();drawFloorFX();
  if(!ROWS){ROWS=Array.from({length:H},()=>({o:[],p:[],x:[]}));for(const o of objs)if(o.spr)ROWS[clamp(o.y+o.h-1,0,H-1)].o.push(o);}
  for(const r of ROWS){r.p.length=0;r.x.length=0;}
  const R=k=>ROWS[clamp(k,0,H-1)];
  for(const n of NPCS){n._sit=!!n.sit&&!n.moving&&isSeat(n);n._k=n.k;R(Math.round(n.y)).p.push(n);}
  P1._sit=false;P1._k=9;R(Math.round(P1.y)).p.push(P1);
  VIS.forEach((v,k)=>{v._sit=true;v._k=20+k;R(v.y).p.push(v);});
  for(const c of CARS)R(Math.floor(c.y/TH)).x.push(c);
  for(const b of PIGEONS)R(Math.floor(b.y/TH)).x.push(b);
  const y0=Math.max(0,Math.floor(-oy/s/TH)-4),y1=Math.min(H-1,Math.ceil((cv.height-oy)/s/TH)+4);
  for(let y=y0;y<=y1;y++){
    if(WALLROWS[y])drawB(WALLROWS[y],0,y*TH-RISE,dofW(y*TH));
    if(y===1)drawClockHands();
    if(y===18){drawDoor();ctx.drawImage(SIGN,13*T,18*TH-8);}
    const r=ROWS[y];
    for(const o of r.o){if(o.nocc)drawB(o.spr.c,o.spr.x,o.spr.y,dofW(o.spr.y+o.spr.c.height*0.6));}
    for(const o of r.o){if(!o.nocc){drawB(o.spr.c,o.spr.x,o.spr.y,dofW(o.spr.y+o.spr.c.height*0.6));if(o.t==='flag')drawFlagCloth(o);}}
    if(r.p.length>1)r.p.sort(byY);
    // quem está sentado atrás de uma mesa é desenhado antes dela (a mesa fica na fileira de baixo)
    for(const p of r.p)drawPerson(p,p._sit,p._k);
    for(const e of r.x){if(e.spr)drawCar2(e);else drawPigeon(e);}
  }
  // luminária pendente da sala de depoimentos
  ctx.fillStyle='#1c1e20';ctx.fillRect(5.5*T+15,10*TH-RISE,1,2*TH-6);ctx.drawImage(LAMP,5.5*T+5,12*TH-30);
  micro();
  // destino do toque
  if(P1.path.length&&started){const e=P1.path[P1.path.length-1],X=(e%W)*T+16,Y=((e/W)|0)*TH+TH/2;ctx.strokeStyle='rgba(242,194,48,.9)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.lineDashOffset=-(frame>>2);ctx.beginPath();ctx.ellipse(X,Y,10,4.5,0,0,7);ctx.stroke();ctx.setLineDash([]);}
  lightPass(s,ox,oy);
  SPR();smokePass();glowPass();post2d();
  // camada legível: sinais, falas, nomes
  for(const n of NPCS)if(hasNews(n.id))atUI(Math.round(n.x*T)+16,Math.round(n.y*TH)+TH-(n.sit?64:60),()=>drawMarker(Math.round(n.x*T)+16,Math.round(n.y*TH)+TH-(n.sit?64:60)));
  for(const o of objs)if(o.hot&&o.spr&&!o.nomark&&!talkOpen&&(o.hot==='interro'?hasNews('interro'):!SEEN[o.hot])){const sp=o.spr;drawMarker(o.x*T+o.w*T/2,sp.y-6);}
  for(const n of NPCS)if(n.say&&!talkOpen){const al=Math.min(1,(n.say.life-n.say.t)/20,n.say.t/6);drawSay(Math.round(n.x*T)+16,Math.round(n.y*TH)+TH-(n.sit?70:74),n.say.txt,al);}
  drawNames();drawRoomLabels();
}
function hasNews(id){if(!DLG[id])return false;if(id==='interro')return INTERRO_NEWS||!SEEN.interro;if(TEAM_IDS.has(id))return teamNews(CASE,id).count>0||(id==='sonia'&&!SEEN.sonia);return !SEEN[id];}
function isSeat(n){const i=ti(n);return objs.some(o=>o.nocc&&idx(o.x,o.y)===i);}

/* ---------- Interface ---------- */
let lastRoom='',lastClk='';
function updateUI(){
  const r=roomOf(P1),nm=ROOM_NAME[r]||'';if(r!==lastRoom){lastRoom=r;$('#where-n').textContent=nm;}
  const c=clockStr();if(c!==lastClk){lastClk=c;$('#clk').textContent=c;}
}
let last=performance.now();
const PROF={r2d:0};
function loop(now){
  if(depoOpen){last=now;requestAnimationFrame(loop);return;}
  const raw=now-last,dt=Math.min(0.1,raw/1000);last=now;adaptRS(raw);
  update(dt);updFX();updAtmo();stepZoom();followCam(dt);if(started)primeBlur();frame++;const r0=performance.now();render();PROF.r2d+=(performance.now()-r0-PROF.r2d)*0.05;postFX(dt);if(frame%6===0)updateUI();
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
  const sf=FX.soft;
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
  dpr=Math.min(window.devicePixelRatio||1,3);sizeCanvas();
  const ht=$('.hud');HUDT=ht?ht.offsetTop+ht.offsetHeight+4:58;
  fitCard();
  if(force||L!==lastL){lastL=L;fitView();}else clampCam();
}
function fitCard(){
  const m=$('#intro');if(m.hidden)return;const c=m.querySelector('.card');c.style.transform='';
  const cs=getComputedStyle(m),avH=m.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),avW=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
  const k=Math.min(1,avH/c.offsetHeight,avW/c.offsetWidth);if(k<1)c.style.transform=`scale(${k.toFixed(3)})`;
}
$('#rot').addEventListener('click',()=>{ROT=ROT===0?90:ROT===90?-90:0;userVert=(ROT===0);lastL=null;applyLayout(true);});
addEventListener('resize',()=>applyLayout(false));

newGame();initArt();buildTraffic();buildVisitors();applyLayout(true);cam.x=16*T;cam.y=15*TH;clampCam();
setTimeout(()=>{framesHDFor(P1);for(const n of NPCS)framesHDFor(n);},300);
$('#b-start').addEventListener('click',()=>{
  $('#intro').hidden=true;started=true;setTimeout(loadDepo,4000);
  const e=bfs(ti(P1),i=>i===idx(16,15),walkPass);if(e>=0)P1.path=pathTo(e);
  setTimeout(()=>toast('Sônia Prado','Lemos, na minha sala. A equipe já está com o material da casa.',{img:'/sonia.jpg',col:'#c9a24a'}),1200);
});
window.__base={startDepo,get CASE(){return CASE;},VIS:()=>VIS,get P1(){return P1;},NPCS:()=>NPCS,cam,goTalk,goTile,openTalk,openGallery,FOUND,get started(){return started;},objs:()=>objs,tap,idx,W,H,T,TH,ti,passable,zoomTo,get ROT(){return ROT;},get LODV(){return LODV;},get FITZ(){return FITZ;},get GL(){return !!POST;},prof:()=>({r2d:+PROF.r2d.toFixed(2),post:+FX.ms.toFixed(2),frame:+frameMs.toFixed(2),RS})};
requestAnimationFrame(loop);
})();
