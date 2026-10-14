/* HUD do Lemos (docs/HUD_LEMOS.md): quase nada na tela até algo acontecer.
   - Retrato do Lemos: o rosto num círculo pequeno, com o nome e a luz verde de "em serviço"; acende um anel âmbar quando há descoberta.
   - Faixas de cinema: nos lugares que importam, faixas pretas entram em cima e embaixo e o nome do lugar aparece na de baixo.
   - Última descoberta: cartão de vidro com sino, luz atravessando e palavras saindo do desfoque; tocar abre o material.
   - Evidência: o documento se comprime num ponto de luz e voa em rastro até a caderneta (ondas, faíscas, o número rola).
   - Caderneta: pessoas e pistas do caso (do save) e as suspeitas, hipóteses e notas que o jogador escreve.
   Partículas e luz num canvas próprio por cima de tudo (só roda quando há algo animando). Cada efeito tem ajuste em
   src/settings/gameSettings.ts: Gráficos > Interface (partículas, nome do lugar, retrato animado) e Som > Sons da interface. */
import './hud.css';
import { hudSfx as SFX } from './hudAudio';
import { fxOn, onFxChange } from '../settings/gameSettings';
import { getQuality } from '../characters/quality';

export const NOTEBOOK_KEY='invesphone.caderneta';
const RM=typeof matchMedia!=='undefined'?matchMedia('(prefers-reduced-motion: reduce)'):null;
const reduce=()=>!!(RM&&RM.matches);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const el=(tag,cls,parent,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;if(parent)parent.appendChild(e);return e;};
const ICON={
  target:'<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2"/><path d="M8 0v3M8 13v3M0 8h3M13 8h3"/></svg>',
  x:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  strike:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12M5 4.5c.6-1 1.7-1.5 3-1.5 1.8 0 3 .9 3 2M11 11.5c-.6 1-1.7 1.5-3 1.5-1.8 0-3-.9-3-2"/></svg>'
};

function loadNb(){const z={sus:[],susTxt:[],hip:[],notas:[],seen:[]};try{const v=JSON.parse(localStorage.getItem(NOTEBOOK_KEY)||'{}')||{};for(const k in z)if(Array.isArray(v[k]))z[k]=v[k];}catch(_){/* sem armazenamento */}return z;}
function saveNb(nb){try{localStorage.setItem(NOTEBOOK_KEY,JSON.stringify(nb));}catch(_){/* sem armazenamento */}}

/** o.app: #app; o.data(): {people:[{id,name,role,photo,state}],clues:[{id,title,desc}]}; o.clock(): hora do jogo;
    o.onBook(aberta): avisa quando a caderneta abre/fecha (o jogo pausa o toque no mapa) */
