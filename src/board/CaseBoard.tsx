/* Quadro do Caso 01: a cortiça da sala da equipe onde o jogador organiza o caso.
   Cada área é uma pergunta e só aparece quando o caso chega nela. Toda pista mostra de onde veio, o jogador liga pistas
   a pessoas (o fio fica vermelho quando sustenta um confronto previsto no depoimento), põe as falas na linha da noite
   e, depois da confissão, protocola o relatório pelo próprio quadro. Nada aqui libera ou trava a progressão. */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { readCase, writeCase, type CaseSave } from '../case/caseSave'
import { depoPeople, summon } from '../case/depositions'
import { fileReport, reportEnding } from '../case/report'
import { BOARD_PEOPLE, CARDS, CONFRONT, VICTIMS, WORLD_H, WORLD_W, ZONES, ZONE_H, ZONE_W, boardOf, clueOf, cluesOf, discoveredOf, heardOf,
  personOf, portrait, sourcesOf, titleOf, type BoardSave, type ZoneId } from './boardData'
import './case-board.css'

type Props = {
  /** fotos que a varredura da casa trouxe (ids das pistas da cena) */
  found:string[]
  onClose:()=>void
  /** fecha o quadro e abre o depoimento na sala da base */
  onDeposition:(id:string)=>void
  /** alguém foi chamado: a base põe a pessoa na recepção */
  onSummoned?:(id:string)=>void
}
type Sel = {kind:'clue'|'person';id:string}|null
const ZIDS=Object.keys(ZONES) as ZoneId[]
const START=22*60, SPAN=195                       // linha da noite: 22:00 → 01:15
const lineX=(tm:number)=>30+tm*502/SPAN
const CROQUI={x:150,y:100,w:276,h:184}
const firstName=(id:string)=>personOf(id)?.name.split(' ')[0]??id
const art=(id:string)=>['caio','rafael','jorge','teo'].includes(id)?'o':'a'
const ENDINGS={A:['Caso Encerrado','O relatório separa quem entrou na casa de quem abriu o caminho, e as provas sustentam cada parte.','“Bom trabalho. Você não parou no primeiro culpado que apareceu.” · Sônia'],
  B:['Meia Justiça','Os executores estão no relatório. O papel de quem preparou a noite ficou de fora.','“Você fechou quem entrou na casa. Não necessariamente quem colocou os dois lá.” · Sônia'],
  C:['Arquivado','O relatório não sustenta a acusação contra quem foi apontado.','Sem uma cadeia coerente de provas, o caso perde força.']} as const

