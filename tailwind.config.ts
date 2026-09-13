import type { Config } from 'tailwindcss'
const config: Config = { content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'], theme: { extend: { colors: { ink: '#111111', cream: '#f3f1eb', sand: '#d9d2c4' }, fontFamily: { sans: ['Arial', 'sans-serif'] } } }, plugins: [] }
export default config
