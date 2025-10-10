import { defineStore, type Pinia, type StoreDefinition } from 'pinia'
import { type Ref, ref, watch, type WatchHandle } from 'vue'
import type { AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosInstance } from 'axios'
import type { Router } from 'vue-router'
import axiosInstance from '@/network/axios'

/**
 * Represents the types of authentication mechanisms that can be used.
 *
 * This type includes the following options:
 * - 'TOKEN': Authentication is performed using a token-based system.
 * - 'JWT': Authentication is performed using JSON Web Tokens.
 * - 'SESSION': Authentication is managed using session-based mechanisms.
 *
 * Note: Future enhancement could include more flexible procedures registration
 * (postLogin, postLogout) to allow different actors to register their procedures
 * on some collection.
 */
export type AuthenticationType = 'TOKEN' | 'JWT' | 'SESSION'

/**
 * Represents a set of credentials consisting of a username and password.
 * Typically used for authentication purposes.
 */
export interface Credentials {
  username: string
  password: string
}

export interface BackendStore {
  authenticated: Ref<boolean>
  axiosInstance: AxiosInstance
  login: (credentials: Credentials) => Promise<AxiosResponse>
  logout: () => void
  setPostLogin: (fn: () => void) => void
  setPostLogout: (fn: () => void) => void
  setupAuthRouteGuard: (router: Router) => void
  unsetAuthRouteGuard: () => void
}

export interface BackendStoreOptions {
  authenticationType: AuthenticationType
}

/**
 * A constant variable used as the key for storing and retrieving the authentication token
 * in the browser's localStorage. This key is utilized to maintain user session or
 * authentication state across browser sessions by securely saving the token locally.
 */
const localStorageKey = 'authenticationToken'

/**
 * Constants used as keys for storing and retrieving JWT authentication tokens
 * in the browser's localStorage. These keys are utilized to maintain user session or
 * authentication state across browser sessions by securely saving the tokens locally.
 */
const jwtAccessTokenKey = 'jwtAccessToken'
const jwtRefreshTokenKey = 'jwtRefreshToken'

export const useBackendStore = (
  options: BackendStoreOptions,
  piniaInstance: Pinia | null = null
) => {
  return defineBackendStore(options)(piniaInstance)
}

export const defineBackendStore = (backendStoreOptions: BackendStoreOptions): StoreDefinition => {
  return defineStore('backend', () => getBackendStoreSetup(backendStoreOptions))
}

/**
 * Gets the appropriate backend store setup based on authentication type.
 * @param backendStoreOptions - Configuration options for the backend store
 * @returns The configured backend store instance
 */
function getBackendStoreSetup(backendStoreOptions: BackendStoreOptions): BackendStore {
  switch (backendStoreOptions.authenticationType) {
    case 'TOKEN':
      return tokenAuthenticationBackendStoreSetup()
    case 'JWT':
      return jwtAuthenticationBackendStoreSetup()
    default:
      throw new Error(`Unknown authentication type: ${backendStoreOptions.authenticationType}`)
  }
}

/**
 * Creates common authentication functions that can be shared between different authentication implementations.
 * @param authenticated - Reactive reference to the authentication state
 * @param postLogin - Reactive reference to the post-login callback
 * @param postLogout - Reactive reference to the post-logout callback
 * @returns An object containing common authentication functions
 */
