'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { exportPng } from '@/components/scene/export-png'
import { useSceneStore } from '@/components/scene/scene-store'
import { usePathname } from '@/i18n/routing'
import { useCityStore, type CityViewMode } from '@/lib/city-store'
import { layers } from '@/lib/layers'

function ShareButton() {
  const t = useTranslations('toolbar')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(id)
  }, [copied])

  const share = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Clipboard blocked (insecure context, permissions): fall back to a prompt to copy by hand.
      window.prompt(t('copyManually'), url)
    }
  }

  return (
    <Button size="sm" onClick={share} aria-live="polite">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {copied ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </>
        )}
      </svg>
      {copied ? t('copied') : t('share')}
    </Button>
  )
}

function SavePngButton() {
  const t = useTranslations()
  const canvas = useSceneStore((s) => s.canvas)
  const pathname = usePathname()
  const layer =
    layers.find((l) => (l.href === '/' ? pathname === '/' : pathname.startsWith(l.href))) ??
    layers[0]

  const save = () => {
    if (!canvas) return
    const name = t(`layers.${layer.label}`)
    // Local date, as the visitor sees it on their clock.
    const now = new Date()
    const date = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((n) => String(n).padStart(2, '0'))
      .join('-')
    void exportPng(
      canvas,
      t('toolbar.pngCaption', { layer: name }),
      `devcity-${layer.id}-${date}.png`,
    )
  }

  return (
    <Button size="sm" onClick={save} disabled={!canvas}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
      {t('toolbar.savePng')}
    </Button>
  )
}

function MinimapToggle() {
  const t = useTranslations('toolbar')
  const show = useSceneStore((s) => s.showMinimap)
  const toggle = useSceneStore((s) => s.toggleMinimap)
  return (
    <Button
      size="sm"
      onClick={toggle}
      aria-pressed={show}
      className="hidden lg:inline-flex aria-pressed:text-text"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
      </svg>
      {t('minimap')}
    </Button>
  )
}

/** View switch (3D city or accessible list) and share link, plus layer-specific tools. */
export function SceneToolbar({ children }: { children?: ReactNode }) {
  const t = useTranslations('toolbar')
  const view = useCityStore((s) => s.view)
  const setView = useCityStore((s) => s.setView)

  return (
    <div className="glass panel pointer-events-auto flex flex-wrap items-center gap-1.5 p-1.5">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => value && setView(value as CityViewMode)}
        aria-label={t('view')}
      >
        <ToggleGroupItem value="city">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 21h18M5 21V9l5-3v15M10 21V4l6 3v14M16 21V11l3 1.5V21" />
          </svg>
          {t('city')}
        </ToggleGroupItem>
        <ToggleGroupItem value="list">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
          </svg>
          {t('list')}
        </ToggleGroupItem>
      </ToggleGroup>
      <ShareButton />
      {view === 'city' && (
        <>
          <SavePngButton />
          <MinimapToggle />
        </>
      )}
      {children}
    </div>
  )
}
