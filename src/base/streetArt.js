/* Arte da Rua do DHPP: pixel art desenhada em código, na mesma unidade de pixel da planta (o Lemos tem 46 px) e com as
   mesmas funções de acabamento da base (S2, refine, outlined, bush), que chegam em `A`.
   Luz: o sol vem do alto à esquerda, como na planta, e a câmera é alta. O que sai da parede mostra o topo claro e joga
   sombra para baixo e para a direita; o que entra na parede tem a sombra do vão no alto e à esquerda. */
// medidas da rua americana (docs/RUA_AMERICANA_ESPEC.md): 1 px de arte = 1 unidade; pessoa de 38, andar de 52
export const GY=340;                       // pé das fachadas = começo da calçada
export const SIDE=50;                      // fundura da calçada
export const CURB=GY+SIDE;                 // beira da calçada (topo do meio-fio)
export const ROAD=CURB+6;                  // começo do asfalto (depois da face do meio-fio)
export const WALK=[GY+6,CURB-5];           // faixa da calçada onde dá para andar
export const PARK=ROAD+22;                 // rodas dos carros estacionados, encostados no meio-fio
export const LANES=[{y:ROAD+104,dir:-1,v:66},{y:ROAD+140,dir:1,v:74}]; // faixa de cima ←, de baixo →
export const STREET_H=ROAD+160;
export const FLOOR=52;                     // altura de um andar

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

/* ---------- rua americana: provisórios das fachadas (docs/RUA_AMERICANA_ESPEC.md) ----------
   Desenhados em código só para desenvolver, no retângulo e na escala exatos da arte oficial encomendada ao ChatGPT
   (pedidos 2026-10-11-rua-us-*); o PNG oficial, quando chega em public/base/rua/, toma o lugar sem mudar nada aqui.
   Térreo de 72 px, andares de 52, fachada de 330 com o pé na calçada. */
export const FH=330,GROUND=72;
export function facadeH(b){return FH;}
const UPPER=k=>FH-GROUND-FLOOR*k; // topo do andar k (1 = logo acima do térreo)

export function facadeSprite(A,b){
  const {S2,refine,outlined,hash}=A,w=b.w,h=FH;
  if(b.k==='dhpp')b.flags=[];
  b.neon=[];
  const c=S2(w,h,(P,E,g)=>{
    const R=rnd(b.i*97+13),seed=b.i*31+5;
    if(b.gap){gapSprite(P,E,g,A,b,w,h,seed,hash,R);return;}
    if(b.k==='dhpp'){usDhpp(P,E,g,A,b,w,h,seed,hash,R);return;}
    // prédio de tijolo: andares de cima com janelas alinhadas, cornija, escada de incêndio
    brickWall(P,0,30,w,h-30,b.brick,seed,hash);P(0,30,2,h-30,'rgba(0,0,0,.30)');P(w-1,30,1,h-30,'rgba(255,235,215,.16)');
    const cols=3,cw=w/cols;
    for(let k=1;k<=4;k++)for(let i=0;i<cols;i++){const x=Math.round(i*cw+cw/2-11),y=UPPER(k)+12,t=R();
      sash(P,x,y,{type:b.win,brick:b.brick,lit:t<.25,who:t<.1,ac:R()<.3,box:R()<.2,blind:R()<.3?R():0,plant:R()<.3,curtain:['#b85a4a','#d8c39a','#5a7a9a'][Math.floor(R()*3)]});}
    if(b.escape)fireEscape(P,Math.round(b.escape==='r'?cw*1.0:cw*.1),UPPER(4)+46,UPPER(1)+46,Math.round(cw*1.9));
    cornice(P,0,30,w,b.cor||'#3a2a22');
    P(0,h-GROUND-2,w,2,SH(.25));
    usGround(P,E,g,A,b,w,h,R);
  });
  return outlined(refine(c,b.i*7+3));
}

