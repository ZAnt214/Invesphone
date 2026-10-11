/* Rua do DHPP: o lado de fora da base, com a câmera alta de Beat Cop (fachadas de frente e o chão visto de cima:
   calçada funda, meio-fio, faixa de estacionamento e duas faixas de trânsito). Lemos anda pela calçada; a porta do DHPP
   leva para dentro (a planta da base, em base.js).

   Um quarteirão de bairro antigo, como na Filadélfia, entre duas ruas transversais: casas geminadas de 2 a 4 andares
   (algumas com mansarda), comércio de esquina, uma loja fechada, um galpão antigo de 6 andares, uma igreja de pedra,
   um terreno baldio com mural, becos, e o DHPP no meio, com a mesma fachada da planta. Na calçada: postes de madeira
   com fiação, lampiões, semáforos com o nome das ruas, árvores, parquímetros, placas, ponto de ônibus, lixo e pombos.
   A arte é toda desenhada em código (streetArt.js), na unidade de pixel da planta. */
import {GY,SIDE,CURB,ROAD,WALK,PARK,LANES,STREET_H,rnd,facadeH,facadeSprite,drawStoop,drawChurchSteps,CARS,carSprite,lampSprite,treeSprite,pitSprite,propSprite,drawSkyline} from './streetArt';
export {STREET_H};

/* ---------- o quarteirão, da esquerda para a direita ---------- */
const LOT=[
  {k:'cross',w:170,name:'N 9TH ST'},
  {k:'shop',w:170,fl:4,brick:'#8a3a2c',shop:'deli',sign:'DELI · GROCERY',band:'#9a2f2a',cor:'#2a2a2e',frame:'#3a2a22',escape:true,win:'six',awning:'#9a2f2a'},
  {k:'row',w:90,brick:'#8e3b2c',door:'#2f5a3a',fl:3,cor:'#2a2a2e',bay:'#e8e2d4',spout:true},
  {k:'row',w:90,brick:'#7a4030',door:'#1e1e22',fl:3,cor:'#e8e2d4',win:'arch',shut:'#2f4a3a',tag:'#e85a9a'},
  {k:'row',w:80,paint:'#cbb894',door:'#7a2a2a',fl:2,boxes:true,cor:'#2f4a3a',win:'six',shut:'#1c1d20'},
  {k:'lot',w:110},
  {k:'row',w:96,brick:'#934733',door:'#3a2a22',fl:4,mansard:true,trim:'#e8e2d4',cor:'#2a2a2e',spout:true},
  {k:'row',w:96,brick:'#6e3a2c',door:'#2e4a6a',fl:4,escape:true,cor:'#3a2a22',win:'arch',rent:true},
  {k:'alley',w:36},
  {k:'dhpp',w:440},
  {k:'alley',w:28},
  {k:'loft',w:200,brick:'#7a3a2a',ghost:'COLD STORAGE'},
  {k:'shop',w:130,brick:'#7a4030',fl:3,shop:'laundry',sign:'LAUNDROMAT',band:'#2e4a6a',cor:'#2a2a2e',frame:'#3a3e44',awning:'#2e4a6a'},
  {k:'row',w:96,brick:'#8e3b2c',door:'#2e4a6a',fl:3,boxes:true,cor:'#e8e2d4',bay:'#2f4a3a',win:'six'},
  {k:'shop',w:110,brick:'#6e3a2c',fl:3,shop:'closed',sign:'HARDWARE',band:'#5a5248',cor:'#3a2a22',frame:'#3a3430',boarded:true},
  {k:'shop',w:130,brick:'#5e3a2e',fl:3,shop:'tavern',sign:'TAVERN',band:'#1a1416',cor:'#2a2a2e',frame:'#2a1e18'},
  {k:'church',w:180,stone:'#a39a8a'},
  {k:'row',w:96,paint:'#7d8c99',door:'#e8e2d4',fl:3,cor:'#e8e2d4',bay:'#e8e2d4',shut:'#2a2b2e'},
  {k:'shop',w:120,brick:'#8e3b2c',fl:3,shop:'barber',sign:'BARBER',band:'#e8e2d4',cor:'#3a2a22',frame:'#4a3a30',posters:true},
  {k:'row',w:96,brick:'#7a4030',door:'#2f5a3a',fl:4,mansard:true,trim:'#2f4a3a',cor:'#e8e2d4',win:'arch'},
  {k:'shop',w:150,paint:'#d0c4ae',fl:4,shop:'pharmacy',sign:'PHARMACY',band:'#2f6a4a',cor:'#2f4a3a',frame:'#2a3a34',win:'six'},
  {k:'cross',w:170,name:'W OAK ST'}
];
let acc=0;export const BUILDINGS=LOT.map((b,i)=>{const o={...b,i,X:acc,gap:b.k==='cross'||b.k==='alley'||b.k==='lot'};acc+=b.w;return o;});
// as aberturas (becos, terreno, ruas transversais) têm a altura dos vizinhos, e as paredes laterais a cor deles
for(const b of BUILDINGS)if(b.gap){const L=BUILDINGS[b.i-1],Rr=BUILDINGS[b.i+1],hOf=o=>o&&!o.gap?facadeH(o):0;
  b.hl=hOf(L)||(b.k==='cross'?200:150);b.hr=hOf(Rr)||(b.k==='cross'?200:150);b.h=Math.max(b.hl,b.hr)+(b.k==='cross'?20:0);
  b.bl=L&&L.brick||'#5a3226';b.br=Rr&&Rr.brick||'#8a4a38';}
