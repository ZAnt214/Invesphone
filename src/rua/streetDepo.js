/* Depoimento na rua: uma testemunha ouvida na própria cena, de madrugada, na frente da casa da Rua das Acácias.
   É o depoimento da base (caderno, legenda escrita, expressões, piscar e boca no ritmo da fala) com outro lugar e
   outra luz: o portão com a fita, o poste da calçada por cima, o giroflex dos lados, os curiosos atrás da fita, a garoa.
   Tudo o que é visual ou som consulta os Ajustes (src/settings/gameSettings.ts, categoria "Depoimento na rua").
   O progresso usa o mesmo save do depoimento da base (src/case/depositions.ts): o que for perguntado aqui conta lá.
   Ver docs/DEPOIMENTO_NA_RUA.md. */
import './streetDepo.css'
import { characters } from '../characters/characters'
import { interrogations } from '../interrogation/registry'
import { applyAnswer, askedQuestions, pendingQuestions, subtitleChunks } from '../interrogation/logic'
import { clues as CLUES, people as PEOPLE } from '../case01'
import { readCase, writeCase } from '../case/caseSave'
import { progressOf, withProgress } from '../case/depositions'
import { DEFAULT_DISCOVERED } from '../team/teamData'
import { fxOn, onFxChange } from '../settings/gameSettings'
import { getQuality } from '../characters/quality'
import { createHair } from './hairWind'

