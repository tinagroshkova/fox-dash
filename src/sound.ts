let context: AudioContext | null = null

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) {
    return null
  }
  if (!context) {
    context = new Ctor()
  }
  if (context.state === 'suspended') {
    void context.resume()
  }
  return context
}

interface ToneOptions {
  frequency: number
  duration: number
  type?: OscillatorType
  gain?: number
  delay?: number
  endFrequency?: number
}

const tone = ({
  frequency,
  duration,
  type = 'sine',
  gain = 0.07,
  delay = 0,
  endFrequency,
}: ToneOptions): void => {
  const ctx = getContext()
  if (!ctx) {
    return
  }
  const start = ctx.currentTime + delay
  const oscillator = ctx.createOscillator()
  const envelope = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  if (endFrequency !== undefined) {
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      start + duration,
    )
  }

  envelope.gain.setValueAtTime(0.0001, start)
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(envelope)
  envelope.connect(ctx.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

export const playJump = (): void =>
  tone({ frequency: 320, endFrequency: 560, duration: 0.16, type: 'triangle', gain: 0.06 })

export const playDoubleJump = (): void => {
  tone({ frequency: 460, endFrequency: 820, duration: 0.18, type: 'triangle', gain: 0.07 })
  tone({ frequency: 1040, duration: 0.14, type: 'sine', gain: 0.05, delay: 0.08 })
}

export const playBerry = (combo = 1): void => {
  const lift = Math.min(combo, 8) * 32
  tone({ frequency: 880 + lift, duration: 0.09, type: 'sine', gain: 0.06 })
  tone({
    frequency: 1320 + lift,
    duration: 0.11,
    type: 'sine',
    gain: 0.05,
    delay: 0.06,
  })
  if (combo >= 4) {
    tone({
      frequency: 1760 + lift,
      duration: 0.14,
      type: 'triangle',
      gain: 0.04,
      delay: 0.11,
    })
  }
}

export const playHit = (): void => {
  tone({ frequency: 220, endFrequency: 90, duration: 0.28, type: 'sawtooth', gain: 0.08 })
}

export const playGameOver = (): void => {
  tone({ frequency: 392, duration: 0.18, type: 'triangle', gain: 0.07 })
  tone({ frequency: 311, duration: 0.18, type: 'triangle', gain: 0.07, delay: 0.16 })
  tone({ frequency: 233, duration: 0.34, type: 'triangle', gain: 0.07, delay: 0.32 })
}

export const playStart = (): void => {
  tone({ frequency: 523, duration: 0.12, type: 'triangle', gain: 0.06 })
  tone({ frequency: 784, duration: 0.16, type: 'triangle', gain: 0.06, delay: 0.1 })
}

export const playPickup = (kind: 'shield' | 'magnet' | 'slow'): void => {
  const base = kind === 'shield' ? 520 : kind === 'magnet' ? 620 : 440
  tone({ frequency: base, duration: 0.12, type: 'triangle', gain: 0.07 })
  tone({ frequency: base * 1.5, duration: 0.16, type: 'sine', gain: 0.06, delay: 0.08 })
  tone({ frequency: base * 2, duration: 0.18, type: 'sine', gain: 0.04, delay: 0.16 })
}

export const playShield = (): void => {
  tone({ frequency: 700, endFrequency: 1300, duration: 0.24, type: 'triangle', gain: 0.08 })
  tone({ frequency: 1200, duration: 0.18, type: 'sine', gain: 0.05, delay: 0.12 })
}

export const playNearMiss = (): void => {
  tone({ frequency: 900, endFrequency: 320, duration: 0.18, type: 'sawtooth', gain: 0.03 })
}

export const playLand = (): void => {
  tone({ frequency: 180, endFrequency: 120, duration: 0.09, type: 'triangle', gain: 0.025 })
}

export const playCombo = (multiplier: number): void => {
  const base = 520 + Math.min(multiplier, 6) * 90
  tone({ frequency: base, duration: 0.1, type: 'triangle', gain: 0.05 })
  tone({ frequency: base * 1.5, duration: 0.14, type: 'triangle', gain: 0.04, delay: 0.06 })
}

const MUSIC_NOTES = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66]
const MUSIC_BASS = [130.81, 110, 98, 130.81]

let musicTimer: number | null = null
let musicStep = 0
let musicInterval = 560
let musicIntensity = 0

const musicTick = (): void => {
  const note = MUSIC_NOTES[musicStep % MUSIC_NOTES.length] ?? 261.63
  const bass = MUSIC_BASS[Math.floor(musicStep / 4) % MUSIC_BASS.length] ?? 130.81
  tone({
    frequency: note,
    duration: 0.22,
    type: 'triangle',
    gain: 0.018 + musicIntensity * 0.012,
  })
  if (musicStep % 4 === 0) {
    tone({ frequency: bass, duration: 0.38, type: 'sine', gain: 0.026 })
  }
  if (musicIntensity > 0.55 && musicStep % 2 === 1) {
    tone({ frequency: note * 2, duration: 0.08, type: 'sine', gain: 0.012 })
  }
  musicStep += 1
}

export const startMusic = (): void => {
  if (musicTimer !== null || typeof window === 'undefined') {
    return
  }
  musicStep = 0
  musicTick()
  musicTimer = window.setInterval(musicTick, musicInterval)
}

export const stopMusic = (): void => {
  if (musicTimer !== null) {
    window.clearInterval(musicTimer)
    musicTimer = null
  }
}

export const setMusicIntensity = (value: number): void => {
  const clamped = Math.min(1, Math.max(0, value))
  musicIntensity = clamped
  const nextInterval = Math.round(560 - clamped * 200)
  if (Math.abs(nextInterval - musicInterval) >= 30) {
    musicInterval = nextInterval
    if (musicTimer !== null) {
      window.clearInterval(musicTimer)
      musicTimer = window.setInterval(musicTick, musicInterval)
    }
  }
}
