import { createApp, type Env } from './app'

// Cloudflare Workers entry: real fetch and the colo's edge cache.
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return createApp({ fetch, cache: caches.default }).fetch(request, env, ctx)
  },
}
