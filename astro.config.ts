import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import { setThemeIntegration } from './src/utils/setThemeIntegration'

export default defineConfig({
  integrations: [
    tailwind({
      config: { applyBaseStyles: false },
    }),
    setThemeIntegration(),
  ],
})