export function createHud(o){
  const app=o.app;
  // faixas de cinema: a de cima é só a faixa; a de baixo leva o nome do lugar
  const room=el('div','lh-room',app,'<i class="lb top"></i><div class="lb bot"><b class="t"></b><i class="rl"></i><span class="s"></span></div>');room.setAttribute('aria-hidden','true');
  const disc=el('button','lh-disc lh-glass',app,'<small><i></i><em></em></small><b></b><span class="go"><span>Toque para abrir</span><span class="hr"></span></span><span class="tm"><i></i></span>');disc.type='button';
  const ev=el('div','lh-ev lh-glass',app,'<svg viewBox="0 0 38 46" aria-hidden="true"><path d="M2 2h24l10 10v32H2z"/><path d="M26 2v10h10M8 20h22M8 26h22M8 32h14"/></svg><div><small></small><b></b></div>');ev.setAttribute('aria-hidden','true');
  const scrim=el('div','lh-scrim',app);
  const book=el('div','lh-book lh-glass',app,`<header><h2>Caderneta</h2><button type="button" class="cl">Fechar</button></header>
    <nav class="lh-tabs" role="tablist"><button data-k="caso">Caso</button><button data-k="pessoas">Pessoas</button><button data-k="pistas">Pistas</button><button data-k="suspeitas">Suspeitas</button><button data-k="hipoteses">Hipóteses</button><button data-k="notas">Notas</button><i class="ink"></i></nav>
    <ul class="lh-list"></ul><form class="lh-write" hidden><input type="text" maxlength="140" autocomplete="off" aria-label="Escrever na caderneta"><button type="submit">Anotar</button></form>`);
  book.setAttribute('role','dialog');book.setAttribute('aria-label','Caderneta do Lemos');
  const cv=el('canvas','lh-fx',app),g=cv.getContext('2d');
  const nbBtn=app.querySelector('#b-book'),ctEl=app.querySelector('#nb-ct');
  const still=()=>app.classList.toggle('lh-still',!fxOn('hud.portrait')||reduce());still();onFxChange(still);
  const tm=[];const later=(f,ms)=>{const t=setTimeout(f,ms);tm.push(t);return t;};

  /* ---------- partículas e luz ---------- */
  const P=[],FX=[];let raf=0,last=0,T=0,W=1,H=1,SPR={},acc='#ffcf8a';
  const fxOk=()=>fxOn('hud.particles')&&!reduce();
  const mult=()=>({low:.4,medium:.7,high:1})[getQuality()]||1;
  function rgba(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}
  function sprite(col){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.18,rgba(col,1));gr.addColorStop(.45,rgba(col,.35));gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return c;}
  function sprites(){const cs=getComputedStyle(app);acc=cs.getPropertyValue('--lh-acc').trim()||'#ffcf8a';SPR.a=sprite(acc);SPR.b=sprite(cs.getPropertyValue('--lh-acc2').trim()||'#ff9d5c');SPR.w=sprite('#fffaf0');}
  // luz e poeira são suaves: 1,5× já fica nítido e custa bem menos que 2×
  function size(){W=app.clientWidth||1;H=app.clientHeight||1;const d=Math.min(1.5,window.devicePixelRatio||1);if(cv.width!==Math.round(W*d)||cv.height!==Math.round(H*d)){cv.width=Math.round(W*d);cv.height=Math.round(H*d);}g.setTransform(cv.width/W,0,0,cv.height/H,0,0);}
  function add(p){P.push(Object.assign({vx:0,vy:0,age:0,life:1,size:3,drag:.985,grav:0,turb:0,alpha:1,col:'a',delay:0,seed:Math.random()*9},p));}
  function burst(x,y,n,spd,col,life){n=Math.round(n*mult());for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=spd*(.3+Math.random());add({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:life*(.5+Math.random()*.7),size:1.5+Math.random()*2.5,drag:.93,col:col||(Math.random()<.5?'a':'w'),grav:.02});}}
  function start(){if(raf)return;if(!SPR.a)sprites();size();cv.classList.add('on');last=performance.now();raf=requestAnimationFrame(frame);}
  function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;T+=dt;
    g.clearRect(0,0,W,H);g.globalCompositeOperation='lighter';
    for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.t+=dt;const k=Math.min(1,f.t/f.dur);
      if(f.k==='flare'){const open=1-Math.pow(1-Math.min(1,k*2.2),3),fade=k<.55?1:Math.max(0,1-(k-.55)/.45),w=Math.min(W*.92,780)*open,cx=W/2;
        g.globalAlpha=.55*fade;g.drawImage(SPR.a,cx-w/2,f.y-26,w,52);g.globalAlpha=.9*fade;g.drawImage(SPR.w,cx-w*.35,f.y-3,w*.7,6);g.globalAlpha=.7*fade;g.drawImage(SPR.w,cx-40,f.y-40,80,80);}
      else if(f.k==='ring'){const e=1-Math.pow(1-k,3),r=f.r0+(f.r1-f.r0)*e;g.globalAlpha=(1-k)*.85;g.strokeStyle=rgba(acc,1);g.lineWidth=f.w*(1-k)+.4;g.beginPath();g.arc(f.x,f.y,r,0,7);g.stroke();}
      else if(f.k==='comet'){const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,u=1-e,x=u*u*f.x0+2*u*e*f.cx+e*e*f.x1,y=u*u*f.y0+2*u*e*f.cy+e*e*f.y1;
        for(let j=0;j<3;j++)add({x:x+(Math.random()-.5)*4,y:y+(Math.random()-.5)*4,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,life:.45+Math.random()*.3,size:1.5+Math.random()*2.2,drag:.95,col:Math.random()<.6?'a':'w'});
        g.globalAlpha=1;g.drawImage(SPR.w,x-14,y-14,28,28);g.globalAlpha=.6;g.drawImage(SPR.a,x-30,y-30,60,60);
        if(k>=1&&f.done){const d=f.done;f.done=null;d();}}
      if(k>=1)FX.splice(i,1);}
    for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=dt;continue;}p.age+=dt;if(p.age>=p.life){P.splice(i,1);continue;}
      p.vx*=p.drag;p.vy*=p.drag;p.vy+=p.grav;if(p.turb){p.vx+=Math.sin(p.y*.025+T*1.3+p.seed)*p.turb*dt;p.vy+=Math.cos(p.x*.02+T*1.1+p.seed)*p.turb*dt;}
      p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;const t=p.age/p.life,a=p.alpha*(t<.15?t/.15:1-(t-.15)/.85),s=p.size*(1+.4*(1-t));
      g.globalAlpha=Math.max(0,a);g.drawImage(SPR[p.col],p.x-s*2,p.y-s*2,s*4,s*4);}
    g.globalAlpha=1;g.globalCompositeOperation='source-over';
    if(P.length||FX.length)raf=requestAnimationFrame(frame);else{raf=0;g.clearRect(0,0,W,H);cv.classList.remove('on');}}
  onFxChange(()=>{if(SPR.a)sprites();});
  // posição de um elemento dentro do #app, sem contar a rotação da tela
  function pos(e){let x=0,y=0;while(e&&e!==app){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent;}return {x,y};}

  /* ---------- faixas de cinema ---------- */
  // as faixas entram (0,6 s), o nome aparece na de baixo, fica uns 3 s e tudo sai junto
  // enquanto as faixas estão na tela, nada fica por cima: o cabeçalho e os avisos somem (#app.lh-cine) e a fila de
  // descobertas espera; se o jogador abrir conversa, depoimento ou foto, as faixas saem na hora (stopRoom)
  let dissolveT=0,goneT=0,roomAt=0,roomCut=null;
  // onCut: chamado se as faixas forem interrompidas antes de o nome ser lido (menos de 2,5 s), para o jogo mostrar de novo
  function showRoom(name,sub,onCut){
    if(!fxOn('hud.room'))return false;
    clearTimeout(dissolveT);clearTimeout(goneT);room.classList.remove('on','out');roomAt=performance.now();roomCut=onCut||null;
    room.querySelector('.t').textContent=name;room.querySelector('.s').textContent=sub||'';
    app.classList.add('lh-cine');void room.offsetWidth;room.classList.add('on');SFX.room();
    dissolveT=later(dissolve,3800);return true;
  }
  function dissolve(){
    if(!room.classList.contains('on')||room.classList.contains('out'))return;
    room.classList.add('out');app.classList.remove('lh-cine');goneT=later(()=>room.classList.remove('on','out'),700);
  }
  const roomOn=()=>room.classList.contains('on')&&!room.classList.contains('out');
  function stopRoom(){if(!roomOn())return;clearTimeout(dissolveT);if(roomCut&&performance.now()-roomAt<2500)roomCut();roomCut=null;dissolve();}

  /* ---------- última descoberta ---------- */
  let discT=0,discOpen=null;
  function showDiscovery(d){
    clearTimeout(discT);disc.classList.remove('on','off');discOpen=d.onOpen||null;
    disc.querySelector('em').textContent='Nova descoberta'+(d.who?' · '+d.who:'');
    disc.querySelector('b').innerHTML=String(d.title).split(' ').map((w,i)=>`<span style="animation-delay:${(.3+i*.09).toFixed(2)}s">${esc(w)}</span>`).join(' ');
    disc.querySelector('.hr').textContent=o.clock?o.clock():'';
    disc.querySelector('.go span').textContent=discOpen?'Toque para abrir':'Anotado na caderneta';
    void disc.offsetWidth;disc.classList.add('on');SFX.disc();
    app.classList.add('lh-alert');later(()=>app.classList.remove('lh-alert'),2600);
    if(fxOk())later(()=>{start();const p=pos(disc),n=Math.round(36*mult());for(let i=0;i<n;i++)add({x:p.x+Math.random()*disc.offsetWidth,y:p.y+2+Math.random()*4,vx:(Math.random()-.3)*1.2,vy:-.4-Math.random()*1.4,life:.8+Math.random()*.9,size:1+Math.random()*2,drag:.96,turb:.8,col:Math.random()<.6?'a':'w'});burst(p.x+22,p.y+20,14,2.2,'a',.7);},160);
    discT=later(hideDiscovery,8200);
  }
  function hideDiscovery(){if(!disc.classList.contains('on'))return;disc.classList.add('off');disc.classList.remove('on');later(()=>{if(!disc.classList.contains('on'))disc.classList.remove('off');},700);}
  disc.addEventListener('click',()=>{const f=discOpen;hideDiscovery();clearTimeout(discT);SFX.open();if(f)f();else openBook('pistas');});

  /* ---------- evidência anexada ---------- */
  let count=0;
  function setCount(n,anim){count=n;ctEl.innerHTML=`<span>${n}</span>`;if(anim){nbBtn.classList.remove('hit','roll');void nbBtn.offsetWidth;nbBtn.classList.add('hit','roll');later(()=>nbBtn.classList.remove('hit','roll'),2200);}}
  function showEvidence(d,done){
    ev.querySelector('small').textContent=d.label||'Pista registrada';ev.querySelector('b').textContent=d.title;
    ev.classList.remove('go','on');void ev.offsetWidth;ev.classList.add('on');SFX.evIn();
    const c=pos(ev),cx=c.x+ev.offsetWidth/2,cy=c.y+ev.offsetHeight/2;
    if(fxOk()){start();burst(cx,cy,18,1.6,'w',.8);FX.push({k:'ring',x:cx,y:cy,r0:30,r1:150,dur:.9,w:2,t:0});}
    later(()=>{ev.classList.remove('on');ev.classList.add('go');
      const arrive=()=>{SFX.hit();const b=pos(nbBtn),tx=b.x+nbBtn.offsetWidth/2,ty=b.y+nbBtn.offsetHeight/2;
        if(fxOk()){FX.push({k:'ring',x:tx,y:ty,r0:6,r1:70,dur:.8,w:3,t:0},{k:'ring',x:tx,y:ty,r0:4,r1:40,dur:.55,w:2,t:0});burst(tx,ty,34,3.2,null,.9);}
        setCount(d.n,true);if(done)done();};
      if(fxOk()){SFX.fly();start();const b=pos(nbBtn),tx=b.x+nbBtn.offsetWidth/2,ty=b.y+nbBtn.offsetHeight/2;
        FX.push({k:'comet',x0:cx,y0:cy,x1:tx,y1:ty,cx:(cx+tx)/2+60,cy:Math.min(cy,ty)-110,dur:.78,t:0,done:arrive});}
      else later(arrive,350);},1250);
    later(()=>ev.classList.remove('go'),1800);
  }

  /* ---------- fila: um acontecimento de cada vez ---------- */
  const Q=[];let qBusy=false;
  function pump(){if(qBusy||!Q.length)return;if(roomOn()||(o.canShow&&!o.canShow())){later(pump,600);return;}const it=Q.shift();qBusy=true;
    if(it.k==='disc'){showDiscovery(it.d);later(()=>{qBusy=false;pump();},1300);}
    else if(it.k==='ev'){showEvidence(it.d,()=>{});later(()=>{qBusy=false;pump();},2300);}
    else{qBusy=false;pump();}}

  /* ---------- caderneta ---------- */
  let nb=loadNb(),tab='caso';
  const list=book.querySelector('.lh-list'),form=book.querySelector('.lh-write'),input=form.querySelector('input'),ink=book.querySelector('.ink');
  const PH={suspeitas:'Escreva uma suspeita',hipoteses:'Escreva uma hipótese',notas:'Escreva uma nota'};
  const now=()=>o.clock?o.clock():'';
  function li(cls,i,inner){return `<li class="${cls}" style="animation-delay:${(.06+i*.05).toFixed(2)}s">${inner}</li>`;}
  function render(){
    const D=o.data(),ppl=D.people,cl=D.clues;
    book.querySelectorAll('.lh-tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.k===tab);b.setAttribute('aria-selected',String(b.dataset.k===tab));
      const n={caso:0,pessoas:ppl.length,pistas:cl.length,suspeitas:nb.sus.length+nb.susTxt.length,hipoteses:nb.hip.length,notas:nb.notas.length}[b.dataset.k];b.innerHTML=b.dataset.k[0].toUpperCase()+({caso:'aso',pessoas:'essoas',pistas:'istas',suspeitas:'uspeitas',hipoteses:'ipóteses',notas:'otas'}[b.dataset.k])+(n?`<sup>${n}</sup>`:'');});
    const on=book.querySelector('.lh-tabs button.on');ink.style.left=on.offsetLeft+'px';ink.style.width=on.offsetWidth+'px';
    let h='';
    // o caso agora: o que Lemos sabe, o que falta entender e o próximo passo (src/case/guide.ts)
    if(tab==='caso'){const G=D.guide;
      h=G?li('cg',0,`<span class="tx"><small>${esc(G.status)}</small><span><em>Sabemos</em>${esc(G.known)}</span><span><em>Falta entender</em><b>${esc(G.question)}</b></span></span>`)
        +(G.next?li('cg nx',1,`<span class="tx"><small>Próximo passo</small><b>${esc(G.next.title)}</b><span>${esc(G.next.text)}</span><button type="button" data-a="go">${esc(G.next.cta)} ›</button></span>`):''):'<li class="empty">Nada em andamento.</li>';}
    if(tab==='pessoas'){h=ppl.map((p,i)=>li('',i,`<span class="av" style="background-image:url('${p.photo||''}')"></span><span class="tx"><b>${esc(p.name)}</b><span>${esc(p.role)}${p.state?' · '+esc(p.state):''}</span></span><span class="act"><button type="button" data-a="sus" data-id="${p.id}" class="${nb.sus.includes(p.id)?'on':''}" aria-label="${nb.sus.includes(p.id)?'Tirar das suspeitas':'Marcar como suspeito'}">${ICON.target}</button></span>`)).join('');
      if(!ppl.length)h='<li class="empty">Ninguém identificado ainda.</li>';}
    if(tab==='pistas'){const ord=[...cl].reverse();h=ord.map((c,i)=>li(nb.seen.includes(c.id)?'':'new',i,`<span class="tx"><b>${esc(c.title)}</b><span>${esc(c.desc||'')}</span></span>`)).join('');
      if(!cl.length)h='<li class="empty">Nenhuma pista registrada. As pistas entram aqui quando a perícia, a equipe ou um depoimento confirmam um fato.</li>';
      const ids=cl.map(c=>c.id);if(ids.some(id=>!nb.seen.includes(id))){nb.seen=ids;saveNb(nb);}}
    if(tab==='suspeitas'){const sp=nb.sus.map(id=>ppl.find(p=>p.id===id)).filter(Boolean);let i=0;
      h=sp.map(p=>li('',i++,`<span class="av" style="background-image:url('${p.photo||''}')"></span><span class="tx"><b>${esc(p.name)}</b><span>Marcado como suspeito</span></span><span class="act"><button type="button" data-a="sus" data-id="${p.id}" class="on" aria-label="Tirar das suspeitas">${ICON.x}</button></span>`)).join('')
        +nb.susTxt.map((s,k)=>li('',i++,`<span class="tx"><b>${esc(s.t)}</b><span>${esc(s.h||'')}</span></span><span class="act"><button type="button" data-a="del" data-l="susTxt" data-k="${k}" aria-label="Apagar">${ICON.x}</button></span>`)).join('');
      if(!h)h='<li class="empty">Marque alguém em Pessoas ou escreva uma suspeita abaixo.</li>';}
    if(tab==='hipoteses'){h=nb.hip.map((s,k)=>li(s.x?'x':'',k,`<span class="tx"><b>${esc(s.t)}</b><span>${s.x?'Descartada':'Em aberto'}${s.h?' · '+esc(s.h):''}</span></span><span class="act"><button type="button" data-a="strike" data-k="${k}" aria-label="${s.x?'Reabrir':'Descartar'}">${ICON.strike}</button><button type="button" data-a="del" data-l="hip" data-k="${k}" aria-label="Apagar">${ICON.x}</button></span>`)).join('');
      if(!h)h='<li class="empty">Escreva o que você acha que aconteceu. Dá para descartar depois.</li>';}
    if(tab==='notas'){h=nb.notas.map((s,k)=>li('',k,`<span class="tx"><b>${esc(s.t)}</b><span>${esc(s.h||'')}</span></span><span class="act"><button type="button" data-a="del" data-l="notas" data-k="${k}" aria-label="Apagar">${ICON.x}</button></span>`)).join('');
      if(!h)h='<li class="empty">Lembretes do Lemos: quem ouvir, o que pedir à equipe, o que conferir.</li>';}
    list.innerHTML=h;form.hidden=!PH[tab];if(PH[tab])input.placeholder=PH[tab];
  }
  function openBook(t){stopRoom();if(t)tab=t;nb=loadNb();render();book.classList.add('on');scrim.classList.add('on');SFX.page();if(o.onBook)o.onBook(true);}
  function closeBook(){if(!book.classList.contains('on'))return;book.classList.remove('on');scrim.classList.remove('on');SFX.close();input.blur();if(o.onBook)o.onBook(false);}
  book.querySelector('.cl').addEventListener('click',closeBook);scrim.addEventListener('click',closeBook);
  book.querySelector('.lh-tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.k;render();SFX.tick();});
  list.addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='go'){closeBook();if(o.onGuide)o.onGuide();return;}
    if(a==='sus'){const id=b.dataset.id;nb.sus=nb.sus.includes(id)?nb.sus.filter(x=>x!==id):[...nb.sus,id];}
    if(a==='del')nb[b.dataset.l].splice(+b.dataset.k,1);
    if(a==='strike'){const s=nb.hip[+b.dataset.k];s.x=!s.x;}
    saveNb(nb);render();SFX.tick();});
  form.addEventListener('submit',e=>{e.preventDefault();const t=input.value.trim();if(!t)return;const key=tab==='suspeitas'?'susTxt':tab==='hipoteses'?'hip':'notas';
    nb[key].unshift({t,h:now()});saveNb(nb);input.value='';render();SFX.page();});
  // o que se digita na caderneta não vai para o jogo
  form.addEventListener('keydown',e=>e.stopPropagation());
  nbBtn.addEventListener('click',()=>book.classList.contains('on')?closeBook():openBook());
  addEventListener('keydown',e=>{if(e.key==='Escape'&&book.classList.contains('on'))closeBook();});
  addEventListener('resize',()=>{if(raf)size();});

  return {
    room:showRoom,
    roomOn,
    roomAge:()=>roomOn()?performance.now()-roomAt:Infinity,
    stopRoom,
    discovery(d){Q.push({k:'disc',d});pump();},
    evidence(d){Q.push({k:'ev',d});pump();},
    setCount,
    openBook,closeBook,
    get bookOpen(){return book.classList.contains('on');},
    get count(){return count;}
  };
}
