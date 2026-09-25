import { cv } from '@/lib/cv'
import { ThemeToggle } from './theme-toggle'

const layers = [
  { id: 'skills', label: 'Skills', ready: true },
  { id: 'career', label: 'Career', ready: false },
  { id: 'repos', label: 'My repos', ready: false },
  { id: 'any-repo', label: 'Any repo', ready: false },
] as const

export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 h-[var(--nav-h)]">
      <div className="mx-auto flex h-full w-[min(1360px,100%-2rem)] items-center justify-between gap-4">
        <a
          href={cv.profile.links.website}
          className="glass pointer-events-auto rounded-[var(--radius-sm)] px-2.5 py-1 font-mono text-[0.95rem] font-extrabold tracking-tighter text-text no-underline shadow-none"
          aria-label={`${cv.profile.name}, portfolio`}
        >
          <span className="text-accent-text">&lt;</span>JO
          <span className="text-accent-text">/&gt;</span>
        </a>

        <nav
          aria-label="City layers"
          className="pointer-events-auto min-w-0 overflow-x-auto [scrollbar-width:none]"
        >
          <ul className="flex gap-1">
            {layers.map((layer, i) => (
              <li key={layer.id}>
                <button
                  type="button"
                  className="chip whitespace-nowrap"
                  aria-current={layer.id === 'skills' ? 'page' : undefined}
                  disabled={!layer.ready}
                  title={layer.ready ? undefined : 'Coming soon'}
                >
                  <span className="text-accent-text opacity-80">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  {/* On phones only the active layer is spelled out; the rest are numbers. */}
                  <span className={layer.ready ? undefined : 'hidden sm:inline'}>
                    {layer.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
