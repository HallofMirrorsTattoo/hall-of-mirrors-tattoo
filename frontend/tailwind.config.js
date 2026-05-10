/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#2a2a2a',
          darker: '#1a1a1a',
          light: '#fdfbf7',
          cream: '#f5f1e8',
        },
        accent: {
          gold: '#d4af37',
          teal: '#2a9d8f',
          plum: '#7b2cbf',
          rust: '#cc5500',
        },
        neutral: {
          light: '#fdfbf7',
          cream: '#f5f1e8',
          ivory: '#f9f7f4',
        },
      },
      fontFamily: {
        serif: ['Lora', 'Playfair Display', 'serif'],
        sans: ['Geist', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'serif'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-lg': ['3.75rem', { lineHeight: '1.15', fontWeight: '700' }],
        'display-md': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0) blur(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      boxShadow: {
        'inner-light': 'inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        'inner-dark': 'inset 0 1px 2px rgba(26, 26, 46, 0.05)',
        'soft': '0 4px 12px rgba(26, 26, 46, 0.08)',
        'soft-lg': '0 8px 24px rgba(26, 26, 46, 0.12)',
        'luxury': '0 20px 40px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        '28': '7rem',
        '32': '8rem',
      },
      zIndex: {
        '-10': '-10',
      },
    },
  },
  plugins: [],
};
