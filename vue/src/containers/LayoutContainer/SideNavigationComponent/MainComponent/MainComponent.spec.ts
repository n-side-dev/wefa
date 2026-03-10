import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router'
import { defineComponent } from 'vue'
import MainComponent from './MainComponent.vue'

const StubView = defineComponent({
  template: '<div></div>',
})

const NavigationLinkStub = defineComponent({
  name: 'NavigationLinkComponent',
  props: {
    route: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  emits: ['navigation-item-click'],
  template:
    '<button class="nav-link" :data-route="route" :data-icon="icon" @click="$emit(\'navigation-item-click\')">{{ label }}</button>',
})

function createTestRouter() {
  const routes: RouteRecordRaw[] = [
    {
      path: '/home',
      name: 'home',
      component: StubView,
      meta: {
        wefa: {
          title: 'Home',
          icon: 'pi pi-home',
          showInNavigation: true,
        },
      },
    },
    {
      path: '/reports/',
      name: 'reports',
      component: StubView,
      meta: {
        wefa: {
          title: 'Reports',
          icon: 'pi pi-chart-line',
          showInNavigation: true,
        },
      },
    },
    {
      path: '/settings',
      name: 'settings',
      component: StubView,
      meta: {
        wefa: {
          title: 'Settings',
          icon: 'pi pi-cog',
          showInNavigation: true,
          section: 'Administration',
        },
      },
      children: [
        {
          path: 'users/',
          name: 'users',
          component: StubView,
          meta: {
            wefa: {
              title: 'Users',
              icon: 'pi pi-users',
              showInNavigation: true,
              section: 'Administration',
            },
          },
        },
      ],
    },
    {
      path: '/hidden',
      name: 'hidden',
      component: StubView,
      meta: {
        wefa: {
          title: 'Hidden',
        },
      },
    },
  ]

  return createRouter({
    history: createMemoryHistory(),
    routes,
  })
}

describe('MainComponent', () => {
  let router: ReturnType<typeof createTestRouter>

  beforeEach(async () => {
    router = createTestRouter()
    await router.push('/home')
    await router.isReady()
  })

  it('renders only routes configured for navigation', () => {
    const wrapper = mount(MainComponent, {
      global: {
        plugins: [router],
        stubs: {
          NavigationLinkComponent: NavigationLinkStub,
        },
      },
    })

    expect(wrapper.text()).toContain('Home')
    expect(wrapper.text()).toContain('Reports')
    expect(wrapper.text()).toContain('Settings')
    expect(wrapper.text()).toContain('Users')
    expect(wrapper.text()).not.toContain('Hidden')
  })

  it('groups section-based routes and renders section headers', () => {
    const wrapper = mount(MainComponent, {
      global: {
        plugins: [router],
        stubs: {
          NavigationLinkComponent: NavigationLinkStub,
        },
      },
    })

    expect(wrapper.text()).toContain('Administration')
  })

  it('normalizes route paths for navigation entries', () => {
    const wrapper = mount(MainComponent, {
      global: {
        plugins: [router],
        stubs: {
          NavigationLinkComponent: NavigationLinkStub,
        },
      },
    })

    const renderedPaths = wrapper
      .findAll('.nav-link')
      .map((element) => element.attributes('data-route'))

    expect(renderedPaths).toContain('/reports')
    expect(renderedPaths).toContain('/settings/users')
  })

  it('forwards child navigation-item-click events', async () => {
    const wrapper = mount(MainComponent, {
      global: {
        plugins: [router],
        stubs: {
          NavigationLinkComponent: NavigationLinkStub,
        },
      },
    })

    await wrapper.get('.nav-link').trigger('click')

    expect(wrapper.emitted('navigation-item-click')).toBeTruthy()
  })
})
