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

function phoneTone(
  c: AudioContext,
  frequency: number,
  duration: number,
  volume = 0.05,
  delay = 0,
  type: OscillatorType = 'triangle'
) {
  const oscillator = c.createOscillator()
  const gain = c.createGain()
  const filter = c.createBiquadFilter()
  const compressor = c.createDynamicsCompressor()

  oscillator.type = type
  oscillator.frequency.value = frequency

  filter.type = 'lowpass'
  filter.frequency.value = 2600
  filter.Q.value = 0.25

  compressor.threshold.value = -18
  compressor.knee.value = 10
  compressor.ratio.value = 5
  compressor.attack.value = 0.003
  compressor.release.value = 0.16

  const start = c.currentTime + delay
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.018)
  gain.gain.setValueAtTime(volume, start + Math.max(0.025, duration - 0.04))
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(filter)
  filter.connect(gain)
  gain.connect(compressor)
  compressor.connect(c.destination)

  oscillator.start(start)
  oscillator.stop(start + duration + 0.03)
  scheduled.push(oscillator)
}

function ringPhrase(c: AudioContext) {
  // Toque monofônico original, mais presente e próximo de celulares do início dos anos 2000.
  const notes = [
    [784, 0.18, 0.00],
    [988, 0.18, 0.22],
    [880, 0.18, 0.44],
    [659, 0.30, 0.66],
    [784, 0.18, 1.08],
    [988, 0.18, 1.30],
    [880, 0.18, 1.52],
    [659, 0.30, 1.74],
  ] as const
  notes.forEach(([frequency,duration,delay]) => phoneTone(c, frequency, duration, 0.052, delay, 'triangle'))
}

export async function enableAudio() {
  return Boolean(await ready())
}

export async function startRingtone() {
  stopRingtone()
  const c = await ready()
  if (!c) return false
  ringPhrase(c)
  ringTimer = window.setInterval(() => ringPhrase(c), 3800)
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
  phoneTone(c, 740, 0.10, 0.035, 0, 'sine')
}

export async function playHangup() {
  const c = await ready()
  if (!c) return
  phoneTone(c, 520, 0.11, 0.030, 0, 'sine')
  phoneTone(c, 360, 0.15, 0.026, 0.12, 'sine')
}
