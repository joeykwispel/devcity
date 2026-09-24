'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/routing'
import { LANGUAGE_KEY } from '@/lib/language-redirect'

export function LanguageSwitcher() {
  const t = useTranslations('header')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const next = locale === 'en' ? 'nl' : 'en'

  const onClick = () => {
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
    <button
      type="button"
      className="chip font-bold uppercase"
      onClick={onClick}
      lang={next}
      aria-label={t('switchTo')}
      title={t('switchTo')}
    >
      <span className="text-text">{locale}</span>
      <span aria-hidden="true" className="opacity-50">
        /
      </span>
      <span>{next}</span>
    </button>
  )
}
