import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import { setThemeIntegration } from './src/utils/setThemeIntegration'

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind({
      config: {
        applyBaseStyles: false,
      },
    }),
    setThemeIntegration(),
    sitemap(),
  ],
  site: 'https://lovelliu.me',
})
