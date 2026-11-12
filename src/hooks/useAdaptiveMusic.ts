import { useEffect } from 'react'
import { MAX_SPEED, START_SPEED, isFrenzy, type Phase } from '../game'
import { setMusicIntensity, startMusic, stopMusic } from '../sound'

interface AdaptiveMusicOptions {
  soundOn: boolean
  phase: Phase
  speed: number
  combo: number
  paused: boolean
}

export const useAdaptiveMusic = ({
  soundOn,
  phase,
  speed,
  combo,
  paused,
}: AdaptiveMusicOptions) => {
  useEffect(() => {
    if (soundOn && phase === 'playing' && !paused) {
      startMusic()
    } else {
      stopMusic()
    }
  }, [soundOn, phase, paused])

  useEffect(() => {
    if (phase !== 'playing') {
      return
    }
    const speedRatio = (speed - START_SPEED) / (MAX_SPEED - START_SPEED)
    setMusicIntensity(
      Math.min(
        1,
        Math.max(0, speedRatio) * 0.75 + (isFrenzy(combo) ? 0.25 : 0),
      ),
    )
  }, [phase, speed, combo])

  useEffect(() => () => stopMusic(), [])
}
