/* global __STREET_ART__ */
/* Rua do DHPP: o lado de fora da base, de frente como numa cena de rua (fachadas altas, calçada, trânsito).
   Lemos anda pela calçada; a porta do DHPP leva para dentro (a planta da base). O lado de dentro continua em base.js.

   Arte: cada fachada, carro e peça da rua tem um arquivo oficial esperado em public/base/street/ (pedido ao ChatGPT em
   creative-requests/). Enquanto o arquivo não existe, a peça é desenhada aqui, no mesmo tamanho, como provisório;
   quando a imagem oficial chega, ela entra no lugar sozinha (mesmo nome, mesmo tamanho, fundo transparente).
   Câmera alta (como Beat Cop): fachadas de frente e o chão visto de cima; carros em 3/4.
   Unidade: 1 pixel de arte = 1 pixel das imagens da rua. A gente da rua é desenhada aqui em 12×28 px (porta do DHPP = 32 px),
   com as mesmas cores do boneco de cada um na base. */

/* Câmera alta, como em Beat Cop: as fachadas de frente, cortadas no alto, e o chão (calçada funda e rua com três faixas)
   visto de cima, ocupando metade da tela; carros em 3/4 (teto e lateral), gente andando em várias profundidades. */
const GY=196;              // pé das fachadas = começo da calçada
const SIDE=64;             // fundura da calçada
const CURB=GY+SIDE;        // beira da calçada (topo do meio-fio)
const ROAD=CURB+9;         // começo do asfalto (depois da face do meio-fio)
export const STREET_W=1600,STREET_H=ROAD+120;
const WALK=[GY+8,CURB-10]; // faixa da calçada onde dá para andar
const PARK=ROAD+32;        // faixa de estacionamento, encostada no meio-fio
const LANES=[{y:ROAD+72,dir:1,v:58},{y:ROAD+114,dir:-1,v:66}];
const ART='/base/street/';

/* ---------- fachadas: da esquerda para a direita; x e w em pixels de arte, h = altura até a calçada ---------- */
export const BUILDINGS=[
  {id:'esquina-oeste',x:0,w:150,h:150,draw:'brick',base:'#9a5a42',line:'#86503a',floors:4,shop:'grade'},
  {id:'padaria',x:150,w:170,h:166,draw:'brick',base:'#9a4a34',line:'#84402c',floors:4,shop:'padaria',sign:'PADARIA ESTRELA'},
  {id:'beco',x:320,w:40,h:176,draw:'alley'},
  {id:'dhpp',x:360,w:330,h:186,draw:'dhpp'},
  {id:'lavanderia',x:690,w:160,h:140,draw:'tile',floors:3,sign:'LAVANDERIA'},
  {id:'bar',x:850,w:140,h:104,draw:'bar',sign:'BAR DO ZÉ'},
  {id:'sobrado',x:990,w:180,h:156,draw:'brick',base:'#b06a48',line:'#9a5a3c',floors:4,shop:'grade'},
  {id:'farmacia',x:1170,w:190,h:130,draw:'plain',base:'#d8d2c2',floors:3,shop:'farmacia',sign:'DROGARIA'},
  {id:'esquina-leste',x:1360,w:240,h:168,draw:'brick',base:'#8a5a46',line:'#764c3a',floors:4,shop:'grade'}
];
export const DHPP=BUILDINGS.find(b=>b.id==='dhpp');
export const DOOR={x:DHPP.x+DHPP.w/2,y:WALK[0]+4};  // onde Lemos entra
// postes com os fios (o jogo desenha; as fachadas oficiais não trazem rua nem fios)
const POLES=[140,372,840,1180,1560],POLE_Y=CURB-3,POLE_TOP=POLE_Y-176;
// mobiliário da calçada: só aparece com a arte oficial (public/base/street/prop-<id>.png), pé no ponto (x,y)
export const PROPS=[
  {id:'orelhao',x:752,y:CURB-6},{id:'banca',x:1268,y:GY+40},{id:'lixeira',x:300,y:CURB-5},{id:'lixeira',x:1004,y:CURB-5},
  {id:'hidrante',x:610,y:CURB-4},{id:'ponto-de-onibus',x:1090,y:CURB-4},{id:'mesas-bar',x:880,y:GY+26}
];

/* ---------- helpers de desenho em pixel ---------- */
function painter(c){
  const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const T=(s,x,y,size,col)=>{c.font=`bold ${size}px "DejaVu Sans Mono",Menlo,monospace`;c.fillStyle=col;c.textBaseline='alphabetic';c.fillText(s,x,y);};
  return {P,T};
}
function rnd(seed){let s=seed%2147483647||7;return ()=>(s=s*16807%2147483647)/2147483647;}

