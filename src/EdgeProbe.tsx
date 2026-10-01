import { useState } from 'react'

/**
 * Teste das bordas da tela: faixas coladas ao fim da tela por técnicas diferentes. O print mostra quais chegam até o
 * fim físico do aparelho (a página pode ser cortada acima dele no iPhone instalado).
 */
export default function EdgeProbe(){
  const [on,setOn] = useState(false)
  if(!on) return <button className="fs-btn" style={{marginTop:12}} onClick={()=>setOn(true)}>Teste das bordas</button>
  const band = (label:string,color:string,left:number,style:React.CSSProperties)=>(
    <div style={{width:'25%',left:`${left}%`,height:34,background:color,color:'#000',font:'700 9px monospace',display:'grid',placeItems:'center',textAlign:'center',...style}}>{label}</div>
  )
  return (
    <div onClick={()=>setOn(false)} style={{position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,.35)'}}>
      <div style={{position:'fixed',top:0,left:0,right:0,height:20,background:'#fff',color:'#000',font:'700 10px monospace',textAlign:'center',lineHeight:'20px'}}>TOPO (y=0) · toque para fechar</div>
      {band('A fixed bottom:0','#ff3b30',0,{position:'fixed',bottom:0})}
      {band('B top:100vh-34','#34c759',25,{position:'fixed',top:'calc(100vh - 34px)'})}
      {band('C top:100lvh-34','#0a84ff',50,{position:'fixed',top:'calc(100lvh - 34px)'})}
      {band('D top:screen-34','#ffd60a',75,{position:'fixed',top:`${screen.height-34}px`})}
      <div style={{position:'fixed',left:0,right:0,top:'50%',color:'#fff',font:'600 11px monospace',textAlign:'center',textShadow:'0 1px 3px #000'}}>
        vh={Math.round(window.innerHeight)} · tela={screen.height}
      </div>
    </div>
  )
}
