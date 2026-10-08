/* Arte vetorial da base do DHPP: móveis, chão, paredes e gente desenhados com curvas e degradês
   (sem pixel), na paleta dos retratos oficiais. As imagens fixas são desenhadas uma vez em alta
   resolução (ART) e guardadas; as pessoas são desenhadas a cada quadro, já animadas. */
export const ART=3;

/* ---------- cor ---------- */
export function hex(c){c=c.replace('#','');return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];}
export function shade(c,k,a){const v=hex(c),f=x=>Math.max(0,Math.min(255,k>1?x+(255-x)*(k-1):x*k))|0;return a==null?`rgb(${f(v[0])},${f(v[1])},${f(v[2])})`:`rgba(${f(v[0])},${f(v[1])},${f(v[2])},${a})`;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

/* ---------- traço ---------- */
export function rr(g,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function vg(g,y0,y1,c0,c1,mid){const gr=g.createLinearGradient(0,y0,0,y1);gr.addColorStop(0,c0);if(mid)gr.addColorStop(0.5,mid);gr.addColorStop(1,c1);return gr;}
function hg(g,x0,x1,c0,c1){const gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,c0);gr.addColorStop(1,c1);return gr;}
function fillR(g,x,y,w,h,r,fill){rr(g,x,y,w,h,r);g.fillStyle=fill;g.fill();}
function line(g,x0,y0,x1,y1,c,w){g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.strokeStyle=c;g.lineWidth=w||0.5;g.stroke();}
function ell(g,x,y,rx,ry,fill){g.beginPath();g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,7);g.fillStyle=fill;g.fill();}
// móvel em caixa: tampo de cima (claro), frente (mais escura), quina com brilho e sombra de contato
function slab(g,x,y,w,top,front,c,r){
  r=r==null?1.2:r;
  fillR(g,x,y+top-1,w,front+1,r,vg(g,y+top,y+top+front,shade(c,0.78),shade(c,0.6)));
  fillR(g,x,y,w,top,r,vg(g,y,y+top,shade(c,1.12),shade(c,0.95)));
  line(g,x+r,y+0.3,x+w-r,y+0.3,shade(c,1.4,0.7),0.5);
  line(g,x+0.6,y+top,x+w-0.6,y+top,shade(c,0.5,0.6),0.5);
  g.fillStyle='rgba(0,0,0,.22)';g.fillRect(x+0.5,y+top+front-1,w-1,1);
}
function canvas(w,h,fn){const c=document.createElement('canvas');c.width=Math.ceil(w*ART);c.height=Math.ceil(h*ART);const g=c.getContext('2d');g.scale(ART,ART);g.lineCap='round';g.lineJoin='round';fn(g);return c;}

/* ---------- monitor de tubo, livros, folhas ---------- */
function crtBack(g,x,y){
  fillR(g,x+2,y+3,18,16,3,vg(g,y,y+19,'#ddd4bd','#b6ad95'));
  fillR(g,x,y,22,8,2,vg(g,y,y+8,'#e9e1cc','#cfc6ae'));
  for(let k=0;k<4;k++)line(g,x+6,y+9+k*2.2,x+16,y+9+k*2.2,'rgba(90,80,60,.35)',0.6);
  fillR(g,x+6,y+19,10,2.4,1,'#a99f87');
}
function crtFront(g,x,y,glow){
  fillR(g,x,y,22,19,2.5,vg(g,y,y+19,'#e6decb','#c3baa2'));
  fillR(g,x+2.5,y+2.5,17,12.5,2,'#101814');
  fillR(g,x+3.5,y+3.5,15,10.5,2.5,vg(g,y+3.5,y+14,glow||'#2e5a4c','#14261f'));
  g.fillStyle='rgba(255,255,255,.16)';rr(g,x+4,y+4,7,3,1.5);g.fill();
  ell(g,x+18,y+16.8,0.8,0.8,'#5ce08a');
  fillR(g,x+6,y+19,10,2.4,1,'#b0a78f');
}
function paper(g,x,y,w,h,rot){g.save();g.translate(x+w/2,y+h/2);g.rotate(rot||0);fillR(g,-w/2,-h/2,w,h,0.4,'#f4f0e4');for(let k=0;k<Math.floor(h/1.6)-1;k++)line(g,-w/2+1,-h/2+1.6+k*1.6,w/2-1-(k*7%4),-h/2+1.6+k*1.6,'rgba(110,100,85,.55)',0.35);g.restore();}
function book(g,x,y,w,h,c){fillR(g,x,y,w,h,0.4,hg(g,x,x+w,shade(c,1.15),shade(c,0.72)));line(g,x+0.3,y+h*0.25,x+w-0.3,y+h*0.25,'rgba(240,220,150,.55)',0.35);line(g,x+0.3,y+h*0.75,x+w-0.3,y+h*0.75,'rgba(240,220,150,.4)',0.35);}
function mug(g,x,y,c){fillR(g,x,y,5,6,1,vg(g,y,y+6,shade(c||'#f3efe4',1.05),shade(c||'#f3efe4',0.82)));g.beginPath();g.arc(x+5.2,y+3,1.6,-1.2,1.2);g.strokeStyle=shade(c||'#f3efe4',0.85);g.lineWidth=0.8;g.stroke();ell(g,x+2.5,y+0.7,2.3,0.8,'#3a2010');}
function phone(g,x,y){fillR(g,x,y+1,10,5,1.2,vg(g,y,y+6,'#2f2f33','#1a1a1d'));fillR(g,x+1,y-0.5,8,2.4,1.2,'#3c3c41');for(let r=0;r<2;r++)for(let k=0;k<3;k++)ell(g,x+3+k*2,y+3+r*1.5,0.45,0.35,'#8a8a90');}
function leaves(g,cx,cy,r,rnd,cols,n){
  cols=cols||['#24461f','#2f5a2a','#3f7a35','#5a9a45','#7cb85a'];
  for(let k=0;k<(n||26);k++){const a=rnd()*Math.PI*2,d=Math.pow(rnd(),0.6)*r,x=cx+Math.cos(a)*d,y=cy+Math.sin(a)*d*0.75,s=2+rnd()*3.2,ang=rnd()*Math.PI;
    const ci=Math.min(cols.length-1,Math.floor((1-(y-cy+r)/(2*r))*cols.length*0.9+rnd()*1.2));g.save();g.translate(x,y);g.rotate(ang);ell(g,0,0,s,s*0.48,cols[Math.max(0,ci)]);g.restore();}
}

