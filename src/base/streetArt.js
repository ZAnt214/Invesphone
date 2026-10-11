/* Arte da Rua do DHPP: pixel art desenhada em código, na mesma unidade de pixel da planta (o Lemos tem 46 px) e com as
   mesmas funções de acabamento da base (S2, refine, outlined, bush), que chegam em `A`.
   Luz: o sol vem do alto à esquerda, como na planta, e a câmera é alta. O que sai da parede mostra o topo claro e joga
   sombra para baixo e para a direita; o que entra na parede tem a sombra do vão no alto e à esquerda. */
export const GY=420;                       // pé das fachadas = começo da calçada
export const SIDE=100;                     // fundura da calçada
export const CURB=GY+SIDE;                 // beira da calçada (topo do meio-fio)
export const ROAD=CURB+15;                 // começo do asfalto (depois da face do meio-fio)
export const WALK=[GY+18,CURB-16];         // faixa da calçada onde dá para andar
export const PARK=ROAD+54;                 // faixa de estacionamento, encostada no meio-fio
export const LANES=[{y:ROAD+122,dir:1,v:96},{y:ROAD+190,dir:-1,v:108}];
export const STREET_H=ROAD+200;
export const FLOOR=52;                     // altura de um andar (a mesma faixa de parede da base)

export function rnd(seed){let s=seed%2147483647||7;return ()=>(s=s*16807%2147483647)/2147483647;}

/* ---------- peças de fachada (pixel art em px da base) ----------
   Profundidade: o sol vem do alto à esquerda, como na planta. Tudo que sai da parede (cornija, vergas, peitoris,
   bay windows, ar-condicionado, toldos, escadas de incêndio) mostra o topo claro (a câmera é alta) e joga sombra
   para baixo e para a direita; tudo que entra na parede (janelas, portas, vitrines) tem a sombra do vão no alto e
   à esquerda e o batente claro à direita. */
export const SH=a=>`rgba(24,12,6,${a})`;
export function shade(c,f){const n=parseInt(c.slice(1),16),m=v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)));return `rgb(${m(n>>16)},${m(n>>8&255)},${m(n&255)})`;}
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
  // mainéis (6 sobre 6), persiana meio baixada, vaso no peitoril, placa de aluga-se
  if(!o.boarded&&o.type==='six'){for(const yy of [y+2,y+h/2+1]){const hh=h/2-3;P(x+2+Math.round((w-4)/3),yy,1,hh,'#ece6da');P(x+2+Math.round((w-4)*2/3),yy,1,hh,'#ece6da');P(x+2,yy+Math.round(hh/2),w-4,1,'#ece6da');}}
  if(!o.boarded&&o.blind){const bh=Math.round(h*(.2+.25*o.blind));P(x+2,y+2,w-4,bh,'#e8e2d0');for(let k=y+4;k<y+2+bh;k+=2)P(x+2,k,w-4,1,'#c9c2b0');P(x+2,y+1+bh,w-4,1,'#a89f90');P(x+w/2,y+2+bh,1,3,'#8a8274');}
  if(!o.boarded&&o.rent){P(x+3,y+h/2+3,w-6,8,'#f2f0e8');P(x+4,y+h/2+4,w-8,2,'#c0392b');P(x+4,y+h/2+7,w-10,1,'#555');P(x+4,y+h/2+9,w-12,1,'#555');}
  // sombra do vão: em cima (verga) e à esquerda; batente direito pegando luz
  P(x,y,w,3,'rgba(0,0,0,.30)');P(x,y+3,2,h-3,'rgba(0,0,0,.24)');P(x+w-1,y,1,h,'rgba(255,240,220,.30)');
  if(o.type==='arch'){
    // arco abatido de tijolos em cutelo (sem pedra), comum nas casas mais antigas
    const R0=w*.9,span=w/2+3;for(let dx=-span;dx<span;dx++){const lift=Math.round(Math.sqrt(R0*R0-dx*dx)-Math.sqrt(R0*R0-span*span));for(let k=0;k<5;k++)P(x+w/2+dx,y-2-lift-k,1,1,k===4?'#efe0cc':((dx+span)>>1)%2?shade(o.brick||'#8e3b2c',.82):shade(o.brick||'#8e3b2c',1.12));P(x+w/2+dx+2,y-1-lift+1,1,1,SH(.18));}
    P(x-1,y-2,w+2,2,'#2a1d18');
  }else{
  // verga com chave
  P(x-4,y-6,w+8,6,'#d8d0c0');P(x-4,y-6,w+8,2,'#f2ecdf');P(x-4,y-1,w+8,1,'#a89f90');
  P(x+w/2-3,y-7,6,8,'#e4dccc');P(x+w/2-3,y-7,6,1,'#faf6ee');P(x+w/2+2,y-6,1,7,'#b8b0a2');}
  // venezianas abertas dos lados, com as palhetas e a sombra
  if(o.shut){for(const sx of [x-11,x+w+2]){P(sx+2,y+2,9,h,SH(.22));P(sx,y,9,h,o.shut);P(sx,y,1,h,shade(o.shut,1.4));P(sx+8,y,1,h,shade(o.shut,.6));for(let k=y+3;k<y+h-2;k+=3)P(sx+1,k,7,1,shade(o.shut,.7));P(sx+1,y+h/2,7,1,shade(o.shut,1.3));}}
  // peitoril saliente: topo claro, face, aresta de baixo escura
  P(x-4,y+h,w+8,2,'#f2ecdf');P(x-4,y+h+2,w+8,2,'#cfc6b6');P(x-4,y+h+4,w+8,1,'#8f877a');
  if(o.plant&&!o.box){P(x+w-9,y+h-6,7,6,'#a85a3a');P(x+w-9,y+h-6,7,1,'#c87a5a');P(x+w-10,y+h-11,9,5,'#3a6a2e');P(x+w-9,y+h-12,3,2,'#69ad52');P(x+w-5,y+h-13,2,3,'#69ad52');}
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

// traço de pixel (pichação, fios, varal)
export function line(P,x0,y0,x1,y1,t,col){const n=Math.max(1,Math.ceil(Math.max(Math.abs(x1-x0),Math.abs(y1-y0))));for(let i=0;i<=n;i++)P(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),t,t,col);}
// pichação: um "tag" em laço, contorno escuro e miolo colorido, às vezes com sublinhado
export function tag(P,x,y,w,h,R,col,out){
  const pts=[[x+2,y+h*(.4+R()*.3)]];let px=pts[0][0];
  while(px<x+w-4){px+=2+R()*5;pts.push([Math.min(x+w-2,px),y+2+R()*(h-4)]);}
  for(const t of [[2,out||'#1c1d20'],[1,col]])for(let i=1;i<pts.length;i++)line(P,pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1],t[0],t[1]);
  if(R()<.5){line(P,x+1,y+h-1,x+w-3,y+h-3,2,out||'#1c1d20');line(P,x+1,y+h-1,x+w-3,y+h-3,1,col);}
}
// cartaz colado (show, aluga-se, achados), com a ponta rasgada
export function poster(P,x,y,w,h,col,R){
  P(x+1,y+1,w,h,SH(.2));P(x,y,w,h,'#ece6d6');P(x,y,w,Math.round(h*.35),col);P(x+2,y+2,w-4,1,'rgba(255,255,255,.4)');
  for(let k=Math.round(h*.45);k<h-2;k+=2)P(x+2,y+k,w-4-Math.floor(R()*5),1,'#8a8478');
  if(R()<.5){P(x+w-3,y+h-3,3,3,'#b8b0a0');P(x+w-3,y+h-3,1,3,SH(.25));}
}
// arco ogival (igreja): a largura de cada linha, com o fecho no alto
export function pointed(P,cx,yTop,w,hh,col){const r=w,ah=Math.round(w*.866);for(let y=0;y<hh;y++){let hw=w/2;if(y<ah){const z=ah-y;hw=Math.sqrt(Math.max(0,r*r-z*z))-w/2;}if(hw>0)P(Math.round(cx-hw),yTop+y,Math.round(hw*2),1,col);}}
// cantaria: blocos de pedra com junta, cada um com o tom próprio, aresta de cima clara
export function stoneWall(P,x,y,w,h,base,seed,hash){
  P(x,y,w,h,base);
  for(let yy=y,r=0;yy<y+h;yy+=8,r++)for(let xx=x-((r%2)?9:0);xx<x+w;xx+=18){const bx=Math.max(x,xx+1),bw=Math.min(xx+18,x+w)-bx;if(bw<=0)continue;const t=hash(xx+70,yy,seed);
    if(t<.4)P(bx,yy+1,bw,7,t<.2?'rgba(0,0,0,.08)':'rgba(255,250,235,.08)');P(bx,yy+1,bw,1,'rgba(255,250,235,.16)');P(xx,yy+1,1,7,'rgba(60,54,46,.35)');}
  for(let yy=y;yy<y+h;yy+=8)P(x,yy,w,1,'rgba(60,54,46,.35)');
  for(let k=0;k<w*h/30;k++)P(x+Math.floor(hash(k,seed,51)*w),y+Math.floor(hash(seed,k,52)*h),1,1,'rgba(40,36,30,.10)');
}
// mansarda de ardósia com lucarnas: escamas, o recorte das águas e a crista de ferro
export function mansard(P,x,y,w,h,n,R,trim){
  for(let yy=0;yy<h;yy++){const ins=Math.round(4*(1-yy/h)),c=yy%4<2?'#4a4a58':'#545466';P(x+ins,y+yy,w-ins*2,1,c);}
  for(let yy=2;yy<h;yy+=4)for(let xx=x+4+((yy>>2)%2?3:0);xx<x+w-4;xx+=6){P(xx,y+yy,4,1,'#62627a');P(xx,y+yy+2,4,1,'#3a3a48');}
  P(x,y,w,2,'#2a2a30');for(let xx=x+3;xx<x+w-3;xx+=4){P(xx,y-4,1,4,'#1c1d20');P(xx-1,y-5,3,1,'#1c1d20');}
  const cw=w/n;for(let i=0;i<n;i++){const dx=Math.round(x+i*cw+cw/2-9),dy=y+8;
    P(dx+4,dy+3,18,h-10,SH(.28));
    P(dx-2,dy-4,22,5,trim);P(dx-2,dy-4,22,1,shade(trim,1.4));E2(P,dx+9,dy-4,11,4,trim);
    P(dx,dy+1,18,h-12,trim);P(dx,dy+1,1,h-12,shade(trim,1.3));P(dx+17,dy+1,1,h-12,shade(trim,.6));
    const lit=R()<.3;P(dx+3,dy+4,12,h-18,'#2a1d18');P(dx+4,dy+5,10,h-20,lit?'#f2cf86':'#4f6c88');P(dx+9,dy+5,1,h-20,trim);P(dx+4,dy+5+Math.round((h-20)/2),10,1,trim);P(dx+4,dy+5,10,2,'rgba(0,0,0,.3)');
    P(dx-1,dy+h-14,20,2,shade(trim,1.4));P(dx-1,dy+h-12,20,1,shade(trim,.6));}
}
// meia elipse cheia (frontão curvo) sem precisar do E do S2
function E2(P,cx,cy,rx,ry,col){for(let y=-ry;y<=0;y++){const hw=Math.round(rx*Math.sqrt(1-(y*y)/(ry*ry)));P(cx-hw,cy+y,hw*2,1,col);}}

