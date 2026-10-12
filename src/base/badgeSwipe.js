/* Porta de acesso do DHPP: leitora de crachá no estilo do rádio da varredura (docs/DHPP_BASE.md, "Porta de acesso").
   Um terminal deitado aparece sobre a cena escurecida, com a fenda em cima; o crachá de Lemos está encaixado nela
   pela tarja. O jogador arrasta (de qualquer ponto da tela) e o crachá corre pela fenda, da esquerda para a direita:
   chegou ao fim, a tela acende verde, a trava solta e a porta abre. Soltou no meio, ele volta e a tela pede de novo.
   Tudo desenhado aqui (sem imagem); a trilha pontilhada aparece até o primeiro acerto.
   Ajustes: Gráficos > Cenas rápidas desliga a leitora (a porta abre sozinha); Som > Leitora de crachá. */
import './badge.css';
import * as SND from './badgeAudio';

const KEY='invesphone.badge.ok';
const PHOTO='/characters/lemos/cracha-foto.png';   // pedido 2026-10-12-lemos-foto-cracha
// medidas do palco (px antes da escala): terminal, fenda e o curso do crachá
const DEV={x:60,y:190,w:400,h:170},SLOT={x:76,y:202,w:368,h:16};
const CARD={w:208,h:132,y:SLOT.y+SLOT.h/2+4-132},X0=-6,X1=300,STAGE={w:520,h:380};

