import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import LayoutContainer from './LayoutContainer.vue'

const routeState = vi.hoisted(() => ({
  route: {
    matched: [{ meta: {} }],
  },
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()

  return {
    ...actual,
    useRoute: () => routeState.route,
  }
})

const SideNavigationStub = defineComponent({
  name: 'SideNavigationComponent',
  props: {
    projectTitle: {
      type: String,
      required: true,
    },
    projectLogo: {
      type: String,
      default: undefined,
    },
  },
  template: `
    <div data-test="side-navigation">
      {{ projectTitle }}|{{ projectLogo }}
      <slot name="bottom" />
    </div>
  `,
})

const MobileNavigationStub = defineComponent({
  name: 'MobileNavigationComponent',
  props: {
    projectTitle: {
      type: String,
      required: true,
    },
    projectLogo: {
      type: String,
      default: undefined,
    },
  },
  template: `
    <div data-test="mobile-navigation">
      {{ projectTitle }}|{{ projectLogo }}
      <slot name="bottom" />
    </div>
  `,
})

const BreadcrumbStub = defineComponent({
  name: 'AutoroutedBreadcrumb',
  props: {
    homeRoute: {
      type: String,
      default: '',
    },
  },
  template: '<div data-test="breadcrumb">{{ homeRoute }}</div>',
})

const RouterViewStub = defineComponent({
  name: 'RouterView',
  template: '<div data-test="router-view">content</div>',
})

const ToastStub = defineComponent({
  name: 'PrimeToastStub',
  template: '<div data-test="toast"></div>',
})

const ConfirmDialogStub = defineComponent({
  name: 'ConfirmDialog',
  template: '<div data-test="confirm-dialog"></div>',
})

describe('LayoutContainer', () => {
  it('renders breadcrumbs by default', () => {
    routeState.route.matched = [{ meta: {} }]

    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
        },
      },
    })

    expect(wrapper.get('[data-test="breadcrumb"]').text()).toBe('/home')
  })

  it('hides breadcrumbs when the deepest matched route disables them', () => {
    routeState.route.matched = [
      { meta: { wefa: { showBreadcrumb: true } } },
      { meta: { wefa: { showBreadcrumb: false } } },
    ]

    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
        },
      },
    })

    expect(wrapper.find('[data-test="breadcrumb"]').exists()).toBe(false)
  })

  it('uses the deepest explicit breadcrumb preference from matched routes', () => {
    routeState.route.matched = [
      { meta: { wefa: { showBreadcrumb: false } } },
      { meta: {} },
      { meta: { wefa: { showBreadcrumb: true } } },
    ]

    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
        },
      },
    })

    expect(wrapper.find('[data-test="breadcrumb"]').exists()).toBe(true)
  })

  it('passes project title to side and mobile navigation components', () => {
    routeState.route.matched = [{ meta: {} }]

    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
        },
      },
    })

    expect(wrapper.get('[data-test="side-navigation"]').text()).toBe('My Project|')
    expect(wrapper.get('[data-test="mobile-navigation"]').text()).toBe('My Project|')
  })

  it('forwards the navigation bottom slot to desktop and mobile navigation', () => {
    routeState.route.matched = [{ meta: {} }]

    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
      },
      slots: {
        'navigation-bottom': '<div data-test="custom-navigation-bottom">Bottom slot</div>',
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
        },
      },
    })

    expect(wrapper.findAll('[data-test="custom-navigation-bottom"]')).toHaveLength(2)
  })

  it('renders router outlet and dynamic PrimeVue receptor components', () => {
    routeState.route.matched = [{ meta: {} }]

    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
        },
      },
    })

    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="toast"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="confirm-dialog"]').exists()).toBe(true)
  })

  it('passes custom logo to side and mobile navigation components', () => {
    routeState.route.matched = [{ meta: {} }]

    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
        projectLogo: 'https://example.test/logo.svg',
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
        },
      },
    })

    expect(wrapper.get('[data-test="side-navigation"]').text()).toBe(
      'My Project|https://example.test/logo.svg'
    )
    expect(wrapper.get('[data-test="mobile-navigation"]').text()).toBe(
      'My Project|https://example.test/logo.svg'
    )
  })
})
