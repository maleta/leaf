import { reactive, watch } from 'vue'

export type RenderMode = 'instant' | 'typing'
export type ThemePreference = 'system' | 'light' | 'dark'
export type ViewMode = 'preview' | 'split'

export interface Settings {
  /** How a freshly opened document appears: all at once, or typed out. */
  renderMode: RenderMode
  charsPerSecond: number
  animate: boolean
  animationSplit: 'auto' | 'word' | 'char'
  caret: boolean
  theme: ThemePreference
  fontScale: number
  defaultView: ViewMode
  syncScroll: boolean
}

const STORAGE_KEY = 'leaf:settings'

export const DEFAULT_SETTINGS: Settings = {
  renderMode: 'instant',
  charsPerSecond: 1200,
  animate: true,
  animationSplit: 'word',
  caret: true,
  theme: 'system',
  fontScale: 1,
  defaultView: 'preview',
  syncScroll: true
}

export const SPEED_PRESETS = [
  { label: 'Slow', value: 400 },
  { label: 'Natural', value: 1200 },
  { label: 'Fast', value: 3000 },
  { label: 'Turbo', value: 9000 }
] as const

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) } : { ...DEFAULT_SETTINGS }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

const settings = reactive<Settings>(load())

watch(
  settings,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      /* storage unavailable; settings stay session-only */
    }
  },
  { deep: true }
)

export function useSettings(): Settings {
  return settings
}

export function resetSettings(): void {
  Object.assign(settings, DEFAULT_SETTINGS)
}
