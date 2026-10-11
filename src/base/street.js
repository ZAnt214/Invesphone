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
  {k:'row',w:100,brick:'#8e3b2c',door:'#2f5a3a',fl:3},
  {k:'row',w:100,brick:'#7a4030',door:'#1e1e22',fl:3,escape:true},
  {k:'shop',w:150,brick:'#934733',fl:3,shop:'market',sign:'CORNER MARKET',band:'#2f5a3a'},
  {k:'row',w:100,paint:'#cbb894',door:'#7a2a2a',fl:3,boxes:true},
  {k:'alley',w:40},
  {k:'dhpp',w:440},
  {k:'alley',w:28},
  {k:'shop',w:140,brick:'#7a4030',fl:3,shop:'laundry',sign:'LAUNDROMAT',band:'#2e4a6a'},
  {k:'row',w:100,brick:'#8e3b2c',door:'#2e4a6a',fl:3,boxes:true},
  {k:'row',w:100,brick:'#6e3a2c',door:'#1e1e22',fl:3,boarded:true,escape:true},
  {k:'shop',w:130,brick:'#5e3a2e',fl:3,shop:'tavern',sign:'TAVERN',band:'#1a1416'},
  {k:'row',w:100,paint:'#7d8c99',door:'#e8e2d4',fl:3},
  {k:'row',w:100,brick:'#934733',door:'#3a2a22',fl:3,escape:true},
  {k:'shop',w:120,brick:'#8e3b2c',fl:3,shop:'barber',sign:'BARBER',band:'#e8e2d4'},
  {k:'row',w:100,brick:'#7a4030',door:'#2f5a3a',fl:3,boxes:true},
  {k:'shop',w:150,paint:'#d0c4ae',fl:3,shop:'pharmacy',sign:'PHARMACY',band:'#2f6a4a'},
  {k:'row',w:100,brick:'#8e3b2c',door:'#7a2a2a',fl:3},
  {k:'row',w:100,brick:'#6e3a2c',door:'#1e1e22',fl:3,escape:true}
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

