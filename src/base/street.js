/* Rua do DHPP: o lado de fora da base, com a câmera alta de Beat Cop (fachadas de frente, cortadas no alto, e o chão
   visto de cima: calçada funda com árvores e lampiões, meio-fio, faixa de estacionamento e duas faixas de trânsito).
   Lemos anda pela calçada; a porta do DHPP leva para dentro (a planta da base, em base.js).

   Mesmo nível gráfico e mesma técnica da base e da casa: tudo é pixel art desenhada aqui, na MESMA unidade de pixel da
   planta (o Lemos é o boneco de 46 px de dentro), com as mesmas funções de acabamento da base (S2, refine, outlined, bush)
   e a mesma paleta. O prédio do DHPP repete a fachada da base: ripas bege, janelas brancas com ar-condicionado, o mesmo
   letreiro e a mesma porta de vidro. A quadra em volta é um bairro de casas geminadas de tijolo (como na Filadélfia):
   degraus de mármore, cornijas escuras, escadas de incêndio e comércio de esquina com letreiros genéricos. */

const GY=250;                       // pé das fachadas = começo da calçada
const SIDE=100;                     // fundura da calçada
const CURB=GY+SIDE;                 // beira da calçada (topo do meio-fio)
const ROAD=CURB+15;                 // começo do asfalto (depois da face do meio-fio)
const WALK=[GY+18,CURB-16];         // faixa da calçada onde dá para andar
const PARK=ROAD+54;                 // faixa de estacionamento, encostada no meio-fio
const LANES=[{y:ROAD+122,dir:1,v:96},{y:ROAD+190,dir:-1,v:108}];
export const STREET_H=ROAD+200;
const FLOOR=52;                     // altura de um andar (a mesma faixa de parede da base)

/* ---------- a quadra, da esquerda para a direita ---------- */
const LOT=[
  {k:'row',w:100,brick:'#8e3b2c',door:'#2f5a3a',fl:3,cor:'#2a2a2e',bay:'#e8e2d4',spout:true},
  {k:'row',w:100,brick:'#7a4030',door:'#1e1e22',fl:3,escape:true,cor:'#3a2a22'},
  {k:'shop',w:150,brick:'#934733',fl:3,shop:'market',sign:'CORNER MARKET',band:'#2f5a3a',cor:'#e8e2d4',frame:'#2f3a30'},
  {k:'row',w:100,paint:'#cbb894',door:'#7a2a2a',fl:3,boxes:true,cor:'#2f4a3a',spout:true},
  {k:'alley',w:40},
  {k:'dhpp',w:440},
  {k:'alley',w:28},
  {k:'shop',w:140,brick:'#7a4030',fl:3,shop:'laundry',sign:'LAUNDROMAT',band:'#2e4a6a',cor:'#2a2a2e',frame:'#3a3e44'},
  {k:'row',w:100,brick:'#8e3b2c',door:'#2e4a6a',fl:3,boxes:true,cor:'#e8e2d4',bay:'#2f4a3a'},
  {k:'row',w:100,brick:'#6e3a2c',door:'#1e1e22',fl:3,boarded:true,escape:true,cor:'#3a2a22',spout:true},
  {k:'shop',w:130,brick:'#5e3a2e',fl:3,shop:'tavern',sign:'TAVERN',band:'#1a1416',cor:'#2a2a2e',frame:'#2a1e18'},
  {k:'row',w:100,paint:'#7d8c99',door:'#e8e2d4',fl:3,cor:'#e8e2d4',bay:'#e8e2d4'},
  {k:'row',w:100,brick:'#934733',door:'#3a2a22',fl:3,escape:true,cor:'#2a2a2e',spout:true},
  {k:'shop',w:120,brick:'#8e3b2c',fl:3,shop:'barber',sign:'BARBER',band:'#e8e2d4',cor:'#3a2a22',frame:'#4a3a30'},
  {k:'row',w:100,brick:'#7a4030',door:'#2f5a3a',fl:3,boxes:true,cor:'#e8e2d4',bay:'#7a2a2a'},
  {k:'shop',w:150,paint:'#d0c4ae',fl:3,shop:'pharmacy',sign:'PHARMACY',band:'#2f6a4a',cor:'#2f4a3a',frame:'#2a3a34'},
  {k:'row',w:100,brick:'#8e3b2c',door:'#7a2a2a',fl:3,cor:'#3a2a22',spout:true},
  {k:'row',w:100,brick:'#6e3a2c',door:'#1e1e22',fl:3,escape:true,cor:'#2a2a2e',bay:'#e8e2d4'}
];
let acc=0;export const BUILDINGS=LOT.map((b,i)=>{const o={...b,i,X:acc};acc+=b.w;return o;});
export const STREET_W=acc;
export const DHPP=BUILDINGS.find(b=>b.k==='dhpp');
export const DOOR={x:DHPP.X+DHPP.w/2,y:WALK[0]+6};  // onde Lemos entra
// árvores na calçada (com o canteiro), lampiões pretos e o mobiliário
const TREES=[150,620,1360,1820,2240].filter(x=>x<STREET_W-40);
const LAMPS=[60,420,1000,1540,2060].filter(x=>x<STREET_W-20);
const PROPS=[{k:'hydrant',x:520},{k:'can',x:300},{k:'can',x:1250},{k:'news',x:880},{k:'news2',x:902},{k:'hydrant',x:1690},{k:'can',x:2150},{k:'bench',x:1450}].filter(p=>p.x<STREET_W-30);

function rnd(seed){let s=seed%2147483647||7;return ()=>(s=s*16807%2147483647)/2147483647;}

/* ---------- peças de fachada (pixel art em px da base) ----------
   Profundidade: o sol vem do alto à esquerda, como na planta. Tudo que sai da parede (cornija, vergas, peitoris,
   bay windows, ar-condicionado, toldos, escadas de incêndio) mostra o topo claro (a câmera é alta) e joga sombra
   para baixo e para a direita; tudo que entra na parede (janelas, portas, vitrines) tem a sombra do vão no alto e
   à esquerda e o batente claro à direita. */
