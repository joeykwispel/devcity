import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import { languageRedirectScript } from '@/lib/language-redirect'

const fallback = `${env.NEXT_PUBLIC_BASE_PATH}/${routing.defaultLocale}/`

export default function LanguageRedirect() {
  return (
    <html lang="en">
      <head>
        <title>DevCity · Joey Oosenbrug</title>
        <meta name="robots" content="noindex" />
        <script dangerouslySetInnerHTML={{ __html: languageRedirectScript }} />
        <noscript>
          <meta httpEquiv="refresh" content={`0; url=${fallback}`} />
        </noscript>
      </head>
      <body style={{ background: '#0a0e17', color: '#e6e9f2', fontFamily: 'system-ui' }}>
        <p>
          <a href={fallback} style={{ color: '#7dd3c0' }}>
            DevCity
          </a>
        </p>
      </body>
    </html>
  )
}
