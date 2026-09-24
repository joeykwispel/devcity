import { describe, expect, it } from 'vitest'
import { layoutDistrictCity } from './district-city'
import { CONTRIBUTIONS_DISTRICT, layoutRepoCity, staleness, type RepoInput } from './repo-city'

const now = Date.UTC(2026, 8, 25)
const monthsAgo = (m: number) => now - m * 30.44 * 24 * 60 * 60 * 1000

const repos: RepoInput[] = [
  {
    id: 'Portfolio',
    languages: { Svelte: 169202, TypeScript: 109928, CSS: 9667, HTML: 831 },
    language: 'Svelte',
    sizeKb: 987,
    commits: 16,
    pushedAt: monthsAgo(0),
  },
  {
    id: 'devcity',
    languages: { TypeScript: 2754, CSS: 155 },
    language: 'TypeScript',
    sizeKb: 61,
    commits: 3,
    pushedAt: monthsAgo(1),
  },
  {
    id: 'aframe',
    languages: {},
    language: null,
    sizeKb: 640781,
    commits: 0,
    pushedAt: monthsAgo(47),
  },
]

describe('layoutDistrictCity', () => {
  it('drops districts and items without weight', () => {
    const city = layoutDistrictCity([
      {
        id: 'a',
        items: [
          { id: 'x', weight: 1, height: 1 },
          { id: 'y', weight: 0, height: 1 },
        ],
      },
      { id: 'b', items: [] },
    ])
    expect(city.districts.map((d) => d.id)).toEqual(['a'])
    expect(city.buildings.map((b) => b.id)).toEqual(['x'])
  })

  it('makes footprints proportional to weight', () => {
    const city = layoutDistrictCity(
      [
        {
          id: 'a',
          items: [
            { id: 'big', weight: 3, height: 1 },
            { id: 'small', weight: 1, height: 1 },
          ],
        },
      ],
      { buildingGap: 0, districtGap: 0 },
    )
    const area = (id: string) => {
      const b = city.buildings.find((x) => x.id === id)!
      return b.width * b.depth
    }
    expect(area('big') / area('small')).toBeCloseTo(3, 5)
  })
})

describe('staleness', () => {
  it('ramps from six months to two years', () => {
    expect(staleness(monthsAgo(3), now)).toBe(0)
    expect(staleness(monthsAgo(15), now)).toBeCloseTo(0.5, 1)
    expect(staleness(monthsAgo(40), now)).toBe(1)
    expect(staleness(null, now)).toBe(1)
  })
})

describe('layoutRepoCity', () => {
  const city = layoutRepoCity(
    repos,
    [
      { id: 'minvws/nl-mgo-dvp-proxy', language: 'Python', pullRequests: 1, stars: 0 },
      { id: 'fundament-oss/fundament', language: 'Go', pullRequests: 3, stars: 12 },
    ],
    now,
  )
  const building = (id: string) => city.buildings.find((b) => b.id === id)!

  it('creates a district per repository plus one for contributions', () => {
    expect(city.districts.map((d) => d.id)).toEqual([
      'Portfolio',
      'devcity',
      'aframe',
      CONTRIBUTIONS_DISTRICT,
    ])
  })

  it('creates a building per language, falling back to "Other" for forks', () => {
    expect(city.buildings.filter((b) => b.district === 'Portfolio')).toHaveLength(4)
    expect(building('aframe/Other')).toBeDefined()
    expect(city.meta.get('Portfolio/HTML')?.share).toBeGreaterThan(0.03)
  })

  it('keeps a huge repository from dominating the map', () => {
    const area = (id: string) => {
      const d = city.districts.find((x) => x.id === id)!
      return d.width * d.depth
    }
    // aframe is 650x the size of Portfolio on disk but gets only a bit over twice the area.
    expect(area('aframe') / area('Portfolio')).toBeLessThan(2.5)
  })

  it('makes repositories with more commits taller', () => {
    expect(building('Portfolio/Svelte').height).toBeGreaterThan(
      building('devcity/TypeScript').height,
    )
  })

  it('marks stale repositories', () => {
    expect(city.meta.get('aframe/Other')?.staleness).toBe(1)
    expect(city.meta.get('devcity/TypeScript')?.staleness).toBe(0)
  })

  it('makes contributions with more pull requests taller', () => {
    expect(building('fundament-oss/fundament').height).toBeGreaterThan(
      building('minvws/nl-mgo-dvp-proxy').height,
    )
  })
})
