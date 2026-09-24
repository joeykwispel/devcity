export interface EtagEntry {
  etag: string
  /** Parsed JSON body of the original 200 response. */
  body: unknown
  /** The Link header of the original response, needed to keep paginating from cache. */
  link?: string | null
}

/**
 * Storage for conditional requests. When an entry exists the client sends If-None-Match, and a
 * 304 answer reuses the stored body. GitHub does not count 304s against the rate limit.
 */
export interface EtagCache {
  get(key: string): Promise<EtagEntry | undefined> | EtagEntry | undefined
  set(key: string, entry: EtagEntry): Promise<void> | void
}

export class MemoryEtagCache implements EtagCache {
  readonly #entries = new Map<string, EtagEntry>()
  get(key: string) {
    return this.#entries.get(key)
  }
  set(key: string, entry: EtagEntry) {
    this.#entries.set(key, entry)
  }
}