/* altura de cada fachada (o pé na calçada) */
export function facadeH(b){return b.k==='dhpp'?FLOOR*2+82:b.k==='church'?330:b.gap?b.h:(b.fl||3)*FLOOR+16;}

/* uma fachada inteira; o pé fica na última linha */
export function facadeSprite(A,b,sign,door){
  const {S2,refine,outlined,hash,txt,txtW}=A;
  const fl=b.fl||3,h=facadeH(b),w=b.w;
  if(b.k==='dhpp')b.flags=[]; // posição dos panos, preenchida ao desenhar a fachada
  const c=S2(w,h,(P,E,g)=>{
    const R=rnd(b.i*97+13),seed=b.i*31+5;
    if(b.gap){gapSprite(P,E,g,A,b,w,h,seed,hash,R);return;}
    if(b.k==='dhpp'){dhppFacade(P,E,g,b,w,h,sign,door,hash);return;}
    if(b.k==='loft'){loftFacade(P,E,g,A,b,w,h,seed,hash,R);return;}
    if(b.k==='church'){churchFacade(P,E,g,A,b,w,h,seed,hash,R);return;}
    // casa geminada ou loja: parede de tijolo (ou pintada), janelas fundas, cornija com mísulas
    if(b.paint)paintWall(P,0,0,w,h,b.paint,seed,hash);else brickWall(P,0,0,w,h,b.brick,seed,hash);
    // empena entre as casas: a junta funda à esquerda, a quina pegando luz à direita
    P(0,0,2,h,'rgba(0,0,0,.30)');P(2,0,1,h,'rgba(0,0,0,.12)');P(w-1,0,1,h,'rgba(255,235,215,.16)');
    const cols=b.k==='row'?(w<90?2:3):Math.max(3,Math.floor(w/42)),cw=w/cols,gy=h-FLOOR-4;
    // base de pedra (soco) com o topo pegando luz
    P(0,h-12,w,12,'#8f8678');P(0,h-12,w,2,'#c2b8a6');P(0,h-10,w,1,'#6e665a');for(let x=8;x<w;x+=24)P(x,h-9,1,9,'#746c60');
    for(let k=0;k<w*2;k++)P(Math.floor(hash(k,seed,41)*w),h-9+Math.floor(hash(seed,k,42)*9),1,1,'rgba(0,0,0,.08)');
    if(b.spout)downspout(P,w-8,14,h-12);
    const top0=b.mansard?FLOOR:0; // com mansarda, o último andar é o telhado de ardósia
    for(let f=1;f<fl;f++)for(let i=0;i<cols;i++){
      if(b.mansard&&f===1)continue;
      if(b.bay&&f===fl-1&&i>0)continue;
      const x=Math.round(i*cw+cw/2-11),y=18+(f-1)*FLOOR+8,t=R();
      sash(P,x,y,{type:b.win,brick:b.brick,shut:b.shut,lit:t<.3,who:t<.12,ac:R()<.2,box:b.boxes&&f===fl-1&&R()<.7,boarded:b.boarded&&f===fl-1&&i===1,
        blind:R()<.35?R():0,plant:R()<.2,rent:b.rent&&f===fl-1&&i===0,curtain:['#b85a4a','#d8c39a','#5a7a9a','#e8e2d4'][Math.floor(R()*4)]});}
    if(b.bay){const bx=Math.round(cw)+2,bw=w-bx-8;bayWindow(P,bx,18+(fl-2)*FLOOR+4,bw,32,b.bay,R);}
    if(b.escape)fireEscape(P,Math.round(cw*1.05),18+FLOOR+2+top0,h-FLOOR,Math.round(cw*1.9));
    if(b.k==='row'){
      rowDoor(P,10,h-6,b.door);
      // arandela ao lado da porta
      P(42,h-48,4,6,'#1c1d20');P(43,h-47,2,4,'#f6e2a8');P(41,h-49,6,1,'#1c1d20');P(46,h-46,2,6,SH(.2));
      for(let i=1;i<cols;i++){const x=Math.round(i*cw+cw/2-11);sash(P,x,gy+8,{type:b.win,brick:b.brick,shut:b.shut,lit:R()<.25,box:b.boxes&&R()<.5,blind:R()<.5?R():0,plant:R()<.3,curtain:'#d8c39a'});}
      // janela do porão no soco, com grade
      const bx=w-38;P(bx-1,h-9,24,8,'#2a1d18');P(bx,h-8,22,7,'#1a1c20');P(bx,h-8,22,2,'rgba(0,0,0,.4)');for(let k=1;k<22;k+=3){P(bx+k,h-8,1,7,'#3a3c40');P(bx+k+1,h-8,1,7,SH(.3));}
      if(b.tag)tag(P,w-60,h-11,26,9,R,b.tag);
    }else shopFront(P,E,g,A,b,w,h,gy,R);
    if(b.mansard){mansard(P,0,0,w,FLOOR+2,cols,R,b.trim||'#e8e2d4');cornice(P,0,FLOOR-4,w,b.cor||'#3a2a22');}
    else cornice(P,0,0,w,b.cor||'#3a2a22');
  });
  return outlined(refine(c,b.i*7+3));
}

function dhppFacade(P,E,g,b,w,h,sign,door,hash){
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
}

