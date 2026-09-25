'use client'

import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const read = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}

/** Current theme, kept in sync with the data-theme attribute on <html> (set by the kit's header). */
export const useTheme = () => useSyncExternalStore(subscribe, read, () => 'dark' as Theme)
