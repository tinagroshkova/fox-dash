import {
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import type { World } from '../game'

interface GameInputOptions {
  worldRef: RefObject<World>
  paused: boolean
  jumpQueued: RefObject<boolean>
  jumpHeld: RefObject<boolean>
  duckHeld: RefObject<boolean>
  onStart: () => void
  onTogglePause: () => void
  onPause: () => void
}

const isJumpKey = (key: string): boolean =>
  key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W'

const isDuckKey = (key: string): boolean =>
  key === 'ArrowDown' || key === 's' || key === 'S'

const isPauseKey = (key: string): boolean =>
  key === 'p' || key === 'P' || key === 'Escape'

export const useGameInput = ({
  worldRef,
  paused,
  jumpQueued,
  jumpHeld,
  duckHeld,
  onStart,
  onTogglePause,
  onPause,
}: GameInputOptions) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key
      const playing = worldRef.current.phase === 'playing'

      if (isJumpKey(key)) {
        event.preventDefault()
        if (playing && paused) {
          return
        }
        jumpHeld.current = true
        if (event.repeat) {
          return
        }
        if (playing) {
          jumpQueued.current = true
        } else {
          onStart()
        }
      } else if (isDuckKey(key)) {
        event.preventDefault()
        duckHeld.current = true
      } else if (isPauseKey(key) && playing) {
        event.preventDefault()
        onTogglePause()
      } else if (key === 'Enter' && !playing) {
        event.preventDefault()
        onStart()
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (isDuckKey(event.key)) {
        duckHeld.current = false
      }
      if (isJumpKey(event.key)) {
        jumpHeld.current = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [
    worldRef,
    paused,
    jumpQueued,
    jumpHeld,
    duckHeld,
    onStart,
    onTogglePause,
  ])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && worldRef.current.phase === 'playing') {
        jumpQueued.current = false
        jumpHeld.current = false
        duckHeld.current = false
        onPause()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [worldRef, jumpQueued, jumpHeld, duckHeld, onPause])

  useEffect(() => {
    const clearHeld = () => {
      duckHeld.current = false
      jumpHeld.current = false
    }
    window.addEventListener('pointerup', clearHeld)
    window.addEventListener('pointercancel', clearHeld)
    return () => {
      window.removeEventListener('pointerup', clearHeld)
      window.removeEventListener('pointercancel', clearHeld)
    }
  }, [duckHeld, jumpHeld])

  const handleScenePointer = useCallback(() => {
    if (worldRef.current.phase === 'playing' && !paused) {
      jumpQueued.current = true
      jumpHeld.current = true
    }
  }, [worldRef, paused, jumpQueued, jumpHeld])

  const handleJump = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      if (worldRef.current.phase === 'playing' && !paused) {
        jumpQueued.current = true
        jumpHeld.current = true
      }
    },
    [worldRef, paused, jumpQueued, jumpHeld],
  )

  const handleDuckStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      if (paused) {
        return
      }
      event.currentTarget.setPointerCapture?.(event.pointerId)
      duckHeld.current = true
    },
    [paused, duckHeld],
  )

  const handleDuckEnd = useCallback(() => {
    duckHeld.current = false
  }, [duckHeld])

  return { handleScenePointer, handleJump, handleDuckStart, handleDuckEnd }
}
