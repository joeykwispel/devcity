'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { LayerIntro, Stat } from '@/components/layer-ui'
import { useCityStore } from '@/lib/city-store'
import { tone } from '@/lib/colors'
import { languageColor } from '@/lib/language-colors'
import { useTheme } from '@/lib/theme'
import type { ReposCity } from './repos-city'
import { reposData } from './repos-city'

export function ReposIntro({ city }: { city: ReposCity }) {
  const t = useTranslations('repos')
  const format = useFormatter()
  const theme = useTheme()
  const focused = useCityStore((s) => s.focused)
  const focus = useCityStore((s) => s.focus)

  const own = [...city.repos.values()].filter((r) => !r.fork)
  const bytes = new Map<string, number>()
  for (const r of own)
    for (const [lang, b] of Object.entries(r.languages)) bytes.set(lang, (bytes.get(lang) ?? 0) + b)
  const languages = [...bytes.entries()].sort((a, b) => b[1] - a[1])
  const prCount = [...city.contributions.values()].reduce((n, c) => n + c.pullRequests.length, 0)

  return (
    <LayerIntro num="03" slug="repos" title={t('title')} intro={t('intro')}>
      <dl className="grid grid-cols-4 gap-2 font-mono text-sm">
        <Stat label={t('stats.repos')}>
          <span className="font-bold text-accent-text">{city.repos.size}</span>
        </Stat>
        <Stat label={t('stats.commits')}>
          <span className="font-bold text-accent-text">
            {format.number(own.reduce((n, r) => n + r.commits, 0))}
          </span>
        </Stat>
        <Stat label={t('stats.languages')}>
          <span className="font-bold text-accent-text">{languages.length}</span>
        </Stat>
        <Stat label="PRs">
          <span className="font-bold text-accent-text" title={t('stats.pullRequests')}>
            {prCount}
          </span>
        </Stat>
      </dl>
      <ul
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0"
        aria-label={t('languagesHeading')}
      >
        {languages.slice(0, 8).map(([lang]) => (
          <li key={lang}>
            <span className="chip h-8 whitespace-nowrap">
              <span
                className="size-2.5 rounded-full"
                style={{ background: tone(languageColor(lang), theme) }}
                aria-hidden="true"
              />
              {lang}
            </span>
          </li>
        ))}
      </ul>
      <ul className="flex flex-wrap gap-1.5" aria-label={t('stats.repos')}>
        {city.layout.districts.map((d) => (
          <li key={d.id}>
            <button
              type="button"
              className="chip h-8 whitespace-nowrap"
              aria-pressed={focused === d.id}
              onClick={() => focus(d.id)}
            >
              {d.id === 'contributions' ? t('contributions') : d.id}
            </button>
          </li>
        ))}
      </ul>
      <p className="font-mono text-[0.7rem] text-muted">
        {t('generated', {
          date: format.dateTime(new Date(reposData.generatedAt), { dateStyle: 'medium' }),
        })}
      </p>
    </LayerIntro>
  )
}
