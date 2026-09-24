'use client'

import type { TreeCityLayout } from '@devcity/city-layout'
import type { Repo } from '@devcity/github-client'
import { useTranslations } from 'next-intl'
import { DetailPanel, Stat } from '@/components/layer-ui'
import { useCityStore } from '@/lib/city-store'
import { languageOfPath } from '@/lib/language-colors'
import { useFormatters } from '@/lib/locale'

export function AnyRepoPanel({ repo, layout }: { repo: Repo; layout: TreeCityLayout }) {
  const t = useTranslations('anyRepo')
  const format = useFormatters()
  const selected = useCityStore((s) => s.selected)
  const select = useCityStore((s) => s.select)
  const file = selected ? layout.buildings.find((b) => b.id === selected) : undefined
  if (!file) return null

  const name = file.id.slice(file.id.lastIndexOf('/') + 1)
  const url = `${repo.html_url}/blob/${encodeURIComponent(repo.default_branch)}/${file.id
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

  return (
    <DetailPanel
      path={`${repo.name.toLowerCase()}/${file.id}`}
      title={<span className="break-all">{name}</span>}
      label={t('details', { name })}
      onClose={() => select(null)}
    >
      <p className="font-mono text-[0.75rem] break-all text-muted">{file.id}</p>
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label={t('size')}>
          <span className="font-bold text-accent-text">{format.bytes(file.size)}</span>
        </Stat>
        <Stat label={t('language')}>{languageOfPath(file.id)}</Stat>
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
