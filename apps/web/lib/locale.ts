import type { Localized } from './cv/schema'

// Replaced by next-intl routing in phase 3.
export const locale = 'en' satisfies keyof Localized

export const t = (value: Localized) => value[locale]

const yearsFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
export const formatYears = (months: number) => yearsFormat.format(months / 12)
