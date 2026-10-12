/* Porta de acesso do DHPP: leitora de crachá no estilo do rádio da varredura (docs/DHPP_BASE.md, "Porta de acesso").
   Um terminal deitado aparece sobre a cena escurecida, com a fenda em cima; o crachá de Lemos está encaixado nela
   pela tarja. O jogador arrasta (de qualquer ponto da tela) e o crachá corre pela fenda, da esquerda para a direita:
   chegou ao fim, a tela acende verde, a trava solta e a porta abre. Soltou no meio, ele volta e a tela pede de novo.
   Tudo desenhado aqui (sem imagem); a trilha pontilhada aparece até o primeiro acerto.
   Ajustes: Gráficos > Cenas rápidas desliga a leitora (a porta abre sozinha); Som > Leitora de crachá. */
import './badge.css';
import { sfx, sfxEnabled } from '../sfx';
import { fxOn } from '../settings/gameSettings';

const KEY='invesphone.badge.ok';
// medidas do palco (px antes da escala): terminal, fenda e o curso do crachá
const DEV={x:60,y:150,w:400,h:170},SLOT={x:76,y:162,w:368,h:16};
const CARD={w:208,h:132,y:SLOT.y+SLOT.h/2+4-132},X0=-6,X1=300,STAGE={w:520,h:340};

const el=(tag,cls,parent,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e;};
const snd=k=>{if(sfxEnabled()&&fxOn('sfx.badge'))sfx[k]&&sfx[k]();};

// assinatura rabiscada do crachá
const SIGN='<svg viewBox="0 0 80 18" aria-hidden="true"><path d="M2 13c4-9 7-10 8-6s-3 9 1 7 6-11 9-9-2 9 2 8 4-6 7-6 1 6 4 5 5-7 9-7-2 5 2 5 7-3 10-4 5 1 9-1"/></svg>';
function cardHTML(){
  let bars='';for(let i=0,x=0;i<26;i++){const w=1+((i*7)%3);bars+=`<i style="left:${x}px;width:${w}px"></i>`;x+=w+1+((i*5)%2);}
  return `<div class="bc-gl" aria-hidden="true"></div>
  <div class="bc-hd"><span class="bc-crest" aria-hidden="true"><i>★</i></span><span class="bc-org"><b>DHPP</b><small>DEPARTAMENTO DE HOMICÍDIOS<br>E DE PROTEÇÃO À PESSOA</small></span><span class="bc-hole" aria-hidden="true"></span></div>
  <div class="bc-ph" aria-hidden="true"><i class="h"></i><i class="b"></i><i class="holo"></i></div>
  <dl class="bc-f">
    <dt>NOME</dt><dd class="nm">LEMOS</dd>
    <dt>FUNÇÃO</dt><dd>INVESTIGAÇÃO</dd>
    <div class="row"><div><dt>MATRÍCULA</dt><dd>04.117-3</dd></div><div><dt>VALIDADE</dt><dd>12/2003</dd></div></div>
  </dl>
  <div class="bc-sg">${SIGN}<span>ASSINATURA</span></div>
  <div class="bc-bar" aria-hidden="true">${bars}</div>
  <div class="bc-tag">USO OBRIGATÓRIO NAS DEPENDÊNCIAS</div>
  <div class="bc-mag" aria-hidden="true"></div>`;
}

/** a leitora não depende de arte: está sempre pronta */
export const badgeReady=()=>true;

/** abre a leitora. o.pt(e) devolve o ponto do toque no sistema do jogo (já desfaz a tela girada);
    o.done(ok) é chamado ao fechar: true com a porta liberada, false se o jogador voltou */
