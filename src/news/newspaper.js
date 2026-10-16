/* Jornal Sereno: a imprensa acompanha o Caso 01, "Lar Doce Lar" (docs/JORNAL_SERENO.md).
   Cada fato que entra no save faz sair uma edição (src/news/editions.js). O jornal abre sozinho, dobrado ao meio,
   quando há edição nova, mas nunca no meio de um momento importante (conversa, depoimento, quadro, foto, caderneta,
   crachá, faixas de cinema): a edição espera na fila e abre quando a tela fica livre por um instante.
   O jogador navega pela folha (arrastar, pinça, toque duplo, minimapa), vira para a matéria completa, grifa o trecho
   que importa e guarda o recorte na caderneta; o Lemos rabisca o que já sabe a mais que o jornal.
   O que o Lemos disse à imprensa (src/news/press.js) entra na edição daquele momento.
   Efeitos com ajuste em src/settings/gameSettings.ts: Gráficos > Interface > Jornal animado; Som > Jornal e Vinheta do jornal. */
import './newspaper.css';
import { ED, head, rhead, foot } from './editions';
import { newsSfx as SFX, STING_HIT } from './newsAudio';
import { fxOn } from '../settings/gameSettings';

export const NEWS_KEY='invesphone.jornal';
const PW=1000,PH=748,ZMAX=2.2;
const RMQ=typeof matchMedia!=='undefined'?matchMedia('(prefers-reduced-motion: reduce)'):null;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/** Os fatos do save que liberam edições. g: save do caso (readCase); fim: fim da varredura (localStorage 'varredura.fim'). */
export function newsFacts(g,fim){
  const clues=g&&Array.isArray(g.clues)?g.clues:[],has=id=>clues.includes(id);
  const mats=g&&Array.isArray(g.requestedMaterials)?g.requestedMaterials:[];
  return {
    casa:!!fim,                                                      // a varredura da casa acabou: a notícia do crime
    livia:!!(g&&Array.isArray(g.interviewed)&&g.interviewed.includes('livia')),
    arromb:has('porta_intacta'),                                     // o Lemos sabe que não houve arrombamento
    lock:mats.includes('fechadura_porta')||has('livia_porta_aberta'),// a perícia fecha o laudo da fechadura: vaza para a imprensa
    dinheiro:has('extrato_ricardo')||has('moto_dolares')||has('cinta_bancaria'),
    cinta:has('cinta_bancaria'),
    final:g&&typeof g.ending==='string'?g.ending:'',
    press:g&&g.press&&typeof g.press==='object'?g.press:{}
  };
}

function loadStore(){const z={known:[],read:[],kept:[],marked:[],hinted:false,init:false};
  try{const v=JSON.parse(localStorage.getItem(NEWS_KEY)||'null');if(v&&typeof v==='object'){for(const k of ['known','read','kept','marked'])if(Array.isArray(v[k]))z[k]=v[k];z.hinted=!!v.hinted;z.init=true;}}catch(_){/* sem armazenamento */}
  return z;}

/** o.app: #app; o.facts(): fatos atuais (newsFacts); o.canOpen(): a tela está livre para o jornal abrir sozinho;
    o.pt(e): ponto do evento nas coordenadas do #app (o jogo pode estar girado); o.onOpen()/o.onClose(): o jogo pausa/retoma;
    o.onKeep(): a caderneta mudou (recorte guardado). */
