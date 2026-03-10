import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import UserMenuTriggerComponent from './UserMenuTriggerComponent.vue'

const toggleSpy = vi.fn()

vi.mock('primevue/menu', () => {
  return {
    default: defineComponent({
      name: 'PrimeMenuStub',
      props: {
        model: {
          type: Array,
          default: () => [],
        },
        popup: {
          type: Boolean,
          default: false,
        },
      },
      setup(_props, { expose }) {
        expose({
          toggle: toggleSpy,
        })

        return {}
      },
      template: '<div data-test="menu"></div>',
    }),
  }
})

vi.mock('@/components/AvatarComponent/AvatarComponent.vue', () => {
  return {
    default: defineComponent({
      name: 'AvatarComponent',
      props: {
        username: {
          type: String,
          required: true,
        },
      },
      template: '<div data-test="avatar">{{ username }}</div>',
    }),
  }
})

describe('UserMenuTriggerComponent', () => {
  beforeEach(() => {
    toggleSpy.mockClear()
  })

  it('renders detailed mode by default', () => {
    const wrapper = mount(UserMenuTriggerComponent, {
      props: {
        username: 'Alice Doe',
        email: 'alice@example.com',
      },
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Open user menu for Alice Doe')
    expect(wrapper.get('[data-test="avatar"]').text()).toContain('Alice Doe')
    expect(wrapper.text()).toContain('Alice Doe')
    expect(wrapper.text()).toContain('alice@example.com')
    expect(wrapper.find('.pi-chevron-up').exists()).toBe(true)
  })

  it('renders compact mode without username details', () => {
    const wrapper = mount(UserMenuTriggerComponent, {
      props: {
        username: 'Alice Doe',
        email: 'alice@example.com',
        mode: 'compact',
      },
    })

    expect(wrapper.get('button').attributes('aria-label')).toBe('Open user menu for Alice Doe')
    expect(wrapper.text()).not.toContain('alice@example.com')
    expect(wrapper.find('.pi-chevron-up').exists()).toBe(false)
  })

  it('invokes menu toggle when trigger button is clicked', async () => {
    const wrapper = mount(UserMenuTriggerComponent, {
      props: {
        username: 'Alice Doe',
        email: 'alice@example.com',
      },
    })

    await wrapper.get('button').trigger('click')

    expect(toggleSpy).toHaveBeenCalledTimes(1)
    expect(toggleSpy.mock.calls[0]?.[0]).toBeInstanceOf(Event)
  })
})