const SH=a=>`rgba(24,12,6,${a})`;
function shade(c,f){const n=parseInt(c.slice(1),16),m=v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)));return `rgb(${m(n>>16)},${m(n>>8&255)},${m(n&255)})`;}
function brickWall(P,x,y,w,h,base,seed,hash){
  P(x,y,w,h,base);
  for(let yy=y,r=0;yy<y+h;yy+=5,r++){
    for(let xx=x+((r%2)?-6:0);xx<x+w;xx+=12){
      const bx=Math.max(x,xx+1),bw=Math.min(xx+12,x+w)-bx,t=hash(xx+40,yy,seed);if(bw<=0)continue;
      // cada tijolo com o tom próprio, a aresta de cima pegando luz e a junta funda embaixo
      if(t<.13)P(bx,yy+1,bw,4,'rgba(0,0,0,.13)');else if(t<.25)P(bx,yy+1,bw,4,'rgba(255,214,190,.10)');else if(t<.30)P(bx,yy+1,bw,4,'rgba(70,20,10,.18)');
      P(bx,yy+1,bw,1,'rgba(255,226,206,.12)');P(bx,yy+4,bw,1,'rgba(0,0,0,.08)');
      if(xx>=x)P(xx,yy+1,1,4,'rgba(206,190,170,.30)');
    }
    P(x,yy,w,1,'rgba(206,190,170,.34)');
  }
  // sujeira escorrendo e a base mais escura (respingo da calçada)
  for(let k=0;k<w/9;k++){const sx=x+Math.floor(hash(k,seed,21)*w),sy=y+Math.floor(hash(seed,k,22)*h*.8);P(sx,sy,1,8+Math.floor(hash(k,k,23)*16),'rgba(30,18,12,.07)');}
  for(let k=0;k<8;k++)P(x,y+h-8+k,w,1,`rgba(30,20,14,${.012*k})`);
}
function paintWall(P,x,y,w,h,base,seed,hash){
  P(x,y,w,h,base);for(let yy=y;yy<y+h;yy+=5){P(x,yy,w,1,'rgba(0,0,0,.07)');P(x,yy+1,w,1,'rgba(255,255,255,.05)');}
  for(let k=0;k<w*h/50;k++){const t=hash(k,seed,7);P(x+Math.floor(hash(k,seed,3)*w),y+Math.floor(hash(seed,k,5)*h),1,1,t<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.09)');}
  for(let k=0;k<w/12;k++){const sx=x+Math.floor(hash(k,seed,31)*w),sy=y+Math.floor(hash(seed,k,32)*h*.8);P(sx,sy,2,10+Math.floor(hash(k,k,33)*14),'rgba(40,30,20,.06)');}
}
// ar-condicionado saindo da janela: topo claro, face, lateral escura e a sombra na parede
function acUnit(P,x,y,w){
  P(x+3,y+3,w,12,SH(.28));
  P(x,y,w,2,'#f2f0e8');P(x,y+2,w,10,'#d9d6cb');P(x+w-2,y+2,2,10,'#a9a69a');P(x,y+11,w,1,'#8a877c');
  for(let k=0;k<(w-6)/3;k++)P(x+2+k*3,y+4,1,6,'#a9a69a');P(x+w-6,y+4,3,2,'#6a675e');
  P(x+w/2,y+12,1,6,'rgba(60,90,120,.30)');
}
// janela de guilhotina funda na parede, com verga de pedra (com chave), peitoril saliente e as sombras
function sash(P,x,y,o){
  const w=o.w||22,h=o.h||30;
  // sombra da verga e do peitoril na parede (para a direita e para baixo)
  P(x-2,y,w+8,3,SH(.32));P(x+w+3,y-4,2,7,SH(.25));P(x-1,y+h+4,w+8,3,SH(.28));P(x+w+4,y+h,2,6,SH(.22));
  // vão: a parede tem espessura
  P(x-1,y-1,w+2,h+2,'#2a1d18');
  P(x,y,w,h,'#ece6da');
  if(o.boarded){P(x+1,y+1,w-2,h-2,'#a07a4a');for(let k=0;k<4;k++){P(x+1,y+3+k*7,w-2,1,'#7a5a34');P(x+1,y+4+k*7,w-2,1,'#b88e5a');}P(x+3,y+4,1,1,'#3a3a3a');P(x+w-4,y+h-5,1,1,'#3a3a3a');P(x+2,y+12,w-4,2,'#8a6a40');}
  else{
    const g=o.lit?'#f2cf86':'#4f6c88',g2=o.lit?'#ffe6b0':'#7a98b4';
    P(x+2,y+2,w-4,h/2-2,g);P(x+2,y+h/2+1,w-4,h/2-3,g);P(x+2,y+h/2+1,w-4,1,g2);
    P(x+w/2,y+2,1,h-4,'#ece6da');P(x+1,y+h/2-1,w-2,2,'#ece6da');P(x+1,y+h/2+1,w-2,1,'#b8b0a2');
    if(!o.lit){P(x+w-7,y+4,2,1,'#a9c2d6');P(x+w-6,y+5,2,1,'#a9c2d6');P(x+w/2+3,y+h/2+4,2,1,'#93b0c8');P(x+3,y+h-6,4,2,'#3e5a74');}
    if(o.lit){P(x+2,y+2,4,h-5,o.curtain||'#b85a4a');P(x+w-6,y+2,4,h-5,o.curtain||'#b85a4a');P(x+5,y+2,1,h-5,'rgba(0,0,0,.18)');if(o.who)P(x+w/2-3,y+h-12,6,9,'rgba(40,28,22,.55)');}
  }
  // sombra do vão: em cima (verga) e à esquerda; batente direito pegando luz
  P(x,y,w,3,'rgba(0,0,0,.30)');P(x,y+3,2,h-3,'rgba(0,0,0,.24)');P(x+w-1,y,1,h,'rgba(255,240,220,.30)');
  // verga com chave
  P(x-4,y-6,w+8,6,'#d8d0c0');P(x-4,y-6,w+8,2,'#f2ecdf');P(x-4,y-1,w+8,1,'#a89f90');
  P(x+w/2-3,y-7,6,8,'#e4dccc');P(x+w/2-3,y-7,6,1,'#faf6ee');P(x+w/2+2,y-6,1,7,'#b8b0a2');
  // peitoril saliente: topo claro, face, aresta de baixo escura
  P(x-4,y+h,w+8,2,'#f2ecdf');P(x-4,y+h+2,w+8,2,'#cfc6b6');P(x-4,y+h+4,w+8,1,'#8f877a');
  if(o.ac)acUnit(P,x+1,y+h-14,w-2);
  if(o.box){P(x,y+h+8,w+6,3,SH(.25));P(x-2,y+h+2,w+4,2,'#8a6040');P(x-2,y+h+4,w+4,5,'#5a3a24');P(x-2,y+h+8,w+4,1,'#3a2416');
    for(let k=0;k<w+2;k+=3){P(x-1+k,y+h-2,2,4,k%2?'#3a6a2e':'#69ad52');P(x-1+k,y+h-3,1,1,'#8ccb6a');if(k%6===0)P(x+k,y+h-3,2,2,['#c0392b','#f2c230','#e8e2d4'][(k/6)%3]);}}
}
// cornija de metal com mísulas: o topo visto do alto, a testeira, as mísulas e a sombra larga na parede
function cornice(P,x,y,w,col){
  const lt=shade(col,1.35),hl=shade(col,1.7),dk=shade(col,.62);
  P(x,y+15,w,6,SH(.36));P(x,y+21,w,2,SH(.16));
  P(x,y,w,3,hl);P(x,y+3,w,1,lt);P(x,y+4,w,5,col);P(x,y+8,w,1,dk);
  for(let xx=x+5;xx<x+w-8;xx+=13){P(xx+3,y+15,5,7,SH(.22));P(xx,y+9,6,8,col);P(xx,y+9,1,8,lt);P(xx+5,y+9,1,8,dk);P(xx+1,y+16,4,1,dk);P(xx+1,y+12,4,1,lt);}
  P(x,y+9,w,2,col);P(x,y+9,w,1,lt);
  for(let xx=x+2;xx<x+w-2;xx+=4){P(xx,y+12,2,2,lt);P(xx,y+14,2,1,dk);}
  P(x,y+15,w,1,dk);
}
// porta elevada com portal de pedra: pilastras, frontão com topo visível, bandeira de vidro e o recuo do vão
function rowDoor(P,x,y,col){
  const w=24,h=40,top=y-h;
  P(x+w+5,top-6,3,h+6,SH(.26));P(x-3,top-3,w+11,3,SH(.30));
  P(x-5,top-10,w+10,h+10,'#d8d0c0');P(x-5,top-10,1,h+10,'#f2ecdf');P(x+w+4,top-10,1,h+10,'#a89f90');
  for(const px of [x-5,x+w+1]){P(px,top-8,4,h+8,'#e4dccc');P(px,top-8,1,h+8,'#faf6ee');P(px+3,top-8,1,h+8,'#b8b0a2');for(let k=0;k<h;k+=8)P(px,top+k,4,1,'#c9c0b0');}
  // frontão
  P(x-7,top-14,w+14,2,'#faf6ee');P(x-7,top-12,w+14,3,'#d8d0c0');P(x-7,top-10,w+14,1,'#8f877a');
  // bandeira de vidro em leque
  P(x,top-8,w,7,'#1c2833');for(let k=0;k<5;k++)P(x+2+k*5,top-7,1,6,'#d8d0c0');P(x+2,top-6,4,2,'#7a98b4');
  // vão fundo: a porta fica recuada, com a sombra em cima e à esquerda
  P(x,top,w,h,'#2a1d18');P(x+2,top+2,w-2,h-2,col);
  P(x+2,top+2,w-2,1,'rgba(255,255,255,.18)');
  for(const [px,py] of [[x+4,top+5],[x+14,top+5],[x+4,top+22],[x+14,top+22]]){P(px,py,8,14,'rgba(0,0,0,.20)');P(px,py,8,1,'rgba(0,0,0,.18)');P(px,py+13,8,1,'rgba(255,255,255,.14)');}
  P(x+2,top+2,w-2,3,'rgba(0,0,0,.28)');P(x+2,top+5,2,h-5,'rgba(0,0,0,.22)');
  P(x+20,top+h/2,2,2,'#d4af37');P(x+10,top+3,6,3,'#c9a24a');P(x+11,top+4,4,1,'#3a2a22');
  // soleira de mármore
  P(x-3,y,w+6,2,'#f2ecdf');P(x-3,y+2,w+6,1,'#b8b2a6');
}
// bay window de madeira saindo da parede: topo visto do alto, janelas, mísula embaixo e sombra
function bayWindow(P,x,y,w,h,col,R){
  const lt=shade(col,1.3),dk=shade(col,.62);
  P(x+5,y+3,w,h+6,SH(.30));P(x+w,y+6,5,h,SH(.16));
  P(x-2,y-4,w+4,4,lt);P(x-2,y-4,w+4,1,shade(col,1.6));P(x-2,y,w+4,2,dk);
  P(x,y+2,w,h,col);P(x,y+2,1,h,lt);P(x+w-1,y+2,1,h,dk);
  const n=Math.max(2,Math.round(w/24)),ww=Math.floor((w-6-(n-1)*4)/n);
  for(let i=0;i<n;i++){const wx=x+3+i*(ww+4),lit=R()<.3;P(wx,y+5,ww,h-12,'#2a1d18');P(wx+1,y+6,ww-2,h-14,lit?'#f2cf86':'#4f6c88');
    P(wx+1,y+6+(h-14)/2,ww-2,1,col);P(wx+1,y+6,ww-2,2,'rgba(0,0,0,.25)');P(wx+1,y+8,1,h-16,'rgba(0,0,0,.2)');if(!lit){P(wx+ww-5,y+8,2,1,'#a9c2d6');}
    P(wx-1,y+h-7,ww+2,2,lt);}
  P(x,y+h-2,w,2,dk);
  // painéis embaixo das janelas e a mísula
  for(let i=0;i<n;i++){const wx=x+3+i*(ww+4);P(wx,y+h-4,ww,3,dk);}
  P(x+2,y+h+2,w-4,3,col);P(x+2,y+h+2,w-4,1,lt);P(x+6,y+h+5,w-12,2,dk);
}
// cano de descida da calha: cilindro com luz à esquerda e sombra na parede à direita
function downspout(P,x,y0,y1){P(x+3,y0,2,y1-y0,SH(.24));P(x,y0,3,y1-y0,'#6a6c66');P(x,y0,1,y1-y0,'#a9aba6');P(x+2,y0,1,y1-y0,'#4a4c48');for(let y=y0+10;y<y1;y+=22){P(x-1,y,5,2,'#4a4c48');P(x-1,y,5,1,'#8a8c86');}}
function fireEscape(P,x,y0,y1,w){
  // primeiro a sombra da estrutura na parede, deslocada para baixo e para a direita
  for(let y=y0;y<y1;y+=FLOOR){P(x+4,y+5,w,3,SH(.30));for(let k=0;k<w;k+=4)P(x+k+4,y-7,1,12,SH(.22));P(x+4,y-7,w,1,SH(.22));}
  for(let y=y0;y<y1-FLOOR;y+=FLOOR)for(let k=0;k<FLOOR;k+=4)P(x+w-10+Math.round(k*10/FLOOR),y+k+5,4,1,SH(.18));
  for(let y=y0;y<y1;y+=FLOOR){
    // grade do patamar vista de cima, guarda-corpo e mãos-francesas
    P(x,y-2,w,4,'#2a2b2e');for(let k=1;k<w;k+=3)P(x+k,y-1,1,2,'#45474c');P(x,y+2,w,1,'#1c1d20');
    for(let k=0;k<w;k+=4)P(x+k,y-12,1,10,'#1c1d20');P(x,y-12,w,2,'#1c1d20');P(x,y-12,w,1,'#4a4c50');
    for(const bx of [x+4,x+w-6]){for(let k=0;k<6;k++)P(bx+k,y+3+k,1,1,'#1c1d20');}
  }
  for(let y=y0;y<y1-FLOOR;y+=FLOOR)for(let k=0;k<FLOOR;k+=4){const sx=x+w-14+Math.round(k*10/FLOOR);P(sx,y+k,4,1,'#2a2b2e');P(sx,y+k,4,1,k%8?'#2a2b2e':'#4a4c50');}
}

/* uma fachada inteira; o pé fica na última linha */
function facadeSprite(A,b,sign,door){
  const {S2,refine,outlined,hash,txt,txtW}=A;
  const fl=b.fl||3,h=b.k==='dhpp'?FLOOR*2+70+12:fl*FLOOR+16,w=b.w;
  if(b.k==='dhpp')b.flags=[]; // posição dos panos, preenchida ao desenhar a fachada
  const c=S2(w,h,(P,E,g)=>{
    const R=rnd(b.i*97+13),seed=b.i*31+5;
    if(b.k==='alley'){alley(P,E,w,h,seed,hash);return;}
    if(b.k==='dhpp'){
      // a mesma fachada da base: ripas bege, rodapé, calhas nas pontas, janelas brancas com ar-condicionado
      const cap=['#6e5c4c','#8c7862','#4a3e33'];P(0,0,w,12,cap[0]);P(0,0,w,1,'#241c16');for(let k=0;k<w/3;k++)P(Math.floor(hash(k,1,3)*w),Math.floor(hash(k,2,3)*12),1+(k&1),1,k%3?cap[1]:cap[2]);
      P(0,12,w,h-12,'#b9a58a');for(let yy=16;yy<h-6;yy+=6){P(0,yy,w,1,'rgba(90,70,45,.22)');P(0,yy+1,w,1,'rgba(255,245,225,.10)');}for(let yy=16;yy<h-6;yy+=12)for(let xx=8;xx<w;xx+=32)P(xx+((yy>>2)%2?0:16),yy,1,6,'rgba(90,70,45,.18)');
      for(let k=0;k<w*h/40;k++)P(Math.floor(hash(k,4,9)*w),12+Math.floor(hash(k,5,9)*(h-12)),1,1,'#a58f72');
      // platibanda: o topo visto do alto e a sombra da pingadeira
      P(0,10,w,2,'#9a8670');P(0,12,w,5,SH(.24));
      P(0,h-5,w,5,'#7a6a52');P(0,h-5,w,1,'#8f816b');P(0,h-6,w,1,SH(.2));
      for(const x of [6,w-11])downspout(P,x+1,0,h-5);
      const win=(X,Y,ac)=>{P(X+3,Y+2,24,22,SH(.18));P(X,Y,24,22,'#f2efe6');P(X+2,Y+2,20,18,'#9cc4e0');P(X+11,Y+2,1,18,'#f2efe6');P(X+2,Y+10,20,1,'#f2efe6');
        P(X+15,Y+4,4,2,'#d4e8f6');P(X+2,Y+2,20,2,'rgba(0,0,0,.22)');P(X+2,Y+4,2,16,'rgba(0,0,0,.16)');P(X+21,Y+2,1,18,'rgba(255,255,255,.35)');
        P(X-1,Y+22,26,1,'#f2efe6');P(X-1,Y+23,26,1,'#d8d2c4');P(X-1,Y+24,26,1,'#a89f90');P(X+1,Y+25,26,2,SH(.20));
        if(ac)acUnit(P,X+3,Y+12,18);};
      for(let f=0;f<2;f++)for(let X=24;X<w-40;X+=52){win(X,22+f*FLOOR,hash(X,f,78)<.4);if(hash(X,f,77)<.35)P(X+4,22+f*FLOOR+4,16,6,'rgba(255,214,140,.30)');}
      // térreo: o letreiro e a porta da base, janelas dos lados e as bandeiras
      const gy=h-70;P(0,gy,w,2,'rgba(0,0,0,.18)');
      const sx=Math.round(w/2-sign.width/2),dx=Math.round(w/2-door.width/2),sy=h-door.height-sign.height-8;
      P(sx+4,sy+sign.height,sign.width,4,SH(.30));P(sx+sign.width,sy+4,4,sign.height,SH(.22));
      P(dx-3,h-door.height-4,door.width+6,door.height+4,'#8f816b');P(dx-3,h-door.height-4,door.width+6,1,'#cfc3ad');
      g.drawImage(sign,sx,sy);g.drawImage(door,dx,h-door.height-1);
      P(dx,h-door.height-1,door.width,2,'rgba(0,0,0,.25)');
      for(const X of [30,w-54])win(X,h-42,X<w/2);
      for(const [fx,c1,c2,c3] of [[sx-26,'#2f8a3a','#f2c230','#2f5aa8'],[sx+sign.width+20,'#1c2a4a','#c9ccce','#3a4a6a']]){
        P(fx+4,gy-52,2,h-gy+50,SH(.16));
        P(fx,gy-58,3,h-gy+56,'#c9ccce');P(fx,gy-58,1,h-gy+56,'#eef0f2');P(fx+2,gy-58,1,h-gy+56,'#8a8c86');E(fx+1,gy-59,2,1.5,'#e8c63a');P(fx-3,h-6,9,5,'#6a6e72');P(fx-3,h-6,9,1,'#9a9ea2');
        // o pano tremula no jogo, como as bandeiras da planta (drawFlags)
        b.flags.push({x:fx+3,y:gy-56,c1,c2,c3});}
      return;
    }
    // casa geminada ou loja: parede de tijolo (ou pintada), janelas fundas, cornija com mísulas
    if(b.paint)paintWall(P,0,0,w,h,b.paint,seed,hash);else brickWall(P,0,0,w,h,b.brick,seed,hash);
    // empena entre as casas: a junta funda à esquerda, a quina pegando luz à direita
    P(0,0,2,h,'rgba(0,0,0,.30)');P(2,0,1,h,'rgba(0,0,0,.12)');P(w-1,0,1,h,'rgba(255,235,215,.16)');
    const cols=b.k==='row'?3:Math.max(3,Math.floor(w/42)),cw=w/cols,gy=h-FLOOR-4;
    // base de pedra (soco) com o topo pegando luz
    P(0,h-12,w,12,'#8f8678');P(0,h-12,w,2,'#c2b8a6');P(0,h-10,w,1,'#6e665a');for(let x=8;x<w;x+=24)P(x,h-9,1,9,'#746c60');
    for(let k=0;k<w*2;k++)P(Math.floor(hash(k,seed,41)*w),h-9+Math.floor(hash(seed,k,42)*9),1,1,'rgba(0,0,0,.08)');
    if(b.spout)downspout(P,w-8,14,h-12);
    for(let f=1;f<fl;f++)for(let i=0;i<cols;i++){
      if(b.bay&&f===fl-1&&i>0)continue;
      const x=Math.round(i*cw+cw/2-11),y=18+(f-1)*FLOOR+8,t=R();
      sash(P,x,y,{lit:t<.3,who:t<.12,ac:R()<.22,box:b.boxes&&f===fl-1&&R()<.7,boarded:b.boarded&&f===1&&i===1,curtain:['#b85a4a','#d8c39a','#5a7a9a'][Math.floor(R()*3)]});}
    if(b.bay){const bx=Math.round(cw)+2,bw=w-bx-8;bayWindow(P,bx,18+(fl-2)*FLOOR+4,bw,32,b.bay,R);}
    if(b.escape)fireEscape(P,Math.round(cw*1.05),18+FLOOR+2,h-FLOOR,Math.round(cw*1.9));
    if(b.k==='row'){
      rowDoor(P,10,h-6,b.door);
      for(let i=1;i<3;i++){const x=Math.round(i*cw+cw/2-11);sash(P,x,gy+8,{lit:R()<.25,ac:false,box:b.boxes&&R()<.5,curtain:'#d8c39a'});}
      // janela do porão no soco, com grade
      const bx=w-38;P(bx-1,h-9,24,8,'#2a1d18');P(bx,h-8,22,7,'#1a1c20');P(bx,h-8,22,2,'rgba(0,0,0,.4)');for(let k=1;k<22;k+=3){P(bx+k,h-8,1,7,'#3a3c40');P(bx+k+1,h-8,1,7,SH(.3));}
      cornice(P,0,0,w,b.cor||'#3a2a22');
      return;
    }
    // loja no térreo: pilastras salientes, letreiro saliente, vitrine funda, porta recuada e mureta
    const band=b.band||'#2f5a3a',frame=b.frame||'#3a2e28',fl2=shade(frame,1.45),fd=shade(frame,.6);
    P(0,gy-8,w,h-gy-4,frame);P(0,gy-8,w,1,fl2);
    const vy=gy+16,vh=h-vy-14,dw=22,dxp=b.shop==='market'?w-dw-14:12,vx=b.shop==='market'?12:dxp+dw+6,vw=b.shop==='market'?w-dw-34:w-vx-12;
    // vitrine: o vidro fica no fundo; dentro, a mercadoria, e o vão faz sombra em cima e à esquerda
    P(vx-2,vy-2,vw+4,vh+4,fd);P(vx-2,vy-2,vw+4,1,fl2);
    P(vx,vy,vw,vh,b.shop==='tavern'?'#3a2416':'#2c3a46');
    if(b.shop==='market'){P(vx,vy,vw,vh,'#3a3430');for(let s=0;s<3;s++){P(vx+1,vy+7+s*9,vw-2,2,'#8a7a64');P(vx+1,vy+9+s*9,vw-2,1,'#4a3e34');for(let k=0;k<vw-6;k+=5){const c=['#c0392b','#f2c230','#2f8a3a','#e8e2d4','#2f5aa8','#e08a2a'][(k/5+s*2)%6];P(vx+3+k,vy+1+s*9,4,6,c);P(vx+3+k,vy+1+s*9,4,1,'rgba(255,255,255,.3)');P(vx+6+k,vy+2+s*9,1,5,'rgba(0,0,0,.25)');}}}
    if(b.shop==='laundry'){P(vx,vy,vw,vh,'#8aa4b4');P(vx,vy+vh-22,vw,22,'#c9ccce');P(vx,vy+vh-22,vw,1,'#eef0f2');for(let k=0;k<vw-14;k+=17){E(vx+9+k,vy+vh-11,7,7,'#e8eaec');E(vx+9+k,vy+vh-11,5,5,'#9aa0a6');E(vx+9+k,vy+vh-11,4,4,'#5a7a90');E(vx+8+k,vy+vh-12,1.5,1.5,'#cfe6ee');}P(vx+2,vy+3,vw-4,3,'#d9d6cb');for(let k=0;k<vw-8;k+=9)P(vx+4+k,vy+3,2,4,'#e8e2d4');}
    if(b.shop==='tavern'){P(vx,vy,vw,vh,'#5a3a20');for(let k=0;k<vh;k+=3)P(vx,vy+k,vw,1,'#7a5430');P(vx+vw/2-8,vy+6,16,8,'#ff5a8a');P(vx+vw/2-7,vy+7,14,6,'#ffc0d6');for(let k=0;k<4;k++)P(vx+vw/2-12-k,vy+5+k,1,1,'rgba(255,90,140,.4)');P(vx,vy+vh-8,vw,8,'#3a2416');}
    if(b.shop==='barber'){P(vx,vy,vw,vh,'#8fb0c8');P(vx,vy+vh-16,vw,16,'#e8e2d4');for(let k=0;k<vw;k+=4)P(vx+k,vy+vh-16,2,16,(k/4)%2?'#2a2b2e':'#e8e2d4');P(vx+8,vy+8,10,12,'#5a3a2a');P(vx+8,vy+8,10,2,'#7a5a4a');P(vx+vw-20,vy+8,10,12,'#5a3a2a');P(vx+vw-20,vy+8,10,2,'#7a5a4a');}
    if(b.shop==='pharmacy'){P(vx,vy,vw,vh,'#dceef2');for(let s=0;s<2;s++){P(vx,vy+13+s*12,vw,2,'#9aa0a6');for(let k=0;k<vw-8;k+=6){P(vx+4+k,vy+5+s*12,4,8,['#2f8a3a','#e8e2d4','#c0392b','#2f5aa8'][(k/6+s)%4]);P(vx+4+k,vy+5+s*12,4,1,'rgba(255,255,255,.4)');}}}
    P(vx,vy,vw,4,'rgba(0,0,0,.34)');P(vx,vy+4,3,vh-4,'rgba(0,0,0,.26)');P(vx+vw-1,vy,1,vh,'rgba(255,255,255,.22)');
    for(let k=0;k<3;k++)P(vx+10+k*14,vy+6,2,vh-10,'rgba(255,255,255,.10)');P(vx+vw-18,vy+6,6,1,'rgba(255,255,255,.35)');
    // mureta embaixo da vitrine, saliente
    P(vx-2,vy+vh+2,vw+4,2,fl2);P(vx-2,vy+vh+4,vw+4,h-vy-vh-16,frame);P(vx,vy+vh+6,vw,h-vy-vh-22,fd);P(vx+2,vy+vh+7,vw-4,1,fl2);
    // porta recuada: as paredes do recuo (a da esquerda na sombra, a da direita na luz), o piso visto do alto e a porta no fundo
    const dy=vy-2,dh=h-12-dy;
    P(dxp-2,dy,dw+4,dh,fd);
    for(let j=0;j<dh;j++){const d=Math.round(3+3*(j/dh));P(dxp,dy+j,d,1,'#1c1612');P(dxp+dw-d,dy+j,d,1,shade(frame,1.25));}
    P(dxp+3,dy+3,dw-6,dh-9,'#2e343a');P(dxp+5,dy+5,dw-10,dh-18,'#6f93b3');P(dxp+5,dy+5,dw-10,3,'rgba(0,0,0,.35)');P(dxp+6,dy+9,3,6,'#a7c6dc');P(dxp+dw-8,dy+dh/2,2,4,'#c9ccce');
    for(let k=0;k<6;k++)P(dxp+k*0,dy+dh-6+k,dw,1,k%2?'#c8c2b6':'#9a948a');for(let k=0;k<dw;k+=4)P(dxp+k,dy+dh-6,2,6,'rgba(0,0,0,.08)');
    // pilastras: saem da parede, com capitel e base; a sombra cai na vitrine à direita
    for(const px of [0,w-8]){if(px===0)P(8,gy+6,4,h-gy-18,SH(.30));P(px,gy-10,8,h-gy-2,frame);P(px,gy-10,2,h-gy-2,fl2);P(px+7,gy-10,1,h-gy-2,fd);P(px-1,gy-12,10,3,fl2);P(px-1,gy-9,10,1,fd);P(px-1,h-14,10,2,fl2);}
    // letreiro saliente: topo visto do alto, face com o nome e a sombra embaixo
    const bw=w-20;P(13,gy+10,bw,4,SH(.38));P(10+bw,gy-1,3,12,SH(.22));
    P(10,gy-5,bw,2,shade(band,1.55));P(10,gy-3,bw,13,band);P(10,gy-3,bw,1,shade(band,1.25));P(10,gy+9,bw,1,shade(band,.5));P(10,gy-3,1,13,shade(band,1.2));
    const ink=band==='#e8e2d4'?'#7a2a2a':'#f1ece0',sz=9,tw=txtW(g,b.sign,sz,1.6);
    if(b.shop==='tavern'){for(const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1]])txt(g,b.sign,w/2-tw/2+ox,gy+7.5+oy,sz,'rgba(255,90,140,.35)',1.6);txt(g,b.sign,w/2-tw/2,gy+7.5,sz,'#ff9ec0',1.6);}
    else{txt(g,b.sign,w/2-tw/2+1,gy+8.5,sz,'rgba(0,0,0,.35)',1.6);txt(g,b.sign,w/2-tw/2,gy+7.5,sz,ink,1.6);}
    // toldo listrado saindo da parede: o pano visto do alto, a sanefa recortada e a sombra larga na vitrine
    if(b.shop==='market'||b.shop==='laundry'){const aw=b.shop==='market'?'#2f5a3a':'#2e4a6a',ay=gy+12;
      P(9,ay+13,w-14,9,SH(.36));
      for(let j=0;j<10;j++){const ins=Math.round((9-j)*.4);for(let k=0;k<w-12;k+=8)P(6+k-ins+j*0,ay+j,8,1,(k%16?'#efe8da':aw));P(6,ay+j,w-12,1,`rgba(255,255,255,${.12-j*.012})`);}
      for(let k=0;k<w-12;k+=8){P(6+k,ay+10,8,3,k%16?'#d8d0c0':shade(aw,.8));E(10+k,ay+13,4,2,(k%16)?'#d8d0c0':shade(aw,.8));}
      P(6,ay+10,w-12,1,'rgba(0,0,0,.25)');}
    if(b.shop==='barber'){const px=dxp+dw+1;P(px+4,vy,3,vh,SH(.25));P(px-1,vy-4,7,3,'#c9ccce');P(px,vy-2,5,vh,'#e8e2d4');for(let k=0;k<vh-2;k+=6){P(px,vy-2+k,5,2,'#c0392b');P(px,vy+1+k,5,2,'#2f5aa8');}P(px,vy-2,1,vh,'rgba(255,255,255,.4)');P(px+4,vy-2,1,vh,'rgba(0,0,0,.25)');P(px-1,vy+vh-2,7,3,'#c9ccce');}
    if(b.shop==='pharmacy'){const cx=w-24,cy=gy-30;P(cx+4,cy+4,16,16,SH(.28));P(cx+6,cy+15,10,2,'#1c1d20');P(cx,cy,16,16,'#2f8a3a');P(cx,cy,16,1,'#4fae5a');P(cx+15,cy,1,16,'#1f5a26');P(cx+6,cy+2,4,12,'#f2f2ea');P(cx+2,cy+6,12,4,'#f2f2ea');P(cx+6,cy+16,2,6,'#1c1d20');}
    if(b.shop==='tavern'){const lx=dxp+dw/2;P(lx-4+3,gy+14,10,12,SH(.25));P(lx-1,gy+11,2,4,'#1c1d20');P(lx-4,gy+15,8,9,'#2a2b2e');P(lx-3,gy+16,6,7,'#f2cf86');P(lx-4,gy+15,8,1,'#4a4c50');}
    cornice(P,0,0,w,b.cor||'#3a2a22');
  });
  return outlined(refine(c,b.i*7+3));
}

