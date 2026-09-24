import { createNavigation } from 'next-intl/navigation'
import { defineRouting } from 'next-intl/routing'

// Static export: no middleware, so every URL carries its locale prefix (/en/..., /nl/...).
export const routing = defineRouting({
  locales: ['en', 'nl'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]

export const { Link, usePathname, useRouter } = createNavigation(routing)
