import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { GameScene, type SceneBanner } from './components/GameScene'
import { GameOverScreen } from './components/GameOverScreen'
import { Hud } from './components/Hud'
import { FoxLogo, MoonIcon, SoundOffIcon, SoundOnIcon, SunIcon } from './components/Icons'
import { StartScreen } from './components/StartScreen'
import {
  FRENZY_COMBO,
  MAX_SPEED,
  START_SPEED,
  comboMultiplier,
  createWorld,
  isFrenzy,
  startRun,
  step,
  FOX_WIDTH,
  FOX_X,
  type GameEvent,
  type World,
} from './game'
import {
  EFFECT_DURATION,
  createBerryEffect,
  createDoubleJumpEffect,
  createHitEffect,
  createLandingEffect,
  createLifeLostEffect,
  createNearMissEffect,
  createPickupEffect,
  createShieldBreakEffect,
  type VisualEffect,
} from './effects'
import {
  loadAchievements,
  loadBest,
  loadSound,
  loadTheme,
  loadTotalBerries,
  saveAchievements,
  saveBest,
  saveSound,
  saveTheme,
  saveTotalBerries,
  type Theme,
} from './storage'
import {
  playBerry,
  playCombo,
  playDoubleJump,
  playGameOver,
  playHit,
  playJump,
  playLand,
  playNearMiss,
  playPickup,
  playShield,
  playStart,
  setMusicIntensity,
  startMusic,
  stopMusic,
} from './sound'
import { evaluateAchievements } from './achievements'
import { skinFor, skinName } from './skins'
import shared from './styles/shared.module.scss'
import styles from './App.module.scss'

const COMBO_MILESTONES = [5, 10, 15, 20, 25]

