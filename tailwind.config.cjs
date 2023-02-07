const plugin = require('tailwindcss/plugin')

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple']
const safelist = []
for (let i = 0; i < 7; i++) {
  safelist.push(`bg-${colors[i]}-400`)
  safelist.push(`dark:text-${colors[i]}-400`)
  safelist.push(`border-l-${colors[i]}-500`)
  safelist.push(`text-${colors[i]}-700`)
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        day: 'hsl(210, 29%, 97%)',
        dark: 'hsl(217, 24%, 17%)',
      },
      fontFamily: {
        'sans': ['LXGWWenKai', 'sans-serif'],
        'sans-bold': ['LXGWWenKaiBold', 'sans-serif'],
        'mono': ['LXGWWenKaiMono', 'monospace'],
      },
    },
  },
  darkMode: 'class',
  plugins: [
    require('@tailwindcss/typography'),
    plugin(({ addVariant }) => {
      addVariant('children', '&>*')
      addVariant('children-after', '&>*::after')
    }),
  ],
  safelist,
}
