/* Rua do DHPP — direção aprovada em 11/10/2026 (docs/DIRECAO_RUA_AMERICANA_DHPP.md): perspectiva de Beat Cop (fachadas de
   frente até o topo da tela, calçada vista de cima, rua horizontal com os carros de lado) no VISUAL DA PLANTA DA BASE:
   a mesma paleta, as janelas brancas com ar-condicionado, a fachada bege do DHPP com o letreiro, a porta e as bandeiras da
   própria base, e os mesmos bonecos de dentro (46 px). Carros e mobiliário são os PNGs oficiais de public/base/rua/.
   Lemos anda pela calçada; tocando no DHPP ele vai até a porta e entra (a planta da base, em base.js). */
import {GY,CURB,ROAD,NEAR,STREET_H,WALK,PARK,LANES,rnd,paintFacades,paintGround} from './streetArt';
import {RUA_DIR,VEICULOS,PATH} from './ruaAssets';
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

/* ---------- mobiliário oficial (pé no centro da última linha), na beira da calçada ou encostado nas fachadas ---------- */
const cy=CURB-6,fy=GY+22,ny=STREET_H-14;
const PROPS=[
  {k:'poste-luz',x:200,y:cy},{k:'poste-luz',x:780,y:cy},{k:'poste-luz',x:1560,y:cy},{k:'poste-luz',x:2140,y:cy},
  {k:'parquimetro',x:90,y:cy},{k:'parquimetro',x:470,y:cy},{k:'parquimetro',x:640,y:cy},{k:'parquimetro',x:1430,y:cy},{k:'parquimetro',x:1700,y:cy},{k:'parquimetro',x:1980,y:cy},{k:'parquimetro',x:2380,y:cy},
  {k:'hidrante',x:1240,y:cy},{k:'caixa-correio',x:330,y:cy-2},{k:'lixeira',x:560,y:cy-4},{k:'placa-proibido',x:930,y:cy},{k:'placa-proibido',x:1500,y:cy},
  {k:'sacos-lixo',x:820,y:fy},{k:'lixeira-cheia',x:868,y:fy},{k:'sacos-lixo',x:1540,y:fy},{k:'telefone-publico',x:1810,y:fy+2},
  {k:'jornal-azul',x:1592,y:fy+8},{k:'jornal-vermelho',x:1614,y:fy+8},{k:'banco',x:1010,y:fy+4},{k:'caixa-papelao',x:236,y:fy+6},
  // calçada de cá (embaixo)
  {k:'placa-onibus',x:300,y:ny},{k:'banco',x:370,y:ny-4},{k:'poste-luz',x:1100,y:ny+8},{k:'lixeira-cheia',x:1460,y:ny-2},{k:'jornal-vermelho',x:1800,y:ny-2}
];
const PROP_S=1.3,CAR_S=1.2;

/* ---------- arte oficial (carros e mobiliário) ---------- */
// eslint-disable-next-line no-undef
const HAS=new Set(typeof __RUA_ART__!=='undefined'?__RUA_ART__:[]);
const IMG=new Map();
function art(path){if(!HAS.has(path))return null;let im=IMG.get(path);if(!im){im=new Image();im.decoding='async';im.src=RUA_DIR+path;IMG.set(path,im);}return im.complete&&im.naturalWidth?im:null;}
const NEED=[...PROPS.map(p=>PATH.prop(p.k)),...Object.keys(VEICULOS).map(PATH.veiculo),PATH.efeito('vapor-bueiro'),PATH.efeito('fumaca-escape'),PATH.efeito('pombo')];
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

