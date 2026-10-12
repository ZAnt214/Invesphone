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
import {GY,CURB,ROAD,NEAR,STREET_H,FG_TOP,WALK,PARK,LANES,SUN,TREES,MANHOLES,CROSSWALKS,CW_HALF,BAND_TOP,BAND_BOT,rnd,paintFacades,paintGround,paintWear,paintSkyline,PUDDLES} from './streetArt';
import {paintForeground} from './streetFG';
import {createDwellers} from './dwellers';
import {createFront} from './streetFront';
import {RUA_DIR,VEICULOS,PATH} from './ruaAssets';
import {choose,eventLog,jitter} from '../world/life';
import {CAMERA_PRIORITY,createCameraControl,createLead,damp,deadZoneTarget,drawCameraDebug} from '../camera/cameraDirector';
export {STREET_H};

/* ---------- o quarteirão, da esquerda para a direita ---------- */
const LOT=[
  {k:'grocery',w:240,brick:'#8a3a2c',name:'GROCERY',signc:'#2f5a3a',ink:'#f1e6c8',awn:'#2f5a3a',fire:true,floors:4},
  {k:'apt',w:260,brick:'#8e4434',door:'#2f4a3a',floors:7,inset:[16,0]},
  {k:'diner',w:280,brick:'#9a3f30',name:'DINER',signc:'#b02a24',ink:'#f6f0e2',awn:'#b02a24',floors:3,inset:[12,0]},
  {k:'alley',w:110},
  {k:'dhpp',w:620},
  {k:'alley',w:60},
  {k:'pawn',w:250,brick:'#b09a6a',name:'PAWN SHOP',signc:'#f2efe6',ink:'#a82a24',fire:true,floors:5,inset:[0,22]},
  {k:'laundry',w:240,brick:'#7a5a42',name:'LAUNDRY',signc:'#2e4a8a',awn:'#2e4a8a',floors:4},
  {k:'apt',w:180,brick:'#a0603a',door:'#5a2a22',floors:6,inset:[14,0]},
  {k:'barber',w:240,brick:'#8e3b2c',name:'BARBER',signc:'#e8e2d4',ink:'#7a2a2a',fire:true,floors:3,inset:[18,0]}
];
let acc=0;export const BUILDINGS=LOT.map((b,i)=>{const o={...b,i,X:acc};acc+=b.w;return o;});
export const STREET_W=acc;
export const DHPP=BUILDINGS.find(b=>b.k==='dhpp');
export const DOOR={x:DHPP.X+DHPP.w/2,y:GY+14};          // a porta do DHPP (o pé dos degraus)

/* ---------- mobiliário oficial (pé no centro da última linha), na beira da calçada, encostado nas fachadas ou nos becos ---------- */
const cy=CURB-6,fy=GY+22,ny=FG_TOP-6;
const ALLEYS=BUILDINGS.filter(b=>b.k==='alley');
const PROPS=[
  // calçada de lá, na beira do meio-fio: postes de luz emoldurando o DHPP, parquímetros a cada vaga, lixeiras e hidrantes
  {k:'poste-luz',x:200,y:cy},{k:'poste-luz',x:780,y:cy},{k:'poste-luz',x:1040,y:cy},{k:'poste-luz',x:1370,y:cy},{k:'poste-luz',x:1890,y:cy},{k:'poste-luz',x:2150,y:cy},
  {k:'parquimetro',x:90,y:cy},{k:'parquimetro',x:300,y:cy},{k:'parquimetro',x:470,y:cy},{k:'parquimetro',x:720,y:cy},{k:'parquimetro',x:900,y:cy},{k:'parquimetro',x:1110,y:cy},{k:'parquimetro',x:1300,y:cy},{k:'parquimetro',x:1480,y:cy},{k:'parquimetro',x:1660,y:cy},{k:'parquimetro',x:1960,y:cy},{k:'parquimetro',x:2090,y:cy},{k:'parquimetro',x:2300,y:cy},{k:'parquimetro',x:2430,y:cy},
  {k:'hidrante',x:1240,y:cy},{k:'hidrante',x:330,y:cy},{k:'hidrante',x:2010,y:cy},
  {k:'caixa-correio',x:360,y:cy-2},{k:'caixa-correio',x:1720,y:cy-2},
  {k:'lixeira',x:560,y:cy-4},{k:'lixeira',x:1150,y:cy-4},{k:'lixeira',x:1850,y:cy-4},{k:'lixeira',x:2340,y:cy-4},
  {k:'placa-proibido',x:930,y:cy},{k:'placa-proibido',x:1500,y:cy},{k:'placa-proibido',x:130,y:cy},
  // encostado nas fachadas
  {k:'sacos-lixo',x:820,y:fy},{k:'lixeira-cheia',x:868,y:fy},{k:'sacos-lixo',x:1540,y:fy},{k:'sacos-lixo',x:2330,y:fy+4},{k:'lixeira-cheia',x:520,y:fy+4},{k:'lixeira-cheia',x:1985,y:fy+2},
  {k:'telefone-publico',x:1810,y:fy+2},{k:'jornal-azul',x:1592,y:fy+8},{k:'jornal-vermelho',x:1614,y:fy+8},{k:'jornal-azul',x:590,y:fy+8},{k:'jornal-vermelho',x:612,y:fy+8},
  {k:'banco',x:1010,y:fy+4},{k:'banco',x:1400,y:fy+4},{k:'banco',x:470,y:fy+10},
  {k:'caixa-papelao',x:236,y:fy+6},{k:'caixa-papelao',x:204,y:fy+10},{k:'caixa-papelao',x:2060,y:fy+8},{k:'pallet',x:1862,y:fy+10},
  {k:'alarme-incendio',x:2072,y:fy-4},
  // dentro dos becos
  {k:'cacamba',x:ALLEYS[0].X+ALLEYS[0].w/2+6,y:GY-16,dark:.35},{k:'pallet',x:ALLEYS[1].X+ALLEYS[1].w/2,y:GY-24,dark:.45},{k:'alarme-incendio',x:ALLEYS[0].X+14,y:GY-4,dark:.2},
  // calçada de cá (embaixo): ponto de ônibus, postes, bancos e lixeiras
  {k:'placa-onibus',x:300,y:ny},{k:'banco',x:370,y:ny-4},{k:'poste-luz',x:640,y:ny+8},{k:'poste-luz',x:1100,y:ny+8},{k:'poste-luz',x:1700,y:ny+8},{k:'poste-luz',x:2230,y:ny+8},
  {k:'lixeira-cheia',x:1460,y:ny-2},{k:'lixeira',x:760,y:ny-2},{k:'lixeira',x:2010,y:ny-2},{k:'jornal-vermelho',x:1800,y:ny-2},{k:'caixa-correio',x:930,y:ny-2},{k:'hidrante',x:1900,y:ny-2},{k:'banco',x:1300,y:ny-4},{k:'placa-proibido',x:540,y:ny}
];
const SIGNAL_POLES=CROSSWALKS.flatMap((c,i)=>[{x:c.x-CW_HALF-30,y:cy+2,sig:i},{x:c.x+CW_HALF+34,y:ny+10,sig:i}]);
const PROP_S=1.3,CAR_S=1.2;

