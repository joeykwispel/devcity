'use client'

import { cv } from '@/lib/cv'
import { t } from '@/lib/locale'
import { useTheme } from '@/lib/theme'
import { categoryCss } from './skills-city'
import { useSkillsStore } from './store'

const counts = new Map<string, number>()
for (const s of cv.skills) counts.set(s.category, (counts.get(s.category) ?? 0) + 1)

export function SkillsLegend() {
  const theme = useTheme()
  const focused = useSkillsStore((s) => s.focusedCategory)
  const focusCategory = useSkillsStore((s) => s.focusCategory)

  return (
    <section
      aria-labelledby="skills-title"
      className="glass panel pointer-events-auto grid gap-3 p-4 sm:p-5"
    >
      <p className="flex items-center font-mono text-[0.8rem] text-muted" aria-hidden="true">
        <span className="mr-2.5 font-bold text-accent-text">01</span>
        ~/joey/<span className="text-text">skills</span>
        <span className="text-accent-2-text">.ts</span>
      </p>
      <h1
        id="skills-title"
        className="font-mono text-[clamp(1.4rem,3vw,1.9rem)] leading-tight font-bold tracking-tighter"
      >
        <span className="font-medium text-accent-text opacity-55" aria-hidden="true">
          &lt;
        </span>
        Skills
        <span className="font-medium text-accent-text opacity-55" aria-hidden="true">
          {' /'}&gt;
        </span>
      </h1>
      <p className="hidden text-[0.9rem] text-muted sm:block">
        <span className="font-mono" aria-hidden="true">
          {'// '}
        </span>
        Every skill on my CV is a building. The taller it is, the more years I have used it in real
        projects.
      </p>

      <ul
        className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:pb-0"
        aria-label="Districts"
      >
        {cv.categories.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              className="chip h-8 whitespace-nowrap"
              aria-pressed={focused === c.id}
              onClick={() => focusCategory(c.id)}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: categoryCss(c.hue, theme) }}
                aria-hidden="true"
              />
              {t(c.label)}
              <span className="opacity-70">{counts.get(c.id) ?? 0}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
