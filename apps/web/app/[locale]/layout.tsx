import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { SiteHeader } from '@/components/site-header'
import { pageLocale } from '@/i18n/page-locale'
import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import '../globals.css'

// Self-hosted at build time by next/font: no requests to Google from the visitor's browser.
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const locale = await pageLocale(params)
  const t = await getTranslations({ locale, namespace: 'meta' })
  return {
    metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
    title: t('title'),
    description: t('description'),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/`])),
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0a0e17',
}

// Runs before paint so a stored light theme never flashes dark.
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const locale = await pageLocale(params)

  return (
    <html
      lang={locale}
      data-theme="dark"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <Script id="theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <NextIntlClientProvider>
          <SiteHeader />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
