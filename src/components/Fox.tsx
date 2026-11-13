import { memo } from 'react'
import type { Skin } from '../skins'
import styles from './Fox.module.scss'

const skinClass: Record<Skin, string> = {
  classic: '',
  ember: styles.skinEmber ?? '',
  frost: styles.skinFrost ?? '',
  gold: styles.skinGold ?? '',
}

interface FoxProps {
  ducking: boolean
  running: boolean
  hurt: boolean
  flipping: boolean
  frenzy: boolean
  skin: Skin
}

export const Fox = memo(({
  ducking,
  running,
  hurt,
  flipping,
  frenzy,
  skin,
}: FoxProps) => {
  const classes = [
    styles.fox,
    skinClass[skin],
    ducking ? styles.ducking : '',
    running ? styles.running : '',
    hurt ? styles.hurt : '',
    flipping ? styles.flipping : '',
    frenzy ? styles.frenzy : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      <svg
        className={styles.svg}
        viewBox="0 0 140 110"
        preserveAspectRatio="none"
        role="img"
        aria-label="A little fox running"
      >
        <g className={styles.tail}>
          <path
            className={styles.tailFill}
            d="M44 66 C12 62 6 32 26 28 C44 25 54 44 50 62 Z"
          />
          <path
            className={styles.tailTip}
            d="M26 28 C36 27 43 34 43 43 C35 39 28 39 22 41 C18 36 20 30 26 28 Z"
          />
        </g>

        <ellipse className={styles.body} cx="76" cy="70" rx="40" ry="26" />
        <ellipse className={styles.belly} cx="78" cy="78" rx="26" ry="15" />

        <g className={styles.legs}>
          <rect className={styles.leg} x="52" y="84" width="12" height="22" rx="6" />
          <rect className={styles.leg} x="88" y="84" width="12" height="22" rx="6" />
        </g>

        <g className={styles.head}>
          <path className={styles.ear} d="M92 40 L96 12 L112 32 Z" />
          <path className={styles.earInner} d="M99 35 L101 20 L108 31 Z" />
          <path className={styles.ear} d="M118 34 L132 16 L134 42 Z" />
          <path className={styles.earInner} d="M122 37 L129 24 L131 38 Z" />
          <circle className={styles.face} cx="112" cy="56" r="26" />
          <path
            className={styles.muzzle}
            d="M116 62 Q136 60 138 72 Q130 84 112 78 Q106 70 116 62 Z"
          />
          <circle className={styles.nose} cx="136" cy="72" r="5" />
          <circle className={styles.eye} cx="120" cy="50" r="4" />
          <circle className={styles.eyeShine} cx="121.5" cy="48.5" r="1.4" />
        </g>
      </svg>
    </div>
  )
})

Fox.displayName = 'Fox'
