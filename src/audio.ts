let ctx: AudioContext | null = null
let ringTimer: number | null = null

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

function tone(c: AudioContext, frequency: number, duration: number, volume = 0.045, delay = 0) {
  const oscillator = c.createOscillator()
  const gain = c.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, c.currentTime + delay)
  gain.gain.exponentialRampToValueAtTime(volume, c.currentTime + delay + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + delay + duration)
  oscillator.connect(gain)
  gain.connect(c.destination)
  oscillator.start(c.currentTime + delay)
  oscillator.stop(c.currentTime + delay + duration + 0.03)
}

export async function enableAudio() {
  return Boolean(await ready())
}

export async function startRingtone() {
  stopRingtone()
  const c = await ready()
  if (!c) return false
  const ring = () => {
    tone(c, 440, 0.34, 0.036)
    tone(c, 554.37, 0.34, 0.028, 0.06)
    tone(c, 659.25, 0.34, 0.022, 0.12)
    window.setTimeout(() => {
      tone(c, 440, 0.34, 0.036)
      tone(c, 554.37, 0.34, 0.028, 0.06)
      tone(c, 659.25, 0.34, 0.022, 0.12)
    }, 520)
  }
  ring()
  ringTimer = window.setInterval(ring, 1900)
  return true
}

export function stopRingtone() {
  if (ringTimer !== null) window.clearInterval(ringTimer)
  ringTimer = null
}

export async function playConnect() {
  const c = await ready()
  if (!c) return
  tone(c, 620, 0.09, 0.045)
  tone(c, 820, 0.12, 0.038, 0.1)
}

export async function playTick() {
  const c = await ready()
  if (!c) return
  tone(c, 760, 0.06, 0.018)
}

export async function playHangup() {
  const c = await ready()
  if (!c) return
  tone(c, 520, 0.12, 0.04)
  tone(c, 390, 0.18, 0.035, 0.13)
}
