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
          meta: { wefa: { title: 'Level 1', icon: 'pi pi-folder' } },
          children: [
            {
              path: 'level2',
              name: 'level2',
              component: { template: '<div>Level 2</div>' },
              meta: { wefa: { title: 'Level 2', icon: 'pi pi-file' } },
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('renders properly with no matched routes', async () => {
    const mockRoute = createMockRoute([], '/')

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    expect(wrapper.findComponent({ name: 'Breadcrumb' }).exists()).toBe(true)
    expect(wrapper.findAll('a').length).toBe(0)
  })

  it('renders breadcrumb items based on matched routes', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/',
          name: 'home',
          meta: { wefa: { title: 'Home', icon: 'pi pi-home' } },
        },
        {
          path: '/products',
          name: 'products',
          meta: { wefa: { title: 'Products', icon: 'pi pi-box' } },
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

    const items = wrapper.findAll('a')
    expect(items.length).toBe(2)
    expect(items[0]?.text()).toContain('Home')
    expect(items[1]?.text()).toContain('Products')
  })

  it('renders home icon when homeRoute prop is provided', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/products',
          name: 'products',
          meta: { wefa: { title: 'Products', icon: 'pi pi-box' } },
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

    const items = wrapper.findAll('a')
    expect(items.length).toBe(2)
    expect(items[0]?.find('.pi-home').exists()).toBe(true)
    expect(items[1]?.text()).toContain('Products')
  })

  it('does not render home icon when current route is home route', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/',
          name: 'home',
          meta: { wefa: { title: 'Home', icon: 'pi pi-home' } },
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

    const items = wrapper.findAll('a')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('Home')
  })

  it('uses route name as fallback when meta.wefa.title is missing', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/no-meta',
          name: 'no-meta-route',
          meta: { wefa: { icon: 'pi pi-info' } },
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

    const items = wrapper.findAll('a')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('no-meta-route')
  })

  it('handles undefined route name gracefully', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/unnamed',
          name: undefined,
          meta: { wefa: { title: 'Unnamed Route' } },
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

    const items = wrapper.findAll('a')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('Unnamed Route')
  })

  it('renders correctly with multiple levels of nested routes', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/nested',
          name: 'nested',
          meta: { wefa: { title: 'Nested', icon: 'pi pi-home' } },
        },
        {
          path: '/nested/level1',
          name: 'level1',
          meta: { wefa: { title: 'Level 1', icon: 'pi pi-folder' } },
        },
        {
          path: '/nested/level1/level2',
          name: 'level2',
          meta: { wefa: { title: 'Level 2', icon: 'pi pi-file' } },
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

    const items = wrapper.findAll('a')
    expect(items.length).toBe(3)
    expect(items[0]?.text()).toContain('Nested')
    expect(items[1]?.text()).toContain('Level 1')
    expect(items[2]?.text()).toContain('Level 2')
  })

  it('renders icons correctly for routes with icons', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/nested',
          name: 'nested',
          meta: { wefa: { title: 'Nested', icon: 'pi pi-home' } },
        },
        {
          path: '/nested/level1',
          name: 'level1',
          meta: { wefa: { title: 'Level 1', icon: 'pi pi-folder' } },
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

    expect(wrapper.find('.pi-home').exists()).toBe(true)
    expect(wrapper.find('.pi-folder').exists()).toBe(true)
  })

  it('uses path-based routing when a matched route has no name', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/',
          name: undefined,
          meta: { wefa: { icon: 'pi pi-home' } },
        },
        {
          path: '/products',
          name: 'products',
          meta: { wefa: { title: 'Products' } },
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

    const items = wrapper.findAll('a')
    expect(items.length).toBe(2)
    expect(items[0]?.attributes('href')).toBe('/')
  })

  it('dedupes breadcrumb items when parent and child share the same path', async () => {
    if (!mockRouter.hasRoute('duplicate-child')) {
      mockRouter.addRoute({
        path: '/duplicate',
        name: 'duplicate-child',
        component: { template: '<div>Duplicate</div>' },
      })
    }

    const mockRoute = createMockRoute(
      [
        {
          path: '/duplicate',
          name: 'duplicate-parent',
          meta: { wefa: { title: 'Parent' } },
        },
        {
          path: '/duplicate',
          name: 'duplicate-child',
          meta: { wefa: { title: 'Child' } },
        },
      ],
      '/duplicate'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    const items = wrapper.findAll('a')
    expect(items.length).toBe(1)
    expect(items[0]?.text()).toContain('Child')
  })

  it('navigates correctly when breadcrumb items are clicked', async () => {
    const mockRoute = createMockRoute(
      [
        {
          path: '/products',
          name: 'products',
          meta: { wefa: { title: 'Products' } },
        },
      ],
      '/products'
    )

    vi.mocked(useRoute).mockReturnValue(mockRoute)

    const routerPushSpy = vi.spyOn(mockRouter, 'push')

    const wrapper = mount(AutoroutedBreadcrumb, {
      global: {
        plugins: [mockRouter],
      },
    })
    await flushPromises()

    await wrapper.find('a').trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'products',
      })
    )
  })
})
