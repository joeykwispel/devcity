import { describe, expect, it, vi } from 'vitest'
import { createApp, isAllowedPath } from './app'

const env = {
  GITHUB_TOKEN: 'secret-token',
  ALLOWED_ORIGINS: 'https://devcity.joeyoosenbrug.nl, http://localhost:3000',
  CACHE_TTL: '600',
}

function setup() {
  const store = new Map<string, Response>()
  const cache = {
    match: vi.fn(async (req: RequestInfo | URL) =>
      store.get(String((req as Request).url))?.clone(),
    ),
    put: vi.fn(async (req: RequestInfo | URL, res: Response) => {
      store.set(String((req as Request).url), res)
    }),
  }
  const fetch = vi.fn(
    async (_url: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ name: 'demo' }), {
        headers: {
          'content-type': 'application/json',
          etag: '"v1"',
          'x-ratelimit-limit': '5000',
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-reset': '1790000000',
          'set-cookie': 'should-not-leak=1',
        },
      }),
  )
  const app = createApp({ fetch, cache: cache as unknown as Cache })
  const get = (path: string, headers: Record<string, string> = {}) =>
    app.request(path, { headers: { Origin: 'https://devcity.joeyoosenbrug.nl', ...headers } }, env)
  return { app, fetch, cache, get }
}

describe('isAllowedPath', () => {
  it.each([
    '/rate_limit',
    '/repos/octo/demo',
    '/repos/vercel/next.js/languages',
    '/repos/octo/demo/git/trees/main',
    '/users/joeykwispel/repos',
  ])('allows %s', (path) => expect(isAllowedPath(path)).toBe(true))

  it.each(['/user', '/repos/octo/demo/issues', '/graphql', '/repos/octo', '/search/code'])(
    'refuses %s',
    (path) => expect(isAllowedPath(path)).toBe(false),
  )
})

describe('proxy', () => {
  it('forwards to GitHub with the server-side token and never exposes it', async () => {
    const { fetch, get } = setup()
    const res = await get('/repos/octo/demo?x=1')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ name: 'demo' })

    const [url, init] = fetch.mock.calls[0]!
    expect(url).toBe('https://api.github.com/repos/octo/demo?x=1')
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer secret-token')
    expect([...res.headers.values()].join(' ')).not.toContain('secret-token')
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('passes rate-limit headers through and exposes them to the browser', async () => {
    const { get } = setup()
    const res = await get('/repos/octo/demo')
    expect(res.headers.get('x-ratelimit-remaining')).toBe('4999')
    expect(res.headers.get('access-control-allow-origin')).toBe('https://devcity.joeyoosenbrug.nl')
    expect(res.headers.get('access-control-expose-headers')).toContain('X-RateLimit-Remaining')
  })

  it('serves repeat requests from the edge cache', async () => {
    const { fetch, get } = setup()
    expect((await get('/repos/octo/demo')).headers.get('x-cache')).toBe('MISS')
    const second = await get('/repos/octo/demo')
    expect(second.headers.get('x-cache')).toBe('HIT')
    expect(await second.json()).toEqual({ name: 'demo' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('answers 304 when the browser already has this version', async () => {
    const { get } = setup()
    const res = await get('/repos/octo/demo', { 'If-None-Match': '"v1"' })
    expect(res.status).toBe(304)
    expect(await res.text()).toBe('')
  })

  it('refuses paths outside the allowlist without calling GitHub', async () => {
    const { fetch, get } = setup()
    const res = await get('/user/repos')
    expect(res.status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does not cache errors', async () => {
    const { fetch, cache, app } = setup()
    fetch.mockResolvedValueOnce(new Response('{"message":"Not Found"}', { status: 404 }))
    const res = await app.request('/repos/octo/missing', {}, env)
    expect(res.status).toBe(404)
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('only answers CORS preflights for allowed origins', async () => {
    const { app } = setup()
    const preflight = (origin: string) =>
      app.request(
        '/repos/octo/demo',
        {
          method: 'OPTIONS',
          headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
        },
        env,
      )
    expect(
      (await preflight('http://localhost:3000')).headers.get('access-control-allow-origin'),
    ).toBe('http://localhost:3000')
    expect(
      (await preflight('https://evil.example')).headers.get('access-control-allow-origin'),
    ).toBeNull()
  })
})
