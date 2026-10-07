/* Base do DHPP: cena 2D navegável do Caso 01, na mesma técnica da Varredura das Acácias
   (pixel art procedural, câmera oblíqua, sem arte externa). Lemos anda, equipe fala, aparelho leva ao resto do caso. */
(() => {
'use strict';
const T=32,TH=22,K=TH/T,RISE=16,CAPH=8,W=34,H=26,N=W*H;
const $=s=>document.querySelector(s);
const cv=$('#cv'),ctx=cv.getContext('2d');
const lc=document.createElement('canvas'),lctx=lc.getContext('2d');
const LS=3;
let dpr=1;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const idx=(x,y)=>y*W+x;
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
let floor,room,occ,hot,blk,objs;
function buildMap(){
  floor=new Array(N).fill(F.GRASS);room=new Array(N).fill('fora');occ=new Array(N).fill(-1);hot=new Array(N).fill(null);blk=new Array(N).fill(false);objs=[];
  const set=(x0,y0,x1,y1,f,r)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);if(f!=null)floor[i]=f;if(r!==undefined)room[i]=r;}};
  const block=(x0,y0,x1,y1)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)blk[idx(x,y)]=true;};
  set(0,19,W-1,20,F.CONC,'fora');set(0,21,W-1,22,F.WALK,'fora');set(0,23,W-1,25,F.STREET,'fora');block(0,23,W-1,25);
  set(0,0,W-1,18,F.GRASS,'fora');block(0,0,W-1,0);block(0,1,0,18);block(W-1,1,W-1,18);
  set(1,1,32,18,F.WALL,'wall');
  set(2,2,9,8,F.FLOOR,'sonia');set(11,2,21,8,F.FLOOR,'equipe');set(23,2,31,8,F.FLOOR,'pericia');
  set(2,10,9,17,F.FLOOR,'interro');set(11,10,21,17,F.FLOOR,'hall');set(23,10,31,17,F.FLOOR,'arquivo');
  // as linhas coladas à parede sul ficam atrás dela: não se anda ali
  block(2,8,14,8);block(17,8,31,8);block(2,17,14,17);block(17,17,31,17);
  for(const [x,y,r] of [[10,5,'equipe'],[22,5,'equipe'],[10,14,'hall'],[22,14,'hall']]){floor[idx(x,y)]=F.DOOR;room[idx(x,y)]=r;}
  for(const x of [15,16]){set(x,9,x,9,F.FLOOR,'hall');set(x,18,x,18,F.DOOR,'hall');}
  for(const [x,y] of [[4,1],[5,1],[13,1],[19,1],[25,1],[29,1],[4,18],[5,18],[9,18],[12,18],[19,18],[22,18],[26,18],[29,18]])floor[idx(x,y)]=F.WIN;
  const add=(t,x,y,w,h,o)=>{const k=objs.length;objs.push(Object.assign({t,x,y,w,h},o||{}));for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){occ[idx(xx,yy)]=k;if(o&&o.hot)hot[idx(xx,yy)]=o.hot;}return k;};
  // sala da delegada
  add('deskboss',4,4,3,1,{hot:'sonia_mesa'});add('cadeira',4,6,1,1);add('cadeira',6,6,1,1);add('shelf',7,2,2,1,{v:'books'});add('filing',2,2,1,1);add('plant',9,6,1,1);add('plant',2,6,1,1);
  // sala da equipe
  add('desk',12,4,2,1,{v:'renata'});add('desk',16,4,2,1,{v:'denise'});add('desk',19,4,2,1,{v:'lemos',hot:'mesa_lemos'});
  add('board',14,6,3,1,{hot:'quadro'});add('coffee',20,6,1,1);add('xerox',12,6,1,1);add('filing',11,2,1,1);add('plant',21,2,1,1);add('plant',18,7,1,1);
  // perícia
  add('bench',24,4,4,1);add('lightbox',28,6,3,1,{hot:'fotos'});add('locker',30,2,1,1);add('locker',31,2,1,1);add('bagtable',24,6,2,1);add('plant',23,7,1,1);
  // recepção
  add('counter',12,12,5,1);add('sofa',18,15,3,1);add('cooler',21,11,1,1);add('plant',11,16,1,1);add('plant',21,16,1,1);add('plant',13,15,1,1);
  // sala de depoimentos
  add('itable',4,12,3,2,{hot:'interro'});add('cadeira',3,13,1,1);add('cadeira',7,13,1,1);add('filing',2,15,1,1);
  // arquivo
  add('shelf',24,11,3,1,{v:'arq'});add('shelf',28,11,3,1,{v:'arq'});add('shelf',24,14,3,1,{v:'arq'});add('shelf',28,14,3,1,{v:'arq',hot:'arquivo'});add('boxes',23,16,1,1);add('boxes',30,16,1,1);add('boxes',31,16,1,1);
  // pátio
  add('car',4,19,3,2);add('tree',1,19,1,1);add('tree',31,19,1,1);add('tree',9,20,1,1);add('flag',12,19,1,1,{v:'br'});add('flag',19,19,1,1,{v:'dh'});add('tree',24,20,1,1);
  for(let x=0;x<W;x+=3)if(x>1&&x<32&&x%9!==0)add('tree',x,0,1,1,{far:true});
}
function passable(i){const f=floor[i];if(f===F.WALL||f===F.WIN)return false;if(blk[i]||occ[i]>=0)return false;return true;}

