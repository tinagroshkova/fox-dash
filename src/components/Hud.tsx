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

export const Hud = ({ world }: HudProps) => {
  const hearts = Array.from({ length: MAX_HEARTS }, (_, index) => index < world.hearts)
  const multiplier = comboMultiplier(world.combo)
  const comboActive = world.combo > 0 && world.phase === 'playing'
  const comboRatio = Math.max(0, Math.min(1, world.comboTimer / COMBO_WINDOW))
  const critical = world.hearts === 1 && world.phase === 'playing'

  return (
    <div className={styles.hud}>
      <div className={styles.stat}>
        <span className={styles.label}>Score</span>
        <span className={styles.value}>{formattedScore(world.score)}</span>
      </div>

      <div
        className={`${styles.hearts} ${critical ? styles.heartsCritical : ''}`}
        role="img"
        aria-label={`${world.hearts} of ${MAX_HEARTS} hearts left`}
      >
        {hearts.map((filled, index) => (
          <HeartIcon
            key={index}
            className={filled ? styles.heartFull : styles.heartEmpty}
          />
        ))}
      </div>

      {(world.shields > 0 || world.magnetTimer > 0 || world.slowTimer > 0) && (
        <div className={styles.powerups} aria-live="polite">
          {world.shields > 0 && (
            <span
              className={`${styles.powerup} ${styles.powerupShield}`}
              title="Shield ready"
            >
              <ShieldIcon className={styles.powerupIcon} />
            </span>
          )}
          {world.magnetTimer > 0 && (
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
                      Math.min(1, world.magnetTimer / MAGNET_TIME),
                    )})`,
                  }}
                />
              </span>
            </span>
          )}
          {world.slowTimer > 0 && (
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
                      Math.min(1, world.slowTimer / SLOW_TIME),
                    )})`,
                  }}
                />
              </span>
            </span>
          )}
        </div>
      )}

      <div
        className={`${styles.combo} ${comboActive ? styles.comboActive : ''}`}
        aria-hidden={!comboActive}
      >
        <span className={styles.comboMultiplier} key={multiplier}>
          x{multiplier}
        </span>
        <span className={styles.comboLabel}>{world.combo} combo</span>
        <span className={styles.comboTrack}>
          <span
            className={styles.comboFill}
            style={{ transform: `scaleX(${comboRatio})` }}
          />
        </span>
      </div>

      <div className={styles.right}>
        <div className={`${styles.stat} ${styles.berryStat}`}>
          <BerryIcon className={styles.berryIcon} />
          <span className={styles.value}>{world.berriesCollected}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Best</span>
          <span className={styles.value}>{formattedScore(world.best)}</span>
        </div>
      </div>
    </div>
  )
}
