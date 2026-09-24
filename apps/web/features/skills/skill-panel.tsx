'use client'

import { useTranslations } from 'next-intl'
import { DetailPanel, PanelHeading, Stat } from '@/components/layer-ui'
import { useFormatters, useLocalized } from '@/lib/locale'
import { hueCss } from '@/lib/colors'
import { useTheme } from '@/lib/theme'
import type { SkillsCity } from './skills-city'
import { useCityStore } from '@/lib/city-store'

export function SkillPanel({ city }: { city: SkillsCity }) {
  const t = useTranslations()
  const l = useLocalized()
  const format = useFormatters()
  const theme = useTheme()
  const selected = useCityStore((s) => s.selected)
  const select = useCityStore((s) => s.select)

  const skill = selected ? city.skills.get(selected) : undefined
  const stat = selected ? city.stats.get(selected) : undefined
  if (!skill || !stat) return null

  const category = city.categories.get(skill.category)
  const name = skill.label ? l(skill.label) : skill.id
  const roles = stat.roleIds.map((id) => city.roles.get(id)).filter((r) => r !== undefined)

  return (
    <DetailPanel
      path={`skills/${skill.id.toLowerCase()}`}
      title={name}
      label={t('skills.details', { name })}
      onClose={() => select(null)}
    >
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label={t('skills.experience')}>
          <span className="text-xl font-bold text-accent-text">
            {stat.months > 0
              ? t('common.years', { years: format.years(stat.months), count: stat.months / 12 })
              : t('skills.listed')}
          </span>
        </Stat>
        <Stat label={t('skills.district')}>
          <span style={{ color: hueCss(category?.hue ?? 0, theme) }}>
            {category ? l(category.label) : skill.category}
          </span>
        </Stat>
      </dl>

      {roles.length > 0 ? (
        <div className="grid gap-1.5">
          <PanelHeading>{t('skills.usedAt')}</PanelHeading>
          <ul className="grid gap-1 text-sm">
            {roles.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate">{r.company}</span>
                <span className="shrink-0 font-mono text-[0.72rem] text-muted">
                  {format.month(r.start)} &ndash; {r.end ? format.month(r.end) : t('common.now')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted">{t('skills.notTied')}</p>
      )}
    </DetailPanel>
  )
}
