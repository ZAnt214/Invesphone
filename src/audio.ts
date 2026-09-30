export type RingtoneStyle = 1|2|3|4|5|6|7|8|9|10

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

function output(c: AudioContext) {
  const compressor = c.createDynamicsCompressor()
  compressor.threshold.value = -18
  compressor.knee.value = 10
  compressor.ratio.value = 4
  compressor.attack.value = 0.003
  compressor.release.value = 0.18
  compressor.connect(c.destination)
  return compressor
}

function tone(
  c: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  delay = 0,
  type: OscillatorType = 'sine',
  toFrequency?: number
) {
  const osc = c.createOscillator()
  const gain = c.createGain()
  const out = output(c)
  const start = c.currentTime + delay

  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)
  if (toFrequency) osc.frequency.exponentialRampToValueAtTime(toFrequency, start + duration)

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(volume, start + Math.min(0.02, duration * 0.16))
  gain.gain.setValueAtTime(volume * 0.88, start + duration * 0.58)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain)
  gain.connect(out)
  osc.start(start)
  osc.stop(start + duration + 0.025)
  scheduled.push(osc)
}

function dual(c: AudioContext, f1: number, f2: number, duration: number, volume: number, delay = 0) {
  tone(c, f1, duration, volume, delay, 'sine')
  tone(c, f2, duration, volume * 0.72, delay, 'sine')
}

function bell(c: AudioContext, frequency: number, delay: number, volume: number) {
  tone(c, frequency, 0.52, volume, delay, 'sine')
  tone(c, frequency * 2.02, 0.36, volume * 0.25, delay, 'sine')
  tone(c, frequency * 3.96, 0.22, volume * 0.08, delay, 'sine')
}

function pattern(c: AudioContext, style: RingtoneStyle) {
  switch (style) {
    case 1: // clássico moderno
      dual(c, 440, 480, 0.86, 0.072, 0)
      dual(c, 440, 480, 0.86, 0.072, 1.12)
      break
    case 2: // smartphone genérico
      tone(c, 784, .24, .070, 0, 'sine')
      tone(c, 988, .24, .074, .28, 'sine')
      tone(c, 1174.66, .30, .078, .56, 'sine')
      tone(c, 988, .38, .070, .90, 'sine')
      tone(c, 784, .24, .066, 1.52, 'sine')
      tone(c, 988, .34, .072, 1.80, 'sine')
      break
    case 3: // corporativo
      bell(c, 659.25, 0, .076)
      bell(c, 880, .46, .070)
      bell(c, 659.25, 1.38, .072)
      bell(c, 880, 1.84, .068)
      break
    case 4: // campainha digital
      bell(c, 1046.5, 0, .082)
      bell(c, 783.99, .62, .072)
      bell(c, 1046.5, 1.36, .078)
      break
    case 5: // crescente
      tone(c, 698.46, .34, .038, 0, 'triangle')
      tone(c, 783.99, .34, .052, .40, 'triangle')
      tone(c, 880, .34, .068, .80, 'triangle')
      tone(c, 987.77, .42, .086, 1.20, 'triangle')
      break
    case 6: // toque + eco
      bell(c, 880, 0, .084)
      bell(c, 880, .34, .034)
      bell(c, 987.77, 1.18, .080)
      bell(c, 987.77, 1.52, .030)
      break
    case 7: // minimalista
      tone(c, 740, .30, .082, 0, 'sine')
      tone(c, 932.33, .36, .080, .44, 'sine')
      tone(c, 740, .30, .076, 1.44, 'sine')
      tone(c, 932.33, .36, .076, 1.88, 'sine')
      break
    case 8: // grave
      dual(c, 294, 330, .50, .095, 0)
      tone(c, 880, .15, .038, .08, 'sine')
      dual(c, 294, 330, .50, .090, .78)
      tone(c, 880, .15, .036, .86, 'sine')
      break
    case 9: // duplo ring
      dual(c, 425, 450, .68, .082, 0)
      dual(c, 425, 450, .68, .082, .94)
      break
    case 10: // moderno discreto
      bell(c, 880, 0, .076)
      bell(c, 1174.66, .38, .072)
      tone(c, 987.77, .42, .068, .86, 'sine', 880)
      bell(c, 880, 1.58, .070)
      bell(c, 1174.66, 1.96, .068)
      break
  }
}

const cycleMs: Record<RingtoneStyle, number> = {
  1: 4500, 2: 4400, 3: 4600, 4: 4300, 5: 4200,
  6: 4400, 7: 4500, 8: 3900, 9: 4300, 10: 4600
}

export async function enableAudio() {
  return Boolean(await ready())
}

export async function startRingtone(style: RingtoneStyle = 1) {
  stopRingtone()
  const c = await ready()
  if (!c) return false
  pattern(c, style)
  ringTimer = window.setInterval(() => pattern(c, style), cycleMs[style])
  return true
}

export async function previewRingtone(style: RingtoneStyle) {
  stopRingtone()
  const c = await ready()
  if (!c) return false
  pattern(c, style)
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
  tone(c, from, duration, volume, 0, 'sine', to)
}

export async function playConnect() {
  const c = await ready()
  if (!c) return
  shortTone(c, 560, 760, .10, .038)
}

export async function playHangup() {
  const c = await ready()
  if (!c) return
  shortTone(c, 520, 360, .16, .034)
}
