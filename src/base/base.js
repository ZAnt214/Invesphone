/* Base do DHPP: cena 2D navegável do Caso 01, na mesma técnica da Varredura das Acácias
   (pixel art procedural, câmera oblíqua, luz multiplicada por sala, detalhe por zoom, tela deitada).
   Lemos anda, a equipe fala, o aparelho leva ao resto do caso. */
import { applyRequest, applyTopic, caseTeam, requestOk, teamDialogues, teamMaterialRequests, teamNews, topicOk } from '../team/teamData';
import { readCase, writeCase } from '../case/caseSave';
import { depoPeople, summon } from '../case/depositions';
import { openDeposition } from './deposition';
import { ART, vSprite, vPerson, vMop, vCarSprite } from './vecart';
(() => {
'use strict';
const T=32,TH=22,K=TH/T,RISE=16,CAPH=8,W=34,H=26,N=W*H;
const $=s=>document.querySelector(s);
const appEl=$('#app'),cv=$('#cv'),ctx=cv.getContext('2d');
const lc=document.createElement('canvas'),lctx=lc.getContext('2d');
const LS=3;
let dpr=1;
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
  const c=document.createElement('canvas');c.width=Math.ceil(w*ART);c.height=Math.ceil(h*ART);c.ww=w;c.hh=h;const g=c.getContext('2d');g.scale(ART,ART);
  const P=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh);};
  const E=(cx,cy,rx,ry,col)=>{g.fillStyle=col;g.beginPath();g.ellipse(cx,cy,Math.abs(rx),Math.abs(ry),0,0,7);g.fill();};
  fn(P,E,g);return c;
}
const dI=(img,x,y)=>ctx.drawImage(img,x,y,img.ww||img.width,img.hh||img.height);
// chão já na escala exata da tela: cada quadro vira uma cópia 1:1 (recriado quando o zoom para)
let GC=null;
function groundAt(s){
  if(s>4.01)return null;if(GC&&GC.s===s)return GC;
  const c=document.createElement('canvas');c.width=Math.ceil(W*T*s);c.height=Math.ceil(H*T*K*s);const g=c.getContext('2d');g.imageSmoothingEnabled=true;g.drawImage(BG,0,0,c.width,c.height);
  return GC={c,s};
}
// desenha só o pedaço de uma imagem grande que cai dentro da área visível (em coordenadas do mundo)
let VIEW={x0:0,y0:0,x1:0,y1:0};
function dV(img,x,y,vy0,vy1){
  const w=img.ww||img.width,h=img.hh||img.height,ax=Math.max(x,VIEW.x0),bx=Math.min(x+w,VIEW.x1),ay=Math.max(y,vy0),by=Math.min(y+h,vy1);
  if(bx<=ax||by<=ay)return;const kx=img.width/w,ky=img.height/h;
  ctx.drawImage(img,(ax-x)*kx,(ay-y)*ky,(bx-ax)*kx,(by-ay)*ky,ax,ay,bx-ax,by-ay);
}
function txt(g,s,x,y,size,col,sp,weight){g.font=`${weight||700} ${size}px Rajdhani,"Arial Narrow",sans-serif`;g.fillStyle=col;g.textBaseline='alphabetic';let X=x;for(const ch of s){g.fillText(ch,X,y);X+=g.measureText(ch).width+(sp||0);}return X-x;}
function txtW(g,s,size,sp,weight){g.font=`${weight||700} ${size}px Rajdhani,"Arial Narrow",sans-serif`;let w=0;for(const ch of s)w+=g.measureText(ch).width+(sp||0);return w-(sp||0);}

