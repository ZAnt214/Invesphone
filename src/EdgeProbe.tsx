import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Teste das bordas da tela, versão 2: além de faixas `fixed`, usa faixas `absolute` presas ao elemento raiz (html), fora
 * do corpo fixo do jogo. O print mostra quais técnicas chegam ao fim físico da tela do aparelho.
 */
export default function EdgeProbe(){
  const [on,setOn] = useState(false)
  const [host,setHost] = useState<HTMLDivElement|null>(null)

  useEffect(()=>{
    if(!on) return
    const el = document.createElement('div')
    // preso ao html, não ao body (que é fixo): posicionamento absoluto relativo ao bloco inicial
    el.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100lvh;z-index:99998;pointer-events:none'
    document.documentElement.appendChild(el)
    setHost(el)
    return ()=>{ el.remove(); setHost(null) }
  },[on])

  if(!on) return <button className="fs-btn" style={{marginTop:12}} onClick={()=>setOn(true)}>Teste das bordas</button>

  const base:React.CSSProperties = {width:'20%',height:34,color:'#000',font:'700 9px monospace',display:'grid',placeItems:'center',textAlign:'center'}
  return (
    <>
      <div onClick={()=>setOn(false)} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,.25)'}}>
        <div style={{position:'fixed',top:0,left:0,right:0,height:20,background:'#fff',color:'#000',font:'700 10px monospace',textAlign:'center',lineHeight:'20px'}}>TOPO · toque para fechar</div>
        <div style={{...base,position:'fixed',bottom:0,left:0,background:'#ff3b30'}}>A fixed bottom:0</div>
        <div style={{position:'fixed',left:0,right:0,top:'45%',color:'#fff',font:'600 11px monospace',textAlign:'center',textShadow:'0 1px 3px #000'}}>
          inner={Math.round(window.innerHeight)} · tela={screen.height}
        </div>
      </div>
      {host && createPortal(
        <>
          <div style={{...base,position:'absolute',top:'calc(100lvh - 34px)',left:'20%',background:'#bf5af2'}}>E abs 100lvh-34</div>
          <div style={{...base,position:'absolute',top:`${screen.height-34}px`,left:'40%',background:'#ff9f0a'}}>F abs tela-34</div>
          <div style={{...base,position:'absolute',bottom:0,left:'60%',background:'#64d2ff'}}>G abs bottom:0</div>
          <div style={{...base,position:'absolute',top:`${window.innerHeight-34}px`,left:'80%',background:'#32d74b'}}>H abs inner-34</div>
        </>,
        host
      )}
    </>
  )
}
