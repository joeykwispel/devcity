'use client'

import type { MouseEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { JoHeader, joHeaderLabels } from '@/components/jo/JoHeader'
import { routing, usePathname, useRouter, type Locale } from '@/i18n/routing'
import { env } from '@/lib/env'
import { LANGUAGE_KEY } from '@/lib/language-redirect'
import { layers } from '@/lib/layers'

/** Locale-less path (`/`, `/career`, `/career/`) to the exported URL (`/en/`, `/en/career/`). */
const url = (locale: Locale, path: string) =>
  `${env.NEXT_PUBLIC_BASE_PATH}/${locale}${path.replace(/\/+$/, '')}/`

const isLocale = (code: string | null): code is Locale => routing.locales.some((l) => l === code)

/**
 * The portfolio header from the design kit. Its links are plain anchors; plain left clicks are
 * handed to the router instead, so moving between layers or languages keeps the app loaded and
 * the URL state (a selected building, the list view).
 */
export function SiteHeader() {
  const t = useTranslations('layers')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return
    }
    const target = e.target as Element

    const lang = target.closest('.jo-nav__lang a')?.getAttribute('hreflang') ?? null
    if (isLocale(lang)) {
      e.preventDefault()
      if (lang === locale) return
      try {
        localStorage.setItem(LANGUAGE_KEY, lang)
      } catch {
        // Storage blocked: the switch still works for this visit.
      }
      const query = Object.fromEntries(new URLSearchParams(window.location.search))
      router.replace({ pathname, query }, { locale: lang, scroll: false })
      return
    }

    const layer = layers.find(
      (l) => target.closest('.jo-nav__link')?.getAttribute('href') === url(locale, l.href),
    )
    if (layer) {
      e.preventDefault()
      router.push(layer.href)
    }
  }

  return (
    // display: contents keeps the wrapper out of the layout; it only listens for clicks.
    <div className="contents" onClickCapture={onClick}>
      <JoHeader
        labels={joHeaderLabels[locale]}
        links={layers.map((l) => ({
          label: t(l.label),
          href: url(locale, l.href),
          current: isActive(l.href),
        }))}
        languages={routing.locales.map((l) => ({
          code: l,
          href: url(l, pathname),
          current: l === locale,
        }))}
      />
    </div>
  )
}
