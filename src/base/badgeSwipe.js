/* Porta de acesso do DHPP: close na leitora de crachá (docs/DHPP_BASE.md, "Porta de acesso").
   A arte é oficial (public/base/acesso/, pedido 2026-10-13-porta-cracha-close): fundo, mão com o crachá e as
   coordenadas em manifest.json. O código põe por cima só o que muda: os LEDs, o texto do visor, da plaquinha e do
   crachá, o cordão e o gesto.
   - O jogador arrasta de qualquer ponto da tela (o crachá acompanha o dedo, sem precisar mirar nele).
   - A borda da tarja precisa entrar no alto da fenda e descer até o fim, sem parar e nem rápido demais.
   - A trilha pontilhada aparece até o primeiro acerto. Ajustes: Gráficos > Cenas rápidas desliga o close
     (a porta volta a abrir sozinha) e Som > Leitora de crachá desliga o bipe e a trava. */
import './badge.css';
import { sfx, sfxEnabled } from '../sfx';
import { fxOn } from '../settings/gameSettings';

const DIR='/base/acesso/';
const KEY='invesphone.badge.ok';
// mão-cracha.png: a borda da tarja (x) e a ponta de baixo do cartão (y); faixa, nome e função do cartão
const CARD={edge:262,bottom:309,top:28,mid:176,band:[84,30,146,34],name:[98,237,138,21],fn:[98,271,92,22]};
const OK_MIN=110,OK_MAX=1800;   // ms para a borda percorrer a fenda inteira

let man=null,arts=null,loading=null;
const img=src=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});
// o fundo oficial chegou com a metade de baixo corrompida: confere se a imagem decodificou inteira e, se não,
// usa o provisório (topo oficial + parte de baixo completada) até o ChatGPT reenviar o arquivo
function whole(i){try{const c=document.createElement('canvas');c.width=32;c.height=16;const g=c.getContext('2d');g.drawImage(i,0,0,32,16);const d=g.getImageData(0,12,32,4).data;for(let k=3;k<d.length;k+=4)if(d[k]<200)return false;return true;}catch(_){return true;}}
// a arte da mão termina num corte reto (embaixo e à direita) no meio da manga; quando a mão sobe até a fenda, o
// corte apareceria. Prolonga a manga na direção do braço repetindo as últimas fileiras de pixels da própria arte.
const ARM={vx:.81,vy:.59,len:760};
function armed(i){
  const w=i.naturalWidth,h=i.naturalHeight,ex=Math.ceil(ARM.len*ARM.vx),ey=Math.ceil(ARM.len*ARM.vy);
  const c=document.createElement('canvas');c.width=w+ex;c.height=h+ey;const g=c.getContext('2d');
  for(let k=ARM.len;k>0;k-=1){const dx=k*ARM.vx,dy=k*ARM.vy;
    g.drawImage(i,0,h-3,w,3,dx,h-3+dy,w,3);g.drawImage(i,w-3,0,3,h,w-3+dx,dy,3,h);}
  // o braço sai da luz: escurece aos poucos para fora do quadro
  g.globalCompositeOperation='source-atop';const gr=g.createLinearGradient(w-40,h-40,w+ex*.6,h+ey*.6);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');
  g.fillStyle=gr;g.fillRect(w-60,h-60,ex+60,ey+60);g.globalCompositeOperation='source-over';
  g.drawImage(i,0,0);return c;
}
export function preloadBadge(){
  if(loading)return loading;
  loading=(async()=>{
    man=await fetch(DIR+'manifest.json').then(r=>r.json());
    let fundo=null;try{fundo=await img(DIR+'fundo.png');if(!whole(fundo))fundo=null;}catch(_){fundo=null;}
    if(!fundo)fundo=await img(DIR+'fundo-provisorio.png');
    const mao=armed(await img(DIR+'mao-cracha.png'));
    arts={fundo,mao};return true;
  })().catch(()=>{arts=null;return false;});
  return loading;
}
/** a arte carregou? sem ela a porta abre sozinha, como antes */
export const badgeReady=()=>!!arts;

const el=(tag,cls,parent,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e;};
const snd=k=>{if(sfxEnabled()&&fxOn('sfx.badge'))sfx[k]&&sfx[k]();};

/** abre o close. o.pt(e) devolve o ponto do toque no sistema do jogo (já desfaz a tela girada);
    o.done(ok) é chamado ao fechar: true com a porta liberada, false se o jogador voltou */
