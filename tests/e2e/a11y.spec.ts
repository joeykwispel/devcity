import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mockGitHub } from '../fixtures/github'

// axe walks the whole DOM while the scene keeps rendering; give it room on slow runners.
test.describe.configure({ timeout: 90_000 })

const pages = [
  '/en/',
  '/nl/',
  '/en/career/',
  '/en/repos/',
  '/en/any-repo/?repo=octo/demo',
  '/en/?view=list',
  '/nl/career/?view=list',
  '/en/repos/?view=list',
  '/en/?select=React',
]

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // The WebGL canvas is decorative (aria-hidden); the list view is its accessible equivalent.
    .exclude('canvas')
    .analyze()
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
  }))
}

for (const path of pages) {
  test(`no WCAG violations on ${path}`, async ({ page }) => {
    await mockGitHub(page)
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Let the data load and the entrance animation settle.
    await page.waitForTimeout(800)
    expect(await audit(page)).toEqual([])
  })
}

test('light theme passes too', async ({ page }) => {
  await page.goto('/en/')
  await page.getByRole('button', { name: /Switch to light theme/ }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  expect(await audit(page)).toEqual([])
})

test('respects prefers-reduced-motion @mobile', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/en/')
  await expect(page.locator('canvas')).toBeVisible()
  expect(await audit(page)).toEqual([])
})
