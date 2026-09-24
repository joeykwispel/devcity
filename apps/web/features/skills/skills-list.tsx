'use client'

import { useTranslations } from 'next-intl'
import { useFormatters, useLocalized } from '@/lib/locale'
import type { SkillsCity } from './skills-city'

/** Screen-reader equivalent of the 3D city. */
export function SkillsList({ city }: { city: SkillsCity }) {
  const t = useTranslations()
  const l = useLocalized()
  const format = useFormatters()
  return (
    <div className="sr-only">
      {[...city.categories.values()].map((category) => (
        <section key={category.id}>
          <h2>{l(category.label)}</h2>
          <ul>
            {city.layout.buildings
              .filter((b) => b.district === category.id)
              .map((b) => {
                const skill = city.skills.get(b.id)
                const name = skill?.label ? l(skill.label) : b.id
                return (
                  <li key={b.id}>
                    {name}:{' '}
                    {b.months > 0
                      ? t('common.yearsLong', {
                          years: format.years(b.months),
                          count: b.months / 12,
                        })
                      : t('skills.listedLong')}
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
