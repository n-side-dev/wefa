import { test, expect } from '@playwright/test'
import { mockBackend, authenticate, MOCK_TOKEN } from './_helpers'

test.describe('auth flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page)
  })

  test('unauthenticated visits to / are redirected to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('valid credentials log in and redirect to /home', async ({ page }) => {
    await page.goto('/login')
    // PrimeVue's Password wrapper doesn't propagate its `id` down to the
    // underlying input, so the programmatic label association works for
    // Username but not Password. Target the two textboxes by position.
    const textboxes = page.getByRole('textbox')
    await textboxes.nth(0).fill('demo')
    await textboxes.nth(1).fill('demo')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/home/)
    // Token is persisted under the expected localStorage key.
    const stored = await page.evaluate(() => localStorage.getItem('authenticationToken'))
    expect(stored).toBe(MOCK_TOKEN)
  })

  test('invalid credentials keep the user on /login and surface an error toast', async ({
    page,
  }) => {
    await page.goto('/login')
    const textboxes = page.getByRole('textbox')
    await textboxes.nth(0).fill('demo')
    await textboxes.nth(1).fill('wrong-password')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('Sign in failed')).toBeVisible()
  })

  test('hitting /login while authenticated bounces the user to /home', async ({ page }) => {
    await page.goto('/login')
    await authenticate(page)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/home/)
  })
})
