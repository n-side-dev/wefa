import { ref, watch, type Ref } from 'vue'
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axiosInstance from '@/network/axios.ts'
import { createCommonAuthFunctions } from '../common.ts'
import { jwtAccessTokenKey, jwtRefreshTokenKey } from '../constants.ts'
import type { BackendStore, Credentials } from '../types.ts'

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
export function jwtAuthenticationBackendStoreSetup(): BackendStore {
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