// térreo de cada lote, como na referência
function usGround(P,E,g,A,b,w,h,R){
  const {txt,txtW}=A,gy=h-GROUND,T=(s,x,y,sz,col,sp=1)=>txt(g,s,x,y,sz,col,sp),TW=(s,sz,sp=1)=>txtW(g,s,sz,sp);
  const center=(s,y,sz,col,sp)=>T(s,w/2-TW(s,sz,sp)/2,y,sz,col,sp);
  const door=(x,col,glass=true)=>{P(x-2,h-44,26,44,'#2a1d18');P(x,h-42,22,42,col);if(glass){P(x+3,h-38,16,18,'#4f6c88');P(x+3,h-38,16,3,'rgba(0,0,0,.3)');}P(x+18,h-22,2,3,'#c9a24a');P(x,h-42,22,2,'rgba(0,0,0,.35)');P(x,h-40,2,40,'rgba(0,0,0,.25)');};
  const vit=(x,y,ww,hh,fill)=>{P(x-2,y-2,ww+4,hh+4,'#1c1612');P(x,y,ww,hh,fill);P(x,y,ww,3,'rgba(0,0,0,.35)');P(x,y,2,hh,'rgba(0,0,0,.25)');P(x+ww-1,y,1,hh,'rgba(255,255,255,.22)');for(let k=0;k<2;k++)P(x+8+k*14,y+5,2,hh-9,'rgba(255,255,255,.10)');};
  if(b.k==='diner'){
    // cromado em faixas, letreiro vermelho, janelões com o balcão e a porta
    for(let y=gy;y<h;y+=4){P(0,y,w,4,(y/4)%2?'#c9ccd0':'#e4e6e8');P(0,y,w,1,'#f6f7f8');}
    P(4,gy+4,w-8,24,'#f2f0e8');P(4,gy+4,w-8,2,'#ffffff');P(4,gy+26,w-8,2,'#9a9ea2');P(6,gy+6,w-12,20,'#e8e2d8');P(6,gy+6,w-12,1,'#c0392b');P(6,gy+25,w-12,1,'#c0392b');
    T('DINER',w/2-TW('DINER',19,1.5)/2+1,gy+24,19,'rgba(0,0,0,.25)',1.5);T('DINER',w/2-TW('DINER',19,1.5)/2,gy+23,19,'#c0392b',1.5);
    vit(6,gy+34,w-40,24,'#d8c49a');for(let x=12;x<w-38;x+=12){E(x+3,gy+44,3,3,['#d9a273','#8a5a3a','#f0c9a0','#6e4630'][(x/12|0)%4]);P(x,gy+47,7,8,['#3b5a7a','#8a2a2a','#e8e2d4','#5a3a6a'][(x/12|0)%4]);}P(6,gy+52,w-40,6,'#a8a8a8');
    P(4,gy+60,w-40,4,'#c0392b');door(w-30,'#c9ccd0');b.neon.push({x:w-60,y:gy+38,w:18,h:7,txt:'OPEN',col:'#ff4a5a'});
  }else if(b.k==='grocery'){
    P(0,gy,w,GROUND,'#5a3a2a');P(2,gy+3,w-4,22,'#2f5a3a');P(2,gy+3,w-4,1,'#4a7a52');P(2,gy+24,w-4,1,'#1f3a26');center('GROCERY',gy+20,15,'#f1e6c8',1.4);
    P(2,gy+26,w-4,8,'#1f3a26');center('COLD BEER · SODA · CIGARETTES',gy+32,4.6,'#e8d8a8',.1);
    vit(8,gy+38,w-44,30,'#3a3430');for(let k=0;k<6;k++)poster(P,10+k*14,gy+40+(k%2)*3,11,13,['#c0392b','#f2c230','#2f5aa8','#2f8a3a','#e08a2a','#e8e2d4'][k],R);
    P(12,gy+58,16,7,'#c0392b');T('ATM',13,gy+64,6,'#f2f0e8',.3);
    // caixotes de frutas encostados na vitrine
    for(let k=0;k<4;k++){const x=8+k*20;P(x,h-14,18,12,'#8a6a40');P(x,h-14,18,2,'#a8865e');for(let j=0;j<6;j++)E(x+3+(j%3)*6,h-15+(j>2?3:0),2.5,2.2,['#c0392b','#f2c230','#2f8a3a','#e08a2a'][(k+j)%4]);}
    door(w-30,'#3a2a22');
  }else if(b.k==='pawn'){
    P(0,gy,w,GROUND,'#4a3a30');P(3,gy+3,w-6,26,'#f2efe6');P(3,gy+3,w-6,2,'#ffffff');P(3,gy+28,w-6,1,'#a8a090');center('PAWN SHOP',gy+20,15,'#a82a24',1.2);P(10,gy+22,w-20,1,'#a82a24');center('BUY · SELL · LOANS',gy+28,5.5,'#3a3430',.6);
    door(8,'#3a2a22');T('213',12,gy+40,6,'#f2f0e8',.5);
    vit(36,gy+36,w-44,30,'#1c1d22');P(50,gy+48,4,14,'#a8743a');E(52,gy+46,5,6,'#c8843a');P(80,gy+50,16,12,'#3a3c40');P(82,gy+52,12,8,'#5a7a90');
    b.neon.push({x:44,y:gy+38,w:40,h:9,txt:'WE BUY',col:'#ff7a2a'});
  }else if(b.k==='laundry'){
    P(0,gy,w,GROUND,'#4a4c52');P(3,gy+3,w-6,24,'#2e4a8a');P(3,gy+3,w-6,2,'#4a6ab8');center('LAUNDRY',gy+20,15,'#f1ece0',1.2);P(3,gy+27,w-6,7,'#1e3a6a');center('WASH · DRY · FOLD',gy+33,5.5,'#e8e2d4',.6);
    vit(6,gy+38,w-38,28,'#b8c4cc');for(let k=0;k<4;k++){const x=16+k*22;P(x-8,gy+46,18,20,'#e8eaec');E(x+1,gy+56,6,6,'#9aa0a6');E(x+1,gy+56,4.5,4.5,'#5a7a90');}
    door(w-30,'#2a2b2e');b.neon.push({x:w-56,y:gy+40,w:18,h:7,txt:'OPEN',col:'#ff4a5a'});
  }else{
    // prédio residencial: entrada recuada com 3 degraus, janelas do térreo
    P(0,gy,w,GROUND,b.brick);brickWall(P,0,gy,w,GROUND,b.brick,b.i*3,A.hash);
    const dx=Math.round(w/2-13);P(dx-6,h-56,38,56,'#d8d0c0');P(dx-6,h-56,38,2,'#f2ecdf');P(dx-4,h-50,34,50,'#2a1d18');
    door(dx+2,b.door||'#2f4a3a');for(let k=0;k<3;k++){const ww=30+k*4;P(w/2-ww/2,h-9+k*3,ww,3,k%2?'#c9c3b8':'#e4e0d8');}
    for(const x of [8,w-30])sash(P,x,gy+16,{lit:R()<.3,box:R()<.4,blind:R()<.4?R():0,curtain:'#d8c39a'});
    P(0,h-8,dx-6,8,'#8f8678');P(dx+32,h-8,w-dx-32,8,'#8f8678');
  }
}

