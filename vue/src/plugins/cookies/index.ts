import { type App, type Ref, ref, createVNode, render } from 'vue'
import { defineStore } from 'pinia'
import CookiesConsent from './views/CookiesConsent.vue'
import CookieBar from './views/CookieBar.vue'

const wefaCookiesLocalStorageKey = 'wefaCookies'
const wefaCookiesDigestLocalStorageKey = 'wefaCookiesDigest'

type CookieType = 'Essential' | 'Performance' | 'Analytics' | 'Advertising'

// Represents a cookie configuration
export interface CookieConfiguration {
  type: CookieType
  key: string
  name: string
  description: string
}

export interface CookiesPluginOptions {
  cookies: CookieConfiguration[]
}

// Represents the cookie consent state that will be stored in the local storage
export interface CookieConsent {
  key: string
  consent: string
}

// Represents a Cookie for logical manipulation
// Matching between CookieConsent and CookieConfiguration based on the key
export interface Cookie {
  configuration: CookieConfiguration
  consent: boolean
}

export const cookiesPlugin = {
  install(app: App, options: CookiesPluginOptions) {
    const cookiesStore = useCookiesStore()
    cookiesStore.initialize(options.cookies)

    setupCookieConsentDialog(app)
    setupCookieBar(app)
  },
}

export const useCookiesStore = defineStore('cookiesStore', () => {
  const reviewNeeded: Ref<boolean> = ref(false)
  const toggleDialog: Ref<boolean> = ref(false)
  const cookies: Ref<Cookie[]> = ref<Cookie[]>([])

  /**
   * Initialize the cookie store with the provided cookie configurations and load preferences from localStorage
   * @param cookieConfigurations The array of CookieConfiguration objects to initialize the store with.
   */
  function initialize(cookieConfigurations: CookieConfiguration[]) {
    // Compute the digest from the given cookie configurations
    const setupDigest = cookiesDigest(cookieConfigurations)

    // Load the digest from the localStorage if any
    const storedDigest = localStorage.getItem(wefaCookiesDigestLocalStorageKey)

    // Load Cookies from the localStorage and map with the cookie configuration
    let storedCookies: CookieConsent[] = []
    storedCookies = JSON.parse(
      localStorage.getItem(wefaCookiesLocalStorageKey) || '[]'
    ) as CookieConsent[]

    cookies.value = cookieConfigurations.map((cookie) => {
      const storedCookie = storedCookies.find((stored) => stored.key === cookie.key)
      const consent = storedCookie ? storedCookie.consent : cookie.type === 'Essential'
      return {
        configuration: cookie,
        consent: consent,
      } as Cookie
    })

    // Check the digest of the cookie configuration and the one stored in local storage
    // Trigger the cookie review if none in storage or if a difference is found
    if (storedDigest) {
      if (storedDigest != setupDigest) {
        reviewNeeded.value = true
      }
    } else {
      reviewNeeded.value = true
    }
  }

  /**
   * Trigger the display of the Cookie Consent dialog
   */
  function showDialog() {
    toggleDialog.value = true
  }

  /**
   * Save the digest of the cookie configuration to local storage
   * @param cookieConfigurations The array of CookieConfiguration objects to compute the digest for.
   */
  function saveDigest(cookieConfigurations: CookieConfiguration[]) {
    const setupDigest = cookiesDigest(cookieConfigurations)
    localStorage.setItem(wefaCookiesDigestLocalStorageKey, setupDigest)
    reviewNeeded.value = false
  }

  /**
   * Accept all non-essential cookies and save preferences
   */
  function acceptAllCookies() {
    // Update all non-essential cookies to accepted
    cookies.value.forEach((cookie) => {
      if (cookie.configuration.type !== 'Essential') {
        cookie.consent = true
      }
    })

    // Save preferences
    saveCookiePreferences()
  }

  /**
   * Reject all non-essential cookies and save preferences
   */
  function rejectAllCookies() {
    // Update all non-essential cookies to rejected
    cookies.value.forEach((cookie) => {
      if (cookie.configuration.type !== 'Essential') {
        cookie.consent = false
      }
    })

    // Save preferences
    saveCookiePreferences()
  }

  /**
   * Save current cookie preferences to localStorage and update digest
   */
  function saveCookiePreferences() {
    // Save to localStorage
    const storedCookies = cookies.value.map((c) => ({
      key: c.configuration.key,
      consent: c.consent,
    }))
    localStorage.setItem(wefaCookiesLocalStorageKey, JSON.stringify(storedCookies))

    // Save the current digest to prevent dialog from showing again
    const currentConfigs = cookies.value.map((c) => c.configuration)
    saveDigest(currentConfigs)
    toggleDialog.value = false
  }

  return {
    initialize,
    reviewNeeded,
    cookies,
    showDialog,
    acceptAllCookies,
    rejectAllCookies,
    saveCookiePreferences,
    toggleDialog,
  }
})

/**
 * Computes the digest of the CookieConfiguration.
 * This custom hash function is used because Crypto requires an HTTPS environment, which is not always available.
 * @param cookies The array of CookieConfiguration objects to compute the digest for.
 * @returns A string representing the digest of the CookieConfiguration array.
 */
function cookiesDigest(cookies: CookieConfiguration[]) {
  const cookiesString = cookies
    .map((cookie) => `${cookie.type}:${cookie.key}:${cookie.name}:${cookie.description}`)
    .sort((a, b) => a.localeCompare(b)) // Sort to ensure consistent ordering using locale-aware comparison
    .join('|')

  let hash = 0
  if (cookiesString.length === 0) return hash.toString()

  for (let i = 0; i < cookiesString.length; i++) {
    const char = cookiesString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16) // Return as a hexadecimal string
}

/**
 * Set up the CookiesConsent component and render it to the DOM through a virtual node
 * @param app The main Vue App instance
 */
function setupCookieConsentDialog(app: App) {
  // Create a container element for the CookiesConsent dialog component
  const consentContainer = document.createElement('div')
  consentContainer.id = 'cookies-consent-container'
  document.body.appendChild(consentContainer)

  // Create a vnode for the CookiesConsent component
  const consentVnode = createVNode(CookiesConsent)

  // Provide the app context to ensure the component has access to Pinia stores and other plugins
  consentVnode.appContext = app._context

  // Render the CookiesConsent component to the DOM
  render(consentVnode, consentContainer)
}

/**
 * Set up the CookieBar component and render it to the DOM through a virtual node
 * @param app The main Vue App instance
 */
function setupCookieBar(app: App) {
  // Create a container element for the CookieBar component
  const barContainer = document.createElement('div')
  barContainer.id = 'cookie-bar-container'
  document.body.appendChild(barContainer)

  // Create a vnode for the CookieBar component
  const barVnode = createVNode(CookieBar)

  // Provide the app context to ensure the component has access to Pinia stores and other plugins
  barVnode.appContext = app._context

  // Render the CookieBar component to the DOM
  render(barVnode, barContainer)
}
