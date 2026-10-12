/* Arte da Rua do DHPP no visual da planta da base (direção aprovada: perspectiva de Beat Cop — fachadas de frente até o
   topo da tela, calçada vista de cima, rua horizontal com os carros de lado — com a paleta, as janelas, a fachada bege e o
   letreiro do DHPP da base). Tudo desenhado aqui em pixel art, na unidade da planta (os bonecos de dentro têm 46 px).

   Luz: uma regra só para a cena inteira — sol da manhã vindo do alto à esquerda. Nas fachadas, tudo que sai da parede
   (peitoris, cornijas, toldos, letreiros, aparelhos de ar, escadas de incêndio, calhas, mastros) projeta sombra para a
   direita e para baixo, na proporção do quanto sai da parede; recuos (portas, vitrines, janelas) escurecem no alto e à
   esquerda. No chão, as sombras dos objetos caem para a direita e para cá (street.js, SUN). É a mesma direção das sombras
   da planta da base. Esta camada é pintada uma vez (custo zero por quadro). */

// medidas (px da rua = px da planta)
export const GY=560;                 // pé das fachadas = começo da calçada
export const SIDE=112;               // fundura da calçada vista de cima
export const CURB=GY+SIDE;           // meio-fio
export const ROAD=CURB+12;           // começo do asfalto
export const NEAR=ROAD+250;          // calçada de cá (embaixo): via compacta, para o trânsito caber no quadro de qualquer aparelho
export const FG_TOP=NEAR+16;         // a platibanda dos prédios de baixo (primeiro plano, com o interior à mostra)
export const FG_H=300;
export const STREET_H=FG_TOP+FG_H;
export const WALK=[GY+14,CURB-10];   // onde dá para andar
export const PARK=CURB+62;           // rodas dos carros estacionados
export const LANES=[{y:ROAD+116,dir:-1,v:112},{y:ROAD+230,dir:1,v:120}];   // a de cima vai para a esquerda, a de baixo para a direita (mão americana)
// faixas de pedestres com semáforo (o x é o centro da faixa; ver street.js: o sinal fecha para os carros quando alguém espera)
export const CROSSWALKS=[{x:640},{x:1800}];
export const CW_HALF=46;             // meia largura da faixa (px de mundo)
// altura mínima que sempre precisa aparecer na tela: do térreo das lojas até a faixa de baixo do trânsito
export const BAND_TOP=GY-70,BAND_BOT=ROAD+230+26;
export const FLOOR=70,GROUND=118;    // andar e térreo
// sombra no chão: por pixel de altura, quanto ela anda para a direita (kx) e para cá (ky)
export const SUN={kx:.6,ky:.42};
// árvores da calçada (o pé do tronco); a copa é desenhada em street.js, balançando
export const TREES=[{x:446,y:CURB-16},{x:1880,y:CURB-16},{x:2262,y:CURB-16}];
// bueiros no asfalto (um solta vapor)
export const MANHOLES=[{x:744,y:ROAD+172},{x:1450,y:ROAD+172},{x:2230,y:ROAD+172}];

export function rnd(seed){let s=seed%2147483647||7;return ()=>(s=s*16807%2147483647)/2147483647;}
export const O='#1e1611';
const SHC='28,18,14';                // cor das sombras na parede (marrom-escuro, nunca preto puro)

/** pinta o quarteirão (fachadas de frente) num contexto; lots: lista de lotes com X e w.
 *  Cada lote ganha `glows` (neon, luminárias) e, no DHPP, `flags` — as camadas vivas que street.js desenha por cima. */
