import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import InterrogationVideo from './InterrogationVideo'
import DialogueChoices from './DialogueChoices'
import { applyAnswer, askedQuestions, between, getQuestion, pendingQuestions, typingDuration } from './logic'
import type { VideoDirector } from './videoDirector'
import type { InterrogationConfig, InterrogationProgress } from './types'
import './interrogation.css'

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

const reduceMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const mmss = (s:number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

/**
 * Interrogatório em vídeo, sem dados de personagem dentro do componente.
 * Perguntas, respostas, desbloqueios, pistas e estados de vídeo vêm todos do `config`.
 */
export default function VideoInterrogation({config,progress,onProgress,onClue,onComplete,onBack,onReturn}:Props){
  const [phase,setPhase] = useState<Phase>('idle')
  const [activeId,setActiveId] = useState<string|null>(null)
  const [typed,setTyped] = useState(0)
  const [last,setLast] = useState<{q:string;a:string}|null>(null)
  const [closing,setClosing] = useState(false)
  const [clock,setClock] = useState(0)
  const director = useRef<VideoDirector|null>(null)
  const timers = useRef<number[]>([])
  const progressRef = useRef(progress)
  progressRef.current = progress
  const finished = progress.completed && !closing

  const later = useCallback((fn:()=>void, ms:number)=>{
    const id = window.setTimeout(fn,ms)
    timers.current.push(id)
  },[])

  // se saiu no meio de uma pergunta, ela continua disponível
  useEffect(()=>{
    if(progressRef.current.currentQuestion) onProgress({...progressRef.current,currentQuestion:null})
    const id = window.setInterval(()=>setClock(c=>c+1),1000)
    const timerList = timers.current
    return ()=>{ clearInterval(id); timerList.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const setDirector = useCallback((d:VideoDirector|null)=>{ director.current = d },[])

  const ask = (id:string)=>{
    const q = getQuestion(config,id)
    if(!q || phase!=='idle') return
    director.current?.resume()
    setActiveId(id)
    setTyped(0)
    setPhase('asking')
    onProgress({...progressRef.current,currentQuestion:id})
    // Lívia ouve a pergunta: o vídeo continua parado
    later(()=>{
      setPhase('answering')
      director.current?.play(q.videoState)
      const total = reduceMotion() ? 0 : typingDuration(q.answer)
      if(total===0){ setTyped(q.answer.length) }
      else {
        const start = performance.now()
        const step = ()=>{
          const n = Math.min(q.answer.length, Math.floor((performance.now()-start)/(total/q.answer.length)))
          setTyped(n)
          if(n<q.answer.length) later(step,40)
        }
        step()
      }
      // termina de falar, segura o último quadro e volta a ficar parada
      later(()=>{
        director.current?.freeze()
        setPhase('holding')
        later(()=>{
          const { progress:next, clues } = applyAnswer(config,progressRef.current,id)
          clues.forEach(onClue)
          setLast({q:q.question,a:q.answer})
          onProgress(next)
          director.current?.idle()
          setActiveId(null)
          if(next.completed){
            setClosing(true)
            later(()=>{ setClosing(false); setPhase('idle'); onComplete() },1500)
          } else setPhase('idle')
        }, between(400,900))
      }, total+350)
    }, between(700,1200))
  }

  const active = activeId ? getQuestion(config,activeId) : undefined
  const pending = pendingQuestions(config,progress)
  const asked = askedQuestions(config,progress)
  const busy = phase!=='idle' || closing

  return (
    <main className="iv" onPointerDown={()=>director.current?.resume()}>
      <InterrogationVideo config={config} onDirector={setDirector}>
        <div className="iv-shade" aria-hidden="true"/>
        <button className="iv-back" onClick={onBack} aria-label="Sair do depoimento"><ChevronLeft/></button>
        <div className="iv-rec"><i/>REC <span>{mmss(clock)}</span></div>
        <div className="iv-label">{config.depositionLabel}</div>
        <div className="iv-name">{config.name.toUpperCase()}</div>
      </InterrogationVideo>

      <section className="iv-panel" aria-live="polite">
        {busy && active && (
          <div className="iv-dialogue">
            <div className="iv-line iv-lemos"><small>LEMOS</small><p>{active.question}</p></div>
            {(phase==='answering'||phase==='holding') && (
              <div className="iv-line iv-target"><small>{config.name.split(' ')[0].toUpperCase()}</small>
                <p>“{active.answer.slice(0,typed)}<span className="iv-caret" hidden={typed>=active.answer.length}/>{typed>=active.answer.length?'”':''}</p>
              </div>
            )}
          </div>
        )}

        {!busy && last && (
          <div className="iv-last">
            <small>{config.name.split(' ')[0].toUpperCase()}</small>
            <p>“{last.a}”</p>
          </div>
        )}

        {closing && !active && last && (
          <div className="iv-last"><small>{config.name.split(' ')[0].toUpperCase()}</small><p>“{last.a}”</p></div>
        )}

        {finished && (
          <div className="iv-done">
            <b>{config.closingLabel}</b>
            <button className="iv-return" onClick={onReturn}>VOLTAR AO CASO</button>
          </div>
        )}

        {!busy && (
          <DialogueChoices pending={finished?[]:pending} asked={asked} onPick={ask}/>
        )}
      </section>
    </main>
  )
}