function drawWindow(P,R,x,y,w,h,frame){
  const lit=R()<.4;
  P(x-1,y-1,w+2,h+3,frame);P(x,y,w,h,lit?'#f4d58e':'#6f8fb0');P(x,y,w,2,lit?'#fff0c0':'#9fbad3');P(x+Math.floor(w/2),y,1,h,frame);P(x-2,y+h+1,w+4,2,'#cfc8b8');
  if(lit&&R()<.5)P(x+2+R()*(w-6),y+h-7,3,7,'rgba(50,34,24,.7)');
}
function drawAC(P,x,y){P(x,y,9,6,'#d4d4cc');P(x,y,9,1,'#f0f0ea');for(let i=1;i<8;i+=2)P(x+i,y+2,1,3,'#8a8a84');P(x+2,y+6,1,3,'#9a9a94');}
function drawGrade(P,x,y,w,h){for(let i=0;i<=w;i+=3)P(x+i,y,1,h,'#3a3530');P(x,y,w,1,'#3a3530');}
function drawTag(c,x,y,col){c.strokeStyle=col;c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);for(let i=1;i<9;i++)c.lineTo(x+i*3,y+(i%2?-4:1)+Math.sin(i)*2);c.stroke();}

function drawBuilding(c,b){
  const {P,T}=painter(c),R=rnd(b.x*7+b.w*3+11),top=GY-b.h,x=b.x,w=b.w;
  if(b.draw==='alley'){
    P(x,top,w,b.h,'#3a332c');P(x,top,w,6,'#2a241e');for(let k=0;k<6;k++)P(x+4,top+20+k*22,w-8,2,'#4a4038');
    c.fillStyle='#1c1c1e';for(const [dx,dy] of [[10,-6],[22,-4],[15,-2]]){c.beginPath();c.ellipse(x+dx,GY+dy,6,5,0,0,7);c.fill();}
    return;
  }
  if(b.draw==='brick'){
    P(x,top,w,b.h,b.base);for(let y=top+3;y<GY;y+=3)P(x,y,w,1,b.line);
    for(let y=top,r=0;y<GY;y+=3,r++)for(let xx=x+(r%2)*3;xx<x+w;xx+=6)P(xx,y,1,3,b.line);
    P(x,top-5,w,5,'#5a3224');
  }else if(b.draw==='tile'){
    P(x,top,w,b.h,'#5f8a78');for(let y=top;y<GY;y+=5)for(let xx=x;xx<x+w;xx+=5){P(xx,y,5,1,'#557c6b');P(xx,y,1,5,'#557c6b');}P(x,top-5,w,5,'#3d5a4e');
  }else if(b.draw==='bar'){
    P(x,top,w,b.h,'#d8b44a');P(x,top-5,w,5,'#8a6a20');
  }else if(b.draw==='plain'){
    P(x,top,w,b.h,b.base);for(let y=top+6;y<GY;y+=8)P(x,y,w,1,'rgba(0,0,0,.06)');P(x,top-5,w,5,'#8a8474');
  }else if(b.draw==='dhpp'){
    P(x,top,w,b.h,'#c9bea8');P(x,top-6,w,6,'#8a8070');for(let y=top+4;y<GY;y+=8)P(x,y,w,1,'#b8ad96');
    for(let f=0;f<4;f++)for(let i=0;i<8;i++){const wx=x+14+i*39,wy=top+14+f*30;drawWindow(P,R,wx,wy,20,16,'#e9e6dc');if(f>0&&R()<.3)drawAC(P,wx+5,wy+20);}
    const gy=GY-56;P(x,gy,w,56,'#7e7666');P(x,gy,w,3,'#5a5446');
    const sx=x+w/2-95;P(sx,gy+4,190,17,'#1c1f22');P(sx+1,gy+5,188,1,'#3a3f44');P(sx,gy+20,190,1,'#c9a24a');T('DHPP',sx+12,gy+17,13,'#eef0f2');P(sx+66,gy+7,1,11,'#9aa0a6');T('HOMICÍDIOS',sx+74,gy+16,10,'#eef0f2');
    const dx=x+w/2-28;P(dx,gy+24,56,32,'#1c1f22');P(dx+2,gy+26,25,28,'#6f93b3');P(dx+29,gy+26,25,28,'#6f93b3');P(dx+4,gy+28,7,14,'#a7c6dc');P(dx+31,gy+28,7,14,'#a7c6dc');P(dx-4,GY-3,64,3,'#c9a24a');
    for(const wx of [x+16,x+w-58])drawWindow(P,()=>.9,wx,gy+28,40,20,'#e9e6dc');
    for(const [fx,c1,c2] of [[x+w/2-122,'#2f8a3a','#f2c230'],[x+w/2+104,'#1c2a4a','#c9ccce']]){P(fx,top+80,2,b.h-80,'#c9ccce');P(fx+2,top+82,18,11,c1);P(fx+8,top+85,6,5,c2);}
    return;
  }
  // janelas dos andares de cima
  const fl=b.floors||3,shopH=b.draw==='bar'?50:42,uh=b.h-shopH;
  const cols=Math.max(2,Math.floor(w/38)),cw=w/cols;
  for(let f=0;f<fl-1;f++)for(let i=0;i<cols;i++){const fh=uh/(fl-1),wx=x+i*cw+cw/2-8,wy=top+10+f*fh;if(wy+20>GY-shopH)continue;
    drawWindow(P,R,wx,wy,16,Math.min(20,fh-12),'#e8e2d4');if(b.draw==='tile')drawGrade(P,wx-1,wy-1,18,Math.min(20,fh-12)+2);if(R()<.3)drawAC(P,wx+3,wy+Math.min(20,fh-12)+4);}
  // térreo
  const sy=GY-shopH;P(x,sy,w,shopH,b.draw==='bar'?'#6a4a20':b.draw==='tile'?'#2e3a36':'#4a3a30');P(x,sy,w,2,'rgba(0,0,0,.35)');
  if(b.shop==='padaria'){P(x+8,sy+10,100,30,'#2c2a28');P(x+10,sy+12,96,26,'#d9b97a');for(let i=0;i<8;i++)P(x+12+i*12,sy+24,9,12,['#c48a4a','#e8d0a0','#a8622e'][i%3]);
    for(let i=0;i<Math.floor(w/12);i++)P(x+4+i*12,sy-6,12,8,i%2?'#f2ece0':'#c0392b');P(x+4,sy+2,w-8,2,'#7a2a1c');P(x+118,sy+8,40,34,'#3a2a20');P(x+121,sy+11,34,30,'#5a7a90');}
  else if(b.shop==='farmacia'){P(x+8,sy+8,120,34,'#9fc0d4');P(x+8,sy+8,120,2,'#d8ecf6');P(x+140,sy+8,42,34,'#3a5a4a');P(x+w-30,sy-22,20,20,'#2f8a3a');P(x+w-24,sy-19,8,14,'#f2f2ea');P(x+w-27,sy-16,14,8,'#f2f2ea');}
  else if(b.draw==='tile'){P(x+8,sy+12,90,28,'#9fc0d4');for(let i=0;i<4;i++){c.fillStyle='#e8eaec';c.beginPath();c.arc(x+20+i*20,sy+27,7,0,7);c.fill();c.fillStyle='#5a7a90';c.beginPath();c.arc(x+20+i*20,sy+27,4,0,7);c.fill();}P(x+110,sy+8,40,34,'#3a2a20');}
  else if(b.draw==='bar'){P(x+8,sy+14,60,34,'#3a2a20');P(x+10,sy+16,56,24,'#f2c26a');P(x+76,sy+14,56,36,'#2a2420');for(let i=0;i<5;i++)P(x+78,sy+16+i*7,52,1,'#4a4038');}
  else{P(x+10,sy+10,w-20,30,'#2a2a2c');drawGrade(P,x+10,sy+10,w-20,30);}
  if(b.sign){const sw=Math.min(w-16,b.sign.length*8+16),bg=b.draw==='bar'?'#1a1416':'#f2ece0',fg=b.draw==='bar'?'#ff5a8a':b.shop==='farmacia'?'#2f8a3a':b.draw==='tile'?'#2e5a8a':'#7a2a1c';
    P(x+8,sy-(b.shop==='padaria'?20:16),sw,12,bg);T(b.sign,x+14,sy-(b.shop==='padaria'?11:7),9,fg);}
  if(R()<.8)drawTag(c,x+w*.2+R()*w*.4,sy-8-R()*30,['#1a1a1a','#c0392b','#2a2a8a'][Math.floor(R()*3)]);
}