/* ---------- Pathing ---------- */
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
function outlined(c,col){
  const w=c.width,h=c.height,o=document.createElement('canvas');o.width=w+2;o.height=h+2;
  const src=c.getContext('2d').getImageData(0,0,w,h).data,g=o.getContext('2d'),out=g.createImageData(w+2,h+2),d=out.data;
  const oc=hex(col||'#1e1611');
  const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:src[(y*w+x)*4+3];
  for(let y=0;y<h+2;y++)for(let x=0;x<w+2;x++){
    const sx=x-1,sy=y-1,k=(y*(w+2)+x)*4,a=A(sx,sy);
    if(a>0){const s=(sy*w+sx)*4;d[k]=src[s];d[k+1]=src[s+1];d[k+2]=src[s+2];d[k+3]=a;}
    else if(A(sx-1,sy)>40||A(sx+1,sy)>40||A(sx,sy-1)>40||A(sx,sy+1)>40){d[k]=oc[0];d[k+1]=oc[1];d[k+2]=oc[2];d[k+3]=235;}
  }
  g.putImageData(out,0,0);return o;
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
// caixa vista de cima e de frente: tampo (d) e frente (e)
function BX(P,x,y,w,d,e,top,front){P(x,y,w,d,top);P(x,y,w,1,lt(top,.25));P(x,y+d,w,e,front);P(x,y+d,w,1,lt(front,.3));P(x,y+d+e-2,w,2,dk(front,.3));P(x,y+d,1,e,lt(front,.12));P(x+w-1,y+d,1,e,dk(front,.22));}
function txt(g,s,x,y,size,col,sp,weight){g.font=`${weight||700} ${size}px Rajdhani,"Arial Narrow",sans-serif`;g.fillStyle=col;g.textBaseline='alphabetic';let X=x;for(const ch of s){g.fillText(ch,X,y);X+=g.measureText(ch).width+(sp||0);}return X-x;}
function txtW(g,s,size,sp,weight){g.font=`${weight||700} ${size}px Rajdhani,"Arial Narrow",sans-serif`;let w=0;for(const ch of s)w+=g.measureText(ch).width+(sp||0);return w-(sp||0);}

/* ---------- Arte: móveis (pixel art, estilo da casa) ---------- */
// cada fábrica devolve [largura px, profundidade do tampo, altura da frente, desenho]
const FACT={
  desk(o){const w=o.w*T,v=o.v;return [w,22,14,(P,E,g)=>{
    BX(P,0,0,w,22,14,'#a77b50','#6e4a2e');P(w-20,24,15,10,'#583a23');P(w-17,28,9,1,'#c9a24a');P(3,24,16,10,'#583a23');P(6,28,9,1,'#c9a24a');
    P(5,1,14,11,'#d9d2bd');P(7,3,10,8,'#16201c');P(8,4,8,2,'#4f9473');P(8,7,5,1,'#4f9473');P(10,12,6,2,'#cfc7b0');
    P(4,15,15,4,'#cfc8b4');P(5,16,13,1,'#9a9484');
    if(v==='lemos'){P(w-27,4,17,12,'#c9a24a');P(w-26,5,15,1,'#e6c673');P(w-24,8,11,1,'#6b5320');P(w-24,11,8,1,'#6b5320');P(w-8,10,6,7,'#f3efe4');P(w-7,11,4,1,'#6a4a30');}
    else{P(w-26,5,11,12,'#f1ece0');P(w-24,7,7,1,'#999');P(w-24,10,6,1,'#999');P(w-12,8,8,6,'#2d2d30');P(w-11,9,6,1,'#777');}
    if(v==='denise'){P(24,6,8,10,'#e9e2cf');P(25,8,6,1,'#777');}
    if(v==='renata'){P(24,4,10,12,'#264653');P(25,5,8,1,'#7fb2c9');}
  }];},
  deskboss(o){const w=o.w*T;return [w,22,16,(P,E,g)=>{
    BX(P,0,0,w,22,16,'#7a5232','#563721');P(4,25,w-8,1,'#3e2716');P(w/2-3,27,6,2,'#c9a24a');
    P(26,3,40,16,'#2d3b33');P(27,4,38,1,'#43594a');P(30,6,16,10,'#f1ece0');P(48,7,12,8,'#e9e2cf');
    P(8,2,7,5,'#2a2a2a');P(10,0,3,3,'#e8d9a0');P(11,7,1,8,'#2a2a2a');
    P(w-22,6,12,8,'#2d2d30');P(w-21,7,10,1,'#777');
    P(w/2-12,19,24,4,'#c9a24a');P(w/2-10,20,20,1,'#f1dd9a');
  }];},
  cadeira(){return [32,12,12,(P,E,g)=>{P(6,1,20,11,'#434a52');P(6,1,20,1,'#6a727b');P(7,12,18,9,'#2c3238');P(7,12,18,1,'#4b535b');P(10,21,2,3,'#1c1f22');P(20,21,2,3,'#1c1f22');}];},
  shelf(o){const w=o.w*T,arq=o.v==='arq';return [w,9,arq?44:40,(P,E,g)=>{
    BX(P,0,0,w,9,arq?44:40,'#8a7a62',arq?'#8c8e8a':'#9c8660');
    const rows=arq?4:3,rh=Math.floor((arq?42:38)/rows);
    for(let r=0;r<rows;r++){const y0=11+r*rh;P(2,y0,w-4,rh-1,'#403a30');P(2,y0+rh-2,w-4,2,arq?'#6b6e6a':'#6a5638');
      let x=3;const rnd=mulberry32(r*31+o.x*7+o.y*13+w);
      while(x<w-5){const bw=3+Math.floor(rnd()*5),bh=rh-5-Math.floor(rnd()*(arq?3:6));
        const col=arq?['#b28a58','#a37b49','#c4a06c','#8c9ba8','#b28a58','#d7d1c0'][Math.floor(rnd()*6)]:['#b5583c','#3b6aa8','#6b8a4a','#c9a24a','#7a4e8a','#d9d4c7','#2f5a4a'][Math.floor(rnd()*7)];
        P(x,y0+rh-2-bh,bw,bh,col);P(x,y0+rh-2-bh,1,bh,lt(col,.22));P(x+bw-1,y0+rh-2-bh,1,bh,dk(col,.25));if(arq&&bh>9&&bw>5)P(x+1,y0+rh-2-bh+3,bw-2,3,'#f1ece0');x+=bw+1;}}
  }];},
  filing(){return [T,14,26,(P,E,g)=>{BX(P,3,0,26,14,26,'#8a9298','#a3acb2');for(let k=0;k<3;k++){P(5,15+k*8,22,7,'#7d868c');P(5,15+k*8,22,1,'#bcc5ca');P(13,18+k*8,6,2,'#2f3438');P(7,16+k*8,4,2,'#f1ece0');}}];},
  plant(o){return [T,8,34,(P,E,g)=>{const rnd=mulberry32(o.x*17+o.y*5+3);P(10,24,12,10,'#8a4a2e');P(10,24,12,1,'#b0683f');P(10,33,12,1,'#5a2e1a');bush(P,E,16,14,11,rnd);}];},
  coffee(){return [T,14,28,(P,E,g)=>{BX(P,2,6,28,14,16,'#c9ccce','#8d9296');P(8,0,16,14,'#2c2f33');P(9,1,14,2,'#4a4f55');P(13,9,6,4,'#111');P(12,14,3,6,'#e9e4d0');P(16,16,7,4,'#e8e8e4');P(22,3,3,2,'#c0392b');}];},
  xerox(){return [T,14,22,(P,E,g)=>{BX(P,2,2,28,14,18,'#d3cfc4','#a39f94');P(5,4,22,6,'#8ea2ac');P(6,5,20,1,'#c3d4dc');P(5,12,12,1,'#f1ece0');P(20,10,6,3,'#2f3438');P(23,12,2,1,'#7fe0a0');P(6,18,20,4,'#8a867c');}];},
  board(o){const w=o.w*T;return [w,6,44,(P,E,g)=>{
    P(3,36,3,10,'#5a4630');P(w-6,36,3,10,'#5a4630');BX(P,0,0,w,6,38,'#6b4a2e','#6b4a2e');
    P(3,8,w-6,32,'#b0814f');for(let k=0;k<40;k++)P(4+Math.floor(hash(k,1,o.x)*(w-8)),9+Math.floor(hash(k,2,o.x)*30),1,1,'#8f6638');
    const ph=[[8,12,'#6f8aa0'],[26,10,'#a0856f'],[44,13,'#7a8f6e'],[62,11,'#9a7a8a'],[76,14,'#8a8f96']];
    ph.forEach(([x,y,c],k)=>{P(x,y,15,17,'#f1ece0');P(x+1,y+1,13,11,c);P(x+3,y+13,9,1,'#666');if(k<FOUND.length)P(x+6,y-2,3,3,'#d6382c');});
    g.strokeStyle='#c0392b';g.lineWidth=1;g.beginPath();g.moveTo(15,14);g.lineTo(33,13);g.lineTo(51,16);g.lineTo(69,14);g.lineTo(83,17);g.stroke();
    P(30,28,18,8,'#f6efc9');P(32,30,14,1,'#777');P(32,33,10,1,'#777');
  }];},
  bench(o){const w=o.w*T;return [w,22,14,(P,E,g)=>{
    BX(P,0,0,w,22,14,'#b5bec3','#56626a');for(let x=8;x<w-8;x+=26)P(x,24,22,10,'#48535a');
    P(12,2,10,12,'#2a2d30');P(15,0,4,5,'#3a3e42');P(16,5,2,6,'#8ea2ac');P(10,13,14,3,'#1c1e20');
    P(44,5,5,9,'#cfe6ee');P(45,6,3,3,'#8fbfd2');P(52,8,5,6,'#cfe6ee');P(70,4,16,12,'#e9e4d0');P(72,6,12,1,'#999');P(94,6,9,9,'#2f3a44');
  }];},
  lightbox(o){const w=o.w*T;return [w,22,14,(P,E,g)=>{
    BX(P,0,0,w,22,14,'#b5bec3','#56626a');P(7,2,w-14,17,'#3d4850');P(9,3,w-18,15,'#eaf4ff');P(9,3,w-18,1,'#ffffff');
    [[14,6,'#6f8aa0'],[34,5,'#a0856f'],[54,7,'#7a8f6e']].forEach(([x,y,c])=>{if(x<w-24){P(x,y,16,10,'#f1ece0');P(x+1,y+1,14,8,c);}});
  }];},
  bagtable(){return [64,22,12,(P,E,g)=>{BX(P,0,0,64,22,12,'#aab3b8','#56626a');P(6,4,16,12,'#e9e4d0');P(8,6,12,1,'#999');P(28,5,12,10,'#e9e4d0');P(46,6,10,9,'#c4a06c');P(47,7,8,1,'#7a5a30');}];},
  locker(){return [T,8,42,(P,E,g)=>{BX(P,2,0,28,8,42,'#6f7a80','#8e9aa1');P(14,10,1,38,'#4c5459');for(let k=0;k<4;k++){P(5,14+k*3,6,1,'#4c5459');P(18,14+k*3,6,1,'#4c5459');}P(11,30,2,4,'#c9a24a');P(17,30,2,4,'#c9a24a');}];},
  counter(o){const w=o.w*T;return [w,22,16,(P,E,g)=>{
    BX(P,0,0,w,22,16,'#8a6040','#5a3c24');P(4,25,w-8,10,'#3f2a1a');P(w/2-22,26,44,10,'#1c1d20');P(w/2-22,26,44,1,'#555');
    g.save();txt(g,'DHPP',w/2-14,34,9,'#e8ecef',2.2);g.restore();
    P(10,3,12,10,'#d9d2bd');P(11,4,10,6,'#16201c');P(12,5,8,1,'#4f9473');P(w-32,4,16,12,'#f1ece0');P(w-30,6,12,1,'#999');P(w-30,9,9,1,'#999');P(w-14,6,9,7,'#2d2d30');P(46,8,8,6,'#c9a24a');
  }];},
  sofa(o){const w=o.w*T;return [w,16,10,(P,E,g)=>{
    P(0,0,w,7,'#33414f');P(0,0,w,1,'#52657a');P(0,6,w,1,'#232d38');P(1,7,w-2,9,'#485b72');P(1,7,w-2,1,'#6a82a0');for(const x of [w/3|0,(w*2/3)|0])P(x,8,1,8,'#2f3d4f');
    P(0,7,5,12,'#33414f');P(w-5,7,5,12,'#33414f');P(0,16,w,10,'#2b3644');P(0,16,w,1,'#4a5b70');P(2,26,3,2,'#14181d');P(w-5,26,3,2,'#14181d');
  }];},
  cooler(){return [T,10,30,(P,E,g)=>{P(9,0,14,12,'#9fd3e8');P(9,0,14,2,'#cfeaf6');P(10,3,2,8,'#d9f0fa');BX(P,7,12,18,10,18,'#e6e8ea','#c7cbce');P(13,22,3,3,'#2f6aa0');P(18,22,3,3,'#c0392b');}];},
  itable(o){const w=o.w*T,h=o.h*TH;return [w,h,10,(P,E,g)=>{
    BX(P,0,0,w,h,10,'#7a8086','#4a4f55');P(2,2,w-4,1,'#98a0a6');
    P(w-40,14,12,7,'#222');P(w-38,15,8,2,'#c0392b');P(w-36,18,4,1,'#888');P(18,8,5,8,'#cfe6ee');P(19,9,3,4,'#8fbfd2');P(w-24,26,9,5,'#555');P(w-23,25,7,2,'#999');P(34,24,18,12,'#d9cba0');P(36,26,14,1,'#8a7a50');P(36,29,10,1,'#8a7a50');
  }];},
  boxes(o){return [T,14,24,(P,E,g)=>{BX(P,2,5,28,14,13,'#b08a5a','#8f6c42');P(14,6,4,12,'#d8bd8a');P(6,22,20,1,'#6e4f2c');BX(P,6,0,20,8,10,'#c4a06c','#a37b49');P(10,20,6,3,'#f1ece0');}];},
  car(){return [96,44,22,(P,E,g)=>{
    BX(P,0,0,96,44,22,'#2a2f35','#1d2125');P(8,7,80,30,'#343b43');P(24,10,48,24,'#e3e6e8');P(24,10,48,2,'#f4f6f7');P(24,31,48,3,'#b7bcc0');
    P(14,12,10,18,'#5f86a8');P(72,12,10,18,'#5f86a8');P(14,12,10,3,'#a7c6dc');P(72,12,10,3,'#a7c6dc');P(36,8,24,5,'#2a2f35');P(38,9,9,3,'#c0392b');P(49,9,9,3,'#2f6aa0');
    P(8,50,14,6,'#f2e6a8');P(74,50,14,6,'#f2e6a8');P(30,52,36,8,'#15181b');for(let x=32;x<66;x+=4)P(x,53,2,6,'#2a2f35');P(40,61,16,4,'#e8e4d0');P(2,62,12,6,'#0e0f10');P(82,62,12,6,'#0e0f10');
  }];},
  tree(o){return [T,6,64,(P,E,g)=>{const rnd=mulberry32(o.x*13+o.y*7+1);P(13,38,6,26,'#5a3a22');P(13,38,2,26,'#7a5232');P(11,60,10,4,'#3e2716');bush(P,E,16,22,17,rnd);}];},
  flag(o){return [T,4,58,(P,E,g)=>{P(15,0,2,58,'#c9ccce');P(15,0,1,58,'#eef0f2');P(13,56,6,4,'#6a6e72');
    if(o.v==='br'){P(17,3,17,12,'#2f7a3a');for(let k=0;k<5;k++)P(25-k*2,8+k-2,1+k*4,1,'#e8c63a');for(let k=0;k<4;k++)P(21+k*2,9+k-1,9-k*4,1,'#e8c63a');P(23,8,5,4,'#e8c63a');P(24,9,3,2,'#2f4f9a');}
    else{P(17,3,17,12,'#1e2a3a');P(17,3,17,1,'#3a4f6a');P(21,7,9,1,'#e8ecef');P(21,10,9,1,'#e8ecef');}}];}
};
function makeSprite(o){
  const f=FACT[o.t];if(!f)return null;
  const [wpx,d,e,fn]=f(o);const c=S2(wpx,d+e,(P,E,g)=>fn(P,E,g));
  return {c:outlined(c),ox:o.x*T-1,base:(o.y+o.h)*TH};
}

/* ---------- Arte: gente (mesma construção da casa) ---------- */
const LOOK={
  lemos:{skin:'#d9a273',hair:'#2a1d18',style:'side',kind:'civil',top:'#2b2f36',pants:'#1f242b',shoes:'#111',tie:'#7a2a2a',badge:1},
  sonia:{skin:'#c98e64',hair:'#4a2f1d',style:'bun',kind:'civil',top:'#1c1d20',pants:'#1c1d20',shoes:'#111'},
  mauricio:{skin:'#e0b48c',hair:'#9a9a9a',style:'grey',glasses:1,kind:'lab',top:'#e6e6e0',pants:'#2b2f36',shoes:'#1a1a1a',gloves:1},
  renata:{skin:'#e0b48c',hair:'#1f1a18',style:'long',kind:'civil',top:'#3b7a6b',pants:'#2b2f36',shoes:'#222'},
  denise:{skin:'#a8714a',hair:'#2a1d18',style:'curly',kind:'civil',top:'#7b5a8a',pants:'#2b2f36',shoes:'#222'},
  paulo:{skin:'#b67c52',hair:'#1f1a18',style:'side',kind:'campo',top:'#3a2b22',pants:'#3b5a8a',shoes:'#3a2416'},
  plantao:{skin:'#f0c9a0',hair:'#3a2416',style:'cap',kind:'pm',top:'#7d8187',pants:'#2b2f36',shoes:'#111'}
};
function personFrames(L){
  const sh=c=>rgbs(mul(hex(c),0.78)),hi=c=>rgbs(mix(hex(c),[255,255,255],0.18));
  const frames=[];
  for(let f=0;f<5;f++){
    const c=S2(26,46,(P,E)=>{
      const cr=f===4?4:0;const lp=f===1?1:f===3?-1:0;
      if(f===4){P(7,36,6,4,L.pants);P(14,37,6,3,L.pants);P(6,40,7,3,L.shoes);P(15,40,6,3,L.shoes);}
      else{P(8,31,5,10+lp,L.pants);P(14,31,5,10-lp,L.pants);P(13,31,1,4,sh(L.pants));P(7+(lp>0?-1:0),41+lp,6,3,L.shoes);P(14+(lp<0?1:0),41-lp,6,3,L.shoes);}
      const ty=18+cr;P(7,ty,12,13,L.top);P(7,ty,2,13,hi(L.top));P(17,ty,2,13,sh(L.top));P(7,ty+12,12,1,sh(L.pants));
      if(L.kind==='civil'){P(11,ty,4,3,'#e8e4da');if(L.tie)P(12,ty+1,2,9,L.tie);if(L.badge)P(8,ty+8,3,3,'#d4af37');}
      if(L.kind==='lab'){P(12,ty,2,13,'#c9c9c0');P(8,ty+8,3,3,'#d4d4cc');P(7,ty+12,12,1,'#b9b9b0');}
      if(L.kind==='campo'){P(11,ty+1,4,10,'#cfc8b8');P(8,ty+8,2,2,'#d4af37');}
      if(L.kind==='pm'){P(5,ty,2,3,'#c0392b');P(17,ty+7,2,5,'#111');P(8,ty+2,2,1,'#d4af37');P(7,ty+11,12,2,'#23262b');}
      const as=f===1?1:f===3?-1:0;const hand=L.gloves?'#f2f2f2':L.skin;
      if(f===4){P(5,ty+3,2,7,L.top);P(19,ty+3,2,7,L.top);P(7,ty+9,2,2,hand);P(17,ty+9,2,2,hand);}
      else{P(5,ty+1+as,2,9,hi(L.top));P(19,ty+1-as,2,9,sh(L.top));P(5,ty+10+as,2,2,hand);P(19,ty+10-as,2,2,hand);}
      const hy=3+cr;P(11,hy+12,4,3,sh(L.skin));P(7,hy+1,12,11,L.skin);P(8,hy,10,13,L.skin);P(17,hy+1,2,11,sh(L.skin));
      P(10,hy+6,1,2,'#1a1412');P(15,hy+6,1,2,'#1a1412');P(12,hy+10,2,1,sh(sh(L.skin)));P(9,hy+9,1,1,'rgba(200,90,80,.35)');P(16,hy+9,1,1,'rgba(200,90,80,.35)');
      if(L.glasses){P(9,hy+5,3,1,'#2a2a2a');P(14,hy+5,3,1,'#2a2a2a');P(12,hy+6,2,1,'#2a2a2a');}
      const hc=L.hair;
      switch(L.style){
        case 'short':P(7,hy-1,12,4,hc);P(6,hy,1,6,hc);P(19,hy,1,6,hc);P(8,hy+3,3,1,hc);break;
        case 'side':P(7,hy-1,12,4,hc);P(6,hy,1,6,hc);P(19,hy,1,5,hc);P(7,hy+3,6,2,hc);break;
        case 'long':P(7,hy-1,12,4,hc);P(5,hy,3,15,hc);P(18,hy,3,15,hc);P(8,hy+3,4,1,hc);break;
        case 'curly':E(13,hy+1,8,4,hc);E(7,hy+4,2,3,hc);E(19,hy+4,2,3,hc);break;
        case 'grey':P(7,hy,12,2,hc);P(6,hy+1,2,6,hc);P(18,hy+1,2,6,hc);break;
        case 'bun':P(7,hy-1,12,4,hc);P(6,hy,1,8,hc);P(19,hy,1,8,hc);E(13,hy-2,5,3,hc);P(8,hy+3,3,1,hc);P(14,hy+3,1,1,'#9a8a7a');break;
        case 'cap':P(6,hy-2,14,5,'#23262b');P(5,hy+3,16,2,'#16181c');P(12,hy-1,2,2,'#d4af37');P(6,hy+5,1,4,hc);P(19,hy+5,1,4,hc);break;
      }
    });
    frames.push(outlined(c));
  }
  return frames;
}

/* ---------- Arte: chão ---------- */
const C={g1:hex('#5b9145'),g2:hex('#77b257'),g3:hex('#8cc366'),a0:hex('#383b41')};
function floorStyle(i){
  const f=floor[i],r=room[i];
  if(f===F.GRASS)return 'grass';if(f===F.STREET)return 'street';if(f===F.WALK)return 'walk';if(f===F.CONC)return 'conc';if(f===F.WALL||f===F.WIN)return 'dark';
  return {sonia:'wood',equipe:'carpet',pericia:'lab',interro:'vinyl',hall:'checker',arquivo:'conc2'}[r]||'conc';
}
function groundPx(wx,wy){
  const tx=wx>>5,ty=wy>>5,i=idx(tx,ty),st=floorStyle(i),lx=wx&31,ly=wy&31,n=hash(wx,wy,5),n2=vn(wx/5,wy/5,9);
  let c;
  switch(st){
    case 'grass':c=mix(C.g1,C.g2,n2);c=mul(c,0.9+n*0.18);if(hash(wx>>1,wy>>1,3)>0.93)c=mix(c,C.g3,.5);return c;
    case 'street':c=mul(C.a0,0.88+n*0.16+n2*0.06);if(ty===24&&ly>=14&&ly<=16&&(wx%64)<36)c=hex('#d9b84a');return c;
    case 'walk':c=mul(hex('#b4afa1'),0.93+n*0.1+n2*0.05);if(lx===0||ly===0)c=mul(c,0.82);if(ty===22&&ly>=27)c=hex('#d2cdbf');if(ty===21&&ly<2)c=mul(c,0.8);return c;
    case 'conc':c=mul(hex('#a9a89e'),0.92+n*0.1+n2*0.07);if((wx&63)===0||(wy&63)===0)c=mul(c,0.8);return c;
    case 'conc2':c=mul(hex('#8f8d86'),0.9+n*0.12+n2*0.08);if((wx&63)===0||(wy&63)===0)c=mul(c,0.78);if(lx>=14&&lx<=17&&ty%4===1)c=mix(c,hex('#d9b84a'),.5);return c;
    case 'wood':{
      const row=wy>>3,off=(row%2)*16,seam=(wx+off)%32===0;c=mix(hex('#9a6e46'),hex('#a87a4e'),hash(row,(wx+off)>>5,2));c=mul(c,0.93+n*0.1+n2*0.04);
      if((wy&7)===0||seam)c=hex('#5e3f27');
      if(tx>=3&&tx<=8&&ty>=5&&ty<=7){const ax=wx-3*T,ay=wy-5*T,bw=6*T,bh=3*T,e=Math.min(ax,ay,bw-1-ax,bh-1-ay);
        c=mul(hex('#7a2f2f'),0.92+n*0.1);if(e<2||(e>=5&&e<7))c=hex('#c9a24a');else if(e>=7&&((ax+ay)&7)<2)c=mul(hex('#7a2f2f'),1.15);}
      return c;}
    case 'carpet':c=mul(hex('#5d6b78'),0.9+n*0.14+n2*0.05);if(lx===0||ly===0)c=mul(c,0.84);return c;
    case 'lab':c=mul(hex('#cfd6d8'),0.95+n*0.06);if((wx&15)===0||(wy&15)===0)c=hex('#a9b3b6');return c;
    case 'vinyl':c=mul(hex('#3b3f44'),0.9+n*0.14+n2*0.05);if(lx===0||ly===0)c=mul(c,0.78);return c;
    case 'checker':{const p=((wx>>4)+(wy>>4))&1;c=mul(hex(p?'#d6d0bf':'#bfb8a4'),0.95+n*0.08);
      if(ty===17&&tx>=15&&tx<=16)c=mul(hex('#2b2f33'),0.9+n*0.2);return c;}
    default:return mul(hex('#2a2520'),0.8+n*0.2);
  }
}
function buildGround(){
  const w=W*T,h=H*T,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),img=g.createImageData(w,h),d=img.data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=groundPx(x,y),k=(y*w+x)*4;d[k]=p[0];d[k+1]=p[1];d[k+2]=p[2];d[k+3]=255;}
  g.putImageData(img,0,0);
  // soleiras das portas
  for(let i=0;i<N;i++)if(floor[i]===F.DOOR){const x=(i%W)*T,y=((i/W)|0)*T;g.fillStyle='rgba(40,28,18,.55)';
    if((i%W)===15||(i%W)===16){g.fillRect(x,y+24,T,5);g.fillStyle='#c9a24a';g.fillRect(x,y+24,T,1);}else{g.fillRect(x+12,y,8,T);g.fillStyle='#c9a24a';g.fillRect(x+12,y,1,T);g.fillRect(x+19,y,1,T);}}
  return c;
}

