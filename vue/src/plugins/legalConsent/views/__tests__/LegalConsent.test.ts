import { describe, it, expect, vi, beforeEach, type MockInstance } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { nextTick } from 'vue'

const flushPromises = () => new Promise((resolve) => setTimeout(resolve))

// Mock i18n util to return the key itself for easier assertions
vi.mock('@/locales', () => ({
  useI18nLib: () => ({ t: (key: string) => key }),
}))

// Mock backend store
const logoutSpy = vi.fn()
vi.mock('@/demo/backendStore.ts', () => ({
  backendStore: { logout: () => logoutSpy() },
}))

// Mock Pinia store used by the component
const acceptLegalConsentSpy = vi.fn()
vi.mock('@/plugins/legalConsent', () => ({
  useLegalStore: () => ({
    acceptLegalConsent: () => acceptLegalConsentSpy(),
  }),
}))

// Mock PrimeVue toast and confirm composables
const toastAddSpy: ReturnType<typeof vi.fn> = vi.fn()
const confirmRequireSpy: ReturnType<typeof vi.fn> = vi.fn()
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: (...args: unknown[]) => new toastAddSpy(...args) }),
}))
vi.mock('primevue/useconfirm', () => ({
  useConfirm: () => ({ require: (...args: unknown[]) => new confirmRequireSpy(...args) }),
}))

// Stub PrimeVue complex components so we can interact easily
const ButtonStub = {
  name: 'Button',
  props: ['label', 'disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot />{{ label }}</button>',
}

const CheckboxStub = {
  name: 'Checkbox',
  props: {
    modelValue: Boolean,
  },
  emits: ['update:modelValue'],
  template:
    '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />',
}

const CardStub = {
  name: 'Card',
  template: '<div><slot name="title" /><slot name="content" /></div>',
}

import { createRouter, createWebHistory, type Router } from 'vue-router'

// SUT (import after mocks so they apply)
import LegalConsent from '../LegalConsent.vue'

describe('LegalConsent.vue', () => {
  let router: Router
  let pushSpy: MockInstance

  beforeEach(() => {
    acceptLegalConsentSpy.mockReset()
    toastAddSpy.mockReset()
    confirmRequireSpy.mockReset()
    logoutSpy.mockReset()

    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })
    pushSpy = vi.spyOn(router, 'push').mockResolvedValue(undefined as unknown as void)
  })

  /**
   *
   */
  async function mountComponent() {
    const wrapper = mount(LegalConsent, {
      global: {
        plugins: [router],
        stubs: {
          Button: ButtonStub,
          Checkbox: CheckboxStub,
          Card: CardStub,
          'router-link': RouterLinkStub,
        },
      },
    })
    await router.isReady()
    return wrapper
  }

  it('disables accept button until terms are checked, then enables and accepts on click', async () => {
    const wrapper = await mountComponent()

    const buttons = wrapper.findAll('button')
    // First button is the Accept (success) button per template order
    const acceptButton = buttons[0]!

    expect(acceptButton!.attributes('disabled')).toBeDefined()

    // Toggle checkbox to true
    const checkbox = wrapper.get('input[type="checkbox"]')
    await checkbox.setValue(true)
    await nextTick()

    expect(acceptButton.attributes('disabled')).toBeUndefined()

    // Accept flow succeeds and navigates to '/'
    await acceptButton!.trigger('click')
    await flushPromises()
    await nextTick()

    expect(acceptLegalConsentSpy).toHaveBeenCalledTimes(1)
    expect(toastAddSpy).toHaveBeenCalled()
    const toastArg = toastAddSpy.mock.calls[0]![0] as { severity: string }
    expect(toastArg.severity).toBe('success')
  })

  it('navigates to redirectedFrom when provided', async () => {
    Object.assign(router.currentRoute.value, { redirectedFrom: { path: '/previous' } })
    const wrapper = await mountComponent()

    // enable checkbox
    await wrapper.get('input[type="checkbox"]').setValue(true)

    await wrapper.findAll('button')[0]!.trigger('click')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalled()
    const arg = (pushSpy.mock.calls[0] && pushSpy.mock.calls[0][0]) as unknown as { path: string }
    expect(arg).toEqual(expect.objectContaining({ path: '/previous' }))
  })

  it('shows error toast when accept fails', async () => {
    // Make accept throw once
    acceptLegalConsentSpy.mockImplementationOnce(() => {
      throw new Error('fail')
    })

    const wrapper = await mountComponent()
    await wrapper.get('input[type="checkbox"]').setValue(true)
    await wrapper.findAll('button')[0]!.trigger('click')

    expect(toastAddSpy).toHaveBeenCalled()
    const toastArg = toastAddSpy.mock.calls.pop()![0] as { severity: string }
    expect(toastArg.severity).toBe('error')
  })

  it('on cancel, opens confirm dialog and accepts -> logs out and shows warn toast', async () => {
    const wrapper = await mountComponent()

    // Click the Cancel button (second button)
    await wrapper.findAll('button')[1]!.trigger('click')

    // confirm.require should have been called with a config object containing accept()
    expect(confirmRequireSpy).toHaveBeenCalledTimes(1)
    const config = confirmRequireSpy.mock.calls[0]![0] as { accept: () => void }
    expect(typeof config.accept).toBe('function')

    // Simulate user accepting the confirm dialog
    config.accept()

    expect(logoutSpy).toHaveBeenCalledTimes(1)

    // And a warn toast is shown
    expect(toastAddSpy).toHaveBeenCalled()
    const toastArg = toastAddSpy.mock.calls.pop()![0] as { severity: string }
    expect(toastArg.severity).toBe('warn')
  })
})
