import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

// PrimeVue Button stub (emit click and show label)
const ButtonStub = {
  name: 'Button',
  props: {
    label: String,
    disabled: Boolean,
  },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
}

// Mock the Cookies store
const mockStore = {
  reviewNeeded: true as boolean,
  acceptAllCookies: vi.fn(),
  rejectAllCookies: vi.fn(),
  showDialog: vi.fn(),
}

vi.mock('../../index', () => ({
  useCookiesStore: () => mockStore,
}))

// Import the component AFTER mocking the store
import CookieBar from '../CookieBar.vue'

describe('CookieBar.vue', () => {
  beforeEach(() => {
    mockStore.reviewNeeded = true
    mockStore.acceptAllCookies.mockReset()
    mockStore.rejectAllCookies.mockReset()
    mockStore.showDialog.mockReset()
  })

  it('renders cookie bar when reviewNeeded is true', async () => {
    const wrapper = mount(CookieBar, {
      global: {
        plugins: [createPinia()],
        stubs: {
          Button: ButtonStub,
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    // Presence of three action buttons
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]!.text()).toContain('Accept All')
    expect(buttons[1]!.text()).toContain('Reject All')
    expect(buttons[2]!.text()).toContain('Manage Preferences')
  })

  it('does not render cookie bar when reviewNeeded is false', async () => {
    mockStore.reviewNeeded = false

    const wrapper = mount(CookieBar, {
      global: {
        plugins: [createPinia()],
        stubs: { Button: ButtonStub },
      },
    })

    expect(wrapper.find('button').exists()).toBe(false)
    // Vue renders a comment node for a false v-if on root
    expect(wrapper.html()).toContain('<!--')
  })

  it('triggers store methods on button clicks', async () => {
    const wrapper = mount(CookieBar, {
      global: {
        stubs: { Button: ButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')

    await buttons[0]!.trigger('click') // Accept All
    expect(mockStore.acceptAllCookies).toHaveBeenCalledTimes(1)

    await buttons[1]!.trigger('click') // Reject All
    expect(mockStore.rejectAllCookies).toHaveBeenCalledTimes(1)

    await buttons[2]!.trigger('click') // Manage Preferences
    expect(mockStore.showDialog).toHaveBeenCalledTimes(1)
  })
})
