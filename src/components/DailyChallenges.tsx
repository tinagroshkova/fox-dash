import { challengeProgress, type ChallengeDef } from '../challenges'
import type { World } from '../game'
import { BerryIcon } from './Icons'
import styles from './DailyChallenges.module.scss'

interface DailyChallengesProps {
  challenges: ChallengeDef[]
  completed: string[]
  world?: World
}

export const DailyChallenges = ({
  challenges,
  completed,
  world,
}: DailyChallengesProps) => {
  const completedCount = challenges.filter((def) =>
    completed.includes(def.id),
  ).length

  return (
    <section className={styles.card} aria-label="Daily challenges">
      <header className={styles.header}>
        <div>
          <p className={styles.title}>Daily challenges</p>
          <p className={styles.subtitle}>New set every day</p>
        </div>
        <span className={styles.count}>
          {completedCount}/{challenges.length}
        </span>
      </header>

      <ul className={styles.list}>
        {challenges.map((def) => {
          const done = completed.includes(def.id)
          const current = world
            ? Math.min(def.target, challengeProgress(world, def.kind))
            : 0
          const ratio = done ? 1 : Math.min(1, current / def.target)

          return (
            <li
              key={def.id}
              className={`${styles.item} ${done ? styles.done : ''}`}
            >
              <div className={styles.row}>
                <span className={styles.label}>{def.label}</span>
                <span className={styles.reward}>
                  <BerryIcon className={styles.rewardIcon} />+{def.reward}
                </span>
              </div>
              <div className={styles.progressRow}>
                <span className={styles.track}>
                  <span
                    className={styles.fill}
                    style={{ transform: `scaleX(${ratio})` }}
                  />
                </span>
                <span className={styles.progressText}>
                  {done ? 'Done' : `${current}/${def.target}`}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
