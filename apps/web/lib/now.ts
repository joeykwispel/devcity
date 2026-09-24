'use client'

import { monthIndexOf, type MonthIndex } from '@devcity/city-layout'
import { useSyncExternalStore } from 'react'

const subscribe = () => () => {}

/**
 * The current month. Pages are prerendered at build time, so the server snapshot is the build
 * month (passed in) and the client switches to the real month after hydration. That keeps
 * hydration consistent and still lets years of experience grow without a redeploy.
 */
export function useCurrentMonth(buildMonth: MonthIndex): MonthIndex {
  return useSyncExternalStore(
    subscribe,
    () => monthIndexOf(new Date()),
    () => buildMonth,
  )
}
