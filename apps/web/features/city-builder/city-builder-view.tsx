'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { CityList, type ListGroup } from '@/components/city-list'
import { LayerShell } from '@/components/layer-ui'
import { CityView, type LabelledDistrict } from '@/components/scene/city-view'
import { usePathname, useRouter } from '@/i18n/routing'
import { useCityStore, useLayerState } from '@/lib/city-store'
import { hueCss, tone } from '@/lib/colors'
import { github } from '@/lib/github'
import { languageColor, languageOfPath } from '@/lib/language-colors'
import { useFormatters } from '@/lib/locale'
import { parseRepoInput } from '@/lib/repo-input'
import { useTheme } from '@/lib/theme'
import { CityBuilderIntro, type Notice } from './city-builder-intro'
import { CityBuilderPanel } from './city-builder-panel'
import { QueryProvider } from './query-provider'
import { repoId, repoQueryKey, useCity } from './use-city'

/** Enough for an organisation's worth of repositories, while the scene stays fast. */
export const MAX_REPOS = 100

/** Nested folder plates beyond this are skipped: each is a draw call and adds little. */
const MAX_BLOCKS = 300

/** Only the biggest districts get a name tag; a hundred tags would bury the city. */
const MAX_LABELS = 40

const SINGLE_HUE = 168
/** Golden angle: neighbouring repositories get clearly different hues, however many there are. */
const repoHue = (i: number) => (SINGLE_HUE + i * 137.508) % 360

/** ?repos=a/b,c/d (and ?repo=a/b from the old "Any repo" links) to unique repository ids. */
function idsFromParams(repos: string | null, repo: string | null) {
  const ids = [repos, repo]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((part) => parseRepoInput(part))
    .filter((t) => t !== null)
    .map(repoId)
  return [...new Set(ids)].slice(0, MAX_REPOS)
}

export function CityBuilderView() {
  return (
    <QueryProvider>
      <CityBuilder />
    </QueryProvider>
  )
}

