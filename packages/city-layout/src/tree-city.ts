import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from 'd3-hierarchy'
import type { District, Plot } from './district-city'

export interface FileInput {
  path: string
  /** Bytes. */
  size: number
}

export interface FileBuilding extends Plot {
  /** Full path, unique. */
  id: string
  /** Top-level directory, or ROOT_DISTRICT for files in the repository root. */
  district: string
  height: number
  size: number
}

export interface TreeBlock extends Plot {
  /** Directory path. */
  id: string
  /** 1 for top-level directories, 2 for their children, ... */
  level: number
}

export interface TreeCityLayout {
  width: number
  depth: number
  /** Top-level directories. */
  districts: District[]
  /** Every directory below the top level, drawn as raised pavement to show nesting. */
  blocks: TreeBlock[]
  buildings: FileBuilding[]
  /** Files left out because of maxFiles (the smallest ones go first). */
  omitted: number
}

export const ROOT_DISTRICT = '/'

export interface TreeCityOptions {
  /** Smallest ground size. Bigger repositories get a bigger city instead of thinner buildings. */
  size?: number
  /** Narrowest footprint (world units) that most buildings should get. */
  minBuildingWidth?: number
  /** Upper bound on the ground size, to keep huge repositories renderable. */
  maxSize?: number
  /** Beyond this many files, the smallest are left out to keep the scene fast. */
  maxFiles?: number
}

type Node = { name: string; path: string; size: number; children?: Node[] }

/** Footprint grows with the logarithm of the file size so one huge asset cannot flatten the rest. */
export const fileWeight = (size: number) => 1 + Math.log2(1 + size / 512)

/**
 * Height: 100 B is a shed, 10 kB a house, 1 MB a tower. The power above 1 spreads the
 * logarithm out, so a big file clearly stands above a medium one.
 */
export const fileHeight = (size: number) => 0.6 + Math.log2(1 + size / 128) ** 1.5 * 0.5

// Streets in world units. They stay the same width however big the city gets.
const STREET = { district: 3, districtEdge: 2, block: 1, blockEdge: 1, lot: 0.5, lotEdge: 0.5 }

/**
 * A repository as a city: a nested squarified treemap of its directory tree. Top-level
 * directories become districts, deeper directories blocks inside them, files buildings.
 */
export function layoutTreeCity(
  files: readonly FileInput[],
  options: TreeCityOptions = {},
): TreeCityLayout {
  const { size: minSize = 120, minBuildingWidth = 1.4, maxSize = 1600, maxFiles = 6000 } = options

  const kept =
    files.length > maxFiles ? [...files].sort((a, b) => b.size - a.size).slice(0, maxFiles) : files

  // Root files are collected in their own district so the root has only directories.
  const root: Node = { name: '', path: '', size: 0, children: [] }
  const rootFiles: Node = { name: ROOT_DISTRICT, path: ROOT_DISTRICT, size: 0, children: [] }
  const dirs = new Map<string, Node>([['', root]])

  const dirOf = (path: string): Node => {
    const existing = dirs.get(path)
    if (existing) return existing
    const slash = path.lastIndexOf('/')
    const parent = dirOf(slash === -1 ? '' : path.slice(0, slash))
    const node: Node = { name: path.slice(slash + 1), path, size: 0, children: [] }
    parent.children!.push(node)
    dirs.set(path, node)
    return node
  }

  for (const file of kept) {
    const slash = file.path.lastIndexOf('/')
    const parent = slash === -1 ? rootFiles : dirOf(file.path.slice(0, slash))
    parent.children!.push({ name: file.path.slice(slash + 1), path: file.path, size: file.size })
  }
  if (rootFiles.children!.length > 0) root.children!.push(rootFiles)

  const nodes = hierarchy(root)
    .sum((d) => (d.children ? 0 : fileWeight(d.size)))
    // Big things first gives squarify its most readable result.
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  const layoutAt = (size: number) =>
    treemap<Node>()
      .tile(treemapSquarify)
      .size([size, size])
      .paddingOuter((n) =>
        n.depth === 0 ? STREET.districtEdge : n.depth === 1 ? STREET.blockEdge : STREET.lotEdge,
      )
      .paddingInner((n) =>
        n.depth === 0 ? STREET.district : n.depth === 1 ? STREET.block : STREET.lot,
      )(nodes)

  // Start from the area the files need, then grow until the narrow end of the buildings
  // (10th percentile, so one odd sliver does not blow the city up) reaches minBuildingWidth.
  let size = Math.min(
    maxSize,
    Math.max(minSize, Math.sqrt((nodes.value ?? 0) * minBuildingWidth ** 2 * 2)),
  )
  let tree = layoutAt(size)
  for (let i = 0; i < 8 && size < maxSize; i++) {
    const widths = tree
      .leaves()
      .filter((n) => !n.data.children)
      .map((n) => Math.min(n.x1 - n.x0, n.y1 - n.y0))
      .sort((a, b) => a - b)
    const narrow = widths[Math.floor(widths.length * 0.1)] ?? minBuildingWidth
    if (narrow >= minBuildingWidth) break
    size = Math.min(
      maxSize,
      size * Math.min(2, Math.max(1.1, minBuildingWidth / Math.max(narrow, 0.01))),
    )
    tree = layoutAt(size)
  }

  const half = size / 2
  const toPlot = (n: HierarchyRectangularNode<Node>): Plot => ({
    x: (n.x0 + n.x1) / 2 - half,
    z: (n.y0 + n.y1) / 2 - half,
    width: Math.max(n.x1 - n.x0, 0.05),
    depth: Math.max(n.y1 - n.y0, 0.05),
  })

  const districts: District[] = []
  const blocks: TreeBlock[] = []
  const buildings: FileBuilding[] = []

  tree.each((n) => {
    if (n.depth === 0) return
    const top = n.ancestors().find((a) => a.depth === 1)!.data.path
    if (n.data.children) {
      if (n.depth === 1)
        districts.push({ id: n.data.path, buildingCount: n.leaves().length, ...toPlot(n) })
      else blocks.push({ id: n.data.path, level: n.depth - 1, ...toPlot(n) })
    } else {
      const plot = toPlot(n)
      // Leave a sliver of street between neighbouring files.
      const inset = Math.min(plot.width, plot.depth) * 0.08
      buildings.push({
        id: n.data.path,
        district: top,
        size: n.data.size,
        height: fileHeight(n.data.size),
        depth: plot.depth - inset,
        width: plot.width - inset,
        x: plot.x,
        z: plot.z,
      })
    }
  })

  return {
    width: size,
    depth: size,
    districts,
    blocks,
    buildings,
    omitted: files.length - kept.length,
  }
}
