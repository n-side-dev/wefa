import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import MobileNavigationComponent from './MobileNavigationComponent.vue'

const ButtonStub = defineComponent({
  name: 'PrimeButtonStub',
  emits: ['click'],
  template: `
    <button :data-test="$attrs['data-test'] ?? 'button'" @click="$emit('click')">
      <slot />
      {{ $attrs['aria-label'] }}
    </button>
  `,
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
      <slot name="container">
        <div data-test="drawer-header">{{ header }}</div>
        <slot />
      </slot>
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

const BottomComponentStub = defineComponent({
  name: 'BottomComponent',
  template: '<div data-test="bottom">Default Footer</div>',
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
          BottomComponent: BottomComponentStub,
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
          BottomComponent: BottomComponentStub,
        },
      },
    })

    await wrapper.get('[data-test="open-navigation"]').trigger('click')
    expect(wrapper.get('[data-test="drawer"]').attributes('data-visible')).toBe('true')

    await wrapper.get('[data-test="navigation-item"]').trigger('click')

    expect(wrapper.get('[data-test="drawer"]').attributes('data-visible')).toBe('false')
  })

  it('renders the navigation as the drawer container and closes it with the close button', async () => {
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
          BottomComponent: BottomComponentStub,
        },
      },
    })

    await wrapper.get('[data-test="open-navigation"]').trigger('click')

    expect(wrapper.find('[data-test="drawer-header"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="mobile-navigation-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="mobile-navigation-actions"] [data-test="close-navigation"]').exists()).toBe(true)

    await wrapper.get('[data-test="close-navigation"]').trigger('click')

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
          BottomComponent: BottomComponentStub,
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
          BottomComponent: BottomComponentStub,
        },
      },
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe(
      'Dispatch Center|https://example.test/logo.svg'
    )
  })

  it('renders the default footer content inside the drawer', () => {
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
          BottomComponent: BottomComponentStub,
        },
      },
    })

    expect(wrapper.find('[data-test="bottom"]').exists()).toBe(true)
  })

  it('renders custom bottom slot content inside the drawer', () => {
    const wrapper = mount(MobileNavigationComponent, {
      props: {
        projectTitle: 'Dispatch Center',
      },
      slots: {
        bottom: '<div data-test="custom-bottom">Custom Footer</div>',
      },
      global: {
        stubs: {
          Button: ButtonStub,
          Drawer: DrawerStub,
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
          BottomComponent: BottomComponentStub,
        },
      },
    })

    expect(wrapper.find('[data-test="custom-bottom"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bottom"]').exists()).toBe(false)
  })
})
