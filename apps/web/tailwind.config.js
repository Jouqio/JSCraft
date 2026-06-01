/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f', 950: '#451a03',
        },
        accent: { 300: '#67e8f9', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2', 700: '#0e7490' },
        slate:  { 850: '#172033', 925: '#0d1526', 950: '#0a0f1e' },
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: { '2xs': ['0.625rem', { lineHeight: '0.875rem' }] },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out both',
        'fade-in-up':    'fadeInUp 0.5s ease-out both',
        'slide-in-right':'slideInRight 0.35s ease-out both',
        'xp-pop':        'xpPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'shimmer':       'shimmer 1.8s infinite linear',
        'pulse-soft':    'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp:     { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        xpPop:        { from: { opacity: '0', transform: 'scale(0.5)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:      { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
        pulseSoft:    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)',
        'card-md':    '0 4px 12px -2px rgba(0,0,0,0.08)',
        'card-lg':    '0 10px 30px -6px rgba(0,0,0,0.12)',
        'brand':      '0 4px 14px 0 rgba(245,158,11,0.28)',
        'brand-lg':   '0 8px 30px 0 rgba(245,158,11,0.38)',
        'inner-md':   'inset 0 2px 4px rgba(0,0,0,0.08)',
      },
      backgroundImage: {
        'hero-grid':       'radial-gradient(circle, rgba(245,158,11,0.1) 1px, transparent 1px)',
        'code-surface':    'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'brand-gradient':  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      },
    },
  },
  plugins: [],
};
