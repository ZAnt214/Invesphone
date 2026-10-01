import { useLayoutEffect, useRef, useState } from 'react'
import type { InterrogationConfig, InterrogationProgress } from './types'
import { clueReport, clueSummary, getQuestion, questionPressure, stagesOf } from './logic'
import { emotionLevel, emotionOf } from './emotions'

type Props = {
  config:InterrogationConfig
  progress:InterrogationProgress
  clueTitle:(id:string)=>string|undefined
  /** Abre o quadro de assinatura. */
  onSign:()=>void
}

/** Cor de cada ponto: da calma (verde) à intensidade máxima (rosa), como no medidor de emoção. */
const dot = (level:number) => `hsl(${Math.round(150-level*1.5)} 62% 52%)`

const W = 320, H = 72, PX = 10, PY = 10

/** Curva da pressão acumulada a cada resposta, com os estágios e a emoção de cada resposta em pontos. */
function PressureCurve({config,progress}:{config:InterrogationConfig;progress:InterrogationProgress}){
  const qs = progress.asked.map(id=>getQuestion(config,id)).filter(q=>!!q)
  if(qs.length===0) return null
  let acc = 0
  const pts = qs.map((q,i)=>{
    acc = Math.min(100,acc+questionPressure(q!))
    const x = qs.length===1 ? W/2 : PX + (W-2*PX)*i/(qs.length-1)
    const y = H-PY - (H-2*PY)*acc/100
    return { x, y, q:q!, level:emotionLevel(emotionOf(q!.expression ?? 'neutral')) }
  })
  const line = pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length-1].x.toFixed(1)} ${H-PY} L${pts[0].x.toFixed(1)} ${H-PY} Z`
  const yOf = (v:number) => H-PY-(H-2*PY)*v/100
  return (
    <svg className="ds-curve" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pressão acumulada a cada resposta">
      <defs>
        <linearGradient id="ds-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b5301f" stopOpacity=".32"/><stop offset="1" stopColor="#b5301f" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {stagesOf(config).map(s=>(
        <g key={s.at}>
          <line x1={PX} x2={W-PX} y1={yOf(s.at)} y2={yOf(s.at)} className="ds-stage"/>
          <text x={PX+2} y={yOf(s.at)-3}>{s.label}</text>
        </g>
      ))}
      <path d={area} fill="url(#ds-fill)"/>
      <path d={line} className="ds-line"/>
      {pts.map((p,i)=><circle key={p.q.id+i} cx={p.x} cy={p.y} r="3.6" fill={dot(p.level)} stroke="#efe6cf" strokeWidth="1.5"><title>{p.q.question}</title></circle>)}
    </svg>
  )
}

/** Resumo do depoimento: ficha do caso com o veredito, números, a curva da pressão e as pistas. */
export default function DepositionSummary({config,progress,clueTitle,onSign}:Props){
  const { found, missed } = clueReport(config,progress)
  const total = clueSummary(config,progress).total
  const pressure = progress.pressure ?? 0
  const reached = stagesOf(config).filter(s=>pressure>=s.at)
  const peak = reached.length ? reached[reached.length-1].label : 'CONTROLADA'
  const ratio = total ? found.length/total : 1
  const verdict = ratio>=1 ? 'COMPLETO' : ratio>=.5 ? 'PARCIAL' : 'INCOMPLETO'
  const first = config.name.split(' ')[0]

  // a ficha sempre aparece inteira, sem rolar: se o conteúdo passar da altura disponível, a folha encolhe para caber
  const desk = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLElement>(null)
  const [fit,setFit] = useState(1)
  useLayoutEffect(()=>{
    const d = desk.current, p = paper.current
    if(!d || !p) return
    const measure = () => {
      const avail = d.clientHeight - 16
      setFit(Math.max(.5,Math.min(1,avail/p.offsetHeight)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(d); ro.observe(p)
    return ()=>ro.disconnect()
  },[])

  return (
    <div className="ds-desk" ref={desk}>
      <article className="ds" ref={paper} style={{transform:`rotate(-.5deg) scale(${fit})`}}>
        <i className="ds-clip" aria-hidden="true"/>
        <header className="ds-head">
          <small>DHPP · HOMICÍDIOS · {config.depositionLabel.replace('DEPOIMENTO','Nº')}</small>
          <h3>FICHA DE DEPOIMENTO</h3>
                    <span className={`ds-stamp ${verdict.toLowerCase()}`}>{verdict}</span>
        </header>

        <dl className="ds-fields">
          <div><dt>Depoente</dt><dd>{config.name}</dd></div>
          <div><dt>Situação</dt><dd>Liberada após colaborar</dd></div>
          <div><dt>Estado ao final</dt><dd>{peak.toLowerCase()} · pressão {pressure}%</dd></div>
          <div><dt>Pistas obtidas</dt><dd>{found.length} de {total}</dd></div>
        </dl>

        <section className="ds-block">
          <h4>I. Curva de pressão</h4>
          <PressureCurve config={config} progress={progress}/>
          <p className="ds-legend"><i style={{background:dot(10)}}/>calma <i style={{background:dot(50)}}/>tensa <i style={{background:dot(90)}}/>abalada · um ponto por resposta</p>
        </section>

        <section className="ds-block">
          <h4>II. Pistas obtidas</h4>
          {found.length===0
            ? <p className="ds-empty">Nada foi anotado.</p>
            : <ul className="ds-tags">{found.map(c=><li key={c}><mark>{clueTitle(c) ?? c}</mark></li>)}</ul>}
        </section>

        {missed.length>0 && (
          <section className="ds-block">
            <h4>III. Não anotado · reveja em Anotações</h4>
            <ul className="ds-tags missed">
              {missed.map(m=><li key={m.clue}><span className="redact" aria-hidden="true"/><em>em: “{m.question}”</em></li>)}
            </ul>
            </section>
        )}

        <section className="ds-sign">
          <h4>Assinatura do responsável</h4>
          <button type="button" className={`ds-sign-box${progress.signature ? ' signed' : ''}`} onClick={onSign}
            aria-label={progress.signature ? 'Assinar de novo' : 'Assinar o depoimento'}>
            {progress.signature
              ? <img src={progress.signature} alt="Assinatura"/>
              : <span>✎ Toque aqui para assinar</span>}
          </button>
          {progress.signedAt && <small>Assinado em {new Date(progress.signedAt).toLocaleDateString('pt-BR')} · toque para refazer</small>}
        </section>

        <footer className="ds-foot">Registrado no arquivo do caso. {first}, liberada.</footer>
      </article>
    </div>
  )
}
