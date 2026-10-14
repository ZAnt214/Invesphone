/* Quadro do Caso 01: a parede de investigação da sala da equipe, como nos filmes. Cada capítulo é uma árvore de dedução
   (docs/CASE01_BOARD.md): a pergunta do capítulo é a raiz e os três galhos são perguntas menores. O jogador tira as
   evidências da pasta, prende nos espaços de cada galho e escolhe o que elas provam; o jogo confere na hora. Com os três
   galhos acesos, acende a conclusão do capítulo. No último, a raiz leva ao relatório de acusação.
   Nada aqui libera ou trava a história. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { fxOn, setFx } from '../settings/gameSettings'
import { advanceTask, readCase, writeCase, type CaseSave } from '../case/caseSave'
import { summon } from '../case/depositions'
import { fileReport, reportEnding } from '../case/report'
import { nextSteps, type GuideStepData } from '../case/nextSteps'
import { chapters } from '../case01'
import { BOARD_PEOPLE, TREE, boardOf, clueImg, clueOf, cluesOf, discoveredOf, fits, heardOf, kindOf, LEMOS_BACK, WALL_IMGS, personOf, portrait, rightAnswer, sourcesOf, stageOfTask, thumb, titleOf,
  type BoardSave, type Branch } from './boardData'
import { playCine } from './cineAudio'
import './case-board.css'

type Props = {
  /** fotos que a varredura da casa trouxe (ids das pistas da cena) */
  found:string[]
  onClose:()=>void
  /** fecha o quadro e abre o depoimento na sala da base */
  onDeposition:(id:string)=>void
  /** fecha o quadro e leva Lemos até alguém da equipe */
  onTeam?:(id:string)=>void
  /** alguém foi chamado: a base põe a pessoa na recepção */
  onSummoned?:(id:string)=>void
  /** o quadro está na tela (no mesmo quadro em que a entrada começa; quem abriu pode tirar a cena de baixo) */
  onShown?:()=>void
  /** false: montado de antemão e escondido (o Lemos indo até o quadro); a entrada, o som e o save só começam com true */
  live?:boolean
}
/** a árvore de um capítulo: 844×250 (pistas à esquerda, deduções no meio, conclusão à direita) */
const W=844,H=250
const ROW=[36,125,214]                              // centro de cada galho
const NODE_X=292,ROOT_X=598
const CROQUI_IMG='/evidence/case01/new/croqui_residencia.jpg'
const SONIA='/characters/sonia/portrait.jpg',LEMOS='/characters/lemos/hud-rosto.jpg'
const FRACA='A dedução pode estar certa, mas essas evidências não mostram isso. Troque as fotos.'
const firstName=(id:string)=>personOf(id)?.name.split(' ')[0]??id
const art=(id:string)=>['caio','rafael','jorge','teo'].includes(id)?'o':'a'
const ENDINGS={A:['Caso Encerrado','O relatório separa quem entrou na casa de quem abriu o caminho, e as provas sustentam cada parte.','“Bom trabalho. Você não parou no primeiro culpado que apareceu.” · Sônia'],
  B:['Meia Justiça','Os executores estão no relatório. O papel de quem preparou a noite ficou de fora.','“Você fechou quem entrou na casa. Não necessariamente quem colocou os dois lá.” · Sônia'],
  C:['Arquivado','O relatório não sustenta a acusação contra quem foi apontado.','Sem uma cadeia coerente de provas, o caso perde força.']} as const
const ROT=[-2.5,2,-1.5,2.5,-1,1.5,-2,1]
/** Arte oficial do Lemos de costas (creative-requests/completed/2026-10-10-lemos-de-costas-quadro.md). */
const CINE_FULL=4600, CINE_SHORT=900
/* a parede inteira do caso, em volta da parte do capítulo: papéis, fotos e fios fora de foco, para dar o tamanho do caso.
   Só usa material que não adianta nada da investigação (fotos da casa, croquis e papéis em branco) e fica desfocado. */