// térreo de loja: pilastras salientes, letreiro saliente, vitrine funda, porta recuada e mureta
function shopFront(P,E,g,A,b,w,h,gy,R){
  const {txt,txtW}=A;
  const band=b.band||'#2f5a3a',frame=b.frame||'#3a2e28',fl2=shade(frame,1.45),fd=shade(frame,.6);
  P(0,gy-8,w,h-gy-4,frame);P(0,gy-8,w,1,fl2);
  const vy=gy+16,vh=h-vy-14,dw=22,dxp=b.shop==='market'||b.shop==='deli'?w-dw-14:12,vx=dxp>20?12:dxp+dw+6,vw=dxp>20?w-dw-34:w-vx-12;
  // vitrine: o vidro fica no fundo; dentro, a mercadoria, e o vão faz sombra em cima e à esquerda
  P(vx-2,vy-2,vw+4,vh+4,fd);P(vx-2,vy-2,vw+4,1,fl2);
  P(vx,vy,vw,vh,b.shop==='tavern'?'#3a2416':'#2c3a46');
  if(b.shop==='market'){P(vx,vy,vw,vh,'#3a3430');for(let s=0;s<3;s++){P(vx+1,vy+7+s*9,vw-2,2,'#8a7a64');P(vx+1,vy+9+s*9,vw-2,1,'#4a3e34');for(let k=0;k<vw-6;k+=5){const c=['#c0392b','#f2c230','#2f8a3a','#e8e2d4','#2f5aa8','#e08a2a'][(k/5+s*2)%6];P(vx+3+k,vy+1+s*9,4,6,c);P(vx+3+k,vy+1+s*9,4,1,'rgba(255,255,255,.3)');P(vx+6+k,vy+2+s*9,1,5,'rgba(0,0,0,.25)');}}}
  if(b.shop==='deli'){P(vx,vy,vw,vh,'#4a5a64');let px=vx+2;while(px<vx+vw-14){const pw=10+Math.floor(R()*8);poster(P,px,vy+2+Math.floor(R()*4),Math.min(pw,vx+vw-2-px),14+Math.floor(R()*6),['#c0392b','#f2c230','#2f5aa8','#2f8a3a','#e08a2a'][Math.floor(R()*5)],R);px+=pw+2;}
    // luminoso de aberto
    const ox=vx+vw-30,oy=vy+vh-14;P(ox-1,oy-1,24,10,'rgba(255,60,90,.25)');P(ox,oy,22,8,'#2a1012');txt(g,'OPEN',ox+2,oy+7,7,'#ff5a7a',1);P(ox+1,oy+1,20,1,'rgba(255,120,150,.4)');}
  if(b.shop==='laundry'){P(vx,vy,vw,vh,'#8aa4b4');P(vx,vy+vh-22,vw,22,'#c9ccce');P(vx,vy+vh-22,vw,1,'#eef0f2');for(let k=0;k<vw-14;k+=17){E(vx+9+k,vy+vh-11,7,7,'#e8eaec');E(vx+9+k,vy+vh-11,5,5,'#9aa0a6');E(vx+9+k,vy+vh-11,4,4,'#5a7a90');E(vx+8+k,vy+vh-12,1.5,1.5,'#cfe6ee');}P(vx+2,vy+3,vw-4,3,'#d9d6cb');for(let k=0;k<vw-8;k+=9)P(vx+4+k,vy+3,2,4,'#e8e2d4');}
  if(b.shop==='tavern'){P(vx,vy,vw,vh,'#5a3a20');for(let k=0;k<vh;k+=3)P(vx,vy+k,vw,1,'#7a5430');P(vx+vw/2-8,vy+6,16,8,'#ff5a8a');P(vx+vw/2-7,vy+7,14,6,'#ffc0d6');for(let k=0;k<4;k++)P(vx+vw/2-12-k,vy+5+k,1,1,'rgba(255,90,140,.4)');P(vx,vy+vh-8,vw,8,'#3a2416');}
  if(b.shop==='barber'){P(vx,vy,vw,vh,'#8fb0c8');P(vx,vy+vh-16,vw,16,'#e8e2d4');for(let k=0;k<vw;k+=4)P(vx+k,vy+vh-16,2,16,(k/4)%2?'#2a2b2e':'#e8e2d4');P(vx+8,vy+8,10,12,'#5a3a2a');P(vx+8,vy+8,10,2,'#7a5a4a');P(vx+vw-20,vy+8,10,12,'#5a3a2a');P(vx+vw-20,vy+8,10,2,'#7a5a4a');}
  if(b.shop==='pharmacy'){P(vx,vy,vw,vh,'#dceef2');for(let s=0;s<2;s++){P(vx,vy+13+s*12,vw,2,'#9aa0a6');for(let k=0;k<vw-8;k+=6){P(vx+4+k,vy+5+s*12,4,8,['#2f8a3a','#e8e2d4','#c0392b','#2f5aa8'][(k/6+s)%4]);P(vx+4+k,vy+5+s*12,4,1,'rgba(255,255,255,.4)');}}}
  if(b.shop==='closed'){
    // loja fechada: vidro forrado de papel pardo com fita, placa de aluga-se e a porta de enrolar pichada
    P(vx,vy,vw,vh,'#c8b48c');for(let k=0;k<vw;k+=11)P(vx+k,vy,1,vh,'#a8946c');for(let k=0;k<6;k++){P(vx+4+k,vy+4+k,1,1,'#d8d0b0');P(vx+vw-6-k,vy+4+k,1,1,'#d8d0b0');}
    P(vx+vw/2-16,vy+8,32,14,'#f2f0e8');P(vx+vw/2-16,vy+8,32,1,'#fff');txt(g,'FOR LEASE',vx+vw/2-14,vy+15,6,'#c0392b',.5);P(vx+vw/2-12,vy+18,24,1,'#777');}
  P(vx,vy,vw,4,'rgba(0,0,0,.34)');P(vx,vy+4,3,vh-4,'rgba(0,0,0,.26)');P(vx+vw-1,vy,1,vh,'rgba(255,255,255,.22)');
  if(b.shop!=='closed'){for(let k=0;k<3;k++)P(vx+10+k*14,vy+6,2,vh-10,'rgba(255,255,255,.10)');P(vx+vw-18,vy+6,6,1,'rgba(255,255,255,.35)');}
  // mureta embaixo da vitrine, saliente
  P(vx-2,vy+vh+2,vw+4,2,fl2);P(vx-2,vy+vh+4,vw+4,h-vy-vh-16,frame);P(vx,vy+vh+6,vw,h-vy-vh-22,fd);P(vx+2,vy+vh+7,vw-4,1,fl2);
  // porta recuada: as paredes do recuo (a da esquerda na sombra, a da direita na luz), o piso visto do alto e a porta no fundo
  const dy=vy-2,dh=h-12-dy;
  P(dxp-2,dy,dw+4,dh,fd);
  for(let j=0;j<dh;j++){const d=Math.round(3+3*(j/dh));P(dxp,dy+j,d,1,'#1c1612');P(dxp+dw-d,dy+j,d,1,shade(frame,1.25));}
  if(b.shop==='closed'){P(dxp+1,dy+1,dw-2,dh-2,'#8a8c8e');for(let k=dy+2;k<dy+dh;k+=3){P(dxp+1,k,dw-2,1,'#6a6c6e');P(dxp+1,k+1,dw-2,1,'#a9abad');}P(dxp+1,dy+dh-3,dw-2,2,'#4a4c4e');tag(P,dxp+1,dy+dh/2-6,dw-2,12,R,'#e85a9a');tag(P,vx+4,vy+vh+6,vw/2,8,R,'#5ad0e8');}
  else{P(dxp+3,dy+3,dw-6,dh-9,'#2e343a');P(dxp+5,dy+5,dw-10,dh-18,'#6f93b3');P(dxp+5,dy+5,dw-10,3,'rgba(0,0,0,.35)');P(dxp+6,dy+9,3,6,'#a7c6dc');P(dxp+dw-8,dy+dh/2,2,4,'#c9ccce');}
  for(let k=0;k<6;k++)P(dxp,dy+dh-6+k,dw,1,k%2?'#c8c2b6':'#9a948a');for(let k=0;k<dw;k+=4)P(dxp+k,dy+dh-6,2,6,'rgba(0,0,0,.08)');
  // pilastras: saem da parede, com capitel e base; a sombra cai na vitrine à direita
  for(const px of [0,w-8]){if(px===0)P(8,gy+6,4,h-gy-18,SH(.30));P(px,gy-10,8,h-gy-2,frame);P(px,gy-10,2,h-gy-2,fl2);P(px+7,gy-10,1,h-gy-2,fd);P(px-1,gy-12,10,3,fl2);P(px-1,gy-9,10,1,fd);P(px-1,h-14,10,2,fl2);}
  if(b.shop==='closed'||b.posters){poster(P,1,gy+18,6,10,'#e08a2a',R);poster(P,w-7,gy+24,6,9,'#2f5aa8',R);}
  // letreiro saliente: topo visto do alto, face com o nome e a sombra embaixo
  const bw=w-20;P(13,gy+10,bw,4,SH(.38));P(10+bw,gy-1,3,12,SH(.22));
  const bnd=b.shop==='closed'?'#5a5248':band;
  P(10,gy-5,bw,2,shade(bnd,1.55));P(10,gy-3,bw,13,bnd);P(10,gy-3,bw,1,shade(bnd,1.25));P(10,gy+9,bw,1,shade(bnd,.5));P(10,gy-3,1,13,shade(bnd,1.2));
  if(b.sign){const ink=band==='#e8e2d4'?'#7a2a2a':'#f1ece0',sz=9,tw=txtW(g,b.sign,sz,1.6);
    if(b.shop==='tavern'){for(const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1]])txt(g,b.sign,w/2-tw/2+ox,gy+7.5+oy,sz,'rgba(255,90,140,.35)',1.6);txt(g,b.sign,w/2-tw/2,gy+7.5,sz,'#ff9ec0',1.6);}
    else if(b.shop==='closed')txt(g,b.sign,w/2-tw/2,gy+7.5,sz,'rgba(220,210,190,.28)',1.6); // o nome antigo, quase apagado
    else{txt(g,b.sign,w/2-tw/2+1,gy+8.5,sz,'rgba(0,0,0,.35)',1.6);txt(g,b.sign,w/2-tw/2,gy+7.5,sz,ink,1.6);}}
  // toldo listrado saindo da parede: o pano visto do alto, a sanefa recortada e a sombra larga na vitrine
  if(b.awning){const aw=b.awning,ay=gy+12;
    P(9,ay+13,w-14,9,SH(.36));
    for(let j=0;j<10;j++){for(let k=0;k<w-12;k+=8)P(6+k,ay+j,8,1,(k%16?'#efe8da':aw));P(6,ay+j,w-12,1,`rgba(255,255,255,${.12-j*.012})`);}
    for(let k=0;k<w-12;k+=8){P(6+k,ay+10,8,3,k%16?'#d8d0c0':shade(aw,.8));E(10+k,ay+13,4,2,(k%16)?'#d8d0c0':shade(aw,.8));}
    P(6,ay+10,w-12,1,'rgba(0,0,0,.25)');}
  if(b.shop==='barber'){const px=dxp+dw+1;P(px+4,vy,3,vh,SH(.25));P(px-1,vy-4,7,3,'#c9ccce');P(px,vy-2,5,vh,'#e8e2d4');for(let k=0;k<vh-2;k+=6){P(px,vy-2+k,5,2,'#c0392b');P(px,vy+1+k,5,2,'#2f5aa8');}P(px,vy-2,1,vh,'rgba(255,255,255,.4)');P(px+4,vy-2,1,vh,'rgba(0,0,0,.25)');P(px-1,vy+vh-2,7,3,'#c9ccce');}
  if(b.shop==='pharmacy'){const cx=w-24,cy=gy-30;P(cx+4,cy+4,16,16,SH(.28));P(cx+6,cy+15,10,2,'#1c1d20');P(cx,cy,16,16,'#2f8a3a');P(cx,cy,16,1,'#4fae5a');P(cx+15,cy,1,16,'#1f5a26');P(cx+6,cy+2,4,12,'#f2f2ea');P(cx+2,cy+6,12,4,'#f2f2ea');P(cx+6,cy+16,2,6,'#1c1d20');}
  if(b.shop==='tavern'){const lx=dxp+dw/2;P(lx-4+3,gy+14,10,12,SH(.25));P(lx-1,gy+11,2,4,'#1c1d20');P(lx-4,gy+15,8,9,'#2a2b2e');P(lx-3,gy+16,6,7,'#f2cf86');P(lx-4,gy+15,8,1,'#4a4c50');}
}

