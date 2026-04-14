import type {
  RouteLocationNormalized,
  NavigationGuardNext,
  RouteLocationRaw,
  RouteLocationNormalizedLoaded,
} from 'vue-router'
import { libRouteRecords } from './libRoutes'

/**
 * Checks that users are authenticated before navigating to routes with meta.wefa.requiresAuth
 * If the check fails, users are redirected to the route specified in redirect
 * This is useful if you want to prevent users from accessing your app if they're not authenticated
 * @param to RouteLocationNormalized, pass as-is from router.beforeEach
 * @param from RouteLocationNormalizedLoaded, pass as-is from router.beforeEach
 * @param next NavigationGuardNext, pass as-is from router.beforeEach
 * @param redirect RouteLocationRaw to be used if guard check fails, default is {name: libRouteRecords.login.name}
 */
export function requiresAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext,
  redirect: RouteLocationRaw = { name: libRouteRecords.login?.name || 'authLogin' }
) {
  // Tracked in SOFA-292: wire this guard to the authStore once it exists.
  const isAuthenticated = true

  const requiresAuth = to.matched.some((record) => record.meta.wefa?.requiresAuth === true)
  if (requiresAuth) {
    if (!isAuthenticated) {
      next(redirect) // User is not authenticated, redirect
    }
  }
}

/**
 * Checks that users are unauthenticated before navigating to routes with meta.wefa.requiresUnauth
 * If the check fails, users are redirected to the route specified in redirect
 * This is useful e.g if you want your users to skip the login page if they're already logged in
 * @param to RouteLocationNormalized, pass as-is from router.beforeEach
 * @param from RouteLocationNormalizedLoaded, pass as-is from router.beforeEach
 * @param next NavigationGuardNext, pass as-is from router.beforeEach
 * @param redirect RouteLocationRaw to be used if guard check fails, default is {path: '/'}
 */
export function requiresUnauth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext,
  redirect: RouteLocationRaw = { path: '/' }
) {
  // Tracked in SOFA-292: wire this guard to the authStore once it exists.
  const isUnauthenticated = true

  const requiresUnauth = to.matched.some((record) => record.meta.wefa?.requiresUnauth === true)
  if (requiresUnauth) {
    if (!isUnauthenticated) {
      next(redirect) // User is not unauthenticated, redirect
    }
  }
}

/**
 * Runs the default route guards provided by the lib
 * @param to RouteLocationNormalized
 * @param from RouteLocationNormalizedLoaded
 * @param next NavigationGuardNext
 */
export function defaultRouteGuards(
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded,
  next: NavigationGuardNext
) {
  // Auth guards
  requiresAuth(to, from, next)
  requiresUnauth(to, from, next)
}
