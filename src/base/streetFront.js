/* Primeiro plano da Rua do DHPP (direção A, aprovada em 12/10/2026): os prédios do lado de cá, entre a câmera e a rua. A câmera
   "começa" atrás deles: vemos a parede dos fundos do último andar e o telhado recortado contra a rua, mais perto da câmera
   (escala de pixel um passo acima da rua) e deslizando mais rápido que ela (paralaxe). O interior nunca aparece: janelas com
   vidro, cortina, persiana ou escuro, sem gente. Larguras, alturas e vãos diferentes; varal entre alguns prédios.
   Quando algo importante passa atrás (o ônibus parado no ponto, alguém atravessando), o prédio da frente fica translúcido. */
import {rnd,O} from './streetArt';

const BR=['#7a3428','#8a4232','#6e4a36','#93583a','#7e3a2c','#a38e66','#5e4a3e','#8a3a30','#9a6a48'];
const UP=118,DOWN=150,H=UP+DOWN,OX=80;

export function createFront(W,A){
  const R=rnd(311);
  const cv=document.createElement('canvas');cv.width=W+OX*2;cv.height=H;const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const pick=a=>a[Math.floor(R()*a.length)];
  const bl=[],lines=[];
  // quarteirão: larguras e alturas sorteadas, quase sempre com um vão entre um prédio e outro
  for(let x=-60,prev=null;x<W+60;){const gap=prev?(R()<.82?10+Math.floor(R()*34):0):0;let rise=20+Math.floor(R()*42);
    if(prev&&!gap&&Math.abs(rise-prev.rise)<14)rise=prev.rise>42?prev.rise-18:prev.rise+18;
    const w=110+Math.floor(R()*170),b={x:x+gap,w,rise,ty:UP-rise,a:1,ta:1,c:BR[bl.length%BR.length]};
    if(prev&&gap>=12&&gap<=40&&R()<.6)lines.push({b:prev,x0:prev.x+prev.w,x1:b.x,y:Math.max(prev.ty,b.ty)+14+Math.floor(R()*10),cl:[0,1,2].map(()=>pick(['#e8e2d4','#c0392b','#2f5aa8','#f2c230','#6a8a4a','#e8b0b8']))});
    bl.push(b);prev=b;x=b.x+w;}
  for(const b of bl)building(b);
  function building(b){
    const x=b.x+OX,y=b.ty,w=b.w,c=b.c;
    // no telhado (atrás da platibanda): caixa d'água, chaminé, respiros, antena, parabólica, casa de máquinas
    const items=1+Math.floor(R()*3),used=[];
    for(let i=0;i<items;i++){const k=pick(['tank','chim','vent','ant','dish','box','chim']);let ix=x+8+Math.floor(R()*(w-36));if(used.some(u=>Math.abs(u-ix)<22))continue;used.push(ix);
      if(k==='tank'){P(ix+2,y-8,2,8,'#2a2a2c');P(ix+14,y-8,2,8,'#2a2a2c');P(ix+3,y-8,12,1,'#2a2a2c');P(ix,y-26,18,18,'#6a4a32');for(let j=0;j<18;j+=4)P(ix+j,y-26,1,18,'#4a3322');P(ix,y-26,2,18,'#8a6a4c');P(ix,y-20,18,1,'#3a2a1c');P(ix,y-13,18,1,'#3a2a1c');
        g.fillStyle='#3a2e26';g.beginPath();g.moveTo(ix-1,y-26);g.lineTo(ix+9,y-33);g.lineTo(ix+19,y-26);g.closePath();g.fill();P(ix+1,y-27,8,1,'#5a4a3e');}
      else if(k==='chim'){P(ix,y-14,8,14,c);for(let j=y-14;j<y;j+=3)P(ix,j,8,1,'rgba(214,196,176,.25)');P(ix-1,y-16,10,2,'#4a4038');P(ix+6,y-14,2,14,'rgba(0,0,0,.25)');}
      else if(k==='vent'){for(const dx of [0,6]){P(ix+dx,y-9,3,9,'#7a7e82');P(ix+dx,y-9,1,9,'#a8acb0');P(ix+dx-1,y-11,5,2,'#5a5e62');}}
      else if(k==='ant'){P(ix+6,y-34,1,34,'#3a3a3e');P(ix,y-30,13,1,'#3a3a3e');P(ix+2,y-24,9,1,'#3a3a3e');P(ix+3,y-18,7,1,'#3a3a3e');}
      else if(k==='dish'){P(ix+5,y-8,2,8,'#5a5e62');E(ix+6,y-12,7,5,'#d8dadc');E(ix+7,y-12,4,3,'#b4b8bc');P(ix+6,y-13,1,1,'#3a3a3e');}
      else{P(ix,y-12,20,12,'#8f8474');P(ix,y-12,20,2,'#b4a890');P(ix+6,y-9,7,9,'#2a2b2e');P(ix+18,y-12,2,12,'rgba(0,0,0,.25)');}}
    // parede dos fundos, de tijolo, com tom variado e a sujeira escorrida
    P(x,y,w,H-y,c);
    for(let yy=y+8,r=0;yy<H;yy+=3,r++){P(x,yy,w,1,'rgba(214,196,176,.18)');for(let xx=x+(r%2?4:0);xx<x+w;xx+=8){P(xx,yy+1,1,2,'rgba(214,196,176,.12)');const t=R();if(t<.14)P(xx+1,yy+1,7,2,t<.07?'rgba(0,0,0,.1)':'rgba(255,220,190,.08)');}}
    for(let i=0;i<w/14;i++){const sx=x+R()*w,sy=y+10+R()*60,l=10+R()*40;for(let j=0;j<l;j++)P(sx,sy+j,1,1,`rgba(26,18,14,${.16*(1-j/l)})`);}
    // platibanda (tampa de pedra) e friso com dentículos
    P(x-1,y,w+2,3,'#a39684');P(x-1,y,w+2,1,'#e0d4bc');P(x-1,y+3,w+2,1,O);P(x,y+4,w,4,'#8f8474');for(let k=x+2;k<x+w-2;k+=5)P(k,y+8,3,2,'#7a6e5e');P(x,y+10,w,2,'rgba(20,14,10,.3)');
    // janelas dos fundos (só vidro, cortina, persiana ou escuro), algumas com ar-condicionado ou floreira
    const cols=Math.max(2,Math.floor((w-14)/30)),cwid=(w-14)/cols,fire=R()<.45,fc=Math.floor(R()*cols);
    for(let row=0,wy=y+18;wy<H-10;row++,wy+=32)for(let i=0;i<cols;i++){const wx=Math.round(x+7+i*cwid+cwid/2-6);
      P(wx-2,wy-2,16,2,'#cfc6b4');P(wx-1,wy-1,14,20,O);P(wx,wy,12,18,'#e6e0d2');
      const gx=wx+1,gy=wy+1,t=R();const glass=t<.12?'#c99a5a':t<.55?'#3a4652':'#566a7c';P(gx,gy,10,16,glass);
      if(t>=.12){P(gx+6,gy+1,2,6,'rgba(255,255,255,.18)');P(gx+1,gy+1,3,2,'rgba(220,236,248,.3)');}
      const k=R();if(k<.25){P(gx,gy,3,16,pick(['#b85a4a','#d8c8a0','#5a7a9a','#8a6a9a']));P(gx+7,gy,3,16,'rgba(216,200,160,.8)');}else if(k<.45){for(let j=0;j<7;j+=2)P(gx,gy+j,10,1,'rgba(236,232,220,.7)');}
      P(wx,wy+8,12,1,'#e6e0d2');P(wx-2,wy+18,16,2,'#d8d2c4');P(wx-2,wy+20,16,1,'rgba(0,0,0,.3)');
      if(R()<.18){P(wx+1,wy+21,10,6,'#c9ccce');P(wx+1,wy+21,10,1,'#eceff0');for(let j=0;j<4;j++)P(wx+2+j*2,wy+23,1,3,'#9a9ea2');P(wx+3,wy+27,1,4,'rgba(40,60,80,.25)');}
      else if(R()<.15){P(wx-1,wy+20,14,3,'#5a3a24');for(let j=0;j<12;j+=2)P(wx+j,wy+18,2,2,j%4?'#3a6a2e':'#c0392b');}
      // escada de incêndio numa coluna: plataforma de grade, guarda-corpo e a escada para a de baixo
      if(fire&&i===fc){const fx=wx-12,fw=36,py=wy+22;P(fx+3,py+3,fw,2,'rgba(20,14,10,.3)');P(fx,py,fw,2,'#1c1d20');P(fx,py,fw,1,'#3a3c42');for(let j=0;j<fw;j+=3)P(fx+j,py-8,1,8,'#1c1d20');P(fx,py-8,fw,1,'#1c1d20');
        if(py+32<H)for(let j=0;j<30;j+=3)P(fx+fw-10+Math.round(j*8/30),py+2+j,4,1,'#2a2b2e');}}
    // cano de descida e luz de borda (esquerda acesa, direita na sombra)
    const px=x+w-6;P(px,y+12,3,H-y,'#4f4f4c');P(px,y+12,1,H-y,'#7d7d79');for(let yy=y+30;yy<H;yy+=34)P(px-1,yy,5,2,'#2a2a28');
    P(x,y,1,H-y,'rgba(255,236,206,.35)');P(x+w-3,y,3,H-y,'rgba(0,0,0,.28)');
    // primeiro plano: mais escuro embaixo (perto da câmera, longe da luz da rua)
    const gr=g.createLinearGradient(0,y+20,0,H);gr.addColorStop(0,'rgba(12,10,18,.08)');gr.addColorStop(1,'rgba(12,10,18,.6)');g.fillStyle=gr;g.fillRect(x,y,w,H-y);
  }
  /** desenha por cima da rua. V: {s,top,left,vw,cw,ch}; busy: trechos [x0,x1] (mundo) com algo importante atrás */
  function draw(ctx,V,t,dt,busy,RM){
    const s=V.s,fs=s+1,cx=V.left+V.vw/2,ox=V.cw/2,oy=(A-V.top)*s;
    const sx=u=>Math.round((u-cx)*fs+ox),k=1.5*s;
    // o topo de cada prédio fica na mesma altura de tela em qualquer escala (1,5x a escala da rua acima da linha A)
    const y0=b=>Math.round(oy-b.rise*k-b.ty*fs);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
    for(const b of bl){const x0=sx(b.x),x1=sx(b.x+b.w);if(x1<0||x0>V.cw){b.a=b.ta;continue;}
      let ta=1;for(const r of busy){const r0=(r[0]-V.left)*s,r1=(r[1]-V.left)*s;if(r1>x0&&r0<x1){ta=r[2]??.4;break;}}
      b.ta=ta;b.a+=(ta-b.a)*Math.min(1,dt*5);
      ctx.globalAlpha=b.a;ctx.drawImage(cv,b.x+OX,0,b.w,H,x0,y0(b),x1-x0,H*fs);}
    // varais entre prédios, balançando de leve
    ctx.globalAlpha=1;
    for(const l of lines){const x0=sx(l.x0),x1=sx(l.x1);if(x1<0||x0>V.cw)continue;const y=y0(l.b)+l.y*fs,sag=3*fs,sw=RM?0:Math.sin(t*1.3+l.x0)*fs;
      ctx.strokeStyle='rgba(30,30,32,.9)';ctx.lineWidth=Math.max(1,fs/2);ctx.beginPath();ctx.moveTo(x0,y);ctx.quadraticCurveTo((x0+x1)/2,y+sag*2+sw,x1,y);ctx.stroke();
      l.cl.forEach((c,i)=>{const u=(i+1)/(l.cl.length+1),X=x0+(x1-x0)*u,Y=y+4*u*(1-u)*(sag*2+sw);ctx.fillStyle=c;ctx.fillRect(Math.round(X-3*fs/2+(RM?0:Math.sin(t*2+i)*fs*.5)),Math.round(Y),3*fs,4*fs);});}
    ctx.restore();
  }
  return {draw,buildings:bl};
}
