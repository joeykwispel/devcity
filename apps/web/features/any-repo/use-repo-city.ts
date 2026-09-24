'use client'

import { layoutTreeCity } from '@devcity/city-layout'
import { fetchRepoTree } from '@devcity/github-client'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { github, usingProxy } from '@/lib/github'

export interface RepoTarget {
  owner: string
  repo: string
}

/** Repository metadata, then its file tree, then the city layout. Each step is cached. */
export function useRepoCity(target: RepoTarget | null) {
  const owner = target?.owner.toLowerCase() ?? ''
  const name = target?.repo.toLowerCase() ?? ''

  const repo = useQuery({
    queryKey: ['repo', owner, name],
    queryFn: ({ signal }) => github.getRepo(owner, name, { signal }),
    enabled: target !== null,
  })

  const branch = repo.data?.default_branch
  const tree = useQuery({
    queryKey: ['tree', owner, name, branch],
    queryFn: ({ signal }) =>
      // The proxy has a server-side token with 5,000 requests/hour; anonymous visitors have 60.
      fetchRepoTree(github, owner, name, branch!, { signal, maxRequests: usingProxy ? 40 : 10 }),
    enabled: branch !== undefined,
  })

  const layout = useMemo(
    () => (tree.data ? layoutTreeCity(tree.data.files, { size: 120 }) : null),
    [tree.data],
  )

  return { repo, tree, layout }
}
