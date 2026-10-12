/* Prédios de baixo (primeiro plano) da Rua do DHPP: vistos de cima e cortados, com o interior à mostra — sala, cozinha, quarto,
   escritório, lavanderia, café — para a vida de dentro aparecer (gente em dwellers.js). A platibanda sobe até perto da calçada
   de cá; a parede da frente (do lado da rua) mostra a face de dentro, com janelas que jogam luz no piso na direção do sol.
   Mesma luz da rua (SUN) e as mesmas cores de tijolo/madeira da base. Pintado uma vez. */
import {FG_TOP,FG_H,SUN,rnd,O} from './streetArt';

const WALL_H=26;                               // face de dentro da parede da frente, em px de tela
const BRICKS=['#8a3a2c','#8e4434','#9a3f30','#7a5a42','#a0603a','#8e3b2c','#b09a6a','#8e4434'];
const WIDTHS=[300,280,260,320,280,320,360,360];
const PLAN=[['living','kitchen'],['bedroom','living','office'],['kitchen','living'],['cafe','laundry'],['bedroom','living'],['office','living','bedroom'],['living','kitchen','bedroom'],['bedroom','living']];

/** pinta o primeiro plano em g; devolve as salas: {x,y,w,h,type,spots:[{x,y,k}],door} (k: sit | stand | bed | cook | tv) */
export function paintForeground(g,W){
  const R=rnd(77),rooms=[];
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const sh=(x,y,w,h,a=.26)=>P(x+4,y+5,w,h,`rgba(24,14,10,${a})`);                 // sombra no piso, para a direita e para baixo
  const k0=W/WIDTHS.reduce((a,b)=>a+b,0);let X=0;
  const floorY=FG_TOP+WALL_H+6;
  WIDTHS.forEach((wd,bi)=>{
    const bw=Math.round(wd*k0),x0=Math.round(X);X+=bw;const brick=BRICKS[bi%BRICKS.length],types=PLAN[bi];
    // fundo escuro do prédio e as paredes laterais (cortadas)
    P(x0,FG_TOP,bw,FG_H,'#2a211b');
    // salas
    const n=types.length;let rx=x0+5;
    for(let r=0;r<n;r++){
      const t=types[r],rw=r===n-1?x0+bw-5-rx:Math.round((bw-10)/n),ry=floorY,rh=FG_H-(floorY-FG_TOP)-4;
      room(g,P,E,sh,R,{x:rx,y:ry,w:rw,h:rh,type:t},rooms,brick);
      if(r<n-1){P(rx+rw-1,FG_TOP+WALL_H,5,rh+6,'#3a2e26');P(rx+rw-1,FG_TOP+WALL_H,1,rh+6,'#5a4a3e');P(rx+rw+3,FG_TOP+WALL_H,1,rh+6,'#1c1410');}   // parede entre as salas
      rx+=rw+4;}
    // parede da frente: a platibanda (tampa de pedra) e a face de dentro, de tijolo, com janelas e rodapé
    P(x0,FG_TOP,bw,6,'#8f8474');P(x0,FG_TOP,bw,1,'#d8ccb4');P(x0,FG_TOP+5,bw,1,'#5a5248');
    for(let y=FG_TOP+6;y<FG_TOP+6+WALL_H;y+=4){P(x0,y,bw,4,brick);P(x0,y,bw,1,'rgba(214,196,176,.22)');for(let xx=x0+((y>>2)%2?5:0);xx<x0+bw;xx+=10)P(xx,y+1,1,3,'rgba(214,196,176,.18)');}
    for(let i=0;i<bw/6;i++)P(x0+R()*bw,FG_TOP+8+R()*WALL_H,1+R()*3,1,'rgba(0,0,0,.12)');
    const nw=Math.max(2,Math.round(bw/90));
    for(let i=0;i<nw;i++){const ww=28,wx=Math.round(x0+(i+.5)*bw/nw-ww/2),wy=FG_TOP+10;
      P(wx-2,wy-2,ww+4,WALL_H-6,'#d8d0c0');P(wx,wy,ww,WALL_H-10,'#9bbbd3');P(wx,wy,ww,3,'#6f93b0');P(wx+ww/2,wy,1,WALL_H-10,'#f2efe6');P(wx,wy+2,ww,1,'rgba(255,255,255,.5)');
      // o facho de sol que entra pela janela e cai no piso, inclinado para a direita
      g.save();g.globalCompositeOperation='screen';for(const [a,f] of [[.12,1],[.07,1.5]]){g.fillStyle=`rgba(255,238,196,${a})`;g.beginPath();g.moveTo(wx,floorY);g.lineTo(wx+ww,floorY);g.lineTo(wx+ww+SUN.kx*70*f,floorY+70*f);g.lineTo(wx+SUN.kx*70*f,floorY+70*f);g.closePath();g.fill();}g.restore();}
    P(x0,FG_TOP+WALL_H,bw,6,'#3a2a22');P(x0,FG_TOP+WALL_H,bw,1,'#6a5444');                                  // rodapé
    // a face da parede escurece para baixo; o piso logo abaixo fica na sombra dela
    const gr=g.createLinearGradient(0,FG_TOP+6,0,FG_TOP+WALL_H+34);gr.addColorStop(0,'rgba(20,12,8,0)');gr.addColorStop(.5,'rgba(20,12,8,.18)');gr.addColorStop(1,'rgba(20,12,8,0)');g.fillStyle=gr;g.fillRect(x0,FG_TOP+6,bw,WALL_H+34);
    // paredes laterais do prédio
    P(x0,FG_TOP,3,FG_H,'#241a14');P(x0+bw-3,FG_TOP,3,FG_H,'#241a14');P(x0+bw-3,FG_TOP,1,FG_H,'#4a3a2e');
  });
  // base cortada: o fim da planta some no escuro
  const gb=g.createLinearGradient(0,FG_TOP+FG_H-40,0,FG_TOP+FG_H);gb.addColorStop(0,'rgba(10,8,8,0)');gb.addColorStop(1,'rgba(10,8,8,.7)');g.fillStyle=gb;g.fillRect(0,FG_TOP+FG_H-40,W,40);
  return rooms;
}

