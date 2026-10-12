/* Quem mora e trabalha nos prédios da rua (docs/LIVING_WORLD_SYSTEM.md): gente nas janelas (olhando para fora, ao telefone, tomando
   café, vendo TV, regando planta, acenando para o Lemos), nas varandas dos apartamentos, dentro das lojas (garçom, caixa, barbeiro,
   clientes) e nos prédios de baixo, cortados, onde cada um circula pelos cômodos (sofá, cozinha, cama, mesa). Cada pessoa tem um
   estado simples com duração irregular e escolhe o próximo por peso, sem repetir o que acabou de fazer (choose, de life.js).
   Tudo é desenhado com os mesmos bonecos da planta (personFrames) ou com bustos em código, nas cores de cada um. */
import {choose,jitter} from '../world/life';

const POSES=['phone','drink','cross','stretch','read','chin','watch','scratch'];
const frameOf=p=>{if(p.moving)return Math.floor(p.walk*3.2)%4;const k=p.pose?POSES.indexOf(p.pose):-1;return k<0?(p.sit?4:0):5+k*2+(p.sit?1:0);};

export function createDwellers({buildings,rooms,looks,personFrames,R,RM,lemos,onSound}){
  const look=()=>looks[Math.floor(R()*looks.length)];
  const frames=new Map();const fr=l=>{let f=frames.get(l);if(!f){f=personFrames(l);frames.set(l,f);}return f;};
  const memo=()=>({last:{},prev:null});

  /* ---------- janelas: bustos em código, atrás do vidro ---------- */
  const WIN_OPTS=[{id:'look',w:3.2},{id:'phone',w:1.2,cool:30},{id:'drink',w:1.5,cool:25},{id:'tv',w:1.7,cool:45},{id:'plant',w:c=>c.w.flower?2.4:0,cool:40},{id:'curtain',w:.7,cool:40},{id:'away',w:1.3,cool:20}];
  const DHPP_OPTS=[{id:'type',w:3},{id:'look',w:1.4},{id:'phone',w:1.2,cool:25},{id:'drink',w:1.4,cool:30},{id:'away',w:1,cool:25}];
  const wins=[];
  for(const b of buildings)for(const w of b.wins||[]){if(w.y<0)continue;const dh=b.k==='dhpp';if(R()>(dh?.9:.55))continue;
    wins.push({w,b,dh,look:look(),act:'look',t:R()*8,mem:memo(),face:0,ph:R()*6.28,wave:0,waveCD:0,turn:0,hair:R()<.2?'grey':null});}
  const bustHair=(g,l,cx,hy)=>{const c=l.hair;g.fillStyle=c;
    switch(l.style){case 'long':g.fillRect(cx-4,hy-1,8,3);g.fillRect(cx-5,hy,2,9);g.fillRect(cx+3,hy,2,9);break;
      case 'cap':g.fillRect(cx-5,hy-1,10,3);g.fillRect(cx+1,hy+2,5,1);break;
      case 'bun':g.fillRect(cx-4,hy-1,8,3);g.fillRect(cx-1,hy-4,3,3);break;
      case 'curly':g.fillRect(cx-5,hy-2,10,4);g.fillRect(cx-5,hy,2,3);g.fillRect(cx+3,hy,2,3);break;
      case 'grey':g.fillStyle='#bcbcbc';g.fillRect(cx-4,hy-1,8,3);break;
      default:g.fillRect(cx-4,hy-1,8,3);}};
  function bust(g,d,t){
    const w=d.w,gx=w.x+2,gy=w.y+2,gw=w.w-4,gh=w.h-4,cx=Math.round(gx+gw/2),bot=gy+gh,l=d.look,a=d.act;
    if(a==='away'){return;}
    if(a==='curtain'){g.fillStyle='rgba(222,206,178,.85)';g.fillRect(gx,gy,5+Math.round(Math.sin(t*.7+d.ph)),gh);g.fillRect(gx+gw-6,gy,6,gh);return;}
    const breath=(Math.sin(t*1.6+d.ph)>.88)?1:0,typing=a==='type',bob=typing?Math.round(Math.sin(t*9+d.ph)*.6):breath,by=bot-7-bob;
    g.save();g.globalAlpha=.94;
    g.fillStyle=l.top;g.fillRect(cx-7,by,14,7+bob);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(cx-7,by,14,1);
    g.fillStyle=l.skin;g.fillRect(cx-1,by-2,2,2);
    const hy=by-10+(typing?1:0);g.fillRect(cx-4,hy,8,8);
    const back=a==='tv'||(a==='plant'&&d.face===0&&false);
    if(back){g.fillStyle=l.hair;g.fillRect(cx-4,hy,8,5);bustHair(g,l,cx,hy);}
    else{bustHair(g,l,cx,hy);const e=d.face,blink=Math.sin(t*.9+d.ph*3)>.97;g.fillStyle='#1e1611';if(!blink){g.fillRect(cx-2+e,hy+4,1,1);g.fillRect(cx+1+e,hy+4,1,1);}else{g.fillRect(cx-2+e,hy+4,2,1);g.fillRect(cx+1+e,hy+4,2,1);}
      g.fillStyle='rgba(120,50,40,.7)';g.fillRect(cx-1+e,hy+6,2,1);}
    if(a==='phone'){g.fillStyle=l.top;g.fillRect(cx+5,hy+5,2,6);g.fillStyle=l.skin;g.fillRect(cx+4,hy+3,3,3);g.fillStyle='#222';g.fillRect(cx+6,hy+2,1,4);}
    else if(a==='drink'){const up=Math.sin(t*.9+d.ph)>.4?-3:0;g.fillStyle=l.top;g.fillRect(cx+5,by+1,2,5);g.fillStyle='#e8e2d4';g.fillRect(cx+3,hy+8+up,3,3);g.fillStyle=l.skin;g.fillRect(cx+5,hy+8+up,2,2);
      if(!RM){g.fillStyle='rgba(255,255,255,.4)';g.fillRect(cx+4+Math.round(Math.sin(t*3)),hy+6+up-Math.floor((t*3)%3),1,1);}}
    else if(a==='plant'){const tilt=Math.round(Math.sin(t*1.2)*1.2);g.fillStyle=l.top;g.fillRect(cx+5,by+2,5,2);g.fillStyle='#5a8aa8';g.fillRect(cx+9,by+tilt,4,3);if(!RM&&tilt>0){g.fillStyle='rgba(150,190,230,.7)';g.fillRect(cx+13,by+3+Math.floor((t*6)%5),1,2);}}
    else if(a==='wave'){const o=Math.round(Math.sin(t*9)*2);g.fillStyle=l.top;g.fillRect(cx+6+o,by-8,2,9);g.fillStyle=l.skin;g.fillRect(cx+6+o,by-10,3,3);}
    else if(typing){g.fillStyle=l.skin;g.fillRect(cx-6,bot-3,12,2);if(!RM&&Math.sin(t*14+d.ph)>0){g.fillStyle='#5a8ac8';g.fillRect(cx-5,bot-2,3,1);}}
    g.restore();
    if(a==='tv'&&!RM){g.fillStyle=`rgba(120,170,255,${.08+.06*Math.sin(t*10+d.ph)*Math.sin(t*3.3)})`;g.fillRect(gx,gy,gw,gh);}
    g.fillStyle='rgba(220,236,248,.4)';g.fillRect(gx+1,gy+1,7,3);g.fillStyle='#f2efe6';g.fillRect(w.x+Math.floor(w.w/2),w.y+2,1,w.h-4);
  }
  function updWin(d,dt,t){
    d.t-=dt;if(d.waveCD>0)d.waveCD-=dt;
    if(d.act==='wave'){d.wave-=dt;if(d.wave<=0){d.act='look';d.t=jitter(R,6);}return;}
    if(d.t<=0){const o=choose(R,d.dh?DHPP_OPTS:WIN_OPTS,d,d.mem,t);d.act=o?o.id:'look';d.t=jitter(R,d.act==='away'?16:10,.55);if(d.act==='away'&&d.mem.last.away===t)onSound&&0;}
    const cx=d.w.x+d.w.w/2,dx=lemos.x-cx;
    if(d.act==='look'||d.act==='phone'){d.face=Math.abs(dx)<260?Math.sign(dx)*(Math.abs(dx)>18?1:0):(Math.sin(t*.3+d.ph)>.6?1:Math.sin(t*.3+d.ph)<-.6?-1:0);}
    else d.face=0;
    if(d.act==='look'&&d.waveCD<=0&&Math.abs(dx)<150&&lemos.moving===false&&R()<dt*.12){d.act='wave';d.wave=2.2;d.waveCD=50;}
  }

  /* ---------- varandas: gente de corpo inteiro atrás do guarda-corpo ---------- */
  const BAL_OPTS=[{id:'drink',w:2,cool:20},{id:'phone',w:1.5,cool:30},{id:'read',w:1.4,cool:30},{id:'watch',w:2.2},{id:'stretch',w:.8,cool:40},{id:'chin',w:.8},{id:'none',w:1},{id:'away',w:1.4,cool:25}];
  const bals=[];
  for(const b of buildings)for(const bal of b.balconies||[]){const l=look();bals.push({bal,look:l,frames:fr(l),act:'none',pose:null,t:R()*8,mem:memo(),dir:R()<.5?-1:1,off:(R()-.5)*14,shown:R()<.65,ph:R()*6.28});}
  function updBal(p,dt,t){p.t-=dt;if(p.t>0)return;const o=choose(R,BAL_OPTS,p,p.mem,t);const id=o?o.id:'none';
    if(id==='away'){p.shown=false;p.t=jitter(R,16,.5);return;}
    p.shown=true;p.pose=id==='none'?null:id;p.t=jitter(R,11,.5);if(R()<.3)p.dir=-p.dir;p.off=Math.max(-12,Math.min(12,p.off+(R()-.5)*8));}
  function rail(g,bal){g.fillStyle='rgba(28,29,32,.92)';const y=bal.slab-18;g.fillRect(bal.x,y,bal.w,1);g.fillRect(bal.x,y+1,bal.w,1);for(let k=1;k<bal.w;k+=3)g.fillRect(bal.x+k,y+2,1,16);g.fillRect(bal.x,y-1,2,19);g.fillRect(bal.x+bal.w-2,y-1,2,19);g.fillStyle='rgba(255,255,255,.16)';g.fillRect(bal.x,y,bal.w,1);}

  /* ---------- lojas: quem trabalha e quem está lá dentro, atrás do vidro ---------- */
  const SHOPFOLK={diner:[{rx:-.3,k:'walk',r:.22},{rx:.02,k:'sit'},{rx:.28,k:'sit'}],grocery:[{rx:-.25,k:'stand'},{rx:.18,k:'walk',r:.2}],pawn:[{rx:-.1,k:'stand'},{rx:.28,k:'stand'}],
    laundry:[{rx:-.22,k:'stand'},{rx:.2,k:'stand'}],barber:[{rx:-.2,k:'stand'},{rx:.12,k:'sit'}]};
  const SHOP_POSES=['watch','read','drink','chin','stretch','phone',null];
  const shopfolk=[];
  for(const b of buildings)for(const pn of b.panes||[]){const spec=SHOPFOLK[pn.shop];if(!spec||pn.y==null)continue;
    for(const s of spec){const l=look();shopfolk.push({pn,s,look:l,frames:fr(l),x:pn.x+s.rx*pn.w,x0:pn.x+s.rx*pn.w,y:pn.y+pn.h-3,dir:R()<.5?-1:1,walk:R()*6,moving:false,pose:null,sit:s.k==='sit',t:R()*6,mem:memo(),hold:0});}}
  function updShop(p,dt,t){
    if(p.s.k==='walk'){
      if(p.hold>0){p.hold-=dt;p.moving=false;if(p.hold<=0)p.pose=null;return;}
      const tx=p.tx??p.x0,dx=tx-p.x,st=14*dt;p.moving=true;if(Math.abs(dx)<=st){p.x=tx;p.moving=false;p.hold=jitter(R,4);p.pose=SHOP_POSES[Math.floor(R()*SHOP_POSES.length)];p.tx=p.x0+(R()*2-1)*p.pn.w*p.s.r;}else{p.x+=Math.sign(dx)*st;p.dir=Math.sign(dx);p.walk+=st/32;}return;}
    p.t-=dt;if(p.t<=0){p.pose=SHOP_POSES[Math.floor(R()*SHOP_POSES.length)];p.t=jitter(R,7,.5);if(R()<.25)p.dir=-p.dir;}
    if(Math.abs(lemos.x-p.x)<70&&R()<dt*.3)p.dir=lemos.x>p.x?1:-1;
  }

  /* ---------- prédios de baixo: cada um circula pela sua casa ---------- */
  const people=[];
  const COUNT={living:2,kitchen:1,bedroom:1,office:1,laundry:2,cafe:2};
  for(const rm of rooms){const n=Math.min(COUNT[rm.type]||1,rm.spots.length);if(R()<.18)continue;
    for(let i=0;i<n;i++){const sp=rm.spots[Math.floor(R()*rm.spots.length)],l=look();people.push({rm,look:l,frames:fr(l),x:sp.x+(R()-.5)*6,y:sp.y,dir:R()<.5?-1:1,walk:R()*6,moving:false,pose:null,sit:false,lie:false,st:'idle',t:R()*6,mem:memo(),spot:sp,tx:0,ty:0,z:0});}}
  const doing=(p,sp)=>{p.sit=sp.k==='sit';p.lie=sp.k==='bed';p.pose=sp.k==='cook'?'stretch':p.lie?null:['watch','read','drink','phone','chin',null][Math.floor(R()*6)];};
  function updPerson(p,dt,t){
    if(p.st==='walk'){const dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),st=17*dt;p.moving=true;
      if(d<=st){p.x=p.tx;p.y=p.ty;p.moving=false;p.st='idle';p.t=jitter(R,p.spot.k==='bed'?28:12,.5);doing(p,p.spot);}else{p.x+=dx/d*st;p.y+=dy/d*st;p.walk+=st/32;if(Math.abs(dx)>.5)p.dir=dx>0?1:-1;}return;}
    p.t-=dt;if(p.lie&&!RM)p.z+=dt;
    if(p.t<=0){const opts=p.rm.spots.map((s,i)=>({id:i,w:s.k==='bed'?.8:1.2,cool:25}));const o=choose(R,opts,p,p.mem,t);const sp=o?p.rm.spots[o.id]:p.spot;
      p.spot=sp;p.tx=sp.x+(R()-.5)*6;p.ty=sp.y;p.sit=false;p.lie=false;p.pose=null;p.st='walk';p.z=0;}
  }

  function update(dt,t){for(const d of wins)updWin(d,dt,t);for(const p of bals)updBal(p,dt,t);for(const p of shopfolk)updShop(p,dt,t);for(const p of people)updPerson(p,dt,t);}

  /* ---------- desenho (street.js chama depois da camada fixa e antes das entidades da rua) ---------- */
  const sprite=(g,p)=>{const img=p.frames[frameOf(p)],X=Math.round(p.x),Y=Math.round(p.y);
    if(p.dir<0){g.save();g.translate(X,0);g.scale(-1,1);g.drawImage(img,-14,Y-45);g.restore();}else g.drawImage(img,X-14,Y-45);};
  function draw(g,x0,x1,t,q,y0,y1){
    for(const d of wins){const w=d.w;if(w.x+w.w<x0||w.x>x1||w.y+w.h<y0||w.y>y1)continue;bust(g,d,t);}
    for(const p of bals){const b=p.bal;if(b.x+b.w<x0||b.x>x1||b.slab<y0||b.slab-60>y1)continue;
      if(p.shown){const X=b.x+b.w/2+p.off,Y=b.slab-1;g.fillStyle='rgba(16,12,20,.28)';g.beginPath();g.ellipse(X+2,Y,8,2.2,0,0,7);g.fill();
        p.x=X;p.y=Y;p.moving=false;p.sit=false;sprite(g,p);}
      rail(g,b);}
    for(const p of shopfolk){const pn=p.pn;if(pn.x+pn.w/2<x0||pn.x-pn.w/2>x1||pn.y+pn.h<y0||pn.y>y1)continue;
      g.save();g.globalAlpha=.93;g.fillStyle='rgba(16,12,20,.3)';g.beginPath();g.ellipse(p.x+2,p.y,9,2.4,0,0,7);g.fill();sprite(g,p);g.restore();}
    for(const pn of paneSet(x0,x1)){g.fillStyle='rgba(120,160,190,.1)';g.fillRect(pn.x-pn.w/2,pn.y,pn.w,pn.h);g.fillStyle='rgba(20,24,30,.22)';g.fillRect(pn.x-pn.w/2,pn.y,pn.w,12);g.fillStyle='rgba(255,255,255,.06)';for(let j=0;j<pn.h;j+=3)g.fillRect(pn.x-pn.w/2+pn.w*.55-j*.6,pn.y+j,9,1);}
    for(const p of people){if(p.x<x0-30||p.x>x1+30||p.y<y0||p.y-50>y1)continue;
      g.fillStyle='rgba(16,12,20,.34)';g.beginPath();g.ellipse(p.x+3,p.y,9,2.6,0,0,7);g.fill();
      if(p.lie){const X=Math.round(p.x),Y=Math.round(p.y);g.fillStyle=p.look.top;g.fillRect(X-4,Y-14,26,7);g.fillStyle=p.look.skin;g.fillRect(X-9,Y-15,8,8);g.fillStyle=p.look.hair;g.fillRect(X-9,Y-16,8,3);
        if(!RM)for(let k=0;k<3;k++){const u=((p.z*.5+k/3)%1);g.fillStyle=`rgba(240,240,255,${.8*(1-u)})`;g.fillRect(X+6+Math.round(u*8)+k*2,Y-22-Math.round(u*14),2,2);}}
      else sprite(g,p);}
  }
  const panes=[];for(const b of buildings)for(const pn of b.panes||[])if(SHOPFOLK[pn.shop]&&pn.y!=null)panes.push(pn);
  function paneSet(x0,x1){return panes.filter(pn=>pn.x+pn.w/2>=x0&&pn.x-pn.w/2<=x1);}
  return {update,draw,counts:()=>({janelas:wins.length,varandas:bals.length,lojas:shopfolk.length,predios:people.length})};
}