const LUPA='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';
const esc=s=>String(s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/** Abre o depoimento na rua de `id` (um depoimento de src/interrogation/registry.ts) por cima de `host`.
    opts: {onClose(), onClue(id), sound:boolean, clock():string}. Devolve {close}. */
export function openStreetDepo(host,id,opts={}){
  const cfg=interrogations[id];if(!cfg)return null;
  const CH=characters[cfg.personId];if(!CH)return null;
  const VD=CH.visemes||null;
  const PERSON=PEOPLE.find(p=>p.id===cfg.personId)||{name:cfg.name,role:''};

  /* tudo o que for agendado aqui morre junto quando o depoimento fecha */
  let alive=true;const TM=[],IV=[];
  const setTimeout=(f,ms)=>{const t=window.setTimeout(()=>{if(alive)f()},ms);TM.push(t);return t};
  const setInterval=(f,ms)=>{const t=window.setInterval(()=>{if(alive)f()},ms);IV.push(t);return t};
  const requestAnimationFrame=f=>alive?window.requestAnimationFrame(f):0;
  const low=()=>getQuality()==='low';
  /* efeito ligado nos Ajustes (a qualidade baixa desliga os mais pesados) */
  const HEAVY={'depo.lens':1,'depo.film':1,'depo.flyby':0};
  const FXON=k=>fxOn(k)&&!(low()&&HEAVY[k]);
  const AMBON=()=>SOUND&&fxOn('sfx.depoAmb');

  const root=document.createElement('div');root.className='sd';root.setAttribute('role','dialog');root.setAttribute('aria-label',`Depoimento na rua: ${cfg.name}`);
  root.innerHTML=`<div class="sd-wrap"><div class="sd-stage" id="sd-stage">
    <div class="scene"><div class="layer" id="sd-Lbg"><canvas id="sd-bg"></canvas><canvas id="sd-tape"></canvas></div><div class="dim"></div><div class="layer" id="sd-Lac"><canvas id="sd-ac"></canvas></div><div class="layer" id="sd-Lfg"><canvas id="sd-debM"></canvas><canvas id="sd-fg"></canvas><canvas id="sd-debN"></canvas></div></div>
    <div class="grade"></div><canvas id="sd-grain" width="422" height="195"></canvas><div class="vig"></div>
    <div class="rec"><i></i>REC <b id="sd-clock">00:00:00</b><span>NA CENA · RUA DAS ACÁCIAS</span></div>
    <div class="focus">FOCO · <b id="sd-focus">CADERNO</b></div>
    <div class="mark" aria-hidden="true"><b>DHPP</b><i></i><span>HOMICÍDIOS</span></div>
    <div class="tag" aria-hidden="true"><b>${esc(cfg.name.toUpperCase())}</b><i></i><span>${esc((PERSON.role||'').toUpperCase())}</span></div>
    <div class="pad" id="sd-pad"></div>
    <div class="sub" id="sd-sub" aria-live="polite"></div>
    <canvas id="sd-fx"></canvas>
    <div class="vh" role="status" id="sd-clueSr"></div>
    <div class="bars on" aria-hidden="true"><p>FRENTE DA CASA<span>Rua das Acácias${opts.clock?' · '+esc(opts.clock()):''}</span></p></div>
  </div></div>`;
  host.appendChild(root);
  const $=s=>root.querySelector(s);
  const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W=844,H=390;
  const RED='255,48,48',BLUE='70,120,255',SOD='255,170,70',FLUO='215,255,240',WARM='255,200,130';
  const cur='mix';
  let DEG=0;
  let busy=false,curQ=null,circled=false,seq=null,typing=null,clueCount=0;const NOTES2=[];

  /* ---------- retrato oficial: uma imagem por expressão, recortada pela máscara da figura ---------- */
  const imgs={},skins={};let ready=false;const PW=540,PH=720;
  const loadImg=src=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src});
  const EXPRS=[...new Set([cfg.idleExpression||'neutral','neutral','uncomfortable',...cfg.questions.map(q=>q.expression).filter(Boolean)])].filter(e=>CH.assets[e]);
  Promise.all([loadImg(CH.figureMask),VD?loadImg(VD.src):null,...EXPRS.map(e=>loadImg(CH.assets[e].src))]).then(([mask,vis,...ims])=>{
    if(!alive)return;
    const tmp=document.createElement('canvas');tmp.width=300;tmp.height=400;const x=tmp.getContext('2d');
    EXPRS.forEach((e,i)=>{const im=ims[i];if(!im)return;
      const c=document.createElement('canvas');c.width=PW;c.height=PH;const cx2=c.getContext('2d');cx2.drawImage(im,0,0,PW,PH);
      if(mask){cx2.globalCompositeOperation='destination-in';cx2.drawImage(mask,0,0,PW,PH);cx2.globalCompositeOperation='source-over'}
      imgs[e]=c;x.clearRect(0,0,300,400);x.drawImage(im,0,0,300,400);
      /* tom da pele (bochecha) para a pálpebra do piscar */
      try{const a=CH.assets[e],L=a.eyes.left,R=a.eyes.right,dist=R.cx-L.cx,mx=(L.cx+R.cx)/2,my=(L.cy+R.cy)/2;
        const d=x.getImageData(Math.round((mx-dist*.52)/3-2),Math.round((my+dist*.71)/3-2),5,5).data;let r=0,g=0,b=0,n=0;
        for(let k=0;k<d.length;k+=4){r+=d[k];g+=d[k+1];b+=d[k+2];n++}skins[e]=`rgb(${r/n|0},${g/n|0},${b/n|0})`}catch(_){skins[e]='rgb(150,95,60)'}
    });
    /* bocas oficiais (folha de visemas) com a borda esfumada, para assentar sobre o retrato */
    if(vis&&VD){const c=document.createElement('canvas');c.width=vis.width;c.height=vis.height;const x=c.getContext('2d');x.drawImage(vis,0,0);
      const m=document.createElement('canvas');m.width=c.width;m.height=c.height;const mx=m.getContext('2d');
      for(let i=0;i<VD.order.length;i++){const cx=i*VD.cellW+VD.center[0],cy=VD.center[1]+3,rx=VD.cellW*.24,ry=VD.cellH*.42;
        mx.save();mx.translate(cx,cy);mx.scale(1,ry/rx);const g=mx.createRadialGradient(0,0,0,0,0,rx);g.addColorStop(0,'#000');g.addColorStop(.78,'#000');g.addColorStop(1,'rgba(0,0,0,0)');mx.fillStyle=g;mx.fillRect(-rx,-rx,rx*2,rx*2);mx.restore()}
      x.globalCompositeOperation='destination-in';x.drawImage(m,0,0);m.width=m.height=0;imgs.visemes=c}
    tmp.width=tmp.height=0;
    ready=true;
    /* cabelo ao vento (src/rua/hairWind.js): só se o personagem tem as camadas e o ajuste está ligado */
    if(CH.hair)HAIR=createHair({url:CH.hair,PW,PH,mask});hairSync();
  });
  /* ---------- cabelo ao vento ----------
     Com o ajuste "Cabelo ao vento" (depo.hair), qualidade não baixa e sem movimento reduzido, o retrato da expressão em
     uso é recomposto a cada quadro: base sem as mechas + mechas dobradas pelo mesmo vento da garoa (windAt), mais forte
     quando o helicóptero passa. Desligado, volta o retrato oficial e as camadas saem da memória. */
  let HAIR=null;
  const hairOn=()=>!!HAIR&&FXON('depo.hair')&&!low()&&!RM&&DEG<2;   // aparelho que já precisou aliviar duas vezes: retrato parado
  function hairSync(){if(!HAIR)return;HAIR.keep(hairOn()?[...new Set([expr,prev].filter(Boolean))]:[])}
  /* vento do cabelo, com inércia (o cabelo não reage num quadro só):
     - brisa da garoa: sopra para a direita, um pouco para baixo; o cabelo se deita ~5° e balança devagar;
     - helicóptero: o vento vem de onde ele está (de lado, deita o cabelo para o lado, sobre a testa e a orelha; em cima,
       achata para baixo), com força quase total e turbulência rápida. */
  const HW={ang:.17,cx:Math.cos(.17),cy:Math.sin(.17),bend:0,wob:0,gust:0,lean:0,t:0};
  function hairWind(t){const dt=Math.min(.1,Math.max(0,t-HW.t));HW.t=t;const w=windAt(t),g=Math.max(0,w-.05),hA=HS?HS.A:0;
    let tx=Math.cos(.17),ty=Math.sin(.17);
    if(HS&&hA>.01){const dx=(640-HS.sx)/260,a=Math.atan2(1,dx);tx=tx*(1-hA)+Math.cos(a)*hA;ty=ty*(1-hA)+Math.sin(a)*hA;}
    const kd=Math.min(1,dt*3);HW.cx+=(tx-HW.cx)*kd;HW.cy+=(ty-HW.cy)*kd;HW.ang=Math.atan2(HW.cy,HW.cx);
    const tb=Math.min(.82,.06+g*.35+hA*.72),tw=Math.min(.36,.06+g*.3+hA*.24);
    HW.bend+=(tb-HW.bend)*Math.min(1,dt*(tb>HW.bend?2.6:1.2));HW.wob+=(tw-HW.wob)*Math.min(1,dt*2.4);
    HW.gust+=(hA-HW.gust)*Math.min(1,dt*3);HW.lean=1.5+g*6+hA*4;
    return HW}

  /* ---------- cenário e curiosos oficiais (creative-requests/deliveries/2026-10-15) ---------- */
  const ART={bg:null,poste:null,crowd:[],far:[]};
  {const B=import.meta.env.BASE_URL||'/';
    loadImg(B+'cenarios/rua-acacias/frente-noite.jpg').then(i=>{if(alive)ART.bg=i});
    loadImg(B+'cenarios/rua-acacias/frente-noite-poste.png').then(i=>{if(alive)ART.poste=i});
    Promise.all([1,2,3,4,5,6,7,8].map(n=>loadImg(`${B}characters/curiosos/fundo/curioso-0${n}.png`))).then(list=>{if(!alive)return;
      /* de madrugada: cada figura escurecida e fria uma vez só; a fileira de trás ainda mais apagada pela garoa */
      list.forEach((im,i)=>{if(!im)return;for(const far of [0,1]){const c=document.createElement('canvas');c.width=150;c.height=300;const x=c.getContext('2d');x.drawImage(im,0,0,150,300);
        x.globalCompositeOperation='source-atop';x.fillStyle=far?'rgba(22,28,42,.62)':'rgba(8,12,26,.42)';x.fillRect(0,0,150,300);
        x.fillStyle=lin(x,0,0,0,300,[[0,'rgba(255,190,130,.10)'],[.35,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.35)']]);x.fillRect(0,0,150,300);
        (far?ART.far:ART.crowd)[i]=c}});
    });}
  /* [figura, centro x, pé y, altura, fileira de trás]: a fileira da frente encosta na fita, a de trás fica menor */
  const CROWD_ART=[[6,118,300,138,1],[4,212,302,146,1],[7,300,298,140,1],[0,60,336,180,0],[1,156,340,184,0],[3,246,334,178,0],[5,334,338,182,0],[2,410,340,184,0]];
  let FLA=false;
  /* ===== fachada viva =====
     A foto oficial não pode parecer uma imagem parada. Sem redesenhar nada, a própria arte é mexida em código:
     - folhas: a árvore da esquerda, a copa atrás do telhado, a folhagem da direita e as moitas sobre o muro balançam com o
       vento (faixas horizontais deslocadas, mais no alto que na base), recortadas por uma máscara de folhagem calculada da
       própria imagem (cor + densidade, só dentro das caixas onde há planta);
     - cortina da janela acesa: ondula de leve com a corrente de ar e a luz respira;
     - reflexos na rua molhada: tremem com a garoa (faixas deslocadas em onda);
     - céu: nuvens baixas passando devagar, só onde a máscara diz que é céu;
     - névoa rasteira atravessando a rua, na altura dos pés dos curiosos.
     O vento é o mesmo da chuva (windAt): quando o helicóptero passa, tudo balança junto. */
  const LIFE={ok:false,fol:null,sky:null,lum:null,LW:422,LH:195,FW:document.createElement('canvas'),CL:document.createElement('canvas')};
  function buildLife(){
    const LW=LIFE.LW,LH=LIFE.LH,t=document.createElement('canvas');t.width=LW;t.height=LH;const x=t.getContext('2d',{willReadFrequently:true});x.drawImage(ART.bg,0,0,LW,LH);
    let d;try{d=x.getImageData(0,0,LW,LH).data}catch(_){return}
    const n=LW*LH,leaf=new Uint8Array(n),lum=new Uint8Array(n),box=new Uint8Array(n);
    for(const [x0,y0,x1,y1] of [[0,0,64,88],[0,62,214,87],[305,0,352,32],[396,6,422,66]])for(let y=y0;y<y1;y++)for(let i=x0;i<x1;i++)box[y*LW+i]=1;
    for(let i=0;i<n;i++){const r=d[i*4],g=d[i*4+1],b=d[i*4+2];lum[i]=(r*.3+g*.59+b*.11)|0;leaf[i]=(box[i]&&g-r>=3&&g>=b-8)?1:0}
    /* densidade 7×7 por imagem integral: fica só onde há mancha cheia de folha (tira o ruído das paredes) */
    const I=new Uint32Array((LW+1)*(LH+1));for(let y=0;y<LH;y++){let acc=0;for(let i=0;i<LW;i++){acc+=leaf[y*LW+i];I[(y+1)*(LW+1)+i+1]=I[y*(LW+1)+i+1]+acc}}
    const mk=()=>{const c=document.createElement('canvas');c.width=LW;c.height=LH;return c};
    const fol=mk(),fx=fol.getContext('2d'),fi=fx.createImageData(LW,LH);
    const sky=mk(),sx=sky.getContext('2d'),si=sx.createImageData(LW,LH);
    for(let y=0;y<LH;y++)for(let i=0;i<LW;i++){const k=y*LW+i;
      if(box[k]){const a0=Math.max(0,i-3),b0=Math.max(0,y-3),a1=Math.min(LW,i+4),b1=Math.min(LH,y+4),sum=I[b1*(LW+1)+a1]-I[b0*(LW+1)+a1]-I[b1*(LW+1)+a0]+I[b0*(LW+1)+a0];
        if(sum/((a1-a0)*(b1-b0))>.35)fi.data[k*4+3]=255}
      const r=d[k*4],g=d[k*4+1],b=d[k*4+2];if(y<45&&b>r+18&&b>g+4&&r+g+b<200)si.data[k*4+3]=255}
    fx.putImageData(fi,0,0);sx.putImageData(si,0,0);
    LIFE.fol=fol;LIFE.sky=sky;LIFE.lum=lum;LIFE.ok=true;
  }
  const lumAt=(x,y)=>{if(!LIFE.lum)return 0;const i=Math.max(0,Math.min(LIFE.LW-1,x/2|0)),j=Math.max(0,Math.min(LIFE.LH-1,y/2|0));return LIFE.lum[j*LIFE.LW+i]/255};
  /* faixas horizontais da arte (do cache, já escurecido), cada uma deslocada em x */
  function rows(c,src,r,x0,y0,w,h,step,dxf){for(let y=y0;y<y0+h;y+=step){const dx=dxf(y);c.drawImage(src,x0*r,y*r,w*r,(step+.6)*r,x0+dx,y,w,step+.6)}}
  const lifeOn=()=>FXON('depo.life')&&!RM;
  function lifeBg(c,t,g,C){
    if(!LIFE.ok&&ART.bg)buildLife();
    const r=cvBg._r||.5,src=C.bg,hA=HS?HS.A:0,w=windAt(t),gust=(w-.1)*6+hA*2.2;
    /* folhas: desenhadas deslocadas num canvas à parte e recortadas pela máscara de folhagem */
    if(LIFE.ok){
      const FW=LIFE.FW,fw=Math.ceil(W*r),fh=Math.ceil(178*r);if(FW.width!==fw||FW.height!==fh){FW.width=fw;FW.height=fh}
      const x=FW.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.clearRect(0,0,fw,fh);x.setTransform(r,0,0,r,0,0);
      const sway=(y,top,hgt,amp,ph)=>{const k=1-Math.min(1,Math.max(0,(y-top)/hgt));return amp*(.35+.65*k)*((1+gust)*Math.sin(t*1.25+y*.045+ph)+.45*Math.sin(t*2.9+y*.13+ph*2)+.25*gust*Math.sin(t*6.1+y*.3))};
      const st=low()?4:3;
      rows(x,src,r,0,0,128,176,st,y=>sway(y,0,176,1.9,0));
      rows(x,src,r,0,124,428,52,st,y=>sway(y,124,52,1.1,1.7));
      rows(x,src,r,610,0,96,64,st,y=>sway(y,0,64,1.3,3.1));
      rows(x,src,r,792,12,52,122,st,y=>sway(y,12,122,1.5,4.4));
      x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='destination-in';x.drawImage(LIFE.fol,0,0,LIFE.LW,178/2,0,0,fw,fh);x.globalCompositeOperation='source-over';
      c.drawImage(FW,0,0,W,178);
      /* nuvens baixas: manchas largas passando devagar, só no céu */
      const CL=LIFE.CL,cw=Math.ceil(W*r),chh=Math.ceil(90*r);if(CL.width!==cw||CL.height!==chh){CL.width=cw;CL.height=chh}
      const y=CL.getContext('2d');y.setTransform(1,0,0,1,0,0);y.globalCompositeOperation='source-over';y.clearRect(0,0,cw,chh);y.setTransform(r,0,0,r,0,0);
      for(let i=0;i<6;i++){const px=((i*190+t*(5+i*1.3))%1300)-230,py=8+((i*29)%34);y.save();y.translate(px,py);y.scale(3.2,.75);glow(y,0,0,46,'92,100,128',.55);glow(y,10,-6,30,'150,120,110',.18);y.restore()}
      y.setTransform(1,0,0,1,0,0);y.globalCompositeOperation='destination-in';y.drawImage(LIFE.sky,0,0,LIFE.LW,45,0,0,cw,chh);
      c.drawImage(CL,0,0,W,90);
    }
    /* cortina da janela acesa: duas folhas de vidro, a parte de baixo mexe mais */
    rows(c,src,r,124,95,50,52,3,y=>.7*((y-95)/52)*Math.sin(t*.9+y*.09)+.3*Math.sin(t*2.1+y*.2));
    rows(c,src,r,178,95,52,52,3,y=>.7*((y-95)/52)*Math.sin(t*.8+y*.08+1.3)+.3*Math.sin(t*1.9+y*.2+.7));
    c.globalCompositeOperation='lighter';glow(c,177,124,70,WARM,.035+.02*Math.sin(t*.7)+.01*Math.sin(t*2.3));c.globalCompositeOperation='source-over';
    /* reflexos na rua molhada tremendo com a garoa */
    rows(c,src,r,0,306,W,84,3,y=>{const k=(y-306)/84;return (.5+k)*(1.1*Math.sin(y*.62-t*2.3)+.6*Math.sin(y*1.7+t*1.4))});
  }
  /* névoa rasteira atravessando a rua (por cima dos pés dos curiosos, antes do poste) */
  function lifeFog(c,t){
    for(let i=0;i<5;i++){const px=((i*260+t*(9+i*2.5))%1400)-280,py=328+((i*17)%46);c.save();c.translate(px,py);c.scale(4.2,.42);glow(c,0,0,70,'120,132,156',.13);c.restore()}
  }

  /* fundo parado em cache, no tamanho real do canvas do fundo: refeito só quando o tamanho muda ou a arte chega */
  const BGC={k:''};
  function bgCache(){
    const r=cvBg._r||.5,k=cvBg.width+'x'+cvBg.height+(ART.poste?'p':'');if(BGC.k===k)return BGC;BGC.k=k;
    const mk=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(w));c.height=Math.max(1,Math.ceil(h));return c};
    BGC.bg=mk(cvBg.width,cvBg.height);{const x=BGC.bg.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(ART.bg,0,0,BGC.bg.width,BGC.bg.height);x.fillStyle='rgba(4,8,18,.26)';x.fillRect(0,0,BGC.bg.width,BGC.bg.height)}
    /* só a faixa do poste (x 200..712), não a tela toda */
    if(ART.poste){const x0=200,x1=712;BGC.px=Math.floor(x0*r);BGC.poste=mk((x1-x0)*r,cvBg.height);const x=BGC.poste.getContext('2d');x.imageSmoothingQuality='high';
      const sw=ART.poste.naturalWidth||ART.poste.width,sc=sw/W;x.drawImage(ART.poste,BGC.px/r*sc,0,BGC.poste.width/r*sc,ART.poste.naturalHeight||ART.poste.height,0,0,BGC.poste.width,BGC.poste.height)}
    else BGC.poste=null;
    /* reflexo do giroflex no chão: vermelho à esquerda, azul à direita; a intensidade vai no globalAlpha */
    for(const [key,rgb,left] of [['floorR',RED,1],['floorB',BLUE,0]]){const c=mk(256,8),x=c.getContext('2d');
      x.fillStyle=lin(x,0,0,256,0,left?[[0,`rgba(${rgb},.32)`],[.5,`rgba(${rgb},0)`]]:[[.5,`rgba(${rgb},0)`],[1,`rgba(${rgb},.32)`]]);x.fillRect(0,0,256,8);BGC[key]=c}
    return BGC;
  }
  /* Os curiosos ficam na penumbra: desenhados numa camada própria, escurecidos por cima (só onde há gente),
     com a sombra da copa da árvore balançando sobre os rostos e o giroflex passando por eles de vez em quando.
     O que os revela de verdade é luz de verdade: o flash do celular e o holofote do helicóptero. */
  const CC=document.createElement('canvas'),CCX={x:-20,y:120,w:500,h:228};
  function crowdLayer(t,g){
    const r=cvBg._r||.5,cw=Math.ceil(CCX.w*r),ch=Math.ceil(CCX.h*r);if(CC.width!==cw||CC.height!==ch){CC.width=cw;CC.height=ch}
    const x=CC.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.clearRect(0,0,cw,ch);
    x.setTransform(r,0,0,r,-CCX.x*r,-CCX.y*r);
    for(const [n,x0,yb,h,far] of CROWD_ART){const im=(far?ART.far:ART.crowd)[n];if(!im)continue;const P=crowdPos(n,x0,yb,h,t);x.drawImage(im,P.x-P.w/2,P.y,P.w,h)}
    x.globalCompositeOperation='source-atop';
    /* penumbra geral, mais funda nas pernas e no lado longe do poste: pintada uma vez, copiada por cima */
    if(!CC.pen){const c=document.createElement('canvas');c.width=250;c.height=114;const y=c.getContext('2d');y.scale(.5,.5);y.translate(-CCX.x,-CCX.y);
      y.fillStyle='rgba(3,6,14,.42)';y.fillRect(CCX.x,CCX.y,CCX.w,CCX.h);
      y.fillStyle=lin(y,0,CCX.y,0,CCX.y+CCX.h,[[0,'rgba(2,4,10,.05)'],[.45,'rgba(2,4,10,.18)'],[1,'rgba(2,4,10,.6)']]);y.fillRect(CCX.x,CCX.y,CCX.w,CCX.h);
      y.fillStyle=lin(y,CCX.x,0,CCX.x+CCX.w,0,[[0,'rgba(2,4,10,.32)'],[.7,'rgba(2,4,10,.06)'],[1,'rgba(2,4,10,0)']]);y.fillRect(CCX.x,CCX.y,CCX.w,CCX.h);CC.pen=c}
    x.drawImage(CC.pen,CCX.x,CCX.y,CCX.w,CCX.h);
    /* sombra da copa: manchas largas que balançam com o vento sobre cabeças e ombros */
    const wd=RM?0:t;
    for(let i=0;i<6;i++){const bx=10+i*84+Math.sin(wd*.55+i*2.1)*16+Math.sin(wd*1.3+i)*5,by=176+((i*37)%30)+Math.sin(wd*.8+i*1.4)*6,br=52+((i*23)%26);glow(x,bx,by,br*1.1,'1,2,6',.5)}
    /* o giroflex varre a fila: vermelho entra pela esquerda, azul pelo lado do poste */
    glow(x,-60,210,360,RED,.3*g.r);glow(x,470,200,300,BLUE,.26*g.b);
    x.globalCompositeOperation='source-over';
    return CC;
  }
  function crowdPos(n,x0,yb,h,t){const x=x0+(RM?0:Math.sin(t*.31+n*1.7)*1.4),y=yb-h+(RM?0:Math.sin(t*.27+n)*.6);return{x,y,w:h/2}}
  function drawCrowdArt(c,t,g){
    const shade=FXON('depo.shade');
    if(shade)c.drawImage(crowdLayer(t,g),CCX.x,CCX.y,CCX.w,CCX.h);
    for(const [n,x0,yb,h,far] of CROWD_ART){
      const im=(far?ART.far:ART.crowd)[n];if(!im)continue;const P=crowdPos(n,x0,yb,h,t),x=P.x,y=P.y,w=P.w;
      if(!shade)c.drawImage(im,x-w/2,y,w,h);
      /* o holofote do helicóptero passando por eles */
      if(HS&&HS.S>.02&&Math.abs(HS.sx-x0)<180){const k=HS.S*(1-Math.abs(HS.sx-x0)/180);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(shade?.6:.45)*k;c.drawImage(im,x-w/2,y,w,h);c.restore()}
      /* celulares: o rapaz filmando solta um flash de vez em quando; a moça olhando a tela fica com o rosto aceso */
      if(n===1&&!far){const px=x-w/2+w*.3,py=y+h*.38;glow(c,px,py,10,'190,215,255',.5);const f=!RM&&(t%5.3)<.09;
        if(f){glow(c,px,py,170,'255,255,255',.75);if(shade){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.35;for(const [m,a0,b0,hh,ff] of CROWD_ART){if(ff||Math.abs(a0-x0)>130)continue;const Q=crowdPos(m,a0,b0,hh,t);c.drawImage(ART.crowd[m]||im,Q.x-Q.w/2,Q.y,Q.w,hh)}c.restore()}}
        if(f&&!FLA)SFX.shutter(-.5);FLA=f}
      if(n===5&&!far){const fx=x-w/2+w*.6,fy=y+h*.6;glow(c,fx,fy,16,'170,200,255',.4);if(shade)glow(c,fx,fy-h*.2,26,'150,185,255',.16)}
    }
  }

  /* ---------- fita de isolamento: tecido, não régua ----------
     Cada trecho é presa nas duas pontas, cede no meio (flecha), ondula com o vento (ondas que andam pela fita,
     maiores no meio e zero nas pontas) e torce: quando vira, estreita e mostra o verso, sem letra.
     O helicóptero faz a fita bater. Desenhada em fatias, cada uma com o pedaço certo da textura impressa. */
  const TS=2,TW=1200,TH=11;
  /* textura impressa em 2× (o canvas da fita fica perto disso: nítida com filtro simples), uma frente (com o texto) e um verso (amarelo mais fosco, o texto vazando de leve) */
  const TAPE=(()=>{const mk=(back)=>{const f=document.createElement('canvas');f.width=TW*TS;f.height=TH*TS;const x=f.getContext('2d');x.scale(TS,TS);
      x.fillStyle=back?'#c9a418':'#e3bd1c';x.fillRect(0,0,TW,TH);
      if(!back){x.fillStyle='rgba(255,240,170,.35)';x.fillRect(0,0,TW,1);x.fillStyle='rgba(0,0,0,.25)';x.fillRect(0,TH-1.6,TW,1.6)}
      x.fillStyle='#14120a';x.font='800 7.4px ui-monospace,Menlo,Consolas,monospace';x.textBaseline='middle';
      if(back){x.globalAlpha=.16;x.save();x.scale(-1,1);for(let p=8;p<TW;p+=170)x.fillText('ISOLAMENTO · NÃO ULTRAPASSE',-p-150,TH/2+.3);x.restore()}
      else for(let p=8;p<TW;p+=170)x.fillText('ISOLAMENTO · NÃO ULTRAPASSE',p,TH/2+.3);
      return f};return{front:mk(0),back:mk(1)}})();
  const tapeMove=()=>FXON('depo.tape')&&!RM;
  /* pontos ao longo de um trecho preso nas duas pontas: [x,y,torção] */
  function spanPts(ax,ay,bx,by,sag,seed,t){
    const N=low()?16:24,mv=tapeMove(),tt=mv?t:0,hA=(mv&&HS)?HS.A:0,len=Math.hypot(bx-ax,by-ay),sc=len/400;
    const gust=.55+.45*Math.sin(tt*.43+seed)*Math.sin(tt*.17+seed*.7),out=[];
    for(let i=0;i<=N;i++){const u=i/N,e=Math.sin(Math.PI*u);
      let x=ax+(bx-ax)*u,y=ay+(by-ay)*u+sag*4*u*(1-u);
      if(mv){y+=e*sc*((1.5*Math.sin(u*7-tt*2.3+seed)+.7*Math.sin(u*15-tt*3.9+seed*2))*gust+1.1*Math.sin(tt*.8+seed))+e*hA*3.6*Math.sin(u*10-tt*10+seed);
        x+=e*.8*Math.sin(u*5-tt*1.6+seed)}
      const tw=mv?e*((.6*Math.sin(u*6-tt*1.7+seed)+.3*Math.sin(u*14-tt*3.1+seed))*(.6+gust*.6)+hA*2.6*Math.sin(u*8-tt*7+seed)):e*.35*Math.sin(u*6+seed);
      out.push([x,y,tw])}
    return out;
  }
  /* ponta solta pendurada no nó: cai, e o vento a empurra */
  function tailPts(x0,y0,len,seed,t){
    const mv=tapeMove(),tt=mv?t:0,hA=(mv&&HS)?HS.A:0,w=mv?windAt(tt):.1,N=10,out=[];let x=x0,y=y0;
    for(let i=0;i<=N;i++){const u=i/N;out.push([x,y,(mv?(.9*Math.sin(tt*3.1+seed+u*4)+hA*2.4*Math.sin(tt*9+u*5)):.4)*u]);
      const a=Math.PI/2-(w*2.2+(mv?.38*Math.sin(tt*2.2+seed+u*3)*u+hA*.9*Math.sin(tt*8+seed+u*4):0))*(.4+u);x+=Math.cos(a)*len/N;y+=Math.sin(a)*len/N}
    return out;
  }
  /* A fita é um contorno só (bordas com normal em cada ponto, que se cruzam quando ela torce), usado como recorte:
     dentro dele as fatias da textura (opacas, sobrepostas sem emenda) e por cima uma única sombra contínua
     ao longo do comprimento, que escurece onde ela vira de lado. Nada de degraus entre fatias. */
  function strip(c,P,s0){
    const n=P.length;if(n<2)return;const E=new Array(n);
    for(let i=0;i<n;i++){const a=P[Math.max(0,i-1)],b=P[Math.min(n-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const L=Math.hypot(tx,ty)||1;tx/=L;ty/=L;
      const cs=Math.cos(P[i][2]),hw=TH/2*Math.max(.12,Math.abs(cs))*(cs<0?-1:1);E[i]=[-ty*hw,tx*hw,cs]}
    c.save();c.beginPath();
    for(let i=0;i<n;i++){const p=P[i],e=E[i];i?c.lineTo(p[0]-e[0],p[1]-e[1]):c.moveTo(p[0]-e[0],p[1]-e[1])}
    for(let i=n-1;i>=0;i--){const p=P[i],e=E[i];c.lineTo(p[0]+e[0],p[1]+e[1])}
    c.closePath();c.clip();c.fillStyle='#d6b21a';c.fill();
    let s=s0||0;
    for(let i=0;i<n-1;i++){const [x0,y0]=P[i],[x1,y1]=P[i+1],dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy);if(L<.01)continue;
      const tx=dx/L,ty=dy/L,nx=-ty,ny=tx,cs=(E[i][2]+E[i+1][2])/2,hw=TH/2*Math.max(.12,Math.abs(cs))*(cs<0?-1:1),tex=cs<0?TAPE.back:TAPE.front;
      const sx=(s%(TW-60))*TS,sw=(L+2)*TS;
      c.save();c.transform(tx/TS,ty/TS,nx*hw*2/(TH*TS),ny*hw*2/(TH*TS),x0-tx-nx*hw,y0-ty-ny*hw);c.drawImage(tex,sx-TS,0,sw+TS,TH*TS,0,0,sw+TS,TH*TS);c.restore();
      s+=L}
    /* sombra contínua: onde a fita fica de lado ela recebe menos luz */
    const A=P[0],B=P[n-1],cx=B[0]-A[0],cy=B[1]-A[1],cl=cx*cx+cy*cy||1,gr=c.createLinearGradient(A[0],A[1],B[0],B[1]);
    for(let i=0;i<n;i++){const u=Math.min(1,Math.max(0,((P[i][0]-A[0])*cx+(P[i][1]-A[1])*cy)/cl)),m=Math.abs(E[i][2]);gr.addColorStop(u,`rgba(6,5,2,${(.62-.5*m).toFixed(3)})`)}
    const bx=Math.min(A[0],B[0])-30,by=Math.min(A[1],B[1])-40,bw=Math.abs(cx)+60,bh=Math.abs(cy)+80;
    c.fillStyle=gr;c.fillRect(bx,by,bw,bh);
    /* a luz da cena, só dentro da fita: giroflex dos lados, viatura passando, holofote */
    if(LT.on){c.globalCompositeOperation='lighter';c.fillStyle=LT.grad;c.fillRect(bx,by,bw,bh);
      if(LT.ps)glow(c,LT.ps[0],220,300,'255,240,215',LT.ps[1]);if(LT.hs)glow(c,LT.hs[0],230,200,'235,243,255',LT.hs[1]);c.globalCompositeOperation='source-over'}
    c.restore();
  }
  /* o nó em volta do poste/pilar: voltas da fita e a ponta solta */
  function knot(c,x,y,w,seed,t,tail){
    c.fillStyle='#a8890e';c.fillRect(x-w/2,y-1,w,TH+2);c.fillStyle='rgba(255,236,150,.4)';c.fillRect(x-w/2,y+1,w,1.2);
    c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x-w/2,y+TH-1,w,2);c.fillStyle='rgba(0,0,0,.38)';c.fillRect(x-w/2,y-1,w*.18,TH+2);c.fillRect(x+w/2-w*.22,y-1,w*.22,TH+2);
    c.fillStyle='#8f750c';c.save();c.translate(x,y+TH/2);c.rotate(.5);c.fillRect(-w*.32,-2.5,w*.64,5);c.restore();
    if(tail)strip(c,tailPts(x+w*.15,y+TH/2,tail,seed,t),seed*40);
  }
  /* trechos: a do portão sai da borda direita do poste até o pilar; a dos curiosos vem de fora do quadro até a borda esquerda do poste */
  const TAPES={gate:[458,196,790,192,9,1.3],crowd:[-30,252,433,262,11,4.1]};
  function tapeSpan(c,k,t){const a=TAPES[k];strip(c,spanPts(a[0],a[1],a[2],a[3],a[4],a[5],t),k==='gate'?40:0)}
  /* As fitas ficam num canvas próprio, em resolução cheia, só na faixa da tela onde elas passam (y 150..320),
     por cima do fundo e na mesma camada dele (andam juntas com a câmera). Recebem o giroflex e o holofote. */
  const LT={on:false,grad:null,ps:null,hs:null};
  function drawTapes(t,g){
    const c=cvTape.getContext('2d'),r=cvTape._r||1;c.setTransform(r,0,0,r,0,-TB.y*r);c.clearRect(0,TB.y,W,TB.h);
    if(!ART.bg)return;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='low';
    const gr=c.createLinearGradient(0,0,W,0);gr.addColorStop(0,`rgba(${RED},${(.3*g.r).toFixed(3)})`);gr.addColorStop(.45,'rgba(0,0,0,0)');gr.addColorStop(.55,'rgba(0,0,0,0)');gr.addColorStop(1,`rgba(${BLUE},${(.3*g.b).toFixed(3)})`);
    LT.grad=gr;LT.ps=PS&&PS.I>.02?[PS.x,.35*PS.I]:null;LT.hs=HS&&HS.S>.02?[HS.sx-HS.lean*120,.45*HS.S]:null;LT.on=true;
    tapeSpan(c,'gate',t);tapeSpan(c,'crowd',t);
    knot(c,445.5,TAPES.crowd[3]-TH/2+.5,29,2.2,t,24);knot(c,445.5,TAPES.gate[1]-TH/2+.5,29,3.7,t,0);knot(c,789,TAPES.gate[3]-TH/2+.5,29,5.1,t,18);
    LT.on=false;
    midLife(c,t,g);
  }
  /* ===== vida no plano do meio (atrás do Jorge, na frente da casa), em resolução cheia =====
     - garoa do fundo: gotas soltas, cada uma com distância, velocidade e deriva próprias (nada de textura deslizando);
       o risco é sempre maior que o deslocamento entre dois quadros, e ela só brilha onde há luz;
     - respingos: anéis abrindo nas poças (mais visíveis onde a rua reflete luz);
     - pingos do portão e da calha da garagem, que crescem, caem e respingam na calçada;
     - mariposas rodando na luz do poste. */
  const BD=Array.from({length:170},(_,i)=>newBD(true)),RIP=[],GD=[];let ripT=0,gdT=0,lastMid=performance.now();
  function newBD(any){const z=Math.random();return{x:Math.random()*(W+120)-80,y:any?Math.random()*H:-10-Math.random()*60,z,s:120+z*210,ph:Math.random()*7}}
  const MOTHS=Array.from({length:4},(_,i)=>({a:Math.random()*7,r:14+i*9,sp:1.4+Math.random()*1.6,ph:Math.random()*7}));
  function midLife(c,t,g){
    const now=performance.now(),dt=RM?0:Math.min(.05,(now-lastMid)/1000);lastMid=now;
    const rain=FXON('depo.rain')&&DEG<2,life=lifeOn(),w=windAt(t);
    if(rain){
      /* garoa do fundo */
      const BK=new Map(),n=low()||DEG>0?BD.length>>1:BD.length;
      for(let i=0;i<n;i++){const d=BD[i];const vx=d.s*(w+.04*Math.sin(t*1.3+d.ph));d.y+=d.s*dt;d.x+=vx*dt;
        if(d.y>H+10||d.x>W+60){BD[i]=newBD(false);continue}
        const len=Math.max(2.2,d.s*Math.max(SHUT,dt*1.2)),L=lightAt(d.x,d.y),al=.035+.05*d.z+L*(.2+.32*d.z)+(g.r*(d.x<300)+g.b*(d.x>560))*.06;
        if(al<.04)continue;const q=Math.round(al*20)/20,lw=d.z>.6?.9:.6,col=L>.18?'255,220,184':'178,192,220',key=col+'|'+q+'|'+lw;
        let a=BK.get(key);if(!a)BK.set(key,a=[]);a.push(d.x-len*(w+.04),d.y-len,d.x,d.y)}
      c.lineCap='round';
      for(const [key,a] of BK){const k=key.split('|');c.beginPath();for(let i=0;i<a.length;i+=4){c.moveTo(a[i],a[i+1]);c.lineTo(a[i+2],a[i+3])}c.lineWidth=+k[2];c.strokeStyle=`rgba(${k[0]},${k[1]})`;c.stroke()}
      /* respingos nas poças */
      ripT-=dt;while(ripT<0){ripT+=1/(low()?7:13);const yy=304+Math.random()*84,xx=Math.random()*W;if(xx<470&&yy<346)continue;RIP.push({x:xx,y:yy,a:0,sz:.6+(yy-300)/90})}
      c.lineWidth=.7;
      for(let i=RIP.length-1;i>=0;i--){const p=RIP[i];p.a+=dt/.55;if(p.a>=1){RIP.splice(i,1);continue}
        const k=(1-p.a)*(.05+.7*lumAt(p.x,p.y)+.35*lightAt(p.x,p.y));if(k<.02)continue;
        c.strokeStyle=`rgba(255,226,196,${Math.min(.5,k).toFixed(3)})`;c.beginPath();c.ellipse(p.x,p.y,(1+p.a*5)*p.sz,(.35+p.a*1.3)*p.sz,0,0,7);c.stroke()}
    }
    if(life){
      /* pingos do trilho do portão (y 114) e da calha da garagem (y 76), caindo até a calçada */
      gdT-=dt;if(gdT<=0){gdT=.35+Math.random()*.9;const top=Math.random()<.6;GD.push({x:top?462+Math.random()*310:468+Math.random()*270,y:top?115:77,v:0,hold:.4+Math.random()*.8,floor:top?262:258})}
      for(let i=GD.length-1;i>=0;i--){const d=GD[i];
        if(d.hold>0){d.hold-=dt;const grow=Math.min(1,1-d.hold);c.fillStyle=`rgba(200,214,236,${(.25+.3*grow).toFixed(3)})`;c.beginPath();c.arc(d.x,d.y+grow,.7+grow*.6,0,7);c.fill();continue}
        d.v+=780*dt;d.y+=d.v*dt;if(d.y>=d.floor){GD.splice(i,1);RIP.push({x:d.x,y:d.floor+6,a:.1,sz:.5});continue}
        const l=Math.max(2,d.v*Math.max(SHUT,dt*1.2));c.strokeStyle='rgba(200,214,236,.4)';c.lineWidth=.8;c.beginPath();c.moveTo(d.x,d.y-l);c.lineTo(d.x,d.y);c.stroke()}
      /* mariposas na luz do poste */
      c.globalCompositeOperation='lighter';
      for(const m of MOTHS){m.a+=dt*m.sp*(1+.6*Math.sin(t*3.1+m.ph));const mx=640+Math.cos(m.a)*m.r*1.5+Math.sin(t*5.3+m.ph)*4,my=14+Math.sin(m.a*1.3)*m.r*.7+Math.cos(t*4.1+m.ph)*3;
        const fl=.55+.45*Math.abs(Math.sin(t*38+m.ph));glow(c,mx,my,4.2,'255,214,160',.5*fl);c.fillStyle=`rgba(255,236,206,${(.75*fl).toFixed(3)})`;c.fillRect(mx-.7,my-.5,1.4,1)}
      c.globalCompositeOperation='source-over';
    }
  }

  /* ---------- tamanho: a tela do jogo deitada (844×390), encaixada no espaço que houver ---------- */
  const wrap=$('.sd-wrap'),stage=$('#sd-stage'),cvBg=$('#sd-bg'),cvTape=$('#sd-tape'),TB={y:0,h:390},cvAc=$('#sd-ac'),cvFg=$('#sd-fg');
  function setC(c,w,h,r){c.width=Math.max(1,Math.round(w*r));c.height=Math.max(1,Math.round(h*r));c._r=r}
  let K=1;
  function size(){
    const w=wrap.clientWidth,h=wrap.clientHeight;K=Math.min(w/W,h/H)||1;
    stage.style.transform=`translate(${(w-W*K)/2}px,${(h-H*K)/2}px) scale(${K})`;
    const D=Math.min(1.5,window.devicePixelRatio||1)*K*(low()?.7:1)*(DEG>0?.8:1);
    setC(cvBg,W,H,D*.5);setC(cvTape,W,TB.h,Math.min(2,D*1.15));BGC.k='';setC(cvAc,400,430,D);setC(cvFg,W,H,D);setC($('#sd-debM'),W,H,D*.35);setC($('#sd-debN'),W,H,D*.18);if(typeof rainResize==='function'&&RAINREADY)rainResize();
  }
  const ro=new ResizeObserver(()=>{if(alive)size()});ro.observe(wrap);

  /* ---------- desenho ---------- */
  /* brilho radial: um sprite por cor, feito uma vez (antes era um gradiente novo a cada chamada, dezenas por quadro) */
  const GLS={};
  function glowSpr(rgb){let s=GLS[rgb];if(s)return s;s=GLS[rgb]=document.createElement('canvas');s.width=s.height=256;const x=s.getContext('2d'),g=x.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0,`rgba(${rgb},1)`);g.addColorStop(1,`rgba(${rgb},0)`);x.fillStyle=g;x.fillRect(0,0,256,256);return s}
  function glow(c,x,y,r,rgb,a){if(a<=.01||r<=0)return;const ga=c.globalAlpha;c.globalAlpha=ga*Math.min(1,a);c.drawImage(glowSpr(rgb),x-r,y-r,r*2,r*2);c.globalAlpha=ga}
  function lin(c,x0,y0,x1,y1,stops){const g=c.createLinearGradient(x0,y0,x1,y1);stops.forEach(([o,col])=>g.addColorStop(o,col));return g}
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function giro(t){
    if(RM){const s=Math.sin(t*1.6);return{r:.35*Math.max(0,s),b:.35*Math.max(0,-s)}}
    const p=(t*.85)%1,on=(a,b)=>p>=a&&p<b,s=Math.sin(t*6.2);
    return{r:Math.min(1,(on(0,.06)||on(.1,.16)?.9:0)+.3*Math.max(0,s)),b:Math.min(1,(on(.5,.56)||on(.6,.66)?.9:0)+.3*Math.max(0,-s))};
  }
  function fluo(t){if(RM)return 1;const k=t%7.3;return k<.3?(Math.sin(k*90)>0?.35:1):1}
  const DROPS=Array.from({length:240},(_,i)=>({x:((i*97.3)%944)-50,y:(i*53.7)%440,s:520+(i*37)%260,l:9+(i*13)%10}));
  function rain(c,t,rgb,a,n){
    if(RM)t=0;c.beginPath();
    for(let i=0;i<n;i++){const d=DROPS[i];const y=((d.y+t*d.s)%440)-25,x=d.x+y*.13;c.moveTo(x,y);c.lineTo(x+d.l*.13,y+d.l)}
    c.strokeStyle=`rgba(${rgb},${a})`;c.lineWidth=1;c.stroke();
  }

  let RDT=1/60;
  /* ===== chuva realista (cena A + C) =====
     Três planos, como numa câmera de cinema com obturador de 1/48 s:
     - fundo: textura densa de riscos finos, atrás do Jorge, na tela desfocada (profundidade);
     - meio: segunda textura, mais rala, na frente;
     - perto: gotas soltas, maiores e mais rápidas; as muito perto saem do foco (largas e fracas).
     Regra de fluidez: o risco de cada gota é sempre maior que o quanto ela anda entre dois quadros (as soltas usam o tempo
     real do quadro, as texturas têm risco longo o bastante até ~40 quadros); senão ela parece pular e a cena parece travada.
     A chuva quase não aparece no escuro: só brilha onde a luz do poste a atravessa (e pisca vermelho/azul com o giroflex).
     O vento muda devagar e inclina tudo junto. No chão, respingos; do braço do poste, pingos; na lente, gotas paradas. */
  var RAINREADY=false;
  const SHUT=1/48;
  function windAt(t){const h=(typeof HS!=='undefined'&&HS)?HS.A*(.22+.12*Math.sin(t*2.3)):0;return .1+.035*Math.sin(t*.21)+.02*Math.sin(t*.53+1.3)+h}
  function makePat(n,l0,l1,a,w){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.lineCap='round';x.lineWidth=w;
    for(let i=0;i<n;i++){const px=Math.random()*256,py=Math.random()*256,l=l0+Math.random()*(l1-l0);
      const g=x.createLinearGradient(0,py,0,py+l);const al=a*(.35+Math.random()*.65);
      g.addColorStop(0,`rgba(255,228,198,0)`);g.addColorStop(.35,`rgba(255,228,198,${al})`);g.addColorStop(1,`rgba(255,228,198,${al*.8})`);
      x.strokeStyle=g;for(const oy of [0,-256]){x.beginPath();x.moveTo(px,py+oy);x.lineTo(px,py+oy+l);x.stroke()}}
    return c;
  }
  const RL={
    back:document.createElement('canvas'),front:document.createElement('canvas'),
    maskB:document.createElement('canvas'),maskF:document.createElement('canvas'),
    far:makePat(260,6,10,.5,.5),mid:makePat(70,10,15,.55,.7)
  };
  function lightAt(x,y){const dx=(x-640)/(140+Math.max(0,y)*.48);return Math.exp(-dx*dx)*(.45+.55*Math.min(1,Math.max(0,y)/280))+passLit(x,y)}
  /* ===== viatura passando atrás da câmera: não aparece, só a luz dos faróis e do giroflex varrendo a cena e o som ===== */
  let PASS=null,PS=null,glare=false;
  function passState(t){
    if(!PASS)return null;const p=(t-PASS.t0)/PASS.dur;if(p>1){PASS=null;return null}if(p<0)return null;
    const x=PASS.dir>0?-1000+2850*p:1850-2850*p;const I=Math.exp(-Math.pow((x-430)/560,2));
    const ph=(t*6.5)%1,r=(ph<.12||(ph>.2&&ph<.32))?1:0,b=(ph>.5&&ph<.62)||(ph>.7&&ph<.82)?1:0;
    return{x,I,r,b,p,dir:PASS.dir};
  }
  function passLit(x,y){let v=0;if(PS){const dx=(x-PS.x)/260;v+=Math.exp(-dx*dx)*PS.I*.9}if(false&&HS){const f=Math.max(0,(y+60)/(H+100)),bx=HS.sx-HS.lean*420*(1-f),dx=(x-bx)/(26+149*f);v+=Math.exp(-dx*dx*.9)*HS.S*1.1}return v}
  /* ===== helicóptero por cima: não aparece. O holofote desce do alto e varre a cena, a garoa acende no facho,
     o vento do rotor entorta a chuva, a luz de anticolisão pisca, a câmera vibra no ritmo das pás ===== */
  let HELI=null,HS=null,hglare=false;
  function heliState(t){
    if(!HELI)return null;const p=(t-HELI.t0)/HELI.dur;if(p>1){HELI=null;return null}if(p<0)return null;
    const A=Math.pow(Math.sin(Math.PI*p),1.1);
    /* o holofote entra por um lado, desacelera em cima do Jorge, procura um pouco e sai pelo outro */
    const e=p<.33?p/.33*.38:p<.7?.38+(p-.33)/.37*.24:.62+(p-.7)/.3*.38,base=HELI.dir>0?-200+1500*e:1300-1500*e;
    const sx=base+Math.sin(t*1.1)*55+Math.sin(t*.6+1)*35,sy=225+Math.sin(t*.9)*28;
    const S=Math.min(1,A*1.5)*(sx>-200&&sx<1050?1:0);
    const red=((t-HELI.t0)%1.1)<.09?1:0,wht=(((t-HELI.t0)%1.7)<.05||((t-HELI.t0+.12)%1.7)<.05)?1:0;
    return{sx,sy,S,A,red,wht,lean:(sx-430)/1800};
  }
  function startHeli(){const t=performance.now()/1000;HELI={t0:t+.6,dur:13,dir:Math.random()<.5?1:-1};if(AC&&AMBON())heliSound(HELI.dir,13.6)}
  /* Holofote, com a lógica de verdade: o helicóptero está no alto, um pouco à frente da câmera. O facho desce do céu até o
     chão da calçada onde o Jorge está (fora do quadro, embaixo), passando NA FRENTE da parede, em volta dele. Por isso:
     - não existe mancha redonda na parede de trás (ela só recebe um pouco de luz refletida);
     - quem está no caminho do facho (Jorge, curiosos) é aceso de cima, com borda dura;
     - o pedaço de calçada visível acende onde o facho toca o chão;
     - a sombra cai para trás e para baixo, encostada no pé da parede;
     - o volume do facho aparece na garoa e na névoa, metade atrás e metade na frente das pessoas. */
  const HAZE=Array.from({length:7},(_,i)=>({o:i/7,s:.6+((i*37)%10)/12,w:.6+((i*53)%10)/14}));
  /* facho sem bordas marcadas: pintado em faixas finas, cada uma com queda suave para os dois lados */
  const BEAM={c:null};
  function beamVolume(c,t,a){
    const {sx,S,lean}=HS,topX=sx-lean*420;
    c.globalCompositeOperation='lighter';
    if(!BEAM.c){const b=BEAM.c=document.createElement('canvas');b.width=256;b.height=1;const x=b.getContext('2d'),g=x.createLinearGradient(0,0,256,0);
      g.addColorStop(0,'rgba(228,238,255,0)');g.addColorStop(.3,'rgba(228,238,255,.45)');g.addColorStop(.5,'rgba(228,238,255,1)');g.addColorStop(.7,'rgba(228,238,255,.45)');g.addColorStop(1,'rgba(228,238,255,0)');x.fillStyle=g;x.fillRect(0,0,256,1)}
    for(let y=-10;y<H+10;y+=5){const f=(y+60)/(H+100),cx=topX+(sx-topX)*f,hw=34+150*f,al=(.16-.08*f)*S*a;
      c.globalAlpha=Math.min(1,al);c.drawImage(BEAM.c,cx-hw*1.6,y,hw*3.2,5)}
    c.globalAlpha=1;
    for(const h of HAZE){const f=((t*.07*h.s+h.o)%1),y=-60+f*(H+100),x=topX+(sx-topX)*(y+60)/(H+100)+Math.sin(t*.5+h.o*9)*20;c.save();c.translate(x,y);c.scale(1.5*h.w,1);glow(c,0,0,50+f*60,'225,236,255',.05*S*a*Math.sin(Math.PI*f));c.restore()}
    c.globalCompositeOperation='source-over';
  }
  function heliBg(c,t){
    if(!HS)return;const {sx,S,A,red,wht,lean}=HS;
    /* exposição: o que está longe do facho escurece */
    if(S>.02){const g0=c.createRadialGradient(sx,250,160,sx,250,660);g0.addColorStop(0,'rgba(0,2,8,0)');g0.addColorStop(1,`rgba(0,2,8,${.22*S})`);c.fillStyle=g0;c.fillRect(0,0,W,H)}
    /* sombras curtas no pé da parede, para trás do que a luz pega */
    const kj=S*Math.exp(-Math.pow((sx-620)/200,2)),kp=S*Math.exp(-Math.pow((sx-437)/150,2));
    if(kp>.02){c.fillStyle=`rgba(0,0,0,${.45*kp})`;c.beginPath();c.moveTo(431,334);c.lineTo(445,334);c.lineTo(450+lean*120,300);c.lineTo(436+lean*120,300);c.closePath();c.fill()}
    if(false){c.save();c.globalAlpha=.5*kj;const jx=620+lean*90,g1=c.createRadialGradient(jx,330,20,jx,330,200);g1.addColorStop(0,'rgba(0,0,0,.8)');g1.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g1;c.beginPath();c.ellipse(jx,335,190,60,0,0,7);c.fill();c.restore()}
    c.globalCompositeOperation='lighter';
    /* a parede de trás só recebe a luz que volta do chão e da garoa */
    c.save();c.translate(sx,300);c.scale(1.5,.8);glow(c,0,0,240,'220,232,255',.13*S);c.restore();
    /* o chão da calçada aceso onde o facho toca */
    c.save();c.translate(sx,382);c.scale(1.5,.16);glow(c,0,0,170,'232,240,255',.6*S);c.restore();
    if(red){c.fillStyle=lin(c,0,0,0,H,[[0,`rgba(255,30,30,${.18*A})`],[.7,'rgba(255,30,30,0)']]);c.fillRect(0,0,W,H)}
    if(wht){c.fillStyle=lin(c,0,0,0,H,[[0,`rgba(255,255,255,${.14*A})`],[.7,'rgba(255,255,255,0)']]);c.fillRect(0,0,W,H)}
    c.globalCompositeOperation='source-over';
    /* spray de água levantado pelo vento do rotor, correndo rente ao chão */
    if(A>.05&&!RM){c.globalCompositeOperation='lighter';for(let i=0;i<6;i++){const f=((t*(.18+i*.03)*(HELI?HELI.dir:1)+i*.17)%1+1)%1,mx=-150+f*1150,my=300+((i*29)%70);c.save();c.translate(mx,my);c.scale(3,.6);glow(c,0,0,60,'200,212,230',.06*A);c.restore()}c.globalCompositeOperation='source-over'}
    beamVolume(c,t,1);
  }
  function heliActor(c,w,h){
    return;const {sx,sy,S,A,red,wht}=HS,ax=sx-420;
    /* fora do holofote o Jorge também escurece com a exposição */
    if(S>.02){c.fillStyle=`rgba(0,2,8,${.32*S})`;c.fillRect(0,0,w,h)}
    if(red){c.fillStyle=lin(c,0,0,0,h,[[0,`rgba(255,40,40,${.22*A})`],[.5,'rgba(255,40,40,0)']]);c.fillRect(0,0,w,h)}
    if(wht){c.fillStyle=lin(c,0,0,0,h,[[0,`rgba(255,255,255,${.16*A})`],[.5,'rgba(255,255,255,0)']]);c.fillRect(0,0,W,h)}
  }
  const DEB=Array.from({length:16},(_,i)=>({near:i%3===0,x:-50-Math.random()*400,y:120+Math.random()*260,vx:0,vy:0,r:Math.random()*6,s:2+Math.random()*3,c:i%4===0?'#c9c2b0':(i%3?'#2a2416':'#3b3420'),live:false}));
  const DM=$('#sd-debM'),DN=$('#sd-debN');
  function debris(_c,dt,t){
    /* só mexe nos dois canvases quando há folha voando (ou acabou de sair): canvas parado não é reenviado para a tela */
    const any=!RM&&(DEB.some(d=>d.live)||(HS&&HS.A>.35));if(!any&&!DEB.dirty)return;DEB.dirty=any;
    const cm=DM.getContext('2d'),cn=DN.getContext('2d');cm.setTransform(DM._r,0,0,DM._r,0,0);cn.setTransform(DN._r,0,0,DN._r,0,0);cm.clearRect(0,0,W,H);cn.clearRect(0,0,W,H);
    if(RM)return;const A=HS?HS.A:0,dir=HELI?HELI.dir:1;
    for(const d of DEB){
      if(!d.live){if(A>.35&&Math.random()<dt*1.6){d.live=true;d.x=dir>0?-30:W+30;d.y=140+Math.random()*240;d.vx=dir*(160+Math.random()*220);d.vy=-20+Math.random()*40}continue}
      d.vx+=dir*A*60*dt;d.vy+=(Math.sin(t*3+d.r*3)*90-d.vy*.6)*dt+30*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.r+=dt*(4+d.s);
      if(d.x<-60||d.x>W+60||d.y>H+20){d.live=false;continue}
      const c=d.near?cn:cm,sz=d.s*(d.near?2.4:1);
      /* rastro de movimento: cópias mais fracas para trás na direção em que voa */
      for(let k=3;k>=0;k--){const bx=d.x-d.vx*k*.008,by=d.y-d.vy*k*.008;
        c.save();c.translate(bx,by);c.rotate(d.r-k*.15);c.scale(1,Math.abs(Math.cos((d.r-k*.15)*1.7))+.15);c.fillStyle=d.c;c.globalAlpha=(d.near?.7:.85)*(k?.22:1);
        c.beginPath();c.ellipse(0,0,sz*1.4,sz*.7,0,0,7);c.fill();c.restore()}
    }
  }
  function heliFg(c){debris(c,RDT,performance.now()/1000);return;const k=HS.S*Math.exp(-Math.pow((HS.sx-600)/240,2));if(k>.05){c.globalCompositeOperation='lighter';c.fillStyle=`rgba(230,240,255,${.05*k})`;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over'}}
  /* som: pás batendo (o "whop-whop"), turbina, ronco do vento descendo, passando por cima de um lado para o outro */
  function heliSound(dir,D){
    const t=AC.currentTime+.05,N=160,bell=new Float32Array(N),pan=new Float32Array(N),cents=new Float32Array(N),wash=new Float32Array(N);
    for(let i=0;i<N;i++){const u=i/(N-1),z=(u-.5)/.28;bell[i]=Math.max(.0001,1/(1+z*z));pan[i]=Math.tanh((u-.5)*3.2)*.85*dir;cents[i]=60*Math.tanh(-(u-.5)*5);wash[i]=Math.max(.0001,Math.pow(Math.max(0,Math.sin(Math.PI*u)),3))}
    const bus=AC.createGain();bus.gain.value=.0001;bus.gain.setValueCurveAtTime(bell,t,D);
    if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.setValueCurveAtTime(pan,t,D);bus.connect(p).connect(MASTER)}else bus.connect(MASTER);
    const send=AC.createGain();send.gain.value=.5;bus.connect(send);send.connect(street());
    const rate=10.5;
    /* pás: ruído grave pulsando no ritmo do rotor */
    const mk=(f,q,g,brown)=>{const s=AC.createBufferSource();s.buffer=brown?noiseBuf(AC,2,true):NB;s.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=f;bp.Q.value=q;
      const am=AC.createGain();am.gain.value=.15;const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=rate;o.detune.setValueCurveAtTime(cents,t,D);const og=AC.createGain();og.gain.value=.85;o.connect(og).connect(am.gain);
      const gg=AC.createGain();gg.gain.value=g;s.connect(bp).connect(am).connect(gg).connect(bus);s.start(t);s.stop(t+D+.1);o.start(t);o.stop(t+D+.1)};
    mk(95,.9,1.6,true);mk(420,1.2,.55,false);mk(1500,1,.12,false);
    /* baque grave do rotor */
    {const o=AC.createOscillator();o.type='sine';o.frequency.value=48;o.detune.setValueCurveAtTime(cents,t,D);const am=AC.createGain();am.gain.value=.1;const l=AC.createOscillator();l.type='sine';l.frequency.value=rate;const lg=AC.createGain();lg.gain.value=.1;l.connect(lg).connect(am.gain);
     const gg=AC.createGain();gg.gain.value=.9;o.connect(am).connect(gg).connect(bus);o.start(t);o.stop(t+D+.1);l.start(t);l.stop(t+D+.1)}
    /* turbina: assobio agudo */
    for(const [f,g] of [[3300,.012],[4850,.007]]){const o=AC.createOscillator();o.type='sine';o.frequency.value=f;o.detune.setValueCurveAtTime(cents.map(c=>c*2),t,D);const gg=AC.createGain();gg.gain.value=g;o.connect(gg).connect(bus);o.start(t);o.stop(t+D+.1)}
    /* vento do rotor descendo quando está bem em cima */
    {const s=AC.createBufferSource();s.buffer=noiseBuf(AC,3,true);s.loop=true;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=700;const gg=AC.createGain();gg.gain.value=.0001;gg.gain.setValueCurveAtTime(wash.map(v=>Math.max(.0001,v*.5)),t,D);
     s.connect(lp).connect(gg).connect(MASTER);s.start(t);s.stop(t+D+.1)}
  }
  function startPass(){const t=performance.now()/1000;PASS={t0:t+.25,dur:7.2,dir:Math.random()<.5?1:-1};if(AC&&AMBON())passSound(PASS.dir,7.2)}
  /* A viatura passa ATRÁS DA CÂMERA, de frente para o Jorge: a luz (faróis e giroflex) vem do nosso lado e bate na frente
     dele. Nada acende atrás dele como fonte de luz: no fundo só chega o banho de luz e a SOMBRA dele e do poste na parede,
     que corre para o lado contrário ao do carro. */
  function passBg(c){
    if(!PS)return;const {x,I,r,b}=PS;
    /* banho de luz frontal na parede e na grade, largo e sem centro visível */
    c.globalCompositeOperation='lighter';
    c.fillStyle=lin(c,x-700,0,x+700,0,[[0,'rgba(255,240,215,0)'],[.5,`rgba(255,240,215,${.16*I})`],[1,'rgba(255,240,215,0)']]);c.fillRect(0,0,W,H);
    if(r){c.fillStyle=lin(c,x-800,0,x+500,0,[[0,'rgba(255,40,40,0)'],[.55,`rgba(255,40,40,${.22*I})`],[1,'rgba(255,40,40,0)']]);c.fillRect(0,0,W,H)}
    if(b){c.fillStyle=lin(c,x-500,0,x+800,0,[[0,'rgba(70,120,255,0)'],[.45,`rgba(70,120,255,${.22*I})`],[1,'rgba(70,120,255,0)']]);c.fillRect(0,0,W,H)}
    /* calçada molhada devolvendo a luz que vem da frente */
    c.save();c.translate(x*.6+180,368);c.scale(3.2,.16);glow(c,0,0,150,'255,240,215',.35*I);if(r)glow(c,-40,0,120,RED,.4*I);if(b)glow(c,40,0,120,BLUE,.4*I);c.restore();
    c.globalCompositeOperation='source-over';
    /* sombras na parede: do poste e do próprio Jorge, empurradas para longe da luz */
    const off=(430-x)*.5;
    c.fillStyle=`rgba(0,0,0,${.38*I})`;c.beginPath();c.moveTo(431+off*.6,332);c.lineTo(445+off*.6,332);c.lineTo(445+off,-10);c.lineTo(431+off,-10);c.closePath();c.fill();
    const sx=620+(620-x)*.42,sy=150;c.save();c.globalAlpha=.55*I;
    let g=c.createRadialGradient(sx,sy,10,sx,sy,95);g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(.7,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.ellipse(sx,sy,72,92,0,0,7);c.fill();
    g=c.createRadialGradient(sx,sy+190,20,sx,sy+190,230);g.addColorStop(0,'rgba(0,0,0,.8)');g.addColorStop(.75,'rgba(0,0,0,.5)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.ellipse(sx,sy+215,200,130,0,0,7);c.fill();
    c.restore();
  }
  /* no Jorge: luz de frente, no rosto, puxada para o lado do carro; o giroflex pisca vermelho e azul em cima dele */
  function passActor(c,w,h){
    if(!PS)return;const {x,I,r,b}=PS,fx=200+Math.max(-120,Math.min(120,(x-620)*.25));
    const g1=c.createRadialGradient(fx,h*.36,20,fx,h*.42,320);g1.addColorStop(0,`rgba(255,246,228,${.5*I})`);g1.addColorStop(.6,`rgba(255,246,228,${.22*I})`);g1.addColorStop(1,'rgba(255,246,228,0)');c.fillStyle=g1;c.fillRect(0,0,w,h);
    if(r){const g2=c.createRadialGradient(fx-40,h*.38,10,fx-40,h*.4,300);g2.addColorStop(0,`rgba(${RED},${.38*I})`);g2.addColorStop(1,`rgba(${RED},0)`);c.fillStyle=g2;c.fillRect(0,0,w,h)}
    if(b){const g3=c.createRadialGradient(fx+40,h*.38,10,fx+40,h*.4,300);g3.addColorStop(0,`rgba(${BLUE},${.36*I})`);g3.addColorStop(1,`rgba(${BLUE},0)`);c.fillStyle=g3;c.fillRect(0,0,w,h)}
  }
  /* na frente: só o clarão geral da luz que vem do nosso lado (sem fonte nem reflexo de lente na imagem) */
  function passFg(c){
    if(!PS||PS.I<.2)return;const {x,I}=PS,k=Math.max(0,(I-.2)/.8);
    c.globalCompositeOperation='lighter';
    c.fillStyle=`rgba(255,238,215,${.07*k})`;c.fillRect(0,0,W,H);
    if(PS.r){c.fillStyle=`rgba(255,40,40,${.06*k})`;c.fillRect(0,0,W,H)}if(PS.b){c.fillStyle=`rgba(60,110,255,${.06*k})`;c.fillRect(0,0,W,H)}
    c.globalCompositeOperation='source-over';
  }
  /* som: motor, pneus na água, sirene com efeito doppler, ar deslocado, indo de um lado para o outro */
  /* eco da rua: duas linhas de atraso com realimentação e corte de agudos, como o som batendo nas fachadas */
  let RV=null;
  function street(){if(RV)return RV;RV=AC.createGain();const out=AC.createGain();out.gain.value=.55;out.connect(MASTER);
    for(const [dt,fb,pan] of [[.13,.42,-.5],[.21,.38,.5],[.34,.3,0]]){const d=AC.createDelay(1);d.delayTime.value=dt;const f=AC.createGain();f.gain.value=fb;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1800;
      RV.connect(d);d.connect(lp).connect(f).connect(d);route(lp,{out,pan})}
    return RV}
  function passSound(dir,D){
    const t=AC.currentTime+.25,N=120,mid=D*.5,bell=new Float32Array(N),cents=new Float32Array(N),pan=new Float32Array(N);
    for(let i=0;i<N;i++){const tau=i/(N-1)*D,u=(tau-mid)/.8;bell[i]=Math.max(.0001,1/(1+u*u*1.2));cents[i]=1200*Math.log2(1+.08*Math.tanh(-(tau-mid)/.42));pan[i]=Math.tanh((tau-mid)/1.1)*.95*dir}
    const bus=AC.createGain();bus.gain.value=.0001;bus.gain.setValueCurveAtTime(bell,t,D);
    let dst=bus;if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.setValueCurveAtTime(pan,t,D);bus.connect(p);p.connect(MASTER)}else bus.connect(MASTER);
    const send=AC.createGain();send.gain.value=.45;bus.connect(send);send.connect(street());
    const out=AC.createGain();out.gain.value=.75;out.connect(bus);
    /* sirene: subida e descida rápida (yelp) */
    const sr=AC.createOscillator();sr.type='sawtooth';sr.frequency.value=980;lfo(sr.frequency,3.4,360,'triangle');sr.detune.setValueCurveAtTime(cents,t,D);
    const sb=AC.createBiquadFilter();sb.type='bandpass';sb.frequency.value=1300;sb.Q.value=.8;const sl=AC.createBiquadFilter();sl.type='lowpass';sl.frequency.value=3200;
    const sg=AC.createGain();sg.gain.value=.11;sr.connect(sb).connect(sl).connect(sg).connect(out);
    /* motor */
    const e1=AC.createOscillator();e1.type='sawtooth';e1.frequency.value=52;e1.detune.setValueCurveAtTime(cents,t,D);const e2=AC.createOscillator();e2.type='square';e2.frequency.value=104;e2.detune.setValueCurveAtTime(cents,t,D);
    const el=AC.createBiquadFilter();el.type='lowpass';el.frequency.value=320;const eg=AC.createGain();eg.gain.value=.22;e1.connect(el);e2.connect(el);el.connect(eg).connect(out);
    /* pneus no asfalto molhado */
    const tn1=AC.createBufferSource();tn1.buffer=NB;tn1.loop=true;const tb=AC.createBiquadFilter();tb.type='bandpass';tb.frequency.value=1900;tb.Q.value=.55;const tg=AC.createGain();tg.gain.value=.5;tn1.connect(tb).connect(tg).connect(out);
    const tn2=AC.createBufferSource();tn2.buffer=noiseBuf(AC,2,true);tn2.loop=true;const tl=AC.createBiquadFilter();tl.type='lowpass';tl.frequency.value=500;const tg2=AC.createGain();tg2.gain.value=.9;tn2.connect(tl).connect(tg2).connect(out);
    for(const o of [sr,e1,e2,tn1,tn2]){o.start(t);o.stop(t+D+.1)}
    /* água espirrando nas poças e o deslocamento de ar bem na frente */
    for(let i=0;i<6;i++)nz({f0:900+Math.random()*1800,q:.9,dur:.18+Math.random()*.2,g:.12+Math.random()*.1,at:.25+mid-.45+Math.random()*.9,pan:(Math.random()-.5)*.6});
    nz({type:'lowpass',f0:200,f1:1400,q:.6,dur:.9,g:.35,a:.4,at:.25+mid-.5});
    tn({f:38,f1:58,dur:2.2,g:.22,a:1.6,at:.25+mid-1.6});tn({f:58,f1:30,dur:1.6,g:.18,at:.25+mid+.1})
  }
  function buildMask(m,w,h,r){
    m.width=w;m.height=h;const c=m.getContext('2d');c.setTransform(r,0,0,r,0,0);
    /* luz do poste: forte no facho, que abre para baixo; um resto de luz ambiente no resto */
    c.fillStyle='rgba(255,255,255,.16)';c.fillRect(0,0,W,H);
    for(let y=-10;y<H+10;y+=6){
      const half=140+Math.max(0,y)*.48,k=.45+.55*Math.min(1,Math.max(0,y)/280);
      const g=c.createLinearGradient(640-half*2.2,0,640+half*2.2,0);
      g.addColorStop(0,'rgba(255,214,170,0)');g.addColorStop(.5,`rgba(255,214,170,${.95*k})`);g.addColorStop(1,'rgba(255,214,170,0)');
      c.fillStyle=g;c.fillRect(0,y,W,6);
    }
  }
  function rainResize(){
    RL.back.width=cvBg.width;RL.back.height=cvBg.height;RL.front.width=Math.ceil(cvFg.width/2.5);RL.front.height=Math.ceil(cvFg.height/2.5);
    buildMask(RL.maskB,cvBg.width,cvBg.height,cvBg._r);buildMask(RL.maskF,RL.front.width,RL.front.height,cvFg._r/2.5);
  }
  const PATS={};
  const MTMP={};
  function layerMaskTmp(dst,mask,grad){const k=dst.width+'x'+dst.height;let c=MTMP[k];if(!c){c=MTMP[k]=document.createElement('canvas');c.width=dst.width;c.height=dst.height}
    const x=c.getContext('2d');x.globalCompositeOperation='source-over';x.clearRect(0,0,c.width,c.height);x.drawImage(mask,0,0);x.globalCompositeOperation='lighter';x.globalAlpha=PS.I;x.fillStyle=grad;x.fillRect(0,0,c.width,c.height);x.globalAlpha=1;return c}
  function layer(dst,mask,r,t,g,specs){
    const x=dst.getContext('2d');x.setTransform(1,0,0,1,0,0);x.globalCompositeOperation='source-over';x.globalAlpha=1;x.clearRect(0,0,dst.width,dst.height);
    const w=windAt(t);
    for(const L of specs){
      const p=PATS[L.k]||(PATS[L.k]=x.createPattern(RL[L.k],'repeat'));
      const off=(t*L.s/L.sc)%256;
      /* a inclinação e a queda vão na matriz do padrão; o preenchimento cobre só o canvas (antes era ~5× a área da tela) */
      if(p.setTransform&&typeof DOMMatrix!=='undefined'){p.setTransform(new DOMMatrix([r*L.sc,0,r*L.sc*w,r*L.sc,0,0]).translate(0,off));x.setTransform(1,0,0,1,0,0);x.globalAlpha=L.a;x.fillStyle=p;x.fillRect(0,0,dst.width,dst.height)}
      else{x.setTransform(r*L.sc,0,r*L.sc*w,r*L.sc,0,0);x.translate(0,off);x.globalAlpha=L.a;x.fillStyle=p;x.fillRect(-500/L.sc,-300/L.sc,(W+1000)/L.sc,(H+600)/L.sc)}
    }
    x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;
    /* a chuva só aparece onde há luz; a máscara já leva a cor de sódio */
    if(PS){x.globalCompositeOperation='destination-in';const m2=x.createRadialGradient(PS.x*r,210*r,0,PS.x*r,210*r,420*r);m2.addColorStop(0,`rgba(0,0,0,1)`);m2.addColorStop(1,'rgba(0,0,0,0)');
      const tmp=layerMaskTmp(dst,mask,m2);x.drawImage(tmp,0,0)}else{x.globalCompositeOperation='destination-in';x.drawImage(mask,0,0)}
    x.globalCompositeOperation='source-atop';
    if(PS){x.setTransform(r,0,0,r,0,0);x.globalAlpha=1;const gp=x.createRadialGradient(PS.x,210,0,PS.x,210,380);gp.addColorStop(0,`rgba(255,246,228,${PS.I})`);gp.addColorStop(1,'rgba(255,246,228,0)');x.fillStyle=gp;x.fillRect(0,0,W,H);x.setTransform(1,0,0,1,0,0)}
    /* o giroflex acende a garoa dos lados quando pisca */
    x.setTransform(r,0,0,r,0,0);
    if(g.r>.08){x.globalAlpha=Math.min(1,1.1*g.r);x.fillStyle=lin(x,0,0,W,0,[[0,'rgba(255,60,60,1)'],[.45,'rgba(255,60,60,0)']]);x.fillRect(0,0,W*.45,H)}
    if(g.b>.08){x.globalAlpha=Math.min(1,1.1*g.b);x.fillStyle=lin(x,0,0,W,0,[[.55,'rgba(80,130,255,0)'],[1,'rgba(80,130,255,1)']]);x.fillRect(W*.55,0,W*.45,H)}
    x.globalAlpha=1;x.globalCompositeOperation='source-over';
  }
  /* gotas soltas (meio e perto) */
  const DROPS2=Array.from({length:34},()=>newDrop2(true));
  function newDrop2(any){const z=Math.random()**1.4;return{x:Math.random()*(W+260)-160,y:any?Math.random()*(H+60)-40:-30-Math.random()*90,z,s:360+z*380,gy:328+Math.random()*60,j:(Math.random()-.5)*.02}}
  const LSPR=(()=>{const mk=(stops)=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,40,6.4,32,32,32);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.beginPath();x.arc(32,32,32,0,7);x.fill();return c};
    return{d:mk([[0,'rgba(0,0,0,.1)'],[.75,'rgba(0,0,0,0)']]),l:mk([[0,'rgba(255,230,200,0)'],[.75,'rgba(255,230,200,.05)'],[.92,'rgba(255,235,210,.13)'],[1,'rgba(255,235,210,0)']])}})();
  const SPL=[],DRIP=[],LENS=[];let dripT=0;
  for(let i=0;i<4;i++)LENS.push(newLens(true));
  function newLens(any){
    const side=Math.random();const x=side<.4?20+Math.random()*340:side<.8?790+Math.random()*50:400+Math.random()*380;
    const y=side<.8?40+Math.random()*320:330+Math.random()*50;
    return{x,y,r:5+Math.random()*9,life:any?Math.random()*8:0,max:7+Math.random()*9,slide:Math.random()<.4?4+Math.random()*10:0}
  }
  let RBF=0;
  function rainBack(c,t,g){
    if(!FXON('depo.rain')||DEG>1)return;
    {const tt=RM?0:t;c.globalCompositeOperation='lighter';
      for(let i=0;i<4;i++){const mx=620+Math.sin(tt*.07+i*1.7)*70,my=60+i*80+Math.sin(tt*.05*(i+1))*25;c.save();c.translate(mx,my);c.scale(1.6,1);glow(c,0,0,110,'255,200,150',.05);c.restore()}
      c.globalCompositeOperation='source-over'}
    /* a garoa do fundo não é mais uma textura deslizando (parecia um lençol travado): são gotas soltas, no canvas do meio (backDrizzle) */
  }
  function rainFront(c,t,g){
    if(!FXON('depo.rain'))return;
    if(!RAINREADY)return;const dt=RM?0:RDT,tt=RM?0:t,w=windAt(tt);
    c.lineCap='round';
    /* as gotas vão agrupadas em poucos traços (por cor, força e espessura): um traço por grupo, não um por gota */
    const BK=new Map();const add=(key,x0,y0,x1,y1)=>{let a=BK.get(key);if(!a)BK.set(key,a=[]);a.push(x0,y0,x1,y1)};
    const nDrops=DEG>1?DROPS2.length>>1:DROPS2.length;
    for(let i=0;i<nDrops;i++){
      const d=DROPS2[i];const vx=d.s*(w+d.j);d.y+=d.s*dt;d.x+=vx*dt;
      if(d.y>H+60){DROPS2[i]=newDrop2(false);continue}
      const len=d.s*Math.max(SHUT,dt*1.15),L=lightAt(d.x,d.y),ox=len*(w+d.j);
      if(d.z>.9){ /* fora de foco, bem perto da câmera */
        const al=.015+L*.05;if(al<.03)continue;
        const q=Math.round(al*40)/40;add('n|'+q,d.x-ox*1.6,d.y-len*1.6,d.x,d.y);
        continue;
      }
      const al=.015+.03*d.z+L*(.14+.22*d.z);if(al<.035)continue;
      const col=L>.22?'255,216,176':'176,192,220';
      const q=Math.round(al*20)/20,lw=d.z>.55?1:d.z>.25?.75:.55;
      add(col+'|'+q+'|'+lw,d.x-ox*.75,d.y-len*.75,d.x,d.y);
    }
    for(const [key,a] of BK){const k=key.split('|');c.beginPath();for(let i=0;i<a.length;i+=4){c.moveTo(a[i],a[i+1]);c.lineTo(a[i+2],a[i+3])}
      if(k[0]==='n'){const al=+k[1];for(const [lw,f] of [[7,.35],[4,.6],[1.8,1]]){c.lineWidth=lw;c.strokeStyle=`rgba(255,226,196,${al*f})`;c.stroke()}}
      else{c.lineWidth=+k[2];c.strokeStyle=`rgba(${k[0]},${k[1]})`;c.stroke()}}
    /* respingos: coroa e duas gotinhas que pulam */
    for(let i=SPL.length-1;i>=0;i--){
      const p=SPL[i];p.a+=dt/.28;if(p.a>=1){SPL.splice(i,1);continue}
      const L=lightAt(p.x,p.y),k=(1-p.a)*(.12+.5*L)*(.5+p.z*.5);if(k<.02)continue;
      c.lineWidth=.8;c.strokeStyle=`rgba(255,222,186,${k})`;c.beginPath();c.ellipse(p.x,p.y,1.2+p.a*5*p.z,.5+p.a*1.4*p.z,0,Math.PI,0);c.stroke();
      const tt2=p.a*.28;c.fillStyle=`rgba(255,226,196,${k})`;
      for(let j=0;j<2;j++){const bx=p.x+p.b[j*2]*tt2,by=p.y+p.b[j*2+1]*tt2+.5*900*tt2*tt2;if(by<=p.y+1){c.fillRect(bx,by,1.1,1.6)}}
    }
    /* pingos que escorrem do braço do poste */
    dripT-=dt;if(dripT<=0){dripT=1.4+Math.random()*2.2;const u=Math.random();DRIP.push({x:437+(560-437)*u+3,y:46*(1-u)*(1-u)+(-4)*2*u*(1-u)+(-16)*u*u+4,v:0,hold:.15+Math.random()*.3})}
    for(let i=DRIP.length-1;i>=0;i--){const d=DRIP[i];if(d.hold>0){d.hold-=dt;c.fillStyle='rgba(255,220,180,.5)';c.beginPath();c.arc(d.x,d.y,1.2,0,7);c.fill();continue}
      d.v+=900*dt;d.y+=d.v*dt;if(d.y>H){DRIP.splice(i,1);continue}const l=Math.max(2,d.v*Math.max(SHUT,dt*1.15)),L=lightAt(d.x,d.y);
      c.strokeStyle=`rgba(255,224,190,${.25+.45*L})`;c.lineWidth=1.3;c.beginPath();c.moveTo(d.x,d.y-l);c.lineTo(d.x,d.y);c.stroke()}
    /* gotas na lente: aparecem, às vezes escorrem, somem */
    if(FXON('depo.lens'))for(let i=0;i<LENS.length;i++){
      const o=LENS[i];o.life+=dt;if(o.life>o.max){LENS[i]=newLens(false);continue}
      const a=Math.min(1,o.life/.4,(o.max-o.life)/1.2);if(o.slide&&o.life>2)o.y+=o.slide*dt;
      const L=.35+lightAt(o.x,o.y)*.65;
      /* gota: miolo escuro e aro claro, de sprites feitos uma vez */
      c.globalAlpha=a;c.drawImage(LSPR.d,o.x-o.r,o.y-o.r,o.r*2,o.r*2);c.globalAlpha=a*L;c.drawImage(LSPR.l,o.x-o.r,o.y-o.r,o.r*2,o.r*2);c.globalAlpha=1;
      c.fillStyle=`rgba(255,245,230,${.2*a*L})`;c.beginPath();c.ellipse(o.x-o.r*.35,o.y-o.r*.4,o.r*.18,o.r*.1,-.6,0,7);c.fill();
    }
  }
  RAINREADY=true;rainResize();


  /* curiosos: gente de verdade, cada um com corpo, roupa, cabelo e postura próprios, em duas fileiras de profundidade,
     mexendo pouco e fora de sincronia (troca o peso do corpo, vira a cabeça, ergue o celular) */
  const CROWD=[
    /* fileira de trás: menores, mais apagados pela garoa */
    {x:24,b:266,s:.8,head:'hood',arms:'pocket',col:'#2a3140',ph:.3},
    {x:112,b:262,s:.76,head:'bun',arms:'crossed',col:'#3a2c30',ph:2.1,turn:-1},
    {x:206,b:268,s:.84,head:'short',arms:'umbrella',col:'#2b302a',ph:4.2,u:'#15181d'},
    {x:338,b:264,s:.78,head:'cap',arms:'down',col:'#33302a',ph:1.4,side:1},
    /* fileira da frente */
    {x:52,b:292,s:1.16,head:'beanie',arms:'umbrella',col:'#262d38',ph:.9,u:'#0f1216',w:1.08},
    {x:148,b:296,s:1.22,head:'short',arms:'phoneUp',col:'#3a2e25',ph:3.3,w:.94},
    {x:240,b:290,s:1.1,head:'long',arms:'phone',col:'#3b2933',ph:5.1,w:.88,turn:1},
    {x:306,b:298,s:1.28,head:'bald',arms:'crossed',col:'#28332d',ph:2.7,w:1.16},
    {x:386,b:294,s:1.14,head:'hood',arms:'pocket',col:'#30333a',ph:.5,side:-1}
  ];
  function arm(P,x0,y0,pts){P.moveTo(x0,y0);for(const [a,b] of pts)P.lineTo(a,b);P.closePath()}
  function drawPerson(c,p,t,g){
    const s=p.s,w=(p.w||1)*s,ph=p.ph,mv=RM?0:1;
    const x=p.x+Math.sin(t*.31+ph)*1.4*s*mv;                       /* troca o peso do corpo */
    const look=(p.turn||0)*3*s+Math.sin(t*.19+ph*1.7)*1.8*s*mv+(PS?Math.max(-1,Math.min(1,(PS.x-p.x)/260))*3.5*s*PS.I:0)+(HS?Math.max(-1,Math.min(1,(HS.sx-p.x)/300))*3*s*HS.A:0);     /* vira a cabeça devagar */
    const hy=p.b-72*s+Math.sin(t*.31+ph)*.4*s*mv-(HS?2.2*s*HS.A:0),hx=x+look,neck=hy+10*s,sh=hy+19*s,sw=(p.side?15:21)*w,back=s<1;
    const head=new Path2D(),hair=new Path2D(),torso=new Path2D(),arms=new Path2D(),acc=[];
    /* cabelo comprido fica atrás dos ombros */
    if(p.head==='long'){hair.moveTo(hx-10*s,hy-6*s);hair.quadraticCurveTo(hx-15*s,hy+18*s,hx-12*s,sh+16*s);hair.lineTo(hx+12*s,sh+16*s);hair.quadraticCurveTo(hx+15*s,hy+18*s,hx+10*s,hy-6*s);hair.closePath()}
    /* cabeça */
    if(p.head==='hood'){head.moveTo(hx-12*s,sh+2*s);head.quadraticCurveTo(hx-15*s,hy-15*s,hx,hy-16*s);head.quadraticCurveTo(hx+15*s,hy-15*s,hx+12*s,sh+2*s);head.closePath()}
    else{head.ellipse(hx,hy,9.2*s,11.4*s,0,0,7);
      if(p.side){head.moveTo(hx+p.side*8*s,hy-2*s);head.lineTo(hx+p.side*12*s,hy+2*s);head.lineTo(hx+p.side*8.5*s,hy+4*s)}
      if(p.head==='bun'){head.moveTo(hx+4*s,hy-11*s);head.arc(hx-2*s,hy-13*s,4.6*s,0,7)}
      if(p.head==='cap'){head.rect(hx-9.5*s,hy-11*s,19*s,6*s);head.rect(hx+(p.side||1)*4*s,hy-7*s,(p.side||1)*10*s,2.6*s)}
      if(p.head==='beanie'){head.moveTo(hx-9.6*s,hy-3*s);head.quadraticCurveTo(hx-10*s,hy-16*s,hx,hy-16*s);head.quadraticCurveTo(hx+10*s,hy-16*s,hx+9.6*s,hy-3*s);head.closePath()}
      if(p.head==='short'){head.moveTo(hx-9.4*s,hy-2*s);head.quadraticCurveTo(hx-9*s,hy-14*s,hx+1*s,hy-13.5*s);head.quadraticCurveTo(hx+10*s,hy-13*s,hx+9.6*s,hy-3*s);head.closePath()}
      head.rect(hx-3.6*s,hy+6*s,7.2*s,neck-hy);
    }
    /* tronco: ombros, peito, cintura do casaco */
    torso.moveTo(x-5*s,neck);torso.lineTo(x+5*s,neck);torso.quadraticCurveTo(x+sw*.8,sh-2*s,x+sw,sh+4*s);
    torso.lineTo(x+sw-2*s,sh+42*s);torso.lineTo(x+sw-4*s,H);torso.lineTo(x-sw+4*s,H);torso.lineTo(x-sw+2*s,sh+42*s);
    torso.lineTo(x-sw,sh+4*s);torso.quadraticCurveTo(x-sw*.8,sh-2*s,x-5*s,neck);torso.closePath();
    /* braços conforme a postura */
    const L=x-sw,R=x+sw;
    const down=(X,d)=>arm(arms,X,sh+5*s,[[X-d*5*s,sh+44*s],[X-d*3*s,sh+82*s],[X+d*5*s,sh+82*s],[X+d*5*s,sh+44*s],[X+d*5*s,sh+10*s]]);
    const pocket=(X,d)=>arm(arms,X,sh+5*s,[[X-d*8*s,sh+36*s],[X+d*5*s,sh+60*s],[X+d*11*s,sh+55*s],[X+d*4*s,sh+34*s],[X+d*5*s,sh+10*s]]);
    if(p.arms==='down'){down(L,1);down(R,-1)}
    else if(p.arms==='pocket'){pocket(L,1);pocket(R,-1)}
    else if(p.arms==='crossed'){down(L,1);down(R,-1);arms.moveTo(L+1*s,sh+26*s);arms.lineTo(R-1*s,sh+22*s);arms.lineTo(R-1*s,sh+36*s);arms.lineTo(L+1*s,sh+40*s);arms.closePath()}
    else if(p.arms==='phone'){down(L,1);arm(arms,R,sh+5*s,[[R+4*s,sh+40*s],[x+4*s,sh+34*s],[x+3*s,sh+26*s],[R-6*s,sh+28*s],[R-5*s,sh+10*s]]);acc.push(['screen',x+1*s,sh+22*s])}
    else if(p.arms==='umbrella'){down(L,1);arm(arms,R,sh+5*s,[[R+5*s,sh+32*s],[x+8*s,sh+26*s],[x+7*s,sh+18*s],[R-6*s,sh+20*s],[R-5*s,sh+10*s]]);acc.push(['umb',x+7*s,sh+20*s])}
    else if(p.arms==='phoneUp'){down(L,1);const lift=RM?1:.55+.45*Math.max(0,Math.sin(t*.2+ph));const hx2=R+4*s,hy2=hy-6*s-lift*12*s;
      arm(arms,R-2*s,sh+4*s,[[R+8*s,sh+30*s],[hx2+3*s,hy2+2*s],[hx2-4*s,hy2+1*s],[R,sh+28*s],[R-7*s,sh+8*s]]);acc.push(['up',hx2,hy2])}
    /* guarda-chuva por trás da cabeça */
    for(const a of acc)if(a[0]==='umb'){const ux=a[1],uy=hy-17*s;c.strokeStyle='#07080a';c.lineWidth=1.5*s;c.beginPath();c.moveTo(ux,uy);c.lineTo(a[1],a[2]);c.stroke();
      c.beginPath();c.moveTo(ux-40*s,uy+9*s);c.quadraticCurveTo(ux,uy-25*s,ux+40*s,uy+9*s);for(let i=4;i>=0;i--){const q=ux-40*s+i*20*s;c.quadraticCurveTo(q+10*s,uy+4*s,q,uy+9*s)}
      c.fillStyle=p.u;c.fill();c.strokeStyle=`rgba(255,200,150,${back?.12:.22})`;c.lineWidth=1;c.beginPath();c.moveTo(ux-35*s,uy+2*s);c.quadraticCurveTo(ux,uy-23*s,ux+35*s,uy+2*s);c.stroke();
      if(!RM)for(let i=0;i<3;i++){const f=(t*.9+i*.37+ph)%1;c.fillStyle=`rgba(255,215,180,${.35*(1-f)})`;c.fillRect(ux+(i-1)*38*s,uy+9*s+f*f*70*s,1,2.2*s)}}
    const dark='#0a0b0e',skin='#2a221f';
    c.fillStyle='#120f10';c.fill(hair);
    c.fillStyle=lin(c,0,sh,0,H,[[0,p.col],[.4,'#121418'],[1,dark]]);c.fill(torso);
    c.fillStyle=lin(c,0,sh,0,H,[[0,p.col],[.5,'#0f1114'],[1,dark]]);c.fill(arms);
    c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1;c.stroke(arms);
    c.fillStyle=p.head==='hood'?p.col:skin;c.fill(head);
    if(p.head!=='hood'&&p.head!=='bald'){c.save();c.clip(head);c.fillStyle='#141012';c.fillRect(hx-14*s,hy-20*s,28*s,(p.head==='cap'||p.head==='beanie'?13:9)*s);c.restore()}
    if(p.head==='hood'){c.fillStyle='#0c0d10';c.beginPath();c.ellipse(hx+(p.side||0)*2*s,hy+1*s,7*s,9*s,0,0,7);c.fill()}
    for(const a of acc){
      if(a[0]==='screen'){c.fillStyle='#d4e4ff';c.fillRect(a[1]-3*s,a[2]-5*s,6*s,9*s);c.save();c.clip(head);glow(c,hx,hy+10*s,16*s,'170,200,255',.35);c.restore()}
      if(a[0]==='up'){c.fillStyle='#d9e8ff';c.fillRect(a[1]-3.5*s,a[2]-12*s,7*s,11*s);glow(c,a[1],a[2]-6*s,26*s,'190,215,255',.45);if(!RM&&((t+ph)%6.1)<.08)glow(c,a[1],a[2]-6*s,190,'255,255,255',.85)}
    }
    /* luz de recorte: giroflex de cada lado, a janela quente pelo alto da cabeça */
    const rim=(path)=>{c.lineWidth=1.2;
      c.save();c.beginPath();c.rect(x-80,0,80-2*s,H);c.clip();c.strokeStyle=`rgba(${RED},${(back?.26:.45)*g.r})`;c.stroke(path);c.restore();
      c.save();c.beginPath();c.rect(x+2*s,0,80,H);c.clip();c.strokeStyle=`rgba(${BLUE},${(back?.26:.45)*g.b})`;c.stroke(path);c.restore()};
    rim(torso);rim(head);
    c.save();c.beginPath();c.rect(0,0,W,hy-3*s);c.clip();c.strokeStyle='rgba(255,196,140,.22)';c.lineWidth=1.2;c.stroke(head);c.restore();
    if(back){c.save();c.fillStyle='rgba(38,44,58,.32)';for(const pa of [torso,arms,head,hair]){c.fill(pa)}c.restore()}
    if(HS&&HS.S>.02&&Math.abs(HS.sx-x)<230){const bxc=HS.sx-HS.lean*420*.25,g2=c.createRadialGradient(bxc,230,0,bxc,230,150);g2.addColorStop(0,`rgba(235,243,255,${.26*HS.S})`);g2.addColorStop(.45,`rgba(230,240,255,${.16*HS.S})`);g2.addColorStop(1,'rgba(230,240,255,0)');
      c.save();c.globalCompositeOperation='lighter';c.fillStyle=g2;for(const pa of [torso,arms,head])c.fill(pa);c.restore()}
  }
  let FL1=false,FL2=false;
  function drawCrowd(c,t,g){for(const p of CROWD)drawPerson(c,p,t,g);
    if(!RM&&typeof SFX!=='undefined'){const f1=(t%5.3)<.09,f2=((t+3.3)%6.1)<.08;if(f1)glow(c,241,236,150,'255,255,255',.6);if(f1&&!FL1)SFX.shutter(-.55);if(f2&&!FL2)SFX.shutter(-.35);FL1=f1;FL2=f2}}

  function tape(c,x,y,w,ang){const P=spanPts(x,y,x+Math.cos(ang)*w,y+Math.sin(ang)*w,6,x*.01,performance.now()/1000);strip(c,P,0)}
  function houses(c,base,seed,col,win){
    let x=-20,i=seed;
    while(x<W+20){const w=70+(i*37)%60,h=50+(i*53)%70;c.fillStyle=col;c.fillRect(x,base-h,w,h);
      c.beginPath();c.moveTo(x-4,base-h);c.lineTo(x+w/2,base-h-18);c.lineTo(x+w+4,base-h);c.fill();
      if(win&&(i%3)){c.fillStyle=`rgba(${WARM},${.35+((i*7)%5)/12})`;c.fillRect(x+w*.3,base-h*.6,10,9)}
      x+=w+6;i++}
  }


  const ALS={c:null};
  const SC={
   casa:{
    bg(c,t,g){
      c.fillStyle=lin(c,0,0,0,60,[[0,'#05070d'],[1,'#0b1020']]);c.fillRect(0,0,W,60);
      c.fillStyle='#120d0b';c.fillRect(0,30,W,22);c.fillStyle='#0b0908';c.fillRect(0,50,W,8);
      c.fillStyle=lin(c,0,0,W,0,[[0,'#211d1a'],[.5,'#2c2723'],[1,'#1e1a18']]);c.fillRect(0,58,W,272);
      c.fillStyle='#0f0d0c';c.fillRect(58,104,146,114);
      c.fillStyle=lin(c,0,110,0,212,[[0,'#6b4a24'],[1,'#2b1d10']]);c.fillRect(64,110,134,102);
      c.fillStyle='rgba(20,12,8,.55)';c.fillRect(64,110,40,102);c.fillRect(158,110,40,102);
      c.fillStyle='#0f0d0c';c.fillRect(129,110,4,102);c.fillRect(64,158,134,4);glow(c,131,161,130,WARM,.12);
      c.fillStyle='#0f0d0c';c.fillRect(234,116,84,78);c.fillStyle='#0e131d';c.fillRect(239,121,74,68);
      c.fillStyle=`rgba(${BLUE},${.3*g.b})`;c.fillRect(239,121,74,68);
      glow(c,372,150,70,WARM,.35);c.fillStyle='#ffd9a0';c.fillRect(368,144,8,10);
      c.fillStyle='#0e0e0f';c.fillRect(410,150,420,180);
      c.fillStyle='#050505';for(let x=414;x<830;x+=15)c.fillRect(x,150,4,180);c.fillRect(410,156,420,5);c.fillRect(410,300,420,5);
      c.fillStyle='#1a1816';c.fillRect(396,132,18,198);c.fillRect(826,132,18,198);
      /* PM de guarda no portão */
      c.fillStyle='#07080b';c.beginPath();c.arc(468,198,12,0,7);c.fill();c.fillRect(454,184,28,7);c.fillRect(450,189,36,3);
      c.beginPath();c.moveTo(446,214);c.lineTo(490,214);c.lineTo(500,330);c.lineTo(436,330);c.fill();
      tape(c,384,234,470,.03);
      c.fillStyle='#1c1e22';c.fillRect(0,330,W,60);c.fillStyle='#2c2f35';c.fillRect(0,330,W,4);
      c.fillStyle='rgba(0,0,0,.35)';for(let x=40;x<W;x+=92)c.fillRect(x,334,2,56);
      c.fillStyle=lin(c,0,0,W,0,[[0,`rgba(${RED},${.35*g.r})`],[.5,'rgba(0,0,0,0)'],[1,`rgba(${BLUE},${.35*g.b})`]]);c.fillRect(0,334,W,56);
      c.globalCompositeOperation='lighter';glow(c,-40,200,640,RED,.3*g.r);glow(c,900,170,580,BLUE,.32*g.b);c.globalCompositeOperation='source-over';
    },
    fg(c,t){rain(c,t,'200,215,235',.32,180)},
    light(c,w,h,g){
      c.fillStyle='rgba(6,10,24,.36)';c.fillRect(0,0,w,h);
      c.fillStyle=lin(c,0,0,w,0,[[0,`rgba(${RED},${.5*g.r})`],[.6,`rgba(${RED},0)`]]);c.fillRect(0,0,w,h);
      c.fillStyle=lin(c,0,0,w,0,[[.4,`rgba(${BLUE},0)`],[1,`rgba(${BLUE},${.5*g.b})`]]);c.fillRect(0,0,w,h);
    }
   },
   mix:{
    bg(c,t,g){
      if(ART.bg){
        /* cenário oficial (public/cenarios/rua-acacias): a fachada dos Valença, o muro, o portão e a calçada molhada.
           A foto grande e o poste são reduzidos e escurecidos uma vez só (cache no tamanho da tela); por quadro é uma cópia. */
        const C=bgCache();c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(C.bg,0,0);c.restore();
        if(lifeOn())lifeBg(c,t,g,C);
        /* o giroflex chega pelos lados e a calçada molhada devolve as cores */
        if(g.r>.01){c.globalAlpha=g.r;c.drawImage(C.floorR,0,292,W,98);c.globalAlpha=1}
        if(g.b>.01){c.globalAlpha=g.b;c.drawImage(C.floorB,0,292,W,98);c.globalAlpha=1}
        c.globalCompositeOperation='lighter';glow(c,-40,200,640,RED,.24*g.r);glow(c,900,170,580,BLUE,.26*g.b);c.globalCompositeOperation='source-over';
        drawCrowdArt(c,t,g);
        if(lifeOn())lifeFog(c,t);
        if(C.poste){c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(C.poste,C.px,0);c.restore()}
      }else{
        SC.casa.bg(c,t,g);
        drawCrowd(c,t,g);
        tape(c,0,252,412,-.01);
        c.fillStyle='#16171a';c.fillRect(432,0,11,334);c.fillRect(426,318,23,14);
        c.strokeStyle='#16171a';c.lineWidth=7;c.beginPath();c.moveTo(437,46);c.quadraticCurveTo(440,-4,560,-16);c.stroke();
      }
      c.fillStyle=`rgba(${RED},${.4*g.r})`;c.fillRect(438,0,3,322);c.fillStyle=`rgba(${BLUE},${.4*g.b})`;c.fillRect(447,0,3,322);
      /* luz do poste no ar: difusa, sem borda; a garoa é que desenha o facho */
      c.globalCompositeOperation='lighter';
      c.save();c.translate(640,-40);c.scale(.85,1.7);glow(c,0,0,300,SOD,.13);c.restore();
      glow(c,640,-30,170,'255,190,120',.3);
      c.save();c.translate(640,362);c.scale(1,.16);glow(c,0,0,280,SOD,.3);c.restore();
      c.globalCompositeOperation='source-over';
      passBg(c);heliBg(c,t);
      rainBack(c,t,g);
    },
    fg(c,t,g){rainFront(c,t,g);passFg(c);heliFg(c)},
    light(c,w,h,g){
      /* luz fixa (escuro geral, âmbar do poste por cima, pé no escuro) pintada uma vez; o giroflex num gradiente só */
      if(!ALS.c){const k=ALS.c=document.createElement('canvas');k.width=100;k.height=108;const x=k.getContext('2d');x.scale(100/w,108/h);
        x.fillStyle='rgba(6,10,24,.34)';x.fillRect(0,0,w,h);
        x.fillStyle=lin(x,0,0,0,h,[[0,'rgba(255,178,96,.3)'],[.5,'rgba(255,178,96,0)']]);x.fillRect(0,0,w,h);
        x.fillStyle=lin(x,0,0,0,h,[[.5,'rgba(4,6,14,0)'],[1,'rgba(4,6,14,.5)']]);x.fillRect(0,0,w,h)}
      c.drawImage(ALS.c,0,0,w,h);
      if(g.r>.01||g.b>.01){c.fillStyle=lin(c,0,0,w,0,[[0,`rgba(${RED},${(.32*g.r).toFixed(3)})`],[.24,`rgba(${RED},0)`],[.76,`rgba(${BLUE},0)`],[1,`rgba(${BLUE},${(.32*g.b).toFixed(3)})`]]);c.fillRect(0,0,w,h)}
      passActor(c,w,h);heliActor(c,w,h);
    }
   }
  };

  let expr='neutral',prev=null,fadeAt=0;
  let blinkNext=performance.now()+1500,blinkStart=-1;
  const vis={A:0,E:0,I:0,O:0,U:0,M:0},ORDER=['A','E','I','O','U','M'];
  let mouthOn=0,openV=0,speech=null;
  const gcv=document.createElement('canvas');gcv.width=400;gcv.height=120;const gx=gcv.getContext('2d');
  function setExpr(e){if(e===expr)return;prev=expr;expr=e;fadeAt=performance.now();hairSync()}
  function track(text){
    const out=[];let ci=0;
    for(const ch of text.toLowerCase()){
      if('aáàãâ'.includes(ch))out.push(['A',1]);else if('eéê'.includes(ch))out.push(['E',.72]);
      else if('ií'.includes(ch))out.push(['I',.55]);else if('oóôõ'.includes(ch))out.push(['O',.9]);
      else if('uú'.includes(ch))out.push(['U',.55]);else if('mbp'.includes(ch))out.push(['M',0]);
      else if(ch===' ')out.push(['M',.1]);else if('.,?!'.includes(ch))out.push(['M',0],['M',0],['M',0],['M',0]);
      else out.push(['E',.35]);
      out[out.length-1].ci=ci;ci++;
    }
    return out;
  }
  function speak(text,done){speech={tr:track(text),at:performance.now(),done}}
  function mouthStep(now,dt){
    let key=null,op=0;
    if(speech){const i=Math.max(0,Math.floor((now-speech.at)/58));if(i<speech.tr.length){[key,op]=speech.tr[i]}else{const d=speech.done;speech=null;d&&d()}}
    const k=Math.min(1,dt*22);
    for(const v of ORDER)vis[v]+=((v===key?1:0)-vis[v])*k;
    openV+=(op-openV)*Math.min(1,dt*18);
    mouthOn=key?Math.min(1,mouthOn+dt/.08):Math.max(0,mouthOn-dt/.14);
  }
  function drawMouth(c){
    if(mouthOn<.02||!imgs.visemes||!VD)return;
    const ws=ORDER.map(v=>({v,w:vis[v]})).filter(x=>x.w>.01).sort((a,b)=>a.w-b.w);if(!ws.length)return;
    gx.clearRect(0,0,400,120);let acc=0;
    for(const x of ws){acc+=x.w;gx.globalAlpha=x.w/acc;gx.drawImage(imgs.visemes,VD.order.indexOf(x.v)*VD.cellW,0,VD.cellW,VD.cellH,0,0,400,120)}
    gx.globalAlpha=1;
    const m=CH.assets[expr].mouth,cx=m.cx,rim=m.rimY,s=m.halfWidth*2/VD.lipWidth,sy=s*(vis.M+(1-vis.M)*(.62+.38*Math.min(1,openV)));
    c.save();c.globalAlpha=Math.min(1,mouthOn);c.translate(cx,rim);c.scale(s,sy);c.drawImage(gcv,-VD.center[0],-VD.center[1]);c.restore();
  }
  function drawLids(c,now){
    if(blinkStart<0&&now>=blinkNext)blinkStart=now;
    if(blinkStart<0)return;
    const p=(now-blinkStart)/170;if(p>1){blinkStart=-1;blinkNext=now+2300+Math.random()*2900;return}
    const amount=p<.5?p*2:(1-p)*2;if(amount<.03)return;
    const E=CH.assets[expr].eyes;for(const {cx,cy,rx,ry} of [E.left,E.right]){
      const top=cy-ry+3,edge=top+amount*(ry*2-4);
      c.save();c.beginPath();c.ellipse(cx,cy,rx-1,ry-1,0,0,Math.PI*2);c.clip();
      c.fillStyle=skins[expr]||'rgb(150,95,60)';c.beginPath();c.moveTo(cx-rx-2,top-3);c.lineTo(cx+rx+2,top-3);c.lineTo(cx+rx+2,edge);
      c.quadraticCurveTo(cx,edge+3*amount,cx-rx-2,edge);c.closePath();c.fill();
      if(amount>.2){c.strokeStyle='#2a1c16';c.lineWidth=2;c.beginPath();c.moveTo(cx-rx+6,edge);c.quadraticCurveTo(cx,edge+3*amount,cx+rx-6,edge);c.stroke()}
      c.restore();
    }
  }
  function drawActor(now,t,g){
    const c=cvAc.getContext('2d'),r=cvAc._r;c.setTransform(r,0,0,r,0,0);c.clearRect(0,0,400,430);
    if(!ready||!imgs[expr])return;
    const S=476/1200,br=RM?0:Math.sin(t*2*Math.PI/4.4);
    c.save();c.translate(200-450*S,br*1.1);c.scale(S,S*(1+br*.0025));
    const f=Math.min(1,(now-fadeAt)/320);
    if(prev&&f<1&&imgs[prev]){c.drawImage(imgs[prev],0,0,900,1200);c.globalAlpha=f}
    if(!(hairOn()&&HAIR.draw(c,expr,RM?0:t,hairWind(t))))c.drawImage(imgs[expr],0,0,900,1200);c.globalAlpha=1;
    drawMouth(c);drawLids(c,now);c.restore();
    c.globalCompositeOperation='source-atop';SC[cur].light(c,400,430,g,t);c.globalCompositeOperation='source-over';
    /* holofote no Jorge: soma a própria imagem dentro do círculo de luz (clareia sem lavar a cor), com borda dura */
    if(false&&cur==='mix'&&HS&&HS.S>.02&&imgs[expr]){const ax=HS.sx-HS.lean*420*.4-420,k=HS.S*Math.exp(-Math.pow((ax-200)/230,2));
      if(k>.02){const cy=430*.3;c.save();c.beginPath();c.ellipse(ax,cy,175,200,0,0,7);c.clip();
        c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,.75*k);c.translate(200-450*S,br*1.1);c.scale(S,S*(1+br*.0025));c.drawImage(imgs[expr],0,0,900,1200);c.restore();
        c.save();c.globalCompositeOperation='source-atop';c.beginPath();c.ellipse(ax,cy,175,200,0,0,7);c.clip();c.fillStyle=`rgba(200,220,255,${.1*k})`;c.fillRect(0,0,400,430);c.restore()}}
  }


  /* ---------- câmera ----------
     Um operador de câmera na rua: mão leve sempre (deriva lenta, rolagem mínima), molas em vez de transições fixas,
     paralaxe entre os planos (fundo anda menos, chuva da frente anda mais) e cortes motivados pela conversa:
     - caderno: plano aberto, parado;
     - pergunta circulada: aproxima um pouco;
     - resposta: vai fechando devagar no rosto enquanto ele fala (mais quando a expressão pesa) e o fundo perde o foco;
     - frase que vira pista: um toque rápido de aproximação;
     - troca de lugar: a câmera chega de lado e assenta. */
  const CAM={x:0,y:0,z:1,vx:0,vy:0,vz:0,r:0,vr:0,mode:'idle',since:performance.now(),heavy:false};
  const LAYERS=[[$('#sd-Lbg'),.55],[$('#sd-Lac'),1],[$('#sd-Lfg'),1.3]];
  const OVR=1.03;
  function camMode(m,heavy){CAM.mode=m;CAM.since=performance.now();CAM.heavy=!!heavy}
  function camPunch(){SFX.hit();if(!RM&&FXON('depo.camera')){CAM.vz+=.22;CAM.vy-=18}}
  function camArrive(){if(RM)return;CAM.x=34;CAM.y=6;CAM.z=1.07;CAM.r=.6;CAM.vx=CAM.vy=CAM.vz=CAM.vr=0}
  function spring(p,v,target,k,dt){const c=2*Math.sqrt(k)*.92;const a=k*(target-CAM[p])-c*CAM[v];CAM[v]+=a*dt;CAM[p]+=CAM[v]*dt}
  const GR=$('#sd-grain'),grx=GR.getContext('2d');let gfr=0;
  const GFR=Array.from({length:4},()=>{const c=document.createElement('canvas');c.width=211;c.height=98;const x=c.getContext('2d'),im=x.createImageData(211,98),d=im.data;for(let i=0;i<d.length;i+=4){d[i]=d[i+1]=d[i+2]=0;d[i+3]=Math.random()*255|0}x.putImageData(im,0,0);return c});
  function grainStep(){if(root.classList.contains('nofilm'))return;if(RM){if(!gfr++)grx.drawImage(GFR[0],0,0,422,195);return}if(gfr++%3)return;grx.drawImage(GFR[(gfr/3|0)%4],0,0,422,195)}
  function camStep(now,t,dt){grainStep();
    const el=(now-CAM.since)/1000;let tz=1,tx=0,ty=0,k=26;
    if(CAM.mode==='pick'){tz=1.018;tx=-3;ty=-1;k=34}
    else if(CAM.mode==='note'){tz=1.005;tx=8;ty=2;k=18}
    else if(CAM.mode==='answer'){const creep=Math.min(1,el/7);tz=1.04+creep*(CAM.heavy?.06:.035);tx=-10-creep*4;ty=-4-creep*3;k=14}
    if(PS){tx+=-(PS.x-430)/430*9*PS.I;tz+=.022*PS.I;ty+=-2*PS.I}
    if(RM){CAM.x=tx;CAM.y=ty;CAM.z=tz;CAM.r=0}
    else{const s=Math.min(dt,1/30);spring('x','vx',tx,k,s);spring('y','vy',ty,k,s);spring('z','vz',tz,k,s);spring('r','vr',0,10,s)}
    /* mão do operador: soma de ondas lentas fora de fase, um pouco mais viva no plano fechado */
    const amp=(RM||!FXON('depo.camera'))?0:(CAM.mode==='answer'?3.2:2.2);
    const sh=(PS&&!RM)?Math.max(0,PS.I-.6)*4.5:0;
    const hv=(HS&&!RM&&FXON('depo.camera'))?HS.A:0;
    const hx=Math.sin(t*2*Math.PI*5.2)*hv*.9+(Math.random()-.5)*sh+(Math.sin(t*.37)*.55+Math.sin(t*.91+1.1)*.3+Math.sin(t*1.73+2.3)*.15)*amp;
    const hy=Math.sin(t*2*Math.PI*4.9+1)*hv*.7+(Math.sin(t*.43+.7)*.55+Math.sin(t*1.07+2.1)*.3+Math.sin(t*1.9+.4)*.15)*amp*.7;
    const hr=RM?0:(Math.sin(t*.29+.3)*.7+Math.sin(t*.71+1.9)*.3)*.14;
    for(const [el2,f] of LAYERS){
      const z=OVR*(1+(CAM.z-1)*f),x=(CAM.x+hx)*f,y=(CAM.y+hy)*f;
      el2.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${(CAM.r+hr).toFixed(3)}deg) scale(${z.toFixed(4)})`;
    }
  }


  /* partículas e luz, como no HUD */
  const fxc=$('#sd-fx'),fg2=fxc.getContext('2d');const FP=[],FXL=[];let fraf=0,flast=0;
  function spr(col){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.18,col);gr.addColorStop(.45,col.replace(',1)',',.35)'));gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return c}
  const SP={a:spr('rgba(255,207,138,1)'),w:spr('rgba(255,250,240,1)')};
  function fxSize(){const r=Math.min(1.5,window.devicePixelRatio||1)*K;fxc.width=Math.round(W*r);fxc.height=Math.round(H*r);fg2.setTransform(r,0,0,r,0,0)}
  function padd(p){FP.push(Object.assign({vx:0,vy:0,age:0,life:1,size:3,drag:.985,grav:0,col:'a'},p))}
  function burst(x,y,n,spd,col,life){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=spd*(.3+Math.random());padd({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:life*(.5+Math.random()*.7),size:1.5+Math.random()*2.5,drag:.93,col:col||(Math.random()<.5?'a':'w'),grav:.02})}}
  function fxStart(){if(fraf||RM)return;fxSize();flast=performance.now();fraf=requestAnimationFrame(fxFrame)}
  function fxFrame(now){const dt=Math.min(.05,(now-flast)/1000);flast=now;fg2.clearRect(0,0,W,H);fg2.globalCompositeOperation='lighter';
    for(let i=FXL.length-1;i>=0;i--){const f=FXL[i];f.t+=dt;const k=Math.min(1,f.t/f.dur);
      if(f.k==='ring'){const e=1-Math.pow(1-k,3),r=f.r0+(f.r1-f.r0)*e;fg2.globalAlpha=(1-k)*.85;fg2.strokeStyle='#ffcf8a';fg2.lineWidth=f.w*(1-k)+.4;fg2.beginPath();fg2.arc(f.x,f.y,r,0,7);fg2.stroke()}
      else if(f.k==='comet'){const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,u=1-e,x=u*u*f.x0+2*u*e*f.cx+e*e*f.x1,y=u*u*f.y0+2*u*e*f.cy+e*e*f.y1;
        for(let j=0;j<3;j++)padd({x:x+(Math.random()-.5)*4,y:y+(Math.random()-.5)*4,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,life:.45+Math.random()*.3,size:1.5+Math.random()*2.2,drag:.95,col:Math.random()<.6?'a':'w'});
        fg2.globalAlpha=1;fg2.drawImage(SP.w,x-14,y-14,28,28);fg2.globalAlpha=.6;fg2.drawImage(SP.a,x-30,y-30,60,60);
        if(k>=1&&f.done){const d=f.done;f.done=null;d()}}
      if(k>=1)FXL.splice(i,1)}
    for(let i=FP.length-1;i>=0;i--){const p=FP[i];p.age+=dt;if(p.age>=p.life){FP.splice(i,1);continue}
      p.vx*=p.drag;p.vy*=p.drag;p.vy+=p.grav;p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;const t=p.age/p.life,a=t<.15?t/.15:1-(t-.15)/.85,s2=p.size*(1+.4*(1-t));
      fg2.globalAlpha=Math.max(0,a);fg2.drawImage(SP[p.col],p.x-s2*2,p.y-s2*2,s2*4,s2*4)}
    fg2.globalAlpha=1;fg2.globalCompositeOperation='source-over';
    if(FP.length||FXL.length)fraf=requestAnimationFrame(fxFrame);else{fraf=0;fg2.clearRect(0,0,W,H)}}
  /* posição dentro do palco (sem a escala do palco) */
  function spos(el){const r=el.getBoundingClientRect(),s0=stage.getBoundingClientRect();return{x:(r.left-s0.left)/K,y:(r.top-s0.top)/K,w:r.width/K,h:r.height/K}}

  function bumpCount(){SFX.ding();clueCount++;renderPad();const pc=pad.querySelector('.pc');if(pc){pc.classList.add('bump');if(!RM){const b=spos(pc);fxStart();burst(b.x+b.w/2,b.y+b.h/2,22,2.4,null,.8);FXL.push({k:'ring',x:b.x+b.w/2,y:b.y+b.h/2,r0:5,r1:48,dur:.6,w:2,t:0})}}}
  /* A · marca-texto */
  function clueA(q,cb){
    finishTyping();const box=sub.querySelector('span');if(!box)return;box.classList.add('hlon');SFX.marker();
    const ks=[...box.querySelectorAll('.c.k')];
    setTimeout(()=>{
      stage.classList.add('noting');camMode('note');$('#sd-focus').textContent='CADERNO';SFX.rustle();NOTES2.push({t:q.title,st:'pend'});renderPad();
      setTimeout(()=>{
        const r=ks.length?ks.map(spos):[spos(box)],x0=Math.min(...r.map(a=>a.x)),y0=Math.min(...r.map(a=>a.y));
        const fl=document.createElement('div');fl.className='flyer';fl.textContent=q.clue;fl.style.left=x0+'px';fl.style.top=(y0-1)+'px';stage.appendChild(fl);
        const tg=[...pad.querySelectorAll('.nt')].pop(),t=spos(tg),dx=t.x+18-x0,dy=t.y-y0;
        SFX.whoosh();
        const done=()=>{fl.remove();SFX.write();const n=NOTES2[NOTES2.length-1];n.st='write';renderPad();setTimeout(()=>{n.st='';},1000);setTimeout(()=>{registerClue(q);bumpCount()},1100);setTimeout(cb,2000)};
        if(RM){done();return}
        fl.animate([{transform:'none',opacity:1},{transform:`translate(${dx*.45}px,${dy*.45-70}px) rotate(-6deg) scale(.95)`,opacity:1,offset:.5},{transform:`translate(${dx}px,${dy}px) rotate(-2deg) scale(.72)`,opacity:.15}],{duration:820,easing:'cubic-bezier(.45,0,.3,1)',fill:'forwards'}).onfinish=done;
      },480);
    },RM?0:650);
  }

  /* ===== som: tudo sintetizado (sem arquivos). Liga no primeiro toque; o botão silencia. =====
     Ambiente: chuva (chiado, grave e pingos), rádio da PM ao longe e carro passando no asfalto molhado.
     Efeitos: clique da caneta, círculo na pergunta, folhear do caderno, marca-texto, papel voando, escrita,
     o toque grave da pista e o impacto da câmera. */
  let AC=null,MASTER=null,NB=null,AMBOUT=null,SOUND=opts.sound!==false,amb=false;
  function ensureAudio(){
    try{
      if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();MASTER=AC.createGain();MASTER.gain.value=SOUND?1:0;MASTER.connect(AC.destination);NB=noiseBuf(AC,2,false)}
      if(AC.state==='suspended')AC.resume();
      if(!amb){amb=true;startAmbience()}
    }catch(_){}
  }
  function noiseBuf(ac,sec,brown){const n=ac.sampleRate*sec,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;if(brown){l=(l+.02*w)/1.02;d[i]=l*3.5}else d[i]=w}return b}
  function route(node,o){const dst=o.out||MASTER;if(o.pan!=null&&AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=Math.max(-1,Math.min(1,o.pan));node.connect(p).connect(dst)}else node.connect(dst)}
  function nz(o){if(!AC||!SOUND)return;const t=AC.currentTime+(o.at||0),d=o.dur;const s=AC.createBufferSource();s.buffer=NB;s.loop=true;
    const f=AC.createBiquadFilter();f.type=o.type||'bandpass';f.Q.value=o.q||1;f.frequency.setValueAtTime(o.f0,t);if(o.f1)f.frequency.exponentialRampToValueAtTime(o.f1,t+d);
    const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.g,t+(o.a||.01));g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(f).connect(g);route(g,o);s.start(t,Math.random()*1.5);s.stop(t+d+.05)}
  function tn(o){if(!AC||!SOUND)return;const t=AC.currentTime+(o.at||0),d=o.dur;const s=AC.createOscillator();s.type=o.type||'sine';s.frequency.setValueAtTime(o.f,t);if(o.f1)s.frequency.exponentialRampToValueAtTime(o.f1,t+d);
    const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(o.g,t+(o.a||.005));g.gain.exponentialRampToValueAtTime(.0001,t+d);
    s.connect(g);route(g,o);s.start(t);s.stop(t+d+.05)}
  function scribble(d,at=0,g=1){for(let x=0;x<d;x+=.04+Math.random()*.03)nz({f0:2200+Math.random()*3200,q:2.2,dur:.03+Math.random()*.03,g:(.03+Math.random()*.07)*g,at:at+x})}
  const SFX0={
    click(){nz({f0:2600,q:1.5,dur:.035,g:.14});tn({f:1700,dur:.03,g:.025,type:'triangle'})},
    circle(){scribble(.55,0,.9)},
    rustle(){nz({f0:900,f1:2400,q:.7,dur:.32,g:.12,a:.06});nz({f0:4200,q:1,dur:.18,g:.04,at:.05})},
    marker(){nz({f0:1700,f1:3600,q:3.5,dur:.5,g:.11,a:.04});tn({f:2500,f1:2900,dur:.45,g:.008,type:'triangle'})},
    whoosh(){nz({type:'lowpass',f0:300,f1:2600,q:.8,dur:.6,g:.22,a:.28})},
    write(){scribble(1.05,0,1.1);nz({f0:600,q:.8,dur:.08,g:.05,at:1.05})},
    ding(){tn({f:110,f1:55,dur:.45,g:.28});tn({f:523.3,dur:1.6,g:.07,a:.01});tn({f:784,dur:1.3,g:.05,at:.07});tn({f:1046.5,dur:1.1,g:.025,at:.14});nz({f0:6000,q:2,dur:.25,g:.02,at:.02})},
    hit(){tn({f:68,f1:38,dur:.6,g:.32});nz({type:'lowpass',f0:420,f1:120,dur:.5,g:.09})},
    shutter(pan){nz({f0:3500,q:1.2,dur:.03,g:.05,pan});nz({f0:2200,q:1.5,dur:.04,g:.04,at:.07,pan})},
    boom(){tn({f:55,f1:32,dur:1.4,g:.4,a:.02});nz({type:'lowpass',f0:600,f1:80,dur:1.2,g:.14});tn({f:220,dur:1.8,g:.03,type:'triangle',at:.05})}
  };
  /* efeitos do depoimento obedecem ao ajuste de som */
  const SFX={};for(const k in SFX0)SFX[k]=(...a)=>{if(FXON('sfx.depoFx'))SFX0[k](...a)};

  /* rádio: só o chiado. O canal abre (tchhh), fica chiando um tempo com estalos e oscilação, e fecha com a cauda */
  function radioHiss(t0,dur,pan,lvl){
    const at=t0-AC.currentTime;nz({f0:2300,q:1.2,dur:.22,g:.32*lvl,pan,at});
    const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2100;bp.Q.value=.7;
    const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=500;const g=AC.createGain();const t=t0+.12;
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.42*lvl,t+.05);
    /* o chiado respira: sobe e desce em pedaços, como sinal fraco */
    for(let x=.1;x<dur;x+=.08+Math.random()*.22)g.gain.setTargetAtTime((.22+Math.random()*.3)*lvl,t+x,.04);
    g.gain.setTargetAtTime(.0001,t+dur,.05);
    s.connect(hp).connect(bp).connect(g);route(g,{out:MASTER,pan});s.start(t,Math.random());s.stop(t+dur+.4);
    for(let x=.1;x<dur;x+=.05+Math.random()*.2)if(Math.random()<.5)nz({f0:1500+Math.random()*3000,q:2,dur:.012+Math.random()*.02,g:(.14+Math.random()*.16)*lvl,pan,at:at+.12+x});
    nz({type:'highpass',f0:2800,q:.6,dur:.35,g:.3*lvl,pan,at:at+.12+dur});
    return t0+dur+.5;
  }
  function dispatch(dest,near=true){
    if(!AC||!AMBON())return;const pan=near?.6:-.3,lvl=near?1:.5;let t=AC.currentTime+.05;
    t=radioHiss(t,1.2+Math.random()*2.2,pan,lvl);
    if(Math.random()<.6){t+=.5+Math.random()*.8;t=radioHiss(t,.8+Math.random()*1.6,pan,lvl)}
  }
  function startAmbience(){
    const out=AC.createGain();out.gain.value=0;out.connect(MASTER);out.gain.linearRampToValueAtTime(FXON('sfx.depoAmb')?1.6:0,AC.currentTime+1.5);AMBOUT=out;
    const hiss=AC.createBufferSource();hiss.buffer=noiseBuf(AC,4,false);hiss.loop=true;
    const hp=AC.createBiquadFilter();hp.type='highpass';hp.frequency.value=900;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=6500;
    const hg=AC.createGain();hg.gain.value=.045;hiss.connect(hp).connect(lp).connect(hg).connect(out);hiss.start();
    const bed=AC.createBufferSource();bed.buffer=noiseBuf(AC,4,true);bed.loop=true;const bl=AC.createBiquadFilter();bl.type='lowpass';bl.frequency.value=900;
    const bg=AC.createGain();bg.gain.value=.2;bed.connect(bl).connect(bg).connect(out);bed.start();
    setInterval(()=>{if(!AMBON())return;for(let k=0;k<3;k++)if(Math.random()<.5)nz({f0:1500+Math.random()*4500,q:3,dur:.025,g:.02+Math.random()*.06,at:Math.random()*.06,out})},60);
    /* rádio da PM ao longe: chiado, bip e uma voz picotada */
    const radio=()=>{dispatch(out,false);setTimeout(radio,20000+Math.random()*16000)};setTimeout(radio,11000);
    /* carro passando devagar na água */
    const car=()=>{if(AMBON())carPass(out);setTimeout(car,16000+Math.random()*18000)};setTimeout(car,9000);
    moreAmbience(out);
    const passLoop=()=>{if(FXON('depo.flyby')&&!busy&&!PASS&&!HELI)startPass();setTimeout(passLoop,40000+Math.random()*35000)};setTimeout(passLoop,9000);
    const heliLoop=()=>{if(FXON('depo.flyby')&&!PASS&&!HELI)startHeli();setTimeout(heliLoop,80000+Math.random()*50000)};setTimeout(heliLoop,30000);
  }
  /* fonte contínua de ruído filtrado, com volume e lado próprios */
  function loopNoise(out,{type='bandpass',f,q=1,g,pan=0,brown=false}){
    const s=AC.createBufferSource();s.buffer=brown?noiseBuf(AC,4,true):NB;s.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;
    const gg=AC.createGain();gg.gain.value=g;s.connect(fl).connect(gg);route(gg,{out,pan});s.start(0,Math.random()*1.5);return{src:s,fl,gain:gg};
  }
  function lfo(param,rate,depth,type='sine'){const o=AC.createOscillator();o.type=type;o.frequency.value=rate;const d=AC.createGain();d.gain.value=depth;o.connect(d).connect(param);o.start();return o}
  /* carro passando de um lado para o outro, com o chiado dos pneus na água */
  function carPass(out){
    const t=AC.currentTime,dir=Math.random()<.5?-1:1,d=3.2;
    for(const [type,f0,f1,q,g] of [['lowpass',220,900,.6,.08],['bandpass',2400,3800,.8,.035]]){
      const s=AC.createBufferSource();s.buffer=NB;s.loop=true;const fl=AC.createBiquadFilter();fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f0,t);fl.frequency.linearRampToValueAtTime(f1,t+d*.5);fl.frequency.linearRampToValueAtTime(f0,t+d);
      const gg=AC.createGain();gg.gain.setValueAtTime(.0001,t);gg.gain.exponentialRampToValueAtTime(g,t+d*.5);gg.gain.exponentialRampToValueAtTime(.0001,t+d);
      let p=null;if(AC.createStereoPanner){p=AC.createStereoPanner();p.pan.setValueAtTime(-.9*dir,t);p.pan.linearRampToValueAtTime(.9*dir,t+d)}
      s.connect(fl).connect(gg);if(p)gg.connect(p).connect(out);else gg.connect(out);s.start(t);s.stop(t+d+.1);
    }
  }
  function moreAmbience(out){
    /* cidade ao longe: um ronco grave e constante */
    loopNoise(out,{type:'lowpass',f:160,q:.7,g:.09,brown:true});
    /* viatura parada com o motor ligado, à direita */
    {const o=AC.createOscillator();o.type='triangle';o.frequency.value=41;const o2=AC.createOscillator();o2.type='sine';o2.frequency.value=83;
     const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=180;const g=AC.createGain();g.gain.value=.045;lfo(g.gain,2.3,.012);
     o.connect(lp);o2.connect(lp);lp.connect(g);route(g,{out,pan:.55});o.start();o2.start();}
    /* zumbido da lâmpada de sódio do poste, por cima */
    {const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=120;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=240;bp.Q.value=9;
     const g=AC.createGain();g.gain.value=.0045;o.connect(bp).connect(g);route(g,{out,pan:.25});o.start();}
    /* água correndo na sarjeta e descendo no bueiro */
    {const w=loopNoise(out,{f:1300,q:7,g:.016,pan:.45});lfo(w.fl.frequency,2.7,380);lfo(w.gain.gain,.37,.007);
     const w2=loopNoise(out,{f:520,q:4,g:.012,pan:.5});lfo(w2.fl.frequency,1.6,160,'triangle');}
    /* vento: sobe e desce com as rajadas da chuva */
    {const w=loopNoise(out,{type:'lowpass',f:480,q:.5,g:.0,brown:true,pan:-.1});
     setInterval(()=>{const t=performance.now()/1000,v=Math.max(0,windAt(t)-.08)*1.6+.02*Math.random();w.gain.gain.setTargetAtTime(Math.min(.16,v),AC.currentTime,.6);w.fl.frequency.setTargetAtTime(380+v*1600,AC.currentTime,.6)},500);}
    /* curiosos: murmúrio baixo de várias vozes à esquerda, com tosse de vez em quando */
    {const vs=[[380,.010],[620,.008],[950,.006],[1500,.003]].map(([f,g])=>loopNoise(out,{f,q:6,g:0,pan:-.6}));
     setInterval(()=>{for(const v of vs){const on=Math.random()<.55;v.gain.gain.setTargetAtTime(on?.004+Math.random()*.012:0,AC.currentTime,.05+Math.random()*.08);v.fl.frequency.setTargetAtTime(v.fl.frequency.value*(.9+Math.random()*.2),AC.currentTime,.1)}},170);
     const cough=()=>{if(AMBON()){const p=-.4-Math.random()*.4;nz({f0:520,q:1.2,dur:.14,g:.05,pan:p});nz({f0:460,q:1.2,dur:.12,g:.04,at:.22,pan:p})}setTimeout(cough,14000+Math.random()*20000)};setTimeout(cough,7000);}
    /* chuva batendo nos guarda-chuvas dos curiosos */
    setInterval(()=>{if(AMBON()&&Math.random()<.6)nz({f0:450+Math.random()*450,q:3,dur:.025,g:.012+Math.random()*.012,pan:-.45-Math.random()*.2})},80);
    /* pingos grossos caindo do braço do poste e da calha */
    const drip=()=>{if(AMBON()){const f=1100+Math.random()*1300,p=(Math.random()-.5)*.6;tn({f,f1:f*.55,dur:.07,g:.035,pan:p});tn({f:f*1.52,f1:f*.9,dur:.05,g:.012,at:.005,pan:p})}setTimeout(drip,350+Math.random()*1300)};setTimeout(drip,800);
    /* fita de isolamento batendo no vento */
    const flap=()=>{if(AMBON()&&windAt(performance.now()/1000)>.11){const t=AC.currentTime,s=AC.createBufferSource();s.buffer=NB;s.loop=true;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.9;
      const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.03,t+.2);g.gain.linearRampToValueAtTime(.0001,t+1.3);const am=AC.createGain();am.gain.value=.5;lfo(am.gain,17+Math.random()*6,.5,'square');
      s.connect(bp).connect(am).connect(g);route(g,{out,pan:-.15});s.start(t);s.stop(t+1.4)}setTimeout(flap,3000+Math.random()*6000)};setTimeout(flap,2500);
    /* sirene bem longe, de vez em quando */
    const siren=()=>{if(AMBON()){const t=AC.currentTime,o=AC.createOscillator();o.type='sine';o.frequency.value=950;lfo(o.frequency,.22,280,'triangle');const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1100;
      const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.009,t+3);g.gain.setValueAtTime(.009,t+6);g.gain.exponentialRampToValueAtTime(.0001,t+10);
      let p=null;if(AC.createStereoPanner){p=AC.createStereoPanner();p.pan.setValueAtTime(-.7,t);p.pan.linearRampToValueAtTime(.7,t+10)}o.connect(lp).connect(g);if(p)g.connect(p).connect(out);else g.connect(out);o.start(t);o.stop(t+10.2)}
      setTimeout(siren,45000+Math.random()*40000)};setTimeout(siren,20000);
    /* PM andando na calçada molhada, à direita */
    const steps=()=>{if(AMBON()){const n=4+Math.floor(Math.random()*3);for(let i=0;i<n;i++){const p=.65-i*.08;nz({type:'lowpass',f0:650,dur:.09,g:.05,at:i*.56,pan:p});nz({f0:3200,q:1.4,dur:.06,g:.018,at:i*.56+.01,pan:p})}}setTimeout(steps,18000+Math.random()*17000)};setTimeout(steps,12000);
    /* rádio da viatura, mais perto, à direita: chiado de fundo sempre ligado, estalos, e chamadas da central com squelch */
    {const st=loopNoise(out,{f:2600,q:.9,g:.014,pan:.6});lfo(st.gain.gain,.13,.005);
     const st2=loopNoise(out,{type:'highpass',f:5000,q:.5,g:.006,pan:.62});
     setInterval(()=>{if(AMBON()&&Math.random()<.35)nz({f0:1800+Math.random()*2500,q:2,dur:.012+Math.random()*.02,g:.05+Math.random()*.06,pan:.6})},140);}
    const radio2=()=>{dispatch(MASTER,true);setTimeout(radio2,14000+Math.random()*14000)};setTimeout(radio2,1800);
  }

  /* ---------- laço ---------- */
  const GS={r:0,b:0};let last=performance.now(),FN=0;const t0=performance.now();
  /* se o aparelho não segura ~40 quadros, alivia em dois passos: menos resolução e sem filme; depois metade da garoa */
  let pAcc=0,pN=0;function perf(dt){if(DEG>=2)return;pAcc+=dt;pN++;if(pAcc<2)return;const avg=pAcc/pN;pAcc=0;pN=0;
    if(avg>1/40){DEG++;root.classList.add('nofilm');size()}}
  const filmSync=()=>root.classList.toggle('nofilm',!FXON('depo.film')||DEG>0);filmSync();
  function frame(now){
    if(!alive)return;
    const dt=Math.min(.05,(now-last)/1000);last=now;RDT=dt;const t=now/1000;
    PS=FXON('depo.flyby')?passState(t):null;HS=FXON('depo.flyby')?heliState(t):null;
    stage.classList.toggle('passing',!busy&&!!(PS&&PASS&&(performance.now()/1000-PASS.t0)/PASS.dur<.82));
    if(PS&&PS.I>.55&&!busy&&expr==='neutral'){setExpr('uncomfortable');glare=true}else if(glare&&(!PS||PS.I<.3)){glare=false;if(!busy)setExpr(IDLE)}
    const gr=giro(t),s=SC[cur];GS.r+=(gr.r-GS.r)*Math.min(1,dt*9);GS.b+=(gr.b-GS.b)*Math.min(1,dt*9);const g=GS;
    /* fundo a cada quadro; num aparelho que já precisou aliviar (DEG>0), a cada dois */
    if(DEG===0||!(FN++&1)){const b=cvBg.getContext('2d');b.setTransform(cvBg._r,0,0,cvBg._r,0,0);s.bg(b,t,g)}
    drawTapes(t,g);
    perf(dt);
    mouthStep(now,dt);typeStep(now);drawActor(now,t,g);camStep(now,t,dt);
    const f=cvFg.getContext('2d');f.setTransform(cvFg._r,0,0,cvFg._r,0,0);f.clearRect(0,0,W,H);s.fg(f,t,g);
    const sec=Math.floor((now-t0)/1000),p=n=>String(n).padStart(2,'0');
    clockEl.textContent=`${p(Math.floor(sec/3600))}:${p(Math.floor(sec/60)%60)}:${p(sec%60)}`;
    requestAnimationFrame(frame);
  }
  const clockEl=$('#sd-clock');

  /* ---------- conversa: mesmas perguntas e o mesmo progresso do depoimento da base ---------- */
  const IDLE=cfg.idleExpression&&CH.assets[cfg.idleExpression]?cfg.idleExpression:'neutral';
  expr=IDLE;
  const pad=$('#sd-pad'),sub=$('#sd-sub'),focusEl=$('#sd-focus');
  const clueTitle=cid=>CLUES.find(c=>c.id===cid)?.title||cid;
  let P=progressOf(readCase(),id);
  const qOf=x=>{const h=x.highlights?.[0];return{id:x.id,q:x.question,a:x.answer,e:x.expression&&CH.assets[x.expression]?x.expression:IDLE,
    clue:h&&x.answer.includes(h.phrase)?h.phrase:null,clueIds:(x.highlights||[]).map(k=>k.clue),title:h?clueTitle(h.clue):''}};
  const pending=()=>{const g=readCase();return pendingQuestions(cfg,P,g.clues,g.requestedMaterials||[]).map(qOf)};
  /* o que já foi anotado (aqui ou na base) aparece no caderno */
  {const g=readCase();for(const q of askedQuestions(cfg,P))for(const h of q.highlights||[])if(g.clues.includes(h.clue)&&!NOTES2.some(n=>n.id===h.clue)){NOTES2.push({id:h.clue,t:clueTitle(h.clue)});clueCount++}}
  function renderPad(){
    const done=askedQuestions(cfg,P).slice(-2).map(q=>`<li>${esc(q.question)}</li>`).join('');
    let body='';
    if(busy&&curQ){body=`<p class="asked${circled?' drawn':''}">${esc(curQ.q)}<svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M8 22 C 6 6, 70 2, 92 12 C 102 18, 96 34, 60 37 C 30 40, 2 34, 6 18 C 8 12, 18 8, 26 7"/></svg></p>`}
    else{
      const av=pending();
      body=av.slice(0,4).map(q=>`<button class="ask" data-q="${q.id}">${esc(q.q)}</button>`).join('')||`<button class="ask end" data-end="1">${esc(cfg.farewell||'Obrigado. Por enquanto é só.')}</button>`;
    }
    if(busy)circled=true;
    pad.innerHTML=`<h3>${esc(cfg.name)} · na rua</h3>${clueCount?`<span class="pc">${LUPA}${clueCount} ${clueCount>1?'PISTAS':'PISTA'}</span>`:''}<button class="exit" data-end="1">Sair</button>${done?`<ul class="done">${done}</ul>`:''}<div class="asks">${body}</div>${NOTES2.length?`<div class="nts"><small>PISTAS</small>${NOTES2.slice(-2).map(n=>`<span class="nt${n.st?' '+n.st:''}"><span>${esc(n.t)}</span></span>`).join('')}</div>`:''}`;
  }
  pad.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||busy)return;
    if(b.dataset.end){SFX.click();close();return}
    const q=pending().find(x=>x.id===b.dataset.q);if(q)ask(q);
  });
  function ask(q){
    SFX.click();setTimeout(()=>SFX.circle(),120);circled=false;busy=true;curQ=q;stage.classList.add('pick');camMode('pick');renderPad();
    setTimeout(()=>{
      SFX.rustle();stage.classList.remove('pick');stage.classList.add('listen','answering');focusEl.textContent=cfg.name.split(' ')[0].toUpperCase();setExpr(q.e);
      camMode('answer',q.e==='shaken'||q.e==='uncomfortable'||q.e==='nervous'||q.e==='teary');
      q._shown=false;seq={q,chunks:subtitleChunks(q.a),i:-1,timer:0};seq.timer=setTimeout(nextChunk,250);
    },RM?150:750);
  }
  /* resposta respondida: grava no save como o depoimento da base faria */
  function answered(q){
    const r=applyAnswer(cfg,P,q.id);P=r.progress;
    writeCase(x=>{let y=withProgress(x,id,P);
      if(r.clues.length)y={...y,clues:[...new Set([...y.clues,...r.clues])]};
      if(r.people.length){const k=y.discoveredPeople??DEFAULT_DISCOVERED;y={...y,discoveredPeople:[...new Set([...k,...r.people])]}}
      if(P.completed&&!y.interviewed.includes(id))y={...y,interviewed:[...y.interviewed,id]};
      return y});
    r.clues.forEach(c=>opts.onClue&&opts.onClue(c));
  }
  /* a pista marcada na legenda entra no save quando o Lemos termina de anotar */
  function registerClue(q){
    P={...P,noted:[...new Set([...(P.noted||[]),...q.clueIds])]};
    writeCase(x=>{const y=withProgress(x,id,P);return {...y,clues:[...new Set([...y.clues,...q.clueIds])]}});
    q.clueIds.forEach(c=>opts.onClue&&opts.onClue(c));
  }
  /* cada legenda fica o tempo da fala mais um tempo de leitura; tocar na cena completa o texto ou passa para a próxima */
  function nextChunk(){
    if(!seq)return;clearTimeout(seq.timer);const q=seq.q;
    seq.i++;
    if(seq.i>=seq.chunks.length){
      seq=null;speech=null;finishTyping();
      const fromNote=stage.classList.contains('noting');
      answered(q);
      setTimeout(()=>{sub.innerHTML='';
        setExpr(IDLE);busy=false;curQ=null;stage.classList.remove('listen','answering','noting');camMode('idle');focusEl.textContent='CADERNO';renderPad();if(!fromNote)SFX.rustle()},fromNote?150:450);
      return;
    }
    const ch=seq.chunks[seq.i];startTyping(ch);speak(ch);
    const sd=track(ch).length*58;
    seq.clueHere=false;
    if(q.clue&&!q._shown){const i=ch.indexOf(q.clue);if(i>=0){const tc=track(ch.slice(0,i)).length*58;setTimeout(camPunch,tc+120);seq.clueHere=true}}
    /* a pista só é anotada depois que ele termina de falar a frase; a conversa espera a anotação acabar */
    seq.timer=setTimeout(seq.clueHere?clueAfterSpeech:nextChunk,seq.clueHere?sd+350:sd+Math.max(1700,ch.length*48));
  }
  function clueAfterSpeech(){
    if(!seq||!seq.clueHere)return;clearTimeout(seq.timer);seq.clueHere=false;seq.hold=true;speech=null;finishTyping();
    const my=seq;showClue(my.q,()=>{if(seq!==my)return;my.hold=false;
      if(my.i>=my.chunks.length-1){nextChunk();return}            /* era a última frase: o caderno já está na mão, a conversa volta para ele */
      stage.classList.remove('noting');camMode('answer');focusEl.textContent=cfg.name.split(' ')[0].toUpperCase();SFX.rustle();my.timer=setTimeout(nextChunk,700)});
  }
  /* antes da primeira frase o toque não faz nada: senão ele e o início da fala avançavam juntos e pulavam a frase da pista */
  stage.addEventListener('click',e=>{if(e.target.closest('.pad')||!seq||seq.hold||seq.i<0)return;if(typing)finishTyping();else if(seq.clueHere)clueAfterSpeech();else nextChunk()});
  function startTyping(text){
    const chars=[...text],cl=seq&&seq.q.clue,c0=cl?text.indexOf(cl):-1,c1=c0>=0?c0+cl.length:-1;let kk=0;
    sub.innerHTML=`<span>${chars.map((ch,i)=>{const k=i>=c0&&i<c1;const d=k?(kk++)*16:0;return `<i class="c${k?' k':''}" style="font-style:normal${k?`;transition-delay:0s,${d}ms,${d}ms,${d}ms`:''}">${esc(ch)}</i>`}).join('')}<i class="nx"></i></span>`;
    /* peso de cada letra: pausa depois de vírgula e de ponto; termina um pouco antes da boca */
    const wts=chars.map((ch,i)=>{const p=chars[i-1];return p===','?5:(p==='.'||p==='?'||p==='!')?8:1});
    const tot=wts.reduce((a,b)=>a+b,0),dur=track(text).length*58*.88;let acc=0;
    typing={els:[...sub.querySelectorAll('.c')],times:wts.map(w=>(acc+=w)/tot*dur-w/tot*dur),at:performance.now(),n:0};
    if(RM)finishTyping();
  }
  function finishTyping(){if(!typing)return;typing.els.forEach(e=>e.classList.add('on'));sub.querySelector('span')?.classList.add('ready');typing=null}
  function typeStep(now){
    if(!typing)return;const el=now-typing.at;
    while(typing.n<typing.els.length&&typing.times[typing.n]<=el){typing.els[typing.n].classList.add('on');typing.n++}
    if(typing.n>=typing.els.length){sub.querySelector('span')?.classList.add('ready');typing=null}
  }
  function showClue(q,done){
    if(q._shown)return;q._shown=true;$('#sd-clueSr').textContent='Pista registrada: '+q.title;
    clueA(q,done||(()=>{}));
  }

  /* ---------- abrir e fechar ---------- */
  const offFx=onFxChange(()=>{filmSync();hairSync();if(AMBOUT&&AC)AMBOUT.gain.setTargetAtTime(fxOn('sfx.depoAmb')?1.6:0,AC.currentTime,.2)});
  const onDown=()=>ensureAudio();root.addEventListener('pointerdown',onDown,true);
  function close(){
    if(!alive)return;alive=false;
    for(const t of TM)window.clearTimeout(t);for(const t of IV)window.clearInterval(t);
    try{ro.disconnect()}catch(_){}
    if(typeof offFx==='function')offFx();
    if(HAIR)HAIR.destroy();
    try{if(AC)AC.close()}catch(_){}
    root.classList.add('out');window.setTimeout(()=>root.remove(),350);
    opts.onClose&&opts.onClose();
  }
  size();renderPad();
  window.setTimeout(()=>{if(alive)$('.bars').classList.remove('on')},2200);
  ensureAudio();
  requestAnimationFrame(frame);
  return {close};
}
