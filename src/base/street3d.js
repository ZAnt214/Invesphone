/* Rua do DHPP em 3D estilizado (protótipo de visual, ligado pelo botão 3D da rua).
   Usa a MESMA simulação da rua 2D (street.js: Lemos, pedestres, trânsito, pombos, entrar no DHPP) e o mesmo
   quarteirão (BUILDINGS, mobiliário, carros); só o desenho muda: prédios com volume, sol fazendo sombra de verdade,
   bonecos em miniatura. Tudo é geometria simples agrupada por material (poucas chamadas de desenho para o iPhone).
   Escala: 1 px da rua 2D = 4 cm; a calçada fica a 15 cm do asfalto; um andar tem 3,2 m. */
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {GY,SIDE,CURB,ROAD,WALK,PARK,LANES,STREET_H,rnd} from './streetArt';
import {BUILDINGS,STREET_W,DHPP,DOOR,CROSS,CSW,SIGNALS,LAMPS,POLES,TREES,PROPS,MANHOLES} from './street';

const M=0.04,X=x=>x*M,Z=y=>(y-GY)*M;
const SWH=0.15,FH=3.2,DEPTH=11;
const ZC=Z(CURB),ZR=Z(ROAD),ZEND=Z(STREET_H)+6;
const WORLD_W=X(STREET_W);

/* ---------- texturas desenhadas em canvas (lisas, sem pixel) ---------- */
function tex(w,h,fn,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');fn(g,w,h);const t=new THREE.CanvasTexture(c);
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
function noise(g,w,h,n,a,R){for(let i=0;i<n;i++){g.fillStyle=`rgba(${R()<.5?0:255},${R()<.5?0:255},${R()<.5?0:255},${a*R()})`;g.fillRect(R()*w,R()*h,1+R()*2,1+R()*2);}}
const TX={};
function textures(){
  const R=rnd(77);
  // tijolo: 1,2 m por textura, fiadas de 6,7 cm; tons claros, a cor vem do prédio
  TX.brick=tex(256,256,(g,w,h)=>{g.fillStyle='#f4f1ec';g.fillRect(0,0,w,h);const rows=18,bh=h/rows,bw=w/6;
    for(let r=0;r<rows;r++)for(let c=-1;c<7;c++){const x=c*bw+(r%2)*bw/2,y=r*bh,v=190+R()*50|0;g.fillStyle=`rgb(${v},${v-8},${v-14})`;g.fillRect(x+1.6,y+1.6,bw-3.2,bh-3.2);
      g.fillStyle='rgba(255,255,255,.16)';g.fillRect(x+1.6,y+1.6,bw-3.2,1.4);g.fillStyle='rgba(0,0,0,.10)';g.fillRect(x+1.6,y+bh-3,bw-3.2,1.4);}
    noise(g,w,h,1800,.12,R);});
  TX.plaster=tex(256,256,(g,w,h)=>{g.fillStyle='#ece8e0';g.fillRect(0,0,w,h);noise(g,w,h,4000,.08,R);});
  TX.siding=tex(256,256,(g,w,h)=>{g.fillStyle='#ebe5da';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=h/6){g.fillStyle='rgba(90,70,45,.22)';g.fillRect(0,y,w,2);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(0,y+2,w,1.5);}
    for(let k=0;k<6;k++){const y=k*h/6;g.fillStyle='rgba(90,70,45,.12)';g.fillRect((k*97)%w,y,2,h/6);}noise(g,w,h,1500,.06,R);});
  TX.stone=tex(256,256,(g,w,h)=>{g.fillStyle='#e6e0d4';g.fillRect(0,0,w,h);const rows=8,bh=h/rows;for(let r=0;r<rows;r++)for(let c=-1;c<4;c++){const bw=w/3,x=c*bw+(r%2)*bw/2,v=205+R()*35|0;g.fillStyle=`rgb(${v},${v-3},${v-10})`;g.fillRect(x+2,r*bh+2,bw-4,bh-4);g.fillStyle='rgba(255,255,255,.2)';g.fillRect(x+2,r*bh+2,bw-4,2);}noise(g,w,h,2500,.1,R);});
  TX.concrete=tex(256,256,(g,w,h)=>{g.fillStyle='#d9d4ca';g.fillRect(0,0,w,h);noise(g,w,h,5000,.07,R);g.fillStyle='rgba(60,54,44,.35)';g.fillRect(0,0,w,2);g.fillRect(0,0,2,h);g.fillStyle='rgba(255,255,255,.35)';g.fillRect(0,2,w,1);g.fillRect(2,0,1,h);
    for(let i=0;i<5;i++){g.fillStyle=`rgba(70,62,52,${.05+R()*.06})`;g.beginPath();g.ellipse(R()*w,R()*h,10+R()*30,6+R()*14,R()*3,0,7);g.fill();}});
  TX.asphalt=tex(512,512,(g,w,h)=>{g.fillStyle='#5a5c62';g.fillRect(0,0,w,h);noise(g,w,h,26000,.16,R);
    for(let i=0;i<6;i++){g.strokeStyle='rgba(25,25,28,.45)';g.lineWidth=2;g.beginPath();let x=R()*w,y=R()*h;g.moveTo(x,y);for(let k=0;k<10;k++){x+=R()*20-6;y+=R()*16-8;g.lineTo(x,y);}g.stroke();}
    for(let i=0;i<5;i++){g.fillStyle=`rgba(20,20,24,${.08+R()*.08})`;g.beginPath();g.ellipse(R()*w,R()*h,20+R()*50,8+R()*20,0,0,7);g.fill();}});
  TX.roof=tex(256,256,(g,w,h)=>{g.fillStyle='#8a8884';g.fillRect(0,0,w,h);noise(g,w,h,6000,.15,R);for(let y=0;y<h;y+=32){g.fillStyle='rgba(0,0,0,.08)';g.fillRect(0,y,w,2);}});
  TX.slate=tex(128,128,(g,w,h)=>{g.fillStyle='#5a5a6a';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=12)for(let x=((y/12)%2)*8;x<w;x+=16){g.fillStyle=`rgb(${80+R()*30|0},${80+R()*30|0},${98+R()*30|0})`;g.beginPath();g.ellipse(x+8,y+8,7,7,0,0,Math.PI);g.fill();}});
  TX.dirt=tex(256,256,(g,w,h)=>{g.fillStyle='#7a6a52';g.fillRect(0,0,w,h);noise(g,w,h,5000,.2,R);for(let i=0;i<220;i++){g.fillStyle=R()<.5?'#5a7a3a':'#7a9a4a';g.fillRect(R()*w,R()*h,2,4+R()*6);}});
  TX.corrug=tex(64,64,(g,w,h)=>{for(let y=0;y<h;y+=8){const gr=g.createLinearGradient(0,y,0,y+8);gr.addColorStop(0,'#c8cacc');gr.addColorStop(.5,'#8e9092');gr.addColorStop(1,'#b0b2b4');g.fillStyle=gr;g.fillRect(0,y,w,8);}});
  TX.fence=tex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='rgba(200,206,212,.9)';g.lineWidth=1.4;for(let k=-64;k<64;k+=10){g.beginPath();g.moveTo(k,0);g.lineTo(k+64,64);g.stroke();g.beginPath();g.moveTo(k+64,0);g.lineTo(k,64);g.stroke();}});
  // fachada genérica dos prédios de fundo e das ruas transversais (4 m x 3,2 m por textura: 2 janelas por andar)
  TX.generic=tex(256,205,(g,w,h)=>{g.fillStyle='#eadbd0';g.fillRect(0,0,w,h);noise(g,w,h,2500,.08,R);for(const x of [36,150]){g.fillStyle='#f6f2ea';g.fillRect(x-4,40,78,110);g.fillStyle='#4f6c88';g.fillRect(x,46,70,98);g.fillStyle='rgba(255,255,255,.25)';g.fillRect(x,46,70,10);g.fillStyle='#f6f2ea';g.fillRect(x,92,70,5);g.fillRect(x+33,46,4,98);}});
  TX.genericLit=tex(256,205,(g,w,h)=>{g.drawImage(TX.generic.image,0,0);g.fillStyle='rgba(255,200,120,.75)';g.fillRect(150,46,70,98);});
  TX.mural=tex(256,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3a7ab8');gr.addColorStop(.45,'#e8a040');gr.addColorStop(1,'#c0392b');g.fillStyle=gr;g.fillRect(0,0,w,h);
    g.fillStyle='#f6e2a8';g.beginPath();g.arc(w*.6,h*.32,40,0,7);g.fill();for(let k=0;k<6;k++){g.fillStyle=['#2f8a3a','#7a3a9a','#f2c230','#e85a9a','#2f5aa8','#1c1d20'][k];g.beginPath();g.moveTo(k*48-20,h);g.quadraticCurveTo(k*48+20,h*.5,k*48+60,h);g.fill();}});
  TX.glow=tex(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  TX.stained=tex(128,128,(g,w,h)=>{g.fillStyle='#1c1622';g.fillRect(0,0,w,h);const c=['#c0392b','#2f5aa8','#f2c230','#2f8a3a','#7a3a9a','#e08a2a'];for(let y=0;y<h;y+=10)for(let x=0;x<w;x+=10){g.fillStyle=c[(x*3+y*7)/10%6|0];g.fillRect(x+1,y+1,8,8);}});
}
function signTex(text,{bg='#1f2328',fg='#f1ece0',w=512,h=64,size=40,sub=null,sp=6}={}){
  return tex(w,h,(g)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,0,w,3);g.fillStyle=fg;g.textBaseline='middle';
    g.font=`700 ${size}px Rajdhani,"Arial Narrow",Arial,sans-serif`;if(g.letterSpacing!==undefined)g.letterSpacing=sp+'px';const tw=g.measureText(text).width;g.fillText(text,(w-tw)/2,sub?h*.4:h/2);
    if(sub){g.font=`600 ${size*.35}px Rajdhani,Arial,sans-serif`;if(g.letterSpacing!==undefined)g.letterSpacing='4px';g.globalAlpha=.7;const sw=g.measureText(sub).width;g.fillText(sub,(w-sw)/2,h*.8);g.globalAlpha=1;}});
}
function dhppSignTex(){return tex(1024,128,(g,w,h)=>{g.fillStyle='#1f2328';g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.14)';g.fillRect(0,0,w,4);g.fillStyle='#e8ecef';g.textBaseline='middle';
  g.font='700 78px Rajdhani,"Arial Narrow",Arial,sans-serif';if(g.letterSpacing!==undefined)g.letterSpacing='22px';g.fillText('DHPP',70,h/2+4);g.fillRect(430,22,4,h-44);
  g.font='600 46px Rajdhani,Arial,sans-serif';if(g.letterSpacing!==undefined)g.letterSpacing='12px';g.fillText('HOMICÍDIOS',470,h*.42);
  g.font='600 20px Rajdhani,Arial,sans-serif';if(g.letterSpacing!==undefined)g.letterSpacing='8px';g.globalAlpha=.65;g.fillText('DEPARTAMENTO',472,h*.78);});}
