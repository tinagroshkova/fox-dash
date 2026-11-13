import { memo } from 'react'
import {
  COMBO_WINDOW,
  MAGNET_TIME,
  MAX_HEARTS,
  SLOW_TIME,
  comboMultiplier,
  formattedScore,
  type World,
} from '../game'
import { BerryIcon, ClockIcon, HeartIcon, MagnetIcon, ShieldIcon } from './Icons'
import styles from './Hud.module.scss'

interface HudProps {
  world: World
}

const HEART_SLOTS = Array.from({ length: MAX_HEARTS }, (_, index) => index)

interface HeartsProps {
  hearts: number
  critical: boolean
}

const Hearts = memo(({ hearts, critical }: HeartsProps) => (
  <div
    className={`${styles.hearts} ${critical ? styles.heartsCritical : ''}`}
    role="img"
    aria-label={`${hearts} of ${MAX_HEARTS} hearts left`}
  >
    {HEART_SLOTS.map((index) => (
      <HeartIcon
        key={index}
        className={index < hearts ? styles.heartFull : styles.heartEmpty}
      />
    ))}
  </div>
))

Hearts.displayName = 'Hearts'

interface PowerupsProps {
  shields: number
  magnetTimer: number
  slowTimer: number
}

const Powerups = memo(
  ({ shields, magnetTimer, slowTimer }: PowerupsProps) => {
    if (shields <= 0 && magnetTimer <= 0 && slowTimer <= 0) {
      return null
    }

    return (
      <div className={styles.powerups} aria-live="polite">
        {shields > 0 && (
          <span
            className={`${styles.powerup} ${styles.powerupShield}`}
            title="Shield ready"
          >
            <ShieldIcon className={styles.powerupIcon} />
          </span>
        )}
        {magnetTimer > 0 && (
          <span
            className={`${styles.powerup} ${styles.powerupMagnet}`}
            title="Berry magnet"
          >
            <MagnetIcon className={styles.powerupIcon} />
            <span className={styles.powerupTrack}>
              <span
                className={styles.powerupFill}
                style={{
                  transform: `scaleX(${Math.max(
                    0,
                    Math.min(1, magnetTimer / MAGNET_TIME),
                  )})`,
                }}
              />
            </span>
          </span>
        )}
        {slowTimer > 0 && (
          <span
            className={`${styles.powerup} ${styles.powerupSlow}`}
            title="Slow motion"
          >
            <ClockIcon className={styles.powerupIcon} />
            <span className={styles.powerupTrack}>
              <span
                className={styles.powerupFill}
                style={{
                  transform: `scaleX(${Math.max(
                    0,
                    Math.min(1, slowTimer / SLOW_TIME),
                  )})`,
                }}
              />
            </span>
          </span>
        )}
      </div>
    )
  },
)

Powerups.displayName = 'Powerups'

interface ComboMeterProps {
  combo: number
  comboTimer: number
  active: boolean
}

const ComboMeter = memo(({ combo, comboTimer, active }: ComboMeterProps) => {
  const multiplier = comboMultiplier(combo)
  const ratio = Math.max(0, Math.min(1, comboTimer / COMBO_WINDOW))

  return (
    <div
      className={`${styles.combo} ${active ? styles.comboActive : ''}`}
      aria-hidden={!active}
    >
      <span className={styles.comboMultiplier} key={multiplier}>
        x{multiplier}
      </span>
      <span className={styles.comboLabel}>{combo} combo</span>
      <span className={styles.comboTrack}>
        <span
          className={styles.comboFill}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </span>
    </div>
  )
})

ComboMeter.displayName = 'ComboMeter'

interface RightStatsProps {
  berries: number
  best: number
}

const RightStats = memo(({ berries, best }: RightStatsProps) => (
  <div className={styles.right}>
    <div className={`${styles.stat} ${styles.berryStat}`}>
      <BerryIcon className={styles.berryIcon} />
      <span className={styles.value}>{berries}</span>
    </div>
    <div className={styles.stat}>
      <span className={styles.label}>Best</span>
      <span className={styles.value}>{formattedScore(best)}</span>
    </div>
  </div>
))

RightStats.displayName = 'RightStats'

export const Hud = ({ world }: HudProps) => {
  const critical = world.hearts === 1 && world.phase === 'playing'

  return (
    <div className={styles.hud}>
      <div className={styles.stat}>
        <span className={styles.label}>Score</span>
        <span className={styles.value}>{formattedScore(world.score)}</span>
      </div>

      <Hearts hearts={world.hearts} critical={critical} />
      <Powerups
        shields={world.shields}
        magnetTimer={world.magnetTimer}
        slowTimer={world.slowTimer}
      />
      <ComboMeter
        combo={world.combo}
        comboTimer={world.comboTimer}
        active={world.combo > 0 && world.phase === 'playing'}
      />
      <RightStats berries={world.berriesCollected} best={world.best} />
    </div>
  )
}
