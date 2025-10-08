import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfiguredControlBarComponent, {
  type ControlBarItemConfiguration,
} from './ConfiguredControlBarComponent.vue'

// Mock the useComponentResolver composable
vi.mock('@/composables/useComponentResolver.ts', () => ({
  useComponentResolver: () => ({
    resolve: (componentName: string) => {
      const stubs = {
        Badge: {
          name: 'Badge',
          template:
            '<span class="badge-stub" :data-value="value" :data-severity="severity">{{ value }}</span>',
          props: ['value', 'severity'],
        },
        ProgressBar: {
          name: 'ProgressBar',
          template: '<div class="progressbar-stub" :data-value="value">{{ value }}%</div>',
          props: ['value'],
        },
        Rating: {
          name: 'Rating',
          template: '<div class="rating-stub" :data-value="value">{{ value }} stars</div>',
          props: ['value'],
        },
      }
      return (
        stubs[componentName as keyof typeof stubs] || { template: '<div>Unknown Component</div>' }
      )
    },
  }),
}))

describe('ConfiguredControlBarComponent', () => {
  let data: Record<string, unknown>
  let config: ControlBarItemConfiguration[]

  // Component stubs for testing
  const ControlBarComponentStub = {
    name: 'ControlBarComponent',
    template: '<div class="control-bar-stub"><slot></slot></div>',
  }
  const ControlBarItemComponentStub = {
    name: 'ControlBarItemComponent',
    template: '<div class="control-bar-item-stub" :data-title="title"><slot></slot></div>',
    props: ['title'],
  }

  const globalStubs = {
    ControlBarComponent: ControlBarComponentStub,
    ControlBarItemComponent: ControlBarItemComponentStub,
  }

  beforeEach(() => {
    data = {
      badgeValue: 10,
      progressValue: 75,
      messageText: 'Success',
      ratingValue: 4,
    }
    config = [
      {
        title: 'Badge Item',
        component: 'Badge',
        data: 'badgeValue',
        props: { severity: 'success' },
      },
      {
        title: 'Progress Item',
        component: 'ProgressBar',
        data: 'progressValue',
      },
    ]
  })

  it('renders ControlBarComponent wrapper', () => {
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config, modelValue: data },
      global: { stubs: globalStubs },
    })
    expect(wrapper.findComponent({ name: 'ControlBarComponent' }).exists()).toBe(true)
  })

  it('renders correct number of ControlBarItemComponents', () => {
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config, modelValue: data },
      global: { stubs: globalStubs },
    })
    const items = wrapper.findAllComponents({ name: 'ControlBarItemComponent' })
    expect(items.length).toBe(config.length)
  })

  it('passes correct titles to ControlBarItemComponents', () => {
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config, modelValue: data },
      global: { stubs: globalStubs },
    })
    const items = wrapper.findAllComponents({ name: 'ControlBarItemComponent' })
    expect(items[0]?.props('title')).toBe('Badge Item')
    expect(items[1]?.props('title')).toBe('Progress Item')
  })

  it('renders Badge component with correct props', () => {
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config, modelValue: data },
      global: { stubs: globalStubs },
    })
    const badge = wrapper.findComponent({ name: 'Badge' })
    expect(badge.exists()).toBe(true)
    expect(badge.props('value')).toBe(10)
    expect(badge.props('severity')).toBe('success')
  })

  it('renders ProgressBar component with correct value', () => {
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config, modelValue: data },
      global: { stubs: globalStubs },
    })
    const progressBar = wrapper.findComponent({ name: 'ProgressBar' })
    expect(progressBar.exists()).toBe(true)
    expect(progressBar.props('value')).toBe(75)
  })

  it('renders Rating component', () => {
    const ratingConfig: ControlBarItemConfiguration[] = [
      {
        title: 'User Rating',
        component: 'Rating',
        data: 'ratingValue',
      },
    ]
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config: ratingConfig, modelValue: data },
      global: { stubs: globalStubs },
    })
    const rating = wrapper.findComponent({ name: 'Rating' })
    expect(rating.exists()).toBe(true)
    expect(rating.props('value')).toBe(4)
  })

  it('handles multiple components of different types', () => {
    const multiConfig: ControlBarItemConfiguration[] = [
      {
        title: 'Badge',
        component: 'Badge',
        data: 'badgeValue',
        props: { severity: 'warning' },
      },
      {
        title: 'Progress',
        component: 'ProgressBar',
        data: 'progressValue',
      },
      {
        title: 'Rating',
        component: 'Rating',
        data: 'ratingValue',
      },
    ]
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config: multiConfig, modelValue: data },
      global: { stubs: globalStubs },
    })

    expect(wrapper.findAllComponents({ name: 'ControlBarItemComponent' }).length).toBe(3)
    expect(wrapper.findComponent({ name: 'Badge' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ProgressBar' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'Rating' }).exists()).toBe(true)
  })

  it('handles missing data keys gracefully', () => {
    const configWithMissingData: ControlBarItemConfiguration[] = [
      {
        title: 'Missing Data',
        component: 'Badge',
        data: 'nonExistentKey',
      },
    ]
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config: configWithMissingData, modelValue: data },
      global: { stubs: globalStubs },
    })
    const badge = wrapper.findComponent({ name: 'Badge' })
    expect(badge.exists()).toBe(true)
    expect(badge.props('value')).toBeUndefined()
  })

  it('resolves components through the component resolver', () => {
    // Test that the component resolver is being used by checking for the stub classes
    const wrapper = mount(ConfiguredControlBarComponent, {
      props: { config: config[0] ? [config[0]] : [], modelValue: data }, // Only Badge config
      global: { stubs: globalStubs },
    })
    expect(wrapper.html()).toContain('badge-stub')
  })
})
