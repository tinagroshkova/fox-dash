import { useCallback, type RefObject } from 'react'
import { evaluateAchievements } from '../achievements'
import type { SceneBanner } from '../components/GameScene'
import type { World } from '../game'
import { playCombo } from '../sound'
import { saveAchievements } from '../storage'

interface AchievementsOptions {
  achievementsRef: RefObject<string[]>
  setAchievements: (ids: string[]) => void
  showBanner: (text: string, tone: SceneBanner['tone']) => void
  soundRef: RefObject<boolean>
}

export const useAchievements = ({
  achievementsRef,
  setAchievements,
  showBanner,
  soundRef,
}: AchievementsOptions) =>
  useCallback(
    (next: World) => {
      const unlocked = new Set(achievementsRef.current)
      const earned = evaluateAchievements(next, unlocked)
      if (earned.length === 0) {
        return
      }

      const ids = [...achievementsRef.current, ...earned.map((def) => def.id)]
      achievementsRef.current = ids
      setAchievements(ids)
      saveAchievements(ids)
      showBanner(`Achievement: ${earned[0]?.name ?? 'Unlocked'}`, 'unlock')
      if (soundRef.current) {
        playCombo(4)
      }
    },
    [achievementsRef, setAchievements, showBanner, soundRef],
  )