/* galpão antigo de 6 andares virado depósito: pilastras, janelas de aço com muitos vidros, faixas de pedra,
   o anúncio pintado e desbotado no alto e a doca de carga com portas de enrolar */
function loftFacade(P,E,g,A,b,w,h,seed,hash,R){
  const {txt,txtW}=A,br=b.brick||'#7a3a2a';
  brickWall(P,0,0,w,h,br,seed,hash);
  // anúncio pintado na parede, quase apagado pelo tempo
  const ad=b.ghost||'COLD STORAGE',sz=15,tw=txtW(g,ad,sz,2);
  P(8,14,w-16,28,'rgba(232,224,200,.10)');P(8,14,w-16,1,'rgba(232,224,200,.30)');P(8,41,w-16,1,'rgba(232,224,200,.30)');
  txt(g,ad,w/2-tw/2,36,sz,'rgba(236,228,204,.42)',2);
  for(let k=0;k<w*3;k++)P(8+Math.floor(hash(k,seed,61)*(w-16)),14+Math.floor(hash(seed,k,62)*28),1,1,br);
  // platibanda com coping de pedra
  P(0,0,w,6,'#b8ae9e');P(0,0,w,2,'#d8d0c0');P(0,6,w,4,SH(.3));
  const bays=Math.round(w/50),bw=w/bays;
  for(let f=0;f<4;f++){const y=52+f*52;
    // faixa de pedra entre os andares, saliente
    P(0,y-6,w,3,'#c8bea8');P(0,y-6,w,1,'#e4dccc');P(0,y-3,w,2,SH(.25));
    for(let i=0;i<bays;i++){const x=Math.round(i*bw+8),ww=Math.round(bw-16),wh=36;
      // arco abatido de tijolo em cutelo
      for(let dx=0;dx<ww+4;dx++){const lift=Math.round(3*Math.sin(Math.PI*dx/(ww+4)));for(let k=0;k<4;k++)P(x-2+dx,y-2-lift-k,1,1,(dx>>1)%2?shade(br,.8):shade(br,1.15));}
      P(x+3,y+2,ww,wh,SH(.2));P(x-1,y-1,ww+2,wh+2,'#1c1612');P(x,y,ww,wh,'#2a2b2e');
      const broken=hash(i,f,seed)<.12,boarded=hash(f,i,seed)<.08;
      for(let r=0;r<4;r++)for(let q=0;q<3;q++){const px=x+1+q*Math.floor((ww-2)/3),py=y+1+r*9,pw=Math.floor((ww-2)/3)-1,ph=8,t=hash(i*7+q,f*5+r,seed);
        P(px,py,pw,ph,boarded&&r>1?'#8a6a40':broken&&t<.3?'#1a1c20':t<.25?'#8fb0c8':t<.35?'#d8b878':'#5f7f95');if(!boarded||r<2)P(px,py,pw,1,'rgba(255,255,255,.18)');}
      P(x,y,ww,3,'rgba(0,0,0,.3)');P(x,y,2,wh,'rgba(0,0,0,.22)');
      P(x-3,y+wh,ww+6,2,'#d8d0c0');P(x-3,y+wh+2,ww+6,1,'#8f877a');P(x-1,y+wh+3,ww+6,2,SH(.22));}}
  // pilastras de tijolo saindo da parede
  for(let i=0;i<=bays;i++){const x=Math.min(w-6,Math.round(i*bw)-(i?3:0));P(x+6,44,3,h-60,SH(.22));P(x,44,6,h-60,shade(br,1.06));P(x,44,1,h-60,shade(br,1.3));P(x+5,44,1,h-60,shade(br,.7));P(x-1,42,8,3,'#c8bea8');}
  // doca de carga: plataforma de concreto com a borda zebrada, duas portas de enrolar (uma meio aberta) e a porta de aço
  const gy=h-62;P(0,gy,w,62,shade(br,.9));P(0,gy,w,3,'#c8bea8');P(0,gy+3,w,2,SH(.25));
  for(const [x0,open] of [[14,false],[Math.round(w/2)-4,true]]){const dw=Math.round(w/2)-34;
    P(x0-3,gy+8,dw+6,h-gy-26,'#5a5c5e');P(x0-3,gy+8,dw+6,1,'#8a8c8e');
    const oh=open?Math.round((h-gy-28)*.45):h-gy-28;P(x0,gy+10,dw,oh,'#7a7c7e');for(let k=gy+11;k<gy+10+oh;k+=3){P(x0,k,dw,1,'#5e6062');P(x0,k+1,dw,1,'#9a9c9e');}P(x0,gy+10+oh-2,dw,2,'#3a3c3e');
    if(open){P(x0,gy+10+oh,dw,h-gy-28-oh,'#141416');for(let k=0;k<3;k++){P(x0+4+k*12,h-30-k%2*6,10,10,'#8a6a40');P(x0+4+k*12,h-30-k%2*6,10,1,'#a8865e');}}
    else tag(P,x0+4,gy+20,dw-8,14,R,'#f2c230','#1c1d20');}
  P(0,h-18,w,18,'#9a948a');P(0,h-18,w,3,'#c8c2b6');for(let x=0;x<w;x+=8)P(x,h-4,4,4,(x/8)%2?'#f2c230':'#1c1d20');P(0,h-15,w,1,'#6e6a60');
  const sx=w-22;P(sx,gy+18,16,h-gy-36,'#4a5a5a');P(sx,gy+18,16,1,'#6a7a7a');P(sx+12,gy+30,2,3,'#c9ccce');P(sx-2,gy+16,20,2,'#2a2b2e');
  poster(P,8,gy+14,6,9,'#c0392b',R);
}

/* igreja de pedra: torre com campanário e agulha de ardósia, frontão, rosácea com vitral, portal ogival com
   arquivoltas, janelas lancetadas e contrafortes */
