import { test, expect } from '@playwright/test'
import { mockBackend, authenticate } from './_helpers'

test('smoke: authenticated visit to / reaches the demo home view', async ({ page }) => {
  await mockBackend(page)
  // First hit the app to get localStorage access on the correct origin.
  await page.goto('/login')
  await authenticate(page)
  await page.goto('/')
  await expect(page.locator('h1')).toContainText("You've reached the demo view of N-SIDE WeFa")
})