/* beco entre os prédios: as paredes laterais fugindo para o fundo (a da esquerda na sombra, a da direita no sol),
   o chão visto do alto, um prédio no fim, varal, caçamba e latas */
function alley(P,E,w,h,seed,hash){
  const VX=w/2,VY=Math.round(h*.58),s=.3,proj=(x,y,k)=>[VX+(x-VX)*k,VY+(y-VY)*k];
  const [fx0,fy0]=proj(0,0,s),[fx1,fy1]=proj(w,h,s);
  // céu e o prédio do fundo
  P(0,0,w,h,'#c9d3dc');P(Math.floor(fx0),Math.floor(fy0)-6,Math.ceil(fx1-fx0)+1,Math.ceil(fy1-fy0)+7,'#6a4a3e');
  for(let y=Math.floor(fy0);y<fy1-6;y+=8)for(let x=Math.floor(fx0)+2;x<fx1-2;x+=5)P(x,y,2,3,hash(x,y,seed)<.3?'#d8b878':'#3a3a44');
  for(let X=0;X<Math.ceil(fx0)+1;X++){
    const kk=1-(1-s)*X/fx0;
    for(const side of [0,1]){
      const x=side?w-1-X:X,y0=Math.round(VY+(0-VY)*kk),y1=Math.round(VY+(h-VY)*kk);
      P(x,y0,1,y1-y0,side?'#7e4636':'#4a2a22');
      // fiadas de tijolo fugindo para o fundo
      for(let yc=6;yc<h;yc+=6){const yy=Math.round(VY+(yc-VY)*kk);P(x,yy,1,1,side?'rgba(214,190,170,.28)':'rgba(160,130,110,.18)');}
      // janelas nas paredes laterais
      for(const [ny0,ny1,dz0,dz1] of [[30,52,.25,.5],[82,104,.25,.5],[30,52,.62,.8],[82,104,.62,.8]]){const d=X/fx0;if(d>dz0&&d<dz1){const a=Math.round(VY+(ny0-VY)*kk),b2=Math.round(VY+(ny1-VY)*kk);P(x,a,1,b2-a,side?(hash(ny0,dz0,seed)<.5?'#f2cf86':'#4f6c88'):'#2a3440');P(x,a,1,1,side?'#e8e0d0':'#6a5a50');}}
      if(side===0)P(x,y0,1,y1-y0,`rgba(10,6,4,${.10+.25*(X/fx0)})`);else P(x,y0,1,y1-y0,`rgba(10,6,4,${.25*(X/fx0)})`);
    }
  }
  // chão: concreto molhado com a canaleta no meio, escurecendo no fundo
  for(let y=Math.ceil(fy1);y<h;y++){const k=(y-VY)/(h-VY),l=Math.round(VX-VX*k),r=Math.round(VX+VX*k);P(l,y,r-l,1,'#4e4a46');P(l,y,r-l,1,`rgba(10,8,6,${.45*(1-k)})`);P(Math.round(VX)-1,y,2,1,'#3a3632');if(hash(y,seed,5)<.3)P(l+Math.floor(hash(seed,y,6)*(r-l)),y,2,1,'#5e5a56');}
  // varal com roupa atravessando o beco
  const [lx0,ly0]=proj(0,56,.62),[lx1]=proj(w,56,.62);for(let x=Math.ceil(lx0);x<lx1;x++){const sag=Math.round(Math.sin((x-lx0)/(lx1-lx0)*Math.PI)*3);P(x,ly0+sag,1,1,'#2a2a2a');}
  for(const [cx,col] of [[.35,'#c0392b'],[.55,'#e8e2d4'],[.7,'#2f5aa8']]){const x=Math.round(lx0+(lx1-lx0)*cx),sag=Math.round(Math.sin(cx*Math.PI)*3);P(x,ly0+sag+1,3,4,col);P(x,ly0+sag+1,3,1,'rgba(255,255,255,.3)');}
  // caçamba no meio do caminho e as latas na boca do beco
  {const [cx,cy]=proj(VX-10,h-6,.55);P(cx,cy-9,11,9,'#2f5a3a');P(cx,cy-10,11,2,'#4a7a52');P(cx+10,cy-9,1,9,'#1f3a26');P(cx+1,cy,9,1,SH(.4));}
  for(const [dx,dy,r] of [[8,-6,6],[18,-4,5],[12,-2,4]]){E(dx+1,h+dy+2,r,r*.5,SH(.35));E(dx,h+dy,r,r*.8,'#1c1c1e');E(dx-1,h+dy-1,r*.5,r*.4,'#2c2c30');E(dx-2,h+dy-2,r*.2,r*.15,'#4a4a50');}
  P(w-12,h-26,9,24,'#3a5a3a');P(w-12,h-26,9,2,'#5a7a5a');P(w-12,h-26,1,24,'#4a6a4a');P(w-4,h-24,1,22,'#24382a');P(w-9,h-2,9,2,SH(.35));
}

