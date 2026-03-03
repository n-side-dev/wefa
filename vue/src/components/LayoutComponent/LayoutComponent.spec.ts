import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import LayoutComponent from './LayoutComponent.vue'

const SideNavigationStub = defineComponent({
  name: 'SideNavigationComponent',
  props: {
    projectTitle: {
      type: String,
      required: true,
    },
  },
  template: '<div data-test="side-navigation">{{ projectTitle }}</div>',
})

const MobileNavigationStub = defineComponent({
  name: 'MobileNavigationComponent',
  props: {
    projectTitle: {
      type: String,
      required: true,
    },
  },
  template: '<div data-test="mobile-navigation">{{ projectTitle }}</div>',
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

describe('LayoutComponent', () => {
  it('passes project title to side and mobile navigation components', () => {
    const wrapper = mount(LayoutComponent, {
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

    expect(wrapper.get('[data-test="side-navigation"]').text()).toBe('My Project')
    expect(wrapper.get('[data-test="mobile-navigation"]').text()).toBe('My Project')
  })

  it('renders breadcrumb with the expected home route', () => {
    const wrapper = mount(LayoutComponent, {
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

  it('renders router outlet and dynamic PrimeVue receptor components', () => {
    const wrapper = mount(LayoutComponent, {
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
})
