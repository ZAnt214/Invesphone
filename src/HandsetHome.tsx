import { ChevronRight, FileSearch, FolderSearch, Lock, MessageCircle, Settings, Smartphone, Users } from 'lucide-react'
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

type Node = {key:HomeTarget;label:string;icon:React.ReactNode;badge:number;locked:boolean;hint:string}

/** Atalho posicionado exatamente sobre o círculo tracejado: o ângulo e o raio vêm só de variáveis CSS. */
function Orb({n,angle,onOpen}:{n:Node;angle:number;onOpen:()=>void}){
  const style = {'--a':`${angle}deg`} as React.CSSProperties
  const inner = <>
    <span className="hm-orb-btn">{n.locked?<Lock/>:n.icon}{!n.locked&&n.badge>0&&<em>{Math.min(n.badge,99)}</em>}</span>
    <b>{n.label}</b>
  </>
  return n.locked
    ? <div className="hm-orb lock" style={style} aria-label={`${n.label} bloqueado. ${n.hint}`}>{inner}</div>
    : <button className="hm-orb" style={style} onClick={onOpen}>{inner}</button>
}

function Emblem(){
  return (
    <svg className="hm-emblem" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" className="hm-sh"/>
      <path d="M12 7l1.4 2.9 3.1.4-2.3 2.1.6 3.1L12 14l-2.8 1.5.6-3.1-2.3-2.1 3.1-.4z" className="hm-st"/>
    </svg>
  )
}

export default function HandsetHome(p:Props){
  const hyp = HYPOTHESIS[Math.min(HYPOTHESIS.length-1,p.chapterNumber-1)]
  const nodes:Node[] = [
    {key:'team',label:'Equipe',icon:<MessageCircle/>,badge:p.teamBadge,locked:false,hint:''},
    {key:'clues',label:'Pistas',icon:<FileSearch/>,badge:p.clueBadge,locked:false,hint:''},
    {key:'interrogate',label:'Pessoas',icon:<Users/>,badge:0,locked:!p.peopleOpen,hint:'Quando houver depoimentos'},
    {key:'victim',label:'Tel. Helena',icon:<Smartphone/>,badge:0,locked:!p.helenaOpen,hint:'Quando for apreendido'},
    {key:'chapters',label:'Arquivo',icon:<FolderSearch/>,badge:0,locked:!p.archiveOpen,hint:'Quando houver documentos'}
  ]
  return (
    <main className="handset hm">
      <header className="hm-head">
        <div><small>POLÍCIA CIVIL · SP</small><b>SISTEMA DE INVESTIGAÇÃO CRIMINAL</b></div>
        <button onClick={()=>p.onOpenApp('settings')} aria-label="Ajustes"><Settings/></button>
      </header>

      <section className="hm-alert" aria-label="Resumo atual do Caso 01">
        <i aria-hidden="true"/>
        <div><b>Caso 01 · {p.caseStatus}</b><span>Rua das Acácias, Campo Belo · 04:27</span></div>
      </section>

      <section className="hm-wheel" aria-label="Módulos do sistema">
        <span className="hm-ring" aria-hidden="true"/>
        <Emblem/>
        {nodes.map((n,i)=><Orb key={n.key} n={n} angle={-90+i*72} onOpen={()=>p.onOpenApp(n.key)}/>)}
      </section>

      <p className="hm-facts"><span>Ricardo e Helena Valença</span><span>{hyp}</span></p>

      <section className="hm-update" aria-live="polite">
        {p.updateSource==='Sônia'
          ? <img src="/sonia.jpg" alt="" className="hm-av"/>
          : <span className="hm-av hm-av-i">{p.updateSource.slice(0,1)}</span>}
        <div><b>{p.updateSource}</b> · {p.updateText}</div>
      </section>

      {p.updateActionLabel&&p.onOpenUpdate&&<button className="hm-go" onClick={p.onOpenUpdate}>{p.updateActionLabel}<ChevronRight/></button>}
    </main>
  )
}
