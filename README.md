# DevCity

A CV and GitHub activity rendered as an explorable 3D city. Static Next.js site hosted on GitHub Pages.

## Structure

```
apps/web                 Next.js (App Router, static export)
packages/city-layout     Pure TS layout engine (no React), Vitest
packages/github-client   Typed GitHub client (rate limits, ETags, truncated trees)
scripts/build-data.ts    Build-time data fetch (phase 5)
.github/workflows        ci.yml (lint, typecheck, test, build) and deploy.yml (Pages)
```

## Getting started

Requires Node 24 and pnpm 11 (`corepack enable`).

```sh
pnpm install
cp .env.example apps/web/.env.local   # then fill in values
pnpm dev                              # http://localhost:3000
```

Other scripts: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format`.

## Environment variables

All configuration comes from env vars. See [`.env.example`](.env.example) for the full list.
Local values go in `apps/web/.env.local` (git-ignored).

Anything prefixed `NEXT_PUBLIC_` is inlined into the static bundle and visible to every
visitor, so **secrets never use that prefix**.

| Name                           | Kind   | Where in GitHub      | Purpose                                                |
| ------------------------------ | ------ | -------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`         | public | Actions **variable** | Canonical URL, e.g. `https://devcity.joeyoosenbrug.nl` |
| `NEXT_PUBLIC_BASE_PATH`        | public | Actions **variable** | Empty with a custom domain, `/devcity` without         |
| `NEXT_PUBLIC_GITHUB_USERNAME`  | public | Actions **variable** | User shown in the My Repos layer                       |
| `NEXT_PUBLIC_GITHUB_PROXY_URL` | public | Actions **variable** | Optional edge proxy URL (phase 9)                      |
| `GH_DATA_TOKEN`                | secret | Actions **secret**   | Read-only PAT for build-time GitHub API calls          |

Set them under **Settings > Secrets and variables > Actions**. `deploy.yml` maps them into the build.

## Deployment

1. **Settings > Pages > Source**: GitHub Actions.
2. Pushing to `main` runs `deploy.yml`, which builds `apps/web/out` and publishes it.
3. Custom domain: `apps/web/public/CNAME` holds the domain. Add a DNS `CNAME` record pointing
   it at `<github-user>.github.io`, then enable **Enforce HTTPS** in Settings > Pages.

## Roadmap

1. Monorepo scaffold, CI, Pages deploy, custom domain
2. `city-layout` + Skills layer from `cv.json`
3. i18n (NL/EN) and layer switcher shell
4. Career layer
5. My Repos layer with the build script
6. `github-client` + Any Repo layer (TanStack Query, IndexedDB cache, rate-limit UI)
7. Accessibility, list view, share URLs, Storybook
8. Polish: day/night, minimap, PNG export, smog, cars
9. Optional: Hono edge proxy on Cloudflare Workers with a server-side token

## License

[MIT](LICENSE)
