'use client'

import { NotFoundError, RateLimitError, type Repo } from '@devcity/github-client'
import type { TreeCityLayout } from '@devcity/city-layout'
import { useFormatter, useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'
import { LayerIntro, Stat } from '@/components/layer-ui'
import { tone } from '@/lib/colors'
import { languageColor, languageOfPath } from '@/lib/language-colors'
import { useFormatters } from '@/lib/locale'
import { parseRepoInput } from '@/lib/repo-input'
import { useTheme } from '@/lib/theme'
import { minutesUntil, RateLimitBadge, useTick } from './rate-limit-badge'

const EXAMPLES = ['joeykwispel/Portfolio', 'pmndrs/zustand', 'sveltejs/svelte', 'facebook/react']

export function AnyRepoIntro({
  current,
  onSubmit,
  repo,
  layout,
  truncated,
  status,
  error,
}: {
  current: string
  onSubmit: (fullName: string) => void
  repo: Repo | undefined
  layout: TreeCityLayout | null
  truncated: boolean
  status: 'idle' | 'repo' | 'tree' | 'ready' | 'error'
  error: unknown
}) {
  const t = useTranslations('anyRepo')
  const format = useFormatter()
  const formatters = useFormatters()
  const theme = useTheme()
  const [value, setValue] = useState(current)
  const [invalid, setInvalid] = useState(false)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const parsed = parseRepoInput(value)
    setInvalid(!parsed)
    if (parsed) onSubmit(`${parsed.owner}/${parsed.repo}`)
  }

  const bytesByLanguage = new Map<string, number>()
  for (const b of layout?.buildings ?? []) {
    const lang = languageOfPath(b.id)
    if (lang !== 'Other') bytesByLanguage.set(lang, (bytesByLanguage.get(lang) ?? 0) + b.size)
  }
  const languages = [...bytesByLanguage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const totalSize = layout?.buildings.reduce((n, b) => n + b.size, 0) ?? 0

  return (
    <LayerIntro num="04" slug="any-repo" title={t('title')} intro={t('intro')}>
      <form onSubmit={submit} className="grid gap-2" noValidate>
        <label htmlFor="repo-input" className="sr-only">
          {t('label')}
        </label>
        <div className="flex gap-1.5">
          <input
            id="repo-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('placeholder')}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'repo-input-error' : undefined}
            className="h-9 min-w-0 flex-1 rounded-[var(--radius-sm)] border border-border bg-surface px-3 font-mono text-sm text-text placeholder:text-muted focus-visible:border-accent"
          />
          <button type="submit" className="chip h-9 bg-accent font-bold text-accent-ink">
            {t('submit')}
          </button>
        </div>
        {invalid && (
          <p id="repo-input-error" className="font-mono text-[0.75rem] text-accent-2-text">
            {t('invalid')}
          </p>
        )}
        <p className="flex flex-wrap items-center gap-1.5 font-mono text-[0.72rem] text-muted">
          {t('examples')}:
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              className="tag hover:text-accent-text"
              onClick={() => {
                setValue(example)
                setInvalid(false)
                onSubmit(example)
              }}
            >
              {example}
            </button>
          ))}
        </p>
      </form>

      <Status status={status} error={error} current={current} />

      {repo && layout && (
        <>
          <p className="text-sm text-muted">
            <a href={repo.html_url} target="_blank" rel="noreferrer" className="font-bold">
              {repo.full_name}
            </a>
            {repo.description && <> · {repo.description}</>}
          </p>
          <dl className="grid grid-cols-4 gap-2 font-mono text-sm">
            <Stat label={t('stats.files')}>
              <span className="font-bold text-accent-text">
                {format.number(layout.buildings.length + layout.omitted)}
              </span>
            </Stat>
            <Stat label={t('stats.size')}>{formatters.bytes(totalSize)}</Stat>
            <Stat label={t('stats.stars')}>
              {format.number(repo.stargazers_count, { notation: 'compact' })}
            </Stat>
            <Stat label={t('stats.branch')}>{repo.default_branch}</Stat>
          </dl>
          {languages.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {languages.map(([lang, bytes]) => (
                <li key={lang} className="chip h-7 whitespace-nowrap">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: tone(languageColor(lang), theme) }}
                    aria-hidden="true"
                  />
                  {lang}
                  <span className="opacity-70">
                    {format.number(bytes / totalSize, {
                      style: 'percent',
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {truncated && <p className="text-[0.8rem] text-accent-2-text">{t('truncated')}</p>}
          {layout.omitted > 0 && (
            <p className="text-[0.8rem] text-muted">{t('omitted', { count: layout.omitted })}</p>
          )}
        </>
      )}

      <RateLimitBadge />
    </LayerIntro>
  )
}

function Status({
  status,
  error,
  current,
}: {
  status: 'idle' | 'repo' | 'tree' | 'ready' | 'error'
  error: unknown
  current: string
}) {
  const t = useTranslations('anyRepo')
  const now = useTick(30_000)
  if (status === 'repo' || status === 'tree')
    return (
      <p className="animate-pulse font-mono text-[0.8rem] text-muted" role="status">
        {status === 'repo' ? t('loadingRepo', { repo: current }) : t('loadingTree')}
      </p>
    )
  if (status !== 'error') return null
  const message =
    error instanceof RateLimitError
      ? t('rateLimited', {
          minutes: error.rateLimit ? minutesUntil(error.rateLimit.reset, now) : 60,
        })
      : error instanceof NotFoundError
        ? t('notFound', { repo: current })
        : t('failed', { message: error instanceof Error ? error.message : String(error) })
  return (
    <p className="text-[0.85rem] text-accent-2-text" role="alert">
      {message}
    </p>
  )
}