function flagTex(kind){return tex(128,84,(g,w,h)=>{if(kind==='br'){g.fillStyle='#2f8a3a';g.fillRect(0,0,w,h);g.fillStyle='#f2c230';g.beginPath();g.moveTo(w/2,8);g.lineTo(w-10,h/2);g.lineTo(w/2,h-8);g.lineTo(10,h/2);g.fill();
  g.fillStyle='#2f4f9a';g.beginPath();g.arc(w/2,h/2,18,0,7);g.fill();g.strokeStyle='#e8ecef';g.lineWidth=3;g.beginPath();g.arc(w/2,h/2+16,22,-2.4,-.75);g.stroke();}
  else{g.fillStyle='#1c2a4a';g.fillRect(0,0,w,h);g.fillStyle='#3a4f6a';g.fillRect(0,0,w,4);for(const [y,c] of [[24,'#e8ecef'],[42,'#c9a24a'],[60,'#e8ecef']]){g.fillStyle=c;g.fillRect(28,y-3,72,6);}}});}
function stripeTex(col){return tex(64,64,(g,w,h)=>{for(let x=0;x<w;x+=16){g.fillStyle=col;g.fillRect(x,0,8,h);g.fillStyle='#efe8da';g.fillRect(x+8,0,8,h);}});}

