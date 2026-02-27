import { ref, type Ref } from 'vue'
import type { AxiosResponse } from 'axios'
import axiosInstance from '@/network/axios.ts'
import { createCommonAuthFunctions } from '../common.ts'
import { oauthLoginEndpoint, oauthLogoutEndpoint, oauthSessionEndpoint } from '../constants.ts'
import type { BackendStore, BackendStoreOptions } from '../types.ts'

/**
 * Response shape returned by the BFF session endpoint.
 */
interface OAuthSessionStatus {
  session: boolean
}

/**
 * Response shape returned by the BFF login endpoint.
 */
interface OAuthLoginResponse {
  redirect?: string
}

/**
 * Configures and sets up an OAuth session-based authentication backend store.
 *
 * This implementation expects a BFF to manage OAuth login/logout flows and session cookies.
 * It checks session state on initialization, initiates login when no session exists, and
 * ensures axios requests include credentials.
 *
 * Consuming apps should call `useBackendStore` once at app startup, or ensure it is created
 * before route guards run, so session state is resolved early.
 * @param backendStoreOptions - Store configuration, including OAuth endpoint overrides and redirect handler.
 * @returns An object containing authentication state, API client instance, and helper functions:
 */
export function oauthAuthenticationBackendStoreSetup(
  backendStoreOptions: BackendStoreOptions
): BackendStore {
  const authenticated = ref(false)
  const _postLogout: Ref<() => void> = ref(() => {})
  const _postLogin: Ref<() => void> = ref(() => {})

  const commonAuth = createCommonAuthFunctions(authenticated, _postLogin, _postLogout)

  const oauthEndpoints = {
    login: backendStoreOptions.oauth?.loginEndpoint ?? oauthLoginEndpoint,
    logout: backendStoreOptions.oauth?.logoutEndpoint ?? oauthLogoutEndpoint,
    session: backendStoreOptions.oauth?.sessionEndpoint ?? oauthSessionEndpoint,
  }
  const redirectHandler =
    backendStoreOptions.oauth?.redirectHandler ??
    ((url: string) => {
      if (typeof window === 'undefined') {
        return
      }
      window.location.assign(url)
    })

  axiosInstance.defaults.withCredentials = true
  axiosInstance.defaults.headers.common['Content-Type'] = 'application/json'

  initializeAuthenticationStore().catch((error) => {
    console.debug(error)
  })

  /**
   * Initializes the OAuth store by checking session state and triggering login if no session exists.
   * This is invoked once during store creation to prime `authenticated` early in app startup.
   */
  async function initializeAuthenticationStore(): Promise<void> {
    const sessionStatus = await checkSessionStatus()
    authenticated.value = sessionStatus.session

    if (!sessionStatus.session) {
      await initiateOauthSession()
    }
  }

  /**
   * Calls the BFF session endpoint to determine whether a valid session exists.
   * On failure, it forces an unauthenticated state and returns `{ session: false }`.
   * @returns Session status payload from the BFF.
   */
  async function checkSessionStatus(): Promise<OAuthSessionStatus> {
    return axiosInstance
      .get(oauthEndpoints.session, { withCredentials: true })
      .then((response) => response.data as OAuthSessionStatus)
      .catch((error) => {
        console.debug(error)
        authenticated.value = false
        return { session: false }
      })
  }

  /**
   * Initiates the OAuth login flow via the BFF login endpoint.
   * Expects a JSON payload containing a `redirect` URL and navigates to it.
   * Runs the post-login callback after a redirect URL is received.
   * @returns Axios response from the login endpoint for chaining/testing.
   */
  async function initiateOauthSession(): Promise<AxiosResponse> {
    const response = await axiosInstance.get(oauthEndpoints.login, { withCredentials: true })
    const redirect = (response.data as OAuthLoginResponse | undefined)?.redirect
    if (redirect) {
      redirectHandler(redirect)
      _postLogin.value()
    } else {
      authenticated.value = false
    }
    return response
  }

  /**
   * Starts the OAuth login flow. Credentials are ignored because the BFF handles login.
   * @returns Axios response from the login endpoint for chaining/testing.
   */
  async function login(): Promise<AxiosResponse> {
    return await initiateOauthSession()
  }

  /**
   * Logs out via the BFF logout endpoint and clears local authentication state.
   * Post-logout callbacks are executed after the request completes (success or failure).
   */
  function logout(): void {
    authenticated.value = false
    axiosInstance
      .get(oauthEndpoints.logout, { withCredentials: true })
      .catch((error) => console.debug(error))
      .finally(() => _postLogout.value())
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
