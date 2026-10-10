import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import CharacterPortrait from '../characters/CharacterPortrait'
import type { Speech } from '../characters/CharacterPortrait'
import { getCharacter } from '../characters/characters'
import type { Expression } from '../characters/types'
import AnswerNotes from './AnswerNotes'
import QuestionPager from './QuestionPager'
import EmotionMeter from './EmotionMeter'
import DepositionSummary from './DepositionSummary'
import SignaturePad from './SignaturePad'
import Tutorial from './Tutorial'
import RoomFx from './RoomFx'
import { roomSfx } from './roomAudio'
import { sfx } from '../sfx'
import type { TutorialStep } from './Tutorial'
import { applyAnswer, askedQuestions, between, clueSummary, getQuestion, pendingQuestions, stageIndex, stagesOf, subtitleChunks, subtitleDuration, waitingExpression } from './logic'
import type { InterrogationConfig, InterrogationProgress } from './types'
import './illustrated-interrogation.css'

type Phase = 'idle'|'asking'|'answering'|'holding'
type Props = {
  config:InterrogationConfig
  progress:InterrogationProgress
  onProgress:(p:InterrogationProgress)=>void
  onClue:(id:string)=>void
  /** Uma resposta pode revelar uma pessoa até então desconhecida no caso. */
  onPersonDiscovered?:(id:string)=>void
  /** Nome legível de uma pista, para avisar o jogador quando ela é registrada. */
  clueTitle?:(id:string)=>string|undefined
  /** Pistas que o jogador já tem (de qualquer depoimento ou cena): liberam as confrontações. */
  registeredClues?:string[]
  /** Materiais que a equipe já entregou (ids das diligências): liberam as perguntas de apresentar material. */
  registeredMaterials?:string[]
  materialTitle?:(id:string)=>string|undefined
  /** Chamado uma vez, quando a pergunta final é respondida. */
  onComplete:()=>void
  /** Sair no meio do depoimento (o progresso fica salvo). */
  onBack:()=>void
  /** Botão "VOLTAR AO CASO", disponível depois de encerrar. */
  onReturn:()=>void
}

const TUTORIAL_KEY = 'invesphone.depoimento-tutorial.v1'
const tutorialSeen = () => { try { return localStorage.getItem(TUTORIAL_KEY)==='1' } catch { return true } }

const tutorialSteps = (name:string):TutorialStep[] => [
  { target:'.ii-stage', place:'panel', title:'Observe '+name.split(' ')[0],
    text:'As respostas aparecem em legendas. A expressão e o jeito de falar mostram quando algo incomoda.' },
  { target:'.ii-emo', place:'panel', title:'Medidor de emoção',
    text:'Mostra como a pessoa se sente. A barra fina é a pressão: cada pergunta dura aumenta. Nos marcadores ela muda de postura e pode ceder.' },
  { target:'.ii-main', place:'stage', title:'Perguntas',
    text:'Toque numa pergunta para fazê-la. Cada resposta pode liberar novas perguntas. As de confronto só abrem com a pista certa.' },
  { target:'.ii-main', place:'stage', demo:true, title:'Anote as pistas',
    text:'Depois que ela responde, a resposta aparece dividida em frases. Toque nas que parecem importantes: se forem relevantes, viram pista; se não, ficam marcadas sem valor.' },
  { target:'.ii-tabs', place:'tabs', title:'Anotações',
    text:'Releia tudo o que já foi dito e veja quantas pistas você anotou. O ? reabre estas dicas.' }
]

/** Contador da gravação, como no visor da câmera: atualiza sozinho, sem redesenhar o depoimento inteiro. */
function RecClock(){
  const [t,setT] = useState(0)
  useEffect(()=>{ const id = window.setInterval(()=>setT(v=>v+1),1000); return ()=>window.clearInterval(id) },[])
  const p = (n:number)=>String(n).padStart(2,'0')
  return <b className="ii-clock">{p(Math.floor(t/3600))}:{p(Math.floor(t/60)%60)}:{p(t%60)}</b>
}

/** Tempo em que a boca se mexe numa legenda: um pouco menos que o tempo de leitura. */
const speakingTime = (text:string) => Math.min(subtitleDuration(text)-150, Math.max(700,text.length*68+300))

