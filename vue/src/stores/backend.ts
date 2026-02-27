import { defineStore, type Pinia, type StoreDefinition } from 'pinia'
import type { BackendStore, BackendStoreOptions } from './backend/types'
import { jwtAuthenticationBackendStoreSetup } from './backend/schemes/jwt.ts'
import { oauthAuthenticationBackendStoreSetup } from './backend/schemes/oauth.ts'
import { tokenAuthenticationBackendStoreSetup } from './backend/schemes/token.ts'

export type {
  AuthenticationEndpoints,
  AuthenticationType,
  BackendStore,
  BackendStoreOptions,
  Credentials,
  JwtEndpoints,
  OAuthEndpoints,
  TokenEndpoints,
} from './backend/types'

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
      return tokenAuthenticationBackendStoreSetup(backendStoreOptions)
    case 'JWT':
      return jwtAuthenticationBackendStoreSetup(backendStoreOptions)
    case 'OAUTH':
      return oauthAuthenticationBackendStoreSetup(backendStoreOptions)
    case 'SESSION':
      throw new Error('SESSION authentication is not yet supported.')
    default:
      throw new Error(`Unknown authentication type: ${backendStoreOptions.authenticationType}`)
  }
}
