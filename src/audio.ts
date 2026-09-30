let ctx: AudioContext | null = null
let ringTimer: number | null = null
let scheduled: OscillatorNode[] = []

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

function softTone(
  c: AudioContext,
  frequency: number,
  duration: number,
  volume = 0.018,
  delay = 0,
  type: OscillatorType = 'sine'
) {
  const oscillator = c.createOscillator()
  const gain = c.createGain()
  const filter = c.createBiquadFilter()

  oscillator.type = type
  oscillator.frequency.value = frequency

  filter.type = 'lowpass'
  filter.frequency.value = 1800
  filter.Q.value = 0.4

  const start = c.currentTime + delay
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.045)
  gain.gain.setValueAtTime(volume, start + Math.max(0.05, duration - 0.08))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(c.destination)

  oscillator.start(start)
  oscillator.stop(start + duration + 0.04)
  scheduled.push(oscillator)
}

function ringPhrase(c: AudioContext) {
  // Toque discreto inspirado em telefones móveis do início dos anos 2000:
  // duas frequências próximas, volume baixo e bastante silêncio entre ciclos.
  const burst = (delay: number) => {
    softTone(c, 440, 0.62, 0.014, delay)
    softTone(c, 480, 0.62, 0.012, delay)
  }
  burst(0)
  burst(0.82)
}

export async function enableAudio() {
  return Boolean(await ready())
}

export async function startRingtone() {
  stopRingtone()
  const c = await ready()
  if (!c) return false

  ringPhrase(c)
  ringTimer = window.setInterval(() => ringPhrase(c), 4200)
  return true
}

export function stopRingtone() {
  if (ringTimer !== null) window.clearInterval(ringTimer)
  ringTimer = null
  scheduled.forEach(node => {
    try { node.stop() } catch {}
  })
  scheduled = []
}

export async function playConnect() {
  const c = await ready()
  if (!c) return
  softTone(c, 523.25, 0.08, 0.014)
}

export async function playTick() {
  // Mantido por compatibilidade, mas propositalmente silencioso.
}

export async function playHangup() {
  const c = await ready()
  if (!c) return
  softTone(c, 392, 0.10, 0.012)
  softTone(c, 330, 0.12, 0.010, 0.11)
}
