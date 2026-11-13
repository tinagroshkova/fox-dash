import { SKINS, type Skin } from './skins'

export type Theme = 'light' | 'dark'

const THEME_KEY = 'fox-dash:theme'
const BEST_KEY = 'fox-dash:best'
const SOUND_KEY = 'fox-dash:sound'
const TOTAL_BERRIES_KEY = 'fox-dash:total-berries'
const ACHIEVEMENTS_KEY = 'fox-dash:achievements'
const OWNED_SKINS_KEY = 'fox-dash:owned-skins'
const SELECTED_SKIN_KEY = 'fox-dash:selected-skin'
const DAILY_CHALLENGES_KEY = 'fox-dash:daily-challenges'

export interface DailyChallengeState {
  date: string
  completed: string[]
}

const read = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* ignore storage failures */
  }
}

export const loadTheme = (): Theme => {
  const stored = read(THEME_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const saveTheme = (theme: Theme): void => write(THEME_KEY, theme)

export const loadBest = (): number => {
  const stored = read(BEST_KEY)
  const value = stored ? Number.parseInt(stored, 10) : 0
  return Number.isFinite(value) && value > 0 ? value : 0
}

export const saveBest = (best: number): void => write(BEST_KEY, String(best))

export const loadSound = (): boolean => read(SOUND_KEY) !== 'off'

export const saveSound = (enabled: boolean): void =>
  write(SOUND_KEY, enabled ? 'on' : 'off')

export const loadTotalBerries = (): number => {
  const stored = read(TOTAL_BERRIES_KEY)
  const value = stored ? Number.parseInt(stored, 10) : 0
  return Number.isFinite(value) && value > 0 ? value : 0
}

export const saveTotalBerries = (total: number): void =>
  write(TOTAL_BERRIES_KEY, String(Math.max(0, Math.floor(total))))

export const loadAchievements = (): string[] => {
  const stored = read(ACHIEVEMENTS_KEY)
  if (!stored) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : []
  } catch {
    return []
  }
}

export const saveAchievements = (ids: string[]): void =>
  write(ACHIEVEMENTS_KEY, JSON.stringify(ids))

const isSkin = (value: string): value is Skin =>
  SKINS.some((def) => def.id === value)

export const loadOwnedSkins = (): Skin[] => {
  const owned: Skin[] = ['classic']
  const stored = read(OWNED_SKINS_KEY)
  if (!stored) {
    return owned
  }
  try {
    const parsed: unknown = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (
          typeof item === 'string' &&
          isSkin(item) &&
          !owned.includes(item)
        ) {
          owned.push(item)
        }
      }
    }
  } catch {
    /* ignore malformed storage */
  }
  return owned
}

export const saveOwnedSkins = (skins: Skin[]): void =>
  write(OWNED_SKINS_KEY, JSON.stringify(skins))

export const loadSelectedSkin = (): Skin => {
  const stored = read(SELECTED_SKIN_KEY)
  return stored && isSkin(stored) ? stored : 'classic'
}

export const saveSelectedSkin = (skin: Skin): void =>
  write(SELECTED_SKIN_KEY, skin)

export const loadDailyChallengeState = (): DailyChallengeState => {
  const stored = read(DAILY_CHALLENGES_KEY)
  if (!stored) {
    return { date: '', completed: [] }
  }
  try {
    const parsed: unknown = JSON.parse(stored)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'date' in parsed &&
      'completed' in parsed &&
      typeof parsed.date === 'string' &&
      Array.isArray(parsed.completed)
    ) {
      return {
        date: parsed.date,
        completed: parsed.completed.filter(
          (item): item is string => typeof item === 'string',
        ),
      }
    }
  } catch {
    /* ignore malformed storage */
  }
  return { date: '', completed: [] }
}

export const saveDailyChallengeState = (state: DailyChallengeState): void =>
  write(DAILY_CHALLENGES_KEY, JSON.stringify(state))
