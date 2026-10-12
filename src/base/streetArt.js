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
export const SIDE=130;               // fundura da calçada vista de cima
export const CURB=GY+SIDE;           // meio-fio
export const ROAD=CURB+12;           // começo do asfalto
export const NEAR=ROAD+262;          // calçada de cá (embaixo): via compacta, para o trânsito caber no quadro de qualquer aparelho
export const STREET_H=NEAR+115;
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
export function paintFacades(g,lots,A,{sign,door}){
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
  const glass=(x,y,w,h,fill,items)=>{panes.push({x:Math.round(x+w/2),w});P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,fill);items&&items();
    vgrad(x,y,w,h*.5,[[0,'rgba(20,24,30,.35)'],[1,'rgba(20,24,30,0)']]);                     // o alto da vitrine fica no escuro do toldo
    for(let j=0;j<h;j++){const rx=x+w*.55-j*.6;if(rx>x)P(rx,y+j,10,1,'rgba(255,255,255,.07)');}   // reflexo da rua
    P(x,y,w,4,'rgba(0,0,0,.3)');P(x+w-1,y,1,h,'rgba(255,255,255,.25)');for(let k=0;k<3;k++)P(x+10+k*16,y+6,2,h-10,'rgba(255,255,255,.12)');
    recess(x,y,w,h,4,.3);P(x-2,y+h,w+4,4,'#8a8478');P(x-2,y+h,w+4,1,'#b8b2a4');};
  const glows=[],doors=[],panes=[],drums=[];   // o que a rua usa depois: luzes, portas (gente entra e sai), vitrines e máquinas
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
    const x=b.X,w=b.w,top=0;glows.length=0;doors.length=0;panes.length=0;drums.length=0;
    if(b.k==='alley'){paintAlley(g,P,E,vgrad,x,w,R);b.glows=[];continue;}
    if(b.k==='dhpp'){
      // a fachada bege da base em toda a altura, com calhas nas pontas, platibanda e janelas brancas com ar-condicionado
      siding(x,40,w,GY-40);P(x-1,40,1,GY-40,O);P(x+w,40,1,GY-40,O);
      const cap=['#6e5c4c','#8c7862','#4a3e33'];P(x-4,28,w+8,16,cap[0]);P(x-4,28,w+8,2,'#241c16');for(let k=0;k<w/3;k++)P(x-4+R()*(w+8),28+R()*14,2,1,cap[k%3]);P(x-4,30,w+8,1,'rgba(255,255,255,.15)');
      vgrad(x,44,w,16,[[0,`rgba(${SHC},.4)`],[1,`rgba(${SHC},0)`]]);
      for(const dx of [10,w-18]){P(x+dx+8,40,4,GY-40,`rgba(${SHC},.22)`);P(x+dx,40,8,GY-40,'#8a8c86');P(x+dx,40,2,GY-40,'#b9bab4');P(x+dx+6,40,2,GY-40,'#6a6c66');for(let y=60;y<GY;y+=24){P(x+dx-2,y,12,3,'#6a6c66');P(x+dx-2,y,12,1,'#9a9c96');}}
      const n=Math.floor((w-60)/70);for(let y=70;y<GY-170;y+=82)for(let i=0;i<n;i++)win(x+40+i*((w-80)/n)+((w-80)/n-30)/2,y,{lit:R()<.2,ac:R()<.45,w:30,h:42});
      // térreo: embasamento de granito, pórtico recuado com o letreiro e a porta da planta (ampliados sem suavizar),
      // degraus e duas janelas; arandelas acesas dos dois lados da porta (luz da fachada)
      P(x,GY-40,w,34,'#6f6558');for(let k=0;k<w;k+=48){P(x+k,GY-40,1,34,'#5a5248');}P(x,GY-40,w,2,'#9a8f80');P(x,GY-38,w,1,'rgba(0,0,0,.25)');grain(x,GY-40,w,34,.08);
      g.imageSmoothingEnabled=false;
      const sw=sign.width*1.5,sh=sign.height*1.5,dw=door.width*1.6,dh=door.height*1.9,cx=x+w/2;
      const pw=dw+12,ph=dh+14,px0=cx-dw/2-6,py0=GY-dh-14;
      drop(px0-6,py0-6,pw+12,6,6,.3);
      P(px0-6,py0-6,pw+12,ph+6,'#a39478');P(px0-6,py0-6,pw+12,2,'#d8ccb4');P(px0-6,py0-6,2,ph+6,'#c4b89e');P(px0+pw+4,py0-6,2,ph+6,'#6e6450');
      P(px0,py0,pw,ph,'#8f816b');P(px0,py0,pw,2,'#cfc3ad');
      g.drawImage(door,Math.round(cx-dw/2),Math.round(GY-dh-8),Math.round(dw),Math.round(dh));
      recess(px0,py0,pw,ph,10,.42);
      const sy=Math.round(GY-dh-sh-20);
      drop(Math.round(cx-sw/2),sy,Math.round(sw),Math.round(sh),7,.32);
      g.drawImage(sign,Math.round(cx-sw/2),sy,Math.round(sw),Math.round(sh));
      for(let k=0;k<3;k++){const ww=dw+30+k*14,yy=GY-10+k*4-6;P(cx-ww/2,yy,ww,4,k%2?'#c9c3b8':'#e4e0d8');P(cx-ww/2,yy,ww,1,'#f6f2ea');P(cx-ww/2,yy+3,ww,1,'rgba(0,0,0,.2)');}
      for(const xx of [x+40,x+w-70])win(xx,GY-110,{w:30,h:42,ac:true});
      for(const lx of [cx-dw/2-22,cx+dw/2+16]){const ly=GY-dh+6;drop(lx,ly,6,12,4,.32);P(lx,ly,6,12,'#2a2b2e');P(lx+1,ly+2,4,7,'#ffe2a0');P(lx+1,ly+2,4,1,'#fff6d8');glows.push({x:lx+3,y:ly+6,r:46,c:'#ffd79a',lamp:true});}
      // mastros das bandeiras (o pano é desenhado no jogo, tremulando)
      b.flags=[];for(const fx of [Math.round(cx-sw/2-40),Math.round(cx+sw/2+36)]){P(fx+5,GY-194,3,188,`rgba(${SHC},.22)`);P(fx,GY-200,4,196,'#c9ccce');P(fx,GY-200,1,196,'#eef0f2');P(fx+3,GY-200,1,196,'#8a8c90');E(fx+2,GY-202,3,2.5,'#e8c63a');P(fx-4,GY-8,12,8,'#6a6e72');P(fx-4,GY-8,12,1,'#9a9ea2');b.flags.push({x:fx+4,y:GY-196,v:b.flags.length?'dh':'br'});}
      P(x,GY-6,w,6,'#7a6a52');P(x,GY-6,w,1,'#8f816b');
      facadeLight(g,vgrad,x,40,w,GY-40);
      b.glows=glows.slice();b.doors=doors.slice();b.panes=panes.slice();continue;}
    // prédio de tijolo: andares até o topo, cornija, escada de incêndio e o térreo (loja ou entrada)
    brick(x,top,w,GY-top,b.brick);P(x-1,top,1,GY-top,O);P(x+w,top,1,GY-top,O);
    const gTop=GY-GROUND,cols=Math.max(2,Math.round((w-30)/58)),cw=(w-30)/cols;
    for(let y=gTop-FLOOR;y>top-50;y-=FLOOR){
      // friso de pedra entre os andares, com a sombra que ele joga no tijolo de baixo
      P(x,y+65,w,4,`rgba(${SHC},.3)`);P(x,y+60,w,5,'#c8bea8');P(x,y+60,w,1,'#e8e0d0');P(x,y+64,w,1,'#a49a86');
      for(let i=0;i<cols;i++){const wx=Math.round(x+15+i*cw+cw/2-13);if(y+12<top)continue;win(wx,y+14,{lit:R()<.25,ac:R()<.3,flower:R()<.18});}}
    if(b.fire)fireEscape(Math.round(x+w*.5),gTop-FLOOR+56,gTop,Math.round(w*.42));
    cornice(x,top,w,b.cor);
    pier(x,top+12,GY-top-12,8,b.brick);pier(x+w-8,top+12,GY-top-12,8,b.brick);
    // o térreo fica recuado sob a viga: a viga faz sombra no alto da loja
    P(x+8,gTop-6,w-16,6,'#3a2e26');P(x+8,gTop-6,w-16,1,'#5a4a3e');
    if(b.k==='apt'){P(x+8,gTop,w-16,GY-gTop,'rgba(0,0,0,.04)');stoop(x,w,b.door||'#2f4a3a');for(const xx of [x+14,x+w-40])win(xx,gTop+30,{lit:R()<.3,flower:true});}
    else{SHOP[b.k]&&SHOP[b.k](x+8,gTop,w-16);vgrad(x+8,gTop,w-16,22,[[0,`rgba(${SHC},.45)`],[1,`rgba(${SHC},0)`]]);
      if(b.awn)awning(x+12,gTop+30,w-24,b.awn);if(b.name)signBoard(x+16,gTop+4,w-32,26,b.name,b.signc||'#2a2e33',b.ink||'#e8ecef');}
    P(x,GY-6,w,6,'#7a6a52');P(x,GY-6,w,1,'#8f816b');
    facadeLight(g,vgrad,x,top,w,GY-top);
    b.glows=glows.slice();b.doors=doors.slice();b.panes=panes.slice();b.drums=drums.slice();
  }
}

