/* Rua do DHPP — direção americana aprovada (docs/DIRECAO_RUA_AMERICANA_DHPP.md; medidas em docs/RUA_AMERICANA_ESPEC.md).
   Fachadas de frente e rua horizontal, câmera elevada (o chão visto de cima: calçada, meio-fio, vagas e duas faixas de
   trânsito), o DHPP no centro de um quarteirão simétrico: DINER e GROCERY de um lado, PAWN SHOP e LAUNDRY do outro,
   becos fundos dos dois lados do DHPP, prédios residenciais e as esquinas com as ruas transversais nas pontas.
   Lemos anda pela calçada; tocando no DHPP ele sobe a escadaria, os guardas batem continência e ele entra (a planta da
   base, em base.js).

   Arte: cada peça é um PNG oficial em public/base/rua/ (nomes em ruaAssets.js, encomendados ao ChatGPT nos pedidos
   creative-requests/inbox/2026-10-11-rua-us-*). Enquanto um PNG não chega, a peça é desenhada em código no mesmo
   retângulo (provisório, streetArt.js); quando o arquivo existe no build (__RUA_ART__), ele entra no lugar sozinho. */
import {GY,SIDE,CURB,ROAD,WALK,PARK,LANES,STREET_H,rnd,FH,facadeSprite,CARS,carSprite,propSprite,drawSkyline} from './streetArt';
import {RUA_DIR,FACHADAS,CAMADAS,VEICULOS,NPC_FRAME,NPC_ROWS,NPC_COUNTS,PEDESTRES,GUARDAS,PATH} from './ruaAssets';
export {STREET_H};

/* ---------- o quarteirão, da esquerda para a direita (x da especificação) ---------- */
const LOT=[
  {k:'cross',w:110,id:'esquina-oeste',name:'N 9TH ST'},
  {k:'apt',w:120,id:'predio-oeste',brick:'#8e3b2c',cor:'#3a2a22',escape:'l',door:'#2f4a3a'},
  {k:'diner',w:132,id:'diner',brick:'#9a3f30',cor:'#3a2a22',escape:'r'},
  {k:'grocery',w:136,id:'grocery',brick:'#8a3a2c',cor:'#2a2a2e',win:'six'},
  {k:'alley',w:58,id:'beco-oeste'},
  {k:'dhpp',w:170,id:'dhpp'},
  {k:'alley',w:58,id:'beco-leste'},
  {k:'pawn',w:136,id:'pawn-shop',brick:'#b09a6a',cor:'#3a3a3e',escape:'l'},
  {k:'laundry',w:132,id:'laundry',brick:'#8a5a40',cor:'#2a2a2e',win:'six'},
  {k:'apt',w:120,id:'predio-leste',brick:'#a0603a',cor:'#2a2a2e',escape:'r',door:'#5a2a22'},
  {k:'cross',w:110,id:'esquina-leste',name:'W OAK ST'}
];
let acc=0;export const BUILDINGS=LOT.map((b,i)=>{const o={...b,i,X:acc,gap:b.k==='cross'||b.k==='alley'};acc+=b.w;return o;});
for(const b of BUILDINGS)if(b.gap){const L=BUILDINGS[b.i-1],Rr=BUILDINGS[b.i+1];b.hl=b.hr=b.h=FH;b.bl=L&&L.brick||'#5a3226';b.br=Rr&&Rr.brick||'#8a4a38';}
export const STREET_W=acc;                               // 1282
export const DHPP=BUILDINGS.find(b=>b.k==='dhpp');       // x 556–726, centro 641
export const DOOR={x:DHPP.X+DHPP.w/2,y:WALK[0]+2};       // o pé da escadaria do DHPP
export const CROSS=BUILDINGS.filter(b=>b.k==='cross');
export const CSW=20; // calçada das ruas transversais
const inCross=(x,m=0)=>CROSS.some(c=>x>c.X+CSW-m&&x<c.X+c.w-CSW+m);

