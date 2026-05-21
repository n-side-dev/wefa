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

// Seed permissions after a successful login so the demo can showcase
// `<Can>` and `usePermission`. Real apps would fetch these from their `/me`
// endpoint (or decode JWT claims) inside this callback.
backendStore.setPostLogin(() => {
  backendStore.setPermissions(['demo.read', 'demo.write'])
})

export { backendStore }
