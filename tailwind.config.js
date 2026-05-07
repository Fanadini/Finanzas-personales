/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50:  '#F0F4F1',
          100: '#DCE6DF',
          200: '#B5CBBB',
          300: '#8AAF96',
          400: '#5F9271',
          500: '#3F4F44',
          600: '#334038',
          700: '#27312B',
          800: '#1B221D',
          900: '#0E1210',
        },
        gold: {
          50:  '#FAF8F2',
          100: '#F3EDD8',
          200: '#E5D5A0',
          300: '#D4BB72',
          400: '#B8A46A',
          500: '#9A8550',
          600: '#7D6A3E',
          700: '#5F502F',
          800: '#423621',
          900: '#261F12',
        },
        warm: {
          50:  '#F8F5F0',
          100: '#F2EDE4',
          200: '#E5DDD0',
          300: '#D4C9B8',
          400: '#B8A88A',
        },
      },
    },
  },
  plugins: [],
}
