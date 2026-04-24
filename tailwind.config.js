/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        'primary-dark': '#E55555',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        surface: '#FFFFFF',
        'surface-dark': '#1A1A2E',
        muted: '#F7F7F7',
        'muted-dark': '#16213E',
      },
    },
  },
  plugins: [],
};