/* ---------- fábricas de móveis: [altura acima da pegada, desenho(g,t,fw,fh,B)] ---------- */
export const VFACT={
  desk(o){return [26,(g,t,fw,fh,B)=>{
    const ty=t;
    if(o.v!=='lemos')crtBack(g,3,ty-21);else crtFront(g,3,ty-21,'#2b5a48');
    if(o.v==='renata'){for(let k=0;k<3;k++)book(g,33+k*4.6,ty-12,4.2,12,['#2b4a62','#24506e','#7a2f2f'][k]);paper(g,49,ty-5,9,5,0.05);}
    if(o.v==='denise'){for(let k=0;k<5;k++)paper(g,29,ty-8+k*0.9,13,6,(k-2)*0.03);fillR(g,46,ty-5.5,11,5.5,1,vg(g,ty-5,ty,'#3a3a3e','#1e1e22'));ell(g,49,ty-2.8,1.6,1.6,'#555');ell(g,54,ty-2.8,1.6,1.6,'#555');ell(g,51.5,ty-4.6,0.5,0.5,'#ff5a4a');}
    if(o.v==='lemos'){fillR(g,27,ty+0.6,16,5,0.6,'#c9a24a');line(g,29,ty+2.2,38,ty+2.2,'#6b5320',0.5);mug(g,48,ty-6);}
    phone(g,fw-14,ty-4);
    slab(g,0,ty,fw,7,B-ty-7,'#9a6b42',1);
    // gaveteiro e alças
    fillR(g,fw-24,ty+8.5,21,B-ty-11,1,vg(g,ty+8,B,'#86593a','#6a452b'));for(let k=0;k<2;k++){line(g,fw-24,ty+14.5+k*6,fw-3,ty+14.5+k*6,'rgba(40,24,12,.6)',0.6);fillR(g,fw-16,ty+10.5+k*6,6,1.1,0.5,'#d8b45a');}
    fillR(g,2,ty+8,2.5,B-ty-9,0.8,'#5a3a24');
  }];},
  deskboss(o){return [24,(g,t,fw,fh,B)=>{
    const ty=t;
    crtBack(g,fw-27,ty-21);
    // luminária de banqueiro
    fillR(g,11,ty-4,12,3.4,1.2,vg(g,ty-4,ty,'#e0bc66','#a8822e'));line(g,17,ty-4,17,ty-13,'#c9a24a',1.4);
    g.beginPath();g.moveTo(8,ty-13);g.quadraticCurveTo(17,ty-22,26,ty-13);g.closePath();g.fillStyle=vg(g,ty-21,ty-13,'#3f9a62','#165a34');g.fill();
    ell(g,17,ty-13,9,1.4,'#fff1b8');
    // tampo de mogno, mata-borrão e papéis
    slab(g,0,ty,fw,8,B-ty-8,'#6e3f25',1.4);
    fillR(g,28,ty+1,32,6,0.8,vg(g,ty,ty+7,'#2e5240','#1f3a2c'));paper(g,32,ty+1.6,12,4.2,0.03);
    for(let k=0;k<4;k++)paper(g,46,ty-7+k*1.4,10,6,(k-1.5)*0.04);
    fillR(g,61,ty-5,10,5,0.8,vg(g,ty-5,ty,'#d9c8a0','#b8a47a'));mug(g,22,ty-7);
    // almofadas da frente e friso dourado
    for(const x of [4,34,64]){fillR(g,x,ty+11,fw/3-8,B-ty-15,1,vg(g,ty+11,B-4,'#4e2c18','#3a1f10'));line(g,x+1,ty+11.4,x+fw/3-9,ty+11.4,'rgba(150,100,60,.45)',0.5);}
    fillR(g,fw/2-14,ty+9,28,4,1,vg(g,ty+9,ty+13,'#f0d27a','#a8822e'));
  }];},
  chair(){return [14,(g,t,fw,fh,B)=>{fillR(g,8.5,0,15,18,4,vg(g,0,18,'#4a515a','#262b31'));line(g,11,2,21,2,'rgba(255,255,255,.18)',0.6);fillR(g,6.5,15,19,6,3,vg(g,15,21,'#4a5058','#2c3137'));fillR(g,15,21,2,8,0.8,'#1c1f22');fillR(g,8,28.5,16,2,1,'#1c1f22');ell(g,8.5,31,1.6,1.1,'#0e0f10');ell(g,23.5,31,1.6,1.1,'#0e0f10');}];},
  execchair(){return [18,(g,t,fw,fh,B)=>{fillR(g,6.5,0,19,22,5,vg(g,0,22,'#5a3a30','#2a1812'));for(let y=4;y<19;y+=5)for(let x=10;x<24;x+=5)ell(g,x,y,0.6,0.6,'rgba(20,10,6,.6)');fillR(g,4.5,19,23,6.5,3,vg(g,19,26,'#5a3a30','#3a2218'));fillR(g,3.5,14,3.2,10,1.5,'#2a1812');fillR(g,25.3,14,3.2,10,1.5,'#2a1812');fillR(g,15,25,2,6,0.8,'#1c1f22');fillR(g,8,30.6,16,2,1,'#1c1f22');}];},
  stool(){return [4,(g,t,fw,fh,B)=>{ell(g,16,10,9.5,3.4,'#2b2f36');ell(g,16,9,9,3,vg(g,6,12,'#5a626a','#383e45'));fillR(g,15,12,2,10,0.6,hg(g,15,17,'#b8c1c6','#6a7278'));ell(g,16,23,8,2.2,'#4a5258');}];},
  cadeira(){return [8,(g,t,fw,fh,B)=>{fillR(g,5.5,0,21,16,4,vg(g,0,16,'#6a4636','#3e2419'));for(const x of [10,16,22])ell(g,x,5,0.7,0.7,'#24130c');fillR(g,4,13.5,24,7,3,vg(g,13,21,'#6a4636','#4a2a1c'));fillR(g,6,21,2,7,0.6,'#2a1810');fillR(g,24,21,2,7,0.6,'#2a1810');}];},
  metalchair(){return [8,(g,t,fw,fh,B)=>{g.strokeStyle='#a2abb1';g.lineWidth=1.6;rr(g,8,0.5,16,16,3);g.stroke();fillR(g,10,3,12,8,1.5,vg(g,3,11,'#7a8288','#5a6268'));fillR(g,6,14,20,4,1.5,vg(g,14,18,'#b2bac0','#7d858b'));line(g,7.5,18,7.5,28,'#6a7076',1.6);line(g,24.5,18,24.5,28,'#6a7076',1.6);}];},
  shelf(o){const arq=o.v==='arq';return [arq?40:36,(g,t,fw,fh,B)=>{
    const rnd=mulberry32(o.x*31+o.y*17+fw);
    if(arq){
      const lv=4,sh=(B-6)/lv;
      for(let r=0;r<lv;r++){const y0=2+r*sh;fillR(g,3,y0,fw-6,sh,0,'rgba(20,22,24,.55)');
        let x=4;while(x<fw-10){const bw=10+rnd()*3.5,bh=sh-5-rnd()*1.5;if(x+bw>fw-4)break;if(Math.abs(x+bw/2-fw/2)<3){x+=4;continue;}
          if(rnd()<0.12){book(g,x,y0+sh-3-bh+3,3,bh-3,'#3b5a8a');book(g,x+3.2,y0+sh-3-bh+4,3,bh-4,'#6b8a4a');x+=8;continue;}
          const c=['#b28a58','#a37b49','#c4a06c','#b89463'][Math.floor(rnd()*4)];
          fillR(g,x,y0+sh-3-bh,bw,bh,0.6,vg(g,y0,y0+sh,shade(c,1.08),shade(c,0.82)));fillR(g,x+2,y0+sh-1-bh,bw-4,4,0.4,'#f2eee2');
          line(g,x+3,y0+sh-bh+0.2,x+bw-4,y0+sh-bh+0.2,'rgba(60,55,45,.7)',0.35);ell(g,x+bw/2,y0+sh-5,1.6,0.6,'rgba(60,40,20,.55)');x+=bw+1;}
        fillR(g,3,y0+sh-3,fw-6,3,0.5,vg(g,y0+sh-3,y0+sh,'#c8d0d4','#8a9398'));}
      for(const x of [0,fw/2-1.5,fw-3])fillR(g,x,0,3,B,0.8,hg(g,x,x+3,'#b8c1c6','#6e777d'));
    }else{
      fillR(g,0,0,fw,B,1.2,vg(g,0,B,'#7a5232','#4a2e1a'));fillR(g,2.5,2.5,fw-5,B-9,0.6,'#24170e');
      const lv=3,sh=(B-9)/lv;
      for(let r=0;r<lv;r++){const y0=2.5+r*sh;let x=3.5;
        while(x<fw-6){const bw=2.6+rnd()*2.6,bh=sh-4-rnd()*4;if(rnd()<0.07&&x<fw-14){fillR(g,x+1,y0+sh-6,7,4,1,'#c9a24a');ell(g,x+4.5,y0+sh-8,2.4,2,'#e6c673');x+=10;continue;}
          const c=['#7a2f2f','#2f4a6a','#3a5a3a','#b08a3a','#5a3a5a','#d9d4c7','#8a5a2b','#1f3a5a'][Math.floor(rnd()*8)];
          if(rnd()<0.08){g.save();g.translate(x,y0+sh-2);g.rotate(-0.25);book(g,0,-bh,bw,bh,c);g.restore();x+=bw+2;continue;}
          book(g,x,y0+sh-2-bh,bw,bh,c);x+=bw+0.3;}
        fillR(g,2.5,y0+sh-2,fw-5,2.2,0.4,vg(g,y0+sh-2,y0+sh,'#9a6a40','#5a3820'));}
      fillR(g,0,B-6,fw,6,1,vg(g,B-6,B,'#6a4428','#3a2414'));
    }
  }];},
  filing(){return [30,(g,t,fw,fh,B)=>{fillR(g,4,0,24,B,1.5,hg(g,4,28,'#a6afb5','#6e777d'));const dh=(B-4)/4;for(let k=0;k<4;k++){const y=2+k*dh;fillR(g,5.5,y,21,dh-1.2,1,vg(g,y,y+dh,'#b2bbc0','#89939a'));fillR(g,12,y+2,8,3,0.4,'#f2eee2');fillR(g,13,y+dh-5,6,1.6,0.8,'#3a3f44');}paper(g,7,-3,10,3,0.04);fillR(g,18,-4,8,4,0.6,'#c9a24a');}];},
  plant(o){const tall=o.v==='tall';return [tall?44:30,(g,t,fw,fh,B)=>{
    const rnd=mulberry32(o.x*17+o.y*5+3);
    fillR(g,9,B-13,14,12,2,hg(g,9,23,'#b8683f','#7a3a20'));fillR(g,8,B-14,16,3,1.2,'#c87a4c');ell(g,16,B-13,6.5,1,'#3a2414');
    if(tall){for(let k=0;k<11;k++){const a=-Math.PI/2+(k-5)*0.27+(rnd()-0.5)*0.1,L=17+rnd()*13;g.save();g.translate(16,B-13);g.rotate(a+Math.PI/2);
        g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(2.4,-L*0.5,0.4,-L);g.quadraticCurveTo(-2.2,-L*0.5,0,0);g.fillStyle=vg(g,0,-L,'#2a5226','#6aaa4e');g.fill();line(g,0,0,0.3,-L*0.95,'rgba(20,50,20,.5)',0.3);g.restore();}}
    else leaves(g,16,B-22,10,rnd,null,34);
  }];},
  coffee(){return [30,(g,t,fw,fh,B)=>{
    slab(g,1,B-18,30,3,15,'#8a6040',1);line(g,16,B-14,16,B-2,'rgba(40,24,12,.6)',0.6);
    fillR(g,6,2,16,20,2,vg(g,2,22,'#3a3e44','#1c1e22'));fillR(g,8,5,12,3,1,'#14161a');ell(g,19.5,6.5,0.8,0.8,'#ff5a4a');
    fillR(g,8,13,12,9,2,'rgba(200,225,235,.55)');fillR(g,8,17,12,5,1.5,'#4a2a18');line(g,9,13.5,9,21,'rgba(255,255,255,.6)',0.5);
    mug(g,23,10);fillR(g,2,13,4,8,1,vg(g,13,21,'#efe8d4','#c9c0a8'));
  }];},
  xerox(){return [26,(g,t,fw,fh,B)=>{fillR(g,1,4,30,B-4,2,vg(g,4,B,'#dcd8cd','#a8a498'));fillR(g,1,4,30,7,2,vg(g,4,11,'#c4c0b4','#a6a296'));fillR(g,19,6,10,4,1,'#4a5660');ell(g,21,8,0.7,0.7,'#7fe0a0');ell(g,24,8,0.7,0.7,'#f2c230');paper(g,3,12.5,14,3.5,0);for(const y of [20,29])line(g,2,y,30,y,'rgba(80,76,68,.5)',0.6);fillR(g,14,22,6,2,1,'#6a665c');fillR(g,14,31,6,2,1,'#6a665c');}];},
  board(o,ctx){const found=(ctx&&ctx.found)||0;return [44,(g,t,fw,fh,B)=>{
    fillR(g,6,B-14,3,14,1,'#5a4630');fillR(g,fw-9,B-14,3,14,1,'#5a4630');
    fillR(g,0,2,fw,B-14,2,vg(g,2,B-12,'#7a5434','#4a2e1a'));
    const cx=3,cy=5,cw=fw-6,ch=B-20;fillR(g,cx,cy,cw,ch,1,vg(g,cy,cy+ch,'#c08f5a','#9a6a3c'));
    const rnd=mulberry32(o.x*7+3);for(let k=0;k<160;k++)ell(g,cx+rnd()*cw,cy+rnd()*ch,0.35,0.35,rnd()<0.5?'rgba(110,70,30,.45)':'rgba(230,190,140,.35)');
    fillR(g,6,7,22,6,0.4,'#f6efc9');line(g,8,9.5,22,9.5,'#5a4a2a',0.6);line(g,8,11.5,18,11.5,'#7a6a4a',0.4);
    fillR(g,fw-30,8,24,16,0.5,'#ece6d6');for(let k=0;k<4;k++)line(g,fw-28,11+k*3.2,fw-10-(k*5%7),11+k*3.2,['#7aa8c8','#c9a24a','#7aa8c8','#7aa86a'][k],0.9);
    const ph=[[8,16,'#6f8aa0'],[26,14,'#a0856f'],[44,17,'#7a8f6e'],[60,15,'#9a7a8a'],[78,19,'#8a8f96'],[18,30,'#8a7a6a'],[52,30,'#6a7a8a']];const pins=[];
    ph.forEach(([x,y,c],k)=>{if(x>fw-14)return;g.save();g.translate(x+6.5,y+7.5);g.rotate((k%3-1)*0.06);fillR(g,-6.5,-7.5,13,15,0.4,'#f4f0e4');fillR(g,-5.5,-6.5,11,10,0.3,vg(g,-6.5,3.5,shade(c,1.2),shade(c,0.75)));line(g,-4,5.2,3,5.2,'#777',0.4);g.restore();
      ell(g,x+6.5,y-0.3,1.4,1.4,k<found?'#d6382c':'#3b6aa8');ell(g,x+6.1,y-0.7,0.5,0.5,'rgba(255,255,255,.7)');pins.push([x+6.5,y-0.3]);});
    g.strokeStyle='#c0392b';g.lineWidth=0.7;g.beginPath();pins.slice(0,Math.max(2,found)).forEach(([x,y],k)=>k?g.lineTo(x,y+0.6):g.moveTo(x,y));g.stroke();
    paper(g,34,B-26,16,8,0.02);
  }];},
  bench(){return [26,(g,t,fw,fh,B)=>{
    const ty=t;
    // microscópio
    fillR(g,10,ty-4,16,4,1,vg(g,ty-4,ty,'#3a3e42','#1e2124'));fillR(g,18,ty-20,4,16,1.5,hg(g,18,22,'#4a4f55','#25282c'));
    g.save();g.translate(17,ty-23);g.rotate(-0.35);fillR(g,-2,-4,5,9,1.5,vg(g,-4,5,'#2a2d30','#111'));g.restore();fillR(g,12,ty-9.5,12,2,1,'#6a7680');ell(g,23.5,ty-12.5,1.8,1.8,'#9aa4aa');
    // lupa com braço articulado
    fillR(g,fw-31,ty-3,7,3,1,'#5a6670');g.strokeStyle='#9aa4aa';g.lineWidth=1.2;g.beginPath();g.moveTo(fw-27.5,ty-3);g.lineTo(fw-27,ty-16);g.lineTo(fw-15,ty-17);g.stroke();ell(g,fw-14,ty-14,6.5,3.2,'#2f3438');ell(g,fw-14,ty-14,4.6,2.2,'rgba(190,225,255,.85)');
    // vidraria e evidências
    const glass=(x,w,h,liq)=>{fillR(g,x,ty-h,w,h,1,'rgba(205,230,238,.6)');fillR(g,x,ty-h*0.5,w,h*0.5,1,liq);line(g,x+0.8,ty-h+1,x+0.8,ty-1,'rgba(255,255,255,.8)',0.5);};
    glass(38,6,10,'rgba(110,190,150,.85)');glass(47,5,7,'rgba(220,120,120,.8)');glass(55,3,12,'rgba(130,170,220,.8)');
    paper(g,64,ty-6,18,6,0);fillR(g,84,ty-8,12,8,1,vg(g,ty-8,ty,'#d0a870','#a37b49'));fillR(g,87,ty-6,6,3,0.4,'#f4f0e4');
    slab(g,0,ty,fw,7,B-ty-7,'#a8b2b8',1);
    for(let x=2;x<fw-2;x+=31){fillR(g,x,ty+9,29,B-ty-12,1,vg(g,ty+9,B,'#6a757c','#4a545b'));fillR(g,x+11,ty+13,7,1.2,0.6,'#d0d6d9');}
  }];},
  lightbox(o,ctx){const found=(ctx&&ctx.found)||0;return [22,(g,t,fw,fh,B)=>{
    const ty=t;
    fillR(g,4,0,fw-8,ty+2,2,'#3a454d');fillR(g,6,2,fw-12,ty-2,1.5,vg(g,2,ty,'#f6fbff','#d9e8f4'));
    [[12,5,'#6f8aa0'],[32,4,'#a0856f'],[52,6,'#7a8f6e'],[70,4,'#8a7a6a']].forEach(([x,y,c],k)=>{if(x<fw-20&&k<Math.max(1,found)){fillR(g,x,y,15,11,0.4,'#f4f0e4');fillR(g,x+1,y+1,13,8,0.3,vg(g,y,y+9,shade(c,1.2),shade(c,0.8)));}});
    slab(g,0,ty+2,fw,6,B-ty-8,'#a8b2b8',1);fillR(g,2,ty+10,fw-4,B-ty-13,1,vg(g,ty+10,B,'#6a757c','#4a545b'));fillR(g,fw/2-3,ty+14,6,1.2,0.6,'#d0d6d9');
  }];},
  bagtable(){return [16,(g,t,fw,fh,B)=>{
    const ty=t;
    for(const [x,h,c] of [[4,14,'#b08a5a'],[18,11,'#c4a06c'],[30,15,'#a37b49']]){g.beginPath();g.moveTo(x,ty);g.lineTo(x,ty-h+2);g.lineTo(x+2,ty-h);g.lineTo(x+9,ty-h);g.lineTo(x+11,ty-h+2);g.lineTo(x+11,ty);g.closePath();g.fillStyle=vg(g,ty-h,ty,shade(c,1.12),shade(c,0.8));g.fill();
      fillR(g,x+1.5,ty-h+4,8,4.5,0.4,'#f4f0e4');fillR(g,x,ty-h+1.6,11,1.4,0,'#c0392b');}
    fillR(g,44,ty-7,16,7,0.8,'#ece6d6');line(g,46,ty-4.5,56,ty-4.5,'#c0392b',0.8);
    slab(g,0,ty,fw,6,2,'#aab3b8',1);fillR(g,2,ty+8,2.5,B-ty-8,0.6,'#5a646b');fillR(g,fw-4.5,ty+8,2.5,B-ty-8,0.6,'#5a646b');
  }];},
  locker(){return [36,(g,t,fw,fh,B)=>{fillR(g,2,0,28,B,1.5,hg(g,2,30,'#8b979d','#5e696f'));for(const x of [3.5,17]){fillR(g,x,2,11.5,B-4,1,vg(g,2,B,'#8e9aa1','#6e7a80'));for(let k=0;k<4;k++)fillR(g,x+2,5+k*2.2,7.5,1,0.5,'#4c5459');fillR(g,x+3,14,5,3,0.4,'#f2eee2');fillR(g,x+(x<10?8.5:1),25,1.2,5,0.6,'#d8b45a');}}];},
  counter(o){return [20,(g,t,fw,fh,B)=>{
    const ty=t;
    crtBack(g,10,ty-24);phone(g,38,ty-10);
    fillR(g,0,ty-6,fw,6,1.2,vg(g,ty-6,ty,'#d6b07a','#a87c48'));line(g,1,ty-5.6,fw-1,ty-5.6,'rgba(255,240,200,.7)',0.5);
    // livro de visitas, campainha, porta-canetas
    fillR(g,fw-58,ty-9.5,22,4.4,0.6,'#f6f2e6');line(g,fw-47,ty-9.5,fw-47,ty-5,'#c9c2b3',0.5);for(let k=0;k<2;k++){line(g,fw-56,ty-8.4+k*1.5,fw-49,ty-8.4+k*1.5,'#999',0.4);line(g,fw-45,ty-8.4+k*1.5,fw-38,ty-8.4+k*1.5,'#999',0.4);}fillR(g,fw-60,ty-5.2,26,1,0.4,'#3a5a8a');
    g.beginPath();g.arc(fw-24,ty-6,3,Math.PI,0);g.fillStyle=vg(g,ty-9,ty-6,'#eef0f2','#9aa0a6');g.fill();fillR(g,fw-25,ty-10,2,1.6,0.6,'#d0d4d8');fillR(g,fw-14,ty-12,3,6,1,'#2b2f36');
    // frente com painel do DHPP
    fillR(g,0,ty,fw,B-ty,1,vg(g,ty,B,'#86593a','#5a3a22'));for(let x=6;x<fw;x+=16)line(g,x,ty+2,x,B-5,'rgba(40,24,12,.45)',0.6);
    fillR(g,fw/2-26,ty+3.5,52,12,1.2,vg(g,ty+3,ty+15,'#262a2e','#14171a'));fillR(g,fw/2-26,ty+14.6,52,1,0,'#c9a24a');
    g.font='700 8.5px Rajdhani,"Arial Narrow",sans-serif';g.fillStyle='#eef1f3';g.textAlign='center';g.fillText('D H P P',fw/2,ty+12.3);
    fillR(g,0,B-4,fw,4,0.6,'#3a2414');
  }];},
  sofa(){return [12,(g,t,fw,fh,B)=>{
    fillR(g,3,0,fw-6,15,5,vg(g,0,15,'#4d6176','#2e3c4a'));
    for(const x of [fw/3,fw*2/3])line(g,x,2,x,14,'rgba(20,28,36,.6)',0.7);
    for(let k=0;k<3;k++){const x=4+k*(fw-8)/3;fillR(g,x+0.5,13,(fw-8)/3-1,11,3,vg(g,13,24,'#5d7590','#3e5268'));line(g,x+3,14.2,x+(fw-8)/3-3,14.2,'rgba(255,255,255,.2)',0.6);}
    fillR(g,0,4,6.5,B-8,3,hg(g,0,6.5,'#3a4a5c','#26323e'));fillR(g,fw-6.5,4,6.5,B-8,3,hg(g,fw-6.5,fw,'#3a4a5c','#22303c'));
    fillR(g,4,24,fw-8,B-28,1.5,'#26323e');ell(g,5,B-1.5,1.6,1,'#111');ell(g,fw-5,B-1.5,1.6,1,'#111');
    fillR(g,10,5,14,9,2.5,vg(g,5,14,'#e0bc66','#a8822e'));
  }];},
  cooler(){return [32,(g,t,fw,fh,B)=>{fillR(g,9,0,14,14,4,vg(g,0,14,'rgba(170,215,235,.95)','rgba(95,165,205,.95)'));line(g,11,2.5,11,11,'rgba(255,255,255,.75)',0.8);fillR(g,13,13,6,3,1,'#6a9ab0');fillR(g,7,16,18,B-16,2.5,hg(g,7,25,'#f2f4f5','#c4c9cd'));ell(g,12,23,1.6,1.6,'#2f6aa0');ell(g,20,23,1.6,1.6,'#c0392b');fillR(g,9,27,14,2,1,'#9aa0a6');}];},
  itable(){return [10,(g,t,fw,fh,B)=>{
    const ty=t;
    fillR(g,0,ty,fw,fh-6,1.5,vg(g,ty,ty+fh-6,'#9aa2a8','#727a80'));line(g,1.5,ty+0.6,fw-1.5,ty+0.6,'rgba(255,255,255,.4)',0.6);
    fillR(g,0,ty+fh-7,fw,5,1,vg(g,ty+fh-7,ty+fh-2,'#5a6066','#3a3f44'));fillR(g,4,ty+fh-2,3,B-(ty+fh-2),0.6,'#2a2e32');fillR(g,fw-7,ty+fh-2,3,B-(ty+fh-2),0.6,'#2a2e32');
    // gravador de fita, copos, pasta, cinzeiro e argola presa à mesa
    fillR(g,fw-41,ty+11,15,9,1.4,vg(g,ty+11,ty+20,'#2e2e30','#141416'));fillR(g,fw-39,ty+12.5,11,3.5,0.6,'#4a4a4e');for(const x of [-39,-35,-31])ell(g,fw+x+1.5,ty+17.5,1,1,x===-39?'#c0392b':'#666');
    for(const [x,y] of [[18,6],[26,9]]){fillR(g,x,ty+y,5,8,1,'rgba(225,235,240,.85)');ell(g,x+2.5,ty+y,2.5,0.8,'rgba(255,255,255,.9)');}
    fillR(g,36,ty+22,18,12,0.6,vg(g,ty+22,ty+34,'#e3d4a6','#c4b07a'));line(g,38,ty+25,51,ty+25,'#8a7a50',0.5);line(g,38,ty+28,47,ty+28,'#8a7a50',0.5);
    ell(g,fw-20,ty+28,5,3,'#5a5e62');ell(g,fw-20,ty+27.6,3.4,1.8,'#2a2c2e');
    g.strokeStyle='#c9ced2';g.lineWidth=0.9;g.beginPath();g.ellipse(fw/2,ty+4,2.2,1.4,0,0,7);g.stroke();
  }];},
  boxes(){return [22,(g,t,fw,fh,B)=>{
    for(const [x,y,w,h,c] of [[2,B-14,28,14,'#b08a5a'],[5,B-25,22,11,'#c4a06c']]){fillR(g,x,y,w,h,0.8,vg(g,y,y+h,shade(c,1.1),shade(c,0.8)));line(g,x+0.5,y+0.4,x+w-0.5,y+0.4,shade(c,1.4),0.5);fillR(g,x+w/2-5,y+3,10,5,0.3,'#f4f0e4');line(g,x+w/2-4,y+4.6,x+w/2+3,y+4.6,'#555',0.4);ell(g,x+w/2,y+h-3,2,0.7,'rgba(50,30,15,.6)');}
  }];},
  car(){return [18,(g,t,fw,fh,B)=>vCar(g,{b:'#e8eae6',sh:'#b9beba',dk:'#7d837f'},true)];},
  tree(o){return [48,(g,t,fw,fh,B)=>{const rnd=mulberry32(o.x*13+o.y*7+1);fillR(g,13,B-28,6,28,2,hg(g,13,19,'#8a5e3a','#4a2e1a'));ell(g,16,B-1,6,1.6,'rgba(0,0,0,.25)');leaves(g,16,B-44,18,rnd,['#1e3a1c','#2a5226','#3a6e32','#558f44','#7cb85a'],90);}];},
  flag(){return [44,(g,t,fw,fh,B)=>{fillR(g,15,0,2,B,1,hg(g,15,17,'#f0f2f4','#9aa0a6'));fillR(g,12,B-4,8,4,1,'#6a6e72');ell(g,16,0,2,1.6,'#e8c63a');}];},
  wetsign(){return [16,(g,t,fw,fh,B)=>{g.beginPath();g.moveTo(10,B-3);g.lineTo(14.5,1);g.lineTo(17.5,1);g.lineTo(22,B-3);g.closePath();g.fillStyle=vg(g,0,B,'#ffd23a','#d8a018');g.fill();for(let y=6;y<B-4;y+=7)fillR(g,10+y*0.15,y,12-y*0.3,1.2,0,'rgba(40,30,0,.5)');g.beginPath();g.moveTo(16,10);g.lineTo(19,16);g.lineTo(13,16);g.closePath();g.fillStyle='#2b2b2b';g.fill();fillR(g,6,B-4,20,3,1,'#b8860b');}];}
};
/** Sprite vetorial em alta resolução de um objeto do mapa. */
export function vSprite(o,T,TH,ctx){
  const f=VFACT[o.t];if(!f)return null;
  const fw=o.w*T,fh=o.h*TH,[t,fn]=f(o,ctx),w=fw+2,h=fh+t+2;
  const c=canvas(w,h,g=>{g.translate(1,1);fn(g,t,fw,fh,t+fh);});
  return {c,x:o.x*T-1,y:o.y*TH-t-1,t,w,h};
}

