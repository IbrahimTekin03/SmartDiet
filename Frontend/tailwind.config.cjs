/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["class", '[data-theme="green"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        dark: {
          bg: '#040711',
          surface: '#080d1a',
          card: 'rgba(12, 19, 36, 0.75)',
          cardSolid: '#0c1324',
          border: 'rgba(16, 185, 129, 0.15)',
          borderSubtle: 'rgba(255, 255, 255, 0.08)',
        }
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-md': '0 0 30px rgba(16, 185, 129, 0.25)',
        'glow-lg': '0 0 50px rgba(16, 185, 129, 0.35)',
        'glow-cyan': '0 0 30px rgba(6, 182, 212, 0.25)',
        'glass': '0 20px 50px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
};

