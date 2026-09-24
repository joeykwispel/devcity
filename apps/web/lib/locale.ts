'use client'

import { useFormatter, useLocale } from 'next-intl'
import { useCallback } from 'react'
import type { Localized } from './cv/schema'

/** Picks the current language from a {en, nl} CV value. */
export function useLocalized() {
  const locale = useLocale()
  return useCallback((value: Localized) => value[locale], [locale])
}

export function useFormatters() {
  const format = useFormatter()
  return {
    /** Months as years with at most one decimal, in the current locale (5.5 / 5,5). */
    years: (months: number) => format.number(months / 12, { maximumFractionDigits: 1 }),
    /** YYYY-MM as a short month and year ("Jul 2026" / "jul 2026"). */
    month: (value: string) => {
      const [y, m] = value.split('-').map(Number)
      return format.dateTime(new Date(y!, m! - 1, 1), { month: 'short', year: 'numeric' })
    },
  }
}
