import { useEffect, useState } from 'react'
import { BatteryMedium, FileSearch, FolderSearch, Home as HomeIcon, Lock, MessageCircle, Settings, Smartphone, Users } from 'lucide-react'
import { characters } from './characters/characters'
import CharacterFace from './characters/CharacterFace'
import './desk-home.css'

type HomeTarget = 'team'|'clues'|'interrogate'|'victim'|'chapters'|'settings'

type Props = {
  chapterNumber:number
  taskTitle:string
  chapterTitle:string
  taskNumber:number
  taskCount:number
  /** Tipo da tarefa atual: a cena tem o botão "Abrir cena". */
  taskKind:string
  teamBadge:number
  clueBadge:number
  /** Apps que o jogo já liberou (informação gera ação: nada abre sem motivo narrativo). */
  peopleOpen:boolean
  helenaOpen:boolean
  archiveOpen:boolean
  onOpenApp:(app:HomeTarget)=>void
  onOpenTask:()=>void
}

/** O que o Lemos acredita a cada capítulo, sem adiantar a solução. */
const HYPOTHESIS = [
  'Roubo seguido de morte (primeira leitura)',
  'As versões não se encaixam',
  'A janela de horário não fecha',
  'Um valor específico foi levado',
  'Papéis diferentes no mesmo crime'
]

function Obj({label,icon,badge=0,locked,hint,onClick,cls}:{label:string;icon:React.ReactNode;badge?:number;locked?:boolean;hint?:string;onClick?:()=>void;cls:string}){
  if(locked) return (
    <div className={`dk-obj lock ${cls}`} aria-label={`${label} bloqueado`}>
      <span className="dk-obj-art"><Lock/></span>
      <b>{label}</b><small>{hint}</small>
    </div>
  )
  return (
    <button className={`dk-obj ${cls}`} onClick={onClick}>
      <span className="dk-obj-art">{icon}{badge>0 && <em>{Math.min(badge,99)}</em>}</span>
      <b>{label}</b>
    </button>
  )
}

function Polaroids(){
  const ids = ['livia','rafael','cida']
  return <span className="dk-pola">{ids.map((id,i)=><i key={id} style={{'--i':i} as React.CSSProperties}>{characters[id] && <CharacterFace character={characters[id]}/>}</i>)}</span>
}

export default function HandsetHome(p:Props){
  const [sec,setSec] = useState(0)
  useEffect(()=>{
    const id = window.setInterval(()=>setSec(s=>(s+1)%60),1000)
    return ()=>window.clearInterval(id)
  },[])
  const hyp = HYPOTHESIS[Math.min(HYPOTHESIS.length-1,p.chapterNumber-1)]
  const scene = p.taskKind==='scene'
  return (
    <main className="handset dk">
      <header className="dk-status"><span>VIVO<span className="dk-sig"><s/><s/><s/></span></span><b>DHPP</b><BatteryMedium/></header>
      <div className="dk-lamp" aria-hidden="true"/>
      <section className="dk-top">
        <div className="dk-logo"><b>ARQUIVO</b><b>MORTO</b></div>
        <div className="dk-clock"><span>LEMOS · UNID. 04</span><h1>04:27<i>:{String(sec).padStart(2,'0')}</i></h1></div>
        <button className="dk-gear" onClick={()=>p.onOpenApp('settings')} aria-label="Ajustes"><Settings/></button>
      </section>

      <button className="dk-folder" onClick={p.onOpenTask} aria-label={`${scene?'Abrir cena':'Abrir tarefa'}: ${p.taskTitle}`}>
        <span className="dk-tab">CASO 01 · CAP. {p.chapterNumber}</span>
        <small>{p.chapterTitle.toUpperCase()}</small>
        <strong>{p.taskTitle}</strong>
        <dl>
          <div><dt>Onde</dt><dd>Rua das Acácias, Campo Belo</dd></div>
          <div><dt>Quem</dt><dd>Ricardo e Helena Valença (vítimas)</dd></div>
          <div><dt>Hipótese</dt><dd>{hyp}</dd></div>
        </dl>
        <div className="dk-pg"><u><s style={{width:`${Math.round((p.taskNumber/p.taskCount)*100)}%`}}/></u><i>{p.taskNumber} de {p.taskCount}</i></div>
        <em className="dk-stamp">{scene?'ABRIR CENA':'ABRIR TAREFA'}</em>
      </button>

      <div className="dk-desk">
        <Obj cls="o-team" label="Equipe" icon={<MessageCircle/>} badge={p.teamBadge} onClick={()=>p.onOpenApp('team')}/>
        <Obj cls="o-clues" label="Pistas" icon={<FileSearch/>} badge={p.clueBadge} onClick={()=>p.onOpenApp('clues')}/>
        <Obj cls="o-people" label="Pessoas" icon={<Polaroids/>} locked={!p.peopleOpen} hint="Após a cena" onClick={()=>p.onOpenApp('interrogate')}/>
        <Obj cls="o-helena" label="Tel. Helena" icon={<Smartphone/>} locked={!p.helenaOpen} hint="Após as versões" onClick={()=>p.onOpenApp('victim')}/>
        <Obj cls="o-archive" label="Arquivo" icon={<FolderSearch/>} locked={!p.archiveOpen} hint="Após as versões" onClick={()=>p.onOpenApp('chapters')}/>
      </div>

      <nav className="dk-tabs" aria-label="Navegação">
        <button className="on" aria-current="page"><i><HomeIcon/></i>Início</button>
        <button onClick={()=>p.onOpenApp('team')}><i><MessageCircle/></i>Equipe</button>
        <button onClick={()=>p.onOpenApp('clues')}><i><FileSearch/></i>Pistas</button>
        <button onClick={()=>p.archiveOpen?p.onOpenApp('chapters'):undefined} disabled={!p.archiveOpen}><i><FolderSearch/></i>Arquivo</button>
      </nav>
    </main>
  )
}