// luz geral da fachada: céu clareia o alto, o chão escurece a base (oclusão), cantos com sombra de contato
function facadeLight(g,vgrad,x,y,w,h){
  vgrad(x,y,w,h,[[0,'rgba(255,238,210,.07)'],[.55,'rgba(255,238,210,0)'],[.85,'rgba(20,14,10,.05)'],[1,'rgba(20,14,10,.16)']]);
  const gr=g.createLinearGradient(x+w-14,0,x+w,0);gr.addColorStop(0,'rgba(20,14,10,0)');gr.addColorStop(1,'rgba(20,14,10,.16)');g.fillStyle=gr;g.fillRect(x+w-14,y,14,h);
}

// beco com profundidade: paredes laterais em fuga (a da esquerda na sombra, a da direita pega o sol), fundo escuro com
// porta de serviço, chão molhado refletindo o céu, fios cruzando no alto e um facho de luz entrando de cima
function paintAlley(g,P,E,vgrad,x,w,R){
  const d=Math.min(30,w*.3),bx=x+d,bw=w-2*d,back=GY-96;
  P(x,0,w,GY,'#2a2420');
  // faixa de céu no alto, entre os prédios
  vgrad(x,0,w,back,[[0,'#7f97b0'],[.7,'#5e6c78'],[1,'#3a3836']]);
  // paredes laterais (trapézios em fuga)
  g.fillStyle='#3a2a22';g.beginPath();g.moveTo(x,0);g.lineTo(bx,0);g.lineTo(bx,back);g.lineTo(x,GY);g.closePath();g.fill();
  g.fillStyle='#7a5a44';g.beginPath();g.moveTo(x+w,0);g.lineTo(bx+bw,0);g.lineTo(bx+bw,back);g.lineTo(x+w,GY);g.closePath();g.fill();
  for(let yy=6;yy<GY;yy+=8){const t=yy/GY;P(x+w-d*(1-t*.5),yy,d*(1-t*.5),1,'rgba(30,20,16,.18)');P(x,yy,d*(1-t*.5),1,'rgba(0,0,0,.15)');}
  // fundo: parede com porta de serviço, lâmpada de grade e caixas
  P(bx,0,bw,back,'#2e2824');for(let yy=4;yy<back;yy+=4)P(bx,yy,bw,1,'rgba(0,0,0,.18)');
  if(bw>24){P(bx+bw/2-9,back-34,18,34,'#1c1d20');P(bx+bw/2-9,back-34,18,1,'#3a3c42');P(bx+bw/2-2,back-46,4,4,'#d8c890');}
  // chão do beco em fuga: escuro, com uma poça refletindo a faixa de céu
  g.fillStyle='#34302c';g.beginPath();g.moveTo(bx,back);g.lineTo(bx+bw,back);g.lineTo(x+w,GY);g.lineTo(x,GY);g.closePath();g.fill();
  for(let yy=back;yy<GY;yy+=6)P(x,yy,w,1,'rgba(0,0,0,.08)');
  E(x+w*.55,GY-30,Math.min(22,w*.25),4,'rgba(127,151,176,.35)');E(x+w*.55,GY-31,Math.min(14,w*.15),1.5,'rgba(220,236,248,.3)');
  // escurece para o fundo
  vgrad(x,0,w,GY,[[0,'rgba(10,8,8,.05)'],[.6,'rgba(10,8,8,.35)'],[1,'rgba(10,8,8,.1)']]);
  // facho de sol entrando pelo alto, batendo na parede da direita
  g.save();g.globalCompositeOperation='screen';for(const [a,f] of [[.05,1],[.05,.55]]){g.fillStyle=`rgba(255,226,170,${a})`;g.beginPath();g.moveTo(x+w*(.5-.25*f),0);g.lineTo(x+w*(.5+.1*f),0);g.lineTo(x+w,GY*(.55+.2*f));g.lineTo(x+w-d*.5*f,GY*(.62+.25*f));g.closePath();g.fill();}g.restore();
  // fios no alto
  for(const [y0,sag] of [[70,10],[110,14]]){for(let k=0;k<=w;k++){const t=k/w;P(x+k,y0+Math.sin(t*Math.PI)*sag,1,1,'#141414');}}
  // escada de incêndio vista de lado na parede da esquerda
  for(let yy=120;yy<GY-120;yy+=70){P(x+2,yy,d-6,2,'#141518');for(let k=0;k<d-6;k+=4)P(x+2+k,yy-10,1,10,'#141518');}
}

/** chão: calçada de lá (vista de cima), meio-fio, asfalto com vagas e faixas, calçada de cá.
 *  ART(path) devolve a imagem oficial já carregada (ou null): manchas, lixo, bueiros e bocas de lobo entram quando chegam. */
export function paintGround(g,W,ART){
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
  for(let x=0;x<W;x+=200){if(CROSSWALKS.some(c=>Math.abs(x-c.x)<110))continue;paint(x,ROAD+6,3,58,'rgba(232,232,224,.55)');}
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
  P(0,NEAR,W,4,'#d2ccc0');P(0,NEAR,W,1,'#ece6da');P(0,NEAR+4,W,6,'#8a857a');walk(NEAR+10,STREET_H);
}
