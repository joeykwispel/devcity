'use client'

import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { LayerShell } from '@/components/layer-ui'
import { CityView, type LabelledDistrict } from '@/components/scene/city-view'
import { usePathname, useRouter } from '@/i18n/routing'
import { useCityStore, useLayerState } from '@/lib/city-store'
import { hueCss, tone } from '@/lib/colors'
import { languageColor, languageOfPath } from '@/lib/language-colors'
import { useFormatters } from '@/lib/locale'
import { parseRepoInput } from '@/lib/repo-input'
import { useTheme } from '@/lib/theme'
import { AnyRepoIntro } from './any-repo-intro'
import { AnyRepoPanel } from './any-repo-panel'
import { QueryProvider } from './query-provider'
import { useRepoCity } from './use-repo-city'

/** Nested folder plates beyond this are skipped: each is a draw call and adds little. */
const MAX_BLOCKS = 300

export function AnyRepoView() {
  return (
    <QueryProvider>
      <AnyRepo />
    </QueryProvider>
  )
}

function AnyRepo() {
  useLayerState()
  const t = useTranslations()
  const format = useFormatters()
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const reset = useCityStore((s) => s.reset)

  const current = params.get('repo') ?? ''
  const target = useMemo(() => parseRepoInput(current), [current])
  const { repo, tree, layout } = useRepoCity(target)

  const status = !target
    ? 'idle'
    : repo.error || tree.error
      ? 'error'
      : repo.isPending
        ? 'repo'
        : tree.isPending
          ? 'tree'
          : 'ready'

  const open = (fullName: string) => {
    reset()
    router.replace({ pathname, query: { repo: fullName } }, { scroll: false })
  }

  const districts = useMemo<LabelledDistrict[]>(() => {
    if (!layout) return []
    const accent = hueCss(168, theme)
    return [
      ...layout.districts.map((d) => ({ ...d, color: accent, label: d.id })),
      ...layout.blocks
        .filter((b) => b.level <= 2)
        .slice(0, MAX_BLOCKS)
        .map((b) => ({ ...b, color: accent, elevation: b.level * 0.05 })),
    ]
  }, [layout, theme])

  const buildings = useMemo(
    () =>
      layout?.buildings.map((b) => ({
        ...b,
        group: b.district,
        color: tone(languageColor(languageOfPath(b.id)), theme),
      })) ?? [],
    [layout, theme],
  )

  const tooltip = (id: string) => {
    const file = layout?.buildings.find((b) => b.id === id)
    return file ? { title: id, detail: format.bytes(file.size) } : null
  }

  return (
    <LayerShell
      scene={
        layout && layout.buildings.length > 0 ? (
          <CityView
            key={`${target?.owner}/${target?.repo}`}
            size={layout.width}
            districts={districts}
            buildings={buildings}
            tooltip={tooltip}
          />
        ) : (
          <p className="grid h-full place-items-center p-6 text-center font-mono text-sm text-muted lg:pl-[400px]">
            {status === 'idle' ? t('anyRepo.empty') : ''}
          </p>
        )
      }
      intro={
        <AnyRepoIntro
          // Remount the form when the URL changes (back/forward, example links).
          key={current}
          current={current}
          onSubmit={open}
          repo={repo.data}
          layout={layout}
          truncated={tree.data?.truncated ?? false}
          status={status}
          error={repo.error ?? tree.error}
        />
      }
      panel={repo.data && layout && <AnyRepoPanel repo={repo.data} layout={layout} />}
      hint={layout ? t('common.hint') : undefined}
    />
  )
}
