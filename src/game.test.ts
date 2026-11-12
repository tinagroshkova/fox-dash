import { describe, expect, it } from 'vitest'
import {
  BERRY_POINTS,
  BIOME_LENGTH,
  COMBO_WINDOW,
  COYOTE_TIME,
  DOUBLE_JUMP_VELOCITY,
  FOX_DUCK_HEIGHT,
  FOX_STAND_HEIGHT,
  INVINCIBLE_TIME,
  MAGNET_TIME,
  MAX_COMBO_MULTIPLIER,
  MAX_HEARTS,
  MAX_JUMPS,
  MAX_SPEED,
  NEAR_MISS_POINTS,
  START_SPEED,
  biomeFor,
  comboMultiplier,
  createObstacle,
  createSeededRandom,
  createWorld,
  formattedScore,
  foxBox,
  foxHeight,
  isFrenzy,
  startRun,
  step,
  type Berry,
  type Fox,
  type World,
} from './game'

const playing = (seed = 1): World =>
  startRun(createWorld(0, createSeededRandom(seed)))

const withFox = (world: World, fox: Partial<Fox>): World => ({
  ...world,
  fox: { ...world.fox, ...fox },
})

const quiet = (world: World): World => ({
  ...world,
  nextObstacleAt: Number.POSITIVE_INFINITY,
  nextBerryAt: Number.POSITIVE_INFINITY,
})

describe('createWorld', () => {
  it('starts in the ready phase with full hearts and no entities', () => {
    const world = createWorld()
    expect(world.phase).toBe('ready')
    expect(world.hearts).toBe(MAX_HEARTS)
    expect(world.speed).toBe(START_SPEED)
    expect(world.obstacles).toHaveLength(0)
    expect(world.berries).toHaveLength(0)
    expect(world.fox.onGround).toBe(true)
  })

  it('keeps the provided best score', () => {
    expect(createWorld(4321).best).toBe(4321)
  })
})

describe('startRun', () => {
  it('resets the run but keeps the best score and starts playing', () => {
    const world = startRun(createWorld(900))
    expect(world.phase).toBe('playing')
    expect(world.best).toBe(900)
    expect(world.hearts).toBe(MAX_HEARTS)
    expect(world.score).toBe(0)
    expect(world.distance).toBe(0)
    expect(world.combo).toBe(0)
    expect(world.bestCombo).toBe(0)
  })
})

describe('fox movement', () => {
  it('jumps from the ground and emits a jump event', () => {
    const next = step(playing(), 0.016, { jump: true, duck: false })
    expect(next.fox.onGround).toBe(false)
    expect(next.fox.vy).toBeGreaterThan(0)
    expect(next.fox.y).toBeGreaterThan(0)
    expect(next.fox.jumps).toBe(1)
    expect(next.events).toContainEqual({ type: 'jump' })
  })

  it('allows one double jump in the air', () => {
    const airborne = withFox(quiet(playing()), {
      y: 80,
      vy: 0,
      onGround: false,
      jumps: 1,
    })
    const next = step(airborne, 0.016, { jump: true, duck: false })
    expect(next.fox.jumps).toBe(MAX_JUMPS)
    expect(next.fox.vy).toBeGreaterThan(0)
    expect(next.fox.vy).toBeLessThanOrEqual(DOUBLE_JUMP_VELOCITY)
    expect(next.events).toContainEqual({ type: 'jump', double: true })
  })

  it('ignores a jump once both jumps are used', () => {
    const airborne = withFox(quiet(playing()), {
      y: 80,
      vy: 0,
      onGround: false,
      jumps: MAX_JUMPS,
    })
    const next = step(airborne, 0.016, { jump: true, duck: false })
    expect(next.events).not.toContainEqual(expect.objectContaining({ type: 'jump' }))
    expect(next.fox.vy).toBeLessThanOrEqual(0)
  })

  it('resets the jump count after landing', () => {
    let world = quiet(playing())
    world = step(world, 0.016, { jump: true, duck: false })
    world = step(world, 0.016, { jump: true, duck: false })
    expect(world.fox.jumps).toBe(MAX_JUMPS)

    for (let i = 0; i < 150; i += 1) {
      world = step(world, 0.016, { jump: false, duck: false })
    }
    expect(world.fox.onGround).toBe(true)
    expect(world.fox.jumps).toBe(0)
  })

  it('returns to the ground after a jump', () => {
    let world = quiet(playing())
    world = step(world, 0.016, { jump: true, duck: false })
    for (let i = 0; i < 120; i += 1) {
      world = step(world, 0.016, { jump: false, duck: false })
    }
    expect(world.fox.onGround).toBe(true)
    expect(world.fox.y).toBe(0)
  })

  it('ducks when asked and is shorter while ducking', () => {
    const next = step(playing(), 0.016, { jump: false, duck: true })
    expect(next.fox.ducking).toBe(true)
    expect(foxHeight(next.fox)).toBe(FOX_DUCK_HEIGHT)
    expect(foxHeight({ ...next.fox, ducking: false })).toBe(FOX_STAND_HEIGHT)
  })

  it('sits above the duck box while standing', () => {
    const standing = foxBox({ ...createWorld().fox, ducking: false })
    const ducking = foxBox({ ...createWorld().fox, ducking: true })
    expect(standing.top).toBeGreaterThan(ducking.top)
  })
})

