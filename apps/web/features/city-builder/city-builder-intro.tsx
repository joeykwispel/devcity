'use client'

import { NotFoundError, RateLimitError } from '@devcity/github-client'
import type { TreeCityLayout } from '@devcity/city-layout'
import { useFormatter, useTranslations } from 'next-intl'
import { useState, type FormEvent } from 'react'
import { LayerIntro, PanelHeading, Stat } from '@/components/layer-ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCityStore } from '@/lib/city-store'
import { tone } from '@/lib/colors'
import { languageColor, languageOfPath } from '@/lib/language-colors'
import { useFormatters } from '@/lib/locale'
import { parseRepoInput } from '@/lib/repo-input'
import { useTheme } from '@/lib/theme'
import { minutesUntil, RateLimitBadge, useTick } from './rate-limit-badge'
import type { CityRepo } from './use-city'

const EXAMPLES = [
  { label: 'facebook/react', value: 'facebook/react' },
  { label: 'pmndrs × 3', value: 'pmndrs/zustand pmndrs/jotai pmndrs/valtio' },
  { label: 'joeykwispel/*', value: 'joeykwispel' },
]

export type Notice =
  | { kind: 'error'; error: unknown; repo: string }
  | { kind: 'importEmpty'; user: string }
  | { kind: 'limit'; max: number }

/** A token is valid when it is a repository or a bare GitHub user name. */
const validToken = (token: string) =>
  parseRepoInput(token) !== null || /^@?[a-z\d](?:[a-z\d-]{0,38})$/i.test(token)

