import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'
import type { SceneBanner } from '../components/GameScene'
import {
  createBerryEffect,
  createDoubleJumpEffect,
  createHitEffect,
  createLandingEffect,
  createLifeLostEffect,
  createNearMissEffect,
  createPickupEffect,
  createShieldBreakEffect,
  type VisualEffect,
} from '../effects'
import { FOX_WIDTH, FOX_X, type GameEvent, type World } from '../game'
import { comboCelebration } from '../helpers/combo'
import {
  playBerry,
  playCombo,
  playDoubleJump,
  playGameOver,
  playHit,
  playJump,
  playLand,
  playNearMiss,
  playPickup,
  playShield,
} from '../sound'
import { saveBest } from '../storage'

interface GameEventsOptions {
  worldRef: RefObject<World>
  soundRef: RefObject<boolean>
  runStartBest: RefObject<number>
  effectId: RefObject<number>
  lastCombo: RefObject<number>
  freezeUntil: RefObject<number>
  spawnEffect: (effect: VisualEffect) => void
  schedule: (task: () => void, delay: number) => void
  showBanner: (text: string, tone: SceneBanner['tone']) => void
  setFlipping: Dispatch<SetStateAction<boolean>>
  setShaking: Dispatch<SetStateAction<boolean>>
  setDamaged: Dispatch<SetStateAction<boolean>>
  setNewBest: Dispatch<SetStateAction<boolean>>
}

export const useGameEvents = ({
  worldRef,
  soundRef,
  runStartBest,
  effectId,
  lastCombo,
  freezeUntil,
  spawnEffect,
  schedule,
  showBanner,
  setFlipping,
  setShaking,
  setDamaged,
  setNewBest,
}: GameEventsOptions) =>
  useCallback(
    (events: GameEvent[]) => {
      for (const event of events) {
        if (event.type === 'jump') {
          if (event.double) {
            if (soundRef.current) {
              playDoubleJump()
            }
            const fox = worldRef.current.fox
            spawnEffect(
              createDoubleJumpEffect(
                effectId.current++,
                FOX_X + FOX_WIDTH / 2,
                fox.y + 40,
              ),
            )
            setFlipping(true)
            schedule(() => setFlipping(false), 560)
          } else if (soundRef.current) {
            playJump()
          }
        } else if (event.type === 'berry') {
          if (soundRef.current) {
            playBerry(event.combo ?? 1)
          }
          spawnEffect(
            createBerryEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH / 2,
              event.y ?? 40,
              event.value ?? 0,
              event.multiplier ?? 1,
            ),
          )

          const combo = event.combo ?? 1
          const celebration = comboCelebration(combo, lastCombo.current)
          lastCombo.current = combo
          if (celebration) {
            showBanner(celebration.text, celebration.tone)
            if (soundRef.current) {
              playCombo(celebration.multiplier)
            }
          }
        } else if (event.type === 'hit') {
          if (soundRef.current) {
            playHit()
          }
          const fox = worldRef.current.fox
          spawnEffect(
            createHitEffect(effectId.current++, FOX_X + FOX_WIDTH / 2, fox.y + 36),
          )
          spawnEffect(
            createLifeLostEffect(
              effectId.current++,
              FOX_X + FOX_WIDTH / 2,
              fox.y + 88,
            ),
          )
          lastCombo.current = 0
          freezeUntil.current = performance.now() + 70
          navigator.vibrate?.(60)
          setShaking(true)
          setDamaged(true)
          schedule(() => setShaking(false), 340)
          schedule(() => setDamaged(false), 420)
        } else if (event.type === 'land') {
          if (soundRef.current) {
            playLand()
          }
          spawnEffect(
            createLandingEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH / 2,
              event.y ?? 0,
            ),
          )
        } else if (event.type === 'pickup') {
          const kind = event.pickup ?? 'shield'
          if (soundRef.current) {
            playPickup(kind)
          }
          spawnEffect(
            createPickupEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH / 2,
              event.y ?? 60,
              event.label ?? 'Power-up!',
            ),
          )
          navigator.vibrate?.(14)
        } else if (event.type === 'shield') {
          if (soundRef.current) {
            playShield()
          }
          const fox = worldRef.current.fox
          spawnEffect(
            createShieldBreakEffect(
              effectId.current++,
              FOX_X + FOX_WIDTH / 2,
              fox.y + 40,
            ),
          )
          freezeUntil.current = performance.now() + 55
          navigator.vibrate?.(28)
          setShaking(true)
          schedule(() => setShaking(false), 300)
        } else if (event.type === 'nearmiss') {
          if (soundRef.current) {
            playNearMiss()
          }
          spawnEffect(
            createNearMissEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH,
              event.y ?? 60,
              event.value ?? 0,
            ),
          )
        } else if (event.type === 'gameover') {
          const score = Math.floor(worldRef.current.score)
          const isNew = score > runStartBest.current
          setNewBest(isNew)
          if (isNew) {
            saveBest(score)
          }
          if (soundRef.current) {
            playGameOver()
          }
          navigator.vibrate?.([40, 60, 80])
        }
      }
    },
    [
      worldRef,
      soundRef,
      runStartBest,
      effectId,
      lastCombo,
      freezeUntil,
      spawnEffect,
      schedule,
      showBanner,
      setFlipping,
      setShaking,
      setDamaged,
      setNewBest,
    ],
  )