describe('obstacles', () => {
  it('loses a heart when a standing fox hits a rock', () => {
    const world = quiet(playing())
    const next = step(
      { ...world, obstacles: [createObstacle('rock', 150, 1)] },
      0.016,
      { jump: false, duck: false },
    )
    expect(next.hearts).toBe(MAX_HEARTS - 1)
    expect(next.events).toContainEqual({ type: 'hit' })
    expect(next.obstacles).toHaveLength(0)
  })

  it('clears a rock while jumping', () => {
    const world = quiet(playing())
    const next = step(
      {
        ...withFox(world, { y: 70, vy: 0, onGround: false }),
        obstacles: [createObstacle('rock', 150, 1)],
      },
      0.016,
      { jump: false, duck: false },
    )
    expect(next.hearts).toBe(MAX_HEARTS)
    expect(next.events).not.toContainEqual({ type: 'hit' })
  })

  it('hits a branch while standing but passes under it while ducking', () => {
    const world = quiet(playing())
    const branch = createObstacle('branch', 150, 1)

    const standing = step(
      { ...world, obstacles: [branch] },
      0.016,
      { jump: false, duck: false },
    )
    expect(standing.hearts).toBe(MAX_HEARTS - 1)

    const ducking = step(
      { ...world, obstacles: [branch] },
      0.016,
      { jump: false, duck: true },
    )
    expect(ducking.hearts).toBe(MAX_HEARTS)
  })

  it('grants brief invincibility after a hit', () => {
    const world = quiet(playing())
    const first = step(
      { ...world, obstacles: [createObstacle('rock', 150, 1)] },
      0.016,
      { jump: false, duck: false },
    )
    expect(first.hearts).toBe(MAX_HEARTS - 1)
    expect(first.invincible).toBeGreaterThan(0)
    expect(first.invincible).toBeLessThanOrEqual(INVINCIBLE_TIME)

    const second = step(
      { ...first, obstacles: [createObstacle('rock', 150, 2)] },
      0.016,
      { jump: false, duck: false },
    )
    expect(second.hearts).toBe(MAX_HEARTS - 1)
  })

  it('ends the run when the last heart is lost', () => {
    const world = quiet(playing())
    const next = step(
      {
        ...world,
        hearts: 1,
        obstacles: [createObstacle('rock', 150, 1)],
      },
      0.016,
      { jump: false, duck: false },
    )
    expect(next.hearts).toBe(0)
    expect(next.phase).toBe('over')
    expect(next.events).toContainEqual({ type: 'gameover' })
    expect(next.best).toBe(Math.floor(next.score))
  })
})

describe('berries', () => {
  it('collects a berry that overlaps the fox', () => {
    const berry: Berry = { id: 1, x: 180, y: 44 }
    const world = quiet(playing())
    const next = step({ ...world, berries: [berry] }, 0.016, {
      jump: false,
      duck: false,
    })
    expect(next.berriesCollected).toBe(1)
    expect(next.berries).toHaveLength(0)
    expect(next.events).toContainEqual(expect.objectContaining({ type: 'berry' }))
    expect(next.score).toBeGreaterThanOrEqual(BERRY_POINTS)
  })

  it('misses a berry that is out of reach', () => {
    const berry: Berry = { id: 1, x: 900, y: 300 }
    const world = quiet(playing())
    const next = step({ ...world, berries: [berry] }, 0.016, {
      jump: false,
      duck: false,
    })
    expect(next.berriesCollected).toBe(0)
    expect(next.berries).toHaveLength(1)
  })
})