const WALL={x:-580,y:-450,w:2004,h:1150}
function drawWall(cv:HTMLCanvasElement,imgs:HTMLImageElement[]){
  const K=.6,c=cv.getContext('2d');if(!c)return
  cv.width=Math.round(WALL.w*K);cv.height=Math.round(WALL.h*K);c.scale(K,K);c.translate(-WALL.x,-WALL.y)
  let sd=11;const R=()=>(sd=sd*16807%2147483647)/2147483647
  c.fillStyle='#7d5330';c.fillRect(WALL.x,WALL.y,WALL.w,WALL.h)
  for(let i=0;i<9000;i++){c.fillStyle=R()<.5?'rgba(50,28,10,.35)':'rgba(190,140,90,.25)';const z=1+R()*3;c.fillRect(WALL.x+R()*WALL.w,WALL.y+R()*WALL.h,z,z)}
  const centers:[number,number][]=[]
  const free=(x:number,y:number,w:number,h:number)=>x+w<-14||x>W+14||y+h<-14||y>H+14
  for(let i=0;i<150&&centers.length<74;i++){
    const kind=R(),w=kind<.35?96:kind<.6?120:kind<.8?70:150,h=kind<.35?86:kind<.6?150:kind<.8?62:110
    const x=WALL.x+30+R()*(WALL.w-60-w),y=WALL.y+30+R()*(WALL.h-60-h);if(!free(x,y,w,h))continue
    c.save();c.translate(x+w/2,y+h/2);c.rotate((R()-.5)*.12)
    c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=8;c.shadowOffsetY=5
    if(kind<.35){c.fillStyle='#ece6da';c.fillRect(-w/2,-h/2,w,h);c.shadowColor='transparent';const im=imgs[(R()*imgs.length)|0];if(im?.width)c.drawImage(im,-w/2+5,-h/2+5,w-10,h-22)}
    else if(kind<.6){c.fillStyle='#f1ece0';c.fillRect(-w/2,-h/2,w,h);c.shadowColor='transparent';c.fillStyle='rgba(30,30,30,.35)';for(let l=0;l<9;l++)c.fillRect(-w/2+10,-h/2+16+l*14,(w-20)*(.5+R()*.5),3)}
    else if(kind<.8){c.fillStyle=R()<.5?'#f0d551':'#f6f0de';c.fillRect(-w/2,-h/2,w,h);c.shadowColor='transparent';c.fillStyle='rgba(40,30,20,.55)';c.font='700 30px Caveat, cursive';c.textAlign='center';c.fillText(['?','16/10','00:56?','quem?','?','23h?'][(R()*6)|0],0,10)}
    else{c.fillStyle='#e8e1d1';c.fillRect(-w/2,-h/2,w,h);c.shadowColor='transparent';const im=imgs[(R()*2)|0];if(im?.width)c.drawImage(im,-w/2+4,-h/2+4,w-8,h-8)}
    c.restore();centers.push([x+w/2,y+6])
  }
  // fios vermelhos ligando os papéis
  c.lineWidth=2;c.strokeStyle='rgba(150,24,18,.85)'
  for(let i=0;i<46;i++){const a=centers[(R()*centers.length)|0],b=centers[(R()*centers.length)|0];if(!a||!b||a===b)continue
    const d=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d>620)continue
    c.beginPath();c.moveTo(a[0],a[1]);c.quadraticCurveTo((a[0]+b[0])/2,(a[1]+b[1])/2+d*.1,b[0],b[1]);c.stroke()}
  for(const [x,y] of centers){c.fillStyle='#b8241b';c.beginPath();c.arc(x,y,4,0,7);c.fill()}
  // moldura de madeira e luz caindo nas bordas
  c.lineWidth=26;c.strokeStyle='#2d1d10';c.strokeRect(WALL.x+13,WALL.y+13,WALL.w-26,WALL.h-26)
  const gr=c.createRadialGradient(W/2,H/2,240,W/2,H/2,1100);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.6)');c.fillStyle=gr;c.fillRect(WALL.x,WALL.y,WALL.w,WALL.h)
}
/** Poeira no facho da luminária durante a entrada: brilha só dentro da luz. */
function DustMotes(){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const cv=ref.current;if(!cv)return
    const dpr=Math.min(1.5,window.devicePixelRatio||1),W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr
    const c=cv.getContext('2d');if(!c)return
    const cx=W/2,top=W*.046
    const motes=Array.from({length:110},()=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.012,vy:-.004-Math.random()*.01,r:.5+Math.random()*1.6,ph:Math.random()*6}))
    let raf=0,last=performance.now();const t0=last
    const frame=(now:number)=>{const dt=Math.min(.05,(now-last)/1000);last=now;const T=(now-t0)/1000
      c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);c.globalCompositeOperation='lighter'
      const lit=T<.55?0:T<.66?.8:T<.74?.2:T<1?.9:1
      for(const m of motes){m.ph+=dt;m.x+=(m.vx+Math.sin(m.ph)*.004)*dt;m.y+=m.vy*dt;if(m.y<-.02)m.y=1.02;if(m.x<0)m.x=1;if(m.x>1)m.x=0
        const x=m.x*W,y=m.y*H,half=top+(y/H)*(W/2-top),d=Math.abs(x-cx)/half;if(d>=1)continue
        const a=(1-d)*(1-y/H*.6)*lit*(.5+.5*Math.sin(m.ph*3));if(a<.03)continue
        c.globalAlpha=a*.8;c.fillStyle='#ffe2b0';c.beginPath();c.arc(x,y,m.r,0,7);c.fill()}
      c.globalAlpha=1;raf=requestAnimationFrame(frame)}
    raf=requestAnimationFrame(frame)
    return ()=>cancelAnimationFrame(raf)
  },[])
  return <canvas ref={ref} className="cb-dust" aria-hidden="true"/>
}
/** Silhueta temporária do Lemos de costas, só sombra contra a luz do quadro (sem desenhar o personagem). */
function LemosSilhouette(){
  return <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <defs><linearGradient id="cb-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffcf8a" stopOpacity=".55"/><stop offset=".35" stopColor="#ffcf8a" stopOpacity=".08"/><stop offset="1" stopColor="#ffcf8a" stopOpacity="0"/></linearGradient></defs>
    <g fill="#07080a">
      <path d="M0 500 L0 392 C 18 338 88 306 150 296 C 166 284 171 266 173 246 L227 246 C 229 266 234 284 250 296 C 312 306 382 338 400 392 L400 500 Z"/>
      <ellipse cx="200" cy="168" rx="64" ry="80"/><ellipse cx="137" cy="178" rx="11" ry="20"/><ellipse cx="263" cy="178" rx="11" ry="20"/>
    </g>
    <g fill="none" stroke="url(#cb-rim)" strokeWidth="3">
      <path d="M0 392 C 18 338 88 306 150 296 C 166 284 171 266 173 246"/><path d="M227 246 C 229 266 234 284 250 296 C 312 306 382 338 400 392"/>
      <ellipse cx="200" cy="168" rx="64" ry="80"/>
    </g>
  </svg>
}