// fios entre os topos dos postes (São Paulo); os postes em si vão na camada de profundidade (drawPole)
function drawWires(c){
  c.strokeStyle='rgba(20,20,24,.85)';c.lineWidth=1;
  for(let k=0;k<4;k++){c.beginPath();for(let i=0;i<POLES.length-1;i++){const a=POLES[i],b=POLES[i+1];c.moveTo(a-7+k*3,POLE_TOP+4+k);c.quadraticCurveTo((a+b)/2,POLE_TOP+30+k*3,b-7+k*3,POLE_TOP+4+k);}c.stroke();}
}
function drawPole(ctx,x){
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(x+1,POLE_Y,6,2,0,0,7);ctx.fill();
  ctx.fillStyle='#6a6e72';ctx.fillRect(x,POLE_TOP,3,POLE_Y-POLE_TOP);ctx.fillStyle='#8a8e92';ctx.fillRect(x,POLE_TOP,1,POLE_Y-POLE_TOP);
  ctx.fillStyle='#6a6e72';ctx.fillRect(x-9,POLE_TOP+2,21,2);ctx.fillStyle='#e8e8e0';ctx.fillRect(x+9,POLE_TOP-2,6,4);
  ctx.fillStyle='#4a4e52';ctx.fillRect(x-2,POLE_Y-4,7,4);
}

