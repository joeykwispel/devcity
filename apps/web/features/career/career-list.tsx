'use client'

import { useTranslations } from 'next-intl'
import { useFormatters, useLocalized } from '@/lib/locale'
import type { CareerCity } from './career-city'

/** Screen-reader equivalent of the career boulevard, newest first. */
export function CareerList({ city }: { city: CareerCity }) {
  const t = useTranslations()
  const l = useLocalized()
  const format = useFormatters()
  const roles = [...city.roles.values()].sort((a, b) => b.start.localeCompare(a.start))
  const education = [...city.education.values()].sort((a, b) => b.endYear - a.endYear)

  return (
    <div className="sr-only">
      <section>
        <h2>{t('career.sides.work')}</h2>
        <ul>
          {roles.map((r) => (
            <li key={r.id}>
              {l(r.title)}, {r.company}: {format.month(r.start)} –{' '}
              {r.end ? format.month(r.end) : t('common.now')}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>{t('career.sides.education')}</h2>
        <ul>
          {education.map((e) => (
            <li key={e.id}>
              {l(e.title)}
              {e.institution && `, ${e.institution}`}: {e.startYear}
              {e.endYear !== e.startYear && ` – ${e.endYear}`}
              {e.courses && ` (${e.courses.join(', ')})`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
