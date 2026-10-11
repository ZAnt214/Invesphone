/* Arte da Rua do DHPP no visual da planta da base (direção aprovada: perspectiva de Beat Cop — fachadas de frente até o
   topo da tela, calçada vista de cima, rua horizontal com os carros de lado — com a paleta, as janelas, a fachada bege e o
   letreiro do DHPP da base). Tudo desenhado aqui em pixel art, na unidade da planta (os bonecos de dentro têm 46 px). */

// medidas (px da rua = px da planta)
export const GY=560;                 // pé das fachadas = começo da calçada
export const SIDE=130;               // fundura da calçada vista de cima
export const CURB=GY+SIDE;           // meio-fio
export const ROAD=CURB+12;           // começo do asfalto
export const NEAR=ROAD+300;          // calçada de cá (embaixo)
export const STREET_H=NEAR+115;
export const WALK=[GY+14,CURB-10];   // onde dá para andar
export const PARK=CURB+76;           // rodas dos carros estacionados
export const LANES=[{y:ROAD+214,dir:-1,v:70},{y:ROAD+290,dir:1,v:78}];
export const FLOOR=70,GROUND=118;    // andar e térreo

export function rnd(seed){let s=seed%2147483647||7;return ()=>(s=s*16807%2147483647)/2147483647;}
export const O='#1e1611';

