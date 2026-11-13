import { describe, expect, it } from 'vitest'
import {
  challengeProgress,
  dailyChallenges,
  dailyKey,
} from './challenges'
import { createWorld, startRun } from './game'

describe('dailyKey', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(dailyKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('dailyChallenges', () => {
  it('returns three unique challenges from distinct kinds', () => {
    const list = dailyChallenges(new Date(2026, 0, 5))
    expect(list).toHaveLength(3)
    expect(new Set(list.map((def) => def.id)).size).toBe(3)
    expect(new Set(list.map((def) => def.kind)).size).toBe(3)
  })

  it('is deterministic for the same day', () => {
    const morning = dailyChallenges(new Date(2026, 0, 5, 8, 0))
    const night = dailyChallenges(new Date(2026, 0, 5, 23, 59))
    expect(morning.map((def) => def.id)).toEqual(night.map((def) => def.id))
  })

  it('rotates the challenge set across days', () => {
    const first = dailyChallenges(new Date(2026, 0, 5))
    const second = dailyChallenges(new Date(2026, 0, 6))
    expect(first.map((def) => def.id)).not.toEqual(second.map((def) => def.id))
  })
})

describe('challengeProgress', () => {
  const world = {
    ...startRun(createWorld()),
    berriesCollected: 12,
    nearMisses: 3,
    bestCombo: 7,
    distance: 4567,
    powerupsCollected: 2,
  }

  it('reads berries, near misses, and combos from the run', () => {
    expect(challengeProgress(world, 'berries')).toBe(12)
    expect(challengeProgress(world, 'nearMisses')).toBe(3)
    expect(challengeProgress(world, 'combo')).toBe(7)
  })

  it('converts distance to meters', () => {
    expect(challengeProgress(world, 'distance')).toBe(456)
  })

  it('counts collected power-ups', () => {
    expect(challengeProgress(world, 'powerups')).toBe(2)
  })
})