export const STREET_W=acc;
export const DHPP=BUILDINGS.find(b=>b.k==='dhpp');
export const DOOR={x:DHPP.X+DHPP.w/2,y:WALK[0]+6};  // onde Lemos entra
export const CROSS=BUILDINGS.filter(b=>b.k==='cross');
export const CSW=26; // calçada das ruas transversais
const inCross=(x,m=0)=>CROSS.some(c=>x>c.X-m&&x<c.X+c.w+m);

/* ---------- o que fica na beira da calçada, sem uma peça em cima da outra ---------- */
const taken=[];const free=(x,r)=>!inCross(x,r)&&taken.every(([a,b])=>x+r<=a||x-r>=b);const take=(x,r)=>taken.push([x-r,x+r]);
export const SIGNALS=[];for(const c of CROSS){SIGNALS.push({x:c.X+12,name:c.name},{x:c.X+c.w-12,name:c.name});}
for(const s of SIGNALS)take(s.x,12);
take(DHPP.X+40+56,70); // a vaga da viatura
take(DOOR.x,80);       // nada na frente do letreiro e da porta do DHPP
export const LAMPS=[];for(let x=60;x<STREET_W;x+=360)for(let d=0;d<120;d+=10){if(free(x+d,14)){LAMPS.push(x+d);take(x+d,14);break;}}
export const POLES=[];for(let x=230;x<STREET_W;x+=340)for(let d=0;d<120;d+=10){if(free(x+d,16)){POLES.push(x+d);take(x+d,16);break;}}
export const TREES=[];{const R=rnd(31);for(const b of BUILDINGS){if(b.gap||b.k==='dhpp'||b.k==='loft')continue;const x=Math.round(b.X+b.w*(.45+R()*.2));
  if(R()<.75&&free(x,24)){TREES.push({x,kind:['big','mid','young'][Math.floor(R()*3)],guard:R()<.4});take(x,24);}}}
// na frente do DHPP, duas árvores grandes
for(const x of [DHPP.X+70,DHPP.X+DHPP.w-70])if(free(x,24)){TREES.push({x,kind:'big',guard:false});take(x,24);}
export const PROPS=[];const curb=(k,x,r=8,y=CURB-10,o)=>{if(free(x,r)){PROPS.push({k,x,y,opt:o});take(x,r);return true;}return false;};
const ofK=k=>BUILDINGS.find(b=>b.shop===k||b.k===k);
{const deli=ofK('deli'),laundry=ofK('laundry'),tavern=ofK('tavern'),church=ofK('church'),loft=ofK('loft'),barber=ofK('barber');
  curb('hydrant',CROSS[0].X+CROSS[0].w+40);curb('mailbox',CROSS[0].X+CROSS[0].w+64,10);
  curb('news',deli.X+deli.w-30,8);curb('news2',deli.X+deli.w-10,8);
  PROPS.push({k:'aframe',x:deli.X+60,y:GY+30},{k:'aframe',x:tavern.X+tavern.w/2+30,y:GY+30},{k:'planter',x:barber.X+barber.w-26,y:GY+26});
  curb('bags',BUILDINGS[3].X+60,22);curb('bags',BUILDINGS[13].X+48,22);
  curb('nopark',DHPP.X+10,6);curb('nopark',DHPP.X+DHPP.w-10,6);
  curb('busstop',loft.X+30,8);curb('bench',loft.X+86,28);curb('can',loft.X+130,9);
  curb('bike',laundry.X+laundry.w-30,22);curb('cone',church.X+20,7);curb('hydrant',church.X+church.w+30);
  curb('can',BUILDINGS[2].X+30,9);curb('can',CROSS[1].X-50,9);curb('hydrant',CROSS[1].X-80);
  // parquímetros ao longo da faixa de estacionamento
  {const Rm=rnd(41);for(let x=40;x<STREET_W;x+=118+Math.floor(Rm()*40))if(Rm()<.75)curb('meter',x,5);}}
// bueiros na rua (um solta vapor)
export const MANHOLES=[{x:Math.round(STREET_W*.32),y:ROAD+96,steam:true},{x:Math.round(STREET_W*.7),y:ROAD+168,steam:false},{x:DHPP.X+300,y:ROAD+40,steam:false}];

