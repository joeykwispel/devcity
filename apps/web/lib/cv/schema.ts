import { z } from 'zod'

export const localized = z.object({ en: z.string().min(1), nl: z.string().min(1) })
export type Localized = z.infer<typeof localized>

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM')

export const categorySchema = z.object({
  id: z.string().min(1),
  /** HSL hue (0-360) used for the district and its buildings. */
  hue: z.number().min(0).max(360),
  label: localized,
})

export const skillSchema = z.object({
  /** Canonical name; role stacks refer to skills by this id. */
  id: z.string().min(1),
  category: z.string().min(1),
  /** Only needed when the display name differs per language. */
  label: localized.optional(),
  /** Extra role ids for skills that are not in a role's stack. */
  roles: z.array(z.string()).optional(),
})

export const roleSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  kind: z.enum(['work', 'internship', 'other']),
  start: yearMonth,
  end: yearMonth.nullable(),
  via: z.string().optional(),
  location: z.string().optional(),
  stack: z.array(z.string()),
})

const unique = <T>(items: T[], key: (t: T) => string) => {
  const seen = new Set<string>()
  return items.map(key).filter((k) => (seen.has(k) ? true : (seen.add(k), false)))
}

export const cvSchema = z
  .object({
    profile: z.object({
      name: z.string().min(1),
      title: localized,
      location: z.string(),
      links: z.record(z.string(), z.url()),
    }),
    categories: z.array(categorySchema).min(1),
    skills: z.array(skillSchema),
    roles: z.array(roleSchema),
  })
  .superRefine((cv, ctx) => {
    const issue = (message: string, path: (string | number)[]) =>
      ctx.addIssue({ code: 'custom', message, path })

    for (const [name, list] of [
      ['categories', cv.categories],
      ['skills', cv.skills],
      ['roles', cv.roles],
    ] as const) {
      for (const id of unique<{ id: string }>([...list], (x) => x.id))
        issue(`Duplicate id "${id}"`, [name])
    }

    const categories = new Set(cv.categories.map((c) => c.id))
    const skills = new Set(cv.skills.map((s) => s.id))
    const roles = new Set(cv.roles.map((r) => r.id))

    cv.skills.forEach((s, i) => {
      if (!categories.has(s.category))
        issue(`Unknown category "${s.category}"`, ['skills', i, 'category'])
      s.roles?.forEach((r, j) => {
        if (!roles.has(r)) issue(`Unknown role "${r}"`, ['skills', i, 'roles', j])
      })
    })
    cv.roles.forEach((r, i) => {
      if (r.end && r.end < r.start) issue('end is before start', ['roles', i, 'end'])
      r.stack.forEach((s, j) => {
        if (!skills.has(s)) issue(`Unknown skill "${s}"`, ['roles', i, 'stack', j])
      })
    })
  })

export type CV = z.infer<typeof cvSchema>
export type Category = z.infer<typeof categorySchema>
export type Skill = z.infer<typeof skillSchema>
export type Role = z.infer<typeof roleSchema>
