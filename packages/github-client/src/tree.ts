import type { GitHubClient, RequestOptions } from './client.ts'
import { treeSchema, type TreeEntry } from './schemas.ts'

export interface RepoTree {
  /** Files only (blobs), with full paths from the repository root. */
  files: { path: string; size: number }[]
  /** True when the tree is still incomplete after the request budget was spent. */
  truncated: boolean
  /** API requests used to build the tree. */
  requests: number
}

export interface TreeOptions extends RequestOptions {
  /**
   * Extra requests allowed when GitHub truncates the recursive tree (over ~100k entries or 7 MB).
   * Each one fetches a single directory level, so keep this low for anonymous visitors.
   */
  maxRequests?: number
}

const treePath = (owner: string, repo: string, sha: string, recursive: boolean) =>
  `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(sha)}${recursive ? '?recursive=1' : ''}`

const blobs = (entries: TreeEntry[], prefix = '') =>
  entries
    .filter((e) => e.type === 'blob')
    .map((e) => ({ path: prefix + e.path, size: e.size ?? 0 }))

/**
 * Fetches every file path of a repository. One recursive request covers almost every repo; when
 * GitHub truncates it, the tree is walked breadth-first one directory at a time (shallow levels
 * first, so the city outline is complete even if deep folders run out of budget).
 */
export async function fetchRepoTree(
  client: GitHubClient,
  owner: string,
  repo: string,
  ref: string,
  { maxRequests = 20, signal }: TreeOptions = {},
): Promise<RepoTree> {
  const first = await client.request(treePath(owner, repo, ref, true), treeSchema, { signal })
  if (!first.data.truncated) return { files: blobs(first.data.tree), truncated: false, requests: 1 }

  const files: RepoTree['files'] = []
  const queue: { sha: string; prefix: string }[] = [{ sha: first.data.sha, prefix: '' }]
  let requests = 1

  while (queue.length > 0 && requests < maxRequests + 1) {
    const dir = queue.shift()!
    const res = await client.request(treePath(owner, repo, dir.sha, false), treeSchema, { signal })
    requests++
    files.push(...blobs(res.data.tree, dir.prefix))
    for (const entry of res.data.tree)
      if (entry.type === 'tree')
        queue.push({ sha: entry.sha, prefix: `${dir.prefix}${entry.path}/` })
  }

  return { files, truncated: queue.length > 0, requests }
}