function room(g,P,E,sh,R,r,rooms,brick){
  const {x,y,w,h,type}=r,spots=[];
  const pick=a=>a[Math.floor(R()*a.length)];
  // piso: tábua corrida, ladrilho (cozinha, lavanderia, café) ou carpete (quarto), com bisel e grão
  const tile=type==='kitchen'||type==='laundry'||type==='cafe',carpet=type==='bedroom';
  if(tile){P(x,y,w,h,'#c9c6bb');for(let yy=y;yy<y+h;yy+=16)for(let xx=x+((yy-y)/16%2?0:0);xx<x+w;xx+=16){if(((xx-x)/16+(yy-y)/16)%2===0)P(xx,yy,16,16,'rgba(255,255,255,.14)');P(xx,yy,16,1,'rgba(90,90,84,.2)');P(xx,yy,1,16,'rgba(90,90,84,.2)');}}
  else if(carpet){P(x,y,w,h,pick(['#7a6a8a','#6a7a8a','#8a6a62']));for(let i=0;i<w*h/10;i++)P(x+R()*w,y+R()*h,1,1,R()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.07)');}
  else{const base=pick(['#a9794a','#9a6a40','#b78a58']);P(x,y,w,h,base);for(let yy=y,k=0;yy<y+h;yy+=9,k++){P(x,yy,w,1,'rgba(40,24,12,.3)');P(x,yy+1,w,1,'rgba(255,230,190,.08)');for(let xx=x+((k*37)%53);xx<x+w;xx+=60)P(xx,yy+1,1,8,'rgba(40,24,12,.22)');}
    for(let i=0;i<w*h/90;i++)P(x+R()*w,y+R()*h,3+R()*8,1,'rgba(60,36,18,.1)');}
  // sombra de ambiente nos cantos
  const gl=g.createLinearGradient(x,0,x+16,0);gl.addColorStop(0,'rgba(20,12,8,.3)');gl.addColorStop(1,'rgba(20,12,8,0)');g.fillStyle=gl;g.fillRect(x,y,16,h);
  const rug=(rx,ry,rw,rh,c)=>{P(rx,ry,rw,rh,c);P(rx+3,ry+3,rw-6,rh-6,'rgba(255,255,255,.1)');P(rx,ry,rw,1,'rgba(0,0,0,.2)');P(rx,ry+rh-1,rw,1,'rgba(0,0,0,.2)');for(let k=rx+2;k<rx+rw;k+=4)P(k,ry-2,1,2,c);};
  const sofa=(sx,sy,sw,c)=>{sh(sx,sy,sw,22);P(sx,sy,sw,22,c);P(sx,sy,sw,7,'rgba(0,0,0,.25)');P(sx,sy,sw,1,'rgba(255,255,255,.18)');P(sx,sy+7,5,15,'rgba(0,0,0,.18)');P(sx+sw-5,sy+7,5,15,'rgba(0,0,0,.18)');for(let k=sx+6;k<sx+sw-8;k+=Math.floor((sw-10)/2))P(k,sy+8,1,13,'rgba(0,0,0,.2)');};
  const table=(tx,ty,tw,th,c='#6a4a2c')=>{sh(tx,ty,tw,th);P(tx,ty,tw,th,c);P(tx,ty,tw,1,'rgba(255,230,190,.3)');P(tx,ty+th-1,tw,1,'rgba(0,0,0,.25)');};
  const plant=(px,py)=>{P(px-4,py-2,8,6,'#8a4a2c');E(px,py-6,7,6,'#2f5f2a');E(px-2,py-8,5,4,'#4a8a3a');E(px+3,py-5,3,3,'#69ad52');};
  const tv=(tx,ty)=>{sh(tx,ty,26,6);P(tx,ty,26,6,'#1c1d20');P(tx+1,ty+1,24,3,'#3a5a7a');P(tx+2,ty+1,10,1,'rgba(255,255,255,.35)');};
  const lamp=(lx,ly)=>{P(lx-1,ly,2,8,'#c9a24a');E(lx,ly-1,5,3,'#f0d890');};
  const cx=x+w/2;
  if(type==='living'){
    rug(cx-34,y+34,68,46,pick(['#8a3a2c','#2e4a6a','#5a4a3a']));
    tv(cx-13,y+2);sofa(cx-30,y+60,60,pick(['#5a6a7a','#7a4a3a','#6a5a3a','#4a5a4a']));table(cx-14,y+44,28,10);
    plant(x+14,y+18);if(w>140)plant(x+w-14,y+20);P(x+w-30,y+8,18,4,'#4a3a2c');
    spots.push({x:cx-14,y:y+78,k:'sit'},{x:cx+14,y:y+78,k:'sit'},{x:cx+36,y:y+50,k:'stand'},{x:cx-40,y:y+54,k:'stand'});
  }else if(type==='kitchen'){
    // bancada ao longo da parede: pia, fogão e geladeira
    sh(x+6,y,w-12,12);P(x+6,y,w-12,12,'#d9d6cb');P(x+6,y,w-12,2,'#f2f0e8');P(x+6,y+11,w-12,1,'#8a877c');
    P(x+14,y+3,18,7,'#9aa4aa');P(x+16,y+4,14,5,'#5a6a74');P(x+w*.5-9,y+3,18,7,'#2a2b2e');for(let k=0;k<4;k++)E(x+w*.5-6+(k%2)*8,y+5+Math.floor(k/2)*3,2,1.3,'#8a8c90');
    sh(x+w-24,y,16,20);P(x+w-24,y,16,20,'#e8eaec');P(x+w-24,y,16,2,'#fff');P(x+w-9,y+3,1,14,'#9a9a9a');
    table(cx-18,y+50,36,22,'#a07a4a');for(const [qx,qy] of [[cx-26,y+54],[cx+22,y+54],[cx-6,y+76]])P(qx,qy,8,8,'#6a3a2a');
    P(cx-6,y+58,6,4,'#e8e2d4');E(cx+8,y+60,3,2,'#c0392b');
    spots.push({x:x+w*.5,y:y+26,k:'cook'},{x:cx-24,y:y+64,k:'sit'},{x:cx+24,y:y+64,k:'sit'});
  }else if(type==='bedroom'){
    const bx=x+14,by=y+24;sh(bx,by,46,60);P(bx,by,46,60,'#5a4a3a');P(bx+2,by+2,42,56,'#d8d2c4');P(bx+2,by+22,42,36,pick(['#4a6a8a','#8a4a4a','#5a7a5a']));P(bx+2,by+22,42,1,'rgba(255,255,255,.25)');
    P(bx+5,by+5,16,10,'#f2efe6');P(bx+25,by+5,16,10,'#f2efe6');P(bx+5,by+14,16,1,'rgba(0,0,0,.12)');
    P(bx+52,by+4,12,12,'#6a4a2c');lamp(bx+58,by+3);
    sh(x+w-32,y+4,24,40);P(x+w-32,y+4,24,40,'#6a4a3a');P(x+w-32,y+4,24,2,'#8a6a4a');P(x+w-21,y+6,1,36,'rgba(0,0,0,.3)');
    if(w>150)plant(x+w-16,y+70);
    spots.push({x:bx+23,y:by+30,k:'bed'},{x:bx+70,y:by+44,k:'stand'},{x:x+w-40,y:y+60,k:'stand'});
  }else if(type==='office'){
    sh(x+10,y+8,56,16);P(x+10,y+8,56,16,'#7a5a3a');P(x+10,y+8,56,2,'#a88060');
    sh(x+22,y+2,20,10);P(x+22,y+2,20,10,'#1c1d20');P(x+24,y+3,16,6,'#5a8ac8');P(x+25,y+4,8,1,'rgba(255,255,255,.5)');
    P(x+48,y+10,10,6,'#e8e2d4');P(x+30,y+34,14,12,'#2a2b2e');
    sh(x+w-30,y,24,34);P(x+w-30,y,24,34,'#5a3a22');for(let k=0;k<4;k++){P(x+w-28,y+2+k*8,20,1,'#2a1a10');for(let j=0;j<8;j++)P(x+w-28+j*2.5,y+3+k*8,2,5,['#c0392b','#2f5aa8','#f2c230','#2f8a3a','#e8e2d4'][(j+k)%5]);}
    rug(cx-20,y+60,48,34,'#4a5a6a');
    spots.push({x:x+38,y:y+42,k:'sit'},{x:cx+14,y:y+78,k:'stand'},{x:x+w-40,y:y+50,k:'stand'});
  }else if(type==='laundry'){
    for(let k=0;k<Math.min(4,Math.floor((w-20)/32));k++){const wx=x+10+k*32;sh(wx,y+2,26,26);P(wx,y+2,26,26,'#e8eaec');P(wx,y+2,26,2,'#fff');E(wx+13,y+16,8,8,'#2a2b2e');E(wx+13,y+16,6,6,'#5a7a90');P(wx+3,y+5,5,2,'#c0392b');}
    table(cx-30,y+56,60,18,'#cfc9b8');P(cx-24,y+58,16,8,'#e8e2d4');P(cx-2,y+58,16,8,'#6a8aa8');
    spots.push({x:cx-34,y:y+84,k:'stand'},{x:cx+36,y:y+84,k:'stand'},{x:x+w*.5,y:y+40,k:'stand'});
  }else if(type==='cafe'){
    sh(x+10,y+4,w-20,14);P(x+10,y+4,w-20,14,'#6a4a2c');P(x+10,y+4,w-20,2,'#a88060');P(x+20,y+8,18,5,'#c9ccd0');P(x+50,y+8,6,6,'#e8e2d4');
    for(let k=0;k<Math.floor((w-40)/30);k++){const sx=x+26+k*30;E(sx,y+34,5,3,'#2a2b2e');P(sx-1,y+34,2,8,'#5a5a5a');}
    table(x+16,y+66,24,18,'#a07a4a');table(x+w-48,y+66,24,18,'#a07a4a');plant(x+w-14,y+18);
    spots.push({x:x+26,y:y+36,k:'sit'},{x:x+56,y:y+36,k:'sit'},{x:x+w*.5,y:y+22,k:'stand'},{x:x+w-60,y:y+78,k:'sit'});
  }
  rooms.push({x,y,w,h,type,spots,brick});
}
