import { useEffect, type RefObject } from 'react'
import { step, type GameEvent, type Phase, type World } from '../game'
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
  totalBerriesRef: RefObject<number>
  setTotalBerries: (total: number) => void
  handleEvents: (events: GameEvent[]) => void
  checkAchievements: (world: World) => void
  checkChallenges: (world: World) => void
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
  totalBerriesRef,
  setTotalBerries,
  handleEvents,
  checkAchievements,
  checkChallenges,
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
          totalBerriesRef.current += gained
          setTotalBerries(totalBerriesRef.current)
          saveTotalBerries(totalBerriesRef.current)
        }

        commit(next)
        handleEvents(next.events)
        checkAchievements(next)
        checkChallenges(next)
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
    totalBerriesRef,
    setTotalBerries,
    handleEvents,
    checkAchievements,
    checkChallenges,
  ])
}
