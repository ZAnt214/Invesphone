import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react'
import './evidence-viewer.css'

/** Caminho público do asset respeitando o `base` do Vite. */
export const assetUrl=(path:string)=>`${import.meta.env.BASE_URL.replace(/\/$/,'')}${path}`

type Transform={s:number;x:number;y:number}
const MIN=1,MAX=5

/**
 * Visualizador em tela cheia das peças da investigação.
 * Pinça para ampliar, arrastar para mover, toque duplo alterna o zoom e as setas navegam entre as peças.
 */
export default function EvidenceViewer({title,paths,start=0,onClose}:{title:string;paths:readonly string[];start?:number;onClose:()=>void}){
  const [index,setIndex]=useState(start)
  const [t,setT]=useState<Transform>({s:1,x:0,y:0})
  const pointers=useRef(new Map<number,{x:number;y:number}>())
  const pinch=useRef<{dist:number;s:number}|null>(null)
  const lastTap=useRef(0)
  const stage=useRef<HTMLDivElement>(null)

  const clamp=(n:Transform):Transform=>{
    const s=Math.min(MAX,Math.max(MIN,n.s))
    if(s<=1)return {s:1,x:0,y:0}
    const r=stage.current?.getBoundingClientRect()
    const mx=r?r.width*(s-1)/2:0,my=r?r.height*(s-1)/2:0
    return {s,x:Math.min(mx,Math.max(-mx,n.x)),y:Math.min(my,Math.max(-my,n.y))}
  }
  const go=(d:number)=>{setIndex(i=>(i+d+paths.length)%paths.length);setT({s:1,x:0,y:0})}
  const zoom=(f:number)=>setT(v=>clamp({...v,s:v.s*f}))

  useEffect(()=>{
    const key=(e:KeyboardEvent)=>{
      if(e.key==='Escape')onClose()
      if(e.key==='ArrowRight'&&paths.length>1)go(1)
      if(e.key==='ArrowLeft'&&paths.length>1)go(-1)
    }
    window.addEventListener('keydown',key)
    return()=>window.removeEventListener('keydown',key)
  },[paths.length])

  const down=(e:React.PointerEvent)=>{
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(pointers.current.size===2){
      const [a,b]=[...pointers.current.values()]
      pinch.current={dist:Math.hypot(a.x-b.x,a.y-b.y),s:t.s}
    }else{
      const now=Date.now()
      if(now-lastTap.current<300)setT(v=>v.s>1?{s:1,x:0,y:0}:clamp({s:2.5,x:0,y:0}))
      lastTap.current=now
    }
  }
  const move=(e:React.PointerEvent)=>{
    const prev=pointers.current.get(e.pointerId)
    if(!prev)return
    pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})
    if(pointers.current.size===2&&pinch.current){
      const [a,b]=[...pointers.current.values()]
      const d=Math.hypot(a.x-b.x,a.y-b.y)
      setT(v=>clamp({...v,s:pinch.current!.s*d/pinch.current!.dist}))
    }else if(pointers.current.size===1){
      const dx=e.clientX-prev.x,dy=e.clientY-prev.y
      setT(v=>v.s>1?clamp({...v,x:v.x+dx,y:v.y+dy}):v)
    }
  }
  const up=(e:React.PointerEvent)=>{
    pointers.current.delete(e.pointerId)
    if(pointers.current.size<2)pinch.current=null
  }
  const wheel=(e:React.WheelEvent)=>zoom(e.deltaY<0?1.15:1/1.15)

  return <div className="ev-viewer" role="dialog" aria-modal="true" aria-label={title}>
    <header>
      <b>{title}</b>
      <span>{paths.length>1?`${index+1} / ${paths.length}`:''}</span>
      <button onClick={onClose} aria-label="Fechar"><X/></button>
    </header>
    <div className="ev-stage" ref={stage} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onWheel={wheel}>
      <img src={assetUrl(paths[index])} alt={`${title} ${index+1}`} draggable={false} style={{transform:`translate(${t.x}px,${t.y}px) scale(${t.s})`}}/>
    </div>
    <footer>
      {paths.length>1&&<button onClick={()=>go(-1)} aria-label="Anterior"><ChevronLeft/></button>}
      <button onClick={()=>zoom(1/1.4)} aria-label="Reduzir"><Minus/></button>
      <em>{Math.round(t.s*100)}%</em>
      <button onClick={()=>zoom(1.4)} aria-label="Ampliar"><Plus/></button>
      {paths.length>1&&<button onClick={()=>go(1)} aria-label="Próxima"><ChevronRight/></button>}
    </footer>
  </div>
}
