export const LOGICAL_WIDTH = 1000
export const LOGICAL_HEIGHT = 500
export const GROUND_HEIGHT = 96
export const SKY_HEIGHT = LOGICAL_HEIGHT - GROUND_HEIGHT

export const FOX_X = 150
export const FOX_WIDTH = 66
export const FOX_STAND_HEIGHT = 78
export const FOX_DUCK_HEIGHT = 46

export const GRAVITY = 2000
export const JUMP_VELOCITY = 780
export const DOUBLE_JUMP_VELOCITY = 700
export const MAX_JUMPS = 2
export const FAST_FALL_MULTIPLIER = 1.9
export const COYOTE_TIME = 0.1
export const JUMP_BUFFER_TIME = 0.12
export const RELEASE_GRAVITY_MULTIPLIER = 2.1

export const START_SPEED = 300
export const MAX_SPEED = 760
export const SPEED_RAMP = 8

export const MAX_HEARTS = 3
export const INVINCIBLE_TIME = 1.2
export const BERRY_POINTS = 15
export const DISTANCE_SCORE_PER_PX = 0.08

export const COMBO_WINDOW = 2.5
export const MAX_COMBO_MULTIPLIER = 5
export const FRENZY_COMBO = 6

export const comboMultiplier = (combo: number): number =>
  Math.min(MAX_COMBO_MULTIPLIER, 1 + Math.floor(Math.max(0, combo) / 2))

export const isFrenzy = (combo: number): boolean => combo >= FRENZY_COMBO

export const ROCK_WIDTH = 56
export const ROCK_HEIGHT = 48
export const BRANCH_WIDTH = 72
export const BRANCH_BOTTOM = 58
export const BRANCH_HEIGHT = SKY_HEIGHT - BRANCH_BOTTOM

export const BERRY_RADIUS = 16
export const BERRY_LOW_Y = 44
export const BERRY_HIGH_Y = 122

export const PICKUP_RADIUS = 19
export const MAX_SHIELDS = 1
export const MAGNET_TIME = 6
export const MAGNET_RADIUS = 250
export const MAGNET_PULL = 560
export const SLOW_TIME = 4.5
export const SLOW_FACTOR = 0.62
export const SPEED_BOOST_TIME = 5
export const SPEED_BOOST_FACTOR = 1.45
export const NEAR_MISS_GAP = 28
export const NEAR_MISS_POINTS = 8

export const HAZARD_RADIUS = 15
export const BEE_SPEED = 90
export const REVIVE_COST = 25
export const MAX_REVIVES = 1

export const BIOME_LENGTH = 1400

export type Biome = 'forest' | 'night' | 'snow'

export const biomeFor = (distance: number): Biome => {
  const index = Math.floor(Math.max(0, distance) / BIOME_LENGTH) % 3
  if (index === 1) {
    return 'night'
  }
  if (index === 2) {
    return 'snow'
  }
  return 'forest'
}

export type PickupKind = 'shield' | 'magnet' | 'slow' | 'life' | 'speed'

export type Phase = 'ready' | 'playing' | 'over'

export type ObstacleKind = 'rock' | 'branch'

export interface Fox {
  y: number
  vy: number
  ducking: boolean
  onGround: boolean
  jumps: number
  coyote: number
  jumpBuffer: number
  step: number
}

export interface Pickup {
  id: number
  kind: PickupKind
  x: number
  y: number
}

export type HazardKind = 'acorn' | 'bee'

export interface Hazard {
  id: number
  kind: HazardKind
  x: number
  y: number
  vx: number
  vy: number
}

export interface Obstacle {
  id: number
  kind: ObstacleKind
  x: number
  width: number
  height: number
  bottom: number
}

export interface Berry {
  id: number
  x: number
  y: number
}

export interface Box {
  left: number
  right: number
  bottom: number
  top: number
}

export interface InputState {
  jump: boolean
  duck: boolean
  jumpHeld?: boolean
}

export type GameEventType =
  | 'jump'
  | 'berry'
  | 'hit'
  | 'gameover'
  | 'land'
  | 'pickup'
  | 'shield'
  | 'nearmiss'

export interface GameEvent {
  type: GameEventType
  value?: number
  combo?: number
  multiplier?: number
  x?: number
  y?: number
  double?: boolean
  pickup?: PickupKind
  label?: string
}

