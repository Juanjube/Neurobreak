import forms from '@tailwindcss/forms';
import containerQueries from '@tailwindcss/container-queries';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-accent)',
        content: 'var(--color-text-main)',
        muted: 'var(--color-text-sec)',
        border: 'var(--color-border)',
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'background-light': 'var(--color-bg)',
        'background-dark': 'var(--color-bg)',
        'card-dark': 'var(--color-surface)',
        'accent-cyan': '#00f2ff',
        'accent-teal': '#2dd4bf',
      },
      fontFamily: {
        display: ['"Lexend Variable"', 'Lexend', 'sans-serif'],
        sans: ['"Noto Sans Variable"', '"Noto Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [forms, containerQueries],
};
