import { FileSearch, FolderSearch, Lock, MessageCircle, Settings, Smartphone, Users } from 'lucide-react'
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

export default function HandsetHome(p:Props){
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
        <div><small>DHPP · HOMICÍDIOS</small><b>SISTEMA DE INVESTIGAÇÃO</b></div>
        <button onClick={()=>p.onOpenApp('settings')} aria-label="Ajustes"><Settings/></button>
      </header>

      <button className="hm-alert" onClick={p.onOpenUpdate} aria-label={`Caso 01 · ${p.caseStatus}. ${p.updateActionLabel ?? ''}`}>
        <i aria-hidden="true"/>
        <div>
          <b>Caso 01 · {p.caseStatus}</b>
          <span>{p.updateSource}: {p.updateText}</span>
          {p.updateActionLabel && <em>{p.updateActionLabel} ›</em>}
        </div>
      </button>

      <div className="hm-center">
        <section className="hm-wheel" aria-label="Módulos do sistema">
          <div className="hm-mark" aria-hidden="true"><b>DHPP</b><i/><span>{[...'HOMICÍDIOS'].map((l,i)=><em key={i}>{l}</em>)}</span></div>
          <span className="hm-ring" aria-hidden="true"/>
          {nodes.map((n,i)=><Orb key={n.key} n={n} angle={-90+i*72} onOpen={()=>p.onOpenApp(n.key)}/>)}
        </section>
      </div>
    </main>
  )
}
