import { useEffect, useState } from 'react'
import { EFFECTS, categoriesOf, fxOn, onFxChange, setFx } from './settings/gameSettings'
import type { SectionId } from './settings/gameSettings'
import './quality-picker.css'

/** Efeitos de uma seção (Gráficos ou Som), por categoria, com a opção de desligar (o mesmo registro do botão de Ajustes do jogo). */
export default function EffectsSettings({section}:{section:SectionId}){
  const [,tick] = useState(0)
  useEffect(()=>onFxChange(()=>tick(n=>n+1)),[])
  return <>{categoriesOf(section).map(c=>(
    <div className="qp fs" key={c.id}>
      <div className="qp-row"><small>{c.label.toUpperCase()}</small></div>
      {EFFECTS.filter(e=>e.cat===c.id).map(e=>{
        const on = fxOn(e.id)
        return (
          <div className="qp-row fx-row" key={e.id}>
            <p><b>{e.label}</b> · {e.desc}</p>
            <button className="fs-btn" role="switch" aria-checked={on} aria-label={e.label} onClick={()=>setFx(e.id,!on)}>{on?'Ligado':'Desligado'}</button>
          </div>
        )
      })}
    </div>
  ))}</>
}