/* degraus de mármore com corrimão de ferro na frente da porta de cada casa (no chão, na calçada): a câmera é alta,
   então cada degrau mostra o piso (claro) e o espelho (mais escuro); as muretas dos lados têm topo e face, e tudo joga
   sombra na calçada para a direita */
function drawStoop(P,x){
  const n=3,tw=32;
  P(x-tw/2+4,GY+2,tw+8,n*7+4,SH(.22));
  for(let k=0;k<n;k++){const y=GY+k*7,xx=x-tw/2;P(xx,y,tw,4,'#ece8e0');P(xx,y,tw,1,'#fbf8f2');P(xx,y+4,tw,3,'#c9c3b8');P(xx,y+6,tw,1,'#a8a296');
    for(let j=0;j<tw;j+=7)P(xx+j+3,y+1,2,1,'rgba(150,140,130,.25)');}
  for(const s of [-1,1]){const cx=s<0?x-tw/2-5:x+tw/2;P(cx,GY,5,n*7,'#d8d2c6');P(cx,GY,5,1,'#fbf8f2');P(cx,GY+1,s<0?1:5,n*7-1,s<0?'#f2ecdf':'#d8d2c6');P(cx+(s<0?4:0),GY+1,1,n*7-1,'#a8a296');P(cx,GY+n*7-1,5,1,'#8f877a');
    // corrimão de ferro com a sombra
    const rx=cx+2;P(rx+3,GY-6,2,n*7+2,SH(.25));P(rx,GY-10,2,n*7+2,'#1c1d20');P(rx,GY-10,1,n*7+2,'#4a4c50');P(rx-1,GY-12,4,2,'#1c1d20');}
}