// o DHPP no centro: pórtico de pedra em arco com o escudo e a placa DHPP, escadaria recuada, porta dupla, luminárias,
// mastros com as bandeiras (o pano tremula no jogo), número 87; andares de cima em tijolo com vergas de pedra
function usDhpp(P,E,g,A,b,w,h,seed,hash,R){
  const {txt,txtW}=A,st='#cfc6b4',stl='#e6dfd0',std='#a39a88',br='#8e3b2c';
  brickWall(P,0,30,w,h-30,br,seed,hash);cornice(P,0,30,w,'#3a3a3e');
  for(let k=2;k<=4;k++)for(const x of [28,74,120]){const y=UPPER(k)+12;sash(P,x,y,{lit:R()<.25,ac:R()<.25,curtain:'#d8c39a'});}
  // pórtico: pilares, entablamento, arco
  const top=UPPER(1)-14;stoneWall(P,0,top,w,h-top,st,seed+5,hash);
  for(const x of [0,w-28]){P(x+30,top+6,4,h-top-6,SH(.22));P(x,top,28,h-top,st);P(x,top,2,h-top,stl);P(x+26,top,2,h-top,std);for(let y=top+8;y<h;y+=10)P(x+2,y,24,1,'rgba(90,80,64,.35)');P(x-2,top-4,32,5,stl);P(x-2,top+1,32,2,std);}
  P(0,top-12,w,10,st);P(0,top-12,w,2,stl);P(0,top-2,w,2,SH(.3));
  const ax=w/2,ar=54,ay=top+60;
  for(let y=top+6;y<h-22;y++){const dy=y-ay,hw=y<ay?Math.round(Math.sqrt(Math.max(0,ar*ar-dy*dy))):ar;P(ax-hw,y,hw*2,1,y<ay+4?'#2a2622':'#1e1b18');}
  for(let a=Math.PI;a<=2*Math.PI+.01;a+=.03){const x=ax+Math.cos(a)*(ar+3),y=ay+Math.sin(a)*(ar+3);P(x-2,y-2,5,5,st);P(x-2,y-2,5,1,stl);}
  P(ax-6,ay-ar-8,12,12,stl);P(ax-6,ay-ar-8,12,2,'#f6f2ea');P(ax+5,ay-ar-6,1,10,std);
  // escudo do DHPP (genérico) e a placa
  const sx=ax,sy=top+22;P(sx-9,sy-10,18,16,'#e8c63a');for(let k=0;k<8;k++)P(sx-9+k,sy+6+k,18-k*2,1,'#e8c63a');P(sx-7,sy-8,14,12,'#1e3a6a');for(let k=0;k<6;k++)P(sx-7+k,sy+4+k,14-k*2,1,'#1e3a6a');P(sx-3,sy-5,6,6,'#e8c63a');txt(g,'DHPP',sx-7,sy-5,4,'#f2f0e8',.2);
  P(ax-46,top+66,92,18,'#2a2b2e');P(ax-46,top+66,92,2,'#4a4c50');P(ax-44,top+82,88,2,SH(.35));const tw=txtW(g,'DHPP',13,4);txt(g,'DHPP',ax-tw/2,top+80,13,'#e8ecef',4);
  // porta dupla funda e a luz de dentro
  const dy0=h-22-64;P(ax-24,dy0-2,48,66,'#3a3430');P(ax-22,dy0,44,64,'#3a2a22');for(const dx of [-20,2])P(ax+dx,dy0+4,18,26,'#4f6c88');P(ax-1,dy0,2,64,'#1c1612');P(ax-22,dy0,44,4,'rgba(0,0,0,.4)');P(ax-5,dy0+36,2,4,'#c9a24a');P(ax+3,dy0+36,2,4,'#c9a24a');
  P(ax-8,dy0-6,16,3,'#f6e2a8');
  // escadaria recuada: 5 degraus, piso claro e espelho escuro, corrimãos
  for(let k=0;k<5;k++){const y=h-22+k*4.4,ww=66+k*7;P(ax-ww/2,y,ww,3,'#d8d0c0');P(ax-ww/2,y,ww,1,'#f2ecdf');P(ax-ww/2,y+3,ww,1.4,'#958d7e');}
  for(const s of [-1,1]){const rx=ax+s*40;line(P,rx,h-26,rx+s*6,h-1,1,'#1c1d20');P(rx-1,h-30,2,8,'#1c1d20');}
  // luminárias, número e mastros
  for(const lx of [ax-36,ax+36]){P(lx-3,dy0+6,6,4,'#2a2b2e');E(lx,dy0+14,5,6,'#f6d890');E(lx,dy0+13,3,4,'#fffbe0');P(lx-3,dy0+20,6,2,'#2a2b2e');}
  P(w-22,h-56,16,12,'#2a2b2e');txt(g,'87',w-20,h-46,9,'#e8e2d4',.5);
  for(const [x,s] of [[14,-1],[w-14,1]]){line(P,x,top+40,x+s*10,top+18,1,'#c9ccce');b.flags.push({x:x+s*10,y:top+18,s});}
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

/* ---------- carros em 3/4 (teto e lateral), virados para a direita, na unidade da base ---------- */
// carros americanos dos anos 80 (os ids são os nomes dos PNGs oficiais em public/base/rua/veiculos/)
export const CARS=[
  {id:'viatura-dhpp',w:154,h:50,body:'#f2f2ee',pol:true},{id:'taxi',w:150,h:52,body:'#e8c63a',taxi:true},
  {id:'sedan-bordo',w:152,h:46,body:'#7a2a2e'},{id:'sedan-azul',w:156,h:46,body:'#2f4f8a',roof:'#e8e8e0'},{id:'sedan-verde',w:150,h:46,body:'#3a5a3a'},
  {id:'sedan-bege',w:148,h:46,body:'#c8b48c'},{id:'perua-madeira',w:160,h:48,body:'#d8c8a0',wood:true},{id:'furgao-marrom',w:142,h:58,body:'#7a4a32'},
  {id:'onibus',w:300,h:84,body:'#d8d2c2',bus:true}
];
export function carSprite(A,k){
  const {S2,refine,outlined}=A,w=k.w,h=k.h||(k.bus?92:58);
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
    const hatch=k.id.startsWith('hatch'),van=k.id.startsWith('van')||k.id.startsWith('furgao'),wagon=k.id.startsWith('perua')||van,pick=k.id.startsWith('pickup');
    const top=Math.round(h*.4),base=h-Math.round(h*.19),wf=Math.round(w*.79),wr=Math.round(w*(hatch?.2:.19));
    const cx0=Math.round(w*(van?.06:wagon?.12:hatch?.16:pick?.44:.3)),cx1=Math.round(w*(pick?.68:.62));
    // capô e porta-malas vistos de cima, cantos arredondados
    RR(3,9,w-6,top-7,C.hi,4);P(7,9,w-14,1,C.hh);P(w-16,11,10,1,'rgba(255,255,255,.35)');
    for(let y=10;y<top+2;y++){P(3+(y<13?13-y:0),y,2,1,C.hh);P(w-5-(y<13?13-y:0),y,2,1,C.b);}
    // cabine: vidros inclinados e o teto
    TR(2,top+1,cx0-1,cx1+3,cx0-(wagon?2:10),cx1+14,'#1c2833');
    RR(cx0,1,cx1-cx0,top-5,k.roof||C.hi,3);P(cx0+3,2,cx1-cx0-6,1,k.roof?'#ffffff':C.hh);P(cx0+2,top-5,cx1-cx0-4,1,C.sh);P(cx1-2,4,1,top-10,C.b);
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
    // viatura do DHPP em preto e branco (frente e traseira pretas, portas brancas com o nome); perua com a lateral de madeira
    if(k.pol){const dk='#1c1d20';P(2,top,Math.round(w*.24),base-top,dk);P(Math.round(w*.75),top,Math.round(w*.25)-2,base-top,dk);P(4,9,Math.round(w*.2),top-7,'#2a2b2e');P(Math.round(w*.78),9,Math.round(w*.2)-4,top-7,'#2a2b2e');
      P(mid-12,gy1+3,24,7,'#f2f2ee');A.txt(g,'DHPP',mid-11,gy1+9,7,'#1c1d20',.4);P(mid-17,gy1+3,4,6,'#e8c63a');A.txt(g,'732',Math.round(w*.62),gy1+3,5,'#1c1d20',.2);}
    if(k.wood){P(4,gy1+3,w-8,base-gy1-6,'#7a5232');for(let x=6;x<w-6;x+=9)P(x,gy1+3,1,base-gy1-6,'#5a3a22');P(4,gy1+3,w-8,1,'#c8a878');}
    // caixa de roda escura e as rodas
    const wrad=Math.round(h*.17);for(const x of [wr,wf]){E(x,base-1,wrad+2,wrad,'#121214');wheel(x,h-wrad,wrad);}
  });
  return outlined(refine(c,k.w));
}

