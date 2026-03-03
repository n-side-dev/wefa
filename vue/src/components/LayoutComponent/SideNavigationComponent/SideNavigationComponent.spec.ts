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
  },
  template: '<div data-test="top">{{ projectTitle }}</div>',
})

const MainComponentStub = defineComponent({
  name: 'MainComponent',
  template: '<div data-test="main">Main Navigation</div>',
})

describe('SideNavigationComponent', () => {
  it('renders top and main sections', () => {
    const wrapper = mount(SideNavigationComponent, {
      props: {
        projectTitle: 'WeFa',
      },
      global: {
        stubs: {
          TopComponent: TopComponentStub,
          MainComponent: MainComponentStub,
        },
      },
    })

    expect(wrapper.find('[data-test="top"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="main"]').exists()).toBe(true)
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
        },
      },
    })

    expect(wrapper.get('[data-test="top"]').text()).toBe('Energy Forecast')
  })
})
