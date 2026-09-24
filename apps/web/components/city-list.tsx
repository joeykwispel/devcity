'use client'

import { useTranslations } from 'next-intl'
import { useDeferredValue, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useCityStore } from '@/lib/city-store'
import { cn } from '@/lib/utils'

export interface ListItem {
  id: string
  name: string
  /** Short value on the right: years, size, duration... */
  value?: string
  /** Numeric value for the bar, relative to the largest in the list. */
  magnitude?: number
}

export interface ListGroup {
  id: string
  label: string
  color: string
  items: ListItem[]
}

/**
 * The city as a list: the accessible, keyboard-first equivalent of the 3D scene. Visible in list
 * view, where every item is a button that opens the same detail panel as clicking a building; in
 * city view it is rendered screen-reader-only and without buttons, so keyboard focus never lands
 * on something invisible.
 */
export function CityList({
  groups,
  interactive,
  limit = Infinity,
  filterable = false,
}: {
  groups: ListGroup[]
  interactive: boolean
  /** Maximum items per group (large repositories). */
  limit?: number
  filterable?: boolean
}) {
  const t = useTranslations('list')
  const selected = useCityStore((s) => s.selected)
  const select = useCityStore((s) => s.select)
  // The legend buttons focus a district in the city; in the list they narrow it to that group.
  const focused = useCityStore((s) => s.focused)
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query.trim().toLowerCase())
  const max = Math.max(1, ...groups.flatMap((g) => g.items.map((i) => i.magnitude ?? 0)))

  const focusedGroups = focused && groups.some((g) => g.id === focused)
  const visible = groups
    .filter((g) => !focusedGroups || g.id === focused)
    .map((g) => ({
      ...g,
      items: (deferred
        ? g.items.filter((i) => i.name.toLowerCase().includes(deferred))
        : g.items
      ).slice(0, limit),
      total: g.items.length,
    }))
    .filter((g) => g.items.length > 0)

  if (!interactive)
    return (
      <div className="sr-only">
        {visible.map((g) => (
          <section key={g.id}>
            <h2>{g.label}</h2>
            <ul>
              {g.items.map((i) => (
                <li key={i.id}>
                  {i.name}
                  {i.value && `: ${i.value}`}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )

  return (
    <div className="grid gap-4">
      {filterable && (
        <div>
          <label htmlFor="list-filter" className="sr-only">
            {t('filter')}
          </label>
          <Input
            id="list-filter"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('filter')}
            className="w-full"
          />
        </div>
      )}
      {visible.length === 0 && <p className="text-sm text-muted">{t('noMatches')}</p>}
      {visible.map((g) => (
        <section key={g.id} aria-labelledby={`list-${g.id}`} className="grid gap-1.5">
          <h2
            id={`list-${g.id}`}
            className="flex items-center gap-2 font-mono text-sm font-bold"
            style={{ color: g.color }}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: g.color }}
              aria-hidden="true"
            />
            {g.label}
            <span className="font-normal text-muted">{g.total}</span>
          </h2>
          <ul className="grid gap-0.5">
            {g.items.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => select(i.id)}
                  aria-pressed={selected === i.id}
                  className={cn(
                    'relative grid w-full grid-cols-[1fr_auto] items-center gap-3 overflow-hidden rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-surface-2',
                    selected === i.id && 'bg-surface-2 text-accent-text',
                  )}
                >
                  {i.magnitude !== undefined && (
                    <span
                      className="absolute inset-y-0 left-0 opacity-15"
                      style={{ width: `${(i.magnitude / max) * 100}%`, background: g.color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative truncate">{i.name}</span>
                  {i.value && (
                    <span className="relative font-mono text-[0.75rem] text-muted">{i.value}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {g.total > g.items.length && !deferred && (
            <p className="px-2.5 font-mono text-[0.7rem] text-muted">
              {t('more', { count: g.total - g.items.length })}
            </p>
          )}
        </section>
      ))}
    </div>
  )
}