/**
 * Interrogatório com retrato ilustrado. Serve para qualquer personagem em src/characters:
 * as perguntas, as expressões, as pistas e os desbloqueios vêm do `config`.
 */
export default function IllustratedInterrogation({config,progress,onProgress,onClue,onPersonDiscovered=()=>undefined,clueTitle=()=>undefined,registeredClues=[],registeredMaterials=[],materialTitle=()=>undefined,onComplete,onBack,onReturn}:Props){
  const character = getCharacter(config.personId)
  const [phase,setPhase] = useState<Phase>('idle')
  const [activeId,setActiveId] = useState<string|null>(null)
  const [expression,setExpression] = useState<Expression>(()=>waitingExpression(config,progress.pressure ?? 0))
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
  /** Aviso de que a pressão passou de um estágio (ela está se abalando). */
  /** Mensagem de encerramento, mostrada logo depois da última resposta. */
  const [farewell,setFarewell] = useState(false)
  /** Depoimento já encerrado que o jogador reabriu para fazer perguntas novas (material ou prova que chegou depois). */
  // quem volta a um depoimento encerrado porque há pergunta nova entra direto nas perguntas, não no arquivo
  const [retaking,setRetaking] = useState(()=>progress.completed && pendingQuestions(config,progress,registeredClues,registeredMaterials).length>0)
  const [signing,setSigning] = useState(false)
  const [alert,setAlert] = useState<string|null>(null)
  const [tutorial,setTutorial] = useState(()=>!tutorialSeen())
  /** A lâmpada da sala falhando agora. */
  const [flicker,setFlicker] = useState(false)
  const closeTutorial = useCallback(()=>{
    setTutorial(false)
    try { localStorage.setItem(TUTORIAL_KEY,'1') } catch { /* sem armazenamento: só não lembra */ }
  },[])
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

  useEffect(()=>{ sfx.rec() },[])

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
    sfx.ask()
    roomSfx.write()
    later(()=>roomSfx.rustle(),500)
    onProgress({...progressRef.current,currentQuestion:id})

    // ela ouve a pergunta antes de responder
    later(()=>{
      setExpression(q.expression ?? 'uncomfortable')
      setPhase('answering')
      roomSfx.breath()
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
          const before = progressRef.current.pressure ?? 0
          const { progress:next, clues, people } = applyAnswer(config,progressRef.current,id)
          const after = next.pressure ?? 0
          const crossed = stageIndex(config,after) > stageIndex(config,before)
          if(crossed){
            const stage = stageIndex(config,after)
            sfx.pressure(stage)
            setAlert(stagesOf(config)[stage-1].label)
            later(()=>setAlert(null),3000)
          }
          clues.forEach(onClue)
          people.forEach(onPersonDiscovered)
          onProgress(next)
          setSubtitle(null)
          setActiveId(null)
          setLastId(id)
          setReview(!!q.highlights)
          setExpression(next.completed ? 'shaken' : waitingExpression(config,after))
          setPhase('idle')
          if(next.completed && !progressRef.current.completed){
            onComplete()
            setFarewell(true)
          }
        }, between(450,900))
      }, at+150)
    }, between(700,1200))
  }

  const note = (key:string, clue:string|undefined)=>{
    const cur = progressRef.current
    if((cur.noted ?? []).includes(key)) return
    onProgress({...cur,noted:[...(cur.noted ?? []),key]})
    if(!clue) sfx.note()
    if(clue){
      onClue(clue); sfx.clue(); roomSfx.underline()
      setToast(clueTitle(clue) ?? clue)
      later(()=>setToast(null),2600)
    }
  }

  const active = activeId ? getQuestion(config,activeId) : undefined
  const last = lastId && !activeId ? getQuestion(config,lastId) : undefined
  const summary = clueSummary(config,progress)
  const noted = progress.noted ?? []
  const pending = pendingQuestions(config,progress,registeredClues,registeredMaterials)
  const asked = askedQuestions(config,progress)
  const blocked = config.questions.filter(q=>progress.unlocked.includes(q.id) && !progress.asked.includes(q.id) && ((q.requiresClue && !registeredClues.includes(q.requiresClue)) || (q.requiresMaterial && !registeredMaterials.includes(q.requiresMaterial)))).length
  const finished = progress.completed
  const busy = phase!=='idle'

  // a mensagem de encerramento só começa a contar depois que o jogador terminou de anotar a última resposta
  const showFarewell = finished && farewell && !busy && !review
  useEffect(()=>{
    if(!showFarewell) return
    const t = window.setTimeout(onReturn,6500)
    return ()=>window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[showFarewell])

  if(!character) return <main className="ii"><div className="ii-portrait-fallback">Retrato indisponível</div></main>

  // olhar do Lemos: enquanto ele escolhe a pergunta, o foco desce para o caderno; quando o depoente fala, volta para o rosto
  const picking = phase==='idle' && tab==='ask' && !review && !showFarewell && (!finished || retaking) && !tutorial
  const focus = busy ? ' ii-listen' : picking ? ' ii-pick' : ''

  const hud = !character.portrait.hasBakedHud
  // depoimento já encerrado: o resumo vira um arquivo em papel, sem o retrato
  const fileMode = finished && !farewell && !retaking
  if(fileMode) return (
    <main className="ii ii-file">
      <header className="ii-filebar">
        <button onClick={onBack} aria-label="Sair do arquivo"><ChevronLeft/></button>
        <span>ARQUIVO DO CASO · {config.name.toUpperCase()}</span>
      </header>
      <section className="ii-panel">
        <div className="ii-main">
          {tab==='ask' && <>
            {pending.length>0 && (
              <button type="button" className="ii-retake" onClick={()=>{setRetaking(true);setTab('ask');setReview(false)}}>
                <b>RETOMAR DEPOIMENTO</b>
                <span>{pending.length} {pending.length>1?'perguntas novas':'pergunta nova'} com o que a equipe trouxe</span>
              </button>
            )}
            <DepositionSummary config={config} progress={progress} clueTitle={clueTitle} onSign={()=>setSigning(true)}/>
          </>}
          {tab==='notes' && (
            <ul className="ii-notes">
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
        <nav className="ii-tabs ii-tabs-file" aria-label="Arquivo do depoimento">
          <button className={tab==='ask'?'on':''} onClick={()=>setTab('ask')}>RESUMO</button>
          <button className={tab==='notes'?'on':''} onClick={()=>setTab('notes')}>
            ANOTAÇÕES{summary.total>0 && <em>{summary.found}/{summary.total}</em>}
          </button>
        </nav>
        {signing && <SignaturePad onCancel={()=>setSigning(false)} onSave={png=>{ onProgress({...progressRef.current,signature:png,signedAt:new Date().toISOString()}); setSigning(false); sfx.clue() }}/>}
        {toast && <div className="ii-file-toast" key={toast} role="status"><small>NOVA PISTA REGISTRADA</small><b>{toast}</b></div>}
      </section>
    </main>
  )
  return (
    <main className={'ii ii-room'+focus+(flicker?' ii-flicker':'')+(!busy && review && tab==='ask' ? ' ii-review' : '')} style={{'--p':(progress.pressure ?? 0)/100} as CSSProperties}>
      <section className="ii-stage">
        {/* sala de depoimentos vista pelos olhos do Lemos: a câmera respira junto com ele */}
        <div className="ii-scene">
          <div className="ii-far">
            <div className="ii-wall" aria-hidden="true"/>
            {/* o depoente à distância, sob a luminária */}
            <div className="ii-actor">
              <div className="ii-glow" aria-hidden="true"/>
              <CharacterPortrait character={character} expression={expression} speech={speech} transparent/>
              {/* a luminária balança de leve no fio, levando o facho junto */}
              <div className="ii-swing" aria-hidden="true">
                <div className="ii-lamp"><i className="cord"/><i className="shade"/><i className="bulb"/></div>
                <div className="ii-cone"/>
              </div>
            </div>
            <div className="ii-table" aria-hidden="true"/>
            <RoomFx pressure={progress.pressure ?? 0} onFlicker={setFlicker}/>
          </div>
          <div className="ii-near" aria-hidden="true">
            <div className="ii-steam"><i/><i/><i/></div>
            <div className="ii-mug"><b>DHPP</b></div>
          </div>
        </div>
        <div className="ii-camera-fx" aria-hidden="true"/>
        <button className="ii-back" onClick={onBack} aria-label="Sair do depoimento"><ChevronLeft/></button>
        {hud && <>
          <div className="ii-rec"><i/>REC <RecClock/><span>{config.depositionLabel}</span></div>
          <div className="ii-deposition ii-focus">FOCO · {busy ? config.name.split(' ')[0].toUpperCase() : 'CADERNO'}</div>
        </>}
        <div className="ii-mark" aria-hidden="true"><b>DHPP</b><i/><span>HOMICÍDIOS</span></div>
        {toast && <div className="ii-toast" key={toast} role="status"><i/><span><small>NOVA PISTA REGISTRADA</small><b>{toast}</b></span></div>}
        {alert && <div className="ii-press-alert" key={alert} role="status"><small>PRESSÃO SOBRE {config.name.split(' ')[0].toUpperCase()}</small><b>{alert}</b></div>}
        <div className="ii-sub" aria-live="polite">{subtitle && <span key={subtitle}>{subtitle}</span>}</div>
        <div className="ii-status">
          <span>{phase==='answering'?'RESPONDENDO':phase==='asking'?'ESCUTANDO':finished?'LIBERADA':'AGUARDANDO'}</span>
          <b>{config.name.toUpperCase()}</b>
        </div>
      </section>

      <section className="ii-panel">
        <h3 className="ii-pad-title" aria-hidden="true">{config.name.split(' ')[0]} · perguntas</h3>
        <button type="button" className="ii-pad-exit" onClick={onBack} disabled={busy}>Sair</button>
        <EmotionMeter name={config.name} expression={expression} pressure={progress.pressure ?? 0} stages={stagesOf(config)}/>

        <div className="ii-main">
          {tab==='ask' && <>
            {active && busy && (
              <article className="ii-line ii-question">
                <small>LEMOS</small>
                <p>{active.question}<svg className="ii-circle" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true"><path d="M8 22 C 6 6, 70 2, 92 12 C 102 18, 96 34, 60 37 C 30 40, 2 34, 6 18 C 8 12, 18 8, 26 7"/></svg></p>
              </article>
            )}

            {!busy && review && last && (
              <>
                <AnswerNotes question={last} noted={noted} clueTitle={clueTitle} onNote={note} summary={summary}/>
                <button className="ii-next" onClick={()=>{ roomSfx.page(); setReview(false) }}>{finished && !retaking ? 'CONTINUAR' : 'PERGUNTAR MAIS'}</button>
              </>
            )}

            {!busy && !review && finished && farewell && (
              <button type="button" className="ii-farewell" onClick={onReturn}>
                <small>DETETIVE</small>
                <p>{config.farewell ?? `Obrigado pela colaboração, ${config.name.split(' ')[0]}. Por enquanto é só. Você está liberada.`}</p>
                <em>{config.name.split(' ')[0]} deixa a sala…</em>
              </button>
            )}

            {!busy && !review && (!finished || retaking) && asked.length>0 && (
              <ul className="ii-done" aria-label="Últimas perguntas feitas">
                {asked.slice(-2).map(q=><li key={q.id}>{q.question}</li>)}
              </ul>
            )}
            {!busy && !review && (!finished || retaking) && (
              <QuestionPager questions={pending} onPick={ask} clueTitle={clueTitle} materialTitle={materialTitle} blocked={blocked}/>
            )}
            {!busy && !review && retaking && (
              <button type="button" className="ii-next ii-retake-end" onClick={()=>setRetaking(false)}>VOLTAR AO ARQUIVO</button>
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
          <button className={tab==='ask'?'on':''} disabled={busy} onClick={()=>{ if(tab!=='ask') roomSfx.page(); setTab('ask') }}>PERGUNTAR</button>
          <button className={tab==='notes'?'on':''} disabled={busy} onClick={()=>{ if(tab!=='notes') roomSfx.page(); setTab('notes') }}>
            ANOTAÇÕES{summary.total>0 && <em>{summary.found}/{summary.total}</em>}
          </button>
          <button className="help" aria-label="Como funciona" disabled={busy} onClick={()=>setTutorial(true)}>?</button>
        </nav>
      </section>
      {tutorial && !fileMode && <Tutorial steps={tutorialSteps(config.name)} onClose={closeTutorial}/>}
    </main>
  )
}
