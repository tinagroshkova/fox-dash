import { formattedScore } from '../game'
import { skinName, type Skin } from '../skins'
import type { ChallengeDef } from '../challenges'
import shared from '../styles/shared.module.scss'
import { DailyChallenges } from './DailyChallenges'
import styles from './StartScreen.module.scss'

interface StartScreenProps {
  best: number
  skin: Skin
  totalBerries: number
  challenges: ChallengeDef[]
  completedChallenges: string[]
  onOpenShop: () => void
  onPlay: () => void
}

export const StartScreen = ({
  best,
  skin,
  totalBerries,
  challenges,
  completedChallenges,
  onOpenShop,
  onPlay,
}: StartScreenProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <p className={styles.kicker}>Endless forest run</p>
        <h2 className={styles.title}>Ready, set, dash!</h2>
        <p className={styles.blurb}>
          Help the little fox race through the forest. Jump over rocks, duck under
          branches, and gobble up berries for bonus points. Press jump again in
          mid-air for a spin jump.
        </p>

        <div className={styles.controls}>
          <div className={styles.control}>
            <span className={styles.key}>Space</span>
            <span className={styles.controlLabel}>Jump</span>
          </div>
          <div className={styles.control}>
            <span className={styles.key}>2x</span>
            <span className={styles.controlLabel}>Double jump</span>
          </div>
          <div className={styles.control}>
            <span className={styles.key}>Down</span>
            <span className={styles.controlLabel}>Duck</span>
          </div>
          <div className={styles.control}>
            <span className={styles.key}>Tap</span>
            <span className={styles.controlLabel}>Jump</span>
          </div>
        </div>

        <DailyChallenges
          challenges={challenges}
          completed={completedChallenges}
        />

        <div className={styles.wardrobe}>
          <p className={styles.skin}>
            Fox: <strong>{skinName(skin)}</strong> · {totalBerries} berries
          </p>
          <button
            type="button"
            className={shared.secondaryButton}
            onClick={onOpenShop}
          >
            Wardrobe
          </button>
        </div>

        <button type="button" className={shared.playButton} onClick={onPlay}>
          Play
        </button>

        {best > 0 && (
          <p className={styles.best}>Best score: {formattedScore(best)}</p>
        )}
      </div>
    </div>
  )
}