function churchFacade(P,E,g,A,b,w,h,seed,hash,R){
  const st=b.stone||'#a39a8a',stl=shade(st,1.2),std=shade(st,.72),tw=56,nx=tw,nw=w-tw,eave=h-180,peak=eave-50;
  // nave com frontão
  for(let y=peak;y<h;y++){const hw=y<eave?Math.round((y-peak)/(eave-peak)*nw/2):nw/2;P(nx+nw/2-hw,y,hw*2,1,st);}
  stoneWall(P,nx,eave,nw,h-eave,st,seed,hash);
  for(let y=peak;y<eave;y++){const hw=Math.round((y-peak)/(eave-peak)*nw/2);for(let x=nx+nw/2-hw;x<nx+nw/2+hw;x++)if(hash(x,y,seed)<.08)P(x,y,1,1,std);P(nx+nw/2-hw-2,y,3,1,stl);P(nx+nw/2+hw-1,y,3,1,std);}
  P(nx+nw/2-1,peak-18,3,18,'#3a3a40');P(nx+nw/2-6,peak-12,13,3,'#3a3a40');
  // rosácea
  const rx=nx+nw/2,ry=eave+26;E(rx+3,ry+3,22,22,SH(.25));E(rx,ry,22,22,stl);E(rx,ry,19,19,std);E(rx,ry,17,17,'#2a1d30');
  const cols=['#c0392b','#2f5aa8','#f2c230','#2f8a3a','#7a3a9a','#2f5aa8','#e08a2a','#2f8a3a'];
  for(let k=0;k<8;k++){const a=k*Math.PI/4;E(rx+Math.cos(a)*11,ry+Math.sin(a)*11,4,4,cols[k]);E(rx+Math.cos(a)*11-1,ry+Math.sin(a)*11-1,1.5,1.5,'rgba(255,255,255,.35)');}
  E(rx,ry,5,5,'#f2c230');E(rx,ry,2,2,'#c0392b');for(let k=0;k<8;k++){const a=k*Math.PI/4+Math.PI/8;P(Math.round(rx+Math.cos(a)*11),Math.round(ry+Math.sin(a)*11),1,1,stl);}
  // portal ogival com três arquivoltas e a porta de madeira
  const pw=44,ph=86,py=h-ph-10,pc=nx+nw/2;
  pointed(P,pc+3,py+3,pw+12,ph,SH(.25));
  pointed(P,pc,py-6,pw+12,ph+6,stl);pointed(P,pc,py-3,pw+6,ph+3,st);pointed(P,pc,py,pw,ph,std);pointed(P,pc,py+4,pw-6,ph-4,'#2a1d18');
  pointed(P,pc,py+6,pw-10,ph-6,'#5a3a22');P(pc-1,py+30,2,ph-36,'#3a2416');for(let k=py+30;k<py+ph;k+=10){P(pc-(pw-10)/2+2,k,8,2,'#2a2b2e');P(pc+(pw-10)/2-10,k,8,2,'#2a2b2e');}
  pointed(P,pc,py+6,pw-10,4,'rgba(0,0,0,.35)');P(pc-6,py+52,2,3,'#c9a24a');P(pc+4,py+52,2,3,'#c9a24a');
  // janelas lancetadas de vitral dos dois lados do portal
  for(const lx of [nx+22,nx+nw-22]){const ly=h-110;pointed(P,lx+2,ly+2,16,58,SH(.22));pointed(P,lx,ly-2,18,62,stl);pointed(P,lx,ly,14,58,'#1c1622');
    for(let y=ly+12;y<ly+56;y+=5)for(let x=lx-5;x<lx+5;x+=3)P(x,y,2,4,cols[(x+y)%8]);pointed(P,lx,ly,14,6,'rgba(0,0,0,.3)');}
  // contrafortes nas pontas da nave
  for(const bx of [nx,w-10]){P(bx+10,eave+8,3,h-eave-8,SH(.22));P(bx,eave,10,h-eave,stl);P(bx,eave,2,h-eave,shade(st,1.4));P(bx+9,eave,1,h-eave,std);for(let y=eave+30;y<h;y+=46){P(bx-2,y,14,3,shade(st,1.35));P(bx-2,y+3,14,2,std);}}
  // torre: pedra, campanário com venezianas ogivais, relógio e a agulha de ardósia com a cruz
  stoneWall(P,0,70,tw,h-70,shade(st,.95),seed+3,hash);P(0,70,2,h-70,stl);P(tw-2,70,2,h-70,std);
  for(let y=0;y<70;y++){const hw=Math.round(y/70*tw/2)+1;P(tw/2-hw,y,hw*2,1,y%4<2?'#4a4a58':'#545466');P(tw/2-hw,y,1,1,'#6a6a80');}
  P(tw/2-1,0,2,10,'#c9a24a');P(tw/2-4,3,8,2,'#c9a24a');
  P(-1,70,tw+2,4,stl);P(-1,74,tw+2,2,SH(.3));
  for(const lx of [tw/2]){pointed(P,lx,84,24,40,'#1c1622');for(let y=100;y<124;y+=3)P(lx-10,y,20,1,'#5a5248');pointed(P,lx,84,24,6,'rgba(0,0,0,.3)');}
  E(tw/2,148,11,11,stl);E(tw/2,148,9,9,'#f2efe6');P(tw/2,141,1,8,'#1c1d20');P(tw/2,148,6,1,'#1c1d20');E(tw/2,148,1,1,'#1c1d20');
  for(let y=170;y<h-40;y+=48){pointed(P,tw/2,y,10,26,'#1c1622');pointed(P,tw/2,y,10,4,'rgba(0,0,0,.3)');}
  // mural de avisos ao lado do portal e o soco de pedra
  P(nx+42,h-62,20,26,'#3a2a1c');P(nx+44,h-60,16,22,'#c8b48c');for(let k=0;k<3;k++)P(nx+45+k*5,h-58+k*6,4,5,'#f2f0e8');
  P(0,h-10,w,10,shade(st,.85));P(0,h-10,w,2,stl);
}

/* abertura entre os prédios em perspectiva: beco, terreno baldio ou rua transversal. As paredes laterais (fachadas
   que dão para a abertura) fogem para o fundo: a da esquerda olha para a direita e fica na sombra, a da direita pega sol */