function makeSprite(o){return vSprite(o,T,TH,{found:FOUND.length});}

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
/* ---------- Arte: chão ---------- */
const C={g1:hex('#5b9145'),g2:hex('#77b257'),g3:hex('#8cc366'),a0:hex('#383b41')};
function floorStyle(i){
  const f=floor[i],r=room[i];
  if(f===F.GRASS)return 'grass';if(f===F.STREET)return 'street';if(f===F.WALK)return 'walk';if(f===F.CONC)return 'conc';if(f===F.WALL||f===F.WIN)return 'dark';
  return {sonia:'wood',equipe:'carpet',pericia:'lab',interro:'vinyl',hall:'checker',arquivo:'conc2'}[r]||'conc';
}
function wallIdx(x,y){if(x<0||y<0||x>=W||y>=H)return false;const f=floor[idx(x,y)];return f===F.WALL||f===F.WIN;}
function groundTile(g,st,X,Y,tx,ty,r){
  const R=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(X+x,Y+y,w,h);};
  const L=(x0,y0,x1,y1,c,w)=>{g.beginPath();g.moveTo(X+x0,Y+y0);g.lineTo(X+x1,Y+y1);g.strokeStyle=c;g.lineWidth=w||0.5;g.stroke();};
  const tone=(c,k)=>rgbs(mul(hex(c),k));
  switch(st){
    case 'grass':{R(0,0,32,32,tone('#5f9447',0.92+r()*0.14));for(let k=0;k<16;k++){const x=r()*32,y=r()*32,h=2+r()*3;L(x,y,x+(r()-0.5)*1.5,y-h,['#4a8238','#6aa84e','#3f7632','#86c060'][k%4],0.7);}break;}
    case 'street':{R(0,0,32,32,tone('#3a3d43',0.92+r()*0.1));for(let k=0;k<26;k++){g.fillStyle=r()<0.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.18)';g.beginPath();g.arc(X+r()*32,Y+r()*32,0.3+r()*0.5,0,7);g.fill();}
      if(ty===24&&tx%2===0)R(2,14,30,2.6,'#d9b84a');if(ty===23)R(0,0,32,1.5,'rgba(0,0,0,.35)');if(r()<0.08)L(r()*32,r()*32,r()*32,r()*32,'rgba(0,0,0,.35)',0.4);break;}
    case 'walk':{R(0,0,32,32,tone('#b4afa1',0.95+r()*0.08));L(0,0.3,32,0.3,'rgba(60,55,45,.45)',0.6);L(0.3,0,0.3,32,'rgba(60,55,45,.45)',0.6);if(ty===22)R(0,27,32,5,'#d4cfc1');if(ty===22)L(0,27,32,27,'rgba(0,0,0,.2)',0.5);break;}
    case 'conc':{R(0,0,32,32,tone('#aaa99f',0.94+((tx>>1)+(ty>>1))%2*0.05));for(let k=0;k<10;k++){g.fillStyle='rgba(0,0,0,.08)';g.beginPath();g.arc(X+r()*32,Y+r()*32,0.4,0,7);g.fill();}if(tx%2===0)L(0.3,0,0.3,32,'rgba(50,48,42,.35)',0.6);if(ty%2===1)L(0,0.3,32,0.3,'rgba(50,48,42,.35)',0.6);if(ty===19)R(0,0,32,4,'rgba(0,0,0,.18)');break;}
    case 'conc2':{R(0,0,32,32,tone('#8f8d86',0.94+r()*0.08));if(tx%2===0)L(0.3,0,0.3,32,'rgba(0,0,0,.25)',0.6);if(ty%2===0)L(0,0.3,32,0.3,'rgba(0,0,0,.25)',0.6);if(ty%4===1)R(14,0,3,32,'rgba(217,184,74,.75)');break;}
    case 'wood':{for(let row=0;row<4;row++){const off=((ty*4+row)%2)*16;for(let k=-1;k<2;k++){const x0=k*32+off;const c=tone('#9a6e46',0.9+hash(tx*4+k,ty*4+row,2)*0.2);g.fillStyle=c;g.fillRect(X+Math.max(0,x0),Y+row*8,Math.min(32,x0+32)-Math.max(0,x0),8);
        if(x0>0&&x0<32)L(x0,row*8,x0,row*8+8,'rgba(60,36,20,.7)',0.6);}
        L(0,row*8+0.2,32,row*8+0.2,'rgba(60,36,20,.65)',0.5);L(0,row*8+1,32,row*8+1,'rgba(255,220,170,.12)',0.6);
        for(let k=0;k<2;k++){const yy=row*8+2+r()*4;g.beginPath();g.moveTo(X,Y+yy);g.bezierCurveTo(X+10,Y+yy+r()-0.5,X+22,Y+yy+r()-0.5,X+32,Y+yy);g.strokeStyle='rgba(70,40,20,.22)';g.lineWidth=0.35;g.stroke();}}break;}
    case 'carpet':{R(0,0,32,32,tone('#5d6b78',0.95+((tx+ty)%2)*0.04));for(let k=0;k<40;k++){g.fillStyle=r()<0.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.1)';g.fillRect(X+r()*32,Y+r()*32,0.5,0.5);}L(0,0.3,32,0.3,'rgba(0,0,0,.18)',0.6);L(0.3,0,0.3,32,'rgba(0,0,0,.18)',0.6);break;}
    case 'lab':{for(let a=0;a<2;a++)for(let b=0;b<2;b++){const gr=g.createLinearGradient(X+a*16,Y+b*16,X+a*16+16,Y+b*16+16);gr.addColorStop(0,'#dde3e5');gr.addColorStop(1,'#c4ccce');g.fillStyle=gr;g.fillRect(X+a*16,Y+b*16,16,16);}L(16,0,16,32,'#a5afb2',0.7);L(0,16,32,16,'#a5afb2',0.7);L(0.3,0,0.3,32,'#a5afb2',0.7);L(0,0.3,32,0.3,'#a5afb2',0.7);break;}
    case 'vinyl':{R(0,0,32,32,tone('#3b3f44',0.95+r()*0.08));L(0,0.3,32,0.3,'rgba(0,0,0,.4)',0.6);L(0.3,0,0.3,32,'rgba(0,0,0,.4)',0.6);L(1,1.2,31,1.2,'rgba(255,255,255,.05)',0.6);break;}
    case 'checker':{for(let a=0;a<2;a++)for(let b=0;b<2;b++){const p=(tx*2+a+ty*2+b)&1;const gr=g.createLinearGradient(X+a*16,Y+b*16,X+a*16+16,Y+b*16+16);gr.addColorStop(0,p?'#dcd6c6':'#c5bead');gr.addColorStop(1,p?'#cfc8b6':'#b6af9c');g.fillStyle=gr;g.fillRect(X+a*16,Y+b*16,16,16);}
      L(16,0,16,32,'rgba(90,80,60,.35)',0.5);L(0,16,32,16,'rgba(90,80,60,.35)',0.5);if(ty===17&&tx>=15&&tx<=16){R(0,0,32,32,'#2b2f33');for(let y=2;y<32;y+=3)L(1,y,31,y,'rgba(255,255,255,.08)',0.7);}break;}
    default:R(0,0,32,32,'#2a2520');
  }
}
function buildGround(){
  const GA=2.5,w=W*T,h=H*T,c=document.createElement('canvas');c.width=Math.ceil(w*GA);c.height=Math.ceil(h*GA);c.ww=w;c.hh=h;const g=c.getContext('2d');g.scale(GA,GA);g.lineCap='round';
  const r=mulberry32(4242);
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++)groundTile(g,floorStyle(idx(tx,ty)),tx*T,ty*T,tx,ty,r);
  // tapete persa da sala da delegada
  {const x=3*T,y=5*T,rw=6*T,rh=3*T;g.fillStyle='#6b1d21';g.fillRect(x,y,rw,rh);
   const fr=(i,c,w)=>{g.strokeStyle=c;g.lineWidth=w;g.strokeRect(x+i,y+i,rw-2*i,rh-2*i);};fr(3,'#c49a45',2.2);fr(7,'#c49a45',0.9);fr(9.5,'#2e2340',1.6);
   for(let k=0;k<9;k++){const cx=x+20+k*19,cy=y+rh/2;g.beginPath();g.moveTo(cx,cy-30);g.lineTo(cx+8,cy);g.lineTo(cx,cy+30);g.lineTo(cx-8,cy);g.closePath();g.strokeStyle='rgba(196,154,69,.9)';g.lineWidth=0.9;g.stroke();g.beginPath();g.arc(cx,cy,2.2,0,7);g.fillStyle='#2e2340';g.fill();}
   for(let xx=x;xx<=x+rw;xx+=2.2){g.strokeStyle='rgba(226,210,168,.8)';g.lineWidth=0.5;g.beginPath();g.moveTo(xx,y);g.lineTo(xx,y-2.4);g.moveTo(xx,y+rh);g.lineTo(xx,y+rh+2.4);g.stroke();}}
  // sombra de canto junto às paredes
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){const f=floor[idx(tx,ty)];if(f===F.WALL||f===F.WIN)continue;const X=tx*T,Y=ty*T;
    const sh=(x0,y0,x1,y1,rx,ry,rw,rh)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,'rgba(0,0,0,.28)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(rx,ry,rw,rh);};
    if(wallIdx(tx-1,ty))sh(X,0,X+7,0,X,Y,7,T);if(wallIdx(tx+1,ty))sh(X+T,0,X+T-7,0,X+T-7,Y,7,T);if(wallIdx(tx,ty-1))sh(0,Y,0,Y+10,X,Y,T,10);}
  for(let i=0;i<N;i++)if(floor[i]===F.DOOR){const x=(i%W)*T,y=((i/W)|0)*T;g.fillStyle='rgba(40,28,18,.55)';
    if((i%W)===15||(i%W)===16){g.fillRect(x,y+24,T,5);g.fillStyle='#c9a24a';g.fillRect(x,y+24,T,1);}else{g.fillRect(x+12,y,8,T);g.fillStyle='#c9a24a';g.fillRect(x+12,y,1,T);g.fillRect(x+19,y,1,T);}}
  // sombras de contato sob os móveis
  for(const o of objs){if(o.far||o.t==='flag')continue;const x=o.x*T,y=o.y*T,w2=o.w*T,h2=o.h*T;
    for(let k=5;k>=1;k--){g.fillStyle='rgba(0,0,0,.045)';g.beginPath();g.ellipse(x+w2/2,y+h2*0.72,w2/2+k,h2*0.42+k,0,0,7);g.fill();}}
  return c;
}