export function openBadge(parent,o){
  const root=el('div','bx',parent);root.setAttribute('role','dialog');root.setAttribute('aria-label','Leitora de crachá');
  const stage=el('div','bx-stage',root);stage.style.width=STAGE.w+'px';stage.style.height=STAGE.h+'px';
  const NS='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','bx-svg');svg.setAttribute('viewBox',`0 0 ${STAGE.w} ${STAGE.h}`);stage.appendChild(svg);
  const cordO=document.createElementNS(NS,'path'),cordI=document.createElementNS(NS,'path');cordO.setAttribute('class','bx-cord o');cordI.setAttribute('class','bx-cord i');svg.append(cordO,cordI);
  // terminal
  const dev=el('div','bx-dev',stage);Object.assign(dev.style,{left:DEV.x+'px',top:DEV.y+'px',width:DEV.w+'px',height:DEV.h+'px'});
  dev.innerHTML=`<i class="bx-screw" style="left:10px;bottom:10px"></i><i class="bx-screw" style="right:10px;bottom:10px"></i>
    <div class="bx-lcd"><div class="l1"><span>CH 01</span><span class="bat"><i></i><i></i><i></i></span></div><b class="l2"></b><b class="l3"></b><div class="l4"><i></i></div></div>
    <div class="bx-side"><span class="bx-ledrow"><i class="bx-led lock"></i>TRAVA</span><span class="bx-ledrow"><i class="bx-led pwr"></i>REDE</span>
    <div class="bx-brand"><b>DHPP</b><span>HOMICÍDIOS</span></div></div>`;
  const slot=el('div','bx-slot',stage);Object.assign(slot.style,{left:SLOT.x+'px',top:SLOT.y+'px',width:SLOT.w+'px',height:SLOT.h+'px'});
  const first=(()=>{try{return localStorage.getItem(KEY)!=='1';}catch(_){return true;}})();
  const hint=el('div','bx-hint',stage,'<i></i><b>▶</b>');Object.assign(hint.style,{left:(X0+CARD.w+8)+'px',top:(SLOT.y+SLOT.h/2-2)+'px',width:(X1-X0+8)+'px'});if(!first)hint.remove();
  const card=el('div','bx-card',stage,cardHTML());card.setAttribute('aria-label','Crachá de Lemos, investigação, DHPP');
  // a borda de cima do terminal passa por cima da tarja: o crachá parece entrar na fenda
  const lip=el('div','bx-lip',stage);Object.assign(lip.style,{left:(SLOT.x-4)+'px',top:(SLOT.y+SLOT.h/2-1)+'px',width:(SLOT.w+8)+'px'});
  const tip=el('p','bx-tip',root);
  const back=el('button','bx-x',root,'Voltar');back.type='button';
  const l2=dev.querySelector('.l2'),l3=dev.querySelector('.l3'),bar=dev.querySelector('.l4 i'),lcd=dev.querySelector('.bx-lcd'),lock=dev.querySelector('.lock');

  let s=1,ox=0,oy=0;
  function fit(){const vw=root.clientWidth||1,vh=root.clientHeight||1;
    s=Math.max(.55,Math.min(1.7,(vw-24)/STAGE.w,(vh-96)/STAGE.h));ox=(vw-STAGE.w*s)/2;oy=Math.max(8,(vh-STAGE.h*s)/2-6);
    stage.style.transform=`translate(${ox}px,${oy}px) scale(${s})`;}

  let cx=X0,st='idle',drag=null,busy=false,tmr=0,read=false;
  function place(){card.style.transform=`translate(${cx}px,${CARD.y}px)`;
    // cordão: do furo do crachá até fora do quadro, em cima, com folga
    const ax=cx+CARD.w-22,ay=CARD.y+14,bx=STAGE.w/2+40,by=-60,sag=Math.max(20,120-Math.abs(ax-bx)*.25);
    const p=`M${ax} ${ay} Q ${(ax+bx)/2} ${(ay+by)/2+sag} ${bx} ${by}`;cordO.setAttribute('d',p);cordI.setAttribute('d',p);
    bar.style.width=Math.max(0,Math.min(1,(cx-X0)/(X1-X0)))*100+'%';}
  function lcdMsg(a,b,cls){l2.textContent=a;l3.textContent=b;lcd.className='bx-lcd'+(cls?' '+cls:'');}
  function idle(){if(busy)return;st='idle';read=false;lcdMsg('ACESSO RESTRITO','PASSE O CRACHÁ');lock.className='bx-led lock';
    tip.textContent=first?'Arraste o crachá pela fenda, da esquerda para a direita':'Passe o crachá pela fenda';}
  function slideBack(){card.classList.add('ret');cx=X0;place();setTimeout(()=>card.classList.remove('ret'),260);}
  function fail(){st='fail';busy=true;read=false;lcdMsg('TENTE NOVAMENTE','PASSE ATÉ O FIM','no');lock.className='bx-led lock no';tip.textContent='Leve o crachá até o fim da fenda, sem soltar';snd('accessNo');
    slideBack();clearTimeout(tmr);tmr=setTimeout(()=>{busy=false;idle();},1100);}
  function win(){st='ok';busy=true;lcdMsg('ACESSO LIBERADO','BOM TRABALHO, LEMOS','ok');lock.className='bx-led lock ok';tip.textContent='Acesso liberado';hint.remove();snd('accessOk');
    try{localStorage.setItem(KEY,'1');}catch(_){/* sem armazenamento */}
    setTimeout(()=>card.classList.add('away'),420);setTimeout(()=>close(true),1050);}

  function down(e){if(e.target===back||busy)return;e.preventDefault();try{root.setPointerCapture(e.pointerId);}catch(_){}
    drag={id:e.pointerId,x:o.pt(e).x,cx};card.classList.add('drag');}
  function move(e){if(!drag||e.pointerId!==drag.id||busy)return;
    cx=Math.max(X0,Math.min(X1,drag.cx+(o.pt(e).x-drag.x)/s));
    if(!read&&cx>X0+18){read=true;st='read';lcdMsg('LENDO…','','read');snd('swipe');}
    place();if(cx>=X1)win();}
  function up(e){if(!drag||e.pointerId!==drag.id)return;drag=null;card.classList.remove('drag');
    if(busy)return;if(read&&cx<X1)fail();else if(cx>X0)slideBack();}
  root.addEventListener('pointerdown',down);root.addEventListener('pointermove',move);
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  const key=e=>{if(e.key==='Escape')close(false);};addEventListener('keydown',key);
  back.addEventListener('click',()=>close(false));
  const onR=()=>fit();addEventListener('resize',onR);
  let closed=false;
  function close(ok){if(closed)return;closed=true;clearTimeout(tmr);removeEventListener('keydown',key);removeEventListener('resize',onR);
    root.classList.add('out');setTimeout(()=>root.remove(),260);o.done(ok);}

  fit();idle();place();requestAnimationFrame(()=>{fit();root.classList.add('on');});
  // para os testes: onde o crachá está e quanto ele precisa andar, na tela
  root.__badge={get state(){return st;},card:()=>({x:ox+(cx+CARD.w/2)*s,y:oy+(CARD.y+CARD.h/2)*s}),travel:()=>(X1-X0)*s};
  return root;
}
