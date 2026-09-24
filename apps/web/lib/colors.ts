import type { Theme } from './theme'

// Comma syntax throughout: three.js cannot parse the space-separated hsl() form.

/** Accent colour for a hue, matching the category chip colours on joeyoosenbrug.nl. */
export const hueCss = (hue: number, theme: Theme) =>
  theme === 'dark' ? `hsl(${hue}, 60%, 68%)` : `hsl(${hue}, 55%, 38%)`

/** Building body colour. Muted buildings (no experience, archived repo...) are desaturated. */
export const buildingCss = (hue: number, theme: Theme, muted = false) => {
  const saturation = muted ? 10 : theme === 'dark' ? 42 : 50
  const lightness = theme === 'dark' ? (muted ? 40 : 64) : muted ? 74 : 56
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}
