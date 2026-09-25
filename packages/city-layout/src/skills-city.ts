import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import type { SkillStat } from './skills'

/** Axis-aligned rectangle on the ground plane. x/z are the centre, in world units. */
export interface Plot {
  x: number
  z: number
  width: number
  depth: number
}

export interface District extends Plot {
  id: string
  buildingCount: number
}

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

type Node = { id: string; children?: Node[]; stat?: SkillStat }

/**
 * Lays skills out as a city: one district per category (squarified treemap), one building per
 * skill. Every skill gets an equal lot so districts scale with how many skills they hold; a
 * building's height encodes years of experience. Output is centred on the origin.
 */
export function layoutSkillsCity(
  stats: readonly SkillStat[],
  options: SkillsCityOptions = {},
): CityLayout {
  const {
    size = 100,
    districtGap = 4,
    buildingGap = 1.2,
    minHeight = 0.6,
    heightPerYear = 2.2,
    categoryOrder = [],
  } = options

  const rank = (category: string) => {
    const i = categoryOrder.indexOf(category)
    return i === -1 ? categoryOrder.length : i
  }
  const categories = [...new Set(stats.map((s) => s.category))].sort(
    (a, b) => rank(a) - rank(b) || a.localeCompare(b),
  )

  const root: Node = {
    id: 'city',
    children: categories.map((category) => ({
      id: category,
      children: stats
        .filter((s) => s.category === category)
        // Tallest first so the treemap puts them next to each other; ties stay stable by id.
        .sort((a, b) => b.months - a.months || a.id.localeCompare(b.id))
        .map((stat) => ({ id: stat.id, stat })),
    })),
  }

  const tree = treemap<Node>()
    .tile(treemapSquarify)
    .size([size, size])
    .paddingOuter(districtGap / 2)
    .paddingInner((node) => (node.depth === 0 ? districtGap : buildingGap))(
    hierarchy(root)
      .sum((d) => (d.stat ? 1 : 0))
      .sort(() => 0),
  )

  const half = size / 2
  const toPlot = (n: { x0: number; x1: number; y0: number; y1: number }): Plot => ({
    x: (n.x0 + n.x1) / 2 - half,
    z: (n.y0 + n.y1) / 2 - half,
    width: n.x1 - n.x0,
    depth: n.y1 - n.y0,
  })

  const districts: District[] = (tree.children ?? []).map((d) => ({
    id: d.data.id,
    buildingCount: d.children?.length ?? 0,
    ...toPlot(d),
  }))

  const buildings: Building[] = tree.leaves().flatMap((leaf) => {
    const stat = leaf.data.stat
    if (!stat) return []
    return [
      {
        id: stat.id,
        district: stat.category,
        months: stat.months,
        height: minHeight + (stat.months / 12) * heightPerYear,
        ...toPlot(leaf),
      },
    ]
  })

  return { width: size, depth: size, districts, buildings }
}