/* ---------- Arte: paredes ---------- */
const FACE={sonia:['#cdbd9d','#b9a885'],equipe:['#c8cfd3','#b3bbc0'],pericia:['#dfe6e6','#c7d0d0'],interro:['#6b7075','#5a5f64'],hall:['#d8d0b8','#c4bca2'],arquivo:['#9a9a90','#86867c'],wall:['#b9b1a0','#a39b8a'],fora:['#b9a58a','#a58f72']};
const BASE={sonia:'#6b4a2e',equipe:'#59616a',pericia:'#8a9496',interro:'#383c40',hall:'#8a7a5a',arquivo:'#6a6a62',wall:'#6b5a46',fora:'#7a6a52'};
function isWallF(f){return f===F.WALL||f===F.WIN;}
function wallAt(x,y){if(x<0||y<0||x>=W||y>=H)return false;return isWallF(floor[idx(x,y)]);}
function decor(x,y,P,E,X,Y){
  const k=x+','+y;
  const D={
    '7,1':()=>{P(X+4,Y+3,24,16,'#3a2a1c');P(X+6,Y+5,20,12,'#f2ecd8');P(X+9,Y+8,14,1,'#7a6a4a');P(X+9,Y+11,10,1,'#9a8a6a');E(X+23,Y+14,2,2,'#c0392b');},
    '8,1':()=>{P(X+4,Y+3,24,16,'#3a2a1c');P(X+6,Y+5,20,12,'#9cc0d8');P(X+6,Y+10,20,2,'#d9c27a');P(X+6,Y+14,20,3,'#7aa86a');P(X+14,Y+6,4,10,'#c0392b');},
    '12,1':()=>{P(X+6,Y+3,20,15,'#e8e4da');P(X+8,Y+6,16,1,'#999');P(X+8,Y+9,12,1,'#999');P(X+8,Y+12,14,1,'#999');P(X+22,Y+4,2,2,'#c0392b');},
    '15,1':()=>{E(X+16,Y+10,8,8,'#3a2a1c');E(X+16,Y+10,7,7,'#f4efe2');P(X+16,Y+5,1,6,'#222');P(X+16,Y+10,4,1,'#222');},
    '17,1':()=>{P(X+2,Y+3,28,15,'#b0814f');P(X+2,Y+3,28,1,'#6b4a2e');P(X+5,Y+6,8,6,'#f1ece0');P(X+16,Y+5,9,8,'#f6efc9');P(X+8,Y+13,6,3,'#f1ece0');},
    '27,1':()=>{P(X+4,Y+3,24,15,'#f1ece0');P(X+4,Y+3,24,1,'#6b6b6b');for(let k=0;k<6;k++){P(X+6+k*4,Y+6,1,8,'#333');P(X+6+k*4,Y+9,2,1,'#c0392b');}},
    '26,1':()=>{P(X+8,Y+2,16,18,'#2f3a44');P(X+10,Y+4,12,14,'#e9e4d0');E(X+16,Y+10,3,4,'#8a8a8a');},
    '5,9':()=>{P(X-2,Y+1,36,18,'#15191c');P(X,Y+3,32,14,'#2b343a');P(X,Y+3,32,2,'#46535b');P(X+4,Y+6,9,1,'#6a7a84');P(X+16,Y+9,8,1,'#55646e');},
    '6,9':()=>{P(X,Y+1,34,18,'#15191c');P(X,Y+3,32,14,'#2b343a');P(X,Y+3,32,2,'#46535b');P(X+6,Y+8,9,1,'#6a7a84');},
    '12,9':()=>{P(X+3,Y+2,28,16,'#6b4a2e');P(X+5,Y+4,24,12,'#b0814f');P(X+7,Y+6,7,6,'#f1ece0');P(X+16,Y+5,9,8,'#f6efc9');P(X+20,Y+7,2,2,'#c0392b');},
    '13,9':()=>{P(X+1,Y+2,28,16,'#6b4a2e');P(X+3,Y+4,24,12,'#b0814f');P(X+6,Y+6,8,9,'#e8e4da');P(X+16,Y+6,8,6,'#f1ece0');},
    '19,9':()=>{P(X+6,Y+3,20,15,'#3a2a1c');P(X+8,Y+5,16,11,'#9cc0d8');P(X+8,Y+11,16,5,'#6f8a74');E(X+19,Y+8,2,2,'#f6f0c8');},
    '24,9':()=>{P(X+2,Y+4,30,13,'#1c1d20');P(X+2,Y+4,30,1,'#555');},
    '25,9':()=>{P(X-2,Y+4,30,13,'#1c1d20');P(X-2,Y+4,30,1,'#555');},
    '29,9':()=>{P(X+8,Y+4,16,12,'#6a6a62');for(let k=0;k<4;k++)P(X+10,Y+6+k*3,12,1,'#3a3a34');}
  };
  if(D[k])D[k]();
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
        P(X,0,T,capH,cap[0]);for(let k=0;k<6;k++)P(X+Math.floor(hash(x,k,y)*T),Math.floor(hash(k,x,y+3)*capH),1,1,cap[1]);
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
        if(rm==='fora'){for(let yy=fy+4;yy<fb-6;yy+=6)P(X,yy,T,1,'rgba(90,70,45,.22)');}
        if(rm==='arquivo'||rm==='interro'){for(let xx=0;xx<T;xx+=8)P(X+xx,fy,1,fh,'rgba(0,0,0,.08)');}
        P(X,fb-5,T,5,BASE[rm]||BASE.wall);P(X,fb-5,T,1,lt(BASE[rm]||BASE.wall,.18));
        P(X,fy,T,4,'rgba(0,0,0,.20)');
        if(!L)P(X,fy,2,fh,'rgba(0,0,0,.16)');if(!Rt)P(X+T-2,fy,2,fh,'rgba(0,0,0,.20)');
        if(f===F.WIN){const wy=fy+5;P(X+4,wy,24,22,'#f2efe6');P(X+6,wy+2,20,18,'#9cc4e0');P(X+7,wy+3,6,3,'#d4e8f6');P(X+15,wy+2,1,18,'#f2efe6');P(X+6,wy+10,20,1,'#f2efe6');P(X+3,wy+22,26,2,'#d8d2c4');
          if(rm!=='fora'){for(let k=0;k<5;k++)P(X+6,wy+2+k*3,20,1,'rgba(255,255,255,.55)');}}
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
    P(0,0,w,20,'#14171a');P(1,1,w-2,18,'#1f252a');P(3,3,w-6,14,'#262d33');
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

/* ---------- Estado ---------- */
const NPCDEF=[
  {id:'sonia',name:'Sônia Prado',role:'Delegada · DHPP',look:'sonia',x:5,y:3,sit:true,img:'/sonia.jpg',ini:'SP',col:'#c9a24a'},
  {id:'renata',name:'Renata Leal',role:'Investigadora',look:'renata',x:13,y:3,sit:true,ini:'RL',col:'#7fc9b6'},
  {id:'denise',name:'Denise Rocha',role:'Escrivã',look:'denise',x:17,y:3,sit:true,ini:'DR',col:'#c9a7d9'},
  {id:'paulo',name:'Paulo Vieira',role:'Investigador de campo',look:'paulo',x:19,y:6,ini:'PV',col:'#d6b27a',walk:[[19,6],[16,7],[20,3]]},
  {id:'mauricio',name:'Maurício Farias',role:'Perito criminal',look:'mauricio',x:25,y:3,sit:true,ini:'MF',col:'#9fb7c9',walk:[[25,3],[27,5]]},
  {id:'plantao',name:'Plantão',role:'Recepção · DHPP',look:'plantao',x:14,y:11,sit:true,ini:'PL',col:'#a9b8c6'}
];
let objsReady=false,BG=null,WALLROWS=null,SIGN=null,DOORSPR=null,SHADOW=null;
let P1,NPCS=[],frame=0,started=false,follow=true,talkOpen=false;
let SEEN=safe(()=>JSON.parse(localStorage.getItem('base.seen')||'{}'),{});
const cam={x:16*T,y:19*TH,z:1};
let gameMin=8*60+10,lastClock=0;

function newGame(){
  buildMap();
  P1={id:'lemos',x:16,y:20,path:[],dir:1,walk:0,moving:false,look:LOOK.lemos,frames:null,pend:null};
  NPCS=NPCDEF.map(d=>({...d,dir:d.id==='paulo'?-1:1,path:[],walk:0,moving:false,timer:120+Math.floor(Math.random()*200),wp:0,frames:null,hold:false}));
}
function initArt(){
  for(const o of objs)o.spr=makeSprite(o);
  BG=buildGround();WALLROWS=buildWalls();SIGN=buildSign();DOORSPR=buildDoor();
  SHADOW=S2(22,8,(P,E)=>{E(11,4,10,3.5,'rgba(0,0,0,.30)');E(11,4,7,2.5,'rgba(0,0,0,.18)');});
  P1.frames=personFrames(P1.look);for(const n of NPCS)n.frames=personFrames(LOOK[n.look]);
}
const npcAtTile=i=>NPCS.some(n=>ti(n)===i||(n.path.length&&n.path[0]===i));
const walkPass=i=>passable(i)&&!npcAtTile(i);
function roomOf(a){return room[ti(a)];}

/* ---------- Conversas ---------- */
const OPEN_PHONE={t:'Abrir o aparelho',s:'Invesphone',href:'/invesphone',main:true};
const nF=()=>FOUND.length;
const DLG={
  sonia:()=>({who:'Sônia Prado',role:'Delegada · DHPP',av:'sonia',
    pages:[
      nF()>=7?'Li o seu resumo da casa. Porta intacta, painel mexido, cão preso, valores no lugar. Sete achados, e nenhum deles é de ladrão.'
        :nF()>0?`Você me trouxe ${nF()} de 7 achados da casa. Dá pra conversar com isso, mas o resto da cena continua lá, esperando.`
        :'Você veio sem fechar a leitura da casa. A cena não esquenta nem esfria por você, Lemos. Vale voltar.',
      'Roubo comum não explica isso. Mas isso é impressão. Prova, ainda não.',
      'A equipe já está com o material. Ouça o pessoal antes de ouvir qualquer versão. O resto do caso está no aparelho.'],
    opts:[OPEN_PHONE]}),
  sonia_mesa:()=>({who:'Mesa da delegada',role:'Sala de Sônia Prado',av:'icon',pages:['Pasta aberta, telefone fora do gancho pela metade, xícara vazia. Nada aqui é para você mexer sem ela dizer.'],opts:[]}),
  renata:()=>({who:'Renata Leal',role:'Investigadora',av:'renata',
    pages:['Já mandei pedir o histórico do painel do alarme. Até chegar, tudo que eu tenho é a leitura do Maurício.','Registro é uma coisa, interpretação é outra. Quando o histórico voltar, eu aviso você na conversa da Equipe.'],opts:[OPEN_PHONE]}),
  denise:()=>({who:'Denise Rocha',role:'Escrivã',av:'denise',
    pages:['Quando começarem os depoimentos, eu separo as gravações. Cada pessoa na sua sala, uma não ouve a outra.','O que muda de uma versão para outra me interessa mais do que nervosismo.'],opts:[]}),
  paulo:()=>({who:'Paulo Vieira',role:'Investigador de campo',av:'paulo',
    pages:['A rua está fechada e a vizinhança acordou inteira. Prefiro documento a lembrança, mas lembrança é o que a rua tem.','Se aparecer nome novo, eu confirmo onde a pessoa estava antes de você ouvi-la.'],opts:[]}),
  mauricio:()=>({who:'Maurício Farias',role:'Perito criminal',av:'mauricio',
    pages:['Painel preservado. Ninguém mexeu nele depois da gente.','O quarto da Lívia ainda está em processamento. Quando eu tiver algo concreto, eu falo.','Eu não chamaria isso de busca às cegas.'],
    opts:FOUND.length?[{t:'Ver as fotos da cena',s:`${FOUND.length} de 7`,fn:()=>openGallery(0)}]:[]}),
  plantao:()=>({who:'Plantão',role:'Recepção · DHPP',av:'plantao',pages:['A imprensa ligou duas vezes. Respondi o que a delegada mandou: sem comentários.','Se alguém procurar a equipe, passa por mim primeiro.'],opts:[]}),
  mesa_lemos:()=>({who:'Sua mesa',role:'Lemos · DHPP',av:'icon',pages:['Café frio e a pasta do Caso 01 ainda fechada. O que importa está no aparelho.'],opts:[OPEN_PHONE]}),
  quadro:()=>{
    if(!FOUND.length)return {who:'Quadro do caso',role:'Sala da equipe',av:'icon',pages:['Caso 01 · Rua das Acácias. O quadro está quase vazio: a varredura da casa ainda não deixou nada aqui.'],opts:[{t:'Voltar à casa',s:'Varredura',href:'/'}]};
    return {who:'Quadro do caso',role:'Caso 01 · Rua das Acácias',av:'icon',
      pages:['Casal Valença, vítimas. Rua das Acácias. Em vermelho, o que a varredura trouxe:',FOUND.map(id=>'• '+CLUES[id].title+': '+CLUES[id].desc).join('\n'),FOUND.length>=7?'Roubo comum não explica a cena.':'Faltam achados na casa. O quadro só mostra o que foi visto.'],
      opts:[{t:'Ver as fotos',s:`${FOUND.length} de 7`,fn:()=>openGallery(0)}]};},
  fotos:()=>FOUND.length?{who:'Mesa de luz',role:'Perícia',av:'icon',pages:['Fotografias periciais da casa, reveladas e penduradas para análise.'],opts:[{t:'Ver as fotos',s:`${FOUND.length} de 7`,fn:()=>openGallery(0),main:true}]}
    :{who:'Mesa de luz',role:'Perícia',av:'icon',pages:['A mesa de luz está apagada. Nenhuma foto da casa chegou ainda.'],opts:[{t:'Voltar à casa',s:'Varredura',href:'/'}]},
  interro:()=>({who:'Sala de depoimentos',role:'Gravação e espelho',av:'icon',
    pages:['Mesa de aço, dois copos, um gravador e o espelho que não é espelho. Quem for chamado entra por aqui, separado dos outros.','Ninguém foi convocado ainda. Quem chamar, e quando, é decisão sua.'],opts:[{t:'Escolher no aparelho',s:'Pessoas',href:'/invesphone',main:true}]}),
  arquivo:()=>({who:'Arquivo Morto',role:'Caixas e prateleiras',av:'icon',
    pages:['Caixas de casos que ninguém fechou, com o nome escrito a lápis na lateral. Todo caso daqui começou parecendo simples.','O de hoje ainda cabe numa gaveta. Ver o que já foi guardado dele é pelo aparelho.'],opts:[{t:'Abrir o aparelho',s:'Arquivo',href:'/invesphone',main:true}]})
};
let talk=null,tkTimer=0;
function avatarHTML(av){
  const n=NPCS.find(x=>x.id===av);
  if(av==='sonia')return `<img src="/sonia.jpg" alt="">`;
  if(n)return n.ini;
  return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#10161a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l6 6"/></svg>';
}
function setSeen(id){SEEN[id]=1;safe(()=>localStorage.setItem('base.seen',JSON.stringify(SEEN)));}
function openTalk(id,from){
  const def=DLG[id];if(!def)return;
  const d=def();talk={id,d,page:0,done:false,typed:0};
  setSeen(id);talkOpen=true;document.body.classList.add('talking');
  const n=NPCS.find(x=>x.id===id);if(n){n.hold=true;n.path=[];n.moving=false;n.dir=P1.x<n.x?-1:1;}
  const col=n?n.col:'#96a7ae',av=$('#tk-av');av.style.background=col;av.innerHTML=avatarHTML(d.av);
  $('#tk-who').textContent=d.who;$('#tk-role').textContent=d.role;
  $('#talk').hidden=false;showPage();
}
function showPage(){
  const t=talk,txt=t.d.pages[t.page];t.typed=0;t.done=false;$('#tk-opts').innerHTML='';$('#tk-more').hidden=true;
  clearInterval(tkTimer);const el=$('#tk-text');el.textContent='';
  tkTimer=setInterval(()=>{t.typed+=2;el.textContent=txt.slice(0,t.typed);if(t.typed>=txt.length)finishPage();},18);
}
function finishPage(){
  const t=talk;if(!t||t.done)return;clearInterval(tkTimer);t.done=true;$('#tk-text').textContent=t.d.pages[t.page];
  const last=t.page>=t.d.pages.length-1,box=$('#tk-opts');
  if(!last){$('#tk-more').hidden=false;return;}
  box.innerHTML='';
  for(const o of t.d.opts||[]){const b=document.createElement('button');if(o.main)b.className='main';b.innerHTML=`<b>${o.t}</b>${o.s?`<span>${o.s}</span>`:''}`;
    b.addEventListener('click',e=>{e.stopPropagation();if(o.href){location.href=o.href;return;}closeTalk();if(o.fn)o.fn();});box.appendChild(b);}
  const c=document.createElement('button');c.innerHTML='<b>Voltar à base</b>';c.addEventListener('click',e=>{e.stopPropagation();closeTalk();});box.appendChild(c);
}
function advance(){
  if(!talk)return;if(!talk.done){finishPage();return;}
  if(talk.page<talk.d.pages.length-1){talk.page++;showPage();}
}
function closeTalk(){
  clearInterval(tkTimer);if(talk){const n=NPCS.find(x=>x.id===talk.id);if(n)n.hold=false;}
  talk=null;talkOpen=false;document.body.classList.remove('talking');$('#talk').hidden=true;follow=true;
}
$('#tk-x').addEventListener('click',e=>{e.stopPropagation();closeTalk();});
$('#talk').addEventListener('click',advance);

/* ---------- Fotos ---------- */
let galI=0;
function openGallery(i){
  if(!FOUND.length)return;galI=clamp(i,0,FOUND.length-1);const c=CLUES[FOUND[galI]];
  $('#g-img').src=c.img;$('#g-title').textContent=c.title;$('#g-cap').textContent='Fotografia pericial · '+c.room;$('#g-n').textContent=`${galI+1} / ${FOUND.length}`;
  $('#g-pic').classList.remove('z');$('#gal').hidden=false;talkOpen=true;
}
$('#g-x').addEventListener('click',()=>{$('#gal').hidden=true;talkOpen=false;});
$('#g-prev').addEventListener('click',()=>openGallery((galI+FOUND.length-1)%FOUND.length));
$('#g-next').addEventListener('click',()=>openGallery((galI+1)%FOUND.length));
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
function goTalk(kind,id){
  P1.pend=null;
  if(kind==='npc'?reachNpc(NPCS.find(n=>n.id===id)):reachHot(id)){P1.path=[];openTalk(id);return;}
  const targets=[];if(kind==='npc'){const n=NPCS.find(x=>x.id===id);targets.push([n.x,n.y,2.3]);}else for(let i=0;i<N;i++)if(hot[i]===id)targets.push([i%W,(i/W)|0,1.9]);
  const e=bfs(ti(P1),i=>{if(!walkPass(i))return false;const x=i%W,y=(i/W)|0;return targets.some(t=>dist(x,y,t[0],t[1])<=t[2]);},n=>walkPass(n)||n===ti(P1));
  if(e<0){toast('Base','Não dá para chegar até lá agora.');return;}
  P1.path=pathTo(e);P1.pend={kind,id};follow=true;
}
function goTile(i){
  P1.pend=null;let e=-1;
  if(walkPass(i))e=bfs(ti(P1),n=>n===i,n=>walkPass(n));
  else e=bfs(i,n=>walkPass(n),n=>true);
  if(e<0){return;}
  if(!walkPass(i)){const t=e;e=bfs(ti(P1),n=>n===t,n=>walkPass(n));if(e<0)return;}
  P1.path=pathTo(e);follow=true;
}
function tap(sx,sy){
  const e=cam.z,wx=cam.x+(sx-VW()/2)/e,wy=cam.y+(sy-VH()/2)/e;
  const ns=[...NPCS].sort((a,b)=>b.y-a.y);
  for(const n of ns){const X=Math.round(n.x*T)+16,Y=Math.round(n.y*TH)+TH-2;if(wx>=X-16&&wx<=X+16&&wy>=Y-50&&wy<=Y+4&&DLG[n.id]){goTalk('npc',n.id);return;}}
  const hs=objs.filter(o=>o.hot&&o.spr).sort((a,b)=>(b.y+b.h)-(a.y+a.h));
  for(const o of hs){const s=o.spr,top=s.base-s.c.height+1;if(wx>=o.x*T-2&&wx<=(o.x+o.w)*T+2&&wy>=top-2&&wy<=s.base+2){goTalk('hot',o.hot);return;}}
  const tx=clamp(Math.floor(wx/T),0,W-1),ty=clamp(Math.floor(wy/TH),0,H-1);
  goTile(idx(tx,ty));
}
let drag=null;
cv.addEventListener('pointerdown',e=>{if(!started||talkOpen)return;drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,cx:cam.x,cy:cam.y,moved:false};try{cv.setPointerCapture(e.pointerId);}catch(_){}});
cv.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;
  if(!drag.moved&&Math.hypot(dx,dy)>8)drag.moved=true;
  if(drag.moved){follow=false;cam.x=drag.cx-dx/cam.z;cam.y=drag.cy-dy/cam.z;clampCam();}});
