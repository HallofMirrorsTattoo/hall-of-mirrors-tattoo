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
          dark: '#1a1a2e',
          darker: '#0f0f1e',
        },
        accent: {
          gold: '#d4af37',
          teal: '#2a9d8f',
          plum: '#7b2cbf',
          rust: '#cc5500',
        },
        neutral: {
          light: '#f5f1e8',
        },
      },
      fontFamily: {
        serif: ['Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