/* ---------- arte oficial (carros, mobiliário, chão e efeitos) ---------- */
// eslint-disable-next-line no-undef
const HAS=new Set(typeof __RUA_ART__!=='undefined'?__RUA_ART__:[]);
const IMG=new Map();
function art(path){if(!HAS.has(path))return null;let im=IMG.get(path);if(!im){im=new Image();im.decoding='async';im.src=RUA_DIR+path;IMG.set(path,im);}return im.complete&&im.naturalWidth?im:null;}
const NEED=[...PROPS.map(p=>PATH.prop(p.k)),PATH.semaforo(),'chao/faixa-pedestres.png',...Object.keys(VEICULOS).map(PATH.veiculo),PATH.efeito('vapor-bueiro'),PATH.efeito('fumaca-escape'),PATH.efeito('pombo'),
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
{ // mais gente: combinações de cores e cabelos (determinísticas), para a rua não ter rostos repetidos
  const RL=rnd(5),pick=a=>a[Math.floor(RL()*a.length)];
  const SK=['#f0c9a0','#e8b58e','#e0b48c','#d9a273','#c98e64','#b67c52','#a8714a','#8a5a3a','#6e4630'],HR=['#1f1a18','#2a1d18','#4a2f1d','#7a4a2a','#d8b860','#b8302a'],
    ST=['short','long','cap','bun','side','curly'],TP=['#5a5e66','#e8e4da','#3b5a8a','#2f6a4a','#8a2a2a','#c9a24a','#6a4a6a','#1c1d20','#d08a3a','#4a7a8a','#a8a29a','#7a3a4a'],
    PT=['#3a3e46','#3b5a8a','#2b2f36','#5a4a3a','#3a4a5a','#4a4a3a','#6a6a70'],SH=['#222','#e8e4da','#3a2416','#111'];
  for(let i=0;i<20;i++){const st=pick(ST);PED_LOOKS.push({skin:pick(SK),hair:pick(HR),style:st,kind:'rua',top:pick(TP),pants:pick(PT),shoes:pick(SH),glasses:RL()<.15?1:undefined});}
}
// vagas do meio-fio de lá: a pintura do chão e os carros usam as mesmas medidas (a viatura tem a vaga dela, na porta do DHPP)
const SLOT_WIDTH=196,SLOT_XS=[10,206,712,908,1306,1502,1885,2081,2277];
const STALLS=[...SLOT_XS.map(x=>[x,SLOT_WIDTH]),[DOOR.x-96,192]];


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
export function createStreet({lemosLook,onEnter,getZoom,personFrames,art:A,quality,onSound,hudTop}){
  const Q=()=>{const q=quality?quality():'high';return q==='low'?0:q==='medium'?1:2;};
  let fgRooms=[];
  let layer=buildStatic();
  const ready=preloadRua().then(()=>{layer=buildStatic();});

  function buildStatic(){
    const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
    const bg=document.createElement('canvas');bg.width=STREET_W;bg.height=GY;paintSkyline(bg.getContext('2d'),STREET_W,GY);g.drawImage(bg,0,0);
    paintFacades(g,BUILDINGS,A,{sign:A.sign(),door:A.door(),bg});
    paintGround(g,STREET_W,art,STALLS);
    paintWear(g,BUILDINGS,STREET_W);
    fgRooms=paintForeground(g,STREET_W);
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
  const FAR=[GY+30,CURB-28],NEARB=[NEAR+8,FG_TOP-4];
  const DOORS=[],PANES=[],DRUMS=[];
  for(const b of BUILDINGS){if(b.k!=='dhpp')for(const d of b.doors||[])DOORS.push({...d,shop:b.k,open:0});for(const p of b.panes||[])PANES.push({...p,shop:b.k});for(const d of b.drums||[])DRUMS.push(d);}
  const SPOTS={paper:{x:1603,y:fy+12,busy:null},phone:{x:1824,y:fy+8,busy:null},bench:[{x:1000,y:fy+5,busy:null},{x:1020,y:fy+5,busy:null}],
    busBench:[{x:360,y:ny-3,busy:null},{x:380,y:ny-3,busy:null}],busStand:[{x:300,y:ny-8},{x:318,y:ny-6},{x:336,y:ny-9}]};
  const STOP_X=330;                                   // ponto de ônibus (calçada de cá)
  const life=eventLog(16);
  const NPED=30;
  const peds=Array.from({length:NPED},(_,i)=>{const look=PED_LOOKS[i%PED_LOOKS.length],near=i>=NPED-6,band=near?NEARB:FAR;
    const rush=i%7===3;
    return {id:i,x:R()*STREET_W,y:band[0]+R()*(band[1]-band[0]),near,dir:R()<.5?-1:1,v:rush?30+R()*6:14+R()*10,walk:R()*10,look,frames:personFrames(look),
      st:'idle',t:R()*4,after:'decide',tx:null,ty:null,pose:null,sit:false,hidden:false,off:0,mem:{},social:.2+R()*.8,curious:R(),
      chatCD:20+R()*40,glanceCD:0,talk:0,spot:null,shop:null,door:null,dodge:0,sig:-1};});
  for(const p of peds)p.v0=p.v;
  /* quem trabalha na rua: os dois guardas dos degraus do DHPP, o dono da mercearia, o garçom do diner e o barbeiro ficam
     por perto do seu posto, mudando de pose de tempos em tempos (nunca saem de lá); e o entregador, que só aparece na entrega */
  const doorOf=k=>DOORS.find(d=>d.shop===k);
  const mkStaff=(id,look,x,y,dir,poses)=>{const p={id,x,y,near:false,dir,v:0,v0:0,walk:0,look,frames:personFrames(look),st:'staff',t:2+R()*5,after:'',tx:null,ty:null,pose:null,sit:false,hidden:false,off:0,mem:{},social:0,curious:0,chatCD:999,glanceCD:0,talk:0,spot:null,shop:null,door:null,dodge:0,sig:-1,staff:true,poses,moving:false};peds.push(p);return p;};
  const GUARD={skin:'#c98e64',hair:'#2a1d18',style:'cap',kind:'pm',top:'#7d8187',pants:'#2b2f36',shoes:'#111'},GUARD2={skin:'#f0c9a0',hair:'#3a2416',style:'cap',kind:'pm',top:'#7d8187',pants:'#2b2f36',shoes:'#111'};
  mkStaff(200,GUARD,DOOR.x-88,GY+32,1,['watch','chin','watch',null]);mkStaff(201,GUARD2,DOOR.x+92,GY+34,-1,['watch','phone','scratch',null]);
  {const g=doorOf('grocery'),d=doorOf('diner'),b=doorOf('barber');
   if(g)mkStaff(202,{skin:'#b67c52',hair:'#9a9a9a',style:'grey',kind:'rua',top:'#e8e2d4',pants:'#3a3a40',shoes:'#222'},g.x+46,GY+26,-1,['stretch','watch','scratch',null]);
   if(d)mkStaff(203,{skin:'#e0b48c',hair:'#4a2f1d',style:'bun',kind:'rua',top:'#e8e4da',pants:'#1c1d20',shoes:'#111'},d.x-44,GY+26,1,['drink','watch','stretch',null]);
   if(b)mkStaff(204,{skin:'#8a5a3a',hair:'#1f1a18',style:'curly',kind:'rua',top:'#1c1d20',pants:'#2b2f36',shoes:'#111'},b.x-40,GY+26,1,['watch','phone','chin',null]);}
  const courier=mkStaff(205,{skin:'#d9a273',hair:'#2a1d18',style:'cap',kind:'rua',top:'#8a5a2a',pants:'#3a3e46',shoes:'#222'},0,PARK,1,[]);
  courier.st='cour';courier.hidden=true;courier.courier=true;courier.v=34;courier.carry=false;
  const meta=id=>VEICULOS[id];
  const W=k=>meta(k.id).w*CAR_S;
  /* vagas do meio-fio de lá (carros de frente para o oeste, como a mão da faixa de cima); a viatura tem a dela, na porta */
  const SLOTS=SLOT_XS.map(x=>({x,car:null,busy:null}));
  const parked=[];
  const viatura={id:'viatura-dhpp',x:DOOR.x-W({id:'viatura-dhpp'})/2,y:PARK,dir:-1,v:0,brake:0};parked.push(viatura);
  const SLOT_W=SLOT_WIDTH;
  const placeCar=(k,sl)=>{k.slot=sl;sl.car=k;k.y=PARK;k.dir=-1;k.lane=null;k.yo=null;k.x=sl.x+(SLOT_W-W(k))/2+(R()-.5)*3;k.v=0;k.blink=false;k.park=null;};
  const FIRST=['sedan-bordo','perua-madeira','sedan-bege','sedan-azul','sedan-verde','furgao-marrom'];
  [0,1,3,4,6,8].forEach((si,n)=>{const k={id:FIRST[n],v:0,pv:0,puff:R(),brake:0,dist:0};placeCar(k,SLOTS[si]);parked.push(k);});
  const GAPS=[[410,555],[575,705],[1735,1865]];       // trechos de meio-fio sem vaga (táxi e travessia)
  const gapX=()=>{const g=GAPS[Math.floor(R()*GAPS.length)];return g[0]+R()*(g[1]-g[0]);};
  const POOL=[['sedan-azul',3],['sedan-bordo',3],['sedan-verde',3],['sedan-bege',3],['perua-madeira',2],['taxi',2.2],['furgao-marrom',1.5],['viatura-dhpp',.25]];
  const poolId=()=>{let t=0;for(const [,w] of POOL)t+=w;let r=R()*t;for(const [id,w] of POOL){r-=w;if(r<=0)return id;}return POOL[0][0];};
  const cars=[];
  for(let l=0;l<LANES.length;l++){const n=7;for(let i=0;i<n;i++){const id=poolId(),v=LANES[l].v*(0.72+R()*0.6);cars.push({id,lane:l,x:i*(STREET_W+500)/n-150+R()*120,v,v0:v,base:v,pv:v,puff:R(),brake:0,dist:R()*40,aggr:R(),yj:(R()-.5)*8,dr:R()*8});}}
  const puffs=[];
  /* ar da rua: o vento sopra em rajadas e leva folhas e papéis pela calçada e pela sarjeta; moscas rondam o lixo; nuvens passam e
     sombreiam a rua devagar; fios entre os postes balançam */
  const wind=()=>RM?.2:.5+.5*Math.sin(t*.11)*Math.sin(t*.37+1);
  const debris=Array.from({length:18},(_,i)=>({x:R()*STREET_W,y:i<12?GY+50+R()*(CURB-GY-64):CURB+6+R()*4,vx:0,ph:R()*6.28,k:i%3,g:R()}));
  const flies=PROPS.filter(p=>p.k==='sacos-lixo'||p.k==='cacamba').flatMap(p=>[0,1,2].map(i=>({x:p.x,y:p.y-10,i})));
  const POLES=PROPS.filter(p=>p.k==='poste-luz'&&p.y===cy).map(p=>p.x).sort((a,b)=>a-b);
  // vento: folhas soltas no ar nas rajadas
  const airLeaves=Array.from({length:10},()=>({x:R()*STREET_W,y:GY-220+R()*260,ph:R()*6.28,c:['#7a5a2a','#a8742a','#5a6a2a','#c08a3a'][Math.floor(R()*4)]}));
  let wv=.5,flagPh=0;
  const cloudSpr=(()=>{const c=document.createElement('canvas');c.width=256;c.height=96;const g=c.getContext('2d'),gr=g.createRadialGradient(128,48,4,128,48,128);gr.addColorStop(0,'rgba(96,112,150,.5)');gr.addColorStop(.55,'rgba(96,112,150,.22)');gr.addColorStop(1,'rgba(96,112,150,0)');g.setTransform(1,0,0,.375,0,0);g.fillStyle=gr;g.fillRect(0,0,256,256);return c;})();
  const birds=Array.from({length:6},()=>({x:300+R()*(STREET_W-600),y:WALK[0]+10+R()*(WALK[1]-WALK[0]-20),z:0,dir:R()<.5?-1:1,st:'g',t:R()*40,vx:0,vz:0}));
  // poeira no ar, só visível contra a luz (qualidade alta): poucas partículas, recicladas
  // fachos de sol: largos e estreitos, com respiração lenta; janelas das fachadas (para o brilho do sol)
  const beamSpr=(()=>{const c=document.createElement('canvas');c.width=64;c.height=256;const g=c.getContext('2d');
    const h=g.createLinearGradient(0,0,64,0);h.addColorStop(0,'rgba(255,214,140,0)');h.addColorStop(.3,'rgba(255,214,140,.55)');h.addColorStop(.5,'rgba(255,224,160,.75)');h.addColorStop(.7,'rgba(255,214,140,.55)');h.addColorStop(1,'rgba(255,214,140,0)');g.fillStyle=h;g.fillRect(0,0,64,256);
    g.globalCompositeOperation='destination-in';const v=g.createLinearGradient(0,0,0,256);v.addColorStop(0,'rgba(0,0,0,.2)');v.addColorStop(.15,'rgba(0,0,0,1)');v.addColorStop(.65,'rgba(0,0,0,.75)');v.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=v;g.fillRect(0,0,64,256);return c;})();
  const ghost=(col,ring)=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
    if(ring){gr.addColorStop(0,`rgba(${col},0)`);gr.addColorStop(.72,`rgba(${col},.15)`);gr.addColorStop(.86,`rgba(${col},.9)`);gr.addColorStop(.93,`rgba(${col},.35)`);gr.addColorStop(1,`rgba(${col},0)`);}
    else{gr.addColorStop(0,`rgba(${col},.95)`);gr.addColorStop(.35,`rgba(${col},.55)`);gr.addColorStop(1,`rgba(${col},0)`);}g.fillStyle=gr;g.fillRect(0,0,128,128);return c;};
  const FLARE=[{u:.32,r:.07,a:.28,spr:ghost('255,214,150')},{u:.48,r:.03,a:.45,spr:ghost('255,240,210')},{u:.62,r:.11,a:.22,spr:ghost('255,170,120',true)},
    {u:.78,r:.045,k:'hex',a:.12,c:'rgba(140,220,200,1)'},{u:.95,r:.02,a:.5,spr:ghost('255,250,230')},{u:1.12,r:.13,a:.16,spr:ghost('170,210,255',true)},
    {u:1.3,r:.06,k:'hex',a:.1,c:'rgba(200,160,255,1)'},{u:1.48,r:.09,a:.18,spr:ghost('255,200,140')}];
  const BEAMS=Array.from({length:9},(_,i)=>({x:120+i*(STREET_W/9)+R()*120,w:60+R()*150,a:.07+R()*.07,sp:.2+R()*.3,ph:R()*6}));
  const WINS=BUILDINGS.flatMap(b=>(b.wins||[]).filter(w=>w.y>=0));
  const motes=Array.from({length:40},()=>({x:R(),y:R(),v:.3+R()*.7,p:R()*6.28}));
  const front=createFront(STREET_W,BAND_BOT);
  const dwellers=createDwellers({buildings:BUILDINGS,rooms:fgRooms,looks:PED_LOOKS,personFrames,R,RM,lemos,onSound});
  const camera=createCameraControl({manualHold:2600,reducedMotion:RM});
  const lead=createLead();   // espaço à frente de Lemos (suavizado; ver cameraDirector)
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
  for(const m of MANHOLES)ENTS.push(ent('steam',m,m.y));
  for(const sp of SIGNAL_POLES)ENTS.push(ent('signal',sp,sp.y));

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
    {id:'cross',w:.5,cool:70},
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
      case 'cross':{let ci=-1,best=1e9;SIGS.forEach((g,i)=>{const d=Math.abs(g.x-p.x);if(d<best){best=d;ci=i;}});
        if(ci>=0&&best<1100&&R()<.82){p.sig=ci;go(p,SIGS[ci].x+(R()-.5)*50,p.near?NEAR+8:CURB-14,'curb');}
        else{p.sig=-1;let x=gapX();for(let i=0;i<4&&Math.abs(x-p.x)>500;i++)x=gapX();go(p,x,p.near?NEAR+8:CURB-14,'curb');}break;}
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
      case 'offstage':p.v=p.v0||p.v;p.hidden=true;p.st='off';p.off=jitter(R,30);break;
      case 'cross':p.near=!p.near;p.onRoad=false;p.sig=-1;decide(p);break;
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
      let sp=p.v*(p.st==='cross'?2.4:1);
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
      case 'curb':p.t+=dt;{const g=p.sig>=0?SIGS[p.sig]:null;if(g&&g.st==='green'&&!g.req&&p.t>.5){g.req=true;life.emit(t,'rua','pedestre apertou o botão do semáforo');sound('beep',g.x,.4);}
        const ok=g?g.st==='red'&&g.t>1.2&&g.dur-g.t>5.5:clearToCross(p.x);
      if(ok&&p.t>.8){p.st='cross';p.onRoad=true;p.pose=null;p.tx=p.x+(R()-.5)*20;p.ty=p.near?CURB-14:NEAR+8;p.after='cross';life.emit(t,'rua','atravessando');}
        else if(p.t>(g?60:25)){p.pose=null;p.sig=-1;decide(p);}}break;
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
    if(!bus){if((busT-=dt)<=0){const w=meta('onibus').w*CAR_S;bus={id:'onibus',lane:1,x:-w-80,v:76,v0:76,pv:76,puff:0,brake:0,st:'run',bus:true,t:0};cars.push(bus);ENTS.push(ent('car',bus,LANES[1].y));life.emit(t,'ônibus','ônibus chegando');}return;}
    const w=W(bus),front=bus.x+w;
    if(bus.st==='run'&&front>STOP_X-60&&front<STOP_X+260){const left=STOP_X+170-front;bus.target=left<6?0:Math.min(bus.v0,left*.9+6);if(left<6){bus.st='stop';bus.t=0;bus.v=0;sound('brake',bus.x+w/2,.6);life.emit(t,'ônibus','parado no ponto');}}
    else if(bus.st==='stop'){bus.t+=dt;bus.target=0;
      if(bus.t>1.2&&!bus.done){bus.done=true;sound('busdoor',bus.x+w/2,.7);
        for(const p of peds)if(p.st==='bus'){release(p);p.sit=false;p.pose=null;go(p,bus.x+w*.72,LANES[1].y-8,'board');}
        if(R()<.6){const q=peds.find(p=>p.st==='off');if(q){q.hidden=false;q.near=true;q.x=bus.x+w*.72;q.y=NEARB[0]+6;q.dir=R()<.5?-1:1;decide(q);life.emit(t,'ônibus','alguém desceu');}}}
      if(bus.t>6&&!peds.some(p=>p.after==='board'&&!p.hidden)){bus.st='go';bus.target=null;sound('bus',bus.x+w/2,.6);}}
    else bus.target=null;
    if(bus.x>STREET_W+80){cars.splice(cars.indexOf(bus),1);const i=ENTS.findIndex(e=>e.ref===bus);if(i>=0)ENTS.splice(i,1);bus=null;busT=jitter(R,60,.4);}
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

  /* ---------- semáforos das faixas de pedestres: o pedestre aperta o botão, o verde dos carros fecha depois de um tempo mínimo ---------- */
  const SIGS=CROSSWALKS.map((c,i)=>({x:c.x,st:'green',t:i*9,hold:16+i*8,dur:0,req:false,beep:0}));
  function updSig(dt){for(const g of SIGS){g.t+=dt;
    if(g.st==='green'){if((g.req&&g.t>7)||g.t>g.hold){g.st='yellow';g.t=0;}}
    else if(g.st==='yellow'){if(g.t>2.2){g.st='red';g.t=0;g.dur=13;g.req=false;life.emit(t,'semáforo','carros parados, pedestres atravessam');}}
    else{g.beep-=dt;if(g.beep<=0){g.beep=.9;sound('beep',g.x,.3);}if(g.t>g.dur){g.st='green';g.t=0;g.hold=20+R()*14;}}}}
  // faixa de pedestres à frente de quem dirige: precisa parar na linha (amarelo só para quem ainda consegue frear)
  function sigLimit(k,w,L,v){for(const g of SIGS){if(g.st==='green')continue;
    const line=L.dir<0?g.x+CW_HALF+12:g.x-CW_HALF-12,dist=L.dir<0?k.x-line:line-(k.x+w);if(dist<-2)continue;
    const brakeD=k.v*k.v/120;if(g.st==='red'||dist>brakeD+10)v=Math.min(v,dist<3?0:dist*1.1);}return v;}

  /* ---------- quem trabalha na rua e o entregador ---------- */
  function updStaff(p,dt){p.moving=false;if(p.glanceCD>0)p.glanceCD-=dt;
    if((p.t-=dt)<=0){p.pose=p.poses.length&&R()<.7?p.poses[Math.floor(R()*p.poses.length)]:null;p.t=jitter(R,6,.5);if(R()<.15)p.dir=-p.dir;}
    if(p.glanceCD<=0&&Math.abs(lemos.x-p.x)<70&&Math.abs(lemos.y-p.y)<50){p.dir=lemos.x>p.x?1:-1;p.glanceCD=10;p.pose=null;}}
  const stepTo=(p,tx,ty,dt)=>{const dx=tx-p.x,dy=ty-p.y,d=Math.hypot(dx,dy),st=p.v*dt;p.moving=true;if(d<=st){p.x=tx;p.y=ty;p.moving=false;return true;}p.x+=dx/d*st;p.y+=dy/d*st;p.walk+=st/32;if(Math.abs(dx)>.5)p.dir=dx>0?1:-1;return false;};

  /* ---------- estacionar, sair da vaga, entrega e outros acontecimentos espontâneos ---------- */
  let evT=10,pendingPark=null,dlv=null;const evMem={};
  function parkDone(k){const dv=k.park.delivery,sl=k.park.slot;cars.splice(cars.indexOf(k),1);placeCar(k,sl);sl.busy=null;parked.push(k);sound('brake',k.x+W(k)/2,.35);
    life.emit(t,'rua','carro estacionou');if(dv&&dlv){dlv.st='unload';dlv.t=0;dlv.van=k;}}
  function unparkCar(k){const i=parked.indexOf(k);if(i>=0)parked.splice(i,1);if(k.slot){k.slot.car=null;k.slot=null;}
    k.lane=0;k.yo=PARK;k.v=0;k.pv=0;k.v0=k.base=LANES[0].v*(.8+R()*.4);k.aggr=R();k.yj=(R()-.5)*8;k.pass=null;k.unpark={st:'blink',t:0};k.blink=true;k.dist=0;k.siren=false;k.target=null;cars.push(k);life.emit(t,'rua','carro saindo da vaga');}
  const lane0=()=>cars.filter(k=>k.lane===0);
  const freeSlots=()=>SLOTS.filter(s=>!s.car&&!s.busy);
  const canUnpark=k=>k!==viatura&&k.slot&&!(dlv&&dlv.van===k)&&!peds.some(p=>!p.hidden&&p.onRoad&&Math.abs(p.x-k.x-W(k)/2)<120);
  const mergeClear=(k,w)=>!lane0().some(o=>o!==k&&!o.pass&&(o.yo==null||Math.abs(o.yo-LANES[0].y)<40)&&o.x>k.x-W(o)-50&&o.x<k.x+w+330+o.v*1.4);
  function startDelivery(){const sl=freeSlots().filter(s=>s.x<900);if(!sl.length)return false;const sx=sl[Math.floor(R()*sl.length)];sx.busy=true;
    pendingPark={slot:sx,id:'furgao-marrom',delivery:true};dlv={st:'wait',t:0,van:null,door:null,wp:0};life.emit(t,'entrega','furgão a caminho de uma entrega');return true;}
  function updDlv(dt){const d=dlv;if(!d)return;d.t+=dt;const c=courier;
    if(d.st==='wait'){if(d.t>150&&pendingPark){pendingPark.slot.busy=null;pendingPark=null;dlv=null;}return;}
    const van=d.van,xw=van?van.x-12:0;
    if(d.st==='unload'){if(d.t>1.4){sound('cardoor',van.x,.5);c.hidden=false;c.carry=true;c.x=xw;c.y=PARK+2;c.dir=-1;c.moving=false;
        const ds=[doorOf('grocery'),doorOf('diner')].filter(Boolean).sort((a,b)=>Math.abs(a.x-van.x)-Math.abs(b.x-van.x));d.door=ds[0];d.st='to';d.wp=0;life.emit(t,'entrega','entregador levando caixas');}}
    else if(d.st==='to'){const done=d.wp===0?stepTo(c,xw,640,dt):stepTo(c,d.door.x,GY+16,dt);if(done){if(d.wp===0)d.wp=1;else{c.hidden=true;d.door.open=.7;sound('door',c.x,.5);d.st='in';d.t=0;}}}
    else if(d.st==='in'){if(d.t>jitter(R,6)){c.hidden=false;c.carry=false;c.x=d.door.x;c.y=GY+16;d.door.open=.7;sound('door',c.x,.5);d.st='back';d.wp=0;}}
    else if(d.st==='back'){const done=d.wp===0?stepTo(c,xw,640,dt):stepTo(c,xw,PARK+2,dt);if(done){if(d.wp===0)d.wp=1;else{c.hidden=true;sound('cardoor',van.x,.5);d.st='go';d.t=0;}}}
    else if(d.st==='go'&&d.t>.8){unparkCar(van);dlv=null;}}
  function startJog(){const p=peds.find(q=>q.st==='off'&&!q.staff);if(!p)return false;const east=R()<.5;p.near=false;p.v=46+R()*10;p.x=east?STREET_W+30:-30;p.y=FAR[0]+R()*(FAR[1]-FAR[0]);p.hidden=false;go(p,east?-40:STREET_W+40,p.y,'offstage');life.emit(t,'rua','alguém correndo pela calçada');return true;}
  function startSiren(){const vx=lastView?lastView.left+lastView.vw+80:STREET_W,k=lane0().find(o=>!o.job&&!o.park&&!o.unpark&&!o.bus&&o.yo==null&&o.x>vx);if(!k)return false;k.id='viatura-dhpp';k.siren=true;k.v0=k.base=LANES[0].v*1.3;life.emit(t,'rua','viatura passando com a sirene');return true;}
  const EVOPTS=[
    {id:'unpark',w:()=>!pendingPark&&lane0().length<9&&parked.some(canUnpark)&&SLOTS.filter(s=>s.car).length>4?1.1:0,cool:45},
    {id:'park',w:()=>!pendingPark&&freeSlots().length&&lane0().length>4?(SLOTS.filter(s=>s.car).length<5?1.8:.8):0,cool:45},
    {id:'delivery',w:()=>!dlv&&!pendingPark&&freeSlots().some(s=>s.x<900)?.8:0,cool:150},
    {id:'jog',w:()=>peds.some(q=>q.st==='off'&&!q.staff)?.8:0,cool:80},
    {id:'siren',w:()=>.4,cool:170}];
  function events(dt){updDlv(dt);if((evT-=dt)>0)return;evT=jitter(R,15,.5);
    const o=choose(R,EVOPTS,null,evMem,t);if(!o)return;
    if(o.id==='unpark'){const c=parked.filter(canUnpark);if(c.length)unparkCar(c[Math.floor(R()*c.length)]);}
    else if(o.id==='park'){const f=freeSlots();if(f.length){const sl=f[Math.floor(R()*f.length)];sl.busy=true;pendingPark={slot:sl,id:null,delivery:false};}}
    else if(o.id==='delivery')startDelivery();else if(o.id==='jog')startJog();else if(o.id==='siren')startSiren();}

  /* ---------- um carro: segue o da frente, para na linha do semáforo, cede a quem atravessa, estaciona e sai da vaga ---------- */
  function recycle(k,L,ln){const dir=L.dir;if(!k.job){k.yo=null;k.pass=null;}
    if(L===LANES[0]&&pendingPark&&!k.job&&!k.park){k.id=pendingPark.id||poolId();k.park={slot:pendingPark.slot,delivery:pendingPark.delivery};pendingPark=null;}
    else if(!k.job)k.id=poolId();
    k.siren=false;k.blink=false;const w=W(k),gap=140+R()*420;
    if(dir>0){const back=Math.min(...ln.map(o=>o.x));k.x=Math.min(-w-60,back-w-gap);}else{const back=Math.max(...ln.map(o=>o.x+W(o)));k.x=Math.max(STREET_W+60,back+gap);}
    k.v0=k.base=L.v*(0.72+R()*0.6);k.aggr=R();k.yj=(R()-.5)*8;k.pass=null;}
  /* ultrapassagem: quem chega rápido atrás de um carro lento (ônibus, parado no trânsito, motorista devagar) entra na faixa do meio,
     passa e volta quando há espaço; só com a faixa do meio livre, longe da faixa de pedestres e sem semáforo fechado na frente */
  const nearCW=(x,m)=>CROSSWALKS.some(c=>Math.abs(c.x-x)<m);
  function tryPass(k,L,w,lead,ln,dt){
    const dir=L.dir,gap=dir>0?lead.x-(k.x+w):k.x-(lead.x+W(lead));
    if(gap>100||gap<-10||lead.pass||k.brake>.5&&k.v<5)return;
    const slowLead=lead.bus||lead.v0<k.v0*.88||lead.v<k.v0*.6;if(!slowLead||k.aggr<.25)return;
    if(R()>dt*(.6+k.aggr*1.8))return;
    if(nearCW(k.x,300)||nearCW(lead.x,300)||SIGS.some(g=>g.st!=='green'&&Math.abs(g.x-k.x)<650))return;
    if(k.x<60||k.x>STREET_W-60)return;
    const ahead=ln[ln.indexOf(k)-2];if(ahead){const g2=dir>0?ahead.x-(lead.x+W(lead)):lead.x-(ahead.x+W(ahead));if(g2<260)return;}
    if(cars.some(o=>o!==k&&o.pass&&Math.abs(o.x-k.x)<420))return;
    if(peds.some(p=>p.onRoad&&!p.hidden&&Math.abs(p.x-k.x)<300))return;
    k.pass={st:'out',t:0,lead};k.blink=true;}
  function passStep(k,L,w,dt,v,ln){
    const P=k.pass,off=L.dir<0?40:-40,lead=P.lead,dir=L.dir;P.t+=dt;
    if(P.st==='out'){k.yo=L.y+off*Math.min(1,P.t/.8);v=Math.min(v,k.v);if(P.t>.8){P.st='on';P.t=0;k.blink=false;}return Math.max(v,k.v0*.9);}
    if(P.st==='on'){k.yo=L.y+off;const clear=dir>0?k.x>lead.x+W(lead)+30:k.x+w<lead.x-30;
      if(clear||P.t>14){const next=dir>0?ln.find(o=>o.x>k.x):ln.find(o=>o.x<k.x),g=next?(dir>0?next.x-(k.x+w):k.x-(next.x+W(next))):999;
        if(g>110||P.t>14){P.st='in';P.t=0;k.blink=true;}}
      return k.v0*1.22;}
    k.yo=L.y+off*(1-Math.min(1,P.t/.8));if(P.t>.8){k.yo=null;k.pass=null;k.blink=false;}return Math.min(v,k.v0);}
  function stepCar(k,L,lead,ln,dt){
    const dir=L.dir,w=W(k);let v=k.target!=null?k.target:k.v0;const inLane=k.yo==null||Math.abs(k.yo-L.y)<=40,ly=k.yo??L.y;
    if(k.park){const sx=k.park.slot.x+(SLOT_W-w)/2,dd=k.x-sx;
      if(dd<300){k.blink=true;v=Math.min(v,Math.max(0,dd)*.8+8);k.yo=L.y+(PARK-L.y)*Math.max(0,Math.min(1,(300-dd)/240));}
      if(dd<=1.5&&k.v<14){parkDone(k);return;}
      if(dd<0)k.x=sx;}
    if(k.unpark){const U=k.unpark;U.t+=dt;
      if(U.st==='blink'){v=0;k.blink=true;if(U.t>1.6&&mergeClear(k,w)){U.st='merge';U.t=0;}}
      else{const pr=Math.min(1,U.t/2.2);k.yo=PARK+(L.y-PARK)*pr;v=Math.min(v,k.v0*Math.min(1,.25+U.t/1.6));if(pr>=1){k.yo=null;k.unpark=null;k.blink=false;}}}
    if(!k.bus&&!k.job&&!k.park&&!k.unpark){k.dr=(k.dr||0)-dt;if(k.dr<=0){k.dr=4+R()*9;k.base=k.base||k.v0;k.v0=Math.max(L.v*.6,Math.min(L.v*1.35,k.base*(.88+R()*.24)));}}
    if(k.pass)v=passStep(k,L,w,dt,v,ln);
    else if(lead&&k.yo==null&&!k.bus&&!k.job&&!k.park&&!k.unpark)tryPass(k,L,w,lead,ln,dt);
    if(lead&&inLane&&!k.pass){const gap=dir>0?lead.x-(k.x+w):k.x-(lead.x+W(lead));if(gap<70)v=Math.min(v,lead.v*(gap<28?0.6:1),gap<14?0:99);}
    if(inLane)v=sigLimit(k,w,L,v);
    for(const p of peds){if(!p.onRoad||p.hidden||p.y<ly-46||p.y>ly+14)continue;const ahead=dir>0?p.x-(k.x+w):k.x-p.x;
      if(ahead>-12&&ahead<170){v=Math.min(v,ahead<46?0:(ahead-46)*.5);if(ahead<60&&k.v<2){k.wait=(k.wait||0)+dt;if(k.wait>2.5&&!k.honked&&R()<.3){k.honked=true;sound('honk',k.x,.5);}}}}
    k.pv=k.v;k.v+=(v-k.v)*Math.min(1,dt*(v<k.v?4:2));if(k.v<.5&&v===0)k.v=0;k.x+=dir*k.v*dt;k.dist=(k.dist||0)+k.v*dt;
    k.brake=k.v<k.pv-.05||(k.v<8&&v<k.v0*.5)?Math.min(1,k.brake+dt*6):Math.max(0,k.brake-dt*3);
    if(k.v>3)k.honked=false,k.wait=0;
    k.puff+=dt;if(k.puff>.45){k.puff=0;if(puffs.length<40&&k.v>3)puffs.push({x:dir>0?k.x+4:k.x+w-4,y:ly-10,vx:-dir*12,t:0});}
    if(k.bus)return;
    if(dir>0&&k.x>STREET_W+60||dir<0&&k.x<-w-60)recycle(k,L,ln);}

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
    for(const p of peds){if(p.staff){if(!p.courier)updStaff(p,dt);continue;}if(p.chatCD>0)p.chatCD-=dt;updPed(p,dt);}
    if((t*2|0)!==((t-dt)*2|0))chats();
    for(const d of DOORS)if(d.open>0)d.open-=dt;
    updBus(dt);updTaxi(dt);updSig(dt);events(dt);dwellers.update(dt,t);
    for(const b of birds){b.t+=dt*30;
      if(b.st==='g'){if(Math.random()<dt*.6)b.x+=b.dir*2;if(Math.random()<dt*.2)b.dir=-b.dir;
        let near=Math.abs(lemos.x-b.x)<34&&Math.abs(lemos.y-b.y)<18;for(let i=0;!near&&i<peds.length;i++){const p=peds[i];near=!p.hidden&&Math.abs(p.x-b.x)<34&&Math.abs(p.y-b.y)<18;}
        if(near){b.st='f';b.vx=(Math.random()<.5?-1:1)*(70+Math.random()*50);b.vz=70;b.dir=Math.sign(b.vx);b.tx=Math.max(60,Math.min(STREET_W-60,b.x+b.vx*2.4));sound('flap',b.x,.3);}}
      else{b.x+=b.vx*dt;b.z=Math.max(0,b.z+b.vz*dt);if(Math.abs(b.x-b.tx)<60)b.vz=-60;else if(b.z>60)b.vz=0;
        if(b.vz<0&&b.z<=0){b.st='g';b.z=0;b.y=WALK[0]+10+Math.random()*(WALK[1]-WALK[0]-20);}}}
    // trânsito: cada um segue o da frente na mesma faixa, para na linha do semáforo, cede a quem atravessa e acelera com a pista livre;
    // fumacinha do escapamento atrás; luz de freio quando desacelera; seta quando entra ou sai da vaga
    for(let l=0;l<LANES.length;l++){const L=LANES[l],dir=L.dir,all=cars.filter(k=>k.lane===l),ln=all.filter(k=>!k.pass&&(k.yo==null||Math.abs(k.yo-L.y)<=40)).sort((a,b)=>dir>0?b.x-a.x:a.x-b.x);
      for(const k of all){if(k.lane!==l)continue;const i=ln.indexOf(k);stepCar(k,L,i>0?ln[i-1]:null,ln,dt);}}
    wv+=(wind()-wv)*Math.min(1,dt*.8);flagPh+=dt*(5.5+wv*6);
    if(!RM){for(const l of airLeaves){l.ph+=dt*(3+wv*4);l.x+=(8+wv*wv*110)*dt;l.y+=Math.sin(l.ph)*dt*14+(wv<.45?16:-2)*dt;if(l.x>STREET_W+40||l.y>GY+60){l.x=-30;l.y=GY-240+R()*200;}}}
    {const gust=wind(),tv=4+gust*gust*70;for(const d of debris){d.vx+=(tv*(d.k===2?1.15:.8)-d.vx)*Math.min(1,dt*.8);d.x+=d.vx*dt;d.ph+=dt*(2+d.vx*.12);if(d.x>STREET_W+30){d.x=-30;d.y=d.g<.66?GY+50+R()*(CURB-GY-64):CURB+6+R()*4;}}}
    for(const p of puffs){p.t+=dt;p.x+=(p.vx+wv*22)*dt;p.y-=dt*5;}while(puffs.length&&puffs[0].t>1)puffs.shift();
    if(!RM)for(const m of motes){m.p+=dt*m.v;m.x+=dt*.004*m.v;m.y+=Math.sin(m.p)*dt*.004;if(m.x>1)m.x-=1;}
    if(tapFx&&(tapFx.t+=dt)>.7)tapFx=null;
  }
  /** a rua continuou enquanto o Lemos estava lá dentro: avança a simulação (até 2 min) sem desenhar */
  function resume(sec){const n=Math.min(480,Math.round(Math.max(0,sec)/.25));for(let i=0;i<n;i++)update(.25);}
  /** linhas do painel ?debug=1 */
  function debugRows(){const vis=peds.filter(p=>!p.hidden).length;
    return [`RUA · pedestres ${vis}/${peds.length} · carros ${cars.length} (+${parked.length} estacionados)${SIGS.map((g,i)=>' · sem'+i+' '+g.st).join('')}${dlv?' · entrega '+dlv.st:''}${bus?' · ônibus '+bus.st:''}${taxiJob?' · táxi '+taxiJob.st:''}`,
      ...peds.map(p=>`#${p.id} ${p.near?'cá':'lá'} ${p.st}${p.after&&p.st==='walk'?'→'+p.after:''}${p.pose?' ('+p.pose+')':''} x${p.x|0}`),
      '— acontecimentos —',...life.list.slice(-8).map(e=>`${e.t.toFixed(0)}s ${e.type}: ${e.txt}`)];}

  // Enquadramento Beat Cop. A escala é inteira (cada pixel da arte vira um bloco igual de pixels da tela) e é a maior em que a
  // faixa essencial — do térreo das lojas até a mão de baixo do trânsito — cabe abaixo do cabeçalho. Assim o trânsito aparece em
  // qualquer aparelho (no iPhone, de tela 3x, a escala 2 mostra ~585 px de mundo na altura). A câmera alinha essa faixa embaixo:
  // o que sobra de altura vira fachada, e nunca o contrário. Na horizontal ela segue Lemos (com espaço à frente).
  function view(cw,ch,rs){
    const hud=(hudTop?hudTop():56)*rs;
    let baseS=Math.max(1,Math.min(3,Math.floor((ch-hud)/(BAND_BOT-BAND_TOP))));if(ch/baseS>STREET_H)baseS=Math.ceil(ch/STREET_H);
    let s=Math.max(1,Math.round(baseS*camZoom));
    const vw=cw/s,vh=ch/s,hudW=hud/s;
    const ctl=camera.resolve(),manual=ctl.mode==='manual';
    // alinhada embaixo (a mão de baixo do trânsito sempre entra); sem esconder o térreo sob o cabeçalho; com folga de calçada de cá em telas altas
    const bandBot=BAND_BOT+Math.max(0,Math.min(220,(vh-hudW-(BAND_BOT-BAND_TOP))*.6));
    let topC=Math.min(bandBot-vh,BAND_TOP-hudW);topC=Math.max(0,Math.min(topC,STREET_H-vh));
    if(!manual){
      const focus=ctl.focus,dir=lemos.moving&&Math.abs(lemos.vx)>2?Math.sign(lemos.vx):lemos.dir;
      const near=Math.abs(lemos.x-DOOR.x)<330,biasX=near?(DOOR.x-lemos.x)*.22:0;
      // espaço à frente: o centro da câmera fica adiante de Lemos (até ~14% da largura visível), com o deslocamento
      // crescendo e invertendo devagar; parado, a câmera guarda um terço dele em vez de voltar ao centro
      const A=RM?0:Math.min(230,vw*.14);
      const ld=focus?{x:0,y:0}:lead.update(dir,0,lemos.moving,cameraDt,A,0,lemos.dir);
      const subject={x:(focus?.x??lemos.x)+ld.x,y:camY==null?topC+vh/2:camY};
      const dz=deadZoneTarget({x:camX,y:subject.y},subject,{viewportW:vw,viewportH:vh,zoneX:vw*(RM ? .1 : .04),zoneY:vh,biasX});
      const tx=dz.x,ty=topC+vh/2-(near?Math.min(vh*.03,18):0);
      const rate=focus?(RM?18:4.8):(lemos.moving?6.8:2.1);
      camX=damp(camX,tx,rate,cameraDt);camY=camY==null?ty:damp(camY,ty,Math.max(rate,3),cameraDt);
      cameraInfo={mode:ctl.mode,priority:ctl.priority,zoneX:dz.zoneX*s/rs,zoneY:dz.zoneY*s/rs,targetX:(dz.desiredX-(camX-vw/2))*s/rs,targetY:(ty-(camY-vh/2))*s/rs};
    }
    camX=clamp(camX,vw/2,STREET_W-vw/2);
    let top;if(vh>=STREET_H){top=STREET_H-vh;camY=top+vh/2;}else{const want=clamp((camY==null?topC+vh/2:camY)-vh/2,0,STREET_H-vh);top=want;camY=top+vh/2;}
    return {s,baseS,left:camX-vw/2,top,rs,vw,vh};
  }
  const clamp=(v,a,b)=>a>b?(a+b)/2:v<a?a:v>b?b:v;

  // camada de sombras projetadas, em meia resolução (as bordas saem macias ao ampliar)
  const shc=document.createElement('canvas'),shx=shc.getContext('2d');
  let gradeKey='',gradeSun=null,sunGlow=null;   // a vinheta é a mesma da base (#vig, em CSS): nada de pintar outra aqui
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
    for(const d of debris){if(d.x<x0||d.x>x1)continue;const hop=Math.max(0,Math.sin(d.ph))*Math.min(5,d.vx*.08),X=Math.round(d.x),Y=Math.round(d.y-hop);
      ctx.fillStyle='rgba(20,16,14,.22)';ctx.fillRect(X,Math.round(d.y),3,1);
      if(d.k===0){ctx.fillStyle=Math.sin(d.ph*.7)>0?'#7a5a2a':'#a8742a';ctx.fillRect(X,Y-1,3,2);}
      else if(d.k===1){ctx.fillStyle='#5a6a2a';ctx.fillRect(X,Y-1,2+(Math.sin(d.ph)>0?1:0),2);}
      else{const fw=2+Math.round(Math.abs(Math.sin(d.ph))*3);ctx.fillStyle='#e6e1d2';ctx.fillRect(X,Y-2,fw,3);ctx.fillStyle='rgba(120,110,96,.5)';ctx.fillRect(X,Y,fw,1);}}
    // porta do DHPP acesa quando o Lemos entra
    if(doorT>0){ctx.fillStyle=`rgba(255,226,160,${.45*doorT})`;ctx.fillRect(DOOR.x-50,GY-76,100,68);}
    for(const f of DHPP.flags||[])flag(ctx,f.x,f.y,f.v);
    // portas das lojas abrindo quando alguém entra ou sai; tambores da lavanderia girando
    dwellers.draw(ctx,x0,x1,t,q,top-60,top+ch/s+60);
    for(const d of DOORS)if(d.open>0&&d.x>x0&&d.x<x1){const k=Math.min(1,d.open/.35)*Math.min(1,(.7-d.open)/.15+.2);ctx.fillStyle=`rgba(18,14,12,${.75*k})`;ctx.fillRect(Math.round(d.dx+d.w*.35),Math.round(d.dy+2),Math.round(d.w*.62),Math.round(d.h-2));ctx.fillStyle=`rgba(255,226,170,${.25*k})`;ctx.fillRect(Math.round(d.dx+d.w*.35),Math.round(d.dy+d.h-3),Math.round(d.w*.62),3);}
    if(!RM)for(const d of DRUMS){if(d.x<x0||d.x>x1)continue;const a=t*5+d.x;ctx.fillStyle='rgba(235,242,250,.85)';ctx.fillRect(Math.round(d.x+Math.cos(a)*5)-1,Math.round(d.y+Math.sin(a)*5)-1,2,2);ctx.fillStyle='rgba(120,150,180,.6)';ctx.fillRect(Math.round(d.x+Math.cos(a+2.4)*4),Math.round(d.y+Math.sin(a+2.4)*4),2,2);}
    // ordem de desenho pelo pé
    for(const e of ENTS){const r=e.ref;if(e.k==='car'){if(r.lane!=null)e.y=(r.yo??LANES[r.lane].y)+(r.yj||0);}else e.y=r.y;}
    for(let i=1;i<ENTS.length;i++){const e=ENTS[i];let j=i-1;while(j>=0&&ENTS[j].y>e.y){ENTS[j+1]=ENTS[j];j--;}ENTS[j+1]=e;}
    // sombras projetadas (média e alta): silhuetas inclinadas na direção do sol, numa camada só (não somam escuro)
    if(q>=1){const hs=s/2,sw=Math.ceil(cw/2),sh=Math.ceil(ch/2);if(shc.width!==sw||shc.height!==sh){shc.width=sw;shc.height=sh;}
      shx.setTransform(1,0,0,1,0,0);shx.clearRect(0,0,sw,sh);shx.imageSmoothingEnabled=false;let n=0;
      const cast=(im,fx,fyy,u0,v0,dw,dh,flip,sx,sy,sww,shh)=>{shx.setTransform(hs,0,0,hs,ox/2,oyr/2);shx.transform(1,0,-SUN.kx,-SUN.ky,fx,fyy);if(flip)shx.scale(-1,1);
        if(sx!=null)shx.drawImage(silhouette(im),sx,sy,sww,shh,u0,v0,dw,dh);else shx.drawImage(silhouette(im),u0,v0,dw,dh);n++;};
      for(const e of ENTS){const r=e.ref;
        if(e.k==='prop'){const im=art(PATH.prop(r.k));if(!im||r.x<x0||r.x>x1||r.dark)continue;const w=im.width*PROP_S,h=im.height*PROP_S;cast(im,r.x,r.y,-w/2,-h,w,h);}
        else if(e.k==='ped'){if(r.hidden||r.x<x0||r.x>x1)continue;const im=r.frames[pedFrame(r)];cast(im,Math.round(r.x),Math.round(r.y),-14,-45,im.width,im.height,r.dir<0);}
        else if(e.k==='signal'){const im=art(PATH.semaforo());if(!im||r.x<x0||r.x>x1)continue;cast(im,r.x,r.y,-12,-96*PROP_S+0,18*PROP_S,96*PROP_S,false,SIGF[SIGS[r.sig].st]*18,0,18,96);}
        else if(e.k==='tree'){if(r.x<x0||r.x>x1)continue;cast(r.trunk,r.x,r.y,-10,-80,20,80);cast(r.crown,r.x,r.y,-r.crown.width/2,-150,r.crown.width,r.crown.height);}
        else if(e.k==='car'){const x=r.x;if(x+300<x0||x>x1)continue;const m=meta(r.id),im=art(PATH.veiculo(r.id));if(!im)continue;const w=m.w*CAR_S,h=m.h*CAR_S,dir=r.lane!=null?LANES[r.lane].dir:(r.dir||1);
          shx.setTransform(hs,0,0,hs,ox/2,oyr/2);shx.transform(1,0,-SUN.kx*.7,-SUN.ky*.8,Math.round(dir<0?x+w:x),Math.round(e.y));if(dir<0)shx.scale(-1,1);shx.drawImage(silhouette(im),0,0,m.w,m.h,0,-h,w,h);n++;}}
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;shx.setTransform(1,0,0,1,0,0);shx.globalCompositeOperation='source-in';shx.fillStyle='#241a3a';shx.fillRect(0,0,sw,sh);shx.globalCompositeOperation='source-over';ctx.globalAlpha=.42;ctx.drawImage(shc,0,0,sw*2,sh*2);ctx.restore();ctx.imageSmoothingEnabled=false;stats.shadows=n;}
    let drawn=0;
    for(const e of ENTS){const r=e.ref;
      switch(e.k){
        case 'prop':{if(r.x<x0||r.x>x1)break;const im=art(PATH.prop(r.k));if(!im)break;const w=im.width*PROP_S,h=im.height*PROP_S;
          contact(ctx,r.x+1,r.y,Math.max(4,w*.42),2.5,.3);ctx.drawImage(r.dark?dimmed(im,r.dark):im,Math.round(r.x-w/2),Math.round(r.y-h),Math.round(w),Math.round(h));drawn++;break;}
        case 'tree':{if(r.x<x0||r.x>x1)break;tree(ctx,r);drawn++;break;}
        case 'signal':{if(r.x<x0||r.x>x1)break;signal(ctx,r);drawn++;break;}
        case 'ped':{if(r.hidden||r.x<x0||r.x>x1)break;person(ctx,r);drawn++;break;}
        case 'car':{const x=r.x;if(x+300<x0||x>x1)break;if(r.lane!=null){const L=LANES[r.lane];car(ctx,r,x,e.y,L.dir,false);}else car(ctx,r,x,r.y,r.dir||1,r===viatura);drawn++;break;}
        case 'bird':{if(r.x<x0||r.x>x1)break;bird(ctx,r);drawn++;break;}
        case 'steam':{if(q>=1&&r.x>x0&&r.x<x1)steam(ctx,r);break;}
      }}
    stats.ents=ENTS.length;stats.drawn=drawn;
    if(q>=1&&!RM){ctx.globalCompositeOperation='multiply';const span=STREET_W+1000;
      for(let i=0;i<3;i++){const cx=((t*8+i*span/3)%span)-500,w=900+i*160,h=w*.375,cy=GY+90+i*150;if(cx+w/2<x0||cx-w/2>x1)continue;ctx.globalAlpha=.55;ctx.drawImage(cloudSpr,cx-w/2,cy-h/2,w,h);}
      ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
    // fios entre os postes de luz da calçada de lá, com sombra e balanço leve
    ctx.lineWidth=1;for(let i=0;i<POLES.length-1;i++){const a=POLES[i],b=POLES[i+1];if(b<x0||a>x1||b-a>760)continue;const sag=(b-a)*.035,sw=RM?0:Math.sin(t*.8+i)*.8,ay=cy-146;
      for(const [off,al] of [[0,.8],[7,.7]]){ctx.strokeStyle=`rgba(14,12,16,${al})`;ctx.beginPath();ctx.moveTo(a+3,ay+off);ctx.quadraticCurveTo((a+b)/2,ay+off+sag*2+sw,b+3,ay+off);ctx.stroke();
        ctx.strokeStyle='rgba(20,16,12,.16)';ctx.beginPath();ctx.moveTo(a+9,ay+off+9);ctx.quadraticCurveTo((a+b)/2+6,ay+off+9+sag*2+sw,b+9,ay+off+9);ctx.stroke();}}
    if(q>=1&&!RM){ctx.fillStyle='rgba(18,16,16,.85)';for(const f of flies){if(f.x<x0||f.x>x1)continue;const a=t*(7+f.i*2.3)+f.i*2,b=t*(5+f.i*1.7);ctx.fillRect(Math.round(f.x+Math.cos(a)*(7+f.i*3)),Math.round(f.y+Math.sin(b)*(4+f.i)),1,1);}}
    const fum=art(PATH.efeito('fumaca-escape'));
    for(const p of puffs){if(p.x<x0||p.x>x1)continue;const u=p.t;if(fum){const f=Math.min(3,Math.floor(u*4));ctx.globalAlpha=1-u;ctx.drawImage(fum,f*12,0,12,8,p.x-9,p.y-6,18,12);ctx.globalAlpha=1;}
      else{ctx.fillStyle=`rgba(210,210,214,${.45*(1-u)})`;ctx.beginPath();ctx.ellipse(p.x,p.y,3+u*6,2+u*4,0,0,7);ctx.fill();}}
    // luzes que emitem: neon das lojas (com tremida rara), arandelas do DHPP, vitrines e o giroflex da viatura parada
    ctx.globalCompositeOperation='lighter';
    for(const b of BUILDINGS){if(!b.glows||b.X+b.w<x0||b.X>x1)continue;for(const gl of b.glows){
      let a=gl.neon?.34:gl.lamp?.3:.12;if(gl.win)a=gl.tv&&!RM?.2*(.6+.4*Math.sin(t*12+gl.x)*Math.sin(t*4.1+gl.y)):.15;if(gl.neon&&!RM&&q>=1){const ph=Math.sin(t*1.3+gl.x)*Math.sin(t*7.1+gl.y);if(ph>.93)a*=.35;}
      const sp=glowSprite(rgba(gl.c,1));ctx.globalAlpha=a;const r=gl.r;ctx.drawImage(sp,gl.x-r,gl.y-r*.7,r*2,r*1.4);
      if(!gl.neon&&!gl.lamp&&!gl.win&&!gl.pole&&q>=1){ctx.globalAlpha=.1;ctx.drawImage(sp,gl.x-r*1.2,GY+2,r*2.4,34);}
      if(gl.lamp){ctx.globalAlpha=a*.5;ctx.drawImage(sp,gl.x-r*.8,GY-6,r*1.6,r*.5);}}}
    if(q>=1){const flash=(k,yy)=>{if(k.x+200<x0||k.x>x1)return;const red=(2+Math.floor(t*(k.siren?4:2.5))%2)===2,m=meta(k.id),sx=(red?67:85)*CAR_S,cx=k.x+((k.dir||(k.lane!=null?LANES[k.lane].dir:1))<0?W(k)-sx:sx),cyy=yy-m.h*CAR_S+6*CAR_S;
        const sp=glowSprite(red?'rgba(255,60,50,1)':'rgba(60,110,255,1)');ctx.globalAlpha=.5;ctx.drawImage(sp,cx-18,cyy-14,36,28);
        ctx.globalAlpha=.16;ctx.drawImage(sp,cx-130,yy-90,260,110);if(k===viatura){ctx.globalAlpha=.08;ctx.drawImage(sp,cx-160,GY-130,320,190);}};
      flash(viatura,viatura.y);for(const k of cars)if(k.siren)flash(k,(k.yo??LANES[k.lane].y)+(k.yj||0));}
    ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
    // retorno do toque: um anel no chão onde o Lemos vai
    if(tapFx){const k=tapFx.t/.7;ctx.strokeStyle=`rgba(242,194,48,${.9*(1-k)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(tapFx.x,tapFx.y,6+k*14,2+k*5,0,0,7);ctx.stroke();}
    if(marker){const b=Math.round(Math.sin(t*6)*2),X=DOOR.x,Y=GY-160+b;ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+9);ctx.lineTo(X-8,Y);ctx.lineTo(X,Y-9);ctx.lineTo(X+8,Y);ctx.fill();
      ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+7);ctx.lineTo(X-6,Y);ctx.lineTo(X,Y-7);ctx.lineTo(X+6,Y);ctx.fill();ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y-4,2,6);ctx.fillRect(X-1,Y+3,2,1.5);}
    // o sol da manhã, baixo e dourado, vindo do alto à esquerda: fachos de luz entre os prédios, poeira dentro deles,
    // brilho nas janelas, nas poças e no cromado dos carros
    let np=0;
    if(q>=1){ctx.globalCompositeOperation='screen';
      // fachos com bordas macias: um sprite com degradê nas laterais e no pé, inclinado na direção do sol
      for(const B of BEAMS){if(B.x+B.w+800<x0||B.x-300>x1)continue;const br=RM?1:.8+.2*Math.sin(t*B.sp+B.ph),y0=top-60,y1=CURB+20,sh=.62;
        ctx.save();ctx.transform(1,0,sh,1,-sh*y0,0);ctx.globalAlpha=Math.min(1,B.a*br*4);ctx.drawImage(beamSpr,B.x-B.w/2,y0,B.w,y1-y0);
        ctx.globalAlpha=Math.min(1,B.a*br*2.5);ctx.drawImage(beamSpr,B.x-B.w*.22,y0,B.w*.44,(y1-y0)*.85);ctx.restore();}
      ctx.globalAlpha=1;
      // brilho do sol batendo nas janelas: uma faixa clara que corre pelo vidro conforme a câmera anda
      for(const wn of WINS){if(wn.x<x0||wn.x>x1)continue;const ph=wn.x*.011+wn.y*.017-camX*.006-t*.05,v=ph-Math.floor(ph);if(v>.07)continue;const k=Math.sin(v/.07*Math.PI);
        ctx.fillStyle=`rgba(255,240,205,${.75*k})`;for(let j=0;j<wn.h-6;j++){const xx=wn.x+3+((j*.6+v*60)%(wn.w-6));ctx.fillRect(Math.round(xx),wn.y+3+j,2,1);}
        if(k>.7){ctx.fillStyle=`rgba(255,250,230,${k})`;ctx.fillRect(wn.x+wn.w-6,wn.y+3,1,5);ctx.fillRect(wn.x+wn.w-8,wn.y+5,5,1);}}
      // poças refletindo o céu e o sol
      for(const pd of PUDDLES){if(pd.x<x0||pd.x>x1)continue;const k=.5+.5*Math.sin(t*1.6+pd.x*.1);ctx.fillStyle=`rgba(255,226,170,${.18+.22*k})`;ctx.beginPath();ctx.ellipse(pd.x-pd.rx*.25,pd.y-pd.ry*.3,pd.rx*.45,Math.max(.8,pd.ry*.25),0,0,7);ctx.fill();}
      // reflexo no cromado e no para-brisa dos carros que passam
      for(const k of cars){if(k.lane==null||k.x+200<x0||k.x>x1)continue;const ph=(k.dist||0)/240+k.x*.0007,v=ph-Math.floor(ph);if(v>.05)continue;const m=meta(k.id),w=W(k),h=m.h*CAR_S,dir=LANES[k.lane].dir,
          cx=k.x+(dir>0?w*.62:w*.38),cy=(k.yo??LANES[k.lane].y)+(k.yj||0)-h*.62,a=Math.sin(v/.05*Math.PI);
        ctx.fillStyle=`rgba(255,248,226,${a})`;ctx.fillRect(Math.round(cx)-5,Math.round(cy),11,1);ctx.fillRect(Math.round(cx),Math.round(cy)-5,1,11);ctx.fillRect(Math.round(cx)-1,Math.round(cy)-1,3,3);}
      for(const m of motes){const X=left+m.x*vw,Y=top+m.y*(CURB-top);const a=.3+.3*Math.sin(m.p*2);ctx.fillStyle=`rgba(255,236,196,${a})`;ctx.fillRect(Math.round(X),Math.round(Y),1,1);np++;}
      ctx.globalCompositeOperation='source-over';}
    stats.particles=np+puffs.length;
    // primeiro plano: os prédios do lado de cá, entre a câmera e a rua (translúcidos onde algo importante passa atrás)
    {const busy=[];if(bus&&bus.st==='stop')busy.push([bus.x,bus.x+W(bus),.35]);for(const p of peds)if(p.onRoad&&!p.hidden)busy.push([p.x-20,p.x+20,.55]);
      // folhas soltas no ar (vento)
      ctx.setTransform(s,0,0,s,ox,oyr);
      if(q>=1){if(!RM)for(const l of airLeaves){if(l.x<x0||l.x>x1)continue;const fl=Math.abs(Math.sin(l.ph*1.7));ctx.globalAlpha=Math.min(1,.3+wv);ctx.fillStyle=l.c;ctx.fillRect(Math.round(l.x),Math.round(l.y),1+Math.round(fl*2),2);}ctx.globalAlpha=1;}
      front.draw(ctx,{s,top,left,vw,cw,ch},t,cameraDt,busy,RM,wv);}
    // luz da manhã, como o clima de cor da planta (gradientes guardados por tamanho de tela)
    ctx.setTransform(1,0,0,1,0,0);
    const key=cw+'x'+ch;if(key!==gradeKey){gradeKey=key;gradeSun=ctx.createLinearGradient(0,0,cw,ch);gradeSun.addColorStop(0,'rgba(255,184,96,.55)');gradeSun.addColorStop(.5,'rgba(255,214,150,.16)');gradeSun.addColorStop(1,'rgba(70,96,160,.26)');
      sunGlow=ctx.createRadialGradient(-cw*.08,-ch*.35,0,-cw*.08,-ch*.35,Math.max(cw,ch)*1.05);sunGlow.addColorStop(0,'rgba(255,214,140,.55)');sunGlow.addColorStop(.35,'rgba(255,190,110,.18)');sunGlow.addColorStop(1,'rgba(255,190,110,0)');
}
    ctx.globalCompositeOperation='soft-light';ctx.fillStyle=gradeSun;ctx.fillRect(0,0,cw,ch);
    // a atmosfera dourada perto do sol e reflexos de lente leves na diagonal (qualidade alta)
    if(q>=1){ctx.globalCompositeOperation='screen';ctx.fillStyle=sunGlow;ctx.fillRect(0,0,cw,ch);
      // reflexo de lente: o sol fora do quadro, no alto à esquerda, e os fantasmas (discos, anéis e hexágonos coloridos) na reta
      // que passa pelo centro da tela; deslizam um pouco quando a câmera anda, como numa lente de verdade
      {const sx=-cw*.08-((camX/STREET_W)-.5)*cw*.3,sy=-ch*.32,dx=cw*.5-sx,dy=ch*.5-sy,R0=Math.min(cw,ch),k=RM?1:.85+.15*Math.sin(t*.5);
        for(let i=0;i<7;i++){const a=.35+i*.13,L=R0*(1.6+i%3*.4),w2=R0*.018;ctx.globalAlpha=.07*k;ctx.fillStyle='rgba(255,226,170,1)';ctx.beginPath();ctx.moveTo(sx,sy);
          ctx.lineTo(sx+Math.cos(a)*L-Math.sin(a)*w2,sy+Math.sin(a)*L+Math.cos(a)*w2);ctx.lineTo(sx+Math.cos(a)*L+Math.sin(a)*w2,sy+Math.sin(a)*L-Math.cos(a)*w2);ctx.closePath();ctx.fill();}
        for(const G of FLARE){const fx=sx+dx*G.u,fy=sy+dy*G.u,rr=R0*G.r;ctx.globalAlpha=Math.min(1,G.a*k*1.5);
          if(G.k==='hex'){ctx.fillStyle=G.c;ctx.beginPath();for(let j=0;j<6;j++){const an=j*Math.PI/3+.3;ctx.lineTo(fx+Math.cos(an)*rr,fy+Math.sin(an)*rr);}ctx.closePath();ctx.fill();ctx.globalAlpha=G.a*k*1.6;ctx.strokeStyle=G.c;ctx.lineWidth=Math.max(1,rr*.06);ctx.stroke();}
          else ctx.drawImage(G.spr,fx-rr,fy-rr,rr*2,rr*2);}
        ctx.globalAlpha=1;}}
    ctx.globalCompositeOperation='source-over';
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
    const S=2;for(let i=0;i<17;i++){const ph=flagPh-i*0.5,dy=Math.round(Math.sin(ph)*2*(i/16));
      ctx.fillStyle='rgba(28,18,14,.18)';ctx.fillRect(X+i*S+6,Y+dy+10,S,12*S);              // sombra do pano na fachada
      ctx.drawImage(cl,i,0,1,12,X+i*S,Y+dy,S,12*S);
      if(Math.cos(ph)<-0.3){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(X+i*S,Y+dy,S,12*S);}else if(Math.cos(ph)>0.7){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(X+i*S,Y+dy,S,12*S);}}}
  // árvore: tronco parado, copa balançando 1 px com o vento
  function tree(ctx,r){
    contact(ctx,r.x,r.y-2,9,3,.35);ctx.drawImage(r.trunk,Math.round(r.x-10),Math.round(r.y-80));
    const sway=RM?0:Math.round(Math.sin(t*(.8+wv*.8)+r.ph)*(.8+wv*1.6)+wv*1.2);ctx.drawImage(r.crown,Math.round(r.x-r.crown.width/2+sway),Math.round(r.y-150));
  }
  // carro oficial (rodas girando; a viatura parada com o giroflex alternando), ampliado sem suavizar, com volume e sombra
  // roda girando: o PNG oficial só tem as rodas paradas, então o miolo ganha raios que giram conforme a distância andada (desenhados por cima, sem mexer no resto)
  const WHEELS={'viatura-dhpp':{r:7.5,p:[[35,40],[125,40]]},taxi:{r:7.5,p:[[34,41],[122,41]]},'sedan-azul':{r:7,p:[[34,38],[124,38]]},'sedan-bordo':{r:7,p:[[34,37],[122,37]]},'sedan-verde':{r:7,p:[[34,37],[122,37]]},
    'sedan-bege':{r:7,p:[[31,37],[116,37]]},'perua-madeira':{r:7.5,p:[[37,38],[128,39]]},'furgao-marrom':{r:8,p:[[31,46],[112,46]]},onibus:{r:12,p:[[68,70],[219,70]]}};
  function wheels(ctx,k,w){const W_=WHEELS[k.id];if(!W_)return;const rr=W_.r*CAR_S,a0=(k.dist||0)/rr,hub=Math.round(rr*.62);
    for(const [wx,wy] of W_.p){const cx=Math.round(wx*CAR_S),cy=Math.round(wy*CAR_S);
      ctx.fillStyle='#26282c';ctx.beginPath();ctx.arc(cx,cy,hub,0,7);ctx.fill();ctx.fillStyle='#b9bdc6';
      for(let j=0;j<4;j++){const a=a0+j*Math.PI/2,c=Math.cos(a),sn=Math.sin(a);for(let d=1;d<=hub-1;d++)ctx.fillRect(Math.round(cx+c*d),Math.round(cy+sn*d),1,1);}
      ctx.fillStyle='#8a8e96';ctx.fillRect(cx-1,cy-1,2,2);}}
  function car(ctx,k,x,y,dir,isViatura){
    const m=meta(k.id),im=art(PATH.veiculo(k.id));const w=m.w*CAR_S,h=m.h*CAR_S;
    contact(ctx,x+w/2,y-3,w*.44,4,.42);contact(ctx,x+w/2,y-2,w*.36,2,.3);
    if(!im)return;
    const f=isViatura||k.siren?2+Math.floor(t*(k.siren?4:2.5))%2:(k.v>1?Math.floor((k.dist||0)/11)%2:0);
    ctx.save();ctx.translate(Math.round(dir<0?x+w:x),Math.round(y-h));if(dir<0)ctx.scale(-1,1);
    ctx.drawImage(Q()>=1?shaded(im):im,f*m.w,0,m.w,m.h,0,0,Math.round(w),Math.round(h));if(k.lane!=null)wheels(ctx,k,w);ctx.restore();
    // seta ao entrar ou sair da vaga: pisca na frente e atrás, do lado do meio-fio
    if(k.blink&&Math.floor(t*3)%2===0){const fx=dir>0?x+w-7:x+3,rx=dir>0?x+3:x+w-7,by=y-h*.5;ctx.fillStyle='#ffb52e';ctx.fillRect(Math.round(fx),Math.round(by),4,4);ctx.fillRect(Math.round(rx),Math.round(by),4,4);
      ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4;const sp=glowSprite('rgba(255,170,40,1)');ctx.drawImage(sp,fx-10,by-8,24,20);ctx.drawImage(sp,rx-10,by-8,24,20);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
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
    if(p.carry){const bx=art(PATH.prop('caixa-papelao'));if(bx){const bw=bx.width*1.1,bh=bx.height*1.1;ctx.drawImage(bx,Math.round(X+p.dir*6-bw/2),Math.round(Y-26-bh/2+bob),Math.round(bw),Math.round(bh));}}
    if(talking&&(p.talk%1.6)>.25){const bx=X+p.dir*6,by=Y-54;ctx.fillStyle='#1e1611';ctx.fillRect(bx-7,by-5,14,9);ctx.fillStyle='#f3f1ea';ctx.fillRect(bx-6,by-4,12,7);ctx.fillRect(bx-1,by+3,2,2);ctx.fillStyle='#14181b';const n=1+((p.talk*3)|0)%3;for(let i=0;i<n;i++)ctx.fillRect(bx-4+i*3,by-1,2,2);}
  }
  // semáforo oficial (3 quadros de 18 px: verde, amarelo, vermelho) na quina da faixa de pedestres; o vermelho dos carros é o verde de quem atravessa
  const SIGF={green:0,yellow:1,red:2};
  function signal(ctx,sp){const im=art(PATH.semaforo());if(!im)return;const w=18*PROP_S,h=96*PROP_S,f=SIGF[SIGS[sp.sig].st];
    contact(ctx,sp.x+1,sp.y,6,2.2,.3);ctx.drawImage(im,f*18,0,18,96,Math.round(sp.x-w/2),Math.round(sp.y-h),Math.round(w),Math.round(h));
    if(Q()>=1){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=f===1?.5:.42;ctx.drawImage(glowSprite(f===0?'rgba(70,255,120,1)':f===1?'rgba(255,200,60,1)':'rgba(255,60,50,1)'),sp.x-12,sp.y-h+10,24,22);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}}
  // vapor do bueiro (efeito oficial, 6 quadros), subindo devagar
  function steam(ctx,m){const im=art(PATH.efeito('vapor-bueiro'));if(!im)return;const f=Math.floor(t*7+m.x%5)%6;ctx.globalAlpha=m===MANHOLES[0]?.75:.5;for(let k=0;k<4;k++){const lean=RM?0:Math.round(wv*10*(1-k/4));ctx.drawImage(im,f*24,k*10,24,10,Math.round(m.x-16+lean),Math.round(m.y-50+k*13),31,13);}ctx.globalAlpha=1;}
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
      camera.beginManual();camZoom=clamp(gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.d,.34,2.75);
      const ns=Math.max(1,Math.round(lastView.baseS*camZoom)),vw=lastView.cw/ns,vh=lastView.ch/ns;
      camX=gesture.world.x-mx/ns+vw/2;camY=gesture.world.y-my/ns+vh/2;return;
    }
    if(!gesture||gesture.type!=='pan')gestureStart(points);
    const dx=points[0].x-gesture.x,dy=points[0].y-gesture.y;if(Math.hypot(dx,dy)<5)return;
    camera.beginManual();camX=gesture.cx-dx/lastView.s;camY=gesture.cy-dy/lastView.s;
  }
  function gestureEnd(points){camera.endManual();if(points&&points.length===1)gestureStart(points);else gesture=null;}
  function zoomAt(factor,px,py){
    if(!lastView)return;const w=worldAt(px,py),z0=camZoom;camZoom=clamp(camZoom*factor,.34,2.75);if(Math.abs(z0-camZoom)<.001)return;
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
  /** botão "visão geral": afasta até a escala 1 (a rua inteira, com os prédios de baixo) e volta */
  function toggleOverview(){if(!lastView)return;const b=lastView.baseS;camera.clearManual();camZoom=camZoom<.99?1:Math.max(.34,1/b);}
  return {toggleOverview,lanes:LANES,update,resume,debugRows,draw,tap,place,gestureStart,gestureMove,gestureEnd,zoomAt,lemos,door:DOOR,ready,stats,shadowLayer:shc,get view(){return lastView;},get cars(){return cars;},parked,peds,birds,trees,get t(){return t;},zoom:()=>camZoom};
}
