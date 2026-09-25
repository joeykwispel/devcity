import { expect, test } from '@playwright/test'

test.describe('language redirect', () => {
  test.describe('Dutch browser', () => {
    test.use({ locale: 'nl-NL' })

    test('redirects the root to /nl/ once and remembers it @mobile', async ({ page }) => {
      await page.goto('/')
      await expect(page).toHaveURL(/\/nl\/$/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
      expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('nl')
    })
  })

  test('keeps the query and hash of a shared root link', async ({ page }) => {
    await page.goto('/?select=React#x')
    await expect(page).toHaveURL(/\/en\/\?select=React#x$/)
  })

  test('respects a stored choice over the browser language', async ({ page }) => {
    await page.goto('/en/')
    await page.evaluate(() => localStorage.setItem('lang', 'nl'))
    await page.goto('/')
    await expect(page).toHaveURL(/\/nl\/$/)
  })
})

test('the language switcher keeps the layer and the URL state @mobile', async ({ page }) => {
  await page.goto('/en/career/?view=list')
  await page.getByRole('button', { name: 'Nederlands' }).click()
  await expect(page).toHaveURL(/\/nl\/career\/\?view=list$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Loopbaan')
  expect(await page.evaluate(() => localStorage.getItem('lang'))).toBe('nl')
})

test('formats numbers and dates per locale', async ({ page }) => {
  await page.goto('/nl/?view=list&select=Scrum')
  // Dutch uses a decimal comma and lower-case month abbreviations.
  await expect(page.getByRole('complementary')).toContainText(/\d,\d jr/)
  await expect(page.getByRole('complementary')).toContainText(/jul 2026/)
})