/* ---------- peças de fachada (pixel art em px da base) ---------- */
function brickWall(P,x,y,w,h,base,seed,hash){
  P(x,y,w,h,base);
  for(let yy=y,r=0;yy<y+h;yy+=5,r++){P(x,yy,w,1,'rgba(214,196,176,.32)');
    for(let xx=x+((r%2)?0:6);xx<x+w;xx+=12){P(xx,yy+1,1,4,'rgba(214,196,176,.26)');
      const t=hash(xx,yy,seed);if(t<.18)P(xx+1,yy+1,11,4,t<.09?'rgba(0,0,0,.10)':'rgba(255,220,200,.08)');}}
}
function paintWall(P,x,y,w,h,base,seed,hash){
  P(x,y,w,h,base);for(let yy=y;yy<y+h;yy+=5)P(x,yy,w,1,'rgba(0,0,0,.05)');
  for(let k=0;k<w*h/60;k++){const t=hash(k,seed,7);P(x+Math.floor(hash(k,seed,3)*w),y+Math.floor(hash(seed,k,5)*h),1,1,t<.5?'rgba(0,0,0,.07)':'rgba(255,255,255,.08)');}
}
// janela de guilhotina com verga e peitoril de pedra; acesa (cortina) ou não, com ar-condicionado, floreira ou tábua
function sash(P,x,y,o){
  const w=o.w||22,h=o.h||30;
  P(x-3,y-5,w+6,4,'#d8d0c0');P(x-3,y-5,w+6,1,'#efe8da');P(x-3,y-2,w+6,1,'rgba(0,0,0,.25)');
  P(x,y,w,h,'#ece6da');
  if(o.boarded){P(x+1,y+1,w-2,h-2,'#a07a4a');for(let k=0;k<4;k++)P(x+1,y+3+k*7,w-2,1,'#7a5a34');P(x+3,y+4,1,1,'#3a3a3a');P(x+w-4,y+h-5,1,1,'#3a3a3a');}
  else{
    const g=o.lit?'#f2cf86':'#4f6c88',g2=o.lit?'#ffe6b0':'#7a98b4';
    P(x+2,y+2,w-4,h/2-2,g);P(x+2,y+h/2+1,w-4,h/2-3,g);P(x+2,y+2,w-4,2,g2);P(x+2,y+h/2+1,w-4,1,g2);
    P(x+w/2,y+2,1,h-4,'#ece6da');P(x+1,y+h/2-1,w-2,2,'#ece6da');
    if(!o.lit){P(x+4,y+4,2,1,'#a9c2d6');P(x+5,y+5,2,1,'#a9c2d6');P(x+w/2+3,y+h/2+4,2,1,'#93b0c8');}
    if(o.lit){P(x+2,y+2,4,h-5,o.curtain||'#b85a4a');P(x+w-6,y+2,4,h-5,o.curtain||'#b85a4a');if(o.who)P(x+w/2-3,y+h-12,6,9,'rgba(40,28,22,.55)');}
  }
  P(x-3,y+h,w+6,3,'#d8d0c0');P(x-3,y+h,w+6,1,'#efe8da');P(x-3,y+h+3,w+6,1,'rgba(0,0,0,.28)');
  if(o.ac){const ay=y+h-12;P(x+2,ay,w-4,11,'#d9d6cb');P(x+2,ay,w-4,1,'#f2f0e8');P(x+2,ay+10,w-4,1,'#9a978c');for(let k=0;k<(w-8)/3;k++)P(x+4+k*3,ay+2,1,7,'#a9a69a');P(x+w/2,ay+11,1,5,'rgba(60,90,120,.35)');}
  if(o.box){P(x-2,y+h+3,w+4,5,'#5a3a24');P(x-2,y+h+3,w+4,1,'#7a5434');for(let k=0;k<w;k+=3){P(x-1+k,y+h-1,2,4,k%2?'#4a8a3c':'#69ad52');if(k%6===0)P(x+k,y+h-2,2,2,['#c0392b','#f2c230','#e8e2d4'][(k/6)%3]);}}
}
function cornice(P,x,y,w,col){
  P(x,y,w,14,col);P(x,y,w,2,'#5a4a3e');P(x,y+2,w,3,col);P(x,y+2,w,1,'#6e5c4c');
  for(let xx=x+4;xx<x+w-4;xx+=14){P(xx,y+5,4,9,'#4a3a30');P(xx,y+5,4,1,'#6e5c4c');}
  for(let xx=x+2;xx<x+w-2;xx+=4)P(xx,y+12,2,2,'#6e5c4c');
  P(x,y+14,w,1,'rgba(0,0,0,.35)');
}
function rowDoor(P,x,y,col){ // porta com bandeira de vidro e moldura de pedra (o pé em y)
  const w=24,h=42;
  P(x-4,y-h-14,w+8,h+14,'#d8d0c0');P(x-4,y-h-14,w+8,1,'#efe8da');
  P(x,y-h-10,w,8,'#4f6c88');P(x+1,y-h-9,6,2,'#a9c2d6');for(let k=1;k<4;k++)P(x+k*6,y-h-10,1,8,'#d8d0c0');
  P(x,y-h,w,h,col);P(x,y-h,w,1,'rgba(255,255,255,.18)');
  P(x+3,y-h+4,8,15,'rgba(0,0,0,.18)');P(x+13,y-h+4,8,15,'rgba(0,0,0,.18)');P(x+3,y-h+22,8,15,'rgba(0,0,0,.18)');P(x+13,y-h+22,8,15,'rgba(0,0,0,.18)');
  P(x+19,y-h/2,2,2,'#d4af37');P(x+9,y-h+2,6,3,'#c9a24a');P(x+10,y-h+3,4,1,'#3a2a22');
}
function fireEscape(P,x,y0,y1,w){
  for(let y=y0;y<y1;y+=FLOOR){P(x,y,w,2,'#1c1d20');P(x,y+2,w,1,'#3a3c40');for(let k=0;k<w;k+=4)P(x+k,y-12,1,12,'#1c1d20');P(x,y-12,w,1,'#1c1d20');}
  for(let y=y0;y<y1-FLOOR;y+=FLOOR)for(let k=0;k<FLOOR;k+=4)P(x+w-14+Math.round(k*10/FLOOR),y+k,4,1,'#2a2b2e');
}