function createCommonAuthFunctions(
  authenticated: Ref<boolean>,
  postLogin: Ref<() => void>,
  postLogout: Ref<() => void>
) {
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

/**
 * Configures and sets up a token-based authentication backend store for managing API authentication.
 *
 * The method initializes authentication states, such as tokens, login/logout handlers, and
 * authentication interceptors on the axiosInstance for requests and responses.
 * It also provides helper functions for handling authentication processes, like login, logout,
 * and post-login/logout callbacks. Additionally, it enables the setting of route guards to
 * respond to authentication status changes in a Vue.js application.
 * @returns An object containing authentication state, API client instance, and helper functions:
 * - `axiosInstance`: Pre-configured axios instance with authentication support
 * - `authenticated`: Reactive flag representing the authentication status
 * - `login`: Function to authenticate users using credentials
 * - `logout`: Function to deauthenticate users and clear authentication tokens
 * - `setPostLogin`: Method to set a callback function invoked after successful login
 * - `setPostLogout`: Method to set a callback function invoked after logout
 * - `setupAuthRouteGuard`: Function to set up route guard for managing authentication-driven route reevaluations
 */
function tokenAuthenticationBackendStoreSetup(): BackendStore {
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
    const response = await axiosInstance.post('/api/token-auth/', credentials)
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

/**
 * Configures and sets up a JWT-based authentication backend store for managing API authentication.
 *
 * The method initializes authentication states, such as access and refresh tokens, login/logout handlers, and
 * authentication interceptors on the axios instance for requests and responses.
 * It also provides helper functions for handling authentication processes, like login, logout,
 * and post-login/logout callbacks. Additionally, it enables the setting of route guards to
 * respond to authentication status changes in a Vue.js application.
 *
 * This implementation is designed to work with a Django backend using the "Simple JWT" library.
 * @returns An object containing authentication state, API client instance, and helper functions:
 * - `axiosInstance`: Pre-configured axios instance with authentication support
 * - `authenticated`: Reactive flag representing the authentication status
 * - `login`: Function to authenticate users using credentials
 * - `logout`: Function to deauthenticate users and clear authentication tokens
 * - `setPostLogin`: Method to set a callback function invoked after successful login
 * - `setPostLogout`: Method to set a callback function invoked after logout
 * - `setupAuthRouteGuard`: Function to set up route guard for managing authentication-driven route reevaluations
 */
function jwtAuthenticationBackendStoreSetup(): BackendStore {
  /**
   * A reactive variable that indicates whether a user is authenticated or not.
   *
   * The value is `false` by default, representing an unauthenticated state.
   * This variable can be updated dynamically to reflect the authentication status
   * of the user within the application.
   */
  const authenticated = ref(false)
  const _accessToken: Ref<string | null> = ref(null)
  const _refreshToken: Ref<string | null> = ref(null)
  const _postLogout: Ref<() => void> = ref(() => {})
  const _postLogin: Ref<() => void> = ref(() => {})
  const _accessTokenFromLocalStorage = localStorage.getItem(jwtAccessTokenKey)
  const _refreshTokenFromLocalStorage = localStorage.getItem(jwtRefreshTokenKey)
  const refreshUrl = '/api/token/refresh/'

  // Create common authentication functions
  const commonAuth = createCommonAuthFunctions(authenticated, _postLogin, _postLogout)

  if (_accessTokenFromLocalStorage && _refreshTokenFromLocalStorage) {
    _accessToken.value = _accessTokenFromLocalStorage
    _refreshToken.value = _refreshTokenFromLocalStorage
    authenticated.value = true
  }

  watch(_accessToken, () => {
    localStorage.setItem(jwtAccessTokenKey, _accessToken.value ?? '')
  })

  watch(_refreshToken, () => {
    localStorage.setItem(jwtRefreshTokenKey, _refreshToken.value ?? '')
  })

  axiosInstance.defaults.withCredentials = true
  axiosInstance.defaults.headers.common['Content-Type'] = 'application/json'

  axiosInstance.interceptors.request.use(
    async (config) => {
      if (authenticated.value && _accessToken.value) {
        config.headers['Authorization'] = `Bearer ${_accessToken.value}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  /**
   * Checks if the error is related to token authentication issues
   * @param error - The Axios error to check for token-related issues
   * @returns True if the error is related to token authentication, false otherwise
   */
  function isTokenError(error: AxiosError): boolean {
    return !!(
      error.response &&
      [401, 403].includes(error.response.status) &&
      ((error.response?.data as { code?: string })?.code === 'token_not_valid' ||
        !_accessToken.value ||
        !_refreshToken.value)
    )
  }

  /**
   * Attempts to refresh the JWT token and retry the original request
   * @param originalRequest - The original Axios request configuration to retry after token refresh
   * @returns A promise that resolves to the Axios response from the retried request
   */
  async function handleTokenRefresh(
    originalRequest: InternalAxiosRequestConfig
  ): Promise<AxiosResponse> {
    const response = await axiosInstance.post(refreshUrl, {
      refresh: _refreshToken.value,
    })

    if (response.status === 200) {
      // Update the tokens
      _accessToken.value = response.data.access
      if (response.data.refresh) {
        _refreshToken.value = response.data.refresh
      }

      // Retry the original request with the new token
      originalRequest.headers['Authorization'] = `Bearer ${_accessToken.value}`
      return axiosInstance(originalRequest)
    }
    throw new Error('Token refresh failed')
  }

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (!isTokenError(error)) {
        return Promise.reject(error)
      }

      const originalRequest = error.config
      const isRefreshRequest = originalRequest.url === refreshUrl

      // Prevent infinite loops
      if (!isRefreshRequest && _refreshToken.value) {
        try {
          return await handleTokenRefresh(originalRequest)
        } catch (refreshError) {
          logout()
          return Promise.reject(refreshError)
        }
      } else {
        logout()
      }

      return Promise.reject(error)
    }
  )

  /**
   * Authenticates a user by sending their credentials to the server.
   * @param credentials - The user's login credentials, typically including a username and password.
   * @returns A promise that resolves to the Axios response object returned from the authentication request.
   */
  async function login(credentials: Credentials): Promise<AxiosResponse> {
    const response = await axiosInstance.post('/api/token/', credentials)
    if (response.status === 200) {
      authenticated.value = true
      _accessToken.value = response.data.access
      _refreshToken.value = response.data.refresh
    }
    _postLogin.value()
    return response
  }

  /**
   * Logs the user out of the application by performing the following actions:
   * - Removes the user's authentication tokens from localStorage.
   * - Updates the application's authenticated state to false.
   * - Resets the stored authentication tokens to null.
   * - Executes any additional post-logout logic defined in the application.
   */
  function logout(): void {
    localStorage.removeItem(jwtAccessTokenKey)
    localStorage.removeItem(jwtRefreshTokenKey)
    authenticated.value = false
    _accessToken.value = null
    _refreshToken.value = null
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
