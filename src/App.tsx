import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  BatteryMedium, BookOpen, FileSearch, FolderSearch, Grid3X3,
  MessageCircle, MicOff, Phone, PhoneOff, Shield, Smartphone,
  Users, Volume2
} from 'lucide-react'
import { enableAudio, playConnect, playHangup, playTick, startRingtone, stopRingtone } from './audio'

const SAVE_VERSION = 1
const SAVE_KEY = 'invesphone-save'

type Screen = 'incoming' | 'missed' | 'active' | 'launching' | 'phone'

type Save = {
  version: number
  screen: Screen
}

const lines = [
  'Lemos? Desculpa a hora. Temos duas vítimas no Campo Belo.',
  'Ricardo e Helena Valença. A filha voltou pra casa e diz que encontrou tudo revirado.',
  'Ela está chamando de assalto. A equipe chegou agora e a porta da frente está intacta.',
  'Abre o DHPP. Quero você acompanhando isso desde o primeiro minuto.'
]

function getInitialScreen(): Screen {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return 'incoming'
    const parsed = JSON.parse(raw) as Save
    if (parsed.version !== SAVE_VERSION) {
      localStorage.removeItem(SAVE_KEY)
      return 'incoming'
    }
    return parsed.screen === 'phone' ? 'phone' : 'incoming'
  } catch {
    return 'incoming'
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(getInitialScreen)
  const [line, setLine] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [audioOn, setAudioOn] = useState(false)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, screen }))
  }, [screen])

  useEffect(() => {
    if (screen !== 'incoming') {
      stopRingtone()
      return
    }
    const vibrate = () => navigator.vibrate?.([120, 80, 120])
    vibrate()
    const id = window.setInterval(vibrate, 1900)
    if (audioOn) startRingtone()
    return () => {
      window.clearInterval(id)
      stopRingtone()
    }
  }, [screen, audioOn])

  useEffect(() => {
    if (screen !== 'active') return
    const id = window.setInterval(() => setElapsed(v => v + 1), 1000)
    return () => window.clearInterval(id)
  }, [screen])

  useEffect(() => {
    if (screen !== 'active' || line >= lines.length - 1) return
    const id = window.setTimeout(() => setLine(v => v + 1), 3400)
    return () => window.clearTimeout(id)
  }, [screen, line])

  useEffect(() => {
    if (screen === 'active' && audioOn) playTick()
  }, [screen, line, audioOn])

  useEffect(() => {
    if (screen !== 'launching') return
    const id = window.setTimeout(() => setScreen('phone'), 1100)
    return () => window.clearTimeout(id)
  }, [screen])

  const activateSound = async () => {
    const ok = await enableAudio()
    if (!ok) return
    setAudioOn(true)
    if (screen === 'incoming') startRingtone()
  }

  const answer = () => {
    stopRingtone()
    if (audioOn) playConnect()
    setElapsed(0)
    setLine(0)
    navigator.vibrate?.(40)
    setScreen('active')
  }

  const decline = () => {
    stopRingtone()
    if (audioOn) playHangup()
    setScreen('missed')
  }

  const finish = () => {
    if (audioOn) playHangup()
    setScreen('launching')
  }

  const time = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <AnimatePresence mode="wait">
      {screen === 'incoming' && (
        <motion.main
          key="incoming"
          className="call-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, x: [0, -1.5, 1.5, 0] }}
          exit={{ opacity: 0, scale: .985 }}
          transition={{ opacity: { duration: .35 }, x: { duration: .18, repeat: Infinity, repeatDelay: 1.55 } }}
        >
          <Ambient />
          <StatusBar />
          <section className="caller">
            <div className="avatar-pulse">
              <motion.i animate={{ scale: [1, 1.48], opacity: [.3, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
              <motion.i animate={{ scale: [1, 1.72], opacity: [.16, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: .45 }} />
              <motion.div className="avatar" animate={{ scale: [1, 1.035, 1] }} transition={{ duration: 1.8, repeat: Infinity }}>SP</motion.div>
            </div>
            <small>CHAMADA RECEBIDA</small>
            <h1>Sônia Prado</h1>
            <p>DHPP · Supervisão</p>
            <motion.span className="ringing" animate={{ opacity: [.45, 1, .45] }} transition={{ duration: 1.4, repeat: Infinity }}>chamando…</motion.span>
            {!audioOn ? (
              <button className="sound-button" onClick={activateSound}><Volume2 /> Ativar som da chamada</button>
            ) : (
              <span className="sound-on"><Volume2 /> Som ativado</span>
            )}
          </section>
          <motion.div className="call-actions" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .35, type: 'spring' }}>
            <button className="decline" onClick={decline}><PhoneOff /><span>Recusar</span></button>
            <motion.button className="answer" onClick={answer} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.35, repeat: Infinity }}><Phone /><span>Atender</span></motion.button>
          </motion.div>
          <div className="homebar" />
        </motion.main>
      )}

      {screen === 'missed' && (
        <motion.main key="missed" className="call-screen" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
          <StatusBar />
          <section className="caller">
            <div className="avatar">SP</div>
            <small>CHAMADA PERDIDA</small>
            <h1>Sônia Prado</h1>
            <p>DHPP · Supervisão</p>
            <div className="missed-card">1 chamada perdida · agora</div>
          </section>
          <div className="single-action"><button className="answer" onClick={answer}><Phone /><span>Retornar</span></button></div>
          <div className="homebar" />
        </motion.main>
      )}

      {screen === 'active' && (
        <motion.main key="active" className="call-screen active" initial={{ opacity: 0, scale: 1.015 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }}>
          <Ambient />
          <StatusBar />
          <section className="active-caller">
            <motion.div className="avatar small" initial={{ scale: .8 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>SP</motion.div>
            <h1>Sônia Prado</h1>
            <span>{time}</span>
          </section>
          <motion.section className="transcript" layout>
            <small>CHAMADA · DHPP</small>
            <AnimatePresence mode="wait">
              <motion.p key={line} initial={{ opacity: 0, y: 13, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8 }}>
                “{lines[line]}”
              </motion.p>
            </AnimatePresence>
            <div className="wave">
              {[10,18,27,15,30,20,26,16,11,22,14].map((h,i) => (
                <motion.i key={i} animate={{ height: [8, h, 11] }} transition={{ duration: .55 + (i % 3) * .1, repeat: Infinity, repeatType: 'mirror', delay: i * .045 }} />
              ))}
            </div>
            <div className="speaking"><i /> Sônia falando</div>
          </motion.section>
          <section className="controls">
            <button className={muted ? 'on' : ''} onClick={() => setMuted(v => !v)}><span><MicOff /></span><small>{muted ? 'mudo ativo' : 'mudo'}</small></button>
            <button><span><Grid3X3 /></span><small>teclado</small></button>
            <button className={speaker ? 'on' : ''} onClick={() => setSpeaker(v => !v)}><span><Volume2 /></span><small>{speaker ? 'alto-falante ativo' : 'alto-falante'}</small></button>
          </section>
          {line === lines.length - 1 && (
            <motion.button className="hangup" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onClick={finish}><PhoneOff /> Encerrar chamada</motion.button>
          )}
          <div className="homebar" />
        </motion.main>
      )}

      {screen === 'launching' && (
        <motion.main key="launching" className="launching" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div className="launch-icon" initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}><Shield /></motion.div>
          <span>chamada encerrada</span>
          <motion.div className="launch-line" initial={{ width: 0 }} animate={{ width: '72%' }} transition={{ duration: .9 }} />
          <small>Abrindo DHPP…</small>
        </motion.main>
      )}

      {screen === 'phone' && <PolicePhone key="phone" />}
    </AnimatePresence>
  )
}

