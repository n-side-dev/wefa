import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createApp, ref, type App, type Ref } from 'vue'
import MockAdapter from 'axios-mock-adapter'
import type { I18n } from 'vue-i18n'
import type { BackendStore } from '@/stores'
import { axiosInstance } from '@/network'
import { localeSelectorPlugin, useLocaleStore, type LocaleSelectorOptions } from '../index'

interface TestI18n {
  global: { locale: Ref<string> }
}

interface MockBackendStore extends BackendStore {
  setAuthenticated: (value: boolean) => void
}

/**
 * Build a minimal mock BackendStore that satisfies the interface used by the
 * plugin (authenticated ref, axios instance, post-login/post-logout setters).
 * The shared singleton `axiosInstance` is used as the HTTP client — tests
 * install a MockAdapter on it to intercept requests.
 * @returns A mock BackendStore with an extra `setAuthenticated` helper.
 */
function createMockBackendStore(): MockBackendStore {
  const store = {
    authenticated: ref(false),
    axiosInstance,
    login: vi.fn().mockResolvedValue({}),
    logout: vi.fn(),
    setPostLogin: vi.fn(),
    setPostLogout: vi.fn(),
    setupAuthRouteGuard: vi.fn(),
    unsetAuthRouteGuard: vi.fn(),
    setAuthenticated(value: boolean) {
      store.authenticated.value = value
    },
  }
  return store as unknown as MockBackendStore
}

/**
 * Build a minimal mock vue-i18n instance exposing only the writable
 * `global.locale` ref that the plugin touches.
 * @param initial Initial locale value.
 * @returns A test i18n mock.
 */
function createMockI18n(initial: string = 'en'): TestI18n {
  const locale = ref(initial)
  return {
    global: {
      locale,
    },
  }
}

