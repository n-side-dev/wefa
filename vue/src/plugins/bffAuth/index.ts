import { type App } from 'vue'
import { type Router, type RouteLocationNormalized } from 'vue-router'
import type { BackendStore } from '@/stores'

export interface BffAuthOptions {
  backendStore: BackendStore
  router: Router
  checkOnInstall?: boolean
  guardRoutes?: boolean
  requiresAuth?: (to: RouteLocationNormalized) => boolean
}

export const bffAuthPlugin = {
  async install(app: App, options: BffAuthOptions) {
    const backendStore = options.backendStore
    const router = options.router

    if (backendStore.authenticationType !== 'BFF') {
      return
    }

    const requiresAuth =
      options.requiresAuth ??
      ((to: RouteLocationNormalized) => to.matched.some((record) => record.meta.requiresAuth))

    let inFlight: Promise<boolean> | null = null

    async function ensureAuthenticated(): Promise<boolean> {
      if (inFlight) {
        return inFlight
      }
      inFlight = (async () => {
        const hasSession = await backendStore.checkSession()
        if (!hasSession) {
          const storeAutoLogin =
            backendStore.bffOptions?.flow?.sessionExpiredRedirectToLogin ?? true
          if (!storeAutoLogin) {
            await backendStore.login()
          }
        }
        return hasSession
      })()
      try {
        return await inFlight
      } finally {
        inFlight = null
      }
    }

    if (options.guardRoutes ?? true) {
      router.beforeEach(async (to) => {
        if (!requiresAuth(to)) {
          return true
        }
        if (backendStore.authenticated) {
          return true
        }
        await ensureAuthenticated()
        return false
      })
    }

    if (options.checkOnInstall ?? true) {
      await router.isReady()
      await ensureAuthenticated()
      router.push({ path: router.currentRoute.value.path }).catch(() => {})
    }
  },
}

export default bffAuthPlugin
