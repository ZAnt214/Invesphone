/* Rua do DHPP — direção aprovada em 11/10/2026 (docs/RUA_BEATCOP_BASE.md): perspectiva de Beat Cop (fachadas de
   frente até o topo da tela, calçada vista de cima, rua horizontal com os carros de lado) no VISUAL DA PLANTA DA BASE:
   a mesma paleta, as janelas brancas com ar-condicionado, a fachada bege do DHPP com o letreiro, a porta e as bandeiras da
   própria base, e os mesmos bonecos de dentro (46 px). Carros, mobiliário e efeitos são os PNGs oficiais de public/base/rua/.
   Lemos anda pela calçada; tocando no DHPP ele vai até a porta e entra (a planta da base, em base.js).

   Render (docs/GRAPHICS_UPGRADE.md): camada estática pintada uma vez (fachadas e chão, com relevo e sombras próprias);
   por quadro, sombras projetadas de tudo que está em pé numa camada de meia resolução (suave e barata), luzes que emitem
   (neon, arandelas, giroflex) somadas por cima, e a luz da manhã. Escala inteira de pixel e corte do que está fora da tela.
   A qualidade escolhida pelo jogador (src/characters/quality.ts) decide o que entra: baixa = só o essencial (sem sombras
   projetadas, brilhos nem vapor); média = sombras, luzes que emitem e vapor; alta = mais os fachos de luz e a poeira no ar. */
import {GY,CURB,ROAD,NEAR,STREET_H,WALK,PARK,LANES,SUN,TREES,MANHOLES,rnd,paintFacades,paintGround} from './streetArt';
import {RUA_DIR,VEICULOS,PATH} from './ruaAssets';
import {choose,eventLog,jitter} from '../world/life';
import {CAMERA_PRIORITY,createCameraControl,damp,deadZoneTarget,drawCameraDebug} from '../camera/cameraDirector';
export {STREET_H};

/* ---------- o quarteirão, da esquerda para a direita ---------- */
const LOT=[
  {k:'grocery',w:240,brick:'#8a3a2c',name:'GROCERY',signc:'#2f5a3a',ink:'#f1e6c8',awn:'#2f5a3a',fire:true},
  {k:'apt',w:260,brick:'#8e4434',door:'#2f4a3a',fire:true},
  {k:'diner',w:280,brick:'#9a3f30',name:'DINER',signc:'#b02a24',ink:'#f6f0e2',awn:'#b02a24'},
  {k:'alley',w:110},
  {k:'dhpp',w:620},
  {k:'alley',w:60},
  {k:'pawn',w:250,brick:'#b09a6a',name:'PAWN SHOP',signc:'#f2efe6',ink:'#a82a24',fire:true},
  {k:'laundry',w:240,brick:'#7a5a42',name:'LAUNDRY',signc:'#2e4a8a',awn:'#2e4a8a'},
  {k:'apt',w:180,brick:'#a0603a',door:'#5a2a22'},
  {k:'barber',w:240,brick:'#8e3b2c',name:'BARBER',signc:'#e8e2d4',ink:'#7a2a2a',fire:true}
];
let acc=0;export const BUILDINGS=LOT.map((b,i)=>{const o={...b,i,X:acc};acc+=b.w;return o;});
export const STREET_W=acc;
export const DHPP=BUILDINGS.find(b=>b.k==='dhpp');
export const DOOR={x:DHPP.X+DHPP.w/2,y:GY+14};          // a porta do DHPP (o pé dos degraus)

/* ---------- mobiliário oficial (pé no centro da última linha), na beira da calçada, encostado nas fachadas ou nos becos ---------- */
const cy=CURB-6,fy=GY+22,ny=STREET_H-14;
const ALLEYS=BUILDINGS.filter(b=>b.k==='alley');
const PROPS=[
  {k:'poste-luz',x:200,y:cy},{k:'poste-luz',x:780,y:cy},{k:'poste-luz',x:1560,y:cy},{k:'poste-luz',x:2140,y:cy},
  {k:'parquimetro',x:90,y:cy},{k:'parquimetro',x:470,y:cy},{k:'parquimetro',x:640,y:cy},{k:'parquimetro',x:1430,y:cy},{k:'parquimetro',x:1700,y:cy},{k:'parquimetro',x:1980,y:cy},{k:'parquimetro',x:2380,y:cy},
  {k:'hidrante',x:1240,y:cy},{k:'caixa-correio',x:330,y:cy-2},{k:'lixeira',x:560,y:cy-4},{k:'placa-proibido',x:930,y:cy},{k:'placa-proibido',x:1500,y:cy},
  {k:'sacos-lixo',x:820,y:fy},{k:'lixeira-cheia',x:868,y:fy},{k:'sacos-lixo',x:1540,y:fy},{k:'telefone-publico',x:1810,y:fy+2},
  {k:'jornal-azul',x:1592,y:fy+8},{k:'jornal-vermelho',x:1614,y:fy+8},{k:'banco',x:1010,y:fy+4},{k:'caixa-papelao',x:236,y:fy+6},
  // dentro dos becos
  {k:'cacamba',x:ALLEYS[0].X+ALLEYS[0].w/2+6,y:GY-16,dark:.35},{k:'pallet',x:ALLEYS[1].X+ALLEYS[1].w/2,y:GY-24,dark:.45},{k:'alarme-incendio',x:ALLEYS[0].X+14,y:GY-4,dark:.2},
  // calçada de cá (embaixo)
  {k:'placa-onibus',x:300,y:ny},{k:'banco',x:370,y:ny-4},{k:'poste-luz',x:1100,y:ny+8},{k:'lixeira-cheia',x:1460,y:ny-2},{k:'jornal-vermelho',x:1800,y:ny-2}
];
const PROP_S=1.3,CAR_S=1.2;

/* ---------- arte oficial (carros, mobiliário, chão e efeitos) ---------- */
// eslint-disable-next-line no-undef
const HAS=new Set(typeof __RUA_ART__!=='undefined'?__RUA_ART__:[]);
const IMG=new Map();
function art(path){if(!HAS.has(path))return null;let im=IMG.get(path);if(!im){im=new Image();im.decoding='async';im.src=RUA_DIR+path;IMG.set(path,im);}return im.complete&&im.naturalWidth?im:null;}
const NEED=[...PROPS.map(p=>PATH.prop(p.k)),...Object.keys(VEICULOS).map(PATH.veiculo),PATH.efeito('vapor-bueiro'),PATH.efeito('fumaca-escape'),PATH.efeito('pombo'),
  'chao/manchas.png','chao/lixo-chao.png','chao/bueiro.png','chao/boca-de-lobo.png'];
export function preloadRua(){return Promise.all([...new Set(NEED)].filter(p=>HAS.has(p)).map(p=>new Promise(r=>{art(p);const im=IMG.get(p);if(!im||im.complete)return r();im.onload=im.onerror=()=>r();})));}

/* ---------- gente: os bonecos da planta, com as cores de cada um ---------- */
const PED_LOOKS=[
  {skin:'#d9a273',hair:'#2a1d18',style:'short',kind:'rua',top:'#5a5e66',pants:'#3a3e46',shoes:'#222'},
  {skin:'#a8714a',hair:'#1f1a18',style:'short',kind:'rua',top:'#e8e4da',pants:'#3b5a8a',shoes:'#e8e4da'},
  {skin:'#f0c9a0',hair:'#4a2f1d',style:'long',kind:'rua',top:'#b8302a',pants:'#b8302a',shoes:'#222'},
  {skin:'#f0c9a0',hair:'#d8b860',style:'long',kind:'rua',top:'#e8e2d4',pants:'#5a4a3a',shoes:'#3a2416'},
  {skin:'#8a5a3a',hair:'#1f1a18',style:'cap',kind:'rua',top:'#3b5a8a',pants:'#3a3a40',shoes:'#e8e4da'},
  {skin:'#e8b58e',hair:'#9a9a9a',style:'grey',kind:'rua',top:'#6a5a3a',pants:'#3a4a5a',shoes:'#222'},
  {skin:'#c98e64',hair:'#2a1d18',style:'cap',kind:'rua',top:'#8a6a3a',pants:'#3a3a32',shoes:'#3a2416'},
  {skin:'#e0b48c',hair:'#bcbcbc',style:'bun',kind:'rua',top:'#6a4a6a',pants:'#3a3a40',shoes:'#222'},
  {skin:'#b67c52',hair:'#1f1a18',style:'side',kind:'rua',top:'#1c1d20',pants:'#2b2f36',shoes:'#111'},
  {skin:'#6e4630',hair:'#1f1a18',style:'curly',kind:'rua',top:'#2f6a4a',pants:'#3b5a8a',shoes:'#e8e4da'},
  {skin:'#e0b48c',hair:'#4a2f1d',style:'short',kind:'rua',top:'#8a2a2a',pants:'#2b2f36',shoes:'#e8e4da'},
  {skin:'#d9a273',hair:'#2a1d18',style:'bun',kind:'rua',top:'#2e4a8a',pants:'#2e4a8a',shoes:'#222'}
];
const NEAR_WALK=[NEAR+40,STREET_H-12];

