import { ChevronLeft, ChevronRight, FileSearch } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { InterrogationQuestion } from './types'

/** Altura estimada de uma pergunta (normal e confrontação, com a etiqueta da pista) e espaço entre elas, em px. */
const ITEM = 48
const ITEM_CONFRONT = 70
const GAP = 6
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
  const hOf = (q:InterrogationQuestion)=>q.requiresClue ? ITEM_CONFRONT : ITEM
  // páginas montadas por altura: quantas perguntas couberem (e o seletor de página se houver mais de uma)
  const paginate = (avail:number)=>{
    const out:InterrogationQuestion[][] = []
    let cur:InterrogationQuestion[] = [], used = 0
    for(const q of ordered){
      const h = hOf(q)+(cur.length ? GAP : 0)
      if(cur.length && used+h>avail){ out.push(cur); cur = []; used = 0 }
      used += hOf(q)+(cur.length ? GAP : 0)
      cur.push(q)
    }
    if(cur.length) out.push(cur)
    return out.length ? out : [[]]
  }
  let pagesList = paginate(height)
  if(pagesList.length>1) pagesList = paginate(height-PAGER)
  const total = pagesList.length
  const cur = Math.min(page,total-1)

  useEffect(()=>{ if(page>total-1) setPage(Math.max(0,total-1)) },[page,total])

  const slice = pagesList[cur]
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
