/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0a0e1a',
        day: '#87CEEB',
        blood: '#8B0000',
        wolf: '#4a0e0e',
        village: '#2d5016',
        seer: '#4a148c',
        witch: '#1b5e20',
        hunter: '#e65100',
        guard: '#0d47a1',
      },
    },
  },
  plugins: [],
};
