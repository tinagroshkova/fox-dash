import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  challengeProgress,
  dailyChallenges,
  dailyKey,
  type ChallengeDef,
} from '../challenges'
import type { SceneBanner } from '../components/GameScene'
import type { World } from '../game'
import { playCombo } from '../sound'
import {
  loadDailyChallengeState,
  saveDailyChallengeState,
} from '../storage'

interface DailyChallengesOptions {
  showBanner: (text: string, tone: SceneBanner['tone']) => void
  soundRef: RefObject<boolean>
  onReward: (bonus: number) => void
}

interface DailyChallengesResult {
  challenges: ChallengeDef[]
  completed: string[]
  checkChallenges: (world: World) => void
}

export const useDailyChallenges = ({
  showBanner,
  soundRef,
  onReward,
}: DailyChallengesOptions): DailyChallengesResult => {
  const [today] = useState(() => dailyKey())
  const [challenges] = useState(() => dailyChallenges())
  const [completed, setCompleted] = useState<string[]>(() => {
    const stored = loadDailyChallengeState()
    return stored.date === today ? stored.completed : []
  })
  const completedRef = useRef(completed)

  useEffect(() => {
    completedRef.current = completed
  }, [completed])

  const checkChallenges = useCallback(
    (world: World) => {
      if (world.phase === 'ready') {
        return
      }

      const done = new Set(completedRef.current)
      const newly = challenges.filter(
        (def) =>
          !done.has(def.id) &&
          challengeProgress(world, def.kind) >= def.target,
      )
      if (newly.length === 0) {
        return
      }

      const ids = [...completedRef.current, ...newly.map((def) => def.id)]
      completedRef.current = ids
      setCompleted(ids)
      saveDailyChallengeState({ date: today, completed: ids })

      const reward = newly.reduce((sum, def) => sum + def.reward, 0)
      onReward(reward)
      const label =
        newly.length === 1
          ? newly[0]?.label ?? 'Challenge complete'
          : `${newly.length} challenges complete`
      showBanner(`Daily: ${label}`, 'unlock')
      if (soundRef.current) {
        playCombo(5)
      }
    },
    [challenges, today, onReward, showBanner, soundRef],
  )

  return { challenges, completed, checkChallenges }
}
