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

/** #rrggbb or hsl(h, s%, l%) to [h 0-360, s 0-1, l 0-1]. */
function toHsl(color: string): [number, number, number] {
  const hsl = /^hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)$/.exec(color)
  if (hsl) return [Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100]
  const n = Number.parseInt(color.replace('#', ''), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [
    number,
    number,
    number,
  ]
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h =
    max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Brings an arbitrary colour (e.g. GitHub's language colours) into the portfolio's softer palette:
 * the hue is kept, saturation is capped and lightness pulled into the theme's range.
 */
export function tone(color: string, theme: Theme, muted = false): string {
  const [h, s, l] = toHsl(color)
  if (muted) return buildingCss(h, theme, true)
  const saturation = clamp(s, 0.15, theme === 'dark' ? 0.42 : 0.5)
  const lightness = theme === 'dark' ? clamp(l, 0.56, 0.7) : clamp(l, 0.44, 0.58)
  return `hsl(${Math.round(h)}, ${Math.round(saturation * 100)}%, ${Math.round(lightness * 100)}%)`
}
