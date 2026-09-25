import { layoutDistrictCity, type District, type Plot } from './district-city'
import type { SkillStat } from './skills'

export type { District, Plot }

export interface Building extends Plot {
  id: string
  district: string
  height: number
  months: number
}

export interface CityLayout {
  width: number
  depth: number
  districts: District[]
  buildings: Building[]
}

export interface SkillsCityOptions {
  /** Ground size of the whole city, before streets are cut out. */
  size?: number
  /** Street width between districts. */
  districtGap?: number
  /** Street width between buildings inside a district. */
  buildingGap?: number
  /** Height of a skill with no role experience (listed on the CV only). */
  minHeight?: number
  /** Extra height per year of experience. */
  heightPerYear?: number
  /** District order; unknown categories are appended alphabetically. */
  categoryOrder?: readonly string[]
}

/**
 * Lays skills out as a city: one district per category (squarified treemap), one building per
 * skill. Every skill gets an equal lot so districts scale with how many skills they hold; a
 * building's height encodes years of experience. Output is centred on the origin.
 */
export function layoutSkillsCity(
  stats: readonly SkillStat[],
  options: SkillsCityOptions = {},
): CityLayout {
  const { minHeight = 0.6, heightPerYear = 2.2, categoryOrder = [], ...rest } = options

  const rank = (category: string) => {
    const i = categoryOrder.indexOf(category)
    return i === -1 ? categoryOrder.length : i
  }
  const categories = [...new Set(stats.map((s) => s.category))].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  )
  const months = new Map(stats.map((s) => [s.id, s.months]))

  const layout = layoutDistrictCity(
    categories.map((category) => ({
      id: category,
      items: stats
        .filter((s) => s.category === category)
        // Tallest first so the treemap puts them next to each other; ties stay stable by id.
        .sort((a, b) => b.months - a.months || a.id.localeCompare(b.id))
        .map((s) => ({ id: s.id, weight: 1, height: minHeight + (s.months / 12) * heightPerYear })),
    })),
    rest,
  )

  return {
    ...layout,
    buildings: layout.buildings.map((b) => ({ ...b, months: months.get(b.id) ?? 0 })),
  }
}
