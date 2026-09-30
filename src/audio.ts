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

function bellTone(c: AudioContext, frequency: number, delay = 0, volume = 0.075) {
  const master = c.createGain()
  const compressor = c.createDynamicsCompressor()
  const start = c.currentTime + delay
  const duration = 0.62

  compressor.threshold.value = -20
  compressor.knee.value = 12
  compressor.ratio.value = 4
  compressor.attack.value = 0.002
  compressor.release.value = 0.22

  master.gain.setValueAtTime(0.0001, start)
  master.gain.linearRampToValueAtTime(volume, start + 0.018)
  master.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  const partials = [
    { ratio: 1, gain: 1 },
    { ratio: 2.01, gain: 0.32 },
    { ratio: 3.98, gain: 0.10 },
  ]

  partials.forEach((partial, index) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency * partial.ratio, start)
    gain.gain.value = partial.gain
    osc.connect(gain)
    gain.connect(master)
    osc.start(start)
    osc.stop(start + duration + index * 0.025)
    scheduled.push(osc)
  })

  master.connect(compressor)
  compressor.connect(c.destination)
}

function ringPhrase(c: AudioContext) {
  // Toque limpo e atual: notas de sino digital com bastante presença,
  // sem tentar imitar um aparelho antigo ou um toque conhecido.
  bellTone(c, 880, 0.00, 0.082)
  bellTone(c, 1174.66, 0.34, 0.076)
  bellTone(c, 987.77, 0.76, 0.080)
  bellTone(c, 1318.51, 1.10, 0.074)

  bellTone(c, 880, 1.78, 0.078)
  bellTone(c, 1174.66, 2.12, 0.072)
}

export async function enableAudio() {
  return Boolean(await ready())
}

export async function startRingtone() {
  stopRingtone()
  const c = await ready()
  if (!c) return false

  ringPhrase(c)
  ringTimer = window.setInterval(() => ringPhrase(c), 4_700)
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

function shortTone(c: AudioContext, from: number, to: number, duration: number, volume: number) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const start = c.currentTime

  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, start)
  osc.frequency.linearRampToValueAtTime(to, start + duration)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  gain.connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
  scheduled.push(osc)
}

export async function playConnect() {
  const c = await ready()
  if (!c) return
  shortTone(c, 620, 760, 0.11, 0.030)
}

export async function playHangup() {
  const c = await ready()
  if (!c) return
  shortTone(c, 520, 390, 0.18, 0.028)
}
