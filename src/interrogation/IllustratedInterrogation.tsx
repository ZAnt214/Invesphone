import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import CharacterPortrait from '../characters/CharacterPortrait'
import type { Speech } from '../characters/CharacterPortrait'
import { getCharacter } from '../characters/characters'
import type { Expression } from '../characters/types'
import AnswerNotes from './AnswerNotes'
import QuestionPager from './QuestionPager'
import EmotionMeter from './EmotionMeter'
import { applyAnswer, askedQuestions, between, clueSummary, getQuestion, pendingQuestions, subtitleChunks, subtitleDuration } from './logic'
import type { InterrogationConfig, InterrogationProgress } from './types'
import './illustrated-interrogation.css'

type Phase = 'idle'|'asking'|'answering'|'holding'
type Props = {
  config:InterrogationConfig
  progress:InterrogationProgress
  onProgress:(p:InterrogationProgress)=>void
  onClue:(id:string)=>void
  /** Nome legível de uma pista, para avisar o jogador quando ela é registrada. */
  clueTitle?:(id:string)=>string|undefined
  /** Pistas que o jogador já tem (de qualquer depoimento ou cena): liberam as confrontações. */
  registeredClues?:string[]
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
export default function IllustratedInterrogation({config,progress,onProgress,onClue,clueTitle=()=>undefined,registeredClues=[],onComplete,onBack,onReturn}:Props){
  const character = getCharacter(config.personId)
  const idleExpression:Expression = config.idleExpression ?? 'neutral'
  const [phase,setPhase] = useState<Phase>('idle')
  const [activeId,setActiveId] = useState<string|null>(null)
  const [expression,setExpression] = useState<Expression>(idleExpression)
  const [subtitle,setSubtitle] = useState<string|null>(null)
  const [speech,setSpeech] = useState<Speech|null>(null)
  /** Última pergunta respondida: a resposta fica na tela para o jogador anotar pistas. */
  const [lastId,setLastId] = useState<string|null>(null)
  const [openId,setOpenId] = useState<string|null>(null)
  /** Aba do painel: perguntar ou rever as respostas anotadas. */
  const [tab,setTab] = useState<'ask'|'notes'>('ask')
  /** Mostra a resposta recém-dada para anotar pistas, até o jogador seguir em frente. */
  const [review,setReview] = useState(false)
  const [toast,setToast] = useState<string|null>(null)
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
    setLastId(null)
    setReview(false)
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
          setLastId(id)
          setReview(!!q.highlights)
          setExpression(next.completed ? 'shaken' : idleExpression)
          setPhase('idle')
          if(next.completed) onComplete()
        }, between(450,900))
      }, at+150)
    }, between(700,1200))
  }

  const note = (key:string, clue:string|undefined)=>{
    const cur = progressRef.current
    if((cur.noted ?? []).includes(key)) return
    onProgress({...cur,noted:[...(cur.noted ?? []),key]})
    if(clue){
      onClue(clue); navigator.vibrate?.(14)
      setToast(clueTitle(clue) ?? clue)
      later(()=>setToast(null),2600)
    }
  }

  const active = activeId ? getQuestion(config,activeId) : undefined
  const last = lastId && !activeId ? getQuestion(config,lastId) : undefined
  const summary = clueSummary(config,progress)
  const noted = progress.noted ?? []
  const pending = pendingQuestions(config,progress,registeredClues)
  const asked = askedQuestions(config,progress)
  const finished = progress.completed
  const busy = phase!=='idle'

  if(!character) return <main className="ii"><div className="ii-portrait-fallback">Retrato indisponível</div></main>

  const hud = !character.portrait.hasBakedHud
  return (
    <main className="ii">
      <section className="ii-stage">
        <CharacterPortrait character={character} expression={expression} speech={speech}/>
        <div className="ii-camera-fx" aria-hidden="true"/>
        <button className="ii-back" onClick={onBack} aria-label="Sair do depoimento"><ChevronLeft/></button>
        {hud && <>
          <div className="ii-rec"><i/>REC</div>
          <div className="ii-deposition">{config.depositionLabel}</div>
        </>}
        <div className="ii-mark" aria-hidden="true"><b>DHPP</b><i/><span>HOMICÍDIOS</span></div>
        {toast && <div className="ii-toast" key={toast} role="status"><i/><span><small>NOVA PISTA REGISTRADA</small><b>{toast}</b></span></div>}
        <div className="ii-sub" aria-live="polite">{subtitle && <span key={subtitle}>{subtitle}</span>}</div>
        <div className="ii-status">
          <span>{phase==='answering'?'RESPONDENDO':phase==='asking'?'ESCUTANDO':'AGUARDANDO'}</span>
          <b>{config.name.toUpperCase()}</b>
        </div>
      </section>

      <section className="ii-panel">
        <EmotionMeter name={config.name} expression={expression}/>

        <div className="ii-main">
          {tab==='ask' && <>
            {active && busy && (
              <article className="ii-line ii-question">
                <small>LEMOS</small>
                <p>{active.question}</p>
              </article>
            )}

            {!busy && review && last && (
              <>
                <AnswerNotes question={last} noted={noted} clueTitle={clueTitle} onNote={note} summary={summary}/>
                <button className="ii-next" onClick={()=>setReview(false)}>PERGUNTAR MAIS</button>
              </>
            )}

            {!busy && !review && finished && (
              <div className="ii-complete">
                <b>{config.closingLabel}</b>
                <p>O depoimento foi salvo no arquivo do caso.</p>
                {summary.total>0 && <p className="ii-summary">Pistas anotadas: {summary.found} de {summary.total}. Veja as respostas em Anotações.</p>}
                <button onClick={onReturn}>VOLTAR AO CASO</button>
              </div>
            )}

            {!busy && !review && !finished && (
              <QuestionPager questions={pending} onPick={ask} clueTitle={clueTitle}/>
            )}
          </>}

          {tab==='notes' && !busy && (
            <ul className="ii-notes">
              {asked.length===0 && <li className="ii-empty">Nenhuma resposta ainda.</li>}
              {asked.map(q=>(
                <li key={q.id} className={openId===q.id ? 'open' : ''}>
                  <button type="button" className="iv-asked-row" onClick={()=>setOpenId(o=>o===q.id?null:q.id)} aria-expanded={openId===q.id}>
                    <span>{q.question}</span><ChevronDown className="chev"/>
                  </button>
                  {openId===q.id && (q.highlights
                    ? <AnswerNotes question={q} compact noted={noted} clueTitle={clueTitle} onNote={note}/>
                    : <article className="ii-line ii-answer compact"><p>{q.answer}</p></article>)}
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav className="ii-tabs" aria-label="Painel do depoimento">
          <button className={tab==='ask'?'on':''} disabled={busy} onClick={()=>setTab('ask')}>PERGUNTAR</button>
          <button className={tab==='notes'?'on':''} disabled={busy} onClick={()=>setTab('notes')}>
            ANOTAÇÕES{summary.total>0 && <em>{summary.found}/{summary.total}</em>}
          </button>
        </nav>
      </section>
    </main>
  )
}
