import {
  computeSkillStats,
  layoutSkillsCity,
  monthIndexOf,
  type CityLayout,
  type MonthIndex,
  type SkillStat,
} from '@devcity/city-layout'
import type { Category, CV, Role, Skill } from '@/lib/cv'
import type { Theme } from '@/lib/theme'

export interface SkillsCity {
  layout: CityLayout
  stats: Map<string, SkillStat>
  skills: Map<string, Skill>
  categories: Map<string, Category>
  roles: Map<string, Role>
}

export function buildSkillsCity(cv: CV, now: MonthIndex = monthIndexOf(new Date())): SkillsCity {
  const stats = computeSkillStats(cv.skills, cv.roles, now)
  return {
    layout: layoutSkillsCity(stats, {
      size: 110,
      heightPerYear: 3,
      categoryOrder: cv.categories.map((c) => c.id),
    }),
    stats: new Map(stats.map((s) => [s.id, s])),
    skills: new Map(cv.skills.map((s) => [s.id, s])),
    categories: new Map(cv.categories.map((c) => [c.id, c])),
    roles: new Map(cv.roles.map((r) => [r.id, r])),
  }
}

/** Category colour, matching the chip colours on joeyoosenbrug.nl. Comma syntax so three.js can parse it too. */
export const categoryCss = (hue: number, theme: Theme = 'dark') =>
  theme === 'dark' ? `hsl(${hue}, 60%, 68%)` : `hsl(${hue}, 55%, 38%)`
