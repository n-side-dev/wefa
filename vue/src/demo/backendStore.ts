import pinia from '@/demo/pinia'
import { useBackendStore, type BackendStore } from '@/stores'

const backendStore: BackendStore = useBackendStore(
  {
    authenticationType: 'TOKEN',
    endpoints: {
      token: {
        loginEndpoint: '/authentication/token-auth/',
      },
    },
  },
  pinia
) as unknown as BackendStore

export { backendStore }
