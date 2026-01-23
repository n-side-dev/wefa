// tests/stores/backend-token.spec.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import AxiosMockAdapter from 'axios-mock-adapter'
import { flushPromises } from '@vue/test-utils'
import {
  createRouter,
  createMemoryHistory,
  type RouteLocationNormalized,
  type NavigationGuardNext,
  type Router,
} from 'vue-router'
import { markRaw } from 'vue'
import { type Credentials, type AuthenticationType, useBackendStore } from '@/stores'
import { axiosInstance } from '@/network'

describe('Token Backend Store', () => {
  let axiosMock: AxiosMockAdapter
  let backendStore: ReturnType<typeof useBackendStore>
  let router: Router

  // Define test backend config options
  const backendStoreOptions = {
    backendBaseUrl: 'http://localhost:8000',
    authenticationType: 'TOKEN' as AuthenticationType,
  }

  beforeEach(() => {
    // Set up Pinia
    setActivePinia(createPinia())

    // Initialize the backend store with required options
    backendStore = useBackendStore(backendStoreOptions)

    // Set up axios mock for the API client
    axiosMock = new AxiosMockAdapter(axiosInstance)

    // Create a minimal router for testing route guards
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: '/',
          name: 'home',
          meta: { requiresAuth: false },
          component: markRaw({ template: '<p>Component 1</p>' }),
        },
        {
          path: '/protected',
          name: 'protected',
          meta: { requiresAuth: true },
          component: markRaw({ template: '<p>Component 1</p>' }),
        },
        {
          path: '/login',
          name: 'login',
          meta: { requiresAuth: false },
          component: markRaw({ template: '<p>Component 1</p>' }),
        },
      ],
    })

    router.beforeEach(
      async (
        to: RouteLocationNormalized,
        _from: RouteLocationNormalized,
        next: NavigationGuardNext
      ) => {
        const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
        const guestOnly = to.matched.some((record) => record.meta.guestOnly)
        // For routes that require authentication
        if (requiresAuth) {
          if (backendStore.authenticated) {
            next() // User is authenticated, proceed to the route
          } else {
            next({ name: 'login' }) // User is not authenticated, redirect to login
          }
        }
        // For guest-only routes, skip the auth check and allow access
        else if (guestOnly) {
          if (backendStore.authenticated) {
            next({ name: 'protected' }) // If authenticated, redirect to home
          } else {
            next() // If not authenticated, proceed to the login route
          }
        }
        // For all other routes, proceed without checks
        else {
          next() // Proceed to the route
        }
      }
    )
  })

  afterEach(() => {
    axiosMock.reset()
    axiosMock.restore()
    vi.clearAllMocks()
    localStorage.removeItem('authenticationToken')
  })

  describe('Authentication State', () => {
    it('should initialize with unauthenticated state', () => {
      expect(backendStore.authenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const mockCredentials: Credentials = {
        username: 'testuser',
        password: 'password123', // eslint-disable-line sonarjs/no-hardcoded-passwords
      }
      const mockResponse = { token: 'mock-auth-token' }

      axiosMock.onPost('/api/token-auth/').reply(200, mockResponse)

      const loginPromise = backendStore.login(mockCredentials)
      await flushPromises()

      const response = await loginPromise
      expect(response.data).toEqual(mockResponse)
      expect(backendStore.authenticated).toBe(true)

      // Verify the token is stored in localStorage
      expect(localStorage.getItem('authenticationToken')).toBe('mock-auth-token')
    })

    it('should handle login failure correctly', async () => {
      const mockCredentials: Credentials = {
        username: 'wronguser',
        password: 'wrongpassword', // eslint-disable-line sonarjs/no-hardcoded-passwords
      }

      axiosMock.onPost('/api/token-auth/').reply(401, { error: 'Invalid credentials' })

      await expect(backendStore.login(mockCredentials)).rejects.toThrow()
      expect(backendStore.authenticated).toBe(false)
      expect(localStorage.getItem('authenticationToken')).toBeNull()
    })

    it('should call postLogin callback after successful login', async () => {
      const postLoginMock = vi.fn()
      backendStore.setPostLogin(postLoginMock)

      const mockCredentials: Credentials = {
        username: 'testuser',
        password: 'password123', // eslint-disable-line sonarjs/no-hardcoded-passwords
      }
      const mockResponse = { token: 'mock-auth-token' }

      axiosMock.onPost('/api/token-auth/').reply(200, mockResponse)

      await backendStore.login(mockCredentials)
      await flushPromises()

      expect(postLoginMock).toHaveBeenCalled()
    })
  })

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('authenticationToken', 'mock-auth-token')
      // Manually set authenticated state
      backendStore.authenticated = true
    })

    it('should clear authentication state on logout', async () => {
      await backendStore.logout()

      expect(backendStore.authenticated).toBe(false)
      expect(localStorage.getItem('authenticationToken')).toBeNull()
    })

    it('should call postLogout callback after logout', async () => {
      const postLogoutMock = vi.fn()
      backendStore.setPostLogout(postLogoutMock)

      await backendStore.logout()

      expect(postLogoutMock).toHaveBeenCalled()
    })
  })

  describe('setupAuthRouteGuard', () => {
    it('should redirect to login page when accessing protected route while unauthenticated', async () => {
      // Set up route guards
      backendStore.setupAuthRouteGuard(router)

      // Navigate to protected route
      await router.push('/protected')
      await router.isReady()

      // Should redirect to login
      expect(router.currentRoute.value.path).toBe('/login')
    })

    it('should allow access to protected routes when authenticated', async () => {
      // Set up authenticated state
      localStorage.setItem('authenticationToken', 'mock-auth-token')
      backendStore.authenticated = true

      // Set up route guards
      backendStore.setupAuthRouteGuard(router)

      // Navigate to protected route
      await router.push('/protected')
      await router.isReady()

      // Should stay on protected route
      expect(router.currentRoute.value.path).toBe('/protected')
    })

    it('should allow access to public routes regardless of authentication state', async () => {
      // Set up route guards
      backendStore.setupAuthRouteGuard(router)

      // Navigate to public route
      await router.push('/')
      await router.isReady()

      // Should allow access
      expect(router.currentRoute.value.path).toBe('/')
    })
  })

  describe('API client authentication interceptors', () => {
    beforeEach(async () => {
      const mockCredentials: Credentials = {
        username: 'testuser',
        password: 'password123', // eslint-disable-line sonarjs/no-hardcoded-passwords
      }
      const mockResponse = { token: 'mock-auth-token' }

      axiosMock.onPost('/api/token-auth/').reply(200, mockResponse)

      const loginPromise = backendStore.login(mockCredentials)
      await flushPromises()

      await loginPromise
    })

    it('should add authentication token to API requests', async () => {
      axiosMock.onGet('/protected-resource').reply((config) => {
        // Check if the Authorization header is set correctly
        if (config.headers && config.headers.Authorization === 'Token mock-auth-token') {
          return [200, { data: 'protected data' }]
        }
        return [401, { error: 'Unauthorized' }]
      })

      const response = await axiosInstance.get('/protected-resource')
      expect(response.status).toBe(200)
      expect(response.data).toEqual({ data: 'protected data' })
    })
  })

  describe('unsetAuthRouteGuard', () => {
    it('should remove authentication route guard when called', async () => {
      // Set up the route guard first
      backendStore.setupAuthRouteGuard(router)

      // Authenticate the user
      const mockCredentials = {
        username: 'testuser',
        password: 'password123', // eslint-disable-line sonarjs/no-hardcoded-passwords
      }
      const mockResponse = { token: 'mock-auth-token' }
      axiosMock.onPost('/api/token-auth/').reply(200, mockResponse)

      // Mock router navigation to a protected route while unauthenticated
      await router.push('/')
      expect(router.currentRoute.value.path).toBe('/')

      await backendStore.login(mockCredentials)
      expect(backendStore.authenticated).toBe(true)

      // Attempt to navigate to protected route
      await router.push('/protected')
      expect(router.currentRoute.value.path).toBe('/protected')

      // Now unset the route guard
      await backendStore.unsetAuthRouteGuard()

      // Change in auth should not trigger a re-routing
      await backendStore.logout()
      expect(backendStore.authenticated).toBe(false)
      expect(router.currentRoute.value.path).toBe('/protected')
    })
  })
})
