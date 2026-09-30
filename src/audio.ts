let ctx: AudioContext | null = null
let ringtone: HTMLAudioElement | null = null
let ringtoneAttempt = 0
let callNoise: AudioBufferSourceNode | null = null
let callNoiseGain: GainNode | null = null

const RINGTONE_SRC = 'data:audio/mpeg;base64,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'

function audioContext() {
  const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctx) return null
  if (!ctx) ctx = new Ctx()
  return ctx
}

async function ready() {
  const c = audioContext()
  if (!c) return null
  if (c.state === 'suspended') await c.resume()
  return c
}

export async function enableAudio() {
  return Boolean(await ready())
}

function stopCurrentRingtone() {
  if (!ringtone) return
  ringtone.pause()
  try { ringtone.currentTime = 0 } catch {}
  ringtone.src = ''
  ringtone = null
}

export async function startRingtone() {
  const attempt = ++ringtoneAttempt
  stopCurrentRingtone()

  if (!(await ready())) return false
  if (attempt !== ringtoneAttempt) return false

  const audio = new Audio(RINGTONE_SRC)
  audio.loop = true
  audio.volume = 1
  audio.preload = 'auto'
  ringtone = audio

  try {
    await audio.play()

    // Se o usuário atendeu/recusou enquanto o Safari ainda iniciava o áudio,
    // não permita que o ringtone volte a tocar depois da chamada ser atendida.
    if (attempt !== ringtoneAttempt || ringtone !== audio) {
      audio.pause()
      try { audio.currentTime = 0 } catch {}
      audio.src = ''
      return false
    }

    return true
  } catch {
    if (ringtone === audio) ringtone = null
    return false
  }
}

export function stopRingtone() {
  ringtoneAttempt++
  stopCurrentRingtone()
}

function shortTone(c: AudioContext, from: number, to: number, duration: number, volume: number) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const start = c.currentTime

  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, start)
  osc.frequency.linearRampToValueAtTime(to, start + duration)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export async function playConnect() {
  const c = await ready()
  if (!c) return
  shortTone(c, 560, 760, 0.10, 0.038)
}

export async function playHangup() {
  const c = await ready()
  if (!c) return
  shortTone(c, 520, 360, 0.16, 0.034)
}
