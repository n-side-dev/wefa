import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { BackendStore } from '@/stores'
import LogoutView from '../LogoutView.vue'

const routerState = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => routerState,
  }
})

function makeBackendStore(): BackendStore {
  return {
    login: vi.fn(),
    logout: vi.fn(),
  } as unknown as BackendStore
}

describe('LogoutView.vue', () => {
  beforeEach(() => {
    routerState.push.mockReset()
  })

  it('shows the localized signing-out message', () => {
    const wrapper = mount(LogoutView, {
      props: {
        backendStore: makeBackendStore(),
      } as InstanceType<typeof LogoutView>['$props'],
    })
    expect(wrapper.text()).toContain('Signing you out')
  })

  it('calls backendStore.logout and redirects to the library login route by default', async () => {
    const backendStore = makeBackendStore()
    mount(LogoutView, {
      props: { backendStore } as InstanceType<typeof LogoutView>['$props'],
    })
    await flushPromises()

    expect(backendStore.logout).toHaveBeenCalledTimes(1)
    expect(routerState.push).toHaveBeenCalledWith({ name: 'authLogin' })
  })

  it('honours a custom `redirectTo` prop', async () => {
    const backendStore = makeBackendStore()
    mount(LogoutView, {
      props: {
        backendStore,
        redirectTo: { path: '/bye' },
      } as InstanceType<typeof LogoutView>['$props'],
    })
    await flushPromises()

    expect(routerState.push).toHaveBeenCalledWith({ path: '/bye' })
  })
})
