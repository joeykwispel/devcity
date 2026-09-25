'use client'

import { useTranslations } from 'next-intl'
import { LayerIntro, Stat } from '@/components/layer-ui'
import { useCityStore } from '@/lib/city-store'
import { hueCss } from '@/lib/colors'
import { useFormatters } from '@/lib/locale'
import { useTheme } from '@/lib/theme'
import { kindHue, kindOrder, type CareerCity } from './career-city'

export function CareerIntro({ city }: { city: CareerCity }) {
  const t = useTranslations('career')
  const format = useFormatters()
  const theme = useTheme()
  const focused = useCityStore((s) => s.focused)
  const focus = useCityStore((s) => s.focus)
  const present = new Set(city.layout.buildings.map((b) => b.kind))

  return (
    <LayerIntro num="02" slug="career" title={t('title')} intro={t('intro')}>
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label={t('stats.career')}>
          <span className="font-bold text-accent-text">{format.duration(city.careerMonths)}</span>
        </Stat>
        <Stat label={t('stats.companies')}>
          <span className="font-bold text-accent-text">{city.companies}</span>
        </Stat>
      </dl>
      <ul
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0"
        aria-label={t('legend')}
      >
        {kindOrder
          .filter((k) => present.has(k))
          .map((kind) => (
            <li key={kind}>
              <button
                type="button"
                className="chip h-8 whitespace-nowrap"
                aria-pressed={focused === kind}
                onClick={() => focus(kind)}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: hueCss(kindHue[kind], theme) }}
                  aria-hidden="true"
                />
                {t(`kinds.${kind}`)}
              </button>
            </li>
          ))}
      </ul>
    </LayerIntro>
  )
}
