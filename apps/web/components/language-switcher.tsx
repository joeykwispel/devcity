'use client'

import { useLocale, useTranslations } from 'next-intl'
import { routing, usePathname, useRouter, type Locale } from '@/i18n/routing'
import { LANGUAGE_KEY } from '@/lib/language-redirect'

// Each language is named in itself, whatever the current locale.
const names: Record<Locale, string> = { en: 'English', nl: 'Nederlands' }

export function LanguageSwitcher() {
  const t = useTranslations('header')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const select = (next: Locale) => {
    if (next === locale) return
    try {
      localStorage.setItem(LANGUAGE_KEY, next)
    } catch {
      // Storage blocked: the switch still works for this visit.
    }
    // Keep the current layer (pathname) and URL state (query, e.g. a selected building).
    const query = Object.fromEntries(new URLSearchParams(window.location.search))
    router.replace({ pathname, query }, { locale: next, scroll: false })
  }

  return (
    <div className="lang-switch panel" role="group" aria-label={t('language')}>
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-label={names[l]}
          title={names[l]}
          aria-current={l === locale ? 'true' : undefined}
          onClick={() => select(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
