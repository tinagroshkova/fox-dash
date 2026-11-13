import { useEffect } from 'react'
import { SKINS, type Skin, type SkinDef } from '../skins'
import { BerryIcon, FoxLogo } from './Icons'
import shared from '../styles/shared.module.scss'
import styles from './SkinShop.module.scss'

interface SkinShopProps {
  totalBerries: number
  ownedSkins: Skin[]
  selectedSkin: Skin
  onSelect: (skin: Skin) => void
  onBuy: (skin: SkinDef) => void
  onClose: () => void
}

const SKIN_CLASS: Record<Skin, string> = {
  classic: styles.classic ?? '',
  ember: styles.ember ?? '',
  frost: styles.frost ?? '',
  gold: styles.gold ?? '',
}

export const SkinShop = ({
  totalBerries,
  ownedSkins,
  selectedSkin,
  onSelect,
  onBuy,
  onClose,
}: SkinShopProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className={styles.overlay}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skin-shop-title"
      >
        <div className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.kicker}>Wardrobe</p>
            <h2 id="skin-shop-title" className={styles.title}>
              Fox skins
            </h2>
          </div>
          <div className={styles.bank} title="Berry bank">
            <BerryIcon className={styles.bankIcon} />
            <span>{totalBerries}</span>
          </div>
        </div>

        <div className={styles.grid}>
          {SKINS.map((def) => {
            const owned = ownedSkins.includes(def.id)
            const selected = selectedSkin === def.id
            const affordable = totalBerries >= def.cost
            const label = owned
              ? selected
                ? 'Equipped'
                : 'Equip'
              : affordable
                ? 'Unlock'
                : 'Locked'

            return (
              <div
                key={def.id}
                className={`${styles.card} ${SKIN_CLASS[def.id]} ${
                  selected ? styles.selected : ''
                }`}
              >
                <div className={styles.swatch} aria-hidden="true">
                  <FoxLogo className={styles.foxIcon} />
                </div>
                <p className={styles.name}>{def.name}</p>
                <p className={styles.cost}>
                  {owned
                    ? selected
                      ? 'Equipped'
                      : 'Owned'
                    : `${def.cost} berries`}
                </p>
                <button
                  type="button"
                  className={`${shared.secondaryButton} ${styles.action}`}
                  disabled={selected || (!owned && !affordable)}
                  onClick={() => (owned ? onSelect(def.id) : onBuy(def))}
                >
                  {label}
                </button>
              </div>
            )
          })}
        </div>

        <button type="button" className={shared.playButton} onClick={onClose}>
          Done
        </button>
        <p className={styles.hint}>
          Earn berries in runs to unlock new fox colors.
        </p>
      </div>
    </div>
  )
}
