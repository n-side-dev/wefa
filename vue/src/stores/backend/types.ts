import type { Ref } from 'vue'
import type { AxiosInstance, AxiosResponse } from 'axios'
import type { Router } from 'vue-router'

/**
 * Represents the types of authentication mechanisms that can be used.
 *
 * This type includes the following options:
 * - 'TOKEN': Authentication is performed using a token-based system.
 * - 'JWT': Authentication is performed using JSON Web Tokens.
 * - 'SESSION': Authentication is managed using session-based mechanisms (reserved, not yet implemented).
 * - 'OAUTH': Authentication is managed by a Backend-for-Frontend (BFF) using OAuth session cookies.
 *
 * Note: Future enhancement could include more flexible procedures registration
 * (postLogin, postLogout) to allow different actors to register their procedures
 * on some collection.
 */
export type AuthenticationType = 'TOKEN' | 'JWT' | 'SESSION' | 'OAUTH'

/**
 * Represents a set of credentials consisting of a username and password.
 * Typically used for authentication purposes.
 */
export interface Credentials {
  username: string
  password: string
}

/**
 * Endpoint configuration for OAuth session authentication.
 *
 * `redirectHandler` can be used by consuming apps to control the redirect side effect
 * (e.g. for tests, SPA-specific navigation, or analytics hooks).
 */
export interface OAuthEndpoints {
  loginEndpoint?: string
  logoutEndpoint?: string
  sessionEndpoint?: string
  redirectHandler?: (url: string) => void
}

/**
 * Endpoint configuration for token authentication.
 */
export interface TokenEndpoints {
  loginEndpoint?: string
}

/**
 * Endpoint configuration for JWT authentication.
 */
export interface JwtEndpoints {
  loginEndpoint?: string
  refreshEndpoint?: string
}

/**
 * Optional per-scheme endpoint overrides for authentication flows.
 */
export interface AuthenticationEndpoints {
  token?: TokenEndpoints
  jwt?: JwtEndpoints
  oauth?: OAuthEndpoints
}

/**
 * Contract for the backend store returned by `useBackendStore`.
 * Provides authentication state, auth actions, and optional router guard helpers.
 */
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

/**
 * Configuration passed to `useBackendStore`/`defineBackendStore`.
 * Controls the authentication scheme and any OAuth endpoint overrides.
 */
export interface BackendStoreOptions {
  authenticationType: AuthenticationType
  endpoints?: AuthenticationEndpoints
}
