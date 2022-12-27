/**
 * @description Get user preference from localStorage
 * @returns {string} 'auto' | 'dark' | 'light'
 */
export function getTheme(): string {
  localStorage.getItem('theme') ?? localStorage.setItem('theme', 'auto')
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

/**
 * @description Initialize theme
 * @param toggleButton toggle button element
 */
export function setDarkMode(toggleButton: HTMLButtonElement): void {
  const theme = getTheme()
  const colorScheme = getPrefersColorScheme()
  theme === 'auto' 
    ? colorScheme === 'dark' 
      ? toggle('dark', toggleButton) 
      : toggle('light', toggleButton) 
    : theme === 'dark' 
      ? toggle('dark', toggleButton) 
      : toggle('light', toggleButton)
}

/**
 * @description Toggle theme
 * @param toggleButton toggle button element
 */
export function toggleDarkMode(toggleButton: HTMLButtonElement) {
  return () => {
    const colorScheme = getPrefersColorScheme()
      const theme = getTheme()
      const isDark = theme === 'dark' || (theme === 'auto' && colorScheme === 'dark')
  
      if (isDark) {
        toggle('light', toggleButton)
        colorScheme === 'dark' 
          ? localStorage.setItem('theme', 'light')
          : localStorage.setItem('theme', 'auto')
      } 
      else {
        toggle('dark', toggleButton)
        colorScheme === 'light' 
          ? localStorage.setItem('theme', 'dark')
          : localStorage.setItem('theme', 'auto')
      }
  }
}

/**
 * @description Perform some operations when the theme changes
 * @param mode 'dark' | 'light'
 * @param toggleButton toggle button element
 */
export function toggle(mode: 'dark' | 'light', toggleButton: HTMLButtonElement): void {
  if (mode === 'dark') {
    toggleButton.children[0].classList.add('hidden')
    toggleButton.children[1].classList.remove('hidden')
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
  }
  else {
    toggleButton.children[0].classList.remove('hidden')
    toggleButton.children[1].classList.add('hidden')
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
  }
}
