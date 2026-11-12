import type { World } from './game'

export interface AchievementDef {
  id: string
  name: string
  description: string
  check: (world: World) => boolean
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-berry',
    name: 'First Snack',
    description: 'Collect your first berry',
    check: (world) => world.berriesCollected >= 1,
  },
  {
    id: 'combo-8',
    name: 'Combo Master',
    description: 'Reach an 8-berry combo',
    check: (world) => world.bestCombo >= 8,
  },
  {
    id: 'collector',
    name: 'Berry Bandit',
    description: 'Collect 15 berries in one run',
    check: (world) => world.berriesCollected >= 15,
  },
  {
    id: 'trailblazer',
    name: 'Trailblazer',
    description: 'Travel 2,000m in one run',
    check: (world) => world.distance >= 20000,
  },
  {
    id: 'living-dangerously',
    name: 'Living Dangerously',
    description: 'Score 5 near misses in one run',
    check: (world) => world.nearMisses >= 5,
  },
]

export const evaluateAchievements = (
  world: World,
  unlocked: ReadonlySet<string>,
): AchievementDef[] =>
  ACHIEVEMENTS.filter((def) => !unlocked.has(def.id) && def.check(world))
