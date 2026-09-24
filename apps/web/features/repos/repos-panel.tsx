'use client'

import type { Contribution, RepoSummary } from '@devcity/github-client'
import { useFormatter, useTranslations } from 'next-intl'
import { DetailPanel, PanelHeading, Stat } from '@/components/layer-ui'
import { Link } from '@/i18n/routing'
import { useCityStore } from '@/lib/city-store'
import { tone } from '@/lib/colors'
import { languageColor } from '@/lib/language-colors'
import { useTheme } from '@/lib/theme'
import type { ReposCity } from './repos-city'

export function ReposPanel({ city }: { city: ReposCity }) {
  const selected = useCityStore((s) => s.selected)
  const select = useCityStore((s) => s.select)
  if (!selected) return null
  const close = () => select(null)

  const contribution = city.contributions.get(selected)
  if (contribution) return <ContributionPanel contribution={contribution} onClose={close} />

  const meta = city.layout.meta.get(selected)
  const repo = meta ? city.repos.get(meta.district) : undefined
  if (!meta || !repo) return null
  return <RepoPanel repo={repo} language={meta.language} onClose={close} />
}

function RepoPanel({
  repo,
  language,
  onClose,
}: {
  repo: RepoSummary
  language: string
  onClose: () => void
}) {
  const t = useTranslations('repos')
  const format = useFormatter()
  const theme = useTheme()
  const total = Object.values(repo.languages).reduce((a, b) => a + b, 0)
  const languages = Object.entries(repo.languages)

  return (
    <DetailPanel
      path={`repos/${repo.name.toLowerCase()}`}
      title={
        <>
          {repo.name}
          {(repo.fork || repo.archived) && (
            <span className="ml-2 align-middle font-mono text-[0.7rem] font-normal text-accent-2-text">
              {[repo.fork && t('fork'), repo.archived && t('archived')].filter(Boolean).join(' · ')}
            </span>
          )}
        </>
      }
      label={t('details', { name: repo.name })}
      onClose={onClose}
    >
      {repo.description && <p className="text-sm text-muted">{repo.description}</p>}

      <dl className="grid grid-cols-3 gap-2 font-mono text-sm">
        <Stat label={t('stats.commits')}>
          <span className="font-bold text-accent-text">{format.number(repo.commits)}</span>
        </Stat>
        <Stat label={t('stars')}>{format.number(repo.stars)}</Stat>
        <Stat label={t('lastPush')}>
          {repo.pushedAt ? format.dateTime(new Date(repo.pushedAt), { dateStyle: 'medium' }) : '-'}
        </Stat>
      </dl>

      {languages.length > 0 && (
        <div className="grid gap-1.5">
          <PanelHeading>{t('languagesHeading')}</PanelHeading>
          <div className="flex h-2 overflow-hidden rounded-full" aria-hidden="true">
            {languages.map(([lang, bytes]) => (
              <span
                key={lang}
                style={{
                  width: `${(bytes / total) * 100}%`,
                  background: tone(languageColor(lang), theme),
                }}
              />
            ))}
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[0.75rem]">
            {languages.map(([lang, bytes]) => (
              <li
                key={lang}
                className={`flex items-center gap-1.5 ${lang === language ? 'text-text' : 'text-muted'}`}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: tone(languageColor(lang), theme) }}
                  aria-hidden="true"
                />
                <span className="truncate">{lang}</span>
                <span className="ml-auto">
                  {format.number(bytes / total, { style: 'percent', maximumFractionDigits: 1 })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {repo.topics.length > 0 && (
        <ul className="flex flex-wrap gap-1" aria-label={t('topics')}>
          {repo.topics.map((topic) => (
            <li key={topic} className="tag">
              {topic}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5">
        <a className="chip no-underline" href={repo.url} target="_blank" rel="noreferrer">
          {t('openOnGitHub')}
        </a>
        {repo.homepage && (
          <a className="chip no-underline" href={repo.homepage} target="_blank" rel="noreferrer">
            {t('website')}
          </a>
        )}
        <Link
          className="chip no-underline"
          href={{ pathname: '/any-repo', query: { repo: repo.fullName } }}
        >
          {t('exploreRepo')}
        </Link>
      </div>
    </DetailPanel>
  )
}

function ContributionPanel({
  contribution,
  onClose,
}: {
  contribution: Contribution
  onClose: () => void
}) {
  const t = useTranslations('repos')
  const format = useFormatter()

  return (
    <DetailPanel
      path={`repos/contributions/${contribution.fullName.split('/')[1]?.toLowerCase()}`}
      title={contribution.fullName}
      label={t('details', { name: contribution.fullName })}
      onClose={onClose}
    >
      {contribution.description && <p className="text-sm text-muted">{contribution.description}</p>}
      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <Stat label={t('language')}>{contribution.language ?? '-'}</Stat>
        <Stat label={t('stars')}>{format.number(contribution.stars)}</Stat>
      </dl>
      <div className="grid gap-1.5">
        <PanelHeading>{t('pullRequestsHeading')}</PanelHeading>
        <ul className="grid gap-1.5 text-sm">
          {contribution.pullRequests.map((pr) => (
            <li key={pr.number} className="grid gap-0.5">
              <a href={pr.url} target="_blank" rel="noreferrer" className="leading-snug">
                {pr.title}
              </a>
              <span className="font-mono text-[0.7rem] text-muted">
                #{pr.number} · {t(`prState.${pr.state}`)} ·{' '}
                {format.dateTime(new Date(pr.createdAt), { dateStyle: 'medium' })}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <a className="chip no-underline" href={contribution.url} target="_blank" rel="noreferrer">
          {t('openOnGitHub')}
        </a>
        <Link
          className="chip no-underline"
          href={{ pathname: '/any-repo', query: { repo: contribution.fullName } }}
        >
          {t('exploreRepo')}
        </Link>
      </div>
    </DetailPanel>
  )
}
