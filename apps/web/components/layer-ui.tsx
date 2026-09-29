'use client'

import { useTranslations } from 'next-intl'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { SceneToolbar } from './scene-toolbar'
import { useCityStore } from '@/lib/city-store'

/**
 * On phones the intro card folds into a title bar, so the city stays visible. LayerShell owns the
 * state; LayerIntro draws the toggle. Outside the city view nothing folds.
 */
const Collapse = createContext<{ collapsed: boolean; toggle: () => void } | null>(null)

function Chevron({ up }: { up: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${up ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/** Code-style section head from the portfolio: "01 ~/joey/skills.ts" and "<Skills />". */
export function LayerIntro({
  num,
  slug,
  title,
  intro,
  children,
}: {
  num: string
  slug: string
  title: string
  intro?: string
  children?: ReactNode
}) {
  const t = useTranslations('common')
  const collapse = useContext(Collapse)
  const collapsed = collapse?.collapsed ?? false
  const [more, setMore] = useState(false)
  // Two lines say what the city is; the rest is one click away, so the list keeps its room.
  const long = (intro?.length ?? 0) > 110
  // Only phones fold; from md up the card is always open.
  const fold = collapsed ? 'max-md:hidden' : ''

  return (
    <section
      aria-labelledby="layer-title"
      className={`glass panel pointer-events-auto grid gap-2.5 p-4 ${collapsed ? 'max-md:py-2.5' : ''}`}
    >
      <p
        className={`flex items-center font-mono text-[0.72rem] text-muted ${fold}`}
        aria-hidden="true"
      >
        <span className="mr-2.5 font-bold text-accent-text">{num}</span>
        ~/joey/<span className="text-text">{slug}</span>
        <span className="text-accent-2-text">.ts</span>
      </p>
      <div className="flex items-center justify-between gap-3">
        <h1
          id="layer-title"
          className={`min-w-0 truncate font-mono text-[1.35rem] leading-tight font-bold tracking-tighter ${collapsed ? 'max-md:text-[1.15rem]' : ''} xl:text-[1.5rem]`}
        >
          <span className="font-medium text-accent-text opacity-55" aria-hidden="true">
            &lt;
          </span>
          {title}
          <span className="font-medium text-accent-text opacity-55" aria-hidden="true">
            {' /'}&gt;
          </span>
        </h1>
        {collapse && (
          <button
            type="button"
            className="chip h-8 shrink-0 gap-1.5 px-2.5 md:hidden"
            aria-expanded={!collapsed}
            aria-controls="layer-intro-body"
            onClick={collapse.toggle}
          >
            {/* Open, the card needs the width for its title: the chevron says enough. */}
            {collapsed ? (
              <span className="font-mono text-[0.72rem]">{t('showDetails')}</span>
            ) : (
              <span className="sr-only">{t('hideDetails')}</span>
            )}
            <Chevron up={!collapsed} />
          </button>
        )}
      </div>
      {intro && (
        <div className="hidden sm:block">
          <p
            id="layer-intro-text"
            className={`text-[0.84rem] leading-relaxed text-muted ${long && !more ? 'line-clamp-2' : ''}`}
          >
            <span className="font-mono" aria-hidden="true">
              {'// '}
            </span>
            {intro}
          </p>
          {long && (
            <button
              type="button"
              className="font-mono text-[0.7rem] text-accent-text hover:underline"
              aria-expanded={more}
              aria-controls="layer-intro-text"
              onClick={() => setMore((m) => !m)}
            >
              {more ? t('less') : t('more')}
            </button>
          )}
        </div>
      )}
      {children && (
        <div id="layer-intro-body" className={`grid gap-2.5 ${fold}`}>
          {children}
        </div>
      )}
    </section>
  )
}

/** Glass side panel for the selected building. */
export function DetailPanel({
  path,
  title,
  label,
  onClose,
  children,
}: {
  /** Shown as ~/joey/{path}.ts */
  path: string
  title: ReactNode
  label: string
  onClose: () => void
  children: ReactNode
}) {
  const t = useTranslations('common')

  // Escape closes the panel, wherever focus is.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <aside
      aria-live="polite"
      aria-label={label}
      className="glass panel pointer-events-auto grid max-h-[42dvh] gap-3 overflow-y-auto overscroll-contain p-4 sm:max-h-[55dvh] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <p className="truncate font-mono text-[0.75rem] text-muted" aria-hidden="true">
            ~/joey/<span className="text-text">{path}</span>
            <span className="text-accent-2-text">.ts</span>
          </p>
          <h2 className="text-lg leading-snug font-bold tracking-tight">{title}</h2>
        </div>
        <CloseButton label={t('close')} onClick={onClose} />
      </div>
      {children}
    </aside>
  )
}

export function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-sm)] border border-border bg-surface px-2.5 py-1.5">
      <dt className="text-[0.68rem] text-muted">{label}</dt>
      <dd className="truncate text-[0.85rem]">{children}</dd>
    </div>
  )
}

