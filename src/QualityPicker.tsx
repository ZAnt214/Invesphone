import { useState } from 'react'
import { QUALITIES, QUALITY_LABEL, getQuality, setQuality } from './characters/quality'
import type { Quality } from './characters/quality'
import './quality-picker.css'

const DESCRIPTION:Record<Quality,string> = {
  low:'Resolução menor, 30 quadros por segundo e menos animações. Para aparelhos mais fracos ou economizar bateria.',
  medium:'Resolução da arte original. 60 quadros na fala e nas transições, 30 em repouso.',
  high:'Resolução nativa da tela e todos os quadros que o aparelho entregar. Experiência completa.'
}

/** Qualidade gráfica do jogo inteiro. Fica em Gráficos, na tela inicial. */
export default function QualityPicker(){
  const [q,setQ] = useState<Quality>(getQuality)
  return (
    <div className="qp" role="radiogroup" aria-label="Qualidade gráfica">
      <div className="qp-row">
        <small>QUALIDADE GRÁFICA</small>
        <div className="qp-buttons">
          {QUALITIES.map(x=>(
            <button key={x} role="radio" aria-checked={q===x} className={q===x?'on':''} onClick={()=>{ setQ(x); setQuality(x) }}>{QUALITY_LABEL[x]}</button>
          ))}
        </div>
      </div>
      <p>{DESCRIPTION[q]}</p>
    </div>
  )
}
