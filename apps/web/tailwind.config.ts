/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9fa',
          100: '#d9f0f3',
          200: '#b8e3e9',
          300: '#87cdd7',
          400: '#4fa9b8',
          500: '#3a8a9c',
          600: '#2f7184',
          700: '#2a5d6c',
          800: '#284d5a',
          900: '#25424d',
          950: '#142a33',
        },
        primary: {
          50: '#f0f9fa',
          100: '#d9f0f3',
          200: '#b8e3e9',
          300: '#87cdd7',
          400: '#4fa9b8',
          500: '#3a8a9c',
          600: '#2f7184',
          700: '#2a5d6c',
          800: '#284d5a',
          900: '#25424d',
          950: '#142a33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Impact', 'Oswald', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
        '9xl': ['8rem', { lineHeight: '1', letterSpacing: '-0.02em' }],
      },
    },
  },
  plugins: [],
};