/* ---------- carro visto de cima (viatura parada e trânsito) ---------- */
export function vCar(g,C,pol){
  const w=64,h=80;
  ell(g,32,h-2,30,4,'rgba(0,0,0,.3)');
  for(const [x,y,hh] of [[4.5,11,13],[53,11,13],[3.5,56,17],[54,56,17]])fillR(g,x,y,6.5,hh,2.5,'#121214');
  fillR(g,6,2,52,76,14,hg(g,6,58,shade(C.b,1.08),shade(C.b,0.8)));
  fillR(g,9,4,46,72,12,vg(g,4,76,shade(C.b,1.05),shade(C.b,0.92)));
  fillR(g,10,5,8,3,1.5,'#b0302a');fillR(g,46,5,8,3,1.5,'#b0302a');
  // vidro traseiro, teto, para-brisa
  fillR(g,15,13,34,11,4,vg(g,13,24,'#3a5468','#18242e'));
  fillR(g,15,24,34,20,4,vg(g,24,44,shade(C.b,1.1),shade(C.b,0.9)));line(g,18,26,46,26,'rgba(255,255,255,.55)',0.8);
  if(pol){fillR(g,17,30,30,8,2,'#26282c');fillR(g,18.5,31,13,5,1.5,'#8a1a18');fillR(g,32.5,31,13,5,1.5,'#1a2f7a');}
  g.beginPath();g.moveTo(14,44);g.lineTo(50,44);g.lineTo(52,56);g.lineTo(12,56);g.closePath();g.fillStyle=vg(g,44,56,'#2a3e4e','#16222c');g.fill();
  for(let k=0;k<5;k++)line(g,20+k*2.5,46+k,23+k*2.5,46+k,'rgba(160,195,220,.55)',0.6);
  fillR(g,5,44,4,3,1,shade(C.b,0.7));fillR(g,55,44,4,3,1,shade(C.b,0.7));
  if(pol){fillR(g,9,61,46,3,1,'#1e3f7a');}
  fillR(g,8,68,48,8,3,vg(g,68,76,shade(C.b,0.95),shade(C.b,0.72)));fillR(g,20,69,24,4,1,'#1c1d20');
  fillR(g,9,69,10,4,2,'#f4ecc8');fillR(g,45,69,10,4,2,'#f4ecc8');fillR(g,27,74,10,4,0.6,'#e8e8e2');
}
export function vCarSprite(C,pol){return canvas(64,82,g=>vCar(g,C,pol));}

