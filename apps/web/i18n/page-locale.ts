import { notFound } from 'next/navigation'
import { hasLocale } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing, type Locale } from './routing'

/** Validates the [locale] segment and enables static rendering for it. */
export async function pageLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return locale
}

/** "<Layer> · DevCity · Joey Oosenbrug", so every layer has its own document title. */
export async function layerMetadata(
  params: Promise<{ locale: string }>,
  layer: 'skills' | 'career' | 'repos' | 'anyRepo',
) {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale })
  return { title: t('meta.layerTitle', { layer: t(`layers.${layer}`) }) }
}