/** pinta o quarteirão (fachadas de frente) num contexto; b: lista de lotes com X e w */
export function paintFacades(g,lots,A,{sign,door}){
  const R=rnd(5);
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const box=(x,y,w,h,c,hi,lo)=>{P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,c);if(hi)P(x,y,w,1,hi);if(lo)P(x,y+h-1,w,1,lo);};
  const grain=(x,y,w,h,a=.06)=>{for(let i=0;i<w*h/14;i++)P(x+R()*w,y+R()*h,1,1,R()<.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a*.8})`);};
  const brick=(x,y,w,h,base)=>{P(x,y,w,h,base);for(let yy=y,r=0;yy<y+h;yy+=4,r++){P(x,yy,w,1,'rgba(214,196,176,.26)');for(let xx=x+(r%2?5:0);xx<x+w;xx+=10)P(xx,yy+1,1,3,'rgba(214,196,176,.2)');}grain(x,y,w,h);};
  const siding=(x,y,w,h)=>{P(x,y,w,h,'#b9a58a');for(let yy=y+4;yy<y+h;yy+=6){P(x,yy,w,1,'rgba(90,70,45,.22)');P(x,yy+1,w,1,'rgba(255,245,225,.10)');}for(let yy=y+4;yy<y+h;yy+=12)for(let xx=x+8;xx<x+w;xx+=32)P(xx+((yy>>2)%2?0:16),yy,1,6,'rgba(90,70,45,.18)');grain(x,y,w,h,.05);};
  // janela de guilhotina no traço da base: moldura branca, vidro azul, peitoril, às vezes acesa, com ar-condicionado ou floreira
  const win=(x,y,{lit=false,ac=false,flower=false,w=26,h=38}={})=>{
    P(x-3,y-4,w+6,4,'#d8d0c0');P(x-3,y-4,w+6,1,'#f2ecdf');
    P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,'#f2efe6');P(x+2,y+2,w-4,h-4,lit?'#e9c27a':'#7fa6c4');P(x+3,y+3,7,4,lit?'#fbe2a8':'#cfe2f0');
    P(x+2,y+h/2-1,w-4,2,'#f2efe6');P(x+w/2-.5,y+2,1,h-4,'#f2efe6');P(x+2,y+2,w-4,2,'rgba(0,0,0,.2)');
    if(lit&&R()<.5){P(x+2,y+2,5,h-4,'#b85a4a');P(x+w-7,y+2,5,h-4,'#b85a4a');}
    P(x-3,y+h,w+6,3,'#d8d2c4');P(x-1,y+h+3,w+6,2,'rgba(0,0,0,.25)');
    if(ac){const ay=y+h-14;P(x+3,ay,w-6,12,'#d9d6cb');P(x+3,ay,w-6,1,'#f2f0e8');P(x+3,ay+11,w-6,1,'#9a978c');for(let k=0;k<6;k++)P(x+5+k*3,ay+2,1,8,'#a9a69a');P(x+w/2,ay+12,1,6,'rgba(60,90,120,.35)');}
    if(flower){P(x-2,y+h+3,w+4,6,'#5a3a24');for(let k=0;k<w;k+=3){P(x-1+k,y+h-1,2,4,k%2?'#3a6a2e':'#69ad52');if(k%6===0)P(x+k,y+h-2,2,2,['#c0392b','#f2c230','#e8e2d4'][(k/6)%3]);}}
  };
  const cornice=(x,y,w,c='#3a2e26')=>{P(x-2,y,w+4,12,O);P(x-1,y+1,w+2,10,c);P(x-1,y+1,w+2,2,'rgba(255,255,255,.18)');for(let k=x+4;k<x+w-4;k+=12)P(k,y+11,4,6,c);P(x,y+12,w,3,'rgba(0,0,0,.3)');};
  const fireEscape=(x,top,bot,w)=>{for(let y=top;y<bot;y+=FLOOR){P(x+4,y+4,w,3,'rgba(0,0,0,.3)');P(x,y,w,3,'#1c1d20');for(let k=0;k<w;k+=4)P(x+k,y-14,1,14,'#1c1d20');P(x,y-14,w,2,'#1c1d20');if(y+FLOOR<bot)for(let k=0;k<FLOOR;k+=4)P(x+w-18+Math.round(k*12/FLOOR),y+k,5,1,'#2a2b2e');}};
  const txt=(s,x,y,size,col)=>{g.font=`700 ${size}px Rajdhani,"Arial Narrow",Arial,sans-serif`;g.textBaseline='middle';g.fillStyle=col;g.fillText(s,x,y);return g.measureText(s).width;};
  const signBoard=(x,y,w,h,s,bg,fg,size=20)=>{P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,bg);P(x,y,w,2,'rgba(255,255,255,.2)');P(x,y+h-2,w,2,'rgba(0,0,0,.25)');g.font=`700 ${size}px Rajdhani,"Arial Narrow",Arial`;const tw=g.measureText(s).width;txt(s,Math.round(x+w/2-tw/2)+1,y+h/2+1,size,'rgba(0,0,0,.3)');txt(s,Math.round(x+w/2-tw/2),y+h/2,size,fg);};
  const awning=(x,y,w,col)=>{for(let j=0;j<16;j++)for(let k=0;k<w;k+=10)P(x+k-(16-j)*.3,y+j,10,1,(k/10)%2?'#efe6d2':col);for(let k=0;k<w;k+=10)E(x+k+5,y+16,5,3,(k/10)%2?'#d8ceb8':col);P(x,y+19,w,4,'rgba(0,0,0,.25)');};
  const doorAt=(x,y,w,h,col)=>{P(x-3,y-4,w+6,h+4,'#d8d0c0');P(x-1,y-1,w+2,h+1,O);P(x,y,w,h,col);P(x+3,y+4,w-6,h*.4,'#7fa6c4');P(x+w-6,y+h/2,2,3,'#c9a24a');P(x,y,w,3,'rgba(0,0,0,.35)');};
  const glass=(x,y,w,h,fill,items)=>{P(x-1,y-1,w+2,h+2,O);P(x,y,w,h,fill);items&&items();P(x,y,w,4,'rgba(0,0,0,.3)');P(x+w-1,y,1,h,'rgba(255,255,255,.25)');for(let k=0;k<3;k++)P(x+10+k*16,y+6,2,h-10,'rgba(255,255,255,.12)');};
  const neon=(x,y,s,col)=>{P(x-2,y-2,s.length*8+6,15,'#1a0c0e');txt(s,x+1,y+5,11,col);P(x-4,y-4,s.length*8+10,19,'rgba(255,120,120,.10)');};
  const stoop=(x,w,col)=>{doorAt(x+w/2-16,GY-74,32,56,col);for(let k=0;k<3;k++)P(x+w/2-26-k*4,GY-18+k*6,52+k*8,6,k%2?'#c9c3b8':'#e4e0d8');};

  const SHOP={
    diner:(x,gt,w)=>{for(let y=gt;y<GY;y+=4)P(x,y,w,4,(y/4)%2?'#c9ccd0':'#e4e6e8');glass(x+14,gt+50,w-80,GY-gt-62,'#e8c48a',()=>{for(let k=0;k<Math.floor((w-100)/28);k++){E(x+40+k*28,gt+80,6,6,['#d9a273','#8a5a3a','#f0c9a0','#6e4630','#e0b48c','#a8714a'][k%6]);P(x+34+k*28,gt+86,12,14,['#3b5a7a','#8a2a2a','#e8e2d4','#5a3a6a','#3a6a4a','#d8a040'][k%6]);}P(x+14,gt+96,w-80,8,'#b02a24');});doorAt(x+w-54,GY-80,34,74,'#c9ccd0');neon(x+w-112,gt+58,'OPEN','#ff5a7a');},
    grocery:(x,gt,w)=>{P(x,gt,w,GY-gt,'#5a3a2a');glass(x+12,gt+50,w-70,GY-gt-80,'#3a3430',()=>{for(let s=0;s<3;s++)for(let k=0;k<Math.floor((w-80)/12);k++)P(x+16+k*12,gt+56+s*12,9,9,['#c0392b','#f2c230','#2f8a3a','#e8e2d4','#2f5aa8'][(k+s)%5]);});
      for(let k=0;k<Math.floor((w-70)/26);k++){const bx=x+12+k*26;P(bx,GY-26,24,20,'#8a6a40');P(bx,GY-26,24,3,'#a8865e');for(let j=0;j<6;j++)E(bx+4+(j%3)*8,GY-27+(j>2?4:0),3.5,3,['#c0392b','#f2c230','#2f8a3a','#e08a2a'][(k+j)%4]);}doorAt(x+w-50,GY-80,34,74,'#3a2a22');},
    pawn:(x,gt,w)=>{P(x,gt,w,GY-gt,'#4a3a30');glass(x+70,gt+46,w-90,GY-gt-58,'#2a2420',()=>{P(x+100,gt+70,5,30,'#c8843a');E(x+102,gt+66,7,8,'#d89a4a');box(x+150,gt+74,30,22,'#3a3c40');P(x+153,gt+77,24,16,'#5a7a90');});neon(x+82,gt+52,'WE BUY','#ff9a3a');doorAt(x+20,GY-80,36,74,'#3a2a22');},
    laundry:(x,gt,w)=>{P(x,gt,w,GY-gt,'#4a4c52');glass(x+14,gt+54,w-74,GY-gt-66,'#b8c8d2',()=>{for(let k=0;k<Math.floor((w-80)/36);k++){const cx=x+38+k*36;box(cx-14,gt+68,28,32,'#e8eaec');E(cx,gt+84,9,9,'#5a7a90');}});doorAt(x+w-52,GY-80,34,74,'#2a2b2e');neon(x+w-104,gt+60,'OPEN','#ff5a7a');},
    barber:(x,gt,w)=>{P(x,gt,w,GY-gt,'#4a3a30');glass(x+60,gt+50,w-80,GY-gt-62,'#c4d6e2',()=>{P(x+60,GY-34,w-80,22,'#e8e2d4');for(let k=0;k<w-80;k+=6)P(x+60+k,GY-34,3,22,(k/6)%2?'#2a2b2e':'#e8e2d4');box(x+80,gt+66,16,20,'#5a3a2a');box(x+130,gt+66,16,20,'#5a3a2a');});
      doorAt(x+16,GY-80,34,74,'#3a2a22');const px=x+w-14;P(px-3,gt+44,8,60,O);for(let k=0;k<58;k+=8){P(px-2,gt+45+k,6,4,'#c0392b');P(px-2,gt+49+k,6,4,'#2f5aa8');}}
  };
  for(const b of lots){
    const x=b.X,w=b.w,top=0;
    if(b.k==='alley'){P(x,0,w,GY,'#2a2420');const d=Math.min(24,w/3);for(let k=0;k<d;k++){P(x+k,0,1,GY,`rgba(70,40,30,${.9-k*.035})`);P(x+w-1-k,0,1,GY,`rgba(120,70,50,${.9-k*.035})`);}
      P(x+d,60,w-2*d,GY-60,'#3a3230');for(let y=80;y<GY-40;y+=40)P(x+d+6,y,w-2*d-12,3,'#1c1d20');P(x+d-4,GY-30,w-2*d+8,30,'#4e4b46');
      if(w>80){box(x+d+6,GY-62,Math.min(50,w-2*d-12),40,'#3f6a46','#5a8a64','#24442c');}
      for(const [dx,dy,r] of [[d-6,-10,9],[d+8,-6,8],[w-d-4,-12,9]]){E(x+dx,GY+dy,r+1,r,O);E(x+dx,GY+dy,r,r-1,'#24242a');}continue;}
    if(b.k==='dhpp'){
      // a fachada bege da base em toda a altura, com calhas nas pontas, platibanda e janelas brancas com ar-condicionado
      siding(x,40,w,GY-40);P(x-1,40,1,GY-40,O);P(x+w,40,1,GY-40,O);
      const cap=['#6e5c4c','#8c7862','#4a3e33'];P(x-4,28,w+8,16,cap[0]);P(x-4,28,w+8,2,'#241c16');for(let k=0;k<w/3;k++)P(x-4+R()*(w+8),28+R()*14,2,1,cap[k%3]);P(x,44,w,6,'rgba(0,0,0,.2)');
      for(const dx of [10,w-18]){P(x+dx,40,8,GY-40,'#8a8c86');P(x+dx,40,2,GY-40,'#b9bab4');for(let y=60;y<GY;y+=24)P(x+dx-2,y,12,3,'#6a6c66');}
      const n=Math.floor((w-60)/70);for(let y=70;y<GY-170;y+=82)for(let i=0;i<n;i++)win(x+40+i*((w-80)/n)+((w-80)/n-30)/2,y,{lit:R()<.2,ac:R()<.45,w:30,h:42});
      // térreo: o letreiro e a porta da planta, ampliados sem suavizar, degraus e duas janelas
      g.imageSmoothingEnabled=false;
      const sw=sign.width*1.5,sh=sign.height*1.5,dw=door.width*1.6,dh=door.height*1.9,cx=x+w/2;
      P(cx-dw/2-6,GY-dh-14,dw+12,dh+14,'#8f816b');P(cx-dw/2-6,GY-dh-14,dw+12,2,'#cfc3ad');
      g.drawImage(door,Math.round(cx-dw/2),Math.round(GY-dh-8),Math.round(dw),Math.round(dh));
      P(Math.round(cx-sw/2)+4,Math.round(GY-dh-sh-20)+4,Math.round(sw),Math.round(sh),'rgba(0,0,0,.3)');
      g.drawImage(sign,Math.round(cx-sw/2),Math.round(GY-dh-sh-20),Math.round(sw),Math.round(sh));
      for(let k=0;k<3;k++){const ww=dw+30+k*14;P(cx-ww/2,GY-10+k*4-6,ww,4,k%2?'#c9c3b8':'#e4e0d8');}
      for(const xx of [x+40,x+w-70])win(xx,GY-110,{w:30,h:42,ac:true});
      // mastros das bandeiras (o pano é desenhado no jogo, tremulando)
      b.flags=[];for(const fx of [Math.round(cx-sw/2-40),Math.round(cx+sw/2+36)]){P(fx+4,GY-196,2,190,'rgba(0,0,0,.2)');P(fx,GY-200,4,196,'#c9ccce');P(fx,GY-200,1,196,'#eef0f2');E(fx+2,GY-202,3,2.5,'#e8c63a');P(fx-4,GY-8,12,8,'#6a6e72');b.flags.push({x:fx+4,y:GY-196,v:b.flags.length?'dh':'br'});}
      P(x,GY-6,w,6,'#7a6a52');P(x,GY-6,w,1,'#8f816b');
      continue;}
    // prédio de tijolo: andares até o topo, cornija, escada de incêndio e o térreo (loja ou entrada)
    brick(x,top,w,GY-top,b.brick);P(x-1,top,1,GY-top,O);P(x+w,top,1,GY-top,O);P(x+w-3,top,3,GY-top,'rgba(0,0,0,.18)');
    const gTop=GY-GROUND,cols=Math.max(2,Math.round((w-30)/58)),cw=(w-30)/cols;
    for(let y=gTop-FLOOR;y>top-50;y-=FLOOR){P(x,y+60,w,5,'#c8bea8');P(x,y+60,w,1,'#e8e0d0');P(x,y+65,w,2,'rgba(0,0,0,.25)');
      for(let i=0;i<cols;i++){const wx=Math.round(x+15+i*cw+cw/2-13);if(y+12<top)continue;win(wx,y+14,{lit:R()<.25,ac:R()<.3,flower:R()<.18});}}
    if(b.fire)fireEscape(Math.round(x+w*.5),gTop-FLOOR+56,gTop,Math.round(w*.42));
    cornice(x,top,w,b.cor);
    P(x,gTop-6,w,6,'#3a2e26');
    if(b.k==='apt'){stoop(x,w,b.door||'#2f4a3a');for(const xx of [x+14,x+w-40])win(xx,gTop+30,{lit:R()<.3,flower:true});}
    else{SHOP[b.k]&&SHOP[b.k](x,gTop,w);if(b.awn)awning(x+8,gTop+30,w-16,b.awn);if(b.name)signBoard(x+14,gTop+4,w-28,26,b.name,b.signc||'#2a2e33',b.ink||'#e8ecef');}
    P(x,GY-6,w,6,'#7a6a52');P(x,GY-6,w,1,'#8f816b');
  }
}

/** chão: calçada de lá (vista de cima), meio-fio, asfalto com vagas e faixas, calçada de cá */
export function paintGround(g,W){
  const R=rnd(9);const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const grain=(x,y,w,h,a=.06,n)=>{for(let i=0;i<(n??w*h/14);i++)P(x+R()*w,y+R()*h,1,1,R()<.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a*.8})`);};
  const walk=(y0,y1)=>{P(0,y0,W,y1-y0,'#b4aea2');for(let y=y0,r=0;y<y1;y+=32,r++){P(0,y,W,1,'#a19b8f');P(0,y+1,W,1,'#c2bcb0');for(let x=(r%2)*32;x<W;x+=64){P(x,y,1,32,'#a19b8f');P(x+1,y,1,32,'#c2bcb0');const t=R();if(t<.22)P(x+2,y+2,61,29,t<.11?'rgba(120,110,96,.13)':'rgba(255,250,240,.10)');}}grain(0,y0,W,y1-y0);
    for(let i=0;i<W/40;i++){let x=R()*W,y=y0+6+R()*(y1-y0-12);for(let k=0;k<9;k++){P(x,y,2,1,'#8f897d');P(x,y+1,2,1,'rgba(255,255,255,.18)');x+=2;y+=R()<.5?1:-1;}}};
  walk(GY,CURB);P(0,GY,W,8,'rgba(0,0,0,.25)');P(0,GY+8,W,6,'rgba(0,0,0,.10)');
  P(0,CURB,W,4,'#d2ccc0');P(0,CURB+4,W,8,'#8a857a');P(0,CURB+11,W,1,'#5a564e');for(let x=0;x<W;x+=43)P(x,CURB,1,12,'#6e6a60');
  P(0,ROAD,W,NEAR-ROAD,'#4a4c52');grain(0,ROAD,W,NEAR-ROAD,.1);for(let i=0;i<W/30;i++)E(R()*W,ROAD+R()*(NEAR-ROAD),10+R()*30,3+R()*7,'rgba(20,20,24,.2)');
  for(let i=0;i<W/60;i++){let x=R()*W,y=ROAD+10+R()*(NEAR-ROAD-20);for(let k=0;k<12;k++){P(x,y,2,1,'#2e3034');x+=2;y+=R()<.5?1:-1;}}
  P(0,ROAD,W,5,'#3a3c40');
  for(let x=0;x<W;x+=200)P(x,ROAD+8,3,70,'rgba(232,232,224,.5)');
  for(let x=20;x<W;x+=110)P(x,ROAD+150,50,4,'#d8d8d0');P(0,ROAD+232,W,3,'#d8b43a');P(0,ROAD+238,W,3,'#d8b43a');
  for(const x of [W*.3,W*.72]){E(x,ROAD+120,16,6,'#2e3034');E(x,ROAD+120,13,5,'#55575d');for(let k=-9;k<=9;k+=3)P(x+k,ROAD+117,2,6,'#3e4044');}
  P(0,NEAR,W,4,'#d2ccc0');P(0,NEAR+4,W,6,'#8a857a');walk(NEAR+10,STREET_H);
}
