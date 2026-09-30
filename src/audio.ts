let ctx: AudioContext | null = null
let activeSources: AudioScheduledSourceNode[] = []
let activeNodes: AudioNode[] = []
let buzzTimer: number | null = null

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

function scheduleBuzzEnvelope(c: AudioContext, gain: GainNode, at: number) {
  const buzz = (start: number, duration: number, level: number) => {
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.linearRampToValueAtTime(level, start + 0.025)
    gain.gain.setValueAtTime(level * 0.92, start + duration - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  }

  // Cadência típica de celular vibrando sobre uma superfície:
  // brrrrrr — pausa curta — brrrrrr — pausa maior — repete.
  buzz(at, 0.72, 0.14)
  buzz(at + 0.94, 0.72, 0.14)
}

function makeNoiseBuffer(c: AudioContext) {
  const seconds = 1
  const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < data.length; i++) {
    // ruído com pequenas irregularidades para lembrar o chacoalhar físico
    const white = Math.random() * 2 - 1
    const flutter = Math.sin((i / c.sampleRate) * Math.PI * 2 * 118)
    data[i] = white * 0.38 + flutter * 0.12
  }
  return buffer
}

export async function startRingtone() {
  stopRingtone()
  const c = await ready()
  if (!c) return false

  const compressor = c.createDynamicsCompressor()
  compressor.threshold.value = -20
  compressor.knee.value = 12
  compressor.ratio.value = 5
  compressor.attack.value = 0.004
  compressor.release.value = 0.16

  const master = c.createGain()
  master.gain.value = 0.0001

  // Motor principal: grave e contínuo.
  const motor = c.createOscillator()
  const motorGain = c.createGain()
  motor.type = 'sawtooth'
  motor.frequency.value = 118
  motorGain.gain.value = 0.42

  // Segundo harmônico dá a sensação de carcaça/mesa vibrando.
  const body = c.createOscillator()
  const bodyGain = c.createGain()
  body.type = 'triangle'
  body.frequency.value = 236
  bodyGain.gain.value = 0.16

  // Ruído band-pass imita a vibração física e o leve "rattle" na superfície.
  const noise = c.createBufferSource()
  const band = c.createBiquadFilter()
  const noiseGain = c.createGain()
  noise.buffer = makeNoiseBuffer(c)
  noise.loop = true
  band.type = 'bandpass'
  band.frequency.value = 215
  band.Q.value = 0.75
  noiseGain.gain.value = 0.62

  motor.connect(motorGain)
  body.connect(bodyGain)
  noise.connect(band)
  band.connect(noiseGain)

  motorGain.connect(master)
  bodyGain.connect(master)
  noiseGain.connect(master)
  master.connect(compressor)
  compressor.connect(c.destination)

  const now = c.currentTime
  motor.start(now)
  body.start(now)
  noise.start(now)

  scheduleBuzzEnvelope(c, master, now + 0.02)
  buzzTimer = window.setInterval(() => {
    scheduleBuzzEnvelope(c, master, c.currentTime + 0.02)
  }, 2600)

  activeSources = [motor, body, noise]
  activeNodes = [motorGain, bodyGain, band, noiseGain, master, compressor]
  return true
}

export function stopRingtone() {
  if (buzzTimer !== null) {
    window.clearInterval(buzzTimer)
    buzzTimer = null
  }

  activeSources.forEach(source => {
    try { source.stop() } catch {}
    try { source.disconnect() } catch {}
  })

  activeNodes.forEach(node => {
    try { node.disconnect() } catch {}
  })

  activeSources = []
  activeNodes = []
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
