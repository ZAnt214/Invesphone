import { Check, ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import type { InterrogationQuestion } from './types'

type Props = {
  pending:InterrogationQuestion[]
  asked:InterrogationQuestion[]
  disabled?:boolean
  onPick:(id:string)=>void
  /** Pergunta já feita aberta para rever a resposta (e anotar pistas). */
  openId?:string|null
  onToggle?:(id:string)=>void
  renderAnswer?:(q:InterrogationQuestion)=>ReactNode
}

/** Lista de perguntas: as disponíveis em cima, as já feitas embaixo (tocar numa revê a resposta). */
export default function DialogueChoices({pending,asked,disabled,onPick,openId,onToggle,renderAnswer}:Props){
  return (
    <div className="iv-choices">
      {pending.length>0 && <>
        <small>PERGUNTAR</small>
        {pending.map(q=>(
          <button key={q.id} className="iv-ask" disabled={disabled} onClick={()=>onPick(q.id)}>{q.question}</button>
        ))}
      </>}
      {asked.length>0 && <>
        <small className="iv-asked-title">JÁ PERGUNTADO · TOQUE PARA REVER E ANOTAR</small>
        <ul className="iv-asked">
          {asked.map(q=>(
            <li key={q.id} className={openId===q.id ? 'open' : ''}>
              <button type="button" className="iv-asked-row" onClick={()=>onToggle?.(q.id)} aria-expanded={openId===q.id}>
                <Check/><span>{q.question}</span><ChevronDown className="chev"/>
              </button>
              {openId===q.id && renderAnswer?.(q)}
            </li>
          ))}
        </ul>
      </>}
    </div>
  )
}
