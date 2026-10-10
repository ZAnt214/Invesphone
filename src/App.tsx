import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle, BatteryMedium, BookOpen, CalendarDays, Camera, Check,
  ChevronLeft, Clock, FileSearch, FileText, FolderSearch, Grid3X3,
  Home, Image as ImageIcon, Lock, MessageCircle, MicOff, Phone, PhoneOff,
  RotateCcw, Search, Send, Shield, Smartphone, Users, Volume2
} from 'lucide-react'
import { enableAudio, playConnect, playHangup, playTypingTick, startRingtone, stopRingtone } from './audio'
import HandsetHome from './HandsetHome'
import './team-messages.css'
import QualityPicker from './QualityPicker'
import FullscreenSetting from './FullscreenSetting'
import SoundSetting from './SoundSetting'
import ResetSetting from './ResetSetting'
import Diagnostics from './Diagnostics'
import IllustratedInterrogation from './interrogation/IllustratedInterrogation'
import { liviaInterrogation } from './interrogation/livia'
import { interrogations } from './interrogation/registry'
import { characters } from './characters/characters'
import CharacterFace from './characters/CharacterFace'
import { newProgress, pendingQuestions } from './interrogation/logic'
import { fileReport } from './case/report'
import { nextSteps, type StepGo, type GuideStepData } from './case/nextSteps'
import type { InterrogationProgress } from './interrogation/types'
import './handset-pages.css'
import { acceptedProofs, chapters, clues, disclaimer, people, teamMessages, victimMessages } from './case01'
import EvidenceViewer, { assetUrl } from './evidence/EvidenceViewer'
import { SAVE_KEY, SAVE_VERSION, advanceTask } from './case/caseSave'
import { summonRequires } from './case/depositions'
import { applyRequest, applyTopic, caseTeam, requestOk, teamDialogues, teamIntroMessages, teamMaterialRequests, teamMemberForSender, teamNews, topicOk, type TeamDialogue, type TeamMaterialRequest } from './team/teamData'

const SONIA_PHOTO = `${import.meta.env.BASE_URL}sonia.jpg`

type Screen = 'incoming'|'missed'|'active'|'launching'|'phone'|'task'|'ending'
type AppName = 'home'|'team'|'clues'|'interrogate'|'victim'|'chapters'|'livia'|'depo'|'settings'

type GameSave = {
  version:number
  screen:Screen
  app:AppName
  task:number
  clues:string[]
  interviewed:string[]
  orders:string[]
  /** Materiais solicitados à equipe (fotos, gravações, documentos e perícia). */
  requestedMaterials?:string[]
  /** Assuntos já conversados com os integrantes da equipe. */
  teamTopics?:string[]
  /** Ordem em que conversas e diligências aconteceram (as mensagens aparecem nessa ordem, não pelo horário do roteiro). */
  teamLog?:string[]
  /** Pessoas que já entraram formalmente no radar da investigação. */
  discoveredPeople?:string[]
  /** Pessoas que Lemos decidiu chamar para depoimento. */
  summonedPeople?:string[]
  score:number
  liviaInterrogation:InterrogationProgress
  /** Progresso dos depoimentos dos demais personagens, por id (Lívia tem campo próprio, de saves antigos). */
  depositions?:Record<string,InterrogationProgress>
  /** Depoimento aberto quando `app` é 'depo'. */
  depoId?:string
  interrogationOrigin?:'app'|'task'
  /** Conversa da equipe que o guia abre ao entrar em Equipe (some depois de usada). */
  teamFocus?:string
  /** Leva de anotações do guia da Home: até 3 sugestões que ficam fixas, vão sendo riscadas e só então são trocadas por outra leva. */
  guideBatch?:{id:string;done:string}[]
  /** Itens da leva atual que já foram feitos (ficam riscados até a leva inteira ser trocada). */
  guideDoneIds?:string[]
  ending?:'A'|'B'|'C'
}

const initialGame:GameSave = {
  version:SAVE_VERSION,screen:'incoming',app:'home',task:1,clues:[],interviewed:[],orders:[],discoveredPeople:['livia','caio','rafael','cida'],summonedPeople:['livia','caio'],score:1000,liviaInterrogation:newProgress(liviaInterrogation)
}

const progressOf = (g:GameSave, id:string):InterrogationProgress => id==='livia' ? g.liviaInterrogation : (g.depositions?.[id] ?? newProgress(interrogations[id]))
const withProgress = (g:GameSave, id:string, p:InterrogationProgress):GameSave => id==='livia' ? {...g,liviaInterrogation:p} : {...g,depositions:{...g.depositions,[id]:p}}
/** Abre o depoimento de uma pessoa; `origin` diz para onde o jogo volta ao sair. */
const openDeposition = (id:string, origin:'app'|'task') => (g:GameSave):GameSave => ({...g,screen:'phone',app:id==='livia'?'livia':'depo',depoId:id,interrogationOrigin:origin})

const callTurns = [
  {
    sonia:'Lemos? Desculpa a hora. Temos duas vítimas no Campo Belo.',
    replies:[
      'Estou acordado. O que temos no local?',
      'Quem encontrou as vítimas?'
    ]
  },
  {
    sonia:[
      'Casal. Ricardo e Helena Valença. A filha, Lívia, chegou de madrugada e encontrou os dois no quarto.',
      'A filha deles, Lívia. Chegou de madrugada e encontrou Ricardo e Helena no quarto.'
    ],
    replies:[
      'Ela viu alguém saindo da casa?',
      'A cena indica assalto?'
    ]
  },
  {
    sonia:[
      'Não. Ela diz que entrou, viu a casa revirada e foi direto ao quarto. Ninguém foi visto saindo.',
      'É o que ela está dizendo. A casa está revirada, mas a equipe ainda está fechando a primeira leitura.'
    ],
    replies:[
      'E a porta? Tem sinal de entrada forçada?',
      'Tem alguma coisa que já não fecha nessa versão?'
    ]
  },
  {
    sonia:[
      'A porta da frente está intacta. Sem arrombamento. E o cachorro estava preso no canil.',
      'Tem. Porta intacta, objetos de valor ainda na casa e o cachorro preso. Não parece um roubo simples.'
    ],
    replies:[
      'Preserva a entrada e puxa o log do alarme.',
      'Entendido. Abro o DHPP e acompanho daqui.'
    ],
    closing:[
      'Faz isso. Assim que tiver o log, me chama. Estou te colocando no caso desde o primeiro minuto.',
      'Ótimo. Assume o acompanhamento. Se alguma coisa sair do lugar, me chama na hora.'
    ]
  }
] as const

