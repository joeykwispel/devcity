'use client'

import { NotFoundError, RateLimitError } from '@devcity/github-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import type { ReactNode } from 'react'
import { createStore } from '@/lib/idb'

const HOUR = 60 * 60 * 1000

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A repository's tree rarely changes within an hour, and every refetch costs rate limit.
      staleTime: HOUR,
      gcTime: 24 * HOUR,
      refetchOnWindowFocus: false,
      // Retrying cannot fix a missing repo or an empty budget; it only burns more requests.
      retry: (failures, error) =>
        !(error instanceof RateLimitError || error instanceof NotFoundError) && failures < 2,
    },
  },
})

const store = createStore('query-cache')
const persister = createAsyncStoragePersister({
  key: 'devcity-query-cache',
  storage: {
    getItem: async (key) => (await store.get<string>(key)) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.del(key),
  },
  throttleTime: 2000,
})

/** TanStack Query with its cache persisted to IndexedDB, so revisited repos load instantly. */
export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * HOUR, buster: 'devcity-1' }}
    >
      {children}
    </PersistQueryClientProvider>
  )
}