const el=(tag,cls,parent,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e;};

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
  <div class="bc-tag">PESSOAL E<br>INTRANSFERÍVEL</div>
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
    <div class="bx-lcd"><div class="l1"><span class="dt"></span><span class="hr"></span></div><b class="l2"></b><b class="l3"></b><div class="l4"><i></i></div></div>
    <div class="bx-side"><span class="bx-ledrow"><i class="bx-led lock"></i>TRAVA</span><span class="bx-ledrow"><i class="bx-led pwr"></i>REDE</span>
    <div class="bx-brand"><b>DHPP</b><span>HOMICÍDIOS</span></div></div>`;
  const slot=el('div','bx-slot',stage);Object.assign(slot.style,{left:SLOT.x+'px',top:SLOT.y+'px',width:SLOT.w+'px',height:SLOT.h+'px'});
  const first=(()=>{try{return localStorage.getItem(KEY)!=='1';}catch(_){return true;}})();
  const hint=el('div','bx-hint',stage,'<i></i><b>▶</b>');Object.assign(hint.style,{left:(X0+CARD.w+8)+'px',top:(SLOT.y+SLOT.h/2-2)+'px',width:(X1-X0+8)+'px'});if(!first)hint.remove();
  const card=el('div','bx-card',stage,cardHTML());
  {const ph=card.querySelector('.bc-ph'),im=new Image();im.alt='';im.onload=()=>{ph.classList.add('foto');ph.prepend(im);};im.src=PHOTO;}card.setAttribute('aria-label','Crachá de Lemos, investigação, DHPP');
  // a borda de cima do terminal passa por cima da tarja: o crachá parece entrar na fenda
  const lip=el('div','bx-lip',stage);Object.assign(lip.style,{left:(SLOT.x-4)+'px',top:(SLOT.y+SLOT.h/2-1)+'px',width:(SLOT.w+8)+'px'});
  const tip=el('p','bx-tip',root);
  const back=el('button','bx-x',root,'Voltar');back.type='button';
  {const clk=document.querySelector('#clk'),day=document.querySelector('.clk small');
    dev.querySelector('.l1 .dt').textContent=day?day.textContent.replace('·','/'):'';dev.querySelector('.l1 .hr').textContent=clk?clk.textContent:'';}
  const l2=dev.querySelector('.l2'),l3=dev.querySelector('.l3'),bar=dev.querySelector('.l4 i'),lcd=dev.querySelector('.bx-lcd'),lock=dev.querySelector('.lock');

  let s=1,ox=0,oy=0;
  function fit(){const vw=root.clientWidth||1,vh=root.clientHeight||1;
    s=Math.max(.55,Math.min(1.7,(vw-24)/STAGE.w,(vh-96)/STAGE.h));ox=(vw-STAGE.w*s)/2;oy=Math.max(8,(vh-STAGE.h*s)/2-6);
    stage.style.transform=`translate(${ox}px,${oy}px) scale(${s})`;}

  // estado do crachá: posição na fenda (cx), deslocamento vertical (ty), giro em volta do furo do cordão (rot), escala e opacidade
  let cx=X0,ty=0,rot=0,sc=1,op=1,st='idle',drag=null,busy=false,tmr=0,read=false;
  let vel=0,lastX=X0,lastT=0,spring=null,exit=null,raf=0;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const HOLE={x:CARD.w-22,y:14};
  function place(){card.style.transform=`translate(${cx}px,${CARD.y+ty}px) rotate(${rot}deg) scale(${sc})`;card.style.opacity=op;
    // cordão: do furo do crachá até fora do quadro, em cima; quanto mais perto, mais folga
    const ax=cx+HOLE.x,ay=CARD.y+ty+HOLE.y,bx=STAGE.w/2+40,by=-60,d=Math.hypot(ax-bx,ay-by),sag=Math.max(14,(560-d)*.45);
    const p=`M${ax} ${ay} Q ${(ax+bx)/2+sag*.3} ${(ay+by)/2+sag} ${bx} ${by}`;cordO.setAttribute('d',p);cordI.setAttribute('d',p);
    bar.style.width=(st==='ok'?1:Math.max(0,Math.min(1,(cx-X0)/(X1-X0))))*100+'%';}
  function lcdMsg(a,b,cls){l2.textContent=a;l3.textContent=b;lcd.className='bx-lcd'+(cls?' '+cls:'');}
  function idle(){if(busy)return;st='idle';read=false;lcdMsg('ÁREA RESTRITA','PASSE O CRACHÁ');lock.className='bx-led lock';
    tip.textContent=first?'Deslize o crachá pela leitora, sem parar no meio':'Passe o crachá';}
  // volta para o começo da fenda como uma mola, balançando no cordão
  function slideBack(){spring={x:cx,v:-Math.abs(vel)*.4,r:rot,rv:6};}
  function fail(){st='fail';busy=true;read=false;SND.slideStop();lcdMsg('CRACHÁ NÃO LIDO','PASSE NOVAMENTE','no');lock.className='bx-led lock no';tip.textContent='Não leu. Passe de novo, até o fim';SND.no();
    dev.classList.remove('jolt');void dev.offsetWidth;dev.classList.add('jolt');
    slideBack();clearTimeout(tmr);tmr=setTimeout(()=>{busy=false;idle();},1100);}
  // acesso: bipe; o crachá dá um tranco no fim da fenda, salta para fora, balança pendurado e sobe com o cordão.
  // a trava solta logo depois do bipe (baque e tremida do terminal) e a porta desgruda da vedação
  function win(){st='ok';busy=true;drag=null;card.classList.remove('drag');SND.slideStop();SND.ok();
    lcdMsg('ACESSO LIBERADO','LEMOS · INVESTIGAÇÃO','ok');lock.className='bx-led lock ok';tip.textContent='Porta liberada';hint.remove();
    try{localStorage.setItem(KEY,'1');}catch(_){/* sem armazenamento */}
    exit={t0:performance.now(),x0:cx,r0:rot};
    setTimeout(()=>{SND.unlock();dev.classList.add('thunk');lcd.classList.add('flash');},260);
    setTimeout(()=>close(true),reduce?700:1400);}

  function tick(now){
    raf=requestAnimationFrame(tick);
    if(exit){const t=(now-exit.t0)/1000;
      if(reduce){op=Math.max(0,1-t*2);place();return;}
      if(t<.09){const k=t/.09;cx=X1+Math.sin(k*Math.PI)*7;rot=exit.r0*(1-k)+Math.sin(k*Math.PI)*1.5;}             // tranco no fim da fenda
      else if(t<.3){const k=(t-.09)/.21,e=1-Math.pow(1-k,3);cx=X1;ty=-44*e;rot=-9*e;}                                 // salta para fora
      else{const u=t-.3;rot=-9*Math.exp(-2.4*u)*Math.cos(8.5*u);                                                      // pendurado no cordão, balança
        const up=Math.max(0,u-.55);ty=-44+Math.sin(u*7)*2*Math.exp(-3*u)-Math.pow(up,1.7)*420;                       // e depois sobe com ele
        cx=X1+Math.sin(u*2.4)*6;sc=Math.max(.86,1-up*.3);op=up>.3?Math.max(0,1-(up-.3)/.2):1;}
      place();return;}
    if(spring){const dt=1/60,k=170,c=15;
      spring.v+=(-k*(spring.x-X0)-c*spring.v)*dt;spring.x+=spring.v*dt;spring.rv+=(-120*spring.r-9*spring.rv)*dt;spring.r+=spring.rv*dt;
      cx=Math.max(X0-14,spring.x);rot=spring.r;ty=0;
      if(Math.abs(spring.x-X0)<.3&&Math.abs(spring.v)<2&&Math.abs(spring.r)<.1){cx=X0;rot=0;spring=null;}
      place();return;}
    // arrastando: o crachá se inclina contra o movimento (atrito da fenda) e treme de leve enquanto lê
    if(drag&&now-lastT>70)vel*=.82;
    const want=drag?Math.max(-4,Math.min(4,-vel*.006)):0;rot+=(want-rot)*.25;
    ty=read&&drag&&Math.abs(vel)>40?(Math.random()-.5)*.8:0;
    if(read)SND.slide(Math.abs(vel)/700);
    place();
  }

  function down(e){if(e.target===back||busy)return;e.preventDefault();try{root.setPointerCapture(e.pointerId);}catch(_){}
    spring=null;drag={id:e.pointerId,x:o.pt(e).x,cx};lastX=cx;lastT=performance.now();vel=0;card.classList.add('drag');}
  function move(e){if(!drag||e.pointerId!==drag.id||busy)return;
    cx=Math.max(X0,Math.min(X1,drag.cx+(o.pt(e).x-drag.x)/s));
    const t=performance.now(),dt=Math.max(8,t-lastT);vel=vel*.5+((cx-lastX)/dt*1000)*.5;lastX=cx;lastT=t;
    if(!read&&cx>X0+18){read=true;st='read';lcdMsg('LENDO…','','read');SND.slideStart();SND.head();}
    if(cx>=X1){win();return;}}
  function up(e){if(!drag||e.pointerId!==drag.id)return;drag=null;card.classList.remove('drag');
    if(busy)return;if(read&&cx<X1)fail();else if(cx>X0)slideBack();}
  root.addEventListener('pointerdown',down);root.addEventListener('pointermove',move);
  root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);
  const key=e=>{if(e.key==='Escape')close(false);};addEventListener('keydown',key);
  back.addEventListener('click',()=>close(false));
  const onR=()=>fit();addEventListener('resize',onR);
  let closed=false;
  function close(ok){if(closed)return;closed=true;clearTimeout(tmr);cancelAnimationFrame(raf);SND.slideStop();removeEventListener('keydown',key);removeEventListener('resize',onR);
    root.classList.add('out');setTimeout(()=>root.remove(),260);o.done(ok);}

  fit();idle();place();raf=requestAnimationFrame(tick);requestAnimationFrame(()=>{fit();root.classList.add('on');});
  // para os testes: onde o crachá está e quanto ele precisa andar, na tela
  root.__badge={get state(){return st;},get t0(){return exit?exit.t0:0;},card:()=>({x:ox+(cx+CARD.w/2)*s,y:oy+(CARD.y+CARD.h/2)*s}),travel:()=>(X1-X0)*s};
  return root;
}
