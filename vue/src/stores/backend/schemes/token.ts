import { ref, watch, type Ref } from 'vue'
import type { AxiosResponse } from 'axios'
import axiosInstance from '@/network/axios.ts'
import { createCommonAuthFunctions } from '../common.ts'
import { localStorageKey, tokenLoginEndpoint } from '../constants.ts'
import type { BackendStore, BackendStoreOptions, Credentials } from '../types.ts'

/**
 * Configures and sets up a token-based authentication backend store for managing API authentication.
 *
 * The method initializes authentication states, such as tokens, login/logout handlers, and
 * authentication interceptors on the axiosInstance for requests and responses.
 * It also provides helper functions for handling authentication processes, like login, logout,
 * and post-login/logout callbacks. Additionally, it enables the setting of route guards to
 * respond to authentication status changes in a Vue.js application.
 * @param backendStoreOptions
 * @returns An object containing authentication state, API client instance, and helper functions:
 * - `axiosInstance`: Pre-configured axios instance with authentication support
 * - `authenticated`: Reactive flag representing the authentication status
 * - `login`: Function to authenticate users using credentials
 * - `logout`: Function to deauthenticate users and clear authentication tokens
 * - `setPostLogin`: Method to set a callback function invoked after successful login
 * - `setPostLogout`: Method to set a callback function invoked after logout
 * - `setupAuthRouteGuard`: Function to set up route guard for managing authentication-driven route reevaluations
 */
export function tokenAuthenticationBackendStoreSetup(
  backendStoreOptions: BackendStoreOptions
): BackendStore {
  /**
   * A reactive variable that indicates whether a user is authenticated or not.
   *
   * The value is `false` by default, representing an unauthenticated state.
   * This variable can be updated dynamically to reflect the authentication status
   * of the user within the application.
   */
  const authenticated = ref(false)
  const _token: Ref<string | null> = ref(null)
  const _postLogout: Ref<() => void> = ref(() => {})
  const _postLogin: Ref<() => void> = ref(() => {})
  const _fromLocalStorage = localStorage.getItem(localStorageKey)
  const loginEndpoint = backendStoreOptions.endpoints?.token?.loginEndpoint ?? tokenLoginEndpoint

  // Create common authentication functions
  const commonAuth = createCommonAuthFunctions(authenticated, _postLogin, _postLogout)

  if (_fromLocalStorage) {
    _token.value = _fromLocalStorage
    authenticated.value = true
  }

  watch(_token, () => {
    localStorage.setItem(localStorageKey, _token.value ?? '')
  })

  axiosInstance.defaults.withCredentials = true
  axiosInstance.defaults.headers.common['Content-Type'] = 'application/json'

  axiosInstance.interceptors.request.use(
    async (config) => {
      if (authenticated.value && _token.value) {
        config.headers['Authorization'] = `Token ${_token.value}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response.status === 403) {
        const data = error.response.data
        if (data?.detail === 'Authentication credentials were not provided.') {
          logout()
        }
        return Promise.reject(error)
      } else {
        return Promise.reject(error)
      }
    }
  )

  /**
   * Authenticates a user by sending their credentials to the server.
   * @param credentials - The user's login credentials, typically including a username and password.
   * @returns A promise that resolves to the Axios response object returned from the authentication request.
   */
  async function login(credentials: Credentials): Promise<AxiosResponse> {
    const response = await axiosInstance.post(loginEndpoint, credentials)
    if (response.status === 200) {
      authenticated.value = true
      _token.value = response.data.token
    }
    _postLogin.value()
    return response
  }

  /**
   * Logs the user out of the application by performing the following actions:
   * - Removes the user's authentication token from localStorage.
   * - Updates the application's authenticated state to false.
   * - Resets the stored authentication token to null.
   * - Executes any additional post-logout logic defined in the application.
   */
  function logout(): void {
    localStorage.removeItem(localStorageKey)
    authenticated.value = false
    _token.value = null
    _postLogout.value()
  }

  return {
    axiosInstance,
    authenticated,
    login,
    logout,
    setPostLogin: commonAuth.setPostLogin,
    setPostLogout: commonAuth.setPostLogout,
    setupAuthRouteGuard: commonAuth.setupAuthRouteGuard,
    unsetAuthRouteGuard: commonAuth.unsetAuthRouteGuard,
  }
}
