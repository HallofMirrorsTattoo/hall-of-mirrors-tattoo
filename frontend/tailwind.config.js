/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#0E0C09',
          charcoal: '#171410',
          surface: '#1D1A15',
          light: '#F2EDE0',
          cream: '#EDE7D5',
        },
        accent: {
          gold: '#C9A84C',
          'gold-bright': '#E0C876',
          'gold-muted': '#7D6530',
          'gold-faint': 'rgba(201,168,76,0.12)',
        },
        stone: {
          light: '#EDE8D8',
          mid: '#9A9082',
          dark: '#635C52',
          border: '#2A2520',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      fontSize: {
        'display-2xl': ['6rem',   { lineHeight: '1.0', letterSpacing: '-0.02em', fontWeight: '400' }],
        'display-xl':  ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '400' }],
        'display-lg':  ['3.5rem', { lineHeight: '1.1',  letterSpacing: '-0.015em', fontWeight: '400' }],
        'display-md':  ['2.75rem',{ lineHeight: '1.15', letterSpacing: '-0.01em',  fontWeight: '400' }],
        'display-sm':  ['2rem',   { lineHeight: '1.2',  letterSpacing: '-0.005em', fontWeight: '400' }],
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      animation: {
        'ken-burns':    'kenBurns 8s ease-out forwards',
        'fade-up':      'fadeUp 0.9s cubic-bezier(0.32,0.72,0,1) forwards',
        'fade-in':      'fadeIn 0.8s ease-out forwards',
        'float':        'float 7s ease-in-out infinite',
        'pulse-glow':   'pulseGlow 4s ease-in-out infinite',
        'shimmer':      'shimmer 2.5s ease-in-out infinite',
        'line-in':      'lineIn 1.2s cubic-bezier(0.32,0.72,0,1) forwards',
        'reveal-mask':  'revealMask 1s cubic-bezier(0.77,0,0.175,1) forwards',
        'draw-line':    'drawLine 1s cubic-bezier(0.32,0.72,0,1) forwards',
        'slide-up':     'slideUp 0.9s cubic-bezier(0.32,0.72,0,1) forwards',
        'tab-fade-in':  'tabFadeIn 0.18s cubic-bezier(0.22,1,0.36,1) both',
      },
      keyframes: {
        kenBurns: {
          '0%':   { transform: 'scale(1.0) translateZ(0)' },
          '100%': { transform: 'scale(1.12) translateZ(0)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%':      { opacity: '0.9', transform: 'scale(1.08)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        lineIn: {
          '0%':   { transform: 'scaleX(0)', opacity: '0' },
          '100%': { transform: 'scaleX(1)', opacity: '1' },
        },
        revealMask: {
          '0%':   { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0% 0 0)' },
        },
        drawLine: {
          '0%':   { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        tabFadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(7px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'inner-gold':  'inset 0 1px 1px rgba(201,168,76,0.12)',
        'gold-sm':     '0 0 20px rgba(201,168,76,0.15)',
        'gold-md':     '0 0 40px rgba(201,168,76,0.2)',
        'gold-lg':     '0 0 80px rgba(201,168,76,0.25)',
        'depth':       '0 8px 32px rgba(0,0,0,0.6)',
        'depth-lg':    '0 20px 60px rgba(0,0,0,0.7)',
        'glass':       'inset 0 1px 0 rgba(255,255,255,0.08), 0 1px 3px rgba(0,0,0,0.3)',
      },
      transitionTimingFunction: {
        'expo':  'cubic-bezier(0.19,1,0.22,1)',
        'spring': 'cubic-bezier(0.32,0.72,0,1)',
      },
      zIndex: {
        '-10': '-10',
        '60': '60',
        '70': '70',
      },
    },
  },
  plugins: [],
};
