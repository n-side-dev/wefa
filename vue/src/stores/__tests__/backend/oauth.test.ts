// tests/stores/backend-oauth.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import AxiosMockAdapter from 'axios-mock-adapter'
import { flushPromises } from '@vue/test-utils'
import { type AuthenticationType, type Credentials, useBackendStore } from '@/stores'
import { axiosInstance } from '@/network'

describe('OAuth Backend Store', () => {
  let axiosMock: AxiosMockAdapter
  let backendStore: ReturnType<typeof useBackendStore>
  let redirectHandler: ReturnType<typeof vi.fn>

  const backendStoreOptions = {
    backendBaseUrl: 'http://localhost:8000',
    authenticationType: 'OAUTH' as AuthenticationType,
    endpoints: {
      oauth: {
        redirectHandler: (url: string) => {
          redirectHandler(url)
        },
      },
    },
  }

  const sessionEndpoint = '/proxy/api/auth/session'
  const loginEndpoint = '/proxy/api/auth/login'
  const logoutEndpoint = '/proxy/api/auth/logout'

  beforeEach(() => {
    setActivePinia(createPinia())
    axiosMock = new AxiosMockAdapter(axiosInstance)
    redirectHandler = vi.fn()
  })

  afterEach(() => {
    axiosMock.reset()
    axiosMock.restore()
    vi.clearAllMocks()
  })

  it('should initialize authenticated state from the session endpoint', async () => {
    axiosMock.onGet(sessionEndpoint).reply(200, { session: true })

    backendStore = useBackendStore(backendStoreOptions)
    await flushPromises()

    expect(backendStore.authenticated).toBe(true)
    expect(redirectHandler).not.toHaveBeenCalled()
    expect(axiosMock.history.get.some((request) => request.url === sessionEndpoint)).toBe(true)
  })

  it('should initiate login when the session is inactive', async () => {
    axiosMock.onGet(sessionEndpoint).reply(200, { session: false })
    axiosMock.onGet(loginEndpoint).reply(200, { redirect: 'https://auth.example.test/login' })

    backendStore = useBackendStore(backendStoreOptions)
    await flushPromises()

    expect(backendStore.authenticated).toBe(false)
    expect(redirectHandler).toHaveBeenCalledWith('https://auth.example.test/login')
    expect(axiosMock.history.get.some((request) => request.url === loginEndpoint)).toBe(true)
  })

  it('should redirect and call postLogin when login is invoked', async () => {
    axiosMock.onGet(sessionEndpoint).reply(200, { session: true })
    axiosMock.onGet(loginEndpoint).reply(200, { redirect: 'https://auth.example.test/login' })

    backendStore = useBackendStore(backendStoreOptions)
    await flushPromises()

    const postLoginMock = vi.fn()
    backendStore.setPostLogin(postLoginMock)

    const mockCredentials: Credentials = {
      username: 'testuser',
      password: 'password123', // eslint-disable-line sonarjs/no-hardcoded-passwords
    }

    await backendStore.login(mockCredentials)
    await flushPromises()

    expect(postLoginMock).toHaveBeenCalled()
    expect(redirectHandler).toHaveBeenCalledWith('https://auth.example.test/login')
  })

  it('should call logout endpoint and postLogout when logging out', async () => {
    axiosMock.onGet(sessionEndpoint).reply(200, { session: true })
    axiosMock.onGet(logoutEndpoint).reply(200)

    backendStore = useBackendStore(backendStoreOptions)
    await flushPromises()

    const postLogoutMock = vi.fn()
    backendStore.setPostLogout(postLogoutMock)

    backendStore.logout()
    await flushPromises()

    expect(postLogoutMock).toHaveBeenCalled()
    expect(backendStore.authenticated).toBe(false)
    expect(axiosMock.history.get.some((request) => request.url === logoutEndpoint)).toBe(true)
  })
})
