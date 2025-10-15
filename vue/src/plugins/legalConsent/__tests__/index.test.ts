import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createApp, ref, type App } from 'vue'
import {
  createRouter,
  createWebHistory,
  type Router,
  type NavigationGuardNext,
  type RouteLocationNormalized,
  type RouteLocationNormalizedLoaded,
} from 'vue-router'
import MockAdapter from 'axios-mock-adapter'
import { axiosInstance } from '@/network'
import type { BackendStore } from '@/stores'
import {
  legalConsentPlugin,
  useLegalStore,
  defaultTermsOfUseRoute,
  defaultPrivacyNoticeRoute,
  defaultLegalConsentRoute,
  type LegalConsent,
  type LegalConsentOptions,
} from '../index'

// Define mock types for testing
interface MockBackendStore extends BackendStore {
  setAuthenticated: (value: boolean) => void
}

/**
 * Helper function to create mock route objects
 * @param name Name of the route
 * @param path Path of the route
 * @returns Mocked route object
 */
function createMockRoute(name: string, path: string = `/${name}`): RouteLocationNormalized {
  return {
    name,
    path,
    fullPath: path,
    hash: '',
    query: {},
    params: {},
    matched: [],
    meta: {},
    redirectedFrom: undefined,
  }
}

// Mock the backend store and router imports
vi.mock('@/demo/backendStore.ts', () => {
  const mockStore = {
    authenticated: ref(false),
    // Expose a method to modify the value from tests
    setAuthenticated: (value: boolean) => {
      mockStore.authenticated.value = value
    },
  }
  return {
    backendStore: mockStore,
  }
})

vi.mock('@/demo/router.ts', () => ({
  default: {
    push: vi.fn().mockResolvedValue({}),
    currentRoute: { value: { path: '/' } },
  },
}))

// Mock Vue's watch function to prevent async issues in tests
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    watch: vi.fn(() => vi.fn()), // Mock watch to return a cleanup function
  }
})