const endDrag=e=>{if(!drag||e.pointerId!==drag.id)return;const d=drag;drag=null;if(!d.moved&&e.type==='pointerup')tap(e.clientX,e.clientY);};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);

function stepAgent(a,sp,pass){
  a.moving=false;if(!a.path.length)return;
  const n=a.path[0];if(pass&&!pass(n)){a.path=[];return;}
  const tx=n%W,ty=(n/W)|0,dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
  if(d<=sp){a.x=tx;a.y=ty;a.path.shift();}else{a.x+=dx/d*sp;a.y+=dy/d*sp;}
  if(Math.abs(dx)>0.01)a.dir=dx>0?1:-1;a.walk+=sp;a.moving=true;
}
function update(dt){
  if(!talkOpen){
    stepAgent(P1,3.3*dt,i=>passable(i)&&!NPCS.some(n=>ti(n)===i));
    if(!P1.path.length&&P1.pend){const p=P1.pend;P1.pend=null;if(started)goTalk(p.kind,p.id);}
    for(const n of NPCS){
      if(n.hold)continue;
      if(n.path.length){stepAgent(n,1.5*dt,i=>passable(i)&&ti(P1)!==i&&!NPCS.some(m=>m!==n&&ti(m)===i));continue;}
      if(!n.walk||!n.walk.length)continue;
      n.timer-=dt*60;if(n.timer>0)continue;n.timer=300+Math.random()*420;n.wp=(n.wp+1)%n.walk.length;
      const g=n.walk[n.wp],tgt=idx(g[0],g[1]);if(ti(n)===tgt)continue;
      const e=bfs(ti(n),i=>i===tgt,i=>(passable(i)||i===tgt)&&!NPCS.some(m=>m!==n&&ti(m)===i)&&ti(P1)!==i);
      if(e>=0)n.path=pathTo(e);
    }
    lastClock+=dt;if(lastClock>3){lastClock=0;gameMin++;}
  }
}

