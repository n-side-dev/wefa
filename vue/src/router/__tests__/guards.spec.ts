// Note: guards.ts currently hard-codes `isAuthenticated = true` /
// `isUnauthenticated = true` (tracked as SOFA-292). These tests lock in the
// current "never-redirect" behaviour; they need to be updated when the auth
// wiring lands.
import { describe, it, expect, vi } from 'vitest'
import type {
  RouteLocationNormalized,
  RouteLocationNormalizedLoaded,
  NavigationGuardNext,
} from 'vue-router'
import { requiresAuth, requiresUnauth, defaultRouteGuards } from '../guards'
import { libRouteRecords } from '../libRoutes'

/**
 * Build a minimal route whose `matched` entries carry the supplied meta shape.
 * @param meta Meta object attached to the single matched record.
 * @returns A RouteLocationNormalized suitable for guard invocation.
 */
function routeWithMeta(meta: Record<string, unknown>): RouteLocationNormalized {
  return {
    matched: [{ meta } as unknown as RouteLocationNormalized['matched'][number]],
  } as RouteLocationNormalized
}

const fromRoute = {} as RouteLocationNormalizedLoaded

describe('router/guards', () => {
  describe('requiresAuth', () => {
    it('does not call next with a redirect when authenticated (current stub)', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresAuth(routeWithMeta({ wefa: { requiresAuth: true } }), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })

    it('ignores routes without requiresAuth meta', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresAuth(routeWithMeta({}), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('requiresUnauth', () => {
    it('does not call next with a redirect when unauthenticated (current stub)', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresUnauth(routeWithMeta({ wefa: { requiresUnauth: true } }), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })

    it('ignores routes without requiresUnauth meta', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      requiresUnauth(routeWithMeta({}), fromRoute, next)
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('defaultRouteGuards', () => {
    it('runs both auth and unauth guards without throwing', () => {
      const next = vi.fn() as unknown as NavigationGuardNext
      expect(() =>
        defaultRouteGuards(
          routeWithMeta({ wefa: { requiresAuth: true, requiresUnauth: true } }),
          fromRoute,
          next
        )
      ).not.toThrow()
      expect(next).not.toHaveBeenCalled()
    })
  })
})

describe('router/libRoutes', () => {
  it('defines the login route with the expected shape', () => {
    const login = libRouteRecords.login
    expect(login.path).toBe('/auth/login')
    expect(login.name).toBe('authLogin')
    expect(login.meta?.wefa?.title).toBe('Login')
    expect(login.meta?.wefa?.icon).toBe('pi pi-sign-in')
    expect(login.props).toEqual({ gdpr: true })
    expect(typeof login.component).toBe('function')
  })

  it('defines the logout route with the expected shape', () => {
    const logout = libRouteRecords.logout
    expect(logout.path).toBe('/auth/logout')
    expect(logout.name).toBe('authLogout')
    expect(logout.meta?.wefa?.title).toBe('Logout')
    expect(logout.meta?.wefa?.icon).toBe('pi pi-sign-out')
    expect(typeof logout.component).toBe('function')
  })
})