describe('legalConsent Plugin', () => {
  let app: App
  let router: Router
  let mockAxios: MockAdapter
  let mockBackendStore: MockBackendStore

  beforeEach(() => {
    // Set up fresh Pinia instance before each test
    setActivePinia(createPinia())

    // Create Vue app and router instances
    app = createApp({})
    router = createRouter({
      history: createWebHistory(),
      routes: [],
    })

    // Set up axios mock and configure baseURL
    mockAxios = new MockAdapter(axiosInstance)
    axiosInstance.defaults.baseURL = 'http://localhost:8000'

    // Router readiness and navigation should not block tests
    vi.spyOn(router, 'isReady').mockResolvedValue(undefined)
    vi.spyOn(router, 'push').mockResolvedValue(undefined)

    // Default legal consent fetch during plugin install
    mockAxios
      .onGet(`${axiosInstance.defaults.baseURL}/api/legal/agreement/`)
      .reply(200, { version: 1, accepted_at: '2023-01-01T00:00:00.000Z', valid: true })

    // Mock backend store
    mockBackendStore = {
      authenticated: ref(false),
      axiosInstance: axiosInstance,
      login: vi.fn().mockResolvedValue({}),
      logout: vi.fn(),
      setPostLogin: vi.fn(),
      setPostLogout: vi.fn(),
      setupAuthRouteGuard: vi.fn(),
      unsetAuthRouteGuard: vi.fn(),
      setAuthenticated: (value: boolean) => {
        mockBackendStore.authenticated.value = value
      },
    }

    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    mockAxios.restore()
  })

  describe('Plugin Installation', () => {
    it('should install successfully with required options', async () => {
      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
      }

      await expect(legalConsentPlugin.install(app, options)).resolves.toBeUndefined()
    })

    it('should not throw if router is already available', async () => {
      app.config.globalProperties.$router = router

      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
      }

      await expect(legalConsentPlugin.install(app, options)).resolves.toBeUndefined()
    })

    it('should add default routes to router', async () => {
      const addRouteSpy = vi.spyOn(router, 'addRoute')

      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
      }

      await legalConsentPlugin.install(app, options)

      expect(addRouteSpy).toHaveBeenCalledTimes(3)
    })

    it('should use custom routes if provided', async () => {
      const addRouteSpy = vi.spyOn(router, 'addRoute')
      const customRoute = {
        path: '/custom-terms',
        name: 'custom-terms',
        component: () => import('../views/LegalDocument.vue'),
      }

      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
        termsOfUseRoute: customRoute,
      }

      await legalConsentPlugin.install(app, options)

      expect(addRouteSpy).toHaveBeenCalledTimes(3)
    })

    it('should initialize legal store with endpoint', async () => {
      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
      }

      await legalConsentPlugin.install(app, options)

      const store = useLegalStore()
      expect(store.legalEndpoint).toBe('api/legal')
    })

    it('should set up navigation guard', async () => {
      const beforeEachSpy = vi.spyOn(router, 'beforeEach')

      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
      }

      await legalConsentPlugin.install(app, options)

      expect(beforeEachSpy).toHaveBeenCalledExactlyOnceWith(expect.any(Function))
      expect(beforeEachSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Navigation Guard', () => {
    let navigationGuard: (
      to: RouteLocationNormalized,
      from: RouteLocationNormalizedLoaded,
      next: NavigationGuardNext
    ) => void
    let nextMock: NavigationGuardNext & ReturnType<typeof vi.fn>

    beforeEach(async () => {
      nextMock = vi.fn() as unknown as NavigationGuardNext & ReturnType<typeof vi.fn>

      // Spy on router.beforeEach before installing the plugin
      const beforeEachSpy = vi.spyOn(router, 'beforeEach')

      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
      }

      await legalConsentPlugin.install(app, options)

      // Extract the navigation guard function
      const beforeEachCall = beforeEachSpy.mock.calls[0]
      if (!beforeEachCall) {
        throw new Error('beforeEach spy was not called')
      }
      navigationGuard = beforeEachCall[0]
    })

    it('should allow access to terms of use page', () => {
      navigationGuard(createMockRoute('terms-of-use'), createMockRoute('home'), nextMock)

      expect(nextMock).toHaveBeenCalledExactlyOnceWith()
      expect(nextMock).toHaveBeenCalledTimes(1)
    })

    it('should allow access to privacy notice page', () => {
      navigationGuard(createMockRoute('privacy-notice'), createMockRoute('home'), nextMock)

      expect(nextMock).toHaveBeenCalledExactlyOnceWith()
      expect(nextMock).toHaveBeenCalledTimes(1)
    })

    it('should allow access when no legal consent exists', () => {
      const store = useLegalStore()
      store.legalConsent = null

      navigationGuard(createMockRoute('home'), createMockRoute('login'), nextMock)

      expect(nextMock).toHaveBeenCalledExactlyOnceWith()
      expect(nextMock).toHaveBeenCalledTimes(1)
    })

    it('should allow access when legal consent is valid', () => {
      const store = useLegalStore()
      store.legalConsent = {
        version: 1,
        accepted_at: new Date(),
        valid: true,
      }

      navigationGuard(createMockRoute('home'), createMockRoute('login'), nextMock)

      expect(nextMock).toHaveBeenCalledExactlyOnceWith()
      expect(nextMock).toHaveBeenCalledTimes(1)
    })

    it('should redirect to legal consent page when consent is invalid', async () => {
      // Set the mocked backendStore to authenticated
      mockBackendStore.setAuthenticated(true)

      const store = useLegalStore()
      store.legalConsent = {
        version: 1,
        accepted_at: new Date(),
        valid: false,
      }

      navigationGuard(createMockRoute('home'), createMockRoute('login'), nextMock)

      expect(nextMock).toHaveBeenCalledExactlyOnceWith({ name: 'legal-consent' })
      expect(nextMock).toHaveBeenCalledTimes(1)
    })

    it('should allow access to legal consent page even when consent is invalid', () => {
      const store = useLegalStore()
      store.legalConsent = {
        version: 1,
        accepted_at: new Date(),
        valid: false,
      }

      navigationGuard(createMockRoute('legal-consent'), createMockRoute('home'), nextMock)

      expect(nextMock).toHaveBeenCalledExactlyOnceWith()
      expect(nextMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('useLegalStore', () => {
    let store: ReturnType<typeof useLegalStore>

    beforeEach(() => {
      store = useLegalStore()
      store.legalEndpoint = 'api/legal'
    })

    describe('fetchLegalConsent', () => {
      it('should fetch legal consent successfully', async () => {
        const mockResponse = {
          version: 1,
          accepted_at: '2023-01-01T00:00:00.000Z',
          valid: true,
        }

        mockAxios
          .onGet(`${axiosInstance.defaults.baseURL}/api/legal/agreement/`)
          .reply(200, mockResponse)

        await store.fetchLegalConsent()

        expect(store.legalConsent).toEqual(mockResponse)
      })

      it('should handle API errors', async () => {
        mockAxios
          .onGet(`${axiosInstance.defaults.baseURL}/api/legal/agreement/`)
          .reply(500, { error: 'Server error' })

        await expect(store.fetchLegalConsent()).rejects.toThrow()
      })
    })

    describe('acceptLegalConsent', () => {
      it('should accept legal consent successfully', async () => {
        const mockResponse = {
          version: 1,
          accepted_at: '2023-01-01T00:00:00.000Z',
          valid: true,
        }

        mockAxios
          .onPatch(`${axiosInstance.defaults.baseURL}/api/legal/agreement/`)
          .reply(200, mockResponse)

        await store.acceptLegalConsent()

        expect(store.legalConsent).toEqual(mockResponse)
      })

      it('should handle API errors when accepting consent', async () => {
        mockAxios
          .onPatch(`${axiosInstance.defaults.baseURL}/api/legal/agreement/`)
          .reply(400, { error: 'Bad request' })

        await expect(store.acceptLegalConsent()).rejects.toThrow()
      })
    })

    describe('Store state', () => {
      it('should initialize with null legal consent', () => {
        const newStore = useLegalStore()
        expect(newStore.legalConsent).toBe(null)
      })

      it('should initialize with undefined legal endpoint', () => {
        // Create a completely fresh Pinia instance for this test
        const freshPinia = createPinia()
        setActivePinia(freshPinia)
        const freshStore = useLegalStore()
        expect(freshStore.legalEndpoint).toBe(undefined)
        // Restore the original Pinia instance
        setActivePinia(createPinia())
      })

      it('should update legal endpoint', () => {
        store.legalEndpoint = 'new/endpoint'
        expect(store.legalEndpoint).toBe('new/endpoint')
      })
    })
  })

  describe('Default Route Configurations', () => {
    it('should have correct default terms of use route', () => {
      expect(defaultTermsOfUseRoute).toEqual({
        path: '/terms-of-use',
        name: 'terms-of-use',
        component: expect.any(Function),
        props: { documentEndpoint: 'terms-of-use' },
      })
    })

    it('should have correct default privacy notice route', () => {
      expect(defaultPrivacyNoticeRoute).toEqual({
        path: '/privacy-notice',
        name: 'privacy-notice',
        component: expect.any(Function),
        props: { documentEndpoint: 'privacy-notice' },
      })
    })

    it('should have correct default legal consent route', () => {
      expect(defaultLegalConsentRoute).toEqual({
        path: '/legal-consent',
        name: 'legal-consent',
        component: expect.any(Function),
      })
    })
  })

  describe('Type Interfaces', () => {
    it('should have correct LegalConsent interface structure', () => {
      const legalConsent: LegalConsent = {
        version: 1,
        accepted_at: new Date(),
        valid: true,
      }

      expect(legalConsent).toHaveProperty('version')
      expect(legalConsent).toHaveProperty('accepted_at')
      expect(legalConsent).toHaveProperty('valid')
      expect(typeof legalConsent.version).toBe('number')
      expect(legalConsent.accepted_at).toBeInstanceOf(Date)
      expect(typeof legalConsent.valid).toBe('boolean')
    })

    it('should have correct LegalConsentOptions interface structure', () => {
      const options: LegalConsentOptions = {
        backendStore: mockBackendStore as BackendStore,
        router,
        path: 'api/legal',
      }

      expect(options).toHaveProperty('backendStore')
      expect(options).toHaveProperty('router')
      expect(options).toHaveProperty('path')
      expect(typeof options.path).toBe('string')
    })
  })
})