export function PanelHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-mono text-[0.75rem] text-muted">
      <span aria-hidden="true">{'// '}</span>
      {children}
    </h3>
  )
}

export function CloseButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="chip h-8 w-8 shrink-0 justify-center px-0"
      onClick={onClick}
      aria-label={label}
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
  )
}

/**
 * Standard layout of a layer. In city view: the scene full screen with the intro card, toolbar,
 * detail panel and hint floating over it. In list view: intro and list side by side (stacked on
 * phones) in a scrollable page, and no WebGL at all.
 */
export function LayerShell({
  scene,
  intro,
  panel,
  hint,
  list,
  legend,
  tools,
  introOpen = false,
}: {
  scene: ReactNode
  intro: ReactNode
  panel?: ReactNode
  hint?: string
  /** Renders the layer as a list; interactive in list view, screen-reader-only in city view. */
  list?: (interactive: boolean) => ReactNode
  /**
   * Always-visible list under the intro in city view (from lg up), so the whole layer can be read
   * at a glance. It replaces the screen-reader-only list, since it is the same content.
   */
  legend?: ReactNode
  /** Extra toolbar buttons for this layer. */
  tools?: ReactNode
  /**
   * Unfolds the intro card on phones, e.g. while it asks for input. When it turns false again the
   * card folds, to show the city that input produced.
   */
  introOpen?: boolean
}) {
  const view = useCityStore((s) => s.view)
  const selected = useCityStore((s) => s.selected)
  const [collapsed, setCollapsed] = useState(!introOpen)

  // Follow introOpen and fold for a selected building (its panel needs the room), without an
  // effect: adjusting state during render skips the extra paint.
  const [seen, setSeen] = useState({ introOpen, selected })
  if (seen.introOpen !== introOpen || seen.selected !== selected) {
    setSeen({ introOpen, selected })
    if (seen.introOpen !== introOpen) setCollapsed(!introOpen)
    else if (selected) setCollapsed(true)
  }
  const collapse = { collapsed, toggle: () => setCollapsed((c) => !c) }

  if (view === 'list' && list)
    return (
      <>
        <div className="absolute inset-0 overflow-y-auto pt-[calc(var(--nav-h)+0.5rem)] pb-24">
          <div className="mx-auto grid w-[min(1360px,100%-2rem)] items-start gap-3 lg:grid-cols-[380px_1fr]">
            <div className="grid gap-3 lg:sticky lg:top-0">
              {intro}
              <SceneToolbar>{tools}</SceneToolbar>
            </div>
            <div className="glass panel p-4 sm:p-5">{list(true)}</div>
          </div>
        </div>
        <div className="pointer-events-none fixed right-4 bottom-4 z-10 grid w-[min(380px,calc(100%-2rem))] sm:right-6">
          {panel}
        </div>
      </>
    )

  return (
    <>
      <div className="absolute inset-0">{scene}</div>

      {/*
        Below lg the column scrolls as a whole. From lg up, with the list beside the city, the
        height is shared out instead: the list always keeps a good part of it, and the intro card
        scrolls on its own when it cannot fit.
      */}
      <div
        className={`pointer-events-none absolute top-[calc(var(--nav-h)+0.5rem)] left-4 flex max-h-[calc(100dvh-var(--nav-h)-1.5rem)] w-[min(380px,calc(100%-2rem))] flex-col gap-2.5 overflow-y-auto overscroll-contain [scrollbar-width:none] max-md:max-h-[62dvh] sm:left-6 ${legend ? 'lg:overflow-hidden' : ''}`}
      >
        <div
          className={`shrink-0 ${legend ? 'lg:pointer-events-auto lg:min-h-0 lg:shrink lg:overflow-y-auto lg:overscroll-contain lg:rounded-[var(--radius)] lg:[scrollbar-color:var(--border)_transparent] lg:[scrollbar-width:thin] lg:scroll-fade' : ''}`}
        >
          <Collapse.Provider value={collapse}>{intro}</Collapse.Provider>
        </div>
        <div className={`shrink-0 ${collapsed ? 'max-md:hidden' : ''}`}>
          <SceneToolbar>{tools}</SceneToolbar>
        </div>
        {legend && (
          // Takes the remaining height and scrolls on its own, so intro and toolbar stay put.
          <div className="glass panel pointer-events-auto hidden min-h-[min(16rem,40dvh)] flex-[1_1_0] scroll-fade overflow-y-auto overscroll-contain p-4 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] lg:block">
            {legend}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 grid w-[min(380px,calc(100%-2rem))] sm:right-6">
        {panel}
      </div>

      {/* Right of the sidebar; gone once a building is picked, when its panel needs the room. */}
      {hint && !selected && (
        <p className="pointer-events-none absolute bottom-4 left-[calc(380px+3rem)] hidden font-mono text-[0.72rem] text-muted xl:block">
          <span aria-hidden="true">{'// '}</span>
          {hint}
        </p>
      )}

      {/* Below lg the legend is hidden, so screen readers still get the list there. */}
      {legend ? <div className="lg:hidden">{list?.(false)}</div> : list?.(false)}
    </>
  )
}
