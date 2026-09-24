import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import './globals.css'

// Rendered for unknown URLs (404.html in the static export), outside any locale.
export default function NotFound() {
  return (
    <html lang="en" data-theme="dark">
      <body className="grid min-h-dvh place-items-center p-6 text-center">
        <main className="glass panel grid max-w-md gap-3 p-6">
          <p className="font-mono text-sm text-muted">
            <span className="font-bold text-accent-text">404</span> ~/joey/
            <span className="text-text">not-found</span>
            <span className="text-accent-2-text">.ts</span>
          </p>
          <h1 className="font-mono text-2xl font-bold tracking-tighter">
            <span className="text-accent-text opacity-55">&lt;</span>Lost in the city
            <span className="text-accent-text opacity-55"> /&gt;</span>
          </h1>
          <p className="text-muted">This street does not exist. Deze straat bestaat niet.</p>
          <p className="flex justify-center gap-2">
            {routing.locales.map((l) => (
              <a key={l} className="chip" href={`${env.NEXT_PUBLIC_BASE_PATH}/${l}/`}>
                /{l}
              </a>
            ))}
          </p>
        </main>
      </body>
    </html>
  )
}