export function openBadge(parent,o){
  if(!arts||!man)return o.done(true);
  const CW=man.canvas.width,CH=man.canvas.height,S=man.slot,lcd=man.display,pl=man.plaque,hs=man.hand;
  const slotX=S.x+S.width/2,slotTop=S.y,slotBot=S.y+S.height;
  const root=el('div','bx',parent);root.setAttribute('role','dialog');root.setAttribute('aria-label','Leitora de crachá');
  const stage=el('div','bx-stage',root);stage.style.width=CW+'px';stage.style.height=CH+'px';
  const bg=el('img','bx-bg',stage);bg.src=arts.fundo.src;bg.alt='';bg.draggable=false;
  const plq=el('div','bx-plq',stage,'SÓ AGENTES');Object.assign(plq.style,{left:pl.x+'px',top:pl.y+'px',width:pl.width+'px',height:pl.height+'px'});
  const scr=el('div','bx-lcd',stage);Object.assign(scr.style,{left:lcd.x+'px',top:lcd.y+'px',width:lcd.width+'px',height:lcd.height+'px'});
  const led=(p,cls)=>{const e=el('i','bx-led '+cls,stage);Object.assign(e.style,{left:p.x+'px',top:p.y+'px',width:p.radius*2+'px',height:p.radius*2+'px'});return e;};
  const ledR=led(man.readerLed,'r'),ledL=led(man.lockLed,'l');
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','bx-svg');svg.setAttribute('viewBox',`0 0 ${CW} ${CH}`);stage.appendChild(svg);
  const first=(()=>{try{return localStorage.getItem(KEY)!=='1';}catch(_){return true;}})();
  const hint=document.createElementNS(NS,'path');hint.setAttribute('class','bx-hint');if(first)svg.appendChild(hint);
  const cordO=document.createElementNS(NS,'path'),cordI=document.createElementNS(NS,'path'),cordH=document.createElementNS(NS,'path');
  cordO.setAttribute('class','bx-cord o');cordI.setAttribute('class','bx-cord i');cordH.setAttribute('class','bx-cord h');svg.append(cordO,cordI,cordH);
  const hand=el('div','bx-hand',stage);const hi=arts.mao.cloneNode();hi.getContext('2d').drawImage(arts.mao,0,0);hi.setAttribute('aria-label','Mão de Lemos com o crachá');const hin=el('div','bx-hin',hand);hin.appendChild(hi);
  const txt=(r,cls,t)=>{const e=el('b','bx-card '+cls,hin,t);Object.assign(e.style,{left:r[0]+'px',top:r[1]+'px',width:r[2]+'px',height:r[3]+'px'});};
  txt(CARD.band,'org','DHPP');txt(CARD.name,'nm','LEMOS');txt(CARD.fn,'fn','INVESTIGAÇÃO');
  const tip=el('p','bx-tip',root);
  const back=el('button','bx-x',root,'Voltar');back.type='button';

  // enquadramento: cobre a tela sem cortar a leitora e a mão; em tela estreita, cabe pela largura
  let s=1,ox=0,oy=0;
  function fit(){const vw=root.clientWidth||1,vh=root.clientHeight||1;
    s=Math.min(Math.max(vw/CW,vh/CH),vw/(CW-640));
    ox=Math.min(0,Math.max(vw-CW*s,vw/2-1000*s));oy=CH*s>vh?Math.min(0,Math.max(vh-CH*s,vh/2-CH*s*.52)):(vh-CH*s)/2;
    stage.style.transform=`translate(${ox}px,${oy}px) scale(${s})`;}

  const rest={x:hs.suggestedX,y:hs.suggestedY};let hx=rest.x,hy=rest.y;
  let st='idle',drag=null,ent=null,busy=false,msgT=0;
  const P=()=>({x:hx+CARD.edge,y:hy+CARD.bottom});
  function place(){hand.style.transform=`translate(${hx}px,${hy}px)`;
    // cordão: sai do alto do cartão e sobe para fora do quadro, com folga quando a mão sobe
    const ax=hx+CARD.mid,ay=hy+CARD.top,bx=CW-170,by=-40,d=Math.hypot(ax-bx,ay-by),sag=Math.max(30,(980-d)*.55);
    const p=`M${ax} ${ay} Q ${(ax+bx)/2+40} ${(ay+by)/2+sag} ${bx} ${by}`;cordO.setAttribute('d',p);cordI.setAttribute('d',p);cordH.setAttribute('d',p);
    if(first){const q=P();hint.setAttribute('d',`M${q.x-6} ${q.y-20} C ${q.x-120} ${q.y-40}, ${slotX+110} ${slotTop-10}, ${slotX+4} ${slotTop+4} L ${slotX+4} ${slotBot+20}`);}}
  function lcdMsg(t,cls){scr.textContent=t;scr.className='bx-lcd'+(cls?' '+cls:'');}
  function say(t){tip.textContent=t;}
  function leds(c){ledR.className='bx-led r'+(c?' '+c:'');ledL.className='bx-led l'+(c==='ok'?' ok':'');}
  function reset(){if(busy)return;st='idle';ent=null;lcdMsg('PASSE O CRACHÁ');leds('');hand.classList.remove('in');
    say(first?'Arraste o crachá até a fenda e deslize de cima para baixo':'Deslize o crachá pela fenda');}
  function fail(why){st='fail';ent=null;hand.classList.remove('in');busy=true;lcdMsg('TENTE NOVAMENTE','no');leds('no');say(why);snd('accessNo');
    clearTimeout(msgT);msgT=setTimeout(()=>{busy=false;reset();},1100);}
  function win(){st='ok';busy=true;lcdMsg('ACESSO LIBERADO','ok');leds('ok');say('Acesso liberado');snd('accessOk');hint.remove();
    try{localStorage.setItem(KEY,'1');}catch(_){/* sem armazenamento */}
    setTimeout(()=>{hand.classList.add('away');},380);
    setTimeout(()=>close(true),1150);}

  function down(e){if(e.target===back||busy)return;e.preventDefault();try{root.setPointerCapture(e.pointerId);}catch(_){}
    const q=o.pt(e);drag={id:e.pointerId,x:q.x,y:q.y,hx,hy};hand.classList.add('drag');}
  function move(e){if(!drag||e.pointerId!==drag.id||busy)return;const q=o.pt(e);
    let nx=drag.hx+(q.x-drag.x)/s,ny=drag.hy+(q.y-drag.y)/s;
    nx=Math.max(-CARD.edge+60,Math.min(CW-120,nx));ny=Math.max(-CARD.bottom+90,Math.min(CH-90,ny));
    if(ent){ // dentro da fenda: a borda fica presa nela; só o movimento para baixo conta
      if(Math.abs(nx+CARD.edge-slotX)>120){hx=nx;hy=ny;place();fail('O crachá saiu da fenda');return;}
      const py=ny+CARD.bottom;
      if(py<slotTop-50){ent=null;hand.classList.remove('in');hx=nx;hy=ny;place();lcdMsg('PASSE O CRACHÁ');return;}
      hx=slotX-CARD.edge;hy=ny;
      const p=hy+CARD.bottom;
      if(p>=slotTop&&ent.t0==null){ent.t0=performance.now();lcdMsg('LENDO…','read');snd('swipe');}
      if(ent.t0!=null&&p>=slotBot+8){const dt=performance.now()-ent.t0;
        if(dt<OK_MIN)return fail('Rápido demais: deslize num gesto só, sem pressa');
        if(dt>OK_MAX)return fail('Devagar demais: deslize sem parar no meio');
        place();return win();}
      place();return;}
    hx=nx;hy=ny;const p=P();
    if(Math.abs(p.x-slotX)<48&&p.y>slotTop-80&&p.y<slotTop+30){ent={t0:null};hx=slotX-CARD.edge;hand.classList.add('in');
      if(p.y>=slotTop){ent.t0=performance.now();lcdMsg('LENDO…','read');snd('swipe');}}
    place();}
  function up(e){if(!drag||e.pointerId!==drag.id)return;drag=null;hand.classList.remove('drag');
    if(ent&&!busy){if(ent.t0!=null)fail('Vá até o fim da fenda sem soltar');else{ent=null;hand.classList.remove('in');}}}
  root.addEventListener('pointerdown',down);root.addEventListener('pointermove',move);
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  const key=e=>{if(e.key==='Escape')close(false);};addEventListener('keydown',key);
  back.addEventListener('click',()=>close(false));
  const onR=()=>fit();addEventListener('resize',onR);
  let closed=false;
  function close(ok){if(closed)return;closed=true;clearTimeout(msgT);removeEventListener('keydown',key);removeEventListener('resize',onR);
    root.classList.add('out');setTimeout(()=>root.remove(),260);o.done(ok);}

  fit();reset();place();requestAnimationFrame(()=>{fit();root.classList.add('on');});
  // para os testes: posição da fenda e da borda do crachá na tela
  root.__badge={get state(){return st;},slot:()=>({x:ox+slotX*s,top:oy+slotTop*s,bot:oy+slotBot*s}),edge:()=>{const p=P();return {x:ox+p.x*s,y:oy+p.y*s};},s:()=>s};
  return root;
}
