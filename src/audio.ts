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

function connectOutput(c: AudioContext) {
  const compressor = c.createDynamicsCompressor()
  compressor.threshold.value = -16
  compressor.knee.value = 8
  compressor.ratio.value = 5
  compressor.attack.value = 0.003
  compressor.release.value = 0.16
  compressor.connect(c.destination)
  return compressor
}

function pulseLayer(
  c: AudioContext,
  out: AudioNode,
  from: number,
  to: number,
  duration: number,
  volume: number,
  delay: number,
  type: OscillatorType
) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const start = c.currentTime + delay

  osc.type = type
  osc.frequency.setValueAtTime(from, start)
  osc.frequency.exponentialRampToValueAtTime(to, start + duration)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.012)
  gain.gain.setValueAtTime(volume * 0.72, start + duration * 0.48)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  gain.connect(out)
  osc.start(start)
  osc.stop(start + duration + 0.025)
  scheduled.push(osc)
}

function callPulse(c: AudioContext, delay: number, accent = false) {
  const out = connectOutput(c)

  // Corpo grave para dar presença mesmo em alto-falante pequeno.
  pulseLayer(c, out, accent ? 246 : 220, accent ? 272 : 246, 0.23, accent ? 0.095 : 0.088, delay, 'sine')

  // Ataque médio curto: deixa o toque definido sem parecer uma melodia.
  pulseLayer(c, out, accent ? 740 : 660, accent ? 830 : 740, 0.17, 0.052, delay + 0.012, 'triangle')

  // Brilho discreto de chamada moderna.
  pulseLayer(c, out, accent ? 1480 : 1320, accent ? 1660 : 1480, 0.09, 0.018, delay + 0.025, 'sine')
}

function ringPhrase(c: AudioContext) {
  // Padrão curto de chamada corporativa: pulsos, não melodia.
  callPulse(c, 0.00, false)
  callPulse(c, 0.36, true)

  callPulse(c, 1.26, false)
  callPulse(c, 1.62, true)
}

export async function enableAudio() {
  return Boolean(await ready())
}

export async function startRingtone() {
  stopRingtone()
  const c = await ready()
  if (!c) return false

  ringPhrase(c)
  ringTimer = window.setInterval(() => ringPhrase(c), 3_900)
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
  const out = connectOutput(c)
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
  gain.connect(out)
  osc.start(start)
  osc.stop(start + duration + 0.02)
  scheduled.push(osc)
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
