import { describe, expect, it } from 'vitest'
import raw from '../../data/cv.json'
import { cvSchema } from './schema'

describe('cv.json', () => {
  it('matches the schema', () => {
    const result = cvSchema.safeParse(raw)
    expect(result.error?.issues ?? []).toEqual([])
  })
})

describe('cvSchema cross-references', () => {
  const base = cvSchema.parse(raw)
  const messages = (cv: unknown) => cvSchema.safeParse(cv).error?.issues.map((i) => i.message) ?? []

  it('rejects a stack entry that is not a skill', () => {
    const roles = [{ ...base.roles[0]!, stack: ['Reactt'] }, ...base.roles.slice(1)]
    expect(messages({ ...base, roles })).toContain('Unknown skill "Reactt"')
  })

  it('rejects a skill in an unknown category', () => {
    const skills = [{ id: 'X', category: 'nope' }, ...base.skills]
    expect(messages({ ...base, skills })).toContain('Unknown category "nope"')
  })

  it('rejects duplicate ids', () => {
    expect(messages({ ...base, skills: [...base.skills, base.skills[0]] })).toContain(
      `Duplicate id "${base.skills[0]!.id}"`,
    )
  })

  it('rejects malformed dates', () => {
    const roles = [{ ...base.roles[0]!, start: '2024-13' }, ...base.roles.slice(1)]
    expect(messages({ ...base, roles })).toContain('Expected YYYY-MM')
  })
})
