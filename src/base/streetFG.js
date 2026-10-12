/* Prédios de baixo (primeiro plano) da Rua do DHPP: vistos de cima, só os telhados — o interior não aparece. A platibanda sobe até
   perto da calçada de cá; no terraço, caixas de ar-condicionado, saídas de ventilação, caixa d'água, casa de escada, claraboias e
   antenas, com a sujeira do tempo (poças, manchas, remendos). Mesma luz da rua: sombras para a direita e para baixo (SUN).
   Pintado uma vez. */
import {FG_TOP,FG_H,SUN,rnd} from './streetArt';

const BRICKS=['#8a3a2c','#8e4434','#9a3f30','#7a5a42','#a0603a','#8e3b2c','#b09a6a','#8e4434'];
const WIDTHS=[300,280,260,320,280,320,360,360];

/** pinta o primeiro plano em g (só telhados); devolve [] (nada de gente lá dentro) */
export function paintForeground(g,W){
  const R=rnd(77);
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  const sh=(x,y,w,h,a=.28)=>P(x+SUN.kx*10,y+SUN.ky*14,w,h,`rgba(20,16,22,${a})`);          // sombra no terraço, para a direita e para baixo
  const k0=W/WIDTHS.reduce((a,b)=>a+b,0);let X=0;
  const ry0=FG_TOP+10;
  WIDTHS.forEach((wd,bi)=>{
    const bw=Math.round(wd*k0),x0=Math.round(X);X+=bw;const brick=BRICKS[bi%BRICKS.length];
    // vão escuro entre os prédios e o terraço de piche com manta, remendos e cascalho
    P(x0,FG_TOP,bw,FG_H,'#1c1814');
    const rx=x0+4,rw=bw-8;
    P(rx,ry0,rw,FG_H-10,bi%3===1?'#4a4d52':'#3e4146');
    for(let y=ry0;y<ry0+FG_H;y+=14){P(rx,y,rw,1,'rgba(0,0,0,.28)');P(rx,y+1,rw,1,'rgba(255,255,255,.05)');}
    for(let i=0;i<rw*FG_H/220;i++)P(rx+R()*rw,ry0+R()*FG_H,1+R()*2,1,R()<.5?'rgba(0,0,0,.18)':'rgba(255,255,255,.08)');
    for(let i=0;i<rw/50;i++){const px=rx+R()*(rw-40),py=ry0+20+R()*(FG_H-60),pw=18+R()*30,ph=10+R()*16;P(px,py,pw,ph,'rgba(20,20,24,.2)');P(px,py,pw,1,'rgba(255,255,255,.06)');}   // remendos de piche
    for(let i=0;i<rw/70;i++)E(rx+20+R()*(rw-40),ry0+30+R()*(FG_H-80),10+R()*18,2.5+R()*3,'rgba(140,165,190,.2)');                                    // poças de chuva
    // platibanda: tampa de pedra com a face de tijolo logo abaixo, e a sombra dela no terraço
    P(x0,FG_TOP,bw,6,'#8f8474');P(x0,FG_TOP,bw,1,'#d8ccb4');P(x0,FG_TOP+5,bw,1,'#5a5248');
    P(rx,FG_TOP+6,rw,4,brick);P(rx,FG_TOP+6,rw,1,'rgba(214,196,176,.25)');
    const gr=g.createLinearGradient(0,ry0,0,ry0+26);gr.addColorStop(0,'rgba(10,8,12,.45)');gr.addColorStop(1,'rgba(10,8,12,0)');g.fillStyle=gr;g.fillRect(rx,ry0,rw,26);
    // equipamentos do terraço
    const ac=(x,y,w=34,h=22)=>{sh(x,y,w,h);P(x,y,w,h,'#c9ccce');P(x,y,w,2,'#eceff0');P(x,y+h-3,w,3,'#8a8e92');for(let k=3;k<w-3;k+=4)P(x+k,y+4,2,h-9,'#9a9ea2');E(x+w*.3,y+h*.5,5,5,'#5a5e62');E(x+w*.7,y+h*.5,5,5,'#5a5e62');};
    const vent=(x,y)=>{sh(x,y,5,16,.22);P(x,y,5,16,'#7a7e82');P(x,y,1,16,'#a8acb0');P(x+4,y,1,16,'#52565a');E(x+2.5,y,4.5,2.4,'#8e9296');E(x+2.5,y-.5,3,1.4,'#2a2c30');};
    const tank=(x,y)=>{sh(x-14,y-26,28,34,.3);P(x-12,y-24,24,30,'#6a4a32');for(let k=-10;k<=10;k+=5)P(x+k,y-24,1,30,'#4a3322');P(x-12,y-24,2,30,'#8a6a4c');E(x,y-24,12,5,'#7a5a3e');E(x,y-24,9,3.5,'#4a3524');P(x-12,y+4,3,6,'#2a2a2c');P(x+9,y+4,3,6,'#2a2a2c');};
    const sky=(x,y,w=30,h=20)=>{sh(x,y,w,h,.22);P(x-1,y-1,w+2,h+2,'#2a2a2e');P(x,y,w,h,'#8ab0c8');for(let k=0;k<w;k+=6)P(x+k,y,1,h,'#2a2a2e');P(x+2,y+2,w*.4,3,'rgba(255,255,255,.4)');P(x,y,w,2,'rgba(0,0,0,.2)');};
    const bulk=(x,y)=>{sh(x,y-14,32,36);P(x,y-14,32,36,brick);for(let yy=y-14;yy<y+22;yy+=4)P(x,yy,32,1,'rgba(214,196,176,.25)');P(x,y-14,32,3,'#8f8474');P(x+11,y+4,10,18,'#2a2b2e');P(x+11,y+4,10,1,'#4a4c52');};
    const ant=(x,y)=>{P(x,y-30,1,30,'#3a3a3e');P(x-6,y-26,13,1,'#3a3a3e');P(x-4,y-20,9,1,'#3a3a3e');P(x-8,y-14,17,1,'#3a3a3e');sh(x,y-4,1,4,.2);};
    const n=Math.max(2,Math.round(rw/110)),slot=rw/n;
    for(let i=0;i<n;i++){const cx=rx+i*slot+slot/2,py=ry0+34+R()*(FG_H-130),t=(bi*3+i)%5;
      if(t===0)ac(cx-17,py);else if(t===1){vent(cx-12,py);vent(cx+8,py+6);}else if(t===2)tank(cx,py+30);else if(t===3)sky(cx-15,py);else bulk(cx-16,py+14);
      if(R()<.5)vent(rx+8+R()*(rw-16),ry0+FG_H-40-R()*40);if(R()<.35)ant(rx+12+R()*(rw-24),ry0+80+R()*80);}
    // fios e canos no terraço
    for(let i=0;i<2;i++){const y=ry0+30+R()*(FG_H-80);P(rx+6,y,rw-12,2,'#2a2a2e');P(rx+6,y,rw-12,1,'#5a5a60');}
    // paredes laterais e as manchas de fuligem na beira
    P(x0,FG_TOP,3,FG_H,'#241a14');P(x0+bw-3,FG_TOP,3,FG_H,'#241a14');
  });
  // o fim do terraço some no escuro
  const gb=g.createLinearGradient(0,FG_TOP+FG_H-60,0,FG_TOP+FG_H);gb.addColorStop(0,'rgba(10,8,8,0)');gb.addColorStop(1,'rgba(10,8,8,.75)');g.fillStyle=gb;g.fillRect(0,FG_TOP+FG_H-60,W,60);
  return [];
}
