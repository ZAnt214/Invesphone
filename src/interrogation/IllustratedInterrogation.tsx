import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import CharacterPortrait from './CharacterPortrait'
import DialogueChoices from './DialogueChoices'
import { applyAnswer, askedQuestions, getQuestion, pendingQuestions } from './logic'
import type { Expression } from './CharacterPortrait'
import type { InterrogationConfig, InterrogationProgress } from './types'
import './illustrated-interrogation.css'

type Phase = 'idle'|'asking'|'answering'|'holding'
type Props = {
  config:InterrogationConfig
  progress:InterrogationProgress
  onProgress:(p:InterrogationProgress)=>void
  onClue:(id:string)=>void
  onComplete:()=>void
  onBack:()=>void
  onReturn:()=>void
}

const wait = (ms:number) => new Promise<void>(resolve=>window.setTimeout(resolve,ms))

export default function IllustratedInterrogation({config,progress,onProgress,onClue,onComplete,onBack,onReturn}:Props){
  const [phase,setPhase]=useState<Phase>('idle')
  const [activeId,setActiveId]=useState<string|null>(null)
  const [answerText,setAnswerText]=useState('')
  const [expression,setExpression]=useState<Expression>('tired')
  const timers=useRef<number[]>([])
  const progressRef=useRef(progress)
  progressRef.current=progress

  useEffect(()=>()=>timers.current.forEach(window.clearTimeout),[])

  useEffect(()=>{
    if(progressRef.current.currentQuestion){
      onProgress({...progressRef.current,currentQuestion:null})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const later=useCallback((fn:()=>void,ms:number)=>{
    const id=window.setTimeout(fn,ms)
    timers.current.push(id)
  },[])

  const revealAnswer=(text:string,onDone:()=>void)=>{
    setAnswerText('')
    let i=0
    const tick=()=>{
      i=Math.min(text.length,i+2)
      setAnswerText(text.slice(0,i))
      if(i<text.length) later(tick,24)
      else later(onDone,650)
    }
    later(tick,120)
  }

  const ask=(id:string)=>{
    const q=getQuestion(config,id)
    if(!q||phase!=='idle')return

    setActiveId(id)
    setPhase('asking')
    setExpression('neutral')
    onProgress({...progressRef.current,currentQuestion:id})

    later(()=>{
      setExpression(q.expression??'uncomfortable')
      setPhase('answering')

      revealAnswer(q.answer,()=>{
        setPhase('holding')
        later(()=>{
          const {progress:next,clues}=applyAnswer(config,progressRef.current,id)
          clues.forEach(onClue)
          onProgress(next)
          setActiveId(null)
          setAnswerText('')
          setExpression(next.completed?'shaken':'tired')

          if(next.completed){
            onComplete()
          }
          setPhase('idle')
        },700)
      })
    },700)
  }

  const active=activeId?getQuestion(config,activeId):undefined
  const pending=pendingQuestions(config,progress)
  const asked=askedQuestions(config,progress)
  const finished=progress.completed
  const busy=phase!=='idle'

  return (
    <main className="ii">
      <section className="ii-stage">
        <CharacterPortrait personId={config.personId} expression={expression} speaking={phase==='answering'}/>
        <div className="ii-camera-fx" aria-hidden="true"/>
        <button className="ii-back" onClick={onBack} aria-label="Sair do depoimento"><ChevronLeft/></button>
        <div className="ii-rec"><i/>REC</div>
        <div className="ii-deposition">{config.depositionLabel}</div>
        <div className="ii-status">
          <span>{expression==='neutral'?'ESCUTANDO':phase==='answering'?'RESPONDENDO':'AGUARDANDO'}</span>
          <b>{config.name.toUpperCase()}</b>
        </div>
      </section>

      <section className="ii-panel">
        {active&&busy&&(
          <div className="ii-conversation">
            <article className="ii-line ii-question">
              <small>LEMOS</small>
              <p>{active.question}</p>
            </article>
            {(phase==='answering'||phase==='holding')&&(
              <article className="ii-line ii-answer">
                <small>LÍVIA</small>
                <p>{answerText}<i className={phase==='answering'?'ii-caret':''}/></p>
              </article>
            )}
          </div>
        )}

        {finished&&!busy&&(
          <div className="ii-complete">
            <span>04:XX</span>
            <b>{config.closingLabel}</b>
            <p>O depoimento foi salvo no arquivo do caso.</p>
            <button onClick={onReturn}>VOLTAR AO CASO</button>
          </div>
        )}

        {!busy&&(
          <DialogueChoices pending={finished?[]:pending} asked={asked} onPick={ask}/>
        )}
      </section>
    </main>
  )
}
