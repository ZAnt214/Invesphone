import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle, BatteryMedium, BookOpen, CalendarDays, Camera, Check,
  ChevronLeft, Clock, FileSearch, FileText, FolderSearch, Globe2, Grid3X3,
  Home, Image as ImageIcon, Lock, MessageCircle, MicOff, Phone, PhoneOff,
  RotateCcw, Search, Shield, Smartphone, Users, Volume2
} from 'lucide-react'
import { enableAudio, playConnect, playHangup, playTypingTick, startRingtone, stopRingtone } from './audio'
import HandsetHome from './HandsetHome'
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
import { newProgress } from './interrogation/logic'
import type { InterrogationProgress } from './interrogation/types'
import './handset-pages.css'
import { acceptedProofs, chapters, clues, disclaimer, people, teamMessages, victimMessages } from './case01'

const SONIA_PHOTO = `${import.meta.env.BASE_URL}sonia.jpg`
const SAVE_VERSION = 3
const SAVE_KEY = 'invesphone-case01-v2'

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
  /** Materiais solicitados à equipe (fotos, gravações, documentos e períícia). */
  requestedMaterials?:string[]
  score:number
  liviaInterrogation:InterrogationProgress
  /** Progresso dos depoimentos dos demais personagens, por id (Lívia tem campo próprio, de saves antigos). */
  depositions?:Record<string,InterrogationProgress>
  /** Depoimento aberto quando `app` é 'depo'. */
  depoId?:string
  interrogationOrigin?:'app'|'task'
  ending?:'A'|'B'|'C'
}

