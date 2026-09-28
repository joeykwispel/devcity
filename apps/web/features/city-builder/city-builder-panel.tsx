'use client'

import type { TreeCityLayout } from '@devcity/city-layout'
import type { Repo } from '@devcity/github-client'
import { useTranslations } from 'next-intl'
import { DetailPanel, Stat } from '@/components/layer-ui'
import { useCityStore } from '@/lib/city-store'
import { languageOfPath } from '@/lib/language-colors'
import { useFormatters } from '@/lib/locale'

export function CityBuilderPanel({
  layout,
  repoOf,
}: {
  layout: TreeCityLayout
  /** Metadata of a building's repository ('' in a one-repository city). */
  repoOf: (repo: string) => Repo | undefined
}) {
  const t = useTranslations('cityBuilder')
  const format = useFormatters()
  const selected = useCityStore((s) => s.selected)
  const select = useCityStore((s) => s.select)
  const file = selected ? layout.buildings.find((b) => b.id === selected) : undefined
  const repo = file && repoOf(file.repo)
  if (!file || !repo) return null

  const name = file.path.slice(file.path.lastIndexOf('/') + 1)
  const url = `${repo.html_url}/blob/${encodeURIComponent(repo.default_branch)}/${file.path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

  return (
    <DetailPanel
      path={`${repo.name.toLowerCase()}/${file.path}`}
      title={<span className="break-all">{name}</span>}
      label={t('details', { name })}
      onClose={() => select(null)}
    >
      <p className="font-mono text-[0.75rem] break-all text-muted">{file.path}</p>
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label={t('size')}>
          <span className="font-bold text-accent-text">{format.bytes(file.size)}</span>
        </Stat>
        <Stat label={t('language')}>{languageOfPath(file.path)}</Stat>
        {file.repo && (
          <div className="col-span-2">
            <Stat label={t('repo')}>{repo.full_name}</Stat>
          </div>
        )}
      </dl>
      <a
        className="chip justify-self-start no-underline"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {t('openFile')}
      </a>
    </DetailPanel>
  )
}
