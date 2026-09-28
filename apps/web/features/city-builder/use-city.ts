'use client'

import { layoutReposCity, layoutTreeCity, type TreeCityLayout } from '@devcity/city-layout'
import { fetchRepoTree, type Repo, type RepoTree } from '@devcity/github-client'
import { useQueries } from '@tanstack/react-query'
import { useState } from 'react'
import { github, usingProxy } from '@/lib/github'

export interface RepoTarget {
  owner: string
  repo: string
}

/** owner/name, lower-cased: the id of a repository in the city and in the URL. */
export const repoId = (target: RepoTarget) =>
  `${target.owner.toLowerCase()}/${target.repo.toLowerCase()}`

export const repoQueryKey = (id: string) => ['repo', ...id.split('/')] as const

export interface CityRepo {
  id: string
  repo: Repo | undefined
  tree: RepoTree | undefined
  status: 'loading' | 'ready' | 'error'
  error: unknown
}

/**
 * Tree requests allowed per repository when GitHub truncates one. Anonymous visitors have 60
 * requests an hour, so a city of many repositories only gets the recursive tree of each.
 */
const treeBudget = (count: number) => (usingProxy ? (count > 10 ? 4 : 40) : count > 1 ? 1 : 10)

/**
 * Metadata, then file tree, of every repository in the city, and the layout of the city. One
 * repository keeps its folders as districts; several become one district each. The layout is
 * only rebuilt once every repository has settled, so a big city grows once instead of a hundred
 * times.
 */
export function useCity(ids: readonly string[]) {
  const repos = useQueries({
    queries: ids.map((id) => {
      const [owner, name] = id.split('/') as [string, string]
      return {
        queryKey: repoQueryKey(id),
        queryFn: ({ signal }: { signal: AbortSignal }) => github.getRepo(owner, name, { signal }),
      }
    }),
  })

  const budget = treeBudget(ids.length)
  const trees = useQueries({
    queries: ids.map((id, i) => {
      const [owner, name] = id.split('/') as [string, string]
      const branch = repos[i]?.data?.default_branch
      return {
        queryKey: ['tree', owner, name, branch],
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          fetchRepoTree(github, owner, name, branch!, { signal, maxRequests: budget }),
        enabled: branch !== undefined,
      }
    }),
  })

  const city: CityRepo[] = ids.map((id, i) => {
    const repo = repos[i]!
    const tree = trees[i]!
    const error = repo.error ?? tree.error
    return {
      id,
      repo: repo.data,
      tree: tree.data,
      error,
      status: error ? 'error' : tree.data ? 'ready' : 'loading',
    }
  })

  const settled = city.every((r) => r.status !== 'loading')
  const ready = city.filter((r) => r.status === 'ready')
  const signature = settled ? ready.map((r) => r.id).join(',') : null

  // While repositories are still loading, the previous city stays on screen. Adjusting state
  // during render (instead of in an effect) swaps the city in without an extra empty frame.
  const [built, setBuilt] = useState<{ signature: string; layout: TreeCityLayout | null }>({
    signature: '',
    layout: null,
  })
  if (signature !== null && signature !== built.signature) {
    const layout =
      ready.length === 0
        ? null
        : ready.length === 1
          ? layoutTreeCity(ready[0]!.tree!.files, { size: 120 })
          : layoutReposCity(
              ready.map((r) => ({ id: r.id, files: r.tree!.files })),
              { size: 120 },
            )
    setBuilt({ signature, layout })
  }

  return {
    repos: city,
    layout: built.layout,
    /** Repositories in the layout on screen, which can lag behind `repos` while loading. */
    built: built.signature,
    settled,
  }
}