/* ---------- a rua viva ---------- */
const PED_LOOKS=[
  {skin:'#d9a273',hair:'#2a1d18',style:'short',kind:'rua',top:'#8a2a2a',pants:'#2b2f36',shoes:'#222'},
  {skin:'#6e4630',hair:'#1f1a18',style:'curly',kind:'rua',top:'#3b5a7a',pants:'#3a3a40',shoes:'#e8e4da'},
  {skin:'#f0c9a0',hair:'#c9a24a',style:'long',kind:'rua',top:'#e8e2d4',pants:'#3b5a8a',shoes:'#222'},
  {skin:'#8a5a3a',hair:'#1f1a18',style:'bun',kind:'rua',top:'#5a3a6a',pants:'#2b2f36',shoes:'#111'},
  {skin:'#e8b58e',hair:'#9a9a9a',style:'grey',kind:'rua',top:'#6a5a3a',pants:'#3a4a5a',shoes:'#222'},
  {skin:'#a8714a',hair:'#2a1d18',style:'cap',kind:'rua',top:'#2f5a8a',pants:'#2b2f36',shoes:'#222'},
  {skin:'#e0b48c',hair:'#4a2f1d',style:'side',kind:'rua',top:'#7a8a3a',pants:'#3a3a32',shoes:'#3a2416'}
];
function randomLook(R){
  const pick=a=>a[Math.floor(R()*a.length)];
  return {skin:pick(['#f0c9a0','#e0b48c','#d9a273','#c98e64','#b67c52','#a8714a','#8a5a3a','#6e4630']),hair:pick(['#1f1a18','#2a1d18','#4a2f1d','#7a4a2a','#9a9a9a','#c9a24a']),
    style:pick(['short','side','long','bun','curly','grey','cap']),kind:'rua',top:pick(['#8a2a2a','#3b7a6b','#e8e2d4','#5a3a6a','#d8a040','#2f5a8a','#7a8a3a','#26282c','#6a5a3a','#4a6a8a']),
    pants:pick(['#2b2f36','#3a3a40','#3b5a8a','#3a4a5a','#3a3a32','#5a4a3a','#1f242b']),shoes:pick(['#222','#e8e4da','#3a2416','#111'])};
}

