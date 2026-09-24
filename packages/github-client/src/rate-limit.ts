export interface RateLimit {
  limit: number
  remaining: number
  used: number
  /** When the window resets. */
  reset: Date
  /** "core", "search", ... GitHub has a separate budget per resource. */
  resource: string
}

/** Reads GitHub's x-ratelimit-* headers. Returns null when they are missing (e.g. a proxy). */
export function parseRateLimit(headers: Headers): RateLimit | null {
  const limit = headers.get('x-ratelimit-limit')
  const remaining = headers.get('x-ratelimit-remaining')
  const reset = headers.get('x-ratelimit-reset')
  if (limit === null || remaining === null || reset === null) return null
  const values = [Number(limit), Number(remaining), Number(reset)]
  if (values.some((v) => !Number.isFinite(v))) return null
  return {
    limit: values[0]!,
    remaining: values[1]!,
    used: Number(headers.get('x-ratelimit-used') ?? values[0]! - values[1]!),
    reset: new Date(values[2]! * 1000),
    resource: headers.get('x-ratelimit-resource') ?? 'core',
  }
}

/** Seconds until the window resets, never negative. */
export const secondsUntilReset = (rateLimit: RateLimit, now = Date.now()) =>
  Math.max(0, Math.ceil((rateLimit.reset.getTime() - now) / 1000))
