import { layoutDistrictCity, type DistrictCityLayout, type DistrictInput } from './district-city'

export interface RepoInput {
  id: string
  /** Bytes per language. Empty for forks, which fall back to `language`. */
  languages: Readonly<Record<string, number>>
  language: string | null
  sizeKb: number
  commits: number
  /** Last push, as a timestamp in ms; null for a repo that was never pushed. */
  pushedAt: number | null
}

export interface ContributionInput {
  id: string
  language: string | null
  pullRequests: number
  stars: number
}

export interface RepoBuilding {
  id: string
  district: string
  language: string
  /** Share of the repository's code in this language, 0..1. */
  share: number
  /** 0 (recently active) .. 1 (untouched for two years or more). */
  staleness: number
}

export interface RepoCityLayout extends DistrictCityLayout {
  meta: Map<string, RepoBuilding>
}

export const CONTRIBUTIONS_DISTRICT = 'contributions'
const MONTH = 30.44 * 24 * 60 * 60 * 1000

/** Smog starts after six months without a push and is at its thickest after two years. */
export const staleness = (pushedAt: number | null, now: number) =>
  pushedAt === null ? 1 : Math.min(1, Math.max(0, ((now - pushedAt) / MONTH - 6) / 18))

/**
 * My Repos as a city: each repository is a district and each of its languages a building.
 * District area grows with the logarithm of the repository size (so one huge repo does not
 * swallow the map), a building's footprint is its language's share of the code, and heights grow
 * with the logarithm of the commit count. Pull requests to other people's repositories form one
 * extra district.
 */
export function layoutRepoCity(
  repos: readonly RepoInput[],
  contributions: readonly ContributionInput[],
  now: number,
  options: { size?: number } = {},
): RepoCityLayout {
  const meta = new Map<string, RepoBuilding>()

  const districts: DistrictInput[] = repos.map((repo) => {
    const entries = Object.entries(repo.languages)
    const languages = entries.length > 0 ? entries : [[repo.language ?? 'Other', 1] as const]
    const total = languages.reduce((sum, [, bytes]) => sum + bytes, 0) || 1
    // Keep a sliver of a few percent for tiny languages so they stay visible and clickable.
    const shares = languages.map(([name, bytes]) => [name, Math.max(bytes / total, 0.04)] as const)
    const shareTotal = shares.reduce((sum, [, s]) => sum + s, 0)
    const maxShare = Math.max(...shares.map(([, s]) => s))

    const area = 1 + Math.log2(1 + repo.sizeKb)
    const repoHeight = 3 + Math.log2(1 + repo.commits) * 3
    const stale = staleness(repo.pushedAt, now)

    return {
      id: repo.id,
      items: shares
        .sort((a, b) => b[1] - a[1])
        .map(([language, share]) => {
          const id = `${repo.id}/${language}`
          meta.set(id, {
            id,
            district: repo.id,
            language,
            share: share / shareTotal,
            staleness: stale,
          })
          return {
            id,
            weight: (area * share) / shareTotal,
            height: repoHeight * (0.55 + (0.45 * share) / maxShare),
          }
        }),
    }
  })

  if (contributions.length > 0) {
    districts.push({
      id: CONTRIBUTIONS_DISTRICT,
      items: contributions.map((c) => {
        meta.set(c.id, {
          id: c.id,
          district: CONTRIBUTIONS_DISTRICT,
          language: c.language ?? 'Other',
          share: 1,
          staleness: 0,
        })
        return {
          id: c.id,
          weight: 1.5 + c.pullRequests,
          height: 4 + c.pullRequests * 4 + Math.log2(1 + c.stars),
        }
      }),
    })
  }

  return { ...layoutDistrictCity(districts, { size: options.size ?? 90 }), meta }
}
