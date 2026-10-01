import { useEffect, useRef, useState } from 'react'
import { isStandalone } from './fullscreen'
import './quality-picker.css'

type Info = Record<string,string>

/** Medidas reais da tela e do navegador, para conferir o alinhamento no aparelho (print desta seção ajuda a ajustar). */
export default function Diagnostics(){
  const probe = useRef<HTMLDivElement>(null)
  const [info,setInfo] = useState<Info>({})

  useEffect(()=>{
    const read = ()=>{
      const cs = probe.current ? getComputedStyle(probe.current) : null
      const px = (v?:string|null)=>v ? `${Math.round(parseFloat(v))}` : '?'
      const vv = window.visualViewport
      setInfo({
        'janela (innerW×H)':`${window.innerWidth}×${window.innerHeight}`,
        'visualViewport':vv ? `${Math.round(vv.width)}×${Math.round(vv.height)}` : '—',
        'tela (screen)':`${screen.width}×${screen.height}`,
        'recuo sup/inf (px)':`${px(cs?.paddingTop)} / ${px(cs?.paddingBottom)}`,
        'recuo inf. usado':getComputedStyle(document.documentElement).getPropertyValue('--safe-b').trim() || '—',
        'app instalado':isStandalone() ? 'sim' : 'não',
        'dpr':String(window.devicePixelRatio),
        'navegador':/CriOS/.test(navigator.userAgent) ? 'Chrome iOS' : /FxiOS/.test(navigator.userAgent) ? 'Firefox iOS' : /EdgiOS/.test(navigator.userAgent) ? 'Edge iOS' : /Safari/.test(navigator.userAgent) ? 'Safari/WebKit' : 'outro'
      })
    }
    read()
    window.addEventListener('resize',read)
    return ()=>window.removeEventListener('resize',read)
  },[])

  return (
    <div className="qp dg">
      <div className="qp-row"><small>DIAGNÓSTICO DA TELA</small></div>
      <dl>
        {Object.entries(info).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <div ref={probe} aria-hidden="true" style={{position:'fixed',left:0,top:0,width:0,height:0,visibility:'hidden',paddingTop:'env(safe-area-inset-top,0px)',paddingBottom:'env(safe-area-inset-bottom,0px)'}}/>
    </div>
  )
}
