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
        primary: '#1CB0F6',
        'primary-dark': '#1899D6',
        secondary: '#58CC02',
        accent: '#FF9600',
        surface: '#FFFFFF',
        'surface-dark': '#131F24',
        muted: '#F7F7F7',
        'muted-dark': '#1A2930',
      },
    },
  },
  plugins: [],
};
