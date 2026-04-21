import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import SideNavigationComponent from './SideNavigationComponent.vue'

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
  template: '<div data-test="main">Main Navigation</div>',
})

const BottomComponentStub = defineComponent({
  name: 'BottomComponent',
  template: '<div data-test="bottom">Default Footer</div>',
})

describe('SideNavigationComponent', () => {
  it('renders top, main, and default bottom sections', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'WeFa',
      },
      global: {
        stubs: {
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
          BottomComponent: BottomComponentStub,
        },
      },
    })

    expect(wrapper.find('[data-test="top"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="main"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="bottom"]').exists()).toBe(true)
  })

  it('passes project title to TopComponent', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'Energy Forecast',
      },
      global: {
        stubs: {
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
          BottomComponent: BottomComponentStub,
        },
      },
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe('Energy Forecast|')
  })

  it('passes custom logo to TopComponent', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'Energy Forecast',
        projectLogo: 'https://example.test/logo.svg',
      },
      global: {
        stubs: {
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
          BottomComponent: BottomComponentStub,
        },
      },
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe(
      'Energy Forecast|https://example.test/logo.svg'
    )
  })

  it('renders custom bottom slot content instead of the default footer', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'Energy Forecast',
      },
      slots: {
        bottom: '<div data-test="custom-bottom">Custom Footer</div>',
      },
      global: {
        stubs: {
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