/* ---------- mobiliário: na beira da calçada (cy) ou encostado nas fachadas (fy), simétrico sem ser espelho ---------- */
const cy=CURB-3,fy=GY+5;
export const PROPS=[
  {k:'semaforo',x:CROSS[0].X+10,y:cy,sign:CROSS[0].name},{k:'semaforo',x:CROSS[0].X+CROSS[0].w-10,y:cy,sign:CROSS[0].name},
  {k:'semaforo',x:CROSS[1].X+10,y:cy,sign:CROSS[1].name},{k:'semaforo',x:CROSS[1].X+CROSS[1].w-10,y:cy,sign:CROSS[1].name},
  {k:'poste-luz',x:175,y:cy},{k:'poste-luz',x:1107,y:cy},
  {k:'placa-onibus',x:138,y:cy},{k:'banco',x:156,y:fy},
  {k:'caixa-correio',x:266,y:cy},{k:'parquimetro',x:330,y:cy},{k:'parquimetro',x:437,y:cy},{k:'caixa-papelao',x:482,y:cy},{k:'lixeira',x:502,y:cy},
  {k:'parquimetro',x:545,y:cy},{k:'sacos-lixo',x:514,y:fy},{k:'sacos-lixo',x:768,y:fy},{k:'lixeira-cheia',x:542,y:fy},
  {k:'parquimetro',x:737,y:cy},{k:'hidrante',x:812,y:cy},{k:'parquimetro',x:845,y:cy},{k:'placa-proibido',x:906,y:cy},
  {k:'parquimetro',x:952,y:cy},{k:'telefone-publico',x:1036,y:fy},{k:'lixeira',x:1047,y:cy},{k:'jornal-azul',x:1140,y:cy},{k:'jornal-vermelho',x:1154,y:cy},
  {k:'alarme-incendio',x:1126,y:cy}
];
// bueiros (um solta vapor) e bocas de lobo no meio-fio
export const MANHOLES=[{x:825,y:ROAD+39,steam:false},{x:330,y:ROAD+120,steam:true},{x:1000,y:ROAD+132,steam:false}];
const GRATES=[532,750];
// a vaga hachurada da viatura, centrada no DHPP
const VAGA={x:DHPP.X+DHPP.w/2-90,w:180,y:ROAD+2,h:40};

/* ---------- arte oficial: o que existe em public/base/rua/ (lista feita no build) ---------- */
// eslint-disable-next-line no-undef
const HAS=new Set(typeof __RUA_ART__!=='undefined'?__RUA_ART__:[]);
const IMG=new Map();
function art(path){if(!HAS.has(path))return null;let im=IMG.get(path);if(!im){im=new Image();im.decoding='async';im.src=RUA_DIR+path;IMG.set(path,im);}return im.complete&&im.naturalWidth?im:null;}
/** carrega tudo o que já chegou (resolve mesmo se algo falhar) */
export function preloadRua(){return Promise.all([...HAS].map(p=>new Promise(r=>{art(p);const im=IMG.get(p);if(!im||im.complete)return r();im.onload=im.onerror=()=>r();})));}

/* ---------- gente provisória (até chegarem as folhas oficiais dos pedestres) ---------- */
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
const GUARD_LOOK={skin:'#c98e64',hair:'#1f1a18',style:'cap',kind:'rua',top:'#1e2a4a',pants:'#1e2a4a',shoes:'#111'};
const SCALE=38/46; // o boneco provisório (o da planta, 46 px) reduzido para a altura da rua (38 px)

