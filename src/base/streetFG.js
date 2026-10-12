/* O que fica atrás dos prédios do lado de cá (streetFront.js) no mundo da rua: abaixo da calçada de cá, só o chão escuro das
   passagens de serviço entre os prédios (concreto sujo, poças, sombra). É o que aparece pelos vãos do primeiro plano quando a
   câmera desce ou aproxima; nada de telhado nem interior. Pintado uma vez. */
import {FG_TOP,FG_H,rnd} from './streetArt';

export function paintForeground(g,W){
  const R=rnd(77);
  const P=(x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const E=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();};
  P(0,FG_TOP,W,FG_H,'#3a3733');
  for(let y=FG_TOP;y<FG_TOP+FG_H;y+=26){P(0,y,W,1,'rgba(0,0,0,.25)');P(0,y+1,W,1,'rgba(255,255,255,.04)');}
  for(let x=0;x<W;x+=40)P(x,FG_TOP,1,FG_H,'rgba(0,0,0,.18)');
  for(let i=0;i<W*FG_H/40;i++)P(R()*W,FG_TOP+R()*FG_H,1,1,R()<.6?'rgba(0,0,0,.22)':'rgba(255,255,255,.05)');
  for(let i=0;i<W/40;i++)E(R()*W,FG_TOP+20+R()*(FG_H-40),8+R()*24,2+R()*4,R()<.5?'rgba(20,18,16,.3)':'rgba(120,140,160,.14)');
  for(let i=0;i<W/30;i++)P(R()*W,FG_TOP+R()*FG_H,2+R()*3,1,['#6a5a3a','#5a4a2a','#7a7a70','#e8e2d4'][Math.floor(R()*4)]);
  // a calçada de cá faz sombra para dentro das passagens, e o fundo some no escuro
  const g1=g.createLinearGradient(0,FG_TOP,0,FG_TOP+40);g1.addColorStop(0,'rgba(10,8,8,.45)');g1.addColorStop(1,'rgba(10,8,8,0)');g.fillStyle=g1;g.fillRect(0,FG_TOP,W,40);
  const g2=g.createLinearGradient(0,FG_TOP+60,0,FG_TOP+FG_H);g2.addColorStop(0,'rgba(10,8,8,0)');g2.addColorStop(1,'rgba(10,8,8,.7)');g.fillStyle=g2;g.fillRect(0,FG_TOP+60,W,FG_H-60);
  return [];
}
