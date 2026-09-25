'use client'

import { useTranslations } from 'next-intl'
import { useEffect, type ReactNode } from 'react'
import { SceneToolbar } from './scene-toolbar'
import { useCityStore } from '@/lib/city-store'

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
  return (
    <section
      aria-labelledby="layer-title"
      className="glass panel pointer-events-auto grid gap-3 p-4 sm:p-5"
    >
      <p className="flex items-center font-mono text-[0.8rem] text-muted" aria-hidden="true">
        <span className="mr-2.5 font-bold text-accent-text">{num}</span>
        ~/joey/<span className="text-text">{slug}</span>
        <span className="text-accent-2-text">.ts</span>
      </p>
      <h1
        id="layer-title"
        className="font-mono text-[clamp(1.4rem,3vw,1.9rem)] leading-tight font-bold tracking-tighter"
      >
        <span className="font-medium text-accent-text opacity-55" aria-hidden="true">
          &lt;
        </span>
        {title}
        <span className="font-medium text-accent-text opacity-55" aria-hidden="true">
          {' /'}&gt;
        </span>
      </h1>
      {intro && (
        <p className="hidden text-[0.9rem] text-muted sm:block">
          <span className="font-mono" aria-hidden="true">
            {'// '}
          </span>
          {intro}
        </p>
      )}
      {children}
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
      className="glass panel pointer-events-auto grid max-h-[55dvh] gap-3 overflow-y-auto p-4 sm:p-5"
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
    <div className="min-w-0 rounded-[var(--radius-sm)] border border-border bg-surface p-2.5">
      <dt className="text-[0.7rem] text-muted">{label}</dt>
      <dd className="truncate">{children}</dd>
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
}) {
  const view = useCityStore((s) => s.view)

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

      <div className="pointer-events-none absolute top-[calc(var(--nav-h)+0.5rem)] left-4 flex max-h-[calc(100dvh-var(--nav-h)-1.5rem)] w-[min(380px,calc(100%-2rem))] flex-col xl:max-h-[calc(100dvh-var(--nav-h)-3.5rem)] gap-3 overflow-y-auto [scrollbar-width:none] sm:left-6">
        <div className="shrink-0">{intro}</div>
        <div className="shrink-0">
          <SceneToolbar>{tools}</SceneToolbar>
        </div>
        {legend && (
          // Takes the remaining height and scrolls on its own, so intro and toolbar stay put.
          <div className="glass panel pointer-events-auto hidden min-h-40 overflow-y-auto overscroll-contain p-4 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] lg:block">
            {legend}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute right-4 bottom-4 grid w-[min(380px,calc(100%-2rem))] sm:right-6">
        {panel}
      </div>

      {hint && (
        <p className="pointer-events-none absolute bottom-4 left-6 hidden font-mono text-[0.72rem] text-muted xl:block">
          <span aria-hidden="true">{'// '}</span>
          {hint}
        </p>
      )}

      {/* Below lg the legend is hidden, so screen readers still get the list there. */}
      {legend ? <div className="lg:hidden">{list?.(false)}</div> : list?.(false)}
    </>
  )
}
