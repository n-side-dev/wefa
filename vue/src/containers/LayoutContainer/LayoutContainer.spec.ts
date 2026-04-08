import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import LayoutContainer from './LayoutContainer.vue'

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
  template: '<div data-test="side-navigation">{{ projectTitle }}|{{ projectLogo }}</div>',
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
  template: '<div data-test="mobile-navigation">{{ projectTitle }}|{{ projectLogo }}</div>',
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

const CommandPaletteStub = defineComponent({
  name: 'CommandPaletteComponent',
  props: {
    assistant: {
      type: Object,
      default: undefined,
    },
  },
  template:
    '<div data-test="command-palette">{{ assistant ? JSON.stringify(assistant) : "none" }}</div>',
})

describe('LayoutContainer', () => {
  it('passes project title to side and mobile navigation components', () => {
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
          CommandPaletteComponent: CommandPaletteStub,
        },
      },
    })

    expect(wrapper.get('[data-test="side-navigation"]').text()).toBe('My Project|')
    expect(wrapper.get('[data-test="mobile-navigation"]').text()).toBe('My Project|')
  })

  it('renders breadcrumb with the expected home route', () => {
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
          CommandPaletteComponent: CommandPaletteStub,
        },
      },
    })

    expect(wrapper.get('[data-test="breadcrumb"]').text()).toBe('/home')
  })

  it('renders router outlet and dynamic PrimeVue receptor components', () => {
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
          CommandPaletteComponent: CommandPaletteStub,
        },
      },
    })

    expect(wrapper.find('[data-test="router-view"]').exists()).toBe(true)
    expect(wrapper.get('[data-test="command-palette"]').text()).toBe('none')
    expect(wrapper.find('[data-test="toast"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="confirm-dialog"]').exists()).toBe(true)
  })

  it('passes custom logo to side and mobile navigation components', () => {
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
          CommandPaletteComponent: CommandPaletteStub,
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

  it('forwards command palette assistant configuration when provided', () => {
    const wrapper = mount(LayoutContainer, {
      props: {
        projectTitle: 'My Project',
        commandPalette: {
          assistant: {
            enabled: true,
            generateRecipe: async () => ({
              status: 'unsupported',
              message: 'noop',
            }),
          },
        },
      },
      global: {
        stubs: {
          SideNavigationComponent: SideNavigationStub,
          MobileNavigationComponent: MobileNavigationStub,
          AutoroutedBreadcrumb: BreadcrumbStub,
          RouterView: RouterViewStub,
          Toast: ToastStub,
          ConfirmDialog: ConfirmDialogStub,
          CommandPaletteComponent: CommandPaletteStub,
        },
      },
    })

    expect(wrapper.get('[data-test="command-palette"]').text()).toContain('"enabled":true')
  })
})
