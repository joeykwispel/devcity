import { formatYears, t } from '@/lib/locale'
import type { SkillsCity } from './skills-city'

/** Screen-reader equivalent of the 3D city. A visible list view follows in phase 7. */
export function SkillsList({ city }: { city: SkillsCity }) {
  return (
    <div className="sr-only">
      {[...city.categories.values()].map((category) => (
        <section key={category.id}>
          <h2>{t(category.label)}</h2>
          <ul>
            {city.layout.buildings
              .filter((b) => b.district === category.id)
              .map((b) => {
                const skill = city.skills.get(b.id)
                const name = skill?.label ? t(skill.label) : b.id
                return (
                  <li key={b.id}>
                    {name}: {b.months > 0 ? `${formatYears(b.months)} years` : 'listed on CV'}
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
