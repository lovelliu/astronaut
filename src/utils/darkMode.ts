import { getPrefersColorScheme, getTheme } from '.'

const toggleButton = document.querySelector<HTMLButtonElement>('#toggle')!
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

const listener = (e: MediaQueryListEvent) => {
  toggle(e.matches ? 'dark' : 'light')
}

toggleButton.addEventListener('click', toggleDarkMode)

// Initialize theme
const theme = getTheme()
const colorScheme = getPrefersColorScheme()
theme === 'auto' && mediaQuery.addEventListener('change', listener)
theme === 'auto'
  ? colorScheme === 'dark'
    ? toggle('dark')
    : toggle('light')
  : theme === 'dark'
    ? toggle('dark')
    : toggle('light')

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
  }
  else {
    toggleButton.children[0].classList.remove('hidden')
    toggleButton.children[1].classList.add('hidden')
    document.documentElement.classList.remove('dark')
  }
}