/* camada parada: céu, cidade ao fundo, fachadas, calçada e rua (redesenhada quando chega uma imagem oficial) */
function buildStatic(imgs){
  const cv=document.createElement('canvas');cv.width=STREET_W;cv.height=STREET_H;const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
  const {P}=painter(c),R=rnd(5);
  const g=c.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#8fa9c4');g.addColorStop(1,'#f0d2a8');c.fillStyle=g;c.fillRect(0,0,STREET_W,GY);
  if(imgs.skyline)c.drawImage(imgs.skyline,0,GY-imgs.skyline.height);
  else for(let x=0;x<STREET_W;){const w=20+R()*40,h=60+R()*80;P(x,GY-60-h,w,h+60,'#a9b3c2');for(let y=GY-60-h+5;y<GY-60;y+=6)for(let xx=x+3;xx<x+w-3;xx+=5)if(R()<.25)P(xx,y,2,3,'#d8dde4');x+=w+2;}
  for(const b of BUILDINGS){const im=imgs[b.id];if(im)c.drawImage(im,b.x,GY-im.height);else drawBuilding(c,b);}
  // calçada funda vista de cima: placas de concreto, manchas, rachaduras e a sombra no pé das fachadas
  P(0,GY,STREET_W,SIDE,'#b4aea2');
  for(let y=GY;y<CURB;y+=13)P(0,y,STREET_W,1,'#a39d91');
  for(let y=GY,r=0;y<CURB;y+=13,r++)for(let x=(r%2)*9;x<STREET_W;x+=18)P(x,y,1,13,'#a39d91');
  for(let y=GY,r=0;y<CURB;y+=13,r++)for(let x=(r%2)*9;x<STREET_W;x+=18)if(R()<.2)P(x+1,y+1,17,12,R()<.5?'rgba(120,110,96,.14)':'rgba(255,250,240,.10)');
  for(let i=0;i<1400;i++)P(R()*STREET_W,GY+2+R()*(SIDE-4),2,1,'#9a948a');
  for(let i=0;i<60;i++){const x=R()*STREET_W,y=GY+6+R()*(SIDE-12);c.fillStyle='rgba(70,62,52,.16)';c.beginPath();c.ellipse(x,y,4+R()*9,1.5+R()*2.5,0,0,7);c.fill();}
  for(let i=0;i<45;i++){let x=R()*STREET_W,y=GY+4+R()*(SIDE-8);for(let k=0;k<6;k++){P(x,y,2,1,'#8f897d');x+=2;y+=R()<.5?1:-1;}}
  P(0,GY,STREET_W,3,'rgba(0,0,0,.24)');P(0,GY+3,STREET_W,3,'rgba(0,0,0,.10)');
  // meio-fio: o topo claro e a face de pedra virada para a câmera
  P(0,CURB,STREET_W,3,'#d0cabe');P(0,CURB+3,STREET_W,6,'#8a857a');P(0,CURB+3,STREET_W,1,'#a49e92');P(0,CURB+8,STREET_W,1,'#5a564e');
  for(let x=0;x<STREET_W;x+=26)P(x,CURB+3,1,6,'#6e6a60');
  // asfalto: sarjeta, faixa de estacionamento, duas faixas de trânsito, faixa amarela no meio
  P(0,ROAD,STREET_W,STREET_H-ROAD,'#4a4c52');for(let i=0;i<4200;i++)P(R()*STREET_W,ROAD+R()*(STREET_H-ROAD),1,1,R()<.5?'#55575d':'#404248');
  P(0,ROAD,STREET_W,4,'#3a3c40');
  for(let x=0;x<STREET_W;x+=10)P(x,ROAD+38,6,1,'rgba(232,232,224,.55)'); // linha da vaga
  for(let x=0;x<STREET_W;x+=40)P(x+6,ROAD+80,24,2,'#e8c63a');
  for(let i=0;i<20;i++){const x=R()*STREET_W,y=ROAD+8+R()*(STREET_H-ROAD-14);c.fillStyle='rgba(20,20,24,.28)';c.beginPath();c.ellipse(x,y,6+R()*12,2+R()*3,0,0,7);c.fill();}
  for(const x of [210,640,1010,1430]){P(x,ROAD+52,16,7,'#3a3c40');P(x+1,ROAD+53,14,5,'#55575d');for(let k=0;k<14;k+=3)P(x+1+k,ROAD+53,1,5,'#3a3c40');}
  drawWires(c);
  return cv;
}