const copyCanvas=(cv:HTMLCanvasElement,src:HTMLCanvasElement)=>{cv.width=src.width;cv.height=src.height;cv.getContext('2d')?.drawImage(src,0,0)}
let corkCache:HTMLCanvasElement|null=null
function corkArt(){
  if(corkCache)return corkCache
  const cv=document.createElement('canvas')
  const K=Math.min(2,(window.devicePixelRatio||1));cv.width=W*K;cv.height=H*K
  const c=cv.getContext('2d');if(!c)return cv
  const w=cv.width,h=cv.height;let s=7;const R=()=>(s=s*16807%2147483647)/2147483647
  c.fillStyle='#8a5c33';c.fillRect(0,0,w,h)
  for(let i=0;i<90;i++){const x=R()*w,y=R()*h,r=(40+R()*120)*K,gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.5?'rgba(52,30,12,.22)':'rgba(196,146,92,.16)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2)}
  const pal=['rgba(70,40,16,.55)','rgba(110,70,36,.5)','rgba(176,128,78,.5)','rgba(205,160,104,.42)','rgba(48,26,10,.5)','rgba(150,104,60,.55)']
  for(let i=0,n=w*h/6;i<n;i++){c.fillStyle=pal[(R()*6)|0];const z=(.5+Math.pow(R(),2.2)*2.2)*K;c.fillRect(R()*w,R()*h,z,z*(.6+R()*.8))}
  for(let i=0;i<50;i++){const x=R()*w,y=R()*h;c.fillStyle='rgba(20,10,4,.7)';c.beginPath();c.arc(x,y,1.2*K,0,7);c.fill()}
  const gr=c.createRadialGradient(w/2,h*.3,0,w/2,h*.4,w*.7);gr.addColorStop(0,'rgba(255,236,200,.18)');gr.addColorStop(.6,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.4)');c.fillStyle=gr;c.fillRect(0,0,w,h)
  return corkCache=cv
}
let wallCache:Promise<HTMLCanvasElement>|null=null
const wallArt=()=>wallCache??=Promise.all(WALL_IMGS.map(src=>new Promise<HTMLImageElement>(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(i);i.src=src})))
  .then(imgs=>{const cv=document.createElement('canvas');drawWall(cv,imgs);return cv})
/** Desenha antes a cortiça e a parede do fundo (o que mais pesa ao abrir), para a entrada começar sem travar. */
export async function prewarmBoard(){corkArt();await wallArt()}

const TRAY_H=96
const ROLE_NEXT:Record<string,'exec'|'mentor'|'fora'|undefined>={none:'exec',exec:'mentor',mentor:'fora',fora:undefined}
const ROLE_TXT={exec:'Executor',mentor:'Mentor',fora:'Fora'} as const

