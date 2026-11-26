const THEME_STORAGE_KEY = 'ema-store-theme'

export type ColorTheme = 'light' | 'dark'

export function getSavedTheme(): ColorTheme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch (error) {
    console.warn('Unable to read the saved theme preference.', error)
    return 'light'
  }
}

export function applyTheme(theme: ColorTheme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function saveTheme(theme: ColorTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Unable to save the theme preference.', error)
  }
}
