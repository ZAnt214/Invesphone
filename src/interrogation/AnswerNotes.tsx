import { Check, Search } from 'lucide-react'
import { clueForSentence, noteKey, splitSentences } from './logic'
import type { InterrogationQuestion } from './types'

type Props = {
  question:InterrogationQuestion
  /** Frases já anotadas (`<pergunta>:<índice>`). */
  noted:string[]
  clueTitle:(id:string)=>string|undefined
  onNote:(key:string, clue:string|undefined)=>void
  /** Pistas deste depoimento: quantas já foram anotadas e quantas existem. */
  summary?:{ found:number; total:number }
  /** Lista de perguntas feitas: sem o cabeçalho de instrução. */
  compact?:boolean
}

/**
 * Resposta dividida em frases. Tocar numa frase a anota: se ela vale uma pista, a pista é registrada;
 * se não, fica anotada como sem valor para o caso.
 */
export default function AnswerNotes({question,noted,clueTitle,onNote,summary,compact}:Props){
  const sentences = splitSentences(question.answer)
  return (
    <article className={`ii-line ii-answer${compact ? ' compact' : ''}`}>
      {!compact && (
        <header className="ii-answer-head">
          <span className="ii-answer-title"><Search/> ANOTE AS PISTAS</span>
          {summary && summary.total>0 && <span className="ii-chip">{summary.found}/{summary.total} PISTAS</span>}
        </header>
      )}
      {!compact && <p className="ii-howto">Toque nas frases que parecem importantes para o caso.</p>}
      <ul className="ii-sents">
        {sentences.map((s,i)=>{
          const key = noteKey(question.id,i)
          const done = noted.includes(key)
          const clue = clueForSentence(question,s)
          const hit = done && !!clue
          return (
            <li key={key}>
              <button type="button" disabled={done}
                className={`ii-sent${done ? (hit ? ' hit' : ' miss') : ''}`}
                onClick={()=>onNote(key,clue)}>
                <i className="ii-mark-icon" aria-hidden="true">{hit ? <Check/> : <Search/>}</i>
                <span>{s}</span>
              </button>
              {hit && <div className="ii-note"><b>PISTA</b> {clueTitle(clue!) ?? clue}</div>}
              {done && !clue && <div className="ii-note miss">SEM VALOR PARA O CASO</div>}
            </li>
          )
        })}
      </ul>
    </article>
  )
}
