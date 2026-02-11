import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef8ec',
          100: '#fdecc9',
          200: '#fbd78e',
          300: '#f9bd53',
          400: '#f7a72b',
          500: '#f2930d',
          600: '#d67308',
          700: '#c27407',
          800: '#8e530c',
          900: '#74440d',
          950: '#432302',
        },
        secondary: {
          50: '#eef8ff',
          100: '#d9eeff',
          200: '#bce2ff',
          300: '#8ed0ff',
          400: '#59b4ff',
          500: '#0d94f2',
          600: '#0a75c2',
          700: '#085d9e',
          800: '#0c5082',
          900: '#10446c',
          950: '#0b2a47',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        background: {
          light: '#f8f7f5',
          dark: '#221b10',
        },
        card: {
          light: '#ffffff',
          dark: '#2d2418',
        },
        surface: {
          light: '#f0ede8',
          dark: '#3a3028',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
    },
  },
  plugins: [],
};

export default config;
