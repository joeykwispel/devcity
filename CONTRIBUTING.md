# Contributing

1. Branch off `main` (`feat/...`, `fix/...`).
2. Run `pnpm format`, `pnpm turbo run lint typecheck test build build-storybook` and `pnpm test:e2e` before pushing.
3. Open a PR; CI must pass. PRs are squash-merged.

## Conventions

- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`...).
- `packages/city-layout` stays pure TypeScript: no React, no DOM, fully unit tested.
- New dependencies need to be discussed first.
- Never commit secrets. Config goes through env vars (see `.env.example`); secrets never get a `NEXT_PUBLIC_` prefix.
