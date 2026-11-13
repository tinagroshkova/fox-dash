import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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
import { SkinShop } from './components/SkinShop'
import {
  MAX_REVIVES,
  REVIVE_COST,
  createWorld,
  reviveRun,
  startRun,
  type World,
} from './game'
import { useAchievements } from './hooks/useAchievements'
import { useAdaptiveMusic } from './hooks/useAdaptiveMusic'
import { useDailyChallenges } from './hooks/useDailyChallenges'
import { useGameEvents } from './hooks/useGameEvents'
import { useGameInput } from './hooks/useGameInput'
import { useGameLoop } from './hooks/useGameLoop'
import { useVisualEffects } from './hooks/useVisualEffects'
import { type Skin, type SkinDef } from './skins'
import { playCombo, playRevive, playStart } from './sound'
import {
  loadAchievements,
  loadBest,
  loadOwnedSkins,
  loadSelectedSkin,
  loadSound,
  loadTheme,
  loadTotalBerries,
  saveOwnedSkins,
  saveSelectedSkin,
  saveSound,
  saveTheme,
  saveTotalBerries,
  type Theme,
} from './storage'
import shared from './styles/shared.module.scss'
import styles from './App.module.scss'

interface AppHeaderProps {
  paused: boolean
  canPause: boolean
  soundOn: boolean
  theme: Theme
  onTogglePause: () => void
  onToggleSound: () => void
  onToggleTheme: () => void
}

const AppHeader = memo(
  ({
    paused,
    canPause,
    soundOn,
    theme,
    onTogglePause,
    onToggleSound,
    onToggleTheme,
  }: AppHeaderProps) => (
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
          onClick={onTogglePause}
          disabled={!canPause}
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
          onClick={onToggleSound}
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
          onClick={onToggleTheme}
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
  ),
)

AppHeader.displayName = 'AppHeader'

interface GameControlsProps {
  onDuckStart: (event: ReactPointerEvent<HTMLButtonElement>) => void
  onDuckEnd: () => void
  onJump: (event: ReactPointerEvent<HTMLButtonElement>) => void
}

const GameControls = memo(
  ({ onDuckStart, onDuckEnd, onJump }: GameControlsProps) => (
    <div className={styles.controls}>
      <button
        type="button"
        className={`${styles.controlButton} ${styles.duckButton}`}
        onPointerDown={onDuckStart}
        onPointerUp={onDuckEnd}
        onPointerLeave={onDuckEnd}
        onPointerCancel={onDuckEnd}
      >
        Duck
      </button>
      <button
        type="button"
        className={`${styles.controlButton} ${styles.jumpButton}`}
        onPointerDown={onJump}
      >
        Jump
      </button>
    </div>
  ),
)

GameControls.displayName = 'GameControls'

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
  const [ownedSkins, setOwnedSkins] = useState<Skin[]>(() => loadOwnedSkins())
  const [selectedSkin, setSelectedSkin] = useState<Skin>(() => {
    const selected = loadSelectedSkin()
    return loadOwnedSkins().includes(selected) ? selected : 'classic'
  })
  const [shopOpen, setShopOpen] = useState(false)

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
  const skin = selectedSkin

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

  const handleToggleSound = useCallback(() => {
    setSoundOn((value) => !value)
  }, [])

  const handleToggleTheme = useCallback(() => {
    setTheme((value) => (value === 'light' ? 'dark' : 'light'))
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

  const handleChallengeReward = useCallback((bonus: number) => {
    totalBerriesRef.current += bonus
    setTotalBerries(totalBerriesRef.current)
    saveTotalBerries(totalBerriesRef.current)
  }, [])

  const {
    challenges,
    completed: completedChallenges,
    checkChallenges,
  } = useDailyChallenges({
    showBanner,
    soundRef,
    onReward: handleChallengeReward,
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
    setShopOpen(false)
    clearEffects()
    setShaking(false)
    setFlipping(false)
    setDamaged(false)
    if (soundRef.current) {
      playStart()
    }
    commit(startRun(worldRef.current))
  }, [clearEffects, commit])

  const handleOpenShop = useCallback(() => setShopOpen(true), [])
  const handleCloseShop = useCallback(() => setShopOpen(false), [])

  const handleSelectSkin = useCallback(
    (next: Skin) => {
      if (!ownedSkins.includes(next)) {
        return
      }
      setSelectedSkin(next)
      saveSelectedSkin(next)
    },
    [ownedSkins],
  )

  const handleBuySkin = useCallback(
    (def: SkinDef) => {
      if (ownedSkins.includes(def.id)) {
        setSelectedSkin(def.id)
        saveSelectedSkin(def.id)
        return
      }
      if (totalBerriesRef.current < def.cost) {
        return
      }
      totalBerriesRef.current -= def.cost
      setTotalBerries(totalBerriesRef.current)
      saveTotalBerries(totalBerriesRef.current)
      const nextOwned = [...ownedSkins, def.id]
      setOwnedSkins(nextOwned)
      saveOwnedSkins(nextOwned)
      setSelectedSkin(def.id)
      saveSelectedSkin(def.id)
      if (soundRef.current) {
        playCombo(3)
      }
    },
    [ownedSkins],
  )

  const handleRevive = useCallback(() => {
    if (worldRef.current.berriesCollected < REVIVE_COST) {
      return
    }
    setNewBest(false)
    lastCombo.current = 0
    freezeUntil.current = 0
    jumpQueued.current = false
    jumpHeld.current = false
    duckHeld.current = false
    if (soundRef.current) {
      playRevive()
    }
    commit(reviveRun(worldRef.current))
  }, [commit])

  const { handleScenePointer, handleJump, handleDuckStart, handleDuckEnd } =
    useGameInput({
      worldRef,
      paused,
      disabled: shopOpen,
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
    totalBerriesRef,
    setTotalBerries,
    handleEvents,
    checkAchievements,
    checkChallenges,
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
      <AppHeader
        paused={paused}
        canPause={world.phase === 'playing'}
        soundOn={soundOn}
        theme={theme}
        onTogglePause={togglePause}
        onToggleSound={handleToggleSound}
        onToggleTheme={handleToggleTheme}
      />

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
            challenges={challenges}
            completedChallenges={completedChallenges}
            onOpenShop={handleOpenShop}
            onPlay={handleStart}
          />
        )}

        {shopOpen && (
          <SkinShop
            totalBerries={totalBerries}
            ownedSkins={ownedSkins}
            selectedSkin={selectedSkin}
            onSelect={handleSelectSkin}
            onBuy={handleBuySkin}
            onClose={handleCloseShop}
          />
        )}

        {world.phase === 'over' && (
          <GameOverScreen
            world={world}
            isNewBest={newBest}
            achievements={achievements}
            challenges={challenges}
            completedChallenges={completedChallenges}
            runBerries={world.berriesCollected}
            reviveCost={REVIVE_COST}
            canRevive={world.revives < MAX_REVIVES}
            onRevive={handleRevive}
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

      <GameControls
        onDuckStart={handleDuckStart}
        onDuckEnd={handleDuckEnd}
        onJump={handleJump}
      />

      <p className={styles.hint}>
        Space or tap the scene to jump — press again in mid-air for a spin jump.
        Hold Down or the Duck button to slide under branches. Press P or Esc to
        pause.
      </p>
    </main>
  )
}
