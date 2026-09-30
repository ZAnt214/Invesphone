import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle, BatteryMedium, BookOpen, CalendarDays, Camera, Check,
  ChevronLeft, Clock, FileSearch, FileText, FolderSearch, Globe2, Grid3X3,
  Home, Image as ImageIcon, Lock, MessageCircle, MicOff, Phone, PhoneOff,
  RotateCcw, Search, Shield, Smartphone, Users, Volume2
} from 'lucide-react'
import { enableAudio, playConnect, playHangup, startRingtone, stopRingtone } from './audio'
import { acceptedProofs, chapters, clues, disclaimer, people, teamMessages, victimMessages } from './case01'

const SAVE_VERSION = 2
const SAVE_KEY = 'invesphone-case01-v2'

type Screen = 'incoming'|'missed'|'active'|'launching'|'phone'|'task'|'ending'
type AppName = 'home'|'team'|'clues'|'interrogate'|'victim'|'chapters'

type GameSave = {
  version:number
  screen:Screen
  app:AppName
  task:number
  clues:string[]
  interviewed:string[]
  score:number
  ending?:'A'|'B'|'C'
}

const initialGame:GameSave = {
  version:SAVE_VERSION,screen:'incoming',app:'home',task:0,clues:[],interviewed:[],score:1000
}

const callLines = [
  'Lemos? Desculpa a hora. Temos duas vítimas no Campo Belo.',
  'Ricardo e Helena Valença. A filha voltou pra casa e diz que encontrou tudo revirado.',
  'Ela está chamando de assalto. A equipe chegou agora e a porta da frente está intacta.',
  'Abre o DHPP. Quero você acompanhando isso desde o primeiro minuto.'
]

const callLineDurations = [5000, 6900, 6800, 5900]

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
    if(game.screen!=='active'||line>=callLines.length-1)return
    const id=window.setTimeout(()=>setLine(v=>v+1),callLineDurations[line])
    return()=>window.clearTimeout(id)
  },[game.screen,line])

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
  const addClue=(id:string)=>setGame(g=>({...g,clues:g.clues.includes(id)?g.clues:[...g.clues,id]}))
  const finishTask=()=>setGame(g=>({...g,task:Math.min(tasks.length-1,g.task+1),screen:'phone',app:'home'}))
  const time=`${String(Math.floor(elapsed/60)).padStart(2,'0')}:${String(elapsed%60).padStart(2,'0')}`

  return <AnimatePresence mode="wait">
    {game.screen==='incoming'&&<Incoming audioOn={audioOn} onSound={activateSound} onAnswer={answer} onDecline={decline}/>} 
    {game.screen==='missed'&&<Missed onAnswer={answer}/>}
    {game.screen==='active'&&<ActiveCall line={line} time={time} muted={muted} speaker={speaker} setMuted={setMuted} setSpeaker={setSpeaker} onFinish={finishCall}/>}
    {game.screen==='launching'&&<Launching/>}
    {game.screen==='phone'&&<PolicePhone game={game} setGame={setGame}/>}
    {game.screen==='task'&&<TaskView game={game} addClue={addClue} setGame={setGame} finishTask={finishTask}/>}
    {game.screen==='ending'&&<Ending game={game} restart={()=>{localStorage.removeItem(SAVE_KEY);setGame(initialGame)}}/>}
  </AnimatePresence>
}

