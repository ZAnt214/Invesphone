import { Check } from 'lucide-react'
import type { InterrogationQuestion } from './types'

type Props = {
  pending:InterrogationQuestion[]
  asked:InterrogationQuestion[]
  disabled?:boolean
  onPick:(id:string)=>void
}

/** Lista de perguntas: as disponíveis em cima, as já feitas embaixo. */
export default function DialogueChoices({pending,asked,disabled,onPick}:Props){
  return (
    <div className="iv-choices">
      {pending.length>0 && <>
        <small>PERGUNTAR</small>
        {pending.map(q=>(
          <button key={q.id} className="iv-ask" disabled={disabled} onClick={()=>onPick(q.id)}>{q.question}</button>
        ))}
      </>}
      {asked.length>0 && <>
        <small className="iv-asked-title">JÁ PERGUNTADO</small>
        <ul className="iv-asked">
          {asked.map(q=><li key={q.id}><Check/>{q.question}</li>)}
        </ul>
      </>}
    </div>
  )
}