describe('localeSelectorPlugin', () => {
  let app: App
  let mockAdapter: MockAdapter
  let mockBackendStore: MockBackendStore
  let mockI18n: TestI18n

  /**
   * Install the plugin with the current mocks, casting the test i18n to the
   * full `I18n` type since we only implement the subset the plugin uses.
   * @param overrides Optional option overrides merged on top of the defaults.
   * @returns Promise that resolves when installation completes.
   */
  async function installPlugin(overrides: Partial<LocaleSelectorOptions> = {}): Promise<void> {
    const options: LocaleSelectorOptions = {
      backendStore: mockBackendStore,
      i18n: mockI18n as unknown as I18n,
      ...overrides,
    }
    await localeSelectorPlugin.install(app, options)
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    app = createApp({})
    mockAdapter = new MockAdapter(axiosInstance)
    mockBackendStore = createMockBackendStore()
    mockI18n = createMockI18n('en')
    localStorage.clear()

    mockAdapter
      .onGet('locale/available/')
      .reply(200, { available: ['en', 'fr', 'nl'], default: 'en' })
  })

  afterEach(() => {
    mockAdapter.restore()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('installation', () => {
    it('installs successfully with minimal options', async () => {
      await expect(installPlugin()).resolves.toBeUndefined()
    })

    it('registers a global LocaleSelector component', async () => {
      const componentSpy = vi.spyOn(app, 'component')

      await installPlugin()

      expect(componentSpy).toHaveBeenCalledWith('LocaleSelector', expect.any(Object))
    })

    it('registers setPostLogin and setPostLogout callbacks', async () => {
      await installPlugin()

      expect(mockBackendStore.setPostLogin).toHaveBeenCalledTimes(1)
      expect(mockBackendStore.setPostLogout).toHaveBeenCalledTimes(1)
    })

    it('populates availableLocales from the backend', async () => {
      await installPlugin()

      const store = useLocaleStore()
      expect(store.availableLocales).toEqual(['en', 'fr', 'nl'])
      expect(store.defaultLocale).toBe('en')
    })
  })

  describe('resolution priority', () => {
    it('uses the backend value when authenticated', async () => {
      mockBackendStore.setAuthenticated(true)
      mockAdapter.onGet('locale/user/').reply(200, { code: 'fr' })

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('fr')
      expect(mockI18n.global.locale.value).toBe('fr')
    })

    it('falls back to localStorage when backend code is null', async () => {
      mockBackendStore.setAuthenticated(true)
      mockAdapter.onGet('locale/user/').reply(200, { code: null })
      localStorage.setItem('wefa.locale:user', 'nl')

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('nl')
      expect(mockI18n.global.locale.value).toBe('nl')
    })

    it('uses a guest-scoped localStorage key when unauthenticated', async () => {
      localStorage.setItem('wefa.locale:guest', 'fr')

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('fr')
    })

    it('falls back to the browser locale when nothing else is available', async () => {
      vi.stubGlobal('navigator', { languages: ['nl-NL'], language: 'nl-NL' })

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('nl')
    })

    it('falls back to the default locale when browser detection fails', async () => {
      vi.stubGlobal('navigator', { languages: ['xx-YY'], language: 'xx-YY' })

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('en')
    })

    it('ignores an unsupported backend code and falls through', async () => {
      mockBackendStore.setAuthenticated(true)
      mockAdapter.onGet('locale/user/').reply(200, { code: 'es' })
      localStorage.setItem('wefa.locale:user', 'fr')

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('fr')
    })

    it('swallows backend errors and falls through to localStorage', async () => {
      mockBackendStore.setAuthenticated(true)
      mockAdapter.onGet('locale/user/').reply(500)
      localStorage.setItem('wefa.locale:user', 'fr')

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('fr')
    })
  })

  describe('setLocale', () => {
    beforeEach(async () => {
      await installPlugin()
    })

    it('rejects unsupported locales', async () => {
      const store = useLocaleStore()
      await expect(store.setLocale('es')).rejects.toThrow(/Unsupported locale/)
    })

    it('updates i18n and localStorage without PATCHing when unauthenticated', async () => {
      const store = useLocaleStore()
      const patchSpy = vi.fn()
      mockAdapter.onPatch('locale/user/').reply((config) => {
        patchSpy(config)
        return [200, { code: 'fr' }]
      })

      await store.setLocale('fr')

      expect(store.locale).toBe('fr')
      expect(mockI18n.global.locale.value).toBe('fr')
      expect(localStorage.getItem('wefa.locale:guest')).toBe('fr')
      expect(patchSpy).not.toHaveBeenCalled()
    })

    it('PATCHes the backend when authenticated', async () => {
      mockBackendStore.setAuthenticated(true)
      const store = useLocaleStore()
      const patchSpy = vi.fn()
      mockAdapter.onPatch('locale/user/').reply((config) => {
        patchSpy(JSON.parse(config.data))
        return [200, { code: 'fr' }]
      })

      await store.setLocale('fr')

      expect(patchSpy).toHaveBeenCalledWith({ code: 'fr' })
      expect(localStorage.getItem('wefa.locale:user')).toBe('fr')
    })

    it('keeps local state even if the backend PATCH fails', async () => {
      mockBackendStore.setAuthenticated(true)
      const store = useLocaleStore()
      mockAdapter.onPatch('locale/user/').reply(500)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      await store.setLocale('fr')

      expect(store.locale).toBe('fr')
      expect(mockI18n.global.locale.value).toBe('fr')
      expect(errorSpy).toHaveBeenCalled()
    })
  })

  describe('auth state changes', () => {
    it('re-resolves on login via the registered callback', async () => {
      mockAdapter.onGet('locale/user/').reply(200, { code: 'fr' })

      await installPlugin()

      const store = useLocaleStore()
      expect(store.locale).toBe('en')

      // Simulate login: the callback registered during install is invoked.
      const postLoginArgs = (mockBackendStore.setPostLogin as ReturnType<typeof vi.fn>).mock
        .calls[0]
      expect(postLoginArgs).toBeDefined()
      const postLogin = postLoginArgs![0] as () => void

      mockBackendStore.setAuthenticated(true)
      postLogin()
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(store.locale).toBe('fr')
    })
  })
})