/* ---------- carros em 3/4 (teto e lateral), virados para a direita, na unidade da base ---------- */
export const CARS=[
  {id:'viatura',w:112,body:'#eef0ee',pol:true},{id:'taxi',w:106,body:'#e8c63a',taxi:true},
  {id:'sedan-vermelho',w:104,body:'#9a2f2a'},{id:'hatch-azul',w:94,body:'#2f4f7a'},{id:'perua-verde',w:112,body:'#34583a'},
  {id:'sedan-bege',w:102,body:'#c8b48c'},{id:'sedan-cinza',w:106,body:'#6a6e76'},{id:'onibus',w:236,body:'#d8d2c2',bus:true}
];
function carSprite(A,k){
  const {S2,refine,outlined}=A,w=k.w,h=k.bus?92:58;
  const c=S2(w,h,(P,E,g)=>{
    const sh=(c,f)=>{const n=parseInt(c.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,m=v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)));return `rgb(${m(r)},${m(g)},${m(b)})`;};
    const glass='#2a3a4a',gl='#5f7f9a';
    const wheel=(x,y,r)=>{E(x,y,r,r*.92,'#141416');E(x,y,r*.55,r*.5,'#7a7e84');E(x,y,r*.22,r*.2,'#3a3c40');E(x-r*.2,y-r*.25,r*.18,r*.12,'#b9bec4');};
    if(k.bus){
      P(3,2,w-6,22,sh(k.body,1.22));P(3,2,w-6,2,sh(k.body,1.4));P(3,22,w-6,2,sh(k.body,.9));
      for(let i=0;i<3;i++){const x=30+i*62;P(x,6,34,12,'#a9aba6');P(x,6,34,1,'#d2d4cf');P(x,17,34,1,'#7a7c78');for(let j=3;j<32;j+=4)P(x+j,8,2,8,'#8a8c88');}
      P(w-34,6,20,12,sh(k.body,1.05));
      P(1,24,w-2,h-36,k.body);P(1,24,w-2,2,sh(k.body,1.12));P(1,h-30,w-2,8,'#2e5a8a');P(1,h-22,w-2,8,sh(k.body,.7));
      for(let i=0;i<9;i++){P(12+i*23,30,19,22,glass);P(12+i*23,30,19,3,gl);P(13+i*23,34,3,14,'rgba(140,175,200,.3)');}
      P(w-20,30,14,h-50,glass);P(w-20,30,14,3,gl);P(w-13,30,1,h-50,'#1c2028');
      P(w-62,26,40,3,'#1c1d20');for(let i=0;i<5;i++)P(w-59+i*7,27,4,1,'#f2b23a'); // letreiro de linha, sem nome de empresa
      P(w-4,h-34,3,6,'#fff2c0');P(1,h-34,3,6,'#c0392b');wheel(40,h-11,11);wheel(w-46,h-11,11);return;}
    // sedã em 3/4 com a mesma luz do carro da planta: claro em cima e à esquerda, sombra embaixo, contorno escuro
    const C={b:k.body,hi:sh(k.body,1.28),hh:sh(k.body,1.5),sh:sh(k.body,.78),dk:sh(k.body,.55)};
    const RR=(x,y,ww,hh,c,r)=>{for(let j=0;j<hh;j++){const q=j<r?r-j:j>hh-1-r?r-(hh-1-j):0;P(x+q,y+j,ww-2*q,1,c);}};
    const TR=(y0,y1,a0,b0,a1,b1,c)=>{for(let y=y0;y<y1;y++){const u=(y-y0)/Math.max(1,y1-y0-1);P(Math.round(a0+(a1-a0)*u),y,Math.round(b0+(b1-b0)*u)-Math.round(a0+(a1-a0)*u),1,c);}};
    const hatch=k.id.startsWith('hatch'),wagon=k.id.startsWith('perua');
    const top=22,base=h-11,wf=Math.round(w*.79),wr=Math.round(w*(hatch?.2:.19));
    const cx0=Math.round(w*(wagon?.12:hatch?.16:.3)),cx1=Math.round(w*.62);
    // capô e porta-malas vistos de cima, cantos arredondados
    RR(3,9,w-6,top-7,C.hi,4);P(7,9,w-14,1,C.hh);P(w-16,11,10,1,'rgba(255,255,255,.35)');
    for(let y=10;y<top+2;y++){P(3+(y<13?13-y:0),y,2,1,C.hh);P(w-5-(y<13?13-y:0),y,2,1,C.b);}
    // cabine: vidros inclinados e o teto
    TR(2,top+1,cx0-1,cx1+3,cx0-(wagon?2:10),cx1+14,'#1c2833');
    RR(cx0,1,cx1-cx0,top-5,C.hi,3);P(cx0+3,2,cx1-cx0-6,1,C.hh);P(cx0+2,top-5,cx1-cx0-4,1,C.sh);P(cx1-2,4,1,top-10,C.b);
    for(let j=0;j<6;j++)P(cx1+2+j,4+j*2,2,2,'rgba(150,185,210,.55)');P(cx0-2,8,3,1,'rgba(150,185,210,.35)');
    // lateral: ombro claro, vidros com colunas, friso, porta, saia escura
    for(let y=top;y<base;y++){const u=(y-top)/(base-top),ins=y<top+3?top+3-y:0,cut=y>base-4?y-(base-4):0;
      const l=2+ins+cut,r=w-2-ins-cut;P(l,y,r-l,1,u<.08?C.hh:u<.62?C.b:u<.86?C.sh:C.dk);P(l,y,1,1,C.hi);P(r-1,y,1,1,C.dk);}
    const gy0=top+2,gy1=top+11;
    TR(gy0,gy1,cx0-(wagon?1:7),cx1+10,cx0-(wagon?3:10),cx1+13,'#1c2833');
    P(cx0-(wagon?3:10),gy1,cx1-cx0+(wagon?16:23),1,'#c9ccce');
    const mid=Math.round((cx0+cx1)/2)+(wagon?8:0);P(mid,gy0,3,gy1-gy0,C.b);if(wagon)P(cx0+12,gy0,3,gy1-gy0,C.b);
    for(const x of [cx0+2,mid+5])P(x,gy0+1,4,1,'rgba(150,185,210,.5)');
    P(mid+1,gy1+1,1,base-gy1-6,C.dk);P(cx0-6,gy1+1,1,base-gy1-6,C.dk);P(cx1+13,gy1+1,1,base-gy1-6,C.dk);
    P(mid-9,gy1+4,5,1,C.dk);P(mid-9,gy1+3,5,1,C.hh);P(cx1+4,gy1+4,5,1,C.dk);P(cx1+4,gy1+3,5,1,C.hh);
    P(cx1+12,gy0-1,4,3,C.dk);P(cx1+12,gy0-1,4,1,C.hi);
    // faróis, lanternas e para-choques cromados
    P(w-6,top+4,4,5,'#f4ecc8');P(w-5,top+5,2,2,'#fffbe8');P(2,top+4,4,6,'#b0302a');P(3,top+5,2,2,'#ff7a6a');
    P(w-7,base-8,6,4,'#cfd3cf');P(w-7,base-8,6,1,'#f2f4f2');P(1,base-8,6,4,'#cfd3cf');P(1,base-8,6,1,'#f2f4f2');
    if(k.pol){P(cx0+6,0,cx1-cx0-12,3,'#26282c');P(cx0+7,0,(cx1-cx0-14)/2,2,'#c0392b');P(cx0+7+(cx1-cx0-14)/2,0,(cx1-cx0-14)/2,2,'#2f5aa8');
      P(3,base-9,w-6,3,'#1e3f7a');P(3,base-9,w-6,1,'#2f5aa8');}
    if(k.taxi){const tx=Math.round((cx0+cx1)/2)-7;P(tx,0,14,4,'#1c1d20');P(tx+1,1,12,2,'#f6eccc');
      for(let x=6;x<w-6;x+=6)P(x,gy1+6,3,2,'#1c1d20');for(let x=9;x<w-6;x+=6)P(x,gy1+8,3,2,'#1c1d20');}
    // caixa de roda escura e as rodas
    for(const x of [wr,wf]){E(x,base-1,12,10,'#121214');wheel(x,h-10,10);}
  });
  return outlined(refine(c,k.w));
}

