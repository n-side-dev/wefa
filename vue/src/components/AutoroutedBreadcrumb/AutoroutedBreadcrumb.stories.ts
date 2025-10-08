import { type Meta, type StoryObj } from '@storybook/vue3-vite'
import { useRouter, type Router } from 'vue-router'
import { expect, within, waitFor, userEvent } from 'storybook/test'

import AutoroutedBreadcrumb from './AutoroutedBreadcrumb.vue'

// Create a global variable to store the router instance
let routerInstance: Router | null = null

// Helper functions for testing
/**
 * Waits for the breadcrumb component to render
 * @param canvas - The testing canvas from Storybook's within function
 */
async function waitForBreadcrumbToRender(canvas: ReturnType<typeof within>) {
  await waitFor(async () => {
    const breadcrumb = canvas.getByRole('navigation')
    await expect(breadcrumb).toBeInTheDocument()
  })
}

/**
 * Checks that the expected breadcrumb items are present
 * @param canvas - The testing canvas from Storybook's within function
 */
async function checkBreadcrumbItems(canvas: ReturnType<typeof within>) {
  // Check that breadcrumb items are rendered
  await waitFor(async () => {
    // Should have breadcrumb items for the nested route: Products > Category > Product Item
    const breadcrumbItems = canvas.getAllByRole('link')
    await expect(breadcrumbItems.length).toBeGreaterThan(0)
  })

  // Check for expected breadcrumb text content
  await waitFor(async () => {
    await expect(canvas.getByText('Products')).toBeInTheDocument()
    await expect(canvas.getByText('Category')).toBeInTheDocument()
    await expect(canvas.getByText('Product Item')).toBeInTheDocument()
  })
}
/**
 * Navigates back to the item route for further testing
 * @param router - The Vue Router instance
 */
async function navigateToItemRoute(router: Router) {
  await router.push({
    name: 'item',
    params: {
      id: 'electronics',
      itemId: 'laptop',
    },
  })
}
/**
 * Tests navigation by clicking on a breadcrumb item
 * @param canvas - The testing canvas from Storybook's within function
 * @param router - The Vue Router instance
 * @param linkText - The text of the link to click
 * @param expectedRouteName - The expected route name after navigation
 * @param expectedParams - Optional expected route parameters after navigation
 */
async function testNavigation(
  canvas: ReturnType<typeof within>,
  router: Router,
  linkText: string,
  expectedRouteName: string,
  expectedParams?: Record<string, string>
) {
  const link = canvas.getByText(linkText)
  await userEvent.click(link)

  // Wait for the router navigation to complete before checking the route
  await waitFor(async () => {
    await expect(router.currentRoute.value.name).toBe(expectedRouteName)
  })

  // If expected params are provided, verify them
  if (expectedParams) {
    // Wait for route params to be available and verify them
    await waitFor(async () => {
      // Get the current route params
      const currentParams = router.currentRoute.value.params

      // Verify each expected parameter by comparing the entire params object
      // This avoids direct property access with bracket notation
      const expectedEntries = Object.entries(expectedParams)
      for (const [expectedKey, expectedValue] of expectedEntries) {
        // Check if the key exists in the params
        const keyExists = Object.prototype.hasOwnProperty.call(currentParams, expectedKey)
        await expect(keyExists).toBe(true)

        // If the key exists, verify the value by comparing the stringified objects
        if (keyExists) {
          // Create a test object with just this key-value pair
          const testObj = { [expectedKey]: expectedValue }
          const testJson = JSON.stringify(testObj)

          // Create a similar object from the actual params
          // Use a safer approach that avoids bracket notation entirely
          // Convert the params to an array of entries, filter for the key we want, and convert back to an object
          const entries = Object.entries(currentParams)
          const filteredEntries = entries.filter(([key]) => key === expectedKey)
          const actualValue = filteredEntries.length > 0 ? filteredEntries[0]?.[1] : undefined
          const actualObj = { [expectedKey]: actualValue }
          const actualJson = JSON.stringify(actualObj)

          // Compare the JSON strings
          await expect(actualJson).toBe(testJson)
        }
      }
    })
  }
}

/**
 * Tests navigation to the home route by clicking on the home link
 * @param canvas - The testing canvas from Storybook's within function
 * @param router - The Vue Router instance
 */
async function testHomeNavigation(canvas: ReturnType<typeof within>, router: Router) {
  // Get the home link (first link with home icon) and click it
  const homeLink = canvas.getAllByRole('link')[0]
  await userEvent.click(homeLink)

  // Wait for the router navigation to complete before checking the route
  await waitFor(() => {
    expect(router.currentRoute.value.path).toBe('/')
  })
}

const meta = {
  title: 'Components/AutoroutedBreadcrumb',
  component: AutoroutedBreadcrumb,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (story) => {
      return {
        components: { story },
        template: '<div style="width: 600px;"><story /></div>',
        async beforeMount() {
          // Navigate to the route based on the story context
          const router = useRouter()
          // Store the router instance in the global variable
          routerInstance = router
          await router.push({
            name: 'item',
            params: {
              id: 'electronics',
              itemId: 'laptop',
            },
          })
        },
      }
    },
  ],
} satisfies Meta<typeof AutoroutedBreadcrumb>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Use the global router instance
    // We know the router will be available in the test environment
    const router = routerInstance!

    // Wait for the component to render and check breadcrumb items
    await waitForBreadcrumbToRender(canvas)
    await checkBreadcrumbItems(canvas)

    // Test navigation by clicking on breadcrumb items
    // Test navigation to products route
    await testNavigation(canvas, router, 'Products', 'products')

    // Navigate back to the item route for further testing
    await navigateToItemRoute(router)

    // Test navigation to category route
    await testNavigation(canvas, router, 'Category', 'category', { id: 'electronics' })
  },
}

export const WithHomeRoute: Story = {
  args: {
    homeRoute: '/',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Use the global router instance
    // We know the router will be available in the test environment
    const router = routerInstance!

    // Wait for the component to render and check breadcrumb items
    await waitForBreadcrumbToRender(canvas)
    await checkBreadcrumbItems(canvas)

    // Verify that we have more links when home route is provided (home + breadcrumb items)
    await waitFor(() => {
      const breadcrumbItems = canvas.getAllByRole('link')
      expect(breadcrumbItems.length).toBeGreaterThan(3) // Should include home link
    })

    // Test navigation by clicking on breadcrumb items
    // Test navigation to home route
    await testHomeNavigation(canvas, router)

    // Navigate back to the item route for further testing
    await navigateToItemRoute(router)

    // Test navigation to products route
    await testNavigation(canvas, router, 'Products', 'products')

    // Navigate back to the item route for further testing
    await navigateToItemRoute(router)

    // Test navigation to category route
    await testNavigation(canvas, router, 'Category', 'category', { id: 'electronics' })
  },
}
