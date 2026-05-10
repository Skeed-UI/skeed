import type { Config } from 'tailwindcss';

const config: Config = {
  content: {
    relative: true,
    files: [
      './app/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './lib/**/*.{ts,tsx}',
      '../../packages/ui/src/**/*.{ts,tsx}',
    ],
  },
  darkMode: ['class', '[data-skeed-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        skeed: {
          brand: 'var(--skeed-brand)',
          accent: 'var(--skeed-accent)',
          bg: 'var(--skeed-bg)',
          surface: 'var(--skeed-surface)',
          'surface-muted': 'var(--skeed-surface-muted)',
          fg: 'var(--skeed-fg)',
          muted: 'var(--skeed-muted)',
          border: 'var(--skeed-border)',
          success: 'var(--skeed-success)',
          warning: 'var(--skeed-warning)',
          danger: 'var(--skeed-danger)',
        },
        'skeed-color': {
          brand: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            500: 'var(--skeed-brand)',
            600: '#2563eb',
            700: '#1d4ed8',
            900: '#1e3a8a',
          },
          success: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
          },
          warning: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            500: '#f59e0b',
            800: '#92400e',
            900: '#78350f',
          },
          danger: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            900: '#881337',
          },
          info: {
            50: '#f0f9ff',
            100: '#e0f2fe',
            200: '#bae6fd',
            500: '#0ea5e9',
            700: '#0369a1',
          },
          neutral: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            900: '#0f172a',
            950: '#020617',
          },
        },
      },
      borderRadius: {
        skeed: 'var(--skeed-radius)',
        'skeed-radius-sm': '0.375rem',
        'skeed-radius-md': '0.625rem',
        'skeed-radius-lg': '1rem',
      },
      boxShadow: {
        'skeed-shadow-md': '0 8px 24px rgba(15, 23, 42, .08)',
      },
      transitionDuration: {
        'skeed-base': '180ms',
      },
      transitionTimingFunction: {
        skeed: 'cubic-bezier(.2,.8,.2,1)',
      },
      animation: {
        'skeed-soft-pulse': 'skeedSoftPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        skeedSoftPulse: {
          '0%, 100%': { opacity: '0.62' },
          '50%': { opacity: '1' },
        },
      },
      fontFamily: {
        'skeed-body': 'var(--skeed-font-body-family)',
        'skeed-display': 'var(--skeed-font-display-family)',
      },
      maxWidth: {
        docs: '1180px',
      },
    },
  },
};

export default config;
