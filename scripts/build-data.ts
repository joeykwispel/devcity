/**
 * Fetches the data for the My Repos layer at build time and writes apps/web/public/data/repos.json.
 *
 *   pnpm data              # refresh (uses GH_DATA_TOKEN from apps/web/.env.local if present)
 *   DEVCITY_OFFLINE=1 ...  # keep the committed snapshot, no network (used in CI)
 *
 * GH_DATA_TOKEN is optional: without it the unauthenticated limit (60 requests/hour) applies,
 * which is enough for a handful of repos. The token only lives in this process; nothing that
 * reaches the browser contains it.
 *
 * If GitHub is unreachable or rate limited, the existing snapshot is kept so a deploy never
 * fails or ships an empty city because of a GitHub hiccup.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  createGitHubClient,
  GitHubError,
  reposDataSchema,
  type Contribution,
  type RepoSummary,
  type ReposData,
} from '../packages/github-client/src/index.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'apps/web/public/data/repos.json')

const user = process.env.NEXT_PUBLIC_GITHUB_USERNAME || 'joeykwispel'
const token = process.env.GH_DATA_TOKEN || undefined

function keepSnapshot(reason: string) {
  if (existsSync(output)) {
    reposDataSchema.parse(JSON.parse(readFileSync(output, 'utf8')))
    console.warn(`[build-data] ${reason}; keeping the existing ${output}`)
    return
  }
  const empty: ReposData = {
    generatedAt: new Date().toISOString(),
    user,
    repos: [],
    contributions: [],
  }
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(empty, null, 2)}\n`)
  console.warn(`[build-data] ${reason}; wrote an empty ${output}`)
}

async function main() {
  if (process.env.DEVCITY_OFFLINE) return keepSnapshot('DEVCITY_OFFLINE is set')

  let remaining: number | undefined
  const gh = createGitHubClient({
    token,
    userAgent: 'devcity-build-data',
    onRateLimit: (rl) => {
      if (rl.resource === 'core') remaining = rl.remaining
    },
  })

  console.log(`[build-data] fetching public repos of ${user} (${token ? 'with' : 'without'} token)`)
  const list = await gh.listUserRepos(user)

  const repos: RepoSummary[] = []
  for (const r of list) {
    // Forks: GitHub's language and commit numbers describe upstream work, so skip the extra calls.
    const [languages, commits] = r.fork
      ? [{}, 0]
      : await Promise.all([
          gh.getLanguages(r.owner.login, r.name),
          gh.countCommits(r.owner.login, r.name, r.default_branch),
        ])
    repos.push({
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      url: r.html_url,
      homepage: r.homepage || null,
      language: r.language,
      languages: Object.fromEntries(Object.entries(languages).sort((a, b) => b[1] - a[1])),
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: r.open_issues_count,
      sizeKb: r.size,
      commits,
      createdAt: r.created_at,
      pushedAt: r.pushed_at,
      topics: r.topics,
      fork: r.fork,
      archived: r.archived,
      license: r.license?.spdx_id ?? null,
    })
  }

  // Pull requests to repositories owned by someone else.
  const prs = await gh.searchPullRequests(user)
  const byRepo = new Map<string, typeof prs>()
  for (const pr of prs) {
    const fullName = pr.repository_url.replace('https://api.github.com/repos/', '')
    if (fullName.split('/')[0]?.toLowerCase() === user.toLowerCase()) continue
    byRepo.set(fullName, [...(byRepo.get(fullName) ?? []), pr])
  }
  const contributions: Contribution[] = []
  for (const [fullName, repoPrs] of byRepo) {
    const [owner, name] = fullName.split('/') as [string, string]
    const repo = await gh.getRepo(owner, name)
    contributions.push({
      fullName,
      url: repo.html_url,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      pullRequests: repoPrs.map((pr) => ({
        number: pr.number,
        title: pr.title,
        url: pr.html_url,
        state: pr.pull_request?.merged_at ? 'merged' : pr.state,
        createdAt: pr.created_at,
      })),
    })
  }

  const data = reposDataSchema.parse({
    generatedAt: new Date().toISOString(),
    user,
    repos,
    contributions,
  } satisfies ReposData)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`)
  console.log(
    `[build-data] wrote ${repos.length} repos and ${contributions.length} contributions` +
      (remaining === undefined ? '' : ` (${remaining} API requests left this hour)`),
  )
}

main().catch((error: unknown) => {
  const reason =
    error instanceof GitHubError
      ? `GitHub answered ${error.status}: ${error.message}`
      : String(error)
  keepSnapshot(reason)
})
