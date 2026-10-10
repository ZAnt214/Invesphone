/* Quadro do Caso 01: a cortiça da sala da equipe onde o jogador organiza o caso.
   Segue os capítulos: abre no capítulo atual e mostra só o que ele pede, arrumado para responder a pergunta dele.
   À esquerda, o painel diz onde o jogador está, a pergunta e o próximo passo (com atalho para quem resolve).
   Toda pista mostra de onde veio; o jogador liga pistas a pessoas (o fio fica vermelho quando sustenta uma pergunta
   prevista no depoimento), põe as falas na linha da noite e, no último capítulo, protocola o relatório.
   Nada aqui libera ou trava a progressão. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { advanceTask, readCase, writeCase, type CaseSave } from '../case/caseSave'
import { depoPeople, summon } from '../case/depositions'
import { fileReport, reportEnding } from '../case/report'
import { nextSteps, type GuideStepData } from '../case/nextSteps'
import { chapters } from '../case01'
import { BOARD_PEOPLE, CARDS, CHAPTERS, CONFRONT, boardOf, clueOf, cluesOf, discoveredOf, heardOf, personOf, portrait, sourcesOf, stageOfTask, titleOf,
  type BoardSave, type Section } from './boardData'
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
}
type Sel = {kind:'clue'|'person';id:string}|null
type Pos = {x:number;y:number;r:number;w:number;variant?:string}
const W=562,H=390
const lineX=(tm:number)=>30+tm*502/195             // linha da noite: 22:00 → 01:15
const LINE_Y=120
const CROQUI={x:150,y:100,w:276,h:184}
const firstName=(id:string)=>personOf(id)?.name.split(' ')[0]??id
const art=(id:string)=>['caio','rafael','jorge','teo'].includes(id)?'o':'a'
const ENDINGS={A:['Caso Encerrado','O relatório separa quem entrou na casa de quem abriu o caminho, e as provas sustentam cada parte.','“Bom trabalho. Você não parou no primeiro culpado que apareceu.” · Sônia'],
  B:['Meia Justiça','Os executores estão no relatório. O papel de quem preparou a noite ficou de fora.','“Você fechou quem entrou na casa. Não necessariamente quem colocou os dois lá.” · Sônia'],
  C:['Arquivado','O relatório não sustenta a acusação contra quem foi apontado.','Sem uma cadeia coerente de provas, o caso perde força.']} as const
const ROT=[-2,1.5,-1,2,-1.5,1,-.5,1.2]
/** Arte oficial do Lemos de costas (creative-requests/completed/2026-10-10-lemos-de-costas-quadro.md). */
const LEMOS_BACK:string|null='/characters/lemos/back.png'
const CINE_FULL=2900, CINE_SHORT=900
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

