import { watch, type Ref, type WatchHandle } from 'vue'
import type { Router } from 'vue-router'

export interface CommonAuthFunctions {
  setPostLogin: (fn: () => void) => void
  setPostLogout: (fn: () => void) => void
  setupAuthRouteGuard: (router: Router) => void
  unsetAuthRouteGuard: () => void
  authRouteGuardWatcher?: WatchHandle | null
}

/**
 * Creates common authentication functions that can be shared between different authentication implementations.
 * @param authenticated - Reactive reference to the authentication state
 * @param postLogin - Reactive reference to the post-login callback
 * @param postLogout - Reactive reference to the post-logout callback
 * @returns An object containing common authentication functions
 */
export function createCommonAuthFunctions(
  authenticated: Ref<boolean>,
  postLogin: Ref<() => void>,
  postLogout: Ref<() => void>
): CommonAuthFunctions {
  let authRouteGuardWatcher: WatchHandle | null = null

  /**
   * Sets the function to be executed after login.
   * @param fn - A callback function to execute post-login.
   */
  function setPostLogin(fn: () => void): void {
    postLogin.value = fn
  }

  /**
   * Sets the postLogout function to be called after a logout action.
   * @param fn - A function to be executed post-logout.
   */
  function setPostLogout(fn: () => void): void {
    postLogout.value = fn
  }

  /**
   * Sets up a route guard that responds to authentication status changes
   *
   * This function should be installed in the root component (App.vue) setup script to ensure
   * proper route reevaluation when authentication status changes. It forces the router to
   * reevaluate the current route, allowing navigation guards to run again and potentially
   * redirect the user based on the new authentication state.
   * @param router - Vue Router instance
   * @example
   * // In App.vue setup script, given you have a router setup
   * import router from '@/router'
   * import { useBackendStore } from '@/stores/backend'
   *
   * const backendStore = useBackendStore()
   *
   * // Set up auth route guard to respond to authentication changes
   * backendStore.setupAuthRouteGuard(router)
   */
  function setupAuthRouteGuard(router: Router) {
    authRouteGuardWatcher = watch(authenticated, (value, oldValue) => {
      if (value != oldValue) {
        // Force a reevaluation of the current route, so router guards apply
        router.push({ path: router.currentRoute.value.path, force: true }).then(() => {})
      }
    })
  }

  /**
   * Removes the authentication route guard previously set up by `setupAuthRouteGuard`.
   *
   * This function cleans up the navigation guard registered with the Vue Router instance,
   * preventing any authentication-related redirects. It's useful when you need to
   * disable authentication checks, such as during application teardown or when switching
   * authentication strategies.
   * @see setupAuthRouteGuard - The corresponding function that sets up the route guard.
   */
  function unsetAuthRouteGuard(): void {
    if (authRouteGuardWatcher) authRouteGuardWatcher()
  }

  return {
    setPostLogin,
    setPostLogout,
    setupAuthRouteGuard,
    unsetAuthRouteGuard,
    authRouteGuardWatcher,
  }
}
