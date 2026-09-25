import type { Preview } from '@storybook/nextjs-vite'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { useEffect } from 'react'
import en from '../messages/en.json'
import nl from '../messages/nl.json'
import '../app/globals.css'

const messages = { en, nl }

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

/**
 * Stories render with the same tokens, fonts and translations as the site. The toolbar switches
 * the theme (dark/light, like the theme toggle) and the language (en/nl).
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: { icon: 'mirror', items: ['dark', 'light'], dynamicTitle: true },
    },
    locale: {
      description: 'Language',
      toolbar: { icon: 'globe', items: ['en', 'nl'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'dark', locale: 'en' },
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, { globals }) => {
      const theme = globals.theme === 'light' ? 'light' : 'dark'
      const locale = globals.locale === 'nl' ? 'nl' : 'en'
      useEffect(() => {
        document.documentElement.dataset.theme = theme
        document.documentElement.lang = locale
      }, [theme, locale])
      return (
        <NextIntlClientProvider
          locale={locale}
          messages={messages[locale]}
          timeZone="Europe/Amsterdam"
        >
          <div className={`${inter.variable} ${mono.variable} p-6 font-sans text-text`}>
            <Story />
          </div>
        </NextIntlClientProvider>
      )
    },
  ],
}

export default preview
