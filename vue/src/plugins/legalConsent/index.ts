import { type App, type Ref, ref } from 'vue'
import { type NavigationGuardNext, type Router, type RouteRecordRaw } from 'vue-router'
import type { BackendStore } from '@/stores'
import { defineStore } from 'pinia'
import { axiosInstance } from '@/network'

/**
 * Represents the legal consent status for a user
 */
export interface LegalConsent {
  /** Version number of the legal consent document */
  version: number
  /** Date when the consent was accepted (ISO string from API or Date object in app) */
  accepted_at: string | Date
  /** Whether the current consent is still valid */
  valid: boolean
}

/**
 * Configuration options for the legal consent plugin
 */
export interface LegalConsentOptions {
  /** Backend store instance for managing authentication state */
  backendStore: BackendStore
  /** Vue Router instance for route management */
  router: Router
  /** API endpoint path for legal consent operations */
  path: string
  /** Custom route configuration for terms of use page (optional) */
  termsOfUseRoute?: RouteRecordRaw
  /** Custom route configuration for privacy notice page (optional) */
  privacyNoticeRoute?: RouteRecordRaw
  /** Custom route configuration for legal consent page (optional) */
  legalConsentRoute?: RouteRecordRaw
}

/** Default route configuration for terms of use page */
export const defaultTermsOfUseRoute: RouteRecordRaw = {
  path: '/terms-of-use',
  name: 'terms-of-use',
  component: () => import('@/plugins/legalConsent/views/LegalDocument.vue'),
  props: { documentEndpoint: 'terms-of-use' },
}

/** Default route configuration for privacy notice page */
export const defaultPrivacyNoticeRoute: RouteRecordRaw = {
  path: '/privacy-notice',
  name: 'privacy-notice',
  component: () => import('@/plugins/legalConsent/views/LegalDocument.vue'),
  props: { documentEndpoint: 'privacy-notice' },
}

/** Default route configuration for legal consent page */
export const defaultLegalConsentRoute: RouteRecordRaw = {
  path: '/legal-consent',
  name: 'legal-consent',
  component: () => import('@/plugins/legalConsent/views/LegalConsent.vue'),
}

/**
 * Vue plugin for legal consent management
 *
 * This plugin provides comprehensive legal consent functionality, including:
 * - Route management for terms of use, privacy notice, and consent pages
 * - Navigation guards to enforce consent requirements
 * - Store integration for consent state management
 * - Automatic route registration and backend integration
 * @example
 * ```typescript
 * app.use(legalConsentPlugin, {
 *   backendStore: myBackendStore,
 *   router: myRouter,
 *   path: 'api/legal'
 * })
 * ```
 */
export const legalConsentPlugin = {
  /**
   * Installs the legal consent plugin
   * @param app - Vue application instance
   * @param options - Plugin configuration options
   */
  async install(app: App, options: LegalConsentOptions) {
    // Ensure plugin is initialized before Vue Router
    // if (app.config.globalProperties.$router) {
    //   throw new Error('Legal Consent must be initialized before Vue Router.')
    // }

    // Use provided routes or fall back to defaults
    const termsOfUseRoute = options.termsOfUseRoute || defaultTermsOfUseRoute
    const privacyNoticeRoute = options.privacyNoticeRoute || defaultPrivacyNoticeRoute
    const legalConsentRoute = options.legalConsentRoute || defaultLegalConsentRoute

    // Register all legal consent related routes
    options.router.addRoute(termsOfUseRoute)
    options.router.addRoute(privacyNoticeRoute)
    options.router.addRoute(legalConsentRoute)

    await options.router.isReady()

    // Initialize the Legal Consent store with endpoint configuration
    const legalStore = useLegalStore()
    legalStore.legalEndpoint = options.path

    const backendStore = options.backendStore

    // Set up a navigation guard to enforce legal consent requirements
    options.router.beforeEach((to, from, next: NavigationGuardNext) => {
      const isInfoPage = [termsOfUseRoute.name, privacyNoticeRoute.name].includes(to.name as string)
      const isConsentPage = to.name === legalConsentRoute.name
      const consent = legalStore.legalConsent
      const isAuthenticated = backendStore.authenticated

      // Always allow access to terms of use and privacy notice pages
      if (isInfoPage) {
        next()
        return
      }

      // No consent data available, allow navigation (will be handled by store watcher)
      if (!consent) {
        next()
        return
      }

      // If consent exists and is valid
      if (consent.valid) {
        // Prevent navigating to consent page when consent is already valid
        if (isConsentPage) {
          next(false)
          return
        }
        next()
        return
      }

      // Consent exists but is invalid: redirect to the consent page if authenticated
      if (!isConsentPage && isAuthenticated) {
        next({ name: legalConsentRoute.name })
        return
      }

      // Default allow
      next()
    })

    await legalStore.fetchLegalConsent()
    options.router.push({ path: options.router.currentRoute.value.path }).then(() => {})
  },
}

export default legalConsentPlugin

/**
 * Pinia store for managing legal consent state and operations
 *
 * This store handles:
 * - Storing current legal consent status
 * - Managing API endpoint configuration
 * - Fetching consent data from backend
 * - Accepting legal consent
 * - Watching for authentication changes to trigger consent fetching
 */
export const useLegalStore = defineStore('legalStore', () => {
  /** Current legal consent data */
  const legalConsent: Ref<LegalConsent | null> = ref(null)
  /** API endpoint path for legal consent operations */
  const legalEndpoint: Ref<string | undefined> = ref(undefined)

  /**
   * Fetches the current legal consent status from the backend
   * @throws {Error} When the API request fails
   */
  async function fetchLegalConsent() {
    const response = await axiosInstance.get(
      `${axiosInstance.defaults.baseURL!}/${legalEndpoint.value}/agreement/`
    )
    legalConsent.value = response.data as LegalConsent
  }

  /**
   * Accepts the legal consent by sending a PATCH request to the backend
   * @throws {Error} When the API request fails
   */
  async function acceptLegalConsent() {
    const response = await axiosInstance.patch(
      `${axiosInstance.defaults.baseURL!}/${legalEndpoint.value}/agreement/`
    )
    legalConsent.value = response.data as LegalConsent
  }

  return {
    legalEndpoint,
    legalConsent,
    fetchLegalConsent,
    acceptLegalConsent,
  }
})