export interface World {
  phase: Phase
  time: number
  distance: number
  speed: number
  fox: Fox
  obstacles: Obstacle[]
  berries: Berry[]
  pickups: Pickup[]
  hazards: Hazard[]
  hearts: number
  shields: number
  score: number
  berriesCollected: number
  nearMisses: number
  powerupsCollected: number
  combo: number
  comboTimer: number
  bestCombo: number
  magnetTimer: number
  slowTimer: number
  speedBoostTimer: number
  best: number
  invincible: number
  nextObstacleAt: number
  nextBerryAt: number
  nextPickupAt: number
  nextHazardAt: number
  revives: number
  nextId: number
  rng: () => number
  events: GameEvent[]
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const createSeededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

export const createWorld = (
  best = 0,
  rng: () => number = Math.random,
): World => ({
  phase: 'ready',
  time: 0,
  distance: 0,
  speed: START_SPEED,
  fox: {
    y: 0,
    vy: 0,
    ducking: false,
    onGround: true,
    jumps: 0,
    coyote: COYOTE_TIME,
    jumpBuffer: 0,
    step: 0,
  },
  obstacles: [],
  berries: [],
  pickups: [],
  hazards: [],
  hearts: MAX_HEARTS,
  shields: 0,
  score: 0,
  berriesCollected: 0,
  nearMisses: 0,
  powerupsCollected: 0,
  combo: 0,
  comboTimer: 0,
  bestCombo: 0,
  magnetTimer: 0,
  slowTimer: 0,
  speedBoostTimer: 0,
  best,
  invincible: 0,
  nextObstacleAt: 900,
  nextBerryAt: 520,
  nextPickupAt: 1200,
  nextHazardAt: 2000,
  revives: 0,
  nextId: 1,
  rng,
  events: [],
})

export const startRun = (world: World): World => ({
  ...createWorld(world.best, world.rng),
  phase: 'playing',
})

export const reviveRun = (world: World): World => {
  if (
    world.phase !== 'over' ||
    world.revives >= MAX_REVIVES ||
    world.berriesCollected < REVIVE_COST
  ) {
    return world
  }

  return {
    ...world,
    phase: 'playing',
    fox: {
      ...world.fox,
      y: 0,
      vy: 0,
      ducking: false,
      onGround: true,
      jumps: 0,
      coyote: COYOTE_TIME,
      jumpBuffer: 0,
    },
    obstacles: [],
    berries: [],
    pickups: [],
    hazards: [],
    hearts: 1,
    shields: 0,
    invincible: INVINCIBLE_TIME * 1.5,
    combo: 0,
    comboTimer: 0,
    berriesCollected: world.berriesCollected - REVIVE_COST,
    revives: world.revives + 1,
    nextObstacleAt: world.distance + 900,
    nextBerryAt: world.distance + 520,
    nextPickupAt: world.distance + 1200,
    nextHazardAt: world.distance + 1400,
    events: [],
  }
}

export const foxHeight = (fox: Fox): number =>
  fox.ducking ? FOX_DUCK_HEIGHT : FOX_STAND_HEIGHT

export const foxBox = (fox: Fox): Box => {
  const height = foxHeight(fox)
  return {
    left: FOX_X + 8,
    right: FOX_X + FOX_WIDTH - 8,
    bottom: fox.y + 4,
    top: fox.y + height - 4,
  }
}

export const obstacleBox = (obstacle: Obstacle): Box => ({
  left: obstacle.x,
  right: obstacle.x + obstacle.width,
  bottom: obstacle.bottom,
  top: obstacle.bottom + obstacle.height,
})

export const berryBox = (berry: Berry): Box => ({
  left: berry.x - BERRY_RADIUS,
  right: berry.x + BERRY_RADIUS,
  bottom: berry.y - BERRY_RADIUS,
  top: berry.y + BERRY_RADIUS,
})

export const pickupBox = (pickup: Pickup): Box => ({
  left: pickup.x - PICKUP_RADIUS,
  right: pickup.x + PICKUP_RADIUS,
  bottom: pickup.y - PICKUP_RADIUS,
  top: pickup.y + PICKUP_RADIUS,
})

export const hazardBox = (hazard: Hazard): Box => ({
  left: hazard.x - HAZARD_RADIUS,
  right: hazard.x + HAZARD_RADIUS,
  bottom: hazard.y - HAZARD_RADIUS,
  top: hazard.y + HAZARD_RADIUS,
})

export const boxesOverlap = (a: Box, b: Box): boolean =>
  a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom

export const createObstacle = (
  kind: ObstacleKind,
  x: number,
  id: number,
): Obstacle =>
  kind === 'rock'
    ? {
        id,
        kind,
        x,
        width: ROCK_WIDTH,
        height: ROCK_HEIGHT,
        bottom: 0,
      }
    : {
        id,
        kind,
        x,
        width: BRANCH_WIDTH,
        height: BRANCH_HEIGHT,
        bottom: BRANCH_BOTTOM,
      }

export const step = (prev: World, dt: number, input: InputState): World => {
  if (prev.phase !== 'playing') {
    return prev
  }

  const delta = clamp(dt, 0, 0.05)
  const events: GameEvent[] = []
  const time = prev.time + delta
  const speed = Math.min(MAX_SPEED, START_SPEED + time * SPEED_RAMP)
  let magnetTimer = Math.max(0, prev.magnetTimer - delta)
  let slowTimer = Math.max(0, prev.slowTimer - delta)
  let speedBoostTimer = Math.max(0, prev.speedBoostTimer - delta)
  const boost = speedBoostTimer > 0 ? SPEED_BOOST_FACTOR : 1
  const moveSpeed = speed * boost * (slowTimer > 0 ? SLOW_FACTOR : 1)
  const distance = prev.distance + speed * boost * delta
  let score = prev.score + speed * boost * delta * DISTANCE_SCORE_PER_PX
  let hearts = prev.hearts
  let shields = prev.shields
  let invincible = Math.max(0, prev.invincible - delta)
  let berriesCollected = prev.berriesCollected
  let nearMisses = prev.nearMisses
  let powerupsCollected = prev.powerupsCollected
  let combo = prev.combo
  let comboTimer = Math.max(0, prev.comboTimer - delta)
  if (comboTimer <= 0) {
    combo = 0
  }
  let bestCombo = prev.bestCombo
  let nextId = prev.nextId
  const rng = prev.rng

  const fox: Fox = { ...prev.fox }
  const wasOnGround = prev.fox.onGround
  const jumpHeld = input.jumpHeld ?? input.jump

  fox.jumpBuffer = Math.max(0, fox.jumpBuffer - delta)
  if (input.jump) {
    fox.jumpBuffer = JUMP_BUFFER_TIME
  }
  fox.coyote = fox.onGround ? COYOTE_TIME : Math.max(0, fox.coyote - delta)

  if (fox.jumpBuffer > 0) {
    if ((fox.onGround || fox.coyote > 0) && fox.jumps === 0) {
      fox.vy = JUMP_VELOCITY
      fox.onGround = false
      fox.jumps = 1
      fox.coyote = 0
      fox.jumpBuffer = 0
      events.push({ type: 'jump' })
    } else if (!fox.onGround && fox.jumps > 0 && fox.jumps < MAX_JUMPS) {
      fox.vy = DOUBLE_JUMP_VELOCITY
      fox.jumps += 1
      fox.jumpBuffer = 0
      events.push({ type: 'jump', double: true })
    }
  }

  fox.ducking = input.duck

  if (!fox.onGround) {
    let gravity = GRAVITY * (input.duck ? FAST_FALL_MULTIPLIER : 1)
    if (!jumpHeld && fox.vy > 0) {
      gravity *= RELEASE_GRAVITY_MULTIPLIER
    }
    fox.vy -= gravity * delta
    fox.y += fox.vy * delta
    if (fox.y <= 0) {
      fox.y = 0
      fox.vy = 0
      fox.onGround = true
      fox.jumps = 0
      fox.coyote = COYOTE_TIME
      if (!wasOnGround) {
        events.push({
          type: 'land',
          x: FOX_X + FOX_WIDTH / 2,
          y: 0,
        })
      }
    }
  }

  fox.step += delta * (fox.onGround ? moveSpeed / START_SPEED : 1.4)

  const fbox = foxBox(fox)

  const damageFox = (): void => {
    if (shields > 0) {
      shields -= 1
      invincible = INVINCIBLE_TIME * 0.6
      events.push({ type: 'shield' })
    } else {
      hearts -= 1
      invincible = INVINCIBLE_TIME
      combo = 0
      comboTimer = 0
      events.push({ type: 'hit' })
    }
  }

  let obstacles = prev.obstacles
    .map((obstacle) => ({ ...obstacle, x: obstacle.x - moveSpeed * delta }))
    .filter((obstacle) => obstacle.x + obstacle.width > -80)

  const hit = new Set<number>()
  for (const obstacle of obstacles) {
    if (boxesOverlap(fbox, obstacleBox(obstacle))) {
      hit.add(obstacle.id)
    }
  }

  if (hit.size > 0 && invincible <= 0) {
    damageFox()
    obstacles = obstacles.filter((obstacle) => !hit.has(obstacle.id))
  }

  const foxLeft = FOX_X + 8
  for (const obstacle of obstacles) {
    if (hit.has(obstacle.id)) {
      continue
    }
    const right = obstacle.x + obstacle.width
    const crossed = right < foxLeft && right + moveSpeed * delta >= foxLeft
    if (!crossed) {
      continue
    }
    const ob = obstacleBox(obstacle)
    const verticalGap =
      ob.bottom >= fbox.top
        ? ob.bottom - fbox.top
        : fbox.bottom >= ob.top
          ? fbox.bottom - ob.top
          : 0
    if (verticalGap > 0 && verticalGap <= NEAR_MISS_GAP) {
      nearMisses += 1
      score += NEAR_MISS_POINTS
      events.push({
        type: 'nearmiss',
        value: NEAR_MISS_POINTS,
        x: FOX_X + FOX_WIDTH,
        y: fox.y + foxHeight(fox) / 2,
      })
    }
  }

  let hazards = prev.hazards
    .map((hazard) => ({
      ...hazard,
      x: hazard.x + (hazard.vx - moveSpeed) * delta,
      y: hazard.y + hazard.vy * delta,
    }))
    .filter((hazard) => hazard.x > -80 && hazard.y > -40)

  const hazardHit = hazards.find((hazard) =>
    boxesOverlap(fbox, hazardBox(hazard)),
  )
  if (hazardHit && invincible <= 0) {
    damageFox()
    hazards = hazards.filter((hazard) => hazard.id !== hazardHit.id)
  }

  let berries = prev.berries
    .map((berry) => ({ ...berry, x: berry.x - moveSpeed * delta }))
    .filter((berry) => berry.x > -60)

  if (magnetTimer > 0) {
    const targetX = FOX_X + FOX_WIDTH / 2
    const targetY = fox.y + foxHeight(fox) / 2
    berries = berries.map((berry) => {
      const dx = targetX - berry.x
      const dy = targetY - berry.y
      const distanceToFox = Math.hypot(dx, dy)
      if (distanceToFox <= 1 || distanceToFox >= MAGNET_RADIUS) {
        return berry
      }
      const pull = Math.min(distanceToFox, MAGNET_PULL * delta)
      return {
        ...berry,
        x: berry.x + (dx / distanceToFox) * pull,
        y: berry.y + (dy / distanceToFox) * pull,
      }
    })
  }

  const eaten = new Set<number>()
  for (const berry of berries) {
    if (boxesOverlap(fbox, berryBox(berry))) {
      eaten.add(berry.id)
    }
  }
  if (eaten.size > 0) {
    const firstEaten = berries.find((berry) => eaten.has(berry.id))
    berries = berries.filter((berry) => !eaten.has(berry.id))
    berriesCollected += eaten.size
    combo += eaten.size
    comboTimer = COMBO_WINDOW
    bestCombo = Math.max(bestCombo, combo)
    const multiplier = comboMultiplier(combo)
    const value = BERRY_POINTS * eaten.size * multiplier
    score += value
    events.push({
      type: 'berry',
      value,
      combo,
      multiplier,
      x: firstEaten?.x,
      y: firstEaten?.y,
    })
  }

  let pickups = prev.pickups
    .map((pickup) => ({ ...pickup, x: pickup.x - moveSpeed * delta }))
    .filter((pickup) => pickup.x > -60)

  const collected = new Set<number>()
  for (const pickup of pickups) {
    if (boxesOverlap(fbox, pickupBox(pickup))) {
      collected.add(pickup.id)
    }
  }
  if (collected.size > 0) {
    const firstPickup = pickups.find((pickup) => collected.has(pickup.id))
    pickups = pickups.filter((pickup) => !collected.has(pickup.id))
    powerupsCollected += collected.size
    if (firstPickup) {
      if (firstPickup.kind === 'shield') {
        shields = Math.min(MAX_SHIELDS, shields + 1)
        events.push({
          type: 'pickup',
          pickup: 'shield',
          label: 'Shield!',
          x: firstPickup.x,
          y: firstPickup.y,
        })
      } else if (firstPickup.kind === 'magnet') {
        magnetTimer = MAGNET_TIME
        events.push({
          type: 'pickup',
          pickup: 'magnet',
          label: 'Berry magnet!',
          x: firstPickup.x,
          y: firstPickup.y,
        })
      } else if (firstPickup.kind === 'slow') {
        slowTimer = SLOW_TIME
        events.push({
          type: 'pickup',
          pickup: 'slow',
          label: 'Slow-mo!',
          x: firstPickup.x,
          y: firstPickup.y,
        })
      } else if (firstPickup.kind === 'life') {
        hearts = Math.min(MAX_HEARTS, hearts + 1)
        events.push({
          type: 'pickup',
          pickup: 'life',
          label: 'Extra life!',
          x: firstPickup.x,
          y: firstPickup.y,
        })
      } else {
        speedBoostTimer = SPEED_BOOST_TIME
        events.push({
          type: 'pickup',
          pickup: 'speed',
          label: 'Speed boost!',
          x: firstPickup.x,
          y: firstPickup.y,
        })
      }
    }
  }

  let nextObstacleAt = prev.nextObstacleAt
  let guard = 0
  while (distance >= nextObstacleAt && guard < 4) {
    guard += 1
    const kind: ObstacleKind = rng() < 0.5 ? 'rock' : 'branch'
    obstacles = [...obstacles, createObstacle(kind, LOGICAL_WIDTH + 80, nextId)]
    nextId += 1
    const gap = Math.max(480, speed * (1 + rng() * 0.55))
    nextObstacleAt += gap
  }

  let nextBerryAt = prev.nextBerryAt
  guard = 0
  while (distance >= nextBerryAt && guard < 4) {
    guard += 1
    const startX = LOGICAL_WIDTH + 60
    const blocked = obstacles.some(
      (obstacle) => Math.abs(obstacle.x - startX) < 150,
    )
    if (!blocked) {
      const cluster = rng() < 0.35 ? 3 : 1
      const y = rng() < 0.55 ? BERRY_LOW_Y : BERRY_HIGH_Y
      for (let i = 0; i < cluster; i += 1) {
        berries = [...berries, { id: nextId, x: startX + i * 46, y }]
        nextId += 1
      }
    }
    nextBerryAt += Math.max(320, speed * (0.55 + rng() * 0.5))
  }

  let nextPickupAt = prev.nextPickupAt
  guard = 0
  while (distance >= nextPickupAt && guard < 3) {
    guard += 1
    const startX = LOGICAL_WIDTH + 90
    const blocked = obstacles.some(
      (obstacle) => Math.abs(obstacle.x - startX) < 160,
    )
    if (!blocked) {
      const roll = rng()
      const kind: PickupKind =
        roll < 0.3
          ? 'shield'
          : roll < 0.52
            ? 'magnet'
            : roll < 0.7
              ? 'slow'
              : roll < 0.85
                ? hearts < MAX_HEARTS
                  ? 'life'
                  : 'shield'
                : 'speed'
      const y = rng() < 0.5 ? 72 : 132
      pickups = [...pickups, { id: nextId, kind, x: startX, y }]
      nextId += 1
    }
    nextPickupAt += Math.max(1200, speed * (2.4 + rng() * 1.2))
  }

  let nextHazardAt = prev.nextHazardAt
  guard = 0
  while (distance >= nextHazardAt && guard < 3) {
    guard += 1
    const kind: HazardKind = rng() < 0.55 ? 'acorn' : 'bee'
    const x = LOGICAL_WIDTH + 80 + rng() * 100
    const y = kind === 'acorn' ? SKY_HEIGHT + 20 + rng() * 60 : 55 + rng() * 50
    const targetY = 30 + rng() * 30
    const travel = Math.max(
      0.8,
      (x - (FOX_X + FOX_WIDTH / 2)) / Math.max(1, speed),
    )
    hazards = [
      ...hazards,
      {
        id: nextId,
        kind,
        x,
        y,
        vx: kind === 'bee' ? -(BEE_SPEED + rng() * 60) : 0,
        vy: kind === 'acorn' ? -(y - targetY) / travel : 0,
      },
    ]
    nextId += 1
    nextHazardAt += Math.max(1100, speed * (2.8 + rng() * 1.6))
  }

  let phase: Phase = prev.phase
  let best = prev.best

  if (hearts <= 0) {
    hearts = 0
    phase = 'over'
    best = Math.max(best, Math.floor(score))
    events.push({ type: 'gameover' })
  }

  return {
    ...prev,
    phase,
    time,
    distance,
    speed,
    fox,
    obstacles,
    berries,
    pickups,
    hazards,
    hearts,
    shields,
    score,
    berriesCollected,
    nearMisses,
    powerupsCollected,
    combo,
    comboTimer,
    bestCombo,
    magnetTimer,
    slowTimer,
    speedBoostTimer,
    best,
    invincible,
    nextObstacleAt,
    nextBerryAt,
    nextPickupAt,
    nextHazardAt,
    revives: prev.revives,
    nextId,
    events,
  }
}

export const formattedScore = (score: number): string =>
  Math.floor(score).toLocaleString('en-US')
