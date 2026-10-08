import { Check, Search } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export type TutorialStep = { target:string, title:string, text:string, place:'panel'|'stage'|'tabs', demo?:boolean }

/** Caixa de um elemento em coordenadas de layout, relativa ao host. Ao contrário de getBoundingClientRect,
 *  não é afetada por transformações (a base do DHPP gira a tela inteira quando o celular está em pé). */
function layoutBox(el:Element|null|undefined, host:HTMLElement){
  if(!el) return undefined
  const abs=(n:HTMLElement|null)=>{let x=0,y=0;while(n){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent as HTMLElement|null}return {x,y}}
  const e=el as HTMLElement, a=abs(e), o=abs(host), top=a.y-o.y, left=a.x-o.x
  return {top,left,width:e.offsetWidth,height:e.offsetHeight,bottom:top+e.offsetHeight,right:left+e.offsetWidth}
}

/** Dicas curtas e discretas, uma por vez, sobre cada parte da tela. O destaque é só um contorno. */
export default function Tutorial({steps,onClose}:{steps:TutorialStep[],onClose:()=>void}){
  const [i,setI] = useState(0)
  const step = steps[i]
  const last = i===steps.length-1
  const root = useRef<HTMLDivElement>(null)
  const demoRef = useRef<HTMLElement>(null)
  const [demoTop,setDemoTop] = useState(0)
  const [pos,setPos] = useState<{top?:number,bottom?:number}>({})
  const [spot,setSpot] = useState<{top:number,left:number,width:number,height:number}|null>(null)

  // o cartão nunca cobre o trecho explicado: fica logo abaixo do medidor, sobre a base do retrato ou acima das abas
  useLayoutEffect(()=>{
    const host = root.current?.parentElement
    if(!host) return
    const h = layoutBox(host,host)!
    const rect = (sel:string)=>layoutBox(host.querySelector(sel),host)
    if(step.demo) setDemoTop((rect('.ii-main')?.top ?? h.top) - h.top)
    const t = step.demo ? undefined : rect(step.target)
    setSpot(t ? {top:t.top-h.top,left:t.left-h.left,width:t.width,height:t.height} : null)
    if(step.place==='panel') setPos({top:(rect('.ii-emo')?.bottom ?? h.top) - h.top + 8})
    else if(step.place==='stage') setPos({bottom:h.bottom - (rect('.ii-stage')?.bottom ?? h.bottom) + 8})
    else setPos({bottom:h.bottom - (rect('.ii-tabs')?.top ?? h.bottom) + 8})
  },[i,step.place,step.target,step.demo])

  // a demonstração recebe o destaque: é ela que o jogador precisa entender
  useLayoutEffect(()=>{
    const host = root.current?.parentElement
    const d = demoRef.current
    if(!step.demo || !host || !d) return
    const h = layoutBox(host,host)!, r = layoutBox(d,host)!
    setSpot({top:r.top-h.top,left:r.left-h.left,width:r.width,height:r.height})
  },[step.demo,demoTop])

  useEffect(()=>{
    const onKey = (e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[onClose])

  return (
    <div className="ii-tut" ref={root} role="dialog" aria-label="Como funciona o depoimento">
      {spot && <i className="ii-tut-spot" style={spot} key={`s${i}`}/>}
      {step.demo && (
        <article className="ii-line ii-answer ii-tut-demo" ref={demoRef} style={{position:'absolute',left:12,right:12,top:demoTop}} aria-hidden="true">
          <header className="ii-answer-head"><span className="ii-answer-title"><Search/> EXEMPLO DE RESPOSTA</span></header>
          <ul className="ii-sents">
            <li>
              <span className="ii-sent hit"><i className="ii-mark-icon"><Check/></i><span>“A porta já estava aberta quando eu cheguei.”</span></span>
              <div className="ii-note"><b>PISTA</b> Porta sem sinal de arrombamento</div>
            </li>
            <li>
              <span className="ii-sent miss"><i className="ii-mark-icon"><Search/></i><span>“Eu estava muito cansada.”</span></span>
              <div className="ii-note miss">SEM VALOR PARA O CASO</div>
            </li>
          </ul>
        </article>
      )}
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
