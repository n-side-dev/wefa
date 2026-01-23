import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import AxiosMockAdapter from 'axios-mock-adapter'
import { type AuthenticationType, useBackendStore } from '@/stores'
import { axiosInstance } from '@/network'

describe('BFF Backend Store', () => {
  let axiosMock: AxiosMockAdapter
  let backendStore: ReturnType<typeof useBackendStore>

  const backendStoreOptions = {
    authenticationType: 'BFF' as AuthenticationType,
    bff: {
      flow: {
        loginRedirect: false,
        sessionExpiredRedirectToLogin: true,
      },
    },
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    backendStore = useBackendStore(backendStoreOptions)
    axiosMock = new AxiosMockAdapter(axiosInstance)
  })

  afterEach(() => {
    axiosMock.reset()
    axiosMock.restore()
  })

  it('should initialize with unauthenticated state', () => {
    expect(backendStore.authenticationType).toBe('BFF')
    expect(backendStore.authenticated).toBe(false)
  })

  it('should configure axios defaults for BFF credentials', () => {
    const defaults = axiosInstance.defaults as typeof axiosInstance.defaults & {
      fetchOptions?: RequestInit
      adapter?: string
    }
    expect(defaults.fetchOptions).toMatchObject({ mode: 'cors', credentials: 'include' })
    expect(axiosInstance.defaults.withCredentials).toBe(true)
    const adapter = defaults.adapter
    expect(adapter === 'fetch' || typeof adapter === 'function').toBe(true)
  })

  it('should call login endpoint without redirect when disabled', async () => {
    axiosMock.onGet('/proxy/api/auth/login').reply(200, { url: 'https://auth.example.com' })
    await backendStore.login()
    expect(axiosMock.history.get.some((req) => req.url === '/proxy/api/auth/login')).toBe(true)
  })

  it('should update authenticated state from session endpoint', async () => {
    axiosMock.onGet('/proxy/api/auth/session').reply(200, { session: true })
    const hasSession = await backendStore.checkSession()
    expect(hasSession).toBe(true)
    expect(backendStore.authenticated).toBe(true)
  })

  it('should trigger login when session is expired', async () => {
    axiosMock.onGet('/proxy/api/auth/session').reply(200, { session: false })
    axiosMock.onGet('/proxy/api/auth/login').reply(200, { url: 'https://auth.example.com' })
    const hasSession = await backendStore.checkSession()
    expect(hasSession).toBe(false)
    expect(axiosMock.history.get.some((req) => req.url === '/proxy/api/auth/login')).toBe(true)
  })

  it('should fetch user info and set authenticated', async () => {
    const mockUser = {
      email: 'user@example.com',
      email_verified: true,
      family_name: 'User',
      given_name: 'Test',
      name: 'Test User',
      preferred_username: 'tuser',
      sub: '123',
    }
    axiosMock.onGet('/proxy/api/auth/userinfo').reply(200, mockUser)
    const user = await backendStore.fetchUserInfo()
    expect(user).toEqual(mockUser)
    expect(backendStore.authenticated).toBe(true)
  })

  it('should logout and clear authentication state', async () => {
    axiosMock.onGet('/proxy/api/auth/logout').reply(200, {})
    backendStore.authenticated = true
    await backendStore.logout()
    expect(backendStore.authenticated).toBe(false)
  })
})
