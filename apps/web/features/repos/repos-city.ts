import { CONTRIBUTIONS_DISTRICT, layoutRepoCity, type RepoCityLayout } from '@devcity/city-layout'
import {
  reposDataSchema,
  type Contribution,
  type RepoSummary,
  type ReposData,
} from '@devcity/github-client'
import raw from '@/public/data/repos.json'

/** Written by scripts/build-data.ts before the build, validated here at build time. */
export const reposData: ReposData = reposDataSchema.parse(raw)

export { CONTRIBUTIONS_DISTRICT }

export interface ReposCity {
  layout: RepoCityLayout
  repos: Map<string, RepoSummary>
  contributions: Map<string, Contribution>
}

export function buildReposCity(data: ReposData, now: number): ReposCity {
  // Own work first, forks after.
  const repos = [...data.repos].sort((a, b) => Number(a.fork) - Number(b.fork))
  return {
    layout: layoutRepoCity(
      repos.map((r) => ({
        id: r.name,
        languages: r.languages,
        language: r.language,
        sizeKb: r.sizeKb,
        commits: r.commits,
        pushedAt: r.pushedAt ? Date.parse(r.pushedAt) : null,
      })),
      data.contributions.map((c) => ({
        id: c.fullName,
        language: c.language,
        pullRequests: c.pullRequests.length,
        stars: c.stars,
      })),
      now,
    ),
    repos: new Map(repos.map((r) => [r.name, r])),
    contributions: new Map(data.contributions.map((c) => [c.fullName, c])),
  }
}
