/**
 * Minimal promise wrapper around one IndexedDB object store, used as a key-value store for the
 * TanStack Query cache and the GitHub ETag cache. Falls back to memory when IndexedDB is missing
 * or blocked (private windows, some embedded browsers), so callers never have to care.
 */
export interface KeyValueStore {
  get<T>(key: string): Promise<T | undefined>
  set(key: string, value: unknown): Promise<void>
  del(key: string): Promise<void>
}

const DB_NAME = 'devcity'
const VERSION = 1
const STORES = ['query-cache', 'etags'] as const
export type StoreName = (typeof STORES)[number]

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      for (const name of STORES)
        if (!request.result.objectStoreNames.contains(name)) request.result.createObjectStore(name)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

const wrap = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

function memoryStore(): KeyValueStore {
  const map = new Map<string, unknown>()
  return {
    get: async <T>(key: string) => map.get(key) as T | undefined,
    set: async (key, value) => void map.set(key, value),
    del: async (key) => void map.delete(key),
  }
}

export function createStore(name: StoreName): KeyValueStore {
  if (typeof indexedDB === 'undefined') return memoryStore()
  const fallback = memoryStore()
  const tx = async (mode: IDBTransactionMode) =>
    (await openDb()).transaction(name, mode).objectStore(name)
  // Any IndexedDB failure degrades to memory for this call instead of breaking the page.
  return {
    get: <T>(key: string) =>
      tx('readonly')
        .then((s) => wrap(s.get(key)) as Promise<T | undefined>)
        .catch(() => fallback.get<T>(key)),
    set: (key, value) =>
      tx('readwrite')
        .then((s) => wrap(s.put(value, key)))
        .then(() => undefined)
        .catch(() => fallback.set(key, value)),
    del: (key) =>
      tx('readwrite')
        .then((s) => wrap(s.delete(key)))
        .then(() => undefined)
        .catch(() => fallback.del(key)),
  }
}