describe('combos', () => {
  it('scales the multiplier with the combo and caps it', () => {
    expect(comboMultiplier(0)).toBe(1)
    expect(comboMultiplier(1)).toBe(1)
    expect(comboMultiplier(2)).toBe(2)
    expect(comboMultiplier(4)).toBe(3)
    expect(comboMultiplier(8)).toBe(MAX_COMBO_MULTIPLIER)
    expect(comboMultiplier(50)).toBe(MAX_COMBO_MULTIPLIER)
  })

  it('only enters frenzy at the frenzy threshold', () => {
    expect(isFrenzy(5)).toBe(false)
    expect(isFrenzy(6)).toBe(true)
  })

  it('builds a combo and awards multiplied berry points', () => {
    let world = quiet(playing())
    world = step(
      { ...world, berries: [{ id: 1, x: 180, y: 44 }] },
      0.016,
      { jump: false, duck: false },
    )
    expect(world.combo).toBe(1)
    const first = world.events.find((event) => event.type === 'berry')
    expect(first?.value).toBe(BERRY_POINTS)
    expect(first?.multiplier).toBe(1)

    world = step(
      { ...world, berries: [{ id: 2, x: 180, y: 44 }] },
      0.016,
      { jump: false, duck: false },
    )
    expect(world.combo).toBe(2)
    const second = world.events.find((event) => event.type === 'berry')
    expect(second?.value).toBe(BERRY_POINTS * 2)
    expect(second?.multiplier).toBe(2)
  })

  it('drops the combo when the window expires', () => {
    let world = quiet(playing())
    world = step(
      { ...world, berries: [{ id: 1, x: 180, y: 44 }] },
      0.016,
      { jump: false, duck: false },
    )
    expect(world.combo).toBe(1)

    world = step({ ...world, comboTimer: 0.01 }, 0.05, {
      jump: false,
      duck: false,
    })
    expect(world.combo).toBe(0)
  })

  it('resets the combo when the fox takes a hit', () => {
    let world = quiet(playing())
    world = step(
      { ...world, berries: [{ id: 1, x: 180, y: 44 }] },
      0.016,
      { jump: false, duck: false },
    )
    world = step(
      { ...world, berries: [{ id: 2, x: 180, y: 44 }] },
      0.016,
      { jump: false, duck: false },
    )
    expect(world.combo).toBe(2)

    const hit = step(
      { ...world, obstacles: [createObstacle('rock', 150, 9)] },
      0.016,
      { jump: false, duck: false },
    )
    expect(hit.hearts).toBe(MAX_HEARTS - 1)
    expect(hit.combo).toBe(0)
  })

  it('remembers the best combo of the run', () => {
    let world = quiet(playing())
    for (let i = 0; i < 4; i += 1) {
      world = step(
        { ...world, berries: [{ id: 10 + i, x: 180, y: 44 }] },
        0.016,
        { jump: false, duck: false },
      )
    }
    expect(world.combo).toBe(4)
    expect(world.bestCombo).toBe(4)

    world = step({ ...world, comboTimer: 0.01 }, 0.05, {
      jump: false,
      duck: false,
    })
    expect(world.combo).toBe(0)
    expect(world.bestCombo).toBe(4)
  })

  it('refreshes the combo window when a berry is collected', () => {
    let world = quiet(playing())
    world = step(
      { ...world, berries: [{ id: 1, x: 180, y: 44 }] },
      0.016,
      { jump: false, duck: false },
    )
    world = step({ ...world, comboTimer: 1 }, 0.05, {
      jump: false,
      duck: false,
    })
    expect(world.combo).toBe(1)
    expect(world.comboTimer).toBeCloseTo(0.95)

    world = step(
      { ...world, berries: [{ id: 2, x: 180, y: 44 }] },
      0.016,
      { jump: false, duck: false },
    )
    expect(world.combo).toBe(2)
    expect(world.comboTimer).toBe(COMBO_WINDOW)
  })
})

describe('difficulty', () => {
  it('ramps speed up and caps it', () => {
    const fast = step({ ...playing(), time: 200 }, 0.016, {
      jump: false,
      duck: false,
    })
    expect(fast.speed).toBe(MAX_SPEED)
  })

  it('spawns obstacles and berries as distance grows', () => {
    let world = playing(7)
    for (let i = 0; i < 200; i += 1) {
      world = step(world, 1 / 60, { jump: false, duck: false })
    }
    expect(world.obstacles.length).toBeGreaterThan(0)
    expect(world.berries.length).toBeGreaterThan(0)
  })

  it('is deterministic for a given seed and input sequence', () => {
    const run = (seed: number): World => {
      let world = playing(seed)
      for (let i = 0; i < 30; i += 1) {
        world = step(world, 1 / 60, {
          jump: i % 20 === 0,
          duck: false,
        })
      }
      return world
    }

    const a = run(123)
    const b = run(123)
    expect(a.obstacles).toEqual(b.obstacles)
    expect(a.berries).toEqual(b.berries)
    expect(a.score).toBe(b.score)
    expect(a.distance).toBe(b.distance)
  })
})

