import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

// PrimeVue stubs
const DialogStub = {
  name: 'Dialog',
  props: {
    visible: Boolean,
    modal: Boolean,
    header: String,
    closable: Boolean,
    closeOnEscape: Boolean,
  },
  emits: ['update:visible'],
  template: '<div class="dialog"><slot /></div>',
}

const DataTableStub = {
  name: 'DataTable',
  props: ['value', 'dataKey'],
  template: '<div class="datatable"><slot /></div>',
}

const ColumnStub = {
  name: 'Column',
  props: ['field', 'header'],
  template: '<div class="column"><slot name="body" :data="{}" /></div>',
}

const ToggleSwitchStub = {
  name: 'ToggleSwitch',
  props: {
    modelValue: Boolean,
    disabled: Boolean,
  },
  emits: ['update:modelValue'],
  template:
    '<button class="toggle" :disabled="disabled" @click="$emit(\'update:modelValue\', !modelValue)">{{ modelValue ? "on" : "off" }}</button>',
}

const ButtonStub = {
  name: 'Button',
  props: { label: String },
  emits: ['click'],
  template: '<button class="btn" @click="$emit(\'click\')">{{ label }}</button>',
}

// Mock store used by the component
interface MockCookieCfg {
  key: string
  name: string
  description: string
  type: 'Essential' | 'Analytics' | 'Performance'
}
interface MockCookie {
  configuration: MockCookieCfg
  consent: boolean
}

const makeCookies = (): MockCookie[] => [
  {
    configuration: {
      key: 'session',
      name: 'Session Cookie',
      description: 'Required',
      type: 'Essential',
    },
    consent: true,
  },
  {
    configuration: {
      key: 'analytics',
      name: 'Analytics',
      description: 'Analytics',
      type: 'Analytics',
    },
    consent: false,
  },
  {
    configuration: {
      key: 'performance',
      name: 'Performance',
      description: 'Performance',
      type: 'Performance',
    },
    consent: false,
  },
]

const mockStore = {
  cookies: makeCookies(),
  toggleDialog: true as boolean,
  acceptAllCookies: vi.fn(),
  rejectAllCookies: vi.fn(),
  saveCookiePreferences: vi.fn(),
}

vi.mock('../../index', () => ({
  useCookiesStore: () => mockStore,
}))

// Import the component AFTER mocking the store
import CookiesConsent from '../CookiesConsent.vue'

describe('CookiesConsent.vue', () => {
  beforeEach(() => {
    mockStore.cookies = makeCookies()
    mockStore.toggleDialog = true
    mockStore.acceptAllCookies.mockReset()
    mockStore.rejectAllCookies.mockReset()
    mockStore.saveCookiePreferences.mockReset()
  })

  /**
   *
   */
  function mountComponent() {
    return mount(CookiesConsent, {
      global: {
        plugins: [createPinia()],
        stubs: {
          Dialog: DialogStub,
          DataTable: DataTableStub,
          Column: ColumnStub,
          ToggleSwitch: ToggleSwitchStub,
          Button: ButtonStub,
        },
      },
    })
  }

  it('renders dialog and action buttons', () => {
    const wrapper = mountComponent()
    expect(wrapper.find('.dialog').exists()).toBe(true)
    const btns = wrapper.findAll('button.btn')
    expect(btns).toHaveLength(3)
    expect(btns[0]!.text()).toContain('Accept All')
    expect(btns[1]!.text()).toContain('Reject All')
    expect(btns[2]!.text()).toContain('Save Preferences')
  })

  it('calls store accept/reject on corresponding button clicks', async () => {
    const wrapper = mountComponent()
    const btns = wrapper.findAll('button.btn')

    await btns[0]!.trigger('click')
    expect(mockStore.acceptAllCookies).toHaveBeenCalledTimes(1)

    await btns[1]!.trigger('click')
    expect(mockStore.rejectAllCookies).toHaveBeenCalledTimes(1)
  })

  it('onConsentChange does not modify Essential and saves updated preferences for others', async () => {
    const wrapper = mountComponent()

    type ConsentData = { id: string; isEssential: boolean }
    interface CookiesConsentVm {
      onConsentChange: (d: ConsentData, v: boolean) => void
      savePreferences: () => void
    }

    const vm = wrapper.vm as unknown as CookiesConsentVm

    // Try to change Essential -> should be ignored
    await vm.onConsentChange({ id: 'session', isEssential: true }, false)

    // Change others locally
    await vm.onConsentChange({ id: 'analytics', isEssential: false }, true)
    await vm.onConsentChange({ id: 'performance', isEssential: false }, true)

    // Save preferences -> should update store cookies and call saver
    await vm.savePreferences()

    const getByKey = (key: string) => mockStore.cookies.find((c) => c.configuration.key === key)!

    expect(getByKey('session').consent).toBe(true) // unchanged
    expect(getByKey('analytics').consent).toBe(true)
    expect(getByKey('performance').consent).toBe(true)
    expect(mockStore.saveCookiePreferences).toHaveBeenCalledTimes(1)
  })
})