export default function CaseBoard({found,onClose,onDeposition,onTeam,onSummoned,onShown,live=true}:Props){
  const [g,setG]=useState<CaseSave>(()=>advanceTask(readCase()))
  const b=boardOf(g)
  const save=(fn:(x:CaseSave)=>CaseSave)=>setG(writeCase(fn))
  const saveBoard=(fn:(x:BoardSave)=>Partial<BoardSave>)=>save(x=>({...x,board:{...boardOf(x),...fn(boardOf(x))}}))
  const have=useMemo(()=>cluesOf(g,found),[g,found])
  const people=discoveredOf(g)
  const reportReady=g.task>=8&&!g.ending

  // o que chegou desde a última visita entra com animação; depois fica marcado como visto
  const [fresh]=useState(()=>new Set(have.filter(id=>!b.seen.includes(id))))
  useEffect(()=>{if(!live)return;const t=window.setTimeout(()=>saveBoard(x=>({seen:[...new Set([...x.seen,...have])]})),1600);return ()=>window.clearTimeout(t)},[have.join(),live])

  /* capítulo: o atual abre sozinho; os anteriores dá para rever; 0 = a árvore do caso inteiro */
  const current=stageOfTask(g.task)
  const [stage,setStage]=useState<number>(current)
  const T=stage>0?TREE[stage-1]:null
  const [intro,setIntro]=useState(()=>current>(b.stage??0)?current:0)
  /* entrada de cinema: a câmera passa por trás do Lemos, que olha o quadro, e chega até a cortiça. Um toque pula só
     desta vez. "Não mostrar mais" desliga o ajuste scene.board (Ajustes > Cenas rápidas), que religa a entrada inteira;
     desligada, fica só a aproximação. */
  const [cineS,setCine]=useState<'full'|'short'|null>(()=>{
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return null
    try{localStorage.removeItem('board.cine.off')}catch{/* sem armazenamento */}
    return fxOn('scene.board')?'full':'short'})
  const cine=live?cineS:null
  const cineOff=()=>{setFx('scene.board',false);setCine(null)}
  useEffect(()=>{if(!cine)return;const t=window.setTimeout(()=>setCine(null),cine==='full'?CINE_FULL:CINE_SHORT);return ()=>window.clearTimeout(t)},[cine])
  useEffect(()=>{if(cine!=='full')return;const t0=performance.now(),stop=playCine()
    return ()=>{if(performance.now()-t0<CINE_FULL-200)stop()}},[cine])
  useEffect(()=>{if(live&&current>(b.stage??0))saveBoard(()=>({stage:current}))},[live])
  useEffect(()=>{if(!live||!intro||cine)return;const t=window.setTimeout(()=>setIntro(0),3000);return ()=>window.clearTimeout(t)},[cine,live])

  const [sel,setSel]=useState<string|null>(null)
  const [pop,setPop]=useState<Branch|null>(null)
  const [pick,setPick]=useState<number|string[]|undefined>(undefined)
  const [note,setNote]=useState<{img:string;who:string;t:string}|null>(null)
  const [viewer,setViewer]=useState<{img:string;t:string;d:string}|null>(null)
  const [report,setReport]=useState(false)
  const [confirm,setConfirm]=useState(false)
  const [ending,setEnding]=useState<'A'|'B'|'C'|null>(null)
  const [toast,setToast]=useState('')
  const toastT=useRef(0)
  const say=(t:string)=>{setToast(t);window.clearTimeout(toastT.current);toastT.current=window.setTimeout(()=>setToast(''),2800)}
  useEffect(()=>{setSel(null);setPop(null);setNote(null)},[stage])

  /* galhos */
  const stOf=(br:Branch)=>b.tree[br.id]??{s:br.need.map(()=>null)}
  const setBranch=(br:Branch,fn:(s:{s:(string|null)[];lit?:boolean;a?:number|string[]})=>{s:(string|null)[];lit?:boolean;a?:number|string[]})=>
    saveBoard(x=>({tree:{...x.tree,[br.id]:fn(x.tree[br.id]??{s:br.need.map(()=>null)})}}))
  const missing=(br:Branch)=>br.need.some(gp=>!gp.some(id=>have.includes(id)))
  const done=(i:number)=>TREE[i].branches.every(br=>!!b.tree[br.id]?.lit)
  const placed=new Set(T?T.branches.flatMap(br=>stOf(br).s.filter((x):x is string=>!!x)):[])
  const pool=T?T.pool.filter(id=>have.includes(id)&&!placed.has(id)):[]
  const tapSlot=(br:Branch,j:number)=>{const s=stOf(br);if(s.lit){setNote({img:LEMOS,who:'Lemos',t:br.yes});return}
    if(s.s[j]){setBranch(br,x=>({...x,s:x.s.map((v,k)=>k===j?null:v)}));return}
    if(!sel){say(pool.length?'Escolha uma evidência na pasta, embaixo.':'Não há evidências na pasta. Continue a investigação.');return}
    setBranch(br,x=>({...x,s:x.s.map((v,k)=>k===j?sel:v)}));setSel(null)}
  const tapNode=(br:Branch)=>{const s=stOf(br)
    if(s.lit){setNote({img:LEMOS,who:'Lemos',t:br.yes});return}
    if(s.s.every(Boolean)){setPop(br);setPick(br.kind==='people'?[]:undefined);setNote(null);setSel(null);return}
    say(missing(br)?'Ainda falta material para responder isso.':'Prenda as evidências nos espaços vazios.')}
  const deduce=()=>{if(!pop)return;const s=stOf(pop),ok=rightAnswer(pop,pick)
    if(ok&&fits(pop,s.s)){setBranch(pop,x=>({...x,lit:true,a:pick}));setNote({img:LEMOS,who:'Lemos',t:pop.yes})}
    else{setBranch(pop,x=>({...x,s:x.s.map(()=>null)}));setNote({img:SONIA,who:'Sônia Prado',t:ok?FRACA:pop.no})}
    setPop(null)}

  /* tamanho e câmera: a árvore cabe inteira entre o cabeçalho e a pasta; dá para aproximar com dois dedos */
  const root=useRef<HTMLDivElement>(null)
  const [size,setSize]=useState({w:844,h:390})
  useLayoutEffect(()=>{const el=root.current!;const fit=()=>setSize({w:el.clientWidth||844,h:el.clientHeight||390});fit();const ro=new ResizeObserver(fit);ro.observe(el);return ()=>ro.disconnect()},[])
  const vert=size.h>size.w*1.05
  const area={x:26,y:50,w:size.w-52,h:size.h-50-(stage>0?TRAY_H:10)}
  const fitS=Math.min(1.6,(area.w-16)/W,(area.h-8)/H)
  type Cam={x:number;y:number;s:number}
  const clamp=(c:Cam):Cam=>{const s=Math.max(fitS,Math.min(2.6,c.s)),m=20
    const lim=(p:number,lo:number,hi:number)=>lo>hi?(lo+hi)/2:Math.min(hi,Math.max(lo,p))
    return {s,x:lim(c.x,area.x+area.w-W*s-m,area.x+m),y:lim(c.y,area.y+area.h-H*s-m,area.y+m)}}
  const fitCam=():Cam=>({s:fitS,x:area.x+(area.w-W*fitS)/2,y:area.y+(area.h-H*fitS)/2})
  const [cam,setCam]=useState<Cam>(fitCam)
  const [glide,setGlide]=useState(false)
  useLayoutEffect(()=>{setGlide(false);setCam(fitCam())},[size.w,size.h,stage])
  const ptr=useRef(new Map<number,{x:number;y:number}>())
  const gest=useRef<{moved:boolean;sx:number;sy:number;cam:Cam;d0?:number;m0?:[number,number]}|null>(null)
  const local=(e:{clientX:number;clientY:number})=>{const r=root.current!.getBoundingClientRect()
    // a base gira a tela no celular em pé: converte o toque para as coordenadas do quadro
    const rot=getComputedStyle(document.getElementById('app')??document.body).transform
    if(rot&&rot!=='none'&&Math.abs(r.width-size.w)>2&&Math.abs(r.width-size.h)<2){const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(new DOMMatrix(rot).inverse());return {x:p.x,y:p.y}}
    const k=r.width/size.w||1;return {x:(e.clientX-r.left)/k,y:(e.clientY-r.top)/k}}
  const onDown=(e:React.PointerEvent)=>{const p=local(e);ptr.current.set(e.pointerId,p);const pts=[...ptr.current.values()]
    if(pts.length===1)gest.current={moved:false,sx:p.x,sy:p.y,cam}
    else if(pts.length===2&&gest.current){const [a,c]=pts;gest.current={...gest.current,cam,d0:Math.hypot(a.x-c.x,a.y-c.y),m0:[(a.x+c.x)/2,(a.y+c.y)/2],moved:true};setGlide(false)}}
  const onMove=(e:React.PointerEvent)=>{if(!ptr.current.has(e.pointerId)||!gest.current)return
    const p=local(e);ptr.current.set(e.pointerId,p);const G=gest.current,pts=[...ptr.current.values()]
    if(pts.length>=2&&G.d0&&G.m0){const [a,c]=pts,d=Math.hypot(a.x-c.x,a.y-c.y),m=[(a.x+c.x)/2,(a.y+c.y)/2],s=Math.min(2.6,Math.max(fitS,G.cam.s*d/G.d0))
      const wx=(G.m0[0]-G.cam.x)/G.cam.s,wy=(G.m0[1]-G.cam.y)/G.cam.s;setCam(clamp({s,x:m[0]-wx*s,y:m[1]-wy*s}));return}
    if(!G.moved&&Math.hypot(p.x-G.sx,p.y-G.sy)<7)return
    if(!G.moved){G.moved=true;setGlide(false)}
    setCam(clamp({s:G.cam.s,x:G.cam.x+p.x-G.sx,y:G.cam.y+p.y-G.sy}))}
  const onUp=(e:React.PointerEvent)=>{ptr.current.delete(e.pointerId);if(!ptr.current.size)window.setTimeout(()=>{gest.current=null},0)}
  const onWheel=(e:React.WheelEvent)=>{const p=local(e),s=Math.min(2.6,Math.max(fitS,cam.s*Math.pow(1.0018,-e.deltaY))),wx=(p.x-cam.x)/cam.s,wy=(p.y-cam.y)/cam.s;setGlide(false);setCam(clamp({s,x:p.x-wx*s,y:p.y-wy*s}))}
  const onClickCapture=(e:React.MouseEvent)=>{if(gest.current?.moved){e.stopPropagation();e.preventDefault()}}
  const zoomed=cam.s>fitS*1.04

  /* o quadro nunca rola: um toque num papel perto da borda (foco) faria o navegador arrastar a tela inteira */
  useEffect(()=>{const el=root.current;if(!el)return;const fix=()=>{if(el.scrollTop||el.scrollLeft){el.scrollTop=0;el.scrollLeft=0}}
    el.addEventListener('scroll',fix);return ()=>el.removeEventListener('scroll',fix)},[])
  /* se faltar alguma versão leve, cai no original */
  useEffect(()=>{const el=root.current;if(!el)return
    const h=(e:Event)=>{const i=e.target;if(i instanceof HTMLImageElement&&i.src.includes('/thumbs/')&&!i.dataset.full){i.dataset.full='1';i.src=i.src.replace('/thumbs/','/').replace(/back\.webp$/,'back.png')}}
    el.addEventListener('error',h,true);return ()=>el.removeEventListener('error',h,true)},[])
  // avisa antes da pintura: o primeiro quadro que aparece já é o da entrada (sem tela vazia no meio)
  useLayoutEffect(()=>{if(live)onShown?.()},[live])
  /* cortiça e parede: desenhadas uma vez (de preferência antes, em prewarmBoard) e só copiadas ao abrir */
  const wall=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{let alive=true
    void wallArt().then(src=>{const cv=wall.current;if(alive&&cv)copyCanvas(cv,src)})
    return ()=>{alive=false;if(wall.current)wall.current.width=wall.current.height=1}},[])
  const cork=useRef<HTMLCanvasElement>(null)
  useLayoutEffect(()=>{const cv=cork.current;if(!cv)return;copyCanvas(cv,corkArt());return ()=>{cv.width=cv.height=1}},[])

  /* ações */
  const callIn=(p:string)=>{save(x=>summon(x,p));onSummoned?.(p);say(`${firstName(p)} foi chamad${art(p)} e espera na recepção.`)}
  const run=(st:GuideStepData)=>{const go=st.go
    if(go.kind==='team')onTeam?onTeam(go.memberId):say('Fale com a equipe na sala ao lado.')
    else if(go.kind==='summon')callIn(go.personId)
    else if(go.kind==='depo')onDeposition(go.personId)
    else if(go.kind==='report')openReport()}
  const steps=useMemo(()=>nextSteps(g).filter(s=>s.go.kind!=='clues'&&!s.locked),[g])
  const main=steps[0]

  /* relatório: vem preenchido com o que a árvore do capítulo 5 já fechou */
  const roles=b.roles
  const executors=Object.keys(roles).filter(p=>roles[p]==='exec'),mentor=Object.keys(roles).find(p=>roles[p]==='mentor')
  const canFile=executors.length>0&&!!mentor&&!!b.motive&&b.proofs.length>=3
  const openReport=()=>{
    if(!Object.keys(b.roles).length&&!b.motive){const a=(id:string)=>b.tree[id]?.lit?b.tree[id]?.a:undefined
      const ex=a('c5_dentro'),mt=a('c5_caminho'),mo=a('c5_motivo'),r:BoardSave['roles']={}
      if(Array.isArray(ex))ex.forEach(p=>r[p]='exec');if(Array.isArray(mt)&&mt[0])r[mt[0]]='mentor'
      saveBoard(()=>({roles:r,...(mo===1?{motive:'heranca' as const}:{})}))}
    setReport(true);setSel(null);setPop(null);setNote(null)}
  const cycleRole=(p:string)=>saveBoard(x=>{const n={...x.roles},nx=ROLE_NEXT[n[p]??'none'];if(nx==='mentor')for(const k in n)if(n[k]==='mentor')delete n[k];if(nx)n[p]=nx;else delete n[p];return {roles:n}})
  const protocol=()=>{const r={executors,mentor:mentor??'',motive:b.motive??'',proofs:b.proofs};setEnding(reportEnding(r));save(x=>fileReport(x,r));setConfirm(false);setReport(false)}

  /* a árvore do capítulo */
  const yarn=(key:string,d:string,on:boolean,draw?:boolean)=>on
    ?[<path key={key+'s'} className="cb-sh" d={d} transform="translate(1.5 4)"/>,<path key={key+'a'} className={'cb-y1'+(draw?' draw':'')} d={d} pathLength={1}/>,<path key={key+'b'} className="cb-y2" d={d}/>]
    :[<path key={key} className="ct-dash" d={d}/>]
  const chapterEl=()=>{if(!T)return null
    const lines:React.ReactNode[]=[],els:React.ReactNode[]=[],rootDone=done(stage-1),rootY=H/2
    T.branches.forEach((br,i)=>{const s=stOf(br),cy=ROW[i],lit=!!s.lit,full=s.s.every(Boolean),two=br.need.length>1
      const xs=two?[18,136]:[77]
      s.s.forEach((id,j)=>{const x=xs[j]
        els.push(<button key={br.id+j} className={'ct-slot'+(id?' full':sel&&!lit?' hot':'')+(lit?' lit':'')} style={{left:x,top:cy-32,'--r':(id?ROT[(i*2+j)%ROT.length]:0)+'deg'} as React.CSSProperties}
          onClick={()=>tapSlot(br,j)} aria-label={id?titleOf(id):'Espaço vazio'}>
          {id?<><img src={thumb(clueImg(id))} alt=""/><i>{titleOf(id)}</i></>:<span><b>+</b>{sel&&!lit?'prender aqui':'evidência'}</span>}</button>)})
      if(two)els.push(<i key={br.id+'p'} className={'cb-pin'+(lit?'':' cb-k')} style={{left:131,top:cy,zIndex:6}}/>)
      const sx=two?248:189
      lines.push(...yarn(br.id+'a',`M${sx} ${cy} H${NODE_X}`,lit||full,lit&&fresh.size>0))
      lines.push(...yarn(br.id+'b',`M${NODE_X+238} ${cy} C${NODE_X+278} ${cy} ${ROOT_X-38} ${rootY} ${ROOT_X} ${rootY}`,lit))
      const label=lit?br.short:full?'Toque para deduzir':missing(br)?'Ainda falta material':'Faltam evidências'
      els.push(<button key={br.id+'n'} className={'ct-node '+(lit?'done':full?'ready':'wait')} style={{left:NODE_X,top:cy-33}} onClick={()=>tapNode(br)}>
        <small>{br.q}</small><b>{label}</b></button>)})
    els.push(<div key="root" className={'ct-root'+(rootDone?' done':'')} style={{left:ROOT_X,top:rootY-62}}>
      <small>Capítulo {stage} · conclusão</small><b>{rootDone?T.done[0]:T.q}</b><p>{rootDone?T.done[1]:'Acende quando os três galhos acenderem.'}</p>
      {rootDone&&<span className="ct-stamp">CONFERE</span>}
      {stage===5&&reportReady&&<button className="ct-go" onClick={openReport}>Relatório de acusação ›</button>}</div>)
    return <><svg className="cb-str" style={{width:W,height:H}} viewBox={`0 0 ${W} ${H}`}>{lines}</svg>{els}</>
  }
  /* a árvore do caso inteiro: cada capítulo é um galho da pergunta final */
  const caseEl=()=>{const lines:React.ReactNode[]=[],els:React.ReactNode[]=[],ry=H/2,all=done(4)
    TREE.forEach((t,i)=>{const y=6+i*48,cy=y+21,open=i+1<=current,dn=open&&done(i)
      t.branches.forEach((br,k)=>els.push(<i key={'m'+i+k} className={'ct-mini'+(b.tree[br.id]?.lit?' on':'')} style={{left:150+k*44,top:cy-9}} title={br.q}/>))
      lines.push(...yarn('c'+i,`M${150+3*44-6} ${cy} H${NODE_X}`,dn))
      lines.push(...yarn('r'+i,`M${NODE_X+238} ${cy} C${NODE_X+278} ${cy} ${ROOT_X-38} ${ry} ${ROOT_X} ${ry}`,dn))
      els.push(<button key={'ch'+i} className={'ct-node ct-ch '+(dn?'done':open?'ready':'lock')} style={{left:NODE_X,top:y}} disabled={!open} onClick={()=>setStage(i+1)}>
        <small>Capítulo {i+1}</small><b>{!open?'?':dn?t.done[0]:t.short}</b></button>)})
    els.push(<div key="root" className={'ct-root'+(all?' done':'')} style={{left:ROOT_X,top:ry-62}}><small>A pergunta do caso</small><b>{all?TREE[4].done[0]:'Quem fez o quê?'}</b>
      <p>{all?TREE[4].done[1]:'Cada capítulo fechado acende um galho.'}</p>{all&&<span className="ct-stamp">CONFERE</span>}
      {reportReady&&<button className="ct-go" onClick={openReport}>Relatório de acusação ›</button>}</div>)
    return <><svg className="cb-str" style={{width:W,height:H}} viewBox={`0 0 ${W} ${H}`}>{lines}</svg>{els}</>
  }

  /* o que fazer agora, escrito na aba da pasta */
  const readyBr=T?.branches.find(br=>!stOf(br).lit&&stOf(br).s.every(Boolean))
  const hint=!T?{n:'',t:'',on:false}:sel?{n:'2',t:'Agora toque num espaço vazio da árvore',on:true}
    :readyBr?{n:'3',t:`Toque na ficha “${readyBr.q}” para deduzir`,on:true}
    :done(stage-1)?{n:'✓',t:'Capítulo resolvido',on:false}
    :pool.length?{n:'1',t:'Pasta de evidências · toque numa foto para pegar',on:false}:{n:'',t:'Pasta de evidências',on:false}
  const S=sel?clueOf(sel):null,src=sel?sourcesOf(g,sel,found):[],heard=sel?heardOf(g,sel):[]
  const popPeople=pop?.people?.filter(p=>people.includes(p))??[]
  const cineStyle={'--ox':`${area.x+area.w/2}px`,'--oy':`${area.y+area.h/2}px`} as React.CSSProperties
  return <div ref={root} className={'cb'+(vert?' vert':'')+(zoomed?' zoomed':'')+(cine?' cine cine-'+cine:'')} style={cineStyle}>
    {cine==='full'&&<div className="cb-room" aria-hidden="true"/>}
    <div className="cb-pan" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel} onClickCapture={onClickCapture}>
      <div className={'cb-world'+(glide?' glide':'')} style={{width:W,height:H,transform:`translate(${cam.x}px,${cam.y}px) scale(${cam.s})`}}>
        <canvas ref={wall} className="cb-wall" style={{left:WALL.x,top:WALL.y,width:WALL.w,height:WALL.h}} aria-hidden="true"/>
        <canvas ref={cork} className="cb-cork" style={{width:W,height:H}}/>
        {stage>0?chapterEl():caseEl()}
        {/* a luminária pendurada acima do quadro: o facho cai sobre a cortiça e avança junto com a câmera */}
        {cine==='full'&&<div className="cb-lampw" aria-hidden="true"><i className="cb-cord"/><i className="cb-shade"/><i className="cb-bulb"/><div className="cb-wbeam"><DustMotes/></div></div>}
      </div>
    </div>
    <div className="cb-light"/>
    <div className="cb-hud">
      <nav className="cb-tabs" aria-label="Capítulos do caso">
        <button className={'cb-tab'+(stage===0?' on':'')} onClick={()=>setStage(0)} aria-current={stage===0}>Caso</button>
        {TREE.slice(0,current).map((t,i)=>{const n=i+1
          return <button key={n} className={'cb-tab'+(n===stage?' on':'')+(n===current?' now':'')+(done(i)?' ok':'')} onClick={()=>setStage(n)} aria-current={n===stage}><span className="n">{n}</span>{n===stage?t.short:''}</button>})}
      </nav>
      {zoomed&&<button className="cb-chip" onClick={()=>{setGlide(true);setCam(fitCam())}}>Ver tudo</button>}
      <span className="cb-sp"/>
      {main&&!reportReady&&<button className="cb-chip ct-next" onClick={()=>run(main)}><em>Próximo</em><span>{main.title}</span></button>}
      {reportReady&&<button className="cb-chip cb-gold" onClick={openReport}>Relatório</button>}
      {stage===1&&<button className="cb-chip" onClick={()=>setViewer({img:CROQUI_IMG,t:'Croqui da residência',d:'Planta da casa da Rua das Acácias, com os cômodos da varredura.'})}>Croqui</button>}
      <button className="cb-chip cb-x" aria-label="Fechar o quadro" onClick={onClose}>×</button>
    </div>
    {stage>0&&<div className="ct-tray">
      <small className={hint.on?'on':''}><b>{hint.n}</b>{hint.t}</small>
      <div className="ct-row">{pool.length?pool.map(id=><button key={id} className={'ct-ev'+(sel===id?' sel':'')+(fresh.has(id)?' new':'')} onClick={()=>{setSel(sel===id?null:id);setNote(null)}} aria-pressed={sel===id}>
          <img src={thumb(clueImg(id))} alt=""/><i>{titleOf(id)}</i></button>)
        :<p>{have.some(id=>T?.pool.includes(id))?'Todas as evidências deste capítulo estão na árvore.':'Ainda não há evidências deste capítulo. Continue a investigação.'}</p>}</div>
    </div>}
    {S&&sel&&<div className="ct-info">
      <img src={thumb(clueImg(sel))} alt=""/>
      <div><small>{kindOf(sel)}</small><b>{S.title}</b><p>{S.description}</p>
        {src[0]&&<span>{src[0].text}</span>}{!src[0]&&heard[0]&&<span>{firstName(heard[0].person)}, no depoimento: “{heard[0].phrase}”</span>}</div>
      <div className="ct-act"><button onClick={()=>setViewer({img:clueImg(sel),t:S.title,d:S.description})}>Ver o original</button><button onClick={()=>setSel(null)}>Guardar</button></div>
    </div>}
    {pop&&<div className="ct-pop" role="dialog" aria-label={pop.q}>
      <small>O que essas evidências provam?</small><b>{pop.q}</b>
      {pop.kind==='text'?(pop.opts??[]).map((t,k)=><button key={k} className={'ct-op'+(pick===k?' on':'')} onClick={()=>setPick(k)}>{t}</button>)
        :<div className="ct-faces">{popPeople.map(p=>{const on=Array.isArray(pick)&&pick.includes(p)
          return <button key={p} className={on?'on':''} onClick={()=>setPick(Array.isArray(pick)?(on?pick.filter(x=>x!==p):[...pick,p]):[p])}><img src={thumb(portrait(p))} alt=""/>{firstName(p)}</button>})}</div>}
      <div className="ct-row2"><button onClick={()=>setPop(null)}>Voltar</button><button className="main" disabled={pick==null||(Array.isArray(pick)&&!pick.length)} onClick={deduce}>Confirmar</button></div>
    </div>}
    {note&&<div className="ct-note" role="status"><span><img src={thumb(note.img)} alt=""/>{note.who}</span><p>{note.t}</p><button onClick={()=>setNote(null)}>Ok</button></div>}
    {report&&<div className="ct-rep" role="dialog" aria-label="Relatório de acusação">
      <header><small>DHPP · Homicídios</small><b>Relatório de acusação</b><button className="cb-chip cb-x" aria-label="Fechar o relatório" onClick={()=>setReport(false)}>×</button></header>
      <div className="ct-rl">Papel de cada um · toque para mudar</div>
      <div className="ct-roles">{BOARD_PEOPLE.filter(p=>people.includes(p)).map(p=><button key={p} className={roles[p]?'on '+roles[p]:''} onClick={()=>cycleRole(p)}>
        <img src={thumb(portrait(p))} alt=""/><i>{firstName(p)}</i><u>{roles[p]?ROLE_TXT[roles[p]]:'—'}</u></button>)}</div>
      <div className="ct-rl">Motivo</div>
      <div className="ct-mot">{([['heranca','Herança e namoro'],['roubo','Roubo']] as const).map(([k,t])=><button key={k} className={b.motive===k?'on':''} onClick={()=>saveBoard(()=>({motive:k}))}>{t}</button>)}</div>
      <div className="ct-rl">Provas · escolha pelo menos três</div>
      <div className="ct-proofs">{have.map(id=><button key={id} className={b.proofs.includes(id)?'on':''} onClick={()=>saveBoard(x=>({proofs:x.proofs.includes(id)?x.proofs.filter(y=>y!==id):[...x.proofs,id]}))}>{titleOf(id)}</button>)}</div>
      <button className="ct-go" disabled={!canFile} onClick={()=>setConfirm(true)}>Protocolar relatório</button>
    </div>}
    {toast&&<div className="cb-toast">{toast}</div>}
    {cine==='full'&&<button className="cb-cine" aria-label="Pular" onClick={()=>setCine(null)}>
      <span className="cb-window"/>
      <span className="cb-lemos">{LEMOS_BACK?<img src={LEMOS_BACK} alt=""/>:<LemosSilhouette/>}</span>
      <span className="cb-grain"/>
      <span className="cb-vig"/>
      <i className="cb-bar t"/><i className="cb-bar b"/>
    </button>}
    {cine==='full'&&<button className="cb-cine-off" onClick={cineOff}>Não mostrar mais</button>}
    {intro>0&&!cine&&<button className="cb-chapter" onClick={()=>setIntro(0)}><small>Capítulo {intro}</small><b>{chapters[intro-1].title}</b><p>{chapters[intro-1].summary}</p><em>{TREE[intro-1].q}</em></button>}
    {viewer&&<div className="cb-viewer" onClick={()=>setViewer(null)}><img src={viewer.img} alt=""/><div><b>{viewer.t}</b><p>{viewer.d}</p></div></div>}
    {confirm&&<div className="cb-end"><div className="cb-card"><small>Relatório de acusação</small><h3>Protocolar agora?</h3><p>Depois de protocolado, o relatório encerra sua participação operacional no caso.</p>
      <div className="cb-row"><button onClick={()=>setConfirm(false)}>Revisar</button><button className="cb-gold" onClick={protocol}>Protocolar relatório</button></div></div></div>}
    {ending&&<div className="cb-end"><div className="cb-card"><small>Relatório protocolado</small><h3>{ENDINGS[ending][0]}</h3><p>{ENDINGS[ending][1]}</p><p className="q">{ENDINGS[ending][2]}</p>
      <div className="cb-row"><button onClick={()=>setEnding(null)}>Voltar ao quadro</button><a className="cb-gold" href="/invesphone">Abrir o aparelho</a></div></div></div>}
  </div>
}
