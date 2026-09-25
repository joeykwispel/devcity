import {
  layoutCareerCity,
  rangeOf,
  unionMonths,
  type CareerBuilding,
  type CareerCityLayout,
  type MonthIndex,
} from '@devcity/city-layout'
import type { CV, Education, Role } from '@/lib/cv'

export type CareerKind = CareerBuilding['kind']

/** Hue per kind of building, from the portfolio palette (teal work, violet education). */
export const kindHue: Record<CareerKind, number> = {
  work: 168,
  internship: 205,
  other: 220,
  education: 262,
  certification: 32,
}

export const kindOrder: CareerKind[] = ['work', 'internship', 'other', 'education', 'certification']

export interface CareerCity {
  layout: CareerCityLayout
  roles: Map<string, Role>
  education: Map<string, Education>
  /** Months worked as a developer, overlapping roles counted once. */
  careerMonths: number
  /** Distinct companies I worked at, client projects included. */
  companies: number
}

export function buildCareerCity(cv: CV, now: MonthIndex): CareerCity {
  const devRoles = cv.roles.filter((r) => r.kind !== 'other')
  return {
    layout: layoutCareerCity(
      cv.roles.map((r) => ({ ...r, stackSize: r.stack.length })),
      cv.education.map((e) => ({ ...e, courseCount: e.courses?.length })),
      now,
      { size: 130 },
    ),
    roles: new Map(cv.roles.map((r) => [r.id, r])),
    education: new Map(cv.education.map((e) => [e.id, e])),
    careerMonths: unionMonths(devRoles.map((r) => rangeOf(r, now))),
    // "ParaMedia (MediumChat)" and "ParaMedia" are the same company.
    companies: new Set(devRoles.map((r) => r.company.replace(/\s*\(.*\)/, ''))).size,
  }
}
