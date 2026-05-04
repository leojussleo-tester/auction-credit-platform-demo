/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular']
      },
      colors: {
        auction: {
          bg: '#07070A',
          panel: '#111217',
          panel2: '#171922',
          line: '#2A2D38',
          gold: '#D8B45C',
          goldSoft: '#F6D98B',
          neon: '#58F2C3',
          danger: '#FB7185'
        }
      },
      boxShadow: {
        luxury: '0 20px 80px rgba(216,180,92,0.12)',
        neon: '0 0 36px rgba(88,242,195,0.16)'
      }
    },
  },
  plugins: [],
}
