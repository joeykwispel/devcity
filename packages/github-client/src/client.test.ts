import { describe, expect, it, vi } from 'vitest'
import { createGitHubClient, parseLink } from './client.ts'
import { MemoryEtagCache } from './etag-cache.ts'
import { GitHubError, NotFoundError, RateLimitError } from './errors.ts'
import { parseRateLimit, secondsUntilReset } from './rate-limit.ts'

const limitHeaders = (remaining: number) => ({
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': String(remaining),
  'x-ratelimit-used': String(60 - remaining),
  'x-ratelimit-reset': '1790000000',
  'x-ratelimit-resource': 'core',
})

const json = (body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) =>
  new Response(init.status === 304 ? null : JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...init.headers },
  })

const repo = {
  name: 'devcity',
  full_name: 'joeykwispel/devcity',
  owner: { login: 'joeykwispel' },
  description: null,
  html_url: 'https://github.com/joeykwispel/devcity',
  language: 'TypeScript',
  stargazers_count: 1,
  forks_count: 0,
  open_issues_count: 0,
  size: 61,
  default_branch: 'main',
  created_at: '2026-09-24T00:00:00Z',
  pushed_at: '2026-09-24T00:00:00Z',
  fork: false,
  archived: false,
  extra_field_that_gets_stripped: true,
}

describe('parseRateLimit', () => {
  it('reads the x-ratelimit headers', () => {
    const rl = parseRateLimit(new Headers(limitHeaders(42)))
    expect(rl).toEqual({
      limit: 60,
      remaining: 42,
      used: 18,
      reset: new Date(1790000000 * 1000),
      resource: 'core',
    })
    expect(secondsUntilReset(rl!, 1790000000 * 1000 - 90_500)).toBe(91)
    expect(secondsUntilReset(rl!, 1790000000 * 1000 + 5000)).toBe(0)
  })

  it('returns null without headers', () => {
    expect(parseRateLimit(new Headers())).toBeNull()
  })
})

describe('parseLink', () => {
  const link =
    '<https://api.github.com/x?page=2>; rel="next", <https://api.github.com/x?page=7>; rel="last"'
  it('finds a rel', () => {
    expect(parseLink(link, 'next')).toBe('https://api.github.com/x?page=2')
    expect(parseLink(link, 'last')).toBe('https://api.github.com/x?page=7')
    expect(parseLink(link, 'prev')).toBeNull()
    expect(parseLink(null, 'next')).toBeNull()
  })
})

describe('createGitHubClient', () => {
  it('validates responses, strips unknown fields and reports the rate limit', async () => {
    const onRateLimit = vi.fn()
    const fetch = vi.fn(async () => json(repo, { headers: limitHeaders(59) }))
    const client = createGitHubClient({ fetch, onRateLimit })
    const data = await client.getRepo('joeykwispel', 'devcity')
    expect(data.full_name).toBe('joeykwispel/devcity')
    expect(data).not.toHaveProperty('extra_field_that_gets_stripped')
    expect(onRateLimit).toHaveBeenCalledWith(expect.objectContaining({ remaining: 59 }))
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/joeykwispel/devcity',
      expect.anything(),
    )
  })

  it('sends the token only when given', async () => {
    const fetch = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => json(repo))
    await createGitHubClient({ fetch, token: 'secret' }).getRepo('a', 'b')
    await createGitHubClient({ fetch }).getRepo('a', 'b')
    const headers = fetch.mock.calls.map(([, init]) => init?.headers as Record<string, string>)
    expect(headers[0]!.Authorization).toBe('Bearer secret')
    expect(headers[1]!.Authorization).toBeUndefined()
  })

  it('reuses the cached body on 304 Not Modified', async () => {
    const cache = new MemoryEtagCache()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(json(repo, { headers: { etag: '"abc"' } }))
      .mockResolvedValueOnce(json(null, { status: 304 }))
    const client = createGitHubClient({ fetch, cache })

    const first = await client.request('/repos/a/b', (await import('./schemas.ts')).repoSchema)
    const second = await client.request('/repos/a/b', (await import('./schemas.ts')).repoSchema)

    expect(first.fromCache).toBe(false)
    expect(second.fromCache).toBe(true)
    expect(second.data.name).toBe('devcity')
    expect(fetch.mock.calls[1]![1].headers['If-None-Match']).toBe('"abc"')
  })

  it('throws typed errors', async () => {
    const notFound = createGitHubClient({ fetch: async () => json({}, { status: 404 }) })
    await expect(notFound.getRepo('a', 'b')).rejects.toBeInstanceOf(NotFoundError)

    const limited = createGitHubClient({
      fetch: async () =>
        json({ message: 'API rate limit exceeded' }, { status: 403, headers: limitHeaders(0) }),
    })
    const error = await limited.getRepo('a', 'b').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(RateLimitError)
    expect((error as RateLimitError).rateLimit?.remaining).toBe(0)

    const forbidden = createGitHubClient({
      fetch: async () =>
        json({ message: 'Repository access blocked' }, { status: 403, headers: limitHeaders(10) }),
    })
    const other = await forbidden.getRepo('a', 'b').catch((e: unknown) => e)
    expect(other).toBeInstanceOf(GitHubError)
    expect(other).not.toBeInstanceOf(RateLimitError)
    expect((other as Error).message).toBe('Repository access blocked')
  })

  it('follows pagination links', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        json([repo], { headers: { link: '<https://api.github.com/page2>; rel="next"' } }),
      )
      .mockResolvedValueOnce(json([{ ...repo, name: 'second' }]))
    const repos = await createGitHubClient({ fetch }).listUserRepos('joeykwispel')
    expect(repos.map((r) => r.name)).toEqual(['devcity', 'second'])
    expect(fetch.mock.calls[1]![0]).toBe('https://api.github.com/page2')
  })

  it('counts commits from the last page link', async () => {
    const fetch = vi.fn(async () =>
      json([{}], {
        headers: {
          link: '<https://api.github.com/repos/a/b/commits?per_page=1&page=412>; rel="last"',
        },
      }),
    )
    expect(await createGitHubClient({ fetch }).countCommits('a', 'b', 'main')).toBe(412)

    const empty = createGitHubClient({ fetch: async () => json({}, { status: 409 }) })
    expect(await empty.countCommits('a', 'b', 'main')).toBe(0)
  })

  it('uses a custom base URL, e.g. the caching proxy', async () => {
    const fetch = vi.fn(async () => json(repo))
    await createGitHubClient({ fetch, baseUrl: 'https://proxy.example.com/' }).getRepo('a', 'b')
    expect(fetch).toHaveBeenCalledWith('https://proxy.example.com/repos/a/b', expect.anything())
  })
})
