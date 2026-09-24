'use client'

import { useTranslations } from 'next-intl'
import { LayerIntro } from '@/components/layer-ui'
import { cv } from '@/lib/cv'
import { useLocalized } from '@/lib/locale'
import { hueCss } from '@/lib/colors'
import { useTheme } from '@/lib/theme'
import { useCityStore } from '@/lib/city-store'

const counts = new Map<string, number>()
for (const s of cv.skills) counts.set(s.category, (counts.get(s.category) ?? 0) + 1)

export function SkillsLegend() {
  const t = useTranslations('skills')
  const l = useLocalized()
  const theme = useTheme()
  const focused = useCityStore((s) => s.focused)
  const focus = useCityStore((s) => s.focus)

  return (
    <LayerIntro num="01" slug="skills" title={t('title')} intro={t('intro')}>
      <ul
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0"
        aria-label={t('districts')}
      >
        {cv.categories.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="chip h-8 whitespace-nowrap"
              aria-pressed={focused === c.id}
              onClick={() => focus(c.id)}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: hueCss(c.hue, theme) }}
                aria-hidden="true"
              />
              {l(c.label)}
              <span>{counts.get(c.id) ?? 0}</span>
            </button>
          </li>
        ))}
      </ul>
    </LayerIntro>
  )
}
