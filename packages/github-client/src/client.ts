import { z } from 'zod'
import type { EtagCache } from './etag-cache.ts'
import { GitHubError, NotFoundError, RateLimitError } from './errors.ts'
import { parseRateLimit, type RateLimit } from './rate-limit.ts'
import {
  languagesSchema,
  pullRequestSearchSchema,
  rateLimitSchema,
  repoSchema,
  type Languages,
  type Repo,
} from './schemas.ts'

export interface GitHubClientOptions {
  /** Personal access token. Never pass one in browser code: it would ship to every visitor. */
  token?: string
  /** Defaults to https://api.github.com. Point it at a caching proxy to share one token. */
  baseUrl?: string
  fetch?: typeof fetch
  cache?: EtagCache
  /** Sent in Node; browsers set their own User-Agent. */
  userAgent?: string
  /** Called with the latest rate-limit headers after every response. */
  onRateLimit?: (rateLimit: RateLimit) => void
}

export interface RequestOptions {
  signal?: AbortSignal
}

export interface GitHubResponse<T> {
  data: T
  rateLimit: RateLimit | null
  /** True when the body came from the ETag cache (304 Not Modified). */
  fromCache: boolean
  link: string | null
}

/** Extracts the URL for a rel from a Link header: <https://...?page=2>; rel="next", ... */
export function parseLink(link: string | null, rel: string): string | null {
  if (!link) return null
  for (const part of link.split(',')) {
    const match = /<([^>]+)>\s*;\s*rel="([^"]+)"/.exec(part.trim())
    if (match && match[2] === rel) return match[1]!
  }
  return null
}

export function createGitHubClient(options: GitHubClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? 'https://api.github.com').replace(/\/$/, '')
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis)

  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    { signal }: RequestOptions = {},
  ): Promise<GitHubResponse<T>> {
    const url = path.startsWith('http') ? path : `${baseUrl}${path}`
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    }
    if (options.token) headers.Authorization = `Bearer ${options.token}`
    if (options.userAgent) headers['User-Agent'] = options.userAgent

    const cached = await options.cache?.get(url)
    if (cached) headers['If-None-Match'] = cached.etag

    const res = await fetchImpl(url, { headers, signal })
    const rateLimit = parseRateLimit(res.headers)
    if (rateLimit) options.onRateLimit?.(rateLimit)

    let body: unknown
    let link = res.headers.get('link')
    let fromCache = false

    if (res.status === 304 && cached) {
      body = cached.body
      link = cached.link ?? null
      fromCache = true
    } else if (!res.ok) {
      if (res.status === 404) throw new NotFoundError(path, rateLimit)
      const exhausted = rateLimit?.remaining === 0 || res.headers.has('retry-after')
      if ((res.status === 403 || res.status === 429) && exhausted)
        throw new RateLimitError(rateLimit, res.status)
      const message = await res
        .json()
        .then((b: { message?: string }) => b.message)
        .catch(() => undefined)
      throw new GitHubError(
        message ?? `GitHub request failed: ${res.status}`,
        res.status,
        rateLimit,
      )
    } else {
      body = await res.json()
      const etag = res.headers.get('etag')
      if (etag && options.cache) await options.cache.set(url, { etag, body, link })
    }

    return { data: schema.parse(body), rateLimit, fromCache, link }
  }

  /** Follows rel="next" links and concatenates the pages. */
  async function paginate<T>(
    path: string,
    item: z.ZodType<T>,
    { maxPages = 10, ...init }: RequestOptions & { maxPages?: number } = {},
  ): Promise<T[]> {
    const items: T[] = []
    let next: string | null = path
    for (let page = 0; next && page < maxPages; page++) {
      const res: GitHubResponse<T[]> = await request(next, z.array(item), init)
      items.push(...res.data)
      next = parseLink(res.link, 'next')
    }
    return items
  }

  const repoPath = (owner: string, repo: string) =>
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`

  return {
    request,
    paginate,

    getRepo: (owner: string, repo: string, init?: RequestOptions): Promise<Repo> =>
      request(repoPath(owner, repo), repoSchema, init).then((r) => r.data),

    /** Public repos owned by a user, most recently pushed first. */
    listUserRepos: (user: string, init?: RequestOptions): Promise<Repo[]> =>
      paginate(
        `/users/${encodeURIComponent(user)}/repos?type=owner&sort=pushed&per_page=100`,
        repoSchema,
        init,
      ),

    /** Bytes of code per language. */
    getLanguages: (owner: string, repo: string, init?: RequestOptions): Promise<Languages> =>
      request(`${repoPath(owner, repo)}/languages`, languagesSchema, init).then((r) => r.data),

    /**
     * Number of commits on a branch in one request: ask for one commit per page and read the
     * page number of rel="last". Empty repositories answer 409 and count as zero.
     */
    async countCommits(owner: string, repo: string, ref: string, init?: RequestOptions) {
      try {
        const res = await request(
          `${repoPath(owner, repo)}/commits?per_page=1&sha=${encodeURIComponent(ref)}`,
          z.array(z.unknown()),
          init,
        )
        const last = parseLink(res.link, 'last')
        return last ? Number(new URL(last).searchParams.get('page')) : res.data.length
      } catch (error) {
        if (error instanceof GitHubError && error.status === 409) return 0
        throw error
      }
    },

    /** Public pull requests opened by a user (search API: 30 requests/minute budget). */
    searchPullRequests: (author: string, init?: RequestOptions) =>
      request(
        `/search/issues?q=${encodeURIComponent(`author:${author} type:pr is:public`)}&per_page=100`,
        pullRequestSearchSchema,
        init,
      ).then((r) => r.data.items),

    /** Current budget. This endpoint does not count against the limit. */
    getRateLimit: (init?: RequestOptions) =>
      request('/rate_limit', rateLimitSchema, init).then((r) => r.data.resources.core),
  }
}

export type GitHubClient = ReturnType<typeof createGitHubClient>
