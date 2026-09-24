'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/routing'
import { cv } from '@/lib/cv'
import { layers } from '@/lib/layers'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  const t = useTranslations()
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[var(--nav-h)]">
      <div className="mx-auto flex h-full w-[min(1360px,100%-2rem)] items-center justify-between gap-3">
        <a
          href={cv.profile.links.website}
          className="glass pointer-events-auto shrink-0 rounded-[var(--radius-sm)] px-2.5 py-1 font-mono text-[0.95rem] font-extrabold tracking-tighter text-text no-underline shadow-none"
          aria-label={t('header.portfolio', { name: cv.profile.name })}
        >
          <span className="text-accent-text">&lt;</span>JO
          <span className="text-accent-text">/&gt;</span>
        </a>

        <nav
          aria-label={t('header.layers')}
          className="pointer-events-auto min-w-0 overflow-x-auto [scrollbar-width:none]"
        >
          <ul className="flex gap-1">
            {layers.map((layer, i) => {
              const active = isActive(layer.href)
              return (
                <li key={layer.id}>
                  <Link
                    href={layer.href}
                    className="chip whitespace-nowrap no-underline"
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className="text-accent-text opacity-80">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    {/* On phones only the active layer is spelled out; the rest are numbers. */}
                    <span className={active ? undefined : 'sr-only sm:not-sr-only'}>
                      {t(`layers.${layer.label}`)}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="pointer-events-auto flex shrink-0 gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