export default function CaseBoard({found,onClose,onDeposition,onSummoned}:Props){
  const [g,setG]=useState<CaseSave>(()=>readCase())
  const b=boardOf(g)
  const save=(fn:(x:CaseSave)=>CaseSave)=>setG(writeCase(fn))
  const saveBoard=(fn:(x:BoardSave)=>Partial<BoardSave>)=>save(x=>({...x,board:{...boardOf(x),...fn(boardOf(x))}}))
  const have=useMemo(()=>cluesOf(g,found),[g,found])
  const has=(id:string)=>have.includes(id)
  const people=discoveredOf(g).filter(p=>BOARD_PEOPLE.includes(p))
  const depo=useMemo(()=>depoPeople(g),[g])
  const zoneOpen=(z:ZoneId)=>z==='cena'||z==='pessoas'||have.some(id=>CARDS[id].zone===z)
  const reportReady=g.task>=8&&!g.ending

  // o que chegou desde a última visita entra com animação; depois fica marcado como visto
  const [fresh]=useState(()=>new Set(have.filter(id=>!b.seen.includes(id))))
  useEffect(()=>{const t=window.setTimeout(()=>saveBoard(x=>({seen:[...new Set([...x.seen,...have])]})),1600);return ()=>window.clearTimeout(t)},[have.join()])

  const [sel,setSel]=useState<Sel>(null)
  const [reportOn,setReportOn]=useState(false)
  const [viewer,setViewer]=useState<{img:string;t:string;d:string}|null>(null)
  const [confirm,setConfirm]=useState(false)
  const [ending,setEnding]=useState<'A'|'B'|'C'|null>(null)
  const [toast,setToast]=useState('')
  const say=(t:string)=>{setToast(t);window.clearTimeout((say as {t?:number}).t);(say as {t?:number}).t=window.setTimeout(()=>setToast(''),2800)}

  /* tamanho da tela e câmera */
  const root=useRef<HTMLDivElement>(null)
  const [size,setSize]=useState({w:844,h:390})
  useLayoutEffect(()=>{const el=root.current!;const fit=()=>setSize({w:el.clientWidth||844,h:el.clientHeight||390});fit();const ro=new ResizeObserver(fit);ro.observe(el);return ()=>ro.disconnect()},[])
  const vert=size.h>size.w
  const drawerOpen=!!sel
  /* câmera livre: arrastar move, pinça e roda aproximam; as abas levam direto a cada área */
  const HUD=46
  const openZones=ZIDS.filter(zoneOpen)
  const box=useMemo(()=>({x0:Math.min(...openZones.map(z=>ZONES[z].x)),y0:Math.min(...openZones.map(z=>ZONES[z].y)),
    x1:Math.max(...openZones.map(z=>ZONES[z].x+ZONE_W)),y1:Math.max(...openZones.map(z=>ZONES[z].y+ZONE_H))}),[openZones.join()])
  // espaço livre para o quadro (fora do topo e da ficha aberta)
  const view=(withDrawer:boolean)=>{const {w,h}=size;return {x:0,y:HUD,w:withDrawer&&!vert?w-312:w,h:(withDrawer&&vert?h*.46:h)-HUD}}
  const fitS=()=>{const v=view(false);return Math.min((v.w-12)/(box.x1-box.x0),(v.h-6)/(box.y1-box.y0))}
  const minS=()=>fitS()*.92, maxS=2.4
  type Cam={x:number;y:number;s:number}
  const clamp=(c:Cam,withDrawer=drawerOpen):Cam=>{
    const v=view(withDrawer),s=Math.max(minS(),Math.min(maxS,c.s)),m=40
    const lim=(p:number,lo:number,hi:number)=>lo>hi?(lo+hi)/2:Math.min(hi,Math.max(lo,p))
    return {s,x:lim(c.x,v.x+v.w-box.x1*s-m,v.x-box.x0*s+m),y:lim(c.y,v.y+v.h-box.y1*s-m,v.y-box.y0*s+m)}
  }
  /** câmera que mostra um ponto do mundo no meio do espaço livre, numa escala */
  const centerOn=(wx:number,wy:number,s:number,withDrawer=drawerOpen)=>{const v=view(withDrawer);return clamp({s,x:v.x+v.w/2-wx*s,y:v.y+v.h/2-wy*s},withDrawer)}
  const overview=()=>centerOn((box.x0+box.x1)/2,(box.y0+box.y1)/2,fitS(),false)
  const zoneScale=(withDrawer=drawerOpen)=>{const v=view(withDrawer);return Math.min(maxS,Math.max(.9,Math.min(size.w/ZONE_W,(size.h-HUD+20)/ZONE_H)),v.w/(ZONE_W*.62))}
  const [cam,setCam]=useState<Cam>({x:0,y:0,s:.5})
  const [glide,setGlide]=useState(true)
  const go=(c:Cam)=>{setGlide(true);setCam(c)}
  const goZone=(z:ZoneId|null)=>{if(!z){setSel(null);go(overview());return}const Z=ZONES[z];go(centerOn(Z.x+ZONE_W/2,Z.y+ZONE_H/2,zoneScale()))}
  // abre na visão geral; quando a tela muda de tamanho, a câmera se ajusta sem pular
  const first=useRef(true)
  useLayoutEffect(()=>{if(first.current){first.current=false;setGlide(false);setCam(overview());requestAnimationFrame(()=>setGlide(true));return}setCam(c=>clamp(c))},[size.w,size.h,box])
  /** área no meio da tela, para a aba acesa */
  const v0=view(drawerOpen),mid=[(v0.x+v0.w/2-cam.x)/cam.s,(v0.y+v0.h/2-cam.y)/cam.s]
  const far=cam.s<fitS()*1.25
  const here=far?null:openZones.find(z=>mid[0]>=ZONES[z].x&&mid[0]<ZONES[z].x+ZONE_W+1&&mid[1]>=ZONES[z].y&&mid[1]<ZONES[z].y+ZONE_H+1)??null
  // na primeira visita, diz como andar pelo quadro
  useEffect(()=>{if(!b.seen.length)window.setTimeout(()=>say('Arraste para andar pelo quadro e use as abas para ir direto a cada área. Toque numa pista para ver de onde ela veio.'),900)},[])
  /* gestos */
  const ptr=useRef(new Map<number,{x:number;y:number}>())
  const gest=useRef<{moved:boolean;sx:number;sy:number;cam:Cam;d0?:number;m0?:[number,number]}|null>(null)
  const local=(e:{clientX:number;clientY:number})=>{const r=root.current!.getBoundingClientRect(),k=r.width/size.w||1
    // a base gira a tela no celular em pé: converte o toque para as coordenadas do quadro
    const rot=getComputedStyle(document.getElementById('app')??document.body).transform
    if(rot&&rot!=='none'&&Math.abs(r.width-size.w)>2&&Math.abs(r.width-size.h)<2){const m=new DOMMatrix(rot);const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return {x:p.x,y:p.y}}
    return {x:(e.clientX-r.left)/k,y:(e.clientY-r.top)/k}}
  const onDown=(e:React.PointerEvent)=>{
    const p=local(e);ptr.current.set(e.pointerId,p)
    const pts=[...ptr.current.values()]
    if(pts.length===1)gest.current={moved:false,sx:p.x,sy:p.y,cam}
    else if(pts.length===2&&gest.current){const [a,c]=pts;gest.current={...gest.current,cam,d0:Math.hypot(a.x-c.x,a.y-c.y),m0:[(a.x+c.x)/2,(a.y+c.y)/2],moved:true};setGlide(false)}
  }
  const onMove=(e:React.PointerEvent)=>{
    if(!ptr.current.has(e.pointerId)||!gest.current)return
    const p=local(e);ptr.current.set(e.pointerId,p);const G=gest.current,pts=[...ptr.current.values()]
    if(pts.length>=2&&G.d0&&G.m0){const [a,c]=pts,d=Math.hypot(a.x-c.x,a.y-c.y),m=[(a.x+c.x)/2,(a.y+c.y)/2]
      const s=Math.max(minS(),Math.min(maxS,G.cam.s*d/G.d0)),wx=(G.m0[0]-G.cam.x)/G.cam.s,wy=(G.m0[1]-G.cam.y)/G.cam.s
      setCam(clamp({s,x:m[0]-wx*s,y:m[1]-wy*s}));return}
    if(!G.moved&&Math.hypot(p.x-G.sx,p.y-G.sy)<7)return
    if(!G.moved){G.moved=true;setGlide(false)}
    setCam(clamp({s:G.cam.s,x:G.cam.x+p.x-G.sx,y:G.cam.y+p.y-G.sy}))
  }
  const onUp=(e:React.PointerEvent)=>{ptr.current.delete(e.pointerId);if(ptr.current.size===0){window.setTimeout(()=>{gest.current=null},0);setGlide(true)}}
  const onWheel=(e:React.WheelEvent)=>{const p=local(e),s=Math.max(minS(),Math.min(maxS,cam.s*Math.pow(1.0018,-e.deltaY))),wx=(p.x-cam.x)/cam.s,wy=(p.y-cam.y)/cam.s;setGlide(false);setCam(clamp({s,x:p.x-wx*s,y:p.y-wy*s}))}
  // um arrasto não vira toque no papel que estava embaixo do dedo
  const onClickCapture=(e:React.MouseEvent)=>{if(gest.current?.moved){e.stopPropagation();e.preventDefault()}}
  /** traz um papel para perto, ao lado da ficha */
  const focusOn=(wx:number,wy:number)=>go(centerOn(wx,wy,Math.max(cam.s,zoneScale(true)),true))

  /* cortiça desenhada uma vez */
  const cork=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const cv=cork.current;if(!cv)return
    const K=Math.min(1.5,(window.devicePixelRatio||1)*.75);cv.width=WORLD_W*K;cv.height=WORLD_H*K
    const c=cv.getContext('2d');if(!c)return
    const w=cv.width,h=cv.height;let s=7;const R=()=>(s=s*16807%2147483647)/2147483647
    c.fillStyle='#8a5c33';c.fillRect(0,0,w,h)
    for(let i=0;i<260;i++){const x=R()*w,y=R()*h,r=(40+R()*120)*K,gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,R()<.5?'rgba(52,30,12,.22)':'rgba(196,146,92,.16)');gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(x-r,y-r,r*2,r*2)}
    const pal=['rgba(70,40,16,.55)','rgba(110,70,36,.5)','rgba(176,128,78,.5)','rgba(205,160,104,.42)','rgba(48,26,10,.5)','rgba(150,104,60,.55)']
    for(let i=0,n=w*h/6;i<n;i++){c.fillStyle=pal[(R()*6)|0];const z=(.5+Math.pow(R(),2.2)*2.2)*K;c.fillRect(R()*w,R()*h,z,z*(.6+R()*.8))}
    for(let i=0;i<160;i++){const x=R()*w,y=R()*h;c.fillStyle='rgba(20,10,4,.7)';c.beginPath();c.arc(x,y,1.2*K,0,7);c.fill()}
    const gr=c.createRadialGradient(w/2,h*.3,0,w/2,h*.4,w*.62);gr.addColorStop(0,'rgba(255,236,200,.18)');gr.addColorStop(.6,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.45)');c.fillStyle=gr;c.fillRect(0,0,w,h)
    c.fillStyle='rgba(20,14,8,.35)';[563,1126].forEach(x=>c.fillRect(x*K-1,0,2*K,h));c.fillRect(0,390*K-1,w,2*K)
    return ()=>{cv.width=cv.height=1}
  },[])

  /* posição de cada papel (algumas dependem do estado: falas postas na linha, notas embaixo das pessoas) */
  const pos=(id:string)=>{
    const c=CARDS[id]
    if(c.col){const i=BOARD_PEOPLE.indexOf(c.col);return {x:10+i*91-1,y:256+(c.row??0)*50,r:(i+(c.row??0))%2?1.2:-1.2,w:86}}
    if(c.zone==='noite'&&c.tm!=null){
      if(c.reg)return {x:lineX(c.tm)-31,y:62,r:c.tm>150?2:-2,w:62}
      if(b.placed.includes(id))return {x:lineX(c.tm)-60,y:id==='caio_horario'?288:236,r:0,w:120}
      const tray=have.filter(x=>CARDS[x].zone==='noite'&&!CARDS[x].reg&&!b.placed.includes(x))
      const i=tray.indexOf(id);return {x:14+i*132,y:332,r:i%2?1.5:-1.5,w:120}
    }
    return {x:c.x??0,y:c.y??0,r:c.r??0,w:c.kind==='ph'?92:c.kind==='doc'?78:150}
  }
  const anchor=(id:string)=>{const c=CARDS[id],Z=ZONES[c.zone],p=pos(id);return [Z.x+p.x+p.w/2,Z.y+p.y+3] as const}
  const personAnchor=(p:string)=>{const i=BOARD_PEOPLE.indexOf(p),Z=ZONES.pessoas;return [Z.x+10+i*91+42,Z.y+137] as const}
  const firm=(id:string,p:string)=>(CONFRONT[p]??[]).includes(id)

  /* ações */
  const openClue=(id:string)=>{const a=anchor(id);setSel({kind:'clue',id});focusOn(a[0],a[1]+40)}
  const openPerson=(id:string)=>{const a=personAnchor(id);setSel({kind:'person',id});focusOn(a[0],a[1]+60)}
  const toggleLink=(id:string,p:string)=>saveBoard(x=>{const l=x.links[id]??[];return {links:{...x.links,[id]:l.includes(p)?l.filter(y=>y!==p):[...l,p]}}})
  const callIn=(p:string)=>{save(x=>summon(x,p));onSummoned?.(p);say(`${firstName(p)} foi chamad${art(p)} e espera na recepção.`)}
  const roles=b.roles
  const executors=Object.keys(roles).filter(p=>roles[p]==='exec'),mentor=Object.keys(roles).find(p=>roles[p]==='mentor')
  const setRole=(p:string,r:'exec'|'mentor'|'fora')=>saveBoard(x=>{const n={...x.roles};if(n[p]===r)delete n[p];else{if(r==='mentor')for(const k in n)if(n[k]==='mentor')delete n[k];n[p]=r}return {roles:n}})
  const canFile=executors.length>0&&!!mentor&&!!b.motive&&b.proofs.length>=3
  const protocol=()=>{const r={executors,mentor:mentor??'',motive:b.motive??'',proofs:b.proofs};setEnding(reportEnding(r));save(x=>fileReport(x,r));setConfirm(false);setReportOn(false);setSel(null)}

  /* fios */
  const strings:React.ReactNode[]=[],pins:React.ReactNode[]=[]
  const yarn=(key:string,d:string,draw?:boolean)=>[<path key={key+'s'} className="cb-sh" d={d} transform="translate(1.5 4)"/>,<path key={key+'a'} className={'cb-y1'+(draw?' draw':'')} d={d} pathLength={1}/>,<path key={key+'b'} className="cb-y2" d={d}/>]
  const curve=(a:readonly number[],c:readonly number[],sag?:number)=>{const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2+(sag??Math.hypot(c[0]-a[0],c[1]-a[1])*.09+4);return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${c[0].toFixed(1)} ${c[1].toFixed(1)}`}
  have.forEach(id=>{
    const c=CARDS[id],a=anchor(id)
    if(c.zone==='cena'&&c.kind==='ph'){const t=[CROQUI.x+(c.u??0)*CROQUI.w,CROQUI.y+(c.v??0)*CROQUI.h] as const
      strings.push(...yarn(id,curve(a,t),fresh.has(id)),<circle key={id+'r'} className="cb-ring" cx={t[0]} cy={t[1]} r={6.5}/>);pins.push(<i key={id+'pt'} className="cb-pin" style={{left:t[0],top:t[1]}}/>)}
    if(c.reg&&c.tm!=null){const x=ZONES.noite.x+lineX(c.tm),y0=ZONES.noite.y+160,y1=ZONES.noite.y+181;strings.push(...yarn(id+'l',`M${x} ${y0} L${x} ${y1}`));pins.push(<i key={id+'pl'} className="cb-pin cb-k" style={{left:x,top:y1}}/>)}
    pins.push(<i key={id+'p'} className={'cb-pin'+(c.kind==='doc'?' y':'')} style={{left:a[0],top:a[1]}}/>)
  })
  people.forEach(p=>{const a=personAnchor(p);pins.push(<i key={'pp'+p} className="cb-pin y" style={{left:a[0],top:a[1]}}/>)})
  Object.entries(b.links).forEach(([id,ps])=>{if(!has(id))return;ps.forEach(p=>{if(!people.includes(p))return;const d=curve(anchor(id),personAnchor(p),24)
    if(firm(id,p))strings.push(...yarn('L'+id+p,d));else strings.push(<path key={'L'+id+p} className="cb-pen" d={d}/>)})})

  /* papéis de cada área */
  const cardEl=(id:string)=>{
    const c=CARDS[id],p=pos(id),cls=['cb-c','k-'+c.kind,sel?.kind==='clue'&&sel.id===id?'sel':'',fresh.has(id)?'new':'',c.col?'cb-col':'',c.zone==='noite'&&c.kind==='doc'?'sm':'',id==='confissao_teo'?'yl':''].join(' ')
    const st={left:p.x,top:p.y,'--r':p.r+'deg',width:c.kind==='nt'?p.w:undefined} as React.CSSProperties
    const proof=reportOn&&b.proofs.includes(id)?<span className="cb-proof"/>:null
    if(c.kind!=='nt')return <button key={id} className={cls} style={st} onClick={()=>openClue(id)}><img src={c.img} alt=""/><i>{titleOf(id)}</i>{proof}</button>
    const heard=heardOf(g,id)[0]
    return <button key={id} className={cls+(heard&&!c.col?'':' blank')} style={st} onClick={()=>openClue(id)}>
      {heard&&!c.col&&<img src={portrait(heard.person)} alt=""/>}<b>{titleOf(id)}</b>
      <small>{c.col?(c.img?'documento':'depoimento'):heard?firstName(heard.person)+' · depoimento':clueOf(id)?.category==='depoimento'?'depoimento':'equipe'}</small>{proof}</button>
  }
  const zoneEl=(z:ZoneId)=>{
    const Z=ZONES[z],ids=have.filter(id=>CARDS[id].zone===z)
    return <div key={z} className={'cb-zone'+(zoneOpen(z)?'':' off')} style={{left:Z.x,top:Z.y}}>
      {zoneOpen(z)&&<>
        <div className="cb-q"><small>{Z.label}</small><b>{Z.q}</b></div>
        {z==='cena'&&<><div className="cb-croqui" style={{left:CROQUI.x,top:CROQUI.y,width:CROQUI.w,height:CROQUI.h}}><img src="/evidence/case01/new/croqui_residencia.jpg" alt="Croqui da residência"/></div>
          <span className="cb-tape" style={{left:136,top:96,transform:'rotate(-38deg)'}}/><span className="cb-tape" style={{left:398,top:94,transform:'rotate(36deg)'}}/></>}
        {z==='pessoas'&&<>
          {VICTIMS.map(([k,n],i)=><div key={k} className="cb-c k-mug vic" style={{left:318+i*90,top:36+i*6,'--r':(i?-3:3)+'deg'} as React.CSSProperties}><img src={portrait(k)} alt=""/><i>{n}</i><span className="cb-stamp">VÍTIMA</span></div>)}
          {BOARD_PEOPLE.map((p,i)=>{if(!people.includes(p))return null
            const d=depo.find(x=>x.id===p),st=g.interviewed.includes(p)?'OUVID'+art(p).toUpperCase():(g.summonedPeople??[]).includes(p)?'CHAMAD'+art(p).toUpperCase():''
            const role=reportOn&&roles[p]&&roles[p]!=='fora'?<span className="cb-stamp ink">{roles[p]==='exec'?'EXECUTOR':'MENTOR'}</span>:null
            return <button key={p} className={'cb-c k-mug'+(sel?.kind==='person'&&sel.id===p?' sel':'')} style={{left:10+i*91,top:134,'--r':[-2,1.5,-1,2,-1.5,1][i]+'deg'} as React.CSSProperties} onClick={()=>openPerson(p)}>
              <img src={portrait(p)} alt=""/><i>{firstName(p)}</i><u>{personOf(p)?.role.split(' · ')[0]}</u>{st&&<span className="cb-stamp">{st}</span>}{role}{d?.state==='retomar'&&<em className="cb-new">novo</em>}</button>})}
        </>}
        {z==='noite'&&<>
          <div className="cb-tl"/>{[0,30,60,90,120,150,180].map(m=><span key={m} className="cb-tick" style={{left:lineX(m)}}>{String(Math.floor((START+m)/60)%24).padStart(2,'0')}:{String(m%60).padStart(2,'0')}</span>)}
          {has('log_alarme')&&has('nota_motel')&&<div className="cb-gap" style={{left:lineX(112),width:lineX(176)-lineX(112)}}><span>1h04</span></div>}
          {b.placed.includes('caio_horario')&&has('nota_motel')&&<div className="cb-claim" style={{left:lineX(60),width:lineX(176)-lineX(60),top:270}}><span>Caio: “já estava no motel”</span></div>}
          {ids.some(id=>!CARDS[id].reg&&!b.placed.includes(id))&&<div className="cb-tray">Falas sobre horário · toque e ponha na linha</div>}
        </>}
        {ids.map(cardEl)}
        {z==='motivo'&&reportOn&&([['heranca','Herança + proibição do namoro','O que estava em jogo para quem ficava.',150,262,-1.5],['roubo','Roubo oportunista','Alguém de fora atrás de valores.',372,264,1.5]] as const).map(([k,t,s,x,y,r])=>
          <button key={k} className={'cb-opt'+(b.motive===k?' on':'')} style={{left:x,top:y,'--r':r+'deg'} as React.CSSProperties} onClick={()=>saveBoard(()=>({motive:k}))}><b>{t}</b><small>{s}</small></button>)}
      </>}
    </div>
  }

  /* gaveta */
  let drawer:React.ReactNode=null
  if(sel?.kind==='clue'){
    const id=sel.id,c=CARDS[id],cl=clueOf(id),heard=heardOf(g,id),src=sourcesOf(g,id,found),ln=(b.links[id]??[]).filter(p=>people.includes(p)),last=ln[ln.length-1]
    const img=c.img??src.find(s=>s.img)?.img
    const lastState=last?depo.find(x=>x.id===last)?.state:undefined
    drawer=<>
      <header>{img?<img src={img} alt=""/>:heard[0]?<img src={portrait(heard[0].person)} alt=""/>:null}<div><small className="cb-k">{c.kind==='ph'?'Foto da perícia':c.kind==='doc'||c.img?'Documento':'Depoimento'}</small><h3>{cl?.title}</h3></div><button className="cb-cl" aria-label="Fechar" onClick={()=>setSel(null)}>×</button></header>
      <div className="cb-body">
        <p>{cl?.description}</p>
        {src.map((s,i)=><div key={i} className="cb-src">{s.text}</div>)}
        {heard.map((s,i)=><div key={'h'+i} className="cb-src">{firstName(s.person)}, no depoimento: <q>{s.phrase}</q></div>)}
        <div className="cb-act">
          {img&&<button onClick={()=>setViewer({img,t:cl?.title??'',d:cl?.description??''})}>Ver o original</button>}
          {c.zone==='noite'&&!c.reg&&!b.placed.includes(id)&&(has('log_alarme')
            ?<button className="main" onClick={()=>saveBoard(x=>({placed:[...x.placed,id]}))}>Pôr na linha da noite</button>
            :<button disabled>A linha precisa de um horário registrado</button>)}
          {reportOn&&<button className={b.proofs.includes(id)?'on':''} onClick={()=>saveBoard(x=>({proofs:x.proofs.includes(id)?x.proofs.filter(y=>y!==id):[...x.proofs,id]}))}>{b.proofs.includes(id)?'✓ Prova no relatório':'Usar como prova no relatório'}</button>}
        </div>
        <div className="cb-dl">Isso aponta para…</div>
        <div className="cb-faces">{people.map(p=><button key={p} className={ln.includes(p)?(firm(id,p)?'on':'pencil'):''} onClick={()=>toggleLink(id,p)}><img src={portrait(p)} alt=""/>{firstName(p)}</button>)}</div>
        {last&&(firm(id,last)
          ?<><div className="cb-fb firm"><b>Dá para confrontar</b>Isso sustenta uma pergunta no depoimento de {firstName(last)}.</div>
            <div className="cb-act">{lastState==='chamar'?<button className="main" onClick={()=>callIn(last)}>Chamar {firstName(last)} para depor</button>
              :lastState==='sem_provas'?<button disabled>{firstName(last)} só pode ser chamad{art(last)} com provas contra ele</button>
              :<button className="main" onClick={()=>onDeposition(last)}>Levar ao depoimento de {firstName(last)}</button>}</div></>
          :<div className="cb-fb"><b>Só hipótese</b>Por enquanto, nada no depoimento de {firstName(last)} se apoia nisso.</div>)}
      </div></>
  }
  if(sel?.kind==='person'){
    const p=sel.id,P=personOf(p),d=depo.find(x=>x.id===p)
    const st=g.interviewed.includes(p)?'Depoimento concluído':(g.summonedPeople??[]).includes(p)?`Chamad${art(p)} para depor`:`Identificad${art(p)} pela investigação`
    const said=have.filter(id=>heardOf(g,id).some(s=>s.person===p))
    const linked=have.filter(id=>(b.links[id]??[]).includes(p))
    const list=(arr:string[])=>arr.length?arr.map(id=><button key={id} onClick={()=>openClue(id)}>{titleOf(id)}</button>):<span className="cb-src">Nada ainda.</span>
    const label={chamar:`Chamar ${firstName(p)} para depor`,sem_provas:'Só com provas contra ele',ouvir:`Ouvir ${firstName(p)}`,retomar:`Retomar ${firstName(p)} · ${d?.pending} nova${(d?.pending??0)>1?'s':''}`,registrado:'Rever depoimento'}
    drawer=<>
      <header><img src={portrait(p)} alt=""/><div><small className="cb-k">{st}</small><h3>{P?.name}</h3><span className="cb-src plain">{P?.role}</span></div><button className="cb-cl" aria-label="Fechar" onClick={()=>setSel(null)}>×</button></header>
      <div className="cb-body">
        {reportOn&&<><div className="cb-dl">No relatório, {firstName(p)} é…</div><div className="cb-roles">{([['exec','Executor'],['mentor','Mentor'],['fora','Fora']] as const).map(([k,t])=><button key={k} className={roles[p]===k?'on':''} onClick={()=>setRole(p,k)}>{t}</button>)}</div></>}
        {d&&<div className="cb-act"><button className={d.state==='ouvir'||d.state==='retomar'||d.state==='chamar'?'main':''} disabled={d.state==='sem_provas'}
          onClick={()=>d.state==='chamar'?callIn(p):onDeposition(p)}>{label[d.state]}</button></div>}
        <div className="cb-dl">O que {firstName(p)} disse e foi marcado</div><div className="cb-act">{list(said)}</div>
        <div className="cb-dl">Fios que você ligou a {firstName(p)}</div><div className="cb-act">{list(linked)}</div>
      </div></>
  }

  const tabs=([null,...openZones] as (ZoneId|null)[])
  return <div ref={root} className={'cb'+(vert?' vert':'')+(drawerOpen?' drawer':'')}>
    <div className="cb-pan" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel} onClickCapture={onClickCapture}>
    <div className={'cb-world'+(glide?' glide':'')} style={{transform:`translate(${cam.x}px,${cam.y}px) scale(${cam.s})`}}>
      <canvas ref={cork} className="cb-cork"/>
      {ZIDS.map(zoneEl)}
      <svg className="cb-str" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}>{strings}</svg>
      <div className="cb-pins">{pins}</div>
    </div></div>
    <div className="cb-light"/>
    <div className="cb-hud">
      <nav className="cb-tabs" aria-label="Áreas do quadro">{tabs.map(z=>{const novo=z&&have.some(id=>fresh.has(id)&&CARDS[id].zone===z)
        return <button key={z??'all'} className={'cb-tab'+((z===null?far:here===z)?' on':'')} onClick={()=>goZone(z)}>{z?ZONES[z].tab:'Tudo'}{novo&&<i aria-label="novidade"/>}</button>})}</nav>
      <span className="cb-sp"/>
      {reportReady&&<button className="cb-chip cb-gold" onClick={()=>{const on=!reportOn;setReportOn(on);if(on){setSel(null);goZone('pessoas');say('Marque executores e mentor nas fotos, escolha o motivo e circule pelo menos 3 provas.')}}}>{reportOn?'Sair do relatório':'Montar relatório'}</button>}
      {!!g.ending&&<span className="cb-chip">Relatório protocolado</span>}
      <button className="cb-chip cb-x" aria-label="Fechar o quadro" onClick={onClose}>×</button>
    </div>
    <aside className={'cb-drawer'+(drawer?' on':'')} aria-live="polite">{drawer}</aside>
    {reportOn&&<div className="cb-rep"><div><b>Executores</b>{executors.map(firstName).join(', ')||'—'} <b>Mentor</b>{mentor?firstName(mentor):'—'} <b>Motivo</b>{b.motive==='heranca'?'herança e namoro':b.motive==='roubo'?'roubo':'—'} <b>Provas</b>{b.proofs.length}</div>
      <button disabled={!canFile} onClick={()=>setConfirm(true)}>Protocolar</button></div>}
    {toast&&<div className="cb-toast">{toast}</div>}
    {viewer&&<div className="cb-viewer" onClick={()=>setViewer(null)}><img src={viewer.img} alt=""/><div><b>{viewer.t}</b><p>{viewer.d}</p></div></div>}
    {confirm&&<div className="cb-end"><div className="cb-card"><small>Relatório de acusação</small><h3>Protocolar agora?</h3><p>Depois de protocolado, o relatório encerra sua participação operacional no caso.</p>
      <div className="cb-row"><button onClick={()=>setConfirm(false)}>Revisar</button><button className="cb-gold" onClick={protocol}>Protocolar relatório</button></div></div></div>}
    {ending&&<div className="cb-end"><div className="cb-card"><small>Relatório protocolado</small><h3>{ENDINGS[ending][0]}</h3><p>{ENDINGS[ending][1]}</p><p className="q">{ENDINGS[ending][2]}</p>
      <div className="cb-row"><button onClick={()=>setEnding(null)}>Voltar ao quadro</button><a className="cb-gold" href="/invesphone">Abrir o aparelho</a></div></div></div>}
  </div>
}