function gapSprite(P,E,g,A,b,w,h,seed,hash,R){
  const kind=b.k,VX=w/2,VY=h-(kind==='cross'?130:110),s=kind==='cross'?.2:.3;
  const fx0=VX-VX*s,fx1=VX+(w-VX)*s,fyB=VY+(h-VY)*s;
  const hl=b.hl||h,hr=b.hr||h,farH=kind==='cross'?150:kind==='lot'?70:110;
  // prédio do fim (do outro lado da quadra ou da rua de trás)
  {const fy0=Math.round(VY+(h-farH-VY)*s);P(Math.floor(fx0),fy0,Math.ceil(fx1-fx0)+1,Math.ceil(fyB-fy0)+1,kind==='lot'?'#8a5a48':'#7a4a3c');
    for(let y=fy0+3;y<fyB-3;y+=6)for(let x=Math.floor(fx0)+2;x<fx1-2;x+=4)P(x,y,2,3,hash(x,y,seed)<.25?'#d8b878':'#3a3a44');
    P(Math.floor(fx0),fy0,Math.ceil(fx1-fx0)+1,2,'#3a2a22');
    if(kind==='lot'){for(let x=Math.floor(fx0);x<fx1;x+=8){P(x,fyB-12,6,2,'#d8d0c0');P(x+2,fyB-10,1,8,'#d8d0c0');}}}
  // paredes laterais, coluna a coluna
  const wall=(X,side)=>{
    const d=side?(w-1-X)/(w-1-fx1):X/fx0,kk=1-(1-s)*d,top=side?hr:hl,bs=side?(b.br||'#8a4a38'):(b.bl||'#5a3226');
    const yAt=u=>Math.round(VY+(h-u-VY)*kk),y0=yAt(top),y1=yAt(0);
    P(X,y0,1,y1-y0,bs);
    for(let u=4;u<top;u+=5)P(X,yAt(u),1,1,side?'rgba(230,200,180,.25)':'rgba(170,140,120,.16)');
    // cornija no alto
    P(X,y0,1,Math.max(1,Math.round(8*kk)),'#2a2228');
    // janelas por andar; no térreo, portas e uma vitrine
    for(let f=0;f*FLOOR+40<top;f++){const u0=f*FLOOR+12,u1=u0+(f===0?36:28);
      for(let q=0;q<5;q++){const a=.06+q*.19,bnd=.1;if(d>a&&d<a+bnd&&!(f===0&&kind==='alley'&&q>1)){const ya=yAt(u1),yb=yAt(u0),lit=hash(f*7+q,side,seed)<.3;
        P(X,ya,1,yb-ya,f===0&&q%2?(side?'#5a4030':'#2a2018'):side?(lit?'#f2cf86':'#5f7f9a'):(lit?'#b89a5a':'#2a3440'));P(X,ya,1,1,side?'#e8e0d0':'#6a5a50');P(X,yb,1,1,side?'#d8d0c0':'#5a4a40');}}}
    // mural na parede ensolarada do terreno baldio
    if(kind==='lot'&&side&&d>.08&&d<.85){const ya=yAt(Math.min(top-10,150)),yb=yAt(14);for(let y=ya;y<yb;y++){const v=(y-ya)/(yb-ya),c=v<.4?(d<.5?'#3a7ab8':'#e8a040'):v<.7?(Math.sin(d*18+v*6)>0?'#f2c230':'#c0392b'):(d<.3||d>.6?'#2f8a3a':'#7a3a9a');P(X,y,1,1,c);}
      if(Math.abs(d-.45)<.12){const yc=yAt(110),r=Math.round(16*kk);P(X,yc-r,1,r*2,'#f6e2a8');}}
    // pichação na base das paredes do beco
    if(kind!=='cross'&&d>.02&&d<.3&&hash(Math.floor(d*30),side,seed)<.6){const ya=yAt(26),yb=yAt(8);for(let y=ya;y<yb;y++)if(hash(X,y,seed+9)<.35)P(X,y,1,1,side?'#e85a9a':'#5ad0e8');}
    // sombra crescendo no fundo
    P(X,y0,1,y1-y0,`rgba(10,6,4,${(side?0:.12)+.22*d})`);
  };
  for(let X=0;X<Math.ceil(fx0);X++)wall(X,0);
  for(let X=w-1;X>Math.floor(fx1);X--)wall(X,1);
  // chão
  for(let y=Math.ceil(fyB);y<h;y++){const k=(y-VY)/(h-VY),l=Math.round(VX-VX*k),r=Math.round(VX+(w-VX)*k);
    if(kind==='cross'){const sw=Math.round(20*k);P(l,y,r-l,1,'#4a4c52');P(l,y,sw,1,'#b4aea2');P(r-sw,y,sw,1,'#b4aea2');P(l+sw,y,1,1,'#8a857a');P(r-sw-1,y,1,1,'#8a857a');
      if(hash(y,seed,4)<.3)P(l+sw+Math.floor(hash(seed,y,5)*(r-l-2*sw)),y,1,1,'#55575d');
      // sombra dos prédios da esquerda sobre a rua
      P(l,y,Math.round((r-l)*.35),1,'rgba(20,24,40,.22)');}
    else if(kind==='lot'){P(l,y,r-l,1,'#6a5a44');for(let x=l;x<r;x++){const t=hash(x,y,seed);if(t<.18)P(x,y,1,1,t<.06?'#4a7a3a':'#7a9a4a');else if(t<.22)P(x,y,1,1,'#8a7a64');}}
    else{P(l,y,r-l,1,'#4e4a46');P(Math.round(VX)-1,y,2,1,'#3a3632');if(hash(y,seed,5)<.3)P(l+Math.floor(hash(seed,y,6)*(r-l)),y,2,1,'#5e5a56');}
    P(l,y,r-l,1,`rgba(10,8,6,${.4*(1-k)})`);}
  const proj=(x,u,k)=>[VX+(x-VX)*k,VY+(h-u-VY)*k];
  if(kind==='cross'){
    // carros parados na rua transversal, diminuindo com a distância, e postes com fios fugindo para o fundo
    for(const [k,col] of [[.78,'#9a2f2a'],[.55,'#c8b48c'],[.4,'#2f4f7a'],[.3,'#6a6e76']]){const [cx,cy]=proj(w-24,0,k),cw=Math.round(18*k),ch=Math.round(16*k);
      P(cx-cw,cy-ch,cw,ch,col);P(cx-cw,cy-ch,cw,Math.max(1,Math.round(ch*.3)),shade(col,1.3));P(cx-cw+1,cy-Math.round(ch*.65),cw-2,Math.max(1,Math.round(ch*.25)),'#1c2833');P(cx-cw,cy-1,cw,1,'#141416');}
    let prev=null;for(const k of [1,.62,.42,.3,.24]){const [px,py]=proj(10,0,k),ph=Math.round(190*k);P(px,py-ph,Math.max(1,Math.round(3*k)),ph,'#4a3a2a');P(px-Math.round(8*k),py-ph+Math.round(8*k),Math.round(18*k),1,'#3a2a1c');
      if(prev)for(const dy of [8,12])line(P,prev[0],prev[1]+Math.round(dy*prev[2]),px,py-ph+Math.round(dy*k),1,'#1c1d20');prev=[px,py-ph,k];}
    // árvores na calçada da direita
    for(const k of [.7,.45]){const [tx,ty]=proj(w-12,0,k),r=Math.round(22*k);P(tx,ty-Math.round(60*k),Math.max(1,Math.round(3*k)),Math.round(60*k),'#5a3a22');E(tx,ty-Math.round(70*k),r,r*.9,'#356a2e');E(tx-r*.3,ty-Math.round(76*k),r*.6,r*.5,'#4a8a3c');}
  }else{
    // varal com roupa atravessando
    const [lx0,ly0]=proj(0,hl*.62,.62),[lx1]=proj(w,hr*.62,.62);for(let x=Math.ceil(lx0);x<lx1;x++){const sag=Math.round(Math.sin((x-lx0)/(lx1-lx0)*Math.PI)*3);P(x,ly0+sag,1,1,'#2a2a2a');}
    for(const [cx,col] of [[.35,'#c0392b'],[.55,'#e8e2d4'],[.7,'#2f5aa8']]){const x=Math.round(lx0+(lx1-lx0)*cx),sag=Math.round(Math.sin(cx*Math.PI)*3);P(x,ly0+sag+1,3,4,col);P(x,ly0+sag+1,3,1,'rgba(255,255,255,.3)');}
  }
  if(kind==='alley'){
    {const [cx,cy]=proj(VX-10,0,.55);P(cx,cy-9,11,9,'#2f5a3a');P(cx,cy-10,11,2,'#4a7a52');P(cx+10,cy-9,1,9,'#1f3a26');P(cx+1,cy,9,1,SH(.4));}
    for(const [dx,dy,r] of [[8,-6,6],[18,-4,5],[12,-2,4]]){E(dx+1,h+dy+2,r,r*.5,SH(.35));E(dx,h+dy,r,r*.8,'#1c1c1e');E(dx-1,h+dy-1,r*.5,r*.4,'#2c2c30');E(dx-2,h+dy-2,r*.2,r*.15,'#4a4a50');}
    P(w-12,h-26,9,24,'#3a5a3a');P(w-12,h-26,9,2,'#5a7a5a');P(w-12,h-26,1,24,'#4a6a4a');P(w-4,h-24,1,22,'#24382a');P(w-9,h-2,9,2,SH(.35));
  }
  if(kind==='lot'){
    // entulho, pneu e mato; na frente, a cerca de tela com portão, placa e o cadeado
    E(w*.3,h-30,10,4,'#5a5248');E(w*.3,h-32,6,3,'#7a7064');E(w*.62,h-22,7,5,'#1c1c1e');E(w*.62,h-22,3,2,'#6a5a44');
    for(let k=0;k<40;k++){const x=Math.floor(hash(k,seed,71)*w),y=h-4-Math.floor(hash(seed,k,72)*30);P(x,y-3,1,3,'#4a7a3a');P(x+1,y-4,1,4,'#69ad52');}
    const fy=h-34;P(0,fy,w,1,'#9aa0a6');P(0,h-2,w,1,'#7a8086');
    for(let y=fy+1;y<h-2;y++)for(let x=((y-fy)%4);x<w;x+=4)P(x,y,1,1,'rgba(170,176,182,.55)');
    for(let y=fy+1;y<h-2;y++)for(let x=3-((y-fy)%4);x<w;x+=4)if(x>=0)P(x,y,1,1,'rgba(140,146,152,.45)');
    for(let x=0;x<w;x+=Math.floor(w/3)){P(x+2,fy-2,3,36,SH(.25));P(x,fy-2,3,36,'#8a9096');P(x,fy-2,1,36,'#c9ccce');P(x-1,fy-3,5,2,'#6a7076');}
    P(w-30,fy+10,20,12,'#e8e2d4');P(w-30,fy+10,20,3,'#c0392b');P(w-28,fy+15,16,1,'#555');P(w-28,fy+18,12,1,'#555');
  }
}

/* degraus de mármore com corrimão de ferro na frente da porta de cada casa (no chão, na calçada): a câmera é alta,
   então cada degrau mostra o piso (claro) e o espelho (mais escuro); as muretas dos lados têm topo e face, e tudo joga
   sombra na calçada para a direita */
