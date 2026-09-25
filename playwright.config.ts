import { defineConfig, devices } from '@playwright/test'

const CI = Boolean(process.env.CI)
// PW_CHANNEL=chrome runs the tests in an installed Google Chrome instead of Playwright's Chromium.
const channel = process.env.PW_CHANNEL || undefined

/** End-to-end tests against the static export. Run `pnpm build` first, then `pnpm test:e2e`. */
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  // Every page renders WebGL, in software on CI runners: too many at once starves the CPU.
  workers: CI ? 2 : 3,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/serve.mjs apps/web/out 4173',
    url: 'http://localhost:4173/en/',
    reuseExistingServer: !CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, grep: /@mobile/ },
  ],
})
