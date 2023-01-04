import type { AstroIntegration } from 'astro'

export function setThemeIntegration(): AstroIntegration {
  const code = 'localStorage.getItem("theme") ?? localStorage.setItem("theme", "auto");const theme = localStorage.getItem("theme");const colorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark": "light";const isDark = theme === "dark" || (theme === "auto" && colorScheme === "dark");isDark === true && document.documentElement.classList.add("dark");'

  return {
    name: 'set-theme-integration',
    hooks: {
      'astro:config:setup': ({ injectScript }) => {
        injectScript('head-inline', code)
      },
    },
  }
}
