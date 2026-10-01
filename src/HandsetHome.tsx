import { BatteryMedium, ChevronRight, FileSearch, FolderSearch, Lock, MessageCircle, Settings, Smartphone, Users } from 'lucide-react'
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

function Chip({label,icon,badge=0,locked,hint,onClick}:{label:string;icon:React.ReactNode;badge?:number;locked?:boolean;hint:string;onClick?:()=>void}){
  if(locked) return <div className="hm-chip lock" aria-label={`${label} bloqueado. ${hint}`}><Lock/><b>{label}</b></div>
  return <button className="hm-chip" onClick={onClick}>{icon}<b>{label}</b>{badge>0 && <em>{Math.min(badge,99)}</em>}</button>
}

function Scene(){
  return (
    <svg className="hm-house" viewBox="0 0 330 150" aria-hidden="true">
      <rect x="40" y="62" width="150" height="80" fill="#1c2840"/>
      <polygon points="24,66 115,10 206,66" fill="#101828"/>
      <rect x="150" y="26" width="14" height="30" fill="#1c2840"/>
      <rect x="58" y="82" width="36" height="32" fill="#ffcf66"/><path d="M76 82v32M58 98h36" stroke="#101828" strokeWidth="2"/>
      <rect x="132" y="82" width="36" height="32" fill="#ffcf66"/><path d="M150 82v32M132 98h36" stroke="#101828" strokeWidth="2"/>
      <rect x="98" y="98" width="24" height="44" fill="#0a0f18"/>
      <g transform="translate(176 90)">
        <path d="M8 46 Q12 28 40 26 L62 12 Q68 8 78 8 H110 Q120 8 128 16 L142 28 Q160 30 162 46 V54 H8Z" fill="#f2f4f7" stroke="#111" strokeWidth="2.4"/>
        <path d="M8 42 H162 V54 H8Z" fill="#14161c"/>
        <path d="M66 14 H92 V28 H58Z M98 14 H116 L128 28 H98Z" fill="#2a3a5a" stroke="#111" strokeWidth="1.6"/>
        <rect className="hm-sr" x="76" y="2" width="12" height="7" rx="2" fill="#ff2a2a"/>
        <rect className="hm-sb" x="90" y="2" width="12" height="7" rx="2" fill="#2a6bff"/>
        <circle cx="42" cy="54" r="11" fill="#111"/><circle cx="42" cy="54" r="4" fill="#888"/>
        <circle cx="126" cy="54" r="11" fill="#111"/><circle cx="126" cy="54" r="4" fill="#888"/>
      </g>
    </svg>
  )
}

export default function HandsetHome(p:Props){
  const hyp = HYPOTHESIS[Math.min(HYPOTHESIS.length-1,p.chapterNumber-1)]
  const tape = 'NÃO ULTRAPASSE · DHPP · CENA DO CRIME · '.repeat(5)
  return (
    <main className="handset hm">
      <div className="hm-siren r" aria-hidden="true"/><div className="hm-siren b" aria-hidden="true"/>
      <header className="hm-status"><span>04:27</span><b>DHPP · CASO 01</b><span className="hm-bat"><button onClick={()=>p.onOpenApp('settings')} aria-label="Ajustes"><Settings/></button><BatteryMedium/></span></header>

      <section className="hm-scene" aria-hidden="true">
        <Scene/>
        <i className="hm-tape t1"><span>{tape}</span></i>
        <i className="hm-tape t2"><span>{tape}</span></i>
      </section>

      <section className="hm-title" aria-label="Resumo atual do Caso 01">
        <h1>ARQUIVO<span>MORTO</span></h1>
        <p className="hm-flag"><s/>{p.caseStatus.toUpperCase()}</p>
      </section>

      <section className="hm-update" aria-live="polite">
        {p.updateSource==='Sônia'
          ? <img src="/sonia.jpg" alt="" className="hm-av"/>
          : <span className="hm-av hm-av-i">{p.updateSource.slice(0,1)}</span>}
        <div><b>{p.updateSource}</b> · {p.updateText}</div>
      </section>

      <p className="hm-facts">Rua das Acácias, Campo Belo · Ricardo e Helena Valença<br/><span>{hyp}</span></p>

      {p.updateActionLabel&&p.onOpenUpdate&&<button className="hm-go" onClick={p.onOpenUpdate}>{p.updateActionLabel.toUpperCase()}<ChevronRight/></button>}

      <nav className="hm-chips" aria-label="Aplicativos">
        <Chip label="Equipe" icon={<MessageCircle/>} badge={p.teamBadge} hint="" onClick={()=>p.onOpenApp('team')}/>
        <Chip label="Pistas" icon={<FileSearch/>} badge={p.clueBadge} hint="" onClick={()=>p.onOpenApp('clues')}/>
        <Chip label="Pessoas" icon={<Users/>} locked={!p.peopleOpen} hint="Quando houver depoimentos" onClick={()=>p.onOpenApp('interrogate')}/>
        <Chip label="Tel. Helena" icon={<Smartphone/>} locked={!p.helenaOpen} hint="Quando for apreendido" onClick={()=>p.onOpenApp('victim')}/>
        <Chip label="Arquivo" icon={<FolderSearch/>} locked={!p.archiveOpen} hint="Quando houver documentos" onClick={()=>p.onOpenApp('chapters')}/>
      </nav>
    </main>
  )
}
