export type Theme = 'light' | 'dark'

const THEME_KEY = 'fox-dash:theme'
const BEST_KEY = 'fox-dash:best'
const SOUND_KEY = 'fox-dash:sound'
const TOTAL_BERRIES_KEY = 'fox-dash:total-berries'
const ACHIEVEMENTS_KEY = 'fox-dash:achievements'

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
