import type { WeFaRouteRecordRaw } from './types'

/**
 * Define common route records here
 * They will be forwarded and installed as defaults by the importing app router
 * Additionally, they are exposed to the importing app developer so it can be modified if needed
 * This could be the case if the user wants to replace the component with his own version, but keep the same metadata
 */

const login: WeFaRouteRecordRaw = {
  path: '/auth/login',
  name: 'authLogin',
  meta: { title: 'Login', icon: 'pi pi-sign-in' },
  component: () => import('@/views/LoginView.vue'),
  props: { gdpr: true },
}

const logout: WeFaRouteRecordRaw = {
  path: '/auth/logout',
  name: 'authLogout',
  meta: { title: 'Logout', icon: 'pi pi-sign-out' },
  component: () => import('@/views/LogoutView.vue'),
}

export const libRouteRecords: Record<'login' | 'logout', WeFaRouteRecordRaw> = {
  login: login,
  logout: logout,
}