const operationalOrders = [
  [
    {id:'isolar_rua',label:'Enviar viatura para isolar a rua',spoken:'Sônia, manda uma viatura isolar a rua e segura qualquer movimentação em frente à casa.',confirm:'Pode deixar. Vou reforçar o perímetro agora.'},
    {id:'acionar_pericia',label:'Acionar perícia no quarto',spoken:'Aciona a perícia e coloca o quarto do casal como prioridade.',confirm:'Certo. Vou colocar o quarto como prioridade para a equipe técnica.'}
  ],
  [
    {id:'separar_depoimentos',label:'Separar Lívia e Caio',spoken:'Mantém a Lívia e o Caio separados. Não quero os dois alinhando versão.',confirm:'Entendido. Vou manter os dois separados até você falar com eles.'},
    {id:'preservar_casa',label:'Restringir acesso à casa',spoken:'Restringe o acesso à casa. Só entra quem estiver autorizado na ocorrência.',confirm:'Fechado. Vou limitar o acesso à equipe da ocorrência.'}
  ],
  [
    {id:'pedir_alarme',label:'Solicitar log do alarme',spoken:'Pede pra central puxar o log completo do alarme, principalmente as últimas ativações e desativações.',confirm:'Vou pedir agora. Assim que a central devolver o histórico, te encaminho.'},
    {id:'checar_cameras',label:'Checar câmeras da rua',spoken:'Manda alguém levantar câmeras da rua e das duas quadras próximas.',confirm:'Certo. Vou acionar a equipe externa para levantar as imagens.'}
  ],
  [
    {id:'preservar_painel',label:'Preservar painel do alarme',spoken:'Preserva o painel do alarme. Ninguém mexe nele antes da perícia.',confirm:'Entendido. Vou mandar isolar o painel agora.'},
    {id:'relatorio_preliminar',label:'Pedir relatório preliminar',spoken:'Me manda um relatório preliminar assim que a perícia fechar essa primeira leitura.',confirm:'Combinado. Assim que eles fecharem a primeira leitura, eu te envio.'}
  ]
] as const

const orderResultMessages:Record<string,{time:string;from:string;text:string}> = {
  isolar_rua:{time:'04:34',from:'Em Campo',text:'Viatura 27 no local. Rua isolada e circulação controlada.'},
  acionar_pericia:{time:'04:36',from:'Perícia',text:'Equipe acionada. Quarto do casal entrou como prioridade de processamento.'},
  separar_depoimentos:{time:'04:38',from:'Sônia',text:'Lívia e Caio foram mantidos separados para evitar alinhamento de versão.'},
  preservar_casa:{time:'04:39',from:'Em Campo',text:'Acesso à residência restrito. Só equipe técnica entra a partir de agora.'},
  pedir_alarme:{time:'04:43',from:'Inteligência',text:'Solicitação do log do alarme enviada à central. Aguardando retorno.'},
  checar_cameras:{time:'04:45',from:'Equipe Externa',text:'Levantando câmeras de portarias e comércios nas duas quadras próximas.'},
  preservar_painel:{time:'04:46',from:'Perícia',text:'Painel do alarme preservado e fotografado antes de qualquer manipulação.'},
  relatorio_preliminar:{time:'04:49',from:'Sônia',text:'Relatório preliminar solicitado. Te envio assim que a primeira leitura for fechada.'}
}


const tasks = [
  {chapter:0,title:'Chegada à Rua das Acácias',kind:'brief'},
  {chapter:0,title:'Varredura inicial da casa',kind:'scene'},
  {chapter:1,title:'Ouvir as primeiras versões',kind:'interviews'},
  {chapter:2,title:'Quebrar o álibi',kind:'alarm'},
  {chapter:2,title:'Reconstruir a madrugada',kind:'timeline'},
  {chapter:3,title:'Seguir o dinheiro',kind:'finance'},
  {chapter:3,title:'Cruzar a cinta bancária',kind:'bank'},
  {chapter:4,title:'Pressionar Téo',kind:'teo'},
  {chapter:4,title:'Relatório de acusação',kind:'accusation'},
] as const

function loadGame():GameSave{
  try{
    const raw=localStorage.getItem(SAVE_KEY)
    if(!raw)return initialGame
    const parsed=JSON.parse(raw) as GameSave
    if(parsed.version!==SAVE_VERSION)return initialGame
    const merged={...initialGame,...parsed}
    // a tela de tarefas só existe para o relatório final; saves antigos parados em outra tarefa voltam ao aparelho
    if(merged.screen==='task'&&merged.task<8)return {...merged,screen:'phone',app:'home',interrogationOrigin:'app'}
    return {...merged,interrogationOrigin:'app'}
  }catch{return initialGame}
}