/* ---------- Câmera ---------- */
const VW=()=>window.innerWidth,VH=()=>window.innerHeight;
function snapZ(z){return clamp(Math.max(1,Math.round(z*dpr))/dpr,Math.max(0.5,1/dpr),5);}
function clampCam(){
  const e=cam.z,hw=VW()/2/e,hh=VH()/2/e,x0=hw,x1=W*T-hw,y0=hh-58/e,y1=H*TH-hh;
  cam.x=x0>x1?(W*T)/2:clamp(cam.x,x0,x1);cam.y=y0>y1?(H*TH)/2:clamp(cam.y,y0,y1);
}
function fitView(){
  const L=VW()>VH();
  cam.z=L?snapZ(Math.min(VW()/(21*T),VH()/(12.5*TH))):snapZ(VW()/(9.5*T));
  clampCam();
}
function resize(){
  dpr=Math.min(window.devicePixelRatio||1,3);cv.width=Math.round(VW()*dpr);cv.height=Math.round(VH()*dpr);
  lc.width=Math.ceil(cv.width/LS);lc.height=Math.ceil(cv.height/LS);fitView();
}
function followCam(){
  if(!follow)return;
  const tx=P1.x*T+16,ty=P1.y*TH+TH/2-(talkOpen?VH()*0.2/cam.z:0);
  cam.x+=(tx-cam.x)*0.12;cam.y+=(ty-cam.y)*0.12;clampCam();
}

