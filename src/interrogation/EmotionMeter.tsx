import type { Expression } from '../characters/types'
import type { PressureStage } from './types'
import { emotionLabel, emotionLevel, emotionOf } from './emotions'

/**
 * Medidor de emoção do interrogado: um só ponteiro que vai da calma à intensidade máxima, com o estado
 * dominante escrito. Acompanha a expressão do retrato.
 */
export default function EmotionMeter({name,expression,pressure=0,stages=[]}:{name:string;expression:Expression;pressure?:number;stages?:PressureStage[]}){
  const x = emotionOf(expression)
  const level = emotionLevel(x)
  const label = emotionLabel(x)
  return (
    <section className="ii-emo" aria-label={`Emoção de ${name}`}>
      <small>EMOÇÃO</small>
      <div className="ii-emo-track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} aria-label="Intensidade emocional">
        <i className="ii-emo-fill" style={{clipPath:`inset(0 ${100-level}% 0 0)`}}/>
        <i className="ii-emo-pin" style={{left:`${level}%`}}/>
      </div>
      <b key={label}>{label}</b>
      <div className="ii-press" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pressure} aria-label="Pressão acumulada">
        <small>PRESSÃO</small>
        <span><i style={{width:`${pressure}%`}}/>{stages.map(s=><u key={s.at} className={pressure>=s.at?'on':''} style={{left:`${s.at}%`}}/>)}</span>
      </div>
    </section>
  )
}
