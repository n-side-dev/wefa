import { ref, type Ref, watch } from 'vue'
import { defineStore } from 'pinia'

/**
 * Store for handling dark mode configuration
 * This relies on PrimeVue dark mode configurator
 * 3 options are available : 'system', 'light', or 'dark'
 * The user preference is persisted to localStorage
 */
export const useDarkModeStore = defineStore('wefaDarkMode', () => {
  /**
   * The CSS class that activates dark mode on the root element.
   * It should match the one define for Primevue options.darkModeSelector WITHOUT the leading dot
   * Default: `'app-dark-mode'`
   */
  const darkModeSelector_: Ref<string> = ref('app-dark-mode')

  /**
   * Defines the CSS class that activates dark mode on the root element.
   * It should match the one define for Primevue options.darkModeSelector WITHOUT the leading dot
   * Default: `'app-dark-mode'`
   * @param darkModeSelector the configured Primevue options.darkModeSelector WITHOUT the leading dot
   */
  function setDarkModeSelector(darkModeSelector: string) {
    darkModeSelector_.value = darkModeSelector
  }

  /**
   * The key used to save the preference to LocalStorage
   */
  const localStorageKey_: Ref<string> = ref('dark-mode-wefa')

  /**
   * Defines the key to be used to store/access dark mode for your app
   * This will store user preferences on their browser
   * Recommended : dark-mode-<my-project-name>
   * @param localStorageKey string used to store/access the localStorage
   */
  function setLocalStorageKey(localStorageKey: string) {
    localStorageKey_.value = localStorageKey

    const saved = localStorage.getItem(localStorageKey)

    if (saved === 'light') {
      setLightMode()
    } else if (saved === 'dark') {
      setDarkMode()
    } else {
      setSystemMode()
    }
  }

  // This tracks system mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')

  /**
   * Currently applied mode
   */
  const mode: Ref<'system' | 'light' | 'dark'> = ref('system')

  /**
   * Set light mode manually
   */
  function setLightMode() {
    mode.value = 'light'
    document.documentElement.classList.remove(darkModeSelector_.value)
  }

  /**
   * Set dark mode manually
   */
  function setDarkMode() {
    mode.value = 'dark'
    document.documentElement.classList.add(darkModeSelector_.value)
  }

  /**
   * Reset to browser/system default
   */
  function setSystemMode() {
    mode.value = 'system'
    refreshSystemMode()
  }

  /**
   * Check to reapply system mode
   */
  function refreshSystemMode() {
    if (mode.value !== 'system') {
      return
    }

    if (prefersDark.matches) {
      document.documentElement.classList.add(darkModeSelector_.value)
    } else {
      document.documentElement.classList.remove(darkModeSelector_.value)
    }
  }

  // Refresh system mode on changes
  prefersDark.addEventListener('change', () => {
    refreshSystemMode()
  })

  /**
   * Watch for changes to `mode` and apply them
   */
  watch(mode, () => {
    // Save to localStorage
    localStorage.setItem(localStorageKey_.value, mode.value)

    // Apply change
    if (mode.value === 'light') {
      document.documentElement.classList.remove(darkModeSelector_.value)
    } else if (mode.value === 'dark') {
      document.documentElement.classList.add(darkModeSelector_.value)
    } else {
      refreshSystemMode()
    }
  })

  return { mode, setLightMode, setDarkMode, setSystemMode, setDarkModeSelector, setLocalStorageKey }
})
