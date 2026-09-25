import { z } from 'zod'

/**
 * Format of apps/web/public/data/repos.json, written at build time by scripts/build-data.ts and
 * read by the My Repos layer. Shared here so both sides validate against the same schema.
 */
export const repoSummarySchema = z.object({
  name: z.string(),
  fullName: z.string(),
  description: z.string().nullable(),
  url: z.url(),
  homepage: z.string().nullable(),
  language: z.string().nullable(),
  /** Bytes per language, largest first. */
  languages: z.record(z.string(), z.number()),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number(),
  sizeKb: z.number(),
  commits: z.number(),
  createdAt: z.string(),
  pushedAt: z.string().nullable(),
  topics: z.array(z.string()),
  fork: z.boolean(),
  archived: z.boolean(),
  license: z.string().nullable(),
})
export type RepoSummary = z.infer<typeof repoSummarySchema>

export const contributionSchema = z.object({
  fullName: z.string(),
  url: z.url(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  stars: z.number(),
  pullRequests: z.array(
    z.object({
      number: z.number(),
      title: z.string(),
      url: z.url(),
      state: z.enum(['open', 'merged', 'closed']),
      createdAt: z.string(),
    }),
  ),
})
export type Contribution = z.infer<typeof contributionSchema>

export const reposDataSchema = z.object({
  generatedAt: z.string(),
  user: z.string(),
  repos: z.array(repoSummarySchema),
  contributions: z.array(contributionSchema),
})
export type ReposData = z.infer<typeof reposDataSchema>
