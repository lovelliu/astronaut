/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				day: 'hsl(210, 29%, 97%)',
				dark: 'hsl(217, 24%, 17%)'
			}
		},
	},
	darkMode: 'class',
	plugins: [],
}