describe('forgiving jump controls', () => {
  it('allows a jump during coyote time after leaving the ground', () => {
    const ledge = withFox(quiet(playing()), {
      y: 1,
      vy: -50,
      onGround: false,
      jumps: 0,
      coyote: COYOTE_TIME,
    })
    const next = step(ledge, 0.016, { jump: true, duck: false })
    expect(next.fox.jumps).toBe(1)
    expect(next.events).toContainEqual({ type: 'jump' })
  })

  it('ignores a jump once coyote time has expired', () => {
    const ledge = withFox(quiet(playing()), {
      y: 60,
      vy: 0,
      onGround: false,
      jumps: 0,
      coyote: 0,
    })
    const next = step(ledge, 0.016, { jump: true, duck: false })
    expect(next.fox.jumps).toBe(0)
    expect(next.events).not.toContainEqual(
      expect.objectContaining({ type: 'jump' }),
    )
  })

  it('buffers a jump pressed just before landing', () => {
    const falling = withFox(quiet(playing()), {
      y: 2,
      vy: -200,
      onGround: false,
      jumps: 0,
      coyote: 0,
    })
    const landed = step(falling, 0.016, { jump: true, duck: false })
    expect(landed.fox.onGround).toBe(true)
    expect(landed.fox.jumps).toBe(0)

    const next = step(landed, 0.016, { jump: false, duck: false })
    expect(next.fox.jumps).toBe(1)
    expect(next.events).toContainEqual({ type: 'jump' })
  })

  it('jumps higher while the jump button is held', () => {
    const fly = (hold: boolean): World => {
      let world = step(quiet(playing()), 0.016, {
        jump: true,
        duck: false,
        jumpHeld: true,
      })
      for (let i = 0; i < 8; i += 1) {
        world = step(world, 0.016, {
          jump: false,
          duck: false,
          jumpHeld: hold,
        })
      }
      return world
    }

    expect(fly(true).fox.y).toBeGreaterThan(fly(false).fox.y)
  })
})

describe('power-ups', () => {
  it('collects a shield pickup', () => {
    const next = step(
      {
        ...quiet(playing()),
        pickups: [{ id: 1, kind: 'shield', x: 180, y: 44 }],
      },
      0.016,
      { jump: false, duck: false },
    )
    expect(next.shields).toBe(1)
    expect(next.pickups).toHaveLength(0)
    expect(next.events).toContainEqual(
      expect.objectContaining({ type: 'pickup', pickup: 'shield' }),
    )
  })

  it('starts the magnet timer from a magnet pickup', () => {
    const next = step(
      {
        ...quiet(playing()),
        pickups: [{ id: 1, kind: 'magnet', x: 180, y: 44 }],
      },
      0.016,
      { jump: false, duck: false },
    )
    expect(next.magnetTimer).toBe(MAGNET_TIME)
  })

  it('slows scrolling entities with a slow-mo pickup', () => {
    const berry: Berry = { id: 1, x: 600, y: 44 }
    const normal = step(
      { ...quiet(playing()), berries: [berry] },
      0.016,
      { jump: false, duck: false },
    )
    const slowed = step(
      { ...quiet(playing()), slowTimer: 1, berries: [berry] },
      0.016,
      { jump: false, duck: false },
    )
    const normalX = normal.berries[0]?.x ?? 0
    const slowedX = slowed.berries[0]?.x ?? 0
    expect(slowedX).toBeGreaterThan(normalX)
  })

  it('absorbs a hit with a shield instead of losing a heart', () => {
    const next = step(
      {
        ...quiet(playing()),
        shields: 1,
        obstacles: [createObstacle('rock', 150, 1)],
      },
      0.016,
      { jump: false, duck: false },
    )
    expect(next.hearts).toBe(MAX_HEARTS)
    expect(next.shields).toBe(0)
    expect(next.events).toContainEqual({ type: 'shield' })
    expect(next.events).not.toContainEqual({ type: 'hit' })
  })
})

describe('near misses', () => {
  it('scores a near miss when ducking just under a branch', () => {
    const next = step(
      {
        ...quiet(playing()),
        obstacles: [createObstacle('branch', 88, 1)],
      },
      0.016,
      { jump: false, duck: true },
    )
    expect(next.hearts).toBe(MAX_HEARTS)
    expect(next.nearMisses).toBe(1)
    expect(next.events).toContainEqual(
      expect.objectContaining({ type: 'nearmiss', value: NEAR_MISS_POINTS }),
    )
  })
})

describe('biomes', () => {
  it('cycles forest, night, and snow with distance', () => {
    expect(biomeFor(0)).toBe('forest')
    expect(biomeFor(BIOME_LENGTH)).toBe('night')
    expect(biomeFor(BIOME_LENGTH * 2)).toBe('snow')
    expect(biomeFor(BIOME_LENGTH * 3)).toBe('forest')
  })
})

describe('formattedScore', () => {
  it('floors and groups thousands', () => {
    expect(formattedScore(1234.9)).toBe('1,234')
  })
})