/** art: as funções de desenho da base (S2, refine, outlined, bush, hash, mulberry32, txt, txtW) */
export function createStreet({lemosLook,onEnter,getZoom,personFrames,art:A}){
  const facades=BUILDINGS.map(b=>facadeSprite(A,b));
  const props=PROPS.map(p=>({...p,spr:propSprite(A,p.k==='semaforo'?'semaforo':p.k),name:p.sign,sign:p.sign?propSprite(A,'placa-rua',p.sign):null}));
  const lights=[0,1,2].map(i=>propSprite(A,'semaforo',i));
  let layer=buildStatic();
  // quando a arte oficial termina de carregar, o fundo é refeito com ela
  const ready=preloadRua().then(()=>{layer=buildStatic();});

  function buildStatic(){
    const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    const R=rnd(5),P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    const E=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
    const tile=(img,x0,y0,x1,h)=>{for(let x=x0;x<x1;x+=img.width)c.drawImage(img,0,0,Math.min(img.width,x1-x),h,x,y0,Math.min(img.width,x1-x),h);};
    // céu (o horizonte fica atrás dos telhados)
    const sky=art(PATH.ceu());
    if(sky)tile(sky,0,0,STREET_W,GY);else{const g=c.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#86a6c8');g.addColorStop(.5,'#c9d4dc');g.addColorStop(1,'#e8d2b0');c.fillStyle=g;c.fillRect(0,0,STREET_W,GY);drawSkyline(P,E,STREET_W,rnd(9));}
    // fachadas: a oficial, se já chegou; senão o provisório do mesmo tamanho
    for(const b of BUILDINGS){const of=art(PATH.fachada(b.id));if(of)c.drawImage(of,b.X,GY-of.height);else{const f=facades[b.i];c.drawImage(f,b.X-1,GY-f.height+1);}}
    // calçada, meio-fio e asfalto
    const tc=art(PATH.chao('calcada')),tm=art(PATH.chao('meio-fio')),ta=art(PATH.chao('asfalto'));
    if(tc)tile(tc,0,GY,STREET_W,SIDE);else{P(0,GY,STREET_W,SIDE,'#b8b0a2');
      for(let y=GY,r=0;y<CURB;y+=25,r++){P(0,y,STREET_W,1,'#a29a8c');P(0,y+1,STREET_W,1,'#c6beb0');for(let x=(r%2)*20;x<STREET_W;x+=40){P(x,y,1,25,'#a29a8c');const t=R();if(t<.25)P(x+2,y+2,37,22,t<.12?'rgba(110,100,86,.14)':'rgba(255,250,240,.10)');}}
      for(let i=0;i<STREET_W*1.5;i++)P(R()*STREET_W,GY+2+R()*(SIDE-4),1,1,R()<.5?'#a8a092':'#c2baac');
      for(let i=0;i<STREET_W/18;i++)P(R()*STREET_W,GY+3+R()*(SIDE-6),2,1,'rgba(40,36,30,.35)');}
    P(0,GY,STREET_W,3,'rgba(0,0,0,.24)');P(0,GY+3,STREET_W,3,'rgba(0,0,0,.10)');
    if(tm)tile(tm,0,CURB,STREET_W,6);else{P(0,CURB,STREET_W,2,'#d2ccc0');P(0,CURB+2,STREET_W,4,'#8a857a');P(0,CURB+5,STREET_W,1,'#5a564e');for(let x=0;x<STREET_W;x+=32)P(x,CURB,1,6,'#6e6a60');}
    if(ta)tile(ta,0,ROAD,STREET_W,STREET_H-ROAD);else{P(0,ROAD,STREET_W,STREET_H-ROAD,'#55585e');
      for(let i=0;i<STREET_W*4;i++)P(R()*STREET_W,ROAD+R()*(STREET_H-ROAD),1,1,R()<.5?'#5f6268':'#4a4d53');
      for(let i=0;i<STREET_W/40;i++){let x=R()*STREET_W,y=ROAD+6+R()*(STREET_H-ROAD-12);for(let k=0;k<12;k++){P(x,y,2,1,'#3a3c40');x+=2;y+=R()<.5?1:-1;}}
      for(let i=0;i<STREET_W/90;i++){const x=R()*STREET_W,y=ROAD+10+R()*(STREET_H-ROAD-20);P(x,y,24+R()*30,6+R()*8,'rgba(30,30,34,.18)');}
      P(0,ROAD,STREET_W,3,'#3e4044');}
    // marcações: tracejado branco entre a vaga e a faixa de cima, faixa dupla amarela
    const fb=art(PATH.chao('faixa-branca')),fa=art(PATH.chao('faixa-amarela'));
    for(let x=12;x<STREET_W;x+=64)if(!inCross(x,4)){if(fb)c.drawImage(fb,x,ROAD+39);else P(x,ROAD+39,24,3,'#d8d8d0');}
    if(fa)tile(fa,0,ROAD+80,STREET_W,5);else{P(0,ROAD+80,STREET_W,2,'#d8b43a');P(0,ROAD+83,STREET_W,2,'#d8b43a');}
    // vaga reservada da viatura
    const vg=art(PATH.chao('vaga-dhpp'));if(vg)c.drawImage(vg,VAGA.x,VAGA.y);else{const {x,y,w,h}=VAGA;P(x,y,w,1,'#e8e8e0');P(x,y+h-1,w,1,'#e8e8e0');P(x,y,1,h,'#e8e8e0');P(x+w-1,y,1,h,'#e8e8e0');
      c.save();c.beginPath();c.rect(x+2,y+2,w-4,h-4);c.clip();for(let k=-h;k<w;k+=7)for(let j=0;j<h;j++)P(x+2+k+j,y+2+j,2,1,'rgba(232,232,224,.75)');c.restore();}
    // esquinas: a transversal corta a calçada, com faixa de pedestres nas duas ruas e o meio-fio virando
    const fp=art(PATH.chao('faixa-pedestres'));
    for(const cr of CROSS){const x0=cr.X+CSW,x1=cr.X+cr.w-CSW;P(x0,GY,x1-x0,ROAD-GY,'#55585e');for(let i=0;i<(x1-x0)*8;i++)P(x0+R()*(x1-x0),GY+R()*(ROAD-GY),1,1,R()<.5?'#5f6268':'#4a4d53');
      for(const ex of [x0-2,x1])P(ex,GY,2,CURB-GY,'#d2ccc0');for(let x=x0+3;x<x1-3;x+=8)P(x,GY+12,5,30,'#e2e2da');
      for(const zx of [cr.X+2,x1+2]){if(fp)c.drawImage(fp,zx-6,ROAD);else for(let y=ROAD+4;y<STREET_H-2;y+=8)P(zx,y,CSW-4,4,'#d8d8d0');}}
    // bueiros, bocas de lobo, manchas e lixo no chão
    const bu=art(PATH.chao('bueiro')),bl=art(PATH.chao('boca-de-lobo')),mc=art(PATH.chao('manchas')),lx=art(PATH.chao('lixo-chao'));
    for(const m of MANHOLES){if(bu)c.drawImage(bu,m.x-10,m.y-4);else{E(m.x,m.y,10,4,'#2e3034');E(m.x,m.y,8,3,'#55585e');for(let k=-6;k<=6;k+=3)P(m.x+k,m.y-2,1,4,'#3e4044');}}
    for(const x of GRATES){if(bl)c.drawImage(bl,x-12,ROAD);else{P(x-12,ROAD,24,5,'#2a2b2e');for(let k=0;k<24;k+=3)P(x-12+k,ROAD+1,2,3,'#4a4c50');}}
    const Rd=rnd(12);
    for(let i=0;i<22;i++){const x=Rd()*STREET_W,y=ROAD+8+Rd()*(STREET_H-ROAD-16),n=Math.floor(Rd()*6);if(mc)c.drawImage(mc,n*32,0,32,12,x,y,32,12);else E(x,y,8+Rd()*10,2+Rd()*3,'rgba(20,20,24,.22)');}
    for(let i=0;i<40;i++){const x=Rd()*STREET_W,onWalk=Rd()<.6,y=onWalk?GY+4+Rd()*(SIDE-8):ROAD+2+Rd()*10,n=Math.floor(Rd()*8);
      if(lx)c.drawImage(lx,n*10,0,10,6,x,y,10,6);else P(x,y,3,2,['#e8e2d4','#c9a24a','#8a6a40','#c0392b'][n%4]);}
    return cv;
  }

  /* ---------- gente, carros e bichos ---------- */
  const lemos={x:DHPP.X+DHPP.w/2-110,y:WALK[0]+22,dir:1,walk:0,moving:false,vx:0,vy:0,look:lemosLook,frames:personFrames(lemosLook),tx:null,ty:null,enter:false,climb:0};
  const sprCache={};const carOf=k=>sprCache[k.id]||(sprCache[k.id]=carSprite(A,k));
  const byId=id=>CARS.find(k=>k.id===id);
  // estacionados: a viatura na vaga do DHPP; os outros longe da vaga, das esquinas e do hidrante
  const parked=[{kind:byId('viatura-dhpp'),x:VAGA.x+13,y:PARK},{kind:byId('sedan-verde'),x:122,y:PARK},{kind:byId('sedan-bordo'),x:285,y:PARK},{kind:byId('perua-madeira'),x:895,y:PARK}]
    .map(p=>({...p,spr:carOf(p.kind)}));
  const viatura=parked[0];
  const R=rnd(17);
  const peds=Array.from({length:14},(_,i)=>{const look=PED_LOOKS[i%PED_LOOKS.length];
    return {x:R()*STREET_W,y:WALK[0]+4+R()*(WALK[1]-WALK[0]-4),dir:R()<.5?-1:1,v:(14+R()*12)*(PEDESTRES[i%PEDESTRES.length]==='idoso-chapeu'?.6:1),walk:R()*10,look,kind:PEDESTRES[i%PEDESTRES.length],
      frames:personFrames(look),pause:0,act:false,id:i};});
  // os dois guardas no alto da escadaria, um de cada lado da porta
  const guards=GUARDS_POS().map((g,i)=>({x:g.x,y:g.y,dir:i?-1:1,walk:0,moving:false,kind:GUARDAS[i],look:GUARD_LOOK,frames:personFrames(GUARD_LOOK),salute:0}));
  const cars=[];const moving=['taxi','sedan-azul','furgao-marrom','sedan-bege','sedan-bordo','taxi','sedan-verde','onibus'].map(byId);
  for(let l=0;l<LANES.length;l++)for(let i=0;i<3;i++){const kind=moving[(l*3+i)%moving.length],v=LANES[l].v*(0.85+R()*0.3);cars.push({kind,spr:carOf(kind),lane:l,x:i*STREET_W/3+R()*200,v,v0:v,puff:R()});}
  const puffs=[];
  const birds=Array.from({length:6},()=>({x:300+R()*(STREET_W-600),y:WALK[0]+8+R()*(WALK[1]-WALK[0]-12),z:0,dir:R()<.5?-1:1,st:'g',t:R()*40,vx:0,vz:0}));
  let camX=lemos.x,t=0,doorT=0;
  const W=k=>k.spr.width;

  function update(dt){
    t+=dt;
    // Lemos: anda até o toque; no DHPP sobe a escadaria, os guardas batem continência, a porta abre e ele entra
    if(lemos.climb>0){lemos.climb+=dt;lemos.moving=true;lemos.vx=0;lemos.vy=-1;lemos.walk+=dt*2.5;doorT=Math.min(1,doorT+dt*2.2);
      lemos.y=Math.max(GY-22,lemos.y-dt*44);for(const g of guards)g.salute=1;
      if(lemos.climb>.9){lemos.climb=0;lemos.moving=false;onEnter();setTimeout(()=>{doorT=0;for(const g of guards)g.salute=0;},400);}}
    else if(lemos.tx!=null){const dx=lemos.tx-lemos.x,dy=lemos.ty-lemos.y,d=Math.hypot(dx,dy),sp=80*dt;
      if(d<=sp){lemos.x=lemos.tx;lemos.y=lemos.ty;lemos.tx=null;lemos.moving=false;if(lemos.enter){lemos.enter=false;lemos.climb=.001;lemos.dir=1;}}
      else{lemos.x+=dx/d*sp;lemos.y+=dy/d*sp;lemos.walk+=sp/32;lemos.moving=true;lemos.vx=dx;lemos.vy=dy;if(Math.abs(dx)>0.5)lemos.dir=dx>0?1:-1;}}
    // pedestres: andam, às vezes param (e fazem a ação deles), e saem numa ponta para voltar na outra
    for(const p of peds){
      if(p.pause>0){p.pause-=dt;p.moving=false;continue;}
      p.act=false;p.x+=p.dir*p.v*dt;p.walk+=p.v*dt/32;p.moving=true;
      if(R()<dt*0.07){p.pause=1.5+R()*3;p.act=R()<.6;}
      if(p.x<-30){p.x=STREET_W+20;p.y=WALK[0]+4+R()*(WALK[1]-WALK[0]-4);}else if(p.x>STREET_W+30){p.x=-20;p.y=WALK[0]+4+R()*(WALK[1]-WALK[0]-4);}
    }
    // pombos: ciscam; se alguém chega perto, voam para outro canto da calçada
    for(const b of birds){b.t+=dt*30;
      if(b.st==='g'){if(Math.random()<dt*.6)b.x+=b.dir*2;if(Math.random()<dt*.2)b.dir=-b.dir;
        const near=[lemos,...peds].some(p=>Math.abs(p.x-b.x)<28&&Math.abs(p.y-b.y)<14);if(near){b.st='f';b.vx=(Math.random()<.5?-1:1)*(60+Math.random()*40);b.vz=60;b.dir=Math.sign(b.vx);b.tx=Math.max(60,Math.min(STREET_W-60,b.x+b.vx*2.4));}}
      else{b.x+=b.vx*dt;b.z=Math.max(0,b.z+b.vz*dt);if(Math.abs(b.x-b.tx)<50)b.vz=-50;else if(b.z>50)b.vz=0;
        if(b.vz<0&&b.z<=0){b.st='g';b.z=0;b.y=WALK[0]+8+Math.random()*(WALK[1]-WALK[0]-12);}}}
    // trânsito: cada um segue o da frente na mesma faixa (sem atravessar); fumacinha do escapamento atrás
    for(let l=0;l<LANES.length;l++){const dir=LANES[l].dir,ln=cars.filter(k=>k.lane===l).sort((a,b)=>dir>0?b.x-a.x:a.x-b.x);
      for(let i=0;i<ln.length;i++){const k=ln[i],lead=ln[i-1];let v=k.v0;
        if(lead){const gap=dir>0?lead.x-(k.x+W(k)):k.x-(lead.x+W(lead));if(gap<60)v=Math.min(v,lead.v*(gap<24?0.6:1));}
        k.v+=(v-k.v)*Math.min(1,dt*3);k.x+=dir*k.v*dt;
        k.puff+=dt;if(k.puff>.45){k.puff=0;puffs.push({x:dir>0?k.x+4:k.x+W(k)-4,y:LANES[l].y-7,vx:-dir*10,t:0});}
        if(dir>0&&k.x>STREET_W+60){const back=Math.min(...ln.map(o=>o.x));k.x=Math.min(-W(k)-60,back-W(k)-100)-R()*300;}
        if(dir<0&&k.x<-W(k)-60){const back=Math.max(...ln.map(o=>o.x+W(o)));k.x=Math.max(STREET_W+60,back+100)+R()*300;}}}
    for(const p of puffs){p.t+=dt;p.x+=p.vx*dt;p.y-=dt*4;}while(puffs.length&&puffs[0].t>1)puffs.shift();
  }

  // a câmera segue o Lemos na horizontal e fica encostada embaixo (a rua inteira à vista, como na referência)
  function view(cw,ch,rs){
    const z=getZoom?getZoom():0,s=z>0?rs*z:Math.min(ch/(STREET_H-25),cw/620);
    const vw=cw/s,vh=ch/s;
    camX+=(clamp(lemos.x,vw/2,STREET_W-vw/2)-camX)*0.12;camX=clamp(camX,vw/2,STREET_W-vw/2);
    return {s,left:camX-vw/2,top:STREET_H-vh,rs};
  }
  const clamp=(v,a,b)=>a>b?(a+b)/2:v<a?a:v>b?b:v;

  function draw(ctx,cw,ch,rs,marker){
    const V=view(cw,ch,rs),{s,left}=V;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
    ctx.fillStyle='#86a6c8';ctx.fillRect(0,0,cw,ch);ctx.imageSmoothingEnabled=false;
    const ox=Math.round(-left*s),oyr=Math.round(-V.top*s);
    ctx.setTransform(s,0,0,s,ox,oyr);
    ctx.drawImage(layer,0,0);
    drawLayers(ctx);
    const ents=[],shadow=(x,y,rx,ry,a)=>{ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();};
    for(const p of props){const of=art(p.k==='semaforo'?PATH.semaforo():PATH.prop(p.k));
      ents.push({y:p.y,d:()=>{const w=of?(p.k==='semaforo'?18:of.width):p.spr.width,h=of?of.height:p.spr.height;shadow(p.x+3,p.y,Math.max(3,w*.45),2,.2);
        if(p.k==='semaforo'){const st=Math.floor((t/4+p.x/300)%3);if(of)ctx.drawImage(of,st*18,0,18,96,p.x-9,p.y-96,18,96);else ctx.drawImage(lights[st],Math.round(p.x-9),p.y-lights[st].height);
          const ps=p.name&&art(PATH.placa(p.name==='N 9TH ST'?'n-9th-st':'w-oak-st'));if(ps)ctx.drawImage(ps,p.x-22,p.y-104);else if(p.sign)ctx.drawImage(p.sign,Math.round(p.x-22),p.y-106);}
        else if(of)ctx.drawImage(of,Math.round(p.x-of.width/2),p.y-of.height);else ctx.drawImage(p.spr,Math.round(p.x-p.spr.width/2),p.y-p.spr.height);}});}
    for(const p of peds)ents.push({y:p.y,d:()=>person(ctx,p)});
    for(const g of guards)ents.push({y:g.y,d:()=>person(ctx,g,true)});
    ents.push({y:lemos.y,d:()=>person(ctx,lemos)});
    for(const p of parked)ents.push({y:p.y,d:()=>car(ctx,p,p.x,p.y,1,p===viatura)});
    for(const k of cars){const L=LANES[k.lane];ents.push({y:L.y,d:()=>car(ctx,k,k.x,L.y,L.dir,false)});}
    for(const b of birds)ents.push({y:b.y,d:()=>bird(ctx,b)});
    for(const m of MANHOLES)if(m.steam)ents.push({y:m.y,d:()=>steam(ctx,m)});
    ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.d();
    for(const p of puffs){const u=p.t,of=art(PATH.efeito('fumaca-escape'));if(of){const f=Math.min(3,Math.floor(u*4));ctx.globalAlpha=1-u;ctx.drawImage(of,f*12,0,12,8,p.x-6,p.y-4,12,8);ctx.globalAlpha=1;}
      else{ctx.fillStyle=`rgba(210,210,214,${.45*(1-u)})`;ctx.beginPath();ctx.ellipse(p.x,p.y,2+u*5,1.5+u*3,0,0,7);ctx.fill();}}
    if(marker){const b=Math.round(Math.sin(t*6)*2),X=DOOR.x,Y=GY-124+b;ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+7);ctx.lineTo(X-6,Y);ctx.lineTo(X,Y-7);ctx.lineTo(X+6,Y);ctx.fill();
      ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+5);ctx.lineTo(X-4,Y);ctx.lineTo(X,Y-5);ctx.lineTo(X+4,Y);ctx.fill();ctx.fillStyle='#1e1611';ctx.fillRect(X-.5,Y-3,1.5,4);ctx.fillRect(X-.5,Y+2,1.5,1);}
    // luz da manhã por cima, como o clima de cor das salas da planta
    ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='soft-light';
    const sun=ctx.createLinearGradient(0,0,cw,ch);sun.addColorStop(0,'rgba(255,214,150,.30)');sun.addColorStop(.6,'rgba(255,224,176,.08)');sun.addColorStop(1,'rgba(90,120,170,.16)');
    ctx.fillStyle=sun;ctx.fillRect(0,0,cw,ch);ctx.globalCompositeOperation='source-over';
    ctx.restore();
    lastView={...V,oy:oyr,ox,cw,ch};
  }
  let lastView=null;

  // camadas animadas das fachadas: porta do DHPP, bandeiras, luzes, neon e máquinas (oficiais, ou os provisórios)
  const cloth=new Map();
  function drawLayers(ctx){
    for(const b of BUILDINGS){const top=GY-FH,lay=(name,i)=>{const im=art(PATH.camada(`${b.id}-${name}`,i));if(im)ctx.drawImage(im,b.X,top);return !!im;};
      if(b.k==='dhpp'){lay('luzes',0);const df=Math.min(3,Math.floor(doorT*4));if(df>0&&!lay('porta',df)){ctx.fillStyle=`rgba(255,226,160,${.5*doorT})`;ctx.fillRect(b.X+64,top+FH-86,42,64);}
        if(!lay('bandeiras',Math.floor(t*6)%4))for(const f of b.flags||[])usFlag(ctx,b.X+f.x,top+f.y,f.s);}
      const neon=b.k==='diner'||b.k==='pawn'||b.k==='laundry';
      if(neon){const on=Math.floor(t*1.6+b.i)%3!==0,id=b.id;if(!lay('neon',on?0:1))for(const n of b.neon||[])if(on){ctx.fillStyle='rgba(20,8,10,.85)';ctx.fillRect(b.X+n.x-1,top+n.y-1,n.w+2,n.h+2);
          ctx.fillStyle=n.col;ctx.font=`700 ${n.h-1}px Rajdhani,Arial,sans-serif`;ctx.textBaseline='top';ctx.fillText(n.txt,b.X+n.x+1,top+n.y);ctx.fillStyle='rgba(255,120,120,.18)';ctx.fillRect(b.X+n.x-3,top+n.y-3,n.w+6,n.h+6);}
        if(b.k==='laundry')lay('maquinas',Math.floor(t*4)%2);}}
  }
  // bandeira americana provisória: listras e cantão, coluna a coluna numa onda
  function usFlag(ctx,X,Y,s){let cl=cloth.get('us');if(!cl){cl=A.S2(16,10,(P)=>{for(let k=0;k<10;k++)P(0,k,16,1,k%2?'#f2f0e8':'#b8302a');P(0,0,7,5,'#2a3a6a');for(let k=0;k<6;k++)P(1+(k%3)*2,1+(k>2?2:0),1,1,'#f2f0e8');});cloth.set('us',cl);}
    for(let i=0;i<16;i++){const ph=t*8-i*.5,dy=Math.round(Math.sin(ph)*1.2*(i/15)),x=s<0?X-1-i:X+i;ctx.drawImage(cl,s<0?i:i,0,1,10,x,Y+dy,1,10);}}
  // carro: folha oficial (rodas girando; a viatura parada com o giroflex) ou o provisório; sombra no chão
  function car(ctx,k,x,y,dir,isViatura){
    const id=k.kind.id,meta=VEICULOS[id],of=art(PATH.veiculo(id)),w=of&&meta?meta.w:k.spr.width,h=of&&meta?meta.h:k.spr.height;
    ctx.fillStyle='rgba(0,0,0,.30)';ctx.beginPath();ctx.ellipse(x+w/2+3,y-2,w/2,5,0,0,7);ctx.fill();
    let f=0;if(of&&meta){f=isViatura?2+Math.floor(t*2.5)%2:(k.v?Math.floor(t*10)%2:0);}
    const X=Math.round(x),Y=Math.round(y-h);
    const put=()=>{if(of&&meta)ctx.drawImage(of,f*meta.w,0,meta.w,meta.h,0,0,meta.w,meta.h);else ctx.drawImage(k.spr,0,0);};
    ctx.save();ctx.translate(dir<0?X+w:X,Y);if(dir<0)ctx.scale(-1,1);put();ctx.restore();
    if(isViatura&&!of&&Math.floor(t*2.5)%2){ctx.fillStyle='rgba(255,60,60,.35)';ctx.fillRect(X+w*.36,Y-3,w*.12,4);}
  }
  // pessoa: folha oficial (linhas da especificação) ou o boneco da planta reduzido para 38 px
  function person(ctx,p,guard){
    const X=Math.round(p.x),Y=Math.round(p.y);
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(X+3,Y-1,8,2.5,0,0,7);ctx.fill();
    const sheet=art(p===lemos?PATH.lemos():PATH.npc(p.kind));
    if(sheet){let row,fps=8;
      if(guard)row=p.salute?NPC_ROWS.acao:NPC_ROWS.paradoFrente,fps=p.salute?8:4;
      else if(p.moving)row=(p===lemos&&Math.abs(p.vy)>Math.abs(p.vx)*1.2)?(p.vy>0?NPC_ROWS.andarBaixo:NPC_ROWS.andarCima):NPC_ROWS.andarLado;
      else row=p.act?NPC_ROWS.acao:NPC_ROWS.paradoFrente,fps=p.act?6:4;
      const n=NPC_COUNTS[row],f=p.moving?Math.floor(p.walk*4)%n:Math.floor(t*fps)%n,{w,h,footX,footY}=NPC_FRAME;
      ctx.save();ctx.translate(X,0);if(p.dir<0&&row!==NPC_ROWS.paradoFrente&&row!==NPC_ROWS.andarBaixo&&row!==NPC_ROWS.andarCima)ctx.scale(-1,1);
      ctx.drawImage(sheet,f*w,row*h,w,h,-footX,Y-footY,w,h);ctx.restore();return;}
    const fr=p.moving?Math.floor(p.walk*3.2)%4:0,img=p.frames[fr],w=Math.round(26*SCALE),h=Math.round(46*SCALE);
    ctx.save();ctx.translate(X,0);if(p.dir<0)ctx.scale(-1,1);ctx.drawImage(img,-Math.round(14*SCALE),Y-h+1,w,h);ctx.restore();
  }
  function bird(ctx,b){
    const of=art(PATH.efeito('pombo')),X=Math.round(b.x),Y=Math.round(b.y),z=Math.round(b.z);
    ctx.globalAlpha=0.26*Math.max(0.2,1-b.z/80);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X,Y,4,1.3,0,0,7);ctx.fill();ctx.globalAlpha=1;
    if(of){const f=b.st!=='g'?4+Math.floor(b.t/3)%4:(b.t%50)<8?Math.floor(b.t/4)%2:2+Math.floor(b.t/6)%2;ctx.save();ctx.translate(X,0);if(b.dir<0)ctx.scale(-1,1);ctx.drawImage(of,f*10,0,10,8,-5,Y-z-8,10,8);ctx.restore();return;}
    const y=Y-z-5,peck=b.st==='g'&&(b.t%50)<8,fly=b.st!=='g',up=(Math.floor(b.t/4))%2,d=b.dir,F=(x,yy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,yy,w,h);};
    if(fly){F(X-5,up?y-4:y+1,10,3,'#1e1611');F(X-4,up?y-3:y+2,8,1,'#a3a9b0');}
    F(X-4,y-1,8,5,'#1e1611');F(X-3,y,6,3,'#8a9098');const hx=d>0?X+3:X-5,hy=peck?y+2:y-2;F(hx-1,hy-1,4,4,'#1e1611');F(hx,hy,2,2,'#4f5a62');F(d>0?hx+2:hx-1,hy+1,1,1,'#c97a3a');
  }
  function steam(ctx,m){const of=art(PATH.efeito('vapor-bueiro'));if(of){const f=Math.floor(t*8)%6;ctx.drawImage(of,f*24,0,24,40,m.x-12,m.y-40,24,40);return;}
    for(let i=0;i<6;i++){const u=((t*.35+i/6)%1),x=m.x+Math.sin(t*1.3+i*2)*3+u*8,y=m.y-u*42,r=3+u*8;ctx.fillStyle=`rgba(236,236,236,${.32*(1-u)})`;ctx.beginPath();ctx.ellipse(x,y,r,r*.7,0,0,7);ctx.fill();}}

  /** toque na tela (px do canvas): no DHPP leva até a escadaria e entra; na calçada anda até lá */
  function tap(px,py){
    if(!lastView||lemos.climb)return;const {s,ox,oy}=lastView,wx=(px-ox)/s,wy=(py-oy)/s;
    const onDhpp=wx>=DHPP.X&&wx<=DHPP.X+DHPP.w&&wy<GY+8;
    if(onDhpp){lemos.tx=DOOR.x;lemos.ty=DOOR.y;lemos.enter=true;return;}
    lemos.tx=clamp(wx,12,STREET_W-12);lemos.ty=clamp(wy,WALK[0],WALK[1]);lemos.enter=false;
  }
  /** posiciona Lemos: 'porta' (saindo do DHPP, no pé da escadaria) ou 'carro' (chegando na viatura) */
  function place(where){
    lemos.tx=null;lemos.enter=false;lemos.moving=false;lemos.climb=0;doorT=0;
    if(where==='porta'){lemos.x=DOOR.x;lemos.y=DOOR.y+8;lemos.dir=1;}
    else{lemos.x=viatura.x+W(viatura)/2;lemos.y=WALK[1];lemos.dir=1;}
    camX=lemos.x;
  }
  return {update,draw,tap,place,lemos,door:DOOR,ready,get view(){return lastView;},get cars(){return cars;},parked,peds,birds,get t(){return t;},zoom:()=>getZoom?getZoom():1};
}
// os guardas no último degrau, ladeando a porta
function GUARDS_POS(){const cx=DHPP.X+DHPP.w/2;return [{x:cx-30,y:GY-22},{x:cx+30,y:GY-22}];}