/* ---------- caches de luz e sombra (feitos uma vez por imagem) ---------- */
const SIL=new WeakMap();      // silhueta escura de um sprite (para a sombra projetada)
function silhouette(im){let c=SIL.get(im);if(c)return c;c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,c.width,c.height);SIL.set(im,c);return c;}
const SHADED=new WeakMap();   // carro oficial com volume: o teto pega o céu, a parte de baixo escurece (sem mudar o desenho)
function shaded(im){let c=SHADED.get(im);if(c)return c;c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';
  const gr=g.createLinearGradient(0,0,0,c.height);gr.addColorStop(0,'rgba(255,250,240,.16)');gr.addColorStop(.35,'rgba(255,250,240,0)');gr.addColorStop(.7,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(10,10,20,.26)');g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);SHADED.set(im,c);return c;}
const DIMMED=new Map();       // objeto dentro do beco: mais escuro
function dimmed(im,a){const k=im.src+a;let c=DIMMED.get(k);if(c)return c;c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-atop';g.fillStyle=`rgba(16,12,12,${a})`;g.fillRect(0,0,c.width,c.height);DIMMED.set(k,c);return c;}
const GLOW={};                // brilho radial de uma cor (somado com 'lighter')
function glowSprite(col){if(GLOW[col])return GLOW[col];const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);
  gr.addColorStop(0,col);gr.addColorStop(.35,col.replace(/[\d.]+\)$/,m=>(parseFloat(m)*.45)+')'));gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return GLOW[col]=c;}
const rgba=(hex,a)=>{const h=hex.replace('#','');return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;};
const RM=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/** art: as funções de desenho da base (S2, bush…) e o letreiro e a porta dela; quality(): 'low'|'medium'|'high' */
export function createStreet({lemosLook,onEnter,getZoom,personFrames,art:A,quality,onSound}){
  const Q=()=>{const q=quality?quality():'high';return q==='low'?0:q==='medium'?1:2;};
  let layer=buildStatic();
  const ready=preloadRua().then(()=>{layer=buildStatic();});

  function buildStatic(){
    const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
    const sky=g.createLinearGradient(0,0,0,200);sky.addColorStop(0,'#8fa9c4');sky.addColorStop(1,'#d8d4cc');g.fillStyle=sky;g.fillRect(0,0,STREET_W,GY);
    paintFacades(g,BUILDINGS,A,{sign:A.sign(),door:A.door()});
    paintGround(g,STREET_W,art);
    return cv;
  }

  /* ---------- árvores da calçada: tronco e copa da planta (mesmo `bush`), a copa balança com o vento ---------- */
  const trees=TREES.map((t,i)=>{const r=A.mulberry32?A.mulberry32(91+i*17):Math.random;
    const trunk=A.S2(20,80,(P)=>{P(6,0,8,80,'#4a3020');P(6,0,3,80,'#6a4a2c');P(13,0,1,80,'#2e1e14');for(let k=8;k<80;k+=11)P(7,k,6,1,'#3a2618');P(3,74,14,6,'#3a2618');P(4,30,3,2,'#3a2618');P(13,46,3,2,'#3a2618');});
    const crown0=A.S2(124,104,(P,E)=>{const pal=['#1f3f1c','#2f5f2a','#3f7d37','#5aa04a','#7fc363'];A.bush(P,E,36,64,32,r,pal);A.bush(P,E,88,62,32,r,pal);A.bush(P,E,62,44,40,r,pal);A.bush(P,E,62,72,30,r,pal);});
    return {...t,trunk,crown:A.outlined?A.outlined(crown0):crown0,ph:i*1.7};});

  /* ---------- gente, carros e bichos ----------
     Mundo vivo (docs/LIVING_WORLD_SYSTEM.md): cada pedestre tem um jeito (pressa, quanto conversa, curiosidade) e escolhe
     o que fazer por peso, sem repetir o que acabou de fazer: passear, entrar numa loja e sair depois, olhar vitrine,
     pegar jornal, usar o telefone público, sentar no banco, esperar o ônibus, chamar um táxi, atravessar a rua quando o
     trânsito deixa, ir embora (e voltar mais tarde por uma das pontas). Conversas surgem quando dois se cruzam. */
  const R=rnd(17);
  const lemos={x:DOOR.x-150,y:WALK[0]+40,dir:1,walk:0,moving:false,look:lemosLook,frames:personFrames(lemosLook),tx:null,ty:null,enter:false,climb:0};
  const FAR=[GY+30,CURB-28],NEARB=[NEAR+30,STREET_H-16];
  const DOORS=[],PANES=[],DRUMS=[];
  for(const b of BUILDINGS){if(b.k!=='dhpp')for(const d of b.doors||[])DOORS.push({...d,shop:b.k,open:0});for(const p of b.panes||[])PANES.push({...p,shop:b.k});for(const d of b.drums||[])DRUMS.push(d);}
  const SPOTS={paper:{x:1603,y:fy+12,busy:null},phone:{x:1824,y:fy+8,busy:null},bench:[{x:1000,y:fy+5,busy:null},{x:1020,y:fy+5,busy:null}],
    busBench:[{x:360,y:ny-3,busy:null},{x:380,y:ny-3,busy:null}],busStand:[{x:300,y:ny-8},{x:318,y:ny-6},{x:336,y:ny-9}]};
  const STOP_X=330;                                   // ponto de ônibus (calçada de cá)
  const GAPS=[[380,930],[1420,1490],[1930,1990]];     // trechos de meio-fio sem carro estacionado (táxi e travessia)
  const gapX=()=>{const g=GAPS[Math.floor(R()*GAPS.length)];return g[0]+R()*(g[1]-g[0]);};
  const life=eventLog(16);
  const peds=Array.from({length:16},(_,i)=>{const look=PED_LOOKS[i%PED_LOOKS.length],near=i>=12,band=near?NEARB:FAR;
    const rush=i%7===3;
    return {id:i,x:R()*STREET_W,y:band[0]+R()*(band[1]-band[0]),near,dir:R()<.5?-1:1,v:rush?30+R()*6:14+R()*10,walk:R()*10,look,frames:personFrames(look),
      st:'idle',t:R()*4,after:'decide',tx:null,ty:null,pose:null,sit:false,hidden:false,off:0,mem:{},social:.2+R()*.8,curious:R(),
      chatCD:20+R()*40,glanceCD:0,talk:0,spot:null,shop:null,door:null,dodge:0};});
  const meta=id=>VEICULOS[id];
  const W=k=>meta(k.id).w*CAR_S;
  const parked=[{id:'viatura-dhpp',x:DOOR.x-W({id:'viatura-dhpp'})/2,y:PARK},{id:'sedan-bordo',x:40,y:PARK},{id:'perua-madeira',x:1620,y:PARK},{id:'sedan-bege',x:2120,y:PARK}];
  const viatura=parked[0];
  const cars=[];const moving=['taxi','sedan-azul','furgao-marrom','sedan-verde','taxi','sedan-bordo','onibus','sedan-bege'];
  for(let l=0;l<LANES.length;l++)for(let i=0;i<3;i++){const id=moving[(l*3+i)%moving.length],v=LANES[l].v*(0.85+R()*0.3);cars.push({id,lane:l,x:i*STREET_W/3+R()*200,v,v0:v,pv:v,puff:R(),brake:0});}
  const puffs=[];
  const birds=Array.from({length:6},()=>({x:300+R()*(STREET_W-600),y:WALK[0]+10+R()*(WALK[1]-WALK[0]-20),z:0,dir:R()<.5?-1:1,st:'g',t:R()*40,vx:0,vz:0}));
  // poeira no ar, só visível contra a luz (qualidade alta): poucas partículas, recicladas
  const motes=Array.from({length:28},()=>({x:R(),y:R(),v:.3+R()*.7,p:R()*6.28}));
  const camera=createCameraControl({manualHold:2600,reducedMotion:RM});
  const cameraDebug=/[?&]cameraDebug=1(?:&|$)/.test(location.search);
  let camX=lemos.x,camY=null,camZoom=1,cameraDt=1/60,cameraInfo=null,gesture=null,lastTap=null,doorFocus=false,t=0,doorT=0,tapFx=null,busT=25+R()*30,bus=null,taxiJob=null;
  const sound=(k,x,a)=>{if(onSound)onSound(k,x,a);};

  // lista de desenho reaproveitada entre quadros (sem criar funções por quadro); ordenada pelo pé (y)
  const ENTS=[];const ent=(k,ref,y)=>({k,ref,y});
  for(const p of PROPS)ENTS.push(ent('prop',p,p.y));
  for(const tr of trees)ENTS.push(ent('tree',tr,tr.y));
  for(const p of peds)ENTS.push(ent('ped',p,p.y));
  ENTS.push(ent('ped',lemos,lemos.y));
  for(const p of parked)ENTS.push(ent('car',p,p.y));
  for(const k of cars)ENTS.push(ent('car',k,LANES[k.lane].y));
  for(const b of birds)ENTS.push(ent('bird',b,b.y));
  for(const m of MANHOLES.slice(0,1))ENTS.push(ent('steam',m,m.y));

  /* ---------- pedestres ---------- */
  const go=(p,x,y,after)=>{p.tx=x;p.ty=y;p.st='walk';p.after=after;p.pose=null;p.sit=false;};
  const idle=(p,s,pose,after='decide')=>{p.st='idle';p.t=s;p.pose=pose||null;p.after=after;p.moving=false;};
  const band=p=>p.near?NEARB:FAR;
  const free=s=>!s.busy;
  // cada lugar só atrai quem está por perto (ninguém atravessa a rua inteira para pegar um jornal)
  const close=(c,x,r=520)=>Math.abs(c.p.x-x)<r;
  const OPTS=[
    {id:'stroll',w:3},
    {id:'shop',w:c=>c.near?0:1.0,cool:70},
    {id:'browse',w:c=>c.near?0:1.1+c.p.curious,cool:40},
    {id:'paper',w:c=>c.near||SPOTS.paper.busy||!close(c,SPOTS.paper.x)?0:.6,cool:120},
    {id:'phone',w:c=>c.near||SPOTS.phone.busy||!close(c,SPOTS.phone.x)?0:.5,cool:150},
    {id:'bench',w:c=>c.near||!SPOTS.bench.some(free)||!close(c,1010)?0:.7,cool:100},
    {id:'bus',w:c=>!c.near||bus&&bus.st!=='run'||!close(c,STOP_X,900)?0:1.6,cool:60},
    {id:'cross',w:.45,cool:80},
    {id:'taxi',w:c=>c.near||taxiJob||t<20?0:.22,cool:240},
    {id:'leave',w:.25,cool:30}];
  function decide(p){
    const o=choose(R,OPTS,{near:p.near,p},p.mem,t);const k=o?o.id:'stroll';
    const B=band(p),ry=()=>B[0]+R()*(B[1]-B[0]);
    switch(k){
      case 'stroll':{const d=R()<.7?p.dir:-p.dir;go(p,clamp(p.x+d*(150+R()*600),40,STREET_W-40),ry(),'pause');break;}
      case 'shop':{const ds=DOORS.filter(d=>Math.abs(d.x-p.x)<600),d=(ds.length?ds:DOORS)[Math.floor(R()*(ds.length||DOORS.length))];p.door=d;go(p,d.x,GY+16,'enter');break;}
      case 'browse':{const ws=PANES.filter(w=>Math.abs(w.x-p.x)<600),w=(ws.length?ws:PANES)[Math.floor(R()*(ws.length||PANES.length))];go(p,w.x+(R()-.5)*w.w*.5,GY+18+R()*4,'browse');break;}
      case 'paper':SPOTS.paper.busy=p;p.spot=SPOTS.paper;go(p,SPOTS.paper.x,SPOTS.paper.y,'paper');break;
      case 'phone':SPOTS.phone.busy=p;p.spot=SPOTS.phone;go(p,SPOTS.phone.x,SPOTS.phone.y,'phone');break;
      case 'bench':{const s=SPOTS.bench.find(free);s.busy=p;p.spot=s;go(p,s.x,s.y,'sit');break;}
      case 'bus':{const s=SPOTS.busBench.find(free);if(s){s.busy=p;p.spot=s;go(p,s.x,s.y,'busSit');}else{const q=SPOTS.busStand[Math.floor(R()*3)];go(p,q.x+(R()-.5)*8,q.y,'busWait');}break;}
      case 'cross':{let x=gapX();for(let i=0;i<4&&Math.abs(x-p.x)>500;i++)x=gapX();go(p,x,p.near?NEAR+24:CURB-14,'curb');break;}
      case 'taxi':{const x=gapX();taxiJob={p,x,st:'hail',t:0,taxi:null};go(p,x,CURB-14,'hail');life.emit(t,'taxi','alguém vai chamar um táxi');break;}
      case 'leave':{go(p,p.x<STREET_W/2?-40:STREET_W+40,p.y,'offstage');break;}
    }
  }
  const release=p=>{if(p.spot){p.spot.busy=null;p.spot=null;}};
  function arrive(p){
    p.moving=false;
    switch(p.after){
      case 'pause':idle(p,.4+R()*2.6,R()<.25?['watch','scratch','phone','chin'][Math.floor(R()*4)]:null);break;
      case 'enter':p.hidden=true;p.st='inside';p.t=jitter(R,10);p.door.open=.7;sound('door',p.x,.5);life.emit(t,'loja','entrou: '+p.door.shop);break;
      case 'browse':p.dir=R()<.5?-1:1;idle(p,jitter(R,6),R()<.4?'chin':null);break;
      case 'paper':idle(p,jitter(R,7),'read','free');break;
      case 'phone':p.dir=1;idle(p,jitter(R,12),'phone','free');sound('coin',p.x,.4);break;
      case 'sit':p.sit=true;idle(p,jitter(R,16),R()<.4?'read':R()<.5?'drink':null,'free');break;
      case 'busSit':p.sit=true;idle(p,999,R()<.5?'read':'watch','bus');p.st='bus';break;
      case 'busWait':idle(p,999,R()<.5?'watch':'cross','bus');p.st='bus';p.dir=-1;break;
      case 'curb':p.dir=R()<.5?-1:1;p.st='curb';p.t=0;p.pose='watch';break;
      case 'hail':p.st='hail';p.t=0;p.dir=1;break;
      case 'offstage':p.hidden=true;p.st='off';p.off=jitter(R,30);break;
      case 'cross':p.near=!p.near;p.onRoad=false;decide(p);break;
      case 'board':p.hidden=true;p.st='off';p.off=jitter(R,45);break;
      default:decide(p);
    }
  }
  // o trânsito deixa atravessar? (nenhum carro chegando perto nas duas faixas, nem passando agora)
  function clearToCross(x){for(const k of cars){const w=W(k),L=LANES[k.lane];if(k.x-30<x&&k.x+w+30>x)return false;
    if(L.dir>0){const f=k.x+w;if(f<x&&x-f<240+k.v*2)return false;}else{if(k.x>x&&k.x-x<240+k.v*2)return false;}}return true;}
  function updPed(p,dt){
    if(p.st==='off'){if((p.off-=dt)<=0){p.near=R()<.3;const B=band(p);p.x=R()<.5?-30:STREET_W+30;p.y=B[0]+R()*(B[1]-B[0]);p.hidden=false;go(p,clamp(p.x<0?200+R()*900:STREET_W-200-R()*900,40,STREET_W-40),p.y,'pause');}return;}
    if(p.st==='inside'){if((p.t-=dt)<=0){p.hidden=false;p.door.open=.7;sound('door',p.x,.5);life.emit(t,'loja','saiu: '+p.door.shop);
        if(p.door.shop==='diner'&&R()<.6)idle(p,jitter(R,5),'drink');else{p.dir=R()<.5?-1:1;decide(p);}}return;}
    if(p.glanceCD>0)p.glanceCD-=dt;
    if(p.st==='walk'||p.st==='cross'){
      // abre passagem: se o Lemos (ou outro pedestre) vem de frente, desvia um pouco para o lado
      let sp=p.v*(p.st==='cross'?1.15:1);
      const dL=Math.abs(lemos.x-p.x),near=dL<70&&Math.abs(lemos.y-p.y)<26;if(near&&lemos.moving&&Math.sign(lemos.x-p.x)===p.dir)p.dodge=lemos.y>p.y?-10:10;else p.dodge*=.97;
      if(near)sp*=.8;
      const ty=p.after==='pause'?clamp(p.ty+p.dodge,band(p)[0],band(p)[1]):p.ty;
      const dx=p.tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),st=sp*dt;
      if(d<=st){p.x=p.tx;p.y=ty;arrive(p);return;}
      p.x+=dx/d*st;p.y+=dy/d*st;p.walk+=st/32;p.moving=true;if(Math.abs(dx)>.5)p.dir=dx>0?1:-1;return;}
    p.moving=false;
    // parado: de vez em quando olha para o policial que passa perto
    if(p.glanceCD<=0&&!p.sit&&Math.abs(lemos.x-p.x)<60&&Math.abs(lemos.y-p.y)<40&&R()<.5){p.dir=lemos.x>p.x?1:-1;p.glanceCD=8+R()*10;}
    switch(p.st){
      case 'idle':if((p.t-=dt)<=0){if(p.after==='free')release(p);p.pose=null;p.sit=false;decide(p);}break;
      case 'chat':p.talk+=dt;if((p.t-=dt)<=0){p.chatCD=40+R()*60;p.pose=null;decide(p);}break;
      case 'curb':p.t+=dt;if(clearToCross(p.x)&&p.t>.8){p.st='cross';p.onRoad=true;p.pose=null;p.tx=p.x+(R()-.5)*20;p.ty=p.near?CURB-14:NEAR+24;p.after='cross';life.emit(t,'rua','atravessando');}
        else if(p.t>25){p.pose=null;decide(p);}break;
      case 'hail':p.t+=dt;p.pose=(p.t%2.4)<.7?'stretch':null;if(!taxiJob||taxiJob.p!==p){p.pose=null;decide(p);}else if(p.t>45&&taxiJob.st==='hail'){taxiJob=null;p.pose=null;decide(p);}break;
      case 'bus':break;   // espera o ônibus (ver updBus)
    }
  }
  // conversa: dois que passeiam e se cruzam podem parar para trocar umas palavras (um de cada vez fala)
  function chats(){for(let i=0;i<peds.length;i++){const a=peds[i];if(a.st!=='walk'||a.after!=='pause'||a.chatCD>0||a.hidden)continue;
    for(let j=i+1;j<peds.length;j++){const b=peds[j];if(b.st!=='walk'||b.after!=='pause'||b.chatCD>0||b.hidden||b.near!==a.near)continue;
      if(Math.abs(a.x-b.x)<46&&Math.abs(a.y-b.y)<16&&R()<(a.social+b.social)*.35){const d=jitter(R,7);a.st=b.st='chat';a.t=b.t=d;a.talk=0;b.talk=1.2;a.dir=b.x>a.x?1:-1;b.dir=-a.dir;a.moving=b.moving=false;
        if(Math.abs(a.x-b.x)<16){a.x-=a.dir*6;b.x-=b.dir*6;}life.emit(t,'conversa','dois pedestres conversando');return;}
      else if(Math.abs(a.x-b.x)<46)a.chatCD=6;}}}

  /* ---------- ônibus: passa de tempos em tempos, para no ponto, quem espera embarca e às vezes alguém desce ---------- */
  function updBus(dt){
    if(!bus){if((busT-=dt)<=0){const w=meta('onibus').w*CAR_S;bus={id:'onibus',lane:1,x:-w-80,v:58,v0:58,pv:58,puff:0,brake:0,st:'run',bus:true,t:0};cars.push(bus);ENTS.push(ent('car',bus,LANES[1].y));life.emit(t,'ônibus','ônibus chegando');}return;}
    const w=W(bus),front=bus.x+w;
    if(bus.st==='run'&&front>STOP_X-60&&front<STOP_X+260){const left=STOP_X+170-front;bus.target=left<6?0:Math.min(bus.v0,left*.9+6);if(left<6){bus.st='stop';bus.t=0;bus.v=0;sound('brake',bus.x+w/2,.6);life.emit(t,'ônibus','parado no ponto');}}
    else if(bus.st==='stop'){bus.t+=dt;bus.target=0;
      if(bus.t>1.2&&!bus.done){bus.done=true;sound('busdoor',bus.x+w/2,.7);
        for(const p of peds)if(p.st==='bus'){release(p);p.sit=false;p.pose=null;go(p,bus.x+w*.72,LANES[1].y-8,'board');}
        if(R()<.6){const q=peds.find(p=>p.st==='off');if(q){q.hidden=false;q.near=true;q.x=bus.x+w*.72;q.y=NEARB[0]+6;q.dir=R()<.5?-1:1;decide(q);life.emit(t,'ônibus','alguém desceu');}}}
      if(bus.t>6&&!peds.some(p=>p.after==='board'&&!p.hidden)){bus.st='go';bus.target=null;sound('bus',bus.x+w/2,.6);}}
    else bus.target=null;
    if(bus.x>STREET_W+80){cars.splice(cars.indexOf(bus),1);const i=ENTS.findIndex(e=>e.ref===bus);if(i>=0)ENTS.splice(i,1);bus=null;busT=jitter(R,80,.4);}
  }
  /* ---------- táxi: alguém acena no meio-fio; um táxi livre da faixa de cima encosta, a pessoa entra e ele segue ---------- */
  function updTaxi(dt){
    const j=taxiJob;if(!j)return;
    if(j.st==='hail'){if(j.p.st!=='hail')return;const k=cars.find(c=>c.id==='taxi'&&c.lane===0&&!c.job&&c.x>j.x+200&&c.x<j.x+2600);if(k){k.job=j;j.taxi=k;j.st='come';life.emit(t,'táxi','táxi vindo');}return;}
    const k=j.taxi,w=W(k),cx=k.x+w/2;
    if(j.st==='come'){const dd=cx-j.x;k.target=dd<10?0:Math.min(k.v0,dd*.6+8);if(dd<240)k.yo=LANES[0].y+(PARK-LANES[0].y)*Math.min(1,(240-dd)/200);if(dd<10){j.st='load';j.t=0;k.yo=PARK;k.v=0;sound('brake',cx,.4);j.p.pose=null;go(j.p,cx,PARK-6,'board');}}
    else if(j.st==='load'){j.t+=dt;k.target=0;if(j.p.hidden&&j.t>1.5){j.st='leave';j.t=0;sound('cardoor',cx,.6);life.emit(t,'táxi','passageiro embarcou');}}
    else if(j.st==='leave'){j.t+=dt;k.target=j.t<.6?0:null;k.yo=PARK+(LANES[0].y-PARK)*Math.min(1,j.t/1.6);if(j.t>1.6){k.yo=null;k.job=null;taxiJob=null;}}
  }

  function update(dt){
    cameraDt=dt;
    t+=dt;
    // Lemos: anda até o toque; na porta do DHPP sobe os degraus, a porta acende e ele entra
    lemos.vx=0;lemos.vy=0;
    if(lemos.climb>0){lemos.climb+=dt;lemos.moving=true;lemos.walk+=dt*2.5;doorT=Math.min(1,doorT+dt*2.5);lemos.vy=-30;lemos.y=Math.max(GY-2,lemos.y-dt*30);
      if(lemos.climb>.6){lemos.climb=0;lemos.moving=false;onEnter();setTimeout(()=>{doorT=0;},400);}}
    else if(lemos.tx!=null){const dx=lemos.tx-lemos.x,dy=lemos.ty-lemos.y,d=Math.hypot(dx,dy),sp=96*dt;
      if(d<=sp){lemos.x=lemos.tx;lemos.y=lemos.ty;lemos.tx=null;lemos.moving=false;if(lemos.enter){lemos.enter=false;lemos.climb=.001;lemos.dir=1;}}
      else{lemos.vx=dx/d*96;lemos.vy=dy/d*96;lemos.x+=dx/d*sp;lemos.y+=dy/d*sp;lemos.walk+=sp/32;lemos.moving=true;if(Math.abs(dx)>0.5)lemos.dir=dx>0?1:-1;}}
    if(lemos.enter&&Math.abs(lemos.x-DOOR.x)<260&&!doorFocus){doorFocus=true;camera.focus({id:'dhpp-arrival',mode:'context',priority:CAMERA_PRIORITY.context,x:(lemos.x+DOOR.x)/2,y:GY-120,duration:700,hold:400,interruptible:true});}
    if(!lemos.enter&&Math.abs(lemos.x-DOOR.x)>340)doorFocus=false;
    for(const p of peds){if(p.chatCD>0)p.chatCD-=dt;updPed(p,dt);}
    if((t*2|0)!==((t-dt)*2|0))chats();
    for(const d of DOORS)if(d.open>0)d.open-=dt;
    updBus(dt);updTaxi(dt);
    for(const b of birds){b.t+=dt*30;
      if(b.st==='g'){if(Math.random()<dt*.6)b.x+=b.dir*2;if(Math.random()<dt*.2)b.dir=-b.dir;
        let near=Math.abs(lemos.x-b.x)<34&&Math.abs(lemos.y-b.y)<18;for(let i=0;!near&&i<peds.length;i++){const p=peds[i];near=!p.hidden&&Math.abs(p.x-b.x)<34&&Math.abs(p.y-b.y)<18;}
        if(near){b.st='f';b.vx=(Math.random()<.5?-1:1)*(70+Math.random()*50);b.vz=70;b.dir=Math.sign(b.vx);b.tx=Math.max(60,Math.min(STREET_W-60,b.x+b.vx*2.4));sound('flap',b.x,.3);}}
      else{b.x+=b.vx*dt;b.z=Math.max(0,b.z+b.vz*dt);if(Math.abs(b.x-b.tx)<60)b.vz=-60;else if(b.z>60)b.vz=0;
        if(b.vz<0&&b.z<=0){b.st='g';b.z=0;b.y=WALK[0]+10+Math.random()*(WALK[1]-WALK[0]-20);}}}
    // trânsito: cada um segue o da frente na mesma faixa, freia para quem atravessa e para o ônibus/táxi parado;
    // fumacinha do escapamento atrás; luz de freio quando desacelera
    for(let l=0;l<LANES.length;l++){const L=LANES[l],dir=L.dir,ln=cars.filter(k=>k.lane===l&&!(k.yo!=null&&Math.abs(k.yo-L.y)>40)).sort((a,b)=>dir>0?b.x-a.x:a.x-b.x);
      for(let i=0;i<ln.length;i++){const k=ln[i],lead=ln[i-1],w=W(k);let v=k.target!=null?k.target:k.v0;
        if(lead){const gap=dir>0?lead.x-(k.x+w):k.x-(lead.x+W(lead));if(gap<70)v=Math.min(v,lead.v*(gap<28?0.6:1),gap<14?0:99);}
        for(const p of peds){if(!p.onRoad||p.hidden||p.y<L.y-46||p.y>L.y+14)continue;const ahead=dir>0?p.x-(k.x+w):k.x-p.x;
          if(ahead>-12&&ahead<170){v=Math.min(v,ahead<46?0:(ahead-46)*.5);if(ahead<60&&k.v<2){k.wait=(k.wait||0)+dt;if(k.wait>2.5&&!k.honked&&R()<.3){k.honked=true;sound('honk',k.x,.5);}}}}
        k.pv=k.v;k.v+=(v-k.v)*Math.min(1,dt*(v<k.v?4:2));if(k.v<.5&&v===0)k.v=0;k.x+=dir*k.v*dt;
        k.brake=k.v<k.pv-.05||(k.v<8&&v<k.v0*.5)?Math.min(1,k.brake+dt*6):Math.max(0,k.brake-dt*3);
        if(k.v>3)k.honked=false,k.wait=0;
        k.puff+=dt;if(k.puff>.45){k.puff=0;if(puffs.length<40)puffs.push({x:dir>0?k.x+4:k.x+w-4,y:(k.yo??L.y)-10,vx:-dir*12,t:0});}
        if(k.bus)continue;
        if(dir>0&&k.x>STREET_W+60){const back=Math.min(...ln.map(o=>o.x));k.x=Math.min(-w-60,back-w-120)-R()*300;k.v0=L.v*(0.85+R()*0.3);}
        if(dir<0&&k.x<-w-60){const back=Math.max(...ln.map(o=>o.x+W(o)));k.x=Math.max(STREET_W+60,back+120)+R()*300;k.v0=L.v*(0.85+R()*0.3);}}}
    for(const p of puffs){p.t+=dt;p.x+=p.vx*dt;p.y-=dt*5;}while(puffs.length&&puffs[0].t>1)puffs.shift();
    if(!RM)for(const m of motes){m.p+=dt*m.v;m.x+=dt*.004*m.v;m.y+=Math.sin(m.p)*dt*.004;if(m.x>1)m.x-=1;}
    if(tapFx&&(tapFx.t+=dt)>.7)tapFx=null;
  }
  /** a rua continuou enquanto o Lemos estava lá dentro: avança a simulação (até 2 min) sem desenhar */
  function resume(sec){const n=Math.min(480,Math.round(Math.max(0,sec)/.25));for(let i=0;i<n;i++)update(.25);}
  /** linhas do painel ?debug=1 */
  function debugRows(){const vis=peds.filter(p=>!p.hidden).length;
    return [`RUA · pedestres ${vis}/${peds.length} · carros ${cars.length}${bus?' · ônibus '+bus.st:''}${taxiJob?' · táxi '+taxiJob.st:''}`,
      ...peds.map(p=>`#${p.id} ${p.near?'cá':'lá'} ${p.st}${p.after&&p.st==='walk'?'→'+p.after:''}${p.pose?' ('+p.pose+')':''} x${p.x|0}`),
      '— acontecimentos —',...life.list.slice(-8).map(e=>`${e.t.toFixed(0)}s ${e.type}: ${e.txt}`)];}

  // enquadramento Beat Cop: ~760 px de mundo na altura (fachadas até o topo, calçada e as faixas);
  // a escala é inteira (cada pixel da arte vira um bloco igual de pixels da tela: nada tremendo nem com pixel torto).
  // No retrato a rua inteira cabe na altura. A câmera segue o Lemos.
  const VIEWH=760;
  function view(cw,ch,rs){
    let baseS=Math.max(1,Math.round(Math.min(ch/VIEWH,cw/760)));if(ch/baseS>STREET_H)baseS=Math.ceil(ch/STREET_H);
    let s=Math.max(1,Math.round(baseS*camZoom));
    const vw=cw/s,vh=ch/s;
    const ctl=camera.resolve(),manual=ctl.mode==='manual';
    if(!manual){
      const focus=ctl.focus,dir=lemos.moving&&Math.abs(lemos.vx)>2?Math.sign(lemos.vx):lemos.dir;
      const near=Math.abs(lemos.x-DOOR.x)<330,biasX=near?(DOOR.x-lemos.x)*.22:0;
      const subject={x:focus?.x??lemos.x,y:focus?.y??lemos.y};
      const dz=deadZoneTarget({x:camX,y:camY==null?lemos.y:camY},subject,{viewportW:vw,viewportH:vh,zoneX:vw*(RM ? .22 : .13),zoneY:vh*(RM ? .2 : .12),dirX:dir,dirY:Math.sign(lemos.vy||0),lookAheadX:RM?0:Math.min(125,vw*.16),lookAheadY:RM?0:Math.min(32,vh*.05),biasX});
      let tx=dz.x,ty=dz.y-vh*(near ? 0.06 : 0);
      if(!lemos.moving&&!focus){tx+=(lemos.x+biasX-tx)*.12;ty+=(lemos.y-vh*.04-ty)*.12;}
      const rate=focus?(RM?18:4.8):(lemos.moving?6.8:2.1);
      camX=damp(camX,tx,rate,cameraDt);camY=camY==null?ty:damp(camY,ty,rate,cameraDt);
      cameraInfo={mode:ctl.mode,priority:ctl.priority,zoneX:dz.zoneX*s/rs,zoneY:dz.zoneY*s/rs,targetX:(dz.desiredX-(camX-vw/2))*s/rs,targetY:(dz.desiredY-(camY-vh/2))*s/rs};
    }
    camX=clamp(camX,vw/2,STREET_W-vw/2);
    let top;if(vh>=STREET_H){top=STREET_H-vh;camY=top+vh/2;}else{const want=clamp((camY==null?lemos.y:camY)-vh/2,0,STREET_H-vh);top=want;camY=top+vh/2;}
    return {s,baseS,left:camX-vw/2,top,rs,vw,vh};
  }
  const clamp=(v,a,b)=>a>b?(a+b)/2:v<a?a:v>b?b:v;

  // camada de sombras projetadas, em meia resolução (as bordas saem macias ao ampliar)
  const shc=document.createElement('canvas'),shx=shc.getContext('2d');
  let gradeKey='',gradeSun=null;   // a vinheta é a mesma da base (#vig, em CSS): nada de pintar outra aqui
  const stats={ents:0,drawn:0,shadows:0,particles:0};

  function draw(ctx,cw,ch,rs,marker){
    const q=Q();
    const V=view(cw,ch,rs),{s,left,top,vw}=V;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
    ctx.fillStyle='#8fa9c4';ctx.fillRect(0,0,cw,ch);ctx.imageSmoothingEnabled=false;
    const ox=Math.round(-left*s),oyr=Math.round(-top*s);
    ctx.setTransform(s,0,0,s,ox,oyr);
    ctx.drawImage(layer,0,0);
    const x0=left-200,x1=left+vw+200;
    // porta do DHPP acesa quando o Lemos entra
    if(doorT>0){ctx.fillStyle=`rgba(255,226,160,${.45*doorT})`;ctx.fillRect(DOOR.x-50,GY-76,100,68);}
    for(const f of DHPP.flags||[])flag(ctx,f.x,f.y,f.v);
    // portas das lojas abrindo quando alguém entra ou sai; tambores da lavanderia girando
    for(const d of DOORS)if(d.open>0&&d.x>x0&&d.x<x1){const k=Math.min(1,d.open/.35)*Math.min(1,(.7-d.open)/.15+.2);ctx.fillStyle=`rgba(18,14,12,${.75*k})`;ctx.fillRect(Math.round(d.dx+d.w*.35),Math.round(d.dy+2),Math.round(d.w*.62),Math.round(d.h-2));ctx.fillStyle=`rgba(255,226,170,${.25*k})`;ctx.fillRect(Math.round(d.dx+d.w*.35),Math.round(d.dy+d.h-3),Math.round(d.w*.62),3);}
    if(!RM)for(const d of DRUMS){if(d.x<x0||d.x>x1)continue;const a=t*5+d.x;ctx.fillStyle='rgba(235,242,250,.85)';ctx.fillRect(Math.round(d.x+Math.cos(a)*5)-1,Math.round(d.y+Math.sin(a)*5)-1,2,2);ctx.fillStyle='rgba(120,150,180,.6)';ctx.fillRect(Math.round(d.x+Math.cos(a+2.4)*4),Math.round(d.y+Math.sin(a+2.4)*4),2,2);}
    // ordem de desenho pelo pé
    for(const e of ENTS){const r=e.ref;if(e.k==='car'){if(r.lane!=null)e.y=r.yo??LANES[r.lane].y;}else e.y=r.y;}
    for(let i=1;i<ENTS.length;i++){const e=ENTS[i];let j=i-1;while(j>=0&&ENTS[j].y>e.y){ENTS[j+1]=ENTS[j];j--;}ENTS[j+1]=e;}
    // sombras projetadas (média e alta): silhuetas inclinadas na direção do sol, numa camada só (não somam escuro)
    if(q>=1){const hs=s/2,sw=Math.ceil(cw/2),sh=Math.ceil(ch/2);if(shc.width!==sw||shc.height!==sh){shc.width=sw;shc.height=sh;}
      shx.setTransform(1,0,0,1,0,0);shx.clearRect(0,0,sw,sh);shx.imageSmoothingEnabled=false;let n=0;
      const cast=(im,fx,fyy,u0,v0,dw,dh,flip,sx,sy,sww,shh)=>{shx.setTransform(hs,0,0,hs,ox/2,oyr/2);shx.transform(1,0,-SUN.kx,-SUN.ky,fx,fyy);if(flip)shx.scale(-1,1);
        if(sx!=null)shx.drawImage(silhouette(im),sx,sy,sww,shh,u0,v0,dw,dh);else shx.drawImage(silhouette(im),u0,v0,dw,dh);n++;};
      for(const e of ENTS){const r=e.ref;
        if(e.k==='prop'){const im=art(PATH.prop(r.k));if(!im||r.x<x0||r.x>x1||r.dark)continue;const w=im.width*PROP_S,h=im.height*PROP_S;cast(im,r.x,r.y,-w/2,-h,w,h);}
        else if(e.k==='ped'){if(r.hidden||r.x<x0||r.x>x1)continue;const im=r.frames[pedFrame(r)];cast(im,Math.round(r.x),Math.round(r.y),-14,-45,im.width,im.height,r.dir<0);}
        else if(e.k==='tree'){if(r.x<x0||r.x>x1)continue;cast(r.trunk,r.x,r.y,-10,-80,20,80);cast(r.crown,r.x,r.y,-r.crown.width/2,-150,r.crown.width,r.crown.height);}
        else if(e.k==='car'){const x=r.x;if(x+300<x0||x>x1)continue;const m=meta(r.id),im=art(PATH.veiculo(r.id));if(!im)continue;const w=m.w*CAR_S,h=m.h*CAR_S,dir=r.lane!=null?LANES[r.lane].dir:1;
          shx.setTransform(hs,0,0,hs,ox/2,oyr/2);shx.transform(1,0,-SUN.kx*.7,-SUN.ky*.8,Math.round(dir<0?x+w:x),Math.round(e.y));if(dir<0)shx.scale(-1,1);shx.drawImage(silhouette(im),0,0,m.w,m.h,0,-h,w,h);n++;}}
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;ctx.globalAlpha=.36;ctx.drawImage(shc,0,0,sw*2,sh*2);ctx.restore();ctx.imageSmoothingEnabled=false;stats.shadows=n;}
    let drawn=0;
    for(const e of ENTS){const r=e.ref;
      switch(e.k){
        case 'prop':{if(r.x<x0||r.x>x1)break;const im=art(PATH.prop(r.k));if(!im)break;const w=im.width*PROP_S,h=im.height*PROP_S;
          contact(ctx,r.x+1,r.y,Math.max(4,w*.42),2.5,.3);ctx.drawImage(r.dark?dimmed(im,r.dark):im,Math.round(r.x-w/2),Math.round(r.y-h),Math.round(w),Math.round(h));drawn++;break;}
        case 'tree':{if(r.x<x0||r.x>x1)break;tree(ctx,r);drawn++;break;}
        case 'ped':{if(r.hidden||r.x<x0||r.x>x1)break;person(ctx,r);drawn++;break;}
        case 'car':{const x=r.x;if(x+300<x0||x>x1)break;if(r.lane!=null){const L=LANES[r.lane];car(ctx,r,x,e.y,L.dir,false);}else car(ctx,r,x,r.y,1,r===viatura);drawn++;break;}
        case 'bird':{if(r.x<x0||r.x>x1)break;bird(ctx,r);drawn++;break;}
        case 'steam':{if(q>=1&&r.x>x0&&r.x<x1)steam(ctx,r);break;}
      }}
    stats.ents=ENTS.length;stats.drawn=drawn;
    const fum=art(PATH.efeito('fumaca-escape'));
    for(const p of puffs){if(p.x<x0||p.x>x1)continue;const u=p.t;if(fum){const f=Math.min(3,Math.floor(u*4));ctx.globalAlpha=1-u;ctx.drawImage(fum,f*12,0,12,8,p.x-9,p.y-6,18,12);ctx.globalAlpha=1;}
      else{ctx.fillStyle=`rgba(210,210,214,${.45*(1-u)})`;ctx.beginPath();ctx.ellipse(p.x,p.y,3+u*6,2+u*4,0,0,7);ctx.fill();}}
    // luzes que emitem: neon das lojas (com tremida rara), arandelas do DHPP, vitrines e o giroflex da viatura parada
    ctx.globalCompositeOperation='lighter';
    for(const b of BUILDINGS){if(!b.glows||b.X+b.w<x0||b.X>x1)continue;for(const gl of b.glows){
      let a=gl.neon?.34:gl.lamp?.3:.12;if(gl.neon&&!RM&&q>=1){const ph=Math.sin(t*1.3+gl.x)*Math.sin(t*7.1+gl.y);if(ph>.93)a*=.35;}
      const sp=glowSprite(rgba(gl.c,1));ctx.globalAlpha=a;const r=gl.r;ctx.drawImage(sp,gl.x-r,gl.y-r*.7,r*2,r*1.4);
      if(gl.lamp){ctx.globalAlpha=a*.5;ctx.drawImage(sp,gl.x-r*.8,GY-6,r*1.6,r*.5);}}}
    if(q>=1&&viatura.x+200>x0&&viatura.x<x1){const red=(2+Math.floor(t*2.5)%2)===2,m=meta(viatura.id),cx=viatura.x+(red?67:85)*CAR_S,cyy=viatura.y-m.h*CAR_S+6*CAR_S;
      const sp=glowSprite(red?'rgba(255,60,50,1)':'rgba(60,110,255,1)');ctx.globalAlpha=.5;ctx.drawImage(sp,cx-18,cyy-14,36,28);
      ctx.globalAlpha=.16;ctx.drawImage(sp,cx-130,viatura.y-90,260,110);ctx.globalAlpha=.08;ctx.drawImage(sp,cx-160,GY-130,320,190);}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    // retorno do toque: um anel no chão onde o Lemos vai
    if(tapFx){const k=tapFx.t/.7;ctx.strokeStyle=`rgba(242,194,48,${.9*(1-k)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tapFx.x,tapFx.y,6+k*14,2+k*5,0,0,7);ctx.stroke();}
    if(marker){const b=Math.round(Math.sin(t*6)*2),X=DOOR.x,Y=GY-160+b;ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+9);ctx.lineTo(X-8,Y);ctx.lineTo(X,Y-9);ctx.lineTo(X+8,Y);ctx.fill();
      ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+7);ctx.lineTo(X-6,Y);ctx.lineTo(X,Y-7);ctx.lineTo(X+6,Y);ctx.fill();ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y-4,2,6);ctx.fillRect(X-1,Y+3,2,1.5);}
    // fachos de luz da manhã descendo do alto à esquerda, e a poeira que só aparece dentro deles
    let np=0;
    if(q>=2){ctx.globalCompositeOperation='screen';const br=RM?1:.85+.15*Math.sin(t*.4);
      for(const [sx,wd,a] of [[200,140,.07],[900,90,.05],[1700,160,.06],[2300,110,.05]]){if(sx+wd+700<x0||sx-200>x1)continue;
        ctx.fillStyle=`rgba(255,232,190,${a*br})`;for(const f of [1,.6]){const ww=wd*f;ctx.beginPath();ctx.moveTo(sx-ww/2,top-40);ctx.lineTo(sx+ww/2,top-40);ctx.lineTo(sx+ww/2+(CURB-top)*.55,CURB);ctx.lineTo(sx-ww/2+(CURB-top)*.55,CURB);ctx.closePath();ctx.fill();}}
      for(const m of motes){const X=left+m.x*vw,Y=top+m.y*(CURB-top);const a=.25+.25*Math.sin(m.p*2);ctx.fillStyle=`rgba(255,244,220,${a})`;ctx.fillRect(Math.round(X),Math.round(Y),1,1);np++;}
      ctx.globalCompositeOperation='source-over';}
    stats.particles=np+puffs.length;
    // luz da manhã, como o clima de cor da planta (gradientes guardados por tamanho de tela)
    ctx.setTransform(1,0,0,1,0,0);
    const key=cw+'x'+ch;if(key!==gradeKey){gradeKey=key;gradeSun=ctx.createLinearGradient(0,0,cw,ch);gradeSun.addColorStop(0,'rgba(255,214,150,.34)');gradeSun.addColorStop(.6,'rgba(255,224,176,.08)');gradeSun.addColorStop(1,'rgba(90,120,170,.18)');
}
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=gradeSun;ctx.fillRect(0,0,cw,ch);ctx.globalCompositeOperation='source-over';
    ctx.restore();
    lastView={...V,oy:oyr,ox,cw,ch};
    if(cameraDebug&&cameraInfo)drawCameraDebug(ctx,{width:cw,height:ch,dpr:rs,deadZone:{x:cw/rs/2-cameraInfo.zoneX,y:ch/rs/2-cameraInfo.zoneY,w:cameraInfo.zoneX*2,h:cameraInfo.zoneY*2},target:{x:cameraInfo.targetX,y:cameraInfo.targetY},lines:[`RUA · ${cameraInfo.mode}`,`prioridade ${cameraInfo.priority} · zoom ${camZoom.toFixed(2)} (${V.s}x)`,`cam ${camX.toFixed(1)}, ${camY.toFixed(1)}`]});
  }
  let lastView=null;
  const contact=(ctx,x,y,rx,ry,a)=>{ctx.fillStyle=`rgba(16,12,20,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();};

  // bandeira da planta (Brasil e DHPP): pano coluna a coluna numa onda, com luz e sombra nas dobras
  const cloths={};
  function flag(ctx,X,Y,v){let cl=cloths[v];
    if(!cl)cl=cloths[v]=A.S2(17,12,(P)=>{if(v==='br'){P(0,0,17,12,'#2f7a3a');for(let k=0;k<5;k++)P(8-k*2,3+k-2,1+k*4,1,'#e8c63a');for(let k=0;k<4;k++)P(4+k*2,6+k,9-k*4,1,'#e8c63a');P(5,4,7,4,'#e8c63a');P(6,4,5,4,'#2f4f9a');P(6,6,5,1,'#e8ecef');}
      else{P(0,0,17,12,'#1e2a3a');P(0,0,17,1,'#3a4f6a');P(4,3,9,1,'#e8ecef');P(4,6,9,1,'#c9a24a');P(4,9,9,1,'#e8ecef');}});
    const S=2;for(let i=0;i<17;i++){const ph=t*8.6-i*0.5,dy=Math.round(Math.sin(ph)*2*(i/16));
      ctx.fillStyle='rgba(28,18,14,.18)';ctx.fillRect(X+i*S+6,Y+dy+10,S,12*S);              // sombra do pano na fachada
      ctx.drawImage(cl,i,0,1,12,X+i*S,Y+dy,S,12*S);
      if(Math.cos(ph)<-0.3){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(X+i*S,Y+dy,S,12*S);}else if(Math.cos(ph)>0.7){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(X+i*S,Y+dy,S,12*S);}}}
  // árvore: tronco parado, copa balançando 1 px com o vento
  function tree(ctx,r){
    contact(ctx,r.x,r.y-2,9,3,.35);ctx.drawImage(r.trunk,Math.round(r.x-10),Math.round(r.y-80));
    const sway=RM?0:Math.round(Math.sin(t*.9+r.ph)*1.2);ctx.drawImage(r.crown,Math.round(r.x-r.crown.width/2+sway),Math.round(r.y-150));
  }
  // carro oficial (rodas girando; a viatura parada com o giroflex alternando), ampliado sem suavizar, com volume e sombra
  function car(ctx,k,x,y,dir,isViatura){
    const m=meta(k.id),im=art(PATH.veiculo(k.id));const w=m.w*CAR_S,h=m.h*CAR_S;
    contact(ctx,x+w/2,y-3,w*.44,4,.42);contact(ctx,x+w/2,y-2,w*.36,2,.3);
    if(!im)return;
    const f=isViatura?2+Math.floor(t*2.5)%2:(k.v>1?Math.floor(t*10)%2:0);
    ctx.save();ctx.translate(Math.round(dir<0?x+w:x),Math.round(y-h));if(dir<0)ctx.scale(-1,1);
    ctx.drawImage(Q()>=1?shaded(im):im,f*m.w,0,m.w,m.h,0,0,Math.round(w),Math.round(h));ctx.restore();
    // luz de freio na traseira quando desacelera ou está parado no trânsito
    if(k.brake>.05){const rx=dir>0?x+3:x+w-7,ry=y-h*.52;ctx.fillStyle=`rgba(255,40,30,${.9*k.brake})`;ctx.fillRect(Math.round(rx),Math.round(ry),4,4);
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.45*k.brake;ctx.drawImage(glowSprite('rgba(255,50,40,1)'),rx-12,ry-8,28,20);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
  }
  // pessoa: o boneco da planta, com sombra de contato no pé e o quadro do passo, espelhado para a esquerda
  // quadros do boneco da planta: 0–3 andando, 4 sentado, depois cada gesto em pé e sentado (mesma ordem de base.js)
  const POSES=['phone','drink','cross','stretch','read','chin','watch','scratch'];
  function pedFrame(p){if(p.moving)return Math.floor(p.walk*3.2)%4;const k=p.pose?POSES.indexOf(p.pose):-1;return k<0?(p.sit?4:0):5+k*2+(p.sit?1:0);}
  function person(ctx,p){
    const img=p.frames[pedFrame(p)],X=Math.round(p.x),Y=Math.round(p.y);
    // respiração de quem está parado e o leve balanço de quem fala
    const talking=p.st==='chat'&&Math.floor(p.talk/1.6)%2===0,bob=!p.moving&&!RM&&(talking?((t*6+p.id)|0)%2:Math.sin(t*1.6+p.id*1.7)>.85)?1:0;
    contact(ctx,X+2,Y-1,9,2.6,.34);
    if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);ctx.drawImage(img,-14,Y-45+bob);ctx.restore();}else ctx.drawImage(img,X-14,Y-45+bob);
    if(talking&&(p.talk%1.6)>.25){const bx=X+p.dir*6,by=Y-54;ctx.fillStyle='#1e1611';ctx.fillRect(bx-7,by-5,14,9);ctx.fillStyle='#f3f1ea';ctx.fillRect(bx-6,by-4,12,7);ctx.fillRect(bx-1,by+3,2,2);ctx.fillStyle='#14181b';const n=1+((p.talk*3)|0)%3;for(let i=0;i<n;i++)ctx.fillRect(bx-4+i*3,by-1,2,2);}
  }
  // vapor do bueiro (efeito oficial, 6 quadros), subindo devagar
  function steam(ctx,m){const im=art(PATH.efeito('vapor-bueiro'));if(!im)return;const f=Math.floor(t*7)%6;ctx.globalAlpha=.75;ctx.drawImage(im,f*24,0,24,40,Math.round(m.x-16),Math.round(m.y-50),31,52);ctx.globalAlpha=1;}
  function bird(ctx,b){
    const X=Math.round(b.x),Y=Math.round(b.y),z=Math.round(b.z),d=b.dir;
    ctx.globalAlpha=0.28*Math.max(0.2,1-b.z/90);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X+z*SUN.kx,Y+z*SUN.ky,5,1.6,0,0,7);ctx.fill();ctx.globalAlpha=1;
    const y=Y-z-6,peck=b.st==='g'&&(b.t%50)<8,fly=b.st!=='g',up=(Math.floor(b.t/4))%2,F=(x,yy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,yy,w,h);};
    if(fly){F(X-7,up?y-5:y+1,14,4,'#1e1611');F(X-6,up?y-4:y+2,12,2,'#a3a9b0');}
    F(X-5-(d>0?1:0),y-1,11,7,'#1e1611');F(X-4,y,9,5,'#8a9098');F(X-3,y,6,2,'#a3a9b0');F(d>0?X-5:X+3,y+1,3,2,'#5a6068');
    const hx=d>0?X+4:X-6,hy=peck?y+3:y-3;F(hx-1,hy-1,5,5,'#1e1611');F(hx,hy,3,3,'#4f5a62');F(hx,hy+2,3,1,'#5fa08a');F(d>0?hx+2:hx,hy,1,1,'#e8e2d0');F(d>0?hx+3:hx-1,hy+1,1,1,'#c97a3a');
  }

  function worldAt(px,py,V=lastView){return V?{x:V.left+px/V.s,y:V.top+py/V.s}:null;}
  function gestureStart(points){
    if(!lastView||!points.length)return;
    if(points.length>1){const a=points[0],b=points[1],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;gesture={type:'pinch',d:Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),zoom:camZoom,world:worldAt(mx,my),mx,my};camera.beginManual();}
    else gesture={type:'pan',x:points[0].x,y:points[0].y,cx:camX,cy:camY};
  }
  function gestureMove(points){
    if(!lastView||!points.length)return;
    if(points.length>1){
      const a=points[0],b=points[1],mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      if(!gesture||gesture.type!=='pinch')gestureStart(points);
      camera.beginManual();camZoom=clamp(gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.d,1,2.75);
      const ns=Math.max(1,Math.round(lastView.baseS*camZoom)),vw=lastView.cw/ns,vh=lastView.ch/ns;
      camX=gesture.world.x-mx/ns+vw/2;camY=gesture.world.y-my/ns+vh/2;return;
    }
    if(!gesture||gesture.type!=='pan')gestureStart(points);
    const dx=points[0].x-gesture.x,dy=points[0].y-gesture.y;if(Math.hypot(dx,dy)<5)return;
    camera.beginManual();camX=gesture.cx-dx/lastView.s;camY=gesture.cy-dy/lastView.s;
  }
  function gestureEnd(points){camera.endManual();if(points&&points.length===1)gestureStart(points);else gesture=null;}
  function zoomAt(factor,px,py){
    if(!lastView)return;const w=worldAt(px,py),z0=camZoom;camZoom=clamp(camZoom*factor,1,2.75);if(Math.abs(z0-camZoom)<.001)return;
    camera.beginManual();const ns=Math.max(1,Math.round(lastView.baseS*camZoom)),vw=lastView.cw/ns,vh=lastView.ch/ns;camX=w.x-px/ns+vw/2;camY=w.y-py/ns+vh/2;
  }

  /** toque na tela (px do canvas): no prédio do DHPP vai até a porta e entra; na calçada anda até lá */
  function tap(px,py){
    if(!lastView||lemos.climb)return;const {s,ox,oy}=lastView,wx=(px-ox)/s,wy=(py-oy)/s;
    const now=performance.now();if(lastTap&&now-lastTap.t<320&&Math.hypot(px-lastTap.x,py-lastTap.y)<36*(lastView.rs||1)){lastTap=null;zoomAt(camZoom>1.55 ? .62 : 1.65,px,py);return;}lastTap={t:now,x:px,y:py};
    camera.clearManual();
    if(wx>=DHPP.X&&wx<=DHPP.X+DHPP.w&&wy<GY+8){lemos.tx=DOOR.x;lemos.ty=DOOR.y;lemos.enter=true;tapFx={x:DOOR.x,y:DOOR.y,t:0};return;}
    lemos.tx=clamp(wx,12,STREET_W-12);lemos.ty=clamp(wy,WALK[0],WALK[1]);lemos.enter=false;tapFx={x:lemos.tx,y:lemos.ty,t:0};
  }
  /** posiciona Lemos: 'porta' (saindo do DHPP) ou 'carro' (chegando na viatura) */
  function place(where){
    lemos.tx=null;lemos.enter=false;lemos.moving=false;lemos.climb=0;doorT=0;
    if(where==='porta'){lemos.x=DOOR.x;lemos.y=DOOR.y+10;lemos.dir=1;}
    else{lemos.x=viatura.x+W(viatura)/2;lemos.y=WALK[1];lemos.dir=1;}
    camX=lemos.x;camY=null;camZoom=1;camera.clearManual();camera.focus({id:'street-entry',mode:'transition',priority:CAMERA_PRIORITY.critical,x:where==='porta'?(lemos.x+DOOR.x)/2:lemos.x,y:where==='porta'?GY-90:lemos.y,duration:480,hold:180,interruptible:true});
  }
  return {update,resume,debugRows,draw,tap,place,gestureStart,gestureMove,gestureEnd,zoomAt,lemos,door:DOOR,ready,stats,shadowLayer:shc,get view(){return lastView;},get cars(){return cars;},parked,peds,birds,trees,get t(){return t;},zoom:()=>camZoom};
}
