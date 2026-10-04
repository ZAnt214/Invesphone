import { Check, ChevronRight, FileSearch, FolderSearch, Lock, MessageCircle, Settings, Smartphone, Users } from 'lucide-react'
import './desk-home.css'

/** Uma anotação da leva atual na Home: sugestão em aberto ou, se já foi feita, riscada. */
export type GuideNote = {id:string;finished:boolean;doneText:string;tag:string;title:string;text:string;cta?:string;locked?:boolean;run:()=>void}

type HomeTarget = 'team'|'clues'|'interrogate'|'victim'|'chapters'|'settings'

type Props = {
  chapterNumber:number
  chapterTitle:string
  caseStatus:string
  notes:GuideNote[]
  teamBadge:number
  clueBadge:number
  peopleOpen:boolean
  helenaOpen:boolean
  archiveOpen:boolean
  onOpenApp:(app:HomeTarget)=>void
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

      <section className="hm-guide" aria-label="Próximos passos do caso">
        <header><i aria-hidden="true"/><b>Caso 01 · {p.caseStatus}</b></header>
        <ol key={p.notes.map(n=>n.id).join('|')}>
          {p.notes.map((n,i)=>{
            if(n.finished) return <li key={n.id} className="done"><span aria-hidden="true"><Check/></span><s>{n.doneText}</s></li>
            const k = p.notes.slice(0,i).filter(x=>!x.finished).length
            return (
              <li key={n.id} className={`${k===0&&!n.locked?'first':''}`}>
                <button type="button" disabled={n.locked} onClick={n.run} aria-label={`${n.tag}. ${n.title}. ${n.text}${n.cta?` ${n.cta}`:''}`}>
                  <em>{k===0&&!n.locked?'AGORA · ':''}{n.tag}</em>
                  <b>{n.title}</b>
                  <span>{n.text}</span>
                  {n.locked ? <Lock aria-hidden="true"/> : <ChevronRight aria-hidden="true"/>}
                </button>
              </li>
            )
          })}
        </ol>
        <small>Sugestões do caso: siga na ordem que preferir.</small>
      </section>

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
