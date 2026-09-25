'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { CityList, type ListGroup } from '@/components/city-list'
import { LayerShell } from '@/components/layer-ui'
import { CityView } from '@/components/scene/city-view'
import { useLayerState } from '@/lib/city-store'
import { hueCss, tone } from '@/lib/colors'
import { languageColor } from '@/lib/language-colors'
import { useToday } from '@/lib/now'
import { useTheme } from '@/lib/theme'
import { buildReposCity, CONTRIBUTIONS_DISTRICT, reposData } from './repos-city'
import { ReposIntro } from './repos-intro'
import { ReposPanel } from './repos-panel'

export function ReposView({ buildDay }: { buildDay: number }) {
  useLayerState()
  const t = useTranslations()
  const format = useFormatter()
  const theme = useTheme()
  const now = useToday(buildDay)
  const city = useMemo(() => buildReposCity(reposData, now), [now])

  const districts = useMemo(
    () =>
      city.layout.districts.map((d) => ({
        ...d,
        color: hueCss(d.id === CONTRIBUTIONS_DISTRICT ? 262 : 168, theme),
        label: d.id === CONTRIBUTIONS_DISTRICT ? t('repos.contributions') : d.id,
      })),
    [city, theme, t],
  )

  const buildings = useMemo(
    () =>
      city.layout.buildings.map((b) => {
        const meta = city.layout.meta.get(b.id)
        const repo = meta ? city.repos.get(meta.district) : undefined
        return {
          ...b,
          group: b.district,
          color: tone(languageColor(meta?.language ?? 'Other'), theme, repo?.fork),
          smog: repo?.archived ? 1 : meta?.staleness,
        }
      }),
    [city, theme],
  )

  const groups = useMemo<ListGroup[]>(
    () =>
      city.layout.districts.map((d) => ({
        id: d.id,
        label: d.id === CONTRIBUTIONS_DISTRICT ? t('repos.contributions') : d.id,
        color: hueCss(d.id === CONTRIBUTIONS_DISTRICT ? 262 : 168, theme),
        items: city.layout.buildings
          .filter((b) => b.district === d.id)
          .map((b) => {
            const contribution = city.contributions.get(b.id)
            const meta = city.layout.meta.get(b.id)
            return contribution
              ? {
                  id: b.id,
                  name: contribution.fullName,
                  value: `${contribution.pullRequests.length} PR`,
                  magnitude: contribution.pullRequests.length,
                }
              : {
                  id: b.id,
                  name: meta?.language ?? b.id,
                  value: format.number(meta?.share ?? 0, {
                    style: 'percent',
                    maximumFractionDigits: 1,
                  }),
                  magnitude: meta?.share,
                }
          }),
      })),
    [city, theme, t, format],
  )

  const tooltip = (id: string) => {
    const contribution = city.contributions.get(id)
    if (contribution)
      return {
        title: contribution.fullName,
        detail: `${contribution.pullRequests.length} PR`,
      }
    const meta = city.layout.meta.get(id)
    if (!meta) return null
    return {
      title: `${meta.district} · ${meta.language}`,
      detail: format.number(meta.share, { style: 'percent', maximumFractionDigits: 0 }),
    }
  }

  return (
    <LayerShell
      scene={
        city.layout.buildings.length > 0 ? (
          <CityView
            size={city.layout.width}
            districts={districts}
            buildings={buildings}
            tooltip={tooltip}
          />
        ) : (
          <p className="grid h-full place-items-center font-mono text-sm text-muted">
            {t('repos.empty')}
          </p>
        )
      }
      intro={<ReposIntro city={city} />}
      panel={<ReposPanel city={city} />}
      hint={t('common.hint')}
      list={(interactive) => <CityList groups={groups} interactive={interactive} />}
    />
  )
}
