import { ChevronLeft, ChevronRight, FileSearch } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { InterrogationQuestion } from './types'

/** Altura mínima de uma pergunta e espaço entre elas, em px. */
const ITEM = 56
const GAP = 8
const PAGER = 36

type Props = {
  questions:InterrogationQuestion[]
  onPick:(id:string)=>void
  clueTitle?:(id:string)=>string|undefined
}

/**
 * Perguntas disponíveis, ajustadas à altura que sobra na tela: quantas couberem aparecem de uma vez e,
 * se houver mais, o jogador troca de página (nada de rolar a tela). As confrontações vêm depois das normais.
 */
export default function QuestionPager({questions,onPick,clueTitle}:Props){
  const box = useRef<HTMLDivElement>(null)
  const [height,setHeight] = useState(0)
  const [page,setPage] = useState(0)

  useLayoutEffect(()=>{
    const el = box.current
    if(!el) return
    const measure = ()=>setHeight(el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return ()=>ro.disconnect()
  },[])

  const ordered = [...questions.filter(q=>!q.requiresClue),...questions.filter(q=>q.requiresClue)]
  const fit = (h:number)=>Math.max(1,Math.floor((h+GAP)/(ITEM+GAP)))
  let size = fit(height)
  const pages = Math.max(1,Math.ceil(ordered.length/size))
  if(pages>1) size = fit(height-PAGER)
  const total = Math.max(1,Math.ceil(ordered.length/size))
  const cur = Math.min(page,total-1)

  useEffect(()=>{ if(page>total-1) setPage(Math.max(0,total-1)) },[page,total])

  const slice = ordered.slice(cur*size,cur*size+size)
  return (
    <div className="iq" ref={box}>
      <div className="iq-list">
        {slice.map(q=>(
          <button key={q.id} className={`iv-ask${q.requiresClue ? ' iv-confront' : ''}`} onClick={()=>onPick(q.id)}>
            {q.requiresClue && <span className="iv-evidence"><FileSearch/> {clueTitle?.(q.requiresClue) ?? q.requiresClue}</span>}
            <span>{q.question}</span>
          </button>
        ))}
        {ordered.length===0 && <div className="ii-empty">Sem novas perguntas por enquanto. Veja as Anotações.</div>}
      </div>
      {total>1 && (
        <div className="iq-pager">
          <button onClick={()=>setPage(Math.max(0,cur-1))} disabled={cur===0} aria-label="Perguntas anteriores"><ChevronLeft/></button>
          <span>{cur+1} / {total}</span>
          <button onClick={()=>setPage(Math.min(total-1,cur+1))} disabled={cur===total-1} aria-label="Mais perguntas"><ChevronRight/></button>
        </div>
      )}
    </div>
  )
}