/* ---------- Luz ---------- */
const LIGHTS=[
  {x:5.5*T,y:3.6*TH,r:150,a:.95,c:[255,214,150],flick:0},{x:6*T,y:5.4*TH,r:200,a:.55,c:[255,236,200],flick:0},
  {x:13*T,y:4*TH,r:180,a:.8,c:[220,235,255],flick:0},{x:17*T,y:5*TH,r:200,a:.85,c:[220,235,255],flick:0},{x:20.5*T,y:4*TH,r:170,a:.8,c:[220,235,255],flick:0},
  {x:25*T,y:4.5*TH,r:230,a:1,c:[235,248,255],flick:0},{x:29*T,y:5*TH,r:190,a:.95,c:[235,248,255],flick:0},
  {x:5.5*T,y:13*TH,r:112,a:1,c:[255,210,140],flick:0},
  {x:15*T,y:13.5*TH,r:260,a:.8,c:[255,244,225],flick:0},{x:16*T,y:17.6*TH,r:130,a:1,c:[255,255,255],flick:0},
  {x:25.5*T,y:12.5*TH,r:130,a:.7,c:[255,225,170],flick:1},{x:29.5*T,y:15*TH,r:120,a:.6,c:[255,225,170],flick:1}
];
function lightPass(s,ox,oy){
  lctx.setTransform(1,0,0,1,0,0);lctx.globalCompositeOperation='source-over';lctx.clearRect(0,0,lc.width,lc.height);
  lctx.fillStyle='rgba(6,10,20,.60)';lctx.fillRect(0,0,lc.width,lc.height);
  lctx.globalCompositeOperation='destination-out';
  const k=s/LS;
  const rect=(x0,y0,x1,y1)=>{lctx.fillStyle='rgba(0,0,0,1)';lctx.fillRect(x0*k+ox/LS,y0*k+oy/LS,(x1-x0)*k,(y1-y0)*k);};
  rect(-400,-400,W*T+400,1*TH);rect(-400,18.55*TH,W*T+400,H*TH+400);rect(-400,0,1*T+8,H*TH);rect(32*T-8,0,W*T+400,H*TH);
  for(const L of LIGHTS){
    const fl=L.flick?0.82+0.18*Math.sin(frame/7+L.x)*Math.sin(frame/13):1,cx=L.x*k+ox/LS,cy=L.y*k+oy/LS,r=L.r*k*(0.96+0.04*fl);
    const g=lctx.createRadialGradient(cx,cy,r*0.08,cx,cy,r);g.addColorStop(0,`rgba(0,0,0,${L.a*fl})`);g.addColorStop(.55,`rgba(0,0,0,${L.a*fl*0.55})`);g.addColorStop(1,'rgba(0,0,0,0)');
    lctx.fillStyle=g;lctx.fillRect(cx-r,cy-r,r*2,r*2);
  }
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(lc,0,0,lc.width*LS,lc.height*LS);
  // brilho quente/frio das lâmpadas, discreto
  ctx.globalCompositeOperation='lighter';
  for(const L of LIGHTS){const fl=L.flick?0.82+0.18*Math.sin(frame/7+L.x)*Math.sin(frame/13):1,cx=L.x*s+ox,cy=L.y*s+oy,r=L.r*s*0.7;
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,`rgba(${L.c[0]},${L.c[1]},${L.c[2]},${0.11*L.a*fl})`);g.addColorStop(1,`rgba(${L.c[0]},${L.c[1]},${L.c[2]},0)`);
    ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2);}
  ctx.globalCompositeOperation='source-over';
}

