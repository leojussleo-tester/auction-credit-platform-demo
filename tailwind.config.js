/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 24px 80px rgba(99, 102, 241, 0.28)',
      },
    },
  },
  plugins: [],
};
