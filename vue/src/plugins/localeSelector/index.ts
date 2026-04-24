import {
  type App,
  type Ref,
  ref,
  shallowRef,
  type ShallowRef,
  unref,
  type WritableComputedRef,
} from 'vue'
import { defineStore } from 'pinia'
import type { I18n } from 'vue-i18n'
import type { BackendStore } from '@/stores'
import { axiosInstance } from '@/network'
import { resolveBrowserLocale } from '@/locales'
import LocaleSelector from './views/LocaleSelector.vue'

type I18nLocale = WritableComputedRef<string, string>

export { LocaleSelector }

/**
 * Shape of the response returned by `GET /locale/user/` on the backend.
 */
export interface UserLocale {
  /** Preferred locale code for the current user, or `null` if not set. */
  code: string | null
}

/**
 * Shape of the response returned by `GET /locale/available/` on the backend.
 */
export interface AvailableLocales {
  /** Locales supported by the backend. */
  available: string[]
  /** Default locale code used when no preference is known. */
  default: string
}

/**
 * Configuration options for the locale selector plugin.
 */
export interface LocaleSelectorOptions {
  /** Backend store instance, used for its axios client and auth callbacks. */
  backendStore: BackendStore
  /** vue-i18n instance (e.g. created via `createLibI18n`). The plugin writes to `i18n.global.locale` when the resolved locale changes. */
  i18n: I18n
  /** API endpoint base for locale operations. Defaults to `'locale'`. */
  endpoint?: string
  /** Prefix used when reading/writing the preferred locale in localStorage. Defaults to `'wefa.locale'`. */
  storageKeyPrefix?: string
  /** Last-resort locale used if none of the resolution steps produced a value. Defaults to `'en'`. */
  fallbackLocale?: string
}

const DEFAULT_ENDPOINT = 'locale'
const DEFAULT_STORAGE_KEY_PREFIX = 'wefa.locale'
const DEFAULT_FALLBACK_LOCALE = 'en'

/**
 * Vue plugin that manages the active locale across backend, localStorage, and browser.
 *
 * Resolution priority (highest first):
 *   1. Backend `GET /{endpoint}/user/` when authenticated and the returned code
 *      is one of the available locales.
 *   2. `localStorage[{storageKeyPrefix}:<userScope>]` where `userScope` is
 *      `'guest'` for anonymous visitors.
 *   3. Browser locale (via `resolveBrowserLocale`).
 *   4. Backend default (`GET /{endpoint}/available/`) or `fallbackLocale`.
 *
 * The plugin also registers a global `LocaleSelector` component.
 * @example
 * ```ts
 * app.use(localeSelectorPlugin, {
 *   backendStore,
 *   i18n,
 *   endpoint: 'locale',
 * })
 * ```
 */
export const localeSelectorPlugin = {
  async install(app: App, options: LocaleSelectorOptions) {
    const store = useLocaleStore()
    store.configure(options)

    app.component('LocaleSelector', LocaleSelector)

    options.backendStore.setPostLogin(() => {
      store.resolve().catch(() => {})
    })
    options.backendStore.setPostLogout(() => {
      store.resolve().catch(() => {})
    })

    await store.fetchAvailable()
    await store.resolve()
  },
}

export default localeSelectorPlugin

/**
 * Pinia store that owns the active locale and its resolution logic.
 */