/* ---------- Arte: paredes ---------- */
const FACE={sonia:['#cdbd9d','#b9a885'],equipe:['#c8cfd3','#b3bbc0'],pericia:['#dfe6e6','#c7d0d0'],interro:['#6b7075','#5a5f64'],hall:['#d8d0b8','#c4bca2'],arquivo:['#9a9a90','#86867c'],wall:['#b9b1a0','#a39b8a'],fora:['#b9a58a','#a58f72']};
const BASE={sonia:'#6b4a2e',equipe:'#59616a',pericia:'#8a9496',interro:'#383c40',hall:'#8a7a5a',arquivo:'#6a6a62',wall:'#6b5a46',fora:'#7a6a52'};
function wallAt(x,y){if(x<0||y<0||x>=W||y>=H)return false;const f=floor[idx(x,y)];return f===F.WALL||f===F.WIN;}
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
    '29,9':()=>{P(X+8,Y+4,16,12,'#6a6a62');for(let k=0;k<4;k++)P(X+10,Y+6+k*3,12,1,'#3a3a34');}
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
        P(X,0,T,capH,cap[0]);
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
        {const gr=g.createLinearGradient(0,fy,0,fb);gr.addColorStop(0,'rgba(0,0,0,.10)');gr.addColorStop(0.35,'rgba(255,255,255,.04)');gr.addColorStop(1,'rgba(0,0,0,.06)');g.fillStyle=gr;g.fillRect(X,fy,T,fh);}
        if(rm==='fora'){for(let yy=fy+4;yy<fb-6;yy+=6)P(X,yy,T,1,'rgba(90,70,45,.22)');for(let yy=fy+4;yy<fb-6;yy+=12)P(X+((yy>>2)%2?8:24),yy,1,6,'rgba(90,70,45,.18)');}
        if(rm==='arquivo'||rm==='interro'){for(let xx=0;xx<T;xx+=8)P(X+xx,fy,1,fh,'rgba(0,0,0,.08)');}
        if(rm==='equipe'||rm==='hall'){P(X,fy+18,T,2,lt(st[0],.1));P(X,fy+20,T,1,'rgba(0,0,0,.08)');}
        if(rm==='pericia'){for(let yy=fy+20;yy<fb-5;yy+=5)P(X,yy,T,1,'rgba(150,165,170,.35)');for(let xx=0;xx<T;xx+=8)P(X+xx,fy+20,1,fb-fy-25,'rgba(150,165,170,.35)');}
        P(X,fb-5,T,5,BASE[rm]||BASE.wall);P(X,fb-5,T,1,lt(BASE[rm]||BASE.wall,.18));
        P(X,fy,T,4,'rgba(0,0,0,.20)');
        if(!L)P(X,fy,2,fh,'rgba(0,0,0,.16)');if(!Rt)P(X+T-2,fy,2,fh,'rgba(0,0,0,.20)');
        if(f===F.WIN){const wy=fy+5;P(X+4,wy,24,22,'#f2efe6');P(X+6,wy+2,20,18,'#9cc4e0');P(X+7,wy+3,6,3,'#d4e8f6');P(X+15,wy+2,1,18,'#f2efe6');P(X+6,wy+10,20,1,'#f2efe6');P(X+3,wy+22,26,2,'#d8d2c4');
          if(rm!=='fora'){for(let k=0;k<5;k++)P(X+6,wy+2+k*3,20,1,'rgba(255,255,255,.55)');P(X+6,wy+16,20,4,'rgba(255,255,255,.35)');}}
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
  return (S2(22,12,(P,E)=>{P(3,4,16,6,'#2a2d30');P(1,9,20,2,'#3a3e42');P(4,4,14,1,'#4a4f55');P(6,10,10,2,'#fff2c8');}));
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
function startDepo(id){
  if(talk)closeTalk();
  depoOpen=true;const host=$('#depo');host.hidden=false;document.body.classList.add('depo-on');
  openDeposition(host,id,()=>{host.hidden=true;depoOpen=false;document.body.classList.remove('depo-on');refreshCase();buildVisitors();last=performance.now();});
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
  for(const o of hs){const s=o.spr;if(wx>=s.x&&wx<=s.x+s.w&&wy>=s.y&&wy<=s.y+s.h){goTalk('hot',o.hot);return;}}
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
  if(Math.abs(dx)>0.01)a.dir=dx>0?1:-1;if(Math.abs(dy)>0.01)a.face=dy<0?'back':'front';else if(Math.abs(dx)>0.01)a.face='front';a.walk+=sp;a.moving=true;
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
function zMin(){return Math.max(ZMIN,1/dpr);}
function snapZ(z){return clamp(Math.max(1,Math.round(z*dpr))/dpr,zMin(),ZMAX);}
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
function lightSprite(col){const k=col.join(',');let c=LCACHE[k];if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,rgbs(col,1));gr.addColorStop(0.4,rgbs(col,0.55));gr.addColorStop(1,rgbs(col,0));g.fillStyle=gr;g.fillRect(0,0,64,64);return LCACHE[k]=c;}
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
function lightPass(s,ox,oy){
  const sp=(x,y)=>[(x*s+ox)/LS,(y*s+oy)/LS];
  lctx.setTransform(1,0,0,1,0,0);lctx.globalAlpha=1;lctx.globalCompositeOperation='source-over';
  lctx.fillStyle=rgbs(AMB_OUT);lctx.fillRect(0,0,lc.width,lc.height);
  for(const c of CLOUDS){const [X,Y]=sp(c.x,c.y),rr=c.r*s/LS;lctx.globalAlpha=0.55;lctx.drawImage(lightSprite([176,180,196]),X-rr,Y-rr*0.7,rr*2,rr*1.4);}lctx.globalAlpha=1;
  {const [a,b]=sp(1*T,1*TH-RISE),[c,d]=sp(33*T,18*TH-8);lctx.fillStyle=rgbs(AMB_IN);lctx.fillRect(a,b,c-a,d-b);}
  lctx.globalCompositeOperation='lighter';
  const draw=(x,y,r,col,a,rm)=>{const [X,Y]=sp(x,y),rr=r*s/LS;if(X<-rr||Y<-rr||X>lc.width+rr||Y>lc.height+rr)return;lctx.save();
    if(rm){const q=roomClip(rm),[a0,b0]=sp(q[0],q[1]),[a1,b1]=sp(q[2],q[3]);lctx.beginPath();lctx.rect(a0,b0,a1-a0,b1-b0);lctx.clip();}
    lctx.globalAlpha=Math.min(1,a);lctx.drawImage(lightSprite(col),X-rr,Y-rr*0.8,rr*2,rr*1.6);lctx.restore();};
  for(const l of LIGHTS){const fl=l[6]?0.86+0.14*vn(frame/9,l[0]*7,5)*(((frame>>3)%53)===0?0.2:1):1;draw(l[0]*T,l[1]*TH,l[2]*T,l[3],l[4]*fl,l[5]);if(l[4]>1)draw(l[0]*T,l[1]*TH,l[2]*T,l[3],l[4]-1,l[5]);}
  for(const [x,rm] of WINDOWS)draw(x*T+30,2.9*TH,2.1*T,SUNC,0.5*(1-0.7*sunShade(x*T)),rm);
  lctx.globalAlpha=1;lctx.globalCompositeOperation='multiply';{const g=lctx.createLinearGradient(0,0,0,lc.height);g.addColorStop(0,'rgb(255,238,218)');g.addColorStop(0.5,'rgb(250,248,246)');g.addColorStop(1,'rgb(212,224,246)');lctx.fillStyle=g;lctx.fillRect(0,0,lc.width,lc.height);}
  lctx.globalCompositeOperation='source-over';
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.imageSmoothingEnabled=true;ctx.drawImage(lc,0,0,cv.width,cv.height);ctx.globalCompositeOperation='source-over';
}
const DUST=Array.from({length:42},(_,k)=>({w:WINDOWS[k%WINDOWS.length][0],u:Math.random(),v:Math.random(),s:0.0006+Math.random()*0.001,ph:Math.random()*6}));
function glowPass(){
  ctx.globalCompositeOperation='lighter';
  for(const h of HALOS){ctx.globalAlpha=h.a*(0.9+0.1*Math.sin(frame/6+h.x));ctx.drawImage(lightSprite(h.c),h.x-h.r,h.y-h.r*0.8,h.r*2,h.r*1.6);}
  // sol da manhã entrando pelas janelas do fundo, com poeira no feixe
  for(const [x,rm] of WINDOWS){const r=roomClip(rm);ctx.save();ctx.beginPath();ctx.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]);ctx.clip();
    const sh=1-0.75*sunShade(x*T),y0=2*TH-2,g=ctx.createLinearGradient(0,y0,0,y0+76);g.addColorStop(0,`rgba(255,228,180,${0.22*sh})`);g.addColorStop(1,'rgba(255,228,180,0)');ctx.globalAlpha=1;ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(x*T+6,y0);ctx.lineTo(x*T+26,y0);ctx.lineTo(x*T+26+34,y0+76);ctx.lineTo(x*T+6+34,y0+76);ctx.closePath();ctx.fill();ctx.restore();}
  ctx.fillStyle='rgba(255,240,210,.85)';
  for(const d of DUST){d.u=(d.u+d.s)%1;const w=((d.v+Math.sin(frame/90+d.ph)*0.06)%1+1)%1;ctx.globalAlpha=0.55*(1-d.u)*Math.min(1,d.u*6);ctx.fillRect(Math.round(d.w*T+6+w*20+d.u*34),Math.round(2*TH-2+d.u*76),1,1);}
  // poeira no ar de cada sala, acesa onde há luz
  ctx.fillStyle='#fff4dc';for(const m of MOTES){const tw=0.5+0.5*Math.sin(frame/23+m.ph*7);ctx.globalAlpha=(m.r==='interro'?0.18:0.3)*tw;ctx.fillRect(Math.round(m.x),Math.round(m.y-m.z),1,1);}
  // reflexo das lâmpadas no piso encerado
  for(const l of LIGHTS)if(GLOSSY.has(l[5])&&l[2]>2.5){ctx.globalAlpha=0.07*l[4];const r=l[2]*T*0.55;ctx.drawImage(lightSprite([255,255,255]),l[0]*T-r,l[1]*TH-r*0.3,r*2,r*0.6);}
  // tela do monitor de Lemos, de frente, e o reflexo azul do da recepção
  {const on=0.75+0.25*Math.sin(frame/3)*Math.sin(frame/11);ctx.globalAlpha=0.55*on;ctx.drawImage(lightSprite([110,230,180]),19*T+6,4*TH-27,20,16);ctx.globalAlpha=0.25;ctx.fillStyle='#bfffe0';if(LODV>=2&&(frame>>4)%2)ctx.fillRect(19*T+9,4*TH-18,2,1);}
  // brasa do cigarro
  {const b=0.6+0.4*Math.sin(frame/9);ctx.globalAlpha=0.7*b;ctx.drawImage(lightSprite([255,130,60]),4*T+73,12*TH+22,9,8);}
  // cone da luminária na sala de depoimentos
  {const x=5.5*T+16,y=12*TH-8,g=ctx.createLinearGradient(0,y,0,y+60);g.addColorStop(0,'rgba(255,214,150,.16)');g.addColorStop(1,'rgba(255,214,150,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.lineTo(x+46,y+60);ctx.lineTo(x-46,y+60);ctx.closePath();ctx.fill();}
  for(const p of FXP){if(p.k!=='steam')continue;const k=1-p.t/p.life;ctx.globalAlpha=0.16*k;ctx.fillStyle='#eef2f6';const r=p.sz+p.t*0.05;ctx.beginPath();ctx.ellipse(p.x+Math.sin(p.t/8)*1.5,p.y-p.z,r,r,0,0,7);ctx.fill();}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
let FXP=[];
function updFX(){
  if(frame%9===0){for(const [x,y] of [[20*T+14,6*TH-19],[4*T+24,4*TH-9],[19*T+52,4*TH-8]])if(FXP.length<240)FXP.push({k:'steam',x:x+(Math.random()-0.5)*3,y,z:0,vz:0.22,t:0,life:56,sz:1.4});}
  for(const p of FXP){p.t++;if(p.k==='leaf'){if(p.y<p.gy){p.x+=p.vx+Math.sin(p.t/14+p.ph)*0.35;p.y+=p.vy;}continue;}p.z+=p.vz;p.x+=(p.vx||0)+(Math.random()-0.5)*0.15;}FXP=FXP.filter(p=>p.t<p.life);if(FXP.length>260)FXP.splice(0,FXP.length-260);
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
// sombra das coisas altas do pátio sob o sol
function castObj(o){
  const sp=o.spr,sl=silhouette(sp.c),base=(o.y+o.h)*TH+1;
  ctx.save();ctx.globalAlpha=0.28;ctx.translate(sp.x,base);ctx.transform(1,0,-SUN[0]*0.9,-SUN[1]*0.9*K,0,0);ctx.drawImage(sl,0,-sp.h,sp.w,sp.h);ctx.restore();
}
// nuvens: só a sombra delas, passando pelo pátio e mudando o sol das janelas
const CLOUDS=Array.from({length:4},(_,k)=>({x:(k*13-6)*T,y:(k%2?22:-4)*TH,r:(7+k%3*2)*T,v:0.12+k*0.03}));
function sunShade(wx){let m=0;for(const c of CLOUDS){const d=Math.hypot(wx-c.x,(-2*TH-c.y)*1.4)/c.r;if(d<1)m=Math.max(m,1-d*d);}return m;}
// ar parado: poeira em todas as salas
const MOTES=[];for(const r in ROOM_RECT){const q=ROOM_RECT[r];for(let k=0;k<14;k++)MOTES.push({r,x:(q[0]+Math.random()*(q[2]-q[0]+1))*T,y:(q[1]+Math.random()*(q[3]-q[1]+1))*TH,z:8+Math.random()*34,vx:(Math.random()-0.5)*0.05,vz:(Math.random()-0.5)*0.03,ph:Math.random()*6});}
// rua: carros dos dois lados
const TRAFFIC=[];let CARS=[],nextCar=120;
function buildTraffic(){
  for(const c of [['#3d6db0','#2c5389','#1f3d66'],['#8a2a2a','#6a2020','#4a1515'],['#d8d4c8','#b0aca0','#8a8678'],['#2f3a2f','#252e25','#1a201a'],['#c9a24a','#a8842e','#7a5e1e']]){
    const v=vCarSprite({b:c[0],sh:c[1],dk:c[2]},false),ww=82*0.82,hh=64*0.72,o=document.createElement('canvas');o.width=Math.ceil(ww*ART);o.height=Math.ceil(hh*ART);const g=o.getContext('2d');
    g.translate(o.width/2,o.height/2);g.rotate(-Math.PI/2);g.scale(0.72,0.82);g.drawImage(v,-v.width/2,-v.height/2);TRAFFIC.push({c:o,w:ww,h:hh});}
}
// pombos no pátio
const PIGEONS=Array.from({length:6},(_,k)=>newPigeon(k,true));
function newPigeon(k,ground){return {k,x:(3+Math.random()*28)*T,y:(19.3+Math.random()*3.2)*TH,z:ground?0:60+Math.random()*30,st:ground?'g':'land',dir:Math.random()<0.5?-1:1,t:Math.floor(Math.random()*90),vx:0,vy:0,away:0};}
// piso molhado deixado pelo rodo
let WETS=[];
// porta de vidro que abre sozinha
let doorOpen=0;
function updAtmo(){
  for(const c of CLOUDS){c.x+=c.v;if(c.x-c.r>(W+6)*T)c.x=-12*T;}
  for(const m of MOTES){m.x+=m.vx+Math.sin(frame/140+m.ph)*0.03;m.z+=m.vz+Math.sin(frame/90+m.ph)*0.02;const q=ROOM_RECT[m.r];if(m.x<q[0]*T)m.x=(q[2]+1)*T;if(m.x>(q[2]+1)*T)m.x=q[0]*T;if(m.z<4||m.z>46)m.vz=-m.vz;}
  // carros
  if(--nextCar<=0){nextCar=240+Math.random()*420;const r=Math.random()<0.5;CARS.push({spr:pick(TRAFFIC),dir:r?1:-1,x:r?-4*T:(W+4)*T,y:r?25.7*TH:24.5*TH,v:(1.1+Math.random()*0.7)});}
  for(const c of CARS)c.x+=c.v*c.dir;CARS=CARS.filter(c=>c.x>-6*T&&c.x<(W+6)*T);
  // pombos: bicam, andam e voam quando Lemos chega perto
  for(const b of PIGEONS){
    b.t++;
    if(b.st==='g'){if(Math.hypot(P1.x*T+16-b.x,(P1.y*TH+TH)-b.y)<48&&started){b.st='fly';b.vx=(b.x>P1.x*T+16?1:-1)*(1.4+Math.random());b.vy=-0.5-Math.random()*0.5;b.dir=Math.sign(b.vx);b.away=0;}
      else if(b.t%120===60&&Math.random()<0.5){b.dir=-b.dir;}else if(b.t%40<6)b.x+=b.dir*0.25;}
    else if(b.st==='fly'){b.x+=b.vx;b.y+=b.vy;b.z+=1.1;b.away++;if(b.away>260){Object.assign(b,newPigeon(b.k,false));}}
    else if(b.st==='land'){b.z-=0.8;b.x+=b.dir*0.4;if(b.z<=0){b.z=0;b.st='g';}}
  }
  // folhas caindo das árvores
  if(Math.random()<0.04){const tr=objs.filter(o=>o.t==='tree'&&!o.far);if(tr.length){const o=pick(tr);FXP.push({k:'leaf',x:o.x*T+16+(Math.random()-0.5)*30,y:(o.y+1)*TH-50+Math.random()*12,gy:(o.y+1)*TH+Math.random()*30,vx:0.12+Math.random()*0.2,vy:0.25+Math.random()*0.2,t:0,life:520,c:pick(['#4a8a3c','#69ad52','#c9a040','#a8642a']),ph:Math.random()*6});}}
  // cigarro no cinzeiro da sala de depoimentos
  if(frame%7===0)FXP.push({k:'smoke',x:4*T+77,y:12*TH+26,z:2,vz:0.16,t:0,life:240,sz:0.8,ph:Math.random()*6});
  // passos levantam poeira lá fora
  if(P1.moving&&!INSIDE(roomOf(P1))&&frame%10===0)for(let k=0;k<2;k++)FXP.push({k:'puff',x:P1.x*T+16+(Math.random()-0.5)*6,y:P1.y*TH+TH-3,z:1,vz:0.1,vx:(Math.random()-0.5)*0.2,t:0,life:28,sz:1.4});
  // rodo da faxineira
  for(const n of NPCS)if(n.mop&&n.moving&&frame%8===0&&WETS.length<70)WETS.push({x:n.x*T+16+n.dir*9,y:n.y*TH+TH-3,t:0,life:1400,rx:7+Math.random()*4});
  for(const w of WETS)w.t++;WETS=WETS.filter(w=>w.t<w.life);
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
  for(let i=0;i<17;i++){const ph=frame/7-i*0.5,dy=Math.sin(ph)*1.6*(i/16);ctx.drawImage(cl,i*ART,0,ART,12*ART,X+17+i,Y+3+dy,1.05,12);if(Math.cos(ph)<-0.3){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(X+17+i,Y+3+dy,1,12);}else if(Math.cos(ph)>0.7){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(X+17+i,Y+3+dy,1,12);}}
  ctx.fillStyle='#1e1611';ctx.fillRect(X+16,Y+3,1,12);
}
function drawCar2(c){
  const s=c.spr,X=DP(c.x-s.w/2),Y=DP(c.y-s.h);
  ctx.globalAlpha=0.3;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(c.x+4,c.y-4,s.w*0.5,8,0,0,7);ctx.fill();ctx.globalAlpha=1;
  if(c.dir<0){ctx.save();ctx.translate(c.x,0);ctx.scale(-1,1);ctx.drawImage(s.c,-s.w/2,Y,s.w,s.h);ctx.restore();}else ctx.drawImage(s.c,X,Y,s.w,s.h);
}
function drawPigeon(b){
  const X=b.x,Y=b.y,z=b.z,d=b.dir,y=Y-z-5,peck=b.st==='g'&&(b.t%50)<8,fly=b.st!=='g',up=(frame>>2)%2;
  ctx.save();ctx.globalAlpha=0.28*Math.max(0.2,1-b.z/90);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X,Y,4.5,1.4,0,0,7);ctx.fill();ctx.restore();
  ctx.save();ctx.translate(X,y);ctx.scale(d,1);
  if(fly){ctx.fillStyle='#a3a9b0';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(-1,0);ctx.quadraticCurveTo(-3,up?-6:4,s*1-5,up?-5:5);ctx.quadraticCurveTo(-1,up?-2:2,1,0);ctx.fill();}}
  const gb=ctx.createLinearGradient(0,-3,0,3);gb.addColorStop(0,'#a9afb6');gb.addColorStop(1,'#6f757c');ctx.fillStyle=gb;ctx.beginPath();ctx.ellipse(0,0,4.4,2.8,-0.1,0,7);ctx.fill();
  ctx.fillStyle='#5a6068';ctx.beginPath();ctx.moveTo(-3.5,-0.5);ctx.lineTo(-7,0.6);ctx.lineTo(-3.4,1.6);ctx.fill();
  ctx.fillStyle='#8f969e';ctx.beginPath();ctx.ellipse(-0.6,-0.4,2.6,1.4,-0.2,0,7);ctx.fill();
  const hx=3.4,hy=peck?2.2:-2.6;ctx.fillStyle='#55606a';ctx.beginPath();ctx.ellipse(hx,hy,1.8,1.7,0,0,7);ctx.fill();ctx.fillStyle='rgba(95,170,140,.8)';ctx.beginPath();ctx.ellipse(hx-0.6,hy+1.4,1.2,0.8,0,0,7);ctx.fill();
  ctx.fillStyle='#f0e8d0';ctx.beginPath();ctx.arc(hx+0.5,hy-0.4,0.45,0,7);ctx.fill();ctx.fillStyle='#c97a3a';ctx.beginPath();ctx.moveTo(hx+1.6,hy-0.2);ctx.lineTo(hx+2.8,hy+0.3);ctx.lineTo(hx+1.6,hy+0.7);ctx.fill();
  if(!fly){ctx.strokeStyle='#c97a3a';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(-0.6,2.4);ctx.lineTo(-0.8,4.6);ctx.moveTo(0.8,2.4);ctx.lineTo(0.9,4.6);ctx.stroke();}
  ctx.restore();
}
function drawDoor(){
  const X=15*T,Y=18*TH+12,o=doorOpen*22;
  ctx.fillStyle='#23272b';ctx.fillRect(X,Y,2*T,36);ctx.fillStyle='#3a332a';ctx.fillRect(X+4,Y+3,2*T-8,28);ctx.fillStyle='#4a4236';ctx.fillRect(X+4,Y+3,2*T-8,2);
  ctx.save();ctx.beginPath();ctx.rect(X+2,Y+1,2*T-4,33);ctx.clip();
  for(const [x0,s] of [[X+4-o,-1],[X+34+o,1]]){ctx.fillStyle='#14171a';ctx.fillRect(x0-1,Y+2,28,30);ctx.fillStyle='rgba(111,147,179,.88)';ctx.fillRect(x0,Y+3,26,28);ctx.fillStyle='#a7c6dc';ctx.fillRect(x0+2,Y+5,8,10);ctx.fillStyle='#5f86a8';ctx.fillRect(x0+14,Y+17,10,12);ctx.fillStyle='#dbe6ee';ctx.fillRect(x0,Y+3,26,2);ctx.fillStyle='#1c2024';ctx.fillRect(x0,Y+29,26,2);ctx.fillStyle='#c9ccce';ctx.fillRect(x0+(s<0?24:0),Y+13,2,9);}
  ctx.restore();ctx.fillStyle='#c9a24a';ctx.fillRect(X+2,Y+32,2*T-4,4);
}
function smokePass(){
  for(const p of FXP){const k=1-p.t/p.life;
    if(p.k==='smoke'){const curl=Math.sin(p.t/22+p.ph)*(2+p.t*0.03);ctx.globalAlpha=0.16*k*Math.min(1,p.t/12);ctx.fillStyle='#d8dde2';const r=p.sz+p.t*0.035;ctx.beginPath();ctx.ellipse(p.x+curl,p.y-p.z,r*1.3,r,0,0,7);ctx.fill();}
    else if(p.k==='puff'){ctx.globalAlpha=0.3*k;ctx.fillStyle='#b8b0a0';const r=p.sz+p.t*0.06;ctx.beginPath();ctx.ellipse(p.x,p.y-p.z,r,r*0.7,0,0,7);ctx.fill();}
    else if(p.k==='leaf'){const fade=p.y>=p.gy?Math.min(1,(p.life-p.t)/80):1;ctx.globalAlpha=fade;ctx.fillStyle=p.c;const fl=Math.sin(p.t/6+p.ph)>0;ctx.fillRect(Math.round(p.x),Math.round(p.y),fl?2:1,1);}}
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
const PSC=1.17; // escala da figura vetorial para a altura das pessoas no mapa
function personPose(p,sit){return sit?'sit':p.moving?'walk':'stand';}
function drawPerson(p,sit,id){
  const X=DP(p.x*T+16),Y=DP(p.y*TH+TH-2),pose=personPose(p,sit),view=p.face==='back'&&!sit?'back':'front',ph=p.walk*Math.PI*1.6;
  const blink=!p.moving&&((frame+(id||0)*53)%190)<6;
  const typing=sit&&p.act==='type'&&((frame>>2)+id)%6<2?-0.5:0;
  if(!sit){
    if(GLOSSY.has(room[ti(p)])){ctx.save();ctx.globalAlpha=0.13;ctx.translate(X,Y+1);ctx.scale(p.dir<0?-PSC:PSC,-PSC*0.6);vPerson(ctx,p.look,pose,view,ph,false);ctx.restore();}
    const c=castFrom(p);if(c){const cc=-c.dx*c.len/45,dd=-Math.max(0.08,Math.abs(c.dy))*Math.sign(c.dy||1)*c.len*K/45;ctx.save();ctx.globalAlpha=c.a;ctx.translate(X,Y);ctx.transform(1,0,cc,dd,0,0);ctx.scale(PSC,PSC);vPerson(ctx,p.look,pose,view,ph,false,'#000');ctx.restore();}
    ctx.save();ctx.globalAlpha=0.32;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X,Y-0.5,9,3,0,0,7);ctx.fill();ctx.restore();
  }
  ctx.save();ctx.translate(X,Y+(sit?0:0)+typing);ctx.scale(p.dir<0?-PSC:PSC,PSC);vPerson(ctx,p.look,pose,view,ph,blink);
  if(p.mop)vMop(ctx,1,ph,p.moving);
  ctx.restore();
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
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,cv.width,cv.height);
  const s=cam.z*dpr,ox=Math.round(cv.width/2-cam.x*s),oy=Math.round(cv.height/2-cam.y*s);
  LODE=s/dpr;LODV=lodOf(LODE);SC=s;UIK=Math.min(1,2.2/LODE);
  const SPR=()=>{ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=true;};
  VIEW={x0:-ox/s-2,x1:(cv.width-ox)/s+2,y0:-oy/s-2,y1:(cv.height-oy)/s+2};
  {const gc=(!ZA&&!pinch)?groundAt(s):null;
   if(gc){ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;const sx=Math.max(0,-ox),sy=Math.max(0,-oy),dx=Math.max(0,ox),dy=Math.max(0,oy),sw=Math.min(gc.c.width-sx,cv.width-dx),sh=Math.min(gc.c.height-sy,cv.height-dy);if(sw>0&&sh>0)ctx.drawImage(gc.c,sx,sy,sw,sh,dx,dy,sw,sh);}
   else{ctx.setTransform(s,0,0,s*K,ox,oy);ctx.imageSmoothingEnabled=true;dV(BG,0,0,VIEW.y0/K,VIEW.y1/K);}}SPR();drawFloorFX();
  const rows={};const R=k=>rows[k]||(rows[k]={o:[],p:[]});
  for(const o of objs)if(o.spr)R(o.y+o.h-1).o.push(o);
  for(const n of NPCS)R(Math.round(n.y)).p.push([n,!!n.sit&&!n.moving&&isSeat(n),n.k]);
  R(Math.round(P1.y)).p.push([P1,false,9]);
  VIS.forEach((v,k)=>R(v.y).p.push([v,true,20+k]));
  for(const c of CARS){const k=clamp(Math.floor(c.y/TH),0,H-1);(R(k).x||(R(k).x=[])).push(()=>drawCar2(c));}
  for(const b of PIGEONS){const k=clamp(Math.floor(b.y/TH),0,H-1);(R(k).x||(R(k).x=[])).push(()=>drawPigeon(b));}
  const y0=Math.max(0,Math.floor(-oy/s/TH)-4),y1=Math.min(H-1,Math.ceil((cv.height-oy)/s/TH)+4);
  for(let y=y0;y<=y1;y++){
    if(WALLROWS[y])dV(WALLROWS[y],0,y*TH-RISE,VIEW.y0,VIEW.y1);
    if(y===1)drawClockHands();
    if(y===18){drawDoor();dI(SIGN,13*T,18*TH-8);}
    const r=rows[y];if(!r)continue;
    for(const o of r.o){if(o.nocc)ctx.drawImage(o.spr.c,o.spr.x,o.spr.y,o.spr.w,o.spr.h);}
    for(const o of r.o){if(!o.nocc){ctx.drawImage(o.spr.c,o.spr.x,o.spr.y,o.spr.w,o.spr.h);if(o.t==='flag')drawFlagCloth(o);}}
    r.p.sort((a,b)=>a[0].y-b[0].y);
    // quem está sentado atrás de uma mesa é desenhado antes dela (a mesa fica na fileira de baixo)
    for(const [p,sit,k] of r.p)drawPerson(p,sit,k);
    if(r.x)for(const f of r.x)f();
  }
  // luminária pendente da sala de depoimentos
  ctx.fillStyle='#1c1e20';ctx.fillRect(5.5*T+15,10*TH-RISE,1,2*TH-6);dI(LAMP,5.5*T+5,12*TH-30);
  micro();
  // destino do toque
  if(P1.path.length&&started){const e=P1.path[P1.path.length-1],X=(e%W)*T+16,Y=((e/W)|0)*TH+TH/2;ctx.strokeStyle='rgba(242,194,48,.9)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.lineDashOffset=-(frame>>2);ctx.beginPath();ctx.ellipse(X,Y,10,4.5,0,0,7);ctx.stroke();ctx.setLineDash([]);}
  lightPass(s,ox,oy);
  SPR();smokePass();glowPass();
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
function loop(now){
  if(depoOpen){last=now;requestAnimationFrame(loop);return;}
  const dt=Math.min(0.1,(now-last)/1000);last=now;
  update(dt);updFX();updAtmo();stepZoom();followCam(dt);frame++;render();if(frame%6===0)updateUI();
  requestAnimationFrame(loop);
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
  dpr=Math.min(window.devicePixelRatio||1,3);cv.width=Math.round(VW()*dpr);cv.height=Math.round(VH()*dpr);lc.width=Math.ceil(cv.width/LS);lc.height=Math.ceil(cv.height/LS);
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
$('#b-start').addEventListener('click',()=>{
  $('#intro').hidden=true;started=true;
  const e=bfs(ti(P1),i=>i===idx(16,15),walkPass);if(e>=0)P1.path=pathTo(e);
  setTimeout(()=>toast('Sônia Prado','Lemos, na minha sala. A equipe já está com o material da casa.',{img:'/sonia.jpg',col:'#c9a24a'}),1200);
});
window.__base={startDepo,get CASE(){return CASE;},VIS:()=>VIS,get P1(){return P1;},NPCS:()=>NPCS,cam,goTalk,goTile,openTalk,openGallery,FOUND,get started(){return started;},objs:()=>objs,tap,idx,W,H,T,TH,ti,passable,zoomTo,get ROT(){return ROT;},get LODV(){return LODV;},get FITZ(){return FITZ;}};
requestAnimationFrame(loop);
})();
