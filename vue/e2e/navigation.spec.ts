import { test, expect } from '@playwright/test'
import { mockBackend, authenticate } from './_helpers'

test.describe('post-login navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page)
    await page.goto('/login')
    await authenticate(page)
    await page.goto('/home')
  })

  test('navigates between main demo sections via the sidebar', async ({ page }) => {
    await expect(page).toHaveURL(/\/home/)

    await page.getByRole('link', { name: 'Showcase' }).first().click()
    await expect(page).toHaveURL(/\/showcase/)
    await expect(page.getByText('Welcome to the local showcase')).toBeVisible()

    await page.getByRole('link', { name: 'Demo', exact: true }).first().click()
    await expect(page).toHaveURL(/\/demo/)
    await expect(page.getByRole('heading', { name: 'Demo Content' })).toBeVisible()

    await page.getByRole('link', { name: 'Home' }).first().click()
    await expect(page).toHaveURL(/\/home/)
  })

  test('renders the NotFound view for unknown routes', async ({ page }) => {
    await page.goto('/definitely-does-not-exist')
    // 404 appears both in the breadcrumb and in the NotFound card; assert
    // against the large-text variant rendered inside the card's title slot.
    await expect(page.locator('.text-red-500').filter({ hasText: '404' })).toBeVisible()
  })
})
