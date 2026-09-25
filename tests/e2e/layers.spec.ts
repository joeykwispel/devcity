import { expect, test } from '@playwright/test'
import { mockGitHub } from '../fixtures/github'

test('every layer renders its city @mobile', async ({ page }) => {
  for (const [path, heading] of [
    ['/en/', 'Skills'],
    ['/en/career/', 'Career'],
    ['/en/repos/', 'My repos'],
  ] as const) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading)
    await expect(page.locator('canvas')).toBeVisible()
  }
})

test('a shared link opens the selected building', async ({ page }) => {
  await page.goto('/en/?select=React')
  const panel = page.getByRole('complementary', { name: 'React details' })
  await expect(panel).toBeVisible()
  await expect(panel).toContainText('used at')

  await page.keyboard.press('Escape')
  await expect(panel).toBeHidden()
  await expect(page).toHaveURL(/\/en\/$/)
})

test('the list view works with the keyboard alone', async ({ page }) => {
  await page.goto('/en/')
  await page.getByRole('radio', { name: 'List' }).click()
  await expect(page).toHaveURL(/view=list/)
  await expect(page.locator('canvas')).toHaveCount(0)

  const item = page.getByRole('button', { name: /^TypeScript/ })
  await item.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('complementary', { name: 'TypeScript details' })).toBeVisible()
  await expect(page).toHaveURL(/select=TypeScript/)
})

test('legend buttons narrow the list to one district', async ({ page }) => {
  await page.goto('/en/?view=list')
  await page.getByRole('button', { name: /^Testing/ }).click()
  await expect(page.getByRole('heading', { level: 2, name: /Testing/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /Front-end/ })).toHaveCount(0)
})

test('career stack tags link into the skills city', async ({ page }) => {
  await page.goto('/en/career/?select=red-ocelot')
  await page.getByRole('link', { name: 'D3.js' }).click()
  await expect(page).toHaveURL(/\/en\/\?select=D3\.js$/)
  await expect(page.getByRole('complementary', { name: 'D3.js details' })).toBeVisible()
})

test.describe('any repo', () => {
  test('builds a city from the GitHub API and shows the rate limit', async ({ page }) => {
    await mockGitHub(page)
    await page.goto('/en/any-repo/')
    await page.getByLabel('GitHub repository').fill('https://github.com/octo/demo')
    await page.getByRole('button', { name: 'Build city' }).click()

    await expect(page).toHaveURL(/repo=octo%2Fdemo|repo=octo\/demo/)
    await expect(page.getByText('A demo repository')).toBeVisible()
    await expect(page.getByText(/58 of 60 GitHub requests left/)).toBeVisible()
    await expect(page.locator('canvas')).toBeVisible()

    await page.getByRole('radio', { name: 'List' }).click()
    await page.getByRole('button', { name: /^docs\/guide\.md/ }).click()
    await expect(page.getByRole('link', { name: 'Open file on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/octo/demo/blob/main/docs/guide.md',
    )
  })

  test('explains an exhausted rate limit', async ({ page }) => {
    await mockGitHub(page, { rateLimited: true })
    await page.goto('/en/any-repo/?repo=octo/demo')
    await expect(page.getByText(/GitHub rate limit reached/)).toBeVisible()
  })

  test('rejects input that is not a repository', async ({ page }) => {
    await page.goto('/en/any-repo/')
    await page.getByLabel('GitHub repository').fill('not a repo')
    await page.getByRole('button', { name: 'Build city' }).click()
    await expect(page.getByText('Use owner/repo')).toBeVisible()
  })
})

test('unknown URLs get the 404 page', async ({ page }) => {
  const response = await page.goto('/en/nope/')
  expect(response?.status()).toBe(404)
  await expect(page.getByText('Lost in the city')).toBeVisible()
})

test('saves the current view as a PNG and shows the minimap', async ({ page }) => {
  await page.goto('/en/')
  await expect(page.locator('canvas')).toBeVisible()
  const minimap = page.locator('svg.cursor-crosshair')
  await expect(minimap).toBeVisible()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Save PNG' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/^devcity-skills-\d{4}-\d{2}-\d{2}\.png$/)

  await page.getByRole('button', { name: 'Minimap' }).click()
  await expect(minimap).toBeHidden()
})
