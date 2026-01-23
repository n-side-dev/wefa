import pinia from '@/demo/pinia'
import { configureBackendStore, useBackendStore, type BackendStore } from '@/stores'

const backendStoreOptions = {
  authenticationType: 'TOKEN',
}

configureBackendStore(backendStoreOptions)

const backendStore: BackendStore = useBackendStore(backendStoreOptions, pinia) as BackendStore

export { backendStore }
