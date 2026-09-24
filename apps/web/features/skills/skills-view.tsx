'use client'

import type { MonthIndex } from '@devcity/city-layout'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { CityList, type ListGroup } from '@/components/city-list'
import { LayerShell } from '@/components/layer-ui'
import { CityView } from '@/components/scene/city-view'
import { useLayerState } from '@/lib/city-store'
import { buildingCss, hueCss } from '@/lib/colors'
import { cv } from '@/lib/cv'
import { useFormatters, useLocalized } from '@/lib/locale'
import { useCurrentMonth } from '@/lib/now'
import { useTheme } from '@/lib/theme'
import { SkillPanel } from './skill-panel'
import { buildSkillsCity } from './skills-city'
import { SkillsLegend } from './skills-legend'

export function SkillsView({ buildMonth }: { buildMonth: MonthIndex }) {
  useLayerState()
  const t = useTranslations()
  const l = useLocalized()
  const format = useFormatters()
  const theme = useTheme()
  const now = useCurrentMonth(buildMonth)
  const city = useMemo(() => buildSkillsCity(cv, now), [now])

  const districts = useMemo(
    () =>
      city.layout.districts.map((d) => {
        const category = city.categories.get(d.id)
        return {
          ...d,
          color: hueCss(category?.hue ?? 0, theme),
          label: category ? l(category.label) : d.id,
        }
      }),
    [city, theme, l],
  )

  const buildings = useMemo(
    () =>
      city.layout.buildings.map((b) => ({
        ...b,
        group: b.district,
        color: buildingCss(city.categories.get(b.district)?.hue ?? 0, theme, b.months === 0),
      })),
    [city, theme],
  )

  const groups = useMemo<ListGroup[]>(
    () =>
      city.layout.districts.map((d) => {
        const category = city.categories.get(d.id)
        return {
          id: d.id,
          label: category ? l(category.label) : d.id,
          color: hueCss(category?.hue ?? 0, theme),
          items: city.layout.buildings
            .filter((b) => b.district === d.id)
            .map((b) => {
              const skill = city.skills.get(b.id)
              return {
                id: b.id,
                name: skill?.label ? l(skill.label) : b.id,
                value:
                  b.months > 0
                    ? t('common.years', { years: format.years(b.months), count: b.months / 12 })
                    : t('skills.listed'),
                magnitude: b.months,
              }
            }),
        }
      }),
    [city, theme, l, t, format],
  )

  const tooltip = (id: string) => {
    const skill = city.skills.get(id)
    const stat = city.stats.get(id)
    if (!skill || !stat) return null
    return {
      title: skill.label ? l(skill.label) : skill.id,
      detail:
        stat.months > 0
          ? t('common.yearsShort', { years: format.years(stat.months) })
          : t('skills.listed'),
    }
  }

  return (
    <LayerShell
      scene={
        <CityView
          size={city.layout.width}
          districts={districts}
          buildings={buildings}
          tooltip={tooltip}
        />
      }
      intro={<SkillsLegend />}
      panel={<SkillPanel city={city} />}
      hint={t('common.hint')}
      list={(interactive) => <CityList groups={groups} interactive={interactive} />}
    />
  )
}
