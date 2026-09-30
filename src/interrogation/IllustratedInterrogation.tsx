import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import CharacterPortrait from '../characters/CharacterPortrait'
import type { Speech } from '../characters/CharacterPortrait'
import { getCharacter } from '../characters/characters'
import type { Expression } from '../characters/types'
import DialogueChoices from './DialogueChoices'
import { applyAnswer, askedQuestions, between, getQuestion, pendingQuestions, subtitleChunks, subtitleDuration } from './logic'
import type { InterrogationConfig, InterrogationProgress } from './types'
import './illustrated-interrogation.css'

type Phase = 'idle'|'asking'|'answering'|'holding'
type Props = {
  config:InterrogationConfig
  progress:InterrogationProgress
  onProgress:(p:InterrogationProgress)=>void
  onClue:(id:string)=>void
  /** Chamado uma vez, quando a pergunta final é respondida. */
  onComplete:()=>void
  /** Sair no meio do depoimento (o progresso fica salvo). */
  onBack:()=>void
  /** Botão "VOLTAR AO CASO", disponível depois de encerrar. */
  onReturn:()=>void
}

/** Tempo em que a boca se mexe numa legenda: um pouco menos que o tempo de leitura. */
const speakingTime = (text:string) => Math.min(subtitleDuration(text)-150, Math.max(700,text.length*68+300))

/**
 * Interrogatório com retrato ilustrado. Serve para qualquer personagem em src/characters:
 * as perguntas, as expressões, as pistas e os desbloqueios vêm do `config`.
 */
export default function IllustratedInterrogation({config,progress,onProgress,onClue,onComplete,onBack,onReturn}:Props){
  const character = getCharacter(config.personId)
  const idleExpression:Expression = config.idleExpression ?? 'neutral'
  const [phase,setPhase] = useState<Phase>('idle')
  const [activeId,setActiveId] = useState<string|null>(null)
  const [expression,setExpression] = useState<Expression>(idleExpression)
  const [subtitle,setSubtitle] = useState<string|null>(null)
  const [speech,setSpeech] = useState<Speech|null>(null)
  const timers = useRef<number[]>([])
  const progressRef = useRef(progress)
  progressRef.current = progress

  useEffect(()=>{
    const list = timers.current
    return ()=>list.forEach(window.clearTimeout)
  },[])

  // se saiu no meio de uma pergunta, ela continua disponível
  useEffect(()=>{
    if(progressRef.current.currentQuestion) onProgress({...progressRef.current,currentQuestion:null})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const later = useCallback((fn:()=>void,ms:number)=>{
    timers.current.push(window.setTimeout(fn,ms))
  },[])

  const ask = (id:string)=>{
    const q = getQuestion(config,id)
    if(!q || phase!=='idle') return
    setActiveId(id)
    setPhase('asking')
    onProgress({...progressRef.current,currentQuestion:id})

    // ela ouve a pergunta antes de responder
    later(()=>{
      setExpression(q.expression ?? 'uncomfortable')
      setPhase('answering')
      // a resposta vai aparecendo em legendas curtas, e a boca segue o texto de cada uma
      const chunks = subtitleChunks(q.answer)
      let at = 250
      chunks.forEach((c,i)=>{
        later(()=>{
          setSubtitle(c)
          setSpeech({id:`${id}-${i}`,text:c,duration:speakingTime(c)})
        },at)
        at += subtitleDuration(c)+120
      })
      later(()=>{
        setSpeech(null)
        setPhase('holding')
        later(()=>{
          const { progress:next, clues } = applyAnswer(config,progressRef.current,id)
          clues.forEach(onClue)
          onProgress(next)
          setSubtitle(null)
          setActiveId(null)
          setExpression(next.completed ? 'shaken' : idleExpression)
          setPhase('idle')
          if(next.completed) onComplete()
        }, between(450,900))
      }, at+150)
    }, between(700,1200))
  }

  const active = activeId ? getQuestion(config,activeId) : undefined
  const pending = pendingQuestions(config,progress)
  const asked = askedQuestions(config,progress)
  const finished = progress.completed
  const busy = phase!=='idle'

  if(!character) return <main className="ii"><div className="ii-portrait-fallback">Retrato indisponível</div></main>

  const hud = !character.portrait.hasBakedHud
  const crop = character.portrait.crop
  return (
    <main className="ii">
      <section className="ii-stage" style={{aspectRatio:`${crop.w}/${crop.h}`}}>
        <CharacterPortrait character={character} expression={expression} speech={speech}/>
        <div className="ii-camera-fx" aria-hidden="true"/>
        <button className="ii-back" onClick={onBack} aria-label="Sair do depoimento"><ChevronLeft/></button>
        {hud && <>
          <div className="ii-rec"><i/>REC</div>
          <div className="ii-deposition">{config.depositionLabel}</div>
        </>}
        <div className="ii-mark" aria-hidden="true"><b>DHPP</b><i/><span>HOMICÍDIOS</span></div>
        <div className="ii-sub" aria-live="polite">{subtitle && <span key={subtitle}>{subtitle}</span>}</div>
        <div className="ii-status">
          <span>{phase==='answering'?'RESPONDENDO':phase==='asking'?'ESCUTANDO':'AGUARDANDO'}</span>
          <b>{config.name.toUpperCase()}</b>
        </div>
      </section>

      <section className="ii-panel">
        {active && busy && (
          <div className="ii-conversation">
            <article className="ii-line ii-question">
              <small>LEMOS</small>
              <p>{active.question}</p>
            </article>
          </div>
        )}

        {finished && !busy && (
          <div className="ii-complete">
            <b>{config.closingLabel}</b>
            <p>O depoimento foi salvo no arquivo do caso.</p>
            <button onClick={onReturn}>VOLTAR AO CASO</button>
          </div>
        )}

        {!busy && (
          <DialogueChoices pending={finished?[]:pending} asked={asked} onPick={ask}/>
        )}
      </section>
    </main>
  )
}
