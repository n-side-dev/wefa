import pinia from '@/demo/pinia'
import { useBackendStore, type BackendStore } from '@/stores'

const backendStore: BackendStore = useBackendStore(
  {
    authenticationType: 'TOKEN',
  },
  pinia
) as unknown as BackendStore

export { backendStore }
