import { Check } from 'lucide-react'
import { clueForSentence, noteKey, splitSentences } from './logic'
import type { InterrogationQuestion } from './types'

type Props = {
  question:InterrogationQuestion
  /** Frases já anotadas (`<pergunta>:<índice>`). */
  noted:string[]
  clueTitle:(id:string)=>string|undefined
  onNote:(key:string, clue:string|undefined)=>void
  /** Mostra a pergunta junto (usado na lista de perguntas já feitas). */
  withQuestion?:boolean
}

/**
 * Resposta dividida em frases. Tocar numa frase a anota: se ela vale uma pista, a pista é registrada;
 * se não, fica anotada como sem valor para o caso.
 */
export default function AnswerNotes({question,noted,clueTitle,onNote,withQuestion}:Props){
  const sentences = splitSentences(question.answer)
  const hits:string[] = []
  return (
    <article className="ii-line ii-answer">
      {withQuestion && <small>{question.question.toUpperCase()}</small>}
      {!withQuestion && <small>RESPOSTA · TOQUE NAS FRASES IMPORTANTES PARA ANOTAR</small>}
      <p>
        {sentences.map((s,i)=>{
          const key = noteKey(question.id,i)
          const done = noted.includes(key)
          const clue = clueForSentence(question,s)
          if(done && clue) hits.push(clue)
          return (
            <button key={key} type="button" disabled={done}
              className={`ii-sent${done ? (clue ? ' hit' : ' miss') : ''}`}
              onClick={()=>onNote(key,clue)}>{s}{' '}</button>
          )
        })}
      </p>
      {hits.map(id=>(
        <div key={id} className="ii-note"><Check/> PISTA REGISTRADA · {clueTitle(id) ?? id}</div>
      ))}
    </article>
  )
}
