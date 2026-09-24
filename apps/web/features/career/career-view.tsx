'use client'

import type { MonthIndex } from '@devcity/city-layout'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { LayerShell } from '@/components/layer-ui'
import { CityView } from '@/components/scene/city-view'
import { useLayerState } from '@/lib/city-store'
import { buildingCss, hueCss } from '@/lib/colors'
import { cv } from '@/lib/cv'
import { useFormatters, useLocalized } from '@/lib/locale'
import { useCurrentMonth } from '@/lib/now'
import { useTheme } from '@/lib/theme'
import { buildCareerCity, kindHue } from './career-city'
import { CareerIntro } from './career-intro'
import { CareerList } from './career-list'
import { CareerPanel } from './career-panel'

export function CareerView({ buildMonth }: { buildMonth: MonthIndex }) {
  useLayerState()
  const t = useTranslations()
  const l = useLocalized()
  const format = useFormatters()
  const theme = useTheme()
  const now = useCurrentMonth(buildMonth)
  const city = useMemo(() => buildCareerCity(cv, now), [now])

  const districts = useMemo(
    () =>
      city.layout.districts.map((d) => ({
        ...d,
        color: hueCss(d.id === 'work' ? kindHue.work : kindHue.education, theme),
        label: t(`career.sides.${d.id}`),
      })),
    [city, theme, t],
  )

  const buildings = useMemo(
    () =>
      city.layout.buildings.map((b) => ({
        ...b,
        group: b.kind,
        color: buildingCss(kindHue[b.kind], theme, b.kind === 'other'),
      })),
    [city, theme],
  )

  const markers = useMemo(
    () =>
      city.layout.years.map((y) => ({
        id: String(y.year),
        position: [y.x, 0.1, 0] as [number, number, number],
        label: String(y.year),
      })),
    [city],
  )

  const tooltip = (id: string) => {
    const building = city.layout.buildings.find((b) => b.id === id)
    const role = city.roles.get(id)
    const education = city.education.get(id)
    if (!building) return null
    if (role)
      return { title: role.company, detail: format.duration(building.end - building.start + 1) }
    if (education) return { title: l(education.title), detail: String(education.endYear) }
    return null
  }

  return (
    <LayerShell
      scene={
        <CityView
          size={Math.max(city.layout.width, city.layout.depth)}
          districts={districts}
          buildings={buildings}
          tooltip={tooltip}
          markers={markers}
          // Look at the boulevard from the education side, slightly from the right.
          cameraFrom={[25, 95, 150]}
        />
      }
      intro={<CareerIntro city={city} />}
      panel={<CareerPanel city={city} />}
      hint={t('common.hint')}
    >
      <CareerList city={city} />
    </LayerShell>
  )
}
