import type { Page } from '@playwright/test'

const headers = (remaining: number) => ({
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-expose-headers':
    'ETag, Link, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-RateLimit-Used, X-RateLimit-Resource',
  'x-ratelimit-limit': '60',
  'x-ratelimit-remaining': String(remaining),
  'x-ratelimit-used': String(60 - remaining),
  'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 30 * 60),
  'x-ratelimit-resource': 'core',
})

const repo = {
  name: 'demo',
  full_name: 'octo/demo',
  owner: { login: 'octo' },
  description: 'A demo repository',
  html_url: 'https://github.com/octo/demo',
  homepage: null,
  language: 'TypeScript',
  stargazers_count: 1234,
  forks_count: 5,
  open_issues_count: 0,
  size: 100,
  default_branch: 'main',
  created_at: '2024-01-01T00:00:00Z',
  pushed_at: '2026-09-01T00:00:00Z',
  topics: [],
  fork: false,
  archived: false,
  license: null,
}

const tree = {
  sha: 'root',
  truncated: false,
  tree: [
    { path: 'README.md', type: 'blob', sha: 'a', size: 2400 },
    { path: 'package.json', type: 'blob', sha: 'b', size: 900 },
    { path: 'src', type: 'tree', sha: 'c' },
    { path: 'src/index.ts', type: 'blob', sha: 'd', size: 5200 },
    { path: 'src/city.ts', type: 'blob', sha: 'e', size: 18000 },
    { path: 'src/ui/button.tsx', type: 'blob', sha: 'f', size: 3100 },
    { path: 'docs/guide.md', type: 'blob', sha: 'g', size: 40000 },
  ],
}

/** Answers GitHub API calls from fixtures, so the Any Repo tests never touch the network. */
export async function mockGitHub(page: Page, { rateLimited = false } = {}) {
  await page.route('https://api.github.com/**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: { ...headers(59), 'access-control-allow-headers': '*' },
      })
    if (rateLimited)
      return route.fulfill({
        status: 403,
        headers: headers(0),
        body: JSON.stringify({ message: 'API rate limit exceeded' }),
      })
    if (url.pathname === '/repos/octo/demo')
      return route.fulfill({ headers: headers(59), body: JSON.stringify(repo) })
    if (url.pathname.startsWith('/repos/octo/demo/git/trees/'))
      return route.fulfill({ headers: headers(58), body: JSON.stringify(tree) })
    return route.fulfill({ status: 404, headers: headers(57), body: '{"message":"Not Found"}' })
  })
}
