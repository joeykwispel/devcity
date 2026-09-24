'use client'

import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useCallback } from 'react'
import type { Localized } from './cv/schema'

/** Picks the current language from a {en, nl} CV value. */
export function useLocalized() {
  const locale = useLocale()
  return useCallback((value: Localized) => value[locale], [locale])
}

export function useFormatters() {
  const format = useFormatter()
  const t = useTranslations('common')
  return {
    /** Months as years with at most one decimal, in the current locale (5.5 / 5,5). */
    years: (months: number) => format.number(months / 12, { maximumFractionDigits: 1 }),
    /** YYYY-MM as a short month and year ("Jul 2026" / "jul 2026"). */
    month: (value: string) => {
      const [y, m] = value.split('-').map(Number)
      return format.dateTime(new Date(y!, m! - 1, 1), { month: 'short', year: 'numeric' })
    },
    /** Months as "1 yr 3 mos" / "1 jr 3 mnd". */
    duration: (months: number) => {
      const y = Math.floor(months / 12)
      const m = months % 12
      return [y && t('durationYears', { count: y }), (m || !y) && t('durationMonths', { count: m })]
        .filter(Boolean)
        .join(' ')
    },
  }
}