/* ---------- lampião, árvore e mobiliário (sprites com o pé no fim) ---------- */
function lampSprite(A){return A.outlined(A.refine(A.S2(22,170,(P,E)=>{
  P(9,30,4,134,'#1c1d20');P(9,30,1,134,'#3a3c40');P(6,160,10,10,'#1c1d20');P(5,166,12,4,'#2a2b2e');P(7,40,8,3,'#2a2b2e');
  P(5,4,12,4,'#1c1d20');E(11,16,7,10,'#f6eccc');E(11,14,4,6,'#fffbe8');P(5,24,12,3,'#1c1d20');P(8,27,6,4,'#2a2b2e');E(11,2,3,2,'#1c1d20');
}),1));}
function treeSprite(A,seed){return A.outlined(A.S2(84,150,(P,E)=>{
  const R=A.mulberry32(seed);
  P(36,124,14,18,'#5a3a22');P(36,124,4,18,'#7a5232');P(40,88,8,40,'#5a3a22');P(40,88,3,40,'#7a5232');P(30,96,12,3,'#5a3a22');P(46,92,12,3,'#5a3a22');
  A.bush(P,E,42,60,40,R,['#24461f','#356a2e','#4a8a3c','#69ad52','#8ccb6a']);
}));}
function pitSprite(A){return A.S2(40,12,(P)=>{P(0,0,40,12,'#8a5a3a');P(2,2,36,8,'#3a2a1c');for(let k=0;k<20;k++)P(3+(k*7)%34,3+(k*3)%6,2,1,'#4a3424');for(let x=0;x<40;x+=8)P(x,0,1,12,'#6a4a2a');});}
function propSprite(A,k){
  const {S2,refine,outlined}=A;
  const d={
    hydrant:[14,24,(P,E)=>{P(3,8,8,14,'#e8c63a');P(1,10,12,3,'#e8c63a');E(7,7,4,3,'#c9a22a');P(5,3,4,3,'#c0392b');P(2,22,10,2,'#9a7a1a');P(4,9,2,12,'#f6dc6a');}],
    can:[18,30,(P)=>{P(2,4,14,25,'#2f3a34');P(1,2,16,4,'#3a4a40');for(let x=4;x<16;x+=3)P(x,8,1,19,'#24302a');P(3,6,2,21,'#4a5a50');}],
    news:[18,34,(P)=>{P(2,6,14,22,'#2f5aa8');P(2,6,14,2,'#5a80c8');P(4,10,10,8,'#e8e2d4');P(5,12,8,1,'#777');P(5,14,6,1,'#777');P(4,28,2,6,'#3a3c40');P(12,28,2,6,'#3a3c40');}],
    news2:[18,34,(P)=>{P(2,6,14,22,'#b8392b');P(2,6,14,2,'#d85a4a');P(4,10,10,8,'#e8e2d4');P(5,12,8,1,'#777');P(5,14,6,1,'#777');P(4,28,2,6,'#3a3c40');P(12,28,2,6,'#3a3c40');}],
    bench:[56,24,(P)=>{P(2,2,52,4,'#5a3a22');P(2,8,52,4,'#6a4a2a');P(2,13,52,3,'#7a5432');P(4,16,3,8,'#1c1d20');P(49,16,3,8,'#1c1d20');P(4,2,2,12,'#1c1d20');P(50,2,2,12,'#1c1d20');}]
  }[k];
  return outlined(refine(S2(d[0],d[1],d[2]),k.length));
}

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
  const lamp=lampSprite(art),pit=pitSprite(art),trees=TREES.map((x,i)=>({x,spr:treeSprite(art,x*7+i)}));
  const props=PROPS.map(p=>({...p,spr:propSprite(art,p.k),y:CURB-10}));
  const layer=buildStatic();

  function buildStatic(){
    const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
    const R=rnd(5),P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
    const E=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,7);c.fill();};
    // céu de manhã e a silhueta da cidade ao fundo (torres e caixas d'água), atrás das casas
    const g=c.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#8fa9c4');g.addColorStop(1,'#f0d2a8');c.fillStyle=g;c.fillRect(0,0,STREET_W,GY);
    for(let x=0;x<STREET_W;){const w=24+R()*60,h=40+R()*120;P(x,GY-60-h,w,h+60,R()<.5?'#a9b3c2':'#9aa5b6');for(let y=GY-60-h+6;y<GY-60;y+=7)for(let xx=x+4;xx<x+w-4;xx+=6)if(R()<.22)P(xx,y,2,3,'#d8dde4');
      if(R()<.25){P(x+w/2-6,GY-60-h-14,12,12,'#8a96a8');P(x+w/2-7,GY-60-h-16,14,3,'#7a869a');}x+=w+3;}
    // fachadas, com o pé na calçada
    // no alto das casas, atrás da cornija: chaminés de tijolo, antenas e uma caixa d'água (o volume dos telhados)
    for(const b of BUILDINGS){if(b.k!=='row'&&b.k!=='shop')continue;const top=GY-facades[b.i].height+2,Rb=rnd(b.i*13+7);
      for(let n=0;n<1+(Rb()<.5);n++){const x=b.X+8+Math.floor(Rb()*(b.w-24)),hh=10+Math.floor(Rb()*8);
        P(x+8,top-hh+3,3,hh-2,'rgba(24,12,6,.25)');P(x,top-hh,9,hh+2,'#7a3a2a');P(x,top-hh,2,hh+2,'#9a5240');P(x+8,top-hh,1,hh+2,'#4a2218');
        for(let y=top-hh+3;y<top;y+=3)P(x,y,9,1,'rgba(214,190,170,.25)');P(x-1,top-hh-2,11,3,'#5a5a5e');P(x-1,top-hh-2,11,1,'#8a8a8e');}
      if(Rb()<.4){const x=b.X+b.w-20;P(x,top-22,1,22,'#2a2b2e');P(x-6,top-20,13,1,'#2a2b2e');P(x-4,top-16,9,1,'#2a2b2e');}
      if(b.w>=130&&Rb()<.8){const x=b.X+b.w/2-12;for(const lx of [x+2,x+20])P(lx,top-10,2,10,'#3a2a22');P(x,top-30,24,20,'#8a6a4a');P(x,top-30,4,20,'#a8865e');P(x+21,top-30,3,20,'#5a4430');for(let y=top-28;y<top-10;y+=4)P(x,y,24,1,'#6a5038');E(x+12,top-31,12,3,'#5a4430');E(x+12,top-34,8,3,'#4a3a2a');P(x+24,top-27,3,16,'rgba(24,12,6,.22)');}}
    for(const b of BUILDINGS){const f=facades[b.i];c.drawImage(f,b.X-1,GY-f.height+1);}
    // calçada de concreto vista de cima: placas, desgaste, manchas, rachaduras e a sombra no pé das fachadas
    P(0,GY,STREET_W,SIDE,'#b4aea2');
    const SH=20,SW=40;
    for(let y=GY,r=0;y<CURB;y+=SH,r++){P(0,y,STREET_W,1,'#a19b8f');P(0,y+1,STREET_W,1,'#c2bcb0');
      for(let x=(r%2)*20;x<STREET_W;x+=SW){P(x,y,1,SH,'#a19b8f');P(x+1,y,1,SH,'#c2bcb0');const t=R();if(t<.22)P(x+2,y+2,SW-3,SH-3,t<.11?'rgba(120,110,96,.13)':'rgba(255,250,240,.10)');}}
    for(let i=0;i<STREET_W*2;i++)P(R()*STREET_W,GY+2+R()*(SIDE-4),R()<.7?1:2,1,R()<.5?'#a8a296':'#bdb7ab');
    for(let i=0;i<STREET_W/30;i++){const x=R()*STREET_W,y=GY+8+R()*(SIDE-16);c.fillStyle='rgba(70,62,52,.13)';c.beginPath();c.ellipse(x,y,6+R()*14,2+R()*4,0,0,7);c.fill();}
    for(let i=0;i<STREET_W/40;i++){let x=R()*STREET_W,y=GY+6+R()*(SIDE-12);for(let k=0;k<9;k++){P(x,y,2,1,'#8f897d');P(x,y+1,2,1,'rgba(255,255,255,.18)');x+=2;y+=R()<.5?1:-1;}}
    P(0,GY,STREET_W,4,'rgba(0,0,0,.24)');P(0,GY+4,STREET_W,5,'rgba(0,0,0,.10)');
    // degraus de mármore das casas e canteiros das árvores
    for(const b of BUILDINGS)if(b.k==='row')drawStoop(P,b.X+22);
    for(const x of TREES)c.drawImage(pit,x-20,CURB-20);
    // meio-fio de granito em blocos, com a face virada para a câmera
    P(0,CURB,STREET_W,5,'#c8c2b6');P(0,CURB,STREET_W,1,'#e2ddd2');P(0,CURB+5,STREET_W,10,'#8a857a');P(0,CURB+5,STREET_W,1,'#a49e92');P(0,CURB+14,STREET_W,1,'#5a564e');
    for(let x=0;x<STREET_W;x+=43){P(x,CURB,1,15,'#6e6a60');P(x+1,CURB+5,1,9,'#9a958a');}
    // asfalto com grão, sarjeta, linha das vagas, faixa dupla amarela, remendos e bueiros
    P(0,ROAD,STREET_W,STREET_H-ROAD,'#4a4c52');
    for(let i=0;i<STREET_W*5;i++)P(R()*STREET_W,ROAD+R()*(STREET_H-ROAD),1,1,R()<.5?'#55575d':'#404248');
    for(let i=0;i<STREET_W/6;i++)P(R()*STREET_W,ROAD+R()*(STREET_H-ROAD),2,1,'#5a5c62');
    for(let i=0;i<STREET_W/180;i++){const x=R()*STREET_W,y=ROAD+20+R()*(STREET_H-ROAD-40);P(x,y,30+R()*40,10+R()*14,'rgba(30,30,34,.25)');}
    P(0,ROAD,STREET_W,6,'#3a3c40');P(0,ROAD+6,STREET_W,1,'#45474c');
    for(let x=0;x<STREET_W;x+=130)P(x,ROAD+8,2,58,'rgba(232,232,224,.45)');
    P(0,ROAD+150,STREET_W,2,'#d8b43a');P(0,ROAD+154,STREET_W,2,'#d8b43a');
    for(let i=0;i<STREET_W/80;i++){const x=R()*STREET_W,y=ROAD+12+R()*(STREET_H-ROAD-22);c.fillStyle='rgba(20,20,24,.26)';c.beginPath();c.ellipse(x,y,10+R()*18,3+R()*5,0,0,7);c.fill();}
    for(let x=350;x<STREET_W;x+=640){P(x,ROAD+84,30,12,'#34363a');P(x+2,ROAD+86,26,8,'#55575d');for(let k=0;k<26;k+=4)P(x+2+k,ROAD+86,2,8,'#34363a');}
    return cv;
  }

  // gente: o MESMO boneco da base (46 px, quadros de andar), com as cores de cada um
  const lemos={x:DHPP.X-70,y:WALK[0]+30,dir:1,walk:0,moving:false,frames:personFrames(lemosLook),tx:null,ty:null,enter:false};
  const sprCache={};const carOf=k=>sprCache[k.id]||(sprCache[k.id]=carSprite(art,k));
  const parked=[[0,DHPP.X+40],[2,300],[6,1600],[5,2300]].filter(([,x])=>x<STREET_W-120).map(([i,x])=>({kind:CARS[i],x,y:PARK,spr:carOf(CARS[i])}));
  const viatura=parked[0];
  const R=rnd(17);
  const peds=Array.from({length:16},(_,i)=>({x:R()*STREET_W,y:WALK[0]+6+R()*(WALK[1]-WALK[0]-6),dir:R()<.5?-1:1,v:(16+R()*14),walk:R()*10,frames:personFrames(i<PED_LOOKS.length?PED_LOOKS[i]:randomLook(R)),pause:0,id:i}));
  const cars=[];const moving=CARS.slice(1);
  for(let l=0;l<LANES.length;l++)for(let i=0;i<3;i++){const kind=moving[(l*4+i)%moving.length],v=LANES[l].v*(0.85+R()*0.3);cars.push({kind,spr:carOf(kind),lane:l,x:i*STREET_W/3+R()*260,v,v0:v});}
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
    ctx.drawImage(layer,0,0);
    const ents=[],shadow=(x,y,rx,ry,a)=>{ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();};
    for(const x of LAMPS)ents.push({y:CURB-6,d:()=>{shadow(x+16,CURB-6,14,3,.18);ctx.drawImage(lamp,x-11,CURB-6-lamp.height);}});
    for(const tr of trees)ents.push({y:CURB-10,d:()=>{shadow(tr.x+18,CURB-12,30,6,.16);ctx.drawImage(tr.spr,tr.x-42,CURB-10-tr.spr.height);}});
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
  return {update,draw,tap,place,lemos,door:DOOR,get view(){return lastView;},get cars(){return cars;},parked};
}
