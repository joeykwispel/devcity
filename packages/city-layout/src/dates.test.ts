import { describe, expect, it } from 'vitest'
import { monthIndex, rangeOf, unionMonths } from './dates'

describe('monthIndex', () => {
  it('maps YYYY-MM to a sequential integer', () => {
    expect(monthIndex('2024-01') - monthIndex('2023-12')).toBe(1)
    expect(monthIndex('2020-06')).toBe(2020 * 12 + 5)
  })

  it('rejects malformed input', () => {
    expect(() => monthIndex('2024-1')).toThrow()
    expect(() => monthIndex('2024/01')).toThrow()
  })
})

describe('rangeOf', () => {
  it('uses now for open-ended periods', () => {
    const now = monthIndex('2026-09')
    expect(rangeOf({ start: '2026-07', end: null }, now)).toEqual([monthIndex('2026-07'), now])
  })
})

describe('unionMonths', () => {
  const r = (a: string, b: string): [number, number] => [monthIndex(a), monthIndex(b)]

  it('counts inclusive months', () => {
    expect(unionMonths([r('2024-01', '2024-12')])).toBe(12)
  })

  it('counts overlapping months once', () => {
    expect(unionMonths([r('2024-01', '2024-06'), r('2024-04', '2024-09')])).toBe(9)
  })

  it('merges adjacent ranges and keeps gaps out', () => {
    expect(unionMonths([r('2024-01', '2024-03'), r('2024-04', '2024-04')])).toBe(4)
    expect(unionMonths([r('2024-01', '2024-02'), r('2024-06', '2024-07')])).toBe(4)
  })

  it('handles unsorted and empty input', () => {
    expect(unionMonths([r('2025-01', '2025-01'), r('2024-01', '2024-01')])).toBe(2)
    expect(unionMonths([])).toBe(0)
  })
})
