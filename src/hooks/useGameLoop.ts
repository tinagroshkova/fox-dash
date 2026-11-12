import { useEffect, type RefObject } from 'react'
import type { SceneBanner } from '../components/GameScene'
import { step, type GameEvent, type Phase, type World } from '../game'
import { playCombo } from '../sound'
import { skinFor, skinName } from '../skins'
import { saveTotalBerries } from '../storage'

interface GameLoopOptions {
  phase: Phase
  paused: boolean
  worldRef: RefObject<World>
  commit: (next: World) => void
  jumpQueued: RefObject<boolean>
  jumpHeld: RefObject<boolean>
  duckHeld: RefObject<boolean>
  freezeUntil: RefObject<number>
  soundRef: RefObject<boolean>
  totalBerriesRef: RefObject<number>
  setTotalBerries: (total: number) => void
  handleEvents: (events: GameEvent[]) => void
  checkAchievements: (world: World) => void
  showBanner: (text: string, tone: SceneBanner['tone']) => void
}

export const useGameLoop = ({
  phase,
  paused,
  worldRef,
  commit,
  jumpQueued,
  jumpHeld,
  duckHeld,
  freezeUntil,
  soundRef,
  totalBerriesRef,
  setTotalBerries,
  handleEvents,
  checkAchievements,
  showBanner,
}: GameLoopOptions) => {
  useEffect(() => {
    if (phase !== 'playing' || paused) {
      return
    }

    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      if (now < freezeUntil.current) {
        last = now
        frame = requestAnimationFrame(tick)
        return
      }

      const dt = (now - last) / 1000
      last = now

      const input = {
        jump: jumpQueued.current,
        duck: duckHeld.current,
        jumpHeld: jumpHeld.current,
      }
      jumpQueued.current = false

      const before = worldRef.current
      const next = step(before, dt, input)
      if (next !== before) {
        const gained = next.berriesCollected - before.berriesCollected
        if (gained > 0) {
          const previousSkin = skinFor(totalBerriesRef.current)
          totalBerriesRef.current += gained
          const unlockedSkin = skinFor(totalBerriesRef.current)
          setTotalBerries(totalBerriesRef.current)
          saveTotalBerries(totalBerriesRef.current)
          if (unlockedSkin !== previousSkin) {
            showBanner(`${skinName(unlockedSkin)} fox unlocked!`, 'unlock')
            if (soundRef.current) {
              playCombo(4)
            }
          }
        }

        commit(next)
        handleEvents(next.events)
        checkAchievements(next)
      }

      if (next.phase === 'playing') {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [
    phase,
    paused,
    worldRef,
    commit,
    jumpQueued,
    jumpHeld,
    duckHeld,
    freezeUntil,
    soundRef,
    totalBerriesRef,
    setTotalBerries,
    handleEvents,
    checkAchievements,
    showBanner,
  ])
}