function Incoming({audioOn,onSound,onAnswer,onDecline}:{audioOn:boolean;onSound:()=>void;onAnswer:()=>void;onDecline:()=>void}){
 return <motion.main key="incoming" className="call-screen" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:.985}} transition={{duration:.35}}>
  <Ambient/><StatusBar/>
  <section className="caller">
   <div className="avatar-pulse"><motion.i animate={{scale:[1,1.48],opacity:[.3,0]}} transition={{duration:1.8,repeat:Infinity}}/><motion.i animate={{scale:[1,1.72],opacity:[.16,0]}} transition={{duration:1.8,repeat:Infinity,delay:.45}}/><motion.div className="avatar" animate={{scale:[1,1.035,1]}} transition={{duration:1.8,repeat:Infinity}}>SP</motion.div></div>
   <small>CHAMADA RECEBIDA</small><h1>Sônia Prado</h1><p>DHPP · Supervisão</p>
   <motion.span className="ringing" animate={{opacity:[.45,1,.45]}} transition={{duration:1.4,repeat:Infinity}}>chamando…</motion.span>
   {!audioOn?<button className="sound-button" onClick={onSound}><Volume2/> Ativar toque da chamada</button>:<span className="sound-on"><Volume2/> Toque contínuo ativado</span>}
  </section>
  <motion.div className="call-actions" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.35,type:'spring'}}>
   <button className="decline" onClick={onDecline}><PhoneOff/><span>Recusar</span></button>
   <motion.button className="answer" onClick={onAnswer} animate={{scale:[1,1.05,1]}} transition={{duration:1.35,repeat:Infinity}}><Phone/><span>Atender</span></motion.button>
  </motion.div><div className="homebar"/>
 </motion.main>
}
function Missed({onAnswer}:{onAnswer:()=>void}){return <motion.main className="call-screen" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}}><StatusBar/><section className="caller"><div className="avatar">SP</div><small>CHAMADA PERDIDA</small><h1>Sônia Prado</h1><p>DHPP · Supervisão</p><div className="missed-card">1 chamada perdida · agora</div></section><div className="single-action"><button className="answer" onClick={onAnswer}><Phone/><span>Retornar</span></button></div><div className="homebar"/></motion.main>}
function ActiveCall({line,time,muted,speaker,setMuted,setSpeaker,onFinish}:{line:number;time:string;muted:boolean;speaker:boolean;setMuted:(v:boolean)=>void;setSpeaker:(v:boolean)=>void;onFinish:()=>void}){return <motion.main className="call-screen active" initial={{opacity:0,scale:1.015}} animate={{opacity:1,scale:1}} exit={{opacity:0,y:-20}}><Ambient/><StatusBar/><section className="active-caller"><motion.div className="avatar small" initial={{scale:.8}} animate={{scale:1}}>SP</motion.div><h1>Sônia Prado</h1><span>{time}</span></section><motion.section className="transcript" layout><small>CHAMADA · DHPP</small><AnimatePresence mode="wait"><motion.p key={line} initial={{opacity:0,y:13,filter:'blur(3px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,y:-8}}>“{callLines[line]}”</motion.p></AnimatePresence><div className="wave">{[10,18,27,15,30,20,26,16,11,22,14].map((h,i)=><motion.i key={i} animate={{height:[8,h,11]}} transition={{duration:.55+(i%3)*.1,repeat:Infinity,repeatType:'mirror',delay:i*.045}}/>)}</div><div className="speaking"><i/> ligação ativa</div></motion.section><section className="controls"><button className={muted?'on':''} onClick={()=>setMuted(!muted)}><span><MicOff/></span><small>{muted?'mudo ativo':'mudo'}</small></button><button><span><Grid3X3/></span><small>teclado</small></button><button className={speaker?'on':''} onClick={()=>setSpeaker(!speaker)}><span><Volume2/></span><small>{speaker?'alto-falante ativo':'alto-falante'}</small></button></section>{line===callLines.length-1&&<motion.button className="hangup" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} onClick={onFinish}><PhoneOff/> Encerrar chamada</motion.button>}<div className="homebar"/></motion.main>}
function Launching(){return <motion.main className="launching" initial={{opacity:0}} animate={{opacity:1}}><motion.div className="launch-icon" initial={{scale:.8,opacity:0}} animate={{scale:1,opacity:1}}><Shield/></motion.div><span>chamada encerrada</span><motion.div className="launch-line" initial={{width:0}} animate={{width:'72%'}} transition={{duration:.9}}/><small>Abrindo DHPP…</small></motion.main>}
function StatusBar(){return <header className="status"><b>04:27</b><span>VIVO&nbsp;&nbsp;▮▮▮ <BatteryMedium/></span></header>}
function Ambient(){return <div className="call-backdrop"/>}

function PolicePhone({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){
 const current=tasks[game.task]
 const chapter=chapters[current.chapter]
 const openApp=(app:AppName)=>setGame(g=>({...g,app}))
 if(game.app==='team')return <PhonePage title="Equipe" back={()=>openApp('home')}><Team/></PhonePage>
 if(game.app==='clues')return <PhonePage title="Pistas" back={()=>openApp('home')}><ClueList ids={game.clues}/></PhonePage>
 if(game.app==='interrogate')return <PhonePage title="Interrogar" back={()=>openApp('home')}><People game={game} setGame={setGame}/></PhonePage>
 if(game.app==='victim')return <PhonePage title="Telefone de Helena" back={()=>openApp('home')}><VictimPhone/></PhonePage>
 if(game.app==='chapters')return <PhonePage title="Arquivo do caso" back={()=>openApp('home')}><ChapterMap game={game}/></PhonePage>
 return <main className="handset"><HandsetStatus/><section className="handset-home"><div className="device-title"><small>DHPP · TERMINAL MÓVEL</small><h1>04:27</h1><span>LE​MOS / UNIDADE 04</span></div><button className="task-card" onClick={()=>setGame(g=>({...g,screen:'task'}))}><small>CASO 001 · CAP. {chapter.number}</small><b>{current.title}</b><span>{chapter.title}</span><em>ABRIR TAREFA</em></button><div className="app-grid"><AppIcon label="Equipe" icon={<MessageCircle/>} badge={game.task<3?1:0} onClick={()=>openApp('team')}/><AppIcon label="Pistas" icon={<FileSearch/>} badge={game.clues.length} onClick={()=>openApp('clues')}/><AppIcon label="Interrogar" icon={<Users/>} onClick={()=>openApp('interrogate')}/><AppIcon label="Tel. Helena" icon={<Smartphone/>} onClick={()=>openApp('victim')}/><AppIcon label="Arquivo" icon={<FolderSearch/>} onClick={()=>openApp('chapters')}/><AppIcon label="Agenda" icon={<CalendarDays/>}/></div><div className="softkeys"><span>Menu</span><i>●</i><span>Opções</span></div></section></main>
}
function HandsetStatus(){return <header className="handset-status"><span>VIVO&nbsp;&nbsp;▮▮▮</span><b>DHPP</b><BatteryMedium/></header>}
function AppIcon({label,icon,badge=0,onClick}:{label:string;icon:React.ReactNode;badge?:number;onClick?:()=>void}){return <button className="app-icon" onClick={onClick}><i>{icon}{badge>0&&<em>{Math.min(badge,99)}</em>}</i><span>{label}</span></button>}
function PhonePage({title,back,children}:{title:string;back:()=>void;children:React.ReactNode}){return <main className="handset page"><HandsetStatus/><header className="page-head"><button onClick={back}><ChevronLeft/></button><b>{title}</b><span/></header><section className="page-body">{children}</section></main>}

function Team(){return <div className="thread"><div className="thread-head"><div className="mini-avatar">SP</div><div><b>Ocorrência 001</b><span>canal operacional · 4 participantes</span></div></div>{teamMessages.map(m=><article key={m.time+m.from}><small>{m.time}</small><p><b>{m.from}</b>{m.text}</p></article>)}<div className="typing"><i/><i/><i/> equipe em campo</div></div>}
function ClueList({ids}:{ids:string[]}){if(!ids.length)return <Empty icon={<FileSearch/>} title="Nenhuma pista registrada" text="Abra a tarefa atual e comece pela cena."/>;return <div className="clue-list">{ids.map(id=>{const c=clues.find(x=>x.id===id)!;return <article key={id}><FileText/><div><small>{c.category.toUpperCase()}</small><b>{c.title}</b><p>{c.description}</p></div></article>})}</div>}
function People({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){return <div className="people-list">{people.filter(p=>p.id!=='sonia').map(p=><button key={p.id} onClick={()=>setGame(g=>({...g,interviewed:g.interviewed.includes(p.id)?g.interviewed:[...g.interviewed,p.id]}))}><i>{p.initials}</i><div><b>{p.name}</b><span>{p.role}</span></div>{game.interviewed.includes(p.id)?<Check/>:<ChevronLeft className="right"/>}</button>)}</div>}
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
 if(kind==='interviews')return <Interviews game={game} addClue={addClue} setGame={setGame} finish={finishTask}/>
 if(kind==='alarm')return <Alarm addClue={addClue} finish={finishTask}/>
 if(kind==='timeline')return <Timeline addClue={addClue} finish={finishTask}/>
 if(kind==='finance')return <Finance addClue={addClue} finish={finishTask}/>
 if(kind==='bank')return <Bank addClue={addClue} finish={finishTask}/>
 if(kind==='teo')return <Teo addClue={addClue} finish={finishTask}/>
 return <Accusation game={game} setGame={setGame}/>
}
function Brief({finish}:{finish:()=>void}){return <div className="story-card"><small>RUA DAS ACÁCIAS · 04:29</small><h2>A casa está silenciosa.</h2><p>Duas vítimas no quarto. Lívia e Caio aguardam do lado de fora. A primeira versão é assalto, mas a porta principal não mostra sinais de entrada forçada.</p><blockquote>“Não procure só o que aconteceu. Procure o que alguém quis que parecesse ter acontecido.” <b>— Sônia</b></blockquote><button className="primary" onClick={finish}>Orientar equipe</button></div>}
function Scene({game,addClue,finish}:{game:GameSave;addClue:(id:string)=>void;finish:()=>void}){const spots=[['porta_intacta','Porta principal'],['painel_alarme','Painel'],['cao_canil','Canil'],['escritorio_revirado','Escritório'],['valores_intactos','Objetos de valor'],['quarto_livia','Quarto de Lívia'],['vitimas_dormindo','Quarto do casal']] as const;const done=spots.every(([id])=>game.clues.includes(id));return <div><TaskTitle tag="INVESTIGAÇÃO" title="Varredura da residência" text="Toque nos pontos para orientar a equipe e registrar o que importa."/><div className="scene-map">{spots.map(([id,label],i)=><button key={id} className={game.clues.includes(id)?'found':''} onClick={()=>addClue(id)} style={{left:`${[10,65,75,15,48,68,26][i]}%`,top:`${[18,24,70,56,48,43,74][i]}%`}}><Search/><span>{label}</span></button>)}</div><div className="task-progress">{spots.filter(([id])=>game.clues.includes(id)).length}/{spots.length} pontos registrados</div>{done&&<button className="primary" onClick={finish}>Fechar varredura</button>}</div>}
function Interviews({game,addClue,setGame,finish}:{game:GameSave;addClue:(id:string)=>void;setGame:React.Dispatch<React.SetStateAction<GameSave>>;finish:()=>void}){const items=[['livia','brigas_namoro','Lívia admite discussões constantes por causa do namoro.'],['cida','alibi_cida','Cida tem seu álibi confirmado por familiares.'],['rafael','lan_paga','O pagamento da LAN house confirma Rafael fora de casa.'],['jorge','vigia_gol','Jorge viu o Gol de Caio na rua antes do horário declarado.'],['caio','pergunta_inventario','Caio revela que Lívia vinha perguntando sobre inventário.']] as const;const done=items.filter(([p])=>game.interviewed.includes(p)).length>=4;return <div><TaskTitle tag="DEPOIMENTOS" title="Versões" text="Ouça as pessoas separadamente. Quatro depoimentos bastam para avançar, mas todos ficam registrados."/><div className="interview-cards">{items.map(([pid,cid,text])=>{const p=people.find(x=>x.id===pid)!;const asked=game.interviewed.includes(pid);return <button key={pid} className={asked?'done':''} onClick={()=>{setGame(g=>({...g,interviewed:g.interviewed.includes(pid)?g.interviewed:[...g.interviewed,pid]}));addClue(cid)}}><i>{p.initials}</i><div><b>{p.name}</b><span>{asked?text:p.role}</span></div>{asked?<Check/>:<MessageCircle/>}</button>})}</div>{done&&<button className="primary" onClick={finish}>Cruzar versões</button>}</div>}
function Alarm({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [choice,setChoice]=useState('');const ok=choice==='23:52';return <div><TaskTitle tag="PERÍCIA DIGITAL" title="Log do alarme" text="Qual ocorrência foge do padrão da família?"/><div className="terminal"><p>22:11 · ARMADO · CONTROLE 02</p><p>23:04 · SENSOR FUNDOS · NORMAL</p><p>23:52 · DESATIVADO · CÓDIGO MESTRE</p><p>03:41 · ARMADO · CONTROLE 01</p></div><div className="choices">{['22:11','23:04','23:52','03:41'].map(x=><button className={choice===x?'selected':''} onClick={()=>setChoice(x)} key={x}>{x}</button>)}</div>{choice&&<div className={ok?'result ok':'result bad'}>{ok?'O código mestre foi usado às 23:52.':'Esse evento não explica o acesso sem arrombamento.'}</div>}{ok&&<button className="primary" onClick={()=>{addClue('log_alarme');finish()}}>Registrar quebra do álibi</button>}</div>}
function Timeline({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [choice,setChoice]=useState('');const ok=choice==='00:56';return <div><TaskTitle tag="LINHA DO TEMPO" title="A janela" text="Caio diz que chegou ao motel às 23h. A nota fiscal mostra outra coisa."/><div className="document"><FileText/><small>MOTEL IMPERIAL · CUPOM 00871</small><b>ENTRADA: 00:56</b><span>SAÍDA: 02:50</span></div><div className="choices">{['23:00','23:30','23:52','00:56'].map(x=><button className={choice===x?'selected':''} onClick={()=>setChoice(x)} key={x}>{x}</button>)}</div>{ok&&<button className="primary" onClick={()=>{addClue('nota_motel');finish()}}>Marcar contradição</button>}</div>}
function Finance({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [picked,setPicked]=useState<string[]>([]);const items=[['extrato_ricardo','Extrato de Ricardo'],['carta_cobranca','Carta de cobrança'],['agenda_helena','Agenda de Helena']];const toggle=(id:string)=>{setPicked(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);addClue(id)};return <div><TaskTitle tag="DOCUMENTOS" title="Siga o dinheiro" text="Marque os documentos que merecem cruzamento financeiro."/><div className="doc-list">{items.map(([id,title])=><button key={id} onClick={()=>toggle(id)} className={picked.includes(id)?'done':''}><FileText/><div><b>{title}</b><span>apreendido na residência</span></div>{picked.includes(id)&&<Check/>}</button>)}</div>{picked.length===3&&<button className="primary" onClick={finish}>Enviar à inteligência</button>}</div>}
function Bank({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [ok,setOk]=useState(false);return <div><TaskTitle tag="CRUZAMENTO" title="Cinta bancária" text="Compare os dados encontrados com a origem dos dólares ligados a Téo."/><div className="document bank-slip"><small>BANCO MERIDIONAL</small><b>AG. 0431</b><span>15/10/2002 · US$ 5.000</span></div><button className="match" onClick={()=>setOk(true)}><Search/> Cruzar banco + agência + data + valor</button>{ok&&<div className="result ok">Correspondência exata encontrada. O dinheiro não é aleatório.</div>}{ok&&<button className="primary" onClick={()=>{addClue('cinta_bancaria');addClue('moto_dolares');finish()}}>Registrar vínculo financeiro</button>}</div>}
function Teo({addClue,finish}:{addClue:(id:string)=>void;finish:()=>void}){const [pressure,setPressure]=useState(0);const texts=['“Eu nem entrei naquela casa.”','“O Caio me chamou, mas eu não sabia o que ia acontecer.”','“A Lívia deixou tudo pronto. O código, o cachorro… eu só fui com o Caio.”'];return <div><TaskTitle tag="INTERROGATÓRIO" title="Téo Duarte" text="Confronte Téo com o dinheiro e com a janela do álibi."/><div className="interrogation"><div className="suspect-avatar">TD</div><small>SALA 01 · GRAVAÇÃO ATIVA</small><p>{texts[pressure]}</p></div>{pressure<2?<button className="primary" onClick={()=>setPressure(v=>v+1)}>{pressure===0?'Mostrar vínculo financeiro':'Confrontar com o log do alarme'}</button>:<button className="primary" onClick={()=>{addClue('confissao_teo');finish()}}>Registrar confissão</button>}</div>}
function Accusation({game,setGame}:{game:GameSave;setGame:React.Dispatch<React.SetStateAction<GameSave>>}){const [executors,setExecutors]=useState<string[]>([]);const [mentor,setMentor]=useState('');const [motive,setMotive]=useState('');const [proofs,setProofs]=useState<string[]>([]);const toggle=(id:string,list:string[],set:(v:string[])=>void)=>set(list.includes(id)?list.filter(x=>x!==id):[...list,id]);const submit=()=>{const execOK=executors.includes('caio')&&executors.includes('teo')&&executors.length===2;const mentorOK=mentor==='livia';const motiveOK=motive==='heranca';const proofOK=proofs.filter(x=>acceptedProofs.includes(x)).length>=3;const ending:GameSave['ending']=execOK&&mentorOK&&motiveOK&&proofOK?'A':execOK?'B':'C';setGame(g=>({...g,ending,screen:'ending'}))};return <div><TaskTitle tag="RELATÓRIO FINAL" title="Quem fez o quê?" text="Separe execução, facilitação e motivo. Selecione ao menos três provas."/><h3>Executores</h3><div className="choices">{['caio','teo','rafael','jorge'].map(id=><button className={executors.includes(id)?'selected':''} onClick={()=>toggle(id,executors,setExecutors)} key={id}>{people.find(p=>p.id===id)?.name}</button>)}</div><h3>Mentor / facilitador</h3><div className="choices">{['livia','caio','teo'].map(id=><button className={mentor===id?'selected':''} onClick={()=>setMentor(id)} key={id}>{people.find(p=>p.id===id)?.name}</button>)}</div><h3>Motivo</h3><div className="choices"><button className={motive==='heranca'?'selected':''} onClick={()=>setMotive('heranca')}>Herança + proibição do namoro</button><button className={motive==='roubo'?'selected':''} onClick={()=>setMotive('roubo')}>Roubo oportunista</button></div><h3>Provas principais</h3><div className="proof-grid">{game.clues.filter(id=>acceptedProofs.includes(id)).map(id=><button key={id} className={proofs.includes(id)?'selected':''} onClick={()=>toggle(id,proofs,setProofs)}>{clues.find(c=>c.id===id)?.title}</button>)}</div><button className="primary" disabled={!mentor||!motive||executors.length===0||proofs.length<3} onClick={submit}>Assinar relatório</button></div>}
function Ending({game,restart}:{game:GameSave;restart:()=>void}){const data=game.ending==='A'?['CASO ENCERRADO','Caio e Téo são apontados como executores. Lívia é identificada como facilitadora e mentora do plano.','O relatório conecta acesso, cronologia, dinheiro e confissão.']:game.ending==='B'?['MEIA JUSTIÇA','Os executores foram identificados, mas o papel de Lívia não ficou estabelecido no relatório.','Parte da verdade chegou ao processo. Outra parte ficou sem nome.']:['ARQUIVADO','A acusação não sustentou a autoria dos executores.','Sem uma cadeia coerente de provas, o caso perde força.'];return <main className="ending"><small>ARQUIVO 001 · RESULTADO</small><h1>{data[0]}</h1><p>{data[1]}</p><blockquote>{data[2]}</blockquote><div className="score">Pontuação <b>{game.score}</b><span>{game.clues.length}/20 pistas registradas</span></div><p className="disclaimer">{disclaimer}</p><button className="primary" onClick={restart}><RotateCcw/> Jogar novamente</button></main>}
function TaskTitle({tag,title,text}:{tag:string;title:string;text:string}){return <div className="task-title"><small>{tag}</small><h2>{title}</h2><p>{text}</p></div>}
function Empty({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="empty">{icon}<b>{title}</b><p>{text}</p></div>}
