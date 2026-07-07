import { defineConfig } from 'vite';
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        
        ink: {
          950: '#0F1720',
          900: '#16212C',
          800: '#1E2E3B',
          700: '#2A3F50',
          600: '#3B5568',
        },
        brand: {
          50: '#EEF3F7',
          100: '#D7E3EC',
          400: '#3E6E91',
          500: '#2C5A7C',
          600: '#204A69',
          700: '#193B54',
        },
        accent: {
          500: '#B8863B',
          600: '#9C6F2E',
        },
        success: '#2F855A',
        danger: '#C53030',
        warning: '#B7791F',
      },
      fontFamily: {
        display: ['"Source Serif 4"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
