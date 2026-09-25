import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { pageLocale } from '@/i18n/page-locale'
import { routing } from '@/i18n/routing'
import { cv } from '@/lib/cv'
import { env } from '@/lib/env'
import { tokens } from '@/lib/tokens'

// The link preview for chat apps and social sites, rendered once per locale at build time.
// A route handler rather than opengraph-image.tsx: the static export then writes a real .png,
// which static hosts serve as image/png (crawlers reject extensionless octet-streams).
export const dynamic = 'force-static'

const size = { width: 1200, height: 630 }

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Dark theme tokens; satori cannot read CSS variables.
const c = tokens.dark

// A small skyline: [height, colour] per tower, left to right.
const towers: [number, string][] = [
  [120, c.accent2],
  [210, c.accent],
  [160, c.accent2],
  [300, c.accent],
  [190, c.accent2],
  [250, c.accent],
  [140, c.accent2],
  [330, c.accent],
]

export async function GET(_request: Request, { params }: RouteContext<'/[locale]/og.png'>) {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: 'meta' })
  const host = new URL(env.NEXT_PUBLIC_SITE_URL).host

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: `radial-gradient(circle at 80% 100%, ${c.bg2} 0%, ${c.bg} 60%)`,
        color: c.text,
        padding: 72,
      }}
    >
      {/* Skyline, bottom right, fading into the background. */}
      <div
        style={{
          position: 'absolute',
          right: 64,
          bottom: 0,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        {towers.map(([h, color], i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: h,
              borderRadius: '6px 6px 0 0',
              border: `2px solid ${color}`,
              borderBottom: 'none',
              background: `linear-gradient(180deg, ${color}55 0%, ${color}08 100%)`,
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', width: 640 }}>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            padding: '8px 16px',
            borderRadius: 12,
            border: `1px solid ${c.border}`,
            background: c.surface,
            fontSize: 30,
            fontWeight: 800,
          }}
        >
          <span style={{ color: c.accent }}>&lt;</span>JO
          <span style={{ color: c.accent }}>/&gt;</span>
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 56,
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: -3,
          }}
        >
          DevCity
        </div>
        <div style={{ display: 'flex', marginTop: 8, fontSize: 36, color: c.accent }}>
          {cv.profile.title[locale]}
        </div>
        <div
          style={{ display: 'flex', marginTop: 24, fontSize: 26, lineHeight: 1.4, color: c.muted }}
        >
          {t('description')}
        </div>

        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 24, color: c.muted }}>
          {host}
        </div>
      </div>
    </div>,
    size,
  )
}
