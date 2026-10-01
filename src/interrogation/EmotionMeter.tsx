import type { Expression } from '../characters/types'
import { EMOTIONS, emotionLabel, emotionOf } from './emotions'

/** Medidor do que o interrogado sente agora. As barras acompanham a expressão do retrato. */
export default function EmotionMeter({name,expression}:{name:string;expression:Expression}){
  const x = emotionOf(expression)
  const label = emotionLabel(x)
  return (
    <section className="ii-emo" aria-label={`Estado emocional de ${name}`}>
      <header>
        <small>ESTADO EMOCIONAL</small>
        <b key={label}>{label}</b>
      </header>
      <ul>
        {EMOTIONS.map(e=>(
          <li key={e.id} className={`emo-${e.id}`}>
            <span>{e.label}</span>
            <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={x[e.id]} aria-label={e.label}>
              <i style={{width:`${x[e.id]}%`}}/>
            </div>
            <em>{x[e.id]}</em>
          </li>
        ))}
      </ul>
    </section>
  )
}