/* ---------- Desenho ---------- */
function drawPerson(p,sit){
  const fr=p.frames;let f=0;
  if(p.moving)f=Math.floor(p.walk*3.2)%4;else if(sit)f=4;
  const X=Math.round(p.x*T)+16,Y=Math.round(p.y*TH)+TH-2;
  const bob=p.moving?((Math.floor(p.walk*3.2)%2)?-1:0):(Math.sin(frame/26+(p.x+p.y)*1.7)>0.55?-1:0);
  ctx.drawImage(SHADOW,X-11,Y-5);
  const img=fr[f],dw=img.width,dh=img.height;
  if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);ctx.drawImage(img,-14,Y-45+bob,dw,dh);ctx.restore();}else ctx.drawImage(img,X-14,Y-45+bob,dw,dh);
}
function drawMarker(X,Y){
  const b=Math.round(Math.sin(frame/10)*2);ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+b+7);ctx.lineTo(X-6,Y+b);ctx.lineTo(X,Y+b-7);ctx.lineTo(X+6,Y+b);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+b+5);ctx.lineTo(X-4,Y+b);ctx.lineTo(X,Y+b-5);ctx.lineTo(X+4,Y+b);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y+b-3,2,4);ctx.fillRect(X-1,Y+b+2,2,1.5);
}
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,cv.width,cv.height);
  const s=cam.z*dpr,ox=Math.round(cv.width/2-cam.x*s),oy=Math.round(cv.height/2-cam.y*s);
  const SPR=()=>{ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;};
  SPR();
  ctx.setTransform(s,0,0,s*K,ox,oy);ctx.imageSmoothingEnabled=false;ctx.drawImage(BG,0,0);SPR();
  const rows={};const R=k=>rows[k]||(rows[k]={o:[],p:[]});
  for(const o of objs)if(o.spr)R(o.y+o.h-1).o.push(o);
  for(const n of NPCS)R(Math.round(n.y)).p.push([n,!!n.sit&&!n.moving]);
  R(Math.round(P1.y)).p.push([P1,false]);
  const y0=Math.max(0,Math.floor(-oy/s/TH)-4),y1=Math.min(H-1,Math.ceil((cv.height-oy)/s/TH)+3);
  for(let y=y0;y<=y1;y++){
    if(WALLROWS[y])ctx.drawImage(WALLROWS[y],0,y*TH-RISE);
    if(y===18){ctx.drawImage(DOORSPR,15*T,18*TH+12);ctx.drawImage(SIGN,13*T,18*TH-8);}
    const r=rows[y];if(!r)continue;
    for(const o of r.o){const sp=o.spr;ctx.drawImage(sp.c,sp.ox,sp.base-sp.c.height+1);}
    r.p.sort((a,b)=>a[0].y-b[0].y);
    for(const [p,sit] of r.p)drawPerson(p,sit);
  }
  // marcadores: quem ainda tem o que dizer
  for(const n of NPCS)if(!SEEN[n.id]&&DLG[n.id])drawMarker(Math.round(n.x*T)+16,Math.round(n.y*TH)+TH-(n.sit?64:60));
  for(const o of objs)if(o.hot&&o.spr&&!SEEN[o.hot]){const sp=o.spr;drawMarker(o.x*T+o.w*T/2,sp.base-sp.c.height-6);}
  // destino do toque
  if(P1.path.length&&started){const e=P1.path[P1.path.length-1],X=(e%W)*T+16,Y=((e/W)|0)*TH+TH/2;ctx.strokeStyle='rgba(242,194,48,.9)';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.lineDashOffset=-(frame>>2);ctx.beginPath();ctx.ellipse(X,Y,10,4.5,0,0,7);ctx.stroke();ctx.setLineDash([]);}
  lightPass(s,ox,oy);
  // vinheta
  ctx.setTransform(1,0,0,1,0,0);const g=ctx.createRadialGradient(cv.width/2,cv.height/2,Math.min(cv.width,cv.height)*0.45,cv.width/2,cv.height/2,Math.max(cv.width,cv.height)*0.78);
  g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=g;ctx.fillRect(0,0,cv.width,cv.height);
}