export const App = () => {
  const [theme, setTheme] = useState<Theme>(() => loadTheme())
  const [soundOn, setSoundOn] = useState<boolean>(() => loadSound())
  const [world, setWorld] = useState<World>(() => createWorld(loadBest()))
  const [newBest, setNewBest] = useState(false)
  const [effects, setEffects] = useState<VisualEffect[]>([])
  const [shaking, setShaking] = useState(false)
  const [flipping, setFlipping] = useState(false)
  const [damaged, setDamaged] = useState(false)
  const [totalBerries, setTotalBerries] = useState<number>(() => loadTotalBerries())
  const [achievements, setAchievements] = useState<string[]>(() => loadAchievements())
  const [banner, setBanner] = useState<SceneBanner | null>(null)
  const [paused, setPaused] = useState(false)

  const worldRef = useRef(world)
  const soundRef = useRef(soundOn)
  const runStartBest = useRef(world.best)
  const jumpQueued = useRef(false)
  const jumpHeld = useRef(false)
  const duckHeld = useRef(false)
  const effectId = useRef(1)
  const timeouts = useRef<number[]>([])
  const totalBerriesRef = useRef(totalBerries)
  const achievementsRef = useRef(achievements)
  const lastCombo = useRef(0)
  const freezeUntil = useRef(0)
  const bannerId = useRef(1)
  const skin = skinFor(totalBerries)

  const showBanner = useCallback((text: string, tone: SceneBanner['tone']) => {
    setBanner({ id: bannerId.current++, text, tone })
  }, [])

  const togglePause = useCallback(() => {
    jumpQueued.current = false
    jumpHeld.current = false
    duckHeld.current = false
    setPaused((value) => !value)
  }, [])

  useEffect(() => {
    if (world.phase !== 'playing' || paused) {
      return
    }
    const timer = window.setTimeout(() => setBanner(null), 1250)
    return () => window.clearTimeout(timer)
  }, [banner])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    soundRef.current = soundOn
    saveSound(soundOn)
  }, [soundOn])

  useEffect(() => {
    if (soundOn && world.phase === 'playing' && !paused) {
      startMusic()
    } else {
      stopMusic()
    }
  }, [soundOn, world.phase, paused])

  useEffect(() => {
    if (world.phase !== 'playing') {
      return
    }
    const speedRatio = (world.speed - START_SPEED) / (MAX_SPEED - START_SPEED)
    setMusicIntensity(
      Math.min(
        1,
        Math.max(0, speedRatio) * 0.75 + (isFrenzy(world.combo) ? 0.25 : 0),
      ),
    )
  }, [world.phase, world.speed, world.combo])

  useEffect(() => () => stopMusic(), [])

  const commit = useCallback((next: World) => {
    worldRef.current = next
    setWorld(next)
  }, [])

  const schedule = useCallback((task: () => void, delay: number) => {
    const timer = window.setTimeout(task, delay)
    timeouts.current.push(timer)
  }, [])

  const spawnEffect = useCallback(
    (effect: VisualEffect) => {
      setEffects((list) => [...list, effect])
      schedule(() => {
        setEffects((list) => list.filter((item) => item.id !== effect.id))
      }, EFFECT_DURATION)
    },
    [schedule],
  )

  const checkAchievements = useCallback(
    (next: World) => {
      const unlocked = new Set(achievementsRef.current)
      const earned = evaluateAchievements(next, unlocked)
      if (earned.length === 0) {
        return
      }
      const ids = [...achievementsRef.current, ...earned.map((def) => def.id)]
      achievementsRef.current = ids
      setAchievements(ids)
      saveAchievements(ids)
      showBanner(`Achievement: ${earned[0]?.name ?? 'Unlocked'}`, 'unlock')
      if (soundRef.current) {
        playCombo(4)
      }
    },
    [showBanner],
  )

  useEffect(
    () => () => {
      timeouts.current.forEach((timer) => window.clearTimeout(timer))
    },
    [],
  )

  const handleEvents = useCallback(
    (events: GameEvent[]) => {
      for (const event of events) {
        if (event.type === 'jump') {
          if (event.double) {
            if (soundRef.current) {
              playDoubleJump()
            }
            const fox = worldRef.current.fox
            spawnEffect(
              createDoubleJumpEffect(
                effectId.current++,
                FOX_X + FOX_WIDTH / 2,
                fox.y + 40,
              ),
            )
            setFlipping(true)
            schedule(() => setFlipping(false), 560)
          } else if (soundRef.current) {
            playJump()
          }
        } else if (event.type === 'berry') {
          if (soundRef.current) {
            playBerry(event.combo ?? 1)
          }
          spawnEffect(
            createBerryEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH / 2,
              event.y ?? 40,
              event.value ?? 0,
              event.multiplier ?? 1,
            ),
          )
          const combo = event.combo ?? 1
          const previousCombo = lastCombo.current
          lastCombo.current = combo
          if (combo >= FRENZY_COMBO && previousCombo < FRENZY_COMBO) {
            showBanner('Frenzy!', 'frenzy')
            if (soundRef.current) {
              playCombo(5)
            }
          } else {
            const crossed = COMBO_MILESTONES.filter(
              (milestone) => combo >= milestone && previousCombo < milestone,
            ).pop()
            if (crossed) {
              showBanner(`${crossed} combo!`, 'combo')
              if (soundRef.current) {
                playCombo(comboMultiplier(crossed))
              }
            }
          }
        } else if (event.type === 'hit') {
          if (soundRef.current) {
            playHit()
          }
          const fox = worldRef.current.fox
          spawnEffect(
            createHitEffect(effectId.current++, FOX_X + FOX_WIDTH / 2, fox.y + 36),
          )
          spawnEffect(
            createLifeLostEffect(
              effectId.current++,
              FOX_X + FOX_WIDTH / 2,
              fox.y + 88,
            ),
          )
          lastCombo.current = 0
          freezeUntil.current = performance.now() + 70
          navigator.vibrate?.(60)
          setShaking(true)
          setDamaged(true)
          schedule(() => setShaking(false), 340)
          schedule(() => setDamaged(false), 420)
        } else if (event.type === 'land') {
          if (soundRef.current) {
            playLand()
          }
          spawnEffect(
            createLandingEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH / 2,
              event.y ?? 0,
            ),
          )
        } else if (event.type === 'pickup') {
          const kind = event.pickup ?? 'shield'
          if (soundRef.current) {
            playPickup(kind)
          }
          spawnEffect(
            createPickupEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH / 2,
              event.y ?? 60,
              event.label ?? 'Power-up!',
            ),
          )
          navigator.vibrate?.(14)
        } else if (event.type === 'shield') {
          if (soundRef.current) {
            playShield()
          }
          const fox = worldRef.current.fox
          spawnEffect(
            createShieldBreakEffect(
              effectId.current++,
              FOX_X + FOX_WIDTH / 2,
              fox.y + 40,
            ),
          )
          freezeUntil.current = performance.now() + 55
          navigator.vibrate?.(28)
          setShaking(true)
          schedule(() => setShaking(false), 300)
        } else if (event.type === 'nearmiss') {
          if (soundRef.current) {
            playNearMiss()
          }
          spawnEffect(
            createNearMissEffect(
              effectId.current++,
              event.x ?? FOX_X + FOX_WIDTH,
              event.y ?? 60,
              event.value ?? 0,
            ),
          )
        } else if (event.type === 'gameover') {
          const score = Math.floor(worldRef.current.score)
          const isNew = score > runStartBest.current
          setNewBest(isNew)
          if (isNew) {
            saveBest(score)
          }
          if (soundRef.current) {
            playGameOver()
          }
          navigator.vibrate?.([40, 60, 80])
        }
      }
    },
    [schedule, showBanner, spawnEffect],
  )

  const handleStart = useCallback(() => {
    runStartBest.current = worldRef.current.best
    setNewBest(false)
    jumpQueued.current = false
    jumpHeld.current = false
    duckHeld.current = false
    lastCombo.current = 0
    freezeUntil.current = 0
    setBanner(null)
    setPaused(false)
    setEffects([])
    setShaking(false)
    setFlipping(false)
    setDamaged(false)
    if (soundRef.current) {
      playStart()
    }
    commit(startRun(worldRef.current))
  }, [commit])

  useEffect(() => {
    if (world.phase !== 'playing') {
      return
    }

    let frame = 0
    let last = performance.now()

    const tick = (now: number) => {
      if (now < freezeUntil.current) {
        last = now
        frame = requestAnimationFrame(tick)
        return
      }

      const dt = (now - last) / 1000
      last = now

      const input = {
        jump: jumpQueued.current,
        duck: duckHeld.current,
        jumpHeld: jumpHeld.current,
      }
      jumpQueued.current = false

      const before = worldRef.current
      const next = step(before, dt, input)
      if (next !== before) {
        const gained = next.berriesCollected - before.berriesCollected
        if (gained > 0) {
          const previousSkin = skinFor(totalBerriesRef.current)
          totalBerriesRef.current += gained
          const unlockedSkin = skinFor(totalBerriesRef.current)
          setTotalBerries(totalBerriesRef.current)
          saveTotalBerries(totalBerriesRef.current)
          if (unlockedSkin !== previousSkin) {
            showBanner(`${skinName(unlockedSkin)} fox unlocked!`, 'unlock')
            if (soundRef.current) {
              playCombo(4)
            }
          }
        }
        worldRef.current = next
        setWorld(next)
        handleEvents(next.events)
        checkAchievements(next)
      }

      if (next.phase === 'playing') {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [world.phase, paused, handleEvents, checkAchievements, showBanner])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key
      const isJump =
        key === ' ' || key === 'ArrowUp' || key === 'w' || key === 'W'
      const isDuck = key === 'ArrowDown' || key === 's' || key === 'S'

      if (isJump) {
        event.preventDefault()
        if (worldRef.current.phase === 'playing' && paused) {
          return
        }
        jumpHeld.current = true
        if (event.repeat) {
          return
        }
        if (worldRef.current.phase === 'playing') {
          jumpQueued.current = true
        } else {
          handleStart()
        }
      } else if (isDuck) {
        event.preventDefault()
        duckHeld.current = true
      } else if (
        (key === 'p' || key === 'P' || key === 'Escape') &&
        worldRef.current.phase === 'playing'
      ) {
        event.preventDefault()
        togglePause()
      } else if (key === 'Enter' && worldRef.current.phase !== 'playing') {
        event.preventDefault()
        handleStart()
      }
    }

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key
      if (key === 'ArrowDown' || key === 's' || key === 'S') {
        duckHeld.current = false
      }
      if (
        key === ' ' ||
        key === 'ArrowUp' ||
        key === 'w' ||
        key === 'W'
      ) {
        jumpHeld.current = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [handleStart, togglePause, paused])

  useEffect(() => {
    const clearHeld = () => {
      duckHeld.current = false
      jumpHeld.current = false
    }
    window.addEventListener('pointerup', clearHeld)
    window.addEventListener('pointercancel', clearHeld)
    return () => {
      window.removeEventListener('pointerup', clearHeld)
      window.removeEventListener('pointercancel', clearHeld)
    }
  }, [])

  const handleScenePointer = () => {
    if (worldRef.current.phase === 'playing' && !paused) {
      jumpQueued.current = true
      jumpHeld.current = true
    }
  }

  const handleJump = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (worldRef.current.phase === 'playing' && !paused) {
      jumpQueued.current = true
      jumpHeld.current = true
    }
  }

  const handleDuckStart = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    if (paused) {
      return
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    duckHeld.current = true
  }

  const handleDuckEnd = () => {
    duckHeld.current = false
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <FoxLogo className={styles.logoIcon} />
          </span>
          <div className={styles.brandText}>
            <h1 className={styles.title}>Fox Dash</h1>
            <p className={styles.subtitle}>Jump, duck, and snack your way through the forest</p>
          </div>
        </div>

        <div className={styles.tools}>
          <button
            type="button"
            className={shared.iconButton}
            onClick={() => setSoundOn((value) => !value)}
            aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
            title={soundOn ? 'Mute sound' : 'Unmute sound'}
          >
            {soundOn ? (
              <SoundOnIcon className={styles.toolIcon} />
            ) : (
              <SoundOffIcon className={styles.toolIcon} />
            )}
          </button>
          <button
            type="button"
            className={shared.iconButton}
            onClick={() =>
              setTheme((value) => (value === 'light' ? 'dark' : 'light'))
            }
            aria-label={
              theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            }
            title={
              theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
            }
          >
            {theme === 'light' ? (
              <MoonIcon className={styles.toolIcon} />
            ) : (
              <SunIcon className={styles.toolIcon} />
            )}
          </button>
        </div>
      </header>

      <div className={styles.stageWrap}>
        <div
          className={styles.sceneTap}
          onPointerDown={handleScenePointer}
          role="presentation"
        >
          <GameScene
            world={world}
            effects={effects}
            shaking={shaking}
            flipping={flipping}
            damaged={damaged}
            skin={skin}
            banner={banner}
          />
        </div>

        <Hud world={world} />

        {world.phase === 'ready' && (
          <StartScreen
            best={world.best}
            skin={skin}
            totalBerries={totalBerries}
            onPlay={handleStart}
          />
        )}

        {world.phase === 'over' && (
          <GameOverScreen
            world={world}
            isNewBest={newBest}
            achievements={achievements}
            onRestart={handleStart}
          />
        )}

        {paused && world.phase === 'playing' && (
          <div className={styles.pauseOverlay}>
            <div className={styles.pausePanel}>
              <p className={styles.pauseTitle}>Paused</p>
              <button
                type="button"
                className={shared.playButton}
                onClick={togglePause}
              >
                Resume
              </button>
              <p className={styles.pauseHint}>Press P or Esc to resume</p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={`${styles.controlButton} ${styles.duckButton}`}
          onPointerDown={handleDuckStart}
          onPointerUp={handleDuckEnd}
          onPointerLeave={handleDuckEnd}
          onPointerCancel={handleDuckEnd}
        >
          Duck
        </button>
        <button
          type="button"
          className={`${styles.controlButton} ${styles.jumpButton}`}
          onPointerDown={handleJump}
        >
          Jump
        </button>
      </div>

      <p className={styles.hint}>
        Space or tap the scene to jump — press again in mid-air for a spin jump.
        Hold Down or the Duck button to slide under branches. Press P or Esc to
        pause.
      </p>
    </main>
  )
}
