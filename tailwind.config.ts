import type { Config } from 'tailwindcss';

/**
 * Brote design tokens (BUILD_SPEC §2).
 * Colors are wired to CSS variables defined in app/globals.css so that the
 * light/dark themes can swap values without touching component classes.
 * Domain accent colors are fixed hex (they are identity, not theme-dependent).
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './stores/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core brand (fixed identity colors)
        brote: {
          green: '#1FB57A',
          'green-deep': '#0E7A52',
          ink: '#0C1A13',
          'ink-soft': '#16261D',
          cream: '#F7F5EF',
          'cream-soft': '#FFFFFF',
          sun: '#FFB23E',
          coral: '#FF6B5E',
        },
        // Theme-aware semantic tokens (driven by CSS vars)
        background: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        foreground: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--muted-fg) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-fg) / <alpha-value>)',
        },
        // Domain accents (BUILD_SPEC §2.3 / §3.4) — identity colors
        domain: {
          residuos: '#C2703D',
          agua: '#2DB4D4',
          energia: '#F4A62A',
          movilidad: '#5B6CF0',
          plantas: '#3CB371',
          animales: '#E8638C',
          alimentacion: '#9CC93B',
          consumo: '#B07CD6',
          digital: '#3DC1C1',
          comunidad: '#FF8A3D',
          agua_azul: '#1E88A8',
          aire_suelo: '#A38B6D',
          ciencia: '#6FBF73',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Bricolage Grotesque', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-l': ['2rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        h1: ['1.6rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h2: ['1.3rem', { lineHeight: '1.2' }],
        h3: ['1.1rem', { lineHeight: '1.3' }],
        body: ['1rem', { lineHeight: '1.5' }],
        small: ['0.875rem', { lineHeight: '1.45' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        card: '20px',
        button: '14px',
        sheet: '24px',
        pill: '999px',
      },
      spacing: {
        '4.5': '1.125rem',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgb(15 60 40 / 0.10), 0 6px 24px -8px rgb(15 60 40 / 0.12)',
        'soft-lg': '0 8px 32px -8px rgb(15 60 40 / 0.18)',
        glow: '0 0 0 1px rgb(31 181 122 / 0.25), 0 0 24px -4px rgb(31 181 122 / 0.35)',
        'sun-glow': '0 0 24px -4px rgb(255 178 62 / 0.5)',
      },
      keyframes: {
        'count-pop': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'leaf-burst': {
          '0%': { transform: 'translateY(0) scale(0.4) rotate(0deg)', opacity: '0' },
          '30%': { opacity: '1' },
          '100%': { transform: 'translateY(-48px) scale(1) rotate(40deg)', opacity: '0' },
        },
        'flame-flicker': {
          '0%, 100%': { transform: 'scaleY(1) translateY(0)' },
          '50%': { transform: 'scaleY(1.08) translateY(-1px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pip-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        'count-pop': 'count-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        'leaf-burst': 'leaf-burst 0.9s ease-out forwards',
        'flame-flicker': 'flame-flicker 1.6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'pip-bob': 'pip-bob 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
