import { describe, expect, it } from 'vitest'
import { assignLanes, layoutCareerCity, type CareerRoleInput } from './career-city'
import { monthIndex } from './dates'

const now = monthIndex('2026-09')

const roles: CareerRoleInput[] = [
  { id: 'intern', kind: 'internship', start: '2019-08', end: '2020-01', stackSize: 6 },
  { id: 'first', kind: 'work', start: '2021-08', end: '2022-05', stackSize: 8 },
  { id: 'side', kind: 'work', start: '2022-01', end: '2022-03', stackSize: 3 },
  { id: 'current', kind: 'work', start: '2025-07', end: null, stackSize: 30 },
  { id: 'barista', kind: 'other', start: '2020-02', end: '2021-01', stackSize: 0 },
]

describe('assignLanes', () => {
  it('puts overlapping intervals on different lanes and reuses free lanes', () => {
    const a = { start: 0, end: 10 }
    const b = { start: 5, end: 7 }
    const c = { start: 8, end: 12 }
    const lanes = assignLanes([a, b, c])
    expect(lanes.get(a)).toBe(0)
    expect(lanes.get(b)).toBe(1)
    expect(lanes.get(c)).toBe(1)
  })
})

describe('layoutCareerCity', () => {
  const city = layoutCareerCity(
    roles,
    [
      { id: 'mbo', kind: 'education', startYear: 2018, endYear: 2021 },
      { id: 'cert', kind: 'certification', startYear: 2023, endYear: 2023, courseCount: 2 },
    ],
    now,
    { size: 100 },
  )
  const get = (id: string) => city.buildings.find((b) => b.id === id)!

  it('orders buildings chronologically along x', () => {
    expect(get('intern').x).toBeLessThan(get('first').x)
    expect(get('first').x).toBeLessThan(get('current').x)
  })

  it('makes building length proportional to duration', () => {
    // first: 10 months, side: 3 months
    expect(get('first').width).toBeGreaterThan(get('side').width * 2.5)
  })

  it('moves overlapping roles to a back lane', () => {
    expect(get('first').lane).toBe(0)
    expect(get('side').lane).toBe(1)
    expect(Math.abs(get('side').z)).toBeGreaterThan(Math.abs(get('first').z))
  })

  it('puts work and education on opposite sides of the boulevard', () => {
    expect(get('first').z).toBeLessThan(0)
    expect(get('mbo').z).toBeGreaterThan(0)
    expect(get('cert').z).toBeGreaterThan(0)
  })

  it('scales work height with the number of skills and keeps non-dev jobs low', () => {
    expect(get('current').height).toBeGreaterThan(get('first').height)
    expect(get('barista').height).toBeLessThanOrEqual(3)
  })

  it('stays within the timeline and leaves no overlaps on a lane', () => {
    for (const b of city.buildings) {
      expect(b.x - b.width / 2).toBeGreaterThanOrEqual(-50 - 1e-9)
      expect(b.x + b.width / 2).toBeLessThanOrEqual(50 + 1e-9)
    }
    const sameLane = city.buildings.filter((b) => b.side === 'work' && b.lane === 0)
    const sorted = [...sameLane].sort((a, b) => a.x - b.x)
    for (let i = 1; i < sorted.length; i++)
      expect(sorted[i]!.x - sorted[i]!.width / 2).toBeGreaterThanOrEqual(
        sorted[i - 1]!.x + sorted[i - 1]!.width / 2 - 1e-9,
      )
  })

  it('marks every January on the timeline', () => {
    expect(city.years.map((y) => y.year)).toEqual([2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026])
    expect(city.years[0]!.x).toBeLessThan(city.years[1]!.x)
  })

  it('handles an empty career', () => {
    expect(layoutCareerCity([], [], now).buildings).toEqual([])
  })
})
