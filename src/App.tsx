import { useCallback, useEffect, useRef, useState } from 'react'
import { GameScene, type SceneBanner } from './components/GameScene'
import { GameOverScreen } from './components/GameOverScreen'
import { Hud } from './components/Hud'
import {
  FoxLogo,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  SoundOffIcon,
  SoundOnIcon,
  SunIcon,
} from './components/Icons'
import { StartScreen } from './components/StartScreen'
import { createWorld, startRun, type World } from './game'
import { useAchievements } from './hooks/useAchievements'
import { useAdaptiveMusic } from './hooks/useAdaptiveMusic'
import { useGameEvents } from './hooks/useGameEvents'
import { useGameInput } from './hooks/useGameInput'
import { useGameLoop } from './hooks/useGameLoop'
import { useVisualEffects } from './hooks/useVisualEffects'
import { skinFor } from './skins'
import { playStart } from './sound'
import {
  loadAchievements,
  loadBest,
  loadSound,
  loadTheme,
  loadTotalBerries,
  saveSound,
  saveTheme,
  type Theme,
} from './storage'
import shared from './styles/shared.module.scss'
import styles from './App.module.scss'

export const App = () => {
  const [theme, setTheme] = useState<Theme>(() => loadTheme())
  const [soundOn, setSoundOn] = useState<boolean>(() => loadSound())
  const [world, setWorld] = useState<World>(() => createWorld(loadBest()))
  const [newBest, setNewBest] = useState(false)
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
  const totalBerriesRef = useRef(totalBerries)
  const achievementsRef = useRef(achievements)
  const lastCombo = useRef(0)
  const freezeUntil = useRef(0)
  const bannerId = useRef(1)
  const skin = skinFor(totalBerries)

  const { effects, effectId, schedule, spawnEffect, clearEffects } =
    useVisualEffects()

  const showBanner = useCallback((text: string, tone: SceneBanner['tone']) => {
    setBanner({ id: bannerId.current++, text, tone })
  }, [])

  const togglePause = useCallback(() => {
    jumpQueued.current = false
    jumpHeld.current = false
    duckHeld.current = false
    setPaused((value) => !value)
  }, [])

  const autoPause = useCallback(() => setPaused(true), [])

  const commit = useCallback((next: World) => {
    worldRef.current = next
    setWorld(next)
  }, [])

  const checkAchievements = useAchievements({
    achievementsRef,
    setAchievements,
    showBanner,
    soundRef,
  })

  const handleEvents = useGameEvents({
    worldRef,
    soundRef,
    runStartBest,
    effectId,
    lastCombo,
    freezeUntil,
    spawnEffect,
    schedule,
    showBanner,
    setFlipping,
    setShaking,
    setDamaged,
    setNewBest,
  })

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
    clearEffects()
    setShaking(false)
    setFlipping(false)
    setDamaged(false)
    if (soundRef.current) {
      playStart()
    }
    commit(startRun(worldRef.current))
  }, [clearEffects, commit])

  const { handleScenePointer, handleJump, handleDuckStart, handleDuckEnd } =
    useGameInput({
      worldRef,
      paused,
      jumpQueued,
      jumpHeld,
      duckHeld,
      onStart: handleStart,
      onTogglePause: togglePause,
      onPause: autoPause,
    })

  useGameLoop({
    phase: world.phase,
    paused,
    worldRef,
    commit,
    jumpQueued,
    jumpHeld,
    duckHeld,
    freezeUntil,
    soundRef,
    totalBerriesRef,
    setTotalBerries,
    handleEvents,
    checkAchievements,
    showBanner,
  })

  useAdaptiveMusic({
    soundOn,
    phase: world.phase,
    speed: world.speed,
    combo: world.combo,
    paused,
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    soundRef.current = soundOn
    saveSound(soundOn)
  }, [soundOn])

  useEffect(() => {
    if (!banner) {
      return
    }
    const timer = window.setTimeout(() => setBanner(null), 1250)
    return () => window.clearTimeout(timer)
  }, [banner])

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>
            <FoxLogo className={styles.logoIcon} />
          </span>
          <div className={styles.brandText}>
            <h1 className={styles.title}>Fox Dash</h1>
            <p className={styles.subtitle}>
              Jump, duck, and snack your way through the forest
            </p>
          </div>
        </div>

        <div className={styles.tools}>
          <button
            type="button"
            className={shared.iconButton}
            onClick={togglePause}
            disabled={world.phase !== 'playing'}
            aria-label={paused ? 'Resume game' : 'Pause game'}
            title={paused ? 'Resume game' : 'Pause game'}
          >
            {paused ? (
              <PlayIcon className={styles.toolIcon} />
            ) : (
              <PauseIcon className={styles.toolIcon} />
            )}
          </button>
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
            paused={paused}
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
