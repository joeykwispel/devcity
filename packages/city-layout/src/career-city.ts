import { type MonthIndex, type Period, rangeOf } from './dates'
import type { Plot } from './skills-city'

export interface CareerRoleInput extends Period {
  id: string
  kind: 'work' | 'internship' | 'other'
  /** Number of skills used; drives the building height. */
  stackSize: number
}

export interface CareerEducationInput {
  id: string
  kind: 'education' | 'certification'
  startYear: number
  endYear: number
  /** Courses in a certification; drives its height. */
  courseCount?: number
}

export interface CareerBuilding extends Plot {
  id: string
  side: 'work' | 'education'
  kind: CareerRoleInput['kind'] | CareerEducationInput['kind']
  /** Row away from the boulevard: 0 is the front row, overlapping periods move back. */
  lane: number
  height: number
  start: MonthIndex
  end: MonthIndex
}

export interface CareerCityLayout {
  width: number
  depth: number
  /** The two sides of the boulevard, as district plots. */
  districts: (Plot & { id: 'work' | 'education' })[]
  buildings: CareerBuilding[]
  /** January of each year on the timeline, for the year markers along the boulevard. */
  years: { year: number; x: number }[]
}

export interface CareerCityOptions {
  /** Length of the timeline in world units. */
  size?: number
  /** Width of the boulevard between the two sides. */
  street?: number
  laneDepth?: number
  laneGap?: number
  /** Gap between consecutive buildings on the same lane, in world units. */
  gap?: number
}

/** Greedy interval partitioning: each item goes to the first lane that is free at its start. */
export function assignLanes<T extends { start: number; end: number }>(items: readonly T[]) {
  const laneEnds: number[] = []
  const lanes = new Map<T, number>()
  for (const item of [...items].sort((a, b) => a.start - b.start || a.end - b.end)) {
    let lane = laneEnds.findIndex((end) => end < item.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = item.end
    lanes.set(item, lane)
  }
  return lanes
}

/**
 * Lays a career out along a boulevard: time runs along x, work on one side, education and
 * training on the other. Output is centred on the origin.
 */
export function layoutCareerCity(
  roles: readonly CareerRoleInput[],
  education: readonly CareerEducationInput[],
  now: MonthIndex,
  options: CareerCityOptions = {},
): CareerCityLayout {
  const { size = 120, street = 8, laneDepth = 12, laneGap = 3, gap = 0.6 } = options

  const periods = [
    ...roles.map((r) => {
      const [start, end] = rangeOf(r, now)
      return { id: r.id, side: 'work' as const, kind: r.kind, start, end, weight: r.stackSize }
    }),
    ...education.map((e) => ({
      id: e.id,
      side: 'education' as const,
      kind: e.kind,
      // A degree spans its years; a certification is shown in December of its year.
      start: e.kind === 'education' ? e.startYear * 12 + 8 : e.endYear * 12 + 11,
      end: e.kind === 'education' ? e.endYear * 12 + 6 : e.endYear * 12 + 11,
      weight: e.courseCount ?? 0,
    })),
  ]

  if (periods.length === 0)
    return { width: size, depth: street, districts: [], buildings: [], years: [] }

  const first = Math.min(...periods.map((p) => p.start))
  const last = Math.max(now, ...periods.map((p) => p.end))
  const months = last - first + 1
  const unit = size / months
  const x0 = -size / 2
  const monthX = (m: number) => x0 + (m - first) * unit

  const buildings: CareerBuilding[] = []
  for (const side of ['work', 'education'] as const) {
    const onSide = periods.filter((p) => p.side === side)
    const lanes = assignLanes(onSide)
    const direction = side === 'work' ? -1 : 1
    for (const p of onSide) {
      const lane = lanes.get(p) ?? 0
      // A certification is a moment, not a period: a square tower centred on its month.
      const point = p.kind === 'certification'
      const depth = point ? laneDepth * 0.5 : laneDepth
      const width = point ? depth : Math.max(unit * (p.end - p.start + 1) - gap, 1.4)
      const x = point ? monthX(p.start) + unit / 2 : monthX(p.start) + width / 2 + gap / 2
      const height =
        p.side === 'work' ? 2 + p.weight * 0.55 : p.kind === 'education' ? 6 : 2.5 + p.weight * 1.2
      buildings.push({
        id: p.id,
        side,
        kind: p.kind,
        lane,
        height: p.kind === 'other' ? Math.min(height, 3) : height,
        start: p.start,
        end: p.end,
        x: Math.min(Math.max(x, x0 + width / 2), -x0 - width / 2),
        z: direction * (street / 2 + laneGap + lane * (laneDepth + laneGap) + laneDepth / 2),
        width,
        depth,
      })
    }
  }

  const laneCount = (side: 'work' | 'education') =>
    Math.max(0, ...buildings.filter((b) => b.side === side).map((b) => b.lane + 1))
  const sideDepth = (side: 'work' | 'education') =>
    laneCount(side) * (laneDepth + laneGap) + laneGap

  const districts = (['work', 'education'] as const)
    .filter((side) => laneCount(side) > 0)
    .map((side) => {
      const depth = sideDepth(side)
      const direction = side === 'work' ? -1 : 1
      return { id: side, x: 0, z: direction * (street / 2 + depth / 2), width: size, depth }
    })

  const years: CareerCityLayout['years'] = []
  for (let year = Math.ceil(first / 12); year * 12 <= last; year++)
    years.push({ year, x: monthX(year * 12) })

  return {
    width: size,
    depth: street + sideDepth('work') + sideDepth('education'),
    districts,
    buildings,
    years,
  }
}