/* ---------- carros em 3/4, vistos de cima (teto e lateral), virados para a direita ----------
   Desenho provisório; a imagem oficial car34-<id>.png do mesmo tamanho entra no lugar sozinha. */
export const CARS=[
  {id:'viatura',w:74,body:'#eef0ee',pol:true},{id:'taxi',w:68,body:'#f2f2ea',taxi:true},
  {id:'carro-vermelho',w:66,body:'#b8392b'},{id:'carro-azul',w:62,body:'#2f5a8a'},{id:'carro-verde',w:72,body:'#3a6a3a'},
  {id:'carro-amarelo',w:64,body:'#d8b44a'},{id:'carro-prata',w:68,body:'#8a8e96'},{id:'onibus',w:156,body:'#d8d2c2',bus:true}
];
const shade=(c,f)=>{const n=parseInt(c.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,m=v=>Math.max(0,Math.min(255,Math.round(f>1?v+(255-v)*(f-1):v*f)));return `rgb(${m(r)},${m(g)},${m(b)})`;};
export const carSize=k=>({w:k.w,h:k.bus?62:40});
function carSprite(k,imgs){
  const off=imgs['car34-'+k.id];if(off)return off;
  const {w,h}=carSize(k),cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');const {P,T}=painter(c);
  const top=shade(k.body,1.22),side=k.body,low=shade(k.body,.72),glass='#2a3a4a',glassHi='#5a7a94';
  const wheel=(x,y,r)=>{c.fillStyle='#141416';c.beginPath();c.ellipse(x,y,r,r*.9,0,0,7);c.fill();c.fillStyle='#7a7e84';c.beginPath();c.ellipse(x,y,r*.42,r*.38,0,0,7);c.fill();};
  if(k.bus){
    const tH=16,sY=tH;P(2,2,w-4,tH,top);P(2,2,w-4,2,shade(k.body,1.35));for(let i=0;i<4;i++)P(16+i*34,6,18,8,shade(k.body,1.05)); // teto com escotilhas
    P(1,sY,w-2,h-sY-8,side);P(1,sY+26,w-2,h-sY-34,low);P(1,sY+22,w-2,4,'#2f6a8a');
    for(let i=0;i<8;i++){P(10+i*17,sY+4,13,15,glass);P(10+i*17,sY+4,13,2,glassHi);}P(w-14,sY+4,10,26,glass);P(w-14,sY+4,10,2,glassHi); // janelas e porta
    P(w-4,sY+28,3,4,'#fff2c0');P(1,sY+28,3,4,'#c0392b');wheel(26,h-8,7);wheel(w-30,h-8,7);return cv;
  }
  // teto/capô/porta-malas (faixa de cima) — a cabine com o para-brisa e o vidro de trás
  const tH=14,sY=tH,cx0=Math.round(w*.3),cx1=Math.round(w*.64);
  P(3,5,w-6,tH-4,top);P(3,5,w-6,1,shade(k.body,1.4));               // capô e porta-malas
  P(cx0,1,cx1-cx0,tH-1,shade(k.body,1.3));P(cx0,1,cx1-cx0,1,shade(k.body,1.5));   // teto da cabine (o ponto mais alto)
  P(cx1,2,8,tH-2,glass);P(cx1,2,8,1,glassHi);P(cx1+1,3,2,tH-5,'rgba(140,175,200,.35)'); // para-brisa, descendo para o capô
  P(cx0-6,2,6,tH-2,glass);P(cx0-6,2,6,1,glassHi);                                      // vidro de trás
  P(cx1+8,5,w-cx1-11,1,shade(k.body,1.05));P(3,5,cx0-9,1,shade(k.body,1.05));
  // lateral
  P(1,sY,w-2,h-sY-7,side);P(1,sY+11,w-2,h-sY-18,low);P(1,sY,w-2,1,shade(k.body,1.1));
  P(cx0-3,sY,cx1-cx0+8,7,glass);P(cx0-3,sY,cx1-cx0+8,1,glassHi);P(Math.round((cx0+cx1)/2)+1,sY,2,7,side); // vidros laterais e coluna
  P(Math.round((cx0+cx1)/2)+1,sY+7,1,9,shade(k.body,.6));                // linha da porta
  P(w-4,sY+4,3,4,'#fff2c0');P(1,sY+4,3,4,'#c0392b');P(1,h-12,w-2,2,'#2b2c30'); // faróis e para-choque
  if(k.pol){P(1,sY+8,w-2,5,'#1c1f22');P(Math.round(w*.42),0,6,3,'#c0392b');P(Math.round(w*.42)+6,0,6,3,'#2f5aa8');T('DHPP',Math.round(w*.36),sY+13,6,'#eef0ee');}
  if(k.taxi){P(Math.round(w*.43),0,10,3,'#f2c230');P(Math.round(w*.43),0,10,1,'#fff0a0');}
  wheel(Math.round(w*.2),h-7,6);wheel(Math.round(w*.8),h-7,6);
  return cv;
}

/* ---------- a rua viva ---------- */
const PED_LOOKS=[
  {skin:'#d9a273',hair:'#2a1d18',style:'short',kind:'rua',top:'#c0392b',pants:'#2b2f36',shoes:'#222'},
  {skin:'#a8714a',hair:'#1f1a18',style:'curly',kind:'rua',top:'#3b7a6b',pants:'#3a3a40',shoes:'#e8e4da'},
  {skin:'#e0b48c',hair:'#7a4a2a',style:'long',kind:'rua',top:'#e8e2d4',pants:'#3b5a8a',shoes:'#222'},
  {skin:'#c98e64',hair:'#1f1a18',style:'bun',kind:'rua',top:'#5a3a6a',pants:'#2b2f36',shoes:'#111'},
  {skin:'#8a5a3a',hair:'#9a9a9a',style:'grey',kind:'rua',top:'#d8a040',pants:'#3a4a5a',shoes:'#222'},
  {skin:'#e8b58e',hair:'#4a2f1d',style:'side',kind:'rua',top:'#2f5a8a',pants:'#2b2f36',shoes:'#222'},
  {skin:'#b67c52',hair:'#2a1d18',style:'short',kind:'rua',top:'#7a8a3a',pants:'#3a3a32',shoes:'#3a2416'}
];

/* gente na escala das fachadas: 12×28 px, as mesmas cores do boneco da base (pele, cabelo, roupa, gravata) */
const MW=12,MH=28;
function miniFrames(L){
  const frames=[];
  for(let f=0;f<4;f++){
    const cv=document.createElement('canvas');cv.width=MW+2;cv.height=MH+2;const c=cv.getContext('2d');
    const P=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x+1,y+1,w,h);};
    const lp=f===1?1:f===3?-1:0,sk=L.skin,top=L.top||'#666',pants=L.pants||'#333',shoes=L.shoes||'#222',hair=L.hair||'#2a1d18';
    // pernas e sapatos (passo)
    P(3,18,2,8+lp,pants);P(7,18,2,8-lp,pants);P(2+(lp>0?-1:0),26+lp,3,2,shoes);P(7+(lp<0?1:0),26-lp,3,2,shoes);
    // tronco e braços
    P(2,9,8,10,top);P(2,9,1,10,'rgba(255,255,255,.18)');P(9,9,1,10,'rgba(0,0,0,.2)');
    P(1,10+lp,1,6,top);P(10,10-lp,1,6,top);P(1,16+lp,1,1,sk);P(10,16-lp,1,1,sk);
    if(L.kind==='civil'){P(5,9,2,2,'#e8e4da');if(L.tie)P(5,10,2,5,L.tie);if(L.badge)P(3,15,1,1,'#d4af37');}
    // cabeça
    P(5,8,2,1,sk);P(3,2,6,6,sk);P(4,4,1,1,'#1a1412');P(7,4,1,1,'#1a1412');
    switch(L.style){
      case 'long':P(3,1,6,2,hair);P(2,2,1,7,hair);P(9,2,1,7,hair);break;
      case 'bun':P(3,1,6,2,hair);P(5,0,2,1,hair);P(2,2,1,3,hair);P(9,2,1,3,hair);break;
      case 'curly':P(2,0,8,3,hair);P(2,3,1,2,hair);P(9,3,1,2,hair);break;
      case 'grey':P(3,1,6,1,hair);P(2,2,1,3,hair);P(9,2,1,3,hair);break;
      case 'cap':P(2,1,8,2,'#23262b');P(1,3,10,1,'#16181c');break;
      default:P(3,1,6,2,hair);P(2,2,1,3,hair);P(9,2,1,2,hair);P(3,3,2,1,hair);
    }
    // contorno escuro de 1 px, como nas figuras da base
    const d=c.getImageData(0,0,cv.width,cv.height),a=d.data,W=cv.width,H=cv.height,m=new Uint8Array(W*H);
    for(let i=0;i<W*H;i++)m[i]=a[i*4+3]>100?1:0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(m[i])continue;
      if((x>0&&m[i-1])||(x<W-1&&m[i+1])||(y>0&&m[i-W])||(y<H-1&&m[i+W])){a[i*4]=24;a[i*4+1]=20;a[i*4+2]=18;a[i*4+3]=200;}}
    c.putImageData(d,0,0);frames.push(cv);
  }
  return frames;
}
// pedestres variados (cores de rua de São Paulo)
function randomLook(R){
  const pick=a=>a[Math.floor(R()*a.length)];
  return {skin:pick(['#f0c9a0','#e0b48c','#d9a273','#c98e64','#b67c52','#a8714a','#8a5a3a','#6e4630']),hair:pick(['#1f1a18','#2a1d18','#4a2f1d','#7a4a2a','#9a9a9a','#3a2416']),
    style:pick(['short','side','long','bun','curly','grey','cap']),kind:'rua',top:pick(['#c0392b','#3b7a6b','#e8e2d4','#5a3a6a','#d8a040','#2f5a8a','#7a8a3a','#26282c','#8a5a8a','#4a6a8a','#e0e0d8']),
    pants:pick(['#2b2f36','#3a3a40','#3b5a8a','#3a4a5a','#3a3a32','#5a4a3a','#1f242b']),shoes:pick(['#222','#e8e4da','#3a2416','#111'])};
}

