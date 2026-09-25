import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import { languageRedirectScript } from '@/lib/language-redirect'
import './globals.css'

const fallback = `${env.NEXT_PUBLIC_BASE_PATH}/${routing.defaultLocale}/`

export default function LanguageRedirect() {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <title>DevCity · Joey Oosenbrug</title>
        <meta name="robots" content="noindex" />
        <script dangerouslySetInnerHTML={{ __html: languageRedirectScript }} />
        <noscript>
          <meta httpEquiv="refresh" content={`0; url=${fallback}`} />
        </noscript>
      </head>
      <body>
        <p>
          <a href={fallback}>DevCity</a>
        </p>
      </body>
    </html>
  )
}