export const useLocaleStore = defineStore('wefaLocale', () => {
  const backendStore: ShallowRef<BackendStore | null> = shallowRef(null)
  const i18n: ShallowRef<I18n | null> = shallowRef(null)
  const endpoint: Ref<string> = ref(DEFAULT_ENDPOINT)
  const storageKeyPrefix: Ref<string> = ref(DEFAULT_STORAGE_KEY_PREFIX)
  const fallbackLocale: Ref<string> = ref(DEFAULT_FALLBACK_LOCALE)

  const locale: Ref<string> = ref(DEFAULT_FALLBACK_LOCALE)
  const availableLocales: Ref<string[]> = ref([])
  const defaultLocale: Ref<string> = ref(DEFAULT_FALLBACK_LOCALE)

  /**
   * Apply plugin options to the store. Called once during plugin install.
   * @param options Plugin options provided to `app.use(localeSelectorPlugin, ...)`.
   */
  function configure(options: LocaleSelectorOptions): void {
    backendStore.value = options.backendStore
    i18n.value = options.i18n
    endpoint.value = options.endpoint ?? DEFAULT_ENDPOINT
    storageKeyPrefix.value = options.storageKeyPrefix ?? DEFAULT_STORAGE_KEY_PREFIX
    fallbackLocale.value = options.fallbackLocale ?? DEFAULT_FALLBACK_LOCALE
    locale.value = fallbackLocale.value
    defaultLocale.value = fallbackLocale.value
  }

  /**
   * Fetch the list of locales supported by the backend. Safe to call before login.
   */
  async function fetchAvailable(): Promise<void> {
    const response = await axiosInstance.get<AvailableLocales>(`${endpoint.value}/available/`)
    availableLocales.value = response.data.available
    defaultLocale.value = response.data.default
  }

  /**
   * Compute the storage key used for the current authentication state.
   * Authenticated users share a single `'user'` scope; guests share a `'guest'`
   * scope. Apps that need true per-user scoping can override
   * `storageKeyPrefix` with an app-generated suffix.
   * @returns The fully qualified localStorage key for the active scope.
   */
  function storageKey(): string {
    // Pinia setup stores auto-unwrap returned refs, so `backendStore.authenticated`
    // is a plain boolean on the real store. `unref()` handles both cases.
    const authenticated = backendStore.value
      ? Boolean(unref(backendStore.value.authenticated))
      : false
    const scope = authenticated ? 'user' : 'guest'
    return `${storageKeyPrefix.value}:${scope}`
  }

  /**
   * Read the persisted locale for the current scope, if any.
   * @returns The stored locale code, or `null` when nothing is stored.
   */
  function readStoredLocale(): string | null {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(storageKey())
  }

  /**
   * Persist a locale code into localStorage for the current scope.
   * @param code Locale code to persist.
   */
  function writeStoredLocale(code: string): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(storageKey(), code)
  }

  /**
   * Narrow a candidate code to one that is known to be supported.
   * @param code Candidate locale code, possibly null/undefined.
   * @returns `true` when the code is a non-empty string included in `availableLocales`.
   */
  function isSupported(code: string | null | undefined): code is string {
    if (!code) return false
    return availableLocales.value.length === 0 || availableLocales.value.includes(code)
  }

  /**
   * Fetch the authenticated user's preferred locale from the backend.
   * Swallows errors so the resolution chain can fall through to the next step.
   * @returns The stored code for the user, or `null` if unauthenticated or absent.
   */
  async function fetchBackendLocale(): Promise<string | null> {
    if (!backendStore.value || !unref(backendStore.value.authenticated)) return null
    try {
      const response = await axiosInstance.get<UserLocale>(`${endpoint.value}/user/`)
      return response.data.code ?? null
    } catch {
      return null
    }
  }

  /**
   * Apply a locale locally: update the store, localStorage, and the i18n instance.
   * Does not call the backend — use `setLocale` for that.
   * @param code Locale code to activate.
   */
  function applyLocale(code: string): void {
    locale.value = code
    writeStoredLocale(code)
    if (i18n.value) {
      // vue-i18n composition mode exposes `locale` as a WritableComputedRef.
      ;(i18n.value.global.locale as I18nLocale).value = code
    }
  }

  /**
   * Run the resolution chain and apply the winning locale.
   *
   * Priority: backend (authenticated) → localStorage → browser → default.
   */
  async function resolve(): Promise<void> {
    const backendValue = await fetchBackendLocale()
    if (isSupported(backendValue)) {
      applyLocale(backendValue)
      return
    }

    const stored = readStoredLocale()
    if (isSupported(stored)) {
      applyLocale(stored)
      return
    }

    const browser = resolveBrowserLocale(availableLocales.value)
    if (isSupported(browser)) {
      applyLocale(browser)
      return
    }

    applyLocale(defaultLocale.value || fallbackLocale.value)
  }

  /**
   * Change the active locale. Validates against `availableLocales`, updates
   * localStorage and the i18n instance, and — when authenticated — persists
   * the choice on the backend.
   * @param code The locale code to activate.
   * @throws {Error} When `code` is not in `availableLocales`.
   */
  async function setLocale(code: string): Promise<void> {
    if (!isSupported(code)) {
      throw new Error(
        `[wefa] Unsupported locale '${code}'. Expected one of: ${availableLocales.value.join(', ')}.`
      )
    }

    applyLocale(code)

    if (backendStore.value && unref(backendStore.value.authenticated)) {
      try {
        await axiosInstance.patch<UserLocale>(`${endpoint.value}/user/`, { code })
      } catch (error) {
        // Local state is the source of truth for the current session; a
        // backend failure should not revert the user's selection. We log so
        // consumers can detect persistent errors.
        console.error('[wefa] Failed to persist locale to backend:', error)
      }
    }
  }

  return {
    locale,
    availableLocales,
    defaultLocale,
    configure,
    fetchAvailable,
    resolve,
    setLocale,
  }
})