const initialGame:GameSave = {
  version:SAVE_VERSION,screen:'incoming',app:'home',task:0,clues:[],interviewed:[],orders:[],score:1000,liviaInterrogation:newProgress(liviaInterrogation)
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


type TeamMaterialRequest = {
  id:string
  label:string
  kind:'FOTO'|'GRAVAÇÃO'|'DOCUMENTO'|'PERÍCIA'
  description:string
  minTask?:number
  minInterviews?:number
  requiresClues?:string[]
  requiresInterviewed?:string[]
  clueIds?:string[]
  requestTime:string
  response:{time:string;from:string;text:string}
}

const teamMaterialRequests:TeamMaterialRequest[] = [
  {
    id:'fotos_cena',label:'Fotos completas da cena',kind:'FOTO',
    description:'Entrada, sala, escritório, corredor e quarto do casal em alta resolução.',
    minTask:1,requestTime:'04:35',
    response:{time:'04:41',from:'Perícia',text:'Pacote fotográfico da cena anexado. Entrada, sala, escritório e quarto do casal documentados antes da coleta.'}
  },
  {
    id:'fotos_painel',label:'Close do painel do alarme',kind:'FOTO',
    description:'Fotografias do teclado, visor e estado do painel antes da manipulação.',
    requiresClues:['painel_alarme'],requestTime:'04:47',
    response:{time:'04:50',from:'Perícia',text:'Close do painel do alarme enviado. O equipamento foi fotografado e preservado antes da análise.'}
  },
  {
    id:'gravacoes_depoimentos',label:'Gravações dos depoimentos',kind:'GRAVAÇÃO',
    description:'Cópias de áudio dos depoimentos já colhidos para comparação de versões.',
    minInterviews:1,requestTime:'05:06',
    response:{time:'05:09',from:'Cartório',text:'Áudios dos depoimentos já realizados anexados ao arquivo da ocorrência.'}
  },
  {
    id:'comprovante_lan',label:'Comprovante da LAN house',kind:'DOCUMENTO',
    description:'Registro de pagamento e horário vinculado a Rafael.',
    requiresInterviewed:['rafael'],clueIds:['lan_paga'],requestTime:'05:11',
    response:{time:'05:14',from:'Equipe Externa',text:'LAN house confirmou o registro de Rafael. Comprovante e horário foram anexados ao caso.'}
  },
  {
    id:'log_alarme',label:'Log completo do alarme',kind:'PERÍCIA',
    description:'Histórico de ativações e desativações do sistema da residência.',
    minInterviews:4,clueIds:['log_alarme'],requestTime:'05:15',
    response:{time:'05:18',from:'Inteligência',text:'Log completo recebido. Há uma desativação por código mestre às 23:52.'}
  },
  {
    id:'registro_motel',label:'Registro de entrada do motel',kind:'DOCUMENTO',
    description:'Comprovante com horário de entrada atribuído a Lívia e Caio.',
    requiresClues:['log_alarme'],clueIds:['nota_motel'],requestTime:'05:26',
    response:{time:'05:31',from:'Equipe Externa',text:'Motel localizou o registro. Entrada de Lívia e Caio consta às 00:56.'}
  },
  {
    id:'docs_financeiros',label:'Documentos financeiros de Ricardo',kind:'DOCUMENTO',
    description:'Extratos e cobranças recolhidos no escritório para cruzamento financeiro.',
    minTask:5,clueIds:['extrato_ricardo','carta_cobranca'],requestTime:'06:03',
    response:{time:'06:10',from:'Financeiro',text:'Extrato e carta de cobrança de Ricardo digitalizados e anexados para análise.'}
  },
  {
    id:'analise_cinta',label:'Análise da cinta bancária',kind:'PERÍCIA',
    description:'Conferência de origem, agência, data e valor da cinta encontrada com o dinheiro.',
    minTask:6,requiresClues:['extrato_ricardo'],clueIds:['cinta_bancaria'],requestTime:'06:20',
    response:{time:'06:26',from:'Financeiro',text:'Cinta identificada: Banco Meridional, ag. 0431, 15/10/2002, US$ 5.000.'}
  }
]

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
    return {...initialGame,...parsed}
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
    const id=window.setTimeout(()=>setGame(g=>({...g,screen:'phone',app:'home'})),1100)
    return()=>window.clearTimeout(id)
  },[game.screen])

  const setScreen=(screen:Screen)=>setGame(g=>({...g,screen}))
  const activateSound=async()=>{if(await enableAudio()){setAudioOn(true);if(game.screen==='incoming')startRingtone()}}
  const answer=()=>{stopRingtone();if(audioOn)playConnect();setElapsed(0);setLine(0);navigator.vibrate?.(18);setScreen('active')}
  const decline=()=>{stopRingtone();if(audioOn)playHangup();setScreen('missed')}
  const finishCall=()=>{if(audioOn)playHangup();setScreen('launching')}
  const skipCall=()=>{stopRingtone();setScreen('launching')}
  const addClue=(id:string)=>setGame(g=>({...g,clues:g.clues.includes(id)?g.clues:[...g.clues,id]}))
  const finishTask=()=>setGame(g=>({...g,task:Math.min(tasks.length-1,g.task+1),screen:'phone',app:'home'}))
  const time=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`

  return <AnimatePresence mode="wait">
    {game.screen==='incoming'&&<Incoming audioOn={audioOn} onSound={activateSound} onAnswer={answer} onDecline={decline} onSkip={skipCall}/>} 
    {game.screen==='missed'&&<Missed onAnswer={answer} onSkip={skipCall}/>}
    {game.screen==='active'&&<ActiveCall line={line} time={time} muted={muted} speaker={speaker} audioOn={audioOn} issuedOrders={game.orders} setMuted={setMuted} setSpeaker={setSpeaker} onOrder={(id)=>setGame(g=>({...g,orders:g.orders.includes(id)?g.orders:[...g.orders,id]}))} onNext={()=>setLine(v=>Math.min(callTurns.length-1,v+1))} onFinish={finishCall} onSkip={skipCall}/>} 
    {game.screen==='launching'&&<Launching/>}
    {game.screen==='phone'&&<PolicePhone game={game} setGame={setGame}/>}
    {game.screen==='task'&&<TaskView game={game} addClue={addClue} setGame={setGame} finishTask={finishTask}/>}
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
 const leaveLivia=()=>setGame(g=>g.interrogationOrigin==='task'?{...g,screen:'task',app:'home'}:{...g,app:'interrogate'})
 if(game.app==='livia'||game.app==='depo'){
  const id=game.app==='livia'?'livia':(game.depoId??'livia')
  const cfg=interrogations[id]??liviaInterrogation
  return <IllustratedInterrogation key={id} config={cfg} progress={progressOf(game,cfg.id)} onProgress={p=>setGame(g=>withProgress(g,cfg.id,p))} onClue={cid=>setGame(g=>({...g,clues:g.clues.includes(cid)?g.clues:[...g.clues,cid]}))} clueTitle={cid=>clues.find(c=>c.id===cid)?.title} registeredClues={game.clues} onComplete={()=>setGame(g=>({...g,interviewed:g.interviewed.includes(cfg.id)?g.interviewed:[...g.interviewed,cfg.id]}))} onBack={leaveLivia} onReturn={leaveLivia}/>
 }
 if(game.app==='team')return <PhonePage title="Equipe" back={()=>openApp('home')}><Team game={game} setGame={setGame}/></PhonePage>
 if(game.app==='clues')return <PhonePage title="Pistas" back={()=>openApp('home')}><ClueList ids={game.clues}/></PhonePage>
 if(game.app==='interrogate')return <PhonePage title="Interrogar" back={()=>openApp('home')}><People game={game} setGame={setGame}/></PhonePage>
 if(game.app==='victim')return <PhonePage title="Telefone de Helena" back={()=>openApp('home')}><VictimPhone/></PhonePage>
 if(game.app==='settings')return <PhonePage title="Ajustes" back={()=>openApp('home')}><QualityPicker/><p className="settings-note">A qualidade vale para o jogo inteiro: telas, animações e retratos.</p><FullscreenSetting/><SoundSetting/><ResetSetting onReset={()=>{localStorage.removeItem(SAVE_KEY);setGame(initialGame)}}/><Diagnostics/></PhonePage>
 if(game.app==='chapters')return <PhonePage title="Arquivo do caso" back={()=>openApp('home')}><ChapterMap game={game}/></PhonePage>
 return <HandsetHome chapterNumber={chapter.number} taskTitle={current.title} chapterTitle={chapter.title} taskNumber={game.task+1} taskCount={tasks.length} teamBadge={game.task<3?1:0} clueBadge={game.clues.length} onOpenApp={openApp} onOpenTask={()=>setGame(g=>({...g,screen:'task'}))}/>
}
function HandsetStatus(){return <header className="handset-status"><span>VIVO&nbsp;&nbsp;▮▮▮</span><b>DHPP</b><BatteryMedium/></header>}
function PhonePage({title,back,children}:{title:string;back:()=>void;children:React.ReactNode}){return <main className="handset page"><HandsetStatus/><header className="page-head"><button onClick={back}><ChevronLeft/></button><b>{title}</b><span/></header><section className="page-body">{children}</section></main>}

function Team({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const [mode,setMode]=useState<'thread'|'requests'>('thread')
 const ordered=game.orders.map(id=>orderResultMessages[id]).filter(Boolean)
 const requested=game.requestedMaterials??[]
 const materialMessages=requested.flatMap(id=>{
  const item=teamMaterialRequests.find(r=>r.id===id)
  if(!item)return []
  return [
   {time:item.requestTime,from:'Lemos',text:`Solicitação de material: ${item.label}.`},
   item.response
  ]
 })
 const messages=[...teamMessages,...ordered,...materialMessages].sort((a,b)=>a.time.localeCompare(b.time))
 const available=(item:TeamMaterialRequest)=>{
  if((item.minTask??0)>game.task)return false
  if((item.minInterviews??0)>game.interviewed.length)return false
  if(item.requiresClues?.some(id=>!game.clues.includes(id)))return false
  if(item.requiresInterviewed?.some(id=>!game.interviewed.includes(id)))return false
  return true
 }
 const request=(item:TeamMaterialRequest)=>{
  if(requested.includes(item.id)||!available(item))return
  setGame(g=>{
   const material=[...(g.requestedMaterials??[]),item.id]
   const gained=item.clueIds??[]
   const nextClues=[...g.clues]
   gained.forEach(id=>{if(!nextClues.includes(id))nextClues.push(id)})
   return {...g,requestedMaterials:material,clues:nextClues}
  })
  setMode('thread')
 }
 return <div className="team-hub">
  <div className="team-tabs">
   <button className={mode==='thread'?'active':''} onClick={()=>setMode('thread')}>Canal</button>
   <button className={mode==='requests'?'active':''} onClick={()=>setMode('requests')}>Solicitar material</button>
  </div>
  {mode==='thread'?<div className="thread">
   <div className="thread-head"><img className="mini-avatar" src={SONIA_PHOTO} alt="Sônia Prado"/><div><b>Ocorrência 001</b><span>canal operacional · 4 participantes</span></div></div>
   {messages.map((m,i)=><article key={m.time+m.from+i}><small>{m.time}</small><p><b>{m.from}</b>{m.text}</p></article>)}
   <div className="typing"><i/><i/><i/> equipe em campo</div>
  </div>:<div className="material-requests">
   <header><small>CENTRAL DE SOLICITAÇÕES</small><b>O que você precisa da equipe?</b><p>Peça materiais conforme novas linhas de investigação forem abertas.</p></header>
   {teamMaterialRequests.map(item=>{
    const done=requested.includes(item.id)
    const can=available(item)
    return <button key={item.id} className={done?'received':''} disabled={!can||done} onClick={()=>request(item)}>
     <i>{item.kind==='FOTO'?<Camera/>:item.kind==='GRAVAÇÃO'?<Volume2/>:item.kind==='PERÍCIA'?<Search/>:<FileText/>}</i>
     <div><small>{item.kind}</small><b>{item.label}</b><p>{item.description}</p><span>{done?'RECEBIDO':can?'SOLICITAR':'AGUARDANDO BASE INVESTIGATIVA'}</span></div>
     {done&&<Check/>}
    </button>
   })}
  </div>}
 </div>
}
function ClueList({ids}:{ids:string[]}){if(!ids.length)return <Empty icon={<FileSearch/>} title="Nenhuma pista registrada" text="Abra a tarefa atual e comece pela cena."/>;return <div className="clue-list">{ids.map(id=>{const c=clues.find(x=>x.id===id)!;return <article key={id}><FileText/><div><small>{c.category.toUpperCase()}</small><b>{c.title}</b><p>{c.description}</p></div></article>})}</div>}
function People({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){return <div className="people-list">{people.filter(p=>p.id!=='sonia').map(p=>{const has=!!interrogations[p.id];return <button key={p.id} onClick={()=>has?setGame(openDeposition(p.id,'app')):undefined} disabled={!has}><i><Face p={p}/></i><div><b>{p.name}</b><span>{has?p.role:`${p.role} · sem depoimento`}</span></div>{game.interviewed.includes(p.id)?<Check/>:<ChevronLeft className="right"/>}</button>})}</div>}
function VictimPhone(){const [tab,setTab]=useState<'home'|'messages'|'photos'|'calls'>('home');if(tab==='messages')return <div><SubBack onClick={()=>setTab('home')} title="Mensagens"/><div className="victim-messages">{victimMessages.map(m=><section key={m.contact}><header><b>{m.contact}</b><small>{m.time}</small></header><p className="bubble in">{m.incoming}</p><p className="bubble out">{m.outgoing}</p></section>)}</div></div>;if(tab==='photos')return <div><SubBack onClick={()=>setTab('home')} title="Fotos"/><div className="photo-grid"><figure><Camera/><figcaption>Família · 12 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Consultório · 15 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Thor · 16 OUT</figcaption></figure><figure><ImageIcon/><figcaption>Casa · 16 OUT</figcaption></figure></div></div>;if(tab==='calls')return <div><SubBack onClick={()=>setTab('home')} title="Chamadas"/><div className="call-log"><p><b>Lívia</b><span>18:39 · 00:43</span></p><p><b>Ricardo</b><span>17:12 · 01:05</span></p><p><b>Rafael</b><span>14:07 · perdida</span></p></div></div>;return <div className="victim-home"><small>DISPOSITIVO APREENDIDO · HELENA VALENÇA</small><h2>04:27</h2><div className="victim-grid"><button onClick={()=>setTab('messages')}><MessageCircle/><span>Mensagens</span></button><button onClick={()=>setTab('photos')}><ImageIcon/><span>Fotos</span></button><button><Globe2/><span>Internet</span></button><button onClick={()=>setTab('calls')}><Phone/><span>Chamadas</span></button></div><p className="legal-access"><Shield/> acesso remoto autorizado pelo DHPP</p></div>}
function SubBack({onClick,title}:{onClick:()=>void;title:string}){return <button className="subback" onClick={onClick}><ChevronLeft/> {title}</button>}
function ChapterMap({game}:{game:GameSave}){const currentChapter=tasks[game.task].chapter;return <div className="chapter-map">{chapters.map((c,i)=><article key={c.number} className={i<=currentChapter?'open':''}><i>{i<=currentChapter?String(c.number).padStart(2,'0'):<Lock/>}</i><div><small>{i<currentChapter?'CONCLUÍDO':i===currentChapter?'EM ANDAMENTO':'BLOQUEADO'}</small><b>{c.title}</b><p>{c.summary}</p></div>{i<currentChapter&&<Check/>}</article>)}</div>}

function TaskView({game,addClue,setGame,finishTask}:{game:GameSave;addClue:(id:string)=>void;setGame:React.Dispatch<React.SetStateAction<GameSave>>;finishTask:()=>void}){
 const task=tasks[game.task]
 const back=()=>setGame(g=>({...g,screen:'phone',app:'home'}))
 return <main className="task-screen"><header className="task-head"><button onClick={back}><ChevronLeft/></button><div><small>CAP. {chapters[task.chapter].number}</small><b>{chapters[task.chapter].title}</b></div><BookOpen/></header><section className="task-body"><TaskByKind kind={task.kind} game={game} addClue={addClue} setGame={setGame} finishTask={finishTask}/></section></main>
}
function TaskByKind({kind,game,addClue,setGame,finishTask}:{kind:typeof tasks[number]['kind'];game:GameSave;addClue:(id:string)=>void;setGame:React.Dispatch<React.SetStateAction<GameSave>>;finishTask:()=>void}){
 if(kind==='brief')return <Brief finish={finishTask}/>
 if(kind==='scene')return <Scene game={game} addClue={addClue} finish={finishTask}/>
 if(kind==='interviews')return <Interviews game={game} setGame={setGame} finish={finishTask}/>
 if(kind==='alarm')return <Alarm addClue={addClue} finish={finishTask}/>
 if(kind==='timeline')return <Timeline addClue={addClue} finish={finishTask}/>
 if(kind==='finance')return <Finance addClue={addClue} finish={finishTask}/>
 if(kind==='bank')return <Bank addClue={addClue} finish={finishTask}/>
 if(kind==='teo')return <Teo game={game} setGame={setGame} finish={()=>{addClue('confissao_teo');finishTask()}}/>
 return <Accusation game={game} setGame={setGame}/>
}
function Brief({finish}:{finish:()=>void}){return <div className="story-card"><small>RUA DAS ACÁCIAS · 04:29</small><h2>A casa está silenciosa.</h2><p>Duas vítimas no quarto. Lívia e Caio aguardam do lado de fora. A primeira versão é assalto, mas a porta principal não mostra sinais de entrada forçada.</p><blockquote>“Não procure só o que aconteceu. Procure o que alguém quis que parecesse ter acontecido.” <b>— Sônia</b></blockquote><button className="primary" onClick={finish}>Orientar equipe</button></div>}
function Scene({game,addClue,finish}:{game:GameSave;addClue:(id:string)=>void;finish:()=>void}){const spots=[['porta_intacta','Porta principal'],['painel_alarme','Painel'],['cao_canil','Canil'],['escritorio_revirado','Escritório'],['valores_intactos','Objetos de valor'],['quarto_livia','Quarto de Lívia'],['vitimas_dormindo','Quarto do casal']] as const;const done=spots.every(([id])=>game.clues.includes(id));return <div><TaskTitle tag="INVESTIGAÇÃO" title="Varredura da residência" text="Toque nos pontos para orientar a equipe e registrar o que importa."/><div className="scene-map">{spots.map(([id,label],i)=><button key={id} className={game.clues.includes(id)?'found':''} onClick={()=>addClue(id)} style={{left:`${[10,65,75,15,48,68,26][i]}%`,top:`${[18,24,70,56,48,43,74][i]}%`}}><Search/><span>{label}</span></button>)}</div><div className="task-progress">{spots.filter(([id])=>game.clues.includes(id)).length}/{spots.length} pontos registrados</div>{done&&<button className="primary" onClick={finish}>Fechar varredura</button>}</div>}
function Interviews({game,setGame,finish}:{game:GameSave;addClue?:(id:string)=>void;setGame:React.Dispatch<React.SetStateAction<GameSave>>;finish:()=>void}){const items=[['livia','Lívia admite discussões constantes por causa do namoro.'],['cida','Cida tem seu álibi confirmado por familiares.'],['rafael','O pagamento da LAN house confirma Rafael fora de casa.'],['jorge','Jorge viu o Gol de Caio na rua antes do horário declarado.'],['caio','Caio sustenta que passou a noite com Lívia no motel.']] as const;const done=items.filter(([p])=>game.interviewed.includes(p)).length>=4;return <div><TaskTitle tag="DEPOIMENTOS" title="Versões" text="Ouça as pessoas separadamente e anote as pistas de cada resposta. Quatro depoimentos bastam para avançar, mas todos ficam registrados."/><div className="interview-cards">{items.map(([pid,text])=>{const p=people.find(x=>x.id===pid)!;const asked=game.interviewed.includes(pid);return <button key={pid} className={asked?'done':''} onClick={()=>setGame(openDeposition(pid,'task'))}><i><Face p={p}/></i><div><b>{p.name}</b><span>{asked?text:p.role}</span></div>{asked?<Check/>:<MessageCircle/>}</button>})}</div>{done&&<button className="primary" onClick={finish}>Cruzar versões</button>}</div>}
function Alarm({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [choice,setChoice]=useState('');const ok=choice==='23:52';return <div><TaskTitle tag="PERÍCIA DIGITAL" title="Log do alarme" text="Qual ocorrência foge do padrão da família?"/><div className="terminal"><p>22:11 · ARMADO · CONTROLE 02</p><p>23:04 · SENSOR FUNDOS · NORMAL</p><p>23:52 · DESATIVADO · CÓDIGO MESTRE</p><p>03:41 · ARMADO · CONTROLE 01</p></div><div className="choices">{['22:11','23:04','23:52','03:41'].map(x=><button className={choice===x?'selected':''} onClick={()=>setChoice(x)} key={x}>{x}</button>)}</div>{choice&&<div className={ok?'result ok':'result bad'}>{ok?'O código mestre foi usado às 23:52.':'Esse evento não explica o acesso sem arrombamento.'}</div>}{ok&&<button className="primary" onClick={()=>{addClue('log_alarme');finish()}}>Registrar quebra do álibi</button>}</div>}
function Timeline({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [choice,setChoice]=useState('');const ok=choice==='00:56';return <div><TaskTitle tag="LINHA DO TEMPO" title="A janela" text="Caio diz que chegou ao motel às 23h. A nota fiscal mostra outra coisa."/><div className="document"><FileText/><small>MOTEL IMPERIAL · CUPOM 00871</small><b>ENTRADA: 00:56</b><span>SAÍDA: 02:50</span></div><div className="choices">{['23:00','23:30','23:52','00:56'].map(x=><button className={choice===x?'selected':''} onClick={()=>setChoice(x)} key={x}>{x}</button>)}</div>{ok&&<button className="primary" onClick={()=>{addClue('nota_motel');finish()}}>Marcar contradição</button>}</div>}
function Finance({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [picked,setPicked]=useState<string[]>([]);const items=[['extrato_ricardo','Extrato de Ricardo'],['carta_cobranca','Carta de cobrança'],['agenda_helena','Agenda de Helena']];const toggle=(id:string)=>{setPicked(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);addClue(id)};return <div><TaskTitle tag="DOCUMENTOS" title="Siga o dinheiro" text="Marque os documentos que merecem cruzamento financeiro."/><div className="doc-list">{items.map(([id,title])=><button key={id} onClick={()=>toggle(id)} className={picked.includes(id)?'done':''}><FileText/><div><b>{title}</b><span>apreendido na residência</span></div>{picked.includes(id)&&<Check/>}</button>)}</div>{picked.length===3&&<button className="primary" onClick={finish}>Enviar à inteligência</button>}</div>}
function Bank({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [ok,setOk]=useState(false);return <div><TaskTitle tag="CRUZAMENTO" title="Cinta bancária" text="Compare os dados encontrados com a origem dos dólares ligados a Téo."/><div className="document bank-slip"><small>BANCO MERIDIONAL</small><b>AG. 0431</b><span>15/10/2002 · US$ 5.000</span></div><button className="match" onClick={()=>setOk(true)}><Search/> Cruzar banco + agência + data + valor</button>{ok&&<div className="result ok">Correspondência exata encontrada. O dinheiro não é aleatório.</div>}{ok&&<button className="primary" onClick={()=>{addClue('cinta_bancaria');addClue('moto_dolares');finish()}}>Registrar vínculo financeiro</button>}</div>}
function Teo({game,setGame,finish}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>;finish:()=>void}){const done=game.interviewed.includes('teo');return <div><TaskTitle tag="INTERROGATÓRIO" title="Téo Duarte" text="Confronte Téo com o dinheiro, a cinta bancária e o log do alarme. As confrontações só abrem com as pistas certas."/><div className="interrogation"><div className="suspect-avatar">TD</div><small>SALA 01 · GRAVAÇÃO ATIVA</small><p>{done?'“Eu quero um advogado.” O interrogatório foi encerrado e a confissão está registrada.':'Téo espera na sala de interrogatório.'}</p></div>{done?<button className="primary" onClick={finish}>Registrar confissão</button>:<button className="primary" onClick={()=>setGame(openDeposition('teo','task'))}>Entrar na sala</button>}</div>}
function Accusation({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){const [executors,setExecutors]=useState<string[]>([]);const [mentor,setMentor]=useState('');const [motive,setMotive]=useState('');const [proofs,setProofs]=useState<string[]>([]);const toggle=(id:string,list:string[],set:(v:string[])=>void)=>set(list.includes(id)?list.filter(x=>x!==id):[...list,id]);const submit=()=>{const execOK=executors.includes('caio')&&executors.includes('teo')&&executors.length===2;const mentorOK=mentor==='livia';const motiveOK=motive==='heranca';const proofOK=proofs.filter(x=>acceptedProofs.includes(x)).length>=3;const ending:GameSave['ending']=execOK&&mentorOK&&motiveOK&&proofOK?'A':execOK?'B':'C';setGame(g=>({...g,ending,screen:'ending'}))};return <div><TaskTitle tag="RELATÓRIO FINAL" title="Quem fez o quê?" text="Separe execução, facilitação e motivo. Selecione ao menos três provas."/><h3>Executores</h3><div className="choices">{['caio','teo','rafael','jorge'].map(id=><button className={executors.includes(id)?'selected':''} onClick={()=>toggle(id,executors,setExecutors)} key={id}>{people.find(p=>p.id===id)?.name}</button>)}</div><h3>Mentor / facilitador</h3><div className="choices">{['livia','caio','teo'].map(id=><button className={mentor===id?'selected':''} onClick={()=>setMentor(id)} key={id}>{people.find(p=>p.id===id)?.name}</button>)}</div><h3>Motivo</h3><div className="choices"><button className={motive==='heranca'?'selected':''} onClick={()=>setMotive('heranca')}>Herança + proibição do namoro</button><button className={motive==='roubo'?'selected':''} onClick={()=>setMotive('roubo')}>Roubo oportunista</button></div><h3>Provas principais</h3><div className="proof-grid">{game.clues.filter(id=>acceptedProofs.includes(id)).map(id=><button key={id} className={proofs.includes(id)?'selected':''} onClick={()=>toggle(id,proofs,setProofs)}>{clues.find(c=>c.id===id)?.title}</button>)}</div><button className="primary" disabled={!mentor||!motive||executors.length===0||proofs.length<3} onClick={submit}>Assinar relatório</button></div>}
function Ending({game,restart}:{game:GameSave;restart:()=>void}){const data=game.ending==='A'?['CASO ENCERRADO','Caio e Téo são apontados como executores. Lívia é identificada como facilitadora e mentora do plano.','O relatório conecta acesso, cronologia, dinheiro e confissão.']:game.ending==='B'?['MEIA JUSTIÇA','Os executores foram identificados, mas o papel de Lívia não ficou estabelecido no relatório.','Parte da verdade chegou ao processo. Outra parte ficou sem nome.']:['ARQUIVADO','A acusação não sustentou a autoria dos executores.','Sem uma cadeia coerente de provas, o caso perde força.'];return <main className="ending"><small>ARQUIVO 001 · RESULTADO</small><h1>{data[0]}</h1><p>{data[1]}</p><blockquote>{data[2]}</blockquote><div className="score">Pontuação <b>{game.score}</b><span>{game.clues.length}/20 pistas registradas</span></div><p className="disclaimer">{disclaimer}</p><button className="primary" onClick={restart}><RotateCcw/> Jogar novamente</button></main>}
function TaskTitle({tag,title,text}:{tag:string;title:string;text:string}){return <div className="task-title"><small>{tag}</small><h2>{title}</h2><p>{text}</p></div>}
function Empty({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="empty">{icon}<b>{title}</b><p>{text}</p></div>}