export function CityBuilderIntro({
  repos,
  layout,
  settled,
  colorOf,
  onAdd,
  onRemove,
  onClear,
  importing,
  notice,
}: {
  repos: CityRepo[]
  layout: TreeCityLayout | null
  settled: boolean
  colorOf: (id: string) => string
  onAdd: (input: string) => Promise<void>
  onRemove: (id: string) => void
  onClear: () => void
  importing: string | null
  notice: Notice | null
}) {
  const t = useTranslations('cityBuilder')
  const format = useFormatter()
  const formatters = useFormatters()
  const theme = useTheme()
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState(false)

  const submit = (input: string) => {
    const tokens = input.split(/[\s,]+/).filter(Boolean)
    const ok = tokens.length > 0 && tokens.every(validToken)
    setInvalid(!ok)
    if (!ok) return
    setValue('')
    void onAdd(input)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(value)
  }

  const bytesByLanguage = new Map<string, number>()
  for (const b of layout?.buildings ?? []) {
    const lang = languageOfPath(b.path)
    if (lang !== 'Other') bytesByLanguage.set(lang, (bytesByLanguage.get(lang) ?? 0) + b.size)
  }
  const languages = [...bytesByLanguage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const totalSize = layout?.buildings.reduce((n, b) => n + b.size, 0) ?? 0
  const ready = repos.filter((r) => r.status === 'ready')
  const stars = ready.reduce((n, r) => n + (r.repo?.stargazers_count ?? 0), 0)
  const truncated = ready.filter((r) => r.tree?.truncated).length
  const failed = repos.find((r) => r.status === 'error')
  const only = repos.length === 1 ? repos[0] : undefined

  return (
    <LayerIntro num="04" slug="city-builder" title={t('title')} intro={t('intro')}>
      <form onSubmit={onSubmit} className="grid gap-2" noValidate>
        <label htmlFor="repo-input" className="sr-only">
          {t('label')}
        </label>
        <div className="flex gap-1.5">
          <Input
            id="repo-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('placeholder')}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="done"
            aria-invalid={invalid}
            aria-describedby={invalid ? 'repo-input-error' : undefined}
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="primary">
            {t('submit')}
          </Button>
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
              key={example.label}
              type="button"
              className="tag hover:text-accent-text"
              onClick={() => {
                setInvalid(false)
                submit(example.value)
              }}
            >
              {example.label}
            </button>
          ))}
        </p>
      </form>

      {importing && (
        <p className="animate-pulse font-mono text-[0.8rem] text-muted" role="status">
          {t('importing', { user: importing })}
        </p>
      )}
      {notice && <NoticeText notice={notice} />}
      {!settled && repos.length > 1 && (
        <p className="animate-pulse font-mono text-[0.8rem] text-muted" role="status">
          {t('progress', {
            done: repos.filter((r) => r.status !== 'loading').length,
            total: repos.length,
          })}
        </p>
      )}
      {only?.status === 'loading' && (
        <p className="animate-pulse font-mono text-[0.8rem] text-muted" role="status">
          {only.repo ? t('loadingTree') : t('loadingRepo', { repo: only.id })}
        </p>
      )}
      {failed && <ErrorText error={failed.error} repo={failed.id} />}

      {only?.repo && (
        <p className="text-sm text-muted">
          <a href={only.repo.html_url} target="_blank" rel="noreferrer" className="font-bold">
            {only.repo.full_name}
          </a>
          {only.repo.description && <> · {only.repo.description}</>}
        </p>
      )}

      {repos.length > 1 && (
        <RepoList repos={repos} colorOf={colorOf} onRemove={onRemove} onClear={onClear} />
      )}

      {layout && ready.length > 0 && (
        <>
          <dl className="grid grid-cols-4 gap-2 font-mono text-sm">
            {ready.length > 1 ? (
              <Stat label={t('stats.repos')}>{format.number(ready.length)}</Stat>
            ) : null}
            <Stat label={t('stats.files')}>
              <span className="font-bold text-accent-text">
                {format.number(layout.buildings.length + layout.omitted, { notation: 'compact' })}
              </span>
            </Stat>
            <Stat label={t('stats.size')}>{formatters.bytes(totalSize)}</Stat>
            <Stat label={t('stats.stars')}>{format.number(stars, { notation: 'compact' })}</Stat>
            {ready.length === 1 ? (
              <Stat label={t('stats.branch')}>{ready[0]!.repo?.default_branch}</Stat>
            ) : null}
          </dl>
          {languages.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {languages.map(([lang, bytes]) => (
                <li key={lang} className="chip chip-sm whitespace-nowrap">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: tone(languageColor(lang), theme) }}
                    aria-hidden="true"
                  />
                  {lang}
                  <span>
                    {format.number(bytes / totalSize, {
                      style: 'percent',
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {truncated > 0 && (
            <p className="text-[0.8rem] text-accent-2-text">
              {t('truncated', { count: truncated })}
            </p>
          )}
          {layout.omitted > 0 && (
            <p className="text-[0.8rem] text-muted">{t('omitted', { count: layout.omitted })}</p>
          )}
        </>
      )}

      {only && (
        <button
          type="button"
          className="justify-self-start font-mono text-[0.72rem] text-muted hover:text-accent-text"
          onClick={onClear}
        >
          {t('clear')}
        </button>
      )}

      <RateLimitBadge />
    </LayerIntro>
  )
}

/** The repositories in the city, each with its status. A name highlights its district. */
function RepoList({
  repos,
  colorOf,
  onRemove,
  onClear,
}: {
  repos: CityRepo[]
  colorOf: (id: string) => string
  onRemove: (id: string) => void
  onClear: () => void
}) {
  const t = useTranslations('cityBuilder')
  const format = useFormatter()
  const focused = useCityStore((s) => s.focused)
  const focus = useCityStore((s) => s.focus)

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <PanelHeading>
          {t('inCity')} ({format.number(repos.length)})
        </PanelHeading>
        <button
          type="button"
          className="font-mono text-[0.72rem] text-muted hover:text-accent-text"
          onClick={onClear}
        >
          {t('clear')}
        </button>
      </div>
      <ul className="grid max-h-40 gap-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
        {repos.map((r) => (
          <li
            key={r.id}
            className="flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-surface pr-0.5 pl-2"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: r.status === 'error' ? 'var(--accent-2)' : colorOf(r.id) }}
              aria-hidden="true"
            />
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left font-mono text-[0.75rem] hover:text-accent-text aria-pressed:text-accent-text"
              aria-pressed={focused === r.id}
              aria-label={t('focusRepo', { repo: r.id })}
              title={r.id}
              disabled={r.status !== 'ready'}
              onClick={() => focus(r.id)}
            >
              {r.id}
            </button>
            <span
              className={`shrink-0 font-mono text-[0.68rem] ${
                r.status === 'error'
                  ? 'text-accent-2-text'
                  : r.status === 'loading'
                    ? 'animate-pulse text-muted'
                    : 'text-muted'
              }`}
            >
              {r.status === 'ready'
                ? t('repoFiles', { count: r.tree?.files.length ?? 0 })
                : r.status === 'loading'
                  ? t('repoLoading')
                  : t('repoFailed')}
            </span>
            <button
              type="button"
              className="grid size-7 shrink-0 place-items-center rounded-[var(--radius-sm)] text-muted hover:bg-bg-2 hover:text-text"
              aria-label={t('remove', { repo: r.id })}
              onClick={() => onRemove(r.id)}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NoticeText({ notice }: { notice: Notice }) {
  const t = useTranslations('cityBuilder')
  if (notice.kind === 'error') return <ErrorText error={notice.error} repo={notice.repo} />
  return (
    <p className="text-[0.85rem] text-accent-2-text" role="status">
      {notice.kind === 'limit'
        ? t('limit', { max: notice.max })
        : t('importEmpty', { user: notice.user })}
    </p>
  )
}

function ErrorText({ error, repo }: { error: unknown; repo: string }) {
  const t = useTranslations('cityBuilder')
  const now = useTick(30_000)
  const message =
    error instanceof RateLimitError
      ? t('rateLimited', {
          minutes: error.rateLimit ? minutesUntil(error.rateLimit.reset, now) : 60,
        })
      : error instanceof NotFoundError
        ? t('notFound', { repo })
        : t('failed', { message: error instanceof Error ? error.message : String(error) })
  return (
    <p className="text-[0.85rem] text-accent-2-text" role="alert">
      {message}
    </p>
  )
}
