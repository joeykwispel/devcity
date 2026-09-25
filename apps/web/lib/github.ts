'use client'

import { createGitHubClient, type EtagCache, type RateLimit } from '@devcity/github-client'
import { create } from 'zustand'
import { env } from './env'
import { createStore } from './idb'

interface RateLimitState {
  rateLimit: RateLimit | null
  set: (rateLimit: RateLimit) => void
}

/** Latest rate-limit headers seen from GitHub (or the proxy), for the rate-limit UI. */
export const useRateLimit = create<RateLimitState>((set) => ({
  rateLimit: null,
  set: (rateLimit) => set({ rateLimit }),
}))

const etagStore = createStore('etags')
const etagCache: EtagCache = {
  get: (key) => etagStore.get(key),
  set: (key, entry) => etagStore.set(key, entry),
}

/**
 * The browser's GitHub client. It never has a token: visitors use their own anonymous budget
 * (60 requests/hour per IP), unless NEXT_PUBLIC_GITHUB_PROXY_URL points at the edge proxy that
 * holds a server-side token. ETags are kept in IndexedDB, so revisiting a repo is usually free.
 */
export const github = createGitHubClient({
  baseUrl: env.NEXT_PUBLIC_GITHUB_PROXY_URL || undefined,
  cache: etagCache,
  onRateLimit: (rl) => {
    if (rl.resource === 'core') useRateLimit.getState().set(rl)
  },
})

export const usingProxy = Boolean(env.NEXT_PUBLIC_GITHUB_PROXY_URL)
