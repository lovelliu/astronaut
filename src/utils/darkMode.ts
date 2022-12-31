const toggleButton = document.querySelector<HTMLButtonElement>('#toggle')!
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const listener = (e: MediaQueryListEvent) => {
  toggle(e.matches ? 'dark' : 'light')
}

toggleButton.addEventListener('click', toggleDarkMode)
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
 */
export function setDarkMode(): void {
  const theme = getTheme()
  const colorScheme = getPrefersColorScheme()
  console.log(theme)
  theme === 'auto' && mediaQuery.addEventListener('change', listener)
  theme === 'auto' 
    ? colorScheme === 'dark' 
      ? toggle('dark') 
      : toggle('light') 
    : theme === 'dark' 
      ? toggle('dark') 
      : toggle('light')
}

/**
 * @description Toggle theme
 */
export function toggleDarkMode() {
  const colorScheme = getPrefersColorScheme()
  const theme = getTheme()
  const isDark = theme === 'dark' || (theme === 'auto' && colorScheme === 'dark')

  if (isDark) {
    toggle('light')
    if (colorScheme === 'dark') {
      localStorage.setItem('theme', 'light')
      mediaQuery.removeEventListener('change', listener)
    }
    else {
      localStorage.setItem('theme', 'auto')
      mediaQuery.addEventListener('change', listener)
    }
  } 
  else {
    toggle('dark')
    if (colorScheme === 'light') {
      localStorage.setItem('theme', 'dark')
      mediaQuery.removeEventListener('change', listener)
    }
    else {
      localStorage.setItem('theme', 'auto')
      mediaQuery.addEventListener('change', listener)
    }
  }
}

/**
 * @description Perform some operations when the theme changes
 * @param mode 'dark' | 'light'
 * @param toggleButton toggle button element
 */
export function toggle(mode: 'dark' | 'light'): void {
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
