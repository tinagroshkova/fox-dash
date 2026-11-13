import { memo, type CSSProperties } from 'react'
import {
  BERRY_RADIUS,
  FOX_WIDTH,
  FOX_X,
  GROUND_HEIGHT,
  HAZARD_RADIUS,
  INVINCIBLE_TIME,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  MAX_SPEED,
  PICKUP_RADIUS,
  START_SPEED,
  biomeFor,
  foxHeight,
  isFrenzy,
  type Biome,
  type World,
} from '../game'
import type { Particle, VisualEffect } from '../effects'
import type { Skin } from '../skins'
import {
  AcornIcon,
  BeeIcon,
  ClockIcon,
  HeartIcon,
  MagnetIcon,
  ShieldIcon,
} from './Icons'
import { Fox } from './Fox'
import styles from './GameScene.module.scss'

const pctX = (value: number): string => `${(value / LOGICAL_WIDTH) * 100}%`
const pctY = (value: number): string => `${(value / LOGICAL_HEIGHT) * 100}%`

const toneClass: Record<Particle['tone'], string> = {
  berry: styles.toneBerry ?? '',
  gold: styles.toneGold ?? '',
  leaf: styles.toneLeaf ?? '',
  spark: styles.toneSpark ?? '',
  dust: styles.toneDust ?? '',
}

const BIOME_LABEL: Record<Biome, string> = {
  forest: 'Sunny Forest',
  night: 'Moonlit Woods',
  snow: 'Frosty Peaks',
}

const LEAVES = Array.from({ length: 9 }, (_, index) => ({
  left: (index * 41 + 7) % 100,
  delay: ((index * 7) % 10) / 10,
  duration: 5 + ((index * 3) % 6),
  size: 8 + ((index * 5) % 10),
}))

const FIREFLIES = Array.from({ length: 14 }, (_, index) => ({
  left: (index * 29 + 11) % 100,
  top: 18 + ((index * 37) % 62),
  delay: ((index * 11) % 14) / 10,
  duration: 2 + ((index * 3) % 4),
}))

const SNOW = Array.from({ length: 18 }, (_, index) => ({
  left: (index * 23 + 5) % 100,
  delay: ((index * 13) % 20) / 10,
  duration: 4 + ((index * 7) % 7),
  size: 4 + ((index * 3) % 7),
}))

const effectClassFor = (kind: VisualEffect['kind']): string => {
  switch (kind) {
    case 'hit':
      return styles.effectHit ?? ''
    case 'shield':
      return styles.effectShield ?? ''
    case 'double':
      return styles.effectDouble ?? ''
    case 'life':
      return styles.effectLife ?? ''
    case 'pickup':
      return styles.effectPickup ?? ''
    case 'near':
      return styles.effectNear ?? ''
    case 'land':
      return styles.effectLand ?? ''
    default:
      return ''
  }
}

const SceneBackground = memo(() => (
  <>
    <div className={styles.sky} />
    <div className={styles.sun} />

    <div className={styles.cloudLayer} aria-hidden="true">
      <div className={`${styles.cloud} ${styles.cloudA}`} />
      <div className={`${styles.cloud} ${styles.cloudB}`} />
      <div className={`${styles.cloud} ${styles.cloudC}`} />
    </div>

    <div className={styles.hillsFar} />
    <div className={styles.hillsNear} />
    <div className={styles.ground} />
  </>
))

SceneBackground.displayName = 'SceneBackground'

interface WeatherLayerProps {
  biome: Biome
}

