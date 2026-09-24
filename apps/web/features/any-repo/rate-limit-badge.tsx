'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { usingProxy, useRateLimit } from '@/lib/github'

/** Re-renders every 30 seconds so the reset countdown stays roughly right. */
export function useTick(ms: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export const minutesUntil = (reset: Date, now: number) =>
  Math.max(1, Math.ceil((reset.getTime() - now) / 60_000))

export function RateLimitBadge() {
  const t = useTranslations('anyRepo')
  const rateLimit = useRateLimit((s) => s.rateLimit)
  const now = useTick(30_000)
  if (!rateLimit) return null

  const low = rateLimit.remaining / rateLimit.limit < 0.2
  return (
    <p
      className={`flex flex-wrap items-center gap-x-2 font-mono text-[0.7rem] ${low ? 'text-accent-2-text' : 'text-muted'}`}
      aria-live="polite"
    >
      <span
        className="inline-block size-2 rounded-full"
        style={{ background: low ? 'var(--accent-2)' : 'var(--accent)' }}
        aria-hidden="true"
      />
      {t('rateLimit', { remaining: rateLimit.remaining, limit: rateLimit.limit })}
      <span>· {t('resetsIn', { minutes: minutesUntil(rateLimit.reset, now) })}</span>
      {usingProxy && <span>· {t('viaProxy')}</span>}
    </p>
  )
}
