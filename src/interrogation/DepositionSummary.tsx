import type { InterrogationConfig, InterrogationProgress } from './types'
import { clueReport, getQuestion, stagesOf } from './logic'
import { emotionLevel, emotionOf } from './emotions'

type Props = {
  config:InterrogationConfig
  progress:InterrogationProgress
  clueTitle:(id:string)=>string|undefined
}

/** Cor do ponto da linha do tempo: da calma (verde) à intensidade máxima (rosa), como no medidor. */
const dot = (level:number) => `hsl(${Math.round(150-level*1.5)} 62% 52%)`

/** Fecho do depoimento: o que ela entregou, o que escapou e como ela reagiu ao longo das perguntas. */
export default function DepositionSummary({config,progress,clueTitle}:Props){
  const { found, missed } = clueReport(config,progress)
  const pressure = progress.pressure ?? 0
  const reached = stagesOf(config).filter(s=>pressure>=s.at)
  const peak = reached.length ? reached[reached.length-1].label : 'CONTROLADA'
  const trail = progress.asked.map(id=>getQuestion(config,id)).filter(q=>!!q)
  return (
    <div className="ii-complete ii-summary-card">
      <b>RESUMO DO DEPOIMENTO</b>
      <p>{config.name} colaborou e foi liberada. O depoimento está salvo no arquivo do caso.</p>

      <section>
        <span>REAÇÃO AO LONGO DO DEPOIMENTO</span>
        <div className="ii-trail" aria-label="Intensidade emocional a cada resposta">
          {trail.map((q,i)=>{
            const level = emotionLevel(emotionOf(q!.expression ?? 'neutral'))
            return <i key={q!.id+i} title={q!.question} style={{height:`${14+level*.3}px`,background:dot(level)}}/>
          })}
        </div>
        <p>Pressão final: <b>{pressure}%</b> · Estado: <b>{peak}</b></p>
      </section>

      <section>
        <span>PISTAS ANOTADAS ({found.length}{found.length+missed.length>0 ? ` DE ${found.length+missed.length}` : ''})</span>
        {found.length===0 && <p>Nenhuma pista anotada.</p>}
        <ul>{found.map(c=><li key={c}>{clueTitle(c) ?? c}</li>)}</ul>
      </section>

      {missed.length>0 && (
        <section>
          <span>ESCAPARAM ({missed.length})</span>
          <p>Havia pistas em respostas que você não marcou:</p>
          <ul className="miss">{missed.map(m=><li key={m.clue}>“{m.question}”</li>)}</ul>
          <p>Reveja em Anotações e toque nas frases que faltaram.</p>
        </section>
      )}

    </div>
  )
}