export function drawStoop(P,x){
  const n=3,tw=32;
  P(x-tw/2+4,GY+2,tw+8,n*7+4,SH(.22));
  for(let k=0;k<n;k++){const y=GY+k*7,xx=x-tw/2;P(xx,y,tw,4,'#ece8e0');P(xx,y,tw,1,'#fbf8f2');P(xx,y+4,tw,3,'#c9c3b8');P(xx,y+6,tw,1,'#a8a296');
    for(let j=0;j<tw;j+=7)P(xx+j+3,y+1,2,1,'rgba(150,140,130,.25)');}
  for(const s of [-1,1]){const cx=s<0?x-tw/2-5:x+tw/2;P(cx,GY,5,n*7,'#d8d2c6');P(cx,GY,5,1,'#fbf8f2');P(cx,GY+1,s<0?1:5,n*7-1,s<0?'#f2ecdf':'#d8d2c6');P(cx+(s<0?4:0),GY+1,1,n*7-1,'#a8a296');P(cx,GY+n*7-1,5,1,'#8f877a');
    // corrimão de ferro com a sombra
    const rx=cx+2;P(rx+3,GY-6,2,n*7+2,SH(.25));P(rx,GY-10,2,n*7+2,'#1c1d20');P(rx,GY-10,1,n*7+2,'#4a4c50');P(rx-1,GY-12,4,2,'#1c1d20');}
}

/* escadaria larga de pedra da igreja, com o piso dos degraus e as muretas */
export function drawChurchSteps(P,x0,x1){
  const n=4;P(x0+4,GY+2,x1-x0+6,n*6+4,SH(.2));
  for(let k=0;k<n;k++){const y=GY+k*6,ins=(n-1-k)*3;P(x0+ins,y,x1-x0-ins*2,4,'#bdb5a6');P(x0+ins,y,x1-x0-ins*2,1,'#d8d0c0');P(x0+ins,y+4,x1-x0-ins*2,2,'#958d7e');}
}

/* ---------- carros em 3/4 (teto e lateral), virados para a direita, na unidade da base ---------- */
export const CARS=[
  {id:'viatura',w:112,body:'#eef0ee',pol:true},{id:'taxi',w:106,body:'#e8c63a',taxi:true},
  {id:'sedan-vermelho',w:104,body:'#9a2f2a'},{id:'hatch-azul',w:94,body:'#2f4f7a'},{id:'perua-verde',w:112,body:'#34583a'},
  {id:'sedan-bege',w:102,body:'#c8b48c'},{id:'sedan-cinza',w:106,body:'#6a6e76'},{id:'van-branca',w:116,body:'#e4e6e2'},{id:'pickup-azul',w:118,body:'#3a5a7a'},
  {id:'sedan-preto',w:106,body:'#2a2c30'},{id:'hatch-amarelo',w:92,body:'#d8a040'},{id:'onibus',w:236,body:'#d8d2c2',bus:true}
];
export function carSprite(A,k){
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
    const hatch=k.id.startsWith('hatch'),wagon=k.id.startsWith('perua')||k.id.startsWith('van'),van=k.id.startsWith('van'),pick=k.id.startsWith('pickup');
    const top=22,base=h-11,wf=Math.round(w*.79),wr=Math.round(w*(hatch?.2:.19));
    const cx0=Math.round(w*(van?.06:wagon?.12:hatch?.16:pick?.44:.3)),cx1=Math.round(w*(pick?.68:.62));
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
    // furgão: lateral de carga fechada atrás da porta do motorista; picape: caçamba aberta vista do alto
    if(van){P(2,gy0,cx1-8,gy1-gy0+1,C.b);P(2,gy0,cx1-8,1,C.hh);P(Math.round(w*.4),gy1+1,1,base-gy1-6,C.dk);P(Math.round(w*.4)-6,gy1+5,5,1,C.dk);}
    if(pick){P(5,9,cx0-14,top-6,'#2a2b2e');P(5,9,cx0-14,1,C.hh);P(5,top+2,cx0-14,1,C.hi);P(7,11,cx0-18,top-10,'#3a3c40');for(let x=9;x<cx0-12;x+=6)P(x,11,1,top-10,'#2a2b2e');P(cx0-8,4,3,top-2,C.dk);}
    // caixa de roda escura e as rodas
    for(const x of [wr,wf]){E(x,base-1,12,10,'#121214');wheel(x,h-10,10);}
  });
  return outlined(refine(c,k.w));
}

/* ---------- lampião, árvore e mobiliário (sprites com o pé no fim) ---------- */
export function lampSprite(A){return A.outlined(A.refine(A.S2(22,170,(P,E)=>{
  P(9,30,4,134,'#1c1d20');P(9,30,1,134,'#3a3c40');P(6,160,10,10,'#1c1d20');P(5,166,12,4,'#2a2b2e');P(7,40,8,3,'#2a2b2e');
  P(5,4,12,4,'#1c1d20');E(11,16,7,10,'#f6eccc');E(11,14,4,6,'#fffbe8');P(5,24,12,3,'#1c1d20');P(8,27,6,4,'#2a2b2e');E(11,2,3,2,'#1c1d20');
}),1));}
// árvore de calçada: o tamanho e o tipo variam (adulta frondosa, média, muda nova com estaca)
export function treeSprite(A,seed,kind){return A.outlined(A.S2(84,150,(P,E)=>{
  const R=A.mulberry32(seed),cols=['#24461f','#356a2e','#4a8a3c','#69ad52','#8ccb6a'];
  if(kind==='young'){P(41,96,3,46,'#5a3a22');P(41,96,1,46,'#7a5232');P(47,100,1,42,'#a8865e');P(44,112,4,1,'#3a2a1c');A.bush(P,E,42,84,20,R,cols);return;}
  const r=kind==='mid'?30:40,ty=kind==='mid'?74:60;
  P(36,124,14,18,'#5a3a22');P(36,124,4,18,'#7a5232');P(40,ty+28,8,124-ty-28,'#5a3a22');P(40,ty+28,3,124-ty-28,'#7a5232');P(30,ty+36,12,3,'#5a3a22');P(46,ty+32,12,3,'#5a3a22');
  for(let y=ty+40;y<124;y+=7)P(41,y,5,1,'#4a2e1a');
  A.bush(P,E,42,ty,r,R,cols);
}));}
// canteiro da árvore; alguns com grade de ferro baixa em volta
export function pitSprite(A,guard){return A.S2(40,guard?20:12,(P)=>{const o=guard?8:0;P(0,o,40,12,'#8a5a3a');P(2,o+2,36,8,'#3a2a1c');for(let k=0;k<20;k++)P(3+(k*7)%34,o+3+(k*3)%6,2,1,'#4a3424');for(let x=0;x<40;x+=8)P(x,o,1,12,'#6a4a2a');
  if(guard){P(0,2,40,1,'#1c1d20');P(0,o+10,40,1,'#1c1d20');for(let x=0;x<40;x+=4){P(x,2,1,o+9,'#1c1d20');P(x,1,1,1,'#3a3c40');}}});}

