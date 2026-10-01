import type { Expression } from '../characters/types'
import { emotionLabel, emotionLevel, emotionOf } from './emotions'

/**
 * Medidor de emoção do interrogado: um só ponteiro que vai da calma ao abalo, com o estado dominante
 * escrito. Acompanha a expressão do retrato.
 */
export default function EmotionMeter({name,expression}:{name:string;expression:Expression}){
  const x = emotionOf(expression)
  const level = emotionLevel(x)
  const label = emotionLabel(x)
  return (
    <section className="ii-emo" aria-label={`Emoção de ${name}`}>
      <header>
        <small>EMOÇÃO</small>
        <b key={label}>{label}</b>
      </header>
      <div className="ii-emo-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} aria-label="Intensidade emocional">
        <i className="ii-emo-fill" style={{clipPath:`inset(0 ${100-level}% 0 0)`}}/>
        <i className="ii-emo-pin" style={{left:`${level}%`}}/>
      </div>
      <footer><span>CALMA</span><span>MODERADA</span><span>INTENSA</span></footer>
    </section>
  )
}
