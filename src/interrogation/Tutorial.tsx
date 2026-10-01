import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type TutorialStep = { target:string, title:string, text:string, place:'panel'|'stage'|'tabs' }

/** Dicas curtas e discretas, uma por vez, sobre cada parte da tela. O destaque é só um contorno. */
export default function Tutorial({steps,onClose}:{steps:TutorialStep[],onClose:()=>void}){
  const [i,setI] = useState(0)
  const step = steps[i]
  const last = i===steps.length-1
  const root = useRef<HTMLDivElement>(null)
  const [pos,setPos] = useState<{top?:number,bottom?:number}>({})
  const [spot,setSpot] = useState<{top:number,left:number,width:number,height:number}|null>(null)

  // o cartão nunca cobre o trecho explicado: fica logo abaixo do medidor, sobre a base do retrato ou acima das abas
  useLayoutEffect(()=>{
    const host = root.current?.parentElement
    if(!host) return
    const h = host.getBoundingClientRect()
    const rect = (sel:string)=>host.querySelector(sel)?.getBoundingClientRect()
    const t = rect(step.target)
    setSpot(t ? {top:t.top-h.top,left:t.left-h.left,width:t.width,height:t.height} : null)
    if(step.place==='panel') setPos({top:(rect('.ii-emo')?.bottom ?? h.top) - h.top + 8})
    else if(step.place==='stage') setPos({bottom:h.bottom - (rect('.ii-stage')?.bottom ?? h.bottom) + 8})
    else setPos({bottom:h.bottom - (rect('.ii-tabs')?.top ?? h.bottom) + 8})
  },[step.place,step.target])

  useEffect(()=>{
    const onKey = (e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[onClose])

  return (
    <div className="ii-tut" ref={root} role="dialog" aria-label="Como funciona o depoimento">
      {spot && <i className="ii-tut-spot" style={spot} key={`s${i}`}/>}
      <aside className="ii-tut-card" style={pos} key={i}>
        <small>DICA {i+1} DE {steps.length}</small>
        <b>{step.title}</b>
        <p>{step.text}</p>
        <div className="ii-tut-actions">
          <button type="button" className="skip" onClick={onClose}>{last ? '' : 'PULAR'}</button>
          <button type="button" className="go" onClick={()=>last ? onClose() : setI(i+1)}>{last ? 'ENTENDI' : 'PRÓXIMA'}</button>
        </div>
      </aside>
    </div>
  )
}