export default function CaseBoard({found,onClose,onDeposition,onTeam,onSummoned}:Props){
  const [g,setG]=useState<CaseSave>(()=>advanceTask(readCase()))
  const b=boardOf(g)
  const save=(fn:(x:CaseSave)=>CaseSave)=>setG(writeCase(fn))
  const saveBoard=(fn:(x:BoardSave)=>Partial<BoardSave>)=>save(x=>({...x,board:{...boardOf(x),...fn(boardOf(x))}}))
  const have=useMemo(()=>cluesOf(g,found),[g,found])
  const has=(id:string)=>have.includes(id)
  const people=discoveredOf(g).filter(p=>BOARD_PEOPLE.includes(p))
  const depo=useMemo(()=>depoPeople(g),[g])
  const reportReady=g.task>=8&&!g.ending

  // o que chegou desde a última visita entra com animação; depois fica marcado como visto
  const [fresh]=useState(()=>new Set(have.filter(id=>!b.seen.includes(id))))
  useEffect(()=>{const t=window.setTimeout(()=>saveBoard(x=>({seen:[...new Set([...x.seen,...have])]})),1600);return ()=>window.clearTimeout(t)},[have.join()])

  /* capítulo: o atual abre sozinho; os anteriores dá para rever */
  const current=stageOfTask(g.task)
  const [stage,setStage]=useState(current)
  const CH=CHAPTERS[stage-1]
  const [intro,setIntro]=useState(()=>current>(b.stage??0)?current:0)
  /* entrada de cinema: a câmera passa por trás do Lemos, que olha o quadro, e chega até a cortiça.
     Inteira na primeira vez da sessão; nas outras, só a aproximação. Um toque pula. */
  const [cine,setCine]=useState<'full'|'short'|null>(()=>{
    if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return null
    let seen=false;try{seen=sessionStorage.getItem('board.cine')==='1';sessionStorage.setItem('board.cine','1')}catch{/* sem armazenamento */}
    return seen?'short':'full'})
  useEffect(()=>{if(!cine)return;const t=window.setTimeout(()=>setCine(null),cine==='full'?CINE_FULL:CINE_SHORT);return ()=>window.clearTimeout(t)},[cine])
  useEffect(()=>{if(current>(b.stage??0))saveBoard(()=>({stage:current}))},[])
  useEffect(()=>{if(!intro||cine)return;const t=window.setTimeout(()=>setIntro(0),3000);return ()=>window.clearTimeout(t)},[cine])

  const [sel,setSel]=useState<Sel>(null)
  const [viewer,setViewer]=useState<{img:string;t:string;d:string}|null>(null)
  const [confirm,setConfirm]=useState(false)
  const [ending,setEnding]=useState<'A'|'B'|'C'|null>(null)
  const [toast,setToast]=useState('')
  const toastT=useRef(0)
  const say=(t:string)=>{setToast(t);window.clearTimeout(toastT.current);toastT.current=window.setTimeout(()=>setToast(''),2800)}

  /* posições: cada capítulo arruma os papéis dele, sem buracos */
  const layout=useMemo(()=>{
    const pos=new Map<string,Pos>(),mugs:{p:string;x:number;y:number}[]=[]
    let tray:string[]=[]
    for(const sec of CH.sections as Section[]){
      if(sec.kind==='scene')for(const id of have){const c=CARDS[id];if(c.zone==='cena')pos.set(id,{x:c.x??0,y:c.y??0,r:c.r??0,w:c.kind==='ph'?92:150})}
      if(sec.kind==='people'){
        const list=BOARD_PEOPLE.filter(p=>people.includes(p))
        list.forEach((p,k)=>{const x=6+k*92;mugs.push({p,x,y:6})
          ;(sec.notes[p]??[]).filter(has).forEach((id,r)=>pos.set(id,{x:x-1,y:136+r*50,r:(k+r)%2?1.2:-1.2,w:86,variant:'col'}))})
      }
      if(sec.kind==='night'){
        for(const id of have){const c=CARDS[id];if(c.zone!=='noite'||c.tm==null)continue
          if(c.reg)pos.set(id,{x:lineX(c.tm)-31,y:6,r:c.tm>150?2:-2,w:62,variant:'sm'})
          else if(b.placed.includes(id))pos.set(id,{x:lineX(c.tm)-60,y:id==='caio_horario'?198:156,r:0,w:120})}
        tray=have.filter(id=>{const c=CARDS[id];return c.zone==='noite'&&c.tm!=null&&!c.reg&&!b.placed.includes(id)})
        tray.forEach((id,i)=>pos.set(id,{x:6+(i%2)*140,y:262+Math.floor(i/2)*58,r:i%2?1.2:-1.2,w:132}))
      }
      if(sec.kind==='grid'){
        const ids=sec.ids.filter(id=>has(id)&&!pos.has(id)),cw=sec.w/sec.cols
        ids.forEach((id,i)=>{const c=CARDS[id],col=i%sec.cols,row=Math.floor(i/sec.cols)
          // embaixo da cortiça os documentos vão em tamanho menor, para caber sem cortar
          const low=sec.y>200,w=c.kind==='ph'?92:c.kind==='doc'?(low?62:78):Math.min(150,cw-8)
          pos.set(id,{x:sec.x+col*cw+(cw-w)/2,y:sec.y+20+row*62,r:ROT[i%ROT.length],w,variant:c.kind==='doc'&&low?'sm':undefined})})
      }
    }
    return {pos,mugs,tray}
  },[stage,have.join(),b.placed.join(),people.join()])
  const shown=(id:string)=>layout.pos.has(id)
  const anchor=(id:string)=>{const p=layout.pos.get(id)!;return [p.x+p.w/2,p.y+3] as const}
  const personAnchor=(p:string)=>{const m=layout.mugs.find(x=>x.p===p);return m?[m.x+42,m.y+3] as const:null}
  const firm=(id:string,p:string)=>(CONFRONT[p]??[]).includes(id)

  /* tamanho e câmera: a cortiça cabe inteira no espaço ao lado do painel; dá para aproximar com dois dedos */
  const root=useRef<HTMLDivElement>(null)
  const [size,setSize]=useState({w:844,h:390})
  useLayoutEffect(()=>{const el=root.current!;const fit=()=>setSize({w:el.clientWidth||844,h:el.clientHeight||390});fit();const ro=new ResizeObserver(fit);ro.observe(el);return ()=>ro.disconnect()},[])
  const vert=size.h>size.w*1.05
  const panelW=vert?0:Math.min(300,Math.max(236,size.w*.34))
  const area=vert?{x:0,y:44,w:size.w,h:size.h*.5-44}:{x:panelW+12,y:44,w:size.w-panelW-12,h:size.h-44}
  const fitS=Math.min((area.w-10)/W,(area.h-8)/H)
  type Cam={x:number;y:number;s:number}
  const clamp=(c:Cam):Cam=>{const s=Math.max(fitS,Math.min(2.4,c.s)),m=20
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
    if(pts.length>=2&&G.d0&&G.m0){const [a,c]=pts,d=Math.hypot(a.x-c.x,a.y-c.y),m=[(a.x+c.x)/2,(a.y+c.y)/2],s=Math.min(2.4,Math.max(fitS,G.cam.s*d/G.d0))
      const wx=(G.m0[0]-G.cam.x)/G.cam.s,wy=(G.m0[1]-G.cam.y)/G.cam.s;setCam(clamp({s,x:m[0]-wx*s,y:m[1]-wy*s}));return}
    if(!G.moved&&Math.hypot(p.x-G.sx,p.y-G.sy)<7)return
    if(!G.moved){G.moved=true;setGlide(false)}
    setCam(clamp({s:G.cam.s,x:G.cam.x+p.x-G.sx,y:G.cam.y+p.y-G.sy}))}
  const onUp=(e:React.PointerEvent)=>{ptr.current.delete(e.pointerId);if(!ptr.current.size)window.setTimeout(()=>{gest.current=null},0)}
  const onWheel=(e:React.WheelEvent)=>{const p=local(e),s=Math.min(2.4,Math.max(fitS,cam.s*Math.pow(1.0018,-e.deltaY))),wx=(p.x-cam.x)/cam.s,wy=(p.y-cam.y)/cam.s;setGlide(false);setCam(clamp({s,x:p.x-wx*s,y:p.y-wy*s}))}
  const onClickCapture=(e:React.MouseEvent)=>{if(gest.current?.moved){e.stopPropagation();e.preventDefault()}}
  const zoomed=cam.s>fitS*1.04

  /* cortiça desenhada uma vez */
  const cork=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const cv=cork.current;if(!cv)return
    const K=Math.min(2,(window.devicePixelRatio||1));cv.width=W*K;cv.height=H*K
    const c=cv.getContext('2d');if(!c)return
    const w=cv.width,h=cv.height;let s=7;const R=()=>(s=s*16807%2147483647)/2147483647
    c.fillStyle='#8a5c33';c.fillRect(0,0,w,h)
    for(let i=0;i<90;i++){const x=R()*w,y=R()*h,r=(40+R()*120)*K,gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.5?'rgba(52,30,12,.22)':'rgba(196,146,92,.16)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2)}
    const pal=['rgba(70,40,16,.55)','rgba(110,70,36,.5)','rgba(176,128,78,.5)','rgba(205,160,104,.42)','rgba(48,26,10,.5)','rgba(150,104,60,.55)']
    for(let i=0,n=w*h/6;i<n;i++){c.fillStyle=pal[(R()*6)|0];const z=(.5+Math.pow(R(),2.2)*2.2)*K;c.fillRect(R()*w,R()*h,z,z*(.6+R()*.8))}
    for(let i=0;i<50;i++){const x=R()*w,y=R()*h;c.fillStyle='rgba(20,10,4,.7)';c.beginPath();c.arc(x,y,1.2*K,0,7);c.fill()}
    const gr=c.createRadialGradient(w/2,h*.3,0,w/2,h*.4,w*.7);gr.addColorStop(0,'rgba(255,236,200,.18)');gr.addColorStop(.6,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.4)');c.fillStyle=gr;c.fillRect(0,0,w,h)
    return ()=>{cv.width=cv.height=1}
  },[])

  /* ações */
  const openClue=(id:string)=>setSel({kind:'clue',id})
  const openPerson=(id:string)=>setSel({kind:'person',id})
  const toggleLink=(id:string,p:string)=>saveBoard(x=>{const l=x.links[id]??[];return {links:{...x.links,[id]:l.includes(p)?l.filter(y=>y!==p):[...l,p]}}})
  const callIn=(p:string)=>{save(x=>summon(x,p));onSummoned?.(p);say(`${firstName(p)} foi chamad${art(p)} e espera na recepção.`)}
  const roles=b.roles
  const executors=Object.keys(roles).filter(p=>roles[p]==='exec'),mentor=Object.keys(roles).find(p=>roles[p]==='mentor')
  const setRole=(p:string,r:'exec'|'mentor'|'fora')=>saveBoard(x=>{const n={...x.roles};if(n[p]===r)delete n[p];else{if(r==='mentor')for(const k in n)if(n[k]==='mentor')delete n[k];n[p]=r}return {roles:n}})
  const canFile=executors.length>0&&!!mentor&&!!b.motive&&b.proofs.length>=3
  const protocol=()=>{const r={executors,mentor:mentor??'',motive:b.motive??'',proofs:b.proofs};setEnding(reportEnding(r));save(x=>fileReport(x,r));setConfirm(false);setSel(null)}
  const run=(st:GuideStepData)=>{const go=st.go
    if(go.kind==='team')onTeam?onTeam(go.memberId):say('Fale com a equipe na sala ao lado.')
    else if(go.kind==='summon')callIn(go.personId)
    else if(go.kind==='depo')onDeposition(go.personId)
    else if(go.kind==='report'){setStage(5);setSel(null)}}
  const steps=useMemo(()=>nextSteps(g).filter(s=>s.go.kind!=='clues'),[g])

  /* fios e alfinetes */
  const strings:React.ReactNode[]=[],pins:React.ReactNode[]=[]
  const yarn=(key:string,d:string,draw?:boolean)=>[<path key={key+'s'} className="cb-sh" d={d} transform="translate(1.5 4)"/>,<path key={key+'a'} className={'cb-y1'+(draw?' draw':'')} d={d} pathLength={1}/>,<path key={key+'b'} className="cb-y2" d={d}/>]
  const curve=(a:readonly number[],c:readonly number[],sag?:number)=>{const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2+(sag??Math.hypot(c[0]-a[0],c[1]-a[1])*.09+4);return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`}
  const hasNight=CH.sections.some(s=>s.kind==='night'),hasScene=CH.sections.some(s=>s.kind==='scene')
  for(const id of have){if(!shown(id))continue
    const c=CARDS[id],a=anchor(id)
    if(hasScene&&c.zone==='cena'&&c.kind==='ph'){const t=[CROQUI.x+(c.u??0)*CROQUI.w,CROQUI.y+(c.v??0)*CROQUI.h] as const
      strings.push(...yarn(id,curve(a,t),fresh.has(id)),<circle key={id+'r'} className="cb-ring" cx={t[0]} cy={t[1]} r={6.5}/>);pins.push(<i key={id+'pt'} className="cb-pin" style={{left:t[0],top:t[1]}}/>)}
    if(hasNight&&c.reg&&c.tm!=null){const x=lineX(c.tm),y0=96,y1=LINE_Y+1;strings.push(...yarn(id+'l',`M${x} ${y0} L${x} ${y1}`));pins.push(<i key={id+'pl'} className="cb-pin cb-k" style={{left:x,top:y1}}/>)}
    pins.push(<i key={id+'p'} className={'cb-pin'+(c.kind==='doc'?' y':'')} style={{left:a[0],top:a[1]}}/>)
  }
  layout.mugs.forEach(m=>pins.push(<i key={'pp'+m.p} className="cb-pin y" style={{left:m.x+42,top:m.y+3}}/>))
  Object.entries(b.links).forEach(([id,ps])=>{if(!shown(id))return;ps.forEach(p=>{const pa=personAnchor(p);if(!pa||!people.includes(p))return
    const d=curve(anchor(id),pa,24);if(firm(id,p))strings.push(...yarn('L'+id+p,d));else strings.push(<path key={'L'+id+p} className="cb-pen" d={d}/>)})})

  /* papéis */
  const cardEl=(id:string)=>{
    const c=CARDS[id],p=layout.pos.get(id)!,cls=['cb-c','k-'+c.kind,sel?.kind==='clue'&&sel.id===id?'sel':'',fresh.has(id)?'new':'',p.variant==='col'?'cb-col':'',p.variant==='sm'?'sm':'',id==='confissao_teo'?'yl':''].join(' ')
    const st={left:p.x,top:p.y,'--r':p.r+'deg',width:c.kind==='nt'?p.w:undefined} as React.CSSProperties
    const lk=(b.links[id]??[]).filter(x=>people.includes(x)&&!layout.mugs.some(m=>m.p===x))
    const extra=<>{stage===5&&b.proofs.includes(id)&&<span className="cb-proof"/>}{lk.length>0&&<span className="cb-lk">{lk.map(x=><img key={x} className={firm(id,x)?'firm':''} src={portrait(x)} alt={firstName(x)}/>)}</span>}</>
    if(c.kind!=='nt')return <button key={id} className={cls} style={st} onClick={()=>openClue(id)}><img src={c.img} alt=""/><i>{titleOf(id)}</i>{extra}</button>
    const heard=heardOf(g,id)[0],col=p.variant==='col'
    return <button key={id} className={cls+(heard&&!col?'':' blank')} style={st} onClick={()=>openClue(id)}>
      {heard&&!col&&<img src={portrait(heard.person)} alt=""/>}<b>{titleOf(id)}</b>
      <small>{col?(c.img?'documento':'depoimento'):heard?firstName(heard.person)+' · depoimento':clueOf(id)?.category==='depoimento'?'depoimento':'equipe'}</small>{extra}</button>
  }
  const sectionEl=(sec:Section,i:number)=>{
    if(sec.kind==='scene')return <div key={i}><div className="cb-croqui" style={{left:CROQUI.x,top:CROQUI.y,width:CROQUI.w,height:CROQUI.h}}><img src="/evidence/case01/new/croqui_residencia.jpg" alt="Croqui da residência"/></div>
      <span className="cb-tape" style={{left:136,top:96,transform:'rotate(-38deg)'}}/><span className="cb-tape" style={{left:398,top:94,transform:'rotate(36deg)'}}/>
      {!have.some(id=>CARDS[id].zone==='cena'&&CARDS[id].kind==='ph')&&<p className="cb-empty" style={{left:170,top:300}}>As fotos da casa entram aqui.</p>}</div>
    if(sec.kind==='people')return <div key={i}>{layout.mugs.map((m,k)=>{const p=m.p,st=g.interviewed.includes(p)?'OUVID'+art(p).toUpperCase():(g.summonedPeople??[]).includes(p)?'CHAMAD'+art(p).toUpperCase():''
      const role=stage===5&&roles[p]&&roles[p]!=='fora'?<span className="cb-stamp ink">{roles[p]==='exec'?'EXECUTOR':'MENTOR'}</span>:null,d=depo.find(x=>x.id===p)
      return <button key={p} className={'cb-c k-mug'+(sel?.kind==='person'&&sel.id===p?' sel':'')} style={{left:m.x,top:m.y,'--r':ROT[k]+'deg'} as React.CSSProperties} onClick={()=>openPerson(p)}>
        <img src={portrait(p)} alt=""/><i>{firstName(p)}</i><u>{personOf(p)?.role.split(' · ')[0]}</u>{st&&<span className="cb-stamp">{st}</span>}{role}{(d?.state==='retomar'||d?.state==='ouvir')&&<em className="cb-new">{d.state==='ouvir'?'esperando':'novo'}</em>}</button>})}</div>
    if(sec.kind==='night'){const both=has('log_alarme')&&has('nota_motel')
      return <div key={i}><div className="cb-tl" style={{top:LINE_Y}}/>{[0,30,60,90,120,150,180].map(m=><span key={m} className="cb-tick" style={{left:lineX(m),top:LINE_Y+8}}>{String(Math.floor((22*60+m)/60)%24).padStart(2,'0')}:{String(m%60).padStart(2,'0')}</span>)}
        {both&&<div className="cb-gap" style={{left:lineX(112),width:lineX(176)-lineX(112),top:LINE_Y+24}}><span>1h04</span></div>}
        {b.placed.includes('caio_horario')&&has('nota_motel')&&<div className="cb-claim" style={{left:lineX(60),width:lineX(176)-lineX(60),top:LINE_Y+70}}><span>Caio: “já estava no motel”</span></div>}
        {!has('log_alarme')&&!has('nota_motel')&&<div className="cb-slot" style={{left:150,top:18}}><b>Nenhum horário registrado ainda</b><span>Registros oficiais da noite entram aqui, presos na hora certa.</span></div>}
        {layout.tray.length>0&&<div className="cb-tray" style={{left:6,top:244}}>Falas sobre horário: toque e ponha na linha</div>}</div>}
    const any=sec.ids.some(has)
    return <div key={i}><div className="cb-sec" style={{left:sec.x,top:sec.y,width:sec.w}}>{sec.title}</div>
      {!any&&<p className="cb-empty" style={{left:sec.x+14,top:sec.y+26}}>Nada preso aqui ainda.</p>}</div>
  }

  /* painel: onde estou, a pergunta e o próximo passo; ou o detalhe do papel tocado */
  let detail:React.ReactNode=null
  if(sel?.kind==='clue'){
    const id=sel.id,c=CARDS[id],cl=clueOf(id),heard=heardOf(g,id),src=sourcesOf(g,id,found),ln=(b.links[id]??[]).filter(p=>people.includes(p)),last=ln[ln.length-1]
    const img=c.img??src.find(s=>s.img)?.img,lastState=last?depo.find(x=>x.id===last)?.state:undefined
    detail=<>
      <header>{img?<img src={img} alt=""/>:heard[0]?<img src={portrait(heard[0].person)} alt=""/>:null}<div><small className="cb-k">{c.kind==='ph'?'Foto da perícia':c.kind==='doc'||c.img?'Documento':'Depoimento'}</small><h3>{cl?.title}</h3></div></header>
      <p>{cl?.description}</p>
      {src.map((s,i)=><div key={i} className="cb-src">{s.text}</div>)}
      {heard.map((s,i)=><div key={'h'+i} className="cb-src">{firstName(s.person)}, no depoimento: <q>{s.phrase}</q></div>)}
      <div className="cb-act">
        {img&&<button onClick={()=>setViewer({img,t:cl?.title??'',d:cl?.description??''})}>Ver o original</button>}
        {c.zone==='noite'&&c.tm!=null&&!c.reg&&!b.placed.includes(id)&&(has('log_alarme')
          ?<button className="main" onClick={()=>{saveBoard(x=>({placed:[...x.placed,id]}));if(stage!==3)setStage(3)}}>Pôr na linha da noite</button>
          :<button disabled>A linha precisa de um horário registrado</button>)}
        {stage===5&&reportReady&&<button className={b.proofs.includes(id)?'on':''} onClick={()=>saveBoard(x=>({proofs:x.proofs.includes(id)?x.proofs.filter(y=>y!==id):[...x.proofs,id]}))}>{b.proofs.includes(id)?'✓ Prova no relatório':'Usar como prova no relatório'}</button>}
      </div>
      <div className="cb-dl">Isso aponta para…</div>
      <div className="cb-faces">{people.map(p=><button key={p} className={ln.includes(p)?(firm(id,p)?'on':'pencil'):''} onClick={()=>toggleLink(id,p)}><img src={portrait(p)} alt=""/>{firstName(p)}</button>)}</div>
      {last&&(firm(id,last)
        ?<><div className="cb-fb firm"><b>Dá para confrontar</b>Isso sustenta uma pergunta no depoimento de {firstName(last)}.</div>
          <div className="cb-act">{lastState==='chamar'?<button className="main" onClick={()=>callIn(last)}>Chamar {firstName(last)} para depor</button>
            :lastState==='sem_provas'?<button disabled>{firstName(last)} só pode ser chamad{art(last)} com provas contra ele</button>
            :<button className="main" onClick={()=>onDeposition(last)}>Levar ao depoimento de {firstName(last)}</button>}</div></>
        :<div className="cb-fb"><b>Só hipótese</b>Por enquanto, nada no depoimento de {firstName(last)} se apoia nisso.</div>)}</>
  }
  if(sel?.kind==='person'){
    const p=sel.id,P=personOf(p),d=depo.find(x=>x.id===p)
    const st=g.interviewed.includes(p)?'Depoimento concluído':(g.summonedPeople??[]).includes(p)?`Chamad${art(p)} para depor`:`Identificad${art(p)} pela investigação`
    const said=have.filter(id=>heardOf(g,id).some(s=>s.person===p)),linked=have.filter(id=>(b.links[id]??[]).includes(p))
    const list=(arr:string[])=>arr.length?arr.map(id=><button key={id} onClick={()=>openClue(id)}>{titleOf(id)}</button>):<span className="cb-src">Nada ainda.</span>
    const label={chamar:`Chamar ${firstName(p)} para depor`,sem_provas:'Só com provas contra ele',ouvir:`Ouvir ${firstName(p)}`,retomar:`Retomar ${firstName(p)} · ${d?.pending} nova${(d?.pending??0)>1?'s':''}`,registrado:'Rever depoimento'}
    detail=<>
      <header><img src={portrait(p)} alt=""/><div><small className="cb-k">{st}</small><h3>{P?.name}</h3><span className="cb-src plain">{P?.role}</span></div></header>
      {stage===5&&reportReady&&<><div className="cb-dl">No relatório, {firstName(p)} é…</div><div className="cb-roles">{([['exec','Executor'],['mentor','Mentor'],['fora','Fora']] as const).map(([k,t])=><button key={k} className={roles[p]===k?'on':''} onClick={()=>setRole(p,k)}>{t}</button>)}</div></>}
      {d&&<div className="cb-act"><button className={d.state==='ouvir'||d.state==='retomar'||d.state==='chamar'?'main':''} disabled={d.state==='sem_provas'} onClick={()=>d.state==='chamar'?callIn(p):onDeposition(p)}>{label[d.state]}</button></div>}
      <div className="cb-dl">O que {firstName(p)} disse e foi marcado</div><div className="cb-act">{list(said)}</div>
      <div className="cb-dl">Fios que você ligou a {firstName(p)}</div><div className="cb-act">{list(linked)}</div></>
  }
  const [main,...more]=steps
  const panel=<aside className="cb-panel" aria-live="polite">
    {detail?<><button className="cb-back" onClick={()=>setSel(null)}>‹ Capítulo {stage}</button><div className="cb-body">{detail}</div></>
    :<div className="cb-body">
      <div className="cb-chap"><small>Capítulo {stage}{stage!==current?' · revendo':''}</small><b>{chapters[stage-1].title}</b><p>{CH.q}</p></div>
      {stage===5&&reportReady?<div className="cb-report">
        <div className="cb-dl">Relatório de acusação</div>
        <p className="cb-hint">Toque nas fotos para marcar executores e mentor, e nos papéis para escolher as provas.</p>
        <div className="cb-rrow"><b>Executores</b><span>{executors.map(firstName).join(', ')||'—'}</span></div>
        <div className="cb-rrow"><b>Mentor</b><span>{mentor?firstName(mentor):'—'}</span></div>
        <div className="cb-rrow"><b>Motivo</b></div>
        <div className="cb-roles">{([['heranca','Herança e namoro'],['roubo','Roubo']] as const).map(([k,t])=><button key={k} className={b.motive===k?'on':''} onClick={()=>saveBoard(()=>({motive:k}))}>{t}</button>)}</div>
        <div className="cb-rrow"><b>Provas</b><span>{b.proofs.map(titleOf).join(', ')||'—'}</span></div>
        <div className="cb-act"><button className="main" disabled={!canFile} onClick={()=>setConfirm(true)}>Protocolar relatório</button></div>
      </div>
      :stage!==current?<div className="cb-step"><small>Você está revendo</small><p>O caso já está no capítulo {current}.</p><div className="cb-act"><button className="main" onClick={()=>setStage(current)}>Ir para o capítulo {current}</button></div></div>
      :main?<>
        <div className={'cb-step'+(main.locked?' locked':'')}><small>Próximo passo</small><b>{main.title}</b><p>{main.text}</p>{main.cta&&!main.locked&&<div className="cb-act"><button className="main" onClick={()=>run(main)}>{main.cta}</button></div>}</div>
        {more.filter(s=>!s.locked).slice(0,2).map(s=><button key={s.id} className="cb-more" onClick={()=>run(s)}><span>{s.title}</span><i>›</i></button>)}
      </>:<div className="cb-step"><small>Próximo passo</small><p>Releia o que está no quadro e ligue as pistas às pessoas.</p></div>}
      {!!g.ending&&<div className="cb-step"><small>Relatório protocolado</small><p>O caso saiu das suas mãos.</p></div>}
    </div>}
  </aside>

  const cineStyle={'--ox':`${area.x+area.w/2}px`,'--oy':`${area.y+area.h/2}px`} as React.CSSProperties
  return <div ref={root} className={'cb'+(vert?' vert':'')+(zoomed?' zoomed':'')+(cine?' cine cine-'+cine:'')} style={cineStyle}>
    {cine==='full'&&<div className="cb-room" aria-hidden="true"/>}
    <div className="cb-pan" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel} onClickCapture={onClickCapture}>
      <div className={'cb-world'+(glide?' glide':'')} style={{width:W,height:H,transform:`translate(${cam.x}px,${cam.y}px) scale(${cam.s})`}}>
        <canvas ref={cork} className="cb-cork" style={{width:W,height:H}}/>
        {CH.sections.map(sectionEl)}
        {[...layout.pos.keys()].map(cardEl)}
        <svg className="cb-str" style={{width:W,height:H}} viewBox={`0 0 ${W} ${H}`}>{strings}</svg>
        <div className="cb-pins">{pins}</div>
      </div>
    </div>
    <div className="cb-light"/>
    {panel}
    <div className="cb-hud" style={{left:vert?10:area.x}}>
      <nav className="cb-tabs" aria-label="Capítulos do caso">{CHAPTERS.slice(0,current).map((S,i)=>{const n=i+1
        return <button key={n} className={'cb-tab'+(n===stage?' on':'')+(n===current?' now':'')} onClick={()=>{setSel(null);setStage(n)}} aria-current={n===stage}><span className="n">{n}</span>{n===stage?S.short:''}</button>})}</nav>
      {zoomed&&<button className="cb-chip" onClick={()=>{setGlide(true);setCam(fitCam())}}>Ver tudo</button>}
      <span className="cb-sp"/>
      <button className="cb-chip cb-x" aria-label="Fechar o quadro" onClick={onClose}>×</button>
    </div>
    {toast&&<div className="cb-toast">{toast}</div>}
    {cine==='full'&&<button className="cb-cine" aria-label="Pular" onClick={()=>setCine(null)}>
      <span className="cb-lamp"/>
      <span className="cb-lemos">{LEMOS_BACK?<img src={LEMOS_BACK} alt=""/>:<LemosSilhouette/>}</span>
      <i className="cb-bar t"/><i className="cb-bar b"/>
    </button>}
    {intro>0&&!cine&&<button className="cb-chapter" onClick={()=>setIntro(0)}><small>Capítulo {intro}</small><b>{chapters[intro-1].title}</b><p>{chapters[intro-1].summary}</p><em>{CHAPTERS[intro-1].q}</em></button>}
    {viewer&&<div className="cb-viewer" onClick={()=>setViewer(null)}><img src={viewer.img} alt=""/><div><b>{viewer.t}</b><p>{viewer.d}</p></div></div>}
    {confirm&&<div className="cb-end"><div className="cb-card"><small>Relatório de acusação</small><h3>Protocolar agora?</h3><p>Depois de protocolado, o relatório encerra sua participação operacional no caso.</p>
      <div className="cb-row"><button onClick={()=>setConfirm(false)}>Revisar</button><button className="cb-gold" onClick={protocol}>Protocolar relatório</button></div></div></div>}
    {ending&&<div className="cb-end"><div className="cb-card"><small>Relatório protocolado</small><h3>{ENDINGS[ending][0]}</h3><p>{ENDINGS[ending][1]}</p><p className="q">{ENDINGS[ending][2]}</p>
      <div className="cb-row"><button onClick={()=>setEnding(null)}>Voltar ao quadro</button><a className="cb-gold" href="/invesphone">Abrir o aparelho</a></div></div></div>}
  </div>
}
