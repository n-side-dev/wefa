import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AutoroutedBreadcrumb from './AutoroutedBreadcrumb.vue'
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

// Mock vue-router
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRoute: vi.fn(),
  }
})

// Import after mocking
import { useRoute } from 'vue-router'

// Create a mock router for testing
const mockRouter = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
    { path: '/products', name: 'products', component: { template: '<div>Products</div>' } },
    {
      path: '/products/:id',
      name: 'product-detail',
      component: { template: '<div>Product Detail</div>' },
    },
    { path: '/no-meta', name: 'no-meta-route', component: { template: '<div>No Meta</div>' } },
    {
      path: '/nested',
      name: 'nested',
      component: { template: '<div>Nested</div>' },
      children: [
        {
          path: 'level1',
          name: 'level1',
          component: { template: '<div>Level 1</div>' },
          meta: { title: 'Level 1', icon: 'pi pi-folder' },
          children: [
            {
              path: 'level2',
              name: 'level2',
              component: { template: '<div>Level 2</div>' },
              meta: { title: 'Level 2', icon: 'pi pi-file' },
            },
          ],
        },
      ],
    },
  ],
})

// Helper function to create a complete mock route with all required properties
/**
 * Creates a mock route object with all required properties for testing
 * @param matched - Array of matched route objects with path, name, and meta information
 * @param path - The current route path
 * @param params - Route parameters object (defaults to empty object if not provided)
 * @param query - Query parameters object (defaults to empty object if not provided)
 * @param hash - URL hash fragment (defaults to empty string if not provided)
 * @returns A complete mock route object that can be used for testing
 */
function createMockRoute(
  matched: Array<{
    path: string
    name?: string
    meta?: Record<string, unknown>
  }>,
  path: string,
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  hash = ''
): RouteLocationNormalizedLoaded {
  return {
    matched,
    path,
    fullPath: path,
    params,
    query,
    hash,
    name: matched[matched.length - 1]?.name,
    meta: matched[matched.length - 1]?.meta || {},
    redirectedFrom: undefined,
  } as RouteLocationNormalizedLoaded
}

describe('AutoroutedBreadcrumb', () => {
  // Setup and teardown
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })
  // Basic test - renders with default props
  it('renders properly with no matched routes', async () => {
    // Mock route with no matched routes
    const mockRoute = createMockRoute([], '/')

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should render the Breadcrumb component but with no items
    expect(wrapper.findComponent({ name: 'Breadcrumb' }).exists()).toBe(true)
    expect(wrapper.findAll('a').length).toBe(0)
  })

  // Test with matched routes
  it('renders breadcrumb items based on matched routes', async () => {
    // Mock route with matched routes
    const mockRoute = createMockRoute(
      [
        {
          path: '/',
          name: 'home',
          meta: { title: 'Home', icon: 'pi pi-home' },
        },
        {
          path: '/products',
          name: 'products',
          meta: { title: 'Products', icon: 'pi pi-box' },
        },
      ],
      '/products'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should render breadcrumb items for each matched route
    const items = wrapper.findAll('a')
    expect(items.length).toBe(2)
    expect(items[0]?.text()).toContain('Home')
    expect(items[1]?.text()).toContain('Products')
  })

  // Test with homeRoute prop
  it('renders home icon when homeRoute prop is provided', async () => {
    // Mock route that is not the home route
    const mockRoute = createMockRoute(
      [
        {
          path: '/products',
          name: 'products',
          meta: { title: 'Products', icon: 'pi pi-box' },
        },
      ],
      '/products'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      props: {
        homeRoute: '/',
      },
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should render home icon plus the matched route
    const items = wrapper.findAll('a')
    expect(items.length).toBe(2)
    expect(items[0]?.find('.pi-home').exists()).toBe(true)
    expect(items[1]?.text()).toContain('Products')
  })

  // Test when current route is home route
  it('does not render home icon when current route is home route', async () => {
    // Mock route that is the home route
    const mockRoute = createMockRoute(
      [
        {
          path: '/',
          name: 'home',
          meta: { title: 'Home', icon: 'pi pi-home' },
        },
      ],
      '/'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      props: {
        homeRoute: '/',
      },
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should only render the matched route, not the home icon
    const items = wrapper.findAll('a')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('Home')
  })

  // Test with missing meta information
  it('uses route name as fallback when meta.title is missing', async () => {
    // Mock route with no meta.title
    const mockRoute = createMockRoute(
      [
        {
          path: '/no-meta',
          name: 'no-meta-route',
          meta: { icon: 'pi pi-info' },
        },
      ],
      '/no-meta'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should use route name as label
    const items = wrapper.findAll('a')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('no-meta-route')
  })

  // Test with undefined route name
  it('handles undefined route name gracefully', async () => {
    // Mock route with undefined name
    const mockRoute = createMockRoute(
      [
        {
          path: '/unnamed',
          name: undefined,
          meta: { title: 'Unnamed Route' },
        },
      ],
      '/unnamed'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should use meta.title as label
    const items = wrapper.findAll('a')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('Unnamed Route')
  })

  // Test with multiple levels of nested routes
  it('renders correctly with multiple levels of nested routes', async () => {
    // Mock route with nested routes
    const mockRoute = createMockRoute(
      [
        {
          path: '/nested',
          name: 'nested',
          meta: { title: 'Nested', icon: 'pi pi-home' },
        },
        {
          path: '/nested/level1',
          name: 'level1',
          meta: { title: 'Level 1', icon: 'pi pi-folder' },
        },
        {
          path: '/nested/level1/level2',
          name: 'level2',
          meta: { title: 'Level 2', icon: 'pi pi-file' },
        },
      ],
      '/nested/level1/level2'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should render all three levels
    const items = wrapper.findAll('a')
    expect(items.length).toBe(3)
    expect(items[0]?.text()).toContain('Nested')
    expect(items[1]?.text()).toContain('Level 1')
    expect(items[2]?.text()).toContain('Level 2')
  })

  // Test icon rendering
  it('renders icons correctly for routes with icons', async () => {
    // Mock route with icons
    const mockRoute = createMockRoute(
      [
        {
          path: '/nested',
          name: 'nested',
          meta: { title: 'Nested', icon: 'pi pi-home' },
        },
        {
          path: '/nested/level1',
          name: 'level1',
          meta: { title: 'Level 1', icon: 'pi pi-folder' },
        },
      ],
      '/nested/level1'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Should render icons
    expect(wrapper.find('.pi-home').exists()).toBe(true)
    expect(wrapper.find('.pi-folder').exists()).toBe(true)
  })

  // Test click navigation
  it('navigates correctly when breadcrumb items are clicked', async () => {
    // Mock route
    const mockRoute = createMockRoute(
      [
        {
          path: '/products',
          name: 'products',
          meta: { title: 'Products' },
        },
      ],
      '/products'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    // Spy on router push method
    const routerPushSpy = vi.spyOn(mockRouter, 'push')

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    // Click the breadcrumb item
    await wrapper.find('a').trigger('click')

    // Verify router.push was called with correct route
    expect(routerPushSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'products',
      })
    )
  })
})