/* ---------- Interface ---------- */
let lastRoom='',lastClk='';
function updateUI(){
  const r=roomOf(P1),nm=ROOM_NAME[r]||'';if(r!==lastRoom){lastRoom=r;$('#where-n').textContent=nm;}
  const m=gameMin%1440,c=String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');if(c!==lastClk){lastClk=c;$('#clk').textContent=c;}
}
let last=performance.now();
function loop(now){
  const dt=Math.min(0.1,(now-last)/1000);last=now;
  update(dt);followCam();frame++;render();if(frame%6===0)updateUI();
  requestAnimationFrame(loop);
}
addEventListener('resize',resize);
newGame();initArt();resize();cam.x=16*T;cam.y=19*TH;clampCam();
$('#b-start').addEventListener('click',()=>{
  $('#intro').hidden=true;started=true;
  const e=bfs(ti(P1),i=>i===idx(16,15),walkPass);if(e>=0)P1.path=pathTo(e);
  setTimeout(()=>toast('Sônia Prado','Lemos, na minha sala. A equipe já está com o material da casa.',{img:'/sonia.jpg',col:'#c9a24a'}),1200);
});
window.__base={get P1(){return P1;},NPCS:()=>NPCS,cam,goTalk,goTile,openTalk,openGallery,FOUND,get started(){return started;},objs:()=>objs,tap,idx,W,H,T,TH,ti,passable};
requestAnimationFrame(loop);
})();