export function paintFacades(g,lots,A,{sign,door,bg}){
  const R=rnd(5);
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  // sombra projetada na parede por algo que sai `d` px dela (sol do alto à esquerda)
  const drop=(x,y,w,h,d,a=.3)=>{P(x+Math.round(d*.6),y+d,w,h,`rgba(${SHC},${a})`);};
  // sombra de recuo: o alto e a esquerda de uma abertura ficam no escuro
  const recess=(x,y,w,h,d,a=.38)=>{for(let k=0;k<d;k++){const t=a*(1-k/d);P(x,y+k,w,1,`rgba(${SHC},${t})`);P(x+k,y,1,h,`rgba(${SHC},${t*.75})`);}};
  const vgrad=(x,y,w,h,stops)=>{const gr=g.createLinearGradient(0,y,0,y+h);for(const [o,c] of stops)gr.addColorStop(o,c);g.fillStyle=gr;g.fillRect(x,y,w,h);};
  const box=(x,y,w,h,c,hi,lo)=>{P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,c);if(hi)P(x,y,w,1,hi);if(lo)P(x,y+h-1,w,1,lo);};
  const grain=(x,y,w,h,a=.06)=>{for(let i=0;i<w*h/14;i++)P(x+R()*w,y+R()*h,1,1,R()<.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a*.8})`);};
  // tijolo: fiadas com junta clara, tijolos de tom variado e alguns gastos; material que reage à luz (topo de cada fiada mais claro)
  const brick=(x,y,w,h,base)=>{P(x,y,w,h,base);
    for(let yy=y,r=0;yy<y+h;yy+=4,r++){P(x,yy,w,1,'rgba(214,196,176,.26)');P(x,yy+1,w,1,'rgba(255,240,220,.05)');
      for(let xx=x+(r%2?5:0);xx<x+w;xx+=10){P(xx,yy+1,1,3,'rgba(214,196,176,.2)');const t=R();if(t<.16)P(xx+1,yy+1,9,3,t<.08?'rgba(0,0,0,.08)':'rgba(255,220,190,.07)');}}
    grain(x,y,w,h);
    // manchas de chuva escorrida e fuligem, discretas
    for(let k=0;k<w/60;k++){const sx=x+R()*w,sy=y+R()*h*.8;for(let j=0;j<30+R()*40;j++)P(sx+Math.sin(j*.3)*1.2,sy+j,2,1,'rgba(30,20,16,.035)');}};
  const siding=(x,y,w,h)=>{P(x,y,w,h,'#b9a58a');for(let yy=y+4;yy<y+h;yy+=6){P(x,yy,w,1,'rgba(90,70,45,.22)');P(x,yy+1,w,1,'rgba(255,245,225,.10)');}for(let yy=y+4;yy<y+h;yy+=12)for(let xx=x+8;xx<x+w;xx+=32)P(xx+((yy>>2)%2?0:16),yy,1,6,'rgba(90,70,45,.18)');grain(x,y,w,h,.05);};
  // janela de guilhotina no traço da base: moldura branca, vidro azul, peitoril; agora com recuo, reflexo do céu e
  // o interior por trás do vidro (persiana, cortina, planta ou escuro). Às vezes acesa, com ar-condicionado ou floreira.
  const win=(x,y,{lit=false,ac=false,flower=false,w=26,h=38}={})=>{
    wins.push({x,y,w,h,lit,flower,ac});
    drop(x-3,y-4,w+6,3,3,.22);                                  // verga
    P(x-3,y-4,w+6,4,'#d8d0c0');P(x-3,y-4,w+6,1,'#f2ecdf');
    P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,'#f2efe6');
    const gx=x+2,gy=y+2,gw=w-4,gh=h-4;
    vgrad(gx,gy,gw,gh,lit?[[0,'#c99a5a'],[1,'#f0cf8a']]:[[0,'#4f6f8c'],[.55,'#7fa6c4'],[1,'#97b9d2']]);
    // interior: só na metade de baixo de cada folha, sem mudar a leitura de "vidro azul"
    const k=R();
    if(!lit&&k<.3){for(let yy=gy;yy<gy+gh*.45;yy+=2)P(gx,yy,gw,1,'rgba(236,232,220,.55)');}            // persiana
    else if(!lit&&k<.5){P(gx,gy,4,gh,'rgba(200,180,150,.6)');P(gx+gw-4,gy,4,gh,'rgba(200,180,150,.6)');}     // cortina
    else if(!lit&&k<.58){E(gx+gw*.3,gy+gh-5,4,5,'rgba(40,80,40,.75)');}                                   // planta
    if(lit&&R()<.5){P(gx,gy,5,gh,'#b85a4a');P(gx+gw-5,gy,5,gh,'#b85a4a');}
    if(lit)glows.push({x:x+w/2,y:y+h/2,r:30,c:R()<.4?'#9cc4ff':'#ffd9a0',win:true,tv:R()<.5});
    // reflexo do céu: faixa diagonal clara
    for(let j=0;j<gh;j++){const rx=gx+gw-6-j*.5;if(rx>gx)P(rx,gy+j,2,1,'rgba(255,255,255,.18)');}
    P(gx+1,gy+1,7,4,lit?'rgba(255,236,190,.6)':'rgba(220,236,248,.55)');
    P(x+2,y+h/2-1,w-4,2,'#f2efe6');P(x+w/2-.5,y+2,1,h-4,'#f2efe6');
    recess(gx,gy,gw,gh,3,.34);                                  // a moldura faz sombra no vidro
    P(x+2,y+h/2+1,w-4,1,'rgba(0,0,0,.18)');
    drop(x-3,y+h,w+6,3,2,.28);P(x-3,y+h,w+6,3,'#d8d2c4');P(x-3,y+h,w+6,1,'#f4efe4');  // peitoril
    if(ac){const ay=y+h-14;drop(x+3,ay,w-6,12,5,.3);P(x+3,ay,w-6,12,'#d9d6cb');P(x+3,ay,w-6,1,'#f2f0e8');P(x+3,ay+11,w-6,1,'#9a978c');P(x+w-4,ay,1,12,'#b5b2a6');for(let k=0;k<6;k++)P(x+5+k*3,ay+2,1,8,'#a9a69a');
      for(let j=0;j<10+R()*14;j++)P(x+w/2,ay+12+j,1,1,`rgba(40,60,80,${.22-j*.008})`);}   // pingadeira
    if(flower){drop(x-2,y+h+3,w+4,6,3,.25);P(x-2,y+h+3,w+4,6,'#5a3a24');P(x-2,y+h+3,w+4,1,'#7a5236');for(let k=0;k<w;k+=3){P(x-1+k,y+h-1,2,4,k%2?'#3a6a2e':'#69ad52');if(k%6===0)P(x+k,y+h-2,2,2,['#c0392b','#f2c230','#e8e2d4'][(k/6)%3]);}}
  };
  // varanda de apartamento: porta de vidro com o interior à vista, laje de pedra que sai da parede (e faz sombra), vasos e roupa no varal;
  // o guarda-corpo e quem está na varanda são desenhados em street.js (a pessoa fica atrás da grade)
  const balcony=(cx,y,lit)=>{const bw=44,bx=Math.round(cx-bw/2),dx=Math.round(cx-11),dy=y+10,dh=48,slab=y+58;
    drop(dx-3,dy-4,28,3,3,.22);P(dx-3,dy-4,28,4,'#d8d0c0');P(dx-3,dy-4,28,1,'#f2ecdf');
    P(dx-1,dy-1,24,dh+1,O);P(dx,dy,22,dh,'#f2efe6');
    const gx=dx+2,gy=dy+2,gw=18,gh=dh-3;vgrad(gx,gy,gw,gh,lit?[[0,'#a9763a'],[1,'#e8c27a']]:[[0,'#2c2a28'],[.6,'#4a4034'],[1,'#6a5a46']]);
    // interior: cortina, abajur e a ponta de um sofá
    P(gx,gy,4,gh,'rgba(214,196,168,.7)');P(gx+gw-3,gy,3,gh,'rgba(214,196,168,.6)');P(gx+9,gy+gh-14,2,8,'#c9a24a');E(gx+10,gy+gh-16,4,3,lit?'#ffe9a8':'#8a7a5a');P(gx+3,gy+gh-5,gw-6,5,'rgba(90,60,50,.8)');
    for(let j=0;j<gh;j++){const rx=gx+gw-5-j*.4;if(rx>gx)P(rx,gy+j,2,1,'rgba(255,255,255,.14)');}
    recess(gx,gy,gw,gh,3,.34);P(dx+10,dy+2,1,dh-4,'#f2efe6');
    drop(bx,slab,bw,6,5,.34);P(bx-1,slab,bw+2,7,O);P(bx,slab,bw,6,'#cfc8ba');P(bx,slab,bw,1,'#efeadf');P(bx,slab+5,bw,1,'#9a9486');P(bx+bw-2,slab,2,6,'rgba(0,0,0,.14)');
    for(let k=0;k<3;k++)P(bx+6+k*14,slab+6,6,3,'#a49d8e');                                     // cachorros de apoio da laje
    // vasos nas pontas
    for(const px of [bx+3,bx+bw-9]){P(px,slab-6,6,6,'#8a4a2c');P(px,slab-6,6,1,'#b06a40');E(px+3,slab-9,4,3,'#3f7d37');E(px+2,slab-10,2.5,2,'#69ad52');}
    if(R()<.4){P(bx+8,slab-26,bw-16,1,'#3a3a3a');for(let k=0;k<3;k++){const cc=['#e8e2d4','#c0392b','#2f5aa8','#f2c230'][Math.floor(R()*4)];P(bx+11+k*9,slab-25,6,8,cc);P(bx+11+k*9,slab-25,6,1,'rgba(255,255,255,.3)');}}  // varal
    balconies.push({x:bx,w:bw,slab,top:dy});};
  const cornice=(x,y,w,c='#3a2e26')=>{P(x-2,y,w+4,12,O);P(x-1,y+1,w+2,10,c);P(x-1,y+1,w+2,2,'rgba(255,255,255,.18)');P(x-1,y+9,w+2,2,'rgba(0,0,0,.25)');
    for(let k=x+4;k<x+w-4;k+=12){P(k+2,y+13,4,6,`rgba(${SHC},.3)`);P(k,y+11,4,6,c);P(k,y+11,1,6,'rgba(255,255,255,.14)');}
    vgrad(x,y+12,w,14,[[0,`rgba(${SHC},.42)`],[1,`rgba(${SHC},0)`]]);};
  // escada de incêndio de ferro: plataformas de grade, guarda-corpo, escada inclinada; sombra forte e deslocada na parede
  const fireEscape=(x,top,bot,w)=>{for(let y=top;y<bot;y+=FLOOR){
      P(x+6,y+8,w,3,`rgba(${SHC},.32)`);for(let k=0;k<w;k+=4)P(x+k+8,y-6,1,14,`rgba(${SHC},.18)`);
      P(x,y,w,3,'#1c1d20');P(x,y,w,1,'#3a3c42');for(let k=2;k<w;k+=3)P(x+k,y+1,1,1,'#45474c');
      for(let k=0;k<w;k+=4)P(x+k,y-14,1,14,'#1c1d20');P(x,y-14,w,2,'#1c1d20');P(x,y-14,w,1,'#3a3c42');
      P(x-2,y+3,3,6,'#1c1d20');P(x+w-1,y+3,3,6,'#1c1d20');
      if(y+FLOOR<bot)for(let k=0;k<FLOOR;k+=4){const sx=x+w-18+Math.round(k*12/FLOOR);P(sx+5,y+k+5,5,1,`rgba(${SHC},.2)`);P(sx,y+k,5,1,'#2a2b2e');}}};
  const txt=(s,x,y,size,col)=>{g.font=`700 ${size}px Rajdhani,"Arial Narrow",Arial,sans-serif`;g.textBaseline='middle';g.fillStyle=col;g.fillText(s,x,y);return g.measureText(s).width;};
  const signBoard=(x,y,w,h,s,bg,fg,size=20)=>{drop(x,y,w,h,6,.3);P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,bg);P(x,y,w,2,'rgba(255,255,255,.22)');P(x,y+h-3,w,3,'rgba(0,0,0,.25)');P(x+w-2,y,2,h,'rgba(0,0,0,.15)');g.font=`700 ${size}px Rajdhani,"Arial Narrow",Arial`;const tw=g.measureText(s).width;txt(s,Math.round(x+w/2-tw/2)+1,y+h/2+1,size,'rgba(0,0,0,.3)');txt(s,Math.round(x+w/2-tw/2),y+h/2,size,fg);};
  // toldo de lona listrada: caimento com luz no alto, sanefa recortada, avesso escuro e sombra larga na vitrine
  const awning=(x,y,w,col)=>{
    for(let j=0;j<22;j++)P(x+10+j*.4,y+18+j*.6,w-6,1,`rgba(${SHC},${.3*(1-j/22)})`);
    for(let j=0;j<16;j++){const sh=j/16;for(let k=0;k<w;k+=10)P(x+k-(16-j)*.3,y+j,10,1,(k/10)%2?'#efe6d2':col);P(x-(16-j)*.3,y+j,w,1,`rgba(255,250,235,${.14*(1-sh)})`);P(x-(16-j)*.3,y+j,w,1,`rgba(0,0,0,${.12*sh})`);}
    P(x-5,y,w+5,1,'rgba(255,255,255,.3)');
    for(let k=0;k<w;k+=10){E(x+k+5,y+16,5,3,(k/10)%2?'#d8ceb8':col);E(x+k+5,y+17,5,2.5,'rgba(0,0,0,.18)');}
    P(x,y+19,w,2,'rgba(0,0,0,.3)');};
  // porta com batente: recuo escuro no alto e à esquerda, soleira de pedra e arandela apagada (é de manhã)
  const doorAt=(x,y,w,h,col,lamp=true)=>{doors.push({x:Math.round(x+w/2),y:GY+14,dx:x,dy:y,w,h});P(x-3,y-4,w+6,h+4,'#d8d0c0');P(x-3,y-4,w+6,1,'#f2ecdf');P(x-1,y-1,w+2,h+1,O);P(x,y,w,h,col);
    P(x+3,y+4,w-6,h*.4,'#6f93b0');P(x+4,y+5,4,3,'rgba(220,236,248,.5)');P(x+3,y+4+h*.4,w-6,1,'rgba(0,0,0,.25)');
    for(let j=y+h*.5;j<y+h-6;j+=10){P(x+4,j,w-8,1,'rgba(0,0,0,.2)');P(x+4,j+1,w-8,1,'rgba(255,255,255,.08)');}
    P(x+w-6,y+h/2,2,3,'#c9a24a');recess(x,y,w,h,5,.45);
    P(x-5,y+h,w+10,3,'#bdb6a8');P(x-5,y+h,w+10,1,'#e4e0d8');
    if(lamp){const lx=x+w+6,ly=y+6;drop(lx,ly,4,8,3,.3);P(lx,ly,4,8,'#2a2b2e');P(lx+1,ly+2,2,4,'#c8b890');}};
  const glass=(x,y,w,h,fill,items)=>{panes.push({x:Math.round(x+w/2),w,y,h});P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,fill);items&&items();
    vgrad(x,y,w,h*.5,[[0,'rgba(20,24,30,.35)'],[1,'rgba(20,24,30,0)']]);                     // o alto da vitrine fica no escuro do toldo
    for(let j=0;j<h;j++){const rx=x+w*.55-j*.6;if(rx>x)P(rx,y+j,10,1,'rgba(255,255,255,.07)');}   // reflexo da rua
    P(x,y,w,4,'rgba(0,0,0,.3)');P(x+w-1,y,1,h,'rgba(255,255,255,.25)');for(let k=0;k<3;k++)P(x+10+k*16,y+6,2,h-10,'rgba(255,255,255,.12)');
    recess(x,y,w,h,4,.3);P(x-2,y+h,w+4,4,'#8a8478');P(x-2,y+h,w+4,1,'#b8b2a4');};
  const glows=[],doors=[],panes=[],drums=[],wins=[],balconies=[];   // o que a rua usa depois: luzes, portas (gente entra e sai), vitrines e máquinas
  const neon=(x,y,s,col)=>{const w=s.length*8+6;P(x-2,y-2,w,15,'#1a0c0e');P(x-2,y-2,w,1,'#3a2a2c');txt(s,x+1,y+5,11,col);glows.push({x:x+w/2-2,y:y+5,r:Math.max(26,w*.8),c:col,neon:true});};
  const stoop=(x,w,col)=>{doorAt(x+w/2-16,GY-74,32,56,col);for(let k=0;k<3;k++){const sx=x+w/2-26-k*4,sw=52+k*8,sy=GY-18+k*6;P(sx,sy,sw,6,k%2?'#c9c3b8':'#e4e0d8');P(sx,sy,sw,1,'#f2efe8');P(sx+sw-2,sy,2,6,'rgba(0,0,0,.18)');P(sx,sy+5,sw,1,'rgba(0,0,0,.2)');}
    for(const sx of [x+w/2-40,x+w/2+34]){drop(sx,GY-36,4,30,3,.25);P(sx,GY-36,4,30,'#1c1d20');P(sx,GY-36,1,30,'#3a3c42');}};
  // pilastra de tijolo nas pontas do prédio: face clara à esquerda (luz), escura à direita, sombra na parede ao lado
  const pier=(x,top,h,w,base)=>{P(x+w,top,4,h,`rgba(${SHC},.22)`);P(x,top,w,h,base);P(x,top,2,h,'rgba(255,236,210,.16)');P(x+w-2,top,2,h,'rgba(0,0,0,.22)');for(let yy=top;yy<top+h;yy+=4)P(x,yy,w,1,'rgba(214,196,176,.2)');};

  const SHOP={
    diner:(x,gt,w)=>{for(let y=gt;y<GY;y+=4)P(x,y,w,4,(y/4)%2?'#c9ccd0':'#e4e6e8');for(let y=gt;y<GY;y+=4)P(x,y,w,1,'rgba(255,255,255,.3)');
      glass(x+14,gt+50,w-80,GY-gt-62,'#e8c48a',()=>{P(x+14,gt+50,w-80,GY-gt-62,'#e0bc84');for(let k=0;k<Math.floor((w-100)/28);k++){E(x+40+k*28,gt+80,6,6,['#d9a273','#8a5a3a','#f0c9a0','#6e4630','#e0b48c','#a8714a'][k%6]);P(x+34+k*28,gt+86,12,14,['#3b5a7a','#8a2a2a','#e8e2d4','#5a3a6a','#3a6a4a','#d8a040'][k%6]);}P(x+14,gt+96,w-80,8,'#b02a24');P(x+14,gt+96,w-80,1,'#d84a3a');
        for(let k=0;k<4;k++){E(x+40+k*50,gt+56,5,3,'#fff4d0');}});
      glows.push({x:x+14+(w-80)/2,y:gt+70,r:(w-80)*.6,c:'#ffd9a0'});
      doorAt(x+w-54,GY-80,34,74,'#c9ccd0');neon(x+w-112,gt+58,'OPEN','#ff5a7a');},
    grocery:(x,gt,w)=>{P(x,gt,w,GY-gt,'#5a3a2a');glass(x+12,gt+50,w-70,GY-gt-80,'#3a3430',()=>{for(let s=0;s<3;s++)for(let k=0;k<Math.floor((w-80)/12);k++){P(x+16+k*12,gt+56+s*12,9,9,['#c0392b','#f2c230','#2f8a3a','#e8e2d4','#2f5aa8'][(k+s)%5]);P(x+16+k*12,gt+56+s*12,9,1,'rgba(255,255,255,.25)');}});
      for(let k=0;k<Math.floor((w-70)/26);k++){const bx=x+12+k*26;P(bx+3,GY-24,24,20,`rgba(${SHC},.3)`);P(bx,GY-26,24,20,'#8a6a40');P(bx,GY-26,24,3,'#a8865e');P(bx,GY-12,24,1,'rgba(0,0,0,.2)');for(let j=0;j<6;j++){const fx=bx+4+(j%3)*8,fy=GY-27+(j>2?4:0),c=['#c0392b','#f2c230','#2f8a3a','#e08a2a'][(k+j)%4];E(fx,fy,3.5,3,c);P(fx-2,fy-2,2,1,'rgba(255,255,255,.45)');}}doorAt(x+w-50,GY-80,34,74,'#3a2a22');},
    pawn:(x,gt,w)=>{P(x,gt,w,GY-gt,'#4a3a30');glass(x+70,gt+46,w-90,GY-gt-58,'#2a2420',()=>{P(x+100,gt+70,5,30,'#c8843a');E(x+102,gt+66,7,8,'#d89a4a');box(x+150,gt+74,30,22,'#3a3c40');P(x+153,gt+77,24,16,'#5a7a90');});
      for(let k=x+70;k<x+w-20;k+=6)P(k,gt+46,1,GY-gt-58,'rgba(30,30,34,.55)');                       // grade da vitrine
      neon(x+82,gt+52,'WE BUY','#ff9a3a');doorAt(x+20,GY-80,36,74,'#3a2a22');},
    laundry:(x,gt,w)=>{P(x,gt,w,GY-gt,'#4a4c52');glass(x+14,gt+54,w-74,GY-gt-66,'#b8c8d2',()=>{for(let k=0;k<Math.floor((w-80)/36);k++){const cx=x+38+k*36;box(cx-14,gt+68,28,32,'#e8eaec');E(cx,gt+84,9,9,'#5a7a90');drums.push({x:cx,y:gt+84});E(cx-2,gt+82,4,3,'rgba(255,255,255,.35)');}});
      glows.push({x:x+14+(w-74)/2,y:gt+80,r:(w-74)*.55,c:'#d8ecff'});
      doorAt(x+w-52,GY-80,34,74,'#2a2b2e');neon(x+w-104,gt+60,'OPEN','#ff5a7a');},
    barber:(x,gt,w)=>{P(x,gt,w,GY-gt,'#4a3a30');glass(x+60,gt+50,w-80,GY-gt-62,'#c4d6e2',()=>{P(x+60,GY-34,w-80,22,'#e8e2d4');for(let k=0;k<w-80;k+=6)P(x+60+k,GY-34,3,22,(k/6)%2?'#2a2b2e':'#e8e2d4');box(x+80,gt+66,16,20,'#5a3a2a');box(x+130,gt+66,16,20,'#5a3a2a');});
      doorAt(x+16,GY-80,34,74,'#3a2a22');const px=x+w-14;drop(px-3,gt+44,8,60,4,.3);P(px-3,gt+44,8,60,O);for(let k=0;k<58;k+=8){P(px-2,gt+45+k,6,4,'#c0392b');P(px-2,gt+49+k,6,4,'#2f5aa8');}P(px-2,gt+45,2,58,'rgba(255,255,255,.3)');
      glows.push({x:px,y:gt+74,r:22,c:'#ffe6d0',pole:true});}
  };
  for(const b of lots){
    let x=b.X,w=b.w,top=0;glows.length=0;doors.length=0;panes.length=0;drums.length=0;wins.length=0;balconies.length=0;
    // beco: só da altura do prédio mais baixo dos dois lados para baixo; acima dele, o fundo da cidade
    const roofOf=o=>!o||o.k==='alley'?0:o.k==='dhpp'?28:o.floors?Math.max(0,GY-GROUND-o.floors*FLOOR-14):0;
    if(b.k==='alley'){b.alleyTop=Math.max(roofOf(lots[b.i-1]),roofOf(lots[b.i+1]));paintGap(g,P,E,x,w,R,b.alleyTop);b.glows=[];continue;}
    // prédios de alturas diferentes (o céu aparece acima dos mais baixos) e com uma passagem estreita entre alguns deles
    if(b.k!=='dhpp'){const [il,ir]=b.inset||[0,0],roof=b.floors?Math.max(0,GY-GROUND-b.floors*FLOOR-14):0;
      const pass=(px,pw,nb)=>paintGap(g,P,E,px,pw,R,Math.max(roof,roofOf(nb)));
      if(il)pass(x,il,lots[b.i-1]);if(ir)pass(x+w-ir,ir,lots[b.i+1]);x+=il;w-=il+ir;top=roof;}
    b.fx=x;b.fw=w;b.roofTop=top;
    if(b.k==='dhpp'){
      // Prédio institucional (aprovado em 13/10/2026): concreto aparente com brises verticais, faixa azul-marinho com o nome
      // completo e o brasão, térreo de granito com grades nas janelas, câmeras e uma única entrada — a separação entre o
      // público e as áreas restritas acontece lá dentro (base.js). O letreiro, a porta e as bandeiras são os oficiais da base.
      const cx=x+w/2,sw=sign.width*1.5,sh=sign.height*1.5,GR=GY-112,BH=Math.max(38,Math.round(sh)+12),BAND=GR-BH;
      // telhado: platibanda escura, casa de máquinas, antena de rádio e parabólica recortadas no céu
      P(x+60,8,70,24,'#8a8c8e');P(x+60,8,70,3,'#a8aaac');P(x+126,8,4,24,'rgba(0,0,0,.2)');for(let k=0;k<4;k++)P(x+68+k*14,16,8,10,'#6a6c70');
      P(x+w-120,0,2,30,'#3a3c40');P(x+w-128,4,18,2,'#3a3c40');P(x+w-126,12,14,2,'#3a3c40');P(x+w-124,20,10,2,'#3a3c40');E(x+w-121,0,2,2,'#c0392b');
      E(x+w-70,22,10,6,'#d8dadc');E(x+w-68,22,6,4,'#b4b8bc');P(x+w-70,26,2,6,'#5a5e62');
      P(x-4,28,w+8,14,'#5e5f61');P(x-4,28,w+8,2,'#2a2b2e');P(x-4,30,w+8,1,'rgba(255,255,255,.18)');for(let k=0;k<w/4;k++)P(x-4+R()*(w+8),30+R()*10,2,1,'rgba(0,0,0,.15)');
      // corpo de concreto aparente: placas com junta e furos de forma, um pouco manchado
      P(x,42,w,BAND-42,'#b9b5ac');
      for(let yy=42;yy<BAND;yy+=28){P(x,yy,w,1,'rgba(70,64,56,.35)');P(x,yy+1,w,1,'rgba(255,255,255,.12)');}
      for(let xx=x;xx<x+w;xx+=62)P(xx,42,1,BAND-42,'rgba(70,64,56,.25)');
      for(let yy=56;yy<BAND;yy+=28)for(let xx=x+14;xx<x+w;xx+=31)E(xx,yy,1.2,1.2,'rgba(60,56,50,.35)');
      grain(x,42,w,BAND-42,.07);
      vgrad(x,42,w,18,[[0,`rgba(${SHC},.42)`],[1,`rgba(${SHC},0)`]]);
      // janelas em fita entre brises (as janelas da planta: gente trabalhando lá dentro)
      const n=Math.floor((w-60)/70),step=(w-80)/n;
      for(let y=70;y<BAND-60;y+=82)for(let i=0;i<n;i++)win(x+40+i*step+(step-30)/2,y,{lit:R()<.25,ac:R()<.35,w:30,h:42});
      for(let i=0;i<=n;i++){const fx=Math.round(x+40+i*step-5);P(fx+6,44,4,BAND-44,`rgba(${SHC},.2)`);P(fx,44,8,BAND-44,'#cfcbc2');P(fx,44,2,BAND-44,'#e6e2da');P(fx+6,44,2,BAND-44,'#a19d94');}
      // faixa institucional: azul-marinho com filetes dourados, sigla, nome completo e brasão
      drop(x,BAND,w,BH,6,.35);P(x-2,BAND,w+4,BH,'#1b2a44');P(x-2,BAND,w+4,2,'#c9a24a');P(x-2,BAND+BH-2,w+4,2,'#c9a24a');P(x-2,BAND+2,w+4,1,'rgba(255,255,255,.12)');
      // o letreiro oficial no centro da faixa; o nome completo à direita; o brasão à esquerda
      g.imageSmoothingEnabled=false;{const sy=Math.round(BAND+(BH-sh)/2);g.drawImage(sign,Math.round(cx-sw/2),sy,Math.round(sw),Math.round(sh));}
      {const tx=cx+sw/2+14;txt('DEPARTAMENTO DE HOMICÍDIOS',tx,BAND+BH/2-6,9,'#e8c66a');txt('E DE PROTEÇÃO À PESSOA',tx,BAND+BH/2+7,9,'#c9d2dc');}
      txt('PLANTÃO 24 HORAS',x+60,BAND+BH/2,9,'#c9d2dc');
      {const bx=x+20,by=BAND+(BH-30)/2;g.fillStyle='#c9a24a';g.beginPath();g.moveTo(bx,by);g.lineTo(bx+28,by);g.lineTo(bx+28,by+18);g.lineTo(bx+14,by+30);g.lineTo(bx,by+18);g.closePath();g.fill();
        g.fillStyle='#1b2a44';g.beginPath();g.moveTo(bx+3,by+3);g.lineTo(bx+25,by+3);g.lineTo(bx+25,by+17);g.lineTo(bx+14,by+26);g.lineTo(bx+3,by+17);g.closePath();g.fill();
        g.fillStyle='#e8c66a';g.beginPath();for(let k=0;k<10;k++){const an=-Math.PI/2+k*Math.PI/5,r=k%2?3:7;g.lineTo(bx+14+Math.cos(an)*r,by+13+Math.sin(an)*r);}g.closePath();g.fill();}
      // térreo de granito escuro
      P(x,GR,w,GY-GR,'#5c5853');for(let xx=x;xx<x+w;xx+=46)P(xx,GR,1,GY-GR,'#47443f');for(let yy=GR;yy<GY;yy+=28)P(x,yy,w,1,'#4a4742');
      P(x,GR,w,2,'#7a766f');grain(x,GR,w,GY-GR,.09);vgrad(x,GR,w,14,[[0,'rgba(0,0,0,.35)'],[1,'rgba(0,0,0,0)']]);
      // janelas do térreo com grade de ferro
      for(const wx of [x+28,x+104,x+w-160,x+w-84]){const wy=GR+22,ww=56,wh=48;P(wx-3,wy-3,ww+6,wh+6,'#3a3835');P(wx,wy,ww,wh,'#33465a');P(wx+2,wy+2,ww-4,8,'rgba(150,180,205,.35)');P(wx,wy+wh/2,ww,1,'#2a2b2e');
        for(let k=4;k<ww;k+=7){P(wx+k+1,wy,2,wh,'rgba(0,0,0,.25)');P(wx+k,wy,2,wh,'#1c1d20');P(wx+k,wy,1,wh,'#4a4c52');}P(wx,wy+10,ww,2,'#1c1d20');P(wx,wy+wh-12,ww,2,'#1c1d20');P(wx-4,wy+wh+3,ww+8,3,'#8f8a82');}
      // a entrada: pórtico de granito, marquise de concreto com o letreiro oficial, a porta oficial ladeada de vidro
      g.imageSmoothingEnabled=false;
      const dw=door.width*1.6,dh=door.height*1.9;
      const pw=dw+64,px0=cx-pw/2,py0=GY-dh-16;
      P(px0-8,py0-8,pw+16,dh+24,'#45423e');P(px0,py0,pw,dh+16,'#2a2b2e');
      for(const sx of [px0+4,cx+dw/2+6]){P(sx,py0+6,pw/2-dw/2-10,dh+2,'#4c6a82');P(sx+2,py0+8,6,dh-4,'rgba(200,225,245,.35)');P(sx,py0+dh/2,pw/2-dw/2-10,1,'#2a2b2e');}
      g.drawImage(door,Math.round(cx-dw/2),Math.round(GY-dh-8),Math.round(dw),Math.round(dh));
      recess(px0,py0,pw,dh+16,10,.45);
      const my=py0-18;drop(px0-26,my,pw+52,12,8,.4);P(px0-26,my,pw+52,12,'#8a8680');P(px0-26,my,pw+52,2,'#bdb8b0');P(px0-26,my+10,pw+52,2,'#55524c');
      for(let k=0;k<5;k++){const lx=px0-12+k*(pw+24)/4;P(lx,my+12,5,2,'#fff2c8');glows.push({x:lx+2,y:my+16,r:22,c:'#ffe6b0',lamp:true});}
      // placa de atendimento, interfone e câmeras de segurança
      P(px0-22,GY-62,14,20,'#d8dade');P(px0-21,GY-61,12,6,'#1b2a44');P(px0-19,GY-52,8,6,'#2a2b2e');E(px0-15,GY-46,1.5,1.5,'#3bd16f');
      txt('ATENDIMENTO 24H',cx-34,py0-4+0,7,'#e8ecef');
      for(const [cx2,cy2] of [[px0-30,py0-30],[px0+pw+30,py0-30],[x+8,GR+6],[x+w-14,GR+6]]){P(cx2-1,cy2-6,3,6,'#2a2b2e');E(cx2+1,cy2+1,5,4,'#e6e8ea');E(cx2+1,cy2+2,3,2,'#1c1d20');E(cx2+3,cy2+2,1,1,'#d03030');}
      // degraus e rampa
      for(let k=0;k<3;k++){const ww=pw+20+k*14,yy=GY-10+k*4-6;P(cx-ww/2,yy,ww,4,k%2?'#a9a49c':'#c4bfb6');P(cx-ww/2,yy,ww,1,'#d8d4cc');P(cx-ww/2,yy+3,ww,1,'rgba(0,0,0,.25)');}
      // mastros das bandeiras (o pano é desenhado no jogo, tremulando)
      b.flags=[];for(const fx of [Math.round(px0-60),Math.round(px0+pw+56)]){P(fx+5,GY-194,3,188,`rgba(${SHC},.22)`);P(fx,GY-200,4,196,'#c9ccce');P(fx,GY-200,1,196,'#eef0f2');P(fx+3,GY-200,1,196,'#8a8c90');E(fx+2,GY-202,3,2.5,'#e8c63a');P(fx-4,GY-8,12,8,'#6a6e72');P(fx-4,GY-8,12,1,'#9a9ea2');b.flags.push({x:fx+4,y:GY-196,v:b.flags.length?'dh':'br'});}
      P(x,GY-6,w,6,'#4a4742');P(x,GY-6,w,1,'#6a665f');
      // frades de concreto na calçada, protegendo a entrada
      for(let k=0;k<6;k++){const bx2=Math.round(cx-pw/2-30+k*(pw+60)/5);P(bx2+3,GY+6,6,4,'rgba(0,0,0,.25)');P(bx2,GY+2,6,12,'#9a968e');P(bx2,GY+2,6,2,'#c4c0b8');P(bx2+4,GY+2,2,12,'rgba(0,0,0,.18)');}
      facadeLight(g,vgrad,x,40,w,GY-40);
      b.glows=glows.slice();b.doors=doors.slice();b.panes=panes.slice();b.wins=wins.slice();b.balconies=[];continue;}
    // prédio de tijolo: andares até o topo, cornija, escada de incêndio e o térreo (loja ou entrada)
    brick(x,top,w,GY-top,b.brick);P(x-1,top,1,GY-top,O);P(x+w,top,1,GY-top,O);
    const gTop=GY-GROUND,cols=Math.max(2,Math.round((w-30)/58)),cw=(w-30)/cols;
    for(let y=gTop-FLOOR;y>top-50;y-=FLOOR){
      // friso de pedra entre os andares, com a sombra que ele joga no tijolo de baixo
      P(x,y+65,w,4,`rgba(${SHC},.3)`);P(x,y+60,w,5,'#c8bea8');P(x,y+60,w,1,'#e8e0d0');P(x,y+64,w,1,'#a49a86');
      for(let i=0;i<cols;i++){const wx=Math.round(x+15+i*cw+cw/2-13);if(y+12<top)continue;if(b.k==='apt'&&i%2===0){balcony(wx+13,y,R()<.4);continue;}win(wx,y+14,{lit:R()<.25,ac:R()<.3,flower:R()<.18});}}
    if(b.fire)fireEscape(Math.round(x+w*.5),gTop-FLOOR+56,gTop,Math.round(w*.42));
    cornice(x,top,w,b.cor);
    if(top>30){const rr=rnd(b.i*13+5);   // no telhado: caixa d'água de madeira, chaminé e antena recortadas contra o céu
      const tx=x+20+rr()*(w*.5);P(tx,top-30,24,26,'#6a4a32');for(let k=0;k<24;k+=5)P(tx+k,top-30,1,26,'#4a3322');P(tx,top-30,24,2,'#8a6a4c');P(tx-2,top-34,28,5,'#3a2e26');P(tx+3,top-4,3,4,'#2a2a2c');P(tx+18,top-4,3,4,'#2a2a2c');
      const cx2=x+w-40-rr()*30;P(cx2,top-18,12,18,b.brick);P(cx2,top-18,12,2,'#5a4a3e');P(cx2+12,top-16,2,16,'rgba(0,0,0,.25)');
      if(rr()<.7){const ax=x+w*.7;P(ax,top-40,1,40,'#3a3a3e');P(ax-7,top-34,15,1,'#3a3a3e');P(ax-5,top-27,11,1,'#3a3a3e');}}
    pier(x,top+12,GY-top-12,8,b.brick);pier(x+w-8,top+12,GY-top-12,8,b.brick);
    // o térreo fica recuado sob a viga: a viga faz sombra no alto da loja
    P(x+8,gTop-6,w-16,6,'#3a2e26');P(x+8,gTop-6,w-16,1,'#5a4a3e');
    if(b.k==='apt'){P(x+8,gTop,w-16,GY-gTop,'rgba(0,0,0,.04)');stoop(x,w,b.door||'#2f4a3a');for(const xx of [x+14,x+w-40])win(xx,gTop+30,{lit:R()<.3,flower:true});}
    else{SHOP[b.k]&&SHOP[b.k](x+8,gTop,w-16);vgrad(x+8,gTop,w-16,22,[[0,`rgba(${SHC},.45)`],[1,`rgba(${SHC},0)`]]);
      if(b.awn)awning(x+12,gTop+30,w-24,b.awn);if(b.name)signBoard(x+16,gTop+4,w-32,26,b.name,b.signc||'#2a2e33',b.ink||'#e8ecef');}
    P(x,GY-6,w,6,'#7a6a52');P(x,GY-6,w,1,'#8f816b');
    facadeLight(g,vgrad,x,top,w,GY-top);
    b.glows=glows.slice();b.doors=doors.slice();b.panes=panes.slice();b.drums=drums.slice();b.wins=wins.slice();b.balconies=balconies.slice();
  }
}

// luz geral da fachada: céu clareia o alto, o chão escurece a base (oclusão), cantos com sombra de contato
function facadeLight(g,vgrad,x,y,w,h){
  vgrad(x,y,w,h,[[0,'rgba(255,238,210,.07)'],[.55,'rgba(255,238,210,0)'],[.85,'rgba(20,14,10,.05)'],[1,'rgba(20,14,10,.16)']]);
  const gr=g.createLinearGradient(x+w-14,0,x+w,0);gr.addColorStop(0,'rgba(20,14,10,0)');gr.addColorStop(1,'rgba(20,14,10,.16)');g.fillStyle=gr;g.fillRect(x+w-14,y,14,h);
}

// vão entre dois prédios, visto de frente: não se vê a parede lateral dos vizinhos (só a sombra que o da esquerda joga),
// e sim o que está atrás — o prédio do fundo do quarteirão, mais baixo, apagado pela distância — e, embaixo, o chão da
// passagem recuando até ele, fechado na calçada por um muro com portão (vão estreito) ou por uma tela de arame (vão largo).
// Acima do prédio do fundo fica o céu com a cidade (já pintado).
function paintGap(g,P,E,x,w,R,top){
  const vg=(x,y,w,h,a,b)=>{const gr=g.createLinearGradient(x,0,x+w,0);gr.addColorStop(0,a);gr.addColorStop(1,b);g.fillStyle=gr;g.fillRect(x,y,w,h);};
  const bt=Math.round(top+20+R()*90),col=['#5e4a3e','#6a4f40','#55504a','#7a6450'][Math.floor(R()*4)],fl=GY-24;
  // prédio do fundo
  P(x,bt,w,fl-bt,col);P(x,bt,w,3,'#3a2e26');P(x,bt,w,1,'#6a5a4e');
  for(let y=bt+5;y<fl;y+=4)P(x,y,w,1,'rgba(214,196,176,.1)');
  const cols=w>=26?Math.floor((w-6)/20):w>=14?1:0;
  for(let y=bt+14;y<fl-30;y+=34)for(let i=0;i<cols;i++){const wx=Math.round(cols===1?x+w/2-5:x+6+i*((w-12)/cols)+((w-12)/cols-10)/2);
    P(wx-1,y-1,12,16,'#a89e8c');P(wx,y,10,14,R()<.15?'#9a7a4a':'#2e3640');P(wx,y+6,10,1,'#a89e8c');P(wx+1,y+1,3,2,'rgba(200,220,236,.25)');}
  if(w>=50)for(let y=bt+34;y<fl-34;y+=34){const fx=x+w*.55,fw=Math.min(30,w*.35);P(fx,y,fw,2,'#1c1d20');for(let j=0;j<fw;j+=3)P(fx+j,y-7,1,7,'#1c1d20');P(fx,y-7,fw,1,'#1c1d20');for(let j=0;j<26;j+=3)P(fx+fw-8+Math.round(j*6/26),y+2+j,3,1,'#2a2b2e');}
  P(x,bt,w,fl-bt,'rgba(110,122,140,.22)');                                  // a distância apaga as cores
  // chão da passagem, recuando até o fundo, com uma poça e sujeira
  P(x,fl,w,GY-fl,'#4a4642');for(let y=fl;y<GY;y+=5)P(x,y,w,1,'rgba(0,0,0,.16)');P(x,fl,w,2,'rgba(0,0,0,.4)');
  for(let i=0;i<w/4;i++)P(x+R()*w,fl+R()*(GY-fl),1,1,'rgba(0,0,0,.3)');
  if(w>=30)E(x+w*.6,GY-10,Math.min(12,w*.25),2,'rgba(140,165,190,.3)');
  // sombra do prédio da esquerda (sol do alto à esquerda) e um pouco de escuro no canto direito
  vg(x,top,Math.min(w,34),GY-top,'rgba(16,10,8,.55)','rgba(16,10,8,0)');P(x+w-2,top,2,GY-top,'rgba(0,0,0,.25)');
  // fechamento na calçada
  if(w>=34){const h=40;P(x,GY-h,w,2,'#4a4c50');for(let px=x+2;px<x+w-1;px+=28)P(px,GY-h,2,h,'#3a3c40');P(x+w-3,GY-h,2,h,'#3a3c40');
    for(let yy=GY-h+3;yy<GY;yy+=3)for(let xx=x+((yy>>1)%2?1:2);xx<x+w;xx+=3)P(xx,yy,1,1,'rgba(170,176,184,.45)');}
  else{const h=46;P(x,GY-h,w,h,'rgba(20,20,24,.15)');P(x,GY-h,w,2,'#2a2b2e');for(let xx=x+1;xx<x+w;xx+=3)P(xx,GY-h,1,h,'#2a2b2e');P(x,GY-h+20,w,1,'#2a2b2e');P(x+w-4,GY-h+24,2,3,'#c9a24a');}
  // varal ou fios cruzando o vão, presos nas paredes dos vizinhos
  if(w>=40){const y=top+30+Math.floor(R()*60);for(let k=0;k<=w;k++){const t=k/w;P(x+k,y+Math.sin(t*Math.PI)*6,1,1,'#1a1a1c');}
    for(let k=0;k<3;k++){const t=(k+1)/4,cx=x+w*t,cy=y+Math.sin(t*Math.PI)*6;P(cx-3,cy,6,8,['#e8e2d4','#c0392b','#2f5aa8','#f2c230'][Math.floor(R()*4)]);P(cx-3,cy,6,1,'rgba(255,255,255,.3)');}}
}

/** chão: calçada de lá (vista de cima), meio-fio, asfalto com vagas e faixas, calçada de cá.
 *  ART(path) devolve a imagem oficial já carregada (ou null): manchas, lixo, bueiros e bocas de lobo entram quando chegam. */
export function paintGround(g,W,ART,stalls){
  const R=rnd(9);const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const grain=(x,y,w,h,a=.06,n)=>{for(let i=0;i<(n??w*h/14);i++)P(x+R()*w,y+R()*h,1,1,R()<.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a*.8})`);};
  const img=(p,sx,sy,sw,sh,dx,dy,dw,dh,a=1)=>{const im=ART&&ART(p);if(!im)return false;g.globalAlpha=a;g.drawImage(im,sx,sy,sw,sh,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));g.globalAlpha=1;return true;};
  // calçada de lajotas de concreto: cada placa com bisel (luz em cima e à esquerda, sombra embaixo e à direita),
  // tom levemente diferente, rachaduras, chiclete e manchas
  const walk=(y0,y1)=>{P(0,y0,W,y1-y0,'#b4aea2');
    for(let y=y0,r=0;y<y1;y+=32,r++){for(let x=(r%2)*32-64;x<W;x+=64){const t=R();
      if(t<.3)P(x+1,y+1,63,31,t<.15?'rgba(120,110,96,.12)':'rgba(255,250,240,.09)');
      P(x,y,64,1,'#a19b8f');P(x,y+1,64,1,'#c6c0b4');P(x,y,1,32,'#a19b8f');P(x+1,y,1,32,'#c2bcb0');P(x+62,y+2,1,29,'rgba(0,0,0,.05)');P(x+2,y+30,61,1,'rgba(0,0,0,.05)');}}
    grain(0,y0,W,y1-y0);
    for(let i=0;i<W/40;i++){let x=R()*W,y=y0+6+R()*(y1-y0-12);for(let k=0;k<9;k++){P(x,y,2,1,'#8f897d');P(x,y+1,2,1,'rgba(255,255,255,.18)');x+=2;y+=R()<.5?1:-1;}}
    for(let i=0;i<W/22;i++){const x=R()*W,y=y0+4+R()*(y1-y0-8);P(x,y,2,2,'rgba(60,56,50,.35)');P(x,y,1,1,'rgba(90,86,80,.3)');}
    for(let i=0;i<W/320;i++){const k=Math.floor(R()*6),x=R()*W,y=y0+10+R()*(y1-y0-24);if(!img('chao/manchas.png',k*32,0,32,12,x,y,32,12,.5))E(x+16,y+6,14,4,'rgba(60,56,50,.12)');}
    for(let i=0;i<W/600;i++){const k=Math.floor(R()*8),x=R()*W,y=y0+6+R()*(y1-y0-14);img('chao/lixo-chao.png',k*10,0,10,6,x,y,10,6);}};
  walk(GY,CURB);
  // pé das fachadas: sombra de contato larga e suave
  {const gr=g.createLinearGradient(0,GY,0,GY+22);gr.addColorStop(0,'rgba(20,14,10,.32)');gr.addColorStop(1,'rgba(20,14,10,0)');g.fillStyle=gr;g.fillRect(0,GY,W,22);}
  // canteiros das árvores: grade de ferro com terra
  for(const t of TREES){P(t.x-17,t.y-9,34,16,'#3a2e24');P(t.x-17,t.y-9,34,1,'#24201c');for(let k=-15;k<16;k+=4)P(t.x+k,t.y-8,2,14,'#2a2b2e');P(t.x-18,t.y-10,36,1,'#8a857a');P(t.x-18,t.y+7,36,1,'#d2ccc0');}
  // meio-fio de granito: o alto pega luz, a face fica na sombra, a sarjeta escura com folhas e bocas de lobo
  P(0,CURB,W,4,'#dcd6ca');P(0,CURB,W,1,'#f0ebe0');P(0,CURB+4,W,7,'#8a857a');P(0,CURB+4,W,1,'#a8a296');P(0,CURB+10,W,1,'#5a564e');for(let x=0;x<W;x+=43){P(x,CURB,1,11,'#6e6a60');P(x+1,CURB,1,4,'#f4f0e6');}
  P(0,ROAD,W,NEAR-ROAD,'#4a4c52');
  // asfalto: manchas grandes de tom, grão fino de brita, remendos com junta e trincas seladas
  for(let i=0;i<W/30;i++)E(R()*W,ROAD+R()*(NEAR-ROAD),10+R()*30,3+R()*7,'rgba(20,20,24,.18)');
  for(let i=0;i<W/50;i++)E(R()*W,ROAD+R()*(NEAR-ROAD),20+R()*40,4+R()*8,'rgba(120,124,132,.06)');
  grain(0,ROAD,W,NEAR-ROAD,.1);
  for(let i=0;i<W/500;i++){const x=R()*W,y=ROAD+30+R()*(NEAR-ROAD-80),w=30+R()*50,h=12+R()*14;for(let j=0;j<h;j++){const in_=Math.round(R()*3);P(x+in_,y+j,w-in_-Math.round(R()*3),1,'rgba(30,30,36,.16)');}grain(x,y,w,h,.08,w*h/30);}
  for(let i=0;i<W/60;i++){let x=R()*W,y=ROAD+10+R()*(NEAR-ROAD-20);for(let k=0;k<12;k++){P(x,y,2,1,'#2e3034');P(x,y+1,2,1,'rgba(255,255,255,.05)');x+=2;y+=R()<.5?1:-1;}}
  // sarjeta junto ao meio-fio
  P(0,ROAD,W,6,'#35373c');P(0,ROAD+6,W,3,'rgba(0,0,0,.12)');for(let i=0;i<W/14;i++)P(R()*W,ROAD+1+R()*5,2,1,['#6a5a3a','#8a6a3a','#5a4a2a','#7a7a70'][Math.floor(R()*4)]);
  for(let x=150;x<W;x+=560)if(!img('chao/boca-de-lobo.png',0,0,24,6,x,CURB+5,31,8)){P(x,CURB+5,30,6,'#1c1d20');for(let k=2;k<30;k+=4)P(x+k,CURB+6,2,4,'#3a3c40');}
  // rodagem: faixas mais lisas e escuras onde passam os pneus, e pingos de óleo no meio de cada pista e nas vagas
  for(const L of LANES){for(const dy of [-6,-2]){P(0,L.y+dy,W,3,'rgba(26,26,30,.18)');}for(let i=0;i<W/26;i++)E(R()*W,L.y-22+R()*8,2+R()*6,1+R()*2,'rgba(16,16,20,.3)');}
  for(let i=0;i<W/40;i++)E(R()*W,PARK-18+R()*10,3+R()*9,1.5+R()*3,'rgba(16,16,20,.28)');
  P(0,ROAD,W,2,'#3a3c40');
  // pintura gasta: as faixas perdem pixels onde os carros passam
  const paint=(x,y,w,h,c)=>{P(x,y,w,h,c);for(let k=0;k<w*h/16;k++)P(x+R()*w,y+R()*h,1,1,'rgba(74,76,82,.6)');};
  // vagas ao longo do meio-fio de cima (ficam sem marca perto das faixas de pedestres) e linha lateral da faixa de estacionamento
  const edges=new Set();for(const [x0,w] of stalls||[]){edges.add(Math.round(x0));edges.add(Math.round(x0+w));}
  for(const x of edges)paint(x-1,ROAD+6,3,58,'rgba(232,232,224,.55)');
  paint(0,ROAD+68,W,2,'rgba(232,232,224,.5)');
  paint(0,ROAD+142,W,3,'#d8b43a');paint(0,ROAD+148,W,3,'#d8b43a');   // faixa dupla amarela, entre as duas mãos
  for(const m of MANHOLES){E(m.x+2,m.y+2,16,6,'rgba(0,0,0,.3)');if(!img('chao/bueiro.png',0,0,20,8,m.x-15,m.y-6,30,12)){E(m.x,m.y,16,6,'#2e3034');E(m.x,m.y,13,5,'#55575d');for(let k=-9;k<=9;k+=3)P(m.x+k,m.y-3,2,6,'#3e4044');}E(m.x-4,m.y-3,8,1.5,'rgba(255,255,255,.08)');}
  // calçada de cá: o meio-fio visto de cima e as lajotas
  // faixas de pedestres: a peça oficial (listras empilhadas, 3x) de meio-fio a meio-fio, com a linha de retenção dos carros
  for(const c of CROSSWALKS){
    const im=ART&&ART('chao/faixa-pedestres.png'),bw=30*3,x0=c.x-bw/2;
    for(let y=ROAD+4;y<NEAR-6;y+=48){if(im){g.imageSmoothingEnabled=false;g.drawImage(im,0,0,30,16,Math.round(x0),y,bw,48);}else{P(x0+3,y,bw-6,22,'#d8d3bd');}}
    // linha de retenção: de cima (mão para a esquerda) à direita da faixa; de baixo (mão para a direita) à esquerda dela
    paint(c.x+CW_HALF+10,ROAD+72,4,70,'#e8e8e0');paint(c.x-CW_HALF-14,ROAD+154,4,86,'#e8e8e0');
  }
  P(0,NEAR,W,4,'#d2ccc0');P(0,NEAR,W,1,'#ece6da');P(0,NEAR+4,W,6,'#8a857a');walk(NEAR+10,FG_TOP);
}