/* ---------- lampião, árvore e mobiliário (sprites com o pé no fim) ---------- */
/* ---------- mobiliário provisório (tamanhos de src/base/ruaAssets.js; pé no centro da última linha) ---------- */
export function propSprite(A,k,opt){
  const {S2,refine,outlined,txt}=A;
  const d={
    'lixeira':[16,24,(P,E)=>{P(2,4,12,20,'#2a2b2e');P(1,2,14,4,'#3a3c40');P(1,2,14,1,'#5a5c60');for(let x=4;x<14;x+=3)P(x,7,1,15,'#1c1d20');P(3,6,2,16,'#4a4c50');}],
    'lixeira-cheia':[18,26,(P,E)=>{P(3,8,12,18,'#2a2b2e');P(2,6,14,3,'#3a3c40');E(9,6,7,4,'#e8e2d4');E(6,5,3,2,'#c0392b');E(12,4,3,3,'#8a6a40');P(4,10,2,14,'#4a4c50');}],
    'sacos-lixo':[30,18,(P,E)=>{for(const [x,y,r] of [[8,11,7],[18,12,7],[13,6,6],[24,13,5]]){E(x,y,r,r*.85,'#1a1a1c');E(x-r*.3,y-r*.35,r*.35,r*.25,'#4a4a50');P(x-1,y-r-1,2,2,'#1a1a1c');}}],
    'cacamba':[46,32,(P)=>{P(2,8,42,24,'#2f5a3a');P(0,4,46,6,'#3a6a44');P(0,4,46,1,'#5a8a64');P(2,30,42,2,'#1f3a26');for(let x=6;x<42;x+=8)P(x,12,1,16,'#24442c');P(4,10,3,20,'#4a7a52');}],
    'caixa-papelao':[14,12,(P)=>{P(0,2,14,10,'#a8865e');P(0,2,14,2,'#c8a878');P(6,2,2,10,'#8a6a40');}],
    'pallet':[24,8,(P)=>{for(let y=0;y<8;y+=3)P(0,y,24,2,'#a8865e');for(const x of [1,11,21])P(x,0,2,8,'#7a5a3a');}],
    'caixa-correio':[16,30,(P,E)=>{P(1,8,14,16,'#2f4f9a');E(8,8,7,5,'#2f4f9a');P(1,8,3,16,'#4a6ab8');P(3,13,10,2,'#1c2a4a');P(5,17,6,4,'#e8e2d4');P(2,24,3,6,'#1c2a4a');P(11,24,3,6,'#1c2a4a');}],
    'hidrante':[10,18,(P,E)=>{P(2,6,6,11,'#b8302a');P(0,8,10,3,'#b8302a');E(5,5,3,2,'#982620');P(4,2,2,2,'#b8302a');P(1,16,8,2,'#7a1e1a');P(3,7,1,9,'#e05a4a');}],
    'parquimetro':[6,30,(P)=>{P(2,10,2,20,'#3a3c40');P(0,2,6,9,'#7a7e84');P(0,2,6,1,'#a9aeb4');P(1,4,4,3,'#1c2833');}],
    'poste-luz':[16,120,(P,E)=>{P(7,22,3,92,'#1c1d20');P(7,22,1,92,'#3a3c40');P(4,112,9,8,'#1c1d20');P(5,30,7,2,'#2a2b2e');P(3,6,10,3,'#1c1d20');E(8,13,5,6,'#f6eccc');E(8,12,3,4,'#fffbe8');P(3,19,10,3,'#1c1d20');E(8,3,2,2,'#1c1d20');}],
    'placa-proibido':[12,44,(P,E)=>{P(5,12,2,32,'#7a7e84');P(0,0,12,14,'#f2f0e8');P(0,0,12,1,'#fff');E(6,7,4.5,4.5,'#c0392b');E(6,7,3,3,'#f2f0e8');P(4,5,3,5,'#1c1d20');P(5,5,2,1,'#1c1d20');P(2,10,8,1,'#c0392b');}],
    'placa-onibus':[12,46,(P)=>{P(5,14,2,32,'#7a7e84');P(0,0,12,16,'#2f5aa8');P(0,0,12,1,'#5a80c8');P(2,4,8,6,'#f2f0e8');P(3,5,6,3,'#2f5aa8');P(3,9,2,2,'#1c1d20');P(7,9,2,2,'#1c1d20');}],
    'telefone-publico':[22,46,(P)=>{P(2,0,18,30,'#8a8e94');P(2,0,18,2,'#b4b8be');P(4,4,14,24,'#3a3c40');P(8,8,6,10,'#1c1d20');P(9,10,4,2,'#c9ccce');P(6,20,10,2,'#c9a24a');P(10,30,2,16,'#5a5e64');}],
    'jornal-azul':[14,24,(P)=>{P(1,4,12,14,'#2f5aa8');P(1,4,12,2,'#5a80c8');P(3,8,8,6,'#e8e2d4');P(4,10,6,1,'#777');P(2,18,2,6,'#3a3c40');P(10,18,2,6,'#3a3c40');}],
    'jornal-vermelho':[14,24,(P)=>{P(1,4,12,14,'#b8392b');P(1,4,12,2,'#d85a4a');P(3,8,8,6,'#e8e2d4');P(4,10,6,1,'#777');P(2,18,2,6,'#3a3c40');P(10,18,2,6,'#3a3c40');}],
    'alarme-incendio':[8,38,(P)=>{P(3,10,2,28,'#b8302a');P(0,0,8,11,'#c0392b');P(0,0,8,1,'#e05a4a');P(2,3,4,4,'#f2f0e8');}],
    'banco':[40,16,(P)=>{P(1,2,38,3,'#6a4a2a');P(1,6,38,3,'#7a5432');P(3,9,2,7,'#1c1d20');P(35,9,2,7,'#1c1d20');P(2,1,2,8,'#1c1d20');P(36,1,2,8,'#1c1d20');}],
    'semaforo':[18,96,(P,E)=>{P(8,30,3,66,'#2a3a32');P(6,90,7,6,'#2a3a32');P(3,0,12,30,'#1c1d20');P(4,1,10,28,'#e8c63a');P(5,2,8,26,'#1c1d20');const on=opt|0;for(let i=0;i<3;i++)E(9,7+i*8,3,3,i===2-on?['#3ad06a','#f2c230','#ff4a3a'][on]:'#3a3430');}],
    'placa-rua':[44,8,(P,E,g)=>{P(0,0,44,8,'#1f6a3a');P(0,0,44,1,'#3a8a5a');P(0,7,44,1,'#0f3a1f');txt(g,opt||'',3,6.5,6,'#f2f0e8',.4);}]
  }[k];
  if(!d)return null;
  return outlined(refine(S2(d[0],d[1],d[2]),k.length));
}

/* centro da cidade ao fundo: torres em camadas com névoa (a mais longe mais clara), uma com agulha, outra escalonada,
   e telhados mais perto com caixas d'água */
export function drawSkyline(P,E,W,R){
  const base=GY-FH+40;
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
