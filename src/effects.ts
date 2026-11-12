export const EFFECT_DURATION = 900

export type EffectKind =
  | 'score'
  | 'hit'
  | 'double'
  | 'life'
  | 'pickup'
  | 'shield'
  | 'near'
  | 'land'

export interface Particle {
  dx: number
  dy: number
  size: number
  delay: number
  tone: 'berry' | 'gold' | 'leaf' | 'spark' | 'dust'
}

export interface VisualEffect {
  id: number
  kind: EffectKind
  x: number
  y: number
  value: number
  multiplier: number
  label?: string
  particles: Particle[]
}

const TONES: Particle['tone'][] = ['berry', 'gold', 'leaf', 'spark']

const makeParticles = (
  seed: number,
  count: number,
  tones: Particle['tone'][],
): Particle[] => {
  let state = seed >>> 0
  const random = (): number => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }

  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2 + random() * 0.4
    const distance = 34 + random() * 62
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance - 18,
      size: 3 + random() * 6,
      delay: random() * 0.08,
      tone: tones[index % tones.length] ?? 'berry',
    }
  })
}

export const createBerryEffect = (
  id: number,
  x: number,
  y: number,
  value: number,
  multiplier: number,
): VisualEffect => ({
  id,
  kind: 'score',
  x,
  y,
  value,
  multiplier,
  particles: makeParticles(id * 97 + 13, multiplier >= 3 ? 14 : 10, TONES),
})

export const createHitEffect = (
  id: number,
  x: number,
  y: number,
): VisualEffect => ({
  id,
  kind: 'hit',
  x,
  y,
  value: 0,
  multiplier: 0,
  particles: makeParticles(id * 61 + 7, 12, ['spark', 'gold']),
})

export const createDoubleJumpEffect = (
  id: number,
  x: number,
  y: number,
): VisualEffect => ({
  id,
  kind: 'double',
  x,
  y,
  value: 0,
  multiplier: 0,
  particles: makeParticles(id * 53 + 5, 12, ['gold', 'spark', 'leaf']),
})

export const createLifeLostEffect = (
  id: number,
  x: number,
  y: number,
): VisualEffect => ({
  id,
  kind: 'life',
  x,
  y,
  value: 1,
  multiplier: 0,
  particles: makeParticles(id * 43 + 11, 10, ['berry', 'spark']),
})

export const createPickupEffect = (
  id: number,
  x: number,
  y: number,
  label: string,
): VisualEffect => ({
  id,
  kind: 'pickup',
  x,
  y,
  value: 0,
  multiplier: 0,
  label,
  particles: makeParticles(id * 71 + 9, 14, ['gold', 'spark', 'leaf']),
})

export const createShieldBreakEffect = (
  id: number,
  x: number,
  y: number,
): VisualEffect => ({
  id,
  kind: 'shield',
  x,
  y,
  value: 0,
  multiplier: 0,
  particles: makeParticles(id * 89 + 3, 16, ['spark', 'gold']),
})

export const createNearMissEffect = (
  id: number,
  x: number,
  y: number,
  value: number,
): VisualEffect => ({
  id,
  kind: 'near',
  x,
  y,
  value,
  multiplier: 1,
  particles: makeParticles(id * 59 + 17, 8, ['spark', 'leaf']),
})

export const createLandingEffect = (
  id: number,
  x: number,
  y: number,
): VisualEffect => ({
  id,
  kind: 'land',
  x,
  y,
  value: 0,
  multiplier: 0,
  particles: makeParticles(id * 31 + 19, 7, ['dust', 'leaf']),
})
