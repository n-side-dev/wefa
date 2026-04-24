import type { BackendStore } from '@/stores'
import type { LoginViewProps } from '@/views/LoginView.vue'
import type { LogoutViewProps } from '@/views/LogoutView.vue'
import type { WeFaRouteRecordRaw } from './types'

/**
 * Define common route records here
 * They will be forwarded and installed as defaults by the importing app router
 * Additionally, they are exposed to the importing app developer so it can be modified if needed
 * This could be the case if the user wants to replace the component with his own version, but keep the same metadata
 *
 * IMPORTANT: `LoginView` and `LogoutView` require a `backendStore` prop — the
 * static `libRouteRecords` export below cannot supply one, so spreading it
 * directly (`...Object.values(libRouteRecords)`) into a router will crash on
 * form submit / mount. Use `createLibRouteRecords({ backendStore })` below
 * for drop-in, ready-to-mount records, or read `.path` / `.name` / `.meta`
 * off `libRouteRecords` when you only need the route metadata.
 */

const login: WeFaRouteRecordRaw = {
  path: '/auth/login',
  name: 'authLogin',
  meta: {
    wefa: { title: 'Login', icon: 'pi pi-sign-in' },
  },
  component: () => import('@/views/LoginView.vue'),
  props: { gdpr: true },
}

const logout: WeFaRouteRecordRaw = {
  path: '/auth/logout',
  name: 'authLogout',
  meta: {
    wefa: { title: 'Logout', icon: 'pi pi-sign-out' },
  },
  component: () => import('@/views/LogoutView.vue'),
}

export const libRouteRecords: Record<'login' | 'logout', WeFaRouteRecordRaw> = {
  login: login,
  logout: logout,
}

/**
 * Options accepted by `createLibRouteRecords`.
 */
export interface CreateLibRouteRecordsOptions {
  /**
   * Backend store instance used by both `LoginView` and `LogoutView` to drive
   * authentication. Required — without it the views throw at runtime.
   */
  backendStore: BackendStore
  /**
   * Extra props merged on top of the library defaults before being passed to
   * `LoginView`. Use this to override `logoLight`, `logoDark`, `logoAlt`,
   * `defaultRedirect`, or `gdpr`.
   */
  loginProps?: Partial<Omit<LoginViewProps, 'backendStore'>>
  /**
   * Extra props merged on top of the library defaults before being passed to
   * `LogoutView`. Use this to override `redirectTo`.
   */
  logoutProps?: Partial<Omit<LogoutViewProps, 'backendStore'>>
}

/**
 * Build the library's default auth route records with `backendStore` (and any
 * consumer-supplied overrides) already bound as route `props`. This is the
 * safe entry point — spreading the returned object into a router works out of
 * the box:
 *
 * ```ts
 * const routes = [
 *   ...Object.values(createLibRouteRecords({ backendStore })),
 *   ...appRoutes,
 * ]
 * ```
 *
 * Metadata-only consumers (breadcrumbs, side nav, guards) should keep reading
 * `libRouteRecords.login.path` / `.name` / `.meta` — those stay stable.
 * @param options Factory options. `backendStore` is required.
 * @returns Record with `login` and `logout` route definitions whose `props`
 *   closure injects the store on every navigation.
 */
export function createLibRouteRecords(
  options: CreateLibRouteRecordsOptions
): Record<'login' | 'logout', WeFaRouteRecordRaw> {
  const { backendStore, loginProps, logoutProps } = options
  return {
    login: {
      path: login.path,
      name: login.name,
      meta: login.meta,
      component: login.component,
      props: () => ({ backendStore, gdpr: true, ...loginProps }),
    } as WeFaRouteRecordRaw,
    logout: {
      path: logout.path,
      name: logout.name,
      meta: logout.meta,
      component: logout.component,
      props: () => ({ backendStore, ...logoutProps }),
    } as WeFaRouteRecordRaw,
  }
}
