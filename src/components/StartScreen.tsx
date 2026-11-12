import { formattedScore } from '../game'
import { nextSkin, skinName, type Skin } from '../skins'
import shared from '../styles/shared.module.scss'
import styles from './StartScreen.module.scss'

interface StartScreenProps {
  best: number
  skin: Skin
  totalBerries: number
  onPlay: () => void
}

export const StartScreen = ({
  best,
  skin,
  totalBerries,
  onPlay,
}: StartScreenProps) => {
  const upcoming = nextSkin(totalBerries)

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

        <p className={styles.skin}>
          Fox: <strong>{skinName(skin)}</strong>
          {upcoming
            ? ` · ${upcoming.cost - totalBerries} more berries to unlock ${upcoming.name}`
            : ' · all skins unlocked'}
        </p>

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