function CityBuilder() {
  useLayerState()
  const t = useTranslations()
  const format = useFormatters()
  const theme = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const queryClient = useQueryClient()
  const reset = useCityStore((s) => s.reset)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  const reposParam = params.get('repos')
  const repoParam = params.get('repo')
  const ids = useMemo(() => idsFromParams(reposParam, repoParam), [reposParam, repoParam])
  const { repos, layout, built, settled } = useCity(ids)
  const byId = useMemo(() => new Map(repos.map((r) => [r.id, r])), [repos])

  const setIds = (next: string[]) => {
    reset()
    const query = next.length > 0 ? { repos: next.join(',') } : {}
    router.replace({ pathname, query }, { scroll: false })
  }

  const add = async (input: string) => {
    setNotice(null)
    const tokens = input.split(/[\s,]+/).filter(Boolean)
    const added: string[] = []
    for (const token of tokens) {
      const target = parseRepoInput(token)
      if (target) {
        added.push(repoId(target))
        continue
      }
      // A bare name is a user or organisation: add every repository they own.
      const user = token.replace(/^@/, '')
      setImporting(user)
      try {
        const owned = await queryClient.fetchQuery({
          queryKey: ['userRepos', user.toLowerCase()],
          queryFn: ({ signal }) => github.listUserRepos(user, { signal }),
        })
        const own = owned.filter((r) => !r.fork)
        if (own.length === 0) setNotice({ kind: 'importEmpty', user })
        for (const repo of own) {
          const id = repo.full_name.toLowerCase()
          // The listing already has the metadata, so each repository costs one request less.
          queryClient.setQueryData(repoQueryKey(id), repo)
          added.push(id)
        }
      } catch (error) {
        setNotice({ kind: 'error', error, repo: user })
      } finally {
        setImporting(null)
      }
    }
    const next = [...new Set([...ids, ...added])]
    if (next.length > MAX_REPOS) setNotice({ kind: 'limit', max: MAX_REPOS })
    if (added.length > 0) setIds(next.slice(0, MAX_REPOS))
  }

  const remove = (id: string) => setIds(ids.filter((other) => other !== id))

  // One repository keeps its folders as districts; several get a district (and colour) each.
  const single = built !== '' && !built.includes(',')
  const repoColor = useMemo(() => {
    const hues = new Map(ids.map((id, i) => [id, ids.length === 1 ? SINGLE_HUE : repoHue(i)]))
    return (id: string) => hueCss(hues.get(id) ?? SINGLE_HUE, theme)
  }, [ids, theme])
  // Districts in a one-repository city are folders, all in the same colour.
  const colorOf = useMemo(
    () => (district: string) => (single ? hueCss(SINGLE_HUE, theme) : repoColor(district)),
    [single, repoColor, theme],
  )

  const districts = useMemo<LabelledDistrict[]>(() => {
    if (!layout) return []
    // A block id starts with its repository's owner/name.
    const blockColor = (id: string) => colorOf(id.split('/').slice(0, 2).join('/'))
    const labelled = new Set(
      [...layout.districts]
        .sort((a, b) => b.buildingCount - a.buildingCount)
        .slice(0, MAX_LABELS)
        .map((d) => d.id),
    )
    return [
      ...layout.districts.map((d) => ({
        ...d,
        color: colorOf(d.id),
        // A repository district is labelled with its name; the owner is on the list.
        label: !labelled.has(d.id) ? undefined : single ? d.id : d.id.slice(d.id.indexOf('/') + 1),
      })),
      ...layout.blocks
        // Many repositories: only their top folders, or the plates drown the city.
        .filter((b) => b.level <= (single ? 2 : 1))
        .slice(0, MAX_BLOCKS)
        .map((b) => ({ ...b, color: blockColor(b.id), elevation: b.level * 0.05 })),
    ]
  }, [layout, single, colorOf])

  const buildings = useMemo(
    () =>
      layout?.buildings.map((b) => ({
        ...b,
        group: b.district,
        color: tone(languageColor(languageOfPath(b.path)), theme),
      })) ?? [],
    [layout, theme],
  )

  const groups = useMemo<ListGroup[]>(() => {
    if (!layout) return []
    return layout.districts.map((d) => ({
      id: d.id,
      label: d.id,
      color: colorOf(d.id),
      items: layout.buildings
        .filter((b) => b.district === d.id)
        .sort((a, b) => b.size - a.size)
        .map((b) => ({
          id: b.id,
          name: b.repo ? b.path : b.id,
          value: format.bytes(b.size),
          magnitude: b.size,
        })),
    }))
  }, [layout, format, colorOf])

  const tooltip = (id: string) => {
    const file = layout?.buildings.find((b) => b.id === id)
    return file ? { title: id, detail: format.bytes(file.size) } : null
  }

  const repoOf = (repo: string) => byId.get(repo || built)?.repo

  return (
    <LayerShell
      scene={
        layout && layout.buildings.length > 0 ? (
          <CityView
            key={built}
            size={layout.width}
            districts={districts}
            buildings={buildings}
            tooltip={tooltip}
          />
        ) : (
          <p className="grid h-full place-items-center p-6 text-center font-mono text-sm text-muted lg:pl-[400px]">
            {ids.length === 0 ? t('cityBuilder.empty') : ''}
          </p>
        )
      }
      intro={
        <CityBuilderIntro
          repos={repos}
          layout={layout}
          settled={settled}
          colorOf={repoColor}
          onAdd={add}
          onRemove={remove}
          onClear={() => setIds([])}
          importing={importing}
          notice={notice}
        />
      }
      introOpen={ids.length === 0 || importing !== null}
      panel={layout && <CityBuilderPanel layout={layout} repoOf={repoOf} />}
      hint={layout ? t('common.hint') : undefined}
      list={
        layout
          ? (interactive) => (
              <CityList groups={groups} interactive={interactive} limit={200} filterable />
            )
          : undefined
      }
    />
  )
}
