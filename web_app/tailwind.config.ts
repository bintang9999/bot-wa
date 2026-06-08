import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        emerald: '#10b981',
        yellow: '#eab308',
        indigo: '#6366f1',
        pink: '#ec4899',
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
