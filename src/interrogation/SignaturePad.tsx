import { useEffect, useRef, useState } from 'react'

type Props = { onSave:(png:string)=>void; onCancel:()=>void }

const W = 600, H = 220
const INK = '#1d2f6b'

/** Quadro para assinar com o dedo: papel claro, caneta azul, sai como PNG com fundo transparente. */
export default function SignaturePad({onSave,onCancel}:Props){
  const cv = useRef<HTMLCanvasElement>(null)
  const last = useRef<{x:number;y:number}|null>(null)
  /** Ponto onde o último trecho terminou: o traço sai sem falhas entre os eventos. */
  const tail = useRef<{x:number;y:number}|null>(null)
  const [empty,setEmpty] = useState(true)

  useEffect(()=>{
    const c = cv.current!.getContext('2d')!
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.lineWidth = 4.2
  },[])

  const at = (e:React.PointerEvent) => {
    const r = cv.current!.getBoundingClientRect()
    return { x:(e.clientX-r.left)*W/r.width, y:(e.clientY-r.top)*H/r.height }
  }
  const down = (e:React.PointerEvent) => {
    cv.current!.setPointerCapture(e.pointerId)
    const p = at(e); last.current = p; tail.current = p
    const c = cv.current!.getContext('2d')!
    c.beginPath(); c.arc(p.x,p.y,2.1,0,Math.PI*2); c.fillStyle = INK; c.fill()
    setEmpty(false)
  }
  const move = (e:React.PointerEvent) => {
    const from = last.current, start = tail.current; if(!from || !start) return
    const p = at(e)
    const mid = { x:(from.x+p.x)/2, y:(from.y+p.y)/2 }
    const c = cv.current!.getContext('2d')!
    c.beginPath(); c.moveTo(start.x,start.y)
    c.quadraticCurveTo(from.x,from.y,mid.x,mid.y)
    c.stroke(); last.current = p; tail.current = mid
  }
  const up = () => {
    const l = last.current, t = tail.current
    if(l && t){ const c = cv.current!.getContext('2d')!; c.beginPath(); c.moveTo(t.x,t.y); c.lineTo(l.x,l.y); c.stroke() }
    last.current = null; tail.current = null
  }
  const clear = () => { cv.current!.getContext('2d')!.clearRect(0,0,W,H); setEmpty(true) }

  return (
    <div className="sp" role="dialog" aria-label="Assinar o depoimento">
      <div className="sp-card">
        <small>ASSINATURA DO RESPONSÁVEL</small>
        <p>Assine com o dedo dentro do quadro.</p>
        <div className="sp-paper">
          <canvas ref={cv} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}/>
          <i aria-hidden="true">✕</i>
        </div>
        <div className="sp-actions">
          <button type="button" onClick={onCancel}>CANCELAR</button>
          <button type="button" onClick={clear} disabled={empty}>LIMPAR</button>
          <button type="button" className="go" disabled={empty} onClick={()=>onSave(cv.current!.toDataURL('image/png'))}>ASSINAR</button>
        </div>
      </div>
    </div>
  )
}
