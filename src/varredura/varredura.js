/* Varredura das Acácias: cena 2D do Caso 01 (página inicial do site). */
(() => {
'use strict';
const T=32,W=36,H=26,N=W*H;
let ROT=0,userVert=false;
const SW=()=>window.innerWidth,SH=()=>window.innerHeight;
const VW=()=>ROT?SH():SW(),VH=()=>ROT?SW():SH();
const PX=e=>ROT===90?e.clientY:ROT===-90?SH()-e.clientY:e.clientX;
const PY=e=>ROT===90?SW()-e.clientX:ROT===-90?e.clientX:e.clientY;
const START_MIN=4*60+35;
const $=s=>document.querySelector(s);
const cv=$('#cv'),ctx=cv.getContext('2d');
const lc=document.createElement('canvas'),lctx=lc.getContext('2d');
let dpr=1;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const pick=a=>a[Math.floor(Math.random()*a.length)];
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hash(x,y,s){let h=(Math.imul(x,374761393)+Math.imul(y,668265263)+Math.imul(s,982451653))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
const idx=(x,y)=>y*W+x;

/* ---------- Canon (docs/CASE01_STORY_BIBLE.md, src/case01.ts, src/App.tsx) ---------- */
const CLUES={
  porta_intacta:{title:'Porta intacta',desc:'Sem sinais claros de arrombamento na entrada principal.',line:'A entrada está limpa demais pra invasão. Nada de força na porta.',img:'/evidence/case01/new/comodos/comodo_01_entrada.jpg',room:'Entrada'},
  painel_alarme:{title:'Painel do alarme',desc:'Sistema doméstico com uso recente do código mestre.',line:'Nada de força. Teclado inteiro, tampa no lugar. Quem desligou sabia o que estava fazendo ou tinha o código.',img:'/evidence/case01/new/comodos/comodo_09_painel_alarme.jpg',room:'Painel do alarme'},
  valores_intactos:{title:'Valores intactos',desc:'Relógio, joias e eletrônicos de valor permaneceram na casa.',line:'Relógio, joias e eletrônicos continuam no lugar. Coisa fácil de revender, e ninguém levou.',img:'/evidence/case01/new/comodos/comodo_02_sala.jpg',room:'Sala'},
  escritorio_revirado:{title:'Escritório revirado',desc:'Gavetas abertas e papéis espalhados como em uma busca apressada.',line:'Gavetas abertas e papel no chão. De longe parece busca apressada.',img:'/evidence/case01/new/comodos/comodo_04_escritorio.jpg',room:'Escritório'},
  vitimas_dormindo:{title:'Ataque durante o sono',desc:'A posição das vítimas sugere que foram surpreendidas no quarto.',line:'O quarto do casal está como quem foi surpreendido dormindo, sem sinal de luta ao redor.',img:'/evidence/case01/new/comodos/comodo_06_quarto_casal.jpg',room:'Quarto do casal'},
  quarto_livia:{title:'Quarto de Lívia',desc:'Quarto preservado apesar da bagunça em outras áreas da residência.',line:'O quarto da Lívia está intacto, arrumado, como se ninguém tivesse passado por lá.',img:'/evidence/case01/new/comodos/comodo_07_quarto_livia.jpg',room:'Quarto de Lívia'},
  cao_canil:{title:'Thor estava preso',desc:'O cão da família foi colocado no canil antes da ocorrência.',line:'O canil está normal, sem sinal de contenção improvisada. Pra mim ele foi colocado ali antes de a casa virar cena.',img:'/evidence/case01/new/comodos/comodo_08_canil.jpg',room:'Canil'}
};
const CLUE_IDS=Object.keys(CLUES);
const PEOPLE={
  sonia:{name:'Sônia Prado',role:'Delegada',img:'/sonia.jpg'},
  mauricio:{name:'Maurício Farias',role:'Perito criminal',ini:'MF',col:'#9fb7c9'},
  paulo:{name:'Paulo Vieira',role:'Investigador de campo',ini:'PV',col:'#d6b27a'},
  central:{name:'Central',role:'Rádio da operação',ini:'CT',col:'#8fd0a8'}
};

/* ---------- Map ---------- */
const F={GRASS:0,STREET:1,WALK:2,WOOD:3,TILE:4,CONC:5,WALL:6,MURO:7,DOOR:8,WIN:9,GATE:10,DARK:11};
const ROOM_NAME={sala:'sala',cozinha:'cozinha',escritorio:'escritório',casal:'quarto do casal',corredor:'corredor',livia:'quarto de Lívia',quintal:'quintal',terreno:'terreno',rua:'rua'};
const HOUSE_ROOMS=new Set(['sala','cozinha','escritorio','casal','corredor','livia']);
let floor,room,occ,hot,objs;
function buildMap(){
  floor=new Array(N).fill(F.GRASS);room=new Array(N).fill(null);occ=new Array(N).fill(-1);hot=new Array(N).fill(null);objs=[];
  const set=(x0,y0,x1,y1,f,r)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);if(f!=null)floor[i]=f;if(r!==undefined)room[i]=r;}};
  set(0,0,3,H-1,F.STREET,'rua');set(4,0,5,H-1,F.WALK,'rua');
  set(7,2,32,23,F.GRASS,'terreno');
  set(6,1,6,24,F.MURO);set(33,1,33,24,F.MURO);set(6,1,33,1,F.MURO);set(6,24,33,24,F.MURO);
  set(6,6,6,7,F.GATE,'terreno');
  set(7,6,8,7,F.CONC,'terreno');
  set(9,3,28,16,F.WALL,null);
  set(10,4,15,8,F.WOOD,'sala');set(17,4,21,8,F.TILE,'cozinha');set(23,4,27,8,F.WOOD,'escritorio');
  set(10,10,15,15,F.WOOD,'casal');set(17,10,21,15,F.DARK,'corredor');set(23,10,27,15,F.WOOD,'livia');
  set(10,17,27,23,F.CONC,'quintal');
  for(const [x,y,r] of [[9,6,'sala'],[16,6,'sala'],[22,7,'escritorio'],[19,9,'corredor'],[16,12,'casal'],[22,12,'livia'],[19,16,'corredor']]){floor[idx(x,y)]=F.DOOR;room[idx(x,y)]=r;}
  for(const [x,y] of [[12,3],[13,3],[19,3],[24,3],[25,3],[9,12],[9,13],[28,12],[28,13]])floor[idx(x,y)]=F.WIN;
  const add=(t,x,y,w,h,o)=>{const k=objs.length;objs.push(Object.assign({t,x,y,w,h},o||{}));if(!(o&&(o.flat||o.flatOcc)))for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)occ[idx(xx,yy)]=k;if(o&&o.hot)for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)hot[idx(xx,yy)]=o.hot;return k;};
  // sala
  add('sofa',11,7,3,1);add('rack',12,4,2,1,{hot:'valores_intactos'});add('tapete',11,5,3,2,{flat:true});add('planta',15,4,1,1);
  // painel do alarme, na parede ao lado da porta
  hot[idx(10,3)]='painel_alarme';room[idx(10,3)]='sala';
  hot[idx(9,6)]='porta_intacta';
  // cozinha
  add('bancada',17,4,3,1);add('geladeira',21,4,1,1);add('mesac',18,6,2,1);
  // escritório
  add('mesa',24,5,2,1,{hot:'escritorio_revirado'});add('gaveteiro',27,4,1,1,{hot:'escritorio_revirado'});add('estante',23,4,1,1);
  add('papel',23,6,1,1,{flat:true,hot:'escritorio_revirado'});add('papel',26,7,1,1,{flat:true,hot:'escritorio_revirado'});add('papel',25,6,1,1,{flat:true,hot:'escritorio_revirado'});
  // quarto do casal
  add('camacasal',11,11,2,3,{hot:'vitimas_dormindo'});add('criado',10,11,1,1);add('criado',13,11,1,1);add('guarda',14,15,2,1);
  // quarto de Lívia
  add('camalivia',25,11,2,3,{hot:'quarto_livia'});add('guarda',27,10,1,1);add('escrivaninha',23,14,2,1);add('planta',27,15,1,1);
  // corredor
  add('aparador',17,10,1,1);
  // quintal
  add('canil',17,19,4,2,{hot:'cao_canil'});add('arvore',25,21,1,1);add('arvore',12,21,1,1);add('varal',22,18,4,1,{flatOcc:true});add('bicicleta',27,17,1,1);add('arbusto',10,23,1,1);add('arbusto',27,23,1,1);
  // terreno e rua
  add('arvore',31,4,1,1);add('arvore',31,19,1,1);add('arvore',7,21,1,1);add('arvore',30,12,1,1);
  add('viatura',0,9,2,3);add('carro',0,17,2,3);add('poste',5,3,1,1);add('poste',5,21,1,1);add('lixeira',5,13,1,1);add('arvore',4,16,1,1);
  add('vaso',8,5,1,1);add('vaso',8,8,1,1);add('arbusto',7,3,1,1);add('arbusto',32,3,1,1);add('arbusto',32,22,1,1);add('arbusto',7,12,1,1);add('arbusto',7,15,1,1);add('planta',10,8,1,1);
  for(let y=0;y<H;y++){add('arvore',34+(y%2),y*1,1,1);y+=2+Math.floor(hash(1,y,3)*2);}
}
function passable(i){const f=floor[i];if(f===F.WALL||f===F.MURO||f===F.WIN)return false;return occ[i]<0;}
function civPass(i){return passable(i)&&!S.tape[i]&&!CARBLK[i]&&(floor[i]!==F.STREET||((i/W)|0)===CROSS_Y);}
function inLot(x,y){return x>=7&&x<=32&&y>=2&&y<=23;}
function inHouse(i){return HOUSE_ROOMS.has(room[i]);}
function nbs(i,cb){const x=i%W,y=(i/W)|0;if(x>0)cb(i-1);if(x<W-1)cb(i+1);if(y>0)cb(i-W);if(y<H-1)cb(i+W);}

/* ---------- Pathing ---------- */
const seen=new Int32Array(N),par=new Int32Array(N),Q=new Int32Array(N);let stamp=0;
function bfs(start,visit,pass){
  pass=pass||movePass;stamp++;let h=0,t=0;Q[t++]=start;seen[start]=stamp;par[start]=-1;
  const tryN=(n,i)=>{if(seen[n]!==stamp&&pass(n)){seen[n]=stamp;par[n]=i;Q[t++]=n;}};
  while(h<t){const i=Q[h++];if(visit(i))return i;const x=i%W,y=(i/W)|0;if(x>0)tryN(i-1,i);if(x<W-1)tryN(i+1,i);if(y>0)tryN(i-W,i);if(y<H-1)tryN(i+W,i);}
  return -1;
}
function pathTo(e){const p=[];for(let i=e;i!==-1;i=par[i])p.push(i);p.reverse();p.shift();return p;}
function ti(a){return idx(clamp(Math.round(a.x),0,W-1),clamp(Math.round(a.y),0,H-1));}
function findPath(a,pred,pass){const e=bfs(ti(a),pred,pass);if(e<0)return null;return {path:pathTo(e),end:e};}

/* ---------- State ---------- */
let S;
const CREW=[
  {key:'mauricio',ini:'MF',name:'Maurício Farias',role:'Perito criminal',kind:'pericia',skill:1.35,vest:'#2c3e57',accent:'#9fb7c9',hair:'#5a5a5a',x:8,y:7},
  {key:'aux',ini:'AP',name:'Auxiliar de perícia',role:'Perícia · apoio',kind:'pericia',skill:0.8,vest:'#2c3e57',accent:'#c9d3db',hair:'#2a1d18',x:8,y:8},
  {key:'paulo',ini:'PV',name:'Paulo Vieira',role:'Investigador de campo',kind:'campo',skill:1,vest:'#1a1c1e',accent:'#d6b27a',hair:'#3a2416',x:5,y:8},
  {key:'pm1',ini:'PM',name:'Soldado Silva',role:'Polícia Militar · perímetro',kind:'pm',skill:1,vest:'#56687a',accent:'#a9b8c6',hair:'#1f1a18',x:5,y:5},
  {key:'pm2',ini:'PM',name:'Soldado Rocha',role:'Polícia Militar · perímetro',kind:'pm',skill:1,vest:'#56687a',accent:'#a9b8c6',hair:'#3a2416',x:4,y:11}
];
const SKINS=['#f0c9a0','#d9a273','#a8714a','#7a4e30'];
function newGame(){
  buildMap();
  S={tick:0,tape:new Array(N).fill(0),tapeBp:new Array(N).fill(0),desig:new Array(N).fill(0),exam:new Array(N).fill(0),marker:new Array(N).fill(0),
    found:{},order:[],res:{},crew:[],civs:[],contam:0,escorts:0,msgs:[],unread:0,flags:{},nextCiv:200,flash:[]};
  CREW.forEach((c,k)=>S.crew.push({id:k,key:c.key,look:CREW_LOOK[c.key],ini:c.ini,name:c.name,role:c.role,kind:c.kind,skill:c.skill,vest:c.vest,accent:c.accent,hair:c.hair,skin:SKINS[k%4],
    x:c.x,y:c.y,home:idx(c.x,c.y),path:[],job:null,energy:45+Math.random()*30,status:'Aguardando ordem',dir:1,walk:0,moving:false,think:k*6,done:0}));
}
function minutes(){return START_MIN+S.tick/20;}
function clockStr(m){m=m==null?minutes():m;const h=Math.floor(m/60)%24,mm=Math.floor(m%60);return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
function darkness(){const m=minutes();if(m<5*60+20)return 0.72;if(m>=6*60)return 0;return 0.72*(1-(m-(5*60+20))/40);}
function tapeUsed(){let n=0;for(let i=0;i<N;i++)if(S.tape[i]||S.tapeBp[i])n++;return n;}
let FITA_MAX=40;

/* ---------- Messages: radio calls typed out as they come in ---------- */
function pushNote(d){notesEl.appendChild(d);while(notesEl.children.length>2)notesEl.firstChild.remove();}
function msg(from,text){
  const m={from,text,time:clockStr()};S.msgs.push(m);
  const p=PEOPLE[from],d=document.createElement('div');d.className='note radio live';d.style.setProperty('--c',p.col||'#e3c290');
  d.innerHTML=avatar(from)+`<div class="nb"><div class="who"><b></b><span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="ch">${from==='sonia'?'Celular':'Rádio'} · ${m.time}</span></div><p><span class="sr"></span><span class="tx" aria-hidden="true"></span><i class="cur" aria-hidden="true"></i></p></div>`;
  d.querySelector('.who b').textContent=p.name;d.querySelector('.sr').textContent=text;pushNote(d);
  const tx=d.querySelector('.tx');let k=0;
  (function type(){if(!d.isConnected)return;k=Math.min(text.length,k+2);tx.textContent=text.slice(0,k);if(k<text.length)setTimeout(type,28);else{d.classList.remove('live');d.classList.add('done');SND.squelch();}})();
  setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),450);},Math.min(13000,3600+text.length*52));
  const a=S.crew.find(c=>c.key===from);if(a)a.talkUntil=performance.now()+text.length*14+900;
  if(from==='sonia')SND.blip();else if(SND.ok())SND.radio();
  if(!sheetEl.hidden)renderSheet();
}
function avatar(from){const p=PEOPLE[from];if(p.img)return `<img class="av" src="${p.img}" alt="">`;const h=HEADURL[from];return h?`<img class="av px" src="${h}" alt="" style="background:${p.col}">`:`<span class="av" style="background:${p.col};color:#0b0e10">${p.ini}</span>`;}
function sys(text){const d=document.createElement('div');d.className='note sys';d.innerHTML=`<p>${text}</p>`;pushNote(d);setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),450);},2600);}

/* ---------- Discoveries ---------- */
function discover(id,tile){
  if(S.found[id])return;
  S.found[id]={time:clockStr(),n:S.order.length+1};S.order.push(id);S.marker[tile]=S.order.length;S.unread++;
  {const X=(tile%W)*T+16,Y=((tile/W)|0)*TH+(floor[tile]===F.WALL?2*TH-6:TH-4);MARKT[tile]=frame;burstSparks(X,Y,26);ringFx(X,Y,[242,194,48],34,46);setTimeout(()=>ringFx(X,Y,[255,236,170],22,36),180);floatText(X,Y-6,'Achado '+S.order.length+' · '+CLUES[id].title,'#f2c230',190);FX.shake=7;SND.chime();S.flash.push({x:tile%W,y:(tile/W)|0,t:5});}
  flyPolaroid(id,tile,S.order.length);
  msg('mauricio',CLUES[id].line);
  const f=S.found;
  if(f.escritorio_revirado&&f.valores_intactos&&!S.flags.busca){S.flags.busca=1;setTimeout(()=>msg('mauricio','Parece alguém tentando produzir bagunça. Gaveta sem importância aberta, ponto óbvio intacto, objeto caro à vista. Se procuraram algo, sabiam exatamente o que queriam.'),2600);}
  if(S.order.length===3&&!S.flags.three){S.flags.three=1;setTimeout(()=>queueEvent('deixaram'),4200);}
  if(S.order.length===CLUE_IDS.length&&!S.flags.end){S.flags.end=1;setTimeout(showEnd,3000);}
  updateBadge();
}

/* ---------- Crew AI ---------- */
const ENERGY_RATE=0.011;
function endJob(a){const j=a.job;if(j&&j.resKey)delete S.res[j.resKey];a.job=null;a.path=[];}
function adjacentToObj(i,type){let ok=false;nbs(i,n=>{const k=occ[n];if(k>=0&&objs[k].t===type)ok=true;});return ok;}
function periciaFind(a,ok){let tgt=-1;const e=bfs(ti(a),i=>{if(S.desig[i]&&!S.res['p'+i]&&passable(i)&&ok(i)){tgt=i;return true;}let hit=-1;nbs(i,n=>{if(hit<0&&S.desig[n]&&!S.res['p'+n]&&!passable(n)&&ok(n))hit=n;});if(hit>=0){tgt=hit;return true;}return false;});return e<0?null:{path:pathTo(e),tile:tgt};}
function decide(a){
  if(a.order&&a.energy>=12&&orderStep(a))return;
  if(a.energy<(a.order?12:25)){
    const r=findPath(a,i=>adjacentToObj(i,'viatura'));
    if(r){a.job={k:'coffee',p:0};a.path=r.path;a.status='Indo tomar café na viatura';return;}
  }
  if(a.kind==='pm'||a.kind==='campo'){
    let best=null,bd=1e9;
    for(const c of S.civs){if(c.state==='leave'||!inLot(Math.round(c.x),Math.round(c.y))||S.res['c'+c.id])continue;const d=Math.hypot(c.x-a.x,c.y-a.y);if(d<bd){bd=d;best=c;}}
    if(best){a.job={k:'escort',civ:best.id,resKey:'c'+best.id,re:0};S.res['c'+best.id]=a.id;a.status=a.kind==='campo'?'Conversando com curioso':'Afastando curioso';return;}
    if(a.kind==='pm'){
      const r=findPath(a,i=>S.tapeBp[i]&&!S.res['t'+i]);
      if(r){a.job={k:'tape',tile:r.end,resKey:'t'+r.end,p:0};S.res['t'+r.end]=a.id;a.path=r.path;a.status='Esticando fita';return;}
    }
  }
  if(a.kind==='pericia'){
    const r=periciaFind(a,()=>true);
    if(r){a.job={k:'pericia',tile:r.tile,resKey:'p'+r.tile,p:0};S.res['p'+r.tile]=a.id;a.path=r.path;a.status='Indo periciar '+(ROOM_NAME[room[r.tile]]||'área');return;}
  }
  // ocioso: volta para perto do posto
  let count=0;const lim=3+Math.floor(Math.random()*10);
  const homeX=a.home%W,homeY=(a.home/W)|0;
  const r=findPath(a,i=>{const x=i%W,y=(i/W)|0;return Math.abs(x-homeX)+Math.abs(y-homeY)<4&&++count>=lim;});
  if(r&&r.path.length){a.job={k:'wander'};a.path=r.path.slice(0,6);}
  a.status=a.kind==='pericia'?'Aguardando área para periciar':a.kind==='pm'?'Segurando o perímetro':'Observando a rua';
  a.think=30;
}
function runJob(a){
  const j=a.job;
  switch(j.k){
    case 'coffee':
      if(a.path.length)return;
      a.status='Tomando café na viatura';j.p++;
      if(j.p%6===0)steamAt(a.x*T+16+(a.dir||1)*7,a.y*TH+TH-24);
      if(j.p>=70){a.energy=Math.min(100,a.energy+55);endJob(a);if(a.order&&a.order.k==='rest'){a.order=null;updateInfo();}}
      break;
    case 'escort':{
      const c=S.civs.find(k=>k.id===j.civ);
      if(!c||c.state==='leave'){endJob(a);return;}
      if(Math.hypot(c.x-a.x,c.y-a.y)<=1.3){
        c.state='leave';c.path=[];c.wait=0;S.escorts++;
        say(a,pick(a.kind==='campo'?PAULO_LINES:PM_LINES),120);if(Math.random()<0.4)setTimeout(()=>say(c,pick(['Tá bom, tá bom.','Só queria ajudar…','Calma, já vou.'])),900);
        if(a.kind==='campo')a.done++;
        if(a.kind==='campo'&&a.done===2&&!S.flags.jorge){S.flags.jorge=1;setTimeout(()=>msg('paulo','Achei um nome útil: Jorge. É vigia da rua e presta atenção em carro e movimento. Vou separar ele dos curiosos.'),1500);}
        endJob(a);return;
      }
      if(--j.re<=0||!a.path.length){j.re=12;const target=ti(c);const r=findPath(a,i=>i===target);if(r)a.path=r.path;else{endJob(a);return;}}
      break;}
    case 'tape':
      if(!S.tapeBp[j.tile]){endJob(a);return;}
      if(a.path.length)return;
      a.status='Esticando fita';j.p++;
      if(j.p===1)SND.tape();
      if(j.p>=14){S.tapeBp[j.tile]=0;S.tape[j.tile]=1;endJob(a);}
      break;
    case 'pericia':{
      if(!S.desig[j.tile]){endJob(a);return;}
      if(a.path.length)return;
      const h=hot[j.tile];const need=h&&!S.found[h]?60:13;
      a.status='Periciando '+(ROOM_NAME[room[j.tile]]||'área');if(h&&!S.found[h]&&Math.random()<0.025)S.flash.push({x:a.x,y:a.y,t:5});
      const wetOut=room[j.tile]==='quintal'&&rainI()>0.15&&!S.flags.prioQ;if(wetOut)a.status='Periciando o quintal sob a garoa';
      if(Math.random()<0.012){flareAt(a.x*T+16+(a.dir||1)*6,a.y*TH+TH-30,0.7);SND.shutter(0.5);}
      if(room[j.tile]==='casal'&&nightF()>0.1&&Math.random()<0.18){const tx=(j.tile%W)*T+16,ty=((j.tile/W)|0)*TH+TH/2;fxAdd({k:'lum',x:tx+(Math.random()-0.5)*26,y:ty+(Math.random()-0.5)*14,z:0,t:0,life:70+Math.random()*50});}
      j.p+=a.skill*(a.energy<15?0.6:1)*(S.contam>60?0.75:1)*(wetOut?0.55:1)*(S.icUntil>S.tick?1.5:1)*(S.aguiaUntil>S.tick&&!inHouse(j.tile)&&nightF()>0.15?1.6:1);
      if(j.p>=need){S.desig[j.tile]=0;S.exam[j.tile]=1;if(h&&!S.found[h])discover(h,j.tile);endJob(a);}
      break;}
    case 'wander':
      if(!a.path.length){endJob(a);a.think=30;}
      break;
    case 'goto':
      if(!a.path.length){endJob(a);a.think=0;}
      break;
    case 'hold':
      j.p++;
      if(a.order&&a.order.k==='guard'){a.status='Guardando o posto';if(j.p%10===0&&civNear(a,a.order.tile,GUARD_R+1.5)){endJob(a);a.think=0;}}
      else a.status='No local indicado';
      if(j.p>240){endJob(a);a.think=0;}
      break;
    case 'talk':
      if(a.path.length)return;
      a.status='Falando com a imprensa no portão';a.dir=-1;j.p++;
      if(j.p%120===1)say(a,pick(TALK_LINES));
      if(j.p>=520){endJob(a);a.think=10;}
      break;
  }
}
function moveAgent(a,pass,speed){
  a.moving=false;if(!a.path.length)return true;
  const n=a.path[0];
  if(!pass(n)||CARBLK[n])return false;
  const tx=n%W,ty=(n/W)|0,dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
  if(d<=speed){a.x=tx;a.y=ty;a.path.shift();}else{a.x+=dx/d*speed;a.y+=dy/d*speed;}
  if(d>0.001){a.fx=dx/d;a.fy=dy/d;}if(Math.abs(dx)>0.01)a.dir=dx>0?1:-1;a.walk+=speed;a.moving=true;
  a.fs=(a.fs||0)+speed;if(a.fs>0.5){a.fs=0;footFx(a);}return true;
}
function stepCrew(a){
  if(!(a.job&&a.job.k==='coffee'&&!a.path.length))a.energy=Math.max(0,a.energy-ENERGY_RATE);
  if(a.job&&a.job.k!=='coffee'&&a.energy<8){endJob(a);a.think=0;}
  if(a.kind!=='pericia'&&a.job&&(a.job.k==='tape'||a.job.k==='wander')&&!(a.order&&a.order.k!=='guard'&&a.order.k!=='sweep')&&S.civs.some(c=>c.state!=='leave'&&inLot(Math.round(c.x),Math.round(c.y))&&!S.res['c'+c.id])){endJob(a);a.think=0;}
  if(!a.job){if(a.think>0)a.think--;else decide(a);}
  if(a.job)runJob(a);
  if(!moveAgent(a,passable,0.1*(a.energy<15?0.8:1)))endJob(a);
}

/* ---------- Civilians ---------- */
const CIV_SHIRTS=['#8a3b3b','#3b5a8a','#6b6b3b','#5a3b6b','#8a6a3b','#3b7a6b','#9a9a9a'];
let civId=1;
function spawnCiv(){
  const m=minutes();const press=m>=5*60+15&&Math.random()<0.45;
  let x,y;if(Math.random()<0.3){x=0;y=CROSS_Y;}else{x=4+(Math.random()<0.5?0:1);y=Math.random()<0.5?0:H-1;}
  const tgt=pick([idx(7,6),idx(8,7),idx(7,5),idx(7,8),idx(9,6),idx(8,6)]);
  const c={id:civId,look:makeLook(press?'press':'civ',civId++),x,y,ex:idx(x,y),tgt,path:[],state:'go',wait:0,press,shirt:press?'#2a2a2e':pick(CIV_SHIRTS),hair:pick(['#1f1a18','#3a2416','#7a4a22','#8a8a8a']),skin:pick(SKINS),dir:1,walk:0,moving:false,re:0,gawk:300+Math.random()*500};
  S.civs.push(c);setTimeout(()=>framesHDFor(c),0);
}
function civRoute(c,target){
  let best=-1,bd=1e9;const tx=target%W,ty=(target/W)|0;
  bfs(ti(c),i=>{const d=Math.abs(i%W-tx)+Math.abs(((i/W)|0)-ty);if(d<bd){bd=d;best=i;}return i===target;},civPass);
  if(best<0)return [];
  return pathTo(best);
}
function stepCiv(c){
  const i=ti(c),x=i%W,y=(i/W)|0;
  if(c.state==='go'){
    if(--c.re<=0){c.re=40;c.path=civRoute(c,c.tgt);}
    if(!c.path.length){c.state='gawk';c.wait=Math.round(c.gawk*(c.press?(S.flags.pressCalm===1?0.5:S.flags.pressCalm===-1?1.4:1):1));if(Math.random()<0.55)say(c,pick(c.press?PRESS_LINES:CIV_LINES));}
  }else if(c.state==='gawk'){
    if(c.press&&Math.random()<0.006){S.flash.push({x:c.x,y:c.y,t:6});flareAt(c.x*T+16+c.dir*5,c.y*TH+TH-30,1);SND.shutter(0.7);}
    if(c.press&&Math.random()<0.0015)say(c,pick(PRESS_LINES));
    if(--c.wait<=0){c.state='leave';c.path=[];}
  }
  if(c.state==='leave'){
    if(!c.path.length){if(i===c.ex){c.gone=true;return;}let e=bfs(i,k=>k===c.ex,civPass);c.lp=civPass;if(e<0){e=bfs(i,k=>k===c.ex,movePass);c.lp=movePass;}if(e<0){c.gone=true;return;}c.path=pathTo(e);}
  }
  const pass=c.state==='leave'?(c.lp||civPass):civPass;
  // look both ways at the crosswalk
  c.wantCross=false;const lane=k=>isStreet(k)&&(k%W)>=2;if(c.path.length&&lane(c.path[0])&&!lane(i)&&carComing(c.path[0])){c.wantCross=true;c.moving=false;c.dir=1;if(!c.lookT||S.tick-c.lookT>140){c.lookT=S.tick;if(Math.random()<0.4)say(c,'Esperando o carro…',70);}return;}
  if(!moveAgent(c,pass,c.state==='leave'?0.09:0.06)){c.path=[];c.re=0;}
  if(c.state!=='leave'&&inLot(x,y)){S.contam=Math.min(100,S.contam+(inHouse(i)?0.06:(c.press?0.03:0.018)));if(c.moving){c.fp=(c.fp||0)+0.06;if(c.fp>0.4){c.fp=0;footprint(c);}}}
}

/* ---------- World step ---------- */
function stepWorld(){
  for(const p of S.crew){p.px=p.x;p.py=p.y;}for(const c of S.civs){c.px=c.x;c.py=c.y;}for(const a of IML.agents){a.px=a.x;a.py=a.y;}
  S.tick++;
  WET=clamp(WET+(rainI()>0.08?0.002:-0.0011),0,1);
  WIND=0.5+0.35*Math.sin(S.tick/400)+0.15*Math.sin(S.tick/97)+Math.max(FX.hwO||0,FLY.gust||0);
  if(S.barkCd>0)S.barkCd--;if(FX.bark>0)FX.bark--;
  if(!(S.barkCd>0)&&S.civs.some(c=>c.state!=='leave'&&(inLot(Math.round(c.x),Math.round(c.y))||Math.round(c.x)>=5))){S.barkCd=380+Math.floor(Math.random()*200);FX.bark=36;SND.bark();if(FX.dog)floatText(FX.dog.x,FX.dog.y-6,'AU! AU!','#f3f5f6',70);}
  imlStep();
  if(!S.flags.evG&&minutes()>=4*60+41){S.flags.evG=1;queueEvent('garoa');}
  if(!S.flags.evP&&minutes()>=5*60+17){S.flags.evP=1;queueEvent('imprensa');}
  if(--S.nextCiv<=0){const m=minutes();S.nextCiv=Math.floor((m<5*60?260:m<5*60+30?170:120)*(0.6+Math.random()*0.8));if(S.civs.length<9)spawnCiv();}
  for(const a of S.crew)stepCrew(a);
  for(const c of S.civs)stepCiv(c);
  if(S.civs.some(c=>c.gone)){for(const c of S.civs)if(c.gone)delete S.res['c'+c.id];S.civs=S.civs.filter(c=>!c.gone);}
  for(const f of S.flash)f.t--;S.flash=S.flash.filter(f=>f.t>0);
  if(S.contam>=25&&!S.flags.w1){S.flags.w1=1;msg('sonia','Tem gente demais na frente da casa. Isola a rua antes que alguém pise onde não deve.');}
  if(S.contam>=60&&!S.flags.w2){S.flags.w2=1;msg('mauricio','Estão entrando no terreno. Cada pé a mais é vestígio a menos. Vou trabalhar mais devagar.');}
  if(minutes()>=5*60+15&&!S.flags.press){S.flags.press=1;msg('paulo','Chegou imprensa. Câmera na mão e gente querendo foto do portão.');}
  if(minutes()>=5*60+50&&!S.flags.dawn){S.flags.dawn=1;sys('O dia está clareando sobre o Campo Belo.');}
  stepRadio();
}

/* ---------- Art: palette helpers ---------- */
const M=6, TH=22, K=TH/T, CAPH=8, RISE=16;
function hex(c){c=c.replace('#','');return [parseInt(c.slice(0,2),16),parseInt(c.slice(2,4),16),parseInt(c.slice(4,6),16)];}
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function mul(a,f){return [a[0]*f,a[1]*f,a[2]*f];}
function rgbs(a,al){return al==null?`rgb(${a[0]|0},${a[1]|0},${a[2]|0})`:`rgba(${a[0]|0},${a[1]|0},${a[2]|0},${al})`;}
function vn(x,y,s){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const a=hash(ix,iy,s),b=hash(ix+1,iy,s),c=hash(ix,iy+1,s),d=hash(ix+1,iy+1,s);const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;}
const C={};
for(const [k,v] of Object.entries({
  g0:'#3d6a33',g1:'#5b9145',g2:'#77b257',g3:'#8cc366',gd:'#2c4f26',
  a0:'#383b41',a1:'#44474d',a2:'#2f3237',line:'#d9b84a',curb:'#b9b4a7',
  pl:'#dcd6c8',pd:'#3b3a38',pm:'#a8a397',
  t0:'#8a5a35',t1:'#9c6a40',t2:'#7a4e2e',tseam:'#55361f',
  p0:'#9a6e46',p1:'#8a6140',p2:'#a87a4e',pseam:'#5e3f27',
  d0:'#6b4a32',d1:'#5f4130',d2:'#76533a',dseam:'#3e2a1c',
  k0:'#e6dcc6',k1:'#b5583c',k2:'#3d4a4f',kg:'#9e9584',
  c0:'#9c9b91',c1:'#8c8b82',c2:'#a9a89e',
  pav:'#aaa596',pav2:'#bdb8a9'
}))C[k]=hex(v);

/* ---------- Art: sprite toolkit ---------- */
function S2(w,h,fn){
  const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
  const P=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),ww,hh);};
  const E=(cx,cy,rx,ry,col)=>{g.fillStyle=col;for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++){const dy=(y+.5-cy)/ry;if(Math.abs(dy)>1)continue;const hw=rx*Math.sqrt(1-dy*dy);g.fillRect(Math.round(cx-hw),y,Math.max(1,Math.round(hw*2)),1);}};
  fn(P,E,g);return c;
}
function outlined(c,col){
  const w=c.width,h=c.height,o=document.createElement('canvas');o.width=w+2;o.height=h+2;
  const src=c.getContext('2d').getImageData(0,0,w,h).data,g=o.getContext('2d'),out=g.createImageData(w+2,h+2),d=out.data;
  const oc=hex(col||'#1e1611');
  const A=(x,y)=>x<0||y<0||x>=w||y>=h?0:src[(y*w+x)*4+3];
  for(let y=0;y<h+2;y++)for(let x=0;x<w+2;x++){
    const sx=x-1,sy=y-1,k=(y*(w+2)+x)*4,a=A(sx,sy);
    if(a>0){const s=(sy*w+sx)*4;d[k]=src[s];d[k+1]=src[s+1];d[k+2]=src[s+2];d[k+3]=a;}
    else if(A(sx-1,sy)>40||A(sx+1,sy)>40||A(sx,sy-1)>40||A(sx,sy+1)>40){d[k]=oc[0];d[k+1]=oc[1];d[k+2]=oc[2];d[k+3]=235;}
  }
  g.putImageData(out,0,0);return o;
}
function bush(P,E,cx,cy,r,rnd,cols){
  cols=cols||['#24461f','#356a2e','#4a8a3c','#69ad52','#8ccb6a'];
  const blobs=[];for(let k=0;k<7;k++){const a=rnd()*6.28,d=rnd()*r*0.55;blobs.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d*0.8,r*(0.45+rnd()*0.3)]);}
  blobs.push([cx,cy,r*0.7]);
  for(const [x,y,rr] of blobs)E(x,y+2,rr+1,rr*0.9+1,cols[0]);
  for(const [x,y,rr] of blobs)E(x,y,rr,rr*0.88,cols[1]);
  for(const [x,y,rr] of blobs)E(x-rr*0.2,y-rr*0.25,rr*0.7,rr*0.6,cols[2]);
  for(const [x,y,rr] of blobs)E(x-rr*0.35,y-rr*0.45,rr*0.35,rr*0.3,cols[3]);
  for(let k=0;k<10;k++){const a=rnd()*6.28,d=rnd()*r*0.7;P(cx+Math.cos(a)*d,cy+Math.sin(a)*d*0.8-r*0.2,1,1,cols[4]);}
}

/* ---------- Art: furniture & props ---------- */
function GEN(o){
  const rnd=mulberry32((o.x*73+o.y*131+7)|0);
  const fw=o.w*T,fh=o.h*T;
  const make=(tall,fn,extraW,ox,noOutline)=>{const W2=fw+(extraW||0);const c=S2(W2,fh+tall,(P,E,g)=>fn(P,E,g,tall,(ox||0)));return {c:noOutline?c:outlined(c),ox:-(ox||0),oy:-tall,pad:noOutline?0:1};};
  switch(o.t){
    case 'sofa':return make(18,(P,E,g,y0)=>{
      P(0,y0-12,96,20,'#3f5079');P(0,y0-12,96,3,'#5a6fa3');P(0,y0+6,96,2,'#33426a');
      P(6,y0+4,84,16,'#55689a');P(6,y0+4,84,2,'#6b80b5');P(36,y0+5,1,14,'#3f5079');P(60,y0+5,1,14,'#3f5079');
      P(6,y0+18,84,8,'#3a4a70');P(0,y0-6,9,32,'#4a5c8c');P(0,y0-6,9,3,'#6176a8');P(87,y0-6,9,32,'#4a5c8c');P(87,y0-6,9,3,'#6176a8');
      P(12,y0-4,17,12,'#d0a24a');P(12,y0-4,17,2,'#e6bc66');P(67,y0-4,17,12,'#b5583c');P(67,y0-4,17,2,'#cf6f52');
      P(4,y0+26,3,4,'#2a2018');P(89,y0+26,3,4,'#2a2018');});
    case 'rack':return make(30,(P,E,g,y0)=>{
      P(0,y0+2,64,26,'#5a3d28');P(0,y0+2,64,3,'#7a5638');P(2,y0+16,60,1,'#3f2a1b');P(31,y0+5,1,22,'#3f2a1b');
      P(4,y0+19,22,6,'#2b2b2e');P(6,y0+21,3,1,'#54e07a');P(20,y0+21,4,1,'#8a8a8a');
      for(let k=0;k<6;k++)P(36+k*4,y0+19,3,8,['#8a3b3b','#3b5a8a','#d0a24a','#6b6b3b','#5a3b6b','#3b7a6b'][k]);
      P(12,y0-26,40,30,'#34373c');P(12,y0-26,40,2,'#4a4e55');P(16,y0-22,32,21,'#14202a');P(18,y0-20,11,3,'#4b6878');P(18,y0-15,4,2,'#3a5260');P(46,y0-1,3,2,'#e04a3a');P(20,y0+2,24,2,'#26282b');
      P(54,y0-4,9,6,'#7a2232');P(54,y0-4,9,1,'#d4af37');P(57,y0-2,3,1,'#d4af37');
      P(2,y0-3,8,6,'#c9ccd0');P(4,y0-2,4,4,'#f2f2f2');P(5,y0-1,2,1,'#2b2b2b');});
    case 'planta':return make(30,(P,E,g,y0)=>{
      P(9,y0+10,14,16,'#a0623e');P(8,y0+8,16,4,'#b8744a');P(9,y0+10,4,16,'#b8744a');
      bush(P,E,16,y0-4,11,rnd,['#1f4a22','#2f6b2f','#3f8a3c','#5aa64f','#86c76a']);
      P(15,y0-22,2,10,'#2f6b2f');});
    case 'bancada':return make(12,(P,E,g,y0)=>{
      P(0,y0-10,96,16,'#d6cfc0');P(0,y0-10,96,2,'#ece6da');P(0,y0+6,96,24,'#ebe6da');P(0,y0+6,96,2,'#c9c2b3');
      for(let k=0;k<4;k++){P(k*24+23,y0+8,1,22,'#bdb6a7');P(k*24+18,y0+14,1,7,'#8a857c');}
      P(28,y0-8,24,11,'#9aa4a9');P(30,y0-6,20,7,'#78838a');P(39,y0-12,2,6,'#c9cfd2');P(39,y0-12,5,2,'#c9cfd2');
      P(62,y0-9,30,13,'#2b2d30');for(const [x,y] of [[69,-5],[84,-5],[69,1],[84,1]])E(x,y0+y,3.5,2,'#55585e');E(84,y0-6,5,3,'#6b6f75');E(84,y0-7,4,2,'#8a8f96');
      P(6,y0-9,8,6,'#e6e0d2');P(7,y0-8,6,2,'#c0392b');});
    case 'geladeira':return make(34,(P,E,g,y0)=>{
      P(2,y0-32,28,60,'#efefea');P(2,y0-32,28,2,'#ffffff');P(25,y0-32,5,60,'#d5d5cf');P(2,y0-10,28,1,'#b9b9b2');
      P(6,y0-25,2,10,'#9a9a95');P(6,y0-4,2,12,'#9a9a95');P(15,y0-24,3,3,'#e04a3a');P(19,y0-20,4,3,'#3b7ad8');P(11,y0-28,7,5,'#f2e8a0');P(4,y0+26,24,2,'#9a9a95');});
    case 'mesac':return make(12,(P,E,g,y0)=>{
      P(8,y0-10,14,14,'#7a5a3c');P(8,y0-10,14,2,'#94704c');P(42,y0-10,14,14,'#7a5a3c');P(42,y0-10,14,2,'#94704c');
      P(1,y0-2,62,18,'#9a744c');P(1,y0-2,62,3,'#b58d62');P(1,y0+16,62,3,'#7a5a3c');P(3,y0+19,3,9,'#6b4f33');P(58,y0+19,3,9,'#6b4f33');
      P(10,y0+20,12,10,'#7a5a3c');P(10,y0+20,12,2,'#94704c');P(42,y0+20,12,10,'#7a5a3c');P(42,y0+20,12,2,'#94704c');
      E(32,y0+7,8,4,'#e6e0d2');E(29,y0+5,2.5,2.5,'#e0a23a');E(33,y0+4,2.5,2.5,'#c0392b');E(36,y0+6,2.5,2.5,'#7cb342');});
    case 'estante':return make(40,(P,E,g,y0)=>{
      P(1,y0-38,30,66,'#5e4029');P(1,y0-38,30,2,'#7a5638');
      for(const s of [-34,-20,-6,8]){P(3,y0+s,26,12,'#3f2a1b');let x=4;while(x<27){const bw=2+Math.floor(rnd()*3),bh=8+Math.floor(rnd()*4);P(x,y0+s+12-bh,bw,bh,['#8a3b3b','#3b5a8a','#d0a24a','#6b6b3b','#5a3b6b','#c9c1ab','#2f6b4a'][Math.floor(rnd()*7)]);x+=bw+ (rnd()<0.2?2:0);}}});
    case 'mesa':return make(22,(P,E,g,y0)=>{
      P(6,y0-20,22,20,'#d8d0bc');P(6,y0-20,22,2,'#ece6d4');P(9,y0-17,16,12,'#22394a');P(10,y0-16,5,2,'#4f7186');P(12,y0,10,3,'#c9c1ab');
      P(0,y0+2,64,12,'#6e4a2e');P(0,y0+2,64,2,'#8a6440');P(0,y0+14,64,14,'#5a3c25');P(4,y0+18,26,1,'#47301d');
      P(38,y0+18,24,10,'#8a6440');P(40,y0+18,20,3,'#f2efe6');P(43,y0+17,8,2,'#e9e3d4');
      P(8,y0+5,20,5,'#cfc7b2');P(9,y0+6,18,1,'#b5ad98');
      P(32,y0+3,10,8,'#f4f1e8');P(33,y0+5,7,1,'#a9a49a');P(33,y0+7,6,1,'#a9a49a');P(44,y0+6,11,7,'#e9e3d4');P(45,y0+8,8,1,'#a9a49a');
      P(57,y0-12,2,14,'#2b2b2b');P(51,y0-16,12,6,'#3a6b4a');P(51,y0-11,12,1,'#2a4f36');});
    case 'gaveteiro':return make(20,(P,E,g,y0)=>{
      P(3,y0-18,26,46,'#6e4a2e');P(3,y0-18,26,2,'#8a6440');P(5,y0-6,22,1,'#4f3520');P(5,y0+4,22,1,'#4f3520');P(14,y0-14,4,1,'#c9a24a');P(14,y0-2,4,1,'#c9a24a');
      P(1,y0+9,30,11,'#8a6440');P(3,y0+9,26,4,'#f2efe6');P(5,y0+7,10,3,'#e9e3d4');P(14,y0+16,4,1,'#c9a24a');});
    case 'camacasal':return make(14,(P,E,g,y0)=>{
      P(0,y0-14,64,18,'#6b4423');P(0,y0-14,64,3,'#8a5a30');for(const x of [16,32,48])P(x,y0-11,1,13,'#5a3a1e');
      P(0,y0+2,64,92,'#7b4f2a');P(3,y0+4,58,86,'#f1eee6');
      P(6,y0+6,24,13,'#ffffff');P(6,y0+17,24,2,'#d9d5cb');P(34,y0+6,24,13,'#ffffff');P(34,y0+17,24,2,'#d9d5cb');
      P(3,y0+30,58,56,'#9fb2c6');P(3,y0+30,58,3,'#b8c9da');
      for(const [x,y,w] of [[12,40,24],[26,52,30],[8,64,30],[34,74,20],[14,82,26]])P(x,y0+y,w,1,'#8496aa');
      P(52,y0+33,9,22,'#8496aa');P(0,y0+90,64,6,'#6b4423');P(0,y0+90,64,1,'#8a5a30');});
    case 'criado':return make(18,(P,E,g,y0)=>{
      P(4,y0-2,24,28,'#8a5f3a');P(4,y0-2,24,2,'#a3744a');P(6,y0+10,20,1,'#6b4a2e');P(15,y0+15,2,2,'#d0a24a');
      P(13,y0-8,7,6,'#c9a24a');P(9,y0-17,15,10,'#f3e7c3');P(9,y0-17,15,2,'#fff6dc');P(22,y0-5,5,4,'#2b2b2b');P(23,y0-4,3,1,'#e04a3a');});
    case 'guarda':return make(44,(P,E,g,y0)=>{
      P(1,y0-42,fw-2,70,'#8a6440');P(0,y0-44,fw,4,'#a07a52');P(0,y0-41,fw,1,'#6b4a2e');
      const n=Math.max(2,o.w*2);for(let k=1;k<n;k++)P(Math.round(k*fw/n),y0-40,1,66,'#6b4a2e');
      for(let k=0;k<n;k++)P(Math.round((k+0.5)*fw/n)+(k%2?-4:3),y0-12,1,6,'#d0a24a');
      if(o.w>1)P(4,y0-36,fw/2-8,28,'#9fb6c4'),P(5,y0-35,4,26,'#c6d8e2');});
    case 'camalivia':return make(14,(P,E,g,y0)=>{
      P(0,y0-14,64,18,'#ece4f2');P(0,y0-14,64,3,'#ffffff');E(32,y0-10,10,4,'#d9c8e6');
      P(0,y0+2,64,92,'#d8cfe0');P(3,y0+4,58,86,'#fbf8f3');P(6,y0+6,24,12,'#ffffff');P(6,y0+16,24,2,'#e3dde8');P(34,y0+6,24,12,'#ffffff');P(34,y0+16,24,2,'#e3dde8');
      P(3,y0+24,58,62,'#c9a7c7');P(3,y0+24,58,4,'#dcbedb');P(3,y0+28,58,1,'#b593b3');
      for(let y=34;y<84;y+=8)for(let x=8;x<58;x+=8)P(x+((y/8)%2?4:0),y0+y,2,2,'#e8d2e7');
      E(48,y0+14,6,6,'#c08a5a');E(44,y0+8,2.5,2.5,'#c08a5a');E(52,y0+8,2.5,2.5,'#c08a5a');P(46,y0+13,1,1,'#2a1d18');P(50,y0+13,1,1,'#2a1d18');
      P(3,y0+78,58,8,'#9b7fb0');P(3,y0+78,58,1,'#b59ac8');P(0,y0+90,64,6,'#c9bfd3');});
    case 'escrivaninha':return make(18,(P,E,g,y0)=>{
      P(0,y0+2,64,12,'#e3dbd0');P(0,y0+2,64,2,'#f3ede4');P(0,y0+14,64,14,'#d1c8bb');P(34,y0+19,26,1,'#b8ae9f');P(46,y0+22,4,1,'#9a907f');
      P(6,y0-6,13,3,'#c0392b');P(7,y0-3,12,3,'#3b5a8a');P(6,y0,13,3,'#d0a24a');
      P(38,y0-4,16,7,'#5a5f66');P(41,y0-2,4,3,'#2b2f35');P(48,y0-2,4,3,'#2b2f35');
      P(24,y0+4,9,7,'#9b7fb0');P(25,y0+5,7,1,'#c9b6d6');P(58,y0-12,2,14,'#c9b6d6');E(59,y0-14,5,3,'#e7c6e3');});
    case 'aparador':return make(14,(P,E,g,y0)=>{
      P(2,y0,28,26,'#6b4a2e');P(2,y0,28,2,'#8a6440');P(4,y0+12,24,1,'#4f3520');
      P(5,y0-6,11,7,'#d9d2c3');P(5,y0-8,11,3,'#cfc6b4');P(7,y0-4,7,1,'#9a9284');
      P(20,y0-12,9,12,'#c9a24a');P(21,y0-11,7,9,'#8fb0c8');P(23,y0-7,3,4,'#c98e64');});
    case 'canil':return make(26,(P,E,g,y0)=>{
      for(let y=0;y<64;y++)for(let x=0;x<128;x++)P(x,y0+y,1,1,(hash(x,y,41)<0.15)?'#6f6c64':'#7d7a71');
      P(0,y0-24,128,26,'#9a6a4e');for(let r=0;r<5;r++){P(0,y0-24+r*5+4,128,1,'#7a523c');for(let x=(r%2)*8;x<128;x+=16)P(x,y0-24+r*5,1,4,'#7a523c');}
      P(0,y0-26,128,4,'#5c5f63');P(0,y0-26,128,1,'#7a7d82');
      P(6,y0-8,40,34,'#a0612f');P(6,y0-8,4,34,'#b8743a');for(let x=8;x<46;x+=6)P(x,y0-6,1,32,'#8a5226');
      P(2,y0-18,48,11,'#6b3a1e');P(2,y0-18,48,2,'#8a4e2a');E(26,y0+16,9,11,'#21150d');P(17,y0-4,18,5,'#e6d3a8');P(19,y0-3,14,1,'#6b4423');
      E(104,y0+48,6,3,'#3a6fb0');E(104,y0+47,4,2,'#7fb2d9');P(78,y0+50,9,2,'#efeae0');P(77,y0+49,2,4,'#efeae0');P(86,y0+49,2,4,'#efeae0');});
    case 'arvore':return make(58,(P,E,g,y0,ox)=>{
      const cx=ox+16;P(cx-3,y0-8,7,34,'#5a3a1e');P(cx-3,y0-8,2,34,'#74502c');P(cx-6,y0+22,13,4,'#5a3a1e');
      bush(P,E,cx,y0-30,24,rnd,['#1f3f1c','#2f5f2a','#3f7d37','#5aa04a','#7fc363']);},48,24);
    case 'arbusto':return make(14,(P,E,g,y0)=>{bush(P,E,16,y0+8,13,rnd);});
    case 'vaso':return make(22,(P,E,g,y0)=>{
      P(8,y0+8,16,18,'#b0603a');P(7,y0+6,18,4,'#c8744a');P(8,y0+8,4,18,'#c8744a');
      for(let k=0;k<9;k++){const x=10+k*1.5,h=14+rnd()*12;P(x,y0+8-h,2,h,k%2?'#3f8a3c':'#2f6b2f');E(x+1,y0+8-h,2,3,'#5aa64f');}});
    case 'viatura':case 'carro':{const body=o.t==='viatura'?['#e9ece8','#ffffff','#c9ceca']:['#3b6aa8','#5a88c4','#2c5486'];
      return make(10,(P,E,g,y0)=>{
        P(0,y0+12,5,16,'#1a1a1a');P(59,y0+12,5,16,'#1a1a1a');P(0,y0+64,5,16,'#1a1a1a');P(59,y0+64,5,16,'#1a1a1a');
        P(4,y0-6,56,100,body[0]);P(4,y0-6,56,3,body[1]);P(56,y0-6,4,100,body[2]);P(4,y0-6,3,100,body[1]);
        P(9,y0+8,46,14,'#22303c');P(11,y0+9,14,3,'#4f6c82');P(9,y0+66,46,13,'#22303c');P(11,y0+67,12,2,'#4f6c82');
        P(9,y0+22,46,44,body[1]);P(9,y0+22,46,2,'#ffffff');
        P(10,y0+90,9,3,'#fff3b0');P(45,y0+90,9,3,'#fff3b0');P(10,y0-5,9,2,'#c0392b');P(45,y0-5,9,2,'#c0392b');
        if(o.t==='viatura'){P(4,y0+44,56,5,'#1e3f7a');P(12,y0+36,40,7,'#2b2d30');}
        P(30,y0+86,4,6,'#d9d9d9');});}
    case 'poste':return make(74,(P,E,g,y0)=>{
      P(14,y0-66,4,92,'#5a5e64');P(14,y0-66,1,92,'#7a7e84');P(11,y0+22,10,5,'#4a4d52');
      P(14,y0-68,14,3,'#4a4d52');P(22,y0-66,9,6,'#2e3135');P(23,y0-61,7,2,'#ffe9a8');});
    case 'lixeira':return make(10,(P,E,g,y0)=>{P(8,y0-4,16,28,'#3f6a3a');P(8,y0-4,4,28,'#5a8a52');P(6,y0-8,20,5,'#4f7d48');P(6,y0-8,20,1,'#6a9a60');P(12,y0+6,8,1,'#2f5229');});
    case 'bicicleta':return make(12,(P,E,g,y0)=>{
      E(8,y0+18,7,7,'#2b2b2b');E(8,y0+18,5,5,'rgba(0,0,0,0)');E(24,y0+18,7,7,'#2b2b2b');
      g.globalCompositeOperation='destination-out';E(8,y0+18,5,5,'#000');E(24,y0+18,5,5,'#000');g.globalCompositeOperation='source-over';
      P(8,y0+12,16,2,'#c0392b');P(14,y0+6,2,10,'#c0392b');P(12,y0+5,6,2,'#2b2b2b');P(23,y0+4,2,9,'#c0392b');P(21,y0+3,6,2,'#2b2b2b');});
    case 'varal':return make(36,(P,E,g,y0)=>{
      P(0,y0-34,3,60,'#8a8f96');P(125,y0-34,3,60,'#8a8f96');P(0,y0-30,128,1,'#d0d0d0');
});
    case 'tapete':return make(0,(P,E,g,y0)=>{
      P(2,4,fw-4,fh-8,'#7a3a34');P(5,7,fw-10,fh-14,'#a8584a');P(8,10,fw-16,fh-20,'#7a3a34');P(11,13,fw-22,fh-26,'#c9a27a');
      E(fw/2,fh/2,16,9,'#7a3a34');E(fw/2,fh/2,10,5,'#a8584a');for(let x=4;x<fw-4;x+=3){P(x,1,1,3,'#e6d3b0');P(x,fh-4,1,3,'#e6d3b0');}},0,0,true);
    case 'papel':return make(0,(P,E,g)=>{const n=2+Math.floor(rnd()*3);for(let k=0;k<n;k++){const x=2+rnd()*18,y=4+rnd()*18;P(x,y,10,8,k%2?'#efece3':'#e2ddcf');P(x+2,y+2,6,1,'#a9a49a');P(x+2,y+4,5,1,'#a9a49a');}},0,0,true);
  }
  return null;
}


/* ---------- Art: furniture redrawn for the oblique camera ---------- */
function OBLQ(o){
  const rnd=mulberry32((o.x*73+o.y*131+7)|0);
  const fw=o.w*T,fh=o.h*TH;
  const mk=(tall,fn)=>{const c=S2(fw,fh+tall,(P,E,g)=>fn(P,E,g,tall));return {c:outlined(c),ox:0,oy:-tall,pad:1,obl:1};};
  const bed=(pal,deco)=>mk(30,(P,E,g,t)=>{
    // headboard against the wall
    P(0,6,64,t-4,pal.wood);P(0,6,64,3,pal.woodHi);P(2,9,60,1,pal.woodDk);for(const x of [16,32,48])P(x,11,1,t-9,pal.woodDk);P(0,t+1,64,1,pal.woodDk);
    P(0,0,3,fh+t,pal.woodDk);P(61,0,3,fh+t,pal.woodDk);
    // mattress top, foreshortened
    const top=t+2,bot=t+fh-14;
    P(3,top,58,bot-top,pal.sheet);P(3,top,58,1,'#ffffff');
    // pillows
    for(const x of [6,34]){P(x,top+2,24,10,'#ffffff');P(x,top+9,24,3,pal.pillowSh);P(x,top+2,24,1,'#ffffff');P(x+1,top+3,22,1,'#f6f3ec');}
    // blanket
    const by=top+16;P(3,by,58,bot-by,pal.blanket);P(3,by,58,3,pal.blanketHi);P(3,by+3,58,1,pal.blanketSh);
    if(deco)deco(P,E,top,by,bot);
    // blanket falls over the front edge
    P(3,bot,58,9,pal.blanketSh);P(3,bot,58,1,pal.blanket);for(let x=7;x<61;x+=9)P(x,bot+1,1,8,pal.blanketDk);
    // footboard and legs
    P(0,bot+9,64,6,pal.wood);P(0,bot+9,64,1,pal.woodHi);P(0,bot+15,64,1,pal.woodDk);
    P(1,bot+15,4,1,pal.woodDk);P(59,bot+15,4,1,pal.woodDk);
  });
  switch(o.t){
    case 'camacasal':return bed({wood:'#6b4423',woodHi:'#8a5a30',woodDk:'#4a2e17',sheet:'#f1eee6',pillowSh:'#d9d5cb',blanket:'#8fa4bb',blanketHi:'#a9bcd0',blanketSh:'#7287a0',blanketDk:'#62778f'},
      (P,E,top,by,bot)=>{for(const [x,y,w] of [[10,6,22],[30,12,26],[8,19,28]])if(by+y<bot-1)P(x,by+y,w,1,'#7a8ea6');P(46,by+4,10,bot-by-6,'#7a8ea6');});
    case 'camalivia':return bed({wood:'#d8cfe0',woodHi:'#f1ebf6',woodDk:'#b3a6c2',sheet:'#fbf8f3',pillowSh:'#e3dde8',blanket:'#c9a7c7',blanketHi:'#dcbedb',blanketSh:'#b08fae',blanketDk:'#9b7b99'},
      (P,E,top,by,bot)=>{for(let y=by+6;y<bot-2;y+=6)for(let x=8;x<58;x+=8)P(x+((y/6)%2?4:0),y,2,2,'#e8d2e7');
        E(46,top+6,6,5.5,'#c08a5a');E(42,top+1,2.5,2.5,'#c08a5a');E(50,top+1,2.5,2.5,'#c08a5a');P(44,top+5,1,1,'#2a1d18');P(48,top+5,1,1,'#2a1d18');P(45,top+8,3,1,'#8a5a3a');});
    case 'sofa':return mk(20,(P,E,g,t)=>{
      // seen from behind: it faces the TV on the back wall
      const B=t+fh;
      P(10,2,76,12,'#33426a');P(10,2,76,2,'#3f5079');
      P(16,0,16,9,'#d0a24a');P(16,0,16,2,'#e6bc66');P(64,0,16,9,'#b5583c');P(64,0,16,2,'#cf6f52');
      P(6,8,84,B-10,'#4a5c8c');P(6,8,84,3,'#6176a8');P(6,11,84,1,'#3a4a70');
      for(const x of [34,62])P(x,12,1,B-16,'#3f5079');
      for(let k=0;k<5;k++)P(10+Math.floor(rnd()*76),14+Math.floor(rnd()*(B-20)),2,1,'#55689a');
      P(6,B-6,84,4,'#3f5079');
      for(const x of [0,86]){P(x,4,10,B-6,'#55689a');P(x,4,10,3,'#6b80b5');P(x+(x?9:0),4,1,B-6,'#3a4a70');}
      P(4,B-2,3,2,'#2a2018');P(89,B-2,3,2,'#2a2018');P(46,B-2,3,2,'#2a2018');
    });
    case 'mesac':return mk(28,(P,E,g,t)=>{
      // chairs behind
      for(const x of [10,40]){P(x,2,14,t-2,'#7a5a3c');P(x,2,14,2,'#94704c');P(x+2,6,10,1,'#5e4530');P(x+2,11,10,1,'#5e4530');}
      // table top
      const ty=t-6;P(0,ty,64,14,'#9a744c');P(0,ty,64,2,'#b58d62');
      E(32,ty+7,9,4,'#e6e0d2');E(29,ty+5,2.5,2.5,'#e0a23a');E(33,ty+4,2.5,2.5,'#c0392b');E(36,ty+6,2.5,2.5,'#7cb342');
      P(8,ty+3,8,5,'#efece3');P(48,ty+4,7,4,'#efece3');
      // apron and legs
      P(0,ty+14,64,4,'#7a5a3c');P(2,ty+18,3,fh+t-ty-18,'#6b4f33');P(59,ty+18,3,fh+t-ty-18,'#6b4f33');P(12,ty+18,2,fh+t-ty-20,'#5e4530');P(50,ty+18,2,fh+t-ty-20,'#5e4530');
      // a chair pulled out in front, seen from behind
      P(22,ty+12,16,fh+t-ty-12,'#7a5a3c');P(22,ty+12,16,2,'#94704c');P(24,ty+16,12,1,'#5e4530');P(24,ty+21,12,1,'#5e4530');
    });
    case 'bancada':return mk(26,(P,E,g,t)=>{
      const ty=t-4,B=t+fh;
      // backsplash
      P(0,0,96,ty,'#e8e4da');for(let y=3;y<ty;y+=5)P(0,y,96,1,'#d3cec2');for(let x=0;x<96;x+=8)P(x,0,1,ty,'#d3cec2');
      P(36,2,3,8,'#c9cfd2');P(36,2,7,2,'#c9cfd2');
      // counter top
      P(0,ty,96,9,'#d6cfc0');P(0,ty,96,1,'#ece6da');
      P(28,ty+1,24,7,'#9aa4a9');P(30,ty+2,20,5,'#78838a');
      P(62,ty,30,9,'#2b2d30');for(const [x,y] of [[69,3],[84,3],[69,6],[84,6]])E(x,ty+y,3.5,1.5,'#55585e');
      P(6,ty+2,8,5,'#e6e0d2');P(7,ty+3,6,2,'#c0392b');
      // cabinets
      P(0,ty+9,96,B-ty-9,'#ebe6da');P(0,ty+9,96,2,'#c9c2b3');
      for(let k=0;k<4;k++){P(k*24+23,ty+11,1,B-ty-13,'#bdb6a7');P(k*24+18,ty+16,1,6,'#8a857c');}
      P(62,ty+10,30,B-ty-12,'#3a3c40');P(64,ty+13,26,B-ty-18,'#1d1f22');for(const x of [66,73,80,87])E(x,ty+11,1.5,1.5,'#9a9a95');
      P(0,B-2,96,2,'#3a342c');
    });
    case 'escrivaninha':return mk(20,(P,E,g,t)=>{
      const ty=t,B=t+fh;
      P(6,ty-6,13,3,'#c0392b');P(7,ty-3,12,3,'#3b5a8a');P(6,ty-9,13,3,'#d0a24a');
      P(38,ty-8,16,8,'#5a5f66');P(41,ty-6,4,3,'#2b2f35');P(48,ty-6,4,3,'#2b2f35');P(44,ty-10,2,2,'#5a5f66');
      P(57,ty-18,2,18,'#c9b6d6');E(58,ty-19,5,3,'#e7c6e3');
      P(0,ty,64,6,'#f3ede4');P(0,ty,64,1,'#ffffff');P(24,ty+1,9,4,'#9b7fb0');
      P(0,ty+6,64,B-ty-6,'#d1c8bb');P(34,ty+8,28,B-ty-12,'#c6bcae');P(34,ty+14,28,1,'#b8ae9f');P(46,ty+10,4,1,'#9a907f');P(46,ty+17,4,1,'#9a907f');
      P(2,ty+6,3,B-ty-6,'#b8ae9f');
    });
    case 'viatura':case 'carro':{
      const pol=o.t==='viatura';
      const C=pol?{b:'#e4e7e3',hi:'#f6f8f5',sh:'#b9beba',dk:'#8d938f',fr:'#cfd3cf'}:{b:'#3d6db0',hi:'#5d8cce',sh:'#2c5389',dk:'#1f3d66',fr:'#33609e'};
      return mk(18,(P,E,g,t)=>drawCarPx(P,E,C,pol,false));}
    case 'mesa':return mk(26,(P,E,g,t)=>{
      const ty=t,B=t+fh;
      // CRT monitor and lamp
      P(8,ty-24,22,20,'#d8d0bc');P(8,ty-24,22,2,'#ece6d4');P(11,ty-21,16,13,'#22394a');P(12,ty-20,5,2,'#4f7186');P(13,ty-4,12,4,'#c9c1ab');
      P(57,ty-16,2,16,'#2b2b2b');P(51,ty-20,12,6,'#3a6b4a');P(51,ty-15,12,1,'#2a4f36');
      // desk top with papers thrown about
      P(0,ty,64,8,'#8a6440');P(0,ty,64,1,'#a07a52');
      P(33,ty+1,10,5,'#f4f1e8');P(44,ty+2,11,5,'#e9e3d4');P(4,ty+2,8,4,'#cfc7b2');
      // drawers, one pulled open
      P(0,ty+8,64,B-ty-8,'#5a3c25');P(0,ty+8,64,1,'#6e4a2e');P(4,ty+12,26,1,'#47301d');
      P(36,ty+10,26,8,'#8a6440');P(38,ty+10,22,3,'#f2efe6');P(41,ty+9,8,2,'#e9e3d4');P(47,ty+15,4,1,'#c9a24a');
      P(2,B-2,3,2,'#2a1d14');P(59,B-2,3,2,'#2a1d14');
    });
  }
  return null;
}

function drawCarPx(P,E,C,pol,van){
        const RR=(x,y,w,h,c,r)=>{for(let j=0;j<h;j++){const k=j<r?r-j:j>h-1-r?r-(h-1-j):0;P(x+k,y+j,w-2*k,1,c);}};
        const TR=(y0,y1,a0,b0,a1,b1,c)=>{for(let y=y0;y<y1;y++){const u=(y-y0)/Math.max(1,y1-y0-1),l=Math.round(a0+(a1-a0)*u),r=Math.round(b0+(b1-b0)*u);P(l,y,r-l,1,c);}};
        // tyres under the wheel arches
        for(const [x,y,h] of [[5,11,12],[53,11,12],[4,57,17],[54,57,17]]){P(x,y,6,h,'#121214');P(x+(x<10?1:3),y+2,2,h-4,'#2c2d30');}
        // body: rounded tail, flared arches, shaded flanks for volume
        for(let y=2;y<77;y++){
          let ins=0;if(y<11)ins=Math.round(Math.pow((11-y)/9,1.6)*9);if(y>72)ins=y-72;
          const arch=(y>=9&&y<=24)||(y>=55&&y<=74)?1:0;
          const l=7+ins-arch,r=57-ins+arch,w=r-l;if(w<=0)continue;
          P(l,y,w,1,C.b);P(l,y,2,1,C.hi);P(r-3,y,3,1,C.sh);P(r-1,y,1,1,C.dk);
        }
        // tail lights and trunk edge
        P(11,6,6,3,'#b0302a');P(47,6,6,3,'#b0302a');P(12,6,2,1,'#ff7a6a');P(48,6,2,1,'#ff7a6a');P(16,4,32,1,C.hi);
        // cabin: rear window, roof, windshield (narrower than the body, shoulders show beside it)
        TR(13,24,18,46,15,49,'#1c2833');P(19,15,8,1,'#56758c');P(19,16,4,1,'#3d5568');
        RR(15,24,34,20,C.hi,4);P(18,26,24,1,'rgba(255,255,255,.6)');P(17,27,1,14,'rgba(255,255,255,.3)');P(46,27,2,15,'rgba(0,0,0,.12)');
        if(pol){P(17,30,30,8,'#26282c');P(18,31,13,5,'#7a1a18');P(33,31,13,5,'#1a2f6a');P(17,38,30,1,'#111');}
        TR(44,56,15,49,12,52,'#1a2631');for(let k=0;k<6;k++)P(20+k*2,46+k,3,1,'rgba(150,185,210,.55)');P(39,47,5,1,'rgba(150,185,210,.35)');
        P(14,44,1,12,C.dk);P(49,44,1,12,C.dk);
        // mirrors
        P(6,45,4,3,C.dk);P(6,45,4,1,C.hi);P(54,45,4,3,C.dk);P(54,45,4,1,C.hi);
        // hood with creases
        P(11,57,42,1,C.hi);P(22,58,1,9,C.sh);P(41,58,1,9,C.sh);
        if(pol){P(9,61,46,3,'#1e3f7a');P(9,61,46,1,'#2f5aa8');}
        // front face: grille, headlights, plate, bumper
        P(8,68,48,8,C.fr);P(8,68,48,1,C.dk);
        P(20,69,24,4,'#1c1d20');for(let x=21;x<43;x+=3)P(x,70,1,2,'#3a3c40');
        P(9,69,10,4,'#f4ecc8');P(10,70,4,2,'#fffbe8');P(45,69,10,4,'#f4ecc8');P(50,70,4,2,'#fffbe8');
        P(9,73,3,2,'#e08a2a');P(52,73,3,2,'#e08a2a');
        P(6,75,52,4,'#2b2c30');P(6,75,52,1,'#45474c');P(27,74,10,4,'#e8e8e2');P(28,75,8,1,'#5a5a5a');
        P(7,79,50,2,'rgba(0,0,0,.35)');
        if(van){
          // IML van: long cargo roof instead of rear window and cabin roof
          for(let y=6;y<45;y++){const ins=y<10?10-y:0;P(13+ins,y,38-2*ins,1,C.hi);}
          P(13,6,38,1,'#ffffff');P(14,8,1,34,'rgba(255,255,255,.35)');P(48,8,2,35,'rgba(0,0,0,.12)');
          for(let y=12;y<40;y+=7)P(16,y,32,1,C.sh);
          P(23,20,18,7,'#2b2c30');const wl='#e8e8e2';P(25,21,1,5,wl);P(28,21,1,5,wl);P(29,22,1,1,wl);P(30,23,1,1,wl);P(31,22,1,1,wl);P(32,21,1,5,wl);P(35,21,1,5,wl);P(35,25,3,1,wl);
          P(18,40,28,3,'#1e3f7a');
        }
}
/* ---------- Art: people ---------- */
function makeLook(kind,k){
  const r=mulberry32(k*977+13);const pk=a=>a[Math.floor(r()*a.length)];
  const L={skin:pk(['#f0c9a0','#e0b48c','#c98e64','#a8714a','#7a4e30']),hair:pk(['#1f1a18','#3a2416','#5a3a22','#8a5a2b','#c9a46a']),style:pk(['short','side','long','curly']),
    top:pk(['#b5583c','#3b6aa8','#6b8a4a','#8a5bb0','#c9a24a','#d9d4c7','#3b7a6b','#9a3b5a']),pants:pk(['#34507a','#3b5a8a','#2b2f36','#6b5a44']),shoes:pk(['#2b2b2b','#f2f2ee','#6b4423']),kind};
  if(kind==='press'){L.top='#2a2a2e';L.cam=1;}
  return L;
}
const CREW_LOOK={
  mauricio:{skin:'#e0b48c',hair:'#9a9a9a',style:'grey',glasses:1,kind:'pericia',top:'#283a52',pants:'#2b2f36',shoes:'#1a1a1a',gloves:1},
  aux:{skin:'#c98e64',hair:'#2a1d18',style:'short',kind:'pericia',top:'#283a52',pants:'#2b2f36',shoes:'#1a1a1a',gloves:1},
  paulo:{skin:'#b67c52',hair:'#1f1a18',style:'side',kind:'campo',top:'#3a2b22',pants:'#3b5a8a',shoes:'#3a2416'},
  pm1:{skin:'#f0c9a0',hair:'#3a2416',style:'cap',kind:'pm',top:'#7d8187',pants:'#2b2f36',shoes:'#111'},
  pm2:{skin:'#8a5a3a',hair:'#1f1a18',style:'cap',kind:'pm',top:'#7d8187',pants:'#2b2f36',shoes:'#111'},
  pm3:{skin:'#c98e64',hair:'#1f1a18',style:'cap',kind:'pm',top:'#7d8187',pants:'#2b2f36',shoes:'#111'}
};
function personFrames(L){
  const sh=c=>rgbs(mul(hex(c),0.78)),hi=c=>rgbs(mix(hex(c),[255,255,255],0.18));
  const frames=[];
  for(let f=0;f<5;f++){
    const c=S2(26,46,(P,E)=>{
      const cr=f===4?4:0;const lp=f===1?1:f===3?-1:0;
      // legs
      if(f===4){P(7,36,6,4,L.pants);P(14,37,6,3,L.pants);P(6,40,7,3,L.shoes);P(15,40,6,3,L.shoes);}
      else{P(8,31,5,10+lp,L.pants);P(14,31,5,10-lp,L.pants);P(13,31,1,4,sh(L.pants));P(7+(lp>0?-1:0),41+lp,6,3,L.shoes);P(14+(lp<0?1:0),41-lp,6,3,L.shoes);}
      // torso
      const ty=18+cr;P(7,ty,12,13,L.top);P(7,ty,2,13,hi(L.top));P(17,ty,2,13,sh(L.top));P(7,ty+12,12,1,sh(L.pants));
      if(L.kind==='pericia'){P(7,ty+6,12,2,'#d8d27a');P(10,ty,6,1,'#1d2b3d');P(9,ty+9,8,2,'#e8e4da');}
      if(L.kind==='campo'){P(11,ty+1,4,10,'#cfc8b8');P(8,ty+8,2,2,'#d4af37');}
      if(L.kind==='pm'){P(5,ty,2,3,'#c0392b');P(17,ty+7,2,5,'#111');P(8,ty+2,2,1,'#d4af37');P(7,ty+11,12,2,'#23262b');}
      if(L.kind==='iml'){P(8,ty+4,10,2,'#d8d8d0');P(7,ty+11,12,1,'#111');}
      if(L.cam){P(9,ty+2,8,6,'#111');P(11,ty+3,4,4,'#4a6a8a');P(16,ty+7,2,3,'#f2c230');}
      // arms
      const as=f===1?1:f===3?-1:0;const hand=L.gloves?'#f2f2f2':L.skin;
      if(f===4){P(5,ty+3,2,7,L.top);P(19,ty+3,2,7,L.top);P(7,ty+9,2,2,hand);P(17,ty+9,2,2,hand);}
      else{P(5,ty+1+as,2,9,hi(L.top));P(19,ty+1-as,2,9,sh(L.top));P(5,ty+10+as,2,2,hand);P(19,ty+10-as,2,2,hand);}
      // head
      const hy=3+cr;P(11,hy+12,4,3,sh(L.skin));P(7,hy+1,12,11,L.skin);P(8,hy,10,13,L.skin);P(17,hy+1,2,11,sh(L.skin));
      P(10,hy+6,1,2,'#1a1412');P(15,hy+6,1,2,'#1a1412');P(12,hy+10,2,1,sh(sh(L.skin)));P(9,hy+9,1,1,'rgba(200,90,80,.35)');P(16,hy+9,1,1,'rgba(200,90,80,.35)');
      if(L.glasses){P(9,hy+5,3,1,'#2a2a2a');P(14,hy+5,3,1,'#2a2a2a');P(12,hy+6,2,1,'#2a2a2a');}
      const hc=L.hair;
      switch(L.style){
        case 'short':P(7,hy-1,12,4,hc);P(6,hy,1,6,hc);P(19,hy,1,6,hc);P(8,hy+3,3,1,hc);break;
        case 'side':P(7,hy-1,12,4,hc);P(6,hy,1,6,hc);P(19,hy,1,5,hc);P(7,hy+3,6,2,hc);break;
        case 'long':P(7,hy-1,12,4,hc);P(5,hy,3,15,hc);P(18,hy,3,15,hc);P(8,hy+3,4,1,hc);break;
        case 'curly':E(13,hy+1,8,4,hc);E(7,hy+4,2,3,hc);E(19,hy+4,2,3,hc);break;
        case 'grey':P(7,hy,12,2,hc);P(6,hy+1,2,6,hc);P(18,hy+1,2,6,hc);break;
        case 'cap':P(6,hy-2,14,5,'#23262b');P(5,hy+3,16,2,'#16181c');P(12,hy-1,2,2,'#d4af37');P(6,hy+5,1,4,hc);P(19,hy+5,1,4,hc);break;
      }
    });
    frames.push(outlined(c));
  }
  return frames;
}
function dogFrames(){
  return [0,1].map(f=>outlined(S2(28,18,(P,E)=>{
    P(f?6:7,12,2,6,'#3a2a1c');P(f?11:10,12,2,6,'#3a2a1c');P(f?18:17,12,2,6,'#3a2a1c');P(f?21:22,12,2,6,'#3a2a1c');
    E(14,10,9,5,'#8a5a2b');E(13,8,7,3,'#2a1d14');E(23,6,4.5,4,'#8a5a2b');P(26,6,3,3,'#6b4423');P(28,6,1,1,'#111');P(22,0,2,4,'#2a1d14');P(25,1,2,3,'#2a1d14');P(24,5,1,1,'#111');
    P(1,f?4:6,5,2,'#2a1d14');})));
}

/* ---------- Art: walls ---------- */
const FACE={sala:['#dccaa8','#c9b591'],cozinha:['#e8e4da','#d3cec2'],escritorio:['#6f8a74','#5b7561'],casal:['#a3adc2','#8f9ab0'],corredor:['#d8c9ac','#c4b496'],livia:['#cdb9da','#b9a3c9'],ext:['#e3cf97','#cdb87e'],muro:['#b8b0a0','#a49c8c']};
function isWallF(f){return f===F.WALL||f===F.WIN||f===F.MURO;}
function wallAt(x,y){if(x<0||y<0||x>=W||y>=H)return false;return isWallF(floor[idx(x,y)]);}
function buildWalls(){
  // Oblique view: each wall tile shows a thin top (CAPH) and its front face hangs over the floor row in front of it,
  // so a room's back wall reads as a tall wall and everything standing in that row is drawn in front of it.
  const rows=[];
  for(let y=0;y<H;y++){
    let any=false;for(let x=0;x<W;x++)if(wallAt(x,y))any=true;
    if(!any){rows.push(null);continue;}
    const c=S2(W*T,2*TH+RISE,(P,E,g)=>{
      for(let x=0;x<W;x++){
        if(!wallAt(x,y))continue;
        const i=idx(x,y),f=floor[i],X=x*T,muro=f===F.MURO;
        const L=wallAt(x-1,y),Rt=wallAt(x+1,y),U=wallAt(x,y-1),D=wallAt(x,y+1);
        const cap=muro?['#a39a8a','#bdb4a3','#7e766a']:['#6e5c4c','#8c7862','#4a3e33'];
        const Z=muro?RISE:0;
        const capH=D?TH+RISE-Z:CAPH;
        P(X,Z,T,capH,cap[0]);for(let k=0;k<6;k++)P(X+Math.floor(hash(x,k,y)*T),Z+Math.floor(hash(k,x,y+3)*capH),1,1,cap[1]);
        if(!U){P(X,Z,T,1,'#241c16');P(X,Z+1,T,1,cap[1]);}
        if(!L){P(X,Z,1,capH,'#241c16');P(X+1,Z,1,capH,cap[1]);}
        if(!Rt){P(X+T-1,Z,1,capH,'#241c16');P(X+T-2,Z,1,capH,cap[2]);}
        if(f===F.WIN&&D){P(X+12,RISE+2,8,TH-4,'#2f4258');P(X+13,RISE+3,6,TH-6,'#5f86a8');P(X+14,RISE+4,2,TH-10,'#a7c6dc');}
        if(D)continue;
        const bf=y+1<H?floor[idx(x,y+1)]:F.GRASS;
        const hang=!muro&&bf!==F.DOOR&&bf!==F.GATE;
        const fy=Z+CAPH,fb=RISE+(hang?2*TH:TH),fh=fb-fy;
        const rm=y+1<H?room[idx(x,y+1)]:null;
        const st=muro?FACE.muro:(rm&&FACE[rm])?FACE[rm]:FACE.ext;
        P(X,fy-1,T,1,'#241c16');
        P(X,fy,T,fh,st[0]);
        for(let k=0;k<18;k++)P(X+Math.floor(hash(x,k,y+9)*T),fy+Math.floor(hash(k,x,y+11)*fh),1,1,st[1]);
        if(rm==='casal')for(let k=2;k<T;k+=6)P(X+k,fy,2,fh,st[1]);
        if(rm==='cozinha'){for(let yy=fy+14;yy<fb;yy+=5)P(X,yy,T,1,'#c3beb2');for(let xx=0;xx<T;xx+=6)P(X+xx,fy+14,1,fh-14,'#c3beb2');}
        if(st===FACE.ext&&!muro){for(let yy=fy+4;yy<fb-6;yy+=6)P(X,yy,T,1,'rgba(120,96,60,.18)');}
        if(muro){P(X,fb-6,T,6,'#8f877a');P(X,fb-6,T,1,'#a39a8a');for(let k=0;k<7;k++)P(X+Math.floor(hash(x,k,77)*T),fb-7+Math.floor(hash(k,x,78)*4),2,1,'#5f7d4a');}
        else if(st===FACE.ext){P(X,fb-6,T,6,'#a68f5c');P(X,fb-6,T,1,'#c0a874');}
        else{P(X,fb-5,T,5,'#6b4a2e');P(X,fb-5,T,1,'#8a6440');}
        P(X,fy,T,4,'rgba(0,0,0,.20)');
        if(!L)P(X,fy,2,fh,'rgba(0,0,0,.16)');if(!Rt)P(X+T-2,fy,2,fh,'rgba(0,0,0,.20)');
        if(f===F.WIN){const wy=fy+5;P(X+4,wy,24,22,'#f2efe6');P(X+6,wy+2,20,18,'#2c4058');P(X+7,wy+3,6,3,'#6f93b3');P(X+15,wy+2,1,18,'#f2efe6');P(X+6,wy+10,20,1,'#f2efe6');P(X+3,wy+22,26,2,'#d8d2c4');
          const cur={sala:'#b5583c',cozinha:'#d9c26a',escritorio:'#3f5a48',casal:'#c96a6a',livia:'#d9a2c9'}[rm]||'#c9a24a';P(X+2,wy,5,24,cur);P(X+25,wy,5,24,cur);P(X+2,wy,5,2,'rgba(255,255,255,.3)');P(X+25,wy,5,2,'rgba(255,255,255,.3)');}
        const dec=WALL_DECOR[x+','+y];if(dec)dec(P,E,X,fy+6);
        P(X,fb-1,T,1,'rgba(0,0,0,.35)');
      }
    });
    rows.push(c);
  }
  return rows;
}
const WALL_DECOR={
  '10,3':(P,E,X,Y)=>{P(X+8,Y+3,16,15,'#e6e2d6');P(X+8,Y+3,16,1,'#ffffff');P(X+10,Y+5,12,4,'#244a36');P(X+11,Y+6,6,1,'#7fe0a0');for(let r=0;r<2;r++)for(let k=0;k<4;k++)P(X+10+k*3,Y+11+r*3,2,2,'#9a968c');P(X+21,Y+5,1,1,'#e04a3a');},
  '11,3':(P,E,X,Y)=>{P(X+3,Y+2,26,16,'#7a5232');P(X+5,Y+4,22,12,'#9cc0d8');P(X+5,Y+11,22,5,'#5f8f4a');E(X+20,Y+7,2,2,'#f6f0c8');P(X+5,Y+10,8,2,'#78a85e');},
  '14,3':(P,E,X,Y)=>{E(X+16,Y+10,8,8,'#3a2a1c');E(X+16,Y+10,7,7,'#f4efe2');P(X+16,Y+5,1,6,'#222');P(X+16,Y+10,4,1,'#222');},
  '15,3':(P,E,X,Y)=>{P(X+4,Y+5,9,11,'#c9a24a');P(X+5,Y+6,7,9,'#8fb0c8');P(X+17,Y+3,10,13,'#3a2a1c');P(X+18,Y+4,8,11,'#d9c3a0');},
  '17,3':(P,E,X,Y)=>{P(X+1,Y+1,30,13,'#ebe6da');P(X+16,Y+1,1,13,'#c9c2b3');P(X+13,Y+9,1,3,'#8a857c');P(X+19,Y+9,1,3,'#8a857c');},
  '18,3':(P,E,X,Y)=>{P(X+1,Y+1,30,13,'#ebe6da');P(X+16,Y+1,1,13,'#c9c2b3');P(X+13,Y+9,1,3,'#8a857c');P(X+19,Y+9,1,3,'#8a857c');},
  '20,3':(P,E,X,Y)=>{P(X+1,Y+1,30,13,'#ebe6da');P(X+16,Y+1,1,13,'#c9c2b3');P(X+13,Y+9,1,3,'#8a857c');},
  '21,3':(P,E,X,Y)=>{E(X+16,Y+8,6,6,'#3a2a1c');E(X+16,Y+8,5,5,'#f4efe2');P(X+16,Y+5,1,4,'#222');},
  '23,3':(P,E,X,Y)=>{P(X+6,Y+3,20,14,'#2b2b2b');P(X+7,Y+4,18,12,'#f2ecd8');P(X+10,Y+6,12,1,'#7a6a4a');P(X+10,Y+9,10,1,'#9a8a6a');E(X+16,Y+13,2,2,'#c0392b');},
  '26,3':(P,E,X,Y)=>{P(X+2,Y+3,28,14,'#c9a27a');for(let k=0;k<5;k++)P(X+4+k*5,Y+5,4,4,['#f2f2ee','#f2e8a0','#c6e0f2','#f2f2ee','#f2c2c2'][k]);P(X+6,Y+11,9,4,'#f2f2ee');},
  '27,3':(P,E,X,Y)=>{P(X+2,Y+10,28,2,'#5a3d28');for(let k=0;k<5;k++)P(X+4+k*5,Y+2,4,8,['#3b5a8a','#8a3b3b','#d0a24a','#3b5a8a','#6b6b3b'][k]);},
  '11,9':(P,E,X,Y)=>{P(X+4,Y+2,24,16,'#5a3a1e');P(X+6,Y+4,20,12,'#c9d6e0');E(X+16,Y+9,5,3,'#8fa3b8');P(X+6,Y+12,20,4,'#6f8a74');},
  '13,9':(P,E,X,Y)=>{P(X+8,Y+3,16,14,'#c9a24a');P(X+9,Y+4,14,12,'#e8d9bc');E(X+13,Y+10,3,4,'#8a5a3a');E(X+19,Y+10,3,4,'#5a3a22');},
  '18,9':(P,E,X,Y)=>{P(X+3,Y+4,10,12,'#3a2a1c');P(X+4,Y+5,8,10,'#d9c3a0');P(X+17,Y+3,12,14,'#c9a24a');P(X+18,Y+4,10,12,'#a9c3d6');E(X+23,Y+12,3,3,'#c98e64');},
  '20,9':(P,E,X,Y)=>{P(X+4,Y+4,24,2,'#5a3d28');for(const k of [8,16,24])P(X+k,Y+6,1,3,'#c9a24a');P(X+6,Y+8,6,12,'#3b5a8a');P(X+21,Y+8,7,10,'#8a3b3b');},
  '24,9':(P,E,X,Y)=>{P(X+4,Y+2,22,17,'#2b2b2b');P(X+5,Y+3,20,15,'#e05a8a');E(X+15,Y+10,6,5,'#ffd27a');P(X+7,Y+15,16,2,'#2b2b2b');},
  '26,9':(P,E,X,Y)=>{P(X+6,Y+3,18,16,'#3a3a6a');P(X+7,Y+4,16,14,'#7fb2d9');E(X+15,Y+12,4,4,'#f2f2ee');P(X+9,Y+5,12,2,'#f2c230');},
  '18,16':(P,E,X,Y)=>{P(X+20,Y+4,6,8,'#2b2b2b');P(X+21,Y+5,4,5,'#ffe9a8');},
  '25,16':(P,E,X,Y)=>{E(X+16,Y+14,8,6,'#2f7a3a');E(X+16,Y+14,4,3,'#1f5a2a');P(X+15,Y+2,2,8,'#8a8a8a');},
  '12,16':(P,E,X,Y)=>{P(X+4,Y+3,24,15,'#f2efe6');P(X+6,Y+5,20,11,'#2c4058');P(X+15,Y+5,1,11,'#f2efe6');},
  '24,16':(P,E,X,Y)=>{P(X+4,Y+3,24,15,'#f2efe6');P(X+6,Y+5,20,11,'#2c4058');P(X+15,Y+5,1,11,'#f2efe6');}
};

/* ---------- Art: ground ---------- */
const ROOFS=[
  {x:-6,y:-6,w:4,h:7,tank:1},{x:-6,y:3,w:4,h:8},{x:-6,y:14,w:4,h:9,tank:1},{x:-6,y:26,w:4,h:6},
  {x:9,y:-6,w:14,h:5,tank:1},{x:25,y:-6,w:10,h:4},
  {x:36,y:-3,w:6,h:12,tank:1},{x:36,y:12,w:6,h:13},
  {x:9,y:27,w:16,h:5},{x:27,y:27,w:8,h:5,tank:1}
];
function floorAt(tx,ty){
  if(tx>=0&&ty>=0&&tx<W&&ty<H)return floor[idx(tx,ty)];
  if(tx>=0&&tx<=3)return F.STREET;
  if(tx===4||tx===5||tx===-1)return F.WALK;
  return F.GRASS;
}
function inRoof(wx,wy){for(const r of ROOFS){if(wx>=r.x*T&&wx<(r.x+r.w)*T&&wy>=r.y*T&&wy<(r.y+r.h)*T)return r;}return null;}
function groundPx(wx,wy){
  const tx=Math.floor(wx/T),ty=Math.floor(wy/T);
  const rf=inRoof(wx,wy);
  if(rf){
    const ry=wy-rf.y*T,rh=rf.h*T,mid=rh/2,row=Math.floor(ry/6),xx=wx+(row%2)*5;
    const up=ry<mid;let c=up?[196,104,72]:[166,82,58];
    const local=ry%6;if(local===5)c=mul(c,0.72);else if(local===0)c=mul(c,1.12);
    if(xx%10===0)c=mul(c,0.86);
    if(Math.abs(ry-mid)<3)c=[132,58,40];
    c=mul(c,0.92+vn(wx/30,wy/30,61)*0.16);
    if(hash(wx,wy,62)<0.04)c=mul(c,0.85);
    return c;
  }
  const f=floorAt(tx,ty),i=(tx>=0&&ty>=0&&tx<W&&ty<H)?idx(tx,ty):-1,rm=i>=0?room[i]:null;
  const lx=((wx%T)+T)%T,ly=((wy%T)+T)%T,n=hash(wx,wy,7);
  switch(f){
    case F.STREET:{
      let c=mix(C.a0,C.a1,vn(wx/14,wy/14,21));if(n<0.08)c=C.a2;else if(n>0.95)c=mix(c,[120,120,120],0.4);
      if(wx>=2*T-1&&wx<2*T+1&&(((wy%80)+80)%80)<44)c=C.line;
      if(tx===3&&lx>=29){c=lx===29?[70,70,70]:C.curb;}
      if(tx===0&&lx<=2){c=lx===2?[70,70,70]:C.curb;}
      return c;}
    case F.WALK:{
      const sx=Math.floor(wx/4),sy=Math.floor(wy/4),mx=((wx%4)+4)%4,my=((wy%4)+4)%4;
      const v=Math.sin((sy*4+Math.sin(sx*4/30)*14)/12);let c=v>0.62?[78,76,72]:[206,200,186];c=mul(c,0.93+hash(sx,sy,5)*0.12);
      if(mx===0||my===0)c=mul(c,0.86);return c;}
    case F.WOOD:case F.DARK:case F.DOOR:{
      if(rm==='sala'){
        const cell=((wx>>4)+(wy>>4))&1;let pid,seam;
        if(cell===0){pid=(wy>>2)*131+(wx>>4)*7;seam=(wy&3)===0;}else{pid=(wx>>2)*97+(wy>>4)*11;seam=(wx&3)===0;}
        if(seam)return C.tseam;const pc=[C.t0,C.t1,C.t2][Math.floor(hash(pid,3,9)*3)];return mul(pc,0.94+n*0.1);
      }
      const dark=f===F.DARK||f===F.DOOR||rm==='escritorio';const pal=dark?[C.d0,C.d1,C.d2]:[C.p0,C.p1,C.p2];const sm=dark?C.dseam:C.pseam;
      const row=Math.floor(wy/7),off=hash(row,0,5)*60,seg=Math.floor((wx+off)/56);
      if(((wy%7)+7)%7===0||Math.floor((wx+off))%56===0)return sm;
      let c=pal[Math.floor(hash(row,seg,6)*3)];
      const gr=Math.sin((wx+off)*0.21+row*1.7+Math.sin(wx*0.05)*2);if(gr>0.88)c=mul(c,0.88);
      return mul(c,0.95+n*0.08);}
    case F.TILE:{
      const a=((wx%16)+16)%16,b=((wy%16)+16)%16;if(a===0||b===0)return C.kg;
      const d=Math.abs(a-8)+Math.abs(b-8);const cd=Math.min(Math.hypot(a,b),Math.hypot(16-a,b),Math.hypot(a,16-b),Math.hypot(16-a,16-b));
      let c=cd<5?C.k2:d<3?C.k1:d<6?C.k0:d<7?C.k1:C.k0;return mul(c,0.96+n*0.06);}
    case F.CONC:case F.GATE:{
      if(rm==='terreno'&&f===F.CONC){const a=((wx%16)+16)%16,b=((wy%16)+16)%16;if(a<14&&b<14&&a>0&&b>0)return mul(hash(wx>>4,wy>>4,8)<0.5?C.pav:C.pav2,0.93+n*0.1);
        return mix(C.g0,C.g1,0.4);}
      let c=mix(C.c0,C.c1,vn(wx/20,wy/20,31));if(vn(wx/60,wy/60,33)>0.72)c=mul(c,0.9);if(n<0.06)c=C.c2;
      return c;}
    case F.WALL:case F.WIN:case F.MURO:return [70,60,50];
    default:{
      const low=vn(wx/40,wy/40,3),mid=vn(wx/9,wy/9,4);let c=mix(C.g0,C.g1,low*0.7+mid*0.3);
      if(n<0.07)c=C.g2;else if(n>0.94)c=C.gd;if(hash(wx>>1,wy>>2,9)<0.035)c=C.g3;
      return c;}
  }
}
function buildGround(){
  const BW=(W+2*M)*T,BH=(H+2*M)*T;
  const c=document.createElement('canvas');c.width=BW;c.height=BH;const g=c.getContext('2d');
  const img=g.createImageData(BW,BH),d=img.data;
  for(let py=0;py<BH;py++){const wy=py-M*T;for(let px=0;px<BW;px++){const wx=px-M*T;const col=groundPx(wx,wy);const k=(py*BW+px)*4;d[k]=col[0];d[k+1]=col[1];d[k+2]=col[2];d[k+3]=255;}}
  g.putImageData(img,0,0);
  g.translate(M*T,M*T);
  const rnd=mulberry32(99);
  const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h);};
  const shadowE=(cx,cy,rx,ry,a)=>{g.save();g.translate(cx,cy);g.scale(1,ry/rx);const gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,`rgba(0,0,0,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(-rx,-rx,rx*2,rx*2);g.restore();};
  // roof eaves shadow + water tanks
  for(const r of ROOFS){P(r.x*T,(r.y+r.h)*T,r.w*T,7,'rgba(0,0,0,.35)');P((r.x+r.w)*T,r.y*T+6,5,r.h*T,'rgba(0,0,0,.25)');
    if(r.tank){const cx=(r.x+r.w/2)*T+(r.w>6?40:0),cy=(r.y+r.h*0.3)*T;shadowE(cx+4,cy+6,18,10,.4);g.fillStyle='#2f6aa8';g.beginPath();g.ellipse(cx,cy,16,12,0,0,7);g.fill();g.fillStyle='#4a8ad0';g.beginPath();g.ellipse(cx-2,cy-2,12,8,0,0,7);g.fill();g.fillStyle='#2a5a90';g.beginPath();g.ellipse(cx,cy,5,4,0,0,7);g.fill();}
    P(r.x*T+r.w*T-30,r.y*T+10,8,14,'#9a9a9a');}
  // neighbor muro strips in margins
  P(-2*T,-M*T,T,(H+2*M)*T,'#a39a8a');P(-2*T,-M*T,2,(H+2*M)*T,'#bdb4a3');
  // AO along walls
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=idx(x,y);if(isWallF(floor[i]))continue;const X=x*T,Y=y*T;
    const grad=(x0,y0,x1,y1,a)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,`rgba(20,12,6,${a})`);gr.addColorStop(1,'rgba(20,12,6,0)');g.fillStyle=gr;};
    if(wallAt(x,y-1)){grad(X,Y,X,Y+12,.42);g.fillRect(X,Y,T,12);}
    if(y>1&&wallAt(x,y-2)&&!wallAt(x,y-1)&&floor[idx(x,y-1)]!==F.DOOR&&floor[idx(x,y-1)]!==F.GATE){grad(X,Y,X,Y+16,.45);g.fillRect(X,Y,T,16);}
    if(wallAt(x-1,y)){grad(X,Y,X+10,Y,.32);g.fillRect(X,Y,10,T);}
    if(wallAt(x+1,y)){grad(X+T,Y,X+T-10,Y,.32);g.fillRect(X+T-10,Y,10,T);}
  }
  // flat props baked into ground
  for(const o of objs){if(o.flat&&o.spr)g.drawImage(o.spr.c,o.x*T+o.spr.ox-o.spr.pad,o.y*T+o.spr.oy-o.spr.pad);}
  // furniture contact shadows
  for(const o of objs){if(o.flat)continue;const cx=(o.x+o.w/2)*T+3,cy=(o.y+o.h)*T-3;shadowE(cx,cy,o.w*T*0.55+(o.t==='arvore'?18:0),o.t==='arvore'?14:7,o.t==='arvore'?.38:.32);}
  // doormat & threshold
  P(8*T+6,6*T+5,22,22,'#6e5236');P(8*T+8,6*T+7,18,18,'#8a6a46');for(let k=0;k<4;k++)P(8*T+10,6*T+10+k*4,14,1,'#6e5236');
  // grass life: flowers, tufts, leaves
  const isGrass=(x,y)=>{const f=floorAt(x,y);return f===F.GRASS&&!inRoof(x*T+4,y*T+4)&&!(x===-2);};
  for(let k=0;k<900;k++){
    const x=Math.floor(rnd()*(W+2*M))-M,y=Math.floor(rnd()*(H+2*M))-M;if(!isGrass(x,y))continue;
    const i=(x>=0&&y>=0&&x<W&&y<H)?idx(x,y):-1;if(i>=0&&occ[i]>=0)continue;
    const px=x*T+Math.floor(rnd()*28),py=y*T+Math.floor(rnd()*28);const r=rnd();
    if(r<0.35){const col=['#f2efe6','#f2d24a','#e9a0c0','#b9a3e0','#f0a050'][Math.floor(rnd()*5)];P(px,py,2,2,col);P(px+3,py+2,2,2,col);P(px+1,py+4,2,2,col);P(px+2,py+2,1,1,'#f2d24a');}
    else{P(px,py,1,3,'#2c4f26');P(px+2,py-1,1,4,'#2c4f26');P(px+4,py,1,3,'#2c4f26');P(px+2,py-2,1,1,'#77b257');}
  }
  // street details
  for(const [x,y] of [[2,4],[1,15],[2,22],[1,-4],[2,29]]){g.fillStyle='#2b2d31';g.beginPath();g.ellipse(x*T,y*T,10,10,0,0,7);g.fill();g.fillStyle='#3a3d42';g.beginPath();g.ellipse(x*T,y*T,8,8,0,0,7);g.fill();for(let k=-6;k<=6;k+=3)P(x*T-6,y*T+k,12,1,'#2b2d31');}
  for(const [x,y] of [[3,7],[3,19]]){P(x*T+20,y*T,9,18,'#2b2d31');for(let k=1;k<18;k+=3)P(x*T+21,y*T+k,7,1,'#555');}
  shadowE(1.2*T,13.5*T,26,12,.35);
  for(let k=0;k<160;k++){const x=rnd()*6*T,y=rnd()*(H+2*M)*T-M*T;P(Math.floor(x),Math.floor(y),2,1,['#c98a3a','#a8642a','#d9b04a','#7a8a3a'][k%4]);}
  // quintal stains & cracks
  for(let k=0;k<6;k++){let x=(11+rnd()*15)*T,y=(17.5+rnd()*5)*T;for(let s=0;s<18;s++){P(Math.floor(x),Math.floor(y),1,1,'#6e6d66');x+=1+rnd()*2-0.5;y+=rnd()*2-1;}}
  shadowE(15*T,22*T,30,14,.12);shadowE(24*T,19*T,24,10,.10);
  // neighbor trees: shadows on the ground, crowns drawn upright after the squash
  const NT=[[-1.5,-3],[30,-4.5],[38.5,10.5],[-4,12],[24,29],[33,30],[7.5,-4],[38,26]];
  for(const [x,y] of NT)shadowE(x*T+6,y*T+22,34,22,.35);
  const c2=document.createElement('canvas');c2.width=BW;c2.height=(H+2*M)*TH;const g2=c2.getContext('2d');g2.imageSmoothingEnabled=false;
  g2.drawImage(c,0,0,BW,BH,0,0,BW,c2.height);
  g2.translate(M*T,M*TH);
  for(const [x,y] of NT){
    const spr=outlined(S2(64,84,(P2,E2)=>{P2(29,44,7,38,'#4a3020');P2(29,44,2,38,'#6a4a2c');bush(P2,E2,32,30,26,mulberry32(x*13+y*7|0),['#1f3f1c','#2f5f2a','#3f7d37','#5aa04a','#7fc363']);}));
    g2.drawImage(spr,Math.round(x*T-32),Math.round(y*TH+18-84));
  }
  return c2;
}

/* ---------- Render setup ---------- */
const cam={x:8*T,y:9*T,z:1};
const ZMIN=0.5,ZMAX=5;let FITZ=1;
let frame=0,sel=null,selTile=null,follow=false,tool=null,drag=null,pinch=null;
let BG=null,WALLROWS=null,DOG=null,SHADOW=null;
function ez(){return cam.z;}
function zMin(){return Math.max(ZMIN,1/dpr);}
function snapZ(z){return clamp(Math.max(1,Math.round(z*dpr))/dpr,zMin(),ZMAX);}
let zoomIdle=0,lastZoomIn=0,zoomAnchor=null;
function zoomActivity(sx,sy){lastZoomIn=performance.now();zoomAnchor=[sx,sy];}
const HUDPAD={t:58,b:72};
function clampCam(){
  const e=ez(),hw=VW()/2/e,hh=VH()/2/e;
  const L=VW()>VH(),tp=Math.max(0,HUDPAD.t-10),bt=L?24:Math.max(0,HUDPAD.b-10);
  const x0=-M*T+hw,x1=(W+M)*T-hw,y0=-M*TH+hh-tp/e,y1=(H+M)*TH-hh+bt/e;
  cam.x=x0>x1?(W*T)/2:clamp(cam.x,x0,x1);cam.y=y0>y1?(H*TH)/2:clamp(cam.y,y0,y1);
}
function s2w(sx,sy){const e=ez(),ys=cam.y+(sy-VH()/2)/e;return {x:cam.x+(sx-VW()/2)/e,y:ys/K,ys};}
function tileAt(sx,sy){const w=s2w(sx,sy);return idx(clamp(Math.floor(w.x/T),0,W-1),clamp(Math.floor(w.y/T),0,H-1));}
function resize(){dpr=Math.min(window.devicePixelRatio||1,3);cv.width=Math.round(VW()*dpr);cv.height=Math.round(VH()*dpr);lc.width=Math.ceil(cv.width/LS);lc.height=Math.ceil(cv.height/LS);clampCam();}
const LS=3;
function fitView(){
  const L=VW()>VH();
  if(L){const t=Math.min((VH()-56)/(16*TH),(VW()-230)/(20.5*T));cam.z=snapZ((Math.max(1,Math.floor(t*dpr))+1)/dpr);cam.x=16.5*T;cam.y=9.6*TH;}
  else{cam.z=snapZ(clamp(VW()/(12*T),0.6,1.6));cam.x=10*T;cam.y=9.5*TH;}
  clampCam();FITZ=cam.z;
}
function squashSprite(sp){
  // keep the upright part (above the footprint) as drawn, foreshorten the footprint by K
  const c=sp.c,r0=Math.min(c.height,sp.pad-sp.oy);
  const h2=r0+Math.max(1,Math.round((c.height-r0)*K));
  const o=document.createElement('canvas');o.width=c.width;o.height=h2;const g=o.getContext('2d');g.imageSmoothingEnabled=false;
  if(r0>0)g.drawImage(c,0,0,c.width,r0,0,0,c.width,r0);
  if(c.height>r0)g.drawImage(c,0,r0,c.width,c.height-r0,0,r0,c.width,h2-r0);
  sp.c=o;return sp;
}
function extrude(sp,n,f){
  // give flat-topped furniture a visible front panel: extend each column's lowest colour downward, darker
  const c=sp.c,w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data;
  const o=document.createElement('canvas');o.width=w;o.height=h+n;const g=o.getContext('2d');g.drawImage(c,0,0);
  const img=g.getImageData(0,0,w,h+n),D=img.data;
  for(let x=0;x<w;x++){let y=h-1;while(y>=0&&d[(y*w+x)*4+3]<40)y--;if(y<1)continue;
    const k=((y-1)*w+x)*4;
    for(let j=1;j<=n;j++){const q=((y+j)*w+x)*4,sh=f*(1-0.03*j);D[q]=d[k]*sh;D[q+1]=d[k+1]*sh;D[q+2]=d[k+2]*sh;D[q+3]=255;}
    const qb=((y+n)*w+x)*4;D[qb]=30;D[qb+1]=22;D[qb+2]=17;D[qb+3]=240;}
  g.putImageData(img,0,0);sp.c=o;return sp;
}
const EXTRUDE={camacasal:8,camalivia:8,viatura:7,carro:7,mesac:4,tapete:0};
function initArt(){
  for(const o of objs){const ob=o.flat?null:OBLQ(o);if(ob){o.spr=ob;continue;}o.spr=GEN(o);if(o.spr&&!o.flat){squashSprite(o.spr);if(EXTRUDE[o.t])extrude(o.spr,EXTRUDE[o.t],0.66);}}
  BG=buildGround();WALLROWS=buildWalls();DOG=dogFrames();
  SHADOW=S2(22,8,(P,E)=>{E(11,4,10,3.5,'rgba(0,0,0,.30)');E(11,4,7,2.5,'rgba(0,0,0,.18)');});
}
function framesFor(p){if(!p.frames)p.frames=personFrames(p.look);return p.frames;}

/* ---------- Lights ---------- */
const WARM=[255,190,120];
const LIGHTS=[
  [12.5,6.2,4.4,[255,190,120],0.95],[19,6.2,3.8,[255,214,170],0.9],[25,6.2,3.6,[255,196,130],0.85],
  [12.5,12.8,3.8,[255,176,116],0.75],[19,12.8,3.4,[255,196,140],0.8],[25,12.8,3.8,[255,186,176],0.8],
  [10.5,11.0,1.7,[255,206,130],1],[13.5,11.0,1.7,[255,206,130],1],[25.5,5.4,1.6,[200,255,190],0.7],
  [18.8,17.6,3.4,[255,206,150],0.9],[5.7,3.0,5.2,[255,210,150],1],[5.7,21.0,5.2,[255,210,150],1],
  [12.5,2.4,1.9,[255,190,120],0.55],[13.5,2.4,1.9,[255,190,120],0.55],[19.5,2.4,1.6,[255,214,170],0.5],[24.5,2.4,1.8,[255,196,130],0.5],[25.5,2.4,1.8,[255,196,130],0.5],
  [8.4,12.5,1.6,[255,176,116],0.45],[8.4,13.5,1.6,[255,176,116],0.45],[29.6,12.5,1.6,[255,186,176],0.45],[29.6,13.5,1.6,[255,186,176],0.45],
  [12.5,17.4,1.4,[255,190,120],0.35],[24.5,17.4,1.4,[255,196,130],0.35]
];
function nightF(){const m=minutes();if(m<5*60+20)return 1;if(m>=6*60)return 0;return 1-(m-(5*60+20))/40;}
function ambient(){
  const m=minutes(),night=[60,68,116],dusk=[150,118,150],dawn=[255,226,200],day=[255,250,244];
  if(m<5*60+20)return night;if(m<5*60+42)return mix(night,dusk,(m-320)/22);if(m<6*60)return mix(dusk,dawn,(m-342)/18);if(m<6*60+20)return mix(dawn,day,(m-360)/20);return day;
}
const FIREFLIES=Array.from({length:18},(_,k)=>({x:(7+Math.random()*25)*T,y:(2+Math.random()*21)*T,ph:Math.random()*6.28,sp:0.3+Math.random()*0.5}));
for(const f of FIREFLIES){if(f.y>3*T&&f.y<17*T&&f.x>9*T&&f.x<29*T){f.y=19*T+Math.random()*4*T;}}

/* ---------- Weather, ambience & particles ---------- */
const ROOM_RECT={sala:[10,4,15,8],cozinha:[17,4,21,8],escritorio:[23,4,27,8],casal:[10,10,15,15],corredor:[17,10,21,15],livia:[23,10,27,15]};
function rainI(){const m=minutes();return clamp((5*60+55-m)/40,0,1);}
function sunF(){return clamp((minutes()-(5*60+45))/25,0,1);}
function fogI(){const m=minutes();return 0.07+0.18*Math.exp(-Math.pow((m-352)/16,2))+0.05*nightF();}
let WET=1,WIND=0;
const FX={p:[],decals:[],birds:[],shake:0,bark:0,dog:null};
function fxAdd(o){if(FX.p.length<700)FX.p.push(o);}
function burstSparks(x,y,n,col){for(let k=0;k<n;k++){const a=Math.random()*6.283,sp=0.5+Math.random()*1.7;fxAdd({k:'spark',x,y,z:16+Math.random()*12,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp*0.5,vz:0.8+Math.random()*2.2,g:0.09,t:0,life:45+Math.random()*30,c:col||[255,214,90]});}}
function ringFx(x,y,col,r,life){fxAdd({k:'ring',x,y,z:0,t:0,life:life||42,c:col||[242,194,48],r:r||30});}
function floatText(x,y,txt,col,life){fxAdd({k:'text',x,y,z:44,vz:0.22,t:0,life:life||160,txt,c:col||'#f2c230'});}
function puff(x,y,col){for(let k=0;k<2;k++)fxAdd({k:'puff',x:x+(Math.random()-0.5)*6,y:y+(Math.random()-0.5)*2,z:1,vx:(Math.random()-0.5)*0.25,vy:0,vz:0.12+Math.random()*0.15,t:0,life:24+Math.random()*12,c:col,sz:1.5+Math.random()*1.5});}
function splashAt(x,y){fxAdd({k:'splash',x,y,z:0,t:0,life:12});}
function steamAt(x,y){fxAdd({k:'steam',x:x+(Math.random()-0.5)*3,y,z:24,vx:(Math.random()-0.5)*0.12+WIND*0.1,vy:0,vz:0.3,t:0,life:46,sz:1.5});}
function flareAt(x,y,str){fxAdd({k:'flare',x,y,z:30,t:0,life:9,a:str||1});}
function footFx(p){
  const i=ti(p);if(i<0)return;const out=!inHouse(i),f=floor[i];
  const X=p.x*T+16+(Math.random()-0.5)*6,Y=p.y*TH+TH-3;
  if(out&&WET>0.35&&f!==F.WOOD&&f!==F.TILE){if(Math.random()<0.7)fxAdd({k:'drip',x:X,y:Y,z:0,vx:(Math.random()-0.5)*0.6,vy:0,vz:0.9+Math.random()*0.6,g:0.18,t:0,life:14});}
  else if(LODV>=1&&out&&(f===F.GRASS||f===F.CONC||f===F.STREET||f===F.WALK))puff(X,Y,[150,140,120]);
}
function footprint(c){
  c.fpS=(c.fpS||0)^1;const ang=Math.atan2((c.fy||0)*K,c.fx||1),px=-Math.sin(ang)*2.2*(c.fpS?1:-1),py=Math.cos(ang)*1.2*(c.fpS?1:-1);
  FX.decals.push({x:c.x*T+16+px,y:c.y*TH+TH-4+py,a:ang,t:0});if(FX.decals.length>420)FX.decals.splice(0,FX.decals.length-420);
}

/* ---------- Speech & emotes ---------- */
const CIV_LINES=['O que aconteceu aí?','Eu moro aqui do lado!','Foi assalto?','Deixa eu ver…','Ouvi a sirene…','Que tristeza…','Alguém viu alguma coisa?'];
const PRESS_LINES=['Uma foto só!','Delegado, uma palavra?','Pode confirmar alguma coisa?','Do lado de cá, ó!'];
const PM_LINES=['Pra trás da fita!','Circulando, pessoal.','Aqui não pode, senhor.','Afasta, por favor.'];
const PAULO_LINES=['Mora por aqui?','Viu movimento essa noite?','Só um minutinho.','Fica comigo aqui.'];
const TALK_LINES=['Sem declaração por enquanto.','A delegada fala depois.','Respeita a família, pessoal.'];
function say(p,txt,life){p.say={txt,t:0,life:life||150};}
const ICON={};
function buildIcons(){
  const mk=fn=>outlined(S2(9,9,fn),'#1e1611');
  ICON.mag=mk((P,E)=>{E(3.5,3.5,3.2,3.2,'#2b2b2b');E(3.5,3.5,2.1,2.1,'#bfe3ff');P(2,2,1,1,'#ffffff');P(5,5,1,1,'#2b2b2b');P(6,6,2,2,'#8a5a2b');});
  ICON.cup=mk(P=>{P(1,4,5,5,'#f2efe6');P(1,4,5,1,'#6b4423');P(6,5,2,2,'#f2efe6');P(2,0,1,3,'#cfd6dc');P(4,1,1,2,'#cfd6dc');});
  ICON.tape=mk(P=>{for(let k=0;k<9;k+=2)P(k,3,2,3,(k/2)%2?'#16181c':'#f2c230');});
  ICON.dots=mk(P=>{P(0,4,2,2,'#2b2b2b');P(3,4,2,2,'#2b2b2b');P(6,4,2,2,'#2b2b2b');});
  ICON.ex=mk(P=>{P(3,0,3,6,'#ff453a');P(3,7,3,2,'#ff453a');});
  ICON.q=mk(P=>{P(2,0,5,2,'#3b5a8a');P(6,1,2,3,'#3b5a8a');P(4,4,3,2,'#3b5a8a');P(4,7,2,2,'#3b5a8a');});
  ICON.shield=mk(P=>{P(1,0,7,1,'#2f5aa8');P(1,1,7,4,'#3b6aa8');P(2,5,5,2,'#3b6aa8');P(3,7,3,1,'#3b6aa8');P(4,1,1,5,'#f2c230');P(2,3,5,1,'#f2c230');});
  ICON.pin=mk(P=>{P(3,0,3,1,'#c0392b');P(2,1,5,3,'#c0392b');P(3,4,3,1,'#c0392b');P(4,5,1,4,'#2b2b2b');P(3,1,1,1,'#ff8a80');});
  ICON.cam=mk(P=>{P(0,2,9,7,'#2b2b2b');P(3,1,3,1,'#2b2b2b');E3(P);P(7,3,1,1,'#f2c230');});
  ICON.auto=mk(P=>{P(4,0,1,1,'#c0392b');P(3,1,3,1,'#c0392b');P(2,2,5,1,'#c0392b');P(1,3,7,1,'#c0392b');P(2,4,5,4,'#f2efe6');P(2,4,5,1,'#d8d2c2');P(4,5,2,3,'#6b4423');});
  function E3(P){P(3,4,3,3,'#6f93b3');P(3,4,1,1,'#bfe3ff');}
}
const ICONURL={};
function buildIconURLs(){for(const k in ICON){const s=ICON[k],c=document.createElement('canvas');c.width=s.width*4;c.height=s.height*4;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(s,0,0,c.width,c.height);ICONURL[k]=c.toDataURL();}}
let UIK=1;
function atUI(X,Y,fn){if(UIK>=0.999){fn();return;}ctx.save();ctx.translate(X,Y);ctx.scale(UIK,UIK);ctx.translate(-X,-Y);fn();ctx.restore();}
function drawBubble(X,Y,icon){if(UIK<0.999)return atUI(X,Y,()=>{const k=UIK;UIK=1;drawBubble(X,Y,icon);UIK=k;});
  ctx.fillStyle='#1e1611';ctx.fillRect(X-8,Y-17,17,14);ctx.fillRect(X-2,Y-4,5,2);ctx.fillRect(X-1,Y-2,3,1);
  ctx.fillStyle='#f3f1ea';ctx.fillRect(X-7,Y-16,15,12);ctx.fillRect(X-1,Y-4,3,1);
  ctx.drawImage(icon,X-5,Y-16);
}
function drawSay(X,Y,txt,al){if(UIK<0.999)return atUI(X,Y,()=>{const k=UIK;UIK=1;drawSay(X,Y,txt,al);UIK=k;});
  ctx.font='600 7px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif';
  const w=Math.ceil(ctx.measureText(txt).width)+8,x=Math.round(X-w/2),y=Math.round(Y-14);
  ctx.globalAlpha=al;ctx.fillStyle='#1e1611';ctx.fillRect(x-1,y-1,w+2,12);ctx.fillRect(X-2,y+11,4,2);
  ctx.fillStyle='#f3f1ea';ctx.fillRect(x,y,w,10);ctx.fillRect(X-1,y+10,2,2);
  ctx.fillStyle='#14181b';ctx.textAlign='center';ctx.fillText(txt,X,y+7.5);ctx.textAlign='left';ctx.globalAlpha=1;
}

/* ---------- Ambient life ---------- */
const PUDDLES=[[1.3,6.4,24,7],[2.7,13.4,32,9],[0.9,21.2,20,6],[4.5,9.7,14,4],[4.6,17.6,16,5],[7.7,6.95,11,3.5],[14.2,19.8,26,7],[22.6,21.6,30,8],[12.6,23.1,16,5],[27.3,19.4,13,4],[3.0,-1.5,26,7],[2.2,26.5,24,7]].map(p=>({x:p[0]*T,y:p[1]*TH,rx:p[2],ry:p[3],ph:Math.random()*6}));
const DROPS=[];
function viewRect(){const e=ez(),hw=VW()/2/e,hh=VH()/2/e;return {x0:cam.x-hw,x1:cam.x+hw,y0:cam.y-hh,y1:cam.y+hh};}
function newDrop(v,anyZ){return {x:v.x0-30+Math.random()*(v.x1-v.x0+60),y:v.y0+Math.random()*(v.y1-v.y0+90),z:anyZ?Math.random()*110:80+Math.random()*40,v:3+Math.random()*1.6};}
function roofed(x,y){const tx=Math.floor(x/T),ty=Math.floor(y/TH);if(tx<0||ty<0||tx>=W||ty>=H)return false;const i=idx(tx,ty);return inHouse(i)||isWallF(floor[i]);}
function updWeather(){
  const ri=rainI(),v=viewRect(),want=Math.round(ri*190);
  while(DROPS.length<want)DROPS.push(newDrop(v,true));if(DROPS.length>want)DROPS.length=want;
  for(const d of DROPS){d.z-=d.v;d.x+=d.v*(0.18+WIND*0.25);
    if(d.z<=0){if(!roofed(d.x,d.y)&&Math.random()<0.45)splashAt(d.x,d.y);Object.assign(d,newDrop(v,false));}
    else if(d.x<v.x0-60||d.x>v.x1+60||d.y<v.y0-20||d.y>v.y1+120)Object.assign(d,newDrop(v,false));}
  if(ri>0.1)for(const p of PUDDLES)if(Math.random()<0.05*ri*WET)fxAdd({k:'ripple',x:p.x+(Math.random()-0.5)*p.rx*1.4,y:p.y+(Math.random()-0.5)*p.ry*1.2,z:0,t:0,life:26,r:3+Math.random()*3});
  if(sunF()>0.12&&WET>0.1){if(Math.random()<0.35){const p=Math.random()<0.5?pick(PUDDLES):{x:v.x0+Math.random()*(v.x1-v.x0),y:v.y0+Math.random()*(v.y1-v.y0)};if(!roofed(p.x,p.y))fxAdd({k:'wisp',x:p.x+(Math.random()-0.5)*20,y:p.y,z:0,vx:0.08+WIND*0.1,vy:0,vz:0.18,t:0,life:110,sz:3});}}
  // falling leaves from trees in view
  if(Math.random()<0.05){const tr=objs.filter(o=>o.t==='arvore'&&o.x*T>v.x0-40&&o.x*T<v.x1+40&&o.y*TH>v.y0-60&&o.y*TH<v.y1+80);if(tr.length){const o=pick(tr);fxAdd({k:'leaf',x:o.x*T+16+(Math.random()-0.5)*30,y:o.y*TH-46+Math.random()*16,gy:o.y*TH+TH+Math.random()*26,vx:0.15+WIND*0.4,vy:0.25+Math.random()*0.2,t:0,life:420,c:pick(['#6a9a40','#8cb050','#c9a040','#a8642a']),ph:Math.random()*6});}}
  // birds at dawn
  const sf=sunF();
  if(sf>0.05&&FX.birds.length<8&&Math.random()<0.004){const n=4+Math.floor(Math.random()*4),y=v.y0+Math.random()*(v.y1-v.y0)*0.6,dir=Math.random()<0.5?1:-1;for(let k=0;k<n;k++)FX.birds.push({x:(dir>0?v.x0-40:v.x1+40)-dir*k*14-Math.random()*8,y:y+k*(k%2?7:-5),vx:dir*(1.3+Math.random()*0.2),vy:-0.25-Math.random()*0.15,ph:Math.random()*6});}
  for(const b of FX.birds){b.x+=b.vx;b.y+=b.vy;b.ph+=0.35;}
  FX.birds=FX.birds.filter(b=>b.x>v.x0-120&&b.x<v.x1+120&&b.y>v.y0-120);
}
function updParticles(){
  for(const p of FX.p){p.t++;
    if(p.k==='leaf'){if(p.y<p.gy){p.x+=p.vx+Math.sin(p.t/14+p.ph)*0.35;p.y+=p.vy;}continue;}
    if(p.vx)p.x+=p.vx;if(p.vy)p.y+=p.vy;if(p.vz){p.z+=p.vz;}if(p.g){p.vz-=p.g;if(p.z<0){p.z=0;p.vz*=-0.3;p.vx*=0.6;p.vy*=0.6;}}}
  FX.p=FX.p.filter(p=>p.t<p.life);
  FX.shake*=0.86;
}

/* ---------- Light sprites & fog ---------- */
const LCACHE={};
function lightSprite(col){const k=col.join(',');let c=LCACHE[k];if(c)return c;c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,rgbs(col,1));gr.addColorStop(0.4,rgbs(col,0.55));gr.addColorStop(1,rgbs(col,0));g.fillStyle=gr;g.fillRect(0,0,64,64);return LCACHE[k]=c;}
let FOG=null;
function buildFog(){
  const P=8,Z=128;FOG=document.createElement('canvas');FOG.width=FOG.height=Z;const g=FOG.getContext('2d'),img=g.createImageData(Z,Z),d=img.data;
  const vw=(x,y,p,s)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,h=(a,b)=>hash(((a%p)+p)%p,((b%p)+p)%p,s);const a=h(ix,iy),b=h(ix+1,iy),c=h(ix,iy+1),e=h(ix+1,iy+1);const ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy);return a+(b-a)*ux+(c-a)*uy+(a-b-c+e)*ux*uy;};
  for(let y=0;y<Z;y++)for(let x=0;x<Z;x++){const n=vw(x/Z*P,y/Z*P,P,71)*0.6+vw(x/Z*P*2,y/Z*P*2,P*2,72)*0.3+vw(x/Z*P*4,y/Z*P*4,P*4,73)*0.1;const a=clamp((n-0.38)*2.2,0,1);const k=(y*Z+x)*4;d[k]=206;d[k+1]=216;d[k+2]=232;d[k+3]=Math.round(a*a*255);}
  g.putImageData(img,0,0);
}
let HALOS=[],POSTES=[],MOTHS=[];
function buildAmbient(){
  buildCars();buildDetail();
  HALOS=[];POSTES=[];
  for(const o of objs){
    if(o.t==='poste'){const h={x:o.x*T+26,y:o.y*TH-61,gy:o.y*TH+TH};POSTES.push(h);}
    if(o.t==='criado')HALOS.push({x:o.x*T+16,y:o.y*TH-13,r:16,c:[255,214,140],a:0.8,room:1});
    if(o.t==='mesa')HALOS.push({x:o.x*T+57,y:o.y*TH-15,r:14,c:[200,255,190],a:0.55,room:1});
    if(o.t==='escrivaninha')HALOS.push({x:o.x*T+58,y:o.y*TH-19,r:12,c:[255,200,235],a:0.6,room:1});
  }
  MOTHS=[];for(const p of POSTES)for(let k=0;k<4;k++)MOTHS.push({p,a:Math.random()*6.28,r:4+Math.random()*7,s:0.08+Math.random()*0.1,z:Math.random()*6});
  buildFog();buildIcons();buildIconURLs();
}

/* ---------- Lighting ---------- */
const DOORS=[[9,6],[16,6],[22,7],[19,9],[16,12],[22,12],[19,16]];
function roomClip(rm){const r=ROOM_RECT[rm];return [r[0]*T,r[1]*TH-30,(r[2]+1)*T,(r[3]+1)*TH-RISE+CAPH];}
function collectLights(nf){
  const L=[];
  for(const l of LIGHTS){const rm=room[idx(Math.floor(l[0]),Math.floor(l[1]))],inside=HOUSE_ROOMS.has(rm);
    const fl=inside?0.92+0.08*vn(frame/7,l[0]*7+l[1]*3,5):1;
    L.push({x:l[0]*T,y:l[1]*TH,r:l[2]*T,c:l[3],a:l[4]*(inside?0.55+0.45*nf:nf)*fl,clip:inside?rm:null});}
  for(const [x,y] of DOORS)L.push({x:x*T+16,y:y*TH+12,r:1.4*T,c:[255,200,140],a:0.5*nf});
  const ph=frame%48,red=ph<4||(ph>=8&&ph<12),blue=(ph>=24&&ph<28)||(ph>=32&&ph<36);
  L.push({x:1*T,y:9*TH+16,r:6*T,c:red?[255,46,36]:blue?[56,110,255]:[120,60,130],a:(red||blue?1.1:0.25)*(0.35+0.65*nf),pol:1});
  if(nf>0.04)for(const a of S.crew){const fx=a.fx||0,fy=a.fy==null?1:a.fy,ang=Math.atan2(fy*K,fx),px=a.x*T+16,py=a.y*TH+TH-6;
    L.push({x:px,y:py,r:1.2*T,c:[200,215,255],a:0.42*nf});
    L.push({x:px,y:py,r:4.2*T,c:[226,232,250],a:0.62*nf,cone:ang,spread:0.45});}
  for(const f of FIREFLIES){const b=0.5+0.5*Math.sin(frame/18+f.ph);L.push({x:f.x,y:f.y*K,r:0.5*T,c:[220,255,140],a:0.55*b*nf});}
  for(const f of S.flash)L.push({x:f.x*T+16,y:f.y*TH+8,r:3.4*T,c:[255,255,255],a:f.t/5});
  return L;
}
function lightPass(L,s,ox,oy,amb){
  const sp=(x,y)=>[(x*s+ox)/LS,(y*s+oy)/LS];
  lctx.setTransform(1,0,0,1,0,0);lctx.globalAlpha=1;lctx.globalCompositeOperation='source-over';lctx.fillStyle=rgbs(amb);lctx.fillRect(0,0,lc.width,lc.height);
  lctx.globalCompositeOperation='lighter';
  for(const l of L){if(l.a<=0.01)continue;const [x,y]=sp(l.x,l.y),rr=l.r*s/LS;if(x<-rr||y<-rr||x>lc.width+rr||y>lc.height+rr)continue;
    const spr=lightSprite(l.c);lctx.save();
    if(l.clip){const r=roomClip(l.clip),[a0,b0]=sp(r[0],r[1]),[a1,b1]=sp(r[2],r[3]);lctx.beginPath();lctx.rect(a0,b0,a1-a0,b1-b0);lctx.clip();}
    lctx.globalAlpha=Math.min(1,l.a);
    if(l.cone!=null){lctx.translate(x,y);lctx.rotate(l.cone);lctx.beginPath();lctx.moveTo(0,0);lctx.arc(0,0,rr,-l.spread,l.spread);lctx.closePath();lctx.clip();lctx.drawImage(spr,-rr,-rr,rr*2,rr*2);}
    else lctx.drawImage(spr,x-rr,y-rr*0.8,rr*2,rr*1.6);
    lctx.restore();}
  lctx.globalAlpha=1;lctx.globalCompositeOperation='source-over';
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';ctx.imageSmoothingEnabled=true;ctx.drawImage(lc,0,0,cv.width,cv.height);ctx.globalCompositeOperation='source-over';
}
function glowPass(L,nf){
  // runs in sprite space with additive blending
  ctx.globalCompositeOperation='lighter';
  const sf=sunF();
  // bloom around every light
  for(const l of L){if(l.a<=0.05||l.cone!=null)continue;const rr=l.r*0.5;ctx.globalAlpha=Math.min(1,0.14*l.a*(l.pol?1.6:1));ctx.drawImage(lightSprite(l.c),l.x-rr,l.y-rr*0.8,rr*2,rr*1.6);}
  // flashlight beams: faint volumetric cone
  if(nf>0.05)for(const a of S.crew){const fx=a.fx||0,fy=a.fy==null?1:a.fy,ang=Math.atan2(fy*K,fx),px=a.x*T+16+fx*6,py=a.y*TH+TH-24;
    ctx.save();ctx.translate(px,py);ctx.rotate(ang);const g=ctx.createLinearGradient(0,0,90,0);g.addColorStop(0,`rgba(230,238,255,${0.07*nf})`);g.addColorStop(1,'rgba(230,238,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-1.5);ctx.lineTo(90,-30);ctx.lineTo(90,30);ctx.lineTo(0,1.5);ctx.closePath();ctx.globalAlpha=1;ctx.fill();ctx.restore();}
  // street lamps: halo, light cone and moths
  for(const h of POSTES){ctx.globalAlpha=0.9*nf+0.1;ctx.drawImage(lightSprite([255,226,160]),h.x-16,h.y-14,32,28);
    const g=ctx.createLinearGradient(0,h.y,0,h.gy);g.addColorStop(0,`rgba(255,226,170,${0.14*nf})`);g.addColorStop(1,`rgba(255,226,170,${0.03*nf})`);ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(h.x-3,h.y+2);ctx.lineTo(h.x+3,h.y+2);ctx.lineTo(h.x+30,h.gy);ctx.lineTo(h.x-30,h.gy);ctx.closePath();ctx.fill();}
  if(nf>0.2)for(const m of MOTHS){m.a+=m.s*(0.6+Math.random());m.r+=(Math.random()-0.5)*0.6;m.r=clamp(m.r,3,12);const x=m.p.x+Math.cos(m.a)*m.r,y=m.p.y+6+Math.sin(m.a*1.3)*m.r*0.6;ctx.globalAlpha=0.8*nf;ctx.fillStyle='#fff3d0';ctx.fillRect(Math.round(x),Math.round(y),1,1);}
  // lamps inside rooms
  for(const h of HALOS){ctx.globalAlpha=h.a*(0.45+0.55*nf)*(0.92+0.08*Math.sin(frame/5+h.x));ctx.drawImage(lightSprite(h.c),h.x-h.r,h.y-h.r*0.8,h.r*2,h.r*1.6);}
  // police light bar halos
  {const ph=frame%48,red=ph<4||(ph>=8&&ph<12),blue=(ph>=24&&ph<28)||(ph>=32&&ph<36);if(red||blue){ctx.globalAlpha=0.9;const X=red?23:41,Y=9*TH+15;ctx.drawImage(lightSprite(red?[255,70,60]:[90,140,255]),X-34,Y-22,68,44);ctx.fillStyle=red?'#ffd0c8':'#d8e4ff';ctx.fillRect(X-12,Y-1,24,1);ctx.fillRect(X-1,Y-8,2,16);}}
  // warm windows seen from the yard and the side walls
  if(nf>0.02){ctx.globalAlpha=0.55*nf;ctx.fillStyle='rgb(255,200,120)';for(const x of [12,24])ctx.fillRect(x*T+6,16*TH-RISE+19,20,11);
    ctx.globalAlpha=0.35*nf;for(const [x,y] of [[9,12],[9,13],[28,12],[28,13]])ctx.fillRect(x*T+13,y*TH+3,6,TH-6);
    ctx.globalAlpha=0.25*nf;for(const x of [12,24]){ctx.drawImage(lightSprite([255,190,110]),x*T-6,16*TH-RISE+8,44,34);}}
  // dawn light through the north windows, with dust in the beam
  if(sf>0.01)for(const x of [12,13,19,24,25]){const rm=room[idx(x,4)],r=roomClip(rm);ctx.save();ctx.beginPath();ctx.rect(r[0],r[1],r[2]-r[0],r[3]-r[1]);ctx.clip();
    const y0=4*TH+14,g=ctx.createLinearGradient(0,y0,0,y0+70);g.addColorStop(0,`rgba(255,220,170,${0.22*sf})`);g.addColorStop(1,'rgba(255,220,170,0)');ctx.globalAlpha=1;ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(x*T+5,y0);ctx.lineTo(x*T+27,y0);ctx.lineTo(x*T+27+34,y0+70);ctx.lineTo(x*T+5+34,y0+70);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,240,210,.8)';for(let k=0;k<6;k++){const u=((k*0.37+frame*0.0016*(1+k%3))%1),w=((k*0.61+Math.sin(frame/90+k)*0.05)%1+1)%1;ctx.globalAlpha=0.5*sf*(1-u);ctx.fillRect(Math.round(x*T+5+w*22+u*34),Math.round(y0+u*70),1,1);}
    ctx.restore();}
  // puddles reflect whatever light is around them
  for(const p of PUDDLES){let r=0,g=0,b=0,w=0;for(const l of L){if(l.cone!=null||l.clip||l.a<0.05)continue;const d=Math.hypot(l.x-p.x,(l.y-p.y)*1.3);if(d>l.r*1.25)continue;const f=Math.pow(1-d/(l.r*1.25),2)*l.a;r+=l.c[0]*f;g+=l.c[1]*f;b+=l.c[2]*f;w+=f;}
    if(sf>0){r+=255*sf*0.3;g+=236*sf*0.3;b+=210*sf*0.3;w+=sf*0.3;}
    if(w<0.02)continue;const col=[r/w,g/w,b/w];ctx.globalAlpha=Math.min(0.75,w*0.6)*(0.3+0.7*WET);ctx.drawImage(lightSprite(col),p.x-p.rx,p.y-p.ry,p.rx*2,p.ry*2);}
  // car headlights at night, brake lights
  for(const c of FX.cars){if(nf>0.08){ctx.globalAlpha=0.8*nf;for(const hx of [14,50])ctx.drawImage(lightSprite([255,240,200]),c.x+hx-9,c.y+71-6,18,12);
      const g=ctx.createLinearGradient(0,c.y+76,0,c.y+150);g.addColorStop(0,`rgba(255,240,200,${0.2*nf})`);g.addColorStop(1,'rgba(255,240,200,0)');ctx.globalAlpha=1;ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(c.x+8,c.y+76);ctx.lineTo(c.x+56,c.y+76);ctx.lineTo(c.x+76,c.y+150);ctx.lineTo(c.x-12,c.y+150);ctx.closePath();ctx.fill();}
    if(c.brake||nf>0.2){ctx.globalAlpha=c.brake?0.9:0.4*nf;for(const hx of [14,50])ctx.drawImage(lightSprite([255,60,40]),c.x+hx-7,c.y+2,14,10);}}
  // luminol
  for(const p of FX.p){if(p.k!=='lum')continue;const k=1-p.t/p.life;ctx.globalAlpha=k*0.85;ctx.drawImage(lightSprite([70,170,255]),p.x-4,p.y-3,8,6);ctx.fillStyle='#bfe6ff';ctx.fillRect(Math.round(p.x),Math.round(p.y),1,1);}
  // fireflies
  if(nf>0)for(const f of FIREFLIES){f.x+=Math.sin(frame/60+f.ph)*f.sp;f.y+=Math.cos(frame/80+f.ph)*f.sp*0.6;const b=0.5+0.5*Math.sin(frame/18+f.ph);ctx.globalAlpha=b*nf;ctx.fillStyle='#e6ff96';ctx.fillRect(Math.round(f.x),Math.round(f.y*K-14),1,1);ctx.globalAlpha=0.35*b*nf;ctx.drawImage(lightSprite([200,255,120]),f.x-5,f.y*K-18,10,8);}
  // additive particles
  for(const p of FX.p){const k=1-p.t/p.life;
    if(p.k==='spark'){ctx.globalAlpha=k;ctx.fillStyle=rgbs(p.c);const sz=p.t<10?2:1;ctx.fillRect(Math.round(p.x),Math.round(p.y-p.z),sz,sz);}
    else if(p.k==='ring'){const rr=p.r*(1-k*k)+2;ctx.globalAlpha=k*0.9;ctx.strokeStyle=rgbs(p.c);ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(p.x,p.y,rr,rr*0.5,0,0,7);ctx.stroke();}
    else if(p.k==='flare'){const rr=46*k*p.a+8;ctx.globalAlpha=Math.min(1,k*1.2);ctx.drawImage(lightSprite([255,255,255]),p.x-rr,p.y-p.z-rr,rr*2,rr*2);ctx.fillStyle='#ffffff';ctx.fillRect(Math.round(p.x-rr*0.8),Math.round(p.y-p.z),Math.round(rr*1.6),1);ctx.fillRect(Math.round(p.x),Math.round(p.y-p.z-rr*0.5),1,Math.round(rr));}}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
}
function drawPuddles(){
  const al=0.25+0.75*WET,amb=ambient(),sky=mix(amb,[150,175,215],0.5);
  for(const p of PUDDLES){
    ctx.globalAlpha=0.6*al;ctx.fillStyle='#10161f';ctx.beginPath();ctx.ellipse(p.x,p.y+1,p.rx+1,p.ry+1,0,0,7);ctx.fill();
    const g=ctx.createLinearGradient(0,p.y-p.ry,0,p.y+p.ry);g.addColorStop(0,rgbs(mul(sky,0.55),0.9));g.addColorStop(0.55,rgbs(mul(sky,0.22),0.9));g.addColorStop(1,rgbs(mul(sky,0.4),0.9));
    ctx.globalAlpha=0.75*al;ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx,p.ry,0,0,7);ctx.fill();
    // shimmering highlight streaks
    ctx.globalAlpha=0.55*al;ctx.fillStyle=rgbs(mix(sky,[255,255,255],0.5));
    const sh=Math.sin(frame/40+p.ph)*p.rx*0.25;ctx.fillRect(Math.round(p.x-p.rx*0.45+sh),Math.round(p.y-p.ry*0.45),Math.round(p.rx*0.55),1);
    ctx.globalAlpha=0.3*al;ctx.fillRect(Math.round(p.x-p.rx*0.1-sh*0.6),Math.round(p.y+p.ry*0.15),Math.round(p.rx*0.4),1);
    ctx.globalAlpha=0.35*al;ctx.fillStyle='#0a0e14';ctx.fillRect(Math.round(p.x-p.rx*0.6),Math.round(p.y+p.ry-1),Math.round(p.rx*1.2),1);}
  ctx.globalAlpha=1;
}
function drawDecals(){
  if(LODV>=3){for(const d of FX.decals)decalHD(d);return;}
  ctx.fillStyle='#3a2a1c';
  for(const d of FX.decals){ctx.globalAlpha=0.5;const cx=Math.cos(d.a),sy=Math.sin(d.a);ctx.fillRect(Math.round(d.x+cx*1.5),Math.round(d.y+sy*0.8),2,1);ctx.fillRect(Math.round(d.x-cx*1.5),Math.round(d.y-sy*0.8),2,1);}
  ctx.globalAlpha=1;
}
function drawPreParticles(){
  for(const p of FX.p){const k=1-p.t/p.life;
    if(p.k==='puff'){ctx.globalAlpha=0.35*k;ctx.fillStyle=rgbs(p.c);const r=p.sz+p.t*0.08;ctx.beginPath();ctx.ellipse(p.x,p.y-p.z,r,r*0.7,0,0,7);ctx.fill();}
    else if(p.k==='leaf'){const fade=p.y>=p.gy?Math.min(1,(p.life-p.t)/80):1;ctx.globalAlpha=fade;ctx.fillStyle=p.c;const fl=Math.sin(p.t/6+p.ph)>0;ctx.fillRect(Math.round(p.x),Math.round(p.y),fl?2:1,1);}
    else if(p.k==='ripple'){ctx.globalAlpha=0.55*k;ctx.strokeStyle='#a9bdd6';ctx.lineWidth=0.75;const rr=p.r*(1-k)+1;ctx.beginPath();ctx.ellipse(p.x,p.y,rr,rr*0.45,0,0,7);ctx.stroke();}}
  ctx.globalAlpha=1;
}
function drawPostParticles(nf){
  for(const p of FX.p){const k=1-p.t/p.life;
    if(p.k==='splash'){ctx.globalAlpha=0.55*k;ctx.fillStyle='#c9d8ec';const e=Math.round((1-k)*3);ctx.fillRect(Math.round(p.x-1-e),Math.round(p.y-1-e*0.5),1,1);ctx.fillRect(Math.round(p.x+1+e),Math.round(p.y-1-e*0.5),1,1);ctx.fillRect(Math.round(p.x),Math.round(p.y-2-e),1,1);}
    else if(p.k==='drip'){ctx.globalAlpha=0.6*k;ctx.fillStyle='#b9cbe2';ctx.fillRect(Math.round(p.x),Math.round(p.y-p.z),1,1);}
    else if(p.k==='wisp'){const a=Math.min(1,p.t/20)*k;ctx.globalAlpha=0.14*a;ctx.fillStyle='#f4f6f8';const r=p.sz+p.t*0.07;ctx.beginPath();ctx.ellipse(p.x+Math.sin(p.t/14)*2,p.y-p.z,r*1.4,r,0,0,7);ctx.fill();}
    else if(p.k==='steam'){ctx.globalAlpha=0.28*k;ctx.fillStyle='#eef2f6';const r=p.sz+p.t*0.05;ctx.beginPath();ctx.ellipse(p.x+Math.sin(p.t/8)*1.5,p.y-p.z,r,r,0,0,7);ctx.fill();}}
  ctx.globalAlpha=1;
}
function drawRain(){
  const ri=rainI();if(ri<=0.01)return;
  ctx.strokeStyle='rgba(200,218,240,.34)';ctx.lineWidth=0.75;ctx.beginPath();
  const dx=0.18+WIND*0.25;
  for(const d of DROPS){if(roofed(d.x,d.y))continue;const x=d.x,y=d.y-d.z;ctx.moveTo(x,y);ctx.lineTo(x-dx*6,y-6);}
  ctx.stroke();
}
const AC=document.createElement('canvas'),actx=AC.getContext('2d');const AS=6;
function drawAtmos(s,ox,oy,nf){
  // mist and vignette share one low-resolution layer, composited once
  const w=Math.ceil(cv.width/AS),h=Math.ceil(cv.height/AS);if(AC.width!==w||AC.height!==h){AC.width=w;AC.height=h;}
  actx.setTransform(1,0,0,1,0,0);actx.clearRect(0,0,w,h);
  const fi=fogI();
  if(fi>0.01&&FOG){actx.imageSmoothingEnabled=true;const sc=s/AS,TS=720;
    const lay=(off,offy,al)=>{actx.globalAlpha=al;const v=viewRect();for(let y=Math.floor((v.y0-offy)/TS)*TS+offy-TS;y<v.y1+TS;y+=TS)for(let x=Math.floor((v.x0-off)/TS)*TS+off-TS;x<v.x1+TS;x+=TS)actx.drawImage(FOG,(x*s+ox)/AS,(y*s+oy)/AS,TS*sc,TS*sc);};
    lay((frame*0.22*(0.6+WIND))%720,(frame*0.05)%720,fi);lay(-(frame*0.14)%720+360,(frame*0.03)%720+200,fi*0.6);}
  const df=dayF(),sf=sunF();
  if(df>0.02){actx.imageSmoothingEnabled=true;const blk=lightSprite([0,0,0]);for(const c of FX.clouds){actx.globalAlpha=0.16*df;actx.drawImage(blk,(c.x-c.rx)*s/AS+ox/AS,(c.y-c.ry)*s/AS+oy/AS,c.rx*2*s/AS,c.ry*2*s/AS);}}
  if(sf>0.02){actx.save();actx.translate(w*0.8,-h*0.2);actx.rotate(0.62);for(let k=0;k<5;k++){const x=(k*0.23*w+frame*0.02)%(w*1.3)-w*0.15,bw=w*(0.04+0.03*(k%3));const g2=actx.createLinearGradient(x,0,x+bw,0);g2.addColorStop(0,'rgba(255,230,180,0)');g2.addColorStop(0.5,`rgba(255,230,180,${0.07*sf})`);g2.addColorStop(1,'rgba(255,230,180,0)');actx.globalAlpha=1;actx.fillStyle=g2;actx.fillRect(x,0,bw,h*2);}actx.restore();}
  actx.globalAlpha=1;
  const g=actx.createRadialGradient(w/2,h/2,Math.min(w,h)*0.35,w/2,h/2,Math.max(w,h)*0.75);g.addColorStop(0,'rgba(4,6,12,0)');g.addColorStop(1,`rgba(4,6,12,${0.32+0.22*nf})`);actx.fillStyle=g;actx.fillRect(0,0,w,h);
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(AC,0,0,cv.width,cv.height);
}
function drawBirds(){
  if(!FX.birds.length)return;
  for(const b of FX.birds){const up=Math.sin(b.ph)>0;ctx.globalAlpha=0.18;ctx.fillStyle='#000';ctx.fillRect(Math.round(b.x+26),Math.round(b.y+44),3,1);
    ctx.globalAlpha=0.9;ctx.fillStyle='#1c1f26';const x=Math.round(b.x),y=Math.round(b.y);ctx.fillRect(x,y,1,1);
    if(up){ctx.fillRect(x-2,y-1,2,1);ctx.fillRect(x+1,y-1,2,1);ctx.fillRect(x-3,y-2,1,1);ctx.fillRect(x+3,y-2,1,1);}else{ctx.fillRect(x-2,y,2,1);ctx.fillRect(x+1,y,2,1);ctx.fillRect(x-3,y+1,1,1);ctx.fillRect(x+3,y+1,1,1);}}
  ctx.globalAlpha=1;
}
function drawOverlayFx(){
  for(const p of FX.p){if(p.k!=='text')continue;const k=1-p.t/p.life,al=Math.min(1,k*3)*Math.min(1,p.t/8);
    const y=Math.round(p.y-p.z);ctx.save();if(UIK<0.999){ctx.translate(p.x,y);ctx.scale(UIK,UIK);ctx.translate(-p.x,-y);}ctx.font='bold 8px ui-monospace,Menlo,monospace';ctx.textAlign='center';
    ctx.globalAlpha=al;ctx.fillStyle='rgba(8,10,12,.85)';const w=ctx.measureText(p.txt).width+8;ctx.fillRect(Math.round(p.x-w/2),y-8,Math.ceil(w),11);
    ctx.fillStyle=p.c;ctx.fillText(p.txt,p.x,y);ctx.textAlign='left';ctx.restore();}
  ctx.globalAlpha=1;
}
function drawPathPreview(){
  const a=S.crew.find(k=>k.id===sel);if(!a||!a.path.length)return;
  ctx.fillStyle='rgba(242,194,48,.85)';let px=a.x*T+16,py=a.y*TH+TH-4;
  for(const n of a.path){const nx=(n%W)*T+16,ny=((n/W)|0)*TH+TH-4;for(let t=0.25;t<=1;t+=0.25){const x=px+(nx-px)*t,y=py+(ny-py)*t;if(((t*4+frame/6)|0)%2===0)ctx.fillRect(Math.round(x)-1,Math.round(y),2,1);}px=nx;py=ny;}
  const e=a.path[a.path.length-1],ex=(e%W)*T+16,ey=((e/W)|0)*TH+TH-4,r=7+Math.sin(frame/8)*1.5;
  ctx.strokeStyle='rgba(242,194,48,.9)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(ex,ey,r,r*0.5,0,0,7);ctx.stroke();
}

/* ---------- Sound (synthesised, no files) ---------- */
const SND={ctx:null,on:true,
  init(){if(this.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const c=this.ctx=new C();
    this.g=c.createGain();this.g.gain.value=this.on?0.8:0;this.g.connect(c.destination);
    const len=c.sampleRate*2,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);let b0=0,b1=0,b2=0;
    for(let i=0;i<len;i++){const w=Math.random()*2-1;b0=0.99765*b0+w*0.099046;b1=0.963*b1+w*0.2965164;b2=0.57*b2+w*1.0526913;d[i]=(b0+b1+b2+w*0.1848)*0.16;}
    this.noise=buf;
    const bed=(type,f,q,gain)=>{const s=c.createBufferSource();s.buffer=buf;s.loop=true;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const g=c.createGain();g.gain.value=gain;s.connect(fl);fl.connect(g);g.connect(this.g);s.start(0,Math.random()*1.5);return g;};
    this.rainG=bed('bandpass',1800,0.5,0);this.rainH=bed('highpass',6000,0.4,0);this.hum=bed('lowpass',140,0.6,0.22);
  }catch(e){this.ctx=null;}},
  resume(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},
  set(on){this.on=on;if(this.g)this.g.gain.setTargetAtTime(on?0.8:0,this.ctx.currentTime,0.05);},
  tick(){if(!this.ctx||!this.on)return;const t=this.ctx.currentTime,ri=rainI(),nf=nightF(),sf=sunF(),run=!paused;
    this.rainG.gain.setTargetAtTime(ri*0.5,t,0.6);this.rainH.gain.setTargetAtTime(ri*0.09,t,0.6);
    if(!run)return;
    if(nf>0.3&&Math.random()<0.035*nf)this.cricket();
    if(sf>0.08&&Math.random()<0.02*sf)this.bird();
    if(Math.random()<0.0012)this.radio();
    if(Math.random()<0.0004)this.siren();},
  env(node,t,a,d,peak){const g=this.ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);node.connect(g);g.connect(this.g);},
  osc(type,f,t,a,d,peak,f2){const o=this.ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+a+d);this.env(o,t,a,d,peak);o.start(t);o.stop(t+a+d+0.05);},
  nz(t,dur,type,f,q,peak){const s=this.ctx.createBufferSource();s.buffer=this.noise;const fl=this.ctx.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q||1;s.connect(fl);this.env(fl,t,0.003,dur,peak);s.start(t,Math.random()*1.5);s.stop(t+dur+0.1);},
  ok(){return this.ctx&&this.on;},
  cricket(){const t=this.ctx.currentTime,f=4300+Math.random()*700,n=2+Math.floor(Math.random()*3);for(let k=0;k<n;k++)this.osc('sine',f,t+k*0.065,0.004,0.035,0.018);},
  bird(){const t=this.ctx.currentTime,f=2300+Math.random()*1900,n=2+Math.floor(Math.random()*4);for(let k=0;k<n;k++)this.osc('sine',f*(1+0.1*k),t+k*0.11,0.008,0.07,0.035,f*(1.35+Math.random()*0.35));},
  radio(){const t=this.ctx.currentTime;this.nz(t,0.28,'bandpass',1700,4,0.06);this.osc('square',760,t+0.3,0.004,0.06,0.008);this.nz(t+0.42,0.18,'bandpass',1900,4,0.045);},
  siren(){const t=this.ctx.currentTime;const o=this.ctx.createOscillator();o.type='sine';o.frequency.setValueAtTime(620,t);for(let k=0;k<6;k++){o.frequency.linearRampToValueAtTime(880,t+k*0.9+0.45);o.frequency.linearRampToValueAtTime(620,t+k*0.9+0.9);}const fl=this.ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=900;o.connect(fl);const g=this.ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.012,t+1.2);g.gain.linearRampToValueAtTime(0.0001,t+5.4);fl.connect(g);g.connect(this.g);o.start(t);o.stop(t+5.5);},
  shutter(vol){if(!this.ok())return;const t=this.ctx.currentTime,v=vol==null?1:vol;this.nz(t,0.025,'highpass',3200,0.7,0.3*v);this.nz(t+0.055,0.035,'highpass',2600,0.7,0.22*v);},
  chime(){if(!this.ok())return;const t=this.ctx.currentTime;this.osc('triangle',659.3,t,0.01,0.55,0.11);this.osc('triangle',987.8,t+0.11,0.01,0.75,0.09);this.osc('sine',1318.5,t+0.22,0.01,0.9,0.05);},
  bark(){if(!this.ok())return;const t=this.ctx.currentTime;for(const k of [0,0.24]){this.osc('sawtooth',440,t+k,0.004,0.12,0.05,180);this.nz(t+k,0.09,'bandpass',850,2,0.11);}},
  click(){if(!this.ok())return;const t=this.ctx.currentTime;this.osc('sine',1500,t,0.002,0.025,0.035);},
  tape(){if(!this.ok())return;const t=this.ctx.currentTime;this.nz(t,0.18,'bandpass',3000,1.5,0.05);},
  honk(){if(!this.ok())return;const t=this.ctx.currentTime;for(const k of [0,0.22]){this.osc('square',415,t+k,0.01,0.16,0.03);this.osc('square',520,t+k,0.01,0.16,0.022);}},
  whoosh(v){if(!this.ok()||v<=0.02)return;const t=this.ctx.currentTime;const s=this.ctx.createBufferSource();s.buffer=this.noise;const fl=this.ctx.createBiquadFilter();fl.type='bandpass';fl.Q.value=0.8;fl.frequency.setValueAtTime(300,t);fl.frequency.linearRampToValueAtTime(900,t+0.6);fl.frequency.linearRampToValueAtTime(250,t+1.4);s.connect(fl);const g=this.ctx.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.16*v,t+0.6);g.gain.linearRampToValueAtTime(0.0001,t+1.5);fl.connect(g);g.connect(this.g);s.start(t,Math.random());s.stop(t+1.6);},
  flap(){if(!this.ok())return;const t=this.ctx.currentTime;for(let k=0;k<4;k++)this.nz(t+k*0.07,0.04,'bandpass',1200,1,0.05);},
  heli(v){if(!this.ctx)return;if(!this.heliG){const c=this.ctx,s=c.createBufferSource();s.buffer=this.noise;s.loop=true;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=220;const am=c.createGain();am.gain.value=0;const lfo=c.createOscillator();lfo.frequency.value=11;const lg=c.createGain();lg.gain.value=0.5;lfo.connect(lg);lg.connect(am.gain);const off=c.createConstantSource?c.createConstantSource():null;if(off){off.offset.value=0.5;off.connect(am.gain);off.start();}s.connect(fl);fl.connect(am);this.heliG=c.createGain();this.heliG.gain.value=0;am.connect(this.heliG);this.heliG.connect(this.g);s.start();lfo.start();}
    this.heliG.gain.setTargetAtTime(this.on?v*0.55:0,this.ctx.currentTime,0.3);},
  flyby(){if(!this.ok())return;const c=this.ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=this.noise;s.loop=true;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=480;const am=c.createGain();am.gain.value=0.55;const lfo=c.createOscillator();lfo.type='square';lfo.frequency.setValueAtTime(10,t);lfo.frequency.linearRampToValueAtTime(15,t+0.8);lfo.frequency.linearRampToValueAtTime(9,t+2.1);const lg=c.createGain();lg.gain.value=0.45;lfo.connect(lg);lg.connect(am.gain);s.connect(fl);fl.connect(am);const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(1.1,t+0.75);g.gain.linearRampToValueAtTime(0.0001,t+2.2);am.connect(g);g.connect(this.g);s.start(t,Math.random());s.stop(t+2.3);lfo.start(t);lfo.stop(t+2.3);this.osc('sawtooth',1150,t,0.6,1.4,0.012,760);},
  stamp(){if(!this.ok())return;const t=this.ctx.currentTime;this.nz(t,0.07,'lowpass',380,0.8,0.55);this.osc('sine',150,t,0.002,0.14,0.2,62);this.osc('triangle',1568,t+0.06,0.004,0.22,0.035);this.osc('triangle',2093,t+0.12,0.004,0.3,0.025);},
  eject(){if(!this.ok())return;const c=this.ctx,t=c.currentTime,o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(70,t);o.frequency.linearRampToValueAtTime(115,t+0.42);const fl=c.createBiquadFilter();fl.type='bandpass';fl.frequency.value=700;fl.Q.value=1.6;o.connect(fl);this.env(fl,t,0.03,0.42,0.035);o.start(t);o.stop(t+0.5);this.nz(t+0.02,0.4,'bandpass',2600,2.5,0.03);},
  blip(){if(!this.ok())return;const t=this.ctx.currentTime;this.osc('sine',988,t,0.004,0.08,0.045);this.osc('sine',1319,t+0.1,0.004,0.12,0.04);},
  squelch(){if(!this.ok())return;const t=this.ctx.currentTime;this.nz(t,0.06,'bandpass',2200,3,0.03);},
  grab(){if(!this.ok())return;const t=this.ctx.currentTime;this.osc('sine',360,t,0.003,0.08,0.05,620);this.nz(t,0.03,'highpass',3000,0.7,0.04);},
  drop(){if(!this.ok())return;const t=this.ctx.currentTime;this.osc('sine',240,t,0.003,0.12,0.09,110);this.nz(t,0.05,'lowpass',700,0.7,0.14);this.nz(t+0.09,0.18,'bandpass',1700,4,0.05);this.osc('square',760,t+0.2,0.004,0.05,0.008);},
  pop(){if(!this.ok())return;const t=this.ctx.currentTime;this.osc('sine',520,t,0.004,0.12,0.06,780);}
};

/* ---------- Events with a choice ---------- */
const EVENTS={
  garoa:{who:'mauricio',title:'A garoa está apertando',text:'Se a gente demorar no quintal, a água leva o que tiver lá fora. Começo por onde?',opts:[
    {t:'Começa pelo quintal',sub:'O canil vai primeiro; a casa espera um pouco.',fn:()=>{S.flags.prioQ=1;for(let i=0;i<N;i++)if(hot[i]==='cao_canil'&&periciavel(i))S.desig[i]=1;msg('mauricio','Canil primeiro, antes que a água leve alguma coisa. Depois eu entro.');}},
    {t:'Primeiro a casa',sub:'Lá fora, a perícia rende menos enquanto chover.',fn:()=>{S.flags.prioQ=0;msg('mauricio','Certo, casa primeiro. O quintal vai sofrer com essa garoa.');}}]},
  imprensa:{who:'paulo',title:'Imprensa no portão',text:'Estão pedindo alguém para falar. Se ninguém atender, vão ficar forçando a frente da casa.',opts:[
    {t:'Paulo atende rápido',sub:'Paulo sai do perímetro um tempo; a imprensa sossega.',fn:()=>{S.flags.pressCalm=1;const a=S.crew.find(k=>k.key==='paulo');if(a){endJob(a);const r=findPath(a,i=>i===idx(5,6));a.job={k:'talk',p:0};a.path=r?r.path:[];a.status='Indo falar com a imprensa';}for(const c of S.civs)if(c.press&&c.state==='gawk')c.wait=Math.min(c.wait,160);}},
    {t:'Ninguém fala agora',sub:'Paulo segue livre; a imprensa insiste por mais tempo.',fn:()=>{S.flags.pressCalm=-1;for(const c of S.civs)if(c.press)c.wait=Math.round(c.wait*1.4);}}]}
};
const EVQ=[];let evOpen=null,evPrev=1;
function queueEvent(k){EVQ.push(k);}
function pumpEvents0(){
  if(evOpen||!EVQ.length||!$('#intro').hidden||!$('#end').hidden||!radioEl.hidden)return;
  const k=EVQ.shift(),ev=EVENTS[k];evOpen=k;evPrev=paused?(lastSpeed||1):speed;setSpeed(0);
  const p=PEOPLE[ev.who];
  $('#evt-av').innerHTML=avatar(ev.who);$('#evt-who').textContent=p.name;$('#evt-title').textContent=ev.title;$('#evt-text').textContent=ev.text;
  const box=$('#evt-opts');box.innerHTML='';
  ev.opts.forEach((o,n)=>{const b=document.createElement('button');b.innerHTML=`<b>${o.t}</b><span>${o.sub}</span>`;b.addEventListener('click',()=>{SND.click();o.fn();$('#evt').hidden=true;evOpen=null;appEl.classList.remove('evt-on');setSpeed(evPrev);clearTimeout(coachTm);coachTm=setTimeout(showCoach,1400);});box.appendChild(b);});
  $('#evt').hidden=false;appEl.classList.add('evt-on');if(cmd)cmdCancel();hideCoach();SND.pop();
}

/* ---------- Level of detail: farther away reads like a plan, closer in shows the small things ---------- */
let LODV=1,LODE=1;
function lodOf(e){return e<0.9?0:e<1.6?1:e<2.4?2:3;}
let BLADES=[],LITTER=[];
function buildDetail(){
  const r=mulberry32(5150);BLADES=[];LITTER=[];
  for(let ty=-3;ty<H+3;ty++)for(let tx=-4;tx<W+4;tx++){
    const f=floorAt(tx,ty),inMap=tx>=0&&ty>=0&&tx<W&&ty<H,i=inMap?idx(tx,ty):-1;
    if(inMap&&(occ[i]>=0||isWallF(floor[i])))continue;
    if(f===F.GRASS&&!inRoof(tx*T+4,ty*T+4)&&tx!==-2){const n=2+Math.floor(r()*3);for(let k=0;k<n;k++)BLADES.push({x:tx*T+2+r()*28,y:ty*TH+2+r()*(TH-3),h:2+Math.floor(r()*4),c:pick(['#4a8238','#56903f','#3f7632','#62a048']),ph:r()*6.28,dew:r()<0.12});}
    const street=f===F.STREET||f===F.WALK,yard=f===F.CONC||(inMap&&room[i]==='terreno');
    if((street&&r()<0.55)||(yard&&r()<0.25)){const n=1+Math.floor(r()*3);for(let k=0;k<n;k++)LITTER.push({x:tx*T+3+r()*26,y:ty*TH+3+r()*(TH-6),k:Math.floor(r()*7),a:r()});}
  }
}
function drawDetail(v){
  const fa=clamp((LODE-1.45)/0.3,0,1);if(fa<=0)return;ctx.save();ctx.globalAlpha=fa;try{drawDetail2(v);}finally{ctx.restore();}
}
function drawDetail2(v){
  const sf=sunF();
  for(const l of LITTER){if(l.x<v.x0-8||l.x>v.x1+8||l.y<v.y0-8||l.y>v.y1+8)continue;const x=Math.round(l.x),y=Math.round(l.y);
    switch(l.k){case 0:ctx.fillStyle='#ece6d8';ctx.fillRect(x,y,3,1);ctx.fillStyle='#c8742a';ctx.fillRect(x+3,y,1,1);break;
      case 1:ctx.fillStyle='#8f949a';ctx.fillRect(x,y,2,2);ctx.fillStyle='#c9cdd2';ctx.fillRect(x,y,1,1);break;
      case 2:case 3:ctx.fillStyle=l.k===2?'#5c5a55':'#7b7871';ctx.fillRect(x,y,1,1);ctx.fillRect(x+2,y+1,1,1);break;
      case 4:ctx.fillStyle=l.a<0.5?'#8a5a2b':'#6a8a3a';ctx.fillRect(x,y,2,1);ctx.fillRect(x+1,y+1,1,1);break;
      case 5:ctx.fillStyle='rgba(30,30,30,.35)';ctx.fillRect(x,y,2,1);break;
      default:ctx.fillStyle='#e8e4da';ctx.fillRect(x,y,3,2);ctx.fillStyle='#b8b2a4';ctx.fillRect(x,y+1,3,1);}}
  const wv=0.6+WIND;
  for(const b of BLADES){if(b.x<v.x0-4||b.x>v.x1+4||b.y<v.y0-4||b.y>v.y1+8)continue;
    const sw=Math.round(Math.sin(frame/28+b.ph+b.x*0.04)*wv*0.9);ctx.fillStyle=b.c;ctx.fillRect(Math.round(b.x),Math.round(b.y-b.h+1),1,b.h);ctx.fillRect(Math.round(b.x+sw),Math.round(b.y-b.h),1,1);
    if(b.dew&&WET>0.3&&sf>0.05&&((frame>>3)+b.ph*10|0)%9===0){ctx.fillStyle='rgba(255,255,255,.9)';ctx.fillRect(Math.round(b.x+sw),Math.round(b.y-b.h),1,1);}}
}
function drawClocks(){
  if(LODV<2)return;
  const m=minutes(),hA=((m/60)%12)/12*Math.PI*2-Math.PI/2,mA=(m%60)/60*Math.PI*2-Math.PI/2;
  for(const [cx,cy,r] of [[14*T+16,74,6],[21*T+16,72,4]]){ctx.fillStyle='#f4efe2';ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();
    ctx.strokeStyle='#222';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(hA)*r*0.5,cy+Math.sin(hA)*r*0.5);ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(mA)*r*0.85,cy+Math.sin(mA)*r*0.85);ctx.stroke();
    ctx.fillStyle='#c0392b';ctx.fillRect(Math.round(cx+Math.cos(frame/9.55)*r*0.8),Math.round(cy+Math.sin(frame/9.55)*r*0.8),1,1);}
}
const ROOM_LABEL={sala:[12.5,6],cozinha:[19,6],escritorio:[25,6.3],casal:[12.5,14.4],corredor:[19,13],livia:[25,14.4],quintal:[19,22],terreno:[30.5,8]};
function drawRoomLabels(){
  const fa=clamp((1.0-LODE)/0.2,0,1);if(fa<=0)return;ctx.save();ctx.globalAlpha=fa;try{drawRoomLabels2();}finally{ctx.restore();}
}
function drawRoomLabels2(){
  ctx.font='bold 9px ui-monospace,Menlo,monospace';ctx.textAlign='center';
  for(const k in ROOM_LABEL){const [x,y]=ROOM_LABEL[k],X=x*T,Y=y*TH,t=ROOM_NAME[k].toUpperCase(),w=ctx.measureText(t).width+10;
    const ga=ctx.globalAlpha;ctx.globalAlpha=ga*0.78;ctx.fillStyle='rgba(8,10,12,.75)';ctx.fillRect(Math.round(X-w/2),Math.round(Y-9),Math.ceil(w),13);ctx.globalAlpha=ga;ctx.fillStyle='#e9edf0';ctx.fillText(t,X,Y);}
  ctx.textAlign='left';
}
function drawLabels(){
  const fa=clamp((LODE-2.25)/0.3,0,1);if(fa<=0)return;ctx.save();ctx.globalAlpha=fa;try{drawLabels2();}finally{ctx.restore();}
}
function drawLabels2(){
  const fs=Math.max(1.6,6*Math.min(1,2.6/LODE)),lh=fs*1.45;ctx.font=`600 ${fs}px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`;ctx.textAlign='center';
  const used=[];const lab=(p,t,c)=>{const X=p.x*T+16,w=ctx.measureText(t).width+fs;let Y=p.y*TH+TH+fs+1;for(let n=0;n<6;n++){if(!used.some(u=>Math.abs(u[0]-X)<(u[2]+w)/2&&Math.abs(u[1]-Y)<lh))break;Y+=lh;}used.push([X,Y,w]);ctx.fillStyle='rgba(8,10,12,.72)';ctx.fillRect(X-w/2,Y-fs,w,lh);ctx.fillStyle=c;ctx.fillText(t,X,Y);};
  for(const a of S.crew)lab(a,(SHORT[a.key]||a.ini)+' · '+a.status,'#e9edf0');
  for(const c of S.civs)lab(c,c.press?'Imprensa':c.state==='leave'?'Indo embora':'Curioso','#c9cfd4');
  if(IML.agents[0])lab(IML.agents[0],'IML · '+IML.say,'#c9cfd4');
  ctx.textAlign='left';
}

/* ---------- Stylised crime scene (switchable) ---------- */
let GORE=true,BODIES=2;const BEDOV={};
function bedOverlay(bodies,gore,hi){
  const key=bodies+'|'+gore+'|'+hi;if(BEDOV[key])return BEDOV[key];
  const c=document.createElement('canvas');c.width=66;c.height=134;const g=c.getContext('2d');
  const P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x)+1,Math.round(y)+25,w,h);};
  const E=(cx,cy,rx,ry,col)=>{g.fillStyle=col;for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++){const dy=(y+.5-cy)/ry;if(Math.abs(dy)>1)continue;const hw=rx*Math.sqrt(1-dy*dy);g.fillRect(Math.round(cx-hw)+1,y+25,Math.max(1,Math.round(hw*2)),1);}};
  const r=mulberry32(4242+bodies*7+(hi?1:0));
  const top=32,bot=82,by=top+16,heads=[18,46];
  const BL={b:'#8fa4bb',hi:'#a9bcd0',sh:'#7287a0',dk:'#62778f'};
  const PEOPLE_BED=[
    {skin:'#e0b48c',skSh:'#c0946c',hair:'#4a4038',hairHi:'#7a7470',top:'#6a7f9a',topSh:'#53667f',long:false},
    {skin:'#ecc8a6',skSh:'#cfa684',hair:'#5a3a22',hairHi:'#7a5434',top:'#d9b8c8',topSh:'#bf9cae',long:true}];
  const blob=(cx,cy,rx,ry,cols)=>{for(let k=0;k<6;k++)E(cx+(r()-0.5)*rx*0.9,cy+(r()-0.5)*ry*0.8,rx*(0.45+r()*0.4),ry*(0.45+r()*0.4),cols[0]);E(cx,cy,rx*0.55,ry*0.55,cols[1]);E(cx+(r()-0.5)*2,cy,rx*0.28,ry*0.3,cols[2]);};
  const present=bodies===2?[0,1]:bodies===1?[1]:[];
  if(gore){
    // stains that stay after the removal: pillows, headboard and the wall above it
    for(const hx of heads)blob(hx,top+8,10,6.5,['#5a0b0e','#6e1013','#3e0709']);
    for(const hx of heads)for(let k=0;k<(hi?34:14);k++){const a=r()*Math.PI,d=3+r()*18;P(hx+Math.cos(a)*d*1.35,24-Math.sin(a)*d*1.2,r()<0.18?2:1,1,r()<0.5?'#6e1013':'#8a1a1d');}
    for(let k=0;k<(hi?7:3);k++){const x=8+r()*48,y=12+r()*10;P(x,y,1,2+Math.floor(r()*(hi?8:4)),'#5e0d10');}
    for(const hx of heads){E(hx-2,by+3,6,3,'#6a1418');E(hx-3,by+2,3,1.5,'#7a1014');}
    if(hi)for(let k=0;k<22;k++)P(4+r()*56,top+2+r()*16,1,1,r()<0.5?'#7a1014':'#9b1c20');
  }
  if(!gore&&present.length){
    // covered by a sheet
    const x0=present.length===2?3:33,x1=61;
    P(x0,top+1,x1-x0,bot-top+9,'#d6d1c7');P(x0,top+1,x1-x0,1,'#ece8e0');
    for(let x=x0+5;x<x1;x+=7)P(x,bot+1,1,8,'#b8b2a7');P(x0,bot+9,x1-x0,1,'#a49e93');
    for(const i of present){const hx=heads[i];
      E(hx,top+8,8.5,5.5,'#ece8e0');E(hx+2,top+10,6,3,'#c9c3b8');
      for(let y=top+15;y<bot-3;y++){const w=y<top+22?10+(y-top-15)*0.4:12-(y-top-22)*0.08;P(hx-w,y,w*2,1,y%5===0?'#e2ded5':'#e6e2d9');}
      E(hx-5,bot-2,3.5,2.5,'#ece8e0');E(hx+5,bot-2,3.5,2.5,'#ece8e0');P(hx+9,top+16,2,bot-top-20,'#bfb9ae');}
    if(present.length===2)P(32,top+14,1,bot-top-14,'#b0aa9f');
  }
  if(gore)for(const i of present){
    // as they were found: asleep on their backs, under the blanket
    const hx=heads[i],L=PEOPLE_BED[i];
    // body shape under the blanket
    E(hx+1.5,by+10,9,9,BL.sh);E(hx+1,by+24,7,11,BL.sh);
    E(hx-0.5,by+9.5,8.5,8.5,BL.b);E(hx-0.5,by+23.5,6.5,10.5,BL.b);
    E(hx-2,by+8,6,6,BL.hi);E(hx-2,by+21,4,8,BL.hi);
    E(hx-3.5,bot-4,3,2,BL.hi);E(hx+3.5,bot-4,3,2,BL.hi);P(hx,bot-6,1,4,BL.sh);
    // shoulders and the turned-down sheet
    E(hx,top+15,9,3,L.top);E(hx+3,top+16,6,2,L.topSh);
    P(hx-11,by-1,22,3,'#f1eee6');P(hx-11,by+1,22,1,'#d6d1c7');
    // hair spread on the pillow, then the face
    if(L.long){E(hx,top+7,8.5,5,L.hair);E(hx-6,top+11,2.5,3.5,L.hair);E(hx+6,top+11,2.5,3.5,L.hair);E(hx-2,top+5,4,1.5,L.hairHi);}
    else{E(hx,top+6,5.5,3.2,L.hair);P(hx-3,top+4,6,1,L.hairHi);}
    E(hx,top+9,4,3.6,L.skin);E(hx+2,top+10,2,2.4,L.skSh);
    P(hx-2,top+9,2,1,'#6a4a3a');P(hx+1,top+9,2,1,'#6a4a3a');P(hx,top+10,1,1,L.skSh);P(hx-1,top+12,2,1,L.skSh);
    P(hx-2,top+12,4,2,L.skin);
    // arms
    if(i===0){P(hx-12,by-1,3,7,L.top);P(hx-12,by+6,3,8,L.skin);P(hx-11,by+6,1,8,L.skSh);P(hx-12,by+14,3,2,L.skin);}
    else{P(hx-7,by+3,11,2,L.top);P(hx-7,by+5,11,1,L.topSh);P(hx+4,by+3,3,2,L.skin);}
    // blood: matted hair, soaked collar, run-off down the side of the mattress, a pool on the floor
    for(let k=0;k<(hi?9:5);k++)P(hx-5+r()*10,top+4+r()*4,1,1,'#7a1014');
    P(hx-4,top+13,8,2,'#7a1014');P(hx-3,top+14,5,1,'#5a0b0e');
    if(i===0){P(hx-12,by+12,3,2,'#7a1014');P(2,bot,1,8,'#6e1013');P(4,bot+2,1,6,'#5a0b0e');E(5,bot+19,6,2,'#4e090c');E(4,bot+19,3,1,'#6e1013');if(hi){P(9,bot+22,1,1,'#6e1013');P(1,bot+21,1,1,'#6e1013');}}
    else{P(hx+9,top+14,1,6,'#6e1013');}
  }
  return BEDOV[key]=c;
}
function setGore(v){GORE=!!v;const a=$('#opt-gore');if(a)a.checked=GORE;const b=$('#gore-t');if(b){b.textContent='Cena 18+: '+(GORE?'ligada':'desligada');b.setAttribute('aria-pressed',String(GORE));}}

/* ---------- Day life ---------- */
function dayF(){return clamp((minutes()-(5*60+48))/22,0,1);}
const SIL=new WeakMap();
function silhouette(c){let s=SIL.get(c);if(s)return s;s=document.createElement('canvas');s.width=c.width;s.height=c.height;const g=s.getContext('2d');g.drawImage(c,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,s.width,s.height);SIL.set(c,s);return s;}
function sunSkew(){const m=minutes(),u=clamp((m-(5*60+48))/90,0,1);return {c:1.5-0.9*u,d:0.36};}
function castShadow(img,ax,ay,ix,iy,flip,al){
  const sk=sunSkew();ctx.save();ctx.globalAlpha=al;ctx.translate(ax,ay);ctx.transform(1,0,sk.c,sk.d,0,0);if(flip)ctx.scale(-1,1);ctx.drawImage(silhouette(img),-ix,-iy);ctx.restore();
}
const SHADOW_T={arvore:1,arbusto:1,poste:1,lixeira:1,viatura:1,carro:1,canil:1,varal:1,vaso:1,planta:1,bicicleta:1};
function drawSunShadows(v){
  const df=dayF();if(df<=0.01)return;const al=0.26*df;const sk=sunSkew();
  // house and lot walls throw long shadows west
  ctx.globalAlpha=al;ctx.fillStyle='#000';
  const H1=RISE+2*TH-6;
  ctx.beginPath();ctx.moveTo(9*T,3*TH);ctx.lineTo(9*T,17*TH);ctx.lineTo(9*T-H1*sk.c,17*TH-H1*sk.d);ctx.lineTo(9*T-H1*sk.c,3*TH-H1*sk.d);ctx.closePath();ctx.fill();
  const H2=TH-CAPH;for(const x of [6,33]){ctx.beginPath();ctx.moveTo(x*T,1*TH);ctx.lineTo(x*T,25*TH);ctx.lineTo(x*T-H2*sk.c,25*TH-H2*sk.d);ctx.lineTo(x*T-H2*sk.c,1*TH-H2*sk.d);ctx.closePath();ctx.fill();}
  ctx.globalAlpha=1;
  for(const o of objs){if(o.flat||!SHADOW_T[o.t]||!o.spr)continue;const i=idx(o.x,o.y);if(inHouse(i))continue;const s=o.spr,X=o.x*T+s.ox-s.pad,Y=o.y*TH+s.oy-s.pad,base=Y+s.c.height;
    if(X>v.x1+40||X+s.c.width<v.x0-200||base<v.y0-40||Y>v.y1+40)continue;castShadow(s.c,X,base,0,s.c.height,false,al);}
  const ppl=[...S.crew,...S.civs,...IML.agents];
  for(const p of ppl){if(inHouse(ti(p)))continue;const X=Math.round(p.x*T)+16,Y=Math.round(p.y*TH)+TH-2;const img=framesFor(p)[0];castShadow(img,X,Y,14,45,p.dir<0,al);}
  for(const c of FX.cars)castShadow(c.spr,c.x,c.y+84,0,84,false,al);
}
function carPal(hb){const b=hex(hb);return {b:hb,hi:rgbs(mix(b,[255,255,255],0.28)),sh:rgbs(mul(b,0.76)),dk:rgbs(mul(b,0.58)),fr:rgbs(mul(b,0.88))};}
let TRAFFIC=[],VANSPR=null;
function buildCars(){
  TRAFFIC=['#c9c4b8','#8a2f2f','#2f6b4a','#d9d4c7','#26282c','#b98a2a','#5a6a7a'].map(c=>outlined(S2(64,84,(P,E)=>drawCarPx(P,E,carPal(c),false,false))));
  VANSPR=outlined(S2(64,84,(P,E)=>drawCarPx(P,E,{b:'#d9dcd8',hi:'#eef0ec',sh:'#aeb3af',dk:'#7f8580',fr:'#c4c8c4'},false,true)));
}
function spawnCar(){FX.cars.push({spr:pick(TRAFFIC),x:2*T,y:-6*TH,v:1.5,vmax:1.3+Math.random()*0.6,wait:0,honked:0,brake:0,wh:0});}
function updCars(dt){
  if(!dt)return;const m=minutes(),rate=(m<5*60+30?0.0012:0.0045)*dt;
  if(!(S.blockUntil>S.tick)&&Math.random()<rate&&FX.cars.filter(c=>!c.parked&&c.y<2*TH).length===0&&FX.cars.length<5)spawnCar();
  const ppl=[...S.crew,...S.civs,...IML.agents];
  for(const c of FX.cars){
    if(c.parked)continue;
    if(c.shift){c.x+=(c.shift.to-c.x)*0.04*dt;if(Math.abs(c.x-c.shift.to)<0.6){c.x=c.shift.to;const s=c.shift;c.shift=null;if(s.park){c.parked=true;c.v=0;continue;}}}
    const front=c.y+84;let gap=1e9;
    for(const o of FX.cars){if(o===c)continue;if(Math.abs(o.x-c.x)<40&&o.y>c.y)gap=Math.min(gap,o.y-front);}
    for(const p of ppl){const px=p.x*T+16;if(px<c.x-3||px>c.x+67)continue;const d=p.y*TH+TH-2-front;if(d>-34)gap=Math.min(gap,Math.max(0,d));}
    if(front<=CROSS_Y*TH+2&&S.civs.some(p=>p.wantCross))gap=Math.min(gap,Math.max(0,CROSS_Y*TH-6-front));
    let tgt=c.vmax;if(c.y+84>3*TH&&c.y<17*TH)tgt*=0.6;
    if(c.iml&&!c.left&&c.y>=c.park-30)tgt=Math.max(0.15,(c.park-c.y)*0.03);
    const SD=12;tgt=Math.min(tgt,Math.max(0,(gap-SD)*0.05));
    c.brake=tgt<c.v-0.05?1:0;c.v+=(tgt-c.v)*(tgt<c.v?0.3:0.06)*dt;if(c.v<0)c.v=0;
    let mv=c.v*dt;if(gap-SD<mv)mv=Math.max(0,gap-SD);if(mv<0.01)c.v=Math.min(c.v,0.05);
    if(mv<0.05&&gap<60){c.wait+=dt;if(c.wait>110&&!c.honked){c.honked=1;SND.honk();floatText(c.x+32,c.y+30,'BI-BI!','#f3f5f6',60);}}else c.wait=0;
    c.y+=mv;
    if(c.iml&&!c.left&&!c.shift&&c.y>=c.park-0.5){c.y=c.park;c.shift={to:0,park:true};}
    if(WET>0.4&&c.v>0.6&&Math.random()<0.25*dt)fxAdd({k:'drip',x:c.x+8+Math.random()*48,y:c.y+4,z:0,vx:(Math.random()-0.5)*0.8,vy:-0.4,vz:0.8+Math.random(),g:0.15,t:0,life:16});
    const cy=cam.y;if(!c.wh&&c.y+40>cy-20&&c.y+40<cy+20){c.wh=1;SND.whoosh(clamp(1-Math.abs(c.x+32-cam.x)/500,0,1));}
  }
  FX.cars=FX.cars.filter(c=>c.parked||c.y<(H+6)*TH);
  markCars();
}
function drawCar(c){ctx.drawImage(c.spr,Math.round(c.x)-1,Math.round(c.y)-1);if(LODV>=3){ctx.save();ctx.translate(Math.round(c.x)-c.x,Math.round(c.y)-c.y);carMicro(c);ctx.restore();}if(c.brake){ctx.fillStyle='#ff4a3a';ctx.fillRect(Math.round(c.x)+11,Math.round(c.y)+6,6,3);ctx.fillRect(Math.round(c.x)+47,Math.round(c.y)+6,6,3);}}

/* IML removal */
const IML={state:'off',agents:[],van:null,t:0,carry:false,hist:[],say:'aguardando'};
function mkIml(x,y,k){return {id:100+k,look:{skin:k?'#a8714a':'#e0b48c',hair:k?'#1f1a18':'#5a3a22',style:k?'short':'side',kind:'iml',top:'#2f3438',pants:'#24272b',shoes:'#111',gloves:1},x,y,path:[],dir:1,walk:0,moving:false,wet:false};}
function imlGo(t){const a=IML.agents[0];const r=findPath(a,i=>i===t);a.path=r?r.path:[];IML.hist=[];}
function imlStep(){
  const m=minutes();
  switch(IML.state){
    case 'off':if(m>=5*60+50||S.flags.imlEarly){IML.state='arrive';const v={spr:VANSPR,x:2*T,y:-6*TH,v:0,vmax:1.2,iml:1,park:2*TH-18,wait:0,honked:1,brake:0,wh:0};FX.cars.push(v);IML.van=v;msg('sonia','O rabecão do IML chegou para a remoção.');}break;
    case 'arrive':if(IML.van.parked){IML.agents=[mkIml(2,4,0),mkIml(2,5,1)];IML.state='wait';IML.say='aguardando a perícia';}break;
    case 'wait':if(S.found.vitimas_dormindo){IML.state='go';IML.say='indo ao quarto';imlGo(idx(13,13));msg('mauricio','Quarto do casal liberado para o IML.');}
      else if(!S.flags.imlNag&&m>=5*60+56){S.flags.imlNag=1;msg('sonia','O IML só entra depois que a perícia liberar o quarto do casal.');}break;
    case 'go':if(!IML.agents[0].path.length){IML.state='prep';IML.t=0;IML.say='preparando a remoção';}break;
    case 'prep':if(++IML.t>110){BODIES=Math.max(0,BODIES-1);IML.carry=true;IML.state='back';IML.say='levando ao rabecão';imlGo(idx(2,4));}break;
    case 'back':if(!IML.agents[0].path.length){IML.carry=false;IML.t=0;IML.state=BODIES>0?'again':'done';IML.say=BODIES>0?'voltando':'concluído';}break;
    case 'again':if(++IML.t>60){IML.state='go';IML.say='indo ao quarto';imlGo(idx(13,13));}break;
    case 'done':if(++IML.t>80){IML.agents=[];IML.state='leaving';msg('mauricio','Remoção concluída. O quarto fica lacrado para nova perícia.');const v=IML.van;v.parked=false;v.left=true;v.shift={to:2*T};v.vmax=1.4;}break;
  }
  if(IML.agents.length){const a=IML.agents[0],b=IML.agents[1];moveAgent(a,passable,0.075);IML.hist.push([a.x,a.y]);if(IML.hist.length>60)IML.hist.shift();
    const hp=IML.hist.length>16?IML.hist[IML.hist.length-17]:null;if(hp){const dx=hp[0]-b.x,dy=hp[1]-b.y;b.moving=Math.hypot(dx,dy)>0.002;if(Math.abs(dx)>0.003)b.dir=dx>0?1:-1;if(b.moving)b.walk+=Math.hypot(dx,dy);b.x=hp[0];b.y=hp[1];}else b.moving=false;}
}
function drawStretcher(){
  const [a,b]=IML.agents;const ax=a.x*T+16,ay=a.y*TH+TH-19,bx=b.x*T+16,by=b.y*TH+TH-19;
  ctx.strokeStyle='#8f949a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax,ay+3);ctx.lineTo(bx,by+3);ctx.stroke();
  ctx.lineCap='round';ctx.strokeStyle='#0e0f11';ctx.lineWidth=7;ctx.beginPath();const mx=(ax+bx)/2,my=(ay+by)/2;ctx.moveTo(ax+(bx-ax)*0.12,ay+(by-ay)*0.12);ctx.lineTo(bx-(bx-ax)*0.12,by-(by-ay)*0.12);ctx.stroke();
  ctx.strokeStyle='rgba(120,130,145,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax+(bx-ax)*0.2,ay+(by-ay)*0.2-2);ctx.lineTo(mx,my-2);ctx.stroke();ctx.lineCap='butt';
}

/* helicopter, pigeons, butterflies, cat, clouds */
FX.cars=[];FX.heli=null;FX.pig=[];FX.bfly=[];FX.cat=null;FX.clouds=[];
function updLife(dt){
  const m=minutes(),df=dayF(),v=viewRect();
  if(!FX.heli&&m>=5*60+42)FX.heli={a:Math.random()*6.28,blade:0};
  if(FX.heli){const h=FX.heli;h.a+=0.0024*dt;h.blade+=0.9;h.x=18*T+Math.cos(h.a)*460;h.y=13*TH+Math.sin(h.a)*300;h.hd=h.a+Math.PI/2;
    const d=Math.hypot(h.x-cam.x,h.y-cam.y);SND.heli(clamp(1-d/900,0,1));FX.hwO=d<420?0.6*(1-d/420):0;}
  if(df>0.2&&!FX.pig.length){for(let k=0;k<8;k++)FX.pig.push({x:(4+Math.random()*1.8)*T,y:(1+Math.random()*23)*TH,st:'peck',z:0,vx:0,vy:0,vz:0,ph:Math.random()*6,t:0});}
  for(const p of FX.pig){
    if(p.st==='peck'){p.ph+=0.05*dt;if(Math.random()<0.004*dt){p.x+=(Math.random()-0.5)*4;}
      for(const q of [...S.crew,...S.civs,...IML.agents]){if(Math.hypot(q.x*T+16-p.x,(q.y*TH+TH)-p.y)<34){p.st='fly';p.vx=(p.x<q.x*T+16?-1:1)*(1.2+Math.random());p.vy=-0.6-Math.random()*0.6;p.vz=1.1;SND.flap();break;}}
      for(const c of FX.cars){if(p.x>c.x-6&&p.x<c.x+70&&p.y>c.y&&p.y<c.y+110){p.st='fly';p.vx=-1.4;p.vy=-0.4;p.vz=1.2;}}}
    else if(p.st==='fly'){p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.vz*=0.985;if(p.z>160){p.st='gone';p.t=400+Math.random()*600;}}
    else if(p.st==='gone'){p.t-=dt;if(p.t<=0&&df>0.2){p.st='peck';p.z=0;p.x=(4+Math.random()*1.8)*T;p.y=(1+Math.random()*23)*TH;}}}
  if(df>0.2&&!FX.bfly.length)for(let k=0;k<5;k++)FX.bfly.push({x:(7+Math.random()*25)*T,y:(2+Math.random()*21)*TH,a:Math.random()*6.28,c:pick(['#f2c230','#f2f2ee','#e9a0c0','#9ad0f0'])});
  for(const b of FX.bfly){b.a+=(Math.random()-0.5)*0.3;b.x+=Math.cos(b.a)*0.35*dt;b.y+=Math.sin(b.a)*0.25*dt;if(b.x<7*T||b.x>32*T)b.a=Math.PI-b.a;if(b.y<2*TH||b.y>23*TH)b.a=-b.a;}
  if(df>0.25&&!FX.cat)FX.cat={y:3*TH,dir:1,sit:0};
  if(FX.cat){const c=FX.cat;if(c.sit>0)c.sit-=dt;else{c.y+=c.dir*0.22*dt;if(c.y>22*TH||c.y<3*TH)c.dir*=-1;if(Math.random()<0.002*dt)c.sit=200+Math.random()*300;}}
  if(!FX.clouds.length)for(let k=0;k<4;k++)FX.clouds.push({x:Math.random()*W*T,y:Math.random()*H*TH,rx:180+Math.random()*120,ry:110+Math.random()*60});
  for(const c of FX.clouds){c.x+=0.18*(0.5+WIND)*dt;if(c.x-c.rx>(W+M)*T)c.x=-M*T-c.rx;}
}
function drawLifeGround(){
  // helicopter shadow and pigeons on the ground (lit by the scene)
  const h=FLY.on?null:FX.heli;if(h){const al=0.18+0.12*dayF();ctx.save();ctx.translate(h.x-90,h.y+40);ctx.rotate(h.hd);ctx.scale(2,2);ctx.globalAlpha=al;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,0,13,6,0,0,7);ctx.fill();ctx.fillRect(-26,-1.5,16,3);
    ctx.globalAlpha=al*0.6;ctx.lineWidth=2;ctx.strokeStyle='#000';ctx.beginPath();for(let k=0;k<2;k++){const a=h.blade+k*Math.PI/2;ctx.moveTo(-Math.cos(a)*30,-Math.sin(a)*30);ctx.lineTo(Math.cos(a)*30,Math.sin(a)*30);}ctx.stroke();ctx.restore();}
  for(const p of FX.pig){if(p.st==='gone')continue;const x=Math.round(p.x),y=Math.round(p.y);
    ctx.globalAlpha=0.25;ctx.fillStyle='#000';ctx.fillRect(x-2+Math.round(p.z*0.3),y+1,5,1);ctx.globalAlpha=1;
    const yy=y-Math.round(p.z),bob=p.st==='peck'&&Math.sin(p.ph*3)>0.6?1:0,fl=p.st==='fly'&&(frame>>2)%2;
    ctx.fillStyle='#7d838c';ctx.fillRect(x-2,yy-3,5,3);ctx.fillStyle='#9aa1aa';ctx.fillRect(x-2,yy-3,4,1);ctx.fillStyle='#5a6068';ctx.fillRect(x+2,yy-4+bob,2,2);ctx.fillStyle='#e0a040';ctx.fillRect(x+4,yy-3+bob,1,1);
    if(fl){ctx.fillStyle='#8a9099';ctx.fillRect(x-4,yy-5,3,1);ctx.fillRect(x+2,yy-5,3,1);}}
  for(const b of FX.bfly){const fl=(frame>>2)%2;ctx.fillStyle=b.c;const x=Math.round(b.x),y=Math.round(b.y-14);ctx.fillRect(x-(fl?2:1),y,fl?2:1,2);ctx.fillRect(x+1,y,fl?2:1,2);ctx.fillStyle='#2b2b2b';ctx.fillRect(x,y,1,2);}
  if(FX.cat){const c=FX.cat,x=33*T+16,y=Math.round(c.y)+10,fl=c.sit>0?0:((frame>>3)%2);
    ctx.fillStyle='#1e1611';ctx.fillRect(x-4,y-5,10,5);ctx.fillStyle='#d98c3a';ctx.fillRect(x-3,y-4,8,3);ctx.fillStyle='#b8702a';ctx.fillRect(x-3,y-2,8,1);
    const hy=c.dir>0?y+1:y-8;ctx.fillStyle='#1e1611';ctx.fillRect(x-2,hy-1,6,6);ctx.fillStyle='#d98c3a';ctx.fillRect(x-1,hy,4,4);ctx.fillRect(x-1,hy-2,1,2);ctx.fillRect(x+2,hy-2,1,2);ctx.fillStyle='#2b2b2b';ctx.fillRect(x,hy+1,1,1);ctx.fillRect(x+2,hy+1,1,1);
    ctx.fillStyle='#b8702a';const ty=c.dir>0?y-8:y+1;ctx.fillRect(x+1+(fl?1:0),ty,1,6);}
}
let HELI=null;
function heliSprite(){if(HELI)return HELI;HELI=outlined(S2(66,30,(P,E)=>{
  // seen from above, nose to the right
  P(2,13,26,4,'#e8eae6');P(2,13,26,1,'#ffffff');P(0,9,4,12,'#d8dad6');P(0,9,4,1,'#ffffff');P(1,11,2,8,'#2f5aa8');
  E(40,15,16,9,'#e8eae6');E(40,13,14,6,'#f6f7f4');P(26,14,28,3,'#2f5aa8');
  E(51,15,6,6,'#1c2833');E(52,13,3,2,'#56758c');
  P(30,3,2,24,'#7a7f86');P(46,3,2,24,'#7a7f86');P(28,3,22,2,'#5a5f66');P(28,25,22,2,'#5a5f66');
  P(36,9,6,2,'#26282c');P(38,8,2,2,'#c0392b');P(20,14,3,2,'#2f5aa8');
  P(33,18,4,2,'#1d1f22');P(43,18,8,1,'#1d1f22');
}));return HELI;}
function drawLifeSky(){
  const h=FX.heli;if(!h||FLY.on)return;const alt=230,spr=heliSprite();
  ctx.save();ctx.translate(Math.round(h.x),Math.round(h.y-alt));ctx.rotate(h.hd);ctx.scale(2,2);
  ctx.drawImage(spr,-40,-16);
  ctx.globalAlpha=0.16;ctx.fillStyle='#e6ebf2';ctx.beginPath();ctx.ellipse(0,0,34,34,0,0,7);ctx.fill();
  ctx.globalAlpha=0.55;ctx.strokeStyle='#26282c';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<2;k++){const a=h.blade+k*Math.PI/2;ctx.moveTo(-Math.cos(a)*34,-Math.sin(a)*34);ctx.lineTo(Math.cos(a)*34,Math.sin(a)*34);}ctx.stroke();
  ctx.globalAlpha=0.5;ctx.lineWidth=1;ctx.beginPath();const ta=h.blade*1.6;ctx.moveTo(-38+Math.cos(ta)*6,Math.sin(ta)*6);ctx.lineTo(-38-Math.cos(ta)*6,-Math.sin(ta)*6);ctx.stroke();
  ctx.globalAlpha=1;ctx.fillStyle=((frame>>4)%2)?'#ff453a':'#5a1a18';ctx.fillRect(-2,-10,2,2);ctx.fillStyle=((frame>>4)%2)?'#5a1a18':'#7dff8a';ctx.fillRect(-2,9,2,2);
  ctx.restore();ctx.globalAlpha=1;
}

/* ---------- Close-up detail (LOD 3): hi-res people and legible micro detail ---------- */
function personFramesHD(L,base){
  return base.map((fr,f)=>{
    const c=document.createElement('canvas');c.width=fr.width*2;c.height=fr.height*2;const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(fr,0,0,c.width,c.height);
    const H=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round((x+1)*2),Math.round((y+1)*2),Math.max(1,Math.round(w*2)),Math.max(1,Math.round(h*2)));};
    const cr=f===4?4:0,hy=3+cr,ty=18+cr,sk=hex(L.skin),skin=L.skin,sh=rgbs(mul(sk,0.82)),dk=rgbs(mul(sk,0.62));
    const hair=L.hair||'#2a1d18',hairHi=rgbs(mix(hex(hair),[255,255,255],0.3)),brow=rgbs(mul(hex(hair==='#9a9a9a'?'#6a6a6a':hair),0.8));
    // clear the low-res eyes and mouth, then redraw them finer
    for(const ex of [10,15])H(ex,hy+6,1,2,skin);H(11,hy+9,2,1,skin);
    for(const ex of [10,15]){H(ex-0.5,hy+5.5,1.5,1.5,'#f4f1ea');H(ex,hy+6,1,1,'#2a1a14');H(ex,hy+6,0.5,0.5,'#ffffff');}
    if(L.style!=='cap'){
      if(L.kind==='civ'||L.kind==='press'){H(9.5,hy+5,1,.5,brow);H(10.5,hy+4.5,1,.5,brow);H(14.5,hy+4.5,1,.5,brow);H(15.5,hy+5,1,.5,brow);}
      else{H(9.5,hy+4.5,1,.5,brow);H(10.5,hy+5,1,.5,brow);H(14.5,hy+5,1,.5,brow);H(15.5,hy+4.5,1,.5,brow);}
    }
    H(12.5,hy+8,1,1,sh);H(12.5,hy+9,1,.5,dk);
    H(11.5,hy+10.5,3,.5,'#7a3a30');H(12,hy+11,2,.5,rgbs(mix(sk,[200,90,80],0.3)));
    H(6.5,hy+6,.5,2,skin);H(19,hy+6,.5,2,sh);
    if(L.glasses){for(const gx of [9,14]){H(gx,hy+5,3,.5,'#2a2a2a');H(gx,hy+7.5,3,.5,'#2a2a2a');H(gx,hy+5,.5,3,'#2a2a2a');H(gx+2.5,hy+5,.5,3,'#2a2a2a');H(gx+0.5,hy+5.5,.5,.5,'rgba(255,255,255,.85)');}H(12,hy+6,2,.5,'#2a2a2a');}
    if(L.style!=='cap'&&L.style!=='curly'){H(9,hy-0.5,2.5,.5,hairHi);H(13,hy,2,.5,hairHi);H(16,hy-0.5,1,.5,hairHi);}
    if(L.style==='cap'){H(11.5,hy-1.5,1,1,'#f0d060');H(4.5,hy+3.5,15,.5,'rgba(255,255,255,.18)');}
    // clothing and kit
    const hands=f===4?[[7,ty+9],[17,ty+9]]:[[5,ty+10+(f===1?1:f===3?-1:0)],[19,ty+10-(f===1?1:f===3?-1:0)]];
    switch(L.kind){
      case 'pericia':
        H(7,ty+6,12,.5,'#fff7b0');H(12.5,ty,.5,4,'#1d2b3d');H(11.5,ty+3.5,2.5,3,'#f2f2ee');H(11.75,ty+4,1,1,'#9a8a7a');H(13,ty+4,.75,.5,'#3a5a8a');H(13,ty+5,.75,.5,'#3a5a8a');
        H(16,ty+1.5,.5,2,'#c0392b');H(15.5,ty+2,1.5,.5,'#c9ccd0');
        for(const [x,y] of hands){H(x,y,2,2,'#8fb4e0');H(x,y,2,.5,'#6a90c0');}
        break;
      case 'pm':
        H(6.5,ty,2.5,.5,'#2b2f36');H(17,ty,2.5,.5,'#2b2f36');
        H(8,ty+2,1.5,1.5,'#d4af37');H(8.5,ty+1.5,.5,2.5,'#f0d060');H(7.5,ty+2.5,2.5,.5,'#f0d060');
        H(14,ty+3,3,.75,'#1d1f22');H(14.25,ty+3.2,2.5,.3,'#c9ccd0');
        H(15.5,ty+4.5,1.5,3,'#111');H(16,ty+1.5,.5,3,'#111');H(15.75,ty+5,.5,.5,'#54e07a');
        H(12,ty+11.5,2,1,'#c9ccd0');
        break;
      case 'campo':
        for(const y of [3,5,7])H(12.75,ty+y,.5,.5,'#a09a8c');H(10.5,ty,1.5,1,'#e8e2d4');H(14,ty,1.5,1,'#e8e2d4');
        H(8,ty+8,.5,.5,'#fff3a0');H(19,ty+9.5,2,.5,'#c9ccd0');H(19.5,ty+9.5,1,.5,'#2b2b2b');
        break;
      case 'press':
        H(11,ty+3,4,4,'#1a1a1a');H(11.5,ty+3.5,3,3,'#2f4a66');H(12,ty+4,1,1,'#bfe3ff');H(9.5,ty+2.5,1,.5,'#c0392b');
        H(7.5,ty+9,2.5,2,'#f2f2ee');H(7.5,ty+9,2.5,.5,'#c0392b');H(8,ty+10,1.5,.3,'#2b2b2b');
        break;
      case 'iml':
        H(10,ty-0.5,6,1,'#cfe0e8');H(10,ty-0.5,6,.3,'#e8f2f6');
        for(const [x,y] of hands){H(x,y,2,2,'#7a6ab0');}
        break;
      default:{
        const top=hex(L.top||'#888888');H(10,ty,6,.5,rgbs(mix(top,[255,255,255],0.25)));H(12.75,ty+3,.5,.5,rgbs(mul(top,0.6)));H(12.75,ty+5,.5,.5,rgbs(mul(top,0.6)));
        if((L.hair||'').length&&hash(top[0],top[1],7)<0.4)for(let y=ty+2;y<ty+11;y+=2)H(7,y,12,.5,rgbs(mul(top,0.85)));
      }
    }
    return c;
  });
}
function framesHDFor(p){if(!p.framesHD)p.framesHD=personFramesHD(p.look,framesFor(p));return p.framesHD;}
const MICROFONT='ui-monospace,Menlo,Consolas,monospace';
function mtext(x,y,t,size,col,align,w){ctx.font=`${w||600} ${size}px ${MICROFONT}`;ctx.fillStyle=col;ctx.textAlign=align||'left';ctx.fillText(t,x,y);ctx.textAlign='left';}
function objOrigin(o){const s=o.spr;return [o.x*T+s.ox-s.pad+1,o.y*TH+s.oy-s.pad+1];}
function genPt(o,lx,ly){const s=o.spr,r0=s.pad-s.oy,cy=ly+1,Yb=o.y*TH+s.oy-s.pad;return [o.x*T+s.ox-s.pad+1+lx,Yb+(cy<r0?cy:r0+(cy-r0)*K)];}
function drawPlate(x,y,txt){
  ctx.fillStyle='#d9dbd6';ctx.fillRect(x,y,10,4);ctx.fillStyle='#2b2c30';ctx.fillRect(x,y,10,.3);ctx.fillRect(x,y+3.7,10,.3);
  mtext(x+5,y+1.15,'SÃO PAULO',0.85,'#3a3c40','center',700);mtext(x+5,y+3.45,txt,1.75,'#141518','center',800);
}
function wallMicro(y){
  if(y!==3)return;
  // alarm panel: the display still shows the last event
  ctx.fillStyle='#16301f';ctx.fillRect(330,69,12,4);
  const on=(frame>>5)%2;
  mtext(330.6,70.75,'DESARMADO',1.32,'#8ff0b0','left',700);
  mtext(330.6,72.55,'23:52 MESTRE',1.15,on?'#8ff0b0':'#5ab07a','left',600);
  const keys=['1','2','3','A','4','5','6','B'];
  for(let r=0;r<2;r++)for(let k=0;k<4;k++){const x=330+k*3,yy=75+r*3;ctx.fillStyle='#b8b4aa';ctx.fillRect(x,yy,2,2);ctx.fillStyle='#e8e4da';ctx.fillRect(x,yy,2,.4);mtext(x+1,yy+1.55,keys[r*4+k],1.2,'#2b2b2b','center',700);}
  ctx.fillStyle=on?'#ff5a4a':'#7a1a18';ctx.fillRect(341,69,1,1);
  mtext(336,82.4,'INTELBRAS',0.9,'#8a867c','center',700);
}
function objMicro(o){
  const s=o.spr;if(!s)return;
  switch(o.t){
    case 'rack':{
      // TV screen glass, standby light, VCR clock, the watch and jewellery box left behind
      let [x,y]=genPt(o,16,8);ctx.fillStyle='rgba(180,210,230,.10)';ctx.beginPath();ctx.moveTo(x+3,y);ctx.lineTo(x+12,y);ctx.lineTo(x+4,y+21);ctx.lineTo(x-5+5,y+21);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.18)';for(let k=0;k<21;k+=1)ctx.fillRect(x,y+k+0.5,32,.25);
      [x,y]=genPt(o,46,29);ctx.fillStyle=(frame>>5)%2?'#ff6a5a':'#a02a24';ctx.fillRect(x,y,1.5,1);
      [x,y]=genPt(o,6,51);ctx.fillStyle='#0c1410';ctx.fillRect(x-0.5,y-0.6,5,1.8);mtext(x+2,y+0.85,(frame>>5)%2?'12:00':'',1.3,'#54e07a','center',700);
      [x,y]=genPt(o,4,28);ctx.fillStyle='#f8f8f4';ctx.beginPath();ctx.arc(x+2,y+2,1.7,0,7);ctx.fill();ctx.strokeStyle='#c9a24a';ctx.lineWidth=.35;ctx.stroke();
      {const m=minutes(),ha=((m/60)%12)/12*6.283-1.571,ma=(m%60)/60*6.283-1.571;ctx.strokeStyle='#222';ctx.lineWidth=.25;ctx.beginPath();ctx.moveTo(x+2,y+2);ctx.lineTo(x+2+Math.cos(ha)*0.9,y+2+Math.sin(ha)*0.9);ctx.moveTo(x+2,y+2);ctx.lineTo(x+2+Math.cos(ma)*1.4,y+2+Math.sin(ma)*1.4);ctx.stroke();}
      [x,y]=genPt(o,54,26);ctx.fillStyle='#4a0f1c';ctx.fillRect(x+1,y+1,7,3);
      for(let k=0;k<7;k++){const a=Math.PI*(0.15+0.7*k/6);ctx.fillStyle='#f6f2e8';ctx.beginPath();ctx.arc(x+4.5-Math.cos(a)*2.6,y+1.6+Math.sin(a)*1.4,.42,0,7);ctx.fill();}
      ctx.strokeStyle='#e8c050';ctx.lineWidth=.35;ctx.beginPath();ctx.arc(x+7,y+3,.8,0,7);ctx.stroke();
      if(((frame+17)%120)<10){ctx.fillStyle='#ffffff';const k=((frame+17)%120)/10,r=1.6*Math.sin(k*Math.PI);ctx.fillRect(x+7.6-r,y+2.2,r*2,.25);ctx.fillRect(x+7.5,y+2.3-r,.25,r*2);}
      break;}
    case 'mesa':{
      const [X,Y]=objOrigin(o);const sx=X+11,sy=Y+5;
      // screensaver starfield on the CRT
      ctx.save();ctx.beginPath();ctx.rect(sx,sy,16,13);ctx.clip();ctx.fillStyle='#0a0f18';ctx.fillRect(sx,sy,16,13);
      for(let k=0;k<14;k++){const a=k*2.399,t=((frame*0.006+k*0.137)%1),d=t*t*11;ctx.globalAlpha=Math.min(1,t*2);ctx.fillStyle='#e8f0ff';const z=0.25+t*0.6;ctx.fillRect(sx+8+Math.cos(a)*d,sy+6.5+Math.sin(a)*d*0.8,z,z);}
      ctx.globalAlpha=1;ctx.restore();
      // papers: a bank statement and a letter
      let px=X+33,py=Y+27;mtext(px+0.6,py+1.3,'EXTRATO',1.05,'#3a3a3a','left',800);
      ctx.fillStyle='#9a958a';for(let k=0;k<3;k++){ctx.fillRect(px+0.6,py+2+k*0.9,5+((k*37)%4),.3);ctx.fillRect(px+7.2,py+2+k*0.9,2,.3);}
      px=X+44;py=Y+28;ctx.fillStyle='#a9a49a';for(let k=0;k<4;k++)ctx.fillRect(px+0.8,py+0.8+k*0.95,8-((k*29)%4),.28);
      ctx.strokeStyle='#2a3a6a';ctx.lineWidth=.25;ctx.beginPath();ctx.moveTo(px+5,py+4.4);ctx.bezierCurveTo(px+6,py+3.6,px+6.5,py+4.8,px+8,py+4);ctx.stroke();
      // the drawer pulled open, folders inside
      px=X+38;py=Y+36;for(let k=0;k<4;k++){ctx.fillStyle=['#e8d9a8','#c9e0f0','#f0c9c9','#e8d9a8'][k];ctx.fillRect(px+1+k*5,py-0.6,3,.8);}
      break;}
    case 'escrivaninha':{
      const [X,Y]=objOrigin(o);
      ctx.fillStyle='#14181c';ctx.fillRect(X+41.5,Y+12.8,9,1.6);mtext(X+46,Y+14.05,'FM 89.1',1.2,'#7fe0ff','center',700);
      ctx.fillStyle='#1d2126';for(let yy=0;yy<3;yy++)for(let xx=0;xx<3;xx++){ctx.fillRect(X+41.3+xx*1.2,Y+15.2+yy*0.9,.5,.5);ctx.fillRect(X+48.3+xx*1.2,Y+15.2+yy*0.9,.5,.5);}
      ctx.fillStyle='rgba(255,255,255,.6)';for(const [bx,by] of [[6,11],[7,14],[6,17]])ctx.fillRect(X+bx+2,Y+by+1.2,7,.3);
      ctx.fillStyle='#e05a8a';ctx.beginPath();const hx=X+30.5,hy=Y+22.5;ctx.arc(hx-.45,hy,.5,0,7);ctx.arc(hx+.45,hy,.5,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(hx-.95,hy+.1);ctx.lineTo(hx,hy+1.1);ctx.lineTo(hx+.95,hy+.1);ctx.fill();
      break;}
    case 'viatura':case 'carro':{
      const [X,Y]=objOrigin(o);drawPlate(X+27,Y+74,o.t==='viatura'?'DPC-0217':'CXR-4471');
      if(o.t==='viatura'){mtext(X+32,Y+63.3,'DHPP · HOMICÍDIOS',1.45,'#ffffff','center',800);mtext(X+32,Y+42.6,'DHPP',1.6,'#e8e8e2','center',800);}
      break;}
  }
}
function carMicro(c){
  drawPlate(c.x+27,c.y+74,c.plate||(c.plate=pick(['BHX','CGA','DKP','EOZ','FJS','GLM'])+'-'+String(1000+Math.floor(Math.random()*8999))));
  if(c.iml){mtext(c.x+32,c.y+30.3,'INSTITUTO MÉDICO LEGAL',1.15,'#2b2c30','center',800);mtext(c.x+32,c.y+32,'SSP · SÃO PAULO',0.95,'#4a4c50','center',700);}
}
function dogMicro(fx,fy,dir){
  // Thor's collar and tag
  const cx=dir<0?fx-8:fx+6,cy=fy+6;ctx.fillStyle='#c0392b';ctx.fillRect(cx,cy,2,1);ctx.fillStyle='#e8c050';ctx.beginPath();ctx.arc(cx+1,cy+1.6,.6,0,7);ctx.fill();
}
function doorDetail(){
  // the front door stands open against the jamb: no splinters, latch and strike plate intact
  const x=9*T,y=6*TH;
  ctx.fillStyle='#5a3a22';ctx.fillRect(x+2,y-22,27,23);ctx.fillStyle='#7a5232';ctx.fillRect(x+3,y-21,25,21);
  ctx.fillStyle='#6a4628';ctx.fillRect(x+5,y-19,9,8);ctx.fillRect(x+17,y-19,9,8);ctx.fillRect(x+5,y-9,9,7);ctx.fillRect(x+17,y-9,9,7);
  ctx.fillStyle='#8a6440';ctx.fillRect(x+3,y-21,25,1);
  ctx.fillStyle='#c9ccd0';ctx.fillRect(x+25,y-12,2,1.5);ctx.fillStyle='#e8eaec';ctx.fillRect(x+25,y-12,2,.4);
  if(LODV>=3){ctx.fillStyle='#d4af37';ctx.beginPath();ctx.arc(x+26,y-9.2,.6,0,7);ctx.fill();ctx.fillStyle='#2b2b2b';ctx.fillRect(x+25.9,y-9.5,.25,.6);
    ctx.fillStyle='#c9ccd0';ctx.fillRect(x+4,y+TH-3,5,1.4);ctx.fillStyle='#6a6e74';ctx.fillRect(x+4.6,y+TH-2.6,.5,.5);ctx.fillRect(x+7.9,y+TH-2.6,.5,.5);ctx.fillStyle='#2b2b2b';ctx.fillRect(x+5.8,y+TH-2.7,1.6,.7);}
}
function doormatText(){mtext(8*T+17,6*T+18.2,'BEM-VINDOS',2.3,'rgba(60,40,24,.85)','center',800);}
function decalHD(d){
  ctx.save();ctx.translate(d.x,d.y);ctx.rotate(d.a);ctx.scale(1,0.7);ctx.fillStyle='rgba(58,42,28,.55)';
  ctx.beginPath();ctx.ellipse(1.1,0,1.25,.75,0,0,7);ctx.fill();ctx.beginPath();ctx.ellipse(-1.3,0,.7,.6,0,0,7);ctx.fill();
  ctx.fillStyle='rgba(30,20,12,.45)';for(let k=0;k<3;k++)ctx.fillRect(.4+k*.5,-.6,.2,1.2);ctx.restore();
}
function tapeHD(X,B,fl){
  ctx.fillStyle='#f2c230';ctx.fillRect(X,B-16+fl,T,4);ctx.fillStyle='#16181c';ctx.fillRect(X,B-16+fl,T,.35);ctx.fillRect(X,B-12.35+fl,T,.35);
  mtext(X+16,B-12.95+fl,'ISOLAMENTO',2.15,'#16181c','center',800);
  ctx.fillStyle='#16181c';ctx.fillRect(X+1,B-14.3+fl,1,.5);ctx.fillRect(X+30,B-14.3+fl,1,.5);
}
/* zoom controls: buttons, double tap, level notice */
let ZA=null,lastLodShown=-1,lodTimer=0;
function zoomTo(z,sx,sy,dur){const w=s2w(sx,sy);ZA={z0:cam.z,z1:snapZ(z),t0:performance.now(),dur:dur||280,sx,sy,w};follow=false;}
function stepZoom(){
  if(!ZA){
    // after a pinch or wheel gesture stops, glide to the nearest crisp scale
    if(!pinch&&zoomAnchor&&performance.now()-lastZoomIn>140){const t=snapZ(cam.z);const a=zoomAnchor;zoomAnchor=null;if(Math.abs(t-cam.z)>0.001)zoomTo(t,a[0],a[1],180);}
    return;}
  const k=clamp((performance.now()-ZA.t0)/ZA.dur,0,1),u=k<0.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
  // interpolate in log space so zooming in and out feel the same speed
  cam.z=Math.exp(Math.log(ZA.z0)+(Math.log(ZA.z1)-Math.log(ZA.z0))*u);
  cam.x=ZA.w.x-(ZA.sx-VW()/2)/cam.z;cam.y=ZA.w.ys-(ZA.sy-VH()/2)/cam.z;clampCam();
  if(k>=1){cam.z=ZA.z1;ZA=null;}
}
const LOD_NAME=['Planta','Normal','Perto','Máximo'];
function lodNotice(){
  if(lastLodShown<0){lastLodShown=LODV;return;}
  if(LODV!==lastLodShown){clearTimeout(lodTimer);const v=LODV;lodTimer=setTimeout(()=>{if(v!==lastLodShown){lastLodShown=v;sys('Detalhe: '+LOD_NAME[v]+(v===3?' · textos e rostos visíveis':v===0?' · planta da casa':''));}},450);}
  const zi=$('#z-in'),zo=$('#z-out');if(zi){zi.disabled=cam.z>=ZMAX-0.01;zo.disabled=cam.z<=ZMIN+0.01;}
  const lv=$('#z-lv');if(lv&&lv._v!==LODV){lv._v=LODV;[...lv.children].forEach((d,k)=>{d.classList.toggle('on',k<=LODV);d.classList.toggle('cur',k===LODV);});lv.title='Detalhe: '+LOD_NAME[LODV];}
}

/* ---------- Street rules: crosswalk, cars that yield, people that wait ---------- */
const CROSS_Y=13;
const CARBLK=new Uint8Array(N);
function isStreet(i){return floor[i]===F.STREET;}
function movePass(i){return passable(i)&&!CARBLK[i];}
function markCars(){
  CARBLK.fill(0);
  for(const c of FX.cars){const x0=Math.max(0,Math.floor((c.x+2)/T)),x1=Math.min(W-1,Math.floor((c.x+62)/T));const y0=Math.max(0,Math.floor((c.y+18)/TH)),y1=Math.min(H-1,Math.floor((c.y+82)/TH));
    for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)CARBLK[idx(x,y)]=1;}
}
function carComing(tile){
  // a moving car in that lane that would reach the tile soon
  const tx=(tile%W)*T+16,ty=((tile/W)|0)*TH+TH;
  for(const c of FX.cars){if(c.parked||c.v<0.2)continue;if(tx<c.x-4||tx>c.x+68)continue;const front=c.y+84;if(ty>front-20&&ty-front<170)return true;}
  return false;
}
function drawCrosswalk(){
  const y=CROSS_Y*TH;ctx.globalAlpha=0.78;ctx.fillStyle='#e8e6de';
  for(let x=3;x<4*T-2;x+=9)ctx.fillRect(x,y+3,5,TH-6);
  ctx.globalAlpha=0.55;ctx.fillRect(0,y-3,4*T,2);ctx.fillRect(0,y+TH+1,4*T,2);ctx.globalAlpha=1;
}

/* ---------- Direct orders to the crew ---------- */
const GUARD_R=4;
const ORD={move:{t:'Ir até…',pick:1},guard:{t:'Guardar posto…',pick:1},sweep:{t:'Afastar curiosos'},tape:{t:'Esticar fita'},rest:{t:'Café'},auto:{t:'Automático'}};
function ordersFor(a){const L=['move'];if(a.kind==='pm')L.push('guard','sweep','tape');if(a.kind==='campo')L.push('sweep');L.push('rest','auto');return L;}
function ordLabel(a,k){if(k==='sweep'&&a.kind==='campo')return 'Conversar com curiosos';return ORD[k].t;}
const ACK={pm:['Positivo!','Copiado.','Deixa comigo.','É pra já.'],pericia:['Certo.','Indo.','Pode deixar.'],campo:['Beleza, vou lá.','Pode deixar.','Já vou.']};
let pendingOrder=null;
function civNear(a,center,r){let best=null,bd=1e9;const cx=center%W,cy=(center/W)|0;for(const c of S.civs){if(c.state==='leave'||S.res['c'+c.id])continue;if(Math.hypot(c.x-cx,c.y-cy)>r)continue;const d=Math.hypot(c.x-a.x,c.y-a.y);if(d<bd){bd=d;best=c;}}return best;}
function escortJob(a,c){a.job={k:'escort',civ:c.id,resKey:'c'+c.id,re:0};S.res['c'+c.id]=a.id;a.status=a.kind==='campo'?'Conversando com curioso':'Afastando curioso';}
function orderStep(a){
  const o=a.order;
  switch(o.k){
    case 'move':{if(ti(a)===o.tile){a.job={k:'hold',p:0};a.status='No local indicado';return true;}const r=findPath(a,i=>i===o.tile);if(r){a.job={k:'goto'};a.path=r.path;a.status='Indo ao local indicado';return true;}a.order=null;sys('Não há caminho até lá.');return false;}
    case 'guard':{const c=civNear(a,o.tile,GUARD_R+1.5);if(c){escortJob(a,c);return true;}if(ti(a)===o.tile){a.job={k:'hold',p:0};a.status='Guardando o posto';return true;}const r=findPath(a,i=>i===o.tile);if(r){a.job={k:'goto'};a.path=r.path;a.status='Indo para o posto';return true;}a.order=null;return false;}
    case 'sweep':{let best=null,bd=1e9;for(const c of S.civs){if(c.state==='leave'||S.res['c'+c.id])continue;const x=Math.round(c.x);if(!(inLot(x,Math.round(c.y))||x>=4))continue;const d=Math.hypot(c.x-a.x,c.y-a.y);if(d<bd){bd=d;best=c;}}if(best){escortJob(a,best);return true;}a.order=null;say(a,'Área limpa.',100);updateInfo();return false;}
    case 'tape':{const r=findPath(a,i=>S.tapeBp[i]&&!S.res['t'+i]);if(r){a.job={k:'tape',tile:r.end,resKey:'t'+r.end,p:0};S.res['t'+r.end]=a.id;a.path=r.path;a.status='Esticando fita (ordem)';return true;}a.order=null;say(a,S.tapeBp.some(v=>v)?'Já tem gente na fita.':'Não tem fita planejada.',110);updateInfo();return false;}
    case 'pericia':{const rm=o.room;const r=periciaFind(a,i=>room[i]===rm||(rm==='quintal'&&hot[i]==='cao_canil'));if(r){a.job={k:'pericia',tile:r.tile,resKey:'p'+r.tile,p:0};S.res['p'+r.tile]=a.id;a.path=r.path;a.status='Indo periciar '+(ROOM_NAME[room[r.tile]]||'área');return true;}a.order=null;say(a,'Cômodo pronto.',100);updateInfo();return false;}
    case 'rest':{const r=findPath(a,i=>adjacentToObj(i,'viatura'));if(r){a.job={k:'coffee',p:0};a.path=r.path;a.status='Indo tomar café na viatura';return true;}a.order=null;return false;}
  }
  return false;
}
function giveOrder(a,k,tile){
  if(k==='auto'){a.order=null;endJob(a);a.think=0;say(a,'Voltando à rotina.',90);}
  else{a.order={k,tile:tile==null?null:tile};endJob(a);a.think=0;say(a,pick(ACK[a.kind]||['Certo.']),90);
    if(tile!=null){const X=(tile%W)*T+16,Y=((tile/W)|0)*TH+TH-4;ringFx(X,Y,hex(a.accent),18,40);}}
  if(SND.ok())SND.radio();updateInfo();updateCrew();
}
function nearestPassable(t){if(passable(t))return t;let best=-1;bfs(t,i=>{if(passable(i)){best=i;return true;}return false;},()=>true);return best;}
function assignOrderAt(sx,sy){
  const po=pendingOrder;pendingOrder=null;modeSig='';
  const a=S.crew.find(k=>k.id===po.id);
  if(a){const t=nearestPassable(tileAt(sx,sy));if(t<0)sys('Esse lugar não dá.');else giveOrder(a,po.k,t);}
  updateMode();updateInfo();
}
function drawOrders(){
  for(const a of S.crew){const o=a.order;if(!o||o.tile==null)continue;
    const X=(o.tile%W)*T+16,Y=((o.tile/W)|0)*TH+TH-4,col=a.accent;
    if(o.k==='guard'){ctx.save();ctx.setLineDash([4,3]);ctx.lineDashOffset=-((frame>>2)%7);ctx.strokeStyle=col;ctx.globalAlpha=0.75;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(X,Y,GUARD_R*T,GUARD_R*TH,0,0,7);ctx.stroke();ctx.globalAlpha=0.07;ctx.fillStyle=col;ctx.fill();ctx.restore();}
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(X,Y,4,1.6,0,0,7);ctx.fill();
    const wv=Math.round(Math.sin(frame/9)*1);
    ctx.fillStyle='#1e1611';ctx.fillRect(X-1,Y-17,2,17);ctx.fillRect(X,Y-18,11,9);
    ctx.fillStyle=col;ctx.fillRect(X+1,Y-17,9,7+wv*0);ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(X+1,Y-17,9,1);
    ctx.font='bold 5px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.fillStyle='#0b0e10';ctx.fillText(a.ini,X+5.5,Y-11.6);ctx.textAlign='left';
  }
}

/* ---------- Low helicopter pass right over the camera ---------- */
const FLY={on:false,t:0,next:4*60+39,ang:0,night:false,blade:0,gust:0};
let HBIG=null,HBIGN=null;
function heliBig(night){
  return outlined(S2(120,64,(P,E)=>{
    const body=night?'#2a3550':'#eef0ec',hi=night?'#45527a':'#ffffff',sh=night?'#1c2438':'#c4c8c4',str=night?'#e8e8e2':'#c0392b';
    P(4,29,54,6,sh);P(4,29,54,2,hi);P(0,21,8,22,body);P(0,21,8,2,hi);P(2,23,4,18,str);
    E(78,32,30,16,sh);E(77,30,29,14,body);E(73,26,22,8,hi);
    P(52,31,50,3,str);
    E(99,32,11,11,'#1c2833');E(101,28,5,4,'#56758c');E(104,26,2,2,'#a9c6dc');
    P(62,23,20,18,night?'#222a40':'#d8dad6');P(64,25,16,2,hi);E(58,32,3,3,'#3a3c40');
    P(54,11,48,3,'#5a5f66');P(54,50,48,3,'#5a5f66');for(const x of [66,90]){P(x,14,2,7,'#5a5f66');P(x,43,2,7,'#5a5f66');}
    if(!night){P(68,35,12,6,'#c0392b');P(69,36,2,4,'#ffffff');P(70,36,0,0,'#fff');P(72,36,2,1,'#ffffff');P(73,36,1,4,'#ffffff');P(76,36,1,3,'#ffffff');P(78,36,1,3,'#ffffff');P(77,39,1,1,'#ffffff');}
    else{P(68,35,12,6,'#e8e8e2');P(70,37,8,2,'#2a3550');}
  }));
}
function startFlyby(){
  FLY.on=true;FLY.t=0;FLY.night=nightF()>0.35;FLY.ang=Math.random()*Math.PI*2;FLY.dur=1.9+Math.random()*0.4;FLY.off=(Math.random()-0.5)*0.35;FLY.blade=Math.random()*6;
  if(!HBIG){HBIG=heliBig(false);HBIGN=heliBig(true);}
  SND.flyby&&SND.flyby();
}
function flyPos(){
  const Wc=cv.width,Hc=cv.height,D=Math.max(Wc,Hc),dx=Math.cos(FLY.ang),dy=Math.sin(FLY.ang),along=(FLY.t-0.5)*D*2.2;
  return {D,dx,dy,cx:Wc/2+dx*along-dy*FLY.off*D,cy:Hc/2+dy*along+dx*FLY.off*D};
}
function updFly(dtReal){
  if(paused||!S)return;
  if(!FLY.on){FLY.gust*=0.95;if(minutes()>=FLY.next&&$('#intro').hidden)startFlyby();return;}
  FLY.t+=dtReal/FLY.dur;FLY.blade+=dtReal*42;
  const near=clamp(1-Math.abs(FLY.t-0.5)*2.2,0,1);FLY.gust=1.6*near;FX.shake=Math.max(FX.shake,5*near*near);
  if(near>0.2){const v=viewRect();for(let k=0;k<3;k++){const x=v.x0+Math.random()*(v.x1-v.x0),y=v.y0+Math.random()*(v.y1-v.y0);const a=FLY.ang+(Math.random()-0.5)*1.2;
    if(!roofed(x,y))fxAdd({k:'puff',x,y,z:1,vx:Math.cos(a)*2.2,vy:Math.sin(a)*1.2,vz:0.25,t:0,life:34,c:WET>0.4?[190,205,225]:[176,164,140],sz:2});}
    if(Math.random()<0.5){const x=v.x0+Math.random()*(v.x1-v.x0),y=v.y0+Math.random()*(v.y1-v.y0);fxAdd({k:'leaf',x,y:y-10,gy:y+20,vx:Math.cos(FLY.ang)*2.4,vy:Math.sin(FLY.ang)*1.2+0.2,t:0,life:200,c:pick(['#6a9a40','#8cb050','#c9a040','#a8642a']),ph:Math.random()*6});}}
  if(FLY.t>=1){FLY.on=false;FLY.next=minutes()+26+Math.random()*24;}
}
function flyLights(L,nf){
  if(!FLY.on||!FLY.night)return;
  const p=flyPos(),sx=(p.cx+p.dx*p.D*0.12)/dpr,sy=(p.cy+p.dy*p.D*0.12)/dpr,w=s2w(sx,sy);
  L.push({x:w.x,y:w.ys,r:3.6*T,c:[235,244,255],a:1.6*Math.max(0.5,nf)});
}
function drawFlyby(){
  if(!FLY.on)return;
  const p=flyPos(),{D,dx,dy,cx,cy}=p,img=FLY.night?HBIGN:HBIG,sc=D*0.66/img.width,nf=nightF();
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
  // shadow on the ground: offset, smaller, rotor disc included
  if(!FLY.night||nf<0.6){const sx=cx+D*0.2,sy=cy+D*0.26,ss=sc*0.72;ctx.globalAlpha=0.26*(1-nf*0.6);ctx.save();ctx.translate(sx,sy);ctx.rotate(FLY.ang);ctx.drawImage(silhouette(img),-img.width*ss/2,-img.height*ss/2,img.width*ss,img.height*ss);
    ctx.globalAlpha=0.12*(1-nf*0.6);ctx.fillStyle='#000';ctx.beginPath();ctx.arc(img.width*ss*0.1,0,D*0.44,0,7);ctx.fill();ctx.restore();}
  // motion ghosts, then the body
  ctx.translate(cx,cy);ctx.rotate(FLY.ang);
  for(let g=3;g>=1;g--){ctx.globalAlpha=0.1*(4-g);ctx.drawImage(img,-img.width*sc/2-g*D*0.035,-img.height*sc/2,img.width*sc,img.height*sc);}
  ctx.globalAlpha=1;ctx.drawImage(img,-img.width*sc/2,-img.height*sc/2,img.width*sc,img.height*sc);
  // rotor: blurred disc and blades sweeping across most of the screen
  const hx=(72-61)*sc,R=D*0.56;ctx.translate(hx,0);
  ctx.globalAlpha=FLY.night?0.10:0.13;ctx.fillStyle=FLY.night?'#9aa6c0':'#1c1f24';ctx.beginPath();ctx.arc(0,0,R,0,7);ctx.fill();
  ctx.lineCap='round';
  for(let b=0;b<2;b++)for(let j=0;j<7;j++){const a=FLY.blade+b*Math.PI/2-j*0.05;ctx.globalAlpha=(FLY.night?0.7:0.85)*(1-j/7)*(j?0.55:1);ctx.strokeStyle=FLY.night?'#0a0c10':'#121417';ctx.lineWidth=D*0.03;ctx.beginPath();ctx.moveTo(-Math.cos(a)*R,-Math.sin(a)*R);ctx.lineTo(Math.cos(a)*R,Math.sin(a)*R);ctx.stroke();}
  ctx.globalAlpha=1;ctx.fillStyle='#2b2d31';ctx.beginPath();ctx.arc(0,0,D*0.02,0,7);ctx.fill();
  ctx.translate(-hx,0);
  // navigation lights and strobe
  const blink=(frame>>3)%2;ctx.fillStyle=blink?'#ff3b30':'#5a1410';ctx.fillRect(-4*sc,-img.height*sc*0.42,sc*3,sc*3);ctx.fillStyle=blink?'#5aff7a':'#14401c';ctx.fillRect(-4*sc,img.height*sc*0.36,sc*3,sc*3);
  if(frame%26<2){ctx.globalAlpha=0.9;ctx.drawImage(lightSprite([255,255,255]),-img.width*sc*0.5-D*0.05,-D*0.05,D*0.1,D*0.1);}
  ctx.restore();ctx.globalAlpha=1;
  // a gust of light when the strobe hits at night
  if(FLY.night&&frame%26<2){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=0.06;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,cv.width,cv.height);ctx.restore();}
}

/* ---------- Draw helpers ---------- */
function drawPerson(p,isCrew){
  const fr=framesFor(p);
  let f=0;
  if(p.moving)f=Math.floor(p.walk*3.2)%4;
  else if(isCrew&&p.job&&!p.path.length&&(p.job.k==='pericia'||p.job.k==='tape'))f=((frame>>4)+p.id)%2?4:0;
  const X=Math.round(p.x*T)+16,Y=Math.round(p.y*TH)+TH-2;
  const bob=p.moving?((Math.floor(p.walk*3.2)%2)?-1:0):(Math.sin(frame/26+p.id*1.7)>0.55?-1:0);
  ctx.drawImage(SHADOW,X-11,Y-5);
  if(isCrew&&sel===p.id){ctx.strokeStyle='#f2c230';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(X,Y-1,13,5,0,0,7);ctx.stroke();}
  const hdA=clamp((LODE-2.2)/0.35,0,1),img=hdA>=1?framesHDFor(p)[f]:fr[f],dw=fr[f].width,dh=fr[f].height;
  if(p.dir<0){ctx.save();ctx.translate(X,0);ctx.scale(-1,1);ctx.drawImage(img,-14,Y-45+bob,dw,dh);ctx.restore();}
  else ctx.drawImage(img,X-14,Y-45+bob,dw,dh);
  if(hdA>0&&hdA<1){const h=framesHDFor(p)[f];ctx.save();ctx.globalAlpha=hdA;if(p.dir<0){ctx.translate(X,0);ctx.scale(-1,1);ctx.drawImage(h,-14,Y-45+bob,dw,dh);}else ctx.drawImage(h,X-14,Y-45+bob,dw,dh);ctx.restore();}
  if(LODV>=2&&!p.moving&&((frame+(p.id||0)*53)%190)<6){const sk=(p.look&&p.look.skin)||'#e0b48c',cy=f===4?4:0;ctx.fillStyle=sk;
    if(LODV>=3){const xs=p.dir<0?[X+2,X-3]:[X-3.5,X+1.5];for(const x of xs){ctx.fillStyle=sk;ctx.fillRect(x,Y-35.5+bob+cy,1.5,1.5);ctx.fillStyle=rgbs(mul(hex(sk),0.55));ctx.fillRect(x,Y-34.3+bob+cy,1.5,.35);}}
    else{ctx.fillRect(X-3,Y-35+bob+cy,1,2);ctx.fillRect(X+2,Y-35+bob+cy,1,2);}}
  if(p.wet!==false&&WET>0.4&&!inHouse(ti(p))){ctx.fillStyle='rgba(190,210,235,.35)';ctx.fillRect(X-6,Y-44+bob,1,1);ctx.fillRect(X+4,Y-41+bob,1,1);}
  if(isCrew&&p.job&&!p.path.length&&(p.job.k==='pericia'||p.job.k==='tape'||p.job.k==='coffee')){
    const tot=p.job.k==='pericia'?(hot[p.job.tile]&&!S.found[hot[p.job.tile]]?60:13):p.job.k==='tape'?14:70;
    ctx.fillStyle='rgba(5,6,7,.7)';ctx.fillRect(X-10,Y-54,20,4);ctx.fillStyle=p.job.k==='pericia'?'#f2c230':'#96a7ae';ctx.fillRect(X-9,Y-53,Math.round(18*clamp(p.job.p/tot,0,1)),2);
  }
}
const SWAY={arvore:1,arbusto:0.5,planta:0.35,vaso:0.45};
function drawObj(o){
  const s=o.spr;if(!s)return;
  const X=o.x*T+s.ox-s.pad,Y=o.y*TH+s.oy-s.pad;
  if(SWAY[o.t]){const bx=o.x*T+16,by=o.y*TH+TH,sw=SWAY[o.t]*(0.012+0.03*WIND)*Math.sin(frame/38+o.x*0.9+o.y*0.4)+SWAY[o.t]*0.012*WIND;
    ctx.save();ctx.translate(bx,by);ctx.transform(1,0,-sw,1,0,0);ctx.drawImage(s.c,X-bx,Y-by);ctx.restore();}
  else ctx.drawImage(s.c,X,Y);
  if(o.t==='camacasal')ctx.drawImage(bedOverlay(BODIES,GORE,LODV>=2),X,Y-24);
  if(LODV>=3)objMicro(o);
  if(o.t==='varal'){const ly=o.y*TH-30,X0=o.x*T;let x=X0+10;
    for(const [w,h,c] of [[14,16,'#c0392b'],[10,22,'#3b6aa8'],[16,12,'#f2f2ee'],[12,18,'#e0a23a'],[18,14,'#7fa77a'],[10,10,'#f2f2ee']]){
      const sw=(0.12+0.25*WIND)*Math.sin(frame/22+x*0.13);ctx.save();ctx.translate(x+w/2,ly);ctx.transform(1,0,sw,1,0,0);
      ctx.fillStyle='#1e1611';ctx.fillRect(-w/2-1,0,w+2,h+1);ctx.fillStyle=c;ctx.fillRect(-w/2,0,w,h);ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(-w/2,0,w,2);ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(w/2-2,2,2,h-2);
      if(WET>0.5&&((frame+x*7)%90)<2)fxAdd({k:'drip',x:x+w/2+(Math.random()-0.5)*w*0.6,y:ly+h+40,z:40,vx:0,vy:0,vz:0,g:0.25,t:0,life:22});
      ctx.restore();ctx.fillStyle='#7a7a7a';ctx.fillRect(x+2,ly-1,1,3);ctx.fillRect(x+w-3,ly-1,1,3);x+=w+5;}}
  if(o.t==='canil'){
    const t=frame/90,dx=Math.sin(t)*34,dir=Math.cos(t)>0?1:-1,moving=Math.abs(Math.cos(t))>0.25;
    const fx=Math.round(o.x*T+70+(FX.bark>0?18:dx)),fy=Math.round(o.y*TH+14);FX.dog={x:fx,y:fy};
    ctx.drawImage(SHADOW,fx-11,fy+12);
    const img=DOG[FX.bark>0?((frame>>2)%2):moving?((frame>>3)%2):0];
    if(dir<0){ctx.save();ctx.translate(fx,0);ctx.scale(-1,1);ctx.drawImage(img,-15,fy-2);ctx.restore();}else ctx.drawImage(img,fx-15,fy-2);
    if(LODV>=3)dogMicro(fx,fy,dir);
    // front fence
    const X0=o.x*T,Y0=o.y*TH,FB=Y0+Math.round(64*K);
    ctx.fillStyle='rgba(170,176,182,.55)';
    for(let y=FB-24;y<FB;y+=1)for(let x=X0;x<X0+128;x+=6)ctx.fillRect(x+((y-Y0)%6),y,1,1);
    ctx.fillStyle='#55585d';for(const x of [0,42,84,125])ctx.fillRect(X0+x,Y0-26,3,FB-Y0+26);ctx.fillRect(X0,FB-26,128,2);ctx.fillRect(X0,FB-2,128,2);
    ctx.fillStyle='#8a8d92';for(const x of [0,42,84,125])ctx.fillRect(X0+x,Y0-26,1,FB-Y0+26);
  }
  if(o.t==='viatura'){
    const ph=frame%48,red=ph<4||(ph>=8&&ph<12),blue=(ph>=24&&ph<28)||(ph>=32&&ph<36),X0=o.x*T,Y0=o.y*TH-18+31;
    ctx.fillStyle=red?'#ff5a4a':'#7a1a18';ctx.fillRect(X0+15,Y0,16,5);ctx.fillStyle=blue?'#6a9bff':'#1a2f6a';ctx.fillRect(X0+33,Y0,16,5);
    if(red||blue){ctx.fillStyle='#ffffff';ctx.fillRect(X0+(red?20:38),Y0+1,5,2);}
  }
}
function drawTape(x,y){
  const i=idx(x,y),X=x*T,Y=y*TH,planned=!S.tape[i];
  const h=(xx,yy)=>xx>=0&&yy>=0&&xx<W&&yy<H&&(S.tape[idx(xx,yy)]||S.tapeBp[idx(xx,yy)]);
  const horiz=h(x-1,y)||h(x+1,y)||!(h(x,y-1)||h(x,y+1));
  ctx.globalAlpha=planned?0.45:1;
  const B=Y+TH-3;
  if(horiz){ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(X,B,T,2);
    for(const px of [2,T-4]){ctx.fillStyle='#d9662a';ctx.fillRect(X+px,B-20,3,20);ctx.fillStyle='#f08a4a';ctx.fillRect(X+px,B-20,1,20);}
    if(LODV>=3)tapeHD(X,B,Math.round(Math.sin(frame/7+X*0.21)*(0.6+1.2*WIND)));else for(let k=0;k<T;k+=6){const fl=Math.round(Math.sin(frame/7+(X+k)*0.21)*(0.6+1.2*WIND));ctx.fillStyle='#f2c230';ctx.fillRect(X+k,B-16+fl,3,4);ctx.fillStyle='#16181c';ctx.fillRect(X+k+3,B-16+fl,3,4);}}
  else{ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(X+15,Y,2,TH);
    ctx.fillStyle='#d9662a';ctx.fillRect(X+14,B-20,3,20);ctx.fillStyle='#f08a4a';ctx.fillRect(X+14,B-20,1,20);
    for(let k=0;k<TH;k+=6){ctx.fillStyle='#f2c230';ctx.fillRect(X+13,Y+k-14,5,3);ctx.fillStyle='#16181c';ctx.fillRect(X+13,Y+k-11,5,3);}}
  ctx.globalAlpha=1;
}
const MARKT={};
function drawMarker(i,n){
  const X=(i%W)*T+16,Y0=((i/W)|0)*TH+(floor[i]===F.WALL?2*TH-4:TH-3);
  const age=frame-(MARKT[i]==null?-999:MARKT[i]);let Y=Y0;
  if(age>=0&&age<36){const t=age/36;Y=Y0-Math.round(46*Math.abs(Math.cos(t*Math.PI*1.5))*(1-t));}
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(X-9,Y+1,19,3);
  ctx.fillStyle='#b8901c';ctx.beginPath();ctx.moveTo(X,Y-16);ctx.lineTo(X+9,Y);ctx.lineTo(X-9,Y);ctx.closePath();ctx.fill();
  ctx.fillStyle='#f2c230';ctx.beginPath();ctx.moveTo(X,Y-16);ctx.lineTo(X+7,Y-1);ctx.lineTo(X-9,Y);ctx.closePath();ctx.fill();
  ctx.fillStyle='#1d1700';ctx.font='bold 9px ui-monospace,Menlo,monospace';ctx.textAlign='center';ctx.fillText(String(n),X-1,Y-3);ctx.textAlign='left';
}

/* ---------- Render ---------- */
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#0b0d10';ctx.fillRect(0,0,cv.width,cv.height);
  const s=cam.z*dpr;
  let ox=Math.round(cv.width/2-cam.x*s),oy=Math.round(cv.height/2-cam.y*s);
  if(FX.shake>0.3){ox+=Math.round((Math.random()-0.5)*FX.shake*dpr);oy+=Math.round((Math.random()-0.5)*FX.shake*dpr);}
  const SPR=()=>{ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;};
  const GND=()=>{ctx.setTransform(s,0,0,s*K,ox,oy);ctx.imageSmoothingEnabled=false;};
  SPR();
  ctx.drawImage(BG,-M*T,-M*TH);
  const x0=Math.max(0,Math.floor(-ox/s/T)-2),x1=Math.min(W-1,Math.ceil((cv.width-ox)/s/T)+2);
  const y0=Math.max(0,Math.floor(-oy/s/TH)-2),y1=Math.min(H-1,Math.ceil((cv.height-oy)/s/TH)+4);
  const nf=nightF(),amb=ambient(),vr=viewRect();LODE=s/dpr;LODV=lodOf(LODE);UIK=Math.min(1,2.2/LODE);
  // wet ground: darker street, puddles, footprints
  if(WET>0.02){ctx.globalAlpha=0.16*WET;ctx.fillStyle='#0c1220';ctx.fillRect(-M*T,-M*TH,6*T+M*T,(H+2*M)*TH);ctx.globalAlpha=1;}
  drawPuddles();drawCrosswalk();drawCones();drawDecals();drawDetail(vr);drawSunShadows(vr);drawLifeGround();
  // examined chalk dots (on the floor plane)
  GND();ctx.fillStyle='rgba(242,194,48,.6)';
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);if(S.exam[i]&&passable(i))ctx.fillRect(x*T+14,y*T+14,3,3);}
  if(LODV>=3)doormatText();
  SPR();drawPathPreview();drawPreParticles();
  // depth-sorted pass: walls, tape, furniture and people, back to front
  const rows={};const R=k=>rows[k]||(rows[k]={o:[],p:[]});
  for(const o of objs)if(!o.flat)R(o.y+o.h-1).o.push(o);
  for(const a of S.crew)R(Math.round(a.y)).p.push([a,true]);
  for(const c of S.civs)R(Math.round(c.y)).p.push([c,false]);
  for(const a of IML.agents)R(Math.round(a.y)).p.push([a,false]);
  for(const c of FX.cars){const k=clamp(Math.floor((c.y+80)/TH),0,H-1);(R(k).x||(R(k).x=[])).push(()=>drawCar(c));}
  if(IML.carry&&IML.agents.length===2){const k=Math.round(Math.max(IML.agents[0].y,IML.agents[1].y));(R(k).x||(R(k).x=[])).push(drawStretcher);}
  for(let y=Math.max(0,y0-5);y<=Math.min(H-1,y1+2);y++){
    for(let x=x0;x<=x1;x++){const i=idx(x,y);if(S.tape[i]||S.tapeBp[i])drawTape(x,y);}
    if(WALLROWS[y])ctx.drawImage(WALLROWS[y],0,y*TH-RISE);
    if(LODV>=3)wallMicro(y);if(y===6&&LODV>=1)doorDetail();
    const r=rows[y];if(!r)continue;
    for(const o of r.o)drawObj(o);
    r.p.sort((a,b)=>a[0].y-b[0].y);
    for(const [p,c] of r.p)drawPerson(p,c);
    if(r.x)for(const f of r.x)f();
  }
  // cars above or below the map rows
  for(const c of FX.cars){if(c.y+80<0||c.y+80>=H*TH)drawCar(c);}
  drawClocks();
  // orders on the floor plane
  GND();
  const dash=(frame>>2)%8;
  ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.lineDashOffset=-dash;ctx.strokeStyle='rgba(242,194,48,.95)';
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);if(S.desig[i]){const wy=floor[i]===F.WALL?y+1:y;ctx.strokeRect(x*T+3,wy*T+3,T-6,T-6);}}
  ctx.setLineDash([]);
  if(selTile!=null){ctx.strokeStyle='#f3f5f6';ctx.lineWidth=1.5;ctx.strokeRect((selTile%W)*T+1,((selTile/W)|0)*T+1,T-2,T-2);}
  if(drag&&drag.mode==='paint'){
    ctx.fillStyle=tool==='cancel'?'rgba(255,69,58,.30)':'rgba(242,194,48,.30)';
    for(const i of toolCells(drag.a,drag.b,drag.moved))ctx.fillRect((i%W)*T,((i/W)|0)*T,T,T);
  }
  SPR();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=idx(x,y);if(S.marker[i])drawMarker(i,S.marker[i]);}
  drawOrders();
  // lighting: ambient + lights (room lights clipped to their rooms), multiplied over the scene
  const L=collectLights(nf);flyLights(L,nf);
  lightPass(L,s,ox,oy,amb);
  SPR();glowPass(L,nf);
  // weather and particles on top of the light
  drawPostParticles(nf);drawRain();
  SPR();drawBirds();drawLifeSky();
  // readable layer: tags, emotes, speech, floating text
  ctx.font='bold 8px ui-monospace,Menlo,monospace';ctx.textAlign='center';
  for(const a of S.crew){const X=Math.round(a.x*T)+16,Y=Math.round(a.y*TH)+TH-58+(1-UIK)*10;atUI(X,Y,()=>{ctx.fillStyle='rgba(5,6,7,.72)';ctx.fillRect(X-9,Y-8,18,10);ctx.fillStyle=a.accent;ctx.fillText(a.ini,X,Y);});}
  ctx.textAlign='left';
  for(const a of S.crew){const ic=emoteOf(a,true);if(ic){const X=Math.round(a.x*T)+16,Y=Math.round(a.y*TH)+TH-68+Math.round(Math.sin(frame/12+a.id)*1.2);drawBubble(X+11,Y+4,ic);}}
  for(const c of S.civs){const ic=emoteOf(c,false);if(ic){const X=Math.round(c.x*T)+16,Y=Math.round(c.y*TH)+TH-52+Math.round(Math.sin(frame/12+c.id)*1.2);drawBubble(X+9,Y,ic);}}
  if(FX.bark>0&&FX.dog){drawBubble(FX.dog.x+4,FX.dog.y-2,ICON.ex);}
  for(const p of [...S.crew,...S.civs]){if(!p.say)continue;p.say.t++;if(p.say.t>p.say.life){p.say=null;continue;}const al=Math.min(1,(p.say.life-p.say.t)/20,p.say.t/6);drawSay(Math.round(p.x*T)+16,Math.round(p.y*TH)+TH-(S.crew.includes(p)?78:56),p.say.txt,al);}
  drawCmdPreview();drawRoomLabels();drawLabels();drawOverlayFx();
  // mist + vignette (one low-res layer)
  drawAtmos(s,ox,oy,nf);
  drawFlyby();
  holdCheck();
  if(drag&&drag.mode==='pending'&&tool){const k=clamp((performance.now()-drag.t0)/HOLD,0,1);if(k>0.15){const x=drag.sx*dpr,y=drag.sy*dpr,r=22*dpr;
    ctx.lineWidth=3*dpr;ctx.strokeStyle='rgba(0,0,0,.45)';ctx.beginPath();ctx.arc(x,y,r,0,7);ctx.stroke();
    ctx.strokeStyle='#f2c230';ctx.beginPath();ctx.arc(x,y,r,-Math.PI/2,-Math.PI/2+k*Math.PI*2);ctx.stroke();}}
}
function emoteOf(p,crew){
  if(crew){const j=p.job;if(!j)return p.energy<20?ICON.cup:null;if(p.path.length&&j.k!=='escort')return null;
    if(j.k==='hold')return p.order&&p.order.k==='guard'?ICON.shield:ICON.pin;
    return j.k==='pericia'?ICON.mag:j.k==='coffee'?ICON.cup:j.k==='tape'?ICON.tape:j.k==='escort'||j.k==='talk'?ICON.dots:null;}
  if(p.state==='gawk')return p.press?((frame>>5)%3===0?ICON.cam:null):((frame+p.id*40>>6)%4===0?ICON.q:null);
  return null;
}

/* ---------- Orders ---------- */
function rectOf(a,b){const ax=a%W,ay=(a/W)|0,bx=b%W,by=(b/W)|0;return {x0:Math.min(ax,bx),x1:Math.max(ax,bx),y0:Math.min(ay,by),y1:Math.max(ay,by)};}
function periciavel(i){const x=i%W,y=(i/W)|0;if(!inLot(x,y))return false;if(S.desig[i])return false;if(hot[i]&&!S.found[hot[i]])return true;return passable(i)&&!S.exam[i]&&room[i]!=='terreno';}
function toolCells(a,b,moved){
  const out=[];
  if(tool==='pericia'&&!moved&&a===b){
    const rm=room[a];
    if(rm&&rm!=='terreno'&&rm!=='rua'){for(let i=0;i<N;i++)if(room[i]===rm&&periciavel(i))out.push(i);if(rm==='quintal')for(let i=0;i<N;i++)if(hot[i]==='cao_canil'&&periciavel(i))out.push(i);return out;}
    if(hot[a]&&periciavel(a))out.push(a);return out;
  }
  const r=rectOf(a,b);
  for(let y=r.y0;y<=r.y1;y++)for(let x=r.x0;x<=r.x1;x++){
    const i=idx(x,y);let ok=false;
    if(tool==='pericia')ok=periciavel(i)||(hot[i]&&!S.found[hot[i]]&&!S.desig[i]&&inLot(x,y));
    else if(tool==='isolar')ok=passable(i)&&!inHouse(i)&&!S.tape[i]&&!S.tapeBp[i];
    else if(tool==='cancel')ok=!!(S.desig[i]||S.tapeBp[i]||S.tape[i]);
    if(ok)out.push(i);
  }
  return out;
}
function applyTool(a,b,moved){
  const cells=toolCells(a,b,moved);
  if(!cells.length){if(tool==='pericia')sys('Nada novo para periciar aqui.');else if(tool==='isolar')sys('Não dá para esticar fita aqui.');return;}
  if(tool==='pericia'){for(const i of cells)S.desig[i]=1;const rm=room[cells[0]];const ON={sala:'na sala',cozinha:'na cozinha',escritorio:'no escritório',casal:'no quarto do casal',corredor:'no corredor',livia:'no quarto de Lívia',quintal:'no quintal'};sys(`Perícia a caminho: ${cells.length} ${cells.length>1?'pontos':'ponto'} ${ON[rm]||'marcados'}.`);}
  else if(tool==='isolar'){
    let left=FITA_MAX-tapeUsed(),n=0;
    for(const i of cells){if(left<=0)break;S.tapeBp[i]=1;left--;n++;}
    if(n<cells.length)sys(`A fita acabou. ${n} m esticados.`);else sys(`PM vai esticar ${n} m de fita.`);
  }else if(tool==='cancel'){
    for(const i of cells){S.desig[i]=0;S.tapeBp[i]=0;S.tape[i]=0;}
    sys('Ordem desfeita.');
  }
}

/* ---------- Input ----------
   One finger always pans. A tap selects, or applies the active order to that spot.
   With an order active, holding still for a moment before dragging marks an area instead of panning. */
const HOLD=260;
const ptrs=new Map();
cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('pointerdown',e=>{
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
  ptrs.set(e.pointerId,{x:PX(e),y:PY(e)});
  if(ptrs.size===2){drag=null;ZA=null;const [a,b]=[...ptrs.values()];pinch={d:Math.max(10,Math.hypot(a.x-b.x,a.y-b.y)),z:cam.z,w:s2w((a.x+b.x)/2,(a.y+b.y)/2)};return;}
  if(ptrs.size>2)return;
  const t=tileAt(PX(e),PY(e));
  const forcePan=e.button===1||e.button===2;
  drag={mode:forcePan?'pan':'pending',sx:PX(e),sy:PY(e),cx:cam.x,cy:cam.y,ez:ez(),moved:false,a:t,b:t,t0:performance.now()};
  if(tool&&!forcePan&&e.shiftKey)startPaint();
});
function startPaint(){if(!drag||!tool)return;drag.mode='paint';drag.moved=true;modeSig='';try{navigator.vibrate&&navigator.vibrate(12);}catch(_){}updateMode();}
function holdCheck(){if(drag&&drag.mode==='pending'&&tool&&performance.now()-drag.t0>=HOLD)startPaint();}
cv.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;p.x=PX(e);p.y=PY(e);
  if(pinch&&ptrs.size>=2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;ZA=null;cam.z=clamp(pinch.z*d/pinch.d,ZMIN*0.85,ZMAX*1.08);const e2=cam.z;cam.x=pinch.w.x-(mx-VW()/2)/e2;cam.y=pinch.w.ys-(my-VH()/2)/e2;clampCam();follow=false;zoomActivity(mx,my);return;}
  if(!drag)return;
  const dx=PX(e)-drag.sx,dy=PY(e)-drag.sy,far=Math.hypot(dx,dy)>8;
  if(drag.mode==='pending'){holdCheck();if(drag.mode==='pending'&&far)drag.mode='pan';}
  if(drag.mode==='pan'){if(far)drag.moved=true;cam.x=drag.cx-dx/drag.ez;cam.y=drag.cy-dy/drag.ez;clampCam();if(drag.moved)follow=false;}
  else if(drag.mode==='paint'){drag.b=tileAt(PX(e),PY(e));updateMode();}
});
let lastTap=null;
function tapOrZoom(sx,sy){const now=performance.now();if(lastTap&&now-lastTap.t<320&&Math.hypot(sx-lastTap.x,sy-lastTap.y)<30){lastTap=null;zoomTo(cam.z>=ZMAX-0.05?FITZ:Math.min(ZMAX,cam.z*2),sx,sy);return;}lastTap={t:now,x:sx,y:sy};tap(sx,sy);}
function up(e){
  const had=ptrs.delete(e.pointerId);
  if(pinch){if(ptrs.size<2)pinch=null;drag=null;return;}
  if(drag&&had&&e.type==='pointerup'&&pendingOrder&&(drag.mode==='pending'||(drag.mode==='pan'&&!drag.moved))){assignOrderAt(PX(e),PY(e));drag=null;return;}
  if(drag&&had&&e.type==='pointerup'){
    if(drag.mode==='paint')applyTool(drag.a,drag.b,true);
    else if(drag.mode==='pending'){if(tool)applyTool(drag.a,drag.a,false);else tapOrZoom(PX(e),PY(e));}
    else if(drag.mode==='pan'&&!drag.moved)tapOrZoom(PX(e),PY(e));
  }
  drag=null;modeSig='';updateMode();
}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();ZA=null;const dy=e.deltaMode===1?e.deltaY*16:e.deltaY;const w=s2w(PX(e),PY(e));cam.z=clamp(cam.z*Math.pow(1.0018,-clamp(dy,-120,120)),zMin(),ZMAX);const e2=cam.z;cam.x=w.x-(PX(e)-VW()/2)/e2;cam.y=w.ys-(PY(e)-VH()/2)/e2;clampCam();follow=false;zoomActivity(PX(e),PY(e));},{passive:false});
function tap(sx,sy){
  const w=s2w(sx,sy);let best=null,bd=22;
  for(const a of S.crew){const d=Math.hypot(a.x*T+16-w.x,a.y*TH+TH-22-w.ys);if(d<bd){bd=d;best=a;}}
  if(best){sel=best.id;selTile=null;}else{sel=null;selTile=tileAt(sx,sy);follow=false;}
  updateInfo();updateCrew();
}
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&cmd){cmdCancel();return;}
  if(e.key==='Escape'&&!radioEl.hidden){closeRadio();return;}
  if(e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter'))return;
  if(e.key===' '){e.preventDefault();setSpeed(paused?(lastSpeed||1):0);}
  else if(e.key==='1')setSpeed(1);else if(e.key==='2')setSpeed(2);else if(e.key==='3'||e.key==='4')setSpeed(4);
  else if(e.key==='Escape'&&pendingOrder){pendingOrder=null;modeSig='';updateMode();updateInfo();}
  else if(e.key==='Escape'){if(!viewerEl.hidden)closeViewer();else if(!sheetEl.hidden)sheetEl.hidden=true;else{setTool(null);updateMode();sel=null;selTile=null;updateInfo();}}
});

/* ---------- UI ---------- */
const notesEl=$('#notes'),sheetEl=$('#sheet'),viewerEl=$('#viewer'),appEl=$('#app');
let paused=true,speed=1,lastSpeed=1;
function setSpeed(v){if(v===0)paused=true;else{paused=false;speed=v;lastSpeed=v;}for(const b of document.querySelectorAll('.speed button'))b.setAttribute('aria-pressed',String(+b.dataset.sp===(paused?0:speed)));appEl.classList.toggle('paused',paused);}
document.querySelectorAll('.speed button').forEach(b=>b.addEventListener('click',()=>setSpeed(+b.dataset.sp)));
function setTool(id){tool=id||null;modeSig='';for(const b of document.querySelectorAll('.tool[data-t]'))b.setAttribute('aria-pressed',String(b.dataset.t===id));}
document.querySelectorAll('.tool[data-t]').forEach(b=>b.addEventListener('click',()=>{if(pendingOrder){pendingOrder=null;updateInfo();}setTool(tool===b.dataset.t?null:b.dataset.t);updateMode();}));
$('#mode-x').addEventListener('click',()=>{if(pendingOrder){pendingOrder=null;modeSig='';updateMode();updateInfo();return;}setTool(null);updateMode();});
const MODE_T={pericia:'Periciar',isolar:'Isolar',cancel:'Desfazer'};
const MODE_H={pericia:'Toque num cômodo · segure e arraste para uma área',cancel:'Toque numa marcação · segure e arraste para várias'};
let modeSig='';
function updateMode(){
  const el=$('#mode');if(!el)return;
  const painting=drag&&drag.mode==='paint'&&drag.moved;
  let h;
  const left=FITA_MAX-tapeUsed();
  if(painting){const n=toolCells(drag.a,drag.b,drag.moved).length;
    h=tool==='isolar'?(n?`Soltar para esticar ${Math.min(n,left)} m · restam ${Math.max(0,left-n)} m`:'Aqui não dá para esticar fita'):tool==='pericia'?(n?`Soltar para marcar ${n} ${n>1?'pontos':'ponto'}`:'Nada novo para periciar aqui'):(n?`Soltar para desfazer ${n} ${n>1?'marcações':'marcação'}`:'Nenhuma marcação aqui');}
  else if(tool)h=tool==='isolar'?(left>0?`Segure e arraste pela calçada · ${left} m de fita`:'A fita acabou · use Desfazer para recolher'):MODE_H[tool];
  let off=!tool||(!painting&&!infoEl.hidden);let title=tool?MODE_T[tool]:'';
  if(pendingOrder){const a=S.crew.find(k=>k.id===pendingOrder.id);title=pendingOrder.k==='guard'?'Posto':'Destino';h=`${a?(SHORT[a.key]||a.name):''} · toque no local`;off=false;}
  if(cmd)off=true;
  const sig=title+h+off+painting;if(sig===modeSig)return;modeSig=sig;
  if(tool||pendingOrder){$('#mode-t').textContent=title;$('#mode-h').textContent=h;$('#mode-x').textContent=pendingOrder?'Cancelar':'Concluir';}el.classList.toggle('off',off);el.classList.toggle('hot',!!painting);
}
$('#t-cad').addEventListener('click',()=>{openSheet('f');});

/* ---------- Crew dock: pixel portraits with an energy ring and what each one is doing ---------- */
const crewEl=$('#crew');
const SHORT={mauricio:'Maurício',aux:'Auxiliar',paulo:'Paulo',pm1:'PM Silva',pm2:'PM Rocha',pm3:'PM Reis'};
function buzz(ms){try{if(navigator.vibrate)navigator.vibrate(ms);}catch(_){}}
function kick(el,cls,ms){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);clearTimeout(el['_k_'+cls]);el['_k_'+cls]=setTimeout(()=>el.classList.remove(cls),ms);}
const HEADURL={};
function drawHead(cnv,a){const g=cnv.getContext('2d');g.imageSmoothingEnabled=false;g.clearRect(0,0,cnv.width,cnv.height);g.drawImage(framesHDFor(a)[0],-4,3);}
function headURL(a){if(!HEADURL[a.key]){const c=document.createElement('canvas');c.width=c.height=48;drawHead(c,a);HEADURL[a.key]=c.toDataURL();}return HEADURL[a.key];}
function actIcon(a){const j=a.job;if(!j)return a.energy<20?'cup':'';switch(j.k){case 'pericia':return 'mag';case 'coffee':return 'cup';case 'tape':return 'tape';case 'escort':case 'talk':return 'dots';case 'hold':case 'goto':return a.order&&a.order.k==='guard'?'shield':'pin';}return '';}
function buildCrew0(){
  crewEl.innerHTML='';
  for(const a of S.crew){
    headURL(a);
    const nm=SHORT[a.key]||a.name,b=document.createElement('button');b.className='mem';b.id='mem-'+a.id;b.dataset.id=a.id;
    b.style.setProperty('--c',a.accent);b.title=nm+' · toque para ver · arraste até o mapa para dar uma ordem';b.setAttribute('aria-label',nm);
    b.innerHTML=`<span class="pf"><svg class="ring" viewBox="0 0 46 46" aria-hidden="true"><circle class="rt" cx="23" cy="23" r="20"/><circle class="rv" cx="23" cy="23" r="20"/></svg><span class="disc"><canvas width="48" height="48"></canvas></span><i class="tk"></i><i class="fl"></i><span class="act"><img alt="" draggable="false"></span></span><span class="nm">${nm}</span>`;
    drawHead(b.querySelector('canvas'),a);
    b.addEventListener('click',()=>{if(performance.now()-suppressClickT<450)return;SND.click();if(sel===a.id&&follow){sel=null;follow=false;}else{sel=a.id;selTile=null;follow=true;}updateInfo();updateCrew();});
    crewEl.appendChild(b);
  }
}
function updateCrew(){
  const now=performance.now();
  for(const a of S.crew){const b=document.getElementById('mem-'+a.id);if(!b)continue;
    const ps=String(sel===a.id);if(b.getAttribute('aria-pressed')!==ps)b.setAttribute('aria-pressed',ps);
    const en=Math.round(a.energy);if(b._en!==en){b._en=en;b.querySelector('.rv').style.strokeDashoffset=(125.66*(1-en/100)).toFixed(1);b.classList.toggle('low',en<25);}
    const ic=actIcon(a);if(b._ic!==ic){b._ic=ic;const s=b.querySelector('.act');s.classList.toggle('on',!!ic);if(ic)s.firstChild.src=ICONURL[ic];}
    const ord=!!a.order,tk=(a.talkUntil||0)>now;if(b._ord!==ord){b._ord=ord;b.classList.toggle('ord',ord);}if(b._tk!==tk){b._tk=tk;b.classList.toggle('talk',tk);}b.classList.toggle('boost',a.kind==='pericia'&&S.icUntil>S.tick);
  }
}
const infoEl=$('#info');
const ORDICON={move:'pin',guard:'shield',sweep:'dots',tape:'tape',rest:'cup',auto:'auto'};
const XSVG='<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const OBJN={sofa:'Sofá',rack:'Rack com TV e objetos de valor',bancada:'Bancada da cozinha',geladeira:'Geladeira',mesac:'Mesa da cozinha',mesa:'Mesa do escritório',gaveteiro:'Gaveteiro',estante:'Estante',camacasal:'Cama do casal',criado:'Criado-mudo',guarda:'Guarda-roupa',camalivia:'Cama de Lívia',escrivaninha:'Escrivaninha',aparador:'Aparador',canil:'Canil com Thor',arvore:'Árvore',viatura:'Viatura do DHPP',poste:'Poste de luz',lixeira:'Lixeira',planta:'Vaso'};
function updateInfo(){
  const a=S.crew.find(k=>k.id===sel);
  if(a){
    if(pendingOrder){infoEl.hidden=true;return;}
    infoEl.hidden=false;
    const key='crew'+a.id+(COACHED?'c':'');
    if(infoEl.dataset.key!==key){infoEl.dataset.key=key;infoEl.style.setProperty('--c',a.accent);
      infoEl.innerHTML=`<div class="ic-hd"><span class="ic-pf"><canvas width="48" height="48"></canvas></span><div class="ic-t"><h2>${a.name}</h2><div class="role">${a.role}</div></div><button id="i-follow" class="ic-b" title="Seguir com a câmera" aria-label="Seguir"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22"/></svg></button><button id="i-close" class="ic-b" aria-label="Fechar">${XSVG}</button></div>
      <div class="ic-st"><img id="i-ai" alt="" hidden><span id="i-doing"></span></div>
      <div class="ic-en"><small>Energia</small><span class="seg" id="i-seg">${'<i></i>'.repeat(10)}</span><b id="i-enn"></b></div>
      <div class="ords" role="group" aria-label="Ordens">${ordersFor(a).map(k=>`<button data-o="${k}"><img src="${ICONURL[ORDICON[k]]}" alt=""><span>${ordLabel(a,k)}</span></button>`).join('')}</div>
      ${COACHED?'':'<div class="ic-tip"><svg viewBox="0 0 24 24"><path d="M5 19l14-14M19 5h-6M19 5v6"/></svg><span>Ou arraste o retrato até o mapa: o lugar decide a ordem.</span></div>'}`;
      drawHead(infoEl.querySelector('.ic-pf canvas'),a);}
    const dz=$('#i-doing');if(dz.textContent!==a.status)dz.textContent=a.status;
    const ic=actIcon(a),ai=$('#i-ai');if(ai._ic!==ic){ai._ic=ic;ai.hidden=!ic;if(ic)ai.src=ICONURL[ic];}
    const en=Math.round(a.energy),on=Math.round(en/10),segs=$('#i-seg').children;for(let k=0;k<10;k++){const c=k<on?(en<25?'lo':'on'):'';if(segs[k].className!==c)segs[k].className=c;}const ez2=$('#i-enn');if(ez2.textContent!==String(en))ez2.textContent=en;
    const setP=(b,v)=>{v=String(v);if(b.getAttribute('aria-pressed')!==v)b.setAttribute('aria-pressed',v);};setP($('#i-follow'),follow);
    for(const b of infoEl.querySelectorAll('[data-o]')){const k=b.dataset.o;setP(b,k==='auto'?!a.order:!!(a.order&&a.order.k===k));}
    return;
  }
  if(selTile!=null){
    infoEl.dataset.key='tile';infoEl.style.removeProperty('--c');
    const i=selTile,lines=[],rm=room[i],h=hot[i];
    if(h&&S.found[h])lines.push(`Marcador ${S.found[h].n}: ${CLUES[h].title.toLowerCase()}.`);
    else if(S.exam[i])lines.push('Ponto já periciado, sem vestígio relevante.');
    else if(S.desig[i])lines.push('Aguardando a perícia.');
    else if(inLot(i%W,(i/W)|0)&&rm!=='terreno')lines.push('Ainda não periciado.');
    if(S.tape[i])lines.push('Fita de isolamento.');
    const k=occ[i];
    if(k>=0&&OBJN[objs[k].t])lines.unshift(OBJN[objs[k].t]);
    if(i===idx(10,3))lines.unshift('Painel do alarme');
    if(i===idx(9,6))lines.unshift('Porta de entrada');
    infoEl.hidden=false;
    const title=rm==='rua'?'Rua das Acácias':rm==='terreno'?'Terreno':ROOM_NAME[rm]?ROOM_NAME[rm][0].toUpperCase()+ROOM_NAME[rm].slice(1):'Parede';
    const sub=rm==='rua'?'Via pública':rm==='terreno'?'Frente do terreno':rm==='quintal'?'Fundos da casa':HOUSE_ROOMS.has(rm)?'Dentro da casa':'Estrutura';
    infoEl.innerHTML=`<div class="ic-hd"><span class="ic-pin"><img src="${ICONURL[h&&S.found[h]?'mag':'pin']}" alt=""></span><div class="ic-t"><h2>${title}</h2><div class="role">${sub}</div></div><button id="i-close" class="ic-b" aria-label="Fechar">${XSVG}</button></div><div class="lines">${lines.map(l=>`<span>${l}</span>`).join('')}</div>`;
    return;
  }
  infoEl.hidden=true;infoEl.dataset.key='';
}
infoEl.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.id;SND.click();
  if(id==='i-close'){sel=null;selTile=null;follow=false;pendingOrder=null;updateInfo();updateCrew();return;}
  if(id==='i-follow'){follow=!follow;updateInfo();return;}
  const k=b.dataset.o;if(!k)return;const a=S.crew.find(m=>m.id===sel);if(!a)return;
  if(ORD[k].pick){pendingOrder={id:a.id,k};setTool(null);infoEl.hidden=true;modeSig='';updateMode();}else giveOrder(a,k,null);});
function updateBadge(){const b=$('#badge');b.hidden=S.unread<=0;b.textContent=S.unread;}
let sheetTab='f';
function openSheet(tab){sheetTab=tab;sheetEl.hidden=false;if(tab==='f'){S.unread=0;updateBadge();}renderSheet();}
$('#sheet-x').addEventListener('click',()=>{sheetEl.hidden=true;});
$('#tab-f').addEventListener('click',()=>openSheet('f'));$('#tab-m').addEventListener('click',()=>openSheet('m'));
function renderSheet(){
  $('#tab-f').setAttribute('aria-pressed',String(sheetTab==='f'));$('#tab-m').setAttribute('aria-pressed',String(sheetTab==='m'));
  const body=$('#sheet-body');
  if(sheetTab==='f'){
    if(!S.order.length){body.innerHTML='<div class="empty">Nada registrado ainda. Mande a perícia a um cômodo e o que ela encontrar entra aqui, com a foto.</div>';return;}
    body.innerHTML=(S.flags.end?`<div class="concl"><small>CONCLUSÃO · ${S.flags.endTime||''}</small>Roubo comum não explica a cena.</div>`:'')+
      S.order.map((id,k)=>{const c=CLUES[id],f=S.found[id];return `<div class="find"><button class="pol" data-photo="${id}" style="--r:${k%2?2.5:-2.5}deg" aria-label="Ver a foto: ${c.title}"><img src="${c.img}" alt=""><span class="pn">${f.n}</span></button><div><b>${c.title}</b><span>${c.desc}</span><small>${c.room} · ${f.time}</small></div></div>`;}).join('');
  }else{
    body.innerHTML=S.msgs.length?S.msgs.slice().reverse().map(m=>`<div class="msg">${avatar(m.from)}<div><div class="who">${PEOPLE[m.from].name} · ${m.time}</div><p>${m.text}</p></div></div>`).join(''):'<div class="empty">Sem mensagens.</div>';
  }
}
$('#sheet-body').addEventListener('click',e=>{const b=e.target.closest('[data-photo]');if(b)openViewer(b.dataset.photo);});
function openViewer(id){const c=CLUES[id];$('#v-img').src=c.img;$('#v-title').textContent=c.title;$('#v-cap').textContent=`Fotografia pericial · ${c.room} · Maurício Farias`;$('#v-pic').classList.remove('z');viewerEl.hidden=false;}
function closeViewer(){viewerEl.hidden=true;}
$('#v-x').addEventListener('click',closeViewer);
$('#v-img').addEventListener('click',()=>$('#v-pic').classList.toggle('z'));
function presLabel(){const c=S.contam;return c<25?['Boa','var(--ok)']:c<60?['Atenção','var(--mark)']:['Comprometida','var(--rec)'];}

/* ---------- Field kit: LCD watch, gauges ---------- */
const SEG={a:'2.4,0 7.6,0 8.6,1 7.6,2 2.4,2 1.4,1',b:'9,1.4 10,2.4 10,7.6 9,8.6 8,7.6 8,2.4',c:'9,9.4 10,10.4 10,15.6 9,16.6 8,15.6 8,10.4',d:'2.4,16 7.6,16 8.6,17 7.6,18 2.4,18 1.4,17',e:'1,9.4 2,10.4 2,15.6 1,16.6 0,15.6 0,10.4',f:'1,1.4 2,2.4 2,7.6 1,8.6 0,7.6 0,2.4',g:'2.4,8 7.6,8 8.6,9 7.6,10 2.4,10 1.4,9'};
const DIG=['abcdef','bc','abged','abgcd','fgbc','afgcd','afgedc','abc','abcdefg','abcdfg'];
let SEGEL=null;
function buildSeg7(){const sv=$('#seg7');let h='<g class="dg" transform="skewX(-7)">';
  for(const x of [1.5,14,30.5,43])h+=`<g transform="translate(${x} 0)">`+Object.keys(SEG).map(s=>`<polygon data-s="${s}" points="${SEG[s]}"/>`).join('')+'</g>';
  h+='<rect class="col" x="26.2" y="4.6" width="2" height="2"/><rect class="col" x="25.4" y="11.6" width="2" height="2"/></g>';
  sv.innerHTML=h;SEGEL=[...sv.querySelectorAll('.dg>g')].map(g=>[...g.children]);
  $('#dawn').innerHTML='<i></i>'.repeat(12);}
function setLCD(s){if(!SEGEL)buildSeg7();const ds=s.replace(':','');for(let k=0;k<4;k++){const on=DIG[+ds[k]]||'';for(const p of SEGEL[k])p.classList.toggle('on',on.includes(p.dataset.s));}}
let lcdMin=-1,lcdNF=-1,lastPresL='',lastLeft=-1;
function updateUI(){
  const m=minutes(),mi=Math.floor(m);
  if(mi!==lcdMin){lcdMin=mi;const s=clockStr(m);setLCD(s);$('#clk').textContent=s;
    const ph=m<5*60+20?'NOITE':m<6*60?'AURORA':'DIA',pe=$('#lcd-ph');if(pe.textContent!==ph)pe.textContent=ph;
    const u=Math.floor((m-START_MIN)/10),segs=$('#dawn').children;for(let k=0;k<segs.length;k++){const c=k<u?'on':k===u?'now':'';if(segs[k].className!==c)segs[k].className=c;}}
  // the backlight glows through the night and fades as the day comes
  const nf=nightF();if(Math.abs(nf-lcdNF)>0.01){lcdNF=nf;const lcd=$('#lcd');lcd.style.setProperty('--lcd',rgbs(mix([154,168,138],[112,220,192],nf)));lcd.style.setProperty('--lcdi',rgbs(mix([22,32,15],[6,40,32],nf)));lcd.style.setProperty('--lcdg',(nf*14).toFixed(1)+'px');}
  const [l,col]=presLabel(),gp=$('#g-pres'),off=(100.53*Math.min(1,S.contam/100)).toFixed(1);
  if(off!==gp._off){gp._off=off;$('#g-pres-v').style.strokeDashoffset=off;}if(col!==gp._col){gp._col=col;gp.style.setProperty('--gc',col);}
  if(l!==lastPresL){if(lastPresL)kick(gp,'hit',540);lastPresL=l;$('#pres').textContent=l;}
  const left=FITA_MAX-tapeUsed();
  if(left!==lastLeft){if(lastLeft>=0)kick($('#g-fita'),'spin',740);lastLeft=left;$('#fita').textContent=left+' m';const r=(6+9.5*left/FITA_MAX).toFixed(2);$('#g-roll-c').setAttribute('r',r);$('#g-roll-e').setAttribute('r',r);}
  updateRail();updateMode();updateCrew();if(sel!=null)updateInfo();updateRadio();
}
function showEnd(){
  S.flags.endTime=clockStr();
  $('#end-time').textContent=S.flags.endTime;
  const [l]=presLabel();
  $('#end-sum').textContent=`Sete achados registrados. Preservação da cena: ${l.toLowerCase()}. ${S.contam<25?'O isolamento segurou a frente da casa.':'Gente demais passou pelo terreno antes do isolamento.'}`;
  $('#end-list').innerHTML=S.order.map(id=>`<li><svg viewBox="0 0 24 24"><path d="M12 3l9 17H3z"/></svg><span><b>${CLUES[id].title}.</b> ${CLUES[id].desc}</span></li>`).join('');
  hideCoach();cmdCancel();closeRadio();$('#end').hidden=false;fitCards();setSpeed(0);if(!sheetEl.hidden)renderSheet();
}
$('#b-end').addEventListener('click',()=>{$('#end').hidden=true;setSpeed(1);});

/* ---------- Marker rail: a numbered tent fills each time a polaroid of a new mark lands on it ---------- */
const railEl=$('#rail'),flyEl=$('#fly'),LANDED=new Set();let railSig='';
const RMQ=window.matchMedia?matchMedia('(prefers-reduced-motion: reduce)'):{matches:false};
function buildRail(){railEl.innerHTML=CLUE_IDS.map((_,k)=>`<button class="tent" data-k="${k}"><svg viewBox="0 0 24 22" aria-hidden="true"><path class="tb" d="M12 1.6L22.4 20.4H1.6z"/><path class="ts" d="M12 1.6L22.4 20.4H12z"/></svg><span>${k+1}</span></button>`).join('');railSig='';updateRail();}
function updateRail(){
  const n=LANDED.size,sig=n+':'+S.order.length;if(sig===railSig)return;railSig=sig;
  [...railEl.children].forEach((t,k)=>{const on=LANDED.has(k),id=S.order[k];t.classList.toggle('on',on);t.classList.toggle('next',!on&&k===n);t.setAttribute('aria-label',on&&id?`Marcador ${k+1}: ${CLUES[id].title}. Ver a foto`:`Marcador ${k+1}: vazio`);});
  $('#ach').textContent=n;
}
railEl.addEventListener('click',e=>{const t=e.target.closest('.tent');if(!t)return;const k=+t.dataset.k,id=S.order[k];SND.click();if(id&&LANDED.has(k))openViewer(id);else openSheet('f');});
function landTent(k){
  LANDED.add(k);updateRail();const t=railEl.children[k];if(!t)return;
  kick(t,'pop',700);
  for(let i=0;i<9;i++){const s=document.createElement('i');s.className='spk';const a=i/9*6.283+Math.random()*0.5,r=13+Math.random()*11;s.style.setProperty('--dx',(Math.cos(a)*r).toFixed(1)+'px');s.style.setProperty('--dy',(Math.sin(a)*r).toFixed(1)+'px');t.appendChild(s);setTimeout(()=>s.remove(),700);}
  SND.stamp();buzz(18);const bd=$('#badge');if(!bd.hidden)kick(bd,'bump',520);
}
function worldToApp(wx,wy){const e=ez();return {x:(wx-cam.x)*e+VW()/2,y:(wy-cam.y)*e+VH()/2};}
function clientToApp(x,y){const ev={clientX:x,clientY:y};return {x:PX(ev),y:PY(ev)};}
let flyBusy=0;
function flyPolaroid(id,tile,n){
  const t=railEl.children[n-1];
  if(RMQ.matches||!t||!t.animate){landTent(n-1);return;}
  const c=CLUES[id],el=document.createElement('div');el.className='polaroid';
  el.innerHTML=`<i class="tp"></i><div class="ph"><img alt=""></div><div class="cap"></div><span class="pn">${n}</span>`;
  el.querySelector('img').src=c.img;el.querySelector('.cap').textContent=c.title;flyEl.appendChild(el);
  const now=performance.now(),wait=Math.max(0,flyBusy-now);flyBusy=now+wait+1500;
  setTimeout(()=>{
    const pw=el.offsetWidth,ph=el.offsetHeight,p=worldToApp((tile%W)*T+16,((tile/W)|0)*TH+TH-12);
    const r=t.getBoundingClientRect(),q=clientToApp(r.left+r.width/2,r.top+r.height/2);
    const cx=clamp(VW()/2,pw,VW()-pw),cy=clamp(VH()*0.48,HUDPAD.t+ph/2+8,VH()-HUDPAD.b-ph/2);
    const tf=(x,y,s,z)=>`translate(${(x-pw/2).toFixed(1)}px,${(y-ph/2).toFixed(1)}px) scale(${s}) rotate(${z}deg)`;
    el.querySelector('img').classList.add('dev');SND.eject();
    const an=el.animate([
      {transform:tf(p.x,p.y,0.12,-24),opacity:0,offset:0,easing:'cubic-bezier(.2,.9,.3,1.25)'},
      {transform:tf(cx,cy,1,-4),opacity:1,offset:0.24},
      {transform:tf(cx,cy+2,1,-2.5),opacity:1,offset:0.66,easing:'cubic-bezier(.55,0,.8,.25)'},
      {transform:tf(q.x,q.y,0.11,12),opacity:0.85,offset:1}
    ],{duration:2500,fill:'forwards'});
    an.onfinish=()=>{el.remove();landTent(n-1);};
  },wait);
}

/* ---------- Orders by drag: pull a portrait out of the dock and drop it on the map; the place decides the order ---------- */
const ghostEl=$('#ghost'),ghostCv=$('#ghost canvas'),glEl=$('#ghost .gl'),glT=$('#gl-t'),glI=$('#gl-i');
const ON_ROOM={sala:'a sala',cozinha:'a cozinha',escritorio:'o escritório',casal:'o quarto do casal',corredor:'o corredor',livia:'o quarto de Lívia',quintal:'o quintal'};
const ORDN={move:'Ir até aqui',guard:'Guardar posto',escort:'Afastar',pericia:'Periciar',tape:'Esticar fita',rest:'Café'};
let cmd=null,chipPress=null,suppressClickT=0;
function inRoomSet(i,rm){return room[i]===rm||(rm==='quintal'&&hot[i]==='cao_canil');}
function roomTodo(rm){let n=0;for(let i=0;i<N;i++)if(inRoomSet(i,rm)&&(S.desig[i]||periciavel(i)))n++;return n;}
function markRoom(rm){let n=0;for(let i=0;i<N;i++)if(inRoomSet(i,rm)&&periciavel(i)){S.desig[i]=1;n++;}return n;}
function overHud(cx,cy){const el=document.elementFromPoint(cx,cy);return !!(el&&el!==cv&&el.closest&&el.closest('.hud-top,.hud-bot,#info,#evt,#bub,#cine,#mode,.sheet,#coach .cb'));}
function cmdTarget(a){
  if(overHud(cmd.cx,cmd.cy))return {k:'cancel',label:'Solte aqui para cancelar'};
  const w=s2w(cmd.x,cmd.y),t=tileAt(cmd.x,cmd.y),tx=t%W,ty=(t/W)|0;
  if(a.kind!=='pericia'){
    let best=null,bd=17;
    for(const c of S.civs){if(c.state==='leave')continue;const d=Math.hypot(c.x*T+16-w.x,c.y*TH+TH-14-w.ys);if(d<bd){bd=d;best=c;}}
    if(best){const ct=ti(best),r=ti(a)===ct?{path:[]}:findPath(a,i=>i===ct);
      return r?{k:'escort',civ:best,tile:ct,path:r.path,icon:'dots',label:a.kind==='campo'?'Conversar com o curioso':best.press?'Afastar a imprensa':'Afastar o curioso'}:{k:'bad',tile:ct,label:'Sem caminho até ele'};}
  }
  const o=occ[t]>=0?objs[occ[t]]:null;
  if((o&&o.t==='viatura')||adjacentToObj(t,'viatura')){const r=findPath(a,i=>adjacentToObj(i,'viatura'));return r?{k:'rest',tile:r.end,path:r.path,icon:'cup',label:'Café na viatura'}:{k:'bad',tile:t,label:'Sem caminho até a viatura'};}
  if(a.kind==='pm'){let tb=S.tapeBp[t]?t:-1;if(tb<0)nbs(t,n=>{if(tb<0&&S.tapeBp[n])tb=n;});
    if(tb>=0){const r=findPath(a,i=>i===tb)||findPath(a,i=>!!S.tapeBp[i]);return r?{k:'tape',tile:tb,path:r.path,icon:'tape',label:'Esticar a fita'}:{k:'bad',tile:tb,label:'Sem caminho até a fita'};}}
  const rm=room[t];
  if(a.kind==='pericia'&&rm&&rm!=='terreno'&&rm!=='rua'&&inLot(tx,ty)&&roomTodo(rm)){
    const r=findPath(a,i=>inRoomSet(i,rm)&&passable(i));
    return r?{k:'pericia',room:rm,tile:t,path:r.path,icon:'mag',label:'Periciar '+ON_ROOM[rm]}:{k:'bad',tile:t,label:'Sem caminho até lá'};}
  const dest=nearestPassable(t);if(dest<0)return {k:'bad',tile:t,label:'Aqui não dá'};
  const r=ti(a)===dest?{path:[]}:findPath(a,i=>i===dest);
  if(!r)return {k:'bad',tile:dest,label:'Sem caminho até aqui'};
  if(a.kind==='pm'&&!inHouse(dest))return {k:'guard',tile:dest,path:r.path,icon:'shield',label:'Guardar posto aqui'};
  const rn=inHouse(dest)&&ON_ROOM[room[dest]];
  return {k:'move',tile:dest,path:r.path,icon:'pin',label:rn?'Ir até '+rn:'Ir até aqui'};
}
function cmdRefresh(){
  if(!cmd)return;const tg=cmdTarget(cmd.a);cmd.tg=tg;
  ghostEl.style.transform=`translate(${cmd.x.toFixed(1)}px,${cmd.y.toFixed(1)}px)`;
  ghostEl.classList.toggle('flip',cmd.y<HUDPAD.t+92);
  const sig=tg.k+'|'+tg.label;
  if(sig!==cmd.sig){const first=!cmd.sig;cmd.sig=sig;glT.textContent=tg.label;const ic=tg.k==='cancel'?'':tg.k==='bad'?'ex':tg.icon;glI.hidden=!ic;if(ic)glI.src=ICONURL[ic];ghostEl.dataset.k=tg.k;cmd.lw=0;if(!first){kick(glEl,'morph',300);if(tg.k!=='cancel')buzz(4);}}
  const lw=cmd.lw||(cmd.lw=glEl.offsetWidth),x0=cmd.x-lw/2,lx=clamp(x0,INS.l+6,Math.max(INS.l+6,VW()-INS.r-6-lw))-x0;glEl.style.setProperty('--lx',lx.toFixed(1)+'px');
  document.body.classList.toggle('cmd-cancel',tg.k==='cancel');
}
function cmdStart(){
  const p=chipPress,a=S.crew.find(k=>k.id===p.id);if(!a)return;
  cmd={a,b:p.b,x:0,y:0,cx:p.x,cy:p.y,tg:null,sig:'',lw:0};
  clearTimeout(ghostEl._t);ghostEl.classList.remove('drop','back');ghostEl.style.setProperty('--c',a.accent);drawHead(ghostCv,a);ghostEl.hidden=false;kick($('#ghost .gp'),'pop',320);
  p.b.classList.add('lift');if(pendingOrder)pendingOrder=null;if(tool)setTool(null);
  document.body.classList.add('cmd-on');modeSig='';updateMode();hideCoach();SND.grab();buzz(10);
}
function cmdEnd(){const c=cmd;cmd=null;document.body.classList.remove('cmd-on','cmd-cancel');c.b.classList.remove('lift');modeSig='';updateMode();return c;}
function ghostOut(ok){clearTimeout(ghostEl._t);ghostEl.classList.add(ok?'drop':'back');ghostEl._t=setTimeout(()=>{ghostEl.hidden=true;ghostEl.classList.remove('drop','back');},ok?290:210);}
function cmdDrop(){const c=cmdEnd(),tg=c.tg;
  if(tg&&tg.k!=='cancel'&&tg.k!=='bad'){applyCmd(c.a,tg);ghostOut(true);kick(c.b,'nod',650);coachDone(true);}
  else{ghostOut(false);if(tg&&tg.k==='bad')sys(tg.label+'.');}}
function cmdCancel(){if(!cmd)return;cmdEnd();ghostOut(false);}
function applyCmd(a,tg){
  const t=tg.tile,col=hex(a.accent);let X=(t%W)*T+16,Y=((t/W)|0)*TH+TH-4;
  if(tg.k==='escort'){const c=tg.civ;X=Math.round(c.x*T)+16;Y=Math.round(c.y*TH)+TH-3;
    if(c.state==='leave'||!S.civs.includes(c)){sys('Ele já está indo embora.');return;}
    const ow=S.res['c'+c.id];if(ow!=null&&ow!==a.id){const o=S.crew.find(k=>k.id===ow);if(o&&o.job&&o.job.civ===c.id){endJob(o);o.think=20;}}
    endJob(a);escortJob(a,c);a.think=0;}
  else if(tg.k==='pericia'){const n=markRoom(tg.room);a.order={k:'pericia',room:tg.room,tile:t};endJob(a);a.think=0;sys(`${SHORT[a.key]||a.name} vai periciar ${ON_ROOM[tg.room]}${n?' · '+n+(n>1?' pontos novos':' ponto novo'):''}.`);}
  else{a.order={k:tg.k,tile:tg.k==='move'||tg.k==='guard'?t:null};endJob(a);a.think=0;}
  say(a,pick(ACK[a.kind]||['Certo.']),90);
  ringFx(X,Y,col,24,46);setTimeout(()=>ringFx(X,Y,col,13,32),130);burstSparks(X,Y,12,col);floatText(X,Y-8,tg.k==='escort'&&a.kind==='campo'?'Conversar':ORDN[tg.k],a.accent,130);
  SND.drop();buzz(16);updateInfo();updateCrew();
}
function cmdEdgePan(){
  if(!cmd||!cmd.tg||cmd.tg.k==='cancel')return;
  const m=40,x=cmd.x,y=cmd.y,l=INS.l+m,r=VW()-INS.r-m,t=HUDPAD.t+m*0.5,b=VH()-INS.b-m;
  const vx=x<l?-(l-x)/m:x>r?(x-r)/m:0,vy=y<t?-(t-y)/m:y>b?(y-b)/m:0;
  if(!vx&&!vy)return;
  const sp=8/ez();cam.x+=clamp(vx,-1,1)*sp;cam.y+=clamp(vy,-1,1)*sp;clampCam();follow=false;cmdRefresh();
}
function drawCmdPreview(){
  if(!cmd||!cmd.tg)return;const a=cmd.a,tg=cmd.tg;if(tg.k==='cancel')return;
  const col=a.accent,pul=Math.sin(frame/5);
  {const X=Math.round(a.x*T)+16,Y=Math.round(a.y*TH)+TH-3;ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(X,Y,14+pul,5.5+pul*0.4,0,0,7);ctx.stroke();}
  if(tg.k==='bad'){const X=(tg.tile%W)*T+16,Y=((tg.tile/W)|0)*TH+TH-4;ctx.strokeStyle='#ff453a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(X-6,Y-7);ctx.lineTo(X+6,Y+3);ctx.moveTo(X+6,Y-7);ctx.lineTo(X-6,Y+3);ctx.stroke();return;}
  ctx.save();
  if(tg.k==='pericia'){ctx.fillStyle=`rgba(242,194,48,${(0.3+0.08*pul).toFixed(3)})`;for(let i=0;i<N;i++){if(!inRoomSet(i,tg.room)||!(S.desig[i]||periciavel(i)))continue;const x=i%W,y=(i/W)|0,wy=floor[i]===F.WALL?y+1:y;ctx.fillRect(x*T+2,wy*TH+2,T-4,TH-4);}
    const R=ROOM_RECT[tg.room]||(tg.room==='quintal'?[10,17,27,23]:null);if(R){ctx.setLineDash([6,4]);ctx.lineDashOffset=-((frame>>1)%10);ctx.lineWidth=3;ctx.strokeStyle='rgba(5,6,7,.55)';ctx.strokeRect(R[0]*T+1,R[1]*TH+1,(R[2]-R[0]+1)*T-2,(R[3]-R[1]+1)*TH-2);ctx.lineWidth=1.5;ctx.strokeStyle='#f2c230';ctx.stroke();ctx.strokeRect(R[0]*T+1,R[1]*TH+1,(R[2]-R[0]+1)*T-2,(R[3]-R[1]+1)*TH-2);}}
  else if(tg.k==='guard'){const X=(tg.tile%W)*T+16,Y=((tg.tile/W)|0)*TH+TH-4;ctx.setLineDash([5,4]);ctx.lineDashOffset=-((frame>>1)%9);ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.globalAlpha=0.9;ctx.beginPath();ctx.ellipse(X,Y,GUARD_R*T,GUARD_R*TH,0,0,7);ctx.stroke();ctx.globalAlpha=0.1;ctx.fillStyle=col;ctx.fill();}
  else if(tg.k==='tape'){ctx.fillStyle='rgba(242,194,48,.26)';for(let i=0;i<N;i++)if(S.tapeBp[i])ctx.fillRect((i%W)*T+1,((i/W)|0)*TH+1,T-2,TH-2);}
  else if(tg.k==='escort'){const c=tg.civ,X=Math.round(c.x*T)+16,Y=Math.round(c.y*TH)+TH-3;ctx.strokeStyle='#ff6a5a';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(X,Y,12+pul*1.5,5+pul*0.6,0,0,7);ctx.stroke();}
  ctx.restore();
  // marching route, dark under the colour so it reads on any floor
  const pts=[];{let px=a.x*T+16,py=a.y*TH+TH-4;for(const n of tg.path||[]){const nx=(n%W)*T+16,ny=((n/W)|0)*TH+TH-4;for(let s=0.25;s<=1;s+=0.25){const k=pts.length;if(((k+(frame>>2))%2)===0)pts.push([Math.round(px+(nx-px)*s),Math.round(py+(ny-py)*s)]);else pts.push(null);}px=nx;py=ny;}}
  ctx.fillStyle='rgba(5,6,7,.75)';for(const p of pts)if(p)ctx.fillRect(p[0]-2,p[1]-2,5,4);
  ctx.fillStyle=col;for(const p of pts)if(p)ctx.fillRect(p[0]-1,p[1]-1,3,2);
  const ex=tg.k==='escort'?Math.round(tg.civ.x*T)+16:(tg.tile%W)*T+16,ey=tg.k==='escort'?Math.round(tg.civ.y*TH)+TH-3:((tg.tile/W)|0)*TH+TH-4,r=8+pul*1.5;
  ctx.strokeStyle='rgba(5,6,7,.7)';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(ex,ey,r,r*0.5,0,0,7);ctx.stroke();
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();
}
const crewHost=$('.hud-bot');crewHost.addEventListener('dragstart',e=>{if(e.target.closest('.mem'))e.preventDefault();});crewHost.addEventListener('contextmenu',e=>{if(e.target.closest('.mem'))e.preventDefault();});
crewHost.addEventListener('pointerdown',e=>{
  const b=e.target.closest('.mem');if(!b||(e.pointerType==='mouse'&&e.button!==0))return;
  chipPress={id:+b.dataset.id,b,pid:e.pointerId,x:e.clientX,y:e.clientY};
  try{b.setPointerCapture(e.pointerId);}catch(_){}
});
crewHost.addEventListener('pointermove',e=>{
  if(!chipPress||e.pointerId!==chipPress.pid)return;
  if(!cmd){if(Math.hypot(e.clientX-chipPress.x,e.clientY-chipPress.y)<9)return;cmdStart();if(!cmd)return;}
  cmd.cx=e.clientX;cmd.cy=e.clientY;cmd.x=PX(e);cmd.y=PY(e);cmdRefresh();
});
function chipUp(e){if(!chipPress||e.pointerId!==chipPress.pid)return;chipPress=null;if(!cmd)return;suppressClickT=performance.now();
  if(e.type==='pointercancel'){cmdCancel();return;}cmd.cx=e.clientX;cmd.cy=e.clientY;cmd.x=PX(e);cmd.y=PY(e);cmdRefresh();cmdDrop();}
crewHost.addEventListener('pointerup',chipUp);crewHost.addEventListener('pointercancel',chipUp);
crewHost.addEventListener('lostpointercapture',e=>{if(chipPress&&e.pointerId===chipPress.pid){chipPress=null;cmdCancel();}});
addEventListener('blur',()=>{chipPress=null;cmdCancel();});

/* ---------- First-time tip for the drag orders ---------- */
const coachEl=$('#coach');let coachAnim=null,coachTm=0;
let COACHED=(()=>{try{return localStorage.getItem('varredura.coach')==='1';}catch(_){return false;}})();
function coachDone(set){if(set&&!COACHED){COACHED=true;try{localStorage.setItem('varredura.coach','1');}catch(_){}hideCoach();if(sel!=null){infoEl.dataset.key='';updateInfo();}}return COACHED;}
function hideCoach(){coachEl.hidden=true;appEl.classList.remove('coach-on');if(coachAnim){coachAnim.cancel();coachAnim=null;}clearTimeout(coachTm);}
function showCoach(){
  if(COACHED||!coachEl.hidden||cmd||!$('#intro').hidden||!$('#end').hidden)return;
  if(evOpen||!sheetEl.hidden||!viewerEl.hidden){clearTimeout(coachTm);coachTm=setTimeout(showCoach,2500);return;}
  const chip=crewEl.querySelector('.mem .pf');if(!chip)return;
  const r=chip.getBoundingClientRect(),p=clientToApp(r.left+r.width/2,r.top+r.height/2);
  coachEl.hidden=false;appEl.classList.add('coach-on');
  // the tip sits under the top kit, clear of the radio, and the demo finger ends just below it
  const cb=coachEl.querySelector('.cb'),bw=cb.offsetWidth,bh=cb.offsetHeight,L=VW()>VH();
  let cx=VW()/2;cx=clamp(cx,INS.l+8+bw/2,VW()-INS.r-8-bw/2);
  const top=L?HUDPAD.t+10:Math.max(HUDPAD.t+10,VH()*0.3);cb.style.left=cx.toFixed(0)+'px';cb.style.top=top.toFixed(0)+'px';
  const ex=cx,ey=Math.min(top+bh+78,VH()-HUDPAD.b-14);
  const g=coachEl.querySelector('.hg');g.style.setProperty('--c',S.crew[0].accent);g.firstChild.src=headURL(S.crew[0]);
  const hand=coachEl.querySelector('.hand'),tf=(x,y,s)=>`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s})`;
  if(hand.animate&&!RMQ.matches)coachAnim=hand.animate([{transform:tf(p.x,p.y,1.2),opacity:0,offset:0},{transform:tf(p.x,p.y,.92),opacity:1,offset:.14,easing:'cubic-bezier(.45,0,.3,1)'},{transform:tf(ex,ey,.92),opacity:1,offset:.68},{transform:tf(ex,ey,1.25),opacity:0,offset:.86},{transform:tf(ex,ey,1.25),opacity:0,offset:1}],{duration:2400,iterations:Infinity});
  clearTimeout(coachTm);coachTm=setTimeout(hideCoach,16000);
}
$('#coach-ok').addEventListener('click',()=>{SND.click();coachDone(true);});

/* ---------- Radio: call help from outside the scene. Each channel arrives after a while, stays for a spell and then needs a wait ---------- */
const HINTS={porta_intacta:'Como essa gente entrou? Olha a porta da frente com calma.',painel_alarme:'Do lado da porta tem o painel do alarme. Alguém já olhou?',valores_intactos:'Vê o que ficou na sala. O que um ladrão levaria primeiro?',escritorio_revirado:'O escritório parece revirado. Quero o detalhe, não a impressão.',vitimas_dormindo:'O quarto do casal precisa da perícia antes de o IML entrar.',quarto_livia:'Ninguém me falou do quarto da filha ainda.',cao_canil:'E o cachorro da família? Onde ele estava a noite toda?'};
function soniaHint(){
  if(S.contam>=25&&!S.tape.some(v=>v)&&!S.tapeBp.some(v=>v))return 'A frente está cheia de curioso. Isola a calçada antes de qualquer coisa.';
  const left=CLUE_IDS.filter(id=>!S.found[id]);
  if(!left.length)return 'Vocês registraram tudo. Agora olha o conjunto: o que mexeram e o que deixaram.';
  const idle=left.filter(id=>{for(let i=0;i<N;i++)if(hot[i]===id&&S.desig[i])return false;return true;});
  return HINTS[pick(idle.length?idle:left)]||'Segue a perícia, sem pressa.';
}
function joinReforco(){
  const a={id:S.crew.length,key:'pm3',look:CREW_LOOK.pm3,ini:'PM',name:'Soldado Reis',role:'Polícia Militar · reforço',kind:'pm',skill:1,vest:'#56687a',accent:'#b9d4a0',hair:'#1f1a18',skin:'#c98e64',
    x:4,y:0,home:idx(5,7),path:[],job:null,energy:90,status:'Chegando de reforço',dir:1,walk:0,moving:false,think:0,done:0,temp:1,order:{k:'guard',tile:idx(5,7)}};
  S.crew.push(a);framesHDFor(a);buildCrew();measureHud();updateCrew();
  const X=4*T+16,Y=TH-4;ringFx(X,Y,hex(a.accent),22,44);
}
function leaveReforco(){const a=S.crew.find(c=>c.temp);if(!a)return;a.leaving=1;a.leaveBy=S.tick+600;endJob(a);a.order={k:'move',tile:idx(4,0)};a.think=0;say(a,'Liberado. Boa sorte aí.',110);}
function removeTemp(a){
  endJob(a);if(cmd&&cmd.a===a)cmdCancel();if(pendingOrder&&pendingOrder.id===a.id)pendingOrder=null;if(sel===a.id){sel=null;follow=false;updateInfo();}
  S.crew=S.crew.filter(c=>c!==a);buildCrew();measureHud();updateCrew();
}
const RICON={
  reforco:'<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="M12 9v6M9 12h6"/>',
  delegada:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a1 1 0 01-1 1A16 16 0 014 5a1 1 0 011-1z"/>',
  fita:'<circle cx="10" cy="12" r="6"/><circle cx="10" cy="12" r="2"/><path d="M16 12h5v3"/>',
  transito:'<path d="M9 4h6l4 15H5z"/><path d="M8 9h8M6.8 14h10.4M3 20h18"/>',
  ic:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  aguia:'<path d="M3 5h14M10 5v3"/><path d="M6 8h9a4 4 0 014 4v1a2 2 0 01-2 2H9a3 3 0 01-3-3z"/><path d="M15 15l1 4M9 15l-1 4M6 19h12M19 11h2"/>',
  imprensa:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3M8 21h8"/>',
  iml:'<path d="M2 7h12v9H2zM14 10h4l3 3v3h-7z"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M7 9.5v4M5 11.5h4"/>'
};
const CALLS=[
  {k:'reforco',t:'Reforço da PM',sub:'Mais um soldado segura o portão',eta:2,dur:12,cd:6,ack:'Copiado. Uma viatura com reforço está a caminho.',
    ok:()=>S.crew.some(c=>c.temp)?'Reforço no local':'',arrive:()=>{joinReforco();msg('central','Reforço no local. O Soldado Reis assume o portão.');},leave:leaveReforco},
  {k:'delegada',t:'Falar com a delegada',sub:'Sônia orienta o próximo passo',eta:0.5,cd:5,ack:'Chamando a delegada Sônia.',
    ok:()=>'',arrive:()=>msg('sonia',soniaHint())},
  {k:'fita',t:'Mais fita',sub:'Viatura de apoio traz +20 m',eta:3,cd:4,max:2,ack:'Fita a caminho com a viatura de apoio.',
    ok:()=>'',arrive:()=>{FITA_MAX+=20;msg('central','A viatura de apoio deixou mais 20 m de fita com a PM.');}},
  {k:'transito',t:'Fechar a rua',sub:'Trânsito desviado, sem carros por 10 min',eta:1.5,dur:10,cd:8,ack:'Pedido de bloqueio repassado ao trânsito.',
    ok:()=>'',arrive:()=>{S.blockUntil=S.tick+10*20;msg('central','Rua das Acácias fechada nos dois sentidos. Cones na pista.');}},
  {k:'ic',t:'Apoio da perícia',sub:'Fotógrafo e papiloscopista: perícia 50% mais rápida',eta:3,dur:8,cd:10,ack:'Equipe de apoio da perícia acionada.',
    ok:()=>'',arrive:()=>{S.icUntil=S.tick+8*20;msg('mauricio','Chegou o apoio da perícia. Com fotógrafo e papiloscopista a gente rende mais.');}},
  {k:'aguia',t:'Helicóptero Águia',sub:'Luz do alto ajuda lá fora, mas atrai curiosos',eta:1,dur:3,cd:12,ack:'Águia decolando, chega em instantes.',
    ok:()=>FLY.on?'Já tem helicóptero no ar':'',arrive:()=>{startFlyby();S.aguiaUntil=S.tick+3*20;msg('central','Águia sobre a Rua das Acácias. A luz ajuda no quintal e na frente.');for(let i=0;i<2;i++)setTimeout(()=>{if(S.civs.length<11)spawnCiv();},900+i*1700);}},
  {k:'imprensa',t:'Assessoria de imprensa',sub:'Alguém atende os repórteres no portão',eta:1,once:1,ack:'Assessoria avisada. Vão falar com os repórteres.',
    ok:()=>!S.flags.press?'Ainda sem imprensa':S.flags.pressCalm===1?'Imprensa já atendida':'',arrive:()=>{S.flags.pressCalm=1;S.flags.evP=1;for(const c of S.civs)if(c.press&&c.state==='gawk')c.wait=Math.min(c.wait,120);msg('central','A assessoria está com a imprensa. Eles devem liberar o portão logo.');}},
  {k:'iml',t:'Antecipar o IML',sub:'O rabecão vem antes e espera a perícia liberar',eta:2,once:1,ack:'IML acionado. O rabecão está a caminho.',
    ok:()=>IML.state!=='off'?'IML já acionado':'',arrive:()=>{S.flags.imlEarly=1;}}
];
function stepRadio(){
  const C=CS();
  for(const d of CALLS){const st=C[d.k];if(!st)continue;
    if(st.ph==='go'&&S.tick>=st.at){d.arrive();deliver(d);if(d.dur){st.ph='on';st.end=S.tick+d.dur*20;}else if(d.once)st.ph='done';else{st.ph='cool';st.cd=S.tick+d.cd*20;}}
    else if(st.ph==='on'&&S.tick>=st.end){if(d.leave)d.leave();st.ph='cool';st.cd=S.tick+d.cd*20;}
    else if(st.ph==='cool'&&S.tick>=st.cd){st.ph=d.max&&st.n>=d.max?'done':'idle';}
  }
  const a=S.crew.find(c=>c.temp&&c.leaving);if(a&&(ti(a)===idx(4,0)||S.tick>a.leaveBy))removeTemp(a);
}
Object.assign(SND,{
  rOn(){if(!this.ok())return;const t=this.ctx.currentTime;this.nz(t,0.02,'highpass',2500,0.7,0.25);this.nz(t+0.03,0.32,'bandpass',1800,0.9,0.06);this.osc('sine',880,t+0.3,0.004,0.06,0.03);},
  rOff(){if(!this.ok())return;const t=this.ctx.currentTime;this.nz(t,0.02,'highpass',2500,0.7,0.2);this.osc('sine',700,t+0.02,0.004,0.08,0.03,420);},
  pttStart(){if(!this.ok())return;this.pttStop();const c=this.ctx,t=c.currentTime,s=c.createBufferSource();s.buffer=this.noise;s.loop=true;const f=c.createBiquadFilter();f.type='bandpass';f.frequency.value=1600;f.Q.value=1.2;const g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.05,t+0.06);s.connect(f);f.connect(g);g.connect(this.g);s.start(t,Math.random());this._ptt={s,g};this.osc('sine',1250,t,0.003,0.05,0.035);},
  pttStop(){const p=this._ptt;if(!p||!this.ctx)return;const t=this.ctx.currentTime;p.g.gain.cancelScheduledValues(t);p.g.gain.setValueAtTime(p.g.gain.value,t);p.g.gain.linearRampToValueAtTime(0.0001,t+0.05);p.s.stop(t+0.07);this._ptt=null;},
  roger(){if(!this.ok())return;const t=this.ctx.currentTime;this.osc('sine',1050,t,0.003,0.07,0.04);this.osc('sine',1400,t+0.09,0.003,0.09,0.04);this.nz(t+0.2,0.16,'bandpass',2000,3,0.05);},
  busy(){if(!this.ok())return;const t=this.ctx.currentTime;for(const k of [0,0.13])this.osc('square',330,t+k,0.004,0.08,0.012);},
  inbound(){if(!this.ok())return;const t=this.ctx.currentTime;this.nz(t,0.12,'bandpass',1900,3,0.05);for(const [k,f] of [[0.13,1200],[0.21,1500],[0.29,1800]])this.osc('sine',f,t+k,0.003,0.06,0.03);}
});
// hold a channel like a push-to-talk key; letting go early cancels
function drawCones(){
  if(!(S.blockUntil>S.tick))return;
  for(const ty of [1,H-2]){const Y=ty*TH+TH-4;for(let x=10;x<4*T;x+=30){
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-6,Y,13,3);
    ctx.fillStyle='#1e1611';ctx.beginPath();ctx.moveTo(x,Y-15);ctx.lineTo(x+6,Y+1);ctx.lineTo(x-6,Y+1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f06a1e';ctx.beginPath();ctx.moveTo(x,Y-14);ctx.lineTo(x+5,Y);ctx.lineTo(x-5,Y);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f3f1ea';ctx.fillRect(x-3,Y-8,6,2);ctx.fillStyle='#1e1611';ctx.fillRect(x-7,Y,15,2);}}
}
SND.bus=function(fn){if(!this.ok())return;if(!this.rg){const c=this.ctx,comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;this.rg=c.createGain();this.rg.gain.value=3.6;this.rg.connect(comp);comp.connect(this.g);}const g0=this.g;this.g=this.rg;try{fn.call(this);}finally{this.g=g0;}};
for(const k of ['rOn','rOff','pttStart','roger','busy','inbound','radio','squelch','stamp','blip']){const f=SND[k];SND[k]=function(){return this.bus(f);};}
SND.key=function(){this.bus(function(){const t=this.ctx.currentTime;this.osc('square',1750,t,0.002,0.05,0.02);this.osc('sine',1750,t,0.002,0.06,0.05);});};
SND.detent=function(){this.bus(function(){const t=this.ctx.currentTime;this.nz(t,0.014,'highpass',3200,0.7,0.35);this.osc('triangle',260,t,0.001,0.035,0.08);});};
/* the handheld set */
const CNAME={reforco:'Reforço PM',delegada:'Delegada',fita:'Mais fita',transito:'Fechar rua',ic:'Apoio perícia',aguia:'Heli Águia',imprensa:'Imprensa',iml:'IML'};
const CDONE={reforco:'O Soldado Reis assumiu o portão',delegada:'A delegada respondeu no rádio',fita:'+20 m de fita no rolo da PM',transito:'Rua fechada, cones na pista',ic:'Perícia 50% mais rápida agora',aguia:'Luz do alto sobre a casa',imprensa:'Os repórteres estão saindo do portão',iml:'O rabecão está a caminho da casa'};
const CLOC={reforco:()=>{const a=S.crew.find(c=>c.temp);return a?[a.x,a.y]:null;},transito:()=>[2,1.5],ic:()=>{const a=S.crew[0];return [a.x,a.y];},imprensa:()=>[6,6],iml:()=>[2,3],aguia:()=>[17,9]};
const rKey=$('#t-radio'),radioEl=$('#radio'),rList=$('#r-list'),rLcd=$('#r-lcd'),rLed=$('#r-led'),rBig=$('#r-ptt2');
let rCh=0,rHold=null,rOver=null,rLog=[],PAN=null,supSig='',supNew='',dvT=0,dvLoc=null,rxT=0,chSeg=null;
const CS=()=>S.calls||(S.calls={});
function callState(d){
  const st=CS()[d.k]||{ph:'idle',n:0},mins=t=>Math.max(1,Math.ceil((t-S.tick)/20));
  if(st.ph==='go')return ['go','Chega em '+mins(st.at)+' min'];
  if(st.ph==='on')return ['on','No local · '+mins(st.end)+' min'];
  if(st.ph==='cool')return ['cool','De novo em '+mins(st.cd)+' min'];
  if(st.ph==='done')return ['off',d.max?'Acabou na base':'Já acionado'];
  const why=d.ok();if(why)return ['off',why];
  return ['idle',d.max?`Livre · ${d.max-(st.n||0)}×`:'Livre'];
}
function lit(){rLcd.classList.add('lit');clearTimeout(rLcd._t);rLcd._t=setTimeout(()=>rLcd.classList.remove('lit'),6000);}
function chDigits(n){if(!chSeg){const sv=$('#r-chs');let h='<g transform="skewX(-7)">';for(const x of [1.5,14])h+=`<g transform="translate(${x} 0)">`+Object.keys(SEG).map(s=>`<polygon data-s="${s}" points="${SEG[s]}"/>`).join('')+'</g>';sv.innerHTML=h+'</g>';chSeg=[...sv.querySelectorAll('g>g')].map(g=>[...g.children]);}
  const ds=String(n).padStart(2,'0');for(let k=0;k<2;k++){const on=DIG[+ds[k]];for(const p of chSeg[k])p.classList.toggle('on',on.includes(p.dataset.s));}}
function tune(i,snd){rCh=(i+CALLS.length)%CALLS.length;$('#r-kr').style.transform=`rotate(${rCh*45}deg)`;if(snd==='knob')SND.detent();else if(snd)SND.key();lit();rOver=null;renderRadio();}
function say2(txt,ms,blink){rOver={txt,until:performance.now()+(ms||1500)};rLcd.classList.toggle('blinkst',!!blink);renderRadio();}
const LST={idle:'LIVRE',go:'CHEGA',on:'ATIVO',cool:'ESPERA',off:'BLOQ'};
function shortSt(d){const st=CS()[d.k]||{ph:'idle',n:0},m=t=>Math.max(1,Math.ceil((t-S.tick)/20))+'m',[cls]=callState(d);
  if(cls==='go')return 'CHEGA '+m(st.at);if(cls==='on')return 'ATIVO '+m(st.end);if(cls==='cool')return 'ESPERA '+m(st.cd);if(cls==='off')return st.ph==='done'?'USADO':'BLOQ';return d.max?'LIVRE '+(d.max-(st.n||0))+'×':'LIVRE';}
function renderRadio(){
  if(!rList.children.length){rList.innerHTML=CALLS.map((d,i)=>`<div class="lr" role="option" data-i="${i}"><span class="ln">${i+1}</span><svg viewBox="0 0 24 24">${RICON[d.k]}</svg><b>${CNAME[d.k]}</b><span class="ls"><span></span></span></div>`).join('');}
  const now=performance.now();
  CALLS.forEach((d,i)=>{const b=rList.children[i],[cls,txt]=callState(d),s=b.querySelector('.ls span'),t=shortSt(d);for(const c of ['idle','go','on','cool','off'])b.classList.toggle(c,c===cls);b.classList.toggle('sel',i===rCh);b.setAttribute('aria-selected',String(i===rCh));if(s.textContent!==t)s.textContent=t;b.setAttribute('aria-label',`Canal ${i+1}: ${d.t}. ${txt}`);});
  const row=rList.children[rCh],top=row.offsetTop-rList.clientHeight/2+row.offsetHeight/2;rList.scrollTop=Math.max(0,top);
  const d=CALLS[rCh],[cls,txt]=callState(d);chDigits(rCh+1);
  const st=rOver&&rOver.until>now?rOver.txt:(cls==='idle'?d.sub:txt+' · '+d.sub);const se=$('#r-stat');if(se.textContent!==st)se.textContent=st;
  $('#r-mode').textContent=rHold?'TX ▸':now<rxT?'RX ◂':'CH';
  let busy=0;for(const k in CS())if(CS()[k].ph==='go')busy=1;
  rLed.className='hled'+(rHold?' tx':now<rxT?' rx':busy?' wait':'');
  for(const k of $('#r-keys').children)k.classList.toggle('cur',k.dataset.n===String(rCh+1));
  rBig.classList.toggle('no',cls!=='idle');
}
function logLine(tag,txt,ok){rLog.push({tag,txt,ok});if(rLog.length>12)rLog.shift();}
function renderSup(){
  const C=CS(),act=CALLS.filter(d=>C[d.k]&&(C[d.k].ph==='go'||C[d.k].ph==='on')),sp=$('#sup');
  const sig=act.map(d=>d.k+C[d.k].ph).join(',');
  if(sig!==supSig){supSig=sig;sp.innerHTML=act.map(d=>`<button class="sp ${C[d.k].ph}${supNew===d.k&&C[d.k].ph==='on'?' new':''}" data-k="${d.k}"><i><svg viewBox="0 0 24 24">${RICON[d.k]}</svg></i><span>${CNAME[d.k]}</span><b></b></button>`).join('');supNew='';placeNotes();}
  for(const b of sp.children){const d=CALLS.find(c=>c.k===b.dataset.k),st=C[d.k],m=Math.max(1,Math.ceil(((st.ph==='go'?st.at:st.end)-S.tick)/20)),t=(st.ph==='go'?'chega ':'')+m+' min',e=b.querySelector('b');if(e.textContent!==t)e.textContent=t;}
}
function updateRadio(){
  const C=CS();let n=0;for(const k in C)if(C[k].ph==='go'||C[k].ph==='on')n++;
  rKey.classList.toggle('busy',n>0);const rn=$('#r-n');rn.hidden=!n;if(rn.textContent!==String(n))rn.textContent=n;
  renderSup();if(!radioEl.hidden)renderRadio();
}
function fireCall(k){
  const d=CALLS.find(c=>c.k===k);if(!d||callState(d)[0]!=='idle')return false;
  const C=CS(),prev=C[k]||{n:0};C[k]={ph:'go',at:S.tick+Math.round(d.eta*20),n:(prev.n||0)+1};
  SND.roger();buzz(20);logLine('TX',d.ack);setTimeout(()=>{if(!radioEl.hidden)say2('Central: '+d.ack,2600);},900);setTimeout(()=>msg('central',d.ack),380);
  const row=rList.children[CALLS.indexOf(d)];if(row)kick(row,'del',1200);updateRadio();return true;
}
function deliver(d){
  SND.inbound();setTimeout(()=>SND.stamp(),380);buzz(30);rxT=performance.now()+1800;
  const loc=CLOC[d.k]&&CLOC[d.k]();
  if(loc){const X=loc[0]*T+16,Y=loc[1]*TH+TH-4;ringFx(X,Y,[125,255,154],34,60);setTimeout(()=>ringFx(X,Y,[210,255,220],20,44),170);burstSparks(X,Y,18,[125,255,154]);floatText(X,Y-12,'✓ '+CNAME[d.k],'#7dff9a',190);}
  if(d.k==='fita'){kick($('#g-fita'),'refill',950);hudPop($('#g-fita'),'+20 m');}
  if(d.k==='transito')for(const ty of [1,H-2])for(let x=10;x<4*T;x+=30)puff(x,ty*TH+TH-6,[240,140,70]);
  kick(rKey,'rx',1600);supNew=d.k;logLine('✓',CNAME[d.k]+': '+CDONE[d.k],true);
  if(!radioEl.hidden){const row=rList.children[CALLS.indexOf(d)];if(row)kick(row,'del',1200);say2('✓ Chegou: '+CDONE[d.k],3000,true);lit();}
  else showDeliv(d,loc);
  updateRadio();
}
function showDeliv(d,loc){
  const el=$('#deliv');clearTimeout(dvT);el.classList.remove('out');el.hidden=false;void el.offsetWidth;el.style.animation='none';void el.offsetWidth;el.style.animation='';
  $('#dv-k').textContent='Chegou · rádio';$('#dv-t').textContent=d.t;$('#dv-s').textContent=CDONE[d.k];dvLoc=loc;$('#dv-go').hidden=!loc;appEl.classList.add('deliv-on');
  dvT=setTimeout(()=>{el.classList.add('out');dvT=setTimeout(()=>{el.hidden=true;el.classList.remove('out');appEl.classList.remove('deliv-on');},360);},4200);
}
$('#dv-go').addEventListener('click',()=>{SND.click();if(dvLoc)panTo(dvLoc);});
function hudPop(el,txt){const r=el.getBoundingClientRect(),p=clientToApp(r.left+r.width/2,r.top+r.height);const s=document.createElement('span');s.className='hudpop';s.textContent=txt;s.style.left=p.x+'px';s.style.top=(p.y+4)+'px';appEl.appendChild(s);setTimeout(()=>s.remove(),1700);}
function panTo(loc){PAN=[loc[0]*T+16,loc[1]*TH+TH/2];follow=false;}
function stepPan(){if(!PAN)return;cam.x+=(PAN[0]-cam.x)*0.14;cam.y+=(PAN[1]-cam.y)*0.14;clampCam();if(Math.hypot(PAN[0]-cam.x,PAN[1]-cam.y)<1.5)PAN=null;}
$('#sup').addEventListener('click',e=>{const b=e.target.closest('.sp');if(!b)return;SND.click();const f=CLOC[b.dataset.k],loc=f&&f();if(loc)panTo(loc);else{openRadio();tune(CALLS.findIndex(c=>c.k===b.dataset.k));}});
function fitRadio(){const inn=$('#hto-in');if(radioEl.hidden)return;const cs=getComputedStyle(radioEl),pl=parseFloat(cs.paddingLeft),pr=parseFloat(cs.paddingRight),pt=parseFloat(cs.paddingTop),pb=parseFloat(cs.paddingBottom),aw=radioEl.clientWidth-pl-pr,ah=radioEl.clientHeight-pt-pb;const k=Math.min(1,aw/inn.offsetWidth,ah/inn.offsetHeight);inn.style.setProperty('--rk',k.toFixed(3));inn.style.setProperty('--rcx',(pl+aw/2).toFixed(1)+'px');inn.style.setProperty('--rcy',(pt+ah/2).toFixed(1)+'px');}
function openRadio(){if(cmd)cmdCancel();hideCoach();radioEl.hidden=false;appEl.classList.add('radio-on');rKey.setAttribute('aria-expanded','true');tune(rCh);fitRadio();SND.rOn();}
function closeRadio(){if(radioEl.hidden)return;holdEnd(true);SND.rOff();radioEl.hidden=true;appEl.classList.remove('radio-on');rKey.setAttribute('aria-expanded','false');}
rKey.setAttribute('aria-expanded','false');
// keys peek past the bottom edge; never let focus scroll the app to reveal them
appEl.addEventListener('scroll',()=>{if(appEl.scrollTop||appEl.scrollLeft){appEl.scrollTop=0;appEl.scrollLeft=0;}});
$('#crew').addEventListener('scroll',e=>{const d=e.currentTarget;if(d.scrollTop||d.scrollLeft){d.scrollTop=0;d.scrollLeft=0;}});
rKey.addEventListener('click',()=>{if(radioEl.hidden)openRadio();else closeRadio();});
radioEl.addEventListener('click',e=>{if(e.target===radioEl||e.target.id==='hto-in')closeRadio();});rList.addEventListener('wheel',e=>{e.preventDefault();tune(rCh+(e.deltaY>0?1:-1),'knob');},{passive:false});
$('#r-knob').addEventListener('click',()=>tune(rCh+1,'knob'));
$('#r-vol').addEventListener('click',closeRadio);
$('#r-keys').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!b.dataset.n)return;kick(b,'hit',120);const n=b.dataset.n;if(n==='off')closeRadio();else if(n==='up')tune(rCh+1,1);else if(n==='dn')tune(rCh-1,1);else tune(+n-1,1);});
rList.addEventListener('click',e=>{const b=e.target.closest('.lr');if(b)tune(+b.dataset.i,1);});
// push to talk: hold, the bar fills, letting go early drops the call
function holdEnd(cancel){SND.pttStop();if(!rHold)return;const h=rHold;rHold=null;cancelAnimationFrame(h.raf);h.el.classList.remove('down');rBig.style.setProperty('--h',0);$('#r-bar').style.width='0';if(cancel&&!radioEl.hidden){say2('TX cancelado',1100);SND.key();}renderRadio();}
function pttDown(e){
  const el=e.currentTarget,d=CALLS[rCh],[cls,txt]=callState(d);lit();
  if(cls!=='idle'){SND.busy();say2(txt,1600,true);buzz(40);return;}
  try{el.setPointerCapture(e.pointerId);}catch(_){}
  rHold={el,pid:e.pointerId,t0:performance.now(),raf:0};el.classList.add('down');SND.pttStart();buzz(8);renderRadio();
  const step=()=>{if(!rHold||rHold.el!==el)return;const k=Math.min(1,(performance.now()-rHold.t0)/700);rBig.style.setProperty('--h',k.toFixed(3));$('#r-bar').style.width=(k*100).toFixed(1)+'%';
    if(k>=1){rHold=null;el.classList.remove('down');SND.pttStop();rBig.style.setProperty('--h',0);$('#r-bar').style.width='0';if(fireCall(d.k))say2('Enviado ✓ aguarde',1800);}else rHold.raf=requestAnimationFrame(step);};
  rHold.raf=requestAnimationFrame(step);
}
const pttUp=e=>{if(rHold&&e.pointerId===rHold.pid)holdEnd(true);};
for(const el of [$('#r-ptt'),rBig]){el.addEventListener('pointerdown',pttDown);el.addEventListener('pointerup',pttUp);el.addEventListener('pointercancel',pttUp);el.addEventListener('contextmenu',e=>e.preventDefault());
  el.addEventListener('click',e=>{if(e.detail===0){const d=CALLS[rCh];if(callState(d)[0]==='idle'){if(fireCall(d.k))say2('Enviado ✓ aguarde',1800);}else{SND.busy();say2(callState(d)[1],1600,true);}}});}
/* bottom keys: stencils sprayed on the asphalt, like the marks the perícia leaves on the ground */
(function buildKeyIcons(){
  try{if(!document.querySelector('link[data-stencil]')){const l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Special+Elite&display=swap';l.dataset.stencil='1';document.head.appendChild(l);}}catch(_){}
  const NS='http://www.w3.org/2000/svg';
  const defs=document.createElementNS(NS,'svg');defs.setAttribute('width','0');defs.setAttribute('height','0');defs.setAttribute('aria-hidden','true');defs.style.position='absolute';
  defs.innerHTML='<filter id="spray" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.8" result="d"/><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="1" seed="3" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.45" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>';
  appEl.appendChild(defs);
  const P={
    isolar:'<circle cx="12" cy="15" r="8"/><circle cx="12" cy="15" r="2.6"/><path d="M12 23h16v-6"/><path d="M17 23l3-6M22 23l3-6"/>',
    cancel:'<path d="M11 9h10a7 7 0 010 14h-8"/><path d="M15 4l-5 5 5 5"/>',
    radio:'<path d="M12 3v7"/><rect x="9" y="10" width="14" height="19" rx="2.5"/><path d="M12 14h8v4h-8z"/><path d="M12.5 22.5h.01M16 22.5h.01M19.5 22.5h.01M12.5 26h.01M16 26h.01M19.5 26h.01"/>'
  };
  // each mark gets a square box centred on its own drawing, so every key is cut at the same height
  const VB={isolar:'2 1 28 28',cancel:'5.5 0 27 27',radio:'1 1 30 30'};
  for(const [id,k] of [['t-isolar','isolar'],['t-cancel','cancel'],['t-radio','radio']]){const kb=document.querySelector('#'+id+' .kb');if(!kb)continue;kb.querySelectorAll('svg,img').forEach(e=>e.remove());
    const s=document.createElementNS(NS,'svg');s.setAttribute('viewBox',VB[k]);s.setAttribute('class','stc');s.setAttribute('aria-hidden','true');s.innerHTML=P[k];kb.prepend(s);}
  const tp=document.getElementById('t-pericia');if(tp)tp.hidden=true;
})();

/* smooth motion: the world steps 20 times a second; people are drawn between their last two positions so walking glides at any frame rate */
let LERPED=[];
function lerpOn(){const al=paused?1:Math.min(1,Math.max(0,acc));LERPED=[];
  for(const L of [S.crew,S.civs,IML.agents])for(const p of L){if(p.px==null)continue;const dx=p.x-p.px,dy=p.y-p.py;if(Math.abs(dx)>1.5||Math.abs(dy)>1.5)continue;p._x=p.x;p._y=p.y;p.x=p.px+dx*al;p.y=p.py+dy*al;LERPED.push(p);}}
function lerpOff(){for(const p of LERPED){p.x=p._x;p.y=p._y;}LERPED=[];}

/* camera follow reads the smoothed position, with a frame-rate independent ease */
function followCam(dt){if(!(follow&&sel!=null))return;const a=S.crew.find(k=>k.id===sel);if(!a)return;const k=1-Math.pow(0.88,Math.max(0,dt)*60);cam.x+=(a.x*T+8-cam.x)*k;cam.y+=(a.y*TH+8-cam.y)*k;clampCam();}

/* crew dock split: perícia and campo stay on the dock; the PMs live in a tray the "Apoio" key opens */
const crew2El=$('#crew2');let TRAY=false;
const isMain=a=>a.kind!=='pm';
function buildCrew(){
  buildCrew0();
  crew2El.innerHTML='';
  const side=S.crew.filter(a=>!isMain(a));
  for(const a of side){const b=document.getElementById('mem-'+a.id);if(b){crew2El.appendChild(b);b.addEventListener('click',()=>setTimeout(()=>setTray(false),120));}}
  if(!side.length){TRAY=false;crew2El.hidden=true;return;}
  const m=document.createElement('button');m.className='mmore';m.id='mem-more';m.type='button';
  m.innerHTML=`<span class="pf"><svg class="ring" viewBox="0 0 46 46" aria-hidden="true"><circle class="rt" cx="23" cy="23" r="20"/></svg><span class="disc"><svg class="stc" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.3-3 7.6-7 9.5-4-1.9-7-5.2-7-9.5V6z"/><path class="ch" d="M9 11l3 3 3-3"/></svg></span><b class="cnt">+${side.length}</b></span><span class="nm">Apoio</span>`;
  m.addEventListener('click',()=>{SND.click();setTray(!TRAY);});
  crewEl.appendChild(m);
  setTray(TRAY,true);
}
function setTray(on,quiet){
  TRAY=!!on&&crew2El.children.length>0;
  if(TRAY&&!quiet&&sel!=null){sel=null;selTile=null;follow=false;pendingOrder=null;updateInfo();updateCrew();}
  const m=$('#mem-more');if(m){m.setAttribute('aria-expanded',String(TRAY));m.title=TRAY?'Recolher o apoio da PM':'Mostrar o apoio da PM';m.setAttribute('aria-label',m.title);}
  if(TRAY){crew2El.hidden=false;placeTray();crew2El.classList.remove('in');void crew2El.offsetWidth;if(!quiet)crew2El.classList.add('in');}
  else crew2El.hidden=true;
  placeTray();measureHud();
}
const LANDB=()=>document.body.classList.contains('land');
function placeTray(){
  if(crew2El.hidden)return;
  crew2El.style.left=crewEl.offsetLeft+'px';
}
function trayUp(){if(!crew2El||crew2El.hidden)return 0;const hb=crew2El.offsetParent;return VH()-((hb?hb.offsetTop:0)+crew2El.offsetTop);}
// a PM picked on the map opens the tray so the selection is visible
// with the tray shut, the Apoio key lights up while a PM is the one selected
setInterval(()=>{const m=$('#mem-more');if(!m)return;const a=sel==null?null:S.crew.find(k=>k.id===sel),on=!!(a&&!isMain(a));if(m._on!==on){m._on=on;m.classList.toggle('has',on);}},200);

/* ---------- Event boxes ----------
   style 'balao' (default): routine calls from someone on the scene open as a balloon tied to that person on the map;
   style 'cena': the few moments that turn the case open as a cinematic cut. The rule lives in the event data. */
EVENTS.deixaram={who:'sonia',style:'cena',where:'Celular',title:'“Não olha só pro que mexeram. Olha pro que deixaram.”',text:'',
  opts:[{t:'Continuar',sub:'',fn:()=>msg('sonia','Não olha só pro que mexeram. Olha pro que deixaram.')}]};
const bubEl=$('#bub'),bubLn=$('#bub-ln'),bubPin=$('#bub-pin'),cineEl=$('#cine');let BUB=null;
function evDone(o){SND.click();o.fn();bubEl.hidden=true;bubLn.setAttribute('hidden','');bubPin.hidden=true;BUB=null;
  if(!cineEl.hidden){cineEl.classList.remove('in');appEl.classList.remove('cine-on');setTimeout(()=>{cineEl.hidden=true;},260);}
  evOpen=null;appEl.classList.remove('evt-on');setSpeed(evPrev);clearTimeout(coachTm);coachTm=setTimeout(showCoach,1400);}
function evOpts(box,ev,withSub){box.innerHTML='';ev.opts.forEach((o,n)=>{const b=document.createElement('button');b.type='button';
  b.innerHTML=`<span class="ix">${ev.opts.length>1?String.fromCharCode(65+n):'›'}</span><span class="ot"><b>${o.t}</b>${withSub&&o.sub?`<span>${o.sub}</span>`:''}</span>`;
  b.addEventListener('click',()=>evDone(o));box.appendChild(b);});}
function evStart(k){const ev=EVENTS[k];evOpen=k;evPrev=paused?(lastSpeed||1):speed;setSpeed(0);appEl.classList.add('evt-on');if(cmd)cmdCancel();hideCoach();return ev;}
function pumpEvents(){
  if(evOpen||!EVQ.length||!$('#intro').hidden||!$('#end').hidden||!radioEl.hidden)return;
  const ev=EVENTS[EVQ[0]];
  if(ev.style==='cena'){openCine(EVQ.shift());return;}
  const a=S.crew.find(c=>c.key===ev.who);
  if(!a){pumpEvents0();return;}
  openBub(EVQ.shift(),a);
}
function openBub(k,a){
  const ev=evStart(k),p=PEOPLE[ev.who];
  $('#bub-av').innerHTML=avatar(ev.who);$('#bub-who').textContent=p.name;$('#bub-title').textContent=ev.title;$('#bub-text').textContent=ev.text;
  evOpts($('#bub-opts'),ev,true);
  BUB={a};bubEl.style.setProperty('--c',a.accent||'#f2c230');
  bubEl.hidden=false;bubLn.removeAttribute('hidden');bubPin.hidden=false;bubEl.classList.remove('in');void bubEl.offsetWidth;bubEl.classList.add('in');
  // bring the person into view when they are off screen or under the bars
  const s=bubAnchor(a);if(s.x<40||s.x>VW()-40||s.y<HUDPAD.t+30||s.y>VH()-HUDPAD.b-10)panTo([a.x,a.y]);
  placeBub();SND.pop();
}
function bubAnchor(a){const e=ez();return {x:(a.x*T+16-cam.x)*e+VW()/2,y:(a.y*TH+TH-30-cam.y)*e+VH()/2,e};}
function placeBub(){
  if(!BUB)return;const a=BUB.a,s=bubAnchor(a),vw=VW(),vh=VH(),w=bubEl.offsetWidth,h=bubEl.offsetHeight;
  const top=HUDPAD.t+8,bot=vh-HUDPAD.b-8,gap=46;
  let x,y,side;
  if(s.x+gap+w<=vw-10){x=s.x+gap;side=1;}else if(s.x-gap-w>=10){x=s.x-gap-w;side=-1;}else{x=Math.min(Math.max(10,s.x-w/2),vw-w-10);side=0;}
  if(side){y=s.y-h*0.35;}else{y=s.y-h-30;if(y<top)y=s.y+30;}
  y=Math.min(Math.max(top,y),Math.max(top,bot-h));
  bubEl.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;
  const ex=side===1?x:side===-1?x+w:Math.min(Math.max(x+16,s.x),x+w-16),ey=side?Math.min(Math.max(y+16,s.y),y+h-16):(y>s.y?y:y+h);
  const mx=side?ex-side*16:ex;
  bubLn.setAttribute('viewBox',`0 0 ${vw} ${vh}`);bubLn.style.width=vw+'px';bubLn.style.height=vh+'px';
  bubLn.firstElementChild.setAttribute('d',`M${s.x.toFixed(1)} ${s.y.toFixed(1)}L${mx.toFixed(1)} ${ey.toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`);
  const r=Math.max(9,11*s.e);bubPin.style.transform=`translate(${(s.x-r).toFixed(1)}px,${(s.y-r).toFixed(1)}px)`;bubPin.style.width=bubPin.style.height=(2*r).toFixed(1)+'px';
}
function openCine(k){
  const ev=evStart(k),p=PEOPLE[ev.who];
  $('#cn-av').innerHTML=avatar(ev.who);$('#cn-who').textContent=p.name+(ev.where?' · '+ev.where:'');$('#cn-title').textContent=ev.title;
  const tx=$('#cn-text');tx.textContent=ev.text||'';tx.hidden=!ev.text;
  evOpts($('#cn-opts'),ev,true);$('#cn-opts').classList.toggle('one',ev.opts.length===1);
  closeRadio();cineEl.hidden=false;void cineEl.offsetWidth;cineEl.classList.add('in');appEl.classList.add('cine-on');SND.pop();
}

/* keep the top bar still while numbers change: each changing label reserves the width of its widest value */
const STAB=[['#clk',()=>{const d=wideDigit('#clk');return [d+d+':'+d+d];}],['#lcd-ph',()=>['NOITE','AURORA','DIA']],['#ach',()=>{const d=wideDigit('#ach');return [d];}],['#fita',()=>{const d=wideDigit('#fita');return [d+d+' m'];}],['#pres',()=>['Boa','Atenção']]];
const stabCv=document.createElement('canvas').getContext('2d');
function fontOf(el){const c=getComputedStyle(el);return `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;}
function textW(el,t){const c=getComputedStyle(el);stabCv.font=fontOf(el);const ls=parseFloat(c.letterSpacing)||0;return stabCv.measureText(t).width+ls*t.length;}
function wideDigit(sel){const el=$(sel);if(!el)return '0';let best='0',bw=0;for(const d of '0123456789'){const w=textW(el,d);if(w>bw){bw=w;best=d;}}return best;}
function stabilizeTop(){
  for(const [sel,f] of STAB){const el=$(sel);if(!el)continue;el.style.minWidth='';el.style.display=el.style.display||'inline-block';
    const w=Math.ceil(Math.max(...f().map(t=>textW(el,t))));if(w>0)el.style.minWidth=w+'px';}
}
stabilizeTop();
try{document.fonts&&document.fonts.ready.then(()=>{stabilizeTop();applyLayout(true);});document.fonts&&document.fonts.addEventListener&&document.fonts.addEventListener('loadingdone',()=>{stabilizeTop();applyLayout(true);});}catch(_){}
/* ---------- Boot ---------- */
let last=performance.now(),acc=0;
function loop(now){
  const dt=Math.min(0.1,(now-last)/1000);last=now;updFly(dt);
  if(!paused){acc+=dt*20*speed;let n=0;while(acc>=1&&n<100){stepWorld();acc-=1;n++;}if(n>=100)acc=0;}
  updWeather();updParticles();{const dt=paused?0:speed;updCars(dt);updLife(dt);}
  cmdEdgePan();stepPan();stepZoom();frame++;lerpOn();followCam(dt);render();placeBub();lerpOff();if(frame%6===0){updateUI();pumpEvents();lodNotice();}if(frame%3===0)SND.tick();
  requestAnimationFrame(loop);
}
let lastL=null;
function fitCards(){
  for(const m of document.querySelectorAll('.modal')){if(m.hidden)continue;const c=m.querySelector('.card');c.style.transform='';c.style.maxHeight='none';c.style.overflow='visible';
    const cs=getComputedStyle(m),avH=m.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom),avW=m.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);
    const k=Math.min(1,avH/c.offsetHeight,avW/c.offsetWidth);if(k<1)c.style.transform=`scale(${k.toFixed(3)})`;}
}
// if the kit still does not fit the width, shrink it as a whole instead of letting it overflow
let TOPK=1;
function fitTop(){const ht=$('.ht');ht.style.transform='';ht.style.width='';TOPK=1;
  const avail=ht.clientWidth;let need=ht.scrollWidth;
  // upright: the watch shares a row with the buttons, the marks with the gauges
  if(!document.body.classList.contains('land')){const w=s=>{const e=ht.querySelector(s);return e&&e.offsetWidth?e.offsetWidth:0;};need=Math.max(w('.h-time')+w('.h-btns'),w('.h-marks')+w('.h-state'))+6;}
  if(need>avail+1){TOPK=avail/need;ht.style.width=(avail/TOPK).toFixed(1)+'px';ht.style.transform=`scale(${TOPK.toFixed(4)})`;}}
function placeNotes(){const ht=$('.ht'),y=ht.offsetTop+ht.offsetHeight*TOPK,sp=$('#sup');sp.style.top=(y+6)+'px';const sh=!document.body.classList.contains('land')&&sp.children.length?sp.offsetHeight+6:0;notesEl.style.top=(y+6+sh)+'px';$('#evt').style.top=(y+8)+'px';}
function measureHud(){
  const yOf=el=>{let y=0;for(let e=el;e&&e!==appEl;e=e.offsetParent)y+=e.offsetTop;return y;};
  const vh=VH(),bd=vh-yOf(crewEl),br=vh-yOf($('.hud-right'));
  appEl.style.setProperty('--hbd',(Math.max(bd,trayUp())+8)+'px');appEl.style.setProperty('--hbm',(Math.max(bd,br)+8)+'px');
  const ht=$('.ht');HUDPAD.t=ht.offsetTop+ht.offsetHeight*TOPK;HUDPAD.b=Math.max(bd,br);
}
function screenInsets(){
  const d=document.createElement('div');d.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
  document.body.appendChild(d);const c=getComputedStyle(d),r={t:parseFloat(c.paddingTop)||0,r:parseFloat(c.paddingRight)||0,b:parseFloat(c.paddingBottom)||0,l:parseFloat(c.paddingLeft)||0};d.remove();return r;
}
let INS={t:0,r:0,b:0,l:0};
function setInsets(){
  const st=appEl.style;
  if(!ROT){['t','r','b','l'].forEach(k=>st.removeProperty('--s'+k));INS=screenInsets();return;}
  const framed=(()=>{try{return window.self!==window.top;}catch(_){return true;}})();
  const i=screenInsets(),top=Math.max(i.t,framed?118:8),bot=Math.max(i.b,10);
  const m=ROT===90?{t:i.r,r:bot,b:i.l,l:top}:{t:i.l,r:top,b:i.r,l:bot};
  for(const k in m)st.setProperty('--s'+k,m[k]+'px');INS=m;
}
function applyLayout(force){
  if(SW()>SH())ROT=0;else if(ROT===0&&!userVert)ROT=90;
  if(ROT){appEl.style.width=SH()+'px';appEl.style.height=SW()+'px';appEl.style.transform=ROT===90?'translateX('+SW()+'px) rotate(90deg)':'translateY('+SH()+'px) rotate(-90deg)';}
  else{appEl.style.width='';appEl.style.height='';appEl.style.transform='';}
  document.body.classList.toggle('rot',!!ROT);setInsets();
  const L=VW()>VH();document.body.classList.toggle('land',L);
  const A=VW()-INS.l-INS.r-16;document.body.classList.toggle('mid',L&&A>=600&&A<770);document.body.classList.toggle('narrow',L&&A<600);
  $('#rot').hidden=SW()>SH();
  if(typeof stabilizeTop==='function')stabilizeTop();fitTop();measureHud();resize();placeNotes();fitCards();fitRadio();placeTray();
  if(force||L!==lastL){lastL=L;fitView();}
  if(cmd)cmdCancel();if(!coachEl.hidden){hideCoach();setTimeout(showCoach,300);}
}
$('#rot').addEventListener('click',()=>{ROT=ROT===0?90:ROT===90?-90:0;userVert=(ROT===0);lastL=null;applyLayout(true);});
addEventListener('resize',()=>applyLayout(false));
newGame();
initArt();buildAmbient();buildSeg7();buildRail();buildCrew();applyLayout(true);
setTimeout(()=>{for(const a of S.crew)framesHDFor(a);bedOverlay(BODIES,GORE,true);},400);
window.__acacias={S:()=>S,cam,ez,VW,VH,get ROT(){return ROT;},T,TH,discover,say,IML,FX,setGore,get LODV(){return LODV;},FLY,startFlyby,spawnCar,spawnCiv,giveOrder,CARBLK,get cmd(){return cmd;},showCoach,LANDED,HUDPAD};
setTool(null);setSpeed(0);updateUI();
$('#b-start').addEventListener('click',()=>{SND.init();SND.resume();$('#intro').hidden=true;setSpeed(1);msg('sonia','Maurício já está na casa e a PM segura a frente. Revise a cena antes de ouvir qualquer versão.');clearTimeout(coachTm);coachTm=setTimeout(showCoach,9000);});
addEventListener('pointerdown',()=>SND.resume(),{passive:true});
document.querySelectorAll('.tool,.speed button,.hbtn,#zoom button').forEach(b=>b.addEventListener('click',()=>SND.click()));
$('#z-in').addEventListener('click',()=>zoomTo(cam.z*1.6,VW()/2,VH()/2));
$('#z-out').addEventListener('click',()=>zoomTo(cam.z/1.6,VW()/2,VH()/2));
$('#opt-gore').addEventListener('change',e=>setGore(e.target.checked));
$('#gore-t').addEventListener('click',()=>setGore(!GORE));
$('#snd').addEventListener('click',()=>{SND.init();SND.set(!SND.on);$('#snd').classList.toggle('off',!SND.on);$('#snd').setAttribute('aria-pressed',String(SND.on));});
requestAnimationFrame(loop);
})();
