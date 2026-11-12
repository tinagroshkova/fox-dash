import { useCallback, useEffect, useRef, useState } from 'react'
import { EFFECT_DURATION, type VisualEffect } from '../effects'

export const useVisualEffects = () => {
  const [effects, setEffects] = useState<VisualEffect[]>([])
  const effectId = useRef(1)
  const timeouts = useRef<number[]>([])

  const schedule = useCallback((task: () => void, delay: number) => {
    const timer = window.setTimeout(task, delay)
    timeouts.current.push(timer)
  }, [])

  const spawnEffect = useCallback(
    (effect: VisualEffect) => {
      setEffects((list) => [...list, effect])
      schedule(() => {
        setEffects((list) => list.filter((item) => item.id !== effect.id))
      }, EFFECT_DURATION)
    },
    [schedule],
  )

  const clearEffects = useCallback(() => setEffects([]), [])

  useEffect(
    () => () => {
      timeouts.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  return { effects, effectId, schedule, spawnEffect, clearEffects }
}