/* uma fachada inteira; o pé fica na última linha */
function facadeSprite(A,b,sign,door){
  const {S2,refine,outlined,hash,txt,txtW}=A;
  const fl=b.fl||3,h=b.k==='dhpp'?FLOOR*2+70+12:b.k==='alley'?fl*FLOOR:fl*FLOOR+16,w=b.w;
  if(b.k==='dhpp')b.flags=[]; // posição dos panos, preenchida ao desenhar a fachada
  const c=S2(w,h,(P,E,g)=>{
    const R=rnd(b.i*97+13),seed=b.i*31+5;
    if(b.k==='alley'){P(0,10,w,h-10,'#2f2924');P(0,10,w,4,'#241e1a');for(let y=30;y<h;y+=22)P(4,y,w-8,2,'#3a332c');
      for(const [dx,dy,r] of [[10,-7,7],[22,-5,6],[16,-3,5]]){E(dx,h+dy,r,r*.8,'#1c1c1e');E(dx-1,h+dy-1,r*.5,r*.4,'#2c2c30');}
      P(w-12,h-26,9,24,'#3a5a3a');P(w-12,h-26,9,2,'#4a6a4a');return;}
    if(b.k==='dhpp'){
      // a mesma fachada da base: ripas bege, rodapé, calhas nas pontas, janelas brancas com ar-condicionado
      const cap=['#6e5c4c','#8c7862','#4a3e33'];P(0,0,w,12,cap[0]);P(0,0,w,1,'#241c16');for(let k=0;k<w/3;k++)P(Math.floor(hash(k,1,3)*w),Math.floor(hash(k,2,3)*12),1+(k&1),1,k%3?cap[1]:cap[2]);
      P(0,12,w,h-12,'#b9a58a');for(let yy=16;yy<h-6;yy+=6)P(0,yy,w,1,'rgba(90,70,45,.22)');for(let yy=16;yy<h-6;yy+=12)for(let xx=8;xx<w;xx+=32)P(xx+((yy>>2)%2?0:16),yy,1,6,'rgba(90,70,45,.18)');
      for(let k=0;k<w*h/40;k++)P(Math.floor(hash(k,4,9)*w),12+Math.floor(hash(k,5,9)*(h-12)),1,1,'#a58f72');
      P(0,12,w,4,'rgba(0,0,0,.20)');P(0,h-5,w,5,'#7a6a52');P(0,h-5,w,1,'#8f816b');
      for(const x of [6,w-11]){P(x,0,5,h,'#8a8c86');P(x,0,1,h,'#b9bab4');P(x+4,0,1,h,'#5e605a');for(let yy=8;yy<h;yy+=14)P(x-1,yy,7,2,'#6a6c66');}
      const win=(X,Y,ac)=>{P(X,Y,24,22,'#f2efe6');P(X+2,Y+2,20,18,'#9cc4e0');P(X+3,Y+3,6,3,'#d4e8f6');P(X+11,Y+2,1,18,'#f2efe6');P(X+2,Y+10,20,1,'#f2efe6');P(X-1,Y+22,26,2,'#d8d2c4');P(X-1,Y+24,26,1,'rgba(0,0,0,.2)');
        if(ac){const ay=Y+14;P(X+3,ay,18,10,'#d9d6cb');P(X+3,ay,18,1,'#f2f0e8');P(X+3,ay+9,18,1,'#9a978c');for(let k=0;k<6;k++)P(X+5+k*2.6,ay+2,1,6,'#a9a69a');P(X+17,ay+3,3,2,'#6a675e');P(X+11,ay+10,1,4,'rgba(60,90,120,.35)');}};
      for(let f=0;f<2;f++)for(let X=24;X<w-40;X+=52){win(X,22+f*FLOOR,hash(X,f,78)<.4);if(hash(X,f,77)<.35)P(X+2,22+f*FLOOR+2,20,8,'rgba(255,214,140,.35)');}
      // térreo: o letreiro e a porta da base, janelas dos lados e as bandeiras
      const gy=h-70;P(0,gy,w,2,'rgba(0,0,0,.18)');
      const sx=Math.round(w/2-sign.width/2),dx=Math.round(w/2-door.width/2);
      g.drawImage(sign,sx,h-door.height-sign.height-8);g.drawImage(door,dx,h-door.height-1);
      for(const X of [30,w-54])win(X,h-42,X<w/2);
      for(const [fx,c1,c2,c3] of [[sx-26,'#2f8a3a','#f2c230','#2f5aa8'],[sx+sign.width+20,'#1c2a4a','#c9ccce','#3a4a6a']]){
        P(fx,gy-58,3,h-gy+56,'#c9ccce');P(fx,gy-58,1,h-gy+56,'#eef0f2');E(fx+1,gy-59,2,1.5,'#e8c63a');P(fx-3,h-6,9,5,'#6a6e72');
        // o pano tremula no jogo, como as bandeiras da planta (drawFlags)
        b.flags.push({x:fx+3,y:gy-56,c1,c2,c3});}
      return;
    }
    // casa geminada ou loja: parede de tijolo (ou pintada), cornija, janelas dos andares de cima
    if(b.paint)paintWall(P,0,0,w,h,b.paint,seed,hash);else brickWall(P,0,0,w,h,b.brick,seed,hash);
    P(0,0,1,h,'rgba(0,0,0,.25)');P(w-1,0,1,h,'rgba(0,0,0,.25)');
    cornice(P,0,0,w,b.paint?'#3a3a3e':'#3a2a22');
    const cols=b.k==='row'?3:Math.max(3,Math.floor(w/42)),cw=w/cols;
    for(let f=1;f<fl;f++)for(let i=0;i<cols;i++){const x=Math.round(i*cw+cw/2-11),y=18+(f-1)*FLOOR+8,t=R();
      sash(P,x,y,{lit:t<.3,who:t<.12,ac:R()<.22,box:b.boxes&&f===fl-1&&R()<.7,boarded:b.boarded&&f===1&&i===1,curtain:['#b85a4a','#d8c39a','#5a7a9a'][Math.floor(R()*3)]});}
    if(b.escape)fireEscape(P,Math.round(cw*1.05),18+FLOOR+2,h-FLOOR,Math.round(cw*1.9));
    const gy=h-FLOOR-4; // térreo
    if(b.k==='row'){
      rowDoor(P,10,h,b.door);
      for(let i=1;i<3;i++){const x=Math.round(i*cw+cw/2-11);sash(P,x,gy+10,{lit:R()<.25,ac:false,box:b.boxes&&R()<.5});}
      // janela do porão, rente à calçada
      P(w-38,h-10,22,8,'#2a2a2e');for(let k=0;k<22;k+=3)P(w-38+k,h-10,1,8,'#555');P(w-39,h-11,24,1,'#d8d0c0');
      P(0,h-3,w,3,'rgba(0,0,0,.18)');
      return;
    }
    // loja no térreo: pilastras, faixa do letreiro, vitrine, porta recuada e mureta
    P(0,gy-4,w,FLOOR+8,'#3a2e28');P(0,gy-4,w,2,'#5a4a3e');P(2,gy-2,6,FLOOR+6,'#4a3a30');P(w-8,gy-2,6,FLOOR+6,'#4a3a30');
    const band=b.band||'#2f5a3a',bw=w-20;P(10,gy,bw,13,band);P(10,gy,bw,1,'rgba(255,255,255,.25)');P(10,gy+12,bw,1,'rgba(0,0,0,.35)');
    const ink=band==='#e8e2d4'?'#7a2a2a':'#f1ece0',sz=9,tw=txtW(g,b.sign,sz,1.6);
    if(b.shop==='tavern'){for(const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1]])txt(g,b.sign,w/2-tw/2+ox,gy+10.5+oy,sz,'rgba(255,90,140,.35)',1.6);txt(g,b.sign,w/2-tw/2,gy+10.5,sz,'#ff9ec0',1.6);}
    else txt(g,b.sign,w/2-tw/2,gy+10.5,sz,ink,1.6);
    const vy=gy+16,vh=h-vy-10,dw=22,dxp=b.shop==='market'?w-dw-14:14,vx=b.shop==='market'?12:dxp+dw+6,vw=b.shop==='market'?w-dw-34:w-vx-12;
    P(vx-1,vy-1,vw+2,vh+2,'#1c1d20');P(vx,vy,vw,vh,b.shop==='tavern'?'#3a2416':'#5f7f9a');
    if(b.shop==='market'){for(let s=0;s<3;s++){P(vx+2,vy+6+s*9,vw-4,1,'#6a5a4a');for(let k=0;k<vw-6;k+=5)P(vx+3+k,vy+1+s*9,4,5,['#c0392b','#f2c230','#2f8a3a','#e8e2d4','#2f5aa8'][(k/5+s)%5]);}}
    if(b.shop==='laundry'){for(let k=0;k<vw-14;k+=17){E(vx+9+k,vy+vh-11,7,7,'#e8eaec');E(vx+9+k,vy+vh-11,4.5,4.5,'#5a7a90');E(vx+8+k,vy+vh-12,1.5,1.5,'#cfe6ee');}P(vx+2,vy+3,vw-4,3,'#d9d6cb');}
    if(b.shop==='tavern'){P(vx+2,vy+2,vw-4,vh-4,'#5a3a20');for(let k=0;k<vh-6;k+=3)P(vx+2,vy+3+k,vw-4,1,'#7a5430');P(vx+vw/2-8,vy+6,16,8,'#ff5a8a');P(vx+vw/2-7,vy+7,14,6,'#ffc0d6');}
    if(b.shop==='barber'){P(vx+2,vy+2,vw-4,vh-4,'#8fb0c8');P(vx+4,vy+vh-14,vw-8,3,'#5a3a2a');P(dxp+dw+1,vy-2,5,vh+2,'#e8e2d4');for(let k=0;k<vh;k+=6){P(dxp+dw+1,vy-2+k,5,2,'#c0392b');P(dxp+dw+1,vy+1+k,5,2,'#2f5aa8');}}
    if(b.shop==='pharmacy'){P(vx+2,vy+2,vw-4,vh-4,'#cfe6ee');for(let s=0;s<2;s++)for(let k=0;k<vw-8;k+=6)P(vx+4+k,vy+6+s*12,4,7,['#2f8a3a','#e8e2d4','#c0392b'][(k/6+s)%3]);P(w-24,gy-16,14,14,'#2f8a3a');P(w-19,gy-14,4,10,'#f2f2ea');P(w-22,gy-11,10,4,'#f2f2ea');}
    P(vx,vy,vw,2,'rgba(255,255,255,.25)');P(vx+3,vy+4,2,vh-8,'rgba(255,255,255,.18)');
    P(vx-1,h-10,vw+2,9,'#4a3a30');P(vx-1,h-10,vw+2,1,'#6a5444');
    // porta recuada de vidro
    P(dxp-1,vy-1,dw+2,h-vy+1,'#1c1d20');P(dxp,vy,dw,h-vy,'#2e343a');P(dxp+2,vy+2,dw-4,h-vy-12,'#6f93b3');P(dxp+3,vy+3,5,8,'#a7c6dc');P(dxp+dw-5,vy+(h-vy)/2,2,4,'#c9ccce');
    if(b.shop==='market'||b.shop==='laundry'){const aw=b.shop==='market'?'#2f5a3a':'#2e4a6a';for(let k=0;k<w-10;k+=8){P(5+k,gy+14,8,9,k%16?'#efe8da':aw);}for(let k=0;k<w-10;k+=8)E(9+k,gy+23,4,2,(k%16)?'#efe8da':aw);}
    P(0,h-3,w,3,'rgba(0,0,0,.2)');
  });
  return outlined(refine(c,b.i*7+3));
}

