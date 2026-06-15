import { mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter, type Router, type RouteRecordRaw } from 'vue-router'

import TabsContainer from './TabsContainer.vue'

vi.mock('@/locales', () => ({
  useI18nLib: () => ({ t: (key: string) => key }),
}))

global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

const TestView = {
  template: '<div>{{ $route.name }}</div>',
}

const routes: RouteRecordRaw[] = [
  {
    path: '/planning/:planningInstanceId',
    name: 'planning',
    component: TabsContainer,
    children: [
      {
        path: 'summary',
        name: 'planning-summary',
        component: TestView,
        meta: {
          wefa: {
            title: 'Summary',
          },
        },
      },
      {
        path: 'details',
        name: 'planning-details',
        component: TestView,
        meta: {
          wefa: {
            title: 'Details',
          },
        },
        children: [
          {
            path: 'overview',
            name: 'planning-details-overview',
            component: TestView,
            meta: {
              wefa: {
                title: 'Overview',
              },
            },
          },
        ],
      },
    ],
  },
]

describe('TabsContainer', () => {
  let router: Router
  let wrappers: VueWrapper[] = []

  beforeEach(async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })
    wrappers = []
  })

  afterEach(() => {
    for (const wrapper of wrappers) {
      wrapper.unmount()
    }
  })

  it('renders tabs from the current route children', async () => {
    await router.push('/planning/demo-1/summary')
    await router.isReady()

    const wrapper = mount(
      {
        template: '<RouterView />',
      },
      {
        global: {
          plugins: [router],
        },
      }
    )
    wrappers.push(wrapper)

    expect(wrapper.text()).toContain('Summary')
    expect(wrapper.text()).toContain('Details')
  })

  it('preserves route params when navigating between child tabs', async () => {
    await router.push('/planning/demo-1/summary')
    await router.isReady()

    const wrapper = mount(
      {
        template: '<RouterView />',
      },
      {
        global: {
          plugins: [router],
        },
      }
    )
    wrappers.push(wrapper)

    const tabsContainer = wrapper.findComponent(TabsContainer)
    await tabsContainer.vm.onTabChange('planning-details')
    await router.isReady()

    expect(router.currentRoute.value.fullPath).toBe('/planning/demo-1/details')
  })

  it('keeps the parent tab active when rendering a nested child route', async () => {
    await router.push('/planning/demo-1/details/overview')
    await router.isReady()

    const wrapper = mount(
      {
        template: '<RouterView />',
      },
      {
        global: {
          plugins: [router],
        },
      }
    )
    wrappers.push(wrapper)

    const tabsContainer = wrapper.findComponent(TabsContainer)

    expect(tabsContainer.vm.$.exposed?.activeTabValue.value).toBe('planning-details')
  })
})