/** Desgaste e sujeira (pintado uma vez, por cima das fachadas e do chão): escorridos sob peitoris e cornijas, respingo de lama no pé
 *  das paredes, reboco soltando, trincas, calhas, cartazes e rabiscos no beco; no chão, sombra dos prédios na calçada com
 *  manchas de sol nos becos, poças que refletem o céu, sarjeta suja, chiclete, bitucas e a sujeira das faixas. Tudo discreto. */
/** poças pintadas no chão (street.js faz o sol brilhar nelas) */
export const PUDDLES=[];
export function paintWear(g,lots,W){
  const R=rnd(31);
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const streak=(x,y,len,a,w=1,col='26,18,14')=>{for(let j=0;j<len;j++)P(x+(j>len*.6&&R()<.3?1:0),y+j,w,1,`rgba(${col},${a*(1-j/len)})`);};
  const vgrad=(x,y,w,h,stops)=>{const gr=g.createLinearGradient(0,y,0,y+h);for(const [o,c] of stops)gr.addColorStop(o,c);g.fillStyle=gr;g.fillRect(x,y,w,h);};
  const near=(x,m=70)=>CROSSWALKS.some(c=>Math.abs(c.x-x)<m);
  for(const b of lots){const x=b.X,w=b.w;
    if(b.k==='alley'){if(w<40)continue;   // cartazes e rabiscos no muro/portão da frente do vão
      const post=(px,py,c)=>{P(px-1,py-1,12,16,'rgba(20,14,10,.5)');P(px,py,10,14,c);for(let k=0;k<3;k++)P(px+1,py+2+k*4,8,1,'rgba(40,30,24,.55)');P(px+7,py,3,3,'rgba(255,255,255,.12)');P(px,py+13,10,1,'rgba(0,0,0,.3)');};
      post(x+8,GY-92,'#a89a78');post(x+w-20,GY-104,'#8aa09a');continue;}
    const dh=b.k==='dhpp',sills=(b.wins||[]).map(v=>[v.x,v.y+v.h-2,v.w]);
    for(const [sx,sy,sw] of sills){const n=3+Math.floor(R()*3);for(let k=0;k<n;k++)streak(sx+2+R()*(sw-4),sy+5,14+R()*34,(dh?.09:.12)+R()*.11,R()<.3?2:1);
      if(R()<.3)streak(sx+R()*sw,sy+5,10+R()*18,.14,1,'236,230,216');}
    if(!dh){const fx=b.fx??x,fw=b.fw??w,rt=b.roofTop||0;for(let k=fx+8;k<fx+fw-8;k+=14+R()*30)streak(k,rt+28,14+R()*40,.16);
      // calha de ferro descendo pelo canto: sombra, corpo, braçadeiras e o cotovelo no pé
      const gx=fx+fw-22,gt=rt+32;P(gx+4,gt+2,3,GY-gt-14,'rgba(28,18,14,.28)');P(gx,gt,5,GY-gt-12,'#4f4f4c');P(gx,gt,1,GY-gt-12,'#7d7d79');P(gx+4,gt,1,GY-gt-12,'#2e2e2c');for(let y=gt+20;y<GY-14;y+=46)P(gx-1,y,7,2,'#2a2a28');P(gx-2,GY-14,9,4,'#3c3c3a');
      for(let i=0;i<fw/80;i++){const px=fx+14+R()*(fw-40),py=rt+40+R()*(GY-rt-200),pw=8+R()*14,ph=6+R()*12,t=R();if(t<.5){P(px,py,pw,ph,'rgba(214,198,176,.13)');P(px,py+ph,pw,1,'rgba(30,20,14,.2)');}else P(px,py,pw,ph,'rgba(54,34,26,.16)');}
      for(let i=0;i<fw/130;i++){let px=fx+14+R()*(fw-30),py=rt+30+R()*(GY-rt-180);for(let k=0;k<10+R()*16;k++){P(px,py,1,1,'rgba(18,12,10,.38)');px+=R()<.5?1:0;py+=R()<.7?1:0;if(R()<.3)px-=R()<.5?1:0;}}}
    // respingo de lama e fuligem no pé da parede
    vgrad(x,GY-64,w,64,[[0,'rgba(30,22,16,0)'],[1,'rgba(30,22,16,.3)']]);
    for(let i=0;i<w/2.2;i++){const t=R();P(x+R()*w,GY-3-t*t*34,1,1,`rgba(40,30,22,${.18+.3*(1-t)})`);}
  }
  // chão: os prédios fazem sombra na calçada de manhã; os becos deixam o sol entrar em manchas inclinadas
  vgrad(0,GY,W,64,[[0,'rgba(24,26,40,.3)'],[.45,'rgba(24,26,40,.08)'],[1,'rgba(24,26,40,0)']]);
  for(const b of lots)if(b.k==='alley'){const x=b.X,w=b.w;for(const [a,h] of [[.1,72],[.07,110]]){g.fillStyle=`rgba(255,238,196,${a})`;g.beginPath();g.moveTo(x+6,GY);g.lineTo(x+w-6,GY);g.lineTo(x+w-6+SUN.kx*h*1.6,GY+h);g.lineTo(x+6+SUN.kx*h*1.6,GY+h);g.closePath();g.fill();}}
  // poças: escuras no meio, o céu refletido por cima e um fio de luz
  PUDDLES.length=0;
  const puddle=(x,y,rx,ry)=>{PUDDLES.push({x,y,rx,ry});E(x,y,rx,ry,'rgba(30,36,48,.5)');E(x-rx*.1,y-ry*.2,rx*.82,ry*.6,'rgba(150,176,202,.34)');E(x-rx*.3,y-ry*.35,rx*.35,Math.max(.8,ry*.18),'rgba(238,246,255,.4)');};
  for(let i=0,n=0;n<9&&i<80;i++){const x=40+R()*(W-80);if(near(x,90))continue;n++;
    if(n<=3)puddle(x,GY+70+R()*(CURB-GY-90),12+R()*16,2.5+R()*2);else puddle(x,n%2?ROAD+10+R()*14:ROAD+60+R()*60,16+R()*26,3+R()*4);}
  // sarjeta suja: sedimento, folhas secas e um fio de água escura
  for(let i=0;i<W/9;i++)P(R()*W,CURB+5+R()*5,1+R()*2,1,R()<.5?'rgba(34,28,22,.5)':'rgba(70,60,44,.45)');
  for(let i=0;i<W/46;i++)P(R()*W,CURB+5+R()*5,2+R()*2,1,['#7a5a2a','#5a6a2a','#a8742a','#6a4a22'][Math.floor(R()*4)]);
  for(let i=0;i<W/180;i++)E(R()*W,CURB+8,8+R()*18,1.6,'rgba(24,26,34,.4)');
  // calçada: chiclete, bitucas, manchas de gordura e nódoas de chuva
  for(let i=0;i<W/55;i++){const x=R()*W,y=GY+14+R()*(CURB-GY-26);P(x,y,2,2,'rgba(78,70,66,.65)');P(x,y,1,1,'rgba(120,110,104,.5)');}
  for(let i=0;i<W/80;i++){const x=R()*W,y=GY+14+R()*(CURB-GY-26);P(x,y,2,1,'#e8e2d4');P(x+2,y,1,1,R()<.5?'#c97a3a':'#9a948a');}
  for(let i=0;i<W/45;i++)E(R()*W,GY+10+R()*(CURB-GY-20),4+R()*12,1.5+R()*3,`rgba(44,38,32,${.06+R()*.08})`);
  // faixas e vagas gastas: a sujeira dos pneus por cima da tinta
  for(const c of CROSSWALKS)for(let i=0;i<70;i++)P(c.x-46+R()*92,ROAD+4+R()*(NEAR-ROAD-8),1+R()*5,1,'rgba(40,40,44,.34)');
}


