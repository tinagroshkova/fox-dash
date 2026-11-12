import { FRENZY_COMBO, comboMultiplier } from '../game'

const COMBO_MILESTONES = [5, 10, 15, 20, 25]

export interface ComboCelebration {
  text: string
  tone: 'combo' | 'frenzy'
  multiplier: number
}

export const comboCelebration = (
  combo: number,
  previousCombo: number,
): ComboCelebration | null => {
  if (combo >= FRENZY_COMBO && previousCombo < FRENZY_COMBO) {
    return { text: 'Frenzy!', tone: 'frenzy', multiplier: 5 }
  }

  const crossed = COMBO_MILESTONES.filter(
    (milestone) => combo >= milestone && previousCombo < milestone,
  ).pop()

  if (!crossed) {
    return null
  }

  return {
    text: `${crossed} combo!`,
    tone: 'combo',
    multiplier: comboMultiplier(crossed),
  }
}
