import { describe, expect, it } from 'vitest'
import type { SkillStat } from './skills'
import { layoutSkillsCity, type Plot } from './skills-city'

const stat = (id: string, category: string, months: number): SkillStat => ({
  id,
  category,
  months,
  roleIds: [],
  firstMonth: null,
})

const stats: SkillStat[] = [
  ...Array.from({ length: 12 }, (_, i) => stat(`fe${i}`, 'frontend', i * 6)),
  ...Array.from({ length: 6 }, (_, i) => stat(`be${i}`, 'backend', i * 4)),
  stat('dutch', 'languages', 0),
]

const EPS = 1e-9
const contains = (outer: Plot, inner: Plot) =>
  inner.x - inner.width / 2 >= outer.x - outer.width / 2 - EPS &&
  inner.x + inner.width / 2 <= outer.x + outer.width / 2 + EPS &&
  inner.z - inner.depth / 2 >= outer.z - outer.depth / 2 - EPS &&
  inner.z + inner.depth / 2 <= outer.z + outer.depth / 2 + EPS
const overlaps = (a: Plot, b: Plot) =>
  Math.abs(a.x - b.x) < (a.width + b.width) / 2 - EPS &&
  Math.abs(a.z - b.z) < (a.depth + b.depth) / 2 - EPS

describe('layoutSkillsCity', () => {
  const city = layoutSkillsCity(stats, { size: 100, categoryOrder: ['frontend', 'backend'] })

  it('creates one district per category, in the requested order', () => {
    expect(city.districts.map((d) => d.id)).toEqual(['frontend', 'backend', 'languages'])
    expect(city.districts.map((d) => d.buildingCount)).toEqual([12, 6, 1])
  })

  it('creates one building per skill', () => {
    expect(city.buildings).toHaveLength(stats.length)
    expect(new Set(city.buildings.map((b) => b.id)).size).toBe(stats.length)
  })

  it('keeps every building inside its own district and the city bounds', () => {
    const bounds: Plot = { x: 0, z: 0, width: 100, depth: 100 }
    for (const b of city.buildings) {
      const district = city.districts.find((d) => d.id === b.district)!
      expect(contains(district, b)).toBe(true)
      expect(contains(bounds, b)).toBe(true)
    }
  })

  it('never overlaps buildings or districts', () => {
    for (const list of [city.buildings, city.districts] as Plot[][]) {
      for (let i = 0; i < list.length; i++)
        for (let j = i + 1; j < list.length; j++) expect(overlaps(list[i]!, list[j]!)).toBe(false)
    }
  })

  it('makes more experience taller, with a minimum height for listed-only skills', () => {
    const h = (id: string) => city.buildings.find((b) => b.id === id)!.height
    expect(h('fe11')).toBeGreaterThan(h('fe5'))
    expect(h('dutch')).toBe(0.6)
  })

  it('scales districts with the number of skills', () => {
    const area = (id: string) => {
      const d = city.districts.find((x) => x.id === id)!
      return d.width * d.depth
    }
    expect(area('frontend')).toBeGreaterThan(area('backend'))
  })

  it('is deterministic', () => {
    expect(layoutSkillsCity(stats, { categoryOrder: ['frontend', 'backend'] })).toEqual(city)
  })

  it('handles an empty CV', () => {
    expect(layoutSkillsCity([])).toMatchObject({ districts: [], buildings: [] })
  })
})