/** Fundo da cidade atrás do quarteirão (aparece acima dos prédios mais baixos e no alto dos becos): céu da manhã com nuvens,
 *  duas camadas de prédios distantes cada vez mais apagados pela névoa (janelas, caixas d'água, antenas, uma torre com agulha)
 *  e o brilho do sol no alto à esquerda. Pintado uma vez, numa camada própria. */
export function paintSkyline(g,W,H){
  const R=rnd(55);
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const sky=g.createLinearGradient(0,0,0,420);sky.addColorStop(0,'#86a3c2');sky.addColorStop(.55,'#b9c7d4');sky.addColorStop(1,'#e2d8c8');g.fillStyle=sky;g.fillRect(0,0,W,H);
  const sun=g.createRadialGradient(0,0,0,0,0,700);sun.addColorStop(0,'rgba(255,236,200,.45)');sun.addColorStop(1,'rgba(255,236,200,0)');g.fillStyle=sun;g.fillRect(0,0,W,H);
  // nuvens: bolos de elipses com a base mais escura
  for(let i=0;i<W/180;i++){const cx=R()*W,cy=18+R()*110,n=4+Math.floor(R()*5),sc=.6+R()*.8;
    for(let k=0;k<n;k++){const ox=(k-n/2)*16*sc+R()*8,oy=-R()*10*sc;E(cx+ox,cy+oy+4,16*sc,6*sc,'rgba(150,160,180,.22)');E(cx+ox,cy+oy,16*sc+R()*6,9*sc,'rgba(255,255,255,.55)');}}
  const layer=(top0,top1,col,win,haze,seed)=>{const r=rnd(seed);
    for(let x=-20;x<W;){const w=34+Math.floor(r()*90),t=top0+Math.floor(r()*(top1-top0));
      P(x,t,w,H-t,col);
      if(r()<.3){P(x+4,t-6,w-8,6,col);}                                        // recuo no topo
      if(r()<.35){const tx=x+6+r()*(w-20);P(tx,t-12,10,10,col);P(tx-1,t-14,12,3,col);P(tx+2,t-2,1,2,col);P(tx+7,t-2,1,2,col);}   // caixa d'água
      if(r()<.3)P(x+w*.7,t-18,1,18,col);                                        // antena
      for(let yy=t+6;yy<H;yy+=7)for(let xx=x+4;xx<x+w-4;xx+=6)if(r()<.75)P(xx,yy,2,3,win);
      x+=w+(r()<.3?Math.floor(r()*14):0);}
    const hz=g.createLinearGradient(0,top0,0,H);hz.addColorStop(0,`rgba(214,220,226,${haze})`);hz.addColorStop(1,`rgba(214,220,226,${haze*.4})`);g.fillStyle=hz;g.fillRect(0,top0-20,W,H);};
  layer(110,280,'#a7b3c1','rgba(206,214,224,.55)',.25,7);
  // uma torre alta ao longe, com agulha
  {const tx=1560,tt=40;P(tx,tt+40,46,H,'#98a6b6');P(tx+6,tt+20,34,24,'#98a6b6');P(tx+14,tt,18,24,'#98a6b6');P(tx+22,tt-30,2,32,'#8a98a8');for(let yy=tt+46;yy<H;yy+=6)for(let xx=tx+4;xx<tx+44;xx+=5)P(xx,yy,2,3,'rgba(214,222,230,.6)');}
  layer(170,330,'#8794a6','rgba(190,200,214,.5)',.12,9);
  const hz=g.createLinearGradient(0,240,0,H);hz.addColorStop(0,'rgba(226,216,200,0)');hz.addColorStop(1,'rgba(226,216,200,.35)');g.fillStyle=hz;g.fillRect(0,240,W,H-240);
}
