import { Hono } from 'hono'
import { cors } from 'hono/cors'

export interface Env {
  /** Fine-grained PAT with read-only public access. Set with `wrangler secret put GITHUB_TOKEN`. */
  GITHUB_TOKEN: string
  /** Comma-separated origins allowed to call the proxy, e.g. https://devcity.joeyoosenbrug.nl */
  ALLOWED_ORIGINS: string
  /** Seconds a GitHub response is cached at the edge. */
  CACHE_TTL: string
}

/**
 * Only the read-only endpoints DevCity uses. Anything else is refused, so the token cannot be
 * used as a general-purpose GitHub client by whoever finds the proxy URL.
 */
const ALLOWED_PATHS = [
  /^\/rate_limit$/,
  /^\/users\/[\w.-]+\/repos$/,
  /^\/repos\/[\w.-]+\/[\w.-]+$/,
  /^\/repos\/[\w.-]+\/[\w.-]+\/languages$/,
  /^\/repos\/[\w.-]+\/[\w.-]+\/commits$/,
  /^\/repos\/[\w.-]+\/[\w.-]+\/git\/trees\/[\w.%-]+$/,
]

/** Headers the browser client reads (rate limit UI, ETag cache, pagination). */
const EXPOSED = [
  'ETag',
  'Link',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-RateLimit-Used',
  'X-RateLimit-Resource',
  'X-Cache',
]

const FORWARDED = ['content-type', 'etag', 'link', ...EXPOSED.slice(2).map((h) => h.toLowerCase())]

export const isAllowedPath = (path: string) => ALLOWED_PATHS.some((re) => re.test(path))

export interface Deps {
  fetch: typeof fetch
  /** Cloudflare's edge cache in production; a Map-backed stub in tests. */
  cache: Pick<Cache, 'match' | 'put'> | null
}

export function createApp(deps: Deps) {
  const app = new Hono<{ Bindings: Env }>()

  app.use('*', (c, next) =>
    cors({
      origin: c.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      allowMethods: ['GET', 'HEAD', 'OPTIONS'],
      allowHeaders: ['Accept', 'If-None-Match', 'X-GitHub-Api-Version'],
      exposeHeaders: EXPOSED,
      maxAge: 86400,
    })(c, next),
  )

  app.get('/', (c) => c.text('DevCity GitHub proxy'))

  app.get('*', async (c) => {
    const url = new URL(c.req.url)
    if (!isAllowedPath(url.pathname)) return c.json({ message: 'Not allowed' }, 403)

    const upstream = `https://api.github.com${url.pathname}${url.search}`
    // Keyed on the upstream URL only, so every visitor shares the same cached answer.
    const key = new Request(upstream)
    const cached = await deps.cache?.match(key)
    let response = cached

    if (!response) {
      const fresh = await deps.fetch(upstream, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'devcity-proxy',
          Authorization: `Bearer ${c.env.GITHUB_TOKEN}`,
        },
      })
      const headers = new Headers()
      for (const name of FORWARDED) {
        const value = fresh.headers.get(name)
        if (value) headers.set(name, value)
      }
      const cacheable = fresh.status === 200
      headers.set(
        'Cache-Control',
        cacheable ? `public, max-age=${Number(c.env.CACHE_TTL) || 600}` : 'no-store',
      )
      response = new Response(await fresh.arrayBuffer(), { status: fresh.status, headers })
      if (cacheable && deps.cache) await deps.cache.put(key, response.clone())
    }

    const out = new Response(response.body, response)
    out.headers.set('X-Cache', cached ? 'HIT' : 'MISS')

    // Conditional request from the browser's ETag cache: answer 304 without a body.
    const etag = out.headers.get('etag')
    if (etag && c.req.header('if-none-match') === etag)
      return new Response(null, { status: 304, headers: out.headers })
    return out
  })

  return app
}