/* degraus de mármore com corrimão de ferro na frente da porta de cada casa (no chão, na calçada) */
function drawStoop(P,x){
  for(let k=0;k<3;k++){const ww=34+k*6,xx=x-ww/2;P(xx,GY+k*6,ww,6,'#e8e4dc');P(xx,GY+k*6,ww,1,'#fbf8f2');P(xx,GY+k*6+5,ww,1,'#b8b2a6');}
  for(const s of [-1,1]){const xr=x+s*22;P(xr,GY-10,2,28,'#1c1d20');P(x+s*20,GY-10,2,2,'#1c1d20');for(let k=0;k<4;k++)P(x+s*(18-k),GY-8+k*6,2,1,'#1c1d20');}
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
    // céu de manhã e a silhueta da cidade ao fundo (torres e caixas d'água), atrás das casas
    const g=c.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#8fa9c4');g.addColorStop(1,'#f0d2a8');c.fillStyle=g;c.fillRect(0,0,STREET_W,GY);
    for(let x=0;x<STREET_W;){const w=24+R()*60,h=40+R()*120;P(x,GY-60-h,w,h+60,R()<.5?'#a9b3c2':'#9aa5b6');for(let y=GY-60-h+6;y<GY-60;y+=7)for(let xx=x+4;xx<x+w-4;xx+=6)if(R()<.22)P(xx,y,2,3,'#d8dde4');
      if(R()<.25){P(x+w/2-6,GY-60-h-14,12,12,'#8a96a8');P(x+w/2-7,GY-60-h-16,14,3,'#7a869a');}x+=w+3;}
    // fachadas, com o pé na calçada
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
