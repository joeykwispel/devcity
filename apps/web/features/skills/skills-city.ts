import {
  computeSkillStats,
  layoutSkillsCity,
  monthIndexOf,
  type CityLayout,
  type MonthIndex,
  type SkillStat,
} from '@devcity/city-layout'
import type { Category, CV, Role, Skill } from '@/lib/cv'

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