/** art: as funções de desenho da base (S2, refine, outlined, bush, hash, mulberry32, txt, txtW) e o letreiro e a porta dela */
export function createStreet({lemosLook,onEnter,getZoom,personFrames,art}){
  // a fachada do DHPP usa o letreiro e a porta da base; o resto é desenhado aqui
  const facades=BUILDINGS.map(b=>facadeSprite(art,b,art.sign(),art.door()));
  const lamp=lampSprite(art),pits=[pitSprite(art,false),pitSprite(art,true)];
  const trees=TREES.map((t,i)=>({...t,spr:treeSprite(art,t.x*7+i,t.kind)}));
  const props=PROPS.map(p=>({...p,spr:propSprite(art,p.k,p.opt)}));
  const poles=POLES.map((x,i)=>({x,spr:propSprite(art,'upole',i*11+3)}));
  const signals=SIGNALS.map(s=>({...s,spr:propSprite(art,'signal',s.name)}));
  const layer=buildStatic(),wires=buildWires();

  function buildStatic(){
    const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    const R=rnd(5),P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    const E=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
    // céu de manhã e o centro da cidade ao fundo, com névoa
    const g=c.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#8fa9c4');g.addColorStop(.7,'#d8d4cc');g.addColorStop(1,'#f0d2a8');c.fillStyle=g;c.fillRect(0,0,STREET_W,GY);
    drawSkyline(P,E,STREET_W,rnd(9));
    // no alto das casas, atrás da cornija: chaminés de tijolo, antenas e caixas d'água (o volume dos telhados)
    for(const b of BUILDINGS){if(b.gap||b.k==='dhpp'||b.k==='church')continue;const top=GY-facades[b.i].height+2+(b.mansard?-4:0),Rb=rnd(b.i*13+7);
      for(let n=0;n<1+(Rb()<.5);n++){const x=b.X+8+Math.floor(Rb()*(b.w-24)),hh=10+Math.floor(Rb()*8);
        P(x+8,top-hh+3,3,hh-2,'rgba(24,12,6,.25)');P(x,top-hh,9,hh+2,'#7a3a2a');P(x,top-hh,2,hh+2,'#9a5240');P(x+8,top-hh,1,hh+2,'#4a2218');
        for(let y=top-hh+3;y<top;y+=3)P(x,y,9,1,'rgba(214,190,170,.25)');P(x-1,top-hh-2,11,3,'#5a5a5e');P(x-1,top-hh-2,11,1,'#8a8a8e');}
      if(Rb()<.4){const x=b.X+b.w-20;P(x,top-22,1,22,'#2a2b2e');P(x-6,top-20,13,1,'#2a2b2e');P(x-4,top-16,9,1,'#2a2b2e');}
      if(b.k==='loft'||(b.w>=130&&Rb()<.6)){const x=b.X+b.w/2-12;for(const lx of [x+2,x+20])P(lx,top-10,2,10,'#3a2a22');P(x+4,top-12,16,2,'#3a2a22');P(x,top-30,24,20,'#8a6a4a');P(x,top-30,4,20,'#a8865e');P(x+21,top-30,3,20,'#5a4430');for(let y=top-28;y<top-10;y+=4)P(x,y,24,1,'#6a5038');E(x+12,top-31,12,3,'#5a4430');E(x+12,top-34,8,3,'#4a3a2a');P(x+24,top-27,3,16,'rgba(24,12,6,.22)');}}
    // fachadas, com o pé na calçada
    for(const b of BUILDINGS){const f=facades[b.i];c.drawImage(f,b.X-1,GY-f.height+1);}
    // calçada de concreto vista de cima: placas, desgaste, manchas, rachaduras e a sombra no pé das fachadas
    P(0,GY,STREET_W,SIDE,'#b4aea2');
    const SHh=20,SW=40;
    for(let y=GY,r=0;y<CURB;y+=SHh,r++){P(0,y,STREET_W,1,'#a19b8f');P(0,y+1,STREET_W,1,'#c2bcb0');
      for(let x=(r%2)*20;x<STREET_W;x+=SW){P(x,y,1,SHh,'#a19b8f');P(x+1,y,1,SHh,'#c2bcb0');const t=R();if(t<.22)P(x+2,y+2,SW-3,SHh-3,t<.11?'rgba(120,110,96,.13)':'rgba(255,250,240,.10)');}}
    // trechos de tijolo na frente de algumas casas (calçada antiga) e portas de porão de aço rente ao chão
    for(const b of BUILDINGS){if(b.k!=='row'&&b.k!=='church')continue;const Rb=rnd(b.i*5+1);if(Rb()<.45){const x0=b.X+2,x1=b.X+b.w-2;
      for(let y=GY+2;y<GY+46;y+=4)for(let x=x0+((y>>2)%2?0:4);x<x1;x+=8){const t=Rb();P(x,y,7,3,t<.4?'#8a6052':t<.8?'#7e5648':'#946a5a');P(x,y,7,1,'rgba(255,230,210,.12)');}P(x0,GY+46,x1-x0,1,'#7a6a5a');}}
    for(const b of BUILDINGS){if(b.k!=='shop'&&b.k!=='loft')continue;const x=b.X+b.w-46,y=GY+6;
      P(x,y,30,22,'#6a6c6e');P(x,y,30,1,'#9a9c9e');P(x+15,y,1,22,'#3a3c3e');for(let yy=y+3;yy<y+21;yy+=3)for(let xx=x+2;xx<x+29;xx+=4)if(xx!==x+14)P(xx,yy,2,1,'#8a8c8e');P(x+6,y+10,3,2,'#3a3c3e');P(x+21,y+10,3,2,'#3a3c3e');}
    for(let i=0;i<STREET_W*2;i++)P(R()*STREET_W,GY+2+R()*(SIDE-4),R()<.7?1:2,1,R()<.5?'#a8a296':'#bdb7ab');
    for(let i=0;i<STREET_W/30;i++){const x=R()*STREET_W,y=GY+8+R()*(SIDE-16);c.fillStyle='rgba(70,62,52,.13)';c.beginPath();c.ellipse(x,y,6+R()*14,2+R()*4,0,0,7);c.fill();}
    for(let i=0;i<STREET_W/40;i++){let x=R()*STREET_W,y=GY+6+R()*(SIDE-12);for(let k=0;k<9;k++){P(x,y,2,1,'#8f897d');P(x,y+1,2,1,'rgba(255,255,255,.18)');x+=2;y+=R()<.5?1:-1;}}
    for(let i=0;i<STREET_W/14;i++)P(R()*STREET_W,GY+4+R()*(SIDE-8),2,1,'rgba(40,36,30,.35)'); // chiclete grudado
    P(0,GY,STREET_W,4,'rgba(0,0,0,.24)');P(0,GY+4,STREET_W,5,'rgba(0,0,0,.10)');
    // degraus de mármore das casas, a escadaria da igreja e os canteiros das árvores
    for(const b of BUILDINGS){if(b.k==='row')drawStoop(P,b.X+22);if(b.k==='church')drawChurchSteps(P,b.X+82,b.X+154);}
    for(const t of TREES)c.drawImage(pits[t.guard?1:0],t.x-20,CURB-20-(t.guard?8:0));
    // meio-fio de granito em blocos, com a face virada para a câmera
    P(0,CURB,STREET_W,5,'#c8c2b6');P(0,CURB,STREET_W,1,'#e2ddd2');P(0,CURB+5,STREET_W,10,'#8a857a');P(0,CURB+5,STREET_W,1,'#a49e92');P(0,CURB+14,STREET_W,1,'#5a564e');
    for(let x=0;x<STREET_W;x+=43){P(x,CURB,1,15,'#6e6a60');P(x+1,CURB+5,1,9,'#9a958a');}
    // asfalto com grão, sarjeta, linha das vagas, faixa dupla amarela, remendos e bueiros
    P(0,ROAD,STREET_W,STREET_H-ROAD,'#4a4c52');
    for(let i=0;i<STREET_W*5;i++)P(R()*STREET_W,ROAD+R()*(STREET_H-ROAD),1,1,R()<.5?'#55575d':'#404248');
    for(let i=0;i<STREET_W/6;i++)P(R()*STREET_W,ROAD+R()*(STREET_H-ROAD),2,1,'#5a5c62');
    for(let i=0;i<STREET_W/180;i++){const x=R()*STREET_W,y=ROAD+20+R()*(STREET_H-ROAD-40);P(x,y,30+R()*40,10+R()*14,'rgba(30,30,34,.25)');}
    // rachaduras seladas com piche e marcas de pneu nas faixas
    for(let i=0;i<STREET_W/50;i++){let x=R()*STREET_W,y=ROAD+10+R()*(STREET_H-ROAD-20);for(let k=0;k<14;k++){P(x,y,2,1,'#2e3034');x+=2;y+=R()<.5?1:-1;}}
    for(const L of LANES){P(0,L.y-18,STREET_W,3,'rgba(30,30,34,.18)');P(0,L.y-6,STREET_W,3,'rgba(30,30,34,.18)');}
    P(0,ROAD,STREET_W,6,'#3a3c40');P(0,ROAD+6,STREET_W,1,'#45474c');
    for(let x=0;x<STREET_W;x+=130)if(!inCross(x,30))P(x,ROAD+8,2,58,'rgba(232,232,224,.45)');
    P(0,ROAD+150,STREET_W,2,'#d8b43a');P(0,ROAD+154,STREET_W,2,'#d8b43a');
    for(let i=0;i<STREET_W/80;i++){const x=R()*STREET_W,y=ROAD+12+R()*(STREET_H-ROAD-22);c.fillStyle='rgba(20,20,24,.26)';c.beginPath();c.ellipse(x,y,10+R()*18,3+R()*5,0,0,7);c.fill();}
    for(let x=350;x<STREET_W;x+=640)if(!inCross(x,40)){P(x,ROAD+84,30,12,'#34363a');P(x+2,ROAD+86,26,8,'#55575d');for(let k=0;k<26;k+=4)P(x+2+k,ROAD+86,2,8,'#34363a');}
    for(const m of MANHOLES){E(m.x,m.y,13,5,'#2e3034');E(m.x,m.y,11,4,'#55575d');for(let k=-8;k<=8;k+=4)P(m.x+k,m.y-3,2,6,'#3e4044');E(m.x-3,m.y-1,3,1,'#6a6c72');}
    // esquinas: a rua transversal corta a calçada até a rua principal, com o meio-fio virando, rampas,
    // faixa de pedestres nas duas ruas e a linha de parada
    for(const cr of CROSS){const x0=cr.X+CSW,x1=cr.X+cr.w-CSW;
      P(x0,GY,x1-x0,ROAD-GY,'#4a4c52');for(let i=0;i<(x1-x0)*12;i++)P(x0+R()*(x1-x0),GY+R()*(ROAD-GY),1,1,R()<.5?'#55575d':'#404248');
      for(const ex of [x0-3,x1]){P(ex,GY,3,CURB-GY,'#c8c2b6');P(ex+(ex<x1?0:2),GY,1,CURB-GY,ex<x1?'#e2ddd2':'#8a857a');}
      // rampa com o piso tátil amarelo
      for(const [rx,dir] of [[cr.X+2,1],[x1+2,-1]]){P(rx,CURB-14,CSW-4,14,'#c2bcb0');P(rx+4,CURB-10,CSW-12,8,'#e8c63a');for(let yy=CURB-9;yy<CURB-2;yy+=2)for(let xx=rx+5;xx<rx+CSW-8;xx+=2)P(xx,yy,1,1,'#b8962a');}
      P(x0,GY+26,x1-x0,3,'#e8e8e0');for(let x=x0+4;x<x1-4;x+=10)P(x,GY+36,6,40,'#e2e2da');
      for(let x=x0+4;x<x1-4;x+=10)P(x,GY+38,6,1,'rgba(0,0,0,.08)');
      // faixa de pedestres na rua principal, na linha das calçadas da transversal
      for(const zx of [cr.X+3,x1+3])for(let y=ROAD+6;y<STREET_H-2;y+=9)P(zx,y,CSW-6,5,'#d8d8d0');
      P(x0,ROAD-1,x1-x0,2,'#3a3c40');}
    return cv;
  }
  // fiação: entre os postes de madeira, das pontas até as esquinas e as ligações até as casas (fica atrás dos postes)
  function buildWires(){
    const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const c=cv.getContext('2d');
    const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);};
    const top=CURB-6-250,arms=[[16,6],[16,16],[16,38],[16,48],[30,6],[30,48]];
    const sag=(x0,y0,x1,y1,s,col)=>{const n=Math.ceil(Math.abs(x1-x0));for(let i=0;i<=n;i++){const u=i/n,x=x0+(x1-x0)*u,y=y0+(y1-y0)*u+Math.sin(u*Math.PI)*s;P(x,y,1,1,col);}};
    const xs=[CROSS[0].X+CROSS[0].w-4,...POLES,CROSS[1].X+4];
    for(let i=1;i<xs.length;i++){const a=xs[i-1],b=xs[i];for(const [ay,ax] of arms){sag(a-25+ax,top+ay-2,b-25+ax,top+ay-2,10+Math.abs(b-a)*.02,'rgba(20,20,22,.85)');}}
    // ligações de cada poste até as casas vizinhas
    for(const x of POLES){for(const b of BUILDINGS){if(b.k!=='row'&&b.k!=='shop')continue;const bx=b.X+b.w-14;if(Math.abs(bx-x)>160)continue;const by=GY-facadeH(b)+60;sag(x+4,top+30,bx,by,6,'rgba(20,20,22,.7)');}}
    return cv;
  }

  // gente: o MESMO boneco da base (46 px, quadros de andar), com as cores de cada um
  const lemos={x:DHPP.X-70,y:WALK[0]+30,dir:1,walk:0,moving:false,look:lemosLook,frames:personFrames(lemosLook),tx:null,ty:null,enter:false};
  const sprCache={};const carOf=k=>sprCache[k.id]||(sprCache[k.id]=carSprite(art,k));
  // carros estacionados: a viatura na frente do DHPP; os outros nas vagas livres (nunca na esquina nem em frente a hidrante)
  const parked=[{kind:CARS[0],x:DHPP.X+40,y:PARK,spr:carOf(CARS[0])}];
  {const Rp=rnd(23),hyd=PROPS.filter(p=>p.k==='hydrant').map(p=>p.x);for(let x=20;x<STREET_W-130;x+=120+Math.floor(Rp()*70)){const k=CARS[2+Math.floor(Rp()*(CARS.length-3))],w=k.w;
    if(Rp()<.5&&!CROSS.some(c=>x+w>c.X-10&&x<c.X+c.w+10)&&!parked.some(p=>x+w>p.x-14&&x<p.x+p.spr.width+14)&&!hyd.some(h=>h>x-14&&h<x+w+14))parked.push({kind:k,x,y:PARK,spr:carOf(k)});}}
  const viatura=parked[0];
  const R=rnd(17);
  const peds=Array.from({length:20},(_,i)=>{const look=i<PED_LOOKS.length?PED_LOOKS[i]:randomLook(R);return {x:R()*STREET_W,y:WALK[0]+6+R()*(WALK[1]-WALK[0]-6),dir:R()<.5?-1:1,v:(16+R()*14),walk:R()*10,look,frames:personFrames(look),pause:0,id:i};});
  const cars=[];const moving=CARS.slice(1);
  for(let l=0;l<LANES.length;l++)for(let i=0;i<3;i++){const kind=moving[(l*4+i)%moving.length],v=LANES[l].v*(0.85+R()*0.3);cars.push({kind,spr:carOf(kind),lane:l,x:i*STREET_W/3+R()*260,v,v0:v});}
  // pombos: ciscam na calçada e levantam voo quando alguém chega perto
  const birds=Array.from({length:7},(_,i)=>({x:400+R()*(STREET_W-800),y:WALK[0]+10+R()*(WALK[1]-WALK[0]-14),z:0,dir:R()<.5?-1:1,st:'g',t:R()*40,vx:0,vz:0}));
  let camX=lemos.x,camY=null,t=0;
  const W=k=>k.spr.width;

  function update(dt){
    t+=dt;
    // Lemos (mesma velocidade de passo da planta)
    if(lemos.tx!=null){const dx=lemos.tx-lemos.x,dy=lemos.ty-lemos.y,d=Math.hypot(dx,dy),sp=96*dt;
      if(d<=sp){lemos.x=lemos.tx;lemos.y=lemos.ty;lemos.tx=null;lemos.moving=false;if(lemos.enter){lemos.enter=false;onEnter();}}
      else{lemos.x+=dx/d*sp;lemos.y+=dy/d*sp;lemos.walk+=sp/32;lemos.moving=true;if(Math.abs(dx)>0.5)lemos.dir=dx>0?1:-1;}}
    // gente na calçada: anda, às vezes para um pouco (vitrine, celular), e some numa ponta para voltar na outra
    for(const p of peds){
      if(p.pause>0){p.pause-=dt;p.moving=false;continue;}
      p.x+=p.dir*p.v*dt;p.walk+=p.v*dt/32;p.moving=true;
      if(R()<dt*0.08)p.pause=1+R()*3;
      if(p.x<-40){p.x=STREET_W+30;p.y=WALK[0]+6+R()*(WALK[1]-WALK[0]-6);}else if(p.x>STREET_W+40){p.x=-30;p.y=WALK[0]+6+R()*(WALK[1]-WALK[0]-6);}
    }
    // pombos: ciscam; se alguém chega perto, voam para outro canto da calçada
    for(const b of birds){b.t+=dt*30;
      if(b.st==='g'){if(Math.random()<dt*.6)b.x+=b.dir*2;if(Math.random()<dt*.2)b.dir=-b.dir;
        const near=[lemos,...peds].some(p=>Math.abs(p.x-b.x)<34&&Math.abs(p.y-b.y)<18);if(near){b.st='f';b.vx=(Math.random()<.5?-1:1)*(70+Math.random()*50);b.vz=70;b.dir=Math.sign(b.vx);b.tx=Math.max(60,Math.min(STREET_W-60,b.x+b.vx*2.4));}}
      else{b.x+=b.vx*dt;b.z=Math.max(0,b.z+b.vz*dt);if(Math.abs(b.x-b.tx)<60)b.vz=-60;else if(b.z>60)b.vz=0;
        if(b.vz<0&&b.z<=0){b.st='g';b.z=0;b.y=WALK[0]+10+Math.random()*(WALK[1]-WALK[0]-14);}}}
    // trânsito: cada um segue o da frente na mesma faixa (sem atravessar), com folga de um carro pequeno
    for(let l=0;l<LANES.length;l++){const dir=LANES[l].dir,ln=cars.filter(k=>k.lane===l).sort((a,b)=>dir>0?b.x-a.x:a.x-b.x);
      for(let i=0;i<ln.length;i++){const k=ln[i],lead=ln[i-1];let v=k.v0;
        if(lead){const gap=dir>0?lead.x-(k.x+W(k)):k.x-(lead.x+W(lead));if(gap<66)v=Math.min(v,lead.v*(gap<26?0.6:1));}
        k.v+=(v-k.v)*Math.min(1,dt*3);k.x+=dir*k.v*dt;
        if(dir>0&&k.x>STREET_W+60){const back=Math.min(...ln.map(o=>o.x));k.x=Math.min(-W(k)-60,back-W(k)-100)-R()*320;}
        if(dir<0&&k.x<-W(k)-60){const back=Math.max(...ln.map(o=>o.x+W(o)));k.x=Math.max(STREET_W+60,back+100)+R()*320;}}}
  }

  // mesma proximidade de dentro do DHPP: a rua está na unidade da base, então usa o mesmo zoom (cam.z).
  // A câmera segue o Lemos nos dois eixos; se a tela couber a rua inteira na altura, ela encosta embaixo.
  function view(cw,ch,rs){
    const z=getZoom?getZoom():0,s=z>0?rs*z:Math.min(ch/(STREET_H-25),cw/620);
    const vw=cw/s,vh=ch/s;
    camX+=(clamp(lemos.x,vw/2,STREET_W-vw/2)-camX)*0.12;camX=clamp(camX,vw/2,STREET_W-vw/2);
    let top;
    if(vh>=STREET_H)top=STREET_H-vh;
    else{const want=clamp(lemos.y-vh*0.68,0,STREET_H-vh);camY=camY==null?want:camY+(want-camY)*0.12;top=clamp(camY,0,STREET_H-vh);}
    return {s,left:camX-vw/2,top,rs};
  }
  const clamp=(v,a,b)=>a>b?(a+b)/2:v<a?a:v>b?b:v;

  function draw(ctx,cw,ch,rs,marker){
    const V=view(cw,ch,rs),{s,left}=V;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
    ctx.fillStyle='#2a2b2e';ctx.fillRect(0,0,cw,ch);ctx.imageSmoothingEnabled=false;
    const oy=-V.top*s; // topo da vista; se sobrar altura (top<0), a sobra vira céu
    if(oy>0){ctx.fillStyle='#8fa9c4';ctx.fillRect(0,0,cw,oy);}
    // no pixel da tela, como na planta (sem meio-pixel borrando a arte)
    const ox=Math.round(-left*s),oyr=Math.round(oy);
    ctx.setTransform(s,0,0,s,ox,oyr);
    ctx.drawImage(layer,0,0);ctx.drawImage(wires,0,0);
    const ents=[],shadow=(x,y,rx,ry,a)=>{ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();};
    for(const x of LAMPS)ents.push({y:CURB-6,d:()=>{shadow(x+16,CURB-6,14,3,.18);ctx.drawImage(lamp,x-11,CURB-6-lamp.height);}});
    for(const p of poles)ents.push({y:CURB-6,d:()=>{shadow(p.x+14,CURB-6,16,3,.18);ctx.drawImage(p.spr,p.x-28,CURB-6-p.spr.height);}});
    for(const p of signals)ents.push({y:CURB-6,d:()=>{shadow(p.x+12,CURB-6,12,3,.18);ctx.drawImage(p.spr,p.x-26,CURB-6-p.spr.height);}});
    for(const tr of trees)ents.push({y:CURB-10,d:()=>{shadow(tr.x+18,CURB-12,tr.kind==='young'?14:30,tr.kind==='young'?4:6,.16);ctx.drawImage(tr.spr,tr.x-42,CURB-10-tr.spr.height);}});
    for(const m of MANHOLES)if(m.steam)ents.push({y:m.y,d:()=>{for(let i=0;i<7;i++){const u=((t*.35+i/7)%1),x=m.x+Math.sin(t*1.3+i*2)*6+u*18,y=m.y-u*70,r=5+u*14;ctx.fillStyle=`rgba(236,236,236,${.32*(1-u)})`;ctx.beginPath();ctx.ellipse(x,y,r,r*.7,0,0,7);ctx.fill();}}});
    for(const b of birds)ents.push({y:b.y,d:()=>bird(ctx,b)});
    for(const p of props)ents.push({y:p.y,d:()=>{shadow(p.x+4,p.y,p.spr.width*.45,3,.2);ctx.drawImage(p.spr,Math.round(p.x-p.spr.width/2),Math.round(p.y-p.spr.height));}});
    for(const p of peds)ents.push({y:p.y,d:()=>person(ctx,p)});
    ents.push({y:lemos.y,d:()=>person(ctx,lemos)});
    for(const p of parked)ents.push({y:p.y,d:()=>{shadow(p.x+W(p)/2+4,p.y-3,W(p)/2,6,.3);ctx.drawImage(p.spr,Math.round(p.x),Math.round(p.y-p.spr.height));}});
    for(const k of cars)ents.push({y:LANES[k.lane].y,d:()=>{const y=LANES[k.lane].y,flip=LANES[k.lane].dir<0;
      shadow(k.x+W(k)/2+4,y-3,W(k)/2,6,.3);
      if(flip){ctx.save();ctx.translate(Math.round(k.x)+W(k),0);ctx.scale(-1,1);ctx.drawImage(k.spr,0,y-k.spr.height);ctx.restore();}
      else ctx.drawImage(k.spr,Math.round(k.x),y-k.spr.height);}});
    drawFlags(ctx);
    ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.d();
    if(marker){const b=Math.round(Math.sin(t*6)*2),X=DOOR.x,Y=GY-26+b;ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+8);ctx.lineTo(X-7,Y);ctx.lineTo(X,Y-8);ctx.lineTo(X+7,Y);ctx.fill();
      ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+6);ctx.lineTo(X-5,Y);ctx.lineTo(X,Y-6);ctx.lineTo(X+5,Y);ctx.fill();ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y-4,2,5);ctx.fillRect(X-1,Y+2,2,1.5);}
    // luz da manhã, como o clima de cor das salas da planta: sol baixo e quente da esquerda, o lado da sombra frio
    ctx.setTransform(1,0,0,1,0,0);
    ctx.globalCompositeOperation='soft-light';
    const sun=ctx.createLinearGradient(0,0,cw,ch);sun.addColorStop(0,'rgba(255,214,150,.38)');sun.addColorStop(.55,'rgba(255,224,176,.10)');sun.addColorStop(1,'rgba(90,120,170,.20)');
    ctx.fillStyle=sun;ctx.fillRect(0,0,cw,ch);
    ctx.globalCompositeOperation='source-over';
    ctx.restore();
    lastView={...V,oy:oyr,ox,cw,ch};
  }
  let lastView=null;
  // bandeiras do DHPP: pano coluna a coluna numa onda, com luz e sombra nas dobras (o mesmo pano da planta)
  const cloths=new Map();
  function drawFlags(ctx){
    for(const b of BUILDINGS){if(!b.flags)continue;const f=facades[b.i],oy=GY-f.height+2;
      for(const fl of b.flags){let cl=cloths.get(fl);
        if(!cl){cl=art.S2(22,14,(P,E)=>{P(0,0,22,14,fl.c1);P(0,0,22,1,'rgba(255,255,255,.25)');P(0,13,22,1,'rgba(0,0,0,.25)');
          if(fl.c2==='#f2c230'){E(11,7,8,5,fl.c2);E(11,7,4,3.5,fl.c3);}else{for(let k=0;k<3;k++)P(4,4+k*3,14,1,fl.c2);}});cloths.set(fl,cl);}
        const X=b.X+fl.x,Y=oy+fl.y;
        for(let i=0;i<22;i++){const ph=t*8.6-i*0.5,dy=Math.round(Math.sin(ph)*1.8*(i/21));ctx.drawImage(cl,i,0,1,14,X+i,Y+dy,1,14);
          if(Math.cos(ph)<-0.3){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(X+i,Y+dy,1,14);}else if(Math.cos(ph)>0.7){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(X+i,Y+dy,1,14);}}}}
  }
  // pombo como os da planta: corpo cinza, pescoço verde, bica o chão parado e bate as asas no voo
  function bird(ctx,b){
    const X=Math.round(b.x),Y=Math.round(b.y),z=Math.round(b.z),d=b.dir;
    ctx.globalAlpha=0.28*Math.max(0.2,1-b.z/90);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X,Y,5,1.6,0,0,7);ctx.fill();ctx.globalAlpha=1;
    const y=Y-z-6,peck=b.st==='g'&&(b.t%50)<8,fly=b.st!=='g',up=(Math.floor(b.t/4))%2,F=(x,yy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,yy,w,h);};
    if(fly){F(X-7,up?y-5:y+1,14,4,'#1e1611');F(X-6,up?y-4:y+2,12,2,'#a3a9b0');}
    F(X-5-(d>0?1:0),y-1,11,7,'#1e1611');F(X-4,y,9,5,'#8a9098');F(X-3,y,6,2,'#a3a9b0');F(d>0?X-5:X+3,y+1,3,2,'#5a6068');
    const hx=d>0?X+4:X-6,hy=peck?y+3:y-3;F(hx-1,hy-1,5,5,'#1e1611');F(hx,hy,3,3,'#4f5a62');F(hx,hy+2,3,1,'#5fa08a');F(d>0?hx+2:hx,hy,1,1,'#e8e2d0');F(d>0?hx+3:hx-1,hy+1,1,1,'#c97a3a');
  }
  // o mesmo desenho de pessoa da planta: sombra no pé (o sol vem da esquerda) e o quadro do passo, espelhado para a esquerda
  function person(ctx,p){
    const f=p.moving?Math.floor(p.walk*3.2)%4:0,img=p.frames[f],X=Math.round(p.x),Y=Math.round(p.y);
    ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(X+5,Y-1,12,3.5,0,0,7);ctx.fill();
    if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);ctx.drawImage(img,-14,Y-45);ctx.restore();}else ctx.drawImage(img,X-14,Y-45);
  }

  /** toque na tela (px do canvas): na porta ou na fachada do DHPP entra; na calçada anda até lá */
  function tap(px,py){
    if(!lastView)return;const {s,ox,oy}=lastView,wx=(px-ox)/s,wy=(py-oy)/s;
    const onDhpp=wx>=DHPP.X&&wx<=DHPP.X+DHPP.w&&wy<GY+8;
    if(onDhpp){lemos.tx=DOOR.x;lemos.ty=DOOR.y;lemos.enter=true;return;}
    lemos.tx=clamp(wx,20,STREET_W-20);lemos.ty=clamp(wy,WALK[0],WALK[1]);lemos.enter=false; // tocou na rua: vai até a beira da calçada
  }
  /** posiciona Lemos: 'porta' (saindo do DHPP) ou 'carro' (chegando na viatura) */
  function place(where){
    lemos.tx=null;lemos.enter=false;lemos.moving=false;
    if(where==='porta'){lemos.x=DOOR.x;lemos.y=DOOR.y+10;lemos.dir=1;}
    else{lemos.x=viatura.x+W(viatura)/2;lemos.y=WALK[1];lemos.dir=1;}
    camX=lemos.x;camY=null;
  }
  return {update,draw,tap,place,lemos,door:DOOR,get view(){return lastView;},get cars(){return cars;},parked,peds,birds,get t(){return t;}};
}
