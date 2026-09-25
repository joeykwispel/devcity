import { describe, expect, it } from 'vitest'
import { fileHeight, layoutTreeCity, ROOT_DISTRICT } from './tree-city'

const files = [
  { path: 'README.md', size: 2_000 },
  { path: 'package.json', size: 800 },
  { path: 'src/index.ts', size: 4_000 },
  { path: 'src/lib/util.ts', size: 12_000 },
  { path: 'src/lib/deep/x.ts', size: 300 },
  { path: 'docs/guide.md', size: 30_000 },
]

const EPS = 1e-9
const inside = (
  outer: { x: number; z: number; width: number; depth: number },
  inner: { x: number; z: number; width: number; depth: number },
) =>
  inner.x - inner.width / 2 >= outer.x - outer.width / 2 - EPS &&
  inner.x + inner.width / 2 <= outer.x + outer.width / 2 + EPS &&
  inner.z - inner.depth / 2 >= outer.z - outer.depth / 2 - EPS &&
  inner.z + inner.depth / 2 <= outer.z + outer.depth / 2 + EPS

describe('layoutTreeCity', () => {
  const city = layoutTreeCity(files, { size: 100 })

  it('makes top-level directories districts and gathers root files in one', () => {
    expect(city.districts.map((d) => d.id).sort()).toEqual([ROOT_DISTRICT, 'docs', 'src'].sort())
    expect(city.districts.find((d) => d.id === 'src')?.buildingCount).toBe(3)
  })

  it('turns nested directories into blocks with their level', () => {
    expect(city.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'src/lib', level: 1 }),
        expect.objectContaining({ id: 'src/lib/deep', level: 2 }),
      ]),
    )
  })

  it('creates one building per file, inside its district and blocks', () => {
    expect(city.buildings).toHaveLength(files.length)
    const util = city.buildings.find((b) => b.id === 'src/lib/util.ts')!
    expect(util.district).toBe('src')
    expect(
      inside(
        city.districts.find((d) => d.id === 'src')!,
        util,
      ),
    ).toBe(true)
    expect(
      inside(
        city.blocks.find((b) => b.id === 'src/lib')!,
        util,
      ),
    ).toBe(true)
    expect(city.buildings.find((b) => b.id === 'README.md')!.district).toBe(ROOT_DISTRICT)
  })

  it('makes bigger files taller', () => {
    expect(fileHeight(1_000_000)).toBeGreaterThan(fileHeight(10_000))
    expect(fileHeight(10_000)).toBeGreaterThan(fileHeight(100))
    expect(fileHeight(0)).toBeGreaterThan(0)
  })

  it('drops the smallest files beyond maxFiles and reports how many', () => {
    const capped = layoutTreeCity(files, { maxFiles: 4 })
    expect(capped.buildings).toHaveLength(4)
    expect(capped.omitted).toBe(2)
    expect(capped.buildings.map((b) => b.id)).not.toContain('src/lib/deep/x.ts')
  })

  it('handles an empty repository', () => {
    expect(layoutTreeCity([])).toMatchObject({ districts: [], buildings: [], omitted: 0 })
  })
})
