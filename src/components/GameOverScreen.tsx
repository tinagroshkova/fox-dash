import { useEffect, useState, type CSSProperties } from 'react'
import { ACHIEVEMENTS } from '../achievements'
import { formattedScore, type World } from '../game'
import { FoxLogo } from './Icons'
import shared from '../styles/shared.module.scss'
import styles from './GameOverScreen.module.scss'

interface GameOverScreenProps {
  world: World
  isNewBest: boolean
  achievements: string[]
  onRestart: () => void
}

const CONFETTI_COLORS = [
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#e11d48',
  '#fb923c',
]

const confetti = Array.from({ length: 28 }, (_, index) => ({
  index,
  left: (index * 37 + 11) % 100,
  delay: ((index * 13) % 10) / 10,
  duration: 1.8 + ((index * 7) % 13) / 10,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length] ?? '#f97316',
  spin: (index * 47) % 360,
}))

const rankFor = (world: World): string => {
  if (world.bestCombo >= 10) {
    return 'Forest Legend'
  }
  if (world.berriesCollected >= 18) {
    return 'Berry Bandit'
  }
  if (world.score >= 600) {
    return 'Trailblazer'
  }
  if (world.score >= 200) {
    return 'Acorn Apprentice'
  }
  return 'Curious Cub'
}

const useCountUp = (target: number, duration = 850): number => {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let frame = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

export const GameOverScreen = ({
  world,
  isNewBest,
  achievements,
  onRestart,
}: GameOverScreenProps) => {
  const animatedScore = useCountUp(world.score)
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const text = `I scored ${formattedScore(world.score)} in Fox Dash! ${world.berriesCollected} berries, ${world.bestCombo} best combo, ${world.nearMisses} near misses.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Fox Dash', text })
        return
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      /* share dismissed or unavailable */
    }
  }

  useEffect(() => {
    if (!copied) {
      return
    }
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <div className={styles.overlay}>
      {isNewBest && (
        <div className={styles.confetti} aria-hidden="true">
          {confetti.map((piece) => (
            <span
              key={piece.index}
              className={styles.confettiPiece}
              style={
                {
                  left: `${piece.left}%`,
                  background: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  '--spin': `${piece.spin}deg`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      <div className={styles.panel}>
        <span className={styles.mascot} aria-hidden="true">
          <FoxLogo className={styles.mascotIcon} />
        </span>

        {isNewBest ? (
          <p className={styles.badge}>New best score!</p>
        ) : (
          <p className={styles.kicker}>The forest wins this time</p>
        )}

        <h2 className={styles.title}>Run over</h2>
        <p className={styles.rank}>{rankFor(world)}</p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Score</span>
            <span className={styles.statValue}>
              {formattedScore(animatedScore)}
            </span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Berries</span>
            <span className={styles.statValue}>{world.berriesCollected}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Best combo</span>
            <span className={styles.statValue}>{world.bestCombo}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Near misses</span>
            <span className={styles.statValue}>{world.nearMisses}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Best</span>
            <span className={styles.statValue}>{formattedScore(world.best)}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Achievements</span>
            <span className={styles.statValue}>
              {achievements.length}/{ACHIEVEMENTS.length}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={shared.playButton} onClick={onRestart}>
            Run again
          </button>
          <button
            type="button"
            className={shared.secondaryButton}
            onClick={handleShare}
          >
            {copied ? 'Copied!' : 'Share run'}
          </button>
        </div>
        <p className={styles.hint}>Press Space or Enter to restart</p>
      </div>
    </div>
  )
}
