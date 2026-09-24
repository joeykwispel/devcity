import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'

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

export interface DistrictInput {
  id: string
  items: readonly { id: string; weight: number; height: number }[]
}

export interface PlacedBuilding extends Plot {
  id: string
  district: string
  height: number
}

export interface DistrictCityLayout {
  width: number
  depth: number
  districts: District[]
  buildings: PlacedBuilding[]
}

export interface DistrictCityOptions {
  /** Ground size of the whole city, before streets are cut out. */
  size?: number
  /** Street width between districts. */
  districtGap?: number
  /** Street width between buildings inside a district. */
  buildingGap?: number
}

type Node = { id: string; weight: number; height?: number; children?: Node[] }

/**
 * Two-level squarified treemap: districts, then buildings. A building's footprint is proportional
 * to its weight and a district's to the sum of its buildings. Input order is kept (the treemap
 * does not re-sort), so callers control what sits next to what. Output is centred on the origin.
 */
export function layoutDistrictCity(
  input: readonly DistrictInput[],
  options: DistrictCityOptions = {},
): DistrictCityLayout {
  const { size = 100, districtGap = 4, buildingGap = 1.2 } = options

  const root: Node = {
    id: '',
    weight: 0,
    children: input
      .filter((d) => d.items.some((i) => i.weight > 0))
      .map((d) => ({
        id: d.id,
        weight: 0,
        children: d.items
          .filter((i) => i.weight > 0)
          .map((i) => ({ id: i.id, weight: i.weight, height: i.height })),
      })),
  }

  const tree = treemap<Node>()
    .tile(treemapSquarify)
    .size([size, size])
    .paddingOuter(districtGap / 2)
    .paddingInner((node) => (node.depth === 0 ? districtGap : buildingGap))(
    hierarchy(root)
      .sum((d) => (d.children ? 0 : d.weight))
      .sort(() => 0),
  )

  const half = size / 2
  const toPlot = (n: { x0: number; x1: number; y0: number; y1: number }): Plot => ({
    x: (n.x0 + n.x1) / 2 - half,
    z: (n.y0 + n.y1) / 2 - half,
    width: Math.max(n.x1 - n.x0, 0),
    depth: Math.max(n.y1 - n.y0, 0),
  })

  return {
    width: size,
    depth: size,
    districts: (tree.children ?? []).map((d) => ({
      id: d.data.id,
      buildingCount: d.children?.length ?? 0,
      ...toPlot(d),
    })),
    buildings: tree.leaves().flatMap((leaf) =>
      leaf.depth === 2 && leaf.parent
        ? [
            {
              id: leaf.data.id,
              district: leaf.parent.data.id,
              height: leaf.data.height ?? 0,
              ...toPlot(leaf),
            },
          ]
        : [],
    ),
  }
}