export default function App(){
  const [game,setGame]=useState<GameSave>(loadGame)
  const [line,setLine]=useState(0)
  const [elapsed,setElapsed]=useState(0)
  const [audioOn,setAudioOn]=useState(false)
  const [muted,setMuted]=useState(false)
  const [speaker,setSpeaker]=useState(false)

  useEffect(()=>localStorage.setItem(SAVE_KEY,JSON.stringify(game)),[game])

  useEffect(()=>{
    if(game.screen!=='incoming'){stopRingtone();return}
    // Sem vibração física repetitiva: o pulso visual já comunica a chamada
    // e evita uma sensação artificial em navegadores/dispositivos diferentes.
    if(audioOn)startRingtone()
    return()=>stopRingtone()
  },[game.screen,audioOn])

  useEffect(()=>{
    if(game.screen!=='active')return
    const id=window.setInterval(()=>setElapsed(v=>v+1),1000)
    return()=>window.clearInterval(id)
  },[game.screen])

  useEffect(()=>{
    if(game.screen!=='launching')return
    const id=window.setTimeout(()=>setGame(g=>({...g,screen:'phone',app:'home',task:g.task===0?1:g.task})),1100)
    return()=>window.clearTimeout(id)
  },[game.screen])

  // A investigação avança quando os fatos chegam, não porque o jogador "concluiu uma tarefa".
  useEffect(()=>{
    setGame(g=>advanceTask(g))
  },[game.clues,game.interviewed,game.discoveredPeople])

  // Leva de anotações da Home: o que foi feito fica riscado no lugar; quando tudo foi feito, entra uma leva nova.
  useEffect(()=>{
    if(game.screen!=='phone')return
    setGame(g=>reconcileGuide(g))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[game.screen,game.task,game.clues,game.interviewed,game.teamTopics,game.requestedMaterials,game.summonedPeople,game.discoveredPeople,game.liviaInterrogation,game.depositions])
  useEffect(()=>{
    if(game.screen!=='phone'||game.app!=='home'||!guideFinished(game))return
    // a última anotação fica riscada à vista por um instante antes de a leva ser trocada
    const t=window.setTimeout(()=>setGame(g=>{
      if(!guideFinished(g))return g
      const nb=guideBatchOf(nextSteps(g).filter(x=>x.done))
      return nb.length?{...g,guideBatch:nb,guideDoneIds:[]}:g
    }),2600)
    return()=>window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[game.screen,game.app,game.guideBatch,game.guideDoneIds])

  const setScreen=(screen:Screen)=>setGame(g=>({...g,screen}))
  const activateSound=async()=>{if(await enableAudio()){setAudioOn(true);if(game.screen==='incoming')startRingtone()}}
  const answer=()=>{stopRingtone();if(audioOn)playConnect();setElapsed(0);setLine(0);navigator.vibrate?.(18);setScreen('active')}
  const decline=()=>{stopRingtone();if(audioOn)playHangup();setScreen('missed')}
  const finishCall=()=>{if(audioOn)playHangup();setScreen('launching')}
  const skipCall=()=>{stopRingtone();setScreen('launching')}
  const time=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`

  return <AnimatePresence mode="wait">
    {game.screen==='incoming'&&<Incoming audioOn={audioOn} onSound={activateSound} onAnswer={answer} onDecline={decline} onSkip={skipCall}/>} 
    {game.screen==='missed'&&<Missed onAnswer={answer} onSkip={skipCall}/>}
    {game.screen==='active'&&<ActiveCall line={line} time={time} muted={muted} speaker={speaker} audioOn={audioOn} issuedOrders={game.orders} setMuted={setMuted} setSpeaker={setSpeaker} onOrder={(id)=>setGame(g=>({...g,orders:g.orders.includes(id)?g.orders:[...g.orders,id]}))} onNext={()=>setLine(v=>Math.min(callTurns.length-1,v+1))} onFinish={finishCall} onSkip={skipCall}/>} 
    {game.screen==='launching'&&<Launching/>}
    {game.screen==='phone'&&<PolicePhone game={game} setGame={setGame}/>}
    {game.screen==='task'&&<TaskView game={game} setGame={setGame}/>}
    {game.screen==='ending'&&<Ending game={game} restart={()=>{localStorage.removeItem(SAVE_KEY);setGame(initialGame)}}/>}
  </AnimatePresence>
}

function SkipCall({onSkip}:{onSkip:()=>void}){return <button className="skip-call" onClick={onSkip}>Pular ligação</button>}
function Incoming({audioOn,onSound,onAnswer,onDecline,onSkip}:{audioOn:boolean;onSound:()=>void;onAnswer:()=>void;onDecline:()=>void;onSkip:()=>void}){
 return <motion.main key="incoming" className="call-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:.985}} transition={{duration:.35}}>
  <Ambient/><StatusBar/>
  <section className="caller">
   <div className="avatar-pulse"><motion.i animate={{scale:[1,1.48],opacity:[.3,0]}} transition={{duration:1.8,repeat:Infinity}}/><motion.i animate={{scale:[1,1.72],opacity:[.16,0]}} transition={{duration:1.8,repeat:Infinity,delay:.45}}/><motion.img className="avatar" src={SONIA_PHOTO} alt="Sônia Prado" animate={{scale:[1,1.035,1]}} transition={{duration:1.8,repeat:Infinity}}/></div>
   <small>CHAMADA RECEBIDA</small><h1>Sônia Prado</h1><p>DHPP · Supervisão</p>
   <motion.span className="ringing" animate={{opacity:[.45,1,.45]}} transition={{duration:1.4,repeat:Infinity}}>chamando…</motion.span>
   {!audioOn?<button className="sound-button" onClick={onSound}><Volume2/> Ativar toque da chamada</button>:<span className="sound-on"><Volume2/> Toque contínuo ativado</span>}
  </section>
  <motion.div className="call-actions" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.35,type:'spring'}}>
   <button className="decline" onClick={onDecline}><PhoneOff/><span>Recusar</span></button>
   <motion.button className="answer" onClick={onAnswer} animate={{scale:[1,1.05,1]}} transition={{duration:1.35,repeat:Infinity}}><Phone/><span>Atender</span></motion.button>
  </motion.div><SkipCall onSkip={onSkip}/><div className="homebar"/>
 </motion.main>
}
function Missed({onAnswer,onSkip}:{onAnswer:()=>void;onSkip:()=>void}){return <motion.main className="call-screen" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}><StatusBar/><section className="caller"><img className="avatar" src={SONIA_PHOTO} alt="Sônia Prado"/><small>CHAMADA PERDIDA</small><h1>Sônia Prado</h1><p>DHPP · Supervisão</p><div className="missed-card">1 chamada perdida · agora</div></section><div className="single-action"><button className="answer" onClick={onAnswer}><Phone/><span>Retornar</span></button></div><SkipCall onSkip={onSkip}/><div className="homebar"/></motion.main>}
function TypewriterText({text,audioOn,onDone,quote=true}:{text:string;audioOn:boolean;onDone?:()=>void;quote?:boolean}){
  const [visible,setVisible]=useState('')
  const [done,setDone]=useState(false)

  useEffect(()=>{
    setVisible('')
    setDone(false)
    let index=0
    const id=window.setInterval(()=>{
      index++
      setVisible(text.slice(0,index))

      const char=text[index-1]
      if(audioOn&&char&&char!==' '&&index%2===0)playTypingTick()

      if(index>=text.length){
        window.clearInterval(id)
        setDone(true)
        onDone?.()
      }
    },34)

    return()=>window.clearInterval(id)
  },[text,audioOn])

  return <span>{quote?'“':''}{visible}{!done&&<motion.i className="typing-cursor" animate={{opacity:[1,.2,1]}} transition={{duration:.55,repeat:Infinity}}/>}{done&&quote?'”':''}</span>
}

function ActiveCall({line,time,muted,speaker,audioOn,issuedOrders,setMuted,setSpeaker,onOrder,onNext,onFinish,onSkip}:{line:number;time:string;muted:boolean;speaker:boolean;audioOn:boolean;issuedOrders:string[];setMuted:(v:boolean)=>void;setSpeaker:(v:boolean)=>void;onOrder:(id:string)=>void;onNext:()=>void;onFinish:()=>void;onSkip:()=>void}){
 const [phase,setPhase]=useState<'sonia'|'choice'|'player'|'orderPlayer'|'orderAck'|'orderChoice'|'closing'>('sonia')
 const [reply,setReply]=useState('')
 const [previousChoice,setPreviousChoice]=useState(0)
 const [selectedChoice,setSelectedChoice]=useState(0)
 const [orderOpen,setOrderOpen]=useState(false)
 const [orderIssued,setOrderIssued]=useState(false)
 const [currentOrder,setCurrentOrder]=useState<(typeof operationalOrders)[number][number]|null>(null)

 useEffect(()=>{setPhase('sonia');setReply('');setOrderOpen(false);setOrderIssued(false);setCurrentOrder(null)},[line])

 const turn=callTurns[line]
 const soniaText=typeof turn.sonia==='string'?turn.sonia:turn.sonia[previousChoice]
 const closingText='closing' in turn&&turn.closing?turn.closing[selectedChoice]:''

 const soniaDone=()=>setPhase('choice')
 const chooseReply=(text:string,index:number)=>{
   setReply(text)
   setSelectedChoice(index)
   setOrderOpen(false)
   setPhase('player')
 }
 const issueOrder=(order:(typeof operationalOrders)[number][number])=>{
   if(issuedOrders.includes(order.id)||orderIssued)return
   setCurrentOrder(order)
   setOrderOpen(false)
   setPhase('orderPlayer')
 }
 const orderPlayerDone=()=>window.setTimeout(()=>setPhase('orderAck'),500)
 const orderAckDone=()=>window.setTimeout(()=>{
   if(currentOrder){
     onOrder(currentOrder.id)
     setOrderIssued(true)
   }
   setPhase('orderChoice')
 },650)
 const playerDone=()=>{
   window.setTimeout(()=>{
     if(line===callTurns.length-1){
       setPhase('closing')
     }else{
       setPreviousChoice(selectedChoice)
       onNext()
     }
   },650)
 }
 const closingDone=()=>window.setTimeout(onFinish,1050)

 return <motion.main className="call-screen active" initial={{opacity:0,scale:1.015}} animate={{opacity:1,scale:1}} exit={{opacity:0,y:-20}}>
  <Ambient/><StatusBar/>
  <SkipCall onSkip={onSkip}/>
  <section className="active-caller"><motion.img className="avatar small" src={SONIA_PHOTO} alt="Sônia Prado" initial={{scale:.8}} animate={{scale:1}}/><h1>Sônia Prado</h1><span>{time}</span></section>
  <motion.section className="transcript call-dialogue" layout>
   <small>CHAMADA · DHPP</small>
   <AnimatePresence mode="wait">
    {phase==='sonia'||phase==='choice'
      ?<motion.div className="dialogue-line sonia-line" key={'s'+line+'-'+previousChoice} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p><TypewriterText text={soniaText} audioOn={audioOn} onDone={soniaDone}/></p>
       </motion.div>
      :phase==='player'
      ?<motion.div className="dialogue-line player-line" key={'p'+line+'-'+selectedChoice} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>LEMOS</b><p><TypewriterText text={reply} audioOn={audioOn} onDone={playerDone}/></p>
       </motion.div>
      :phase==='orderPlayer'&&currentOrder
      ?<motion.div className="dialogue-line player-line" key={'op'+currentOrder.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>LEMOS</b><p><TypewriterText text={currentOrder.spoken} audioOn={audioOn} onDone={orderPlayerDone}/></p>
       </motion.div>
      :phase==='orderAck'&&currentOrder
      ?<motion.div className="dialogue-line sonia-line" key={'oa'+currentOrder.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p><TypewriterText text={currentOrder.confirm} audioOn={audioOn} onDone={orderAckDone}/></p>
       </motion.div>
      :phase==='orderChoice'&&currentOrder
      ?<motion.div className="dialogue-line sonia-line" key={'oc'+currentOrder.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p>“{currentOrder.confirm}”</p>
       </motion.div>
      :<motion.div className="dialogue-line sonia-line" key={'c'+selectedChoice} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}>
        <b>SÔNIA</b><p><TypewriterText text={closingText} audioOn={audioOn} onDone={closingDone}/></p>
       </motion.div>
    }
   </AnimatePresence>

   {(phase==='choice'||phase==='orderChoice')&&<motion.div className="call-replies" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
    <small>RESPONDER</small>
    {turn.replies.map((text,i)=><button key={i} onClick={()=>chooseReply(text,i)}>{text}</button>)}
    {!orderIssued&&<button className="order-trigger" onClick={()=>setOrderOpen(v=>!v)}><Shield/> DAR ORDEM</button>}
    {orderOpen&&<motion.div className="order-panel" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
      <small>O QUE LEMOS VAI DIZER</small>
      {operationalOrders[line].map(order=><button key={order.id} onClick={()=>issueOrder(order)}><b>{order.label}</b><span>falar na ligação</span></button>)}
    </motion.div>}
   </motion.div>}

   <div className="wave">{[10,18,27,15,30,20,26,16,11,22,14].map((h,i)=><motion.i key={i} animate={{height:(phase==='choice'||phase==='orderChoice')?[8,9,8]:[8,h,11]}} transition={{duration:.55+(i%3)*.1,repeat:Infinity,repeatType:'mirror',delay:i*.045}}/>)}</div>
   <div className="speaking"><i/> {phase==='choice'||phase==='orderChoice'?'aguardando resposta':phase==='player'||phase==='orderPlayer'?'Lemos falando':phase==='closing'?'Sônia encerrando':'transcrição em tempo real'}</div>
  </motion.section>
  <section className="controls"><button className={muted?'on':''} onClick={()=>setMuted(!muted)}><span><MicOff/></span><small>{muted?'mudo ativo':'mudo'}</small></button><button><span><Grid3X3/></span><small>teclado</small></button><button className={speaker?'on':''} onClick={()=>setSpeaker(!speaker)}><span><Volume2/></span><small>{speaker?'alto-falante ativo':'alto-falante'}</small></button></section>
  <div className="homebar"/>
 </motion.main>
}
function Launching(){return <motion.main className="launching" initial={{opacity:0}} animate={{opacity:1}}><motion.div className="launch-icon" initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}}><Shield/></motion.div><span>chamada encerrada</span><motion.div className="launch-line" initial={{width:0}} animate={{width:'72%'}} transition={{duration:.9}}/><small>Abrindo DHPP…</small></motion.main>}
function Face({p}:{p:{id?:string;name:string;initials:string;photo?:string}}){const ch=p.id?characters[p.id]:undefined;if(ch)return <CharacterFace character={ch}/>;return p.photo?<img className="face" src={`${import.meta.env.BASE_URL}${p.photo}`} alt={p.name}/>:<>{p.initials}</>}
function StatusBar(){return <header className="status"><b>04:27</b><span>VIVO&nbsp;&nbsp;▮▮▮ <BatteryMedium/></span></header>}
function Ambient(){return <div className="call-backdrop"/>}

function PolicePhone({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const current=tasks[game.task]
 const chapter=chapters[current.chapter]
 const openApp=(app:AppName)=>setGame(g=>({...g,app}))
 const leaveLivia=()=>setGame(g=>({...g,app:'interrogate'}))
 if(game.app==='livia'||game.app==='depo'){
  const id=game.app==='livia'?'livia':(game.depoId??'livia')
  const cfg=interrogations[id]??liviaInterrogation
  return <IllustratedInterrogation key={id} config={cfg} progress={progressOf(game,cfg.id)} onProgress={p=>setGame(g=>withProgress(g,cfg.id,p))} onClue={cid=>setGame(g=>({...g,clues:g.clues.includes(cid)?g.clues:[...g.clues,cid]}))} onPersonDiscovered={pid=>setGame(g=>{const known=g.discoveredPeople??['livia','caio','rafael','cida'];return known.includes(pid)?g:{...g,discoveredPeople:[...known,pid]}})} clueTitle={cid=>clues.find(c=>c.id===cid)?.title} registeredClues={game.clues} registeredMaterials={game.requestedMaterials??[]} materialTitle={mid=>teamMaterialRequests.find(r=>r.id===mid)?.label} onComplete={()=>setGame(g=>({...g,interviewed:g.interviewed.includes(cfg.id)?g.interviewed:[...g.interviewed,cfg.id]}))} onBack={leaveLivia} onReturn={leaveLivia}/>
 }
 if(game.app==='team')return <PhonePage title="Equipe" back={()=>openApp('home')}><Team game={game} setGame={setGame}/></PhonePage>
 if(game.app==='clues')return <PhonePage title="Pistas" back={()=>openApp('home')}><ClueList ids={game.clues}/></PhonePage>
 if(game.app==='interrogate')return <PhonePage title="Interrogar" back={()=>openApp('home')}><People game={game} setGame={setGame}/></PhonePage>
 if(game.app==='victim')return <PhonePage title="Telefone de Helena" back={()=>openApp('home')}><VictimPhone addClue={cid=>setGame(g=>({...g,clues:g.clues.includes(cid)?g.clues:[...g.clues,cid]}))} hasAgenda={game.clues.includes('agenda_helena')}/></PhonePage>
 if(game.app==='settings')return <PhonePage title="Ajustes" back={()=>openApp('home')}><QualityPicker/><p className="settings-note">A qualidade vale para o jogo inteiro: telas, animações e retratos.</p><FullscreenSetting/><SoundSetting/><ResetSetting onReset={()=>{localStorage.removeItem(SAVE_KEY);setGame(initialGame)}}/><Diagnostics/></PhonePage>
 if(game.app==='chapters')return <PhonePage title="Arquivo do caso" back={()=>openApp('home')}><ChapterMap game={game}/></PhonePage>
 const status = ({
  0:'Ocorrência recebida',1:'Cena em processamento',2:'Versões sendo colhidas',3:'Aguardando retorno técnico',4:'Janela de horário em aberto',
  5:'Linha financeira aberta',6:'Dinheiro sob análise',7:'Separando quem fez o quê',8:'Investigação pronta para relatório'
 } as Record<number,string>)[game.task] ?? current.title
 const go=(to:StepGo)=>{
  if(to.kind==='team')setGame(g=>({...g,app:'team',teamFocus:to.memberId}))
  else if(to.kind==='summon')setGame(g=>({...g,summonedPeople:(g.summonedPeople??['livia','caio']).includes(to.personId)?(g.summonedPeople??[]):[...(g.summonedPeople??['livia','caio']),to.personId]}))
  else if(to.kind==='depo')setGame(openDeposition(to.personId,'app'))
  else if(to.kind==='report')setGame(g=>({...g,screen:'task'}))
  else if(to.kind==='clues')setGame(g=>({...g,app:'clues'}))
 }
 const liveSteps=new Map(nextSteps(game).map(st=>[st.id,st]))
 const doneIds=game.guideDoneIds??[]
 const batch=game.guideBatch??[]
 // enquanto a leva não existe (primeira abertura), mostra as primeiras sugestões
 const notes=(batch.length?batch:guideBatchOf(nextSteps(game).filter(x=>x.done))).map(b=>{const st=liveSteps.get(b.id);const finished=doneIds.includes(b.id)||!st;return {id:b.id,finished,doneText:b.done,tag:st?.tag??'',title:st?.title??'',text:st?.text??'',cta:st?.cta,locked:st?.locked,run:()=>{if(st)go(st.go)}}})
 const unread=caseTeam.reduce((n,m)=>n+teamNews(game,m.id).count,0)
 return <HandsetHome chapterNumber={chapter.number} chapterTitle={chapter.title} caseStatus={status} notes={notes} peopleOpen={game.task>=2} helenaOpen={game.task>=3||(game.requestedMaterials??[]).includes('termo_apreensao_celular_helena')} archiveOpen={game.task>=3} teamBadge={unread} clueBadge={game.clues.length} onOpenApp={openApp}/>
}
function HandsetStatus(){return <header className="handset-status"><span>VIVO&nbsp;&nbsp;▮▮▮</span><b>DHPP</b><BatteryMedium/></header>}
function PhonePage({title,back,children}:{title:string;back:()=>void;children:React.ReactNode}){return <main className={`handset page${title==='Equipe'?' team-page':''}`}><HandsetStatus/><header className="page-head"><button onClick={back}><ChevronLeft/></button><b>{title}</b><span/></header><section className="page-body">{children}</section></main>}

/** Monta uma leva de até 3 sugestões: as que dá para fazer agora e, se sobrar espaço, avisos do que ainda falta. */
const guideBatchOf=(steps:GuideStepData[]):{id:string;done:string}[]=>{
  const real=steps.filter(x=>x.done&&!x.locked).slice(0,3)
  const waiting=steps.filter(x=>x.done&&x.locked).slice(0,3-real.length)
  return [...real,...waiting].map(x=>({id:x.id,done:x.done!}))
}
/** Atualiza a leva: o que sumiu das sugestões foi feito. Só o relatório pronto fura a leva. */
const reconcileGuide=(g:GameSave):GameSave=>{
  const steps=nextSteps(g).filter(x=>x.done)
  const live=new Map(steps.map(x=>[x.id,x]))
  const batch=g.guideBatch??[]
  if(!batch.length){const nb=guideBatchOf(steps);return nb.length?{...g,guideBatch:nb,guideDoneIds:[]}:g}
  if(steps[0]?.id==='report'&&!batch.some(b=>b.id==='report'))return {...g,guideBatch:guideBatchOf(steps),guideDoneIds:[]}
  const prev=g.guideDoneIds??[]
  const done=[...new Set([...prev,...batch.filter(b=>!live.has(b.id)).map(b=>b.id)])]
  return done.length===prev.length?g:{...g,guideDoneIds:done}
}
/** A leva está pronta para ser trocada quando tudo o que dava para fazer nela foi feito. */
const guideFinished=(g:GameSave)=>{
  const batch=g.guideBatch??[]
  const done=g.guideDoneIds??[]
  if(!batch.some(b=>done.includes(b.id)))return false
  const live=new Map(nextSteps(g).map(x=>[x.id,x]))
  return batch.every(b=>done.includes(b.id)||live.get(b.id)?.locked)
}

function Team({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const [selected,setSelected]=useState<string|null>(game.teamFocus??null)
 useEffect(()=>{if(game.teamFocus)setGame(g=>({...g,teamFocus:undefined}))},[]) // eslint-disable-line react-hooks/exhaustive-deps
 /** Envio em andamento: primeiro "enviando…", depois o integrante "digitando…"; só então a conversa é gravada no save. */
 const [sending,setSending]=useState<{id:string;text:string;time:string;phase:'sending'|'typing'}|null>(null)
 const timers=useRef<number[]>([])
 const [viewer,setViewer]=useState<{title:string;paths:readonly string[];start:number}|null>(null)
 useEffect(()=>()=>timers.current.forEach(window.clearTimeout),[])
 const requested=game.requestedMaterials??[]
 const discussed=game.teamTopics??[]

 const topicAvailable=(item:TeamDialogue)=>topicOk(game,item)
 const requestAvailable=(item:TeamMaterialRequest)=>requestOk(game,item)

 const discuss=(topic:TeamDialogue)=>{
  if(discussed.includes(topic.id)||!topicAvailable(topic))return
  setGame(g=>applyTopic(g,topic))
 }
 const request=(item:TeamMaterialRequest)=>{
  if(requested.includes(item.id)||!requestAvailable(item))return
  setGame(g=>applyRequest(g,item))
 }

 const send=(id:string,text:string,time:string,commit:()=>void)=>{
  if(sending)return
  setSending({id,text,time,phase:'sending'})
  const typingMs=900+Math.min(1400,text.length*8)
  timers.current.push(window.setTimeout(()=>setSending(v=>v&&{...v,phase:'typing'}),650))
  timers.current.push(window.setTimeout(()=>{commit();setSending(null)},650+typingMs))
 }
 const discoveredIds=game.discoveredPeople??['livia','caio','rafael','cida']
 const summonedIds=game.summonedPeople??['livia','caio']
 const summonPerson=(pid:string)=>setGame(g=>({...g,summonedPeople:(g.summonedPeople??['livia','caio']).includes(pid)?(g.summonedPeople??[]):[...(g.summonedPeople??['livia','caio']),pid]}))
 /** Quem tem pergunta de "apresentar" este material. */
 const exhibitPeople=(materialId:string)=>Object.entries(interrogations).filter(([,c])=>c.questions.some(q=>q.requiresMaterial===materialId)).map(([pid])=>pid)
 /** Para que serve o material: o texto da diligência ou, se ela registra pistas, o que foi registrado. */
 const useOf=(item:TeamMaterialRequest)=>{
  const registered=(item.clueIds??[]).map(id=>clues.find(c=>c.id===id)?.title).filter(Boolean)
  return item.use??(registered.length?`Registrou no caso: ${registered.join(', ')}.`:undefined)
 }
 /** Atalhos da conversa para as pessoas que ela cita: chamar, ouvir, levar o material ou retomar o depoimento. */
 const actionsFor=(ids:string[],materialId?:string)=>[...new Set(ids)].filter(pid=>discoveredIds.includes(pid)&&interrogations[pid]).flatMap(pid=>{
  const first=people.find(x=>x.id===pid)?.name.split(' ')[0]??pid
  const cfg=interrogations[pid]
  const prog=progressOf(game,pid)
  const done=game.interviewed.includes(pid)
  const open=()=>setGame(openDeposition(pid,'app'))
  if(!summonedIds.includes(pid)){
   const waiting=(summonRequires[pid]??[]).some(c=>!game.clues.includes(c))
   return [{key:pid,label:`Chamar ${first} para depoimento`,hint:waiting?'só com provas contra ele':undefined,disabled:waiting,run:()=>summonPerson(pid)}]
  }
  const pend=pendingQuestions(cfg,prog,game.clues,requested)
  const exhibitPending=!!materialId&&cfg.questions.some(q=>q.requiresMaterial===materialId&&!prog.asked.includes(q.id))
  if(done){
   if(materialId?!pend.some(q=>q.requiresMaterial===materialId):pend.length===0)return []
   return [{key:pid,label:`Retomar depoimento de ${first}`,hint:materialId?'apresentar este material':`${pend.length} ${pend.length>1?'perguntas novas':'pergunta nova'}`,run:open}]
  }
  return [{key:pid,label:exhibitPending?`Levar ao depoimento de ${first}`:`Ouvir ${first}`,hint:exhibitPending?'apresentar este material':undefined,run:open}]
 })
 const ordered=game.orders.map(id=>orderResultMessages[id]).filter(Boolean)
 const baseMessages=[...teamMessages,...ordered]
 /** Ordem da conversa: o que aconteceu antes aparece antes, qualquer que seja o horário do roteiro (saves antigos sem registro vêm primeiro, por horário). */
 const seqOf=(id:string,part:number)=>{const i=(game.teamLog??[]).indexOf(id);return i<0?-0.5:1000+i*2+part}
 const materialMessages=requested.flatMap(id=>{
  const item=teamMaterialRequests.find(r=>r.id===id)
  if(!item)return []
  return [
   {time:item.requestTime,from:'Lemos',text:`Consegue ${item.label.toLowerCase()} pra mim?`,memberId:item.memberId,outgoing:true,seq:seqOf(item.id,0)},
   {...item.response,memberId:item.memberId,outgoing:false,seq:seqOf(item.id,1),assets:item.assetPaths,assetsTitle:item.label,use:useOf(item),actions:actionsFor([...(item.revealsPeople??[]),...exhibitPeople(item.id)],item.id)}
  ]
 })
 const topicMessages=discussed.flatMap(id=>{
  const item=teamDialogues.find(t=>t.id===id)
  if(!item)return []
  const member=caseTeam.find(m=>m.id===item.memberId)
  return [
   {time:item.user.time,from:'Lemos',text:item.user.text,memberId:item.memberId,outgoing:true,seq:seqOf(item.id,0)},
   {time:item.agent.time,from:member?.name??'Equipe',text:item.agent.text,memberId:item.memberId,outgoing:false,seq:seqOf(item.id,1),actions:actionsFor(item.callPeople??item.revealsPeople??[])}
  ]
 })
 const normalized=baseMessages.map(m=>({...m,memberId:teamMemberForSender(m.from),outgoing:false}))
 const sortedMessages=[...teamIntroMessages,...normalized,...topicMessages,...materialMessages].sort((a,b)=>((a as {seq?:number}).seq??-1)-((b as {seq?:number}).seq??-1)||a.time.localeCompare(b.time))
 /** Cada atalho de pessoa aparece só na mensagem mais recente que a cita (o resto da conversa fica limpo). */
 const allMessages=(()=>{
  const seen=new Set<string>()
  const out=[...sortedMessages]
  // horários sempre crescentes dentro de cada conversa (a ordem real manda; o horário do roteiro só não pode voltar no tempo)
  const toMin=(t:string)=>Number(t.slice(0,2))*60+Number(t.slice(3,5))
  const last:Record<string,number>={}
  out.forEach((m,i)=>{const mm=m as {memberId:string;time:string};const t=Math.max(toMin(mm.time),(last[mm.memberId]??-1)+(last[mm.memberId]===undefined?0:1));last[mm.memberId]=t;if(t!==toMin(mm.time))out[i]={...m,time:`${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`} as typeof m})
  for(let i=out.length-1;i>=0;i--){
   const m=out[i] as {memberId:string;actions?:{key:string}[]}
   if(!m.actions)continue
   const keep=m.actions.filter(x=>{const k=m.memberId+x.key;if(seen.has(k))return false;seen.add(k);return true})
   out[i]={...out[i],actions:keep} as typeof out[number]
  }
  return out
 })()

 const unreadFor=(id:string)=>teamDialogues.filter(t=>t.memberId===id&&topicAvailable(t)&&!discussed.includes(t.id)).length+teamMaterialRequests.filter(r=>r.memberId===id&&requestAvailable(r)&&!requested.includes(r.id)).length

 if(!selected){
  return <div className="tm tm-list">
   <SecureStrip/>
   <header className="tm-title"><b>Equipe</b><span>5 contatos · Ocorrência 001</span></header>
   <div className="tm-grid">
    {caseTeam.map(member=>{
     const unread=unreadFor(member.id)
     return <button key={member.id} className="tm-card" onClick={()=>setSelected(member.id)}>
      {unread>0&&<em>{unread}</em>}
      <TeamFace id={member.id} initials={member.initials} name={member.name}/>
      <b>{member.name.split(' ')[0]}<Verified/></b>
      <span>{member.role}</span>
      <small>{member.specialty}</small>
      <u><MessageCircle/>Mensagem</u>
     </button>
    })}
    <p className="tm-soon">Novos contatos aparecem conforme o caso avança</p>
   </div>
   <footer className="tm-foot">Mensagens e pedidos ficam registrados no inquérito · acesso autenticado</footer>
   <Watermark/>
  </div>
 }

 const member=caseTeam.find(m=>m.id===selected)!
 const memberMessages=allMessages.filter(m=>m.memberId===selected)
 const availableTopics=teamDialogues.filter(t=>t.memberId===selected&&topicAvailable(t)&&!discussed.includes(t.id))
 const visibleRequests=teamMaterialRequests.filter(r=>r.memberId===selected&&(requested.includes(r.id)||requestAvailable(r)))

 return <div className="tm tm-chat">
  <SecureStrip/>
  <header className="tm-head">
   <button className="tm-back" onClick={()=>setSelected(null)} aria-label="Voltar para a equipe"><ChevronLeft/></button>
   <TeamFace id={member.id} initials={member.initials} name={member.name} small/>
   <div><b>{member.name}<Verified/></b><span>{member.role} · {member.specialty}</span></div>
  </header>
  <ChatThread messages={memberMessages} memberName={member.name} onOpenAsset={(title,paths,start)=>setViewer({title,paths,start})} sending={sending?.id&&(teamDialogues.some(t=>t.id===sending.id&&t.memberId===member.id)||teamMaterialRequests.some(r=>r.id===sending.id&&r.memberId===member.id))?sending:null}/>
  <section className="tm-replies" aria-label="Respostas e pedidos">
   <div className="tm-chips">
    {availableTopics.map(topic=><button key={topic.id} disabled={!!sending} onClick={()=>send(topic.id,topic.user.text,topic.user.time,()=>discuss(topic))}>{topic.label}</button>)}
    {visibleRequests.map(item=>{
     const done=requested.includes(item.id)
     return <button key={item.id} disabled={done||!!sending} className={done?'done':''} onClick={()=>send(item.id,`Consegue ${item.label.toLowerCase()} pra mim?`,item.requestTime,()=>request(item))} title={item.description}><b>{item.kind}</b>{item.label}{done&&<i>✓ recebido</i>}</button>
    })}
    {availableTopics.length===0&&visibleRequests.length===0&&!sending&&<p>Nada novo para conversar agora. Novos assuntos aparecem quando surgirem fatos novos.</p>}
   </div>
   <div className="tm-input"><span><Lock/>Mensagem segura</span><i><Send/></i></div>
  </section>
  <footer className="tm-foot">Sessão 0427 · Det. Lemos · registrada no inquérito</footer>
  <Watermark/>
  {viewer&&<EvidenceViewer title={viewer.title} paths={viewer.paths} start={viewer.start} onClose={()=>setViewer(null)}/>}
 </div>
}

/** Identidade do DHPP nas conversas: faixa de canal seguro, selo de contato verificado e marca d'água. */
function SecureStrip(){return <div className="tm-secure"><Lock/>CANAL SEGURO · DHPP<s/>USO RESTRITO<em><i/>CRIPTOGRAFADO</em></div>}
function Verified(){return <svg className="tm-ver" viewBox="0 0 24 24" aria-label="contato verificado"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="M8.5 12.2l2.5 2.5 4.5-5"/></svg>}
function Watermark(){return <div className="tm-mark" aria-hidden="true"><b>DHPP</b><i/><span>{[...'HOMICÍDIOS'].map((l,i)=><em key={i}>{l}</em>)}</span></div>}
function TeamFace({id,initials,name,small}:{id:string;initials:string;name:string;small?:boolean}){
 return <span className={`tm-face${small?' sm':''}`}>{id==='sonia'?<img src={`${import.meta.env.BASE_URL}characters/sonia/portrait.jpg`} alt={name}/>:initials}</span>
}
function ChatThread({messages,memberName,sending,onOpenAsset}:{messages:{time:string;from:string;text:string;outgoing:boolean;assets?:readonly string[];assetsTitle?:string;use?:string;actions?:{key:string;label:string;hint?:string;disabled?:boolean;run:()=>void}[]}[];memberName:string;onOpenAsset?:(title:string,paths:readonly string[],start:number)=>void;sending:{text:string;time:string;phase:'sending'|'typing'}|null}){
 const ref=useRef<HTMLDivElement>(null)
 const key=`${messages.length}|${sending?sending.phase:''}|${messages.reduce((n,m)=>n+(m.actions?.length??0)+(m.use?1:0),0)}`
 useEffect(()=>{
  const down=()=>ref.current?.scrollTo({top:ref.current.scrollHeight,behavior:'smooth'})
  down()
  // anexos e atalhos aumentam a mensagem depois de entrar: rola de novo para a resposta ficar inteira à vista
  const t=[350,900].map(ms=>window.setTimeout(down,ms))
  return()=>t.forEach(window.clearTimeout)
 },[key])
 return <div className="tm-thread" ref={ref}>
  <p className="tm-notice"><Lock/>Canal oficial do DHPP. Mensagens criptografadas, registradas no inquérito e sem cópia. Contatos verificados.</p>
  {messages.map((m,i)=><div key={m.time+m.from+i} className={`tm-msg ${m.outgoing?'out':'in'}${i>=messages.length-2&&messages.length>2?' fresh':''}`}>
   {!m.outgoing&&m.from!==memberName&&m.from!==memberName.split(' ')[0]&&<small>{m.from}</small>}
   <p>{m.text}<span>{m.time}{m.outgoing?' ✓✓':''}</span></p>
   {m.assets&&m.assets.length>0&&<div className="tm-attach">{m.assets.map((a,k)=><button key={a} onClick={()=>onOpenAsset?.(m.assetsTitle??'Material',m.assets!,k)} aria-label={`Abrir ${m.assetsTitle??'material'} ${k+1}`}><img src={assetUrl(a)} alt="" loading="lazy"/>{m.assets!.length>1&&k===0&&<b>{m.assets!.length}</b>}</button>)}</div>}
   {m.use&&<div className="tm-use"><b>PARA QUE SERVE</b>{m.use}</div>}
   {m.actions&&m.actions.length>0&&<div className="tm-people">{m.actions.map(a=><button key={a.key} disabled={a.disabled} onClick={a.run}><b>{a.label}</b>{a.hint&&<span>{a.hint}</span>}</button>)}</div>}
  </div>)}
  {sending&&<div className="tm-msg out fresh pending"><p>{sending.text}<span>{sending.phase==='sending'?<><i className="tm-clock"/>enviando…</>:<>{sending.time} ✓✓</>}</span></p></div>}
  {sending?.phase==='typing'&&<div className="tm-msg in fresh"><p className="tm-typing" aria-label={`${memberName} está digitando`}><i/><i/><i/></p><small className="tm-typing-label">{memberName.split(' ')[0]} está digitando…</small></div>}
 </div>
}
function ClueList({ids}:{ids:string[]}){if(!ids.length)return <Empty icon={<FileSearch/>} title="Nenhuma pista registrada" text="As pistas aparecem aqui conforme a equipe, os depoimentos e os documentos trazem fatos."/>;return <div className="clue-list">{ids.map(id=>{const c=clues.find(x=>x.id===id)!;return <article key={id}><FileText/><div><small>{c.support?'PROVA DE APOIO · ':''}{c.category.toUpperCase()}</small><b>{c.title}</b><p>{c.description}</p></div></article>})}</div>}
/** Pessoa afastada da linha de suspeita pelas provas (recibo + fachada da LAN, ou álibi + termo da irmã). */
const isCleared=(game:GameSave,pid:string)=>
  (pid==='rafael'&&game.clues.includes('lan_paga')&&game.clues.includes('rafael_lan_confirmada'))||
  (pid==='cida'&&game.clues.includes('alibi_cida')&&game.clues.includes('cida_alibi_termo'))
const supportClues=clues.filter(c=>c.support)
const mainClues=clues.filter(c=>!c.support)


function People({game,setGame,origin='app'}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>;origin?:'app'|'task'}){
 const discovered=game.discoveredPeople??['livia','caio','rafael','cida']
 const summoned=game.summonedPeople??['livia','caio']
 const visible=people.filter(p=>p.id!=='sonia'&&discovered.includes(p.id))
 const summon=(id:string)=>setGame(g=>({...g,summonedPeople:(g.summonedPeople??['livia','caio']).includes(id)?(g.summonedPeople??[]):[...(g.summonedPeople??['livia','caio']),id]}))
 return <div className="people-list">
  {visible.map(p=>{
   const has=!!interrogations[p.id]
   const called=summoned.includes(p.id)
   const done=game.interviewed.includes(p.id)
   const waiting=!called&&(summonRequires[p.id]??[]).some(c=>!game.clues.includes(c))
   return <button key={p.id} onClick={()=>called&&has?setGame(openDeposition(p.id,origin)):summon(p.id)} disabled={!has||waiting}>
    <i><Face p={p}/></i>
    <div><b>{p.name}</b><span>{done?(isCleared(game,p.id)?'Depoimento registrado · descartado pelas provas':'Depoimento registrado'):waiting?`${p.role} · só com provas contra ele`:called?p.role:`NOVO CONTATO · ${p.role}`}</span></div>
    {done?<Check/>:called?<ChevronLeft className="right"/>:waiting?<Lock/>:<strong>CHAMAR</strong>}
   </button>
  })}
  <p className="people-discovery-note">Novas pessoas aparecem aqui quando a equipe, documentos ou depoimentos revelam uma ligação com o caso.</p>
 </div>
}
const helenaAgenda=[
 {date:'02/10',text:'Ricardo e Lívia brigaram de novo por causa do Caio. Tentei mediar. Acho o namoro prejudicial, mas não sei como dizer isso sem piorar.'},
 {date:'09/10',text:'Ricardo falou em cortar parte do apoio da Lívia. Pedi calma. Preciso conversar com ela antes que ele faça isso.'},
 {date:'14/10',text:'A Lívia anda calada e sai com o Caio quase toda noite. Preciso sentar com ela. Sozinha, sem o pai.'},
 {date:'16/10',text:'Lívia pediu para conversar. Disse que amanhã. Hoje não, o Ricardo ainda está alterado.'}
]
function VictimPhone({addClue,hasAgenda}:{addClue:(id:string)=>void;hasAgenda:boolean}){const [tab,setTab]=useState<'home'|'messages'|'photos'|'calls'|'agenda'>('home');useEffect(()=>{if(tab==='agenda')addClue('agenda_helena')},[tab]);if(tab==='agenda')return <div><SubBack onClick={()=>setTab('home')} title="Agenda"/><div className="victim-messages">{helenaAgenda.map(a=><section key={a.date}><header><b>{a.date}</b><small>Agenda de Helena</small></header><p className="bubble in">{a.text}</p></section>)}</div>{hasAgenda&&<div className="result ok">Pista registrada: Agenda de Helena</div>}</div>;if(tab==='messages')return <div><SubBack onClick={()=>setTab('home')} title="Mensagens"/><div className="victim-messages">{victimMessages.map(m=><section key={m.contact}><header><b>{m.contact}</b><small>{m.time}</small></header><p className="bubble in">{m.incoming}</p><p className="bubble out">{m.outgoing}</p></section>)}</div></div>;if(tab==='photos')return <div><SubBack onClick={()=>setTab('home')} title="Fotos"/><div className="photo-grid"><figure><Camera/><figcaption>Família · 12 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Consultório · 15 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Thor · 16 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Casa · 16 OUT</figcaption></figure></div></div>;if(tab==='calls')return <div><SubBack onClick={()=>setTab('home')} title="Chamadas"/><div className="call-log"><p><b>Lívia</b><span>18:39 · 00:43</span></p><p><b>Ricardo</b><span>17:12 · 01:05</span></p><p><b>Rafael</b><span>14:07 · perdida</span></p></div></div>;return <div className="victim-home"><small>DISPOSITIVO APREENDIDO · HELENA VALENÇA</small><h2>04:27</h2><div className="victim-grid"><button onClick={()=>setTab('messages')}><MessageCircle/><span>Mensagens</span></button><button onClick={()=>setTab('photos')}><ImageIcon/><span>Fotos</span></button><button onClick={()=>setTab('agenda')}><BookOpen/><span>Agenda</span></button><button onClick={()=>setTab('calls')}><Phone/><span>Chamadas</span></button></div><p className="legal-access"><Shield/> acesso remoto autorizado pelo DHPP</p></div>}
function SubBack({onClick,title}:{onClick:()=>void;title:string}){return <button className="subback" onClick={onClick}><ChevronLeft/> {title}</button>}
function ChapterMap({game}:{game:GameSave}){const currentChapter=tasks[game.task].chapter;return <div className="chapter-map">{chapters.map((c,i)=><article key={c.number} className={i<=currentChapter?'open':''}><i>{i<=currentChapter?String(c.number).padStart(2,'0'):<Lock/>}</i><div><small>{i<currentChapter?'CONCLUÍDO':i===currentChapter?'EM ANDAMENTO':'BLOQUEADO'}</small><b>{c.title}</b><p>{c.summary}</p></div>{i<currentChapter&&<Check/>}</article>)}</div>}

function TaskView({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const task=tasks[game.task]
 const back=()=>setGame(g=>({...g,screen:'phone',app:'home'}))
 return <main className="task-screen"><header className="task-head"><button onClick={back}><ChevronLeft/></button><div><small>CAP. {chapters[task.chapter].number}</small><b>{chapters[task.chapter].title}</b></div><BookOpen/></header><section className="task-body"><TaskByKind game={game} setGame={setGame}/></section></main>
}
function TaskByKind({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 return <Accusation game={game} setGame={setGame}/>
}
function Accusation({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){const [executors,setExecutors]=useState<string[]>([]);const [mentor,setMentor]=useState('');const [motive,setMotive]=useState('');const [proofs,setProofs]=useState<string[]>([]);const toggle=(id:string,list:string[],set:(v:string[])=>void)=>set(list.includes(id)?list.filter(x=>x!==id):[...list,id]);const submit=()=>setGame(g=>fileReport(g,{executors,mentor,motive,proofs}));return <div className="accusation"><TaskTitle tag="RELATÓRIO FINAL" title="Quem fez o quê?" text="Separe execução, facilitação e motivo. Selecione ao menos três provas."/><h3>Executores</h3><div className="choices">{['caio','teo','rafael','jorge'].map(id=><button className={executors.includes(id)?'selected':''} onClick={()=>toggle(id,executors,setExecutors)} key={id}>{people.find(p=>p.id===id)?.name}{isCleared(game,id)&&<small className="cleared">descartado pelas provas</small>}</button>)}</div><h3>Mentor / facilitador</h3><div className="choices">{['livia','caio','teo'].map(id=><button className={mentor===id?'selected':''} onClick={()=>setMentor(id)} key={id}>{people.find(p=>p.id===id)?.name}</button>)}</div><h3>Motivo</h3><div className="choices"><button className={motive==='heranca'?'selected':''} onClick={()=>setMotive('heranca')}>Herança + proibição do namoro</button><button className={motive==='roubo'?'selected':''} onClick={()=>setMotive('roubo')}>Roubo oportunista</button></div><h3>Provas principais</h3><div className="proof-grid">{game.clues.filter(id=>acceptedProofs.includes(id)).map(id=><button key={id} className={proofs.includes(id)?'selected':''} onClick={()=>toggle(id,proofs,setProofs)}>{clues.find(c=>c.id===id)?.title}</button>)}</div><p className="support-note">Provas de apoio reunidas nos depoimentos: <b>{game.clues.filter(id=>supportClues.some(c=>c.id===id)).length}/{supportClues.length}</b>. Elas não substituem as provas principais, mas reforçam o relatório.</p><button className="primary" disabled={!mentor||!motive||executors.length===0||proofs.length<3} onClick={submit}>Assinar relatório</button></div>}
function Ending({game,restart}:{game:GameSave;restart:()=>void}){const data=game.ending==='A'?['CASO ENCERRADO','Caio e Téo são apontados como executores. Lívia é identificada como facilitadora e mentora do plano.','O relatório conecta acesso, cronologia, dinheiro e confissão.']:game.ending==='B'?['MEIA JUSTIÇA','Os executores foram identificados, mas o papel de Lívia não ficou estabelecido no relatório.','Parte da verdade chegou ao processo. Outra parte ficou sem nome.']:['ARQUIVADO','A acusação não sustentou a autoria dos executores.','Sem uma cadeia coerente de provas, o caso perde força.'];return <main className="ending"><small>ARQUIVO 001 · RESULTADO</small><h1>{data[0]}</h1><p>{data[1]}</p><blockquote>{data[2]}</blockquote><div className="score">Pontuação <b>{game.score}</b><span>{game.clues.filter(id=>mainClues.some(c=>c.id===id)).length}/{mainClues.length} pistas · {game.clues.filter(id=>supportClues.some(c=>c.id===id)).length}/{supportClues.length} provas de apoio</span></div><p className="disclaimer">{disclaimer}</p><button className="primary" onClick={restart}><RotateCcw/> Jogar novamente</button></main>}
function TaskTitle({tag,title,text}:{tag:string;title:string;text:string}){return <div className="task-title"><small>{tag}</small><h2>{title}</h2><p>{text}</p></div>}
function Empty({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="empty">{icon}<b>{title}</b><p>{text}</p></div>}
