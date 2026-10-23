import { create } from 'zustand'

interface ThemeState {
  isDarkMode: boolean
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

const STORAGE_KEY = 'lkhcards_dark_mode'

const getInitialTheme = (): boolean => {
  if (typeof window === 'undefined') return false
  const saved =
    localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('linguacards_dark_mode')
  if (saved !== null) {
    return saved === 'true'
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const next = !state.isDarkMode
      localStorage.setItem(STORAGE_KEY, String(next))
      if (next) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { isDarkMode: next }
    }),
  setTheme: (dark: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(dark))
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    set({ isDarkMode: dark })
  },
}))

// Apply on load
if (typeof window !== 'undefined') {
  const initial = getInitialTheme()
  if (initial) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
