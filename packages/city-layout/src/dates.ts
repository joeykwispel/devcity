/** A month as an integer: year * 12 + (month - 1). Makes month arithmetic trivial. */
export type MonthIndex = number

/** Inclusive range of months, [start, end]. */
export type MonthRange = [MonthIndex, MonthIndex]

export interface Period {
  /** YYYY-MM */
  start: string
  /** YYYY-MM, or null for "present" */
  end: string | null
}

export function monthIndex(value: string): MonthIndex {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) throw new Error(`Expected YYYY-MM, got "${value}"`)
  return Number(match[1]) * 12 + Number(match[2]) - 1
}

export const monthIndexOf = (date: Date): MonthIndex => date.getFullYear() * 12 + date.getMonth()

/** `end: null` means the period is still running at `now`. */
export const rangeOf = (period: Period, now: MonthIndex): MonthRange => [
  monthIndex(period.start),
  period.end ? monthIndex(period.end) : now,
]

/** Total months covered by a set of ranges, counting overlapping months once. */
export function unionMonths(ranges: readonly MonthRange[]): number {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  let total = 0
  let current: MonthRange | null = null
  for (const [start, end] of sorted) {
    if (current && start <= current[1] + 1) {
      current[1] = Math.max(current[1], end)
    } else {
      if (current) total += current[1] - current[0] + 1
      current = [start, end]
    }
  }
  if (current) total += current[1] - current[0] + 1
  return total
}
