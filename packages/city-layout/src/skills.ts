import { type MonthIndex, type Period, rangeOf, unionMonths } from './dates'

export interface RoleInput extends Period {
  id: string
  /** Only 'work' and 'internship' count towards skill experience. */
  kind: 'work' | 'internship' | 'other'
  /** Skill ids used in this role. */
  stack: readonly string[]
}

export interface SkillInput {
  id: string
  category: string
  /** Extra role ids for skills that are not part of a role's stack (e.g. leadership). */
  roles?: readonly string[]
}

export interface SkillStat {
  id: string
  category: string
  /** Months of experience, overlapping roles counted once. */
  months: number
  /** Roles that used the skill, newest first. */
  roleIds: string[]
  /** First month the skill was used, or null if never used in a role. */
  firstMonth: MonthIndex | null
}

/** Derives experience per skill from the roles whose stack contains it. */
export function computeSkillStats(
  skills: readonly SkillInput[],
  roles: readonly RoleInput[],
  now: MonthIndex,
): SkillStat[] {
  const devRoles = roles.filter((r) => r.kind !== 'other')
  const byId = new Map(devRoles.map((r) => [r.id, r]))

  return skills.map((skill) => {
    const ids = new Set(skill.roles ?? [])
    for (const role of devRoles) if (role.stack.includes(skill.id)) ids.add(role.id)

    const used = [...ids]
      .map((id) => byId.get(id))
      .filter((r): r is RoleInput => r !== undefined)
      .sort((a, b) => b.start.localeCompare(a.start))
    const ranges = used.map((r) => rangeOf(r, now))

    return {
      id: skill.id,
      category: skill.category,
      months: unionMonths(ranges),
      roleIds: used.map((r) => r.id),
      firstMonth: ranges.length ? Math.min(...ranges.map((r) => r[0])) : null,
    }
  })
}

/** Stack entries that do not match any skill id: almost always a typo in the CV data. */
export function unknownStackSkills(
  skills: readonly SkillInput[],
  roles: readonly RoleInput[],
): { roleId: string; skill: string }[] {
  const known = new Set(skills.map((s) => s.id))
  return roles.flatMap((r) =>
    r.stack.filter((s) => !known.has(s)).map((skill) => ({ roleId: r.id, skill })),
  )
}