export function createNewspaper(o){
  const app=o.app;
  const RM=()=>!!(RMQ&&RMQ.matches)||!fxOn('news.anim');
  let st=loadStore();
  const KNOWN=new Set(st.known),READ=new Set(st.read),KEPT=new Set(st.kept),MARKED=new Set(st.marked);
  const save=()=>{try{localStorage.setItem(NEWS_KEY,JSON.stringify({known:[...KNOWN],read:[...READ],kept:[...KEPT],marked:[...MARKED],hinted:st.hinted}));}catch(_){/* sem armazenamento */}};

  const root=document.createElement('div');root.className='np';root.hidden=true;root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-label','Jornal Sereno');
  root.innerHTML=`<div class="vig"></div><div class="cam"><div class="pg"></div></div><div class="turn"></div>
    <div class="fold"><div class="fh fa"></div><div class="fh fb"><div class="sh"></div></div></div><div class="botgrad"></div>
    <div class="top"><div class="id"><span class="ic"><svg viewBox="0 0 16 16"><path d="M3 3.5h8v9.5H4.5A1.5 1.5 0 0 1 3 11.5z"/><path d="M11 6h2v5.5a1.5 1.5 0 0 1-1.5 1.5"/><path d="M5 6h4M5 8h4M5 10h2.5"/></svg></span><span class="nm"><b>JORNAL SERENO</b><em data-r="sub"></em></span></div>
      <div class="btns">
        <button class="hb" data-r="bed" type="button" aria-label="Edições"><svg viewBox="0 0 18 18"><path d="M4 5h10M4 9h10M4 13h10"/></svg><span class="lb">Edições</span><span class="badge" data-r="bdg" hidden></span></button>
        <button class="hb" data-r="bsave" type="button" aria-label="Guardar na caderneta"><svg viewBox="0 0 18 18"><path class="fillme" d="M5 2.8h8v12.4l-4-3-4 3z"/></svg><span class="lb">Guardar</span></button>
        <button class="hb" data-r="bclose" type="button" aria-label="Fechar"><svg viewBox="0 0 18 18"><path d="M5 5l8 8M13 5l-8 8"/></svg><span class="lb">Fechar</span></button>
      </div></div>
    <div class="pager glass"><button data-r="pprev" type="button" aria-label="Página anterior"><svg viewBox="0 0 16 16"><path d="M10 3L5 8l5 5"/></svg></button><span data-r="plabel">1ª página</span><button data-r="pnext" type="button" aria-label="Próxima página"><svg viewBox="0 0 16 16"><path d="M6 3l5 5-5 5"/></svg></button></div>
    <div class="mini glass" aria-hidden="true"><div class="p"></div><div class="v"></div></div>
    <div class="hint">Arraste para ler · toque duplo aproxima · toque no <i>grifo</i> para anotar</div>
    <div class="toast glass"><small data-r="tk"></small><b data-r="tt"></b><p data-r="tp"></p></div>
    <aside class="drawer glass"><header><h3>Edições</h3><button type="button" data-r="dclose">Fechar</button></header><div class="sub" data-r="dsub"></div><div class="list" data-r="list"></div></aside>`;
  app.appendChild(root);
  // o iPhone às vezes rola um contêiner com overflow escondido (foco, teclado): com o jornal aberto, nada sai do lugar
  const unscroll=el=>el.addEventListener('scroll',()=>{if(OPEN&&(el.scrollLeft||el.scrollTop)){el.scrollLeft=0;el.scrollTop=0;}},{passive:true});unscroll(app);unscroll(root);
  const q=s=>root.querySelector(s),R=k=>root.querySelector(`[data-r="${k}"]`);
  const cam=q('.cam'),pg=q('.pg'),vig=q('.vig'),top=q('.top:not(.fh)'),pager=q('.pager'),mini=q('.mini'),miniv=q('.mini .v'),hint=q('.hint'),botgrad=q('.botgrad'),fold=q('.fold'),turnL=q('.turn'),drawer=q('.drawer');

  // fibra do papel: ruído desenhado uma vez
  {const c=document.createElement('canvas');c.width=c.height=160;const x=c.getContext('2d'),im=x.createImageData(160,160);
    for(let i=0;i<im.data.length;i+=4){const v=200+Math.random()*55|0;im.data[i]=v;im.data[i+1]=v-6;im.data[i+2]=v-18;im.data[i+3]=255;}
    x.putImageData(im,0,0);for(let i=0;i<70;i++){x.strokeStyle=`rgba(90,70,40,${Math.random()*.18})`;x.beginPath();const a=Math.random()*160,b=Math.random()*160;x.moveTo(a,b);x.lineTo(a+Math.random()*14-7,b+Math.random()*14-7);x.stroke();}
    root.style.setProperty('--fiber',`url(${c.toDataURL()})`);}

  const F=()=>o.facts();
  const avail=f=>ED.filter(e=>e.need(f||F()));
  const published=()=>ED.filter(e=>KNOWN.has(e.id));

  /* ---------- câmera da folha ---------- */
  let SW=1,SH=1,ZMIN=1;
  const V={x:0,y:0,z:1,vx:0,vy:0};let tw=0,inert=0;
  function measure(){SW=root.clientWidth||app.clientWidth||1;SH=root.clientHeight||app.clientHeight||1;ZMIN=SW/PW;root.style.setProperty('--hh',Math.round(SH/2)+'px');}
  function clampV(){V.z=Math.min(ZMAX,Math.max(ZMIN,V.z));
    const w=PW*V.z,h=PH*V.z;V.x=w<=SW?(SW-w)/2:Math.min(0,Math.max(SW-w,V.x));V.y=h<=SH?(SH-h)/2:Math.min(0,Math.max(SH-h,V.y));}
  function apply(){clampV();cam.style.transform=`translate(${V.x}px,${V.y}px) scale(${V.z})`;
    const w=Math.min(1,SW/V.z/PW),h=Math.min(1,SH/V.z/PH);miniv.style.left=(4+Math.max(0,-V.x/V.z/PW)*64)+'px';miniv.style.top=(4+Math.max(0,-V.y/V.z/PH)*48)+'px';miniv.style.width=(w*64-3)+'px';miniv.style.height=(h*48-3)+'px';}
  function zoomAt(sx,sy,nz){nz=Math.min(ZMAX,Math.max(ZMIN,nz));const k=nz/V.z;V.x=sx-(sx-V.x)*k;V.y=sy-(sy-V.y)*k;V.z=nz;apply();}
  function tween(to,d){cancelAnimationFrame(tw);const f={x:V.x,y:V.y,z:V.z},t0=performance.now(),D=RM()?1:(d||340);const stp=n=>{const k=Math.min(1,(n-t0)/D),e=1-Math.pow(1-k,3);V.x=f.x+(to.x-f.x)*e;V.y=f.y+(to.y-f.y)*e;V.z=f.z+(to.z-f.z)*e;apply();if(k<1)tw=requestAnimationFrame(stp);};tw=requestAnimationFrame(stp);}
  const P0=e=>o.pt?o.pt(e):[e.clientX,e.clientY];

  /* ---------- página ---------- */
  let cur=null,page='front',OPEN=false;
  function fitHeads(){pg.querySelectorAll('.hl,.ih').forEach(h=>{const max=+h.dataset.l||2;if(!h.dataset.base)h.dataset.base=parseFloat(h.style.fontSize)||parseFloat(getComputedStyle(h).fontSize);let fs=+h.dataset.base;h.style.fontSize=fs+'px';
      const lines=()=>Math.round((h.offsetHeight-parseFloat(getComputedStyle(h).paddingTop))/(fs*1.02));let g=0;while(lines()>max&&fs>34&&g++<80){fs-=2;h.style.fontSize=fs+'px';}});
    pg.querySelectorAll('.band .bt').forEach(b=>{let fs=100;b.style.fontSize=fs+'px';let g=0;while(b.scrollWidth>b.clientWidth+1&&fs>40&&g++<80){fs-=2;b.style.fontSize=fs+'px';}});
    // o texto não pode passar do rodapé: encolhe o corpo do que transbordar
    const ft=pg.querySelector('.foot');if(ft){const lim=ft.offsetTop-6;let g=0;const over=()=>{let m=0;pg.querySelectorAll('.g,.inner').forEach(n=>{m=Math.max(m,n.offsetTop+n.offsetHeight);});return m>lim;};
      while(over()&&g++<10){pg.querySelectorAll('.txt,.deck').forEach(t=>{const fs=parseFloat(getComputedStyle(t).fontSize);t.style.fontSize=(fs*.94).toFixed(1)+'px';});}}}
  function render(e,p){const f=F();
    pg.innerHTML=(p==='front'?head(e)+e.front(e,f)+foot(e):rhead(e)+e.inner.html(e,f)+foot(e))+'<div class="anno"></div>';
    pg.querySelectorAll('.mk').forEach(m=>{if(MARKED.has(m.dataset.mk))m.classList.add('on');});
    fitHeads();
    R('plabel').textContent=p==='front'?'1ª página':'Página '+e.inner.pg;R('pprev').disabled=p==='front';R('pnext').disabled=p!=='front';
    R('sub').textContent=`${(e.ed||'Edição do dia').toUpperCase()} · ${e.day.toUpperCase()}`;
    keepUI();}
  function keepUI(){if(!cur)return;const k=KEPT.has(cur.id),b=R('bsave');b.classList.toggle('on',k);b.querySelector('.lb').textContent=k?'Guardado':'Guardar';b.setAttribute('aria-pressed',String(k));}
  function rectOf(el){let x=0,y=0,n=el;while(n&&n!==pg){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}return{x,y,w:el.offsetWidth,h:el.offsetHeight};}
  const annoEl=a=>a.a.startsWith('@')?pg.querySelector(`[data-mk="${a.a.slice(1)}"]`):pg.querySelector(`[data-a="${a.a}"]`);
  function drawAnno(animate){
    const box=pg.querySelector('.anno');if(!box||!cur)return;box.innerHTML='';
    const list=cur.anno(F(),page);if(!list.length)return;
    const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 1000 748');box.appendChild(svg);
    const anim=animate&&!RM();let delay=0;const placed=[];
    list.forEach(a=>{const el=annoEl(a);if(el){const r=rectOf(el);placed.push({x:r.x-10,y:r.y-6,w:r.w+20,h:r.h+12});}});
    list.forEach((a,i)=>{const el=annoEl(a);if(!el)return;const r=rectOf(el);
      const j=s=>Math.sin(i*9.1+s)*1.6,Pp=pts=>'M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L');let d='';
      if(a.k==='circle'){const cx=r.x+r.w/2,cy=r.y+r.h/2,rx=r.w/2+12,ry=r.h/2+8,pts=[];for(let t=0;t<=1.12;t+=.04){const an=-2.3+t*Math.PI*2,rr=1+.04*Math.sin(t*9+i);pts.push([cx+Math.cos(an)*rx*rr+j(t*5),cy+Math.sin(an)*ry*rr+j(t*7)]);}d=Pp(pts);}
      else{const y=r.y+r.h+2,pts=[];for(let x=0;x<=r.w+6;x+=8)pts.push([r.x-3+x,y+Math.sin(x*.22+i)*1.8]);d=Pp(pts);}
      const p=document.createElementNS(NS,'path');p.setAttribute('d',d);svg.appendChild(p);
      const L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=anim?L:0;
      if(anim)p.animate([{strokeDashoffset:L},{strokeDashoffset:0}],{duration:650,delay,easing:'cubic-bezier(.5,0,.3,1)',fill:'forwards'});
      if(a.note){const n=document.createElement('div');n.className='note';n.textContent=a.note;n.style.setProperty('--r',(i%2?2.5:-3)+'deg');box.appendChild(n);
        const w=n.offsetWidth+6,h=n.offsetHeight+6,c=[[r.x+r.w+18,r.y-6],[r.x,r.y+r.h+14],[r.x-w-18,r.y-6],[r.x,r.y-h-12],[r.x+r.w-w,r.y+r.h+14],[r.x-w-18,r.y-h],[r.x-w-18,r.y+r.h],[r.x+r.w-w,r.y-h-12]];
        const ov=([x,y])=>placed.reduce((s,qq)=>s+Math.max(0,Math.min(x+w,qq.x+qq.w)-Math.max(x,qq.x))*Math.max(0,Math.min(y+h,qq.y+qq.h)-Math.max(y,qq.y)),0);
        const inside=([x,y])=>x>=14&&y>=60&&x+w<=986&&y+h<=716;
        const order=(a.side==='below'?[c[1],...c]:c).filter(inside);
        const [nx,ny]=order.find(cc=>ov(cc)===0)||order.sort((pp,qq)=>ov(pp)-ov(qq))[0]||c[1];placed.push({x:nx,y:ny,w,h});
        n.style.left=nx+'px';n.style.top=ny+'px';
        if(anim)later(()=>{n.classList.add('on');SFX.pen();},delay+500);else n.classList.add('on');}
      delay+=700;});
  }

  /* ---------- abrir, virar, fechar ---------- */
  const tm=[];const later=(f,ms)=>{const t=setTimeout(f,ms);tm.push(t);return t;};
  const clearLater=()=>{while(tm.length)clearTimeout(tm.pop());};
  const strip=c=>{c.removeAttribute('data-r');c.querySelectorAll('[data-r]').forEach(n=>n.removeAttribute('data-r'));return c;};
  function cancelAll(){[cam,vig,top,pager,mini,hint,botgrad].forEach(el=>el.getAnimations().forEach(a=>a.cancel()));}
  function showHud(){const anim=!RM();
    [top,pager,mini,botgrad].forEach((el,i)=>{if(!anim){el.style.opacity=1;return;}el.style.opacity='';el.animate([{opacity:0,transform:el===top?'translateY(-8px)':el===pager?'translate(-50%,8px)':'translateY(8px)'},{opacity:1,transform:el===pager?'translateX(-50%)':'none'}],{duration:350,delay:i*60,fill:'forwards'});});
    if(!st.hinted){st.hinted=true;save();hint.animate([{opacity:0},{opacity:.9,offset:.1},{opacity:.9,offset:.82},{opacity:0}],{duration:4200,fill:'forwards'});}
    const e=cur;later(()=>{if(cur===e&&page==='front'&&OPEN)drawAnno(true);},500);}
  function open(e,auto){
    if(!e)return;clearLater();cancelAll();closeDrawer();Q=Q.filter(x=>x!==e);
    const wasOpen=OPEN,isNew=!READ.has(e.id);cur=e;page='front';
    if(!wasOpen){OPEN=true;root.hidden=false;app.scrollLeft=app.scrollTop=0;measure();if(o.onOpen)o.onOpen();try{root.focus({preventScroll:true});}catch(_){root.focus();}}
    KNOWN.add(e.id);READ.add(e.id);save();refreshBadge();
    render(e,'front');V.x=0;V.y=0;V.z=ZMIN;apply();
    [top,pager,mini,botgrad,hint].forEach(el=>{el.style.opacity=0;});
    if(RM()){vig.style.opacity=1;cam.style.opacity=1;showHud();if(isNew&&auto)SFX.arrive();return;}
    vig.style.opacity='';vig.animate([{opacity:wasOpen?1:0},{opacity:1}],{duration:300,fill:'forwards'});
    cam.style.opacity=0;
    // edição nova: a vinheta toca e a folha cai aberta no impacto
    const stung=isNew&&auto&&SFX.arrive();
    const go=()=>{if(cur!==e||!OPEN)return;
      const [ft,fb]=fold.children;ft.querySelector('.cam')?.remove();fb.querySelector('.cam')?.remove();
      const mk=()=>{const c=strip(cam.cloneNode(true));c.style.opacity=1;return c;};ft.appendChild(mk());fb.insertBefore(mk(),fb.firstChild);fold.style.display='block';
      ft.animate([{transform:'translateY(-40px) scale(.94) rotate(-1.5deg)',opacity:0},{transform:'none',opacity:1}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)',fill:'both'});
      fb.animate([{transform:'rotateX(-92deg)',opacity:0,offset:0},{transform:'rotateX(-92deg)',opacity:1,offset:.28},{transform:'rotateX(8deg)',offset:.82},{transform:'rotateX(0deg)',opacity:1}],{duration:900,easing:'cubic-bezier(.3,.7,.3,1)',fill:'both'});
      fb.querySelector('.sh').animate([{opacity:1},{opacity:1,offset:.3},{opacity:0}],{duration:900,fill:'both'});
      later(SFX.unfold,60);
      later(()=>{if(cur!==e)return;cam.style.opacity=1;fold.style.display='none';[ft,fb].forEach(x=>x.getAnimations().forEach(a=>a.cancel()));showHud();},920);};
    if(stung)later(go,Math.round(STING_HIT*1000)-750);else go();
  }
  function turnTo(p){
    if(!cur||p===page||!OPEN)return;const fwd=p!=='front';
    if(RM()){page=p;render(cur,p);V.x=0;V.y=0;apply();SFX.flip();later(()=>{if(cur&&page===p&&OPEN)drawAnno(false);},0);return;}
    const old=strip(cam.cloneNode(true));old.style.opacity=1;const op=old.querySelector('.pg');op.classList.add('pgc');
    const shade=document.createElement('div');shade.className='shade';op.appendChild(shade);
    turnL.innerHTML='';turnL.appendChild(old);
    page=p;render(cur,p);V.y=0;V.x=0;apply();
    op.style.transformOrigin=fwd?'0 50%':'100% 50%';SFX.flip();
    const a=op.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${fwd?-100:100}deg)`}],{duration:620,easing:'cubic-bezier(.45,.05,.35,1)',fill:'forwards'});
    shade.style.background=`linear-gradient(${fwd?90:270}deg,rgba(0,0,0,.45),rgba(0,0,0,0))`;shade.animate([{opacity:0},{opacity:1}],{duration:620,fill:'forwards'});
    pg.animate([{filter:'brightness(.78)'},{filter:'brightness(1)'}],{duration:620});
    a.onfinish=()=>{turnL.innerHTML='';later(()=>{if(cur&&page===p&&OPEN)drawAnno(true);},150);};
  }
  function close(){
    if(!OPEN)return;OPEN=false;clearLater();closeDrawer();SFX.close();P.clear();pinch=null;cancelAnimationFrame(inert);cancelAnimationFrame(tw);
    [top,pager,mini,botgrad,hint].forEach(el=>{el.getAnimations().forEach(a=>a.cancel());el.style.opacity=0;});
    const done=()=>{cam.getAnimations().forEach(a=>a.cancel());vig.getAnimations().forEach(a=>a.cancel());cam.style.opacity=0;root.hidden=true;fold.style.display='none';turnL.innerHTML='';cur=null;if(o.onClose)o.onClose();freeSince=0;};
    if(RM()){done();return;}
    const t=cam.style.transform;cam.animate([{opacity:1,transform:t},{opacity:0,transform:t+' translateY(140px) rotate(2deg)'}],{duration:420,easing:'cubic-bezier(.6,0,.8,.4)',fill:'forwards'});
    vig.animate([{opacity:1},{opacity:0}],{duration:420,fill:'forwards'}).onfinish=done;
  }

  /* ---------- toque ---------- */
  const P=new Map();let pinch=null,lastTap=0,moved=0,lastT=0,lastRustle=0;
  const UI='.top .btns,.pager,.mini,.drawer';
  root.addEventListener('pointerdown',e=>{if(!OPEN||e.target.closest(UI))return;try{root.setPointerCapture(e.pointerId);}catch(_){/* ok */}P.set(e.pointerId,P0(e));cancelAnimationFrame(inert);cancelAnimationFrame(tw);moved=0;
    if(P.size===2){const [a,b]=[...P.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,z:V.z};}lastT=performance.now();V.vx=V.vy=0;});
  root.addEventListener('pointermove',e=>{if(!P.has(e.pointerId))return;const p=P0(e),qq=P.get(e.pointerId);P.set(e.pointerId,p);
    if(P.size===2&&pinch){const [a,b]=[...P.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);zoomAt((a[0]+b[0])/2,(a[1]+b[1])/2,pinch.z*d/pinch.d);moved=99;return;}
    const dx=p[0]-qq[0],dy=p[1]-qq[1];const was=moved;moved+=Math.abs(dx)+Math.abs(dy);if(was<6&&moved>=6&&performance.now()-lastRustle>700){lastRustle=performance.now();SFX.rustle();}
    V.x+=dx;V.y+=dy;apply();const n=performance.now(),dt=Math.max(1,n-lastT);V.vx=dx/dt*16;V.vy=dy/dt*16;lastT=n;});
  const up=e=>{if(!P.has(e.pointerId))return;P.delete(e.pointerId);if(P.size<2)pinch=null;if(P.size)return;const n=performance.now();
    if(moved<6){
      const tgt=document.elementFromPoint(e.clientX,e.clientY);
      const mkEl=tgt&&tgt.closest&&tgt.closest('.np .pg .mk');if(mkEl){markIt(mkEl);return;}
      const go=tgt&&tgt.closest&&tgt.closest('.np .pg [data-goto]');if(go){turnTo('inner');return;}
      if(n-lastTap<320){const [sx,sy]=P0(e);if(V.z<ZMIN*1.25){const nz=Math.max(ZMIN*1.9,1.6),k=nz/V.z;tween({x:sx-(sx-V.x)*k,y:sy-(sy-V.y)*k,z:nz});}else tween({x:0,y:0,z:ZMIN});lastTap=0;}else lastTap=n;return;}
    if(RM())return;const glide=()=>{V.vx*=.92;V.vy*=.92;V.x+=V.vx;V.y+=V.vy;apply();if(Math.abs(V.vx)+Math.abs(V.vy)>.2)inert=requestAnimationFrame(glide);};inert=requestAnimationFrame(glide);};
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  root.addEventListener('wheel',e=>{if(!OPEN)return;e.preventDefault();e.stopPropagation();const [sx,sy]=P0(e);zoomAt(sx,sy,V.z*Math.exp(-e.deltaY*.0018));},{passive:false});
  {let drag=false;const go=e=>{const [px,py]=P0(e);const fx=Math.min(1,Math.max(0,(px-mini.offsetLeft-4)/64)),fy=Math.min(1,Math.max(0,(py-mini.offsetTop-4)/48));
      V.x=-(fx*PW*V.z-SW/2);V.y=-(fy*PH*V.z-SH/2);apply();};
    mini.addEventListener('pointerdown',e=>{e.stopPropagation();if(V.z<=ZMIN*1.01)V.z=Math.max(ZMIN*1.6,1.3);drag=true;try{mini.setPointerCapture(e.pointerId);}catch(_){/* ok */}go(e);});
    mini.addEventListener('pointermove',e=>{if(drag)go(e);});mini.addEventListener('pointerup',()=>{drag=false;});mini.addEventListener('pointercancel',()=>{drag=false;});}
  root.addEventListener('keydown',e=>{if(!OPEN)return;const k=e.key;
    if(k==='ArrowLeft'){V.x+=50;apply();}else if(k==='ArrowRight'){V.x-=50;apply();}else if(k==='ArrowUp'){V.y+=50;apply();}else if(k==='ArrowDown'){V.y-=50;apply();}
    else if(k==='+'||k==='='){zoomAt(SW/2,SH/2,V.z*1.2);}else if(k==='-'){zoomAt(SW/2,SH/2,V.z/1.2);}else if(k==='PageDown'){turnTo('inner');}else if(k==='PageUp'){turnTo('front');}
    else if(k==='Escape'){if(drawer.classList.contains('on'))closeDrawer();else close();}else return;e.preventDefault();e.stopPropagation();});
  window.addEventListener('resize',()=>{if(!OPEN)return;const z0=V.z<=ZMIN*1.01;measure();if(z0)V.z=ZMIN;apply();});

  /* ---------- grifo e recorte ---------- */
  function markIt(m){if(m.classList.contains('on')||!cur)return;MARKED.add(m.dataset.mk);m.classList.add('on');SFX.marker();
    if(!KEPT.has(cur.id))KEPT.add(cur.id);save();keepUI();if(o.onKeep)o.onKeep();
    const mk=cur.mark;toast('Caderneta · recorte',mk?mk.title:'Trecho anotado',mk?mk.kind:'');}
  function toast(k,t,p){const el=q('.toast');R('tk').textContent=k;R('tt').textContent=t;R('tp').textContent=p||'';el.getAnimations().forEach(a=>a.cancel());
    el.animate([{opacity:0,transform:'translateY(10px)',filter:'blur(6px)'},{opacity:1,transform:'none',filter:'blur(0)',offset:.12},{opacity:1,transform:'none',offset:.85},{opacity:0,transform:'translateY(6px)'}],{duration:RM()?2400:2800});}
  R('bsave').addEventListener('click',()=>{if(!cur)return;if(KEPT.has(cur.id))KEPT.delete(cur.id);else{KEPT.add(cur.id);toast('Caderneta','Edição guardada',`${cur.head} · ${cur.day}`);SFX.tick();}save();keepUI();if(o.onKeep)o.onKeep();});
  R('bclose').addEventListener('click',close);
  R('pnext').addEventListener('click',()=>turnTo('inner'));R('pprev').addEventListener('click',()=>turnTo('front'));
  function drawerList(){const L=R('list'),av=published();R('dsub').textContent=`${av.length} ${av.length===1?'edição':'edições'} · ${KEPT.size} na caderneta`;
    L.innerHTML=av.length?av.slice().reverse().map(e=>`<button class="card${cur&&cur.id===e.id?' cur':''}" data-id="${e.id}" type="button"><span class="th${e.extra?' dark':''}"></span><span><small><span>${e.short.split(',')[0]} · ${e.day}</span>${READ.has(e.id)?'':'<span class="new">Nova</span>'}${KEPT.has(e.id)?'<span class="kept">Guardada</span>':''}</small><b>${esc(e.head)}</b></span></button>`).join(''):'<p class="empty">Nenhuma edição ainda. O jornal sai quando o caso vira notícia.</p>';
    L.querySelectorAll('.card').forEach(c=>c.addEventListener('click',()=>open(ED.find(x=>x.id===c.dataset.id),false)));}
  function openDrawer(){drawerList();drawer.classList.add('on');SFX.tick();}
  function closeDrawer(){drawer.classList.remove('on');}
  R('bed').addEventListener('click',()=>drawer.classList.contains('on')?closeDrawer():openDrawer());R('dclose').addEventListener('click',closeDrawer);
  function refreshBadge(){const n=published().filter(e=>!READ.has(e.id)).length,b=R('bdg');b.hidden=!n;b.textContent=n;}

  /* ---------- fila: abre sozinho, uma edição de cada vez, nunca em momento importante ---------- */
  let Q=[],freeSince=0;const due=new Map();
  const FREE_MS=1500,AFTER_FACT_MS=2000;
  function check(){
    const now=performance.now(),f=F();
    // primeira vez com este registro: um caso já em andamento não despeja todas as edições; abre só a mais nova
    if(!st.init){st.init=true;const av=avail(f);av.forEach((e,i)=>{KNOWN.add(e.id);if(i<av.length-1)READ.add(e.id);});save();refreshBadge();}
    for(const e of avail(f))if(!KNOWN.has(e.id)&&!due.has(e.id))due.set(e.id,now+AFTER_FACT_MS);
    for(const [id,t] of due)if(now>=t){due.delete(id);KNOWN.add(id);save();refreshBadge();}
    // publicadas e ainda não lidas entram na fila, na ordem do caso (inclusive as que ficaram para trás numa sessão anterior)
    for(const e of published())if(!READ.has(e.id)&&!Q.includes(e)&&!(OPEN&&cur===e))Q.push(e);
    if(OPEN){if(cur)refreshOpen(f);return;}
    if(!Q.length){freeSince=0;return;}
    if(!o.canOpen()){freeSince=0;return;}
    if(!freeSince){freeSince=now;return;}
    if(now-freeSince>=FREE_MS){freeSince=0;open(Q[0],true);}
  }
  // o save mudou com o jornal aberto (raro): redesenha a edição para a fala ou o rabisco novo
  let lastJ='';function refreshOpen(f){const j=JSON.stringify(f);if(!lastJ){lastJ=j;return;}if(j!==lastJ){lastJ=j;render(cur,page);drawAnno(false);}}
  const timer=setInterval(()=>{if(document.visibilityState==='visible')check();},250);

  /* aba "Jornal" na caderneta do Lemos (src/hud/hud.js): as edições publicadas, guardadas e grifadas; tocar relê */
  const bookTab={k:'jornal',label:'Jornal',count:()=>KEPT.size,
    html:()=>{const av=published().slice().reverse();if(!av.length)return '<li class="empty">Nenhuma edição do Jornal Sereno ainda. Quando o caso virar notícia, a edição sai e fica aqui para reler.</li>';
      return av.map((e,i)=>{const mk=e.mark&&[...MARKED].some(id=>id===e.id)?e.mark:null;
        const sub=[e.short,KEPT.has(e.id)?'guardada':'',mk?`grifo: ${mk.title}`:''].filter(Boolean).join(' · ');
        return `<li class="${READ.has(e.id)?'':'new'}" style="animation-delay:${(.06+i*.05).toFixed(2)}s"><span class="tx"><b>${esc(e.head)}</b><span>${esc(sub)}</span>${mk?`<span>${esc(mk.kind)}. Versão da imprensa, não é prova.</span>`:''}</span><span class="act"><button type="button" data-news="${e.id}" aria-label="Reler ${esc(e.head)}">Ler</button></span></li>`;}).join('');},
    click:ev=>{const b=ev.target.closest('[data-news]');if(!b)return false;const e=ED.find(x=>x.id===b.dataset.news);if(e&&o.closeBook)o.closeBook();if(e)setTimeout(()=>open(e,false),o.closeBook?250:0);return false;}};

  return {
    check,
    open:id=>open(typeof id==='string'?ED.find(e=>e.id===id):id,false),
    close,
    get isOpen(){return OPEN;},
    get queued(){return Q.map(e=>e.id);},
    bookTab,
    /** Recomeçar o caso: esquece tudo (a chave já está em CASE_STORAGE). */
    reset(){KNOWN.clear();READ.clear();KEPT.clear();MARKED.clear();Q=[];due.clear();st={known:[],read:[],kept:[],marked:[],hinted:false,init:true};save();refreshBadge();},
    destroy(){clearInterval(timer);root.remove();}
  };
}