/* ---------- gente ---------- */
// L: aparência; pose: 'stand'|'walk'|'sit'; view: 'front'|'back'; ph: fase do passo; blink: olhos fechados
// mono: desenha tudo numa cor (sombra projetada e reflexo)
export function vPerson(g,L,pose,view,ph,blink,mono){
  const C=(c,k)=>mono||shade(c,k==null?1:k);
  const sit=pose==='sit',walk=pose==='walk',back=view==='back';
  const sw=walk?Math.sin(ph):0,bob=walk?-Math.abs(Math.cos(ph))*0.8:0;
  g.save();g.translate(0,bob);
  const hip=sit?-10:-17,sh=hip-12.5;
  // pernas
  if(!sit){for(const d of [-1,1]){const s=sw*d*3.2;g.save();g.translate(d*3,hip);g.rotate(s*0.06);
      fillR(g,-2.3,0,4.6,16,1.8,mono||hg(g,-2.3,2.3,shade(L.pants,d<0?1.12:0.92),shade(L.pants,d<0?0.9:0.7)));
      if(!mono){line(g,d*0.4,1,d*0.3,14.6,shade(L.pants,0.6,0.6),0.3);line(g,-2.1,14.4,2.1,14.4,shade(L.pants,0.55,0.7),0.4);}
      g.beginPath();g.moveTo(-2.7,15);g.lineTo(2.4,15);g.quadraticCurveTo(3.6,15.2,3.4,17.2);g.lineTo(-2.9,17.2);g.quadraticCurveTo(-3.2,15.8,-2.7,15);g.fillStyle=mono||vg(g,15,17.2,shade(L.shoes,1.18),shade(L.shoes,0.8));g.fill();
      if(!mono)line(g,-1.6,15.5,1.4,15.5,'rgba(255,255,255,.35)',0.3);g.restore();}}
  else{for(const d of [-1,1])fillR(g,d*3-2.4,hip,4.8,7,1.8,C(L.pants,d<0?1:0.8));for(const d of [-1,1])fillR(g,d*3-2.7,hip+6.5,5.4,2.4,1,C(L.shoes,1));}
  // tronco
  const top=L.top,coat=L.kind==='lab';
  g.beginPath();g.moveTo(-6.6,sh+1.5);g.quadraticCurveTo(-7.2,sh-0.6,-4.6,sh-0.8);g.lineTo(4.6,sh-0.8);g.quadraticCurveTo(7.2,sh-0.6,6.6,sh+1.5);g.lineTo(coat?6.4:5.8,hip+(coat?4:1.5));g.lineTo(coat?-6.4:-5.8,hip+(coat?4:1.5));g.closePath();
  g.fillStyle=mono||hg(g,-7,7,shade(top,1.12),shade(top,0.72));g.fill();
  if(!mono&&!back){
    if(L.kind==='civil'||L.kind==='lab'||L.kind==='campo'){g.beginPath();g.moveTo(-1.8,sh-0.6);g.lineTo(1.8,sh-0.6);g.lineTo(0,sh+5.5);g.closePath();g.fillStyle=L.shirt||'#e8e4da';g.fill();}
    if(L.tie){g.beginPath();g.moveTo(-0.6,sh);g.lineTo(0.6,sh);g.lineTo(0.9,sh+6.6);g.lineTo(0,sh+7.6);g.lineTo(-0.9,sh+6.6);g.closePath();g.fillStyle=L.tie;g.fill();}
    if(L.kind!=='pm'&&L.kind!=='apoio'){g.strokeStyle=shade(top,0.55);g.lineWidth=0.45;g.beginPath();g.moveTo(-2.2,sh-0.4);g.lineTo(-0.5,sh+7.5);g.moveTo(2.2,sh-0.4);g.lineTo(0.5,sh+7.5);g.stroke();}
    if(L.badge)ell(g,-3.6,sh+5.4,0.8,0.9,'#e0bc50');
    if(L.kind==='civil'||L.kind==='campo'){line(g,-4.6,hip-2.6,-1.8,hip-2.6,shade(top,0.55),0.35);line(g,1.8,hip-2.6,4.6,hip-2.6,shade(top,0.55),0.35);ell(g,1.6,sh+0.4,1.2,0.5,shade(top,0.6,0.6));}
    if(L.kind==='apoio'||L.kind==='pm'){fillR(g,-5.8,hip+0.2,11.6,1.2,0.3,'#2a2a2c');fillR(g,-0.8,hip,1.6,1.6,0.3,'#c9ccce');}
    if(L.kind==='pm'){fillR(g,-6.6,hip-1.2,13.2,2,0.6,'#23262b');fillR(g,3.2,hip-3,2.2,4,0.6,'#111');ell(g,-3.4,sh+2.6,0.9,0.9,'#d8b44a');}
    if(L.kind==='lab'){ell(g,-3.6,sh+5.4,1.4,1.3,'#dcdcd4');line(g,0,sh+6,0,hip+3,'rgba(150,150,140,.6)',0.4);}
    if(L.kind==='apoio'){fillR(g,-4,sh+3,8,1.2,0.3,'#e8e8e8');}
  }
  if(back&&!mono){line(g,0,sh+1.5,0,hip+1,shade(top,0.6),0.4);}
  // braços (balançam ao andar)
  const hand=L.gloves?'#f2f2f2':L.skin;
  for(const d of [-1,1]){const a=sit?0.28*d:(walk?-sw*d*0.32:0.05*d);g.save();g.translate(d*5.6,sh+0.6);g.rotate(a);
    const al=sit?8.6:11.2;fillR(g,-1.6,0,3.2,al,1.6,mono||hg(g,-1.6,1.6,shade(top,d<0?1.15:0.92),shade(top,d<0?0.95:0.68)));
    if(!mono&&(L.kind==='civil'||L.kind==='campo'))fillR(g,-1.4,al-1.1,2.8,0.9,0.3,L.shirt||'#e8e4da');
    g.beginPath();g.ellipse(0,al+0.9,1.05,1.25,0,0,7);g.fillStyle=mono||shade(hand,0.95);g.fill();g.restore();}
  // pescoço e cabeça
  fillR(g,-1.3,sh-2.4,2.6,2.8,0.8,C(L.skin,0.85));
  const hy=sh-5.6;
  if(back){
    ell(g,0,hy,3.1,3.6,C(L.hair,1));
    if(!mono){for(let k=-2;k<=2;k++)line(g,k*0.9,hy-3,k*1.05,hy+3,shade(L.hair,1.35,0.4),0.25);ell(g,-3.1,hy+0.4,0.55,1,shade(L.skin,0.9));ell(g,3.1,hy+0.4,0.55,1,shade(L.skin,0.9));}
    if(L.style==='bun')ell(g,0,hy-3.6,2,1.6,C(L.hair,0.9));
    if(L.style==='cap'){fillR(g,-3.5,hy-4,7,3,1.4,C('#23262b',1));}
  }else{
    if(L.style==='bun')ell(g,0,hy-3.9,2.1,1.7,C(L.hair,0.92));
    if(L.style==='long'&&!mono)fillR(g,-3.8,hy-1.5,7.6,9,2.6,shade(L.hair,0.85));
    ell(g,-2.8,hy+0.5,0.6,1,C(L.skin,0.85));ell(g,2.8,hy+0.5,0.6,1,C(L.skin,0.78));
    ell(g,0,hy,2.85,3.5,mono||hg(g,-3,3,shade(L.skin,1.08),shade(L.skin,0.82)));
    if(!mono)ell(g,0,hy+2.6,1.8,0.7,shade(L.skin,0.85,0.35));
    // cabelo
    g.beginPath();
    if(L.style==='curly'){for(let k=0;k<7;k++){const a=Math.PI+k*Math.PI/6;g.moveTo(Math.cos(a)*2.9+1.3,hy-0.6+Math.sin(a)*3.1);g.arc(Math.cos(a)*2.9,hy-0.6+Math.sin(a)*3.1,1.3,0,7);}}
    else if(L.style==='grey'){g.moveTo(-3.1,hy+0.8);g.quadraticCurveTo(-3.4,hy-3.8,0,hy-3.7);g.quadraticCurveTo(3.4,hy-3.8,3.1,hy+0.8);g.quadraticCurveTo(2.4,hy-2.1,0,hy-2.3);g.quadraticCurveTo(-2.4,hy-2.1,-3.1,hy+0.8);}
    else if(L.style==='cap'){}
    else{g.moveTo(-3.15,hy+1);g.quadraticCurveTo(-3.6,hy-4.2,0,hy-3.95);g.quadraticCurveTo(3.6,hy-4.2,3.15,hy+1);g.quadraticCurveTo(2.6,hy-1.6,L.style==='side'?-0.8:0.4,hy-1.9);g.quadraticCurveTo(-2.2,hy-1.8,-3.15,hy+1);}
    g.fillStyle=mono||vg(g,hy-4,hy+1,shade(L.hair,1.25),shade(L.hair,0.85));g.fill();
    if(!mono&&L.style!=='cap'&&L.style!=='curly')for(let k=-2;k<=2;k++){g.beginPath();g.moveTo(k*1.1,hy-3.6);g.quadraticCurveTo(k*1.3+0.4,hy-2.6,k*1.5,hy-1.6);g.strokeStyle=shade(L.hair,1.5,0.35);g.lineWidth=0.25;g.stroke();}
    if(L.style==='cap'){fillR(g,-3.4,hy-4.1,6.8,3,1.4,C('#23262b',1));fillR(g,-3.8,hy-1.6,7.6,1,0.4,C('#16181c',1));ell(g,0,hy-3,0.6,0.6,C('#d8b44a',1));}
    if(!mono){
      // rosto: olhos que piscam, sobrancelhas, nariz e boca
      for(const d of [-1,1]){if(blink)line(g,d*1.15-0.6,hy+0.25,d*1.15+0.6,hy+0.25,'#2a1a12',0.35);else{ell(g,d*1.15,hy+0.15,0.62,0.4,'#f3efe6');ell(g,d*1.15,hy+0.18,0.3,0.32,'#2a1a12');}
        line(g,d*0.55,hy-0.75,d*1.75,hy-0.85,shade(L.hair==='#9a9a9a'?'#6a6a6a':L.hair,0.8),0.32);ell(g,d*1.3,hy+0.8,0.6,0.25,shade(L.skin,0.85,0.5));}
      line(g,0.15,hy+0.4,0.35,hy+1.4,shade(L.skin,0.72),0.25);line(g,-0.8,hy+2.2,0.8,hy+2.2,'#8a4a42',0.35);
      if(L.glasses){g.strokeStyle='#2a2a2a';g.lineWidth=0.25;g.strokeRect(-2,hy-0.3,1.7,1);g.strokeRect(0.3,hy-0.3,1.7,1);line(g,-0.3,hy,0.3,hy,'#2a2a2a',0.25);}
      if(L.style==='bun'&&L.hair!=='#7a4a2a')line(g,-1.6,hy-3.2,0.8,hy-3.5,'rgba(170,165,155,.7)',0.3);
    }
  }
  g.restore();
}
/** Mop da faxineira (desenhado junto da pessoa). */
export function vMop(g,dir,ph,moving){const sw=moving?Math.sin(ph*2)*3:0,mx=dir*9+sw;g.strokeStyle='#8a6a4a';g.lineWidth=1;g.beginPath();g.moveTo(dir*4,-24);g.lineTo(mx,-2);g.stroke();fillR(g,mx-5,-3,10,3,1,'#d8d0c0');}
