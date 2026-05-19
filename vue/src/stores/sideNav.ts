import { ref, type Ref, watch } from 'vue'
import { defineStore } from 'pinia'

/**
 * Store for handling the side navigation collapsed/expanded state.
 * The user preference is persisted to localStorage so the choice survives reloads.
 */
export const useSideNavStore = defineStore('wefaSideNav', () => {
  /**
   * The key used to save the preference to localStorage
   */
  const localStorageKey_: Ref<string> = ref('side-nav-collapsed-wefa')

  /**
   * Whether the side navigation is currently collapsed (icons-only rail).
   * Defaults to `false` (expanded) so existing users see no change until they opt in.
   */
  const collapsed: Ref<boolean> = ref(false)

  /**
   * Defines the key used to store the collapsed state for your app.
   * Recommended: side-nav-collapsed-<my-project-name>
   * Reads the saved value (if any) and applies it immediately.
   * @param localStorageKey string used to store/access the localStorage entry
   */
  function setLocalStorageKey(localStorageKey: string) {
    localStorageKey_.value = localStorageKey

    const saved = localStorage.getItem(localStorageKey)
    if (saved === 'true') {
      collapsed.value = true
    } else if (saved === 'false') {
      collapsed.value = false
    }
  }

  /**
   * Explicitly set the collapsed state.
   * @param value true to collapse, false to expand
   */
  function setCollapsed(value: boolean) {
    collapsed.value = value
  }

  /**
   * Flip between collapsed and expanded.
   */
  function toggle() {
    collapsed.value = !collapsed.value
  }

  watch(collapsed, () => {
    localStorage.setItem(localStorageKey_.value, String(collapsed.value))
  })

  return { collapsed, toggle, setCollapsed, setLocalStorageKey }
})
