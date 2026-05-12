import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        clay: {
          50:  '#FDFAF7',
          100: '#F7F3EE',
          200: '#EDE8E0',
          300: '#DDD5CB',
          400: '#C8BDB2',
          500: '#A8998E',
          600: '#8A7B6F',
          700: '#6B5E53',
          800: '#4A3F37',
          900: '#2A2018',
        },
        terracotta: {
          50:  '#FCF3EF',
          100: '#F8E5DA',
          200: '#F0C9B5',
          300: '#E5A888',
          400: '#D98460',
          500: '#CF6B4A',
          600: '#B85A3A',
          700: '#9A4A2D',
          800: '#7A3922',
          900: '#5A2A18',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
          '"Helvetica Neue"', 'Arial', '"Noto Sans SC"', 'sans-serif',
        ],
        mono: [
          '"SF Mono"', '"Cascadia Code"', '"Fira Code"',
          'Menlo', 'Monaco', 'Consolas', 'monospace',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
