import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import MobileNavigationComponent from './MobileNavigationComponent.vue'

const ButtonStub = defineComponent({
  name: 'PrimeButtonStub',
  emits: ['click'],
  template: '<button data-test="open-navigation" @click="$emit(\'click\')">open</button>',
})

const DrawerStub = defineComponent({
  name: 'PrimeDrawerStub',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    header: {
      type: String,
      default: '',
    },
  },
  emits: ['update:visible'],
  template: `
    <div data-test="drawer" :data-visible="String(visible)">
      <div data-test="drawer-header">{{ header }}</div>
      <slot />
    </div>
  `,
})

const TopComponentStub = defineComponent({
  name: 'TopComponent',
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
  template: '<div data-test="top">{{ projectTitle }}|{{ projectLogo }}</div>',
})

const MainComponentStub = defineComponent({
  name: 'MainComponent',
  emits: ['navigation-item-click'],
  template:
    '<button data-test="navigation-item" @click="$emit(\'navigation-item-click\')">go</button>',
})

describe('MobileNavigationComponent', () => {
  it('opens drawer when menu button is clicked', async () => {
    const wrapper = mount(MobileNavigationComponent, {
      props: {
        projectTitle: 'WeFa',
      },
      global: {
        stubs: {
          Button: ButtonStub,
          Drawer: DrawerStub,
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
        },
      },
    })

    expect(wrapper.get('[data-test="drawer"]').attributes('data-visible')).toBe('false')

    await wrapper.get('[data-test="open-navigation"]').trigger('click')

    expect(wrapper.get('[data-test="drawer"]').attributes('data-visible')).toBe('true')
  })

  it('closes drawer after a navigation click from MainComponent', async () => {
    const wrapper = mount(MobileNavigationComponent, {
      props: {
        projectTitle: 'WeFa',
      },
      global: {
        stubs: {
          Button: ButtonStub,
          Drawer: DrawerStub,
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
        },
      },
    })

    await wrapper.get('[data-test="open-navigation"]').trigger('click')
    expect(wrapper.get('[data-test="drawer"]').attributes('data-visible')).toBe('true')

    await wrapper.get('[data-test="navigation-item"]').trigger('click')

    expect(wrapper.get('[data-test="drawer"]').attributes('data-visible')).toBe('false')
  })

  it('passes project title to TopComponent inside the drawer', () => {
    const wrapper = mount(MobileNavigationComponent, {
      props: {
        projectTitle: 'Dispatch Center',
      },
      global: {
        stubs: {
          Button: ButtonStub,
          Drawer: DrawerStub,
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
        },
      },
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe('Dispatch Center|')
  })

  it('passes custom logo to TopComponent inside the drawer', () => {
    const wrapper = mount(MobileNavigationComponent, {
      props: {
        projectTitle: 'Dispatch Center',
        projectLogo: 'https://example.test/logo.svg',
      },
      global: {
        stubs: {
          Button: ButtonStub,
          Drawer: DrawerStub,
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
        },
      },
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe(
      'Dispatch Center|https://example.test/logo.svg'
    )
  })
})
