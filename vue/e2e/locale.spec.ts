import { test, expect } from '@playwright/test'
import { mockBackend, authenticate } from './_helpers'

test.describe('locale switching', () => {
  test.beforeEach(async ({ page }) => {
    await mockBackend(page)
    await page.goto('/login')
    await authenticate(page)
    await page.goto('/home')
  })

  test('switching to French updates visible strings and persists across reloads', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      "You've reached the demo view of N-SIDE WeFa"
    )

    // The LocaleSelector is labeled "Language" (aria-label from
    // locale_selector.label). Option labels are produced by
    // `Intl.DisplayNames` in the active locale — in English, French's
    // label is "French".
    await page.getByRole('combobox', { name: 'Language' }).click()
    await page.getByRole('option', { name: 'French' }).click()

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Vous êtes sur la vue de démonstration de N-SIDE WeFa'
    )

    // Persisted in localStorage under the user scope.
    const stored = await page.evaluate(() => localStorage.getItem('wefa.locale:user'))
    expect(stored).toBe('fr')

    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Vous êtes sur la vue de démonstration de N-SIDE WeFa'
    )
  })
})
