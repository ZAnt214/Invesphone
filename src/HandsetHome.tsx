import { useEffect, useState } from 'react'
import { BatteryMedium, FileSearch, FolderSearch, Home as HomeIcon, MessageCircle, Smartphone, Users, Settings } from 'lucide-react'
import './handset-home.css'

type HomeTarget = 'team'|'clues'|'interrogate'|'victim'|'chapters'|'settings'

type Props = {
  chapterNumber:number
  taskTitle:string
  chapterTitle:string
  taskNumber:number
  taskCount:number
  teamBadge:number
  clueBadge:number
  onOpenApp:(app:HomeTarget)=>void
  onOpenTask:()=>void
}

const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// impressão digital: elipses concêntricas com o traço interrompido
const dash = (k:number) => Array.from({length:4},(_,j)=>`${4+((k*7+j*11)%17)} ${2+((k*5+j*3)%9)}`).join(' ')
const rings = Array.from({length:13},(_,k)=>({k,cy:150-k*1.2,rx:8+k*7,ry:11+k*9,dash:dash(k)}))

function Fingerprint(){
  const Print = ({cls,withDefs}:{cls:string;withDefs?:boolean}) => (
    <svg className={cls} viewBox="0 0 200 300">
      {withDefs && <defs><clipPath id="hx-fp-clip"><ellipse cx="100" cy="150" rx="96" ry="138"/></clipPath></defs>}
      <g clipPath="url(#hx-fp-clip)">
        {rings.map(r=><ellipse key={r.k} cx="100" cy={r.cy} rx={r.rx} ry={r.ry} strokeDasharray={r.dash}/>)}
      </g>
    </svg>
  )
  return <div className="hx-fp" aria-hidden="true"><Print cls="hx-fp-d" withDefs/><Print cls="hx-fp-b"/><div className="hx-fp-l"/><div className="hx-fp-t"/></div>
}

function TaskCard({chapterNumber,taskTitle,chapterTitle,taskNumber,taskCount,onOpenTask}:Pick<Props,'chapterNumber'|'taskTitle'|'chapterTitle'|'taskNumber'|'taskCount'|'onOpenTask'>){
  const [n,setN] = useState(()=>reduceMotion()?taskTitle.length:0)
  useEffect(()=>{
    if(n>=taskTitle.length) return
    const id = window.setTimeout(()=>setN(n+1),38)
    return ()=>window.clearTimeout(id)
  },[n,taskTitle])
  const done = n>=taskTitle.length
  const pct = Math.round((taskNumber/taskCount)*100)
  return (
    <button className="hx-task" onClick={onOpenTask} aria-label={`Abrir tarefa: ${taskTitle}`}>
      <small>&gt; abrindo caso 001</small>
      <small>CASO 001 · CAP. {chapterNumber}</small>
      <b>
        <span className="hx-ghost">{taskTitle}</span>
        <span className="hx-live" aria-hidden="true">{taskTitle.slice(0,n)}<i className={done?'hx-caret idle':'hx-caret'}/></span>
      </b>
      <span className={done?'hx-sub on':'hx-sub'}>{chapterTitle}</span>
      <div className="hx-pg"><u><s style={{width:`${pct}%`}}/></u><i>{taskNumber} de {taskCount}</i></div>
      <em>ABRIR TAREFA</em>
    </button>
  )
}

function AppTile({label,icon,badge=0,onClick}:{label:string;icon:React.ReactNode;badge?:number;onClick?:()=>void}){
  return <button className="hx-app" onClick={onClick}><i>{icon}{badge>0&&<em>{Math.min(badge,99)}</em>}</i><span>{label}</span></button>
}

export default function HandsetHome(p:Props){
  const [sec,setSec] = useState(0)
  const [gps,setGps] = useState('-23.5505 -46.6333')
  useEffect(()=>{
    let s = 0
    const id = window.setInterval(()=>{
      s = (s+1)%60
      setSec(s)
      if(s%2===0) setGps(`${(-23.5505+(Math.random()-.5)*.0006).toFixed(4)} ${(-46.6333+(Math.random()-.5)*.0006).toFixed(4)}`)
    },1000)
    return ()=>window.clearInterval(id)
  },[])
  return (
    <main className="handset hx">
      <Fingerprint/>
      <header className="hx-status"><span>VIVO<span className="hx-sig"><s/><s/><s/></span></span><b>DHPP</b><BatteryMedium/></header>
      <section className="hx-hd">
        <div className="hx-av">L</div>
        <div className="hx-hm"><small>DHPP · TERMINAL MÓVEL</small><span>LEMOS / UNIDADE 04</span></div>
        <span className="hx-st">EM SERVIÇO</span>
        <h1 className="hx-clk">04:27<span>:{String(sec).padStart(2,'0')}</span></h1>
        <div className="hx-meta"><span>{gps}</span><span>ISO 3200</span><span>BAT 94%</span></div>
      </section>
      <TaskCard key={p.taskTitle} {...p}/>
      <div className="hx-apps">
        <AppTile label="Equipe" icon={<MessageCircle/>} badge={p.teamBadge} onClick={()=>p.onOpenApp('team')}/>
        <AppTile label="Pistas" icon={<FileSearch/>} badge={p.clueBadge} onClick={()=>p.onOpenApp('clues')}/>
        <AppTile label="Interrogar" icon={<Users/>} onClick={()=>p.onOpenApp('interrogate')}/>
        <AppTile label="Tel. Helena" icon={<Smartphone/>} onClick={()=>p.onOpenApp('victim')}/>
        <AppTile label="Arquivo" icon={<FolderSearch/>} onClick={()=>p.onOpenApp('chapters')}/>
        <AppTile label="Ajustes" icon={<Settings/>} onClick={()=>p.onOpenApp('settings')}/>
      </div>
      <nav className="hx-tabs" aria-label="Navegação">
        <button className="on" aria-current="page"><i><HomeIcon/></i>Início</button>
        <button onClick={()=>p.onOpenApp('team')}><i><MessageCircle/></i>Equipe</button>
        <button onClick={()=>p.onOpenApp('clues')}><i><FileSearch/></i>Pistas</button>
        <button onClick={()=>p.onOpenApp('chapters')}><i><FolderSearch/></i>Arquivo</button>
      </nav>
    </main>
  )
}
