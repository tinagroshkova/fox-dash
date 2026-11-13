import { createSeededRandom, type World } from './game'

export type ChallengeKind =
  | 'berries'
  | 'nearMisses'
  | 'combo'
  | 'distance'
  | 'powerups'

export interface ChallengeDef {
  id: string
  kind: ChallengeKind
  label: string
  target: number
  reward: number
}

const CHALLENGE_POOL: Record<ChallengeKind, ChallengeDef[]> = {
  berries: [
    {
      id: 'berries-30',
      kind: 'berries',
      label: 'Collect 30 berries',
      target: 30,
      reward: 20,
    },
    {
      id: 'berries-45',
      kind: 'berries',
      label: 'Collect 45 berries',
      target: 45,
      reward: 30,
    },
    {
      id: 'berries-60',
      kind: 'berries',
      label: 'Collect 60 berries',
      target: 60,
      reward: 40,
    },
  ],
  nearMisses: [
    {
      id: 'near-misses-4',
      kind: 'nearMisses',
      label: 'Score 4 near misses',
      target: 4,
      reward: 15,
    },
    {
      id: 'near-misses-6',
      kind: 'nearMisses',
      label: 'Score 6 near misses',
      target: 6,
      reward: 20,
    },
    {
      id: 'near-misses-8',
      kind: 'nearMisses',
      label: 'Score 8 near misses',
      target: 8,
      reward: 30,
    },
  ],
  combo: [
    {
      id: 'combo-8',
      kind: 'combo',
      label: 'Reach an 8x combo',
      target: 8,
      reward: 20,
    },
    {
      id: 'combo-12',
      kind: 'combo',
      label: 'Reach a 12x combo',
      target: 12,
      reward: 30,
    },
    {
      id: 'combo-16',
      kind: 'combo',
      label: 'Reach a 16x combo',
      target: 16,
      reward: 40,
    },
  ],
  distance: [
    {
      id: 'distance-300',
      kind: 'distance',
      label: 'Run 300m',
      target: 300,
      reward: 20,
    },
    {
      id: 'distance-600',
      kind: 'distance',
      label: 'Run 600m',
      target: 600,
      reward: 30,
    },
    {
      id: 'distance-1000',
      kind: 'distance',
      label: 'Run 1,000m',
      target: 1000,
      reward: 40,
    },
  ],
  powerups: [
    {
      id: 'powerups-2',
      kind: 'powerups',
      label: 'Grab 2 power-ups',
      target: 2,
      reward: 15,
    },
    {
      id: 'powerups-3',
      kind: 'powerups',
      label: 'Grab 3 power-ups',
      target: 3,
      reward: 20,
    },
    {
      id: 'powerups-4',
      kind: 'powerups',
      label: 'Grab 4 power-ups',
      target: 4,
      reward: 30,
    },
  ],
}

const CHALLENGE_KINDS = Object.keys(CHALLENGE_POOL) as ChallengeKind[]

export const dailyKey = (date = new Date()): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const hash = (text: string): number => {
  let value = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index)
    value = Math.imul(value, 16777619)
  }
  return value >>> 0
}

const shuffle = <T>(items: T[], rng: () => number): T[] => {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1))
    const current = items[index]
    const swap = items[swapIndex]
    if (current === undefined || swap === undefined) {
      continue
    }
    items[index] = swap
    items[swapIndex] = current
  }
  return items
}

export const dailyChallenges = (date = new Date()): ChallengeDef[] => {
  const rng = createSeededRandom(hash(dailyKey(date)))
  const kinds = shuffle([...CHALLENGE_KINDS], rng)
  return kinds.slice(0, 3).map((kind) => {
    const options = CHALLENGE_POOL[kind]
    const option = options[Math.floor(rng() * options.length)] ?? options[0]
    if (!option) {
      throw new Error(`No challenges configured for ${kind}`)
    }
    return option
  })
}

export const challengeProgress = (
  world: World,
  kind: ChallengeKind,
): number => {
  switch (kind) {
    case 'berries':
      return world.berriesCollected
    case 'nearMisses':
      return world.nearMisses
    case 'combo':
      return world.bestCombo
    case 'distance':
      return Math.floor(world.distance / 10)
    case 'powerups':
      return world.powerupsCollected
  }
}
