import { describe, expect, it } from 'vitest'
import { monthIndex } from './dates'
import { computeSkillStats, unknownStackSkills, type RoleInput, type SkillInput } from './skills'

const now = monthIndex('2026-09')

const roles: RoleInput[] = [
  { id: 'a', kind: 'work', start: '2024-01', end: '2024-12', stack: ['react', 'css'] },
  { id: 'b', kind: 'work', start: '2024-07', end: null, stack: ['react'] },
  { id: 'c', kind: 'other', start: '2020-01', end: '2023-12', stack: ['css'] },
]

const skills: SkillInput[] = [
  { id: 'react', category: 'frontend' },
  { id: 'css', category: 'frontend' },
  { id: 'lead', category: 'soft', roles: ['b'] },
  { id: 'dutch', category: 'languages' },
]

describe('computeSkillStats', () => {
  const byId = Object.fromEntries(computeSkillStats(skills, roles, now).map((s) => [s.id, s]))

  it('unions overlapping roles', () => {
    // 2024-01 .. 2026-09 inclusive
    expect(byId.react?.months).toBe(33)
    expect(byId.react?.roleIds).toEqual(['b', 'a'])
  })

  it('ignores non-dev roles', () => {
    expect(byId.css?.months).toBe(12)
    expect(byId.css?.roleIds).toEqual(['a'])
  })

  it('honours explicit role links', () => {
    expect(byId.lead?.roleIds).toEqual(['b'])
    expect(byId.lead?.months).toBe(27)
  })

  it('gives unused skills zero months', () => {
    expect(byId.dutch).toMatchObject({ months: 0, roleIds: [], firstMonth: null })
  })

  it('records the first month of use', () => {
    expect(byId.react?.firstMonth).toBe(monthIndex('2024-01'))
  })
})

describe('unknownStackSkills', () => {
  it('reports stack entries without a matching skill', () => {
    const withTypo: RoleInput[] = [{ ...roles[0]!, stack: ['react', 'Reactt'] }]
    expect(unknownStackSkills(skills, withTypo)).toEqual([{ roleId: 'a', skill: 'Reactt' }])
  })
})
