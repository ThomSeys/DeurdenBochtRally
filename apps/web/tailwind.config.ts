import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9fa',
          100: '#d9f0f3',
          200: '#b7e3e9',
          300: '#88cfd9',
          400: '#52b2c2',
          500: '#3798a8',
          600: '#2f7184',
          700: '#2d6376',
          800: '#2d5161',
          900: '#294552',
          950: '#172c36',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
