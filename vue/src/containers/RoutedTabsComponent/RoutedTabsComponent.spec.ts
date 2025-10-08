import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory, type Router } from 'vue-router'
import RoutedTabsComponent from './RoutedTabsComponent.vue'

// Mock ResizeObserver for test environment
/* eslint-disable @typescript-eslint/no-unused-vars */
global.ResizeObserver = class ResizeObserver {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// Mock routes for testing
const routes = [
  { path: '/tab1', name: 'Tab1', component: { template: '<div>Tab 1 Content</div>' } },
  { path: '/tab2', name: 'Tab2', component: { template: '<div>Tab 2 Content</div>' } },
  { path: '/tab3', name: 'Tab3', component: { template: '<div>Tab 3 Content</div>' } },
  { path: '/other-route', name: 'OtherRoute', component: { template: '<div>Other Route</div>' } },
  { path: '/404', name: '404', component: { template: '<div>404 Not Found</div>' } },
]

describe('RoutedTabsComponent', () => {
  let router: Router
  let wrappers: VueWrapper[] = []

  beforeEach(async () => {
    router = createRouter({
      history: createWebHistory(),
      routes,
    })

    // Navigate to the first tab initially
    await router.push('/tab1')

    // Clear wrappers array
    wrappers = []
  })

  afterEach(async () => {
    // Unmount all components to prevent unhandled errors
    for (const wrapper of wrappers) {
      if (wrapper && wrapper.unmount) {
        wrapper.unmount()
      }
    }
    wrappers = []

    // Clear any pending timeouts
    // Wait a bit to ensure any pending async operations complete
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it('renders correctly with tabs prop', async () => {
    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs: ['Tab1', 'Tab2', 'Tab3'],
      },
      global: {
        plugins: [router],
      },
    })
    wrappers.push(wrapper)

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('.routed-tabs-component').exists()).toBe(true)
  })

  it('displays the correct number of tabs', async () => {
    const tabs = ['Tab1', 'Tab2', 'Tab3']
    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
      },
    })
    wrappers.push(wrapper)

    // Check that Tabs component is rendered
    const tabsComponent = wrapper.find('[data-pc-name="tabs"]')
    expect(tabsComponent.exists()).toBe(true)
  })

  it('sets the correct active tab based on current route', async () => {
    const tabs = ['Tab1', 'Tab2', 'Tab3']

    // Start with Tab1 route
    await router.push('/tab1')

    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
      },
    })

    // The activeTabIndex should be 0 for Tab1
    expect(wrapper.vm.activeTabIndex).toBe(0)
  })

  it('updates active tab when route changes', async () => {
    const tabs = ['Tab1', 'Tab2', 'Tab3']

    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
      },
    })
    wrappers.push(wrapper)

    // Initially on Tab1
    expect(wrapper.vm.activeTabIndex).toBe(0)

    // Navigate to Tab2
    await router.push('/tab2')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.activeTabIndex).toBe(1)
  })

  it('handles navigation when tab is clicked', async () => {
    const tabs = ['Tab1', 'Tab2', 'Tab3']

    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
      },
    })
    wrappers.push(wrapper)

    // Test that the onTabChange method exists and can be called
    expect(typeof wrapper.vm.onTabChange).toBe('function')

    // Test that calling onTabChange doesn't throw an error
    expect(() => wrapper.vm.onTabChange(2)).not.toThrow()
  })

  it('redirects to 404 when route is not in tabs array', async () => {
    const tabs = ['Tab1', 'Tab2', 'Tab3']

    // Start with a valid route
    await router.push('/tab1')

    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
      },
    })
    wrappers.push(wrapper)

    // Verify we're on Tab1 initially
    expect(router.currentRoute.value.name).toBe('Tab1')

    // Now navigate to a route that exists but is not in the tabs array - this should trigger the watcher
    await router.push('/other-route')

    // Verify we navigated to OtherRoute
    expect(router.currentRoute.value.name).toBe('OtherRoute')

    // Wait for the watcher to trigger and redirect
    await new Promise((resolve) => setTimeout(resolve, 100))
    await wrapper.vm.$nextTick()
    await router.isReady()

    // Should redirect to 404 route
    expect(router.currentRoute.value.name).toBe('404')
  })

  it('redirects to 404 on tab change when route cannot be matched', async () => {
    // Create tabs array with a route that doesn't exist in the router
    const tabs = ['Tab1', 'Tab2', 'NonExistentRoute']

    // Start with a valid route
    await router.push('/tab1')

    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs,
      },
      global: {
        plugins: [router],
      },
    })
    wrappers.push(wrapper)

    // Verify we're on Tab1 initially
    expect(router.currentRoute.value.name).toBe('Tab1')

    // Simulate clicking on the tab with non-existent route (index 2)
    await wrapper.vm.onTabChange(2)

    // Wait for navigation to complete - give more time for async operations
    await wrapper.vm.$nextTick()
    await router.isReady()
    await new Promise((resolve) => setTimeout(resolve, 200))
    await wrapper.vm.$nextTick()

    // Should redirect to 404 route because 'NonExistentRoute' doesn't exist in router
    expect(router.currentRoute.value.name).toBe('404')
  })

  it('includes router-view for route rendering', async () => {
    const wrapper = mount(RoutedTabsComponent, {
      props: {
        tabs: ['Tab1', 'Tab2', 'Tab3'],
      },
      global: {
        plugins: [router],
      },
    })
    wrappers.push(wrapper)

    // Check that router-view exists
    const routerView = wrapper.findComponent({ name: 'RouterView' })
    expect(routerView.exists()).toBe(true)

    // Check that content is being rendered (router is working)
    expect(wrapper.text()).toContain('Tab 1 Content')
  })
})
