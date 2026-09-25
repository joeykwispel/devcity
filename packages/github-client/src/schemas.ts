import { z } from 'zod'

// Only the fields DevCity uses. Zod strips the rest, so the persisted cache stays small.

export const repoSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  owner: z.object({ login: z.string() }),
  description: z.string().nullable(),
  html_url: z.url(),
  homepage: z.string().nullable().optional(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  open_issues_count: z.number(),
  size: z.number(),
  default_branch: z.string(),
  created_at: z.string(),
  pushed_at: z.string().nullable(),
  topics: z.array(z.string()).optional().default([]),
  fork: z.boolean(),
  archived: z.boolean(),
  license: z.object({ spdx_id: z.string().nullable() }).nullable().optional(),
})
export type Repo = z.infer<typeof repoSchema>

export const languagesSchema = z.record(z.string(), z.number())
export type Languages = z.infer<typeof languagesSchema>

export const treeEntrySchema = z.object({
  path: z.string(),
  type: z.enum(['blob', 'tree', 'commit']),
  sha: z.string(),
  size: z.number().optional(),
})
export type TreeEntry = z.infer<typeof treeEntrySchema>

export const treeSchema = z.object({
  sha: z.string(),
  tree: z.array(treeEntrySchema),
  truncated: z.boolean(),
})

export const pullRequestSearchSchema = z.object({
  total_count: z.number(),
  items: z.array(
    z.object({
      number: z.number(),
      title: z.string(),
      html_url: z.url(),
      state: z.enum(['open', 'closed']),
      created_at: z.string(),
      repository_url: z.url(),
      pull_request: z.object({ merged_at: z.string().nullable().optional() }).optional(),
    }),
  ),
})

export const rateLimitSchema = z.object({
  resources: z.object({
    core: z.object({
      limit: z.number(),
      remaining: z.number(),
      used: z.number(),
      reset: z.number(),
    }),
  }),
})
