let ctx: AudioContext | null = null
let activeNodes: AudioNode[] = []

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

function stopNode(node: AudioNode) {
  try {
    if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
      ;(node as OscillatorNode).stop()
    }
    node.disconnect()
  } catch {}
}

export async function enableAudio() {
  return Boolean(await ready())
}

export async function startRingtone() {
  stopRingtone()
  const c = await ready()
  if (!c) return false

  const compressor = c.createDynamicsCompressor()
  compressor.threshold.value = -17
  compressor.knee.value = 10
  compressor.ratio.value = 4
  compressor.attack.value = 0.003
  compressor.release.value = 0.18

  const master = c.createGain()
  master.gain.value = 0.075

  // Tremolo contínuo: mantém o som sempre presente, sem virar sequência de bipes.
  const lfo = c.createOscillator()
  const lfoGain = c.createGain()
  lfo.type = 'sine'
  lfo.frequency.value = 7.2
  lfoGain.gain.value = 0.038
  lfo.connect(lfoGain)
  lfoGain.connect(master.gain)

  // Corpo principal de "ring" telefônico.
  const low = c.createOscillator()
  const lowGain = c.createGain()
  low.type = 'sine'
  low.frequency.value = 438
  lowGain.gain.value = 0.72

  const high = c.createOscillator()
  const highGain = c.createGain()
  high.type = 'triangle'
  high.frequency.value = 512
  highGain.gain.value = 0.42

  // Harmônico discreto para dar leitura de chamada no alto-falante do celular.
  const edge = c.createOscillator()
  const edgeGain = c.createGain()
  edge.type = 'sine'
  edge.frequency.value = 876
  edgeGain.gain.value = 0.13

  low.connect(lowGain)
  high.connect(highGain)
  edge.connect(edgeGain)

  lowGain.connect(master)
  highGain.connect(master)
  edgeGain.connect(master)
  master.connect(compressor)
  compressor.connect(c.destination)

  const now = c.currentTime
  low.start(now)
  high.start(now)
  edge.start(now)
  lfo.start(now)

  activeNodes = [low, high, edge, lfo, lowGain, highGain, edgeGain, lfoGain, master, compressor]
  return true
}

export function stopRingtone() {
  activeNodes.forEach(stopNode)
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