/* ---------- geometria agrupada: cada "bin" vira uma malha só ---------- */
const _c=new THREE.Color(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
const TF=(x,y,z,ry=0,rx=0,rz=0,sx=1,sy=1,sz=1)=>{_e.set(rx,ry,rz);_q.setFromEuler(_e);return new THREE.Matrix4().compose(_p.set(x,y,z),_q,_s.set(sx,sy,sz));};
class Bin{
  constructor(uv){this.uv=uv;this.list=[];}
  add(geo,m,color='#ffffff',uvs=null){let g=geo.index?geo.toNonIndexed():geo.clone();if(m)g.applyMatrix4(m);
    if(!this.uv)g.deleteAttribute('uv');else if(uvs){const a=g.attributes.uv;for(let i=0;i<a.count;i++)a.setXY(i,a.getX(i)*uvs[0]+(uvs[2]||0),a.getY(i)*uvs[1]+(uvs[3]||0));}
    _c.set(color);const n=g.attributes.position.count,c=new Float32Array(n*3);for(let i=0;i<n;i++){c[i*3]=_c.r;c[i*3+1]=_c.g;c[i*3+2]=_c.b;}g.setAttribute('color',new THREE.BufferAttribute(c,3));
    for(const k of Object.keys(g.attributes))if(!['position','normal','color','uv'].includes(k))g.deleteAttribute(k);this.list.push(g);return this;}
  box(color,cx,cy,cz,w,h,d,ry=0,rx=0,rz=0){return this.add(G.box,TF(cx,cy,cz,ry,rx,rz,w,h,d),color);}
  mesh(mat,{cast=true,recv=true}={}){if(!this.list.length)return null;const m=new THREE.Mesh(mergeGeometries(this.list),mat);m.castShadow=cast;m.receiveShadow=recv;this.list=[];return m;}
}
const G={};
function geos(){G.box=new THREE.BoxGeometry(1,1,1);G.plane=new THREE.PlaneGeometry(1,1);G.cyl=new THREE.CylinderGeometry(.5,.5,1,12);G.cyl6=new THREE.CylinderGeometry(.5,.5,1,6);
  G.sph=new THREE.SphereGeometry(.5,14,10);G.ico=new THREE.IcosahedronGeometry(.5,1);G.cone=new THREE.ConeGeometry(.5,1,12);G.pyr=new THREE.ConeGeometry(.5,1,4);G.circle=new THREE.CircleGeometry(.5,24);}
// plano texturizado: uv repetido pelo tamanho do mundo (tile em metros)
function quad(bin,w,h,m,color,tile=[1.2,1.2]){return bin.add(G.plane,new THREE.Matrix4().multiplyMatrices(m,new THREE.Matrix4().makeScale(w,h,1)),color,[w/tile[0],h/tile[1]]);}

/* ---------- o mundo ---------- */
export function createStreet3D(sim,{mode='3d'}={}){
  // px: o mundo 3D desenhado no tamanho de pixel da planta (ampliado sem suavizar); px e hd2d: os bonecos são os da planta (pixel art)
  const PIXEL=mode==='px',SPRITES=mode==='px'||mode==='hd2d';
  textures();geos();
  const scene=new THREE.Scene();
  const B={col:new Bin(false),glass:new Bin(false),lit:new Bin(false),brick:new Bin(true),plaster:new Bin(true),siding:new Bin(true),stone:new Bin(true),
    conc:new Bin(true),asph:new Bin(true),roof:new Bin(true),slate:new Bin(true),dirt:new Bin(true),corr:new Bin(true),gen:new Bin(true),genLit:new Bin(true)};
  const MAT={col:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78}),
    glass:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.06,metalness:.85,envMapIntensity:1.4}),
    lit:new THREE.MeshBasicMaterial({vertexColors:true}),
    brick:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.brick,roughness:.9}),plaster:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.plaster,roughness:.9}),
    siding:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.siding,roughness:.85}),stone:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.stone,roughness:.9}),
    conc:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.concrete,roughness:.95}),asph:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.asphalt,roughness:.92}),
    roof:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.roof,roughness:.95}),slate:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.slate,roughness:.7}),
    dirt:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.dirt,roughness:1}),corr:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.corrug,roughness:.5,metalness:.4}),
    gen:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.generic,roughness:.9}),genLit:new THREE.MeshStandardMaterial({vertexColors:true,map:TX.genericLit,roughness:.9})};
  const extras=[]; // malhas com material próprio (letreiros, bandeiras, vitrais, toldos, cerca, mural)
  const own=(geo,mat,m,{cast=true,recv=true}={})=>{const o=new THREE.Mesh(geo,mat);if(m)o.applyMatrix4(m);o.castShadow=cast;o.receiveShadow=recv;extras.push(o);return o;};
  const R=rnd(91);
  const col=B.col;
  const flags=[]; // bandeiras do DHPP (os panos tremulam no desenho)

  /* janela de guilhotina saindo um pouco da parede: vidro, caixilho, verga, peitoril; acesa ou com cortina */
  function win(cx,y0,w,h,o={}){
    const z=0,fr=o.frame||'#efe9dd',lit=o.lit;
    (lit?B.lit:B.glass).add(G.plane,TF(cx,y0+h/2,z+.02,0,0,0,w,h,1),lit?'#e8c48a':'#4d6b86');
    for(const [x,yy,ww,hh] of [[cx-w/2,y0+h/2,.07,h+.07],[cx+w/2,y0+h/2,.07,h+.07],[cx,y0+h,w,.07],[cx,y0,w,.07],[cx,y0+h/2,w,.05]])col.box(fr,x,yy,z+.05,ww,hh,.08);
    if(o.six){for(const yy of [y0+h*.25,y0+h*.75])col.box(fr,cx,yy,z+.04,w,.03,.04);for(const xx of [cx-w/6,cx+w/6])col.box(fr,xx,y0+h/2,z+.04,.03,h,.04);}
    if(o.arch){for(let k=-5;k<=5;k++){const a=k/5*.9,r=w*.7;col.box(o.brick||'#8e3b2c',cx+Math.sin(a)*r,y0+h+.08+Math.cos(a)*r-r*.62,z+.03,.14,.2,.1,0,0,-a);}}
    else{col.box('#d8d0c0',cx,y0+h+.13,z+.07,w+.3,.2,.14);col.box('#e4dccc',cx,y0+h+.15,z+.12,.16,.26,.06);}
    col.box('#d8d0c0',cx,y0-.05,z+.1,w+.3,.08,.22);
    if(o.curtain&&lit){col.box(o.curtain,cx-w/2+.12,y0+h/2,z+.025,.2,h-.1,.01);col.box(o.curtain,cx+w/2-.12,y0+h/2,z+.025,.2,h-.1,.01);}
    if(o.blind)col.box('#e8e2d0',cx,y0+h-.15-o.blind*.3,z+.025,w-.04,.3+o.blind*.6,.01);
    if(o.shut){for(const sx of [cx-w/2-.26,cx+w/2+.26])col.box(o.shut,sx,y0+h/2,z+.04,.4,h+.05,.05);}
    if(o.ac){col.box('#d9d6cb',cx,y0+.22,z+.26,w*.75,.4,.5);col.box('#a9a69a',cx+w*.2,y0+.22,z+.52,w*.25,.3,.02);}
    if(o.box){col.box('#5a3a24',cx,y0+.06,z+.3,w+.2,.22,.3);for(let k=0;k<6;k++)B.col.add(G.ico,TF(cx-w/2+.1+k*w/5.5,y0+.25,z+.3,0,0,0,.2,.18,.2),['#3a6a2e','#c0392b','#69ad52','#f2c230'][k%4]);}
    if(o.plant)B.col.add(G.ico,TF(cx+w/2-.15,y0+.14,z+.12,0,0,0,.2,.22,.2),'#4a8a3c');
  }
  // cornija de metal saliente com mísulas
  function cornice(x0,w,top,color){col.box(color,x0+w/2,top-.2,.25,w+.04,.32,.5);col.box(color,x0+w/2,top-.42,.12,w,.14,.26);for(let x=x0+.3;x<x0+w-.2;x+=.75)col.box(color,x,top-.55,.17,.12,.3,.3);}
  function roofTop(x0,w,top,d=DEPTH){quad(B.roof,w,d,TF(x0+w/2,top+.001,-d/2,0,-Math.PI/2),'#ffffff',[3,3]);col.box('#9a948a',x0+w/2,top+.12,-.05,w,.25,.12);}
  function walls(bin,x0,w,h,color,tile){quad(bin,w,h,TF(x0+w/2,h/2,0),color,tile);quad(bin,DEPTH,h,TF(x0,h/2,-DEPTH/2,-Math.PI/2),color,tile);quad(bin,DEPTH,h,TF(x0+w,h/2,-DEPTH/2,Math.PI/2),color,tile);}
  // degraus de mármore na frente da porta, com muretas e corrimão
  function stoop(cx){const n=3,sh=.15;for(let k=0;k<n;k++){const d=(n-k)*.32;col.box('#ece8e0',cx,SWH+sh*(k+.5),d/2,1.2,sh,d);}
    for(const s of [-1,1]){col.box('#d8d2c6',cx+s*.68,SWH+.3,.5,.16,.6,1.0);col.box('#1c1d20',cx+s*.68,SWH+.95,.55,.04,.04,1.1,0,-.42);for(let k=0;k<3;k++)col.box('#1c1d20',cx+s*.68,SWH+.75-k*.12,.2+k*.33,.03,.5,.03);}}
  function door(cx,w,h,color){col.box('#d8d0c0',cx,SWH+.45+h/2,.04,w+.4,h+.3,.06);col.box(color,cx,SWH+.45+h/2,.07,w,h,.04);B.glass.add(G.plane,TF(cx,SWH+.45+h+.18,.071,0,0,0,w,.24,1),'#2a3a4a');
    col.box('#d4af37',cx+w*.35,SWH+.45+h*.48,.1,.05,.05,.04);col.box('#e4dccc',cx,SWH+.45+h+.42,.12,w+.6,.12,.3);}

  /* ---------- prédios ---------- */
  const hOf=b=>b.k==='dhpp'?3*FH+.4:b.k==='loft'?6*FH+.6:b.k==='church'?12:(b.fl||3)*FH+.5;
  for(const b of BUILDINGS){
    const x0=X(b.X),w=X(b.w);
    if(b.gap){gap(b,x0,w);continue;}
    const H=hOf(b);
    if(b.k==='dhpp'){dhpp(b,x0,w,H);continue;}
    if(b.k==='loft'){loft(b,x0,w,H);continue;}
    if(b.k==='church'){church(b,x0,w);continue;}
    const tint=b.paint||b.brick;walls(b.paint?B.plaster:B.brick,x0,w,H,tint,b.paint?[2,2]:[1.2,1.2]);roofTop(x0,w,H);
    col.box('#8f8678',x0+w/2,.35,.03,w,.7,.08); // soco de pedra
    const fl=b.fl||3,cols=b.k==='row'?(b.w<90?2:3):Math.max(3,Math.floor(b.w/42)),cw=w/cols;
    for(let L=1;L<fl;L++)for(let i=0;i<cols;i++){
      if(b.mansard&&L===fl-1)continue;if(b.bay&&L===1&&i>0)continue;
      const t=R();win(x0+(i+.5)*cw,L*FH+.85,Math.min(.95,cw*.62),1.55,{six:b.win==='six',arch:b.win==='arch',brick:b.brick,shut:b.shut,lit:t<.3,ac:R()<.2,box:b.boxes&&L===1&&R()<.6,blind:R()<.35?R():0,plant:R()<.2,curtain:['#b85a4a','#d8c39a','#5a7a9a'][Math.floor(R()*3)]});}
    if(b.bay){const bx=x0+cw+.1,bw=w-cw-.35;col.box(b.bay,bx+bw/2,FH+1.6,.35,bw,2.0,.7);col.box(b.bay,bx+bw/2,FH+2.68,.4,bw+.2,.16,.82);col.box(b.bay,bx+bw/2,FH+.52,.3,bw-.2,.18,.6);
      for(let k=0;k<2;k++)B.glass.add(G.plane,TF(bx+bw*(k+.5)/2,FH+1.7,.705,0,0,0,bw/2-.25,1.2,1),'#4d6b86');}
    if(b.escape){const ex=x0+w*.55,ew=Math.min(2.2,w*.6);for(let L=1;L<fl;L++){const y=L*FH+.75;col.box('#2a2b2e',ex,y,.45,ew,.05,.85);col.box('#1c1d20',ex,y+.9,.86,ew,.04,.04);for(let x=-ew/2;x<=ew/2;x+=.25)col.box('#1c1d20',ex+x,y+.45,.86,.025,.9,.025);
      if(L<fl-1)col.box('#2a2b2e',ex,y+FH/2,.45,.06,FH*1.15,.5,0,0,.95);}}
    if(b.spout)col.add(G.cyl,TF(x0+w-.2,H/2,.08,0,0,0,.09,H,.09),'#6a6c66');
    if(b.mansard){const top=fl*FH;const m=new THREE.Matrix4().multiplyMatrices(TF(x0+w/2,top-FH*.45,-.35,0,-.32),new THREE.Matrix4().makeScale(w,FH*1.05,1));B.slate.add(G.plane,m,'#ffffff',[w/1.2,FH/1.2]);
      for(let i=0;i<cols;i++){const cx=x0+(i+.5)*cw;col.box(b.trim||'#e8e2d4',cx,top-FH*.5,.15,.9,1.4,.5);B.glass.add(G.plane,TF(cx,top-FH*.52,.41,0,0,0,.6,1.0,1),'#4d6b86');col.box(b.trim||'#e8e2d4',cx,top-FH*.5+.78,.2,1.05,.14,.6);}
      cornice(x0,w,(fl-1)*FH+.1,b.cor||'#3a2a22');}
    else cornice(x0,w,H,b.cor||'#3a2a22');
    if(b.k==='row'){door(x0+.75,.95,2.1,b.door);stoop(x0+.75);for(let i=1;i<cols;i++)win(x0+(i+.5)*cw,1.25,Math.min(.95,cw*.62),1.55,{six:b.win==='six',arch:b.win==='arch',brick:b.brick,shut:b.shut,lit:R()<.25,blind:R()<.5?R():0,plant:R()<.3});
      col.box('#1a1c20',x0+w-.9,.3,.05,.9,.32,.04);}
    else shop(b,x0,w);
    // chaminés e ar-condicionado no telhado
    const Rb=rnd(b.i*13+7);for(let n=0;n<1+(Rb()<.5);n++){const cx=x0+.4+Rb()*(w-.8);col.box('#7a3a2a',cx,H+.6,-1.5-Rb()*4,.45,1.2,.45);}
    if(Rb()<.6)col.box('#c9c6bb',x0+w*.6,H+.35,-5,1.0,.7,.8);
  }
  function shop(b,x0,w){
    const fr=b.frame||'#3a2e28',band=b.shop==='closed'?'#5a5248':b.band||'#2f5a3a',g0=SWH;
    col.box(fr,x0+w/2,g0+1.5,.05,w,3.0,.1);
    const vx=b.shop==='market'||b.shop==='deli'?x0+w*.42:x0+w*.58,vw=w*.62,dx=b.shop==='market'||b.shop==='deli'?x0+w-.75:x0+.75;
    const interior={deli:'#d8b47a',laundry:'#a9c4d2',tavern:'#9a5a32',barber:'#c4d6e2',pharmacy:'#c6e2d8',closed:'#c8b48c',market:'#d8b47a'}[b.shop]||'#a9c4d2';
    if(b.shop==='closed'){col.box('#c8b48c',vx,g0+1.35,.11,vw,1.9,.01);col.box('#f2f0e8',vx,g0+1.5,.12,1.2,.45,.01);col.box('#c0392b',vx,g0+1.62,.125,1.1,.12,.01);col.box('#8a8c8e',dx,g0+1.2,.12,1.0,2.3,.05);for(let k=0;k<12;k++)col.box('#6a6c6e',dx,g0+.1+k*.19,.15,1.0,.03,.01);}
    else{B.lit.add(G.plane,TF(vx,g0+1.35,.11,0,0,0,vw,1.9,1),interior);B.glass.add(G.plane,TF(dx,g0+1.2,.11,0,0,0,.95,2.2,1),'#3a5068');
      if(b.shop==='laundry')for(let k=0;k<4;k++)col.add(G.circle,TF(vx-vw/2+.45+k*vw/4,g0+.75,.115,0,0,0,.42,.42,1),'#e8eaec');
      if(b.shop==='market'||b.shop==='deli')for(let s=0;s<3;s++)for(let k=0;k<10;k++)col.box(['#c0392b','#f2c230','#2f8a3a','#2f5aa8','#e08a2a'][(k+s)%5],vx-vw/2+.2+k*vw/10,g0+.7+s*.45,.115,.16,.22,.02);}
    col.box(fr,vx,g0+.22,.14,vw+.1,.45,.16);
    for(const px of [x0+.12,x0+w-.12])col.box(fr,px,g0+1.6,.18,.24,3.2,.3);
    // letreiro saliente
    col.box(band,x0+w/2,g0+3.35,.2,w-.5,.6,.4);
    if(b.sign){const t=b.shop==='closed'?signTex(b.sign,{bg:'#5a5248',fg:'rgba(220,210,190,.35)'}):b.shop==='tavern'?signTex(b.sign,{bg:'#1a1416',fg:'#ff9ec0'}):signTex(b.sign,{bg:band,fg:band==='#e8e2d4'?'#7a2a2a':'#f1ece0'});
      own(new THREE.PlaneGeometry(w-.6,.5),new THREE.MeshStandardMaterial({map:t,roughness:.6,emissive:b.shop==='tavern'?'#ff5a8a':'#000',emissiveIntensity:b.shop==='tavern'?.25:0,emissiveMap:b.shop==='tavern'?t:null}),TF(x0+w/2,g0+3.35,.405),{cast:false});}
    if(b.awning){const t=stripeTex(b.awning);t.repeat.set(Math.round(w*2),1);own(new THREE.PlaneGeometry(w-.3,1.2),new THREE.MeshStandardMaterial({map:t,roughness:.8,side:THREE.DoubleSide}),TF(x0+w/2,g0+2.7,.55,0,-1.05));}
    if(b.shop==='barber'){col.add(G.cyl,TF(dx+.75,g0+1.6,.25,0,0,0,.14,1.0,.14),'#e8e2d4');col.add(G.cyl,TF(dx+.75,g0+1.6,.25,0,0,.5,.15,.5,.15),'#c0392b');}
    if(b.shop==='pharmacy'){col.box('#2f8a3a',x0+w-.6,g0+4.3,.5,.7,.7,.12);col.box('#f2f2ea',x0+w-.6,g0+4.3,.57,.14,.5,.02);col.box('#f2f2ea',x0+w-.6,g0+4.3,.57,.5,.14,.02);}
  }
  function dhpp(b,x0,w,H){
    walls(B.siding,x0,w,H,'#c9b59a',[1.2,1.2]);roofTop(x0,w,H);
    col.box('#8c7862',x0+w/2,H-.2,.06,w,.4,.12);col.box('#7a6a52',x0+w/2,.3,.04,w,.6,.08);
    for(const x of [x0+.3,x0+w-.3])col.add(G.cyl,TF(x,H/2,.1,0,0,0,.14,H,.14),'#8a8c86');
    const winD=(cx,y0,ac)=>{B.glass.add(G.plane,TF(cx,y0+.5,.03,0,0,0,.9,.85,1),'#8cb4d4');for(const [x,yy,ww,hh] of [[cx-.47,y0+.5,.08,1.0],[cx+.47,y0+.5,.08,1.0],[cx,y0+.97,1.0,.08],[cx,y0+.02,1.0,.08],[cx,y0+.5,.9,.04],[cx,y0+.5,.04,.9]])col.box('#f2efe6',x,yy,.06,ww,hh,.08);
      col.box('#d8d2c4',cx,y0-.05,.12,1.15,.08,.2);if(ac){col.box('#d9d6cb',cx,y0+.2,.28,.7,.42,.5);col.box('#a9a69a',cx+.15,y0+.2,.535,.3,.3,.02);}};
    for(let L=1;L<3;L++)for(let px=24;px<b.w-40;px+=52)winD(x0+X(px)+.48,L*FH+1.0,R()<.4);
    for(const px of [30,b.w-54])winD(x0+X(px)+.48,1.3,px<b.w/2);
    const cx=x0+w/2;
    // letreiro DHPP | HOMICÍDIOS e a porta de vidro com a soleira dourada
    col.box('#1f2328',cx,3.55,.18,6.6,.95,.3);own(new THREE.PlaneGeometry(6.5,.82),new THREE.MeshStandardMaterial({map:dhppSignTex(),roughness:.5}),TF(cx,3.55,.335),{cast:false});
    col.box('#8f816b',cx,1.4,.04,2.9,2.7,.06);col.box('#2a2b2e',cx,1.35,.08,2.5,2.5,.06);B.glass.add(G.plane,TF(cx,1.35,.115,0,0,0,2.3,2.3,1),'#7aa4c4');col.box('#2a2b2e',cx,1.35,.12,.06,2.3,.02);col.box('#e8c63a',cx,.17,.3,2.6,.04,.5);
    flags.push({x:cx-4.3,kind:'br'},{x:cx+4.3,kind:'dh'});
    for(const f of flags){col.add(G.cyl,TF(f.x,4.3,.45,0,0,0,.07,8.6,.07),'#c9ccce');col.box('#6a6e72',f.x,.3,.45,.3,.3,.3);col.add(G.sph,TF(f.x,8.65,.45,0,0,0,.14,.14,.14),'#e8c63a');}
  }
  function loft(b,x0,w,H){
    const br=b.brick||'#7a3a2a';walls(B.brick,x0,w,H,br,[1.2,1.2]);roofTop(x0,w,H);
    col.box('#c8bea8',x0+w/2,H+.05,.08,w+.1,.3,.3);
    const bays=Math.round(b.w/50),bw=w/bays;
    for(let L=1;L<6;L++){col.box('#c8bea8',x0+w/2,L*FH+.15,.08,w,.18,.16);
      for(let i=0;i<bays;i++){const cx=x0+(i+.5)*bw,ww=bw-.7,hh=2.1,y0=L*FH+.6;const lit=R()<.25;(lit?B.lit:B.glass).add(G.plane,TF(cx,y0+hh/2,.02,0,0,0,ww,hh,1),lit?'#e8c48a':'#5a7a90');
        for(let q=0;q<=3;q++)col.box('#2a2b2e',cx-ww/2+q*ww/3,y0+hh/2,.04,.05,hh,.05);for(let r=0;r<=4;r++)col.box('#2a2b2e',cx,y0+r*hh/4,.04,ww,.05,.05);col.box('#d8d0c0',cx,y0-.06,.1,ww+.2,.1,.2);}}
    for(let i=0;i<=bays;i++)col.box(br,x0+i*bw,H/2,.12,.35,H,.24);
    // anúncio pintado e desbotado
    const gt=tex(512,96,(g,W,Hh)=>{g.clearRect(0,0,W,Hh);g.font='700 64px Rajdhani,Arial,sans-serif';if(g.letterSpacing!==undefined)g.letterSpacing='10px';g.fillStyle='rgba(240,232,210,.5)';const t=b.ghost||'COLD STORAGE',tw=g.measureText(t).width;g.fillText(t,(W-tw)/2,70);
      g.globalCompositeOperation='destination-out';for(let k=0;k<900;k++){g.fillStyle=`rgba(0,0,0,${Math.random()*.7})`;g.fillRect(Math.random()*W,Math.random()*Hh,3,3);}});
    own(new THREE.PlaneGeometry(w-1,1.2),new THREE.MeshStandardMaterial({map:gt,transparent:true,roughness:.9,depthWrite:false}),TF(x0+w/2,H-1.0,.02),{cast:false});
    // doca de carga e portas de enrolar
    col.box('#9a948a',x0+w/2,.5,.5,w,.9,1.0);for(let x=x0+.2;x<x0+w;x+=.4)col.box((x*10|0)%2?'#f2c230':'#1c1d20',x,.93,1.0,.2,.04,.02);
    for(const [dx,open] of [[x0+w*.28,false],[x0+w*.62,true]]){const dw=w*.28;quad(B.corr,dw,open?1.4:2.6,TF(dx,open?3.0:2.3,.03),'#ffffff',[1,.5]);if(open){col.box('#141416',dx,1.6,.02,dw,1.3,.02);for(let k=0;k<3;k++)col.box('#8a6a40',dx-dw/3+k*dw/3,1.3,-.2,.5,.5,.5);}}
  }
  function church(b,x0,w){
    const st='#d6cfc2',tw=2.3,nx=x0+tw,nw=w-tw,eave=9,peak=12;
    walls(B.stone,nx,nw,eave,st,[2.4,2.4]);
    const gs=new THREE.Shape();gs.moveTo(-nw/2,0);gs.lineTo(nw/2,0);gs.lineTo(0,peak-eave);gs.lineTo(-nw/2,0);
    {const sm=MAT.stone.clone();sm.vertexColors=false;sm.color.set(st);sm.map=TX.stone.clone();sm.map.needsUpdate=true;sm.map.repeat.set(1/2.4,1/2.4);own(new THREE.ExtrudeGeometry(gs,{depth:DEPTH,bevelEnabled:false}),sm,TF(nx+nw/2,eave,-DEPTH));}
    const roofL=Math.hypot(nw/2,peak-eave)+.3,ang=Math.atan2(peak-eave,nw/2);for(const s of [-1,1])B.slate.add(G.box,TF(nx+nw/2+s*nw/4,eave+(peak-eave)/2+.08,-DEPTH/2,0,0,-s*ang,roofL,.14,DEPTH+.3),'#ffffff',[roofL/1.2,1]);
    walls(B.stone,x0,tw,17,'#cfc8ba',[2.4,2.4]);col.box('#cfc8ba',x0+tw/2,17.1,-tw/2,tw+.2,.25,tw+.2);
    col.add(G.pyr,TF(x0+tw/2,20,-tw/2,Math.PI/4,0,0,tw*1.35,6,tw*1.35),'#4a4a58');col.box('#c9a24a',x0+tw/2,23.4,-tw/2,.08,.8,.08);col.box('#c9a24a',x0+tw/2,23.5,-tw/2,.4,.08,.08);
    for(let y=4;y<15;y+=4.2)col.box('#1c1622',x0+tw/2,y,.02,.6,1.6,.02);col.add(G.circle,TF(x0+tw/2,13.6,.03,0,0,0,1.0,1.0,1),'#f2efe6');
    // rosácea de vitral e o portal ogival
    const sg=new THREE.MeshStandardMaterial({map:TX.stained,emissive:'#ffffff',emissiveMap:TX.stained,emissiveIntensity:.35,roughness:.3});
    own(new THREE.CircleGeometry(1.1,32),sg,TF(nx+nw/2,7.4,.03),{cast:false});col.add(new THREE.TorusGeometry(1.15,.12,8,32),TF(nx+nw/2,7.4,.05),'#bdb5a6');
    const arch=(w2,h2)=>{const s=new THREE.Shape();s.moveTo(-w2/2,0);s.lineTo(-w2/2,h2-w2*.8);s.quadraticCurveTo(-w2/2,h2,0,h2);s.quadraticCurveTo(w2/2,h2,w2/2,h2-w2*.8);s.lineTo(w2/2,0);return s;};
    for(const [ww,hh,z,c] of [[2.6,4.6,.12,'#bdb5a6'],[2.2,4.2,.16,'#a39a8a'],[1.8,3.8,.2,'#5a3a22']]){const m=own(new THREE.ExtrudeGeometry(arch(ww,hh),{depth:.04,bevelEnabled:false}),MAT.col,TF(nx+nw/2,SWH+.6,z-.04));m.geometry.deleteAttribute('uv');const n=m.geometry.attributes.position.count,cc=new Float32Array(n*3);_c.set(c);for(let i=0;i<n;i++)cc.set([_c.r,_c.g,_c.b],i*3);m.geometry.setAttribute('color',new THREE.BufferAttribute(cc,3));}
    for(const lx of [nx+1.0,nx+nw-1.0]){own(new THREE.ShapeGeometry(arch(.7,2.6)),sg,TF(lx,4.4,.03),{cast:false});}
    for(const bx of [nx+.15,x0+w-.15])col.box('#bdb5a6',bx,eave/2,.25,.4,eave,.5);
    for(let k=0;k<4;k++)col.box('#bdb5a6',nx+nw/2,SWH+.075+k*.15,1.3-k*.3,3.4-k*.25,.15,.6);
  }
  /* aberturas: beco, terreno baldio e rua transversal (com prédios fugindo para o fundo) */
  function gap(b,x0,w){
    if(b.k==='cross'){const rx0=x0+X(CSW),rx1=x0+w-X(CSW),len=60;
      quad(B.asph,rx1-rx0,len,TF((rx0+rx1)/2,.001,-len/2+ZC,0,-Math.PI/2),'#ffffff',[4,4]);
      for(const [a,c] of [[x0,rx0],[rx1,x0+w]]){col.box('#c8c2b6',(a+c)/2,SWH/2,-len/2+ZC,c-a,SWH,len);quad(B.conc,c-a,len,TF((a+c)/2,SWH+.001,-len/2+ZC,0,-Math.PI/2),'#ffffff',[1.6,1.6]);}
      for(let k=0;k<6;k++)col.box('#f2f2ea',rx0+.4+k*(rx1-rx0-.8)/5,.012,1.4,.35,.02,1.6);col.box('#f2f2ea',(rx0+rx1)/2,.012,.2,rx1-rx0,.02,.15);
      // quarteirões dos dois lados da transversal
      for(const side of [0,1]){let z=-1.5;const Rs=rnd(b.i*7+side);while(z>-55){const d=6+Rs()*8,h=7+Rs()*9,bx=side?x0+w:x0-14;const m=new THREE.Matrix4();
        quad(Rs()<.3?B.genLit:B.gen,d,h,TF(side?x0+w:x0,h/2,z-d/2,side?Math.PI/2:-Math.PI/2),['#e8c8b8','#d8b8a8','#f0e0d0','#c8a898'][Math.floor(Rs()*4)],[4,3.2]);
        col.box('#3a2a22',side?x0+w+.15:x0-.15,h,z-d/2,.4,.3,d);z-=d;}}
      // árvores e postes da transversal
      for(let z=-6;z>-50;z-=12){tree(rx1+.5,z,'mid');lampAt(rx0-.4,z-6);}
      return;}
    // beco ou terreno: chão, muro do fundo e as paredes laterais dos vizinhos (as caixas deles já têm lado)
    if(b.k==='lot'){quad(B.dirt,w,DEPTH,TF(x0+w/2,.01,-DEPTH/2,0,-Math.PI/2),'#ffffff',[3,3]);
      for(let k=0;k<5;k++)col.add(G.ico,TF(x0+.6+R()*(w-1.2),.25,-1-R()*8,0,0,0,.6,.4,.6),'#5a7a3a');col.add(new THREE.TorusGeometry(.35,.14,8,16),TF(x0+w*.6,.14,-3,0,Math.PI/2),'#1c1c1e');
      own(new THREE.PlaneGeometry(w,2.2),new THREE.MeshStandardMaterial({map:(()=>{const t=TX.fence.clone();t.needsUpdate=true;t.repeat.set(w*2,4);return t;})(),transparent:true,alphaTest:.3,side:THREE.DoubleSide,roughness:.4,metalness:.6}),TF(x0+w/2,SWH+1.1,-.05));
      for(let x=x0;x<=x0+w+.01;x+=w/3)col.add(G.cyl,TF(x,SWH+1.15,-.05,0,0,0,.07,2.3,.07),'#8a9096');col.box('#e8e2d4',x0+w-1,SWH+1.2,.0,.8,.5,.02);
      own(new THREE.PlaneGeometry(DEPTH-1,9),new THREE.MeshStandardMaterial({map:TX.mural,roughness:.9}),TF(x0+w-.02,4.6,-DEPTH/2,-Math.PI/2),{cast:false});}
    else{quad(B.asph,w,DEPTH,TF(x0+w/2,.01,-DEPTH/2,0,-Math.PI/2),'#cfcfcf',[4,4]);col.box('#2f5a3a',x0+w/2,.6,-6,Math.min(1.6,w*.7),1.2,1.0);
      for(let k=0;k<3;k++)col.add(G.cyl,TF(x0+.4+k*.4,.45,-.5-k*.3,0,0,0,.35,.9,.35),'#2c2c30');}
    col.box('#7a4a3c',x0+w/2,3,-DEPTH,w,6,.3);
  }

  /* ---------- chão: calçada, meio-fio, asfalto, faixas ---------- */
  {const cuts=CROSS.map(c=>[X(c.X+CSW),X(c.X+c.w-CSW)]);let xs=[0];for(const [a,b2] of cuts)xs.push(a,b2);xs.push(WORLD_W);
    for(let i=0;i<xs.length;i+=2){const a=xs[i],c=xs[i+1];if(c<=a)continue;col.box('#c8c2b6',(a+c)/2,SWH/2,ZC/2,c-a,SWH,ZC);quad(B.conc,c-a,ZC,TF((a+c)/2,SWH+.001,ZC/2,0,-Math.PI/2),'#bcb5a8',[1.6,1.6]);
      col.box('#d2ccc0',(a+c)/2,SWH/2,ZC+.1,c-a,SWH+.01,.22);}
    for(const [a,c] of cuts){quad(B.asph,c-a,ZC+.3,TF((a+c)/2,.002,(ZC+.3)/2,0,-Math.PI/2),'#ffffff',[4,4]);for(let k=0;k<6;k++)col.box('#f2f2ea',a+.4+k*(c-a-.8)/5,.012,1.6,.35,.02,1.6);}
    quad(B.asph,WORLD_W+40,ZEND-ZC,TF(WORLD_W/2,0,(ZC+ZEND)/2,0,-Math.PI/2),'#ffffff',[4,4]);
    // sarjeta, linhas das vagas, faixa dupla amarela, faixas de pedestres na rua principal, bueiros
    col.box('#4a4c50',WORLD_W/2,.004,ZC+.4,WORLD_W,.01,.35);
    for(let x=0;x<STREET_W;x+=130)if(!CROSS.some(c=>x>c.X-30&&x<c.X+c.w+30))col.box('#e8e8e0',X(x),.008,Z(ROAD+37),.08,.01,2.2);
    for(const dz of [-.08,.08])col.box('#d8b43a',WORLD_W/2,.008,Z(ROAD+152)+dz,WORLD_W,.01,.08);
    for(const c of CROSS)for(const zx of [X(c.X)+.55,X(c.X+c.w)-.55])for(let z=ZR+.2;z<ZEND-5;z+=.7)col.box('#e8e8e0',zx,.01,z,.9,.01,.35);
    for(const m of MANHOLES)col.add(G.cyl,TF(X(m.x),.01,Z(m.y)-.6,0,0,0,.9,.02,.9),'#3e4044');
    // calçada do outro lado da rua e um muro baixo, para a câmera não ver o vazio
    col.box('#c8c2b6',WORLD_W/2,SWH/2,ZEND-1.5,WORLD_W+40,SWH,3);quad(B.conc,WORLD_W+40,3,TF(WORLD_W/2,SWH+.001,ZEND-1.5,0,-Math.PI/2),'#ffffff',[1.6,1.6]);}

  /* ---------- mobiliário, árvores, postes e fios ---------- */
  function lampAt(x,z){col.add(G.cyl,TF(x,2.2,z,0,0,0,.12,4.4,.12),'#1c1d20');col.add(G.cyl,TF(x,.25,z,0,0,0,.3,.5,.3),'#1c1d20');col.add(G.cyl,TF(x,4.45,z,0,0,0,.3,.12,.3),'#1c1d20');
    B.lit.add(G.sph,TF(x,4.75,z,0,0,0,.42,.55,.42),'#fff6dc');col.add(G.cone,TF(x,5.15,z,0,0,0,.4,.3,.4),'#1c1d20');}
  function tree(x,z,kind){const s=kind==='young'?.55:kind==='mid'?.8:1;col.add(G.cyl6,TF(x,SWH+1.6*s,z,0,0,0,.24*s,3.2*s,.24*s),'#5a3a22');
    const Rt=rnd(Math.round(x*100));for(let k=0;k<6;k++)col.add(G.ico,TF(x+(Rt()-.5)*2.2*s,SWH+(3.6+Rt()*1.4)*s,z+(Rt()-.5)*1.6*s,Rt()*3,0,0,(1.6+Rt())*s,(1.4+Rt()*.8)*s,(1.6+Rt())*s),['#356a2e','#4a8a3c','#3f7a34','#5a9a44'][k%4]);}
  for(const x of LAMPS)lampAt(X(x),ZC-.25);
  for(const t of TREES){const x=X(t.x),z=ZC-.4;tree(x,z,t.kind);col.box('#4a3424',x,SWH+.004,z,1.3,.01,.9);col.box('#8a857a',x,SWH+.002,z,1.42,.006,1.02);
    // grade baixa de ferro: só os pinos e a barra de cima
    if(t.guard){for(let k=0;k<=6;k++)for(const dz of [-.47,.47])col.box('#1c1d20',x-.66+k*.22,SWH+.2,z+dz,.025,.4,.025);for(const dz of [-.47,.47])col.box('#1c1d20',x,SWH+.4,z+dz,1.34,.03,.03);for(const dx of [-.67,.67])col.box('#1c1d20',x+dx,SWH+.4,z,.03,.03,.96);}}
  const poleTop=9.2,poles=[];
  for(const px of POLES){const x=X(px),z=ZC-.2;poles.push(x);col.add(G.cyl6,TF(x,poleTop/2,z,0,0,0,.28,poleTop,.28),'#5a4632');for(const y of [poleTop-.5,poleTop-1.1])col.box('#4a3a2a',x,y,z,2.2,.12,.14);
    for(const dx of [-.9,-.45,.45,.9])col.add(G.cyl6,TF(x+dx,poleTop-.35,z,0,0,0,.08,.2,.08),'#7aa08a');col.add(G.cyl,TF(x+.32,poleTop-2.2,z,0,0,0,.5,.9,.5),'#8a8c8e');
    for(let k=0;k<3;k++)col.box(['#e8e2d4','#f2c230','#c0392b'][k],x,1.8+k*.5,z+.15,.3,.4,.02);}
  // fios em catenária (tubos finos) entre os postes e das pontas até as esquinas
  {const wb=new Bin(false),pts=[X(CROSS[0].X+CROSS[0].w)-.3,...poles,X(CROSS[1].X)+.3];
    for(let i=1;i<pts.length;i++){const a=pts[i-1],c=pts[i];for(const [dy,dx] of [[-.5,-.9],[-.5,-.45],[-.5,.45],[-.5,.9],[-1.1,-.9],[-1.1,.9]]){const ps=[];for(let k=0;k<=12;k++){const u=k/12;ps.push(new THREE.Vector3(a+(c-a)*u+dx,poleTop+dy-Math.sin(u*Math.PI)*.9,ZC-.2));}
      wb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),12,.018,4,false),null,'#1c1d20');}}
    for(const x of poles)for(const b of BUILDINGS){if(b.k!=='row'&&b.k!=='shop')continue;const bx=X(b.X+b.w)-.5;if(Math.abs(bx-x)>7)continue;const ps=[new THREE.Vector3(x+.3,poleTop-1.6,ZC-.2),new THREE.Vector3((x+bx)/2,poleTop-2.4,ZC/2),new THREE.Vector3(bx,hOf(b)-1.5,.1)];wb.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps),10,.015,4,false),null,'#1c1d20');}
    scene.add(wb.mesh(MAT.col,{cast:true,recv:false}));}
  for(const s of SIGNALS){const x=X(s.x),z=ZC-.25;col.add(G.cyl,TF(x,2.4,z,0,0,0,.14,4.8,.14),'#2a3a32');col.box('#e8c63a',x+.3,3.3,z,.35,1.0,.35);for(const [dy,c] of [[.3,'#ff4a3a'],[0,'#3a2a1a'],[-.3,'#1a3a24']])col.add(G.sph,TF(x+.3,3.3+dy,z+.18,0,0,0,.18,.18,.08),c);
    col.box('#1c1d20',x-.25,2.2,z,.35,.35,.3);col.box('#ff8a3a',x-.25,2.2,z+.16,.2,.2,.01);
    col.box('#1f6a3a',x,4.85,z,1.6,.3,.04);own(new THREE.PlaneGeometry(1.55,.27),new THREE.MeshStandardMaterial({map:signTex(s.name,{bg:'#1f6a3a',w:256,h:44,size:30,sp:2}),roughness:.6}),TF(x,4.85,z+.025),{cast:false});}
  const PROP={
    hydrant:(x,z)=>{col.add(G.cyl,TF(x,SWH+.35,z,0,0,0,.28,.7,.28),'#e8c63a');col.add(G.sph,TF(x,SWH+.72,z,0,0,0,.3,.22,.3),'#c9a22a');col.box('#e8c63a',x,SWH+.45,z,.5,.12,.12);},
    can:(x,z)=>{col.add(G.cyl,TF(x,SWH+.5,z,0,0,0,.6,1.0,.6),'#2f3a34');col.add(G.cyl,TF(x,SWH+1.02,z,0,0,0,.66,.06,.66),'#3a4a40');},
    news:(x,z)=>{col.box('#2f5aa8',x,SWH+.7,z,.5,.8,.45);col.box('#1c1d20',x,SWH+.15,z,.4,.3,.3);col.box('#e8e2d4',x,SWH+.8,z+.23,.36,.3,.01);},
    news2:(x,z)=>{col.box('#b8392b',x,SWH+.7,z,.5,.8,.45);col.box('#1c1d20',x,SWH+.15,z,.4,.3,.3);col.box('#e8e2d4',x,SWH+.8,z+.23,.36,.3,.01);},
    bench:(x,z)=>{col.box('#6a4a2a',x,SWH+.45,z,1.9,.06,.45);col.box('#6a4a2a',x,SWH+.8,z-.22,1.9,.3,.05);for(const dx of [-.8,.8])col.box('#1c1d20',x+dx,SWH+.22,z,.06,.45,.4);},
    meter:(x,z)=>{col.add(G.cyl,TF(x,SWH+.6,z,0,0,0,.06,1.2,.06),'#3a3c40');col.box('#7a7e84',x,SWH+1.3,z,.22,.32,.16);col.box('#1c2833',x,SWH+1.33,z+.085,.14,.12,.01);},
    nopark:(x,z)=>{col.add(G.cyl,TF(x,SWH+1.1,z,0,0,0,.06,2.2,.06),'#7a7e84');col.box('#f2f0e8',x,SWH+2.1,z,.45,.6,.03);col.add(new THREE.TorusGeometry(.14,.03,6,16),TF(x,SWH+2.15,z+.02),'#c0392b');},
    busstop:(x,z)=>{col.add(G.cyl,TF(x,SWH+1.3,z,0,0,0,.06,2.6,.06),'#7a7e84');col.box('#2f5aa8',x,SWH+2.4,z,.6,.7,.03);col.box('#f2f0e8',x,SWH+2.45,z+.02,.36,.3,.01);},
    mailbox:(x,z)=>{col.box('#2f4f9a',x,SWH+.75,z,.5,.8,.5);col.add(G.cyl,TF(x,SWH+1.15,z,0,0,Math.PI/2,.5,.5,.5),'#2f4f9a');for(const dx of [-.2,.2])col.box('#1c2a4a',x+dx,SWH+.2,z,.08,.4,.4);},
    bags:(x,z)=>{for(const [dx,dz,s] of [[-.3,0,.6],[.15,.1,.55],[-.05,-.2,.5]])col.add(G.ico,TF(x+dx,SWH+s*.4,z+dz,0,0,0,s,s*.8,s),'#1a1a1c');col.box('#2f5aa8',x+.7,SWH+.45,z,.5,.9,.5);},
    bike:(x,z)=>{for(const dx of [-.45,.45])col.add(new THREE.TorusGeometry(.32,.03,6,18),TF(x+dx,SWH+.34,z),'#1c1d20');col.box('#c0392b',x,SWH+.55,z,.9,.05,.05,0,0,.2);col.box('#c0392b',x-.1,SWH+.45,z,.05,.45,.05,0,0,-.4);col.box('#7a7e84',x,SWH+.45,z-.25,1.1,.9,.05);},
    cone:(x,z)=>{col.add(G.cone,TF(x,SWH+.35,z,0,0,0,.35,.7,.35),'#ff7a2a');col.add(G.cyl,TF(x,SWH+.4,z,0,0,0,.24,.1,.24),'#f2f0e8');col.box('#e85a1a',x,SWH+.02,z,.45,.04,.45);},
    aframe:(x,z)=>{for(const s of [-1,1])col.box('#2a2b2e',x,SWH+.5,z+s*.15,.6,1.0,.04,0,s*.3);},
    planter:(x,z)=>{col.box('#9a948a',x,SWH+.3,z,1.2,.6,.5);for(let k=0;k<6;k++)col.add(G.ico,TF(x-.45+k*.18,SWH+.7,z,0,0,0,.22,.25,.22),['#3a6a2e','#c0392b','#f2c230','#e85a9a'][k%4]);}
  };
  for(const p of PROPS){const f=PROP[p.k];if(f)f(X(p.x),p.y<GY+60?Z(p.y)-.3:ZC-.3);}
  // prédios de fundo atrás do quarteirão e o centro da cidade ao longe
  {const Rb=rnd(5);for(let x=-20;x<WORLD_W+20;){const w=6+Rb()*10,h=10+Rb()*18,z=-DEPTH-2-Rb()*6;quad(Rb()<.3?B.genLit:B.gen,w,h,TF(x+w/2,h/2,z),['#e0d0c4','#d4c4b8','#efe6dc'][Math.floor(Rb()*3)],[4,3.2]);x+=w+.5;}
    for(let x=-60;x<WORLD_W+60;){const w=10+Rb()*20,h=40+Rb()*70,z=-120-Rb()*40;col.box(Rb()<.5?'#a9b6c6':'#9aa8ba',x,h/2,z,w,h,w);x+=w+4+Rb()*20;}}

  for(const k of Object.keys(B)){const m=B[k].mesh(MAT[k]);if(m)scene.add(m);}
  for(const o of extras)scene.add(o);

  /* ---------- coisas que se mexem ---------- */
  function flagMesh(f){const g=new THREE.PlaneGeometry(1.3,.85,14,1);g.translate(.65,0,0);const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({map:flagTex(f.kind),side:THREE.DoubleSide,roughness:.8}));m.position.set(f.x,8.1,.45);m.castShadow=true;scene.add(m);f.mesh=m;f.base=g.attributes.position.array.slice();}
  // pessoas: miniaturas com pernas e braços que balançam no passo
  const pMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65});
  const people=new Map();
  function personModel(look,suit){
    const root=new THREE.Group(),bb=new Bin(false),top=suit?'#26282c':look.top;
    bb.add(new RoundedBoxGeometry(.46,.62,.28,3,.08),TF(0,1.13,0),top);bb.add(G.cyl,TF(0,1.47,0,0,0,0,.12,.1,.12),look.skin);
    bb.add(G.sph,TF(0,1.66,0,0,0,0,.36,.38,.36),look.skin);
    const hair=look.hair||'#2a1d18';
    if(look.style==='cap'){bb.add(G.sph,TF(0,1.74,0,0,0,0,.38,.24,.38),'#2f5a8a');bb.box('#2f5a8a',0,1.73,.17,.28,.04,.18);}
    else if(look.style==='long'){bb.add(G.sph,TF(0,1.72,-.02,0,0,0,.4,.3,.4),hair);bb.box(hair,0,1.5,-.12,.36,.44,.12);}
    else if(look.style==='bun'){bb.add(G.sph,TF(0,1.73,-.02,0,0,0,.39,.28,.39),hair);bb.add(G.sph,TF(0,1.86,-.12,0,0,0,.16,.16,.16),hair);}
    else if(look.style==='curly'){bb.add(G.ico,TF(0,1.76,-.02,0,0,0,.46,.36,.44),hair);}
    else bb.add(G.sph,TF(0,1.74,-.03,0,0,0,.39,.26,.39),look.style==='grey'?'#a8a8a8':hair);
    for(const dx of [-.07,.07])bb.box('#1c1d20',dx,1.66,.175,.04,.05,.02);
    if(suit){bb.box('#f2f0e8',0,1.3,.142,.12,.28,.01);bb.box(look.tie||'#7a2a2a',0,1.24,.147,.05,.3,.01);bb.box('#d4af37',.12,1.2,.142,.05,.06,.01);}
    const body=new THREE.Mesh(bb.list.length?mergeGeometries(bb.list):null,pMat);body.castShadow=true;root.add(body);
    const limb=(len,w,c,c2,y,x,isLeg)=>{const g=new THREE.Group(),lb=new Bin(false);lb.add(new RoundedBoxGeometry(w,len,w*1.1,2,.04),TF(0,-len/2,0),c);lb.add(isLeg?G.box:G.sph,isLeg?TF(0,-len+.04,.05,0,0,0,w*1.05,.09,w*1.6):TF(0,-len-.02,0,0,0,0,w*.95,w*.95,w*.95),c2);
      const m=new THREE.Mesh(mergeGeometries(lb.list),pMat);m.castShadow=true;g.add(m);g.position.set(x,y,0);root.add(g);return g;};
    const legs=[limb(.8,.17,suit?'#1f242b':look.pants,look.shoes||'#222',.84,-.1,true),limb(.8,.17,suit?'#1f242b':look.pants,look.shoes||'#222',.84,.1,true)];
    const arms=[limb(.58,.12,top,look.skin,1.4,-.3,false),limb(.58,.12,top,look.skin,1.4,.3,false)];
    root.userData={legs,arms};root.scale.setScalar(.95);scene.add(root);return root;
  }
  // bonecos de pixel art (os quadros de passo da planta) em pé no cenário, com a sombra redonda no pé, como lá dentro
  const SPW=26/46*1.78,SPH=1.78,spGeo=new THREE.PlaneGeometry(SPW,SPH);spGeo.translate(SPW*(1/26),SPH/2,0);
  const blobGeo=new THREE.CircleGeometry(.42,16),blobMat=new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.26,depthWrite:false});
  const sprites=new Map();
  function frameTex(img){const t=new THREE.CanvasTexture(img);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;}
  function poseSprite(p){let o=sprites.get(p);
    if(!o){const texs=[0,1,2,3].map(i=>frameTex(p.frames[i]));const mat=new THREE.MeshBasicMaterial({map:texs[0],alphaTest:.5,side:THREE.DoubleSide});
      const m=new THREE.Mesh(spGeo,mat),sh=new THREE.Mesh(blobGeo,blobMat);sh.rotation.x=-Math.PI/2;sh.scale.set(1,.42,1);scene.add(m,sh);o={m,sh,texs};sprites.set(p,o);}
    const f=p.moving?Math.floor(p.walk*3.2)%4:0;if(o.m.material.map!==o.texs[f]){o.m.material.map=o.texs[f];}
    o.m.position.set(X(p.x),SWH,Z(p.y));o.m.rotation.x=-PITCH*.6;o.m.scale.x=p.dir<0?-1:1;o.sh.position.set(X(p.x)+.12,SWH+.006,Z(p.y)+.02);}
  function poseP(p,suit){if(SPRITES){poseSprite(p);return;}let m=people.get(p);if(!m){m=personModel(p.look||{skin:'#d9a273',top:'#3b5a7a',pants:'#2b2f36'},suit);people.set(p,m);}
    m.position.set(X(p.x),SWH,Z(p.y));const tgt=p.moving?(p.dir>0?Math.PI/2:-Math.PI/2):(p.dir>0?.6:-.6);m.rotation.y+=(tgt-m.rotation.y)*.25;
    const sw=p.moving?Math.sin(p.walk*Math.PI*2/1.25)*.6:0,{legs,arms}=m.userData;legs[0].rotation.x=sw;legs[1].rotation.x=-sw;arms[0].rotation.x=-sw*.8;arms[1].rotation.x=sw*.8;}
  // carros de brinquedo: carroceria arredondada, cabine de vidro, rodas; viatura com giroflex, táxi com luminoso
  const carMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,metalness:.25});
  const carGeo={};
  function carModel(k){if(carGeo[k.id])return carGeo[k.id];const b=new Bin(false),L=X(k.w)*.95,W=1.8,c=k.body;
    if(k.bus){b.add(new RoundedBoxGeometry(L,2.6,2.4,3,.2),TF(0,1.6,0),c);b.box('#2a3a4a',0,2.05,0,L-.6,.8,2.42);b.box('#2e5a8a',0,1.2,0,L,.25,2.42);b.box('#1c1d20',L/2-.3,2.6,0,.1,.3,1.4);}
    else{const van=k.id.startsWith('van'),pick=k.id.startsWith('pickup');
      b.add(new RoundedBoxGeometry(L,.62,W,3,.16),TF(0,.62,0),c);
      const cl=van?L*.8:pick?L*.38:L*.52,cx=van?-L*.06:pick?L*.08:-L*.04,ch=van?.9:.55;
      // cabine da cor da carroceria, com os vidros (laterais, para-brisa e vigia) por fora
      b.add(new RoundedBoxGeometry(cl,ch,W*.86,3,.12),TF(cx,.9+ch/2,0),c);
      const gl='#22303e',wl=van?cl*.25:cl*.8,wx=van?cx+cl*.33:cx;
      for(const sz of [-1,1])b.box(gl,wx,.92+ch*.52,sz*W*.432,wl,ch*.58,.02);
      b.box(gl,cx+cl/2+.005,.92+ch*.5,0,.02,ch*.62,W*.72);if(!van)b.box(gl,cx-cl/2-.005,.92+ch*.5,0,.02,ch*.6,W*.72);
      if(!van&&!pick)for(const sz of [-1,1])b.box(c,cx,.92+ch*.52,sz*W*.434,.06,ch*.6,.025);
      if(pick)b.box('#2a2b2e',-L*.28,.95,0,L*.36,.06,W*.8);
      b.box('#fff2c0',L/2-.02,.7,.55,.05,.14,.3);b.box('#fff2c0',L/2-.02,.7,-.55,.05,.14,.3);b.box('#c0392b',-L/2+.02,.72,.6,.05,.14,.28);b.box('#c0392b',-L/2+.02,.72,-.6,.05,.14,.28);
      b.box('#cfd3cf',L/2,.42,0,.08,.14,W*.9);b.box('#cfd3cf',-L/2,.42,0,.08,.14,W*.9);
      if(k.pol){b.box('#1e3f7a',0,.6,0,L*.98,.12,W+.01);b.box('#2a2b2e',cx,.92+ch+.04,0,.3,.08,1.1);b.box('#c0392b',cx,.92+ch+.1,.3,.28,.12,.45);b.box('#2f5aa8',cx,.92+ch+.1,-.3,.28,.12,.45);}
      if(k.taxi){b.box('#1c1d20',cx,.92+ch+.1,0,.5,.18,.25);b.box('#f6eccc',cx,.92+ch+.1,.13,.42,.12,.01);for(let x=-L/2+.2;x<L/2-.2;x+=.2)b.box('#1c1d20',x,.75,W/2+.005,.1,.06,.01);}}
    const wr=k.bus?.5:.34;for(const dx of [-L*.32,L*.32])for(const dz of [-(k.bus?1.2:W/2)+.08,(k.bus?1.2:W/2)-.08]){b.add(G.cyl,TF(dx,wr,dz,0,Math.PI/2,0,wr*2,.26,wr*2),'#141416');b.add(G.cyl,TF(dx,wr,dz+Math.sign(dz)*.135,0,Math.PI/2,0,wr*1.1,.02,wr*1.1),'#9aa0a6');}
    const g=mergeGeometries(b.list);carGeo[k.id]=g;return g;}
  const carMeshes=new Map();
  function poseCar(k,x,z,dir){let m=carMeshes.get(k);if(!m){m=new THREE.Mesh(carModel(k.kind),carMat);m.castShadow=true;m.receiveShadow=true;scene.add(m);carMeshes.set(k,m);}
    const L=X(k.kind.w);m.position.set(X(x)+L/2,0,z);m.rotation.y=dir<0?Math.PI:0;}
  // pombos
  const birdGeo=(()=>{const b=new Bin(false);b.add(G.sph,TF(0,.14,0,0,0,0,.26,.16,.14),'#8a9098');b.add(G.sph,TF(.12,.24,0,0,0,0,.1,.1,.1),'#4f5a62');b.box('#c97a3a',.18,.23,0,.04,.02,.02);return mergeGeometries(b.list);})();
  const birdMeshes=sim.birds.map(()=>{const m=new THREE.Mesh(birdGeo,pMat);m.castShadow=true;scene.add(m);return m;});
  // vapor do bueiro e o losango amarelo da porta
  const steam=[];{const mat=new THREE.SpriteMaterial({map:TX.glow,transparent:true,depthWrite:false,opacity:.4});for(const m of MANHOLES.filter(m=>m.steam))for(let i=0;i<7;i++){const s=new THREE.Sprite(mat.clone());scene.add(s);steam.push({s,m,i});}}
  const marker=new THREE.Mesh(new THREE.OctahedronGeometry(.32,0),new THREE.MeshStandardMaterial({color:'#f2c230',emissive:'#f2a020',emissiveIntensity:.5,roughness:.4}));marker.scale.set(1,1.3,.4);scene.add(marker);
  for(const f of flags)flagMesh(f);

  /* ---------- luz, céu, câmera ---------- */
  const renderer=new THREE.WebGLRenderer({antialias:!PIXEL,powerPreference:'high-performance'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setPixelRatio(1);
  const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.45;
  scene.background=tex(4,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#7fa4cc');gr.addColorStop(.6,'#c9d6e2');gr.addColorStop(1,'#f0d8b8');g.fillStyle=gr;g.fillRect(0,0,w,h);});
  scene.fog=new THREE.Fog('#d6dbe0',60,190);
  scene.add(new THREE.HemisphereLight('#e4ecf6','#8a7a68',.7));
  const sun=new THREE.DirectionalLight('#fff0d8',2.6);sun.castShadow=true;const mobile=/iPhone|iPad|Android/i.test(navigator.userAgent);
  sun.shadow.mapSize.set(mobile?1536:2048,mobile?1536:2048);Object.assign(sun.shadow.camera,{left:-26,right:26,top:20,bottom:-20,near:1,far:90});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;
  scene.add(sun,sun.target);
  const cam=new THREE.PerspectiveCamera(30,16/9,.5,400);
  const PITCH=27*Math.PI/180,VIEW_W=31;let camX=null,lastSize='';
  function frameCam(cw,ch){const a=cw/ch;cam.aspect=a;const vf=cam.fov*Math.PI/180,hf=2*Math.atan(Math.tan(vf/2)*a);
    const dist=Math.max(16,(VIEW_W/2)/Math.tan(hf/2));const lx=X(sim.lemos.x),half=(VIEW_W/2);
    const want=Math.min(Math.max(lx,half),WORLD_W-half);camX=camX==null?want:camX+(want-camX)*.12;
    let tx=camX;const ty=3.6,tz=3.4;if(PIXEL&&lastSize){const ph=parseInt(lastSize.split('x')[1]),pw=2*dist*Math.tan(vf/2)/ph;tx=Math.round(tx/pw)*pw;}cam.position.set(tx,ty+Math.sin(PITCH)*dist,tz+Math.cos(PITCH)*dist);cam.lookAt(tx,ty,tz);cam.updateProjectionMatrix();
    sun.position.set(tx-16,26,tz+14);sun.target.position.set(tx+2,0,tz-3);}

  let out=null,lastT=0;
  function draw(ctx,cw,ch,rs,showMarker){
    // resolução interna limitada (o iPhone tem tela de 3x): desenha menor e amplia
    const ps=PIXEL?Math.max(1,rs*(sim.zoom?sim.zoom():1)):0,sc=PIXEL?1/ps:Math.min(1,1600/cw),w=Math.max(2,Math.round(cw*sc)),h=Math.max(2,Math.round(ch*sc)),key=w+'x'+h;
    if(key!==lastSize){lastSize=key;renderer.setSize(w,h,false);}
    frameCam(cw,ch);
    const t=sim.t,dt=Math.max(0,t-lastT);lastT=t;
    poseP(sim.lemos,true);for(const p of sim.peds)poseP(p,false);
    for(const k of sim.cars){const L=LANES[k.lane];poseCar(k,k.x,Z(L.y-34),L.dir);}
    for(const p of sim.parked)poseCar(p,p.x,Z(PARK-30),1);
    sim.birds.forEach((b,i)=>{const m=birdMeshes[i];m.position.set(X(b.x),SWH+b.z*M,Z(b.y));m.rotation.y=b.dir>0?0:Math.PI;m.rotation.z=b.st==='g'&&(b.t%50)<8?-.5:0;});
    for(const f of flags){const a=f.mesh.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=f.base[i*3];a.setZ(i,Math.sin(t*5-x*3)*.12*x);}a.needsUpdate=true;f.mesh.geometry.computeVertexNormals();}
    for(const s of steam){const u=((t*.35+s.i/7)%1);s.s.position.set(X(s.m.x)+Math.sin(t*1.3+s.i*2)*.2+u*.6,.3+u*2.6,Z(s.m.y)-.6);const r=.5+u*1.4;s.s.scale.set(r,r,r);s.s.material.opacity=.35*(1-u);}
    marker.visible=!!showMarker;marker.position.set(X(DOOR.x),4.6+Math.sin(t*4)*.12,.6);marker.rotation.y=t*1.5;
    renderer.render(scene,cam);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=!PIXEL;ctx.drawImage(renderer.domElement,0,0,cw,ch);ctx.restore();
    out={cw,ch};
  }
  /** toque: no prédio do DHPP (ou na porta) entra; na calçada, Lemos anda até lá */
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),hitP=new THREE.Vector3(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),-SWH),facade=new THREE.Plane(new THREE.Vector3(0,0,1),0);
  function tap(px,py){if(!out)return;ndc.set(px/out.cw*2-1,-(py/out.ch*2-1));ray.setFromCamera(ndc,cam);const L=sim.lemos;
    const x0=X(DHPP.X),x1=X(DHPP.X+DHPP.w);
    if(ray.ray.intersectPlane(facade,hitP)&&hitP.y>SWH&&hitP.y<10&&hitP.x>x0&&hitP.x<x1){L.tx=DOOR.x;L.ty=DOOR.y;L.enter=true;return;}
    if(!ray.ray.intersectPlane(ground,hitP))return;
    const wx=hitP.x/M,wy=hitP.z/M+GY;L.tx=Math.min(Math.max(wx,20),STREET_W-20);L.ty=Math.min(Math.max(wy,WALK[0]),WALK[1]);L.enter=false;}
  // perda do contexto gráfico (o iOS faz isso com o app em segundo plano): a base refaz a rua na volta
  let lost=false;renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;},false);
  function dispose(){
    const seen=new Set(),drop=o=>{if(o&&!seen.has(o)){seen.add(o);o.dispose();}};
    scene.traverse(o=>{drop(o.geometry);const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(!m)continue;for(const k of ['map','emissiveMap'])drop(m[k]);drop(m);}});
    for(const t of Object.values(TX))drop(t);for(const o of sprites.values())o.texs.forEach(drop);drop(scene.environment);drop(scene.background);
    pmrem.dispose();renderer.dispose();renderer.forceContextLoss();}
  return {mode,draw,tap,dispose,renderer,scene,cam,get lost(){return lost;}};
}
