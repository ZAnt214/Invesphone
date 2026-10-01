import { useEffect, useState } from 'react'
import { BatteryMedium, ChevronRight, FileSearch, FolderSearch, Home as HomeIcon, Lock, MessageCircle, Settings, Smartphone } from 'lucide-react'
import { characters } from './characters/characters'
import CharacterFace from './characters/CharacterFace'
import './desk-home.css'

type HomeTarget = 'team'|'clues'|'interrogate'|'victim'|'chapters'|'settings'

type Props = {
  chapterNumber:number
  chapterTitle:string
  caseStatus:string
  updateSource:string
  updateText:string
  updateActionLabel?:string
  teamBadge:number
  clueBadge:number
  peopleOpen:boolean
  helenaOpen:boolean
  archiveOpen:boolean
  onOpenApp:(app:HomeTarget)=>void
  onOpenUpdate?:()=>void
}

/** O que Lemos considera mais plausível neste ponto, sem transformar a investigação em checklist. */
const HYPOTHESIS = [
  'Roubo seguido de morte — leitura inicial',
  'A cena pode ter sido montada',
  'O álibi não cobre toda a madrugada',
  'Uma quantia específica foi procurada',
  'É preciso separar execução de planejamento'
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
  return (
    <main className="handset dk">
      <header className="dk-status"><span>VIVO<span className="dk-sig"><s/><s/><s/></span></span><b>DHPP</b><BatteryMedium/></header>
      <div className="dk-lamp" aria-hidden="true"/>
      <section className="dk-top">
        <div className="dk-logo"><b>ARQUIVO</b><b>MORTO</b></div>
        <div className="dk-clock"><span>LEMOS · UNID. 04</span><h1>04:27<i>:{String(sec).padStart(2,'0')}</i></h1></div>
        <button className="dk-gear" onClick={()=>p.onOpenApp('settings')} aria-label="Ajustes"><Settings/></button>
      </section>

      <section className="dk-folder" aria-label="Resumo atual do Caso 01">
        <span className="dk-tab">CASO 01 · CAP. {p.chapterNumber}</span>
        <small>{p.chapterTitle.toUpperCase()}</small>
        <strong>{p.caseStatus}</strong>
        <dl>
          <div><dt>Local</dt><dd>Rua das Acácias, Campo Belo</dd></div>
          <div><dt>Vítimas</dt><dd>Ricardo e Helena Valença</dd></div>
          <div><dt>Leitura</dt><dd>{hyp}</dd></div>
        </dl>
      </section>

      <section className="dk-update" aria-live="polite">
        <div>
          <small>ÚLTIMA ATUALIZAÇÃO · {p.updateSource.toUpperCase()}</small>
          <p>{p.updateText}</p>
        </div>
        {p.updateActionLabel&&p.onOpenUpdate&&<button onClick={p.onOpenUpdate}>{p.updateActionLabel}<ChevronRight/></button>}
      </section>

      <div className="dk-desk">
        <Obj cls="o-team" label="Equipe" icon={<MessageCircle/>} badge={p.teamBadge} onClick={()=>p.onOpenApp('team')}/>
        <Obj cls="o-clues" label="Pistas" icon={<FileSearch/>} badge={p.clueBadge} onClick={()=>p.onOpenApp('clues')}/>
        <Obj cls="o-people" label="Pessoas" icon={<Polaroids/>} locked={!p.peopleOpen} hint="Quando houver depoimentos" onClick={()=>p.onOpenApp('interrogate')}/>
        <Obj cls="o-helena" label="Tel. Helena" icon={<Smartphone/>} locked={!p.helenaOpen} hint="Quando for apreendido" onClick={()=>p.onOpenApp('victim')}/>
        <Obj cls="o-archive" label="Arquivo" icon={<FolderSearch/>} locked={!p.archiveOpen} hint="Quando houver documentos" onClick={()=>p.onOpenApp('chapters')}/>
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
