import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { SiteHeader } from '@/components/site-header'
import { pageLocale } from '@/i18n/page-locale'
import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import { tokens } from '@/lib/tokens'
// Self-hosted: no requests to Google from the visitor's browser.
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import '../globals.css'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: 'meta' })
  const title = t('title')
  const description = t('description')
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title,
    description,
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/`])),
    },
    // Link previews in chat apps and on social sites; the image is rendered by ./og.png/route.tsx.
    openGraph: {
      images: [{ url: `/${locale}/og.png`, width: 1200, height: 630, alt: title }],
      type: 'website',
      siteName: 'DevCity',
      title,
      description,
      url: `/${locale}/`,
      locale: locale === 'nl' ? 'nl_NL' : 'en_US',
      alternateLocale: locale === 'nl' ? 'en_US' : 'nl_NL',
    },
    twitter: { card: 'summary_large_image', title, description, images: [`/${locale}/og.png`] },
  }
}

export const viewport: Viewport = {
  themeColor: tokens.dark.bg,
}

// Runs before paint so a stored light theme never flashes dark. The jo-theme cookie is shared with
// the portfolio and the other *.joeyoosenbrug.nl apps (see components/jo/jo-header.js).
const themeScript = `try{var m=document.cookie.match(/(?:^|; )jo-theme=(dark|light)/);var t=(m&&m[1])||localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;document.documentElement.classList.add('js')}catch(e){}`

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: 'header' })

  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning>
      <body className="min-h-dvh">
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <a className="skip" href="#main">
          {t('skip')}
        </a>
        <NextIntlClientProvider>
          <SiteHeader />
          <main id="main">{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
