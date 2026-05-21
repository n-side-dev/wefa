import { getActivePinia, type Pinia } from 'pinia'
import type { BackendStore } from './types'

/**
 * Internal shape exposing the Pinia store cache. `_s` is not part of Pinia's
 * public type but is the stable, documented internal map used by libraries
 * that need to look up a store by id without rerunning its setup factory.
 */
type PiniaWithStores = Pinia & { _s: Map<string, BackendStore> }

/**
 * Resolves the singleton backend store registered under id `'backend'`.
 *
 * Pinia caches each store by id on the active instance; once
 * `useBackendStore(options)` has been called at app startup, this helper
 * lets composables and route guards reach the same store without
 * re-invoking the setup factory (which would otherwise need configuration).
 * @returns The active `BackendStore` instance.
 * @throws {Error} If no Pinia instance is active or the store has not been created yet.
 */
export function resolveBackendStore(): BackendStore {
  const pinia = getActivePinia()
  if (!pinia) {
    throw new Error(
      '[wefa] resolveBackendStore: no active Pinia instance. Install pinia on your app and create the backend store before calling this.'
    )
  }
  const store = (pinia as PiniaWithStores)._s.get('backend')
  if (!store) {
    throw new Error(
      '[wefa] resolveBackendStore: backend store not created. Call useBackendStore(options) at app startup.'
    )
  }
  return store
}
