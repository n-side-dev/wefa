import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[data-test="demo-home"] h1')).toHaveText('WeFa Demo Workspace')
})

test('prefills and saves a product from the creation form', async ({ page }) => {
  await page.goto('/catalog/products/new?name=banana&category=fruit')

  await expect(page.locator('[data-test="product-create-name"]')).toHaveValue('banana')
  await expect(page.locator('[data-test="product-create-category"]')).toHaveValue('fruit')

  await page.locator('[data-test="product-create-save"]').click()

  await expect(page).toHaveURL(/\/catalog\?highlight=banana$/)
  await expect(page.locator('[data-test="catalog-highlight-panel"]')).toContainText('banana')
  await expect(page.getByText('banana')).toBeVisible()
  await expect(page.getByText('fruit')).toBeVisible()
})

test('adds a product with quantity to the cart from route query params', async ({ page }) => {
  await page.goto('/cart?product=banana&quantity=2')

  await expect(page.locator('[data-test="cart-focus-banner"]')).toContainText('banana')
  await expect(page.locator('[data-test="cart-focus-banner"]')).toContainText('2')
  await expect(page.getByText('banana')).toBeVisible()
  await expect(page.getByText('2')).toBeVisible()
})
