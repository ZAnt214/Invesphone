import { useEffect, useRef } from 'react'
import { PortraitRenderer } from './portraitRenderer'
import { mouthTrack } from './mouth'
import type { CharacterDef, Expression } from './types'

export type Speech = { id:string; text:string; duration:number }

type Props = {
  character:CharacterDef
  expression:Expression
  /** Texto sendo falado agora. A boca segue as letras durante `duration` ms. */
  speech?:Speech|null
  /** Fundo transparente: o personagem aparece por cima do cenário em volta (precisa de `figureMask`). */
  transparent?:boolean
}

/** Retrato animado de qualquer personagem que tenha arte oficial cadastrada. */
export default function CharacterPortrait({character,expression,speech=null,transparent=false}:Props){
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<PortraitRenderer|null>(null)
  const exprRef = useRef(expression)
  exprRef.current = expression
  const transparentRef = useRef(transparent)
  transparentRef.current = transparent

  useEffect(()=>{
    if(!canvas.current || !wrap.current) return
    const r = new PortraitRenderer(canvas.current,character)
    renderer.current = r
    const fit = ()=>r.resize(wrap.current!.clientWidth)
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(wrap.current)
    r.setExpression(exprRef.current)
    r.setTransparent(transparentRef.current)
    r.start().catch(()=>{})
    return ()=>{ ro.disconnect(); r.destroy(); renderer.current = null }
  },[character])

  useEffect(()=>{ renderer.current?.setExpression(expression) },[expression])
  useEffect(()=>{ renderer.current?.setTransparent(transparent) },[transparent])

  useEffect(()=>{
    if(!speech) renderer.current?.setSpeech(null)
    else renderer.current?.setSpeech(mouthTrack(speech.text,speech.duration),speech.duration)
  },[speech])

  return (
    <div className="cp" ref={wrap}>
      <canvas ref={canvas} role="img" aria-label={`${character.name}, ${expression}`}/>
    </div>
  )
}