/** art: as funções de desenho da base (S2, txt…) e o letreiro e a porta dela */
export function createStreet({lemosLook,onEnter,getZoom,personFrames,art:A}){
  let layer=buildStatic();
  const ready=preloadRua();

  function buildStatic(){
    const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
    const sky=g.createLinearGradient(0,0,0,200);sky.addColorStop(0,'#8fa9c4');sky.addColorStop(1,'#d8d4cc');g.fillStyle=sky;g.fillRect(0,0,STREET_W,GY);
    paintFacades(g,BUILDINGS,A,{sign:A.sign(),door:A.door()});
    paintGround(g,STREET_W);
    return cv;
  }

  /* ---------- gente, carros e bichos ---------- */
  const R=rnd(17);
  const lemos={x:DOOR.x-150,y:WALK[0]+40,dir:1,walk:0,moving:false,look:lemosLook,frames:personFrames(lemosLook),tx:null,ty:null,enter:false,climb:0};
  const peds=Array.from({length:16},(_,i)=>{const look=PED_LOOKS[i%PED_LOOKS.length],near=i>=12,wk=near?NEAR_WALK:WALK;
    return {x:R()*STREET_W,y:wk[0]+4+R()*(wk[1]-wk[0]-4),near,dir:R()<.5?-1:1,v:14+R()*12,walk:R()*10,look,frames:personFrames(look),pause:0,id:i};});
  const meta=id=>VEICULOS[id];
  const W=k=>meta(k.id).w*CAR_S;
  const parked=[{id:'viatura-dhpp',x:DOOR.x-W({id:'viatura-dhpp'})/2,y:PARK},{id:'sedan-bordo',x:40,y:PARK},{id:'perua-madeira',x:1620,y:PARK},{id:'sedan-bege',x:2120,y:PARK}];
  const viatura=parked[0];
  const cars=[];const moving=['taxi','sedan-azul','furgao-marrom','sedan-verde','taxi','sedan-bordo','onibus','sedan-bege'];
  for(let l=0;l<LANES.length;l++)for(let i=0;i<3;i++){const id=moving[(l*3+i)%moving.length],v=LANES[l].v*(0.85+R()*0.3);cars.push({id,lane:l,x:i*STREET_W/3+R()*200,v,v0:v,puff:R()});}
  const puffs=[];
  const birds=Array.from({length:6},()=>({x:300+R()*(STREET_W-600),y:WALK[0]+10+R()*(WALK[1]-WALK[0]-20),z:0,dir:R()<.5?-1:1,st:'g',t:R()*40,vx:0,vz:0}));
  let camX=lemos.x,camY=null,t=0,doorT=0;

  function update(dt){
    t+=dt;
    // Lemos: anda até o toque; na porta do DHPP sobe os degraus, a porta acende e ele entra
    if(lemos.climb>0){lemos.climb+=dt;lemos.moving=true;lemos.walk+=dt*2.5;doorT=Math.min(1,doorT+dt*2.5);lemos.y=Math.max(GY-2,lemos.y-dt*30);
      if(lemos.climb>.6){lemos.climb=0;lemos.moving=false;onEnter();setTimeout(()=>{doorT=0;},400);}}
    else if(lemos.tx!=null){const dx=lemos.tx-lemos.x,dy=lemos.ty-lemos.y,d=Math.hypot(dx,dy),sp=96*dt;
      if(d<=sp){lemos.x=lemos.tx;lemos.y=lemos.ty;lemos.tx=null;lemos.moving=false;if(lemos.enter){lemos.enter=false;lemos.climb=.001;lemos.dir=1;}}
      else{lemos.x+=dx/d*sp;lemos.y+=dy/d*sp;lemos.walk+=sp/32;lemos.moving=true;if(Math.abs(dx)>0.5)lemos.dir=dx>0?1:-1;}}
    for(const p of peds){
      if(p.pause>0){p.pause-=dt;p.moving=false;continue;}
      p.x+=p.dir*p.v*dt;p.walk+=p.v*dt/32;p.moving=true;
      if(R()<dt*0.07)p.pause=1.5+R()*3;
      const wk=p.near?NEAR_WALK:WALK;
      if(p.x<-30){p.x=STREET_W+20;p.y=wk[0]+4+R()*(wk[1]-wk[0]-4);}else if(p.x>STREET_W+30){p.x=-20;p.y=wk[0]+4+R()*(wk[1]-wk[0]-4);}
    }
    for(const b of birds){b.t+=dt*30;
      if(b.st==='g'){if(Math.random()<dt*.6)b.x+=b.dir*2;if(Math.random()<dt*.2)b.dir=-b.dir;
        const near=[lemos,...peds].some(p=>Math.abs(p.x-b.x)<34&&Math.abs(p.y-b.y)<18);if(near){b.st='f';b.vx=(Math.random()<.5?-1:1)*(70+Math.random()*50);b.vz=70;b.dir=Math.sign(b.vx);b.tx=Math.max(60,Math.min(STREET_W-60,b.x+b.vx*2.4));}}
      else{b.x+=b.vx*dt;b.z=Math.max(0,b.z+b.vz*dt);if(Math.abs(b.x-b.tx)<60)b.vz=-60;else if(b.z>60)b.vz=0;
        if(b.vz<0&&b.z<=0){b.st='g';b.z=0;b.y=WALK[0]+10+Math.random()*(WALK[1]-WALK[0]-20);}}}
    // trânsito: cada um segue o da frente na mesma faixa; fumacinha do escapamento atrás
    for(let l=0;l<LANES.length;l++){const dir=LANES[l].dir,ln=cars.filter(k=>k.lane===l).sort((a,b)=>dir>0?b.x-a.x:a.x-b.x);
      for(let i=0;i<ln.length;i++){const k=ln[i],lead=ln[i-1];let v=k.v0;
        if(lead){const gap=dir>0?lead.x-(k.x+W(k)):k.x-(lead.x+W(lead));if(gap<70)v=Math.min(v,lead.v*(gap<28?0.6:1));}
        k.v+=(v-k.v)*Math.min(1,dt*3);k.x+=dir*k.v*dt;
        k.puff+=dt;if(k.puff>.45){k.puff=0;puffs.push({x:dir>0?k.x+4:k.x+W(k)-4,y:LANES[l].y-10,vx:-dir*12,t:0});}
        if(dir>0&&k.x>STREET_W+60){const back=Math.min(...ln.map(o=>o.x));k.x=Math.min(-W(k)-60,back-W(k)-120)-R()*300;}
        if(dir<0&&k.x<-W(k)-60){const back=Math.max(...ln.map(o=>o.x+W(o)));k.x=Math.max(STREET_W+60,back+120)+R()*300;}}}
    for(const p of puffs){p.t+=dt;p.x+=p.vx*dt;p.y-=dt*5;}while(puffs.length&&puffs[0].t>1)puffs.shift();
  }

  // enquadramento Beat Cop: ~760 px de mundo na altura (fachadas até o topo, calçada e as faixas);
  // no retrato a rua inteira cabe na altura. A câmera segue o Lemos.
  const VIEWH=760;
  function view(cw,ch,rs){
    const s=Math.max(Math.min(ch/VIEWH,cw/760),ch/STREET_H);
    const vw=cw/s,vh=ch/s;
    camX+=(clamp(lemos.x,vw/2,STREET_W-vw/2)-camX)*0.12;camX=clamp(camX,vw/2,STREET_W-vw/2);
    let top;if(vh>=STREET_H)top=STREET_H-vh;else{const want=clamp(lemos.y-vh*0.6,0,STREET_H-vh);camY=camY==null?want:camY+(want-camY)*0.12;top=clamp(camY,0,STREET_H-vh);}
    return {s,left:camX-vw/2,top,rs};
  }
  const clamp=(v,a,b)=>a>b?(a+b)/2:v<a?a:v>b?b:v;

  function draw(ctx,cw,ch,rs,marker){
    const V=view(cw,ch,rs),{s,left}=V;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
    ctx.fillStyle='#8fa9c4';ctx.fillRect(0,0,cw,ch);ctx.imageSmoothingEnabled=false;
    const ox=Math.round(-left*s),oyr=Math.round(-V.top*s);
    ctx.setTransform(s,0,0,s,ox,oyr);
    ctx.drawImage(layer,0,0);
    // porta do DHPP acesa quando o Lemos entra, e as bandeiras tremulando
    if(doorT>0){ctx.fillStyle=`rgba(255,226,160,${.45*doorT})`;ctx.fillRect(DOOR.x-50,GY-76,100,68);}
    for(const f of DHPP.flags||[])flag(ctx,f.x,f.y,f.v);
    const ents=[],shadow=(x,y,rx,ry,a)=>{ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();};
    for(const p of PROPS){const im=art(PATH.prop(p.k));if(!im)continue;ents.push({y:p.y,d:()=>{const w=im.width*PROP_S,h=im.height*PROP_S;shadow(p.x+4,p.y,Math.max(4,w*.45),3,.22);ctx.drawImage(im,Math.round(p.x-w/2),Math.round(p.y-h),Math.round(w),Math.round(h));}});}
    for(const p of peds)ents.push({y:p.y,d:()=>person(ctx,p)});
    ents.push({y:lemos.y,d:()=>person(ctx,lemos)});
    for(const p of parked)ents.push({y:p.y,d:()=>car(ctx,p,p.x,p.y,1,p===viatura)});
    for(const k of cars){const L=LANES[k.lane];ents.push({y:L.y,d:()=>car(ctx,k,k.x,L.y,L.dir,false)});}
    for(const b of birds)ents.push({y:b.y,d:()=>bird(ctx,b)});
    ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.d();
    const fum=art(PATH.efeito('fumaca-escape'));
    for(const p of puffs){const u=p.t;if(fum){const f=Math.min(3,Math.floor(u*4));ctx.globalAlpha=1-u;ctx.drawImage(fum,f*12,0,12,8,p.x-9,p.y-6,18,12);ctx.globalAlpha=1;}
      else{ctx.fillStyle=`rgba(210,210,214,${.45*(1-u)})`;ctx.beginPath();ctx.ellipse(p.x,p.y,3+u*6,2+u*4,0,0,7);ctx.fill();}}
    if(marker){const b=Math.round(Math.sin(t*6)*2),X=DOOR.x,Y=GY-160+b;ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+9);ctx.lineTo(X-8,Y);ctx.lineTo(X,Y-9);ctx.lineTo(X+8,Y);ctx.fill();
      ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+7);ctx.lineTo(X-6,Y);ctx.lineTo(X,Y-7);ctx.lineTo(X+6,Y);ctx.fill();ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y-4,2,6);ctx.fillRect(X-1,Y+3,2,1.5);}
    // luz da manhã, como o clima de cor da planta
    ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='soft-light';
    const sun=ctx.createLinearGradient(0,0,cw,ch);sun.addColorStop(0,'rgba(255,214,150,.34)');sun.addColorStop(.6,'rgba(255,224,176,.08)');sun.addColorStop(1,'rgba(90,120,170,.18)');
    ctx.fillStyle=sun;ctx.fillRect(0,0,cw,ch);ctx.globalCompositeOperation='source-over';
    ctx.restore();
    lastView={...V,oy:oyr,ox,cw,ch};
  }
  let lastView=null;

  // bandeira da planta (Brasil e DHPP): pano coluna a coluna numa onda, com luz e sombra nas dobras
  const cloths={};
  function flag(ctx,X,Y,v){let cl=cloths[v];
    if(!cl)cl=cloths[v]=A.S2(17,12,(P)=>{if(v==='br'){P(0,0,17,12,'#2f7a3a');for(let k=0;k<5;k++)P(8-k*2,3+k-2,1+k*4,1,'#e8c63a');for(let k=0;k<4;k++)P(4+k*2,6+k,9-k*4,1,'#e8c63a');P(5,4,7,4,'#e8c63a');P(6,4,5,4,'#2f4f9a');P(6,6,5,1,'#e8ecef');}
      else{P(0,0,17,12,'#1e2a3a');P(0,0,17,1,'#3a4f6a');P(4,3,9,1,'#e8ecef');P(4,6,9,1,'#c9a24a');P(4,9,9,1,'#e8ecef');}});
    const S=2;for(let i=0;i<17;i++){const ph=t*8.6-i*0.5,dy=Math.round(Math.sin(ph)*2*(i/16));ctx.drawImage(cl,i,0,1,12,X+i*S,Y+dy,S,12*S);
      if(Math.cos(ph)<-0.3){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(X+i*S,Y+dy,S,12*S);}else if(Math.cos(ph)>0.7){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(X+i*S,Y+dy,S,12*S);}}}
  // carro oficial (rodas girando; a viatura parada com o giroflex alternando), ampliado sem suavizar, com sombra
  function car(ctx,k,x,y,dir,isViatura){
    const m=meta(k.id),im=art(PATH.veiculo(k.id));const w=m.w*CAR_S,h=m.h*CAR_S;
    ctx.fillStyle='rgba(0,0,0,.32)';ctx.beginPath();ctx.ellipse(x+w/2+4,y-3,w/2,7,0,0,7);ctx.fill();
    if(!im)return;
    const f=isViatura?2+Math.floor(t*2.5)%2:(k.v?Math.floor(t*10)%2:0);
    ctx.save();ctx.translate(Math.round(dir<0?x+w:x),Math.round(y-h));if(dir<0)ctx.scale(-1,1);
    ctx.drawImage(im,f*m.w,0,m.w,m.h,0,0,Math.round(w),Math.round(h));ctx.restore();
  }
  // pessoa: o boneco da planta, com sombra no pé e o quadro do passo, espelhado para a esquerda
  function person(ctx,p){
    const fr=p.moving?Math.floor(p.walk*3.2)%4:0,img=p.frames[fr],X=Math.round(p.x),Y=Math.round(p.y);
    ctx.fillStyle='rgba(0,0,0,.24)';ctx.beginPath();ctx.ellipse(X+5,Y-1,12,3.5,0,0,7);ctx.fill();
    if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);ctx.drawImage(img,-14,Y-45);ctx.restore();}else ctx.drawImage(img,X-14,Y-45);
  }
  function bird(ctx,b){
    const X=Math.round(b.x),Y=Math.round(b.y),z=Math.round(b.z),d=b.dir;
    ctx.globalAlpha=0.28*Math.max(0.2,1-b.z/90);ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(X,Y,5,1.6,0,0,7);ctx.fill();ctx.globalAlpha=1;
    const y=Y-z-6,peck=b.st==='g'&&(b.t%50)<8,fly=b.st!=='g',up=(Math.floor(b.t/4))%2,F=(x,yy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,yy,w,h);};
    if(fly){F(X-7,up?y-5:y+1,14,4,'#1e1611');F(X-6,up?y-4:y+2,12,2,'#a3a9b0');}
    F(X-5-(d>0?1:0),y-1,11,7,'#1e1611');F(X-4,y,9,5,'#8a9098');F(X-3,y,6,2,'#a3a9b0');F(d>0?X-5:X+3,y+1,3,2,'#5a6068');
    const hx=d>0?X+4:X-6,hy=peck?y+3:y-3;F(hx-1,hy-1,5,5,'#1e1611');F(hx,hy,3,3,'#4f5a62');F(hx,hy+2,3,1,'#5fa08a');F(d>0?hx+2:hx,hy,1,1,'#e8e2d0');F(d>0?hx+3:hx-1,hy+1,1,1,'#c97a3a');
  }

  /** toque na tela (px do canvas): no prédio do DHPP vai até a porta e entra; na calçada anda até lá */
  function tap(px,py){
    if(!lastView||lemos.climb)return;const {s,ox,oy}=lastView,wx=(px-ox)/s,wy=(py-oy)/s;
    if(wx>=DHPP.X&&wx<=DHPP.X+DHPP.w&&wy<GY+8){lemos.tx=DOOR.x;lemos.ty=DOOR.y;lemos.enter=true;return;}
    lemos.tx=clamp(wx,12,STREET_W-12);lemos.ty=clamp(wy,WALK[0],WALK[1]);lemos.enter=false;
  }
  /** posiciona Lemos: 'porta' (saindo do DHPP) ou 'carro' (chegando na viatura) */
  function place(where){
    lemos.tx=null;lemos.enter=false;lemos.moving=false;lemos.climb=0;doorT=0;
    if(where==='porta'){lemos.x=DOOR.x;lemos.y=DOOR.y+10;lemos.dir=1;}
    else{lemos.x=viatura.x+W(viatura)/2;lemos.y=WALK[1];lemos.dir=1;}
    camX=lemos.x;camY=null;
  }
  return {update,draw,tap,place,lemos,door:DOOR,ready,get view(){return lastView;},get cars(){return cars;},parked,peds,birds,get t(){return t;},zoom:()=>getZoom?getZoom():1};
}
