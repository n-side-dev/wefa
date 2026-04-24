import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { BackendStore } from '@/stores'
import LoginView from '../LoginView.vue'

const toastAddSpy = vi.fn()
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({ add: (...args: unknown[]) => toastAddSpy(...args) }),
}))

const routerState = vi.hoisted(() => ({
  push: vi.fn(),
  currentRoute: { value: { query: {} as Record<string, string | undefined> } },
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => routerState,
  }
})

/**
 * Minimal backend store double that exposes just the surface LoginView calls.
 * @param overrides Any fields to override on the baseline double.
 * @returns A BackendStore-shaped object with vi.fn() stubs for login/logout.
 */
function makeBackendStore(overrides: Partial<BackendStore> = {}): BackendStore {
  return {
    login: vi.fn().mockResolvedValue({}),
    logout: vi.fn(),
    ...overrides,
  } as unknown as BackendStore
}

/**
 * Convenience mount that supplies the required backend store prop and
 * PrimeVue-style stubs for the heavier children.
 * @param props Partial LoginView props, merged over the defaults.
 * @returns The vue-test-utils wrapper around the mounted LoginView.
 */
function mountLoginView(props: Partial<InstanceType<typeof LoginView>['$props']> = {}) {
  return mount(LoginView, {
    props: {
      backendStore: makeBackendStore(),
      ...props,
    } as InstanceType<typeof LoginView>['$props'],
    global: {
      stubs: {
        InputText: {
          name: 'InputText',
          props: ['modelValue', 'disabled'],
          emits: ['update:modelValue'],
          methods: {
            onInput(event: Event) {
              this.$emit('update:modelValue', (event.target as HTMLInputElement).value)
            },
          },
          template: '<input :value="modelValue" :disabled="disabled" @input="onInput" />',
        },
        Password: {
          name: 'Password',
          props: ['modelValue', 'disabled'],
          emits: ['update:modelValue'],
          methods: {
            onInput(event: Event) {
              this.$emit('update:modelValue', (event.target as HTMLInputElement).value)
            },
          },
          template:
            '<input type="password" :value="modelValue" :disabled="disabled" @input="onInput" />',
        },
        Button: {
          name: 'Button',
          props: ['label', 'loading', 'type'],
          template:
            '<button :type="type" :disabled="loading" data-test="submit">{{ label }}</button>',
        },
      },
    },
  })
}

describe('LoginView.vue', () => {
  beforeEach(() => {
    toastAddSpy.mockClear()
    routerState.push.mockReset()
    routerState.currentRoute.value.query = {}
  })

  it('renders title, form fields, and submit button from translations', () => {
    const wrapper = mountLoginView()
    expect(wrapper.text()).toContain('Sign in')
    expect(wrapper.findAll('input')).toHaveLength(2)
    expect(wrapper.get('[data-test="submit"]').text()).toBe('Sign in')
  })

  it('submits credentials through backendStore.login and navigates to defaultRedirect', async () => {
    const backendStore = makeBackendStore()
    const wrapper = mountLoginView({ backendStore, defaultRedirect: '/home' })

    await wrapper.findAll('input')[0]!.setValue('alice')
    await wrapper.findAll('input')[1]!.setValue('pw')
    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(backendStore.login).toHaveBeenCalledWith({ username: 'alice', password: 'pw' })
    expect(routerState.push).toHaveBeenCalledWith('/home')
  })

  it('honours the ?redirect query parameter when present', async () => {
    routerState.currentRoute.value.query = { redirect: '/protected' }
    const wrapper = mountLoginView({ defaultRedirect: '/home' })

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(routerState.push).toHaveBeenCalledWith('/protected')
  })

  it('shows an error toast and resets submitting state when login rejects', async () => {
    const backendStore = makeBackendStore({
      login: vi.fn().mockRejectedValue(new Error('bad creds')),
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mountLoginView({ backendStore })

    await wrapper.get('form').trigger('submit.prevent')
    await flushPromises()

    expect(toastAddSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Sign in failed',
      })
    )
    expect(routerState.push).not.toHaveBeenCalled()
    // After failure, submitting resets so the button is no longer loading.
    expect(wrapper.get('[data-test="submit"]').attributes('disabled')).toBeUndefined()
    errorSpy.mockRestore()
  })

  it('renders both light and dark logos when src props are provided', () => {
    const wrapper = mountLoginView({
      logoLight: '/light.svg',
      logoDark: '/dark.svg',
      logoAlt: 'Acme',
    })

    const imgs = wrapper.findAll('img')
    expect(imgs).toHaveLength(2)
    expect(imgs[0]!.attributes('src')).toBe('/light.svg')
    expect(imgs[1]!.attributes('src')).toBe('/dark.svg')
    expect(imgs[0]!.attributes('alt')).toBe('Acme')
    expect(imgs[1]!.attributes('alt')).toBe('Acme')
  })
})