const WeatherLayer = memo(({ biome }: WeatherLayerProps) => (
  <div className={styles.weather} aria-hidden="true">
    {biome === 'forest' &&
      LEAVES.map((leaf, index) => (
        <span
          key={index}
          className={styles.leaf}
          style={
            {
              left: `${leaf.left}%`,
              width: `${leaf.size}px`,
              height: `${leaf.size * 0.7}px`,
              animationDelay: `${leaf.delay}s`,
              animationDuration: `${leaf.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    {biome === 'night' &&
      FIREFLIES.map((fly, index) => (
        <span
          key={index}
          className={styles.firefly}
          style={
            {
              left: `${fly.left}%`,
              top: `${fly.top}%`,
              animationDelay: `${fly.delay}s`,
              animationDuration: `${fly.duration}s`,
            } as CSSProperties
          }
        />
      ))}
    {biome === 'snow' &&
      SNOW.map((flake, index) => (
        <span
          key={index}
          className={styles.snowflake}
          style={
            {
              left: `${flake.left}%`,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              animationDelay: `${flake.delay}s`,
              animationDuration: `${flake.duration}s`,
            } as CSSProperties
          }
        />
      ))}
  </div>
))

WeatherLayer.displayName = 'WeatherLayer'

interface EffectLayerProps {
  effects: VisualEffect[]
}

const EffectLayer = memo(({ effects }: EffectLayerProps) => (
  <div className={styles.effectLayer} aria-hidden="true">
    {effects.map((effect) => (
      <div
        key={effect.id}
        className={`${styles.effectAnchor} ${effectClassFor(effect.kind)}`}
        style={{
          left: pctX(effect.x),
          bottom: pctY(GROUND_HEIGHT + effect.y),
        }}
      >
        {effect.kind === 'score' && (
          <div className={styles.scorePopup}>
            <span className={styles.scoreValue}>+{effect.value}</span>
            {effect.multiplier > 1 && (
              <span className={styles.scoreMultiplier}>
                x{effect.multiplier}
              </span>
            )}
          </div>
        )}
        {effect.kind === 'near' && (
          <div className={styles.nearPopup}>
            <span>Close!</span>
            <span className={styles.nearValue}>+{effect.value}</span>
          </div>
        )}
        {effect.kind === 'pickup' && (
          <div className={styles.pickupPopup}>{effect.label}</div>
        )}
        {effect.kind === 'life' && (
          <div className={styles.lifeLost}>
            <HeartIcon className={styles.lifeHeart} />
            <span className={styles.lifeValue}>-1</span>
          </div>
        )}
        {effect.particles.map((particle, index) => (
          <span
            key={index}
            className={`${styles.particle} ${toneClass[particle.tone]}`}
            style={
              {
                '--dx': `${particle.dx}px`,
                '--dy': `${particle.dy}px`,
                '--size': `${particle.size}px`,
                '--delay': `${particle.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    ))}
  </div>
))

EffectLayer.displayName = 'EffectLayer'

export interface SceneBanner {
  id: number
  text: string
  tone: 'combo' | 'frenzy' | 'unlock'
}

interface GameSceneProps {
  world: World
  effects: VisualEffect[]
  shaking: boolean
  flipping: boolean
  damaged: boolean
  skin: Skin
  banner: SceneBanner | null
  paused: boolean
}

export const GameScene = ({
  world,
  effects,
  shaking,
  flipping,
  damaged,
  skin,
  banner,
  paused,
}: GameSceneProps) => {
  const running = world.phase === 'playing' && world.fox.onGround
  const hurt =
    world.phase === 'playing' &&
    world.invincible > INVINCIBLE_TIME - 0.25
  const frenzy = isFrenzy(world.combo)
  const biome = biomeFor(world.distance)
  const speedRatio = Math.min(
    1,
    Math.max(0, (world.speed - START_SPEED) / (MAX_SPEED - START_SPEED)),
  )
  const speedOpacity = Math.min(0.45, Math.max(0, speedRatio - 0.15) * 0.7)
  const sceneStyle = {
    '--scroll': `${world.distance}px`,
  } as CSSProperties
  const sceneClass = [
    styles.scene,
    biome === 'night' ? styles.biomeNight : '',
    biome === 'snow' ? styles.biomeSnow : '',
    shaking ? styles.shaking : '',
    banner?.tone === 'frenzy' ? styles.pulse : '',
    paused ? styles.paused : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={sceneClass} style={sceneStyle}>
      <SceneBackground />
      <WeatherLayer biome={biome} />

      <div
        className={styles.speedLines}
        style={{ opacity: speedOpacity }}
        aria-hidden="true"
      />

      {damaged && <div className={styles.damageFlash} aria-hidden="true" />}
      {world.slowTimer > 0 && (
        <div className={styles.slowOverlay} aria-hidden="true" />
      )}

      {world.hazards.map((hazard) => (
        <div
          key={hazard.id}
          className={`${styles.hazard} ${
            hazard.kind === 'acorn' ? styles.acorn : styles.bee
          }`}
          style={{
            left: pctX(hazard.x - HAZARD_RADIUS),
            bottom: pctY(GROUND_HEIGHT + hazard.y - HAZARD_RADIUS),
            width: pctX(HAZARD_RADIUS * 2),
            height: pctY(HAZARD_RADIUS * 2),
          }}
        >
          {hazard.kind === 'acorn' ? (
            <AcornIcon className={styles.hazardIcon} />
          ) : (
            <BeeIcon className={styles.hazardIcon} />
          )}
        </div>
      ))}

      {world.pickups.map((pickup) => (
        <div
          key={pickup.id}
          className={`${styles.pickup} ${
            pickup.kind === 'shield'
              ? styles.pickupShield
              : pickup.kind === 'magnet'
                ? styles.pickupMagnet
                : styles.pickupSlow
          }`}
          style={{
            left: pctX(pickup.x - PICKUP_RADIUS),
            bottom: pctY(GROUND_HEIGHT + pickup.y - PICKUP_RADIUS),
            width: pctX(PICKUP_RADIUS * 2),
            height: pctY(PICKUP_RADIUS * 2),
          }}
        >
          {pickup.kind === 'shield' ? (
            <ShieldIcon className={styles.pickupIcon} />
          ) : pickup.kind === 'magnet' ? (
            <MagnetIcon className={styles.pickupIcon} />
          ) : (
            <ClockIcon className={styles.pickupIcon} />
          )}
        </div>
      ))}

      {world.berries.map((berry) => (
        <div
          key={berry.id}
          className={styles.berry}
          style={{
            left: pctX(berry.x - BERRY_RADIUS),
            bottom: pctY(GROUND_HEIGHT + berry.y - BERRY_RADIUS),
            width: pctX(BERRY_RADIUS * 2),
            height: pctY(BERRY_RADIUS * 2),
          }}
        >
          <span className={styles.berryLeaf} />
          <span className={styles.berryShine} />
        </div>
      ))}

      {world.obstacles.map((obstacle) =>
        obstacle.kind === 'rock' ? (
          <div
            key={obstacle.id}
            className={`${styles.obstacle} ${styles.rock}`}
            style={{
              left: pctX(obstacle.x),
              bottom: pctY(GROUND_HEIGHT + obstacle.bottom),
              width: pctX(obstacle.width),
              height: pctY(obstacle.height),
            }}
          >
            <span className={styles.rockHighlight} />
          </div>
        ) : (
          <div
            key={obstacle.id}
            className={`${styles.obstacle} ${styles.branch}`}
            style={{
              left: pctX(obstacle.x),
              bottom: pctY(GROUND_HEIGHT + obstacle.bottom),
              width: pctX(obstacle.width),
              height: pctY(obstacle.height),
            }}
          >
            <span className={styles.vine} />
            <span className={styles.leafTop} />
            <span className={styles.leafBottom} />
          </div>
        ),
      )}

      {frenzy && (
        <div
          className={styles.frenzyAura}
          style={{
            left: pctX(FOX_X - 26),
            bottom: pctY(GROUND_HEIGHT + world.fox.y - 14),
            width: pctX(FOX_WIDTH + 52),
            height: pctY(foxHeight(world.fox) + 28),
          }}
          aria-hidden="true"
        />
      )}

      {world.magnetTimer > 0 && (
        <div
          className={styles.magnetAura}
          style={{
            left: pctX(FOX_X - 30),
            bottom: pctY(GROUND_HEIGHT + world.fox.y - 18),
            width: pctX(FOX_WIDTH + 60),
            height: pctY(foxHeight(world.fox) + 36),
          }}
          aria-hidden="true"
        />
      )}

      {world.shields > 0 && (
        <div
          className={styles.shieldBubble}
          style={{
            left: pctX(FOX_X - 12),
            bottom: pctY(GROUND_HEIGHT + world.fox.y - 10),
            width: pctX(FOX_WIDTH + 24),
            height: pctY(foxHeight(world.fox) + 20),
          }}
          aria-hidden="true"
        />
      )}

      <div
        className={styles.foxWrap}
        style={{
          left: pctX(FOX_X),
          bottom: pctY(GROUND_HEIGHT + world.fox.y),
          width: pctX(FOX_WIDTH),
          height: pctY(foxHeight(world.fox)),
        }}
      >
        <Fox
          ducking={world.fox.ducking}
          running={running}
          hurt={hurt}
          flipping={flipping}
          frenzy={frenzy}
          skin={skin}
        />
      </div>

      {world.phase === 'playing' && (
        <div key={biome} className={styles.biomeBanner}>
          {BIOME_LABEL[biome]}
        </div>
      )}

      {banner && (
        <div
          key={banner.id}
          className={`${styles.banner} ${
            banner.tone === 'frenzy'
              ? styles.bannerFrenzy
              : banner.tone === 'unlock'
                ? styles.bannerUnlock
                : ''
          }`}
        >
          {banner.text}
        </div>
      )}

      <EffectLayer effects={effects} />
    </div>
  )
}
