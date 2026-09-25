/**
 * The kit's colour tokens (components/jo/jo-kit.css) as plain values, for the places that cannot
 * read CSS variables: three.js, the OG image (satori) and <meta name="theme-color">. Everything
 * rendered as HTML uses the CSS variables instead. Keep in sync with jo-kit.css.
 */
export const tokens = {
  dark: {
    bg: '#0a0e17',
    bg2: '#111726',
    surface: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.09)',
    text: '#e6e9f2',
    muted: '#98a3b9',
    accent: '#7dd3c0',
    accent2: '#b49cff',
  },
  light: {
    bg: '#f4f6fb',
    bg2: '#e9edf6',
    surface: 'rgba(255, 255, 255, 0.72)',
    border: 'rgba(20, 30, 60, 0.12)',
    text: '#141b2d',
    muted: '#4b566d',
    accent: '#0f766e',
    accent2: '#6d4fd6',
  },
} as const
