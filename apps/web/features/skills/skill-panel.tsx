'use client'

import { formatYears, locale, t } from '@/lib/locale'
import { useTheme } from '@/lib/theme'
import { categoryCss, type SkillsCity } from './skills-city'
import { useSkillsStore } from './store'

const monthFormat = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
const formatMonth = (value: string) => {
  const [y, m] = value.split('-').map(Number)
  return monthFormat.format(new Date(y!, m! - 1, 1))
}

export function SkillPanel({ city }: { city: SkillsCity }) {
  const theme = useTheme()
  const selected = useSkillsStore((s) => s.selected)
  const select = useSkillsStore((s) => s.select)

  const skill = selected ? city.skills.get(selected) : undefined
  const stat = selected ? city.stats.get(selected) : undefined
  if (!skill || !stat) return null

  const category = city.categories.get(skill.category)
  const name = skill.label ? t(skill.label) : skill.id
  const roles = stat.roleIds.map((id) => city.roles.get(id)).filter((r) => r !== undefined)

  return (
    <aside
      aria-live="polite"
      aria-label={`${name} details`}
      className="glass panel pointer-events-auto grid max-h-[50dvh] gap-3 overflow-y-auto p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="font-mono text-[0.75rem] text-muted" aria-hidden="true">
            ~/joey/skills/<span className="text-text">{skill.id.toLowerCase()}</span>
            <span className="text-accent-2-text">.ts</span>
          </p>
          <h2 className="text-lg font-bold tracking-tight">{name}</h2>
        </div>
        <button
          type="button"
          className="chip h-8 w-8 justify-center px-0"
          onClick={() => select(null)}
          aria-label="Close details"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-2 font-mono text-sm">
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface p-2.5">
          <dt className="text-[0.7rem] text-muted">experience</dt>
          <dd className="text-xl font-bold text-accent-text">
            {stat.months > 0 ? `${formatYears(stat.months)} yrs` : 'listed'}
          </dd>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-border bg-surface p-2.5">
          <dt className="text-[0.7rem] text-muted">district</dt>
          <dd className="truncate" style={{ color: categoryCss(category?.hue ?? 0, theme) }}>
            {category ? t(category.label) : skill.category}
          </dd>
        </div>
      </dl>

      {roles.length > 0 ? (
        <div className="grid gap-1.5">
          <h3 className="font-mono text-[0.75rem] text-muted">
            <span aria-hidden="true">{'// '}</span>used at
          </h3>
          <ul className="grid gap-1 text-sm">
            {roles.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-3">
                <span className="truncate">{r.company}</span>
                <span className="shrink-0 font-mono text-[0.72rem] text-muted">
                  {formatMonth(r.start)} &ndash; {r.end ? formatMonth(r.end) : 'now'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-muted">
          On my CV, but not tied to a specific role, so it gets the minimum height.
        </p>
      )}
    </aside>
  )
}