/* mobiliário: cada peça com o pé no centro da última linha */
export function propSprite(A,k,opt){
  const {S2,refine,outlined,txt}=A;
  const d={
    hydrant:[14,24,(P,E)=>{P(3,8,8,14,'#e8c63a');P(1,10,12,3,'#e8c63a');E(7,7,4,3,'#c9a22a');P(5,3,4,3,'#c0392b');P(2,22,10,2,'#9a7a1a');P(4,9,2,12,'#f6dc6a');}],
    can:[18,30,(P)=>{P(2,4,14,25,'#2f3a34');P(1,2,16,4,'#3a4a40');for(let x=4;x<16;x+=3)P(x,8,1,19,'#24302a');P(3,6,2,21,'#4a5a50');}],
    news:[18,34,(P)=>{P(2,6,14,22,'#2f5aa8');P(2,6,14,2,'#5a80c8');P(4,10,10,8,'#e8e2d4');P(5,12,8,1,'#777');P(5,14,6,1,'#777');P(4,28,2,6,'#3a3c40');P(12,28,2,6,'#3a3c40');}],
    news2:[18,34,(P)=>{P(2,6,14,22,'#b8392b');P(2,6,14,2,'#d85a4a');P(4,10,10,8,'#e8e2d4');P(5,12,8,1,'#777');P(5,14,6,1,'#777');P(4,28,2,6,'#3a3c40');P(12,28,2,6,'#3a3c40');}],
    bench:[56,24,(P)=>{P(2,2,52,4,'#5a3a22');P(2,8,52,4,'#6a4a2a');P(2,13,52,3,'#7a5432');P(4,16,3,8,'#1c1d20');P(49,16,3,8,'#1c1d20');P(4,2,2,12,'#1c1d20');P(50,2,2,12,'#1c1d20');}],
    // poste de madeira da companhia de luz: cruzeta, isoladores, transformador, plaquetas e cartazes grampeados
    upole:[56,250,(P,E)=>{const R=A.mulberry32(opt||3);
      P(25,10,7,240,'#5a4632');P(25,10,2,240,'#7a6248');P(31,10,1,240,'#3a2a1c');for(let y=20;y<250;y+=9)P(26+(y%3),y,1,4,'#4a3828');
      for(const y of [16,30]){P(4,y,48,4,'#4a3a2a');P(4,y,48,1,'#6a5440');for(const x of [6,16,38,48]){P(x,y-5,3,5,'#7aa08a');P(x,y-6,3,1,'#a8c8b4');}}
      if(R()<.6){P(32,44,12,18,'#8a8c8e');P(32,44,3,18,'#b4b6b8');P(42,44,2,18,'#5e6062');P(31,43,14,2,'#6a6c6e');}
      P(27,100,3,4,'#c9ccce');P(27,106,3,2,'#e8c63a');
      for(let k=0;k<3;k++){const py=150+k*14+Math.floor(R()*6);P(24,py,9,11,['#e8e2d4','#f2c230','#c0392b'][k]);P(25,py+4,7,1,'#555');P(25,py+6,5,1,'#555');}
      for(let y=190;y<240;y+=4)if(R()<.5)P(24+Math.floor(R()*9),y,1,1,'#c9ccce');}],
    // semáforo da esquina: foco de carros, foco de pedestre e a placa com o nome da rua
    signal:[52,170,(P,E)=>{
      P(24,20,4,150,'#2a3a32');P(24,20,1,150,'#4a5a52');P(21,164,10,6,'#2a3a32');
      P(4,4,44,9,'#1f6a3a');P(4,4,44,1,'#3a8a5a');P(4,12,44,1,'#0f3a1f');
      P(25,13,2,7,'#2a3a32');
      P(28,34,12,32,'#1c1d20');P(29,35,10,30,'#e8c63a');P(30,36,8,28,'#1c1d20');E(34,41,3,3,'#ff4a3a');E(34,41,1.5,1.5,'#ffc0b0');E(34,50,3,3,'#3a2a1a');E(34,59,3,3,'#1a3a24');
      for(const y of [38,47,56])P(29,y,10,1,'#1c1d20');
      P(12,80,12,12,'#1c1d20');P(13,81,10,10,'#2a2b2e');P(15,83,6,6,'#ff8a3a');P(16,82,4,2,'#ff8a3a');
      P(14,100,10,4,'#f2f0e8');P(14,100,10,1,'#fff');}],
    meter:[10,34,(P)=>{P(4,12,2,22,'#3a3c40');P(4,12,1,22,'#5a5c60');P(1,2,8,11,'#7a7e84');P(1,2,8,2,'#a9aeb4');P(2,5,6,4,'#1c2833');P(3,6,2,1,'#e8e2d4');P(7,9,1,3,'#3a3c40');}],
    nopark:[16,70,(P,E)=>{P(7,14,2,56,'#7a7e84');P(7,14,1,56,'#a9aeb4');P(1,2,14,16,'#f2f0e8');P(1,2,14,1,'#fff');E(8,8,4.5,4.5,'#c0392b');E(8,8,3,3,'#f2f0e8');P(6,6,4,4,'#1c1d20');P(5,7,1,1,'#c0392b');P(3,14,10,1,'#555');}],
    busstop:[18,90,(P)=>{P(8,20,2,70,'#7a7e84');P(8,20,1,70,'#a9aeb4');P(1,2,16,20,'#2f5aa8');P(1,2,16,1,'#5a80c8');P(4,6,10,8,'#f2f0e8');P(5,7,8,4,'#2f5aa8');P(5,12,2,2,'#1c1d20');P(11,12,2,2,'#1c1d20');P(3,17,12,1,'#f2f0e8');P(3,19,8,1,'#f2f0e8');}],
    mailbox:[22,40,(P,E)=>{P(3,10,16,22,'#2f4f9a');E(11,10,8,6,'#2f4f9a');P(3,10,3,22,'#4a6ab8');E(9,8,4,3,'#4a6ab8');P(5,16,12,2,'#1c1d20');P(5,16,12,1,'#5a5c60');P(4,32,3,8,'#1c2a4a');P(15,32,3,8,'#1c2a4a');P(8,22,6,4,'#e8e2d4');P(9,23,4,1,'#2f4f9a');}],
    bags:[46,26,(P,E)=>{P(32,4,13,21,'#2f5aa8');P(31,3,15,3,'#3a6ac0');P(32,6,2,19,'#4a7ad0');P(36,10,5,5,'#f2f0e8');
      for(const [x,y,r] of [[10,17,9],[22,18,8],[15,10,7],[28,20,6]]){E(x,y,r,r*.85,'#1a1a1c');E(x-r*.35,y-r*.35,r*.35,r*.25,'#4a4a50');E(x,y-r,2,2,'#1a1a1c');}}],
    bike:[44,34,(P,E)=>{P(4,6,2,28,'#7a7e84');P(36,6,2,28,'#7a7e84');P(4,4,34,2,'#7a7e84');P(4,4,34,1,'#a9aeb4');
      const ring=(cx)=>{for(let a=0;a<6.28;a+=.15){P(Math.round(cx+Math.cos(a)*7),Math.round(24+Math.sin(a)*7),1,1,'#1c1d20');}P(cx,24,1,1,'#7a7e84');};
      ring(10);ring(32);
      for(const [a,b,c,d] of [[10,24,20,14],[20,14,32,24],[20,14,28,14],[28,14,32,24],[20,14,22,24],[22,24,10,24],[28,14,29,10]])for(let i=0;i<=10;i++)P(Math.round(a+(c-a)*i/10),Math.round(b+(d-b)*i/10),1,1,'#c0392b');
      P(18,12,5,2,'#1c1d20');P(27,9,5,1,'#1c1d20');}],
    cone:[14,22,(P)=>{for(let y=0;y<18;y++){const hw=Math.round(1+y*.3);P(7-hw,y+2,hw*2,1,y>6&&y<10?'#f2f0e8':'#ff7a2a');}P(1,19,12,3,'#e85a1a');P(5,4,2,12,'rgba(255,255,255,.25)');}],
    aframe:[20,30,(P)=>{P(2,2,16,24,'#5a3a22');P(4,4,12,20,'#2a2b2e');P(5,7,8,1,'#f2f0e8');P(5,10,10,1,'#f2c230');P(5,13,7,1,'#f2f0e8');P(5,16,9,1,'#e85a9a');P(5,19,6,1,'#f2f0e8');P(2,26,2,4,'#5a3a22');P(16,26,2,4,'#5a3a22');}],
    planter:[36,26,(P,E)=>{P(2,12,32,14,'#9a948a');P(2,12,32,2,'#c8c2b6');P(30,14,4,12,'#7a746a');
      for(let k=0;k<10;k++){const x=4+k*3;P(x,4+(k%3)*2,2,9,'#3a6a2e');P(x,3+(k%3)*2,2,2,['#c0392b','#f2c230','#e8e2d4','#e85a9a'][k%4]);}}]
  }[k];
  const c=S2(d[0],d[1],d[2]);
  if(k==='signal'){const g=c.getContext('2d');txt(g,opt||'N 9TH ST',7,11,7,'#f2f0e8',.6);}
  return outlined(refine(c,k.length));
}

/* centro da cidade ao fundo: torres em camadas com névoa (a mais longe mais clara), uma com agulha, outra escalonada,
   e telhados mais perto com caixas d'água */
export function drawSkyline(P,E,W,R){
  const base=GY-150;
  for(const [layer,col,win,hmin,hmax] of [[0,'#b8c4d2','#d6dee8',180,380],[1,'#9aa8ba','#c4cede',120,280]]){
    let x=-20;while(x<W){const w=30+R()*70,h=hmin+R()*(hmax-hmin),top=base-h;
      if(R()<(layer?.3:.55)){x+=10+R()*40;continue;}
      P(x,top,w,h+150,col);P(x,top,2,h+150,shade(col,1.08));P(x+w-3,top,3,h+150,shade(col,.92));
      const t=R();
      if(t<.15){for(let k=0;k<3;k++)P(x+k*w*.12,top-12-k*10,w-k*w*.24,12,col);P(x+w/2-1,top-60,2,30,shade(col,.85));}       // escalonada com antena
      else if(t<.28){for(let y=0;y<50;y++){const hw=Math.max(1,Math.round(w/2*(1-y/50)));P(x+w/2-hw,top-y,hw*2,1,col);}}       // agulha
      else if(t<.38){P(x+4,top-10,w-8,10,col);P(x+w/2-6,top-18,12,8,shade(col,.92));}                                      // casa de máquinas
      for(let y=top+6;y<base+120;y+=7)for(let xx=x+4;xx<x+w-4;xx+=5)if(R()<.35)P(xx,y,2,3,win);
      x+=w+2+R()*16;}}
  // névoa baixa, mais clara perto do chão
  for(let k=0;k<60;k++)P(0,base-60+k*2,W,2,`rgba(236,226,210,${k/60*.35})`);
}
