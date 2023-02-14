import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import remarkToc from 'remark-toc'
import { setThemeIntegration } from './src/utils/setThemeIntegration'
import { remarkReadingTime } from './src/utils/readingTime'

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
  site: 'https://lovelliu.me/',
  markdown: {
    remarkPlugins: [remarkReadingTime, [remarkToc, { maxDepth: 3, tight: true }]],
    shikiConfig: {
      theme: 'css-variables',
    },
  },
})