export function createStreet({lemosLook,onEnter}){
  const imgs={};let layer=buildStatic(imgs);
  // arte oficial: entra no lugar do desenho provisório quando o arquivo existir
  // __STREET_ART__: os arquivos que existem em public/base/street (lista feita no build, vite.config.ts)
  const have=new Set(typeof __STREET_ART__!=='undefined'?__STREET_ART__:[]);
  const want=[...BUILDINGS.map(b=>b.id),'skyline',...CARS.map(k=>'car34-'+k.id),...new Set(PROPS.map(p=>'prop-'+p.id))].filter(id=>have.has(id));
  for(const id of want){const im=new Image();im.onload=()=>{imgs[id]=im;layer=buildStatic(imgs);for(const k of [...cars,...parked])k.spr=carSprite(k.kind,imgs);};im.src=ART+id+'.png';}

  const lemos={x:DHPP.x-40,y:WALK[0]+18,dir:1,walk:0,moving:false,frames:miniFrames(lemosLook),tx:null,ty:null,enter:false};
  // estacionados junto ao meio-fio: a viatura do DHPP na frente do prédio e mais alguns
  const parked=[[0,DHPP.x+28],[2,190],[6,1040],[5,1420]].map(([i,x])=>({kind:CARS[i],x,y:PARK}));for(const p of parked)p.spr=carSprite(p.kind,imgs);
  const viatura=parked[0];
  const R=rnd(17);
  const peds=Array.from({length:14},(_,i)=>({x:R()*STREET_W,y:WALK[0]+4+R()*(WALK[1]-WALK[0]-4),dir:R()<.5?-1:1,v:10+R()*9,walk:R()*10,frames:miniFrames(i<PED_LOOKS.length?PED_LOOKS[i]:randomLook(R)),pause:0,id:i}));
  const cars=[];const moving=CARS.slice(1);
  for(let l=0;l<LANES.length;l++)for(let i=0;i<3;i++){const kind=moving[(l*4+i)%moving.length];cars.push({kind,spr:carSprite(kind,imgs),lane:l,x:i*STREET_W/3+R()*160,v:LANES[l].v*(0.85+R()*0.3)});}
  let camX=lemos.x,t=0;

  function update(dt){
    t+=dt;
    // Lemos
    if(lemos.tx!=null){const dx=lemos.tx-lemos.x,dy=lemos.ty-lemos.y,d=Math.hypot(dx,dy),sp=48*dt;
      if(d<=sp){lemos.x=lemos.tx;lemos.y=lemos.ty;lemos.tx=null;lemos.moving=false;if(lemos.enter){lemos.enter=false;onEnter();}}
      else{lemos.x+=dx/d*sp;lemos.y+=dy/d*sp;lemos.walk+=sp/13;lemos.moving=true;if(Math.abs(dx)>0.5)lemos.dir=dx>0?1:-1;}}
    // gente na calçada: anda, às vezes para um pouco (vitrine, celular), e some numa ponta para voltar na outra
    for(const p of peds){
      if(p.pause>0){p.pause-=dt;p.moving=false;continue;}
      p.x+=p.dir*p.v*dt;p.walk+=p.v*dt/13;p.moving=true;
      if(R()<dt*0.08)p.pause=1+R()*3;
      if(p.x<-30){p.x=STREET_W+20;p.y=WALK[0]+4+R()*(WALK[1]-WALK[0]-4);}else if(p.x>STREET_W+30){p.x=-20;p.y=WALK[0]+4+R()*(WALK[1]-WALK[0]-4);}
    }
    // trânsito
    for(const k of cars){const ln=LANES[k.lane];k.x+=ln.dir*k.v*dt;if(ln.dir>0&&k.x>STREET_W+40)k.x=-k.spr.width-40-R()*200;if(ln.dir<0&&k.x<-k.spr.width-40)k.x=STREET_W+40+R()*200;}
  }

  // s: pixels do canvas por pixel de arte
  // o mundo inteiro na altura da tela: fachadas cortadas no alto (o cabeçalho fica por cima delas) e o chão na metade de baixo
  function view(cw,ch,rs){const s=Math.min(ch/(STREET_H-15),cw/380);const vw=cw/s;camX+=(clamp(lemos.x,vw/2,STREET_W-vw/2)-camX)*0.12;camX=clamp(camX,vw/2,STREET_W-vw/2);return {s,left:camX-vw/2,top:-(ch/s-STREET_H)/2,rs};}
  const clamp=(v,a,b)=>a>b?(a+b)/2:v<a?a:v>b?b:v;

  function draw(ctx,cw,ch,rs,marker){
    const V=view(cw,ch,rs),{s,left}=V;
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
    ctx.fillStyle='#2a2b2e';ctx.fillRect(0,0,cw,ch);ctx.imageSmoothingEnabled=false;
    const oy=ch-STREET_H*s; // a rua encosta embaixo; sobra de altura vira céu
    if(oy>0){ctx.fillStyle='#8fa9c4';ctx.fillRect(0,0,cw,oy);}
    ctx.setTransform(s,0,0,s,-left*s,oy);
    ctx.drawImage(layer,0,0);
    const ents=[];
    for(const p of peds)ents.push({y:p.y,d:()=>person(ctx,p)});
    ents.push({y:lemos.y,d:()=>person(ctx,lemos)});
    for(const x of POLES)ents.push({y:POLE_Y,d:()=>drawPole(ctx,x)});
    for(const p of PROPS){const im=imgs['prop-'+p.id];if(im)ents.push({y:p.y,d:()=>ctx.drawImage(im,Math.round(p.x-im.width/2),Math.round(p.y-im.height))});}
    for(const p of parked)ents.push({y:p.y,d:()=>{ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(p.x+p.spr.width/2,p.y-2,p.spr.width/2,4,0,0,7);ctx.fill();ctx.drawImage(p.spr,Math.round(p.x),Math.round(p.y-p.spr.height));}});
    for(const k of cars)ents.push({y:LANES[k.lane].y,d:()=>{const sp=k.spr,flip=LANES[k.lane].dir<0;
      ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(k.x+sp.width/2,LANES[k.lane].y-2,sp.width/2,4,0,0,7);ctx.fill();
      if(flip){ctx.save();ctx.translate(Math.round(k.x)+sp.width,0);ctx.scale(-1,1);ctx.drawImage(sp,0,LANES[k.lane].y-sp.height);ctx.restore();}
      else ctx.drawImage(sp,Math.round(k.x),LANES[k.lane].y-sp.height);}});
    ents.sort((a,b)=>a.y-b.y);for(const e of ents)e.d();
    if(marker){const b=Math.round(Math.sin(t*6)*2),X=DOOR.x,Y=GY-16+b;ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(X,Y+8);ctx.lineTo(X-7,Y);ctx.lineTo(X,Y-8);ctx.lineTo(X+7,Y);ctx.fill();
      ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y+6);ctx.lineTo(X-5,Y);ctx.lineTo(X,Y-6);ctx.lineTo(X+5,Y);ctx.fill();ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y-4,2,5);ctx.fillRect(X-1,Y+2,2,1.5);}
    ctx.restore();
    lastView={...V,oy,cw,ch};
  }
  let lastView=null;
  function person(ctx,p){
    const f=p.moving?Math.floor(p.walk*2.4)%4:0,img=p.frames[f],X=Math.round(p.x),Y=Math.round(p.y);
    ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(X,Y,6,2,0,0,7);ctx.fill();
    if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);ctx.drawImage(img,-7,Y-MH-1);ctx.restore();}else ctx.drawImage(img,X-7,Y-MH-1);
  }


  /** toque na tela (px do canvas): na porta ou na fachada do DHPP entra; na calçada anda até lá */
  function tap(px,py){
    if(!lastView)return;const {s,left,oy}=lastView,wx=left+px/s,wy=(py-oy)/s;
    const onDhpp=wx>=DHPP.x&&wx<=DHPP.x+DHPP.w&&wy<GY+6;
    if(onDhpp){lemos.tx=DOOR.x;lemos.ty=DOOR.y;lemos.enter=true;return;}
    lemos.tx=clamp(wx,12,STREET_W-12);lemos.ty=clamp(wy,WALK[0],WALK[1]);lemos.enter=false; // tocou na rua: vai até a beira da calçada
  }
  /** posiciona Lemos: 'porta' (saindo do DHPP) ou 'carro' (chegando na viatura) */
  function place(where){
    lemos.tx=null;lemos.enter=false;lemos.moving=false;
    if(where==='porta'){lemos.x=DOOR.x;lemos.y=DOOR.y+6;lemos.dir=1;}
    else{lemos.x=viatura.x+viatura.spr.width/2;lemos.y=WALK[1];lemos.dir=1;}
    camX=lemos.x;
  }
  return {update,draw,tap,place,lemos,get view(){return lastView;}};
}
