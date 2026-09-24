import { describe, expect, it, vi } from 'vitest'
import { createGitHubClient } from './client.ts'
import { fetchRepoTree } from './tree.ts'

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } })

describe('fetchRepoTree', () => {
  it('uses a single recursive request when the tree is complete', async () => {
    const fetch = vi.fn(async () =>
      json({
        sha: 'root',
        truncated: false,
        tree: [
          { path: 'src', type: 'tree', sha: 's' },
          { path: 'src/index.ts', type: 'blob', sha: 'a', size: 120 },
          { path: 'README.md', type: 'blob', sha: 'b', size: 40 },
          { path: 'vendor/lib', type: 'commit', sha: 'c' },
        ],
      }),
    )
    const tree = await fetchRepoTree(createGitHubClient({ fetch }), 'o', 'r', 'main')
    expect(tree).toEqual({
      files: [
        { path: 'src/index.ts', size: 120 },
        { path: 'README.md', size: 40 },
      ],
      truncated: false,
      requests: 1,
    })
    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/o/r/git/trees/main?recursive=1',
      expect.anything(),
    )
  })

  it('walks directories breadth-first when GitHub truncates the tree', async () => {
    const responses: Record<string, unknown> = {
      'main?recursive=1': { sha: 'root', truncated: true, tree: [] },
      root: {
        sha: 'root',
        truncated: false,
        tree: [
          { path: 'a.ts', type: 'blob', sha: '1', size: 1 },
          { path: 'src', type: 'tree', sha: 'src' },
          { path: 'docs', type: 'tree', sha: 'docs' },
        ],
      },
      src: {
        sha: 'src',
        truncated: false,
        tree: [
          { path: 'b.ts', type: 'blob', sha: '2', size: 2 },
          { path: 'deep', type: 'tree', sha: 'deep' },
        ],
      },
      docs: {
        sha: 'docs',
        truncated: false,
        tree: [{ path: 'c.md', type: 'blob', sha: '3', size: 3 }],
      },
      deep: {
        sha: 'deep',
        truncated: false,
        tree: [{ path: 'd.ts', type: 'blob', sha: '4', size: 4 }],
      },
    }
    const fetch = vi.fn(async (url: RequestInfo | URL) =>
      json(responses[String(url).split('/git/trees/')[1]!]),
    )

    const full = await fetchRepoTree(createGitHubClient({ fetch }), 'o', 'r', 'main')
    expect(full.files.map((f) => f.path)).toEqual([
      'a.ts',
      'src/b.ts',
      'docs/c.md',
      'src/deep/d.ts',
    ])
    expect(full).toMatchObject({ truncated: false, requests: 5 })

    fetch.mockClear()
    const limited = await fetchRepoTree(createGitHubClient({ fetch }), 'o', 'r', 'main', {
      maxRequests: 2,
    })
    // Root and src fit in the budget; docs and deep do not.
    expect(limited.files.map((f) => f.path)).toEqual(['a.ts', 'src/b.ts'])
    expect(limited).toMatchObject({ truncated: true, requests: 3 })
  })
})