function StatusBar() {
  return <header className="status"><b>04:27</b><span>VIVO&nbsp;&nbsp;▮▮▮ <BatteryMedium /></span></header>
}

function Ambient() {
  return <>
    <motion.div className="glow a" animate={{ x: [-12, 18, -12], y: [0, 22, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity }} />
    <motion.div className="glow b" animate={{ x: [10, -18, 10], y: [0, -16, 0] }} transition={{ duration: 8, repeat: Infinity }} />
  </>
}

function PolicePhone() {
  return <main className="police-phone">
    <header className="police-status"><span>DHPP•NET&nbsp;&nbsp;●●●○</span><b>04:27</b><BatteryMedium /></header>
    <section className="dhpp">
      <div className="brand"><b>DHPP</b><span>OS</span><small>SESSÃO SEGURA · LEMOS</small></div>
      <button className="case-card">
        <small>CASO 001 · NOVA OCORRÊNCIA</small>
        <b>A Casa da Rua das Acácias</b>
        <span>Campo Belo · equipe aguardando sua orientação</span>
      </button>
      <div className="hub">
        <div className="seal"><Shield /><b>DHPP</b><span>SÃO PAULO</span></div>
        <Hub className="n1" icon={<Users />} label="INTERROGAR" />
        <Hub className="n2" icon={<FileSearch />} label="PISTAS" />
        <Hub className="n3" icon={<MessageCircle />} label="EQUIPE" badge />
        <Hub className="n4" icon={<Smartphone />} label="TEL. VÍTIMA" />
      </div>
      <button className="archive"><FolderSearch /><span>Arquivo do caso</span><small>Cap. 1 · 0 pistas</small></button>
      <div className="biometric"><BookOpen /> ACESSO LOCAL · SAVE v{SAVE_VERSION}</div>
    </section>
  </main>
}

function Hub({ className, icon, label, badge=false }: { className: string, icon: React.ReactNode, label: string, badge?: boolean }) {
  return <button className={`hub-node ${className}`}><i>{icon}{badge && <em>1</em>}</i><span>{label}</span></button>
}
