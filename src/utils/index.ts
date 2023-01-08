/**
 * @description Get user preference from localStorage
 * @returns {string} 'auto' | 'dark' | 'light'
 */
export function getTheme(): string {
  const theme = localStorage.getItem('theme')!
  return theme
}

/**
 * @description Get system preference
 * @returns {string} 'auto' | 'dark' | 'light'
 */
export function getPrefersColorScheme(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
