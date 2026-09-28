import { hierarchy, treemap, treemapSquarify, type HierarchyRectangularNode } from 'd3-hierarchy'
import type { District, Plot } from './district-city'

export interface FileInput {
  path: string
  /** Bytes. */
  size: number
}

export interface FileBuilding extends Plot {
  /** Full path, unique. In a city of several repositories it starts with the repository id. */
  id: string
  /** Path inside its repository. */
  path: string
  /** Repository id in a city of several repositories, '' in a single-repository city. */
  repo: string
  /**
   * Top-level directory (or ROOT_DISTRICT for root files) in a single-repository city, the
   * repository id in a city of several.
   */
  district: string
  height: number
  size: number
}

export interface TreeBlock extends Plot {
  /** Directory path (prefixed with the repository id in a city of several repositories). */
  id: string
  /** 1 for the directories right under a district, 2 for their children, ... */
  level: number
}

export interface TreeCityLayout {
  width: number
  depth: number
  /** Top-level directories, or repositories in a city of several. */
  districts: District[]
  /** Every directory below a district, drawn as raised pavement to show nesting. */
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

export interface RepoFiles {
  /** Unique id, e.g. owner/name. */
  id: string
  files: readonly FileInput[]
}

type Node = { name: string; path: string; size: number; repo: string; children?: Node[] }

/** Footprint grows with the logarithm of the file size so one huge asset cannot flatten the rest. */
export const fileWeight = (size: number) => 1 + Math.log2(1 + size / 512)

/**
 * Height: 100 B is a shed, 10 kB a house, 1 MB a tower. The power above 1 spreads the
 * logarithm out, so a big file clearly stands above a medium one.
 */
export const fileHeight = (size: number) => 0.6 + Math.log2(1 + size / 128) ** 1.5 * 0.5

// Streets in world units. They stay the same width however big the city gets.
const STREET = { district: 3, districtEdge: 2, block: 1, blockEdge: 1, lot: 0.5, lotEdge: 0.5 }

/** Keeps the biggest files when there are more than `max`. */
const keepBiggest = (files: readonly FileInput[], max: number) =>
  files.length > max ? [...files].sort((a, b) => b.size - a.size).slice(0, max) : files

/**
 * Directory tree of one repository under `root`. Paths get `prefix` so they stay unique across
 * repositories. Root files go into `rootFiles` when given, else straight into `root`.
 */
function addTree(
  root: Node,
  files: readonly FileInput[],
  repo: string,
  prefix: string,
  rootFiles?: Node,
) {
  const dirs = new Map<string, Node>([['', root]])
  const dirOf = (path: string): Node => {
    const existing = dirs.get(path)
    if (existing) return existing
    const slash = path.lastIndexOf('/')
    const parent = dirOf(slash === -1 ? '' : path.slice(0, slash))
    const node: Node = {
      name: path.slice(slash + 1),
      path: prefix + path,
      size: 0,
      repo,
      children: [],
    }
    parent.children!.push(node)
    dirs.set(path, node)
    return node
  }

  for (const file of files) {
    const slash = file.path.lastIndexOf('/')
    const parent = slash === -1 ? (rootFiles ?? root) : dirOf(file.path.slice(0, slash))
    parent.children!.push({
      name: file.path.slice(slash + 1),
      path: prefix + file.path,
      size: file.size,
      repo,
    })
  }
}

/**
 * A repository as a city: a nested squarified treemap of its directory tree. Top-level
 * directories become districts, deeper directories blocks inside them, files buildings.
 */
export function layoutTreeCity(
  files: readonly FileInput[],
  options: TreeCityOptions = {},
): TreeCityLayout {
  const kept = keepBiggest(files, options.maxFiles ?? 6000)

  // Root files are collected in their own district so the root has only directories.
  const root: Node = { name: '', path: '', size: 0, repo: '', children: [] }
  const rootFiles: Node = {
    name: ROOT_DISTRICT,
    path: ROOT_DISTRICT,
    size: 0,
    repo: '',
    children: [],
  }
  addTree(root, kept, '', '', rootFiles)
  if (rootFiles.children!.length > 0) root.children!.push(rootFiles)

  return layoutNodes(root, options, files.length - kept.length)
}

/**
 * Several repositories as one city: every repository is a district, its directories blocks and
 * its files buildings. Bigger repositories get bigger districts. With more files than maxFiles,
 * every repository keeps a fair share of its biggest files, so small ones never disappear.
 */
export function layoutReposCity(
  repos: readonly RepoFiles[],
  options: TreeCityOptions = {},
): TreeCityLayout {
  const { maxFiles = 24_000 } = options
  const root: Node = { name: '', path: '', size: 0, repo: '', children: [] }

  // Smallest repositories first: whatever they leave of their share goes to the bigger ones.
  let budget = maxFiles
  let omitted = 0
  const bySize = [...repos].sort((a, b) => a.files.length - b.files.length)
  bySize.forEach((repo, i) => {
    const kept = keepBiggest(repo.files, Math.floor(budget / (bySize.length - i)))
    budget -= kept.length
    omitted += repo.files.length - kept.length
    if (kept.length === 0) return
    const node: Node = { name: repo.id, path: repo.id, size: 0, repo: repo.id, children: [] }
    addTree(node, kept, repo.id, `${repo.id}/`)
    root.children!.push(node)
  })

  return layoutNodes(root, { maxSize: 4000, ...options }, omitted)
}

function layoutNodes(root: Node, options: TreeCityOptions, omitted: number): TreeCityLayout {
  const { size: minSize = 120, minBuildingWidth = 1.4, maxSize = 1600 } = options

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
    const top = n.ancestors().find((a) => a.depth === 1)!.data
    if (n.data.children) {
      if (n.depth === 1)
        districts.push({ id: n.data.path, buildingCount: n.leaves().length, ...toPlot(n) })
      else blocks.push({ id: n.data.path, level: n.depth - 1, ...toPlot(n) })
    } else {
      const plot = toPlot(n)
      // Leave a sliver of street between neighbouring files.
      const inset = Math.min(plot.width, plot.depth) * 0.08
      const { path, repo } = n.data
      buildings.push({
        id: path,
        path: repo ? path.slice(repo.length + 1) : path,
        repo,
        district: top.path,
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
    omitted,
  }
}
