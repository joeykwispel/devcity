# DevCity · Joey Oosenbrug

[![DevCity: my skills rendered as a 3D city, with the detail panel for Scrum open](docs/preview.png)](https://devcity.joeyoosenbrug.nl)

My CV and GitHub activity, rendered as a city you can fly around. Every skill is a building, every category a district, and the taller a building, the longer I have used that skill in real projects.

**Live:** [devcity.joeyoosenbrug.nl](https://devcity.joeyoosenbrug.nl) · **Portfolio:** [joeyoosenbrug.nl](https://joeyoosenbrug.nl)

It is the 3D companion to my [portfolio](https://github.com/joeykwispel/Portfolio) and uses the same design language: dark navy, teal and violet accents, Inter and JetBrains Mono, glass panels and code-style headings.

## What you can do

- **Skills layer:** 114 skills from my CV in 8 districts. Hover a building for its name and years, click it to see where I used it and when.
- **Filter by district:** the legend highlights one category and dims the rest.
- **Dark and light theme**, the same palettes as the portfolio.
- **Mobile friendly:** pan with one finger, pinch to zoom, rotate with two fingers.
- **Accessible:** the whole city is also available as a structured list for screen readers, and animations respect `prefers-reduced-motion`.

Years of experience are not typed in by hand. They are derived from the roles in `cv.json` whose stack contains the skill (overlapping roles count once), and they are recalculated in the browser, so the city keeps growing without a redeploy.

## Roadmap

- [x] **1.** Monorepo scaffold, CI, GitHub Pages deploy, custom domain
- [x] **2.** `city-layout` engine + Skills layer from `cv.json`
- [ ] **3.** Dutch/English (next-intl) and the layer switcher
- [ ] **4.** Career layer: roles and education as a timeline district
- [ ] **5.** My Repos layer, generated at build time by `scripts/build-data.ts`
- [ ] **6.** `github-client` + Any Repo layer: type any public repo and see it as a city (TanStack Query, IndexedDB cache, rate-limit UI)
- [ ] **7.** Accessibility pass, visible list view, shareable URLs, Storybook
- [ ] **8.** Polish: day/night cycle, minimap, PNG export, smog, traffic
- [ ] **9.** Optional: Hono edge proxy on Cloudflare Workers so visitors rarely hit GitHub's 60 requests/hour limit

## Tech stack

| Area      | Choice                                                                   |
| --------- | ------------------------------------------------------------------------ |
| Framework | Next.js (App Router, static export), React, TypeScript                   |
| 3D        | three.js, react-three-fiber, drei                                        |
| Layout    | `@devcity/city-layout`: pure TypeScript, d3-hierarchy treemaps, no React |
| Styling   | Tailwind CSS with the portfolio's design tokens                          |
| State     | Zustand                                                                  |
| Data      | `cv.json`, validated with Zod at build time                              |
| Tooling   | Turborepo, pnpm, Vitest, ESLint, Prettier, GitHub Actions                |
| Hosting   | GitHub Pages on a custom subdomain                                       |

## Project structure

```
apps/web/
  app/                  Next.js routes, layout, global styles
  components/           Shared UI (header, theme toggle)
  data/cv.json          CV content: categories, skills, roles
  features/skills/      Skills layer: 3D scene, legend, detail panel
  lib/                  cv schema, env, theme, locale helpers
packages/
  city-layout/          Layout engine + unit tests
  github-client/        Typed GitHub client (phase 6)
.github/workflows/      ci.yml (lint, typecheck, test, build) and deploy.yml (Pages)
```

## Run it locally

Requires Node 24 and pnpm 11 (`corepack enable`).

```sh
pnpm install
cp .env.example apps/web/.env.local   # then fill in values
pnpm dev                              # http://localhost:3000
```

| Command                        | What it does                          |
| ------------------------------ | ------------------------------------- |
| `pnpm dev`                     | Dev server with hot reload            |
| `pnpm build`                   | Static export to `apps/web/out`       |
| `pnpm test`                    | Unit tests (layout engine, CV schema) |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript                   |
| `pnpm format`                  | Prettier                              |

### Editing the CV

Everything in the city comes from [`apps/web/data/cv.json`](apps/web/data/cv.json):

- `categories`: districts, with a hue and an English/Dutch label
- `skills`: one building each; `id` is the name used in role stacks
- `roles`: work history; a skill's height is the total time of the roles that list it in `stack`

The Zod schema checks cross-references too, so a typo in a role's stack, an unknown category or a duplicate id fails `pnpm test` and `pnpm build` instead of silently shipping.

## Environment variables

All configuration comes from env vars; see [`.env.example`](.env.example). Local values go in `apps/web/.env.local` (git-ignored).

Anything prefixed `NEXT_PUBLIC_` is inlined into the static bundle and visible to every visitor, so **secrets never use that prefix**.

| Name                           | Kind   | Where in GitHub      | Purpose                                                  |
| ------------------------------ | ------ | -------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`         | public | Actions **variable** | Canonical URL, `https://devcity.joeyoosenbrug.nl`        |
| `NEXT_PUBLIC_BASE_PATH`        | public | Actions **variable** | Leave unset with a custom domain; `/devcity` without one |
| `NEXT_PUBLIC_GITHUB_USERNAME`  | public | Actions **variable** | User shown in the My Repos layer                         |
| `NEXT_PUBLIC_GITHUB_PROXY_URL` | public | Actions **variable** | Optional edge proxy URL (phase 9)                        |
| `GH_DATA_TOKEN`                | secret | Actions **secret**   | Read-only PAT for build-time GitHub API calls            |

Set them under **Settings → Secrets and variables → Actions**; `deploy.yml` passes them to the build.

## Deployment

1. **Settings → Pages → Source:** GitHub Actions.
2. **Settings → Pages → Custom domain:** `devcity.joeyoosenbrug.nl`, then **Enforce HTTPS** once the certificate is issued.
3. DNS: a `CNAME` record for `devcity` pointing to `joeykwispel.github.io.`
4. Every push to `main` runs `deploy.yml`, which builds `apps/web/out` and publishes it.

## License

The **code** is released under the [MIT License](LICENSE), so feel free to build your own city from it.

Third-party parts (three.js, react-three-fiber, drei, d3-hierarchy, Next.js, React and the other npm dependencies, plus the Inter and JetBrains Mono fonts, self-hosted via `next/font` under the SIL Open Font License) keep their own permissive licenses, all compatible with MIT.

The **content** is not covered by that license: my CV data in `apps/web/data/cv.json`, my name and the preview image (`docs/preview.png`) remain © Joey Oosenbrug. If you fork this, replace `cv.json` with your own.
